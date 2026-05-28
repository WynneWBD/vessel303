import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
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
  LockKeyhole,
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

export const metadata = { title: '页面清单 - VESSEL' }

type AdminRole = 'admin' | 'operator'
type EditablePageKey = 'home' | 'about'
type SitePageStatus = 'editable' | 'managed' | 'locked' | 'external'

type SitePage = {
  key: string
  title: string
  path: string
  group: string
  source: string
  detail: string
  status: SitePageStatus
  editorHref?: string
  viewHref: string
  Icon: LucideIcon
  pageKey?: EditablePageKey
}

type PageModuleSummary = {
  total: number
  visible: number
  hidden: number
  moduleDrafts: number
  structureDraftStatus: string | null
  structureModules: number
  structureVisible: number
  structureAdded: number
  structureHidden: number
  updatedAt: string | null
  structureUpdatedAt: string | null
}

const EMPTY_PAGE_SUMMARY: PageModuleSummary = {
  total: 0,
  visible: 0,
  hidden: 0,
  moduleDrafts: 0,
  structureDraftStatus: null,
  structureModules: 0,
  structureVisible: 0,
  structureAdded: 0,
  structureHidden: 0,
  updatedAt: null,
  structureUpdatedAt: null,
}

const EDITABLE_PAGE_KEYS: EditablePageKey[] = ['home', 'about']

const SITE_PAGES: SitePage[] = [
  {
    key: 'home',
    title: '首页',
    path: '/',
    group: '页面编辑',
    source: '页面可视化编辑器',
    detail: '首页 Hero、核心数据和安全插入区由受控模块维护，草稿不会直接影响前台。',
    status: 'editable',
    editorHref: '/admin/pages/visual',
    viewHref: '/',
    Icon: LayoutTemplate,
    pageKey: 'home',
  },
  {
    key: 'about',
    title: 'About',
    path: '/about',
    group: '页面编辑',
    source: '页面可视化编辑器',
    detail: '关于页品牌、工厂、历程和荣誉等模块可编辑，但不开放新增结构。',
    status: 'editable',
    editorHref: '/admin/pages/visual',
    viewHref: '/about',
    Icon: FileText,
    pageKey: 'about',
  },
  {
    key: 'products',
    title: '产品中心',
    path: '/products',
    group: '内容 CMS',
    source: '产品管理 2.0',
    detail: '产品列表和详情内容由产品管理维护，不进入页面自由搭建器。',
    status: 'managed',
    editorHref: '/admin/content/products',
    viewHref: '/products',
    Icon: Package,
  },
  {
    key: 'cases',
    title: '项目案例',
    path: '/cases',
    group: '内容 CMS',
    source: '项目案例 2.0',
    detail: '项目案例列表和详情由项目后台维护；Global 只作为地图展示渠道。',
    status: 'managed',
    editorHref: '/admin/content/projects',
    viewHref: '/cases',
    Icon: MapPinned,
  },
  {
    key: 'news',
    title: '新闻资讯',
    path: '/news',
    group: '内容 CMS',
    source: '新闻管理 2.0',
    detail: '新闻列表和详情由新闻后台维护，包含分类、封面、定时和 SEO 字段。',
    status: 'managed',
    editorHref: '/admin/content/news',
    viewHref: '/news',
    Icon: Newspaper,
  },
  {
    key: 'contact',
    title: '联系入口',
    path: '/contact',
    group: '站点设置',
    source: 'site_settings.contactUrl',
    detail: '联系入口由站点设置控制跳转，属于管理员维护范围。',
    status: 'locked',
    editorHref: '/admin/settings',
    viewHref: '/contact',
    Icon: Settings,
  },
  {
    key: 'display',
    title: 'Display',
    path: '/display',
    group: '静态页面',
    source: '代码维护',
    detail: '展示页当前不开放后台编辑，后续如要纳入编辑器需单独规划。',
    status: 'locked',
    viewHref: '/display',
    Icon: Eye,
  },
  {
    key: 'global',
    title: 'Global Map',
    path: '/global',
    group: '只读展示',
    source: '地图专项',
    detail: 'Global 是独立地图展示渠道，B5 不修改 MapLibre、MapTiler 或 /api/map。',
    status: 'locked',
    viewHref: '/global',
    Icon: Globe2,
  },
]

function getSitePagesSideNav({
  draftCount,
  isAdmin,
}: {
  draftCount: number
  isAdmin: boolean
}): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', badge: draftCount, Icon: ListChecks },
        { key: 'navigation', label: '导航管理', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'visual', label: '编辑网站', href: '/admin/pages/visual', Icon: FileText },
      ],
    },
    {
      title: '内容入口',
      items: [
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
        { key: 'media', label: '图片素材', href: '/admin/media', Icon: ImageIcon },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'settings', label: '站点设置', href: '/admin/settings', adminOnly: true, Icon: Settings },
      ],
    },
    {
      title: '高级维护',
      items: [
        { key: 'form-mode', label: '表单模式', href: '/admin/pages', adminOnly: true, Icon: Wrench },
        { key: 'legacy', label: '维护入口', href: '/admin/legacy', adminOnly: true, Icon: ShieldCheck },
      ].filter((item) => isAdmin || !item.adminOnly),
    },
  ]
}

function parseCount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value
  const parsed = parseInt(value ?? '0', 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function getSummaryNumber(summary: unknown, key: string): number {
  if (!summary || typeof summary !== 'object') return 0
  const value = (summary as Record<string, unknown>)[key]
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseCount(value)
  return 0
}

function emptySummaryMap(): Record<EditablePageKey, PageModuleSummary> {
  return {
    home: { ...EMPTY_PAGE_SUMMARY },
    about: { ...EMPTY_PAGE_SUMMARY },
  }
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-site-pages] ${label} failed`, err)
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

async function loadPageModuleSummaries(): Promise<Record<EditablePageKey, PageModuleSummary>> {
  const summaries = emptySummaryMap()
  const pageKeys = EDITABLE_PAGE_KEYS as string[]

  if (await tableExists('public.page_modules')) {
    const liveRes = await pool.query<{
      page_key: EditablePageKey
      total: string
      visible: string
      hidden: string
      updated_at: string | null
    }>(
      `SELECT
         page_key,
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE is_visible IS TRUE)::text AS visible,
         COUNT(*) FILTER (WHERE is_visible IS NOT TRUE)::text AS hidden,
         MAX(updated_at)::text AS updated_at
       FROM page_modules
       WHERE page_key = ANY($1::text[])
       GROUP BY page_key`,
      [pageKeys],
    )

    for (const row of liveRes.rows) {
      if (!EDITABLE_PAGE_KEYS.includes(row.page_key)) continue
      summaries[row.page_key] = {
        ...summaries[row.page_key],
        total: parseCount(row.total),
        visible: parseCount(row.visible),
        hidden: parseCount(row.hidden),
        updatedAt: row.updated_at,
      }
    }
  }

  if (await tableExists('public.page_module_drafts')) {
    const draftRes = await pool.query<{ page_key: EditablePageKey; count: string }>(
      `SELECT page_key, COUNT(*)::text AS count
       FROM page_module_drafts
       WHERE page_key = ANY($1::text[])
       GROUP BY page_key`,
      [pageKeys],
    )

    for (const row of draftRes.rows) {
      if (!EDITABLE_PAGE_KEYS.includes(row.page_key)) continue
      summaries[row.page_key] = {
        ...summaries[row.page_key],
        moduleDrafts: parseCount(row.count),
      }
    }
  }

  if (await tableExists('public.page_structure_drafts')) {
    const structureRes = await pool.query<{
      page_key: EditablePageKey
      draft_status: string
      updated_at: string | null
      summary: unknown
    }>(
      `SELECT page_key, draft_status, updated_at::text AS updated_at, summary
       FROM page_structure_drafts
       WHERE page_key = ANY($1::text[])
         AND draft_status <> 'discarded'
       ORDER BY updated_at DESC`,
      [pageKeys],
    )

    for (const row of structureRes.rows) {
      if (!EDITABLE_PAGE_KEYS.includes(row.page_key)) continue
      summaries[row.page_key] = {
        ...summaries[row.page_key],
        structureDraftStatus: row.draft_status,
        structureModules: getSummaryNumber(row.summary, 'moduleCount'),
        structureVisible: getSummaryNumber(row.summary, 'visibleCount'),
        structureAdded: getSummaryNumber(row.summary, 'addedCount'),
        structureHidden: getSummaryNumber(row.summary, 'hiddenCount'),
        structureUpdatedAt: row.updated_at,
      }
    }
  }

  return summaries
}

function formatDateTime(value: string | null): string {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getStatusLabel(status: SitePageStatus): string {
  if (status === 'editable') return '可编辑'
  if (status === 'managed') return '独立 CMS'
  if (status === 'external') return '外部入口'
  return '受保护'
}

function getStatusClassName(status: SitePageStatus): string {
  if (status === 'editable') return 'bg-[#E36F2C]/10 text-[#E36F2C]'
  if (status === 'managed') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (status === 'external') return 'bg-[#F0F2F2] text-[#61767D]'
  return 'bg-[#F5F2ED] text-[#6B625B]'
}

function draftStatusLabel(status: string | null): string {
  if (!status) return '无结构草稿'
  if (status === 'active') return '结构草稿'
  if (status === 'stale') return '草稿需核对'
  if (status === 'review') return '等待复核'
  return status
}

function MetricPill({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F8F8] px-2.5 py-1 text-xs font-medium text-[#61767D]">
      <span className="font-bold text-[#1E2C31]">{value}</span>
      {label}
    </span>
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

function PageCard({
  page,
  summary,
}: {
  page: SitePage
  summary?: PageModuleSummary
}) {
  const Icon = page.Icon
  const editable = page.status === 'editable'
  const hasDrafts = Boolean(summary && (summary.moduleDrafts > 0 || summary.structureDraftStatus))

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2C31]">{page.title}</h3>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusClassName(page.status)}`}>
                {getStatusLabel(page.status)}
              </span>
              {hasDrafts && (
                <span className="rounded-full bg-[#FFF2E7] px-2 py-1 text-[11px] font-semibold text-[#E36F2C]">
                  有草稿
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{page.path} / {page.group}</p>
            <p className="mt-3 text-sm leading-6 text-[#61767D]">{page.detail}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MetricPill label="来源" value={page.source} />
        {editable && summary ? (
          <>
            <MetricPill label="模块" value={summary.total} />
            <MetricPill label="可见" value={summary.visible} />
            <MetricPill label="草稿" value={summary.moduleDrafts} />
            <MetricPill label={draftStatusLabel(summary.structureDraftStatus)} value={summary.structureDraftStatus ? 1 : 0} />
          </>
        ) : null}
      </div>

      {editable && summary ? (
        <div className="mt-4 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3 text-xs leading-5 text-[#61767D]">
          最近模块更新：{formatDateTime(summary.updatedAt)}；结构草稿更新：{formatDateTime(summary.structureUpdatedAt)}。
          {summary.structureDraftStatus
            ? ` 结构草稿包含 ${summary.structureModules} 个模块，其中新增 ${summary.structureAdded} 个、隐藏 ${summary.structureHidden} 个。`
            : ' 当前没有待发布的结构草稿。'}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {page.editorHref ? (
          <Link
            href={page.editorHref}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
          >
            {editable ? '进入编辑' : '进入管理'}
            <ArrowRight size={14} />
          </Link>
        ) : null}
        <Link
          href={page.viewHref}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
        >
          查看前台
          <Eye size={14} />
        </Link>
      </div>
    </div>
  )
}

function SummaryTile({
  title,
  value,
  detail,
  Icon,
}: {
  title: string
  value: number | string
  detail: string
  Icon: LucideIcon
}) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[#61767D]">{title}</span>
        <Icon size={18} className="text-[#1889B6]" />
      </div>
      <p className="mt-3 text-3xl font-bold text-[#1E2C31]">{value}</p>
      <p className="mt-1 text-xs text-[#61767D]">{detail}</p>
    </div>
  )
}

function AlignmentPanel() {
  const items = [
    '产品、项目、新闻仍走各自 CMS，不混入页面自由编辑。',
    '导航、TDK、三方代码先作为后续规划，不在本阶段开放保存。',
    'Global 只作为前台查看入口，地图底层继续归 04 专项。',
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <SectionTitle title="300 对照边界" detail="本页把 300 的网站管理心智拆成可编辑页面、独立 CMS 和受保护设置三类。" />
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-4">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <p className="mt-3 text-sm leading-6 text-[#1E2C31]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function GuardrailPanel() {
  const guardrails = [
    '不开放自由 HTML / CSS / 字体 / 颜色 / 全页拖拽。',
    '不批量修改 SEO、导航、页脚或全站 TDK。',
    '真实发布首页或关于页前，05 需要做预览和前台核对。',
  ]

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/75 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#6B625B]">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">页面编辑保护线</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            {guardrails.map((item) => (
              <p key={item} className="rounded-md bg-white px-3 py-2 text-xs leading-5 text-[#61767D]">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function AdminSitePagesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const summaries = await safeLoad('load page module summaries', loadPageModuleSummaries, emptySummaryMap())
  const adminRole: AdminRole = role
  const draftCount = Object.values(summaries).reduce(
    (sum, item) => sum + item.moduleDrafts + (item.structureDraftStatus ? 1 : 0),
    0,
  )
  const editableCount = SITE_PAGES.filter((page) => page.status === 'editable').length
  const managedCount = SITE_PAGES.filter((page) => page.status === 'managed').length
  const lockedCount = SITE_PAGES.filter((page) => page.status === 'locked').length
  const visibleModuleCount = Object.values(summaries).reduce((sum, item) => sum + item.visible, 0)
  const sideNavGroups = getSitePagesSideNav({
    draftCount,
    isAdmin: adminRole === 'admin',
  })

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="按页面查看可编辑范围、内容来源、草稿状态和前台入口。"
      sideNavGroups={sideNavGroups}
      activeItem="pages"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#F3FBFC_0%,#FFFFFF_58%,#FFF4E9_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">B5 页面清单</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">网站页面与编辑范围</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
              运营先确认页面归属，再进入对应后台；可视化编辑器只处理 Home / About 的受控模块。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/pages/visual"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              <LayoutTemplate size={16} />
              编辑网站
            </Link>
            <Link
              href="/admin/site"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              <ListChecks size={16} />
              返回概览
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryTile title="可视化页面" value={editableCount} detail="Home / About" Icon={LayoutTemplate} />
          <SummaryTile title="独立 CMS" value={managedCount} detail="产品 / 案例 / 新闻" Icon={FileText} />
          <SummaryTile title="受保护页面" value={lockedCount} detail="设置或专项维护" Icon={LockKeyhole} />
          <SummaryTile title="可见模块" value={visibleModuleCount} detail="当前页面模块" Icon={CircleDashed} />
        </div>
      </section>

      <AlignmentPanel />

      <section className="space-y-4">
        <SectionTitle title="页面清单" detail="每个入口都标明内容来源，运营不需要在旧路径和新路径之间来回猜。" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {SITE_PAGES.map((page) => (
            <PageCard
              key={page.key}
              page={page}
              summary={page.pageKey ? summaries[page.pageKey] : undefined}
            />
          ))}
        </div>
      </section>

      <GuardrailPanel />
    </AdminSectionShell>
  )
}
