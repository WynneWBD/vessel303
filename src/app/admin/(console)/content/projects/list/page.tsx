import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  AdminActionLink,
  AdminMetricCard,
  AdminPageHero,
  AdminSectionTitle,
  AdminSegmentTabs,
} from '@/components/admin/AdminUI'
import { pool } from '@/lib/db'
import {
  MIN_PROJECT_CASE_DESCRIPTION_CHARS,
  getProjectCaseReadinessIssues,
  getProjectCaseReadinessLevel,
} from '@/lib/project-case-readiness'
import {
  Archive,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  Filter,
  ImageIcon,
  Layers3,
  ListChecks,
  MapPinned,
  Newspaper,
  Package,
  Pencil,
  Plus,
  Search,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '项目案例列表 - VESSEL' }

const PAGE_SIZE = 50

type AdminRole = 'admin' | 'operator'
type ProjectStatus = 'draft' | 'published'
type ProjectView = '' | 'incomplete' | 'map-ready' | 'missing-coordinates' | 'unpublished-with-coordinates'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type FilterState = {
  status: ProjectStatus | ''
  view: ProjectView
  search: string
  page: number
}

type ProjectSummary = {
  total: number
  published: number
  draft: number
  recent: number
  incomplete: number
  mapReady: number
  missingCoordinates: number
}

type ProjectListRow = {
  id: string
  name_zh: string
  name_en: string
  location_zh: string
  location_en: string
  country: string
  project_type_zh: string | null
  project_type_en: string | null
  area_display: string | null
  units_display: string | null
  products: string
  description_zh: string | null
  description_en: string | null
  tags_zh: unknown[] | null
  tags_en: unknown[] | null
  cover_image_url: string | null
  images: unknown[] | null
  latitude: string | number | null
  longitude: string | number | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}

type ProjectListResult = {
  rows: ProjectListRow[]
  total: number
}

type StatCard = {
  title: string
  value: number
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'neutral'
  Icon: LucideIcon
}

type ProjectSignalBucket = {
  key: string
  label: string
  detail: string
  href: (filters: FilterState) => string
  matches: (project: ProjectListRow, issues: string[]) => boolean
}

type ProjectPriorityItem = {
  project: ProjectListRow
  issues: string[]
  label: string
  score: number
}

const EMPTY_SUMMARY: ProjectSummary = {
  total: 0,
  published: 0,
  draft: 0,
  recent: 0,
  incomplete: 0,
  mapReady: 0,
  missingCoordinates: 0,
}

const PROJECT_INCOMPLETE_SQL = `(
  NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL
  OR jsonb_array_length(COALESCE(images, '[]'::jsonb)) = 0
  OR NULLIF(BTRIM(COALESCE(description_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NULL
  OR LENGTH(BTRIM(COALESCE(description_zh, ''))) < ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
  OR LENGTH(BTRIM(COALESCE(description_en, ''))) < ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
  OR NULLIF(BTRIM(COALESCE(project_type_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(project_type_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(area_display, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(units_display, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(products, '')), '') IS NULL
  OR jsonb_array_length(COALESCE(tags_zh, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) = 0
)`

const PROJECT_SIGNAL_BUCKETS: ProjectSignalBucket[] = [
  {
    key: 'media',
    label: '素材缺口',
    detail: '封面或项目图库缺失',
    href: (filters) => createHref(filters, { status: '', view: 'incomplete' }),
    matches: (_project, issues) => issues.includes('缺封面') || issues.includes('缺图库'),
  },
  {
    key: 'story',
    label: '叙事缺口',
    detail: '中英文简介缺失或详情叙事偏短',
    href: (filters) => createHref(filters, { status: '', view: 'incomplete' }),
    matches: (_project, issues) => issues.includes('缺中文简介') || issues.includes('缺英文简介') || issues.includes('详情叙事偏短'),
  },
  {
    key: 'facts',
    label: '项目事实缺口',
    detail: '类型、面积、舱数或产品型号缺失',
    href: (filters) => createHref(filters, { status: '', view: 'incomplete' }),
    matches: (_project, issues) => issues.some((issue) => ['缺项目类型', '缺项目面积', '缺舱数', '缺产品型号'].includes(issue)),
  },
  {
    key: 'tags',
    label: '标签缺口',
    detail: '中英文标签缺失',
    href: (filters) => createHref(filters, { status: '', view: 'incomplete' }),
    matches: (_project, issues) => issues.includes('缺标签'),
  },
  {
    key: 'coordinates',
    label: '坐标缺口',
    detail: '缺少 Global 点位坐标',
    href: (filters) => createHref(filters, { status: '', view: 'missing-coordinates' }),
    matches: (_project, issues) => issues.includes('缺坐标'),
  },
  {
    key: 'pending-global',
    label: '有坐标待发布',
    detail: '已有坐标但仍是草稿',
    href: (filters) => createHref(filters, { status: '', view: 'unpublished-with-coordinates' }),
    matches: (_project, issues) => issues.includes('有坐标待发布'),
  },
]

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function normalizeStatus(value: string | undefined): ProjectStatus | '' {
  return value === 'draft' || value === 'published' ? value : ''
}

function normalizeView(value: string | undefined): ProjectView {
  if (
    value === 'incomplete' ||
    value === 'map-ready' ||
    value === 'missing-coordinates' ||
    value === 'unpublished-with-coordinates'
  ) return value
  return ''
}

function normalizePage(value: string | undefined): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseFilters(sp: Record<string, string | string[] | undefined>): FilterState {
  return {
    status: normalizeStatus(firstParam(sp.status)),
    view: normalizeView(firstParam(sp.view)),
    search: firstParam(sp.search)?.trim() ?? '',
    page: normalizePage(firstParam(sp.page)),
  }
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function formatPercent(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasCoordinates(project: ProjectListRow): boolean {
  return project.latitude != null && project.longitude != null
}

function parseCount(value: string | undefined): number {
  return parseInt(value ?? '0', 10)
}

function getProjectIssues(project: ProjectListRow): string[] {
  return getProjectCaseReadinessIssues(project, { includeCoordinates: true })
}

function getCompletenessLabel(issues: string[]): string {
  return getProjectCaseReadinessLevel(issues)
}

function getProjectPriorityScore(project: ProjectListRow, issues: string[]): number {
  let score = 0
  if (issues.includes('缺封面') || issues.includes('缺图库')) score += 24
  if (issues.includes('缺坐标')) score += project.status === 'published' ? 22 : 10
  if (issues.includes('有坐标待发布')) score += 18
  if (issues.includes('缺中文简介') || issues.includes('缺英文简介') || issues.includes('详情叙事偏短')) score += 16
  if (issues.some((issue) => ['缺项目类型', '缺项目面积', '缺舱数', '缺产品型号'].includes(issue))) score += 14
  if (project.status === 'draft') score += 8
  score += Math.min(10, Math.max(0, issues.length - 1) * 2)
  return score
}

function getProjectPriorityLabel(project: ProjectListRow, issues: string[]): string {
  if (issues.includes('缺封面') || issues.includes('缺图库')) return '先补素材'
  if (issues.includes('缺坐标') && project.status === 'published') return '补 Global 坐标'
  if (issues.includes('有坐标待发布')) return '检查后发布'
  if (issues.includes('缺中文简介') || issues.includes('缺英文简介') || issues.includes('详情叙事偏短')) return '补案例叙事'
  if (issues.some((issue) => ['缺项目类型', '缺项目面积', '缺舱数', '缺产品型号'].includes(issue))) return '补项目事实'
  return '补运营字段'
}

function buildProjectPriorityItems(rows: ProjectListRow[]): ProjectPriorityItem[] {
  return rows
    .map((project) => {
      const issues = getProjectIssues(project)
      return {
        project,
        issues,
        label: getProjectPriorityLabel(project, issues),
        score: getProjectPriorityScore(project, issues),
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.project.updated_at).getTime() - new Date(a.project.updated_at).getTime()
    })
    .slice(0, 6)
}

function completenessClass(label: string): string {
  if (label === '完整') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (label === '待补素材') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function getGlobalStatus(project: ProjectListRow): {
  label: string
  className: string
  href?: string
} {
  const hasCoords = hasCoordinates(project)
  if (project.status === 'published' && hasCoords) {
    return {
      label: '可入 Global',
      className: 'border-[#E36F2C]/30 bg-[#E36F2C]/15 text-[#E36F2C]',
      href: `/global?camp=${project.id}`,
    }
  }
  if (project.status !== 'published' && hasCoords) {
    return {
      label: '有坐标待发布',
      className: 'border-[#D8E7E8] bg-[#EAF4FF] text-[#3078C8]',
    }
  }
  if (project.status === 'published' && !hasCoords) {
    return {
      label: '已发布未入图',
      className: 'border-orange-200 bg-orange-50 text-orange-700',
    }
  }
  return {
    label: '缺坐标',
    className: 'border-[#E6EEEE] bg-[#F7FAFA] text-[#8A9EA4]',
  }
}

function createHref(filters: FilterState, patch: Partial<FilterState & { clearSearch: boolean }>): string {
  const next: FilterState = {
    ...filters,
    ...patch,
    page: patch.page ?? 1,
  }
  const params = new URLSearchParams()

  if (next.status) params.set('status', next.status)
  if (next.view) params.set('view', next.view)
  if (!patch.clearSearch && next.search) params.set('search', next.search)
  if (next.page > 1) params.set('page', String(next.page))

  const query = params.toString()
  return query ? `/admin/content/projects/list?${query}` : '/admin/content/projects/list'
}

function buildWhere(filters: FilterState): { where: string; params: unknown[] } {
  const conditions = ['deleted_at IS NULL']
  const params: unknown[] = []

  if (filters.status) {
    params.push(filters.status)
    conditions.push(`status = $${params.length}`)
  }

  if (filters.view === 'incomplete') {
    conditions.push(PROJECT_INCOMPLETE_SQL)
  } else if (filters.view === 'map-ready') {
    conditions.push(`status = 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL`)
  } else if (filters.view === 'missing-coordinates') {
    conditions.push(`(latitude IS NULL OR longitude IS NULL)`)
  } else if (filters.view === 'unpublished-with-coordinates') {
    conditions.push(`status <> 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL`)
  }

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(
      id ILIKE $${params.length}
      OR name_zh ILIKE $${params.length}
      OR name_en ILIKE $${params.length}
      OR COALESCE(location_zh, '') ILIKE $${params.length}
      OR COALESCE(location_en, '') ILIKE $${params.length}
      OR COALESCE(country, '') ILIKE $${params.length}
      OR COALESCE(products, '') ILIKE $${params.length}
    )`)
  }

  return { where: `WHERE ${conditions.join(' AND ')}`, params }
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content-projects-list] ${label} failed`, err)
    return fallback
  }
}

async function getProjectSummary(): Promise<ProjectSummary> {
  if (!(await tableExists('public.project_cases'))) return EMPTY_SUMMARY

  const res = await pool.query<{
    total: string
    published: string
    draft: string
    recent: string
    incomplete: string
    mapReady: string
    missingCoordinates: string
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent,
       COUNT(*) FILTER (WHERE ${PROJECT_INCOMPLETE_SQL})::text AS "incomplete",
       COUNT(*) FILTER (
         WHERE status = 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL
       )::text AS "mapReady",
       COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::text AS "missingCoordinates"
     FROM project_cases
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    draft: parseCount(row?.draft),
    recent: parseCount(row?.recent),
    incomplete: parseCount(row?.incomplete),
    mapReady: parseCount(row?.mapReady),
    missingCoordinates: parseCount(row?.missingCoordinates),
  }
}

async function getProjects(filters: FilterState): Promise<ProjectListResult> {
  if (!(await tableExists('public.project_cases'))) return { rows: [], total: 0 }

  const { where, params } = buildWhere(filters)
  const countRes = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM project_cases ${where}`, params)
  const total = parseCount(countRes.rows[0]?.count)
  const offset = (filters.page - 1) * PAGE_SIZE

  const listRes = await pool.query<ProjectListRow>(
    `SELECT
       id,
       name_zh,
       name_en,
       location_zh,
       location_en,
       country,
       project_type_zh,
       project_type_en,
       area_display,
       units_display,
       products,
       description_zh,
       description_en,
       COALESCE(tags_zh, '[]'::jsonb) AS tags_zh,
       COALESCE(tags_en, '[]'::jsonb) AS tags_en,
       cover_image_url,
       COALESCE(images, '[]'::jsonb) AS images,
       latitude,
       longitude,
       status,
       created_at::text AS created_at,
       updated_at::text AS updated_at
     FROM project_cases
     ${where}
     ORDER BY updated_at DESC, sort_order ASC, id ASC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, PAGE_SIZE, offset],
  )

  return { rows: listRes.rows, total }
}

function getSideNavGroups(summary: ProjectSummary): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', badge: summary.total, Icon: MapPinned },
        { key: 'project-list', label: '项目列表', href: '/admin/content/projects/list', Icon: ListChecks },
        { key: 'drafts', label: '草稿内容', href: '/admin/content/projects/list?status=draft', badge: summary.draft, Icon: FileText },
        { key: 'todo', label: '待补内容', href: '/admin/content/projects/list?view=incomplete', badge: summary.incomplete, Icon: CircleDashed },
        { key: 'missing-coordinates', label: '缺坐标', href: '/admin/content/projects/list?view=missing-coordinates', badge: summary.missingCoordinates, Icon: MapPinned },
      ],
    },
    {
      title: '内容类型',
      items: [
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'project-new', label: '新增项目', href: '/admin/content/projects/new', Icon: Plus },
        { key: 'taxonomy', label: '分类与标签', planned: true, Icon: Tags },
        { key: 'recycle', label: '回收站', planned: true, Icon: Archive },
      ],
    },
  ]
}

function SummaryCards({ summary }: { summary: ProjectSummary }) {
  const cards: StatCard[] = [
    { title: '项目总数', value: summary.total, detail: '当前未删除项目案例', tone: 'blue', Icon: MapPinned },
    { title: '已发布', value: summary.published, detail: '可在 /cases 展示', tone: 'green', Icon: CheckCircle2 },
    { title: '草稿', value: summary.draft, detail: '待检查或待发布', tone: 'orange', Icon: FileText },
    { title: '近 30 天新增', value: summary.recent, detail: '按创建时间统计', tone: 'neutral', Icon: Newspaper },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <AdminMetricCard
          key={card.title}
          title={card.title}
          value={formatNumber(card.value)}
          detail={card.detail}
          tone={card.tone}
          Icon={card.Icon}
        />
      ))}
    </div>
  )
}

function StatusTabs({ filters, summary }: { filters: FilterState; summary: ProjectSummary }) {
  const tabs = [
    { label: '全部', href: createHref(filters, { status: '', view: '' }), active: !filters.status && !filters.view, count: summary.total },
    {
      label: '已发布',
      href: createHref(filters, { status: 'published', view: '' }),
      active: filters.status === 'published' && !filters.view,
      count: summary.published,
    },
    {
      label: '草稿',
      href: createHref(filters, { status: 'draft', view: '' }),
      active: filters.status === 'draft' && !filters.view,
      count: summary.draft,
    },
    {
      label: '待补内容',
      href: createHref(filters, { status: '', view: 'incomplete' }),
      active: filters.view === 'incomplete',
      count: summary.incomplete,
    },
    {
      label: '可入 Global',
      href: createHref(filters, { status: '', view: 'map-ready' }),
      active: filters.view === 'map-ready',
      count: summary.mapReady,
    },
    {
      label: '缺坐标',
      href: createHref(filters, { status: '', view: 'missing-coordinates' }),
      active: filters.view === 'missing-coordinates',
      count: summary.missingCoordinates,
    },
  ]

  return <AdminSegmentTabs items={tabs.map((tab) => ({ ...tab, count: formatNumber(tab.count) }))} />
}

function ProjectOperationsMatrix({
  summary,
  rows,
  filters,
}: {
  summary: ProjectSummary
  rows: ProjectListRow[]
  filters: FilterState
}) {
  const signalStats = PROJECT_SIGNAL_BUCKETS.map((bucket) => {
    const count = rows.filter((project) => bucket.matches(project, getProjectIssues(project))).length
    return {
      ...bucket,
      count,
      href: bucket.href(filters),
    }
  })
  const priorityItems = buildProjectPriorityItems(rows)
  const publishedRate = formatPercent(summary.published, summary.total)
  const incompleteRate = formatPercent(summary.incomplete, summary.total)
  const mapReadyRate = formatPercent(summary.mapReady, summary.total)

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Case Operations</p>
            <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">项目案例运营矩阵</h2>
            <p className="mt-1 text-sm leading-6 text-[#61767D]">
              先扫案例发布、内容缺口和 Global 入图状态，再进入案例编辑或现有筛选。
            </p>
          </div>
          <Link
            href={createHref(filters, { status: '', view: 'incomplete' })}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            查看待补案例
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
          <ProjectMatrixKpi label="发布率" value={publishedRate} detail={`${formatNumber(summary.published)} / ${formatNumber(summary.total)}`} tone="green" />
          <ProjectMatrixKpi label="缺项率" value={incompleteRate} detail={`${formatNumber(summary.incomplete)} 个待补`} tone={summary.incomplete > 0 ? 'orange' : 'green'} />
          <ProjectMatrixKpi label="Global 入图率" value={mapReadyRate} detail={`${formatNumber(summary.mapReady)} 个可入 Global`} tone={summary.mapReady > 0 ? 'blue' : 'gray'} />
          <ProjectMatrixKpi label="缺坐标" value={formatNumber(summary.missingCoordinates)} detail="影响地图点位展示" tone={summary.missingCoordinates > 0 ? 'orange' : 'green'} />
        </div>

        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
          {signalStats.map((bucket) => (
            <Link
              key={bucket.key}
              href={bucket.href}
              className="group min-h-[112px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-[#F7FAFA] xl:border-b-0"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#1E2C31]">{bucket.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#61767D]">{bucket.detail}</span>
                </span>
                <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                  bucket.count > 0 ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {formatNumber(bucket.count)}
                </span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] opacity-80 transition group-hover:opacity-100">
                下钻筛选
                <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <aside className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
              <BarChart3 size={17} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#1E2C31]">本页优先处理</h2>
              <p className="mt-1 text-xs text-[#61767D]">按素材、Global 坐标、叙事和项目事实排序。</p>
            </div>
          </div>
        </div>
        {priorityItems.length > 0 ? (
          <div className="divide-y divide-[#E6EEEE]">
            {priorityItems.map((item) => (
              <Link
                key={item.project.id}
                href={`/admin/content/projects/${item.project.id}/edit`}
                className="block px-4 py-3 transition hover:bg-[#F7FAFA]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#1E2C31]">
                      {item.project.name_zh || item.project.name_en || item.project.id}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[#61767D]">
                      {item.project.country || '未标记国家'} · {item.project.location_zh || item.project.location_en || '未标记位置'}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-md bg-[#FFF2E7] px-2 py-1 text-xs font-bold text-[#E36F2C]">
                    {item.label}
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {item.issues.slice(0, 3).map((issue) => (
                    <span key={issue} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600">
                      {issue}
                    </span>
                  ))}
                  {item.issues.length > 3 ? (
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500">
                      +{item.issues.length - 3}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={28} />
            <p className="mt-3 text-sm font-bold text-[#1E2C31]">当前页无高优先级缺口</p>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">可继续切换筛选条件检查其他案例。</p>
          </div>
        )}
      </aside>
    </section>
  )
}

function ProjectMatrixKpi({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'orange'
        ? 'text-[#E36F2C]'
        : tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <div className="border-b border-[#E6EEEE] px-4 py-3 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function FilterPanel({ filters }: { filters: FilterState }) {
  return (
    <form action="/admin/content/projects/list" className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      {filters.status && <input type="hidden" name="status" value={filters.status} />}
      {filters.view && <input type="hidden" name="view" value={filters.view} />}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto]">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#61767D]">
          搜索项目
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9EA4]" size={16} />
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="标题、ID、国家、城市、产品型号"
              className="h-10 w-full rounded-md border border-[#D8E7E8] bg-white pl-9 pr-3 text-sm text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
            />
          </span>
        </label>
        <button
          type="submit"
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1889B6] px-4 text-sm font-semibold text-white transition hover:bg-[#126D91]"
        >
          <Filter size={16} />
          筛选
        </button>
        <Link
          href="/admin/content/projects/list"
          className="mt-auto inline-flex h-10 items-center justify-center rounded-md border border-[#D8E7E8] bg-white px-4 text-sm font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
        >
          清空
        </Link>
      </div>
    </form>
  )
}

function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminActionLink href="/admin/content/projects/new" Icon={Plus} label="新增项目" primary />
      <AdminActionLink href="/admin/content/projects/list?status=draft" Icon={FileText} label="查看草稿" />
      <AdminActionLink href="/admin/content/projects/list?status=published" Icon={CheckCircle2} label="查看已发布" />
      <AdminActionLink href="/admin/projects" Icon={ListChecks} label="维护列表" />
    </div>
  )
}

function ProjectList({
  rows,
  total,
  filters,
}: {
  rows: ProjectListRow[]
  total: number
  filters: FilterState
}) {
  if (rows.length === 0) {
    return <EmptyState filters={filters} />
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <AdminSectionTitle
          title="当前项目结果"
          detail={`当前筛选下共 ${formatNumber(total)} 个项目，本页显示 ${formatNumber(rows.length)} 个。`}
        />
      </div>
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#F7FAFA] text-xs font-semibold uppercase tracking-[0.08em] text-[#61767D]">
              <tr>
                <th className="w-[34%] border-b border-[#D8E7E8] px-4 py-3">项目案例</th>
                <th className="w-[13%] border-b border-[#D8E7E8] px-4 py-3">状态</th>
                <th className="w-[19%] border-b border-[#D8E7E8] px-4 py-3">位置 / 类型</th>
                <th className="w-[17%] border-b border-[#D8E7E8] px-4 py-3">待补项</th>
                <th className="w-[11%] border-b border-[#D8E7E8] px-4 py-3">Global</th>
                <th className="w-[10%] border-b border-[#D8E7E8] px-4 py-3">更新时间</th>
                <th className="w-[12%] border-b border-[#D8E7E8] px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EEEE]">
              {rows.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination filters={filters} total={total} />
    </section>
  )
}

function ProjectRow({ project }: { project: ProjectListRow }) {
  const issues = getProjectIssues(project)
  const label = getCompletenessLabel(issues)
  const visibleIssues = issues.slice(0, 3)
  const hiddenIssueCount = Math.max(0, issues.length - visibleIssues.length)
  const published = project.status === 'published'
  const globalStatus = getGlobalStatus(project)
  const imageCount = Array.isArray(project.images) ? project.images.length : 0
  const detailHref = `/cases/${project.id}`

  return (
    <tr className="align-top transition hover:bg-[#F7FAFA]">
      <td className="px-4 py-3">
        <div className="flex min-w-0 gap-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-[#E6EEEE]">
            {hasText(project.cover_image_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.cover_image_url ?? ''} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#8A9EA4]">
                <ImageIcon size={18} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/content/projects/${project.id}/edit`}
                className="truncate text-sm font-bold text-[#1E2C31] hover:text-[#1889B6]"
              >
                {project.name_zh || project.name_en || project.id}
              </Link>
            </div>
            <p className="mt-1 truncate text-xs text-[#61767D]">{project.name_en || '未填写英文名称'}</p>
            <p className="mt-1 truncate font-mono text-[11px] text-[#8A9EA4]">{project.id}</p>
            <p className="mt-1 truncate text-[11px] text-[#8A9EA4]">{detailHref}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              published ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
            }`}
          >
            {published ? '已发布' : '草稿'}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${completenessClass(label)}`}>
            {label}
          </span>
          <span className="text-[11px] text-[#8A9EA4]">图库 {imageCount} 张</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs">
        <div className="space-y-1.5">
          <p className="font-semibold text-[#1E2C31]">{project.country || '未标记国家'}</p>
          <p className="text-[#61767D]">{project.location_zh || project.location_en || '未标记位置'}</p>
          <p className="text-[#61767D]">{project.project_type_zh || project.project_type_en || '未标记类型'}</p>
          <p className="truncate text-[#8A9EA4]">{project.products || '未关联产品'}</p>
          <p className="text-[#8A9EA4]">
            {project.area_display || '未填面积'} · {project.units_display || '未填舱数'}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {visibleIssues.length === 0 ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              基础内容完整
            </span>
          ) : (
            visibleIssues.map((issue) => (
              <span key={issue} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                {issue}
              </span>
            ))
          )}
          {hiddenIssueCount > 0 && (
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">
              还有 {hiddenIssueCount} 项
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-2">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${globalStatus.className}`}>
            {globalStatus.label}
          </span>
          <span className="text-[11px] text-[#8A9EA4]">
            {hasCoordinates(project) ? '已有坐标' : '缺坐标'}
          </span>
          {globalStatus.href ? (
            <Link
              href={globalStatus.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E36F2C] hover:text-[#C95E22]"
            >
              Global
              <ExternalLink size={12} />
            </Link>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-semibold text-[#61767D]">
        {formatDate(project.updated_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          {published ? (
            <Link
              href={detailHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
            >
              <ExternalLink size={14} />
              查看案例
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] px-3 text-xs font-semibold text-[#9AA9AD]">
              <ExternalLink size={14} />
              草稿
            </span>
          )}
          <Link
            href={`/admin/content/projects/${project.id}/edit`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
          >
            <Pencil size={14} />
            编辑
          </Link>
        </div>
      </td>
    </tr>
  )
}

function EmptyState({ filters }: { filters: FilterState }) {
  const hasFilter = Boolean(filters.status || filters.view || filters.search)
  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white p-10 text-center">
      <MapPinned className="mx-auto text-[#8A9EA4]" size={36} />
      <h2 className="mt-4 text-lg font-bold text-[#1E2C31]">{hasFilter ? '没有符合条件的项目案例' : '还没有项目案例'}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#61767D]">
        {hasFilter
          ? '可以清空筛选，或换一个关键词继续查找。'
          : '可以先新建一个项目草稿，再补齐封面、图库、简介、相关产品和坐标。'}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {hasFilter && (
          <Link
            href="/admin/content/projects/list"
            className="inline-flex h-10 items-center rounded-md border border-[#D8E7E8] bg-white px-4 text-sm font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
          >
            清空筛选
          </Link>
        )}
        <Link
          href="/admin/content/projects/new"
          className="inline-flex h-10 items-center rounded-md bg-[#E36F2C] px-4 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
        >
          新增项目
        </Link>
      </div>
    </section>
  )
}

function Pagination({ filters, total }: { filters: FilterState; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-3 text-sm">
      <span className="text-[#61767D]">
        第 {formatNumber(filters.page)} / {formatNumber(totalPages)} 页
      </span>
      <div className="flex gap-2">
        <PaginationLink disabled={filters.page <= 1} href={createHref(filters, { page: Math.max(1, filters.page - 1) })}>
          上一页
        </PaginationLink>
        <PaginationLink disabled={filters.page >= totalPages} href={createHref(filters, { page: Math.min(totalPages, filters.page + 1) })}>
          下一页
        </PaginationLink>
      </div>
    </div>
  )
}

function PaginationLink({ children, disabled, href }: { children: string; disabled: boolean; href: string }) {
  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center rounded-md border border-[#E6EEEE] bg-[#F7FAFA] px-3 font-semibold text-[#9AA9AD]">
        {children}
      </span>
    )
  }
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-white px-3 font-semibold text-[#1E2C31] transition hover:border-[#1889B6] hover:text-[#1889B6]"
    >
      {children}
    </Link>
  )
}

export default async function AdminContentProjectsListPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const filters = parseFilters(await searchParams)
  const [summary, list] = await Promise.all([
    safeLoad('project summary', getProjectSummary, EMPTY_SUMMARY),
    safeLoad('project list', () => getProjects(filters), { rows: [], total: 0 }),
  ])
  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="内容管理"
      description="按产品、项目和新闻处理发布、草稿和待补内容。"
      sideNavGroups={getSideNavGroups(summary)}
      activeItem="project-list"
    >
      <AdminPageHero
        kicker="项目案例"
        title="项目案例列表"
        description="这里查看正式项目案例内容状态。Global 只显示地图入图状态，本轮不改地图底层和点位渲染。"
        actions={<QuickActions />}
      />

      <div className="space-y-6">
        <SummaryCards summary={summary} />
        <StatusTabs filters={filters} summary={summary} />
        <ProjectOperationsMatrix summary={summary} rows={list.rows} filters={filters} />
        <FilterPanel filters={filters} />
        <ProjectList rows={list.rows} total={list.total} filters={filters} />
      </div>
    </AdminSectionShell>
  )
}
