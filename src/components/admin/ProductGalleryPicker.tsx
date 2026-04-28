'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, RefreshCw, Trash2, X } from 'lucide-react'
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
  value: string[]
  onChange: (urls: string[]) => void
}

export default function ProductGalleryPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const selected = useMemo(() => new Set(value), [value])

  const loadImages = () => {
    setLoading(true)
    fetch('/api/admin/media?limit=100', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { uploads?: MediaItem[] } | null) => {
        if (data?.uploads) setImages(data.uploads)
      })
      .catch(() => void 0)
      .finally(() => setLoading(false))
  }

  const openPicker = () => {
    setOpen(true)
    loadImages()
  }

  const toggle = (url: string) => {
    if (selected.has(url)) {
      onChange(value.filter((item) => item !== url))
      return
    }
    onChange([...value, url])
  }

  const remove = (url: string) => {
    onChange(value.filter((item) => item !== url))
  }

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= value.length) return
    const next = [...value]
    const current = next[index]
    next[index] = next[nextIndex]
    next[nextIndex] = current
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-[4/3] overflow-hidden rounded-md border border-[#E5DED4] bg-[#FAF7F2]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded bg-[#241F1B]/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {index + 1}
              </span>
              <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  title="前移"
                  className="flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-[#E36F2C] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  title="后移"
                  className="flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-[#E36F2C] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(url)}
                  title="移除"
                  className="flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#E5DED4] bg-[#FFFFFF] text-[#8A8580] transition-colors hover:border-[#E36F2C] hover:text-[#E36F2C]"
        >
          <ImagePlus size={22} />
          <span className="text-sm">选择详情图库</span>
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={openPicker}>
          <RefreshCw size={14} />
          {value.length > 0 ? '添加/更换图库' : '从图片库选择'}
        </Button>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
            onClick={() => onChange([])}
          >
            <Trash2 size={14} />
            清空
          </Button>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) loadImages()
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>选择详情图库</DialogTitle>
            <DialogDescription>可多选，已选顺序就是前台图库顺序，可用箭头调整。</DialogDescription>
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
                {images.map((img) => {
                  const active = selected.has(img.url)
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => toggle(img.url)}
                      title={img.filename ?? ''}
                      className={`group relative aspect-square rounded-md overflow-hidden border-2 transition-colors bg-[#FAF7F2] focus:outline-none ${
                        active ? 'border-[#E36F2C]' : 'border-transparent hover:border-[#E36F2C]'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.filename ?? ''}
                        className="w-full h-full object-cover"
                      />
                      {active && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-[#E36F2C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          已选
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="truncate text-[10px] text-white">{img.filename ?? '—'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
