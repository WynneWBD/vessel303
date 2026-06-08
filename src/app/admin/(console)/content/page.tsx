import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  AdminActionLink,
  AdminMetricCard,
  AdminPageHero,
  AdminSectionTitle,
} from '@/components/admin/AdminUI'
import { pool } from '@/lib/db'
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileArchive,
  FileQuestion,
  FileText,
  GalleryHorizontalEnd,
  Lightbulb,
  ListChecks,
  LayoutTemplate,
  MapPinned,
  Newspaper,
  Package,
  Plus,
  Presentation,
  SearchCheck,
  Settings,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '内容管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type ContentKind = 'products' | 'projects' | 'news'

type ContentSummary = {
  draft: number
  published: number
  total: number
  recent: number
}

type ContentDashboardSummary = Record<ContentKind, ContentSummary>

type TodoItem = {
  title: string
  detail: string
  href?: string
  count?: number
  ok: boolean
}

type ContentDomain = {
  key: ContentKind
  title: string
  detail: string
  href: string
  newHref: string
  Icon: LucideIcon
  action: string
  tone: 'blue' | 'green' | 'orange'
}

type SecondaryContentDomain = {
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}

type ContentWorkbenchRow = {
  title: string
  detail: string
  total: number
  draft: number
  recent: number
  signal: number
  signalLabel: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange'
  actions: Array<{ label: string; href: string }>
}

const EMPTY_SUMMARY: ContentSummary = {
  draft: 0,
  published: 0,
  total: 0,
  recent: 0,
}

const EMPTY_DASHBOARD_SUMMARY: ContentDashboardSummary = {
  products: EMPTY_SUMMARY,
  projects: EMPTY_SUMMARY,
  news: EMPTY_SUMMARY,
}

const CONTENT_DOMAINS: ContentDomain[] = [
  {
    key: 'products',
    title: '产品',
    detail: '维护产品资料、封面、图库、详情和发布状态。',
    href: '/admin/content/products',
    newHref: '/admin/content/products/new',
    Icon: Package,
    action: '发布产品',
    tone: 'blue',
  },
  {
    key: 'projects',
    title: '项目案例',
    detail: '维护正式项目案例内容；Global 只作为地图展示渠道。',
    href: '/admin/content/projects',
    newHref: '/admin/content/projects/new',
    Icon: MapPinned,
    action: '发布项目',
    tone: 'green',
  },
  {
    key: 'news',
    title: '新闻',
    detail: '维护新闻标题、封面、正文、预览和发布状态。',
    href: '/admin/content/news',
    newHref: '/admin/content/news/new',
    Icon: Newspaper,
    action: '发布新闻',
    tone: 'orange',
  },
]

const SECONDARY_CONTENT_DOMAINS: SecondaryContentDomain[] = [
  {
    key: 'faq',
    title: 'FAQ',
    detail: '常见问题分类、排序、草稿、发布和隐藏。',
    href: '/admin/content/faq',
    Icon: FileQuestion,
  },
  {
    key: 'media-kit',
    title: '文件下载',
    detail: 'Media Kit 资源和申请线索入口。',
    href: '/admin/content/media-kit',
    Icon: FileArchive,
  },
  {
    key: 'scenarios',
    title: '场景方案',
    detail: '固定场景页 tourism / commercial / public。',
    href: '/admin/content/scenarios',
    Icon: Presentation,
  },
  {
    key: 'display',
    title: 'Display 展示',
    detail: '展示页读取橱窗或后台配置内容。',
    href: '/admin/content/display',
    Icon: GalleryHorizontalEnd,
  },
  {
    key: 'innovation',
    title: '技术专题',
    detail: 'VI/IE、VIPC、VOLS 固定专题内容。',
    href: '/admin/content/innovation',
    Icon: Lightbulb,
  },
]

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content] ${label} failed`, err)
    return fallback
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>(
    'SELECT to_regclass($1) AS table_name',
    [tableName],
  )
  return Boolean(res.rows[0]?.table_name)
}

function tableForKind(kind: ContentKind): string {
  if (kind === 'products') return 'product_catalog'
  if (kind === 'projects') return 'project_cases'
  return 'news'
}

async function countContentSummary(kind: ContentKind): Promise<ContentSummary> {
  const tableName = tableForKind(kind)
  if (!(await tableExists(`public.${tableName}`))) return EMPTY_SUMMARY

  const res = await pool.query<{
    draft: string
    published: string
    total: string
    recent: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent
     FROM ${tableName}
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    draft: parseInt(row?.draft ?? '0', 10),
    published: parseInt(row?.published ?? '0', 10),
    total: parseInt(row?.total ?? '0', 10),
    recent: parseInt(row?.recent ?? '0', 10),
  }
}

async function getContentSummary(): Promise<ContentDashboardSummary> {
  const [products, projects, news] = await Promise.all([
    countContentSummary('products'),
    countContentSummary('projects'),
    countContentSummary('news'),
  ])
  return { products, projects, news }
}

async function countProjectsMissingCoordinates(): Promise<number> {
  if (!(await tableExists('public.project_cases'))) return 0
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM project_cases
     WHERE deleted_at IS NULL
       AND (latitude IS NULL OR longitude IS NULL)`,
  )
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

function getTotals(summary: ContentDashboardSummary) {
  const draft = summary.products.draft + summary.projects.draft + summary.news.draft
  const published = summary.products.published + summary.projects.published + summary.news.published
  const total = summary.products.total + summary.projects.total + summary.news.total
  const recent = summary.products.recent + summary.projects.recent + summary.news.recent
  return { draft, published, total, recent }
}

function getContentSideNav(summary: ContentDashboardSummary): AdminSideNavGroup[] {
  const totals = getTotals(summary)

  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: LayoutTemplate },
        { key: 'todo', label: '待补内容', href: '#todo', badge: totals.draft, Icon: CircleDashed },
        { key: 'drafts', label: '草稿内容', href: '#drafts', badge: totals.draft, Icon: FileText },
        { key: 'checks', label: '发布前检查', href: '#checks', Icon: SearchCheck },
      ],
    },
    {
      title: '内容类型',
      items: [
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: summary.products.total, Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', badge: summary.projects.total, Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', badge: summary.news.total, Icon: Newspaper },
        { key: 'faq', label: 'FAQ', href: '/admin/content/faq', Icon: FileQuestion },
        { key: 'media-kit', label: '文件下载', href: '/admin/content/media-kit', Icon: FileArchive },
        { key: 'scenarios', label: '场景方案', href: '/admin/content/scenarios', Icon: Presentation },
        { key: 'display', label: 'Display 展示', href: '/admin/content/display', Icon: GalleryHorizontalEnd },
        { key: 'innovation', label: '技术专题', href: '/admin/content/innovation', Icon: Lightbulb },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'taxonomy', label: '分类与标签', planned: true, Icon: Tags },
        { key: 'recycle', label: '回收站', planned: true, Icon: Archive },
        { key: 'bulk-check', label: '批量内容检查', planned: true, Icon: ListChecks },
      ],
    },
  ]
}

function buildTodos({
  summary,
  missingProjectCoordinates,
}: {
  summary: ContentDashboardSummary
  missingProjectCoordinates: number
}): TodoItem[] {
  return [
    {
      title: '产品草稿',
      detail: summary.products.draft > 0 ? '检查图片、英文和详情' : '暂无产品草稿',
      href: '/admin/content/products/list?status=draft',
      count: summary.products.draft,
      ok: summary.products.draft === 0,
    },
    {
      title: '项目草稿',
      detail: summary.projects.draft > 0 ? '检查封面、图库和坐标' : '暂无项目草稿',
      href: '/admin/content/projects/list?status=draft',
      count: summary.projects.draft,
      ok: summary.projects.draft === 0,
    },
    {
      title: '新闻草稿',
      detail: summary.news.draft > 0 ? '检查标题、封面和正文' : '暂无新闻草稿',
      href: '/admin/content/news/list?status=draft',
      count: summary.news.draft,
      ok: summary.news.draft === 0,
    },
    {
      title: '项目地图信息',
      detail: missingProjectCoordinates > 0 ? '有项目缺少坐标' : '项目坐标状态正常',
      href: '/admin/content/projects/list?view=missing-coordinates',
      count: missingProjectCoordinates,
      ok: missingProjectCoordinates === 0,
    },
  ]
}

function Hero({ summary }: { summary: ContentDashboardSummary }) {
  const totals = getTotals(summary)

  return (
    <AdminPageHero
      kicker="Content Operations"
      title="内容经营中心"
      description="先看内容状态，再发布产品、项目和新闻；核心 CMS 与固定内容入口保持同一套编辑心智。"
      actions={
        <>
          <AdminActionLink href="/admin/content/products/new" Icon={Package} label="发布产品" primary />
          <AdminActionLink href="/admin/content/projects/new" Icon={MapPinned} label="发布项目" />
          <AdminActionLink href="/admin/content/news/new" Icon={Newspaper} label="发布新闻" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <AdminMetricCard title="内容总量" value={totals.total} detail={`已发布 ${formatNumber(totals.published)}`} Icon={Package} />
          <AdminMetricCard title="草稿内容" value={totals.draft} detail="等待检查或发布" Icon={FileText} tone="orange" />
          <AdminMetricCard title="近 30 天新增" value={totals.recent} detail="产品 / 项目 / 新闻" Icon={CheckCircle2} tone="green" />
          <AdminMetricCard
            title="内容域"
            value={CONTENT_DOMAINS.length + SECONDARY_CONTENT_DOMAINS.length}
            detail="核心 CMS + 固定内容"
            Icon={LayoutTemplate}
            tone="blue"
          />
      </div>
    </AdminPageHero>
  )
}

function ContentListWorkbench({
  summary,
  missingProjectCoordinates,
}: {
  summary: ContentDashboardSummary
  missingProjectCoordinates: number
}) {
  const rows: ContentWorkbenchRow[] = [
    {
      title: '产品列表',
      detail: '产品发布、草稿、内容缺项和运营标记',
      total: summary.products.total,
      draft: summary.products.draft,
      recent: summary.products.recent,
      signal: summary.products.draft,
      signalLabel: '草稿',
      href: '/admin/content/products/list',
      Icon: Package,
      tone: summary.products.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/products/list' },
        { label: '草稿', href: '/admin/content/products/list?status=draft' },
        { label: '待补', href: '/admin/content/products/list?view=incomplete' },
        { label: '新建', href: '/admin/content/products/new' },
      ],
    },
    {
      title: '项目案例',
      detail: '项目草稿、封面图库、坐标和 Global 入图',
      total: summary.projects.total,
      draft: summary.projects.draft,
      recent: summary.projects.recent,
      signal: missingProjectCoordinates,
      signalLabel: '缺坐标',
      href: '/admin/content/projects/list',
      Icon: MapPinned,
      tone: missingProjectCoordinates > 0 || summary.projects.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/projects/list' },
        { label: '草稿', href: '/admin/content/projects/list?status=draft' },
        { label: '缺坐标', href: '/admin/content/projects/list?view=missing-coordinates' },
        { label: '新建', href: '/admin/content/projects/new' },
      ],
    },
    {
      title: '新闻列表',
      detail: '新闻草稿、分类、排期、正文和 SEO',
      total: summary.news.total,
      draft: summary.news.draft,
      recent: summary.news.recent,
      signal: summary.news.draft,
      signalLabel: '草稿',
      href: '/admin/content/news/list',
      Icon: Newspaper,
      tone: summary.news.draft > 0 ? 'orange' : 'green',
      actions: [
        { label: '全部', href: '/admin/content/news/list' },
        { label: '草稿', href: '/admin/content/news/list?status=draft' },
        { label: '定时', href: '/admin/content/news/list?schedule=scheduled' },
        { label: '新建', href: '/admin/content/news/new' },
      ],
    },
  ]

  return (
    <section className="space-y-4">
      <AdminSectionTitle
        title="内容处理工作台"
        detail="先进入列表处理，再按草稿、待补、坐标、排期等筛选推进。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="hidden grid-cols-[200px_120px_120px_120px_minmax(0,1fr)_170px] gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] lg:grid">
          <span>内容类型</span>
          <span>总量 / 草稿</span>
          <span>近 30 天</span>
          <span>当前信号</span>
          <span>处理入口</span>
          <span>列表工作台</span>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {rows.map((row) => (
            <ContentWorkbenchRowView key={row.title} row={row} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ContentWorkbenchRowView({ row }: { row: ContentWorkbenchRow }) {
  const Icon = row.Icon
  const toneClass =
    row.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : row.tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 text-sm lg:grid-cols-[200px_120px_120px_120px_minmax(0,1fr)_170px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-[#1E2C31]">{row.title}</span>
          <span className="mt-1 block truncate text-xs text-[#61767D]">{row.detail}</span>
        </span>
      </div>
      <span className="font-bold text-[#1E2C31]">
        {formatNumber(row.total)} / {formatNumber(row.draft)}
      </span>
      <span className="text-sm font-semibold text-[#61767D]">{formatNumber(row.recent)}</span>
      <span
        className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-bold ${
          row.signal > 0 ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        {row.signalLabel} {formatNumber(row.signal)}
      </span>
      <span className="flex flex-wrap gap-2">
        {row.actions.map((action) => (
          <Link
            key={`${row.title}-${action.label}`}
            href={action.href}
            className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:bg-white hover:text-[#1889B6]"
          >
            {action.label}
          </Link>
        ))}
      </span>
      <Link
        href={row.href}
        className="inline-flex h-9 w-fit items-center gap-1 rounded-md border border-[#1889B6]/25 bg-[#EAF6F8] px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
      >
        进入列表
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function ContentDomainGrid({ summary }: { summary: ContentDashboardSummary }) {
  return (
    <section id="drafts" className="scroll-mt-24 space-y-4">
      <AdminSectionTitle title="内容经营" detail="按内容域查看总量、草稿和近 30 天新增。" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {CONTENT_DOMAINS.map((domain) => (
          <ContentDomainCard key={domain.key} domain={domain} summary={summary[domain.key]} />
        ))}
      </div>
      <SecondaryContentGrid />
    </section>
  )
}

function SecondaryContentGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {SECONDARY_CONTENT_DOMAINS.map((domain) => {
        const Icon = domain.Icon
        return (
          <Link
            key={domain.key}
            href={domain.href}
            className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
              <Icon size={18} />
            </span>
            <span className="mt-4 block text-sm font-bold text-[#1E2C31]">{domain.title}</span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{domain.detail}</span>
          </Link>
        )
      })}
    </div>
  )
}

function ContentDomainCard({
  domain,
  summary,
}: {
  domain: ContentDomain
  summary: ContentSummary
}) {
  const Icon = domain.Icon
  const accent =
    domain.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : domain.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${accent}`}>
          <Icon size={20} />
        </span>
        <Link
          href={domain.newHref}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
        >
          <Plus size={14} />
          {domain.action}
        </Link>
      </div>
      <h2 className="mt-5 text-lg font-bold text-[#1E2C31]">{domain.title}</h2>
      <p className="mt-2 min-h-10 text-sm leading-6 text-[#61767D]">{domain.detail}</p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <SmallStat label="总数" value={summary.total} />
        <SmallStat label="草稿" value={summary.draft} />
        <SmallStat label="近 30 天" value={summary.recent} />
      </div>
      <Link
        href={domain.href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#E36F2C]"
      >
        进入管理
        <ArrowRight size={15} />
      </Link>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3">
      <span className="block text-xs text-[#61767D]">{label}</span>
      <span className="mt-1 block text-xl font-bold text-[#1E2C31]">{formatNumber(value)}</span>
    </span>
  )
}

function ActionMatrix() {
  const actions = [
    { label: '产品管理', href: '/admin/content/products', Icon: Package },
    { label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
    { label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
    { label: 'FAQ', href: '/admin/content/faq', Icon: FileQuestion },
    { label: '文件下载', href: '/admin/content/media-kit', Icon: FileArchive },
    { label: '场景方案', href: '/admin/content/scenarios', Icon: Presentation },
    { label: 'Display 展示', href: '/admin/content/display', Icon: GalleryHorizontalEnd },
    { label: '技术专题', href: '/admin/content/innovation', Icon: Lightbulb },
  ]

  return (
    <section className="space-y-4">
      <AdminSectionTitle title="管理入口" detail="查看已有内容，继续筛选、编辑和发布。" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={`${action.label}-${action.href}`}
            href={action.href}
            className="flex min-h-16 items-center gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-[#1889B6]/60 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
              <action.Icon size={17} />
            </span>
            <span className="text-sm font-semibold text-[#1E2C31]">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function WorkflowPanel() {
  const steps = ['新建草稿', '补齐标题、图片、英文、SEO', '预览', '发布']

  return (
    <section className="space-y-4">
      <AdminSectionTitle title="内容运营流程" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step} className="rounded-md border border-[#D8E7E8] bg-white p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E36F2C] text-sm font-bold text-white">
              {index + 1}
            </span>
            <p className="mt-4 text-sm font-semibold text-[#1E2C31]">{step}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function TodoPanel({ items }: { items: TodoItem[] }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section id="todo" className="scroll-mt-24 rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">待补内容</h2>
          <p className="mt-1 text-xs text-[#61767D]">只做提醒，不阻止发布。</p>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {items.map((item) => (
            <TodoRow key={item.title} item={item} />
          ))}
        </div>
      </section>
      <section id="checks" className="scroll-mt-24 rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <SearchCheck size={19} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#1E2C31]">发布前检查</h2>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              发布前会提示关键缺失项，已发布内容也可继续补充。
            </p>
          </div>
        </div>
      </section>
    </aside>
  )
}

function TodoRow({ item }: { item: TodoItem }) {
  const icon = item.ok ? (
    <CheckCircle2 size={18} className="text-emerald-600" />
  ) : (
    <CircleDashed size={18} className="text-[#E36F2C]" />
  )
  const content = (
    <span className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#1E2C31]">{item.title}</span>
          {item.count != null && <span className="text-sm font-bold text-[#E36F2C]">{formatNumber(item.count)}</span>}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
      </span>
    </span>
  )

  if (!item.href) return <div className="block px-5 py-4">{content}</div>
  return (
    <Link href={item.href} className="block px-5 py-4 transition hover:bg-[#F7FAFA]">
      {content}
    </Link>
  )
}

function MaintenanceBlock() {
  return (
    <section id="maintenance" className="rounded-md border border-dashed border-[#D8E7E8] bg-white/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">管理设置</h2>
          <p className="mt-1 text-xs text-[#61767D]">仅管理员使用，内容运营优先使用上方入口。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MaintenanceLink href="/admin/settings" label="站点设置" Icon={Settings} />
          <MaintenanceLink href="/admin/site/visual" label="页面管理" Icon={LayoutTemplate} />
        </div>
      </div>
    </section>
  )
}

function MaintenanceLink({
  href,
  label,
  Icon,
}: {
  href: string
  label: string
  Icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}

export default async function AdminContentPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [summary, missingProjectCoordinates] = await Promise.all([
    safeLoad('content summary', () => getContentSummary(), EMPTY_DASHBOARD_SUMMARY),
    safeLoad('project missing coordinates', () => countProjectsMissingCoordinates(), 0),
  ])
  const adminRole: AdminRole = role
  const isAdmin = adminRole === 'admin'
  const todos = buildTodos({ summary, missingProjectCoordinates })
  const sideNavGroups = getContentSideNav(summary)

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="内容管理"
      description="发布产品、项目和新闻，检查草稿与待补内容。"
      sideNavGroups={sideNavGroups}
      activeItem="overview"
    >
      <Hero summary={summary} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <ContentListWorkbench summary={summary} missingProjectCoordinates={missingProjectCoordinates} />
          <ContentDomainGrid summary={summary} />
          <ActionMatrix />
          <WorkflowPanel />
          {isAdmin && <MaintenanceBlock />}
        </div>
        <TodoPanel items={todos} />
      </div>
    </AdminSectionShell>
  )
}
