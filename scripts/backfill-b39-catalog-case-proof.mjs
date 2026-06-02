import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')
const assetDir = resolve(root, '..', 'vessel-assets', '300-export', '2026-06-01', 'b39-catalog-case-proof')

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
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

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

function mergeSpecs(existing, defaults) {
  const current = normalizeArray(existing)
  const keys = new Set(current.map((row) => String(row?.label ?? '').trim().toLowerCase()).filter(Boolean))
  return [...current, ...defaults.filter((row) => !keys.has(String(row.label ?? '').trim().toLowerCase()))]
}

function mergeModules(existing, defaults) {
  const current = normalizeArray(existing)
  const byId = new Map(current.map((row) => [row?.id, row]).filter(([id]) => Boolean(id)))
  for (const entry of defaults) byId.set(entry.id, { ...(byId.get(entry.id) ?? {}), ...entry })
  return [...byId.values()].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
}

const catalogProducts = [
  {
    id: 'v3-gen5-standard',
    series: 'V3',
    name: 'V3 Gen5 · China Standard',
    gen: 'Gen5',
    size: '12.3 sqm',
    area: 12.3,
    generation: 5,
    type: 'compact',
    badge: 'Compact',
    tags: ['V3', 'Compact', 'Standard'],
    features: ['Compact footprint', 'Fast deployment', 'Starter room reference'],
    image: '/images/products/V3-Gen5_render-01.jpg',
    gallery: ['/images/products/V3-Gen5_render-01.jpg', '/images/products/V3-Gen6_render-01.jpg', '/images/products/custom_V3-Gen5_grey-exterior-Argentina_01.jpg'],
    specs: [
      { label: 'Product family', value: 'V3 compact cabin' },
      { label: 'Reference area', value: '12.3 sqm' },
      { label: 'Project fit', value: 'Compact guest rooms, pilot camps, and small site support units' },
    ],
    keywords: ['V3 Gen5', 'compact prefab cabin', 'small modular cabin'],
    sortOrder: 180,
  },
  {
    id: 'v5-custom-taiwan',
    series: 'V5',
    name: 'V5 Gen5 · Double Wood Grain Taiwan',
    gen: 'Gen5',
    size: '24.8 sqm',
    area: 24.8,
    generation: 5,
    type: 'standard',
    badge: 'Double Module',
    tags: ['V5', 'Double Module', 'Wood Grain'],
    features: ['Double-module layout', 'Wood grain exterior reference', 'Custom project reference'],
    image: '/images/products/custom_V5-Gen5_woodgrain-double-Taiwan_01.jpg',
    gallery: ['/images/products/custom_V5-Gen5_woodgrain-double-Taiwan_01.jpg', '/images/products/V5-Gen5_render-01.jpg', '/images/products/custom_V5-Gen6_wastewater-Sinopec_01.jpg'],
    specs: [
      { label: 'Product family', value: 'V5 custom modular unit' },
      { label: 'Reference area', value: '24.8 sqm' },
      { label: 'Project fit', value: 'Resort expansions, connected rooms, and custom exterior projects' },
    ],
    keywords: ['V5 Gen5', 'double module prefab cabin', 'wood grain modular unit'],
    sortOrder: 190,
  },
  {
    id: 'v7-custom-reception',
    series: 'V7',
    name: 'V7 Gen5 · Reception Room',
    gen: 'Gen5',
    size: '30 sqm',
    area: 30,
    generation: 5,
    type: 'standard',
    badge: 'Reception',
    tags: ['V7', 'Reception', 'Commercial'],
    features: ['Reception layout', 'Commercial use case', 'Brand-facing modular space'],
    image: '/images/products/custom_V7-Gen5_reception_01.jpg',
    gallery: ['/images/products/custom_V7-Gen5_reception_01.jpg', '/images/products/custom_V7-Gen5_double-NewZealand_01.jpg', '/images/products/custom_V7-Gen6_frosted-glass-Pakistan_01.jpg'],
    specs: [
      { label: 'Product family', value: 'V7 commercial reception unit' },
      { label: 'Reference area', value: '30 sqm' },
      { label: 'Project fit', value: 'Reception rooms, branded commercial spaces, and project service points' },
    ],
    keywords: ['V7 Gen5', 'reception modular unit', 'commercial prefab space'],
    sortOrder: 200,
  },
  {
    id: 's5-gen5-standard',
    series: 'S5',
    name: 'S5 Gen5 · Classic Edition',
    gen: 'Gen5',
    size: '28 sqm',
    area: 28,
    generation: 5,
    type: 'standard',
    badge: 'Classic',
    tags: ['S5', 'Classic', 'Skylight'],
    features: ['Classic S-series silhouette', 'Skylight reference', 'Resort cabin use case'],
    image: '/images/products/S5-Gen6_render-01.jpg',
    gallery: ['/images/products/S5-Gen6_render-01.jpg', '/images/products/custom_S5-Gen6_UK_01.jpg', '/images/products/custom_S5-Gen6_double-floor-Taiwan_01.jpg'],
    specs: [
      { label: 'Product family', value: 'S5 classic resort unit' },
      { label: 'Reference area', value: '28 sqm' },
      { label: 'Project fit', value: 'Classic guest rooms, scenic camps, and resort cabin projects' },
    ],
    keywords: ['S5 Gen5', 'classic prefab cabin', 'skylight modular resort unit'],
    sortOrder: 210,
  },
]

function productModules(product) {
  return [
    {
      id: 'b39-catalog-fit',
      type: 'highlights',
      title_cn: 'Catalog Fit',
      title_en: 'Catalog Fit',
      body_cn: 'Published as a catalog-width product reference for overseas buyers.',
      body_en: 'Published as a catalog-width product reference for overseas buyers.',
      items: [
        { title: 'Series', body: product.series },
        { title: 'Reference size', body: product.size },
        { title: 'Buyer path', body: 'Open product page, review buyer materials, and submit inquiry.' },
      ],
      is_visible: true,
      sort_order: 20,
    },
    {
      id: 'b39-buyer-resources',
      type: 'content',
      title_cn: 'Buyer Resources',
      title_en: 'Buyer Resources',
      body_cn: 'Request product documentation through Media Kit or contact the sales team for project-specific material.',
      body_en: 'Request product documentation through Media Kit or contact the sales team for project-specific material.',
      links: [{ title: `Request ${product.series} buyer pack`, href: '/media-kit', body: 'Request product images, layout references, and configuration notes.' }],
      is_visible: true,
      sort_order: 90,
    },
  ]
}

const productSizePatch = new Map([
  ['e7-gen6-flagship', '38.8 sqm'],
  ['v9-gen6-standard', '38.8 sqm'],
  ['e6-gen6-standard', '29.6 sqm'],
  ['e3-gen6-standard', '19 sqm'],
])

async function restoreCatalogProducts(client, changes) {
  if (!(await tableExists(client, 'public.product_catalog'))) return

  for (const product of catalogProducts) {
    const res = await client.query(
      `SELECT id, gallery, specs_cn, specs_en, detail_modules, keywords_zh, keywords_en,
              related_product_ids, commercial_terms, deleted_at, status, image
       FROM product_catalog
       WHERE id = $1
       LIMIT 1`,
      [product.id],
    )
    if (res.rowCount === 0) {
      changes.push(`product:${product.id} insert B39 catalog product`)
      if (apply) {
        await client.query(
          `INSERT INTO product_catalog (
             id, product_series, name_cn, name_en, gen, size, area, generation, product_type,
             badge_cn, badge_en, tags_cn, tags_en, features_cn, features_en,
             image, description_cn, description_en, gallery, specs_cn, specs_en,
             detail_modules, is_custom, price_display_zh, price_display_en,
             commercial_terms, keywords_zh, keywords_en, related_product_ids,
             seo_title_zh, seo_title_en, seo_description_zh, seo_description_en,
             status, sort_order
           ) VALUES (
             $1,$2,$3,$3,$4,$5,$6,$7,$8,
             $9,$9,$10::jsonb,$10::jsonb,$11::jsonb,$11::jsonb,
             $12,$13,$13,$14::jsonb,$15::jsonb,$15::jsonb,
             $16::jsonb,false,NULL,NULL,
             $17::jsonb,$18::text[],$18::text[],$19::text[],
             $20,$20,$21,$21,
             'published',$22
           )`,
          [
            product.id,
            product.series,
            product.name,
            product.gen,
            product.size,
            product.area,
            product.generation,
            product.type,
            product.badge,
            JSON.stringify(product.tags),
            JSON.stringify(product.features),
            product.image,
            `${product.name} is maintained from the backend product CMS for overseas catalog browsing.`,
            JSON.stringify(product.gallery),
            JSON.stringify(product.specs),
            JSON.stringify(productModules(product)),
            JSON.stringify(baseCommercialTerms()),
            product.keywords,
            ['e7-gen6-flagship', 'v9-gen6-standard', 'e6-gen6-standard'],
            `${product.name} | VESSEL Product Catalog`,
            `${product.name} product catalog page with backend-published images, specification references, buyer materials, and inquiry path.`,
            product.sortOrder,
          ],
        )
      }
      continue
    }

    const row = res.rows[0]
    const gallery = unique([...normalizeArray(row.gallery), ...product.gallery])
    const specsCn = mergeSpecs(row.specs_cn, product.specs)
    const specsEn = mergeSpecs(row.specs_en, product.specs)
    const detailModules = mergeModules(row.detail_modules, productModules(product))
    const keywords = unique([...(Array.isArray(row.keywords_en) ? row.keywords_en : []), ...product.keywords])
    const related = unique([...(Array.isArray(row.related_product_ids) ? row.related_product_ids : []), 'e7-gen6-flagship', 'v9-gen6-standard', 'e6-gen6-standard'])
    const commercialTerms = { ...baseCommercialTerms(), ...normalizeObject(row.commercial_terms) }
    const changed = Boolean(row.deleted_at)
      || row.status !== 'published'
      || !row.image
      || stableJson(normalizeArray(row.gallery)) !== stableJson(gallery)
      || stableJson(normalizeArray(row.specs_cn)) !== stableJson(specsCn)
      || stableJson(normalizeArray(row.specs_en)) !== stableJson(specsEn)
      || stableJson(normalizeArray(row.detail_modules)) !== stableJson(detailModules)
      || stableJson(Array.isArray(row.keywords_en) ? row.keywords_en : []) !== stableJson(keywords)

    if (!changed) continue
    changes.push(`product:${product.id} restore and publish B39 catalog product`)
    if (apply) {
      await client.query(
        `UPDATE product_catalog
         SET name_cn = $2,
             name_en = $2,
             size = $3,
             image = COALESCE(NULLIF(image, ''), $4),
             gallery = $5::jsonb,
             specs_cn = $6::jsonb,
             specs_en = $7::jsonb,
             detail_modules = $8::jsonb,
             commercial_terms = $9::jsonb,
             keywords_zh = $10::text[],
             keywords_en = $10::text[],
             related_product_ids = $11::text[],
             status = 'published',
             deleted_at = NULL,
             sort_order = $12,
             seo_title_zh = COALESCE(NULLIF(seo_title_zh, ''), $13),
             seo_title_en = COALESCE(NULLIF(seo_title_en, ''), $13),
             seo_description_zh = COALESCE(NULLIF(seo_description_zh, ''), $14),
             seo_description_en = COALESCE(NULLIF(seo_description_en, ''), $14),
             updated_at = NOW()
         WHERE id = $1`,
        [
          product.id,
          product.name,
          product.size,
          product.image,
          JSON.stringify(gallery),
          JSON.stringify(specsCn),
          JSON.stringify(specsEn),
          JSON.stringify(detailModules),
          JSON.stringify(commercialTerms),
          keywords,
          related,
          product.sortOrder,
          `${product.name} | VESSEL Product Catalog`,
          `${product.name} product catalog page with backend-published images, specification references, buyer materials, and inquiry path.`,
        ],
      )
    }
  }

  for (const [id, size] of productSizePatch.entries()) {
    const res = await client.query('SELECT size FROM product_catalog WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
    if (res.rowCount === 0 || res.rows[0].size === size) continue
    changes.push(`product:${id} normalize size unit for English catalog`)
    if (apply) {
      await client.query('UPDATE product_catalog SET size = $2, updated_at = NOW() WHERE id = $1', [id, size])
    }
  }
}

function baseCommercialTerms() {
  return {
    delivery_method: 'Factory-built modular unit, project shipping terms confirmed case by case',
    delivery_location: 'Destination and logistics path confirmed during quotation',
    payment_terms: 'Commercial terms confirmed with the sales team',
    lead_time: 'Production and shipping schedule confirmed by model, quantity, and configuration',
    utilities: 'Utility and local code requirements confirmed before final configuration',
    after_sales: 'Project support and after-sales scope confirmed during quotation',
    moq: 'Confirm with sales team',
  }
}

const caseProof = [
  {
    id: 'xunliao-bay-holiday-planet',
    area: '35,000 sqm',
    investment: 'RMB 25 million',
    units: '20 units',
    products: 'S5 Gen5 / O5 / E7 Gen5 / V7 Gen5',
    cover: '/images/projects/guangdong-huizhou/image-03.jpg',
    images: ['/images/projects/guangdong-huizhou/image-03.jpg', '/images/projects/guangdong-huizhou/image-01.jpg', '/images/projects/guangdong-huizhou/image-02.jpg', '/images/projects/guangdong-huizhou/image-04.jpg'],
  },
  {
    id: 'jiaoding-mountain-elk-life',
    area: '15,000 sqm',
    investment: 'RMB 45 million',
    units: '26 units',
    products: 'E7 Gen6 / V9 Gen6 / E6 Gen6',
    cover: '/images/projects/sichuan-jiaoding/image-01.jpg',
    images: ['/images/projects/sichuan-jiaoding/image-01.jpg', '/images/projects/sichuan-jiaoding/image-02.jpg', '/images/projects/sichuan-jiaoding/image-03.png', '/images/projects/sichuan-jiaoding/image-04.png'],
  },
  {
    id: 'qilian-tuomao-tribe',
    area: '4,000 sqm',
    investment: 'RMB 5 million',
    units: '',
    products: 'V9 Gen6 / E6 Gen6',
    cover: '/images/projects/qinghai-qilian/image-01.jpg',
    images: ['/images/projects/qinghai-qilian/image-01.jpg', '/images/projects/qinghai-qilian/image-02.jpg', '/images/projects/qinghai-qilian/image-03.jpg', '/images/projects/qinghai-qilian/image-04.jpg'],
  },
  {
    id: 'wanlv-lake-leqing-valley',
    area: '25,000 sqm',
    investment: 'RMB 5 million',
    units: '15 units',
    products: 'V5 Gen5 / V7 Gen5',
    cover: '/images/projects/guangdong-heyuan/image-05.jpg',
    images: ['/images/projects/guangdong-heyuan/image-05.jpg', '/images/projects/guangdong-heyuan/image-02.jpg', '/images/projects/guangdong-heyuan/image-03.jpg', '/images/projects/guangdong-heyuan/image-06.jpg'],
  },
  {
    id: 'huawei-smart-home-showroom',
    area: '800 sqm',
    investment: 'RMB 3 million',
    units: '4 units',
    products: 'E7 Gen6 / V9 Gen6',
    cover: '/images/products/region-asia-huawei.jpg',
    images: ['/images/products/region-asia-huawei.jpg', '/images/products/e7-custom-huawei.jpg', '/images/products/custom_E7-Gen5_harmonyos-Huawei_01.jpg'],
  },
]

async function patchCaseProof(client, changes) {
  if (!(await tableExists(client, 'public.project_cases'))) return

  for (const sample of caseProof) {
    const res = await client.query(
      `SELECT id, area_display, investment_display, units_display, products, cover_image_url, images
       FROM project_cases
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [sample.id],
    )
    if (res.rowCount === 0) continue
    const row = res.rows[0]
    const images = unique([...normalizeArray(row.images), ...sample.images])
    const changed = row.area_display !== sample.area
      || row.investment_display !== sample.investment
      || row.units_display !== sample.units
      || row.products !== sample.products
      || !row.cover_image_url
      || stableJson(normalizeArray(row.images)) !== stableJson(images)
    if (!changed) continue
    changes.push(`case:${sample.id} normalize B39 commercial proof`)
    if (apply) {
      await client.query(
        `UPDATE project_cases
         SET area_display = $2,
             investment_display = $3,
             units_display = $4,
             products = $5,
             cover_image_url = COALESCE(NULLIF(cover_image_url, ''), $6),
             images = $7::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [sample.id, sample.area, sample.investment, sample.units, sample.products, sample.cover, JSON.stringify(images)],
      )
    }
  }
}

function manifestRows() {
  const rows = []
  for (const product of catalogProducts) {
    for (const url of product.gallery) {
      rows.push({
        source: 'local public product assets / 303 product catalog reference',
        original_url: url,
        file_name: url.split('/').pop(),
        sha256: createHash('sha256').update(url).digest('hex'),
        suggested_use: `${product.id} product catalog image`,
        publish_status: 'published-through-product-cms',
      })
    }
  }
  for (const sample of caseProof) {
    for (const url of sample.images) {
      rows.push({
        source: 'local public project assets / 303 case proof reference',
        original_url: url,
        file_name: url.split('/').pop(),
        sha256: createHash('sha256').update(url).digest('hex'),
        suggested_use: `${sample.id} case gallery image`,
        publish_status: 'published-through-case-cms',
      })
    }
  }
  return rows
}

function writeManifest(changes) {
  const rows = manifestRows()
  const csv = [
    'source,original_url,file_name,sha256,suggested_use,publish_status',
    ...rows.map((row) => [
      row.source,
      row.original_url,
      row.file_name,
      row.sha256,
      row.suggested_use,
      row.publish_status,
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
  ].join('\n')
  const csvPath = resolve(assetDir, 'manifest.csv')
  const jsonPath = resolve(assetDir, 'manifest.json')
  const nextCsv = `${csv}\n`
  const nextJson = JSON.stringify(rows, null, 2)
  const currentCsv = existsSync(csvPath) ? readFileSync(csvPath, 'utf8') : ''
  const currentJson = existsSync(jsonPath) ? readFileSync(jsonPath, 'utf8') : ''
  if (currentCsv === nextCsv && currentJson === nextJson) return
  changes.push('asset manifest refresh B39 catalog and case proof')
  if (apply) {
    mkdirSync(assetDir, { recursive: true })
    writeFileSync(csvPath, nextCsv, 'utf8')
    writeFileSync(jsonPath, nextJson, 'utf8')
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    await client.query('BEGIN')
    await restoreCatalogProducts(client, changes)
    await patchCaseProof(client, changes)
    writeManifest(changes)
    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }

  console.log(`B39 catalog/case proof ${apply ? 'applied' : 'dry-run'}.`)
  if (changes.length === 0) console.log('No B39 changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((error) => {
  if (error instanceof Error) console.error([error.name, error.message, error.code].filter(Boolean).join(': '))
  else console.error(error)
  process.exit(1)
})
