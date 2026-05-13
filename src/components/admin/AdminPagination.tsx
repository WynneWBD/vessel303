'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const PAGE_SIZE_OPTIONS = [20, 50, 100]

export default function AdminPagination({
  total,
  page,
  limit,
  loading,
  itemLabel,
  onPageChange,
  onLimitChange,
}: {
  total: number
  page: number
  limit: number
  loading?: boolean
  itemLabel: string
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(page, 1), pageCount)
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1
  const to = Math.min(total, safePage * limit)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#E5DED4] bg-[#FFFFFF] px-4 py-3 text-xs text-[#8A8580] md:flex-row md:items-center md:justify-between">
      <div>
        {loading ? '加载中' : `显示 ${from}-${to} / 共 ${total} ${itemLabel}`}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span>每页</span>
        <Select
          className="h-8 w-24 text-xs"
          value={String(limit)}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          disabled={loading}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft size={14} />
          上一页
        </Button>
        <span className="min-w-20 text-center">
          第 {safePage} / {pageCount} 页
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          下一页
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
