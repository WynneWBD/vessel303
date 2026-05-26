import { pool } from '@/lib/db'
import {
  catalogProducts,
  type CatalogProduct,
  type CatalogDetailModule,
  type CatalogSpecItem,
  type ProductSeriesCode,
} from '@/lib/products'

export type CatalogProductStatus = 'draft' | 'published'
export type CatalogProductType = CatalogProduct['productType']
export type ProductCategoryStatus = 'visible' | 'hidden'

export type ProductCategoryRow = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  description_zh: string | null
  description_en: string | null
  sort_order: number
  status: ProductCategoryStatus
  created_at: string
  updated_at: string
  product_count?: number
}

export type CatalogProductRow = CatalogProduct & {
  category_id: number | null
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  status: CatalogProductStatus
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ListCatalogProductsFilter = {
  status?: CatalogProductStatus
  series?: ProductSeriesCode
  categoryId?: number
  search?: string
  limit: number
  offset: number
}

export type CatalogProductInput = {
  id: string
  productSeries: ProductSeriesCode
  name_cn: string
  name_en: string
  gen: string
  size: string
  area: number
  generation: 5 | 6
  productType: CatalogProductType
  badge_cn: string
  badge_en: string
  tags_cn: string[]
  tags_en: string[]
  features_cn: string[]
  features_en: string[]
  image: string
  description_cn?: string
  description_en?: string
  gallery?: string[]
  specs_cn?: CatalogSpecItem[]
  specs_en?: CatalogSpecItem[]
  detail_modules?: CatalogDetailModule[]
  isCustom: boolean
  detailSlug?: string | null
  category_id?: number | null
  seo_title_zh?: string | null
  seo_title_en?: string | null
  seo_description_zh?: string | null
  seo_description_en?: string | null
  status?: CatalogProductStatus
  sort_order?: number
}

export type CreateProductCategoryInput = {
  slug: string
  title_zh: string
  title_en: string
  description_zh?: string | null
  description_en?: string | null
  sort_order?: number
  status?: ProductCategoryStatus
}

export type UpdateProductCategoryInput = Partial<CreateProductCategoryInput>

const RESERVED_IDS = new Set(['e7', 'e6', 'e3', 'v9', 'v5', 's5', 'e7-gen5', 'v9-gen6'])

let schemaReady: Promise<void> | null = null

function rowToCatalogProduct(row: {
  id: string
  product_series: string
  name_cn: string
  name_en: string
  gen: string
  size: string
  area: string | number
  generation: number
  product_type: string
  badge_cn: string
  badge_en: string
  tags_cn: string[]
  tags_en: string[]
  features_cn: string[]
  features_en: string[]
  image: string
  description_cn: string | null
  description_en: string | null
  gallery: string[]
  specs_cn: CatalogSpecItem[]
  specs_en: CatalogSpecItem[]
  detail_modules: CatalogDetailModule[]
  is_custom: boolean
  detail_slug: string | null
  category_id: number | null
  category_slug?: string | null
  category_title_zh?: string | null
  category_title_en?: string | null
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  status: CatalogProductStatus
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}): CatalogProductRow {
  return {
    id: row.id,
    productSeries: row.product_series as ProductSeriesCode,
    name_cn: row.name_cn,
    name_en: row.name_en,
    gen: row.gen,
    size: row.size,
    area: Number(row.area),
    generation: row.generation === 5 ? 5 : 6,
    productType: row.product_type as CatalogProductType,
    badge_cn: row.badge_cn,
    badge_en: row.badge_en,
    tags_cn: row.tags_cn ?? [],
    tags_en: row.tags_en ?? [],
    features_cn: row.features_cn ?? [],
    features_en: row.features_en ?? [],
    image: row.image,
    description_cn: row.description_cn ?? '',
    description_en: row.description_en ?? '',
    gallery: row.gallery ?? [],
    specs_cn: row.specs_cn ?? [],
    specs_en: row.specs_en ?? [],
    detail_modules: row.detail_modules ?? [],
    isCustom: row.is_custom,
    detailSlug: row.detail_slug ?? undefined,
    category_id: row.category_id ?? null,
    category_slug: row.category_slug ?? null,
    category_title_zh: row.category_title_zh ?? null,
    category_title_en: row.category_title_en ?? null,
    seo_title_zh: row.seo_title_zh ?? null,
    seo_title_en: row.seo_title_en ?? null,
    seo_description_zh: row.seo_description_zh ?? null,
    seo_description_en: row.seo_description_en ?? null,
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

const COLUMNS = `
  id, product_series, name_cn, name_en, gen, size, area, generation,
  product_type, badge_cn, badge_en, tags_cn, tags_en, features_cn, features_en,
  image, description_cn, description_en, gallery, specs_cn, specs_en,
  detail_modules, is_custom, detail_slug, category_id,
  seo_title_zh, seo_title_en, seo_description_zh, seo_description_en,
  status, sort_order,
  created_at::text AS created_at,
  updated_at::text AS updated_at,
  deleted_at::text AS deleted_at
`

const DEFAULT_PRODUCT_CATEGORIES: CreateProductCategoryInput[] = [
  {
    slug: 'standard-products',
    title_zh: '标准产品',
    title_en: 'Standard Products',
    description_zh: '用于官网正式销售和展示的标准型号。',
    description_en: 'Standard product models for official website display.',
    sort_order: 10,
  },
  {
    slug: 'custom-solutions',
    title_zh: '定制产品',
    title_en: 'Custom Solutions',
    description_zh: '根据项目场景定制外观、内装或系统配置的产品。',
    description_en: 'Products customized by exterior, interior or system configuration.',
    sort_order: 20,
  },
  {
    slug: 'overseas-custom',
    title_zh: '海外定制',
    title_en: 'Overseas Custom',
    description_zh: '面向海外法规、气候和交付方式适配的定制产品。',
    description_en: 'Custom products adapted for overseas codes, climates and delivery.',
    sort_order: 30,
  },
]

async function seedCatalogProductsIfEmpty() {
  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM product_catalog`,
  )
  if (parseInt(countRes.rows[0]?.count ?? '0', 10) > 0) return

  for (const [index, product] of catalogProducts.entries()) {
    await pool.query(
      `INSERT INTO product_catalog (
         id, product_series, name_cn, name_en, gen, size, area, generation,
         product_type, badge_cn, badge_en, tags_cn, tags_en, features_cn, features_en,
         image, description_cn, description_en, gallery, specs_cn, specs_en,
         detail_modules, is_custom, detail_slug, status, sort_order
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14, $15,
         $16, $17, $18, $19, $20, $21,
         $22, $23, $24, 'published', $25
       )
       ON CONFLICT (id) DO NOTHING`,
      [
        product.id,
        product.productSeries,
        product.name_cn,
        product.name_en,
        product.gen,
        product.size,
        product.area,
        product.generation,
        product.productType,
        product.badge_cn,
        product.badge_en,
        JSON.stringify(product.tags_cn),
        JSON.stringify(product.tags_en),
        JSON.stringify(product.features_cn),
        JSON.stringify(product.features_en),
        product.image,
        product.description_cn ?? '',
        product.description_en ?? '',
        JSON.stringify(product.gallery ?? []),
        JSON.stringify(product.specs_cn ?? []),
        JSON.stringify(product.specs_en ?? []),
        JSON.stringify(product.detail_modules ?? []),
        product.isCustom,
        product.detailSlug ?? null,
        index + 1,
      ],
    )
  }
}

async function seedProductCategoriesIfEmpty() {
  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM product_categories WHERE deleted_at IS NULL`,
  )
  if (parseInt(countRes.rows[0]?.count ?? '0', 10) > 0) return

  for (const category of DEFAULT_PRODUCT_CATEGORIES) {
    await pool.query(
      `INSERT INTO product_categories
         (slug, title_zh, title_en, description_zh, description_en, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'visible')
       ON CONFLICT (slug) DO NOTHING`,
      [
        category.slug,
        category.title_zh,
        category.title_en,
        category.description_zh ?? null,
        category.description_en ?? null,
        category.sort_order ?? 100,
      ],
    )
  }
}

export async function ensureProductCatalogSchema() {
  schemaReady ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
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
      CREATE TABLE IF NOT EXISTS product_catalog (
        id             TEXT        PRIMARY KEY,
        product_series TEXT        NOT NULL,
        name_cn        TEXT        NOT NULL,
        name_en        TEXT        NOT NULL,
        gen            TEXT        NOT NULL,
        size           TEXT        NOT NULL,
        area           NUMERIC     NOT NULL DEFAULT 0,
        generation     INTEGER     NOT NULL DEFAULT 6,
        product_type   TEXT        NOT NULL DEFAULT 'standard',
        badge_cn       TEXT        NOT NULL DEFAULT '',
        badge_en       TEXT        NOT NULL DEFAULT '',
        tags_cn        JSONB       NOT NULL DEFAULT '[]',
        tags_en        JSONB       NOT NULL DEFAULT '[]',
        features_cn    JSONB       NOT NULL DEFAULT '[]',
        features_en    JSONB       NOT NULL DEFAULT '[]',
        image          TEXT        NOT NULL,
        description_cn TEXT        NOT NULL DEFAULT '',
        description_en TEXT        NOT NULL DEFAULT '',
        gallery        JSONB       NOT NULL DEFAULT '[]',
        specs_cn       JSONB       NOT NULL DEFAULT '[]',
        specs_en       JSONB       NOT NULL DEFAULT '[]',
        detail_modules JSONB       NOT NULL DEFAULT '[]',
        is_custom      BOOLEAN     NOT NULL DEFAULT FALSE,
        detail_slug    TEXT,
        category_id    INTEGER,
        seo_title_zh   VARCHAR(160),
        seo_title_en   VARCHAR(160),
        seo_description_zh VARCHAR(300),
        seo_description_en VARCHAR(300),
        status         TEXT        NOT NULL DEFAULT 'draft',
        sort_order     INTEGER     NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at     TIMESTAMPTZ
      )
    `)
    await pool.query(`
      ALTER TABLE product_catalog
        ADD COLUMN IF NOT EXISTS description_cn TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS description_en TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS specs_cn JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS specs_en JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS detail_modules JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS category_id INTEGER,
        ADD COLUMN IF NOT EXISTS seo_title_zh VARCHAR(160),
        ADD COLUMN IF NOT EXISTS seo_title_en VARCHAR(160),
        ADD COLUMN IF NOT EXISTS seo_description_zh VARCHAR(300),
        ADD COLUMN IF NOT EXISTS seo_description_en VARCHAR(300)
    `)
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_product_categories_status_sort
       ON product_categories (status, sort_order)
       WHERE deleted_at IS NULL`,
    )
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_product_catalog_public
       ON product_catalog (status, sort_order)
       WHERE deleted_at IS NULL`,
    )
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_product_catalog_detail_slug
       ON product_catalog (detail_slug)
       WHERE deleted_at IS NULL AND detail_slug IS NOT NULL`,
    )
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_product_catalog_category_id
       ON product_catalog (category_id)
       WHERE deleted_at IS NULL`,
    )
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_catalog_category'
        ) THEN
          ALTER TABLE product_catalog
          ADD CONSTRAINT fk_product_catalog_category
          FOREIGN KEY (category_id)
          REFERENCES product_categories(id)
          ON DELETE SET NULL;
        END IF;
      END $$;
    `)
    await seedProductCategoriesIfEmpty()
    await seedCatalogProductsIfEmpty()
  })()

  return schemaReady
}

function buildWhere(filter: Partial<ListCatalogProductsFilter>, publicOnly = false) {
  const conds = ['deleted_at IS NULL']
  const params: unknown[] = []

  if (publicOnly) {
    conds.push(`status = 'published'`)
  } else if (filter.status) {
    params.push(filter.status)
    conds.push(`status = $${params.length}`)
  }

  if (filter.series) {
    params.push(filter.series)
    conds.push(`product_series = $${params.length}`)
  }

  if (filter.categoryId) {
    params.push(filter.categoryId)
    conds.push(`category_id = $${params.length}`)
  }

  if (filter.search) {
    params.push(`%${filter.search}%`)
    const i = params.length
    conds.push(`(id ILIKE $${i} OR name_cn ILIKE $${i} OR name_en ILIKE $${i} OR COALESCE(detail_slug, '') ILIKE $${i})`)
  }

  return { where: `WHERE ${conds.join(' AND ')}`, params }
}

export async function listPublishedCatalogProducts(): Promise<CatalogProduct[]> {
  await ensureProductCatalogSchema()
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM product_catalog
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY sort_order ASC, updated_at DESC`,
  )
  return rows.map(rowToCatalogProduct)
}

export async function getPublicCatalogProductById(id: string): Promise<CatalogProduct | null> {
  await ensureProductCatalogSchema()
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM product_catalog
     WHERE id = $1 AND status = 'published' AND deleted_at IS NULL`,
    [id],
  )
  return rows[0] ? rowToCatalogProduct(rows[0]) : null
}

export async function getPublicCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  await ensureProductCatalogSchema()
  const allowDetailSlug = !isReservedProductId(slug)
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM product_catalog
     WHERE status = 'published'
       AND deleted_at IS NULL
       AND (id = $1 OR ($2::boolean AND detail_slug = $1))
     ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END, sort_order ASC, updated_at DESC
     LIMIT 1`,
    [slug, allowDetailSlug],
  )
  return rows[0] ? rowToCatalogProduct(rows[0]) : null
}

export async function listCatalogProducts(filter: ListCatalogProductsFilter) {
  await ensureProductCatalogSchema()
  const { where, params } = buildWhere(filter)
  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM product_catalog ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const listRes = await pool.query(
    `SELECT ${COLUMNS} FROM product_catalog ${where}
     ORDER BY sort_order ASC, updated_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, filter.limit, filter.offset],
  )

  return { rows: listRes.rows.map(rowToCatalogProduct), total }
}

export async function getCatalogProductById(id: string) {
  await ensureProductCatalogSchema()
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM product_catalog WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  )
  return rows[0] ? rowToCatalogProduct(rows[0]) : null
}

export async function isCatalogProductIdTaken(id: string, exceptId?: string) {
  await ensureProductCatalogSchema()
  const params: unknown[] = [id]
  let extra = ''
  if (exceptId) {
    params.push(exceptId)
    extra = ` AND id <> $${params.length}`
  }
  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM product_catalog WHERE id = $1 AND deleted_at IS NULL${extra}
     ) AS exists`,
    params,
  )
  return !!res.rows[0]?.exists
}

export async function isCatalogProductUrlSlugTaken(slug: string, exceptId?: string) {
  await ensureProductCatalogSchema()
  const params: unknown[] = [slug]
  let extra = ''
  if (exceptId) {
    params.push(exceptId)
    extra = ` AND id <> $${params.length}`
  }
  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1
       FROM product_catalog
       WHERE deleted_at IS NULL
         AND (id = $1 OR detail_slug = $1)
         ${extra}
     ) AS exists`,
    params,
  )
  return !!res.rows[0]?.exists
}

export function isReservedProductId(id: string) {
  return RESERVED_IDS.has(id)
}

export async function createCatalogProduct(input: CatalogProductInput) {
  await ensureProductCatalogSchema()
  const res = await pool.query(
    `INSERT INTO product_catalog (
       id, product_series, name_cn, name_en, gen, size, area, generation,
       product_type, badge_cn, badge_en, tags_cn, tags_en, features_cn, features_en,
       image, description_cn, description_en, gallery, specs_cn, specs_en,
       detail_modules, is_custom, detail_slug, category_id,
       seo_title_zh, seo_title_en, seo_description_zh, seo_description_en,
       status, sort_order
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       $9, $10, $11, $12, $13, $14, $15,
       $16, $17, $18, $19, $20, $21,
       $22, $23, $24, $25,
       $26, $27, $28, $29,
       $30, $31
     )
     RETURNING ${COLUMNS}`,
    [
      input.id,
      input.productSeries,
      input.name_cn,
      input.name_en,
      input.gen,
      input.size,
      input.area,
      input.generation,
      input.productType,
      input.badge_cn,
      input.badge_en,
      JSON.stringify(input.tags_cn),
      JSON.stringify(input.tags_en),
      JSON.stringify(input.features_cn),
      JSON.stringify(input.features_en),
      input.image,
      input.description_cn ?? '',
      input.description_en ?? '',
      JSON.stringify(input.gallery ?? []),
      JSON.stringify(input.specs_cn ?? []),
      JSON.stringify(input.specs_en ?? []),
      JSON.stringify(input.detail_modules ?? []),
      input.isCustom,
      input.detailSlug || null,
      input.category_id ?? null,
      input.seo_title_zh ?? null,
      input.seo_title_en ?? null,
      input.seo_description_zh ?? null,
      input.seo_description_en ?? null,
      input.status ?? 'draft',
      input.sort_order ?? 999,
    ],
  )
  return rowToCatalogProduct(res.rows[0])
}

export type UpdateCatalogProductInput = Partial<CatalogProductInput>

export async function updateCatalogProduct(id: string, input: UpdateCatalogProductInput) {
  await ensureProductCatalogSchema()
  const fields: [keyof UpdateCatalogProductInput, string, (v: unknown) => unknown][] = [
    ['productSeries', 'product_series', (v) => v],
    ['name_cn', 'name_cn', (v) => v],
    ['name_en', 'name_en', (v) => v],
    ['gen', 'gen', (v) => v],
    ['size', 'size', (v) => v],
    ['area', 'area', (v) => v],
    ['generation', 'generation', (v) => v],
    ['productType', 'product_type', (v) => v],
    ['badge_cn', 'badge_cn', (v) => v],
    ['badge_en', 'badge_en', (v) => v],
    ['tags_cn', 'tags_cn', (v) => JSON.stringify(v)],
    ['tags_en', 'tags_en', (v) => JSON.stringify(v)],
    ['features_cn', 'features_cn', (v) => JSON.stringify(v)],
    ['features_en', 'features_en', (v) => JSON.stringify(v)],
    ['image', 'image', (v) => v],
    ['description_cn', 'description_cn', (v) => v ?? ''],
    ['description_en', 'description_en', (v) => v ?? ''],
    ['gallery', 'gallery', (v) => JSON.stringify(v ?? [])],
    ['specs_cn', 'specs_cn', (v) => JSON.stringify(v ?? [])],
    ['specs_en', 'specs_en', (v) => JSON.stringify(v ?? [])],
    ['detail_modules', 'detail_modules', (v) => JSON.stringify(v ?? [])],
    ['isCustom', 'is_custom', (v) => v],
    ['detailSlug', 'detail_slug', (v) => v || null],
    ['category_id', 'category_id', (v) => v ?? null],
    ['seo_title_zh', 'seo_title_zh', (v) => v || null],
    ['seo_title_en', 'seo_title_en', (v) => v || null],
    ['seo_description_zh', 'seo_description_zh', (v) => v || null],
    ['seo_description_en', 'seo_description_en', (v) => v || null],
    ['status', 'status', (v) => v],
    ['sort_order', 'sort_order', (v) => v],
  ]

  const sets: string[] = []
  const params: unknown[] = [id]

  for (const [key, col, normalize] of fields) {
    if (key in input) {
      params.push(normalize(input[key]))
      sets.push(`${col} = $${params.length}`)
    }
  }

  if (sets.length === 0) return getCatalogProductById(id)
  sets.push('updated_at = NOW()')

  const res = await pool.query(
    `UPDATE product_catalog
       SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${COLUMNS}`,
    params,
  )
  return res.rows[0] ? rowToCatalogProduct(res.rows[0]) : null
}

export async function softDeleteCatalogProduct(id: string) {
  await ensureProductCatalogSchema()
  const res = await pool.query<{ id: string }>(
    `UPDATE product_catalog
       SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id],
  )
  return res.rows[0]?.id ?? null
}

export async function restoreCatalogProductAsDraft(id: string) {
  await ensureProductCatalogSchema()
  const res = await pool.query(
    `UPDATE product_catalog
       SET deleted_at = NULL,
           status = 'draft',
           updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NOT NULL
     RETURNING ${COLUMNS}`,
    [id],
  )
  return res.rows[0] ? rowToCatalogProduct(res.rows[0]) : null
}

export async function listDeletedCatalogProducts({
  search,
  limit,
  offset,
}: {
  search?: string
  limit: number
  offset: number
}) {
  await ensureProductCatalogSchema()
  const conditions = ['pc.deleted_at IS NOT NULL']
  const params: unknown[] = []

  if (search) {
    params.push(`%${search}%`)
    conditions.push(`(
      pc.id ILIKE $${params.length}
      OR pc.name_cn ILIKE $${params.length}
      OR pc.name_en ILIKE $${params.length}
      OR COALESCE(pc.detail_slug, '') ILIKE $${params.length}
    )`)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM product_catalog pc ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)
  const listRes = await pool.query(
    `SELECT
       pc.id, pc.product_series, pc.name_cn, pc.name_en, pc.gen, pc.size, pc.area, pc.generation,
       pc.product_type, pc.badge_cn, pc.badge_en,
       COALESCE(pc.tags_cn, '[]'::jsonb) AS tags_cn,
       COALESCE(pc.tags_en, '[]'::jsonb) AS tags_en,
       COALESCE(pc.features_cn, '[]'::jsonb) AS features_cn,
       COALESCE(pc.features_en, '[]'::jsonb) AS features_en,
       pc.image, pc.description_cn, pc.description_en,
       COALESCE(pc.gallery, '[]'::jsonb) AS gallery,
       COALESCE(pc.specs_cn, '[]'::jsonb) AS specs_cn,
       COALESCE(pc.specs_en, '[]'::jsonb) AS specs_en,
       COALESCE(pc.detail_modules, '[]'::jsonb) AS detail_modules,
       pc.is_custom, pc.detail_slug, pc.category_id,
       c.slug AS category_slug,
       c.title_zh AS category_title_zh,
       c.title_en AS category_title_en,
       pc.seo_title_zh, pc.seo_title_en, pc.seo_description_zh, pc.seo_description_en,
       pc.status, pc.sort_order,
       pc.created_at::text AS created_at,
       pc.updated_at::text AS updated_at,
       pc.deleted_at::text AS deleted_at
     FROM product_catalog pc
     LEFT JOIN product_categories c
       ON c.id = pc.category_id
      AND c.deleted_at IS NULL
     ${where}
     ORDER BY pc.deleted_at DESC, pc.updated_at DESC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  )

  return { rows: listRes.rows.map(rowToCatalogProduct), total }
}

export async function countDeletedCatalogProducts() {
  await ensureProductCatalogSchema()
  const res = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM product_catalog
     WHERE deleted_at IS NOT NULL`,
  )
  return parseInt(res.rows[0]?.total ?? '0', 10)
}

export async function bulkUpdateProductCategory(ids: string[], categoryId: number) {
  await ensureProductCatalogSchema()
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).slice(0, 100)
  if (uniqueIds.length === 0) return { updatedIds: [], updatedCount: 0 }

  const res = await pool.query<{ id: string }>(
    `UPDATE product_catalog
       SET category_id = $1,
           updated_at = NOW()
     WHERE id = ANY($2::text[])
       AND deleted_at IS NULL
     RETURNING id`,
    [categoryId, uniqueIds],
  )

  return {
    updatedIds: res.rows.map((row) => row.id),
    updatedCount: res.rowCount ?? res.rows.length,
  }
}

export async function listProductCategories({
  includeHidden = false,
}: {
  includeHidden?: boolean
} = {}) {
  await ensureProductCatalogSchema()
  const conds = ['c.deleted_at IS NULL']
  if (!includeHidden) conds.push(`c.status = 'visible'`)

  type ProductCategoryQueryRow = Omit<ProductCategoryRow, 'product_count'> & { product_count: string }

  const res = await pool.query<ProductCategoryQueryRow>(
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
       COUNT(pc.id)::text AS product_count
     FROM product_categories c
     LEFT JOIN product_catalog pc
       ON pc.category_id = c.id
      AND pc.deleted_at IS NULL
     WHERE ${conds.join(' AND ')}
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.id ASC`,
  )

  return res.rows.map((row) => ({
    ...row,
    product_count: parseInt(String(row.product_count ?? '0'), 10),
  }))
}

export async function getProductCategoryById(id: number, { visibleOnly = false } = {}) {
  await ensureProductCatalogSchema()
  const conds = ['id = $1', 'deleted_at IS NULL']
  if (visibleOnly) conds.push(`status = 'visible'`)

  const res = await pool.query<ProductCategoryRow>(
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
     FROM product_categories
     WHERE ${conds.join(' AND ')}
     LIMIT 1`,
    [id],
  )

  return res.rows[0] ?? null
}

export async function isProductCategorySlugTaken(slug: string, excludeId?: number) {
  await ensureProductCatalogSchema()
  const params: unknown[] = [slug]
  let extra = ''
  if (excludeId != null) {
    params.push(excludeId)
    extra = `AND id != $${params.length}`
  }

  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM product_categories WHERE slug = $1 AND deleted_at IS NULL ${extra}
     ) AS exists`,
    params,
  )
  return res.rows[0]?.exists ?? false
}

export async function createProductCategory(input: CreateProductCategoryInput) {
  await ensureProductCatalogSchema()
  const res = await pool.query<{ id: number }>(
    `INSERT INTO product_categories
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

  const created = await getProductCategoryById(res.rows[0].id)
  if (!created) throw new Error('Created product category not found')
  return created
}

export async function updateProductCategory(id: number, input: UpdateProductCategoryInput) {
  await ensureProductCatalogSchema()
  const sets: string[] = []
  const params: unknown[] = [id]

  const fields: [keyof UpdateProductCategoryInput, string][] = [
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

  if (sets.length === 0) return getProductCategoryById(id)
  sets.push('updated_at = NOW()')

  const res = await pool.query<{ id: number }>(
    `UPDATE product_categories SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    params,
  )

  return res.rows[0]?.id ? getProductCategoryById(res.rows[0].id) : null
}

export async function countCatalogProductsByStatus() {
  await ensureProductCatalogSchema()
  const res = await pool.query<{ draft: string; published: string; total: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*)::text AS total
     FROM product_catalog
     WHERE deleted_at IS NULL`,
  )
  return {
    draft: parseInt(res.rows[0]?.draft ?? '0', 10),
    published: parseInt(res.rows[0]?.published ?? '0', 10),
    total: parseInt(res.rows[0]?.total ?? '0', 10),
  }
}
