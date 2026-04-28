'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { PageModuleItem, PageModuleRow } from '@/lib/page-modules-db'

const PAGE_LABELS = {
  home: '首页',
  about: '关于我们',
} satisfies Record<string, string>

function pageLabel(pageKey: string) {
  return PAGE_LABELS[pageKey as keyof typeof PAGE_LABELS] ?? pageKey
}

function moduleStatus(pageModule: PageModuleRow) {
  if (pageModule.module_key === 'hero') return '已接入前台'
  if (pageModule.module_key === 'credentials') return '已接入前台'
  if (pageModule.module_key === 'stats') return '已接入前台'
  if (pageModule.module_key === 'brand-story') return '已接入前台'
  if (pageModule.module_key === 'factory') return '已接入前台'
  if (pageModule.module_key === 'technologies') return '已接入前台'
  if (pageModule.module_key === 'founder') return '已接入前台'
  if (pageModule.module_key === 'services') return '已接入前台'
  if (pageModule.module_key === 'recognition-awards') return '已接入前台'
  return '规划中'
}

function cloneModule(pageModule: PageModuleRow): PageModuleRow {
  return {
    ...pageModule,
    items: pageModule.items.map((item) => ({ ...item })),
  }
}

export default function PageModulesClient({
  initialModules,
}: {
  initialModules: PageModuleRow[]
}) {
  const [modules, setModules] = useState(() => initialModules.map(cloneModule))
  const [activeId, setActiveId] = useState(initialModules[0]?.id ?? '')
  const [saving, setSaving] = useState(false)

  const active = useMemo(
    () => modules.find((pageModule) => pageModule.id === activeId) ?? modules[0],
    [activeId, modules],
  )

  const pageKeys = useMemo(() => Array.from(new Set(modules.map((pageModule) => pageModule.page_key))), [modules])

  const patchActive = (patch: Partial<PageModuleRow>) => {
    if (!active) return
    setModules((prev) => prev.map((pageModule) => (pageModule.id === active.id ? { ...pageModule, ...patch } : pageModule)))
  }

  const patchItem = (id: string, patch: Partial<PageModuleItem>) => {
    if (!active) return
    patchActive({
      items: active.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })
  }

  const isStatsModule = active?.module_type === 'stats'

  const isImageItem = (item: PageModuleItem) => (
    Boolean(item.image_url) ||
    item.id.includes('image') ||
    active?.module_type === 'gallery-with-captions'
  )

  const isLinkItem = (item: PageModuleItem) => item.id.includes('cta') || Boolean(item.href)

  const isContentItem = (item: PageModuleItem) => (
    Boolean(item.content_zh) ||
    Boolean(item.content_en) ||
    item.id.includes('paragraph') ||
    item.id.includes('body')
  )

  const save = async () => {
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')
      const saved = data.data as PageModuleRow
      setModules((prev) => prev.map((pageModule) => (pageModule.id === saved.id ? cloneModule(saved) : pageModule)))
      toast.success('页面模块已保存')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!active) {
    return (
      <div className="rounded-lg border border-dashed border-[#E5DED4] bg-white p-12 text-center text-[#8A8580]">
        暂无页面模块
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-[#E36F2C]">Page Builder</p>
          <h1 className="mt-2 text-2xl font-bold text-[#2C2A28]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            页面模块
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8A8580]">
            用受控模块管理首页、关于我们等页面的文字和图片。当前首页首屏、首页数据区、关于我们首屏、数据条、品牌故事、智造实力、三大技术、创始人、服务体系、奖项荣誉已经接入前台，其他模块先作为后续接入的结构地基。
          </p>
        </div>
        <Button type="button" size="sm" disabled={saving} onClick={save}>
          <Save size={15} />
          {saving ? '保存中' : '保存当前模块'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-[#E5DED4] bg-white">
          {pageKeys.map((pageKey) => (
            <div key={pageKey} className="border-b border-[#E5DED4] last:border-b-0">
              <div className="bg-[#FAF7F2] px-4 py-3 text-xs font-semibold tracking-[0.16em] text-[#8A8580] uppercase">
                {pageLabel(pageKey)}
              </div>
              <div className="p-2">
                {modules
                  .filter((pageModule) => pageModule.page_key === pageKey)
                  .map((pageModule) => {
                    const selected = pageModule.id === active.id
                    return (
                      <button
                        key={pageModule.id}
                        type="button"
                        onClick={() => setActiveId(pageModule.id)}
                        className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-3 text-left transition-colors"
                        style={{
                          background: selected ? '#F5F2ED' : 'transparent',
                          color: selected ? '#2C2A28' : '#6B625B',
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{pageModule.title_zh}</span>
                          <span className="mt-1 block text-xs text-[#8A8580]">{moduleStatus(pageModule)}</span>
                        </span>
                        {pageModule.is_visible ? (
                          <Eye size={15} className="mt-0.5 shrink-0 text-[#E36F2C]" />
                        ) : (
                          <EyeOff size={15} className="mt-0.5 shrink-0 text-[#8A8580]" />
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </aside>

        <main className="rounded-lg border border-[#E5DED4] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#E5DED4] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs text-[#8A8580]">
                {pageLabel(active.page_key)} / {active.module_key} / {moduleStatus(active)}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[#2C2A28]">{active.title_zh}</h2>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-3 py-2">
              <span className="text-xs text-[#8A8580]">前台显示</span>
              <Switch checked={active.is_visible} onCheckedChange={(checked) => patchActive({ is_visible: checked })} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#8A8580]">中文模块名</span>
              <Input value={active.title_zh} onChange={(e) => patchActive({ title_zh: e.target.value })} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#8A8580]">英文模块名</span>
              <Input value={active.title_en} onChange={(e) => patchActive({ title_en: e.target.value })} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#8A8580]">中文说明</span>
              <Textarea
                className="min-h-[92px]"
                value={active.description_zh}
                onChange={(e) => patchActive({ description_zh: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#8A8580]">英文说明</span>
              <Textarea
                className="min-h-[92px]"
                value={active.description_en}
                onChange={(e) => patchActive({ description_en: e.target.value })}
              />
            </label>
          </div>

          {active.items.length > 0 ? (
            <div className="border-t border-[#E5DED4] p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#2C2A28]">图片与文字项</p>
                <p className="mt-1 text-xs text-[#8A8580]">
                  已接入前台的模块会立即影响网站展示。图片字段先支持 URL 修改，后续再接入统一图片库选择器。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                {active.items.map((item) => {
                  const showImage = isImageItem(item)
                  const showLink = isLinkItem(item)
                  const showContent = isContentItem(item)
                  return (
                  <div
                    key={item.id}
                    className={`grid gap-4 rounded-lg border border-[#E5DED4] bg-[#FAF7F2] p-3 ${showImage ? 'grid-cols-[92px_minmax(0,1fr)]' : 'grid-cols-1'}`}
                  >
                    {showImage ? (
                      <div className="overflow-hidden rounded-md bg-white">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image_url} alt="" className="h-28 w-full object-contain p-2" />
                        ) : null}
                      </div>
                    ) : null}
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-xs text-[#8A8580]">{item.id}</span>
                        <Switch
                          checked={item.is_visible}
                          onCheckedChange={(checked) => patchItem(item.id, { is_visible: checked })}
                        />
                      </div>
                      {showImage ? (
                        <Input
                          value={item.image_url ?? ''}
                          onChange={(e) => patchItem(item.id, { image_url: e.target.value })}
                          placeholder="图片 URL"
                        />
                      ) : null}
                      {isStatsModule ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input
                            value={item.value_zh ?? ''}
                            onChange={(e) => patchItem(item.id, { value_zh: e.target.value })}
                            placeholder="中文数值"
                          />
                          <Input
                            value={item.value_en ?? ''}
                            onChange={(e) => patchItem(item.id, { value_en: e.target.value })}
                            placeholder="英文数值"
                          />
                        </div>
                      ) : null}
                      <Input
                        value={item.label_zh}
                        onChange={(e) => patchItem(item.id, { label_zh: e.target.value })}
                        placeholder={isStatsModule ? '中文名称' : '中文文字'}
                      />
                      <Input
                        value={item.label_en}
                        onChange={(e) => patchItem(item.id, { label_en: e.target.value })}
                        placeholder={isStatsModule ? '英文名称' : '英文文字'}
                      />
                      {showContent ? (
                        <div className="grid grid-cols-1 gap-3">
                          <Textarea
                            className="min-h-[116px] bg-white"
                            value={item.content_zh ?? ''}
                            onChange={(e) => patchItem(item.id, { content_zh: e.target.value })}
                            placeholder="中文正文"
                          />
                          <Textarea
                            className="min-h-[132px] bg-white"
                            value={item.content_en ?? ''}
                            onChange={(e) => patchItem(item.id, { content_en: e.target.value })}
                            placeholder="英文正文"
                          />
                        </div>
                      ) : null}
                      {showLink ? (
                        <Input
                          value={item.href ?? ''}
                          onChange={(e) => patchItem(item.id, { href: e.target.value })}
                          placeholder="跳转链接"
                        />
                      ) : null}
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="border-t border-[#E5DED4] px-5 py-10 text-sm text-[#8A8580]">
              这个模块暂未接入具体字段。后续会按页面结构逐个增加标题、图片、列表项等可编辑字段。
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
