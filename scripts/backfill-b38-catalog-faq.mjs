import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')
const assetDir = resolve(root, '..', 'vessel-assets', '300-export', '2026-06-01', 'b38-catalog-faq')

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

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)))
}

function item(id, labelZh, labelEn, sortOrder, extra = {}) {
  return { id, label_zh: labelZh, label_en: labelEn, is_visible: true, sort_order: sortOrder, ...extra }
}

function mergeItems(existing, defaults) {
  const byId = new Map(normalizeArray(existing).map((row) => [row?.id, row]).filter(([id]) => Boolean(id)))
  for (const entry of defaults) byId.set(entry.id, { ...(byId.get(entry.id) ?? {}), ...entry })
  return [...byId.values()].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
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

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function patchPageModule(client, pageKey, moduleKey, defaults, changes, moduleDefaults = null) {
  if (!(await tableExists(client, 'public.page_modules'))) return
  const res = await client.query('SELECT id, items FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1', [pageKey, moduleKey])
  if (res.rowCount === 0) {
    if (!moduleDefaults) return
    changes.push(`${pageKey}:${moduleKey} insert controlled module`)
    if (apply) {
      await client.query(
        `INSERT INTO page_modules (
           id, page_key, module_key, module_type, title_zh, title_en,
           description_zh, description_en, items, is_visible, sort_order
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, true, $10)`,
        [
          `${pageKey}:${moduleKey}`,
          pageKey,
          moduleKey,
          moduleDefaults.moduleType,
          moduleDefaults.titleZh,
          moduleDefaults.titleEn,
          moduleDefaults.descriptionZh,
          moduleDefaults.descriptionEn,
          JSON.stringify(defaults),
          moduleDefaults.sortOrder,
        ],
      )
    }
    return
  }
  const current = normalizeArray(res.rows[0].items)
  const next = mergeItems(current, defaults)
  if (stableJson(current) === stableJson(next)) return
  changes.push(`${pageKey}:${moduleKey} refresh controlled items`)
  if (apply) {
    await client.query('UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1', [res.rows[0].id, JSON.stringify(next)])
  }
}

const productUiItems = [
  item('series-heading', 'Product series', 'Product series', 190),
  item('series-body', 'Browse the catalog by series before filtering by configuration, area, country, or use case.', 'Browse the catalog by series before filtering by configuration, area, country, or use case.', 200),
  item('series-count-suffix', 'models', 'models', 210),
  item('series-cta', 'View series', 'View series', 220),
]

const productRows = [
  {
    id: 'v3-gen5-standard',
    productSeries: 'V3',
    name: 'V3 Gen5 China Standard',
    gen: 'Gen5',
    size: '12.3 sqm',
    area: 12.3,
    generation: 5,
    productType: 'compact',
    badge: 'Compact',
    tags: ['V3', 'Compact', 'Standard'],
    features: ['Compact footprint', 'Fast deployment', 'Standard product reference'],
    image: '/images/products/V3-Gen5_render-01.jpg',
    gallery: ['/images/products/V3-Gen5_render-01.jpg', '/images/products/v3-gen5-standard.jpg', '/images/products/custom_V3-Gen5_grey-exterior-Argentina_01.jpg'],
    specs: [
      { label: 'Product family', value: 'V3 compact cabin' },
      { label: 'Reference area', value: '12.3 sqm' },
      { label: 'Project fit', value: 'Compact guest rooms, pilot camps, and small site support units' },
    ],
    resources: [{ title: 'Request V3 buyer pack', href: '/media-kit', body: 'Request product images, compact cabin planning notes, and configuration references.' }],
    keywords: ['V3 Gen5', 'compact prefab cabin', 'small modular cabin'],
    sortOrder: 180,
  },
  {
    id: 'v5-custom-taiwan',
    productSeries: 'V5',
    name: 'V5 Gen5 Double Wood Grain Taiwan',
    gen: 'Gen5',
    size: '24.8 sqm',
    area: 24.8,
    generation: 5,
    productType: 'standard',
    badge: 'Double Module',
    tags: ['V5', 'Double Module', 'Wood Grain'],
    features: ['Double-module layout', 'Wood grain exterior reference', 'Project customization reference'],
    image: '/images/products/custom_V5-Gen5_woodgrain-double-Taiwan_01.jpg',
    gallery: ['/images/products/custom_V5-Gen5_woodgrain-double-Taiwan_01.jpg', '/images/products/V5-Gen5_render-01.jpg', '/images/products/v5-custom-taiwan.jpg'],
    specs: [
      { label: 'Product family', value: 'V5 custom modular unit' },
      { label: 'Reference area', value: '24.8 sqm per module' },
      { label: 'Project fit', value: 'Resort expansions, connected rooms, and custom exterior projects' },
    ],
    resources: [{ title: 'Request V5 buyer pack', href: '/media-kit', body: 'Request V5 exterior, layout, and project reference materials.' }],
    keywords: ['V5 Gen5', 'double module prefab cabin', 'wood grain modular unit'],
    sortOrder: 190,
  },
  {
    id: 'v7-custom-reception',
    productSeries: 'V7',
    name: 'V7 Gen5 Reception Room',
    gen: 'Gen5',
    size: '30 sqm',
    area: 30,
    generation: 5,
    productType: 'standard',
    badge: 'Reception',
    tags: ['V7', 'Reception', 'Commercial'],
    features: ['Reception layout', 'Commercial use case', 'Brand-facing modular space'],
    image: '/images/products/custom_V7-Gen5_reception_01.jpg',
    gallery: ['/images/products/custom_V7-Gen5_reception_01.jpg', '/images/products/v7-custom-reception.jpg', '/images/products/custom_V7-Gen5_double-NewZealand_01.jpg'],
    specs: [
      { label: 'Product family', value: 'V7 commercial reception unit' },
      { label: 'Reference area', value: '30 sqm' },
      { label: 'Project fit', value: 'Reception rooms, branded commercial spaces, and project service points' },
    ],
    resources: [{ title: 'Request V7 buyer pack', href: '/media-kit', body: 'Request V7 reception room images and commercial configuration notes.' }],
    keywords: ['V7 Gen5', 'reception modular unit', 'commercial prefab space'],
    sortOrder: 200,
  },
  {
    id: 's5-gen5-standard',
    productSeries: 'S5',
    name: 'S5 Gen5 Classic Edition',
    gen: 'Gen5',
    size: '28 sqm',
    area: 28,
    generation: 5,
    productType: 'standard',
    badge: 'Classic',
    tags: ['S5', 'Classic', 'Skylight'],
    features: ['Classic S-series silhouette', 'Skylight reference', 'Resort cabin use case'],
    image: '/images/products/S5-Gen6_render-01.jpg',
    gallery: ['/images/products/S5-Gen6_render-01.jpg', '/images/products/s5-gen5-uk.jpg', '/images/products/custom_S5-Gen6_UK_01.jpg'],
    specs: [
      { label: 'Product family', value: 'S5 classic resort unit' },
      { label: 'Reference area', value: '28 sqm' },
      { label: 'Project fit', value: 'Classic guest rooms, scenic camps, and resort cabin projects' },
    ],
    resources: [{ title: 'Request S5 buyer pack', href: '/media-kit', body: 'Request S5 images, product reference notes, and case photos.' }],
    keywords: ['S5 Gen5', 'classic prefab cabin', 'skylight modular resort unit'],
    sortOrder: 210,
  },
]

function productInput(product) {
  return {
    description: `${product.name} is maintained from the backend product CMS for overseas catalog browsing.`,
    detailModules: [
      {
        id: 'catalog-fit',
        type: 'highlights',
        title_cn: 'Catalog Fit',
        title_en: 'Catalog Fit',
        body_cn: 'Published as a catalog-width product reference for overseas buyers.',
        body_en: 'Published as a catalog-width product reference for overseas buyers.',
        items: [
          { title: 'Series', body: product.productSeries },
          { title: 'Reference size', body: product.size },
          { title: 'Buyer path', body: 'Open product page, review buyer materials, and submit inquiry.' },
        ],
        sort_order: 20,
      },
      {
        id: 'buyer-resources',
        type: 'content',
        title_cn: 'Buyer Resources',
        title_en: 'Buyer Resources',
        body_cn: 'Request product documentation through Media Kit or contact the sales team for project-specific material.',
        body_en: 'Request product documentation through Media Kit or contact the sales team for project-specific material.',
        links: product.resources,
        sort_order: 90,
      },
    ],
    commercialTerms: {
      delivery_method: 'Factory-built modular unit, project shipping terms confirmed case by case',
      delivery_location: 'Destination and logistics path confirmed during quotation',
      payment_terms: 'Commercial terms confirmed with the sales team',
      lead_time: 'Production and shipping schedule confirmed by model, quantity, and configuration',
      utilities: 'Utility and local code requirements confirmed before final configuration',
      after_sales: 'Project support and after-sales scope confirmed during quotation',
      moq: 'Confirm with sales team',
    },
  }
}

async function upsertProducts(client, changes) {
  if (!(await tableExists(client, 'public.product_catalog'))) return
  for (const product of productRows) {
    const res = await client.query(
      `SELECT id, status, image, gallery, specs_cn, specs_en, detail_modules, keywords_en, related_product_ids,
              description_cn, description_en, commercial_terms, seo_title_en, seo_description_en, deleted_at
       FROM product_catalog WHERE id = $1 LIMIT 1`,
      [product.id],
    )
    const input = productInput(product)
    if (res.rowCount === 0) {
      changes.push(`product:${product.id} insert catalog product`)
      if (apply) {
        await client.query(
          `INSERT INTO product_catalog (
             id, product_series, name_cn, name_en, gen, size, area, generation, product_type,
             badge_cn, badge_en, tags_cn, tags_en, features_cn, features_en,
             image, description_cn, description_en, gallery, specs_cn, specs_en,
             detail_modules, is_custom, detail_slug, price_display_zh, price_display_en,
             commercial_terms, keywords_zh, keywords_en, related_product_ids,
             seo_title_zh, seo_title_en, seo_description_zh, seo_description_en,
             status, sort_order
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,
             $10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,
             $16,$17,$18,$19::jsonb,$20::jsonb,$21::jsonb,
             $22::jsonb,false,NULL,NULL,NULL,
             $23::jsonb,$24::text[],$25::text[],$26::text[],
             $27,$28,$29,$30,
             'published',$31
           )`,
          [
            product.id,
            product.productSeries,
            product.name,
            product.name,
            product.gen,
            product.size,
            product.area,
            product.generation,
            product.productType,
            product.badge,
            product.badge,
            JSON.stringify(product.tags),
            JSON.stringify(product.tags),
            JSON.stringify(product.features),
            JSON.stringify(product.features),
            product.image,
            input.description,
            input.description,
            JSON.stringify(product.gallery),
            JSON.stringify(product.specs),
            JSON.stringify(product.specs),
            JSON.stringify(input.detailModules),
            JSON.stringify(input.commercialTerms),
            product.keywords,
            product.keywords,
            ['e7-gen6-flagship', 'v9-gen6-standard', 'e6-gen6-standard'],
            `${product.name} | VESSEL Product Catalog`,
            `${product.name} product catalog page with backend-published images, specification references, buyer materials, and inquiry path.`,
            `${product.name} | VESSEL Product Catalog`,
            `${product.name} product catalog page with backend-published images, specification references, buyer materials, and inquiry path.`,
            product.sortOrder,
          ],
        )
      }
      continue
    }
    if (res.rows[0].deleted_at) continue
    const row = res.rows[0]
    const gallery = unique([...normalizeArray(row.gallery), ...product.gallery])
    const specsCn = mergeSpecs(row.specs_cn, product.specs)
    const specsEn = mergeSpecs(row.specs_en, product.specs)
    const detailModules = mergeModules(row.detail_modules, input.detailModules)
    const keywords = unique([...normalizeArray(row.keywords_en), ...product.keywords])
    const related = unique([...normalizeArray(row.related_product_ids), 'e7-gen6-flagship', 'v9-gen6-standard', 'e6-gen6-standard'])
    const terms = { ...input.commercialTerms, ...normalizeObject(row.commercial_terms) }
    const next = {
      image: row.image || product.image,
      gallery,
      specsCn,
      specsEn,
      detailModules,
      keywords,
      related,
      description: row.description_en || row.description_cn || input.description,
      terms,
      seoTitle: row.seo_title_en || `${product.name} | VESSEL Product Catalog`,
      seoDescription: row.seo_description_en || `${product.name} product catalog page with backend-published images, specification references, buyer materials, and inquiry path.`,
      status: 'published',
    }
    const changed = row.status !== 'published'
      || row.image !== next.image
      || stableJson(normalizeArray(row.gallery)) !== stableJson(gallery)
      || stableJson(normalizeArray(row.specs_cn)) !== stableJson(specsCn)
      || stableJson(normalizeArray(row.specs_en)) !== stableJson(specsEn)
      || stableJson(normalizeArray(row.detail_modules)) !== stableJson(detailModules)
      || stableJson(normalizeArray(row.keywords_en)) !== stableJson(keywords)
      || stableJson(normalizeArray(row.related_product_ids)) !== stableJson(related)
      || !row.description_cn
      || !row.description_en
      || !row.seo_title_en
      || !row.seo_description_en
    if (!changed) continue
    changes.push(`product:${product.id} refresh catalog depth`)
    if (apply) {
      await client.query(
        `UPDATE product_catalog
         SET image = $2,
             gallery = $3::jsonb,
             specs_cn = $4::jsonb,
             specs_en = $5::jsonb,
             detail_modules = $6::jsonb,
             keywords_zh = $7::text[],
             keywords_en = $7::text[],
             related_product_ids = $8::text[],
             description_cn = $9,
             description_en = $9,
             commercial_terms = $10::jsonb,
             seo_title_zh = COALESCE(NULLIF(seo_title_zh, ''), $11),
             seo_title_en = COALESCE(NULLIF(seo_title_en, ''), $11),
             seo_description_zh = COALESCE(NULLIF(seo_description_zh, ''), $12),
             seo_description_en = COALESCE(NULLIF(seo_description_en, ''), $12),
             status = 'published',
             updated_at = NOW()
         WHERE id = $1`,
        [
          product.id,
          next.image,
          JSON.stringify(gallery),
          JSON.stringify(specsCn),
          JSON.stringify(specsEn),
          JSON.stringify(detailModules),
          keywords,
          related,
          next.description,
          JSON.stringify(terms),
          next.seoTitle,
          next.seoDescription,
        ],
      )
    }
  }
}

async function ensureFaqCategory(client, changes) {
  if (!(await tableExists(client, 'public.site_content_categories'))) return null
  const res = await client.query(
    `SELECT id, status, title_zh, title_en FROM site_content_categories WHERE kind = 'faq' AND slug = 'procurement' AND deleted_at IS NULL LIMIT 1`,
  )
  if (res.rowCount > 0) {
    const current = res.rows[0]
    if (current.status !== 'visible' || current.title_zh !== 'Procurement FAQ' || current.title_en !== 'Procurement FAQ') {
      changes.push('faq:procurement category refresh')
      if (apply) {
        await client.query(
          `UPDATE site_content_categories SET title_zh = 'Procurement FAQ', title_en = 'Procurement FAQ', status = 'visible', updated_at = NOW() WHERE id = $1`,
          [current.id],
        )
      }
    }
    return current.id
  }
  changes.push('faq:procurement category insert')
  if (!apply) return null
  const inserted = await client.query(
    `INSERT INTO site_content_categories (kind, slug, title_zh, title_en, sort_order, status)
     VALUES ('faq', 'procurement', 'Procurement FAQ', 'Procurement FAQ', 5, 'visible')
     RETURNING id`,
  )
  return inserted.rows[0].id
}

const procurementFaq = [
  {
    slug: 'product-materials-components',
    title: 'What are the main components of VESSEL products?',
    body: 'VESSEL products use a structural steel frame, exterior panels, high-performance glass, insulated walls, integrated interior systems, utilities, and smart control options. Exact components vary by model and configuration and should be confirmed from the published product page or buyer pack.',
  },
  {
    slug: 'gen6-upgrades',
    title: 'What are the key Gen6 upgrades?',
    body: 'Gen6 models focus on roof waterproofing structure, underfloor mechanical space, cleaner assembly details, improved door and window systems, and upgraded smart control. The available upgrade scope depends on the selected model and destination-side requirements.',
  },
  {
    slug: 'available-models',
    title: 'Which product models are available?',
    body: 'The current buyer catalog covers E7, V9, E6, E5, E3, V3, V5, V7, and S5 references. Some models are standard products and some are project customization references, so final availability should be confirmed with the sales team.',
  },
  {
    slug: 'extreme-climate-fit',
    title: 'Can VESSEL products adapt to extreme climates?',
    body: 'VESSEL has published references across hot, cold, coastal, and resort scenarios. Climate adaptation should be reviewed by country, site, insulation package, utilities, local code, and maintenance expectations before quotation.',
  },
  {
    slug: 'transport-hs-code',
    title: 'How are VESSEL products transported and what HS code should buyers check?',
    body: 'Many VESSEL products are planned around integral transport and project logistics review. Buyers should check prefabricated building-related HS code requirements with their local customs advisor before import planning.',
  },
  {
    slug: 'production-installation',
    title: 'How long does production take and what is needed before installation?',
    body: 'Production and delivery schedules depend on model, quantity, configuration, destination, and site readiness. Before installation, buyers should prepare site access, foundation or support conditions, utilities, lifting route, and local compliance review.',
  },
]

async function upsertProcurementFaq(client, changes) {
  if (!(await tableExists(client, 'public.site_content_items'))) return
  const categoryId = await ensureFaqCategory(client, changes)
  for (let index = 0; index < procurementFaq.length; index += 1) {
    const row = procurementFaq[index]
    const res = await client.query(
      `SELECT id, title_en, body_en, status, category_id FROM site_content_items
       WHERE kind = 'faq' AND slug = $1 AND deleted_at IS NULL LIMIT 1`,
      [row.slug],
    )
    if (res.rowCount === 0) {
      changes.push(`faq:${row.slug} insert procurement FAQ`)
      if (apply) {
        await client.query(
          `INSERT INTO site_content_items (
             kind, slug, category_id, title_zh, title_en, summary_zh, summary_en,
             body_zh, body_en, payload, status, sort_order, published_at
           ) VALUES (
             'faq', $1, $2, $3, $3, $4, $4, $4, $4, '{}'::jsonb, 'published', $5, NOW()
           )`,
          [row.slug, categoryId, row.title, row.body, 10 + index * 10],
        )
      }
      continue
    }
    const current = res.rows[0]
    const changed = current.status !== 'published'
      || current.title_en !== row.title
      || current.body_en !== row.body
      || (categoryId && current.category_id !== categoryId)
    if (!changed) continue
    changes.push(`faq:${row.slug} refresh procurement FAQ`)
    if (apply) {
      await client.query(
        `UPDATE site_content_items
         SET category_id = COALESCE($2, category_id),
             title_zh = $3,
             title_en = $3,
             summary_zh = $4,
             summary_en = $4,
             body_zh = $4,
             body_en = $4,
             status = 'published',
             published_at = COALESCE(published_at, NOW()),
             updated_at = NOW()
         WHERE id = $1`,
        [current.id, categoryId, row.title, row.body],
      )
    }
  }
}

const caseSamples = [
  {
    id: 'tuomao-tribal-ecological-camp',
    area: 'Qinghai / Qilian',
    investment: 'E7 / E5 model reference',
    units: 'Pending quantity reference',
    products: 'E7 / E5',
    tags: ['Qinghai', 'Ecological Camp', 'E7 / E5'],
  },
  {
    id: 'astrobase-mamison',
    area: '',
    investment: 'Hospitality project reference',
    units: 'Published project reference',
    products: 'V9 Gen6 / E7 Gen6',
    tags: ['Russia', 'Hospitality', 'V9 / E7'],
  },
]

async function refreshCaseProof(client, changes) {
  if (!(await tableExists(client, 'public.project_cases'))) return
  const legacySeparator = String.fromCharCode(36335)
  for (const sample of caseSamples) {
    const res = await client.query(
      `SELECT id, area_display, investment_display, units_display, products, tags_en
       FROM project_cases WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [sample.id],
    )
    if (res.rowCount === 0) continue
    const row = res.rows[0]
    const tags = unique([...normalizeArray(row.tags_en), ...sample.tags])
    const nextArea = !row.area_display || String(row.area_display).includes(legacySeparator) ? sample.area : row.area_display
    const nextInvestment = row.investment_display || sample.investment
    const nextUnits = row.units_display || sample.units
    const nextProducts = row.products || sample.products
    const changed = row.area_display !== nextArea
      || row.investment_display !== nextInvestment
      || row.units_display !== nextUnits
      || row.products !== nextProducts
      || stableJson(normalizeArray(row.tags_en)) !== stableJson(tags)
    if (!changed) continue
    changes.push(`case:${sample.id} refresh commercial proof`)
    if (apply) {
      await client.query(
        `UPDATE project_cases
         SET area_display = $2,
             investment_display = $3,
             units_display = $4,
             products = $5,
             tags_en = $6::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [sample.id, nextArea, nextInvestment, nextUnits, nextProducts, JSON.stringify(tags)],
      )
    }
  }
}

function manifestRows() {
  const rows = []
  for (const product of productRows) {
    for (const url of product.gallery) {
      rows.push({
        source: '303 product catalog / local public product assets',
        original_url: url,
        file_name: url.split('/').pop(),
        sha256: createHash('sha256').update(url).digest('hex'),
        suggested_use: `${product.id} catalog image`,
        publish_status: 'used-or-ready',
      })
    }
  }
  for (const candidate of ['SV918', 'RC902', 'SC610']) {
    rows.push({
      source: '303 homepage combination-building candidate',
      original_url: '',
      file_name: '',
      sha256: createHash('sha256').update(candidate).digest('hex'),
      suggested_use: `${candidate} combination building candidate; not published because current product CMS series enum does not support it`,
      publish_status: 'catalog-gap',
    })
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
  changes.push('asset manifest refresh catalog and FAQ')
  if (apply) {
    mkdirSync(assetDir, { recursive: true })
    writeFileSync(csvPath, nextCsv, 'utf8')
    writeFileSync(jsonPath, nextJson, 'utf8')
  }
}

async function main() {
  const changes = []
  const client = await pool.connect()
  try {
    await patchPageModule(client, 'products', 'ui-labels', productUiItems, changes)
    await patchPageModule(
      client,
      'contact',
      'faq-panel',
      [],
      changes,
      {
        moduleType: 'fixed-content',
        titleZh: 'Procurement FAQ',
        titleEn: 'Procurement FAQ',
        descriptionZh: 'Review common product, transport, installation, climate, and customs questions before sending a project brief.',
        descriptionEn: 'Review common product, transport, installation, climate, and customs questions before sending a project brief.',
        sortOrder: 45,
      },
    )
    await upsertProducts(client, changes)
    await upsertProcurementFaq(client, changes)
    await refreshCaseProof(client, changes)
    writeManifest(changes)
  } finally {
    client.release()
    await pool.end()
  }

  if (changes.length === 0) {
    console.log('B38 catalog/FAQ dry-run. No changes needed.')
    return
  }
  console.log(`B38 catalog/FAQ ${apply ? 'applied' : 'dry-run'} changes:`)
  for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
