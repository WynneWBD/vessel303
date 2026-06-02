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

function normalizeObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)))
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
  }
  return value
}

function stableJson(value) {
  return JSON.stringify(canonicalize(value))
}

function item(id, labelZh, labelEn, sortOrder, extra = {}) {
  return { id, label_zh: labelZh, label_en: labelEn, is_visible: true, sort_order: sortOrder, ...extra }
}

function mergeItems(existing, defaults) {
  const current = normalizeArray(existing)
  const byId = new Map(current.map((row) => [row?.id, row]).filter(([id]) => Boolean(id)))
  for (const entry of defaults) {
    if (!entry?.id) continue
    byId.set(entry.id, { ...(byId.get(entry.id) ?? {}), ...entry })
  }
  return [...byId.values()].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
}

function mergeSpecRows(existing, defaults) {
  const current = normalizeArray(existing)
  const keys = new Set(current.map((row) => String(row?.label ?? '').trim().toLowerCase()).filter(Boolean))
  const additions = defaults.filter((row) => !keys.has(String(row.label ?? '').trim().toLowerCase()))
  return { rows: [...current, ...additions], additions }
}

function mergeDetailModules(existing, defaults) {
  let modules = normalizeArray(existing)
  const changes = []
  for (const detailModule of defaults) {
    if (!detailModule?.id) continue
    const index = modules.findIndex((row) => row?.id === detailModule.id)
    if (index >= 0) {
      const next = { ...modules[index], ...detailModule }
      if (stableJson(modules[index]) !== stableJson(next)) {
        modules[index] = next
        changes.push(`${detailModule.id}:refresh`)
      }
    } else {
      modules = [...modules, detailModule]
      changes.push(`${detailModule.id}:insert`)
    }
  }
  return { modules: modules.sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)), changes }
}

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function patchPageModuleItems(client, pageKey, moduleKey, defaults, changes) {
  if (!(await tableExists(client, 'public.page_modules'))) return
  const res = await client.query(
    `SELECT id, items FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1`,
    [pageKey, moduleKey],
  )
  if (res.rowCount === 0) return
  const current = normalizeArray(res.rows[0].items)
  const next = mergeItems(current, defaults)
  if (stableJson(current) === stableJson(next)) return
  changes.push(`${pageKey}:${moduleKey} add B37 labels`)
  if (apply) {
    await client.query(
      `UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [res.rows[0].id, JSON.stringify(next)],
    )
  }
}

async function upsertCaseDetailLabels(client, changes) {
  if (!(await tableExists(client, 'public.page_modules'))) return
  const defaults = [
    item('fact-location', 'Location', 'Location', 10),
    item('fact-type', 'Project Type', 'Project Type', 20),
    item('fact-area', 'Project Area', 'Project Area', 30),
    item('fact-investment', 'Investment', 'Investment', 40),
    item('fact-units', 'Purchased Units', 'Purchased Units', 50),
    item('fact-products', 'Purchased Models', 'Purchased Models', 60),
    item('proof-title', 'Commercial Proof', 'Commercial Proof', 70),
    item('gallery-title', 'Project Gallery', 'Project Gallery', 80),
    item('related-title', 'Related Project References', 'Related Project References', 90),
  ]
  const res = await client.query(
    `SELECT id, items FROM page_modules WHERE page_key = 'cases' AND module_key = 'detail-labels' LIMIT 1`,
  )
  if (res.rowCount === 0) {
    changes.push('cases:detail-labels insert B37 labels')
    if (apply) {
      await client.query(
        `INSERT INTO page_modules (
           id, page_key, module_key, module_type, title_zh, title_en,
           description_zh, description_en, items, is_visible, sort_order
         ) VALUES (
           'cases:detail-labels', 'cases', 'detail-labels', 'fixed-content',
           'Case detail labels', 'Case detail labels',
           'Customer-facing labels for case detail facts and galleries.',
           'Customer-facing labels for case detail facts and galleries.',
           $1::jsonb, true, 30
         )`,
        [JSON.stringify(defaults)],
      )
    }
    return
  }
  const current = normalizeArray(res.rows[0].items)
  const next = mergeItems(current, defaults)
  if (stableJson(current) === stableJson(next)) return
  changes.push('cases:detail-labels refresh B37 labels')
  if (apply) {
    await client.query(
      `UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [res.rows[0].id, JSON.stringify(next)],
    )
  }
}

const productDepth = [
  {
    id: 'e7-gen6-flagship',
    gallery: ['/images/products/E7-Gen6_render-01.jpg', '/images/products/E7-Gen6_photo-01.jpg', '/images/products/custom_E7-Gen5_harmonyos-Huawei_01.jpg'],
    related: ['v9-gen6-standard', 'e6-gen6-standard', 'e3-gen6-standard'],
    keywords: ['E7 Gen6', 'prefab resort cabin', 'modular hospitality unit', 'glamping cabin'],
    specs: [
      { label: 'Product family', value: 'E7 flagship hospitality unit' },
      { label: 'Buyer package', value: 'Images, planning notes, and requested spec materials through Media Kit' },
      { label: 'Project fit', value: 'Flagship suites, showrooms, and high-value resort guest rooms' },
    ],
    resources: [
      { title: 'Open E7 image reference', href: '/images/products/E7-Gen6_render-01.jpg', body: 'Published E7 visual reference for product review.' },
      { title: 'Request E7 buyer pack', href: '/media-kit', body: 'Request spec sheet, floor plan, configuration notes, and case photos.' },
    ],
  },
  {
    id: 'v9-gen6-standard',
    gallery: ['/images/products/V9-Gen6_render-01.jpg', '/images/products/V9-Gen6_photo-01.jpg', '/images/products/custom_V9-Gen6_chassis-Japan_01.jpg'],
    related: ['e7-gen6-flagship', 'e6-gen6-standard', 'e3-gen6-standard'],
    keywords: ['V9 Gen6', 'modular resort villa', 'long stay prefab unit'],
    specs: [
      { label: 'Product family', value: 'V9 long-stay flagship unit' },
      { label: 'Buyer package', value: 'Spec sheet and floor plan available for buyer review' },
      { label: 'Project fit', value: 'Long-stay resort villas and residential-style hospitality projects' },
    ],
    resources: [
      { title: 'V9 Gen6 spec sheet', href: '/downloads/b34/v9-gen6-spec-sheet.pdf', body: 'PDF reference package for buyer review.' },
      { title: 'V9 Gen6 floor plan', href: '/downloads/b34/v9-gen6-floor-plan.jpg', body: 'Published floor plan image for layout review.' },
    ],
  },
  {
    id: 'e6-gen6-standard',
    gallery: ['/images/products/E6-Gen6_render-01.jpg', '/images/products/E6-Gen6_photo-01.jpg', '/images/products/e6-gen6-standard.jpg'],
    related: ['e7-gen6-flagship', 'v9-gen6-standard', 'e3-gen6-standard'],
    keywords: ['E6 Gen6', 'fast deployment cabin', 'resort cabin'],
    specs: [
      { label: 'Product family', value: 'E6 balanced resort unit' },
      { label: 'Buyer package', value: 'Published product images and buyer request path available' },
      { label: 'Project fit', value: 'Resort camps, boutique hotels, and balanced footprint deployment' },
    ],
    resources: [
      { title: 'Open E6 image reference', href: '/images/products/E6-Gen6_render-01.jpg', body: 'Published E6 visual reference for product review.' },
      { title: 'Request E6 buyer pack', href: '/media-kit', body: 'Request specification sheet, layout notes, and case photos.' },
    ],
  },
  {
    id: 'e3-gen6-standard',
    gallery: ['/images/products/E3-Gen6_render-01.jpg', '/images/products/E3-Gen6_photo-01.jpg', '/images/products/e3-gen6-standard.jpg'],
    related: ['e6-gen6-standard', 'e7-gen6-flagship', 'v9-gen6-standard'],
    keywords: ['E3 Gen6', 'compact prefab cabin', 'mini resort cabin'],
    specs: [
      { label: 'Product family', value: 'E3 compact guest unit' },
      { label: 'Buyer package', value: 'Spec sheet and floor plan available for buyer review' },
      { label: 'Project fit', value: 'Dense layouts, supporting facilities, and entry-level guest rooms' },
    ],
    resources: [
      { title: 'E3 Gen6 spec sheet', href: '/downloads/b34/e3-gen6-spec-sheet.pdf', body: 'PDF reference package for compact unit procurement review.' },
      { title: 'E3 Gen6 floor plan', href: '/downloads/b34/e3-gen6-floor-plan.jpg', body: 'Published floor plan image for layout review.' },
    ],
  },
  {
    id: 'e5-gen5-standard',
    gallery: ['/images/products/E5-Gen5_render-01.jpg', '/images/products/E5-Gen5_photo-01.jpg', '/images/products/e5-gen5-standard.jpg'],
    related: ['e3-gen6-standard', 'e6-gen6-standard', 'e7-gen5-standard'],
    keywords: ['E5 Gen5', 'compact prefab cabin', 'project support unit'],
    specs: [
      { label: 'Product family', value: 'E5 compact support unit' },
      { label: 'Buyer package', value: 'Floor plan available for preliminary layout review' },
      { label: 'Project fit', value: 'Compact hospitality rooms and support functions in modular camps' },
    ],
    resources: [
      { title: 'E5 Gen5 floor plan', href: '/downloads/b34/e5-gen5-floor-plan.jpg', body: 'Published floor plan image for layout review.' },
      { title: 'Request E5 buyer pack', href: '/media-kit', body: 'Request supporting product documentation from the sales team.' },
    ],
  },
]

function downloadModule(product) {
  return {
    id: 'b37-buyer-downloads',
    type: 'content',
    title_cn: 'Buyer Download Package',
    title_en: 'Buyer Download Package',
    body_cn: 'Published buyer materials are controlled from the product CMS and Media Kit. Missing files stay hidden until operations publishes them.',
    body_en: 'Published buyer materials are controlled from the product CMS and Media Kit. Missing files stay hidden until operations publishes them.',
    items_cn: product.resources,
    items_en: product.resources,
    image_url: product.gallery[0],
    images: product.gallery,
    is_visible: true,
    sort_order: 70,
  }
}

function transportModule() {
  return {
    id: 'b37-transport-installation',
    type: 'content',
    title_cn: 'Transport and Installation Review',
    title_en: 'Transport and Installation Review',
    body_cn: 'Use this section to align destination logistics, lifting conditions, foundation interface, utility standard, and installation support before quotation.',
    body_en: 'Use this section to align destination logistics, lifting conditions, foundation interface, utility standard, and installation support before quotation.',
    items_cn: [
      { title: 'Transport review', body: 'Confirm destination port, inland access, crane or lifting conditions, and site unloading route.' },
      { title: 'Foundation interface', body: 'Confirm local foundation condition and utility entry points before final installation planning.' },
      { title: 'Utility standard', body: 'Confirm electrical and water standards by destination before quotation and production scheduling.' },
      { title: 'Installation support', body: 'Installation method and on-site support are reviewed by project location and model mix.' },
    ],
    items_en: [
      { title: 'Transport review', body: 'Confirm destination port, inland access, crane or lifting conditions, and site unloading route.' },
      { title: 'Foundation interface', body: 'Confirm local foundation condition and utility entry points before final installation planning.' },
      { title: 'Utility standard', body: 'Confirm electrical and water standards by destination before quotation and production scheduling.' },
      { title: 'Installation support', body: 'Installation method and on-site support are reviewed by project location and model mix.' },
    ],
    is_visible: true,
    sort_order: 80,
  }
}

function complianceModule() {
  return {
    id: 'b37-certification-notes',
    type: 'content',
    title_cn: 'Certification and Project Notes',
    title_en: 'Certification and Project Notes',
    body_cn: 'Destination-side certification, local code, utility, and documentation requirements should be confirmed before final commercial terms.',
    body_en: 'Destination-side certification, local code, utility, and documentation requirements should be confirmed before final commercial terms.',
    items_cn: [
      { title: 'Destination review', body: 'Local code and certification scope are reviewed by country, project type, and final configuration.' },
      { title: 'Documentation', body: 'Published spec sheets, floor plans, and case photos are available through product pages and Media Kit.' },
      { title: 'Quotation boundary', body: 'Final price and schedule depend on quantity, customization level, and destination logistics.' },
    ],
    items_en: [
      { title: 'Destination review', body: 'Local code and certification scope are reviewed by country, project type, and final configuration.' },
      { title: 'Documentation', body: 'Published spec sheets, floor plans, and case photos are available through product pages and Media Kit.' },
      { title: 'Quotation boundary', body: 'Final price and schedule depend on quantity, customization level, and destination logistics.' },
    ],
    is_visible: true,
    sort_order: 90,
  }
}

async function patchProducts(client, changes) {
  if (!(await tableExists(client, 'public.product_catalog'))) return

  for (const product of productDepth) {
    const res = await client.query(
      `SELECT id, gallery, specs_cn, specs_en, detail_modules, keywords_zh, keywords_en,
              related_product_ids, commercial_terms, seo_title_en, seo_description_en
       FROM product_catalog
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [product.id],
    )
    if (res.rowCount === 0) continue

    const row = res.rows[0]
    const gallery = unique([...normalizeArray(row.gallery), ...product.gallery])
    const specsEn = mergeSpecRows(row.specs_en, product.specs)
    const specsCn = mergeSpecRows(row.specs_cn, product.specs)
    const detailModules = mergeDetailModules(row.detail_modules, [
      downloadModule(product),
      transportModule(),
      complianceModule(),
    ])
    const keywordsEn = unique([...(row.keywords_en ?? []), ...product.keywords])
    const keywordsZh = unique([...(row.keywords_zh ?? []), ...product.keywords])
    const related = unique([...(row.related_product_ids ?? []), ...product.related])
    const currentTerms = normalizeObject(row.commercial_terms)
    const commercialTerms = {
      ...currentTerms,
      delivery_method_en: currentTerms.delivery_method_en || 'Factory-finished modular unit; destination delivery plan confirmed by project scope.',
      shipping_location_en: currentTerms.shipping_location_en || 'Shipping origin and destination route are confirmed during quotation.',
      payment_terms_en: currentTerms.payment_terms_en || 'Payment terms are confirmed by quotation and project scope.',
      delivery_time_en: currentTerms.delivery_time_en || 'Schedule is confirmed after model mix, quantity, and logistics review.',
      electrical_standard_en: currentTerms.electrical_standard_en || 'Electrical and utility standards are confirmed by destination requirements.',
      warranty_support_en: currentTerms.warranty_support_en || 'After-sales support is reviewed by destination and project configuration.',
      moq_en: currentTerms.moq_en || 'Confirm by model, customization level, and project scope.',
    }
    const seoTitle = row.seo_title_en || `${product.id.replaceAll('-', ' ').toUpperCase()} | VESSEL Modular Hospitality Unit`
    const seoDescription = row.seo_description_en || 'VESSEL product page with published gallery, buyer downloads, transport notes, project planning references, and inquiry path.'

    const changed = [
      stableJson(normalizeArray(row.gallery)) !== stableJson(gallery),
      specsEn.additions.length > 0,
      specsCn.additions.length > 0,
      detailModules.changes.length > 0,
      stableJson(row.keywords_en ?? []) !== stableJson(keywordsEn),
      stableJson(row.keywords_zh ?? []) !== stableJson(keywordsZh),
      stableJson(row.related_product_ids ?? []) !== stableJson(related),
      stableJson(currentTerms) !== stableJson(commercialTerms),
      String(row.seo_title_en ?? '') !== seoTitle,
      String(row.seo_description_en ?? '') !== seoDescription,
    ].some(Boolean)
    if (!changed) continue

    changes.push(`product:${product.id} apply B37 sales depth`)
    if (apply) {
      await client.query(
        `UPDATE product_catalog
         SET gallery = $2::jsonb,
             specs_cn = $3::jsonb,
             specs_en = $4::jsonb,
             detail_modules = $5::jsonb,
             keywords_zh = $6::text[],
             keywords_en = $7::text[],
             related_product_ids = $8::text[],
             commercial_terms = $9::jsonb,
             seo_title_en = $10,
             seo_description_en = $11,
             updated_at = NOW()
         WHERE id = $1`,
        [
          product.id,
          JSON.stringify(gallery),
          JSON.stringify(specsCn.rows),
          JSON.stringify(specsEn.rows),
          JSON.stringify(detailModules.modules),
          keywordsZh,
          keywordsEn,
          related,
          JSON.stringify(commercialTerms),
          seoTitle,
          seoDescription,
        ],
      )
    }
  }
}

const caseSamples = [
  {
    id: 'xunliao-bay-holiday-planet',
    area: '35,000 sqm',
    investment: 'RMB 25 million',
    units: '20 units',
    products: 'S5 Gen5 / O5 / E7 Gen5 / V7 Gen5',
    images: ['/images/projects/guangdong-huizhou/image-03.jpg', '/images/projects/guangdong-huizhou/image-01.jpg', '/images/projects/guangdong-huizhou/image-02.jpg', '/images/projects/guangdong-huizhou/image-04.jpg'],
    tags: ['Seaside', 'Luxury camp', 'Multi-model deployment'],
  },
  {
    id: 'jiaoding-mountain-elk-life',
    area: '15,000 sqm',
    investment: 'RMB 45 million',
    units: '26 units',
    products: 'E7 Gen6 / V9 Gen6 / E6 Gen6',
    images: ['/images/projects/sichuan-jiaoding/image-01.jpg', '/images/projects/sichuan-jiaoding/image-02.jpg', '/images/projects/sichuan-jiaoding/image-03.png'],
    tags: ['Alpine', 'Cold climate', 'Resort camp'],
  },
  {
    id: 'wanlv-lake-leqing-valley',
    area: '25,000 sqm',
    investment: 'RMB 5 million',
    units: '15 units',
    products: 'V5 Gen5 / V7 Gen5',
    images: ['/images/projects/guangdong-heyuan/image-05.jpg', '/images/projects/guangdong-heyuan/image-02.jpg', '/images/projects/guangdong-heyuan/image-03.jpg', '/images/projects/guangdong-heyuan/image-06.jpg'],
    tags: ['Lake view', 'Eco camp', 'Hospitality'],
  },
]

async function patchCases(client, changes) {
  if (!(await tableExists(client, 'public.project_cases'))) return

  for (const sample of caseSamples) {
    const res = await client.query(
      `SELECT id, area_display, investment_display, units_display, products, tags_en, cover_image_url, images
       FROM project_cases
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [sample.id],
    )
    if (res.rowCount === 0) continue

    const row = res.rows[0]
    const images = unique([...normalizeArray(row.images), ...sample.images])
    const tags = unique([...normalizeArray(row.tags_en), ...sample.tags])
    const cover = row.cover_image_url || sample.images[0]
    const area = row.area_display || sample.area
    const investment = row.investment_display || sample.investment
    const units = row.units_display || sample.units
    const products = row.products || sample.products
    const changed = (
      String(row.cover_image_url ?? '') !== cover ||
      stableJson(normalizeArray(row.images)) !== stableJson(images) ||
      stableJson(normalizeArray(row.tags_en)) !== stableJson(tags) ||
      String(row.area_display ?? '') !== area ||
      String(row.investment_display ?? '') !== investment ||
      String(row.units_display ?? '') !== units ||
      String(row.products ?? '') !== products
    )
    if (!changed) continue

    changes.push(`case:${sample.id} apply B37 commercial proof`)
    if (apply) {
      await client.query(
        `UPDATE project_cases
         SET area_display = $2,
             investment_display = $3,
             units_display = $4,
             products = $5,
             tags_en = $6::jsonb,
             cover_image_url = $7,
             images = $8::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [sample.id, area, investment, units, products, JSON.stringify(tags), cover, JSON.stringify(images)],
      )
    }
  }
}

const mediaResources = [
  {
    slug: 'company-brochure-overview',
    title: 'Company Brochure Overview',
    summary: 'Company capability overview and brand background for first project review.',
    fileUrl: '/about',
    ctaLabel: 'Open company overview',
    sortOrder: 5,
  },
  {
    slug: 'v9-gen6-product-spec-sheet',
    title: 'V9 Gen6 Product Spec Sheet',
    summary: 'Published PDF reference package for V9 Gen6 buyer review.',
    fileUrl: '/downloads/b34/v9-gen6-spec-sheet.pdf',
    ctaLabel: 'Open spec sheet',
    sortOrder: 10,
  },
  {
    slug: 'e7-gen5-product-spec-sheet',
    title: 'E7 Gen5 Product Spec Sheet',
    summary: 'Published PDF reference package for E7 buyer review.',
    fileUrl: '/downloads/b34/e7-gen5-spec-sheet.pdf',
    ctaLabel: 'Open spec sheet',
    sortOrder: 12,
  },
  {
    slug: 'floor-plan-pack',
    title: 'Floor Plan Pack',
    summary: 'Published floor plan references for V9, E7, E5, and E3 review.',
    fileUrl: '/downloads/b34/v9-gen6-floor-plan.jpg',
    ctaLabel: 'Open floor plan',
    sortOrder: 14,
  },
  {
    slug: 'case-photo-pack',
    title: 'Case Photo Pack',
    summary: 'Published project photo references for resort and commercial project discussions.',
    fileUrl: '/images/projects/astrobase-mamison/exterior-02.jpg',
    ctaLabel: 'Open case photo',
    sortOrder: 16,
  },
  {
    slug: 'brand-logo-pack',
    title: 'Brand Logo',
    summary: 'Published VESSEL brand mark for partner reference.',
    fileUrl: '/images/vessel-logo.png',
    ctaLabel: 'Open brand logo',
    sortOrder: 18,
  },
]

async function upsertMediaResources(client, changes) {
  if (!(await tableExists(client, 'public.site_content_items'))) return

  for (const resource of mediaResources) {
    const res = await client.query(
      `SELECT id, title_zh, title_en, summary_zh, summary_en, file_url, cta_label_zh, cta_label_en, status, sort_order
       FROM site_content_items
       WHERE kind = 'media_file' AND slug = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [resource.slug],
    )
    if (res.rowCount === 0) {
      changes.push(`media_file:${resource.slug} insert B37 resource`)
      if (apply) {
        await client.query(
          `INSERT INTO site_content_items (
             kind, slug, title_zh, title_en, summary_zh, summary_en,
             file_url, cta_label_zh, cta_label_en, cta_href, payload, status, sort_order, published_at
           ) VALUES (
             'media_file', $1, $2, $2, $3, $3, $4, $5, $5, NULL, '{}'::jsonb, 'published', $6, NOW()
           )`,
          [resource.slug, resource.title, resource.summary, resource.fileUrl, resource.ctaLabel, resource.sortOrder],
        )
      }
      continue
    }

    const row = res.rows[0]
    const changed = (
      String(row.title_en ?? '') !== resource.title ||
      String(row.summary_en ?? '') !== resource.summary ||
      String(row.file_url ?? '') !== resource.fileUrl ||
      String(row.cta_label_en ?? '') !== resource.ctaLabel ||
      row.status !== 'published' ||
      Number(row.sort_order ?? 0) !== resource.sortOrder
    )
    if (!changed) continue

    changes.push(`media_file:${resource.slug} refresh B37 resource`)
    if (apply) {
      await client.query(
        `UPDATE site_content_items
         SET title_zh = $2,
             title_en = $2,
             summary_zh = $3,
             summary_en = $3,
             file_url = $4,
             cta_label_zh = $5,
             cta_label_en = $5,
             cta_href = NULL,
             status = 'published',
             sort_order = $6,
             published_at = CASE WHEN published_at IS NULL THEN NOW() ELSE published_at END,
             updated_at = NOW()
         WHERE id = $1`,
        [row.id, resource.title, resource.summary, resource.fileUrl, resource.ctaLabel, resource.sortOrder],
      )
    }
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []

  try {
    await client.query('BEGIN')
    await patchPageModuleItems(client, 'products', 'ui-labels', [
      item('specs-title', 'Product Specifications', 'Product Specifications', 150),
      item('gallery-title', 'Product Gallery', 'Product Gallery', 155),
      item('downloads-title', 'Buyer Downloads', 'Buyer Downloads', 160),
      item('keywords-title', 'Keywords', 'Keywords', 170),
      item('related-title', 'Related Products', 'Related Products', 180),
      item('hero-inquiry-cta', 'Request Quote', 'Request Quote', 190),
    ], changes)
    await upsertCaseDetailLabels(client, changes)
    await patchPageModuleItems(client, 'media-kit', 'hero', [
      item('resource-heading', 'Published buyer materials', 'Published buyer materials', 30),
      item('resource-cta', 'Open resource', 'Open resource', 40),
      item('form-title', 'Request additional materials', 'Request additional materials', 50),
      item('form-description', 'If the files above are not enough, share your project context and the team will follow up with suitable materials.', 'If the files above are not enough, share your project context and the team will follow up with suitable materials.', 55),
    ], changes)
    await patchProducts(client, changes)
    await patchCases(client, changes)
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

  console.log(apply ? 'B37 sales depth backfill applied.' : 'B37 sales depth dry-run.')
  if (changes.length === 0) console.log('No B37 changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  if (err instanceof Error) console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  else console.error(err)
  process.exit(1)
})
