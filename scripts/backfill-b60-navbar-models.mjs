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
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
})

const modelNav = [
  { id: 'nav-model-e7', label: 'E7 Gen6', href: '/products/e7-gen6-flagship', lookup: ['e7', 'e7-gen6-flagship'], sortOrder: 11 },
  { id: 'nav-model-v9', label: 'V9 Gen6', href: '/products/v9-gen6-standard', lookup: ['v9', 'v9-gen6-standard'], sortOrder: 12 },
  { id: 'nav-model-e6', label: 'E6 Gen6', href: '/products/e6-gen6-standard', lookup: ['e6', 'e6-gen6-standard'], sortOrder: 13 },
  { id: 'nav-model-e3', label: 'E3 Gen6', href: '/products/e3-gen6-standard', lookup: ['e3', 'e3-gen6-standard'], sortOrder: 14 },
]

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

function sameItem(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

async function loadProductImages(client) {
  const lookupValues = [...new Set(modelNav.flatMap((entry) => entry.lookup))]
  const res = await client.query(
    `SELECT id, detail_slug, image
     FROM product_catalog
     WHERE deleted_at IS NULL
       AND status = 'published'
       AND (id = ANY($1::text[]) OR detail_slug = ANY($1::text[]))`,
    [lookupValues],
  )
  const map = new Map()
  for (const row of res.rows) {
    if (row.id) map.set(row.id, row.image)
    if (row.detail_slug) map.set(row.detail_slug, row.image)
  }
  return map
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    const navRes = await client.query(
      'SELECT id, items FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1',
      ['site', 'navbar'],
    )
    if (navRes.rowCount === 0) {
      console.log(`B60 navbar model ${apply ? 'apply' : 'dry-run'}: site:navbar not found.`)
      return
    }

    const imageMap = await loadProductImages(client)
    const existing = normalizeItems(navRes.rows[0].items)
    const byId = new Map(existing.map((item) => [item?.id, item]).filter(([id]) => id))
    const next = [...existing]

    for (const entry of modelNav) {
      const imageUrl = entry.lookup.map((key) => imageMap.get(key)).find(Boolean)
      const desired = {
        id: entry.id,
        href: entry.href,
        image_url: imageUrl || undefined,
        value_zh: 'model',
        value_en: 'model',
        label_zh: entry.label,
        label_en: entry.label,
        is_visible: true,
        sort_order: entry.sortOrder,
      }
      const current = byId.get(entry.id)
      if (!current) {
        next.push(desired)
        changes.push(`add ${entry.id}`)
      } else {
        const patched = { ...current, ...desired }
        if (!sameItem(current, patched)) {
          const index = next.findIndex((item) => item?.id === entry.id)
          next[index] = patched
          changes.push(`patch ${entry.id}`)
        }
      }
    }

    next.sort((a, b) => (Number(a?.sort_order) || 0) - (Number(b?.sort_order) || 0))

    if (changes.length > 0 && apply) {
      await client.query(
        'UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1',
        [navRes.rows[0].id, JSON.stringify(next)],
      )
    }

    console.log(`B60 navbar model ${apply ? 'apply' : 'dry-run'}: ${changes.length ? changes.join(', ') : 'no changes needed'}.`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(async (err) => {
  console.error(err)
  await pool.end().catch(() => {})
  process.exit(1)
})
