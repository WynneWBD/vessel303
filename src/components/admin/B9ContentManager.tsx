'use client'

import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { FileText, Plus, Save, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type {
  B9CategoryStatus,
  B9ContentCategory,
  B9ContentItem,
  B9ContentKind,
  B9ContentStatus,
} from '@/lib/b9-content-db'

type Mode = 'content' | 'category'

type ManagerCopy = {
  itemLabel: string
  titleZhLabel: string
  titleEnLabel: string
  bodyZhLabel: string
  bodyEnLabel: string
  summaryZhLabel: string
  summaryEnLabel: string
  payloadHelp: string
  fileLabel?: string
}

const KIND_COPY: Record<B9ContentKind, ManagerCopy> = {
  faq: {
    itemLabel: 'FAQ',
    titleZhLabel: '中文问题',
    titleEnLabel: '英文问题',
    summaryZhLabel: '中文摘要',
    summaryEnLabel: '英文摘要',
    bodyZhLabel: '中文答案',
    bodyEnLabel: '英文答案',
    payloadHelp: 'FAQ 一般不需要 JSON。可留空 {}。',
  },
  media_file: {
    itemLabel: '文件下载',
    titleZhLabel: '中文资源名称',
    titleEnLabel: '英文资源名称',
    summaryZhLabel: '中文资源说明',
    summaryEnLabel: '英文资源说明',
    bodyZhLabel: '中文使用说明',
    bodyEnLabel: '英文使用说明',
    payloadHelp: '可填 {"type":"press","requiresLead":true}，用于后续资源分组。',
    fileLabel: '文件或资源链接',
  },
  scenario: {
    itemLabel: '场景方案',
    titleZhLabel: '中文标题',
    titleEnLabel: '英文标题',
    summaryZhLabel: '中文副标题',
    summaryEnLabel: '英文副标题',
    bodyZhLabel: '中文简介',
    bodyEnLabel: '英文简介',
    payloadHelp:
      '固定 slug: tourism / commercial / public。可填 specs、features、process、recommendedProducts、cases、accentColor。',
  },
  display_slide: {
    itemLabel: 'Display 展示',
    titleZhLabel: '中文展示标题',
    titleEnLabel: '英文展示标题',
    summaryZhLabel: '中文标签',
    summaryEnLabel: '英文代次',
    bodyZhLabel: '中文特性，每行一条',
    bodyEnLabel: '英文展示文案',
    payloadHelp: '可填 {"size":"38.8㎡","capacity":"2-4 people","price":"Inquire for pricing"}。',
    fileLabel: '展示图链接',
  },
  innovation: {
    itemLabel: '技术专题',
    titleZhLabel: '中文专题标题',
    titleEnLabel: '英文专题标题',
    summaryZhLabel: '中文专题摘要',
    summaryEnLabel: '英文专题摘要',
    bodyZhLabel: '中文正文',
    bodyEnLabel: '英文正文',
    payloadHelp: '固定 slug: viie / vipc / vols。可填 {"sections":[{"title_zh":"","title_en":"","body_zh":"","body_en":""}]}。',
  },
}

function emptyItem(kind: B9ContentKind): EditableItem {
  return {
    id: null,
    kind,
    slug: '',
    category_id: null,
    title_zh: '',
    title_en: '',
    summary_zh: '',
    summary_en: '',
    body_zh: '',
    body_en: '',
    cover_image_url: '',
    file_url: '',
    cta_label_zh: '',
    cta_label_en: '',
    cta_href: '',
    payloadText: '{}',
    status: 'draft',
    sort_order: 0,
  }
}

function itemToEditable(item: B9ContentItem): EditableItem {
  return {
    id: item.id,
    kind: item.kind,
    slug: item.slug,
    category_id: item.category_id,
    title_zh: item.title_zh,
    title_en: item.title_en,
    summary_zh: item.summary_zh ?? '',
    summary_en: item.summary_en ?? '',
    body_zh: item.body_zh ?? '',
    body_en: item.body_en ?? '',
    cover_image_url: item.cover_image_url ?? '',
    file_url: item.file_url ?? '',
    cta_label_zh: item.cta_label_zh ?? '',
    cta_label_en: item.cta_label_en ?? '',
    cta_href: item.cta_href ?? '',
    payloadText: JSON.stringify(item.payload ?? {}, null, 2),
    status: item.status,
    sort_order: item.sort_order,
  }
}

type EditableItem = {
  id: number | null
  kind: B9ContentKind
  slug: string
  category_id: number | null
  title_zh: string
  title_en: string
  summary_zh: string
  summary_en: string
  body_zh: string
  body_en: string
  cover_image_url: string
  file_url: string
  cta_label_zh: string
  cta_label_en: string
  cta_href: string
  payloadText: string
  status: B9ContentStatus
  sort_order: number
}

type EditableCategory = {
  slug: string
  title_zh: string
  title_en: string
  sort_order: number
  status: B9CategoryStatus
}

export default function B9ContentManager({
  kind,
  initialRows,
  initialCategories,
  allowCategories = true,
  fixedSlugs = [],
}: {
  kind: B9ContentKind
  initialRows: B9ContentItem[]
  initialCategories: B9ContentCategory[]
  allowCategories?: boolean
  fixedSlugs?: string[]
}) {
  const copy = KIND_COPY[kind]
  const [rows, setRows] = useState(initialRows)
  const [categories, setCategories] = useState(initialCategories)
  const [mode, setMode] = useState<Mode>('content')
  const [editing, setEditing] = useState<EditableItem>(() => emptyItem(kind))
  const [categoryDraft, setCategoryDraft] = useState<EditableCategory>({
    slug: '',
    title_zh: '',
    title_en: '',
    sort_order: 0,
    status: 'visible',
  })
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.sort_order - b.sort_order || b.updated_at.localeCompare(a.updated_at)),
    [rows],
  )

  const updateEditing = <K extends keyof EditableItem>(key: K, value: EditableItem[K]) => {
    setEditing((current) => ({ ...current, [key]: value }))
  }

  const readEditingForm = (): EditableItem => {
    const root = formRef.current
    if (!root) return editing
    const valueOf = (field: string, fallback = '') => {
      const element = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[data-b9-field="${field}"]`,
      )
      return element ? element.value : fallback
    }
    const categoryId = valueOf('category_id', editing.category_id ? String(editing.category_id) : '')

    return {
      ...editing,
      slug: valueOf('slug', editing.slug),
      category_id: categoryId ? Number(categoryId) : null,
      title_zh: valueOf('title_zh', editing.title_zh),
      title_en: valueOf('title_en', editing.title_en),
      summary_zh: valueOf('summary_zh', editing.summary_zh),
      summary_en: valueOf('summary_en', editing.summary_en),
      body_zh: valueOf('body_zh', editing.body_zh),
      body_en: valueOf('body_en', editing.body_en),
      cover_image_url: valueOf('cover_image_url', editing.cover_image_url),
      file_url: valueOf('file_url', editing.file_url),
      cta_label_zh: valueOf('cta_label_zh', editing.cta_label_zh),
      cta_label_en: valueOf('cta_label_en', editing.cta_label_en),
      cta_href: valueOf('cta_href', editing.cta_href),
      payloadText: valueOf('payloadText', editing.payloadText),
      status: (valueOf('status', editing.status) || 'draft') as B9ContentStatus,
      sort_order: Number(valueOf('sort_order', String(editing.sort_order))) || 0,
    }
  }

  const saveItem = async (item = editing) => {
    let payload: Record<string, unknown>
    try {
      payload = item.payloadText.trim() ? JSON.parse(item.payloadText) : {}
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('payload must be an object')
      }
    } catch {
      toast.error('JSON 配置格式不正确')
      return
    }

    if (item.status === 'published') {
      const required = [item.slug, item.title_zh, item.title_en]
      if (kind === 'faq') required.push(item.body_zh, item.body_en)
      if (required.some((value) => !String(value ?? '').trim())) {
        toast.error('发布前必须补齐 slug、中英文标题和必填正文')
        return
      }
    }

    setSaving(true)
    try {
      const body = {
        kind,
        slug: item.slug,
        category_id: item.category_id,
        title_zh: item.title_zh,
        title_en: item.title_en,
        summary_zh: item.summary_zh || null,
        summary_en: item.summary_en || null,
        body_zh: item.body_zh || null,
        body_en: item.body_en || null,
        cover_image_url: item.cover_image_url || null,
        file_url: item.file_url || null,
        cta_label_zh: item.cta_label_zh || null,
        cta_label_en: item.cta_label_en || null,
        cta_href: item.cta_href || null,
        payload,
        status: item.status,
        sort_order: Number(item.sort_order) || 0,
      }
      const res = await fetch(item.id ? `/api/admin/site-content/${item.id}` : '/api/admin/site-content', {
        method: item.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')
      const saved = data.data as B9ContentItem
      setRows((current) => {
        const exists = current.some((item) => item.id === saved.id)
        return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]
      })
      setEditing(emptyItem(kind))
      toast.success('已保存')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const saveCategory = async () => {
    if (!categoryDraft.slug || !categoryDraft.title_zh || !categoryDraft.title_en) {
      toast.error('分类 slug 和中英文标题必填')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-content/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...categoryDraft, kind }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '保存失败')
      const saved = data.data as B9ContentCategory
      setCategories((current) => {
        const exists = current.some((item) => item.id === saved.id)
        return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]
      })
      setCategoryDraft({ slug: '', title_zh: '', title_en: '', sort_order: 0, status: 'visible' })
      toast.success('分类已保存')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1889B6]">{copy.itemLabel}</p>
            <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">内容列表</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={mode === 'content' ? 'default' : 'outline'} onClick={() => setMode('content')}>
              <FileText size={16} /> 内容
            </Button>
            {allowCategories && (
              <Button type="button" variant={mode === 'category' ? 'default' : 'outline'} onClick={() => setMode('category')}>
                <SlidersHorizontal size={16} /> 分类
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-[#E6EEEE]">
          {sortedRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#61767D]">暂无 CMS 内容，前台将继续使用静态兜底。</div>
          ) : (
            <div className="divide-y divide-[#E6EEEE]">
              {sortedRows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEditing(itemToEditable(item))}
                  className="grid w-full grid-cols-1 gap-3 bg-white p-4 text-left transition hover:bg-[#F7FBFB] md:grid-cols-[90px_minmax(0,1fr)_110px_80px]"
                >
                  <span className="text-sm font-semibold text-[#1889B6]">#{item.sort_order}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#1E2C31]">{item.title_zh || item.title_en || item.slug}</span>
                    <span className="mt-1 block truncate text-xs text-[#61767D]">
                      {item.slug}{item.category_title_zh ? ` · ${item.category_title_zh}` : ''}
                    </span>
                  </span>
                  <Badge className={item.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : item.status === 'hidden' ? 'border-zinc-200 bg-zinc-50 text-zinc-600' : 'border-orange-200 bg-orange-50 text-orange-700'}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-[#8A9EA4]">编辑</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start xl:overflow-y-auto">
        {mode === 'content' ? (
          <div ref={formRef} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#1E2C31]">{editing.id ? '编辑内容' : '新增内容'}</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(emptyItem(kind))} data-testid="b9-new-content">
                <Plus size={15} /> 新建
              </Button>
            </div>

            <Button type="button" className="w-full" disabled={saving} onClick={() => saveItem(readEditingForm())} data-testid="b9-save-content-top">
              <Save size={16} /> {saving ? '保存中...' : '保存内容'}
            </Button>

            {fixedSlugs.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#61767D]">固定 slug</label>
                <Select value={editing.slug} onChange={(e) => updateEditing('slug', e.target.value)}>
                  <option value="">选择或手动填写</option>
                  {fixedSlugs.map((slug) => <option key={slug} value={slug}>{slug}</option>)}
                </Select>
              </div>
            )}

            <Field label="Slug">
              <Input data-b9-field="slug" value={editing.slug} onChange={(e) => updateEditing('slug', e.target.value)} placeholder="faq-price" />
            </Field>

            {allowCategories && (
              <Field label="分类">
                <Select
                  value={editing.category_id ? String(editing.category_id) : ''}
                  onChange={(e) => updateEditing('category_id', e.target.value ? Number(e.target.value) : null)}
                  data-b9-field="category_id"
                >
                  <option value="">未分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.title_zh} / {cat.title_en}</option>
                  ))}
                </Select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label={copy.titleZhLabel}><Input data-b9-field="title_zh" value={editing.title_zh} onChange={(e) => updateEditing('title_zh', e.target.value)} /></Field>
              <Field label={copy.titleEnLabel}><Input data-b9-field="title_en" value={editing.title_en} onChange={(e) => updateEditing('title_en', e.target.value)} /></Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={copy.summaryZhLabel}><Textarea data-b9-field="summary_zh" rows={2} value={editing.summary_zh} onChange={(e) => updateEditing('summary_zh', e.target.value)} /></Field>
              <Field label={copy.summaryEnLabel}><Textarea data-b9-field="summary_en" rows={2} value={editing.summary_en} onChange={(e) => updateEditing('summary_en', e.target.value)} /></Field>
            </div>

            <Field label={copy.bodyZhLabel}><Textarea data-b9-field="body_zh" rows={4} value={editing.body_zh} onChange={(e) => updateEditing('body_zh', e.target.value)} /></Field>
            <Field label={copy.bodyEnLabel}><Textarea data-b9-field="body_en" rows={4} value={editing.body_en} onChange={(e) => updateEditing('body_en', e.target.value)} /></Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={copy.fileLabel ?? '封面图链接'}>
                <Input data-b9-field={copy.fileLabel ? 'file_url' : 'cover_image_url'} value={copy.fileLabel ? editing.file_url : editing.cover_image_url} onChange={(e) => updateEditing(copy.fileLabel ? 'file_url' : 'cover_image_url', e.target.value)} />
              </Field>
              {copy.fileLabel && (
                <Field label="封面图链接">
                  <Input data-b9-field="cover_image_url" value={editing.cover_image_url} onChange={(e) => updateEditing('cover_image_url', e.target.value)} />
                </Field>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="CTA 中文"><Input data-b9-field="cta_label_zh" value={editing.cta_label_zh} onChange={(e) => updateEditing('cta_label_zh', e.target.value)} /></Field>
              <Field label="CTA 英文"><Input data-b9-field="cta_label_en" value={editing.cta_label_en} onChange={(e) => updateEditing('cta_label_en', e.target.value)} /></Field>
              <Field label="CTA 链接"><Input data-b9-field="cta_href" value={editing.cta_href} onChange={(e) => updateEditing('cta_href', e.target.value)} /></Field>
            </div>

            <Field label="JSON 配置">
              <Textarea data-b9-field="payloadText" rows={5} value={editing.payloadText} onChange={(e) => updateEditing('payloadText', e.target.value)} />
              <p className="mt-1 text-xs leading-5 text-[#8A9EA4]">{copy.payloadHelp}</p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="状态">
                <Select data-b9-field="status" value={editing.status} onChange={(e) => updateEditing('status', e.target.value as B9ContentStatus)}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="hidden">hidden</option>
                </Select>
              </Field>
              <Field label="排序">
                <Input data-b9-field="sort_order" type="number" value={editing.sort_order} onChange={(e) => updateEditing('sort_order', Number(e.target.value))} />
              </Field>
            </div>

            <Button type="button" className="w-full" disabled={saving} onClick={() => saveItem(readEditingForm())} data-testid="b9-save-content-bottom">
              <Save size={16} /> {saving ? '保存中...' : '保存内容'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#1E2C31]">分类管理</h2>
            <Field label="Slug"><Input value={categoryDraft.slug} onChange={(e) => setCategoryDraft((c) => ({ ...c, slug: e.target.value }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="中文标题"><Input value={categoryDraft.title_zh} onChange={(e) => setCategoryDraft((c) => ({ ...c, title_zh: e.target.value }))} /></Field>
              <Field label="英文标题"><Input value={categoryDraft.title_en} onChange={(e) => setCategoryDraft((c) => ({ ...c, title_en: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="状态">
                <Select value={categoryDraft.status} onChange={(e) => setCategoryDraft((c) => ({ ...c, status: e.target.value as B9CategoryStatus }))}>
                  <option value="visible">visible</option>
                  <option value="hidden">hidden</option>
                </Select>
              </Field>
              <Field label="排序"><Input type="number" value={categoryDraft.sort_order} onChange={(e) => setCategoryDraft((c) => ({ ...c, sort_order: Number(e.target.value) }))} /></Field>
            </div>
            <Button type="button" className="w-full" disabled={saving} onClick={saveCategory} data-testid="b9-save-category">
              <Save size={16} /> 保存分类
            </Button>
            <div className="divide-y divide-[#E6EEEE] rounded-md border border-[#E6EEEE]">
              {categories.length === 0 ? (
                <p className="p-4 text-sm text-[#61767D]">暂无分类</p>
              ) : categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryDraft({
                    slug: cat.slug,
                    title_zh: cat.title_zh,
                    title_en: cat.title_en,
                    sort_order: cat.sort_order,
                    status: cat.status,
                  })}
                  className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-[#F7FBFB]"
                >
                  <span>
                    <span className="block font-semibold text-[#1E2C31]">{cat.title_zh}</span>
                    <span className="text-xs text-[#61767D]">{cat.slug}</span>
                  </span>
                  <Badge>{cat.status}</Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#61767D]">{label}</span>
      {children}
    </label>
  )
}
