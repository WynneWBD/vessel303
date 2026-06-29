'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Clock3,
  Eye,
  ImageIcon,
  Layers3,
  Link2,
  ListChecks,
  LocateFixed,
  Maximize2,
  Minimize2,
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
  X,
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
  PLANNED_PAGE_MODULE_CATALOG,
  type PageModuleCatalogItem,
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

type PageKey =
  | 'home'
  | 'products'
  | 'cases'
  | 'contact'
  | 'site'
  | 'auth'
  | 'account'
  | 'about'
  | 'global'
  | 'faq'
  | 'media-kit'
  | 'scenarios'
  | 'innovation'
  | 'display'
  | 'news'

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

type CanvasHotspot = HighlightRect & {
  id: string
  moduleId: string
  itemId: string | null
  field: string | null
  text: string | null
  layer: 'module' | 'item' | 'field' | 'external'
  externalTarget: ExternalCanvasEditTarget | null
}

type ModuleRailState = 'on-canvas' | 'other-canvas' | 'not-rendered' | 'loading'

type CanvasEventControls = {
  preventDefault: () => void
  stopPropagation: () => void
  stopImmediatePropagation?: () => void
}

const MIN_CANVAS_FRAME_HEIGHT = 1040
const MAX_CANVAS_FRAME_HEIGHT = 24000
const CANVAS_FRAME_HEIGHT_PADDING = 80
const FRAME_SELECTED_HOTSPOT_ATTR = 'data-vessel303-visual-selected'
const EDITABLE_HOTSPOT_SELECTOR = [
  '[data-cms-edit-url]',
  '[data-page-module-field]',
  '[data-page-module-item]',
  '[data-page-module]',
].join(',')
const VISUAL_INTERACTION_SELECTOR = '[data-visual-open-panel]'

function closestEditableBeforeBoundary(target: Element | null, boundary: Element) {
  let element: Element | null = target
  while (element) {
    if (element.matches(EDITABLE_HOTSPOT_SELECTOR)) return element
    if (element === boundary) break
    element = element.parentElement
  }
  return null
}

function isVisualFormControl(element: Element | null) {
  const tagName = element?.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

function isVisualActionControl(element: Element | null) {
  const tagName = element?.tagName.toLowerCase()
  return (
    isVisualFormControl(element)
    || tagName === 'a'
    || tagName === 'button'
    || tagName === 'summary'
    || element?.getAttribute('role') === 'button'
  )
}

function shouldAllowCanvasVisualInteraction(target: Element) {
  const interactionTarget = target.closest(VISUAL_INTERACTION_SELECTOR)
  if (!interactionTarget) return false
  if (closestEditableBeforeBoundary(target, interactionTarget)) return false
  if (interactionTarget.querySelector(EDITABLE_HOTSPOT_SELECTOR)) return false
  if (isVisualFormControl(target)) return true
  if (isVisualActionControl(interactionTarget)) return true
  return true
}

type FieldSelection = {
  itemId: string | null
  field: string | null
}

type VisualEditorSelectionData = {
  type?: string
  moduleId?: string | null
  itemId?: string | null
  field?: string | null
  text?: string | null
  editKind?: string | null
  editTitle?: string | null
  editField?: string | null
  editUrl?: string | null
  editTargetId?: string | null
  editApiUrl?: string | null
  editPatchKey?: string | null
  editObjectKey?: string | null
  editObjectPath?: string | null
  editInput?: string | null
  editMaxLength?: string | null
  editArrayIndex?: string | null
  editArrayMode?: string | null
  editRequired?: string | null
  editNullable?: string | null
  editValue?: string | null
  editOptions?: string | null
  editDisplaySuffix?: string | null
}

declare global {
  interface Window {
    __vessel303VisualEditorSelectFromPreview?: (data: unknown) => void
  }
}

type ModuleQuickField =
  | 'title_zh'
  | 'title_en'
  | 'description_zh'
  | 'description_en'
  | 'image_url'
  | 'video_url'
  | 'video_poster_url'
  | 'href'
type ItemQuickField =
  | 'label_zh'
  | 'label_en'
  | 'value_zh'
  | 'value_en'
  | 'content_zh'
  | 'content_en'
  | 'image_url'
  | 'video_url'
  | 'video_poster_url'
  | 'href'

type QuickSelectedField = {
  scope: 'module' | 'item'
  field: ModuleQuickField | ItemQuickField
  label: string
  value: string
  itemId?: string
  input: 'text' | 'textarea' | 'image' | 'number'
}

type QuickFieldAction = {
  key: string
  itemId: string | null
  field: ModuleQuickField | ItemQuickField
  subject: string
  label: string
  value: string
  Icon: LucideIcon
}

type CanvasSelectionPayload = FieldSelection & {
  text?: string | null
}

type ExternalCanvasEditTarget = {
  kind: string
  title: string
  field: string
  href: string
  targetId: string | null
  text: string | null
  apiUrl: string | null
  patchKey: string | null
  objectKey: string | null
  objectPath: string | null
  input: 'text' | 'textarea' | 'image' | 'number' | 'select'
  selectOptions: ExternalSelectOption[]
  maxLength: number | null
  arrayIndex: number | null
  arrayMode: 'replace' | 'append'
  required: boolean
  nullable: boolean
  displaySuffix: string | null
}

type ExternalSelectOption = {
  value: string
  label: string
}

const MODULE_FIELD_REF_ITEM_ID = '__module__'
const CASE_DETAIL_PREVIEW_PATH = '/cases/xunliao-bay-holiday-planet'
const MODULE_QUICK_FIELD_SET = new Set<string>([
  'title_zh',
  'title_en',
  'description_zh',
  'description_en',
  'image_url',
  'video_url',
  'video_poster_url',
  'href',
])
const ITEM_QUICK_FIELD_SET = new Set<string>([
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
])

type PreviewDeviceKey = 'desktop' | 'tablet' | 'mobile'
type CanvasZoomMode = 'actual' | 'fit'

type PreviewDevice = {
  key: PreviewDeviceKey
  label: string
  width: number
  icon: typeof Monitor
}

const PAGES: PageMeta[] = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'products', label: '产品', path: '/products' },
  { key: 'cases', label: '案例', path: '/cases' },
  { key: 'contact', label: '联系', path: '/contact' },
  { key: 'site', label: '导航页脚', path: '/' },
  { key: 'auth', label: '登录注册', path: '/login' },
  { key: 'account', label: '账户', path: '/account' },
  { key: 'about', label: '关于我们', path: '/about' },
  { key: 'global', label: 'Global', path: '/global' },
  { key: 'faq', label: 'FAQ', path: '/faq' },
  { key: 'media-kit', label: '媒体资料', path: '/media-kit' },
  { key: 'scenarios', label: '应用场景', path: '/scenarios/tourism' },
  { key: 'innovation', label: '创新', path: '/innovation/viie' },
  { key: 'display', label: '展示', path: '/display' },
  { key: 'news', label: '新闻', path: '/news' },
]

const PAGE_KEY_SET = new Set<PageKey>(PAGES.map((page) => page.key))

function emptyStructureSnapshots(): Record<PageKey, PageStructureSnapshotRow[]> {
  return PAGES.reduce((acc, page) => {
    acc[page.key] = []
    return acc
  }, {} as Record<PageKey, PageStructureSnapshotRow[]>)
}

const PREVIEW_DEVICES: PreviewDevice[] = [
  { key: 'desktop', label: '桌面', width: 1440, icon: Monitor },
  { key: 'tablet', label: '平板', width: 768, icon: Tablet },
  { key: 'mobile', label: '手机', width: 390, icon: Smartphone },
]

const MODULE_PREFERRED_PREVIEW_DEVICE: Partial<Record<string, PreviewDeviceKey>> = {
  'site:ui-labels': 'mobile',
}

const CANVAS_ZOOM_MODES: Array<{ key: CanvasZoomMode; label: string }> = [
  { key: 'actual', label: '100%' },
  { key: 'fit', label: '适合窗口' },
]

const PAGE_LABELS = {
  home: '首页',
  products: '产品中心',
  cases: '项目案例',
  contact: '联系入口',
  site: '导航 / 页脚',
  auth: '登录 / 注册',
  account: '账户中心',
  about: '关于我们',
  global: 'Global',
  faq: 'FAQ',
  'media-kit': '媒体资料',
  scenarios: '应用场景',
  innovation: '创新',
  display: '展示',
  news: '新闻',
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
  'products:hero',
  'products:highlights',
  'products:contact-card',
  'products:ui-labels',
  'products:detail-labels',
  'products:inquiry-form',
  'cases:hero',
  'cases:detail-labels',
  'cases:inquiry-form',
  'contact:hero',
  'contact:channels',
  'contact:form',
  'contact:source-context',
  'contact:backup',
  'contact:faq-panel',
  'contact:email',
  'site:navbar',
  'site:ui-labels',
  'site:footer-cta',
  'site:footer-brand',
  'site:footer-products',
  'site:footer-company',
  'site:footer-about',
  'site:footer-contact',
  'site:floating-contact',
  'auth:shared',
  'auth:login',
  'auth:register',
  'account:header',
  'account:profile',
  'account:password',
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
  'faq:hero',
  'faq:list',
  'faq:inquiry-form',
  'media-kit:hero',
  'media-kit:resources',
  'media-kit:form',
  'scenarios:inquiry-form',
  'innovation:inquiry-form',
  'display:hero',
  'display:ui',
  'news:hero',
  'news:ui',
]

const EDITABLE_MODULE_ID_SET = new Set(EDITABLE_MODULE_IDS)
const NON_FRONT_CANVAS_MODULE_ID_SET = new Set([
  'contact:faq-panel',
  'contact:email',
  'site:ui-labels',
])

function moduleId(pageModule: Pick<PageModuleRow, 'page_key' | 'module_key'>) {
  return `${pageModule.page_key}:${pageModule.module_key}`
}

function isPageKey(value: string): value is PageKey {
  return PAGE_KEY_SET.has(value as PageKey)
}

function pageLabel(pageKey: string) {
  return isPageKey(pageKey) ? PAGE_LABELS[pageKey] : pageKey
}

function canvasPageKeyForModule(pageModule: PageModuleRow, preferredPageKey: PageKey | null | undefined) {
  if (pageModule.page_key === 'site' && preferredPageKey && preferredPageKey !== 'site') return preferredPageKey
  return isPageKey(pageModule.page_key) ? pageModule.page_key : 'home'
}

function moduleBelongsToCanvas(pageModule: PageModuleRow, canvasPageKey: PageKey) {
  return pageModule.page_key === canvasPageKey || (canvasPageKey !== 'site' && pageModule.page_key === 'site')
}

function moduleHasFrontCanvas(pageModule: PageModuleRow) {
  return !NON_FRONT_CANVAS_MODULE_ID_SET.has(moduleId(pageModule))
}

function canvasQueryPageKey(pageModule: PageModuleRow | null | undefined, canvasPageKey: PageKey) {
  if (pageModule?.page_key === 'site' && canvasPageKey !== 'site') return canvasPageKey
  return null
}

function moduleUrl(id: string, canvasPageKey?: PageKey | null) {
  const params = new URLSearchParams({ module: id })
  if (canvasPageKey) params.set('canvas', canvasPageKey)
  return `/admin/site/visual?${params.toString()}#visual-editor`
}

function moduleSearchText(pageModule: PageModuleRow) {
  return [
    pageModule.page_key,
    pageModule.module_key,
    pageModule.title_zh,
    pageModule.title_en,
    pageModule.description_zh,
    pageModule.description_en,
    ...pageModule.items.flatMap((item) => [
      item.id,
      item.label_zh,
      item.label_en,
      item.value_zh,
      item.value_en,
      item.content_zh,
      item.content_en,
    ]),
  ]
    .join(' ')
    .toLowerCase()
}

const VISUAL_EDITOR_COVERAGE_LABEL = '全站页面'

function ModuleCatalogCard({
  item,
  disabled,
  actionLabel,
  onAction,
}: {
  item: PageModuleCatalogItem
  disabled: boolean
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="rounded-md border border-[#E5DED4] bg-white px-3 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#2C2A28]">{item.name}</p>
          <p className="mt-1 truncate text-xs text-[#8A8580]">可添加</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onAction}
        >
          <Plus size={14} />
          {actionLabel}
        </Button>
      </div>
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
  const stale = currentStructureDraft?.draft_status === 'stale'
  const canAddOnCurrentPage = selectedPage === 'home'

  return (
    <section className="rounded-md border border-[#E5DED4] bg-white p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2A28]">
            <Layers3 size={16} className="text-[#E36F2C]" />
            <span>添加内容</span>
          </div>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#F5F2ED] px-3 py-1 text-xs font-medium text-[#6B625B]">
          {canAddOnCurrentPage ? '可添加' : '仅编辑'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
        {canAddOnCurrentPage ? (
          HOME_ADDABLE_PAGE_MODULE_TEMPLATES.map((template) => {
            const item = PLANNED_PAGE_MODULE_CATALOG.find((entry) => entry.id === template.templateId)
            if (!item) return null
            return (
              <ModuleCatalogCard
                key={template.templateId}
                item={item}
                disabled={Boolean(structureBusy) || stale}
                actionLabel={currentStructureDraft ? '添加' : '创建并添加'}
                onAction={() => onAddTemplate(template.templateId)}
              />
            )
          })
        ) : (
          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-3 py-3 text-sm font-medium text-[#6B625B]">
            当前页可编辑已有模块
          </div>
        )}
      </div>
    </section>
  )
}

function moduleSelector(id: string) {
  return `[data-page-module="${id}"]`
}

function moduleLocatorSelector(id: string) {
  const selector = moduleSelector(id)
  return [
    selector,
    `${selector}[data-page-module-field]`,
    `${selector} [data-page-module-field]`,
    `${selector}[data-page-module-item]`,
    `${selector} [data-page-module-item]`,
    `${selector}[data-cms-edit-url]`,
    `${selector} [data-cms-edit-url]`,
  ].join(',')
}

function moduleElements(doc: Document, id: string) {
  return Array.from(doc.querySelectorAll<HTMLElement>(moduleLocatorSelector(id)))
}

function moduleElementArea(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return Math.max(0, rect.width) * Math.max(0, rect.height)
}

function moduleElementRank(element: HTMLElement, id: string) {
  if (element.dataset.pageModule === id && !element.dataset.pageModuleField && !element.dataset.pageModuleItem && !element.dataset.cmsEditUrl) return 0
  if (element.dataset.pageModuleField || element.dataset.cmsEditUrl) return 1
  if (element.dataset.pageModuleItem) return 2
  return 3
}

function findPrimaryModuleElement(doc: Document, id: string) {
  const elements = moduleElements(doc, id)
    .filter((element) => isVisibleCanvasRect(element.getBoundingClientRect()))
    .sort((a, b) => {
      const rankDiff = moduleElementRank(a, id) - moduleElementRank(b, id)
      if (rankDiff !== 0) return rankDiff
      return moduleElementArea(b) - moduleElementArea(a)
    })

  return elements[0] ?? null
}

function isScrollableCanvasAncestor(element: HTMLElement, axis: 'x' | 'y') {
  const view = element.ownerDocument.defaultView
  const style = view?.getComputedStyle(element)
  if (!style) return false

  const overflow = axis === 'y' ? `${style.overflowY} ${style.overflow}` : `${style.overflowX} ${style.overflow}`
  if (!/(auto|scroll|overlay|hidden)/.test(overflow)) return false

  return axis === 'y'
    ? element.scrollHeight > element.clientHeight + 4
    : element.scrollWidth > element.clientWidth + 4
}

function scrollCanvasAncestorsIntoView(target: HTMLElement) {
  let parent = target.parentElement

  while (parent && parent !== target.ownerDocument.body && parent !== target.ownerDocument.documentElement) {
    const parentRect = parent.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    let nextTop = parent.scrollTop
    let nextLeft = parent.scrollLeft

    if (isScrollableCanvasAncestor(parent, 'y')) {
      if (targetRect.top < parentRect.top + 24) {
        nextTop += targetRect.top - parentRect.top - 24
      } else if (targetRect.bottom > parentRect.bottom - 24) {
        nextTop += targetRect.bottom - parentRect.bottom + 24
      }
    }

    if (isScrollableCanvasAncestor(parent, 'x')) {
      if (targetRect.left < parentRect.left + 24) {
        nextLeft += targetRect.left - parentRect.left - 24
      } else if (targetRect.right > parentRect.right - 24) {
        nextLeft += targetRect.right - parentRect.right + 24
      }
    }

    if (nextTop !== parent.scrollTop || nextLeft !== parent.scrollLeft) {
      parent.scrollTo({
        top: Math.max(0, nextTop),
        left: Math.max(0, nextLeft),
        behavior: 'auto',
      })
    }

    parent = parent.parentElement
  }
}

function cmsEditSelector(id: string) {
  return `[data-cms-edit-id="${selectorValue(id)}"]`
}

function selectorValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function datasetBoolean(value: string | undefined | null) {
  return value === '1' || value === 'true'
}

function datasetNumber(value: string | undefined | null) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function payloadPatchKey(patchKey: string | null) {
  if (!patchKey?.startsWith('payload.')) return null
  const key = patchKey.slice('payload.'.length).trim()
  return key || null
}

function plainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function canvasInputType(value: string | undefined | null): ExternalCanvasEditTarget['input'] {
  if (value === 'textarea') return 'textarea'
  if (value === 'image') return 'image'
  if (value === 'number') return 'number'
  if (value === 'select') return 'select'
  return 'text'
}

function parseExternalSelectOptions(value: string | undefined | null): ExternalSelectOption[] {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item): ExternalSelectOption | null => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const optionValue = typeof record.value === 'string' ? record.value.trim() : ''
        if (!optionValue) return null
        const optionLabel = typeof record.label === 'string' && record.label.trim()
          ? record.label.trim()
          : optionValue
        return { value: optionValue, label: optionLabel }
      })
      .filter((item): item is ExternalSelectOption => Boolean(item))
  } catch {
    return []
  }
}

function externalSelectLabel(target: ExternalCanvasEditTarget, value: string) {
  if (target.input !== 'select') return value
  return target.selectOptions.find((option) => option.value === value)?.label ?? value
}

function externalPatchValue(target: ExternalCanvasEditTarget, nextText: string) {
  if (target.nullable && !nextText) return null
  if (target.input !== 'number') return nextText

  const normalized = nextText.replace(/,/g, '').trim()
  const match = normalized.match(/-?\d+(?:\.\d+)?/)
  const parsed = match ? Number(match[0]) : Number.NaN
  if (!Number.isFinite(parsed)) {
    throw new Error('请输入有效数字')
  }
  return parsed
}

function externalObjectPathSegments(path: string | null) {
  if (!path) return []
  const segments = path.split('.').map((segment) => segment.trim()).filter(Boolean)
  for (const segment of segments) {
    if (
      !/^[A-Za-z0-9_-]+$/.test(segment)
      || segment === '__proto__'
      || segment === 'prototype'
      || segment === 'constructor'
    ) {
      throw new Error('这项需要打开编辑页处理')
    }
  }
  return segments
}

function setExternalNestedValue(source: unknown, segments: string[], value: unknown): unknown {
  if (segments.length === 0) return value
  const [head, ...rest] = segments

  if (Array.isArray(source)) {
    const index = Number(head)
    if (!Number.isInteger(index) || index < 0 || index >= source.length) {
      throw new Error('当前列表项已变化，请刷新预览后再试')
    }
    const next = [...source]
    next[index] = setExternalNestedValue(source[index], rest, value)
    return next
  }

  if (!source || typeof source !== 'object') {
    throw new Error('这项需要打开编辑页处理')
  }

  const record = source as Record<string, unknown>
  return {
    ...record,
    [head]: setExternalNestedValue(record[head], rest, value),
  }
}

function getExternalNestedValue(source: unknown, segments: string[]): unknown {
  let current = source
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return undefined
      current = current[index]
    } else if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }
  return current
}

function externalEditTargetFromElement(element: HTMLElement, text: string | null): ExternalCanvasEditTarget | null {
  const href = element.dataset.cmsEditUrl
  if (!href) return null
  const input = canvasInputType(element.dataset.cmsEditInput)
  const selectOptions = parseExternalSelectOptions(element.dataset.cmsEditOptions)

  return {
    kind: element.dataset.cmsEditKind || 'content',
    title: element.dataset.cmsEditTitle || '内容编辑',
    field: element.dataset.cmsEditField || '当前内容',
    href,
    targetId: element.dataset.cmsEditId || null,
    text: input === 'image' ? (element.dataset.cmsEditValue ?? '') : (element.dataset.cmsEditValue ?? text),
    apiUrl: element.dataset.cmsEditApiUrl || null,
    patchKey: element.dataset.cmsEditPatchKey || null,
    objectKey: element.dataset.cmsEditObjectKey || null,
    objectPath: element.dataset.cmsEditObjectPath || null,
    input,
    selectOptions,
    maxLength: datasetNumber(element.dataset.cmsEditMaxLength),
    arrayIndex: datasetNumber(element.dataset.cmsEditArrayIndex),
    arrayMode: element.dataset.cmsEditArrayMode === 'append' ? 'append' : 'replace',
    required: datasetBoolean(element.dataset.cmsEditRequired),
    nullable: datasetBoolean(element.dataset.cmsEditNullable),
    displaySuffix: element.dataset.cmsEditDisplaySuffix || null,
  }
}

function externalEditTargetFromMessage(data: {
  editKind?: string | null
  editTitle?: string | null
  editField?: string | null
  editUrl?: string | null
  editTargetId?: string | null
  text?: string | null
  editApiUrl?: string | null
  editPatchKey?: string | null
  editObjectKey?: string | null
  editObjectPath?: string | null
  editInput?: string | null
  editMaxLength?: string | null
  editArrayIndex?: string | null
  editArrayMode?: string | null
  editRequired?: string | null
  editNullable?: string | null
  editValue?: string | null
  editOptions?: string | null
  editDisplaySuffix?: string | null
}): ExternalCanvasEditTarget | null {
  if (!data.editUrl) return null
  const input = canvasInputType(data.editInput)
  const selectOptions = parseExternalSelectOptions(data.editOptions)

  return {
    kind: data.editKind || 'content',
    title: data.editTitle || '内容编辑',
    field: data.editField || '当前内容',
    href: data.editUrl,
    targetId: data.editTargetId ?? null,
    text: input === 'image' ? (data.editValue ?? '') : (data.editValue ?? data.text ?? null),
    apiUrl: data.editApiUrl ?? null,
    patchKey: data.editPatchKey ?? null,
    objectKey: data.editObjectKey ?? null,
    objectPath: data.editObjectPath ?? null,
    input,
    selectOptions,
    maxLength: datasetNumber(data.editMaxLength),
    arrayIndex: datasetNumber(data.editArrayIndex),
    arrayMode: data.editArrayMode === 'append' ? 'append' : 'replace',
    required: datasetBoolean(data.editRequired),
    nullable: datasetBoolean(data.editNullable),
    displaySuffix: data.editDisplaySuffix ?? null,
  }
}

function moduleFieldSelector(selection: FieldSelection) {
  const item = selection.itemId ? selectorValue(selection.itemId) : null
  if (!selection.field) return item ? `[data-page-module-item="${item}"]` : null
  const field = selectorValue(selection.field)
  if (!item) return `[data-page-module-field="${field}"]`

  const selectors = [
    `[data-page-module-item="${item}"][data-page-module-field="${field}"]`,
    `[data-page-module-item="${item}"] [data-page-module-field="${field}"]`,
  ]
  if (selection.field === 'href') selectors.push(`[data-page-module-item="${item}"]`)
  return selectors.join(',')
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

function isFrameVisualPreviewHydrated(doc: Document) {
  return Boolean(
    (doc.defaultView as (Window & { __vessel303VisualPreviewHydrated?: boolean }) | null)
      ?.__vessel303VisualPreviewHydrated,
  )
}

function canvasRectFromElement(element: HTMLElement): HighlightRect {
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function clearFrameSelectedHotspots(doc: Document) {
  if (!isFrameVisualPreviewHydrated(doc)) return
  doc.querySelectorAll(`[${FRAME_SELECTED_HOTSPOT_ATTR}="true"]`).forEach((node) => {
    node.removeAttribute(FRAME_SELECTED_HOTSPOT_ATTR)
  })
}

function syncFrameSelectedHotspot(doc: Document, target: HTMLElement | null) {
  if (!isFrameVisualPreviewHydrated(doc)) return
  clearFrameSelectedHotspots(doc)
  target?.setAttribute(FRAME_SELECTED_HOTSPOT_ATTR, 'true')
}

function getFrameElement(target: EventTarget | null, doc: Document) {
  if (!target) return null

  const elementCtor = doc.defaultView?.Element
  if (elementCtor && target instanceof elementCtor) return target as Element

  const node = target as { nodeType?: number; parentElement?: Element | null }
  if (node.nodeType === 1) return target as Element
  return node.parentElement ?? null
}

function isHtmlElementLike(element: Element | null): element is HTMLElement {
  return Boolean(element && 'dataset' in element && typeof element.getBoundingClientRect === 'function')
}

function canvasEventPoint(controls?: CanvasEventControls) {
  const event = controls as Partial<MouseEvent> | undefined
  if (typeof event?.clientX !== 'number' || typeof event.clientY !== 'number') return null
  return { x: event.clientX, y: event.clientY }
}

const MEDIA_SELECTION_FIELDS = new Set(['image_url', 'video_url', 'video_poster_url'])

function canvasPointCandidateRank(element: HTMLElement) {
  const field = element.dataset.pageModuleField
  if (!field) return 1
  return MEDIA_SELECTION_FIELDS.has(field) ? 2 : 0
}

function canvasPointCandidateArea(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return rect.width * rect.height
}

function compareCanvasPointCandidates(a: HTMLElement, b: HTMLElement) {
  const rankDiff = canvasPointCandidateRank(a) - canvasPointCandidateRank(b)
  if (rankDiff !== 0) return rankDiff
  return canvasPointCandidateArea(a) - canvasPointCandidateArea(b)
}

function closestCanvasElementFromPoint(target: Element, controls: CanvasEventControls | undefined, selector: string) {
  const point = canvasEventPoint(controls)
  if (!point) return null

  const doc = target.ownerDocument
  const matches: HTMLElement[] = []
  if (typeof doc.elementsFromPoint === 'function') {
    for (const element of doc.elementsFromPoint(point.x, point.y)) {
      const match = element.closest(selector)
      if (isHtmlElementLike(match) && !matches.includes(match)) matches.push(match)
    }
  }

  const fallbackRoot = target.closest('[data-page-module]')
  if (fallbackRoot) {
    for (const candidate of Array.from(fallbackRoot.querySelectorAll<HTMLElement>(selector))) {
      const rect = candidate.getBoundingClientRect()
      if (
        rect.width > 0
        && rect.height > 0
        && point.x >= rect.left
        && point.x <= rect.right
        && point.y >= rect.top
        && point.y <= rect.bottom
        && !matches.includes(candidate)
      ) {
        matches.push(candidate)
      }
    }
  }

  if (matches.length === 0) return null
  matches.sort(compareCanvasPointCandidates)
  return matches[0]
}

function closestCanvasModuleFromPoint(target: Element, controls?: CanvasEventControls) {
  const point = canvasEventPoint(controls)
  if (!point) return null

  const doc = target.ownerDocument
  if (typeof doc.elementsFromPoint !== 'function') return null
  for (const element of doc.elementsFromPoint(point.x, point.y)) {
    const match = element.closest('[data-page-module]')
    if (isHtmlElementLike(match)) return match
  }
  return null
}

function editableHotspotFromFrameTarget(target: Element | null) {
  return target?.closest(EDITABLE_HOTSPOT_SELECTOR) as HTMLElement | null
}

function normalizeCanvasText(value?: string | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function counterpartLanguageField(field: string | null) {
  if (!field) return null
  if (field.endsWith('_zh')) return field.replace(/_zh$/, '_en')
  if (field.endsWith('_en')) return field.replace(/_en$/, '_zh')
  return null
}

function stringFieldValue(source: unknown, field: string | null) {
  if (!source || !field) return ''
  const value = (source as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : ''
}

function visibleTextForCanvasSelection(target: Element | null, fieldEl: HTMLElement | null) {
  const source = fieldEl ?? target
  if (!source) return null
  if (hasTagName(source, 'input') || hasTagName(source, 'textarea')) {
    return (source as HTMLInputElement | HTMLTextAreaElement).value.trim() || null
  }
  if (hasTagName(source, 'img')) {
    const image = source as HTMLImageElement
    return image.alt.trim() || image.src || null
  }

  const text = source.textContent?.replace(/\s+/g, ' ').trim()
  if (text) return text
  return source.getAttribute('aria-label') ?? source.getAttribute('title')
}

function isVisibleCanvasRect(rect: Pick<HighlightRect, 'width' | 'height'>) {
  return rect.width >= 4 && rect.height >= 4
}

function readCanvasDocumentHeight(doc: Document) {
  if (!doc.documentElement) return MIN_CANVAS_FRAME_HEIGHT

  const scrollTop = doc.defaultView?.scrollY ?? doc.documentElement.scrollTop ?? doc.body?.scrollTop ?? 0
  const measuredChildren = Array.from(doc.body?.children ?? [])
    .filter((element) => doc.defaultView?.getComputedStyle(element).position !== 'fixed')
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return rect.bottom + scrollTop
    })
    .filter((value) => Number.isFinite(value) && value > 0)
  const heightCandidates = measuredChildren.length > 0
    ? measuredChildren
    : [
        doc.documentElement.scrollHeight,
        doc.body?.scrollHeight,
        doc.documentElement.offsetHeight,
        doc.body?.offsetHeight,
      ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
  const contentHeight = Math.max(MIN_CANVAS_FRAME_HEIGHT, ...heightCandidates)
  return Math.min(MAX_CANVAS_FRAME_HEIGHT, Math.ceil(contentHeight + CANVAS_FRAME_HEIGHT_PADDING))
}

function canvasHotspotLayer(element: HTMLElement): CanvasHotspot['layer'] {
  if (element.dataset.cmsEditUrl) return 'external'
  if (element.dataset.pageModuleField) return 'field'
  if (element.dataset.pageModuleItem) return 'item'
  return 'module'
}

const MEDIA_CANVAS_FIELDS = new Set(['image_url', 'video_url', 'video_poster_url'])
const CANVAS_HOTSPOT_LIMIT = 420
const CANVAS_SHELL_SAFE_TOP = 72

function canvasHotspotZIndex(hotspot: CanvasHotspot) {
  const area = hotspot.width * hotspot.height

  if (hotspot.layer === 'external') {
    const input = hotspot.externalTarget?.input
    const inputBoost = input === 'image' ? 10 : 6
    const compactBoost = area < 30000 ? 8 : area < 80000 ? 4 : 0
    const largePenalty = area > 140000 ? -18 : area > 90000 ? -8 : 0

    return 44 + inputBoost + compactBoost + largePenalty
  }

  if (hotspot.layer === 'item') return 20
  if (hotspot.layer === 'module') return 10

  const mediaPenalty = hotspot.field && MEDIA_CANVAS_FIELDS.has(hotspot.field) ? -6 : 8
  const compactFieldBoost = area < 30000 ? 4 : 0
  const largeFieldPenalty = area > 160000 ? -4 : 0

  return 30 + mediaPenalty + compactFieldBoost + largeFieldPenalty
}

function canvasHotspotLayerRank(layer: CanvasHotspot['layer']) {
  if (layer === 'external') return 0
  if (layer === 'field') return 1
  if (layer === 'item') return 2
  return 3
}

function canvasHotspotVisualWeight(hotspot: CanvasHotspot) {
  const area = hotspot.width * hotspot.height
  if (area > 220000) return 3
  if (area > 120000) return 2
  if (area > 60000) return 1
  return 0
}

function compareCanvasHotspots(a: CanvasHotspot, b: CanvasHotspot) {
  const layerDiff = canvasHotspotLayerRank(a.layer) - canvasHotspotLayerRank(b.layer)
  if (layerDiff !== 0) return layerDiff

  const weightDiff = canvasHotspotVisualWeight(a) - canvasHotspotVisualWeight(b)
  if (weightDiff !== 0) return weightDiff

  const topDiff = a.top - b.top
  if (Math.abs(topDiff) >= 1) return topDiff

  const leftDiff = a.left - b.left
  if (Math.abs(leftDiff) >= 1) return leftDiff

  return (a.width * a.height) - (b.width * b.height)
}

function collectCanvasHotspots(doc: Document, previewModules: PageModuleRow[]) {
  const allowedModules = new Set(previewModules.map(moduleId))
  const elements = Array.from(
    doc.querySelectorAll<HTMLElement>('[data-cms-edit-url],[data-page-module-field],[data-page-module-item],[data-page-module]'),
  )
  const seen = new Set<string>()
  const hotspots: CanvasHotspot[] = []

  for (const element of elements) {
    const moduleEl = element.dataset.pageModule
      ? element
      : element.closest('[data-page-module]') as HTMLElement | null
    const moduleKey = moduleEl?.dataset.pageModule ?? null
    const isExternalEditElement = Boolean(element.dataset.cmsEditUrl)
    if (!moduleEl || !moduleKey) continue
    if (!isExternalEditElement && !allowedModules.has(moduleKey)) continue

    const rect = canvasRectFromElement(element)
    if (!isVisibleCanvasRect(rect)) continue

    const itemEl = element.dataset.pageModuleItem
      ? element
      : element.closest('[data-page-module-item]') as HTMLElement | null
    const itemId = itemEl && moduleEl.contains(itemEl)
      ? itemEl.dataset.pageModuleItem ?? null
      : null
    const field = element.dataset.pageModuleField ?? null
    const layer = canvasHotspotLayer(element)
    const text = visibleTextForCanvasSelection(element, field || element.dataset.cmsEditUrl ? element : null)
    const externalTarget = element.dataset.cmsEditUrl ? externalEditTargetFromElement(element, text) : null
    const rectKey = [
      Math.round(rect.top),
      Math.round(rect.left),
      Math.round(rect.width),
      Math.round(rect.height),
    ].join(':')
    const key = [
      moduleKey,
      itemId ?? '',
      field ?? '',
      externalTarget?.targetId ?? '',
      externalTarget?.field ?? '',
      rectKey,
    ].join('|')
    if (seen.has(key)) continue
    seen.add(key)

    hotspots.push({
      id: key,
      moduleId: moduleKey,
      itemId,
      field,
      text,
      layer,
      externalTarget,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })
  }

  return hotspots.sort(compareCanvasHotspots).slice(0, CANVAS_HOTSPOT_LIMIT)
}

function canvasTextMatchesValue(visibleText: string, fieldValue: string) {
  if (!visibleText || !fieldValue) return false
  if (visibleText === fieldValue) return true
  if (Math.min(visibleText.length, fieldValue.length) < 3) return false
  return visibleText.includes(fieldValue) || fieldValue.includes(visibleText)
}

function inferItemFieldFromVisibleText(pageModule: PageModuleRow, item: PageModuleItem, visibleText: string) {
  const matches = getItemQuickActionFields(pageModule, item).filter((field) => (
    canvasTextMatchesValue(visibleText, normalizeCanvasText(quickActionValue(pageModule, item, field)))
  ))
  return matches.length === 1 ? matches[0] : null
}

function inferModuleFieldFromVisibleText(pageModule: PageModuleRow, visibleText: string) {
  const fields: ModuleQuickField[] = ['title_zh', 'title_en', 'description_zh', 'description_en']
  const matches = fields.filter((field) => (
    canvasTextMatchesValue(visibleText, normalizeCanvasText(quickActionValue(pageModule, null, field)))
  ))
  return matches.length === 1 ? matches[0] : null
}

function defaultModuleCanvasField(pageModule: PageModuleRow): ModuleQuickField {
  const fields: ModuleQuickField[] = [
    'title_zh',
    'title_en',
    'description_zh',
    'description_en',
    'image_url',
    'video_url',
    'video_poster_url',
    'href',
  ]
  return fields.find((field) => quickActionValue(pageModule, null, field).trim()) ?? 'title_zh'
}

function defaultItemCanvasField(pageModule: PageModuleRow, item: PageModuleItem): ItemQuickField | null {
  const available = new Set(getItemQuickActionFields(pageModule, item))
  const preferred: ItemQuickField[] = [
    'label_zh',
    'label_en',
    'value_zh',
    'value_en',
    'content_zh',
    'content_en',
    'href',
    'image_url',
    'video_url',
    'video_poster_url',
  ]
  const fields = preferred.filter((field) => available.has(field))
  return fields.find((field) => quickActionValue(pageModule, item, field).trim()) ?? fields[0] ?? null
}

function hasTagName(element: Element, tagName: string) {
  return element.tagName.toLowerCase() === tagName
}

function resolveCanvasSelection(pageModule: PageModuleRow, payload: CanvasSelectionPayload): FieldSelection {
  const selection: FieldSelection = {
    itemId: payload.itemId,
    field: payload.field,
  }
  const visibleText = normalizeCanvasText(payload.text)
  if (visibleText && !selection.field) {
    if (selection.itemId) {
      const selectedItem = pageModule.items.find((item) => item.id === selection.itemId) ?? null
      const inferredField = selectedItem ? inferItemFieldFromVisibleText(pageModule, selectedItem, visibleText) : null
      if (inferredField) selection.field = inferredField
    } else {
      const inferredField = inferModuleFieldFromVisibleText(pageModule, visibleText)
      if (inferredField) selection.field = inferredField
    }
  }

  if (!selection.field) {
    if (selection.itemId) {
      const selectedItem = pageModule.items.find((item) => item.id === selection.itemId) ?? null
      const defaultField = selectedItem ? defaultItemCanvasField(pageModule, selectedItem) : null
      if (defaultField) selection.field = defaultField
    } else {
      selection.field = defaultModuleCanvasField(pageModule)
    }
  }

  if (selection.itemId && selection.field && !isItemQuickField(selection.field) && isModuleQuickField(selection.field)) {
    selection.itemId = null
  }

  const counterpart = counterpartLanguageField(selection.field)
  if (!visibleText || !selection.field || !counterpart) return selection

  const source = selection.itemId
    ? pageModule.items.find((item) => item.id === selection.itemId) ?? null
    : pageModule
  if (!source) return selection

  const currentValue = normalizeCanvasText(stringFieldValue(source, selection.field))
  const counterpartValue = normalizeCanvasText(stringFieldValue(source, counterpart))
  if (counterpartValue && counterpartValue === visibleText && currentValue !== visibleText) {
    return { ...selection, field: counterpart }
  }
  return selection
}

function sameRecord(a: Record<string, boolean>, b: Record<string, boolean>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    if (a[key] !== b[key]) return false
  }
  return true
}

function sameHighlightRect(a: HighlightRect | null, b: HighlightRect | null) {
  if (!a || !b) return a === b
  return (
    Math.abs(a.top - b.top) < 1
    && Math.abs(a.left - b.left) < 1
    && Math.abs(a.width - b.width) < 1
    && Math.abs(a.height - b.height) < 1
  )
}

function stopCanvasEvent(controls?: CanvasEventControls) {
  controls?.preventDefault()
  controls?.stopPropagation()
  controls?.stopImmediatePropagation?.()
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

function getInitialModuleSelection(
  modules: PageModuleRow[],
  requestedModuleId: string | null,
  requestedCanvasPageKey: PageKey | null = null,
) {
  const editableModules = filterEditableModules(modules)
  const requestedModule = requestedModuleId
    ? editableModules.find((pageModule) => moduleId(pageModule) === requestedModuleId)
    : null
  const fallbackModule = editableModules.find((pageModule) => moduleId(pageModule) === 'home:hero') ?? editableModules[0] ?? null
  const selectedModule = requestedModule ?? fallbackModule

  if (!selectedModule) {
    return { pageKey: 'home' as PageKey, moduleId: 'home:hero' }
  }

  return {
    pageKey: canvasPageKeyForModule(selectedModule, requestedCanvasPageKey),
    moduleId: moduleId(selectedModule),
  }
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
    pageModule.module_type === 'navigation' ||
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

function isLinkItem(pageModule: PageModuleRow, item: PageModuleItem) {
  return pageModule.module_type === 'navigation' || Boolean(item.href) || item.id.includes('cta')
}

function showValueFields(pageModule: PageModuleRow, item: PageModuleItem) {
  return (
    pageModule.module_type === 'navigation' ||
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
    name: '名称',
    slug: '链接标识',
    title: '标题',
    title_zh: '中文标题',
    title_en: '英文标题',
    headline: '主标题',
    subtitle: '副标题',
    eyebrow: '栏目文字',
    summary: '摘要',
    description: '说明',
    description_zh: '中文副文案',
    description_en: '英文副文案',
    label: '文字',
    label_zh: '中文文字',
    label_en: '英文文字',
    value: '数值/编号',
    value_zh: '中文数值/编号',
    value_en: '英文数值/编号',
    content: '正文',
    content_zh: '中文正文',
    content_en: '英文正文',
    body: '正文',
    body_zh: '中文正文',
    body_en: '英文正文',
    question: '问题',
    answer: '答案',
    image: '图片',
    image_url: '图片',
    cover: '封面',
    cover_url: '封面',
    video_url: '视频 URL',
    video_poster_url: '视频封面',
    url: '链接',
    href: '链接',
    status: '状态',
    publish_status: '发布状态',
    seo_title: 'SEO 标题',
    seo_description: 'SEO 描述',
  }
  return labels[field] ?? '可编辑内容'
}

function canvasFieldLabel(field: string) {
  const trimmed = field.trim()
  if (!trimmed) return '当前内容'
  if (/[\u4e00-\u9fff]/.test(trimmed)) return trimmed

  const normalized = trimmed
    .replace(/^payload\./, '')
    .replace(/\[(\d+)\]/g, '')
    .replace(/[.-]/g, '_')
  const label = fieldLabel(normalized)
  if (label !== '可编辑内容') return label

  if (normalized.includes('title') || normalized.includes('name')) return '标题'
  if (normalized.includes('description') || normalized.includes('summary')) return '说明'
  if (normalized.includes('content') || normalized.includes('body')) return '正文'
  if (normalized.includes('image') || normalized.includes('photo') || normalized.includes('cover')) return '图片'
  if (normalized.includes('link') || normalized.includes('href') || normalized.includes('url')) return '链接'
  if (normalized.includes('seo')) return 'SEO 内容'
  return '当前内容'
}

function externalEditTitle(target: ExternalCanvasEditTarget | null) {
  if (!target) return ''
  if (target.kind === 'product') return '产品内容'
  if (target.kind === 'product-taxonomy') return '产品分类'
  if (target.kind === 'project') return target.title.includes('Global') ? 'Global 项目' : '案例内容'
  if (target.kind === 'news') return '新闻内容'
  if (target.kind === 'site-content') return target.title || '站点内容'
  return target.title || '页面内容'
}

function externalEditFieldLabel(target: ExternalCanvasEditTarget | null) {
  return target ? canvasFieldLabel(target.field) : ''
}

function isModuleQuickField(field: string | null): field is ModuleQuickField {
  return Boolean(field && MODULE_QUICK_FIELD_SET.has(field))
}

function isItemQuickField(field: string | null): field is ItemQuickField {
  return Boolean(field && ITEM_QUICK_FIELD_SET.has(field))
}

function quickFieldInput(field: ModuleQuickField | ItemQuickField, value = ''): QuickSelectedField['input'] {
  if (field === 'image_url' || field === 'video_poster_url') return 'image'
  if (value.includes('\n')) return 'textarea'
  if (field.includes('description') || field.includes('content')) return 'textarea'
  return 'text'
}

function quickFieldIcon(field: ModuleQuickField | ItemQuickField): LucideIcon {
  if (field === 'image_url' || field === 'video_poster_url') return ImageIcon
  if (field === 'video_url') return Video
  if (field === 'href') return Link2
  return Type
}

function getItemQuickActionFields(pageModule: PageModuleRow, item: PageModuleItem, compact = false) {
  const fields: ItemQuickField[] = ['label_en', 'label_zh']

  if (showValueFields(pageModule, item)) fields.push('value_en', 'value_zh')
  if (showContentFields(pageModule, item)) fields.push('content_en', 'content_zh')
  if (isImageItem(pageModule, item)) fields.unshift('image_url')
  if (isVideoItem(pageModule, item)) fields.push('video_url', 'video_poster_url')
  if (isLinkItem(pageModule, item)) fields.push('href')

  const uniqueFields = fields.filter((field, index) => fields.indexOf(field) === index)
  return compact ? uniqueFields.slice(0, 3) : uniqueFields
}

function quickActionValue(pageModule: PageModuleRow, item: PageModuleItem | null, field: ModuleQuickField | ItemQuickField) {
  const source = item ?? pageModule
  const value = (source as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : ''
}

function appendQuickAction(
  actions: QuickFieldAction[],
  pageModule: PageModuleRow,
  item: PageModuleItem | null,
  field: ModuleQuickField | ItemQuickField,
) {
  const itemId = item?.id ?? null
  const key = `${itemId ?? 'module'}:${field}`
  if (actions.some((action) => action.key === key)) return

  const value = quickActionValue(pageModule, item, field)
  const subject = item ? readableItemTitle(item) : readableModuleTitle(pageModule)
  actions.push({
    key,
    itemId,
    field,
    subject,
    label: item ? `${readableItemTitle(item)} / ${fieldLabel(field)}` : fieldLabel(field),
    value,
    Icon: quickFieldIcon(field),
  })
}

function buildQuickFieldActions(pageModule: PageModuleRow, selectedItem: PageModuleItem | null) {
  const actions: QuickFieldAction[] = []

  if (selectedItem) {
    for (const field of getItemQuickActionFields(pageModule, selectedItem)) {
      appendQuickAction(actions, pageModule, selectedItem, field)
    }
    return actions
  }

  const moduleFields: ModuleQuickField[] = ['title_en', 'description_en', 'title_zh', 'description_zh']
  for (const field of ['image_url', 'video_url', 'video_poster_url', 'href'] as ModuleQuickField[]) {
    if (quickActionValue(pageModule, null, field)) moduleFields.push(field)
  }
  for (const field of moduleFields) {
    appendQuickAction(actions, pageModule, null, field)
  }

  for (const item of sortedItems(pageModule.items).filter((entry) => entry.is_visible !== false)) {
    for (const field of getItemQuickActionFields(pageModule, item, true)) {
      appendQuickAction(actions, pageModule, item, field)
      if (actions.length >= 16) return actions
    }
  }

  return actions
}

function buildPreviewSrc(path: string, version: number) {
  const params = new URLSearchParams({ visualDraft: '1' })
  if (version) params.set('visualPreview', String(version))
  const joiner = path.includes('?') ? '&' : '?'
  return `${path}${joiner}${params.toString()}`
}

function previewPathForModule(
  defaultPath: string,
  pageModule: PageModuleRow | null | undefined,
  selection?: FieldSelection | null,
  caseDetailPreviewPath = CASE_DETAIL_PREVIEW_PATH,
) {
  if (!pageModule) return defaultPath
  if (pageModule.page_key === 'products' && ['detail-labels', 'inquiry-form'].includes(pageModule.module_key)) {
    return '/products/v9-gen6'
  }
  if (pageModule.page_key === 'cases' && pageModule.module_key === 'detail-labels') {
    const itemId = selection?.itemId ?? ''
    if (itemId.startsWith('list-') || itemId === 'fact-type') return '/cases'
    return caseDetailPreviewPath
  }
  if (pageModule.page_key === 'cases' && pageModule.module_key === 'inquiry-form') {
    return caseDetailPreviewPath
  }
  if (pageModule.page_key === 'contact' && pageModule.module_key === 'source-context') {
    return '/contact?source=products:list'
  }
  if (pageModule.page_key === 'global' && ['detail-labels', 'cta-labels'].includes(pageModule.module_key)) {
    return '/global?camp=astrobase-mamison'
  }
  if (pageModule.page_key === 'scenarios') {
    return '/scenarios/tourism'
  }
  if (pageModule.page_key === 'innovation') {
    return '/innovation/viie'
  }
  if (pageModule.page_key === 'media-kit') {
    return '/media-kit'
  }
  if (pageModule.page_key === 'display') {
    return '/display'
  }
  if (pageModule.page_key === 'news') {
    return '/news'
  }
  if (pageModule.page_key === 'faq') {
    return '/faq'
  }
  if (pageModule.page_key === 'auth') {
    return pageModule.module_key === 'register' ? '/register' : '/login'
  }
  if (pageModule.page_key === 'account') {
    return '/account'
  }
  if (pageModule.page_key === 'site') {
    return defaultPath
  }
  return defaultPath
}

function visualCanvasLabel(path: string, fallbackLabel: string) {
  const cleanPath = path.split('?')[0] || path
  if (cleanPath === '/') return '首页'
  if (cleanPath === '/products') return '产品目录'
  if (cleanPath.startsWith('/products/')) return '产品详情'
  if (cleanPath === '/cases') return '案例列表'
  if (cleanPath.startsWith('/cases/')) return '案例详情'
  if (cleanPath === '/contact') return '联系页'
  if (cleanPath === '/global') return 'Global'
  if (cleanPath === '/login') return '登录页'
  if (cleanPath === '/register') return '注册页'
  if (cleanPath === '/account') return '账户页'
  if (cleanPath === '/scenarios/tourism') return '应用场景'
  if (cleanPath === '/innovation/viie') return '创新页'
  if (cleanPath === '/media-kit') return '媒体资料'
  if (cleanPath === '/display') return '展示页'
  if (cleanPath === '/news') return '新闻页'
  if (cleanPath === '/faq') return 'FAQ'
  return fallbackLabel
}

function formatSnapshotTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'UTC',
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
  if (status === 'review') return '待检查'
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
        detail: `条目编号：${item.id}`,
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
        detail: `条目编号：${item.id}`,
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
      label: '内容标题为空',
      detail: '建议补上标题，便于以后查找。',
      severity: 'warning',
    })
  }

  if (pageModule.items.length === 0) {
    issues.push({
      label: '没有内容条目',
      detail: '发布后该区域可能为空。',
      severity: 'danger',
    })
  } else if (visibleItems.length === 0) {
    issues.push({
      label: '所有条目都已隐藏',
      detail: '发布后该区域可能没有可见内容。',
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
        detail: `条目编号：${item.id}`,
        severity: 'danger',
      })
    }

    if (isLinkItem(pageModule, item)) {
      if (!item.href?.trim()) {
        issues.push({
          label: `链接为空：${readableItemTitle(item)}`,
          detail: `条目编号：${item.id}`,
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

    if (pageModule.module_type === 'navigation' && pageModule.module_key === 'navbar' && !item.value_zh?.trim() && !item.value_en?.trim()) {
      issues.push({
        label: `导航分组为空：${readableItemTitle(item)}`,
        detail: 'Navbar 条目需要填写 primary、model 或 action，否则前台导航不会显示这个条目。',
        severity: 'warning',
      })
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
  if (hasDraft && issueCount > 0) return '上线前先确认内容'
  if (hasDraft) return '确认后可上线'
  if (issueCount > 0) return '先处理内容问题'
  if (missingPreview) return '当前页未显示该内容'
  if (hidden) return '确认隐藏内容是否符合页面安排'
  return '可做日常内容检查'
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
      const missingPreview = frameLoaded && Object.prototype.hasOwnProperty.call(locatedModules, id) && locatedModules[id] !== true
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
  if (tone === 'warning') return '检查'
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
      const missingPreview = frameLoaded &&
        pageModule.page_key === currentPageKey &&
        Object.prototype.hasOwnProperty.call(locatedModules, id) &&
        locatedModules[id] !== true
      const highImpactChanges = buildModuleChanges(pageModule, pageModule.live_state).filter(
        (change) => change.severity === 'high',
      ).length

      let tone: VisualReleaseLedgerTone = 'safe'
      let stage = '日常维护'
      let signal = '无待上线内容'
      let detail = '正常'
      const counters = `${issues.length} 项确认 · ${highImpactChanges} 处重点调整 · ${hasDraft ? '待上线' : '无待上线'}`
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
        detail = '保存后再发布'
      } else if (hasDraft && dangerIssues > 0) {
        tone = 'danger'
        stage = '上线前处理'
        signal = `${dangerIssues} 项必须处理`
        detail = issues.find((issue) => issue.severity === 'danger')?.detail ?? '上线前先处理文字或素材。'
      } else if (hasDraft && highImpactChanges > 0) {
        tone = 'warning'
        stage = '待确认'
        signal = `${highImpactChanges} 处重点调整`
        detail = '确认前台效果后上线'
      } else if (hasDraft) {
        tone = 'review'
        stage = '待上线'
        signal = '确认后上线'
        detail = '可上线或放弃'
      } else if (dangerIssues > 0) {
        tone = 'danger'
        stage = '上线前处理'
        signal = `${dangerIssues} 项必须处理`
        detail = issues.find((issue) => issue.severity === 'danger')?.detail ?? '当前内容上线前需要处理。'
      } else if (warningIssues > 0) {
        tone = 'warning'
        stage = '内容确认'
        signal = `${warningIssues} 项需确认`
        detail = issues.find((issue) => issue.severity === 'warning')?.detail ?? '当前内容上线前需要确认。'
      } else if (missingPreview) {
        tone = 'warning'
        stage = '当前页未显示'
        signal = '当前页未显示'
        detail = '切换页面或模块查看'
      } else if (hidden) {
        tone = 'review'
        stage = '已隐藏'
        signal = '内容已隐藏'
        detail = '前台隐藏'
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
      page: VISUAL_EDITOR_COVERAGE_LABEL,
      module: '全部模块',
      stage: '日常维护',
      signal: '当前无待处理',
      detail: '正常',
      counters: '0 项确认',
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
          <p className="text-sm font-bold text-[#1E2C31]">待处理内容</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#FDE9DF] px-2 py-1 text-xs font-semibold text-[#B54318]">
            优先 {priorityCount}
          </span>
          <span className="rounded-full bg-[#EAF6F8] px-2 py-1 text-xs font-semibold text-[#1889B6]">
            检查 {reviewCount}
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
              <th className="py-2 pr-3 text-left font-semibold">状态</th>
              <th className="py-2 pr-3 text-left font-semibold">位置</th>
              <th className="py-2 pr-3 text-left font-semibold">待处理</th>
              <th className="py-2 pr-3 text-left font-semibold">备注</th>
              <th className="py-2 pr-3 text-left font-semibold">数量</th>
              <th className="py-2 text-left font-semibold">操作</th>
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
                <td className="max-w-[260px] py-3 pr-3 align-top text-xs leading-5 text-[#61767D]">{row.detail}</td>
                <td className="py-3 pr-3 align-top text-xs text-[#61767D]">{row.counters}</td>
                <td className="py-3 align-top">
                  {row.pageModule ? (
                    <button
                      type="button"
                      onClick={() => onSelectModule(row.pageModule as PageModuleRow)}
                      className="inline-flex min-h-8 items-center rounded-md border border-[#1889B6] bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#0F6F95]"
                    >
                      打开画布
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
                打开画布
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {!hasActionableRows ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700">
          暂无待处理。
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
      <p className="mt-1 truncate text-xs leading-4 text-[#61767D]">{detail}</p>
    </div>
  )
}

function VisualOperationsMatrix({
  currentPage,
  currentPreviewPath,
  currentPageStats,
  currentModules,
  allModules,
  pageStats,
  dirtyIds,
  locatedModules,
  frameLoaded,
  structureDrafts,
  onSelectModule,
}: {
  currentPage: PageMeta
  currentPreviewPath: string
  currentPageStats: PageOperationsStats
  currentModules: PageModuleRow[]
  allModules: PageModuleRow[]
  pageStats: PageOperationsStats[]
  dirtyIds: Set<string>
  locatedModules: Record<string, boolean>
  frameLoaded: boolean
  structureDrafts: PageStructureDraftRow[]
  onSelectModule: (pageModule: PageModuleRow) => void
}) {
  const currentMedia = countVisualMedia(currentModules)
  const currentLocated = countLocatedModules(currentModules, locatedModules, frameLoaded)
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
            <span>页面运营总览</span>
          </div>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          当前：{currentPage.label} · {currentPreviewPath}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <VisualMatrixCell
          label="待上线"
          value={`${currentPageStats.draftCount + currentPageStats.unsavedCount}`}
          detail={`${currentPageStats.draftCount} 草稿 / ${currentPageStats.unsavedCount} 未保存`}
          tone={currentPageStats.draftCount + currentPageStats.unsavedCount > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="画布可点选"
          value={frameLoaded ? `${currentLocated.located}/${currentModules.length}` : '检测中'}
          detail={frameLoaded ? `${currentLocated.missing} 未显示` : '读取中'}
          tone={frameLoaded && currentLocated.missing === 0 ? 'green' : 'orange'}
        />
        <VisualMatrixCell
          label="素材"
          value={`${currentMedia.images + currentMedia.videos}`}
          detail={`${currentMedia.images} 图 / ${currentMedia.videos} 视频 / ${currentMedia.missingMedia} 空位`}
          tone={currentMedia.missingMedia > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="链接"
          value={currentMedia.links}
          detail={`${currentMedia.badLinks} 处需处理`}
          tone={currentMedia.badLinks > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="需处理"
          value={highestIssuePage.issueCount}
          detail={`${highestIssuePage.label} / 隐藏 ${pageStats.reduce((total, page) => total + page.hiddenCount, 0)}`}
          tone={highestIssuePage.issueCount > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="重点调整"
          value={highImpactDrafts}
          detail="显示 / 图片 / 链接 / 新增"
          tone={highImpactDrafts > 0 ? 'orange' : 'green'}
        />
        <VisualMatrixCell
          label="页面调整"
          value={structureDrafts.length}
          detail={`${activeStructureSummary.added} 新增 / ${activeStructureSummary.hidden} 隐藏 / ${activeStructureSummary.images} 张图片`}
          tone={structureDrafts.length > 0 ? 'orange' : 'gray'}
        />
      </div>

      <VisualReleaseLedger rows={releaseLedgerRows} onSelectModule={onSelectModule} />

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#1E2C31]">重点事项</p>
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
                      {item.reason}；需确认 {item.issueCount} 项，重点调整 {item.highImpactChanges} 处。
                    </span>
                  </span>
                  <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-[#1889B6]" />
                </button>
              ))
            ) : (
              <p className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-3 text-xs leading-5 text-[#61767D]">
                暂无待处理。
              </p>
            )}
          </div>
        </div>

        <div className="rounded-md border border-[#D8E7E8] bg-white p-3">
          <p className="text-sm font-bold text-[#1E2C31]">页面分布</p>
          <div className="mt-3 space-y-2">
            {pageStats.map((page) => (
              <div key={page.key} className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#1E2C31]">{page.label}</p>
                  <p className="text-xs font-semibold text-[#1889B6]">{page.moduleCount} 个模块</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#61767D]">
                  待上线 {page.draftCount} / 未保存 {page.unsavedCount} / 需确认 {page.issueCount} / 隐藏 {page.hiddenCount}
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
  caseDetailPreviewPath = CASE_DETAIL_PREVIEW_PATH,
  initialRequestedModuleId = null,
}: {
  initialModules: PageModuleRow[]
  initialStructureDrafts?: PageStructureDraftRow[]
  initialStructureSnapshots?: Record<PageKey, PageStructureSnapshotRow[]>
  currentAdminRole?: 'admin' | 'operator'
  maxUploadMb?: number
  caseDetailPreviewPath?: string
  initialRequestedModuleId?: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedModuleId = searchParams.get('module') ?? initialRequestedModuleId
  const requestedCanvasParam = searchParams.get('canvas')
  const requestedCanvasPageKey = requestedCanvasParam && isPageKey(requestedCanvasParam)
    ? requestedCanvasParam
    : null
  const initialSelectionRef = useRef<ReturnType<typeof getInitialModuleSelection> | null>(null)
  if (!initialSelectionRef.current) {
    initialSelectionRef.current = getInitialModuleSelection(initialModules, requestedModuleId, requestedCanvasPageKey)
  }
  const initialSelection = initialSelectionRef.current
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const canvasShellRef = useRef<HTMLDivElement>(null)
  const externalInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null)
  const saveExternalEditTargetRef = useRef<(() => Promise<void>) | null>(null)
  const quickInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const saveActiveModuleRef = useRef<(() => Promise<void>) | null>(null)
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})
  const initialWorkbenchScrollRef = useRef(false)
  const pendingCanvasSelectionRef = useRef<{ moduleId: string; selection: FieldSelection } | null>(null)
  const lastAppliedRequestedModuleIdRef = useRef<string | null>(null)
  const lastCanvasHintAtRef = useRef(0)
  const lastFrameSelectionRef = useRef<{ signature: string; at: number } | null>(null)
  const setExternalInputElementRef = useCallback((node: HTMLInputElement | null) => {
    externalInputRef.current = node
  }, [])
  const setExternalTextareaElementRef = useCallback((node: HTMLTextAreaElement | null) => {
    externalInputRef.current = node
  }, [])
  const setExternalSelectElementRef = useCallback((node: HTMLSelectElement | null) => {
    externalInputRef.current = node
  }, [])
  const setQuickInputElementRef = useCallback((node: HTMLInputElement | null) => {
    quickInputRef.current = node
  }, [])
  const setQuickTextareaElementRef = useCallback((node: HTMLTextAreaElement | null) => {
    quickInputRef.current = node
  }, [])
  const [modules, setModules] = useState(() => filterEditableModules(initialModules).map(cloneModule))
  const [savedModules, setSavedModules] = useState(() => filterEditableModules(initialModules).map(cloneModule))
  const [selectedPage, setSelectedPage] = useState<PageKey>(initialSelection.pageKey)
  const [selectedModuleId, setSelectedModuleId] = useState(initialSelection.moduleId)
  const [selectedField, setSelectedField] = useState<FieldSelection>({ itemId: null, field: null })
  const [canvasSelectionOpen, setCanvasSelectionOpen] = useState(false)
  const [externalEditTarget, setExternalEditTarget] = useState<ExternalCanvasEditTarget | null>(null)
  const [externalDraftValue, setExternalDraftValue] = useState('')
  const [externalSaving, setExternalSaving] = useState(false)
  const [locatedModules, setLocatedModules] = useState<Record<string, boolean>>({})
  const [hoverRect, setHoverRect] = useState<HighlightRect | null>(null)
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const [canvasHotspots, setCanvasHotspots] = useState<CanvasHotspot[]>([])
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [frameContentHeight, setFrameContentHeight] = useState(MIN_CANVAS_FRAME_HEIGHT)
  const [canvasViewportSize, setCanvasViewportSize] = useState({ width: 0, height: 0 })
  const [, setFrameVersion] = useState(0)
  const [previewVersion, setPreviewVersion] = useState(0)
  const [previewDevice, setPreviewDevice] = useState<PreviewDeviceKey>('desktop')
  const [canvasZoomMode, setCanvasZoomMode] = useState<CanvasZoomMode>('actual')
  const [showEditableMarks, setShowEditableMarks] = useState(true)
  const [immersiveEditor, setImmersiveEditor] = useState(true)
  const [saving, setSaving] = useState(false)
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
    initialStructureSnapshots ?? emptyStructureSnapshots(),
  )
  const [structureBusy, setStructureBusy] = useState<string | null>(null)
  const [structurePublishConfirmOpen, setStructurePublishConfirmOpen] = useState(false)
  const [structureDiscardConfirmOpen, setStructureDiscardConfirmOpen] = useState(false)
  const [structureRestoreSnapshot, setStructureRestoreSnapshot] = useState<PageStructureSnapshotRow | null>(null)
  const [advancedStructureOpen, setAdvancedStructureOpen] = useState(false)
  const [moduleRailOpen, setModuleRailOpen] = useState(false)
  const [moduleRailQuery, setModuleRailQuery] = useState('')
  const [fieldFormOpen, setFieldFormOpen] = useState(false)

  const currentPage = PAGES.find((page) => page.key === selectedPage) ?? PAGES[0]
  const currentStructureDraft = structureDrafts.find((draft) => draft.page_key === selectedPage) ?? null
  const currentStructureSnapshots = structureSnapshots[selectedPage] ?? []
  const currentStructureRestoreSummary = structureRestoreSnapshot
    ? structureSnapshotSummary(structureRestoreSnapshot)
    : null
  const canPublishStructureDraft = currentAdminRole === 'admin'
  const currentModules = useMemo(
    () => modules.filter((pageModule) => moduleBelongsToCanvas(pageModule, selectedPage)),
    [modules, selectedPage],
  )
  const currentCanvasModules = useMemo(
    () => currentModules.filter(moduleHasFrontCanvas),
    [currentModules],
  )
  const currentVisibleModules = useMemo(
    () => currentCanvasModules.filter((pageModule) => pageModule.is_visible !== false),
    [currentCanvasModules],
  )
  const primaryCurrentModules = useMemo(
    () => (currentVisibleModules.length > 0 ? currentVisibleModules : currentCanvasModules),
    [currentCanvasModules, currentVisibleModules],
  )
  const active = currentModules.find((pageModule) => moduleId(pageModule) === selectedModuleId)
    ?? primaryCurrentModules[0]
    ?? currentCanvasModules[0]
    ?? currentModules[0]
  const activeModuleId = active ? moduleId(active) : ''
  const activeHasFrontCanvas = Boolean(active && moduleHasFrontCanvas(active))
  const currentRailModules = useMemo(() => {
    if (!active || activeHasFrontCanvas) return currentCanvasModules
    return [
      active,
      ...currentCanvasModules.filter((pageModule) => moduleId(pageModule) !== activeModuleId),
    ]
  }, [active, activeHasFrontCanvas, activeModuleId, currentCanvasModules])
  const filteredCurrentModules = useMemo(() => {
    const query = moduleRailQuery.trim().toLowerCase()
    if (!query) return currentRailModules
    return currentRailModules.filter((pageModule) => moduleSearchText(pageModule).includes(query))
  }, [currentRailModules, moduleRailQuery])
  const currentModuleOptions = useMemo(() => {
    if (!active || (active.is_visible !== false && activeHasFrontCanvas)) return primaryCurrentModules
    return [
      active,
      ...primaryCurrentModules.filter((pageModule) => moduleId(pageModule) !== activeModuleId),
    ]
  }, [active, activeHasFrontCanvas, activeModuleId, primaryCurrentModules])
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
  const activePreviewPath = useMemo(
    () => previewPathForModule(currentPage.path, active, selectedField, caseDetailPreviewPath),
    [active, caseDetailPreviewPath, currentPage.path, selectedField],
  )
  const previewSrc = useMemo(() => buildPreviewSrc(activePreviewPath, previewVersion), [activePreviewPath, previewVersion])

  useEffect(() => {
    const preferredDevice = MODULE_PREFERRED_PREVIEW_DEVICE[activeModuleId]
    if (!preferredDevice || previewDevice === preferredDevice) return
    setPreviewDevice(preferredDevice)
  }, [activeModuleId, previewDevice])

  const canvasRouteOptions = useMemo(() => {
    const grouped = new Map<string, { path: string; label: string; modules: PageModuleRow[] }>()
    for (const pageModule of currentCanvasModules) {
      const path = previewPathForModule(currentPage.path, pageModule, null, caseDetailPreviewPath)
      const existing = grouped.get(path)
      if (existing) {
        existing.modules.push(pageModule)
      } else {
        grouped.set(path, {
          path,
          label: visualCanvasLabel(path, currentPage.label),
          modules: [pageModule],
        })
      }
    }

    return Array.from(grouped.values()).map((option) => ({
      ...option,
      selected: option.path === activePreviewPath,
      preferredModule: option.modules.find((pageModule) => pageModule.page_key === selectedPage) ?? option.modules[0],
    }))
  }, [activePreviewPath, caseDetailPreviewPath, currentCanvasModules, currentPage.label, currentPage.path, selectedPage])
  const currentPreviewModules = useMemo(
    () => currentCanvasModules.filter((pageModule) => (
      previewPathForModule(
        currentPage.path,
        pageModule,
        moduleId(pageModule) === activeModuleId ? selectedField : null,
        caseDetailPreviewPath,
      ) === activePreviewPath
    )),
    [activeModuleId, activePreviewPath, caseDetailPreviewPath, currentCanvasModules, currentPage.path, selectedField],
  )
  const activeHiddenInCurrentPreview = Boolean(active && (active.is_visible === false || !activeHasFrontCanvas))
  const activeHasFieldSelection = Boolean(selectedField.itemId || selectedField.field || externalEditTarget)
  const activeMissingInCurrentPreview = Boolean(
    active
    && (
      activeHiddenInCurrentPreview
      || (
        !activeHasFieldSelection
        &&
        frameLoaded
        && currentPreviewModules.some((pageModule) => moduleId(pageModule) === activeModuleId)
        && locatedModules[activeModuleId] === false
      )
    ),
  )
  const activeMissingTitle = !activeHasFrontCanvas ? '不在前台画布显示' : !active?.is_visible ? '已隐藏' : '当前页未显示'
  const activeMissingBody = !activeHasFrontCanvas
    ? '请从内容管理入口维护这类后台文案。'
    : !active?.is_visible
    ? '恢复显示后保存草稿，再发布到前台。'
    : '切换到对应页面，或打开内容面板。'
  const currentPreviewDevice = PREVIEW_DEVICES.find((device) => device.key === previewDevice) ?? PREVIEW_DEVICES[0]
  const canvasAvailableWidth = Math.max(320, canvasViewportSize.width > 0 ? canvasViewportSize.width - 6 : currentPreviewDevice.width)
  const canvasFrameWidth = currentPreviewDevice.key === 'desktop'
    ? Math.max(currentPreviewDevice.width, Math.floor(canvasAvailableWidth))
    : currentPreviewDevice.width
  const canvasFitScale = canvasViewportSize.width > 0
    ? Math.min(1, Math.max(currentPreviewDevice.key === 'desktop' ? 0.72 : 0.9, canvasAvailableWidth / canvasFrameWidth))
    : 1
  const canvasScale = canvasZoomMode === 'fit' ? canvasFitScale : 1
  const canvasViewportFrameHeight = Math.max(
    MIN_CANVAS_FRAME_HEIGHT,
    Math.floor((canvasViewportSize.height > 0 ? canvasViewportSize.height - 8 : 1040) / canvasScale),
  )
  const canvasFrameHeight = Math.max(canvasViewportFrameHeight, frameContentHeight)
  const canvasDisplayWidth = Math.round(canvasFrameWidth * canvasScale)
  const canvasDisplayHeight = Math.round(canvasFrameHeight * canvasScale)
  const dirtyIds = useMemo(() => {
    const savedById = new Map(savedModules.map((pageModule) => [moduleId(pageModule), pageModule]))
    return new Set(
      modules
        .filter((pageModule) => !modulesEqual(pageModule, savedById.get(moduleId(pageModule))))
        .map(moduleId),
    )
  }, [modules, savedModules])

  const moduleRailRows = useMemo(() => (
    filteredCurrentModules.map((pageModule) => {
      const id = moduleId(pageModule)
      const selected = activeModuleId === id
      const dirty = dirtyIds.has(id)
      const hidden = !pageModule.is_visible
      const draftAdded = currentStructureModulesByKey.get(pageModule.module_key)?.status === 'added'
      const issueCount = buildPreflightIssues(pageModule).length
      const visibleItemCount = pageModule.items.filter((item) => item.is_visible !== false).length
      const modulePreviewPath = previewPathForModule(currentPage.path, pageModule, null, caseDetailPreviewPath)
      const usesOtherCanvas = modulePreviewPath !== activePreviewPath
      const missingInCurrentPreview = frameLoaded && !usesOtherCanvas && locatedModules[id] === false
      const canvasState: ModuleRailState = hidden || missingInCurrentPreview
        ? 'not-rendered'
        : usesOtherCanvas
          ? 'other-canvas'
          : frameLoaded
            ? 'on-canvas'
            : 'loading'
      const subtitle = canvasState === 'on-canvas'
        ? `${visibleItemCount} 项 · 可点选`
        : canvasState === 'other-canvas'
          ? `${visibleItemCount} 项 · 切换页面`
          : canvasState === 'not-rendered'
            ? `${visibleItemCount} 项 · 可编辑`
            : `${visibleItemCount} 项 · 正在检测`
      const badges = [
        selected ? { label: '正在编辑', className: 'bg-[#E36F2C]/10 text-[#E36F2C]' } : null,
        canvasState === 'other-canvas' ? { label: '切换画布', className: 'bg-[#EAF5F7] text-[#1889B6]' } : null,
        canvasState === 'not-rendered' ? { label: hidden ? '已隐藏' : '未显示', className: 'bg-[#FFF2E7] text-[#B54318]' } : null,
        canvasState === 'loading' ? { label: '检测中', className: 'bg-[#F0F7F8] text-[#1889B6]' } : null,
        pageModule.has_draft ? { label: '草稿', className: 'bg-[#E36F2C]/10 text-[#E36F2C]' } : null,
        draftAdded ? { label: '新增', className: 'bg-[#E36F2C]/10 text-[#E36F2C]' } : null,
        dirty ? { label: '未保存', className: 'bg-[#E36F2C]/10 text-[#E36F2C]' } : null,
        issueCount > 0 ? { label: `${issueCount} 提醒`, className: 'bg-[#FFF2E7] text-[#B54318]' } : null,
      ].filter((badge): badge is { label: string; className: string } => Boolean(badge))

      return {
        pageModule,
        id,
        selected,
        visibleItemCount,
        canvasState,
        subtitle,
        badges,
      }
    })
  ), [
    activeModuleId,
    activePreviewPath,
    caseDetailPreviewPath,
    currentPage.path,
    currentStructureModulesByKey,
    dirtyIds,
    filteredCurrentModules,
    frameLoaded,
    locatedModules,
  ])
  const moduleRailGroups = useMemo(() => [
    {
      key: 'on-canvas' as const,
      title: '当前页面',
      hint: '点前台内容即可编辑',
      rows: moduleRailRows.filter((row) => row.canvasState === 'on-canvas' || row.canvasState === 'loading'),
    },
    {
      key: 'other-canvas' as const,
      title: '其他页面',
      hint: '进入对应页面编辑',
      rows: moduleRailRows.filter((row) => row.canvasState === 'other-canvas'),
    },
    {
      key: 'not-rendered' as const,
      title: '隐藏/未显示',
      hint: '可先编辑或恢复',
      rows: moduleRailRows.filter((row) => row.canvasState === 'not-rendered'),
    },
  ].filter((group) => group.rows.length > 0), [moduleRailRows])
  const moduleRailCanvasCount = moduleRailRows.filter((row) => row.canvasState === 'on-canvas' || row.canvasState === 'loading').length
  const moduleRailHiddenCount = moduleRailRows.filter((row) => row.canvasState === 'not-rendered').length

  const activeHasUnsavedChanges = active ? dirtyIds.has(activeModuleId) : false
  const hasAnyUnsavedChanges = dirtyIds.size > 0
  const externalHasUnsavedChanges = Boolean(
    externalEditTarget?.patchKey && externalDraftValue !== (externalEditTarget.text ?? ''),
  )
  const pageStats = useMemo<PageOperationsStats[]>(
    () =>
      PAGES.map((page) => {
        const pageModules = modules.filter((pageModule) => pageModule.page_key === page.key)
        const frontCanvasModules = pageModules.filter((pageModule) => (
          moduleHasFrontCanvas(pageModule) && pageModule.is_visible !== false
        ))
        const draftCount = pageModules.filter((pageModule) => pageModule.has_draft).length
        const hiddenCount = pageModules.filter((pageModule) => !pageModule.is_visible).length
        const unsavedCount = pageModules.filter((pageModule) => dirtyIds.has(moduleId(pageModule))).length
        const issueCount = pageModules.reduce((total, pageModule) => total + buildPreflightIssues(pageModule).length, 0)

        return {
          ...page,
          moduleCount: frontCanvasModules.length,
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
  const selectedFieldItem = useMemo(
    () => (active && selectedField.itemId ? active.items.find((item) => item.id === selectedField.itemId) ?? null : null),
    [active, selectedField.itemId],
  )
  const externalSelectedTitle = externalEditTitle(externalEditTarget)
  const externalSelectedFieldLabel = externalEditFieldLabel(externalEditTarget)
  const selectedFieldSummary = externalEditTarget
    ? `${externalSelectedTitle} / ${externalSelectedFieldLabel}`
    : selectedField.field
      ? `${selectedFieldItem ? readableItemTitle(selectedFieldItem) : (active ? readableModuleTitle(active) : '当前内容')} / ${fieldLabel(selectedField.field)}`
      : selectedFieldItem
        ? `${readableItemTitle(selectedFieldItem)} / 内容`
        : active
          ? `${readableModuleTitle(active)} / 内容`
          : '未选中内容'
  const canvasHeaderTitle = externalEditTarget ? externalSelectedTitle : readableModuleTitle(active)
  const quickSelectedField = useMemo<QuickSelectedField | null>(() => {
    if (!active || externalEditTarget || !selectedField.field) return null

    if (selectedField.itemId) {
      if (!selectedFieldItem || !isItemQuickField(selectedField.field)) return null
      const field = selectedField.field
      return {
        scope: 'item',
        field,
        itemId: selectedFieldItem.id,
        label: `${readableItemTitle(selectedFieldItem)} / ${fieldLabel(field)}`,
        value: String(selectedFieldItem[field] ?? ''),
        input: quickFieldInput(field, String(selectedFieldItem[field] ?? '')),
      }
    }

    if (!isModuleQuickField(selectedField.field)) return null
    const field = selectedField.field
    const value = quickActionValue(active, null, field)
    return {
      scope: 'module',
      field,
      label: `${readableModuleTitle(active)} / ${fieldLabel(field)}`,
      value,
      input: quickFieldInput(field, value),
    }
  }, [active, externalEditTarget, selectedField.field, selectedField.itemId, selectedFieldItem])
  const quickSelectedFieldLabel = quickSelectedField ? fieldLabel(quickSelectedField.field) : ''
  const quickSelectedSubject = quickSelectedField
    ? quickSelectedField.scope === 'item'
      ? selectedFieldItem
        ? readableItemTitle(selectedFieldItem)
        : active
          ? readableModuleTitle(active)
          : '当前内容'
      : active
        ? readableModuleTitle(active)
        : '当前内容'
    : ''
  const hasCanvasSelection = Boolean(selectedField.itemId || selectedField.field)
  const selectionQuickActions = useMemo(
    () => (
      !active || externalEditTarget || quickSelectedField || (!canvasSelectionOpen && !hasCanvasSelection)
        ? []
        : buildQuickFieldActions(active, selectedFieldItem)
    ),
    [active, canvasSelectionOpen, externalEditTarget, hasCanvasSelection, quickSelectedField, selectedFieldItem],
  )
  const defaultQuickActions = useMemo(
    () => (
      !active || externalEditTarget || quickSelectedField || hasCanvasSelection || canvasSelectionOpen
        ? []
        : buildQuickFieldActions(active, null).slice(0, 10)
    ),
    [active, canvasSelectionOpen, externalEditTarget, hasCanvasSelection, quickSelectedField],
  )
  const relatedQuickActions = useMemo(() => {
    if (!active || externalEditTarget || !quickSelectedField) return []

    const actions = buildQuickFieldActions(
      active,
      quickSelectedField.scope === 'item' ? selectedFieldItem : null,
    )
    return actions
      .filter((action) => !(action.itemId === (quickSelectedField.itemId ?? null) && action.field === quickSelectedField.field))
      .slice(0, 8)
  }, [active, externalEditTarget, quickSelectedField, selectedFieldItem])
  const inlineQuickField = quickSelectedField
  const inlineExternalTarget = externalEditTarget
  const inlineSelectionActionsVisible = Boolean(
    !externalEditTarget
    && !quickSelectedField
    && selectionQuickActions.length > 0
    && hasCanvasSelection
  )
  const inlineQuickEditorVisible = Boolean(inlineQuickField)
  const inlineExternalEditorVisible = Boolean(inlineExternalTarget)
  const inlineCanvasEditorVisible = inlineQuickEditorVisible || inlineExternalEditorVisible || inlineSelectionActionsVisible
  const canvasEditorRequiresPanel = Boolean(
    (externalEditTarget && !inlineExternalEditorVisible) ||
    (!inlineCanvasEditorVisible && (
      quickSelectedField ||
      selectionQuickActions.length > 0 ||
      hasCanvasSelection ||
      canvasSelectionOpen
    )),
  )
  const hasFocusedCanvasEditor = Boolean(
    inlineCanvasEditorVisible ||
    canvasEditorRequiresPanel,
  )
  const externalCanSave = Boolean(externalEditTarget?.apiUrl && externalEditTarget.patchKey)
  const editorPanelVisible = Boolean(
    canvasEditorRequiresPanel ||
    (!inlineCanvasEditorVisible && (
      fieldFormOpen ||
      activeHasUnsavedChanges ||
      activeIsDraftAdded
    ))
  )
  const workbenchGridClass = moduleRailOpen
    ? editorPanelVisible
      ? 'xl:grid-cols-[156px_minmax(0,1fr)_340px] 2xl:grid-cols-[168px_minmax(0,1fr)_360px]'
      : 'xl:grid-cols-[156px_minmax(0,1fr)] 2xl:grid-cols-[168px_minmax(0,1fr)]'
    : editorPanelVisible
      ? 'xl:grid-cols-[minmax(0,1fr)_360px]'
      : 'xl:grid-cols-[minmax(0,1fr)]'
  const canvasGridStartClass = moduleRailOpen ? 'xl:col-start-2' : 'xl:col-start-1'
  const editorPanelGridClass = moduleRailOpen ? 'xl:col-start-3' : 'xl:col-start-2'
  const editorPanelClass = 'fixed bottom-4 right-3 top-[78px] z-40 w-[min(380px,calc(100vw-1.5rem))] min-w-0 overflow-auto rounded-md border border-[#D8E7E8] bg-white shadow-[0_22px_60px_rgba(36,31,27,0.22)] xl:sticky xl:bottom-auto xl:right-auto xl:top-20 xl:z-auto xl:h-[calc(100vh-88px)] xl:w-auto'
  const visualEditorShellClass = immersiveEditor
    ? `fixed inset-0 z-[45] flex flex-col gap-1.5 overflow-auto bg-[#EEF4F5] p-1.5 ${activeHasUnsavedChanges ? 'pb-24' : ''}`
    : `flex min-h-[calc(100vh-8rem)] flex-col gap-2 ${activeHasUnsavedChanges ? 'pb-24' : ''}`
  const visualWorkbenchClass = `grid flex-1 scroll-mt-24 grid-cols-1 gap-1.5 ${workbenchGridClass}`
  const inlineEditorWidth = Math.min(
    Math.max(280, canvasFrameWidth - 24),
    currentPreviewDevice.key === 'desktop' ? 360 : 320,
  )
  const inlineEditorEstimatedHeight = inlineQuickField?.input === 'image' || inlineExternalTarget?.input === 'image'
    ? 340
    : inlineQuickField?.input === 'textarea' || inlineExternalTarget?.input === 'textarea' || inlineSelectionActionsVisible
      ? 260
      : 218
  const inlineEditorLeft = highlightRect
    ? Math.min(
        Math.max(12, highlightRect.left),
        Math.max(12, canvasFrameWidth - inlineEditorWidth - 12),
      )
    : Math.max(12, canvasFrameWidth - inlineEditorWidth - 24)
  const inlineEditorBelowTop = highlightRect ? highlightRect.top + highlightRect.height + 12 : 16
  const inlineEditorAboveTop = highlightRect ? highlightRect.top - inlineEditorEstimatedHeight - 12 : 16
  const inlineEditorTop = highlightRect
    ? inlineEditorBelowTop + inlineEditorEstimatedHeight < canvasFrameHeight - 12
      ? inlineEditorBelowTop
      : Math.max(12, inlineEditorAboveTop)
    : 16

  useUnsavedChangesWarning(
    hasAnyUnsavedChanges || externalHasUnsavedChanges,
    '页面编辑有未保存的修改。离开此页会丢失这些修改，确定离开吗？',
  )

  useEffect(() => {
    setExternalDraftValue(externalEditTarget?.text ?? '')
  }, [externalEditTarget])

  useEffect(() => {
    if (!externalEditTarget || externalEditTarget.input === 'image') return
    const id = window.setTimeout(() => externalInputRef.current?.focus(), 80)
    return () => window.clearTimeout(id)
  }, [externalEditTarget])

  useEffect(() => {
    if (!quickSelectedField || quickSelectedField.input === 'image') return
    const id = window.setTimeout(() => quickInputRef.current?.focus(), 80)
    return () => window.clearTimeout(id)
  }, [quickSelectedField])

  useEffect(() => {
    setCanvasHotspots([])
    setHoverRect(null)
    setHighlightRect(null)
    setFrameContentHeight(MIN_CANVAS_FRAME_HEIGHT)
  }, [previewSrc, previewDevice])

  const readCanvasViewportSize = useCallback(() => {
    const node = canvasShellRef.current
    if (!node) return

    const nextSize = {
      width: node.clientWidth,
      height: node.clientHeight,
    }
    setCanvasViewportSize((prev) => (
      prev.width === nextSize.width && prev.height === nextSize.height ? prev : nextSize
    ))
  }, [])

  useEffect(() => {
    const node = canvasShellRef.current
    if (!node) return

    readCanvasViewportSize()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', readCanvasViewportSize)
      return () => window.removeEventListener('resize', readCanvasViewportSize)
    }

    const observer = new ResizeObserver(readCanvasViewportSize)
    observer.observe(node)
    window.addEventListener('resize', readCanvasViewportSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', readCanvasViewportSize)
    }
  }, [readCanvasViewportSize])

  useEffect(() => {
    const frame = window.requestAnimationFrame(readCanvasViewportSize)
    const timers = [80, 220, 520].map((delay) => window.setTimeout(readCanvasViewportSize, delay))
    return () => {
      window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [activeModuleId, editorPanelVisible, immersiveEditor, moduleRailOpen, readCanvasViewportSize])

  const scrollModuleWorkbenchIntoView = useCallback(() => {
    if (immersiveEditor) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      return
    }

    const target = document.getElementById('visual-module-workbench') ?? document.getElementById('visual-editor')
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [immersiveEditor])

  const syncSelectedModuleUrl = useCallback((id: string, canvasPageKey?: PageKey | null) => {
    const nextUrl = moduleUrl(id, canvasPageKey)
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (currentUrl === nextUrl) return
    router.replace(nextUrl, { scroll: false })
  }, [router])

  const replaceCanvasModuleUrl = useCallback((id: string, canvasPageKey?: PageKey | null) => {
    const nextUrl = moduleUrl(id, canvasPageKey)
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (currentUrl !== nextUrl) window.history.replaceState(null, '', nextUrl)
  }, [])

  useEffect(() => {
    if (initialWorkbenchScrollRef.current || !requestedModuleId) return
    initialWorkbenchScrollRef.current = true
    window.setTimeout(scrollModuleWorkbenchIntoView, 120)
  }, [requestedModuleId, scrollModuleWorkbenchIntoView])

  useEffect(() => {
    if (!requestedModuleId) return
    const requestedModule = modules.find((pageModule) => moduleId(pageModule) === requestedModuleId)
    if (!requestedModule || !isPageKey(requestedModule.page_key)) return

    const requestedPageKey = canvasPageKeyForModule(requestedModule, requestedCanvasPageKey)
    const nextSelectionKey = `${requestedModuleId}:${requestedCanvasPageKey ?? ''}`
    const alreadyShowingRequestedModule = requestedModuleId === activeModuleId && requestedPageKey === selectedPage
    if (
      lastAppliedRequestedModuleIdRef.current === nextSelectionKey
      && alreadyShowingRequestedModule
    ) return
    lastAppliedRequestedModuleIdRef.current = nextSelectionKey

    if (!alreadyShowingRequestedModule) {
      setSelectedPage(requestedPageKey)
      setSelectedModuleId(requestedModuleId)
    }
    setExternalEditTarget(null)
    setModuleRailOpen(false)
    setImmersiveEditor(true)
    setAdvancedStructureOpen(false)
    const pendingCanvasSelection = pendingCanvasSelectionRef.current
    if (pendingCanvasSelection?.moduleId === requestedModuleId) {
      setSelectedField(pendingCanvasSelection.selection)
      setCanvasSelectionOpen(true)
      pendingCanvasSelectionRef.current = null
    } else {
      setSelectedField({ itemId: null, field: null })
      setCanvasSelectionOpen(true)
    }
    setFieldFormOpen(false)
    if (!alreadyShowingRequestedModule) {
      setLocatedModules({})
      setHighlightRect(null)
      setFrameLoaded(false)
    }
    window.setTimeout(scrollModuleWorkbenchIntoView, 0)
  }, [
    activeModuleId,
    modules,
    requestedCanvasPageKey,
    requestedModuleId,
    scrollModuleWorkbenchIntoView,
    selectedPage,
  ])

  const updateLocatedModules = useCallback(() => {
    const doc = getIframeDocument(iframeRef.current)
    if (!doc) return

    const next = currentPreviewModules.reduce<Record<string, boolean>>((acc, pageModule) => {
      acc[moduleId(pageModule)] = Boolean(findPrimaryModuleElement(doc, moduleId(pageModule)))
      return acc
    }, {})

    setLocatedModules((prev) => (sameRecord(prev, next) ? prev : next))
  }, [currentPreviewModules])

  const updateFrameContentHeight = useCallback(() => {
    const doc = getIframeDocument(iframeRef.current)
    if (!doc) return

    const nextHeight = readCanvasDocumentHeight(doc)
    setFrameContentHeight((prev) => (Math.abs(prev - nextHeight) < 24 ? prev : nextHeight))
  }, [])

  const updateCanvasHotspots = useCallback(() => {
    const doc = getIframeDocument(iframeRef.current)
    if (!doc) {
      setCanvasHotspots([])
      return
    }
    setCanvasHotspots(collectCanvasHotspots(doc, currentPreviewModules))
  }, [currentPreviewModules])

  const updateHighlight = useCallback(() => {
    const iframe = iframeRef.current
    const doc = getIframeDocument(iframe)
    if (!iframe || !doc) {
      setHighlightRect(null)
      return
    }

    if (externalEditTarget?.targetId) {
      const externalTarget = doc.querySelector<HTMLElement>(cmsEditSelector(externalEditTarget.targetId))
      if (externalTarget) {
        syncFrameSelectedHotspot(doc, externalTarget)
        setHighlightRect(canvasRectFromElement(externalTarget))
        return
      }
    }

    if (!active) {
      clearFrameSelectedHotspots(doc)
      setHighlightRect(null)
      return
    }

    const moduleTarget = findPrimaryModuleElement(doc, activeModuleId)
    if (!moduleTarget) {
      clearFrameSelectedHotspots(doc)
      setHighlightRect(null)
      return
    }

    const fieldSelector = moduleFieldSelector(selectedField)
    if (!fieldSelector && !canvasSelectionOpen) {
      clearFrameSelectedHotspots(doc)
      setHighlightRect(null)
      return
    }

    const ownFieldTarget = fieldSelector && moduleTarget.matches(fieldSelector) ? moduleTarget : null
    const target = fieldSelector
      ? ownFieldTarget ?? moduleTarget.querySelector<HTMLElement>(fieldSelector) ?? moduleTarget
      : moduleTarget

    syncFrameSelectedHotspot(doc, target)
    setHighlightRect(canvasRectFromElement(target))
  }, [active, activeModuleId, canvasSelectionOpen, externalEditTarget, selectedField])

  const refreshFrameState = useCallback(() => {
    updateFrameContentHeight()
    updateLocatedModules()
    updateCanvasHotspots()
    updateHighlight()
  }, [updateCanvasHotspots, updateFrameContentHeight, updateHighlight, updateLocatedModules])

  const clearCanvasEditorSelection = useCallback(() => {
    if (externalHasUnsavedChanges) {
      toast.message('请先保存或撤销当前内容')
      return
    }

    setExternalEditTarget(null)
    setSelectedField({ itemId: null, field: null })
    setCanvasSelectionOpen(false)
    pendingCanvasSelectionRef.current = null

    const doc = getIframeDocument(iframeRef.current)
    if (doc) clearFrameSelectedHotspots(doc)
    setHighlightRect(null)
  }, [externalHasUnsavedChanges])

  const showCanvasEditHint = useCallback((message = '请选择页面上的文字、图片或按钮。') => {
    const now = Date.now()
    if (now - lastCanvasHintAtRef.current < 1800) return
    lastCanvasHintAtRef.current = now
    toast.message(message)
  }, [])

  const stopCanvasEditorEvent = useCallback((event: SyntheticEvent<HTMLElement>) => {
    event.stopPropagation()
  }, [])

  const activateCanvasEditFocus = useCallback((id?: string | null) => {
    if (id) lastAppliedRequestedModuleIdRef.current = id
    setCanvasSelectionOpen(false)
    setModuleRailOpen(false)
    setAdvancedStructureOpen(false)
    setFieldFormOpen(false)
  }, [])

  const shouldSkipRepeatedFrameSelection = useCallback((target: Element | null) => {
    if (!target) return false

    const hotspot = target.closest(EDITABLE_HOTSPOT_SELECTOR) ?? target
    const htmlTarget = hotspot instanceof HTMLElement ? hotspot : null
    const signature = [
      htmlTarget?.dataset.cmsEditTargetId ?? '',
      htmlTarget?.dataset.cmsEditUrl ?? '',
      htmlTarget?.dataset.pageModule ?? '',
      htmlTarget?.dataset.pageModuleItem ?? '',
      htmlTarget?.dataset.pageModuleField ?? '',
      (htmlTarget?.textContent ?? '').trim().slice(0, 80),
    ].join('|')
    const now = Date.now()
    const previous = lastFrameSelectionRef.current
    if (previous && previous.signature === signature && now - previous.at < 300) return true
    lastFrameSelectionRef.current = { signature, at: now }
    return false
  }, [])

  const selectCanvasElement = useCallback((target: Element | null, controls?: CanvasEventControls) => {
    if (!target) return false
    if (shouldAllowCanvasVisualInteraction(target)) return false

    const targetItemEl = target.closest('[data-page-module-item]') as HTMLElement | null
    const targetFieldEl = target.closest('[data-page-module-field]') as HTMLElement | null
    const targetExternalEl = target.closest('[data-cms-edit-url]') as HTMLElement | null
    const targetModuleEl = target.closest('[data-page-module]') as HTMLElement | null
    const itemEl = targetItemEl ?? closestCanvasElementFromPoint(target, controls, '[data-page-module-item]')
    const fieldEl = targetFieldEl ?? closestCanvasElementFromPoint(target, controls, '[data-page-module-field]')
    const externalEl = targetExternalEl ?? closestCanvasElementFromPoint(target, controls, '[data-cms-edit-url]')
    const moduleEl = targetModuleEl ?? closestCanvasModuleFromPoint(target, controls)
    const moduleFieldTarget = fieldEl ?? itemEl
    const preferPageModule = Boolean(
      moduleEl
      && externalEl
      && moduleFieldTarget
      && moduleFieldTarget !== externalEl
      && externalEl.contains(moduleFieldTarget)
      && !moduleFieldTarget.dataset.cmsEditUrl
    )
    const externalTarget = externalEl
      && !preferPageModule
      ? externalEditTargetFromElement(externalEl, visibleTextForCanvasSelection(target, externalEl))
      : null

    if (externalTarget) {
      stopCanvasEvent(controls)
      setExternalEditTarget(externalTarget)
      setSelectedField({ itemId: null, field: null })
      activateCanvasEditFocus()
      pendingCanvasSelectionRef.current = null
      setHoverRect(null)
      window.requestAnimationFrame(refreshFrameState)
      return true
    }

    if (!moduleEl) {
      const inactiveInteractive = target.closest('a,button,[role="button"],input,select,textarea') as HTMLElement | null
      if (inactiveInteractive) {
        stopCanvasEvent(controls)
        showCanvasEditHint()
        return true
      }
      return false
    }

    const id = moduleEl.dataset.pageModule
    const pageModule = modules.find((item) => moduleId(item) === id)
    if (!id || !pageModule || !isPageKey(pageModule.page_key)) {
      stopCanvasEvent(controls)
      showCanvasEditHint('请从模块列表选择可编辑内容。')
      return true
    }

    stopCanvasEvent(controls)

    const itemId = itemEl?.dataset.pageModuleItem ?? null
    const field = fieldEl?.dataset.pageModuleField ?? itemEl?.dataset.pageModuleField ?? null
    const selection = resolveCanvasSelection(pageModule, {
      itemId,
      field,
      text: visibleTextForCanvasSelection(target, fieldEl),
    })

    const nextCanvasPageKey = canvasPageKeyForModule(pageModule, selectedPage)
    setSelectedPage(nextCanvasPageKey)
    setSelectedModuleId(id)
    setLocatedModules((prev) => (prev[id] === true ? prev : { ...prev, [id]: true }))
    setExternalEditTarget(null)
    setSelectedField(selection)
    activateCanvasEditFocus(id)
    setCanvasSelectionOpen(true)
    pendingCanvasSelectionRef.current = { moduleId: id, selection }
    setHoverRect(null)
    replaceCanvasModuleUrl(id, canvasQueryPageKey(pageModule, nextCanvasPageKey))
    window.requestAnimationFrame(refreshFrameState)
    return true
  }, [activateCanvasEditFocus, modules, refreshFrameState, replaceCanvasModuleUrl, selectedPage, showCanvasEditHint])

  const selectCanvasHotspot = useCallback((hotspot: CanvasHotspot) => {
    const pageModule = modules.find((item) => moduleId(item) === hotspot.moduleId)

    if (hotspot.externalTarget) {
      setExternalEditTarget(hotspot.externalTarget)
      setSelectedField({ itemId: null, field: null })
      activateCanvasEditFocus()
      pendingCanvasSelectionRef.current = null
      setHoverRect(null)
      window.requestAnimationFrame(refreshFrameState)
      return
    }

    if (!pageModule || !isPageKey(pageModule.page_key)) return

    const selection = resolveCanvasSelection(pageModule, {
      itemId: hotspot.itemId,
      field: hotspot.field,
      text: hotspot.text,
    })
    const nextCanvasPageKey = canvasPageKeyForModule(pageModule, selectedPage)
    setSelectedPage(nextCanvasPageKey)
    setSelectedModuleId(hotspot.moduleId)
    setLocatedModules((prev) => (
      prev[hotspot.moduleId] === true ? prev : { ...prev, [hotspot.moduleId]: true }
    ))
    setExternalEditTarget(null)
    setSelectedField(selection)
    activateCanvasEditFocus(hotspot.moduleId)
    setCanvasSelectionOpen(true)
    pendingCanvasSelectionRef.current = { moduleId: hotspot.moduleId, selection }
    setHoverRect(null)
    replaceCanvasModuleUrl(hotspot.moduleId, canvasQueryPageKey(pageModule, nextCanvasPageKey))
    window.requestAnimationFrame(refreshFrameState)
  }, [activateCanvasEditFocus, modules, refreshFrameState, replaceCanvasModuleUrl, selectedPage])

  const selectQuickFieldAction = useCallback((action: QuickFieldAction) => {
    setExternalEditTarget(null)
    setSelectedField({ itemId: action.itemId, field: action.field })
    activateCanvasEditFocus(activeModuleId)
    window.requestAnimationFrame(refreshFrameState)
  }, [activeModuleId, activateCanvasEditFocus, refreshFrameState])

  const paintExternalEditPreview = useCallback((value: string) => {
    const doc = getIframeDocument(iframeRef.current)
    const targetId = externalEditTarget?.targetId
    if (!doc || !targetId) return

    const target = doc.querySelector<HTMLElement>(cmsEditSelector(targetId))
    if (!target) return
    if (externalEditTarget.input === 'image') {
      const nextImage = value.trim()
      const image = hasTagName(target, 'img')
        ? target as HTMLImageElement
        : target.querySelector<HTMLImageElement>('img')

      if (image) {
        image.removeAttribute('srcset')
        if (nextImage) {
          image.src = nextImage
          image.setAttribute('src', nextImage)
        } else {
          image.removeAttribute('src')
        }
      } else {
        if (nextImage) {
          target.style.backgroundImage = `url("${nextImage.replace(/"/g, '%22')}")`
          target.style.backgroundPosition = 'center'
          target.style.backgroundSize = 'cover'
        } else {
          target.style.backgroundImage = ''
          target.style.backgroundPosition = ''
          target.style.backgroundSize = ''
        }
      }
      window.requestAnimationFrame(refreshFrameState)
      return
    }
    const displayValue = externalSelectLabel(externalEditTarget, value)
    target.textContent = externalEditTarget.displaySuffix ? `${displayValue}${externalEditTarget.displaySuffix}` : displayValue
    window.requestAnimationFrame(refreshFrameState)
  }, [externalEditTarget, refreshFrameState])

  const patchExternalDraftValue = useCallback((value: string) => {
    setExternalDraftValue(value)
    paintExternalEditPreview(value)
  }, [paintExternalEditPreview])

  useEffect(() => {
    if (!externalEditTarget) return
    paintExternalEditPreview(externalDraftValue)
  }, [externalDraftValue, externalEditTarget, paintExternalEditPreview])

  const resetExternalDraftValue = useCallback(() => {
    const value = externalEditTarget?.text ?? ''
    setExternalDraftValue(value)
    paintExternalEditPreview(value)
    window.requestAnimationFrame(() => paintExternalEditPreview(value))
    window.setTimeout(() => paintExternalEditPreview(value), 120)
  }, [externalEditTarget?.text, paintExternalEditPreview])

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

  const paintSelectedFieldPreview = useCallback((field: ModuleQuickField | ItemQuickField, value: string) => {
    const doc = getIframeDocument(iframeRef.current)
    if (!doc || !activeModuleId) return

    const moduleTarget = findPrimaryModuleElement(doc, activeModuleId)
    const fieldSelector = moduleFieldSelector(selectedField)
    if (!moduleTarget || !fieldSelector) return

    const ownFieldTarget = moduleTarget.matches(fieldSelector) ? moduleTarget : null
    const targets = [
      ownFieldTarget,
      ...Array.from(moduleTarget.querySelectorAll<HTMLElement>(fieldSelector)),
    ].filter((target, index, allTargets): target is HTMLElement => (
      Boolean(target) && allTargets.indexOf(target) === index
    ))
    const target = targets[0]
    if (!target) return

    if (field === 'image_url' || field === 'video_poster_url') {
      const nextImage = value.trim()
      for (const imageTarget of targets) {
        const img = hasTagName(imageTarget, 'img') ? imageTarget as HTMLImageElement : imageTarget.querySelector<HTMLImageElement>('img')
        if (img) {
          img.removeAttribute('srcset')
          if (nextImage) {
            img.src = nextImage
            img.setAttribute('src', nextImage)
          } else {
            img.removeAttribute('src')
          }
          img.alt = img.alt || ''
        } else if (nextImage) {
          imageTarget.style.backgroundImage = `url("${nextImage.replace(/"/g, '%22')}")`
          imageTarget.style.backgroundPosition = 'center'
          imageTarget.style.backgroundSize = 'cover'
        } else {
          imageTarget.style.backgroundImage = ''
          imageTarget.style.backgroundPosition = ''
          imageTarget.style.backgroundSize = ''
        }
      }
    } else if (field === 'video_url') {
      const video = hasTagName(target, 'video') ? target as HTMLVideoElement : target.querySelector<HTMLVideoElement>('video')
      if (video && value.trim()) video.src = value
    } else if (field === 'href') {
      const nextHref = value.trim()
      for (const hrefTarget of targets) {
        const link = hasTagName(hrefTarget, 'a')
          ? hrefTarget as HTMLAnchorElement
          : (hrefTarget.closest('a') as HTMLAnchorElement | null) ?? hrefTarget.querySelector<HTMLAnchorElement>('a')
        if (!link) continue
        if (nextHref) {
          link.setAttribute('href', nextHref)
        } else {
          link.removeAttribute('href')
        }
      }
    } else {
      for (const textTarget of targets) {
        textTarget.textContent = value
      }
    }

    window.requestAnimationFrame(refreshFrameState)
  }, [activeModuleId, refreshFrameState, selectedField])

  const patchQuickSelectedField = useCallback((value: string) => {
    if (!quickSelectedField) return

    if (quickSelectedField.scope === 'module' && isModuleQuickField(quickSelectedField.field)) {
      patchActive({ [quickSelectedField.field]: value } as Partial<PageModuleRow>)
      paintSelectedFieldPreview(quickSelectedField.field, value)
      return
    }

    if (quickSelectedField.scope === 'item' && quickSelectedField.itemId && isItemQuickField(quickSelectedField.field)) {
      patchItem(quickSelectedField.itemId, { [quickSelectedField.field]: value } as Partial<PageModuleItem>)
      paintSelectedFieldPreview(quickSelectedField.field, value)
    }
  }, [paintSelectedFieldPreview, patchActive, patchItem, quickSelectedField])

  const loadSnapshots = useCallback(async () => {
    if (!activePageKey || !activeModuleKey) {
      setSnapshots([])
      return
    }

    setSnapshotsLoading(true)
    try {
      const res = await fetch(`/api/admin/page-modules/${activePageKey}/${activeModuleKey}/snapshots?limit=12`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '读取页面版本失败')
      setSnapshots(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      setSnapshots([])
      toast.error(err instanceof Error ? err.message : '读取页面版本失败')
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
    if (active.module_type === 'navigation' || isHomeCardModule) {
      item.href = ''
      if (active.module_key === 'navbar') {
        item.value_zh = 'primary'
        item.value_en = 'primary'
      }
    }
    if (isHomeCardModule) {
      item.video_url = ''
      item.video_poster_url = ''
    }

    patchActive({ items: [...active.items, item] })
    setSelectedField({ itemId: item.id, field: 'label_zh' })
    setCanvasSelectionOpen(false)
    setModuleRailOpen(false)
    setAdvancedStructureOpen(false)
    toast.message('已添加，保存草稿后可发布')
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
    setCanvasSelectionOpen(true)
    setModuleRailOpen(false)
    setAdvancedStructureOpen(false)
  }, [active, patchActive])

  const confirmDeleteItem = useCallback(() => {
    if (!active || !deleteItemId || !canManageRepeatedItems) return
    patchItem(deleteItemId, { is_visible: false })
    setSelectedField({ itemId: null, field: null })
    setCanvasSelectionOpen(false)
    setDeleteItemId(null)
    toast.message('已隐藏项目，保存草稿和发布后才会影响前台')
  }, [active, canManageRepeatedItems, deleteItemId, patchItem])

  const scrollModuleIntoView = useCallback((id: string) => {
    const doc = getIframeDocument(iframeRef.current)
    const shell = canvasShellRef.current
    if (!doc) return

    const target = findPrimaryModuleElement(doc, id)
    if (!target) return

    scrollCanvasAncestorsIntoView(target)

    const scrollingElement = doc.scrollingElement ?? doc.documentElement
    const frameWindow = iframeRef.current?.contentWindow
    const viewportHeight = frameWindow?.innerHeight ?? doc.documentElement.clientHeight ?? 1040
    const viewportWidth = frameWindow?.innerWidth ?? doc.documentElement.clientWidth ?? 1440
    const rect = target.getBoundingClientRect()
    const visibleTargetHeight = Math.min(rect.height, viewportHeight * 0.72)
    const visibleTargetWidth = Math.min(rect.width, viewportWidth * 0.72)
    const frameScrollTop = Math.max(
      0,
      (scrollingElement?.scrollTop ?? 0) + rect.top - Math.max(24, (viewportHeight - visibleTargetHeight) / 2),
    )
    const frameScrollLeft = Math.max(
      0,
      (scrollingElement?.scrollLeft ?? 0) + rect.left - Math.max(24, (viewportWidth - visibleTargetWidth) / 2),
    )

    scrollingElement?.scrollTo({ top: frameScrollTop, left: frameScrollLeft, behavior: 'auto' })

    const alignOuterCanvas = () => {
      const currentTarget = findPrimaryModuleElement(doc, id)
      if (!currentTarget || !shell) return

      const rect = canvasRectFromElement(currentTarget)
      const shellHeight = shell.clientHeight || 760
      const shellWidth = shell.clientWidth || 1200
      const safeTop = Math.min(CANVAS_SHELL_SAFE_TOP, Math.max(24, shellHeight * 0.18))
      const visibleTargetHeight = Math.min(rect.height, shellHeight / Math.max(canvasScale, 0.1))
      const visibleTargetWidth = Math.min(rect.width, shellWidth / Math.max(canvasScale, 0.1))
      const targetCenter = (rect.top + visibleTargetHeight / 2) * canvasScale
      const targetCenterX = (rect.left + visibleTargetWidth / 2) * canvasScale
      const targetTop = rect.top * canvasScale
      const targetHeight = rect.height * canvasScale
      const centeredScrollTop = targetCenter - shellHeight * 0.42
      const topAlignedScrollTop = targetTop - safeTop
      const nextScrollTop = Math.max(
        0,
        targetHeight > shellHeight * 0.62
          ? topAlignedScrollTop
          : Math.min(centeredScrollTop, topAlignedScrollTop),
      )
      const nextScrollLeft = Math.max(0, targetCenterX - shellWidth * 0.5)

      shell.scrollTo({ top: nextScrollTop, left: nextScrollLeft, behavior: 'auto' })
    }

    window.requestAnimationFrame(alignOuterCanvas)
    window.setTimeout(alignOuterCanvas, 80)
    window.setTimeout(alignOuterCanvas, 180)
    window.setTimeout(refreshFrameState, 80)
    window.setTimeout(refreshFrameState, 220)
  }, [canvasScale, refreshFrameState])

  const focusCanvasRouteTop = useCallback(() => {
    const focusTop = () => {
      const doc = getIframeDocument(iframeRef.current)
      const scrollingElement = doc?.scrollingElement ?? doc?.documentElement ?? null
      scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      iframeRef.current?.contentWindow?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      canvasShellRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      refreshFrameState()
    }

    window.requestAnimationFrame(focusTop)
    window.setTimeout(focusTop, 260)
    window.setTimeout(focusTop, 700)
    window.setTimeout(focusTop, 1400)
    window.setTimeout(focusTop, 2400)
  }, [refreshFrameState])

  const focusCanvasModule = useCallback((id: string) => {
    const focusModule = () => {
      scrollModuleWorkbenchIntoView()
      scrollModuleIntoView(id)
      refreshFrameState()
    }

    window.requestAnimationFrame(focusModule)
    window.setTimeout(focusModule, 120)
    window.setTimeout(focusModule, 420)
    window.setTimeout(focusModule, 900)
    window.setTimeout(focusModule, 1600)
    window.setTimeout(focusModule, 2600)
  }, [refreshFrameState, scrollModuleIntoView, scrollModuleWorkbenchIntoView])

  const handleSelectModule = useCallback((pageModule: PageModuleRow, options: { openRail?: boolean; announce?: boolean; openEditor?: boolean } = {}) => {
    if (!isPageKey(pageModule.page_key)) {
      toast.error('这个模块暂时不能在当前页面编辑')
      return
    }

    const openRail = options.openRail ?? moduleRailOpen
    const announce = options.announce ?? true
    const openEditor = options.openEditor ?? true
    const id = moduleId(pageModule)
    const nextCanvasPageKey = canvasPageKeyForModule(pageModule, selectedPage)
    const nextPage = PAGES.find((page) => page.key === nextCanvasPageKey) ?? currentPage
    const nextPreviewPath = previewPathForModule(nextPage.path, pageModule, null, caseDetailPreviewPath)
    const switchingPage = nextCanvasPageKey !== selectedPage
    const switchingPreviewRoute = switchingPage || nextPreviewPath !== activePreviewPath
    setSelectedPage(nextCanvasPageKey)
    setSelectedModuleId(id)
    setExternalEditTarget(null)
    pendingCanvasSelectionRef.current = null
    setSelectedField({ itemId: null, field: null })
    setCanvasSelectionOpen(openEditor)
    setModuleRailOpen(openRail)
    setAdvancedStructureOpen(false)
    setFieldFormOpen(false)
    setImmersiveEditor(true)
    syncSelectedModuleUrl(id, canvasQueryPageKey(pageModule, nextCanvasPageKey))
    focusCanvasModule(id)
    window.setTimeout(() => {
      scrollModuleWorkbenchIntoView()
      if (announce) toast.message(`已定位：${readableModuleTitle(pageModule)}`)
    }, 0)

    if (switchingPreviewRoute) {
      setFrameLoaded(false)
      setLocatedModules({})
      setHighlightRect(null)
    } else {
      window.setTimeout(refreshFrameState, 0)
    }
  }, [
    activePreviewPath,
    caseDetailPreviewPath,
    currentPage,
    focusCanvasModule,
    refreshFrameState,
    scrollModuleWorkbenchIntoView,
    selectedPage,
    syncSelectedModuleUrl,
    moduleRailOpen,
  ])

  const handleSelectPage = (pageKey: PageKey) => {
    const nextModule = modules.find((pageModule) => pageModule.page_key === pageKey)
    if (!nextModule) return

    const nextModuleId = moduleId(nextModule)
    setSelectedPage(pageKey)
    setSelectedModuleId(nextModuleId)
    setExternalEditTarget(null)
    pendingCanvasSelectionRef.current = null
    setSelectedField({ itemId: null, field: null })
    setCanvasSelectionOpen(false)
    setModuleRailOpen(false)
    setAdvancedStructureOpen(false)
    setLocatedModules({})
    setHighlightRect(null)
    setFrameLoaded(false)
    syncSelectedModuleUrl(nextModuleId)
    window.setTimeout(scrollModuleWorkbenchIntoView, 0)
  }

  const discardActiveChanges = () => {
    if (!active) return
    const saved = savedModules.find((pageModule) => moduleId(pageModule) === activeModuleId)
    if (!saved) return

    setModules((prev) => prev.map((pageModule) => (
      moduleId(pageModule) === activeModuleId ? cloneModule(saved) : pageModule
    )))
    setSelectedField({ itemId: null, field: null })
    setCanvasSelectionOpen(false)
    setFrameLoaded(false)
    setPreviewVersion(Date.now())
    toast.message('已撤销当前模块的未保存修改')
  }

  const saveExternalEditTarget = async () => {
    const target = externalEditTarget
    if (!target?.apiUrl || !target.patchKey) {
      toast.message('这项需要打开编辑页处理')
      return
    }
    const directSaveKind = target.apiUrl.startsWith('/api/admin/products/')
      ? { label: '产品', needsCurrentPayload: false }
      : target.apiUrl.startsWith('/api/admin/projects/')
        ? { label: target.title.includes('Global') ? '项目' : '案例', needsCurrentPayload: false }
        : target.apiUrl.startsWith('/api/admin/site-content/')
          ? { label: '内容', needsCurrentPayload: true }
          : target.apiUrl.startsWith('/api/admin/news/')
            ? { label: '新闻', needsCurrentPayload: false }
            : null
    if (!directSaveKind) {
      toast.error('这项需要打开编辑页处理')
      return
    }

    const nextText = externalDraftValue.trim()
    if (target.required && !nextText) {
      toast.error('当前内容不能为空')
      return
    }

    setExternalSaving(true)
    try {
      let payload: Record<string, unknown> = {}

      if (target.arrayIndex != null) {
        if (!nextText) {
          throw new Error('列表项不能为空。如需删除或重排，请使用页面布局。')
        }

        const currentRes = await fetch(target.apiUrl, { cache: 'no-store' })
        const currentData = await currentRes.json().catch(() => ({}))
        if (!currentRes.ok) {
          throw new Error(typeof currentData.error === 'string' ? currentData.error : `读取当前${directSaveKind.label}失败`)
        }

        const currentArray = currentData.data?.[target.patchKey]
        if (!Array.isArray(currentArray)) {
          throw new Error('这组内容需要打开编辑页处理')
        }

        const index = Math.trunc(target.arrayIndex)
        const appendMode = target.arrayMode === 'append'
        if (index < 0 || (!appendMode && index >= currentArray.length)) {
          throw new Error('当前列表项已变化，请刷新预览后再试')
        }

        const nextArray = [...currentArray]
        const nextValue = externalPatchValue(target, nextText)
        const nextIndex = appendMode ? nextArray.length : index
        const objectPath = externalObjectPathSegments(target.objectPath)
        if (objectPath.length > 0) {
          if (appendMode) {
            throw new Error('这组内容需要打开编辑页处理')
          }
          const currentItem = currentArray[nextIndex]
          nextArray[nextIndex] = setExternalNestedValue(currentItem, objectPath, nextValue)
        } else if (target.objectKey) {
          const currentItem = currentArray[nextIndex]
          if (!currentItem || typeof currentItem !== 'object' || Array.isArray(currentItem)) {
            throw new Error('这条内容需要打开编辑页处理')
          }
          nextArray[nextIndex] = { ...currentItem, [target.objectKey]: nextValue }
        } else {
          nextArray[nextIndex] = nextValue
        }
        payload[target.patchKey] = nextArray
      } else if (target.objectPath || target.objectKey) {
        const currentRes = await fetch(target.apiUrl, { cache: 'no-store' })
        const currentData = await currentRes.json().catch(() => ({}))
        if (!currentRes.ok) {
          throw new Error(typeof currentData.error === 'string' ? currentData.error : `读取当前${directSaveKind.label}失败`)
        }

        const currentValue = currentData.data?.[target.patchKey]
        const nextValue = externalPatchValue(target, nextText)
        const objectPath = externalObjectPathSegments(target.objectPath)
        if (objectPath.length > 0) {
          payload[target.patchKey] = setExternalNestedValue(plainObject(currentValue), objectPath, nextValue)
        } else if (target.objectKey) {
          payload[target.patchKey] = {
            ...plainObject(currentValue),
            [target.objectKey]: nextValue,
          }
        } else {
          payload[target.patchKey] = nextValue
        }
      } else if (directSaveKind.needsCurrentPayload) {
        const currentRes = await fetch(target.apiUrl, { cache: 'no-store' })
        const currentData = await currentRes.json().catch(() => ({}))
        if (!currentRes.ok) {
          throw new Error(typeof currentData.error === 'string' ? currentData.error : `读取当前${directSaveKind.label}失败`)
        }
        const currentItem = currentData.data
        if (!currentItem || typeof currentItem !== 'object' || Array.isArray(currentItem)) {
          throw new Error('这项需要打开编辑页处理')
        }
        const nextValue = externalPatchValue(target, nextText)
        const payloadKey = payloadPatchKey(target.patchKey)
        payload = {
          ...currentItem,
          ...(payloadKey
            ? { payload: { ...plainObject((currentItem as Record<string, unknown>).payload), [payloadKey]: nextValue } }
            : { [target.patchKey]: nextValue }),
        }
      } else {
        payload[target.patchKey] = externalPatchValue(target, nextText)
      }

      const res = await fetch(target.apiUrl, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '保存失败')

      const updatedArray = target.arrayIndex != null ? data.data?.[target.patchKey] : null
      const updatedArrayIndex = Array.isArray(updatedArray)
        ? (target.arrayMode === 'append' ? updatedArray.length - 1 : Math.trunc(target.arrayIndex as number))
        : null
      const updatedArrayItem = updatedArrayIndex != null
        ? data.data?.[target.patchKey]?.[updatedArrayIndex]
        : null
      const updatedObjectPath = externalObjectPathSegments(target.objectPath)
      let updatedValue: unknown
      if (target.arrayIndex != null) {
        if (updatedObjectPath.length > 0) {
          updatedValue = getExternalNestedValue(updatedArrayItem, updatedObjectPath)
        } else if (target.objectKey && updatedArrayItem && typeof updatedArrayItem === 'object' && !Array.isArray(updatedArrayItem)) {
          updatedValue = (updatedArrayItem as Record<string, unknown>)[target.objectKey]
        } else {
          updatedValue = updatedArrayItem
        }
      } else if (updatedObjectPath.length > 0) {
        updatedValue = getExternalNestedValue(data.data?.[target.patchKey], updatedObjectPath)
      } else if (target.objectKey && data.data?.[target.patchKey] && typeof data.data[target.patchKey] === 'object' && !Array.isArray(data.data[target.patchKey])) {
        updatedValue = (data.data[target.patchKey] as Record<string, unknown>)[target.objectKey]
      } else if (payloadPatchKey(target.patchKey)) {
        updatedValue = data.data?.payload?.[payloadPatchKey(target.patchKey) as string]
      } else {
        updatedValue = data.data?.[target.patchKey]
      }
      const savedText = updatedValue == null ? '' : String(updatedValue)

      setExternalEditTarget((prev) => (
        prev?.apiUrl === target.apiUrl
        && prev.patchKey === target.patchKey
        && prev.objectKey === target.objectKey
        && prev.objectPath === target.objectPath
        && prev.arrayIndex === target.arrayIndex
        && prev.arrayMode === target.arrayMode
          ? {
              ...prev,
              text: savedText,
              arrayIndex: target.arrayMode === 'append' && updatedArrayIndex != null ? updatedArrayIndex : prev.arrayIndex,
              arrayMode: target.arrayMode === 'append' ? 'replace' : prev.arrayMode,
            }
          : prev
      ))
      setExternalDraftValue(savedText)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success(`${directSaveKind.label}内容已保存，画布正在刷新`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setExternalSaving(false)
    }
  }
  saveExternalEditTargetRef.current = saveExternalEditTarget

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
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('草稿已保存，前台不会变化。确认无误后再发布。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }
  saveActiveModuleRef.current = saveActiveModule

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
      toast.warning(`发布前检查发现 ${activePreflightIssues.length} 项提醒，请在确认弹窗中确认`)
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
      setCanvasSelectionOpen(false)
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '恢复页面版本失败')

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
      setCanvasSelectionOpen(false)
      setRestoreSnapshot(null)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('已恢复到草稿，前台不会变化。确认无误后再发布。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '恢复页面版本失败')
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '读取页面版本失败')
      setStructureSnapshots((prev) => ({
        ...prev,
        [pageKey]: (data.data ?? []) as PageStructureSnapshotRow[],
      }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '读取页面版本失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const reloadPreviewModules = async (pageKey: PageKey) => {
    const sp = new URLSearchParams({ draft: '1', visualPreview: String(Date.now()) })
    const res = await fetch(`/api/page-modules/${pageKey}?${sp.toString()}`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !Array.isArray(data.data)) {
      throw new Error(typeof data.error === 'string' ? data.error : '刷新页面内容失败')
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
      toast.error('当前只支持在首页新增模块')
      return
    }
    if (hasAnyUnsavedChanges) {
      toast.error('请先保存或撤销当前未保存修改，再新增模块')
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '新增模块失败')

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
      toast.success('模块已加入首页排序草稿，发布后前台生效。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新增模块失败')
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '调整页面布局失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      await reloadPreviewModules('home')
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('页面布局已保存为草稿，发布后前台生效。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '调整页面布局失败')
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '调整显示状态失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      await reloadPreviewModules('home')
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success(isVisible ? '模块已恢复显示。' : '模块已隐藏。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '调整显示状态失败')
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '开始调整页面布局失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('已进入布局调整，发布前前台不变。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '开始调整页面布局失败')
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '放弃页面布局调整失败')

      removeStructureDraft(pageKey)
      const nextModules = await reloadPreviewModules(pageKey)
      const nextActive = nextModules.find((item) => item.page_key === pageKey)
      if (nextActive) setSelectedModuleId(moduleId(nextActive))
      setStructureDiscardConfirmOpen(false)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('已放弃页面布局调整，预览回到线上版本。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '放弃页面布局调整失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const publishStructureDraft = async () => {
    if (!currentStructureDraft) return
    if (!canPublishStructureDraft) {
      toast.error('仅管理员可发布页面布局')
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
              ? '只有管理员可以发布页面布局'
              : '发布页面布局失败',
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
      toast.success('页面布局已发布，前台页面已更新。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发布页面布局失败')
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : '恢复页面版本失败')

      upsertStructureDraft(data.data as PageStructureDraftRow)
      await reloadPreviewModules(selectedPage)
      setStructureRestoreSnapshot(null)
      setPreviewVersion(Date.now())
      setFrameLoaded(false)
      toast.success('页面版本已恢复为当前调整，前台不会立即变化。')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '恢复页面版本失败')
    } finally {
      setStructureBusy(null)
    }
  }

  const bindFieldRef = (itemId: string, field: string) => (node: HTMLElement | null) => {
    if (!activeModuleId) return
    fieldRefs.current[editorFieldKey(activeModuleId, itemId, field)] = node
  }

  const bindModuleFieldRef = (field: string) => (node: HTMLElement | null) => {
    if (!activeModuleId) return
    fieldRefs.current[editorFieldKey(activeModuleId, MODULE_FIELD_REF_ITEM_ID, field)] = node
  }

  const isSelectedField = (itemId: string, field: string) => (
    selectedField.itemId === itemId && selectedField.field === field
  )

  const isSelectedModuleField = (field: string) => (
    selectedField.itemId === null && selectedField.field === field
  )

  const fieldClassName = (itemId: string, field: string) => (
    `rounded-md border bg-white p-2 transition-colors ${
      isSelectedField(itemId, field) ? 'border-[#E36F2C] shadow-[0_0_0_3px_rgba(227,111,44,0.12)]' : 'border-[#E5DED4]'
    }`
  )

  const moduleFieldClassName = (field: string) => (
    `rounded-md border bg-white p-2 transition-colors ${
      isSelectedModuleField(field) ? 'border-[#E36F2C] shadow-[0_0_0_3px_rgba(227,111,44,0.12)]' : 'border-[#E5DED4]'
    }`
  )

  useEffect(() => {
    let disposed = false
    let cleanupFrame: (() => void) | null = null
    let intervalId: number | null = null
    let timeoutId: number | null = null
    let refreshTimers: number[] = []

    const attachFrameListeners = () => {
      if (disposed || cleanupFrame) return true

      const iframe = iframeRef.current
      const doc = getIframeDocument(iframe)
      const frameWindow = iframe?.contentWindow ?? null
      if (!doc || !frameWindow) return false

      const handleClick = (event: MouseEvent) => {
        const target = getFrameElement(event.target, doc)
        if (shouldSkipRepeatedFrameSelection(target)) return
        selectCanvasElement(target, event)
      }

      const handleFramePointerMove = (event: MouseEvent) => {
        const target = getFrameElement(event.target, doc)
        const hotspot = editableHotspotFromFrameTarget(target)
        if (!hotspot) {
          setHoverRect(null)
          return
        }

        const nextRect = canvasRectFromElement(hotspot)
        setHoverRect((prev) => (sameHighlightRect(prev, nextRect) ? prev : nextRect))
      }

      const handleFramePointerLeave = () => {
        setHoverRect(null)
      }

      const handleFrameUpdate = () => refreshFrameState()

      doc.addEventListener('click', handleClick, true)
      doc.addEventListener('mousemove', handleFramePointerMove, true)
      doc.addEventListener('mouseleave', handleFramePointerLeave, true)
      frameWindow.addEventListener('scroll', handleFrameUpdate, { passive: true })
      frameWindow.addEventListener('resize', handleFrameUpdate)
      window.addEventListener('resize', handleFrameUpdate)
      setFrameLoaded(true)
      const frame = window.requestAnimationFrame(refreshFrameState)
      refreshTimers = [80, 300, 700, 1400, 2200, 3600, 5200, 7000].map((delay) => (
        window.setTimeout(refreshFrameState, delay)
      ))

      cleanupFrame = () => {
        window.cancelAnimationFrame(frame)
        refreshTimers.forEach((timer) => window.clearTimeout(timer))
        refreshTimers = []
        doc.removeEventListener('click', handleClick, true)
        doc.removeEventListener('mousemove', handleFramePointerMove, true)
        doc.removeEventListener('mouseleave', handleFramePointerLeave, true)
        frameWindow.removeEventListener('scroll', handleFrameUpdate)
        frameWindow.removeEventListener('resize', handleFrameUpdate)
        window.removeEventListener('resize', handleFrameUpdate)
      }
      return true
    }

    if (!attachFrameListeners()) {
      intervalId = window.setInterval(() => {
        if (attachFrameListeners() && intervalId) {
          window.clearInterval(intervalId)
          intervalId = null
        }
      }, 250)
      timeoutId = window.setTimeout(() => {
        if (intervalId) {
          window.clearInterval(intervalId)
          intervalId = null
        }
      }, 5000)
    }

    return () => {
      disposed = true
      if (intervalId) window.clearInterval(intervalId)
      if (timeoutId) window.clearTimeout(timeoutId)
      cleanupFrame?.()
    }
  }, [activePreviewPath, previewDevice, previewVersion, refreshFrameState, selectCanvasElement, shouldSkipRepeatedFrameSelection])

  useEffect(() => {
    const processPreviewSelection = (data: VisualEditorSelectionData) => {
      if (!data || data.type !== 'vessel303:visual-editor-select') return

      const externalTarget = externalEditTargetFromMessage(data)
      if (externalTarget) {
        setExternalEditTarget(externalTarget)
        setSelectedField({ itemId: null, field: null })
        activateCanvasEditFocus()
        pendingCanvasSelectionRef.current = null
        window.requestAnimationFrame(refreshFrameState)
        return
      }

      const id = data.moduleId ?? null
      const pageModule = id ? modules.find((item) => moduleId(item) === id) : null
      if (!id || !pageModule || !isPageKey(pageModule.page_key)) return

      const selection = resolveCanvasSelection(pageModule, {
        itemId: data.itemId ?? null,
        field: data.field ?? null,
        text: data.text ?? null,
      })
      const nextCanvasPageKey = canvasPageKeyForModule(pageModule, selectedPage)
      setSelectedPage(nextCanvasPageKey)
      setSelectedModuleId(id)
      setLocatedModules((prev) => (prev[id] === true ? prev : { ...prev, [id]: true }))
      setExternalEditTarget(null)
      setSelectedField(selection)
      activateCanvasEditFocus(id)
      setCanvasSelectionOpen(true)
      pendingCanvasSelectionRef.current = { moduleId: id, selection }
      replaceCanvasModuleUrl(id, canvasQueryPageKey(pageModule, nextCanvasPageKey))
      window.requestAnimationFrame(refreshFrameState)
    }

    const selectFromPreview = (payload: unknown) => {
      const data = payload as VisualEditorSelectionData
      processPreviewSelection(data)
    }

    window.__vessel303VisualEditorSelectFromPreview = selectFromPreview

    const handlePreviewMessage = (event: MessageEvent) => {
      const previewFrameWindow = iframeRef.current?.contentWindow ?? null
      const isCurrentPreviewFrame = Boolean(previewFrameWindow && event.source === previewFrameWindow)
      if (event.origin !== window.location.origin && !isCurrentPreviewFrame) return
      processPreviewSelection(event.data as VisualEditorSelectionData)
    }

    window.addEventListener('message', handlePreviewMessage)
    return () => {
      window.removeEventListener('message', handlePreviewMessage)
      if (window.__vessel303VisualEditorSelectFromPreview === selectFromPreview) {
        delete window.__vessel303VisualEditorSelectFromPreview
      }
    }
  }, [activateCanvasEditFocus, modules, refreshFrameState, replaceCanvasModuleUrl, selectedPage])

  useEffect(() => {
    if (!frameLoaded) return

    const frame = window.requestAnimationFrame(refreshFrameState)
    return () => window.cancelAnimationFrame(frame)
  }, [frameLoaded, refreshFrameState, selectedModuleId])

  useEffect(() => {
    if (!frameLoaded) return

    const frame = window.requestAnimationFrame(refreshFrameState)
    return () => window.cancelAnimationFrame(frame)
  }, [canvasFrameHeight, frameLoaded, refreshFrameState])

  useEffect(() => {
    if (!frameLoaded || !activeModuleId) return

    const first = window.setTimeout(() => scrollModuleIntoView(activeModuleId), 160)
    const second = window.setTimeout(() => scrollModuleIntoView(activeModuleId), 520)
    const third = window.setTimeout(() => scrollModuleIntoView(activeModuleId), 1200)
    const fourth = window.setTimeout(() => scrollModuleIntoView(activeModuleId), 2200)
    return () => {
      window.clearTimeout(first)
      window.clearTimeout(second)
      window.clearTimeout(third)
      window.clearTimeout(fourth)
    }
  }, [activeModuleId, activePreviewPath, frameLoaded, previewDevice, scrollModuleIntoView])

  useEffect(() => {
    if (!frameLoaded) return

    const timer = window.setTimeout(refreshFrameState, 120)
    return () => window.clearTimeout(timer)
  }, [frameLoaded, previewDevice, refreshFrameState])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (!externalEditTarget && !hasFocusedCanvasEditor) return
      clearCanvasEditorSelection()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [clearCanvasEditorSelection, externalEditTarget, hasFocusedCanvasEditor])

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return

      if (externalCanSave && externalHasUnsavedChanges && !externalSaving) {
        event.preventDefault()
        void saveExternalEditTargetRef.current?.()
        return
      }

      if (activeHasUnsavedChanges && !saving) {
        event.preventDefault()
        void saveActiveModuleRef.current?.()
      }
    }

    window.addEventListener('keydown', handleSaveShortcut)
    return () => window.removeEventListener('keydown', handleSaveShortcut)
  }, [activeHasUnsavedChanges, externalCanSave, externalHasUnsavedChanges, externalSaving, saving])

  useEffect(() => {
    if (!activeModuleId || !selectedField.field) return

    const refItemId = selectedField.itemId ?? MODULE_FIELD_REF_ITEM_ID
    const node = fieldRefs.current[editorFieldKey(activeModuleId, refItemId, selectedField.field)]
    if (!node) return

    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const control = node.querySelector<HTMLElement>('input, textarea, button')
    control?.focus({ preventScroll: true })
  }, [activeModuleId, selectedField.field, selectedField.itemId])

  const handleFrameLoad = () => {
    setFrameLoaded(true)
    setFrameVersion((value) => value + 1)
    window.setTimeout(refreshFrameState, 0)
    window.setTimeout(() => scrollModuleIntoView(activeModuleId), 260)
    window.setTimeout(refreshFrameState, 600)
  }

  useEffect(() => {
    if (frameLoaded || !iframeRef.current) return

    const timer = window.setTimeout(() => {
      if (frameLoaded || !iframeRef.current) return
      setFrameLoaded(true)
      setFrameVersion((value) => value + 1)
      window.setTimeout(refreshFrameState, 0)
      window.setTimeout(() => scrollModuleIntoView(activeModuleId), 260)
      window.setTimeout(refreshFrameState, 600)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [activeModuleId, frameLoaded, previewSrc, refreshFrameState, scrollModuleIntoView])

  if (!active) {
    return (
      <div className="rounded-lg border border-dashed border-[#E5DED4] bg-white p-12 text-center text-sm text-[#8A8580]">
        暂无可编辑内容。
      </div>
    )
  }

  return (
    <div className={visualEditorShellClass}>
      <section className="sticky top-0 z-10 rounded-md border border-[#D8E7E8] bg-white px-2 py-1.5 shadow-sm">
        <div className="grid gap-1.5 xl:grid-cols-[minmax(320px,0.75fr)_minmax(220px,1fr)_auto] xl:items-center">
          <div className="grid min-w-0 gap-1.5 md:grid-cols-[132px_minmax(0,1fr)]">
            <label className="sr-only" htmlFor="visual-page-select">
              页面
            </label>
            <select
              id="visual-page-select"
              value={selectedPage}
              onChange={(event) => {
                const pageKey = event.target.value as PageKey
                if (PAGE_KEY_SET.has(pageKey)) handleSelectPage(pageKey)
              }}
              className="h-8 min-w-0 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 text-sm font-semibold text-[#1E2C31] outline-none transition focus:border-[#1889B6] focus:bg-white"
            >
              {PAGES.map((page) => (
                <option key={page.key} value={page.key}>
                  {page.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="visual-module-select">
              当前模块
            </label>
            <select
              id="visual-module-select"
              value={activeModuleId}
              disabled={currentModuleOptions.length === 0}
              onChange={(event) => {
                const nextModule = currentModules.find((pageModule) => moduleId(pageModule) === event.target.value)
                if (nextModule) handleSelectModule(nextModule, { openRail: false, announce: false })
              }}
              className="h-8 min-w-0 rounded-md border border-[#D8E7E8] bg-white px-2.5 text-sm font-semibold text-[#1E2C31] outline-none transition focus:border-[#1889B6]"
            >
              {currentModuleOptions.map((pageModule) => (
                <option key={moduleId(pageModule)} value={moduleId(pageModule)}>
                  {readableModuleTitle(pageModule)}{pageModule.is_visible === false ? '（已隐藏）' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {canvasRouteOptions.length > 1 ? (
              <div className="flex h-8 min-w-0 items-center gap-1 rounded-md border border-[#E5DED4] bg-[#F8F6F2] p-1">
                <span className="shrink-0 px-1.5 text-[11px] font-semibold text-[#6B625B]">页面</span>
                {canvasRouteOptions.map((option) => (
                  <button
                    key={option.path}
                    type="button"
                    title={option.path}
                    aria-pressed={option.selected}
                    onClick={() => {
                      if (!option.preferredModule) return
                      const switchingRoute = option.path !== activePreviewPath
                       handleSelectModule(option.preferredModule, { openRail: false, announce: false })
                      if (switchingRoute) {
                        focusCanvasRouteTop()
                      } else {
                        window.setTimeout(refreshFrameState, 120)
                      }
                    }}
                    className="inline-flex h-6 items-center gap-1 rounded px-2 text-xs font-semibold transition-colors"
                    style={{
                      background: option.selected ? '#FFFFFF' : 'transparent',
                      color: option.selected ? '#2C2A28' : '#8A8580',
                      boxShadow: option.selected ? '0 1px 2px rgba(36,31,27,0.10)' : 'none',
                    }}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <span className="inline-flex h-8 items-center rounded-md bg-[#F0F7F8] px-2 text-xs font-semibold text-[#1889B6]">
              {currentPageStats.moduleCount} 块
            </span>
            <span className={`inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold ${
              hasAnyUnsavedChanges ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {hasAnyUnsavedChanges ? `${dirtyIds.size} 未保存` : '已保存'}
            </span>
            {totalDraftModules > 0 ? (
              <span className="inline-flex h-8 items-center rounded-md bg-[#FFF2E7] px-2.5 text-xs font-semibold text-[#E36F2C]">
                {totalDraftModules} 待发布
              </span>
            ) : null}
            {hasFocusedCanvasEditor ? (
              <span className="min-w-0 truncate rounded-md bg-[#F8F6F2] px-2.5 py-1 text-xs font-semibold text-[#6B625B]">
                {selectedFieldSummary}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={moduleRailOpen ? 'default' : 'outline'}
              onClick={() => {
                setModuleRailOpen((value) => !value)
                window.setTimeout(refreshFrameState, 120)
              }}
            >
              <LocateFixed size={14} />
              {moduleRailOpen ? '收起模块' : '模块'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={fieldFormOpen ? 'default' : 'outline'}
              onClick={() => {
                setFieldFormOpen((value) => !value)
                window.setTimeout(refreshFrameState, 120)
              }}
            >
              <Type size={14} />
              {fieldFormOpen ? '收起面板' : '面板'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={showEditableMarks ? 'default' : 'outline'}
              onClick={() => setShowEditableMarks((value) => !value)}
            >
              <MousePointer2 size={14} />
              {showEditableMarks ? '隐藏标记' : '标记'}
            </Button>
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
                    className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors"
                    style={{
                      background: selected ? '#FFFFFF' : 'transparent',
                      color: selected ? '#2C2A28' : '#8A8580',
                      boxShadow: selected ? '0 1px 2px rgba(36,31,27,0.10)' : 'none',
                    }}
                    aria-pressed={selected}
                  >
                    <Icon size={13} />
                    {device.label}
                  </button>
                )
              })}
            </div>
            <div className="flex rounded-md border border-[#E5DED4] bg-[#F8F6F2] p-1">
              {CANVAS_ZOOM_MODES.map((mode) => {
                const selected = mode.key === canvasZoomMode
                return (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => {
                      setCanvasZoomMode(mode.key)
                      window.setTimeout(refreshFrameState, 120)
                    }}
                    className="inline-flex h-7 items-center rounded px-2 text-xs font-medium transition-colors"
                    style={{
                      background: selected ? '#FFFFFF' : 'transparent',
                      color: selected ? '#2C2A28' : '#8A8580',
                      boxShadow: selected ? '0 1px 2px rgba(36,31,27,0.10)' : 'none',
                    }}
                    aria-pressed={selected}
                  >
                    {mode.label}
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
              刷新
            </Button>
            <Link
              href={activePreviewPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-2.5 text-sm font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/65 hover:text-[#1889B6]"
            >
              <ArrowUpRight size={14} />
              打开前台
            </Link>
            {currentAdminRole === 'admin' ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAdvancedStructureOpen((value) => !value)}
              >
                <Layers3 size={14} />
                {advancedStructureOpen ? '回画布' : '排序/新增'}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant={immersiveEditor ? 'default' : 'outline'}
              onClick={() => {
                setImmersiveEditor((value) => !value)
                window.setTimeout(refreshFrameState, 160)
              }}
            >
              {immersiveEditor ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {immersiveEditor ? '退出全屏' : '全屏编辑'}
            </Button>
          </div>
        </div>
      </section>

      {advancedStructureOpen && currentAdminRole === 'admin' ? (
        <div className="space-y-3">
          <section className="rounded-md border border-[#D8E7E8] bg-white px-3 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 items-center rounded-md bg-[#F0F7F8] px-2.5 text-xs font-semibold text-[#1889B6]">
                    {currentPage.label}
                  </span>
                  <span className="inline-flex h-8 items-center rounded-md bg-[#F7FAFA] px-2.5 text-xs font-semibold text-[#1E2C31]">
                    {currentCanvasModules.length} 个模块
                  </span>
                  {totalDraftModules > 0 ? (
                    <span className="inline-flex h-8 items-center rounded-md bg-[#FFF2E7] px-2.5 text-xs font-semibold text-[#E36F2C]">
                      {totalDraftModules} 个待发布
                    </span>
                  ) : null}
                  {totalUnsavedModules > 0 ? (
                    <span className="inline-flex h-8 items-center rounded-md bg-[#FFF2E7] px-2.5 text-xs font-semibold text-[#E36F2C]">
                      {totalUnsavedModules} 个未保存
                    </span>
                  ) : null}
                  {totalPreflightIssues > 0 ? (
                    <span className="inline-flex h-8 items-center rounded-md bg-[#FFF2E7] px-2.5 text-xs font-semibold text-[#B54318]">
                      {totalPreflightIssues} 个提醒
                    </span>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAdvancedStructureOpen(false)}
              >
                返回画布编辑
              </Button>
            </div>
          </section>

          <details className="rounded-md border border-[#D8E7E8] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-[#2C2A28]">
              <span className="inline-flex items-center gap-2">
                <ListChecks size={15} className="text-[#1889B6]" />
                页面状态
              </span>
              <span className="text-xs font-medium text-[#61767D]">
                {totalDraftModules + totalUnsavedModules + totalPreflightIssues} 项
              </span>
            </summary>
            <div className="border-t border-[#D8E7E8] p-3">
              <VisualOperationsMatrix
                currentPage={currentPage}
                currentPreviewPath={activePreviewPath}
                currentPageStats={currentPageStats}
                currentModules={currentPreviewModules}
                allModules={modules}
                pageStats={pageStats}
                dirtyIds={dirtyIds}
                locatedModules={locatedModules}
                frameLoaded={frameLoaded}
                structureDrafts={structureDrafts}
                onSelectModule={handleSelectModule}
              />
            </div>
          </details>

          <div className="space-y-5">

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
                  <p className="text-sm font-bold text-[#1E2C31]">{page.label} 页面内容</p>
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
                  <p className="mt-1 text-[11px] text-[#61767D]">提醒</p>
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

          <section className="rounded-lg border border-[#E5DED4] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2A28]">
              <Layers3 size={16} className="text-[#E36F2C]" />
              <span>页面布局</span>
            </div>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
              currentStructureDraft
                ? structureDraftStatusClassName(currentStructureDraft.draft_status)
                : 'bg-[#F5F2ED] text-[#6B625B]'
            }`}
          >
            {currentPage.label}：{currentStructureDraft ? structureDraftStatusLabel(currentStructureDraft.draft_status) : '未开始调整'}
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
                <p className="mt-3 truncate text-xs leading-4 text-[#8A8580]">
                  {formatSnapshotTime(currentStructureDraft.updated_at)} · {currentStructureDraft.updated_by_email ?? '未知'}
                </p>
                {currentStructureDraft.draft_status === 'stale' ? (
                  <p className="mt-2 rounded-md border border-[#F1D0BD] bg-white px-2 py-2 text-xs font-semibold leading-4 text-[#B54318]">
                    线上布局已变化
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs leading-4 text-[#8A8580]">未开始调整。</p>
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
                开始调整
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
                title={canPublishStructureDraft ? '发布页面布局' : '仅管理员可发布页面布局'}
              >
                <ArrowUpRight size={14} />
                发布布局
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!currentStructureDraft || Boolean(structureBusy)}
                onClick={() => setStructureDiscardConfirmOpen(true)}
              >
                <RotateCcw size={14} />
                放弃调整
              </Button>
            </div>

            {selectedPage === 'home' && currentStructureDraft ? (
              <details className="mt-4 rounded-md border border-[#E5DED4] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-[#2C2A28]">
                  <span className="inline-flex items-center gap-2">
                    <Plus size={14} className="text-[#E36F2C]" />
                    添加模块
                  </span>
                  <span className="rounded-full bg-[#F5F2ED] px-2 py-1 text-[11px] text-[#6B625B]">
                    首页
                  </span>
                </summary>
                <div className="border-t border-[#E5DED4] p-3">
                  <ModuleCatalogPanel
                    selectedPage={selectedPage}
                    currentStructureDraft={currentStructureDraft}
                    structureBusy={structureBusy}
                    onAddTemplate={addStructureModule}
                  />
                </div>
              </details>
            ) : null}

            {selectedPage === 'home' && currentStructureDraft ? (
              <div className="mt-4 rounded-md border border-[#E5DED4] bg-white p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#2C2A28]">首页模块排序</p>
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
                              <p className="mt-1 truncate text-[11px] text-[#8A8580]">
                                第 {index + 1} 位
                              </p>
                              {hidden ? (
                                <p className="mt-1 text-[11px] text-[#B54318]">当前调整中隐藏</p>
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
                    <p className="text-xs leading-5 text-[#8A8580]">暂无可调整内容。</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#2C2A28]">页面版本</p>
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
                        恢复到当前调整
                      </Button>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs leading-5 text-[#8A8580]">暂无页面版本。</p>
              )}
            </div>
          </div>
        </div>
          </section>
        </div>
        </div>
      ) : null}

      <div
        id="visual-module-workbench"
        data-active-module-id={activeModuleId}
        data-selected-item-id={selectedField.itemId ?? ''}
        data-selected-field={selectedField.field ?? ''}
        className={visualWorkbenchClass}
      >
        {moduleRailOpen ? (
        <aside className="rounded-md border border-[#E5DED4] bg-white xl:sticky xl:top-20 xl:max-h-[calc(100vh-88px)] xl:overflow-auto">
          <div className="border-b border-[#E5DED4] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#2C2A28]">模块</p>
              <span className="shrink-0 rounded-full bg-[#F0F7F8] px-2 py-0.5 text-[11px] font-semibold text-[#1889B6]">
                {moduleRailRows.length}/{currentCanvasModules.length}
              </span>
            </div>
            <Input
              value={moduleRailQuery}
              onChange={(event) => setModuleRailQuery(event.target.value)}
              placeholder="搜索模块"
              className="mt-2 h-8 bg-white text-xs"
            />
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#6B625B]">
              <span className="rounded-full bg-[#F0F7F8] px-2 py-0.5 text-[#1889B6]">{moduleRailCanvasCount} 可点选</span>
              {moduleRailHiddenCount > 0 ? (
                <span className="rounded-full bg-[#FFF2E7] px-2 py-0.5 text-[#B54318]">{moduleRailHiddenCount} 未显示</span>
              ) : null}
            </div>
          </div>
          <div className="space-y-2 p-1.5">
            {moduleRailRows.length > 0 ? moduleRailGroups.map((group) => {
              const groupHasSelected = group.rows.some((row) => row.selected)
              return (
                <details
                  key={group.key}
                  className="rounded-md border border-[#EEF1EF] bg-[#FAFCFC]"
                  open={group.key !== 'not-rendered' || Boolean(moduleRailQuery.trim()) || groupHasSelected}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold text-[#2C2A28]">{group.title}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-medium text-[#8A8580]">{group.hint}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#6B625B]">
                      {group.rows.length}
                    </span>
                  </summary>
                  <div className="space-y-1 border-t border-[#EEF1EF] p-1">
                    {group.rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => {
                          handleSelectModule(row.pageModule, { openRail: true })
                          if (row.canvasState === 'not-rendered') {
                            setFieldFormOpen(true)
                            setCanvasSelectionOpen(false)
                            setExternalEditTarget(null)
                          }
                        }}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors"
                        style={{
                          background: row.selected ? '#F5F2ED' : 'transparent',
                          color: row.selected ? '#2C2A28' : '#6B625B',
                        }}
                      >
                        <LocateFixed
                          size={14}
                          className={`mt-0.5 shrink-0 ${
                            row.selected
                              ? 'text-[#E36F2C]'
                              : row.canvasState === 'not-rendered'
                                ? 'text-[#D8B5A1]'
                                : row.canvasState === 'other-canvas'
                                  ? 'text-[#7DB8C8]'
                                  : 'text-[#B7AEA4]'
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="block min-w-0 truncate text-[13px] font-medium">{readableModuleTitle(row.pageModule)}</span>
                            <span className="shrink-0 text-[10px] font-semibold text-[#8A8580]">{row.visibleItemCount}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-[#8A8580]">
                            {row.subtitle}
                          </span>
                          {row.badges.length > 0 ? (
                            <span className="mt-1 flex flex-wrap items-center gap-1">
                              {row.badges.map((badge) => (
                                <span
                                  key={badge.label}
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                </details>
              )
            }) : (
              <div className="rounded-md border border-dashed border-[#D8E7E8] bg-[#F7FAFA] px-3 py-4 text-center text-xs font-medium text-[#61767D]">
                没有匹配内容
              </div>
            )}
          </div>
        </aside>
        ) : null}

        <div className="grid min-w-0 gap-4 xl:contents">
        <main className={`min-w-0 rounded-md border border-[#D8E7E8] bg-white ${canvasGridStartClass}`}>
          <div className="flex flex-col gap-1.5 border-b border-[#D8E7E8] px-2.5 py-1.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2A28]">
                <Eye size={16} className="text-[#E36F2C]" />
              <span>画布</span>
                <span className="rounded-full bg-[#F0F7F8] px-2 py-0.5 text-[11px] font-semibold text-[#1889B6]">
                  {currentPage.label}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#6B625B]">
                <span className="truncate">{canvasHeaderTitle}</span>
                {hasFocusedCanvasEditor ? (
                  <>
                    <span className="rounded-full bg-[#E36F2C]/10 px-2 py-0.5 font-semibold text-[#E36F2C]">正在编辑</span>
                    <span className="truncate">{selectedFieldSummary}</span>
                  </>
                ) : null}
                {activeMissingInCurrentPreview ? (
                  <span className="rounded-full bg-[#FFF2E7] px-2 py-0.5 font-semibold text-[#B54318]">{activeMissingTitle}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="rounded-md bg-[#F7FAFA] px-2.5 py-1 text-xs font-medium text-[#61767D]" title={activePreviewPath}>
                {currentPreviewDevice.label}
              </span>
            </div>
          </div>

          <div
            ref={canvasShellRef}
            className="h-[calc(100vh-88px)] min-h-[700px] overflow-auto bg-white"
          >
            <div
              className="relative mx-auto min-w-0 overflow-hidden bg-white"
              style={{
                width: `${canvasDisplayWidth}px`,
                height: `${canvasDisplayHeight}px`,
              }}
            >
              <div
                className="relative overflow-hidden bg-white"
                style={{
                  width: `${canvasFrameWidth}px`,
                  height: `${canvasFrameHeight}px`,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <iframe
                  key={`${selectedPage}-${activePreviewPath}-${previewVersion}-${previewDevice}-${canvasFrameWidth}`}
                  ref={iframeRef}
                  src={previewSrc}
                  title={`${currentPage.label} 前台预览`}
                  className="h-full w-full border-0 bg-white"
                  onLoad={handleFrameLoad}
                />
                <div className="pointer-events-none absolute inset-0 z-30">
                  {activeMissingInCurrentPreview ? (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/75 px-6">
                      <div className="pointer-events-auto w-full max-w-sm rounded-md border border-[#E5DED4] bg-white p-4 text-center shadow-[0_18px_44px_rgba(36,31,27,0.16)]">
                        <p className="text-sm font-semibold text-[#2C2A28]">{activeMissingTitle}</p>
                        <p className="mt-2 text-xs leading-5 text-[#6B625B]">
                          {activeMissingBody}
                        </p>
                        <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
                          {!active.is_visible && !activeIsStructureManagedTemplate ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                patchActive({ is_visible: true })
                                setFieldFormOpen(true)
                                setModuleRailOpen(false)
                                setCanvasSelectionOpen(false)
                                setExternalEditTarget(null)
                                toast.message('已恢复显示，保存草稿后再预览发布')
                              }}
                            >
                              <Eye size={14} />
                              恢复显示
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant={!active.is_visible && !activeIsStructureManagedTemplate ? 'outline' : 'default'}
                            onClick={() => {
                              setFieldFormOpen(true)
                              setCanvasSelectionOpen(false)
                              setExternalEditTarget(null)
                            }}
                          >
                            <Type size={14} />
                            内容面板
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {canvasHotspots.map((hotspot) => {
                    const marked = showEditableMarks && hotspot.moduleId === activeModuleId
                    return (
                      <button
                        key={hotspot.id}
                        type="button"
                        data-canvas-hotspot-module={hotspot.moduleId}
                        data-canvas-hotspot-item={hotspot.itemId ?? ''}
                        data-canvas-hotspot-field={hotspot.field ?? ''}
                        data-canvas-hotspot-external={hotspot.externalTarget?.targetId ?? ''}
                        aria-label={
                          hotspot.externalTarget
                            ? `${hotspot.moduleId} / ${hotspot.externalTarget.field}`
                            : `${hotspot.moduleId}${hotspot.field ? ` / ${fieldLabel(hotspot.field)}` : ''}`
                        }
                        title={hotspot.externalTarget?.field ?? (hotspot.field ? fieldLabel(hotspot.field) : '选择模块')}
                        className={`pointer-events-auto absolute rounded-sm border outline-none transition focus-visible:ring-2 focus-visible:ring-[#1889B6]/70 ${
                          marked
                            ? 'border-dashed border-[#E36F2C]/55 bg-[#E36F2C]/10 hover:border-[#E36F2C] hover:bg-[#E36F2C]/15'
                            : 'border-transparent bg-transparent hover:border-[#1889B6]/60 hover:bg-[#1889B6]/10'
                        }`}
                        style={{
                          top: hotspot.top,
                          left: hotspot.left,
                          width: hotspot.width,
                          height: hotspot.height,
                          zIndex: canvasHotspotZIndex(hotspot),
                        }}
                        onMouseEnter={() => setHoverRect(hotspot)}
                        onMouseLeave={() => setHoverRect(null)}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          selectCanvasHotspot(hotspot)
                        }}
                      />
                    )
                  })}
                  {hoverRect ? (
                    <div
                      className="absolute rounded-sm border-2 border-[#1889B6] bg-[#1889B6]/10 transition-all duration-75"
                      style={{
                        top: hoverRect.top,
                        left: hoverRect.left,
                        width: hoverRect.width,
                        height: hoverRect.height,
                      }}
                    />
                  ) : null}
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
                  {inlineQuickField ? (
                    <div
                      id="visual-inline-field-editor"
                      data-field={inlineQuickField.field}
                      className="pointer-events-auto absolute rounded-md border border-[#E36F2C]/40 bg-white p-3 text-left shadow-[0_16px_40px_rgba(36,31,27,0.18)]"
                      style={{
                        top: inlineEditorTop,
                        left: inlineEditorLeft,
                        width: inlineEditorWidth,
                        zIndex: 120,
                      }}
                      onPointerDown={stopCanvasEditorEvent}
                      onMouseDown={stopCanvasEditorEvent}
                      onClick={stopCanvasEditorEvent}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#E36F2C]">正在编辑</p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#2C2A28]">{quickSelectedFieldLabel}</p>
                          <p className="mt-0.5 truncate text-[11px] text-[#8A8580]">{quickSelectedSubject}</p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 shrink-0"
                          aria-label="关闭"
                          onClick={clearCanvasEditorSelection}
                        >
                          <X size={13} />
                        </Button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {inlineQuickField.input === 'image' ? (
                          <div className="space-y-2">
                            <PageModuleImagePicker
                              value={inlineQuickField.value}
                              maxUploadMb={maxUploadMb}
                              onChange={patchQuickSelectedField}
                            />
                            <Input
                              ref={setQuickInputElementRef}
                              value={inlineQuickField.value}
                              onChange={(event) => patchQuickSelectedField(event.target.value)}
                              placeholder="图片 URL"
                              className="h-9 bg-white text-sm"
                            />
                          </div>
                        ) : inlineQuickField.input === 'textarea' ? (
                          <Textarea
                            ref={setQuickTextareaElementRef}
                            value={inlineQuickField.value}
                            onChange={(event) => patchQuickSelectedField(event.target.value)}
                            placeholder={quickSelectedFieldLabel}
                            className="min-h-[104px] resize-y bg-white text-sm"
                          />
                        ) : (
                          <Input
                            ref={setQuickInputElementRef}
                            type={inlineQuickField.input === 'number' ? 'number' : 'text'}
                            value={inlineQuickField.value}
                            onChange={(event) => patchQuickSelectedField(event.target.value)}
                            placeholder={quickSelectedFieldLabel}
                            className="h-9 bg-white text-sm"
                          />
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-2.5 py-2">
                          <span className="text-[11px] font-semibold text-[#6B625B]">
                            {inlineQuickField.input === 'textarea'
                              ? `${inlineQuickField.value.length} 字`
                              : inlineQuickField.input === 'image'
                                ? '图片'
                                : inlineQuickField.input === 'number'
                                  ? '数字'
                                  : '文本'}
                          </span>
                          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            activeHasUnsavedChanges ? 'bg-[#FFF2E7] text-[#E36F2C]' : activeHasSavedDraft ? 'bg-[#FFF2E7] text-[#B54318]' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {activeHasUnsavedChanges ? '未保存' : activeHasSavedDraft ? '待发布' : '已同步'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={!activeHasUnsavedChanges || saving}
                            onClick={() => void saveActiveModuleRef.current?.()}
                          >
                            <Save size={14} />
                            {saving ? '保存中' : '保存草稿'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!activeHasSavedDraft || activeHasUnsavedChanges || publishing || activeIsDraftAdded}
                            onClick={requestPublish}
                            title={
                              activeIsDraftAdded
                                ? '新增模块必须通过排序/新增发布'
                                : activeHasUnsavedChanges
                                  ? '请先保存'
                                  : '发布到前台'
                            }
                          >
                            <ArrowUpRight size={14} />
                            {publishing ? '发布中' : '发布'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!activeHasUnsavedChanges || saving}
                            onClick={discardActiveChanges}
                          >
                            <RotateCcw size={14} />
                            撤销
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedField({ itemId: null, field: null })
                              setCanvasSelectionOpen(false)
                              setFieldFormOpen(true)
                              setHighlightRect(null)
                            }}
                          >
                            <Type size={14} />
                            完整编辑
                          </Button>
                        </div>

                        {relatedQuickActions.length > 0 ? (
                          <div className="rounded-md border border-[#E5DED4] bg-white p-2">
                            <p className="text-[11px] font-semibold text-[#8A8580]">同一内容</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {relatedQuickActions.map((action) => (
                                <button
                                  key={`${action.itemId ?? 'module'}-${action.field}`}
                                  type="button"
                                  className="rounded border border-[#D8E7E8] bg-[#F7FAFA] px-2 py-1 text-[11px] font-semibold text-[#2C2A28] transition hover:border-[#1889B6] hover:text-[#1889B6]"
                                  onClick={() => selectQuickFieldAction(action)}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {inlineExternalTarget ? (
                    <div
                      id="visual-inline-external-editor"
                      data-visual-edit-url={inlineExternalTarget.href}
                      data-field={inlineExternalTarget.field}
                      className="pointer-events-auto absolute rounded-md border border-[#1889B6]/40 bg-white p-3 text-left shadow-[0_16px_40px_rgba(36,31,27,0.18)]"
                      style={{
                        top: inlineEditorTop,
                        left: inlineEditorLeft,
                        width: inlineEditorWidth,
                        zIndex: 120,
                      }}
                      onPointerDown={stopCanvasEditorEvent}
                      onMouseDown={stopCanvasEditorEvent}
                      onClick={stopCanvasEditorEvent}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#1889B6]">正在编辑</p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#1E2C31]">{externalSelectedFieldLabel}</p>
                          <p className="mt-0.5 truncate text-[11px] text-[#61767D]">{externalSelectedTitle}</p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 shrink-0"
                          aria-label="关闭"
                          onClick={clearCanvasEditorSelection}
                        >
                          <X size={13} />
                        </Button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {externalCanSave ? (
                          <>
                            {inlineExternalTarget.input === 'image' ? (
                              <div className="space-y-2">
                                <PageModuleImagePicker
                                  value={externalDraftValue}
                                  maxUploadMb={6}
                                  commitLabel="保存内容"
                                  onChange={patchExternalDraftValue}
                                />
                                <Input
                                  ref={setExternalInputElementRef}
                                  value={externalDraftValue}
                                  maxLength={inlineExternalTarget.maxLength ?? undefined}
                                  onChange={(event) => patchExternalDraftValue(event.target.value)}
                                  placeholder="图片 URL"
                                  className="h-9 bg-white text-sm"
                                />
                              </div>
                            ) : inlineExternalTarget.input === 'select' && inlineExternalTarget.selectOptions.length > 0 ? (
                              <select
                                ref={setExternalSelectElementRef}
                                value={externalDraftValue}
                                onChange={(event) => patchExternalDraftValue(event.target.value)}
                                className="h-9 w-full rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] outline-none transition focus:border-[#1889B6] focus:ring-2 focus:ring-[#1889B6]/15"
                              >
                                {inlineExternalTarget.selectOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : inlineExternalTarget.input === 'textarea' ? (
                              <Textarea
                                ref={setExternalTextareaElementRef}
                                value={externalDraftValue}
                                maxLength={inlineExternalTarget.maxLength ?? undefined}
                                onChange={(event) => patchExternalDraftValue(event.target.value)}
                                placeholder={externalSelectedFieldLabel}
                                className="min-h-[104px] resize-y bg-white text-sm"
                              />
                            ) : (
                              <Input
                                ref={setExternalInputElementRef}
                                type={inlineExternalTarget.input === 'number' ? 'number' : 'text'}
                                value={externalDraftValue}
                                maxLength={inlineExternalTarget.maxLength ?? undefined}
                                onChange={(event) => patchExternalDraftValue(event.target.value)}
                                placeholder={externalSelectedFieldLabel}
                                className="h-9 bg-white text-sm"
                              />
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-2">
                              <span className="text-[11px] font-semibold text-[#61767D]">
                                {inlineExternalTarget.maxLength
                                  ? `${externalDraftValue.length}/${inlineExternalTarget.maxLength}`
                                  : inlineExternalTarget.input === 'image'
                                    ? '图片'
                                    : inlineExternalTarget.input === 'select'
                                      ? `${inlineExternalTarget.selectOptions.length} 个选项`
                                      : inlineExternalTarget.input === 'number'
                                        ? '数字'
                                        : '文本'}
                              </span>
                              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                externalHasUnsavedChanges ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {externalHasUnsavedChanges ? '未保存' : '已同步'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={externalSaving || !externalHasUnsavedChanges}
                                onClick={saveExternalEditTarget}
                              >
                                <Save size={14} />
                                {externalSaving ? '保存中' : '保存内容'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={externalSaving || !externalHasUnsavedChanges}
                                onClick={resetExternalDraftValue}
                              >
                                <RotateCcw size={14} />
                                撤销
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-md border border-[#F1D0BD] bg-[#FFF8F3] px-2.5 py-2 text-xs leading-5 text-[#8A8580]">
                            请打开完整编辑。
                          </div>
                        )}

                        <Link
                          prefetch={false}
                          href={inlineExternalTarget.href}
                          className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
                        >
                          完整编辑
                        </Link>
                      </div>
                    </div>
                  ) : null}
                  {inlineSelectionActionsVisible ? (
                    <div
                      id="visual-inline-selection-actions"
                      className="pointer-events-auto absolute rounded-md border border-[#1889B6]/35 bg-white p-3 text-left shadow-[0_16px_40px_rgba(36,31,27,0.16)]"
                      style={{
                        top: inlineEditorTop,
                        left: inlineEditorLeft,
                        width: inlineEditorWidth,
                        zIndex: 120,
                      }}
                      onPointerDown={stopCanvasEditorEvent}
                      onMouseDown={stopCanvasEditorEvent}
                      onClick={stopCanvasEditorEvent}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#1889B6]">选择内容</p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#1E2C31]">{selectedFieldSummary}</p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 shrink-0"
                          aria-label="关闭"
                          onClick={clearCanvasEditorSelection}
                        >
                          <X size={13} />
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-1.5">
                        {selectionQuickActions.map((action) => {
                          const Icon = action.Icon
                          return (
                            <button
                              key={action.key}
                              type="button"
                              data-quick-action-field={action.field}
                              data-quick-action-item-id={action.itemId ?? ''}
                              onClick={() => selectQuickFieldAction(action)}
                              className="flex min-h-10 w-full items-center gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-2 text-left transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#EAF5F7] text-[#1889B6]">
                                <Icon size={14} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-[#1E2C31]">{fieldLabel(action.field)}</span>
                                <span className="mt-0.5 block truncate text-[11px] text-[#61767D]">{action.subject}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => {
                          setSelectedField({ itemId: null, field: null })
                          setCanvasSelectionOpen(false)
                          setFieldFormOpen(true)
                          setHighlightRect(null)
                        }}
                      >
                        <Type size={14} />
                        完整编辑
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </main>

        {editorPanelVisible ? (
        <aside className={`${editorPanelClass} ${editorPanelGridClass}`}>
          <div className="flex items-start justify-between gap-3 border-b border-[#E5DED4] px-4 py-3">
            <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2C2A28]">编辑内容</p>
            <p className="mt-1 truncate text-xs text-[#8A8580]">
              {hasFocusedCanvasEditor ? selectedFieldSummary : readableModuleTitle(active)}
            </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              aria-label="关闭编辑面板"
              title="关闭编辑面板"
              onClick={() => {
                if (externalHasUnsavedChanges) {
                  clearCanvasEditorSelection()
                  return
                }
                clearCanvasEditorSelection()
                setFieldFormOpen(false)
              }}
            >
              <X size={14} />
            </Button>
          </div>

          <div className="p-4">
            <div className="flex flex-col gap-4">
              {!externalEditTarget && !quickSelectedField ? (
                <div className="order-2 rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[#6B625B]">
                      {activeHasUnsavedChanges ? '未保存' : activeHasSavedDraft ? '待发布' : '已上线'}
                    </p>
                    {activePreflightIssues.length > 0 ? (
                      <span className="rounded-full bg-[#FFF2E7] px-2 py-1 text-[11px] font-semibold text-[#B54318]">
                        {activePreflightIssues.length} 项提醒
                      </span>
                    ) : null}
                  </div>
                  {!active.is_visible ? (
                    <div className="mt-3 rounded-md border border-[#F1D0BD] bg-white p-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#B54318]">前台隐藏</p>
                          <p className="mt-1 text-[11px] text-[#8A8580]">
                            {activeIsStructureManagedTemplate ? '由页面布局控制' : '恢复后保存草稿'}
                          </p>
                        </div>
                        {!activeIsStructureManagedTemplate ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              patchActive({ is_visible: true })
                              toast.message('已恢复显示，保存草稿后再预览发布')
                            }}
                          >
                            <Eye size={14} />
                            恢复显示
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                      type="button"
                      size="sm"
                      disabled={!activeHasUnsavedChanges || saving}
                      onClick={() => void saveActiveModuleRef.current?.()}
                    >
                      <Save size={14} />
                      {saving ? '保存中' : '保存草稿'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!activeHasUnsavedChanges || saving}
                      onClick={discardActiveChanges}
                    >
                      <RotateCcw size={14} />
                      撤销
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!activeHasSavedDraft || activeHasUnsavedChanges || publishing || activeIsDraftAdded}
                      onClick={requestPublish}
                      title={
                        activeIsDraftAdded
                          ? '新增模块必须通过排序/新增发布'
                          : activeHasUnsavedChanges
                            ? '请先保存'
                            : '发布到前台'
                      }
                    >
                      <ArrowUpRight size={14} />
                      {publishing ? '发布中' : '发布'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!activeHasSavedDraft || activeHasUnsavedChanges || discardingDraft}
                      onClick={() => setDiscardDraftConfirmOpen(true)}
                      title={activeHasUnsavedChanges ? '请先撤销或保存当前未保存修改' : '丢弃已保存草稿'}
                    >
                      <RotateCcw size={14} />
                      丢弃
                    </Button>
                  </div>
                  <p className="mt-2 truncate text-[11px] text-[#8A8580]">
                    {activeHasSavedDraft
                      ? `草稿：${activeDraftUpdatedAt ?? '未知'}`
                      : `线上：${activeLiveUpdatedAt ?? '未知'}`}
                  </p>
                </div>
              ) : null}

              {externalEditTarget && !inlineExternalEditorVisible ? (
                <div
                  id="visual-external-edit-target"
                  data-visual-edit-url={externalEditTarget.href}
                  className="order-0 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#1889B6]">编辑内容</p>
                      <p className="mt-1 text-base font-semibold text-[#1E2C31]">{externalSelectedFieldLabel}</p>
                      <p className="mt-1 truncate text-xs text-[#61767D]">
                        {externalSelectedTitle}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                        externalCanSave ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#B54318]'
                      }`}>
                        {externalCanSave ? '可直接保存' : '打开完整编辑'}
                      </span>
                      {!externalCanSave && externalEditTarget.text ? (
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#61767D]">{externalEditTarget.text}</p>
                      ) : null}
                    </div>
                    <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-[#1889B6]" />
                  </div>
                  {externalCanSave ? (
                    <div className="mt-3 space-y-3">
                      {externalEditTarget.input === 'image' ? (
                        <div className="space-y-2">
                          <PageModuleImagePicker
                            value={externalDraftValue}
                            maxUploadMb={6}
                            commitLabel="保存内容"
                            onChange={patchExternalDraftValue}
                          />
                          <Input
                            ref={setExternalInputElementRef}
                            value={externalDraftValue}
                            maxLength={externalEditTarget.maxLength ?? undefined}
                            onChange={(event) => patchExternalDraftValue(event.target.value)}
                            placeholder={externalSelectedFieldLabel}
                            className="bg-white text-sm"
                          />
                        </div>
                      ) : externalEditTarget.input === 'select' && externalEditTarget.selectOptions.length > 0 ? (
                        <select
                          ref={setExternalSelectElementRef}
                          value={externalDraftValue}
                          onChange={(event) => patchExternalDraftValue(event.target.value)}
                          className="h-10 w-full rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] outline-none transition focus:border-[#1889B6] focus:ring-2 focus:ring-[#1889B6]/15"
                        >
                          {externalEditTarget.selectOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : externalEditTarget.input === 'textarea' ? (
                        <Textarea
                          ref={setExternalTextareaElementRef}
                          value={externalDraftValue}
                          maxLength={externalEditTarget.maxLength ?? undefined}
                          onChange={(event) => patchExternalDraftValue(event.target.value)}
                          placeholder={externalSelectedFieldLabel}
                          className="min-h-[120px] bg-white text-sm"
                        />
                      ) : (
                        <Input
                          ref={setExternalInputElementRef}
                          type={externalEditTarget.input === 'number' ? 'number' : 'text'}
                          value={externalDraftValue}
                          maxLength={externalEditTarget.maxLength ?? undefined}
                          onChange={(event) => patchExternalDraftValue(event.target.value)}
                          placeholder={externalSelectedFieldLabel}
                          className="bg-white text-sm"
                        />
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] leading-4 text-[#8A8580]">
                          {externalEditTarget.maxLength
                            ? `${externalDraftValue.length}/${externalEditTarget.maxLength}`
                            : externalEditTarget.input === 'image'
                              ? '图片地址'
                              : externalEditTarget.input === 'select'
                                ? `${externalEditTarget.selectOptions.length} 个选项`
                              : '当前内容'}
                        </p>
                        {externalHasUnsavedChanges ? (
                          <span className="rounded-full bg-[#FFF2E7] px-2 py-1 text-[11px] font-semibold text-[#E36F2C]">
                            未保存
                          </span>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={externalSaving || !externalHasUnsavedChanges}
                          onClick={saveExternalEditTarget}
                        >
                          <Save size={14} />
                          {externalSaving ? '保存中' : '保存内容'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={externalSaving || !externalHasUnsavedChanges}
                          onClick={resetExternalDraftValue}
                        >
                          <RotateCcw size={14} />
                          撤销
                        </Button>
                      </div>
                      <Link
                        prefetch={false}
                        href={externalEditTarget.href}
                        className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
                      >
                        完整编辑
                      </Link>
                    </div>
                  ) : (
                    <Link
                      prefetch={false}
                      href={externalEditTarget.href}
                      className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-md border border-[#1889B6] bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#0F6F95]"
                    >
                      完整编辑
                    </Link>
                  )}
                </div>
              ) : null}

              {quickSelectedField && !inlineQuickEditorVisible ? (
                <div
                  id="visual-quick-field-editor"
                  className="order-0 rounded-md border border-[#E36F2C]/40 bg-[#FFF8F3] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#E36F2C]">编辑内容</p>
                      <p className="mt-1 text-base font-semibold text-[#2C2A28]">{quickSelectedFieldLabel}</p>
                      <p className="mt-1 truncate text-xs text-[#8A8580]">{quickSelectedSubject}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                        variant="outline"
                        onClick={clearCanvasEditorSelection}
                    >
                      关闭
                    </Button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {quickSelectedField.input === 'image' ? (
                      <div>
                        <PageModuleImagePicker
                          value={quickSelectedField.value}
                          maxUploadMb={maxUploadMb}
                          onChange={patchQuickSelectedField}
                        />
                          <Input
                            ref={setQuickInputElementRef}
                            value={quickSelectedField.value}
                            onChange={(event) => patchQuickSelectedField(event.target.value)}
                            placeholder="图片 URL"
                          className="mt-2 bg-white"
                        />
                      </div>
                    ) : quickSelectedField.input === 'textarea' ? (
                      <Textarea
                        ref={setQuickTextareaElementRef}
                        value={quickSelectedField.value}
                        onChange={(event) => patchQuickSelectedField(event.target.value)}
                        placeholder={quickSelectedFieldLabel}
                        className="min-h-[112px] bg-white text-sm"
                      />
                    ) : (
                      <Input
                        ref={setQuickInputElementRef}
                        value={quickSelectedField.value}
                        onChange={(event) => patchQuickSelectedField(event.target.value)}
                        placeholder={quickSelectedFieldLabel}
                        className="bg-white text-sm"
                      />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#F1D0BD] bg-white px-2.5 py-2">
                      <span className="text-[11px] font-semibold text-[#8A8580]">
                        {quickSelectedField.input === 'textarea'
                          ? `${quickSelectedField.value.length} 字`
                          : quickSelectedField.input === 'image'
                            ? '图片地址'
                            : '当前内容'}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        activeHasUnsavedChanges ? 'bg-[#FFF2E7] text-[#E36F2C]' : activeHasSavedDraft ? 'bg-[#FFF2E7] text-[#B54318]' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {activeHasUnsavedChanges ? '未保存' : activeHasSavedDraft ? '待发布' : '已同步'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!activeHasUnsavedChanges || saving}
                        onClick={() => void saveActiveModuleRef.current?.()}
                      >
                        <Save size={14} />
                        {saving ? '保存中' : '保存草稿'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!activeHasSavedDraft || activeHasUnsavedChanges || publishing || activeIsDraftAdded}
                        onClick={requestPublish}
                        title={
                          activeIsDraftAdded
                            ? '新增模块必须通过排序/新增发布'
                            : activeHasUnsavedChanges
                              ? '请先保存'
                              : '发布到前台'
                        }
                      >
                        <ArrowUpRight size={14} />
                        {publishing ? '发布中' : '发布'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!activeHasUnsavedChanges || saving}
                        onClick={discardActiveChanges}
                      >
                        <RotateCcw size={14} />
                        撤销
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!activeHasSavedDraft || activeHasUnsavedChanges || discardingDraft}
                        onClick={() => setDiscardDraftConfirmOpen(true)}
                        title={activeHasUnsavedChanges ? '请先保存或撤销当前修改' : '丢弃已保存草稿'}
                      >
                        <RotateCcw size={14} />
                        丢弃草稿
                      </Button>
                    </div>

                    {relatedQuickActions.length > 0 ? (
                      <div className="rounded-md border border-[#E5DED4] bg-white p-2">
                        <p className="text-[11px] font-semibold text-[#8A8580]">同一条内容</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {relatedQuickActions.map((action) => {
                            const Icon = action.Icon
                            return (
                              <button
                                key={action.key}
                                type="button"
                                onClick={() => selectQuickFieldAction(action)}
                                className="flex min-h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2 py-1.5 text-left transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
                              >
                                <Icon size={13} className="shrink-0 text-[#1889B6]" />
                                <span className="min-w-0">
                                  <span className="block truncate text-[11px] font-semibold text-[#1E2C31]">
                                    {fieldLabel(action.field)}
                                  </span>
                                  <span className="block truncate text-[10px] text-[#8A8580]">
                                    {action.subject}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {!externalEditTarget && !quickSelectedField && selectionQuickActions.length > 0 ? (
                <div
                  id="visual-selection-actions"
                  className="order-0 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#1889B6]">选择要改的内容</p>
                      <p className="mt-1 text-sm font-semibold text-[#1E2C31]">{selectedFieldSummary}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={clearCanvasEditorSelection}
                    >
                      取消选择
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {selectionQuickActions.map((action) => {
                      const Icon = action.Icon
                      return (
                        <button
                          key={action.key}
                          type="button"
                          data-quick-action-field={action.field}
                          data-quick-action-item-id={action.itemId ?? ''}
                          aria-label={`编辑${action.label}`}
                          onClick={() => selectQuickFieldAction(action)}
                          className="flex min-h-11 w-full items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 py-2 text-left transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#EAF5F7] text-[#1889B6]">
                            <Icon size={14} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-[#1E2C31]">{fieldLabel(action.field)}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-[#61767D]">
                              {action.subject}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {!hasFocusedCanvasEditor ? (
                <div className="order-1 space-y-3">
                  <div>
                    <p className="text-xs text-[#8A8580]">{pageLabel(active.page_key)} 页面</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#2C2A28]">{readableModuleTitle(active)}</h2>
                  </div>

                  {defaultQuickActions.length > 0 ? (
                    <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E2C31]">
                          <ListChecks size={15} className="text-[#1889B6]" />
                          常用内容
                        </p>
                        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#61767D]">
                          {defaultQuickActions.length} 项
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {defaultQuickActions.map((action) => {
                          const Icon = action.Icon
                          return (
                            <button
                              key={action.key}
                              type="button"
                              data-default-action-field={action.field}
                              data-default-action-item-id={action.itemId ?? ''}
                              aria-label={`编辑${action.label}`}
                              onClick={() => selectQuickFieldAction(action)}
                              className="flex min-h-10 w-full items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 py-2 text-left transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#EAF5F7] text-[#1889B6]">
                                <Icon size={14} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-[#1E2C31]">
                                  {fieldLabel(action.field)}
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-[#61767D]">
                                  {action.subject}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setCanvasSelectionOpen(true)
                      }}
                    >
                      <MousePointer2 size={14} />
                      画布点选
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFieldFormOpen((value) => !value)}
                    >
                      <Type size={14} />
                      {fieldFormOpen ? '收起面板' : '面板'}
                    </Button>
                  </div>

                  {activeIsDraftAdded ? (
                    <div className="rounded-md border border-[#F1D0BD] bg-[#FFF7F1] p-3">
                      <p className="text-xs font-semibold text-[#B54318]">新增模块</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        disabled={Boolean(structureBusy) || hasAnyUnsavedChanges}
                        onClick={() => deleteAddedStructureModule(active)}
                      >
                        <Trash2 size={14} />
                        删除新增模块
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!hasFocusedCanvasEditor && fieldFormOpen ? (
              <details className="order-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <summary className="mb-3 flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#2C2A28]">
                  <Type size={14} className="text-[#E36F2C]" />
                  <span>标题和说明</span>
                </summary>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div ref={bindModuleFieldRef('title_zh')} className={moduleFieldClassName('title_zh')}>
                    <div className="mb-2 text-xs font-medium text-[#8A8580]">中文标题</div>
                    <Input
                      value={active.title_zh}
                      onChange={(event) => patchActive({ title_zh: event.target.value })}
                      className="bg-white"
                    />
                  </div>
                  <div ref={bindModuleFieldRef('title_en')} className={moduleFieldClassName('title_en')}>
                    <div className="mb-2 text-xs font-medium text-[#8A8580]">英文标题</div>
                    <Input
                      value={active.title_en}
                      onChange={(event) => patchActive({ title_en: event.target.value })}
                      className="bg-white"
                    />
                  </div>
                  <div ref={bindModuleFieldRef('description_zh')} className={moduleFieldClassName('description_zh')}>
                    <div className="mb-2 text-xs font-medium text-[#8A8580]">中文副文案</div>
                    <Textarea
                      value={active.description_zh}
                      onChange={(event) => patchActive({ description_zh: event.target.value })}
                      className="min-h-[86px] bg-white"
                    />
                  </div>
                  <div ref={bindModuleFieldRef('description_en')} className={moduleFieldClassName('description_en')}>
                    <div className="mb-2 text-xs font-medium text-[#8A8580]">英文副文案</div>
                    <Textarea
                      value={active.description_en}
                      onChange={(event) => patchActive({ description_en: event.target.value })}
                      className="min-h-[86px] bg-white"
                    />
                  </div>
                </div>
              </details>
              ) : null}
              {!hasFocusedCanvasEditor && fieldFormOpen && activePreflightIssues.length > 0 ? (
              <details className="order-9 rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#2C2A28]">
                  <span>发布提醒</span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-[#6B625B]">
                    {activePreflightIssues.length} 项
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  {activePreflightIssues.slice(0, 6).map((issue, index) => (
                      <div
                        key={`${issue.label}-${index}`}
                        className="rounded-md border border-[#E5DED4] bg-white px-2 py-2 text-xs"
                      >
                        <p className={issue.severity === 'danger' ? 'font-medium text-[#B54318]' : 'font-medium text-[#2C2A28]'}>
                          {issue.label}
                        </p>
                        <p className="mt-1 text-[#8A8580]">{issue.detail}</p>
                      </div>
                    ))}
                  {activePreflightIssues.length > 6 ? (
                    <p className="text-xs text-[#8A8580]">还有 {activePreflightIssues.length - 6} 项未展示。</p>
                  ) : null}
                </div>
              </details>
              ) : null}

              {!hasFocusedCanvasEditor && fieldFormOpen && activeDraftChanges.length > 0 ? (
              <details className="order-8 rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#2C2A28]">
                  <span>改动记录</span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-[#6B625B]">
                    {activeDraftChanges.length} 项
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  {activeDraftChanges.slice(0, 8).map((change, index) => (
                      <div
                        key={`${change.label}-${index}`}
                        className="rounded-md border border-[#E5DED4] bg-white px-2 py-2 text-xs"
                      >
                        <p className={change.severity === 'high' ? 'font-medium text-[#B54318]' : 'font-medium text-[#2C2A28]'}>
                          {change.label}
                        </p>
                        <p className="mt-1 break-words text-[#8A8580]">{change.detail}</p>
                      </div>
                    ))}
                  {activeDraftChanges.length > 8 ? (
                    <p className="text-xs text-[#8A8580]">还有 {activeDraftChanges.length - 8} 项未展示。</p>
                  ) : null}
                </div>
              </details>
              ) : null}

              {!hasFocusedCanvasEditor && fieldFormOpen && activeHasUnsavedChanges ? (
                <div className="order-10 rounded-md border border-[#E36F2C]/40 bg-[#FFF8F3] p-3">
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

              {!hasFocusedCanvasEditor && fieldFormOpen ? (
              <details className="order-11 rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#2C2A28]">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={15} className="text-[#E36F2C]" />
                    历史版本
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-[#6B625B]">
                    {snapshots.length} 条
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  <Button type="button" size="sm" variant="outline" onClick={loadSnapshots} disabled={snapshotsLoading}>
                    <RefreshCcw size={14} />
                    刷新
                  </Button>
                  {snapshotsLoading ? (
                    <p className="text-xs text-[#8A8580]">正在读取历史版本...</p>
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
                              {summary.itemCount} 条内容 · {summary.hasImages ? '包含图片' : '无图片'}
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
                            恢复为草稿
                          </Button>
                        </div>
                      </div>
                    )
                    })
                  ) : (
                    <p className="text-xs leading-5 text-[#8A8580]">
                      暂无历史版本。第一次发布草稿后，这里会出现发布前的线上版本。
                    </p>
                  )}
                </div>
              </details>
              ) : null}

              {(selectedField.itemId || selectedField.field) && !quickSelectedField && selectionQuickActions.length === 0 ? (
                <div className="order-2 rounded-md border border-[#E36F2C]/35 bg-[#FFF8F3] p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2C2A28]">
                    <MousePointer2 size={14} className="text-[#E36F2C]" />
                    <span>画布已选中</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#2C2A28]">{selectedFieldSummary}</p>
                </div>
              ) : null}

              {!hasFocusedCanvasEditor && fieldFormOpen ? (
              <div className="order-5 flex items-center justify-between gap-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[#2C2A28]">前台显示</p>
                  <p className="mt-1 text-xs text-[#8A8580]">保存并发布后生效。</p>
                </div>
                <Switch
                  checked={active.is_visible}
                  disabled={activeIsStructureManagedTemplate}
                  onCheckedChange={(checked) => patchActive({ is_visible: checked })}
                />
              </div>
              ) : null}
              {!hasFocusedCanvasEditor && fieldFormOpen && activeIsStructureManagedTemplate ? (
                <p className="order-6 text-xs leading-5 text-[#E36F2C]">
                  显示状态由页面布局控制。
                </p>
              ) : null}

              {!hasFocusedCanvasEditor && fieldFormOpen ? (
              <details className="order-4 space-y-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
                <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-semibold text-[#2C2A28]">条目内容</span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#6B625B]">
                    {activeItems.length} 条
                  </span>
                </summary>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  {!canManageRepeatedItems ? (
                    <span className="text-xs text-[#8A8580]">固定内容</span>
                  ) : <span />}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canManageRepeatedItems || active.items.length >= 80}
                    onClick={addItem}
                    title={canManageRepeatedItems ? '新增内容' : '固定内容不可新增'}
                  >
                    <Plus size={14} />
                    新增内容
                  </Button>
                </div>

                {activeItems.map((item, itemIndex) => {
                  const showImage = isImageItem(active, item)
                  const showVideo = isVideoItem(active, item)
                  const showLink = isLinkItem(active, item)
                  const showValue = showValueFields(active, item)
                  const showContent = showContentFields(active, item)
                  const firstItem = itemIndex === 0
                  const lastItem = itemIndex === activeItems.length - 1
                  return (
                    <div key={item.id} className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#2C2A28]">{readableItemTitle(item)}</p>
                          <p className="mt-1 truncate text-xs text-[#8A8580]">
                            {item.is_visible ? '显示中' : '已隐藏'}
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
                            title={canManageRepeatedItems ? '隐藏项目' : '固定内容不可隐藏'}
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
              </details>
              ) : null}
            </div>
          </div>
          </aside>
        ) : null}
        </div>
      </div>

      {activeHasUnsavedChanges ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E5DED4] bg-[#FFFFFF]/95 px-6 py-3 shadow-[0_-8px_24px_rgba(44,42,40,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-semibold text-[#2C2A28]">未保存修改：{readableModuleTitle(active)}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={saving} onClick={discardActiveChanges}>
                <RotateCcw size={15} />
                撤销
              </Button>
              <Button type="button" disabled={saving} onClick={() => void saveActiveModuleRef.current?.()}>
                <Save size={15} />
                {saving ? '保存中...' : '保存草稿'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
        title="发布当前修改？"
        description={
          <div className="space-y-3 text-left">
            <p>
              发布后 <strong>{active.title_zh}</strong> 会立即上线。发布前会自动保留当前版本。
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
                <p className="font-medium text-[#B54318]">发布前提醒：</p>
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
        title="丢弃当前草稿？"
        description={
          <span>
            将丢弃 <strong>{active.title_zh}</strong> 当前已保存草稿，并回到线上版本。前台不变。
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
            这只会先成为当前模块的未保存修改。将隐藏第{' '}
            <strong>{activeItemToDeleteIndex >= 0 ? activeItemToDeleteIndex + 1 : '-'}</strong> 个项目，
            当前文字为 <strong>{activeItemToDeleteSummary?.label ?? '-'}</strong>
            {activeItemToDeleteSummary?.value ? <>，值/正文为 <strong>{activeItemToDeleteSummary.value}</strong></> : null}。
            保存后先进入预览，发布后才会从前台隐藏，可通过显示开关恢复。
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
            将恢复 <strong>{restoreSnapshotSummary?.title ?? '这个版本'}</strong>，
            共 <strong>{restoreSnapshotSummary?.itemCount ?? '-'}</strong> 个项目，
            {restoreSnapshotSummary?.hasImages ? '包含图片，' : '不包含图片，'}
            保存时间 <strong>{restoreSnapshotSummary?.savedAt ?? '-'}</strong>，
            操作人 <strong>{restoreSnapshotSummary?.operator ?? '-'}</strong>。
            恢复后只覆盖当前草稿。确认无误后再发布。
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
        title="发布页面布局？"
        description={
          <div className="space-y-2 text-left">
            <p>
              发布后 <strong>{currentPage.label}</strong> 的页面布局会立即影响前台。系统会先保存页面版本，再一次性更新线上页面。
            </p>
            <p>
              当前草稿包含 <strong>{currentStructureDraft?.summary.moduleCount ?? 0}</strong> 个模块，
              <strong>{currentStructureDraft?.image_refs.length ?? 0}</strong> 个图片引用。
            </p>
            <p className="text-[#B54318]">请由管理员完成发布；编辑人员先完成预览和内容核对。</p>
          </div>
        }
        confirmLabel="确认发布顺序"
        tone="warning"
        loading={structureBusy === `publish:${selectedPage}`}
        onConfirm={publishStructureDraft}
      />

      <AdminConfirmDialog
        open={structureDiscardConfirmOpen}
        onOpenChange={setStructureDiscardConfirmOpen}
        title="放弃页面布局调整？"
        description={
          <span>
            将放弃 <strong>{currentPage.label}</strong> 当前未发布的页面布局调整，并让预览回到线上版本。前台不变。
          </span>
        }
        confirmLabel="确认放弃"
        tone="danger"
        loading={structureBusy === `discard:${selectedPage}`}
        onConfirm={discardStructureDraft}
      />

      <AdminConfirmDialog
        open={Boolean(structureRestoreSnapshot)}
        onOpenChange={(open) => {
          if (!open && !structureBusy?.startsWith('restore:')) setStructureRestoreSnapshot(null)
        }}
        title="恢复页面版本到当前调整？"
        description={
          <span>
            将恢复 <strong>{currentPage.label}</strong> 的页面版本，
            共 <strong>{currentStructureRestoreSummary?.moduleCount ?? '-'}</strong> 个模块，
            <strong>{currentStructureRestoreSummary?.imageCount ?? '-'}</strong> 个图片引用；
            保存时间 <strong>{currentStructureRestoreSummary?.savedAt ?? '-'}</strong>，
            操作人 <strong>{currentStructureRestoreSummary?.operator ?? '-'}</strong>。
            恢复后只会成为当前调整，不会立即影响前台。
          </span>
        }
        confirmLabel="恢复到当前调整"
        tone="danger"
        loading={structureBusy === `restore:${selectedPage}`}
        onConfirm={restoreStructureSnapshotToDraft}
      />
    </div>
  )
}
