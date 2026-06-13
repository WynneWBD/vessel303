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

async function getProductReadOnly(id: string): Promise<CatalogProductRow | null> {
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
        { key: 'product-edit-closure', label: '经营闭环', href: '#product-edit-closure', Icon: BarChart3 },
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
            进入长表单前先复核公开影响、素材、双语内容、分类属性、SEO、商务信息和详情模块；这里只做运营提示，不新增保存或发布限制。
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

function buildProductEditClosureEntries(product: CatalogProductRow): ProductEditClosureEntry[] {
  const seoComplete = productSeoComplete(product)

  return [
    {
      key: 'content-closure',
      label: '内容闭环总览',
      value: 'B233',
      detail: '回到产品管理首页查看内容缺口、SEO 待补和路径承接。',
      href: '/admin/content/products#content-closure',
      tone: 'neutral',
      Icon: Package,
    },
    {
      key: 'product-path',
      label: '产品路径分析',
      value: 'B232',
      detail: '查看产品路径访问、动作、表单和真实线索表现。',
      href: '/admin/status/traffic#product-conversion-path',
      tone: 'neutral',
      Icon: BarChart3,
    },
    {
      key: 'seo-closure',
      label: 'SEO 修复闭环',
      value: seoComplete ? '已补齐' : '待补',
      detail: '从站点 SEO 中心回看产品 SEO 与转化修复闭环。',
      href: '/admin/site/seo#seo-conversion-closure',
      tone: seoComplete ? 'ready' : 'warning',
      Icon: Sparkles,
    },
    {
      key: 'product-leads',
      label: '产品线索队列',
      value: 'B228',
      detail: '进入 source_type=product 队列核对产品来源线索。',
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
      label: '合同总览',
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
          <p className="text-xs font-bold text-[#1889B6]">B234 单品经营闭环</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">当前产品的内容、路径、SEO 与线索入口</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            把单个产品编辑动作接回 B233 产品内容闭环、B232 路径分析、B230 SEO 修复和 B228 产品线索；这里只做只读导航，不新增保存、发布或线索状态规则。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionLink href="/admin/content/products/list?view=incomplete&issue=seo" Icon={Sparkles} label="SEO 待补列表" />
          <AdminActionLink href="/admin/content/products#content-closure" Icon={Package} label="产品闭环总览" />
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

function ProductEditSourceContractStrip({ contracts }: { contracts: ProductEditSourceContract[] }) {
  return (
    <div className="border-t border-[#E6EEEE] bg-white">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1889B6]">Source Contract</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">当前产品来源承接合同</h3>
        </div>
        <p className="max-w-3xl text-xs leading-5 text-[#61767D]">
          对齐公开产品页的 Learn More / Appointment 路径，把单品编辑、公开详情、产品询盘和 source_type=product 线索队列放到同一条只读运营路径。
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
          {entry.tone === 'warning' ? '待处理' : entry.tone === 'ready' ? '已完成' : '只读入口'}
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
      href: '/admin/site/media',
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
      <ProductEditClosurePanel product={product} />
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
