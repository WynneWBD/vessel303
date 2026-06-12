import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminActionLink, AdminPageHero } from '@/components/admin/AdminUI'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import ProjectForm from '@/components/admin/ProjectForm'
import { pool } from '@/lib/db'
import { MIN_PROJECT_CASE_DESCRIPTION_CHARS } from '@/lib/project-case-readiness'
import type { ProjectCaseRow, ProjectCaseStatus } from '@/lib/project-cases-db'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  Layers3,
  ListChecks,
  MapPinned,
  Pencil,
  SearchCheck,
  Settings2,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '编辑项目案例 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type PageProps = {
  params: Promise<{ id: string }>
}

type ProjectDbRow = {
  id: string
  name_zh: string
  name_en: string
  location_zh: string
  location_en: string
  project_type_zh: string
  project_type_en: string
  area_display: string
  investment_display: string
  units_display: string
  products: string
  description_zh: string
  description_en: string
  tags_zh: ProjectCaseRow['tags_zh'] | null
  tags_en: ProjectCaseRow['tags_en'] | null
  cover_image_url: string | null
  images: ProjectCaseRow['images'] | null
  country: string
  latitude: string | number | null
  longitude: string | number | null
  global_open_date: string | null
  global_units: string | number | null
  global_unit_area: string | number | null
  global_guests: string | null
  global_booking_url: string | null
  global_amenities: ProjectCaseRow['global_amenities'] | null
  global_transport_zh: ProjectCaseRow['global_transport_zh'] | null
  global_transport_en: ProjectCaseRow['global_transport_en'] | null
  global_nearby_zh: ProjectCaseRow['global_nearby_zh'] | null
  global_nearby_en: ProjectCaseRow['global_nearby_en'] | null
  status: ProjectCaseStatus
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type EditSection = {
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}

type ProjectEditorReadinessGroupKey = 'media' | 'story' | 'facts' | 'publish' | 'global'

type ProjectEditorReadinessSeverity = 'high' | 'medium' | 'status' | 'global'

type ProjectEditorReadinessIssue = {
  key: string
  group: ProjectEditorReadinessGroupKey
  label: string
  detail: string
  href: string
  severity: ProjectEditorReadinessSeverity
}

type ProjectEditorReadinessGroup = {
  key: ProjectEditorReadinessGroupKey
  title: string
  detail: string
  href: string
  Icon: LucideIcon
  issueCount: number
  done: boolean
}

type ProjectEditorReadiness = {
  issues: ProjectEditorReadinessIssue[]
  groups: ProjectEditorReadinessGroup[]
  contentIssueCount: number
  globalIssueCount: number
  completedGroups: number
  completionPercent: number
  nextIssue: ProjectEditorReadinessIssue | null
}

const EDIT_SECTIONS: EditSection[] = [
  {
    key: 'basic',
    title: '基础信息',
    detail: '名称、地点、类型、排序',
    href: '#basic',
    Icon: Pencil,
  },
  {
    key: 'media',
    title: '图片素材',
    detail: '封面图、图库、图片 URL',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'content',
    title: '案例内容',
    detail: '简介、标签、相关产品',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'params',
    title: '项目参数',
    detail: '面积、投资、数量、产品型号',
    href: '#params',
    Icon: Settings2,
  },
  {
    key: 'global-info',
    title: 'Global 入图信息',
    detail: '国家、坐标、地图展示资料',
    href: '#global',
    Icon: MapPinned,
  },
  {
    key: 'publish-check',
    title: '发布检查',
    detail: '状态、完整度、展示影响',
    href: '#publish-check',
    Icon: SearchCheck,
  },
]

const READINESS_GROUPS: Omit<ProjectEditorReadinessGroup, 'issueCount' | 'done'>[] = [
  {
    key: 'media',
    title: '展示素材',
    detail: '封面图和案例图库',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'story',
    title: '双语叙事',
    detail: '中英文简介和标签',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'facts',
    title: '项目事实',
    detail: '类型、面积、舱数、产品引用',
    href: '#params',
    Icon: Settings2,
  },
  {
    key: 'publish',
    title: '发布状态',
    detail: '公开展示和预览路径',
    href: '#publish-check',
    Icon: SearchCheck,
  },
  {
    key: 'global',
    title: 'Global 入图',
    detail: '坐标有效性和入图状态',
    href: '#global',
    Icon: MapPinned,
  },
]

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

function rowToProject(row: ProjectDbRow): ProjectCaseRow {
  return {
    id: row.id,
    name_zh: row.name_zh,
    name_en: row.name_en,
    location_zh: row.location_zh,
    location_en: row.location_en,
    project_type_zh: row.project_type_zh,
    project_type_en: row.project_type_en,
    area_display: row.area_display,
    investment_display: row.investment_display,
    units_display: row.units_display,
    products: row.products,
    description_zh: row.description_zh,
    description_en: row.description_en,
    tags_zh: row.tags_zh ?? [],
    tags_en: row.tags_en ?? [],
    cover_image_url: row.cover_image_url,
    images: row.images ?? [],
    country: row.country,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    global_open_date: row.global_open_date ?? '',
    global_units: row.global_units == null ? null : Number(row.global_units),
    global_unit_area: row.global_unit_area == null ? null : Number(row.global_unit_area),
    global_guests: row.global_guests ?? '',
    global_booking_url: row.global_booking_url ?? '',
    global_amenities: row.global_amenities ?? [],
    global_transport_zh: row.global_transport_zh ?? [],
    global_transport_en: row.global_transport_en ?? [],
    global_nearby_zh: row.global_nearby_zh ?? [],
    global_nearby_en: row.global_nearby_en ?? [],
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

async function getProjectReadOnly(id: string): Promise<ProjectCaseRow | null> {
  if (!(await tableExists('public.project_cases'))) return null

  const res = await pool.query<ProjectDbRow>(
    `SELECT
       id,
       name_zh,
       name_en,
       location_zh,
       location_en,
       project_type_zh,
       project_type_en,
       area_display,
       investment_display,
       units_display,
       products,
       description_zh,
       description_en,
       COALESCE(tags_zh, '[]'::jsonb) AS tags_zh,
       COALESCE(tags_en, '[]'::jsonb) AS tags_en,
       cover_image_url,
       COALESCE(images, '[]'::jsonb) AS images,
       country,
       latitude,
       longitude,
       global_open_date,
       global_units,
       global_unit_area,
       global_guests,
       global_booking_url,
       COALESCE(global_amenities, '[]'::jsonb) AS global_amenities,
       COALESCE(global_transport_zh, '[]'::jsonb) AS global_transport_zh,
       COALESCE(global_transport_en, '[]'::jsonb) AS global_transport_en,
       COALESCE(global_nearby_zh, '[]'::jsonb) AS global_nearby_zh,
       COALESCE(global_nearby_en, '[]'::jsonb) AS global_nearby_en,
       status,
       sort_order,
       created_at::text AS created_at,
       updated_at::text AS updated_at,
       deleted_at::text AS deleted_at
     FROM project_cases
     WHERE id = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  )

  const row = res.rows[0]
  return row ? rowToProject(row) : null
}

function getSideNavGroups(project: ProjectCaseRow): AdminSideNavGroup[] {
  return [
    {
      title: '内容管理',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'project-list', label: '项目列表', href: '/admin/content/projects/list', Icon: ListChecks },
        { key: 'project-edit', label: '编辑当前项目', href: `/admin/content/projects/${project.id}/edit`, Icon: Pencil },
      ],
    },
    {
      title: '编辑分区',
      items: EDIT_SECTIONS.map((section) => ({
        key: section.key,
        label: section.title,
        href: section.href,
        Icon: section.Icon,
      })),
    },
    {
      title: '后续规划',
      items: [
        { key: 'project-new', label: '新增项目', href: '/admin/content/projects/new', Icon: FileText },
        { key: 'form-sections', label: '表单分区优化', planned: true, Icon: SearchCheck },
        { key: 'case-detail', label: '查看案例详情页', href: `/cases/${project.id}`, Icon: ExternalLink },
      ],
    },
  ]
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function textLength(value: string | null | undefined): number {
  return value?.trim().replace(/\s+/g, ' ').length ?? 0
}

function hasCompleteCoordinates(project: ProjectCaseRow): boolean {
  return project.latitude != null && project.longitude != null
}

function coordinatesValid(project: ProjectCaseRow): boolean {
  return (
    hasCompleteCoordinates(project) &&
    Number.isFinite(project.latitude) &&
    Number.isFinite(project.longitude) &&
    project.latitude != null &&
    project.latitude >= -90 &&
    project.latitude <= 90 &&
    project.longitude != null &&
    project.longitude >= -180 &&
    project.longitude <= 180
  )
}

function getGlobalStatus(project: ProjectCaseRow): {
  label: string
  detail: string
  tone: 'ready' | 'draft' | 'warning' | 'neutral'
  href?: string
} {
  const validCoords = coordinatesValid(project)

  if (project.status === 'published' && validCoords) {
    return {
      label: '可在 Global 展示',
      detail: '项目已发布且坐标有效，可作为地图点位展示。',
      tone: 'ready',
      href: `/global?camp=${project.id}`,
    }
  }

  if (project.status !== 'published' && validCoords) {
    return {
      label: '发布后可入图',
      detail: '坐标已填写，但草稿不会进入公开地图展示。',
      tone: 'draft',
    }
  }

  if (hasCompleteCoordinates(project)) {
    return {
      label: '坐标需检查',
      detail: '经纬度需要在有效范围内，才能用于地图点位。',
      tone: 'warning',
    }
  }

  return {
    label: '暂不能入图',
    detail: '缺少坐标，不影响正式案例内容维护，只影响 Global 地图点位。',
    tone: 'neutral',
  }
}

function buildProjectEditorReadiness(project: ProjectCaseRow): ProjectEditorReadiness {
  const issues: ProjectEditorReadinessIssue[] = []
  const imageCount = project.images?.length ?? 0
  const validCoords = coordinatesValid(project)

  const addIssue = (issue: ProjectEditorReadinessIssue) => {
    issues.push(issue)
  }

  if (!hasText(project.cover_image_url)) {
    addIssue({
      key: 'cover',
      group: 'media',
      label: '补封面图',
      detail: '封面图影响案例列表和详情页首屏，是公开展示的第一优先级。',
      href: '#media',
      severity: 'high',
    })
  }

  if (imageCount === 0) {
    addIssue({
      key: 'gallery',
      group: 'media',
      label: '补案例图库',
      detail: '图库为空会削弱项目证明力，优先补现场、外观、室内和交付图。',
      href: '#media',
      severity: 'high',
    })
  }

  if (!hasText(project.description_zh)) {
    addIssue({
      key: 'description-zh',
      group: 'story',
      label: '补中文简介',
      detail: '中文简介用于后台核对和中文默认展示，建议和英文叙事保持同一口径。',
      href: '#content',
      severity: 'medium',
    })
  }

  if (!hasText(project.description_en)) {
    addIssue({
      key: 'description-en',
      group: 'story',
      label: '补英文简介',
      detail: '英文简介面向海外客户，正式发布前应优先补齐。',
      href: '#content',
      severity: 'high',
    })
  }

  if (
    hasText(project.description_zh) &&
    hasText(project.description_en) &&
    (
      textLength(project.description_zh) < MIN_PROJECT_CASE_DESCRIPTION_CHARS ||
      textLength(project.description_en) < MIN_PROJECT_CASE_DESCRIPTION_CHARS
    )
  ) {
    addIssue({
      key: 'story-depth',
      group: 'story',
      label: '延展案例叙事',
      detail: `当前简介低于 ${MIN_PROJECT_CASE_DESCRIPTION_CHARS} 字的案例叙事阈值，建议补项目背景、交付过程和证明材料。`,
      href: '#content',
      severity: 'medium',
    })
  }

  if ((project.tags_zh?.length ?? 0) === 0 || (project.tags_en?.length ?? 0) === 0) {
    addIssue({
      key: 'tags',
      group: 'story',
      label: '补中英文标签',
      detail: '标签影响案例列表扫描、后台筛选和后续内容归档。',
      href: '#content',
      severity: 'medium',
    })
  }

  if (!hasText(project.project_type_zh) || !hasText(project.project_type_en)) {
    addIssue({
      key: 'project-type',
      group: 'facts',
      label: '补项目类型',
      detail: '项目类型缺失会影响案例归类、客户识别和后台治理。',
      href: '#basic',
      severity: 'high',
    })
  }

  if (!hasText(project.area_display)) {
    addIssue({
      key: 'area',
      group: 'facts',
      label: '补项目面积',
      detail: '面积用于表达项目规模，建议发布前补齐可确认口径。',
      href: '#params',
      severity: 'medium',
    })
  }

  if (!hasText(project.units_display)) {
    addIssue({
      key: 'units',
      group: 'facts',
      label: '补舱数',
      detail: '舱数用于表达交付规模和项目密度，建议补齐。',
      href: '#params',
      severity: 'medium',
    })
  }

  if (!hasText(project.products)) {
    addIssue({
      key: 'products',
      group: 'facts',
      label: '补产品型号',
      detail: '产品型号连接案例和产品中心，缺失会削弱转化路径。',
      href: '#params',
      severity: 'high',
    })
  }

  if (!hasText(project.investment_display)) {
    addIssue({
      key: 'investment',
      group: 'facts',
      label: '补投资口径',
      detail: '投资或预算口径不是硬性发布条件，但能帮助销售快速判断案例量级。',
      href: '#params',
      severity: 'medium',
    })
  }

  if (project.status !== 'published') {
    addIssue({
      key: 'status',
      group: 'publish',
      label: '确认发布状态',
      detail: '当前仍为草稿，正式案例页和 Global 点位不会公开展示。',
      href: '#publish-check',
      severity: 'status',
    })
  }

  if (!hasCompleteCoordinates(project)) {
    addIssue({
      key: 'coordinates-missing',
      group: 'global',
      label: '补 Global 坐标',
      detail: '坐标只影响 /global 入图，不代表正式案例内容不可维护。',
      href: '#global',
      severity: 'global',
    })
  } else if (!validCoords) {
    addIssue({
      key: 'coordinates-invalid',
      group: 'global',
      label: '检查坐标范围',
      detail: '纬度需在 -90 到 90，经度需在 -180 到 180，超出范围无法入图。',
      href: '#global',
      severity: 'global',
    })
  } else if (project.status !== 'published') {
    addIssue({
      key: 'coordinates-pending',
      group: 'global',
      label: '发布后才能入图',
      detail: '坐标已具备，但草稿不会进入公开 Global 地图点位。',
      href: '#publish-check',
      severity: 'global',
    })
  }

  const groups = READINESS_GROUPS.map((group) => {
    const issueCount = issues.filter((issue) => issue.group === group.key).length
    return {
      ...group,
      issueCount,
      done: issueCount === 0,
    }
  })
  const completedGroups = groups.filter((group) => group.done).length
  const contentIssueCount = issues.filter((issue) => issue.severity !== 'global').length
  const globalIssueCount = issues.filter((issue) => issue.severity === 'global').length

  return {
    issues,
    groups,
    contentIssueCount,
    globalIssueCount,
    completedGroups,
    completionPercent: Math.round((completedGroups / groups.length) * 100),
    nextIssue: issues[0] ?? null,
  }
}

function StatusBadge({ status }: { status: ProjectCaseStatus }) {
  const published = status === 'published'
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ${
        published ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
      }`}
    >
      {published ? '已发布' : '草稿'}
    </span>
  )
}

function Hero({ project }: { project: ProjectCaseRow }) {
  const globalStatus = getGlobalStatus(project)

  return (
    <AdminPageHero
      kicker="项目案例编辑"
      title={project.name_zh || project.name_en || project.id}
      description="本页编辑的是正式项目案例内容。Global 只是地图展示渠道，坐标和地图字段只决定是否能进入地图点位，不等于案例详情页。"
      actions={(
        <>
          <AdminActionLink href="/admin/content/projects/list" Icon={ArrowLeft} label="返回项目列表" />
          <AdminActionLink href="/cases" Icon={ExternalLink} label="查看案例列表" external />
          {globalStatus.href ? (
            <AdminActionLink href={globalStatus.href} Icon={MapPinned} label="查看 Global 展示" external />
          ) : null}
        </>
      )}
    >
      <StatusBadge status={project.status} />
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard title="项目 ID" value={project.id} />
        <InfoCard title="更新时间" value={formatDate(project.updated_at)} />
        <InfoCard title="Global 入图状态" value={globalStatus.label} tone={globalStatus.tone === 'ready' ? 'success' : 'neutral'} />
      </div>
    </AdminPageHero>
  )
}

function InfoCard({
  title,
  value,
  tone = 'neutral',
}: {
  title: string
  value: string
  tone?: 'neutral' | 'success'
}) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className={`mt-2 text-sm font-bold ${tone === 'success' ? 'text-emerald-700' : 'text-[#1E2C31]'}`}>
        {value}
      </p>
    </div>
  )
}

function EditSectionGrid() {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {EDIT_SECTIONS.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          className="flex min-h-20 items-start gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <section.Icon size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#1E2C31]">{section.title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#61767D]">
              {section.detail}。点击可跳到对应编辑区块。
            </span>
          </span>
        </Link>
      ))}
    </section>
  )
}

function GlobalStatusPanel({ project }: { project: ProjectCaseRow }) {
  const globalStatus = getGlobalStatus(project)
  const toneClass =
    globalStatus.tone === 'ready'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : globalStatus.tone === 'warning'
        ? 'border-orange-200 bg-orange-50 text-orange-700'
        : globalStatus.tone === 'draft'
          ? 'border-[#D8E7E8] bg-[#EAF4FF] text-[#3078C8]'
          : 'border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]'

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#FFF2E7] text-[#E36F2C]">
            <MapPinned size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#1E2C31]">Global 入图提示</h2>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              {globalStatus.detail} Global 只负责地图可视化展示，正式案例详情页归 /cases/[id]。
            </p>
          </div>
        </div>
        <span className={`inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-semibold ${toneClass}`}>
          {globalStatus.label}
        </span>
      </div>
    </section>
  )
}

function RiskNotice({ project }: { project: ProjectCaseRow }) {
  return (
    <section className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#E36F2C]">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#8A3F16]">保存前请确认影响范围</h2>
          <p className="mt-1 text-xs leading-5 text-[#8A3F16]">
            当前继续复用原项目表单和保存逻辑。{project.status === 'published' ? '这个项目已经发布，保存后会影响公开案例内容；如坐标有效，也会影响 Global 地图展示。' : '草稿项目发布前不会公开展示，也不会进入公开地图点位。'}
            图片上传会立即进入媒体库，选择图片则只回填表单，最终仍要保存项目才生效。
          </p>
        </div>
      </div>
    </section>
  )
}

function readinessIssueClass(severity: ProjectEditorReadinessSeverity) {
  if (severity === 'high') return 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
  if (severity === 'global') return 'border-[#B7DDE4] bg-[#EAF6F8] text-[#1889B6]'
  if (severity === 'status') return 'border-[#D8E7E8] bg-[#F0F2F2] text-[#61767D]'
  return 'border-[#E6EEEE] bg-white text-[#61767D]'
}

function readinessIssueLabel(severity: ProjectEditorReadinessSeverity) {
  if (severity === 'high') return '优先'
  if (severity === 'global') return '入图'
  if (severity === 'status') return '状态'
  return '建议'
}

function ProjectReadinessPanel({ readiness }: { readiness: ProjectEditorReadiness }) {
  const issueCount = readiness.issues.length
  const ready = issueCount === 0

  return (
    <section id="editor-readiness" className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1889B6]">Publish Readiness</p>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">案例发布就绪路线图</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#61767D]">
            先处理公开案例页必需项，再处理 Global 入图提醒。这里是只读运营判断，不改变保存、发布、上传和权限逻辑。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:w-[420px]">
          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
            <span className="block font-semibold text-[#61767D]">正式缺项</span>
            <span className={readiness.contentIssueCount > 0 ? 'mt-1 block text-xl font-bold text-[#E36F2C]' : 'mt-1 block text-xl font-bold text-emerald-700'}>
              {readiness.contentIssueCount}
            </span>
          </div>
          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
            <span className="block font-semibold text-[#61767D]">入图提醒</span>
            <span className={readiness.globalIssueCount > 0 ? 'mt-1 block text-xl font-bold text-[#1889B6]' : 'mt-1 block text-xl font-bold text-emerald-700'}>
              {readiness.globalIssueCount}
            </span>
          </div>
          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
            <span className="block font-semibold text-[#61767D]">完成度</span>
            <span className="mt-1 block text-xl font-bold text-[#1E2C31]">{readiness.completionPercent}%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        {readiness.groups.map((group) => {
          const Icon = group.Icon
          return (
            <Link
              key={group.key}
              href={group.href}
              className={`min-h-36 rounded-md border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                group.done
                  ? 'border-emerald-100 bg-emerald-50/70 hover:border-emerald-200'
                  : 'border-[#F2C6A7] bg-[#FFF7F0] hover:border-[#E36F2C]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={group.done ? 'flex h-9 w-9 items-center justify-center rounded-md bg-white text-emerald-700' : 'flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#E36F2C]'}>
                  <Icon size={17} />
                </span>
                <span className={group.done ? 'text-emerald-700' : 'text-[#E36F2C]'}>
                  {group.done ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-[#1E2C31]">{group.title}</h3>
              <p className="mt-1 min-h-10 text-xs leading-5 text-[#61767D]">{group.detail}</p>
              <div className="mt-3 flex items-center justify-between text-xs font-bold">
                <span className={group.done ? 'text-emerald-700' : 'text-[#E36F2C]'}>
                  {group.done ? '已就绪' : `${group.issueCount} 项待处理`}
                </span>
                <span className="inline-flex items-center gap-1 text-[#1889B6]">
                  定位 <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-md border border-[#D8E7E8]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#1E2C31]">下一步处理队列</h3>
              <p className="mt-1 text-xs text-[#61767D]">按对公开展示和运营效率的影响排序，点击即可跳到表单分区。</p>
            </div>
            <span className={ready ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700' : 'rounded-full bg-[#FFF2E7] px-3 py-1 text-xs font-bold text-[#E36F2C]'}>
              {ready ? '无缺项' : `${issueCount} 项`}
            </span>
          </div>
          {ready ? (
            <div className="px-4 py-5 text-sm font-semibold text-emerald-700">
              当前项目已通过入口级检查，可进入表单内发布前人工复核。
            </div>
          ) : (
            <div className="divide-y divide-[#E6EEEE]">
              {readiness.issues.slice(0, 6).map((issue) => (
                <Link key={issue.key} href={issue.href} className="block bg-white px-4 py-3 transition hover:bg-[#F7FAFA]">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${readinessIssueClass(issue.severity)}`}>
                          {readinessIssueLabel(issue.severity)}
                        </span>
                        <span className="text-sm font-bold text-[#1E2C31]">{issue.label}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#61767D]">{issue.detail}</p>
                    </div>
                    <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-[#1889B6]/30 px-3 text-xs font-bold text-[#1889B6]">
                      处理 <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">发布判断</h3>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            正式案例页优先看素材、双语叙事、项目事实和发布状态；Global 只看地图点位，不反向决定案例详情页是否可维护。
          </p>
          <a
            href={readiness.nextIssue?.href ?? '#project-form'}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1889B6] px-3 text-xs font-bold text-white hover:bg-[#137A9F]"
          >
            {readiness.nextIssue ? `先处理：${readiness.nextIssue.label}` : '进入表单复核'}
            <ArrowRight size={13} />
          </a>
        </aside>
      </div>
    </section>
  )
}

export default async function AdminContentProjectEditPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const { id } = await params
  const project = await getProjectReadOnly(id).catch((err) => {
    console.error('[admin-content-project-edit] load project failed', err)
    return null
  })

  if (!project) notFound()

  const adminRole: AdminRole = role
  const imageCount = project.images?.length ?? 0
  const hasCover = hasText(project.cover_image_url)
  const hasCoreContent = (
    hasText(project.description_zh)
    && hasText(project.description_en)
    && (project.tags_zh?.length ?? 0) > 0
    && (project.tags_en?.length ?? 0) > 0
  )
  const hasProjectParams = (
    hasText(project.area_display)
    && hasText(project.investment_display)
    && hasText(project.units_display)
    && hasText(project.products)
  )
  const validCoordinates = coordinatesValid(project)
  const globalStatus = getGlobalStatus(project)
  const editorReadiness = buildProjectEditorReadiness(project)
  const consoleMetrics: ProductEditorMetric[] = [
    {
      label: '状态',
      value: project.status === 'published' ? '已发布' : '草稿',
      detail: project.status === 'published' ? '保存会影响公开案例页。' : '发布前不会公开展示。',
      tone: project.status === 'published' ? 'warning' : 'ready',
    },
    {
      label: '图片',
      value: `${imageCount}`,
      detail: hasCover ? '已有封面图；数字为案例图库数量。' : '缺封面图；优先补正式案例素材。',
      tone: hasCover && imageCount > 0 ? 'ready' : 'warning',
    },
    {
      label: '内容',
      value: hasCoreContent ? 'OK' : '待补',
      detail: '中英文简介与标签会影响案例列表和详情页质量。',
      tone: hasCoreContent ? 'ready' : 'warning',
    },
    {
      label: 'Global',
      value: validCoordinates ? '坐标有效' : '未入图',
      detail: globalStatus.detail,
      tone: validCoordinates ? 'ready' : 'neutral',
    },
  ]
  const consoleSignals: ProductEditorSignal[] = [
    {
      label: project.status === 'published' ? '保存会更新公开案例' : '当前仍是草稿',
      detail: project.status === 'published'
        ? '公开 /cases/[id] 已展示；如坐标有效，也会影响 /global 地图点位。'
        : '草稿项目保存后不会公开展示，也不会进入公开 Global 点位。',
      tone: project.status === 'published' ? 'warning' : 'ready',
      href: project.status === 'published' ? `/cases/${project.id}` : '#publish-check',
    },
    {
      label: validCoordinates ? 'Global 坐标有效' : hasCompleteCoordinates(project) ? '坐标需检查' : '缺 Global 坐标',
      detail: validCoordinates ? `${project.latitude}, ${project.longitude}` : '坐标只影响 Global 入图，不影响正式案例内容维护。',
      tone: validCoordinates ? 'ready' : 'warning',
      href: '#global',
    },
    {
      label: hasProjectParams ? '项目参数已填写' : '项目参数待补',
      detail: '面积、投资、数量和产品型号帮助运营判断案例是否具备正式展示信息。',
      tone: hasProjectParams ? 'ready' : 'warning',
      href: '#params',
    },
    {
      label: 'Global 不是案例详情页',
      detail: 'Global 只做地图可视化；正式案例叙事和图库仍以 /cases/[id] 为准。',
      tone: 'neutral',
      href: `/cases/${project.id}`,
    },
  ]

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="项目案例编辑"
      description="维护正式项目案例内容，并单独查看 Global 地图入图状态。"
      sideNavGroups={getSideNavGroups(project)}
      activeItem="project-edit"
    >
      <Hero project={project} />
      <ProductEditorConsole
        title="项目案例编辑任务台"
        description="先看案例发布影响、图片与内容完整度、项目参数和 Global 入图信号，再进入长表单编辑。"
        sections={EDIT_SECTIONS}
        metrics={consoleMetrics}
        signals={consoleSignals}
      />
      <EditSectionGrid />
      <ProjectReadinessPanel readiness={editorReadiness} />
      <GlobalStatusPanel project={project} />
      <RiskNotice project={project} />
      <section id="project-form" className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
        <ProjectForm mode="edit" project={project} />
      </section>
    </AdminSectionShell>
  )
}
