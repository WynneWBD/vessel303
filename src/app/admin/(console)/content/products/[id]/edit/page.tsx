import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminActionLink, AdminPageHero } from '@/components/admin/AdminUI'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import ProductForm from '@/components/admin/ProductForm'
import { defaultSiteSettings, normalizeMediaMaxUploadMb } from '@/lib/admin-settings-db'
import { pool } from '@/lib/db'
import { getMissingCommercialTermLanguages } from '@/lib/product-commercial-terms'
import {
  ensureProductCatalogSchema,
  listCatalogProducts,
  listProductAttributeOptionIds,
  listProductAttributeTemplatesWithOptions,
  listProductCategories,
  type CatalogProductRow,
  type CatalogProductStatus,
  type CatalogProductType,
} from '@/lib/product-catalog-db'
import {
  getProductOperationAssignments,
  listProductBrands,
  listProductMarks,
  listProductShowcases,
  type ProductOperationAssignments,
} from '@/lib/product-operations-db'
import { getCatalogProductRouteInfo } from '@/lib/product-public-routes'
import type {
  CatalogDetailModule,
  CatalogDetailModuleItem,
  CatalogSpecItem,
  ProductSeriesCode,
} from '@/lib/products'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileText,
  ImageIcon,
  Layers3,
  Link2,
  ListChecks,
  Package,
  Pencil,
  SearchCheck,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Tags,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '编辑产品 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type PageProps = {
  params: Promise<{ id: string }>
}

type ProductDbRow = {
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
  tags_cn: string[] | null
  tags_en: string[] | null
  features_cn: string[] | null
  features_en: string[] | null
  image: string
  description_cn: string | null
  description_en: string | null
  gallery: string[] | null
  specs_cn: CatalogSpecItem[] | null
  specs_en: CatalogSpecItem[] | null
  detail_modules: CatalogDetailModule[] | null
  is_custom: boolean
  detail_slug: string | null
  category_id: number | null
  price_display_zh: string | null
  price_display_en: string | null
  commercial_terms: CatalogProductRow['commercial_terms']
  keywords_zh: string[] | null
  keywords_en: string[] | null
  related_product_ids: string[] | null
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  status: CatalogProductStatus
  sort_order: number
  attribute_option_ids?: number[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type EditSection = {
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}

type ProductReadinessTone = 'ready' | 'warning' | 'neutral'

type ProductReadinessItem = {
  key: string
  title: string
  detail: string
  meta: string
  href: string
  tone: ProductReadinessTone
  Icon: LucideIcon
}

type ProductEditClosureEntry = {
  key: string
  label: string
  value: string
  detail: string
  href: string
  tone: ProductReadinessTone
  Icon: LucideIcon
}

type ProductEditSourceContract = {
  label: string
  value: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: ProductReadinessTone
}

type ProductEditBackflowStep = {
  key: string
  label: string
  detail: string
  meta: string
  href: string
  tone: ProductReadinessTone
  issues: string[]
  Icon: LucideIcon
}

type ProductRecoveryPublishStep = {
  key: string
  label: string
  value: string
  detail: string
  href: string
  tone: ProductReadinessTone
  issues: string[]
  Icon: LucideIcon
}

type ProductEditProduct = CatalogProductRow & ProductOperationAssignments

const EDIT_SECTIONS: EditSection[] = [
  {
    key: 'basic',
    title: '基础信息',
    detail: '名称、系列、类型、代际、排序',
    href: '#basic',
    Icon: Pencil,
  },
  {
    key: 'seo',
    title: 'SEO 信息',
    detail: '搜索标题、搜索摘要',
    href: '#seo',
    Icon: SearchCheck,
  },
  {
    key: 'commercial',
    title: '商务条款',
    detail: '价格展示、300 风格贸易条款',
    href: '#commercial',
    Icon: FileText,
  },
  {
    key: 'relations',
    title: '关键词 / 关联产品',
    detail: '搜索关键词和关联推荐产品',
    href: '#relations',
    Icon: Tags,
  },
  {
    key: 'attributes',
    title: '产品属性',
    detail: '属性模板、筛选属性',
    href: '#attributes',
    Icon: SlidersHorizontal,
  },
  {
    key: 'media',
    title: '图片素材',
    detail: '封面图、图库、图片 URL',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'content',
    title: '中英文内容',
    detail: '标签、亮点、简介',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'details',
    title: '详情内容',
    detail: '详情介绍、详情图库',
    href: '#details',
    Icon: Layers3,
  },
  {
    key: 'specs',
    title: '规格参数',
    detail: '中英文规格项',
    href: '#specs',
    Icon: Settings2,
  },
  {
    key: 'publish-check',
    title: '发布检查',
    detail: '状态、完整度、前台预览',
    href: '#publish-check',
    Icon: SearchCheck,
  },
]

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function getMediaMaxUploadMbReadOnly(): Promise<number> {
  if (!(await tableExists('public.site_settings'))) {
    return defaultSiteSettings.mediaMaxUploadMb
  }

  const res = await pool.query<{ value: unknown }>(
    `SELECT value
     FROM site_settings
     WHERE key = 'mediaMaxUploadMb'
     LIMIT 1`,
  )
  return normalizeMediaMaxUploadMb(res.rows[0]?.value ?? defaultSiteSettings.mediaMaxUploadMb)
}

function rowToProduct(row: ProductDbRow): CatalogProductRow {
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
    price_display_zh: row.price_display_zh ?? null,
    price_display_en: row.price_display_en ?? null,
    commercial_terms: row.commercial_terms ?? null,
    keywords_zh: row.keywords_zh ?? [],
    keywords_en: row.keywords_en ?? [],
    related_product_ids: row.related_product_ids ?? [],
    category_id: row.category_id ?? null,
    category_slug: null,
    category_title_zh: null,
    category_title_en: null,
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

async function getProductReadOnly(id: string): Promise<ProductEditProduct | null> {
  if (!(await tableExists('public.product_catalog'))) return null
  await ensureProductCatalogSchema()

  const res = await pool.query<ProductDbRow>(
    `SELECT
       id,
       product_series,
       name_cn,
       name_en,
       gen,
       size,
       area,
       generation,
       product_type,
       badge_cn,
       badge_en,
       COALESCE(tags_cn, '[]'::jsonb) AS tags_cn,
       COALESCE(tags_en, '[]'::jsonb) AS tags_en,
       COALESCE(features_cn, '[]'::jsonb) AS features_cn,
       COALESCE(features_en, '[]'::jsonb) AS features_en,
       image,
       description_cn,
       description_en,
       COALESCE(gallery, '[]'::jsonb) AS gallery,
       COALESCE(specs_cn, '[]'::jsonb) AS specs_cn,
       COALESCE(specs_en, '[]'::jsonb) AS specs_en,
       COALESCE(detail_modules, '[]'::jsonb) AS detail_modules,
       is_custom,
       detail_slug,
       category_id,
       price_display_zh,
       price_display_en,
       COALESCE(commercial_terms, '{}'::jsonb) AS commercial_terms,
       COALESCE(keywords_zh, ARRAY[]::text[]) AS keywords_zh,
       COALESCE(keywords_en, ARRAY[]::text[]) AS keywords_en,
       COALESCE(related_product_ids, ARRAY[]::text[]) AS related_product_ids,
       seo_title_zh,
       seo_title_en,
       seo_description_zh,
       seo_description_en,
       status,
       sort_order,
       created_at::text AS created_at,
       updated_at::text AS updated_at,
       deleted_at::text AS deleted_at
     FROM product_catalog
     WHERE id = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  )

  const row = res.rows[0]
  if (!row) return null
  const product = rowToProduct(row)
  product.attribute_option_ids = await listProductAttributeOptionIds(id)
  const assignments = await getProductOperationAssignments(id)
  return { ...product, ...assignments }
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function previewHref(product: CatalogProductRow): string {
  return getCatalogProductRouteInfo(product).publicHref
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function productSeoComplete(product: CatalogProductRow): boolean {
  return (
    hasText(product.seo_title_zh)
    && hasText(product.seo_title_en)
    && hasText(product.seo_description_zh)
    && hasText(product.seo_description_en)
  )
}

function hasArrayItems<T>(value: T[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function compactIssueList(values: Array<string | null | undefined | false>): string[] {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0)
}

function formatIssueSummary(issues: string[], readyText: string): string {
  return issues.length > 0 ? `待补：${issues.join('、')}` : readyText
}

function getVisibleDetailModules(product: CatalogProductRow): CatalogDetailModule[] {
  return (product.detail_modules ?? []).filter((module) => module.is_visible !== false)
}

function isBuyerResourceModule(module: CatalogDetailModule): boolean {
  const marker = [
    module.id,
    module.title_en,
    module.title_cn,
  ].map((value) => (value ?? '').trim().toLowerCase()).join(' ')
  return /buyer|download|resource|material/.test(marker)
}

function hasLinkedModuleItem(items: CatalogDetailModuleItem[] | undefined = []): boolean {
  return items.some((item) => hasText(item.href))
}

function hasBuyerResourceLinks(product: CatalogProductRow): boolean {
  return getVisibleDetailModules(product).some((module) => (
    isBuyerResourceModule(module)
    && (hasLinkedModuleItem(module.items_cn) || hasLinkedModuleItem(module.items_en))
  ))
}

function getCommercialIssueLabel(product: CatalogProductRow): string | null {
  const missing = getMissingCommercialTermLanguages(product.commercial_terms)
  if (missing.length === 0) return null
  if (missing.length === 2) return '缺商务条款'
  return missing[0] === 'zh' ? '缺中文商务条款' : '缺英文商务条款'
}

function getProductReleaseIssues(product: CatalogProductRow): string[] {
  const issues = compactIssueList([
    !hasText(product.image) && '缺封面',
    !hasArrayItems(product.gallery) && '缺详情图库',
    !hasText(product.description_cn) && '缺中文简介',
    !hasText(product.description_en) && '缺英文简介',
    (!hasArrayItems(product.tags_cn) || !hasArrayItems(product.tags_en)) && '缺标签',
    (!hasArrayItems(product.features_cn) || !hasArrayItems(product.features_en)) && '缺亮点',
    !product.category_id && '未分类',
    !hasArrayItems(product.attribute_option_ids) && '缺产品属性',
    (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) && '缺价格展示',
    getCommercialIssueLabel(product),
    (!hasArrayItems(product.keywords_zh) && !hasArrayItems(product.keywords_en)) && '缺关键词',
    !hasArrayItems(product.related_product_ids) && '缺相关产品',
    !productSeoComplete(product) && '缺 SEO',
    getVisibleDetailModules(product).length === 0 && '缺详情模块',
    !hasBuyerResourceLinks(product) && '缺买家资料链接',
  ])

  if (
    hasText(product.detailSlug)
    && (
      !hasText(product.image)
      || !hasText(product.description_cn)
      || !hasText(product.description_en)
      || !hasArrayItems(product.tags_cn)
      || !hasArrayItems(product.tags_en)
      || !hasArrayItems(product.features_cn)
      || !hasArrayItems(product.features_en)
    )
  ) {
    issues.push('精品页绑定缺 CMS 基础字段')
  }

  return issues
}

function isPriorityReadinessIssue(issue: string): boolean {
  return ['缺封面', '缺详情图库', '未分类', '缺 SEO', '缺买家资料链接'].includes(issue)
}

function buildProductReadinessItems(product: CatalogProductRow, maxUploadMb: number): ProductReadinessItem[] {
  const published = product.status === 'published'
  const routeInfo = getCatalogProductRouteInfo(product)
  const galleryCount = product.gallery?.length ?? 0
  const visibleDetailModuleCount = getVisibleDetailModules(product).length
  const attributeCount = product.attribute_option_ids?.length ?? 0
  const mediaIssues = compactIssueList([
    !hasText(product.image) && '封面',
    galleryCount === 0 && '详情图库',
  ])
  const contentIssues = compactIssueList([
    !hasText(product.description_cn) && '中文简介',
    !hasText(product.description_en) && '英文简介',
    (!hasArrayItems(product.tags_cn) || !hasArrayItems(product.tags_en)) && '中英文标签',
    (!hasArrayItems(product.features_cn) || !hasArrayItems(product.features_en)) && '中英文亮点',
  ])
  const taxonomyIssues = compactIssueList([
    !product.category_id && '产品分类',
    attributeCount === 0 && '筛选属性',
  ])
  const commerceIssues = compactIssueList([
    (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) && '价格展示',
    getCommercialIssueLabel(product),
    (!hasArrayItems(product.keywords_zh) && !hasArrayItems(product.keywords_en)) && '关键词',
    !hasArrayItems(product.related_product_ids) && '相关产品',
  ])
  const detailIssues = compactIssueList([
    visibleDetailModuleCount === 0 && '详情模块',
    !hasBuyerResourceLinks(product) && '买家资料链接',
  ])

  return [
    {
      key: 'impact',
      title: published ? '已发布影响' : '草稿安全区',
      detail: published
        ? '保存后会直接影响公开产品页，先完成复核再提交。'
        : '当前不会公开展示，发布仍需表单内确认。',
      meta: published ? routeInfo.publicHref : '仅草稿',
      href: published ? routeInfo.publicHref : '#publish-check',
      tone: published ? 'warning' : 'ready',
      Icon: published ? AlertTriangle : CheckCircle2,
    },
    {
      key: 'media',
      title: '媒体素材',
      detail: formatIssueSummary(mediaIssues, '封面和详情图库已具备'),
      meta: `${galleryCount} 张图库 / 上传上限 ${maxUploadMb} MB`,
      href: '#media',
      tone: mediaIssues.length > 0 ? 'warning' : 'ready',
      Icon: ImageIcon,
    },
    {
      key: 'content',
      title: '双语内容',
      detail: formatIssueSummary(contentIssues, '简介、标签和亮点已具备'),
      meta: `${product.tags_cn?.length ?? 0}/${product.tags_en?.length ?? 0} 标签`,
      href: '#content',
      tone: contentIssues.length > 0 ? 'warning' : 'ready',
      Icon: FileText,
    },
    {
      key: 'taxonomy',
      title: '分类属性',
      detail: formatIssueSummary(taxonomyIssues, '分类和筛选属性已具备'),
      meta: `分类 ${product.category_id ?? '-'} / 属性 ${attributeCount}`,
      href: '#attributes',
      tone: taxonomyIssues.length > 0 ? 'warning' : 'ready',
      Icon: SlidersHorizontal,
    },
    {
      key: 'seo',
      title: 'SEO 字段',
      detail: productSeoComplete(product) ? '中英文标题和摘要已具备' : '待补：中英文 SEO 标题或摘要',
      meta: productSeoComplete(product) ? '搜索字段完整' : 'SEO 待补',
      href: '#seo',
      tone: productSeoComplete(product) ? 'ready' : 'warning',
      Icon: SearchCheck,
    },
    {
      key: 'commerce',
      title: '商务与关联',
      detail: formatIssueSummary(commerceIssues, '价格、商务条款、关键词和相关产品已具备'),
      meta: `${product.related_product_ids?.length ?? 0} 个关联 / ${product.keywords_zh?.length ?? 0} 个中文关键词`,
      href: '#commercial',
      tone: commerceIssues.length > 0 ? 'warning' : 'ready',
      Icon: Tags,
    },
    {
      key: 'details',
      title: '详情模块',
      detail: formatIssueSummary(detailIssues, '详情模块和买家资料链接已具备'),
      meta: `${visibleDetailModuleCount} 个可见模块`,
      href: '#details',
      tone: detailIssues.length > 0 ? 'warning' : 'ready',
      Icon: Layers3,
    },
  ]
}

function buildProductEditBackflowSteps(product: CatalogProductRow): ProductEditBackflowStep[] {
  const visibleDetailModuleCount = getVisibleDetailModules(product).length
  const mediaIssues = compactIssueList([
    !hasText(product.image) && '缺封面',
    !hasArrayItems(product.gallery) && '缺详情图库',
  ])
  const fitIssues = compactIssueList([
    !product.category_id && '未分类',
    !hasArrayItems(product.attribute_option_ids) && '缺产品属性',
    (!hasArrayItems(product.tags_cn) || !hasArrayItems(product.tags_en)) && '缺标签',
  ])
  const detailIssues = compactIssueList([
    !hasText(product.description_cn) && '缺中文简介',
    !hasText(product.description_en) && '缺英文简介',
    (!hasArrayItems(product.features_cn) || !hasArrayItems(product.features_en)) && '缺亮点',
    visibleDetailModuleCount === 0 && '缺详情模块',
  ])
  const searchIssues = compactIssueList([
    !productSeoComplete(product) && '缺 SEO',
    (!hasArrayItems(product.keywords_zh) && !hasArrayItems(product.keywords_en)) && '缺关键词',
  ])
  const inquiryIssues = compactIssueList([
    (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) && '缺价格展示',
    getCommercialIssueLabel(product),
    !hasArrayItems(product.related_product_ids) && '缺相关产品',
    !hasBuyerResourceLinks(product) && '缺买家资料链接',
  ])
  const releaseIssues = getProductReleaseIssues(product)
  const publishIssues = compactIssueList([
    product.status === 'draft' && '草稿待发布检查',
    product.status === 'published' && releaseIssues.length > 0 && '已发布仍有缺口',
  ])

  return [
    {
      key: 'fit-fields',
      label: '适配字段',
      detail: '先补分类、产品属性和标签，让客户在前台能按场景、规格和系列筛选出合适产品。',
      meta: `分类 ${product.category_id ?? '-'} / 属性 ${product.attribute_option_ids?.length ?? 0}`,
      href: '#attributes',
      tone: fitIssues.length > 0 ? 'warning' : 'ready',
      issues: fitIssues,
      Icon: SlidersHorizontal,
    },
    {
      key: 'media-proof',
      label: '媒体证明',
      detail: '封面和详情图库决定客户第一眼能否确认产品真实质感和可交付状态。',
      meta: `${product.gallery?.length ?? 0} 张图库`,
      href: '#media',
      tone: mediaIssues.length > 0 ? 'warning' : 'ready',
      issues: mediaIssues,
      Icon: ImageIcon,
    },
    {
      key: 'detail-proof',
      label: '详情证明',
      detail: '简介、亮点和详情模块补足客户提交询盘前的判断证据。',
      meta: `${visibleDetailModuleCount} 个可见详情模块`,
      href: '#details',
      tone: detailIssues.length > 0 ? 'warning' : 'ready',
      issues: detailIssues,
      Icon: Layers3,
    },
    {
      key: 'search-entry',
      label: '搜索入口',
      detail: 'SEO 标题、摘要和关键词决定产品能否被搜索、推荐和后台内容治理正确识别。',
      meta: productSeoComplete(product) ? 'SEO 完整' : 'SEO 待补',
      href: '#seo',
      tone: searchIssues.length > 0 ? 'warning' : 'ready',
      issues: searchIssues,
      Icon: SearchCheck,
    },
    {
      key: 'inquiry-handoff',
      label: '询盘交接',
      detail: '价格展示、商务条款、相关产品和买家资料链接决定客户从详情证明进入咨询时是否顺畅。',
      meta: `${product.related_product_ids?.length ?? 0} 个相关产品`,
      href: '#commercial',
      tone: inquiryIssues.length > 0 ? 'warning' : 'ready',
      issues: inquiryIssues,
      Icon: ListChecks,
    },
    {
      key: 'publish-check',
      label: '发布检查',
      detail: product.status === 'published'
        ? '已发布产品保存后会影响前台，先按上方缺口处理再提交。'
        : '草稿产品发布前仍需要在表单底部完成最终确认。',
      meta: `${releaseIssues.length} 个发布缺项`,
      href: '#publish-check',
      tone: publishIssues.length > 0 ? 'warning' : 'ready',
      issues: publishIssues,
      Icon: CheckCircle2,
    },
  ]
}

function buildProductRecoveryPublishSteps(product: ProductEditProduct): ProductRecoveryPublishStep[] {
  const routeInfo = getCatalogProductRouteInfo(product)
  const published = product.status === 'published'
  const visibleDetailModuleCount = getVisibleDetailModules(product).length
  const releaseIssues = getProductReleaseIssues(product)
  const taxonomyIssues = compactIssueList([
    !product.category_id && '未分类',
    !product.brand_id && '缺品牌',
    !hasArrayItems(product.attribute_option_ids) && '缺产品属性',
    !hasArrayItems(product.mark_ids) && '缺运营标记',
  ])
  const mediaContentIssues = compactIssueList([
    !hasText(product.image) && '缺封面',
    !hasArrayItems(product.gallery) && '缺详情图库',
    !hasText(product.description_cn) && '缺中文简介',
    !hasText(product.description_en) && '缺英文简介',
    visibleDetailModuleCount === 0 && '缺详情模块',
  ])
  const searchInquiryIssues = compactIssueList([
    !productSeoComplete(product) && '缺 SEO',
    (!hasArrayItems(product.keywords_zh) && !hasArrayItems(product.keywords_en)) && '缺关键词',
    (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) && '缺价格展示',
    getCommercialIssueLabel(product),
    !hasArrayItems(product.related_product_ids) && '缺相关产品',
    !hasBuyerResourceLinks(product) && '缺买家资料链接',
  ])
  const statusIssues = compactIssueList([
    !published && '草稿待人工发布确认',
    published && releaseIssues.length > 0 && '已发布仍有缺口',
  ])

  return [
    {
      key: 'source-status',
      label: '来源与状态',
      value: published ? '已公开' : '草稿',
      detail: published
        ? '已发布产品保存会影响公开页，继续按缺口复核后再改。'
        : '从草稿队列进入后，先确认来源、状态和发布前人工检查。',
      href: published ? routeInfo.publicHref : '#publish-check',
      tone: statusIssues.length > 0 ? 'warning' : 'ready',
      issues: statusIssues,
      Icon: published ? CheckCircle2 : SearchCheck,
    },
    {
      key: 'taxonomy-brand-mark',
      label: '分类 / 品牌 / 标记',
      value: `${product.category_id ? 1 : 0}/${product.brand_id ? 1 : 0}/${product.mark_ids.length}`,
      detail: '恢复或新建草稿先绑定分类、品牌、筛选属性和运营标记，避免前台目录与后台队列断层。',
      href: '#attributes',
      tone: taxonomyIssues.length > 0 ? 'warning' : 'ready',
      issues: taxonomyIssues,
      Icon: Tags,
    },
    {
      key: 'media-detail-proof',
      label: '素材与详情证明',
      value: `${product.gallery?.length ?? 0} 图 / ${visibleDetailModuleCount} 模块`,
      detail: '确认封面、图库、双语简介和详情模块能支撑前台产品详情页。',
      href: '#media',
      tone: mediaContentIssues.length > 0 ? 'warning' : 'ready',
      issues: mediaContentIssues,
      Icon: ImageIcon,
    },
    {
      key: 'search-inquiry-handoff',
      label: '搜索与询盘交接',
      value: `${searchInquiryIssues.length} 缺口`,
      detail: '发布前核对 SEO、关键词、商务口径、关联产品和买家资料，保证客户能从详情进入咨询。',
      href: '#seo',
      tone: searchInquiryIssues.length > 0 ? 'warning' : 'ready',
      issues: searchInquiryIssues,
      Icon: ListChecks,
    },
    {
      key: 'manual-publish-check',
      label: '发布前人工确认',
      value: `${releaseIssues.length} 发布缺项`,
      detail: '最后回到表单底部发布检查，确认后再保存或发布。',
      href: '#publish-check',
      tone: releaseIssues.length > 0 || !published ? 'warning' : 'ready',
      issues: releaseIssues.slice(0, 8),
      Icon: AlertTriangle,
    },
  ]
}

function getSideNavGroups(product: CatalogProductRow): AdminSideNavGroup[] {
  return [
    {
      title: '内容管理',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'product-edit', label: '编辑当前产品', href: `/admin/content/products/${product.id}/edit`, Icon: Pencil },
      ],
    },
    {
      title: '编辑分区',
      items: EDIT_SECTIONS.map((section) => ({
        key: section.key,
        label: section.title,
        href: section.href,
        Icon: section.Icon,
      })),
    },
    {
      title: '产品治理',
      items: [
        { key: 'product-edit-backflow-guide', label: '回流处理', href: '#product-edit-backflow-guide', Icon: ListChecks },
        { key: 'product-edit-closure', label: '经营复盘', href: '#product-edit-closure', Icon: BarChart3 },
        { key: 'product-edit-lead-feedback', label: '线索回流', href: '#product-edit-lead-feedback-desk', Icon: UsersRound },
        { key: 'product-recovery-publish-readiness', label: '恢复发布检查', href: '#product-recovery-publish-readiness-desk', Icon: SearchCheck },
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
        { key: 'publish-flow', label: '发布审核', planned: true, Icon: SearchCheck },
      ],
    },
  ]
}

function StatusBadge({ status }: { status: CatalogProductStatus }) {
  const published = status === 'published'
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ${
        published ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
      }`}
    >
      {published ? '已发布' : '草稿'}
    </span>
  )
}

function Hero({ product }: { product: CatalogProductRow }) {
  const published = product.status === 'published'
  const routeInfo = getCatalogProductRouteInfo(product)

  return (
    <AdminPageHero
      kicker="产品编辑"
      title={product.name_cn || product.name_en || product.id}
      description="本页把编辑分区、状态提醒和当前保存规则收进同一个运营页面。"
      actions={(
        <>
          <AdminActionLink href="/admin/content/products/list" Icon={ArrowLeft} label="返回产品列表" />
          {published ? (
            <AdminActionLink href={previewHref(product)} Icon={CheckCircle2} label="官方预览" external />
          ) : null}
        </>
      )}
    >
      <StatusBadge status={product.status} />
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard title="产品 ID" value={product.id} />
        <InfoCard title="更新时间" value={formatDate(product.updated_at)} />
        <InfoCard title="官方前台" value={published ? `${routeInfo.publicLabel} · ${routeInfo.publicHref}` : '草稿未公开展示'} tone={published ? 'warning' : 'neutral'} />
      </div>
    </AdminPageHero>
  )
}

function InfoCard({
  title,
  value,
  tone = 'neutral',
}: {
  title: string
  value: string
  tone?: 'neutral' | 'warning'
}) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className={`mt-2 text-sm font-bold ${tone === 'warning' ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>
        {value}
      </p>
    </div>
  )
}

function readinessToneClass(tone: ProductReadinessTone): string {
  if (tone === 'ready') return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  if (tone === 'warning') return 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
  return 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
}

function readinessCellClass(tone: ProductReadinessTone): string {
  if (tone === 'ready') return 'hover:bg-emerald-50/55'
  if (tone === 'warning') return 'hover:bg-[#FFF2E7]/65'
  return 'hover:bg-[#F7FAFA]'
}

function ProductPublishReadinessPanel({
  product,
  maxUploadMb,
}: {
  product: CatalogProductRow
  maxUploadMb: number
}) {
  const readinessItems = buildProductReadinessItems(product, maxUploadMb)
  const releaseIssues = getProductReleaseIssues(product)
  const priorityIssues = releaseIssues.filter(isPriorityReadinessIssue)
  const readyCount = readinessItems.filter((item) => item.tone === 'ready').length
  const visibleIssues = releaseIssues.slice(0, 8)
  const hiddenIssueCount = Math.max(0, releaseIssues.length - visibleIssues.length)

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 border-b border-[#D8E7E8] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-5">
          <p className="text-xs font-bold text-[#1889B6]">发布复核</p>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">发布影响复核台</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            进入长表单前先复核公开影响、素材、双语内容、分类属性、SEO、商务信息和详情模块。
          </p>
        </div>
        <div className="grid grid-cols-3 border-t border-[#D8E7E8] bg-[#F7FAFA] lg:border-l lg:border-t-0">
          <div className="border-r border-[#D8E7E8] p-4">
            <p className="text-xs font-semibold text-[#61767D]">通过项</p>
            <p className="mt-2 text-2xl font-bold text-[#1E2C31]">{readyCount}</p>
          </div>
          <div className="border-r border-[#D8E7E8] p-4">
            <p className="text-xs font-semibold text-[#61767D]">总缺项</p>
            <p className="mt-2 text-2xl font-bold text-[#E36F2C]">{releaseIssues.length}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-[#61767D]">优先项</p>
            <p className="mt-2 text-2xl font-bold text-[#E36F2C]">{priorityIssues.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#D8E7E8] md:grid-cols-2 xl:grid-cols-4">
        {readinessItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`min-h-[148px] border-b border-r border-[#E6EEEE] p-4 transition last:border-r-0 xl:border-b-0 ${readinessCellClass(item.tone)}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${readinessToneClass(item.tone)}`}>
                <item.Icon size={17} />
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${readinessToneClass(item.tone)}`}>
                {item.tone === 'ready' ? '已完成' : item.tone === 'warning' ? '待处理' : '提示'}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-[#1E2C31]">{item.title}</h3>
            <p className="mt-2 min-h-[40px] text-xs leading-5 text-[#61767D]">{item.detail}</p>
            <p className="mt-3 truncate text-[11px] font-semibold text-[#1889B6]">{item.meta}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3 bg-[#F7FAFA] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[#1E2C31]">发布问题队列</p>
          <p className="mt-1 text-xs text-[#61767D]">优先处理高影响缺项，再进入表单内发布检查做最终确认。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleIssues.length > 0 ? (
            <>
              {visibleIssues.map((issue) => (
                <span
                  key={issue}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    isPriorityReadinessIssue(issue)
                      ? 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
                      : 'border-[#D8E7E8] bg-white text-[#61767D]'
                  }`}
                >
                  {issue}
                </span>
              ))}
              {hiddenIssueCount > 0 ? (
                <span className="rounded-full border border-[#D8E7E8] bg-white px-2.5 py-1 text-xs font-semibold text-[#61767D]">
                  +{hiddenIssueCount}
                </span>
              ) : null}
            </>
          ) : (
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              当前没有发布缺项
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

function ProductEditBackflowGuidePanel({ product }: { product: CatalogProductRow }) {
  const steps = buildProductEditBackflowSteps(product)
  const warningSteps = steps.filter((step) => step.tone === 'warning')
  const readySteps = steps.length - warningSteps.length
  const routeInfo = getCatalogProductRouteInfo(product)
  const published = product.status === 'published'

  return (
    <section
      id="product-edit-backflow-guide"
      data-product-edit-backflow-guide="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#1889B6]">编辑处理指引</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">从产品列表回流到单篇编辑</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            按产品适配、详情证明和询盘交接把当前产品拆成六个处理步骤。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionLink href="/admin/content/products/list#product-fit-proof-backflow" Icon={ListChecks} label="回流队列" />
          <AdminActionLink href="/admin/customers/leads?source_type=product" Icon={UsersRound} label="产品线索" />
          {published ? (
            <AdminActionLink href={routeInfo.publicHref} Icon={CheckCircle2} label="前台预览" external />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <BackflowInfoCell label="完成步骤" value={`${readySteps}/${steps.length}`} detail="按当前字段判断" tone={warningSteps.length > 0 ? 'warning' : 'ready'} />
        <BackflowInfoCell label="待处理步骤" value={`${warningSteps.length}`} detail={warningSteps.length > 0 ? warningSteps.map((step) => step.label).join('、') : '当前没有待处理步骤'} tone={warningSteps.length > 0 ? 'warning' : 'ready'} />
        <BackflowInfoCell label="公开状态" value={published ? '已发布' : '草稿'} detail={published ? routeInfo.publicHref : '发布前不会公开展示'} tone={published ? 'warning' : 'neutral'} />
        <BackflowInfoCell label="来源入口" value="产品列表" detail="后台产品列表队列" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.href}
            className={`group min-h-[190px] p-5 transition ${step.tone === 'warning' ? 'hover:bg-[#FFF2E7]/55' : 'hover:bg-emerald-50/45'}`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${readinessToneClass(step.tone)}`}>
                <step.Icon size={18} />
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${readinessToneClass(step.tone)}`}>
                {step.tone === 'warning' ? '待处理' : '已具备'}
              </span>
            </span>
            <h3 className="mt-4 text-sm font-bold text-[#1E2C31]">{step.label}</h3>
            <p className="mt-2 min-h-[44px] text-xs leading-5 text-[#61767D]">{step.detail}</p>
            <p className="mt-3 truncate text-[11px] font-semibold text-[#1889B6]" title={step.meta}>{step.meta}</p>
            <span className="mt-3 flex flex-wrap gap-1.5">
              {step.issues.length > 0 ? (
                step.issues.slice(0, 3).map((issue) => (
                  <span key={issue} className="rounded-full border border-[#F2C6A7] bg-[#FFF2E7] px-2 py-0.5 text-[11px] font-semibold text-[#E36F2C]">
                    {issue}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  当前完整
                </span>
              )}
              {step.issues.length > 3 ? (
                <span className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#61767D]">
                  +{step.issues.length - 3}
                </span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function BackflowInfoCell({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: ProductReadinessTone
}) {
  const valueClass =
    tone === 'ready'
      ? 'text-emerald-700'
      : tone === 'warning'
        ? 'text-[#E36F2C]'
        : 'text-[#1E2C31]'

  return (
    <div className="border-b border-[#E6EEEE] px-4 py-3 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 truncate text-xl font-bold ${valueClass}`} title={value}>{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8A9EA4]" title={detail}>{detail}</p>
    </div>
  )
}

function buildProductEditClosureEntries(product: CatalogProductRow): ProductEditClosureEntry[] {
  const seoComplete = productSeoComplete(product)

  return [
    {
      key: 'content-closure',
      label: '内容总览',
      value: '内容',
      detail: '回到产品管理首页查看内容缺口、SEO 待补和路径承接。',
      href: '/admin/content/products#content-closure',
      tone: 'neutral',
      Icon: Package,
    },
    {
      key: 'product-path',
      label: '产品路径分析',
      value: '路径',
      detail: '查看产品路径访问、动作、表单和真实线索表现。',
      href: '/admin/status/traffic#product-conversion-path',
      tone: 'neutral',
      Icon: BarChart3,
    },
    {
      key: 'seo-closure',
      label: 'SEO 待补',
      value: seoComplete ? '已补齐' : '待补',
      detail: '从站点 SEO 中心回看产品 SEO 与转化问题。',
      href: '/admin/site/seo#seo-conversion-closure',
      tone: seoComplete ? 'ready' : 'warning',
      Icon: Sparkles,
    },
    {
      key: 'product-leads',
      label: '产品线索队列',
      value: '线索',
      detail: '进入产品来源队列核对产品来源线索。',
      href: '/admin/customers/leads?source_type=product',
      tone: 'neutral',
      Icon: UsersRound,
    },
  ]
}

function ProductEditClosurePanel({ product }: { product: CatalogProductRow }) {
  const routeInfo = getCatalogProductRouteInfo(product)
  const releaseIssues = getProductReleaseIssues(product)
  const closureEntries = buildProductEditClosureEntries(product)
  const published = product.status === 'published'
  const sourceContracts: ProductEditSourceContract[] = [
    {
      label: '来源总览',
      value: 'product:*',
      detail: '回到产品列表查看产品来源阶段的完整承接约定。',
      href: '/admin/content/products/list#product-source-contract',
      Icon: Link2,
      tone: 'neutral',
    },
    {
      label: '卡片 CTA',
      value: 'catalog_card',
      detail: '公开产品列表卡片咨询入口，回到产品来源阶段复盘。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Acatalog_card_cta',
      Icon: Package,
      tone: 'neutral',
    },
    {
      label: '详情 CTA',
      value: 'detail_cta',
      detail: '产品详情页 Learn More / Appointment 动作，回到产品线索阶段。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Acta_click',
      Icon: SearchCheck,
      tone: published ? 'ready' : 'warning',
    },
    {
      label: '询盘表单',
      value: 'inquiry_form',
      detail: '产品询盘表单进入 leads 后，用 source_stage 区分表单样本。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Ainquiry_form',
      Icon: ListChecks,
      tone: 'neutral',
    },
  ]
  const publicRoute = published ? routeInfo.publicHref : '草稿未公开展示'

  return (
    <section id="product-edit-closure" className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-bold text-[#1889B6]">单品经营复盘</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">当前产品的内容、路径、SEO 与线索入口</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            把单个产品编辑动作接回产品内容、路径分析、SEO 待补和产品线索，方便运营判断下一步处理入口。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionLink href="/admin/content/products/list?view=incomplete&issue=seo" Icon={Sparkles} label="SEO 待补列表" />
          <AdminActionLink href="/admin/content/products#content-closure" Icon={Package} label="产品内容总览" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {closureEntries.map((entry) => (
          <ProductEditClosureCard key={entry.key} entry={entry} />
        ))}
      </div>

      <ProductEditSourceContractStrip contracts={sourceContracts} />

      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] bg-[#F7FAFA] p-4 md:grid-cols-3">
        <ClosureInfoCell label="当前状态" value={published ? '已发布' : '草稿'} detail={published ? '保存会影响公开产品页' : '发布前不会公开展示'} />
        <ClosureInfoCell label="官方路由" value={publicRoute} detail={published ? routeInfo.publicLabel : '等待发布后公开'} />
        <ClosureInfoCell label="发布缺项" value={`${releaseIssues.length}`} detail={releaseIssues.length > 0 ? releaseIssues.slice(0, 3).join('、') : '当前没有发布缺项'} />
      </div>
    </section>
  )
}

function ProductEditLeadFeedbackDesk({ product }: { product: CatalogProductRow }) {
  const routeInfo = getCatalogProductRouteInfo(product)
  const releaseIssues = getProductReleaseIssues(product)
  const backflowSteps = buildProductEditBackflowSteps(product)
  const warningSteps = backflowSteps.filter((step) => step.tone === 'warning')
  const published = product.status === 'published'
  const productSearchHref = `/admin/content/products/list?search=${encodeURIComponent(product.id)}#product-content-lead-feedback-desk`
  const firstWarningHref = warningSteps[0]?.href ?? '#publish-check'
  const leadHandoffIssues = compactIssueList([
    (!hasText(product.price_display_zh) && !hasText(product.price_display_en)) && '价格展示',
    getCommercialIssueLabel(product),
    !hasArrayItems(product.related_product_ids) && '相关产品',
    !hasBuyerResourceLinks(product) && '买家资料链接',
  ])
  const leadFeedbackDecision =
    published && releaseIssues.length > 0
      ? `当前产品已发布且还有 ${releaseIssues.length} 个发布缺项，先处理本页缺口，再回产品内容队列复盘。`
      : leadHandoffIssues.length > 0
        ? `当前产品还有 ${leadHandoffIssues.length} 个询盘交接缺口，优先补商务口径、关联产品和买家资料链接。`
        : !published
          ? '当前产品仍是草稿，先按单品检查补齐内容，再进入表单底部发布检查。'
          : '当前产品主要字段已具备，可通过跟进和线索复盘观察产品线索反馈，再决定是否继续优化内容。'
  const feedbackCards = [
    {
      key: 'b326-content-feedback',
      label: '内容补齐',
      value: releaseIssues.length > 0 ? `${releaseIssues.length} 缺项` : '可复盘',
      detail: '回到产品列表的内容回流优先级，用当前产品 ID 定位队列。',
      href: productSearchHref,
      Icon: Package,
      tone: releaseIssues.length > 0 ? 'warning' : 'ready',
    },
    {
      key: 'b325-followup-triage',
      label: '跟进分诊',
      value: '质量复盘',
      detail: '从产品线索质量、表单阶段和跟进断点判断当前产品是否需要补内容。',
      href: '/admin/status/leads#product-lead-quality-followup-desk',
      Icon: ListChecks,
      tone: 'neutral',
    },
    {
      key: 'b324-lead-review',
      label: '线索复盘',
      value: '产品来源',
      detail: '进入产品来源线索队列，查看产品表单、详情 CTA 和卡片 CTA 反馈。',
      href: '/admin/customers/leads?source_type=product#product-lead-ops-review-desk',
      Icon: UsersRound,
      tone: 'neutral',
    },
    {
      key: 'b323-conversion-bridge',
      label: '转化路径',
      value: published ? '已公开' : '草稿',
      detail: '把产品生命周期、转化路径和产品线索状态放到同一张复盘表。',
      href: '/admin/site/conversion#product-lifecycle-conversion-bridge',
      Icon: BarChart3,
      tone: published ? 'ready' : 'warning',
    },
  ] satisfies ProductEditClosureEntry[]
  const workflow = [
    {
      label: '01 看线索反馈',
      detail: '先打开跟进和线索复盘，确认产品来源线索是否卡在跟进、表单或 CTA 阶段。',
      href: '/admin/status/leads#product-lead-quality-followup-desk',
      Icon: UsersRound,
      primary: false,
    },
    {
      label: '02 补当前缺口',
      detail: warningSteps.length > 0
        ? `当前先处理 ${warningSteps[0]?.label}：${warningSteps[0]?.issues.slice(0, 3).join('、') || '待补字段'}。`
        : '当前回流步骤没有明显缺口，可进入发布检查或前台预览。',
      href: firstWarningHref,
      Icon: Pencil,
      primary: warningSteps.length > 0,
    },
    {
      label: '03 回列表复盘',
      detail: '回到产品内容补齐优先级，和同页产品一起比较处理顺序。',
      href: productSearchHref,
      Icon: Layers3,
      primary: releaseIssues.length > 0,
    },
    {
      label: '04 前台确认',
      detail: published ? routeInfo.publicHref : '草稿未公开，发布前只能做字段检查。',
      href: published ? routeInfo.publicHref : '#publish-check',
      Icon: published ? CheckCircle2 : SearchCheck,
      primary: false,
      external: published,
    },
  ]

  return (
    <section
      id="product-edit-lead-feedback-desk"
      data-product-edit-lead-feedback="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold text-[#E36F2C]">单品线索检查</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">当前产品的线索反馈、内容缺口与发布前回流</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            把产品内容补齐、跟进分诊、产品线索复盘和转化路径沉到当前产品，帮助运营判断要补哪些字段。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionLink href={productSearchHref} Icon={Package} label="内容补齐" />
          <AdminActionLink href="/admin/status/leads#product-lead-quality-followup-desk" Icon={ListChecks} label="跟进分诊" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#E6EEEE] bg-[#F7FAFA] md:grid-cols-4">
        <BackflowInfoCell label="公开状态" value={published ? '已发布' : '草稿'} detail={published ? routeInfo.publicHref : '发布前不会公开展示'} tone={published ? 'warning' : 'neutral'} />
        <BackflowInfoCell label="发布缺项" value={`${releaseIssues.length}`} detail={releaseIssues.length > 0 ? releaseIssues.slice(0, 3).join('、') : '当前没有发布缺项'} tone={releaseIssues.length > 0 ? 'warning' : 'ready'} />
        <BackflowInfoCell label="询盘交接缺口" value={`${leadHandoffIssues.length}`} detail={leadHandoffIssues.length > 0 ? leadHandoffIssues.join('、') : '询盘交接字段已具备'} tone={leadHandoffIssues.length > 0 ? 'warning' : 'ready'} />
        <BackflowInfoCell label="回流步骤待处理" value={`${warningSteps.length}`} detail={warningSteps.length > 0 ? warningSteps.map((step) => step.label).slice(0, 3).join('、') : '回流步骤均已具备'} tone={warningSteps.length > 0 ? 'warning' : 'ready'} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_420px] lg:divide-x lg:divide-y-0">
        <div>
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <p className="text-sm font-bold text-[#1E2C31]">处理判断</p>
            <p className="mt-2 text-sm leading-6 text-[#61767D]">{leadFeedbackDecision}</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {feedbackCards.map((entry) => (
              <ProductEditClosureCard key={entry.key} entry={entry} />
            ))}
          </div>
        </div>

        <aside className="bg-[#FBFDFD]">
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <h3 className="text-sm font-bold text-[#1E2C31]">单品回流动作顺序</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              先读线索反馈，再补当前产品字段，最后回到列表队列和前台路径复盘。
            </p>
          </div>
          <div className="divide-y divide-[#E6EEEE]">
            {workflow.map((step) => {
              const Icon = step.Icon
              return (
                <Link
                  key={step.label}
                  href={step.href}
                  target={step.external ? '_blank' : undefined}
                  rel={step.external ? 'noreferrer' : undefined}
                  className="group block px-5 py-4 transition hover:bg-white"
                >
                  <span className="flex items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                      step.primary ? readinessToneClass('warning') : readinessToneClass('neutral')
                    }`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#1E2C31]">{step.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#61767D]">{step.detail}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                        打开
                        <ArrowLeft className="rotate-180" size={13} />
                      </span>
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

function ProductRecoveryPublishReadinessDesk({ product }: { product: ProductEditProduct }) {
  const routeInfo = getCatalogProductRouteInfo(product)
  const steps = buildProductRecoveryPublishSteps(product)
  const warningSteps = steps.filter((step) => step.tone === 'warning')
  const readySteps = steps.length - warningSteps.length
  const published = product.status === 'published'
  const productDraftQueueHref = `/admin/content/products/list?search=${encodeURIComponent(product.id)}#product-draft-recovery-readiness-desk`
  const recoverySignal =
    !published && warningSteps.length > 0
      ? `当前产品仍是草稿，发布前还有 ${warningSteps.length} 个检查组待补；先回草稿队列确认来源，再按本页锚点补字段。`
      : published && warningSteps.length > 0
        ? `当前产品已发布但仍有 ${warningSteps.length} 个检查组待补；保存前先处理缺口，避免直接影响公开页。`
        : published
          ? '当前产品已发布且关键检查组已通过，可继续用跟进和线索复盘观察产品线索反馈。'
          : '当前草稿关键检查组已通过，最后仍需在表单底部发布检查中人工确认。'
  const supportLinks = [
    {
      label: '草稿队列',
      detail: '回到产品列表的恢复后草稿补齐队列，用当前产品 ID 定位处理上下文。',
      href: productDraftQueueHref,
      Icon: ListChecks,
      tone: !published ? 'warning' : 'neutral',
    },
    {
      label: '恢复保护',
      detail: '核对回收站恢复保护台，确认来源和恢复风险。',
      href: '/admin/content/products/recycle#product-recycle-protection-desk',
      Icon: AlertTriangle,
      tone: 'neutral',
    },
    {
      label: '分类治理',
      detail: '分类缺失时回到分类治理台，再回编辑页绑定分类和属性。',
      href: '/admin/content/products/categories#product-category-readiness-desk',
      Icon: Layers3,
      tone: product.category_id ? 'ready' : 'warning',
    },
    {
      label: '运营归属',
      detail: '品牌或标记缺失时先看品牌、标记治理台，保证运营分组可接管。',
      href: product.brand_id ? '/admin/content/products/marks#product-mark-readiness-desk' : '/admin/content/products/brands#product-brand-readiness-desk',
      Icon: Tags,
      tone: product.brand_id && product.mark_ids.length > 0 ? 'ready' : 'warning',
    },
  ] satisfies Array<{
    label: string
    detail: string
    href: string
    Icon: LucideIcon
    tone: ProductReadinessTone
  }>

  return (
    <section
      id="product-recovery-publish-readiness-desk"
      data-product-recovery-publish-readiness="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#E36F2C]">Recovery Publish Gate</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">恢复后发布前检查台</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            把草稿补齐队列落到当前产品编辑页：核对来源状态、分类品牌标记、素材详情、搜索询盘和发布前人工确认。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionLink href={productDraftQueueHref} Icon={ListChecks} label="草稿队列" />
          <AdminActionLink href="/admin/content/products/recycle#product-recycle-protection-desk" Icon={AlertTriangle} label="恢复保护" />
          {published ? (
            <AdminActionLink href={routeInfo.publicHref} Icon={CheckCircle2} label="前台预览" external />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <BackflowInfoCell label="检查通过" value={`${readySteps}/${steps.length}`} detail="按当前保存字段判断" tone={warningSteps.length > 0 ? 'warning' : 'ready'} />
        <BackflowInfoCell label="待处理组" value={`${warningSteps.length}`} detail={warningSteps.length > 0 ? warningSteps.map((step) => step.label).join('、') : '关键检查组已通过'} tone={warningSteps.length > 0 ? 'warning' : 'ready'} />
        <BackflowInfoCell label="品牌 / 标记" value={`${product.brand_id ? 1 : 0}/${product.mark_ids.length}`} detail="品牌绑定 / 运营标记数量" tone={product.brand_id && product.mark_ids.length > 0 ? 'ready' : 'warning'} />
        <BackflowInfoCell label="橱窗归属" value={`${product.showcase_ids.length}`} detail="当前产品所在推荐橱窗数量" tone={product.showcase_ids.length > 0 ? 'ready' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] xl:grid-cols-[minmax(0,1fr)_420px] xl:divide-x xl:divide-y-0">
        <div>
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <p className="text-sm font-bold text-[#1E2C31]">发布前判断</p>
            <p className="mt-2 text-sm leading-6 text-[#61767D]">{recoverySignal}</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 2xl:grid-cols-5">
            {steps.map((step) => (
              <Link
                key={step.key}
                href={step.href}
                className={`group min-h-[188px] px-5 py-4 transition ${step.tone === 'warning' ? 'hover:bg-[#FFF2E7]/55' : 'hover:bg-emerald-50/45'}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${readinessToneClass(step.tone)}`}>
                    <step.Icon size={18} />
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${readinessToneClass(step.tone)}`}>
                    {step.tone === 'warning' ? '待处理' : step.tone === 'ready' ? '已具备' : '查看'}
                  </span>
                </span>
                <h3 className="mt-4 text-sm font-bold text-[#1E2C31]">{step.label}</h3>
                <p className="mt-1 text-xl font-bold text-[#1E2C31]">{step.value}</p>
                <p className="mt-2 min-h-[44px] text-xs leading-5 text-[#61767D]">{step.detail}</p>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {step.issues.length > 0 ? (
                    step.issues.slice(0, 3).map((issue) => (
                      <span key={issue} className="rounded-full border border-[#F2C6A7] bg-[#FFF2E7] px-2 py-0.5 text-[11px] font-semibold text-[#E36F2C]">
                        {issue}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      当前完整
                    </span>
                  )}
                  {step.issues.length > 3 ? (
                    <span className="rounded-full border border-[#D8E7E8] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#61767D]">
                      +{step.issues.length - 3}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="bg-[#FBFDFD]">
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <h3 className="text-sm font-bold text-[#1E2C31]">跨台承接入口</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              按恢复保护、草稿队列、分类治理、品牌标记治理的顺序回查；这里只跳转，不提交任何表单。
            </p>
          </div>
          <div className="divide-y divide-[#E6EEEE]">
            {supportLinks.map((link) => {
              const Icon = link.Icon
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group block px-5 py-4 transition hover:bg-white"
                >
                  <span className="flex items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${readinessToneClass(link.tone)}`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#1E2C31]">{link.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#61767D]">{link.detail}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
                        打开
                        <ArrowLeft className="rotate-180" size={13} />
                      </span>
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

function ProductEditSourceContractStrip({ contracts }: { contracts: ProductEditSourceContract[] }) {
  return (
    <div className="border-t border-[#E6EEEE] bg-white">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1889B6]">Source Contract</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">当前产品来源线索</h3>
        </div>
        <p className="max-w-3xl text-xs leading-5 text-[#61767D]">
          对齐公开产品页的 Learn More / Appointment 路径，把单品编辑、公开详情、产品询盘和产品来源线索队列放到同一条运营路径。
        </p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {contracts.map((contract) => (
          <ProductEditSourceContractLink key={contract.label} contract={contract} />
        ))}
      </div>
    </div>
  )
}

function ProductEditSourceContractLink({ contract }: { contract: ProductEditSourceContract }) {
  const Icon = contract.Icon

  return (
    <Link href={contract.href} className="group min-h-[132px] px-5 py-4 transition hover:bg-[#F7FAFA]">
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#1E2C31]">{contract.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${readinessToneClass(contract.tone)}`}>
            <span className="truncate">{contract.value}</span>
          </span>
        </span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${readinessToneClass(contract.tone)}`}>
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block text-xs leading-5 text-[#61767D]">{contract.detail}</span>
    </Link>
  )
}

function ProductEditClosureCard({ entry }: { entry: ProductEditClosureEntry }) {
  return (
    <Link href={entry.href} className="group block min-h-[184px] p-5 transition hover:bg-[#F7FAFA]">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-md border ${readinessToneClass(entry.tone)}`}>
          <entry.Icon size={18} />
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${readinessToneClass(entry.tone)}`}>
          {entry.tone === 'warning' ? '待处理' : entry.tone === 'ready' ? '已完成' : '查看入口'}
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-[#61767D]">{entry.label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1E2C31]">{entry.value}</p>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{entry.detail}</p>
    </Link>
  )
}

function ClosureInfoCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E6EEEE] bg-white px-4 py-3">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#1E2C31]" title={value}>{value}</p>
      <p className="mt-1 truncate text-xs text-[#8A9EA4]" title={detail}>{detail}</p>
    </div>
  )
}

function EditSectionGrid() {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {EDIT_SECTIONS.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          className="flex min-h-20 items-start gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <section.Icon size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#1E2C31]">{section.title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#61767D]">{section.detail}</span>
          </span>
        </Link>
      ))}
    </section>
  )
}

function RiskNotice({ product }: { product: CatalogProductRow }) {
  return (
    <section className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#E36F2C]">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#8A3F16]">保存前请确认影响范围</h2>
          <p className="mt-1 text-xs leading-5 text-[#8A3F16]">
            当前没有独立版本草稿。{product.status === 'published' ? '这个产品已经发布，保存后会直接影响前台展示。' : '草稿产品发布前不会在前台公开展示。'}
            图片上传会立即进入媒体库，选择图片则只回填表单，最终仍要保存产品才生效。
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentProductEditPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const { id } = await params
  const [product, maxUploadMb, categories, attributeTemplates, brands, marks, showcases, relatedProducts] = await Promise.all([
    getProductReadOnly(id).catch((err) => {
      console.error('[admin-content-product-edit] load product failed', err)
      return null
    }),
    getMediaMaxUploadMbReadOnly().catch((err) => {
      console.error('[admin-content-product-edit] load media limit failed', err)
      return defaultSiteSettings.mediaMaxUploadMb
    }),
    listProductCategories({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product categories failed', err)
      return []
    }),
    listProductAttributeTemplatesWithOptions({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product attributes failed', err)
      return []
    }),
    listProductBrands({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product brands failed', err)
      return []
    }),
    listProductMarks({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product marks failed', err)
      return []
    }),
    listProductShowcases({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-edit] load product showcases failed', err)
      return []
    }),
    listCatalogProducts({ limit: 300, offset: 0 }).catch((err) => {
      console.error('[admin-content-product-edit] load related products failed', err)
      return { rows: [], total: 0 }
    }),
  ])

  if (!product) notFound()

  const adminRole: AdminRole = role
  const galleryCount = product.gallery?.length ?? 0
  const visibleDetailModuleCount = (product.detail_modules ?? []).filter((module) => module.is_visible !== false).length
  const attributeCount = product.attribute_option_ids?.length ?? 0
  const seoComplete = productSeoComplete(product)
  const routeInfo = getCatalogProductRouteInfo(product)
  const consoleMetrics: ProductEditorMetric[] = [
    {
      label: '状态',
      value: product.status === 'published' ? '已发布' : '草稿',
      detail: product.status === 'published' ? '保存会影响公开产品页。' : '发布前不会公开展示。',
      tone: product.status === 'published' ? 'warning' : 'ready',
    },
    {
      label: '图片',
      value: `${galleryCount}`,
      detail: product.image ? '已有封面图；数字为详情图库数量。' : '缺封面图；优先补媒体素材。',
      tone: product.image && galleryCount > 0 ? 'ready' : 'warning',
    },
    {
      label: '详情模块',
      value: visibleDetailModuleCount.toString(),
      detail: '仅统计可见详情模块。',
      tone: visibleDetailModuleCount > 0 ? 'ready' : 'warning',
    },
    {
      label: 'SEO / 属性',
      value: `${seoComplete ? 'OK' : '缺'} / ${attributeCount}`,
      detail: '搜索字段完整度与筛选属性数量。',
      tone: seoComplete && attributeCount > 0 ? 'ready' : 'warning',
    },
  ]
  const consoleSignals: ProductEditorSignal[] = [
    {
      label: product.status === 'published' ? '保存会更新前台' : '当前仍是草稿',
      detail: product.status === 'published'
        ? `官方路由 ${routeInfo.publicHref} 已公开，保存前需要复核图片、SEO、详情和商务条款。`
        : '草稿产品保存后不会公开展示，发布仍需表单确认弹窗。',
      tone: product.status === 'published' ? 'warning' : 'ready',
      href: product.status === 'published' ? routeInfo.publicHref : '#publish-check',
    },
    {
      label: product.category_id ? '分类已绑定' : '缺产品分类',
      detail: product.category_id ? `分类 ID ${product.category_id}` : '分类缺失会影响产品列表筛选和内容治理。',
      tone: product.category_id ? 'ready' : 'warning',
      href: '#attributes',
    },
    {
      label: attributeCount > 0 ? '属性已选择' : '缺筛选属性',
      detail: attributeCount > 0 ? `${attributeCount} 个属性选项` : '属性缺失会降低列表筛选和对比效率。',
      tone: attributeCount > 0 ? 'ready' : 'warning',
      href: '#attributes',
    },
    {
      label: '媒体上传受站点设置控制',
      detail: `当前上传上限 ${maxUploadMb} MB；图片上传进入媒体库，保存产品才回写引用。`,
      tone: 'neutral',
      href: '/admin/site/media#media-replacement-workbench',
    },
  ]

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品编辑"
      description="按分区处理产品基础信息、图片、文案、详情模块和发布检查。"
      sideNavGroups={getSideNavGroups(product)}
      activeItem="product-edit"
    >
      <Hero product={product} />
      <ProductEditorConsole
        title="产品编辑任务台"
        description="先看当前发布影响、媒体状态、详情模块、SEO 和属性信号，再进入长表单编辑。"
        sections={EDIT_SECTIONS}
        metrics={consoleMetrics}
        signals={consoleSignals}
      />
      <ProductPublishReadinessPanel product={product} maxUploadMb={maxUploadMb} />
      <ProductEditBackflowGuidePanel product={product} />
      <ProductEditClosurePanel product={product} />
      <ProductEditLeadFeedbackDesk product={product} />
      <ProductRecoveryPublishReadinessDesk product={product} />
      <EditSectionGrid />
      <RiskNotice product={product} />
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
        <ProductForm
          mode="edit"
          product={product}
          maxUploadMb={maxUploadMb}
          backHref="/admin/content/products/list"
          backLabel="返回产品列表"
          title="编辑产品内容"
          previewPolicy="published-only"
          categories={categories}
          attributeTemplates={attributeTemplates}
          brands={brands}
          marks={marks}
          showcases={showcases}
          relatedProductOptions={relatedProducts.rows}
        />
      </section>
    </AdminSectionShell>
  )
}
