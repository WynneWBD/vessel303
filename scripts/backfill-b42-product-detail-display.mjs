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

function item(id, labelZh, labelEn, sortOrder, extra = {}) {
  return { id, label_zh: labelZh, label_en: labelEn, is_visible: true, sort_order: sortOrder, ...extra }
}

function mergeMissingItems(existing, defaults) {
  const current = normalizeArray(existing)
  const byId = new Map(current.map((row) => [row?.id, row]).filter(([id]) => Boolean(id)))
  for (const entry of defaults) {
    if (!entry?.id || byId.has(entry.id)) continue
    byId.set(entry.id, entry)
  }
  return [...byId.values()].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
}

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function patchProductUiLabels(client, changes) {
  if (!(await tableExists(client, 'public.page_modules'))) return
  const res = await client.query(
    `SELECT id, items FROM page_modules WHERE page_key = 'products' AND module_key = 'ui-labels' LIMIT 1`,
  )
  if (res.rowCount === 0) {
    changes.push('products:ui-labels missing; no B42 labels written')
    return
  }

  const current = normalizeArray(res.rows[0].items)
  const next = mergeMissingItems(current, [
    item('description-title', 'Product Description', 'Product Description', 145),
    item('all-products-label', 'All Products', 'All Products', 146),
    item('hero-inquiry-cta', 'Request Quote', 'Request Quote', 190),
  ])
  if (stableJson(current) === stableJson(next)) return

  changes.push('products:ui-labels add missing B42 detail display labels')
  if (apply) {
    await client.query(
      `UPDATE page_modules SET items = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [res.rows[0].id, JSON.stringify(next)],
    )
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    await client.query('BEGIN')
    await patchProductUiLabels(client, changes)
    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B42 product detail display backfill applied.' : 'B42 product detail display dry-run.')
  if (changes.length === 0) console.log('No B42 changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((err) => {
  if (err instanceof Error) console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  else console.error(err)
  process.exit(1)
})
