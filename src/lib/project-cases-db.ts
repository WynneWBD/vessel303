import { pool } from '@/lib/db'
import {
  staticProjectCases,
  type ProjectCaseInput,
  type ProjectCaseRow,
  type ProjectCaseStatus,
} from '@/lib/project-cases-static'

export type { ProjectCaseInput, ProjectCaseRow, ProjectCaseStatus }

export type ListProjectCasesFilter = {
  status?: ProjectCaseStatus
  search?: string
  limit: number
  offset: number
}

let schemaReady: Promise<void> | null = null

const COLUMNS = `
  id, name_zh, name_en, location_zh, location_en,
  project_type_zh, project_type_en, area_display, investment_display,
  units_display, products, description_zh, description_en,
  tags_zh, tags_en, cover_image_url, images, country,
  latitude, longitude,
  global_amenities, global_transport_zh, global_transport_en,
  global_nearby_zh, global_nearby_en,
  status, sort_order,
  created_at::text AS created_at,
  updated_at::text AS updated_at,
  deleted_at::text AS deleted_at
`

function rowToProjectCase(row: {
  id: string
  name_zh: string
  name_en: string
  location_zh: string
  location_en: string
  project_type_zh: string
  project_type_en: string
  area_display: string
  investment_display: string
  units_display: string
  products: string
  description_zh: string
  description_en: string
  tags_zh: string[]
  tags_en: string[]
  cover_image_url: string | null
  images: string[]
  country: string
  latitude: string | number | null
  longitude: string | number | null
  global_amenities: ProjectCaseRow['global_amenities']
  global_transport_zh: ProjectCaseRow['global_transport_zh']
  global_transport_en: ProjectCaseRow['global_transport_en']
  global_nearby_zh: ProjectCaseRow['global_nearby_zh']
  global_nearby_en: ProjectCaseRow['global_nearby_en']
  status: ProjectCaseStatus
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}): ProjectCaseRow {
  return {
    id: row.id,
    name_zh: row.name_zh,
    name_en: row.name_en,
    location_zh: row.location_zh,
    location_en: row.location_en,
    project_type_zh: row.project_type_zh,
    project_type_en: row.project_type_en,
    area_display: row.area_display,
    investment_display: row.investment_display,
    units_display: row.units_display,
    products: row.products,
    description_zh: row.description_zh,
    description_en: row.description_en,
    tags_zh: row.tags_zh ?? [],
    tags_en: row.tags_en ?? [],
    cover_image_url: row.cover_image_url,
    images: row.images ?? [],
    country: row.country,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    global_amenities: row.global_amenities ?? [],
    global_transport_zh: row.global_transport_zh ?? [],
    global_transport_en: row.global_transport_en ?? [],
    global_nearby_zh: row.global_nearby_zh ?? [],
    global_nearby_en: row.global_nearby_en ?? [],
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

async function seedProjectCasesIfEmpty() {
  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM project_cases`,
  )
  if (parseInt(countRes.rows[0]?.count ?? '0', 10) > 0) return

  for (const item of staticProjectCases) {
    await pool.query(
      `INSERT INTO project_cases (
         id, name_zh, name_en, location_zh, location_en,
         project_type_zh, project_type_en, area_display, investment_display,
         units_display, products, description_zh, description_en,
         tags_zh, tags_en, cover_image_url, images, country,
         latitude, longitude, status, sort_order
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9,
         $10, $11, $12, $13,
         $14, $15, $16, $17, $18,
         $19, $20, 'published', $21
       )
       ON CONFLICT (id) DO NOTHING`,
      [
        item.id,
        item.name_zh,
        item.name_en,
        item.location_zh,
        item.location_en,
        item.project_type_zh,
        item.project_type_en,
        item.area_display,
        item.investment_display,
        item.units_display,
        item.products,
        item.description_zh,
        item.description_en,
        JSON.stringify(item.tags_zh),
        JSON.stringify(item.tags_en),
        item.cover_image_url,
        JSON.stringify(item.images),
        item.country,
        item.latitude,
        item.longitude,
        item.sort_order,
      ],
    )
  }
}

export async function ensureProjectCasesSchema() {
  schemaReady ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_cases (
        id                 TEXT        PRIMARY KEY,
        name_zh            TEXT        NOT NULL,
        name_en            TEXT        NOT NULL,
        location_zh        TEXT        NOT NULL,
        location_en        TEXT        NOT NULL,
        project_type_zh    TEXT        NOT NULL DEFAULT '',
        project_type_en    TEXT        NOT NULL DEFAULT '',
        area_display       TEXT        NOT NULL DEFAULT '',
        investment_display TEXT        NOT NULL DEFAULT '',
        units_display      TEXT        NOT NULL DEFAULT '',
        products           TEXT        NOT NULL DEFAULT '',
        description_zh     TEXT        NOT NULL DEFAULT '',
        description_en     TEXT        NOT NULL DEFAULT '',
        tags_zh            JSONB       NOT NULL DEFAULT '[]',
        tags_en            JSONB       NOT NULL DEFAULT '[]',
        cover_image_url    TEXT,
        images             JSONB       NOT NULL DEFAULT '[]',
        country            TEXT        NOT NULL DEFAULT '',
        latitude           NUMERIC,
        longitude          NUMERIC,
        global_amenities   JSONB       NOT NULL DEFAULT '[]',
        global_transport_zh JSONB      NOT NULL DEFAULT '[]',
        global_transport_en JSONB      NOT NULL DEFAULT '[]',
        global_nearby_zh   JSONB       NOT NULL DEFAULT '[]',
        global_nearby_en   JSONB       NOT NULL DEFAULT '[]',
        status             TEXT        NOT NULL DEFAULT 'draft',
        sort_order         INTEGER     NOT NULL DEFAULT 999,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at         TIMESTAMPTZ
      )
    `)
    await pool.query(`
      ALTER TABLE project_cases
        ADD COLUMN IF NOT EXISTS global_amenities JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS global_transport_zh JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS global_transport_en JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS global_nearby_zh JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS global_nearby_en JSONB NOT NULL DEFAULT '[]'
    `)
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_project_cases_public
       ON project_cases (status, sort_order)
       WHERE deleted_at IS NULL`,
    )
    await seedProjectCasesIfEmpty()
  })()

  return schemaReady
}

function buildWhere(filter: Partial<ListProjectCasesFilter>, publicOnly = false) {
  const conds = ['deleted_at IS NULL']
  const params: unknown[] = []

  if (publicOnly) {
    conds.push(`status = 'published'`)
  } else if (filter.status) {
    params.push(filter.status)
    conds.push(`status = $${params.length}`)
  }

  if (filter.search) {
    params.push(`%${filter.search}%`)
    const i = params.length
    conds.push(`(id ILIKE $${i} OR name_zh ILIKE $${i} OR name_en ILIKE $${i} OR location_zh ILIKE $${i} OR location_en ILIKE $${i})`)
  }

  return { where: `WHERE ${conds.join(' AND ')}`, params }
}

export async function listProjectCases(filter: ListProjectCasesFilter) {
  await ensureProjectCasesSchema()
  const { where, params } = buildWhere(filter)
  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM project_cases ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)
  const listRes = await pool.query(
    `SELECT ${COLUMNS} FROM project_cases ${where}
     ORDER BY sort_order ASC, updated_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, filter.limit, filter.offset],
  )

  return { rows: listRes.rows.map(rowToProjectCase), total }
}

export async function listPublishedProjectCases() {
  await ensureProjectCasesSchema()
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM project_cases
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY sort_order ASC, updated_at DESC`,
  )
  return rows.map(rowToProjectCase)
}

export async function getProjectCaseById(id: string) {
  await ensureProjectCasesSchema()
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM project_cases WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  )
  return rows[0] ? rowToProjectCase(rows[0]) : null
}

export async function isProjectCaseIdTaken(id: string, exceptId?: string) {
  await ensureProjectCasesSchema()
  const params: unknown[] = [id]
  let extra = ''
  if (exceptId) {
    params.push(exceptId)
    extra = ` AND id <> $${params.length}`
  }
  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM project_cases WHERE id = $1 AND deleted_at IS NULL${extra}
     ) AS exists`,
    params,
  )
  return !!res.rows[0]?.exists
}

export async function createProjectCase(input: ProjectCaseInput) {
  await ensureProjectCasesSchema()
  const res = await pool.query(
    `INSERT INTO project_cases (
       id, name_zh, name_en, location_zh, location_en,
       project_type_zh, project_type_en, area_display, investment_display,
       units_display, products, description_zh, description_en,
       tags_zh, tags_en, cover_image_url, images, country,
       latitude, longitude,
       global_amenities, global_transport_zh, global_transport_en,
       global_nearby_zh, global_nearby_en,
       status, sort_order
     ) VALUES (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9,
       $10, $11, $12, $13,
       $14, $15, $16, $17, $18,
       $19, $20, $21, $22, $23, $24, $25, $26, $27
     )
     RETURNING ${COLUMNS}`,
    [
      input.id,
      input.name_zh,
      input.name_en,
      input.location_zh,
      input.location_en,
      input.project_type_zh,
      input.project_type_en,
      input.area_display,
      input.investment_display,
      input.units_display,
      input.products,
      input.description_zh,
      input.description_en,
      JSON.stringify(input.tags_zh),
      JSON.stringify(input.tags_en),
      input.cover_image_url,
      JSON.stringify(input.images),
      input.country,
      input.latitude,
      input.longitude,
      JSON.stringify(input.global_amenities ?? []),
      JSON.stringify(input.global_transport_zh ?? []),
      JSON.stringify(input.global_transport_en ?? []),
      JSON.stringify(input.global_nearby_zh ?? []),
      JSON.stringify(input.global_nearby_en ?? []),
      input.status ?? 'draft',
      input.sort_order ?? 999,
    ],
  )
  return rowToProjectCase(res.rows[0])
}

export type UpdateProjectCaseInput = Partial<ProjectCaseInput>

export async function updateProjectCase(id: string, input: UpdateProjectCaseInput) {
  await ensureProjectCasesSchema()
  const fields: [keyof UpdateProjectCaseInput, string, (v: unknown) => unknown][] = [
    ['name_zh', 'name_zh', (v) => v],
    ['name_en', 'name_en', (v) => v],
    ['location_zh', 'location_zh', (v) => v],
    ['location_en', 'location_en', (v) => v],
    ['project_type_zh', 'project_type_zh', (v) => v],
    ['project_type_en', 'project_type_en', (v) => v],
    ['area_display', 'area_display', (v) => v],
    ['investment_display', 'investment_display', (v) => v],
    ['units_display', 'units_display', (v) => v],
    ['products', 'products', (v) => v],
    ['description_zh', 'description_zh', (v) => v],
    ['description_en', 'description_en', (v) => v],
    ['tags_zh', 'tags_zh', (v) => JSON.stringify(v ?? [])],
    ['tags_en', 'tags_en', (v) => JSON.stringify(v ?? [])],
    ['cover_image_url', 'cover_image_url', (v) => v || null],
    ['images', 'images', (v) => JSON.stringify(v ?? [])],
    ['country', 'country', (v) => v],
    ['latitude', 'latitude', (v) => v ?? null],
    ['longitude', 'longitude', (v) => v ?? null],
    ['global_amenities', 'global_amenities', (v) => JSON.stringify(v ?? [])],
    ['global_transport_zh', 'global_transport_zh', (v) => JSON.stringify(v ?? [])],
    ['global_transport_en', 'global_transport_en', (v) => JSON.stringify(v ?? [])],
    ['global_nearby_zh', 'global_nearby_zh', (v) => JSON.stringify(v ?? [])],
    ['global_nearby_en', 'global_nearby_en', (v) => JSON.stringify(v ?? [])],
    ['status', 'status', (v) => v],
    ['sort_order', 'sort_order', (v) => v],
  ]
  const params: unknown[] = [id]
  const sets: string[] = []
  for (const [key, col, normalize] of fields) {
    if (key in input) {
      params.push(normalize(input[key]))
      sets.push(`${col} = $${params.length}`)
    }
  }

  if (sets.length === 0) return getProjectCaseById(id)
  sets.push('updated_at = NOW()')

  const res = await pool.query(
    `UPDATE project_cases SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${COLUMNS}`,
    params,
  )
  return res.rows[0] ? rowToProjectCase(res.rows[0]) : null
}

export async function softDeleteProjectCase(id: string) {
  await ensureProjectCasesSchema()
  const res = await pool.query<{ id: string }>(
    `UPDATE project_cases SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id],
  )
  return res.rows[0]?.id ?? null
}

export async function countProjectCasesByStatus() {
  await ensureProjectCasesSchema()
  const res = await pool.query<{ draft: string; published: string; total: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*)::text AS total
     FROM project_cases
     WHERE deleted_at IS NULL`,
  )
  return {
    draft: parseInt(res.rows[0]?.draft ?? '0', 10),
    published: parseInt(res.rows[0]?.published ?? '0', 10),
    total: parseInt(res.rows[0]?.total ?? '0', 10),
  }
}
