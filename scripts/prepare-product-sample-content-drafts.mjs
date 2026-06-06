import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()

const DEFAULT_TARGET_PRODUCT_IDS = ['v9-gen6-standard', 's5-gen5-standard']
const REFERENCE_PRODUCT_IDS = ['e7-gen6-flagship', 'e6-gen6-standard', 'e3-gen6-standard']

const COMMERCIAL_TERM_PAIRS = [
  ['delivery_method_zh', 'delivery_method_en'],
  ['shipping_location_zh', 'shipping_location_en'],
  ['payment_terms_zh', 'payment_terms_en'],
  ['delivery_time_zh', 'delivery_time_en'],
  ['electrical_standard_zh', 'electrical_standard_en'],
  ['warranty_support_zh', 'warranty_support_en'],
  ['moq_zh', 'moq_en'],
]

const CATEGORY_CANDIDATES = {
  's5-gen5-standard': {
    slug: 'standard-products',
    rationale: 'S5 is currently published as a standard catalog product sample, not an overseas custom case.',
  },
}

const ATTRIBUTE_CANDIDATES = {
  'v9-gen6-standard': [
    {
      templateSlug: 'application-scenario',
      optionSlugs: ['resort-camp', 'hotel-hospitality'],
      rationale: 'V9 current copy describes long-stay resort villas and residential-style hospitality projects.',
    },
    {
      templateSlug: 'delivery-method',
      optionSlugs: ['modular-assembly'],
      rationale: 'V9 current copy describes factory-prefabricated delivery; flat-rack shipping remains a spec detail.',
    },
    {
      templateSlug: 'compliance-standard',
      optionSlugs: ['project-specific'],
      rationale: 'V9 current copy says electrical, utility, and destination requirements need quotation-stage review.',
    },
    {
      templateSlug: 'climate-adaptation',
      optionSlugs: ['coastal-site'],
      rationale: 'Use the same visible resort-site baseline as the complete E7/E6 samples; confirm before real publish.',
    },
    {
      templateSlug: 'configuration-level',
      optionSlugs: ['flagship'],
      rationale: 'V9 is named and described as the flagship residential edition.',
    },
    {
      templateSlug: 'default-configuration',
      optionSlugs: ['resort-flagship'],
      rationale: 'Closest existing controlled option for the current V9 flagship resort positioning.',
    },
    {
      templateSlug: 'product-configuration',
      optionSlugs: ['resort-flagship'],
      rationale: 'Closest existing controlled option for the current V9 flagship resort positioning.',
    },
    {
      templateSlug: 'area',
      optionSlugs: ['30-39'],
      rationale: 'V9 current product area is 38.8 sqm.',
    },
    {
      templateSlug: 'country',
      optionSlugs: ['china', 'us'],
      rationale: 'Matches the complete E7/E6/E3 published sample baseline for catalog filtering.',
    },
  ],
  's5-gen5-standard': [
    {
      templateSlug: 'application-scenario',
      optionSlugs: ['resort-camp', 'hotel-hospitality'],
      rationale: 'S5 current specs describe classic guest rooms, scenic camps, and resort cabin projects.',
    },
    {
      templateSlug: 'delivery-method',
      optionSlugs: ['modular-assembly'],
      rationale: 'Use the controlled product-catalog delivery baseline; confirm logistics scope before publish.',
    },
    {
      templateSlug: 'compliance-standard',
      optionSlugs: ['project-specific'],
      rationale: 'S5 does not currently expose a confirmed destination certification; keep it project-specific.',
    },
    {
      templateSlug: 'configuration-level',
      optionSlugs: ['standard'],
      rationale: 'S5 is a classic standard sample rather than a flagship configuration.',
    },
    {
      templateSlug: 'default-configuration',
      optionSlugs: ['pro-full'],
      rationale: 'Closest existing controlled option used by the complete 20-29 sqm E6 sample; confirm before publish.',
    },
    {
      templateSlug: 'product-configuration',
      optionSlugs: ['pro-full'],
      rationale: 'Closest existing controlled option used by the complete 20-29 sqm E6 sample; confirm before publish.',
    },
    {
      templateSlug: 'area',
      optionSlugs: ['20-29'],
      rationale: 'S5 current product area is 28 sqm.',
    },
    {
      templateSlug: 'country',
      optionSlugs: ['china', 'us'],
      rationale: 'Matches the complete E7/E6/E3 published sample baseline for catalog filtering.',
    },
  ],
}

const INTERNAL_PUBLIC_COPY_PATTERNS = [
  { code: 'future_cms', pattern: /future\s+CMS/i },
  { code: 'pricing_stage_one', pattern: /stage\s+one\s+keeps\s+pricing/i },
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

function parseRequestedTargetIds(argv) {
  const ids = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]?.trim()
    if (!arg) continue

    if (arg === '--json' || arg === '--strict') continue
    if (arg === '--base-url' || arg === '--old-base-url') {
      index += 1
      continue
    }
    if (arg.startsWith('--')) continue

    ids.push(arg)
  }

  return Array.from(new Set(ids))
}

const targetProductIds = parseRequestedTargetIds(process.argv.slice(2))
const targetIds = targetProductIds.length > 0 ? targetProductIds.slice(0, 8) : DEFAULT_TARGET_PRODUCT_IDS

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function commercialTermCoverage(value) {
  const terms = asObject(value)
  return COMMERCIAL_TERM_PAIRS.reduce((acc, [zh, en]) => {
    if (hasText(terms[zh])) acc.zhFields += 1
    else acc.missingZhKeys.push(zh)
    if (hasText(terms[en])) acc.enFields += 1
    else acc.missingEnKeys.push(en)
    return acc
  }, {
    zhFields: 0,
    enFields: 0,
    missingZhKeys: [],
    missingEnKeys: [],
  })
}

function publicHref(product) {
  if (product.id === 'v9-gen6-standard') return '/products/v9-gen6'
  if (hasText(product.detail_slug)) return `/products/${product.detail_slug.trim()}`
  return `/products/${product.id}`
}

function optionIndex(options) {
  const bySlug = new Map()
  for (const option of options) bySlug.set(`${option.template_slug}:${option.option_slug}`, option)
  return bySlug
}

function resolveAttributeCandidates(productId, options) {
  const profile = ATTRIBUTE_CANDIDATES[productId] ?? []
  const bySlug = optionIndex(options)
  const resolved = []
  const missing = []

  for (const candidate of profile) {
    for (const optionSlug of candidate.optionSlugs) {
      const key = `${candidate.templateSlug}:${optionSlug}`
      const option = bySlug.get(key)
      if (!option) {
        missing.push(key)
        continue
      }
      resolved.push({
        templateId: option.template_id,
        templateSlug: option.template_slug,
        templateTitleZh: option.template_title_zh,
        templateTitleEn: option.template_title_en,
        optionId: option.option_id,
        optionSlug: option.option_slug,
        labelZh: option.label_zh,
        labelEn: option.label_en,
        rationale: candidate.rationale,
      })
    }
  }

  return {
    suggestedOptionIds: resolved.map((option) => option.optionId),
    resolved,
    missing,
    requiresBusinessConfirmation: resolved.length > 0,
  }
}

function collectUniqueReferenceValues(references, field) {
  return Array.from(new Set(
    references
      .map((product) => product[field])
      .filter(hasText)
      .map((value) => value.trim()),
  ))
}

function priceDraft(product, references) {
  const zhValues = collectUniqueReferenceValues(references, 'price_display_zh')
  const enValues = collectUniqueReferenceValues(references, 'price_display_en')
  return {
    price_display_zh: hasText(product.price_display_zh) ? product.price_display_zh.trim() : zhValues[0] ?? null,
    price_display_en: hasText(product.price_display_en) ? product.price_display_en.trim() : enValues[0] ?? null,
    referenceSignals: {
      zhValues,
      enValues,
      sourceProductIds: references.map((item) => item.id),
    },
    requiresBusinessConfirmation: !hasText(product.price_display_zh) || !hasText(product.price_display_en),
  }
}

function bestReferenceTerms(references) {
  return asObject(references.find((product) => {
    const coverage = commercialTermCoverage(product.commercial_terms)
    return coverage.zhFields > 0 && coverage.enFields > 0
  })?.commercial_terms)
}

function commercialTermsDraft(product, references) {
  const currentTerms = asObject(product.commercial_terms)
  const referenceTerms = bestReferenceTerms(references)
  const fieldSources = {}
  const commercial_terms = Object.fromEntries(
    COMMERCIAL_TERM_PAIRS.flatMap(([zh, en]) => {
      const zhValue = hasText(currentTerms[zh]) ? currentTerms[zh].trim() : referenceTerms[zh] ?? null
      const enValue = hasText(currentTerms[en]) ? currentTerms[en].trim() : referenceTerms[en] ?? null
      fieldSources[zh] = hasText(currentTerms[zh]) ? 'current_product' : hasText(referenceTerms[zh]) ? 'reference_complete_sample' : 'missing'
      fieldSources[en] = hasText(currentTerms[en]) ? 'current_product' : hasText(referenceTerms[en]) ? 'reference_complete_sample' : 'missing'
      return [[zh, zhValue], [en, enValue]]
    }),
  )
  return {
    commercial_terms,
    fieldSources,
    referenceSourceProductIds: references
      .filter((product) => {
        const coverage = commercialTermCoverage(product.commercial_terms)
        return coverage.zhFields > 0 && coverage.enFields > 0
      })
      .map((product) => product.id),
    requiresBusinessConfirmation: true,
  }
}

function categoryDraft(product, categories) {
  const current = product.category_id
    ? {
        id: product.category_id,
        slug: product.category_slug,
        titleZh: product.category_title_zh,
        titleEn: product.category_title_en,
        status: product.category_status,
      }
    : null
  const candidateProfile = CATEGORY_CANDIDATES[product.id]
  const candidate = candidateProfile
    ? categories.find((category) => category.slug === candidateProfile.slug && category.status === 'visible')
    : null
  return {
    current,
    suggestedCategoryId: current?.status === 'visible' ? current.id : candidate?.id ?? null,
    suggestedCategorySlug: current?.status === 'visible' ? current.slug : candidate?.slug ?? null,
    suggestedCategoryTitleEn: current?.status === 'visible' ? current.titleEn : candidate?.title_en ?? null,
    rationale: current?.status === 'visible' ? 'Current category is already visible.' : candidateProfile?.rationale ?? null,
    requiresBusinessConfirmation: !current || current.status !== 'visible',
  }
}

function publicCopyReplacement(value) {
  return value
    .replace(
      /Pricing depends on configuration, quantity, destination, and standards\.\s*Stage one keeps pricing managed by sales or future CMS fields\./i,
      'Pricing depends on configuration, quantity, destination, and applicable standards. Submit a project brief so the sales team can confirm quotation scope and schedule.',
    )
    .replace(
      /Stage one keeps pricing managed by sales or future CMS fields\./i,
      'Pricing is confirmed after project scope review.',
    )
    .replace(/future\s+CMS\s+fields/gi, 'the confirmed project scope')
}

function scanInternalPublicCopy(value, path = 'product') {
  if (typeof value === 'string') {
    const matches = INTERNAL_PUBLIC_COPY_PATTERNS
      .filter((item) => item.pattern.test(value))
      .map((item) => item.code)
    if (matches.length === 0) return []
    const suggestedValue = publicCopyReplacement(value)
    return [{
      path,
      issueCodes: matches,
      currentValue: value,
      suggestedValue: suggestedValue === value ? null : suggestedValue,
      requiresBusinessConfirmation: true,
    }]
  }

  if (Array.isArray(value)) return value.flatMap((item, index) => scanInternalPublicCopy(item, `${path}[${index}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => scanInternalPublicCopy(entry, `${path}.${key}`))
  }
  return []
}

function missingSeoFields(product) {
  return [
    ['seo_title_zh', product.seo_title_zh],
    ['seo_title_en', product.seo_title_en],
    ['seo_description_zh', product.seo_description_zh],
    ['seo_description_en', product.seo_description_en],
  ].filter(([, value]) => !hasText(value)).map(([field]) => field)
}

function currentMissing(product, currentAttributes) {
  const missing = []
  const termsCoverage = commercialTermCoverage(product.commercial_terms)
  if (!product.category_id || product.category_status !== 'visible') missing.push('category')
  if (currentAttributes.length === 0) missing.push('attributes')
  if (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) missing.push('price_display')
  if (termsCoverage.zhFields === 0) missing.push('commercial_terms_zh')
  if (termsCoverage.enFields === 0) missing.push('commercial_terms_en')
  if (missingSeoFields(product).length > 0) missing.push('seo')
  if (scanInternalPublicCopy(product.detail_modules).length > 0) missing.push('public_copy_cleanup')
  return missing
}

function buildDraft(product, currentAttributes, references, categories, attributeOptions) {
  const price = priceDraft(product, references)
  const category = categoryDraft(product, categories)
  const attributes = resolveAttributeCandidates(product.id, attributeOptions)
  const termsCoverage = commercialTermCoverage(product.commercial_terms)
  const terms = commercialTermsDraft(product, references)
  const publicCopyCleanupDrafts = scanInternalPublicCopy(product.detail_modules)

  return {
    target: {
      id: product.id,
      label: product.name_en || product.name_cn || product.id,
      publicHref: publicHref(product),
      status: product.status,
      area: product.area,
      size: product.size,
      detailSlug: product.detail_slug || null,
      updatedAt: product.updated_at,
    },
    currentReadiness: {
      missingItems: currentMissing(product, currentAttributes),
      currentCategoryId: product.category_id,
      currentAttributeCount: currentAttributes.length,
      currentAttributeOptionIds: currentAttributes.map((item) => item.option_id),
      priceDisplayZhReady: hasText(product.price_display_zh),
      priceDisplayEnReady: hasText(product.price_display_en),
      commercialTermsZhFields: termsCoverage.zhFields,
      commercialTermsEnFields: termsCoverage.enFields,
      missingCommercialTermZhKeys: termsCoverage.missingZhKeys,
      missingCommercialTermEnKeys: termsCoverage.missingEnKeys,
      seoMissing: missingSeoFields(product),
    },
    suggestedAdminFormPayload: {
      category_id: category.suggestedCategoryId,
      price_display_zh: price.price_display_zh,
      price_display_en: price.price_display_en,
      commercial_terms: terms.commercial_terms,
      attribute_option_ids: attributes.suggestedOptionIds,
      seo_title_zh: product.seo_title_zh ?? null,
      seo_title_en: product.seo_title_en ?? null,
      seo_description_zh: product.seo_description_zh ?? null,
      seo_description_en: product.seo_description_en ?? null,
    },
    categoryCandidate: category,
    attributeOptionCandidates: {
      resolved: attributes.resolved,
      missingCandidateKeys: attributes.missing,
      currentOptions: currentAttributes.map((item) => ({
        optionId: item.option_id,
        templateSlug: item.template_slug,
        templateTitleZh: item.template_title_zh,
        templateTitleEn: item.template_title_en,
        optionSlug: item.option_slug,
        labelZh: item.label_zh,
        labelEn: item.label_en,
      })),
      requiresBusinessConfirmation: attributes.requiresBusinessConfirmation,
    },
    publicCopyCleanupDrafts,
    fieldDraftNotes: {
      price: {
        source: 'Matched the existing complete E7/E6/E3 published sample pattern when current product value is missing.',
        referenceSignals: price.referenceSignals,
        requiresBusinessConfirmation: price.requiresBusinessConfirmation,
      },
      commercialTerms: {
        source: 'Missing term fields reuse the first complete E7/E6/E3 sample terms as a review draft.',
        fieldSources: terms.fieldSources,
        referenceSourceProductIds: terms.referenceSourceProductIds,
        requiresBusinessConfirmation: terms.requiresBusinessConfirmation,
      },
      category: {
        source: 'Candidate category uses the visible controlled product category list.',
        requiresBusinessConfirmation: category.requiresBusinessConfirmation,
      },
      attributes: {
        source: 'Candidate options use visible controlled admin product attribute options.',
        requiresBusinessConfirmation: attributes.requiresBusinessConfirmation,
      },
      seo: {
        source: 'This generic sample draft does not invent missing SEO copy; use product-specific review for missing SEO fields.',
        requiresBusinessConfirmation: missingSeoFields(product).length > 0,
      },
      publicCopyCleanup: {
        source: 'Detected public text that exposes internal CMS/stage wording in current detail_modules.',
        requiresBusinessConfirmation: publicCopyCleanupDrafts.length > 0,
      },
    },
  }
}

async function loadProducts(client) {
  const { rows } = await client.query(
    `SELECT
       pc.id,
       pc.product_series,
       pc.name_cn,
       pc.name_en,
       pc.size,
       pc.area,
       pc.detail_slug,
       pc.status,
       pc.category_id,
       c.slug AS category_slug,
       c.title_zh AS category_title_zh,
       c.title_en AS category_title_en,
       c.status AS category_status,
       pc.price_display_zh,
       pc.price_display_en,
       pc.commercial_terms,
       pc.detail_modules,
       pc.seo_title_zh,
       pc.seo_title_en,
       pc.seo_description_zh,
       pc.seo_description_en,
       pc.updated_at::text AS updated_at
     FROM product_catalog pc
     LEFT JOIN product_categories c
       ON c.id = pc.category_id
      AND c.deleted_at IS NULL
     WHERE pc.id = ANY($1::text[])
       AND pc.deleted_at IS NULL
     ORDER BY array_position($1::text[], pc.id)`,
    [targetIds],
  )
  return rows
}

async function loadReferenceProducts(client) {
  const { rows } = await client.query(
    `SELECT
       id,
       name_cn,
       name_en,
       price_display_zh,
       price_display_en,
       commercial_terms
     FROM product_catalog
     WHERE id = ANY($1::text[])
       AND status = 'published'
       AND deleted_at IS NULL
     ORDER BY array_position($1::text[], id)`,
    [REFERENCE_PRODUCT_IDS],
  )
  return rows
}

async function loadCategories(client) {
  const { rows } = await client.query(
    `SELECT id, slug, title_zh, title_en, status
     FROM product_categories
     WHERE deleted_at IS NULL
     ORDER BY sort_order ASC, id ASC`,
  )
  return rows
}

async function loadAttributeOptions(client) {
  const { rows } = await client.query(
    `SELECT
       t.id AS template_id,
       t.slug AS template_slug,
       t.title_zh AS template_title_zh,
       t.title_en AS template_title_en,
       o.id AS option_id,
       o.slug AS option_slug,
       o.label_zh,
       o.label_en
     FROM product_attribute_templates t
     JOIN product_attribute_options o
       ON o.template_id = t.id
      AND o.deleted_at IS NULL
      AND o.status = 'visible'
     WHERE t.deleted_at IS NULL
       AND t.status = 'visible'
     ORDER BY t.sort_order ASC, o.sort_order ASC, o.id ASC`,
  )
  return rows
}

async function loadAttributes(client, productIds) {
  if (productIds.length === 0) return new Map()
  const { rows } = await client.query(
    `SELECT
       pav.product_id,
       pav.option_id,
       t.slug AS template_slug,
       t.title_zh AS template_title_zh,
       t.title_en AS template_title_en,
       o.slug AS option_slug,
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
  const references = await loadReferenceProducts(client)
  const categories = await loadCategories(client)
  const attributeOptions = await loadAttributeOptions(client)
  const attributesByProduct = await loadAttributes(client, products.map((product) => product.id))
  await client.query('COMMIT')

  const missingRequestedIds = targetIds.filter((id) => !products.some((product) => product.id === id))
  const drafts = products.map((product) => buildDraft(
    product,
    attributesByProduct.get(product.id) ?? [],
    references,
    categories,
    attributeOptions,
  ))

  console.log(JSON.stringify({
    draft: 'product-sample-content-drafts',
    mode: 'read-only-draft',
    generatedAt: new Date().toISOString(),
    targetIds,
    missingRequestedIds,
    drafts,
    referenceProducts: references.map((product) => ({
      id: product.id,
      label: product.name_en || product.name_cn || product.id,
      price_display_zh: product.price_display_zh,
      price_display_en: product.price_display_en,
      commercialTermsCoverage: commercialTermCoverage(product.commercial_terms),
    })),
    notes: [
      'This script reads product_catalog, product categories, and product attribute tables inside BEGIN READ ONLY.',
      'The output is a draft for 02 review; it is not published content and does not change the database.',
      'No 300 backend page was opened or changed by this script.',
      'No connection strings, credentials, or environment values are printed.',
      'No SQL mutation statement is generated.',
      'All suggested payload values require business review before real CMS save or publish.',
    ],
  }, null, 2))
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  const message = err instanceof Error ? err.message : String(err)
  throw new Error(`Product sample content draft failed: ${message}`)
} finally {
  client.release()
  await pool.end()
}
