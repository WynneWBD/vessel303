import { pool } from '@/lib/db'

export type LeadStatus = 'new' | 'contacting' | 'quoted' | 'won' | 'lost'

export type Lead = {
  id: string
  email: string
  name: string | null
  phone: string | null
  company: string | null
  country: string | null
  inquiry_type: string | null
  sku_interest: string | null
  message: string | null
  source: string | null
  status: LeadStatus
  assigned_to: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ListLeadsFilter = {
  status?: string
  inquiry_type?: string
  country?: string
  search?: string
  page?: number
  limit?: number
}

const LEAD_COLUMNS = `
  id, email, name, phone, company, country, inquiry_type, sku_interest,
  message, source, status, assigned_to, notes, created_at, updated_at, deleted_at
`

// Build WHERE clause fragments shared by listLeads + exportLeads.
function buildWhere(filter: ListLeadsFilter) {
  const conds: string[] = ['deleted_at IS NULL']
  const params: unknown[] = []

  if (filter.status && filter.status !== 'all') {
    params.push(filter.status)
    conds.push(`status = $${params.length}`)
  }
  if (filter.inquiry_type && filter.inquiry_type !== 'all') {
    params.push(filter.inquiry_type)
    conds.push(`inquiry_type = $${params.length}`)
  }
  if (filter.country) {
    params.push(`%${filter.country}%`)
    conds.push(`country ILIKE $${params.length}`)
  }
  if (filter.search) {
    params.push(`%${filter.search}%`)
    const i = params.length
    conds.push(
      `(email ILIKE $${i} OR name ILIKE $${i} OR company ILIKE $${i} OR message ILIKE $${i})`,
    )
  }

  return { where: `WHERE ${conds.join(' AND ')}`, params }
}

export async function listLeads(filter: ListLeadsFilter) {
  const page = Math.max(1, filter.page ?? 1)
  const limit = Math.min(200, Math.max(1, filter.limit ?? 50))
  const offset = (page - 1) * limit

  const { where, params } = buildWhere(filter)

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM leads ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query<Lead>(
    `SELECT ${LEAD_COLUMNS} FROM leads ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  )

  return { leads: listRes.rows, total, page, limit }
}

export async function exportLeads(filter: ListLeadsFilter) {
  const { where, params } = buildWhere(filter)
  const res = await pool.query<Lead>(
    `SELECT ${LEAD_COLUMNS} FROM leads ${where} ORDER BY created_at DESC`,
    params,
  )
  return res.rows
}

export async function getLead(id: string) {
  const res = await pool.query<Lead>(
    `SELECT ${LEAD_COLUMNS} FROM leads WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  )
  return res.rows[0] ?? null
}

export type CreateLeadInput = {
  email: string
  name?: string | null
  phone?: string | null
  company?: string | null
  country?: string | null
  inquiry_type?: string | null
  sku_interest?: string | null
  message?: string | null
  source?: string | null
}

export async function createLead(input: CreateLeadInput) {
  const res = await pool.query<Lead>(
    `INSERT INTO leads
       (email, name, phone, company, country, inquiry_type, sku_interest, message, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'admin_test'))
     RETURNING ${LEAD_COLUMNS}`,
    [
      input.email,
      input.name ?? null,
      input.phone ?? null,
      input.company ?? null,
      input.country ?? null,
      input.inquiry_type ?? null,
      input.sku_interest ?? null,
      input.message ?? null,
      input.source ?? null,
    ],
  )
  return res.rows[0]
}

export type UpdateLeadInput = {
  status?: LeadStatus
  assigned_to?: string | null
  note_append?: string | null
}

// Prepend a timestamped note to the existing notes field (newest on top).
export async function updateLead(id: string, input: UpdateLeadInput) {
  const existing = await getLead(id)
  if (!existing) return null

  const nextStatus = input.status ?? existing.status
  const nextAssigned =
    input.assigned_to === undefined ? existing.assigned_to : input.assigned_to
  let nextNotes = existing.notes ?? ''
  if (input.note_append && input.note_append.trim()) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const line = `[${ts}] ${input.note_append.trim()}`
    nextNotes = nextNotes ? `${line}\n${nextNotes}` : line
  }

  const res = await pool.query<Lead>(
    `UPDATE leads
       SET status = $2, assigned_to = $3, notes = $4, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${LEAD_COLUMNS}`,
    [id, nextStatus, nextAssigned, nextNotes],
  )
  return res.rows[0] ?? null
}

export async function softDeleteLead(id: string) {
  const res = await pool.query<{ id: string }>(
    `UPDATE leads SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id],
  )
  return res.rows[0]?.id ?? null
}

export async function countLeadsByStatus(status: LeadStatus) {
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM leads WHERE status = $1 AND deleted_at IS NULL`,
    [status],
  )
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
) {
  try {
    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id)
       VALUES ($1, $2, $3, $4)`,
      [adminId, action, targetType, targetId],
    )
  } catch (err) {
    // Never block the main action on audit log failure
    console.error('[admin_logs] insert failed', err)
  }
}
