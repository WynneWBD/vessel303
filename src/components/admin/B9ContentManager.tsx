'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Eye, FileText, Plus, Save, Search, SlidersHorizontal } from 'lucide-react'
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
type StatusFilter = 'all' | B9ContentStatus

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
    payloadHelp: '高级配置通常无需修改。',
  },
  media_file: {
    itemLabel: '文件下载',
    titleZhLabel: '中文资源名称',
    titleEnLabel: '英文资源名称',
    summaryZhLabel: '中文资源说明',
    summaryEnLabel: '英文资源说明',
    bodyZhLabel: '中文使用说明',
    bodyEnLabel: '英文使用说明',
    payloadHelp: '高级配置通常无需修改。',
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
    payloadHelp: '高级配置通常无需修改。',
  },
  display_slide: {
    itemLabel: 'Display 展示',
    titleZhLabel: '中文展示标题',
    titleEnLabel: '英文展示标题',
    summaryZhLabel: '中文标签',
    summaryEnLabel: '英文代次',
    bodyZhLabel: '中文特性，每行一条',
    bodyEnLabel: '英文展示文案',
    payloadHelp: '高级配置通常无需修改。',
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
    payloadHelp: '高级配置通常无需修改。',
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

function getPreviewHref(kind: B9ContentKind, item: B9ContentItem): string | null {
  if (item.status !== 'published') return null
  if (kind === 'faq') return '/faq'
  if (kind === 'media_file') return '/media-kit'
  if (kind === 'display_slide') return '/display'
  if (kind === 'scenario') return item.slug ? `/scenarios/${item.slug}` : '/scenarios/tourism'
  if (kind === 'innovation') return item.slug ? `/innovation/${item.slug}` : '/innovation/viie'
  return null
}

const CONTENT_STATUS_LABELS: Record<B9ContentStatus, string> = {
  draft: '草稿',
  published: '已发布',
  hidden: '已隐藏',
}

const CATEGORY_STATUS_LABELS: Record<B9CategoryStatus, string> = {
  visible: '显示中',
  hidden: '已隐藏',
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
  initialSearch = '',
}: {
  kind: B9ContentKind
  initialRows: B9ContentItem[]
  initialCategories: B9ContentCategory[]
  allowCategories?: boolean
  fixedSlugs?: string[]
  initialSearch?: string
}) {
  const copy = KIND_COPY[kind]
  const [rows, setRows] = useState(initialRows)
  const [categories, setCategories] = useState(initialCategories)
  const [mode, setMode] = useState<Mode>('content')
  const [editing, setEditing] = useState<EditableItem>(() => emptyItem(kind))
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryDraft, setCategoryDraft] = useState<EditableCategory>({
    slug: '',
    title_zh: '',
    title_en: '',
    sort_order: 0,
    status: 'visible',
  })
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const sortedRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return [...rows]
      .filter((row) => {
        if (statusFilter !== 'all' && row.status !== statusFilter) return false
        if (!normalizedSearch) return true
        const haystack = [
          row.slug,
          row.title_zh,
          row.title_en,
          row.summary_zh ?? '',
          row.summary_en ?? '',
          row.category_title_zh ?? '',
          row.category_title_en ?? '',
        ].join(' ').toLowerCase()
        return haystack.includes(normalizedSearch)
      })
      .sort((a, b) => a.sort_order - b.sort_order || b.updated_at.localeCompare(a.updated_at))
  }, [rows, searchTerm, statusFilter])

  const statusCounts = useMemo(() => ({
    all: rows.length,
    published: rows.filter((item) => item.status === 'published').length,
    draft: rows.filter((item) => item.status === 'draft').length,
    hidden: rows.filter((item) => item.status === 'hidden').length,
  }), [rows])

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
      toast.error('高级配置格式不正确')
      return
    }

    if (item.status === 'published') {
      const required = [item.slug, item.title_zh, item.title_en]
      if (kind === 'faq') required.push(item.body_zh, item.body_en)
      if (required.some((value) => !String(value ?? '').trim())) {
        toast.error('发布前必须补齐路径/内容标识、中英文标题和必填正文')
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
      toast.error('分类路径和中英文标题必填')
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

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <label className="relative block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9EA4]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜索路径、标题、分类"
              className="pl-9"
            />
          </label>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">全部状态 ({statusCounts.all})</option>
            <option value="published">{CONTENT_STATUS_LABELS.published} ({statusCounts.published})</option>
            <option value="draft">{CONTENT_STATUS_LABELS.draft} ({statusCounts.draft})</option>
            <option value="hidden">{CONTENT_STATUS_LABELS.hidden} ({statusCounts.hidden})</option>
          </Select>
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-[#E6EEEE]">
          {sortedRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#61767D]">暂无符合条件的内容；前台只展示已发布内容。</div>
          ) : (
            <div className="divide-y divide-[#E6EEEE]">
              {sortedRows.map((item) => {
                const previewHref = getPreviewHref(kind, item)
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 bg-white p-4 transition hover:bg-[#F7FBFB] md:grid-cols-[90px_minmax(0,1fr)_110px_160px]"
                  >
                    <span className="text-sm font-semibold text-[#1889B6]">#{item.sort_order}</span>
                    <button type="button" onClick={() => setEditing(itemToEditable(item))} className="min-w-0 text-left">
                      <span className="block truncate text-sm font-bold text-[#1E2C31]">{item.title_zh || item.title_en || item.slug}</span>
                      <span className="mt-1 block truncate text-xs text-[#61767D]">
                        {item.slug}{item.category_title_zh ? ` · ${item.category_title_zh}` : ''}
                      </span>
                    </button>
                    <Badge className={item.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : item.status === 'hidden' ? 'border-zinc-200 bg-zinc-50 text-zinc-600' : 'border-orange-200 bg-orange-50 text-orange-700'}>
                      {CONTENT_STATUS_LABELS[item.status]}
                    </Badge>
                    <span className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setEditing(itemToEditable(item))}
                        className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] px-2 font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
                      >
                        编辑
                      </button>
                      {previewHref ? (
                        <Link
                          href={previewHref}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E7E8] px-2 font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
                        >
                          <Eye size={13} />
                          预览
                        </Link>
                      ) : (
                        <span className="inline-flex h-8 items-center rounded-md bg-[#F5F8F8] px-2 font-semibold text-[#8A9EA4]">
                          未发布
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
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

            <div className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3 text-xs leading-5 text-[#61767D]">
              只维护会展示给客户的内容。保存后请预览并核对前台效果。
            </div>

            <Button type="button" className="w-full" disabled={saving} onClick={() => saveItem(readEditingForm())} data-testid="b9-save-content-top">
              <Save size={16} /> {saving ? '保存中...' : '保存内容'}
            </Button>

            {fixedSlugs.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#61767D]">固定路径</label>
                <Select value={editing.slug} onChange={(e) => updateEditing('slug', e.target.value)}>
                  <option value="">选择或手动填写</option>
                  {fixedSlugs.map((slug) => <option key={slug} value={slug}>{slug}</option>)}
                </Select>
              </div>
            )}

            <Field label="页面路径/内容标识">
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
              <Field label={`${copy.titleZhLabel}（显示到前台）`}><Input data-b9-field="title_zh" value={editing.title_zh} onChange={(e) => updateEditing('title_zh', e.target.value)} /></Field>
              <Field label={`${copy.titleEnLabel}（显示到前台）`}><Input data-b9-field="title_en" value={editing.title_en} onChange={(e) => updateEditing('title_en', e.target.value)} /></Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`${copy.summaryZhLabel}（显示到前台）`}><Textarea data-b9-field="summary_zh" rows={2} value={editing.summary_zh} onChange={(e) => updateEditing('summary_zh', e.target.value)} /></Field>
              <Field label={`${copy.summaryEnLabel}（显示到前台）`}><Textarea data-b9-field="summary_en" rows={2} value={editing.summary_en} onChange={(e) => updateEditing('summary_en', e.target.value)} /></Field>
            </div>

            <Field label={`${copy.bodyZhLabel}（显示到前台）`}><Textarea data-b9-field="body_zh" rows={4} value={editing.body_zh} onChange={(e) => updateEditing('body_zh', e.target.value)} /></Field>
            <Field label={`${copy.bodyEnLabel}（显示到前台）`}><Textarea data-b9-field="body_en" rows={4} value={editing.body_en} onChange={(e) => updateEditing('body_en', e.target.value)} /></Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`${copy.fileLabel ?? '封面图链接'}（显示到前台）`}>
                <Input data-b9-field={copy.fileLabel ? 'file_url' : 'cover_image_url'} value={copy.fileLabel ? editing.file_url : editing.cover_image_url} onChange={(e) => updateEditing(copy.fileLabel ? 'file_url' : 'cover_image_url', e.target.value)} />
              </Field>
              {copy.fileLabel && (
                  <Field label="封面图链接（显示到前台）">
                  <Input data-b9-field="cover_image_url" value={editing.cover_image_url} onChange={(e) => updateEditing('cover_image_url', e.target.value)} />
                </Field>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="CTA 中文（显示到前台）"><Input data-b9-field="cta_label_zh" value={editing.cta_label_zh} onChange={(e) => updateEditing('cta_label_zh', e.target.value)} /></Field>
              <Field label="CTA 英文（显示到前台）"><Input data-b9-field="cta_label_en" value={editing.cta_label_en} onChange={(e) => updateEditing('cta_label_en', e.target.value)} /></Field>
              <Field label="CTA 链接（显示到前台）"><Input data-b9-field="cta_href" value={editing.cta_href} onChange={(e) => updateEditing('cta_href', e.target.value)} /></Field>
            </div>

            <Field label="高级配置">
              <Textarea data-b9-field="payloadText" rows={5} value={editing.payloadText} onChange={(e) => updateEditing('payloadText', e.target.value)} />
              <p className="mt-1 text-xs leading-5 text-[#8A9EA4]">{copy.payloadHelp}</p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="状态">
                <Select data-b9-field="status" value={editing.status} onChange={(e) => updateEditing('status', e.target.value as B9ContentStatus)}>
                  <option value="draft">{CONTENT_STATUS_LABELS.draft}</option>
                  <option value="published">{CONTENT_STATUS_LABELS.published}</option>
                  <option value="hidden">{CONTENT_STATUS_LABELS.hidden}</option>
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
            <Field label="分类路径"><Input value={categoryDraft.slug} onChange={(e) => setCategoryDraft((c) => ({ ...c, slug: e.target.value }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="中文标题"><Input value={categoryDraft.title_zh} onChange={(e) => setCategoryDraft((c) => ({ ...c, title_zh: e.target.value }))} /></Field>
              <Field label="英文标题"><Input value={categoryDraft.title_en} onChange={(e) => setCategoryDraft((c) => ({ ...c, title_en: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="状态">
                <Select value={categoryDraft.status} onChange={(e) => setCategoryDraft((c) => ({ ...c, status: e.target.value as B9CategoryStatus }))}>
                  <option value="visible">{CATEGORY_STATUS_LABELS.visible}</option>
                  <option value="hidden">{CATEGORY_STATUS_LABELS.hidden}</option>
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
                  <Badge>{CATEGORY_STATUS_LABELS[cat.status]}</Badge>
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
