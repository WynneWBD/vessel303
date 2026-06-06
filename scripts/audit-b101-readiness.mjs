import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()

const HOME_MODULE_KEYS = [
  'hero',
  'credentials',
  'model-strip',
  'scenario-tiles',
  'large-product-cards',
]

const PRODUCT_ISSUES = [
  'category',
  'attributes',
  'cover_gallery',
  'detail_modules',
  'seo',
  'price_display',
  'commercial_terms',
  'commercial_terms_zh',
  'commercial_terms_en',
  'keywords',
  'related_products',
  'buyer_resources',
]

const COMMERCIAL_TERM_PAIRS = [
  ['delivery_method_zh', 'delivery_method_en'],
  ['shipping_location_zh', 'shipping_location_en'],
  ['payment_terms_zh', 'payment_terms_en'],
  ['delivery_time_zh', 'delivery_time_en'],
  ['electrical_standard_zh', 'electrical_standard_en'],
  ['warranty_support_zh', 'warranty_support_en'],
  ['moq_zh', 'moq_en'],
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

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function objectHasValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).some((entry) => {
    if (typeof entry === 'string') return entry.trim().length > 0
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
  }
}

function labelForItem(item) {
  const label = item?.label_en || item?.label_zh || item?.title_en || item?.title_zh || item?.id || 'unknown'
  return String(label).replace(/\s+/g, ' ').trim().slice(0, 80)
}

function productLabel(product) {
  const name = product.name_en || product.name_cn || product.id
  return `${product.id} (${String(name).replace(/\s+/g, ' ').trim().slice(0, 80)})`
}

function detailModulesHaveVisibleModule(value) {
  return asArray(value).some((module) => module && module.is_visible !== false)
}

function isBuyerResourceModule(module) {
  if (!module || typeof module !== 'object' || module.is_visible === false) return false
  const marker = [module.id, module.title_en, module.title_cn]
    .map((entry) => (typeof entry === 'string' ? entry.toLowerCase() : ''))
    .join(' ')
  return /buyer|download|resource|material/.test(marker)
}

function detailModulesHaveBuyerResourceLinks(value) {
  return asArray(value)
    .filter(isBuyerResourceModule)
    .some((module) => {
      const items = [
        ...asArray(module.links),
        ...asArray(module.items),
        ...asArray(module.items_en),
        ...asArray(module.items_cn),
      ]
      return items.some((item) => hasText(item?.href))
    })
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

function summarizeHomeModule(moduleKey, row) {
  if (!row) {
    return {
      moduleKey,
      moduleVisible: false,
      exists: false,
      publishedItems: 0,
      visibleItems: 0,
      fieldCounts: { image: 0, video: 0, poster: 0, href: 0 },
      missingCounts: { image: 0, video: 0, poster: 0, href: 0 },
      examples: { missingImage: [], missingVideo: [], missingPoster: [], missingHref: [] },
      updatedAt: null,
    }
  }

  const items = asArray(row.items)
  const visibleItems = items.filter((item) => item?.is_visible !== false)

  const fieldCounts = {
    image: visibleItems.filter((item) => hasText(item?.image_url)).length,
    video: visibleItems.filter((item) => hasText(item?.video_url)).length,
    poster: visibleItems.filter((item) => hasText(item?.video_poster_url)).length,
    href: visibleItems.filter((item) => hasText(item?.href)).length,
  }
  const missingExamples = {
    missingImage: visibleItems.filter((item) => !hasText(item?.image_url)).slice(0, 5).map(labelForItem),
    missingVideo: visibleItems.filter((item) => !hasText(item?.video_url)).slice(0, 5).map(labelForItem),
    missingPoster: visibleItems.filter((item) => !hasText(item?.video_poster_url)).slice(0, 5).map(labelForItem),
    missingHref: visibleItems.filter((item) => !hasText(item?.href)).slice(0, 5).map(labelForItem),
  }

  return {
    moduleKey: row.module_key,
    moduleVisible: row.is_visible === true,
    exists: true,
    publishedItems: items.length,
    visibleItems: visibleItems.length,
    fieldCounts,
    missingCounts: {
      image: visibleItems.length - fieldCounts.image,
      video: visibleItems.length - fieldCounts.video,
      poster: visibleItems.length - fieldCounts.poster,
      href: visibleItems.length - fieldCounts.href,
    },
    examples: missingExamples,
    updatedAt: row.updated_at,
  }
}

function productIssues(product) {
  const issues = []
  const gallery = asArray(product.gallery)
  const keywordsZh = asArray(product.keywords_zh)
  const keywordsEn = asArray(product.keywords_en)
  const relatedProductIds = asArray(product.related_product_ids)
  const seoMissing = missingSeoFields(product)
  const commercialTerms = objectHasValue(product.commercial_terms)
  const termsCoverage = commercialTermCoverage(product.commercial_terms)

  if (!product.category_id || product.category_status !== 'visible') issues.push('category')
  if (Number(product.attribute_count ?? 0) === 0) issues.push('attributes')
  if (!hasText(product.image) || gallery.length === 0) issues.push('cover_gallery')
  if (!detailModulesHaveVisibleModule(product.detail_modules)) issues.push('detail_modules')
  if (seoMissing.length > 0) issues.push('seo')
  if (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) issues.push('price_display')
  if (!commercialTerms) {
    issues.push('commercial_terms')
  } else {
    if (termsCoverage.zhFields === 0) issues.push('commercial_terms_zh')
    if (termsCoverage.enFields === 0) issues.push('commercial_terms_en')
  }
  if (keywordsZh.length === 0 && keywordsEn.length === 0) issues.push('keywords')
  if (relatedProductIds.length === 0) issues.push('related_products')
  if (!detailModulesHaveBuyerResourceLinks(product.detail_modules)) issues.push('buyer_resources')

  return issues
}

function productDetail(product) {
  const issues = productIssues(product)
  const termsCoverage = commercialTermCoverage(product.commercial_terms)
  return {
    id: product.id,
    label: productLabel(product),
    issueCount: issues.length,
    issues,
    missingSeoFields: missingSeoFields(product),
    counts: {
      attributes: Number(product.attribute_count ?? 0),
      galleryImages: asArray(product.gallery).length,
      visibleDetailModules: asArray(product.detail_modules).filter((module) => module?.is_visible !== false).length,
      priceDisplayZh: hasText(product.price_display_zh) ? 1 : 0,
      priceDisplayEn: hasText(product.price_display_en) ? 1 : 0,
      keywordsZh: asArray(product.keywords_zh).length,
      keywordsEn: asArray(product.keywords_en).length,
      relatedProducts: asArray(product.related_product_ids).length,
      buyerResourceLinks: detailModulesHaveBuyerResourceLinks(product.detail_modules) ? 1 : 0,
      commercialTermsZhFields: termsCoverage.zhFields,
      commercialTermsEnFields: termsCoverage.enFields,
    },
  }
}

async function loadHomeModules(client) {
  const res = await client.query(
    `SELECT
       module_key,
       items,
       is_visible,
       sort_order,
       updated_at::text AS updated_at
     FROM page_modules
     WHERE page_key = 'home'
       AND module_key = ANY($1::text[])
     ORDER BY array_position($1::text[], module_key)`,
    [HOME_MODULE_KEYS],
  )
  const rowsByKey = new Map(res.rows.map((row) => [row.module_key, row]))
  const modules = HOME_MODULE_KEYS.map((key) => summarizeHomeModule(key, rowsByKey.get(key)))

  return {
    moduleKeys: HOME_MODULE_KEYS,
    summary: {
      modulesExpected: HOME_MODULE_KEYS.length,
      modulesFound: res.rows.length,
      modulesVisible: modules.filter((module) => module.moduleVisible).length,
      visibleItems: modules.reduce((sum, module) => sum + module.visibleItems, 0),
      imageBackedItems: modules.reduce((sum, module) => sum + module.fieldCounts.image, 0),
      videoBackedItems: modules.reduce((sum, module) => sum + module.fieldCounts.video, 0),
      posterBackedItems: modules.reduce((sum, module) => sum + module.fieldCounts.poster, 0),
      hrefBackedItems: modules.reduce((sum, module) => sum + module.fieldCounts.href, 0),
    },
    modules,
  }
}

async function loadProducts(client) {
  const res = await client.query(
    `SELECT
       pc.id,
       pc.product_series,
       pc.name_cn,
       pc.name_en,
       pc.category_id,
       c.status AS category_status,
       pc.image,
       pc.gallery,
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
       COALESCE(attr.attribute_count, 0)::int AS attribute_count,
       pc.updated_at::text AS updated_at
     FROM product_catalog pc
     LEFT JOIN product_categories c
       ON c.id = pc.category_id
      AND c.deleted_at IS NULL
     LEFT JOIN (
       SELECT product_id, COUNT(*)::int AS attribute_count
       FROM product_attribute_values
       GROUP BY product_id
     ) attr
       ON attr.product_id = pc.id
     WHERE pc.deleted_at IS NULL
       AND pc.status = 'published'
     ORDER BY pc.sort_order ASC, pc.updated_at DESC`,
  )

  const products = res.rows.map(productDetail)
  const issueCounts = Object.fromEntries(PRODUCT_ISSUES.map((issue) => [issue, 0]))
  const topMissingExamples = Object.fromEntries(PRODUCT_ISSUES.map((issue) => [issue, []]))

  for (const product of products) {
    for (const issue of product.issues) {
      issueCounts[issue] += 1
      if (topMissingExamples[issue].length < 5) topMissingExamples[issue].push(product.label)
    }
  }

  return {
    summary: {
      publishedProducts: products.length,
      completeProducts: products.filter((product) => product.issueCount === 0).length,
      productsWithMissingItems: products.filter((product) => product.issueCount > 0).length,
      issueCounts,
    },
    topMissingExamples,
    productsWithMostMissing: products
      .filter((product) => product.issueCount > 0)
      .sort((a, b) => b.issueCount - a.issueCount || a.id.localeCompare(b.id))
      .slice(0, 10),
  }
}

const client = await pool.connect()
try {
  await client.query('BEGIN READ ONLY')
  const home = await loadHomeModules(client)
  const products = await loadProducts(client)
  await client.query('COMMIT')

  console.log(JSON.stringify({
    audit: 'b101-readiness',
    mode: 'read-only',
    generatedAt: new Date().toISOString(),
    home,
    products,
    notes: [
      'Home page_modules are treated as published live content; item visibility uses is_visible !== false.',
      'Home missingCounts are raw field coverage counts; not every heading, CTA, or stat item is expected to have every media field.',
      'buyer_resources follows the public product detail rule: visible module id/title must mention buyer/download/resource/material and include at least one href.',
      'Product scope is product_catalog rows where status=published and deleted_at IS NULL.',
      'No connection strings, credentials, or environment values are printed.',
    ],
  }, null, 2))
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  const message = err instanceof Error ? err.message : String(err)
  throw new Error(`B101 readiness audit failed: ${message}`)
} finally {
  client.release()
  await pool.end()
}
