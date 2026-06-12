'use client'

import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Eye, EyeOff, Pencil, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ProductFilterScope, ProductOperationStatus } from '@/lib/product-operations-db'

export type ProductOperationKind = 'marks' | 'brands' | 'filters' | 'showcases'

export type ProductOperationItem = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  description_zh: string | null
  description_en: string | null
  sort_order: number
  status: ProductOperationStatus
  created_at: string
  updated_at: string
  product_count?: number
  color?: string | null
  logo_url?: string | null
  scope?: ProductFilterScope
  attribute_template_ids?: number[]
  attribute_template_titles?: string[]
  product_ids?: string[]
}

export type ProductOperationRelationOption = {
  id: number | string
  title: string
  detail?: string
}

type FormState = {
  slug: string
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  sort_order: string
  status: ProductOperationStatus
  color: string
  logo_url: string
  scope: ProductFilterScope
  relation_ids: string[]
}
type FormSetter = Dispatch<SetStateAction<FormState>>

const EMPTY_FORM: FormState = {
  slug: '',
  title_zh: '',
  title_en: '',
  description_zh: '',
  description_en: '',
  sort_order: '100',
  status: 'visible',
  color: '#E36F2C',
  logo_url: '',
  scope: 'all',
  relation_ids: [],
}

const COPY: Record<ProductOperationKind, {
  title: string
  createTitle: string
  description: string
  empty: string
  relationTitle?: string
  relationHint?: string
}> = {
  marks: {
    title: '当前标记',
    createTitle: '新增标记',
    description: '对照 300 的标记管理，用于给产品打运营标签，不做物理删除。',
    empty: '暂无标记',
  },
  brands: {
    title: '当前品牌',
    createTitle: '新增品牌',
    description: '对照 300 的品牌管理，用于维护产品品牌归属和品牌展示信息。',
    empty: '暂无品牌',
  },
  filters: {
    title: '当前筛选组',
    createTitle: '新增筛选组',
    description: '对照 300.cn 后台的筛选管理，把属性模板组合成运营筛选组，为后续前台筛选打底。',
    empty: '暂无筛选组',
    relationTitle: '包含属性模板',
    relationHint: '选择后，该筛选组会引用这些属性模板。',
  },
  showcases: {
    title: '当前橱窗',
    createTitle: '新增橱窗',
    description: '对照 300.cn 后台的橱窗管理，用于运营人员把重点产品编组成展示橱窗。',
    empty: '暂无橱窗',
    relationTitle: '包含产品',
    relationHint: '选择后，产品会加入该橱窗。',
  },
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function statusLabel(status: ProductOperationStatus) {
  return status === 'visible' ? '显示' : '隐藏'
}

function statusClass(status: ProductOperationStatus) {
  return status === 'visible'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function toFormState(kind: ProductOperationKind, item: ProductOperationItem): FormState {
  return {
    slug: item.slug,
    title_zh: item.title_zh,
    title_en: item.title_en,
    description_zh: item.description_zh ?? '',
    description_en: item.description_en ?? '',
    sort_order: String(item.sort_order),
    status: item.status,
    color: item.color ?? '#E36F2C',
    logo_url: item.logo_url ?? '',
    scope: item.scope ?? 'all',
    relation_ids: kind === 'filters'
      ? (item.attribute_template_ids ?? []).map(String)
      : kind === 'showcases'
        ? (item.product_ids ?? []).map(String)
        : [],
  }
}

function buildPayload(kind: ProductOperationKind, form: FormState) {
  const sortOrder = Number(form.sort_order)
  const payload: Record<string, unknown> = {
    slug: normalizeSlug(form.slug),
    title_zh: form.title_zh.trim(),
    title_en: form.title_en.trim(),
    description_zh: form.description_zh.trim() || null,
    description_en: form.description_en.trim() || null,
    sort_order: Number.isInteger(sortOrder) ? sortOrder : 100,
    status: form.status,
  }

  if (kind === 'marks') payload.color = form.color.trim() || null
  if (kind === 'brands') payload.logo_url = form.logo_url.trim() || null
  if (kind === 'filters') {
    payload.scope = form.scope
    payload.attribute_template_ids = form.relation_ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  }
  if (kind === 'showcases') payload.product_ids = form.relation_ids

  return payload
}

export default function ProductOperationManagerClient({
  kind,
  initialItems,
  relationOptions = [],
}: {
  kind: ProductOperationKind
  initialItems: ProductOperationItem[]
  relationOptions?: ProductOperationRelationOption[]
}) {
  const router = useRouter()
  const copy = COPY[kind]
  const [items, setItems] = useState(initialItems)
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [items],
  )

  const refreshItems = async () => {
    const res = await fetch(`/api/admin/products/operations/${kind}?includeHidden=1`, { cache: 'no-store' })
    if (!res.ok) throw new Error('刷新失败')
    const data = await res.json() as { data: ProductOperationItem[] }
    setItems(data.data)
    router.refresh()
  }

  const validateForm = (form: FormState) => {
    const payload = buildPayload(kind, form)
    if (!payload.slug || !payload.title_zh || !payload.title_en) {
      toast.error('请填写 slug、中文名称和英文名称')
      return null
    }
    if (Number(payload.sort_order) < 0 || Number(payload.sort_order) > 9999) {
      toast.error('排序值需要在 0-9999 之间')
      return null
    }
    return payload
  }

  const handleCreate = async () => {
    const payload = validateForm(createForm)
    if (!payload) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/operations/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '新增失败')
      }
      toast.success('已新增')
      setCreateForm(EMPTY_FORM)
      await refreshItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新增失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: number, form: FormState) => {
    const payload = validateForm(form)
    if (!payload) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/operations/${kind}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '保存失败')
      }
      toast.success('已保存')
      setEditingId(null)
      setEditForm(EMPTY_FORM)
      await refreshItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (item: ProductOperationItem) => {
    const nextStatus: ProductOperationStatus = item.status === 'visible' ? 'hidden' : 'visible'
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/operations/${kind}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '状态更新失败')
      }
      toast.success(nextStatus === 'visible' ? '已显示' : '已隐藏')
      await refreshItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '状态更新失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleRelation = (
    form: FormState,
    setForm: FormSetter,
    id: string,
    checked: boolean,
  ) => {
    const next = new Set(form.relation_ids)
    if (checked) next.add(id)
    else next.delete(id)
    setForm({ ...form, relation_ids: Array.from(next) })
  }

  const renderExtraFields = (
    form: FormState,
    setForm: FormSetter,
    prefix: string,
  ) => {
    if (kind === 'marks') {
      return (
        <Input
          data-testid={`${prefix}-color`}
          placeholder="颜色"
          value={form.color}
          onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
        />
      )
    }
    if (kind === 'brands') {
      return (
        <Input
          data-testid={`${prefix}-logo-url`}
          placeholder="品牌 Logo URL"
          value={form.logo_url}
          onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))}
        />
      )
    }
    if (kind === 'filters') {
      return (
        <Select
          data-testid={`${prefix}-scope`}
          value={form.scope}
          onChange={(e) => setForm((prev) => ({ ...prev, scope: e.target.value as ProductFilterScope }))}
        >
          <option value="all">全部产品</option>
          <option value="category">按分类</option>
          <option value="brand">按品牌</option>
        </Select>
      )
    }
    return null
  }

  const renderRelations = (
    form: FormState,
    setForm: FormSetter,
    prefix: string,
  ) => {
    if (!copy.relationTitle) return null
    const selected = new Set(form.relation_ids)
    return (
      <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3">
        <div>
          <p className="text-xs font-bold text-[#2C2A28]">{copy.relationTitle}</p>
          {copy.relationHint ? <p className="mt-1 text-[11px] leading-5 text-[#8A8580]">{copy.relationHint}</p> : null}
        </div>
        <div className="mt-3 flex max-h-72 flex-wrap gap-2 overflow-auto pr-1">
          {relationOptions.length === 0 ? (
            <span className="text-xs text-[#8A8580]">暂无可选项</span>
          ) : (
            relationOptions.map((option) => {
              const value = String(option.id)
              const checked = selected.has(value)
              return (
                <label
                  key={value}
                  data-testid={`${prefix}-relation-${value}`}
                  className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                    checked
                      ? 'border-[#E36F2C] bg-[#FFF2E7] text-[#B85D21]'
                      : 'border-[#E5DED4] bg-white text-[#6B6560] hover:border-[#E36F2C]/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleRelation(form, setForm, value, e.target.checked)}
                    className="h-4 w-4 accent-[#E36F2C]"
                  />
                  <span>{option.title}</span>
                  {option.detail ? <span className="font-normal text-[#8A8580]">{option.detail}</span> : null}
                </label>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4" data-testid={`product-${kind}-manager`}>
      <div>
        <h2 className="text-xl font-bold text-[#1E2C31]">{copy.title}</h2>
        <p className="mt-1 text-sm text-[#61767D]">{copy.description}</p>
      </div>

      <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#1E2C31]">{copy.createTitle}</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[150px_150px_150px_90px_120px_150px_minmax(0,1fr)]">
          <Input
            data-testid={`product-${kind}-create-slug`}
            placeholder="slug"
            value={createForm.slug}
            onChange={(e) => setCreateForm((form) => ({ ...form, slug: e.target.value }))}
          />
          <Input
            data-testid={`product-${kind}-create-title-zh`}
            placeholder="中文名称"
            value={createForm.title_zh}
            onChange={(e) => setCreateForm((form) => ({ ...form, title_zh: e.target.value }))}
          />
          <Input
            data-testid={`product-${kind}-create-title-en`}
            placeholder="英文名称"
            value={createForm.title_en}
            onChange={(e) => setCreateForm((form) => ({ ...form, title_en: e.target.value }))}
          />
          <Input
            data-testid={`product-${kind}-create-sort-order`}
            type="number"
            min={0}
            max={9999}
            placeholder="排序"
            value={createForm.sort_order}
            onChange={(e) => setCreateForm((form) => ({ ...form, sort_order: e.target.value }))}
          />
          <Select
            data-testid={`product-${kind}-create-status`}
            value={createForm.status}
            onChange={(e) => setCreateForm((form) => ({ ...form, status: e.target.value as ProductOperationStatus }))}
          >
            <option value="visible">显示</option>
            <option value="hidden">隐藏</option>
          </Select>
          {renderExtraFields(createForm, setCreateForm, `product-${kind}-create`)}
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            data-testid={`product-${kind}-create-submit`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            新增
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <textarea
            placeholder="中文说明"
            value={createForm.description_zh}
            onChange={(e) => setCreateForm((form) => ({ ...form, description_zh: e.target.value }))}
            className="min-h-20 rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
          />
          <textarea
            placeholder="英文说明"
            value={createForm.description_en}
            onChange={(e) => setCreateForm((form) => ({ ...form, description_en: e.target.value }))}
            className="min-h-20 rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
          />
        </div>
        {renderRelations(createForm, setCreateForm, `product-${kind}-create`)}
      </div>

      <div className="space-y-3">
        {sortedItems.map((item) => {
          const editing = editingId === item.id
          const relationSummary = kind === 'filters'
            ? (item.attribute_template_titles ?? []).join(' / ')
            : kind === 'showcases'
              ? `${item.product_count ?? 0} 个产品`
              : `${item.product_count ?? 0} 个产品`

          return (
            <article key={item.id} className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-[150px_150px_150px_90px_120px_150px_auto_auto]">
                    <Input value={editForm.slug} onChange={(e) => setEditForm((form) => ({ ...form, slug: e.target.value }))} />
                    <Input value={editForm.title_zh} onChange={(e) => setEditForm((form) => ({ ...form, title_zh: e.target.value }))} />
                    <Input value={editForm.title_en} onChange={(e) => setEditForm((form) => ({ ...form, title_en: e.target.value }))} />
                    <Input type="number" min={0} max={9999} value={editForm.sort_order} onChange={(e) => setEditForm((form) => ({ ...form, sort_order: e.target.value }))} />
                    <Select value={editForm.status} onChange={(e) => setEditForm((form) => ({ ...form, status: e.target.value as ProductOperationStatus }))}>
                      <option value="visible">显示</option>
                      <option value="hidden">隐藏</option>
                    </Select>
                    {renderExtraFields(editForm, setEditForm, `product-${kind}-edit-${item.id}`)}
                    <button
                      type="button"
                      onClick={() => handleUpdate(item.id, editForm)}
                      disabled={loading}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22] disabled:opacity-60"
                    >
                      <Check size={16} />
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditForm(EMPTY_FORM)
                      }}
                      disabled={loading}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#61767D] transition hover:text-[#1E2C31] disabled:opacity-60"
                    >
                      <X size={16} />
                      取消
                    </button>
                  </div>
                  <textarea
                    value={editForm.description_zh}
                    onChange={(e) => setEditForm((form) => ({ ...form, description_zh: e.target.value }))}
                    className="min-h-20 w-full rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
                  />
                  {renderRelations(editForm, setEditForm, `product-${kind}-edit-${item.id}`)}
                </div>
              ) : (
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.color ? (
                        <span className="h-4 w-4 rounded-full border border-[#D8E7E8]" style={{ backgroundColor: item.color }} />
                      ) : null}
                      <h3 className="text-base font-bold text-[#1E2C31]">{item.title_zh}</h3>
                      <span className="text-sm font-semibold text-[#61767D]">{item.title_en}</span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#1889B6]">{item.slug}</p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">{item.description_zh ?? '暂无说明'}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#8A9EA4]">
                      <span>排序 {item.sort_order}</span>
                      <span>{relationSummary || '暂无关联'}</span>
                      {item.logo_url ? <span>已配置 Logo</span> : null}
                      {item.scope ? <span>范围 {item.scope}</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id)
                        setEditForm(toFormState(kind, item))
                      }}
                      disabled={loading}
                      title="编辑"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:opacity-60"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      disabled={loading}
                      title={item.status === 'visible' ? '隐藏' : '显示'}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:opacity-60"
                    >
                      {item.status === 'visible' ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
        {sortedItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#D8E7E8] bg-white p-8 text-center text-sm text-[#8A8580]">
            {copy.empty}
          </div>
        ) : null}
      </div>
    </section>
  )
}
