'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { ProductCategoryRow } from '@/lib/product-catalog-db'

type ProductCategoryOption = Pick<ProductCategoryRow, 'id' | 'title_zh' | 'title_en'>

const plannedBatchActions = ['转移橱窗', '标记', '状态', '置顶', '删除', '翻译']

export default function ProductBatchCategoryBar({
  categories,
}: {
  categories: ProductCategoryOption[]
}) {
  const router = useRouter()
  const [selectedCount, setSelectedCount] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [moving, setMoving] = useState(false)

  const categoryName = useMemo(
    () => categories.find((category) => String(category.id) === categoryId)?.title_zh ?? '',
    [categories, categoryId],
  )

  const refreshSelectedCount = () => {
    const checked = document.querySelectorAll<HTMLInputElement>('[data-product-batch-checkbox]:checked')
    setSelectedCount(checked.length)
  }

  useEffect(() => {
    const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>('[data-product-batch-checkbox]'))
    checkboxes.forEach((checkbox) => checkbox.addEventListener('change', refreshSelectedCount))
    refreshSelectedCount()

    return () => {
      checkboxes.forEach((checkbox) => checkbox.removeEventListener('change', refreshSelectedCount))
    }
  }, [])

  const toggleAll = () => {
    const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>('[data-product-batch-checkbox]'))
    const shouldCheck = selectedCount !== checkboxes.length
    checkboxes.forEach((checkbox) => {
      checkbox.checked = shouldCheck
    })
    refreshSelectedCount()
  }

  const moveCategory = async () => {
    const ids = Array.from(document.querySelectorAll<HTMLInputElement>('[data-product-batch-checkbox]:checked'))
      .map((checkbox) => checkbox.value)
      .filter(Boolean)

    if (ids.length === 0) {
      toast.error('请先选择产品')
      return
    }
    if (!categoryId) {
      toast.error('请选择目标分类')
      return
    }
    if (!window.confirm(`确认将 ${ids.length} 个产品转移到“${categoryName}”？`)) return

    setMoving(true)
    try {
      const res = await fetch('/api/admin/products/batch/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, category_id: Number(categoryId) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? '批量转移失败')

      toast.success(`已转移 ${Number(data.data?.updatedCount ?? 0)} 个产品`)
      document.querySelectorAll<HTMLInputElement>('[data-product-batch-checkbox]').forEach((checkbox) => {
        checkbox.checked = false
      })
      setSelectedCount(0)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量转移失败')
    } finally {
      setMoving(false)
    }
  }

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1E2C31]">批量操作</p>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            对照 300 产品列表底部工具栏；当前只开放低风险的批量转移分类。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
          >
            {selectedCount > 0 ? '取消选择' : '选择本页'}
          </button>
          <span className="rounded-full border border-[#D8E7E8] bg-white px-2.5 py-1 text-xs font-semibold text-[#61767D]">
            已选 {selectedCount} 个
          </span>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={selectedCount === 0 || moving || categories.length === 0}
            className="h-8 w-40 text-xs"
            data-testid="product-batch-category-select"
          >
            <option value="">目标分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title_zh}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={selectedCount === 0 || !categoryId || moving}
            onClick={moveCategory}
            data-testid="product-batch-category-button"
          >
            <Tag size={13} />
            转移分类
          </Button>
          <span className="hidden h-5 w-px bg-[#D8E7E8] xl:inline-flex" />
          {plannedBatchActions.map((action) => (
            <span
              key={action}
              className="inline-flex h-8 items-center rounded-md border border-dashed border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#9AA9AD]"
              title="对照 300 产品列表批量工具栏；本阶段只展示规划位，不开放批量写入。"
            >
              {action}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
