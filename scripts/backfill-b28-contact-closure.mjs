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

const DEFAULT_CONTACT_URL = 'https://en.303vessel.cn/contact.html'

function item(id, label, sortOrder, extra = {}) {
  return { id, label_zh: label, label_en: label, is_visible: true, sort_order: sortOrder, ...extra }
}

const modules = [
  {
    id: 'contact:hero',
    page_key: 'contact',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: 'Contact VESSEL',
    title_en: 'Contact VESSEL',
    description_zh: 'Share your country, project scenario, quantity, and timeline so the team can route your inquiry to the right contact.',
    description_en: 'Share your country, project scenario, quantity, and timeline so the team can route your inquiry to the right contact.',
    items: [
      item('eyebrow', 'Project Inquiry', 10),
      item('primary-cta', 'Send Inquiry', 20, { href: '/contact?source=contact:hero_primary' }),
      item('secondary-cta', 'View Products', 30, { href: '/products' }),
    ],
    is_visible: true,
    sort_order: 10,
  },
  {
    id: 'contact:channels',
    page_key: 'contact',
    module_key: 'channels',
    module_type: 'fixed-content',
    title_zh: 'Contact Channels',
    title_en: 'Contact Channels',
    description_zh: 'Published contact channels shown on the new site contact page.',
    description_en: 'Published contact channels shown on the new site contact page.',
    items: [
      item('whatsapp', 'WhatsApp', 10, { href: 'https://wa.me/8618024176679', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679' }),
      item('email', 'Email', 20, { href: 'mailto:303vessel@303industries.cn', content_zh: '303vessel@303industries.cn', content_en: '303vessel@303industries.cn' }),
      item('phone', 'Phone', 30, { href: 'tel:+8618024176679', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679' }),
      item('address', 'Address', 40, { content_zh: 'China factory and international project support', content_en: 'China factory and international project support' }),
    ],
    is_visible: true,
    sort_order: 20,
  },
  {
    id: 'contact:form',
    page_key: 'contact',
    module_key: 'form',
    module_type: 'form',
    title_zh: 'Send your project brief',
    title_en: 'Send your project brief',
    description_zh: 'The inquiry is saved to the new leads center with the page source preserved.',
    description_en: 'The inquiry is saved to the new leads center with the page source preserved.',
    items: [
      item('inquiry-type', 'Contact Inquiry', 10),
      item('form-eyebrow', 'Inquiry Form', 20),
      item('form-name', 'Name', 30),
      item('form-email', 'Email', 40),
      item('form-phone', 'Phone / WhatsApp', 50),
      item('form-country', 'Country / City', 60),
      item('form-company', 'Company / Organization', 70),
      item('form-quantity', 'Quantity / Site Scale', 80),
      item('form-message', 'Project Brief', 90),
      item('form-submit', 'Submit Inquiry', 100),
      item('form-submitting', 'Submitting', 110),
      item('form-success', 'Inquiry received. The team will review your project details and respond.', 120),
      item('form-error', 'Submission failed. Please try again.', 130),
      item('form-source-prefix', 'Source', 140),
      item('form-company-prefix', 'Company', 150),
      item('form-model', 'Main contact page', 160),
    ],
    is_visible: true,
    sort_order: 30,
  },
  {
    id: 'contact:backup',
    page_key: 'contact',
    module_key: 'backup',
    module_type: 'fixed-content',
    title_zh: 'Legacy contact backup',
    title_en: 'Legacy contact backup',
    description_zh: 'Optional backup link to the legacy 300 contact page. The new site form remains the main contact path.',
    description_en: 'Optional backup link to the legacy 300 contact page. The new site form remains the main contact path.',
    items: [
      { ...item('legacy-contact', 'Open legacy contact page', 10, { href: DEFAULT_CONTACT_URL }), is_visible: false },
    ],
    is_visible: false,
    sort_order: 40,
  },
  {
    id: 'contact:email',
    page_key: 'contact',
    module_key: 'email',
    module_type: 'fixed-content',
    title_zh: 'Contact email copy',
    title_en: 'Contact email copy',
    description_zh: 'Customer confirmation email copy for contact inquiries.',
    description_en: 'Customer confirmation email copy for contact inquiries.',
    items: [
      item('confirmation-subject', 'We received your VESSEL inquiry', 10),
      item('confirmation-greeting', 'Thank you for contacting VESSEL.', 20),
      item('confirmation-body', 'Your inquiry has been saved and the team will review your project information.', 30),
    ],
    is_visible: true,
    sort_order: 50,
  },
]

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

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

function mergeItems(existing, defaults) {
  const existingIds = new Set(existing.map((row) => row?.id).filter(Boolean))
  const added = defaults.filter((row) => row?.id && !existingIds.has(row.id))
  return { items: [...existing, ...added], added: added.map((row) => row.id) }
}

function normalizeLegacyHref(item, pageKey, moduleKey) {
  const href = String(item?.href ?? '').trim()
  if (!href) return { item, changed: false }
  if (pageKey === 'contact' && moduleKey === 'backup') return { item, changed: false }

  try {
    const url = new URL(href)
    if (url.hostname.endsWith('303vessel.cn') && url.pathname.endsWith('/contact.html')) {
      const source = url.searchParams.get('source')
      return { item: { ...item, href: source ? `/contact?source=${encodeURIComponent(source).slice(0, 200)}` : '/contact' }, changed: true }
    }
    if (url.hostname.endsWith('303vessel.cn') && url.pathname.endsWith('/products_list.html')) {
      return { item: { ...item, href: '/products' }, changed: true }
    }
  } catch {
    // Relative links are handled below.
  }

  if (href === DEFAULT_CONTACT_URL || href.endsWith('/contact.html')) {
    return { item: { ...item, href: '/contact' }, changed: true }
  }
  if (href === 'https://en.303vessel.cn/products_list.html' || href.endsWith('/products_list.html')) {
    return { item: { ...item, href: '/products' }, changed: true }
  }
  return { item, changed: false }
}

async function upsertContactModules(client, changes) {
  for (const pageModule of modules) {
    const existing = await client.query(
      'SELECT id, items, is_visible FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1',
      [pageModule.page_key, pageModule.module_key],
    )

    if (existing.rowCount === 0) {
      changes.push(`${pageModule.page_key}:${pageModule.module_key} insert ${pageModule.items.length} items`)
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
      continue
    }

    const { items, added } = mergeItems(normalizeItems(existing.rows[0].items), pageModule.items)
    const visibilityChanged = Boolean(existing.rows[0].is_visible) !== Boolean(pageModule.is_visible)
    if (added.length === 0 && !visibilityChanged) continue
    const parts = []
    if (added.length > 0) parts.push(`add ${added.join(', ')}`)
    if (visibilityChanged) parts.push(`visibility ${existing.rows[0].is_visible} -> ${pageModule.is_visible}`)
    changes.push(`${pageModule.page_key}:${pageModule.module_key} ${parts.join('; ')}`)
    if (apply) {
      await client.query(
        `UPDATE page_modules
         SET items = $3::jsonb,
             title_zh = CASE WHEN COALESCE(title_zh, '') = '' THEN $4 ELSE title_zh END,
             title_en = CASE WHEN COALESCE(title_en, '') = '' THEN $5 ELSE title_en END,
             description_zh = CASE WHEN COALESCE(description_zh, '') = '' THEN $6 ELSE description_zh END,
             description_en = CASE WHEN COALESCE(description_en, '') = '' THEN $7 ELSE description_en END,
             is_visible = $8
         WHERE page_key = $1 AND module_key = $2`,
        [
          pageModule.page_key,
          pageModule.module_key,
          JSON.stringify(items),
          pageModule.title_zh,
          pageModule.title_en,
          pageModule.description_zh,
          pageModule.description_en,
          pageModule.is_visible,
        ],
      )
    }
  }
}

async function rewriteLegacyPageModuleLinks(client, changes) {
  const rows = await client.query('SELECT id, page_key, module_key, items FROM page_modules')
  for (const row of rows.rows) {
    const items = normalizeItems(row.items)
    let changed = false
    const nextItems = items.map((item) => {
      const result = normalizeLegacyHref(item, row.page_key, row.module_key)
      if (result.changed) changed = true
      return result.item
    })
    if (!changed) continue
    changes.push(`${row.page_key}:${row.module_key} rewrite legacy old-site href`)
    if (apply) {
      await client.query(
        'UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1',
        [row.id, JSON.stringify(nextItems)],
      )
    }
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []

  try {
    await client.query('BEGIN')
    await upsertContactModules(client, changes)
    await rewriteLegacyPageModuleLinks(client, changes)

    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B28 contact closure backfill applied.' : 'B28 contact closure dry-run.')
  if (changes.length === 0) console.log('No missing contact modules or legacy page module links found.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  if (err instanceof Error) console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  else console.error(err)
  process.exit(1)
})
