'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ListChecks, Tag } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { ProductCategoryRow } from '@/lib/product-catalog-db'
import type { ProductMarkRow, ProductShowcaseRow } from '@/lib/product-operations-db'

type ProductCategoryOption = Pick<ProductCategoryRow, 'id' | 'title_zh' | 'title_en'>
type ProductMarkOption = Pick<ProductMarkRow, 'id' | 'title_zh' | 'title_en' | 'status'>
type ProductShowcaseOption = Pick<ProductShowcaseRow, 'id' | 'title_zh' | 'title_en' | 'status'>
type PendingBatchAction = {
  ids: string[]
  kind: 'category' | 'mark' | 'showcase'
  targetId: string
  targetName: string
}

const plannedBatchActions = ['状态', '置顶', '删除', '翻译']

export default function ProductBatchCategoryBar({
  categories,
  marks = [],
  showcases = [],
}: {
  categories: ProductCategoryOption[]
  marks?: ProductMarkOption[]
  showcases?: ProductShowcaseOption[]
}) {
  const router = useRouter()
  const [selectedCount, setSelectedCount] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [markId, setMarkId] = useState('')
  const [showcaseId, setShowcaseId] = useState('')
  const [moving, setMoving] = useState(false)
  const [marking, setMarking] = useState(false)
  const [showcasing, setShowcasing] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingBatchAction | null>(null)
  const busy = moving || marking || showcasing

  const categoryName = useMemo(
    () => categories.find((category) => String(category.id) === categoryId)?.title_zh ?? '',
    [categories, categoryId],
  )
  const markName = useMemo(
    () => marks.find((mark) => String(mark.id) === markId)?.title_zh ?? '',
    [marks, markId],
  )
  const showcaseName = useMemo(
    () => showcases.find((showcase) => String(showcase.id) === showcaseId)?.title_zh ?? '',
    [showcases, showcaseId],
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

  const getSelectedIds = () => (
    Array.from(document.querySelectorAll<HTMLInputElement>('[data-product-batch-checkbox]:checked'))
      .map((checkbox) => checkbox.value)
      .filter(Boolean)
  )

  const clearSelection = () => {
    document.querySelectorAll<HTMLInputElement>('[data-product-batch-checkbox]').forEach((checkbox) => {
      checkbox.checked = false
    })
    setSelectedCount(0)
  }

  const runMoveCategory = async (ids: string[], targetId: string) => {
    setMoving(true)
    try {
      const res = await fetch('/api/admin/products/batch/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, category_id: Number(targetId) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? '批量转移失败')

      toast.success(`已转移 ${Number(data.data?.updatedCount ?? 0)} 个产品`)
      clearSelection()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量转移失败')
    } finally {
      setMoving(false)
    }
  }

  const runAddMark = async (ids: string[], targetId: string) => {
    setMarking(true)
    try {
      const res = await fetch('/api/admin/products/batch/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, mark_id: Number(targetId) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? '批量标记失败')

      toast.success(`已标记 ${Number(data.data?.updatedCount ?? 0)} 个产品`)
      clearSelection()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量标记失败')
    } finally {
      setMarking(false)
    }
  }

  const runAddShowcase = async (ids: string[], targetId: string) => {
    setShowcasing(true)
    try {
      const res = await fetch('/api/admin/products/batch/showcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, showcase_id: Number(targetId) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? '转移橱窗失败')

      toast.success(`已加入橱窗 ${Number(data.data?.updatedCount ?? 0)} 个产品`)
      clearSelection()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '转移橱窗失败')
    } finally {
      setShowcasing(false)
    }
  }

  const requestBatchAction = (kind: PendingBatchAction['kind']) => {
    const ids = getSelectedIds()
    if (ids.length === 0) {
      toast.error('请先选择产品')
      return
    }

    if (kind === 'category') {
      if (!categoryId) {
        toast.error('请选择目标分类')
        return
      }
      setPendingAction({ ids, kind, targetId: categoryId, targetName: categoryName })
      return
    }

    if (kind === 'mark') {
      if (!markId) {
        toast.error('请选择标记')
        return
      }
      setPendingAction({ ids, kind, targetId: markId, targetName: markName })
      return
    }

    if (!showcaseId) {
      toast.error('请选择橱窗')
      return
    }
    setPendingAction({ ids, kind, targetId: showcaseId, targetName: showcaseName })
  }

  const handleConfirmBatchAction = async () => {
    if (!pendingAction) return

    if (pendingAction.kind === 'category') {
      await runMoveCategory(pendingAction.ids, pendingAction.targetId)
    } else if (pendingAction.kind === 'mark') {
      await runAddMark(pendingAction.ids, pendingAction.targetId)
    } else {
      await runAddShowcase(pendingAction.ids, pendingAction.targetId)
    }
    setPendingAction(null)
  }

  const confirmCopy = pendingAction
    ? {
        category: {
          title: '确认转移产品分类',
          description: `确认将 ${pendingAction.ids.length} 个产品转移到“${pendingAction.targetName}”？`,
          confirmLabel: '确认转移',
        },
        mark: {
          title: '确认批量添加标记',
          description: `确认给 ${pendingAction.ids.length} 个产品添加“${pendingAction.targetName}”标记？`,
          confirmLabel: '确认标记',
        },
        showcase: {
          title: '确认加入产品橱窗',
          description: `确认将 ${pendingAction.ids.length} 个产品加入“${pendingAction.targetName}”橱窗？`,
          confirmLabel: '确认加入',
        },
      }[pendingAction.kind]
    : null

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1E2C31]">批量操作</p>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            批量处理产品分类、标记和橱窗归属，适合列表页集中整理。
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
            onClick={() => requestBatchAction('category')}
            data-testid="product-batch-category-button"
          >
            <Tag size={13} />
            转移分类
          </Button>
          <Select
            value={markId}
            onChange={(e) => setMarkId(e.target.value)}
            disabled={selectedCount === 0 || marking || marks.length === 0}
            className="h-8 w-36 text-xs"
            data-testid="product-batch-mark-select"
          >
            <option value="">目标标记</option>
            {marks.map((mark) => (
              <option key={mark.id} value={mark.id}>
                {mark.title_zh}{mark.status === 'hidden' ? '（隐藏）' : ''}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={selectedCount === 0 || !markId || marking}
            onClick={() => requestBatchAction('mark')}
            data-testid="product-batch-mark-button"
          >
            <Tag size={13} />
            标记
          </Button>
          <Select
            value={showcaseId}
            onChange={(e) => setShowcaseId(e.target.value)}
            disabled={selectedCount === 0 || showcasing || showcases.length === 0}
            className="h-8 w-36 text-xs"
            data-testid="product-batch-showcase-select"
          >
            <option value="">目标橱窗</option>
            {showcases.map((showcase) => (
              <option key={showcase.id} value={showcase.id}>
                {showcase.title_zh}{showcase.status === 'hidden' ? '（隐藏）' : ''}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={selectedCount === 0 || !showcaseId || showcasing}
            onClick={() => requestBatchAction('showcase')}
            data-testid="product-batch-showcase-button"
          >
            <ListChecks size={13} />
            转移橱窗
          </Button>
          <span className="hidden h-5 w-px bg-[#D8E7E8] xl:inline-flex" />
          {plannedBatchActions.map((action) => (
            <span
              key={action}
              className="inline-flex h-8 items-center rounded-md border border-dashed border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#9AA9AD]"
              title="批量工具栏规划位，后续用于集中处理更多产品字段。"
            >
              {action}
            </span>
          ))}
        </div>
      </div>
      {confirmCopy ? (
        <AdminConfirmDialog
          open={Boolean(pendingAction)}
          onOpenChange={(open) => {
            if (!open) setPendingAction(null)
          }}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          loading={busy}
          onConfirm={handleConfirmBatchAction}
        />
      ) : null}
    </div>
  )
}
