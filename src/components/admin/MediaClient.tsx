'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { upload as blobUpload } from '@vercel/blob/client'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  HardDrive,
  Image as ImageIcon,
  ImagePlus,
  ImageUp,
  ImageOff,
  Images,
  Layers,
  ListFilter,
  RefreshCw,
  SearchX,
  Trash2,
  type LucideIcon,
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
import { getImageVariantUrl, normalizeImageVariants } from '@/lib/image-optimization'
import type {
  MediaReferenceDetails,
  MediaReferenceItems,
  MediaReferenceItem,
  MediaReferenceSummary,
  MediaReferenceSummaryItem,
  Upload,
} from '@/lib/uploads-db'

const FREE_QUOTA_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB
const WARNING_BYTES = 800 * 1024 * 1024
const BATCH_LIMIT = 20
const BYTES_PER_MB = 1024 * 1024
const RECOMMENDED_FRONTEND_IMAGE_BYTES = 2 * BYTES_PER_MB
const RECOMMENDED_FRONTEND_IMAGE_MB = RECOMMENDED_FRONTEND_IMAGE_BYTES / BYTES_PER_MB
const FRONTEND_RISK_IMAGE_BYTES = 1.5 * BYTES_PER_MB
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
  view: string
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

type MediaLedgerTone = 'high' | 'medium' | 'safe'

type MediaLedgerRow = {
  upload: Upload
  reference?: MediaReferenceSummaryItem
  stage: string
  issue: string
  detail: string
  signal: string
  actionLabel: string
  tone: MediaLedgerTone
  score: number
}

const emptyMediaReferenceItems = (): MediaReferenceItems => ({
  news: [],
  products: [],
  projects: [],
  pages: [],
  pageDrafts: [],
  pageSnapshots: [],
  pageStructureDrafts: [],
  pageStructureSnapshots: [],
})

const EMPTY_MEDIA_REFERENCES: MediaReferenceDetails = {
  news: 0,
  products: 0,
  projects: 0,
  pages: 0,
  pageDrafts: 0,
  pageSnapshots: 0,
  pageStructureDrafts: 0,
  pageStructureSnapshots: 0,
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

const FRONTEND_VARIANT_ROLES = ['thumb', 'card', 'detail'] as const

function generatedVariantCount(upload: Upload | null | undefined): number {
  const variants = normalizeImageVariants(upload?.variants)
  return FRONTEND_VARIANT_ROLES.filter((role) => variants[role]?.url).length
}

function isFrontendRiskUpload(upload: Upload | null | undefined): boolean {
  return (upload?.size ?? 0) > FRONTEND_RISK_IMAGE_BYTES
}

function isMissingFrontendVariants(upload: Upload | null | undefined): boolean {
  if (!upload?.mime?.startsWith('image/')) return false
  return generatedVariantCount(upload) < FRONTEND_VARIANT_ROLES.length
}

function referenceTotal(reference: MediaReferenceSummaryItem | undefined): number | null {
  return reference ? reference.total : null
}

function draftReferenceTotal(reference: MediaReferenceSummaryItem | undefined): number {
  if (!reference) return 0
  return (
    reference.pageDrafts
    + reference.pageSnapshots
    + reference.pageStructureDrafts
    + reference.pageStructureSnapshots
  )
}

function buildMediaLedgerRow(
  upload: Upload,
  reference: MediaReferenceSummaryItem | undefined,
): MediaLedgerRow {
  const variantCount = generatedVariantCount(upload)
  const isLargeOriginal = isFrontendRiskUpload(upload)
  const missingVariants = isMissingFrontendVariants(upload)
  const refs = referenceTotal(reference)
  const draftRefs = draftReferenceTotal(reference)

  if (isLargeOriginal && missingVariants) {
    return {
      upload,
      reference,
      stage: '前台风险',
      issue: '大原图 + 缺派生图',
      detail: '打开详情生成派生图；用于首页、产品、案例或新闻前优先降负载。',
      signal: `${formatBytes(upload.size ?? 0)} / 派生 ${variantCount}/3`,
      actionLabel: '处理素材',
      tone: 'high',
      score: 100,
    }
  }

  if (missingVariants) {
    return {
      upload,
      reference,
      stage: '派生缺口',
      issue: '缺少前台派生图',
      detail: '补齐 thumb / card / detail，避免前台读取原图。',
      signal: `派生 ${variantCount}/3`,
      actionLabel: '生成派生',
      tone: 'high',
      score: 85,
    }
  }

  if (isLargeOriginal) {
    return {
      upload,
      reference,
      stage: '大图复核',
      issue: '原图偏大',
      detail: '前台优先使用派生图；如未被引用，再判断是否保留原始资产。',
      signal: formatBytes(upload.size ?? 0),
      actionLabel: '查看引用',
      tone: 'medium',
      score: 70,
    }
  }

  if (refs === 0) {
    return {
      upload,
      reference,
      stage: '引用复核',
      issue: '当前采样未引用',
      detail: '未检测到 CMS 引用；删除前仍需打开详情做最终确认。',
      signal: '未引用',
      actionLabel: '复核详情',
      tone: 'medium',
      score: 55,
    }
  }

  if (draftRefs > 0) {
    return {
      upload,
      reference,
      stage: '草稿引用',
      issue: '存在草稿/快照引用',
      detail: '删除或替换前先确认视觉编辑草稿、快照和页面结构引用。',
      signal: `${draftRefs} 处草稿/快照`,
      actionLabel: '查看来源',
      tone: 'medium',
      score: 45,
    }
  }

  if ((refs ?? 0) > 0) {
    return {
      upload,
      reference,
      stage: '已上线引用',
      issue: '被内容或页面使用',
      detail: '作为有效资产保留；替换前先进入引用来源编辑。',
      signal: `${refs} 处引用`,
      actionLabel: '查看来源',
      tone: 'safe',
      score: 25,
    }
  }

  return {
    upload,
    reference,
    stage: '待采样',
    issue: '引用状态待加载',
    detail: '当前页引用摘要尚未返回，打开详情可触发精确引用检查。',
    signal: mimeLabel(upload.mime),
    actionLabel: '查看详情',
    tone: 'safe',
    score: 10,
  }
}

function buildMediaLedgerRows(
  uploads: Upload[],
  referenceLookup: Map<string, MediaReferenceSummaryItem>,
): MediaLedgerRow[] {
  return uploads
    .map((upload) => buildMediaLedgerRow(upload, referenceLookup.get(upload.id)))
    .sort((a, b) => b.score - a.score || new Date(b.upload.created_at).getTime() - new Date(a.upload.created_at).getTime())
    .slice(0, 8)
}

function mediaLedgerToneClass(tone: MediaLedgerTone): string {
  if (tone === 'high') return 'border-[#F2C6A7] bg-[#FFF7F0] text-[#E36F2C]'
  if (tone === 'medium') return 'border-[#D8E7E8] bg-[#F7FAFA] text-[#1889B6]'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function mediaToneClass(tone: 'blue' | 'green' | 'orange' | 'gray') {
  if (tone === 'green') return 'border-l-emerald-500 bg-emerald-50 text-emerald-700'
  if (tone === 'orange') return 'border-l-[#E36F2C] bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'gray') return 'border-l-[#8A9EA4] bg-[#F0F2F2] text-[#61767D]'
  return 'border-l-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
}

export default function MediaClient({
  initialUploads,
  initialTotal,
  initialAllTotal,
  initialIssueTotal,
  initialBytes,
  initialReferenceSummary,
  initialFilters,
  initialPage,
  initialLimit,
  maxUploadMb,
}: {
  initialUploads: Upload[]
  initialTotal: number
  initialAllTotal: number
  initialIssueTotal: number
  initialBytes: number
  initialReferenceSummary: MediaReferenceSummary
  initialFilters: Filters
  initialPage: number
  initialLimit: number
  maxUploadMb: number
}) {
  const router = useRouter()
  const [uploads, setUploads] = useState<Upload[]>(initialUploads)
  const [total, setTotal] = useState(initialTotal)
  const [allTotal] = useState(initialAllTotal)
  const [issueTotal] = useState(initialIssueTotal)
  const [storageBytes, setStorageBytes] = useState(initialBytes)
  const [referenceSummary, setReferenceSummary] = useState(initialReferenceSummary)
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
  const currentLargeCount = useMemo(
    () => uploads.filter((upload) => isFrontendRiskUpload(upload)).length,
    [uploads],
  )
  const currentMissingVariantCount = useMemo(
    () => uploads.filter((upload) => isMissingFrontendVariants(upload)).length,
    [uploads],
  )
  const currentWebpCount = useMemo(
    () => uploads.filter((upload) => upload.mime === 'image/webp').length,
    [uploads],
  )
  const referenceLookup = useMemo(() => (
    new Map(referenceSummary.items.map((item) => [item.uploadId, item]))
  ), [referenceSummary.items])
  const currentLedgerRows = useMemo(
    () => buildMediaLedgerRows(uploads, referenceLookup),
    [uploads, referenceLookup],
  )
  const resultStart = total === 0 ? 0 : (page - 1) * limit + 1
  const resultEnd = total === 0 ? 0 : Math.min(total, page * limit)

  const hasActiveFilters =
    filters.mime !== 'all' ||
    filters.view !== '' ||
    filters.search.trim().length > 0

  const resetFilters = () => {
    setFilters({ mime: 'all', view: '', search: '' })
    setPage(1)
  }

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const buildQuery = useCallback((f: Filters, paging?: { page: number; limit: number }) => {
    const sp = new URLSearchParams()
    if (f.mime && f.mime !== 'all') sp.set('mime', f.mime)
    if (f.view) sp.set('view', f.view)
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
        const data = (await res.json()) as {
          uploads: Upload[]
          total: number
          page: number
          limit: number
          referenceSummary?: MediaReferenceSummary
        }
        setUploads(data.uploads)
        setTotal(data.total)
        setPage(data.page)
        setLimit(data.limit)
        if (data.referenceSummary) setReferenceSummary(data.referenceSummary)
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
    const largeImages = accepted.filter((f) => f.size > RECOMMENDED_FRONTEND_IMAGE_BYTES)
    if (largeImages.length) {
      toast.warning(`${largeImages.length} 张图片超过 ${RECOMMENDED_FRONTEND_IMAGE_MB} MB,建议压缩后再用于首页、产品或案例前台`)
    }

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

  const handleUploadUpdated = useCallback((nextUpload: Upload) => {
    setSelected(nextUpload)
    setUploads((prev) => prev.map((item) => (item.id === nextUpload.id ? nextUpload : item)))
  }, [])

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
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MediaMetricCard
          title="全部素材"
          value={allTotal}
          detail={hasActiveFilters ? `当前结果 ${total} 张` : '媒体库总记录'}
          Icon={Images}
          tone="blue"
        />
        <MediaMetricCard
          title="风险素材"
          value={issueTotal}
          detail="大原图或缺少前台派生图"
          Icon={AlertCircle}
          tone={issueTotal > 0 ? 'orange' : 'green'}
        />
        <MediaMetricCard
          title="空间使用"
          value={formatBytes(storageBytes)}
          detail={`${usagePct.toFixed(1)}% / 1 GB 免费额度`}
          Icon={HardDrive}
          tone={usageWarning ? 'orange' : 'green'}
        />
        <MediaMetricCard
          title="当前页风险"
          value={`${currentLargeCount + currentMissingVariantCount}`}
          detail={`大图 ${currentLargeCount} · 缺派生图 ${currentMissingVariantCount}`}
          Icon={ListFilter}
          tone={currentLargeCount + currentMissingVariantCount > 0 ? 'orange' : 'green'}
        />
        <MediaMetricCard
          title="引用状态"
          value={`${referenceSummary.unused}/${referenceSummary.sampled}`}
          detail="当前页未引用 / 已采样"
          Icon={Layers}
          tone={referenceSummary.unused > 0 ? 'orange' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
                  <Filter size={15} />
                  Library Controls
                </div>
                <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">素材筛选与上传</h2>
                <p className="mt-1 text-xs leading-5 text-[#61767D]">
                  支持 JPEG / PNG / WebP / GIF / SVG · 最大 {uploadLimitMb} MB · 一次最多 {BATCH_LIMIT} 张
                </p>
              </div>

              <div className="flex flex-col items-start gap-1 sm:items-end">
                <div className="flex flex-wrap items-center gap-2">
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
                <p className="text-[11px] text-[#A76632]">
                  前台图片建议压缩到 {RECOMMENDED_FRONTEND_IMAGE_MB} MB 以内。
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[180px_180px_minmax(0,1fr)_auto]">
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
              <Select
                value={filters.view}
                onChange={(e) => updateFilters({ view: e.target.value })}
              >
                <option value="">视图:全部</option>
                <option value="issues">只看风险图片</option>
              </Select>
              <Input
                placeholder="搜索文件名"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                清空筛选
              </Button>
            </div>
          </section>

          <MediaIssueLedger
            rows={currentLedgerRows}
            totalRows={uploads.length}
            onSelect={handleSelect}
          />

          <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
                  <ImageIcon size={15} />
                  Asset Results
                </div>
                <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">当前素材结果</h2>
              </div>
              <div className="text-xs text-[#61767D]">
                显示 {resultStart}-{resultEnd} / {total} 张
              </div>
            </div>

            {uploads.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#D8E7E8] bg-[#F7FAFA] py-20 text-center">
                {hasActiveFilters ? (
                  <SearchX size={48} className="text-[#4A4744]" />
                ) : (
                  <ImageOff size={48} className="text-[#4A4744]" />
                )}
                <p className="text-[#9AA9AD]">
                  {hasActiveFilters ? '没有找到符合条件的图片' : '还没有图片'}
                </p>
                <p className="text-xs text-[#61767D]">点击上传，或直接拖拽图片到此页面</p>
                {hasActiveFilters ? (
                  <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                    清空筛选
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
                {uploads.map((u) => (
                  <MediaCard
                    key={u.id}
                    upload={u}
                    reference={referenceLookup.get(u.id)}
                    onClick={() => handleSelect(u)}
                  />
                ))}
              </div>
            )}

            {loading && <div className="mt-3 text-xs text-[#61767D]">加载中…</div>}

            {total > 0 ? (
              <div className="mt-4">
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
              </div>
            ) : null}
          </section>
        </div>

        <MediaOperationsPanel
          issueTotal={issueTotal}
          currentLargeCount={currentLargeCount}
          currentMissingVariantCount={currentMissingVariantCount}
          currentWebpCount={currentWebpCount}
          referenceSummary={referenceSummary}
          uploadLimitMb={uploadLimitMb}
          usagePct={usagePct}
          usageWarning={usageWarning}
          activeFilters={hasActiveFilters}
          onShowAll={resetFilters}
          onShowIssues={() => updateFilters({ view: 'issues' })}
          onShowWebp={() => updateFilters({ mime: 'webp', view: '' })}
        />
      </div>

      {/* Upload progress panel */}
      {tasks.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 w-80 rounded-lg border border-[#D8E7E8] bg-[#FFFFFF] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#D8E7E8] px-4 py-2.5">
            <span className="text-xs text-[#9AA9AD]">
              上传进度 ({tasks.filter((t) => t.status === 'done').length}/{tasks.length})
            </span>
            <button
              onClick={() => setTasks([])}
              className="text-[#61767D] hover:text-[#1E2C31]"
            >
              <X size={14} />
            </button>
          </div>
          <div className="max-h-64 overflow-auto p-3 flex flex-col gap-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="rounded-md bg-[#F7FAFA] border border-[#D8E7E8] p-2"
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="truncate text-[#1E2C31]" title={t.name}>
                    {t.name}
                  </span>
                  <span
                    className={
                      t.status === 'error'
                        ? 'text-red-400'
                        : t.status === 'done'
                          ? 'text-green-400'
                          : 'text-[#61767D]'
                    }
                  >
                    {t.status === 'error' ? '失败' : `${t.progress}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-[#D8E7E8] overflow-hidden">
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
          <p className="text-xs text-white/75">
            前台图片建议压缩到 {RECOMMENDED_FRONTEND_IMAGE_MB} MB 以内
          </p>
        </div>
      )}

      {/* Detail sheet */}
      <MediaDetailSheet
        upload={selected}
        onClose={() => setSelected(null)}
        onDelete={setPendingDelete}
        onUploadUpdated={handleUploadUpdated}
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

function MediaMetricCard({
  title,
  value,
  detail,
  Icon,
  tone,
}: {
  title: string
  value: number | string
  detail: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'gray'
}) {
  return (
    <div className={`rounded-md border border-l-4 border-[#D8E7E8] bg-white p-4 shadow-sm ${mediaToneClass(tone).split(' ')[0]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61767D]">{title}</div>
          <div className="mt-2 break-words text-3xl font-bold text-[#1E2C31]">{value}</div>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${mediaToneClass(tone).replace(/^\\S+\\s/, '')}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-3 text-xs leading-5 text-[#61767D]">{detail}</div>
    </div>
  )
}

function MediaIssueLedger({
  rows,
  totalRows,
  onSelect,
}: {
  rows: MediaLedgerRow[]
  totalRows: number
  onSelect: (upload: Upload) => void | Promise<unknown>
}) {
  const highCount = rows.filter((row) => row.tone === 'high').length
  const reviewCount = rows.filter((row) => row.tone === 'medium').length

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
            <ListFilter size={15} />
            Asset Ledger
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">当前页处理台账</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#61767D]">
            按前台风险、派生缺口、引用复核和已上线引用排序，先处理会影响页面负载和素材删除判断的项目。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-7 items-center rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 text-[11px] font-semibold text-[#61767D]">
            当前页 {totalRows} 张
          </span>
          <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold ${mediaLedgerToneClass(highCount > 0 ? 'high' : 'safe')}`}>
            优先 {highCount}
          </span>
          <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold ${mediaLedgerToneClass(reviewCount > 0 ? 'medium' : 'safe')}`}>
            复核 {reviewCount}
          </span>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="bg-[#F7FAFA] text-[11px] uppercase tracking-[0.08em] text-[#61767D]">
                <tr>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">阶段</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">素材</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">处理信号</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">引用</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">派生图</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 text-right font-bold">入口</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const variantCount = generatedVariantCount(row.upload)
                  const refs = referenceTotal(row.reference)
                  const draftRefs = draftReferenceTotal(row.reference)

                  return (
                    <tr key={row.upload.id} className="border-b border-[#D8E7E8] last:border-b-0 hover:bg-[#F7FAFA]">
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${mediaLedgerToneClass(row.tone)}`}>
                          {row.stage}
                        </span>
                      </td>
                      <td className="max-w-[240px] px-4 py-3 align-top">
                        <div className="truncate text-sm font-bold text-[#1E2C31]" title={row.upload.filename ?? ''}>
                          {row.upload.filename ?? '未命名素材'}
                        </div>
                        <div className="mt-1 text-[11px] text-[#61767D]">
                          {mimeLabel(row.upload.mime)} · {formatBytes(row.upload.size ?? 0)}
                        </div>
                      </td>
                      <td className="max-w-[280px] px-4 py-3 align-top">
                        <div className="text-sm font-semibold text-[#1E2C31]">{row.issue}</div>
                        <div className="mt-1 text-[11px] leading-4 text-[#61767D]">{row.detail}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-bold text-[#1E2C31]">
                          {refs === null ? '待采样' : `${refs} 处`}
                        </div>
                        <div className="mt-1 text-[11px] text-[#61767D]">
                          内容 {(row.reference?.news ?? 0) + (row.reference?.products ?? 0) + (row.reference?.projects ?? 0)}
                          {' / '}
                          页面 {row.reference?.pages ?? 0}
                          {' / '}
                          草稿 {draftRefs}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-bold text-[#1E2C31]">{variantCount}/3</div>
                        <div className="mt-1 text-[11px] text-[#61767D]">{row.signal}</div>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          type="button"
                          onClick={() => {
                            void onSelect(row.upload)
                          }}
                          className="inline-flex min-h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-bold text-[#1889B6] hover:border-[#1889B6] hover:bg-[#EAF6F8]"
                        >
                          {row.actionLabel}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {rows.map((row) => {
              const refs = referenceTotal(row.reference)
              return (
                <button
                  key={row.upload.id}
                  type="button"
                  onClick={() => {
                    void onSelect(row.upload)
                  }}
                  className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${mediaLedgerToneClass(row.tone)}`}>
                      {row.stage}
                    </span>
                    <span className="text-[11px] font-bold text-[#1889B6]">{row.actionLabel}</span>
                  </div>
                  <div className="mt-2 truncate text-sm font-bold text-[#1E2C31]">
                    {row.upload.filename ?? '未命名素材'}
                  </div>
                  <div className="mt-1 text-xs text-[#61767D]">{row.issue}</div>
                  <div className="mt-2 text-[11px] text-[#61767D]">
                    {mimeLabel(row.upload.mime)} · {formatBytes(row.upload.size ?? 0)} · 引用 {refs === null ? '待采样' : refs}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="p-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
            当前页没有可排查素材。
          </div>
        </div>
      )}
    </section>
  )
}

function MediaOperationsPanel({
  issueTotal,
  currentLargeCount,
  currentMissingVariantCount,
  currentWebpCount,
  referenceSummary,
  uploadLimitMb,
  usagePct,
  usageWarning,
  activeFilters,
  onShowAll,
  onShowIssues,
  onShowWebp,
}: {
  issueTotal: number
  currentLargeCount: number
  currentMissingVariantCount: number
  currentWebpCount: number
  referenceSummary: MediaReferenceSummary
  uploadLimitMb: number
  usagePct: number
  usageWarning: boolean
  activeFilters: boolean
  onShowAll: () => void
  onShowIssues: () => void
  onShowWebp: () => void
}) {
  const currentIssueCount = currentLargeCount + currentMissingVariantCount
  const referencedRate = referenceSummary.sampled > 0
    ? Math.round((referenceSummary.referenced / referenceSummary.sampled) * 100)
    : 0
  const priorityItems = [
    {
      id: 'global-issues',
      title: '全库风险素材',
      detail: '先进入风险视图，集中处理大原图和缺派生图。',
      count: issueTotal,
      actionLabel: '查看风险',
      onClick: onShowIssues,
    },
    {
      id: 'unused',
      title: '当前页未引用素材',
      detail: '逐张打开详情确认引用，再决定是否保留或删除。',
      count: referenceSummary.unused,
      actionLabel: '逐张核对',
      onClick: onShowAll,
    },
    {
      id: 'large',
      title: '当前页大原图',
      detail: '用于前台前先压缩或改用派生图，降低页面负载。',
      count: currentLargeCount,
      actionLabel: '查看当前页',
      onClick: onShowAll,
    },
    {
      id: 'variants',
      title: '当前页缺派生图',
      detail: '打开详情生成 thumb / card / detail，补齐前台小图链路。',
      count: currentMissingVariantCount,
      actionLabel: '查看当前页',
      onClick: onShowAll,
    },
  ].filter((item) => item.count > 0).slice(0, 4)

  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
              Operations
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">素材治理</h2>
          </div>
          <span className={`flex h-9 w-9 items-center justify-center rounded-md ${issueTotal > 0 ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'}`}>
            {issueTotal > 0 ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <MediaOperationRow label="全库风险" value={`${issueTotal} 张`} tone={issueTotal > 0 ? 'orange' : 'green'} />
          <MediaOperationRow label="当前页大图" value={`${currentLargeCount} 张`} tone={currentLargeCount > 0 ? 'orange' : 'green'} />
          <MediaOperationRow label="当前页缺派生图" value={`${currentMissingVariantCount} 张`} tone={currentMissingVariantCount > 0 ? 'orange' : 'green'} />
          <MediaOperationRow label="当前页未引用" value={`${referenceSummary.unused} 张`} tone={referenceSummary.unused > 0 ? 'orange' : 'green'} />
          <MediaOperationRow label="当前页被引用" value={`${referenceSummary.referenced} 张`} tone="blue" />
          <MediaOperationRow label="当前页 WebP" value={`${currentWebpCount} 张`} tone="blue" />
          <MediaOperationRow label="上传上限" value={`${uploadLimitMb} MB`} tone="gray" />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 text-xs text-[#61767D]">空间占用</div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#D8E7E8]">
            <div
              className={`h-full rounded-full ${usageWarning ? 'bg-[#E36F2C]' : 'bg-[#1889B6]'}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-[#61767D]">{usagePct.toFixed(1)}% / 1 GB</div>
        </div>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">
              Priority Queue
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">素材处理优先级</h2>
          </div>
          <BadgeLike tone={priorityItems.length > 0 ? 'orange' : 'green'}>
            {priorityItems.length > 0 ? `${priorityItems.length} 类待处理` : '当前页可复核'}
          </BadgeLike>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#61767D]">
            <span>引用覆盖率</span>
            <span>{referencedRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#E8F0F1]">
            <div
              className={referencedRate > 0 ? 'h-2 rounded-full bg-[#1889B6]' : 'h-2 rounded-full bg-[#E36F2C]'}
              style={{ width: `${referencedRate}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] leading-4 text-[#61767D]">
            当前页采样 {referenceSummary.sampled} 张；未引用素材只代表未被现有 CMS 字段检测到，删除前仍需打开详情确认。
          </p>
        </div>

        <div className="mt-3 space-y-2">
          {priorityItems.length > 0 ? (
            priorityItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="flex w-full items-start gap-3 rounded-md border border-[#F2C6A7] bg-[#FFF7F0] px-3 py-2.5 text-left hover:border-[#E36F2C]/50"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#E36F2C]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-[#1E2C31]">{item.title}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-[#E36F2C]">{item.count} 张</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-[#61767D]">{item.detail}</span>
                  <span className="mt-1 block text-[11px] font-bold text-[#1889B6]">{item.actionLabel}</span>
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
              当前页未发现大图、缺派生图或未引用素材，可继续按类型或文件名核对。
            </div>
          )}
        </div>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#1E2C31]">媒体运营矩阵</h2>
          <span className="text-xs font-semibold text-[#8A9EA4]">当前页</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <MediaOperationRow label="内容引用" value={`${referenceSummary.contentRefs} 处`} tone={referenceSummary.contentRefs > 0 ? 'blue' : 'gray'} />
          <MediaOperationRow label="页面内容引用" value={`${referenceSummary.pageRefs} 处`} tone={referenceSummary.pageRefs > 0 ? 'blue' : 'gray'} />
          <MediaOperationRow label="草稿/快照引用" value={`${referenceSummary.draftRefs} 处`} tone={referenceSummary.draftRefs > 0 ? 'orange' : 'gray'} />
          <MediaOperationRow label="采样上限" value={`${referenceSummary.sampled} 张`} tone="gray" />
        </div>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-[#1E2C31]">
          <Layers size={16} />
          快速视图
        </div>
        <div className="mt-3 grid gap-2">
          <Button type="button" variant={activeFilters ? 'outline' : 'default'} size="sm" onClick={onShowAll}>
            <Images size={15} />
            全部素材
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onShowIssues}>
            <AlertCircle size={15} />
            风险素材
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onShowWebp}>
            <CheckCircle2 size={15} />
            WebP 素材
          </Button>
        </div>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 text-xs leading-5 text-[#61767D] shadow-sm">
        <div className="mb-2 text-sm font-bold text-[#1E2C31]">当前页处理建议</div>
        {currentIssueCount > 0 ? (
          <p>优先处理当前页的大原图和缺派生图素材，再进入详情查看引用来源。</p>
        ) : (
          <p>当前页未发现大原图或缺派生图问题，可继续按文件名、类型或风险视图筛选。</p>
        )}
      </section>
    </aside>
  )
}

function MediaOperationRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
}) {
  const color =
    tone === 'orange'
      ? 'text-[#E36F2C]'
      : tone === 'green'
        ? 'text-emerald-700'
        : tone === 'blue'
          ? 'text-[#1889B6]'
          : 'text-[#61767D]'

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2">
      <span className="text-xs text-[#61767D]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  )
}

function BadgeLike({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'green' | 'orange'
}) {
  return (
    <span className={`inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
      tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-[#F2C6A7] bg-[#FFF7F0] text-[#E36F2C]'
    }`}>
      {children}
    </span>
  )
}

function MediaCard({
  upload,
  reference,
  onClick,
}: {
  upload: Upload
  reference?: MediaReferenceSummaryItem
  onClick: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [copyOk, setCopyOk] = useState(false)
  const thumbUrl = getImageVariantUrl(upload.url, upload.variants, 'thumb')
  const variantCount = generatedVariantCount(upload)
  const isLargeOriginal = isFrontendRiskUpload(upload)
  const missingVariants = isMissingFrontendVariants(upload)
  const referenceTotal = reference?.total ?? null
  const hasReferenceSample = referenceTotal !== null

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
    <div className="group relative aspect-square overflow-hidden rounded-md border border-[#D8E7E8] bg-[#F7FAFA]">
      {!loaded && (
        <div className="absolute inset-0 bg-[#D8E7E8] animate-pulse" aria-hidden />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbUrl || upload.url}
        alt={upload.filename ?? ''}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover transition-opacity ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <button
        type="button"
        onClick={onClick}
        aria-label={`查看 ${upload.filename ?? '图片'} 详情`}
        className="absolute inset-0 z-10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E36F2C]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-[11px] text-white">
        <span className="truncate" title={upload.filename ?? ''}>
          {upload.filename ?? '—'}
        </span>
        <span className="shrink-0 text-white/60">
          {upload.size ? formatBytes(upload.size) : ''}
        </span>
      </div>
      <div className="pointer-events-none absolute left-1.5 top-1.5 z-30 flex flex-wrap gap-1">
        {isLargeOriginal ? (
          <div className="rounded-sm bg-[#E36F2C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            大图
          </div>
        ) : null}
        {missingVariants ? (
          <div className="rounded-sm bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            派生 {variantCount}/3
          </div>
        ) : (
          <div className="rounded-sm bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            派生齐
          </div>
        )}
        {hasReferenceSample ? (
          <div className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white ${
            referenceTotal > 0 ? 'bg-[#1889B6]/95' : 'bg-zinc-700/90'
          }`}>
            {referenceTotal > 0 ? `引用 ${referenceTotal}` : '未引用'}
          </div>
        ) : null}
      </div>
      {copyOk && (
        <div className="pointer-events-none absolute left-1.5 top-8 z-30 rounded-sm bg-green-600/90 px-1.5 py-0.5 text-[10px] text-white">
          已复制
        </div>
      )}
      <div className="absolute right-1.5 top-1.5 z-30 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={copyUrl}
          className="rounded-md bg-black/60 p-1.5 text-white hover:bg-[#E36F2C]"
          title="复制 URL"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
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
    <div className="rounded-md border border-[#D8E7E8] bg-white/70 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#1E2C31]">{label}</span>
        <span className="text-xs text-[#61767D]">{count} 条</span>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <a
              key={`${label}-${item.id}`}
              href={item.href}
              className="flex items-start justify-between gap-3 rounded-md border border-[#D8E7E8] bg-white px-2.5 py-2 text-left transition-colors hover:border-[#E36F2C]/50 hover:bg-[#FFF8F2]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[#1E2C31]">
                  {item.title}
                </span>
                {item.fields.length > 0 && (
                  <span className="mt-1 block truncate text-xs text-[#61767D]">
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
        <div className="rounded-md border border-dashed border-[#D8E7E8] bg-white px-2.5 py-2 text-xs text-[#61767D]">
          已检测到引用，但来源明细暂不可显示
        </div>
      )}
      {hiddenCount > 0 && (
        <div className="mt-2 text-xs text-[#61767D]">
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
  onUploadUpdated,
}: {
  upload: Upload | null
  onClose: () => void
  onDelete: (u: Upload) => void
  onUploadUpdated: (u: Upload) => void
}) {
  const uploadId = upload?.id ?? null
  const [generatingVariants, setGeneratingVariants] = useState(false)
  const [refsState, setRefsState] = useState<{
    uploadId: string | null
    refs: MediaReferenceDetails
  }>(() => ({ uploadId: null, refs: emptyMediaReferences() }))
  const refs = refsState.uploadId === uploadId ? refsState.refs : EMPTY_MEDIA_REFERENCES
  const detailPreviewUrl = upload ? getImageVariantUrl(upload.url, upload.variants, 'detail') : ''
  const variantCount = generatedVariantCount(upload)
  const isLargeOriginal = isFrontendRiskUpload(upload)
  const canGenerateVariants = Boolean(
    upload?.mime && ['image/jpeg', 'image/png', 'image/webp'].includes(upload.mime),
  )

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

  const generateVariants = async () => {
    if (!upload || !canGenerateVariants) return
    setGeneratingVariants(true)
    try {
      const res = await fetch(`/api/admin/media/${upload.id}/variants`, { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as { upload?: Upload; error?: string }
      if (!res.ok || !data.upload) throw new Error(data.error || 'Variant generation failed')
      onUploadUpdated(data.upload)
      toast.success('派生图已生成')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '派生图生成失败')
    } finally {
      setGeneratingVariants(false)
    }
  }

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
      <SheetContent className="w-[560px]">
        {upload && (
          <>
            <SheetHeader>
              <SheetTitle className="break-all pr-8 text-sm">
                {upload.filename ?? '(无文件名)'}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
              {/* Preview */}
              <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] overflow-hidden flex items-center justify-center max-h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detailPreviewUrl || upload.url}
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
                <Field label="派生图" value={`${variantCount}/3 已生成`} />
                <Field
                  label="前台风险"
                  value={isLargeOriginal ? '原图超过 1.5 MB，前台优先使用 card/detail 派生图。' : '正常'}
                  fullWidth
                />
                <Field label="上传时间" value={formatDate(upload.created_at)} />
                <Field label="上传者" value={upload.uploaded_by_email} />
              </div>

              {canGenerateVariants && variantCount < 3 ? (
                <div className="rounded-md border border-[#F2C9A8] bg-[#FFF8F2] p-3 text-sm">
                  <div className="mb-2 text-xs font-medium text-[#A76632]">
                    该素材缺少前台派生图。用于首页、产品、案例或新闻前，建议先生成 thumb / card / detail。
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={generateVariants}
                    disabled={generatingVariants}
                  >
                    <RefreshCw size={14} className={generatingVariants ? 'animate-spin' : ''} />
                    生成派生图
                  </Button>
                </div>
              ) : null}

              {/* URL */}
              <div>
                <div className="text-xs text-[#61767D] mb-2 flex items-center justify-between">
                  <span>素材 URL</span>
                  <button
                    onClick={copyUrl}
                    className="inline-flex items-center gap-1 text-[#E36F2C] hover:underline"
                  >
                    <Copy size={12} />
                    复制
                  </button>
                </div>
                <div className="rounded-md bg-[#F7FAFA] border border-[#D8E7E8] p-3 text-xs font-mono text-[#9AA9AD] break-all">
                  {upload.url}
                </div>
              </div>

              {/* References */}
              <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3 text-sm">
                <div className="text-xs text-[#61767D] mb-1.5">引用统计</div>
                <div className="text-[#1E2C31]">
                  涉及 <span className="text-[#E36F2C]">{refs.total}</span> 条内容
                  {refs.news > 0 && (
                    <span className="text-[#61767D]">
                      {' '}
                      · 新闻 {refs.news} 条
                    </span>
                  )}
                  {refs.products > 0 && (
                    <span className="text-[#61767D]">
                      {' '}
                      · 产品 {refs.products} 条
                    </span>
                  )}
                  {refs.projects > 0 && (
                    <span className="text-[#61767D]">
                      {' '}
                      · 项目案例 {refs.projects} 条
                    </span>
                  )}
                  {refs.pages > 0 && (
                    <span className="text-[#61767D]">
                      {' '}
                      · 页面内容 {refs.pages} 条
                    </span>
                  )}
                  {refs.pageDrafts > 0 && (
                    <span className="text-[#61767D]">
                      {' '}
                      · 页面草稿 {refs.pageDrafts} 条
                    </span>
                  )}
                  {refs.pageSnapshots > 0 && (
                    <span className="text-[#61767D]">
                      {' '}
                      · 历史快照 {refs.pageSnapshots} 条
                    </span>
                  )}
                  {refs.pageStructureDrafts > 0 && (
                    <span className="text-[#61767D]">
                      {' '}
                      · 布局草稿 {refs.pageStructureDrafts} 条
                    </span>
                  )}
                  {refs.pageStructureSnapshots > 0 && (
                    <span className="text-[#61767D]">
                      {' '}
                      · 页面结构快照 {refs.pageStructureSnapshots} 条
                    </span>
                  )}
                </div>
                {refs.total > 0 && (
                  <div className="mt-1.5 text-xs text-[#E36F2C]">
                    该图片正在使用,先移除相关内容里的引用才能删除
                  </div>
                )}
                {refs.total > 0 && (
                  <div className="mt-3 space-y-2 border-t border-[#D8E7E8] pt-3">
                    <div className="text-xs font-medium text-[#1E2C31]">引用来源</div>
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
                      label="页面内容"
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
                    <ReferenceSourceList
                      label="布局草稿引用"
                      count={refs.pageStructureDrafts}
                      items={refs.items.pageStructureDrafts}
                    />
                    <ReferenceSourceList
                      label="页面结构快照引用"
                      count={refs.pageStructureSnapshots}
                      items={refs.items.pageStructureSnapshots}
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
      <div className="text-xs text-[#61767D]">{label}</div>
      <div className="text-sm text-[#1E2C31] break-all">{value || '—'}</div>
    </div>
  )
}
