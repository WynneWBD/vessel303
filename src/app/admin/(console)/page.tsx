import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { logoutAction } from '@/app/admin/actions'
import { countLeadsByStatus } from '@/lib/leads-db'
import { countNewsByStatus } from '@/lib/news-db'
import { countUploads, sumStorageSize } from '@/lib/uploads-db'
import { getUserSummary, type UserSummary } from '@/lib/users-db'
import { countCatalogProductsByStatus } from '@/lib/product-catalog-db'
import { countProjectCasesByStatus } from '@/lib/project-cases-db'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  LogOut,
  MapPinned,
  Newspaper,
  Package,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Admin 2.0 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type StatusSummary = {
  draft: number
  published: number
  total: number
}

type QuickAction = {
  label: string
  description: string
  href: string
  Icon: LucideIcon
  primary?: boolean
}

type ConsoleEntry = {
  title: string
  description: string
  href?: string
  Icon: LucideIcon
  metric?: string
  status?: string
  external?: boolean
  disabled?: boolean
}

type ConsoleSection = {
  title: string
  description: string
  entries: ConsoleEntry[]
}

type SystemCheck = {
  label: string
  ok: boolean
}

const EMPTY_STATUS_SUMMARY: StatusSummary = {
  draft: 0,
  published: 0,
  total: 0,
}

const WARNING_BYTES = 800 * 1024 * 1024

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
    console.error(`[admin-2-console] ${label} failed`, err)
    return fallback
  }
}

function getSystemChecks(): SystemCheck[] {
  return [
    { label: 'Auth Secret', ok: Boolean(process.env.AUTH_SECRET) },
    { label: 'Google OAuth', ok: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) },
    { label: 'Resend API', ok: Boolean(process.env.RESEND_API_KEY) },
    { label: 'Resend From', ok: Boolean(process.env.RESEND_FROM) },
    { label: 'Vercel Blob', ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
    { label: 'MapTiler Key', ok: Boolean(process.env.MAPTILER_KEY) },
  ]
}

function buildUserStatusDetail(summary: UserSummary | null): string {
  if (!summary) return '用户状态读取失败'
  return `管理员 ${summary.admins} / 运营人员 ${summary.operators} / 禁用 ${summary.disabled}`
}

function buildQuickActions(): QuickAction[] {
  return [
    {
      label: '编辑网站',
      description: '进入可视化页面运营中心',
      href: '/admin/pages/visual',
      Icon: LayoutTemplate,
      primary: true,
    },
    {
      label: '发布产品',
      description: '维护产品内容与发布状态',
      href: '/admin/products',
      Icon: Package,
    },
    {
      label: '发布项目',
      description: '维护案例内容和地图入图信息',
      href: '/admin/projects',
      Icon: MapPinned,
    },
    {
      label: '发布新闻',
      description: '维护新闻草稿和发布内容',
      href: '/admin/news',
      Icon: Newspaper,
    },
    {
      label: '查看新线索',
      description: '处理待跟进询盘',
      href: '/admin/leads?status=new',
      Icon: Inbox,
    },
    {
      label: '打开媒体库',
      description: '查看图片、引用和上传入口',
      href: '/admin/media',
      Icon: ImageIcon,
    },
  ]
}

function buildSections({
  role,
  newLeadCount,
  newsSummary,
  productSummary,
  projectSummary,
  uploadCount,
  uploadBytes,
  userSummary,
  configIssues,
}: {
  role: AdminRole
  newLeadCount: number
  newsSummary: StatusSummary
  productSummary: StatusSummary
  projectSummary: StatusSummary
  uploadCount: number
  uploadBytes: number
  userSummary: UserSummary | null
  configIssues: number
}): ConsoleSection[] {
  const isAdmin = role === 'admin'
  const sections: ConsoleSection[] = [
    {
      title: '网站管理',
      description: '编辑官网页面、管理图片资产，并保留 Global Map 的只读入口。',
      entries: [
        {
          title: '编辑网站',
          description: '页面可视化运营中心，日常页面修改优先从这里进入。',
          href: '/admin/pages/visual',
          Icon: LayoutTemplate,
          metric: 'Visual',
          status: '主入口',
        },
        {
          title: '媒体库',
          description: '查看图片、上传状态和引用来源。',
          href: '/admin/media',
          Icon: ImageIcon,
          metric: uploadCount.toLocaleString(),
          status: uploadBytes > WARNING_BYTES ? `已用 ${formatBytes(uploadBytes)}` : '正常',
        },
        {
          title: 'Global Map',
          description: '阶段 A 仅查看前台地图；管理能力后续单独规划。',
          href: '/global',
          Icon: Globe2,
          metric: '只读',
          status: '规划中',
          external: true,
        },
      ],
    },
    {
      title: '内容管理',
      description: '产品、项目案例、新闻仍沿用旧维护页，后续会按 300 式运营逻辑重做。',
      entries: [
        {
          title: '产品',
          description: '维护产品草稿、发布状态、图片和详情内容。',
          href: '/admin/products',
          Icon: Package,
          metric: productSummary.draft.toLocaleString(),
          status: `草稿 / 已发布 ${productSummary.published}`,
        },
        {
          title: '项目案例',
          description: '维护案例内容、完整度和地图入图资料。',
          href: '/admin/projects',
          Icon: MapPinned,
          metric: projectSummary.draft.toLocaleString(),
          status: `草稿 / 已发布 ${projectSummary.published}`,
        },
        {
          title: '新闻',
          description: '维护新闻草稿、封面、正文和发布状态。',
          href: '/admin/news',
          Icon: Newspaper,
          metric: newsSummary.draft.toLocaleString(),
          status: `草稿 / 已发布 ${newsSummary.published}`,
        },
      ],
    },
    {
      title: '客户与线索',
      description: '集中处理询盘和跟进状态，避免新线索被遗漏。',
      entries: [
        {
          title: '新线索',
          description: '只看待跟进线索。',
          href: '/admin/leads?status=new',
          Icon: Inbox,
          metric: newLeadCount.toLocaleString(),
          status: newLeadCount > 0 ? '待处理' : '暂无新增',
        },
        {
          title: '全部线索',
          description: '查看、筛选和导出线索。',
          href: '/admin/leads',
          Icon: Users,
          metric: 'CRM',
          status: '旧维护页',
        },
      ],
    },
    {
      title: '数据分析',
      description: '阶段 A 先保留运营视角入口，不接入新数据看板。',
      entries: [
        {
          title: '访问与转化',
          description: '后续用于查看访问、线索转化和内容表现。',
          Icon: BarChart3,
          metric: '规划中',
          status: '只读规划',
          disabled: true,
        },
      ],
    },
  ]

  if (isAdmin) {
    sections.push(
      {
        title: '会员管理',
        description: '阶段 A 仅保留入口规划；基础会员管理放到后续 1B。',
        entries: [
          {
            title: '会员管理',
            description: '后续区分后台账号与普通会员，先不做会员价、订单或支付。',
            Icon: Users,
            metric: '1B',
            status: '规划中',
            disabled: true,
          },
        ],
      },
      {
        title: '系统与权限',
        description: '管理员专用，用于账号、权限和站点配置状态检查。',
        entries: [
          {
            title: '后台账号',
            description: buildUserStatusDetail(userSummary),
            href: '/admin/users',
            Icon: ShieldCheck,
            metric: userSummary ? userSummary.total.toLocaleString() : '-',
            status: userSummary && userSummary.untagged > 0 ? '有待标记用户' : '正常',
          },
          {
            title: '站点设置',
            description: '查看站点设置、配置状态和最近操作。',
            href: '/admin/settings',
            Icon: Settings,
            metric: configIssues > 0 ? configIssues.toLocaleString() : '0',
            status: configIssues > 0 ? '需处理' : '已配置',
          },
        ],
      },
      {
        title: 'Legacy 维护',
        description: '旧后台只用于数据维护、排障和开发回溯，日常运营优先使用新版控制台。',
        entries: [
          {
            title: '进入旧后台维护索引',
            description: '索引旧产品、项目、新闻、线索、媒体、页面表单、用户和设置入口。',
            href: '/admin/legacy',
            Icon: Wrench,
            metric: 'Admin',
            status: '维护入口',
          },
        ],
      },
    )
  }

  return sections
}

function QuickActionLink({ action }: { action: QuickAction }) {
  const Icon = action.Icon
  return (
    <Link
      href={action.href}
      className={`group flex min-h-24 items-center gap-4 rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
        action.primary
          ? 'border-[#E36F2C] bg-[#E36F2C] text-white'
          : 'border-[#E5DED4] bg-white text-[#2C2A28] hover:border-[#E36F2C]/50'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${
          action.primary ? 'bg-white/16 text-white' : 'bg-[#F5F2ED] text-[#E36F2C]'
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{action.label}</span>
        <span
          className={`mt-1 block text-xs leading-5 ${
            action.primary ? 'text-white/78' : 'text-[#8A8580]'
          }`}
        >
          {action.description}
        </span>
      </span>
      <ArrowRight
        size={16}
        className={action.primary ? 'text-white/80' : 'text-[#C4B9AB] group-hover:text-[#E36F2C]'}
      />
    </Link>
  )
}

function ConsoleEntryCard({ entry }: { entry: ConsoleEntry }) {
  const Icon = entry.Icon
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#E36F2C]">
          <Icon size={18} />
        </span>
        <span className="inline-flex min-h-6 items-center rounded-full border border-[#E5DED4] bg-[#FAF7F2] px-2 text-xs text-[#8A8580]">
          {entry.status ?? '入口'}
        </span>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#2C2A28]">{entry.title}</h3>
          {entry.external && <ExternalLink size={13} className="text-[#C4B9AB]" />}
        </div>
        <p className="mt-2 min-h-10 text-xs leading-5 text-[#8A8580]">{entry.description}</p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <span
          className="text-2xl font-bold text-[#2C2A28]"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {entry.metric ?? '进入'}
        </span>
        {entry.href && !entry.disabled ? (
          <span className="text-xs font-semibold text-[#E36F2C]">进入</span>
        ) : (
          <span className="text-xs font-semibold text-[#C4B9AB]">规划中</span>
        )}
      </div>
    </>
  )

  const className = `block min-h-48 rounded-lg border p-5 transition ${
    entry.disabled
      ? 'border-[#E5DED4] bg-[#FAF7F2] opacity-80'
      : 'border-[#E5DED4] bg-white hover:-translate-y-0.5 hover:border-[#E36F2C]/50 hover:shadow-sm'
  }`

  if (entry.href && !entry.disabled) {
    return (
      <Link
        href={entry.href}
        target={entry.external ? '_blank' : undefined}
        rel={entry.external ? 'noreferrer' : undefined}
        className={className}
      >
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

function SectionBlock({ section }: { section: ConsoleSection }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[#2C2A28]">{section.title}</h2>
        <p className="text-sm leading-6 text-[#8A8580]">{section.description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {section.entries.map((entry) => (
          <ConsoleEntryCard key={entry.title} entry={entry} />
        ))}
      </div>
    </section>
  )
}

function SystemStatusStrip({
  role,
  checks,
  uploadBytes,
}: {
  role: AdminRole
  checks: SystemCheck[]
  uploadBytes: number
}) {
  const issueCount = checks.filter((item) => !item.ok).length
  const items = [
    { label: '当前角色', value: role === 'admin' ? '管理员' : '运营人员', ok: true },
    { label: '媒体库', value: formatBytes(uploadBytes), ok: uploadBytes <= WARNING_BYTES },
    {
      label: '系统配置',
      value: role === 'admin' ? (issueCount > 0 ? `${issueCount} 项需处理` : '已配置') : '管理员可见',
      ok: role !== 'admin' || issueCount === 0,
    },
    { label: '页面管理', value: 'Visual 主入口', ok: true },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-[#E5DED4] bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#8A8580]">{item.label}</span>
            {item.ok ? (
              <CheckCircle2 size={15} className="text-emerald-700" />
            ) : (
              <CircleDashed size={15} className="text-[#E36F2C]" />
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-[#2C2A28]">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

export default async function AdminConsolePage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const sessionRole = session.user.role
  if (sessionRole !== 'admin' && sessionRole !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const role: AdminRole = sessionRole
  const isAdmin = role === 'admin'

  const [
    newLeadCount,
    newsSummary,
    productSummary,
    projectSummary,
    uploadCount,
    uploadBytes,
    userSummary,
  ] = await Promise.all([
    safeLoad('count new leads', () => countLeadsByStatus('new'), 0),
    safeLoad('count news', () => countNewsByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count products', () => countCatalogProductsByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count projects', () => countProjectCasesByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count uploads', () => countUploads(), 0),
    safeLoad('sum upload storage', () => sumStorageSize(), 0),
    isAdmin
      ? safeLoad<UserSummary | null>('user summary', () => getUserSummary(), null)
      : Promise.resolve(null),
  ])

  const checks = isAdmin ? getSystemChecks() : []
  const configIssues = checks.filter((item) => !item.ok).length
  const sections = buildSections({
    role,
    newLeadCount,
    newsSummary,
    productSummary,
    projectSummary,
    uploadCount,
    uploadBytes,
    userSummary,
    configIssues,
  })

  return (
    <main className="min-h-screen bg-[#F5F2ED] text-[#2C2A28]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 md:px-8 lg:px-10">
        <header className="flex flex-col gap-5 rounded-lg border border-[#E5DED4] bg-white px-5 py-5 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#E36F2C]">VESSEL Admin 2.0</p>
            <h1
              className="mt-2 text-3xl font-bold text-[#2C2A28]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              运营管理控制台
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8A8580]">
              新后台按运营路径组织入口；旧后台仅保留数据维护、排障和开发回溯价值。
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#2C2A28]">
                {role === 'admin' ? '管理员' : '运营人员'}
              </div>
              <div className="mt-1 truncate text-xs text-[#8A8580]">{session.user.email}</div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5DED4] bg-white px-3 text-xs font-semibold text-[#6B625B] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
              >
                <LogOut size={14} />
                退出
              </button>
            </form>
          </div>
        </header>

        <SystemStatusStrip role={role} checks={checks} uploadBytes={uploadBytes} />

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2C2A28]">快捷动作</h2>
            <p className="mt-1 text-sm text-[#8A8580]">把高频运营动作放到第一屏，减少进入旧后台目录的次数。</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {buildQuickActions().map((action) => (
              <QuickActionLink key={action.label} action={action} />
            ))}
          </div>
        </section>

        {sections.map((section) => (
          <SectionBlock key={section.title} section={section} />
        ))}
      </div>
    </main>
  )
}
