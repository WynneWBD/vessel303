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
  PageStructureSnapshotRow,
} from '@/lib/page-modules-db'

type PageKey = 'home' | 'about'

type PageMeta = {
  key: PageKey
  label: string
  path: string
}

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
]

const PREVIEW_DEVICES: PreviewDevice[] = [
  { key: 'desktop', label: 'Desktop', width: null, icon: Monitor },
  { key: 'tablet', label: 'Tablet', width: 768, icon: Tablet },
  { key: 'mobile', label: 'Mobile', width: 390, icon: Smartphone },
]

const PAGE_LABELS = {
  home: '首页',
  about: 'About',
} satisfies Record<PageKey, string>

const EDITABLE_MODULE_IDS = [
  'home:hero',
  'home:credentials',
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
]

const EDITABLE_MODULE_ID_SET = new Set(EDITABLE_MODULE_IDS)

const OPERATING_WORKFLOW = [
  '先选 Home 或 About，再选左侧模块；也可以直接点击预览里的高亮模块定位。',
  '文字、链接、图片和显示状态只会先改到当前草稿，保存草稿不会影响前台。',
  '发布前先看 Desktop / Tablet / Mobile 三种预览，再核对右侧变更摘要和发布前检查。',
  '确认无误后再发布草稿；发布会立即影响前台，并在发布前自动保留线上版本快照。',
]

const OPERATING_GUARDRAILS = [
  '当前只编辑已有页面模块和模块内受控字段，不支持整页模块级新增、删除、拖拽排序。',
  '不能自由改字体、颜色、间距、布局、SEO、导航和页脚；这些仍由代码和品牌规则控制。',
  '恢复快照只会恢复到草稿，不会直接影响前台；恢复后仍需要预览、检查并手动发布。',
  '发现图片、链接、空内容、隐藏模块等检查提醒时，先确认业务意图，再保存或发布。',
]

const OPERATOR_CHECKLIST = [
  '保存草稿后刷新预览，确认预览内容和右侧字段一致。',
  '发布前确认变更摘要没有异常，尤其是图片、链接、显示/隐藏变化。',
  '发布后回到真实前台 Home / About 核对一次。',
]

function moduleId(pageModule: Pick<PageModuleRow, 'page_key' | 'module_key'>) {
  return `${pageModule.page_key}:${pageModule.module_key}`
}

function isPageKey(value: string): value is PageKey {
  return value === 'home' || value === 'about'
}

function pageLabel(pageKey: string) {
  return isPageKey(pageKey) ? PAGE_LABELS[pageKey] : pageKey
}

const CATALOG_PAGE_LABELS = {
  home: 'Home',
  about: 'About',
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
            C4-2c 只允许 Home 在 credentials 后、CoreTech 前添加 simple-text 和 cta-section。About 暂不开放添加入口。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#F5F2ED] px-3 py-1 text-xs font-medium text-[#6B625B]">
          Home 安全插入区
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        <div>
          <p className="text-xs font-semibold text-[#2C2A28]">可新增模块候选</p>
          <p className="mt-1 text-xs leading-5 text-[#8A8580]">本轮只开放 simple-text 和 cta-section 到 Home 结构草稿；新增后不会立即影响普通前台。</p>
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

function sortedItems(items: PageModuleItem[]) {
  return [...items].sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.id.localeCompare(b.id))
}

function supportsRepeatedItems(pageModule: PageModuleRow) {
  return (
    pageModule.module_type === 'stats' ||
    pageModule.module_type === 'list' ||
    pageModule.module_type.includes('gallery')
  )
}

function isImageItem(pageModule: PageModuleRow, item: PageModuleItem) {
  return (
    Boolean(item.image_url) ||
    item.id.includes('image') ||
    item.id.includes('photo') ||
    pageModule.module_type.includes('gallery')
  )
}

function isLinkItem(item: PageModuleItem) {
  return Boolean(item.href) || item.id.includes('cta')
}

function showValueFields(pageModule: PageModuleRow, item: PageModuleItem) {
  return (
    pageModule.module_type === 'stats' ||
    Boolean(item.value_zh) ||
    Boolean(item.value_en) ||
    /^timeline-\d{4}$/.test(item.id) ||
    /^service-\d/.test(item.id)
  )
}

function showContentFields(item: PageModuleItem) {
  return (
    Boolean(item.content_zh) ||
    Boolean(item.content_en) ||
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
      'href',
    ] as const
    for (const field of itemFields) {
      if ((item[field] ?? '') !== (before[field] ?? '')) {
        changes.push({
          label: `${readableItemTitle(item)} / ${fieldLabel(field)}`,
          detail: `${readableValue(before[field])} -> ${readableValue(item[field])}`,
          severity: field === 'image_url' || field === 'href' ? 'high' : 'low',
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

    if (!hasReadableText && !item.image_url?.trim()) {
      issues.push({
        label: `空条目：${item.id}`,
        detail: '这个条目没有文字，也没有图片。',
        severity: 'warning',
      })
    }

    if (isImageItem(pageModule, item) && !item.image_url?.trim()) {
      issues.push({
        label: `图片为空：${readableItemTitle(item)}`,
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
    initialStructureSnapshots ?? { home: [], about: [] },
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
  const activeStructureModule = active ? currentStructureModulesByKey.get(active.module_key) ?? null : null
  const activeIsDraftAdded = activeStructureModule?.status === 'added'
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
  const pageStats = useMemo(
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
    const item: PageModuleItem = {
      id: `${active.module_key}-item-${Date.now()}`,
      label_zh: '新项目',
      label_en: 'New item',
      is_visible: true,
      sort_order: maxSort + 10,
    }

    if (active.module_type.includes('gallery')) {
      item.image_url = ''
    }
    if (active.module_type === 'stats') {
      item.value_zh = ''
      item.value_en = ''
    }
    if (active.module_type === 'list') {
      item.value_zh = ''
      item.value_en = ''
      item.content_zh = ''
      item.content_en = ''
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
    patchActive({ items: active.items.filter((item) => item.id !== deleteItemId) })
    setSelectedField({ itemId: null, field: null })
    setDeleteItemId(null)
    toast.message('已删除项目，保存草稿和发布后才会影响前台')
  }, [active, canManageRepeatedItems, deleteItemId, patchActive])

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#E36F2C] uppercase">
            Visual Editor
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#2C2A28]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            页面可视化编辑器
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#8A8580]">
            受控可视化编辑，只能修改已接入 page_modules 的文字、链接、图片和模块显示状态。
            支持重复型模块内的项目新增、删除、排序；不支持新增、删除、排序页面模块，也不能自由修改样式或布局。
            当前编辑的是草稿预览：保存草稿不会影响前台，点击发布后才会上线；发布前会自动保留当前线上版本快照。
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className="flex flex-wrap gap-2 rounded-lg border border-[#E5DED4] bg-white p-1">
            {PAGES.map((page) => {
              const activePage = page.key === selectedPage
              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => handleSelectPage(page.key)}
                  className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: activePage ? '#E36F2C' : 'transparent',
                    color: activePage ? '#FFFFFF' : '#6B625B',
                  }}
                >
                  {page.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-[#8A8580]">
            {hasAnyUnsavedChanges ? `${dirtyIds.size} 个模块有未保存草稿修改` : '当前没有未保存草稿修改'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {pageStats.map((page) => {
          const isActive = page.key === selectedPage
          return (
            <button
              key={page.key}
              type="button"
              onClick={() => handleSelectPage(page.key)}
              className="rounded-lg border bg-white p-4 text-left transition-colors"
              style={{
                borderColor: isActive ? '#E36F2C' : '#E5DED4',
                boxShadow: isActive ? '0 0 0 3px rgba(227,111,44,0.10)' : 'none',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#2C2A28]">{page.label} 页面总览</p>
                  <p className="mt-1 text-xs text-[#8A8580]">{page.path}</p>
                </div>
                <span className="rounded-full bg-[#F5F2ED] px-2 py-1 text-xs text-[#6B625B]">
                  {page.moduleCount} 个模块
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-md bg-[#F8F6F2] px-2 py-2">
                  <p className="text-base font-semibold text-[#2C2A28]">{page.draftCount}</p>
                  <p className="mt-1 text-[11px] text-[#8A8580]">草稿</p>
                </div>
                <div className="rounded-md bg-[#F8F6F2] px-2 py-2">
                  <p className="text-base font-semibold text-[#2C2A28]">{page.unsavedCount}</p>
                  <p className="mt-1 text-[11px] text-[#8A8580]">未保存</p>
                </div>
                <div className="rounded-md bg-[#F8F6F2] px-2 py-2">
                  <p className="text-base font-semibold text-[#2C2A28]">{page.issueCount}</p>
                  <p className="mt-1 text-[11px] text-[#8A8580]">检查项</p>
                </div>
                <div className="rounded-md bg-[#F8F6F2] px-2 py-2">
                  <p className="text-base font-semibold text-[#2C2A28]">{page.hiddenCount}</p>
                  <p className="mt-1 text-[11px] text-[#8A8580]">隐藏</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <section className="rounded-lg border border-[#E5DED4] bg-white p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#2C2A28]">运营使用规范</p>
            <p className="mt-1 text-xs leading-5 text-[#8A8580]">
              这里是运营编辑 Home / About 的主入口。当前编辑器只做受控内容编辑和草稿发布，不做自由建站。
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-[#E36F2C]/10 px-3 py-1 text-xs font-medium text-[#E36F2C]">
            保存草稿不影响前台，发布后立即上线
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-md bg-[#FAF7F2] p-3">
            <p className="text-xs font-semibold text-[#2C2A28]">推荐流程</p>
            <ol className="mt-3 space-y-2 text-xs leading-5 text-[#6B625B]">
              {OPERATING_WORKFLOW.map((item, index) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#E36F2C]">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-md bg-[#FAF7F2] p-3">
            <p className="text-xs font-semibold text-[#2C2A28]">安全边界</p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-[#6B625B]">
              {OPERATING_GUARDRAILS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E36F2C]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md bg-[#FAF7F2] p-3">
            <p className="text-xs font-semibold text-[#2C2A28]">发布前确认</p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-[#6B625B]">
              {OPERATOR_CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#E36F2C]">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

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
              C4-2b 只建立整页结构草稿底座。当前仍不开放整页模块新增、删除或拖拽排序；结构草稿用于后续安全预览和一次性发布。
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
                <Switch checked={active.is_visible} onCheckedChange={(checked) => patchActive({ is_visible: checked })} />
              </div>

              <div className="space-y-3">
                <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#2C2A28]">模块内项目</p>
                      <p className="mt-1 text-xs leading-5 text-[#8A8580]">
                        可显示/隐藏项目并调整排序。只有数据条、列表、图片墙这类重复型模块支持新增和删除项目；所有变化都会先保存为草稿。
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
                  const showLink = isLinkItem(item)
                  const showValue = showValueFields(active, item)
                  const showContent = showContentFields(item)
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
                            aria-label="删除项目"
                            title={canManageRepeatedItems ? '删除项目' : '固定内容模块不支持删除项目'}
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
        title="确认删除这个项目？"
        description={
          <span>
            这只会先成为当前模块的未保存草稿修改。将删除第{' '}
            <strong>{activeItemToDeleteIndex >= 0 ? activeItemToDeleteIndex + 1 : '-'}</strong> 个项目，
            ID 为 <strong>{activeItemToDelete?.id ?? deleteItemId}</strong>，
            当前文字为 <strong>{activeItemToDeleteSummary?.label ?? '-'}</strong>
            {activeItemToDeleteSummary?.value ? <>，值/正文为 <strong>{activeItemToDeleteSummary.value}</strong></> : null}。
            保存草稿后只会进入草稿预览，发布草稿后才会从前台对应模块中移除。
          </span>
        }
        confirmLabel="确认删除"
        tone="danger"
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
