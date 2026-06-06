import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
import { MIN_PROJECT_CASE_DESCRIPTION_CHARS } from '@/lib/project-case-readiness'
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Globe2,
  ImageIcon,
  Layers3,
  ListChecks,
  MapPinned,
  Newspaper,
  Package,
  Plus,
  SearchCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '项目案例 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type ProjectStats = {
  total: number
  published: number
  draft: number
  recent: number
  missingCover: number
  missingGallery: number
  missingCnDescription: number
  missingEnDescription: number
  shortDescription: number
  missingProjectType: number
  missingArea: number
  missingUnits: number
  missingProducts: number
  missingTags: number
  missingCoordinates: number
  unpublishedWithCoordinates: number
}

type ProjectStatsRow = Record<keyof ProjectStats, string>

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

const EMPTY_PROJECT_STATS: ProjectStats = {
  total: 0,
  published: 0,
  draft: 0,
  recent: 0,
  missingCover: 0,
  missingGallery: 0,
  missingCnDescription: 0,
  missingEnDescription: 0,
  shortDescription: 0,
  missingProjectType: 0,
  missingArea: 0,
  missingUnits: 0,
  missingProducts: 0,
  missingTags: 0,
  missingCoordinates: 0,
  unpublishedWithCoordinates: 0,
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
    console.error(`[admin-content-projects] ${label} failed`, err)
    return fallback
  }
}

async function getProjectStats(): Promise<ProjectStats> {
  if (!(await tableExists('public.project_cases'))) return EMPTY_PROJECT_STATS

  const res = await pool.query<ProjectStatsRow>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent,
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL)::text AS "missingCover",
       COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(images, '[]'::jsonb)) = 0)::text AS "missingGallery",
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(description_zh), '') IS NULL)::text AS "missingCnDescription",
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(description_en), '') IS NULL)::text AS "missingEnDescription",
       COUNT(*) FILTER (
         WHERE NULLIF(BTRIM(COALESCE(description_zh, '')), '') IS NOT NULL
           AND NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NOT NULL
           AND (
             LENGTH(BTRIM(COALESCE(description_zh, ''))) < ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
             OR LENGTH(BTRIM(COALESCE(description_en, ''))) < ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
           )
       )::text AS "shortDescription",
       COUNT(*) FILTER (
         WHERE NULLIF(BTRIM(COALESCE(project_type_zh, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(project_type_en, '')), '') IS NULL
       )::text AS "missingProjectType",
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(COALESCE(area_display, '')), '') IS NULL)::text AS "missingArea",
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(COALESCE(units_display, '')), '') IS NULL)::text AS "missingUnits",
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(products), '') IS NULL)::text AS "missingProducts",
       COUNT(*) FILTER (
         WHERE jsonb_array_length(COALESCE(tags_zh, '[]'::jsonb)) = 0
            OR jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) = 0
       )::text AS "missingTags",
       COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::text AS "missingCoordinates",
       COUNT(*) FILTER (
         WHERE status <> 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL
       )::text AS "unpublishedWithCoordinates"
     FROM project_cases
     WHERE deleted_at IS NULL`,
  )
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
    shortDescription: parseCount(row?.shortDescription),
    missingProjectType: parseCount(row?.missingProjectType),
    missingArea: parseCount(row?.missingArea),
    missingUnits: parseCount(row?.missingUnits),
    missingProducts: parseCount(row?.missingProducts),
    missingTags: parseCount(row?.missingTags),
    missingCoordinates: parseCount(row?.missingCoordinates),
    unpublishedWithCoordinates: parseCount(row?.unpublishedWithCoordinates),
  }
}

function getTodoCount(stats: ProjectStats): number {
  return [
    stats.missingCover,
    stats.missingGallery,
    stats.missingCnDescription,
    stats.missingEnDescription,
    stats.shortDescription,
    stats.missingProjectType,
    stats.missingArea,
    stats.missingUnits,
    stats.missingProducts,
    stats.missingTags,
  ].filter((count) => count > 0).length
}

function getSideNavGroups(stats: ProjectStats): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', badge: stats.total, Icon: MapPinned },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
        { key: 'drafts', label: '草稿内容', href: '#drafts', badge: stats.draft, Icon: FileText },
        { key: 'todo', label: '待补内容', href: '#todo', badge: getTodoCount(stats), Icon: CircleDashed },
        { key: 'checks', label: '发布前检查', href: '#checks', Icon: SearchCheck },
      ],
    },
    {
      title: '项目展示',
      items: [
        { key: 'project-list', label: '项目列表', href: '/admin/content/projects/list', Icon: ListChecks },
        { key: 'case-create', label: '新增项目', href: '/admin/content/projects/new', Icon: Plus },
        { key: 'cases-front', label: '查看案例列表', href: '/cases', Icon: ExternalLink },
        { key: 'global-map', label: '查看 Global 地图', href: '/global', Icon: Globe2 },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'taxonomy', label: '分类与标签', planned: true, Icon: Tags },
        { key: 'recycle', label: '回收站', planned: true, Icon: Archive },
      ],
    },
  ]
}

function getStatusEntries(stats: ProjectStats): StatusEntry[] {
  return [
    {
      title: '全部项目',
      value: stats.total,
      detail: '正式项目案例内容总量',
      href: '/admin/content/projects/list',
      Icon: MapPinned,
      tone: 'blue',
    },
    {
      title: '已发布',
      value: stats.published,
      detail: '正在 /cases 中展示的案例',
      href: '/admin/content/projects/list?status=published',
      Icon: CheckCircle2,
      tone: 'green',
    },
    {
      title: '草稿',
      value: stats.draft,
      detail: '等待补齐或发布的项目',
      href: '/admin/content/projects/list?status=draft',
      Icon: FileText,
      tone: 'orange',
    },
    {
      title: '近 30 天新增',
      value: stats.recent,
      detail: '按创建时间统计',
      href: '/admin/content/projects/list',
      Icon: Layers3,
      tone: 'neutral',
    },
  ]
}

function getTodoEntries(stats: ProjectStats): TodoEntry[] {
  return [
    {
      title: '缺封面',
      detail: '案例列表缺少第一视觉',
      count: stats.missingCover,
      Icon: ImageIcon,
    },
    {
      title: '缺图库',
      detail: '项目内容缺少现场图片',
      count: stats.missingGallery,
      Icon: ImageIcon,
    },
    {
      title: '缺中文简介',
      detail: '中文项目介绍还需补齐',
      count: stats.missingCnDescription,
      Icon: FileText,
    },
    {
      title: '缺英文简介',
      detail: '海外展示需要英文介绍',
      count: stats.missingEnDescription,
      Icon: FileText,
    },
    {
      title: '详情叙事偏短',
      detail: '核心样板详情页需要更完整的项目故事',
      count: stats.shortDescription,
      Icon: FileText,
    },
    {
      title: '缺项目类型',
      detail: '影响列表筛选和详情页项目定位',
      count: stats.missingProjectType,
      Icon: Tags,
    },
    {
      title: '缺项目面积',
      detail: '影响详情页项目信息完整度',
      count: stats.missingArea,
      Icon: ListChecks,
    },
    {
      title: '缺舱数',
      detail: '影响项目规模和交付证明表达',
      count: stats.missingUnits,
      Icon: ListChecks,
    },
    {
      title: '缺产品型号',
      detail: '未标明相关 VESSEL 产品',
      count: stats.missingProducts,
      Icon: Package,
    },
    {
      title: '缺标签',
      detail: '缺少场景、类型或区域标签',
      count: stats.missingTags,
      Icon: Tags,
    },
  ]
}

function Hero({ stats }: { stats: ProjectStats }) {
  return (
    <section id="overview" className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E4F6F0_0%,#F4FBFC_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1889B6]">项目案例</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">项目案例运营中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            项目案例是正式内容页面，用于展示项目简介、图片、参数、相关产品和转化入口。Global 是地图展示渠道，不是项目详情页。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/projects/new" Icon={Plus} label="新增项目" primary />
          <PrimaryAction href="/admin/content/projects/list?status=draft" Icon={FileText} label="查看草稿" />
          <PrimaryAction href="/admin/content/projects/list" Icon={ListChecks} label="项目列表" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetric title="项目总数" value={stats.total} detail={`已发布 ${formatNumber(stats.published)}`} />
        <HeroMetric title="草稿项目" value={stats.draft} detail="等待补齐或发布" tone="orange" />
        <HeroMetric title="近 30 天新增" value={stats.recent} detail="按创建时间统计" tone="green" />
        <HeroMetric title="待补类型" value={getTodoCount(stats)} detail="只做提醒，不阻止发布" tone="blue" />
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

function StatusGrid({ stats }: { stats: ProjectStats }) {
  return (
    <section id="drafts" className="scroll-mt-24 space-y-4">
      <SectionTitle title="项目状态入口" detail="进入新版项目列表，查看全部、草稿、已发布和缺坐标状态；新建和编辑已进入新版链路。" />
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

function TodoPanel({ stats }: { stats: ProjectStats }) {
  const entries = getTodoEntries(stats)
  const hasTodo = entries.some((entry) => entry.count > 0)

  return (
    <section id="todo" className="scroll-mt-24 space-y-4">
      <SectionTitle title="待补内容" detail="按正式案例页面需要的基础字段做只读统计，不把 Global 字段当成正式详情内容。" />
      <div className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-6">
          {entries.map((entry) => (
            <TodoStat key={entry.title} entry={entry} />
          ))}
        </div>
        {!hasTodo && (
          <div className="border-t border-[#E6EEEE] px-5 py-4 text-sm text-emerald-700">
            当前项目案例基础内容完整，没有待补提醒。
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

function GlobalStatusPanel({ stats }: { stats: ProjectStats }) {
  return (
    <section className="space-y-4">
      <SectionTitle
        title="Global 入图状态"
        detail="Global 只作为地图展示渠道：已发布且有坐标的项目可进入地图；正式项目详情页已归 /cases/[id]。"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlobalMetric
          title="缺坐标"
          value={stats.missingCoordinates}
          detail="不影响正式案例内容建设，只影响地图点位"
          href="/admin/content/projects/list?view=missing-coordinates"
          tone="orange"
        />
        <GlobalMetric
          title="有坐标待发布"
          value={stats.unpublishedWithCoordinates}
          detail="发布后才会进入 Global 地图"
          href="/admin/content/projects/list?view=unpublished-with-coordinates"
          tone="blue"
        />
        <GlobalMetric
          title="查看地图"
          value={stats.published - stats.missingCoordinates > 0 ? Math.max(0, stats.published - stats.missingCoordinates) : 0}
          detail="仅查看展示效果，本轮不改地图能力"
          href="/global"
          tone="green"
        />
      </div>
    </section>
  )
}

function GlobalMetric({
  title,
  value,
  detail,
  href,
  tone,
}: {
  title: string
  value: number
  detail: string
  href: string
  tone: 'blue' | 'green' | 'orange'
}) {
  const toneClass =
    tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <Link href={href} className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md">
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
        <Globe2 size={18} />
      </span>
      <p className="mt-5 text-sm font-semibold text-[#61767D]">{title}</p>
      <p className="mt-1 text-3xl font-bold text-[#1E2C31]">{formatNumber(value)}</p>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{detail}</p>
    </Link>
  )
}

function ActionPanel() {
  const actions = [
    { label: '新增项目', detail: '使用新版项目新建页创建草稿', href: '/admin/content/projects/new', Icon: Plus },
    { label: '项目列表', detail: '查看项目状态、完整度和 Global 入图状态', href: '/admin/content/projects/list', Icon: ListChecks },
    { label: '维护列表', detail: '发布、下架等操作仍在这里处理', href: '/admin/projects', Icon: ListChecks },
    { label: '查看案例列表', detail: '查看前台 /cases 当前展示效果', href: '/cases', Icon: ExternalLink },
    { label: '查看 Global', detail: '只查看地图展示，不进入管理能力', href: '/global', Icon: Globe2 },
  ]

  return (
    <section className="space-y-4">
      <SectionTitle title="常用入口" detail="新建和编辑已进入新版链路；发布、下架、删除等高风险操作仍在维护入口处理。" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
    { title: '建立案例内容', detail: '先补项目名称、地点、类型、参数、相关产品和简介。' },
    { title: '补齐图片素材', detail: '封面和图库决定项目案例的第一展示质量。' },
    { title: '区分展示渠道', detail: '正式案例页面和 Global 地图分开管理，坐标只影响入图。' },
    { title: '发布与转化', detail: '已发布项目进入 /cases/[id]；案例详情询盘入口已接入现有线索。' },
  ]

  return (
    <section id="checks" className="scroll-mt-24 space-y-4">
      <SectionTitle title="项目运营流程" />
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
  const items = ['新版项目新建', '新版项目编辑', '正式案例详情页', '案例询盘接线索']

  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/70 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
          <ClipboardCheck size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">后续规划</h2>
          <p className="mt-1 text-xs text-[#61767D]">新版列表、新建、编辑、正式案例详情页和案例询盘入口已开放；后续重点回到分类、回收站与内容素材补齐。</p>
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

export default async function AdminContentProjectsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const stats = await safeLoad('project stats', getProjectStats, EMPTY_PROJECT_STATS)
  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="内容管理"
      description="围绕产品、项目和新闻处理发布、草稿和待补内容。"
      sideNavGroups={getSideNavGroups(stats)}
      activeItem="projects"
    >
      <Hero stats={stats} />
      <div className="space-y-8">
        <StatusGrid stats={stats} />
        <TodoPanel stats={stats} />
        <GlobalStatusPanel stats={stats} />
        <ActionPanel />
        <WorkflowPanel />
        <PlanningPanel />
      </div>
    </AdminSectionShell>
  )
}
