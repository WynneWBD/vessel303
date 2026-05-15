'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Eye,
  LocateFixed,
  MousePointer2,
} from 'lucide-react'

type PageKey = 'home' | 'about'

type PageMeta = {
  key: PageKey
  label: string
  path: string
}

type ModuleDefinition = {
  id: string
  pageKey: PageKey
  moduleKey: string
  name: string
  description: string
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

const MODULES: ModuleDefinition[] = [
  {
    id: 'home:hero',
    pageKey: 'home',
    moduleKey: 'hero',
    name: '首页首屏',
    description: '首页首屏标题、说明、轮播图和按钮。',
  },
  {
    id: 'home:credentials',
    pageKey: 'home',
    moduleKey: 'credentials',
    name: '首页数据区',
    description: '首页首屏下方核心数据。',
  },
  {
    id: 'about:hero',
    pageKey: 'about',
    moduleKey: 'hero',
    name: '关于我们 · 首屏',
    description: 'About 首屏标题、说明和背景图。',
  },
  {
    id: 'about:stats',
    pageKey: 'about',
    moduleKey: 'stats',
    name: '关于我们 · 数据条',
    description: 'About 首屏下方核心数据。',
  },
  {
    id: 'about:brand-story',
    pageKey: 'about',
    moduleKey: 'brand-story',
    name: '关于我们 · 品牌故事',
    description: 'About 品牌故事区。',
  },
  {
    id: 'about:factory',
    pageKey: 'about',
    moduleKey: 'factory',
    name: '关于我们 · 智造实力',
    description: 'About 工厂标题、说明和图片。',
  },
  {
    id: 'about:timeline',
    pageKey: 'about',
    moduleKey: 'timeline',
    name: '关于我们 · 品牌历程',
    description: 'About 时间线展示。',
  },
  {
    id: 'about:technologies',
    pageKey: 'about',
    moduleKey: 'technologies',
    name: '关于我们 · 三大技术',
    description: 'About 三大技术体系。',
  },
  {
    id: 'about:founder',
    pageKey: 'about',
    moduleKey: 'founder',
    name: '关于我们 · 创始人',
    description: 'About 创始人和团队信息。',
  },
  {
    id: 'about:services',
    pageKey: 'about',
    moduleKey: 'services',
    name: '关于我们 · 服务体系',
    description: 'About 三大服务体系。',
  },
  {
    id: 'about:partners',
    pageKey: 'about',
    moduleKey: 'partners',
    name: '关于我们 · 合作伙伴',
    description: 'About 合作伙伴 logo 展示。',
  },
  {
    id: 'about:recognition-awards',
    pageKey: 'about',
    moduleKey: 'recognition-awards',
    name: '关于我们 · 认证荣誉',
    description: 'About 奖项荣誉图片列表。',
  },
]

function moduleSelector(moduleId: string) {
  return `[data-page-module="${moduleId}"]`
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

export default function PageVisualEditorClient() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [selectedPage, setSelectedPage] = useState<PageKey>('home')
  const [selectedModuleId, setSelectedModuleId] = useState('home:hero')
  const [selectedField, setSelectedField] = useState<FieldSelection>({ itemId: null, field: null })
  const [locatedModules, setLocatedModules] = useState<Record<string, boolean>>({})
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [frameVersion, setFrameVersion] = useState(0)

  const currentPage = PAGES.find((page) => page.key === selectedPage) ?? PAGES[0]
  const currentModules = useMemo(
    () => MODULES.filter((pageModule) => pageModule.pageKey === selectedPage),
    [selectedPage],
  )
  const selectedModule = currentModules.find((pageModule) => pageModule.id === selectedModuleId) ?? currentModules[0]
  const selectedLocated = selectedModule ? locatedModules[selectedModule.id] === true : false
  const formEditorHref = selectedModule ? `/admin/pages?module=${selectedModule.id}` : '/admin/pages'

  const updateLocatedModules = useCallback(() => {
    const doc = getIframeDocument(iframeRef.current)
    if (!doc) return

    const next = currentModules.reduce<Record<string, boolean>>((acc, pageModule) => {
      acc[pageModule.id] = Boolean(doc.querySelector(moduleSelector(pageModule.id)))
      return acc
    }, {})

    setLocatedModules((prev) => (sameRecord(prev, next) ? prev : next))
  }, [currentModules])

  const updateHighlight = useCallback(() => {
    const iframe = iframeRef.current
    const doc = getIframeDocument(iframe)
    if (!iframe || !doc || !selectedModule) {
      setHighlightRect(null)
      return
    }

    const target = doc.querySelector<HTMLElement>(moduleSelector(selectedModule.id))
    if (!target) {
      setHighlightRect(null)
      return
    }

    const rect = target.getBoundingClientRect()
    const next = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    }

    setHighlightRect(next)
  }, [selectedModule])

  const refreshFrameState = useCallback(() => {
    updateLocatedModules()
    updateHighlight()
  }, [updateHighlight, updateLocatedModules])

  const scrollModuleIntoView = useCallback((moduleId: string) => {
    const doc = getIframeDocument(iframeRef.current)
    const target = doc?.querySelector<HTMLElement>(moduleSelector(moduleId))
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(refreshFrameState, 350)
  }, [refreshFrameState])

  const handleSelectModule = (pageModule: ModuleDefinition) => {
    setSelectedModuleId(pageModule.id)
    setSelectedField({ itemId: null, field: null })
    scrollModuleIntoView(pageModule.id)
    window.setTimeout(refreshFrameState, 0)
  }

  const handleSelectPage = (pageKey: PageKey) => {
    const nextModule = MODULES.find((pageModule) => pageModule.pageKey === pageKey)
    if (!nextModule) return

    setSelectedPage(pageKey)
    setSelectedModuleId(nextModule.id)
    setSelectedField({ itemId: null, field: null })
    setLocatedModules({})
    setHighlightRect(null)
    setFrameLoaded(false)
  }

  useEffect(() => {
    if (!frameLoaded) return

    const iframe = iframeRef.current
    const doc = getIframeDocument(iframe)
    const frameWindow = iframe?.contentWindow ?? null
    if (!doc || !frameWindow) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const moduleEl = target.closest<HTMLElement>('[data-page-module]')
      if (!moduleEl) return

      const moduleId = moduleEl.dataset.pageModule
      const pageModule = MODULES.find((item) => item.id === moduleId)
      if (!moduleId || !pageModule || pageModule.pageKey !== selectedPage) return

      event.preventDefault()
      event.stopPropagation()

      const itemEl = target.closest<HTMLElement>('[data-page-module-item]')
      setSelectedModuleId(moduleId)
      setSelectedField({
        itemId: itemEl?.dataset.pageModuleItem ?? null,
        field: itemEl?.dataset.pageModuleField ?? null,
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
  }, [frameLoaded, frameVersion, refreshFrameState, selectedPage])

  useEffect(() => {
    if (!frameLoaded) return

    const frame = window.requestAnimationFrame(refreshFrameState)
    return () => window.cancelAnimationFrame(frame)
  }, [frameLoaded, refreshFrameState, selectedModuleId])

  const handleFrameLoad = () => {
    setFrameLoaded(true)
    setFrameVersion((value) => value + 1)
    window.setTimeout(refreshFrameState, 0)
    window.setTimeout(refreshFrameState, 600)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#E36F2C] uppercase">
            Visual Preview
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#2C2A28]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            页面可视化预览
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8A8580]">
            只读预览，不会保存任何修改。当前只定位 Home 和 About 已接入 page_modules 的模块。
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-[#E5DED4] bg-white p-1">
          {PAGES.map((page) => {
            const active = page.key === selectedPage
            return (
              <button
                key={page.key}
                type="button"
                onClick={() => handleSelectPage(page.key)}
                className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: active ? '#E36F2C' : 'transparent',
                  color: active ? '#FFFFFF' : '#6B625B',
                }}
              >
                {page.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="rounded-lg border border-[#E5DED4] bg-white">
          <div className="border-b border-[#E5DED4] px-4 py-3">
            <p className="text-sm font-semibold text-[#2C2A28]">可定位模块</p>
            <p className="mt-1 text-xs text-[#8A8580]">点击模块会滚动并高亮预览区。</p>
          </div>
          <div className="p-2">
            {currentModules.map((pageModule) => {
              const active = selectedModule?.id === pageModule.id
              const located = locatedModules[pageModule.id] === true
              return (
                <button
                  key={pageModule.id}
                  type="button"
                  onClick={() => handleSelectModule(pageModule)}
                  className="mb-1 flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors last:mb-0"
                  style={{
                    background: active ? '#F5F2ED' : 'transparent',
                    color: active ? '#2C2A28' : '#6B625B',
                  }}
                >
                  <LocateFixed
                    size={16}
                    className={`mt-0.5 shrink-0 ${located ? 'text-[#E36F2C]' : 'text-[#B7AEA4]'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{pageModule.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-[#8A8580]">{pageModule.id}</span>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                      located
                        ? 'bg-[#E36F2C]/10 text-[#E36F2C]'
                        : frameLoaded
                          ? 'bg-[#F5F2ED] text-[#8A8580]'
                          : 'bg-[#F5F2ED] text-[#8A8580]'
                    }`}
                    >
                      {frameLoaded ? (located ? '已定位' : '未在预览中定位') : '检测中'}
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
            <span className="text-xs text-[#8A8580]">{currentPage.path}</span>
          </div>

          <div className="relative h-[720px] overflow-hidden bg-[#241F1B]">
            <iframe
              key={selectedPage}
              ref={iframeRef}
              src={currentPage.path}
              title={`${currentPage.label} page visual preview`}
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
            <p className="text-sm font-semibold text-[#2C2A28]">模块信息</p>
            <p className="mt-1 text-xs text-[#8A8580]">点击预览区模块后在这里确认定位。</p>
          </div>

          {selectedModule ? (
            <div className="flex flex-col gap-4 p-4">
              <div>
                <p className="text-xs text-[#8A8580]">模块名称</p>
                <p className="mt-1 text-base font-semibold text-[#2C2A28]">{selectedModule.name}</p>
                <p className="mt-2 text-sm leading-6 text-[#8A8580]">{selectedModule.description}</p>
              </div>

              <dl className="grid grid-cols-1 gap-3 text-sm">
                <div className="rounded-md bg-[#FAF7F2] p-3">
                  <dt className="text-xs text-[#8A8580]">pageKey</dt>
                  <dd className="mt-1 font-mono text-[#2C2A28]">{selectedModule.pageKey}</dd>
                </div>
                <div className="rounded-md bg-[#FAF7F2] p-3">
                  <dt className="text-xs text-[#8A8580]">moduleKey</dt>
                  <dd className="mt-1 font-mono text-[#2C2A28]">{selectedModule.moduleKey}</dd>
                </div>
                <div className="rounded-md bg-[#FAF7F2] p-3">
                  <dt className="text-xs text-[#8A8580]">接入状态</dt>
                  <dd className="mt-1 text-[#2C2A28]">已接入 page_modules</dd>
                </div>
                <div className="rounded-md bg-[#FAF7F2] p-3">
                  <dt className="text-xs text-[#8A8580]">预览定位</dt>
                  <dd className="mt-1 text-[#2C2A28]">
                    {selectedLocated ? '已在 iframe 中找到 DOM 标记' : '当前未在 iframe 中找到 DOM 标记'}
                  </dd>
                </div>
              </dl>

              {selectedField.itemId || selectedField.field ? (
                <div className="rounded-md border border-[#E5DED4] p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2C2A28]">
                    <MousePointer2 size={14} className="text-[#E36F2C]" />
                    <span>点击字段</span>
                  </div>
                  <p className="mt-2 text-xs text-[#8A8580]">item</p>
                  <p className="mt-1 font-mono text-sm text-[#2C2A28]">{selectedField.itemId ?? '-'}</p>
                  <p className="mt-3 text-xs text-[#8A8580]">field</p>
                  <p className="mt-1 font-mono text-sm text-[#2C2A28]">{selectedField.field ?? '-'}</p>
                </div>
              ) : null}

              <Link
                href={formEditorHref}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C85A1F]"
              >
                去表单编辑器打开
                <ArrowUpRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="p-4 text-sm text-[#8A8580]">暂无选中模块</div>
          )}
        </aside>
      </div>
    </div>
  )
}
