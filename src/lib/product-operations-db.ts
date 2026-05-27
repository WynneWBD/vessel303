import { pool } from '@/lib/db'
import { ensureProductCatalogSchema } from '@/lib/product-catalog-db'

export type ProductOperationStatus = 'visible' | 'hidden'
export type ProductFilterScope = 'all' | 'category' | 'brand'

export type ProductMarkRow = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  description_zh: string | null
  description_en: string | null
  color: string | null
  sort_order: number
  status: ProductOperationStatus
  created_at: string
  updated_at: string
  product_count?: number
}

export type ProductBrandRow = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  description_zh: string | null
  description_en: string | null
  logo_url: string | null
  sort_order: number
  status: ProductOperationStatus
  created_at: string
  updated_at: string
  product_count?: number
}

export type ProductFilterGroupRow = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  description_zh: string | null
  description_en: string | null
  scope: ProductFilterScope
  sort_order: number
  status: ProductOperationStatus
  created_at: string
  updated_at: string
  attribute_template_ids: number[]
  attribute_template_titles: string[]
}

export type ProductShowcaseRow = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  description_zh: string | null
  description_en: string | null
  sort_order: number
  status: ProductOperationStatus
  created_at: string
  updated_at: string
  product_ids: string[]
  product_count?: number
}

export type ProductOperationAssignments = {
  brand_id: number | null
  mark_ids: number[]
  showcase_ids: number[]
}

export type CreateProductMarkInput = {
  slug: string
  title_zh: string
  title_en: string
  description_zh?: string | null
  description_en?: string | null
  color?: string | null
  sort_order?: number
  status?: ProductOperationStatus
}

export type UpdateProductMarkInput = Partial<CreateProductMarkInput>

export type CreateProductBrandInput = {
  slug: string
  title_zh: string
  title_en: string
  description_zh?: string | null
  description_en?: string | null
  logo_url?: string | null
  sort_order?: number
  status?: ProductOperationStatus
}

export type UpdateProductBrandInput = Partial<CreateProductBrandInput>

export type CreateProductFilterGroupInput = {
  slug: string
  title_zh: string
  title_en: string
  description_zh?: string | null
  description_en?: string | null
  scope?: ProductFilterScope
  sort_order?: number
  status?: ProductOperationStatus
  attribute_template_ids?: number[]
}

export type UpdateProductFilterGroupInput = Partial<CreateProductFilterGroupInput>

export type CreateProductShowcaseInput = {
  slug: string
  title_zh: string
  title_en: string
  description_zh?: string | null
  description_en?: string | null
  sort_order?: number
  status?: ProductOperationStatus
  product_ids?: string[]
}

export type UpdateProductShowcaseInput = Partial<CreateProductShowcaseInput>

let operationsSchemaReady: Promise<void> | null = null

function parseIntArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

function uniqueIntIds(ids: number[] = [], limit = 100): number[] {
  return Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0))).slice(0, limit)
}

function uniqueTextIds(ids: string[] = [], limit = 100): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).slice(0, limit)
}

export async function ensureProductOperationsSchema() {
  operationsSchemaReady ??= (async () => {
    await ensureProductCatalogSchema()

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_marks (
        id              SERIAL PRIMARY KEY,
        slug            VARCHAR(120) UNIQUE NOT NULL,
        title_zh        VARCHAR(160) NOT NULL,
        title_en        VARCHAR(160) NOT NULL,
        description_zh  TEXT,
        description_en  TEXT,
        color           VARCHAR(32),
        sort_order      INTEGER NOT NULL DEFAULT 0,
        status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                        CHECK (status IN ('visible','hidden')),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at      TIMESTAMPTZ
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_brands (
        id              SERIAL PRIMARY KEY,
        slug            VARCHAR(120) UNIQUE NOT NULL,
        title_zh        VARCHAR(160) NOT NULL,
        title_en        VARCHAR(160) NOT NULL,
        description_zh  TEXT,
        description_en  TEXT,
        logo_url        TEXT,
        sort_order      INTEGER NOT NULL DEFAULT 0,
        status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                        CHECK (status IN ('visible','hidden')),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at      TIMESTAMPTZ
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_filter_groups (
        id              SERIAL PRIMARY KEY,
        slug            VARCHAR(120) UNIQUE NOT NULL,
        title_zh        VARCHAR(160) NOT NULL,
        title_en        VARCHAR(160) NOT NULL,
        description_zh  TEXT,
        description_en  TEXT,
        scope           VARCHAR(30) NOT NULL DEFAULT 'all'
                        CHECK (scope IN ('all','category','brand')),
        sort_order      INTEGER NOT NULL DEFAULT 0,
        status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                        CHECK (status IN ('visible','hidden')),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at      TIMESTAMPTZ
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_filter_group_templates (
        group_id        INTEGER NOT NULL REFERENCES product_filter_groups(id) ON DELETE CASCADE,
        template_id     INTEGER NOT NULL REFERENCES product_attribute_templates(id) ON DELETE CASCADE,
        sort_order      INTEGER NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (group_id, template_id)
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_showcases (
        id              SERIAL PRIMARY KEY,
        slug            VARCHAR(120) UNIQUE NOT NULL,
        title_zh        VARCHAR(160) NOT NULL,
        title_en        VARCHAR(160) NOT NULL,
        description_zh  TEXT,
        description_en  TEXT,
        sort_order      INTEGER NOT NULL DEFAULT 0,
        status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                        CHECK (status IN ('visible','hidden')),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at      TIMESTAMPTZ
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_showcase_items (
        showcase_id     INTEGER NOT NULL REFERENCES product_showcases(id) ON DELETE CASCADE,
        product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
        sort_order      INTEGER NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (showcase_id, product_id)
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_mark_values (
        product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
        mark_id         INTEGER NOT NULL REFERENCES product_marks(id) ON DELETE CASCADE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (product_id, mark_id)
      )
    `)
    await pool.query(`
      ALTER TABLE product_catalog
        ADD COLUMN IF NOT EXISTS brand_id INTEGER
    `)

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_catalog_brand'
        ) THEN
          ALTER TABLE product_catalog
          ADD CONSTRAINT fk_product_catalog_brand
          FOREIGN KEY (brand_id)
          REFERENCES product_brands(id)
          ON DELETE SET NULL;
        END IF;
      END $$;
    `)

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_marks_status_sort ON product_marks (status, sort_order) WHERE deleted_at IS NULL`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_brands_status_sort ON product_brands (status, sort_order) WHERE deleted_at IS NULL`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_filter_groups_status_sort ON product_filter_groups (status, sort_order) WHERE deleted_at IS NULL`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_showcases_status_sort ON product_showcases (status, sort_order) WHERE deleted_at IS NULL`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_catalog_brand_id ON product_catalog (brand_id) WHERE deleted_at IS NULL`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_mark_values_mark ON product_mark_values (mark_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_showcase_items_product ON product_showcase_items (product_id)`)
  })()

  return operationsSchemaReady
}

export async function listProductMarks({ includeHidden = false }: { includeHidden?: boolean } = {}) {
  await ensureProductOperationsSchema()
  const conds = ['m.deleted_at IS NULL']
  if (!includeHidden) conds.push(`m.status = 'visible'`)

  const res = await pool.query<ProductMarkRow & { product_count: string }>(
    `SELECT
       m.id,
       m.slug,
       m.title_zh,
       m.title_en,
       m.description_zh,
       m.description_en,
       m.color,
       m.sort_order,
       m.status,
       m.created_at::text AS created_at,
       m.updated_at::text AS updated_at,
       COUNT(pc.id)::text AS product_count
     FROM product_marks m
     LEFT JOIN product_mark_values mv
       ON mv.mark_id = m.id
     LEFT JOIN product_catalog pc
       ON pc.id = mv.product_id
      AND pc.deleted_at IS NULL
     WHERE ${conds.join(' AND ')}
     GROUP BY m.id
     ORDER BY m.sort_order ASC, m.id ASC`,
  )
  return res.rows.map((row) => ({
    ...row,
    product_count: parseInt(String(row.product_count ?? '0'), 10),
  }))
}

export async function listProductBrands({ includeHidden = false }: { includeHidden?: boolean } = {}) {
  await ensureProductOperationsSchema()
  const conds = ['b.deleted_at IS NULL']
  if (!includeHidden) conds.push(`b.status = 'visible'`)

  const res = await pool.query<ProductBrandRow & { product_count: string }>(
    `SELECT
       b.id,
       b.slug,
       b.title_zh,
       b.title_en,
       b.description_zh,
       b.description_en,
       b.logo_url,
       b.sort_order,
       b.status,
       b.created_at::text AS created_at,
       b.updated_at::text AS updated_at,
       COUNT(pc.id)::text AS product_count
     FROM product_brands b
     LEFT JOIN product_catalog pc
       ON pc.brand_id = b.id
      AND pc.deleted_at IS NULL
     WHERE ${conds.join(' AND ')}
     GROUP BY b.id
     ORDER BY b.sort_order ASC, b.id ASC`,
  )
  return res.rows.map((row) => ({
    ...row,
    product_count: parseInt(String(row.product_count ?? '0'), 10),
  }))
}

export async function listProductFilterGroups({ includeHidden = false }: { includeHidden?: boolean } = {}) {
  await ensureProductOperationsSchema()
  const conds = ['fg.deleted_at IS NULL']
  if (!includeHidden) conds.push(`fg.status = 'visible'`)

  type QueryRow = Omit<ProductFilterGroupRow, 'attribute_template_ids' | 'attribute_template_titles'> & {
    attribute_template_ids: unknown
    attribute_template_titles: unknown
  }

  const res = await pool.query<QueryRow>(
    `SELECT
       fg.id,
       fg.slug,
       fg.title_zh,
       fg.title_en,
       fg.description_zh,
       fg.description_en,
       fg.scope,
       fg.sort_order,
       fg.status,
       fg.created_at::text AS created_at,
       fg.updated_at::text AS updated_at,
       COALESCE(
         ARRAY_AGG(DISTINCT fgt.template_id) FILTER (WHERE fgt.template_id IS NOT NULL),
         ARRAY[]::int[]
       ) AS attribute_template_ids,
       COALESCE(
         ARRAY_AGG(DISTINCT t.title_zh) FILTER (WHERE t.title_zh IS NOT NULL),
         ARRAY[]::text[]
       ) AS attribute_template_titles
     FROM product_filter_groups fg
     LEFT JOIN product_filter_group_templates fgt
       ON fgt.group_id = fg.id
     LEFT JOIN product_attribute_templates t
       ON t.id = fgt.template_id
      AND t.deleted_at IS NULL
     WHERE ${conds.join(' AND ')}
     GROUP BY fg.id
     ORDER BY fg.sort_order ASC, fg.id ASC`,
  )
  return res.rows.map((row) => ({
    ...row,
    scope: row.scope as ProductFilterScope,
    attribute_template_ids: parseIntArray(row.attribute_template_ids),
    attribute_template_titles: parseStringArray(row.attribute_template_titles),
  }))
}

export async function listProductShowcases({ includeHidden = false }: { includeHidden?: boolean } = {}) {
  await ensureProductOperationsSchema()
  const conds = ['s.deleted_at IS NULL']
  if (!includeHidden) conds.push(`s.status = 'visible'`)

  type QueryRow = Omit<ProductShowcaseRow, 'product_ids' | 'product_count'> & {
    product_ids: unknown
    product_count: string
  }

  const res = await pool.query<QueryRow>(
    `SELECT
       s.id,
       s.slug,
       s.title_zh,
       s.title_en,
       s.description_zh,
       s.description_en,
       s.sort_order,
       s.status,
       s.created_at::text AS created_at,
       s.updated_at::text AS updated_at,
       COALESCE(
         ARRAY_AGG(DISTINCT si.product_id) FILTER (WHERE si.product_id IS NOT NULL),
         ARRAY[]::text[]
       ) AS product_ids,
       COUNT(DISTINCT pc.id)::text AS product_count
     FROM product_showcases s
     LEFT JOIN product_showcase_items si
       ON si.showcase_id = s.id
     LEFT JOIN product_catalog pc
       ON pc.id = si.product_id
      AND pc.deleted_at IS NULL
     WHERE ${conds.join(' AND ')}
     GROUP BY s.id
     ORDER BY s.sort_order ASC, s.id ASC`,
  )
  return res.rows.map((row) => ({
    ...row,
    product_ids: parseStringArray(row.product_ids),
    product_count: parseInt(String(row.product_count ?? '0'), 10),
  }))
}

async function isOperationSlugTaken(tableName: string, slug: string, excludeId?: number) {
  await ensureProductOperationsSchema()
  const params: unknown[] = [slug]
  let extra = ''
  if (excludeId != null) {
    params.push(excludeId)
    extra = `AND id != $${params.length}`
  }
  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM ${tableName} WHERE slug = $1 AND deleted_at IS NULL ${extra}
     ) AS exists`,
    params,
  )
  return res.rows[0]?.exists ?? false
}

export async function isProductMarkSlugTaken(slug: string, excludeId?: number) {
  return isOperationSlugTaken('product_marks', slug, excludeId)
}

export async function isProductBrandSlugTaken(slug: string, excludeId?: number) {
  return isOperationSlugTaken('product_brands', slug, excludeId)
}

export async function isProductFilterGroupSlugTaken(slug: string, excludeId?: number) {
  return isOperationSlugTaken('product_filter_groups', slug, excludeId)
}

export async function isProductShowcaseSlugTaken(slug: string, excludeId?: number) {
  return isOperationSlugTaken('product_showcases', slug, excludeId)
}

export async function getProductMarkById(id: number) {
  const rows = await listProductMarks({ includeHidden: true })
  return rows.find((row) => row.id === id) ?? null
}

export async function getProductBrandById(id: number) {
  const rows = await listProductBrands({ includeHidden: true })
  return rows.find((row) => row.id === id) ?? null
}

export async function getProductFilterGroupById(id: number) {
  const rows = await listProductFilterGroups({ includeHidden: true })
  return rows.find((row) => row.id === id) ?? null
}

export async function getProductShowcaseById(id: number) {
  const rows = await listProductShowcases({ includeHidden: true })
  return rows.find((row) => row.id === id) ?? null
}

export async function createProductMark(input: CreateProductMarkInput) {
  await ensureProductOperationsSchema()
  const res = await pool.query<{ id: number }>(
    `INSERT INTO product_marks
       (slug, title_zh, title_en, description_zh, description_en, color, sort_order, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.slug,
      input.title_zh,
      input.title_en,
      input.description_zh ?? null,
      input.description_en ?? null,
      input.color ?? null,
      input.sort_order ?? 100,
      input.status ?? 'visible',
    ],
  )
  const created = await getProductMarkById(res.rows[0].id)
  if (!created) throw new Error('Created product mark not found')
  return created
}

export async function updateProductMark(id: number, input: UpdateProductMarkInput) {
  await ensureProductOperationsSchema()
  const fields: [keyof UpdateProductMarkInput, string][] = [
    ['slug', 'slug'],
    ['title_zh', 'title_zh'],
    ['title_en', 'title_en'],
    ['description_zh', 'description_zh'],
    ['description_en', 'description_en'],
    ['color', 'color'],
    ['sort_order', 'sort_order'],
    ['status', 'status'],
  ]
  const params: unknown[] = [id]
  const sets: string[] = []
  for (const [key, col] of fields) {
    if (key in input) {
      params.push(input[key])
      sets.push(`${col} = $${params.length}`)
    }
  }
  if (sets.length === 0) return getProductMarkById(id)
  sets.push('updated_at = NOW()')
  const res = await pool.query<{ id: number }>(
    `UPDATE product_marks SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    params,
  )
  return res.rows[0]?.id ? getProductMarkById(res.rows[0].id) : null
}

export async function createProductBrand(input: CreateProductBrandInput) {
  await ensureProductOperationsSchema()
  const res = await pool.query<{ id: number }>(
    `INSERT INTO product_brands
       (slug, title_zh, title_en, description_zh, description_en, logo_url, sort_order, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.slug,
      input.title_zh,
      input.title_en,
      input.description_zh ?? null,
      input.description_en ?? null,
      input.logo_url ?? null,
      input.sort_order ?? 100,
      input.status ?? 'visible',
    ],
  )
  const created = await getProductBrandById(res.rows[0].id)
  if (!created) throw new Error('Created product brand not found')
  return created
}

export async function updateProductBrand(id: number, input: UpdateProductBrandInput) {
  await ensureProductOperationsSchema()
  const fields: [keyof UpdateProductBrandInput, string][] = [
    ['slug', 'slug'],
    ['title_zh', 'title_zh'],
    ['title_en', 'title_en'],
    ['description_zh', 'description_zh'],
    ['description_en', 'description_en'],
    ['logo_url', 'logo_url'],
    ['sort_order', 'sort_order'],
    ['status', 'status'],
  ]
  const params: unknown[] = [id]
  const sets: string[] = []
  for (const [key, col] of fields) {
    if (key in input) {
      params.push(input[key])
      sets.push(`${col} = $${params.length}`)
    }
  }
  if (sets.length === 0) return getProductBrandById(id)
  sets.push('updated_at = NOW()')
  const res = await pool.query<{ id: number }>(
    `UPDATE product_brands SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    params,
  )
  return res.rows[0]?.id ? getProductBrandById(res.rows[0].id) : null
}

async function replaceFilterGroupTemplates(groupId: number, templateIds: number[]) {
  const ids = uniqueIntIds(templateIds, 50)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM product_filter_group_templates WHERE group_id = $1`, [groupId])
    if (ids.length > 0) {
      await client.query(
        `INSERT INTO product_filter_group_templates (group_id, template_id, sort_order)
         SELECT $1, t.id, ROW_NUMBER() OVER (ORDER BY t.sort_order ASC, t.id ASC) * 10
         FROM product_attribute_templates t
         WHERE t.id = ANY($2::int[])
           AND t.deleted_at IS NULL
         ON CONFLICT (group_id, template_id) DO NOTHING`,
        [groupId, ids],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function createProductFilterGroup(input: CreateProductFilterGroupInput) {
  await ensureProductOperationsSchema()
  const res = await pool.query<{ id: number }>(
    `INSERT INTO product_filter_groups
       (slug, title_zh, title_en, description_zh, description_en, scope, sort_order, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.slug,
      input.title_zh,
      input.title_en,
      input.description_zh ?? null,
      input.description_en ?? null,
      input.scope ?? 'all',
      input.sort_order ?? 100,
      input.status ?? 'visible',
    ],
  )
  await replaceFilterGroupTemplates(res.rows[0].id, input.attribute_template_ids ?? [])
  const created = await getProductFilterGroupById(res.rows[0].id)
  if (!created) throw new Error('Created product filter group not found')
  return created
}

export async function updateProductFilterGroup(id: number, input: UpdateProductFilterGroupInput) {
  await ensureProductOperationsSchema()
  const fields: [keyof UpdateProductFilterGroupInput, string][] = [
    ['slug', 'slug'],
    ['title_zh', 'title_zh'],
    ['title_en', 'title_en'],
    ['description_zh', 'description_zh'],
    ['description_en', 'description_en'],
    ['scope', 'scope'],
    ['sort_order', 'sort_order'],
    ['status', 'status'],
  ]
  const params: unknown[] = [id]
  const sets: string[] = []
  for (const [key, col] of fields) {
    if (key in input) {
      params.push(input[key])
      sets.push(`${col} = $${params.length}`)
    }
  }
  if (sets.length > 0) {
    sets.push('updated_at = NOW()')
    const res = await pool.query<{ id: number }>(
      `UPDATE product_filter_groups SET ${sets.join(', ')}
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      params,
    )
    if (!res.rows[0]) return null
  }
  if ('attribute_template_ids' in input) {
    await replaceFilterGroupTemplates(id, input.attribute_template_ids ?? [])
  }
  return getProductFilterGroupById(id)
}

async function replaceShowcaseItems(showcaseId: number, productIds: string[]) {
  const ids = uniqueTextIds(productIds, 100)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM product_showcase_items WHERE showcase_id = $1`, [showcaseId])
    if (ids.length > 0) {
      await client.query(
        `INSERT INTO product_showcase_items (showcase_id, product_id, sort_order)
         SELECT $1, pc.id, ROW_NUMBER() OVER (ORDER BY pc.sort_order ASC, pc.updated_at DESC, pc.id ASC) * 10
         FROM product_catalog pc
         WHERE pc.id = ANY($2::text[])
           AND pc.deleted_at IS NULL
         ON CONFLICT (showcase_id, product_id) DO NOTHING`,
        [showcaseId, ids],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function createProductShowcase(input: CreateProductShowcaseInput) {
  await ensureProductOperationsSchema()
  const res = await pool.query<{ id: number }>(
    `INSERT INTO product_showcases
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
  await replaceShowcaseItems(res.rows[0].id, input.product_ids ?? [])
  const created = await getProductShowcaseById(res.rows[0].id)
  if (!created) throw new Error('Created product showcase not found')
  return created
}

export async function updateProductShowcase(id: number, input: UpdateProductShowcaseInput) {
  await ensureProductOperationsSchema()
  const fields: [keyof UpdateProductShowcaseInput, string][] = [
    ['slug', 'slug'],
    ['title_zh', 'title_zh'],
    ['title_en', 'title_en'],
    ['description_zh', 'description_zh'],
    ['description_en', 'description_en'],
    ['sort_order', 'sort_order'],
    ['status', 'status'],
  ]
  const params: unknown[] = [id]
  const sets: string[] = []
  for (const [key, col] of fields) {
    if (key in input) {
      params.push(input[key])
      sets.push(`${col} = $${params.length}`)
    }
  }
  if (sets.length > 0) {
    sets.push('updated_at = NOW()')
    const res = await pool.query<{ id: number }>(
      `UPDATE product_showcases SET ${sets.join(', ')}
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      params,
    )
    if (!res.rows[0]) return null
  }
  if ('product_ids' in input) {
    await replaceShowcaseItems(id, input.product_ids ?? [])
  }
  return getProductShowcaseById(id)
}

export async function getProductOperationAssignments(productId: string): Promise<ProductOperationAssignments> {
  await ensureProductOperationsSchema()
  const [brandRes, markRes, showcaseRes] = await Promise.all([
    pool.query<{ brand_id: number | null }>(
      `SELECT brand_id FROM product_catalog WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [productId],
    ),
    pool.query<{ mark_id: number }>(
      `SELECT mv.mark_id
       FROM product_mark_values mv
       JOIN product_marks m
         ON m.id = mv.mark_id
        AND m.deleted_at IS NULL
       WHERE mv.product_id = $1
       ORDER BY m.sort_order ASC, m.id ASC`,
      [productId],
    ),
    pool.query<{ showcase_id: number }>(
      `SELECT si.showcase_id
       FROM product_showcase_items si
       JOIN product_showcases s
         ON s.id = si.showcase_id
        AND s.deleted_at IS NULL
       WHERE si.product_id = $1
       ORDER BY s.sort_order ASC, s.id ASC`,
      [productId],
    ),
  ])

  return {
    brand_id: brandRes.rows[0]?.brand_id ?? null,
    mark_ids: markRes.rows.map((row) => row.mark_id),
    showcase_ids: showcaseRes.rows.map((row) => row.showcase_id),
  }
}

async function setProductBrand(productId: string, brandId: number | null) {
  await pool.query(
    `UPDATE product_catalog
       SET brand_id = $2,
           updated_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL`,
    [productId, brandId],
  )
}

async function replaceProductMarks(productId: string, markIds: number[]) {
  const ids = uniqueIntIds(markIds, 80)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM product_mark_values WHERE product_id = $1`, [productId])
    if (ids.length > 0) {
      await client.query(
        `INSERT INTO product_mark_values (product_id, mark_id)
         SELECT $1, m.id
         FROM product_marks m
         WHERE m.id = ANY($2::int[])
           AND m.deleted_at IS NULL
         ON CONFLICT (product_id, mark_id) DO NOTHING`,
        [productId, ids],
      )
    }
    await client.query(`UPDATE product_catalog SET updated_at = NOW() WHERE id = $1`, [productId])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

async function replaceProductShowcases(productId: string, showcaseIds: number[]) {
  const ids = uniqueIntIds(showcaseIds, 80)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM product_showcase_items WHERE product_id = $1`, [productId])
    if (ids.length > 0) {
      await client.query(
        `INSERT INTO product_showcase_items (showcase_id, product_id)
         SELECT s.id, $1
         FROM product_showcases s
         WHERE s.id = ANY($2::int[])
           AND s.deleted_at IS NULL
         ON CONFLICT (showcase_id, product_id) DO NOTHING`,
        [productId, ids],
      )
    }
    await client.query(`UPDATE product_catalog SET updated_at = NOW() WHERE id = $1`, [productId])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateProductOperationAssignments(
  productId: string,
  input: Partial<ProductOperationAssignments>,
) {
  await ensureProductOperationsSchema()
  if ('brand_id' in input) {
    await setProductBrand(productId, input.brand_id ?? null)
  }
  if ('mark_ids' in input) {
    await replaceProductMarks(productId, input.mark_ids ?? [])
  }
  if ('showcase_ids' in input) {
    await replaceProductShowcases(productId, input.showcase_ids ?? [])
  }
  return getProductOperationAssignments(productId)
}

export async function bulkAddProductMark(ids: string[], markId: number) {
  await ensureProductOperationsSchema()
  const uniqueIds = uniqueTextIds(ids, 100)
  if (uniqueIds.length === 0) return { updatedIds: [], updatedCount: 0 }

  const res = await pool.query<{ product_id: string }>(
    `INSERT INTO product_mark_values (product_id, mark_id)
     SELECT pc.id, m.id
     FROM product_catalog pc
     JOIN product_marks m
       ON m.id = $1
      AND m.deleted_at IS NULL
     WHERE pc.id = ANY($2::text[])
       AND pc.deleted_at IS NULL
     ON CONFLICT (product_id, mark_id) DO NOTHING
     RETURNING product_id`,
    [markId, uniqueIds],
  )

  const updatedIds = res.rows.map((row) => row.product_id)
  if (updatedIds.length > 0) {
    await pool.query(
      `UPDATE product_catalog
         SET updated_at = NOW()
       WHERE id = ANY($1::text[])`,
      [updatedIds],
    )
  }

  return { updatedIds, updatedCount: updatedIds.length }
}

export async function bulkAddProductsToShowcase(ids: string[], showcaseId: number) {
  await ensureProductOperationsSchema()
  const uniqueIds = uniqueTextIds(ids, 100)
  if (uniqueIds.length === 0) return { updatedIds: [], updatedCount: 0 }

  const res = await pool.query<{ product_id: string }>(
    `INSERT INTO product_showcase_items (showcase_id, product_id)
     SELECT s.id, pc.id
     FROM product_catalog pc
     JOIN product_showcases s
       ON s.id = $1
      AND s.deleted_at IS NULL
     WHERE pc.id = ANY($2::text[])
       AND pc.deleted_at IS NULL
     ON CONFLICT (showcase_id, product_id) DO NOTHING
     RETURNING product_id`,
    [showcaseId, uniqueIds],
  )

  const updatedIds = res.rows.map((row) => row.product_id)
  if (updatedIds.length > 0) {
    await pool.query(
      `UPDATE product_catalog
         SET updated_at = NOW()
       WHERE id = ANY($1::text[])`,
      [updatedIds],
    )
  }

  return { updatedIds, updatedCount: updatedIds.length }
}
