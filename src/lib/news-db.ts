import { pool } from '@/lib/db'

export type NewsStatus = 'draft' | 'published'

export interface NewsRow {
  id: number
  slug: string
  title_zh: string
  title_en: string
  content_zh: unknown
  content_en: unknown
  excerpt_zh: string | null
  excerpt_en: string | null
  cover_image_url: string | null
  status: NewsStatus
  published_at: string | null
  author_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface NewsListItem {
  id: number
  slug: string
  title_zh: string
  title_en: string
  excerpt_zh: string | null
  excerpt_en: string | null
  cover_image_url: string | null
  published_at: string | null
}

export type NewsStatusSummary = {
  draft: number
  published: number
  total: number
}

const NEWS_COLUMNS = `
  id, slug, title_zh, title_en, content_zh, content_en,
  excerpt_zh, excerpt_en, cover_image_url, status,
  published_at, author_id, created_at, updated_at, deleted_at
`

const NEWS_LIST_COLUMNS = `
  id, slug, title_zh, title_en, excerpt_zh, excerpt_en, cover_image_url, published_at
`

export async function listNews({
  status,
  search,
  limit,
  offset,
}: {
  status?: NewsStatus
  search?: string
  limit: number
  offset: number
}) {
  const conds: string[] = ['deleted_at IS NULL']
  const params: unknown[] = []

  if (status) {
    params.push(status)
    conds.push(`status = $${params.length}`)
  }
  if (search) {
    params.push(`%${search}%`)
    const i = params.length
    conds.push(`(title_zh ILIKE $${i} OR title_en ILIKE $${i})`)
  }

  const where = `WHERE ${conds.join(' AND ')}`

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM news ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query<NewsRow>(
    `SELECT ${NEWS_COLUMNS} FROM news ${where}
     ORDER BY updated_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  )

  return { rows: listRes.rows, total }
}

export async function listPublishedNews({
  limit,
  offset,
}: {
  limit: number
  offset: number
}) {
  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM news
     WHERE status = 'published' AND deleted_at IS NULL`,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query<NewsListItem>(
    `SELECT ${NEWS_LIST_COLUMNS} FROM news
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY published_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  )

  return { rows: listRes.rows, total }
}

export async function getNewsById(id: number) {
  const res = await pool.query<NewsRow>(
    `SELECT ${NEWS_COLUMNS} FROM news WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  )
  return res.rows[0] ?? null
}

export async function getNewsBySlug(slug: string) {
  const res = await pool.query<NewsRow>(
    `SELECT ${NEWS_COLUMNS} FROM news
     WHERE slug = $1 AND status = 'published' AND deleted_at IS NULL`,
    [slug],
  )
  return res.rows[0] ?? null
}

export type CreateNewsInput = {
  slug: string
  title_zh: string
  title_en: string
  content_zh?: unknown
  content_en?: unknown
  excerpt_zh?: string | null
  excerpt_en?: string | null
  cover_image_url?: string | null
  author_id?: string | null
}

export async function createNews(input: CreateNewsInput) {
  const res = await pool.query<NewsRow>(
    `INSERT INTO news
       (slug, title_zh, title_en, content_zh, content_en,
        excerpt_zh, excerpt_en, cover_image_url, author_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
     RETURNING ${NEWS_COLUMNS}`,
    [
      input.slug,
      input.title_zh,
      input.title_en,
      input.content_zh ?? {},
      input.content_en ?? {},
      input.excerpt_zh ?? null,
      input.excerpt_en ?? null,
      input.cover_image_url ?? null,
      input.author_id ?? null,
    ],
  )
  return res.rows[0]
}

export type UpdateNewsInput = {
  slug?: string
  title_zh?: string
  title_en?: string
  content_zh?: unknown
  content_en?: unknown
  excerpt_zh?: string | null
  excerpt_en?: string | null
  cover_image_url?: string | null
}

export async function updateNews(id: number, input: UpdateNewsInput) {
  const sets: string[] = []
  const params: unknown[] = [id]

  const fields: [keyof UpdateNewsInput, string][] = [
    ['slug', 'slug'],
    ['title_zh', 'title_zh'],
    ['title_en', 'title_en'],
    ['content_zh', 'content_zh'],
    ['content_en', 'content_en'],
    ['excerpt_zh', 'excerpt_zh'],
    ['excerpt_en', 'excerpt_en'],
    ['cover_image_url', 'cover_image_url'],
  ]

  for (const [key, col] of fields) {
    if (key in input) {
      params.push(input[key])
      sets.push(`${col} = $${params.length}`)
    }
  }

  if (sets.length === 0) return getNewsById(id)

  sets.push('updated_at = NOW()')

  const res = await pool.query<NewsRow>(
    `UPDATE news SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${NEWS_COLUMNS}`,
    params,
  )
  return res.rows[0] ?? null
}

export async function publishNews(id: number) {
  // Keep original published_at on re-publish; only update updated_at
  const res = await pool.query<NewsRow>(
    `UPDATE news
       SET status = 'published',
           published_at = COALESCE(published_at, NOW()),
           updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${NEWS_COLUMNS}`,
    [id],
  )
  return res.rows[0] ?? null
}

export async function unpublishNews(id: number) {
  const res = await pool.query<NewsRow>(
    `UPDATE news
       SET status = 'draft', published_at = NULL, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${NEWS_COLUMNS}`,
    [id],
  )
  return res.rows[0] ?? null
}

export async function softDeleteNews(id: number) {
  const res = await pool.query<{ id: number }>(
    `UPDATE news SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id],
  )
  return res.rows[0]?.id ?? null
}

export async function countNewsByStatus(): Promise<NewsStatusSummary> {
  const res = await pool.query<{
    draft: string
    published: string
    total: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'draft')::text     AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*)::text                                     AS total
     FROM news
     WHERE deleted_at IS NULL`,
  )
  const r = res.rows[0]
  return {
    draft: parseInt(r?.draft ?? '0', 10),
    published: parseInt(r?.published ?? '0', 10),
    total: parseInt(r?.total ?? '0', 10),
  }
}

export async function isSlugTaken(slug: string, excludeId?: number) {
  const params: unknown[] = [slug]
  let extra = ''
  if (excludeId != null) {
    params.push(excludeId)
    extra = `AND id != $${params.length}`
  }

  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM news WHERE slug = $1 AND deleted_at IS NULL ${extra}
     ) AS exists`,
    params,
  )
  return res.rows[0]?.exists ?? false
}
