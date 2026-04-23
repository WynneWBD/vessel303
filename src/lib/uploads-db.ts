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

export async function countNewsReferencingImage(url: string): Promise<number> {
  try {
    const res = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM news WHERE cover_image = $1`,
      [url],
    )
    return parseInt(res.rows[0]?.count ?? '0', 10)
  } catch {
    return 0
  }
}
