'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  ImageIcon,
  Link2,
  LocateFixed,
  MousePointer2,
  RefreshCcw,
  RotateCcw,
  Save,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import PageModuleImagePicker from '@/components/admin/PageModuleImagePicker'
import { useUnsavedChangesWarning } from '@/components/admin/useUnsavedChangesWarning'
import type { PageModuleItem, PageModuleRow } from '@/lib/page-modules-db'

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

const PAGES: PageMeta[] = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'about', label: 'About', path: '/about' },
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

function moduleId(pageModule: Pick<PageModuleRow, 'page_key' | 'module_key'>) {
  return `${pageModule.page_key}:${pageModule.module_key}`
}

function isPageKey(value: string): value is PageKey {
  return value === 'home' || value === 'about'
}

function pageLabel(pageKey: string) {
  return isPageKey(pageKey) ? PAGE_LABELS[pageKey] : pageKey
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
  }
}

function comparableModule(pageModule: PageModuleRow) {
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
    .filter((pageModule) => EDITABLE_MODULE_ID_SET.has(moduleId(pageModule)))
    .sort((a, b) => EDITABLE_MODULE_IDS.indexOf(moduleId(a)) - EDITABLE_MODULE_IDS.indexOf(moduleId(b)))
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
  if (!version) return path
  const joiner = path.includes('?') ? '&' : '?'
  return `${path}${joiner}visualPreview=${version}`
}

export default function PageVisualEditorClient({
  initialModules,
  maxUploadMb = 20,
}: {
  initialModules: PageModuleRow[]
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
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const currentPage = PAGES.find((page) => page.key === selectedPage) ?? PAGES[0]
  const currentModules = useMemo(
    () => modules.filter((pageModule) => pageModule.page_key === selectedPage),
    [modules, selectedPage],
  )
  const active = currentModules.find((pageModule) => moduleId(pageModule) === selectedModuleId) ?? currentModules[0]
  const activeModuleId = active ? moduleId(active) : ''
  const selectedLocated = active ? locatedModules[activeModuleId] === true : false
  const formEditorHref = active ? `/admin/pages?module=${activeModuleId}` : '/admin/pages'
  const previewSrc = useMemo(() => buildPreviewSrc(currentPage.path, previewVersion), [currentPage.path, previewVersion])

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

  useUnsavedChangesWarning(
    hasAnyUnsavedChanges,
    '可视化编辑器有未保存修改。离开此页会丢失这些修改，确定离开吗？',
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
      toast.message('当前模块没有未保存修改')
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
    toast.message('已撤销当前模块的未保存修改')
  }

  const saveActiveModule = async () => {
    if (!active) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/page-modules/${active.page_key}/${active.module_key}`, {
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
      toast.success('当前模块已保存，前台会立即使用最新内容')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
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
            不支持新增、删除、排序模块，也不能自由修改样式或布局。保存后会立即影响前台页面。
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
            {hasAnyUnsavedChanges ? `${dirtyIds.size} 个模块有未保存修改` : '当前没有未保存修改'}
          </p>
        </div>
      </div>

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
              <span>{currentPage.label} 真实前台预览</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8A8580]">{currentPage.path}</span>
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

          <div className="relative h-[720px] overflow-hidden bg-[#241F1B]">
            <iframe
              key={`${selectedPage}-${previewVersion}`}
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
                <h2 className="mt-1 text-lg font-semibold text-[#2C2A28]">{active.title_zh}</h2>
                <p className="mt-2 text-sm leading-6 text-[#8A8580]">{active.description_zh}</p>
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
                  <p className="mt-1 text-xs text-[#8A8580]">关闭后保存，前台会隐藏整个模块。</p>
                </div>
                <Switch checked={active.is_visible} onCheckedChange={(checked) => patchActive({ is_visible: checked })} />
              </div>

              <div className="space-y-3">
                {active.items.map((item) => {
                  const showImage = isImageItem(active, item)
                  const showLink = isLinkItem(item)
                  const showValue = showValueFields(active, item)
                  const showContent = showContentFields(item)
                  return (
                    <div key={item.id} className="rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs text-[#6B625B]">{item.id}</p>
                          <p className="mt-1 truncate text-xs text-[#8A8580]">
                            {item.is_visible ? '字段当前参与前台渲染' : '字段当前隐藏，visual 暂不开放单项显示开关'}
                          </p>
                        </div>
                        {item.is_visible ? (
                          <Eye size={15} className="shrink-0 text-[#E36F2C]" />
                        ) : (
                          <EyeOff size={15} className="shrink-0 text-[#8A8580]" />
                        )}
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
                去表单编辑器打开
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {activeHasUnsavedChanges ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E5DED4] bg-[#FFFFFF]/95 px-6 py-4 shadow-[0_-8px_24px_rgba(44,42,40,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2C2A28]">当前模块有未保存修改</p>
              <p className="mt-1 text-xs text-[#8A8580]">
                保存前会再次确认。确认保存后，当前模块内容会立即影响前台页面。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={saving} onClick={discardActiveChanges}>
                <RotateCcw size={15} />
                撤销当前模块修改
              </Button>
              <Button type="button" disabled={saving} onClick={requestSave}>
                <Save size={15} />
                {saving ? '保存中...' : '保存当前模块'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认保存当前模块？"
        description={
          <span>
            保存后会立即影响前台页面。当前只会保存 <strong>{active.title_zh}</strong> 这个模块，
            不会新增、删除或排序模块。
          </span>
        }
        confirmLabel="确认保存"
        tone="warning"
        loading={saving}
        onConfirm={saveActiveModule}
      />
    </div>
  )
}
