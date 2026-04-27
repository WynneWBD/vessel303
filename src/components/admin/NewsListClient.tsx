'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type NewsItem = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  cover_image_url: string | null
  status: 'draft' | 'published'
  updated_at: string
}

type Filters = { status: string; search: string }

const LIMIT = 20

function formatDate(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function NewsListClient({
  initialRows,
  initialTotal,
}: {
  initialRows: NewsItem[]
  initialTotal: number
}) {
  const router = useRouter()
  const [rows, setRows] = useState<NewsItem[]>(initialRows)
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
      const res = await fetch(`/api/admin/news?${sp}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('load failed')
      const data = await res.json() as { data: NewsItem[]; total: number }
      setRows(data.data)
      setTotal(data.total)
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search; immediate on status change
  useEffect(() => {
    const t = setTimeout(() => reload(filters, page), filters.search ? 300 : 0)
    return () => clearTimeout(t)
  }, [filters, page, reload])

  const handleFilterChange = (patch: Partial<Filters>) => {
    setPage(1)
    setFilters((f) => ({ ...f, ...patch }))
  }

  const handleDelete = async (item: NewsItem) => {
    if (!window.confirm(`确定删除这条新闻?\n「${item.title_zh}」`)) return
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? '删除失败')
      }
      toast.success('已删除')
      setRows((prev) => prev.filter((r) => r.id !== item.id))
      setTotal((n) => Math.max(0, n - 1))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1
          className="text-[#2C2A28]"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          新闻管理 News
        </h1>
        <Button asChild size="sm">
          <Link href="/admin/news/new">
            <Plus size={16} />
            新建新闻
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 max-w-xl">
        <Select
          value={filters.status}
          onChange={(e) => handleFilterChange({ status: e.target.value })}
          className="w-36"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </Select>
        <Input
          placeholder="搜索标题…"
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="flex-1 min-w-[180px]"
        />
      </div>

      {/* Table */}
      {rows.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#E5DED4] bg-[#FFFFFF] py-20">
          <p className="text-[#C4B9AB]">暂无新闻</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/news/new">+ 新建第一条新闻</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-[#E5DED4] overflow-hidden">
          {/* Table head */}
          <div
            className="grid gap-3 px-4 py-3 text-xs text-[#8A8580] bg-[#FAF7F2] border-b border-[#E5DED4]"
            style={{ gridTemplateColumns: '60px 1fr 90px 140px 80px' }}
          >
            <span>封面</span>
            <span>标题</span>
            <span>状态</span>
            <span>更新时间</span>
            <span>操作</span>
          </div>

          {/* Rows */}
          {rows.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 items-center px-4 py-3 border-b border-[#E5DED4] last:border-b-0 hover:bg-[#FAF7F2] transition-colors"
              style={{ gridTemplateColumns: '60px 1fr 90px 140px 80px' }}
            >
              {/* Cover */}
              <div className="w-[60px] h-[38px] rounded overflow-hidden bg-[#E5DED4] shrink-0">
                {item.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.cover_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#E5DED4]" />
                )}
              </div>

              {/* Title */}
              <div className="min-w-0">
                <p className="text-sm text-[#2C2A28] truncate font-medium">
                  {item.title_zh || '(无中文标题)'}
                </p>
                <p className="text-xs text-[#6B6560] truncate mt-0.5">
                  {item.title_en || '(no English title)'}
                </p>
              </div>

              {/* Status badge */}
              <div>
                {item.status === 'published' ? (
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                    已发布
                  </Badge>
                ) : (
                  <Badge className="bg-[#E5DED4] text-[#8A8580] border-[#C4B9AB] text-xs">
                    草稿
                  </Badge>
                )}
              </div>

              {/* Updated at */}
              <p className="text-xs text-[#8A8580]">{formatDate(item.updated_at)}</p>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                  <Link href={`/admin/news/${item.id}/edit`} title="编辑">
                    <Pencil size={14} />
                  </Link>
                </Button>
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

      {loading && <p className="text-xs text-[#8A8580]">加载中…</p>}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-[#8A8580]">
            {page} / {totalPages}（共 {total} 条）
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
