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

const heroSlides = new Map([
  ['hero-image-01', {
    label: 'Fully-assembled modular cabin systems for resort projects',
    value: 'Product systems',
    content: 'Route buyers from the first screen into models, project references and buyer materials.',
    href: '/products',
  }],
  ['hero-image-02', {
    label: 'Model families for hospitality, showroom and destination use',
    value: 'Model range',
    content: 'Expose V9, E7, E6 and E3 as a clear catalog path before visitors start searching.',
    href: '/products',
  }],
  ['hero-image-03', {
    label: 'Move from product interest to a sales conversation',
    value: 'Project inquiry',
    content: 'Connect factory proof, published cases, buyer downloads and the contact path in one homepage flow.',
    href: '/contact?source=home:hero_slide_03',
  }],
])

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

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    const res = await client.query(
      `SELECT id, items
       FROM page_modules
       WHERE page_key = 'home' AND module_key = 'hero'
       LIMIT 1`,
    )

    if (res.rowCount === 0) {
      throw new Error('home:hero page module is missing')
    }

    const currentItems = normalizeArray(res.rows[0].items)
    const currentById = new Map(currentItems.map((item) => [item?.id, item]).filter(([id]) => Boolean(id)))
    const nextItems = currentItems.map((item) => {
      const slide = heroSlides.get(item?.id)
      if (!slide) return item
      return {
        ...item,
        label_zh: slide.label,
        label_en: slide.label,
        value_zh: slide.value,
        value_en: slide.value,
        content_zh: slide.content,
        content_en: slide.content,
        href: slide.href,
        is_visible: item.is_visible !== false,
      }
    })

    for (const [id, slide] of heroSlides) {
      const item = currentById.get(id)
      if (!item) {
        changes.push(`home:hero missing ${id}`)
        continue
      }
      if (
        item.label_en !== slide.label ||
        item.value_en !== slide.value ||
        item.content_en !== slide.content ||
        item.href !== slide.href
      ) {
        changes.push(`home:hero ${id} slide copy/link refresh`)
      }
    }

    if (stableJson(currentItems) !== stableJson(nextItems)) {
      if (apply) {
        await client.query(
          `UPDATE page_modules
           SET items = $2::jsonb,
               updated_at = NOW()
           WHERE id = $1`,
          [res.rows[0].id, JSON.stringify(nextItems)],
        )
      }
    } else {
      changes.length = 0
    }
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B57 homepage hero slide backfill applied.' : 'B57 homepage hero slide backfill dry-run.')
  if (changes.length === 0) {
    console.log('No B57 changes needed.')
  } else {
    for (const change of changes) console.log(`- ${change}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
