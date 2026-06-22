import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  AdminActionLink,
  AdminMetricCard,
  AdminPageHero,
  AdminSectionTitle,
  AdminSegmentTabs,
} from '@/components/admin/AdminUI'
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
import { formatAnalyticsPercent, loadConversionPathAnalytics, type AnalyticsConversionMetric } from '@/lib/site-analytics'
import {
  Archive,
  ArrowRight,
  BarChart3,
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

type ProductIssueSummary = Record<Exclude<ProductIssue, ''>, number>

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
  Icon: LucideIcon
}

type QuickLink = {
  label: string
  href: string
  Icon: LucideIcon
  primary?: boolean
}

type ActiveFilterChip = {
  label: string
  value: string
  href: string
}

type ProductIssueBucket = {
  issue: Exclude<ProductIssue, ''>
  label: string
  detail: string
}

type ProductPriorityItem = {
  product: ProductListRow
  issues: string[]
  label: string
  score: number
}

type ProductRowNextAction = {
  label: string
  detail: string
  href: string
  tone: 'blue' | 'green' | 'orange'
  external?: boolean
}

type ProductProofBackflowItem = {
  product: ProductListRow
  issues: string[]
  proofGaps: string[]
  readiness: number
  previewHref: string
  editHref: string
}

type ProductDraftRecoveryItem = {
  product: ProductListRow
  issues: string[]
  recoveryGaps: string[]
  readiness: number
  editHref: string
}

type ProductSourceContract = {
  label: string
  value: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'gray'
}

const EMPTY_SUMMARY: ProductSummary = {
  total: 0,
  published: 0,
  draft: 0,
  incomplete: 0,
  deleted: 0,
}

const EMPTY_ISSUE_SUMMARY: ProductIssueSummary = {
  media: 0,
  content: 0,
  category: 0,
  attributes: 0,
  seo: 0,
  price: 0,
  commercial: 0,
  keywords: 0,
  related: 0,
  buyer_resources: 0,
}

const EMPTY_PRODUCT_PATH_METRIC: AnalyticsConversionMetric = {
  views: 0,
  ctaClicks: 0,
  formSubmits: 0,
  leads: 0,
  conversionRate: 0,
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
  { value: 'keywords', label: '缺关键词' },
  { value: 'related', label: '缺关联产品' },
  { value: 'buyer_resources', label: '缺买家资料' },
]

const PRODUCT_ISSUE_BUCKETS: ProductIssueBucket[] = [
  { issue: 'media', label: '素材缺口', detail: '封面或图库缺失' },
  { issue: 'content', label: '内容缺口', detail: '简介、标签、亮点或详情模块缺失' },
  { issue: 'category', label: '分类缺口', detail: '未绑定产品分类' },
  { issue: 'attributes', label: '属性缺口', detail: '缺少可筛选属性' },
  { issue: 'seo', label: 'SEO 缺口', detail: '标题或描述缺失' },
  { issue: 'price', label: '价格展示', detail: '缺少中英文价格展示口径' },
  { issue: 'commercial', label: '商务条款', detail: '中英文商务条款不完整' },
  { issue: 'keywords', label: '关键词', detail: '缺少搜索和 SEO 关键词' },
  { issue: 'related', label: '关联产品', detail: '缺少相关产品推荐' },
  { issue: 'buyer_resources', label: '买家资料', detail: '缺少下载或资源链接' },
]

const PRIORITY_ISSUES = ['缺封面', '缺图库', '未分类', '缺 SEO', '缺关键词', '缺关联产品', '缺买家资料']
const CONVERSION_RISK_ISSUES = ['缺 SEO', '缺价格展示', '缺中英文商务条款', '缺中文商务条款', '缺英文商务条款', '缺关键词', '缺关联产品', '缺买家资料']
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

function formatPercent(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
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
  if (missing.length === 2) return '缺中英文商务条款'
  return missing[0] === 'zh' ? '缺中文商务条款' : '缺英文商务条款'
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
  if (!hasItems(product.keywords_zh) && !hasItems(product.keywords_en)) issues.push('缺关键词')
  if (!hasItems(product.related_product_ids)) issues.push('缺关联产品')
  if (!hasBuyerResourceLinks(product.detail_modules)) issues.push('缺买家资料')
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

function productRowNextActionClass(tone: ProductRowNextAction['tone']): string {
  if (tone === 'orange') return 'border-[#F2C6A7] bg-[#FFF7F0] text-[#B85D21] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]'
  if (tone === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-500'
  return 'border-[#D8E7E8] bg-[#EAF6F8] text-[#1889B6] hover:border-[#1889B6]'
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

function productHasIssue(issue: ProductIssueBucket['issue'], issues: string[]): boolean {
  if (issue === 'media') return issues.includes('缺封面') || issues.includes('缺图库')
  if (issue === 'content') {
    return issues.some((item) => ['缺中文简介', '缺英文简介', '缺标签', '缺亮点', '缺详情模块'].includes(item))
  }
  if (issue === 'category') return issues.includes('未分类')
  if (issue === 'attributes') return issues.includes('缺产品属性')
  if (issue === 'seo') return issues.includes('缺 SEO')
  if (issue === 'commercial') return issues.some((item) => item.includes('商务条款'))
  if (issue === 'keywords') return issues.includes('缺关键词')
  if (issue === 'related') return issues.includes('缺关联产品')
  if (issue === 'buyer_resources') return issues.includes('缺买家资料')
  return false
}

function getProductPriorityScore(product: ProductListRow, issues: string[]): number {
  let score = 0
  if (product.status === 'draft') score += 8
  if (issues.includes('缺封面') || issues.includes('缺图库')) score += 24
  if (issues.includes('未分类')) score += 18
  if (issues.includes('缺 SEO')) score += 16
  if (issues.includes('精品页绑定缺 CMS 基础字段')) score += 14
  if (issues.includes('缺详情模块')) score += 12
  if (issues.includes('缺买家资料')) score += 8
  score += Math.min(10, Math.max(0, issues.length - 1) * 2)
  return score
}

function getPriorityLabel(issues: string[]): string {
  if (issues.includes('缺封面') || issues.includes('缺图库')) return '先补素材'
  if (issues.includes('未分类')) return '先定分类'
  if (issues.includes('缺 SEO')) return '补 SEO'
  if (issues.includes('精品页绑定缺 CMS 基础字段')) return '补精品页基础字段'
  if (issues.includes('缺详情模块')) return '补详情模块'
  if (issues.includes('缺买家资料')) return '补买家资料'
  if (issues.includes('缺关键词')) return '补关键词'
  if (issues.includes('缺关联产品')) return '补关联推荐'
  return '补运营字段'
}

function productEditHref(product: ProductListRow, anchor = 'publish-check'): string {
  return `/admin/content/products/${product.id}/edit#${anchor}`
}

function getProductRowNextAction(product: ProductListRow, issues: string[]): ProductRowNextAction {
  if (issues.includes('缺封面') || issues.includes('缺图库')) {
    return {
      label: '补素材',
      detail: '先补封面和图库',
      href: productEditHref(product, 'media'),
      tone: 'orange',
    }
  }

  if (issues.includes('未分类') || issues.includes('缺产品属性')) {
    return {
      label: '补分类属性',
      detail: '影响筛选和目录承接',
      href: productEditHref(product, 'attributes'),
      tone: 'orange',
    }
  }

  if (issues.includes('缺 SEO') || issues.includes('缺关键词')) {
    return {
      label: '补 SEO',
      detail: '影响搜索和来源复盘',
      href: productEditHref(product, 'seo'),
      tone: 'orange',
    }
  }

  if (
    issues.includes('缺中文简介')
    || issues.includes('缺英文简介')
    || issues.includes('缺标签')
    || issues.includes('缺亮点')
  ) {
    return {
      label: '补基础内容',
      detail: '完善中英文卖点',
      href: productEditHref(product, 'content'),
      tone: 'orange',
    }
  }

  if (issues.includes('缺详情模块')) {
    return {
      label: '补详情模块',
      detail: '补齐详情页结构',
      href: productEditHref(product, 'details'),
      tone: 'orange',
    }
  }

  if (issues.includes('缺关联产品')) {
    return {
      label: '补关联推荐',
      detail: '完善产品推荐承接',
      href: productEditHref(product, 'relations'),
      tone: 'orange',
    }
  }

  if (issues.includes('缺买家资料')) {
    return {
      label: '补买家资料',
      detail: '补齐下载或资源链接',
      href: productEditHref(product, 'details'),
      tone: 'orange',
    }
  }

  if (
    issues.includes('缺价格展示')
    || issues.some((issue) => issue.includes('商务条款'))
  ) {
    return {
      label: '补转化信息',
      detail: '完善商务与推荐承接',
      href: productEditHref(product, 'commercial'),
      tone: 'orange',
    }
  }

  if (issues.length > 0) {
    return {
      label: '处理缺项',
      detail: '进入发布检查定位问题',
      href: productEditHref(product, 'publish-check'),
      tone: 'orange',
    }
  }

  if (product.status === 'draft') {
    return {
      label: '发布前复核',
      detail: '基础完整，进入发布检查',
      href: productEditHref(product, 'publish-check'),
      tone: 'blue',
    }
  }

  return {
    label: '复核公开页',
    detail: '基础完整，查看前台展示',
    href: productPreviewHref(product),
    tone: 'green',
    external: true,
  }
}

function buildProductPriorityItems(rows: ProductListRow[]): ProductPriorityItem[] {
  return rows
    .map((product) => {
      const issues = getProductIssues(product)
      return {
        product,
        issues,
        label: getPriorityLabel(issues),
        score: getProductPriorityScore(product, issues),
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.product.updated_at).getTime() - new Date(a.product.updated_at).getTime()
    })
    .slice(0, 6)
}

function getProductProofBackflowGaps(product: ProductListRow, issues: string[]): string[] {
  const gaps = new Set<string>()

  if (issues.includes('缺封面') || issues.includes('缺图库')) {
    gaps.add('媒体证明')
  }
  if (
    issues.some((issue) => [
      '缺中文简介',
      '缺英文简介',
      '缺亮点',
      '缺详情模块',
      '精品页绑定缺 CMS 基础字段',
    ].includes(issue))
  ) {
    gaps.add('详情证明')
  }
  if (issues.includes('未分类') || issues.includes('缺产品属性') || issues.includes('缺标签')) {
    gaps.add('适配字段')
  }
  if (issues.includes('缺 SEO') || issues.includes('缺关键词')) {
    gaps.add('搜索入口')
  }
  if (
    issues.includes('缺价格展示')
    || issues.some((issue) => issue.includes('商务条款'))
    || issues.includes('缺关联产品')
    || issues.includes('缺买家资料')
  ) {
    gaps.add('询盘交接')
  }
  if (product.status === 'draft') {
    gaps.add('发布状态')
  }

  return [...gaps]
}

function getProductProofBackflowReadiness(product: ProductListRow, issues: string[], proofGaps: string[]): number {
  const issuePenalty = Math.min(54, issues.length * 6)
  const gapPenalty = Math.min(32, proofGaps.length * 8)
  const statusPenalty = product.status === 'draft' ? 10 : 0
  return Math.max(0, Math.min(100, 100 - issuePenalty - gapPenalty - statusPenalty))
}

function buildProductProofBackflowItems(rows: ProductListRow[]): ProductProofBackflowItem[] {
  return rows
    .map((product) => {
      const issues = getProductIssues(product)
      const proofGaps = getProductProofBackflowGaps(product, issues)
      return {
        product,
        issues,
        proofGaps,
        readiness: getProductProofBackflowReadiness(product, issues, proofGaps),
        previewHref: productPreviewHref(product),
        editHref: `/admin/content/products/${product.id}/edit`,
      }
    })
    .filter((item) => item.proofGaps.length > 0)
    .sort((a, b) => {
      if (a.product.status !== b.product.status) return a.product.status === 'published' ? -1 : 1
      if (a.readiness !== b.readiness) return a.readiness - b.readiness
      if (b.proofGaps.length !== a.proofGaps.length) return b.proofGaps.length - a.proofGaps.length
      return new Date(b.product.updated_at).getTime() - new Date(a.product.updated_at).getTime()
    })
    .slice(0, 5)
}

function getProductDraftRecoveryGaps(product: ProductListRow, issues: string[]): string[] {
  const gaps = new Set<string>()

  if (product.status === 'draft') gaps.add('草稿状态')
  if (!product.category_id) gaps.add('分类待定')
  if (!product.brand_id) gaps.add('品牌待定')
  if (!hasItems(product.mark_labels_zh)) gaps.add('标记待定')
  if (issues.includes('缺封面') || issues.includes('缺图库')) gaps.add('素材待补')
  if (issues.includes('缺产品属性') || issues.includes('缺标签')) gaps.add('适配字段')
  if (issues.includes('缺 SEO') || issues.includes('缺关键词')) gaps.add('搜索口径')
  if (
    issues.includes('缺关联产品')
    || issues.includes('缺买家资料')
    || issues.some((issue) => issue.includes('商务条款'))
  ) {
    gaps.add('询盘交接')
  }

  return [...gaps]
}

function getProductDraftRecoveryReadiness(product: ProductListRow, issues: string[], recoveryGaps: string[]): number {
  const statusPenalty = product.status === 'draft' ? 12 : 0
  const issuePenalty = Math.min(48, issues.length * 5)
  const recoveryPenalty = Math.min(34, Math.max(0, recoveryGaps.length - 1) * 7)
  const brandPenalty = product.brand_id ? 0 : 6
  const markPenalty = hasItems(product.mark_labels_zh) ? 0 : 4
  return Math.max(0, Math.min(100, 100 - statusPenalty - issuePenalty - recoveryPenalty - brandPenalty - markPenalty))
}

function buildProductDraftRecoveryItems(rows: ProductListRow[]): ProductDraftRecoveryItem[] {
  return rows
    .map((product) => {
      const issues = getProductIssues(product)
      const recoveryGaps = getProductDraftRecoveryGaps(product, issues)
      return {
        product,
        issues,
        recoveryGaps,
        readiness: getProductDraftRecoveryReadiness(product, issues, recoveryGaps),
        editHref: `/admin/content/products/${product.id}/edit`,
      }
    })
    .filter((item) => item.product.status === 'draft')
    .sort((a, b) => {
      if (a.readiness !== b.readiness) return a.readiness - b.readiness
      if (b.recoveryGaps.length !== a.recoveryGaps.length) return b.recoveryGaps.length - a.recoveryGaps.length
      return new Date(b.product.updated_at).getTime() - new Date(a.product.updated_at).getTime()
    })
    .slice(0, 5)
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

function displayTitle(zh?: string | null, en?: string | null): string {
  return zh?.trim() || en?.trim() || '未命名'
}

function findOptionTitle<T extends { id: number; title_zh?: string | null; title_en?: string | null }>(
  items: T[],
  value: string,
): string | null {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) return null
  const item = items.find((entry) => entry.id === id)
  return item ? displayTitle(item.title_zh, item.title_en) : null
}

function findAttributeOptionLabel(options: ProductOptions, value: string): string | null {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) return null

  for (const template of options.attributeTemplates) {
    const option = template.options.find((entry) => entry.id === id)
    if (option) return `${template.title_zh}：${option.label_zh}`
  }

  return null
}

function getIssueFilterLabel(issue: ProductIssue): string {
  return PRODUCT_ISSUE_OPTIONS.find((option) => option.value === issue)?.label ?? issue
}

function buildActiveFilterChips(filters: FilterState, options: ProductOptions): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  if (filters.status) {
    chips.push({
      label: '状态',
      value: filters.status === 'published' ? '已发布' : '草稿',
      href: createHref(filters, { status: '' }),
    })
  }

  if (filters.view) {
    chips.push({
      label: '视图',
      value: '待补内容',
      href: createHref(filters, { view: '', issue: '' }),
    })
  }

  if (filters.issue) {
    chips.push({
      label: '缺项',
      value: getIssueFilterLabel(filters.issue),
      href: createHref(filters, { issue: '' }),
    })
  }

  if (filters.search) {
    chips.push({
      label: '搜索',
      value: filters.search,
      href: createHref(filters, { clearSearch: true }),
    })
  }

  if (filters.series) {
    chips.push({ label: '系列', value: filters.series, href: createHref(filters, { series: '' }) })
  }

  if (filters.productType) {
    chips.push({
      label: '类型',
      value: getProductTypeLabel(filters.productType),
      href: createHref(filters, { productType: '' }),
    })
  }

  if (filters.category) {
    chips.push({
      label: '分类',
      value: findOptionTitle(options.categories, filters.category) ?? filters.category,
      href: createHref(filters, { category: '' }),
    })
  }

  if (filters.attribute) {
    chips.push({
      label: '属性',
      value: findAttributeOptionLabel(options, filters.attribute) ?? filters.attribute,
      href: createHref(filters, { attribute: '' }),
    })
  }

  if (filters.brand) {
    chips.push({
      label: '品牌',
      value: findOptionTitle(options.brands, filters.brand) ?? filters.brand,
      href: createHref(filters, { brand: '' }),
    })
  }

  if (filters.mark) {
    chips.push({
      label: '标记',
      value: findOptionTitle(options.marks, filters.mark) ?? filters.mark,
      href: createHref(filters, { mark: '' }),
    })
  }

  if (filters.showcase) {
    chips.push({
      label: '橱窗',
      value: findOptionTitle(options.showcases, filters.showcase) ?? filters.showcase,
      href: createHref(filters, { showcase: '' }),
    })
  }

  return chips
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

async function getProductIssueSummary(): Promise<ProductIssueSummary> {
  if (!(await tableExists('public.product_catalog'))) return EMPTY_ISSUE_SUMMARY
  await ensureProductCatalogSchema()

  const res = await pool.query<Record<Exclude<ProductIssue, ''>, string>>(
    `SELECT
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_MEDIA_SQL_ALIASED})::text AS media,
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_CONTENT_SQL_ALIASED})::text AS content,
       COUNT(*) FILTER (WHERE pc.category_id IS NULL)::text AS category,
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_ATTRIBUTES_SQL_ALIASED})::text AS attributes,
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_SEO_SQL_ALIASED})::text AS seo,
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_PRICE_SQL_ALIASED})::text AS price,
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_COMMERCIAL_SQL_ALIASED})::text AS commercial,
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_KEYWORDS_SQL_ALIASED})::text AS keywords,
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_RELATED_SQL_ALIASED})::text AS related,
       COUNT(*) FILTER (WHERE ${PRODUCT_MISSING_BUYER_RESOURCES_SQL_ALIASED})::text AS buyer_resources
     FROM product_catalog pc
     WHERE pc.deleted_at IS NULL`,
  )
  const row = res.rows[0]

  return {
    media: parseCount(row?.media),
    content: parseCount(row?.content),
    category: parseCount(row?.category),
    attributes: parseCount(row?.attributes),
    seo: parseCount(row?.seo),
    price: parseCount(row?.price),
    commercial: parseCount(row?.commercial),
    keywords: parseCount(row?.keywords),
    related: parseCount(row?.related),
    buyer_resources: parseCount(row?.buyer_resources),
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
        { key: 'create-publish-handoff', label: '发布队列承接', href: '#product-create-publish-queue-handoff', Icon: ArrowRight },
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
        { key: 'bulk-check', label: '批量治理', href: '/admin/content/products/list#product-batch-governance', Icon: ListChecks },
      ],
    },
  ]
}

function SummaryCards({ summary }: { summary: ProductSummary }) {
  const cards: StatCard[] = [
    { title: '产品总数', value: summary.total, detail: '当前未删除产品', tone: 'blue', Icon: Package },
    { title: '已发布', value: summary.published, detail: '前台可展示', tone: 'green', Icon: CheckCircle2 },
    { title: '草稿', value: summary.draft, detail: '待检查或待发布', tone: 'orange', Icon: FileText },
    { title: '待补内容', value: summary.incomplete, detail: '至少一项基础内容缺失', tone: 'neutral', Icon: CircleDashed },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <AdminMetricCard
          key={card.title}
          title={card.title}
          value={formatNumber(card.value)}
          detail={card.detail}
          tone={card.tone}
          Icon={card.Icon}
        />
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

  return <AdminSegmentTabs items={tabs.map((tab) => ({ ...tab, count: formatNumber(tab.count) }))} />
}

function ProductListControlStrip({
  filters,
  options,
  summary,
  issueSummary,
  productPathMetric,
  total,
  rowsCount,
}: {
  filters: FilterState
  options: ProductOptions
  summary: ProductSummary
  issueSummary: ProductIssueSummary
  productPathMetric: AnalyticsConversionMetric
  total: number
  rowsCount: number
}) {
  const chips = buildActiveFilterChips(filters, options)
  const firstRowNumber = total > 0 ? (filters.page - 1) * PAGE_SIZE + 1 : 0
  const lastRowNumber = total > 0 ? Math.min(total, firstRowNumber + rowsCount - 1) : 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const quickLinks = [
    { label: '全部产品', href: '/admin/content/products/list', count: summary.total, active: chips.length === 0 },
    {
      label: '已发布',
      href: createHref(filters, { status: 'published', view: '', issue: '' }),
      count: summary.published,
      active: filters.status === 'published' && !filters.view && !filters.issue,
    },
    {
      label: '草稿',
      href: createHref(filters, { status: 'draft', view: '', issue: '' }),
      count: summary.draft,
      active: filters.status === 'draft' && !filters.view && !filters.issue,
    },
    {
      label: '待补内容',
      href: createHref(filters, { status: '', view: 'incomplete', issue: '' }),
      count: summary.incomplete,
      active: filters.view === 'incomplete' && !filters.issue,
    },
    {
      label: '缺素材',
      href: createHref(filters, { status: '', view: 'incomplete', issue: 'media' }),
      count: null,
      active: filters.issue === 'media',
    },
    {
      label: '缺 SEO',
      href: createHref(filters, { status: '', view: 'incomplete', issue: 'seo' }),
      count: issueSummary.seo,
      active: filters.issue === 'seo',
    },
    {
      label: '产品路径',
      href: '/admin/site/conversion#product-lifecycle-conversion-bridge',
      count: null,
      active: false,
    },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="border-l-4 border-[#1889B6] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">列表控制台</p>
          <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#1E2C31]">当前产品视图</h2>
              <p className="mt-1 text-sm leading-6 text-[#61767D]">
                当前筛选命中 {formatNumber(total)} 个产品，本页显示 {formatNumber(rowsCount)} 个；先用常用入口切视图，再进入下方细筛和批量维护。
              </p>
            </div>
            <Link
              href="/admin/content/products/list"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              清空全部筛选
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-[#FBFDFD] sm:grid-cols-4 lg:border-l lg:border-t-0">
          <ControlStat label="结果总量" value={formatNumber(total)} detail={`第 ${formatNumber(filters.page)} / ${formatNumber(pageCount)} 页`} />
          <ControlStat label="当前区间" value={`${formatNumber(firstRowNumber)}-${formatNumber(lastRowNumber)}`} detail={`每页 ${formatNumber(PAGE_SIZE)} 条`} />
          <ControlStat label="发布率" value={formatPercent(summary.published, summary.total)} detail={`${formatNumber(summary.published)} 已发布`} />
          <ControlStat label="产品路径" value={formatNumber(productPathMetric.views)} detail={`线索 ${formatNumber(productPathMetric.leads)} / ${formatAnalyticsPercent(productPathMetric.conversionRate)}`} />
        </div>
      </div>

      <div className="border-t border-[#E6EEEE] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.08em] text-[#8A9EA4]">当前筛选</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.length > 0 ? (
                chips.map((chip) => (
                  <Link
                    key={`${chip.label}-${chip.value}`}
                    href={chip.href}
                    className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-1 text-xs text-[#61767D] transition hover:border-[#1889B6] hover:bg-[#EAF6F8] hover:text-[#1889B6]"
                  >
                    <span className="font-semibold text-[#1E2C31]">{chip.label}</span>
                    <span className="max-w-[220px] truncate">{chip.value}</span>
                    <span className="text-[#8A9EA4]">移除</span>
                  </Link>
                ))
              ) : (
                <span className="inline-flex min-h-8 items-center rounded-md border border-dashed border-[#D8E7E8] px-2.5 py-1 text-xs font-semibold text-[#8A9EA4]">
                  当前为全部产品视图
                </span>
              )}
            </div>
          </div>

          <div className="grid min-w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[560px] xl:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                  link.active
                    ? 'border-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
                    : 'border-[#D8E7E8] bg-white text-[#61767D] hover:border-[#1889B6] hover:text-[#1889B6]'
                }`}
              >
                <span>{link.label}</span>
                {link.count === null ? (
                  <ArrowRight size={13} />
                ) : (
                  <span className="rounded bg-[#F0F7F8] px-1.5 py-0.5 text-[11px]">{formatNumber(link.count)}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ControlStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-r border-[#E6EEEE] px-4 py-4 last:border-r-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-[#1E2C31]">{value}</p>
      <p className="mt-1 truncate text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function ProductCreatePublishQueueHandoffPanel({
  summary,
  issueSummary,
  rows,
  filters,
  productPathMetric,
}: {
  summary: ProductSummary
  issueSummary: ProductIssueSummary
  rows: ProductListRow[]
  filters: FilterState
  productPathMetric: AnalyticsConversionMetric
}) {
  const pageEntries = rows.map((product) => ({
    product,
    issues: getProductIssues(product),
  }))
  const pageDraftCount = pageEntries.filter((entry) => entry.product.status === 'draft').length
  const pagePublishedRiskCount = pageEntries.filter((entry) => entry.product.status === 'published' && entry.issues.length > 0).length
  const pageIncompleteCount = pageEntries.filter((entry) => entry.issues.length > 0).length
  const activeFilterCount = buildActiveFilterChips(filters, EMPTY_OPTIONS).length
  const publishingGapCount = issueSummary.commercial + issueSummary.keywords + issueSummary.related + issueSummary.buyer_resources
  const draftQueueHref = `${createHref(filters, { status: 'draft', view: 'incomplete', issue: '' })}#product-draft-recovery-readiness-desk`
  const stages: ProductSourceContract[] = [
    {
      label: '发布总览',
      value: 'overview',
      detail: '先回产品管理总览确认新建、审批、单品检查、草稿补齐和公开复盘全链路。',
      href: '/admin/content/products#product-create-publish-flow',
      Icon: BarChart3,
      tone: 'blue',
    },
    {
      label: '新建草稿审批',
      value: 'new',
      detail: '新建前核对分类属性、媒体、关联推荐和发布影响边界。',
      href: '/admin/content/products/new#new-product-draft-approval-desk',
      Icon: Plus,
      tone: 'green',
    },
    {
      label: '表单发布审批',
      value: 'form',
      detail: '在产品表单发布检查区复核保存状态、发布缺项、运营归属和询盘交接。',
      href: '/admin/content/products/new#publish-check',
      Icon: SearchCheck,
      tone: 'gray',
    },
    {
      label: '草稿补齐队列',
      value: formatNumber(summary.draft),
      detail: '回到当前列表锁定草稿缺项，把补齐动作落到筛选和编辑入口。',
      href: draftQueueHref,
      Icon: FileText,
      tone: summary.draft > 0 ? 'orange' : 'green',
    },
    {
      label: '公开目录复盘',
      value: formatNumber(productPathMetric.views),
      detail: '发布后回到公开产品目录和产品路径线索，确认转化是否顺畅。',
      href: '/products',
      Icon: Package,
      tone: productPathMetric.leads > 0 ? 'green' : productPathMetric.views > 0 ? 'orange' : 'gray',
    },
  ]
  const queueCards = [
    {
      label: '当前筛选',
      value: activeFilterCount > 0 ? `${formatNumber(activeFilterCount)} 项` : '全部',
      detail: `本页 ${formatNumber(rows.length)} 条 / 命中筛选 ${formatNumber(pageIncompleteCount)} 条有缺项`,
      href: '#product-batch-governance',
      Icon: Filter,
      tone: activeFilterCount > 0 ? 'blue' : 'gray',
    },
    {
      label: '本页草稿',
      value: formatNumber(pageDraftCount),
      detail: '优先进入草稿补齐队列，再打开单品编辑页复核发布检查。',
      href: draftQueueHref,
      Icon: FileText,
      tone: pageDraftCount > 0 ? 'orange' : 'green',
    },
    {
      label: '发布缺口',
      value: formatNumber(publishingGapCount),
      detail: '商务条款、关键词、关联产品和买家资料会影响询盘承接。',
      href: createHref(filters, { status: '', view: 'incomplete', issue: 'commercial' }),
      Icon: ListChecks,
      tone: publishingGapCount > 0 ? 'orange' : 'green',
    },
    {
      label: '已发布风险',
      value: formatNumber(pagePublishedRiskCount),
      detail: '已发布但仍有缺项的本页产品，应先回编辑页补齐再复盘公开路径。',
      href: createHref(filters, { status: 'published', view: 'incomplete', issue: '' }),
      Icon: CheckCircle2,
      tone: pagePublishedRiskCount > 0 ? 'orange' : 'green',
    },
  ] satisfies Array<{
    label: string
    value: string
    detail: string
    href: string
    Icon: LucideIcon
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  return (
    <section
      id="product-create-publish-queue-handoff"
      data-product-create-publish-queue-handoff="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#E36F2C]">Publish Queue</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新建到发布队列承接摘要</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            汇总发布总览、新建草稿审批、表单发布审批、草稿补齐和公开目录复盘，帮助运营在产品列表里处理发布队列。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products#product-create-publish-flow"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95D22]"
          >
            <BarChart3 size={13} />
            发布总览
          </Link>
          <Link
            href={draftQueueHref}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <FileText size={13} />
            草稿队列
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        <MatrixKpi label="全库草稿" value={formatNumber(summary.draft)} detail="待补齐或发布检查" tone={summary.draft > 0 ? 'orange' : 'green'} />
        <MatrixKpi label="本页草稿" value={formatNumber(pageDraftCount)} detail={`${formatNumber(rows.length)} 条当前结果`} tone={pageDraftCount > 0 ? 'orange' : 'green'} />
        <MatrixKpi label="发布缺口" value={formatNumber(publishingGapCount)} detail="商务/关键词/关联/资料" tone={publishingGapCount > 0 ? 'orange' : 'green'} />
        <MatrixKpi label="产品路径线索" value={formatNumber(productPathMetric.leads)} detail={`${formatNumber(productPathMetric.views)} 访问 / ${formatAnalyticsPercent(productPathMetric.conversionRate)}`} tone={productPathMetric.leads > 0 ? 'green' : productPathMetric.views > 0 ? 'orange' : 'gray'} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_360px] lg:divide-x lg:divide-y-0">
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
          {stages.map((stage) => (
            <ProductSourceContractLink key={stage.label} contract={stage} />
          ))}
        </div>
        <aside className="bg-[#FBFDFD]">
          <div className="border-b border-[#E6EEEE] px-4 py-4">
            <h3 className="text-sm font-bold text-[#1E2C31]">当前列表承接点</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              先切队列，再处理草稿、发布缺口和已发布风险。
            </p>
          </div>
          <div className="divide-y divide-[#E6EEEE]">
            {queueCards.map((card) => {
              const Icon = card.Icon
              const toneClass =
                card.tone === 'green'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : card.tone === 'orange'
                    ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
                    : card.tone === 'blue'
                      ? 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'
                      : 'border-[#D8E7E8] bg-white text-[#61767D]'

              return (
                <Link key={card.label} href={card.href} className="block px-4 py-3 transition hover:bg-white">
                  <span className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${toneClass}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-[#1E2C31]">{card.label}</span>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>
                          {card.value}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </aside>
      </div>
    </section>
  )
}

function ProductOperationsMatrix({
  summary,
  issueSummary,
  rows,
  filters,
  productPathMetric,
}: {
  summary: ProductSummary
  issueSummary: ProductIssueSummary
  rows: ProductListRow[]
  filters: FilterState
  productPathMetric: AnalyticsConversionMetric
}) {
  const pageIssueEntries = rows.map((product) => ({
    product,
    issues: getProductIssues(product),
  }))
  const pageIssueStats = PRODUCT_ISSUE_BUCKETS.map((bucket) => {
    const pageCount = pageIssueEntries.filter((entry) => productHasIssue(bucket.issue, entry.issues)).length
    return {
      ...bucket,
      count: issueSummary[bucket.issue],
      pageCount,
      href: createHref(filters, { view: 'incomplete', issue: bucket.issue }),
    }
  })
  const priorityItems = buildProductPriorityItems(rows)
  const incompleteRate = formatPercent(summary.incomplete, summary.total)
  const publishedRate = formatPercent(summary.published, summary.total)
  const draftRate = formatPercent(summary.draft, summary.total)
  const pageReadyCount = pageIssueEntries.filter((entry) => entry.issues.length === 0).length
  const pagePublishedRiskCount = pageIssueEntries.filter((entry) => entry.product.status === 'published' && entry.issues.length > 0).length
  const pageDraftCount = pageIssueEntries.filter((entry) => entry.product.status === 'draft').length
  const pageConversionRiskCount = pageIssueEntries.filter((entry) => (
    entry.issues.some((issue) => CONVERSION_RISK_ISSUES.includes(issue))
  )).length
  const productPathTone = productPathMetric.leads > 0 ? 'green' : productPathMetric.views > 0 ? 'orange' : 'gray'

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">运营矩阵</p>
            <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品运营处理矩阵</h2>
            <p className="mt-1 text-sm leading-6 text-[#61767D]">
              先看全库发布、草稿和缺口，再按缺项队列进入下钻；当前页命中用于快速判断筛选结果。
            </p>
          </div>
          <Link
            href={createHref(filters, { status: '', view: 'incomplete', issue: '' })}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            查看全部待补
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
          <MatrixKpi label="发布率" value={publishedRate} detail={`${formatNumber(summary.published)} / ${formatNumber(summary.total)}`} tone="green" />
          <MatrixKpi label="缺项率" value={incompleteRate} detail={`${formatNumber(summary.incomplete)} 个待补`} tone={summary.incomplete > 0 ? 'orange' : 'green'} />
          <MatrixKpi label="草稿压力" value={draftRate} detail={`${formatNumber(summary.draft)} 个草稿`} tone={summary.draft > 0 ? 'orange' : 'gray'} />
          <MatrixKpi label="当前页样本" value={formatNumber(rows.length)} detail={`每页最多 ${formatNumber(PAGE_SIZE)} 条`} tone="blue" />
        </div>

        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
          {pageIssueStats.map((bucket) => (
            <Link
              key={bucket.issue}
              href={bucket.href}
              className="group min-h-[118px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-[#F7FAFA] xl:border-b-0"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#1E2C31]">{bucket.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#61767D]">{bucket.detail}</span>
                  <span className="mt-2 block text-[11px] font-semibold text-[#8A9EA4]">
                    本页命中 {formatNumber(bucket.pageCount)}
                  </span>
                </span>
                <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                  bucket.count > 0 ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {formatNumber(bucket.count)}
                </span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] opacity-80 transition group-hover:opacity-100">
                下钻筛选
                <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <aside className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
              <BarChart3 size={17} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#1E2C31]">本页优先处理</h2>
              <p className="mt-1 text-xs text-[#61767D]">按素材、分类、SEO、详情模块和草稿状态排序。</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-[#E6EEEE] bg-[#FBFDFD]">
          <ReadinessMiniStat
            label="本页完整"
            value={formatNumber(pageReadyCount)}
            detail={`${formatPercent(pageReadyCount, rows.length)} 完整率`}
            tone="green"
          />
          <ReadinessMiniStat
            label="发布中有缺项"
            value={formatNumber(pagePublishedRiskCount)}
            detail="已发布但仍需回补"
            tone={pagePublishedRiskCount > 0 ? 'orange' : 'green'}
          />
          <ReadinessMiniStat
            label="草稿待排期"
            value={formatNumber(pageDraftCount)}
            detail="先补关键字段再发布"
            tone={pageDraftCount > 0 ? 'orange' : 'gray'}
          />
          <ReadinessMiniStat
            label="SEO 与转化风险"
            value={formatNumber(pageConversionRiskCount)}
            detail="关键词、资源或商务口径缺失"
            tone={pageConversionRiskCount > 0 ? 'orange' : 'green'}
          />
        </div>
        <div className="border-b border-[#E6EEEE] px-4 py-4">
          <Link
            href="/admin/site/seo#seo-conversion-closure"
            className="group block rounded-md border border-[#D8E7E8] bg-[#FBFDFD] p-3 transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#1E2C31]">产品 SEO 与转化</span>
                <span className="mt-1 block text-xs leading-5 text-[#61767D]">
                  30 天产品路径访问 {formatNumber(productPathMetric.views)}，动作 {formatNumber(productPathMetric.ctaClicks)}，线索 {formatNumber(productPathMetric.leads)}
                </span>
              </span>
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                productPathTone === 'green'
                  ? 'bg-emerald-50 text-emerald-700'
                  : productPathTone === 'orange'
                    ? 'bg-[#FFF2E7] text-[#E36F2C]'
                    : 'bg-[#F0F7F8] text-[#61767D]'
              }`}>
                {formatAnalyticsPercent(productPathMetric.conversionRate)}
              </span>
            </span>
            <span className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex min-h-7 items-center rounded-md border border-[#D8E7E8] bg-white px-2 text-[11px] font-semibold text-[#61767D]">
                缺 SEO {formatNumber(issueSummary.seo)}
              </span>
              <span className="inline-flex min-h-7 items-center rounded-md border border-[#D8E7E8] bg-white px-2 text-[11px] font-semibold text-[#61767D]">
                表单 {formatNumber(productPathMetric.formSubmits)}
              </span>
              <span className="inline-flex min-h-7 items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-2 text-[11px] font-semibold text-[#1889B6] transition group-hover:border-[#1889B6]">
                查看 SEO
                <ArrowRight size={12} />
              </span>
            </span>
          </Link>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href={createHref(filters, { status: '', view: 'incomplete', issue: 'seo' })}
              className="inline-flex min-h-8 items-center justify-between gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              <span>处理产品 SEO</span>
              <span className="rounded bg-[#FFF2E7] px-1.5 py-0.5 text-[11px] text-[#E36F2C]">{formatNumber(issueSummary.seo)}</span>
            </Link>
            <Link
              href="/admin/customers/leads?source_type=product"
              className="inline-flex min-h-8 items-center justify-between gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
            >
              <span>产品线索队列</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
        {priorityItems.length > 0 ? (
          <div className="divide-y divide-[#E6EEEE]">
            {priorityItems.map((item) => (
              <Link
                key={item.product.id}
                href={`/admin/content/products/${item.product.id}/edit`}
                className="block px-4 py-3 transition hover:bg-[#F7FAFA]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#1E2C31]">
                      {item.product.name_cn || item.product.name_en || item.product.id}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[#61767D]">{item.product.id}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-[#FFF2E7] px-2 py-1 text-xs font-bold text-[#E36F2C]">
                    {item.label}
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {item.issues.slice(0, 3).map((issue) => (
                    <span key={issue} className={`rounded-full border px-2 py-0.5 text-[11px] ${issueClass(issue)}`}>
                      {issue}
                    </span>
                  ))}
                  {item.issues.length > 3 ? (
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500">
                      +{item.issues.length - 3}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={28} />
            <p className="mt-3 text-sm font-bold text-[#1E2C31]">当前页无高优先级缺口</p>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">可继续切换筛选条件检查其他产品。</p>
          </div>
        )}
      </aside>
    </section>
  )
}

function ProductFitProofBackflowPanel({
  rows,
  filters,
  productPathMetric,
}: {
  rows: ProductListRow[]
  filters: FilterState
  productPathMetric: AnalyticsConversionMetric
}) {
  const pageBackflowEntries = rows.map((product) => {
    const issues = getProductIssues(product)
    const proofGaps = getProductProofBackflowGaps(product, issues)
    return { product, issues, proofGaps }
  })
  const readyCount = pageBackflowEntries.filter((entry) => entry.issues.length === 0).length
  const backflowGapCount = pageBackflowEntries.filter((entry) => entry.proofGaps.length > 0).length
  const fitGapCount = pageBackflowEntries.filter((entry) => entry.proofGaps.includes('适配字段')).length
  const inquiryGapCount = pageBackflowEntries.filter((entry) => entry.proofGaps.includes('询盘交接')).length
  const backflowItems = buildProductProofBackflowItems(rows)
  const routeCards: Array<{
    label: string
    detail: string
    href: string
    action: string
    Icon: LucideIcon
    external?: boolean
  }> = [
    {
      label: '前台产品目录',
      detail: '核对场景筛选、产品卡片和询盘入口是否能承接当前后台字段。',
      href: '/products',
      action: '打开前台',
      Icon: Package,
      external: true,
    },
    {
      label: '适配字段筛查',
      detail: '优先补分类、产品属性和标签，让客户能按场景、规格和系列判断适配度。',
      href: createHref(filters, { view: 'incomplete', issue: 'attributes' }),
      action: '筛选缺口',
      Icon: SearchCheck,
    },
    {
      label: '买家资料缺口',
      detail: '把详情页证明、下载资料、关联产品和商务口径补齐到询盘前一步。',
      href: createHref(filters, { view: 'incomplete', issue: 'buyer_resources' }),
      action: '查看待补',
      Icon: FileText,
    },
    {
      label: '产品线索队列',
      detail: '从产品来源线索反查内容质量，确认前台路径是否真的带来采购咨询。',
      href: '/admin/customers/leads?source_type=product',
      action: '看线索',
      Icon: ListChecks,
    },
  ]

  return (
    <section
      id="product-fit-proof-backflow"
      data-product-fit-proof-backflow="true"
      className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">Frontstage Feedback</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品适配-详情证明-询盘回流队列</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            把前台路径回到后台检查：先看适配字段，再看详情证明，最后确认询盘交接。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <ExternalLink size={13} />
            前台目录
          </Link>
          <Link
            href="/admin/customers/leads?source_type=product"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#0F6F93]"
          >
            产品线索
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <MatrixKpi
          label="当前页完整"
          value={formatNumber(readyCount)}
          detail={`${formatPercent(readyCount, rows.length)} 完整率`}
          tone="green"
        />
        <MatrixKpi
          label="回流缺口"
          value={formatNumber(backflowGapCount)}
          detail="适配、证明或询盘承接待补"
          tone={backflowGapCount > 0 ? 'orange' : 'green'}
        />
        <MatrixKpi
          label="适配字段缺口"
          value={formatNumber(fitGapCount)}
          detail="分类、属性或标签不足"
          tone={fitGapCount > 0 ? 'orange' : 'green'}
        />
        <MatrixKpi
          label="30 天产品线索"
          value={formatNumber(productPathMetric.leads)}
          detail={`${formatNumber(productPathMetric.views)} 访问 / ${formatNumber(productPathMetric.formSubmits)} 表单`}
          tone={productPathMetric.leads > 0 ? 'green' : productPathMetric.views > 0 ? 'orange' : 'gray'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {routeCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              target={card.external ? '_blank' : undefined}
              rel={card.external ? 'noreferrer' : undefined}
              className="group flex min-h-[136px] flex-col justify-between rounded-md border border-[#D8E7E8] bg-[#FBFDFD] p-4 transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
            >
              <span className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#1889B6] ring-1 ring-[#D8E7E8]">
                  <card.Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#1E2C31]">{card.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
                </span>
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                {card.action}
                {card.external ? <ExternalLink size={12} /> : <ArrowRight size={12} />}
              </span>
            </Link>
          ))}
        </div>

        <aside className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
          <div className="border-b border-[#E6EEEE] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1E2C31]">本页回流优先队列</h3>
                <p className="mt-1 text-xs leading-5 text-[#61767D]">
                  已发布缺口优先；从这里进入预览、筛选和编辑入口。
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-[#FFF2E7] px-2 py-1 text-xs font-bold text-[#E36F2C]">
                询盘缺口 {formatNumber(inquiryGapCount)}
              </span>
            </div>
          </div>
          {backflowItems.length > 0 ? (
            <div className="divide-y divide-[#E6EEEE]">
              {backflowItems.map((item) => (
                <div key={item.product.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1E2C31]">
                        {item.product.name_cn || item.product.name_en || item.product.id}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#61767D]">{item.product.id}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                      item.readiness >= 80
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.readiness >= 55
                          ? 'bg-[#FFF2E7] text-[#E36F2C]'
                          : 'bg-red-50 text-red-700'
                    }`}>
                      {item.readiness}%
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.proofGaps.map((gap) => (
                      <span key={gap} className="rounded-full border border-[#D8E7E8] bg-[#FBFDFD] px-2 py-0.5 text-[11px] font-semibold text-[#61767D]">
                        {gap}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={item.previewHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
                    >
                      <ExternalLink size={12} />
                      预览
                    </Link>
                    <Link
                      href={item.editHref}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
                    >
                      <Pencil size={12} />
                      编辑
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={28} />
              <p className="mt-3 text-sm font-bold text-[#1E2C31]">当前页没有回流缺口</p>
              <p className="mt-1 text-xs leading-5 text-[#61767D]">可以切换筛选条件继续检查其他产品。</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

function ProductLeadContentFeedbackDesk({
  rows,
  filters,
  issueSummary,
  productPathMetric,
}: {
  rows: ProductListRow[]
  filters: FilterState
  issueSummary: ProductIssueSummary
  productPathMetric: AnalyticsConversionMetric
}) {
  const pageEntries = rows.map((product) => {
    const issues = getProductIssues(product)
    const proofGaps = getProductProofBackflowGaps(product, issues)
    return { product, issues, proofGaps }
  })
  const pageContentGapCount = pageEntries.filter((entry) => entry.issues.length > 0).length
  const pagePublishedGapCount = pageEntries.filter((entry) => entry.product.status === 'published' && entry.issues.length > 0).length
  const pageLeadHandoffGapCount = pageEntries.filter((entry) => entry.proofGaps.includes('询盘交接')).length
  const contentBacklogCount =
    issueSummary.seo
    + issueSummary.commercial
    + issueSummary.keywords
    + issueSummary.related
    + issueSummary.buyer_resources
  const productActionCount = productPathMetric.ctaClicks + productPathMetric.formSubmits
  const contentSignal =
    productPathMetric.leads > 0
      ? '已有产品线索，先看活跃队列和跟进风险，再回到本页补 SEO、买家资料、关联产品和商务条款。'
      : productActionCount > 0
        ? '产品路径已有动作但线索样本不足，优先复盘转化断点，同时补齐当前页内容缺口。'
        : productPathMetric.views > 0
          ? '产品路径有访问但缺少动作和线索，先看流量质量，再处理产品列表里的搜索入口和询盘交接缺口。'
          : pageContentGapCount > 0
            ? '当前页仍有内容缺口，先按本区队列补已发布产品和询盘交接字段，等待新的访问和线索样本。'
            : '当前页暂无明显内容缺口，保留跟进、线索、转化和流量入口用于新样本到来后的复盘。'
  const priorityItems = buildProductProofBackflowItems(rows).slice(0, 4)
  const actionCards = [
    {
      label: '跟进分诊',
      value: `${formatNumber(productPathMetric.leads)} 线索`,
      detail: '从产品线索质量、表单阶段和跟进断点回看内容应补什么。',
      href: '/admin/status/leads#product-lead-quality-followup-desk',
      Icon: ListChecks,
      tone: productPathMetric.leads > 0 ? 'orange' : 'blue',
    },
    {
      label: '线索复盘',
      value: 'product 队列',
      detail: '按产品来源查看产品线索、产品表单和 CTA 阶段。',
      href: '/admin/customers/leads?source_type=product#product-lead-ops-review-desk',
      Icon: BarChart3,
      tone: productPathMetric.leads > 0 ? 'orange' : 'blue',
    },
    {
      label: '转化路径',
      value: `${formatNumber(productActionCount)} 动作`,
      detail: '把产品生命周期、转化路径和线索状态放到同一张复盘表。',
      href: '/admin/site/conversion#product-lifecycle-conversion-bridge',
      Icon: Layers3,
      tone: productActionCount > 0 ? 'orange' : 'gray',
    },
    {
      label: '内容回流缺口',
      value: `${formatNumber(contentBacklogCount)} 项`,
      detail: '聚焦 SEO、商务条款、关键词、关联产品和买家资料。',
      href: createHref(filters, { status: '', view: 'incomplete', issue: 'seo' }),
      Icon: SearchCheck,
      tone: contentBacklogCount > 0 ? 'orange' : 'green',
    },
  ] satisfies Array<{
    label: string
    value: string
    detail: string
    href: string
    Icon: LucideIcon
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  return (
    <section
      id="product-content-lead-feedback-desk"
      data-product-content-lead-feedback="true"
      className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">Lead Feedback</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品线索到内容回流优先级</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            把跟进分诊、产品线索复盘、生命周期转化和流量质量回到产品列表，帮助运营判断该补哪些内容。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/status/leads#product-lead-quality-followup-desk"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95D22]"
          >
            <ListChecks size={13} />
            跟进分诊
          </Link>
          <Link
            href="/admin/site/conversion#product-lifecycle-conversion-bridge"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <BarChart3 size={13} />
            转化路径
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <MatrixKpi
          label="产品路径线索"
          value={formatNumber(productPathMetric.leads)}
          detail={`${formatNumber(productPathMetric.views)} 访问 / ${formatNumber(productActionCount)} 动作`}
          tone={productPathMetric.leads > 0 ? 'green' : productPathMetric.views > 0 ? 'orange' : 'gray'}
        />
        <MatrixKpi
          label="当前页内容缺口"
          value={formatNumber(pageContentGapCount)}
          detail={`已发布缺口 ${formatNumber(pagePublishedGapCount)}`}
          tone={pageContentGapCount > 0 ? 'orange' : 'green'}
        />
        <MatrixKpi
          label="询盘交接缺口"
          value={formatNumber(pageLeadHandoffGapCount)}
          detail="商务口径、关联产品或买家资料"
          tone={pageLeadHandoffGapCount > 0 ? 'orange' : 'green'}
        />
        <MatrixKpi
          label="全库回流项"
          value={formatNumber(contentBacklogCount)}
          detail="SEO、关键词、资料与商务口径"
          tone={contentBacklogCount > 0 ? 'orange' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_420px] lg:divide-x lg:divide-y-0">
        <div>
          <div className="border-b border-[#E6EEEE] px-4 py-4">
            <p className="text-sm font-bold text-[#1E2C31]">回流判断</p>
            <p className="mt-2 text-sm leading-6 text-[#61767D]">{contentSignal}</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {actionCards.map((card) => {
              const Icon = card.Icon
              const toneClass =
                card.tone === 'green'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : card.tone === 'orange'
                    ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
                    : card.tone === 'gray'
                      ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
                      : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="group min-h-[158px] px-4 py-4 transition hover:bg-[#F7FAFA]"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#1E2C31]">{card.label}</span>
                      <span className={`mt-2 inline-flex max-w-full rounded-md border px-2.5 py-1 text-xs font-bold ${toneClass}`}>
                        <span className="truncate">{card.value}</span>
                      </span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
                      <Icon size={16} />
                    </span>
                  </span>
                  <span className="mt-3 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                    打开
                    <ArrowRight size={13} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        <aside className="bg-[#FBFDFD]">
          <div className="border-b border-[#E6EEEE] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1E2C31]">本页内容回流队列</h3>
                <p className="mt-1 text-xs leading-5 text-[#61767D]">
                  已发布且影响询盘承接的缺口优先；这里只给编辑和筛选入口。
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-bold text-[#E36F2C] ring-1 ring-[#F2C6A7]">
                {formatNumber(priorityItems.length)}
              </span>
            </div>
          </div>
          {priorityItems.length > 0 ? (
            <div className="divide-y divide-[#E6EEEE]">
              {priorityItems.map((item) => (
                <Link
                  key={item.product.id}
                  href={item.editHref}
                  className="block px-4 py-3 transition hover:bg-white"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#1E2C31]">
                        {item.product.name_cn || item.product.name_en || item.product.id}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[#61767D]">{item.product.id}</span>
                    </span>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                      item.product.status === 'published'
                        ? 'bg-[#FFF2E7] text-[#E36F2C]'
                        : 'bg-[#F0F7F8] text-[#1889B6]'
                    }`}>
                      {item.product.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {item.proofGaps.slice(0, 3).map((gap) => (
                      <span key={gap} className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#61767D]">
                        {gap}
                      </span>
                    ))}
                    {item.proofGaps.length > 3 ? (
                      <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-500">
                        +{item.proofGaps.length - 3}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                    处理内容
                    <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={28} />
              <p className="mt-3 text-sm font-bold text-[#1E2C31]">当前页暂无内容回流缺口</p>
              <p className="mt-1 text-xs leading-5 text-[#61767D]">可保留跟进、线索和转化入口等待新的线索样本。</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

function ProductDraftRecoveryReadinessDesk({
  summary,
  issueSummary,
  rows,
  filters,
}: {
  summary: ProductSummary
  issueSummary: ProductIssueSummary
  rows: ProductListRow[]
  filters: FilterState
}) {
  const pageEntries = rows.map((product) => {
    const issues = getProductIssues(product)
    const recoveryGaps = getProductDraftRecoveryGaps(product, issues)
    return { product, issues, recoveryGaps }
  })
  const pageDraftEntries = pageEntries.filter((entry) => entry.product.status === 'draft')
  const pageDraftContentGapCount = pageDraftEntries.filter((entry) => (
    entry.issues.length > 0 || entry.recoveryGaps.some((gap) => gap !== '草稿状态')
  )).length
  const pageMissingBrandCount = pageDraftEntries.filter((entry) => !entry.product.brand_id).length
  const pageMissingMarkCount = pageDraftEntries.filter((entry) => !hasItems(entry.product.mark_labels_zh)).length
  const pageMissingCategoryCount = pageDraftEntries.filter((entry) => !entry.product.category_id).length
  const draftRecoveryItems = buildProductDraftRecoveryItems(rows)
  const draftRecoverySignal =
    summary.deleted > 0 && summary.draft > 0
      ? `回收站仍有 ${formatNumber(summary.deleted)} 个隔离产品，现有草稿 ${formatNumber(summary.draft)} 个；先确认来源，再在草稿列表补齐分类、品牌和标记。`
      : summary.draft > 0
        ? `当前有 ${formatNumber(summary.draft)} 个草稿，优先把分类、品牌、标记和前台搜索口径补齐，再进入发布前人工检查。`
        : '当前没有草稿压力，本区保留回收站保护、分类、品牌和标记入口，等待后续恢复或新建草稿进入队列。'
  const recoveryCards = [
    {
      label: '恢复保护',
      value: `${formatNumber(summary.deleted)} 回收站`,
      detail: '从回收站确认删除来源、恢复风险和隔离状态。',
      href: '/admin/content/products/recycle#product-recycle-protection-desk',
      Icon: Archive,
      tone: summary.deleted > 0 ? 'orange' : 'green',
    },
    {
      label: '分类治理',
      value: `${formatNumber(issueSummary.category)} 未分类`,
      detail: '恢复或新建草稿先回到分类治理台，避免前台目录和筛选入口断层。',
      href: '/admin/content/products/categories#product-category-readiness-desk',
      Icon: Layers3,
      tone: issueSummary.category > 0 || pageMissingCategoryCount > 0 ? 'orange' : 'green',
    },
    {
      label: '品牌归属',
      value: `${formatNumber(pageMissingBrandCount)} 本页`,
      detail: '草稿缺品牌时先核对品牌治理台，再回到编辑页绑定，避免品牌筛选空转。',
      href: '/admin/content/products/brands#product-brand-readiness-desk',
      Icon: Package,
      tone: pageMissingBrandCount > 0 ? 'orange' : 'blue',
    },
    {
      label: '运营标记',
      value: `${formatNumber(pageMissingMarkCount)} 本页`,
      detail: '草稿缺运营标记时先看标记治理台，保证精选、场景和运营分组可接管。',
      href: '/admin/content/products/marks#product-mark-readiness-desk',
      Icon: Tags,
      tone: pageMissingMarkCount > 0 ? 'orange' : 'blue',
    },
  ] satisfies Array<{
    label: string
    value: string
    detail: string
    href: string
    Icon: LucideIcon
    tone: 'blue' | 'green' | 'orange'
  }>

  return (
    <section
      id="product-draft-recovery-readiness-desk"
      data-product-draft-recovery-readiness="true"
      className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">Draft Recovery</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">恢复后草稿补齐队列</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            汇总回收站保护后的草稿、分类、品牌、标记、素材、SEO 和询盘交接缺口，帮助运营补齐草稿。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={createHref(filters, { status: 'draft', view: '', issue: '' })}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#0F6F93]"
          >
            <FileText size={13} />
            查看草稿
          </Link>
          <Link
            href="/admin/content/products/recycle#product-recycle-protection-desk"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <Archive size={13} />
            恢复保护
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <MatrixKpi
          label="全库草稿"
          value={formatNumber(summary.draft)}
          detail="待补齐或待人工发布检查"
          tone={summary.draft > 0 ? 'orange' : 'green'}
        />
        <MatrixKpi
          label="本页草稿缺口"
          value={formatNumber(pageDraftContentGapCount)}
          detail={`${formatNumber(pageDraftEntries.length)} 个草稿样本`}
          tone={pageDraftContentGapCount > 0 ? 'orange' : 'green'}
        />
        <MatrixKpi
          label="本页分类缺口"
          value={formatNumber(pageMissingCategoryCount)}
          detail="恢复后先定目录归属"
          tone={pageMissingCategoryCount > 0 ? 'orange' : 'green'}
        />
        <MatrixKpi
          label="本页品牌/标记"
          value={`${formatNumber(pageMissingBrandCount)}/${formatNumber(pageMissingMarkCount)}`}
          detail="品牌缺口 / 标记缺口"
          tone={pageMissingBrandCount + pageMissingMarkCount > 0 ? 'orange' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_420px] lg:divide-x lg:divide-y-0">
        <div>
          <div className="border-b border-[#E6EEEE] px-4 py-4">
            <p className="text-sm font-bold text-[#1E2C31]">补齐判断</p>
            <p className="mt-2 text-sm leading-6 text-[#61767D]">{draftRecoverySignal}</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {recoveryCards.map((card) => {
              const Icon = card.Icon
              const toneClass =
                card.tone === 'green'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : card.tone === 'orange'
                    ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
                    : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="group min-h-[158px] px-4 py-4 transition hover:bg-[#F7FAFA]"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#1E2C31]">{card.label}</span>
                      <span className={`mt-2 inline-flex max-w-full rounded-md border px-2.5 py-1 text-xs font-bold ${toneClass}`}>
                        <span className="truncate">{card.value}</span>
                      </span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
                      <Icon size={16} />
                    </span>
                  </span>
                  <span className="mt-3 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                    打开
                    <ArrowRight size={13} />
                  </span>
                </Link>
              )
            })}
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-[#E6EEEE] bg-[#FBFDFD] p-4 sm:grid-cols-3">
            <Link
              href={createHref(filters, { status: 'draft', view: 'incomplete', issue: 'category' })}
              className="inline-flex min-h-9 items-center justify-between gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              <span>草稿分类缺口</span>
              <ArrowRight size={12} />
            </Link>
            <Link
              href={createHref(filters, { status: 'draft', view: 'incomplete', issue: 'attributes' })}
              className="inline-flex min-h-9 items-center justify-between gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
            >
              <span>草稿属性缺口</span>
              <ArrowRight size={12} />
            </Link>
            <Link
              href={createHref(filters, { status: 'draft', view: 'incomplete', issue: 'seo' })}
              className="inline-flex min-h-9 items-center justify-between gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
            >
              <span>草稿 SEO 缺口</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <aside className="bg-[#FBFDFD]">
          <div className="border-b border-[#E6EEEE] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1E2C31]">本页草稿补齐优先队列</h3>
                <p className="mt-1 text-xs leading-5 text-[#61767D]">
                  按发布准备度从低到高排列，只给编辑页和筛选入口。
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-bold text-[#E36F2C] ring-1 ring-[#F2C6A7]">
                {formatNumber(draftRecoveryItems.length)}
              </span>
            </div>
          </div>
          {draftRecoveryItems.length > 0 ? (
            <div className="divide-y divide-[#E6EEEE]">
              {draftRecoveryItems.map((item) => (
                <Link
                  key={item.product.id}
                  href={item.editHref}
                  className="block px-4 py-3 transition hover:bg-white"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#1E2C31]">
                        {item.product.name_cn || item.product.name_en || item.product.id}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[#61767D]">
                        {item.product.id} · 更新 {formatDate(item.product.updated_at)}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                      item.readiness >= 80
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.readiness >= 55
                          ? 'bg-[#FFF2E7] text-[#E36F2C]'
                          : 'bg-red-50 text-red-700'
                    }`}>
                      {item.readiness}%
                    </span>
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {item.recoveryGaps.slice(0, 4).map((gap) => (
                      <span key={gap} className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#61767D]">
                        {gap}
                      </span>
                    ))}
                    {item.recoveryGaps.length > 4 ? (
                      <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-500">
                        +{item.recoveryGaps.length - 4}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                    打开编辑页补齐
                    <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={28} />
              <p className="mt-3 text-sm font-bold text-[#1E2C31]">当前页暂无草稿补齐项</p>
              <p className="mt-1 text-xs leading-5 text-[#61767D]">可切到草稿筛选或回收站保护台继续检查。</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

function ProductSourceContractPanel({
  issueSummary,
  productPathMetric,
  filters,
}: {
  issueSummary: ProductIssueSummary
  productPathMetric: AnalyticsConversionMetric
  filters: FilterState
}) {
  const sourceContracts: ProductSourceContract[] = [
    {
      label: '卡片 CTA',
      value: 'product:catalog_card_cta',
      detail: '公开产品列表卡片进入询盘路径，对应产品目录浏览后的快速咨询动作。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Acatalog_card_cta',
      Icon: Package,
      tone: 'blue',
    },
    {
      label: '详情 CTA',
      value: 'product:cta_click',
      detail: '产品详情页 Learn More / Appointment 类动作统一回到产品来源阶段复盘。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Acta_click',
      Icon: ExternalLink,
      tone: 'green',
    },
    {
      label: '表单承接',
      value: 'product:inquiry_form',
      detail: '产品询盘表单进入 leads 后，用 source_stage 精确区分表单样本。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Ainquiry_form',
      Icon: ListChecks,
      tone: 'orange',
    },
    {
      label: '线索筛选',
      value: '产品来源',
      detail: '客户线索台按产品来源筛选，处理仍回到现有线索流程。',
      href: '/admin/customers/leads?source_type=product',
      Icon: BarChart3,
      tone: 'blue',
    },
  ]

  return (
    <section id="product-source-contract" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">Source Contract</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品来源线索</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            把公开产品列表、产品详情、询盘表单、产品线索队列和转化复盘放在同一条运营路径里。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/status/traffic#product-conversion-path"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <BarChart3 size={13} />
            路径分析
          </Link>
          <Link
            href="/admin/customers/leads?source_type=product"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <ListChecks size={13} />
            产品线索
          </Link>
          <Link
            href={createHref(filters, { status: '', view: 'incomplete', issue: 'seo' })}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#E36F2C] transition hover:border-[#E36F2C]/60 hover:bg-[#FFF2E7]"
          >
            <SearchCheck size={13} />
            SEO 待补
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <ControlStat label="产品路径访问" value={formatNumber(productPathMetric.views)} detail="近 30 天访问样本" />
        <ControlStat label="产品路径动作" value={formatNumber(productPathMetric.ctaClicks)} detail={`表单 ${formatNumber(productPathMetric.formSubmits)}`} />
        <ControlStat label="产品路径线索" value={formatNumber(productPathMetric.leads)} detail={formatAnalyticsPercent(productPathMetric.conversionRate)} />
        <ControlStat label="SEO 待补" value={formatNumber(issueSummary.seo)} detail="标题、描述或关键词待补" />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {sourceContracts.map((contract) => (
          <ProductSourceContractLink key={contract.label} contract={contract} />
        ))}
      </div>
    </section>
  )
}

function ProductSourceContractLink({ contract }: { contract: ProductSourceContract }) {
  const Icon = contract.Icon
  const toneClass =
    contract.tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : contract.tone === 'orange'
        ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
        : contract.tone === 'gray'
          ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
          : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link
      href={contract.href}
      className="group min-h-[150px] px-4 py-4 transition hover:bg-[#F7FAFA]"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#1E2C31]">{contract.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${toneClass}`}>
            <span className="truncate">{contract.value}</span>
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block text-xs leading-5 text-[#61767D]">{contract.detail}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
        下钻
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function ProductBatchGovernancePanel({
  summary,
  issueSummary,
  rows,
  filters,
  productPathMetric,
}: {
  summary: ProductSummary
  issueSummary: ProductIssueSummary
  rows: ProductListRow[]
  filters: FilterState
  productPathMetric: AnalyticsConversionMetric
}) {
  const taxonomyGapCount = issueSummary.category + issueSummary.attributes
  const publishingGapCount = issueSummary.commercial + issueSummary.keywords + issueSummary.related + issueSummary.buyer_resources
  const pagePublishedRiskCount = rows.filter((product) => (
    product.status === 'published' && getProductIssues(product).length > 0
  )).length
  const pageDraftCount = rows.filter((product) => product.status === 'draft').length
  const activeFilterCount = buildActiveFilterChips(filters, EMPTY_OPTIONS).length
  const sequence = [
    {
      label: '01 定位队列',
      value: formatNumber(summary.incomplete),
      detail: `当前筛选 ${activeFilterCount > 0 ? `${activeFilterCount} 项` : '全部产品'}；先锁定待补、草稿或公开筛选缺口。`,
      href: createHref(filters, { status: '', view: 'incomplete', issue: '' }),
      cta: '进入待补队列',
      Icon: SearchCheck,
      tone: 'blue',
    },
    {
      label: '02 批量归类',
      value: formatNumber(taxonomyGapCount),
      detail: `分类和属性缺口优先处理；本页可勾选 ${formatNumber(rows.length)} 个产品。`,
      href: '#product-batch-tools',
      cta: '打开批量工具',
      Icon: ListChecks,
      tone: taxonomyGapCount > 0 ? 'orange' : 'green',
    },
    {
      label: '03 发布前检查',
      value: formatNumber(publishingGapCount),
      detail: `商务条款、关键词、关联产品和买家资料缺口；本页草稿 ${formatNumber(pageDraftCount)} 个。`,
      href: createHref(filters, { status: 'draft', view: 'incomplete', issue: '' }),
      cta: '查看草稿缺口',
      Icon: FileText,
      tone: publishingGapCount > 0 ? 'orange' : 'green',
    },
    {
      label: '04 发布后复盘',
      value: formatNumber(productPathMetric.views),
      detail: `30 天产品路径访问；线索 ${formatNumber(productPathMetric.leads)}，本页已发布缺口 ${formatNumber(pagePublishedRiskCount)} 个。`,
      href: '/admin/status/traffic#product-conversion-path',
      cta: '查看路径分析',
      Icon: BarChart3,
      tone: productPathMetric.leads > 0 ? 'green' : productPathMetric.views > 0 ? 'orange' : 'gray',
    },
  ] as const
  const supportLinks = [
    {
      label: '新建前准备',
      detail: '先核对分类、属性、媒体、SEO 和关联推荐池，再进入产品表单。',
      href: '/admin/content/products/new#new-product-closure',
      Icon: Plus,
    },
    {
      label: '产品内容',
      detail: '从内容总览回看公开目录、SEO、转化路径和产品线索承接。',
      href: '/admin/content/products#content-closure',
      Icon: Layers3,
    },
    {
      label: '产品 SEO 待补',
      detail: '只看标题、描述和关键词相关缺口，补齐后再看转化数据。',
      href: createHref(filters, { status: '', view: 'incomplete', issue: 'seo' }),
      Icon: SearchCheck,
    },
    {
      label: '产品线索队列',
      detail: '把公开产品路径带来的询盘接回客户运营视角。',
      href: '/admin/customers/leads?source_type=product',
      Icon: BarChart3,
    },
  ]

  return (
    <section id="product-batch-governance" className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">批量治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品列表批量治理工作台</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            按产品列表处理习惯，把公开产品目录筛选、内容缺口、批量分类标记、产品表单发布检查和转化复盘放进同一条操作路径。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products/new#new-product-closure"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95D22]"
          >
            <Plus size={13} />
            新建前准备
          </Link>
          <Link
            href="#product-batch-tools"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <ListChecks size={13} />
            批量工具
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {sequence.map((step) => {
          const Icon = step.Icon
          const toneClass =
            step.tone === 'green'
              ? 'text-emerald-700'
              : step.tone === 'orange'
                ? 'text-[#E36F2C]'
                : step.tone === 'gray'
                  ? 'text-[#61767D]'
                  : 'text-[#1889B6]'

          return (
            <Link
              key={step.label}
              href={step.href}
              className="group min-h-[150px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-xs font-bold tracking-[0.08em] text-[#8A9EA4]">{step.label}</span>
                  <span className={`mt-2 block text-2xl font-bold ${toneClass}`}>{step.value}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
                  <Icon size={16} />
                </span>
              </span>
              <span className="mt-3 block min-h-10 text-xs leading-5 text-[#61767D]">{step.detail}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                {step.cta}
                <ArrowRight size={13} />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {supportLinks.map((link) => {
          const Icon = link.Icon
          return (
            <Link
              key={link.label}
              href={link.href}
              className="group px-4 py-4 transition hover:bg-[#F7FAFA]"
            >
              <span className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6] transition group-hover:bg-[#1889B6] group-hover:text-white">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#1E2C31]">{link.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#61767D]">{link.detail}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                    打开
                    <ArrowRight size={13} />
                  </span>
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function MatrixKpi({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'orange'
        ? 'text-[#E36F2C]'
        : tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <div className="border-b border-[#E6EEEE] px-4 py-3 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function ReadinessMiniStat({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'orange'
        ? 'text-[#E36F2C]'
        : tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <div className="border-t border-[#E6EEEE] px-4 py-3 odd:border-r">
      <p className="truncate text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8A9EA4]">{detail}</p>
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
        <AdminActionLink
          key={link.href}
          href={link.href}
          Icon={link.Icon}
          label={link.label}
          primary={link.primary}
        />
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
        <AdminSectionTitle
          title="产品列表"
          detail={`当前筛选下共 ${formatNumber(total)} 个产品，本页显示 ${formatNumber(rows.length)} 个。`}
        />
      </div>
      <div id="product-batch-tools" className="scroll-mt-24">
        <ProductBatchCategoryBar categories={categories} marks={marks} showcases={showcases} />
      </div>
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E2C31]">当前产品结果</h2>
            <p className="mt-1 text-xs text-[#61767D]">表格视图用于快速扫描状态、缺项、分类、属性和运营标记；勾选后可使用上方批量操作。</p>
          </div>
          <span className="text-xs font-semibold text-[#61767D]">
            每页 {formatNumber(PAGE_SIZE)} 条 / 当前 {formatNumber(rows.length)} 条
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                <th className="w-12 px-3 py-3 text-left font-medium">选</th>
                <th className="px-3 py-3 text-left font-medium">产品</th>
                <th className="w-36 px-3 py-3 text-left font-medium">状态</th>
                <th className="w-52 px-3 py-3 text-left font-medium">分类 / 属性</th>
                <th className="w-72 px-3 py-3 text-left font-medium">待补项</th>
                <th className="w-52 px-3 py-3 text-left font-medium">运营标记</th>
                <th className="w-28 px-3 py-3 text-left font-medium">更新时间</th>
                <th className="w-44 px-3 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination filters={filters} total={total} />
    </section>
  )
}

function ProductRow({ product }: { product: ProductListRow }) {
  const issues = getProductIssues(product)
  const label = getCompletenessLabel(issues)
  const visibleIssues = issues.slice(0, 4)
  const hiddenIssueCount = Math.max(0, issues.length - visibleIssues.length)
  const nextAction = getProductRowNextAction(product, issues)
  const attributeLabels = (product.attribute_labels_zh ?? []).slice(0, 2)
  const hiddenAttributeCount = Math.max(0, Number(product.attribute_option_count ?? 0) - attributeLabels.length)
  const markLabels = (product.mark_labels_zh ?? []).slice(0, 2)
  const showcaseTitles = (product.showcase_titles_zh ?? []).slice(0, 2)
  const published = product.status === 'published'
  const routeInfo = getCatalogProductRouteInfo({
    id: product.id,
    detailSlug: product.detail_slug,
  })

  return (
    <tr className="border-b border-[#E6EEEE] align-top transition last:border-0 hover:bg-[#F7FAFA]">
      <td className="px-3 py-3">
        <label className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D8E7E8] bg-white" title="选择产品">
          <input
            type="checkbox"
            value={product.id}
            data-product-batch-checkbox
            className="h-4 w-4 accent-[#E36F2C]"
          />
        </label>
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-0 gap-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-[#E6EEEE]">
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
            <h3 className="truncate text-base font-bold text-[#1E2C31]">{product.name_cn || product.name_en || product.id}</h3>
            <p className="mt-1 truncate text-sm text-[#61767D]">{product.name_en}</p>
            <p className="mt-1 text-xs text-[#8A9EA4]">{product.detail_slug ? `${product.id} / ${product.detail_slug}` : product.id}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#8A8580]">
              <span className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-[#61767D]">
                {routeInfo.publicLabel}
              </span>
              <span className="max-w-[260px] truncate rounded-full border border-[#E5DED4] bg-[#FAF7F2] px-2 py-0.5">
                {routeInfo.publicHref}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col items-start gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${published ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'}`}>
            {published ? '已发布' : '草稿'}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${completenessClass(label)}`}>{label}</span>
          <span className="text-xs text-[#8A9EA4]">{product.product_series} {product.gen} / {getProductTypeLabel(product.product_type)}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="space-y-2 text-xs">
          <div>
            <span className="block text-[#8A9EA4]">分类</span>
            <span className="font-semibold text-[#1E2C31]">{product.category_title_zh ?? '未分类'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {attributeLabels.length > 0 ? (
              <>
                {attributeLabels.map((attribute) => (
                  <span key={attribute} className="rounded-full border border-[#D8E7E8] bg-[#F0F7F8] px-2 py-0.5 font-semibold text-[#1889B6]">
                    {attribute}
                  </span>
                ))}
                {hiddenAttributeCount > 0 ? (
                  <span className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-[#61767D]">+{hiddenAttributeCount}</span>
                ) : null}
              </>
            ) : (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-zinc-600">缺产品属性</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
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
            {hiddenIssueCount > 0 ? (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">+{hiddenIssueCount} 项</span>
            ) : null}
          </div>
          <Link
            href={nextAction.href}
            target={nextAction.external ? '_blank' : undefined}
            rel={nextAction.external ? 'noopener noreferrer' : undefined}
            className={`inline-flex min-h-8 w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${productRowNextActionClass(nextAction.tone)}`}
          >
            <span className="min-w-0">
              <span className="block truncate">{nextAction.label}</span>
              <span className="mt-0.5 block truncate text-[11px] font-medium opacity-75">{nextAction.detail}</span>
            </span>
            <ArrowRight size={13} className="shrink-0" />
          </Link>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1.5">
          {product.brand_title_zh ? (
            <span className="rounded-full border border-[#F2C6A7] bg-[#FFF7F0] px-2 py-0.5 text-xs font-semibold text-[#B85D21]">
              品牌：{product.brand_title_zh}
            </span>
          ) : (
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">未标品牌</span>
          )}
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
      </td>
      <td className="px-3 py-3 text-xs font-semibold text-[#61767D]">{formatDate(product.updated_at)}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          {published ? (
            <Link
              href={productPreviewHref(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
            >
              <ExternalLink size={13} />
              预览
            </Link>
          ) : null}
          <Link
            href={`/admin/content/products/${product.id}/edit`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#E36F2C] px-2.5 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
          >
            <Pencil size={13} />
            编辑
          </Link>
          <ProductListDeleteAction
            productId={product.id}
            productName={product.name_cn || product.name_en || product.id}
          />
        </div>
      </td>
    </tr>
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
  const [summary, issueSummary, options, list, pathAnalytics] = await Promise.all([
    safeLoad('product summary', getProductSummary, EMPTY_SUMMARY),
    safeLoad('product issue summary', getProductIssueSummary, EMPTY_ISSUE_SUMMARY),
    safeLoad('product options', getProductOptions, EMPTY_OPTIONS),
    safeLoad('product list', () => getProducts(filters), { rows: [], total: 0 }),
    safeLoad<Record<string, AnalyticsConversionMetric>>('product path analytics', () => loadConversionPathAnalytics(30), {}),
  ])
  const adminRole: AdminRole = role
  const productPathMetric = pathAnalytics.products ?? EMPTY_PRODUCT_PATH_METRIC

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
      <AdminPageHero
        kicker="产品管理"
        title="产品列表"
        description="按状态、系列和完整度快速找到要处理的产品；日常编辑、待补处理和发布复核都走当前列表或新版编辑页。"
        actions={<QuickActions />}
      />

      <div className="space-y-6">
        <SummaryCards summary={summary} />
        <StatusTabs filters={filters} summary={summary} />
        <ProductListControlStrip
          filters={filters}
          options={options}
          summary={summary}
          issueSummary={issueSummary}
          productPathMetric={productPathMetric}
          total={list.total}
          rowsCount={list.rows.length}
        />
        <ProductCreatePublishQueueHandoffPanel
          summary={summary}
          issueSummary={issueSummary}
          rows={list.rows}
          filters={filters}
          productPathMetric={productPathMetric}
        />
        <ProductOperationsMatrix
          summary={summary}
          issueSummary={issueSummary}
          rows={list.rows}
          filters={filters}
          productPathMetric={productPathMetric}
        />
        <ProductFitProofBackflowPanel
          rows={list.rows}
          filters={filters}
          productPathMetric={productPathMetric}
        />
        <ProductLeadContentFeedbackDesk
          rows={list.rows}
          filters={filters}
          issueSummary={issueSummary}
          productPathMetric={productPathMetric}
        />
        <ProductDraftRecoveryReadinessDesk
          summary={summary}
          issueSummary={issueSummary}
          rows={list.rows}
          filters={filters}
        />
        <ProductSourceContractPanel
          issueSummary={issueSummary}
          productPathMetric={productPathMetric}
          filters={filters}
        />
        <ProductBatchGovernancePanel
          summary={summary}
          issueSummary={issueSummary}
          rows={list.rows}
          filters={filters}
          productPathMetric={productPathMetric}
        />
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
