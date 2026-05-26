'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Eye, EyeOff, Pencil, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ProductCategoryRow, ProductCategoryStatus } from '@/lib/product-catalog-db'

type CategoryFormState = {
  slug: string
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  sort_order: string
  status: ProductCategoryStatus
}

const EMPTY_FORM: CategoryFormState = {
  slug: '',
  title_zh: '',
  title_en: '',
  description_zh: '',
  description_en: '',
  sort_order: '100',
  status: 'visible',
}

function toFormState(category: ProductCategoryRow): CategoryFormState {
  return {
    slug: category.slug,
    title_zh: category.title_zh,
    title_en: category.title_en,
    description_zh: category.description_zh ?? '',
    description_en: category.description_en ?? '',
    sort_order: String(category.sort_order),
    status: category.status,
  }
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildPayload(form: CategoryFormState) {
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

function statusLabel(status: ProductCategoryStatus) {
  return status === 'visible' ? '显示' : '隐藏'
}

function statusClass(status: ProductCategoryStatus) {
  return status === 'visible'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

export default function ProductCategoryManagerClient({
  initialCategories,
}: {
  initialCategories: ProductCategoryRow[]
}) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [createForm, setCreateForm] = useState<CategoryFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<CategoryFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [categories],
  )

  const refreshCategories = async () => {
    const res = await fetch('/api/admin/products/categories?includeHidden=1', { cache: 'no-store' })
    if (!res.ok) throw new Error('分类刷新失败')
    const data = await res.json() as { data: ProductCategoryRow[] }
    setCategories(data.data)
    router.refresh()
  }

  const validateForm = (form: CategoryFormState) => {
    const payload = buildPayload(form)
    if (!payload.slug || !payload.title_zh || !payload.title_en) {
      toast.error('请填写 slug、中文分类和英文分类')
      return null
    }
    if (payload.sort_order < 0 || payload.sort_order > 9999) {
      toast.error('排序值需在 0-9999 之间')
      return null
    }
    return payload
  }

  const handleCreate = async () => {
    const payload = validateForm(createForm)
    if (!payload) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '新增分类失败')
      }
      toast.success('分类已新增')
      setCreateForm(EMPTY_FORM)
      await refreshCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新增分类失败')
    } finally {
      setLoading(false)
    }
  }

  const beginEdit = (category: ProductCategoryRow) => {
    setEditingId(category.id)
    setEditForm(toFormState(category))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(EMPTY_FORM)
  }

  const handleUpdate = async (id: number, form: CategoryFormState) => {
    const payload = validateForm(form)
    if (!payload) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '保存分类失败')
      }
      toast.success('分类已保存')
      cancelEdit()
      await refreshCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存分类失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (category: ProductCategoryRow) => {
    const nextStatus: ProductCategoryStatus = category.status === 'visible' ? 'hidden' : 'visible'
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '状态更新失败')
      }
      toast.success(nextStatus === 'visible' ? '分类已显示' : '分类已隐藏')
      await refreshCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '状态更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#1E2C31]">当前分类</h2>
        <p className="mt-1 text-sm text-[#61767D]">
          来自 product_categories 表；支持新增、编辑、排序和显示 / 隐藏，不做物理删除。
        </p>
      </div>

      <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#1E2C31]">新增分类</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[150px_150px_150px_90px_120px_minmax(0,1fr)]">
          <Input
            data-testid="product-category-create-slug"
            placeholder="slug"
            value={createForm.slug}
            onChange={(e) => setCreateForm((form) => ({ ...form, slug: e.target.value }))}
          />
          <Input
            data-testid="product-category-create-title-zh"
            placeholder="中文分类"
            value={createForm.title_zh}
            onChange={(e) => setCreateForm((form) => ({ ...form, title_zh: e.target.value }))}
          />
          <Input
            data-testid="product-category-create-title-en"
            placeholder="英文分类"
            value={createForm.title_en}
            onChange={(e) => setCreateForm((form) => ({ ...form, title_en: e.target.value }))}
          />
          <Input
            data-testid="product-category-create-sort-order"
            type="number"
            min={0}
            max={9999}
            placeholder="排序"
            value={createForm.sort_order}
            onChange={(e) => setCreateForm((form) => ({ ...form, sort_order: e.target.value }))}
          />
          <Select
            data-testid="product-category-create-status"
            value={createForm.status}
            onChange={(e) => setCreateForm((form) => ({ ...form, status: e.target.value as ProductCategoryStatus }))}
          >
            <option value="visible">显示</option>
            <option value="hidden">隐藏</option>
          </Select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            data-testid="product-category-create-submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            新增
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <textarea
            data-testid="product-category-create-description-zh"
            placeholder="中文说明"
            value={createForm.description_zh}
            onChange={(e) => setCreateForm((form) => ({ ...form, description_zh: e.target.value }))}
            className="min-h-20 rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
          />
          <textarea
            data-testid="product-category-create-description-en"
            placeholder="英文说明"
            value={createForm.description_en}
            onChange={(e) => setCreateForm((form) => ({ ...form, description_en: e.target.value }))}
            className="min-h-20 rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[170px_170px_90px_90px_90px_minmax(0,1fr)_160px] gap-4 border-b border-[#D8E7E8] bg-[#F7FAFA] px-4 py-3 text-xs font-bold text-[#61767D]">
            <span>中文分类</span>
            <span>英文分类</span>
            <span>排序</span>
            <span>产品数</span>
            <span>状态</span>
            <span>说明</span>
            <span>操作</span>
          </div>
          {sortedCategories.map((category) => {
            const editing = editingId === category.id
            return (
              <div
                key={category.id}
                data-testid={`product-category-row-${category.slug}`}
                className="grid grid-cols-[170px_170px_90px_90px_90px_minmax(0,1fr)_160px] gap-4 border-b border-[#EEF3F3] px-4 py-3 text-xs text-[#61767D] last:border-b-0"
              >
                {editing ? (
                  <>
                    <span className="space-y-2">
                      <Input
                        value={editForm.title_zh}
                        onChange={(e) => setEditForm((form) => ({ ...form, title_zh: e.target.value }))}
                      />
                      <Input
                        value={editForm.slug}
                        onChange={(e) => setEditForm((form) => ({ ...form, slug: e.target.value }))}
                      />
                    </span>
                    <span>
                      <Input
                        value={editForm.title_en}
                        onChange={(e) => setEditForm((form) => ({ ...form, title_en: e.target.value }))}
                      />
                    </span>
                    <span>
                      <Input
                        type="number"
                        min={0}
                        max={9999}
                        value={editForm.sort_order}
                        onChange={(e) => setEditForm((form) => ({ ...form, sort_order: e.target.value }))}
                      />
                    </span>
                    <span className="pt-2">{category.product_count ?? 0}</span>
                    <span>
                      <Select
                        value={editForm.status}
                        onChange={(e) => setEditForm((form) => ({ ...form, status: e.target.value as ProductCategoryStatus }))}
                      >
                        <option value="visible">显示</option>
                        <option value="hidden">隐藏</option>
                      </Select>
                    </span>
                    <span>
                      <textarea
                        value={editForm.description_zh}
                        onChange={(e) => setEditForm((form) => ({ ...form, description_zh: e.target.value }))}
                        className="min-h-20 w-full rounded-md border border-[#E5DED4] bg-white px-3 py-2 text-sm text-[#2C2A28] outline-none transition focus:border-[#E36F2C] focus:ring-2 focus:ring-[#E36F2C]/40"
                      />
                    </span>
                    <span className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(category.id, editForm)}
                        disabled={loading}
                        title="保存分类"
                        data-testid={`product-category-save-${category.slug}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E36F2C] text-white transition hover:bg-[#C95E22] disabled:opacity-60"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={loading}
                        title="取消编辑"
                        data-testid={`product-category-cancel-${category.slug}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:text-[#1E2C31] disabled:opacity-60"
                      >
                        <X size={15} />
                      </button>
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      <span className="block font-semibold text-[#1E2C31]">{category.title_zh}</span>
                      <span className="mt-1 block text-[#1889B6]">{category.slug}</span>
                    </span>
                    <span>{category.title_en}</span>
                    <span>{category.sort_order}</span>
                    <span>{category.product_count ?? 0}</span>
                    <span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${statusClass(category.status)}`}>
                        {statusLabel(category.status)}
                      </span>
                    </span>
                    <span className="leading-5">{category.description_zh ?? '暂无说明'}</span>
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => beginEdit(category)}
                        disabled={loading}
                        title="编辑分类"
                        data-testid={`product-category-edit-${category.slug}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:opacity-60"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(category)}
                        disabled={loading}
                        title={category.status === 'visible' ? '隐藏分类' : '显示分类'}
                        data-testid={`product-category-toggle-${category.slug}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:opacity-60"
                      >
                        {category.status === 'visible' ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </span>
                  </>
                )}
              </div>
            )
          })}
          {sortedCategories.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#8A8580]">暂无分类</div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
