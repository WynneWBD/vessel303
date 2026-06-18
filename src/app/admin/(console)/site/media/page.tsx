import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminPageHero } from '@/components/admin/AdminUI'
import MediaClient from '@/components/admin/MediaClient'
import {
  defaultSiteSettings,
  getSiteSettings,
  normalizeMediaMaxUploadMb,
} from '@/lib/admin-settings-db'
import {
  emptyMediaReferenceSummary,
  listUploads,
  sumStorageSize,
  summarizeMediaReferences,
  type MediaReferenceSummary,
} from '@/lib/uploads-db'
import {
  AlertCircle,
  ArrowRight,
  Filter,
  HardDrive,
  Image as ImageIcon,
  ImageOff,
  Layers,
  LayoutTemplate,
  Link2,
  ListChecks,
  Navigation,
  SearchCheck,
  Settings,
  type LucideIcon,
  Wrench,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '图片素材 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type MediaFilterState = {
  mime: string
  view: string
  search: string
  page: number
  limit: number
}

type ActiveFilterChip = {
  label: string
  value: string
  href: string
}

type MediaConsoleTone = 'blue' | 'green' | 'orange' | 'gray'

type MediaConsoleAction = {
  label: string
  href: string
  primary?: boolean
}

type MediaConsoleRow = {
  title: string
  detail: string
  metric: string
  signal: string
  href: string
  Icon: LucideIcon
  tone: MediaConsoleTone
  actions: MediaConsoleAction[]
}

type MediaReplacementLane = {
  stage: string
  title: string
  metric: string
  detail: string
  action: string
  href: string
  Icon: LucideIcon
  tone: MediaConsoleTone
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function formatBytes(value: number): string {
  if (!value) return '0 B'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function mediaMimeLabel(value: string): string {
  const labels: Record<string, string> = {
    all: '全部类型',
    jpeg: 'JPEG',
    png: 'PNG',
    webp: 'WebP',
    gif: 'GIF',
    svg: 'SVG',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'image/svg+xml': 'SVG',
  }
  return labels[value] ?? value
}

function mediaViewLabel(value: string): string {
  if (value === 'issues') return '风险素材'
  if (!value) return '全部视图'
  return value
}

function createMediaHref(filters: MediaFilterState, patch: Partial<MediaFilterState> = {}): string {
  const next = {
    ...filters,
    ...patch,
  }
  const params = new URLSearchParams()
  const mime = next.mime || 'all'
  const view = next.view || ''
  const search = next.search?.trim() ?? ''
  const page = Math.max(1, Number(next.page) || 1)
  const limit = Math.min(100, Math.max(20, Number(next.limit) || 50))

  if (mime !== 'all') params.set('mime', mime)
  if (view) params.set('view', view)
  if (search) params.set('search', search)
  if (page > 1) params.set('page', String(page))
  if (limit !== 50) params.set('limit', String(limit))

  const query = params.toString()
  return query ? `/admin/site/media?${query}` : '/admin/site/media'
}

function buildActiveFilterChips(filters: MediaFilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  if (filters.mime && filters.mime !== 'all') {
    chips.push({
      label: '类型',
      value: mediaMimeLabel(filters.mime),
      href: createMediaHref(filters, { mime: 'all', page: 1 }),
    })
  }

  if (filters.view) {
    chips.push({
      label: '视图',
      value: mediaViewLabel(filters.view),
      href: createMediaHref(filters, { view: '', page: 1 }),
    })
  }

  if (filters.search.trim()) {
    chips.push({
      label: '搜索',
      value: filters.search.trim(),
      href: createMediaHref(filters, { search: '', page: 1 }),
    })
  }

  if (filters.limit !== 50) {
    chips.push({
      label: '每页',
      value: `${filters.limit}`,
      href: createMediaHref(filters, { limit: 50, page: 1 }),
    })
  }

  return chips
}

function mediaConsoleToneClass(tone: MediaConsoleTone): string {
  if (tone === 'green') return 'border-l-emerald-500 bg-emerald-50'
  if (tone === 'orange') return 'border-l-[#E36F2C] bg-[#FFF7F0]'
  if (tone === 'gray') return 'border-l-[#8A9EA4] bg-[#F7FAFA]'
  return 'border-l-[#1889B6] bg-[#F4FBFC]'
}

function mediaConsoleSignalClass(tone: MediaConsoleTone): string {
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'gray') return 'bg-[#EEF3F4] text-[#61767D]'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function MediaOperationsConsole({
  filters,
  total,
  allTotal,
  issueTotal,
  bytes,
  pageRows,
  referenceSummary,
  maxUploadMb,
}: {
  filters: MediaFilterState
  total: number
  allTotal: number
  issueTotal: number
  bytes: number
  pageRows: number
  referenceSummary: MediaReferenceSummary
  maxUploadMb: number
}) {
  const activeFilterChips = buildActiveFilterChips(filters)
  const referenceRate = referenceSummary.sampled > 0
    ? Math.round((referenceSummary.referenced / referenceSummary.sampled) * 100)
    : 0
  const clearHref = createMediaHref({
    mime: 'all',
    view: '',
    search: '',
    page: 1,
    limit: 50,
  })
  const currentFilterLabel = [
    mediaMimeLabel(filters.mime),
    mediaViewLabel(filters.view),
    filters.search.trim() ? `搜索: ${filters.search.trim()}` : '',
  ].filter(Boolean).join(' / ')

  const rows: MediaConsoleRow[] = [
    {
      title: '素材资产库',
      detail: `承接产品、案例、新闻和页面模块图片；单文件上限 ${maxUploadMb} MB。`,
      metric: `${formatNumber(allTotal)} 张`,
      signal: `${formatBytes(bytes)} 存储`,
      href: '/admin/site/media',
      Icon: ImageIcon,
      tone: 'blue',
      actions: [
        { label: '全部素材', href: '/admin/site/media', primary: true },
        { label: 'WebP', href: createMediaHref(filters, { mime: 'webp', view: '', page: 1 }) },
        { label: '视觉编辑', href: '/admin/site/visual' },
      ],
    },
    {
      title: '风险队列',
      detail: '只读聚合大原图、缺少前台派生图等素材风险，进入后逐项确认。',
      metric: `${formatNumber(issueTotal)} 项`,
      signal: issueTotal > 0 ? '优先处理' : '当前正常',
      href: createMediaHref(filters, { view: 'issues', page: 1 }),
      Icon: AlertCircle,
      tone: issueTotal > 0 ? 'orange' : 'green',
      actions: [
        { label: '只看风险', href: createMediaHref(filters, { view: 'issues', page: 1 }), primary: issueTotal > 0 },
        { label: '清空筛选', href: clearHref },
      ],
    },
    {
      title: '当前筛选结果',
      detail: currentFilterLabel,
      metric: `${formatNumber(total)} 命中`,
      signal: `本页 ${formatNumber(pageRows)} 张`,
      href: createMediaHref(filters),
      Icon: Filter,
      tone: activeFilterChips.length > 0 ? 'blue' : 'gray',
      actions: [
        { label: '每页 50', href: createMediaHref(filters, { limit: 50, page: 1 }) },
        { label: '每页 100', href: createMediaHref(filters, { limit: 100, page: 1 }) },
        { label: '清空筛选', href: clearHref },
      ],
    },
    {
      title: '引用抽样',
      detail: `内容引用 ${formatNumber(referenceSummary.contentRefs)} / 页面 ${formatNumber(referenceSummary.pageRefs)} / 草稿 ${formatNumber(referenceSummary.draftRefs)}`,
      metric: `${formatNumber(referenceSummary.unused)} / ${formatNumber(referenceSummary.sampled)}`,
      signal: referenceSummary.sampled > 0 ? `${referenceRate}% 已引用` : '等待采样',
      href: '#media-replacement-workbench',
      Icon: Layers,
      tone: referenceSummary.unused > 0 ? 'orange' : 'green',
      actions: [
        { label: '替换工作台', href: '#media-replacement-workbench', primary: referenceSummary.unused > 0 || referenceSummary.draftRefs > 0 },
        { label: '风险素材', href: createMediaHref(filters, { view: 'issues', page: 1 }) },
        { label: '页面视觉', href: '/admin/site/visual' },
      ],
    },
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#D8E7E8] p-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <HardDrive size={15} />
            Asset Operations
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">素材运营控制台</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#61767D]">
            先看素材总量、风险队列、当前筛选和引用抽样，再进入上传、筛选和详情处理。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeFilterChips.length > 0 ? (
            activeFilterChips.map((chip) => (
              <a
                key={`${chip.label}-${chip.value}`}
                href={chip.href}
                className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 text-xs font-semibold text-[#1E2C31] hover:border-[#1889B6] hover:text-[#1889B6]"
              >
                <span className="text-[#61767D]">{chip.label}</span>
                <span>{chip.value}</span>
                <span aria-hidden="true" className="text-[#9AA9AD]">×</span>
              </a>
            ))
          ) : (
            <span className="inline-flex min-h-8 items-center rounded-md bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
              当前显示全部素材
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#D8E7E8] md:grid-cols-4">
        <MediaControlStat label="素材总量" value={`${formatNumber(allTotal)} 张`} />
        <MediaControlStat label="风险素材" value={`${formatNumber(issueTotal)} 项`} tone={issueTotal > 0 ? 'orange' : 'green'} />
        <MediaControlStat label="筛选命中" value={`${formatNumber(total)} 张`} />
        <MediaControlStat label="空间使用" value={formatBytes(bytes)} />
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-4">
        {rows.map((row) => (
          <MediaConsoleRowView key={row.title} row={row} />
        ))}
      </div>
    </section>
  )
}

function MediaControlStat({
  label,
  value,
  tone = 'blue',
}: {
  label: string
  value: string
  tone?: MediaConsoleTone
}) {
  return (
    <div className="border-b border-[#D8E7E8] px-5 py-4 md:border-b-0 md:border-r last:md:border-r-0">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone === 'orange' ? 'text-[#C85F24]' : tone === 'green' ? 'text-emerald-700' : 'text-[#1E2C31]'}`}>
        {value}
      </div>
    </div>
  )
}

function MediaConsoleRowView({ row }: { row: MediaConsoleRow }) {
  const Icon = row.Icon

  return (
    <article className={`flex h-full flex-col rounded-md border border-[#D8E7E8] border-l-4 p-4 ${mediaConsoleToneClass(row.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${mediaConsoleSignalClass(row.tone)}`}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-[#1E2C31]">{row.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#61767D]">{row.detail}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${mediaConsoleSignalClass(row.tone)}`}>
          {row.signal}
        </span>
      </div>

      <div className="mt-5">
        <div className="text-3xl font-bold text-[#1E2C31]">{row.metric}</div>
        <a
          href={row.href}
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] hover:text-[#0F6F95]"
        >
          进入处理
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {row.actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold ${
              action.primary
                ? 'border-[#1889B6] bg-[#1889B6] text-white hover:bg-[#0F6F95]'
                : 'border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#1889B6] hover:text-[#1889B6]'
            }`}
          >
            {action.label}
          </a>
        ))}
      </div>
    </article>
  )
}

function buildMediaReplacementLanes({
  filters,
  issueTotal,
  referenceSummary,
  maxUploadMb,
}: {
  filters: MediaFilterState
  issueTotal: number
  referenceSummary: MediaReferenceSummary
  maxUploadMb: number
}): MediaReplacementLane[] {
  return [
    {
      stage: '1. 风险原图',
      title: '先处理大图和缺变体',
      metric: `${formatNumber(issueTotal)} 项`,
      detail: `单文件上限 ${maxUploadMb} MB；前台建议优先使用 thumb / card / detail 派生图，避免直接引用大原图。`,
      action: issueTotal > 0 ? '进入风险素材筛选，逐张确认是否需要重新生成派生图或替换引用。' : '当前没有命中的风险素材。',
      href: createMediaHref(filters, { view: 'issues', page: 1 }),
      Icon: AlertCircle,
      tone: issueTotal > 0 ? 'orange' : 'green',
    },
    {
      stage: '2. 未引用素材',
      title: '识别可归档或待绑定素材',
      metric: `${formatNumber(referenceSummary.unused)} / ${formatNumber(referenceSummary.sampled)}`,
      detail: '按当前页抽样统计素材引用情况；未引用不等于可删除，只代表需要判断来源、用途和是否等待上架。',
      action: referenceSummary.unused > 0 ? '从当前素材列表打开详情，确认来源和用途，再决定是否绑定到页面或保留。' : '当前抽样素材均有引用。',
      href: createMediaHref(filters, { page: 1 }),
      Icon: ImageOff,
      tone: referenceSummary.unused > 0 ? 'orange' : 'green',
    },
    {
      stage: '3. 草稿引用',
      title: '先看草稿再发布',
      metric: `${formatNumber(referenceSummary.draftRefs)} 处`,
      detail: '草稿引用包含页面模块草稿、快照和结构草稿；发布前需要确认图片尺寸、替换路径和前台显示。',
      action: referenceSummary.draftRefs > 0 ? '进入页面视觉编辑器，按模块预览确认草稿图片。' : '当前抽样未发现草稿引用。',
      href: '/admin/site/visual',
      Icon: LayoutTemplate,
      tone: referenceSummary.draftRefs > 0 ? 'blue' : 'gray',
    },
    {
      stage: '4. 线上引用',
      title: '按内容 owner 回源替换',
      metric: `${formatNumber(referenceSummary.contentRefs + referenceSummary.pageRefs)} 处`,
      detail: `内容引用 ${formatNumber(referenceSummary.contentRefs)}，页面模块引用 ${formatNumber(referenceSummary.pageRefs)}；不要在素材库里猜前台位置。`,
      action: referenceSummary.contentRefs + referenceSummary.pageRefs > 0
        ? '从内容来源中心判断 owner，再进入产品、案例、新闻或页面模块替换。'
        : '当前抽样未发现线上引用。',
      href: '/admin/site/pages#content-source-route-tree',
      Icon: Link2,
      tone: referenceSummary.contentRefs + referenceSummary.pageRefs > 0 ? 'blue' : 'gray',
    },
  ]
}

function MediaReplacementWorkbench({
  filters,
  issueTotal,
  referenceSummary,
  maxUploadMb,
}: {
  filters: MediaFilterState
  issueTotal: number
  referenceSummary: MediaReferenceSummary
  maxUploadMb: number
}) {
  const lanes = buildMediaReplacementLanes({ filters, issueTotal, referenceSummary, maxUploadMb })
  const activeLanes = lanes.filter((lane) => lane.tone === 'orange' || lane.tone === 'blue').length

  return (
    <section id="media-replacement-workbench" className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-5 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <Wrench size={15} />
            Replacement Routing
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">素材引用与替换工作台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            对齐 300.cn 素材库的处理心智：先找风险原图，再判断未引用素材，发布前复核草稿引用，线上引用回到内容 owner 替换。
          </p>
        </div>
        <span className={`inline-flex w-fit rounded-md px-3 py-2 text-xs font-bold ${activeLanes > 0 ? 'bg-[#EAF6F8] text-[#1889B6]' : 'bg-emerald-50 text-emerald-700'}`}>
          {activeLanes > 0 ? `${formatNumber(activeLanes)} 条处理路线` : '暂无处理路线'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
        {lanes.map((lane) => {
          const Icon = lane.Icon
          return (
            <a
              key={lane.stage}
              href={lane.href}
              className={`flex h-full flex-col rounded-md border border-[#D8E7E8] border-l-4 bg-white p-4 shadow-sm transition hover:border-[#1889B6]/60 ${mediaConsoleToneClass(lane.tone)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${mediaConsoleSignalClass(lane.tone)}`}>
                  <Icon size={17} />
                </span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${mediaConsoleSignalClass(lane.tone)}`}>
                  {lane.metric}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#1889B6]">{lane.stage}</p>
              <h3 className="mt-1 text-base font-bold text-[#1E2C31]">{lane.title}</h3>
              <p className="mt-3 flex-1 text-xs leading-5 text-[#61767D]">{lane.detail}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-[#1E2C31]">{lane.action}</p>
              <span className="mt-4 inline-flex h-8 w-fit items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6]">
                进入处理 <ArrowRight size={13} />
              </span>
            </a>
          )
        })}
      </div>
    </section>
  )
}

function getSiteToolNav(uploadCount: number): AdminSideNavGroup[] {
  return [
    {
      title: '网站运营',
      items: [
        { key: 'overview', label: '网站概览', href: '/admin/site', Icon: LayoutTemplate },
        { key: 'conversion', label: '转化路径', href: '/admin/site/conversion', Icon: Link2 },
        { key: 'pages', label: '页面清单', href: '/admin/site/pages', Icon: ListChecks },
        { key: 'navigation', label: '导航管理', href: '/admin/site/navigation', Icon: Navigation },
        { key: 'seo', label: 'SEO 检查', href: '/admin/site/seo', Icon: SearchCheck },
        { key: 'settings', label: '网站信息', href: '/admin/site/settings', Icon: Settings },
      ],
    },
    {
      title: '资源与页面',
      items: [
        { key: 'visual', label: '编辑网站', href: '/admin/site/visual', Icon: Wrench },
        { key: 'media', label: '图片素材', href: '/admin/site/media', badge: uploadCount, Icon: ImageIcon },
      ],
    },
    {
      title: '高级维护',
      items: [
        { key: 'form-mode', label: '表单模式', href: '/admin/pages', adminOnly: true, Icon: Wrench },
      ],
    },
  ]
}

export default async function SiteMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const sp = await searchParams
  const getStr = (key: string) => {
    const value = sp[key]
    return Array.isArray(value) ? value[0] : value
  }
  const filters = {
    mime: getStr('mime') ?? 'all',
    view: getStr('view') ?? '',
    search: getStr('search') ?? '',
  }
  const page = Math.max(1, Number(getStr('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(20, Number(getStr('limit') ?? 50) || 50))

  const [currentResult, allResult, issueResult, bytes, settings] = await Promise.all([
    listUploads({
      mime: filters.mime,
      view: filters.view,
      search: filters.search || undefined,
      page,
      limit,
    }),
    listUploads({ page: 1, limit: 1 }),
    listUploads({ view: 'issues', page: 1, limit: 1 }),
    sumStorageSize(),
    getSiteSettings().catch(() => defaultSiteSettings),
  ])
  const { uploads, total } = currentResult
  const referenceSummary = await summarizeMediaReferences(uploads).catch((err) => {
    console.error('[admin-site-media] load media reference summary failed', err)
    return emptyMediaReferenceSummary()
  })

  const adminRole: AdminRole = role
  const maxUploadMb = normalizeMediaMaxUploadMb(settings.mediaMaxUploadMb)
  const mediaFilters: MediaFilterState = {
    ...filters,
    page,
    limit,
  }

  return (
    <AdminSectionShell
      topNavActive="site"
      role={adminRole}
      email={session.user.email}
      title="网站管理"
      description="管理前台图片素材、上传派生图和大图风险提示。"
      sideNavGroups={getSiteToolNav(allResult.total)}
      activeItem="media"
    >
      <AdminPageHero
        kicker="MEDIA CENTER"
        title="图片素材"
        description="这里承接前台产品、案例、新闻、页面模块和 Media Kit 的图片素材。运营上传后优先生成缩略图，前台页面按场景读取小图，原图继续保留作为资产。"
      />
      <MediaOperationsConsole
        filters={mediaFilters}
        total={total}
        allTotal={allResult.total}
        issueTotal={issueResult.total}
        bytes={bytes}
        pageRows={uploads.length}
        referenceSummary={referenceSummary}
        maxUploadMb={maxUploadMb}
      />
      <MediaReplacementWorkbench
        filters={mediaFilters}
        issueTotal={issueResult.total}
        referenceSummary={referenceSummary}
        maxUploadMb={maxUploadMb}
      />
      <MediaClient
        initialUploads={uploads}
        initialTotal={total}
        initialAllTotal={allResult.total}
        initialIssueTotal={issueResult.total}
        initialBytes={bytes}
        initialReferenceSummary={referenceSummary}
        initialFilters={filters}
        initialPage={page}
        initialLimit={limit}
        maxUploadMb={maxUploadMb}
      />
    </AdminSectionShell>
  )
}
