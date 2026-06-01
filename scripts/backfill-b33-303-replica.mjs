import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')

function loadEnvFile(name) {
  const file = resolve(root, name)
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL / POSTGRES_URL.')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeItems(value) {
  return normalizeArray(value)
}

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)))
}

function item(id, labelZh, labelEn, sortOrder, extra = {}) {
  return { id, label_zh: labelZh, label_en: labelEn, is_visible: true, sort_order: sortOrder, ...extra }
}

function mergeItems(existing, defaults) {
  const current = normalizeItems(existing)
  const ids = new Set(current.map((row) => row?.id).filter(Boolean))
  const additions = defaults.filter((row) => row?.id && !ids.has(row.id))
  return { items: [...current, ...additions], additions }
}

function mergeSpecRows(existing, defaults) {
  const current = normalizeArray(existing)
  const keys = new Set(current.map((row) => String(row?.label ?? '').trim().toLowerCase()).filter(Boolean))
  const additions = defaults.filter((row) => !keys.has(String(row.label ?? '').trim().toLowerCase()))
  return { rows: [...current, ...additions], additions }
}

function mergeDetailModules(existing, module) {
  const current = normalizeArray(existing)
  if (current.some((row) => row?.id === module.id)) return { modules: current, added: false }
  return { modules: [...current, module].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)), added: true }
}

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function patchPageModuleItems(client, pageKey, moduleKey, patcher, changes) {
  const res = await client.query(
    'SELECT id, items FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1',
    [pageKey, moduleKey],
  )
  if (res.rowCount === 0) return
  let changed = false
  const nextItems = normalizeItems(res.rows[0].items).map((entry) => {
    const result = patcher(entry)
    if (result.changed) changed = true
    return result.item
  })
  if (!changed) return
  changes.push(`${pageKey}:${moduleKey} patched`)
  if (apply) {
    await client.query(
      'UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1',
      [res.rows[0].id, JSON.stringify(nextItems)],
    )
  }
}

async function upsertPageModule(client, module, changes) {
  const res = await client.query(
    `SELECT id, title_zh, title_en, description_zh, description_en, items, is_visible, sort_order
     FROM page_modules
     WHERE page_key = $1 AND module_key = $2
     LIMIT 1`,
    [module.page_key, module.module_key],
  )

  if (res.rowCount === 0) {
    changes.push(`${module.page_key}:${module.module_key} insert`)
    if (apply) {
      await client.query(
        `INSERT INTO page_modules (
           id, page_key, module_key, module_type, title_zh, title_en,
           description_zh, description_en, items, is_visible, sort_order
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
        [
          module.id,
          module.page_key,
          module.module_key,
          module.module_type,
          module.title_zh,
          module.title_en,
          module.description_zh,
          module.description_en,
          JSON.stringify(module.items),
          module.is_visible,
          module.sort_order,
        ],
      )
    }
    return
  }

  const row = res.rows[0]
  const { items, additions } = mergeItems(row.items, module.items)
  const textChanged = ['title_zh', 'title_en', 'description_zh', 'description_en'].some((key) => (
    String(row[key] ?? '') !== String(module[key] ?? '')
  ))
  const visibilityChanged = Boolean(row.is_visible) !== Boolean(module.is_visible)
  const sortChanged = Number(row.sort_order ?? 0) !== Number(module.sort_order ?? 0)
  if (additions.length === 0 && !textChanged && !visibilityChanged && !sortChanged) return

  changes.push(`${module.page_key}:${module.module_key} ${[
    additions.length ? `add ${additions.map((entry) => entry.id).join(', ')}` : '',
    textChanged ? 'refresh labels' : '',
    visibilityChanged ? 'visibility' : '',
    sortChanged ? 'sort' : '',
  ].filter(Boolean).join('; ')}`)

  if (apply) {
    await client.query(
      `UPDATE page_modules
       SET title_zh = $3,
           title_en = $4,
           description_zh = $5,
           description_en = $6,
           items = $7::jsonb,
           is_visible = $8,
           sort_order = $9,
           updated_at = NOW()
       WHERE page_key = $1 AND module_key = $2`,
      [
        module.page_key,
        module.module_key,
        module.title_zh,
        module.title_en,
        module.description_zh,
        module.description_en,
        JSON.stringify(items),
        module.is_visible,
        module.sort_order,
      ],
    )
  }
}

async function patchHomeHero(client, changes) {
  const patches = new Map([
    ['hero-tagline', {
      label_zh: '预制度假舱 / 模块化旅居单元',
      label_en: 'Prefab Resort Cabins / Modular Hospitality Units',
    }],
    ['hero-headline', {
      label_zh: '面向全球度假与旅居项目的整装模块化舱体',
      label_en: 'Fully-Assembled Modular Cabins for Global Hospitality Projects',
    }],
    ['hero-subtitle', {
      label_zh: '了解 VESSEL E7、V9、E6、E3 产品系列，适配度假营地、酒店民宿、商业展示与公共服务项目。',
      label_en: 'Explore VESSEL E7, V9, E6 and E3 product families for resorts, glamping sites, commercial showrooms and public facilities.',
    }],
    ['hero-primary-cta', { href: '/products' }],
    ['hero-secondary-cta', { href: '/contact?source=home:hero_contact' }],
  ])

  await patchPageModuleItems(client, 'home', 'hero', (entry) => {
    if (!entry || typeof entry !== 'object') return { item: entry, changed: false }
    const patch = patches.get(entry.id)
    if (!patch) return { item: entry, changed: false }
    const next = { ...entry, ...patch }
    return { item: next, changed: JSON.stringify(next) !== JSON.stringify(entry) }
  }, changes)
}

const caseDetailLabels = {
  id: 'cases:detail-labels',
  page_key: 'cases',
  module_key: 'detail-labels',
  module_type: 'fixed-content',
  title_zh: '案例详情字段标签',
  title_en: 'Case detail field labels',
  description_zh: '案例详情页商业证明字段标签。前台只渲染已发布标签。',
  description_en: 'Field labels for case commercial proof. The frontend only renders published labels.',
  items: [
    item('fact-location', '地点', 'Location', 10),
    item('fact-type', '项目类型', 'Project Type', 20),
    item('fact-area', '项目面积', 'Project Area', 30),
    item('fact-investment', '投资规模', 'Investment', 40),
    item('fact-units', '采购数量', 'Units', 50),
    item('fact-products', '采购型号', 'Products Used', 60),
  ],
  is_visible: true,
  sort_order: 18,
}

const productSamples = [
  {
    id: 'e7-gen6-flagship',
    image: '/images/products/e7-gen6-flagship.jpg',
    gallery: ['/images/products/E7-Gen6_photo-01.jpg', '/images/products/E7-Gen6_render-01.jpg'],
    specsEn: [
      { label: 'Documentation', value: 'Product images, floor plan, specification sheet and configuration notes are available for buyer review.' },
      { label: 'Transport Planning', value: 'Confirm packing, loading and destination-side logistics by project country and model quantity.' },
      { label: 'Site Preparation', value: 'Confirm foundation, utilities and local compliance requirements before delivery planning.' },
    ],
    specsCn: [
      { label: '资料包', value: '产品图片、平面图、规格表和配置说明可供采购评估。' },
      { label: '运输规划', value: '按项目国家、型号和数量确认包装、装车与目的地物流方案。' },
      { label: '场地准备', value: '交付规划前需确认基础、水电和当地合规要求。' },
    ],
  },
  {
    id: 'v9-gen6-standard',
    image: '/images/products/v9-gen6-standard.jpg',
    gallery: ['/images/products/V9-Gen6_photo-01.jpg', '/images/products/V9-Gen6_render-01.jpg', '/images/products/v9-custom-japan.jpg'],
    specsEn: [
      { label: 'Documentation', value: 'Product images, model specification and layout references are available for buyer review.' },
      { label: 'Configuration Review', value: 'Confirm interior layout, utility standard and destination requirements before quotation.' },
      { label: 'Site Preparation', value: 'Confirm foundation, utilities and installation interface with the project engineer.' },
    ],
    specsCn: [
      { label: '资料包', value: '产品图片、型号规格和布局参考可供采购评估。' },
      { label: '配置复核', value: '报价前确认室内布局、水电标准和目的地要求。' },
      { label: '场地准备', value: '与项目工程师确认基础、水电和安装接口。' },
    ],
  },
  {
    id: 'e6-gen6-standard',
    image: '/images/products/e6-gen6-standard.jpg',
    gallery: ['/images/products/E6-Gen6_photo-01.jpg', '/images/products/E6-Gen6_render-01.jpg'],
    specsEn: [
      { label: 'Documentation', value: 'Product images, specification sheet and configuration notes are available for buyer review.' },
      { label: 'Deployment Planning', value: 'Review model quantity, destination logistics and utility conditions before quotation.' },
      { label: 'Site Preparation', value: 'Confirm site foundation, utility interface and local requirements before delivery.' },
    ],
    specsCn: [
      { label: '资料包', value: '产品图片、规格表和配置说明可供采购评估。' },
      { label: '部署规划', value: '报价前复核型号数量、目的地物流和水电条件。' },
      { label: '场地准备', value: '交付前确认场地基础、水电接口和当地要求。' },
    ],
  },
  {
    id: 'e3-gen6-standard',
    image: '/images/products/e3-gen6-standard.jpg',
    gallery: ['/images/products/E3-Gen6_photo-01.jpg', '/images/products/E3-Gen6_render-01.jpg'],
    specsEn: [
      { label: 'Documentation', value: 'Product images, compact layout references and configuration notes are available for buyer review.' },
      { label: 'Use Case Review', value: 'Confirm guest capacity, site type and deployment quantity before quotation.' },
      { label: 'Site Preparation', value: 'Confirm foundation, utilities and destination-side constraints before delivery planning.' },
    ],
    specsCn: [
      { label: '资料包', value: '产品图片、紧凑布局参考和配置说明可供采购评估。' },
      { label: '场景复核', value: '报价前确认入住容量、场地类型和部署数量。' },
      { label: '场地准备', value: '交付规划前确认基础、水电和目的地限制。' },
    ],
  },
]

function procurementModule(product) {
  return {
    id: 'b33-procurement-resources',
    type: 'content',
    title_cn: '采购资料',
    title_en: 'Procurement Resources',
    body_cn: '资料入口由产品后台维护，用于采购评估、型号沟通和项目询价。',
    body_en: 'Resources are maintained in the product console for buyer review, model discussion and project inquiry.',
    items_cn: [
      { title: '产品图片参考', href: product.image, body: '打开当前型号的公开产品图。' },
      { title: '规格表 / 平面图申请', href: '/media-kit', body: '申请最新规格表、平面图、配置说明和案例照片。' },
    ],
    items_en: [
      { title: 'Product image reference', href: product.image, body: 'Open the published model image.' },
      { title: 'Spec sheet / floor plan request', href: '/media-kit', body: 'Request the latest specification sheet, floor plan, configuration notes and case photos.' },
    ],
    image_url: product.image,
    images: product.gallery,
    is_visible: true,
    sort_order: 90,
  }
}

async function patchProductResources(client, changes) {
  for (const product of productSamples) {
    const res = await client.query(
      `SELECT id, gallery, specs_cn, specs_en, detail_modules
       FROM product_catalog
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [product.id],
    )
    if (res.rowCount === 0) continue

    const row = res.rows[0]
    const gallery = unique([...(normalizeArray(row.gallery)), product.image, ...product.gallery])
    const specsEn = mergeSpecRows(row.specs_en, product.specsEn)
    const specsCn = mergeSpecRows(row.specs_cn, product.specsCn)
    const detailModules = mergeDetailModules(row.detail_modules, procurementModule(product))
    const changed = [
      gallery.length !== normalizeArray(row.gallery).length,
      specsEn.additions.length > 0,
      specsCn.additions.length > 0,
      detailModules.added,
    ].some(Boolean)
    if (!changed) continue

    changes.push(`product:${product.id} add B33 procurement resources`)
    if (apply) {
      await client.query(
        `UPDATE product_catalog
         SET gallery = $2::jsonb,
             specs_cn = $3::jsonb,
             specs_en = $4::jsonb,
             detail_modules = $5::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [
          product.id,
          JSON.stringify(gallery),
          JSON.stringify(specsCn.rows),
          JSON.stringify(specsEn.rows),
          JSON.stringify(detailModules.modules),
        ],
      )
    }
  }
}

const mediaResources = [
  {
    slug: 'vessel-brand-mark',
    titleZh: 'VESSEL 品牌标识',
    titleEn: 'VESSEL Brand Mark',
    summaryZh: '用于媒体报道和合作伙伴资料的品牌标识文件。',
    summaryEn: 'Brand mark file for media coverage and partner reference.',
    fileUrl: '/favicon.svg',
    ctaLabelZh: '打开品牌标识',
    ctaLabelEn: 'Open brand mark',
    sortOrder: 8,
  },
  {
    slug: 'e7-product-image-reference',
    titleZh: 'E7 Gen6 产品图片',
    titleEn: 'E7 Gen6 Product Image Reference',
    summaryZh: '用于采购评估、产品沟通和资料准备的 E7 公开产品图片。',
    summaryEn: 'Published E7 product image for buyer review, product discussion and material preparation.',
    fileUrl: '/images/products/e7-gen6-flagship.jpg',
    ctaLabelZh: '打开产品图片',
    ctaLabelEn: 'Open product image',
    sortOrder: 12,
  },
  {
    slug: 'v9-product-image-reference',
    titleZh: 'V9 Gen6 产品图片',
    titleEn: 'V9 Gen6 Product Image Reference',
    summaryZh: '用于采购评估、产品沟通和资料准备的 V9 公开产品图片。',
    summaryEn: 'Published V9 product image for buyer review, product discussion and material preparation.',
    fileUrl: '/images/products/v9-gen6-standard.jpg',
    ctaLabelZh: '打开产品图片',
    ctaLabelEn: 'Open product image',
    sortOrder: 14,
  },
  {
    slug: 'astrobase-mamison-case-photo',
    titleZh: 'AstroBase Mamison 案例照片',
    titleEn: 'AstroBase Mamison Case Photo',
    summaryZh: '用于项目参考和客户沟通的公开案例照片。',
    summaryEn: 'Published case photo for project reference and customer discussion.',
    fileUrl: '/images/projects/astrobase-mamison/exterior-02.jpg',
    ctaLabelZh: '打开案例照片',
    ctaLabelEn: 'Open case photo',
    sortOrder: 18,
  },
  {
    slug: 'factory-capability-photo',
    titleZh: '工厂能力照片',
    titleEn: 'Factory Capability Photo',
    summaryZh: '用于了解生产和交付能力的公开工厂照片。',
    summaryEn: 'Published factory photo for production and delivery capability review.',
    fileUrl: '/images/about/optimized/about_factory-01.jpg',
    ctaLabelZh: '打开工厂照片',
    ctaLabelEn: 'Open factory photo',
    sortOrder: 22,
  },
]

async function upsertMediaResources(client, changes) {
  if (!(await tableExists(client, 'public.site_content_items'))) return

  for (const resource of mediaResources) {
    const res = await client.query(
      `SELECT id, title_zh, title_en, summary_zh, summary_en, file_url, cta_label_zh, cta_label_en, cta_href, status, sort_order
       FROM site_content_items
       WHERE kind = 'media_file' AND slug = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [resource.slug],
    )

    if (res.rowCount === 0) {
      changes.push(`media_file:${resource.slug} insert`)
      if (apply) {
        await client.query(
          `INSERT INTO site_content_items (
             kind, slug, title_zh, title_en, summary_zh, summary_en,
             file_url, cta_label_zh, cta_label_en, cta_href, payload, status, sort_order, published_at
           ) VALUES (
             'media_file', $1, $2, $3, $4, $5,
             $6, $7, $8, NULL, '{}'::jsonb, 'published', $9, NOW()
           )`,
          [
            resource.slug,
            resource.titleZh,
            resource.titleEn,
            resource.summaryZh,
            resource.summaryEn,
            resource.fileUrl,
            resource.ctaLabelZh,
            resource.ctaLabelEn,
            resource.sortOrder,
          ],
        )
      }
      continue
    }

    const row = res.rows[0]
    const updates = {
      title_zh: row.title_zh || resource.titleZh,
      title_en: row.title_en || resource.titleEn,
      summary_zh: row.summary_zh || resource.summaryZh,
      summary_en: row.summary_en || resource.summaryEn,
      file_url: row.file_url || resource.fileUrl,
      cta_label_zh: row.cta_label_zh || resource.ctaLabelZh,
      cta_label_en: row.cta_label_en || resource.ctaLabelEn,
      cta_href: '',
      status: row.status === 'published' ? row.status : 'published',
      sort_order: Number(row.sort_order ?? 0) || resource.sortOrder,
    }
    const changed = Object.entries(updates).some(([key, value]) => String(row[key] ?? '') !== String(value ?? ''))
    if (!changed) continue

    changes.push(`media_file:${resource.slug} publish resource`)
    if (apply) {
      await client.query(
        `UPDATE site_content_items
         SET title_zh = $2,
             title_en = $3,
             summary_zh = $4,
             summary_en = $5,
             file_url = $6,
             cta_label_zh = $7,
             cta_label_en = $8,
             cta_href = NULL,
             status = $9,
             sort_order = $10,
             published_at = CASE WHEN published_at IS NULL THEN NOW() ELSE published_at END,
             updated_at = NOW()
         WHERE id = $1`,
        [
          row.id,
          updates.title_zh,
          updates.title_en,
          updates.summary_zh,
          updates.summary_en,
          updates.file_url,
          updates.cta_label_zh,
          updates.cta_label_en,
          updates.status,
          updates.sort_order,
        ],
      )
    }
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []

  try {
    await client.query('BEGIN')
    await patchHomeHero(client, changes)
    await upsertPageModule(client, caseDetailLabels, changes)
    await patchProductResources(client, changes)
    await upsertMediaResources(client, changes)

    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B33 303 replica backfill applied.' : 'B33 303 replica backfill dry-run.')
  if (changes.length === 0) console.log('No B33 changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  if (err instanceof Error) console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  else console.error(err)
  process.exit(1)
})
