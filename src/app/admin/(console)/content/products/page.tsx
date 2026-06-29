import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
import { COMMERCIAL_TERM_FIELD_PAIRS } from '@/lib/product-commercial-terms'
import { ensureProductCatalogSchema, listProductAttributeTemplates, listProductCategories } from '@/lib/product-catalog-db'
import { listProductBrands, listProductFilterGroups, listProductMarks, listProductShowcases } from '@/lib/product-operations-db'
import {
  Archive,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  FileText,
  Filter,
  ImageIcon,
  Layers3,
  Link2,
  ListChecks,
  Package,
  Pencil,
  Plus,
  SearchCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type ProductStats = {
  total: number
  published: number
  draft: number
  recent: number
  missingCover: number
  missingGallery: number
  missingCnDescription: number
  missingEnDescription: number
  missingTags: number
  missingFeatures: number
  missingDetailModules: number
  missingCategory: number
  missingSeo: number
  missingAttributes: number
  missingPriceDisplay: number
  missingCommercialTerms: number
  missingKeywords: number
  missingRelatedProducts: number
  deleted: number
  categories: number
  attributes: number
  marks: number
  brands: number
  filters: number
  showcases: number
}

type ProductStatsRow = Record<keyof ProductStats, string>

type StatusEntry = {
  title: string
  value: number
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

type TodoEntry = {
  title: string
  detail: string
  count: number
  href: string
  Icon: LucideIcon
}

type ProductClosureEntry = {
  label: string
  value: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

const EMPTY_PRODUCT_STATS: ProductStats = {
  total: 0,
  published: 0,
  draft: 0,
  recent: 0,
  missingCover: 0,
  missingGallery: 0,
  missingCnDescription: 0,
  missingEnDescription: 0,
  missingTags: 0,
  missingFeatures: 0,
  missingDetailModules: 0,
  missingCategory: 0,
  missingSeo: 0,
  missingAttributes: 0,
  missingPriceDisplay: 0,
  missingCommercialTerms: 0,
  missingKeywords: 0,
  missingRelatedProducts: 0,
  deleted: 0,
  categories: 0,
  attributes: 0,
  marks: 0,
  brands: 0,
  filters: 0,
  showcases: 0,
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function parseCount(value: string | undefined): number {
  return parseInt(value ?? '0', 10)
}

const COMMERCIAL_TERM_ZH_KEYS = COMMERCIAL_TERM_FIELD_PAIRS.map((field) => field.zh)
const COMMERCIAL_TERM_EN_KEYS = COMMERCIAL_TERM_FIELD_PAIRS.map((field) => field.en)

function missingCommercialTermsSql(fieldRef: string): string {
  const missingAll = (keys: readonly string[]) => keys
    .map((key) => `NULLIF(BTRIM(COALESCE(${fieldRef} ->> '${key}', '')), '') IS NULL`)
    .join('\n             AND ')

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

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>(
    'SELECT to_regclass($1) AS table_name',
    [tableName],
  )
  return Boolean(res.rows[0]?.table_name)
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content-products] ${label} failed`, err)
    return fallback
  }
}

async function getProductStats(): Promise<ProductStats> {
  if (!(await tableExists('public.product_catalog'))) return EMPTY_PRODUCT_STATS
  await ensureProductCatalogSchema()

  const [res, categories, attributes, marks, brands, filters, showcases] = await Promise.all([
    pool.query<ProductStatsRow>(
    `SELECT
       COUNT(*) FILTER (WHERE deleted_at IS NULL)::text AS total,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '30 days')::text AS recent,
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND NULLIF(BTRIM(image), '') IS NULL)::text AS "missingCover",
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND jsonb_array_length(COALESCE(gallery, '[]'::jsonb)) = 0)::text AS "missingGallery",
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND NULLIF(BTRIM(description_cn), '') IS NULL)::text AS "missingCnDescription",
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND NULLIF(BTRIM(description_en), '') IS NULL)::text AS "missingEnDescription",
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND (jsonb_array_length(COALESCE(tags_cn, '[]'::jsonb)) = 0
            OR jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) = 0
           )
       )::text AS "missingTags",
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND (jsonb_array_length(COALESCE(features_cn, '[]'::jsonb)) = 0
            OR jsonb_array_length(COALESCE(features_en, '[]'::jsonb)) = 0
           )
       )::text AS "missingFeatures",
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND jsonb_array_length(COALESCE(detail_modules, '[]'::jsonb)) = 0)::text AS "missingDetailModules",
       COUNT(*) FILTER (WHERE deleted_at IS NULL AND category_id IS NULL)::text AS "missingCategory",
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND (
             NULLIF(BTRIM(COALESCE(seo_title_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_title_en, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_description_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_description_en, '')), '') IS NULL
           )
       )::text AS "missingSeo",
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND NOT EXISTS (
             SELECT 1 FROM product_attribute_values pav
             WHERE pav.product_id = product_catalog.id
           )
       )::text AS "missingAttributes",
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND NULLIF(BTRIM(COALESCE(price_display_zh, '')), '') IS NULL
           AND NULLIF(BTRIM(COALESCE(price_display_en, '')), '') IS NULL
       )::text AS "missingPriceDisplay",
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND ${PRODUCT_MISSING_COMMERCIAL_SQL}
       )::text AS "missingCommercialTerms",
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND COALESCE(cardinality(keywords_zh), 0) = 0
           AND COALESCE(cardinality(keywords_en), 0) = 0
       )::text AS "missingKeywords",
       COUNT(*) FILTER (
         WHERE deleted_at IS NULL
           AND COALESCE(cardinality(related_product_ids), 0) = 0
       )::text AS "missingRelatedProducts",
       COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::text AS deleted
     FROM product_catalog`,
    ),
    listProductCategories({ includeHidden: true }).catch(() => []),
    listProductAttributeTemplates({ includeHidden: true }).catch(() => []),
    listProductMarks({ includeHidden: true }).catch(() => []),
    listProductBrands({ includeHidden: true }).catch(() => []),
    listProductFilterGroups({ includeHidden: true }).catch(() => []),
    listProductShowcases({ includeHidden: true }).catch(() => []),
  ])
  const row = res.rows[0]

  return {
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    draft: parseCount(row?.draft),
    recent: parseCount(row?.recent),
    missingCover: parseCount(row?.missingCover),
    missingGallery: parseCount(row?.missingGallery),
    missingCnDescription: parseCount(row?.missingCnDescription),
    missingEnDescription: parseCount(row?.missingEnDescription),
    missingTags: parseCount(row?.missingTags),
    missingFeatures: parseCount(row?.missingFeatures),
    missingDetailModules: parseCount(row?.missingDetailModules),
    missingCategory: parseCount(row?.missingCategory),
    missingSeo: parseCount(row?.missingSeo),
    missingAttributes: parseCount(row?.missingAttributes),
    missingPriceDisplay: parseCount(row?.missingPriceDisplay),
    missingCommercialTerms: parseCount(row?.missingCommercialTerms),
    missingKeywords: parseCount(row?.missingKeywords),
    missingRelatedProducts: parseCount(row?.missingRelatedProducts),
    deleted: parseCount(row?.deleted),
    categories: categories.length,
    attributes: attributes.length,
    marks: marks.length,
    brands: brands.length,
    filters: filters.length,
    showcases: showcases.length,
  }
}

function getSideNavGroups(stats: ProductStats): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: stats.total, Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'drafts', label: '草稿内容', href: '#drafts', badge: stats.draft, Icon: FileText },
        { key: 'content-closure', label: '产品内容', href: '#content-closure', Icon: BarChart3 },
        { key: 'product-lifecycle', label: '生命周期', href: '#product-lifecycle', Icon: ClipboardCheck },
        { key: 'create-publish-flow', label: '新建到发布', href: '#product-create-publish-flow', Icon: ArrowRight },
        { key: 'todo', label: '待补内容', href: '#todo', badge: getTodoCount(stats), Icon: CircleDashed },
        { key: 'checks', label: '发布前检查', href: '#checks', Icon: SearchCheck },
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
      title: '运营维护',
      items: [
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', badge: stats.categories, Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', badge: stats.attributes, Icon: SlidersHorizontal },
        { key: 'marks', label: '标记管理', href: '/admin/content/products/marks', badge: stats.marks, Icon: Tags },
        { key: 'brands', label: '品牌管理', href: '/admin/content/products/brands', badge: stats.brands, Icon: Package },
        { key: 'filters', label: '筛选管理', href: '/admin/content/products/filters', badge: stats.filters, Icon: Filter },
        { key: 'showcases', label: '橱窗管理', href: '/admin/content/products/showcases', badge: stats.showcases, Icon: ListChecks },
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: stats.deleted, Icon: Archive },
        { key: 'bulk-check', label: '批量检查', planned: true, Icon: ListChecks },
        { key: 'seo', label: 'SEO 字段治理', href: '/admin/content/products/list?view=incomplete&issue=seo', badge: stats.missingSeo, Icon: Sparkles },
      ],
    },
  ]
}

function getTodoCount(stats: ProductStats): number {
  return [
    stats.missingCover,
    stats.missingGallery,
    stats.missingCnDescription,
    stats.missingEnDescription,
    stats.missingTags,
    stats.missingFeatures,
    stats.missingDetailModules,
    stats.missingCategory,
    stats.missingAttributes,
    stats.missingSeo,
    stats.missingPriceDisplay,
    stats.missingCommercialTerms,
    stats.missingKeywords,
    stats.missingRelatedProducts,
  ].filter((count) => count > 0).length
}

function getStatusEntries(stats: ProductStats): StatusEntry[] {
  return [
    {
      title: '全部产品',
      value: stats.total,
      detail: '进入产品列表继续筛选和编辑',
      href: '/admin/content/products/list',
      Icon: Package,
      tone: 'blue',
    },
    {
      title: '已发布',
      value: stats.published,
      detail: '前台产品页正在展示的内容',
      href: '/admin/content/products/list?status=published',
      Icon: CheckCircle2,
      tone: 'green',
    },
    {
      title: '草稿',
      value: stats.draft,
      detail: '等待补齐或发布的产品',
      href: '/admin/content/products/list?status=draft',
      Icon: FileText,
      tone: 'orange',
    },
    {
      title: '近 30 天新增',
      value: stats.recent,
      detail: '最近创建的产品内容',
      href: '/admin/content/products/list',
      Icon: Sparkles,
      tone: 'neutral',
    },
  ]
}

function getTodoEntries(stats: ProductStats): TodoEntry[] {
  return [
    {
      title: '缺封面',
      detail: '产品列表和详情页缺少第一视觉',
      count: stats.missingCover,
      href: '/admin/content/products/list?view=incomplete&issue=media',
      Icon: ImageIcon,
    },
    {
      title: '缺图库',
      detail: '详情页缺少多图展示素材',
      count: stats.missingGallery,
      href: '/admin/content/products/list?view=incomplete&issue=media',
      Icon: ImageIcon,
    },
    {
      title: '缺中文简介',
      detail: '中文内容还需要补齐',
      count: stats.missingCnDescription,
      href: '/admin/content/products/list?view=incomplete&issue=content',
      Icon: FileText,
    },
    {
      title: '缺英文简介',
      detail: '海外官网展示需要英文简介',
      count: stats.missingEnDescription,
      href: '/admin/content/products/list?view=incomplete&issue=content',
      Icon: FileText,
    },
    {
      title: '缺标签',
      detail: '缺少产品定位和筛选信息',
      count: stats.missingTags,
      href: '/admin/content/products/list?view=incomplete&issue=content',
      Icon: Tags,
    },
    {
      title: '缺亮点',
      detail: '产品卖点还不够清楚',
      count: stats.missingFeatures,
      href: '/admin/content/products/list?view=incomplete&issue=content',
      Icon: Sparkles,
    },
    {
      title: '缺详情模块',
      detail: '详情页缺少结构化展示内容',
      count: stats.missingDetailModules,
      href: '/admin/content/products/list?view=incomplete&issue=content',
      Icon: Layers3,
    },
    {
      title: '未分类',
      detail: '还没有归入产品分类',
      count: stats.missingCategory,
      href: '/admin/content/products/list?view=incomplete&issue=category',
      Icon: Tags,
    },
    {
      title: '缺产品属性',
      detail: '缺少属性模板中的筛选信息',
      count: stats.missingAttributes,
      href: '/admin/content/products/list?view=incomplete&issue=attributes',
      Icon: SlidersHorizontal,
    },
    {
      title: '缺价格展示',
      detail: '产品卡片和详情决策区缺少询价或价格展示口径',
      count: stats.missingPriceDisplay,
      href: '/admin/content/products/list?view=incomplete&issue=price',
      Icon: FileText,
    },
    {
      title: '商务条款中英文不完整',
      detail: '中文和英文至少各保留一组交付、付款、质保等条款',
      count: stats.missingCommercialTerms,
      href: '/admin/content/products/list?view=incomplete&issue=commercial',
      Icon: FileText,
    },
    {
      title: '缺关键词',
      detail: '产品详情页需要搜索关键词',
      count: stats.missingKeywords,
      href: '/admin/content/products/list?view=incomplete&issue=keywords',
      Icon: Tags,
    },
    {
      title: '缺关联产品',
      detail: '产品详情页需要关联推荐产品',
      count: stats.missingRelatedProducts,
      href: '/admin/content/products/list?view=incomplete&issue=related',
      Icon: Package,
    },
    {
      title: '缺 SEO',
      detail: '搜索标题或摘要未补齐',
      count: stats.missingSeo,
      href: '/admin/content/products/list?view=incomplete&issue=seo',
      Icon: Sparkles,
    },
  ]
}

function getProductClosureEntries(stats: ProductStats): ProductClosureEntry[] {
  return [
    {
      label: '产品路径分析',
      value: '路径',
      detail: '查看产品访问、动作、表单和真实线索表现。',
      href: '/admin/status/traffic#product-conversion-path',
      Icon: BarChart3,
      tone: 'blue',
    },
    {
      label: '产品转化复盘',
      value: '复盘',
      detail: '从转化中心回看产品路径、来源阶段和线索承接。',
      href: '/admin/site/conversion',
      Icon: SearchCheck,
      tone: 'green',
    },
    {
      label: 'SEO 待补',
      value: formatNumber(stats.missingSeo),
      detail: '先补产品 SEO，再回看产品路径转化质量。',
      href: '/admin/site/seo#seo-conversion-closure',
      Icon: Sparkles,
      tone: stats.missingSeo > 0 ? 'orange' : 'green',
    },
    {
      label: '产品线索队列',
      value: '线索',
      detail: '进入产品来源队列核对线索阶段。',
      href: '/admin/customers/leads?source_type=product',
      Icon: UsersRound,
      tone: 'neutral',
    },
  ]
}

function getProductLifecycleEntries(stats: ProductStats): ProductClosureEntry[] {
  const todoCount = getTodoCount(stats)

  return [
    {
      label: '新建预检',
      value: '新建',
      detail: '创建前先准备适配字段、媒体证明、详情证明、搜索入口和询盘交接。',
      href: '/admin/content/products/new#new-product-closure',
      Icon: Plus,
      tone: 'blue',
    },
    {
      label: '列表回流队列',
      value: formatNumber(todoCount),
      detail: '从内容队列按适配、证明和询盘缺口筛选待处理产品。',
      href: '/admin/content/products/list#product-fit-proof-backflow',
      Icon: ListChecks,
      tone: todoCount > 0 ? 'orange' : 'green',
    },
    {
      label: '单篇编辑处理',
      value: '编辑',
      detail: '从产品列表进入单篇编辑页，按六个检查步骤定位字段。',
      href: '/admin/content/products/list?view=incomplete',
      Icon: Pencil,
      tone: 'neutral',
    },
    {
      label: '公开产品目录',
      value: formatNumber(stats.published),
      detail: '核对公开 `/products` 的适配筛选、详情证明和询盘路径。',
      href: '/products',
      Icon: Package,
      tone: stats.published > 0 ? 'green' : 'neutral',
    },
    {
      label: '产品线索复盘',
      value: 'source_type',
      detail: '回到产品来源线索，确认内容准备是否带来真实咨询。',
      href: '/admin/customers/leads?source_type=product',
      Icon: UsersRound,
      tone: 'blue',
    },
  ]
}

function Hero({ stats }: { stats: ProductStats }) {
  return (
    <section id="overview" className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#DFF4F7_0%,#F4FBFC_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1889B6]">产品管理</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">产品经营中心</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            先看产品状态和待补内容，再进入列表处理新建、编辑、预览和发布。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/products/new" Icon={Plus} label="新增产品" primary />
          <PrimaryAction href="/admin/content/products/list?status=draft" Icon={FileText} label="查看草稿" />
          <PrimaryAction href="/admin/content/products/list" Icon={Package} label="进入产品列表" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetric title="产品总数" value={stats.total} detail={`已发布 ${formatNumber(stats.published)}`} />
        <HeroMetric title="草稿产品" value={stats.draft} detail="等待补齐或发布" tone="orange" />
        <HeroMetric title="近 30 天新增" value={stats.recent} detail="按创建时间统计" tone="green" />
        <HeroMetric title="待补类型" value={getTodoCount(stats)} detail={`分类 ${formatNumber(stats.categories)} / 回收站 ${formatNumber(stats.deleted)}`} tone="blue" />
      </div>
    </section>
  )
}

function PrimaryAction({
  href,
  Icon,
  label,
  primary = false,
}: {
  href: string
  Icon: LucideIcon
  label: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
        primary
          ? 'bg-[#E36F2C] text-white shadow-sm hover:bg-[#C95E22]'
          : 'border border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#E36F2C]/55 hover:text-[#E36F2C]'
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  )
}

function HeroMetric({
  title,
  value,
  detail,
  tone = 'blue',
}: {
  title: string
  value: number
  detail: string
  tone?: 'blue' | 'green' | 'orange'
}) {
  const toneClass =
    tone === 'orange'
      ? 'from-[#FF9F2F] to-[#F06B22]'
      : tone === 'green'
        ? 'from-[#20B486] to-[#118F79]'
        : 'from-[#1889B6] to-[#3078C8]'

  return (
    <div className={`flex min-h-32 flex-col justify-between rounded-md bg-gradient-to-br ${toneClass} p-5 text-white`}>
      <span className="text-sm font-medium text-white/82">{title}</span>
      <span>
        <span className="block text-4xl font-bold">{formatNumber(value)}</span>
        <span className="mt-2 block text-sm text-white/82">{detail}</span>
      </span>
    </div>
  )
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E2C31]">{title}</h2>
      {detail && <p className="mt-1 text-sm text-[#61767D]">{detail}</p>}
    </div>
  )
}

function StatusGrid({ stats }: { stats: ProductStats }) {
  return (
    <section id="drafts" className="scroll-mt-24 space-y-4">
      <SectionTitle title="产品状态入口" detail="按当前处理目标进入新版产品列表，继续筛选、编辑和发布。" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {getStatusEntries(stats).map((entry) => (
          <StatusCard key={entry.title} entry={entry} />
        ))}
      </div>
    </section>
  )
}

function StatusCard({ entry }: { entry: StatusEntry }) {
  const Icon = entry.Icon
  const accent =
    entry.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : entry.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : entry.tone === 'neutral'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <Link
      href={entry.href}
      className="group rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-md ${accent}`}>
          <Icon size={18} />
        </span>
        <ArrowRight size={16} className="mt-2 text-[#B6C6CA] transition group-hover:text-[#1889B6]" />
      </div>
      <p className="mt-5 text-sm font-semibold text-[#61767D]">{entry.title}</p>
      <p className="mt-1 text-3xl font-bold text-[#1E2C31]">{formatNumber(entry.value)}</p>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{entry.detail}</p>
    </Link>
  )
}

function TodoPanel({ stats }: { stats: ProductStats }) {
  const entries = getTodoEntries(stats)
  const hasTodo = entries.some((entry) => entry.count > 0)

  return (
    <section id="todo" className="scroll-mt-24 space-y-4">
      <SectionTitle title="待补内容" detail="按现有字段统计缺口，提醒运营补齐。" />
      <div className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3 2xl:grid-cols-10">
          {entries.map((entry) => (
            <TodoStat key={entry.title} entry={entry} />
          ))}
        </div>
        {!hasTodo && (
          <div className="border-t border-[#E6EEEE] px-5 py-4 text-sm text-emerald-700">
            当前产品基础内容完整，没有待补提醒。
          </div>
        )}
      </div>
    </section>
  )
}

function TodoStat({ entry }: { entry: TodoEntry }) {
  const Icon = entry.Icon
  const isOk = entry.count === 0

  return (
    <Link
      href={entry.href}
      className="block p-4 transition hover:bg-[#F7FAFA]"
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-md ${
            isOk ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
          }`}
        >
          <Icon size={15} />
        </span>
        <span className="text-xs font-semibold text-[#61767D]">{entry.title}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold ${isOk ? 'text-emerald-700' : 'text-[#E36F2C]'}`}>
        {formatNumber(entry.count)}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{entry.detail}</p>
    </Link>
  )
}

function ProductContentClosurePanel({ stats }: { stats: ProductStats }) {
  const entries = getProductClosureEntries(stats)
  const sourceContracts: ProductClosureEntry[] = [
    {
      label: '来源总览',
      value: 'product:*',
      detail: '回到产品列表查看卡片 CTA、详情 CTA、询盘表单和线索筛选约定。',
      href: '/admin/content/products/list#product-source-contract',
      Icon: Link2,
      tone: 'blue',
    },
    {
      label: '卡片 CTA',
      value: 'catalog_card',
      detail: '公开产品列表卡片咨询入口，回到产品来源阶段复盘。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Acatalog_card_cta',
      Icon: Package,
      tone: 'green',
    },
    {
      label: '详情 CTA',
      value: 'detail_cta',
      detail: '产品详情页 Learn More / Appointment 动作，回到产品线索阶段。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Acta_click',
      Icon: SearchCheck,
      tone: 'orange',
    },
    {
      label: '表单承接',
      value: 'inquiry_form',
      detail: '产品询盘表单进入 leads 后，用 source_stage 精确区分样本。',
      href: '/admin/customers/leads?source_type=product&source_stage=product%3Ainquiry_form',
      Icon: ListChecks,
      tone: 'neutral',
    },
  ]

  return (
    <section id="content-closure" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <SectionTitle
          title="产品内容处理"
          detail="把产品内容待补、流量路径、SEO 待补和产品线索放在同一入口，方便运营判断优先级。"
        />
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/products/list?view=incomplete&issue=seo" Icon={Sparkles} label="产品 SEO 待补" />
          <PrimaryAction href="/admin/content/products/list" Icon={Package} label="产品列表" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {entries.map((entry) => (
          <ProductClosureCard key={entry.label} entry={entry} />
        ))}
      </div>
      <ProductSourceContractStrip entries={sourceContracts} />
      <ProductLifecycleControlStrip stats={stats} />
      <ProductCreatePublishFlowPanel stats={stats} />
      <div className="grid grid-cols-1 gap-3 rounded-md border border-[#D8E7E8] bg-white p-4 text-sm shadow-sm md:grid-cols-3">
        <ClosureSnapshot label="已发布产品" value={stats.published} detail="前台产品页可见内容" />
        <ClosureSnapshot label="待补类型" value={getTodoCount(stats)} detail="影响内容完整度的字段组" />
        <ClosureSnapshot label="SEO 待补" value={stats.missingSeo} detail="搜索标题或摘要未补齐" />
      </div>
    </section>
  )
}

function ProductLifecycleControlStrip({ stats }: { stats: ProductStats }) {
  const entries = getProductLifecycleEntries(stats)

  return (
    <div
      id="product-lifecycle"
      data-product-lifecycle-control="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1889B6]">产品运营入口</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">产品内容运营入口</h3>
        </div>
        <p className="max-w-3xl text-xs leading-5 text-[#61767D]">
          把新建预检、列表补齐、单篇编辑、公开目录和产品线索复盘串成同一条运营路径。
        </p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {entries.map((entry) => (
          <ProductSourceContractLink key={entry.label} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function ProductCreatePublishFlowPanel({ stats }: { stats: ProductStats }) {
  const todoCount = getTodoCount(stats)
  const stages: ProductClosureEntry[] = [
    {
      label: '01 新建草稿审批',
      value: '新建审批',
      detail: '先到新建页核对分类属性、媒体、关联推荐和发布影响边界，再保存草稿。',
      href: '/admin/content/products/new#new-product-draft-approval-desk',
      Icon: Plus,
      tone: 'blue',
    },
    {
      label: '02 表单发布审批',
      value: '发布审批',
      detail: '进入表单发布检查区，核对保存状态、发布缺项、运营归属和询盘交接。',
      href: '/admin/content/products/new#publish-check',
      Icon: SearchCheck,
      tone: 'green',
    },
    {
      label: '03 单品发布检查',
      value: '单品检查',
      detail: '保存后回到单品编辑页做恢复后发布前检查和人工确认。',
      href: '/admin/content/products/list?status=draft',
      Icon: Pencil,
      tone: 'neutral',
    },
    {
      label: '04 草稿补齐队列',
      value: formatNumber(stats.draft),
      detail: '回到产品列表定位草稿补齐队列，把缺项转成下一轮运营动作。',
      href: '/admin/content/products/list?status=draft#product-draft-recovery-readiness-desk',
      Icon: ListChecks,
      tone: stats.draft > 0 ? 'orange' : 'green',
    },
    {
      label: '05 公开目录复盘',
      value: formatNumber(stats.published),
      detail: '发布后核对公开产品目录、详情页、CTA 和 product 来源线索。',
      href: '/products',
      Icon: Package,
      tone: stats.published > 0 ? 'green' : 'neutral',
    },
  ]
  const handoffCards: ProductClosureEntry[] = [
    {
      label: '待补类型',
      value: formatNumber(todoCount),
      detail: '如果待补类型仍存在，先走列表 incomplete 视图而不是直接发布。',
      href: '/admin/content/products/list?view=incomplete',
      Icon: CircleDashed,
      tone: todoCount > 0 ? 'orange' : 'green',
    },
    {
      label: '草稿库存',
      value: formatNumber(stats.draft),
      detail: '草稿多时优先处理草稿补齐队列，减少发布前人工检查压力。',
      href: '/admin/content/products/list?status=draft#product-draft-recovery-readiness-desk',
      Icon: FileText,
      tone: stats.draft > 0 ? 'orange' : 'green',
    },
    {
      label: '运营底座',
      value: `${formatNumber(stats.categories)}/${formatNumber(stats.attributes)}`,
      detail: '分类和属性模板决定新建后能否进入公开目录筛选。',
      href: '/admin/content/products/attributes',
      Icon: SlidersHorizontal,
      tone: stats.categories > 0 && stats.attributes > 0 ? 'green' : 'orange',
    },
  ]

  return (
    <div
      id="product-create-publish-flow"
      data-product-create-publish-flow="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E36F2C]">Create To Publish</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">新建到发布流程总览</h3>
        </div>
        <p className="max-w-3xl text-xs leading-5 text-[#61767D]">
          把新建草稿审批、表单发布审批、单品检查、草稿补齐和公开目录复盘压缩到总览页。
        </p>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {stages.map((entry) => (
          <ProductSourceContractLink key={entry.label} entry={entry} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] bg-[#F7FAFA] p-4 md:grid-cols-3">
        {handoffCards.map((entry) => (
          <Link key={entry.label} href={entry.href} className="rounded-md border border-[#D8E7E8] bg-white p-4 transition hover:border-[#1889B6] hover:bg-[#F0F7F8]">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#1E2C31]">{entry.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[#61767D]">{entry.detail}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6]">
                <entry.Icon size={16} />
              </span>
            </span>
            <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              entry.tone === 'orange'
                ? 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
                : entry.tone === 'green'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-[#D8E7E8] bg-[#FBFDFD] text-[#61767D]'
            }`}>
              {entry.value}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ProductSourceContractStrip({ entries }: { entries: ProductClosureEntry[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1889B6]">Source Contract</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">产品来源线索</h3>
        </div>
        <p className="max-w-3xl text-xs leading-5 text-[#61767D]">
          对齐公开产品页的 Learn More / Appointment 心智，把产品卡片、详情 CTA、询盘表单和产品来源线索队列放到同一条运营路径。
        </p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {entries.map((entry) => (
          <ProductSourceContractLink key={entry.label} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function ProductSourceContractLink({ entry }: { entry: ProductClosureEntry }) {
  const Icon = entry.Icon
  const toneClass =
    entry.tone === 'orange'
      ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
      : entry.tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : entry.tone === 'neutral'
          ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
          : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link href={entry.href} className="group min-h-[132px] px-4 py-4 transition hover:bg-[#F7FAFA]">
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#1E2C31]">{entry.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${toneClass}`}>
            <span className="truncate">{entry.value}</span>
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block text-xs leading-5 text-[#61767D]">{entry.detail}</span>
    </Link>
  )
}

function ProductClosureCard({ entry }: { entry: ProductClosureEntry }) {
  const Icon = entry.Icon
  const toneClass =
    entry.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : entry.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : entry.tone === 'neutral'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <Link
      href={entry.href}
      className="group rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={18} />
        </span>
        <ArrowRight size={16} className="mt-2 text-[#B6C6CA] transition group-hover:text-[#1889B6]" />
      </div>
      <p className="mt-5 text-sm font-semibold text-[#61767D]">{entry.label}</p>
      <p className="mt-1 text-3xl font-bold text-[#1E2C31]">{entry.value}</p>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{entry.detail}</p>
    </Link>
  )
}

function ClosureSnapshot({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="min-w-0 rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      <div className="mt-1 text-2xl font-bold text-[#1E2C31]">{formatNumber(value)}</div>
      <div className="mt-1 text-xs leading-5 text-[#8A9EA4]">{detail}</div>
    </div>
  )
}

function ActionPanel() {
  const actions = [
    { label: '新增产品', detail: '创建新草稿并进入新版产品表单', href: '/admin/content/products/new', Icon: Plus },
    { label: '查看草稿', detail: '处理待补齐或待发布的产品', href: '/admin/content/products/list?status=draft', Icon: FileText },
    { label: '查看已发布', detail: '检查前台正在展示的产品', href: '/admin/content/products/list?status=published', Icon: CheckCircle2 },
    { label: '进入产品列表', detail: '继续搜索、筛选和编辑产品', href: '/admin/content/products/list', Icon: Package },
    { label: '分类管理', detail: '维护产品分类、排序和显示状态', href: '/admin/content/products/categories', Icon: Tags },
    { label: '属性模板', detail: '维护产品属性模板和筛选选项', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
    { label: '标记管理', detail: '维护产品运营标记并支持批量打标', href: '/admin/content/products/marks', Icon: Tags },
    { label: '品牌管理', detail: '维护品牌并绑定到产品表单', href: '/admin/content/products/brands', Icon: Package },
    { label: '筛选管理', detail: '组合属性模板形成筛选组', href: '/admin/content/products/filters', Icon: Filter },
    { label: '橱窗管理', detail: '把重点产品编组成展示橱窗', href: '/admin/content/products/showcases', Icon: ListChecks },
    { label: '产品回收站', detail: '恢复误删产品为草稿', href: '/admin/content/products/recycle', Icon: Archive },
  ]

  return (
    <section className="space-y-4">
      <SectionTitle title="常用动作" detail="这里进入新版产品链路处理日常新建、筛选和编辑。" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex min-h-20 items-start gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#E36F2C]/50 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
              <action.Icon size={17} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#1E2C31]">{action.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[#61767D]">{action.detail}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function WorkflowPanel() {
  const steps = [
    { title: '新建草稿', detail: '先创建产品，默认进入草稿处理。' },
    { title: '补齐内容', detail: '完善封面、图库、中英文简介、标签、亮点和详情模块。' },
    { title: '预览检查', detail: '确认前台展示路径和内容完整度。' },
    { title: '发布', detail: '发布、下架和删除仍在产品维护页完成。' },
  ]

  return (
    <section id="checks" className="scroll-mt-24 space-y-4">
      <SectionTitle title="产品运营流程" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-md border border-[#D8E7E8] bg-white p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E36F2C] text-sm font-bold text-white">
              {index + 1}
            </span>
            <p className="mt-4 text-sm font-semibold text-[#1E2C31]">{step.title}</p>
            <p className="mt-2 text-xs leading-5 text-[#61767D]">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PlanningPanel() {
  const items = ['批量检查', '状态/置顶批量操作', '权限矩阵']

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/70 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
          <ClipboardCheck size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">运营维护</h2>
          <p className="mt-1 text-xs text-[#61767D]">分类、属性、品牌、筛选、橱窗、回收站和 SEO 检查入口集中在这里。</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-[#F0F2F2] px-3 py-1 text-xs font-semibold text-[#8A9EA4]">
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}

export default async function AdminContentProductsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const stats = await safeLoad('product stats', getProductStats, EMPTY_PRODUCT_STATS)
  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="内容管理"
      description="围绕产品、项目和新闻处理发布、草稿和待补内容。"
      sideNavGroups={getSideNavGroups(stats)}
      activeItem="products"
    >
      <Hero stats={stats} />
      <div className="space-y-8">
        <ProductContentClosurePanel stats={stats} />
        <StatusGrid stats={stats} />
        <TodoPanel stats={stats} />
        <ActionPanel />
        <WorkflowPanel />
        <PlanningPanel />
      </div>
    </AdminSectionShell>
  )
}
