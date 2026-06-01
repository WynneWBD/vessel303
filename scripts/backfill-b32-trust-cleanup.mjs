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

const CJK_RE = /[\u3400-\u9FFF]/
const TEST_NEWS_RE = /\b(?:weisu|weisuweisu|codex|test|b\d{2}(?:-\d+)?)\b/i

function normalizeItems(value) {
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value
}

function item(id, labelZh, labelEn, sortOrder, extra = {}) {
  return { id, label_zh: labelZh, label_en: labelEn, is_visible: true, sort_order: sortOrder, ...extra }
}

function shouldReplaceEnglish(value) {
  const text = String(value ?? '').trim()
  return !text || CJK_RE.test(text)
}

function textFromUnknown(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function patchPageModuleItems(client, pageKey, moduleKey, patcher, changes) {
  const res = await client.query(
    'SELECT id, items FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1',
    [pageKey, moduleKey],
  )
  if (res.rowCount === 0) return
  let changed = false
  const nextItems = normalizeItems(res.rows[0].items).map((entry) => {
    const result = patcher(entry)
    if (result.changed) changed = true
    return result.item
  })
  if (!changed) return
  changes.push(`${pageKey}:${moduleKey} patched`)
  if (apply) {
    await client.query('UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1', [res.rows[0].id, JSON.stringify(nextItems)])
  }
}

async function patchFooterProducts(client, changes) {
  await patchPageModuleItems(client, 'site', 'footer-products', (entry) => {
    if (!entry || typeof entry !== 'object') return { item: entry, changed: false }
    if (entry.id === 'e6' && entry.href !== '/products/e6-gen6-standard') {
      return { item: { ...entry, href: '/products/e6-gen6-standard' }, changed: true }
    }
    if (entry.id === 'e3' && entry.href !== '/products/e3-gen6-standard') {
      return { item: { ...entry, href: '/products/e3-gen6-standard' }, changed: true }
    }
    return { item: entry, changed: false }
  }, changes)
}

async function patchNewsReadiness(client, changes) {
  if (!(await tableExists(client, 'public.news'))) return
  const news = await client.query(
    `SELECT id, slug, title_zh, title_en, excerpt_zh, excerpt_en, content_zh, content_en
     FROM news
     WHERE status = 'published' AND deleted_at IS NULL`,
  )

  const testIds = []
  const credibleRows = []
  for (const row of news.rows) {
    const text = [
      row.slug,
      row.title_zh,
      row.title_en,
      row.excerpt_zh,
      row.excerpt_en,
      textFromUnknown(row.content_zh),
      textFromUnknown(row.content_en),
    ].join(' ')
    if (TEST_NEWS_RE.test(text)) testIds.push(row.id)
    else credibleRows.push(row)
  }

  if (testIds.length > 0) {
    changes.push(`news demote test-like published rows: ${testIds.join(', ')}`)
    if (apply) {
      await client.query(
        `UPDATE news
         SET status = 'draft', published_at = NULL, updated_at = NOW()
         WHERE id = ANY($1::int[])`,
        [testIds],
      )
    }
  }

  const newsReady = credibleRows.length >= 2
  await patchPageModuleItems(client, 'site', 'navbar', (entry) => {
    if (!entry || typeof entry !== 'object' || entry.id !== 'nav-news') return { item: entry, changed: false }
    if (Boolean(entry.is_visible) === newsReady) return { item: entry, changed: false }
    return { item: { ...entry, is_visible: newsReady }, changed: true }
  }, changes)
  await patchPageModuleItems(client, 'site', 'footer-company', (entry) => {
    if (!entry || typeof entry !== 'object' || entry.id !== 'news') return { item: entry, changed: false }
    if (Boolean(entry.is_visible) === newsReady) return { item: entry, changed: false }
    return { item: { ...entry, is_visible: newsReady }, changed: true }
  }, changes)

  if (!newsReady) changes.push(`news entry hidden because credible published news count is ${credibleRows.length}`)
}

const productUiItems = [
  item('matching-products-label', '匹配产品', 'Matching products', 100),
  item('active-filters-label', '当前筛选', 'Current filters', 110),
  item('query-filter-label', '搜索', 'Search', 120),
  item('category-filter-label', '分类', 'Category', 130),
  item('attribute-filter-label', '属性', 'Attribute', 140),
  item('clear-filter-label', '清除筛选', 'Clear filters', 150),
  item('empty-state-body', '请调整搜索词或筛选条件后重试。', 'Adjust the search term or filters and try again.', 170),
]

async function patchProductUiLabels(client, changes) {
  const res = await client.query(
    'SELECT id, items FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1',
    ['products', 'ui-labels'],
  )
  if (res.rowCount === 0) return
  const existing = normalizeItems(res.rows[0].items)
  const ids = new Set(existing.map((row) => row?.id).filter(Boolean))
  const additions = productUiItems.filter((row) => !ids.has(row.id))
  if (additions.length === 0) return
  changes.push(`products:ui-labels add ${additions.map((row) => row.id).join(', ')}`)
  if (apply) {
    await client.query(
      'UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1',
      [res.rows[0].id, JSON.stringify([...existing, ...additions])],
    )
  }
}

const scenarioContent = {
  tourism: {
    titleEn: 'Tourism & Resort Modular Cabin Solutions',
    summaryEn: 'Deploy guest-ready modular cabins for resorts, glamping sites, scenic areas, and destination hospitality projects.',
    bodyEn: 'Use VESSEL modular cabins to build resort rooms, scenic area stays, reception spaces, and supporting service units with a controlled manufacturing and deployment process.',
    ctaLabelEn: 'Plan a Resort Project',
    ctaHref: '/contact?source=scenario:tourism:cta',
    payload: {
      labelEn: 'Tourism & Resort',
      titleGoldEn: 'Guest-Ready Modular Cabins',
      heroTaglineEn: 'For resort operators, glamping investors, and scenic destination owners.',
      featuresLabelEn: 'Use Cases',
      featuresTitleEn: 'Hospitality scenes VESSEL can support',
      processLabelEn: 'Deployment Flow',
      processTitleEn: 'From project brief to delivered cabin',
      specsEn: [
        { label: 'Typical scenes', value: 'Resort / Glamping / Scenic Area' },
        { label: 'Lead source', value: 'Scenario Inquiry' },
        { label: 'Recommended path', value: 'Products + Cases + Contact' },
      ],
      featuresEn: [
        { title: 'Guest accommodation', body: 'Cabin rooms for resort stays, destination hotels, and themed hospitality projects.' },
        { title: 'Reception and service units', body: 'Support spaces for check-in, service, retail, and visitor operations.' },
        { title: 'Phased deployment', body: 'Start with a small number of units and expand after the operating model is validated.' },
      ],
      processEn: [
        { step: '01', title: 'Project brief', body: 'Confirm country, site type, quantity range, local climate, and guest positioning.' },
        { step: '02', title: 'Model matching', body: 'Match cabin series, layouts, materials, utilities, and delivery requirements.' },
        { step: '03', title: 'Production and delivery', body: 'Coordinate factory production, packing, shipping, and destination-side preparation.' },
      ],
      recommendedProductsEn: [
        { label: 'E7 Gen6', href: '/products/e7-gen6-flagship' },
        { label: 'V9 Gen6', href: '/products/v9-gen6-standard' },
        { label: 'All Products', href: '/products' },
      ],
    },
  },
  commercial: {
    titleEn: 'Commercial Space Modular Solutions',
    summaryEn: 'Use prefab cabin units for mobile retail, brand showrooms, pop-up commercial spaces, and destination service points.',
    bodyEn: 'VESSEL products can support commercial pilots where operators need a recognizable structure, fast installation, and flexible site usage.',
    ctaLabelEn: 'Discuss a Commercial Use Case',
    ctaHref: '/contact?source=scenario:commercial:cta',
    payload: {
      labelEn: 'Commercial Space',
      titleGoldEn: 'Flexible Brand and Retail Units',
      heroTaglineEn: 'For destination retail, service facilities, and mobile commercial pilots.',
      featuresLabelEn: 'Commercial Applications',
      featuresTitleEn: 'Modular spaces for customer-facing operations',
      processLabelEn: 'Planning Flow',
      processTitleEn: 'Validate the scene before scaling units',
      specsEn: [
        { label: 'Typical scenes', value: 'Retail / Pop-up / Showroom' },
        { label: 'Lead source', value: 'Scenario Inquiry' },
        { label: 'Recommended path', value: 'Model comparison + Contact' },
      ],
      featuresEn: [
        { title: 'Pop-up retail', body: 'Temporary or semi-permanent commercial units for outdoor destinations and traffic nodes.' },
        { title: 'Brand showroom', body: 'A recognizable product form for customer experience, sales display, or campaign launches.' },
        { title: 'Service point', body: 'Support functions for ticketing, equipment rental, beverage, and customer service.' },
      ],
      processEn: [
        { step: '01', title: 'Scene definition', body: 'Clarify operating hours, customer flow, branding needs, and utility conditions.' },
        { step: '02', title: 'Configuration check', body: 'Confirm layout, façade, utility standard, signage, and logistics constraints.' },
        { step: '03', title: 'Pilot launch', body: 'Ship and deploy the pilot unit before expanding into multiple locations.' },
      ],
      recommendedProductsEn: [
        { label: 'E6 Gen6', href: '/products/e6-gen6-standard' },
        { label: 'E3 Gen6', href: '/products/e3-gen6-standard' },
        { label: 'All Products', href: '/products' },
      ],
    },
  },
  public: {
    titleEn: 'Public Facility Modular Solutions',
    summaryEn: 'Prefab service units for public amenities, site support, temporary operations, and remote service coverage.',
    bodyEn: 'VESSEL modular units can be configured for public-facing support spaces where durable construction, clear logistics, and service continuity matter.',
    ctaLabelEn: 'Plan a Public Facility',
    ctaHref: '/contact?source=scenario:public:cta',
    payload: {
      labelEn: 'Public Facilities',
      titleGoldEn: 'Service Units for Public Sites',
      heroTaglineEn: 'For public amenities, temporary service coverage, and destination support.',
      featuresLabelEn: 'Facility Types',
      featuresTitleEn: 'Public-facing spaces that need reliable deployment',
      processLabelEn: 'Delivery Checks',
      processTitleEn: 'Define service needs before configuration',
      specsEn: [
        { label: 'Typical scenes', value: 'Amenities / Support / Remote Service' },
        { label: 'Lead source', value: 'Scenario Inquiry' },
        { label: 'Recommended path', value: 'Requirement review + Contact' },
      ],
      featuresEn: [
        { title: 'Public amenities', body: 'Units for visitor service, rest points, temporary reception, or support facilities.' },
        { title: 'Remote operations', body: 'Deployment to sites where conventional construction is slower or less flexible.' },
        { title: 'Multi-unit support', body: 'Combine accommodation, service, and utility functions for destination operations.' },
      ],
      processEn: [
        { step: '01', title: 'Requirement list', body: 'Confirm users, service hours, site restrictions, utilities, and climate conditions.' },
        { step: '02', title: 'Unit planning', body: 'Select the appropriate model, layout, façade, and utility standard.' },
        { step: '03', title: 'Site coordination', body: 'Coordinate transport, placement, foundation interface, and local service setup.' },
      ],
      recommendedProductsEn: [
        { label: 'V9 Gen6', href: '/products/v9-gen6-standard' },
        { label: 'E7 Gen6', href: '/products/e7-gen6-flagship' },
        { label: 'All Products', href: '/products' },
      ],
    },
  },
}

async function patchScenarioEnglishContent(client, changes) {
  if (!(await tableExists(client, 'public.site_content_items'))) return

  for (const [slug, content] of Object.entries(scenarioContent)) {
    const res = await client.query(
      `SELECT id, title_en, summary_en, body_en, cta_label_en, cta_href, payload, status
       FROM site_content_items
       WHERE kind = 'scenario' AND slug = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [slug],
    )
    if (res.rowCount === 0) {
      changes.push(`scenario:${slug} insert English published sample`)
      if (apply) {
        await client.query(
          `INSERT INTO site_content_items (
             kind, slug, title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
             cta_label_zh, cta_label_en, cta_href, payload, status, sort_order, published_at
           ) VALUES (
             'scenario', $1, '', $2, NULL, $3, NULL, $4, NULL, $5, $6, $7::jsonb, 'published', 100, NOW()
           )`,
          [slug, content.titleEn, content.summaryEn, content.bodyEn, content.ctaLabelEn, content.ctaHref, JSON.stringify(content.payload)],
        )
      }
      continue
    }

    const row = res.rows[0]
    const nextPayload = { ...normalizeObject(row.payload), ...content.payload }
    const updates = {
      title_en: shouldReplaceEnglish(row.title_en) ? content.titleEn : row.title_en,
      summary_en: shouldReplaceEnglish(row.summary_en) ? content.summaryEn : row.summary_en,
      body_en: shouldReplaceEnglish(row.body_en) ? content.bodyEn : row.body_en,
      cta_label_en: shouldReplaceEnglish(row.cta_label_en) ? content.ctaLabelEn : row.cta_label_en,
      cta_href: String(row.cta_href ?? '').trim() ? row.cta_href : content.ctaHref,
      payload: nextPayload,
      status: row.status === 'published' ? row.status : 'published',
    }
    const changed = [
      updates.title_en !== row.title_en,
      updates.summary_en !== row.summary_en,
      updates.body_en !== row.body_en,
      updates.cta_label_en !== row.cta_label_en,
      updates.cta_href !== row.cta_href,
      JSON.stringify(updates.payload) !== JSON.stringify(normalizeObject(row.payload)),
      updates.status !== row.status,
    ].some(Boolean)
    if (!changed) continue
    changes.push(`scenario:${slug} refresh English published content`)
    if (apply) {
      await client.query(
        `UPDATE site_content_items
         SET title_en = $2,
             summary_en = $3,
             body_en = $4,
             cta_label_en = $5,
             cta_href = $6,
             payload = $7::jsonb,
             status = $8::varchar,
             published_at = CASE WHEN $8::varchar = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END,
             updated_at = NOW()
         WHERE id = $1`,
        [row.id, updates.title_en, updates.summary_en, updates.body_en, updates.cta_label_en, updates.cta_href, JSON.stringify(updates.payload), updates.status],
      )
    }
  }
}

async function patchMediaKitResourceRequests(client, changes) {
  if (!(await tableExists(client, 'public.site_content_items'))) return
  const res = await client.query(
    `SELECT slug, title_en, file_url, cta_href, status
     FROM site_content_items
     WHERE kind = 'media_file' AND deleted_at IS NULL`,
  )
  const hasUsableResource = res.rows.some((row) => row.status === 'published' && (String(row.file_url ?? '').trim() || String(row.cta_href ?? '').trim()))
  if (hasUsableResource) return

  const resources = [
    {
      slug: 'product-brochure-request',
      titleEn: 'Product brochure and specification request',
      summaryEn: 'Request the latest product brochure, specification sheet, and model comparison package from the sales team.',
      ctaLabelEn: 'Request materials',
      ctaHref: '#request-form',
      sortOrder: 10,
    },
    {
      slug: 'case-photo-request',
      titleEn: 'Project photo and case reference request',
      summaryEn: 'Request case photos and project references suitable for procurement review.',
      ctaLabelEn: 'Request case assets',
      ctaHref: '#request-form',
      sortOrder: 20,
    },
  ]

  for (const resource of resources) {
    const existing = res.rows.find((row) => row.slug === resource.slug)
    if (existing) continue
    changes.push(`media_file:${resource.slug} insert request resource`)
    if (apply) {
      await client.query(
        `INSERT INTO site_content_items (
           kind, slug, title_zh, title_en, summary_zh, summary_en,
           cta_label_zh, cta_label_en, cta_href, payload, status, sort_order, published_at
         ) VALUES (
           'media_file', $1, '', $2, NULL, $3, NULL, $4, $5, '{}'::jsonb, 'published', $6, NOW()
         )`,
        [resource.slug, resource.titleEn, resource.summaryEn, resource.ctaLabelEn, resource.ctaHref, resource.sortOrder],
      )
    }
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []

  try {
    await client.query('BEGIN')
    await patchFooterProducts(client, changes)
    await patchNewsReadiness(client, changes)
    await patchProductUiLabels(client, changes)
    await patchScenarioEnglishContent(client, changes)
    await patchMediaKitResourceRequests(client, changes)

    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B32 trust cleanup backfill applied.' : 'B32 trust cleanup dry-run.')
  if (changes.length === 0) console.log('No B32 trust cleanup changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  if (err instanceof Error) console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  else console.error(err)
  process.exit(1)
})
