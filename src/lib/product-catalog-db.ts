import { unstable_cache } from 'next/cache'
import { pool } from '@/lib/db'
import type {
  CatalogProduct,
  CatalogCommercialTerms,
  CatalogDetailModule,
  CatalogSpecItem,
  ProductSeriesCode,
} from '@/lib/products'

export type CatalogProductStatus = 'draft' | 'published'
export type CatalogProductType = CatalogProduct['productType']
export type ProductCategoryStatus = 'visible' | 'hidden'
export type ProductAttributeStatus = 'visible' | 'hidden'

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

export type ProductAttributeTemplateRow = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  description_zh: string | null
  description_en: string | null
  sort_order: number
  status: ProductAttributeStatus
  created_at: string
  updated_at: string
  option_count?: number
  product_count?: number
}

export type ProductAttributeOptionRow = {
  id: number
  template_id: number
  template_slug?: string
  template_title_zh?: string
  template_title_en?: string
  slug: string
  label_zh: string
  label_en: string
  sort_order: number
  status: ProductAttributeStatus
  created_at: string
  updated_at: string
  product_count?: number
}

export type ProductAttributeLabel = {
  template_slug: string
  template_title_zh: string
  template_title_en: string
  option_slug: string
  label_zh: string
  label_en: string
}

export type ProductAttributeTemplateWithOptions = ProductAttributeTemplateRow & {
  options: ProductAttributeOptionRow[]
}

export type CatalogProductRow = CatalogProduct & {
  category_id: number | null
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
  price_display_zh: string | null
  price_display_en: string | null
  commercial_terms: CatalogCommercialTerms | null
  keywords_zh: string[]
  keywords_en: string[]
  related_product_ids: string[]
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  status: CatalogProductStatus
  sort_order: number
  attribute_option_ids: number[]
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

export type ListPublishedCatalogProductsPageFilter = {
  search?: string
  categoryId?: number
  attributeOptionId?: number
  limit: number
  offset: number
}

export type ListPublishedCatalogProductsPageResult = {
  rows: CatalogProduct[]
  total: number
  allProductsCount: number
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
  price_display_zh?: string | null
  price_display_en?: string | null
  commercial_terms?: CatalogCommercialTerms | null
  keywords_zh?: string[]
  keywords_en?: string[]
  related_product_ids?: string[]
  seo_title_zh?: string | null
  seo_title_en?: string | null
  seo_description_zh?: string | null
  seo_description_en?: string | null
  status?: CatalogProductStatus
  sort_order?: number
  attribute_option_ids?: number[]
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

export type CreateProductAttributeTemplateInput = {
  slug: string
  title_zh: string
  title_en: string
  description_zh?: string | null
  description_en?: string | null
  sort_order?: number
  status?: ProductAttributeStatus
}

export type UpdateProductAttributeTemplateInput = Partial<CreateProductAttributeTemplateInput>

export type CreateProductAttributeOptionInput = {
  template_id: number
  slug: string
  label_zh: string
  label_en: string
  sort_order?: number
  status?: ProductAttributeStatus
}

export type UpdateProductAttributeOptionInput = Partial<Omit<CreateProductAttributeOptionInput, 'template_id'>>

const RESERVED_IDS = new Set(['e7', 'e6', 'e3', 'v9', 'v5', 's5', 'e7-gen5', 'v9-gen6'])
export const PRODUCT_PUBLIC_CACHE_TAG = 'product-public'
const PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS = 120

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
  price_display_zh?: string | null
  price_display_en?: string | null
  commercial_terms?: CatalogCommercialTerms | null
  keywords_zh?: string[] | null
  keywords_en?: string[] | null
  related_product_ids?: string[] | null
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  status: CatalogProductStatus
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  attribute_option_ids?: number[] | null
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
    price_display_zh: row.price_display_zh ?? null,
    price_display_en: row.price_display_en ?? null,
    commercial_terms: row.commercial_terms ?? null,
    keywords_zh: row.keywords_zh ?? [],
    keywords_en: row.keywords_en ?? [],
    related_product_ids: row.related_product_ids ?? [],
    seo_title_zh: row.seo_title_zh ?? null,
    seo_title_en: row.seo_title_en ?? null,
    seo_description_zh: row.seo_description_zh ?? null,
    seo_description_en: row.seo_description_en ?? null,
    status: row.status,
    sort_order: row.sort_order,
    attribute_option_ids: row.attribute_option_ids ?? [],
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
  price_display_zh, price_display_en, commercial_terms, keywords_zh, keywords_en,
  related_product_ids,
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

const DEFAULT_PRODUCT_ATTRIBUTE_TEMPLATES: (CreateProductAttributeTemplateInput & {
  options: Omit<CreateProductAttributeOptionInput, 'template_id'>[]
})[] = [
  {
    slug: 'application-scenario',
    title_zh: '应用场景',
    title_en: 'Application Scenario',
    description_zh: '用于区分度假营地、酒店民宿、商业展示等产品适用方向。',
    description_en: 'Classifies product-fit scenarios such as resorts, hospitality and commercial showcases.',
    sort_order: 10,
    options: [
      { slug: 'resort-camp', label_zh: '度假营地', label_en: 'Resort Camp', sort_order: 10 },
      { slug: 'hotel-hospitality', label_zh: '酒店民宿', label_en: 'Hotel & Hospitality', sort_order: 20 },
      { slug: 'commercial-showcase', label_zh: '商业展示', label_en: 'Commercial Showcase', sort_order: 30 },
      { slug: 'remote-deployment', label_zh: '远程部署', label_en: 'Remote Deployment', sort_order: 40 },
    ],
  },
  {
    slug: 'delivery-method',
    title_zh: '交付方式',
    title_en: 'Delivery Method',
    description_zh: '用于运营人员标记产品常见运输、安装和项目交付方式。',
    description_en: 'Marks common transport, installation and project delivery methods.',
    sort_order: 20,
    options: [
      { slug: 'flat-rack', label_zh: '平板柜运输', label_en: 'Flat-rack Transport', sort_order: 10 },
      { slug: 'containerized', label_zh: '集装箱运输', label_en: 'Containerized Transport', sort_order: 20 },
      { slug: 'modular-assembly', label_zh: '模块化组装', label_en: 'Modular Assembly', sort_order: 30 },
    ],
  },
  {
    slug: 'compliance-standard',
    title_zh: '认证 / 标准',
    title_en: 'Compliance Standard',
    description_zh: '用于标记产品资料中可确认的认证、规范或标准适配方向。',
    description_en: 'Tracks confirmed certification, code or compliance directions.',
    sort_order: 30,
    options: [
      { slug: 'eu-ready', label_zh: '欧盟方向', label_en: 'EU-ready', sort_order: 10 },
      { slug: 'us-ready', label_zh: '北美方向', label_en: 'US-ready', sort_order: 20 },
      { slug: 'project-specific', label_zh: '项目定制', label_en: 'Project-specific', sort_order: 30 },
    ],
  },
  {
    slug: 'climate-adaptation',
    title_zh: '环境适应',
    title_en: 'Climate Adaptation',
    description_zh: '用于标记高寒、高温、海滨、山地等环境适应方向。',
    description_en: 'Marks climate and site-adaptation directions such as cold, hot, coastal or mountain sites.',
    sort_order: 40,
    options: [
      { slug: 'cold-region', label_zh: '寒冷地区', label_en: 'Cold Region', sort_order: 10 },
      { slug: 'hot-region', label_zh: '高温地区', label_en: 'Hot Region', sort_order: 20 },
      { slug: 'coastal-site', label_zh: '海滨场地', label_en: 'Coastal Site', sort_order: 30 },
      { slug: 'mountain-site', label_zh: '山地场地', label_en: 'Mountain Site', sort_order: 40 },
    ],
  },
  {
    slug: 'configuration-level',
    title_zh: '配置等级',
    title_en: 'Configuration Level',
    description_zh: '用于粗分紧凑、标准、旗舰等产品配置方向。',
    description_en: 'Classifies compact, standard and flagship configuration directions.',
    sort_order: 50,
    options: [
      { slug: 'compact', label_zh: '紧凑配置', label_en: 'Compact', sort_order: 10 },
      { slug: 'standard', label_zh: '标准配置', label_en: 'Standard', sort_order: 20 },
      { slug: 'flagship', label_zh: '旗舰配置', label_en: 'Flagship', sort_order: 30 },
    ],
  },
  {
    slug: 'default-configuration',
    title_zh: '默认配置',
    title_en: 'Default Configuration',
    description_zh: '对齐 300 产品目录左侧默认配置筛选。',
    description_en: 'Matches the 300 product directory Default Configuration filter.',
    sort_order: 60,
    options: [
      { slug: 'chn-standard', label_zh: 'CHN 国标版', label_en: 'CHN Standard', sort_order: 10 },
      { slug: 'pro-full', label_zh: 'Pro 满配版', label_en: 'Pro Full Configuration', sort_order: 20 },
      { slug: 'resort-flagship', label_zh: 'Resort 旗舰版', label_en: 'Resort Flagship', sort_order: 30 },
    ],
  },
  {
    slug: 'product-configuration',
    title_zh: '热销配置',
    title_en: 'Product Configuration',
    description_zh: '对齐 300 产品目录热销配置筛选。',
    description_en: 'Matches the 300 product directory Product Configuration filter.',
    sort_order: 70,
    options: [
      { slug: 'chn-standard', label_zh: 'CHN国标版', label_en: 'CHN Standard', sort_order: 10 },
      { slug: 'pro-full', label_zh: 'Pro 满配版', label_en: 'Pro Full Configuration', sort_order: 20 },
      { slug: 'resort-flagship', label_zh: 'Resort 旗舰版', label_en: 'Resort Flagship', sort_order: 30 },
    ],
  },
  {
    slug: 'area',
    title_zh: '面积',
    title_en: 'Area',
    description_zh: '对齐 300 产品目录面积筛选。',
    description_en: 'Matches the 300 product directory Area filter.',
    sort_order: 80,
    options: [
      { slug: '6-19', label_zh: '6-19㎡', label_en: '6-19 sqm', sort_order: 10 },
      { slug: '20-29', label_zh: '20-29㎡', label_en: '20-29 sqm', sort_order: 20 },
      { slug: '30-39', label_zh: '30-39㎡', label_en: '30-39 sqm', sort_order: 30 },
      { slug: '40-99', label_zh: '40㎡-99㎡', label_en: '40-99 sqm', sort_order: 40 },
      { slug: '100-above', label_zh: '100㎡ Above', label_en: '100 sqm Above', sort_order: 50 },
    ],
  },
  {
    slug: 'country',
    title_zh: '国家',
    title_en: 'Country',
    description_zh: '对齐 300 产品目录国家筛选。',
    description_en: 'Matches the 300 product directory Country filter.',
    sort_order: 90,
    options: [
      { slug: 'china', label_zh: 'China 中国', label_en: 'China', sort_order: 10 },
      { slug: 'us', label_zh: 'US 美国', label_en: 'US', sort_order: 20 },
      { slug: 'japan', label_zh: 'Japan 日本', label_en: 'Japan', sort_order: 30 },
      { slug: 'mexico', label_zh: 'Mexico 墨西哥', label_en: 'Mexico', sort_order: 40 },
      { slug: 'new-zealand', label_zh: 'New Zealand 新西兰', label_en: 'New Zealand', sort_order: 50 },
      { slug: 'saudi-arabia', label_zh: 'Saudi Arabia 沙特', label_en: 'Saudi Arabia', sort_order: 60 },
      { slug: 'russia', label_zh: 'Russia 俄罗斯', label_en: 'Russia', sort_order: 70 },
      { slug: 'slovakia', label_zh: 'Slovakia 斯洛伐克', label_en: 'Slovakia', sort_order: 80 },
      { slug: 'uk', label_zh: 'UK 英国', label_en: 'UK', sort_order: 90 },
      { slug: 'argentina', label_zh: 'Argentina 阿根廷', label_en: 'Argentina', sort_order: 100 },
      { slug: 'thailand', label_zh: 'Thailand 泰国', label_en: 'Thailand', sort_order: 110 },
      { slug: 'israel', label_zh: 'Israel 以色列', label_en: 'Israel', sort_order: 120 },
      { slug: 'pakistan', label_zh: 'Pakistan 巴基斯坦', label_en: 'Pakistan', sort_order: 130 },
    ],
  },
]

async function seedCatalogProductsIfEmpty() {
  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM product_catalog`,
  )
  if (parseInt(countRes.rows[0]?.count ?? '0', 10) > 0) return

  const { catalogProducts } = await import('@/lib/products')
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

async function seedProductAttributeTemplatesIfEmpty() {
  for (const template of DEFAULT_PRODUCT_ATTRIBUTE_TEMPLATES) {
    const templateRes = await pool.query<{ id: number }>(
      `INSERT INTO product_attribute_templates
         (slug, title_zh, title_en, description_zh, description_en, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'visible')
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [
        template.slug,
        template.title_zh,
        template.title_en,
        template.description_zh ?? null,
        template.description_en ?? null,
        template.sort_order ?? 100,
      ],
    )
    let templateId = templateRes.rows[0]?.id
    if (!templateId) {
      const existingRes = await pool.query<{ id: number }>(
        `SELECT id
         FROM product_attribute_templates
         WHERE slug = $1 AND deleted_at IS NULL
         LIMIT 1`,
        [template.slug],
      )
      templateId = existingRes.rows[0]?.id
    }
    if (!templateId) continue

    for (const option of template.options) {
      await pool.query(
        `INSERT INTO product_attribute_options
           (template_id, slug, label_zh, label_en, sort_order, status)
         VALUES ($1, $2, $3, $4, $5, 'visible')
         ON CONFLICT (template_id, slug) DO NOTHING`,
        [
          templateId,
          option.slug,
          option.label_zh,
          option.label_en,
          option.sort_order ?? 100,
        ],
      )
    }
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
        price_display_zh VARCHAR(160),
        price_display_en VARCHAR(160),
        commercial_terms JSONB     NOT NULL DEFAULT '{}',
        keywords_zh    TEXT[]      NOT NULL DEFAULT '{}',
        keywords_en    TEXT[]      NOT NULL DEFAULT '{}',
        related_product_ids TEXT[] NOT NULL DEFAULT '{}',
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
      CREATE TABLE IF NOT EXISTS product_attribute_templates (
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
      CREATE TABLE IF NOT EXISTS product_attribute_options (
        id              SERIAL PRIMARY KEY,
        template_id     INTEGER NOT NULL REFERENCES product_attribute_templates(id) ON DELETE CASCADE,
        slug            VARCHAR(120) NOT NULL,
        label_zh        VARCHAR(160) NOT NULL,
        label_en        VARCHAR(160) NOT NULL,
        sort_order      INTEGER NOT NULL DEFAULT 0,
        status          VARCHAR(20) NOT NULL DEFAULT 'visible'
                        CHECK (status IN ('visible','hidden')),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at      TIMESTAMPTZ,
        UNIQUE (template_id, slug)
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_attribute_values (
        product_id      TEXT NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
        template_id     INTEGER NOT NULL REFERENCES product_attribute_templates(id) ON DELETE CASCADE,
        option_id       INTEGER NOT NULL REFERENCES product_attribute_options(id) ON DELETE CASCADE,
        sort_order      INTEGER NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (product_id, template_id, option_id)
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
        ADD COLUMN IF NOT EXISTS price_display_zh VARCHAR(160),
        ADD COLUMN IF NOT EXISTS price_display_en VARCHAR(160),
        ADD COLUMN IF NOT EXISTS commercial_terms JSONB NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS keywords_zh TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS keywords_en TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS related_product_ids TEXT[] NOT NULL DEFAULT '{}',
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
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_product_attribute_templates_status_sort
       ON product_attribute_templates (status, sort_order)
       WHERE deleted_at IS NULL`,
    )
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_product_attribute_options_template_sort
       ON product_attribute_options (template_id, status, sort_order)
       WHERE deleted_at IS NULL`,
    )
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product
       ON product_attribute_values (product_id)`,
    )
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_product_attribute_values_option
       ON product_attribute_values (option_id)`,
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
    if (process.env.VESSEL_ENABLE_LEGACY_CONTENT_SEED === '1') {
      await seedProductCategoriesIfEmpty()
      await seedProductAttributeTemplatesIfEmpty()
      await seedCatalogProductsIfEmpty()
    }
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

function buildPublicProductsWhere(filter: {
  search: string
  categoryId: number | null
  attributeOptionId: number | null
}) {
  const conds = [`status = 'published'`, 'deleted_at IS NULL']
  const params: unknown[] = []

  if (filter.categoryId) {
    params.push(filter.categoryId)
    conds.push(`category_id = $${params.length}`)
  }

  if (filter.attributeOptionId) {
    params.push(filter.attributeOptionId)
    conds.push(`EXISTS (
      SELECT 1
      FROM product_attribute_values pav
      WHERE pav.product_id = product_catalog.id
        AND pav.option_id = $${params.length}
    )`)
  }

  if (filter.search) {
    params.push(`%${filter.search}%`)
    const i = params.length
    conds.push(`(
      id ILIKE $${i}
      OR product_series ILIKE $${i}
      OR name_cn ILIKE $${i}
      OR name_en ILIKE $${i}
      OR gen ILIKE $${i}
      OR size ILIKE $${i}
      OR COALESCE(detail_slug, '') ILIKE $${i}
      OR COALESCE(array_to_string(tags_cn, ' '), '') ILIKE $${i}
      OR COALESCE(array_to_string(tags_en, ' '), '') ILIKE $${i}
      OR COALESCE(array_to_string(features_cn, ' '), '') ILIKE $${i}
      OR COALESCE(array_to_string(features_en, ' '), '') ILIKE $${i}
      OR COALESCE(array_to_string(keywords_zh, ' '), '') ILIKE $${i}
      OR COALESCE(array_to_string(keywords_en, ' '), '') ILIKE $${i}
    )`)
  }

  return { where: `WHERE ${conds.join(' AND ')}`, params }
}

const listPublishedCatalogProductsCached = unstable_cache(
  async (): Promise<CatalogProduct[]> => {
    await ensureProductCatalogSchema()
    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM product_catalog
       WHERE status = 'published' AND deleted_at IS NULL
       ORDER BY sort_order ASC, updated_at DESC`,
    )
    return rows.map(rowToCatalogProduct)
  },
  ['product-public-all'],
  { revalidate: PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS, tags: [PRODUCT_PUBLIC_CACHE_TAG] },
)

export async function listPublishedCatalogProducts(): Promise<CatalogProduct[]> {
  return listPublishedCatalogProductsCached()
}

export async function listPublishedCatalogProductsUncached(): Promise<CatalogProduct[]> {
  await ensureProductCatalogSchema()
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM product_catalog
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY sort_order ASC, updated_at DESC`,
  )
  return rows.map(rowToCatalogProduct)
}

const listPublishedCatalogProductsPageCached = unstable_cache(
  async (
    search: string,
    categoryId: number | null,
    attributeOptionId: number | null,
    limit: number,
    offset: number,
  ): Promise<ListPublishedCatalogProductsPageResult> => {
    const { where, params } = buildPublicProductsWhere({ search, categoryId, attributeOptionId })
    const safeLimit = Math.min(48, Math.max(1, limit))
    const safeOffset = Math.max(0, offset)

    const [countRes, listRes, allCountRes] = await Promise.all([
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM product_catalog ${where}`,
        params,
      ),
      pool.query(
        `SELECT ${COLUMNS} FROM product_catalog ${where}
         ORDER BY sort_order ASC, updated_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, safeLimit, safeOffset],
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM product_catalog
         WHERE status = 'published' AND deleted_at IS NULL`,
      ),
    ])

    return {
      rows: listRes.rows.map(rowToCatalogProduct),
      total: parseInt(countRes.rows[0]?.count ?? '0', 10),
      allProductsCount: parseInt(allCountRes.rows[0]?.count ?? '0', 10),
    }
  },
  ['product-public-list-page'],
  { revalidate: PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS, tags: [PRODUCT_PUBLIC_CACHE_TAG] },
)

export async function listPublishedCatalogProductsPage(
  filter: ListPublishedCatalogProductsPageFilter,
): Promise<ListPublishedCatalogProductsPageResult> {
  const search = (filter.search ?? '').trim().slice(0, 120)
  const categoryId = Number.isInteger(filter.categoryId) && Number(filter.categoryId) > 0
    ? Number(filter.categoryId)
    : null
  const attributeOptionId = Number.isInteger(filter.attributeOptionId) && Number(filter.attributeOptionId) > 0
    ? Number(filter.attributeOptionId)
    : null

  return listPublishedCatalogProductsPageCached(
    search,
    categoryId,
    attributeOptionId,
    filter.limit,
    filter.offset,
  )
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

async function getPublicCatalogProductBySlugUncached(slug: string): Promise<CatalogProduct | null> {
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

const getPublicCatalogProductBySlugCached = unstable_cache(
  getPublicCatalogProductBySlugUncached,
  ['product-public-detail'],
  { revalidate: PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS, tags: [PRODUCT_PUBLIC_CACHE_TAG] },
)

export async function getPublicCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  return getPublicCatalogProductBySlugCached(slug.trim())
}

async function getPublicCatalogProductByDetailSlugUncached(detailSlug: string): Promise<CatalogProduct | null> {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM product_catalog
     WHERE status = 'published'
       AND deleted_at IS NULL
       AND detail_slug = $1
     ORDER BY sort_order ASC, updated_at DESC
     LIMIT 1`,
    [detailSlug],
  )
  return rows[0] ? rowToCatalogProduct(rows[0]) : null
}

const getPublicCatalogProductByDetailSlugCached = unstable_cache(
  getPublicCatalogProductByDetailSlugUncached,
  ['product-public-detail-slug'],
  { revalidate: PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS, tags: [PRODUCT_PUBLIC_CACHE_TAG] },
)

export async function getPublicCatalogProductByDetailSlug(detailSlug: string): Promise<CatalogProduct | null> {
  return getPublicCatalogProductByDetailSlugCached(detailSlug.trim())
}

async function listPublicRelatedCatalogProductsUncached(
  idsKey: string,
  currentId: string | null,
  limit: number,
): Promise<CatalogProduct[]> {
  const parsedIds = JSON.parse(idsKey) as string[]
  const orderedIds = Array.from(new Set(parsedIds.map((id) => id.trim()).filter(Boolean)))
    .filter((id) => id !== currentId)
    .slice(0, Math.max(1, limit))

  if (orderedIds.length === 0) {
    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM product_catalog
       WHERE status = 'published' AND deleted_at IS NULL
         AND ($1::text IS NULL OR id <> $1)
       ORDER BY sort_order ASC, updated_at DESC
       LIMIT $2`,
      [currentId, limit],
    )
    return rows.map(rowToCatalogProduct)
  }

  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM product_catalog
     WHERE status = 'published'
       AND deleted_at IS NULL
       AND id = ANY($1::text[])
     ORDER BY array_position($1::text[], id) ASC
     LIMIT $2`,
    [orderedIds, limit],
  )
  return rows.map(rowToCatalogProduct)
}

const listPublicRelatedCatalogProductsCached = unstable_cache(
  listPublicRelatedCatalogProductsUncached,
  ['product-public-related'],
  { revalidate: PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS, tags: [PRODUCT_PUBLIC_CACHE_TAG] },
)

export async function listPublicRelatedCatalogProducts(
  ids: string[] | undefined,
  currentId?: string,
  limit = 12,
): Promise<CatalogProduct[]> {
  const orderedIds = Array.from(new Set((ids ?? []).map((id) => id.trim()).filter(Boolean)))
  const safeLimit = Math.min(24, Math.max(1, limit))
  return listPublicRelatedCatalogProductsCached(JSON.stringify(orderedIds), currentId ?? null, safeLimit)
}

async function listProductAttributeLabelsForProductUncached(productId: string): Promise<ProductAttributeLabel[]> {
  const { rows } = await pool.query<ProductAttributeLabel>(
    `SELECT
       t.slug AS template_slug,
       t.title_zh AS template_title_zh,
       t.title_en AS template_title_en,
       o.slug AS option_slug,
       o.label_zh,
       o.label_en
     FROM product_attribute_values pav
     JOIN product_attribute_templates t
       ON t.id = pav.template_id
      AND t.deleted_at IS NULL
     JOIN product_attribute_options o
       ON o.id = pav.option_id
      AND o.deleted_at IS NULL
     WHERE pav.product_id = $1
     ORDER BY t.sort_order ASC, o.sort_order ASC, o.id ASC`,
    [productId],
  )
  return rows
}

const listProductAttributeLabelsForProductCached = unstable_cache(
  listProductAttributeLabelsForProductUncached,
  ['product-public-attribute-labels'],
  { revalidate: PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS, tags: [PRODUCT_PUBLIC_CACHE_TAG] },
)

export async function listProductAttributeLabelsForProduct(productId: string): Promise<ProductAttributeLabel[]> {
  return listProductAttributeLabelsForProductCached(productId.trim())
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
  if (!rows[0]) return null
  const product = rowToCatalogProduct(rows[0])
  product.attribute_option_ids = await listProductAttributeOptionIds(id)
  return product
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
       price_display_zh, price_display_en, commercial_terms, keywords_zh, keywords_en,
       related_product_ids,
       seo_title_zh, seo_title_en, seo_description_zh, seo_description_en,
       status, sort_order
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       $9, $10, $11, $12, $13, $14, $15,
       $16, $17, $18, $19, $20, $21,
       $22, $23, $24, $25,
       $26, $27, $28::jsonb, $29::text[], $30::text[],
       $31::text[],
       $32, $33, $34, $35,
       $36, $37
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
      input.price_display_zh ?? null,
      input.price_display_en ?? null,
      JSON.stringify(input.commercial_terms ?? {}),
      input.keywords_zh ?? [],
      input.keywords_en ?? [],
      input.related_product_ids ?? [],
      input.seo_title_zh ?? null,
      input.seo_title_en ?? null,
      input.seo_description_zh ?? null,
      input.seo_description_en ?? null,
      input.status ?? 'draft',
      input.sort_order ?? 999,
    ],
  )
  const product = rowToCatalogProduct(res.rows[0])
  if (input.attribute_option_ids) {
    product.attribute_option_ids = await replaceProductAttributeValues(product.id, input.attribute_option_ids)
  }
  return product
}

export type UpdateCatalogProductInput = Partial<CatalogProductInput>

export async function updateCatalogProduct(id: string, input: UpdateCatalogProductInput) {
  await ensureProductCatalogSchema()
  const shouldReplaceAttributes = 'attribute_option_ids' in input
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
    ['price_display_zh', 'price_display_zh', (v) => v || null],
    ['price_display_en', 'price_display_en', (v) => v || null],
    ['commercial_terms', 'commercial_terms', (v) => JSON.stringify(v ?? {})],
    ['keywords_zh', 'keywords_zh', (v) => Array.isArray(v) ? v : []],
    ['keywords_en', 'keywords_en', (v) => Array.isArray(v) ? v : []],
    ['related_product_ids', 'related_product_ids', (v) => Array.isArray(v) ? v : []],
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

  if (sets.length === 0) {
    if (shouldReplaceAttributes) {
      await replaceProductAttributeValues(id, input.attribute_option_ids ?? [])
    }
    return getCatalogProductById(id)
  }
  sets.push('updated_at = NOW()')

  const res = await pool.query(
    `UPDATE product_catalog
       SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${COLUMNS}`,
    params,
  )
  if (!res.rows[0]) return null
  if (shouldReplaceAttributes) {
    await replaceProductAttributeValues(id, input.attribute_option_ids ?? [])
    return getCatalogProductById(id)
  }
  return rowToCatalogProduct(res.rows[0])
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
  if (!res.rows[0]) return null
  return rowToCatalogProduct(res.rows[0])
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

const listPublicProductCategoriesCached = unstable_cache(
  async (): Promise<ProductCategoryRow[]> => {
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
        AND pc.status = 'published'
        AND pc.deleted_at IS NULL
       WHERE c.deleted_at IS NULL
         AND c.status = 'visible'
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.id ASC`,
    )

    return res.rows.map((row) => ({
      ...row,
      product_count: parseInt(String(row.product_count ?? '0'), 10),
    }))
  },
  ['product-public-categories'],
  { revalidate: PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS, tags: [PRODUCT_PUBLIC_CACHE_TAG] },
)

export async function listPublicProductCategories() {
  return listPublicProductCategoriesCached()
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

export async function listProductAttributeTemplates({
  includeHidden = false,
}: {
  includeHidden?: boolean
} = {}) {
  await ensureProductCatalogSchema()
  const templateConds = ['t.deleted_at IS NULL']
  const optionJoinConds = ['o.template_id = t.id', 'o.deleted_at IS NULL']
  if (!includeHidden) {
    templateConds.push(`t.status = 'visible'`)
    optionJoinConds.push(`o.status = 'visible'`)
  }

  type TemplateQueryRow = Omit<ProductAttributeTemplateRow, 'option_count' | 'product_count'> & {
    option_count: string
    product_count: string
  }

  const res = await pool.query<TemplateQueryRow>(
    `SELECT
       t.id,
       t.slug,
       t.title_zh,
       t.title_en,
       t.description_zh,
       t.description_en,
       t.sort_order,
       t.status,
       t.created_at::text AS created_at,
       t.updated_at::text AS updated_at,
       COUNT(DISTINCT o.id)::text AS option_count,
       COUNT(DISTINCT pc.id)::text AS product_count
     FROM product_attribute_templates t
     LEFT JOIN product_attribute_options o
       ON ${optionJoinConds.join(' AND ')}
     LEFT JOIN product_attribute_values pav
       ON pav.template_id = t.id
     LEFT JOIN product_catalog pc
       ON pc.id = pav.product_id
      AND pc.deleted_at IS NULL
     WHERE ${templateConds.join(' AND ')}
     GROUP BY t.id
     ORDER BY t.sort_order ASC, t.id ASC`,
  )

  return res.rows.map((row) => ({
    ...row,
    option_count: parseInt(row.option_count ?? '0', 10),
    product_count: parseInt(row.product_count ?? '0', 10),
  }))
}

export async function listProductAttributeTemplatesWithOptions({
  includeHidden = false,
}: {
  includeHidden?: boolean
} = {}) {
  const templates = await listProductAttributeTemplates({ includeHidden })
  if (templates.length === 0) return []

  const templateIds = templates.map((template) => template.id)
  const optionConds = ['o.deleted_at IS NULL', 'o.template_id = ANY($1::int[])']
  if (!includeHidden) optionConds.push(`o.status = 'visible'`)

  type OptionQueryRow = ProductAttributeOptionRow & { product_count: string }

  const optionsRes = await pool.query<OptionQueryRow>(
    `SELECT
       o.id,
       o.template_id,
       t.slug AS template_slug,
       t.title_zh AS template_title_zh,
       t.title_en AS template_title_en,
       o.slug,
       o.label_zh,
       o.label_en,
       o.sort_order,
       o.status,
       o.created_at::text AS created_at,
       o.updated_at::text AS updated_at,
       COUNT(DISTINCT pc.id)::text AS product_count
     FROM product_attribute_options o
     JOIN product_attribute_templates t
       ON t.id = o.template_id
      AND t.deleted_at IS NULL
     LEFT JOIN product_attribute_values pav
       ON pav.option_id = o.id
     LEFT JOIN product_catalog pc
       ON pc.id = pav.product_id
      AND pc.deleted_at IS NULL
     WHERE ${optionConds.join(' AND ')}
     GROUP BY o.id, t.id
     ORDER BY t.sort_order ASC, o.sort_order ASC, o.id ASC`,
    [templateIds],
  )

  const optionsByTemplate = new Map<number, ProductAttributeOptionRow[]>()
  for (const option of optionsRes.rows) {
    const list = optionsByTemplate.get(option.template_id) ?? []
    list.push({
      ...option,
      product_count: parseInt(String(option.product_count ?? '0'), 10),
    })
    optionsByTemplate.set(option.template_id, list)
  }

  return templates.map((template) => ({
    ...template,
    options: optionsByTemplate.get(template.id) ?? [],
  }))
}

const listPublicProductAttributeTemplatesWithOptionsCached = unstable_cache(
  async (): Promise<ProductAttributeTemplateWithOptions[]> => {
    type TemplateQueryRow = Omit<ProductAttributeTemplateRow, 'option_count' | 'product_count'> & {
      option_count: string
      product_count: string
    }

    const templatesRes = await pool.query<TemplateQueryRow>(
      `SELECT
         t.id,
         t.slug,
         t.title_zh,
         t.title_en,
         t.description_zh,
         t.description_en,
         t.sort_order,
         t.status,
         t.created_at::text AS created_at,
         t.updated_at::text AS updated_at,
         COUNT(DISTINCT o.id)::text AS option_count,
         COUNT(DISTINCT pc.id)::text AS product_count
       FROM product_attribute_templates t
       LEFT JOIN product_attribute_options o
         ON o.template_id = t.id
        AND o.deleted_at IS NULL
        AND o.status = 'visible'
       LEFT JOIN product_attribute_values pav
         ON pav.template_id = t.id
       LEFT JOIN product_catalog pc
         ON pc.id = pav.product_id
        AND pc.status = 'published'
        AND pc.deleted_at IS NULL
       WHERE t.deleted_at IS NULL
         AND t.status = 'visible'
       GROUP BY t.id
       ORDER BY t.sort_order ASC, t.id ASC`,
    )
    const templates = templatesRes.rows.map((row) => ({
      ...row,
      option_count: parseInt(row.option_count ?? '0', 10),
      product_count: parseInt(row.product_count ?? '0', 10),
    }))
    if (templates.length === 0) return []

    const templateIds = templates.map((template) => template.id)
    type OptionQueryRow = ProductAttributeOptionRow & { product_count: string }

    const optionsRes = await pool.query<OptionQueryRow>(
      `SELECT
         o.id,
         o.template_id,
         t.slug AS template_slug,
         t.title_zh AS template_title_zh,
         t.title_en AS template_title_en,
         o.slug,
         o.label_zh,
         o.label_en,
         o.sort_order,
         o.status,
         o.created_at::text AS created_at,
         o.updated_at::text AS updated_at,
         COUNT(DISTINCT pc.id)::text AS product_count
       FROM product_attribute_options o
       JOIN product_attribute_templates t
         ON t.id = o.template_id
        AND t.deleted_at IS NULL
        AND t.status = 'visible'
       LEFT JOIN product_attribute_values pav
         ON pav.option_id = o.id
       LEFT JOIN product_catalog pc
         ON pc.id = pav.product_id
        AND pc.status = 'published'
        AND pc.deleted_at IS NULL
       WHERE o.deleted_at IS NULL
         AND o.status = 'visible'
         AND o.template_id = ANY($1::int[])
       GROUP BY o.id, t.id
       ORDER BY t.sort_order ASC, o.sort_order ASC, o.id ASC`,
      [templateIds],
    )

    const optionsByTemplate = new Map<number, ProductAttributeOptionRow[]>()
    for (const option of optionsRes.rows) {
      const list = optionsByTemplate.get(option.template_id) ?? []
      list.push({
        ...option,
        product_count: parseInt(String(option.product_count ?? '0'), 10),
      })
      optionsByTemplate.set(option.template_id, list)
    }

    return templates.map((template) => ({
      ...template,
      options: optionsByTemplate.get(template.id) ?? [],
    }))
  },
  ['product-public-attribute-templates'],
  { revalidate: PRODUCT_PUBLIC_CACHE_REVALIDATE_SECONDS, tags: [PRODUCT_PUBLIC_CACHE_TAG] },
)

export async function listPublicProductAttributeTemplatesWithOptions() {
  return listPublicProductAttributeTemplatesWithOptionsCached()
}

export async function getProductAttributeTemplateById(id: number) {
  await ensureProductCatalogSchema()
  const res = await pool.query<ProductAttributeTemplateRow>(
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
     FROM product_attribute_templates
     WHERE id = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  )
  return res.rows[0] ?? null
}

export async function getProductAttributeOptionById(id: number) {
  await ensureProductCatalogSchema()
  const res = await pool.query<ProductAttributeOptionRow>(
    `SELECT
       o.id,
       o.template_id,
       t.slug AS template_slug,
       t.title_zh AS template_title_zh,
       t.title_en AS template_title_en,
       o.slug,
       o.label_zh,
       o.label_en,
       o.sort_order,
       o.status,
       o.created_at::text AS created_at,
       o.updated_at::text AS updated_at
     FROM product_attribute_options o
     JOIN product_attribute_templates t
       ON t.id = o.template_id
      AND t.deleted_at IS NULL
     WHERE o.id = $1 AND o.deleted_at IS NULL
     LIMIT 1`,
    [id],
  )
  return res.rows[0] ?? null
}

export async function isProductAttributeTemplateSlugTaken(slug: string, excludeId?: number) {
  await ensureProductCatalogSchema()
  const params: unknown[] = [slug]
  let extra = ''
  if (excludeId != null) {
    params.push(excludeId)
    extra = `AND id != $${params.length}`
  }

  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM product_attribute_templates WHERE slug = $1 AND deleted_at IS NULL ${extra}
     ) AS exists`,
    params,
  )
  return res.rows[0]?.exists ?? false
}

export async function isProductAttributeOptionSlugTaken(templateId: number, slug: string, excludeId?: number) {
  await ensureProductCatalogSchema()
  const params: unknown[] = [templateId, slug]
  let extra = ''
  if (excludeId != null) {
    params.push(excludeId)
    extra = `AND id != $${params.length}`
  }

  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1
       FROM product_attribute_options
       WHERE template_id = $1 AND slug = $2 AND deleted_at IS NULL ${extra}
     ) AS exists`,
    params,
  )
  return res.rows[0]?.exists ?? false
}

export async function createProductAttributeTemplate(input: CreateProductAttributeTemplateInput) {
  await ensureProductCatalogSchema()
  const res = await pool.query<{ id: number }>(
    `INSERT INTO product_attribute_templates
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

  const created = await getProductAttributeTemplateById(res.rows[0].id)
  if (!created) throw new Error('Created product attribute template not found')
  return created
}

export async function updateProductAttributeTemplate(id: number, input: UpdateProductAttributeTemplateInput) {
  await ensureProductCatalogSchema()
  const sets: string[] = []
  const params: unknown[] = [id]

  const fields: [keyof UpdateProductAttributeTemplateInput, string][] = [
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

  if (sets.length === 0) return getProductAttributeTemplateById(id)
  sets.push('updated_at = NOW()')

  const res = await pool.query<{ id: number }>(
    `UPDATE product_attribute_templates SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    params,
  )

  return res.rows[0]?.id ? getProductAttributeTemplateById(res.rows[0].id) : null
}

export async function createProductAttributeOption(input: CreateProductAttributeOptionInput) {
  await ensureProductCatalogSchema()
  const res = await pool.query<{ id: number }>(
    `INSERT INTO product_attribute_options
       (template_id, slug, label_zh, label_en, sort_order, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      input.template_id,
      input.slug,
      input.label_zh,
      input.label_en,
      input.sort_order ?? 100,
      input.status ?? 'visible',
    ],
  )

  const created = await getProductAttributeOptionById(res.rows[0].id)
  if (!created) throw new Error('Created product attribute option not found')
  return created
}

export async function updateProductAttributeOption(id: number, input: UpdateProductAttributeOptionInput) {
  await ensureProductCatalogSchema()
  const sets: string[] = []
  const params: unknown[] = [id]

  const fields: [keyof UpdateProductAttributeOptionInput, string][] = [
    ['slug', 'slug'],
    ['label_zh', 'label_zh'],
    ['label_en', 'label_en'],
    ['sort_order', 'sort_order'],
    ['status', 'status'],
  ]

  for (const [key, col] of fields) {
    if (key in input) {
      params.push(input[key])
      sets.push(`${col} = $${params.length}`)
    }
  }

  if (sets.length === 0) return getProductAttributeOptionById(id)
  sets.push('updated_at = NOW()')

  const res = await pool.query<{ id: number }>(
    `UPDATE product_attribute_options SET ${sets.join(', ')}
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    params,
  )

  return res.rows[0]?.id ? getProductAttributeOptionById(res.rows[0].id) : null
}

export async function listProductAttributeOptionIds(productId: string) {
  await ensureProductCatalogSchema()
  const res = await pool.query<{ option_id: number }>(
    `SELECT pav.option_id
     FROM product_attribute_values pav
     JOIN product_attribute_options o
       ON o.id = pav.option_id
      AND o.deleted_at IS NULL
     JOIN product_attribute_templates t
       ON t.id = pav.template_id
      AND t.deleted_at IS NULL
     WHERE pav.product_id = $1
     ORDER BY t.sort_order ASC, o.sort_order ASC, o.id ASC`,
    [productId],
  )
  return res.rows.map((row) => row.option_id)
}

export async function replaceProductAttributeValues(productId: string, optionIds: number[]) {
  await ensureProductCatalogSchema()
  const uniqueIds = Array.from(new Set(optionIds.filter((id) => Number.isInteger(id) && id > 0))).slice(0, 80)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM product_attribute_values WHERE product_id = $1`, [productId])

    if (uniqueIds.length > 0) {
      const optionsRes = await client.query<{ id: number; template_id: number; sort_order: number }>(
        `SELECT o.id, o.template_id, o.sort_order
         FROM product_attribute_options o
         JOIN product_attribute_templates t
           ON t.id = o.template_id
          AND t.deleted_at IS NULL
         WHERE o.id = ANY($1::int[])
           AND o.deleted_at IS NULL`,
        [uniqueIds],
      )

      for (const option of optionsRes.rows) {
        await client.query(
          `INSERT INTO product_attribute_values
             (product_id, template_id, option_id, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (product_id, template_id, option_id) DO NOTHING`,
          [productId, option.template_id, option.id, option.sort_order],
        )
      }
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return listProductAttributeOptionIds(productId)
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
