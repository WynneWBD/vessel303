'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Eye, EyeOff, MapPinned, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import type { ProjectCaseRow, ProjectCaseStatus } from '@/lib/project-cases-db'

type Filters = { status: string; mapStatus: string; search: string }
type PendingAction =
  | { type: 'status'; item: ProjectCaseRow; status: ProjectCaseStatus }
  | { type: 'delete'; item: ProjectCaseRow }
type CompletenessLevel = '完整' | '可展示但待补充' | '待补素材'

const LIMIT = 20
const STATUS_QUICK_FILTERS: Array<{ label: string; value: Filters['status'] }> = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
]
const MAP_QUICK_FILTERS: Array<{ label: string; value: Filters['mapStatus'] }> = [
  { label: '全部地图状态', value: '' },
  { label: '已入图', value: 'map-ready' },
  { label: '缺坐标', value: 'missing-coordinates' },
  { label: '有坐标待发布', value: 'unpublished-with-coordinates' },
]

function formatDate(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hasMapCoordinates(item: ProjectCaseRow) {
  return item.latitude != null && item.longitude != null
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function getProjectCompleteness(item: ProjectCaseRow): {
  level: CompletenessLevel
  issues: string[]
} {
  const issues: string[] = []
  const hasCoords = hasMapCoordinates(item)

  if (!hasText(item.cover_image_url)) issues.push('缺封面')
  if (item.images.length === 0) issues.push('缺图库')
  if (!hasText(item.description_zh)) issues.push('缺中文简介')
  if (!hasText(item.description_en)) issues.push('缺英文简介')
  if (!hasText(item.products)) issues.push('缺产品型号')
  if (item.tags_zh.length === 0 || item.tags_en.length === 0) issues.push('缺标签')
  if (!hasCoords) issues.push('缺坐标')
  if (hasCoords && item.status !== 'published') issues.push('有坐标待发布')

  if (issues.length === 0) return { level: '完整', issues }
  if (issues.includes('缺封面') || issues.includes('缺图库')) {
    return { level: '待补素材', issues }
  }
  return { level: '可展示但待补充', issues }
}

function completenessBadgeClass(level: CompletenessLevel) {
  if (level === '完整') return 'bg-green-600/15 text-green-700 border-green-600/25'
  if (level === '待补素材') return 'bg-[#E36F2C]/15 text-[#C85A1F] border-[#E36F2C]/30'
  return 'bg-[#F5F2ED] text-[#6B625B] border-[#C4B9AB]'
}

export default function ProjectListClient({
  initialRows,
  initialTotal,
  initialFilters = { status: '', mapStatus: '', search: '' },
  initialPage = 1,
}: {
  initialRows: ProjectCaseRow[]
  initialTotal: number
  initialFilters?: Filters
  initialPage?: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [rows, setRows] = useState(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [confirming, setConfirming] = useState(false)
  const didSkipInitialLoad = useRef(false)

  const reload = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (f.status) sp.set('status', f.status)
      if (f.mapStatus) sp.set('mapStatus', f.mapStatus)
      if (f.search) sp.set('search', f.search)
      sp.set('page', String(p))
      sp.set('limit', String(LIMIT))
      const res = await fetch(`/api/admin/projects?${sp}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('load failed')
      const data = await res.json() as { data: ProjectCaseRow[]; total: number }
      setRows(data.data)
      setTotal(data.total)
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const sp = new URLSearchParams()
    if (filters.status) sp.set('status', filters.status)
    if (filters.mapStatus) sp.set('mapStatus', filters.mapStatus)
    if (filters.search.trim()) sp.set('search', filters.search.trim())
    if (page > 1) sp.set('page', String(page))
    const query = sp.toString()
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
  }, [filters, page, pathname])

  useEffect(() => {
    if (!didSkipInitialLoad.current) {
      didSkipInitialLoad.current = true
      return
    }
    const t = setTimeout(() => reload(filters, page), filters.search ? 300 : 0)
    return () => clearTimeout(t)
  }, [filters, page, reload])

  const handleFilterChange = (patch: Partial<Filters>) => {
    setPage(1)
    setFilters((f) => ({ ...f, ...patch }))
  }

  const updateStatus = async (item: ProjectCaseRow, status: ProjectCaseStatus) => {
    try {
      const res = await fetch(`/api/admin/projects/${item.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '操作失败')
      toast.success(status === 'published' ? '已发布' : '已下架为草稿')
      setRows((prev) => prev.map((row) => (row.id === item.id ? data.data : row)))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleDelete = async (item: ProjectCaseRow) => {
    try {
      const res = await fetch(`/api/admin/projects/${item.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '删除失败')
      toast.success('已删除')
      setRows((prev) => prev.filter((row) => row.id !== item.id))
      setTotal((n) => Math.max(0, n - 1))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return
    setConfirming(true)
    try {
      if (pendingAction.type === 'delete') {
        await handleDelete(pendingAction.item)
      } else {
        await updateStatus(pendingAction.item, pendingAction.status)
      }
      setPendingAction(null)
    } finally {
      setConfirming(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const publishedCount = rows.filter((item) => item.status === 'published').length
  const mapReadyCount = rows.filter((item) => item.status === 'published' && hasMapCoordinates(item)).length
  const pendingIsDelete = pendingAction?.type === 'delete'
  const pendingIsPublish =
    pendingAction?.type === 'status' && pendingAction.status === 'published'
  const pendingName = pendingAction?.item.name_zh ?? ''
  const pendingTitle =
    pendingIsDelete
      ? '确认删除这个案例？'
      : pendingIsPublish
        ? '确认发布这个案例？'
        : '确认下架这个案例？'
  const pendingDescription =
    pendingIsDelete
      ? `将删除「${pendingName}」。删除后前台案例页不再展示，操作会写入后台日志。`
      : pendingIsPublish
        ? `将发布「${pendingName}」。如果经纬度完整，它也会进入 /global 地图。`
        : `将下架「${pendingName}」。前台案例页和 /global 地图将不再展示该案例。`
  const pendingConfirmLabel =
    pendingIsDelete
      ? '确认删除'
      : pendingIsPublish
        ? '确认发布'
        : '确认下架'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[#2C2A28]" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700 }}>
            项目案例 Projects
          </h1>
          <p className="mt-1 text-xs text-[#8A8580]">
            管理官网 /cases 案例列表；已发布且经纬度完整的案例会同步进入 /global 地图。
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-medium text-white hover:bg-[#C85A1F]"
        >
          <Plus size={16} />
          新建案例
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_QUICK_FILTERS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleFilterChange({ status: option.value })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filters.status === option.value
                  ? 'border-[#E36F2C] bg-[#E36F2C]/10 text-[#E36F2C]'
                  : 'border-[#E5DED4] bg-white text-[#8A8580] hover:text-[#2C2A28]'
              }`}
            >
              {option.label}
            </button>
          ))}
          {MAP_QUICK_FILTERS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleFilterChange({ mapStatus: option.value })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filters.mapStatus === option.value
                  ? 'border-[#E36F2C] bg-[#E36F2C]/10 text-[#E36F2C]'
                  : 'border-[#E5DED4] bg-white text-[#8A8580] hover:text-[#2C2A28]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 max-w-4xl">
        <Select value={filters.status} onChange={(e) => handleFilterChange({ status: e.target.value })} className="w-36">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </Select>
        <Select value={filters.mapStatus} onChange={(e) => handleFilterChange({ mapStatus: e.target.value })} className="w-44">
          <option value="">全部地图状态</option>
          <option value="map-ready">已进入地图</option>
          <option value="missing-coordinates">缺少坐标</option>
          <option value="unpublished-with-coordinates">有坐标待发布</option>
        </Select>
        <Input
          placeholder="搜索名称、位置或 ID..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="flex-1 min-w-[220px]"
        />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF] p-4">
          <p className="text-xs text-[#8A8580]">当前页案例</p>
          <p className="mt-1 text-2xl font-semibold text-[#2C2A28]">{rows.length}</p>
        </div>
        <div className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF] p-4">
          <p className="text-xs text-[#8A8580]">当前页已发布</p>
          <p className="mt-1 text-2xl font-semibold text-[#2C2A28]">{publishedCount}</p>
        </div>
        <div className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF] p-4">
          <p className="text-xs text-[#8A8580]">当前页进入地图</p>
          <p className="mt-1 text-2xl font-semibold text-[#E36F2C]">{mapReadyCount}</p>
        </div>
      </div>

      {rows.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#E5DED4] bg-[#FFFFFF] py-20">
          <p className="text-[#C4B9AB]">暂无案例</p>
          <Link href="/admin/projects/new" className="text-sm text-[#E36F2C] hover:text-[#F08A52]">
            新建第一个案例
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-[#E5DED4] overflow-hidden">
          <div
            className="grid gap-3 px-4 py-3 text-xs text-[#8A8580] bg-[#FAF7F2] border-b border-[#E5DED4]"
            style={{ gridTemplateColumns: '72px minmax(0,1fr) 140px 90px 118px 110px 156px' }}
          >
            <span>封面</span>
            <span>案例</span>
            <span>位置</span>
            <span>状态</span>
            <span>地图</span>
            <span>更新</span>
            <span>操作</span>
          </div>

          {rows.map((item) => {
            const mapReady = item.status === 'published' && hasMapCoordinates(item)
            const hasCoords = hasMapCoordinates(item)
            const completeness = getProjectCompleteness(item)
            const visibleIssues = completeness.issues.slice(0, 3)
            const hiddenIssueCount = Math.max(0, completeness.issues.length - visibleIssues.length)
            return (
              <div
                key={item.id}
                className="grid gap-3 items-center px-4 py-3 border-b border-[#E5DED4] last:border-b-0 hover:bg-[#FAF7F2] transition-colors"
                style={{ gridTemplateColumns: '72px minmax(0,1fr) 140px 90px 118px 110px 156px' }}
              >
                <div className="w-[72px] h-[44px] rounded overflow-hidden bg-[#E5DED4]">
                  {item.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#2C2A28] truncate font-medium">{item.name_zh}</p>
                  <p className="text-xs text-[#6B6560] truncate mt-0.5">{item.id} · {item.name_en}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge className={`${completenessBadgeClass(completeness.level)} text-[11px]`}>
                      {completeness.level}
                    </Badge>
                    {visibleIssues.map((issue) => (
                      <span
                        key={issue}
                        className="rounded-full border border-[#E5DED4] bg-[#FAF7F2] px-2 py-0.5 text-[11px] text-[#8A8580]"
                      >
                        {issue}
                      </span>
                    ))}
                    {hiddenIssueCount > 0 ? (
                      <span className="text-[11px] text-[#8A8580]">还有 {hiddenIssueCount} 项</span>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-[#8A8580] truncate">{item.location_zh}</p>
                <div>
                  {item.status === 'published' ? (
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">已发布</Badge>
                  ) : (
                    <Badge className="bg-[#E5DED4] text-[#8A8580] border-[#C4B9AB] text-xs">草稿</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {mapReady ? (
                    <>
                      <Badge className="bg-[#E36F2C]/15 text-[#E36F2C] border-[#E36F2C]/30 text-xs">
                        <MapPinned size={12} />
                        已入图
                      </Badge>
                      <Link
                        href={`/global?camp=${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="查看地图点位"
                        className="text-[#8A8580] hover:text-[#E36F2C]"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </>
                  ) : (
                    <Badge className="bg-[#E5DED4] text-[#8A8580] border-[#C4B9AB] text-xs">
                      {hasCoords ? '待发布' : '缺坐标'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#8A8580]">{formatDate(item.updated_at)}</p>
                <div className="flex items-center gap-1">
                  {item.status === 'published' ? (
                    <Link
                      href="/cases"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="查看前台案例列表"
                      className="h-8 w-8 flex items-center justify-center rounded text-[#8A8580] hover:text-[#E36F2C] hover:bg-[#E36F2C]/10 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  ) : (
                    <span
                      title="草稿未发布，暂无前台入口"
                      className="h-8 w-8 flex items-center justify-center rounded text-[#C4B9AB]"
                    >
                      <ExternalLink size={14} />
                    </span>
                  )}
                  <Link
                    href={`/admin/projects/${item.id}/edit`}
                    title="编辑"
                    className="h-8 w-8 flex items-center justify-center rounded text-[#8A8580] hover:text-[#2C2A28] hover:bg-[#F5F2ED] transition-colors"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    type="button"
                    title={item.status === 'published' ? '下架' : '发布'}
                    onClick={() =>
                      setPendingAction({
                        type: 'status',
                        item,
                        status: item.status === 'published' ? 'draft' : 'published',
                      })
                    }
                    className="h-8 w-8 flex items-center justify-center rounded text-[#8A8580] hover:text-[#E36F2C] hover:bg-[#E36F2C]/10 transition-colors"
                  >
                    {item.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    title="删除"
                    onClick={() => setPendingAction({ type: 'delete', item })}
                    className="h-8 w-8 flex items-center justify-center rounded text-[#8A8580] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {loading && <p className="text-xs text-[#8A8580]">加载中...</p>}

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-xs text-[#8A8580]">第 {page} / {totalPages} 页，共 {total} 条</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}

      <AdminConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
        title={pendingTitle}
        description={pendingDescription}
        confirmLabel={pendingConfirmLabel}
        tone={pendingAction?.type === 'delete' ? 'danger' : 'warning'}
        loading={confirming}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
