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

const modulePatches = new Map([
  ['hero', {
    title_en: 'Prefab Resort Cabins and Modular Hospitality Units',
    title_zh: 'Prefab Resort Cabins and Modular Hospitality Units',
    description_en: 'Factory-built VESSEL units for resort, hotel and commercial destination projects.',
    description_zh: 'Factory-built VESSEL units for resort, hotel and commercial destination projects.',
    items: new Map([
      ['hero-headline', {
        label_en: 'Fully-assembled resort cabins for hospitality projects',
        label_zh: 'Fully-assembled resort cabins for hospitality projects',
      }],
      ['hero-subtitle', {
        label_en: 'Compare model families, review project references, request buyer materials and send an inquiry from one international site.',
        label_zh: 'Compare model families, review project references, request buyer materials and send an inquiry from one international site.',
      }],
      ['hero-image-01', {
        label_en: 'Fully-assembled resort cabins, ready for overseas projects',
        label_zh: 'Fully-assembled resort cabins, ready for overseas projects',
        value_en: 'Product systems',
        value_zh: 'Product systems',
        content_en: 'From flagship suites to compact units, VESSEL cabins are built as complete modular hospitality products.',
        content_zh: 'From flagship suites to compact units, VESSEL cabins are built as complete modular hospitality products.',
        href: '/products',
      }],
      ['hero-image-02', {
        label_en: 'Compare V9, E7, E6 and E3 model families',
        label_zh: 'Compare V9, E7, E6 and E3 model families',
        value_en: 'Model range',
        value_zh: 'Model range',
        content_en: 'Review size, use case, buyer materials and project fit before choosing a product direction.',
        content_zh: 'Review size, use case, buyer materials and project fit before choosing a product direction.',
        href: '/products',
      }],
      ['hero-image-03', {
        label_en: 'Share a destination plan and start a project inquiry',
        label_zh: 'Share a destination plan and start a project inquiry',
        value_en: 'Project inquiry',
        value_zh: 'Project inquiry',
        content_en: 'Send country, quantity and site requirements so the team can recommend model options and buyer materials.',
        content_zh: 'Send country, quantity and site requirements so the team can recommend model options and buyer materials.',
        href: '/contact?source=home:hero_slide_03',
      }],
    ]),
  }],
  ['large-product-cards', {
    title_en: 'Product families for resorts, hotels and destination spaces',
    title_zh: 'Product families for resorts, hotels and destination spaces',
    description_en: 'Start from the flagship cabins buyers ask about most often, then compare the full model range and request project materials.',
    description_zh: 'Start from the flagship cabins buyers ask about most often, then compare the full model range and request project materials.',
  }],
  ['model-strip', {
    title_en: 'Compare VESSEL model families',
    title_zh: 'Compare VESSEL model families',
    description_en: 'Scan room size, use case and model positioning before opening the full product catalog.',
    description_zh: 'Scan room size, use case and model positioning before opening the full product catalog.',
  }],
  ['innovation-story', {
    title_en: 'Technology behind the cabin experience',
    title_zh: 'Technology behind the cabin experience',
    description_en: 'Comfort systems, factory process and project support help overseas buyers evaluate how each unit performs after delivery.',
    description_zh: 'Comfort systems, factory process and project support help overseas buyers evaluate how each unit performs after delivery.',
    items: new Map([
      ['card-viie', {
        content_en: 'Smart controls and guest comfort features for hospitality operation.',
        content_zh: 'Smart controls and guest comfort features for hospitality operation.',
      }],
      ['card-vipc', {
        content_en: 'Factory process and quality checkpoints for consistent modular production.',
        content_zh: 'Factory process and quality checkpoints for consistent modular production.',
      }],
      ['card-vols', {
        content_en: 'Project support for model selection, site preparation and overseas deployment.',
        content_zh: 'Project support for model selection, site preparation and overseas deployment.',
      }],
    ]),
  }],
  ['scenario-tiles', {
    title_en: 'Choose a project scenario',
    title_zh: 'Choose a project scenario',
    description_en: 'Match product families with resort accommodation, commercial display spaces or supporting facilities.',
    description_zh: 'Match product families with resort accommodation, commercial display spaces or supporting facilities.',
  }],
  ['future-explorer', {
    title_en: 'Review factory proof and project references',
    title_zh: 'Review factory proof and project references',
    description_en: 'Move from the homepage into company proof, published cases, buyer materials and a project inquiry.',
    description_zh: 'Move from the homepage into company proof, published cases, buyer materials and a project inquiry.',
  }],
  ['contact-band', {
    title_en: 'Send a project brief for product-fit review',
    title_zh: 'Send a project brief for product-fit review',
    description_en: 'Share destination, country, quantity, model interest and schedule. The inquiry is saved in the new leads console.',
    description_zh: 'Share destination, country, quantity, model interest and schedule. The inquiry is saved in the new leads console.',
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

function patchItems(items, itemPatches) {
  if (!itemPatches) return items
  return normalizeArray(items).map((item) => {
    const patch = itemPatches.get(item?.id)
    return patch ? { ...item, ...patch } : item
  })
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    const rows = (await client.query(
      `SELECT id, module_key, title_zh, title_en, description_zh, description_en, items
       FROM page_modules
       WHERE page_key = 'home' AND module_key = ANY($1::text[])`,
      [[...modulePatches.keys()]],
    )).rows

    for (const row of rows) {
      const patch = modulePatches.get(row.module_key)
      if (!patch) continue

      const nextItems = patchItems(row.items, patch.items)
      const next = {
        title_zh: patch.title_zh ?? row.title_zh,
        title_en: patch.title_en ?? row.title_en,
        description_zh: patch.description_zh ?? row.description_zh,
        description_en: patch.description_en ?? row.description_en,
        items: nextItems,
      }
      const changed = (
        String(row.title_zh ?? '') !== String(next.title_zh ?? '') ||
        String(row.title_en ?? '') !== String(next.title_en ?? '') ||
        String(row.description_zh ?? '') !== String(next.description_zh ?? '') ||
        String(row.description_en ?? '') !== String(next.description_en ?? '') ||
        stableJson(normalizeArray(row.items)) !== stableJson(nextItems)
      )

      if (!changed) continue
      changes.push(`home:${row.module_key} customer-facing copy refresh`)
      if (apply) {
        await client.query(
          `UPDATE page_modules
           SET title_zh = $2,
               title_en = $3,
               description_zh = $4,
               description_en = $5,
               items = $6::jsonb,
               updated_at = NOW()
           WHERE id = $1`,
          [row.id, next.title_zh, next.title_en, next.description_zh, next.description_en, JSON.stringify(nextItems)],
        )
      }
    }
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B39 homepage sales display backfill applied.' : 'B39 homepage sales display dry-run.')
  if (changes.length === 0) {
    console.log('No B39 changes needed.')
  } else {
    for (const change of changes) console.log(`- ${change}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
