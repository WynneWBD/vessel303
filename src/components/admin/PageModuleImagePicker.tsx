'use client'

import { useCallback, useRef, useState } from 'react'
import { upload as blobUpload } from '@vercel/blob/client'
import { ImageIcon, ImagePlus, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getImageVariantUrl } from '@/lib/image-optimization'

type MediaItem = {
  id: string
  url: string
  filename: string | null
  size: number | null
  variants?: unknown
}

type Props = {
  value: string
  maxUploadMb: number
  onChange: (url: string) => void
  commitLabel?: string
}

const BYTES_PER_MB = 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'
const ACCEPT_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

function normalizeMaxUploadMb(value: number): number {
  if (!Number.isFinite(value)) return 20
  return Math.min(100, Math.max(1, Math.round(value)))
}

function formatBytes(n: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function buildBlobPath(file: File) {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const safe = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_').slice(0, 80) || 'file'
  return `uploads/${y}/${m}/${crypto.randomUUID()}-${safe}`
}

export default function PageModuleImagePicker({
  value,
  maxUploadMb,
  onChange,
  commitLabel = '保存当前模块',
}: Props) {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadLimitMb = normalizeMaxUploadMb(maxUploadMb)
  const uploadLimitBytes = uploadLimitMb * BYTES_PER_MB

  const loadImages = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch('/api/admin/media?limit=100', { cache: 'no-store' })
      if (!res.ok) throw new Error('图片库加载失败')
      const data = (await res.json()) as { uploads?: MediaItem[] }
      setImages(data.uploads ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : '图片库加载失败'
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const openPicker = () => {
    setOpen(true)
    void loadImages()
  }

  const handlePick = (url: string) => {
    onChange(url)
    setOpen(false)
    toast.success(`已选择图片，点击“${commitLabel}”后生效`)
  }

  const uploadFile = async (file: File) => {
    if (!ACCEPT_MIMES.has(file.type)) {
      toast.error('仅支持 JPEG / PNG / WebP / GIF / SVG 图片')
      return
    }
    if (file.size > uploadLimitBytes) {
      toast.error(`图片超过 ${uploadLimitMb} MB，请压缩后再上传`)
      return
    }

    setUploading(true)
    try {
      const blob = await blobUpload(buildBlobPath(file), file, {
        access: 'public',
        handleUploadUrl: '/api/admin/media',
        clientPayload: JSON.stringify({
          size: file.size,
          originalName: file.name,
        }),
      })
      onChange(blob.url)
      setOpen(false)
      toast.success(`图片已上传并回填，点击“${commitLabel}”后生效`)
      setTimeout(() => {
        void loadImages()
      }, 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : '上传失败'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      toast.message('未选择图片')
      return
    }
    void uploadFile(file)
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={openPicker}>
          <ImagePlus size={14} />
          从图片库选择
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? '上传中' : '直接上传新图'}
        </Button>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
            onClick={() => onChange('')}
          >
            <X size={14} />
            清空
          </Button>
        ) : null}
      </div>

      {!value ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-[#E5DED4] bg-white px-3 py-2 text-xs text-[#8A8580]">
          <ImageIcon size={14} />
          当前没有图片，可选择、上传或手动粘贴图片地址。
        </div>
      ) : null}

      <p className="text-[11px] leading-5 text-[#8A8580]">
        单张不超过 {uploadLimitMb} MB。选择或上传后，点击“{commitLabel}”生效。
      </p>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) void loadImages()
        }}
      >
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
          <DialogHeader>
            <DialogTitle>选择页面内容图片</DialogTitle>
            <DialogDescription>从图片库选择一张图片，点击后会回填到当前图片项。</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#E5DED4] py-2">
            <span className="text-xs text-[#8A8580]">最近 100 张图片</span>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" disabled={loading} onClick={loadImages}>
                <RefreshCw size={14} />
                刷新
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                上传新图
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-12 text-sm text-[#8A8580]">
              加载中...
            </div>
          ) : loadError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm text-[#8A8580]">{loadError}</p>
              <Button type="button" size="sm" variant="outline" onClick={loadImages}>
                重新加载
              </Button>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm text-[#8A8580]">图片库暂无图片</p>
              <p className="text-xs text-[#8A8580]">可以直接上传新图，上传成功后会自动选中。</p>
              <Button type="button" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                上传新图
              </Button>
            </div>
          ) : (
            <div className="-mx-1 flex-1 overflow-auto px-1">
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {images.map((img) => {
                  const active = img.url === value
                  return (
                    <button
                      key={img.id}
                      type="button"
                      title={img.filename ?? ''}
                      onClick={() => handlePick(img.url)}
                      className={`group relative aspect-square overflow-hidden rounded-md border-2 bg-[#FAF7F2] transition-colors focus:outline-none ${
                        active ? 'border-[#E36F2C]' : 'border-transparent hover:border-[#E36F2C] focus:border-[#E36F2C]'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageVariantUrl(img.url, img.variants, 'thumb')}
                        alt={img.filename ?? ''}
                        className="h-full w-full object-cover"
                      />
                      {active ? (
                        <span className="absolute left-1.5 top-1.5 rounded bg-[#E36F2C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          当前
                        </span>
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="truncate text-[10px] text-white">{img.filename ?? '无文件名'}</p>
                        {img.size ? <p className="text-[10px] text-white/75">{formatBytes(img.size)}</p> : null}
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
