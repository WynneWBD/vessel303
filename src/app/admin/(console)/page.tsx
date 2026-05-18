import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { logoutAction } from '@/app/admin/actions'
import { pool } from '@/lib/db'
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
  Clock3,
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

export const metadata = { title: '运营管理控制台 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type StatusSummary = {
  draft: number
  published: number
  total: number
}

type RecentContentSummary = {
  products: number
  projects: number
  news: number
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

type StatusCard = {
  label: string
  value: string
  detail: string
  ok: boolean
}

type TodoItem = {
  title: string
  detail: string
  href?: string
  count?: number
  ok: boolean
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

const EMPTY_RECENT_SUMMARY: RecentContentSummary = {
  products: 0,
  projects: 0,
  news: 0,
}

const STORAGE_WARNING_BYTES = 800 * 1024 * 1024

const RECENT_CONTENT_SQL = {
  products: `
    SELECT COUNT(*)::text AS count
    FROM product_catalog
    WHERE deleted_at IS NULL
      AND created_at >= NOW() - INTERVAL '30 days'
  `,
  projects: `
    SELECT COUNT(*)::text AS count
    FROM project_cases
    WHERE deleted_at IS NULL
      AND created_at >= NOW() - INTERVAL '30 days'
  `,
  news: `
    SELECT COUNT(*)::text AS count
    FROM news
    WHERE deleted_at IS NULL
      AND created_at >= NOW() - INTERVAL '30 days'
  `,
} as const

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
    console.error(`[admin-console] ${label} failed`, err)
    return fallback
  }
}

async function countRecentContent(kind: keyof RecentContentSummary): Promise<number> {
  const res = await pool.query<{ count: string }>(RECENT_CONTENT_SQL[kind])
  return parseInt(res.rows[0]?.count ?? '0', 10)
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

async function getRecentContentSummary(): Promise<RecentContentSummary> {
  const [products, projects, news] = await Promise.all([
    countRecentContent('products'),
    countRecentContent('projects'),
    countRecentContent('news'),
  ])
  return { products, projects, news }
}

function getSystemChecks(): SystemCheck[] {
  return [
    { label: '登录安全', ok: Boolean(process.env.AUTH_SECRET) },
    { label: '第三方登录', ok: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) },
    { label: '邮件发信', ok: Boolean(process.env.RESEND_API_KEY) },
    { label: '发件身份', ok: Boolean(process.env.RESEND_FROM) },
    { label: '图片存储', ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
    { label: '地图服务', ok: Boolean(process.env.MAPTILER_KEY) },
  ]
}

function buildQuickActions(): QuickAction[] {
  return [
    {
      label: '编辑网站',
      description: '修改页面文案、图片和模块内容',
      href: '/admin/pages/visual',
      Icon: LayoutTemplate,
      primary: true,
    },
    {
      label: '发布产品',
      description: '维护产品内容、图片和发布状态',
      href: '/admin/products',
      Icon: Package,
    },
    {
      label: '发布项目',
      description: '维护案例内容和地图展示资料',
      href: '/admin/projects',
      Icon: MapPinned,
    },
    {
      label: '发布新闻',
      description: '维护新闻标题、封面和正文',
      href: '/admin/news',
      Icon: Newspaper,
    },
    {
      label: '处理线索',
      description: '查看待跟进的新询盘',
      href: '/admin/leads?status=new',
      Icon: Inbox,
    },
    {
      label: '管理图片',
      description: '查看图片、上传记录和引用来源',
      href: '/admin/media',
      Icon: ImageIcon,
    },
  ]
}

function buildStatusCards({
  newLeadCount,
  pageDraftCount,
  uploadCount,
  uploadBytes,
  draftTotal,
}: {
  newLeadCount: number
  pageDraftCount: number
  uploadCount: number
  uploadBytes: number
  draftTotal: number
}): StatusCard[] {
  return [
    {
      label: '当前站点',
      value: '运营中',
      detail: 'www.vessel303.com',
      ok: true,
    },
    {
      label: '待处理线索',
      value: formatNumber(newLeadCount),
      detail: newLeadCount > 0 ? '建议优先跟进' : '暂无新线索',
      ok: newLeadCount === 0,
    },
    {
      label: '待发布内容',
      value: formatNumber(draftTotal),
      detail: draftTotal > 0 ? '有草稿需要检查' : '暂无草稿积压',
      ok: draftTotal === 0,
    },
    {
      label: '页面草稿',
      value: formatNumber(pageDraftCount),
      detail: pageDraftCount > 0 ? '进入编辑网站检查发布' : '暂无页面草稿',
      ok: pageDraftCount === 0,
    },
    {
      label: '媒体空间',
      value: formatBytes(uploadBytes),
      detail: `${formatNumber(uploadCount)} 张图片记录`,
      ok: uploadBytes <= STORAGE_WARNING_BYTES,
    },
  ]
}

function buildTodoItems({
  newLeadCount,
  newsSummary,
  productSummary,
  projectSummary,
  pageDraftCount,
  uploadBytes,
  configIssues,
  isAdmin,
}: {
  newLeadCount: number
  newsSummary: StatusSummary
  productSummary: StatusSummary
  projectSummary: StatusSummary
  pageDraftCount: number
  uploadBytes: number
  configIssues: number
  isAdmin: boolean
}): TodoItem[] {
  const todos: TodoItem[] = [
    {
      title: '新线索待处理',
      detail: newLeadCount > 0 ? '进入线索列表分配和跟进' : '当前没有新的待处理线索',
      href: '/admin/leads?status=new',
      count: newLeadCount,
      ok: newLeadCount === 0,
    },
    {
      title: '页面草稿待检查',
      detail: pageDraftCount > 0 ? '进入网站编辑器查看并确认是否发布' : '暂无页面草稿待处理',
      href: '/admin/pages/visual',
      count: pageDraftCount,
      ok: pageDraftCount === 0,
    },
    {
      title: '产品草稿',
      detail: productSummary.draft > 0 ? '检查封面、图库、英文内容和发布状态' : '暂无产品草稿',
      href: '/admin/products?status=draft',
      count: productSummary.draft,
      ok: productSummary.draft === 0,
    },
    {
      title: '项目草稿',
      detail: projectSummary.draft > 0 ? '检查封面、图库、坐标和项目资料' : '暂无项目草稿',
      href: '/admin/projects?status=draft',
      count: projectSummary.draft,
      ok: projectSummary.draft === 0,
    },
    {
      title: '新闻草稿',
      detail: newsSummary.draft > 0 ? '检查标题、封面、正文和发布状态' : '暂无新闻草稿',
      href: '/admin/news?status=draft',
      count: newsSummary.draft,
      ok: newsSummary.draft === 0,
    },
    {
      title: '媒体使用状态',
      detail:
        uploadBytes > STORAGE_WARNING_BYTES
          ? '图片空间使用偏高，建议清理无引用图片'
          : '当前图片空间状态正常',
      href: '/admin/media',
      ok: uploadBytes <= STORAGE_WARNING_BYTES,
    },
  ]

  if (isAdmin) {
    todos.push({
      title: '系统配置状态',
      detail: configIssues > 0 ? '有配置项需要管理员处理' : '关键配置已就绪',
      href: '/admin/settings',
      count: configIssues,
      ok: configIssues === 0,
    })
  }

  return todos
}

function buildUserStatusDetail(summary: UserSummary | null): string {
  if (!summary) return '账号状态读取失败'
  return `管理员 ${summary.admins} / 运营人员 ${summary.operators} / 禁用 ${summary.disabled}`
}

function buildSections({
  role,
  newLeadCount,
  newsSummary,
  productSummary,
  projectSummary,
  recentSummary,
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
  recentSummary: RecentContentSummary
  uploadCount: number
  uploadBytes: number
  userSummary: UserSummary | null
  configIssues: number
}): ConsoleSection[] {
  const isAdmin = role === 'admin'
  const sections: ConsoleSection[] = [
    {
      title: '网站管理',
      description: '处理官网页面、图片素材和全球地图展示入口。',
      entries: [
        {
          title: '编辑网站',
          description: '进入页面编辑器，修改首页和主要页面的文案、图片与模块内容。',
          href: '/admin/pages/visual',
          Icon: LayoutTemplate,
          metric: '进入',
          status: '日常入口',
        },
        {
          title: '管理图片',
          description: '查看图片数量、空间使用、上传记录和引用来源。',
          href: '/admin/media',
          Icon: ImageIcon,
          metric: formatNumber(uploadCount),
          status: uploadBytes > STORAGE_WARNING_BYTES ? '建议关注' : '正常',
        },
        {
          title: '全球地图',
          description: '查看前台全球项目地图；管理能力后续单独规划。',
          href: '/global',
          Icon: Globe2,
          metric: '查看',
          status: '前台页面',
          external: true,
        },
      ],
    },
    {
      title: '内容管理',
      description: '集中处理产品、项目案例和新闻的发布与内容完善。',
      entries: [
        {
          title: '产品',
          description: '维护产品资料、图片、详情内容和发布状态。',
          href: '/admin/products',
          Icon: Package,
          metric: formatNumber(productSummary.draft),
          status: `草稿 / 已发布 ${formatNumber(productSummary.published)}`,
        },
        {
          title: '项目案例',
          description: '维护案例资料、图库、坐标和地图展示状态。',
          href: '/admin/projects',
          Icon: MapPinned,
          metric: formatNumber(projectSummary.draft),
          status: `草稿 / 已发布 ${formatNumber(projectSummary.published)}`,
        },
        {
          title: '新闻',
          description: '维护新闻标题、封面、正文和发布状态。',
          href: '/admin/news',
          Icon: Newspaper,
          metric: formatNumber(newsSummary.draft),
          status: `草稿 / 已发布 ${formatNumber(newsSummary.published)}`,
        },
      ],
    },
    {
      title: '客户与会员',
      description: '跟进询盘和会员相关工作；会员管理先由管理员规划。',
      entries: [
        {
          title: '新线索',
          description: '优先处理尚未跟进的新询盘。',
          href: '/admin/leads?status=new',
          Icon: Inbox,
          metric: formatNumber(newLeadCount),
          status: newLeadCount > 0 ? '待处理' : '暂无新增',
        },
        {
          title: '全部线索',
          description: '查看、筛选和导出所有线索。',
          href: '/admin/leads',
          Icon: Users,
          metric: '进入',
          status: '线索中心',
        },
      ],
    },
    {
      title: '数据与状态',
      description: '先聚合内容和素材状态，后续再接入更完整的数据分析。',
      entries: [
        {
          title: '近 30 天新增',
          description: `产品 ${formatNumber(recentSummary.products)} / 项目 ${formatNumber(
            recentSummary.projects,
          )} / 新闻 ${formatNumber(recentSummary.news)}`,
          Icon: Clock3,
          metric: formatNumber(recentSummary.products + recentSummary.projects + recentSummary.news),
          status: '内容变化',
          disabled: true,
        },
        {
          title: '内容待补',
          description: '产品、项目、新闻列表已提供完整度提示，可进入对应列表逐项处理。',
          Icon: CheckCircle2,
          metric: formatNumber(productSummary.draft + projectSummary.draft + newsSummary.draft),
          status: '按列表处理',
          disabled: true,
        },
        {
          title: '访问与转化',
          description: '后续用于查看访问、线索转化和内容表现。',
          Icon: BarChart3,
          metric: '规划中',
          status: '暂未接入',
          disabled: true,
        },
      ],
    },
  ]

  if (isAdmin) {
    sections[2].entries.push({
      title: '会员管理',
      description: '后续区分后台账号和普通会员；本阶段不做会员价、订单或支付。',
      Icon: Users,
      metric: '规划中',
      status: '管理员规划',
      disabled: true,
    })

    sections.push({
      title: '维护中心',
      description: '管理员使用，日常运营优先从上方入口完成。',
      entries: [
        {
          title: '高级维护',
          description: '集中查看少量不适合放在日常运营首页的维护入口。',
          href: '/admin/legacy',
          Icon: Wrench,
          metric: '进入',
          status: '管理员',
        },
        {
          title: '表单模式',
          description: '用于管理员处理页面模块的备用表单编辑。',
          href: '/admin/pages',
          Icon: LayoutTemplate,
          metric: '进入',
          status: '高级',
        },
        {
          title: '后台账号',
          description: buildUserStatusDetail(userSummary),
          href: '/admin/users',
          Icon: ShieldCheck,
          metric: userSummary ? formatNumber(userSummary.total) : '-',
          status: userSummary && userSummary.untagged > 0 ? '有待标记' : '正常',
        },
        {
          title: '站点设置',
          description: '查看站点配置状态和基础设置。',
          href: '/admin/settings',
          Icon: Settings,
          metric: configIssues > 0 ? formatNumber(configIssues) : '0',
          status: configIssues > 0 ? '需处理' : '已配置',
        },
      ],
    })
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

function StatusOverview({ cards }: { cards: StatusCard[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[#2C2A28]">网站状态</h2>
        <p className="mt-1 text-sm text-[#8A8580]">先确认站点、线索、草稿和图片空间是否需要处理。</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((item) => (
          <div key={item.label} className="rounded-lg border border-[#E5DED4] bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#8A8580]">{item.label}</span>
              {item.ok ? (
                <CheckCircle2 size={15} className="text-emerald-700" />
              ) : (
                <CircleDashed size={15} className="text-[#E36F2C]" />
              )}
            </div>
            <p
              className="mt-3 text-2xl font-bold text-[#2C2A28]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {item.value}
            </p>
            <p className="mt-1 text-xs text-[#8A8580]">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function TodoList({ items }: { items: TodoItem[] }) {
  return (
    <section className="rounded-lg border border-[#E5DED4] bg-white p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#2C2A28]">待处理事项</h2>
          <p className="mt-1 text-sm text-[#8A8580]">优先处理有数量和橙色提示的事项。</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const body = (
            <div
              className={`flex min-h-24 gap-3 rounded-lg border p-4 ${
                item.ok ? 'border-[#E5DED4] bg-[#FAF7F2]' : 'border-[#E36F2C]/35 bg-[#FFF7EF]'
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  item.ok ? 'bg-white text-emerald-700' : 'bg-white text-[#E36F2C]'
                }`}
              >
                {item.ok ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[#2C2A28]">{item.title}</span>
                  {typeof item.count === 'number' && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#E36F2C]">
                      {formatNumber(item.count)}
                    </span>
                  )}
                </span>
                <span className="mt-2 block text-xs leading-5 text-[#8A8580]">{item.detail}</span>
              </span>
            </div>
          )

          if (!item.href) return <div key={item.title}>{body}</div>
          return (
            <Link key={item.title} href={item.href} className="block transition hover:-translate-y-0.5">
              {body}
            </Link>
          )
        })}
      </div>
    </section>
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
          {entry.status ?? '进入'}
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
    pageDraftCount,
    uploadCount,
    uploadBytes,
    recentSummary,
    userSummary,
  ] = await Promise.all([
    safeLoad('count new leads', () => countLeadsByStatus('new'), 0),
    safeLoad('count news', () => countNewsByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count products', () => countCatalogProductsByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count projects', () => countProjectCasesByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count page drafts', () => countPageDrafts(), 0),
    safeLoad('count uploads', () => countUploads(), 0),
    safeLoad('sum upload storage', () => sumStorageSize(), 0),
    safeLoad('count recent content', () => getRecentContentSummary(), EMPTY_RECENT_SUMMARY),
    isAdmin
      ? safeLoad<UserSummary | null>('user summary', () => getUserSummary(), null)
      : Promise.resolve(null),
  ])

  const checks = isAdmin ? getSystemChecks() : []
  const configIssues = checks.filter((item) => !item.ok).length
  const draftTotal = productSummary.draft + projectSummary.draft + newsSummary.draft
  const statusCards = buildStatusCards({
    newLeadCount,
    pageDraftCount,
    uploadCount,
    uploadBytes,
    draftTotal,
  })
  const todoItems = buildTodoItems({
    newLeadCount,
    newsSummary,
    productSummary,
    projectSummary,
    pageDraftCount,
    uploadBytes,
    configIssues,
    isAdmin,
  })
  const sections = buildSections({
    role,
    newLeadCount,
    newsSummary,
    productSummary,
    projectSummary,
    recentSummary,
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
            <p className="text-sm font-semibold text-[#E36F2C]">VESSEL 运营后台</p>
            <h1
              className="mt-2 text-3xl font-bold text-[#2C2A28]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              运营管理控制台
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8A8580]">
              先看网站状态和待处理事项，再进入发布、图片、线索和页面编辑。
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

        <StatusOverview cards={statusCards} />
        <TodoList items={todoItems} />

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2C2A28]">快捷发布</h2>
            <p className="mt-1 text-sm text-[#8A8580]">常用运营动作放在第一屏，减少查找路径。</p>
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
