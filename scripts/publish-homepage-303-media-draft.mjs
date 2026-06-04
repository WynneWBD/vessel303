import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')
const confirmedAuthorization = process.argv.includes('--confirm-wynne-authorization')
const json = process.argv.includes('--json')
const defaultModuleKeys = ['hero', 'model-strip', 'scenario-tiles']

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

function parseModuleKeys() {
  const raw = argValue('--module-keys', defaultModuleKeys.join(','))
  return raw.split(',').map((key) => key.trim()).filter(Boolean)
}

function normalizeModule(row, source) {
  return {
    id: mediaValue(row?.id),
    page_key: mediaValue(row?.page_key) || 'home',
    module_key: mediaValue(row?.module_key),
    module_type: mediaValue(row?.module_type) || 'fixed-content',
    title_zh: mediaValue(row?.title_zh),
    title_en: mediaValue(row?.title_en),
    description_zh: mediaValue(row?.description_zh),
    description_en: mediaValue(row?.description_en),
    items: Array.isArray(row?.items) ? row.items : [],
    is_visible: row?.is_visible !== false,
    sort_order: Number(row?.sort_order ?? 0) || 0,
    updated_at: row?.updated_at ?? null,
    source,
  }
}

function moduleInputChanged(live, draft) {
  if (!live) return true
  return JSON.stringify({
    title_zh: live.title_zh,
    title_en: live.title_en,
    description_zh: live.description_zh,
    description_en: live.description_en,
    items: live.items,
    is_visible: live.is_visible,
    sort_order: live.sort_order,
  }) !== JSON.stringify({
    title_zh: draft.title_zh,
    title_en: draft.title_en,
    description_zh: draft.description_zh,
    description_en: draft.description_en,
    items: draft.items,
    is_visible: draft.is_visible,
    sort_order: draft.sort_order,
  })
}

async function resolveAdminUser(pool, adminEmail) {
  const normalizedEmail = mediaValue(adminEmail)
  if (normalizedEmail && normalizedEmail !== 'auto') {
    const res = await pool.query('SELECT id, email FROM users WHERE lower(email) = lower($1) LIMIT 1', [normalizedEmail])
    if (res.rowCount !== 1) throw new Error(`Admin email not found: ${normalizedEmail}`)
    return res.rows[0]
  }

  const res = await pool.query(
    `SELECT id, email
     FROM users
     WHERE role IN ('admin', 'operator')
       AND COALESCE(disabled, false) = false
     ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at ASC
     LIMIT 1`,
  )
  if (res.rowCount !== 1) throw new Error('No enabled admin/operator user found for --admin-email auto.')
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
  const id = randomUUID()
  await pool.query(
    `INSERT INTO page_module_snapshots (
       id, page_key, module_key, module_id, module_type, title_zh, title_en,
       description_zh, description_en, items, is_visible, sort_order, created_by, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, NOW())`,
    [
      id,
      live.page_key,
      live.module_key,
      live.id,
      live.module_type,
      live.title_zh,
      live.title_en,
      live.description_zh,
      live.description_en,
      JSON.stringify(live.items),
      live.is_visible,
      live.sort_order,
      adminId,
    ],
  )
  return id
}

async function pruneSnapshots(pool, pageKey, moduleKey, keep = 30) {
  await pool.query(
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

async function maybeLog(pool, adminId, moduleKey) {
  try {
    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id)
       VALUES ($1, $2, $3, $4)`,
      [adminId, 'page_module.draft.publish', 'page_module', `home:${moduleKey}`],
    )
  } catch {
    // Existing admin logging is best-effort; publish should not fail if logs are unavailable.
  }
}

async function loadLiveAndDraft(pool, moduleKey) {
  const liveRes = await pool.query(
    `SELECT id, page_key, module_key, module_type, title_zh, title_en, description_zh,
            description_en, items, is_visible, sort_order, updated_at
     FROM page_modules
     WHERE page_key = 'home' AND module_key = $1
     LIMIT 1`,
    [moduleKey],
  )
  const draftRes = await pool.query(
    `SELECT id, page_key, module_key, module_type, title_zh, title_en, description_zh,
            description_en, items, is_visible, sort_order, base_updated_at AS updated_at
     FROM page_module_drafts
     WHERE page_key = 'home' AND module_key = $1
     LIMIT 1`,
    [moduleKey],
  )

  return {
    live: liveRes.rows[0] ? normalizeModule(liveRes.rows[0], 'live') : null,
    draft: draftRes.rows[0] ? normalizeModule(draftRes.rows[0], 'draft') : null,
  }
}

async function publishModule(pool, moduleKey, adminId) {
  const { live, draft } = await loadLiveAndDraft(pool, moduleKey)
  if (!draft) return { moduleKey, action: 'skip-no-draft' }

  const changed = moduleInputChanged(live, draft)
  let snapshotId = null
  if (live && changed) snapshotId = await createSnapshot(pool, live, adminId)

  const id = live?.id || draft.id || `home:${moduleKey}`
  const moduleType = live?.module_type || draft.module_type || 'fixed-content'
  await pool.query(
    `INSERT INTO page_modules (
       id, page_key, module_key, module_type, title_zh, title_en,
       description_zh, description_en, items, is_visible, sort_order, updated_by, updated_at
     )
     VALUES ($1, 'home', $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, NOW())
     ON CONFLICT (page_key, module_key)
     DO UPDATE SET
       title_zh = EXCLUDED.title_zh,
       title_en = EXCLUDED.title_en,
       description_zh = EXCLUDED.description_zh,
       description_en = EXCLUDED.description_en,
       items = EXCLUDED.items,
       is_visible = EXCLUDED.is_visible,
       sort_order = EXCLUDED.sort_order,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()`,
    [
      id,
      moduleKey,
      moduleType,
      draft.title_zh,
      draft.title_en,
      draft.description_zh,
      draft.description_en,
      JSON.stringify(draft.items),
      draft.is_visible,
      draft.sort_order,
      adminId,
    ],
  )
  await pool.query(
    `DELETE FROM page_module_drafts
     WHERE page_key = 'home' AND module_key = $1`,
    [moduleKey],
  )
  await pruneSnapshots(pool, 'home', moduleKey)
  await maybeLog(pool, adminId, moduleKey)

  return {
    moduleKey,
    action: changed ? 'published' : 'published-unchanged',
    snapshotId,
    itemCount: draft.items.length,
  }
}

function printReport(report) {
  console.log('Homepage 303 media draft publish')
  console.log(`Mode: ${report.mode}`)
  console.log(`Module keys: ${report.moduleKeys.join(', ')}`)
  console.log(`Apply authorization confirmed: ${report.confirmedAuthorization ? 'yes' : 'no'}`)
  for (const result of report.results) {
    console.log(`- home:${result.moduleKey}: ${result.action}${result.snapshotId ? ', snapshot saved' : ''}`)
  }
  console.log(report.mode === 'apply' ? 'Database publish completed.' : 'No database writes were made.')
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const moduleKeys = parseModuleKeys()
let pool

try {
  if (apply && !confirmedAuthorization) throw new Error('Missing --confirm-wynne-authorization for --apply.')
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
  if (!connectionString) throw new Error('Missing DATABASE_URL / POSTGRES_URL.')
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  })
  if (apply) await ensureSnapshotSchema(pool)
  const adminUser = await resolveAdminUser(pool, argValue('--admin-email', process.env.ADMIN_EMAIL || 'auto'))

  const previews = []
  for (const moduleKey of moduleKeys) {
    const { draft } = await loadLiveAndDraft(pool, moduleKey)
    previews.push({ moduleKey, action: draft ? 'would-publish' : 'skip-no-draft', itemCount: draft?.items.length ?? 0 })
  }

  const results = apply
    ? await Promise.all(moduleKeys.map((moduleKey) => publishModule(pool, moduleKey, adminUser.id)))
    : previews

  const report = {
    mode: apply ? 'apply' : 'dry-run',
    moduleKeys,
    confirmedAuthorization,
    results,
  }
  if (json) console.log(JSON.stringify(report, null, 2))
  else printReport(report)
} catch (error) {
  if (json) console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', errors: [error.message] }, null, 2))
  else console.error(error.message)
  process.exitCode = 1
} finally {
  await pool?.end()
}
