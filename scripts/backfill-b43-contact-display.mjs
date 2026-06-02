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

const CONTACT_HERO_ITEMS = [
  item('hero-image-01', '', 100, {
    image_url: '/images/hero/optimized/homepage_banner-05.jpg',
  }),
  item('hero-proof-01', '300+ project references', 110, {
    value_zh: '300+',
    value_en: '300+',
    content_zh: 'Published resort, hospitality, and commercial deployment references',
    content_en: 'Published resort, hospitality, and commercial deployment references',
  }),
  item('hero-proof-02', '30+ countries', 120, {
    value_zh: '30+',
    value_en: '30+',
    content_zh: 'International project and logistics experience',
    content_en: 'International project and logistics experience',
  }),
  item('hero-proof-03', 'WhatsApp and email', 130, {
    value_zh: 'WhatsApp / Email',
    value_en: 'WhatsApp / Email',
    content_zh: 'Published contact channels are shown from the contact module',
    content_en: 'Published contact channels are shown from the contact module',
  }),
]

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function patchContactHero(client, changes) {
  const res = await client.query(
    `SELECT id, items
     FROM page_modules
     WHERE page_key = 'contact' AND module_key = 'hero'
     LIMIT 1`,
  )
  if (res.rowCount === 0) {
    changes.push('contact:hero missing; no insert in B43')
    return
  }

  const current = normalizeArray(res.rows[0].items)
  const currentIds = new Set(current.map((entry) => entry?.id).filter(Boolean))
  const additions = CONTACT_HERO_ITEMS.filter((entry) => !currentIds.has(entry.id))
  if (additions.length === 0) return

  changes.push(`contact:hero add ${additions.map((entry) => entry.id).join(', ')}`)
  if (apply) {
    await client.query(
      `UPDATE page_modules
       SET items = $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [res.rows[0].id, JSON.stringify([...current, ...additions])],
    )
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []

  try {
    await client.query('BEGIN')
    if (!(await tableExists(client, 'public.page_modules'))) {
      throw new Error('page_modules table is missing')
    }
    await patchContactHero(client, changes)
    if (apply) {
      await client.query('COMMIT')
    } else {
      await client.query('ROLLBACK')
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  if (changes.length === 0) {
    console.log('B43 contact display dry-run. No changes needed.')
    return
  }

  console.log(apply ? 'B43 contact display applied:' : 'B43 contact display dry-run:')
  for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
