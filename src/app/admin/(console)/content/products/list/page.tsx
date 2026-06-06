import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductBatchCategoryBar from '@/components/admin/ProductBatchCategoryBar'
import ProductListDeleteAction from '@/components/admin/ProductListDeleteAction'
import { pool } from '@/lib/db'
import {
  countDeletedCatalogProducts,
  ensureProductCatalogSchema,
  listProductAttributeTemplatesWithOptions,
  listProductCategories,
  type ProductAttributeTemplateWithOptions,
  type ProductCategoryRow,
} from '@/lib/product-catalog-db'
import {
  COMMERCIAL_TERM_FIELD_PAIRS,
  getMissingCommercialTermLanguages,
} from '@/lib/product-commercial-terms'
import {
  ensureProductOperationsSchema,
  listProductBrands,
  listProductMarks,
  listProductShowcases,
  type ProductBrandRow,
  type ProductMarkRow,
  type ProductShowcaseRow,
} from '@/lib/product-operations-db'
import { getCatalogProductRouteInfo } from '@/lib/product-public-routes'
import {
  Archive,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  Filter,
  ImageIcon,
  Layers3,
  ListChecks,
  Package,
  Pencil,
  Plus,
  Search,
  SearchCheck,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品列表 - VESSEL' }

const PAGE_SIZE = 50

type AdminRole = 'admin' | 'operator'
type ProductStatus = 'draft' | 'published'
type ProductView = '' | 'incomplete'
type ProductIssue =
  | ''
  | 'media'
  | 'content'
  | 'category'
  | 'attributes'
  | 'seo'
  | 'price'
  | 'commercial'
  | 'keywords'
  | 'related'
  | 'buyer_resources'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type FilterState = {
  status: ProductStatus | ''
  view: ProductView
  issue: ProductIssue
  search: string
  series: string
  productType: string
  category: string
  attribute: string
  brand: string
  mark: string
  showcase: string
  page: number
}

type ProductSummary = {
  total: number
  published: number
  draft: number
  incomplete: number
  deleted: number
}

type ProductListRow = {
  id: string
  product_series: string
  name_cn: string
  name_en: string
  gen: string
  product_type: string
  image: string | null
  description_cn: string | null
  description_en: string | null
  gallery: unknown[] | null
  tags_cn: unknown[] | null
  tags_en: unknown[] | null
  features_cn: unknown[] | null
  features_en: unknown[] | null
  detail_modules: unknown[] | null
  detail_slug: string | null
  category_id: number | null
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
  brand_id: number | null
  brand_title_zh: string | null
  brand_title_en: string | null
  attribute_option_count: number | string
  attribute_labels_zh: string[] | null
  mark_labels_zh: string[] | null
  showcase_titles_zh: string[] | null
  price_display_zh: string | null
  price_display_en: string | null
  commercial_terms: Record<string, string> | null
  keywords_zh: string[] | null
  keywords_en: string[] | null
  related_product_ids: string[] | null
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  status: ProductStatus
  created_at: string
  updated_at: string
}

type ProductListResult = {
  rows: ProductListRow[]
  total: number
}

type ProductOptions = {
  series: string[]
  productTypes: string[]
  categories: Pick<ProductCategoryRow, 'id' | 'title_zh' | 'title_en'>[]
  attributeTemplates: ProductAttributeTemplateWithOptions[]
  brands: Pick<ProductBrandRow, 'id' | 'title_zh' | 'title_en' | 'status'>[]
  marks: Pick<ProductMarkRow, 'id' | 'title_zh' | 'title_en' | 'status'>[]
  showcases: Pick<ProductShowcaseRow, 'id' | 'title_zh' | 'title_en' | 'status'>[]
}

type StatCard = {
  title: string
  value: number
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

type QuickLink = {
  label: string
  href: string
  Icon: LucideIcon
  primary?: boolean
}

const EMPTY_SUMMARY: ProductSummary = {
  total: 0,
  published: 0,
  draft: 0,
  incomplete: 0,
  deleted: 0,
}

const EMPTY_OPTIONS: ProductOptions = {
  series: [],
  productTypes: [],
  categories: [],
  attributeTemplates: [],
  brands: [],
  marks: [],
  showcases: [],
}

const PRODUCT_ISSUE_OPTIONS: { value: ProductIssue; label: string }[] = [
  { value: '', label: '全部缺项' },
  { value: 'media', label: '缺素材' },
  { value: 'content', label: '缺内容' },
  { value: 'category', label: '未分类' },
  { value: 'attributes', label: '缺属性' },
  { value: 'seo', label: '缺 SEO' },
  { value: 'price', label: '缺价格展示' },
  { value: 'commercial', label: '商务条款中英文不完整' },
  { value: 'keywords', label: 'Missing keywords' },
  { value: 'related', label: 'Missing related products' },
  { value: 'buyer_resources', label: 'Missing buyer resources' },
]

const PRIORITY_ISSUES = ['缺封面', '缺图库', '未分类', '缺 SEO']
const COMMERCIAL_TERM_ZH_KEYS = COMMERCIAL_TERM_FIELD_PAIRS.map((field) => field.zh)
const COMMERCIAL_TERM_EN_KEYS = COMMERCIAL_TERM_FIELD_PAIRS.map((field) => field.en)

function missingCommercialTermsSql(fieldRef: string): string {
  const missingAll = (keys: readonly string[]) => keys
    .map((key) => `NULLIF(BTRIM(COALESCE(${fieldRef} ->> '${key}', '')), '') IS NULL`)
    .join('\n    AND ')

  return `(
  (
    ${missingAll(COMMERCIAL_TERM_ZH_KEYS)}
  )
  OR (
    ${missingAll(COMMERCIAL_TERM_EN_KEYS)}
  )
)`
}

const PRODUCT_MISSING_COMMERCIAL_SQL = missingCommercialTermsSql('commercial_terms')
const PRODUCT_MISSING_COMMERCIAL_SQL_ALIASED = missingCommercialTermsSql('pc.commercial_terms')

const PRODUCT_INCOMPLETE_SQL = `(
  NULLIF(BTRIM(image), '') IS NULL
  OR jsonb_array_length(COALESCE(gallery, '[]'::jsonb)) = 0
  OR NULLIF(BTRIM(description_cn), '') IS NULL
  OR NULLIF(BTRIM(description_en), '') IS NULL
  OR jsonb_array_length(COALESCE(tags_cn, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(features_cn, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(features_en, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(detail_modules, '[]'::jsonb)) = 0
  OR category_id IS NULL
  OR NOT EXISTS (
    SELECT 1 FROM product_attribute_values pav
    WHERE pav.product_id = product_catalog.id
  )
  OR NULLIF(BTRIM(COALESCE(seo_title_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(seo_title_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(seo_description_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(seo_description_en, '')), '') IS NULL
  OR (
    NULLIF(BTRIM(COALESCE(price_display_zh, '')), '') IS NULL
    AND NULLIF(BTRIM(COALESCE(price_display_en, '')), '') IS NULL
  )
  OR ${PRODUCT_MISSING_COMMERCIAL_SQL}
  OR (
    COALESCE(cardinality(keywords_zh), 0) = 0
    AND COALESCE(cardinality(keywords_en), 0) = 0
  )
  OR COALESCE(cardinality(related_product_ids), 0) = 0
  OR NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(detail_modules, '[]'::jsonb)) AS detail_module(module)
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(detail_module.module -> 'items_en', '[]'::jsonb)
      || COALESCE(detail_module.module -> 'items_cn', '[]'::jsonb)
    ) AS detail_item(item)
    WHERE COALESCE(detail_module.module ->> 'is_visible', 'true') <> 'false'
      AND CONCAT_WS(' ', detail_module.module ->> 'id', detail_module.module ->> 'title_en', detail_module.module ->> 'title_cn') ~* '(buyer|download|resource|material)'
      AND NULLIF(BTRIM(COALESCE(detail_item.item ->> 'href', '')), '') IS NOT NULL
  )
)`

const PRODUCT_INCOMPLETE_SQL_ALIASED = `(
  NULLIF(BTRIM(pc.image), '') IS NULL
  OR jsonb_array_length(COALESCE(pc.gallery, '[]'::jsonb)) = 0
  OR NULLIF(BTRIM(pc.description_cn), '') IS NULL
  OR NULLIF(BTRIM(pc.description_en), '') IS NULL
  OR jsonb_array_length(COALESCE(pc.tags_cn, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(pc.tags_en, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(pc.features_cn, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(pc.features_en, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(pc.detail_modules, '[]'::jsonb)) = 0
  OR pc.category_id IS NULL
  OR NOT EXISTS (
    SELECT 1 FROM product_attribute_values pav
    WHERE pav.product_id = pc.id
  )
  OR NULLIF(BTRIM(COALESCE(pc.seo_title_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(pc.seo_title_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(pc.seo_description_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(pc.seo_description_en, '')), '') IS NULL
  OR (
    NULLIF(BTRIM(COALESCE(pc.price_display_zh, '')), '') IS NULL
    AND NULLIF(BTRIM(COALESCE(pc.price_display_en, '')), '') IS NULL
  )
  OR ${PRODUCT_MISSING_COMMERCIAL_SQL_ALIASED}
  OR (
    COALESCE(cardinality(pc.keywords_zh), 0) = 0
    AND COALESCE(cardinality(pc.keywords_en), 0) = 0
  )
  OR COALESCE(cardinality(pc.related_product_ids), 0) = 0
  OR NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(pc.detail_modules, '[]'::jsonb)) AS detail_module(module)
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(detail_module.module -> 'items_en', '[]'::jsonb)
      || COALESCE(detail_module.module -> 'items_cn', '[]'::jsonb)
    ) AS detail_item(item)
    WHERE COALESCE(detail_module.module ->> 'is_visible', 'true') <> 'false'
      AND CONCAT_WS(' ', detail_module.module ->> 'id', detail_module.module ->> 'title_en', detail_module.module ->> 'title_cn') ~* '(buyer|download|resource|material)'
      AND NULLIF(BTRIM(COALESCE(detail_item.item ->> 'href', '')), '') IS NOT NULL
  )
)`

const PRODUCT_MISSING_MEDIA_SQL_ALIASED = `(
  NULLIF(BTRIM(pc.image), '') IS NULL
  OR jsonb_array_length(COALESCE(pc.gallery, '[]'::jsonb)) = 0
)`

const PRODUCT_MISSING_CONTENT_SQL_ALIASED = `(
  NULLIF(BTRIM(pc.description_cn), '') IS NULL
  OR NULLIF(BTRIM(pc.description_en), '') IS NULL
  OR jsonb_array_length(COALESCE(pc.tags_cn, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(pc.tags_en, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(pc.features_cn, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(pc.features_en, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(pc.detail_modules, '[]'::jsonb)) = 0
)`

const PRODUCT_MISSING_ATTRIBUTES_SQL_ALIASED = `NOT EXISTS (
  SELECT 1 FROM product_attribute_values pav
  WHERE pav.product_id = pc.id
)`

const PRODUCT_MISSING_SEO_SQL_ALIASED = `(
  NULLIF(BTRIM(COALESCE(pc.seo_title_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(pc.seo_title_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(pc.seo_description_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(pc.seo_description_en, '')), '') IS NULL
)`

const PRODUCT_MISSING_PRICE_SQL_ALIASED = `(
  NULLIF(BTRIM(COALESCE(pc.price_display_zh, '')), '') IS NULL
  AND NULLIF(BTRIM(COALESCE(pc.price_display_en, '')), '') IS NULL
)`

const PRODUCT_MISSING_KEYWORDS_SQL_ALIASED = `(
  COALESCE(cardinality(pc.keywords_zh), 0) = 0
  AND COALESCE(cardinality(pc.keywords_en), 0) = 0
)`

const PRODUCT_MISSING_RELATED_SQL_ALIASED = `COALESCE(cardinality(pc.related_product_ids), 0) = 0`

const PRODUCT_MISSING_BUYER_RESOURCES_SQL_ALIASED = `NOT EXISTS (
  SELECT 1
  FROM jsonb_array_elements(COALESCE(pc.detail_modules, '[]'::jsonb)) AS detail_module(module)
  CROSS JOIN LATERAL jsonb_array_elements(
    COALESCE(detail_module.module -> 'items_en', '[]'::jsonb)
    || COALESCE(detail_module.module -> 'items_cn', '[]'::jsonb)
  ) AS detail_item(item)
  WHERE COALESCE(detail_module.module ->> 'is_visible', 'true') <> 'false'
    AND CONCAT_WS(' ', detail_module.module ->> 'id', detail_module.module ->> 'title_en', detail_module.module ->> 'title_cn') ~* '(buyer|download|resource|material)'
    AND NULLIF(BTRIM(COALESCE(detail_item.item ->> 'href', '')), '') IS NOT NULL
)`

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function normalizeStatus(value: string | undefined): ProductStatus | '' {
  return value === 'draft' || value === 'published' ? value : ''
}

function normalizeView(value: string | undefined): ProductView {
  return value === 'incomplete' ? 'incomplete' : ''
}

function normalizeIssue(value: string | undefined): ProductIssue {
  return PRODUCT_ISSUE_OPTIONS.some((option) => option.value === value) ? (value as ProductIssue) : ''
}

function normalizePage(value: string | undefined): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseFilters(sp: Record<string, string | string[] | undefined>): FilterState {
  return {
    status: normalizeStatus(firstParam(sp.status)),
    view: normalizeView(firstParam(sp.view)),
    issue: normalizeIssue(firstParam(sp.issue)),
    search: firstParam(sp.search)?.trim() ?? '',
    series: firstParam(sp.series)?.trim() ?? '',
    productType: firstParam(sp.type)?.trim() ?? '',
    category: firstParam(sp.category)?.trim() ?? '',
    attribute: firstParam(sp.attribute)?.trim() ?? '',
    brand: firstParam(sp.brand)?.trim() ?? '',
    mark: firstParam(sp.mark)?.trim() ?? '',
    showcase: firstParam(sp.showcase)?.trim() ?? '',
    page: normalizePage(firstParam(sp.page)),
  }
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasItems(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function isBuyerResourceModule(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const record = value as { id?: unknown; title_en?: unknown; title_cn?: unknown; is_visible?: unknown }
  if (record.is_visible === false) return false
  const marker = [record.id, record.title_en, record.title_cn]
    .map((entry) => (typeof entry === 'string' ? entry.toLowerCase() : ''))
    .join(' ')
  return /buyer|download|resource|material/.test(marker)
}

function hasBuyerResourceLinks(value: unknown[] | null | undefined): boolean {
  if (!Array.isArray(value)) return false
  return value.some((module) => {
    if (!isBuyerResourceModule(module)) return false
    const record = module as { items_en?: unknown; items_cn?: unknown }
    const items = [
      ...(Array.isArray(record.items_en) ? record.items_en : []),
      ...(Array.isArray(record.items_cn) ? record.items_cn : []),
    ]
    return items.some((item) => {
      if (!item || typeof item !== 'object') return false
      const href = (item as { href?: unknown }).href
      return typeof href === 'string' && href.trim().length > 0
    })
  })
}

function commercialTermsIssueLabel(terms: Record<string, string> | null | undefined): string | null {
  const missing = getMissingCommercialTermLanguages(terms)
  if (missing.length === 0) return null
  if (missing.length === 2) return 'Missing business terms'
  return missing[0] === 'zh' ? '缺中文商务条款' : 'Missing English business terms'
}

function parseCount(value: string | undefined): number {
  return parseInt(value ?? '0', 10)
}

function productPreviewHref(product: ProductListRow): string {
  return getCatalogProductRouteInfo({
    id: product.id,
    detailSlug: product.detail_slug,
  }).publicHref
}

function getProductTypeLabel(value: string): string {
  if (value === 'compact') return '紧凑型'
  if (value === 'standard') return '标准型'
  if (value === 'luxury') return '旗舰型'
  return value || '未标记'
}

function getProductIssues(product: ProductListRow): string[] {
  const issues: string[] = []
  const commercialIssue = commercialTermsIssueLabel(product.commercial_terms)

  if (!hasText(product.image)) issues.push('缺封面')
  if (!hasItems(product.gallery)) issues.push('缺图库')
  if (!hasText(product.description_cn)) issues.push('缺中文简介')
  if (!hasText(product.description_en)) issues.push('缺英文简介')
  if (!hasItems(product.tags_cn) || !hasItems(product.tags_en)) issues.push('缺标签')
  if (!hasItems(product.features_cn) || !hasItems(product.features_en)) issues.push('缺亮点')
  if (!hasItems(product.detail_modules)) issues.push('缺详情模块')
  if (!product.category_id) issues.push('未分类')
  if (Number(product.attribute_option_count ?? 0) === 0) issues.push('缺产品属性')
  if (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) issues.push('缺价格展示')
  if (commercialIssue) issues.push(commercialIssue)
  if (!hasItems(product.keywords_zh) && !hasItems(product.keywords_en)) issues.push('Missing keywords')
  if (!hasItems(product.related_product_ids)) issues.push('Missing related products')
  if (!hasBuyerResourceLinks(product.detail_modules)) issues.push('Missing buyer resources')
  if (
    !hasText(product.seo_title_zh)
    || !hasText(product.seo_title_en)
    || !hasText(product.seo_description_zh)
    || !hasText(product.seo_description_en)
  ) {
    issues.push('缺 SEO')
  }
  if (
    hasText(product.detail_slug)
    && (
      !hasText(product.image)
      || !hasText(product.description_cn)
      || !hasText(product.description_en)
      || !hasItems(product.tags_cn)
      || !hasItems(product.tags_en)
      || !hasItems(product.features_cn)
      || !hasItems(product.features_en)
    )
  ) {
    issues.push('精品页绑定缺 CMS 基础字段')
  }

  return sortIssues(issues)
}

function getCompletenessLabel(issues: string[]): string {
  if (issues.length === 0) return '完整'
  if (issues.includes('缺封面') || issues.includes('缺图库')) return '待补素材'
  if (issues.includes('未分类') || issues.includes('缺 SEO')) return '优先处理'
  return '可展示但待补充'
}

function completenessClass(label: string): string {
  if (label === '完整') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (label === '待补素材') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (label === '优先处理') return 'border-[#F2C6A7] bg-[#FFF7F0] text-[#B85D21]'
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function issueClass(issue: string): string {
  if (PRIORITY_ISSUES.includes(issue)) {
    return 'border-[#F2C6A7] bg-[#FFF7F0] font-semibold text-[#B85D21]'
  }
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function sortIssues(issues: string[]): string[] {
  return [...issues].sort((a, b) => {
    const aIndex = PRIORITY_ISSUES.indexOf(a)
    const bIndex = PRIORITY_ISSUES.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

function getIssueCondition(issue: ProductIssue): string | null {
  if (issue === 'media') return PRODUCT_MISSING_MEDIA_SQL_ALIASED
  if (issue === 'content') return PRODUCT_MISSING_CONTENT_SQL_ALIASED
  if (issue === 'category') return 'pc.category_id IS NULL'
  if (issue === 'attributes') return PRODUCT_MISSING_ATTRIBUTES_SQL_ALIASED
  if (issue === 'seo') return PRODUCT_MISSING_SEO_SQL_ALIASED
  if (issue === 'price') return PRODUCT_MISSING_PRICE_SQL_ALIASED
  if (issue === 'commercial') return PRODUCT_MISSING_COMMERCIAL_SQL_ALIASED
  if (issue === 'keywords') return PRODUCT_MISSING_KEYWORDS_SQL_ALIASED
  if (issue === 'related') return PRODUCT_MISSING_RELATED_SQL_ALIASED
  if (issue === 'buyer_resources') return PRODUCT_MISSING_BUYER_RESOURCES_SQL_ALIASED
  return null
}

function createHref(filters: FilterState, patch: Partial<FilterState & { clearSearch: boolean }>): string {
  const next: FilterState = {
    ...filters,
    ...patch,
    page: patch.page ?? 1,
  }
  const params = new URLSearchParams()

  if (next.status) params.set('status', next.status)
  if (next.view) params.set('view', next.view)
  if (next.issue) params.set('issue', next.issue)
  if (!patch.clearSearch && next.search) params.set('search', next.search)
  if (next.series) params.set('series', next.series)
  if (next.productType) params.set('type', next.productType)
  if (next.category) params.set('category', next.category)
  if (next.attribute) params.set('attribute', next.attribute)
  if (next.brand) params.set('brand', next.brand)
  if (next.mark) params.set('mark', next.mark)
  if (next.showcase) params.set('showcase', next.showcase)
  if (next.page > 1) params.set('page', String(next.page))

  const query = params.toString()
  return query ? `/admin/content/products/list?${query}` : '/admin/content/products/list'
}

function buildWhere(filters: FilterState): { where: string; params: unknown[] } {
  const conditions = ['pc.deleted_at IS NULL']
  const params: unknown[] = []

  if (filters.status) {
    params.push(filters.status)
    conditions.push(`pc.status = $${params.length}`)
  }

  if (filters.view === 'incomplete') {
    conditions.push(PRODUCT_INCOMPLETE_SQL_ALIASED)
  }

  const issueCondition = getIssueCondition(filters.issue)
  if (issueCondition) {
    conditions.push(issueCondition)
  }

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(
      pc.id ILIKE $${params.length}
      OR pc.name_cn ILIKE $${params.length}
      OR pc.name_en ILIKE $${params.length}
      OR COALESCE(pc.detail_slug, '') ILIKE $${params.length}
      OR pc.product_series ILIKE $${params.length}
      OR pc.product_type ILIKE $${params.length}
      OR pc.gen ILIKE $${params.length}
    )`)
  }

  if (filters.series) {
    params.push(filters.series)
    conditions.push(`pc.product_series = $${params.length}`)
  }

  if (filters.productType) {
    params.push(filters.productType)
    conditions.push(`pc.product_type = $${params.length}`)
  }

  const categoryId = Number(filters.category)
  if (Number.isInteger(categoryId) && categoryId > 0) {
    params.push(categoryId)
    conditions.push(`pc.category_id = $${params.length}`)
  }

  const attributeOptionId = Number(filters.attribute)
  if (Number.isInteger(attributeOptionId) && attributeOptionId > 0) {
    params.push(attributeOptionId)
    conditions.push(`EXISTS (
      SELECT 1
      FROM product_attribute_values pav
      WHERE pav.product_id = pc.id
        AND pav.option_id = $${params.length}
    )`)
  }

  const brandId = Number(filters.brand)
  if (Number.isInteger(brandId) && brandId > 0) {
    params.push(brandId)
    conditions.push(`pc.brand_id = $${params.length}`)
  }

  const markId = Number(filters.mark)
  if (Number.isInteger(markId) && markId > 0) {
    params.push(markId)
    conditions.push(`EXISTS (
      SELECT 1
      FROM product_mark_values pmv
      WHERE pmv.product_id = pc.id
        AND pmv.mark_id = $${params.length}
    )`)
  }

  const showcaseId = Number(filters.showcase)
  if (Number.isInteger(showcaseId) && showcaseId > 0) {
    params.push(showcaseId)
    conditions.push(`EXISTS (
      SELECT 1
      FROM product_showcase_items psi
      WHERE psi.product_id = pc.id
        AND psi.showcase_id = $${params.length}
    )`)
  }

  return { where: `WHERE ${conditions.join(' AND ')}`, params }
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content-products-list] ${label} failed`, err)
    return fallback
  }
}

async function getProductSummary(): Promise<ProductSummary> {
  if (!(await tableExists('public.product_catalog'))) return EMPTY_SUMMARY
  await ensureProductCatalogSchema()

  const [res, deleted] = await Promise.all([
    pool.query<{
    total: string
    published: string
    draft: string
    incomplete: string
    }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE ${PRODUCT_INCOMPLETE_SQL})::text AS incomplete
     FROM product_catalog
     WHERE deleted_at IS NULL`,
    ),
    countDeletedCatalogProducts().catch(() => 0),
  ])
  const row = res.rows[0]
  return {
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    draft: parseCount(row?.draft),
    incomplete: parseCount(row?.incomplete),
    deleted,
  }
}

async function getProductOptions(): Promise<ProductOptions> {
  if (!(await tableExists('public.product_catalog'))) return EMPTY_OPTIONS
  await ensureProductOperationsSchema()

  const [seriesRes, typeRes, categories, attributeTemplates, brands, marks, showcases] = await Promise.all([
    pool.query<{ value: string }>(
      `SELECT DISTINCT product_series AS value
       FROM product_catalog
       WHERE deleted_at IS NULL AND NULLIF(BTRIM(product_series), '') IS NOT NULL
       ORDER BY product_series`,
    ),
    pool.query<{ value: string }>(
      `SELECT DISTINCT product_type AS value
       FROM product_catalog
       WHERE deleted_at IS NULL AND NULLIF(BTRIM(product_type), '') IS NOT NULL
       ORDER BY product_type`,
    ),
    listProductCategories({ includeHidden: false }).catch(() => []),
    listProductAttributeTemplatesWithOptions({ includeHidden: false }).catch(() => []),
    listProductBrands({ includeHidden: false }).catch(() => []),
    listProductMarks({ includeHidden: false }).catch(() => []),
    listProductShowcases({ includeHidden: false }).catch(() => []),
  ])

  return {
    series: seriesRes.rows.map((row) => row.value),
    productTypes: typeRes.rows.map((row) => row.value),
    categories: categories.map((category) => ({
      id: category.id,
      title_zh: category.title_zh,
      title_en: category.title_en,
    })),
    attributeTemplates,
    brands: brands.map((brand) => ({
      id: brand.id,
      title_zh: brand.title_zh,
      title_en: brand.title_en,
      status: brand.status,
    })),
    marks: marks.map((mark) => ({
      id: mark.id,
      title_zh: mark.title_zh,
      title_en: mark.title_en,
      status: mark.status,
    })),
    showcases: showcases.map((showcase) => ({
      id: showcase.id,
      title_zh: showcase.title_zh,
      title_en: showcase.title_en,
      status: showcase.status,
    })),
  }
}

async function getProducts(filters: FilterState): Promise<ProductListResult> {
  if (!(await tableExists('public.product_catalog'))) return { rows: [], total: 0 }
  await ensureProductOperationsSchema()

  const { where, params } = buildWhere(filters)
  const countRes = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM product_catalog pc ${where}`, params)
  const total = parseCount(countRes.rows[0]?.count)
  const offset = (filters.page - 1) * PAGE_SIZE

  const listRes = await pool.query<ProductListRow>(
    `SELECT
       pc.id,
       pc.product_series,
       pc.name_cn,
       pc.name_en,
       pc.gen,
       pc.product_type,
       pc.image,
       pc.description_cn,
       pc.description_en,
       COALESCE(pc.gallery, '[]'::jsonb) AS gallery,
       COALESCE(pc.tags_cn, '[]'::jsonb) AS tags_cn,
       COALESCE(pc.tags_en, '[]'::jsonb) AS tags_en,
       COALESCE(pc.features_cn, '[]'::jsonb) AS features_cn,
       COALESCE(pc.features_en, '[]'::jsonb) AS features_en,
       COALESCE(pc.detail_modules, '[]'::jsonb) AS detail_modules,
       pc.detail_slug,
       pc.category_id,
       c.slug AS category_slug,
       c.title_zh AS category_title_zh,
       c.title_en AS category_title_en,
       pc.brand_id,
       b.title_zh AS brand_title_zh,
       b.title_en AS brand_title_en,
       COALESCE(attr.option_count, 0)::int AS attribute_option_count,
       COALESCE(attr.labels_zh, ARRAY[]::text[]) AS attribute_labels_zh,
       COALESCE(mark_agg.labels_zh, ARRAY[]::text[]) AS mark_labels_zh,
       COALESCE(showcase_agg.titles_zh, ARRAY[]::text[]) AS showcase_titles_zh,
       pc.price_display_zh,
       pc.price_display_en,
       COALESCE(pc.commercial_terms, '{}'::jsonb) AS commercial_terms,
       COALESCE(pc.keywords_zh, ARRAY[]::text[]) AS keywords_zh,
       COALESCE(pc.keywords_en, ARRAY[]::text[]) AS keywords_en,
       COALESCE(pc.related_product_ids, ARRAY[]::text[]) AS related_product_ids,
       pc.seo_title_zh,
       pc.seo_title_en,
       pc.seo_description_zh,
       pc.seo_description_en,
       pc.status,
       pc.created_at::text AS created_at,
       pc.updated_at::text AS updated_at
     FROM product_catalog pc
     LEFT JOIN product_categories c
       ON c.id = pc.category_id
      AND c.deleted_at IS NULL
     LEFT JOIN product_brands b
       ON b.id = pc.brand_id
      AND b.deleted_at IS NULL
     LEFT JOIN LATERAL (
       SELECT
         COUNT(DISTINCT o.id)::int AS option_count,
         ARRAY_AGG(DISTINCT CONCAT(t.title_zh, '：', o.label_zh)) AS labels_zh
       FROM product_attribute_values pav
       JOIN product_attribute_options o
         ON o.id = pav.option_id
        AND o.deleted_at IS NULL
       JOIN product_attribute_templates t
         ON t.id = pav.template_id
        AND t.deleted_at IS NULL
       WHERE pav.product_id = pc.id
     ) attr ON true
     LEFT JOIN LATERAL (
       SELECT ARRAY_AGG(DISTINCT m.title_zh) AS labels_zh
       FROM product_mark_values pmv
       JOIN product_marks m
         ON m.id = pmv.mark_id
        AND m.deleted_at IS NULL
       WHERE pmv.product_id = pc.id
     ) mark_agg ON true
     LEFT JOIN LATERAL (
       SELECT ARRAY_AGG(DISTINCT s.title_zh) AS titles_zh
       FROM product_showcase_items psi
       JOIN product_showcases s
         ON s.id = psi.showcase_id
        AND s.deleted_at IS NULL
       WHERE psi.product_id = pc.id
     ) showcase_agg ON true
     ${where}
     ORDER BY pc.updated_at DESC, pc.sort_order ASC, pc.id ASC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, PAGE_SIZE, offset],
  )

  return { rows: listRes.rows, total }
}

function getSideNavGroups(summary: ProductSummary): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: summary.total, Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'drafts', label: '草稿内容', href: '/admin/content/products/list?status=draft', badge: summary.draft, Icon: FileText },
        { key: 'todo', label: '待补内容', href: '/admin/content/products/list?view=incomplete', badge: summary.incomplete, Icon: CircleDashed },
        { key: 'checks', label: '发布前检查', planned: true, Icon: SearchCheck },
      ],
    },
    {
      title: '内容类型',
      items: [
        { key: 'projects', label: '项目案例', planned: true, Icon: Layers3 },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: FileText },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
        { key: 'marks', label: '标记管理', href: '/admin/content/products/marks', Icon: Tags },
        { key: 'brands', label: '品牌管理', href: '/admin/content/products/brands', Icon: Package },
        { key: 'filters', label: '筛选管理', href: '/admin/content/products/filters', Icon: Filter },
        { key: 'showcases', label: '橱窗管理', href: '/admin/content/products/showcases', Icon: ListChecks },
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: summary.deleted, Icon: Archive },
        { key: 'bulk-check', label: '批量检查', planned: true, Icon: ListChecks },
      ],
    },
  ]
}

function SummaryCards({ summary }: { summary: ProductSummary }) {
  const cards: StatCard[] = [
    { title: '产品总数', value: summary.total, detail: '当前未删除产品', tone: 'blue' },
    { title: '已发布', value: summary.published, detail: '前台可展示', tone: 'green' },
    { title: '草稿', value: summary.draft, detail: '待检查或待发布', tone: 'orange' },
    { title: '待补内容', value: summary.incomplete, detail: '至少一项基础内容缺失', tone: 'neutral' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#61767D]">{card.title}</p>
          <p
            className={`mt-3 text-3xl font-bold ${
              card.tone === 'green'
                ? 'text-emerald-700'
                : card.tone === 'orange'
                  ? 'text-[#E36F2C]'
                  : card.tone === 'neutral'
                    ? 'text-[#61767D]'
                    : 'text-[#1889B6]'
            }`}
          >
            {formatNumber(card.value)}
          </p>
          <p className="mt-2 text-xs text-[#8A9EA4]">{card.detail}</p>
        </div>
      ))}
    </div>
  )
}

function StatusTabs({ filters, summary }: { filters: FilterState; summary: ProductSummary }) {
  const tabs = [
    { label: '全部', href: createHref(filters, { status: '', view: '', issue: '' }), active: !filters.status && !filters.view && !filters.issue, count: summary.total },
    {
      label: '已发布',
      href: createHref(filters, { status: 'published', view: '', issue: '' }),
      active: filters.status === 'published' && !filters.view && !filters.issue,
      count: summary.published,
    },
    {
      label: '草稿',
      href: createHref(filters, { status: 'draft', view: '', issue: '' }),
      active: filters.status === 'draft' && !filters.view && !filters.issue,
      count: summary.draft,
    },
    {
      label: '待补内容',
      href: createHref(filters, { status: '', view: 'incomplete' }),
      active: filters.view === 'incomplete',
      count: summary.incomplete,
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
            tab.active
              ? 'border-[#E36F2C] bg-[#E36F2C] text-white'
              : 'border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]'
          }`}
        >
          {tab.label}
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab.active ? 'bg-white/20 text-white' : 'bg-[#FFF2E7] text-[#E36F2C]'}`}>
            {formatNumber(tab.count)}
          </span>
        </Link>
      ))}
    </div>
  )
}

function FilterPanel({ filters, options }: { filters: FilterState; options: ProductOptions }) {
  return (
    <form action="/admin/content/products/list" className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      {filters.status && <input type="hidden" name="status" value={filters.status} />}
      {filters.view && <input type="hidden" name="view" value={filters.view} />}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#61767D]">
          搜索产品
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9EA4]" size={16} />
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="名称、ID、slug、系列、类型"
              className="h-10 w-full rounded-md border border-[#D8E7E8] bg-white pl-9 pr-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
            />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#61767D]">
          系列
          <select
            name="series"
            defaultValue={filters.series}
            className="h-10 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
          >
            <option value="">全部系列</option>
            {options.series.map((series) => (
              <option key={series} value={series}>
                {series}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#61767D]">
          类型
          <select
            name="type"
            defaultValue={filters.productType}
            className="h-10 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
          >
            <option value="">全部类型</option>
            {options.productTypes.map((type) => (
              <option key={type} value={type}>
                {getProductTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#61767D]">
          分类
          <select
            name="category"
            defaultValue={filters.category}
            className="h-10 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
          >
            <option value="">全部分类</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title_zh}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#61767D]">
          缺项
          <select
            name="issue"
            defaultValue={filters.issue}
            className="h-10 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
          >
            {PRODUCT_ISSUE_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#61767D]">
          属性
          <select
            name="attribute"
            defaultValue={filters.attribute}
            className="h-10 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
          >
            <option value="">全部属性</option>
            {options.attributeTemplates.map((template) => (
              <optgroup key={template.id} label={template.title_zh}>
                {template.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label_zh}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#61767D]">
          品牌
          <select
            name="brand"
            defaultValue={filters.brand}
            className="h-10 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
          >
            <option value="">全部品牌</option>
            {options.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.title_zh}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#61767D]">
          标记
          <select
            name="mark"
            defaultValue={filters.mark}
            className="h-10 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
          >
            <option value="">全部标记</option>
            {options.marks.map((mark) => (
              <option key={mark.id} value={mark.id}>
                {mark.title_zh}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#61767D]">
          橱窗
          <select
            name="showcase"
            defaultValue={filters.showcase}
            className="h-10 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
          >
            <option value="">全部橱窗</option>
            {options.showcases.map((showcase) => (
              <option key={showcase.id} value={showcase.id}>
                {showcase.title_zh}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1889B6] px-4 text-sm font-semibold text-white transition hover:bg-[#126D91]"
        >
          <Filter size={16} />
          筛选
        </button>
        <Link
          href="/admin/content/products/list"
          className="mt-auto inline-flex h-10 items-center justify-center rounded-md border border-[#D8E7E8] bg-white px-4 text-sm font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
        >
          清空
        </Link>
      </div>
    </form>
  )
}

function QuickActions() {
  const links: QuickLink[] = [
    { label: '新增产品', href: '/admin/content/products/new', Icon: Plus, primary: true },
    { label: '查看草稿', href: '/admin/content/products/list?status=draft', Icon: FileText },
    { label: '查看已发布', href: '/admin/content/products/list?status=published', Icon: CheckCircle2 },
    { label: '分类管理', href: '/admin/content/products/categories', Icon: Tags },
    { label: '属性模板', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
    { label: '标记管理', href: '/admin/content/products/marks', Icon: Tags },
    { label: '品牌管理', href: '/admin/content/products/brands', Icon: Package },
    { label: '筛选管理', href: '/admin/content/products/filters', Icon: Filter },
    { label: '橱窗管理', href: '/admin/content/products/showcases', Icon: ListChecks },
    { label: '回收站', href: '/admin/content/products/recycle', Icon: Archive },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
            link.primary
              ? 'bg-[#E36F2C] text-white hover:bg-[#C95E22]'
              : 'border border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]'
          }`}
        >
          <link.Icon size={16} />
          {link.label}
        </Link>
      ))}
    </div>
  )
}

function ProductList({
  rows,
  total,
  filters,
  categories,
  marks,
  showcases,
}: {
  rows: ProductListRow[]
  total: number
  filters: FilterState
  categories: Pick<ProductCategoryRow, 'id' | 'title_zh' | 'title_en'>[]
  marks: Pick<ProductMarkRow, 'id' | 'title_zh' | 'title_en' | 'status'>[]
  showcases: Pick<ProductShowcaseRow, 'id' | 'title_zh' | 'title_en' | 'status'>[]
}) {
  if (rows.length === 0) {
    return <EmptyState filters={filters} />
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">产品列表</h2>
          <p className="mt-1 text-sm text-[#61767D]">
            当前筛选下共 {formatNumber(total)} 个产品，本页显示 {formatNumber(rows.length)} 个。
          </p>
        </div>
      </div>
      <ProductBatchCategoryBar categories={categories} marks={marks} showcases={showcases} />
      <div className="space-y-3">
        {rows.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </div>
      <Pagination filters={filters} total={total} />
    </section>
  )
}

function ProductRow({ product }: { product: ProductListRow }) {
  const issues = getProductIssues(product)
  const label = getCompletenessLabel(issues)
  const visibleIssues = issues.slice(0, 3)
  const hiddenIssueCount = Math.max(0, issues.length - visibleIssues.length)
  const attributeLabels = (product.attribute_labels_zh ?? []).slice(0, 3)
  const hiddenAttributeCount = Math.max(0, Number(product.attribute_option_count ?? 0) - attributeLabels.length)
  const markLabels = (product.mark_labels_zh ?? []).slice(0, 3)
  const showcaseTitles = (product.showcase_titles_zh ?? []).slice(0, 2)
  const published = product.status === 'published'
  const routeInfo = getCatalogProductRouteInfo({
    id: product.id,
    detailSlug: product.detail_slug,
  })

  return (
    <article className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm transition hover:border-[#1889B6]/55 hover:shadow-md">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[28px_96px_minmax(0,1fr)_220px_168px] lg:items-center">
        <label className="flex h-9 w-9 items-center justify-center rounded-md border border-[#D8E7E8] bg-white" title="选择产品">
          <input
            type="checkbox"
            value={product.id}
            data-product-batch-checkbox
            className="h-4 w-4 accent-[#E36F2C]"
          />
        </label>
        <div className="h-24 w-full overflow-hidden rounded-md bg-[#E6EEEE] lg:h-16 lg:w-24">
          {hasText(product.image) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image ?? ''} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#8A9EA4]">
              <ImageIcon size={20} />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-[#1E2C31]">{product.name_cn || product.name_en || product.id}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                published ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
              }`}
            >
              {published ? '已发布' : '草稿'}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${completenessClass(label)}`}>
              {label}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-[#61767D]">{product.name_en}</p>
          <p className="mt-1 text-xs text-[#8A9EA4]">
            {product.detail_slug ? `${product.id} / ${product.detail_slug}` : product.id}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#8A8580]">
            <span className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-[#61767D]">
              官方前台：{routeInfo.publicLabel}
            </span>
            <span className="max-w-[240px] truncate rounded-full border border-[#E5DED4] bg-[#FAF7F2] px-2 py-0.5">
              {routeInfo.publicHref}
            </span>
            {routeInfo.usesCuratedDetail ? (
              <span className="max-w-[240px] truncate rounded-full border border-[#E5DED4] bg-[#FAF7F2] px-2 py-0.5">
                CMS：{routeInfo.cmsHref}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleIssues.length === 0 ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                基础内容完整
              </span>
            ) : (
              visibleIssues.map((issue) => (
                <span key={issue} className={`rounded-full border px-2 py-0.5 text-xs ${issueClass(issue)}`}>
                  {issue}
                </span>
              ))
            )}
            {hiddenIssueCount > 0 && (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">
                还有 {hiddenIssueCount} 项
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {attributeLabels.length > 0 ? (
              <>
                {attributeLabels.map((attribute) => (
                  <span key={attribute} className="rounded-full border border-[#D8E7E8] bg-[#F0F7F8] px-2 py-0.5 text-xs font-semibold text-[#1889B6]">
                    {attribute}
                  </span>
                ))}
                {hiddenAttributeCount > 0 ? (
                  <span className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-xs text-[#61767D]">
                    还有 {hiddenAttributeCount} 个属性
                  </span>
                ) : null}
              </>
            ) : (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                缺产品属性
              </span>
            )}
          </div>
          {(markLabels.length > 0 || showcaseTitles.length > 0 || product.brand_title_zh) ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.brand_title_zh ? (
                <span className="rounded-full border border-[#F2C6A7] bg-[#FFF7F0] px-2 py-0.5 text-xs font-semibold text-[#B85D21]">
                  品牌：{product.brand_title_zh}
                </span>
              ) : null}
              {markLabels.map((mark) => (
                <span key={mark} className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-xs font-semibold text-[#61767D]">
                  {mark}
                </span>
              ))}
              {showcaseTitles.map((showcase) => (
                <span key={showcase} className="rounded-full border border-[#D8E7E8] bg-[#F7FAFA] px-2 py-0.5 text-xs font-semibold text-[#1889B6]">
                  橱窗：{showcase}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md bg-[#F7FAFA] p-3 text-xs lg:grid-cols-1">
          <ProductMeta label="系列" value={`${product.product_series} ${product.gen}`} />
          <ProductMeta label="类型" value={getProductTypeLabel(product.product_type)} />
          <ProductMeta label="分类" value={product.category_title_zh ?? '未分类'} />
          <ProductMeta label="品牌" value={product.brand_title_zh ?? '未标记'} />
          <ProductMeta label="属性" value={`${Number(product.attribute_option_count ?? 0)} 个`} />
          <ProductMeta label="橱窗" value={showcaseTitles.length > 0 ? showcaseTitles.join(' / ') : '未加入'} />
          <ProductMeta label="更新时间" value={formatDate(product.updated_at)} />
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {published ? (
            <Link
              href={productPreviewHref(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
            >
              <ExternalLink size={14} />
              预览
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] px-3 text-xs font-semibold text-[#9AA9AD]">
              <ExternalLink size={14} />
              草稿
            </span>
          )}
          <Link
            href={`/admin/content/products/${product.id}/edit`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
          >
            <Pencil size={14} />
            编辑
          </Link>
          <ProductListDeleteAction
            productId={product.id}
            productName={product.name_cn || product.name_en || product.id}
          />
        </div>
      </div>
    </article>
  )
}

function ProductMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0">
      <span className="block text-[#8A9EA4]">{label}</span>
      <span className="mt-1 block truncate font-semibold text-[#1E2C31]">{value || '未标记'}</span>
    </span>
  )
}

function EmptyState({ filters }: { filters: FilterState }) {
  const hasFilter = Boolean(
    filters.status
    || filters.view
    || filters.issue
    || filters.search
    || filters.series
    || filters.productType
    || filters.category
    || filters.attribute
    || filters.brand
    || filters.mark
    || filters.showcase
  )
  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white p-10 text-center">
      <Package className="mx-auto text-[#8A9EA4]" size={36} />
      <h2 className="mt-4 text-lg font-bold text-[#1E2C31]">{hasFilter ? '没有符合条件的产品' : '还没有产品'}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#61767D]">
        {hasFilter ? '可以清空筛选，或换一个关键词继续查找。' : '可以先新建一个产品草稿，再补齐图片、中英文内容和详情模块。'}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {hasFilter && (
          <Link
            href="/admin/content/products/list"
            className="inline-flex h-10 items-center rounded-md border border-[#D8E7E8] bg-white px-4 text-sm font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
          >
            清空筛选
          </Link>
        )}
        <Link
          href="/admin/content/products/new"
          className="inline-flex h-10 items-center rounded-md bg-[#E36F2C] px-4 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
        >
          新增产品
        </Link>
      </div>
    </section>
  )
}

function Pagination({ filters, total }: { filters: FilterState; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-3 text-sm">
      <span className="text-[#61767D]">
        第 {formatNumber(filters.page)} / {formatNumber(totalPages)} 页
      </span>
      <div className="flex gap-2">
        <PaginationLink disabled={filters.page <= 1} href={createHref(filters, { page: Math.max(1, filters.page - 1) })}>
          上一页
        </PaginationLink>
        <PaginationLink disabled={filters.page >= totalPages} href={createHref(filters, { page: Math.min(totalPages, filters.page + 1) })}>
          下一页
        </PaginationLink>
      </div>
    </div>
  )
}

function PaginationLink({ children, disabled, href }: { children: string; disabled: boolean; href: string }) {
  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center rounded-md border border-[#E6EEEE] bg-[#F7FAFA] px-3 font-semibold text-[#9AA9AD]">
        {children}
      </span>
    )
  }
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-3 font-semibold text-[#1E2C31] transition hover:border-[#1889B6] hover:text-[#1889B6]"
    >
      {children}
    </Link>
  )
}

export default async function AdminContentProductsListPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const filters = parseFilters(await searchParams)
  const [summary, options, list] = await Promise.all([
    safeLoad('product summary', getProductSummary, EMPTY_SUMMARY),
    safeLoad('product options', getProductOptions, EMPTY_OPTIONS),
    safeLoad('product list', () => getProducts(filters), { rows: [], total: 0 }),
  ])
  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="内容管理"
      description="按产品、项目和新闻处理发布、草稿和待补内容。"
      sideNavGroups={getSideNavGroups(summary)}
      activeItem="product-list"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">产品管理</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">产品列表</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
              按状态、系列和完整度快速找到要处理的产品；日常编辑进入新版编辑页，维护列表仅作为备用入口。
            </p>
          </div>
          <QuickActions />
        </div>
      </section>

      <div className="space-y-6">
        <SummaryCards summary={summary} />
        <StatusTabs filters={filters} summary={summary} />
        <FilterPanel filters={filters} options={options} />
        <ProductList
          rows={list.rows}
          total={list.total}
          filters={filters}
          categories={options.categories}
          marks={options.marks}
          showcases={options.showcases}
        />
      </div>
    </AdminSectionShell>
  )
}
