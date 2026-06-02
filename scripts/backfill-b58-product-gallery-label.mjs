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

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

function mergeGalleryLabel(items) {
  const nextItem = {
    id: 'gallery-title',
    label_zh: 'Product Gallery',
    label_en: 'Product Gallery',
    is_visible: true,
    sort_order: 155,
  }
  const byId = new Map(normalizeArray(items).map((row) => [row?.id, row]).filter(([id]) => Boolean(id)))
  byId.set(nextItem.id, { ...(byId.get(nextItem.id) ?? {}), ...nextItem })
  return [...byId.values()].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
}

async function patchProductsUiLabels(client, changes) {
  if (!(await tableExists(client, 'public.page_modules'))) return
  const res = await client.query(
    `SELECT id, items
     FROM page_modules
     WHERE page_key = 'products' AND module_key = 'ui-labels'
     LIMIT 1`,
  )
  if (res.rowCount === 0) return

  const current = normalizeArray(res.rows[0].items)
  const next = mergeGalleryLabel(current)
  if (stableJson(current) === stableJson(next)) return

  changes.push('products:ui-labels add Product Gallery label')
  if (apply) {
    await client.query(
      `UPDATE page_modules
       SET items = $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [res.rows[0].id, JSON.stringify(next)],
    )
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    await client.query('BEGIN')
    await patchProductsUiLabels(client, changes)
    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }

  console.log(`B58 product gallery label ${apply ? 'applied' : 'dry-run'}.`)
  if (changes.length === 0) console.log('No B58 changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((error) => {
  if (error instanceof Error) console.error([error.name, error.message, error.code].filter(Boolean).join(': '))
  else console.error(error)
  process.exit(1)
})
