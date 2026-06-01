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

function hiddenItem(id, sortOrder) {
  return {
    id,
    label_zh: '',
    label_en: '',
    is_visible: false,
    sort_order: sortOrder,
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
    `SELECT id, title_zh, title_en, description_zh, description_en, items, is_visible, sort_order, module_type
     FROM page_modules
     WHERE page_key = 'home' AND module_key = 'hero'
     LIMIT 1`,
  )
  if (res.rowCount === 0) return

  const row = res.rows[0]
  const next = {
    id: row.id,
    page_key: 'home',
    module_key: 'hero',
    module_type: row.module_type ?? 'fixed-content',
    title_zh: 'Prefab Resort Cabins and Modular Hospitality Units',
    title_en: 'Prefab Resort Cabins and Modular Hospitality Units',
    description_zh: 'Factory-built VESSEL units for resort, hotel and commercial destination projects.',
    description_en: 'Factory-built VESSEL units for resort, hotel and commercial destination projects.',
    items: [
      item('hero-tagline', 'Prefab Resort Cabins / Modular Hospitality Units', 10),
      item('hero-headline', 'Fully-assembled modular cabins ready for resort and hospitality projects', 20),
      item('hero-subtitle', 'Compare VESSEL models, view project references, request buyer materials, and start an overseas procurement conversation from one site.', 30),
      item('hero-primary-cta', 'Explore products', 40, { href: '/products' }),
      item('hero-secondary-cta', 'Send inquiry', 50, { href: '/contact?source=home:hero_contact' }),
      item('hero-proof-01', '38.8 sqm flagship cabin', 60, {
        value_zh: '38.8 sqm',
        value_en: '38.8 sqm',
        content_zh: 'Flagship reference model for premium hospitality projects',
        content_en: 'Flagship reference model for premium hospitality projects',
      }),
      item('hero-proof-02', '300+ project references', 70, {
        value_zh: '300+',
        value_en: '300+',
        content_zh: 'Published references across resort and commercial use cases',
        content_en: 'Published references across resort and commercial use cases',
      }),
      item('hero-proof-03', '30+ countries', 80, {
        value_zh: '30+',
        value_en: '30+',
        content_zh: 'International buyer and project deployment experience',
        content_en: 'International buyer and project deployment experience',
      }),
      item('hero-image-01', '', 100, { image_url: '/images/hero/optimized/homepage_banner-02.jpg' }),
      item('hero-image-02', '', 110, { image_url: '/images/hero/optimized/homepage_banner-03.jpg' }),
      item('hero-image-03', '', 120, { image_url: '/images/hero/optimized/homepage_banner-04.jpg' }),
      hiddenItem('hero-image-04', 130),
      hiddenItem('hero-image-05', 140),
    ],
    is_visible: true,
    sort_order: Number(row.sort_order ?? 10) || 10,
  }

  await upsertPageModule(client, next, changes)
}

const b36HomeModules = [
  {
    id: 'home:large-product-cards',
    page_key: 'home',
    module_key: 'large-product-cards',
    module_type: 'large-product-cards',
    title_zh: 'Cabins, showrooms and destination units built as product systems',
    title_en: 'Cabins, showrooms and destination units built as product systems',
    description_zh: 'Lead buyers directly into the product decision: model family, space size, intended use, buyer materials, and inquiry path.',
    description_en: 'Lead buyers directly into the product decision: model family, space size, intended use, buyer materials, and inquiry path.',
    items: [
      item('eyebrow', 'Product systems', 10),
      item('card-e7', 'E7 Gen6 Flagship Showroom', 20, {
        value_zh: '38.8 sqm / flagship suite',
        value_en: '38.8 sqm / flagship suite',
        content_zh: 'Large social cabin for resort suites, destination showrooms, and premium hospitality projects.',
        content_en: 'Large social cabin for resort suites, destination showrooms, and premium hospitality projects.',
        href: '/products/e7-gen6-flagship',
        image_url: '/images/products/e7-gen6-flagship.jpg',
      }),
      item('card-v9', 'V9 Gen6 Long-Stay Unit', 30, {
        value_zh: '38.8 sqm / residential flagship',
        value_en: '38.8 sqm / residential flagship',
        content_zh: 'Residential-style module for long-stay resort villas, branded camps, and destination lodging.',
        content_en: 'Residential-style module for long-stay resort villas, branded camps, and destination lodging.',
        href: '/products/v9-gen6-standard',
        image_url: '/images/products/v9-gen6-standard.jpg',
      }),
      item('primary-cta', 'View product catalog', 100, { href: '/products' }),
      item('secondary-cta', 'Request buyer materials', 110, { href: '/media-kit' }),
    ],
    is_visible: true,
    sort_order: 22,
  },
  {
    id: 'home:model-strip',
    page_key: 'home',
    module_key: 'model-strip',
    module_type: 'model-strip',
    title_zh: 'Expose the model range before buyers start searching',
    title_en: 'Expose the model range before buyers start searching',
    description_zh: 'Keep V9, E7, E6 and E3 visible as a product family so procurement visitors understand the catalog depth quickly.',
    description_en: 'Keep V9, E7, E6 and E3 visible as a product family so procurement visitors understand the catalog depth quickly.',
    items: [
      item('eyebrow', 'Model range', 10),
      item('card-v9', 'V9 Gen6', 20, {
        value_zh: '38.8 sqm / residential',
        value_en: '38.8 sqm / residential',
        content_zh: 'Long-stay flagship unit for resort villas and destination accommodation.',
        content_en: 'Long-stay flagship unit for resort villas and destination accommodation.',
        href: '/products/v9-gen6-standard',
        image_url: '/images/products/V9-Gen6_render-01.jpg',
      }),
      item('card-e7', 'E7 Gen6', 30, {
        value_zh: '38.8 sqm / showroom',
        value_en: '38.8 sqm / showroom',
        content_zh: 'Flagship social cabin for hotel suites and project showcases.',
        content_en: 'Flagship social cabin for hotel suites and project showcases.',
        href: '/products/e7-gen6-flagship',
        image_url: '/images/products/E7-Gen6_render-01.jpg',
      }),
      item('card-e6', 'E6 Gen6', 40, {
        value_zh: '29.6 sqm / resort cabin',
        value_en: '29.6 sqm / resort cabin',
        content_zh: 'Balanced footprint for glamping camps and fast deployment projects.',
        content_en: 'Balanced footprint for glamping camps and fast deployment projects.',
        href: '/products/e6-gen6-standard',
        image_url: '/images/products/E6-Gen6_render-01.jpg',
      }),
      item('card-e3', 'E3 Gen6', 50, {
        value_zh: '19 sqm / compact unit',
        value_en: '19 sqm / compact unit',
        content_zh: 'Compact model for dense layouts, support facilities, and entry-level rooms.',
        content_en: 'Compact model for dense layouts, support facilities, and entry-level rooms.',
        href: '/products/e3-gen6-standard',
        image_url: '/images/products/E3-Gen6_render-01.jpg',
      }),
      item('primary-cta', 'Compare all models', 100, { href: '/products' }),
    ],
    is_visible: true,
    sort_order: 28,
  },
  {
    id: 'home:innovation-story',
    page_key: 'home',
    module_key: 'innovation-story',
    module_type: 'innovation-story',
    title_zh: 'Technology stories that support product decisions',
    title_en: 'Technology stories that support product decisions',
    description_zh: 'Use published innovation content to connect buyer interest in comfort, control systems, manufacturing and project reliability.',
    description_en: 'Use published innovation content to connect buyer interest in comfort, control systems, manufacturing and project reliability.',
    items: [
      item('eyebrow', 'Innovation', 10),
      item('card-viie', 'VIIE Intelligent Experience', 20, {
        value_zh: 'Smart control / guest comfort',
        value_en: 'Smart control / guest comfort',
        content_zh: 'Guide buyers from product appearance to system-level guest experience and operations.',
        content_en: 'Guide buyers from product appearance to system-level guest experience and operations.',
        href: '/innovation/viie',
        image_url: '/images/about/optimized/about_factory-03.jpg',
      }),
      item('card-vipc', 'VIPC Production Control', 30, {
        value_zh: 'Factory process / quality control',
        value_en: 'Factory process / quality control',
        content_zh: 'Connect product confidence to manufacturing process, factory governance and delivery readiness.',
        content_en: 'Connect product confidence to manufacturing process, factory governance and delivery readiness.',
        href: '/innovation/vipc',
        image_url: '/images/about/optimized/about_factory-05.jpg',
      }),
      item('card-vols', 'VOLS Project Support', 40, {
        value_zh: 'Project interface / overseas support',
        value_en: 'Project interface / overseas support',
        content_zh: 'Help overseas buyers understand how model selection, site preparation and deployment support connect.',
        content_en: 'Help overseas buyers understand how model selection, site preparation and deployment support connect.',
        href: '/innovation/vols',
        image_url: '/images/about/optimized/about_globalmap-01.jpg',
      }),
      item('primary-cta', 'Explore innovation', 100, { href: '/innovation/viie' }),
    ],
    is_visible: true,
    sort_order: 34,
  },
  {
    id: 'home:scenario-tiles',
    page_key: 'home',
    module_key: 'scenario-tiles',
    module_type: 'scenario-tiles',
    title_zh: 'Application scenarios for resort, commercial and support spaces',
    title_en: 'Application scenarios for resort, commercial and support spaces',
    description_zh: 'Route visitors by project type so they can connect product models, references and inquiry paths faster.',
    description_en: 'Route visitors by project type so they can connect product models, references and inquiry paths faster.',
    items: [
      item('eyebrow', 'Applications', 10),
      item('card-tourism', 'Vacation resorts and glamping camps', 20, {
        value_zh: 'Hospitality / scenic destination',
        value_en: 'Hospitality / scenic destination',
        content_zh: 'Plan accommodation units, guest capacity, utilities and project references for destination stays.',
        content_en: 'Plan accommodation units, guest capacity, utilities and project references for destination stays.',
        href: '/scenarios/tourism',
        image_url: '/images/projects/guangdong-huizhou/image-03.jpg',
      }),
      item('card-commercial', 'Commercial display and reception spaces', 30, {
        value_zh: 'Retail / showroom / visitor services',
        value_en: 'Retail / showroom / visitor services',
        content_zh: 'Use modular units as branded showrooms, reception nodes and high-visibility commercial spaces.',
        content_en: 'Use modular units as branded showrooms, reception nodes and high-visibility commercial spaces.',
        href: '/scenarios/commercial',
        image_url: '/images/hero/optimized/homepage_banner-05.jpg',
      }),
      item('card-public', 'Public and supporting facilities', 40, {
        value_zh: 'Service points / flexible support',
        value_en: 'Service points / flexible support',
        content_zh: 'Deploy support spaces and service facilities without turning every project into fixed construction.',
        content_en: 'Deploy support spaces and service facilities without turning every project into fixed construction.',
        href: '/scenarios/public',
        image_url: '/images/products/e3-gen6-standard.jpg',
      }),
      item('primary-cta', 'Explore scenarios', 100, { href: '/scenarios/tourism' }),
      item('secondary-cta', 'Discuss project fit', 110, { href: '/contact?source=home:scenario_tiles' }),
    ],
    is_visible: true,
    sort_order: 40,
  },
  {
    id: 'home:future-explorer',
    page_key: 'home',
    module_key: 'future-explorer',
    module_type: 'future-explorer',
    title_zh: 'Move from product interest to a project conversation',
    title_en: 'Move from product interest to a project conversation',
    description_zh: 'Use the new site as the buyer path: understand the company, review projects, request materials and contact the sales team.',
    description_en: 'Use the new site as the buyer path: understand the company, review projects, request materials and contact the sales team.',
    items: [
      item('eyebrow', 'Future explorer', 10),
      item('card-about', 'Factory, patents and global references', 20, {
        value_zh: 'Company proof',
        value_en: 'Company proof',
        content_zh: 'Review factory scale, project footprint and published company proof before procurement discussion.',
        content_en: 'Review factory scale, project footprint and published company proof before procurement discussion.',
        href: '/about',
        image_url: '/images/about/optimized/about_factory-01.jpg',
      }),
      item('card-cases', 'Project references and real deployments', 30, {
        value_zh: 'Cases',
        value_en: 'Cases',
        content_zh: 'Compare project locations, use cases and published photos before choosing a product mix.',
        content_en: 'Compare project locations, use cases and published photos before choosing a product mix.',
        href: '/cases',
        image_url: '/images/projects/astrobase-mamison/exterior-02.jpg',
      }),
      item('primary-cta', 'Send project brief', 100, { href: '/contact?source=home:future_explorer' }),
      item('secondary-cta', 'Open media kit', 110, { href: '/media-kit' }),
    ],
    is_visible: true,
    sort_order: 46,
  },
  {
    id: 'home:contact-band',
    page_key: 'home',
    module_key: 'contact-band',
    module_type: 'contact-band',
    title_zh: 'Send the project brief and get a product fit review',
    title_en: 'Send the project brief and get a product fit review',
    description_zh: 'Share destination, model interest, quantity and schedule. The inquiry stays inside the new site and is tracked in the leads console.',
    description_en: 'Share destination, model interest, quantity and schedule. The inquiry stays inside the new site and is tracked in the leads console.',
    items: [
      item('eyebrow', 'Buyer inquiry', 10),
      item('primary-cta', 'Send project brief', 20, { href: '/contact?source=home:contact_band' }),
      item('secondary-cta', 'Open product catalog', 30, { href: '/products' }),
    ],
    is_visible: true,
    sort_order: 52,
  },
]

async function hideB35HomepageModules(client, changes) {
  const moduleKeys = ['product-series', 'model-grid', 'application-scenes', 'project-proof']
  const res = await client.query(
    `SELECT module_key FROM page_modules WHERE page_key = 'home' AND module_key = ANY($1::text[]) AND is_visible = true`,
    [moduleKeys],
  )
  if (res.rowCount === 0) return
  changes.push(`home B35 modules hidden: ${res.rows.map((row) => row.module_key).join(', ')}`)
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
  if (res.rowCount > 0 && stableJson(res.rows[0]?.value) === stableJson(value)) return
  changes.push(`site_settings:${key} refresh`)
  if (apply) {
    await client.query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)],
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
    for (const pageModule of b36HomeModules) {
      await upsertPageModule(client, pageModule, changes)
    }
    await hideB35HomepageModules(client, changes)

    if (hasSiteSettings) {
      await upsertSiteSetting(client, 'seoTitleEn', 'Prefab Resort Cabins and Modular Hospitality Units | VESSEL', changes)
      await upsertSiteSetting(
        client,
        'seoDescriptionEn',
        'Explore VESSEL prefab resort cabins, modular hospitality units, product models, project references, buyer materials and inquiry paths for overseas projects.',
        changes,
      )
    }
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B36 homepage visual backfill applied.' : 'B36 homepage visual backfill dry-run.')
  if (changes.length === 0) {
    console.log('No B36 changes needed.')
  } else {
    for (const change of changes) console.log(`- ${change}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
