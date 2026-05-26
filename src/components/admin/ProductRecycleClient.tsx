'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'

type DeletedProductItem = {
  id: string
  name_cn: string
  name_en: string
  productSeries: string
  category_title_zh: string | null
  status: 'draft' | 'published'
  updated_at: string
  deleted_at: string | null
}

function formatDate(ts: string | null) {
  if (!ts) return '未记录'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function ProductRecycleClient({
  initialRows,
  total,
}: {
  initialRows: DeletedProductItem[]
  total: number
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [pendingRestore, setPendingRestore] = useState<DeletedProductItem | null>(null)
  const [restoring, setRestoring] = useState(false)

  const handleRestore = async () => {
    if (!pendingRestore) return

    setRestoring(true)
    try {
      const res = await fetch(`/api/admin/products/${pendingRestore.id}/restore`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '恢复失败')
      }
      toast.success('已恢复为草稿')
      setRows((current) => current.filter((row) => row.id !== pendingRestore.id))
      setPendingRestore(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '恢复失败')
    } finally {
      setRestoring(false)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#D8E7E8] bg-white py-16">
        <p className="text-sm font-semibold text-[#1E2C31]">回收站暂无可恢复产品</p>
        <p className="max-w-md text-center text-xs leading-5 text-[#61767D]">
          已删除产品会保留在数据库里；本页只开放恢复为草稿，不提供永久删除。
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/content/products/list">返回产品列表</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-4 py-3 text-xs leading-5 text-[#61767D]">
        共 {total} 个已删除产品。恢复会统一变为草稿，不会直接重新发布到前台。
      </div>

      <div className="overflow-x-auto rounded-md border border-[#D8E7E8] bg-white">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1fr_120px_120px_120px_150px_130px] gap-3 border-b border-[#D8E7E8] bg-[#F7FAFA] px-4 py-3 text-xs font-semibold text-[#61767D]">
            <span>产品</span>
            <span>系列</span>
            <span>分类</span>
            <span>删除前状态</span>
            <span>删除时间</span>
            <span>操作</span>
          </div>
          {rows.map((item) => (
            <div
              key={item.id}
              data-testid={`product-recycle-row-${item.id}`}
              className="grid grid-cols-[1fr_120px_120px_120px_150px_130px] items-center gap-3 border-b border-[#E6EEEE] px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1E2C31]">{item.name_cn || '未命名产品'}</p>
                <p className="mt-0.5 truncate text-xs text-[#61767D]">{item.name_en || item.id}</p>
                <p className="mt-1 font-mono text-[11px] text-[#8A9AA0]">{item.id}</p>
              </div>
              <p className="text-xs text-[#61767D]">{item.productSeries}</p>
              <div>
                {item.category_title_zh ? (
                  <Badge className="border-[#D8E7E8] bg-[#F7FAFA] text-xs text-[#61767D]">
                    {item.category_title_zh}
                  </Badge>
                ) : (
                  <span className="text-xs text-[#A8B5B8]">未分类</span>
                )}
              </div>
              <div>
                {item.status === 'published' ? (
                  <Badge className="border-green-200 bg-green-50 text-xs text-green-700">已发布</Badge>
                ) : (
                  <Badge className="border-[#E5DED4] bg-[#FAF7F2] text-xs text-[#8A8580]">草稿</Badge>
                )}
              </div>
              <p className="text-xs text-[#61767D]">{formatDate(item.deleted_at)}</p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid={`product-recycle-restore-${item.id}`}
                  onClick={() => setPendingRestore(item)}
                >
                  <RotateCcw size={14} />
                  恢复
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminConfirmDialog
        open={!!pendingRestore}
        onOpenChange={(open) => {
          if (!open) setPendingRestore(null)
        }}
        title="恢复这个产品？"
        description={`“${pendingRestore?.name_cn ?? ''}”会恢复为草稿，不会直接重新发布到前台。`}
        confirmLabel="恢复为草稿"
        loading={restoring}
        onConfirm={handleRestore}
      />
    </div>
  )
}
