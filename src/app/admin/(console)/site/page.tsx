import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
import { countUploads, sumStorageSize } from '@/lib/uploads-db'
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Eye,
  FileText,
  Globe2,
  Image as ImageIcon,
  LayoutTemplate,
  ListChecks,
  MapPinned,
  Navigation,
  Newspaper,
  Package,
  SearchCheck,
  Settings,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '网站管理 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type SiteStat = {
  id?: string
  title: string
  value: string | number
  detail: string
  href?: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
}

type SiteApp = {
  title: string
  detail: string
  href?: string
  Icon: LucideIcon
  adminOnly?: boolean
  muted?: boolean
}

type SitePublishApp = {
  title: string
  detail: string
  href: string
  Icon: LucideIcon
  action: string
}

type SiteDomain = {
  title: string
  domain: string
  href: string
  label: string
}

type SiteTodo = {
  title: string
  detail: string
  href?: string
  ok: boolean
}

const STORAGE_WARNING_BYTES = 800 * 1024 * 1024

const SITE_DOMAINS: SiteDomain[] = [
  {
    title: '主站官网',
    domain: 'www.vessel303.com',
    href: '/',
    label: '运营中',
  },
  {
    title: '品牌页面',
    domain: '/about',
    href: '/about',
    label: '可编辑',
  },
  {
    title: 'Global Map',
    domain: '/global',
    href: '/global',
    label: '前台查看',
  },
]

const SITE_APPS: SiteApp[] = [
  {
    title: '编辑网站',
    detail: '进入页面可视化编辑，按页面和模块管理内容。',
    href: '/admin/pages/visual',
    Icon: LayoutTemplate,
  },
  {
    title: '页面清单',
    detail: '按页面查看可编辑范围、内容来源、草稿状态和前台入口。',
    href: '/admin/site/pages',
    Icon: ListChecks,
  },
  {
    title: '导航管理',
    detail: '对照 300 管理导航，盘点前台主导航、行动按钮和页脚入口。',
    href: '/admin/site/navigation',
    Icon: Navigation,
  },
  {
    title: '管理图片',
    detail: '上传、查找图片，并查看图片被哪些内容引用。',
    href: '/admin/media',
    Icon: ImageIcon,
  },
  {
    title: '查看 Global',
    detail: '查看前台地图展示，本阶段不开放地图底层管理。',
    href: '/global',
    Icon: MapPinned,
  },
  {
    title: '站点配置',
    detail: '域名、发信、图片存储等配置状态由管理员维护。',
    href: '/admin/settings',
    Icon: Settings,
    adminOnly: true,
  },
  {
    title: '页面表单模式',
    detail: '高级维护入口，日常运营优先使用可视化编辑。',
    href: '/admin/pages',
    Icon: Wrench,
    adminOnly: true,
  },
  {
    title: 'SEO 检查',
    detail: '对照 300 TDK 设置，查看页面和内容详情的 SEO 覆盖情况。',
    href: '/admin/site/seo',
    Icon: Globe2,
  },
  {
    title: '网站信息',
    detail: '对照 300 网站信息、三方代码和搜索引擎连接，查看当前接管边界。',
    href: '/admin/site/settings',
    Icon: Settings,
  },
]

const SITE_PUBLISH_APPS: SitePublishApp[] = [
  {
    title: '发布产品',
    detail: '产品内容、分类、SEO、属性和橱窗继续走产品 2.0 主路径。',
    href: '/admin/content/products/new',
    Icon: Package,
    action: '新建产品',
  },
  {
    title: '发布项目案例',
    detail: '正式项目案例内容走项目 2.0 主路径，Global 仅作地图展示渠道。',
    href: '/admin/content/projects/new',
    Icon: MapPinned,
    action: '新建案例',
  },
  {
    title: '发布新闻',
    detail: '新闻分类、封面、定时和 SEO 字段走新闻 2.0 主路径。',
    href: '/admin/content/news/new',
    Icon: Newspaper,
    action: '新建新闻',
  },
  {
    title: '编辑页面草稿',
    detail: 'Home / About 的受控模块先保存为草稿，发布前必须预览校对。',
    href: '/admin/pages/visual',
    Icon: LayoutTemplate,
    action: '进入编辑',
  },
]

function getSiteSideNav({
  pageDraftCount,
  uploadCount,
  uploadBytes,
  configIssues,
  isAdmin,
}: {
  pageDraftCount: number
  uploadCount: number
  uploadBytes: number
  configIssues: number
  isAdmin: boolean
}): AdminSideNavGroup[] {
  const todoCount = pageDraftCount + (uploadBytes > STORAGE_WARNING_BYTES ? 1 : 0) + (isAdmin ? configIssues : 0)

  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航管理', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'settings', label: '网站信息', href: '/admin/site/settings', Icon: Settings },
        { key: 'visual', label: '编辑网站', href: '/admin/pages/visual', Icon: FileText },
        { key: 'drafts', label: '页面草稿', href: '#drafts', badge: pageDraftCount, Icon: CircleDashed },
        { key: 'todo', label: '网站待办', href: '#todo', badge: todoCount, Icon: ListChecks },
      ],
    },
    {
      title: '资源与页面',
      items: [
        { key: 'media', label: '图片素材', href: '/admin/media', badge: uploadCount, Icon: ImageIcon },
        { key: 'home', label: '查看主站', href: '/', Icon: Eye },
        { key: 'global', label: 'Global 查看', href: '/global', Icon: MapPinned },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'page-settings', label: '页面设置', planned: true, Icon: Settings },
      ],
    },
    {
      title: '高级维护',
      items: [
        { key: 'form-mode', label: '表单模式', href: '/admin/pages', adminOnly: true, Icon: Wrench },
        { key: 'settings', label: '站点设置', href: '/admin/settings', adminOnly: true, Icon: Settings },
        { key: 'legacy', label: '维护入口', href: '/admin/legacy', adminOnly: true, Icon: ShieldCheck },
      ],
    },
  ]
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

function formatBytes(n: number): string {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-site] ${label} failed`, err)
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

async function countPageDrafts(): Promise<number> {
  const [moduleDraftsReady, structureDraftsReady] = await Promise.all([
    tableExists('public.page_module_drafts'),
    tableExists('public.page_structure_drafts'),
  ])
  const [moduleDrafts, structureDrafts] = await Promise.all([
    moduleDraftsReady
      ? pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM page_module_drafts`,
        )
      : Promise.resolve({ rows: [{ count: '0' }] }),
    structureDraftsReady
      ? pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM page_structure_drafts
           WHERE draft_status <> 'discarded'`,
        )
      : Promise.resolve({ rows: [{ count: '0' }] }),
  ])

  return (
    parseInt(moduleDrafts.rows[0]?.count ?? '0', 10) +
    parseInt(structureDrafts.rows[0]?.count ?? '0', 10)
  )
}

async function countVisiblePageModules(): Promise<number> {
  if (!(await tableExists('public.page_modules'))) return 0
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM page_modules
     WHERE is_visible IS TRUE`,
  )
  return parseInt(res.rows[0]?.count ?? '0', 10)
}

function getConfigIssueCount(): number {
  const checks = [
    Boolean(process.env.AUTH_SECRET),
    Boolean(process.env.RESEND_API_KEY),
    Boolean(process.env.RESEND_FROM),
    Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    Boolean(process.env.MAPTILER_KEY),
  ]
  return checks.filter((ok) => !ok).length
}

function Hero({
  pageDraftCount,
  uploadCount,
  uploadBytes,
  visibleModules,
}: {
  pageDraftCount: number
  uploadCount: number
  uploadBytes: number
  visibleModules: number
}) {
  return (
    <section id="overview" className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#DDF6F8_0%,#F4FBFC_62%,#FFF3E7_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">网站管理</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">网站运营中心</h1>
            <p className="mt-2 text-sm text-[#61767D]">
              先看站点状态，再进入页面编辑、图片素材和前台查看。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryAction href="/admin/pages/visual" Icon={LayoutTemplate} label="编辑网站" primary />
            <PrimaryAction href="/admin/media" Icon={ImageIcon} label="管理图片" />
            <PrimaryAction href="/" Icon={Eye} label="查看主站" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div className="rounded-md border border-white/70 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#61767D]">当前站点</p>
                <p className="mt-2 text-2xl font-bold text-[#1E2C31]">运营中</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                正常
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {SITE_DOMAINS.map((site) => (
                <DomainCard key={site.title} site={site} />
              ))}
            </div>
          </div>
          <StatCard
            id="drafts"
            title="页面草稿"
            value={pageDraftCount}
            detail={pageDraftCount > 0 ? '等待确认发布' : '暂无待发布草稿'}
            href="/admin/pages/visual"
            tone={pageDraftCount > 0 ? 'orange' : 'green'}
          />
          <StatCard
            title="可见模块"
            value={visibleModules}
            detail="Home / About 已接入"
            href="/admin/pages/visual"
            tone="blue"
          />
          <StatCard
            title="图片素材"
            value={uploadCount}
            detail={uploadBytes ? formatBytes(uploadBytes) : '暂无占用'}
            href="/admin/media"
            tone={uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'green'}
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
  external = false,
}: {
  href: string
  Icon: LucideIcon
  label: string
  primary?: boolean
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
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

function DomainCard({ site }: { site: SiteDomain }) {
  const external = site.href.startsWith('http')
  return (
    <Link
      href={site.href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="group flex min-h-20 flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-4 transition hover:border-[#1889B6]/60"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-semibold text-[#1E2C31]">{site.title}</span>
        <span className="rounded-full bg-[#EAF6F8] px-2 py-1 text-[11px] font-semibold text-[#1889B6]">
          {site.label}
        </span>
      </span>
      <span className="mt-3 flex items-center justify-between gap-3 text-xs text-[#61767D]">
        <span className="truncate">{site.domain}</span>
        <Eye size={14} className="shrink-0 transition group-hover:text-[#E36F2C]" />
      </span>
    </Link>
  )
}

function StatCard({ id, title, value, detail, href, tone }: SiteStat) {
  const toneClass =
    tone === 'orange'
      ? 'from-[#FF9F2F] to-[#F06B22]'
      : tone === 'green'
        ? 'from-[#20B486] to-[#118F79]'
        : tone === 'gray'
          ? 'from-[#74838A] to-[#526168]'
          : 'from-[#1889B6] to-[#3078C8]'

  const content = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white/82">{title}</span>
        {href && <ArrowRight size={17} className="text-white/76 transition group-hover:translate-x-0.5" />}
      </span>
      <span>
        <span className="block text-4xl font-bold">
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
        <span className="mt-2 block text-sm text-white/82">{detail}</span>
      </span>
    </>
  )

  const className = `group flex min-h-40 flex-col justify-between rounded-md bg-gradient-to-br ${toneClass} p-5 text-white shadow-sm transition hover:-translate-y-0.5`

  if (!href) return <div id={id} className={className}>{content}</div>
  return (
    <Link id={id} href={href} className={className}>
      {content}
    </Link>
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

function AppGrid({ role }: { role: AdminRole }) {
  const visibleApps = SITE_APPS.filter((app) => !app.adminOnly || role === 'admin')

  return (
    <section className="space-y-4">
      <SectionTitle title="常用管理" detail="网站相关操作集中在这里，日常编辑更容易找到入口。" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleApps.map((app) => (
          <AppCard key={app.title} app={app} />
        ))}
      </div>
    </section>
  )
}

function PublishGrid() {
  return (
    <section className="space-y-4">
      <SectionTitle
        title="发布与更新"
        detail="对照 300 后台，把产品、项目、新闻和页面草稿的主动动作收到网站管理首页。"
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {SITE_PUBLISH_APPS.map((app) => {
          const Icon = app.Icon
          return (
            <Link
              key={app.title}
              href={app.href}
              className="group flex min-h-36 flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#E36F2C]/55 hover:shadow-sm"
            >
              <span>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#FFF2E7] text-[#E36F2C]">
                  <Icon size={19} />
                </span>
                <span className="mt-3 block text-sm font-bold text-[#1E2C31]">{app.title}</span>
                <span className="mt-1 block text-xs leading-5 text-[#61767D]">{app.detail}</span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#E36F2C]">
                {app.action}
                <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function AppCard({ app }: { app: SiteApp }) {
  const Icon = app.Icon
  const content = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${
          app.muted ? 'bg-[#F0F2F2] text-[#8DA0A5]' : 'bg-[#EAF6F8] text-[#1889B6]'
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#1E2C31]">{app.title}</span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{app.detail}</span>
      </span>
    </>
  )

  const className = `flex min-h-28 items-start gap-4 rounded-md border p-4 transition ${
    app.muted || !app.href
      ? 'border-[#D8E7E8] bg-[#F5F8F8]'
      : 'border-[#D8E7E8] bg-white hover:-translate-y-0.5 hover:border-[#1889B6]/60 hover:shadow-sm'
  }`

  if (!app.href || app.muted) return <div className={className}>{content}</div>
  return (
    <Link href={app.href} className={className}>
      {content}
    </Link>
  )
}

function WorkflowPanel() {
  const steps = ['选择页面', '点击模块', '保存草稿', '管理员发布']

  return (
    <section className="space-y-4">
      <SectionTitle title="页面运营流程" detail="按受控模块编辑，避免自由改结构造成线上风险。" />
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

function TodoPanel({
  pageDraftCount,
  uploadBytes,
  configIssues,
  isAdmin,
}: {
  pageDraftCount: number
  uploadBytes: number
  configIssues: number
  isAdmin: boolean
}) {
  const todos: SiteTodo[] = [
    {
      title: '页面草稿',
      detail: pageDraftCount > 0 ? '有页面内容或结构草稿待确认' : '暂无页面草稿',
      href: '/admin/pages/visual',
      ok: pageDraftCount === 0,
    },
    {
      title: '图片素材',
      detail: uploadBytes > STORAGE_WARNING_BYTES ? '空间使用偏高，建议整理素材' : '当前状态正常',
      href: '/admin/media',
      ok: uploadBytes <= STORAGE_WARNING_BYTES,
    },
    {
      title: 'Global Map',
      detail: '本阶段只查看前台，不开放底层管理',
      href: '/global',
      ok: true,
    },
  ]

  if (isAdmin) {
    todos.push({
      title: '系统配置',
      detail: configIssues > 0 ? '有配置项需要处理' : '关键配置已就绪',
      href: '/admin/settings',
      ok: configIssues === 0,
    })
  }

  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section id="todo" className="scroll-mt-24 rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">网站待办</h2>
          <p className="mt-1 text-xs text-[#61767D]">只显示需要运营关注的状态。</p>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {todos.map((todo) => (
            <TodoRow key={todo.title} todo={todo} />
          ))}
        </div>
      </section>
    </aside>
  )
}

function TodoRow({ todo }: { todo: SiteTodo }) {
  const icon = todo.ok ? (
    <CheckCircle2 size={18} className="text-emerald-600" />
  ) : (
    <CircleDashed size={18} className="text-[#E36F2C]" />
  )
  const content = (
    <span className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#1E2C31]">{todo.title}</span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{todo.detail}</span>
      </span>
    </span>
  )

  if (!todo.href) return <div className="block px-5 py-4">{content}</div>
  return (
    <Link href={todo.href} className="block px-5 py-4 transition hover:bg-[#F7FAFA]">
      {content}
    </Link>
  )
}

function MaintenanceBlock({ configIssues }: { configIssues: number }) {
  return (
    <section id="maintenance" className="rounded-md border border-dashed border-[#D8E7E8] bg-white/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">管理设置</h2>
          <p className="mt-1 text-xs text-[#61767D]">仅管理员使用，网站运营优先使用上方入口。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MaintenanceLink href="/admin/legacy" label="维护入口" Icon={Wrench} />
          <MaintenanceLink href="/admin/pages" label="表单模式" Icon={LayoutTemplate} />
          <MaintenanceLink href="/admin/settings" label={configIssues > 0 ? '配置需处理' : '站点设置'} Icon={Settings} />
          <MaintenanceLink href="/admin/users" label="后台账号" Icon={ShieldCheck} />
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

export default async function AdminSitePage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [pageDraftCount, uploadCount, uploadBytes, visibleModules] = await Promise.all([
    safeLoad('count page drafts', () => countPageDrafts(), 0),
    safeLoad('count uploads', () => countUploads(), 0),
    safeLoad('sum storage size', () => sumStorageSize(), 0),
    safeLoad('count visible page modules', () => countVisiblePageModules(), 0),
  ])
  const configIssues = getConfigIssueCount()
  const adminRole: AdminRole = role
  const isAdmin = adminRole === 'admin'
  const sideNavGroups = getSiteSideNav({
    pageDraftCount,
    uploadCount,
    uploadBytes,
    configIssues,
    isAdmin,
  })

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="编辑页面、管理图片素材，并查看主站和 Global 展示。"
      sideNavGroups={sideNavGroups}
      activeItem="overview"
    >
      <Hero
        pageDraftCount={pageDraftCount}
        uploadCount={uploadCount}
        uploadBytes={uploadBytes}
        visibleModules={visibleModules}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <PublishGrid />
          <AppGrid role={adminRole} />
          <WorkflowPanel />
          {isAdmin && <MaintenanceBlock configIssues={configIssues} />}
        </div>
        <TodoPanel
          pageDraftCount={pageDraftCount}
          uploadBytes={uploadBytes}
          configIssues={configIssues}
          isAdmin={isAdmin}
        />
      </div>
    </AdminSectionShell>
  )
}
