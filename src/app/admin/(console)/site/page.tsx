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
  Link2,
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

const VISUAL_HOME_HERO_HREF = '/admin/site/visual?module=home%3Ahero#visual-editor'

type AdminRole = 'admin' | 'operator'

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

type SiteConsoleRow = {
  title: string
  detail: string
  metric: string
  signal: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange'
  actions: Array<{ label: string; href: string }>
}

type B195QueueTone = 'blue' | 'green' | 'orange' | 'gray'

type B195QueueItem = {
  title: string
  owner: string
  status: string
  detail: string
  href: string
  action: string
  Icon: LucideIcon
  tone: B195QueueTone
}

type SourceSeoControlItem = {
  title: string
  scope: string
  status: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: B195QueueTone
  actions: Array<{ label: string; href: string }>
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
    href: VISUAL_HOME_HERO_HREF,
    Icon: LayoutTemplate,
  },
  {
    title: '页面清单',
    detail: '按页面查看可编辑范围、内容来源、草稿状态和前台入口。',
    href: '/admin/site/pages#content-source-route-tree',
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
    href: '/admin/site/media#media-replacement-workbench',
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
    detail: 'Home / About / Global 的受控模块先保存为草稿；发布前必须预览校对。',
    href: VISUAL_HOME_HERO_HREF,
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
  const b195AlertCount =
    (pageDraftCount > 0 ? 1 : 0) +
    (uploadBytes > STORAGE_WARNING_BYTES ? 1 : 0) +
    (isAdmin && configIssues > 0 ? 1 : 0)

  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'conversion', label: '转化路径', href: '/admin/site/conversion', Icon: Link2 },
        { key: 'source-seo', label: '来源与 SEO', href: '#source-seo-control', Icon: SearchCheck },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航管理', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'settings', label: '网站信息', href: '/admin/site/settings', Icon: Settings },
        { key: 'visual', label: '编辑网站', href: VISUAL_HOME_HERO_HREF, Icon: FileText },
        { key: 'drafts', label: '页面草稿', href: '#drafts', badge: pageDraftCount, Icon: CircleDashed },
        { key: 'b195', label: 'B195 队列', href: '#b195-queue', badge: b195AlertCount, Icon: ListChecks },
        { key: 'todo', label: '网站待办', href: '#todo', badge: todoCount, Icon: ListChecks },
      ],
    },
    {
      title: '资源与页面',
      items: [
        { key: 'media', label: '图片素材', href: '/admin/site/media', badge: uploadCount, Icon: ImageIcon },
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

function buildB195QueueItems({
  pageDraftCount,
  uploadBytes,
  configIssues,
  isAdmin,
}: {
  pageDraftCount: number
  uploadBytes: number
  configIssues: number
  isAdmin: boolean
}): B195QueueItem[] {
  return [
    {
      title: '页面发布复核',
      owner: '02_content_cms_workflow / 04_frontend_visual_system',
      status: pageDraftCount > 0 ? `${pageDraftCount.toLocaleString('zh-CN')} 个草稿` : '暂无草稿阻塞',
      detail: pageDraftCount > 0
        ? '先预览页面草稿，再确认是否发布，避免运营内容直接进入前台。'
        : '页面编辑链路可继续保持巡检，下一步重点看公开页转化节奏。',
      href: VISUAL_HOME_HERO_HREF,
      action: '查看草稿',
      Icon: FileText,
      tone: pageDraftCount > 0 ? 'orange' : 'green',
    },
    {
      title: '素材风险视图',
      owner: '06_assets_media_pipeline',
      status: uploadBytes > STORAGE_WARNING_BYTES ? '空间使用偏高' : formatBytes(uploadBytes),
      detail: '优先看大图、缺少派生图和引用关系，再决定是否进入素材治理；本队列不执行删除。',
      href: '/admin/site/media?view=issues',
      action: '查看风险素材',
      Icon: ImageIcon,
      tone: uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'blue',
    },
    {
      title: '转化路径诊断',
      owner: '01_public_site_conversion / 07_growth_analytics_seo',
      status: '只读诊断',
      detail: '把首页、产品、案例、联系表单和访问路径串起来看，判断公开页是否优于 en303 的获客路径。',
      href: '/admin/site/conversion',
      action: '查看转化路径',
      Icon: Link2,
      tone: 'blue',
    },
    {
      title: 'SEO 与收录准备',
      owner: '07_growth_analytics_seo',
      status: '内容缺口优先',
      detail: '先处理已发布产品、新闻、案例的 SEO 字段缺口，再做 Search Console 提交流程。',
      href: '/admin/site/seo',
      action: '查看 SEO 检查',
      Icon: SearchCheck,
      tone: 'blue',
    },
    {
      title: '网站信息边界',
      owner: '08_security_production_guard / 03_admin_operations_center',
      status: isAdmin
        ? configIssues > 0
          ? `${configIssues.toLocaleString('zh-CN')} 个配置项`
          : '关键配置就绪'
        : '运营只读',
      detail: '站点信息、三方代码和搜索连接只做状态盘点；高风险配置仍走管理员设置和代码审查。',
      href: isAdmin ? '/admin/settings' : '/admin/site/settings',
      action: isAdmin ? '查看站点设置' : '查看网站信息',
      Icon: Settings,
      tone: configIssues > 0 && isAdmin ? 'orange' : 'gray',
    },
    {
      title: 'Global 保护边界',
      owner: '08_security_production_guard',
      status: '只读查看',
      detail: 'Global、MapLibre、MapTiler 和 /api/map 仍为保护链路，本批次只保留前台查看入口。',
      href: '/global',
      action: '查看 Global',
      Icon: MapPinned,
      tone: 'gray',
    },
  ]
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
    <AdminPageHero
      kicker="Site Operations"
      title="网站运营中心"
      description="先看站点状态，再进入页面编辑、图片素材、SEO、转化和前台查看；Global 只做展示入口，不开放底层地图管理。"
      actions={
        <>
          <AdminActionLink href={VISUAL_HOME_HERO_HREF} Icon={LayoutTemplate} label="编辑网站" primary />
          <AdminActionLink href="/admin/site/media#media-replacement-workbench" Icon={ImageIcon} label="管理图片" />
          <AdminActionLink href="/" Icon={Eye} label="查看主站" />
        </>
      }
    >
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
          <AdminMetricCard
            id="drafts"
            title="页面草稿"
            value={pageDraftCount}
            detail={pageDraftCount > 0 ? '等待确认发布' : '暂无待发布草稿'}
            href={VISUAL_HOME_HERO_HREF}
            Icon={FileText}
            tone={pageDraftCount > 0 ? 'orange' : 'green'}
          />
          <AdminMetricCard
            title="可见模块"
            value={visibleModules}
            detail="Home / About / Global 已接入"
            href={VISUAL_HOME_HERO_HREF}
            Icon={LayoutTemplate}
            tone="blue"
          />
          <AdminMetricCard
            title="图片素材"
            value={uploadCount}
            detail={uploadBytes ? formatBytes(uploadBytes) : '暂无占用'}
            href="/admin/site/media#media-replacement-workbench"
            Icon={ImageIcon}
            tone={uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'green'}
          />
      </div>
    </AdminPageHero>
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

function SiteOperationsConsole({
  pageDraftCount,
  uploadCount,
  uploadBytes,
  visibleModules,
  configIssues,
  isAdmin,
}: {
  pageDraftCount: number
  uploadCount: number
  uploadBytes: number
  visibleModules: number
  configIssues: number
  isAdmin: boolean
}) {
  const rows: SiteConsoleRow[] = [
    {
      title: '页面发布',
      detail: '受控模块、页面草稿、页面清单和可视化编辑',
      metric: `${visibleModules.toLocaleString('zh-CN')} 模块`,
      signal: `${pageDraftCount.toLocaleString('zh-CN')} 草稿`,
      href: VISUAL_HOME_HERO_HREF,
      Icon: LayoutTemplate,
      tone: pageDraftCount > 0 ? 'orange' : 'green',
      actions: [
        { label: '可视化', href: VISUAL_HOME_HERO_HREF },
        { label: '页面清单', href: '/admin/site/pages#content-source-route-tree' },
        { label: '前台首页', href: '/' },
      ],
    },
    {
      title: '素材资产',
      detail: '图片上传、引用关系、空间体量和派生图风险',
      metric: `${uploadCount.toLocaleString('zh-CN')} 记录`,
      signal: formatBytes(uploadBytes),
      href: '/admin/site/media#media-replacement-workbench',
      Icon: ImageIcon,
      tone: uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'blue',
      actions: [
        { label: '替换工作台', href: '/admin/site/media#media-replacement-workbench' },
        { label: '风险视图', href: '/admin/site/media?view=issues' },
      ],
    },
    {
      title: '转化路径',
      detail: '入口、CTA、表单、线索来源和运营数据诊断',
      metric: '只读',
      signal: '诊断入口',
      href: '/admin/site/conversion',
      Icon: Link2,
      tone: 'blue',
      actions: [
        { label: '转化路径', href: '/admin/site/conversion' },
        { label: '访问统计', href: '/admin/status/traffic' },
      ],
    },
    {
      title: 'SEO 与网站信息',
      detail: 'TDK、网站信息、三方代码、搜索引擎连接和环境边界',
      metric: '检查',
      signal: isAdmin ? `${configIssues.toLocaleString('zh-CN')} 配置项` : '运营只读',
      href: '/admin/site/seo',
      Icon: SearchCheck,
      tone: configIssues > 0 && isAdmin ? 'orange' : 'blue',
      actions: [
        { label: 'SEO 检查', href: '/admin/site/seo' },
        { label: '网站信息', href: '/admin/site/settings' },
        ...(isAdmin ? [{ label: '站点设置', href: '/admin/settings' }] : []),
      ],
    },
  ]

  return (
    <section className="space-y-4">
      <AdminSectionTitle
        title="网站运营控制台"
        detail="把页面、素材、转化、SEO 和设置入口收成一张表，先判断状态，再进入对应后台。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="hidden grid-cols-[200px_130px_130px_minmax(0,1fr)_160px] gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] lg:grid">
          <span>网站链路</span>
          <span>当前量</span>
          <span>信号</span>
          <span>处理入口</span>
          <span>主工作台</span>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {rows.map((row) => (
            <SiteConsoleRowView key={row.title} row={row} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SiteConsoleRowView({ row }: { row: SiteConsoleRow }) {
  const Icon = row.Icon
  const toneClass =
    row.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : row.tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 text-sm lg:grid-cols-[200px_130px_130px_minmax(0,1fr)_160px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-[#1E2C31]">{row.title}</span>
          <span className="mt-1 block truncate text-xs text-[#61767D]">{row.detail}</span>
        </span>
      </div>
      <span className="font-bold text-[#1E2C31]">{row.metric}</span>
      <span className="text-sm font-semibold text-[#61767D]">{row.signal}</span>
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
        进入工作台
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function queueToneClass(tone: B195QueueTone): string {
  if (tone === 'orange') return 'border-l-[#E36F2C] bg-[#FFF7F0]'
  if (tone === 'green') return 'border-l-emerald-500 bg-emerald-50/70'
  if (tone === 'gray') return 'border-l-[#8A9EA4] bg-[#F7FAFA]'
  return 'border-l-[#1889B6] bg-white'
}

function queueIconClass(tone: B195QueueTone): string {
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'gray') return 'bg-[#F0F2F2] text-[#61767D]'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function B195PriorityQueue({
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
  const items = buildB195QueueItems({ pageDraftCount, uploadBytes, configIssues, isAdmin })
  const alertCount = items.filter((item) => item.tone === 'orange').length

  return (
    <section id="b195-queue" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <AdminSectionTitle
          title="B195 优先级队列"
          detail="把本轮未完成差距收成一个运营队列：先处理阻塞信号，再进入素材、转化、SEO 和网站信息复核。"
        />
        <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${alertCount > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
          {alertCount > 0 ? `${alertCount} 项需优先处理` : '暂无阻塞项'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {items.map((item) => (
          <B195QueueCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}

function B195QueueCard({ item }: { item: B195QueueItem }) {
  const Icon = item.Icon

  return (
    <Link
      href={item.href}
      className={`group flex min-h-56 flex-col justify-between rounded-md border border-l-4 border-[#D8E7E8] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60 hover:shadow-md ${queueToneClass(item.tone)}`}
    >
      <span>
        <span className="flex items-start justify-between gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${queueIconClass(item.tone)}`}>
            <Icon size={18} />
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${queueIconClass(item.tone)}`}>
            {item.status}
          </span>
        </span>
        <span className="mt-4 block text-base font-bold text-[#1E2C31]">{item.title}</span>
        <span className="mt-1 block text-xs font-semibold text-[#8A9EA4]">{item.owner}</span>
        <span className="mt-3 block text-sm leading-6 text-[#61767D]">{item.detail}</span>
      </span>
      <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] transition group-hover:text-[#0F6F95]">
        {item.action}
        <ArrowRight size={14} />
      </span>
    </Link>
  )
}

function SourceSeoControlPanel() {
  const items: SourceSeoControlItem[] = [
    {
      title: '来源合同总览',
      scope: 'B277',
      status: '产品 / 案例 / 新闻',
      detail: '把公开站三条主要获客来源集中成一张总账，先核对入口、source_type、阶段线索和路径复盘是否接上。',
      href: '/admin/site/conversion#source-contract-portfolio',
      Icon: Link2,
      tone: 'blue',
      actions: [
        { label: '总览', href: '/admin/site/conversion#source-contract-portfolio' },
        { label: '产品队列', href: '/admin/customers/leads?source_type=product#product-source-lead-queue-handoff' },
        { label: '案例队列', href: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk' },
        { label: '新闻队列', href: '/admin/customers/leads?source_type=news#news-source-lead-queue-handoff' },
      ],
    },
    {
      title: 'SEO 修复闭环',
      scope: 'B278',
      status: '内容缺口优先',
      detail: '从 SEO 待补回到来源合同总览，避免只补标题描述却没有检查对应线索和访问路径质量。',
      href: '/admin/site/seo#seo-conversion-closure',
      Icon: SearchCheck,
      tone: 'orange',
      actions: [
        { label: '修复闭环', href: '/admin/site/seo#seo-conversion-closure' },
        { label: 'SEO 检查', href: '/admin/site/seo' },
        { label: '访问统计', href: '/admin/status/traffic' },
      ],
    },
    {
      title: '内容承接工作台',
      scope: 'CMS',
      status: '运营入口',
      detail: '产品、案例、新闻先在内容工作台补齐公开页承接，再回到线索队列验证是否形成可处理的商机来源。',
      href: '/admin/content',
      Icon: ListChecks,
      tone: 'green',
      actions: [
        { label: '产品', href: '/admin/content/products/list#product-source-contract' },
        { label: '案例', href: '/admin/content/projects/list#case-source-contract' },
        { label: '新闻', href: '/admin/content/news#news-operations-hub' },
      ],
    },
  ]

  return (
    <section id="source-seo-control" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <AdminSectionTitle
          title="B279 来源与 SEO 总控"
          detail="把 B277 来源合同和 B278 SEO 修复提升到网站管理首页，运营先看来源承接，再看搜索缺口和线索队列。"
        />
        <Link
          href="/admin/site/conversion#source-contract-portfolio"
          className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-[#1889B6]/25 bg-[#EAF6F8] px-3 text-xs font-bold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-white"
        >
          看来源总账
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {items.map((item) => (
          <SourceSeoControlCard key={item.title} item={item} />
        ))}
      </div>

      <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-4 py-3 text-xs leading-5 text-[#61767D]">
        <span className="font-bold text-[#1E2C31]">处理顺序：</span>
        内容页承接是否完整 → SEO 是否可被搜索理解 → `source_type` 线索是否进入队列 → 访问路径是否能复盘。
      </div>
    </section>
  )
}

function SourceSeoControlCard({ item }: { item: SourceSeoControlItem }) {
  const Icon = item.Icon

  return (
    <div className={`flex min-h-56 flex-col justify-between rounded-md border border-l-4 border-[#D8E7E8] p-4 shadow-sm ${queueToneClass(item.tone)}`}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${queueIconClass(item.tone)}`}>
            <Icon size={18} />
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${queueIconClass(item.tone)}`}>
            {item.scope}
          </span>
        </div>
        <h3 className="mt-4 text-base font-bold text-[#1E2C31]">{item.title}</h3>
        <p className="mt-1 text-xs font-semibold text-[#8A9EA4]">{item.status}</p>
        <p className="mt-3 text-sm leading-6 text-[#61767D]">{item.detail}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={item.href}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#1889B6]/25 bg-white px-2.5 text-xs font-bold text-[#1889B6] transition hover:border-[#1889B6]"
        >
          主入口
          <ArrowRight size={13} />
        </Link>
        {item.actions.map((action) => (
          <Link
            key={`${item.title}-${action.label}`}
            href={action.href}
            className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function AppGrid({ role }: { role: AdminRole }) {
  const visibleApps = SITE_APPS.filter((app) => !app.adminOnly || role === 'admin')

  return (
    <section className="space-y-4">
      <AdminSectionTitle title="常用管理" detail="网站相关操作集中在这里，日常编辑更容易找到入口。" />
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
      <AdminSectionTitle
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
      <AdminSectionTitle title="页面运营流程" detail="按受控模块编辑，避免自由改结构造成线上风险。" />
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
      href: VISUAL_HOME_HERO_HREF,
      ok: pageDraftCount === 0,
    },
    {
      title: '图片素材',
      detail: uploadBytes > STORAGE_WARNING_BYTES ? '空间使用偏高，建议整理素材' : '当前状态正常',
      href: '/admin/site/media#media-replacement-workbench',
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
      description="编辑页面、管理图片素材，并查看首页、About、FAQ、页脚和 Global 展示边界。"
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
        <div className="space-y-6">
          <SiteOperationsConsole
            pageDraftCount={pageDraftCount}
            uploadCount={uploadCount}
            uploadBytes={uploadBytes}
            visibleModules={visibleModules}
            configIssues={configIssues}
            isAdmin={isAdmin}
          />
          <SourceSeoControlPanel />
          <B195PriorityQueue
            pageDraftCount={pageDraftCount}
            uploadBytes={uploadBytes}
            configIssues={configIssues}
            isAdmin={isAdmin}
          />
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
