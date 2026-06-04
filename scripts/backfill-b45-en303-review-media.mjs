import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')
const confirmedAuthorization = process.argv.includes('--confirm-wynne-authorization')
const json = process.argv.includes('--json')
const DEFAULT_MANIFEST = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
}

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

function mediaValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

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

function loadManifest() {
  const manifestPath = argValue('--manifest', DEFAULT_MANIFEST)
  const manifest = JSON.parse(readFileSync(resolve(root, manifestPath), 'utf8'))
  const entries = Array.isArray(manifest.entries) ? manifest.entries : []
  const byIndex = new Map(entries.map((entry) => [Number(entry.index), entry]))
  const publicUrl = (index) => {
    const entry = byIndex.get(index)
    const url = mediaValue(entry?.publicUrl ?? entry?.public_url)
    if (!url) throw new Error(`Manifest entry ${index} is missing publicUrl.`)
    return url
  }
  return { manifestPath, publicUrl }
}

function itemPatch(id, patch) {
  return { id, patch }
}

function patchItems(items, patches) {
  const byId = new Map(normalizeArray(items).map((item) => [item?.id, { ...item }]).filter(([id]) => Boolean(id)))
  for (const { id, patch } of patches) {
    const current = byId.get(id)
    if (!current) throw new Error(`Missing item: ${id}`)
    byId.set(id, { ...current, ...patch })
  }
  return [...byId.values()].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
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

async function resolveAdmin(client) {
  const res = await client.query(
    `SELECT id, email
     FROM users
     WHERE role IN ('admin', 'operator')
       AND COALESCE(disabled, false) = false
     ORDER BY CASE WHEN email = 'wynnewbd@gmail.com' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END, created_at ASC
     LIMIT 1`,
  )
  if (res.rowCount !== 1) throw new Error('No enabled admin/operator user found.')
  return res.rows[0]
}

async function ensureSnapshotSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS page_module_snapshots (
      id             TEXT        PRIMARY KEY,
      page_key       TEXT        NOT NULL,
      module_key     TEXT        NOT NULL,
      module_id      TEXT        NOT NULL,
      module_type    TEXT        NOT NULL DEFAULT 'fixed-content',
      title_zh       TEXT        NOT NULL DEFAULT '',
      title_en       TEXT        NOT NULL DEFAULT '',
      description_zh TEXT        NOT NULL DEFAULT '',
      description_en TEXT        NOT NULL DEFAULT '',
      items          JSONB       NOT NULL DEFAULT '[]',
      is_visible     BOOLEAN     NOT NULL DEFAULT TRUE,
      sort_order     INTEGER     NOT NULL DEFAULT 0,
      created_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_page_module_snapshots_module
      ON page_module_snapshots (page_key, module_key, created_at DESC)
  `)
}

async function createSnapshot(client, live, adminId) {
  const snapshotId = randomUUID()
  await client.query(
    `INSERT INTO page_module_snapshots (
       id, page_key, module_key, module_id, module_type, title_zh, title_en,
       description_zh, description_en, items, is_visible, sort_order, created_by, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, NOW())`,
    [
      snapshotId,
      live.page_key,
      live.module_key,
      live.id,
      live.module_type,
      live.title_zh,
      live.title_en,
      live.description_zh,
      live.description_en,
      JSON.stringify(normalizeArray(live.items)),
      live.is_visible,
      live.sort_order,
      adminId,
    ],
  )
  return snapshotId
}

async function pruneSnapshots(client, pageKey, moduleKey, keep = 30) {
  await client.query(
    `DELETE FROM page_module_snapshots
     WHERE page_key = $1
       AND module_key = $2
       AND id NOT IN (
         SELECT id
         FROM page_module_snapshots
         WHERE page_key = $1 AND module_key = $2
         ORDER BY created_at DESC
         LIMIT $3
       )`,
    [pageKey, moduleKey, keep],
  )
}

async function maybeLog(client, adminId, targetId) {
  try {
    await client.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id)
       VALUES ($1, $2, $3, $4)`,
      [adminId, 'page_module.publish', 'page_module', targetId],
    )
  } catch {
    // Audit logging is best-effort and should not block visual publishing.
  }
}

function buildPlans(publicUrl) {
  return [
    {
      pageKey: 'home',
      moduleKey: 'hero',
      note: 'Make the en.303 lake scene available as an additional visible hero slide without replacing the en.303 first villa scene.',
      patches: [
        itemPatch('hero-image-04', {
          image_url: publicUrl(7),
          href: '/products',
          value_zh: 'Product systems',
          value_en: 'Product systems',
          label_zh: 'Fully-assembled resort cabins, ready for overseas projects',
          label_en: 'Fully-assembled resort cabins, ready for overseas projects',
          content_zh: 'From flagship suites to compact units, VESSEL cabins are built as complete modular hospitality products.',
          content_en: 'From flagship suites to compact units, VESSEL cabins are built as complete modular hospitality products.',
          is_visible: true,
          sort_order: 130,
        }),
      ],
    },
    {
      pageKey: 'home',
      moduleKey: 'large-product-cards',
      note: 'Use an en.303 cabin render for the V9 showcase card while keeping the current backend item structure.',
      patches: [
        itemPatch('card-v9-showcase', {
          image_url: publicUrl(11),
          is_visible: true,
          sort_order: 50,
        }),
      ],
    },
    {
      pageKey: 'home',
      moduleKey: 'model-strip',
      note: 'Expose the E7 model card and attach en.303 model-range imagery as backend content.',
      patches: [
        itemPatch('card-e3', { image_url: publicUrl(24) }),
        itemPatch('card-v9', { image_url: publicUrl(19) }),
        itemPatch('card-e6', { image_url: publicUrl(21) }),
        itemPatch('card-e7', {
          image_url: publicUrl(23),
          label_zh: 'VESSEL E7 GEN6',
          label_en: 'VESSEL E7 GEN6',
          value_zh: '38.8 sqm / flagship cabin',
          value_en: '38.8 sqm / flagship cabin',
          content_zh: 'Flagship social cabin for hotel suites and project showcases.',
          content_en: 'Flagship social cabin for hotel suites and project showcases.',
          is_visible: true,
          sort_order: 50,
        }),
      ],
    },
  ]
}

function moduleInput(row, items) {
  return {
    title_zh: row.title_zh,
    title_en: row.title_en,
    description_zh: row.description_zh,
    description_en: row.description_en,
    items,
    is_visible: row.is_visible,
    sort_order: row.sort_order,
  }
}

function printReport(report) {
  console.log('B45 en.303 review media backfill')
  console.log(`Mode: ${report.mode}`)
  console.log(`Manifest: ${report.manifestPath}`)
  console.log(`Apply authorization confirmed: ${report.confirmedAuthorization ? 'yes' : 'no'}`)
  for (const result of report.results) {
    console.log(`- ${result.pageKey}:${result.moduleKey}: ${result.action}${result.snapshotId ? `, snapshot ${result.snapshotId}` : ''}`)
    if (result.note) console.log(`  note: ${result.note}`)
    if (result.changedItems?.length) console.log(`  changed items: ${result.changedItems.join(', ')}`)
  }
  if (report.errors.length) {
    console.log('Errors:')
    for (const error of report.errors) console.log(`- ${error}`)
  }
  if (report.mode === 'dry-run') console.log('No database writes were made.')
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL / POSTGRES_URL.')
  process.exit(1)
}

let pool
try {
  const { manifestPath, publicUrl } = loadManifest()
  const plans = buildPlans(publicUrl)
  const errors = []
  const results = []
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  })
  const admin = await resolveAdmin(pool)
  if (apply) {
    if (!confirmedAuthorization) throw new Error('Missing --confirm-wynne-authorization for --apply.')
    await ensureSnapshotSchema(pool)
  }

  for (const plan of plans) {
    try {
      const liveRes = await pool.query(
        `SELECT id, page_key, module_key, module_type, title_zh, title_en,
                description_zh, description_en, items, is_visible, sort_order
         FROM page_modules
         WHERE page_key = $1 AND module_key = $2
         LIMIT 1`,
        [plan.pageKey, plan.moduleKey],
      )
      const live = liveRes.rows[0]
      if (!live) throw new Error(`Missing module: ${plan.pageKey}:${plan.moduleKey}`)
      const patchedItems = patchItems(live.items, plan.patches)
      const changed = stableJson(normalizeArray(live.items)) !== stableJson(patchedItems)
      let snapshotId = null

      if (apply && changed) {
        snapshotId = await createSnapshot(pool, live, admin.id)
        const input = moduleInput(live, patchedItems)
        await pool.query(
          `UPDATE page_modules
           SET title_zh = $1,
               title_en = $2,
               description_zh = $3,
               description_en = $4,
               items = $5::jsonb,
               is_visible = $6,
               sort_order = $7,
               updated_by = $8,
               updated_at = NOW()
           WHERE page_key = $9 AND module_key = $10`,
          [
            input.title_zh,
            input.title_en,
            input.description_zh,
            input.description_en,
            JSON.stringify(input.items),
            input.is_visible,
            input.sort_order,
            admin.id,
            plan.pageKey,
            plan.moduleKey,
          ],
        )
        await pruneSnapshots(pool, plan.pageKey, plan.moduleKey)
        await maybeLog(pool, admin.id, `${plan.pageKey}:${plan.moduleKey}`)
      }

      results.push({
        pageKey: plan.pageKey,
        moduleKey: plan.moduleKey,
        action: changed ? (apply ? 'updated' : 'would-update') : 'skip-no-change',
        snapshotId,
        note: plan.note,
        changedItems: changed ? plan.patches.map((patch) => patch.id) : [],
      })
    } catch (error) {
      errors.push(error.message)
    }
  }

  const report = {
    mode: apply ? 'apply' : 'dry-run',
    manifestPath,
    confirmedAuthorization,
    results,
    errors,
  }
  if (json) console.log(JSON.stringify(report, null, 2))
  else printReport(report)
  if (errors.length > 0) process.exitCode = 1
} catch (error) {
  if (json) console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', errors: [error.message] }, null, 2))
  else console.error(error.message)
  process.exitCode = 1
} finally {
  await pool?.end()
}
