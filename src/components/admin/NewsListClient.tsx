'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CalendarClock,
  ExternalLink,
  Languages,
  Pencil,
  Pin,
  Plus,
  Send,
  Tag,
  ToggleLeft,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import type { NewsCategoryRow } from '@/lib/news-db'

type NewsItem = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  content_zh?: unknown
  content_en?: unknown
  excerpt_zh?: string | null
  excerpt_en?: string | null
  seo_title_zh?: string | null
  seo_title_en?: string | null
  seo_description_zh?: string | null
  seo_description_en?: string | null
  cover_image_url: string | null
  category_id: number | null
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
  status: 'draft' | 'published'
  scheduled_at: string | null
  updated_at: string
}

type Filters = { status: string; search: string; category: string; schedule: string }
type NewsCategoryOption = Pick<NewsCategoryRow, 'id' | 'slug' | 'title_zh' | 'title_en' | 'news_count'>
type CompletenessLevel = '完整' | '可展示但待补充' | '待补素材'

type NewsBasePath = '/admin/news' | '/admin/content/news'
type ReleaseTone = 'high' | 'medium' | 'safe'

type NewsReleaseSignals = {
  missingCover: boolean
  missingZhTitle: boolean
  missingEnTitle: boolean
  missingZhExcerpt: boolean
  missingEnExcerpt: boolean
  missingZhContent: boolean
  missingEnContent: boolean
  missingCategory: boolean
  missingSeoTitleZh: boolean
  missingSeoTitleEn: boolean
  missingSeoDescriptionZh: boolean
  missingSeoDescriptionEn: boolean
}

type NewsReleaseLedgerRow = {
  item: NewsItem
  stage: string
  issue: string
  detail: string
  coverage: string
  actionLabel: string
  anchor: string
  tone: ReleaseTone
  score: number
}

const LIMIT = 20
const TABLE_GRID_COLUMNS = '36px 60px minmax(260px,1.25fr) minmax(170px,0.85fr) 118px 92px 150px 120px'
const STATUS_QUICK_FILTERS: Array<{ label: string; status: Filters['status']; schedule?: Filters['schedule'] }> = [
  { label: '全部', status: '', schedule: '' },
  { label: '草稿', status: 'draft', schedule: '' },
  { label: '已发布', status: 'published', schedule: '' },
  { label: '定时', status: '', schedule: 'scheduled' },
]
const DISABLED_BATCH_ACTIONS: Array<{ label: string; Icon: LucideIcon }> = [
  { label: '发布', Icon: Send },
  { label: '定时任务', Icon: CalendarClock },
  { label: '置顶', Icon: Pin },
  { label: '状态', Icon: ToggleLeft },
  { label: '删除', Icon: Trash2 },
  { label: '翻译', Icon: Languages },
]

function formatDate(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isScheduled(item: NewsItem) {
  return item.status === 'draft' && Boolean(item.scheduled_at)
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasRichTextContent(value: unknown) {
  let found = false

  const visit = (node: unknown) => {
    if (found) return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!node || typeof node !== 'object') return

    const current = node as { text?: unknown; content?: unknown }
    if (typeof current.text === 'string' && current.text.trim()) {
      found = true
      return
    }
    visit(current.content)
  }

  visit(value)
  return found
}

function getNewsCompleteness(item: NewsItem): {
  level: CompletenessLevel
  issues: string[]
} {
  const issues: string[] = []

  if (!hasText(item.cover_image_url)) issues.push('缺封面')
  if (!hasText(item.title_zh)) issues.push('缺中文标题')
  if (!hasText(item.title_en)) issues.push('缺英文标题')
  if (!hasText(item.excerpt_zh)) issues.push('缺中文摘要')
  if (!hasText(item.excerpt_en)) issues.push('缺英文摘要')
  if (!hasRichTextContent(item.content_zh)) issues.push('缺中文正文')
  if (!hasRichTextContent(item.content_en)) issues.push('缺英文正文')
  if (!item.category_id) issues.push('未分类')
  if (
    !hasText(item.seo_title_zh)
    || !hasText(item.seo_title_en)
    || !hasText(item.seo_description_zh)
    || !hasText(item.seo_description_en)
  ) {
    issues.push('缺 SEO')
  }

  if (issues.length === 0) {
    return { level: '完整', issues }
  }

  if (issues.includes('缺封面')) {
    return { level: '待补素材', issues }
  }

  return { level: '可展示但待补充', issues }
}

function completenessBadgeClass(level: CompletenessLevel) {
  if (level === '完整') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (level === '待补素材') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-zinc-200 bg-zinc-50 text-zinc-600'
}

function getNewsReleaseSignals(item: NewsItem): NewsReleaseSignals {
  return {
    missingCover: !hasText(item.cover_image_url),
    missingZhTitle: !hasText(item.title_zh),
    missingEnTitle: !hasText(item.title_en),
    missingZhExcerpt: !hasText(item.excerpt_zh),
    missingEnExcerpt: !hasText(item.excerpt_en),
    missingZhContent: !hasRichTextContent(item.content_zh),
    missingEnContent: !hasRichTextContent(item.content_en),
    missingCategory: !item.category_id,
    missingSeoTitleZh: !hasText(item.seo_title_zh),
    missingSeoTitleEn: !hasText(item.seo_title_en),
    missingSeoDescriptionZh: !hasText(item.seo_description_zh),
    missingSeoDescriptionEn: !hasText(item.seo_description_en),
  }
}

function countTrue(values: boolean[]): number {
  return values.filter(Boolean).length
}

function buildCoverageText(signals: NewsReleaseSignals): string {
  const contentDone = 6 - countTrue([
    signals.missingZhTitle,
    signals.missingEnTitle,
    signals.missingZhExcerpt,
    signals.missingEnExcerpt,
    signals.missingZhContent,
    signals.missingEnContent,
  ])
  const seoDone = 4 - countTrue([
    signals.missingSeoTitleZh,
    signals.missingSeoTitleEn,
    signals.missingSeoDescriptionZh,
    signals.missingSeoDescriptionEn,
  ])
  const mediaDone = signals.missingCover ? 0 : 1
  return `内容 ${contentDone}/6 · SEO ${seoDone}/4 · 封面 ${mediaDone}/1`
}

function buildNewsReleaseLedgerRow(item: NewsItem): NewsReleaseLedgerRow {
  const signals = getNewsReleaseSignals(item)
  const missingBody = signals.missingZhContent || signals.missingEnContent
  const missingIntro = (
    signals.missingZhTitle
    || signals.missingEnTitle
    || signals.missingZhExcerpt
    || signals.missingEnExcerpt
  )
  const missingSeo = (
    signals.missingSeoTitleZh
    || signals.missingSeoTitleEn
    || signals.missingSeoDescriptionZh
    || signals.missingSeoDescriptionEn
  )

  if (signals.missingCover) {
    return {
      item,
      stage: '素材缺口',
      issue: '缺封面图',
      detail: '先补封面；否则新闻列表、详情首屏和社媒分享都缺少视觉锚点。',
      coverage: buildCoverageText(signals),
      actionLabel: '处理封面',
      anchor: '#media',
      tone: 'high',
      score: 100,
    }
  }

  if (missingBody) {
    return {
      item,
      stage: '正文缺口',
      issue: '中英文正文不完整',
      detail: '补齐正文后再做发布复核，避免公开页只有标题和摘要。',
      coverage: buildCoverageText(signals),
      actionLabel: '补正文',
      anchor: '#content',
      tone: 'high',
      score: 88,
    }
  }

  if (missingIntro) {
    return {
      item,
      stage: '语言缺口',
      issue: '标题或摘要不完整',
      detail: '补齐中英文标题和摘要，保证列表、详情和 SEO 摘要口径一致。',
      coverage: buildCoverageText(signals),
      actionLabel: '补字段',
      anchor: '#content',
      tone: 'medium',
      score: 74,
    }
  }

  if (missingSeo) {
    return {
      item,
      stage: 'SEO 缺口',
      issue: '搜索标题或描述不完整',
      detail: '补齐 SEO title / description，再进入发布检查。',
      coverage: buildCoverageText(signals),
      actionLabel: '补 SEO',
      anchor: '#seo',
      tone: 'medium',
      score: 66,
    }
  }

  if (signals.missingCategory) {
    return {
      item,
      stage: '分类缺口',
      issue: '未绑定新闻分类',
      detail: '绑定分类，方便前台筛选、内容归档和后台批量治理。',
      coverage: buildCoverageText(signals),
      actionLabel: '设分类',
      anchor: '#taxonomy',
      tone: 'medium',
      score: 56,
    }
  }

  if (isScheduled(item)) {
    return {
      item,
      stage: '排期复核',
      issue: '已设置定时发布',
      detail: '发布前复核发布时间、标题、摘要和 SEO 字段。',
      coverage: buildCoverageText(signals),
      actionLabel: '查排期',
      anchor: '#schedule',
      tone: 'medium',
      score: 48,
    }
  }

  if (item.status === 'draft') {
    return {
      item,
      stage: '发布前',
      issue: '草稿待发布',
      detail: '基础字段已齐，进入发布检查确认是否公开。',
      coverage: buildCoverageText(signals),
      actionLabel: '发布检查',
      anchor: '#publish-check',
      tone: 'safe',
      score: 34,
    }
  }

  return {
    item,
    stage: '已发布',
    issue: '基础字段完整',
    detail: '当前新闻可继续保持线上展示；如有调整，先走编辑页复核。',
    coverage: buildCoverageText(signals),
    actionLabel: '查看编辑',
    anchor: '#publish-check',
    tone: 'safe',
    score: 16,
  }
}

function buildNewsReleaseLedgerRows(rows: NewsItem[]): NewsReleaseLedgerRow[] {
  return rows
    .map(buildNewsReleaseLedgerRow)
    .sort((a, b) => b.score - a.score || new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime())
    .slice(0, 8)
}

function releaseToneClass(tone: ReleaseTone): string {
  if (tone === 'high') return 'border-[#F2C6A7] bg-[#FFF7F0] text-[#E36F2C]'
  if (tone === 'medium') return 'border-[#D8E7E8] bg-[#F7FAFA] text-[#1889B6]'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function newsEditHref(basePath: NewsBasePath, item: NewsItem, anchor: string): string {
  return `${basePath}/${item.id}/edit${anchor}`
}

function NewsReleaseLedger({
  rows,
  basePath,
}: {
  rows: NewsReleaseLedgerRow[]
  basePath: NewsBasePath
}) {
  const highCount = rows.filter((row) => row.tone === 'high').length
  const reviewCount = rows.filter((row) => row.tone === 'medium').length

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">Release Ledger</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">当前页发布处理台账</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#61767D]">
            按封面、正文、语言、SEO、分类和排期缺口排序，先处理会影响公开展示与搜索收录的新闻。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold ${releaseToneClass(highCount > 0 ? 'high' : 'safe')}`}>
            优先 {highCount}
          </span>
          <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold ${releaseToneClass(reviewCount > 0 ? 'medium' : 'safe')}`}>
            复核 {reviewCount}
          </span>
          <span className="inline-flex min-h-7 items-center rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 text-[11px] font-semibold text-[#61767D]">
            当前页 {rows.length} 条
          </span>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead className="bg-[#F7FAFA] text-[11px] uppercase tracking-[0.08em] text-[#61767D]">
                <tr>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">阶段</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">新闻</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">处理信号</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">覆盖度</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 font-bold">状态</th>
                  <th className="border-b border-[#D8E7E8] px-4 py-3 text-right font-bold">入口</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.item.id} className="border-b border-[#D8E7E8] last:border-b-0 hover:bg-[#F7FAFA]">
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${releaseToneClass(row.tone)}`}>
                        {row.stage}
                      </span>
                    </td>
                    <td className="max-w-[260px] px-4 py-3 align-top">
                      <div className="truncate text-sm font-bold text-[#1E2C31]" title={row.item.title_zh || row.item.title_en || row.item.slug}>
                        {row.item.title_zh || row.item.title_en || row.item.slug}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11px] text-[#8A9EA4]">/news/{row.item.slug}</div>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 align-top">
                      <div className="text-sm font-semibold text-[#1E2C31]">{row.issue}</div>
                      <div className="mt-1 text-[11px] leading-4 text-[#61767D]">{row.detail}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs font-semibold text-[#61767D]">
                      {row.coverage}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold ${
                        row.item.status === 'published'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : isScheduled(row.item)
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : 'border-[#F2C6A7] bg-[#FFF7F0] text-[#E36F2C]'
                      }`}>
                        {row.item.status === 'published' ? '已发布' : isScheduled(row.item) ? '定时' : '草稿'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <Link
                        href={newsEditHref(basePath, row.item, row.anchor)}
                        className="inline-flex min-h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-bold text-[#1889B6] hover:border-[#1889B6] hover:bg-[#EAF6F8]"
                      >
                        {row.actionLabel}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {rows.map((row) => (
              <Link
                key={row.item.id}
                href={newsEditHref(basePath, row.item, row.anchor)}
                className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-bold ${releaseToneClass(row.tone)}`}>
                    {row.stage}
                  </span>
                  <span className="text-[11px] font-bold text-[#1889B6]">{row.actionLabel}</span>
                </div>
                <div className="mt-2 truncate text-sm font-bold text-[#1E2C31]">
                  {row.item.title_zh || row.item.title_en || row.item.slug}
                </div>
                <div className="mt-1 text-xs text-[#61767D]">{row.issue}</div>
                <div className="mt-2 text-[11px] text-[#61767D]">{row.coverage}</div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="p-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
            当前页没有需要处理的新闻。
          </div>
        </div>
      )}
    </section>
  )
}

export default function NewsListClient({
  initialRows,
  initialTotal,
  initialFilters = { status: '', search: '', category: '', schedule: '' },
  initialPage = 1,
  initialCategories = [],
  basePath = '/admin/news',
}: {
  initialRows: NewsItem[]
  initialTotal: number
  initialFilters?: Filters
  initialPage?: number
  initialCategories?: NewsCategoryOption[]
  basePath?: '/admin/news' | '/admin/content/news'
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [rows, setRows] = useState<NewsItem[]>(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [loading, setLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<NewsItem | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [batchCategoryId, setBatchCategoryId] = useState('')
  const [pendingBatchCategoryId, setPendingBatchCategoryId] = useState('')
  const [movingCategory, setMovingCategory] = useState(false)
  const didSkipInitialLoad = useRef(false)

  const reload = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (f.status) sp.set('status', f.status)
      if (f.category) sp.set('category', f.category)
      if (f.schedule) sp.set('schedule', f.schedule)
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

  useEffect(() => {
    const sp = new URLSearchParams()
    if (filters.status) sp.set('status', filters.status)
    if (filters.category) sp.set('category', filters.category)
    if (filters.schedule) sp.set('schedule', filters.schedule)
    if (filters.search.trim()) sp.set('search', filters.search.trim())
    if (page > 1) sp.set('page', String(page))
    const query = sp.toString()
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
  }, [filters, page, pathname])

  useEffect(() => {
    const visibleIds = new Set(rows.map((row) => row.id))
    setSelectedIds((current) => current.filter((id) => visibleIds.has(id)))
  }, [rows])

  // Debounce search; immediate on status change
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

  const handleDelete = async (item: NewsItem) => {
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

  const selectedCount = selectedIds.length
  const allCurrentPageSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))

  const toggleAllCurrentPage = () => {
    const currentPageIds = rows.map((row) => row.id)
    setSelectedIds((current) => {
      if (currentPageIds.every((id) => current.includes(id))) {
        return current.filter((id) => !currentPageIds.includes(id))
      }
      return Array.from(new Set([...current, ...currentPageIds]))
    })
  }

  const toggleSelected = (id: number) => {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    ))
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

  const handleStartBatchCategory = () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择新闻')
      return
    }
    if (!batchCategoryId) {
      toast.error('请选择目标分类')
      return
    }
    setPendingBatchCategoryId(batchCategoryId)
  }

  const handleConfirmBatchCategory = async () => {
    const categoryId = Number(pendingBatchCategoryId)
    if (!Number.isInteger(categoryId) || categoryId <= 0) return

    setMovingCategory(true)
    try {
      const res = await fetch('/api/admin/news/batch/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, category_id: categoryId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? '批量转移失败')
      }
      const updatedCount = Number(data.data?.updatedCount ?? 0)
      toast.success(`已转移 ${updatedCount} 条新闻`)
      setSelectedIds([])
      setPendingBatchCategoryId('')
      await reload(filters, page)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量转移失败')
    } finally {
      setMovingCategory(false)
    }
  }

  const pendingBatchCategory = initialCategories.find((category) => String(category.id) === pendingBatchCategoryId)
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const releaseLedgerRows = buildNewsReleaseLedgerRows(rows)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#1E2C31]">当前新闻</p>
          <p className="mt-1 text-xs text-[#61767D]">
            共 {total.toLocaleString('zh-CN')} 条，本页 {rows.length.toLocaleString('zh-CN')} 条。
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`${basePath}/new`}>
            <Plus size={16} />
            新建新闻
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_QUICK_FILTERS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleFilterChange({ status: option.status, schedule: option.schedule ?? '' })}
              className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition-colors ${
                filters.status === option.status && filters.schedule === (option.schedule ?? '')
                  ? 'border-[#1889B6] bg-[#1889B6] text-white'
                  : 'border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#1889B6]/65 hover:text-[#1889B6]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex max-w-3xl flex-wrap items-center gap-3">
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value, schedule: '' })}
            className="w-36"
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </Select>
          <Select
            value={filters.schedule}
            onChange={(e) => handleFilterChange({ schedule: e.target.value, status: e.target.value ? '' : filters.status })}
            className="w-36"
            data-testid="news-schedule-filter"
          >
            <option value="">全部排期</option>
            <option value="scheduled">定时发布</option>
          </Select>
          <Select
            value={filters.category}
            onChange={(e) => handleFilterChange({ category: e.target.value })}
            className="w-40"
          >
            <option value="">全部分类</option>
            {initialCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title_zh}
              </option>
            ))}
          </Select>
        <Input
          placeholder="搜索标题…"
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="min-w-[180px] flex-1"
        />
        </div>
      </div>

      <div className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1E2C31]">批量操作</p>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              目前只开放低风险批量转分类；批量定时、批量发布和批量删除继续后置。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#D8E7E8] bg-white px-2.5 py-1 text-xs font-semibold text-[#61767D]">
              已选 {selectedCount} 条
            </span>
            <Select
              value={batchCategoryId}
              onChange={(e) => setBatchCategoryId(e.target.value)}
              disabled={selectedCount === 0 || movingCategory}
              className="h-8 w-36 text-xs"
              data-testid="news-batch-category-select"
            >
              <option value="">目标分类</option>
              {initialCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title_zh}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={selectedCount === 0 || !batchCategoryId || movingCategory}
              onClick={handleStartBatchCategory}
              data-testid="news-batch-category-button"
            >
              <Tag size={13} />
              转移分类
            </Button>
            {DISABLED_BATCH_ACTIONS.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                title={selectedCount > 0 ? 'B3-10 仍不开放高风险批量写入' : '先选择新闻；B3-10 仍只保留低风险批量转分类'}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#9AA9AD] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <NewsReleaseLedger rows={releaseLedgerRows} basePath={basePath} />

      {/* Table */}
      {rows.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#D8E7E8] bg-white py-16">
          <p className="text-sm font-semibold text-[#61767D]">暂无新闻</p>
          <Button asChild size="sm" variant="outline">
            <Link href={`${basePath}/new`}>+ 新建第一条新闻</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
          {/* Table head */}
          <div
            className="grid gap-3 border-b border-[#D8E7E8] bg-[#F7FAFA] px-4 py-2.5 text-xs font-semibold text-[#61767D]"
            style={{ gridTemplateColumns: TABLE_GRID_COLUMNS }}
          >
            <label className="flex items-center justify-center" title="选择当前页新闻">
              <input
                type="checkbox"
                checked={allCurrentPageSelected}
                onChange={toggleAllCurrentPage}
                data-testid="news-list-select-current-page"
                className="h-4 w-4 rounded border-[#D8E7E8] accent-[#E36F2C]"
                aria-label="选择当前页新闻"
              />
            </label>
            <span>封面</span>
            <span>标题</span>
            <span>内容 / SEO</span>
            <span>所属分类</span>
            <span>状态</span>
            <span>排期/更新</span>
            <span>操作</span>
          </div>

          {/* Rows */}
          {rows.map((item) => {
            const completeness = getNewsCompleteness(item)
            const visibleIssues = completeness.issues.slice(0, 3)
            const hiddenIssueCount = Math.max(0, completeness.issues.length - visibleIssues.length)

            return (
            <div
              key={item.id}
              data-testid={`news-list-row-${item.slug}`}
              className="grid items-center gap-3 border-b border-[#D8E7E8] px-4 py-2.5 transition-colors last:border-b-0 hover:bg-[#F7FAFA]"
              style={{ gridTemplateColumns: TABLE_GRID_COLUMNS }}
            >
              <label className="flex items-center justify-center" title="选择这条新闻">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelected(item.id)}
                  data-testid={`news-list-select-${item.slug}`}
                  className="h-4 w-4 rounded border-[#D8E7E8] accent-[#E36F2C]"
                  aria-label={`选择新闻 ${item.title_zh || item.title_en || item.id}`}
                />
              </label>

              {/* Cover */}
              <div className="h-[38px] w-[60px] shrink-0 overflow-hidden rounded-md bg-[#E6EEEE]">
                {item.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[#E6EEEE]" />
                )}
              </div>

              {/* Title */}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1E2C31]">
                  {item.title_zh || '(无中文标题)'}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#61767D]">
                  {item.title_en || '(no English title)'}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-[#8A9EA4]">/news/{item.slug}</p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className={`${completenessBadgeClass(completeness.level)} text-[11px]`}>
                    {completeness.level}
                  </Badge>
                  {visibleIssues.length === 0 ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      基础内容完整
                    </span>
                  ) : (
                    visibleIssues.map((issue) => (
                      <span
                        key={issue}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600"
                      >
                        {issue}
                      </span>
                    ))
                  )}
                  {hiddenIssueCount > 0 ? (
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500">
                      还有 {hiddenIssueCount} 项
                    </span>
                  ) : null}
                </div>
              </div>

              <div>
                {item.category_title_zh ? (
                  <Badge className="border-[#D8E7E8] bg-[#F7FAFA] text-xs text-[#61767D]">
                    {item.category_title_zh}
                  </Badge>
                ) : (
                  <span className="text-xs text-[#9AA9AD]">未分类</span>
                )}
              </div>

              {/* Status badge */}
              <div>
                {item.status === 'published' ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                    已发布
                  </Badge>
                ) : isScheduled(item) ? (
                  <Badge className="border-sky-200 bg-sky-50 text-sky-700 text-xs">
                    定时
                  </Badge>
                ) : (
                  <Badge className="border-[#F2C6A7] bg-[#FFF2E7] text-xs text-[#E36F2C]">
                    草稿
                  </Badge>
                )}
              </div>

              {/* Updated at */}
              <p className="text-xs leading-5 text-[#61767D]">
                {isScheduled(item) && item.scheduled_at ? (
                  <>
                    <span className="block font-semibold text-sky-700">{formatDate(item.scheduled_at)}</span>
                    <span className="block">定时发布</span>
                  </>
                ) : (
                  formatDate(item.updated_at)
                )}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {item.status === 'published' ? (
                  <Link
                    href={`/news/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="查看前台新闻"
                    className="flex h-8 w-8 items-center justify-center rounded text-[#61767D] transition-colors hover:bg-[#F0F7F8] hover:text-[#1889B6]"
                  >
                    <ExternalLink size={14} />
                  </Link>
                ) : (
                  <span
                    title="草稿未发布，暂无前台入口"
                    className="flex h-8 w-8 items-center justify-center rounded text-[#9AA9AD]"
                  >
                    <ExternalLink size={14} />
                  </span>
                )}
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                  <Link href={`${basePath}/${item.id}/edit`} title="编辑">
                    <Pencil size={14} />
                  </Link>
                </Button>
                <button
                  type="button"
                  title="删除"
                  onClick={() => setPendingDelete(item)}
                  className="flex h-8 w-8 items-center justify-center rounded text-[#61767D] transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {loading && <p className="text-xs text-[#61767D]">加载中…</p>}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-[#61767D]">
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

      <AdminConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="确认删除这条新闻？"
        description={`将删除「${pendingDelete?.title_zh ?? ''}」。删除后前台新闻页不再展示，操作会写入后台日志。`}
        confirmLabel="确认删除"
        tone="danger"
        loading={confirmingDelete}
        onConfirm={handleConfirmDelete}
      />

      <AdminConfirmDialog
        open={!!pendingBatchCategoryId}
        onOpenChange={(open) => {
          if (!open) setPendingBatchCategoryId('')
        }}
        title="确认批量转移分类？"
        description={`将 ${selectedCount} 条新闻转移到“${pendingBatchCategory?.title_zh ?? ''}”。本操作不会发布、删除或改变前台可见状态。`}
        confirmLabel="确认转移"
        loading={movingCategory}
        onConfirm={handleConfirmBatchCategory}
      />
    </div>
  )
}
