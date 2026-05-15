import { pool } from '@/lib/db'

export type Upload = {
  id: string
  url: string
  blob_path: string | null
  filename: string | null
  size: number | null
  mime: string | null
  uploaded_by: string | null
  uploaded_by_email: string | null
  created_at: string
}

export type UploadFilter = {
  search?: string
  mime?: string // 'all' | 'jpeg' | 'png' | 'webp' | 'gif' | 'svg'
  page?: number
  limit?: number
}

export type MediaReferenceCounts = {
  news: number
  products: number
  projects: number
  pages: number
  pageSnapshots: number
  total: number
}

export type MediaReferenceItem = {
  id: string
  title: string
  href: string
  fields: string[]
}

export type MediaReferenceItems = {
  news: MediaReferenceItem[]
  products: MediaReferenceItem[]
  projects: MediaReferenceItem[]
  pages: MediaReferenceItem[]
  pageSnapshots: MediaReferenceItem[]
}

export type MediaReferenceDetails = MediaReferenceCounts & {
  items: MediaReferenceItems
}

type PageSnapshotRefRow = {
  id: string
  page_key: string
  module_key: string
  title_zh: string | null
  title_en: string | null
  created_at: string
  created_by_email: string | null
}

const MEDIA_REFERENCE_DETAIL_LIMIT = 10

const UPLOAD_COLUMNS = `
  u.id, u.url, u.blob_path, u.filename, u.size, u.mime,
  u.uploaded_by, usr.email AS uploaded_by_email, u.created_at
`

const MIME_MAP: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

function buildWhere(filter: UploadFilter) {
  const conds: string[] = []
  const params: unknown[] = []

  if (filter.mime && filter.mime !== 'all') {
    const target = MIME_MAP[filter.mime]
    if (target) {
      params.push(target)
      conds.push(`u.mime = $${params.length}`)
    }
  }
  if (filter.search) {
    params.push(`%${filter.search}%`)
    conds.push(`u.filename ILIKE $${params.length}`)
  }

  return {
    where: conds.length ? `WHERE ${conds.join(' AND ')}` : '',
    params,
  }
}

export async function listUploads(filter: UploadFilter) {
  const page = Math.max(1, filter.page ?? 1)
  const limit = Math.min(200, Math.max(1, filter.limit ?? 50))
  const offset = (page - 1) * limit

  const { where, params } = buildWhere(filter)

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM uploads u ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query<Upload>(
    `SELECT ${UPLOAD_COLUMNS}
       FROM uploads u
       LEFT JOIN users usr ON usr.id = u.uploaded_by
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  )

  return { uploads: listRes.rows, total, page, limit }
}

export async function getUpload(id: string) {
  const res = await pool.query<Upload>(
    `SELECT ${UPLOAD_COLUMNS}
       FROM uploads u
       LEFT JOIN users usr ON usr.id = u.uploaded_by
      WHERE u.id = $1`,
    [id],
  )
  return res.rows[0] ?? null
}

export type CreateUploadInput = {
  url: string
  blob_path: string
  filename: string
  size: number
  mime: string
  uploaded_by: string
}

export async function createUpload(input: CreateUploadInput): Promise<Upload> {
  const res = await pool.query<Upload>(
    `WITH inserted AS (
       INSERT INTO uploads (url, blob_path, filename, size, mime, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id
     )
     SELECT ${UPLOAD_COLUMNS}
       FROM uploads u
       LEFT JOIN users usr ON usr.id = u.uploaded_by
      WHERE u.id = (SELECT id FROM inserted)`,
    [input.url, input.blob_path, input.filename, input.size, input.mime, input.uploaded_by],
  )
  return res.rows[0]
}

export async function deleteUploadRow(id: string) {
  const res = await pool.query<{ id: string }>(
    `DELETE FROM uploads WHERE id = $1 RETURNING id`,
    [id],
  )
  return res.rows[0]?.id ?? null
}

export async function countUploads(): Promise<number> {
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM uploads`,
  )
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

export async function sumStorageSize(): Promise<number> {
  const res = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(size), 0)::text AS total FROM uploads`,
  )
  return parseInt(res.rows[0]?.total ?? '0', 10)
}

async function countRows(sql: string, params: unknown[]): Promise<number> {
  const res = await pool.query<{ count: string }>(sql, params)
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>(
    'SELECT to_regclass($1) AS table_name',
    [tableName],
  )
  return Boolean(res.rows[0]?.table_name)
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return '未命名内容'
}

function collectFields(fields: Array<[boolean | null | undefined, string]>): string[] {
  return fields.filter(([matched]) => Boolean(matched)).map(([, label]) => label)
}

export async function countNewsReferencingImage(url: string): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::text AS count
     FROM news
     WHERE deleted_at IS NULL
       AND (
         cover_image_url = $1
         OR strpos(COALESCE(content_zh::text, ''), $1) > 0
         OR strpos(COALESCE(content_en::text, ''), $1) > 0
       )`,
    [url],
  )
}

async function countPageModuleSnapshotReferences(url: string): Promise<number> {
  if (!(await tableExists('public.page_module_snapshots'))) return 0

  return countRows(
    `SELECT COUNT(*)::text AS count
     FROM page_module_snapshots
     WHERE strpos(COALESCE(items::text, ''), $1) > 0`,
    [url],
  )
}

async function listPageModuleSnapshotReferences(url: string): Promise<PageSnapshotRefRow[]> {
  if (!(await tableExists('public.page_module_snapshots'))) return []

  const res = await pool.query<PageSnapshotRefRow>(
    `SELECT
       s.id,
       s.page_key,
       s.module_key,
       s.title_zh,
       s.title_en,
       s.created_at::text AS created_at,
       u.email AS created_by_email
     FROM page_module_snapshots s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE strpos(COALESCE(s.items::text, ''), $1) > 0
     ORDER BY s.created_at DESC
     LIMIT $2`,
    [url, MEDIA_REFERENCE_DETAIL_LIMIT],
  )

  return res.rows
}

export async function countMediaReferences(url: string): Promise<MediaReferenceCounts> {
  const jsonArray = JSON.stringify([url])
  const [news, products, projects, pages, pageSnapshots] = await Promise.all([
    countNewsReferencingImage(url),
    countRows(
      `SELECT COUNT(*)::text AS count
       FROM product_catalog
       WHERE deleted_at IS NULL
         AND (
           image = $1
           OR gallery @> $2::jsonb
           OR strpos(COALESCE(detail_modules::text, ''), $1) > 0
         )`,
      [url, jsonArray],
    ),
    countRows(
      `SELECT COUNT(*)::text AS count
       FROM project_cases
       WHERE deleted_at IS NULL
         AND (
           cover_image_url = $1
           OR images @> $2::jsonb
         )`,
      [url, jsonArray],
    ),
    countRows(
      `SELECT COUNT(*)::text AS count
       FROM page_modules
       WHERE strpos(COALESCE(items::text, ''), $1) > 0`,
      [url],
    ),
    countPageModuleSnapshotReferences(url),
  ])

  return {
    news,
    products,
    projects,
    pages,
    pageSnapshots,
    total: news + products + projects + pages + pageSnapshots,
  }
}

export async function getMediaReferenceDetails(url: string): Promise<MediaReferenceDetails> {
  const jsonArray = JSON.stringify([url])

  type NewsRefRow = {
    id: string
    slug: string
    title_zh: string | null
    title_en: string | null
    in_cover: boolean | null
    in_content_zh: boolean | null
    in_content_en: boolean | null
  }

  type ProductRefRow = {
    id: string
    name_cn: string | null
    name_en: string | null
    in_cover: boolean | null
    in_gallery: boolean | null
    in_detail_modules: boolean | null
  }

  type ProjectRefRow = {
    id: string
    name_zh: string | null
    name_en: string | null
    in_cover: boolean | null
    in_images: boolean | null
  }

  type PageRefRow = {
    id: string
    page_key: string
    module_key: string
    title_zh: string | null
    title_en: string | null
  }

  const [counts, newsRes, productsRes, projectsRes, pagesRes, pageSnapshotsRes] = await Promise.all([
    countMediaReferences(url),
    pool.query<NewsRefRow>(
      `SELECT id::text AS id, slug, title_zh, title_en,
              (cover_image_url = $1) AS in_cover,
              (strpos(COALESCE(content_zh::text, ''), $1) > 0) AS in_content_zh,
              (strpos(COALESCE(content_en::text, ''), $1) > 0) AS in_content_en
         FROM news
        WHERE deleted_at IS NULL
          AND (
            cover_image_url = $1
            OR strpos(COALESCE(content_zh::text, ''), $1) > 0
            OR strpos(COALESCE(content_en::text, ''), $1) > 0
          )
        ORDER BY updated_at DESC NULLS LAST, id DESC
        LIMIT $2`,
      [url, MEDIA_REFERENCE_DETAIL_LIMIT],
    ),
    pool.query<ProductRefRow>(
      `SELECT id, name_cn, name_en,
              (image = $1) AS in_cover,
              (gallery @> $2::jsonb) AS in_gallery,
              (strpos(COALESCE(detail_modules::text, ''), $1) > 0) AS in_detail_modules
         FROM product_catalog
        WHERE deleted_at IS NULL
          AND (
            image = $1
            OR gallery @> $2::jsonb
            OR strpos(COALESCE(detail_modules::text, ''), $1) > 0
          )
        ORDER BY updated_at DESC NULLS LAST, id ASC
        LIMIT $3`,
      [url, jsonArray, MEDIA_REFERENCE_DETAIL_LIMIT],
    ),
    pool.query<ProjectRefRow>(
      `SELECT id, name_zh, name_en,
              (cover_image_url = $1) AS in_cover,
              (images @> $2::jsonb) AS in_images
         FROM project_cases
        WHERE deleted_at IS NULL
          AND (
            cover_image_url = $1
            OR images @> $2::jsonb
          )
        ORDER BY updated_at DESC NULLS LAST, id ASC
        LIMIT $3`,
      [url, jsonArray, MEDIA_REFERENCE_DETAIL_LIMIT],
    ),
    pool.query<PageRefRow>(
      `SELECT id, page_key, module_key, title_zh, title_en
         FROM page_modules
        WHERE strpos(COALESCE(items::text, ''), $1) > 0
        ORDER BY page_key ASC, sort_order ASC, module_key ASC
        LIMIT $2`,
      [url, MEDIA_REFERENCE_DETAIL_LIMIT],
    ),
    listPageModuleSnapshotReferences(url),
  ])

  return {
    ...counts,
    items: {
      news: newsRes.rows.map((row) => ({
        id: row.id,
        title: firstText(row.title_zh, row.title_en, row.slug),
        href: `/admin/news/${row.id}/edit`,
        fields: collectFields([
          [row.in_cover, '封面图'],
          [row.in_content_zh, '中文正文'],
          [row.in_content_en, '英文正文'],
        ]),
      })),
      products: productsRes.rows.map((row) => ({
        id: row.id,
        title: firstText(row.name_cn, row.name_en, row.id),
        href: `/admin/products/${row.id}/edit`,
        fields: collectFields([
          [row.in_cover, '封面图'],
          [row.in_gallery, '详情图库'],
          [row.in_detail_modules, '详情模块'],
        ]),
      })),
      projects: projectsRes.rows.map((row) => ({
        id: row.id,
        title: firstText(row.name_zh, row.name_en, row.id),
        href: `/admin/projects/${row.id}/edit`,
        fields: collectFields([
          [row.in_cover, '封面图'],
          [row.in_images, '图库'],
        ]),
      })),
      pages: pagesRes.rows.map((row) => ({
        id: row.id,
        title: firstText(row.title_zh, row.title_en, `${row.page_key}:${row.module_key}`),
        href: `/admin/pages?module=${encodeURIComponent(`${row.page_key}:${row.module_key}`)}`,
        fields: ['页面模块图片'],
      })),
      pageSnapshots: pageSnapshotsRes.map((row) => ({
        id: row.id,
        title: firstText(row.title_zh, row.title_en, `${row.page_key}:${row.module_key}`),
        href: '/admin/pages/visual',
        fields: [
          '历史快照引用',
          `${row.page_key}:${row.module_key}`,
          row.created_by_email ? `操作人: ${row.created_by_email}` : '操作人: 未知',
        ],
      })),
    },
  }
}
