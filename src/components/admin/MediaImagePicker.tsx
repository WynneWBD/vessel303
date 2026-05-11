'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { upload as blobUpload } from '@vercel/blob/client'
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type MediaItem = {
  id: string
  url: string
  filename: string | null
  size: number | null
}

type CommonPickerProps = {
  maxUploadMb: number
  title?: string
  description?: string
  emptyLabel?: string
  actionLabel?: string
}

type SinglePickerProps = CommonPickerProps & {
  value: string | null
  onChange: (url: string | null) => void
}

type GalleryPickerProps = CommonPickerProps & {
  value: string[]
  onChange: (urls: string[]) => void
  uploadLabel?: string
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

function validateImageFile(file: File, uploadLimitMb: number) {
  if (!ACCEPT_MIMES.has(file.type)) {
    return '仅支持 JPEG / PNG / WebP / GIF / SVG 图片'
  }
  if (file.size > uploadLimitMb * BYTES_PER_MB) {
    return `图片超过 ${uploadLimitMb} MB，请压缩后再上传`
  }
  return ''
}

async function uploadImageFile(file: File) {
  return blobUpload(buildBlobPath(file), file, {
    access: 'public',
    handleUploadUrl: '/api/admin/media',
    clientPayload: JSON.stringify({
      size: file.size,
      originalName: file.name,
    }),
  })
}

function useMediaLibrary() {
  const [images, setImages] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

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

  return { images, loading, loadError, loadImages }
}

export default function MediaImagePicker({
  value,
  onChange,
  maxUploadMb,
  title = '选择图片',
  description = '从图片库选择一张图片，或直接上传新图。',
  emptyLabel = '选择或上传图片',
  actionLabel,
}: SinglePickerProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { images, loading, loadError, loadImages } = useMediaLibrary()
  const uploadLimitMb = normalizeMaxUploadMb(maxUploadMb)

  const openPicker = () => {
    setOpen(true)
    void loadImages()
  }

  const handlePick = (url: string) => {
    onChange(url)
    setOpen(false)
    toast.success('已回填图片 URL，保存产品后生效')
  }

  const handleUpload = async (file: File) => {
    const error = validateImageFile(file, uploadLimitMb)
    if (error) {
      toast.error(error)
      return
    }

    setUploading(true)
    try {
      const blob = await uploadImageFile(file)
      onChange(blob.url)
      setOpen(false)
      toast.success('图片已上传并回填，保存产品后生效')
      setTimeout(() => {
        void loadImages()
      }, 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败')
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
    void handleUpload(file)
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

      {value ? (
        <div className="space-y-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-[#E5DED4] bg-[#FAF7F2]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openPicker}>
              <RefreshCw size={14} />
              {actionLabel ?? '更换'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? '上传中' : '上传新图'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              onClick={() => onChange(null)}
            >
              <X size={14} />
              清空
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#E5DED4] bg-[#FFFFFF] text-[#8A8580] transition-colors hover:border-[#E36F2C] hover:text-[#E36F2C]"
        >
          <ImagePlus size={24} />
          <span className="text-sm">{emptyLabel}</span>
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        {!value ? (
          <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? '上传中' : '直接上传新图'}
          </Button>
        ) : null}
        <p className="flex min-w-0 items-start gap-1 text-[11px] leading-relaxed text-[#8A8580]">
          <ImageIcon size={13} className="mt-0.5 shrink-0" />
          <span>最大 {uploadLimitMb} MB。这里只回填 URL，保存产品后才会更新前台。</span>
        </p>
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) void loadImages()
        }}
      >
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <MediaDialogToolbar
            loading={loading}
            uploading={uploading}
            onRefresh={loadImages}
            onUpload={() => fileInputRef.current?.click()}
          />
          <MediaGrid
            images={images}
            loading={loading}
            loadError={loadError}
            activeUrls={value ? new Set([value]) : new Set()}
            onRetry={loadImages}
            onPick={handlePick}
            emptyAction={
              <Button type="button" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                上传新图
              </Button>
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function MediaGalleryPicker({
  value,
  onChange,
  maxUploadMb,
  title = '选择图片组',
  description = '可多选，已选顺序就是前台图片顺序，可用箭头调整。',
  emptyLabel = '选择或上传图片组',
  actionLabel,
  uploadLabel = '上传并加入',
}: GalleryPickerProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { images, loading, loadError, loadImages } = useMediaLibrary()
  const selected = useMemo(() => new Set(value), [value])
  const uploadLimitMb = normalizeMaxUploadMb(maxUploadMb)

  const openPicker = () => {
    setOpen(true)
    void loadImages()
  }

  const appendUrl = (url: string) => {
    if (selected.has(url)) return
    onChange([...value, url])
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

  const handleUpload = async (file: File) => {
    const error = validateImageFile(file, uploadLimitMb)
    if (error) {
      toast.error(error)
      return
    }

    setUploading(true)
    try {
      const blob = await uploadImageFile(file)
      appendUrl(blob.url)
      toast.success('图片已上传并加入，保存产品后生效')
      setTimeout(() => {
        void loadImages()
      }, 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败')
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
    void handleUpload(file)
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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
                <IconButton title="前移" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowLeft size={14} />
                </IconButton>
                <IconButton title="后移" disabled={index === value.length - 1} onClick={() => move(index, 1)}>
                  <ArrowRight size={14} />
                </IconButton>
                <IconButton title="移除" danger onClick={() => remove(url)}>
                  <X size={14} />
                </IconButton>
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
          <span className="text-sm">{emptyLabel}</span>
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={openPicker}>
          <RefreshCw size={14} />
          {actionLabel ?? (value.length > 0 ? '添加/更换图片' : '从图片库选择')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? '上传中' : uploadLabel}
        </Button>
        {value.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
            onClick={() => onChange([])}
          >
            <Trash2 size={14} />
            清空
          </Button>
        ) : null}
        <span className="self-center text-[11px] text-[#8A8580]">最大 {uploadLimitMb} MB</span>
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) void loadImages()
        }}
      >
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#E5DED4] py-2">
            <span className="text-xs text-[#8A8580]">已选 {value.length} 张</span>
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
                {uploading ? '上传中' : uploadLabel}
              </Button>
            </div>
          </div>
          <MediaGrid
            images={images}
            loading={loading}
            loadError={loadError}
            activeUrls={selected}
            onRetry={loadImages}
            onPick={toggle}
            activeLabel="已选"
            emptyAction={
              <Button type="button" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                上传新图
              </Button>
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MediaDialogToolbar({
  loading,
  uploading,
  onRefresh,
  onUpload,
}: {
  loading: boolean
  uploading: boolean
  onRefresh: () => void
  onUpload: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#E5DED4] py-2">
      <span className="text-xs text-[#8A8580]">最近 100 张图片</span>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={onRefresh}>
          <RefreshCw size={14} />
          刷新
        </Button>
        <Button type="button" size="sm" disabled={uploading} onClick={onUpload}>
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          上传新图
        </Button>
      </div>
    </div>
  )
}

function MediaGrid({
  images,
  loading,
  loadError,
  activeUrls,
  onRetry,
  onPick,
  activeLabel = '当前',
  emptyAction,
}: {
  images: MediaItem[]
  loading: boolean
  loadError: string
  activeUrls: Set<string>
  onRetry: () => void
  onPick: (url: string) => void
  activeLabel?: string
  emptyAction: React.ReactNode
}) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-[#8A8580]">
        加载中...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="text-sm text-[#8A8580]">{loadError}</p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          重新加载
        </Button>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="text-sm text-[#8A8580]">图片库暂无图片</p>
        <p className="text-xs text-[#8A8580]">可以直接上传新图，上传成功后会自动回填。</p>
        {emptyAction}
      </div>
    )
  }

  return (
    <div className="-mx-1 flex-1 overflow-auto px-1">
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
        {images.map((img) => {
          const active = activeUrls.has(img.url)
          return (
            <button
              key={img.id}
              type="button"
              title={img.filename ?? ''}
              onClick={() => onPick(img.url)}
              className={`group relative aspect-square overflow-hidden rounded-md border-2 bg-[#FAF7F2] transition-colors focus:outline-none ${
                active ? 'border-[#E36F2C]' : 'border-transparent hover:border-[#E36F2C] focus:border-[#E36F2C]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.filename ?? ''} className="h-full w-full object-cover" />
              {active ? (
                <span className="absolute left-1.5 top-1.5 rounded bg-[#E36F2C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {activeLabel}
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
  )
}

function IconButton({
  title,
  disabled,
  danger,
  onClick,
  children,
}: {
  title: string
  disabled?: boolean
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        danger ? 'hover:bg-red-500' : 'hover:bg-[#E36F2C]'
      }`}
    >
      {children}
    </button>
  )
}
