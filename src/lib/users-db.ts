import { pool } from '@/lib/db'

export type UserRole = 'user' | 'admin'
export type UserIdentity = 'buyer' | 'investor' | 'agent' | 'individual'

export type AdminUserRow = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: UserRole
  identity: UserIdentity | null
  disabled: boolean
  created_at: string
  last_login_at: string | null
  has_password: boolean
}

export type UserFilter = {
  role?: string
  identity?: string
  search?: string
  disabled?: string // 'true' | 'false' | 'all'
  page?: number
  limit?: number
}

const USER_COLUMNS = `
  id, email, name, image, role, identity, disabled, created_at, last_login_at,
  (password IS NOT NULL) AS has_password
`

function buildWhere(filter: UserFilter) {
  const conds: string[] = []
  const params: unknown[] = []

  if (filter.role && filter.role !== 'all') {
    params.push(filter.role)
    conds.push(`role = $${params.length}`)
  }
  if (filter.identity && filter.identity !== 'all') {
    if (filter.identity === 'null') {
      conds.push(`identity IS NULL`)
    } else {
      params.push(filter.identity)
      conds.push(`identity = $${params.length}`)
    }
  }
  if (filter.disabled && filter.disabled !== 'all') {
    params.push(filter.disabled === 'true')
    conds.push(`disabled = $${params.length}`)
  }
  if (filter.search) {
    params.push(`%${filter.search}%`)
    const i = params.length
    conds.push(`(email ILIKE $${i} OR name ILIKE $${i})`)
  }

  return {
    where: conds.length ? `WHERE ${conds.join(' AND ')}` : '',
    params,
  }
}

export async function listUsers(filter: UserFilter) {
  const page = Math.max(1, filter.page ?? 1)
  const limit = Math.min(200, Math.max(1, filter.limit ?? 50))
  const offset = (page - 1) * limit

  const { where, params } = buildWhere(filter)

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query<AdminUserRow>(
    `SELECT ${USER_COLUMNS} FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  )

  return { users: listRes.rows, total, page, limit }
}

export async function exportUsers(filter: UserFilter) {
  const { where, params } = buildWhere(filter)
  const res = await pool.query<AdminUserRow>(
    `SELECT ${USER_COLUMNS} FROM users ${where} ORDER BY created_at DESC`,
    params,
  )
  return res.rows
}

export async function getUser(id: string) {
  const res = await pool.query<AdminUserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [id],
  )
  return res.rows[0] ?? null
}

export type UpdateUserInput = {
  role?: UserRole
  identity?: UserIdentity | null
  disabled?: boolean
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const existing = await getUser(id)
  if (!existing) return null

  const nextRole = input.role ?? existing.role
  const nextIdentity =
    input.identity === undefined ? existing.identity : input.identity
  const nextDisabled = input.disabled ?? existing.disabled

  const res = await pool.query<AdminUserRow>(
    `UPDATE users SET role = $2, identity = $3, disabled = $4 WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [id, nextRole, nextIdentity, nextDisabled],
  )
  return res.rows[0] ?? null
}

export type UserStats = {
  leads_count: number
  news_count: number
}

export async function getUserStats(user: AdminUserRow): Promise<UserStats> {
  // leads are not joined to users by id — we match by email (lead.email = user.email)
  // news has author_id referencing users(id)
  const [leadsRes, newsRes] = await Promise.all([
    pool
      .query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM leads WHERE email = $1 AND deleted_at IS NULL`,
        [user.email],
      )
      .catch(() => ({ rows: [{ count: '0' }] })),
    pool
      .query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM news
         WHERE author_id = $1 AND deleted_at IS NULL`,
        [user.id],
      )
      .catch(() => ({ rows: [{ count: '0' }] })),
  ])
  return {
    leads_count: parseInt(leadsRes.rows[0]?.count ?? '0', 10),
    news_count: parseInt(newsRes.rows[0]?.count ?? '0', 10),
  }
}

export async function countUsers(filter: UserFilter) {
  const { where, params } = buildWhere(filter)
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users ${where}`,
    params,
  )
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

export type UserSummary = {
  total: number
  admins: number
  disabled: number
  untagged: number
}

export async function getUserSummary(): Promise<UserSummary> {
  const res = await pool.query<{
    total: string
    admins: string
    disabled: string
    untagged: string
  }>(
    `SELECT
       COUNT(*)::text                                         AS total,
       COUNT(*) FILTER (WHERE role = 'admin')::text           AS admins,
       COUNT(*) FILTER (WHERE disabled = true)::text          AS disabled,
       COUNT(*) FILTER (WHERE identity IS NULL)::text         AS untagged
     FROM users`,
  )
  const r = res.rows[0]
  return {
    total: parseInt(r?.total ?? '0', 10),
    admins: parseInt(r?.admins ?? '0', 10),
    disabled: parseInt(r?.disabled ?? '0', 10),
    untagged: parseInt(r?.untagged ?? '0', 10),
  }
}
