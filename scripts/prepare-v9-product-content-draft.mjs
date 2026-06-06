import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const TARGET_PRODUCT_ID = 'v9-gen6-standard'
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

const ATTRIBUTE_CANDIDATES = [
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
    rationale: 'V9 current copy says electrical, utility and destination requirements need quotation-stage review.',
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
]

const COMMERCIAL_TERM_ZH_DRAFTS = {
  delivery_method_zh: '工厂完成模块化整装，目的地交付方案按项目范围确认。',
  shipping_location_zh: '发货起点与目的地路线在报价阶段确认。',
  payment_terms_zh: '报价与付款条款按项目范围确认。',
  delivery_time_zh: '交付周期将在确认型号组合、数量和目的地物流后确定。',
  electrical_standard_zh: '电气与水电标准按目的地要求确认。',
  warranty_support_zh: '售后支持按目的地和项目配置评估。',
  moq_zh: '按型号、定制程度和项目范围确认。',
}

const V9_SEO_ZH_DRAFT = {
  seo_title_zh: 'V9 Gen6 旗舰家居版 | VESSEL 产品中心',
  seo_description_zh:
    '了解 VESSEL V9 Gen6 旗舰家居版的空间布局、技术参数、图库、买家资料和项目咨询路径，适用于长住型度假别墅、精品营地和目的地住宿项目。',
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
  if (product.id === TARGET_PRODUCT_ID) return '/products/v9-gen6'
  if (hasText(product.detail_slug)) return `/products/${product.detail_slug.trim()}`
  return `/products/${product.id}`
}

function optionIndex(options) {
  const bySlug = new Map()
  for (const option of options) {
    bySlug.set(`${option.template_slug}:${option.option_slug}`, option)
  }
  return bySlug
}

function resolveAttributeCandidates(options) {
  const bySlug = optionIndex(options)
  const resolved = []
  const missing = []

  for (const candidate of ATTRIBUTE_CANDIDATES) {
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

function commercialTermsDraft(product) {
  const currentTerms = asObject(product.commercial_terms)
  return Object.fromEntries(
    COMMERCIAL_TERM_PAIRS.flatMap(([zh, en]) => [
      [zh, hasText(currentTerms[zh]) ? currentTerms[zh].trim() : COMMERCIAL_TERM_ZH_DRAFTS[zh]],
      [en, hasText(currentTerms[en]) ? currentTerms[en].trim() : ''],
    ]),
  )
}

function seoDraft(product) {
  return {
    seo_title_zh: hasText(product.seo_title_zh) ? product.seo_title_zh.trim() : V9_SEO_ZH_DRAFT.seo_title_zh,
    seo_title_en: hasText(product.seo_title_en) ? product.seo_title_en.trim() : null,
    seo_description_zh: hasText(product.seo_description_zh)
      ? product.seo_description_zh.trim()
      : V9_SEO_ZH_DRAFT.seo_description_zh,
    seo_description_en: hasText(product.seo_description_en) ? product.seo_description_en.trim() : null,
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

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanInternalPublicCopy(item, `${path}[${index}]`))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => scanInternalPublicCopy(entry, `${path}.${key}`))
  }

  return []
}

function currentMissing(product, attributes) {
  const missing = []
  const termsCoverage = commercialTermCoverage(product.commercial_terms)
  const publicCopyDrafts = scanInternalPublicCopy(product.detail_modules)
  if (attributes.length === 0) missing.push('attributes')
  if (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) missing.push('price_display')
  if (termsCoverage.zhFields === 0) missing.push('commercial_terms_zh')
  if (termsCoverage.enFields === 0) missing.push('commercial_terms_en')
  if (!hasText(product.seo_title_zh) || !hasText(product.seo_description_zh)) missing.push('seo_zh')
  if (publicCopyDrafts.length > 0) missing.push('public_copy_cleanup')
  return missing
}

function referenceSummary(references) {
  return references.map((product) => {
    const termsCoverage = commercialTermCoverage(product.commercial_terms)
    return {
      id: product.id,
      label: product.name_en || product.name_cn || product.id,
      price_display_zh: product.price_display_zh,
      price_display_en: product.price_display_en,
      commercialTermsZhFields: termsCoverage.zhFields,
      commercialTermsEnFields: termsCoverage.enFields,
      seoZhReady: hasText(product.seo_title_zh) && hasText(product.seo_description_zh),
    }
  })
}

async function loadProduct(client, id) {
  const { rows } = await client.query(
    `SELECT
       id,
       product_series,
       name_cn,
       name_en,
       size,
       area,
       detail_slug,
       status,
       category_id,
       price_display_zh,
       price_display_en,
       commercial_terms,
       keywords_zh,
       keywords_en,
       related_product_ids,
       detail_modules,
       seo_title_zh,
       seo_title_en,
       seo_description_zh,
       seo_description_en,
       updated_at::text AS updated_at
     FROM product_catalog
     WHERE id = $1
       AND deleted_at IS NULL`,
    [id],
  )
  return rows[0] ?? null
}

async function loadReferenceProducts(client) {
  const { rows } = await client.query(
    `SELECT
       id,
       name_cn,
       name_en,
       price_display_zh,
       price_display_en,
       commercial_terms,
       seo_title_zh,
       seo_description_zh
     FROM product_catalog
     WHERE id = ANY($1::text[])
       AND status = 'published'
       AND deleted_at IS NULL
     ORDER BY array_position($1::text[], id)`,
    [REFERENCE_PRODUCT_IDS],
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

async function loadAttributes(client, productId) {
  const { rows } = await client.query(
    `SELECT
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
     WHERE pav.product_id = $1
     ORDER BY t.sort_order ASC, o.sort_order ASC, o.id ASC`,
    [productId],
  )
  return rows
}

const client = await pool.connect()
try {
  await client.query('BEGIN READ ONLY')
  const product = await loadProduct(client, TARGET_PRODUCT_ID)
  const referenceProducts = await loadReferenceProducts(client)
  const attributeOptions = await loadAttributeOptions(client)
  const currentAttributes = await loadAttributes(client, TARGET_PRODUCT_ID)
  await client.query('COMMIT')

  if (!product) {
    throw new Error(`Product not found: ${TARGET_PRODUCT_ID}`)
  }

  const price = priceDraft(product, referenceProducts)
  const attributes = resolveAttributeCandidates(attributeOptions)
  const termsCoverage = commercialTermCoverage(product.commercial_terms)
  const draftTerms = commercialTermsDraft(product)
  const draftSeo = seoDraft(product)
  const publicCopyCleanupDrafts = scanInternalPublicCopy(product.detail_modules)

  console.log(JSON.stringify({
    draft: 'v9-product-content-draft',
    mode: 'read-only-draft',
    generatedAt: new Date().toISOString(),
    target: {
      id: product.id,
      label: product.name_en || product.name_cn || product.id,
      publicHref: publicHref(product),
      status: product.status,
      area: product.area,
      size: product.size,
      updatedAt: product.updated_at,
    },
    currentReadiness: {
      missingItems: currentMissing(product, currentAttributes),
      currentAttributeCount: currentAttributes.length,
      currentAttributeOptionIds: currentAttributes.map((item) => item.option_id),
      priceDisplayZhReady: hasText(product.price_display_zh),
      priceDisplayEnReady: hasText(product.price_display_en),
      commercialTermsZhFields: termsCoverage.zhFields,
      commercialTermsEnFields: termsCoverage.enFields,
      missingCommercialTermZhKeys: termsCoverage.missingZhKeys,
      missingCommercialTermEnKeys: termsCoverage.missingEnKeys,
      seoTitleZhReady: hasText(product.seo_title_zh),
      seoDescriptionZhReady: hasText(product.seo_description_zh),
    },
    suggestedAdminFormPayload: {
      price_display_zh: price.price_display_zh,
      price_display_en: price.price_display_en,
      commercial_terms: draftTerms,
      attribute_option_ids: attributes.suggestedOptionIds,
      seo_title_zh: draftSeo.seo_title_zh,
      seo_title_en: draftSeo.seo_title_en,
      seo_description_zh: draftSeo.seo_description_zh,
      seo_description_en: draftSeo.seo_description_en,
    },
    publicCopyCleanupDrafts,
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
      reviewNote: 'Candidate ids come from visible controlled admin options and should be reviewed before a real publish.',
    },
    fieldDraftNotes: {
      price: {
        source: 'Matched the existing complete E7/E6/E3 published sample pattern.',
        referenceSignals: price.referenceSignals,
        requiresBusinessConfirmation: price.requiresBusinessConfirmation,
      },
      commercialTerms: {
        source: 'Chinese terms are draft translations of the existing V9 English terms.',
        requiresBusinessConfirmation: true,
      },
      seo: {
        source: 'Chinese SEO draft is based on current V9 published name, area, specs, buyer materials and inquiry path.',
        requiresBusinessConfirmation: true,
      },
      attributes: {
        source: 'Candidate controlled options are derived from current V9 copy/specs and complete sample product patterns.',
        requiresBusinessConfirmation: true,
      },
      publicCopyCleanup: {
        source: 'Detected public text that exposes internal CMS/stage wording in current V9 detail_modules.',
        requiresBusinessConfirmation: true,
      },
    },
    referenceProducts: referenceSummary(referenceProducts),
    notes: [
      'This script reads product_catalog and product attribute tables inside BEGIN READ ONLY.',
      'The output is a draft for 02 review; it is not published content and does not change the database.',
      'No 300 backend page was opened or changed by this script.',
      'No connection strings, credentials, or environment values are printed.',
      'No SQL mutation statement is generated.',
    ],
  }, null, 2))
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  const message = err instanceof Error ? err.message : String(err)
  throw new Error(`V9 product content draft failed: ${message}`)
} finally {
  client.release()
  await pool.end()
}
