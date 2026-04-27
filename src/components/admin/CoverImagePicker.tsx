'use client'

import { useState, useEffect } from 'react'
import { ImagePlus, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MediaItem {
  id: string
  url: string
  filename: string | null
  size: number | null
}

interface Props {
  value: string | null
  onChange: (url: string | null) => void
}

export default function CoverImagePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/admin/media?limit=100', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { uploads?: MediaItem[] } | null) => {
        if (data?.uploads) setImages(data.uploads)
      })
      .catch(() => void 0)
      .finally(() => setLoading(false))
  }, [open])

  const handlePick = (url: string) => {
    onChange(url)
    setOpen(false)
  }

  return (
    <>
      {value ? (
        <div className="flex items-start gap-3">
          <div className="w-40 h-[100px] rounded-md overflow-hidden border border-[#E5DED4] bg-[#FAF7F2] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="封面图" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
              <RefreshCw size={14} />
              更换
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={() => onChange(null)}
            >
              <X size={14} />
              移除
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-lg border border-dashed border-[#E5DED4] hover:border-[#E36F2C] text-[#8A8580] hover:text-[#E36F2C] transition-colors bg-[#FFFFFF]"
        >
          <ImagePlus size={24} />
          <span className="text-sm">选择封面图</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>选择封面图</DialogTitle>
            <DialogDescription>从图片库选择,点击即用</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12 text-[#8A8580] text-sm">
              加载中…
            </div>
          ) : images.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-[#8A8580] text-sm">图片库为空</p>
              <p className="text-[#4A4744] text-xs">请先在「图片库」页面上传图片</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto -mx-1 px-1">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handlePick(img.url)}
                    title={img.filename ?? ''}
                    className="group relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-[#E36F2C] focus:outline-none focus:border-[#E36F2C] transition-colors bg-[#FAF7F2]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.filename ?? ''}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white truncate">{img.filename ?? '—'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
