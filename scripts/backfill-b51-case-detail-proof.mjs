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

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)))
}

async function tableExists(client, tableName) {
  const res = await client.query('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

function normalizeAstrobaseProof(row) {
  const area = String(row.area_display ?? '').trim()
  const hasWrongArea = /yamanashi/i.test(area) || /^japan\s*[/·-]/i.test(area)
  const nextArea = hasWrongArea ? '' : area
  const tags = normalizeArray(row.tags_en)
  const nextTags = unique(tags.filter((tag) => !/yamanashi|japan/i.test(tag)).concat('Russia'))

  return {
    nextArea,
    nextTags,
    changed: area !== nextArea || JSON.stringify(tags) !== JSON.stringify(nextTags),
  }
}

async function patchAstrobase(client, changes) {
  if (!(await tableExists(client, 'public.project_cases'))) return
  const res = await client.query(
    `SELECT id, area_display, tags_en
     FROM project_cases
     WHERE id = 'astrobase-mamison' AND deleted_at IS NULL
     LIMIT 1`,
  )
  if (res.rowCount === 0) return

  const row = res.rows[0]
  const patch = normalizeAstrobaseProof(row)
  if (!patch.changed) return

  changes.push('case:astrobase-mamison remove wrong Japan/Yamanashi proof value')
  if (apply) {
    await client.query(
      `UPDATE project_cases
       SET area_display = $1,
           tags_en = $2::jsonb,
           updated_at = NOW()
       WHERE id = 'astrobase-mamison'`,
      [patch.nextArea, JSON.stringify(patch.nextTags)],
    )
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    await client.query('BEGIN')
    await patchAstrobase(client, changes)
    if (apply) await client.query('COMMIT')
    else await client.query('ROLLBACK')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }

  console.log(`B51 case detail proof ${apply ? 'applied' : 'dry-run'}.`)
  if (changes.length === 0) console.log('No B51 changes needed.')
  else for (const change of changes) console.log(`- ${change}`)
}

main().catch((error) => {
  if (error instanceof Error) console.error([error.name, error.message, error.code].filter(Boolean).join(': '))
  else console.error(error)
  process.exit(1)
})
