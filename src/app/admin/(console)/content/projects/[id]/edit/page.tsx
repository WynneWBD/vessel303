import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminActionLink, AdminPageHero } from '@/components/admin/AdminUI'
import ProjectForm from '@/components/admin/ProjectForm'
import { pool } from '@/lib/db'
import type { ProjectCaseRow, ProjectCaseStatus } from '@/lib/project-cases-db'
import {
  AlertTriangle,
  ArrowLeft,
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
      <EditSectionGrid />
      <GlobalStatusPanel project={project} />
      <RiskNotice project={project} />
      <section id="project-form" className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
        <ProjectForm mode="edit" project={project} />
      </section>
    </AdminSectionShell>
  )
}
