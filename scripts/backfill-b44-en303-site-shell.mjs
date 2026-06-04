import { randomUUID } from 'node:crypto'
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

function item(id, label, sortOrder, extra = {}) {
  return {
    id,
    label_zh: label,
    label_en: label,
    is_visible: true,
    sort_order: sortOrder,
    ...extra,
  }
}

function hiddenItem(id, sortOrder, extra = {}) {
  return {
    id,
    label_zh: '',
    label_en: '',
    is_visible: false,
    sort_order: sortOrder,
    ...extra,
  }
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

function mergeItems(existing, patchItems) {
  const byId = new Map(normalizeArray(existing).map((row) => [row?.id, row]).filter(([id]) => Boolean(id)))
  for (const patch of patchItems) {
    if (!patch?.id) continue
    byId.set(patch.id, { ...(byId.get(patch.id) ?? {}), ...patch })
  }
  return [...byId.values()].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
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

async function resolveAdmin(client) {
  const res = await client.query(
    `SELECT id, email
     FROM users
     WHERE role IN ('admin', 'operator')
       AND COALESCE(disabled, false) = false
     ORDER BY CASE WHEN email = 'wynnewbd@gmail.com' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END, created_at ASC
     LIMIT 1`,
  )
  return res.rows[0] ?? { id: null, email: null }
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
  if (!adminId) return
  try {
    await client.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id)
       VALUES ($1, $2, $3, $4)`,
      [adminId, 'page_module.publish', 'page_module', targetId],
    )
  } catch {
    // Logging is best-effort; visual publishing should not fail on audit-log drift.
  }
}

const modulePatches = [
  {
    page_key: 'site',
    module_key: 'navbar',
    module_type: 'navigation',
    title_zh: 'Navbar',
    title_en: 'Navbar',
    description_zh: 'en.303-style global navigation. Content remains controlled by backend page modules.',
    description_en: 'en.303-style global navigation. Content remains controlled by backend page modules.',
    sort_order: 10,
    items: [
      item('nav-model-e7', 'VESSEL E7 Gen6', 11, { value_zh: 'model', value_en: 'model', href: '/products/e7-gen6-flagship' }),
      item('nav-model-v9', 'VESSEL V9 Gen6', 12, { value_zh: 'model', value_en: 'model', href: '/products/v9-gen6' }),
      item('nav-model-e6', 'VESSEL E6 Gen6', 13, { value_zh: 'model', value_en: 'model', href: '/products/e6-gen6-standard' }),
      hiddenItem('nav-model-e3', 14, { value_zh: 'model', value_en: 'model', href: '/products/e3-gen6-standard' }),
      item('nav-products', 'All Products', 20, { value_zh: 'primary', value_en: 'primary', href: '/products' }),
      item('nav-cases', 'Projects', 30, { value_zh: 'primary', value_en: 'primary', href: '/cases' }),
      hiddenItem('nav-news', 40, { value_zh: 'primary', value_en: 'primary', href: '/news' }),
      item('nav-about', 'About', 50, { value_zh: 'primary', value_en: 'primary', href: '/about' }),
      hiddenItem('nav-faq', 55, { value_zh: 'primary', value_en: 'primary', href: '/faq' }),
      item('nav-contact', 'Contact', 60, { value_zh: 'primary', value_en: 'primary', href: '/contact?source=navbar:contact_nav' }),
      item('nav-global', 'Global Presence', 70, { value_zh: 'primary', value_en: 'primary', href: '/global' }),
    ],
  },
  {
    page_key: 'site',
    module_key: 'footer-cta',
    is_visible: false,
  },
  {
    page_key: 'site',
    module_key: 'footer-brand',
    module_type: 'fixed-content',
    title_zh: 'VESSEL',
    title_en: 'VESSEL',
    description_zh: '',
    description_en: '',
    sort_order: 30,
    replaceItems: true,
    items: [
      item('logo', 'VESSEL', 5, { image_url: '/images/vessel-logo.png', href: '/' }),
      item('tagline', 'VESSEL', 10),
      item('telephone', 'Telephone: 400-8090-303', 20, { href: 'tel:400-8090-303' }),
      item('whatsapp', 'Whatsapp:+86 180-2417-6679', 30, { href: 'https://api.whatsapp.com/send?phone=+86%20180-2417-6679&text=Hello' }),
      item('email', 'E-mail: 303vessel@303industries.cn', 40, { href: 'mailto:303vessel@303industries.cn' }),
      item('address', 'Address: No.253,Xingye North Road, Shishan Town,Nanhai District,Foshan City,Guangdong Province', 50),
      item('social-wechat', 'WeChat', 100),
      item('social-video', 'Video account', 110),
      item('social-xiaohongshu', 'Xiaohongshu', 120),
      item('social-mini-program', 'Mini Program', 130),
      item('social-tiktok', 'TIKTOK', 140),
      item('social-instagram', 'Instagram', 150),
      item('social-youtube', 'YouTube', 160),
    ],
  },
  {
    page_key: 'site',
    module_key: 'footer-products',
    module_type: 'navigation',
    title_zh: 'Model',
    title_en: 'Model',
    description_zh: 'en.303-style model links.',
    description_en: 'en.303-style model links.',
    sort_order: 40,
    replaceItems: true,
    items: [
      item('v9-gen6', 'VESSEL V9 Gen6', 10, { href: '/products/v9-gen6' }),
      item('e7-gen6', 'VESSEL E7 Gen6', 20, { href: '/products/e7-gen6-flagship' }),
      item('e6-gen6', 'VESSEL E6 Gen6', 30, { href: '/products/e6-gen6-standard' }),
      item('e3-gen6', 'VESSEL E3 Gen6', 40, { href: '/products/e3-gen6-standard' }),
      item('all-products', 'All Products', 50, { href: '/products' }),
    ],
  },
  {
    page_key: 'site',
    module_key: 'footer-company',
    module_type: 'navigation',
    title_zh: 'Discover VESSEL',
    title_en: 'Discover VESSEL',
    description_zh: 'en.303-style discovery links.',
    description_en: 'en.303-style discovery links.',
    sort_order: 50,
    replaceItems: true,
    items: [
      item('brand-story', 'Brand Story', 10, { href: '/about' }),
      item('project-case', 'Project Case', 20, { href: '/cases' }),
      item('faq', 'FAQ', 30, { href: '/faq' }),
    ],
  },
  {
    page_key: 'site',
    module_key: 'footer-about',
    module_type: 'navigation',
    title_zh: 'About Us',
    title_en: 'About Us',
    description_zh: 'en.303-style about links.',
    description_en: 'en.303-style about links.',
    is_visible: true,
    sort_order: 55,
    replaceItems: true,
    items: [
      hiddenItem('blog', 10, { href: '/news' }),
      item('appointment', 'Make an appointment now', 20, { href: '/contact?source=footer:appointment' }),
      item('contact-us', 'Contact Us', 30, { href: '/contact?source=footer:contact_us' }),
    ],
  },
  {
    page_key: 'site',
    module_key: 'footer-contact',
    is_visible: false,
  },
  {
    page_key: 'home',
    module_key: 'contact-band',
    is_visible: false,
  },
]

function buildNext(row, patch) {
  const exists = Boolean(row)
  const currentItems = exists ? normalizeArray(row.items) : []
  const nextItems = patch.items
    ? (patch.replaceItems ? patch.items : mergeItems(currentItems, patch.items))
    : currentItems

  return {
    id: row?.id ?? `${patch.page_key}:${patch.module_key}`,
    page_key: patch.page_key,
    module_key: patch.module_key,
    module_type: patch.module_type ?? row?.module_type ?? 'fixed-content',
    title_zh: patch.title_zh ?? row?.title_zh ?? '',
    title_en: patch.title_en ?? row?.title_en ?? '',
    description_zh: patch.description_zh ?? row?.description_zh ?? '',
    description_en: patch.description_en ?? row?.description_en ?? '',
    items: nextItems,
    is_visible: patch.is_visible ?? row?.is_visible ?? true,
    sort_order: patch.sort_order ?? row?.sort_order ?? 0,
  }
}

function changed(row, next) {
  if (!row) return true
  return (
    String(row.module_type ?? '') !== String(next.module_type ?? '') ||
    String(row.title_zh ?? '') !== String(next.title_zh ?? '') ||
    String(row.title_en ?? '') !== String(next.title_en ?? '') ||
    String(row.description_zh ?? '') !== String(next.description_zh ?? '') ||
    String(row.description_en ?? '') !== String(next.description_en ?? '') ||
    stableJson(normalizeArray(row.items)) !== stableJson(next.items) ||
    Boolean(row.is_visible) !== Boolean(next.is_visible) ||
    Number(row.sort_order ?? 0) !== Number(next.sort_order ?? 0)
  )
}

async function upsertModule(client, patch, adminId) {
  const res = await client.query(
    `SELECT id, page_key, module_key, module_type, title_zh, title_en,
            description_zh, description_en, items, is_visible, sort_order
     FROM page_modules
     WHERE page_key = $1 AND module_key = $2
     LIMIT 1`,
    [patch.page_key, patch.module_key],
  )
  const row = res.rows[0] ?? null
  const next = buildNext(row, patch)
  if (!changed(row, next)) return null

  const action = row ? 'update' : 'insert'
  let snapshotId = null
  if (apply) {
    if (row) {
      snapshotId = await createSnapshot(client, row, adminId)
    }
    await client.query(
      `INSERT INTO page_modules (
         id, page_key, module_key, module_type, title_zh, title_en,
         description_zh, description_en, items, is_visible, sort_order, updated_by, updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,NOW())
       ON CONFLICT (page_key, module_key)
       DO UPDATE SET
         module_type = EXCLUDED.module_type,
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
        next.id,
        next.page_key,
        next.module_key,
        next.module_type,
        next.title_zh,
        next.title_en,
        next.description_zh,
        next.description_en,
        JSON.stringify(next.items),
        next.is_visible,
        next.sort_order,
        adminId,
      ],
    )
    await pruneSnapshots(client, next.page_key, next.module_key)
    await maybeLog(client, adminId, `${next.page_key}:${next.module_key}`)
  }

  return {
    action,
    module: `${next.page_key}:${next.module_key}`,
    snapshotId,
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []
  try {
    await client.query('BEGIN')
    await ensureSnapshotSchema(client)
    const admin = await resolveAdmin(client)

    for (const patch of modulePatches) {
      const result = await upsertModule(client, patch, admin.id)
      if (result) changes.push(result)
    }

    if (apply) {
      await client.query('COMMIT')
    } else {
      await client.query('ROLLBACK')
    }

    console.log(JSON.stringify({
      apply,
      changed: changes.length,
      changes,
    }, null, 2))
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
