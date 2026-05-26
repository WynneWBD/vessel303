'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'

type ProductListDeleteActionProps = {
  productId: string
  productName: string
}

export default function ProductListDeleteAction({
  productId,
  productName,
}: ProductListDeleteActionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : '移入回收站失败')
      }

      toast.success('已移入回收站')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '移入回收站失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        title="移入回收站"
        aria-label={`将产品 ${productName || productId} 移入回收站`}
        data-testid={`product-list-delete-${productId}`}
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#8A9EA4] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={14} />
      </button>
      <AdminConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="确认移入回收站？"
        description={`将把「${productName || productId}」移入产品回收站。前台不再展示，后续可在回收站恢复为草稿。`}
        confirmLabel="移入回收站"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
