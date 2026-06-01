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

function item(id, labelEn, sortOrder, extra = {}) {
  return {
    id,
    label_zh: labelEn,
    label_en: labelEn,
    is_visible: true,
    sort_order: sortOrder,
    ...extra,
  }
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

async function patchHomeHero(client, changes) {
  const res = await client.query(
    `SELECT id, items FROM page_modules WHERE page_key = 'home' AND module_key = 'hero' LIMIT 1`,
  )
  if (res.rowCount === 0) return

  const defaults = [
    item('hero-tagline', 'Prefab Resort Cabins / Modular Hospitality Units', 10),
    item('hero-headline', 'Fully-assembled modular cabins for resort, hotel and commercial projects', 20),
    item('hero-subtitle', 'Select VESSEL models, compare project references, request buyer materials, and start an overseas procurement conversation from one site.', 30),
    item('hero-primary-cta', 'Explore products', 40, { href: '/products' }),
    item('hero-secondary-cta', 'Send inquiry', 50, { href: '/contact?source=home:hero_contact' }),
    item('hero-proof-01', '38.8 sqm', 60, { value_zh: '38.8', value_en: '38.8', content_zh: 'Flagship cabin reference size', content_en: 'Flagship cabin reference size' }),
    item('hero-proof-02', '300+ projects', 70, { value_zh: '300+', value_en: '300+', content_zh: 'Deployment references across resort and commercial use cases', content_en: 'Deployment references across resort and commercial use cases' }),
    item('hero-proof-03', '30+ countries', 80, { value_zh: '30+', value_en: '30+', content_zh: 'International project and logistics experience', content_en: 'International project and logistics experience' }),
    item('hero-image-01', '', 100, { image_url: '/images/hero/optimized/homepage_banner-02.jpg' }),
    item('hero-image-02', '', 110, { image_url: '/images/hero/optimized/homepage_banner-03.jpg' }),
    item('hero-image-03', '', 120, { image_url: '/images/hero/optimized/homepage_banner-04.jpg' }),
  ]

  const row = res.rows[0]
  const next = mergeItems(row.items, defaults)
  if (stableJson(normalizeArray(row.items)) === stableJson(next)) return

  changes.push('home:hero refresh B35 sales proof')
  if (apply) {
    await client.query(
      `UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [row.id, JSON.stringify(next)],
    )
  }
}

const homeModules = [
  {
    id: 'home:product-series',
    page_key: 'home',
    module_key: 'product-series',
    module_type: 'product-series',
    title_zh: 'Product families for hospitality and destination projects',
    title_en: 'Product families for hospitality and destination projects',
    description_zh: 'Start with the use case, then compare model size, configuration, buyer materials, and project fit from the product CMS.',
    description_en: 'Start with the use case, then compare model size, configuration, buyer materials, and project fit from the product CMS.',
    items: [
      item('eyebrow', 'Product series', 10),
      item('card-resort', 'Resort cabin series', 20, {
        value_zh: 'Glamping / hotel / destination lodging',
        value_en: 'Glamping / hotel / destination lodging',
        content_zh: 'Fully-assembled modular cabin units for scenic resorts, boutique hotels, and fast-deployment accommodation projects.',
        content_en: 'Fully-assembled modular cabin units for scenic resorts, boutique hotels, and fast-deployment accommodation projects.',
        href: '/products?category=space-capsule',
        image_url: '/images/hero/optimized/homepage_banner-02.jpg',
      }),
      item('card-commercial', 'Commercial and showroom series', 30, {
        value_zh: 'Retail / exhibition / reception',
        value_en: 'Retail / exhibition / reception',
        content_zh: 'High-visibility modules for brand showrooms, commercial display, reception areas, and destination amenities.',
        content_en: 'High-visibility modules for brand showrooms, commercial display, reception areas, and destination amenities.',
        href: '/scenarios/commercial',
        image_url: '/images/hero/optimized/homepage_banner-03.jpg',
      }),
      item('card-project', 'Project planning support', 40, {
        value_zh: 'Model mix / logistics / site interface',
        value_en: 'Model mix / logistics / site interface',
        content_zh: 'Use published product and case resources to align model selection, quantity, transport, and site preparation before quotation.',
        content_en: 'Use published product and case resources to align model selection, quantity, transport, and site preparation before quotation.',
        href: '/contact?source=home:series_planning',
        image_url: '/images/hero/optimized/homepage_banner-04.jpg',
      }),
      item('primary-cta', 'View product catalog', 100, { href: '/products' }),
      item('secondary-cta', 'Request buyer materials', 110, { href: '/media-kit' }),
    ],
    is_visible: true,
    sort_order: 22,
  },
  {
    id: 'home:model-grid',
    page_key: 'home',
    module_key: 'model-grid',
    module_type: 'model-grid',
    title_zh: 'Compare flagship models',
    title_en: 'Compare flagship models',
    description_zh: 'Keep the product decision close to the first screen: model, size, use case, and canonical product detail page.',
    description_en: 'Keep the product decision close to the first screen: model, size, use case, and canonical product detail page.',
    items: [
      item('eyebrow', 'Featured models', 10),
      item('card-e7', 'E7 Gen6 Flagship Showroom', 20, {
        value_zh: '38.8 sqm / flagship suite',
        value_en: '38.8 sqm / flagship suite',
        content_zh: 'Large social cabin for resort suites, showrooms, and high-value hospitality projects.',
        content_en: 'Large social cabin for resort suites, showrooms, and high-value hospitality projects.',
        href: '/products/e7-gen6-flagship',
        image_url: '/images/products/E7-Gen6_render-01.jpg',
      }),
      item('card-v9', 'V9 Gen6 Long-Stay Unit', 30, {
        value_zh: '38.8 sqm / residential flagship',
        value_en: '38.8 sqm / residential flagship',
        content_zh: 'Residential-style module for long-stay resort villas and destination lodging.',
        content_en: 'Residential-style module for long-stay resort villas and destination lodging.',
        href: '/products/v9-gen6-standard',
        image_url: '/images/products/V9-Gen6_render-01.jpg',
      }),
      item('card-e6', 'E6 Gen6 Resort Cabin', 40, {
        value_zh: '29.6 sqm / standard cabin',
        value_en: '29.6 sqm / standard cabin',
        content_zh: 'Balanced footprint for glamping camps, boutique hotels, and fast deployment projects.',
        content_en: 'Balanced footprint for glamping camps, boutique hotels, and fast deployment projects.',
        href: '/products/e6-gen6-standard',
        image_url: '/images/products/E6-Gen6_render-01.jpg',
      }),
      item('card-e3', 'E3 Gen6 Compact Unit', 50, {
        value_zh: '19 sqm / compact unit',
        value_en: '19 sqm / compact unit',
        content_zh: 'Compact model for dense layouts, support facilities, and entry-level guest rooms.',
        content_en: 'Compact model for dense layouts, support facilities, and entry-level guest rooms.',
        href: '/products/e3-gen6-standard',
        image_url: '/images/products/E3-Gen6_render-01.jpg',
      }),
      item('primary-cta', 'Compare all models', 100, { href: '/products' }),
    ],
    is_visible: true,
    sort_order: 26,
  },
  {
    id: 'home:application-scenes',
    page_key: 'home',
    module_key: 'application-scenes',
    module_type: 'application-scenes',
    title_zh: 'Applications that match real procurement scenarios',
    title_en: 'Applications that match real procurement scenarios',
    description_zh: 'Route buyers by project type instead of only by product name: resort stays, commercial destinations, and public supporting facilities.',
    description_en: 'Route buyers by project type instead of only by product name: resort stays, commercial destinations, and public supporting facilities.',
    items: [
      item('eyebrow', 'Application scenes', 10),
      item('card-tourism', 'Resort and tourism camps', 20, {
        value_zh: 'Guest rooms / glamping / scenic stays',
        value_en: 'Guest rooms / glamping / scenic stays',
        content_zh: 'Use model mixes, guest capacity, utilities, and project references to plan destination accommodation.',
        content_en: 'Use model mixes, guest capacity, utilities, and project references to plan destination accommodation.',
        href: '/scenarios/tourism',
        image_url: '/images/projects/guangdong-huizhou/image-03.jpg',
      }),
      item('card-commercial', 'Commercial destination spaces', 30, {
        value_zh: 'Showroom / retail / reception',
        value_en: 'Showroom / retail / reception',
        content_zh: 'Plan high-visibility modular spaces for retail, visitor services, and destination amenities.',
        content_en: 'Plan high-visibility modular spaces for retail, visitor services, and destination amenities.',
        href: '/scenarios/commercial',
        image_url: '/images/hero/optimized/homepage_banner-05.jpg',
      }),
      item('card-public', 'Public and supporting facilities', 40, {
        value_zh: 'Service points / support units',
        value_en: 'Service points / support units',
        content_zh: 'Use modular units for support spaces, service nodes, and flexible deployment needs.',
        content_en: 'Use modular units for support spaces, service nodes, and flexible deployment needs.',
        href: '/scenarios/public',
        image_url: '/images/products/E3-Gen6_photo-01.jpg',
      }),
      item('primary-cta', 'Explore scenarios', 100, { href: '/scenarios/tourism' }),
      item('secondary-cta', 'Discuss project fit', 110, { href: '/contact?source=home:scenarios_cta' }),
    ],
    is_visible: true,
    sort_order: 32,
  },
  {
    id: 'home:project-proof',
    page_key: 'home',
    module_key: 'project-proof',
    module_type: 'project-proof',
    title_zh: 'Project references for buyer confidence',
    title_en: 'Project references for buyer confidence',
    description_zh: 'Published case entries connect product selection to real deployment photos, destinations, and inquiry paths.',
    description_en: 'Published case entries connect product selection to real deployment photos, destinations, and inquiry paths.',
    items: [
      item('eyebrow', 'Project proof', 10),
      item('card-russia', 'AstroBase Mamison Hotel', 20, {
        value_zh: 'Russia / hotel reference',
        value_en: 'Russia / hotel reference',
        content_zh: 'Cold-climate hospitality reference with published exterior and interior project photos.',
        content_en: 'Cold-climate hospitality reference with published exterior and interior project photos.',
        href: '/cases/astrobase-mamison',
        image_url: '/images/projects/astrobase-mamison/exterior-02.jpg',
      }),
      item('card-xunliao', 'Xunliao Bay Holiday Planet', 30, {
        value_zh: 'China / seaside glamping camp',
        value_en: 'China / seaside glamping camp',
        content_zh: 'Seaside glamping reference with multiple VESSEL product types and published project photos.',
        content_en: 'Seaside glamping reference with multiple VESSEL product types and published project photos.',
        href: '/cases/xunliao-bay-holiday-planet',
        image_url: '/images/projects/guangdong-huizhou/image-03.jpg',
      }),
      item('card-wanlv', 'Wanlv Lake Leqing Valley Camp', 40, {
        value_zh: 'China / lake-view eco camp',
        value_en: 'China / lake-view eco camp',
        content_zh: 'Lake-view ecological camp reference for light-touch deployment and nature-based hospitality.',
        content_en: 'Lake-view ecological camp reference for light-touch deployment and nature-based hospitality.',
        href: '/cases/wanlv-lake-leqing-valley',
        image_url: '/images/projects/guangdong-heyuan/image-05.jpg',
      }),
      item('primary-cta', 'View cases', 100, { href: '/cases' }),
      item('secondary-cta', 'Discuss a similar project', 110, { href: '/contact?source=home:project_proof_cta' }),
    ],
    is_visible: true,
    sort_order: 38,
  },
  {
    id: 'home:contact-band',
    page_key: 'home',
    module_key: 'contact-band',
    module_type: 'contact-band',
    title_zh: 'Get a product fit review before quotation',
    title_en: 'Get a product fit review before quotation',
    description_zh: 'Share destination, model interest, quantity, and project schedule. The inquiry path stays inside the new site and is tracked in the leads console.',
    description_en: 'Share destination, model interest, quantity, and project schedule. The inquiry path stays inside the new site and is tracked in the leads console.',
    items: [
      item('eyebrow', 'Buyer inquiry', 10),
      item('primary-cta', 'Send project brief', 20, { href: '/contact?source=home:contact_band' }),
      item('secondary-cta', 'Open product catalog', 30, { href: '/products' }),
    ],
    is_visible: true,
    sort_order: 48,
  },
]

async function hideLegacyHomepageModules(client, changes) {
  const moduleKeys = ['featured-products', 'case-proof', 'operating-proof']
  const res = await client.query(
    `SELECT module_key FROM page_modules WHERE page_key = 'home' AND module_key = ANY($1::text[]) AND is_visible = true`,
    [moduleKeys],
  )
  if (res.rowCount === 0) return
  changes.push(`home legacy modules hidden: ${res.rows.map((row) => row.module_key).join(', ')}`)
  if (apply) {
    await client.query(
      `UPDATE page_modules
       SET is_visible = false, updated_at = NOW()
       WHERE page_key = 'home' AND module_key = ANY($1::text[])`,
      [moduleKeys],
    )
  }
}

async function upsertSiteSetting(client, key, value, changes) {
  const res = await client.query(`SELECT value FROM site_settings WHERE key = $1 LIMIT 1`, [key])
  const nextValue = JSON.stringify(value)
  const currentValue = res.rows[0]?.value
  if (res.rowCount > 0 && stableJson(currentValue) === stableJson(value)) return
  changes.push(`site_settings:${key} refresh`)
  if (apply) {
    await client.query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, nextValue],
    )
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    const hasPageModules = await tableExists(client, 'page_modules')
    const hasSiteSettings = await tableExists(client, 'site_settings')
    if (!hasPageModules) throw new Error('page_modules table is missing')

    await patchHomeHero(client, changes)
    for (const pageModule of homeModules) {
      await upsertPageModule(client, pageModule, changes)
    }
    await hideLegacyHomepageModules(client, changes)

    if (hasSiteSettings) {
      await upsertSiteSetting(client, 'seoTitleEn', 'Prefab Resort Cabins and Modular Hospitality Units | VESSEL', changes)
      await upsertSiteSetting(
        client,
        'seoDescriptionEn',
        'Explore VESSEL prefab resort cabins, modular hospitality units, product models, project references, buyer materials, and inquiry paths for overseas projects.',
        changes,
      )
    }
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B35 homepage sales backfill applied.' : 'B35 homepage sales backfill dry-run.')
  if (changes.length === 0) {
    console.log('No B35 changes needed.')
  } else {
    for (const change of changes) console.log(`- ${change}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
