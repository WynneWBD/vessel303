'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
  CircleSlash2,
  Clock3,
  Eye,
  ImageIcon,
  Layers3,
  Link2,
  LocateFixed,
  LockKeyhole,
  Monitor,
  MousePointer2,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Type,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import PageModuleImagePicker from '@/components/admin/PageModuleImagePicker'
import { useUnsavedChangesWarning } from '@/components/admin/useUnsavedChangesWarning'
import {
  PAGE_STRUCTURE_BOUNDARY_NOTES,
  PLANNED_PAGE_MODULE_CATALOG,
  RESTRICTED_PAGE_MODULE_CATALOG,
  type PageModuleCatalogItem,
  type PageModuleCatalogPage,
  type PageModuleCatalogStatus,
} from '@/lib/page-module-catalog'
import {
  HOME_ADDABLE_PAGE_MODULE_TEMPLATES,
  isTemplateBackedPageModule,
  type PageModuleTemplateId,
} from '@/lib/page-module-templates'
import type {
  PageModuleItem,
  PageModuleLiveState,
  PageModuleRow,
  PageModuleSnapshotRow,
  PageStructureDraftRow,
  PageStructureModule,
  PageStructureSnapshotRow,
} from '@/lib/page-modules-db'

type PageKey = 'home' | 'about' | 'global'

type PageMeta = {
  key: PageKey
  label: string
  path: string
}

const HOME_CARD_MODULE_TYPES = new Set([
  'large-product-cards',
  'model-strip',
  'innovation-story',
  'scenario-tiles',
  'future-explorer',
  'product-series',
  'model-grid',
  'application-scenes',
  'project-proof',
])

const HIGH_IMPACT_ITEM_FIELDS = new Set(['image_url', 'video_url', 'video_poster_url', 'href'])

type HighlightRect = {
  top: number
  left: number
  width: number
  height: number
}

type FieldSelection = {
  itemId: string | null
  field: string | null
}

type PreviewDeviceKey = 'desktop' | 'tablet' | 'mobile'

type PreviewDevice = {
  key: PreviewDeviceKey
  label: string
  width: number | null
  icon: typeof Monitor
}

const PAGES: PageMeta[] = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'about', label: 'About', path: '/about' },
  { key: 'global', label: 'Global', path: '/global' },
]

const PREVIEW_DEVICES: PreviewDevice[] = [
  { key: 'desktop', label: 'Desktop', width: null, icon: Monitor },
  { key: 'tablet', label: 'Tablet', width: 768, icon: Tablet },
  { key: 'mobile', label: 'Mobile', width: 390, icon: Smartphone },
]

const PAGE_LABELS = {
  home: '首页',
  about: 'About',
  global: 'Global',
} satisfies Record<PageKey, string>

const EDITABLE_MODULE_IDS = [
  'home:hero',
  'home:credentials',
  'home:large-product-cards',
  'home:model-strip',
  'home:innovation-story',
  'home:scenario-tiles',
  'home:project-entry',
  'home:future-explorer',
  'home:global-entry',
  'home:contact-cta',
  'home:operating-proof',
  'about:hero',
  'about:stats',
  'about:brand-story',
  'about:factory',
  'about:timeline',
  'about:technologies',
  'about:founder',
  'about:services',
  'about:partners',
  'about:recognition-awards',
  'global:hero',
  'global:header',
  'global:map-labels',
  'global:detail-labels',
  'global:cta-labels',
]

const EDITABLE_MODULE_ID_SET = new Set(EDITABLE_MODULE_IDS)

function moduleId(pageModule: Pick<PageModuleRow, 'page_key' | 'module_key'>) {
  return `${pageModule.page_key}:${pageModule.module_key}`
}

function isPageKey(value: string): value is PageKey {
  return value === 'home' || value === 'about' || value === 'global'
}

function pageLabel(pageKey: string) {
  return isPageKey(pageKey) ? PAGE_LABELS[pageKey] : pageKey
}

const CATALOG_PAGE_LABELS = {
  home: 'Home',
  about: 'About',
  global: 'Global',
  all: 'All',
} satisfies Record<PageModuleCatalogPage, string>

function catalogPagesLabel(pages: PageModuleCatalogPage[]) {
  return pages.map((page) => CATALOG_PAGE_LABELS[page]).join(' / ')
}

function catalogStatusLabel(status: PageModuleCatalogStatus) {
  if (status === 'planned') return '可规划'
  if (status === 'locked') return '锁定'
  return '暂不开放'
}

function catalogStatusClassName(status: PageModuleCatalogStatus) {
  if (status === 'planned') return 'bg-[#E36F2C]/10 text-[#E36F2C]'
  if (status === 'locked') return 'bg-[#F5F2ED] text-[#6B625B]'
  return 'bg-[#F5F2ED] text-[#8A8580]'
}

function CapabilityBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
        enabled ? 'bg-[#E36F2C]/10 text-[#E36F2C]' : 'bg-[#F5F2ED] text-[#8A8580]'
      }`}
    >
      {label}：{enabled ? '规划支持' : '不支持'}
    </span>
  )
}

function visualMetricTone(tone: 'blue' | 'green' | 'orange' | 'gray') {
  if (tone === 'green') return {
    border: 'border-l-emerald-500',
    icon: 'bg-emerald-50 text-emerald-700',
  }
  if (tone === 'orange') return {
    border: 'border-l-[#E36F2C]',
    icon: 'bg-[#FFF2E7] text-[#E36F2C]',
  }
  if (tone === 'gray') return {
    border: 'border-l-[#8A9EA4]',
    icon: 'bg-[#F0F2F2] text-[#61767D]',
  }
  return {
    border: 'border-l-[#1889B6]',
    icon: 'bg-[#EAF6F8] text-[#1889B6]',
  }
}

function VisualMetricCard({
  title,
  value,
  detail,
  Icon,
  tone,
}: {
  title: string
  value: number | string
  detail: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'gray'
}) {
  const toneClass = visualMetricTone(tone)

  return (
    <div className={`rounded-md border border-l-4 border-[#D8E7E8] ${toneClass.border} bg-white p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61767D]">{title}</div>
          <div className="mt-2 break-words text-3xl font-bold text-[#1E2C31]">{value}</div>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClass.icon}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-3 text-xs leading-5 text-[#61767D]">{detail}</div>
    </div>
  )
}

function VisualStatusItem({
  label,
  value,
  detail,
  tone = 'gray',
}: {
  label: string
  value: string
  detail: string
  tone?: 'green' | 'orange' | 'gray'
}) {
  const valueClass =
    tone === 'orange' ? 'text-[#E36F2C]' : tone === 'green' ? 'text-emerald-700' : 'text-[#1E2C31]'

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#61767D]">{label}</span>
        <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[#61767D]">{detail}</p>
    </div>
  )
}

function ModuleCatalogCard({ item }: { item: PageModuleCatalogItem }) {
  const StatusIcon = item.status === 'planned' ? CheckCircle2 : item.status === 'locked' ? LockKeyhole : CircleSlash2
  const reasonLabel = item.status === 'planned' ? '开放前置条件' : '暂不开放原因'

  return (
    <div className="rounded-md border border-[#E5DED4] bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2C2A28]">{item.name}</p>
          <p className="mt-1 text-xs text-[#8A8580]">适用页面：{catalogPagesLabel(item.pages)}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] ${catalogStatusClassName(item.status)}`}>
          <StatusIcon size={13} />
          {catalogStatusLabel(item.status)}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#6B625B]">{item.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <CapabilityBadge label="可新增" enabled={item.canAdd} />
        <CapabilityBadge label="可删除" enabled={item.canDelete} />
        <CapabilityBadge label="可排序" enabled={item.canSort} />
      </div>

      {item.unavailableReason ? (
        <p className="mt-3 rounded-md bg-[#FAF7F2] px-2 py-2 text-xs leading-5 text-[#8A8580]">
          {reasonLabel}：{item.unavailableReason}
        </p>
      ) : null}
    </div>
  )
}

function ModuleCatalogPanel({
  selectedPage,
  currentStructureDraft,
  structureBusy,
  onAddTemplate,
}: {
  selectedPage: PageKey
  currentStructureDraft: PageStructureDraftRow | null
  structureBusy: string | null
  onAddTemplate: (templateId: PageModuleTemplateId) => void
}) {
  return (
    <section className="rounded-lg border border-[#E5DED4] bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2A28]">
            <Layers3 size={16} className="text-[#E36F2C]" />
            <span>模块库</span>
          </div>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-[#8A8580]">
            Home 只允许在受控安全插入区添加固定模板模块。About 暂不开放添加入口。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#F5F2ED] px-3 py-1 text-xs font-medium text-[#6B625B]">
          Home 安全插入区
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        <div>
          <p className="text-xs font-semibold text-[#2C2A28]">可新增模块候选</p>
          <p className="mt-1 text-xs leading-5 text-[#8A8580]">本轮只开放固定模板到 Home 结构草稿；新增后不会立即影响普通前台。</p>
          <div className="mt-3 space-y-2">
            {PLANNED_PAGE_MODULE_CATALOG.map((item) => {
              const template = HOME_ADDABLE_PAGE_MODULE_TEMPLATES.find((entry) => entry.templateId === item.id)
              const canAddToHome = selectedPage === 'home' && Boolean(template)
              const stale = currentStructureDraft?.draft_status === 'stale'
              return (
                <div key={item.id} className="rounded-md border border-[#E5DED4]">
                  <ModuleCatalogCard item={item} />
                  {canAddToHome && template ? (
                    <div className="border-t border-[#E5DED4] bg-[#FAF7F2] px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={Boolean(structureBusy) || stale}
                        onClick={() => onAddTemplate(template.templateId)}
                      >
                        <Plus size={14} />
                        {currentStructureDraft ? '添加到结构草稿' : '创建草稿并添加'}
                      </Button>
                      <p className="mt-2 text-[11px] leading-4 text-[#8A8580]">
                        仅进入 Home 结构草稿，发布前普通前台不可见。
                      </p>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#2C2A28]">暂不开放 / 锁定模块</p>
          <p className="mt-1 text-xs leading-5 text-[#8A8580]">这些模块不进入第一批结构编辑，避免破坏全站结构、数据链路或品牌样式。</p>
          <div className="mt-3 space-y-2">
            {RESTRICTED_PAGE_MODULE_CATALOG.map((item) => (
              <ModuleCatalogCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
          <p className="text-xs font-semibold text-[#2C2A28]">页面结构边界</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-[#6B625B]">
            {PAGE_STRUCTURE_BOUNDARY_NOTES.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E36F2C]" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function moduleSelector(id: string) {
  return `[data-page-module="${id}"]`
}

function editorFieldKey(moduleKey: string, itemId: string, field: string) {
  return `${moduleKey}:${itemId}:${field}`
}

function getIframeDocument(iframe: HTMLIFrameElement | null) {
  try {
    return iframe?.contentDocument ?? null
  } catch {
    return null
  }
}

function sameRecord(a: Record<string, boolean>, b: Record<string, boolean>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    if (a[key] !== b[key]) return false
  }
  return true
}

function cloneModule(pageModule: PageModuleRow): PageModuleRow {
  return {
    ...pageModule,
    items: pageModule.items.map((item) => ({ ...item })),
    live_state: pageModule.live_state
      ? {
          ...pageModule.live_state,
          items: pageModule.live_state.items.map((item) => ({ ...item })),
        }
      : pageModule.live_state,
  }
}

function pageModuleAsLiveState(pageModule: PageModuleRow): PageModuleLiveState {
  return {
    title_zh: pageModule.title_zh,
    title_en: pageModule.title_en,
    description_zh: pageModule.description_zh,
    description_en: pageModule.description_en,
    items: pageModule.items.map((item) => ({ ...item })),
    is_visible: pageModule.is_visible,
    sort_order: pageModule.sort_order,
    updated_at: pageModule.updated_at,
    updated_by_email: pageModule.updated_by_email,
  }
}

function withLiveState(pageModule: PageModuleRow): PageModuleRow {
  if (pageModule.live_state) return pageModule
  return {
    ...pageModule,
    live_state: pageModuleAsLiveState(pageModule),
  }
}

function comparableModule(pageModule: PageModuleRow | PageModuleLiveState) {
  return {
    title_zh: pageModule.title_zh,
    title_en: pageModule.title_en,
    description_zh: pageModule.description_zh,
    description_en: pageModule.description_en,
    is_visible: pageModule.is_visible,
    sort_order: Number(pageModule.sort_order) || 0,
    items: pageModule.items.map((item) => ({
      id: item.id,
      image_url: item.image_url ?? '',
      video_url: item.video_url ?? '',
      video_poster_url: item.video_poster_url ?? '',
      href: item.href ?? '',
      value_zh: item.value_zh ?? '',
      value_en: item.value_en ?? '',
      content_zh: item.content_zh ?? '',
      content_en: item.content_en ?? '',
      label_zh: item.label_zh,
      label_en: item.label_en,
      is_visible: item.is_visible,
      sort_order: Number(item.sort_order) || 0,
    })),
  }
}

function modulesEqual(a: PageModuleRow | undefined, b: PageModuleRow | undefined) {
  if (!a || !b) return true
  return JSON.stringify(comparableModule(a)) === JSON.stringify(comparableModule(b))
}

function filterEditableModules(modules: PageModuleRow[]) {
  return modules
    .filter((pageModule) => (
      EDITABLE_MODULE_ID_SET.has(moduleId(pageModule)) ||
      isTemplateBackedPageModule(pageModule.page_key, pageModule.module_type)
    ))
    .sort((a, b) => {
      const aStaticIndex = EDITABLE_MODULE_IDS.indexOf(moduleId(a))
      const bStaticIndex = EDITABLE_MODULE_IDS.indexOf(moduleId(b))
      if (aStaticIndex >= 0 && bStaticIndex >= 0) return aStaticIndex - bStaticIndex
      if (a.page_key === b.page_key) {
        return Number(a.sort_order) - Number(b.sort_order) || a.module_key.localeCompare(b.module_key)
      }
      return a.page_key.localeCompare(b.page_key)
    })
}

function isSafeHomeStructureModule(pageModule: PageStructureModule) {
  return (
    pageModule.status !== 'removed' &&
    !pageModule.locked &&
    !pageModule.required &&
    (
      isTemplateBackedPageModule('home', pageModule.moduleType) ||
      pageModule.createdFromTemplate === 'simple-text' ||
      pageModule.createdFromTemplate === 'cta-section'
    )
  )
}

function isStructureModuleVisible(pageModule: PageStructureModule) {
  if (pageModule.status === 'hidden') return false
  if (pageModule.isVisible === false) return false
  return true
}

function getNextStructureVisibility(pageModule: PageStructureModule) {
  return !isStructureModuleVisible(pageModule)
}

function sortedItems(items: PageModuleItem[]) {
  return [...items].sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.id.localeCompare(b.id))
}

function supportsRepeatedItems(pageModule: PageModuleRow) {
  return (
    pageModule.module_type === 'stats' ||
    pageModule.module_type === 'list' ||
    pageModule.module_type.includes('gallery') ||
    (pageModule.page_key === 'home' && HOME_CARD_MODULE_TYPES.has(pageModule.module_type))
  )
}

function isHomeCardItem(pageModule: PageModuleRow, item: PageModuleItem) {
  return pageModule.page_key === 'home' && HOME_CARD_MODULE_TYPES.has(pageModule.module_type) && item.id.startsWith('card-')
}

function isImageItem(pageModule: PageModuleRow, item: PageModuleItem) {
  return (
    Boolean(item.image_url) ||
    item.id.includes('image') ||
    item.id.includes('photo') ||
    pageModule.module_type.includes('gallery') ||
    isHomeCardItem(pageModule, item)
  )
}

function isVideoItem(pageModule: PageModuleRow, item: PageModuleItem) {
  return Boolean(item.video_url?.trim() || item.video_poster_url?.trim()) || isHomeCardItem(pageModule, item)
}

function itemHasVisualMedia(item: PageModuleItem) {
  return Boolean(item.image_url?.trim() || item.video_url?.trim())
}

function isLinkItem(item: PageModuleItem) {
  return Boolean(item.href) || item.id.includes('cta')
}

function showValueFields(pageModule: PageModuleRow, item: PageModuleItem) {
  return (
    pageModule.module_type === 'stats' ||
    isHomeCardItem(pageModule, item) ||
    Boolean(item.value_zh) ||
    Boolean(item.value_en) ||
    /^timeline-\d{4}$/.test(item.id) ||
    /^service-\d/.test(item.id)
  )
}

function showContentFields(pageModule: PageModuleRow, item: PageModuleItem) {
  return (
    Boolean(item.content_zh) ||
    Boolean(item.content_en) ||
    isHomeCardItem(pageModule, item) ||
    item.id.includes('paragraph') ||
    item.id.includes('body') ||
    /^timeline-\d{4}$/.test(item.id) ||
    /^service-\d/.test(item.id) ||
    item.id.startsWith('tech-')
  )
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    label_zh: '中文文字',
    label_en: '英文文字',
    value_zh: '中文数值/编号',
    value_en: '英文数值/编号',
    content_zh: '中文正文',
    content_en: '英文正文',
    image_url: '图片',
    video_url: '视频 URL',
    video_poster_url: '视频封面',
    href: '链接',
  }
  return labels[field] ?? field
}

function buildPreviewSrc(path: string, version: number) {
  const params = new URLSearchParams({ visualDraft: '1' })
  if (version) params.set('visualPreview', String(version))
  const joiner = path.includes('?') ? '&' : '?'
  return `${path}${joiner}${params.toString()}`
}

function formatSnapshotTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function firstReadableItemText(items: PageModuleItem[]) {
  for (const item of sortedItems(items)) {
    const candidates = [
      item.label_zh,
      item.label_en,
      item.value_zh,
      item.value_en,
      item.content_zh,
      item.content_en,
    ]
    const value = candidates.find((text) => text?.trim())
    if (value) return value.trim()
  }
  return ''
}

function truncateText(value: string, maxLength = 64) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}

function snapshotSummary(snapshot: PageModuleSnapshotRow) {
  const title = truncateText(
    snapshot.title_zh.trim() ||
      snapshot.title_en.trim() ||
      firstReadableItemText(snapshot.items) ||
      `${snapshot.page_key}:${snapshot.module_key}`,
  )
  const hasImages = snapshot.items.some((item) => Boolean(item.image_url?.trim()))

  return {
    title,
    hasImages,
    itemCount: snapshot.items.length,
    savedAt: formatSnapshotTime(snapshot.created_at),
    operator: snapshot.created_by_email ?? '未知操作人',
  }
}

function structureDraftStatusLabel(status: PageStructureDraftRow['draft_status']) {
  if (status === 'stale') return '已过期'
  if (status === 'review') return '待复核'
  if (status === 'discarded') return '已丢弃'
  return '草稿中'
}

function structureDraftStatusClassName(status: PageStructureDraftRow['draft_status']) {
  if (status === 'stale') return 'bg-[#B54318]/10 text-[#B54318]'
  if (status === 'review') return 'bg-[#E36F2C]/10 text-[#E36F2C]'
  if (status === 'discarded') return 'bg-[#F5F2ED] text-[#8A8580]'
  return 'bg-[#E36F2C]/10 text-[#E36F2C]'
}

function structureSnapshotSummary(snapshot: PageStructureSnapshotRow) {
  return {
    moduleCount: snapshot.summary.moduleCount,
    imageCount: snapshot.image_refs.length || snapshot.summary.imageCount,
    savedAt: formatSnapshotTime(snapshot.created_at),
    operator: snapshot.created_by_email ?? '未知操作人',
  }
}

function itemSummary(item: PageModuleItem) {
  const label = truncateText(item.label_zh || item.label_en || '无标题项目', 48)
  const value = truncateText(item.value_zh || item.value_en || item.content_zh || item.content_en || '', 72)
  return {
    label,
    value,
  }
}

type ModuleChange = {
  label: string
  detail: string
  severity: 'high' | 'medium' | 'low'
}

type PreflightIssue = {
  label: string
  detail: string
  severity: 'warning' | 'danger'
}

type PageOperationsStats = PageMeta & {
  moduleCount: number
  draftCount: number
  hiddenCount: number
  unsavedCount: number
  issueCount: number
}

function readableModuleTitle(pageModule: PageModuleRow | PageModuleLiveState | PageModuleSnapshotRow) {
  return truncateText(
    pageModule.title_zh.trim() ||
      pageModule.title_en.trim() ||
      firstReadableItemText(pageModule.items) ||
      '未命名模块',
    72,
  )
}

function readableItemTitle(item: PageModuleItem) {
  return truncateText(item.label_zh || item.label_en || item.value_zh || item.value_en || item.id, 48)
}

function readableValue(value: string | undefined) {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  return normalized ? truncateText(normalized, 48) : '空'
}

function buildModuleChanges(current: PageModuleRow, baseline?: PageModuleLiveState | PageModuleRow | null): ModuleChange[] {
  if (!baseline) return []

  const changes: ModuleChange[] = []
  const currentComparable = comparableModule(current)
  const baselineComparable = comparableModule(baseline)

  if (currentComparable.is_visible !== baselineComparable.is_visible) {
    changes.push({
      label: '模块显示状态',
      detail: currentComparable.is_visible ? '从隐藏改为显示' : '从显示改为隐藏',
      severity: 'high',
    })
  }

  const moduleFields: Array<keyof Pick<PageModuleLiveState, 'title_zh' | 'title_en' | 'description_zh' | 'description_en'>> = [
    'title_zh',
    'title_en',
    'description_zh',
    'description_en',
  ]
  for (const field of moduleFields) {
    if (currentComparable[field] !== baselineComparable[field]) {
      changes.push({
        label: fieldLabel(field),
        detail: `${readableValue(baselineComparable[field])} -> ${readableValue(currentComparable[field])}`,
        severity: 'medium',
      })
    }
  }

  const currentItems = new Map(currentComparable.items.map((item) => [item.id, item]))
  const baselineItems = new Map(baselineComparable.items.map((item) => [item.id, item]))
  for (const item of currentComparable.items) {
    const before = baselineItems.get(item.id)
    if (!before) {
      changes.push({
        label: `新增条目：${readableItemTitle(item)}`,
        detail: `item ID：${item.id}`,
        severity: 'high',
      })
      continue
    }

    if (item.is_visible !== before.is_visible) {
      changes.push({
        label: `条目显示状态：${readableItemTitle(item)}`,
        detail: item.is_visible ? '从隐藏改为显示' : '从显示改为隐藏',
        severity: 'medium',
      })
    }

    if (item.sort_order !== before.sort_order) {
      changes.push({
        label: `条目位置：${readableItemTitle(item)}`,
        detail: `从 ${before.sort_order} 调整到 ${item.sort_order}`,
        severity: 'medium',
      })
    }

    const itemFields = [
      'label_zh',
      'label_en',
      'value_zh',
      'value_en',
      'content_zh',
      'content_en',
      'image_url',
      'video_url',
      'video_poster_url',
      'href',
    ] as const
    for (const field of itemFields) {
      if ((item[field] ?? '') !== (before[field] ?? '')) {
        changes.push({
          label: `${readableItemTitle(item)} / ${fieldLabel(field)}`,
          detail: `${readableValue(before[field])} -> ${readableValue(item[field])}`,
          severity: HIGH_IMPACT_ITEM_FIELDS.has(field) ? 'high' : 'low',
        })
      }
    }
  }

  for (const item of baselineComparable.items) {
    if (!currentItems.has(item.id)) {
      changes.push({
        label: `删除条目：${readableItemTitle(item)}`,
        detail: `item ID：${item.id}`,
        severity: 'high',
      })
    }
  }

  return changes
}

function isAllowedHref(value: string) {
  const href = value.trim()
  return (
    href.startsWith('/') ||
    href.startsWith('#') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  )
}

function buildPreflightIssues(pageModule: PageModuleRow | undefined): PreflightIssue[] {
  if (!pageModule) return []

  const issues: PreflightIssue[] = []
  const visibleItems = sortedItems(pageModule.items).filter((item) => item.is_visible)

  if (!pageModule.is_visible) {
    issues.push({
      label: '模块已隐藏',
      detail: '发布后前台不会显示这个模块。',
      severity: 'warning',
    })
  }

  if (!pageModule.title_zh.trim() && !pageModule.title_en.trim()) {
    issues.push({
      label: '模块标题为空',
      detail: '运营后续识别版本和恢复快照会更困难。',
      severity: 'warning',
    })
  }

  if (pageModule.items.length === 0) {
    issues.push({
      label: '模块没有内容条目',
      detail: '发布后该模块可能为空。',
      severity: 'danger',
    })
  } else if (visibleItems.length === 0) {
    issues.push({
      label: '所有条目都已隐藏',
      detail: '发布后该模块可能没有可见内容。',
      severity: 'danger',
    })
  }

  for (const item of visibleItems) {
    const hasReadableText = Boolean(
      item.label_zh?.trim() ||
        item.label_en?.trim() ||
        item.value_zh?.trim() ||
        item.value_en?.trim() ||
        item.content_zh?.trim() ||
        item.content_en?.trim(),
    )

    if (!hasReadableText && !itemHasVisualMedia(item)) {
      issues.push({
        label: `空条目：${item.id}`,
        detail: '这个条目没有文字，也没有图片或视频。',
        severity: 'warning',
      })
    }

    if (isImageItem(pageModule, item) && !itemHasVisualMedia(item)) {
      issues.push({
        label: `图片或视频为空：${readableItemTitle(item)}`,
        detail: `item ID：${item.id}`,
        severity: 'danger',
      })
    }

    if (isLinkItem(item)) {
      if (!item.href?.trim()) {
        issues.push({
          label: `链接为空：${readableItemTitle(item)}`,
          detail: `item ID：${item.id}`,
          severity: 'danger',
        })
      } else if (!isAllowedHref(item.href)) {
        issues.push({
          label: `链接格式异常：${readableItemTitle(item)}`,
          detail: item.href,
          severity: 'warning',
        })
      }
    }
  }

  return issues
}

function countVisualMedia(pageModules: PageModuleRow[]) {
  return pageModules.reduce(
    (acc, pageModule) => {
      for (const item of pageModule.items) {
        if (item.image_url?.trim()) acc.images += 1
        if (item.video_url?.trim() || item.video_poster_url?.trim()) acc.videos += 1
        if (item.href?.trim()) acc.links += 1
        if (isImageItem(pageModule, item) && item.is_visible && !itemHasVisualMedia(item)) acc.missingMedia += 1
        if (item.href?.trim() && !isAllowedHref(item.href)) acc.badLinks += 1
      }
      return acc
    },
    { images: 0, videos: 0, links: 0, missingMedia: 0, badLinks: 0 },
  )
}

function countLocatedModules(pageModules: PageModuleRow[], locatedModules: Record<string, boolean>, frameLoaded: boolean) {
  if (!frameLoaded) return { located: 0, missing: 0 }
  return pageModules.reduce(
    (acc, pageModule) => {
      if (locatedModules[moduleId(pageModule)] === true) acc.located += 1
      else acc.missing += 1
      return acc
    },
    { located: 0, missing: 0 },
  )
}

function buildVisualPriorityReason({
  dirty,
  hasDraft,
  issueCount,
  hidden,
  missingPreview,
}: {
  dirty: boolean
  hasDraft: boolean
  issueCount: number
  hidden: boolean
  missingPreview: boolean
}) {
  if (dirty) return '先保存或撤销未保存修改'
  if (hasDraft && issueCount > 0) return '草稿发布前需要复核检查项'
  if (hasDraft) return '复核草稿并决定是否发布'
  if (issueCount > 0) return '处理发布前检查提醒'
  if (missingPreview) return '预览中未定位到模块 DOM 标记'
  if (hidden) return '确认隐藏模块是否符合当前运营计划'
  return '可进入常规内容巡检'
}

function buildVisualPriorityItems(
  pageModules: PageModuleRow[],
  dirtyIds: Set<string>,
  locatedModules: Record<string, boolean>,
  frameLoaded: boolean,
) {
  return pageModules
    .map((pageModule) => {
      const id = moduleId(pageModule)
      const issueCount = buildPreflightIssues(pageModule).length
      const dirty = dirtyIds.has(id)
      const hasDraft = pageModule.has_draft === true
      const hidden = !pageModule.is_visible
      const missingPreview = frameLoaded && locatedModules[id] !== true
      const highImpactChanges = buildModuleChanges(pageModule, pageModule.live_state).filter(
        (change) => change.severity === 'high',
      ).length
      const score =
        (dirty ? 100 : 0) +
        (hasDraft ? 70 : 0) +
        issueCount * 24 +
        (missingPreview ? 20 : 0) +
        (hidden ? 14 : 0) +
        highImpactChanges * 8

      return {
        id,
        pageModule,
        score,
        issueCount,
        highImpactChanges,
        reason: buildVisualPriorityReason({ dirty, hasDraft, issueCount, hidden, missingPreview }),
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 6)
}

type VisualReleaseLedgerTone = 'danger' | 'warning' | 'review' | 'safe'

type VisualReleaseLedgerRow = {
  id: string
  pageModule?: PageModuleRow
  page: string
  module: string
  stage: string
  signal: string
  detail: string
  counters: string
  tone: VisualReleaseLedgerTone
  score: number
}

function visualReleaseLedgerToneClass(tone: VisualReleaseLedgerTone) {
  if (tone === 'danger') return 'border-l-[#B54318] bg-[#FFF7F0]'
  if (tone === 'warning') return 'border-l-[#E36F2C] bg-[#FFF7F0]'
  if (tone === 'safe') return 'border-l-emerald-500 bg-emerald-50/60'
  return 'border-l-[#1889B6] bg-[#F4FBFC]'
}

function visualReleaseLedgerBadgeClass(tone: VisualReleaseLedgerTone) {
  if (tone === 'danger') return 'bg-[#FDE9DF] text-[#B54318]'
  if (tone === 'warning') return 'bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'safe') return 'bg-emerald-50 text-emerald-700'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function visualReleaseLedgerToneLabel(tone: VisualReleaseLedgerTone) {
  if (tone === 'danger') return '优先'
  if (tone === 'warning') return '复核'
  if (tone === 'safe') return '已闭合'
  return '观察'
}

function buildVisualReleaseLedgerRows({
  pageModules,
  dirtyIds,
  locatedModules,
  frameLoaded,
  currentPageKey,
}: {
  pageModules: PageModuleRow[]
  dirtyIds: Set<string>
  locatedModules: Record<string, boolean>
  frameLoaded: boolean
  currentPageKey: PageKey
}): VisualReleaseLedgerRow[] {
  const rows = pageModules
    .map((pageModule) => {
      const id = moduleId(pageModule)
      const issues = buildPreflightIssues(pageModule)
      const dangerIssues = issues.filter((issue) => issue.severity === 'danger').length
      const warningIssues = issues.filter((issue) => issue.severity === 'warning').length
      const dirty = dirtyIds.has(id)
      const hasDraft = pageModule.has_draft === true
      const hidden = !pageModule.is_visible
      const missingPreview = frameLoaded && pageModule.page_key === currentPageKey && locatedModules[id] !== true
      const highImpactChanges = buildModuleChanges(pageModule, pageModule.live_state).filter(
        (change) => change.severity === 'high',
      ).length

      let tone: VisualReleaseLedgerTone = 'safe'
      let stage = '常规巡检'
      let signal = '无待发布动作'
      let detail = '当前模块没有未保存修改、已保存草稿或明显发布检查提醒。'
      const counters = `${issues.length} 检查 · ${highImpactChanges} 高影响 · ${hasDraft ? '有草稿' : '无草稿'}`
      const score =
        (dirty ? 130 : 0) +
        (hasDraft ? 80 : 0) +
        dangerIssues * 36 +
        warningIssues * 18 +
        highImpactChanges * 14 +
        (missingPreview ? 22 : 0) +
        (hidden ? 12 : 0)

      if (dirty) {
        tone = 'danger'
        stage = '未保存修改'
        signal = '先保存或撤销'
        detail = '当前编辑器内修改还没有进入草稿，离开页面可能丢失；发布前必须先保存或撤销。'
      } else if (hasDraft && dangerIssues > 0) {
        tone = 'danger'
        stage = '草稿发布风险'
        signal = `${dangerIssues} 个阻断提醒`
        detail = issues.find((issue) => issue.severity === 'danger')?.detail ?? '草稿含高风险检查项，发布前先处理字段或素材。'
      } else if (hasDraft && highImpactChanges > 0) {
        tone = 'warning'
        stage = '高影响草稿'
        signal = `${highImpactChanges} 个高影响变更`
        detail = '草稿涉及显示状态、图片、视频、链接或新增条目，发布前需要预览确认。'
      } else if (hasDraft) {
        tone = 'review'
        stage = '待发布草稿'
        signal = '复核后发布'
        detail = '已有保存草稿但尚未发布，先看预览和变更摘要，再决定发布或丢弃。'
      } else if (dangerIssues > 0) {
        tone = 'danger'
        stage = '发布检查'
        signal = `${dangerIssues} 个阻断提醒`
        detail = issues.find((issue) => issue.severity === 'danger')?.detail ?? '当前模块存在发布前高风险提醒。'
      } else if (warningIssues > 0) {
        tone = 'warning'
        stage = '内容复核'
        signal = `${warningIssues} 个提醒`
        detail = issues.find((issue) => issue.severity === 'warning')?.detail ?? '当前模块存在发布前复核提醒。'
      } else if (missingPreview) {
        tone = 'warning'
        stage = '预览定位'
        signal = '未定位到 DOM'
        detail = '当前预览 iframe 中没有找到模块标记，需确认前台模板是否接入该模块。'
      } else if (hidden) {
        tone = 'review'
        stage = '隐藏复核'
        signal = '模块已隐藏'
        detail = '当前模块不显示在前台，确认这符合本轮页面运营计划。'
      }

      return {
        id,
        pageModule,
        page: pageLabel(pageModule.page_key),
        module: readableModuleTitle(pageModule),
        stage,
        signal,
        detail,
        counters,
        tone,
        score,
      }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 10)

  if (rows.length > 0) return rows

  return [
    {
      id: 'release-ledger-safe',
      page: 'Home / About / Global',
      module: '全部受控模块',
      stage: '发布复核',
      signal: '当前无待处理',
      detail: '当前没有未保存修改、已保存草稿、发布检查提醒、隐藏复核或预览定位风险。',
      counters: '0 检查 · 0 高影响 · 无草稿',
      tone: 'safe',
      score: 0,
    },
  ]
}

function VisualReleaseLedger({
  rows,
  onSelectModule,
}: {
  rows: VisualReleaseLedgerRow[]
  onSelectModule: (pageModule: PageModuleRow) => void
}) {
  const priorityCount = rows.filter((row) => row.tone === 'danger').length
  const reviewCount = rows.filter((row) => row.tone === 'warning' || row.tone === 'review').length
  const hasActionableRows = rows.some((row) => row.pageModule)

  return (
    <div className="mt-4 rounded-md border border-[#D8E7E8] bg-white p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[#1E2C31]">发布复核台账</p>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            按未保存、草稿、发布检查、预览定位和隐藏状态生成处理入口，先处理优先项再发布。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#FDE9DF] px-2 py-1 text-xs font-semibold text-[#B54318]">
            优先 {priorityCount}
          </span>
          <span className="rounded-full bg-[#EAF6F8] px-2 py-1 text-xs font-semibold text-[#1889B6]">
            复核 {reviewCount}
          </span>
          <span className="rounded-full bg-[#F7FAFA] px-2 py-1 text-xs font-semibold text-[#61767D]">
            共 {rows.length} 项
          </span>
        </div>
      </div>

      <div className="mt-3 hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] text-xs text-[#61767D]">
              <th className="py-2 pr-3 text-left font-semibold">阶段</th>
              <th className="py-2 pr-3 text-left font-semibold">模块</th>
              <th className="py-2 pr-3 text-left font-semibold">处理信号</th>
              <th className="py-2 pr-3 text-left font-semibold">复核说明</th>
              <th className="py-2 pr-3 text-left font-semibold">计数</th>
              <th className="py-2 text-left font-semibold">入口</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#E6EEEE] last:border-0">
                <td className="py-3 pr-3 align-top">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${visualReleaseLedgerBadgeClass(row.tone)}`}>
                    {visualReleaseLedgerToneLabel(row.tone)}
                  </span>
                  <p className="mt-1 text-xs text-[#61767D]">{row.stage}</p>
                </td>
                <td className="py-3 pr-3 align-top">
                  <p className="font-semibold text-[#1E2C31]">{row.module}</p>
                  <p className="mt-1 text-xs text-[#8A9EA4]">{row.page}</p>
                </td>
                <td className="py-3 pr-3 align-top text-[#1E2C31]">{row.signal}</td>
                <td className="max-w-[320px] py-3 pr-3 align-top text-xs leading-5 text-[#61767D]">{row.detail}</td>
                <td className="py-3 pr-3 align-top text-xs text-[#61767D]">{row.counters}</td>
                <td className="py-3 align-top">
                  {row.pageModule ? (
                    <button
                      type="button"
                      onClick={() => onSelectModule(row.pageModule as PageModuleRow)}
                      className="inline-flex min-h-8 items-center rounded-md border border-[#1889B6] bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#0F6F95]"
                    >
                      进入模块
                    </button>
                  ) : (
                    <span className="text-xs text-[#8A9EA4]">无需处理</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 lg:hidden">
        {rows.map((row) => (
          <div key={row.id} className={`rounded-md border border-l-4 border-[#D8E7E8] p-3 ${visualReleaseLedgerToneClass(row.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1E2C31]">{row.module}</p>
                <p className="mt-1 text-xs text-[#61767D]">{row.page} · {row.stage}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${visualReleaseLedgerBadgeClass(row.tone)}`}>
                {visualReleaseLedgerToneLabel(row.tone)}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#1E2C31]">{row.signal}</p>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">{row.detail}</p>
            <p className="mt-2 text-[11px] text-[#8A9EA4]">{row.counters}</p>
            {row.pageModule ? (
              <button
                type="button"
                onClick={() => onSelectModule(row.pageModule as PageModuleRow)}
                className="mt-3 inline-flex min-h-8 items-center rounded-md border border-[#1889B6] bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#0F6F95]"
              >
                进入模块
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {!hasActionableRows ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700">
          当前台账没有需要下钻的模块。发布前仍建议按 05 流程做前台预览和线上 smoke。
        </p>
      ) : null}
    </div>
  )
}

function VisualMatrixCell({
  label,
  value,
  detail,
  tone = 'gray',
}: {
  label: string
  value: string | number
  detail: string
  tone?: 'green' | 'orange' | 'gray'
}) {
  const valueClass =
    tone === 'orange' ? 'text-[#E36F2C]' : tone === 'green' ? 'text-emerald-700' : 'text-[#1E2C31]'

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-[#61767D]">{label}</p>
        <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function VisualOperationsMatrix({
  currentPage,
  currentPageStats,
  currentModules,
  allModules,
  pageStats,
  dirtyIds,
  locatedModules,
  frameLoaded,
  structureDrafts,
  currentStructureDraft,
  onSelectModule,
}: {
  currentPage: PageMeta
  currentPageStats: PageOperationsStats
  currentModules: PageModuleRow[]
  allModules: PageModuleRow[]
  pageStats: PageOperationsStats[]
  dirtyIds: Set<string>
  locatedModules: Record<string, boolean>
  frameLoaded: boolean
  structureDrafts: PageStructureDraftRow[]
  currentStructureDraft: PageStructureDraftRow | null
  onSelectModule: (pageModule: PageModuleRow) => void
}) {
  const currentMedia = countVisualMedia(currentModules)
  const allMedia = countVisualMedia(allModules)
  const currentLocated = countLocatedModules(currentModules, locatedModules, frameLoaded)
  const totalLocated = countLocatedModules(allModules, locatedModules, frameLoaded)
  const priorityItems = buildVisualPriorityItems(allModules, dirtyIds, locatedModules, frameLoaded)
  const releaseLedgerRows = buildVisualReleaseLedgerRows({
    pageModules: allModules,
    dirtyIds,
    locatedModules,
    frameLoaded,
    currentPageKey: currentPage.key,
  })
  const highImpactDrafts = allModules.filter((pageModule) =>
    pageModule.has_draft && buildModuleChanges(pageModule, pageModule.live_state).some((change) => change.severity === 'high'),
  ).length
  const activeStructureSummary = structureDrafts.reduce(
    (acc, draft) => {
      acc.modules += draft.summary.moduleCount
      acc.added += draft.summary.addedCount
      acc.hidden += draft.summary.hiddenCount
      acc.images += draft.image_refs.length || draft.summary.imageCount
      return acc
    },
    { modules: 0, added: 0, hidden: 0, images: 0 },
  )
  const highestIssuePage = [...pageStats].sort((a, b) => b.issueCount - a.issueCount)[0] ?? currentPageStats

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E2C31]">
            <MousePointer2 size={16} className="text-[#1889B6]" />
            <span>视觉运营矩阵</span>
          </div>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-[#61767D]">
            按 300 后台常见操作心智先看发布阻塞、预览覆盖、视觉素材、转化链接和结构草稿，再进入模块编辑。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          当前：{currentPage.label} · {currentPage.path}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <VisualMatrixCell
          label="当前页发布队列"
          value={`${currentPageStats.draftCount + currentPageStats.unsavedCount}`}
          detail={`${currentPageStats.draftCount} 个已保存草稿，${currentPageStats.unsavedCount} 个未保存修改`}
          tone={currentPageStats.draftCount + currentPageStats.unsavedCount > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="预览定位覆盖"
          value={frameLoaded ? `${currentLocated.located}/${currentPageStats.moduleCount}` : '检测中'}
          detail={frameLoaded ? `${currentLocated.missing} 个模块未在预览中定位` : '等待 iframe 加载后检测 DOM 标记'}
          tone={frameLoaded && currentLocated.missing === 0 ? 'green' : 'orange'}
        />
        <VisualMatrixCell
          label="视觉素材信号"
          value={`${currentMedia.images + currentMedia.videos}`}
          detail={`${currentMedia.images} 图 / ${currentMedia.videos} 视频，${currentMedia.missingMedia} 个可见素材位为空`}
          tone={currentMedia.missingMedia > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="链接与转化"
          value={currentMedia.links}
          detail={`${currentMedia.badLinks} 个链接格式提醒；只检查当前已加载字段`}
          tone={currentMedia.badLinks > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="全局发布风险"
          value={highestIssuePage.issueCount}
          detail={`${highestIssuePage.label} 检查项最多；全站隐藏模块 ${pageStats.reduce((total, page) => total + page.hiddenCount, 0)} 个`}
          tone={highestIssuePage.issueCount > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="高影响草稿"
          value={highImpactDrafts}
          detail="涉及显示状态、图片、视频、链接或新增条目的已保存草稿"
          tone={highImpactDrafts > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="结构草稿影响"
          value={structureDrafts.length}
          detail={`${activeStructureSummary.added} 新增 / ${activeStructureSummary.hidden} 隐藏 / ${activeStructureSummary.images} 图片引用`}
          tone={structureDrafts.length > 0 ? 'orange' : 'gray'}
        />
        <VisualMatrixCell
          label="全站预览覆盖"
          value={frameLoaded ? `${totalLocated.located}/${allModules.length}` : '检测中'}
          detail={`${allMedia.images} 图 / ${allMedia.links} 链接；当前结构草稿 ${currentStructureDraft ? structureDraftStatusLabel(currentStructureDraft.draft_status) : '暂无'}`}
          tone={frameLoaded && totalLocated.missing === 0 ? 'green' : 'orange'}
        />
      </div>

      <VisualReleaseLedger rows={releaseLedgerRows} onSelectModule={onSelectModule} />

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#1E2C31]">优先处理队列</p>
              <p className="mt-1 text-xs leading-5 text-[#61767D]">
                按未保存、已保存草稿、发布检查、预览定位和隐藏状态排序。
              </p>
            </div>
            <span className="rounded-full bg-[#F0F7F8] px-2 py-1 text-xs font-semibold text-[#1889B6]">
              {priorityItems.length} 项
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {priorityItems.length > 0 ? (
              priorityItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectModule(item.pageModule)}
                  className="flex w-full items-start justify-between gap-3 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2 text-left transition hover:border-[#1889B6]/65 hover:bg-white"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#1E2C31]">
                      {pageLabel(item.pageModule.page_key)} / {readableModuleTitle(item.pageModule)}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#61767D]">
                      {item.reason}；检查项 {item.issueCount} 个，高影响变更 {item.highImpactChanges} 个。
                    </span>
                  </span>
                  <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-[#1889B6]" />
                </button>
              ))
            ) : (
              <p className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-3 text-xs leading-5 text-[#61767D]">
                当前没有未保存、草稿、发布检查或预览定位风险。
              </p>
            )}
          </div>
        </div>

        <div className="rounded-md border border-[#D8E7E8] bg-white p-3">
          <p className="text-sm font-bold text-[#1E2C31]">页面分布</p>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">用于快速判断哪一页先进入发布复核。</p>
          <div className="mt-3 space-y-2">
            {pageStats.map((page) => (
              <div key={page.key} className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#1E2C31]">{page.label}</p>
                  <p className="text-xs font-semibold text-[#1889B6]">{page.moduleCount} 模块</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#61767D]">
                  草稿 {page.draftCount} / 未保存 {page.unsavedCount} / 检查项 {page.issueCount} / 隐藏 {page.hiddenCount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function PageVisualEditorClient({
  initialModules,
  initialStructureDrafts = [],
  initialStructureSnapshots,
  currentAdminRole = 'operator',
  maxUploadMb = 20,
}: {
  initialModules: PageModuleRow[]
  initialStructureDrafts?: PageStructureDraftRow[]
  initialStructureSnapshots?: Record<PageKey, PageStructureSnapshotRow[]>
  currentAdminRole?: 'admin' | 'operator'
  maxUploadMb?: number
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})
  const [modules, setModules] = useState(() => filterEditableModules(initialModules).map(cloneModule))
  const [savedModules, setSavedModules] = useState(() => filterEditableModules(initialModules).map(cloneModule))
  const [selectedPage, setSelectedPage] = useState<PageKey>('home')
  const [selectedModuleId, setSelectedModuleId] = useState('home:hero')
  const [selectedField, setSelectedField] = useState<FieldSelection>({ itemId: null, field: null })
  const [locatedModules, setLocatedModules] = useState<Record<string, boolean>>({})
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [frameVersion, setFrameVersion] = useState(0)
  const [previewVersion, setPreviewVersion] = useState(0)
  const [previewDevice, setPreviewDevice] = useState<PreviewDeviceKey>('desktop')
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [discardDraftConfirmOpen, setDiscardDraftConfirmOpen] = useState(false)
  const [discardingDraft, setDiscardingDraft] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<PageModuleSnapshotRow[]>([])
  const [snapshotsLoading, setSnapshotsLoading] = useState(false)
  const [restoreSnapshot, setRestoreSnapshot] = useState<PageModuleSnapshotRow | null>(null)
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null)
  const [structureDrafts, setStructureDrafts] = useState<PageStructureDraftRow[]>(initialStructureDrafts)
  const [structureSnapshots, setStructureSnapshots] = useState<Record<PageKey, PageStructureSnapshotRow[]>>(
    initialStructureSnapshots ?? { home: [], about: [], global: [] },
  )
  const [structureBusy, setStructureBusy] = useState<string | null>(null)
  const [structurePublishConfirmOpen, setStructurePublishConfirmOpen] = useState(false)
  const [structureDiscardConfirmOpen, setStructureDiscardConfirmOpen] = useState(false)
  const [structureRestoreSnapshot, setStructureRestoreSnapshot] = useState<PageStructureSnapshotRow | null>(null)

  const currentPage = PAGES.find((page) => page.key === selectedPage) ?? PAGES[0]
  const currentStructureDraft = structureDrafts.find((draft) => draft.page_key === selectedPage) ?? null
  const currentStructureSnapshots = structureSnapshots[selectedPage] ?? []
  const currentStructureRestoreSummary = structureRestoreSnapshot
    ? structureSnapshotSummary(structureRestoreSnapshot)
    : null
  const canPublishStructureDraft = currentAdminRole === 'admin'
  const currentModules = useMemo(
    () => modules.filter((pageModule) => pageModule.page_key === selectedPage),
    [modules, selectedPage],
  )
  const active = currentModules.find((pageModule) => moduleId(pageModule) === selectedModuleId) ?? currentModules[0]
  const activeModuleId = active ? moduleId(active) : ''
  const activePageKey = active?.page_key ?? ''
  const activeModuleKey = active?.module_key ?? ''
  const activeItems = useMemo(() => (active ? sortedItems(active.items) : []), [active])
  const currentStructureModulesByKey = useMemo(
    () => new Map((currentStructureDraft?.modules ?? []).map((pageModule) => [pageModule.moduleKey, pageModule])),
    [currentStructureDraft],
  )
  const currentSafeStructureModules = useMemo(
    () => selectedPage === 'home'
      ? (currentStructureDraft?.modules ?? [])
          .filter(isSafeHomeStructureModule)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.moduleKey.localeCompare(b.moduleKey))
      : [],
    [currentStructureDraft, selectedPage],
  )
  const activeStructureModule = active ? currentStructureModulesByKey.get(active.module_key) ?? null : null
  const activeIsDraftAdded = activeStructureModule?.status === 'added'
  const activeIsStructureManagedTemplate = activeStructureModule ? isSafeHomeStructureModule(activeStructureModule) : false
  const activeHasSavedDraft = active?.has_draft === true
  const activeDraftUpdatedAt = active?.draft_updated_at ? formatSnapshotTime(active.draft_updated_at) : null
  const activeLiveUpdatedAt = active?.live_updated_at ? formatSnapshotTime(active.live_updated_at) : null
  const canManageRepeatedItems = active ? supportsRepeatedItems(active) : false
  const activeItemToDelete = active && deleteItemId ? active.items.find((item) => item.id === deleteItemId) : null
  const activeItemToDeleteIndex = activeItemToDelete
    ? activeItems.findIndex((item) => item.id === activeItemToDelete.id)
    : -1
  const activeItemToDeleteSummary = activeItemToDelete ? itemSummary(activeItemToDelete) : null
  const restoreSnapshotSummary = restoreSnapshot ? snapshotSummary(restoreSnapshot) : null
  const selectedLocated = active ? locatedModules[activeModuleId] === true : false
  const formEditorHref = active ? `/admin/pages?module=${activeModuleId}` : '/admin/pages'
  const previewSrc = useMemo(() => buildPreviewSrc(currentPage.path, previewVersion), [currentPage.path, previewVersion])
  const currentPreviewDevice = PREVIEW_DEVICES.find((device) => device.key === previewDevice) ?? PREVIEW_DEVICES[0]

  const dirtyIds = useMemo(() => {
    const savedById = new Map(savedModules.map((pageModule) => [moduleId(pageModule), pageModule]))
    return new Set(
      modules
        .filter((pageModule) => !modulesEqual(pageModule, savedById.get(moduleId(pageModule))))
        .map(moduleId),
    )
  }, [modules, savedModules])

  const activeHasUnsavedChanges = active ? dirtyIds.has(activeModuleId) : false
  const hasAnyUnsavedChanges = dirtyIds.size > 0
  const pageStats = useMemo<PageOperationsStats[]>(
    () =>
      PAGES.map((page) => {
        const pageModules = modules.filter((pageModule) => pageModule.page_key === page.key)
        const draftCount = pageModules.filter((pageModule) => pageModule.has_draft).length
        const hiddenCount = pageModules.filter((pageModule) => !pageModule.is_visible).length
        const unsavedCount = pageModules.filter((pageModule) => dirtyIds.has(moduleId(pageModule))).length
        const issueCount = pageModules.reduce((total, pageModule) => total + buildPreflightIssues(pageModule).length, 0)

        return {
          ...page,
          moduleCount: pageModules.length,
          draftCount,
          hiddenCount,
          unsavedCount,
          issueCount,
        }
      }),
    [dirtyIds, modules],
  )
  const currentPageStats = pageStats.find((page) => page.key === selectedPage) ?? pageStats[0]
  const totalDraftModules = pageStats.reduce((total, page) => total + page.draftCount, 0)
  const totalUnsavedModules = pageStats.reduce((total, page) => total + page.unsavedCount, 0)
  const totalPreflightIssues = pageStats.reduce((total, page) => total + page.issueCount, 0)
  const totalHiddenModules = pageStats.reduce((total, page) => total + page.hiddenCount, 0)
  const structureDraftCount = structureDrafts.length
  const activeLiveState = active?.live_state ?? null
  const activeDraftChanges = useMemo(
    () => (active ? buildModuleChanges(active, activeLiveState) : []),
    [active, activeLiveState],
  )
  const activeSavedModule = useMemo(
    () => savedModules.find((pageModule) => moduleId(pageModule) === activeModuleId),
    [activeModuleId, savedModules],
  )
  const activeUnsavedChanges = useMemo(
    () => (active && activeSavedModule ? buildModuleChanges(active, activeSavedModule) : []),
    [active, activeSavedModule],
  )
  const activePreflightIssues = useMemo(() => buildPreflightIssues(active), [active])

  useUnsavedChangesWarning(
    hasAnyUnsavedChanges,
    '可视化编辑器有未保存的草稿修改。离开此页会丢失这些修改，确定离开吗？',
  )

  const updateLocatedModules = useCallback(() => {
    const doc = getIframeDocument(iframeRef.current)
    if (!doc) return

    const next = currentModules.reduce<Record<string, boolean>>((acc, pageModule) => {
      acc[moduleId(pageModule)] = Boolean(doc.querySelector(moduleSelector(moduleId(pageModule))))
      return acc
    }, {})

    setLocatedModules((prev) => (sameRecord(prev, next) ? prev : next))
  }, [currentModules])

  const updateHighlight = useCallback(() => {
    const iframe = iframeRef.current
    const doc = getIframeDocument(iframe)
    if (!iframe || !doc || !active) {
      setHighlightRect(null)
      return
    }

    const target = doc.querySelector<HTMLElement>(moduleSelector(activeModuleId))
    if (!target) {
      setHighlightRect(null)
      return
    }

    const rect = target.getBoundingClientRect()
    setHighlightRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })
  }, [active, activeModuleId])

  const refreshFrameState = useCallback(() => {
    updateLocatedModules()
    updateHighlight()
  }, [updateHighlight, updateLocatedModules])

  const patchActive = useCallback((patch: Partial<PageModuleRow>) => {
    if (!active) return
    setModules((prev) => prev.map((pageModule) => (
      moduleId(pageModule) === activeModuleId ? { ...pageModule, ...patch } : pageModule
    )))
  }, [active, activeModuleId])

  const patchItem = useCallback((id: string, patch: Partial<PageModuleItem>) => {
    if (!active) return
    patchActive({
      items: active.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })
  }, [active, patchActive])

  const loadSnapshots = useCallback(async () => {
    if (!activePageKey || !activeModuleKey) {
      setSnapshots([])
      return
    }

    setSnapshotsLoading(true)
    try {
      const res = await fetch(`/api/admin/page-modules/${activePageKey}/${activeModuleKey}/snapshots?limit=12`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '读取版本快照失败')
      setSnapshots(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      setSnapshots([])
      toast.error(err instanceof Error ? err.message : '读取版本快照失败')
    } finally {
      setSnapshotsLoading(false)
    }
  }, [activeModuleKey, activePageKey])

  useEffect(() => {
    void loadSnapshots()
  }, [loadSnapshots])

  const addItem = useCallback(() => {
    if (!active || !canManageRepeatedItems) return
    if (active.items.length >= 80) {
      toast.error('当前模块项目数量已达到上限')
      return
    }

    const maxSort = active.items.reduce((max, item) => Math.max(max, Number(item.sort_order) || 0), 0)
    const isHomeCardModule = active.page_key === 'home' && HOME_CARD_MODULE_TYPES.has(active.module_type)
    const nextCardNumber = isHomeCardModule
      ? active.items.reduce((max, item) => {
          const match = item.id.match(/^card-(\d+)$/)
          const value = match ? Number(match[1]) : 0
          return Number.isFinite(value) ? Math.max(max, value) : max
        }, 0) + 1
      : 0
    const item: PageModuleItem = {
      id: isHomeCardModule
        ? `card-${String(nextCardNumber).padStart(2, '0')}`
        : `${active.module_key}-item-${Date.now()}`,
      label_zh: '新项目',
      label_en: 'New item',
      is_visible: true,
      sort_order: maxSort + 10,
    }

    if (active.module_type.includes('gallery') || isHomeCardModule) {
      item.image_url = ''
    }
    if (active.module_type === 'stats' || isHomeCardModule) {
      item.value_zh = ''
      item.value_en = ''
    }
    if (active.module_type === 'list' || isHomeCardModule) {
      item.content_zh = ''
      item.content_en = ''
    }
    if (isHomeCardModule) {
      item.href = ''
      item.video_url = ''
      item.video_poster_url = ''
    }

    patchActive({ items: [...active.items, item] })
    setSelectedField({ itemId: item.id, field: 'label_zh' })
    toast.message('已新增项目，保存草稿和发布前不会影响前台')
  }, [active, canManageRepeatedItems, patchActive])

  const moveItem = useCallback((id: string, direction: -1 | 1) => {
    if (!active) return
    const items = sortedItems(active.items)
    const index = items.findIndex((item) => item.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return

    const next = [...items]
    const currentItem = next[index]
    const targetItem = next[nextIndex]
    if (!currentItem || !targetItem) return
    next[index] = targetItem
    next[nextIndex] = currentItem

    patchActive({
      items: next.map((item, itemIndex) => ({
        ...item,
        sort_order: (itemIndex + 1) * 10,
      })),
    })
    setSelectedField({ itemId: id, field: null })
  }, [active, patchActive])

  const confirmDeleteItem = useCallback(() => {
    if (!active || !deleteItemId || !canManageRepeatedItems) return
    patchItem(deleteItemId, { is_visible: false })
    setSelectedField({ itemId: null, field: null })
    setDeleteItemId(null)
    toast.message('已隐藏项目，保存草稿和发布后才会影响前台')
  }, [active, canManageRepeatedItems, deleteItemId, patchItem])

  const scrollModuleIntoView = useCallback((id: string) => {
    const doc = getIframeDocument(iframeRef.current)
    const target = doc?.querySelector<HTMLElement>(moduleSelector(id))
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(refreshFrameState, 350)
  }, [refreshFrameState])

  const handleSelectModule = (pageModule: PageModuleRow) => {
    const id = moduleId(pageModule)
    setSelectedModuleId(id)
    setSelectedField({ itemId: null, field: null })
    scrollModuleIntoView(id)
    window.setTimeout(refreshFrameState, 0)
  }

  const handleSelectPage = (pageKey: PageKey) => {
    const nextModule = modules.find((pageModule) => pageModule.page_key === pageKey)
    if (!nextModule) return

    setSelectedPage(pageKey)
    setSelectedModuleId(moduleId(nextModule))
    setSelectedField({ itemId: null, field: null })
    setLocatedModules({})
    setHighlightRect(null)
    setFrameLoaded(false)
  }

  const requestSave = () => {
    if (!active) return
    if (!activeHasUnsavedChanges) {
      toast.message('当前模块没有未保存的草稿修改')
      return
    }
    setConfirmOpen(true)
  }

  const discardActiveChanges = () => {
    if (!active) return
    const saved = savedModules.find((pageModule) => moduleId(pageModule) === activeModuleId)
    if (!saved) return

    setModules((prev) => prev.map((pageModule) => (
      moduleId(pageModule) === activeModuleId ? cloneModule(saved) : pageModule
    )))
    setSelectedField({ itemId: null, field: null })
    toast.message('已撤销当前模块的未保存草稿修改')
  }

  const saveActiveModule = async () => {
    if (!active) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/page-modules/${active.page_key}/${active.module_key}/draft`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title_zh: active.title_zh,
          title_en: active.title_en,
          description_zh: active.description_zh,
          description_en: active.description_en,
          items: active.items,
          is_visible: active.is_visible,
          sort_order: active.sort_order,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '保存失败')

      const saved = data.data as PageModuleRow
      const savedId = moduleId(saved)
      setModules((prev) => prev.map((pageModule) => (moduleId(pageModule) === savedId ? cloneModule(saved) : pageModule)))
      setSavedModules((prev) => prev.map((pageModule) => (moduleId(pageModule) === savedId ? cloneModule(saved) : pageModule)))
      setSelectedModuleId(savedId)
      setConfirmOpen(false)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('草稿已保存，前台不会变化。确认无误后再发布。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const requestPublish = () => {
    if (!active) return
    if (activeHasUnsavedChanges) {
      toast.error('请先保存草稿，再发布到前台')
      return
    }
    if (!activeHasSavedDraft) {
      toast.message('当前模块没有已保存草稿')
      return
    }
    if (activePreflightIssues.length > 0) {
      toast.warning(`发布前检查发现 ${activePreflightIssues.length} 项提醒，请在确认弹窗中复核`)
    }
    setPublishConfirmOpen(true)
  }

  const publishActiveDraft = async () => {
    if (!active) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/page-modules/${active.page_key}/${active.module_key}/draft/publish`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '发布失败')

      const published = data.data as PageModuleRow
      const publishedId = moduleId(published)
      setModules((prev) => prev.map((pageModule) => (
        moduleId(pageModule) === publishedId ? cloneModule(published) : pageModule
      )))
      setSavedModules((prev) => prev.map((pageModule) => (
        moduleId(pageModule) === publishedId ? cloneModule(published) : pageModule
      )))
      setSelectedModuleId(publishedId)
      setPublishConfirmOpen(false)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      void loadSnapshots()
      toast.success('草稿已发布，前台页面已更新')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发布失败')
    } finally {
      setPublishing(false)
    }
  }

  const discardSavedDraft = async () => {
    if (!active) return
    setDiscardingDraft(true)
    try {
      const res = await fetch(`/api/admin/page-modules/${active.page_key}/${active.module_key}/draft`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '丢弃草稿失败')

      const live = withLiveState(data.data as PageModuleRow)
      const liveId = moduleId(live)
      setModules((prev) => prev.map((pageModule) => (
        moduleId(pageModule) === liveId ? cloneModule(live) : pageModule
      )))
      setSavedModules((prev) => prev.map((pageModule) => (
        moduleId(pageModule) === liveId ? cloneModule(live) : pageModule
      )))
      setSelectedModuleId(liveId)
      setSelectedField({ itemId: null, field: null })
      setDiscardDraftConfirmOpen(false)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('已丢弃草稿，当前模块回到线上版本')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '丢弃草稿失败')
    } finally {
      setDiscardingDraft(false)
    }
  }

  const restoreSelectedSnapshot = async () => {
    if (!active || !restoreSnapshot) return

    setRestoringSnapshotId(restoreSnapshot.id)
    try {
      const res = await fetch(
        `/api/admin/page-modules/${active.page_key}/${active.module_key}/snapshots/${restoreSnapshot.id}/draft`,
        { method: 'POST' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '恢复快照失败')

      const restored = data.data as PageModuleRow
      const restoredId = moduleId(restored)
      setModules((prev) => prev.map((pageModule) => (
        moduleId(pageModule) === restoredId ? cloneModule(restored) : pageModule
      )))
      setSavedModules((prev) => prev.map((pageModule) => (
        moduleId(pageModule) === restoredId ? cloneModule(restored) : pageModule
      )))
      setSelectedModuleId(restoredId)
      setSelectedField({ itemId: null, field: null })
      setRestoreSnapshot(null)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('已恢复到草稿，前台不会变化。确认无误后再发布。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '恢复快照失败')
    } finally {
      setRestoringSnapshotId(null)
    }
  }

  const upsertStructureDraft = (draft: PageStructureDraftRow) => {
    setStructureDrafts((prev) => {
      const rest = prev.filter((item) => item.page_key !== draft.page_key)
      return [...rest, draft]
    })
  }

  const removeStructureDraft = (pageKey: PageKey) => {
    setStructureDrafts((prev) => prev.filter((draft) => draft.page_key !== pageKey))
  }

  const loadStructureSnapshots = async (pageKey: PageKey = selectedPage) => {
    setStructureBusy(`snapshots:${pageKey}`)
    try {
      const res = await fetch(`/api/admin/page-structures/${pageKey}/snapshots?limit=8`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '读取页面级快照失败')
      setStructureSnapshots((prev) => ({
        ...prev,
        [pageKey]: (data.data ?? []) as PageStructureSnapshotRow[],
      }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '读取页面级快照失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const reloadPreviewModules = async (pageKey: PageKey) => {
    const sp = new URLSearchParams({ draft: '1', visualPreview: String(Date.now()) })
    const res = await fetch(`/api/page-modules/${pageKey}?${sp.toString()}`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !Array.isArray(data.data)) {
      throw new Error(typeof data.error === 'string' ? data.error : '刷新页面模块失败')
    }

    const nextModules = filterEditableModules(data.data as PageModuleRow[]).map(cloneModule)
    setModules((prev) => [
      ...prev.filter((pageModule) => pageModule.page_key !== pageKey),
      ...nextModules,
    ])
    setSavedModules((prev) => [
      ...prev.filter((pageModule) => pageModule.page_key !== pageKey),
      ...nextModules.map(cloneModule),
    ])
    return nextModules
  }

  const addStructureModule = async (templateId: PageModuleTemplateId) => {
    if (selectedPage !== 'home') {
      toast.error('C4-2c 只支持 Home 新增模块')
      return
    }
    if (hasAnyUnsavedChanges) {
      toast.error('请先保存或撤销当前未保存修改，再新增结构模块')
      return
    }

    setStructureBusy(`add:${templateId}`)
    try {
      const res = await fetch('/api/admin/page-structures/home/draft/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '新增结构模块失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      const nextModules = await reloadPreviewModules('home')
      const added = data.module as PageModuleRow | undefined
      if (added?.module_key) {
        setSelectedPage('home')
        setSelectedModuleId(`home:${added.module_key}`)
      } else if (nextModules[0]) {
        setSelectedModuleId(moduleId(nextModules[0]))
      }
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('模块已添加到 Home 结构草稿，普通前台暂不可见。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新增结构模块失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const deleteAddedStructureModule = async (pageModule: PageModuleRow) => {
    if (pageModule.page_key !== 'home') return
    if (hasAnyUnsavedChanges) {
      toast.error('请先保存或撤销当前未保存修改，再删除草稿新增模块')
      return
    }

    setStructureBusy(`delete-added:${pageModule.module_key}`)
    try {
      const res = await fetch(`/api/admin/page-structures/home/draft/modules/${pageModule.module_key}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '删除草稿新增模块失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      const nextModules = await reloadPreviewModules('home')
      const nextActive = nextModules.find((item) => item.page_key === selectedPage) ?? nextModules[0]
      if (nextActive) setSelectedModuleId(moduleId(nextActive))
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('草稿新增模块已删除，不影响线上页面。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除草稿新增模块失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const reorderSafeStructureModules = async (moduleKeys: string[]) => {
    if (selectedPage !== 'home') return

    setStructureBusy('reorder:home')
    try {
      const res = await fetch('/api/admin/page-structures/home/draft/modules/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleKeys }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '调整结构排序失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      await reloadPreviewModules('home')
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('结构草稿排序已更新，普通前台暂不变化。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '调整结构排序失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const moveSafeStructureModule = async (moduleKey: string, direction: -1 | 1) => {
    const moduleKeys = currentSafeStructureModules.map((pageModule) => pageModule.moduleKey)
    const index = moduleKeys.indexOf(moduleKey)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= moduleKeys.length) return

    const next = [...moduleKeys]
    const current = next[index]
    next[index] = next[nextIndex]
    next[nextIndex] = current
    await reorderSafeStructureModules(next)
  }

  const setStructureModuleVisibility = async (moduleKey: string, isVisible: boolean) => {
    if (selectedPage !== 'home') return

    setStructureBusy(`visibility:${moduleKey}`)
    try {
      const res = await fetch(`/api/admin/page-structures/home/draft/modules/${encodeURIComponent(moduleKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '调整结构显示状态失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      await reloadPreviewModules('home')
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success(isVisible ? '结构草稿模块已恢复显示。' : '结构草稿模块已隐藏。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '调整结构显示状态失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const createStructureDraft = async () => {
    const pageKey = selectedPage
    setStructureBusy(`create:${pageKey}`)
    try {
      const res = await fetch(`/api/admin/page-structures/${pageKey}/draft`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '创建结构草稿失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('页面级结构草稿已创建。当前不会影响前台。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建结构草稿失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const discardStructureDraft = async () => {
    const pageKey = selectedPage
    setStructureBusy(`discard:${pageKey}`)
    try {
      const res = await fetch(`/api/admin/page-structures/${pageKey}/draft`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '丢弃结构草稿失败')

      removeStructureDraft(pageKey)
      const nextModules = await reloadPreviewModules(pageKey)
      const nextActive = nextModules.find((item) => item.page_key === pageKey)
      if (nextActive) setSelectedModuleId(moduleId(nextActive))
      setStructureDiscardConfirmOpen(false)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('页面级结构草稿已丢弃，预览回到线上结构。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '丢弃结构草稿失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const publishStructureDraft = async () => {
    if (!currentStructureDraft) return
    if (!canPublishStructureDraft) {
      toast.error('仅 admin 可发布结构草稿')
      return
    }

    const pageKey = selectedPage
    setStructureBusy(`publish:${pageKey}`)
    try {
      const res = await fetch(`/api/admin/page-structures/${pageKey}/draft/publish`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409 && data.data) upsertStructureDraft(data.data as PageStructureDraftRow)
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : res.status === 403
              ? '只有 admin 可以发布页面结构草稿'
              : '发布结构草稿失败',
        )
      }

      const publishedModules = Array.isArray(data.modules) ? data.modules as PageModuleRow[] : []
      if (publishedModules.length > 0) {
        const nextModules = filterEditableModules(publishedModules).map(cloneModule)
        setModules((prev) => [
          ...prev.filter((pageModule) => pageModule.page_key !== pageKey),
          ...nextModules,
        ])
        setSavedModules((prev) => [
          ...prev.filter((pageModule) => pageModule.page_key !== pageKey),
          ...nextModules.map(cloneModule),
        ])
      }

      removeStructureDraft(pageKey)
      setStructurePublishConfirmOpen(false)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      void loadStructureSnapshots(pageKey)
      toast.success('页面结构草稿已发布，前台结构已更新。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发布结构草稿失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const restoreStructureSnapshotToDraft = async () => {
    if (!structureRestoreSnapshot) return
    setStructureBusy(`restore:${selectedPage}`)
    try {
      const res = await fetch(
        `/api/admin/page-structures/${selectedPage}/snapshots/${structureRestoreSnapshot.id}/draft`,
        { method: 'POST' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '恢复页面级快照失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      await reloadPreviewModules(selectedPage)
      setStructureRestoreSnapshot(null)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('页面级快照已恢复到结构草稿，前台不会立即变化。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '恢复页面级快照失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const bindFieldRef = (itemId: string, field: string) => (node: HTMLElement | null) => {
    if (!activeModuleId) return
    fieldRefs.current[editorFieldKey(activeModuleId, itemId, field)] = node
  }

  const isSelectedField = (itemId: string, field: string) => (
    selectedField.itemId === itemId && selectedField.field === field
  )

  const fieldClassName = (itemId: string, field: string) => (
    `rounded-md border bg-white p-2 transition-colors ${
      isSelectedField(itemId, field) ? 'border-[#E36F2C] shadow-[0_0_0_3px_rgba(227,111,44,0.12)]' : 'border-[#E5DED4]'
    }`
  )

  useEffect(() => {
    if (!frameLoaded) return

    const iframe = iframeRef.current
    const doc = getIframeDocument(iframe)
    const frameWindow = iframe?.contentWindow ?? null
    if (!doc || !frameWindow) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const moduleEl = target.closest('[data-page-module]') as HTMLElement | null
      if (!moduleEl) return

      const id = moduleEl.dataset.pageModule
      const pageModule = modules.find((item) => moduleId(item) === id)
      if (!id || !pageModule || pageModule.page_key !== selectedPage) return

      event.preventDefault()
      event.stopPropagation()

      const itemEl = target.closest('[data-page-module-item]') as HTMLElement | null
      const fieldEl = target.closest('[data-page-module-field]') as HTMLElement | null
      setSelectedModuleId(id)
      setSelectedField({
        itemId: itemEl?.dataset.pageModuleItem ?? null,
        field: fieldEl?.dataset.pageModuleField ?? itemEl?.dataset.pageModuleField ?? null,
      })
      window.requestAnimationFrame(refreshFrameState)
    }

    const handleFrameUpdate = () => refreshFrameState()

    doc.addEventListener('click', handleClick, true)
    frameWindow.addEventListener('scroll', handleFrameUpdate, { passive: true })
    frameWindow.addEventListener('resize', handleFrameUpdate)
    window.addEventListener('resize', handleFrameUpdate)
    const frame = window.requestAnimationFrame(refreshFrameState)

    return () => {
      window.cancelAnimationFrame(frame)
      doc.removeEventListener('click', handleClick, true)
      frameWindow.removeEventListener('scroll', handleFrameUpdate)
      frameWindow.removeEventListener('resize', handleFrameUpdate)
      window.removeEventListener('resize', handleFrameUpdate)
    }
  }, [frameLoaded, frameVersion, modules, refreshFrameState, selectedPage])

  useEffect(() => {
    if (!frameLoaded) return

    const frame = window.requestAnimationFrame(refreshFrameState)
    return () => window.cancelAnimationFrame(frame)
  }, [frameLoaded, refreshFrameState, selectedModuleId])

  useEffect(() => {
    if (!frameLoaded) return

    const timer = window.setTimeout(refreshFrameState, 120)
    return () => window.clearTimeout(timer)
  }, [frameLoaded, previewDevice, refreshFrameState])

  useEffect(() => {
    if (!activeModuleId || !selectedField.itemId || !selectedField.field) return

    const node = fieldRefs.current[editorFieldKey(activeModuleId, selectedField.itemId, selectedField.field)]
    if (!node) return

    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const control = node.querySelector<HTMLElement>('input, textarea, button')
    control?.focus({ preventScroll: true })
  }, [activeModuleId, selectedField.field, selectedField.itemId])

  const handleFrameLoad = () => {
    setFrameLoaded(true)
    setFrameVersion((value) => value + 1)
    window.setTimeout(refreshFrameState, 0)
    window.setTimeout(refreshFrameState, 600)
  }

  if (!active) {
    return (
      <div className="rounded-lg border border-dashed border-[#E5DED4] bg-white p-12 text-center text-sm text-[#8A8580]">
        当前没有可视化页面模块。
      </div>
    )
  }

  return (
    <div className={`flex min-h-[calc(100vh-8rem)] flex-col gap-5 ${activeHasUnsavedChanges ? 'pb-24' : ''}`}>
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1889B6]">Visual Operations</p>
            <h1 className="mt-2 text-2xl font-bold text-[#1E2C31] md:text-3xl">
              页面模块运营台
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#61767D]">
              受控编辑 Home / About / Global 的文字、链接、图片、模块显示状态和 Home 安全插入区结构草稿。保存草稿不影响前台，发布后才上线。
            </p>

            <div className="mt-4 flex flex-wrap gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-1">
              {PAGES.map((page) => {
                const activePage = page.key === selectedPage
                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => handleSelectPage(page.key)}
                    className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold transition ${
                      activePage ? 'bg-[#1889B6] text-white shadow-sm' : 'text-[#1E2C31] hover:bg-white hover:text-[#1889B6]'
                    }`}
                  >
                    {page.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Publish Desk</p>
                <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">发布状态</h2>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                hasAnyUnsavedChanges ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {hasAnyUnsavedChanges ? `${dirtyIds.size} 个未保存` : '无未保存'}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <VisualStatusItem
                label="当前页面"
                value={currentPage.label}
                detail={`${currentPage.path} · ${currentPageStats.moduleCount} 个模块`}
                tone="gray"
              />
              <VisualStatusItem
                label="当前模块"
                value={readableModuleTitle(active)}
                detail={activeHasSavedDraft ? '有已保存草稿，发布后影响前台。' : '当前使用线上版本。'}
                tone={activeHasSavedDraft ? 'orange' : 'green'}
              />
              <VisualStatusItem
                label="预览设备"
                value={currentPreviewDevice.label}
                detail={frameLoaded ? '草稿预览已加载。' : '预览加载中。'}
                tone={frameLoaded ? 'green' : 'gray'}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setFrameLoaded(false)
                  setPreviewVersion(Date.now())
                }}
              >
                <RefreshCcw size={14} />
                刷新预览
              </Button>
              <Link
                href={currentPage.path}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/65 hover:text-[#1889B6]"
              >
                <ArrowUpRight size={14} />
                真实前台
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <VisualMetricCard
          title="模块草稿"
          value={totalDraftModules}
          detail="已保存但未发布的模块草稿"
          Icon={Save}
          tone={totalDraftModules > 0 ? 'orange' : 'green'}
        />
        <VisualMetricCard
          title="未保存修改"
          value={totalUnsavedModules}
          detail="离开页面前需要保存或撤销"
          Icon={Clock3}
          tone={totalUnsavedModules > 0 ? 'orange' : 'green'}
        />
        <VisualMetricCard
          title="发布检查项"
          value={totalPreflightIssues}
          detail={`隐藏模块 ${totalHiddenModules} 个`}
          Icon={CheckCircle2}
          tone={totalPreflightIssues > 0 ? 'orange' : 'green'}
        />
        <VisualMetricCard
          title="结构草稿"
          value={structureDraftCount}
          detail="Home / About / Global 页面级结构草稿"
          Icon={Layers3}
          tone={structureDraftCount > 0 ? 'orange' : 'gray'}
        />
      </div>

      <VisualOperationsMatrix
        currentPage={currentPage}
        currentPageStats={currentPageStats}
        currentModules={currentModules}
        allModules={modules}
        pageStats={pageStats}
        dirtyIds={dirtyIds}
        locatedModules={locatedModules}
        frameLoaded={frameLoaded}
        structureDrafts={structureDrafts}
        currentStructureDraft={currentStructureDraft}
        onSelectModule={handleSelectModule}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {pageStats.map((page) => {
          const isActive = page.key === selectedPage
          return (
            <button
              key={page.key}
              type="button"
              onClick={() => handleSelectPage(page.key)}
              className={`rounded-md border bg-white p-4 text-left shadow-sm transition ${
                isActive ? 'border-[#1889B6] ring-2 ring-[#1889B6]/10' : 'border-[#D8E7E8] hover:border-[#1889B6]/65'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#1E2C31]">{page.label} 页面总览</p>
                  <p className="mt-1 text-xs text-[#61767D]">{page.path}</p>
                </div>
                <span className="rounded-full bg-[#F0F7F8] px-2 py-1 text-xs font-semibold text-[#1889B6]">
                  {page.moduleCount} 个模块
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-md bg-[#F7FAFA] px-2 py-2">
                  <p className="text-base font-bold text-[#1E2C31]">{page.draftCount}</p>
                  <p className="mt-1 text-[11px] text-[#61767D]">草稿</p>
                </div>
                <div className="rounded-md bg-[#F7FAFA] px-2 py-2">
                  <p className="text-base font-bold text-[#1E2C31]">{page.unsavedCount}</p>
                  <p className="mt-1 text-[11px] text-[#61767D]">未保存</p>
                </div>
                <div className="rounded-md bg-[#F7FAFA] px-2 py-2">
                  <p className="text-base font-bold text-[#1E2C31]">{page.issueCount}</p>
                  <p className="mt-1 text-[11px] text-[#61767D]">检查项</p>
                </div>
                <div className="rounded-md bg-[#F7FAFA] px-2 py-2">
                  <p className="text-base font-bold text-[#1E2C31]">{page.hiddenCount}</p>
                  <p className="mt-1 text-[11px] text-[#61767D]">隐藏</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <ModuleCatalogPanel
        selectedPage={selectedPage}
        currentStructureDraft={currentStructureDraft}
        structureBusy={structureBusy}
        onAddTemplate={addStructureModule}
      />

      <section className="rounded-lg border border-[#E5DED4] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2A28]">
              <Layers3 size={16} className="text-[#E36F2C]" />
              <span>页面级结构草稿</span>
            </div>
            <p className="mt-1 max-w-4xl text-xs leading-5 text-[#8A8580]">
              页面级结构草稿用于 Home 安全插入区的有限新增、排序、隐藏和恢复。About 与核心模块仍锁定；结构草稿用于安全预览和一次性发布。
            </p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
              currentStructureDraft
                ? structureDraftStatusClassName(currentStructureDraft.draft_status)
                : 'bg-[#F5F2ED] text-[#6B625B]'
            }`}
          >
            {currentPage.label}：{currentStructureDraft ? structureDraftStatusLabel(currentStructureDraft.draft_status) : '暂无结构草稿'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
            {currentStructureDraft ? (
              <div>
                <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
                  <div className="rounded-md bg-white px-2 py-2">
                    <p className="text-base font-semibold text-[#2C2A28]">{currentStructureDraft.summary.moduleCount}</p>
                    <p className="mt-1 text-[11px] text-[#8A8580]">模块</p>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <p className="text-base font-semibold text-[#2C2A28]">{currentStructureDraft.summary.hiddenCount}</p>
                    <p className="mt-1 text-[11px] text-[#8A8580]">隐藏</p>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <p className="text-base font-semibold text-[#2C2A28]">{currentStructureDraft.summary.addedCount}</p>
                    <p className="mt-1 text-[11px] text-[#8A8580]">新增</p>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <p className="text-base font-semibold text-[#2C2A28]">{currentStructureDraft.image_refs.length}</p>
                    <p className="mt-1 text-[11px] text-[#8A8580]">图片引用</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#8A8580]">
                  更新时间：{formatSnapshotTime(currentStructureDraft.updated_at)}；操作人：{currentStructureDraft.updated_by_email ?? '未知'}。
                  预览 iframe 会读取结构草稿，普通访客仍只看线上结构。
                </p>
                {currentStructureDraft.draft_status === 'stale' ? (
                  <p className="mt-2 rounded-md border border-[#F1D0BD] bg-white px-2 py-2 text-xs leading-5 text-[#B54318]">
                    结构草稿已过期：线上结构在草稿创建后发生过变化。请先丢弃并重新创建结构草稿，或由 admin 复核后处理。
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs leading-5 text-[#8A8580]">
                当前页面还没有结构草稿。创建后只会复制当前线上结构和已保存的模块草稿用于预览，不会新增模块，也不会影响前台。
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={Boolean(currentStructureDraft) || Boolean(structureBusy)}
                onClick={createStructureDraft}
              >
                <Layers3 size={14} />
                创建结构草稿
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  !canPublishStructureDraft ||
                  !currentStructureDraft ||
                  currentStructureDraft.draft_status === 'stale' ||
                  Boolean(structureBusy)
                }
                onClick={() => {
                  if (canPublishStructureDraft) setStructurePublishConfirmOpen(true)
                }}
                title={canPublishStructureDraft ? '发布结构草稿' : '仅 admin 可发布结构草稿'}
              >
                <ArrowUpRight size={14} />
                发布结构草稿
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!currentStructureDraft || Boolean(structureBusy)}
                onClick={() => setStructureDiscardConfirmOpen(true)}
              >
                <RotateCcw size={14} />
                丢弃结构草稿
              </Button>
            </div>

            {selectedPage === 'home' && currentStructureDraft ? (
              <div className="mt-4 rounded-md border border-[#E5DED4] bg-white p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#2C2A28]">Home 安全插入区</p>
                    <p className="mt-1 text-xs leading-5 text-[#8A8580]">
                      只允许调整受控首页模板模块，位置固定在 credentials 后、CoreTech 前。
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-[#F5F2ED] px-2 py-1 text-[11px] text-[#6B625B]">
                    {currentSafeStructureModules.length} 个可调整模块
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {currentSafeStructureModules.length > 0 ? (
                    currentSafeStructureModules.map((structureModule, index) => {
                      const pageModule = modules.find((item) => (
                        item.page_key === 'home' && item.module_key === structureModule.moduleKey
                      ))
                      const first = index === 0
                      const last = index === currentSafeStructureModules.length - 1
                      const visible = isStructureModuleVisible(structureModule)
                      const hidden = !visible
                      return (
                        <div
                          key={structureModule.moduleKey}
                          className={`rounded-md border p-2 ${
                            hidden
                              ? 'border-[#E5DED4] bg-[#F5F2ED] text-[#8A8580]'
                              : 'border-[#E5DED4] bg-[#FAF7F2] text-[#2C2A28]'
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold">
                                {pageModule?.title_zh || structureModule.moduleKey}
                              </p>
                              <p className="mt-1 truncate font-mono text-[11px] text-[#8A8580]">
                                home:{structureModule.moduleKey} · {structureModule.moduleType}
                              </p>
                              {hidden ? (
                                <p className="mt-1 text-[11px] text-[#B54318]">结构草稿中隐藏</p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={first || Boolean(structureBusy)}
                                title="上移"
                                aria-label="上移"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  void moveSafeStructureModule(structureModule.moduleKey, -1)
                                }}
                              >
                                <ArrowUp size={14} />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={last || Boolean(structureBusy)}
                                title="下移"
                                aria-label="下移"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  void moveSafeStructureModule(structureModule.moduleKey, 1)
                                }}
                              >
                                <ArrowDown size={14} />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={Boolean(structureBusy)}
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  void setStructureModuleVisibility(
                                    structureModule.moduleKey,
                                    getNextStructureVisibility(structureModule),
                                  )
                                }}
                              >
                                {visible ? '隐藏' : '恢复显示'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-xs leading-5 text-[#8A8580]">
                      当前结构草稿里还没有新增模板模块。先从模块库添加一个受控首页模板。
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#2C2A28]">页面级快照</p>
                <p className="mt-1 text-xs leading-5 text-[#8A8580]">结构发布前会保留整页结构快照，恢复时只恢复到结构草稿。</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={structureBusy === `snapshots:${selectedPage}`}
                onClick={() => loadStructureSnapshots(selectedPage)}
              >
                <RefreshCcw size={14} />
                刷新
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {currentStructureSnapshots.length > 0 ? (
                currentStructureSnapshots.map((snapshot) => {
                  const summary = structureSnapshotSummary(snapshot)
                  return (
                    <div key={snapshot.id} className="rounded-md border border-[#E5DED4] bg-white p-2">
                      <p className="text-xs font-medium text-[#2C2A28]">
                        {summary.moduleCount} 个模块 · {summary.imageCount} 张图片
                      </p>
                      <p className="mt-1 text-[11px] text-[#8A8580]">
                        {summary.savedAt} · {summary.operator}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        disabled={Boolean(structureBusy)}
                        onClick={() => setStructureRestoreSnapshot(snapshot)}
                      >
                        恢复到结构草稿
                      </Button>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs leading-5 text-[#8A8580]">暂无页面级结构快照。发布第一版结构草稿后会自动生成。</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid flex-1 grid-cols-1 gap-5 xl:grid-cols-[270px_minmax(0,1fr)_420px]">
        <aside className="rounded-lg border border-[#E5DED4] bg-white">
          <div className="border-b border-[#E5DED4] px-4 py-3">
            <p className="text-sm font-semibold text-[#2C2A28]">可编辑模块</p>
            <p className="mt-1 text-xs text-[#8A8580]">点击模块会滚动并高亮预览区。</p>
          </div>
          <div className="p-2">
            {currentModules.map((pageModule) => {
              const id = moduleId(pageModule)
              const selected = activeModuleId === id
              const located = locatedModules[id] === true
              const dirty = dirtyIds.has(id)
              const draftAdded = currentStructureModulesByKey.get(pageModule.module_key)?.status === 'added'
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectModule(pageModule)}
                  className="mb-1 flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors last:mb-0"
                  style={{
                    background: selected ? '#F5F2ED' : 'transparent',
                    color: selected ? '#2C2A28' : '#6B625B',
                  }}
                >
                  <LocateFixed
                    size={16}
                    className={`mt-0.5 shrink-0 ${located ? 'text-[#E36F2C]' : 'text-[#B7AEA4]'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{pageModule.title_zh}</span>
                    <span className="mt-1 block truncate font-mono text-[11px] text-[#8A8580]">{id}</span>
                    <span className="mt-2 flex flex-wrap gap-1">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                        located
                          ? 'bg-[#E36F2C]/10 text-[#E36F2C]'
                          : frameLoaded
                            ? 'bg-[#F5F2ED] text-[#8A8580]'
                            : 'bg-[#F5F2ED] text-[#8A8580]'
                      }`}
                      >
                        {frameLoaded ? (located ? '已定位' : '未在预览中定位') : '检测中'}
                      </span>
                      {pageModule.is_visible ? (
                        <span className="inline-flex rounded-full bg-[#F5F2ED] px-2 py-0.5 text-[11px] text-[#6B625B]">
                          显示
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#F5F2ED] px-2 py-0.5 text-[11px] text-[#8A8580]">
                          隐藏
                        </span>
                      )}
                      {pageModule.has_draft ? (
                        <span className="inline-flex rounded-full bg-[#E36F2C]/10 px-2 py-0.5 text-[11px] text-[#E36F2C]">
                          有草稿
                        </span>
                      ) : null}
                      {draftAdded ? (
                        <span className="inline-flex rounded-full bg-[#E36F2C]/10 px-2 py-0.5 text-[11px] text-[#E36F2C]">
                          新增草稿
                        </span>
                      ) : null}
                      {dirty ? (
                        <span className="inline-flex rounded-full bg-[#E36F2C]/10 px-2 py-0.5 text-[11px] text-[#E36F2C]">
                          未保存
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="min-w-0 rounded-lg border border-[#E5DED4] bg-white">
          <div className="flex flex-col gap-2 border-b border-[#E5DED4] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-[#2C2A28]">
              <Eye size={16} className="text-[#E36F2C]" />
              <span>{currentPage.label} 草稿预览</span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="text-xs text-[#8A8580]">{currentPage.path} · 仅后台可见</span>
              <div className="flex rounded-md border border-[#E5DED4] bg-[#F8F6F2] p-1">
                {PREVIEW_DEVICES.map((device) => {
                  const Icon = device.icon
                  const selected = device.key === previewDevice
                  return (
                    <button
                      key={device.key}
                      type="button"
                      onClick={() => {
                        setPreviewDevice(device.key)
                        window.setTimeout(refreshFrameState, 120)
                      }}
                      className="inline-flex h-8 items-center gap-1 rounded px-2 text-xs font-medium transition-colors"
                      style={{
                        background: selected ? '#FFFFFF' : 'transparent',
                        color: selected ? '#2C2A28' : '#8A8580',
                        boxShadow: selected ? '0 1px 2px rgba(36,31,27,0.10)' : 'none',
                      }}
                      aria-pressed={selected}
                    >
                      <Icon size={14} />
                      {device.label}
                    </button>
                  )
                })}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setFrameLoaded(false)
                  setPreviewVersion(Date.now())
                }}
              >
                <RefreshCcw size={14} />
                刷新预览
              </Button>
            </div>
          </div>

          <div className="h-[720px] overflow-auto bg-[#241F1B] p-4">
            <div
              className="relative mx-auto h-full min-w-0 overflow-hidden bg-white"
              style={{
                width: currentPreviewDevice.width ? `${currentPreviewDevice.width}px` : '100%',
                maxWidth: '100%',
              }}
            >
              <iframe
                key={`${selectedPage}-${previewVersion}-${previewDevice}`}
                ref={iframeRef}
                src={previewSrc}
                title={`${currentPage.label} page visual editor preview`}
                className="h-full w-full border-0 bg-white"
                onLoad={handleFrameLoad}
              />
              <div className="pointer-events-none absolute inset-0">
                {highlightRect ? (
                  <div
                    className="absolute rounded-sm border-2 border-[#E36F2C] bg-[#E36F2C]/10 shadow-[0_0_0_9999px_rgba(36,31,27,0.08)] transition-all duration-150"
                    style={{
                      top: highlightRect.top,
                      left: highlightRect.left,
                      width: highlightRect.width,
                      height: highlightRect.height,
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </main>

        <aside className="rounded-lg border border-[#E5DED4] bg-white">
          <div className="border-b border-[#E5DED4] px-4 py-3">
            <p className="text-sm font-semibold text-[#2C2A28]">模块编辑</p>
            <p className="mt-1 text-xs text-[#8A8580]">只编辑当前模块已有字段。</p>
          </div>

          <div className="max-h-[calc(100vh-14rem)] overflow-auto p-4">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-[#8A8580]">{pageLabel(active.page_key)} / {active.module_key}</p>
                <h2 className="mt-1 text-lg font-semibold text-[#2C2A28]">{readableModuleTitle(active)}</h2>
                <p className="mt-2 text-sm leading-6 text-[#8A8580]">{active.description_zh}</p>
                {activeIsDraftAdded ? (
                  <div className="mt-3 rounded-md border border-[#F1D0BD] bg-[#FFF7F1] p-3">
                    <p className="text-xs leading-5 text-[#B54318]">
                      这是只存在于结构草稿里的新增模块；删除只会移除草稿模块和对应内容草稿，不影响线上。
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      disabled={Boolean(structureBusy) || hasAnyUnsavedChanges}
                      onClick={() => deleteAddedStructureModule(active)}
                    >
                      <Trash2 size={14} />
                      删除草稿新增模块
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-[#FAF7F2] p-3">
                  <p className="text-[#8A8580]">预览定位</p>
                  <p className="mt-1 text-[#2C2A28]">{selectedLocated ? '已找到 DOM 标记' : '未找到 DOM 标记'}</p>
                </div>
                <div className="rounded-md bg-[#FAF7F2] p-3">
                  <p className="text-[#8A8580]">接入状态</p>
                  <p className="mt-1 text-[#2C2A28]">已接入 page_modules</p>
                </div>
              </div>

              <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2C2A28]">
                      {activeHasSavedDraft ? '当前有已保存草稿' : '当前使用线上版本'}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#8A8580]">
                      {activeHasSavedDraft
                        ? `草稿保存时间：${activeDraftUpdatedAt ?? '未知'}。发布前不会影响前台。`
                        : `线上版本时间：${activeLiveUpdatedAt ?? '未知'}。修改后请先保存草稿。`}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!activeHasSavedDraft || activeHasUnsavedChanges || publishing || activeIsDraftAdded}
                    onClick={requestPublish}
                    title={
                      activeIsDraftAdded
                        ? '新增模块必须通过页面级结构草稿发布'
                        : activeHasUnsavedChanges
                          ? '请先保存草稿'
                          : '发布草稿到前台'
                    }
                  >
                    <ArrowUpRight size={14} />
                    {publishing ? '发布中...' : '发布草稿'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!activeHasSavedDraft || activeHasUnsavedChanges || discardingDraft}
                    onClick={() => setDiscardDraftConfirmOpen(true)}
                    title={activeHasUnsavedChanges ? '请先撤销或保存当前未保存草稿修改' : '丢弃已保存草稿'}
                  >
                    <RotateCcw size={14} />
                    丢弃草稿
                  </Button>
                </div>
                {activeHasUnsavedChanges ? (
                  <p className="mt-2 text-xs text-[#E36F2C]">当前还有未保存草稿修改，先保存草稿后才能发布。</p>
                ) : null}
                {activeIsDraftAdded ? (
                  <p className="mt-2 text-xs text-[#E36F2C]">
                    新增模块不能单独发布内容草稿；请由 admin 发布页面级结构草稿后上线。
                  </p>
                ) : null}
              </div>

              <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2C2A28]">发布前检查</p>
                    <p className="mt-1 text-xs leading-5 text-[#8A8580]">
                      发布前用于提醒隐藏、空内容、缺图片、缺链接等明显风险，不会自动修改内容。
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-[#6B625B]">
                    {activePreflightIssues.length} 项
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {activePreflightIssues.length > 0 ? (
                    activePreflightIssues.slice(0, 6).map((issue, index) => (
                      <div
                        key={`${issue.label}-${index}`}
                        className="rounded-md border border-[#E5DED4] bg-white px-2 py-2 text-xs"
                      >
                        <p className={issue.severity === 'danger' ? 'font-medium text-[#B54318]' : 'font-medium text-[#2C2A28]'}>
                          {issue.label}
                        </p>
                        <p className="mt-1 text-[#8A8580]">{issue.detail}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#6B625B]">未发现明显发布风险。</p>
                  )}
                  {activePreflightIssues.length > 6 ? (
                    <p className="text-xs text-[#8A8580]">还有 {activePreflightIssues.length - 6} 项未展示。</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2C2A28]">草稿相对线上变更</p>
                    <p className="mt-1 text-xs leading-5 text-[#8A8580]">
                      帮运营确认当前草稿会把线上版本改成什么。未保存修改会单独提示。
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-[#6B625B]">
                    {activeDraftChanges.length} 项
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {activeDraftChanges.length > 0 ? (
                    activeDraftChanges.slice(0, 8).map((change, index) => (
                      <div
                        key={`${change.label}-${index}`}
                        className="rounded-md border border-[#E5DED4] bg-white px-2 py-2 text-xs"
                      >
                        <p className={change.severity === 'high' ? 'font-medium text-[#B54318]' : 'font-medium text-[#2C2A28]'}>
                          {change.label}
                        </p>
                        <p className="mt-1 break-words text-[#8A8580]">{change.detail}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#6B625B]">
                      当前模块和线上版本没有可识别差异。
                    </p>
                  )}
                  {activeDraftChanges.length > 8 ? (
                    <p className="text-xs text-[#8A8580]">还有 {activeDraftChanges.length - 8} 项未展示。</p>
                  ) : null}
                </div>
              </div>

              {activeHasUnsavedChanges ? (
                <div className="rounded-md border border-[#E36F2C]/40 bg-[#FFF8F3] p-3">
                  <p className="text-sm font-semibold text-[#B54318]">还有未保存修改</p>
                  <div className="mt-3 space-y-2">
                    {activeUnsavedChanges.slice(0, 6).map((change, index) => (
                      <div
                        key={`${change.label}-${index}`}
                        className="rounded-md border border-[#F1D0BD] bg-white px-2 py-2 text-xs"
                      >
                        <p className="font-medium text-[#2C2A28]">{change.label}</p>
                        <p className="mt-1 break-words text-[#8A8580]">{change.detail}</p>
                      </div>
                    ))}
                    {activeUnsavedChanges.length > 6 ? (
                      <p className="text-xs text-[#8A8580]">还有 {activeUnsavedChanges.length - 6} 项未展示。</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2A28]">
                      <Clock3 size={15} className="text-[#E36F2C]" />
                      <span>版本快照</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#8A8580]">
                      每次发布前会自动保留当前线上版本，最多保留最近 30 版。恢复快照会先进入草稿。
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={loadSnapshots} disabled={snapshotsLoading}>
                    <RefreshCcw size={14} />
                    刷新
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {snapshotsLoading ? (
                    <p className="text-xs text-[#8A8580]">正在读取快照...</p>
                  ) : snapshots.length > 0 ? (
                    snapshots.map((snapshot) => {
                      const summary = snapshotSummary(snapshot)
                      return (
                      <div key={snapshot.id} className="rounded-md border border-[#E5DED4] bg-white p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#2C2A28]">
                              {summary.title}
                            </p>
                            <p className="mt-1 text-[11px] text-[#8A8580]">
                              {summary.itemCount} 个项目 · {summary.hasImages ? '包含图片' : '无图片'}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-[#8A8580]">
                              {summary.savedAt} · {summary.operator}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={Boolean(restoringSnapshotId)}
                            onClick={() => setRestoreSnapshot(snapshot)}
                          >
                            恢复到草稿
                          </Button>
                        </div>
                      </div>
                    )
                    })
                  ) : (
                    <p className="text-xs leading-5 text-[#8A8580]">
                      暂无快照。第一次发布草稿后，这里会出现发布前的线上版本。
                    </p>
                  )}
                </div>
              </div>

              {selectedField.itemId || selectedField.field ? (
                <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2C2A28]">
                    <MousePointer2 size={14} className="text-[#E36F2C]" />
                    <span>当前点击字段</span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-[#6B625B]">
                    {selectedField.itemId ?? '-'} / {selectedField.field ? fieldLabel(selectedField.field) : '-'}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[#2C2A28]">前台显示</p>
                  <p className="mt-1 text-xs text-[#8A8580]">关闭后先保存草稿，发布后前台才会隐藏整个模块。</p>
                </div>
                <Switch
                  checked={active.is_visible}
                  disabled={activeIsStructureManagedTemplate}
                  onCheckedChange={(checked) => patchActive({ is_visible: checked })}
                />
              </div>
              {activeIsStructureManagedTemplate ? (
                <p className="text-xs leading-5 text-[#E36F2C]">
                  这个模块由页面结构草稿控制显示/隐藏，请使用上方 Home 安全插入区的“隐藏 / 恢复显示”。
                </p>
              ) : null}

              <div className="space-y-3">
                <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#2C2A28]">模块内项目</p>
                      <p className="mt-1 text-xs leading-5 text-[#8A8580]">
                        可显示/隐藏项目并调整排序。只有数据条、列表、图片墙这类重复型模块支持新增项目；移除展示统一使用隐藏，不做物理删除。
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canManageRepeatedItems || active.items.length >= 80}
                      onClick={addItem}
                      title={canManageRepeatedItems ? '新增项目' : '固定内容模块不支持新增项目'}
                    >
                      <Plus size={14} />
                      新增项目
                    </Button>
                  </div>
                  {!canManageRepeatedItems ? (
                    <p className="mt-2 text-xs text-[#8A8580]">
                      当前是固定内容模块，只开放已有字段编辑和显示/隐藏，避免破坏前台固定结构。
                    </p>
                  ) : null}
                </div>

                {activeItems.map((item, itemIndex) => {
                  const showImage = isImageItem(active, item)
                  const showVideo = isVideoItem(active, item)
                  const showLink = isLinkItem(item)
                  const showValue = showValueFields(active, item)
                  const showContent = showContentFields(active, item)
                  const firstItem = itemIndex === 0
                  const lastItem = itemIndex === activeItems.length - 1
                  return (
                    <div key={item.id} className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs text-[#6B625B]">{item.id}</p>
                          <p className="mt-1 truncate text-xs text-[#8A8580]">
                            {item.is_visible ? '项目当前参与前台渲染' : '项目当前隐藏'}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Switch
                            checked={item.is_visible}
                            onCheckedChange={(checked) => patchItem(item.id, { is_visible: checked })}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-[#8A8580] hover:text-[#E36F2C]"
                            aria-label="上移项目"
                            title="上移项目"
                            disabled={firstItem}
                            onClick={() => moveItem(item.id, -1)}
                          >
                            <ArrowUp size={14} />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-[#8A8580] hover:text-[#E36F2C]"
                            aria-label="下移项目"
                            title="下移项目"
                            disabled={lastItem}
                            onClick={() => moveItem(item.id, 1)}
                          >
                            <ArrowDown size={14} />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-[#8A8580] hover:text-red-600"
                            aria-label="隐藏项目"
                            title={canManageRepeatedItems ? '隐藏项目' : '固定内容模块不支持隐藏项目'}
                            disabled={!canManageRepeatedItems}
                            onClick={() => setDeleteItemId(item.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {showImage ? (
                          <div ref={bindFieldRef(item.id, 'image_url')} className={fieldClassName(item.id, 'image_url')}>
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                              <ImageIcon size={13} />
                              <span>图片</span>
                            </div>
                            <PageModuleImagePicker
                              value={item.image_url ?? ''}
                              maxUploadMb={maxUploadMb}
                              onChange={(url) => patchItem(item.id, { image_url: url })}
                            />
                            <Input
                              value={item.image_url ?? ''}
                              onChange={(event) => patchItem(item.id, { image_url: event.target.value })}
                              placeholder="图片 URL"
                              className="mt-2 bg-white"
                            />
                          </div>
                        ) : null}

                        {showVideo ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div ref={bindFieldRef(item.id, 'video_url')} className={fieldClassName(item.id, 'video_url')}>
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                                <Video size={13} />
                                <span>视频 URL</span>
                              </div>
                              <Input
                                value={item.video_url ?? ''}
                                onChange={(event) => patchItem(item.id, { video_url: event.target.value })}
                                placeholder="https://...mp4"
                                className="bg-white"
                              />
                            </div>
                            <div
                              ref={bindFieldRef(item.id, 'video_poster_url')}
                              className={fieldClassName(item.id, 'video_poster_url')}
                            >
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                                <ImageIcon size={13} />
                                <span>视频封面 URL</span>
                              </div>
                              <Input
                                value={item.video_poster_url ?? ''}
                                onChange={(event) => patchItem(item.id, { video_poster_url: event.target.value })}
                                placeholder="https://...jpg"
                                className="bg-white"
                              />
                            </div>
                          </div>
                        ) : null}

                        {showValue ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div ref={bindFieldRef(item.id, 'value_zh')} className={fieldClassName(item.id, 'value_zh')}>
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                                <Type size={13} />
                                <span>中文数值/编号</span>
                              </div>
                              <Input
                                value={item.value_zh ?? ''}
                                onChange={(event) => patchItem(item.id, { value_zh: event.target.value })}
                                className="bg-white"
                              />
                            </div>
                            <div ref={bindFieldRef(item.id, 'value_en')} className={fieldClassName(item.id, 'value_en')}>
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                                <Type size={13} />
                                <span>英文数值/编号</span>
                              </div>
                              <Input
                                value={item.value_en ?? ''}
                                onChange={(event) => patchItem(item.id, { value_en: event.target.value })}
                                className="bg-white"
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div ref={bindFieldRef(item.id, 'label_zh')} className={fieldClassName(item.id, 'label_zh')}>
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                              <Type size={13} />
                              <span>中文文字</span>
                            </div>
                            <Input
                              value={item.label_zh}
                              onChange={(event) => patchItem(item.id, { label_zh: event.target.value })}
                              className="bg-white"
                            />
                          </div>
                          <div ref={bindFieldRef(item.id, 'label_en')} className={fieldClassName(item.id, 'label_en')}>
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                              <Type size={13} />
                              <span>英文文字</span>
                            </div>
                            <Input
                              value={item.label_en}
                              onChange={(event) => patchItem(item.id, { label_en: event.target.value })}
                              className="bg-white"
                            />
                          </div>
                        </div>

                        {showContent ? (
                          <div className="grid grid-cols-1 gap-2">
                            <div ref={bindFieldRef(item.id, 'content_zh')} className={fieldClassName(item.id, 'content_zh')}>
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                                <Type size={13} />
                                <span>中文正文</span>
                              </div>
                              <Textarea
                                value={item.content_zh ?? ''}
                                onChange={(event) => patchItem(item.id, { content_zh: event.target.value })}
                                className="min-h-[96px] bg-white"
                              />
                            </div>
                            <div ref={bindFieldRef(item.id, 'content_en')} className={fieldClassName(item.id, 'content_en')}>
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                                <Type size={13} />
                                <span>英文正文</span>
                              </div>
                              <Textarea
                                value={item.content_en ?? ''}
                                onChange={(event) => patchItem(item.id, { content_en: event.target.value })}
                                className="min-h-[110px] bg-white"
                              />
                            </div>
                          </div>
                        ) : null}

                        {showLink ? (
                          <div ref={bindFieldRef(item.id, 'href')} className={fieldClassName(item.id, 'href')}>
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#8A8580]">
                              <Link2 size={13} />
                              <span>链接</span>
                            </div>
                            <Input
                              value={item.href ?? ''}
                              onChange={(event) => patchItem(item.id, { href: event.target.value })}
                              placeholder="https://..."
                              className="bg-white"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <Link
                href={formEditorHref}
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#E5DED4] bg-white px-4 py-2.5 text-sm font-medium text-[#2C2A28] transition-colors hover:border-[#E36F2C] hover:text-[#E36F2C]"
              >
                去备用表单编辑器打开
                <ArrowUpRight size={15} />
              </Link>
              <p className="text-xs leading-5 text-[#8A8580]">
                备用表单编辑器仍是直接保存线上版本，运营测试建议优先使用本页草稿发布流程。
              </p>
            </div>
          </div>
        </aside>
      </div>

      {activeHasUnsavedChanges ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E5DED4] bg-[#FFFFFF]/95 px-6 py-4 shadow-[0_-8px_24px_rgba(44,42,40,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2C2A28]">当前模块有未保存草稿修改</p>
              <p className="mt-1 text-xs text-[#8A8580]">
                保存草稿不会影响前台页面。保存后可在右侧确认并发布，发布前会自动保留当前线上版本快照。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={saving} onClick={discardActiveChanges}>
                <RotateCcw size={15} />
                撤销当前模块修改
              </Button>
              <Button type="button" disabled={saving} onClick={requestSave}>
                <Save size={15} />
                {saving ? '保存中...' : '保存草稿'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认保存当前模块草稿？"
        description={
          <span>
            这次只会把 <strong>{active.title_zh}</strong> 保存为草稿，不会影响前台页面。确认无误后，还需要点击“发布草稿”才会上线。
          </span>
        }
        confirmLabel="保存草稿"
        tone="warning"
        loading={saving}
        onConfirm={saveActiveModule}
      />

      <AdminConfirmDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
        title="确认发布当前模块草稿？"
        description={
          <div className="space-y-3 text-left">
            <p>
              发布后 <strong>{active.title_zh}</strong> 会立即影响前台页面。系统会在发布前自动保留当前线上版本快照，方便后续恢复。
            </p>
            {activeDraftChanges.length > 0 ? (
              <div>
                <p className="font-medium text-[#2C2A28]">本次发布变更摘要：</p>
                <ul className="mt-2 space-y-1">
                  {activeDraftChanges.slice(0, 6).map((change, index) => (
                    <li key={`${change.label}-${index}`}>
                      {change.label}：{change.detail}
                    </li>
                  ))}
                </ul>
                {activeDraftChanges.length > 6 ? (
                  <p className="mt-1">还有 {activeDraftChanges.length - 6} 项未展示。</p>
                ) : null}
              </div>
            ) : null}
            {activePreflightIssues.length > 0 ? (
              <div>
                <p className="font-medium text-[#B54318]">发布前检查提醒：</p>
                <ul className="mt-2 space-y-1">
                  {activePreflightIssues.slice(0, 5).map((issue, index) => (
                    <li key={`${issue.label}-${index}`}>
                      {issue.label}：{issue.detail}
                    </li>
                  ))}
                </ul>
                {activePreflightIssues.length > 5 ? (
                  <p className="mt-1">还有 {activePreflightIssues.length - 5} 项未展示。</p>
                ) : null}
              </div>
            ) : null}
          </div>
        }
        confirmLabel="确认发布"
        tone="warning"
        loading={publishing}
        onConfirm={publishActiveDraft}
      />

      <AdminConfirmDialog
        open={discardDraftConfirmOpen}
        onOpenChange={setDiscardDraftConfirmOpen}
        title="确认丢弃当前模块草稿？"
        description={
          <span>
            将丢弃 <strong>{active.title_zh}</strong> 当前已保存草稿，并回到线上版本。这个操作不会影响前台页面。
          </span>
        }
        confirmLabel="确认丢弃"
        tone="danger"
        loading={discardingDraft}
        onConfirm={discardSavedDraft}
      />

      <AdminConfirmDialog
        open={Boolean(deleteItemId)}
        onOpenChange={(open) => {
          if (!open) setDeleteItemId(null)
        }}
        title="确认隐藏这个项目？"
        description={
          <span>
            这只会先成为当前模块的未保存草稿修改。将隐藏第{' '}
            <strong>{activeItemToDeleteIndex >= 0 ? activeItemToDeleteIndex + 1 : '-'}</strong> 个项目，
            ID 为 <strong>{activeItemToDelete?.id ?? deleteItemId}</strong>，
            当前文字为 <strong>{activeItemToDeleteSummary?.label ?? '-'}</strong>
            {activeItemToDeleteSummary?.value ? <>，值/正文为 <strong>{activeItemToDeleteSummary.value}</strong></> : null}。
            保存草稿后只会进入草稿预览，发布草稿后才会从前台对应模块中隐藏，可通过显示开关恢复。
          </span>
        }
        confirmLabel="确认隐藏"
        tone="warning"
        onConfirm={confirmDeleteItem}
      />

      <AdminConfirmDialog
        open={Boolean(restoreSnapshot)}
        onOpenChange={(open) => {
          if (!open && !restoringSnapshotId) setRestoreSnapshot(null)
        }}
        title="确认恢复这个版本到草稿？"
        description={
          <span>
            将恢复 <strong>{restoreSnapshotSummary?.title ?? '这个快照'}</strong>，
            共 <strong>{restoreSnapshotSummary?.itemCount ?? '-'}</strong> 个项目，
            {restoreSnapshotSummary?.hasImages ? '包含图片，' : '不包含图片，'}
            保存时间 <strong>{restoreSnapshotSummary?.savedAt ?? '-'}</strong>，
            操作人 <strong>{restoreSnapshotSummary?.operator ?? '-'}</strong>。
            恢复后只会覆盖当前草稿，不会立即影响前台页面。确认无误后需要再发布草稿。
          </span>
        }
        confirmLabel="恢复到草稿"
        tone="danger"
        loading={Boolean(restoringSnapshotId)}
        onConfirm={restoreSelectedSnapshot}
      />

      <AdminConfirmDialog
        open={structurePublishConfirmOpen}
        onOpenChange={setStructurePublishConfirmOpen}
        title="确认发布页面级结构草稿？"
        description={
          <div className="space-y-2 text-left">
            <p>
              发布后 <strong>{currentPage.label}</strong> 的页面结构会立即影响前台。系统会先保存页面级结构快照，再一次性写入线上结构。
            </p>
            <p>
              当前草稿包含 <strong>{currentStructureDraft?.summary.moduleCount ?? 0}</strong> 个模块，
              <strong>{currentStructureDraft?.image_refs.length ?? 0}</strong> 个图片引用。
            </p>
            <p className="text-[#B54318]">只有 admin 可以发布结构草稿；operator 可以创建和预览，但不建议直接发布结构变更。</p>
          </div>
        }
        confirmLabel="确认发布结构草稿"
        tone="warning"
        loading={structureBusy === `publish:${selectedPage}`}
        onConfirm={publishStructureDraft}
      />

      <AdminConfirmDialog
        open={structureDiscardConfirmOpen}
        onOpenChange={setStructureDiscardConfirmOpen}
        title="确认丢弃页面级结构草稿？"
        description={
          <span>
            将丢弃 <strong>{currentPage.label}</strong> 的页面级结构草稿，并让预览回到线上结构。这个操作不会影响前台页面。
          </span>
        }
        confirmLabel="确认丢弃"
        tone="danger"
        loading={structureBusy === `discard:${selectedPage}`}
        onConfirm={discardStructureDraft}
      />

      <AdminConfirmDialog
        open={Boolean(structureRestoreSnapshot)}
        onOpenChange={(open) => {
          if (!open && !structureBusy?.startsWith('restore:')) setStructureRestoreSnapshot(null)
        }}
        title="确认恢复页面级快照到结构草稿？"
        description={
          <span>
            将恢复 <strong>{currentPage.label}</strong> 的页面级结构快照，
            共 <strong>{currentStructureRestoreSummary?.moduleCount ?? '-'}</strong> 个模块，
            <strong>{currentStructureRestoreSummary?.imageCount ?? '-'}</strong> 个图片引用；
            保存时间 <strong>{currentStructureRestoreSummary?.savedAt ?? '-'}</strong>，
            操作人 <strong>{currentStructureRestoreSummary?.operator ?? '-'}</strong>。
            恢复后只会成为结构草稿，不会立即影响前台。
          </span>
        }
        confirmLabel="恢复到结构草稿"
        tone="danger"
        loading={structureBusy === `restore:${selectedPage}`}
        onConfirm={restoreStructureSnapshotToDraft}
      />
    </div>
  )
}
