import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileText,
  ListChecks,
  LayoutTemplate,
  MapPinned,
  Newspaper,
  Package,
  Plus,
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
    href: '/admin/products',
    newHref: '/admin/products/new',
    Icon: Package,
    action: '发布产品',
    tone: 'blue',
  },
  {
    key: 'projects',
    title: '项目案例',
    detail: '维护案例图片、简介、坐标和 Global 展示资料。',
    href: '/admin/projects',
    newHref: '/admin/projects/new',
    Icon: MapPinned,
    action: '发布项目',
    tone: 'green',
  },
  {
    key: 'news',
    title: '新闻',
    detail: '维护新闻标题、封面、正文、预览和发布状态。',
    href: '/admin/news',
    newHref: '/admin/news/new',
    Icon: Newspaper,
    action: '发布新闻',
    tone: 'orange',
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
        { key: 'products', label: '产品管理', href: '/admin/products', badge: summary.products.total, Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/projects', badge: summary.projects.total, Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/news', badge: summary.news.total, Icon: Newspaper },
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
      href: '/admin/products?status=draft',
      count: summary.products.draft,
      ok: summary.products.draft === 0,
    },
    {
      title: '项目草稿',
      detail: summary.projects.draft > 0 ? '检查封面、图库和坐标' : '暂无项目草稿',
      href: '/admin/projects?status=draft',
      count: summary.projects.draft,
      ok: summary.projects.draft === 0,
    },
    {
      title: '新闻草稿',
      detail: summary.news.draft > 0 ? '检查标题、封面和正文' : '暂无新闻草稿',
      href: '/admin/news?status=draft',
      count: summary.news.draft,
      ok: summary.news.draft === 0,
    },
    {
      title: '项目地图信息',
      detail: missingProjectCoordinates > 0 ? '有项目缺少坐标' : '项目坐标状态正常',
      href: '/admin/projects?mapStatus=missing-coordinates',
      count: missingProjectCoordinates,
      ok: missingProjectCoordinates === 0,
    },
  ]
}

function Hero({ summary }: { summary: ContentDashboardSummary }) {
  const totals = getTotals(summary)

  return (
    <section id="overview" className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#DDF6F8_0%,#F4FBFC_62%,#FFF3E7_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">内容管理</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">内容经营中心</h1>
            <p className="mt-2 text-sm text-[#61767D]">
              先看内容状态，再发布产品、项目和新闻。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryAction href="/admin/products/new" Icon={Package} label="发布产品" primary />
            <PrimaryAction href="/admin/projects/new" Icon={MapPinned} label="发布项目" />
            <PrimaryAction href="/admin/news/new" Icon={Newspaper} label="发布新闻" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <HeroMetric title="内容总量" value={totals.total} detail={`已发布 ${formatNumber(totals.published)}`} />
          <HeroMetric title="草稿内容" value={totals.draft} detail="等待检查或发布" tone="orange" />
          <HeroMetric title="近 30 天新增" value={totals.recent} detail="产品 / 项目 / 新闻" tone="green" />
          <HeroMetric
            title="内容域"
            value={CONTENT_DOMAINS.length}
            detail="产品、项目、新闻"
            tone="blue"
          />
        </div>
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
    <div className={`flex min-h-36 flex-col justify-between rounded-md bg-gradient-to-br ${toneClass} p-5 text-white`}>
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

function ContentDomainGrid({ summary }: { summary: ContentDashboardSummary }) {
  return (
    <section id="drafts" className="scroll-mt-24 space-y-4">
      <SectionTitle title="内容经营" detail="按内容域查看总量、草稿和近 30 天新增。" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {CONTENT_DOMAINS.map((domain) => (
          <ContentDomainCard key={domain.key} domain={domain} summary={summary[domain.key]} />
        ))}
      </div>
    </section>
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
    { label: '产品管理', href: '/admin/products', Icon: Package },
    { label: '项目案例', href: '/admin/projects', Icon: MapPinned },
    { label: '新闻资讯', href: '/admin/news', Icon: Newspaper },
  ]

  return (
    <section className="space-y-4">
      <SectionTitle title="管理入口" detail="查看已有内容，继续筛选、编辑和发布。" />
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
      <SectionTitle title="内容运营流程" />
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
          <MaintenanceLink href="/admin/pages/visual" label="页面管理" Icon={LayoutTemplate} />
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
        <div className="space-y-8">
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
