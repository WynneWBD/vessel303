import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
import { ensureProductCatalogSchema, listProductAttributeTemplates, listProductCategories } from '@/lib/product-catalog-db'
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  FileText,
  ImageIcon,
  Layers3,
  ListChecks,
  Package,
  Plus,
  SearchCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
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
  deleted: number
  categories: number
  attributes: number
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
  Icon: LucideIcon
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
  deleted: 0,
  categories: 0,
  attributes: 0,
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function parseCount(value: string | undefined): number {
  return parseInt(value ?? '0', 10)
}

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

  const [res, categories, attributes] = await Promise.all([
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
       COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::text AS deleted
     FROM product_catalog`,
    ),
    listProductCategories({ includeHidden: true }).catch(() => []),
    listProductAttributeTemplates({ includeHidden: true }).catch(() => []),
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
    deleted: parseCount(row?.deleted),
    categories: categories.length,
    attributes: attributes.length,
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
      title: '后续规划',
      items: [
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', badge: stats.categories, Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', badge: stats.attributes, Icon: SlidersHorizontal },
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: stats.deleted, Icon: Archive },
        { key: 'bulk-check', label: '批量检查', planned: true, Icon: ListChecks },
        { key: 'seo', label: 'SEO 字段治理', href: '/admin/content/products/list?view=incomplete', badge: stats.missingSeo, Icon: Sparkles },
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
      Icon: ImageIcon,
    },
    {
      title: '缺图库',
      detail: '详情页缺少多图展示素材',
      count: stats.missingGallery,
      Icon: ImageIcon,
    },
    {
      title: '缺中文简介',
      detail: '中文内容还需要补齐',
      count: stats.missingCnDescription,
      Icon: FileText,
    },
    {
      title: '缺英文简介',
      detail: '海外官网展示需要英文简介',
      count: stats.missingEnDescription,
      Icon: FileText,
    },
    {
      title: '缺标签',
      detail: '缺少产品定位和筛选信息',
      count: stats.missingTags,
      Icon: Tags,
    },
    {
      title: '缺亮点',
      detail: '产品卖点还不够清楚',
      count: stats.missingFeatures,
      Icon: Sparkles,
    },
    {
      title: '缺详情模块',
      detail: '详情页缺少结构化展示内容',
      count: stats.missingDetailModules,
      Icon: Layers3,
    },
    {
      title: '未分类',
      detail: '还没有归入产品分类',
      count: stats.missingCategory,
      Icon: Tags,
    },
    {
      title: '缺产品属性',
      detail: '缺少属性模板中的筛选信息',
      count: stats.missingAttributes,
      Icon: SlidersHorizontal,
    },
    {
      title: '缺 SEO',
      detail: '搜索标题或摘要未补齐',
      count: stats.missingSeo,
      Icon: Sparkles,
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
      <SectionTitle title="待补内容" detail="按现有字段做只读统计，只提醒运营补齐，不改变发布规则。" />
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
    <div className="p-4">
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
  const items = ['标记管理', '品牌管理', '筛选管理', '橱窗管理', '批量检查']

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/70 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
          <ClipboardCheck size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">后续规划</h2>
          <p className="mt-1 text-xs text-[#61767D]">对照 300 产品管理，分类、属性模板、回收站、低风险批量转分类和 SEO 已进入 B4；以下能力后续单独立项。</p>
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
        <StatusGrid stats={stats} />
        <TodoPanel stats={stats} />
        <ActionPanel />
        <WorkflowPanel />
        <PlanningPanel />
      </div>
    </AdminSectionShell>
  )
}
