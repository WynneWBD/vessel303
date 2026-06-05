import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')
const confirmed = process.argv.includes('--confirm-production-contact-governance')

const CONTACT_EMAIL = '303vessel@303industries.cn'
const CONTACT_PHONE = '+86 180 2417 6679'
const CONTACT_PHONE_TEL = 'tel:+8618024176679'
const WHATSAPP_HREF = 'https://wa.me/8618024176679'

const PUBLIC_PAGE_KEYS = [
  'site',
  'contact',
  'home',
  'products',
  'cases',
  'about',
  'faq',
  'media-kit',
  'scenarios',
  'innovation',
  'display',
]

const CONTACT_MODULE_KEYS = new Set([
  'footer-cta',
  'footer-brand',
  'footer-contact',
  'floating-contact',
  'channels',
])

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

if (apply && !confirmed) {
  console.error('Refusing to write production contact content without --confirm-production-contact-governance.')
  process.exit(1)
}

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

function stringifyItem(item) {
  return JSON.stringify(item ?? {})
}

function hasDomestic400(value) {
  return /400-?8090-?303|tel:400-?8090-?303|tel:4008090303/i.test(String(value ?? ''))
}

function hasLegacyEmail(value) {
  return /vessel\.sale@303industries\.cn/i.test(String(value ?? ''))
}

function hasLegacy303Link(value) {
  return /303vessel\.cn\/(?:contact|products_list)\.html|(?:contact|products_list)\.html/i.test(String(value ?? ''))
}

function normalizeLegacyHref(href) {
  const value = String(href ?? '').trim()
  if (!value) return value
  if (/303vessel\.cn\/contact\.html|\/contact\.html|^contact\.html$/i.test(value)) return '/contact'
  if (/303vessel\.cn\/products_list\.html|\/products_list\.html|^products_list\.html$/i.test(value)) return '/products'
  return value
}

function patchContactItem(moduleKey, item) {
  if (!item || typeof item !== 'object') return { item, reasons: [] }
  const next = { ...item }
  const reasons = []
  const serialized = stringifyItem(next)
  const id = String(next.id ?? '').toLowerCase()

  if (hasDomestic400(serialized)) {
    if (id.includes('whatsapp')) {
      next.href = WHATSAPP_HREF
      next.label_zh = `WhatsApp: ${CONTACT_PHONE}`
      next.label_en = `WhatsApp: ${CONTACT_PHONE}`
      next.content_zh = CONTACT_PHONE
      next.content_en = CONTACT_PHONE
    } else {
      next.href = CONTACT_PHONE_TEL
      next.label_zh = `Phone: ${CONTACT_PHONE}`
      next.label_en = `Phone: ${CONTACT_PHONE}`
      next.content_zh = CONTACT_PHONE
      next.content_en = CONTACT_PHONE
    }
    reasons.push('replace domestic 400 phone')
  }

  if (hasLegacyEmail(serialized) || id === 'email') {
    const href = String(next.href ?? '')
    const label = String(next.label_en ?? next.label_zh ?? '')
    if (hasLegacyEmail(href) || hasLegacyEmail(label)) {
      next.href = `mailto:${CONTACT_EMAIL}`
      next.label_zh = moduleKey === 'footer-brand' ? `Email: ${CONTACT_EMAIL}` : CONTACT_EMAIL
      next.label_en = moduleKey === 'footer-brand' ? `Email: ${CONTACT_EMAIL}` : CONTACT_EMAIL
      next.content_zh = CONTACT_EMAIL
      next.content_en = CONTACT_EMAIL
      reasons.push('replace legacy sales email')
    }
  }

  if (hasLegacy303Link(serialized) && next.href) {
    const normalized = normalizeLegacyHref(next.href)
    if (normalized !== next.href) {
      next.href = normalized
      reasons.push('normalize legacy 303 link')
    }
  }

  return { item: next, reasons }
}

function compactItem(item) {
  return {
    id: item?.id ?? '',
    href: item?.href ?? '',
    label_en: item?.label_en ?? '',
    content_en: item?.content_en ?? '',
  }
}

async function patchPageModules(client, changes) {
  const rows = await client.query(
    `SELECT id, page_key, module_key, items
     FROM page_modules
     WHERE page_key = ANY($1::text[])`,
    [PUBLIC_PAGE_KEYS],
  )

  for (const row of rows.rows) {
    if (row.page_key === 'contact' && row.module_key === 'backup') continue

    const items = normalizeItems(row.items)
    let changed = false
    const moduleWarnings = []
    const patchableModule = row.page_key === 'site'
      ? CONTACT_MODULE_KEYS.has(row.module_key)
      : CONTACT_MODULE_KEYS.has(row.module_key) || row.page_key === 'contact'

    const nextItems = items.map((entry) => {
      const text = stringifyItem(entry)
      if (!hasDomestic400(text) && !hasLegacyEmail(text) && !hasLegacy303Link(text)) return entry

      if (!patchableModule) {
        moduleWarnings.push({
          item_id: entry?.id ?? '',
          reason: 'warning only; module not in B99 contact scope',
          before: compactItem(entry),
        })
        return entry
      }

      const patched = patchContactItem(row.module_key, entry)
      if (patched.reasons.length === 0) {
        moduleWarnings.push({
          item_id: entry?.id ?? '',
          reason: 'warning only; no safe deterministic patch',
          before: compactItem(entry),
        })
        return entry
      }

      changed = true
      moduleWarnings.push({
        item_id: entry?.id ?? '',
        reason: patched.reasons.join('; '),
        before: compactItem(entry),
        after: compactItem(patched.item),
      })
      return patched.item
    })

    if (moduleWarnings.length > 0) {
      changes.push({
        scope: `${row.page_key}:${row.module_key}`,
        type: changed ? 'patch' : 'warning',
        items: moduleWarnings,
      })
    }

    if (changed && apply) {
      await client.query(
        `UPDATE page_modules
         SET items = $2::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [row.id, JSON.stringify(nextItems)],
      )
    }
  }
}

async function patchSiteSettings(client, changes) {
  const desired = new Map([
    ['salesEmail', CONTACT_EMAIL],
    ['salesPhone', CONTACT_PHONE],
    ['whatsapp', CONTACT_PHONE],
  ])
  const rows = await client.query(
    `SELECT key, value
     FROM site_settings
     WHERE key = ANY($1::text[])`,
    [[...desired.keys()]],
  )

  for (const row of rows.rows) {
    const text = typeof row.value === 'string' ? row.value : JSON.stringify(row.value)
    const shouldPatch = hasDomestic400(text) || hasLegacyEmail(text)
    if (!shouldPatch) continue
    const nextValue = desired.get(row.key)
    if (!nextValue) continue
    changes.push({
      scope: `site_settings:${row.key}`,
      type: 'patch',
      items: [{
        reason: hasDomestic400(text) ? 'replace domestic 400 phone setting' : 'replace legacy sales email setting',
        before: { value: row.value },
        after: { value: nextValue },
      }],
    })
    if (apply) {
      await client.query(
        `UPDATE site_settings
         SET value = $2::jsonb,
             updated_at = NOW()
         WHERE key = $1`,
        [row.key, JSON.stringify(nextValue)],
      )
    }
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []

  try {
    await client.query('BEGIN')
    await patchPageModules(client, changes)
    await patchSiteSettings(client, changes)

    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B99 contact governance applied.' : 'B99 contact governance dry-run.')
  if (changes.length === 0) {
    console.log('No B99 contact governance changes needed.')
    return
  }
  for (const change of changes) {
    console.log(`- ${change.scope} ${change.type}`)
    for (const entry of change.items) {
      console.log(`  - ${entry.item_id || entry.reason}: ${entry.reason}`)
      console.log(`    before ${JSON.stringify(entry.before)}`)
      if (entry.after) console.log(`    after  ${JSON.stringify(entry.after)}`)
    }
  }
}

main().catch((err) => {
  if (err instanceof Error) console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  else console.error(err)
  process.exit(1)
})
