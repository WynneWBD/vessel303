import { pool } from '@/lib/db'
import {
  getLeadSourceType,
  getLeadSourceTypeLabel,
  getLeadSourceWherePatterns,
  LEAD_SOURCE_TYPE_OPTIONS,
  type LeadSourceType,
} from '@/lib/lead-source'

export type LeadStatus = 'new' | 'contacting' | 'quoted' | 'won' | 'lost'
export type LeadAttentionFilter = 'active' | 'unassigned' | 'overdue'

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
  source_type?: string
  attention?: string
  country?: string
  search?: string
  page?: number
  limit?: number
}

export type LeadSourceStatusSummary = {
  type: Exclude<LeadSourceType, 'all'>
  label: string
  total: number
  new: number
  contacting: number
  quoted: number
  won: number
  lost: number
}

export type LeadOperationsSummary = {
  total: number
  active: number
  unassignedActive: number
  overdue: number
  newToday: number
  new7d: number
  new30d: number
  updatedToday: number
}

const LEAD_COLUMNS = `
  id, email, name, phone, company, country, inquiry_type, sku_interest,
  message, source, status, assigned_to, notes, created_at, updated_at, deleted_at
`

const LEAD_STATUSES: LeadStatus[] = ['new', 'contacting', 'quoted', 'won', 'lost']
const ACTIVE_STATUS_SQL = "status IN ('new', 'contacting', 'quoted')"
const UNASSIGNED_SQL = "(assigned_to IS NULL OR BTRIM(assigned_to) = '')"
const OVERDUE_SQL = `(
  (status = 'new' AND created_at < NOW() - INTERVAL '24 hours')
  OR (status IN ('contacting', 'quoted') AND updated_at < NOW() - INTERVAL '7 days')
)`
const LEAD_SOURCE_TYPES = LEAD_SOURCE_TYPE_OPTIONS
  .map((item) => item.value)
  .filter((type): type is Exclude<LeadSourceType, 'all'> => type !== 'all')

function toCount(value: string | number | null | undefined) {
  const parsed = Number.parseInt(String(value ?? '0'), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

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
  if (filter.source_type && filter.source_type !== 'all') {
    const patterns = getLeadSourceWherePatterns(filter.source_type)
    if (filter.source_type === 'other') {
      const clauses = patterns.map((pattern) => {
        params.push(pattern)
        return `source NOT ILIKE $${params.length}`
      })
      conds.push(`(source IS NULL OR (${clauses.join(' AND ')}))`)
    } else if (patterns.length > 0) {
      const clauses = patterns.map((pattern) => {
        params.push(pattern)
        return `source ILIKE $${params.length}`
      })
      conds.push(`(${clauses.join(' OR ')})`)
    }
  }
  if (filter.attention === 'active') {
    conds.push(ACTIVE_STATUS_SQL)
  }
  if (filter.attention === 'unassigned') {
    conds.push(`${ACTIVE_STATUS_SQL} AND ${UNASSIGNED_SQL}`)
  }
  if (filter.attention === 'overdue') {
    conds.push(OVERDUE_SQL)
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

export async function summarizeLeadsBySourceStatus(): Promise<LeadSourceStatusSummary[]> {
  const initial = new Map<Exclude<LeadSourceType, 'all'>, LeadSourceStatusSummary>()

  for (const type of LEAD_SOURCE_TYPES) {
    initial.set(type, {
      type,
      label: getLeadSourceTypeLabel(type),
      total: 0,
      new: 0,
      contacting: 0,
      quoted: 0,
      won: 0,
      lost: 0,
    })
  }

  const res = await pool.query<{
    source: string | null
    status: LeadStatus
    count: string
  }>(
    `SELECT source, status, COUNT(*)::text AS count
       FROM leads
      WHERE deleted_at IS NULL
      GROUP BY source, status`,
  )

  for (const row of res.rows) {
    const type = getLeadSourceType(row.source)
    if (type === 'all' || !LEAD_STATUSES.includes(row.status)) continue

    const item = initial.get(type)
    if (!item) continue

    const count = parseInt(row.count ?? '0', 10)
    const safeCount = Number.isFinite(count) ? count : 0
    item[row.status] += safeCount
    item.total += safeCount
  }

  return Array.from(initial.values())
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
}

export async function getLeadOperationsSummary(): Promise<LeadOperationsSummary> {
  const res = await pool.query<{
    total: string
    active: string
    unassigned_active: string
    overdue: string
    new_today: string
    new7d: string
    new30d: string
    updated_today: string
  }>(
    `SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE ${ACTIVE_STATUS_SQL})::text AS active,
        COUNT(*) FILTER (WHERE ${ACTIVE_STATUS_SQL} AND ${UNASSIGNED_SQL})::text AS unassigned_active,
        COUNT(*) FILTER (WHERE ${OVERDUE_SQL})::text AS overdue,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::text AS new_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS new7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS new30d,
        COUNT(*) FILTER (WHERE updated_at >= CURRENT_DATE)::text AS updated_today
       FROM leads
      WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]

  return {
    total: toCount(row?.total),
    active: toCount(row?.active),
    unassignedActive: toCount(row?.unassigned_active),
    overdue: toCount(row?.overdue),
    newToday: toCount(row?.new_today),
    new7d: toCount(row?.new7d),
    new30d: toCount(row?.new30d),
    updatedToday: toCount(row?.updated_today),
  }
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
