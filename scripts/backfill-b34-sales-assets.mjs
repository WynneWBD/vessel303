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
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
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
      modules.push(detailModule)
      changes.push(`${detailModule.id}:add`)
    }
  }
  modules = modules.sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
  return { modules, changes }
}

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function upsertPageModule(client, pageModule, changes) {
  const res = await client.query(
    `SELECT id, title_zh, title_en, description_zh, description_en, items, is_visible, sort_order, module_type
     FROM page_modules
     WHERE page_key = $1 AND module_key = $2
     LIMIT 1`,
    [pageModule.page_key, pageModule.module_key],
  )

  if (res.rowCount === 0) {
    changes.push(`${pageModule.page_key}:${pageModule.module_key} insert`)
    if (apply) {
      await client.query(
        `INSERT INTO page_modules (
           id, page_key, module_key, module_type, title_zh, title_en,
           description_zh, description_en, items, is_visible, sort_order
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
        [
          pageModule.id,
          pageModule.page_key,
          pageModule.module_key,
          pageModule.module_type,
          pageModule.title_zh,
          pageModule.title_en,
          pageModule.description_zh,
          pageModule.description_en,
          JSON.stringify(pageModule.items),
          pageModule.is_visible,
          pageModule.sort_order,
        ],
      )
    }
    return
  }

  const row = res.rows[0]
  const nextItems = mergeItems(row.items, pageModule.items)
  const changed = (
    String(row.module_type ?? '') !== String(pageModule.module_type ?? '') ||
    String(row.title_zh ?? '') !== String(pageModule.title_zh ?? '') ||
    String(row.title_en ?? '') !== String(pageModule.title_en ?? '') ||
    String(row.description_zh ?? '') !== String(pageModule.description_zh ?? '') ||
    String(row.description_en ?? '') !== String(pageModule.description_en ?? '') ||
    stableJson(normalizeArray(row.items)) !== stableJson(nextItems) ||
    Boolean(row.is_visible) !== Boolean(pageModule.is_visible) ||
    Number(row.sort_order ?? 0) !== Number(pageModule.sort_order ?? 0)
  )

  if (!changed) return
  changes.push(`${pageModule.page_key}:${pageModule.module_key} refresh`)
  if (apply) {
    await client.query(
      `UPDATE page_modules
       SET module_type = $3,
           title_zh = $4,
           title_en = $5,
           description_zh = $6,
           description_en = $7,
           items = $8::jsonb,
           is_visible = $9,
           sort_order = $10,
           updated_at = NOW()
       WHERE page_key = $1 AND module_key = $2`,
      [
        pageModule.page_key,
        pageModule.module_key,
        pageModule.module_type,
        pageModule.title_zh,
        pageModule.title_en,
        pageModule.description_zh,
        pageModule.description_en,
        JSON.stringify(nextItems),
        pageModule.is_visible,
        pageModule.sort_order,
      ],
    )
  }
}

const homeModules = [
  {
    id: 'home:featured-products',
    page_key: 'home',
    module_key: 'featured-products',
    module_type: 'product-showcase',
    title_zh: 'Prefab resort cabins for global hospitality projects',
    title_en: 'Prefab resort cabins for global hospitality projects',
    description_zh: 'A published product entry point for buyers comparing model size, use case, and inquiry path.',
    description_en: 'A published product entry point for buyers comparing model size, use case, and inquiry path.',
    items: [
      item('eyebrow', 'Product directory', 'Product directory', 10),
      item('card-e7', 'E7 Gen6 Flagship Showroom', 'E7 Gen6 Flagship Showroom', 20, {
        value_zh: '38.8 sqm / flagship suite',
        value_en: '38.8 sqm / flagship suite',
        content_zh: 'Large social cabin for resort suites, showrooms, and high-value hospitality projects.',
        content_en: 'Large social cabin for resort suites, showrooms, and high-value hospitality projects.',
        href: '/products/e7-gen6-flagship',
        image_url: '/images/products/E7-Gen6_render-01.jpg',
      }),
      item('card-v9', 'V9 Gen6 Long-Stay Unit', 'V9 Gen6 Long-Stay Unit', 30, {
        value_zh: '38.8 sqm / residential flagship',
        value_en: '38.8 sqm / residential flagship',
        content_zh: 'Residential-style module for longer stays, resort villas, and destination lodging.',
        content_en: 'Residential-style module for longer stays, resort villas, and destination lodging.',
        href: '/products/v9-gen6-standard',
        image_url: '/images/products/V9-Gen6_render-01.jpg',
      }),
      item('card-e6', 'E6 Gen6 Resort Cabin', 'E6 Gen6 Resort Cabin', 40, {
        value_zh: '29.6 sqm / standard cabin',
        value_en: '29.6 sqm / standard cabin',
        content_zh: 'Balanced footprint for glamping camps, boutique hotels, and fast deployment projects.',
        content_en: 'Balanced footprint for glamping camps, boutique hotels, and fast deployment projects.',
        href: '/products/e6-gen6-standard',
        image_url: '/images/products/E6-Gen6_render-01.jpg',
      }),
      item('card-e3', 'E3 Gen6 Compact Unit', 'E3 Gen6 Compact Unit', 50, {
        value_zh: '19 sqm / compact unit',
        value_en: '19 sqm / compact unit',
        content_zh: 'Compact model for dense layouts, supporting areas, and entry-level hospitality rooms.',
        content_en: 'Compact model for dense layouts, supporting areas, and entry-level hospitality rooms.',
        href: '/products/e3-gen6-standard',
        image_url: '/images/products/E3-Gen6_render-01.jpg',
      }),
      item('primary-cta', 'View all products', 'View all products', 100, { href: '/products' }),
      item('secondary-cta', 'Request buyer materials', 'Request buyer materials', 110, { href: '/media-kit' }),
    ],
    is_visible: true,
    sort_order: 24,
  },
  {
    id: 'home:case-proof',
    page_key: 'home',
    module_key: 'case-proof',
    module_type: 'product-showcase',
    title_zh: 'Project references for procurement review',
    title_en: 'Project references for procurement review',
    description_zh: 'Published case cards connect buyers to real deployment photos, model combinations, and inquiry paths.',
    description_en: 'Published case cards connect buyers to real deployment photos, model combinations, and inquiry paths.',
    items: [
      item('eyebrow', 'Project proof', 'Project proof', 10),
      item('card-russia', 'AstroBase Mamison Hotel', 'AstroBase Mamison Hotel', 20, {
        value_zh: 'Russia / hotel project',
        value_en: 'Russia / hotel project',
        content_zh: 'Cold-climate hospitality reference with published exterior and interior project photos.',
        content_en: 'Cold-climate hospitality reference with published exterior and interior project photos.',
        href: '/cases/astrobase-mamison',
        image_url: '/images/projects/astrobase-mamison/exterior-02.jpg',
      }),
      item('card-israel', 'Xunliao Bay Holiday Planet', 'Xunliao Bay Holiday Planet', 30, {
        value_zh: 'China / seaside glamping camp',
        value_en: 'China / seaside glamping camp',
        content_zh: 'Seaside glamping reference with multiple VESSEL product types and published project photos.',
        content_en: 'Seaside glamping reference with multiple VESSEL product types and published project photos.',
        href: '/cases/xunliao-bay-holiday-planet',
        image_url: '/images/projects/guangdong-huizhou/image-03.jpg',
      }),
      item('card-argentina', 'Wanlv Lake Leqing Valley Camp', 'Wanlv Lake Leqing Valley Camp', 40, {
        value_zh: 'China / lake-view eco camp',
        value_en: 'China / lake-view eco camp',
        content_zh: 'Lake-view ecological camp reference for light-touch deployment and nature-based hospitality.',
        content_en: 'Lake-view ecological camp reference for light-touch deployment and nature-based hospitality.',
        href: '/cases/wanlv-lake-leqing-valley',
        image_url: '/images/projects/guangdong-heyuan/image-05.jpg',
      }),
      item('primary-cta', 'View cases', 'View cases', 100, { href: '/cases' }),
      item('secondary-cta', 'Discuss a similar project', 'Discuss a similar project', 110, { href: '/contact?source=home:case_proof_cta' }),
    ],
    is_visible: true,
    sort_order: 34,
  },
]

async function patchHomeHero(client, changes) {
  const res = await client.query(
    `SELECT id, items FROM page_modules WHERE page_key = 'home' AND module_key = 'hero' LIMIT 1`,
  )
  if (res.rowCount === 0) return

  const patches = new Map([
    ['hero-tagline', {
      label_zh: 'Prefab Resort Cabins / Modular Hospitality Units',
      label_en: 'Prefab Resort Cabins / Modular Hospitality Units',
    }],
    ['hero-headline', {
      label_zh: 'Fully-Assembled Modular Cabins for Resort, Hotel and Commercial Projects',
      label_en: 'Fully-Assembled Modular Cabins for Resort, Hotel and Commercial Projects',
    }],
    ['hero-subtitle', {
      label_zh: 'Compare VESSEL product families, project references, buyer materials, and inquiry paths from one international B2B site.',
      label_en: 'Compare VESSEL product families, project references, buyer materials, and inquiry paths from one international B2B site.',
    }],
    ['hero-primary-cta', { label_zh: 'Explore Products', label_en: 'Explore Products', href: '/products' }],
    ['hero-secondary-cta', { label_zh: 'Send Inquiry', label_en: 'Send Inquiry', href: '/contact?source=home:hero_contact' }],
    ['hero-image-01', { image_url: '/images/hero/optimized/homepage_banner-01.jpg' }],
    ['hero-image-02', { image_url: '/images/hero/optimized/homepage_banner-02.jpg' }],
  ])

  const current = normalizeArray(res.rows[0].items)
  const next = current.map((entry) => {
    const patch = patches.get(entry?.id)
    return patch ? { ...entry, ...patch } : entry
  })
  if (stableJson(current) === stableJson(next)) return

  changes.push('home:hero refresh B34 sales entry')
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
    gallery: ['/images/products/E7-Gen6_render-01.jpg', '/images/products/E7-Gen6_photo-01.jpg', '/images/products/e7-gen6-flagship.jpg'],
    related: ['v9-gen6-standard', 'e6-gen6-standard', 'e3-gen6-standard'],
    keywords: ['prefab resort cabin', 'modular hospitality unit', 'E7 Gen6', 'glamping cabin'],
    specs: [
      { label: 'Buyer materials', value: 'Published product images and project discussion resources are available through the product page and Media Kit.' },
      { label: 'Project fit', value: 'Recommended for flagship resort suites, showrooms, and high-value hospitality spaces.' },
      { label: 'Procurement review', value: 'Confirm destination, model quantity, utility standard, and site interface before quotation.' },
    ],
    resources: [
      { title: 'Open product image set', href: '/images/products/E7-Gen6_render-01.jpg', body: 'Published E7 visual reference for buyer review.' },
      { title: 'Request E7 buyer pack', href: '/media-kit', body: 'Request the latest spec sheet, floor plan, configuration notes, and case photos.' },
    ],
  },
  {
    id: 'e7-gen5-standard',
    gallery: ['/images/products/E7-Gen5_render-01.jpg', '/images/products/e7-gen5-standard.jpg', '/images/products/custom_E7-Gen5_kitchen-Russia_01.jpg'],
    related: ['e7-gen6-flagship', 'e6-gen6-standard', 'v9-gen6-standard'],
    keywords: ['E7 Gen5', 'prefab cabin', 'overseas custom cabin'],
    specs: [
      { label: 'Buyer materials', value: 'E7 Gen5 reference spec sheet and floor plan are available for procurement review.' },
      { label: 'Project fit', value: 'Recommended for overseas custom resort rooms and flagship accommodation layouts.' },
      { label: 'Procurement review', value: 'Confirm destination-side code, local utilities, and requested interior configuration before quotation.' },
    ],
    resources: [
      { title: 'E7 Gen5 spec sheet', href: '/downloads/b34/e7-gen5-spec-sheet.pdf', body: 'PDF reference package from the product material library.' },
      { title: 'E7 Gen5 floor plan', href: '/downloads/b34/e7-gen5-floor-plan.jpg', body: 'Published floor plan image for layout review.' },
    ],
  },
  {
    id: 'v9-gen6-standard',
    gallery: ['/images/products/V9-Gen6_render-01.jpg', '/images/products/V9-Gen6_photo-01.jpg', '/images/products/v9-custom-japan.jpg'],
    related: ['e7-gen6-flagship', 'e6-gen6-standard', 'e3-gen6-standard'],
    keywords: ['V9 Gen6', 'long stay prefab unit', 'modular resort villa'],
    specs: [
      { label: 'Buyer materials', value: 'V9 Gen6 spec sheet and floor plan are available for buyer review.' },
      { label: 'Project fit', value: 'Recommended for long-stay resort villas, destination lodging, and residential-style hospitality projects.' },
      { label: 'Procurement review', value: 'Confirm layout, kitchen requirement, utility standard, and destination logistics before quotation.' },
    ],
    resources: [
      { title: 'V9 Gen6 spec sheet', href: '/downloads/b34/v9-gen6-spec-sheet.pdf', body: 'PDF reference package from the product material library.' },
      { title: 'V9 Gen6 floor plan', href: '/downloads/b34/v9-gen6-floor-plan.jpg', body: 'Published floor plan image for layout review.' },
    ],
  },
  {
    id: 'e6-gen6-standard',
    gallery: ['/images/products/E6-Gen6_render-01.jpg', '/images/products/E6-Gen6_photo-01.jpg', '/images/products/e6-gen6-standard.jpg'],
    related: ['e7-gen6-flagship', 'v9-gen6-standard', 'e3-gen6-standard'],
    keywords: ['E6 Gen6', 'resort cabin', 'fast deployment cabin'],
    specs: [
      { label: 'Buyer materials', value: 'Published E6 images and buyer request path are available for procurement review.' },
      { label: 'Project fit', value: 'Recommended for resort camps, boutique hotels, and balanced footprint deployment.' },
      { label: 'Procurement review', value: 'Confirm model quantity, transport plan, utility standard, and destination constraints before quotation.' },
    ],
    resources: [
      { title: 'Open E6 product image', href: '/images/products/E6-Gen6_render-01.jpg', body: 'Published E6 visual reference for buyer review.' },
      { title: 'Request E6 buyer pack', href: '/media-kit', body: 'Request the latest specification sheet, layout notes, and case photo package.' },
    ],
  },
  {
    id: 'e3-gen6-standard',
    gallery: ['/images/products/E3-Gen6_render-01.jpg', '/images/products/E3-Gen6_photo-01.jpg', '/images/products/e3-gen6-standard.jpg'],
    related: ['e6-gen6-standard', 'e7-gen6-flagship', 'v9-gen6-standard'],
    keywords: ['E3 Gen6', 'compact prefab cabin', 'mini resort cabin'],
    specs: [
      { label: 'Buyer materials', value: 'E3 Gen6 spec sheet and floor plan are available for buyer review.' },
      { label: 'Project fit', value: 'Recommended for dense layouts, supporting facilities, and entry-level guest rooms.' },
      { label: 'Procurement review', value: 'Confirm guest capacity, installation interface, and destination-side restrictions before quotation.' },
    ],
    resources: [
      { title: 'E3 Gen6 spec sheet', href: '/downloads/b34/e3-gen6-spec-sheet.pdf', body: 'PDF reference package from the product material library.' },
      { title: 'E3 Gen6 floor plan', href: '/downloads/b34/e3-gen6-floor-plan.jpg', body: 'Published floor plan image for layout review.' },
    ],
  },
  {
    id: 'e5-gen5-standard',
    gallery: ['/images/products/E5-Gen5_render-01.jpg', '/images/products/E5-Gen5_photo-01.jpg', '/images/products/e5-gen5-standard.jpg'],
    related: ['e3-gen6-standard', 'e6-gen6-standard', 'e7-gen5-standard'],
    keywords: ['E5 Gen5', 'compact prefab cabin', 'project support unit'],
    specs: [
      { label: 'Buyer materials', value: 'E5 floor plan is available for preliminary layout review.' },
      { label: 'Project fit', value: 'Recommended for compact hospitality rooms and support functions in modular camps.' },
      { label: 'Procurement review', value: 'Confirm site use case, unit mix, and destination logistics before quotation.' },
    ],
    resources: [
      { title: 'E5 Gen5 floor plan', href: '/downloads/b34/e5-gen5-floor-plan.jpg', body: 'Published floor plan image for layout review.' },
      { title: 'Request E5 buyer pack', href: '/media-kit', body: 'Request supporting product documentation from the sales team.' },
    ],
  },
]

function buyerMaterialsModule(product) {
  return {
    id: 'b34-buyer-materials',
    type: 'content',
    title_cn: 'Buyer Materials',
    title_en: 'Buyer Materials',
    body_cn: 'Published buyer materials are controlled from the product CMS and Media Kit. Missing files stay hidden until operations publishes them.',
    body_en: 'Published buyer materials are controlled from the product CMS and Media Kit. Missing files stay hidden until operations publishes them.',
    items_cn: product.resources,
    items_en: product.resources,
    image_url: product.gallery[0],
    images: product.gallery,
    is_visible: true,
    sort_order: 82,
  }
}

function planningModule() {
  return {
    id: 'b34-project-planning',
    type: 'content',
    title_cn: 'Project Planning Review',
    title_en: 'Project Planning Review',
    body_cn: 'Use this section to align model selection, transport planning, site preparation, and buyer documentation before quotation.',
    body_en: 'Use this section to align model selection, transport planning, site preparation, and buyer documentation before quotation.',
    items_cn: [
      { title: 'Model mix', body: 'Confirm model, quantity, guest capacity, and intended operation scenario.' },
      { title: 'Transport interface', body: 'Review destination logistics, loading constraints, and on-site access before delivery planning.' },
      { title: 'Site preparation', body: 'Confirm foundation, utility interface, and local compliance requirements before final quotation.' },
      { title: 'Documentation', body: 'Use the Media Kit and product resources to request the latest buyer package.' },
    ],
    items_en: [
      { title: 'Model mix', body: 'Confirm model, quantity, guest capacity, and intended operation scenario.' },
      { title: 'Transport interface', body: 'Review destination logistics, loading constraints, and on-site access before delivery planning.' },
      { title: 'Site preparation', body: 'Confirm foundation, utility interface, and local compliance requirements before final quotation.' },
      { title: 'Documentation', body: 'Use the Media Kit and product resources to request the latest buyer package.' },
    ],
    is_visible: true,
    sort_order: 86,
  }
}

async function patchProducts(client, changes) {
  for (const product of productDepth) {
    const res = await client.query(
      `SELECT id, gallery, specs_cn, specs_en, detail_modules, keywords_zh, keywords_en,
              related_product_ids, seo_title_en, seo_description_en, commercial_terms
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
    const detailModules = mergeDetailModules(row.detail_modules, [buyerMaterialsModule(product), planningModule()])
    const keywordsEn = unique([...(row.keywords_en ?? []), ...product.keywords])
    const keywordsZh = unique([...(row.keywords_zh ?? []), ...product.keywords])
    const related = unique([...(row.related_product_ids ?? []), ...product.related])
    const commercialTerms = {
      ...normalizeObject(row.commercial_terms),
      payment_terms_en: normalizeObject(row.commercial_terms).payment_terms_en || 'Quotation and payment terms are confirmed by project scope.',
      delivery_time_en: normalizeObject(row.commercial_terms).delivery_time_en || 'Delivery schedule is confirmed after model mix, quantity, and destination logistics review.',
      warranty_support_en: normalizeObject(row.commercial_terms).warranty_support_en || 'After-sales support is reviewed by destination and project configuration.',
      moq_en: normalizeObject(row.commercial_terms).moq_en || 'Confirm by model, customization level, and project scope.',
    }

    const seoTitle = row.seo_title_en || `${product.id.replaceAll('-', ' ').toUpperCase()} | VESSEL Modular Cabin`
    const seoDescription = row.seo_description_en || 'VESSEL modular cabin product page with published images, buyer materials, project planning notes, and inquiry path.'
    const changed = [
      stableJson(normalizeArray(row.gallery)) !== stableJson(gallery),
      specsEn.additions.length > 0,
      specsCn.additions.length > 0,
      detailModules.changes.length > 0,
      stableJson(row.keywords_en ?? []) !== stableJson(keywordsEn),
      stableJson(row.keywords_zh ?? []) !== stableJson(keywordsZh),
      stableJson(row.related_product_ids ?? []) !== stableJson(related),
      stableJson(normalizeObject(row.commercial_terms)) !== stableJson(commercialTerms),
      String(row.seo_title_en ?? '') !== seoTitle,
      String(row.seo_description_en ?? '') !== seoDescription,
    ].some(Boolean)
    if (!changed) continue

    changes.push(`product:${product.id} deepen buyer resources`)
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
    ids: ['xunliao-bay-holiday-planet'],
    cover: '/images/projects/guangdong-huizhou/image-03.jpg',
    images: ['/images/projects/guangdong-huizhou/image-03.jpg', '/images/projects/guangdong-huizhou/image-01.jpg', '/images/projects/guangdong-huizhou/image-02.jpg'],
    description: 'A seaside glamping camp reference with multiple VESSEL product types, waterfront guest experience, and published project photos for buyer review.',
    tags: ['Seaside', 'Glamping', 'Multi-model deployment'],
  },
  {
    ids: ['jiaoding-mountain-elk-life'],
    cover: '/images/projects/sichuan-jiaoding/image-01.jpg',
    images: ['/images/projects/sichuan-jiaoding/image-01.jpg', '/images/projects/sichuan-jiaoding/image-02.jpg', '/images/projects/sichuan-jiaoding/image-03.png'],
    description: 'An alpine resort camp reference for all-season operation, scenic lodging, and cold-climate project planning.',
    tags: ['Alpine', 'Cold climate', 'Resort camp'],
  },
  {
    ids: ['wanlv-lake-leqing-valley'],
    cover: '/images/projects/guangdong-heyuan/image-05.jpg',
    images: ['/images/projects/guangdong-heyuan/image-05.jpg', '/images/projects/guangdong-heyuan/image-02.jpg', '/images/projects/guangdong-heyuan/image-03.jpg'],
    description: 'A lake-view ecological camp reference for light-touch deployment, guest rooms, and nature-based hospitality operations.',
    tags: ['Lake view', 'Eco camp', 'Hospitality'],
  },
  {
    ids: ['astrobase-mamison', 'astrobase-mamison-hotel'],
    cover: '/images/projects/astrobase-mamison/exterior-02.jpg',
    images: ['/images/projects/astrobase-mamison/exterior-02.jpg', '/images/projects/astrobase-mamison/exterior-03.jpg'],
    description: 'A Russia hospitality reference with published exterior and interior project photos for international buyer review.',
    tags: ['Russia', 'Hotel project', 'Cold climate'],
  },
  {
    ids: ['israel-dream-island'],
    cover: '/images/projects/israel-dream-island/exterior-03-web.jpg',
    images: ['/images/projects/israel-dream-island/exterior-03-web.jpg', '/images/projects/israel-dream-island/exterior-01.jpg', '/images/projects/israel-dream-island/exterior-02.jpg'],
    description: 'A resort project reference for buyers reviewing hospitality deployment, guest experience, and site integration.',
    tags: ['Israel', 'Resort', 'Spa hospitality'],
  },
  {
    ids: ['argentina-nordelta'],
    cover: '/images/projects/argentina-nordelta/exterior-01.jpg',
    images: ['/images/projects/argentina-nordelta/exterior-01.jpg', '/images/projects/argentina-nordelta/exterior-02.jpg', '/images/projects/argentina-nordelta/interior-01.jpg'],
    description: 'A commercial project reference with published exterior and interior photos for procurement review.',
    tags: ['Argentina', 'Commercial', 'Buyer reference'],
  },
]

async function patchCases(client, changes) {
  for (const sample of caseSamples) {
    for (const id of sample.ids) {
      const res = await client.query(
        `SELECT id, description_en, tags_en, cover_image_url, images
         FROM project_cases
         WHERE id = $1 AND deleted_at IS NULL
         LIMIT 1`,
        [id],
      )
      if (res.rowCount === 0) continue
      const row = res.rows[0]
      const images = unique([...normalizeArray(row.images), ...sample.images])
      const tags = unique([...normalizeArray(row.tags_en), ...sample.tags])
      const cover = row.cover_image_url || sample.cover
      const description = row.description_en || sample.description
      const changed = (
        String(row.cover_image_url ?? '') !== cover ||
        stableJson(normalizeArray(row.images)) !== stableJson(images) ||
        stableJson(normalizeArray(row.tags_en)) !== stableJson(tags) ||
        String(row.description_en ?? '') !== description
      )
      if (!changed) continue

      changes.push(`case:${id} add B34 proof assets`)
      if (apply) {
        await client.query(
          `UPDATE project_cases
           SET description_en = $2,
               tags_en = $3::jsonb,
               cover_image_url = $4,
               images = $5::jsonb,
               updated_at = NOW()
           WHERE id = $1`,
          [id, description, JSON.stringify(tags), cover, JSON.stringify(images)],
        )
      }
      break
    }
  }
}

const mediaResources = [
  {
    slug: 'company-brochure-overview',
    title: 'Company Brochure Overview',
    summary: 'Public company overview and capability entry for buyers preparing a first project review.',
    fileUrl: '/about',
    ctaLabel: 'Open company overview',
    sortOrder: 5,
  },
  {
    slug: 'v9-gen6-product-spec-sheet',
    title: 'V9 Gen6 Product Spec Sheet',
    summary: 'PDF reference package for V9 Gen6 buyer review.',
    fileUrl: '/downloads/b34/v9-gen6-spec-sheet.pdf',
    ctaLabel: 'Open spec sheet',
    sortOrder: 10,
  },
  {
    slug: 'e3-gen6-product-spec-sheet',
    title: 'E3 Gen6 Product Spec Sheet',
    summary: 'PDF reference package for compact unit procurement review.',
    fileUrl: '/downloads/b34/e3-gen6-spec-sheet.pdf',
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
    summary: 'Published case photo reference for resort and commercial project discussion.',
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
      changes.push(`media_file:${resource.slug} insert`)
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

    changes.push(`media_file:${resource.slug} refresh`)
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

async function patchContactModules(client, changes) {
  const modulePatches = [
    {
      page_key: 'site',
      module_key: 'footer-contact',
      items: [
        item('whatsapp', 'WhatsApp', 'WhatsApp', 10, { href: 'https://wa.me/8618024176679', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679' }),
        item('email', '303vessel@303industries.cn', '303vessel@303industries.cn', 20, { href: 'mailto:303vessel@303industries.cn' }),
        item('phone', 'International phone', 'International phone', 25, { href: 'tel:+8618024176679', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679' }),
        item('address', 'Shunde District, Foshan, Guangdong, China', 'Shunde District, Foshan, Guangdong, China', 30),
      ],
    },
    {
      page_key: 'site',
      module_key: 'floating-contact',
      items: [
        item('whatsapp', 'WhatsApp', 'WhatsApp', 10, { href: 'https://wa.me/8618024176679', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679' }),
        item('email', 'Email', 'Email', 20, { href: 'mailto:303vessel@303industries.cn', content_zh: '303vessel@303industries.cn', content_en: '303vessel@303industries.cn' }),
        item('inquiry', 'Project Inquiry', 'Project Inquiry', 30, { href: '/contact?source=floating:inquiry' }),
      ],
    },
    {
      page_key: 'contact',
      module_key: 'channels',
      items: [
        item('whatsapp', 'WhatsApp', 'WhatsApp', 10, { href: 'https://wa.me/8618024176679', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679' }),
        item('email', 'Email', 'Email', 20, { href: 'mailto:303vessel@303industries.cn', content_zh: '303vessel@303industries.cn', content_en: '303vessel@303industries.cn' }),
        item('phone', 'International phone', 'International phone', 30, { href: 'tel:+8618024176679', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679' }),
      ],
    },
  ]

  for (const patch of modulePatches) {
    const res = await client.query(
      `SELECT id, items FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1`,
      [patch.page_key, patch.module_key],
    )
    if (res.rowCount === 0) continue
    const current = normalizeArray(res.rows[0].items)
    const next = mergeItems(current, patch.items)
    if (stableJson(current) === stableJson(next)) continue
    changes.push(`${patch.page_key}:${patch.module_key} unify contact channels`)
    if (apply) {
      await client.query(
        `UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1`,
        [res.rows[0].id, JSON.stringify(next)],
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
    for (const pageModule of homeModules) await upsertPageModule(client, pageModule, changes)
    await patchProducts(client, changes)
    await patchCases(client, changes)
    await upsertMediaResources(client, changes)
    await patchContactModules(client, changes)

    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B34 sales assets backfill applied.' : 'B34 sales assets dry-run.')
  if (changes.length === 0) console.log('No B34 changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  if (err instanceof Error) console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  else console.error(err)
  process.exit(1)
})
