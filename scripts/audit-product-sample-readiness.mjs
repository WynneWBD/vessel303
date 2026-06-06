import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()

const DEFAULT_SAMPLE_IDS = [
  'e7-gen6-flagship',
  'v9-gen6-standard',
  'e6-gen6-standard',
  'e3-gen6-standard',
  's5-gen5-standard',
]

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
  throw new Error('Missing DATABASE_URL / POSTGRES_URL. No connection string was printed.')
}

function parseRequestedSampleIds(argv) {
  const ids = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]?.trim()
    if (!arg) continue

    if (arg === '--json' || arg === '--strict') continue
    if (arg === '--base-url') {
      index += 1
      continue
    }
    if (arg.startsWith('--')) continue

    ids.push(arg)
  }

  return Array.from(new Set(ids))
}

const sampleIds = parseRequestedSampleIds(process.argv.slice(2))
const targetIds = sampleIds.length > 0 ? sampleIds.slice(0, 8) : DEFAULT_SAMPLE_IDS
const COMMERCIAL_TERM_PAIRS = [
  ['delivery_method_zh', 'delivery_method_en'],
  ['shipping_location_zh', 'shipping_location_en'],
  ['payment_terms_zh', 'payment_terms_en'],
  ['delivery_time_zh', 'delivery_time_en'],
  ['electrical_standard_zh', 'electrical_standard_en'],
  ['warranty_support_zh', 'warranty_support_en'],
  ['moq_zh', 'moq_en'],
]

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function objectHasValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).some((entry) => {
    if (typeof entry === 'string') return entry.trim().length > 0
    if (Array.isArray(entry)) return entry.length > 0
    return Boolean(entry)
  })
}

function commercialTermCoverage(value) {
  const terms = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const zhKeys = COMMERCIAL_TERM_PAIRS.map(([zh]) => zh)
  const enKeys = COMMERCIAL_TERM_PAIRS.map(([, en]) => en)
  const hasKeyText = (key) => hasText(terms[key])

  return {
    zhFields: zhKeys.filter(hasKeyText).length,
    enFields: enKeys.filter(hasKeyText).length,
    missingZhKeys: zhKeys.filter((key) => !hasKeyText(key)),
    missingEnKeys: enKeys.filter((key) => !hasKeyText(key)),
  }
}

function labelForModule(module) {
  return String(module?.title_en || module?.title_zh || module?.title_cn || module?.id || 'untitled')
    .replace(/\s+/g, ' ')
    .trim()
}

function isBuyerResourceModule(module) {
  if (!module || typeof module !== 'object' || module.is_visible === false) return false
  const marker = [module.id, module.title_en, module.title_zh, module.title_cn]
    .map((entry) => (typeof entry === 'string' ? entry.toLowerCase() : ''))
    .join(' ')
  return /buyer|download|resource|material/.test(marker)
}

function moduleLinks(module) {
  return [
    ...asArray(module?.links),
    ...asArray(module?.items),
    ...asArray(module?.items_en),
    ...asArray(module?.items_zh),
    ...asArray(module?.items_cn),
  ].filter((item) => hasText(item?.href))
}

function buyerResourceLinkCount(detailModules) {
  return asArray(detailModules)
    .filter(isBuyerResourceModule)
    .reduce((sum, module) => sum + moduleLinks(module).length, 0)
}

function missingSeoFields(product) {
  return [
    ['seo_title_zh', product.seo_title_zh],
    ['seo_title_en', product.seo_title_en],
    ['seo_description_zh', product.seo_description_zh],
    ['seo_description_en', product.seo_description_en],
  ]
    .filter(([, value]) => !hasText(value))
    .map(([field]) => field)
}

function publicHref(product) {
  if (product.id === 'v9-gen6-standard') return '/products/v9-gen6'
  if (hasText(product.detail_slug)) return `/products/${product.detail_slug.trim()}`
  return `/products/${product.id}`
}

function productIssues(product, attributes) {
  const issues = []
  const gallery = asArray(product.gallery)
  const detailModules = asArray(product.detail_modules)
  const visibleDetailModules = detailModules.filter((module) => module?.is_visible !== false)
  const seoMissing = missingSeoFields(product)
  const commercialTerms = objectHasValue(product.commercial_terms)
  const termsCoverage = commercialTermCoverage(product.commercial_terms)

  if (!product.category_id || product.category_status !== 'visible') issues.push('category')
  if (attributes.length === 0) issues.push('attributes')
  if (!hasText(product.image) || gallery.length === 0) issues.push('cover_gallery')
  if (visibleDetailModules.length === 0) issues.push('detail_modules')
  if (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) issues.push('price_display')
  if (!commercialTerms) {
    issues.push('commercial_terms')
  } else {
    if (termsCoverage.zhFields === 0) issues.push('commercial_terms_zh')
    if (termsCoverage.enFields === 0) issues.push('commercial_terms_en')
  }
  if (asArray(product.keywords_zh).length === 0 && asArray(product.keywords_en).length === 0) issues.push('keywords')
  if (asArray(product.related_product_ids).length === 0) issues.push('related_products')
  if (buyerResourceLinkCount(detailModules) === 0) issues.push('buyer_resources')
  if (seoMissing.length > 0) issues.push('seo')

  return issues
}

function ownerForIssue(issue) {
  if (['category', 'attributes', 'price_display', 'commercial_terms', 'commercial_terms_zh', 'commercial_terms_en', 'keywords', 'related_products', 'buyer_resources', 'seo'].includes(issue)) {
    return '02'
  }
  if (['cover_gallery', 'detail_modules'].includes(issue)) return '02/07'
  return '00'
}

function summarizeProduct(product, attributesByProduct) {
  const attributes = attributesByProduct.get(product.id) ?? []
  const detailModules = asArray(product.detail_modules)
  const visibleDetailModules = detailModules.filter((module) => module?.is_visible !== false)
  const issues = productIssues(product, attributes)
  const termsCoverage = commercialTermCoverage(product.commercial_terms)

  return {
    id: product.id,
    publicHref: publicHref(product),
    status: product.status,
    label: product.name_en || product.name_cn || product.id,
    series: product.product_series,
    detailSlug: product.detail_slug || null,
    category: product.category_id
      ? {
          id: product.category_id,
          slug: product.category_slug,
          title_en: product.category_title_en,
          status: product.category_status,
        }
      : null,
    counts: {
      attributes: attributes.length,
      galleryImages: asArray(product.gallery).length,
      specsZh: asArray(product.specs_cn).length,
      specsEn: asArray(product.specs_en).length,
      visibleDetailModules: visibleDetailModules.length,
      buyerResourceLinks: buyerResourceLinkCount(detailModules),
      keywordsZh: asArray(product.keywords_zh).length,
      keywordsEn: asArray(product.keywords_en).length,
      relatedProducts: asArray(product.related_product_ids).length,
    },
    fieldStatus: {
      priceDisplayZh: hasText(product.price_display_zh),
      priceDisplayEn: hasText(product.price_display_en),
      commercialTerms: objectHasValue(product.commercial_terms),
      commercialTermsZhFields: termsCoverage.zhFields,
      commercialTermsEnFields: termsCoverage.enFields,
      missingCommercialTermZhKeys: termsCoverage.missingZhKeys,
      missingCommercialTermEnKeys: termsCoverage.missingEnKeys,
      seoMissing: missingSeoFields(product),
    },
    attributes: attributes.map((item) => ({
      template: item.template_title_en || item.template_title_zh,
      option: item.label_en || item.label_zh,
    })),
    visibleDetailModules: visibleDetailModules.map((module) => labelForModule(module)).slice(0, 12),
    issues,
    ownerRecommendations: issues.map((issue) => ({ issue, owner: ownerForIssue(issue) })),
  }
}

async function loadProducts(client) {
  const { rows } = await client.query(
    `SELECT
       pc.id,
       pc.product_series,
       pc.name_cn,
       pc.name_en,
       pc.status,
       pc.detail_slug,
       pc.category_id,
       c.slug AS category_slug,
       c.title_zh AS category_title_zh,
       c.title_en AS category_title_en,
       c.status AS category_status,
       pc.image,
       pc.gallery,
       pc.specs_cn,
       pc.specs_en,
       pc.detail_modules,
       pc.price_display_zh,
       pc.price_display_en,
       pc.commercial_terms,
       pc.keywords_zh,
       pc.keywords_en,
       pc.related_product_ids,
       pc.seo_title_zh,
       pc.seo_title_en,
       pc.seo_description_zh,
       pc.seo_description_en,
       pc.updated_at::text AS updated_at
     FROM product_catalog pc
     LEFT JOIN product_categories c
       ON c.id = pc.category_id
      AND c.deleted_at IS NULL
     WHERE pc.deleted_at IS NULL
       AND pc.status = 'published'
       AND pc.id = ANY($1::text[])
     ORDER BY array_position($1::text[], pc.id)`,
    [targetIds],
  )
  return rows
}

async function loadAttributes(client, productIds) {
  if (productIds.length === 0) return new Map()

  const { rows } = await client.query(
    `SELECT
       pav.product_id,
       t.title_zh AS template_title_zh,
       t.title_en AS template_title_en,
       o.label_zh,
       o.label_en
     FROM product_attribute_values pav
     JOIN product_attribute_templates t
       ON t.id = pav.template_id
      AND t.deleted_at IS NULL
     JOIN product_attribute_options o
       ON o.id = pav.option_id
      AND o.deleted_at IS NULL
     WHERE pav.product_id = ANY($1::text[])
     ORDER BY pav.product_id, t.sort_order ASC, o.sort_order ASC, o.id ASC`,
    [productIds],
  )

  const byProduct = new Map()
  for (const row of rows) {
    const list = byProduct.get(row.product_id) ?? []
    list.push(row)
    byProduct.set(row.product_id, list)
  }
  return byProduct
}

const client = await pool.connect()
try {
  await client.query('BEGIN READ ONLY')
  const products = await loadProducts(client)
  const attributesByProduct = await loadAttributes(client, products.map((product) => product.id))
  await client.query('COMMIT')

  const samples = products.map((product) => summarizeProduct(product, attributesByProduct))
  const missingRequestedIds = targetIds.filter((id) => !products.some((product) => product.id === id))

  console.log(JSON.stringify({
    audit: 'product-sample-readiness',
    mode: 'read-only',
    generatedAt: new Date().toISOString(),
    requestedSampleIds: targetIds,
    missingRequestedIds,
    summary: {
      samplesFound: samples.length,
      completeSamples: samples.filter((product) => product.issues.length === 0).length,
      samplesWithIssues: samples.filter((product) => product.issues.length > 0).length,
      issueCounts: samples.reduce((acc, product) => {
        for (const issue of product.issues) acc[issue] = (acc[issue] ?? 0) + 1
        return acc
      }, {}),
    },
    samples,
    notes: [
      'Product scope is published product_catalog rows with deleted_at IS NULL.',
      'Default scope is E7, V9, E6, E3, and optional S5 as a sample set, not all products.',
      'This audit only reads database state inside BEGIN READ ONLY.',
      'No connection strings, credentials, or environment values are printed.',
    ],
  }, null, 2))
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  const message = err instanceof Error ? err.message : String(err)
  throw new Error(`Product sample readiness audit failed: ${message}`)
} finally {
  client.release()
  await pool.end()
}
