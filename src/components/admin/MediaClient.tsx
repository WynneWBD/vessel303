'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { upload as blobUpload } from '@vercel/blob/client'
import {
  Copy,
  ExternalLink,
  ImagePlus,
  ImageUp,
  ImageOff,
  SearchX,
  Trash2,
  Upload as UploadIcon,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminPagination from '@/components/admin/AdminPagination'
import type {
  MediaReferenceDetails,
  MediaReferenceItems,
  MediaReferenceItem,
  Upload,
} from '@/lib/uploads-db'

const FREE_QUOTA_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB
const WARNING_BYTES = 800 * 1024 * 1024
const BATCH_LIMIT = 20
const BYTES_PER_MB = 1024 * 1024
const ADMIN_TIMEZONE_OFFSET_MINUTES = 8 * 60
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'
const ACCEPT_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

type Filters = {
  mime: string
  search: string
}

type UploadTask = {
  id: string
  name: string
  size: number
  progress: number // 0..100
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

const emptyMediaReferenceItems = (): MediaReferenceItems => ({
  news: [],
  products: [],
  projects: [],
  pages: [],
  pageDrafts: [],
  pageSnapshots: [],
})

const EMPTY_MEDIA_REFERENCES: MediaReferenceDetails = {
  news: 0,
  products: 0,
  projects: 0,
  pages: 0,
  pageDrafts: 0,
  pageSnapshots: 0,
  total: 0,
  items: emptyMediaReferenceItems(),
}

function emptyMediaReferences(): MediaReferenceDetails {
  return {
    ...EMPTY_MEDIA_REFERENCES,
    items: emptyMediaReferenceItems(),
  }
}

function normalizeMediaReferences(refs: MediaReferenceDetails): MediaReferenceDetails {
  return {
    ...refs,
    items: {
      ...emptyMediaReferenceItems(),
      ...(refs.items ?? {}),
    },
  }
}

function normalizeMaxUploadMb(value: number): number {
  if (!Number.isFinite(value)) return 20
  return Math.min(100, Math.max(1, Math.round(value)))
}

function formatBytes(n: number): string {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDate(ts: string | Date) {
  const d = ts instanceof Date ? ts : new Date(ts)
  if (isNaN(d.getTime())) return String(ts)
  const adminTime = new Date(d.getTime() + ADMIN_TIMEZONE_OFFSET_MINUTES * 60 * 1000)
  const y = adminTime.getUTCFullYear()
  const m = String(adminTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(adminTime.getUTCDate()).padStart(2, '0')
  const hh = String(adminTime.getUTCHours()).padStart(2, '0')
  const mm = String(adminTime.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm} UTC+8`
}

function mimeLabel(mime: string | null): string {
  if (!mime) return '—'
  if (mime === 'image/jpeg') return 'JPEG'
  if (mime === 'image/png') return 'PNG'
  if (mime === 'image/webp') return 'WebP'
  if (mime === 'image/gif') return 'GIF'
  if (mime === 'image/svg+xml') return 'SVG'
  return mime
}

export default function MediaClient({
  initialUploads,
  initialTotal,
  initialBytes,
  initialFilters,
  initialPage,
  initialLimit,
  maxUploadMb,
}: {
  initialUploads: Upload[]
  initialTotal: number
  initialBytes: number
  initialFilters: Filters
  initialPage: number
  initialLimit: number
  maxUploadMb: number
}) {
  const router = useRouter()
  const [uploads, setUploads] = useState<Upload[]>(initialUploads)
  const [total, setTotal] = useState(initialTotal)
  const [storageBytes, setStorageBytes] = useState(initialBytes)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Upload | null>(null)
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Upload | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const singleInputRef = useRef<HTMLInputElement>(null)
  const batchInputRef = useRef<HTMLInputElement>(null)

  const usagePct = useMemo(
    () => Math.min(100, (storageBytes / FREE_QUOTA_BYTES) * 100),
    [storageBytes],
  )
  const usageWarning = storageBytes > WARNING_BYTES
  const uploadLimitMb = useMemo(() => normalizeMaxUploadMb(maxUploadMb), [maxUploadMb])
  const uploadLimitBytes = uploadLimitMb * BYTES_PER_MB

  const hasActiveFilters = filters.mime !== 'all' || filters.search.trim().length > 0

  const resetFilters = () => {
    setFilters({ mime: 'all', search: '' })
    setPage(1)
  }

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const buildQuery = useCallback((f: Filters, paging?: { page: number; limit: number }) => {
    const sp = new URLSearchParams()
    if (f.mime && f.mime !== 'all') sp.set('mime', f.mime)
    if (f.search) sp.set('search', f.search)
    if (paging) {
      sp.set('page', String(paging.page))
      sp.set('limit', String(paging.limit))
    }
    return sp.toString()
  }, [])

  const reload = useCallback(
    async (f: Filters, nextPage: number, nextLimit: number) => {
      setLoading(true)
      try {
        const qs = buildQuery(f, { page: nextPage, limit: nextLimit })
        const res = await fetch(`/api/admin/media${qs ? `?${qs}` : ''}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('load failed')
        const data = (await res.json()) as { uploads: Upload[]; total: number; page: number; limit: number }
        setUploads(data.uploads)
        setTotal(data.total)
        setPage(data.page)
        setLimit(data.limit)
      } catch (err) {
        toast.error('加载失败')
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [buildQuery],
  )

  useEffect(() => {
    const t = setTimeout(() => reload(filters, page, limit), 300)
    return () => clearTimeout(t)
  }, [filters, page, limit, reload])

  // ─── drag & drop wiring on the whole page ────────────────────────────────
  useEffect(() => {
    let dragCounter = 0
    const hasFiles = (e: DragEvent) =>
      !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      dragCounter++
      setDragActive(true)
    }
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
    }
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      dragCounter = Math.max(0, dragCounter - 1)
      if (dragCounter === 0) setDragActive(false)
    }
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      dragCounter = 0
      setDragActive(false)
      const files = e.dataTransfer?.files
      if (files && files.length) handleFiles(Array.from(files))
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
    // handleFiles is defined below; closure captures latest via functional updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── upload pipeline ─────────────────────────────────────────────────────
  // Client-side direct-to-Blob upload via @vercel/blob/client. The API route
  // at /api/admin/media now only mints signed tokens and receives the
  // server-to-server `blob.upload-completed` callback that writes the DB row.

  const buildBlobPath = (file: File) => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const safe =
      file.name.replace(/[^a-zA-Z0-9.\-]/g, '_').slice(0, 80) || 'file'
    return `uploads/${y}/${m}/${crypto.randomUUID()}-${safe}`
  }

  const uploadOne = async (task: UploadTask, file: File): Promise<boolean> => {
    try {
      await blobUpload(buildBlobPath(file), file, {
        access: 'public',
        handleUploadUrl: '/api/admin/media',
        clientPayload: JSON.stringify({
          size: file.size,
          originalName: file.name,
        }),
        onUploadProgress: ({ percentage }) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, status: 'uploading', progress: Math.round(percentage) }
                : t,
            ),
          )
        },
      })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'done', progress: 100 } : t,
        ),
      )
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '上传失败'
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'error', error: message } : t,
        ),
      )
      return false
    }
  }

  const handleFiles = async (files: File[]) => {
    if (!files.length) return

    const accepted: File[] = []
    const rejected: { name: string; reason: string }[] = []
    for (const f of files) {
      if (!ACCEPT_MIMES.has(f.type)) {
        rejected.push({ name: f.name, reason: '非图片格式' })
        continue
      }
      if (f.size > uploadLimitBytes) {
        rejected.push({ name: f.name, reason: `超过 ${uploadLimitMb} MB` })
        continue
      }
      accepted.push(f)
      if (accepted.length >= BATCH_LIMIT) break
    }
    if (files.length > BATCH_LIMIT) {
      toast.warning(`一次最多上传 ${BATCH_LIMIT} 张,其余已忽略`)
    }
    if (rejected.length) {
      toast.error(`${rejected.length} 个文件被拒: ${rejected[0].name} — ${rejected[0].reason}`)
    }
    if (!accepted.length) return

    const newTasks: UploadTask[] = accepted.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'pending',
    }))
    setTasks((prev) => [...prev, ...newTasks])

    let successCount = 0
    for (let i = 0; i < accepted.length; i++) {
      const ok = await uploadOne(newTasks[i], accepted[i])
      if (ok) successCount++
    }

    if (successCount > 0) {
      toast.success(`已上传 ${successCount} 张,正在同步…`)
      // onUploadCompleted runs server-to-server after Blob stores the object —
      // give the DB insert a beat to land before we reload the grid.
      await new Promise((r) => setTimeout(r, 1500))
      setPage(1)
      await reload(filters, 1, limit)
      router.refresh() // keep sidebar badge + dashboard in sync
    }

    // Auto-hide task panel after a moment
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.status !== 'done'))
    }, 2000)
  }

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    handleFiles(Array.from(files))
    e.target.value = ''
  }

  const handleSelect = async (u: Upload) => {
    try {
      const res = await fetch(`/api/admin/media/${u.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = (await res.json()) as {
          upload: Upload
          refs: MediaReferenceDetails
        }
        setSelected(data.upload)
        return { refs: data.refs }
      }
    } catch {
      /* ignore */
    }
    setSelected(u)
    return { refs: emptyMediaReferences() }
  }

  const handleDelete = async (u: Upload) => {
    try {
      const res = await fetch(`/api/admin/media/${u.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '删除失败')
      }
      toast.success('已删除')
      setSelected(null)
      setUploads((prev) => prev.filter((x) => x.id !== u.id))
      setTotal((t) => Math.max(0, t - 1))
      setStorageBytes((b) => Math.max(0, b - (u.size ?? 0)))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmingDelete(true)
    try {
      await handleDelete(pendingDelete)
      setPendingDelete(null)
    } finally {
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title + stats */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-2">
          <h1
            className="text-[#2C2A28]"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            图片库 Media
          </h1>
          <div className="text-xs text-[#8A8580]">
            共 {total} 张图片 ·{' '}
            <span className={usageWarning ? 'text-[#E36F2C]' : ''}>
              已用 {formatBytes(storageBytes)}
            </span>{' '}
            / 1 GB 免费额度
          </div>
          <div className="h-1 w-64 rounded-full bg-[#E5DED4] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usagePct}%`,
                background: usageWarning ? '#E36F2C' : '#4A9EFF',
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <div className="flex items-center gap-2">
            <input
              ref={batchInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={handleSelectFile}
            />
            <input
              ref={singleInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleSelectFile}
            />
            <Button variant="outline" size="sm" onClick={() => batchInputRef.current?.click()}>
              <ImagePlus size={16} />
              批量上传
            </Button>
            <Button size="sm" onClick={() => singleInputRef.current?.click()}>
              <ImageUp size={16} />
              上传
            </Button>
          </div>
          <p className="text-[11px] text-[#8A8580]">
            支持 JPEG / PNG / WebP / GIF / SVG · 最大 {uploadLimitMb} MB · 一次最多 {BATCH_LIMIT} 张
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
        <Select
          value={filters.mime}
          onChange={(e) => updateFilters({ mime: e.target.value })}
        >
          <option value="all">类型:全部</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="gif">GIF</option>
          <option value="svg">SVG</option>
        </Select>
        <Input
          placeholder="搜索文件名"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
        />
      </div>

      {/* Grid */}
      {uploads.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#E5DED4] bg-[#FFFFFF] py-20 text-center">
          {hasActiveFilters ? (
            <SearchX size={48} className="text-[#4A4744]" />
          ) : (
            <ImageOff size={48} className="text-[#4A4744]" />
          )}
          <p className="text-[#C4B9AB]">
            {hasActiveFilters ? '没有找到符合条件的图片' : '还没有图片'}
          </p>
          <p className="text-xs text-[#6B6560]">点击右上角上传,或直接拖拽图片到此页面</p>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              清空筛选
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {uploads.map((u) => (
            <MediaCard key={u.id} upload={u} onClick={() => handleSelect(u)} />
          ))}
        </div>
      )}

      {total > 0 ? (
        <AdminPagination
          total={total}
          page={page}
          limit={limit}
          loading={loading}
          itemLabel="张图片"
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit)
            setPage(1)
          }}
        />
      ) : null}

      {loading && <div className="text-xs text-[#8A8580]">加载中…</div>}

      {/* Upload progress panel */}
      {tasks.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 w-80 rounded-lg border border-[#E5DED4] bg-[#FFFFFF] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E5DED4] px-4 py-2.5">
            <span className="text-xs text-[#C4B9AB]">
              上传进度 ({tasks.filter((t) => t.status === 'done').length}/{tasks.length})
            </span>
            <button
              onClick={() => setTasks([])}
              className="text-[#8A8580] hover:text-[#2C2A28]"
            >
              <X size={14} />
            </button>
          </div>
          <div className="max-h-64 overflow-auto p-3 flex flex-col gap-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="rounded-md bg-[#FAF7F2] border border-[#E5DED4] p-2"
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="truncate text-[#2C2A28]" title={t.name}>
                    {t.name}
                  </span>
                  <span
                    className={
                      t.status === 'error'
                        ? 'text-red-400'
                        : t.status === 'done'
                          ? 'text-green-400'
                          : 'text-[#8A8580]'
                    }
                  >
                    {t.status === 'error' ? '失败' : `${t.progress}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-[#E5DED4] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${t.progress}%`,
                      background:
                        t.status === 'error'
                          ? '#EF4444'
                          : t.status === 'done'
                            ? '#22C55E'
                            : '#E36F2C',
                    }}
                  />
                </div>
                {t.error && (
                  <div className="mt-1 text-[11px] text-red-400">{t.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {dragActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#E36F2C]/20 backdrop-blur-sm border-4 border-dashed border-[#E36F2C] pointer-events-none">
          <UploadIcon size={64} className="text-[#E36F2C]" />
          <p className="text-xl font-semibold text-white">松开鼠标上传图片</p>
          <p className="text-sm text-white/80">
            支持 JPEG / PNG / WebP / GIF / SVG · 最大 {uploadLimitMb} MB · 一次最多 {BATCH_LIMIT} 张
          </p>
        </div>
      )}

      {/* Detail sheet */}
      <MediaDetailSheet
        upload={selected}
        onClose={() => setSelected(null)}
        onDelete={setPendingDelete}
      />

      <AdminConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="确认删除这张图片？"
        description={`将删除「${pendingDelete?.filename ?? ''}」。此操作会删除 Blob 文件和媒体库记录，不可恢复。`}
        confirmLabel="确认删除"
        tone="danger"
        loading={confirmingDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

function MediaCard({ upload, onClick }: { upload: Upload; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [copyOk, setCopyOk] = useState(false)

  const copyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(upload.url)
      setCopyOk(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopyOk(false), 1500)
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-md border border-[#E5DED4] bg-[#FAF7F2] text-left focus:outline-none focus:ring-2 focus:ring-[#E36F2C]"
    >
      {!loaded && (
        <div className="absolute inset-0 bg-[#E5DED4] animate-pulse" aria-hidden />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={upload.url}
        alt={upload.filename ?? ''}
        className={`h-full w-full object-cover transition-opacity ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      {/* hover gradient + actions */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-[11px] text-white">
        <span className="truncate" title={upload.filename ?? ''}>
          {upload.filename ?? '—'}
        </span>
        <span className="shrink-0 text-white/60">
          {upload.size ? formatBytes(upload.size) : ''}
        </span>
      </div>
      <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={copyUrl}
          className="rounded-md bg-black/60 p-1.5 text-white hover:bg-[#E36F2C]"
          title="复制 URL"
        >
          <Copy size={14} />
        </button>
      </div>
      {copyOk && (
        <div className="absolute left-1.5 top-1.5 rounded-sm bg-green-600/90 px-1.5 py-0.5 text-[10px] text-white">
          已复制
        </div>
      )}
    </button>
  )
}

function ReferenceSourceList({
  label,
  count,
  items,
}: {
  label: string
  count: number
  items: MediaReferenceItem[]
}) {
  if (count <= 0) return null

  const hiddenCount = Math.max(0, count - items.length)

  return (
    <div className="rounded-md border border-[#E5DED4] bg-white/70 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#2C2A28]">{label}</span>
        <span className="text-xs text-[#8A8580]">{count} 条</span>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <a
              key={`${label}-${item.id}`}
              href={item.href}
              className="flex items-start justify-between gap-3 rounded-md border border-[#E5DED4] bg-white px-2.5 py-2 text-left transition-colors hover:border-[#E36F2C]/50 hover:bg-[#FFF8F2]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[#2C2A28]">
                  {item.title}
                </span>
                {item.fields.length > 0 && (
                  <span className="mt-1 block truncate text-xs text-[#8A8580]">
                    {item.fields.join(' / ')}
                  </span>
                )}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#E36F2C]">
                去编辑
                <ExternalLink size={13} />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[#E5DED4] bg-white px-2.5 py-2 text-xs text-[#8A8580]">
          已检测到引用，但来源明细暂不可显示
        </div>
      )}
      {hiddenCount > 0 && (
        <div className="mt-2 text-xs text-[#8A8580]">
          还有 {hiddenCount} 条未显示，请进入对应列表继续检查。
        </div>
      )}
    </div>
  )
}

function MediaDetailSheet({
  upload,
  onClose,
  onDelete,
}: {
  upload: Upload | null
  onClose: () => void
  onDelete: (u: Upload) => void
}) {
  const uploadId = upload?.id ?? null
  const [refsState, setRefsState] = useState<{
    uploadId: string | null
    refs: MediaReferenceDetails
  }>(() => ({ uploadId: null, refs: emptyMediaReferences() }))
  const refs = refsState.uploadId === uploadId ? refsState.refs : EMPTY_MEDIA_REFERENCES

  useEffect(() => {
    if (!uploadId) return
    let ignore = false
    fetch(`/api/admin/media/${uploadId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!ignore && data?.refs) {
          setRefsState({ uploadId, refs: normalizeMediaReferences(data.refs) })
        }
      })
      .catch(() => void 0)
    return () => {
      ignore = true
    }
  }, [uploadId])

  const copyUrl = async () => {
    if (!upload) return
    try {
      await navigator.clipboard.writeText(upload.url)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <Sheet
      open={!!upload}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <SheetContent>
        {upload && (
          <>
            <SheetHeader>
              <SheetTitle className="break-all pr-8 text-sm">
                {upload.filename ?? '(无文件名)'}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
              {/* Preview */}
              <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] overflow-hidden flex items-center justify-center max-h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upload.url}
                  alt={upload.filename ?? ''}
                  className="max-h-[400px] max-w-full object-contain"
                />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="文件名" value={upload.filename} fullWidth />
                <Field label="尺寸" value="未记录" />
                <Field
                  label="文件大小"
                  value={upload.size ? formatBytes(upload.size) : null}
                />
                <Field label="MIME" value={mimeLabel(upload.mime)} />
                <Field label="上传时间" value={formatDate(upload.created_at)} />
                <Field label="上传者" value={upload.uploaded_by_email} />
              </div>

              {/* URL */}
              <div>
                <div className="text-xs text-[#8A8580] mb-2 flex items-center justify-between">
                  <span>Blob URL</span>
                  <button
                    onClick={copyUrl}
                    className="inline-flex items-center gap-1 text-[#E36F2C] hover:underline"
                  >
                    <Copy size={12} />
                    复制
                  </button>
                </div>
                <div className="rounded-md bg-[#FAF7F2] border border-[#E5DED4] p-3 text-xs font-mono text-[#C4B9AB] break-all">
                  {upload.url}
                </div>
              </div>

              {/* References */}
              <div className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-3 text-sm">
                <div className="text-xs text-[#8A8580] mb-1.5">引用统计</div>
                <div className="text-[#2C2A28]">
                  涉及 <span className="text-[#E36F2C]">{refs.total}</span> 条内容
                  {refs.news > 0 && (
                    <span className="text-[#8A8580]">
                      {' '}
                      · 新闻 {refs.news} 条
                    </span>
                  )}
                  {refs.products > 0 && (
                    <span className="text-[#8A8580]">
                      {' '}
                      · 产品 {refs.products} 条
                    </span>
                  )}
                  {refs.projects > 0 && (
                    <span className="text-[#8A8580]">
                      {' '}
                      · 项目案例 {refs.projects} 条
                    </span>
                  )}
                  {refs.pages > 0 && (
                    <span className="text-[#8A8580]">
                      {' '}
                      · 页面模块 {refs.pages} 条
                    </span>
                  )}
                  {refs.pageDrafts > 0 && (
                    <span className="text-[#8A8580]">
                      {' '}
                      · 页面草稿 {refs.pageDrafts} 条
                    </span>
                  )}
                  {refs.pageSnapshots > 0 && (
                    <span className="text-[#8A8580]">
                      {' '}
                      · 历史快照 {refs.pageSnapshots} 条
                    </span>
                  )}
                </div>
                {refs.total > 0 && (
                  <div className="mt-1.5 text-xs text-[#E36F2C]">
                    该图片正在使用,先移除相关内容里的引用才能删除
                  </div>
                )}
                {refs.total > 0 && (
                  <div className="mt-3 space-y-2 border-t border-[#E5DED4] pt-3">
                    <div className="text-xs font-medium text-[#2C2A28]">引用来源</div>
                    <ReferenceSourceList label="新闻" count={refs.news} items={refs.items.news} />
                    <ReferenceSourceList
                      label="产品"
                      count={refs.products}
                      items={refs.items.products}
                    />
                    <ReferenceSourceList
                      label="项目案例"
                      count={refs.projects}
                      items={refs.items.projects}
                    />
                    <ReferenceSourceList
                      label="页面模块"
                      count={refs.pages}
                      items={refs.items.pages}
                    />
                    <ReferenceSourceList
                      label="页面草稿引用"
                      count={refs.pageDrafts}
                      items={refs.items.pageDrafts}
                    />
                    <ReferenceSourceList
                      label="历史快照引用"
                      count={refs.pageSnapshots}
                      items={refs.items.pageSnapshots}
                    />
                  </div>
                )}
              </div>
            </div>

            <SheetFooter>
              <Button variant="outline" size="sm" onClick={onClose}>
                关闭
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(upload)}
                disabled={refs.total > 0}
              >
                <Trash2 size={16} />
                删除
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  value,
  fullWidth,
}: {
  label: string
  value: string | null
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-xs text-[#8A8580]">{label}</div>
      <div className="text-sm text-[#2C2A28] break-all">{value || '—'}</div>
    </div>
  )
}
