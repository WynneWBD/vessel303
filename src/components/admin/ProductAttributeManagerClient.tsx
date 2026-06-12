'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Eye, EyeOff, Pencil, Plus, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type {
  ProductAttributeOptionRow,
  ProductAttributeStatus,
  ProductAttributeTemplateRow,
  ProductAttributeTemplateWithOptions,
} from '@/lib/product-catalog-db'

type TemplateFormState = {
  slug: string
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  sort_order: string
  status: ProductAttributeStatus
}

type OptionFormState = {
  slug: string
  label_zh: string
  label_en: string
  sort_order: string
  status: ProductAttributeStatus
}

const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  slug: '',
  title_zh: '',
  title_en: '',
  description_zh: '',
  description_en: '',
  sort_order: '100',
  status: 'visible',
}

const EMPTY_OPTION_FORM: OptionFormState = {
  slug: '',
  label_zh: '',
  label_en: '',
  sort_order: '100',
  status: 'visible',
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function toTemplateForm(template: ProductAttributeTemplateRow): TemplateFormState {
  return {
    slug: template.slug,
    title_zh: template.title_zh,
    title_en: template.title_en,
    description_zh: template.description_zh ?? '',
    description_en: template.description_en ?? '',
    sort_order: String(template.sort_order),
    status: template.status,
  }
}

function toOptionForm(option: ProductAttributeOptionRow): OptionFormState {
  return {
    slug: option.slug,
    label_zh: option.label_zh,
    label_en: option.label_en,
    sort_order: String(option.sort_order),
    status: option.status,
  }
}

function buildTemplatePayload(form: TemplateFormState) {
  const sortOrder = Number(form.sort_order)
  return {
    slug: normalizeSlug(form.slug),
    title_zh: form.title_zh.trim(),
    title_en: form.title_en.trim(),
    description_zh: form.description_zh.trim() || null,
    description_en: form.description_en.trim() || null,
    sort_order: Number.isInteger(sortOrder) ? sortOrder : 100,
    status: form.status,
  }
}

function buildOptionPayload(form: OptionFormState) {
  const sortOrder = Number(form.sort_order)
  return {
    slug: normalizeSlug(form.slug),
    label_zh: form.label_zh.trim(),
    label_en: form.label_en.trim(),
    sort_order: Number.isInteger(sortOrder) ? sortOrder : 100,
    status: form.status,
  }
}

function statusLabel(status: ProductAttributeStatus) {
  return status === 'visible' ? '显示' : '隐藏'
}

function statusClass(status: ProductAttributeStatus) {
  return status === 'visible'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

export default function ProductAttributeManagerClient({
  initialTemplates,
}: {
  initialTemplates: ProductAttributeTemplateWithOptions[]
}) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [createTemplateForm, setCreateTemplateForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM)
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [editTemplateForm, setEditTemplateForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM)
  const [createOptionForms, setCreateOptionForms] = useState<Record<number, OptionFormState>>({})
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null)
  const [editOptionForm, setEditOptionForm] = useState<OptionFormState>(EMPTY_OPTION_FORM)
  const [loading, setLoading] = useState(false)

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [templates],
  )

  const refreshTemplates = async () => {
    const res = await fetch('/api/admin/products/attributes?includeHidden=1', { cache: 'no-store' })
    if (!res.ok) throw new Error('属性模板刷新失败')
    const data = await res.json() as { data: ProductAttributeTemplateWithOptions[] }
    setTemplates(data.data)
    router.refresh()
  }

  const validateTemplate = (form: TemplateFormState) => {
    const payload = buildTemplatePayload(form)
    if (!payload.slug || !payload.title_zh || !payload.title_en) {
      toast.error('请填写 slug、中文名称和英文名称')
      return null
    }
    if (payload.sort_order < 0 || payload.sort_order > 9999) {
      toast.error('排序值需在 0-9999 之间')
      return null
    }
    return payload
  }

  const validateOption = (form: OptionFormState) => {
    const payload = buildOptionPayload(form)
    if (!payload.slug || !payload.label_zh || !payload.label_en) {
      toast.error('请填写选项 slug、中文名称和英文名称')
      return null
    }
    if (payload.sort_order < 0 || payload.sort_order > 9999) {
      toast.error('排序值需在 0-9999 之间')
      return null
    }
    return payload
  }

  const handleCreateTemplate = async () => {
    const payload = validateTemplate(createTemplateForm)
    if (!payload) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/products/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '新增属性模板失败')
      }
      toast.success('属性模板已新增')
      setCreateTemplateForm(EMPTY_TEMPLATE_FORM)
      await refreshTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新增属性模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTemplate = async (id: number, form: TemplateFormState) => {
    const payload = validateTemplate(form)
    if (!payload) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/attributes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '保存属性模板失败')
      }
      toast.success('属性模板已保存')
      setEditingTemplateId(null)
      setEditTemplateForm(EMPTY_TEMPLATE_FORM)
      await refreshTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存属性模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTemplate = async (template: ProductAttributeTemplateWithOptions) => {
    const nextStatus: ProductAttributeStatus = template.status === 'visible' ? 'hidden' : 'visible'
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/attributes/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '状态更新失败')
      }
      toast.success(nextStatus === 'visible' ? '属性模板已显示' : '属性模板已隐藏')
      await refreshTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '状态更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOption = async (templateId: number) => {
    const form = createOptionForms[templateId] ?? EMPTY_OPTION_FORM
    const payload = validateOption(form)
    if (!payload) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/attributes/${templateId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '新增属性选项失败')
      }
      toast.success('属性选项已新增')
      setCreateOptionForms((forms) => ({ ...forms, [templateId]: EMPTY_OPTION_FORM }))
      await refreshTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新增属性选项失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOption = async (id: number, form: OptionFormState) => {
    const payload = validateOption(form)
    if (!payload) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/attributes/options/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '保存属性选项失败')
      }
      toast.success('属性选项已保存')
      setEditingOptionId(null)
      setEditOptionForm(EMPTY_OPTION_FORM)
      await refreshTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存属性选项失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOption = async (option: ProductAttributeOptionRow) => {
    const nextStatus: ProductAttributeStatus = option.status === 'visible' ? 'hidden' : 'visible'
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/attributes/options/${option.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '状态更新失败')
      }
      toast.success(nextStatus === 'visible' ? '属性选项已显示' : '属性选项已隐藏')
      await refreshTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '状态更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-5" data-testid="product-attribute-manager">
      <div>
        <h2 className="text-xl font-bold text-[#1E2C31]">当前属性模板</h2>
        <p className="mt-1 text-sm text-[#61767D]">
          对照 300.cn 后台的属性模板心智，用于后台产品属性和后续筛选管理；支持新增、编辑、排序和显示 / 隐藏，不做物理删除。
        </p>
      </div>

      <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#1E2C31]">新增属性模板</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[150px_150px_150px_90px_120px_minmax(0,1fr)]">
          <Input
            data-testid="product-attribute-template-create-slug"
            placeholder="slug"
            value={createTemplateForm.slug}
            onChange={(e) => setCreateTemplateForm((form) => ({ ...form, slug: e.target.value }))}
          />
          <Input
            data-testid="product-attribute-template-create-title-zh"
            placeholder="中文名称"
            value={createTemplateForm.title_zh}
            onChange={(e) => setCreateTemplateForm((form) => ({ ...form, title_zh: e.target.value }))}
          />
          <Input
            data-testid="product-attribute-template-create-title-en"
            placeholder="英文名称"
            value={createTemplateForm.title_en}
            onChange={(e) => setCreateTemplateForm((form) => ({ ...form, title_en: e.target.value }))}
          />
          <Input
            data-testid="product-attribute-template-create-sort-order"
            type="number"
            min={0}
            max={9999}
            placeholder="排序"
            value={createTemplateForm.sort_order}
            onChange={(e) => setCreateTemplateForm((form) => ({ ...form, sort_order: e.target.value }))}
          />
          <Select
            data-testid="product-attribute-template-create-status"
            value={createTemplateForm.status}
            onChange={(e) => setCreateTemplateForm((form) => ({ ...form, status: e.target.value as ProductAttributeStatus }))}
          >
            <option value="visible">显示</option>
            <option value="hidden">隐藏</option>
          </Select>
          <button
            type="button"
            onClick={handleCreateTemplate}
            disabled={loading}
            data-testid="product-attribute-template-create-submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            新增模板
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <textarea
            data-testid="product-attribute-template-create-description-zh"
            placeholder="中文说明"
            value={createTemplateForm.description_zh}
            onChange={(e) => setCreateTemplateForm((form) => ({ ...form, description_zh: e.target.value }))}
            className="min-h-20 rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
          />
          <textarea
            data-testid="product-attribute-template-create-description-en"
            placeholder="英文说明"
            value={createTemplateForm.description_en}
            onChange={(e) => setCreateTemplateForm((form) => ({ ...form, description_en: e.target.value }))}
            className="min-h-20 rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
          />
        </div>
      </div>

      <div className="space-y-4">
        {sortedTemplates.map((template) => {
          const editingTemplate = editingTemplateId === template.id
          const optionCreateForm = createOptionForms[template.id] ?? EMPTY_OPTION_FORM

          return (
            <div
              key={template.id}
              data-testid={`product-attribute-template-${template.slug}`}
              className="rounded-md border border-[#D8E7E8] bg-white shadow-sm"
            >
              <div className="border-b border-[#E6EEEE] p-4">
                {editingTemplate ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[150px_150px_150px_90px_120px_auto_auto]">
                      <Input value={editTemplateForm.slug} onChange={(e) => setEditTemplateForm((form) => ({ ...form, slug: e.target.value }))} />
                      <Input value={editTemplateForm.title_zh} onChange={(e) => setEditTemplateForm((form) => ({ ...form, title_zh: e.target.value }))} />
                      <Input value={editTemplateForm.title_en} onChange={(e) => setEditTemplateForm((form) => ({ ...form, title_en: e.target.value }))} />
                      <Input type="number" min={0} max={9999} value={editTemplateForm.sort_order} onChange={(e) => setEditTemplateForm((form) => ({ ...form, sort_order: e.target.value }))} />
                      <Select value={editTemplateForm.status} onChange={(e) => setEditTemplateForm((form) => ({ ...form, status: e.target.value as ProductAttributeStatus }))}>
                        <option value="visible">显示</option>
                        <option value="hidden">隐藏</option>
                      </Select>
                      <button
                        type="button"
                        onClick={() => handleUpdateTemplate(template.id, editTemplateForm)}
                        disabled={loading}
                        title="保存模板"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22] disabled:opacity-60"
                      >
                        <Check size={16} />
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplateId(null)
                          setEditTemplateForm(EMPTY_TEMPLATE_FORM)
                        }}
                        disabled={loading}
                        title="取消编辑"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#61767D] transition hover:text-[#1E2C31] disabled:opacity-60"
                      >
                        <X size={16} />
                        取消
                      </button>
                    </div>
                    <textarea
                      value={editTemplateForm.description_zh}
                      onChange={(e) => setEditTemplateForm((form) => ({ ...form, description_zh: e.target.value }))}
                      className="min-h-20 w-full rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
                          <SlidersHorizontal size={17} />
                        </span>
                        <h3 className="text-base font-bold text-[#1E2C31]">{template.title_zh}</h3>
                        <span className="text-sm font-semibold text-[#61767D]">{template.title_en}</span>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(template.status)}`}>
                          {statusLabel(template.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-[#1889B6]">{template.slug}</p>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">{template.description_zh ?? '暂无说明'}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#8A9EA4]">
                        <span>排序 {template.sort_order}</span>
                        <span>选项 {template.option_count ?? template.options.length}</span>
                        <span>已关联产品 {template.product_count ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplateId(template.id)
                          setEditTemplateForm(toTemplateForm(template))
                        }}
                        disabled={loading}
                        title="编辑模板"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:opacity-60"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleTemplate(template)}
                        disabled={loading}
                        title={template.status === 'visible' ? '隐藏模板' : '显示模板'}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:opacity-60"
                      >
                        {template.status === 'visible' ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[150px_160px_160px_90px_120px_auto]">
                  <Input
                    placeholder="option-slug"
                    value={optionCreateForm.slug}
                    onChange={(e) => setCreateOptionForms((forms) => ({
                      ...forms,
                      [template.id]: { ...optionCreateForm, slug: e.target.value },
                    }))}
                  />
                  <Input
                    placeholder="中文选项"
                    value={optionCreateForm.label_zh}
                    onChange={(e) => setCreateOptionForms((forms) => ({
                      ...forms,
                      [template.id]: { ...optionCreateForm, label_zh: e.target.value },
                    }))}
                  />
                  <Input
                    placeholder="英文选项"
                    value={optionCreateForm.label_en}
                    onChange={(e) => setCreateOptionForms((forms) => ({
                      ...forms,
                      [template.id]: { ...optionCreateForm, label_en: e.target.value },
                    }))}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={9999}
                    placeholder="排序"
                    value={optionCreateForm.sort_order}
                    onChange={(e) => setCreateOptionForms((forms) => ({
                      ...forms,
                      [template.id]: { ...optionCreateForm, sort_order: e.target.value },
                    }))}
                  />
                  <Select
                    value={optionCreateForm.status}
                    onChange={(e) => setCreateOptionForms((forms) => ({
                      ...forms,
                      [template.id]: { ...optionCreateForm, status: e.target.value as ProductAttributeStatus },
                    }))}
                  >
                    <option value="visible">显示</option>
                    <option value="hidden">隐藏</option>
                  </Select>
                  <button
                    type="button"
                    onClick={() => handleCreateOption(template.id)}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1889B6] px-3 text-sm font-semibold text-white transition hover:bg-[#126D91] disabled:opacity-60"
                  >
                    <Plus size={16} />
                    新增选项
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto rounded-md border border-[#E6EEEE]">
                  <div className="min-w-[860px]">
                    <div className="grid grid-cols-[180px_180px_90px_90px_90px_minmax(0,1fr)_110px] gap-4 bg-[#F7FAFA] px-4 py-3 text-xs font-bold text-[#61767D]">
                      <span>中文选项</span>
                      <span>英文选项</span>
                      <span>排序</span>
                      <span>产品数</span>
                      <span>状态</span>
                      <span>slug</span>
                      <span>操作</span>
                    </div>
                    {template.options.map((option) => {
                      const editingOption = editingOptionId === option.id
                      return (
                        <div
                          key={option.id}
                          data-testid={`product-attribute-option-${template.slug}-${option.slug}`}
                          className="grid grid-cols-[180px_180px_90px_90px_90px_minmax(0,1fr)_110px] gap-4 border-t border-[#EEF3F3] px-4 py-3 text-xs text-[#61767D]"
                        >
                          {editingOption ? (
                            <>
                              <Input value={editOptionForm.label_zh} onChange={(e) => setEditOptionForm((form) => ({ ...form, label_zh: e.target.value }))} />
                              <Input value={editOptionForm.label_en} onChange={(e) => setEditOptionForm((form) => ({ ...form, label_en: e.target.value }))} />
                              <Input type="number" min={0} max={9999} value={editOptionForm.sort_order} onChange={(e) => setEditOptionForm((form) => ({ ...form, sort_order: e.target.value }))} />
                              <span className="pt-2">{option.product_count ?? 0}</span>
                              <Select value={editOptionForm.status} onChange={(e) => setEditOptionForm((form) => ({ ...form, status: e.target.value as ProductAttributeStatus }))}>
                                <option value="visible">显示</option>
                                <option value="hidden">隐藏</option>
                              </Select>
                              <Input value={editOptionForm.slug} onChange={(e) => setEditOptionForm((form) => ({ ...form, slug: e.target.value }))} />
                              <span className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOption(option.id, editOptionForm)}
                                  disabled={loading}
                                  title="保存选项"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E36F2C] text-white transition hover:bg-[#C95E22] disabled:opacity-60"
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOptionId(null)
                                    setEditOptionForm(EMPTY_OPTION_FORM)
                                  }}
                                  disabled={loading}
                                  title="取消编辑"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:text-[#1E2C31] disabled:opacity-60"
                                >
                                  <X size={15} />
                                </button>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-[#1E2C31]">{option.label_zh}</span>
                              <span>{option.label_en}</span>
                              <span>{option.sort_order}</span>
                              <span>{option.product_count ?? 0}</span>
                              <span>
                                <span className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${statusClass(option.status)}`}>
                                  {statusLabel(option.status)}
                                </span>
                              </span>
                              <span className="font-semibold text-[#1889B6]">{option.slug}</span>
                              <span className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOptionId(option.id)
                                    setEditOptionForm(toOptionForm(option))
                                  }}
                                  disabled={loading}
                                  title="编辑选项"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:opacity-60"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOption(option)}
                                  disabled={loading}
                                  title={option.status === 'visible' ? '隐藏选项' : '显示选项'}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:opacity-60"
                                >
                                  {option.status === 'visible' ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                              </span>
                            </>
                          )}
                        </div>
                      )
                    })}
                    {template.options.length === 0 ? (
                      <div className="border-t border-[#EEF3F3] px-4 py-6 text-center text-sm text-[#8A8580]">
                        暂无选项
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {sortedTemplates.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#D8E7E8] bg-white p-8 text-center text-sm text-[#8A8580]">
            暂无属性模板
          </div>
        ) : null}
      </div>
    </section>
  )
}
