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
import { formatAnalyticsPercent, loadConversionPathAnalytics, type AnalyticsConversionMetric } from '@/lib/site-analytics'
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
  SearchCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '项目案例列表 - VESSEL' }

const PAGE_SIZE = 50

type AdminRole = 'admin' | 'operator'
type ProjectStatus = 'draft' | 'published'
type ProjectView = '' | 'incomplete' | 'case-conversion-weak' | 'map-ready' | 'missing-coordinates' | 'unpublished-with-coordinates'

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
  caseConversionWeak: number
  mapReady: number
  missingCoordinates: number
}

type ProjectIssueSummary = {
  media: number
  story: number
  facts: number
  tags: number
  coordinates: number
  pendingGlobal: number
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
  summaryKey: keyof ProjectIssueSummary
  label: string
  detail: string
  href: (filters: FilterState) => string
  matches: (project: ProjectListRow, issues: string[]) => boolean
}

type ProjectPriorityItem = {
  project: ProjectListRow
  issues: string[]
  label: string
  action: ProjectRowNextAction
  score: number
}

type ProjectConversionReadiness = {
  label: string
  detail: string
  className: string
}

type ProjectRowNextAction = {
  label: string
  detail: string
  href: string
  tone: 'blue' | 'green' | 'orange'
  external?: boolean
}

type ActiveFilterChip = {
  label: string
  value: string
  href: string
}

type CaseSourceContract = {
  label: string
  value: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

type CaseInquiryQueueItem = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'gray'
}

const EMPTY_SUMMARY: ProjectSummary = {
  total: 0,
  published: 0,
  draft: 0,
  recent: 0,
  incomplete: 0,
  caseConversionWeak: 0,
  mapReady: 0,
  missingCoordinates: 0,
}

const EMPTY_ISSUE_SUMMARY: ProjectIssueSummary = {
  media: 0,
  story: 0,
  facts: 0,
  tags: 0,
  coordinates: 0,
  pendingGlobal: 0,
}

const EMPTY_CASE_PATH_METRIC: AnalyticsConversionMetric = {
  views: 0,
  ctaClicks: 0,
  formSubmits: 0,
  leads: 0,
  conversionRate: 0,
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
    summaryKey: 'media',
    label: '素材缺口',
    detail: '封面或项目图库缺失',
    href: (filters) => createHref(filters, { status: '', view: 'incomplete' }),
    matches: (_project, issues) => issues.includes('缺封面') || issues.includes('缺图库'),
  },
  {
    key: 'story',
    summaryKey: 'story',
    label: '叙事缺口',
    detail: '中英文简介缺失或详情叙事偏短',
    href: (filters) => createHref(filters, { status: '', view: 'incomplete' }),
    matches: (_project, issues) => issues.includes('缺中文简介') || issues.includes('缺英文简介') || issues.includes('详情叙事偏短'),
  },
  {
    key: 'facts',
    summaryKey: 'facts',
    label: '项目事实缺口',
    detail: '类型、面积、舱数或产品型号缺失',
    href: (filters) => createHref(filters, { status: '', view: 'incomplete' }),
    matches: (_project, issues) => issues.some((issue) => ['缺项目类型', '缺项目面积', '缺舱数', '缺产品型号'].includes(issue)),
  },
  {
    key: 'tags',
    summaryKey: 'tags',
    label: '标签缺口',
    detail: '中英文标签缺失',
    href: (filters) => createHref(filters, { status: '', view: 'incomplete' }),
    matches: (_project, issues) => issues.includes('缺标签'),
  },
  {
    key: 'coordinates',
    summaryKey: 'coordinates',
    label: '坐标缺口',
    detail: '缺少 Global 点位坐标',
    href: (filters) => createHref(filters, { status: '', view: 'missing-coordinates' }),
    matches: (_project, issues) => issues.includes('缺坐标'),
  },
  {
    key: 'pending-global',
    summaryKey: 'pendingGlobal',
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
    value === 'case-conversion-weak' ||
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

function hasCaseConversionContentRisk(issues: string[]): boolean {
  return issues.some((issue) => [
    '缺封面',
    '缺图库',
    '缺中文简介',
    '缺英文简介',
    '详情叙事偏短',
    '缺项目类型',
    '缺项目面积',
    '缺舱数',
    '缺产品型号',
    '缺标签',
  ].includes(issue))
}

function isCaseConversionReady(project: ProjectListRow, issues: string[]): boolean {
  return project.status === 'published' && !hasCaseConversionContentRisk(issues)
}

function getCaseConversionReadiness(project: ProjectListRow, issues: string[]): ProjectConversionReadiness {
  if (project.status !== 'published') {
    return {
      label: '草稿未上线',
      detail: '发布后才进入前台案例咨询路径',
      className: 'border-[#E6EEEE] bg-[#F7FAFA] text-[#8A9EA4]',
    }
  }
  if (issues.includes('缺封面') || issues.includes('缺图库')) {
    return {
      label: '先补素材',
      detail: '封面或图库缺口会削弱案例信任',
      className: 'border-orange-200 bg-orange-50 text-orange-700',
    }
  }
  if (issues.includes('缺中文简介') || issues.includes('缺英文简介') || issues.includes('详情叙事偏短')) {
    return {
      label: '先补叙事',
      detail: '中英文案例背景不足，咨询上下文弱',
      className: 'border-orange-200 bg-orange-50 text-orange-700',
    }
  }
  if (issues.some((issue) => ['缺项目类型', '缺项目面积', '缺舱数', '缺产品型号'].includes(issue))) {
    return {
      label: '补项目事实',
      detail: '类型、面积、舱数或产品信息待补',
      className: 'border-[#D8E7E8] bg-[#EAF4FF] text-[#3078C8]',
    }
  }
  if (issues.includes('缺标签')) {
    return {
      label: '补检索标签',
      detail: '标签不足会影响后台筛选和内容归因',
      className: 'border-[#D8E7E8] bg-[#EAF4FF] text-[#3078C8]',
    }
  }
  return {
    label: '可承接询盘',
    detail: '前台案例页与咨询锚点可核查',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
}

function buildProjectPriorityItems(rows: ProjectListRow[]): ProjectPriorityItem[] {
  return rows
    .map((project) => {
      const issues = getProjectIssues(project)
      return {
        project,
        issues,
        label: getProjectPriorityLabel(project, issues),
        action: getProjectRowNextAction(project, issues),
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

function projectRowNextActionClass(tone: ProjectRowNextAction['tone']): string {
  if (tone === 'orange') return 'border-[#F2C6A7] bg-[#FFF7F0] text-[#B85D21] hover:border-[#E36F2C]/60 hover:text-[#E36F2C]'
  if (tone === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-500'
  return 'border-[#D8E7E8] bg-[#EAF6F8] text-[#1889B6] hover:border-[#1889B6]'
}

function projectEditHref(project: ProjectListRow, anchor = 'publish-check'): string {
  return `/admin/content/projects/${project.id}/edit#${anchor}`
}

function projectPreviewHref(project: ProjectListRow): string {
  return `/cases/${project.id}`
}

function getProjectRowNextAction(project: ProjectListRow, issues: string[]): ProjectRowNextAction {
  if (issues.includes('缺封面') || issues.includes('缺图库')) {
    return {
      label: '补案例素材',
      detail: '先补封面和图库',
      href: projectEditHref(project, 'media'),
      tone: 'orange',
    }
  }

  if (issues.includes('缺坐标')) {
    return {
      label: '补 Global 坐标',
      detail: project.status === 'published' ? '让已发布案例进入地图点位' : '补国家和经纬度，发布后可入图',
      href: projectEditHref(project, 'global'),
      tone: 'orange',
    }
  }

  if (issues.includes('有坐标待发布')) {
    return {
      label: '发布前复核',
      detail: '坐标已就绪，检查后发布',
      href: projectEditHref(project, 'publish-check'),
      tone: 'blue',
    }
  }

  if (issues.includes('缺中文简介') || issues.includes('缺英文简介') || issues.includes('详情叙事偏短')) {
    return {
      label: '补案例叙事',
      detail: '完善中英文证明内容',
      href: projectEditHref(project, 'content'),
      tone: 'orange',
    }
  }

  if (issues.some((issue) => ['缺项目类型', '缺项目面积', '缺舱数', '缺产品型号'].includes(issue))) {
    return {
      label: '补项目事实',
      detail: '补类型、面积、舱数和产品',
      href: projectEditHref(project, 'params'),
      tone: 'orange',
    }
  }

  if (issues.includes('缺标签')) {
    return {
      label: '补检索标签',
      detail: '完善筛选和内容归因',
      href: projectEditHref(project, 'content'),
      tone: 'orange',
    }
  }

  if (issues.length > 0) {
    return {
      label: '处理缺项',
      detail: '进入发布检查定位问题',
      href: projectEditHref(project, 'publish-check'),
      tone: 'orange',
    }
  }

  if (project.status === 'draft') {
    return {
      label: '发布前复核',
      detail: '基础完整，进入发布检查',
      href: projectEditHref(project, 'publish-check'),
      tone: 'blue',
    }
  }

  return {
    label: '复核案例页',
    detail: '基础完整，查看前台展示',
    href: projectPreviewHref(project),
    tone: 'green',
    external: true,
  }
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

function getProjectViewLabel(view: ProjectView): string {
  if (view === 'incomplete') return '待补内容'
  if (view === 'case-conversion-weak') return '发布转化弱'
  if (view === 'map-ready') return '可入 Global'
  if (view === 'missing-coordinates') return '缺坐标'
  if (view === 'unpublished-with-coordinates') return '有坐标待发布'
  return '全部视图'
}

function buildActiveFilterChips(filters: FilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  if (filters.status) {
    chips.push({
      label: '状态',
      value: filters.status === 'published' ? '已发布' : '草稿',
      href: createHref(filters, { status: '' }),
    })
  }

  if (filters.view) {
    chips.push({
      label: '视图',
      value: getProjectViewLabel(filters.view),
      href: createHref(filters, { view: '' }),
    })
  }

  if (filters.search) {
    chips.push({
      label: '搜索',
      value: filters.search,
      href: createHref(filters, { clearSearch: true }),
    })
  }

  return chips
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
  } else if (filters.view === 'case-conversion-weak') {
    conditions.push(`status = 'published' AND ${PROJECT_INCOMPLETE_SQL}`)
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
    caseConversionWeak: string
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
         WHERE status = 'published' AND ${PROJECT_INCOMPLETE_SQL}
       )::text AS "caseConversionWeak",
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
    caseConversionWeak: parseCount(row?.caseConversionWeak),
    mapReady: parseCount(row?.mapReady),
    missingCoordinates: parseCount(row?.missingCoordinates),
  }
}

async function getProjectIssueSummary(): Promise<ProjectIssueSummary> {
  if (!(await tableExists('public.project_cases'))) return EMPTY_ISSUE_SUMMARY

  const res = await pool.query<{
    media: string
    story: string
    facts: string
    tags: string
    coordinates: string
    pendingGlobal: string
  }>(
    `SELECT
       COUNT(*) FILTER (
         WHERE NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL
            OR jsonb_array_length(COALESCE(images, '[]'::jsonb)) = 0
       )::text AS media,
       COUNT(*) FILTER (
         WHERE NULLIF(BTRIM(COALESCE(description_zh, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NULL
            OR LENGTH(BTRIM(COALESCE(description_zh, ''))) < ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
            OR LENGTH(BTRIM(COALESCE(description_en, ''))) < ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
       )::text AS story,
       COUNT(*) FILTER (
         WHERE NULLIF(BTRIM(COALESCE(project_type_zh, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(project_type_en, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(area_display, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(units_display, '')), '') IS NULL
            OR NULLIF(BTRIM(COALESCE(products, '')), '') IS NULL
       )::text AS facts,
       COUNT(*) FILTER (
         WHERE jsonb_array_length(COALESCE(tags_zh, '[]'::jsonb)) = 0
            OR jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) = 0
       )::text AS tags,
       COUNT(*) FILTER (
         WHERE latitude IS NULL OR longitude IS NULL
       )::text AS coordinates,
       COUNT(*) FILTER (
         WHERE status <> 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL
       )::text AS "pendingGlobal"
     FROM project_cases
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    media: parseCount(row?.media),
    story: parseCount(row?.story),
    facts: parseCount(row?.facts),
    tags: parseCount(row?.tags),
    coordinates: parseCount(row?.coordinates),
    pendingGlobal: parseCount(row?.pendingGlobal),
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
        { key: 'case-conversion-weak', label: '发布转化弱', href: '/admin/content/projects/list?view=case-conversion-weak', badge: summary.caseConversionWeak, Icon: SearchCheck },
        { key: 'case-backfill', label: '转化补位', href: '/admin/content/projects/list#case-conversion-content-backfill-desk', badge: summary.caseConversionWeak, Icon: BarChart3 },
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
      label: '转化弱',
      href: createHref(filters, { status: '', view: 'case-conversion-weak' }),
      active: filters.view === 'case-conversion-weak',
      count: summary.caseConversionWeak,
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

function ProjectListControlStrip({
  filters,
  summary,
  casePathMetric,
  total,
  rowsCount,
}: {
  filters: FilterState
  summary: ProjectSummary
  casePathMetric: AnalyticsConversionMetric
  total: number
  rowsCount: number
}) {
  const chips = buildActiveFilterChips(filters)
  const firstRowNumber = total > 0 ? (filters.page - 1) * PAGE_SIZE + 1 : 0
  const lastRowNumber = total > 0 ? Math.min(total, firstRowNumber + rowsCount - 1) : 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const quickLinks = [
    { label: '全部项目', href: '/admin/content/projects/list', count: summary.total, active: chips.length === 0 },
    {
      label: '已发布',
      href: createHref(filters, { status: 'published', view: '' }),
      count: summary.published,
      active: filters.status === 'published' && !filters.view,
    },
    {
      label: '草稿',
      href: createHref(filters, { status: 'draft', view: '' }),
      count: summary.draft,
      active: filters.status === 'draft' && !filters.view,
    },
    {
      label: '待补内容',
      href: createHref(filters, { status: '', view: 'incomplete' }),
      count: summary.incomplete,
      active: filters.view === 'incomplete',
    },
    {
      label: '发布转化弱',
      href: createHref(filters, { status: '', view: 'case-conversion-weak' }),
      count: summary.caseConversionWeak,
      active: filters.view === 'case-conversion-weak',
    },
    {
      label: '案例路径分析',
      href: '/admin/status/traffic#case-inquiry-path',
      count: null,
      active: false,
    },
    {
      label: '可入 Global',
      href: createHref(filters, { status: '', view: 'map-ready' }),
      count: summary.mapReady,
      active: filters.view === 'map-ready',
    },
    {
      label: '缺坐标',
      href: createHref(filters, { status: '', view: 'missing-coordinates' }),
      count: summary.missingCoordinates,
      active: filters.view === 'missing-coordinates',
    },
    {
      label: '坐标待发布',
      href: createHref(filters, { status: '', view: 'unpublished-with-coordinates' }),
      count: null,
      active: filters.view === 'unpublished-with-coordinates',
    },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="border-l-4 border-[#1889B6] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">案例列表控制台</p>
          <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#1E2C31]">当前案例视图</h2>
              <p className="mt-1 text-sm leading-6 text-[#61767D]">
                当前筛选命中 {formatNumber(total)} 个项目，本页显示 {formatNumber(rowsCount)} 个；先确认内容完整度和 Global 入图状态，再进入编辑处理。
              </p>
            </div>
            <Link
              href="/admin/content/projects/list"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              清空全部筛选
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-[#FBFDFD] sm:grid-cols-4 lg:border-l lg:border-t-0">
          <ProjectControlStat label="结果总量" value={formatNumber(total)} detail={`第 ${formatNumber(filters.page)} / ${formatNumber(pageCount)} 页`} />
          <ProjectControlStat label="当前区间" value={`${formatNumber(firstRowNumber)}-${formatNumber(lastRowNumber)}`} detail={`每页 ${formatNumber(PAGE_SIZE)} 条`} />
          <ProjectControlStat label="入图率" value={formatPercent(summary.mapReady, summary.total)} detail={`${formatNumber(summary.mapReady)} 可入 Global`} />
          <ProjectControlStat
            label="案例路径"
            value={formatNumber(casePathMetric.views)}
            detail={`动作 ${formatNumber(casePathMetric.ctaClicks)} / 线索 ${formatNumber(casePathMetric.leads)}`}
          />
        </div>
      </div>

      <div className="border-t border-[#E6EEEE] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.08em] text-[#8A9EA4]">当前筛选</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.length > 0 ? (
                chips.map((chip) => (
                  <Link
                    key={`${chip.label}-${chip.value}`}
                    href={chip.href}
                    className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-1 text-xs text-[#61767D] transition hover:border-[#1889B6] hover:bg-[#EAF6F8] hover:text-[#1889B6]"
                  >
                    <span className="font-semibold text-[#1E2C31]">{chip.label}</span>
                    <span className="max-w-[220px] truncate">{chip.value}</span>
                    <span className="text-[#8A9EA4]">移除</span>
                  </Link>
                ))
              ) : (
                <span className="inline-flex min-h-8 items-center rounded-md border border-dashed border-[#D8E7E8] px-2.5 py-1 text-xs font-semibold text-[#8A9EA4]">
                  当前为全部项目视图
                </span>
              )}
            </div>
          </div>

          <div className="grid min-w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[560px] xl:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                  link.active
                    ? 'border-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
                    : 'border-[#D8E7E8] bg-white text-[#61767D] hover:border-[#1889B6] hover:text-[#1889B6]'
                }`}
              >
                <span>{link.label}</span>
                {link.count === null ? (
                  <ArrowRight size={13} />
                ) : (
                  <span className="rounded bg-[#F0F7F8] px-1.5 py-0.5 text-[11px]">{formatNumber(link.count)}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProjectControlStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-r border-[#E6EEEE] px-4 py-4 last:border-r-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-[#1E2C31]">{value}</p>
      <p className="mt-1 truncate text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function CaseSourceContractPanel({
  filters,
  summary,
  casePathMetric,
}: {
  filters: FilterState
  summary: ProjectSummary
  casePathMetric: AnalyticsConversionMetric
}) {
  const contracts: CaseSourceContract[] = [
    {
      label: '详情 CTA',
      value: 'case:cta_click',
      detail: '公开案例详情页咨询动作，回到案例来源阶段复盘。',
      href: '/admin/customers/leads?source_type=case&source_stage=case%3Acta_click',
      Icon: ExternalLink,
      tone: 'blue',
    },
    {
      label: '表单承接',
      value: 'case:inquiry_form',
      detail: '案例询盘表单进入 leads 后，用 source_stage 精确区分表单样本。',
      href: '/admin/customers/leads?source_type=case&source_stage=case%3Ainquiry_form',
      Icon: ListChecks,
      tone: 'green',
    },
    {
      label: '线索筛选',
      value: 'source_type=case',
      detail: '客户线索台按案例来源筛选，处理仍回到现有线索流程。',
      href: '/admin/customers/leads?source_type=case',
      Icon: SearchCheck,
      tone: 'orange',
    },
    {
      label: '路径分析',
      value: '/cases -> leads',
      detail: '从案例访问、动作、表单和线索样本回看承接质量。',
      href: '/admin/status/traffic#case-inquiry-path',
      Icon: BarChart3,
      tone: 'neutral',
    },
  ]

  return (
    <section id="case-source-contract" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">Source Contract</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例来源承接合同</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            把公开案例列表、案例详情咨询、询盘表单、案例线索队列和转化复盘接成同一条只读路径；这里不新增表单、发布、Global 点位或线索状态规则。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/status/traffic#case-inquiry-path"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <BarChart3 size={13} />
            路径分析
          </Link>
          <Link
            href="/admin/customers/leads?source_type=case"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <ListChecks size={13} />
            案例线索
          </Link>
          <Link
            href={createHref(filters, { status: '', view: 'case-conversion-weak' })}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#E36F2C] transition hover:border-[#E36F2C]/60 hover:bg-[#FFF2E7]"
          >
            <SearchCheck size={13} />
            转化弱
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <CaseSourceSnapshot label="已发布案例" value={formatNumber(summary.published)} detail="前台 /cases 可见内容" />
        <CaseSourceSnapshot label="发布转化弱" value={formatNumber(summary.caseConversionWeak)} detail="素材、叙事或事实待补" />
        <CaseSourceSnapshot label="案例路径动作" value={formatNumber(casePathMetric.ctaClicks)} detail={`表单 ${formatNumber(casePathMetric.formSubmits)}`} />
        <CaseSourceSnapshot label="案例路径线索" value={formatNumber(casePathMetric.leads)} detail={formatAnalyticsPercent(casePathMetric.conversionRate)} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {contracts.map((contract) => (
          <CaseSourceContractLink key={contract.label} contract={contract} />
        ))}
      </div>
    </section>
  )
}

function CaseSourceSnapshot({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] font-semibold text-[#61767D]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#1E2C31]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function CaseSourceContractLink({ contract }: { contract: CaseSourceContract }) {
  const Icon = contract.Icon
  const toneClass =
    contract.tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : contract.tone === 'orange'
        ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
        : contract.tone === 'neutral'
          ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
          : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link href={contract.href} className="group min-h-[150px] px-4 py-4 transition hover:bg-[#F7FAFA]">
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#1E2C31]">{contract.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${toneClass}`}>
            <span className="truncate">{contract.value}</span>
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block text-xs leading-5 text-[#61767D]">{contract.detail}</span>
    </Link>
  )
}

function caseInquiryQueueToneClass(tone: CaseInquiryQueueItem['tone']): string {
  if (tone === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (tone === 'orange') return 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'gray') return 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
  return 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'
}

function CaseListInquiryConversionQueue({
  filters,
  summary,
  issueSummary,
  rows,
  casePathMetric,
}: {
  filters: FilterState
  summary: ProjectSummary
  issueSummary: ProjectIssueSummary
  rows: ProjectListRow[]
  casePathMetric: AnalyticsConversionMetric
}) {
  const pageIssueEntries = rows.map((project) => ({
    project,
    issues: getProjectIssues(project),
  }))
  const pagePublishedCount = pageIssueEntries.filter((entry) => entry.project.status === 'published').length
  const pageWeakCount = pageIssueEntries.filter((entry) => (
    entry.project.status === 'published' && hasCaseConversionContentRisk(entry.issues)
  )).length
  const pageReadyCount = pageIssueEntries.filter((entry) => isCaseConversionReady(entry.project, entry.issues)).length
  const pageDraftCount = pageIssueEntries.filter((entry) => entry.project.status !== 'published').length
  const priorityItems = buildProjectPriorityItems(rows).slice(0, 4)
  const contentGapTotal = issueSummary.media + issueSummary.story + issueSummary.facts + issueSummary.tags
  const currentViewLabel = filters.view ? getProjectViewLabel(filters.view) : filters.status ? (filters.status === 'published' ? '已发布' : '草稿') : '全部案例'
  const queueItems: CaseInquiryQueueItem[] = [
    {
      label: '发布案例池',
      value: formatNumber(summary.published),
      detail: `当前页 ${formatNumber(pagePublishedCount)} 个已发布，先确认可支撑 /cases 到询盘的公开样本。`,
      href: createHref(filters, { status: 'published', view: '' }),
      cta: '筛选已发布',
      Icon: CheckCircle2,
      tone: summary.published > 0 ? 'green' : 'gray',
    },
    {
      label: '转化弱队列',
      value: formatNumber(summary.caseConversionWeak),
      detail: `当前页命中 ${formatNumber(pageWeakCount)} 个发布中缺口；优先补素材、叙事、事实和标签。`,
      href: createHref(filters, { status: '', view: 'case-conversion-weak' }),
      cta: '处理弱项',
      Icon: SearchCheck,
      tone: summary.caseConversionWeak > 0 ? 'orange' : 'green',
    },
    {
      label: '案例询盘线索',
      value: formatNumber(casePathMetric.leads),
      detail: `30 天动作 ${formatNumber(casePathMetric.ctaClicks)}，表单 ${formatNumber(casePathMetric.formSubmits)}；线索归到 source_type=case。`,
      href: '/admin/customers/leads?source_type=case',
      cta: '看案例线索',
      Icon: ListChecks,
      tone: casePathMetric.leads > 0 ? 'green' : casePathMetric.ctaClicks > 0 ? 'orange' : 'blue',
    },
    {
      label: '路径转化率',
      value: formatAnalyticsPercent(casePathMetric.conversionRate),
      detail: `30 天访问 ${formatNumber(casePathMetric.views)}；回到流量页复看 /cases、详情页和询盘路径。`,
      href: '/admin/status/traffic#case-inquiry-path',
      cta: '看路径分析',
      Icon: BarChart3,
      tone: casePathMetric.leads > 0 ? 'green' : casePathMetric.views > 0 ? 'orange' : 'gray',
    },
  ]
  const handoffItems: CaseInquiryQueueItem[] = [
    {
      label: '当前视图',
      value: currentViewLabel,
      detail: `当前页 ${formatNumber(rows.length)} 条，草稿 ${formatNumber(pageDraftCount)} 条，可承接询盘 ${formatNumber(pageReadyCount)} 条。`,
      href: '/admin/content/projects/list',
      cta: '回全部',
      Icon: Filter,
      tone: filters.view || filters.status || filters.search ? 'blue' : 'gray',
    },
    {
      label: '内容缺口',
      value: formatNumber(contentGapTotal),
      detail: `素材 ${formatNumber(issueSummary.media)}，叙事 ${formatNumber(issueSummary.story)}，事实 ${formatNumber(issueSummary.facts)}，标签 ${formatNumber(issueSummary.tags)}。`,
      href: createHref(filters, { status: '', view: 'incomplete' }),
      cta: '看待补内容',
      Icon: CircleDashed,
      tone: contentGapTotal > 0 ? 'orange' : 'green',
    },
    {
      label: '前台路径',
      value: '/cases',
      detail: '公开案例列表和案例详情页是询盘入口；本区只下钻查看，不改前台路由。',
      href: '/cases',
      cta: '看前台',
      Icon: ExternalLink,
      tone: 'blue',
    },
    {
      label: '阶段归因',
      value: 'case:*',
      detail: '按 case:cta_click 与 case:inquiry_form 区分动作和表单，不写线索状态。',
      href: '/admin/customers/leads?source_type=case&source_stage=case%3Ainquiry_form',
      cta: '看表单阶段',
      Icon: Tags,
      tone: 'blue',
    },
    {
      label: 'Global 联动',
      value: formatNumber(summary.mapReady),
      detail: `已发布且有坐标 ${formatNumber(summary.mapReady)} 个；缺坐标 ${formatNumber(summary.missingCoordinates)} 个。`,
      href: createHref(filters, { status: '', view: 'map-ready' }),
      cta: '看入图案例',
      Icon: MapPinned,
      tone: summary.missingCoordinates > 0 ? 'orange' : summary.mapReady > 0 ? 'green' : 'gray',
    },
    {
      label: '编辑队列',
      value: priorityItems[0]?.label ?? '无高优先级',
      detail: priorityItems[0]
        ? `${priorityItems[0].project.name_zh || priorityItems[0].project.name_en || priorityItems[0].project.id} 需要 ${priorityItems[0].label}。`
        : '当前页没有高优先级缺口，可继续切换筛选范围。',
      href: priorityItems[0] ? priorityItems[0].action.href : '/admin/content/projects/list',
      cta: priorityItems[0] ? priorityItems[0].action.label : '回列表',
      Icon: Pencil,
      tone: priorityItems[0] ? 'orange' : 'green',
    },
  ]

  return (
    <section id="case-list-inquiry-conversion-queue" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 border-l-4 border-[#E36F2C] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E36F2C]">B300 Case Inquiry Queue</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例列表到询盘转化处理队列</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把案例列表筛选、已发布案例池、发布转化弱项、`/cases` 前台路径、`source_type=case` 线索和 30 天路径转化数据集中到同屏处理。这里是只读队列，不改案例保存、发布、Global 点位或线索状态。
          </p>
        </div>
        <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] p-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold text-[#61767D]">当前判断</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#1E2C31]">
            {summary.caseConversionWeak > 0
              ? `先处理 ${formatNumber(summary.caseConversionWeak)} 个发布转化弱案例，再回看询盘线索。`
              : '发布案例没有内容型转化弱项，可继续复看路径样本和线索承接。'}
          </p>
          <Link
            href={summary.caseConversionWeak > 0 ? createHref(filters, { status: '', view: 'case-conversion-weak' }) : '/admin/customers/leads?source_type=case'}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1889B6] px-3 text-xs font-bold text-white transition hover:bg-[#137A9F]"
          >
            {summary.caseConversionWeak > 0 ? '进入转化弱队列' : '查看案例线索'}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-4">
        {queueItems.map((item) => (
          <CaseInquiryQueueLink key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-3">
        {handoffItems.map((item) => (
          <CaseInquiryQueueLink key={item.label} item={item} compact />
        ))}
      </div>

      {priorityItems.length > 0 ? (
        <div className="border-t border-[#E6EEEE]">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#1E2C31]">本页优先编辑样本</h3>
              <p className="mt-1 text-xs text-[#61767D]">按素材、坐标、叙事和项目事实缺口排序，只跳转到现有编辑页。</p>
            </div>
            <Link
              href={createHref(filters, { status: '', view: 'case-conversion-weak' })}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-bold text-[#E36F2C] transition hover:border-[#E36F2C]/60 hover:bg-[#FFF2E7]"
            >
              转化弱
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {priorityItems.map((item) => (
              <Link
                key={item.project.id}
                href={item.action.href}
                className="group min-h-[132px] px-4 py-4 transition hover:bg-[#F7FAFA]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#1E2C31]">{item.project.name_zh || item.project.name_en || item.project.id}</span>
                    <span className="mt-1 block truncate text-xs text-[#61767D]">{item.project.country || '未标记国家'} · {item.project.location_zh || item.project.location_en || '未标记位置'}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-[#FFF2E7] px-2 py-1 text-xs font-bold text-[#E36F2C]">{item.label}</span>
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {item.issues.slice(0, 3).map((issue) => (
                    <span key={issue} className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600">
                      {issue}
                    </span>
                  ))}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6]">
                  {item.action.label}
                  <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function CaseConversionContentBackfillDesk({
  filters,
  summary,
  issueSummary,
  rows,
  casePathMetric,
}: {
  filters: FilterState
  summary: ProjectSummary
  issueSummary: ProjectIssueSummary
  rows: ProjectListRow[]
  casePathMetric: AnalyticsConversionMetric
}) {
  const pageIssueEntries = rows.map((project) => ({
    project,
    issues: getProjectIssues(project),
  }))
  const pagePublishedCount = pageIssueEntries.filter((entry) => entry.project.status === 'published').length
  const pageWeakEntries = pageIssueEntries.filter((entry) => (
    entry.project.status === 'published' && hasCaseConversionContentRisk(entry.issues)
  ))
  const pageReadyCount = pageIssueEntries.filter((entry) => isCaseConversionReady(entry.project, entry.issues)).length
  const pageDraftCount = pageIssueEntries.filter((entry) => entry.project.status !== 'published').length
  const pathActions = casePathMetric.ctaClicks + casePathMetric.formSubmits
  const contentGapTotal = issueSummary.media + issueSummary.story + issueSummary.facts + issueSummary.tags
  const readyPublishedTotal = Math.max(0, summary.published - summary.caseConversionWeak)
  const priorityItems = pageWeakEntries
    .map((entry) => ({
      project: entry.project,
      issues: entry.issues,
      label: getProjectPriorityLabel(entry.project, entry.issues),
      score: getProjectPriorityScore(entry.project, entry.issues),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.project.updated_at).getTime() - new Date(a.project.updated_at).getTime()
    })
    .slice(0, 4)
  const decision = summary.caseConversionWeak > 0 && casePathMetric.views > 0
    ? `先把 ${formatNumber(summary.caseConversionWeak)} 个发布转化弱案例切回内容补位，再回 B307 复盘访问、动作、线索和跟进质量。`
    : summary.caseConversionWeak > 0
      ? `当前有 ${formatNumber(summary.caseConversionWeak)} 个发布转化弱案例，先从素材、叙事、项目事实和标签四类缺口补位。`
      : casePathMetric.leads > 0
        ? '案例来源已有线索且发布内容暂无内容型弱项，可从成交和跟进质量反推高价值案例。'
        : '当前没有发布转化弱项，保持 B300 到 B307 的复盘入口可下钻，等待更多访问和线索样本。'
  const reviewItems: CaseInquiryQueueItem[] = [
    {
      label: 'B307 转化复盘',
      value: formatAnalyticsPercent(casePathMetric.conversionRate),
      detail: `回到案例跟进质量到转化复盘桥，复看访问 ${formatNumber(casePathMetric.views)}、动作 ${formatNumber(pathActions)}、线索 ${formatNumber(casePathMetric.leads)}。`,
      href: '/admin/site/conversion#case-followup-conversion-review-bridge',
      cta: '回转化复盘',
      Icon: BarChart3,
      tone: casePathMetric.views > 0 ? 'blue' : 'gray',
    },
    {
      label: 'B306 跟进分诊',
      value: 'source_type=case',
      detail: '查看案例来源线索的跟进优先级，确认活跃线索是否需要先处理。',
      href: '/admin/status/leads#case-lead-quality-followup-desk',
      cta: '看跟进分诊',
      Icon: ListChecks,
      tone: casePathMetric.leads > 0 ? 'blue' : 'gray',
    },
    {
      label: 'B305 路径回流',
      value: formatNumber(pathActions),
      detail: `路径动作 ${formatNumber(pathActions)}，其中表单 ${formatNumber(casePathMetric.formSubmits)}；回看访问到线索回流缺口。`,
      href: '/admin/status/traffic#case-path-lead-backflow-desk',
      cta: '看路径回流',
      Icon: ExternalLink,
      tone: pathActions > 0 ? 'orange' : casePathMetric.views > 0 ? 'blue' : 'gray',
    },
    {
      label: 'B304 线索回流',
      value: formatNumber(casePathMetric.leads),
      detail: '进入案例来源线索队列，核对内容缺口是否需要反向补到案例列表。',
      href: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk',
      cta: '看案例线索',
      Icon: CheckCircle2,
      tone: casePathMetric.leads > 0 ? 'green' : pathActions > 0 ? 'orange' : 'gray',
    },
    {
      label: 'B303 案例总控',
      value: formatNumber(summary.caseConversionWeak),
      detail: `发布转化弱 ${formatNumber(summary.caseConversionWeak)}，可承接案例 ${formatNumber(readyPublishedTotal)}。`,
      href: '/admin/content/projects#case-content-inquiry-command-center',
      cta: '回案例总控',
      Icon: MapPinned,
      tone: summary.caseConversionWeak > 0 ? 'orange' : 'green',
    },
    {
      label: 'B300 弱项队列',
      value: formatNumber(pageWeakEntries.length),
      detail: `当前页发布 ${formatNumber(pagePublishedCount)}，转化弱 ${formatNumber(pageWeakEntries.length)}，可承接 ${formatNumber(pageReadyCount)}，草稿 ${formatNumber(pageDraftCount)}。`,
      href: createHref(filters, { status: '', view: 'case-conversion-weak' }),
      cta: '筛选弱项',
      Icon: SearchCheck,
      tone: summary.caseConversionWeak > 0 ? 'orange' : 'green',
    },
  ]
  const actionItems: CaseInquiryQueueItem[] = [
    {
      label: '素材补位',
      value: formatNumber(issueSummary.media),
      detail: '封面或图库缺口会先影响案例信任感，优先从发布转化弱视图进入编辑。',
      href: createHref(filters, { status: '', view: 'case-conversion-weak' }),
      cta: '处理素材',
      Icon: ImageIcon,
      tone: issueSummary.media > 0 ? 'orange' : 'green',
    },
    {
      label: '叙事补位',
      value: formatNumber(issueSummary.story),
      detail: '中英文简介缺失或详情偏短时，客户难判断项目背景和落地价值。',
      href: createHref(filters, { status: '', view: 'case-conversion-weak' }),
      cta: '处理叙事',
      Icon: FileText,
      tone: issueSummary.story > 0 ? 'orange' : 'green',
    },
    {
      label: '事实补位',
      value: formatNumber(issueSummary.facts),
      detail: '项目类型、面积、舱数或产品型号缺失时，询盘上下文会变弱。',
      href: createHref(filters, { status: '', view: 'case-conversion-weak' }),
      cta: '处理事实',
      Icon: Package,
      tone: issueSummary.facts > 0 ? 'orange' : 'green',
    },
    {
      label: '标签补位',
      value: formatNumber(issueSummary.tags),
      detail: '中英文标签缺口会削弱后台筛选、案例归因和后续内容运营。',
      href: createHref(filters, { status: '', view: 'case-conversion-weak' }),
      cta: '处理标签',
      Icon: Tags,
      tone: issueSummary.tags > 0 ? 'orange' : 'green',
    },
  ]

  return (
    <section id="case-conversion-content-backfill-desk" className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 border-l-4 border-[#E36F2C] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E36F2C]">B308 Content Backfill Desk</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例转化复盘到内容补位执行队列</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把 B307 转化复盘、B306 跟进分诊、B305 路径回流、B304 线索回流、B303 案例总控和 B300 弱案例队列收回到内容补位执行层；本区只读聚合和下钻，不保存、不发布、不改线索状态。
          </p>
        </div>
        <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] p-4 xl:border-l xl:border-t-0">
          <p className="text-xs font-bold text-[#61767D]">执行判断</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#1E2C31]">{decision}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <CaseSourceSnapshot label="内容缺口" value={formatNumber(contentGapTotal)} detail="素材 / 叙事 / 事实 / 标签" />
            <CaseSourceSnapshot label="路径动作" value={formatNumber(pathActions)} detail={`线索 ${formatNumber(casePathMetric.leads)}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-3">
        {reviewItems.map((item) => (
          <CaseInquiryQueueLink key={item.label} item={item} compact />
        ))}
      </div>

      <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-4 py-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Backfill Actions</p>
            <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">内容补位四类执行口径</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">优先处理会影响案例询盘判断的信息缺口；所有入口只跳转到现有筛选或编辑页。</p>
          </div>
          <Link
            href={createHref(filters, { status: '', view: 'case-conversion-weak' })}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-bold text-[#E36F2C] transition hover:border-[#E36F2C]/60 hover:bg-[#FFF2E7]"
          >
            打开转化弱队列
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-4">
        {actionItems.map((item) => (
          <CaseInquiryQueueLink key={item.label} item={item} compact />
        ))}
      </div>

      <div className="border-t border-[#E6EEEE]">
        <div className="flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1E2C31]">本页内容补位优先样本</h3>
            <p className="mt-1 text-xs text-[#61767D]">只展示当前页已发布且命中转化弱规则的案例；点击进入现有编辑页。</p>
          </div>
          <span className="inline-flex w-fit rounded-md bg-[#FFF2E7] px-2.5 py-1 text-xs font-bold text-[#E36F2C]">
            本页 {formatNumber(priorityItems.length)} 个优先项
          </span>
        </div>

        {priorityItems.length > 0 ? (
          <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {priorityItems.map((item) => (
              <Link
                key={item.project.id}
                href={`/admin/content/projects/${item.project.id}/edit#case-edit-inquiry-conversion-review-desk`}
                className="group min-h-[150px] px-4 py-4 transition hover:bg-[#F7FAFA]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#1E2C31]">{item.project.name_zh || item.project.name_en || item.project.id}</span>
                    <span className="mt-1 block truncate text-xs text-[#61767D]">{item.project.country || '未标记国家'} · {item.project.location_zh || item.project.location_en || '未标记位置'}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-[#FFF2E7] px-2 py-1 text-xs font-bold text-[#E36F2C]">{item.label}</span>
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {item.issues.slice(0, 3).map((issue) => (
                    <span key={issue} className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600">
                      {issue}
                    </span>
                  ))}
                  {item.issues.length > 3 ? (
                    <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-500">
                      +{item.issues.length - 3}
                    </span>
                  ) : null}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6]">
                  进入编辑复核
                  <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={28} />
            <p className="mt-3 text-sm font-bold text-[#1E2C31]">当前页没有发布转化弱案例</p>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">可切到“发布转化弱”视图或回到 B307 查看转化复盘。</p>
          </div>
        )}
      </div>
    </section>
  )
}

function CaseInquiryQueueLink({ item, compact = false }: { item: CaseInquiryQueueItem; compact?: boolean }) {
  const Icon = item.Icon

  return (
    <Link
      href={item.href}
      className={`group border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:border-r xl:border-b-0 last:border-r-0 ${
        compact ? 'min-h-[128px]' : 'min-h-[164px]'
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#1E2C31]">{item.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${caseInquiryQueueToneClass(item.tone)}`}>
            <span className="truncate">{item.value}</span>
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6]">
        {item.cta}
        <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function ProjectOperationsMatrix({
  summary,
  issueSummary,
  rows,
  filters,
  casePathMetric,
}: {
  summary: ProjectSummary
  issueSummary: ProjectIssueSummary
  rows: ProjectListRow[]
  filters: FilterState
  casePathMetric: AnalyticsConversionMetric
}) {
  const pageIssueEntries = rows.map((project) => ({
    project,
    issues: getProjectIssues(project),
  }))
  const signalStats = PROJECT_SIGNAL_BUCKETS.map((bucket) => {
    const pageCount = pageIssueEntries.filter((entry) => bucket.matches(entry.project, entry.issues)).length
    return {
      ...bucket,
      count: issueSummary[bucket.summaryKey],
      pageCount,
      href: bucket.href(filters),
    }
  })
  const priorityItems = buildProjectPriorityItems(rows)
  const publishedRate = formatPercent(summary.published, summary.total)
  const incompleteRate = formatPercent(summary.incomplete, summary.total)
  const mapReadyRate = formatPercent(summary.mapReady, summary.total)
  const pageReadyCount = pageIssueEntries.filter((entry) => entry.issues.length === 0).length
  const pagePublishedRiskCount = pageIssueEntries.filter((entry) => entry.project.status === 'published' && entry.issues.length > 0).length
  const pageCaseInquiryReadyCount = pageIssueEntries.filter((entry) => isCaseConversionReady(entry.project, entry.issues)).length
  const pagePublishedConversionRiskCount = pageIssueEntries.filter((entry) => (
    entry.project.status === 'published' && hasCaseConversionContentRisk(entry.issues)
  )).length
  const pageMapReadyCount = pageIssueEntries.filter((entry) => entry.project.status === 'published' && hasCoordinates(entry.project)).length
  const pageCoordinatePendingCount = pageIssueEntries.filter((entry) => entry.project.status !== 'published' && hasCoordinates(entry.project)).length
  const casePathTone = casePathMetric.leads > 0 ? 'green' : casePathMetric.views > 0 ? 'orange' : 'gray'

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">案例运营</p>
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
                  <span className="mt-1 block text-[11px] leading-5 text-[#8A9EA4]">本页命中 {formatNumber(bucket.pageCount)}</span>
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
        <div className="grid grid-cols-2 border-b border-[#E6EEEE] bg-[#FBFDFD]">
          <ProjectReadinessMiniStat
            label="本页完整"
            value={formatNumber(pageReadyCount)}
            detail={`${formatPercent(pageReadyCount, rows.length)} 完整率`}
            tone="green"
          />
          <ProjectReadinessMiniStat
            label="发布中有缺口"
            value={formatNumber(pagePublishedRiskCount)}
            detail="已发布但仍需回补"
            tone={pagePublishedRiskCount > 0 ? 'orange' : 'green'}
          />
          <ProjectReadinessMiniStat
            label="询盘可承接"
            value={formatNumber(pageCaseInquiryReadyCount)}
            detail="已发布且内容可支撑咨询"
            tone={pageCaseInquiryReadyCount > 0 ? 'green' : 'gray'}
          />
          <ProjectReadinessMiniStat
            label="发布转化弱"
            value={formatNumber(pagePublishedConversionRiskCount)}
            detail="素材、叙事或事实待补"
            tone={pagePublishedConversionRiskCount > 0 ? 'orange' : 'green'}
          />
          <ProjectReadinessMiniStat
            label="可入 Global"
            value={formatNumber(pageMapReadyCount)}
            detail="已发布且有坐标"
            tone={pageMapReadyCount > 0 ? 'blue' : 'gray'}
          />
          <ProjectReadinessMiniStat
            label="坐标待发布"
            value={formatNumber(pageCoordinatePendingCount)}
            detail="已有坐标但仍是草稿"
            tone={pageCoordinatePendingCount > 0 ? 'orange' : 'green'}
          />
        </div>
        <div className="border-b border-[#E6EEEE] px-4 py-4">
          <Link
            href="/admin/status/traffic#case-inquiry-path"
            className="group block rounded-md border border-[#D8E7E8] bg-[#FBFDFD] p-3 transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#1E2C31]">案例路径样本</span>
                <span className="mt-1 block text-xs leading-5 text-[#61767D]">
                  30 天访问 {formatNumber(casePathMetric.views)}，动作 {formatNumber(casePathMetric.ctaClicks)}，线索 {formatNumber(casePathMetric.leads)}
                </span>
              </span>
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                casePathTone === 'green'
                  ? 'bg-emerald-50 text-emerald-700'
                  : casePathTone === 'orange'
                    ? 'bg-[#FFF2E7] text-[#E36F2C]'
                    : 'bg-[#F0F7F8] text-[#61767D]'
              }`}>
                {formatAnalyticsPercent(casePathMetric.conversionRate)}
              </span>
            </span>
            <span className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex min-h-7 items-center rounded-md border border-[#D8E7E8] bg-white px-2 text-[11px] font-semibold text-[#61767D]">
                表单 {formatNumber(casePathMetric.formSubmits)}
              </span>
              <span className="inline-flex min-h-7 items-center rounded-md border border-[#D8E7E8] bg-white px-2 text-[11px] font-semibold text-[#61767D]">
                转化 {formatAnalyticsPercent(casePathMetric.conversionRate)}
              </span>
              <span className="inline-flex min-h-7 items-center gap-1 rounded-md border border-[#D8E7E8] bg-white px-2 text-[11px] font-semibold text-[#1889B6] transition group-hover:border-[#1889B6]">
                看路径分析
                <ArrowRight size={12} />
              </span>
            </span>
          </Link>
          <Link
            href={createHref(filters, { status: '', view: 'case-conversion-weak' })}
            className="mt-2 inline-flex min-h-8 w-full items-center justify-between gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
          >
            <span>处理发布转化弱</span>
            <span className="rounded bg-[#FFF2E7] px-1.5 py-0.5 text-[11px] text-[#E36F2C]">{formatNumber(summary.caseConversionWeak)}</span>
          </Link>
        </div>
        {priorityItems.length > 0 ? (
          <div className="divide-y divide-[#E6EEEE]">
            {priorityItems.map((item) => (
              <Link
                key={item.project.id}
                href={item.action.href}
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
                <span className="mt-2 block text-xs font-semibold text-[#1889B6]">{item.action.detail}</span>
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

function ProjectReadinessMiniStat({
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
    <div className="border-t border-[#E6EEEE] px-4 py-3 odd:border-r">
      <p className="truncate text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8A9EA4]">{detail}</p>
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
    <div id="project-publish-review" className="flex scroll-mt-24 flex-wrap gap-2">
      <AdminActionLink href="/admin/content/projects/new" Icon={Plus} label="新增项目" primary />
      <AdminActionLink href="/admin/content/projects/list?status=draft" Icon={FileText} label="查看草稿" />
      <AdminActionLink href="/admin/content/projects/list?status=published" Icon={CheckCircle2} label="查看已发布" />
      <AdminActionLink href="/admin/content/projects/list?status=draft#project-publish-review" Icon={ListChecks} label="发布复核" />
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
          <table className="min-w-[1340px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#F7FAFA] text-xs font-semibold text-[#61767D]">
              <tr>
                <th className="w-[28%] border-b border-[#D8E7E8] px-4 py-3">项目案例</th>
                <th className="w-[10%] border-b border-[#D8E7E8] px-4 py-3">状态</th>
                <th className="w-[16%] border-b border-[#D8E7E8] px-4 py-3">位置与类型</th>
                <th className="w-[15%] border-b border-[#D8E7E8] px-4 py-3">待补项</th>
                <th className="w-[13%] border-b border-[#D8E7E8] px-4 py-3">转化承接</th>
                <th className="w-[9%] border-b border-[#D8E7E8] px-4 py-3">Global</th>
                <th className="w-[8%] border-b border-[#D8E7E8] px-4 py-3">更新时间</th>
                <th className="w-[10%] border-b border-[#D8E7E8] px-4 py-3 text-right">操作</th>
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
  const conversionStatus = getCaseConversionReadiness(project, issues)
  const nextAction = getProjectRowNextAction(project, issues)
  const imageCount = Array.isArray(project.images) ? project.images.length : 0
  const detailHref = `/cases/${project.id}`
  const caseInquiryHref = `${detailHref}#case-inquiry`

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
        <div className="space-y-2">
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
          <Link
            href={nextAction.href}
            target={nextAction.external ? '_blank' : undefined}
            rel={nextAction.external ? 'noopener noreferrer' : undefined}
            className={`inline-flex min-h-8 w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${projectRowNextActionClass(nextAction.tone)}`}
          >
            <span className="min-w-0">
              <span className="block truncate">{nextAction.label}</span>
              <span className="mt-0.5 block truncate text-[11px] font-medium opacity-75">{nextAction.detail}</span>
            </span>
            <ArrowRight size={13} className="shrink-0" />
          </Link>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-2">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${conversionStatus.className}`}>
            {conversionStatus.label}
          </span>
          <span className="text-[11px] leading-5 text-[#8A9EA4]">{conversionStatus.detail}</span>
          {published ? (
            <Link
              href={caseInquiryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] hover:text-[#0F6F95]"
            >
              案例咨询
              <ExternalLink size={12} />
            </Link>
          ) : (
            <span className="text-[11px] font-semibold text-[#9AA9AD]">待发布</span>
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
  const [summary, issueSummary, list, pathAnalytics] = await Promise.all([
    safeLoad('project summary', getProjectSummary, EMPTY_SUMMARY),
    safeLoad('project issue summary', getProjectIssueSummary, EMPTY_ISSUE_SUMMARY),
    safeLoad('project list', () => getProjects(filters), { rows: [], total: 0 }),
    safeLoad<Record<string, AnalyticsConversionMetric>>('case path analytics', () => loadConversionPathAnalytics(30), {}),
  ])
  const adminRole: AdminRole = role
  const casePathMetric = pathAnalytics.cases ?? EMPTY_CASE_PATH_METRIC

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
        <ProjectListControlStrip
          filters={filters}
          summary={summary}
          casePathMetric={casePathMetric}
          total={list.total}
          rowsCount={list.rows.length}
        />
        <CaseSourceContractPanel
          filters={filters}
          summary={summary}
          casePathMetric={casePathMetric}
        />
        <CaseListInquiryConversionQueue
          filters={filters}
          summary={summary}
          issueSummary={issueSummary}
          rows={list.rows}
          casePathMetric={casePathMetric}
        />
        <CaseConversionContentBackfillDesk
          filters={filters}
          summary={summary}
          issueSummary={issueSummary}
          rows={list.rows}
          casePathMetric={casePathMetric}
        />
        <ProjectOperationsMatrix
          summary={summary}
          issueSummary={issueSummary}
          rows={list.rows}
          filters={filters}
          casePathMetric={casePathMetric}
        />
        <FilterPanel filters={filters} />
        <ProjectList rows={list.rows} total={list.total} filters={filters} />
      </div>
    </AdminSectionShell>
  )
}
