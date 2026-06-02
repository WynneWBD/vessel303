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

const heroImageItem = {
  id: 'hero-image',
  href: '/products/e7-gen6-flagship',
  image_url: '/images/products/e7-gen6-flagship.jpg',
  label_zh: 'E7 Gen6',
  label_en: 'E7 Gen6',
  is_visible: true,
  sort_order: 70,
}

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

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function patchProductsHero(client, changes) {
  if (!(await tableExists(client, 'public.page_modules'))) return
  const res = await client.query(
    `SELECT id, items
     FROM page_modules
     WHERE page_key = 'products'
       AND module_key = 'hero'
     LIMIT 1`,
  )
  if (res.rowCount === 0) return

  const row = res.rows[0]
  const items = normalizeItems(row.items)
  const heroIndex = items.findIndex((item) => item?.id === heroImageItem.id)
  const nextItems = [...items]
  if (heroIndex >= 0) {
    const current = nextItems[heroIndex] ?? {}
    nextItems[heroIndex] = {
      ...current,
      href: current.href || heroImageItem.href,
      image_url: current.image_url || heroImageItem.image_url,
      label_zh: current.label_zh || heroImageItem.label_zh,
      label_en: current.label_en || heroImageItem.label_en,
      is_visible: current.is_visible ?? heroImageItem.is_visible,
      sort_order: current.sort_order ?? heroImageItem.sort_order,
    }
  } else {
    nextItems.push(heroImageItem)
  }
  nextItems.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
  if (JSON.stringify(items) === JSON.stringify(nextItems)) return

  changes.push(heroIndex >= 0
    ? 'page-module:products:hero complete backend-controlled hero image'
    : 'page-module:products:hero add backend-controlled hero image')
  if (apply) {
    await client.query(
      `UPDATE page_modules
       SET items = $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, JSON.stringify(nextItems)],
    )
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    await client.query('BEGIN')
    await patchProductsHero(client, changes)
    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }

  console.log(`B52 products hero image ${apply ? 'applied' : 'dry-run'}.`)
  if (changes.length === 0) console.log('No B52 products hero image changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((error) => {
  if (error instanceof Error) console.error([error.name, error.message, error.code].filter(Boolean).join(': '))
  else console.error(error)
  process.exit(1)
})
