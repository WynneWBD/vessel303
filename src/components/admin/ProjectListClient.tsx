'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ProjectCaseRow, ProjectCaseStatus } from '@/lib/project-cases-db'

type Filters = { status: string; search: string }

const LIMIT = 20

function formatDate(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ProjectListClient({
  initialRows,
  initialTotal,
}: {
  initialRows: ProjectCaseRow[]
  initialTotal: number
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({ status: '', search: '' })
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (f.status) sp.set('status', f.status)
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
    if (!window.confirm(`确定删除这个案例?\n「${item.name_zh}」`)) return
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

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[#2C2A28]" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700 }}>
            项目案例 Projects
          </h1>
          <p className="mt-1 text-xs text-[#8A8580]">
            管理官网 /cases 案例列表；地图 /global 接入会在下一步继续。
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

      <div className="flex flex-wrap items-center gap-3 max-w-3xl">
        <Select value={filters.status} onChange={(e) => handleFilterChange({ status: e.target.value })} className="w-36">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </Select>
        <Input
          placeholder="搜索名称、位置或 ID..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="flex-1 min-w-[220px]"
        />
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
            style={{ gridTemplateColumns: '72px 1fr 140px 90px 110px 128px' }}
          >
            <span>封面</span>
            <span>案例</span>
            <span>位置</span>
            <span>状态</span>
            <span>更新</span>
            <span>操作</span>
          </div>

          {rows.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 items-center px-4 py-3 border-b border-[#E5DED4] last:border-b-0 hover:bg-[#FAF7F2] transition-colors"
              style={{ gridTemplateColumns: '72px 1fr 140px 90px 110px 128px' }}
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
              </div>
              <p className="text-xs text-[#8A8580] truncate">{item.location_zh}</p>
              <div>
                {item.status === 'published' ? (
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">已发布</Badge>
                ) : (
                  <Badge className="bg-[#E5DED4] text-[#8A8580] border-[#C4B9AB] text-xs">草稿</Badge>
                )}
              </div>
              <p className="text-xs text-[#8A8580]">{formatDate(item.updated_at)}</p>
              <div className="flex items-center gap-1">
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
                  onClick={() => updateStatus(item, item.status === 'published' ? 'draft' : 'published')}
                  className="h-8 w-8 flex items-center justify-center rounded text-[#8A8580] hover:text-[#E36F2C] hover:bg-[#E36F2C]/10 transition-colors"
                >
                  {item.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  title="删除"
                  onClick={() => handleDelete(item)}
                  className="h-8 w-8 flex items-center justify-center rounded text-[#8A8580] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
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
    </div>
  )
}
