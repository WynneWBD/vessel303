'use client'

import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConfirmTone = 'default' | 'warning' | 'danger'

type AdminConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: ConfirmTone
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

function toneClass(tone: ConfirmTone) {
  if (tone === 'danger') return 'bg-red-600/10 text-red-600'
  if (tone === 'warning') return 'bg-[#E36F2C]/10 text-[#E36F2C]'
  return 'bg-[#F5F2ED] text-[#8A8580]'
}

export default function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = '取消',
  tone = 'warning',
  loading = false,
  onConfirm,
}: AdminConfirmDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return
    onOpenChange(nextOpen)
  }

  const handleConfirm = () => {
    void onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClass(tone)}`}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2 leading-6">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'destructive' : 'default'}
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '处理中...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
