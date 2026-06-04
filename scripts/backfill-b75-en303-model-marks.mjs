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

const MODEL_MARKS = [
  { id: 'model-mark-e7', manifestIndex: 3, label_en: 'VESSEL E7 mark', label_zh: 'VESSEL E7 mark', sort_order: 52 },
  { id: 'model-mark-v9', manifestIndex: 4, label_en: 'VESSEL V9 mark', label_zh: 'VESSEL V9 mark', sort_order: 54 },
  { id: 'model-mark-e6', manifestIndex: 5, label_en: 'VESSEL E6 mark', label_zh: 'VESSEL E6 mark', sort_order: 56 },
]

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
}

function mediaValue(value) {
  return typeof value === 'string' ? value.trim() : ''
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

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
  }
  return value
}

function patchModelMarks(items, publicUrl) {
  const byId = new Map(normalizeItems(items).map((item) => [item?.id, { ...item }]).filter(([id]) => Boolean(id)))
  const changedItemIds = []

  for (const mark of MODEL_MARKS) {
    const current = byId.get(mark.id) ?? {}
    const next = {
      ...current,
      id: mark.id,
      label_zh: mark.label_zh,
      label_en: mark.label_en,
      value_zh: 'supporting-media',
      value_en: 'supporting-media',
      content_zh: 'Model mark imported from en.303 homepage assets for the homepage model strip.',
      content_en: 'Model mark imported from en.303 homepage assets for the homepage model strip.',
      image_url: publicUrl(mark.manifestIndex),
      is_visible: true,
      sort_order: mark.sort_order,
    }
    if (JSON.stringify(canonicalize(current)) !== JSON.stringify(canonicalize(next))) {
      changedItemIds.push(mark.id)
    }
    byId.set(mark.id, next)
  }

  return {
    items: Array.from(byId.values()).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)),
    changedItemIds,
  }
}

async function resolveAdminUser(pool) {
  const res = await pool.query(
    `SELECT id, email
     FROM users
     WHERE role IN ('admin', 'operator')
       AND COALESCE(disabled, false) = false
     ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at ASC
     LIMIT 1`,
  )
  if (res.rowCount !== 1) throw new Error('No enabled admin/operator user found.')
  return res.rows[0]
}

async function ensureSnapshotSchema(pool) {
  await pool.query(`
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
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_page_module_snapshots_module
      ON page_module_snapshots (page_key, module_key, created_at DESC)
  `)
}

async function createSnapshot(pool, live, adminId) {
  const snapshotId = randomUUID()
  await pool.query(
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
      JSON.stringify(normalizeItems(live.items)),
      live.is_visible,
      live.sort_order,
      adminId,
    ],
  )
  return snapshotId
}

async function pruneSnapshots(pool, keep = 30) {
  await pool.query(
    `DELETE FROM page_module_snapshots
     WHERE page_key = 'home'
       AND module_key = 'model-strip'
       AND id NOT IN (
         SELECT id
         FROM page_module_snapshots
         WHERE page_key = 'home' AND module_key = 'model-strip'
         ORDER BY created_at DESC
         LIMIT $1
       )`,
    [keep],
  )
}

async function maybeLog(pool, adminId) {
  try {
    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id)
       VALUES ($1, $2, $3, $4)`,
      [adminId, 'page_module.publish', 'page_module', 'home:model-strip'],
    )
  } catch {
    // Logging should not block a visual content backfill.
  }
}

function printReport(report) {
  console.log('B75 en.303 model mark backfill')
  console.log(`Mode: ${report.mode}`)
  console.log(`Manifest: ${report.manifestPath}`)
  console.log(`Apply authorization confirmed: ${report.confirmedAuthorization ? 'yes' : 'no'}`)
  console.log(`Action: ${report.action}`)
  if (report.snapshotId) console.log(`Snapshot: ${report.snapshotId}`)
  if (report.changedItems.length > 0) console.log(`Changed items: ${report.changedItems.join(', ')}`)
  if (report.errors.length > 0) {
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
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  })

  const liveRes = await pool.query(
    `SELECT id, page_key, module_key, module_type, title_zh, title_en,
            description_zh, description_en, items, is_visible, sort_order
     FROM page_modules
     WHERE page_key = 'home' AND module_key = 'model-strip'
     LIMIT 1`,
  )
  const live = liveRes.rows[0]
  if (!live) throw new Error('Missing module: home:model-strip')

  const patched = patchModelMarks(live.items, publicUrl)
  const changed = JSON.stringify(canonicalize(normalizeItems(live.items))) !== JSON.stringify(canonicalize(patched.items))
  let snapshotId = null

  if (apply && changed) {
    if (!confirmedAuthorization) throw new Error('Missing --confirm-wynne-authorization for --apply.')
    const admin = await resolveAdminUser(pool)
    await ensureSnapshotSchema(pool)
    snapshotId = await createSnapshot(pool, live, admin.id)
    await pool.query(
      `UPDATE page_modules
       SET items = $1::jsonb,
           updated_by = $2,
           updated_at = NOW()
       WHERE page_key = 'home' AND module_key = 'model-strip'`,
      [JSON.stringify(patched.items), admin.id],
    )
    await pruneSnapshots(pool)
    await maybeLog(pool, admin.id)
  }

  const report = {
    mode: apply ? 'apply' : 'dry-run',
    manifestPath,
    confirmedAuthorization,
    action: changed ? (apply ? 'updated' : 'would-update') : 'skip-no-change',
    snapshotId,
    changedItems: patched.changedItemIds,
    errors: [],
  }

  if (json) console.log(JSON.stringify(report, null, 2))
  else printReport(report)
} catch (error) {
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    confirmedAuthorization,
    action: 'error',
    changedItems: [],
    errors: [error.message],
  }
  if (json) console.log(JSON.stringify(report, null, 2))
  else {
    printReport({ ...report, manifestPath: argValue('--manifest', DEFAULT_MANIFEST), snapshotId: null })
  }
  process.exitCode = 1
} finally {
  await pool?.end()
}
