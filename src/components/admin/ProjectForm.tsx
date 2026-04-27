'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, MapPinned, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import CoverImagePicker from '@/components/admin/CoverImagePicker'
import ProductGalleryPicker from '@/components/admin/ProductGalleryPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectCaseRow, ProjectCaseStatus } from '@/lib/project-cases-db'

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
  global_amenities: string
  global_transport_zh: string
  global_transport_en: string
  global_nearby_zh: string
  global_nearby_en: string
  status: ProjectCaseStatus
  sort_order: string
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
    <label className="flex flex-col gap-2">
      <span className="text-xs text-[#C4B9AB] font-medium">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-relaxed text-[#6B6560]">{hint}</span>}
    </label>
  )
}

export default function ProjectForm({
  mode,
  project,
}: {
  mode: 'create' | 'edit'
  project?: ProjectCaseRow | null
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => fromProject(project))
  const [saving, setSaving] = useState(false)
  const imageUrls = useMemo(() => splitLines(form.images), [form.images])
  const globalAmenities = useMemo(() => parseAmenityRows(form.global_amenities), [form.global_amenities])
  const globalTransportZh = useMemo(() => parseTransportRows(form.global_transport_zh), [form.global_transport_zh])
  const globalTransportEn = useMemo(() => parseTransportRows(form.global_transport_en), [form.global_transport_en])
  const globalNearbyZh = useMemo(() => parseNearbyRows(form.global_nearby_zh), [form.global_nearby_zh])
  const globalNearbyEn = useMemo(() => parseNearbyRows(form.global_nearby_en), [form.global_nearby_en])
  const latitude = useMemo(() => parseOptionalNumber(form.latitude), [form.latitude])
  const longitude = useMemo(() => parseOptionalNumber(form.longitude), [form.longitude])
  const hasLatitude = form.latitude.trim().length > 0
  const hasLongitude = form.longitude.trim().length > 0
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
      if (mode === 'create') {
        router.push(`/admin/projects/${data.data.id}/edit`)
      } else {
        setForm(fromProject(data.data))
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/projects" className="inline-flex items-center gap-2 text-xs text-[#8A8580] hover:text-[#E36F2C] mb-2">
            <ArrowLeft size={14} />
            返回案例列表
          </Link>
          <h1 className="text-[#2C2A28]" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700 }}>
            {mode === 'create' ? '新建项目案例' : '编辑项目案例'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-md border border-[#E5DED4] px-3 text-sm font-medium text-[#2C2A28] hover:bg-[#FFFFFF]"
          >
            预览列表
          </Link>
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
        <div className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF] p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="案例 ID / Slug" hint="新建后不可修改。示例: shanxi-yunqiu-home">
              <Input value={form.id} disabled={mode === 'edit'} onChange={(e) => patch('id', normalizeId(e.target.value))} />
            </Field>
            <Field label="排序">
              <Input type="number" value={form.sort_order} onChange={(e) => patch('sort_order', e.target.value)} />
            </Field>
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
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="中文简介">
              <Textarea className="min-h-32" value={form.description_zh} onChange={(e) => patch('description_zh', e.target.value)} />
            </Field>
            <Field label="英文简介">
              <Textarea className="min-h-32" value={form.description_en} onChange={(e) => patch('description_en', e.target.value)} />
            </Field>
            <Field label="中文标签" hint="一行一个，也支持英文逗号分隔。">
              <Textarea value={form.tags_zh} onChange={(e) => patch('tags_zh', e.target.value)} />
            </Field>
            <Field label="英文标签">
              <Textarea value={form.tags_en} onChange={(e) => patch('tags_en', e.target.value)} />
            </Field>
          </div>

          <div className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#2C2A28]">/global 详情内容</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#8A8580]">
                用于地图右侧详情面板。留空时会继续使用项目类型、产品型号、标签和位置自动生成兜底内容。
              </p>
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
          </div>

          <Field label="案例图库">
            <ProductGalleryPicker value={imageUrls} onChange={(urls) => patch('images', urls.join('\n'))} />
            <Textarea
              className="min-h-28"
              value={form.images}
              onChange={(e) => patch('images', e.target.value)}
              placeholder="/images/projects/example/image-01.jpg"
            />
          </Field>
        </div>

        <aside className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF] p-5 space-y-5 h-fit">
          <Field label="状态">
            <Select value={form.status} onChange={(e) => patch('status', e.target.value as ProjectCaseStatus)}>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </Select>
          </Field>

          <Field label="封面图">
            <CoverImagePicker value={form.cover_image_url || null} onChange={(url) => patch('cover_image_url', url ?? '')} />
          </Field>
          <Field label="封面 URL">
            <Input value={form.cover_image_url} onChange={(e) => patch('cover_image_url', e.target.value)} />
          </Field>
          <Field label="国家/地区">
            <Input value={form.country} onChange={(e) => patch('country', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="纬度" hint="-90 到 90">
              <Input type="number" step="0.000001" value={form.latitude} onChange={(e) => patch('latitude', e.target.value)} />
            </Field>
            <Field label="经度" hint="-180 到 180">
              <Input type="number" step="0.000001" value={form.longitude} onChange={(e) => patch('longitude', e.target.value)} />
            </Field>
          </div>

          <div className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[#2C2A28]">
                <MapPinned size={16} className="text-[#E36F2C]" />
                /global 地图状态
              </div>
              {mapReady ? (
                <Badge className="bg-[#E36F2C]/15 text-[#E36F2C] border-[#E36F2C]/30">已入图</Badge>
              ) : (
                <Badge className="bg-[#E5DED4] text-[#8A8580] border-[#C4B9AB]">
                  {coordinatesValid ? '待发布' : hasCompleteCoordinates ? '坐标需检查' : '未入图'}
                </Badge>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6B6560]">
              案例发布后，同时填写有效经纬度，才会进入 /global 地图点位和右侧详情；不填坐标时仍可正常展示在 /cases。
            </p>
            {mode === 'edit' && coordinatesValid ? (
              <Link
                href={`/global?camp=${project?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#E36F2C] hover:text-[#C85A1F]"
              >
                查看地图深链
                <ExternalLink size={13} />
              </Link>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
