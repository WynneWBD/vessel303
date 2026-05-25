import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
import {
  Archive,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  Filter,
  Globe2,
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
  OR NULLIF(BTRIM(COALESCE(products, '')), '') IS NULL
  OR jsonb_array_length(COALESCE(tags_zh, '[]'::jsonb)) = 0
  OR jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) = 0
)`

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

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasItems(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function hasCoordinates(project: ProjectListRow): boolean {
  return project.latitude != null && project.longitude != null
}

function parseCount(value: string | undefined): number {
  return parseInt(value ?? '0', 10)
}

function getProjectIssues(project: ProjectListRow): string[] {
  const issues: string[] = []

  if (!hasText(project.cover_image_url)) issues.push('缺封面')
  if (!hasItems(project.images)) issues.push('缺图库')
  if (!hasText(project.description_zh)) issues.push('缺中文简介')
  if (!hasText(project.description_en)) issues.push('缺英文简介')
  if (!hasText(project.products)) issues.push('缺产品型号')
  if (!hasItems(project.tags_zh) || !hasItems(project.tags_en)) issues.push('缺标签')
  if (!hasCoordinates(project)) issues.push('缺坐标')

  return issues
}

function getCompletenessLabel(issues: string[]): string {
  if (issues.length === 0) return '完整'
  if (issues.includes('缺封面') || issues.includes('缺图库')) return '待补素材'
  return '可展示但待补充'
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
        { key: 'news', label: '新闻资讯', href: '/admin/news', Icon: Newspaper },
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
    { title: '项目总数', value: summary.total, detail: '当前未删除项目案例', tone: 'blue' },
    { title: '已发布', value: summary.published, detail: '可在 /cases 展示', tone: 'green' },
    { title: '草稿', value: summary.draft, detail: '待检查或待发布', tone: 'orange' },
    { title: '近 30 天新增', value: summary.recent, detail: '按创建时间统计', tone: 'neutral' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#61767D]">{card.title}</p>
          <p
            className={`mt-3 text-3xl font-bold ${
              card.tone === 'green'
                ? 'text-emerald-700'
                : card.tone === 'orange'
                  ? 'text-[#E36F2C]'
                  : card.tone === 'neutral'
                    ? 'text-[#61767D]'
                    : 'text-[#1889B6]'
            }`}
          >
            {formatNumber(card.value)}
          </p>
          <p className="mt-2 text-xs text-[#8A9EA4]">{card.detail}</p>
        </div>
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

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
            tab.active
              ? 'border-[#E36F2C] bg-[#E36F2C] text-white'
              : 'border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]'
          }`}
        >
          {tab.label}
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab.active ? 'bg-white/20 text-white' : 'bg-[#FFF2E7] text-[#E36F2C]'}`}>
            {formatNumber(tab.count)}
          </span>
        </Link>
      ))}
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
      <Link
        href="/admin/content/projects/new"
        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
      >
        <Plus size={16} />
        新增项目
      </Link>
      <Link
        href="/admin/content/projects/list?status=draft"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
      >
        <FileText size={16} />
        查看草稿
      </Link>
      <Link
        href="/admin/content/projects/list?status=published"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
      >
        <CheckCircle2 size={16} />
        查看已发布
      </Link>
      <Link
        href="/admin/projects"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
      >
        <ListChecks size={16} />
        维护列表
      </Link>
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
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">项目案例列表</h2>
          <p className="mt-1 text-sm text-[#61767D]">
            当前筛选下共 {formatNumber(total)} 个项目，本页显示 {formatNumber(rows.length)} 个。
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((project) => (
          <ProjectRow key={project.id} project={project} />
        ))}
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

  return (
    <article className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm transition hover:border-[#1889B6]/55 hover:shadow-md">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[112px_minmax(0,1fr)_180px_190px_168px] xl:items-center">
        <div className="h-28 w-full overflow-hidden rounded-md bg-[#E6EEEE] xl:h-20 xl:w-28">
          {hasText(project.cover_image_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.cover_image_url ?? ''} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#8A9EA4]">
              <ImageIcon size={20} />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-[#1E2C31]">{project.name_zh || project.name_en || project.id}</h3>
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
          </div>
          <p className="mt-1 truncate text-sm text-[#61767D]">{project.name_en}</p>
          <p className="mt-1 text-xs text-[#8A9EA4]">{project.id}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
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
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md bg-[#F7FAFA] p-3 text-xs xl:grid-cols-1">
          <ProjectMeta label="国家 / 地区" value={project.country} />
          <ProjectMeta label="城市 / 位置" value={project.location_zh || project.location_en} />
          <ProjectMeta label="产品型号" value={project.products} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md bg-[#F7FAFA] p-3 text-xs xl:grid-cols-1">
          <span>
            <span className="block text-[#8A9EA4]">Global 入图状态</span>
            <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${globalStatus.className}`}>
              {globalStatus.label}
            </span>
          </span>
          <ProjectMeta label="更新时间" value={formatDate(project.updated_at)} />
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {published ? (
            <Link
              href="/cases"
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
          {globalStatus.href ? (
            <Link
              href={globalStatus.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#E36F2C] transition hover:border-[#E36F2C] hover:bg-[#FFF7F0]"
            >
              <Globe2 size={14} />
              Global
            </Link>
          ) : null}
          <Link
            href={`/admin/content/projects/${project.id}/edit`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95E22]"
          >
            <Pencil size={14} />
            编辑
          </Link>
        </div>
      </div>
    </article>
  )
}

function ProjectMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0">
      <span className="block text-[#8A9EA4]">{label}</span>
      <span className="mt-1 block truncate font-semibold text-[#1E2C31]">{value || '未标记'}</span>
    </span>
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
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1889B6]">项目案例</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">项目案例列表</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
              这里查看正式项目案例内容状态。Global 只显示地图入图状态，本轮不改地图底层和点位渲染。
            </p>
          </div>
          <QuickActions />
        </div>
      </section>

      <div className="space-y-6">
        <SummaryCards summary={summary} />
        <StatusTabs filters={filters} summary={summary} />
        <FilterPanel filters={filters} />
        <ProjectList rows={list.rows} total={list.total} filters={filters} />
      </div>
    </AdminSectionShell>
  )
}
