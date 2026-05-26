import { pool } from '@/lib/db'

export type NewsStatus = 'draft' | 'published'
export type NewsCategoryStatus = 'visible' | 'hidden'

export interface NewsCategoryRow {
  id: number
  slug: string
  title_zh: string
  title_en: string
  description_zh: string | null
  description_en: string | null
  sort_order: number
  status: NewsCategoryStatus
  news_count?: number
  created_at: string
  updated_at: string
}

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
  category_id: number | null
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
  status: NewsStatus
  published_at: string | null
  scheduled_at: string | null
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
  category_id: number | null
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
  published_at: string | null
  scheduled_at: string | null
}

export type NewsStatusSummary = {
  draft: number
  published: number
  total: number
}

export type CreateNewsCategoryInput = {
  slug: string
  title_zh: string
  title_en: string
  description_zh?: string | null
  description_en?: string | null
  sort_order?: number
  status?: NewsCategoryStatus
}

export type UpdateNewsCategoryInput = Partial<CreateNewsCategoryInput>

const NEWS_COLUMNS = `
  n.id, n.slug, n.title_zh, n.title_en, n.content_zh, n.content_en,
  n.excerpt_zh, n.excerpt_en, n.cover_image_url,
  n.category_id,
  c.slug AS category_slug,
  c.title_zh AS category_title_zh,
  c.title_en AS category_title_en,
  n.status,
  n.published_at::text AS published_at,
  n.scheduled_at::text AS scheduled_at,
  n.author_id,
  n.created_at::text AS created_at,
  n.updated_at::text AS updated_at,
  n.deleted_at::text AS deleted_at
`

const NEWS_LIST_COLUMNS = `
  n.id, n.slug, n.title_zh, n.title_en, n.excerpt_zh, n.excerpt_en, n.cover_image_url,
  n.category_id,
  c.slug AS category_slug,
  c.title_zh AS category_title_zh,
  c.title_en AS category_title_en,
  n.published_at::text AS published_at,
  n.scheduled_at::text AS scheduled_at
`

const NEWS_FROM = `
  news n
  LEFT JOIN news_categories c
    ON c.id = n.category_id
   AND c.deleted_at IS NULL
`

export async function listNews({
  status,
  search,
  categoryId,
  scheduledOnly,
  limit,
  offset,
}: {
  status?: NewsStatus
  search?: string
  categoryId?: number
  scheduledOnly?: boolean
  limit: number
  offset: number
}) {
  const conds: string[] = ['n.deleted_at IS NULL']
  const params: unknown[] = []

  if (status) {
    params.push(status)
    conds.push(`n.status = $${params.length}`)
  }
  if (search) {
    params.push(`%${search}%`)
    const i = params.length
    conds.push(`(n.title_zh ILIKE $${i} OR n.title_en ILIKE $${i})`)
  }
  if (categoryId) {
    params.push(categoryId)
    conds.push(`n.category_id = $${params.length}`)
  }
  if (scheduledOnly) {
    conds.push(`n.status = 'draft'`)
    conds.push(`n.scheduled_at IS NOT NULL`)
  }

  const where = `WHERE ${conds.join(' AND ')}`

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM news n ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query<NewsRow>(
    `SELECT ${NEWS_COLUMNS} FROM ${NEWS_FROM} ${where}
     ORDER BY COALESCE(n.scheduled_at, n.updated_at) DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  )

  return { rows: listRes.rows, total }
}

export async function listDeletedNews({
  search,
  limit,
  offset,
}: {
  search?: string
  limit: number
  offset: number
}) {
  const conds: string[] = ['n.deleted_at IS NOT NULL']
  const params: unknown[] = []

  if (search) {
    params.push(`%${search}%`)
    const i = params.length
    conds.push(`(n.title_zh ILIKE $${i} OR n.title_en ILIKE $${i} OR n.slug ILIKE $${i})`)
  }

  const where = `WHERE ${conds.join(' AND ')}`

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM news n ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query<NewsRow>(
    `SELECT ${NEWS_COLUMNS} FROM ${NEWS_FROM} ${where}
     ORDER BY n.deleted_at DESC, n.updated_at DESC
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
    `SELECT COUNT(*)::text AS count FROM news n
     WHERE n.status = 'published' AND n.deleted_at IS NULL`,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query<NewsListItem>(
    `SELECT ${NEWS_LIST_COLUMNS} FROM ${NEWS_FROM}
     WHERE n.status = 'published' AND n.deleted_at IS NULL
     ORDER BY n.published_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  )

  return { rows: listRes.rows, total }
}

export async function getNewsById(id: number) {
  const res = await pool.query<NewsRow>(
    `SELECT ${NEWS_COLUMNS} FROM ${NEWS_FROM} WHERE n.id = $1 AND n.deleted_at IS NULL`,
    [id],
  )
  return res.rows[0] ?? null
}

export async function getNewsBySlug(slug: string) {
  const res = await pool.query<NewsRow>(
    `SELECT ${NEWS_COLUMNS} FROM ${NEWS_FROM}
     WHERE n.slug = $1 AND n.status = 'published' AND n.deleted_at IS NULL`,
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
  category_id?: number | null
  scheduled_at?: string | null
  author_id?: string | null
}

export async function createNews(input: CreateNewsInput) {
  const res = await pool.query<{ id: number }>(
    `INSERT INTO news
       (slug, title_zh, title_en, content_zh, content_en,
        excerpt_zh, excerpt_en, cover_image_url, category_id, scheduled_at, author_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft')
     RETURNING id`,
    [
      input.slug,
      input.title_zh,
      input.title_en,
      input.content_zh ?? {},
      input.content_en ?? {},
      input.excerpt_zh ?? null,
      input.excerpt_en ?? null,
      input.cover_image_url ?? null,
      input.category_id ?? null,
      input.scheduled_at ?? null,
      input.author_id ?? null,
    ],
  )
  const created = await getNewsById(res.rows[0].id)
  if (!created) throw new Error('Created news not found')
  return created
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
  category_id?: number | null
  scheduled_at?: string | null
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
    ['category_id', 'category_id'],
    ['scheduled_at', 'scheduled_at'],
  ]

  for (const [key, col] of fields) {
    if (key in input) {
      params.push(input[key])
      sets.push(`${col} = $${params.length}`)
    }
  }

  if (sets.length === 0) return getNewsById(id)

  sets.push('updated_at = NOW()')

  const res = await pool.query<{ id: number }>(
    `UPDATE news SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    params,
  )
  return res.rows[0]?.id ? getNewsById(res.rows[0].id) : null
}

export async function bulkUpdateNewsCategory(ids: number[], categoryId: number) {
  const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)))
  if (uniqueIds.length === 0) return { updatedIds: [], updatedCount: 0 }

  const res = await pool.query<{ id: number }>(
    `UPDATE news
       SET category_id = $1,
           updated_at = NOW()
     WHERE id = ANY($2::int[])
       AND deleted_at IS NULL
     RETURNING id`,
    [categoryId, uniqueIds],
  )

  const updatedIds = res.rows.map((row) => row.id)
  return { updatedIds, updatedCount: updatedIds.length }
}

export async function publishNews(id: number) {
  // Keep original published_at on re-publish; only update updated_at
  const res = await pool.query<{ id: number }>(
    `UPDATE news
       SET status = 'published',
           published_at = COALESCE(published_at, NOW()),
           scheduled_at = NULL,
           updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id],
  )
  return res.rows[0]?.id ? getNewsById(res.rows[0].id) : null
}

export async function unpublishNews(id: number) {
  const res = await pool.query<{ id: number }>(
    `UPDATE news
       SET status = 'draft',
           published_at = NULL,
           scheduled_at = NULL,
           updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id],
  )
  return res.rows[0]?.id ? getNewsById(res.rows[0].id) : null
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

export async function restoreNewsAsDraft(id: number) {
  const res = await pool.query<{ id: number }>(
    `UPDATE news
       SET deleted_at = NULL,
           status = 'draft',
           published_at = NULL,
           scheduled_at = NULL,
           updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NOT NULL
     RETURNING id`,
    [id],
  )
  return res.rows[0]?.id ? getNewsById(res.rows[0].id) : null
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

export async function listNewsCategories({
  includeHidden = false,
}: {
  includeHidden?: boolean
} = {}) {
  const conds = ['c.deleted_at IS NULL']
  if (!includeHidden) conds.push(`c.status = 'visible'`)

  type NewsCategoryQueryRow = Omit<NewsCategoryRow, 'news_count'> & { news_count: string }

  const res = await pool.query<NewsCategoryQueryRow>(
    `SELECT
       c.id,
       c.slug,
       c.title_zh,
       c.title_en,
       c.description_zh,
       c.description_en,
       c.sort_order,
       c.status,
       c.created_at::text AS created_at,
       c.updated_at::text AS updated_at,
       COUNT(n.id)::text AS news_count
     FROM news_categories c
     LEFT JOIN news n
       ON n.category_id = c.id
      AND n.deleted_at IS NULL
     WHERE ${conds.join(' AND ')}
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.id ASC`,
  )

  return res.rows.map((row) => ({
    ...row,
    news_count: parseInt(String(row.news_count ?? '0'), 10),
  }))
}

export async function getNewsCategoryById(id: number, { visibleOnly = false } = {}) {
  const conds = ['id = $1', 'deleted_at IS NULL']
  if (visibleOnly) conds.push(`status = 'visible'`)

  const res = await pool.query<NewsCategoryRow>(
    `SELECT
       id,
       slug,
       title_zh,
       title_en,
       description_zh,
       description_en,
       sort_order,
       status,
       created_at::text AS created_at,
       updated_at::text AS updated_at
     FROM news_categories
     WHERE ${conds.join(' AND ')}
     LIMIT 1`,
    [id],
  )

  return res.rows[0] ?? null
}

export async function isNewsCategorySlugTaken(slug: string, excludeId?: number) {
  const params: unknown[] = [slug]
  let extra = ''
  if (excludeId != null) {
    params.push(excludeId)
    extra = `AND id != $${params.length}`
  }

  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM news_categories WHERE slug = $1 AND deleted_at IS NULL ${extra}
     ) AS exists`,
    params,
  )
  return res.rows[0]?.exists ?? false
}

export async function createNewsCategory(input: CreateNewsCategoryInput) {
  const res = await pool.query<{ id: number }>(
    `INSERT INTO news_categories
       (slug, title_zh, title_en, description_zh, description_en, sort_order, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.slug,
      input.title_zh,
      input.title_en,
      input.description_zh ?? null,
      input.description_en ?? null,
      input.sort_order ?? 100,
      input.status ?? 'visible',
    ],
  )

  const created = await getNewsCategoryById(res.rows[0].id)
  if (!created) throw new Error('Created news category not found')
  return created
}

export async function updateNewsCategory(id: number, input: UpdateNewsCategoryInput) {
  const sets: string[] = []
  const params: unknown[] = [id]

  const fields: [keyof UpdateNewsCategoryInput, string][] = [
    ['slug', 'slug'],
    ['title_zh', 'title_zh'],
    ['title_en', 'title_en'],
    ['description_zh', 'description_zh'],
    ['description_en', 'description_en'],
    ['sort_order', 'sort_order'],
    ['status', 'status'],
  ]

  for (const [key, col] of fields) {
    if (key in input) {
      params.push(input[key])
      sets.push(`${col} = $${params.length}`)
    }
  }

  if (sets.length === 0) return getNewsCategoryById(id)

  sets.push('updated_at = NOW()')

  const res = await pool.query<{ id: number }>(
    `UPDATE news_categories SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    params,
  )

  return res.rows[0]?.id ? getNewsCategoryById(res.rows[0].id) : null
}
