import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')

const CONTACT_EMAIL = '303vessel@303industries.cn'
const CONTACT_PHONE = '+86 180 2417 6679'
const WHATSAPP_HREF = 'https://wa.me/8618024176679'

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

function item(id, label, sortOrder, extra = {}) {
  return { id, label_zh: label, label_en: label, is_visible: true, sort_order: sortOrder, ...extra }
}

const modules = [
  {
    id: 'site:floating-contact',
    page_key: 'site',
    module_key: 'floating-contact',
    module_type: 'fixed-content',
    title_zh: 'Quick contact actions',
    title_en: 'Quick contact actions',
    description_zh: 'WhatsApp, email, and inquiry actions for overseas visitors.',
    description_en: 'WhatsApp, email, and inquiry actions for overseas visitors.',
    items: [
      item('whatsapp', 'WhatsApp', 10, {
        href: WHATSAPP_HREF,
        content_zh: CONTACT_PHONE,
        content_en: CONTACT_PHONE,
      }),
      item('email', 'Email', 20, {
        href: `mailto:${CONTACT_EMAIL}`,
        content_zh: CONTACT_EMAIL,
        content_en: CONTACT_EMAIL,
      }),
      item('inquiry', 'Project Inquiry', 30, {
        href: '/contact?source=floating:inquiry',
      }),
    ],
    is_visible: true,
    sort_order: 65,
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

function patchSiteContactItem(moduleKey, itemRow) {
  if (!itemRow || typeof itemRow !== 'object') return { item: itemRow, changed: false }
  const item = { ...itemRow }
  let changed = false

  if (moduleKey === 'footer-cta' && item.id === 'phone') {
    item.id = 'whatsapp'
    item.href = WHATSAPP_HREF
    item.label_zh = 'WhatsApp'
    item.label_en = 'WhatsApp'
    item.content_zh = CONTACT_PHONE
    item.content_en = CONTACT_PHONE
    changed = true
  }

  if (moduleKey === 'footer-contact' && (item.id === 'phone' || String(item.href ?? '').includes('4008090303'))) {
    item.id = 'whatsapp'
    item.href = WHATSAPP_HREF
    item.label_zh = 'WhatsApp'
    item.label_en = 'WhatsApp'
    item.content_zh = CONTACT_PHONE
    item.content_en = CONTACT_PHONE
    changed = true
  }

  if ((moduleKey === 'footer-contact' || moduleKey === 'footer-brand') && item.id === 'email') {
    if (String(item.href ?? '') !== `mailto:${CONTACT_EMAIL}` || String(item.label_en ?? '').includes('vessel.sale')) {
      item.href = `mailto:${CONTACT_EMAIL}`
      item.label_zh = moduleKey === 'footer-brand' ? `Email: ${CONTACT_EMAIL}` : CONTACT_EMAIL
      item.label_en = moduleKey === 'footer-brand' ? `Email: ${CONTACT_EMAIL}` : CONTACT_EMAIL
      changed = true
    }
  }

  if (moduleKey === 'footer-brand' && item.id === 'whatsapp') {
    if (String(item.href ?? '') !== WHATSAPP_HREF) {
      item.href = WHATSAPP_HREF
      item.label_zh = `WhatsApp: ${CONTACT_PHONE}`
      item.label_en = `WhatsApp: ${CONTACT_PHONE}`
      changed = true
    }
  }

  return { item, changed }
}

async function upsertModules(client, changes) {
  for (const pageModule of modules) {
    const existing = await client.query(
      `SELECT id, items, is_visible, title_zh, title_en, description_zh, description_en
       FROM page_modules
       WHERE page_key = $1 AND module_key = $2
       LIMIT 1`,
      [pageModule.page_key, pageModule.module_key],
    )

    if (existing.rowCount === 0) {
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
      continue
    }

    const { items, added } = mergeItems(normalizeItems(existing.rows[0].items), pageModule.items)
    const visibilityChanged = Boolean(existing.rows[0].is_visible) !== Boolean(pageModule.is_visible)
    const textChanged = ['title_zh', 'title_en', 'description_zh', 'description_en']
      .some((key) => String(existing.rows[0][key] ?? '') !== String(pageModule[key] ?? ''))
    if (added.length === 0 && !visibilityChanged && !textChanged) continue
    changes.push(`${pageModule.page_key}:${pageModule.module_key} ${[
      added.length ? `add ${added.join(', ')}` : '',
      visibilityChanged ? `visibility ${existing.rows[0].is_visible} -> ${pageModule.is_visible}` : '',
      textChanged ? 'refresh copy' : '',
    ].filter(Boolean).join('; ')}`)
    if (apply) {
      await client.query(
        `UPDATE page_modules
         SET items = $3::jsonb,
             is_visible = $4,
             title_zh = $5,
             title_en = $6,
             description_zh = $7,
             description_en = $8,
             updated_at = NOW()
         WHERE page_key = $1 AND module_key = $2`,
        [
          pageModule.page_key,
          pageModule.module_key,
          JSON.stringify(items),
          pageModule.is_visible,
          pageModule.title_zh,
          pageModule.title_en,
          pageModule.description_zh,
          pageModule.description_en,
        ],
      )
    }
  }
}

async function patchExistingSiteContact(client, changes) {
  const rows = await client.query(
    `SELECT id, page_key, module_key, items
     FROM page_modules
     WHERE page_key = 'site'
       AND module_key IN ('footer-cta', 'footer-brand', 'footer-contact')`,
  )

  for (const row of rows.rows) {
    let changed = false
    const nextItems = normalizeItems(row.items).map((entry) => {
      const patched = patchSiteContactItem(row.module_key, entry)
      if (patched.changed) changed = true
      return patched.item
    })
    if (!changed) continue
    changes.push(`${row.page_key}:${row.module_key} unify overseas contact`)
    if (apply) {
      await client.query(
        'UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1',
        [row.id, JSON.stringify(nextItems)],
      )
    }
  }
}

async function patchSiteSettings(client, changes) {
  const desired = {
    salesEmail: CONTACT_EMAIL,
    salesPhone: CONTACT_PHONE,
    whatsapp: CONTACT_PHONE,
  }

  for (const [key, value] of Object.entries(desired)) {
    const current = await client.query('SELECT value FROM site_settings WHERE key = $1 LIMIT 1', [key])
    const existing = current.rows[0]?.value
    const existingString = typeof existing === 'string' ? existing : ''
    const isOld = key === 'salesEmail'
      ? existingString.includes('vessel.sale')
      : existingString.includes('400-8090-303') || existingString.includes('4008090303') || existingString.trim() === ''
    if (current.rowCount > 0 && !isOld) continue
    changes.push(`site_settings:${key} ${current.rowCount > 0 ? 'update old value' : 'insert'}`)
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
}

async function main() {
  const client = await pool.connect()
  const changes = []

  try {
    await client.query('BEGIN')
    await upsertModules(client, changes)
    await patchExistingSiteContact(client, changes)
    await patchSiteSettings(client, changes)

    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B31 sales contact backfill applied.' : 'B31 sales contact dry-run.')
  if (changes.length === 0) console.log('No B31 sales contact changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  if (err instanceof Error) console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  else console.error(err)
  process.exit(1)
})
