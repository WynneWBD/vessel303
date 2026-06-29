import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  AdminActionLink,
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
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  ListChecks,
  MapPinned,
  Navigation,
  SearchCheck,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '网站管理 - VESSEL' }

const VISUAL_HOME_HERO_HREF = '/admin/site/visual?module=home%3Ahero#visual-editor'

type AdminRole = 'admin' | 'operator'

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

type SiteQueueTone = 'blue' | 'green' | 'orange' | 'gray'

type SiteQueueItem = {
  title: string
  owner: string
  status: string
  detail: string
  href: string
  action: string
  Icon: LucideIcon
  tone: SiteQueueTone
}

type SourceSeoControlItem = {
  title: string
  scope: string
  status: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: SiteQueueTone
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
    title: 'Global 展示',
    domain: '/global',
    href: '/global',
    label: '前台查看',
  },
]

function getSiteSideNav({ uploadCount }: { uploadCount: number }): AdminSideNavGroup[] {
  return [
    {
      title: '网站管理',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'visual', label: '编辑网站', href: VISUAL_HOME_HERO_HREF, Icon: FileText },
        { key: 'media', label: '图片素材', href: '/admin/site/media', badge: uploadCount, Icon: ImageIcon },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航页脚', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'conversion', label: '转化路径', href: '/admin/site/conversion', Icon: Link2 },
        { key: 'settings', label: '网站信息', href: '/admin/site/settings', Icon: Settings },
      ],
    },
    {
      title: '前台入口',
      items: [
        { key: 'home', label: '查看主站', href: '/', Icon: Eye },
        { key: 'global', label: 'Global 查看', href: '/global', Icon: MapPinned },
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

function buildSitePriorityQueueItems({
  pageDraftCount,
  uploadBytes,
  configIssues,
  isAdmin,
}: {
  pageDraftCount: number
  uploadBytes: number
  configIssues: number
  isAdmin: boolean
}): SiteQueueItem[] {
  return [
    {
      title: '页面草稿',
      owner: '内容运营',
      status: pageDraftCount > 0 ? `${pageDraftCount.toLocaleString('zh-CN')} 个草稿` : '暂无待发布',
      detail: pageDraftCount > 0
        ? '先预览页面草稿，再确认是否发布。'
        : '当前没有待发布页面草稿。',
      href: VISUAL_HOME_HERO_HREF,
      action: '查看草稿',
      Icon: FileText,
      tone: pageDraftCount > 0 ? 'orange' : 'green',
    },
    {
      title: '图片检查',
      owner: '素材运营',
      status: uploadBytes > STORAGE_WARNING_BYTES ? '空间使用偏高' : formatBytes(uploadBytes),
      detail: '查看大图、图片引用和需要整理的素材。',
      href: '/admin/site/media?view=issues',
      action: '检查图片',
      Icon: ImageIcon,
      tone: uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'blue',
    },
    {
      title: '转化路径',
      owner: '运营分析',
      status: '可查看',
      detail: '查看首页、产品、案例、联系表单和访问路径。',
      href: '/admin/site/conversion',
      action: '查看转化路径',
      Icon: Link2,
      tone: 'blue',
    },
    {
      title: 'SEO 与收录准备',
      owner: 'SEO 运营',
      status: '内容缺口优先',
      detail: '检查产品、新闻和案例的搜索展示信息。',
      href: '/admin/site/seo',
      action: '查看 SEO 检查',
      Icon: SearchCheck,
      tone: 'blue',
    },
    {
      title: '网站信息',
      owner: '网站管理员',
      status: isAdmin
        ? configIssues > 0
          ? `${configIssues.toLocaleString('zh-CN')} 项待处理`
          : '关键配置就绪'
        : '状态查看',
      detail: '查看网站基础信息和统计连接状态。',
      href: isAdmin ? '/admin/settings' : '/admin/site/settings',
      action: isAdmin ? '查看站点设置' : '查看网站信息',
      Icon: Settings,
      tone: configIssues > 0 && isAdmin ? 'orange' : 'gray',
    },
    {
      title: 'Global 展示入口',
      owner: '网站管理',
      status: '前台查看',
      detail: '查看前台 Global 展示效果。',
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
  const metrics = [
    {
      title: '页面草稿',
      value: pageDraftCount.toLocaleString('zh-CN'),
      detail: pageDraftCount > 0 ? '等待确认发布' : '暂无待发布草稿',
      href: VISUAL_HOME_HERO_HREF,
      action: '处理草稿',
      Icon: FileText,
      tone: pageDraftCount > 0 ? 'orange' : 'green',
    },
    {
      title: '前台内容',
      value: visibleModules.toLocaleString('zh-CN'),
      detail: '当前前台正在显示的页面内容',
      href: '/admin/site/pages#content-source-route-tree',
      action: '看页面清单',
      Icon: LayoutTemplate,
      tone: 'blue',
    },
    {
      title: '图片素材',
      value: uploadCount.toLocaleString('zh-CN'),
      detail: uploadBytes ? formatBytes(uploadBytes) : '暂无占用',
      href: '/admin/site/media#media-replacement-workbench',
      action: '管理图片',
      Icon: ImageIcon,
      tone: uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'green',
    },
    {
      title: 'Global 展示',
      value: '可查看',
      detail: '前台地图展示入口',
      href: '/global',
      action: '查看 Global',
      Icon: MapPinned,
      tone: 'gray',
    },
  ] satisfies Array<{
    title: string
    value: string
    detail: string
    href: string
    action: string
    Icon: LucideIcon
    tone: SiteQueueTone
  }>

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="border-l-4 border-[#1889B6] p-4 md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1 className="mt-1 text-2xl font-bold text-[#1E2C31] md:text-3xl">网站管理</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminActionLink href={VISUAL_HOME_HERO_HREF} Icon={LayoutTemplate} label="编辑网站" primary />
            <AdminActionLink href="/admin/site/pages#content-source-route-tree" Icon={ListChecks} label="页面清单" />
            <AdminActionLink href="/admin/site/media#media-replacement-workbench" Icon={ImageIcon} label="图片替换" />
            <AdminActionLink href="/admin/site/seo" Icon={SearchCheck} label="SEO 检查" />
            <AdminActionLink href="/" Icon={Eye} label="查看主站" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-[#FBFDFD]">
            <div className="grid grid-cols-[minmax(150px,1fr)_minmax(160px,1fr)_110px_120px] gap-3 border-b border-[#E6EEEE] px-4 py-2 text-xs font-bold text-[#61767D] max-lg:hidden">
              <span>站点 / 页面</span>
              <span>路径</span>
              <span>状态</span>
              <span className="text-right">入口</span>
            </div>
            <div className="divide-y divide-[#E6EEEE]">
              {SITE_DOMAINS.map((site) => (
                <SiteDomainLedgerRow key={site.title} site={site} />
              ))}
            </div>
          </div>

          <div id="drafts" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {metrics.map((metric) => (
              <SiteHeroMetric key={metric.title} metric={metric} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SiteDomainLedgerRow({ site }: { site: SiteDomain }) {
  const external = site.href.startsWith('http')
  return (
    <Link
      href={site.href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="grid grid-cols-1 gap-2 px-4 py-3 text-sm transition hover:bg-white lg:grid-cols-[minmax(150px,1fr)_minmax(160px,1fr)_110px_120px] lg:items-center"
    >
      <span className="min-w-0">
        <span className="block font-bold text-[#1E2C31]">{site.title}</span>
        <span className="mt-0.5 block text-xs text-[#8A9EA4]">前台可访问入口</span>
      </span>
      <span className="break-all text-xs font-semibold text-[#61767D]">{site.domain}</span>
      <span className="w-fit rounded-full bg-[#EAF6F8] px-2 py-1 text-[11px] font-bold text-[#1889B6]">
        {site.label}
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] lg:justify-self-end">
        打开
        <Eye size={13} />
      </span>
    </Link>
  )
}

function SiteHeroMetric({
  metric,
}: {
  metric: {
    title: string
    value: string
    detail: string
    href: string
    action: string
    Icon: LucideIcon
    tone: SiteQueueTone
  }
}) {
  const Icon = metric.Icon

  return (
    <Link
      href={metric.href}
      className="group grid min-h-[86px] grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-md border border-[#D8E7E8] bg-white p-3 transition hover:border-[#1889B6]/60 hover:shadow-sm"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${queueIconClass(metric.tone)}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="flex items-start justify-between gap-3">
          <span className="text-xs font-bold text-[#61767D]">{metric.title}</span>
          <span className="shrink-0 text-xl font-black leading-none text-[#1E2C31]">{metric.value}</span>
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{metric.detail}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] transition group-hover:text-[#0F6F95]">
          {metric.action}
          <ArrowRight size={13} />
        </span>
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
      detail: '页面内容、草稿和前台编辑',
      metric: `${visibleModules.toLocaleString('zh-CN')} 项内容`,
      signal: `${pageDraftCount.toLocaleString('zh-CN')} 草稿`,
      href: VISUAL_HOME_HERO_HREF,
      Icon: LayoutTemplate,
      tone: pageDraftCount > 0 ? 'orange' : 'green',
      actions: [
        { label: '编辑页面', href: VISUAL_HOME_HERO_HREF },
        { label: '页面清单', href: '/admin/site/pages#content-source-route-tree' },
        { label: '前台首页', href: '/' },
      ],
    },
    {
      title: '图片素材',
      detail: '上传、替换、引用和空间占用',
      metric: `${uploadCount.toLocaleString('zh-CN')} 项`,
      signal: formatBytes(uploadBytes),
      href: '/admin/site/media#media-replacement-workbench',
      Icon: ImageIcon,
      tone: uploadBytes > STORAGE_WARNING_BYTES ? 'orange' : 'blue',
      actions: [
        { label: '图片替换', href: '/admin/site/media#media-replacement-workbench' },
        { label: '图片检查', href: '/admin/site/media?view=issues' },
      ],
    },
    {
      title: '转化路径',
      detail: '入口、按钮、表单和线索来源',
      metric: '查看',
      signal: '可查看',
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
      detail: '标题、描述、网站信息和搜索连接',
      metric: '检查',
      signal: isAdmin ? `${configIssues.toLocaleString('zh-CN')} 项待处理` : '状态查看',
      href: '/admin/site/seo',
      Icon: SearchCheck,
      tone: configIssues > 0 && isAdmin ? 'orange' : 'blue',
      actions: [
        { label: 'SEO 检查', href: '/admin/site/seo' },
        { label: '网站信息', href: '/admin/site/settings' },
        ...(isAdmin ? [{ label: '系统配置', href: '/admin/settings' }] : []),
      ],
    },
  ]

  return (
    <section className="space-y-4">
      <AdminSectionTitle title="网站管理总览" />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="hidden grid-cols-[200px_130px_130px_minmax(0,1fr)_160px] gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 text-xs font-semibold text-[#61767D] lg:grid">
          <span>管理项目</span>
          <span>当前量</span>
          <span>状态</span>
          <span>操作入口</span>
          <span>打开</span>
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
        打开
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function queueIconClass(tone: SiteQueueTone): string {
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'gray') return 'bg-[#F0F2F2] text-[#61767D]'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function SitePriorityQueue({
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
  const items = buildSitePriorityQueueItems({ pageDraftCount, uploadBytes, configIssues, isAdmin })
  const alertCount = items.filter((item) => item.tone === 'orange').length

  return (
    <section id="priority-queue" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <AdminSectionTitle title="待办事项" />
        <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${alertCount > 0 ? 'bg-[#FFF2E7] text-[#C85F24]' : 'bg-emerald-50 text-emerald-700'}`}>
          {alertCount > 0 ? `${alertCount} 项需处理` : '暂无待处理'}
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        {items.map((item) => (
          <SiteQueueRow key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}

function SiteQueueRow({ item }: { item: SiteQueueItem }) {
  const Icon = item.Icon

  return (
    <Link
      href={item.href}
      className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] px-4 py-3 text-sm transition last:border-b-0 hover:bg-[#F7FAFA] lg:grid-cols-[minmax(180px,0.8fr)_130px_minmax(0,1fr)_120px] lg:items-center"
    >
      <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${queueIconClass(item.tone)}`}>
            <Icon size={18} />
          </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-[#1E2C31]">{item.title}</span>
          <span className="mt-0.5 block text-xs text-[#8A9EA4]">{item.owner}</span>
        </span>
      </span>
      <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${queueIconClass(item.tone)}`}>
        {item.status}
      </span>
      <span className="text-xs leading-5 text-[#61767D]">{item.detail}</span>
      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] lg:justify-self-end">
        {item.action}
        <ArrowRight size={14} />
      </span>
    </Link>
  )
}

function SourceSeoControlPanel() {
  const items: SourceSeoControlItem[] = [
    {
      title: '转化路径',
      scope: '访问入口',
      status: '产品 / 案例 / 新闻',
      detail: '查看前台入口、表单和访问来源。',
      href: '/admin/site/conversion#source-contract-portfolio',
      Icon: Link2,
      tone: 'blue',
      actions: [
        { label: '总览', href: '/admin/site/conversion#source-contract-portfolio' },
        { label: '产品线索', href: '/admin/customers/leads?source_type=product#product-source-lead-queue-handoff' },
        { label: '案例线索', href: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk' },
        { label: '新闻线索', href: '/admin/customers/leads?source_type=news#news-source-lead-queue-handoff' },
      ],
    },
    {
      title: 'SEO 检查',
      scope: 'SEO',
      status: '待完善内容',
      detail: '检查标题、描述、图片和页面内容。',
      href: '/admin/site/seo#seo-conversion-closure',
      Icon: SearchCheck,
      tone: 'orange',
      actions: [
        { label: 'SEO 处理', href: '/admin/site/seo#seo-conversion-closure' },
        { label: 'SEO 检查', href: '/admin/site/seo' },
        { label: '访问统计', href: '/admin/status/traffic' },
      ],
    },
    {
      title: '内容发布',
      scope: '内容',
      status: '产品 / 案例 / 新闻',
      detail: '新建或更新产品、案例和新闻内容。',
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <AdminSectionTitle title="流量与 SEO" />
        <Link
          href="/admin/site/conversion#source-contract-portfolio"
          className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-[#1889B6]/25 bg-[#EAF6F8] px-3 text-xs font-bold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-white"
        >
          打开转化路径
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        {items.map((item) => (
          <SourceSeoControlRow key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}

function SourceSeoControlRow({ item }: { item: SourceSeoControlItem }) {
  const Icon = item.Icon

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] px-4 py-3 text-sm last:border-b-0 lg:grid-cols-[minmax(180px,0.8fr)_130px_minmax(0,1fr)_minmax(220px,0.8fr)] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${queueIconClass(item.tone)}`}>
            <Icon size={18} />
          </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-[#1E2C31]">{item.title}</span>
          <span className="mt-0.5 block text-xs text-[#8A9EA4]">{item.status}</span>
        </span>
      </div>
      <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${queueIconClass(item.tone)}`}>
        {item.scope}
      </span>
      <p className="text-xs leading-5 text-[#61767D]">{item.detail}</p>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {item.actions.slice(0, 3).map((action) => (
          <Link
            key={`${item.title}-${action.label}`}
            href={action.href}
            className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:bg-white hover:text-[#1889B6]"
          >
            {action.label}
          </Link>
        ))}
        <Link
          href={item.href}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#1889B6]/25 bg-[#EAF6F8] px-2.5 text-xs font-bold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-white"
        >
          打开
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
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
      detail: pageDraftCount > 0 ? '有页面内容或顺序调整待确认' : '暂无页面草稿',
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
      title: 'Global 展示',
      detail: '前台展示正常',
      href: '/global',
      ok: true,
    },
  ]

  if (isAdmin) {
    todos.push({
      title: '系统配置',
      detail: configIssues > 0 ? '有项目需要处理' : '关键设置已就绪',
      href: '/admin/settings',
      ok: configIssues === 0,
    })
  }

  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section id="todo" className="scroll-mt-24 rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">网站待办</h2>
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
  const sideNavGroups = getSiteSideNav({ uploadCount })

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="页面、图片、SEO、转化入口。"
      sideNavGroups={sideNavGroups}
      activeItem="overview"
    >
      <Hero
        pageDraftCount={pageDraftCount}
        uploadCount={uploadCount}
        uploadBytes={uploadBytes}
        visibleModules={visibleModules}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SiteOperationsConsole
          pageDraftCount={pageDraftCount}
          uploadCount={uploadCount}
          uploadBytes={uploadBytes}
          visibleModules={visibleModules}
          configIssues={configIssues}
          isAdmin={isAdmin}
        />
        <TodoPanel
          pageDraftCount={pageDraftCount}
          uploadBytes={uploadBytes}
          configIssues={configIssues}
          isAdmin={isAdmin}
        />
      </div>
      <details className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[#1E2C31]">
          <span className="inline-flex items-center gap-2">
            <ListChecks size={16} className="text-[#1889B6]" />
            更多检查
          </span>
          <span className="text-xs font-semibold text-[#61767D]">SEO / 转化 / 待办</span>
        </summary>
        <div className="space-y-4 border-t border-[#E6EEEE] bg-[#F7FAFA] p-4">
          <SourceSeoControlPanel />
          <SitePriorityQueue
            pageDraftCount={pageDraftCount}
            uploadBytes={uploadBytes}
            configIssues={configIssues}
            isAdmin={isAdmin}
          />
        </div>
      </details>
    </AdminSectionShell>
  )
}
