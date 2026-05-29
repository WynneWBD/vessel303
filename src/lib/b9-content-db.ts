import { unstable_cache } from 'next/cache'
import { pool } from '@/lib/db'

export type B9ContentKind = 'faq' | 'media_file' | 'scenario' | 'display_slide' | 'innovation'
export type B9ContentStatus = 'draft' | 'published' | 'hidden'
export type B9CategoryStatus = 'visible' | 'hidden'

export interface B9ContentCategory {
  id: number
  kind: B9ContentKind
  slug: string
  title_zh: string
  title_en: string
  sort_order: number
  status: B9CategoryStatus
  item_count?: number
  created_at: string
  updated_at: string
}

export interface B9ContentItem {
  id: number
  kind: B9ContentKind
  slug: string
  category_id: number | null
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
  title_zh: string
  title_en: string
  summary_zh: string | null
  summary_en: string | null
  body_zh: string | null
  body_en: string | null
  cover_image_url: string | null
  file_url: string | null
  cta_label_zh: string | null
  cta_label_en: string | null
  cta_href: string | null
  payload: Record<string, unknown>
  status: B9ContentStatus
  sort_order: number
  published_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type UpsertB9ContentItemInput = {
  kind: B9ContentKind
  slug: string
  category_id?: number | null
  title_zh: string
  title_en: string
  summary_zh?: string | null
  summary_en?: string | null
  body_zh?: string | null
  body_en?: string | null
  cover_image_url?: string | null
  file_url?: string | null
  cta_label_zh?: string | null
  cta_label_en?: string | null
  cta_href?: string | null
  payload?: Record<string, unknown>
  status?: B9ContentStatus
  sort_order?: number
}

export type UpsertB9ContentCategoryInput = {
  kind: B9ContentKind
  slug: string
  title_zh: string
  title_en: string
  sort_order?: number
  status?: B9CategoryStatus
}

export type ListB9ContentItemsFilter = {
  kind: B9ContentKind
  status?: B9ContentStatus | 'all'
  categoryId?: number | null
  search?: string
  limit?: number
  offset?: number
}

export const B9_CONTENT_KINDS: B9ContentKind[] = [
  'faq',
  'media_file',
  'scenario',
  'display_slide',
  'innovation',
]

const B9_PUBLIC_CACHE_SECONDS = 60
export const B9_PUBLIC_CACHE_TAG = 'b9-public-content'

const ITEM_COLUMNS = `
  i.id, i.kind, i.slug, i.category_id,
  c.slug AS category_slug,
  c.title_zh AS category_title_zh,
  c.title_en AS category_title_en,
  i.title_zh, i.title_en,
  i.summary_zh, i.summary_en,
  i.body_zh, i.body_en,
  i.cover_image_url, i.file_url,
  i.cta_label_zh, i.cta_label_en, i.cta_href,
  i.payload,
  i.status,
  i.sort_order,
  i.published_at::text AS published_at,
  i.created_at::text AS created_at,
  i.updated_at::text AS updated_at,
  i.deleted_at::text AS deleted_at
`

const ITEM_FROM = `
  site_content_items i
  LEFT JOIN site_content_categories c
    ON c.id = i.category_id
   AND c.deleted_at IS NULL
`

function isB9ContentKind(value: string): value is B9ContentKind {
  return B9_CONTENT_KINDS.includes(value as B9ContentKind)
}

export function assertB9ContentKind(value: string): B9ContentKind {
  if (!isB9ContentKind(value)) throw new Error('Unsupported content kind')
  return value
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160)
}

function normalizePayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function rowToItem(row: B9ContentItem): B9ContentItem {
  return {
    ...row,
    payload: normalizePayload(row.payload),
  }
}

export async function ensureB9ContentSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content_categories (
      id          SERIAL PRIMARY KEY,
      kind        VARCHAR(40) NOT NULL,
      slug        VARCHAR(160) NOT NULL,
      title_zh    VARCHAR(200) NOT NULL,
      title_en    VARCHAR(200) NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      status      VARCHAR(20) NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible','hidden')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at  TIMESTAMPTZ,
      UNIQUE (kind, slug)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content_items (
      id              SERIAL PRIMARY KEY,
      kind            VARCHAR(40) NOT NULL,
      slug            VARCHAR(160) NOT NULL,
      category_id     INTEGER REFERENCES site_content_categories(id) ON DELETE SET NULL,
      title_zh        VARCHAR(240) NOT NULL DEFAULT '',
      title_en        VARCHAR(240) NOT NULL DEFAULT '',
      summary_zh      TEXT,
      summary_en      TEXT,
      body_zh         TEXT,
      body_en         TEXT,
      cover_image_url TEXT,
      file_url        TEXT,
      cta_label_zh    VARCHAR(120),
      cta_label_en    VARCHAR(120),
      cta_href        TEXT,
      payload         JSONB NOT NULL DEFAULT '{}',
      status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','published','hidden')),
      sort_order      INTEGER NOT NULL DEFAULT 0,
      published_at    TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at      TIMESTAMPTZ,
      UNIQUE (kind, slug)
    )
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_site_content_categories_kind_sort
      ON site_content_categories (kind, status, sort_order)
      WHERE deleted_at IS NULL
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_site_content_items_kind_status_sort
      ON site_content_items (kind, status, sort_order)
      WHERE deleted_at IS NULL
  `)
}

export async function listB9ContentCategories(kind: B9ContentKind, includeHidden = false) {
  await ensureB9ContentSchema()
  const params: unknown[] = [kind]
  const conds = ['c.kind = $1', 'c.deleted_at IS NULL']
  if (!includeHidden) conds.push(`c.status = 'visible'`)

  const res = await pool.query<B9ContentCategory>(
    `SELECT
       c.id, c.kind, c.slug, c.title_zh, c.title_en,
       c.sort_order, c.status,
       COUNT(i.id)::int AS item_count,
       c.created_at::text AS created_at,
       c.updated_at::text AS updated_at
     FROM site_content_categories c
     LEFT JOIN site_content_items i
       ON i.category_id = c.id
      AND i.deleted_at IS NULL
     WHERE ${conds.join(' AND ')}
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.updated_at DESC`,
    params,
  )
  return res.rows
}

export async function createB9ContentCategory(input: UpsertB9ContentCategoryInput) {
  await ensureB9ContentSchema()
  const slug = normalizeSlug(input.slug)
  if (!slug) throw new Error('Slug required')

  const res = await pool.query<B9ContentCategory>(
    `INSERT INTO site_content_categories
       (kind, slug, title_zh, title_en, sort_order, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (kind, slug) DO UPDATE
       SET title_zh = EXCLUDED.title_zh,
           title_en = EXCLUDED.title_en,
           sort_order = EXCLUDED.sort_order,
           status = EXCLUDED.status,
           deleted_at = NULL,
           updated_at = NOW()
     RETURNING
       id, kind, slug, title_zh, title_en, sort_order, status,
       created_at::text AS created_at,
       updated_at::text AS updated_at`,
    [
      input.kind,
      slug,
      input.title_zh.trim(),
      input.title_en.trim(),
      input.sort_order ?? 0,
      input.status ?? 'visible',
    ],
  )
  return res.rows[0]
}

export async function listB9ContentItems(filter: ListB9ContentItemsFilter) {
  await ensureB9ContentSchema()
  const limit = Math.min(100, Math.max(1, filter.limit ?? 50))
  const offset = Math.max(0, filter.offset ?? 0)
  const params: unknown[] = [filter.kind]
  const conds = ['i.kind = $1', 'i.deleted_at IS NULL']

  if (filter.status && filter.status !== 'all') {
    params.push(filter.status)
    conds.push(`i.status = $${params.length}`)
  }
  if (filter.categoryId) {
    params.push(filter.categoryId)
    conds.push(`i.category_id = $${params.length}`)
  }
  if (filter.search?.trim()) {
    params.push(`%${filter.search.trim()}%`)
    const i = params.length
    conds.push(`(
      i.slug ILIKE $${i}
      OR i.title_zh ILIKE $${i}
      OR i.title_en ILIKE $${i}
      OR COALESCE(i.summary_zh, '') ILIKE $${i}
      OR COALESCE(i.summary_en, '') ILIKE $${i}
    )`)
  }

  const where = `WHERE ${conds.join(' AND ')}`
  const [countRes, listRes] = await Promise.all([
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM site_content_items i ${where}`,
      params,
    ),
    pool.query<B9ContentItem>(
      `SELECT ${ITEM_COLUMNS} FROM ${ITEM_FROM} ${where}
       ORDER BY i.sort_order ASC, i.updated_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
  ])

  return {
    rows: listRes.rows.map(rowToItem),
    total: parseInt(countRes.rows[0]?.count ?? '0', 10),
  }
}

export async function getB9ContentItemById(id: number) {
  await ensureB9ContentSchema()
  const res = await pool.query<B9ContentItem>(
    `SELECT ${ITEM_COLUMNS} FROM ${ITEM_FROM}
     WHERE i.id = $1 AND i.deleted_at IS NULL`,
    [id],
  )
  return res.rows[0] ? rowToItem(res.rows[0]) : null
}

export async function getPublicB9ContentItem(kind: B9ContentKind, slug: string) {
  await ensureB9ContentSchema()
  const normalizedSlug = normalizeSlug(slug)
  const res = await pool.query<B9ContentItem>(
    `SELECT ${ITEM_COLUMNS} FROM ${ITEM_FROM}
     WHERE i.kind = $1
       AND i.slug = $2
       AND i.status = 'published'
       AND i.deleted_at IS NULL`,
    [kind, normalizedSlug],
  )
  return res.rows[0] ? rowToItem(res.rows[0]) : null
}

const listPublicB9ContentItemsCached = unstable_cache(
  async (kind: B9ContentKind) => {
    await ensureB9ContentSchema()
    const res = await pool.query<B9ContentItem>(
      `SELECT ${ITEM_COLUMNS} FROM ${ITEM_FROM}
       WHERE i.kind = $1
         AND i.status = 'published'
         AND i.deleted_at IS NULL
       ORDER BY i.sort_order ASC, i.updated_at DESC`,
      [kind],
    )
    return res.rows.map(rowToItem)
  },
  ['b9-public-content-items'],
  { revalidate: B9_PUBLIC_CACHE_SECONDS, tags: [B9_PUBLIC_CACHE_TAG] },
)

export async function listPublicB9ContentItems(kind: B9ContentKind) {
  return listPublicB9ContentItemsCached(kind)
}

export async function upsertB9ContentItem(input: UpsertB9ContentItemInput, id?: number) {
  await ensureB9ContentSchema()
  const slug = normalizeSlug(input.slug)
  if (!slug) throw new Error('Slug required')

  const status = input.status ?? 'draft'
  const publishedAtExpression = status === 'published'
    ? 'COALESCE(published_at, NOW())'
    : 'published_at'

  if (id) {
    const res = await pool.query<B9ContentItem>(
      `UPDATE site_content_items
       SET kind = $2,
           slug = $3,
           category_id = $4,
           title_zh = $5,
           title_en = $6,
           summary_zh = $7,
           summary_en = $8,
           body_zh = $9,
           body_en = $10,
           cover_image_url = $11,
           file_url = $12,
           cta_label_zh = $13,
           cta_label_en = $14,
           cta_href = $15,
           payload = $16::jsonb,
           status = $17,
           sort_order = $18,
           published_at = ${publishedAtExpression},
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [
        id,
        input.kind,
        slug,
        input.category_id ?? null,
        input.title_zh.trim(),
        input.title_en.trim(),
        input.summary_zh?.trim() || null,
        input.summary_en?.trim() || null,
        input.body_zh?.trim() || null,
        input.body_en?.trim() || null,
        input.cover_image_url?.trim() || null,
        input.file_url?.trim() || null,
        input.cta_label_zh?.trim() || null,
        input.cta_label_en?.trim() || null,
        input.cta_href?.trim() || null,
        JSON.stringify(input.payload ?? {}),
        status,
        input.sort_order ?? 0,
      ],
    )
    const updatedId = res.rows[0]?.id
    if (!updatedId) return null
    return getB9ContentItemById(updatedId)
  }

  const res = await pool.query<B9ContentItem>(
    `INSERT INTO site_content_items
       (kind, slug, category_id, title_zh, title_en,
        summary_zh, summary_en, body_zh, body_en,
        cover_image_url, file_url, cta_label_zh, cta_label_en, cta_href,
        payload, status, sort_order, published_at)
     VALUES
       ($1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15::jsonb, $16::text, $17,
        CASE WHEN $16::text = 'published' THEN NOW() ELSE NULL END)
     RETURNING id`,
    [
      input.kind,
      slug,
      input.category_id ?? null,
      input.title_zh.trim(),
      input.title_en.trim(),
      input.summary_zh?.trim() || null,
      input.summary_en?.trim() || null,
      input.body_zh?.trim() || null,
      input.body_en?.trim() || null,
      input.cover_image_url?.trim() || null,
      input.file_url?.trim() || null,
      input.cta_label_zh?.trim() || null,
      input.cta_label_en?.trim() || null,
      input.cta_href?.trim() || null,
      JSON.stringify(input.payload ?? {}),
      status,
      input.sort_order ?? 0,
    ],
  )
  return getB9ContentItemById(res.rows[0].id)
}
