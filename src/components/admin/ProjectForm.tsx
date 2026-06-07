'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  MapPinned,
  Save,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import CoverImagePicker from '@/components/admin/CoverImagePicker'
import ProductGalleryPicker from '@/components/admin/ProductGalleryPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectCaseRow, ProjectCaseStatus } from '@/lib/project-cases-db'
import {
  MAX_PROJECT_CASE_DESCRIPTION_CHARS,
  getProjectCaseReadinessIssues,
  getProjectCaseReadinessLevel,
} from '@/lib/project-case-readiness'
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'

type FormState = {
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
  tags_zh: string
  tags_en: string
  cover_image_url: string
  images: string
  country: string
  latitude: string
  longitude: string
  global_open_date: string
  global_units: string
  global_unit_area: string
  global_guests: string
  global_booking_url: string
  global_amenities: string
  global_transport_zh: string
  global_transport_en: string
  global_nearby_zh: string
  global_nearby_en: string
  status: ProjectCaseStatus
  sort_order: string
}

type ProjectCompletenessLevel = ReturnType<typeof getProjectCaseReadinessLevel>
type ProjectFormSectionProgress = {
  id: string
  title: string
  detail: string
  done: boolean
  issueCount: number
}

const emptyState: FormState = {
  id: '',
  name_zh: '',
  name_en: '',
  location_zh: '',
  location_en: '',
  project_type_zh: '',
  project_type_en: '',
  area_display: '',
  investment_display: '',
  units_display: '',
  products: '',
  description_zh: '',
  description_en: '',
  tags_zh: '',
  tags_en: '',
  cover_image_url: '',
  images: '',
  country: '中国',
  latitude: '',
  longitude: '',
  global_open_date: '',
  global_units: '',
  global_unit_area: '',
  global_guests: '',
  global_booking_url: '',
  global_amenities: '',
  global_transport_zh: '',
  global_transport_en: '',
  global_nearby_zh: '',
  global_nearby_en: '',
  status: 'draft',
  sort_order: '999',
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function splitRows(value: string) {
  return value
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function countMissing(checks: boolean[]) {
  return checks.filter((check) => !check).length
}

function getProjectCompleteness({
  form,
  imageUrls,
  hasLatitude,
  hasLongitude,
  hasCompleteCoordinates,
  coordinatesValid,
}: {
  form: FormState
  imageUrls: string[]
  hasLatitude: boolean
  hasLongitude: boolean
  hasCompleteCoordinates: boolean
  coordinatesValid: boolean
}): {
  level: ProjectCompletenessLevel
  issues: string[]
} {
  const issues = getProjectCaseReadinessIssues({
    ...form,
    images: imageUrls,
    tags_zh: splitLines(form.tags_zh),
    tags_en: splitLines(form.tags_en),
  })

  if (hasLatitude !== hasLongitude) {
    issues.push('坐标需成对')
  } else if (!hasCompleteCoordinates) {
    issues.push('缺坐标')
  } else if (!coordinatesValid) {
    issues.push('坐标需检查')
  } else if (form.status !== 'published') {
    issues.push('有坐标待发布')
  }

  return { level: getProjectCaseReadinessLevel(issues), issues }
}

function completenessBadgeClass(level: ProjectCompletenessLevel) {
  if (level === '完整') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (level === '待补素材') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function buildProjectFormProgress({
  form,
  imageUrls,
  completeness,
  coordinatesValid,
  hasCompleteCoordinates,
}: {
  form: FormState
  imageUrls: string[]
  completeness: ReturnType<typeof getProjectCompleteness>
  coordinatesValid: boolean
  hasCompleteCoordinates: boolean
}): ProjectFormSectionProgress[] {
  return [
    {
      id: 'basic',
      title: '基础信息',
      detail: '名称、地点、类型、维护字段',
      issueCount: countMissing([
        hasText(form.id),
        hasText(form.name_zh),
        hasText(form.name_en),
        hasText(form.location_zh),
        hasText(form.location_en),
        hasText(form.project_type_zh),
        hasText(form.project_type_en),
      ]),
    },
    {
      id: 'media',
      title: '图片素材',
      detail: '封面和案例图库',
      issueCount: countMissing([
        hasText(form.cover_image_url),
        imageUrls.length > 0,
      ]),
    },
    {
      id: 'content',
      title: '案例内容',
      detail: '简介和中英文标签',
      issueCount: countMissing([
        hasText(form.description_zh),
        hasText(form.description_en),
        splitLines(form.tags_zh).length > 0,
        splitLines(form.tags_en).length > 0,
      ]),
    },
    {
      id: 'params',
      title: '项目参数',
      detail: '面积、投资、舱数、产品型号',
      issueCount: countMissing([
        hasText(form.area_display),
        hasText(form.investment_display),
        hasText(form.units_display),
        hasText(form.products),
      ]),
    },
    {
      id: 'global',
      title: 'Global 入图信息',
      detail: '国家、坐标和地图资料',
      issueCount: countMissing([
        hasText(form.country),
        hasCompleteCoordinates,
        coordinatesValid,
      ]),
    },
    {
      id: 'publish-check',
      title: '发布检查',
      detail: '状态、完整度和展示影响',
      issueCount: completeness.issues.length,
    },
  ].map((section) => ({
    ...section,
    done: section.issueCount === 0,
  }))
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : NaN
}

function parseAmenityRows(value: string) {
  return splitRows(value).map((line) => {
    const parts = line.split('|').map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 3) {
      return {
        icon: parts[0],
        label: { zh: parts[1], en: parts.slice(2).join(' | ') },
      }
    }
    if (parts.length === 2) {
      return {
        icon: '•',
        label: { zh: parts[0], en: parts[1] },
      }
    }
    return {
      icon: '•',
      label: { zh: line, en: line },
    }
  })
}

function parseTransportRows(value: string) {
  return splitRows(value).map((line) => {
    const parts = line.split('|').map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 2) {
      return { mode: parts[0], text: parts.slice(1).join(' | ') }
    }
    return { mode: '📍', text: line }
  })
}

function parseNearbyRows(value: string) {
  return splitRows(value).map((line) => {
    const parts = line.split('|').map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 2) {
      return { name: parts[0], distance: parts.slice(1).join(' | ') }
    }
    return { name: line, distance: '—' }
  })
}

function formatAmenities(project?: ProjectCaseRow | null) {
  return (project?.global_amenities ?? [])
    .map((item) => `${item.icon} | ${item.label.zh} | ${item.label.en}`)
    .join('\n')
}

function formatTransport(items: ProjectCaseRow['global_transport_zh']) {
  return items.map((item) => `${item.mode} | ${item.text}`).join('\n')
}

function formatNearby(items: ProjectCaseRow['global_nearby_zh']) {
  return items.map((item) => `${item.name} | ${item.distance}`).join('\n')
}

function fromProject(project?: ProjectCaseRow | null): FormState {
  if (!project) return emptyState
  return {
    id: project.id,
    name_zh: project.name_zh,
    name_en: project.name_en,
    location_zh: project.location_zh,
    location_en: project.location_en,
    project_type_zh: project.project_type_zh,
    project_type_en: project.project_type_en,
    area_display: project.area_display,
    investment_display: project.investment_display,
    units_display: project.units_display,
    products: project.products,
    description_zh: project.description_zh,
    description_en: project.description_en,
    tags_zh: project.tags_zh.join('\n'),
    tags_en: project.tags_en.join('\n'),
    cover_image_url: project.cover_image_url ?? '',
    images: project.images.join('\n'),
    country: project.country,
    latitude: project.latitude == null ? '' : String(project.latitude),
    longitude: project.longitude == null ? '' : String(project.longitude),
    global_open_date: project.global_open_date,
    global_units: project.global_units == null ? '' : String(project.global_units),
    global_unit_area: project.global_unit_area == null ? '' : String(project.global_unit_area),
    global_guests: project.global_guests,
    global_booking_url: project.global_booking_url,
    global_amenities: formatAmenities(project),
    global_transport_zh: formatTransport(project.global_transport_zh),
    global_transport_en: formatTransport(project.global_transport_en),
    global_nearby_zh: formatNearby(project.global_nearby_zh),
    global_nearby_en: formatNearby(project.global_nearby_en),
    status: project.status,
    sort_order: String(project.sort_order),
  }
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      {children}
      {hint && <div className="text-[11px] leading-relaxed text-[#8A9EA4]">{hint}</div>}
    </div>
  )
}

function FormSection({
  id,
  title,
  description,
  children,
  tone = 'default',
}: {
  id: string
  title: string
  description: string
  children: ReactNode
  tone?: 'default' | 'global' | 'warning'
}) {
  const toneClass =
    tone === 'global'
      ? 'border-[#D8E7E8] bg-[#F7FAFA]'
    : tone === 'warning'
        ? 'border-[#F2C6A7] bg-[#FFF7F0]'
        : 'border-[#D8E7E8] bg-white'

  return (
    <section id={id} className={`scroll-mt-24 space-y-5 rounded-md border p-4 shadow-sm md:p-5 ${toneClass}`}>
      <div>
        <h2 className="text-sm font-bold text-[#1E2C31]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#61767D]">{description}</p>
      </div>
      {children}
    </section>
  )
}

function ProjectFormSidebar({
  sectionProgress,
  completedSectionCount,
  completeness,
  status,
  hasUnsavedChanges,
  mapReady,
  coordinatesValid,
  hasCompleteCoordinates,
  imageCount,
  previewHref,
  previewLabel,
  showPreviewLink,
  globalHref,
  children,
}: {
  sectionProgress: ProjectFormSectionProgress[]
  completedSectionCount: number
  completeness: ReturnType<typeof getProjectCompleteness>
  status: ProjectCaseStatus
  hasUnsavedChanges: boolean
  mapReady: boolean
  coordinatesValid: boolean
  hasCompleteCoordinates: boolean
  imageCount: number
  previewHref: string
  previewLabel: string
  showPreviewLink: boolean
  globalHref: string | null
  children: ReactNode
}) {
  const issueCount = completeness.issues.length

  return (
    <aside className="space-y-4 lg:sticky lg:top-36 lg:self-start">
      <FormSection
        id="publish-check"
        title="发布检查"
        description="仅做运营提醒，不阻止保存或发布。已发布项目保存后会影响公开案例内容；坐标有效时也会影响 Global 地图展示。"
        tone="warning"
      >
        {children}

        <div className="rounded-lg border border-[#D8E7E8] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
                <ListChecks size={17} />
              </span>
              <div>
                <div className="text-sm font-bold text-[#1E2C31]">发布检查摘要</div>
                <p className="mt-1 text-xs leading-5 text-[#61767D]">根据当前表单实时汇总缺项和展示影响。</p>
              </div>
            </div>
            <Badge className={`${completenessBadgeClass(completeness.level)} shrink-0 text-xs`}>
              {completeness.level}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
              <p className="text-[11px] font-semibold text-[#61767D]">章节</p>
              <p className="mt-1 text-lg font-bold text-[#1E2C31]">
                {completedSectionCount}/{sectionProgress.length}
              </p>
            </div>
            <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
              <p className="text-[11px] font-semibold text-[#61767D]">缺项</p>
              <p className={issueCount > 0 ? 'mt-1 text-lg font-bold text-[#E36F2C]' : 'mt-1 text-lg font-bold text-emerald-700'}>
                {issueCount}
              </p>
            </div>
            <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
              <p className="text-[11px] font-semibold text-[#61767D]">图库</p>
              <p className="mt-1 text-lg font-bold text-[#1E2C31]">{imageCount}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-[#D8E7E8] px-3 py-2">
              <span className="block text-[#8A9EA4]">状态</span>
              <span className={status === 'published' ? 'font-semibold text-emerald-700' : 'font-semibold text-[#E36F2C]'}>
                {status === 'published' ? '已发布' : '草稿'}
              </span>
            </div>
            <div className="rounded-md border border-[#D8E7E8] px-3 py-2">
              <span className="block text-[#8A9EA4]">坐标</span>
              <span className={coordinatesValid ? 'font-semibold text-emerald-700' : 'font-semibold text-[#61767D]'}>
                {coordinatesValid ? '有效' : hasCompleteCoordinates ? '需检查' : '未完整'}
              </span>
            </div>
          </div>

          {hasUnsavedChanges ? (
            <div className="mt-3 rounded-md border border-[#F2C6A7] bg-[#FFF7F0] px-3 py-2 text-xs font-medium text-[#8A3F16]">
              当前有未保存修改，离开页面前请先保存。
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              当前表单与最近一次保存一致。
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#D8E7E8] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#1E2C31]">
              <MapPinned size={16} className="text-[#E36F2C]" />
              /global 地图状态
            </div>
            {mapReady ? (
              <Badge className="border-[#E36F2C]/30 bg-[#E36F2C]/15 text-[#E36F2C]">已入图</Badge>
            ) : (
              <Badge className="border-[#9AA9AD] bg-[#D8E7E8] text-[#61767D]">
                {coordinatesValid ? '待发布' : hasCompleteCoordinates ? '坐标需检查' : '未入图'}
              </Badge>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#61767D]">
            案例发布后，同时填写有效经纬度，才会进入 /global 地图点位；不填坐标时仍可正常维护 /cases 内容。
          </p>
          {globalHref ? (
            <Link
              href={globalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#E36F2C] hover:text-[#C85A1F]"
            >
              查看地图深链
              <ExternalLink size={13} />
            </Link>
          ) : null}
        </div>
      </FormSection>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#1E2C31]">编辑导航</h3>
          <span className="text-xs font-semibold text-[#8A9EA4]">点击跳转</span>
        </div>
        <nav className="mt-3 space-y-1.5">
          {sectionProgress.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`flex items-start gap-3 rounded-md border px-3 py-2.5 transition ${
                section.done
                  ? 'border-emerald-100 bg-emerald-50/70 hover:border-emerald-200'
                  : 'border-[#F2C6A7] bg-[#FFF7F0] hover:border-[#E36F2C]/45'
              }`}
            >
              <span className={section.done ? 'mt-0.5 text-emerald-700' : 'mt-0.5 text-[#E36F2C]'}>
                {section.done ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-[#1E2C31]">{section.title}</span>
                  <span className={section.done ? 'shrink-0 text-[11px] font-semibold text-emerald-700' : 'shrink-0 text-[11px] font-semibold text-[#E36F2C]'}>
                    {section.done ? '完成' : `${section.issueCount} 项`}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[#61767D]">{section.detail}</span>
              </span>
            </a>
          ))}
        </nav>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#1E2C31]">预览入口</h3>
        {showPreviewLink ? (
          <div className="mt-3 space-y-2 text-xs">
            <Link
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] px-3 py-2 font-semibold text-[#1E2C31] hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              <span>{previewLabel}</span>
              <ExternalLink size={13} />
            </Link>
            <Link
              href="/cases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] px-3 py-2 text-[#61767D] hover:border-[#1889B6]/60 hover:text-[#1889B6]"
            >
              <span>案例列表页</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5 text-[#61767D]">新建草稿保存前暂不提供公开预览入口。</p>
        )}
      </section>
    </aside>
  )
}

export default function ProjectForm({
  mode,
  project,
  backHref = '/admin/projects',
  backLabel = '返回案例列表',
  title,
  createRedirectBase = '/admin/projects',
  showPreviewLink = true,
}: {
  mode: 'create' | 'edit'
  project?: ProjectCaseRow | null
  backHref?: string
  backLabel?: string
  title?: string
  createRedirectBase?: string
  showPreviewLink?: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => fromProject(project))
  const [savedForm, setSavedForm] = useState<FormState>(() => fromProject(project))
  const [saving, setSaving] = useState(false)
  const imageUrls = useMemo(() => splitLines(form.images), [form.images])
  const descriptionZhLength = form.description_zh.length
  const descriptionEnLength = form.description_en.length
  const globalAmenities = useMemo(() => parseAmenityRows(form.global_amenities), [form.global_amenities])
  const globalTransportZh = useMemo(() => parseTransportRows(form.global_transport_zh), [form.global_transport_zh])
  const globalTransportEn = useMemo(() => parseTransportRows(form.global_transport_en), [form.global_transport_en])
  const globalNearbyZh = useMemo(() => parseNearbyRows(form.global_nearby_zh), [form.global_nearby_zh])
  const globalNearbyEn = useMemo(() => parseNearbyRows(form.global_nearby_en), [form.global_nearby_en])
  const latitude = useMemo(() => parseOptionalNumber(form.latitude), [form.latitude])
  const longitude = useMemo(() => parseOptionalNumber(form.longitude), [form.longitude])
  const globalUnits = useMemo(() => parseOptionalNumber(form.global_units), [form.global_units])
  const globalUnitArea = useMemo(() => parseOptionalNumber(form.global_unit_area), [form.global_unit_area])
  const hasLatitude = form.latitude.trim().length > 0
  const hasLongitude = form.longitude.trim().length > 0
  const hasGlobalUnits = form.global_units.trim().length > 0
  const hasGlobalUnitArea = form.global_unit_area.trim().length > 0
  const hasCompleteCoordinates = hasLatitude && hasLongitude
  const coordinatesValid =
    hasCompleteCoordinates &&
    latitude !== null &&
    longitude !== null &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  const mapReady = form.status === 'published' && coordinatesValid
  const completeness = getProjectCompleteness({
    form,
    imageUrls,
    hasLatitude,
    hasLongitude,
    hasCompleteCoordinates,
    coordinatesValid,
  })
  const sectionProgress = buildProjectFormProgress({
    form,
    imageUrls,
    completeness,
    coordinatesValid,
    hasCompleteCoordinates,
  })
  const completedSectionCount = sectionProgress.filter((section) => section.done).length
  const hasUnsavedChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm])
  const savedProjectId = project?.id ?? savedForm.id
  const savedProjectPublished = mode === 'edit' && savedForm.status === 'published' && hasText(savedProjectId)
  const previewHref = savedProjectPublished ? `/cases/${savedProjectId}` : '/cases'
  const previewLabel = savedProjectPublished ? '预览案例' : '查看案例列表'
  const globalHref = mode === 'edit' && coordinatesValid && project?.id ? `/global?camp=${project.id}` : null

  useUnsavedChangesWarning(hasUnsavedChanges)

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const buildPayload = (nextStatus?: ProjectCaseStatus) => ({
    id: normalizeId(form.id),
    name_zh: form.name_zh.trim(),
    name_en: form.name_en.trim(),
    location_zh: form.location_zh.trim(),
    location_en: form.location_en.trim(),
    project_type_zh: form.project_type_zh.trim(),
    project_type_en: form.project_type_en.trim(),
    area_display: form.area_display.trim(),
    investment_display: form.investment_display.trim(),
    units_display: form.units_display.trim(),
    products: form.products.trim(),
    description_zh: form.description_zh.trim(),
    description_en: form.description_en.trim(),
    tags_zh: splitLines(form.tags_zh),
    tags_en: splitLines(form.tags_en),
    cover_image_url: form.cover_image_url.trim() || null,
    images: imageUrls,
    country: form.country.trim(),
    latitude,
    longitude,
    global_open_date: form.global_open_date.trim(),
    global_units: globalUnits,
    global_unit_area: globalUnitArea,
    global_guests: form.global_guests.trim(),
    global_booking_url: form.global_booking_url.trim(),
    global_amenities: globalAmenities,
    global_transport_zh: globalTransportZh,
    global_transport_en: globalTransportEn,
    global_nearby_zh: globalNearbyZh,
    global_nearby_en: globalNearbyEn,
    status: nextStatus ?? form.status,
    sort_order: Number(form.sort_order || 999),
  })

  const handleSave = async (nextStatus?: ProjectCaseStatus) => {
    setSaving(true)
    try {
      if (hasLatitude !== hasLongitude) {
        toast.error('经纬度需要同时填写，或者同时留空')
        return
      }
      if (hasCompleteCoordinates && !coordinatesValid) {
        toast.error('坐标格式不正确：纬度需在 -90 到 90，经度需在 -180 到 180')
        return
      }
      if (hasGlobalUnits && (globalUnits === null || Number.isNaN(globalUnits) || !Number.isInteger(globalUnits) || globalUnits < 0)) {
        toast.error('地图详情舱数需填写 0 或正整数')
        return
      }
      if (hasGlobalUnitArea && (globalUnitArea === null || Number.isNaN(globalUnitArea) || globalUnitArea < 0)) {
        toast.error('地图详情每间面积需填写 0 或正数')
        return
      }
      const payload = buildPayload(nextStatus)
      const url = mode === 'create' ? '/api/admin/projects' : `/api/admin/projects/${project?.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mode === 'create' ? payload : { ...payload, id: undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')
      toast.success(nextStatus === 'published' ? '已保存并发布' : '已保存')
      const nextForm = fromProject(data.data)
      setForm(nextForm)
      setSavedForm(nextForm)
      if (mode === 'create') {
        const base = createRedirectBase.replace(/\/$/, '')
        router.push(`${base}/${data.data.id}/edit`)
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex max-w-none flex-col gap-6">
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#D8E7E8] bg-white/95 p-3 shadow-sm backdrop-blur">
        <div>
          <Link href={backHref} className="mb-1 inline-flex items-center gap-2 text-xs font-semibold text-[#61767D] hover:text-[#1889B6]">
            <ArrowLeft size={14} />
            {backLabel}
          </Link>
          <h2 className="text-base font-bold text-[#1E2C31] md:text-lg">
            {title ?? (mode === 'create' ? '新建项目案例' : '编辑项目案例')}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasUnsavedChanges ? (
            <span className="rounded-full border border-[#F2C6A7] bg-[#FFF7F0] px-2.5 py-1 text-xs font-medium text-[#B85D21]">
              有未保存修改
            </span>
          ) : null}
          {showPreviewLink ? (
            <Link
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1889B6] hover:border-[#1889B6] hover:bg-[#F0F7F8]"
            >
              <ExternalLink size={14} />
              {previewLabel}
            </Link>
          ) : null}
          <Button variant="outline" size="sm" disabled={saving} onClick={() => handleSave()}>
            <Save size={15} />
            保存草稿
          </Button>
          <Button size="sm" disabled={saving} onClick={() => handleSave('published')}>
            <Send size={15} />
            保存并发布
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          <FormSection
            id="basic"
            title="基础信息"
            description="先确认项目名称、地点和类型。案例 ID 和排序属于维护字段，日常运营通常不需要频繁调整。"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="中文名称">
              <Input value={form.name_zh} onChange={(e) => patch('name_zh', e.target.value)} />
            </Field>
            <Field label="英文名称">
              <Input value={form.name_en} onChange={(e) => patch('name_en', e.target.value)} />
            </Field>
            <Field label="中文位置">
              <Input value={form.location_zh} onChange={(e) => patch('location_zh', e.target.value)} />
            </Field>
            <Field label="英文位置">
              <Input value={form.location_en} onChange={(e) => patch('location_en', e.target.value)} />
            </Field>
            <Field label="中文项目类型">
              <Input value={form.project_type_zh} onChange={(e) => patch('project_type_zh', e.target.value)} />
            </Field>
            <Field label="英文项目类型">
              <Input value={form.project_type_en} onChange={(e) => patch('project_type_en', e.target.value)} />
            </Field>
            <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3 md:col-span-2">
              <div className="mb-3 text-xs font-semibold text-[#61767D]">维护字段</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="案例 ID / Slug" hint="新建后不可修改。示例: shanxi-yunqiu-home">
                  <Input value={form.id} disabled={mode === 'edit'} onChange={(e) => patch('id', normalizeId(e.target.value))} />
                </Field>
                <Field label="排序">
                  <Input type="number" value={form.sort_order} onChange={(e) => patch('sort_order', e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
          </FormSection>

          <FormSection
            id="media"
            title="图片素材"
            description="图片影响案例列表和详情页展示。选择图片只回填当前表单，保存后才会写入项目。"
          >
          <Field label="封面图">
            <CoverImagePicker value={form.cover_image_url || null} onChange={(url) => patch('cover_image_url', url ?? '')} />
          </Field>
          <Field label="封面 URL">
            <Input value={form.cover_image_url} onChange={(e) => patch('cover_image_url', e.target.value)} />
          </Field>
          <Field label="案例图库">
            <ProductGalleryPicker value={imageUrls} onChange={(urls) => patch('images', urls.join('\n'))} />
            <Textarea
              className="min-h-28"
              value={form.images}
              onChange={(e) => patch('images', e.target.value)}
              placeholder="/images/projects/example/image-01.jpg"
            />
          </Field>
          </FormSection>

          <FormSection
            id="content"
            title="案例内容"
            description="这是正式项目案例内容，不等同于 Global 地图说明。中英文简介和标签会影响案例列表与详情页展示质量。"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="中文简介" hint={`${descriptionZhLength}/${MAX_PROJECT_CASE_DESCRIPTION_CHARS} 字符。核心样板可录入更完整的项目背景、落地节奏和交付证明。`}>
              <Textarea
                className="min-h-40"
                maxLength={MAX_PROJECT_CASE_DESCRIPTION_CHARS}
                value={form.description_zh}
                onChange={(e) => patch('description_zh', e.target.value)}
              />
            </Field>
            <Field label="英文简介" hint={`${descriptionEnLength}/${MAX_PROJECT_CASE_DESCRIPTION_CHARS} characters. Keep customer-visible facts from confirmed published content.`}>
              <Textarea
                className="min-h-40"
                maxLength={MAX_PROJECT_CASE_DESCRIPTION_CHARS}
                value={form.description_en}
                onChange={(e) => patch('description_en', e.target.value)}
              />
            </Field>
            <Field label="中文标签" hint="一行一个，也支持英文逗号分隔。">
              <Textarea value={form.tags_zh} onChange={(e) => patch('tags_zh', e.target.value)} />
            </Field>
            <Field label="英文标签">
              <Textarea value={form.tags_en} onChange={(e) => patch('tags_en', e.target.value)} />
            </Field>
          </div>
          </FormSection>

          <FormSection
            id="params"
            title="项目参数"
            description="用于展示项目规模和相关产品，帮助运营判断案例是否具备正式展示信息。"
          >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="面积">
              <Input value={form.area_display} onChange={(e) => patch('area_display', e.target.value)} />
            </Field>
            <Field label="投资额">
              <Input value={form.investment_display} onChange={(e) => patch('investment_display', e.target.value)} />
            </Field>
            <Field label="舱数">
              <Input value={form.units_display} onChange={(e) => patch('units_display', e.target.value)} />
            </Field>
            <Field label="产品型号">
              <Input value={form.products} onChange={(e) => patch('products', e.target.value)} />
            </Field>
          </div>
          </FormSection>

          <FormSection
            id="global"
            title="Global 入图信息"
            description="这些字段只影响 Global 地图点位和地图展示，不是正式案例详情页。坐标缺失只代表暂不能入图，不代表案例内容错误。"
            tone="global"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="国家/地区">
                <Input className="bg-white" value={form.country} onChange={(e) => patch('country', e.target.value)} />
              </Field>
              <Field label="纬度" hint="-90 到 90">
                <Input
                  type="number"
                  step="0.000001"
                  className="bg-white"
                  value={form.latitude}
                  onChange={(e) => patch('latitude', e.target.value)}
                />
              </Field>
              <Field label="经度" hint="-180 到 180">
                <Input
                  type="number"
                  step="0.000001"
                  className="bg-white"
                  value={form.longitude}
                  onChange={(e) => patch('longitude', e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Field label="开业时间">
                <Input
                  className="bg-white"
                  value={form.global_open_date}
                  onChange={(e) => patch('global_open_date', e.target.value)}
                  placeholder="2025.03"
                />
              </Field>
              <Field label="舱数">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  className="bg-white"
                  value={form.global_units}
                  onChange={(e) => patch('global_units', e.target.value)}
                />
              </Field>
              <Field label="每间面积㎡">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  className="bg-white"
                  value={form.global_unit_area}
                  onChange={(e) => patch('global_unit_area', e.target.value)}
                />
              </Field>
              <Field label="入住人数">
                <Input
                  className="bg-white"
                  value={form.global_guests}
                  onChange={(e) => patch('global_guests', e.target.value)}
                  placeholder="2-4"
                />
              </Field>
              <Field label="预订/官网链接">
                <Input
                  className="bg-white"
                  value={form.global_booking_url}
                  onChange={(e) => patch('global_booking_url', e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>
            <Field label="设施亮点" hint="每行一条，格式：图标 | 中文 | English。示例：🏔 | 海拔1330米悬崖 | Cliff at 1,330m">
              <Textarea
                className="min-h-28 bg-white"
                value={form.global_amenities}
                onChange={(e) => patch('global_amenities', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="交通指引中文" hint="每行一条，格式：图标 | 文案。">
                <Textarea
                  className="min-h-24 bg-white"
                  value={form.global_transport_zh}
                  onChange={(e) => patch('global_transport_zh', e.target.value)}
                />
              </Field>
              <Field label="交通指引英文">
                <Textarea
                  className="min-h-24 bg-white"
                  value={form.global_transport_en}
                  onChange={(e) => patch('global_transport_en', e.target.value)}
                />
              </Field>
              <Field label="周边景点中文" hint="每行一条，格式：名称 | 距离。">
                <Textarea
                  className="min-h-24 bg-white"
                  value={form.global_nearby_zh}
                  onChange={(e) => patch('global_nearby_zh', e.target.value)}
                />
              </Field>
              <Field label="周边景点英文">
                <Textarea
                  className="min-h-24 bg-white"
                  value={form.global_nearby_en}
                  onChange={(e) => patch('global_nearby_en', e.target.value)}
                />
              </Field>
            </div>
          </FormSection>
        </div>

        <ProjectFormSidebar
          sectionProgress={sectionProgress}
          completedSectionCount={completedSectionCount}
          completeness={completeness}
          status={form.status}
          hasUnsavedChanges={hasUnsavedChanges}
          mapReady={mapReady}
          coordinatesValid={coordinatesValid}
          hasCompleteCoordinates={hasCompleteCoordinates}
          imageCount={imageUrls.length}
          previewHref={previewHref}
          previewLabel={previewLabel}
          showPreviewLink={showPreviewLink}
          globalHref={globalHref}
        >
          <Field label="状态">
            <Select value={form.status} onChange={(e) => patch('status', e.target.value as ProjectCaseStatus)}>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </Select>
          </Field>
        </ProjectFormSidebar>
      </div>
    </div>
  )
}
