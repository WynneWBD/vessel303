'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Inbox,
  ListChecks,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  RefreshCcw,
  SearchX,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminPagination from '@/components/admin/AdminPagination'
import type { Lead, LeadSourceStatusSummary, LeadStatus } from '@/lib/leads-db'
import { describeLeadSource, LEAD_SOURCE_TYPE_OPTIONS } from '@/lib/lead-source'

type Filters = {
  status: string
  inquiry_type: string
  source_type: string
  country: string
  search: string
}

export type LeadDashboardSummary = {
  total: number
  new: number
  contacting: number
  quoted: number
  won: number
  lost: number
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: '新' },
  { value: 'contacting', label: '跟进中' },
  { value: 'quoted', label: '已报价' },
  { value: 'won', label: '已成交' },
  { value: 'lost', label: '已废弃' },
]

const INQUIRY_OPTIONS = [
  { value: 'B-buyer', label: 'B-采购商' },
  { value: 'B-investor', label: 'B-投资方' },
  { value: 'B-agent', label: 'B-代理' },
  { value: 'C-individual', label: 'C-个人' },
]

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
)

type LeadPriorityTone = 'critical' | 'warning' | 'active' | 'success' | 'muted'

type LeadPriority = {
  label: string
  detail: string
  score: number
  tone: LeadPriorityTone
  Icon: LucideIcon
}

const ACTIVE_LEAD_STATUSES: LeadStatus[] = ['new', 'contacting', 'quoted']

function statusBadgeClass(status: string) {
  switch (status) {
    case 'new':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'contacting':
      return 'border-sky-200 bg-sky-50 text-sky-700'
    case 'quoted':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'won':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'lost':
      return 'border-slate-200 bg-slate-50 text-slate-600'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600'
  }
}

function priorityBadgeClass(tone: LeadPriorityTone) {
  switch (tone) {
    case 'critical':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'active':
      return 'border-sky-200 bg-sky-50 text-sky-700'
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600'
  }
}

function sourceBadgeClass(type: string) {
  switch (type) {
    case 'product':
    case 'case':
      return 'border-[#1889B6]/20 bg-[#EAF6F8] text-[#14789E]'
    case 'media-kit':
    case 'scenario':
    case 'innovation':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'contact':
    case 'faq':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'admin-test':
      return 'border-slate-200 bg-slate-50 text-slate-600'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

function isActiveLeadStatus(status: LeadStatus) {
  return ACTIVE_LEAD_STATUSES.includes(status)
}

function hoursSince(ts: string) {
  const time = new Date(ts).getTime()
  if (!Number.isFinite(time)) return 0
  return Math.max(0, Math.floor((Date.now() - time) / 36e5))
}

function formatAge(ts: string) {
  const hours = hoursSince(ts)
  if (hours < 1) return '<1 小时'
  if (hours < 24) return `${hours} 小时`
  return `${Math.floor(hours / 24)} 天`
}

function compactValue(value: string | null | undefined, fallback = '—') {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

function truncateText(value: string | null | undefined, max = 64) {
  const text = value?.trim()
  if (!text) return '—'
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

function getLeadPriority(lead: Lead): LeadPriority {
  const createdHours = hoursSince(lead.created_at)
  const updatedHours = hoursSince(lead.updated_at)

  if (lead.status === 'new') {
    if (createdHours >= 24) {
      return {
        label: 'P0 超时新线索',
        detail: '新线索超过 24 小时未转入跟进',
        score: 50,
        tone: 'critical',
        Icon: AlertTriangle,
      }
    }
    return {
      label: 'P0 首次响应',
      detail: '确认需求、来源和负责人',
      score: 45,
      tone: 'critical',
      Icon: Inbox,
    }
  }

  if (lead.status === 'contacting') {
    if (updatedHours >= 24 * 7) {
      return {
        label: 'P1 跟进断点',
        detail: '跟进中超过 7 天未更新',
        score: 40,
        tone: 'warning',
        Icon: Clock3,
      }
    }
    return {
      label: 'P1 持续跟进',
      detail: '保持沟通并补充备注',
      score: 32,
      tone: 'active',
      Icon: MessageSquareText,
    }
  }

  if (lead.status === 'quoted') {
    if (updatedHours >= 24 * 7) {
      return {
        label: 'P2 报价回访',
        detail: '报价后超过 7 天未更新',
        score: 30,
        tone: 'warning',
        Icon: FileText,
      }
    }
    return {
      label: 'P2 等待反馈',
      detail: '关注客户报价反馈',
      score: 24,
      tone: 'active',
      Icon: FileText,
    }
  }

  if (lead.status === 'won') {
    return {
      label: '已成交',
      detail: '保留归档记录',
      score: 10,
      tone: 'success',
      Icon: BadgeCheck,
    }
  }

  return {
    label: '已关闭',
    detail: '低优先级归档线索',
    score: 0,
    tone: 'muted',
    Icon: ShieldCheck,
  }
}

function getLeadGaps(lead: Lead) {
  const gaps: string[] = []
  if (isActiveLeadStatus(lead.status) && !lead.assigned_to?.trim()) gaps.push('未分配')
  if (!lead.name?.trim()) gaps.push('缺姓名')
  if (!lead.phone?.trim()) gaps.push('缺电话')
  if (!lead.company?.trim()) gaps.push('缺公司')
  if (!lead.message?.trim()) gaps.push('缺留言')
  return gaps
}

function buildSourceBreakdown(leads: Lead[]) {
  const counts = new Map<string, { label: string; count: number; type: string }>()
  for (const lead of leads) {
    const source = describeLeadSource(lead.source)
    const current = counts.get(source.type) ?? {
      label: source.typeLabel,
      count: 0,
      type: source.type,
    }
    current.count += 1
    counts.set(source.type, current)
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count)
}

function formatDate(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

export default function LeadsClient({
  initialLeads,
  initialTotal,
  initialFilters,
  initialPage,
  initialLimit,
  allowTestLeadCreation,
  allowDelete = false,
  summary,
  sourceStatusSummary = [],
}: {
  initialLeads: Lead[]
  initialTotal: number
  initialFilters: Filters
  initialPage: number
  initialLimit: number
  allowTestLeadCreation: boolean
  allowDelete?: boolean
  summary?: LeadDashboardSummary
  sourceStatusSummary?: LeadSourceStatusSummary[]
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.inquiry_type !== 'all' ||
    filters.source_type !== 'all' ||
    filters.country.trim().length > 0 ||
    filters.search.trim().length > 0
  const visibleStart = total === 0 ? 0 : (page - 1) * limit + 1
  const visibleEnd = Math.min(total, (page - 1) * limit + leads.length)
  const visibleRange = total === 0 ? '0' : `${visibleStart}-${visibleEnd}`

  const resetFilters = () => {
    setFilters({ status: 'all', inquiry_type: 'all', source_type: 'all', country: '', search: '' })
    setPage(1)
  }

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const buildQuery = useCallback((f: Filters, paging?: { page: number; limit: number }) => {
    const sp = new URLSearchParams()
    if (f.status && f.status !== 'all') sp.set('status', f.status)
    if (f.inquiry_type && f.inquiry_type !== 'all') sp.set('inquiry_type', f.inquiry_type)
    if (f.source_type && f.source_type !== 'all') sp.set('source_type', f.source_type)
    if (f.country) sp.set('country', f.country)
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
        const res = await fetch(`/api/admin/leads${qs ? `?${qs}` : ''}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('Failed to load')
        const data = (await res.json()) as { leads: Lead[]; total: number; page: number; limit: number }
        setLeads(data.leads)
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

  // Debounce search/country text inputs; selects fire immediately.
  useEffect(() => {
    const t = setTimeout(() => {
      reload(filters, page, limit)
    }, 300)
    return () => clearTimeout(t)
  }, [filters, page, limit, reload])

  const handleExport = () => {
    const qs = buildQuery(filters)
    window.location.href = `/api/admin/leads/export${qs ? `?${qs}` : ''}`
  }

  const handleSelect = async (lead: Lead) => {
    // Re-fetch to get freshest record (notes may have changed).
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = (await res.json()) as { lead: Lead }
        setSelected(data.lead)
      } else {
        setSelected(lead)
      }
    } catch {
      setSelected(lead)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('已删除')
      setSelected(null)
      await reload(filters, page, limit)
      router.refresh()
    } catch (err) {
      toast.error('删除失败')
      console.error(err)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmingDelete(true)
    try {
      await handleDelete(pendingDelete.id)
      setPendingDelete(null)
    } finally {
      setConfirmingDelete(false)
    }
  }

  const handleSave = async (lead: Lead, patch: {
    status: LeadStatus
    assigned_to: string
    note_append: string
  }) => {
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: patch.status,
          assigned_to: patch.assigned_to || null,
          note_append: patch.note_append || null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const data = (await res.json()) as { lead: Lead }
      toast.success('已保存')
      setSelected(data.lead)
      await reload(filters, page, limit)
      router.refresh()
    } catch (err) {
      toast.error('保存失败')
      console.error(err)
    }
  }

  const handleCreate = async (form: {
    email: string
    name: string
    inquiry_type: string
    message: string
  }) => {
    if (!allowTestLeadCreation) {
      toast.error('当前环境不允许新建测试线索')
      return
    }

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name || null,
          inquiry_type: form.inquiry_type || null,
          message: form.message || null,
          source: 'admin_test',
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Create failed')
      }
      toast.success('测试线索已新建')
      setNewOpen(false)
      setPage(1)
      await reload(filters, 1, limit)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新建失败')
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#1889B6] uppercase">Lead Operations</p>
            <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">线索处理台</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
              按优先级处理官网表单、案例询盘和 Media Kit 申请；本页只更新线索跟进状态和备注，不扩展订单、支付或会员价格体系。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {allowTestLeadCreation ? (
              <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
                <Plus size={16} />
                新建测试线索
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={16} />
              导出 CSV
            </Button>
          </div>
        </div>
        {summary && <LeadSummaryGrid summary={summary} />}
      </section>

      <LeadOperationsDesk
        leads={leads}
        summary={summary}
        total={total}
        loading={loading}
        onSelect={handleSelect}
      />

      <LeadSourceStatusMatrix
        sourceStatusSummary={sourceStatusSummary}
        activeSourceType={filters.source_type}
        activeStatus={filters.status}
        onApplyFilter={updateFilters}
      />

      {/* Filter bar */}
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#E6EEEE] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[#1889B6]" />
              <h2 className="text-base font-bold text-[#1E2C31]">线索筛选</h2>
              {loading ? (
                <span className="rounded-full bg-[#F0F7F8] px-2 py-0.5 text-xs font-semibold text-[#1889B6]">
                  加载中
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-[#61767D]">
              当前匹配 {total.toLocaleString('zh-CN')} 条，显示 {visibleRange}。
            </p>
          </div>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <RefreshCcw size={14} />
              清空筛选
            </Button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
          >
            <option value="all">状态:全部</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.inquiry_type}
            onChange={(e) => updateFilters({ inquiry_type: e.target.value })}
          >
            <option value="all">身份:全部</option>
            {INQUIRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.source_type}
            onChange={(e) => updateFilters({ source_type: e.target.value })}
          >
            {LEAD_SOURCE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            placeholder="国家"
            value={filters.country}
            onChange={(e) => updateFilters({ country: e.target.value })}
          />
          <Input
            placeholder="关键词(邮箱/姓名/公司/留言)"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>
      </section>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#E6EEEE] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1E2C31]">当前线索结果</h2>
            <p className="mt-1 text-xs text-[#61767D]">
              按创建时间倒序；点击任意行打开右侧处理抽屉。
            </p>
          </div>
          <span className="text-xs font-semibold text-[#61767D]">
            {leads.length.toLocaleString('zh-CN')} / {total.toLocaleString('zh-CN')} 条
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
                <th className="text-left font-medium px-4 py-3">优先级</th>
                <th className="text-left font-medium px-4 py-3">客户</th>
                <th className="text-left font-medium px-4 py-3">状态</th>
                <th className="text-left font-medium px-4 py-3">来源路径</th>
                <th className="text-left font-medium px-4 py-3">需求摘要</th>
                <th className="text-left font-medium px-4 py-3">缺项 / 更新</th>
                <th className="text-left font-medium px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      {hasActiveFilters ? (
                        <SearchX size={32} className="text-[#8A9EA4]" />
                      ) : (
                        <Mail size={32} className="text-[#8A9EA4]" />
                      )}
                      <p className="text-[#61767D]">
                        {hasActiveFilters ? '没有找到符合条件的线索' : '暂无线索'}
                      </p>
                      <p className="text-xs text-[#61767D]">
                        公开询价表单接入后,线索会自动显示在这里
                      </p>
                      {hasActiveFilters ? (
                        <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                          清空筛选
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )}
              {leads.map((lead) => {
                const priority = getLeadPriority(lead)
                const PriorityIcon = priority.Icon
                const sourceInfo = describeLeadSource(lead.source)
                const gaps = getLeadGaps(lead)

                return (
                  <tr
                    key={lead.id}
                    data-lead-id={lead.id}
                    className="cursor-pointer border-b border-[#E6EEEE] align-top transition-colors hover:bg-[#F7FAFA]"
                    onClick={() => handleSelect(lead)}
                  >
                    <td className="w-[190px] px-4 py-3">
                      <Badge className={priorityBadgeClass(priority.tone)}>
                        <PriorityIcon size={12} className="mr-1" />
                        {priority.label}
                      </Badge>
                      <p className="mt-1 text-xs leading-5 text-[#61767D]">{priority.detail}</p>
                    </td>
                    <td className="min-w-[260px] px-4 py-3">
                      <p className="break-all font-semibold text-[#1E2C31]">{lead.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#61767D]">
                        <span>{compactValue(lead.name, '未填姓名')}</span>
                        <span>{compactValue(lead.company, '未填公司')}</span>
                        <span>{compactValue(lead.country, '未填国家')}</span>
                      </div>
                      {lead.phone ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#61767D]">
                          <Phone size={12} />
                          {lead.phone}
                        </p>
                      ) : null}
                    </td>
                    <td className="w-[160px] px-4 py-3">
                      <Badge className={statusBadgeClass(lead.status)}>
                        {STATUS_LABEL[lead.status] ?? lead.status}
                      </Badge>
                      <p className="mt-2 text-xs text-[#61767D]">
                        {lead.assigned_to ? `负责人 ${lead.assigned_to}` : '未分配负责人'}
                      </p>
                    </td>
                    <td className="min-w-[220px] px-4 py-3">
                      <Badge className={sourceBadgeClass(sourceInfo.type)}>
                        {sourceInfo.typeLabel}
                      </Badge>
                      <p className="mt-2 max-w-[260px] truncate text-xs font-semibold text-[#1E2C31]">
                        {sourceInfo.label}
                      </p>
                      <p className="mt-1 max-w-[260px] truncate text-xs text-[#8A9EA4]">
                        {sourceInfo.raw}
                      </p>
                    </td>
                    <td className="min-w-[230px] px-4 py-3">
                      <p className="text-xs font-semibold text-[#1E2C31]">
                        {compactValue(lead.inquiry_type, '身份未填')}
                        {lead.sku_interest ? ` / ${lead.sku_interest}` : ''}
                      </p>
                      <p className="mt-2 max-w-[300px] text-xs leading-5 text-[#61767D]">
                        {truncateText(lead.message, 78)}
                      </p>
                    </td>
                    <td className="w-[210px] px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {gaps.length > 0 ? (
                          gaps.slice(0, 4).map((gap) => (
                            <span
                              key={gap}
                              className="rounded-full bg-[#FFF2E7] px-2 py-0.5 text-[11px] font-semibold text-[#E36F2C]"
                            >
                              {gap}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F7F4] px-2 py-0.5 text-[11px] font-semibold text-[#159477]">
                            <CheckCircle2 size={11} />
                            信息完整
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-[#61767D]">
                        创建 {formatAge(lead.created_at)}前 / 更新 {formatAge(lead.updated_at)}前
                      </p>
                    </td>
                    <td className="w-[96px] px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E36F2C]">
                        查看 <ArrowUpRight size={12} />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {total > 0 ? (
        <AdminPagination
          total={total}
          page={page}
          limit={limit}
          loading={loading}
          itemLabel="条线索"
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit)
            setPage(1)
          }}
        />
      ) : null}

      {/* Detail sheet */}
      <LeadDetailSheet
        key={selected?.id ?? 'no-lead'}
        lead={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onDelete={allowDelete ? setPendingDelete : undefined}
      />

      {allowTestLeadCreation ? (
        <NewLeadDialog
          key={newOpen ? 'new-lead-open' : 'new-lead-closed'}
          open={newOpen}
          onOpenChange={setNewOpen}
          onSubmit={handleCreate}
        />
      ) : null}

      <AdminConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="确认删除这条线索？"
        description={`将删除「${pendingDelete?.email ?? ''}」。此操作会把线索标记为删除，必要时可从数据库恢复。`}
        confirmLabel="确认删除"
        tone="danger"
        loading={confirmingDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

function LeadOperationsDesk({
  leads,
  summary,
  total,
  loading,
  onSelect,
}: {
  leads: Lead[]
  summary?: LeadDashboardSummary
  total: number
  loading: boolean
  onSelect: (lead: Lead) => void
}) {
  const ranked = leads
    .map((lead) => ({ lead, priority: getLeadPriority(lead) }))
    .filter(({ lead }) => isActiveLeadStatus(lead.status))
    .sort((a, b) => {
      if (b.priority.score !== a.priority.score) return b.priority.score - a.priority.score
      return new Date(a.lead.created_at).getTime() - new Date(b.lead.created_at).getTime()
    })
  const queue = ranked.slice(0, 5)
  const pageP0 = ranked.filter(({ priority }) => priority.tone === 'critical').length
  const pageWarning = ranked.filter(({ priority }) => priority.tone === 'warning').length
  const pageUnassigned = leads.filter(
    (lead) => isActiveLeadStatus(lead.status) && !lead.assigned_to?.trim(),
  ).length
  const sourceBreakdown = buildSourceBreakdown(leads).slice(0, 4)
  const activePipeline = summary ? summary.new + summary.contacting + summary.quoted : 0

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#E6EEEE] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1E2C31]">当前筛选处理队列</h2>
            <p className="mt-1 text-xs text-[#61767D]">
              按状态、超时和更新时间排序；这里只读取当前页线索，不修改数据。
            </p>
          </div>
          <span className="rounded-full bg-[#F0F7F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
            {loading ? '刷新中' : `${queue.length} 条优先项`}
          </span>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {queue.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E7F7F4] text-[#159477]">
                <CheckCircle2 size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1E2C31]">当前页暂无高优先级待处理线索</p>
                <p className="mt-1 text-xs text-[#61767D]">可继续调整筛选条件或查看全部线索。</p>
              </div>
            </div>
          ) : (
            queue.map(({ lead, priority }) => {
              const sourceInfo = describeLeadSource(lead.source)
              const PriorityIcon = priority.Icon

              return (
                <button
                  key={lead.id}
                  type="button"
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-[#F7FAFA]"
                  onClick={() => onSelect(lead)}
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${priorityBadgeClass(priority.tone)}`}>
                    <PriorityIcon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <span className="break-all text-sm font-semibold text-[#1E2C31]">{lead.email}</span>
                      <span className="text-xs text-[#61767D]">创建 {formatAge(lead.created_at)}前</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#61767D]">
                      <Badge className={priorityBadgeClass(priority.tone)}>{priority.label}</Badge>
                      <span>{STATUS_LABEL[lead.status] ?? lead.status}</span>
                      <span>{sourceInfo.typeLabel}</span>
                      <span>{compactValue(lead.country, '国家未填')}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#61767D]">
                      {priority.detail} / {truncateText(lead.message, 72)}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <aside className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">处理负载</h2>
          <p className="mt-1 text-xs text-[#61767D]">总量来自当前筛选，风险项来自当前页。</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5">
          <LeadDeskMetric label="活跃漏斗" value={activePipeline} detail="新线索+跟进+报价" Icon={ListChecks} />
          <LeadDeskMetric label="当前匹配" value={total} detail="筛选后的总数" Icon={MessageSquareText} />
          <LeadDeskMetric label="P0 新线索" value={pageP0} detail="当前页需先处理" Icon={AlertTriangle} tone="orange" />
          <LeadDeskMetric label="未分配" value={pageUnassigned} detail="当前页活跃线索" Icon={UserRoundCheck} tone="blue" />
        </div>
        <div className="border-t border-[#E6EEEE] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#1E2C31]">当前页来源</h3>
            {pageWarning > 0 ? (
              <span className="text-xs font-semibold text-[#E36F2C]">{pageWarning} 条需回访</span>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            {sourceBreakdown.length === 0 ? (
              <p className="text-xs text-[#61767D]">暂无来源数据。</p>
            ) : (
              sourceBreakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between gap-3 text-xs">
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${sourceBadgeClass(item.type)}`}>
                    {item.label}
                  </span>
                  <span className="font-bold text-[#1E2C31]">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </section>
  )
}

function LeadSourceStatusMatrix({
  sourceStatusSummary,
  activeSourceType,
  activeStatus,
  onApplyFilter,
}: {
  sourceStatusSummary: LeadSourceStatusSummary[]
  activeSourceType: string
  activeStatus: string
  onApplyFilter: (patch: Partial<Filters>) => void
}) {
  const total = sourceStatusSummary.reduce((sum, item) => sum + item.total, 0)
  const activePipeline = sourceStatusSummary.reduce(
    (sum, item) => sum + item.new + item.contacting + item.quoted,
    0,
  )
  const closed = sourceStatusSummary.reduce((sum, item) => sum + item.won + item.lost, 0)

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#1889B6] uppercase">Source Funnel</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">来源转化矩阵</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#61767D]">
            按站点入口聚合全部有效线索，观察每个来源从新线索、跟进、报价到成交/关闭的状态分布；点击计数会复用下方现有筛选。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs sm:min-w-[360px]">
          <SourceMatrixMetric label="全部来源线索" value={total} />
          <SourceMatrixMetric label="活跃漏斗" value={activePipeline} />
          <SourceMatrixMetric label="已收口" value={closed} />
        </div>
      </div>

      {sourceStatusSummary.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
            <ListChecks size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#1E2C31]">暂无来源矩阵数据</p>
            <p className="mt-1 text-xs text-[#61767D]">当前 leads 表没有可聚合的有效线索。</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                <th className="min-w-44 px-5 py-3 text-left font-semibold">来源入口</th>
                <th className="px-3 py-3 text-right font-semibold">全部</th>
                {STATUS_OPTIONS.map((status) => (
                  <th key={status.value} className="px-3 py-3 text-right font-semibold">
                    {status.label}
                  </th>
                ))}
                <th className="min-w-28 px-5 py-3 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EEEE]">
              {sourceStatusSummary.map((item) => {
                const isActiveSource = activeSourceType === item.type
                const activeCount =
                  item.total > 0 ? Math.round(((item.new + item.contacting + item.quoted) / item.total) * 100) : 0

                return (
                  <tr key={item.type} className={isActiveSource ? 'bg-[#F7FAFA]' : undefined}>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => onApplyFilter({ source_type: item.type, status: 'all' })}
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition hover:border-[#1889B6]/60 ${
                          isActiveSource && activeStatus === 'all'
                            ? 'border-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
                            : sourceBadgeClass(item.type)
                        }`}
                      >
                        {item.label}
                      </button>
                      <p className="mt-1 text-[11px] text-[#8A9EA4]">活跃占比 {activeCount}%</p>
                    </td>
                    <td className="px-3 py-3 text-right text-base font-bold text-[#1E2C31]">
                      {item.total.toLocaleString('zh-CN')}
                    </td>
                    {STATUS_OPTIONS.map((status) => (
                      <td key={status.value} className="px-3 py-3 text-right">
                        <SourceStatusButton
                          count={item[status.value]}
                          active={isActiveSource && activeStatus === status.value}
                          onClick={() => onApplyFilter({ source_type: item.type, status: status.value })}
                        />
                      </td>
                    ))}
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onApplyFilter({ source_type: item.type, status: 'all' })}
                        className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-[#1889B6] transition hover:text-[#E36F2C]"
                      >
                        查看来源
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function SourceMatrixMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#61767D]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#1E2C31]">{value.toLocaleString('zh-CN')}</p>
    </div>
  )
}

function SourceStatusButton({
  count,
  active,
  onClick,
}: {
  count: number
  active: boolean
  onClick: () => void
}) {
  if (count === 0) {
    return <span className="text-xs font-semibold text-[#B4C0C4]">0</span>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-10 rounded-md border px-2 py-1 text-xs font-bold transition hover:border-[#1889B6]/60 hover:bg-[#EAF6F8] hover:text-[#1889B6] ${
        active
          ? 'border-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
          : 'border-[#E6EEEE] bg-white text-[#1E2C31]'
      }`}
    >
      {count.toLocaleString('zh-CN')}
    </button>
  )
}

function LeadDeskMetric({
  label,
  value,
  detail,
  Icon,
  tone = 'teal',
}: {
  label: string
  value: number
  detail: string
  Icon: LucideIcon
  tone?: 'teal' | 'orange' | 'blue'
}) {
  const toneClass =
    tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : tone === 'blue'
        ? 'bg-blue-50 text-blue-700'
        : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <div className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#61767D]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#1E2C31]">{value.toLocaleString('zh-CN')}</p>
        </div>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function LeadSummaryGrid({ summary }: { summary: LeadDashboardSummary }) {
  const items = [
    { label: '全部线索', value: summary.total, detail: '当前未删除线索', Icon: Mail, tone: 'bg-[#F0F7F8] text-[#1889B6]' },
    { label: '新线索', value: summary.new, detail: '需要优先跟进', Icon: Inbox, tone: 'bg-[#FFF2E7] text-[#E36F2C]' },
    { label: '跟进中', value: summary.contacting, detail: '正在沟通', Icon: Clock3, tone: 'bg-sky-50 text-sky-700' },
    { label: '已报价', value: summary.quoted, detail: '等待客户反馈', Icon: FileText, tone: 'bg-blue-50 text-blue-700' },
    { label: '已成交', value: summary.won, detail: '成交线索', Icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map(({ label, value, detail, Icon, tone }) => (
        <div key={label} className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#61767D]">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#1E2C31]">{value.toLocaleString('zh-CN')}</p>
              <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
            </div>
            <span className={`flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>
              <Icon size={17} />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function LeadDetailSheet({
  lead,
  onClose,
  onSave,
  onDelete,
}: {
  lead: Lead | null
  onClose: () => void
  onSave: (
    lead: Lead,
    patch: { status: LeadStatus; assigned_to: string; note_append: string },
  ) => Promise<void>
  onDelete?: (lead: Lead) => void
}) {
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? 'new')
  const [assignedTo, setAssignedTo] = useState(lead?.assigned_to ?? '')
  const [noteAppend, setNoteAppend] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!lead) return
    setSaving(true)
    await onSave(lead, { status, assigned_to: assignedTo, note_append: noteAppend })
    setNoteAppend('')
    setSaving(false)
  }
  const sourceInfo = lead ? describeLeadSource(lead.source) : null
  const priority = lead ? getLeadPriority(lead) : null
  const gaps = lead ? getLeadGaps(lead) : []
  const PriorityIcon = priority?.Icon ?? Mail

  return (
    <Sheet
      open={!!lead}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <SheetContent className="w-[680px]">
        {lead && (
          <>
            <SheetHeader>
              <SheetTitle className="break-all pr-8">{lead.email}</SheetTitle>
              <div className="flex items-center gap-2">
                <Badge className={statusBadgeClass(lead.status)}>
                  {STATUS_LABEL[lead.status] ?? lead.status}
                </Badge>
                <span className="text-xs text-[#61767D]">
                  创建于 {formatDate(lead.created_at)}
                </span>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
              {priority && (
                <section className="rounded-md border border-[#D8E7E8] bg-[#FBFDFD] p-4">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${priorityBadgeClass(priority.tone)}`}>
                      <PriorityIcon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={priorityBadgeClass(priority.tone)}>{priority.label}</Badge>
                        <Badge className={statusBadgeClass(lead.status)}>
                          {STATUS_LABEL[lead.status] ?? lead.status}
                        </Badge>
                        {sourceInfo ? (
                          <Badge className={sourceBadgeClass(sourceInfo.type)}>
                            {sourceInfo.typeLabel}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#1E2C31]">{priority.detail}</p>
                      <p className="mt-1 text-xs leading-5 text-[#61767D]">
                        创建 {formatAge(lead.created_at)}前 / 更新 {formatAge(lead.updated_at)}前。保存只会更新状态、负责人和追加备注。
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {gaps.length > 0 ? (
                          gaps.map((gap) => (
                            <span
                              key={gap}
                              className="rounded-full bg-[#FFF2E7] px-2 py-0.5 text-[11px] font-semibold text-[#E36F2C]"
                            >
                              {gap}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F7F4] px-2 py-0.5 text-[11px] font-semibold text-[#159477]">
                            <CheckCircle2 size={11} />
                            当前字段完整
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Core info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="姓名" value={lead.name} />
                <Field label="公司" value={lead.company} />
                <Field label="电话" value={lead.phone} />
                <Field label="国家" value={lead.country} />
                <Field label="身份" value={lead.inquiry_type} />
                <Field label="SKU 兴趣" value={lead.sku_interest} />
                <div className="col-span-2 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3">
                  <div className="text-xs text-[#61767D]">来源</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#1E2C31]">
                    <span className="font-semibold">{sourceInfo?.label ?? lead.source ?? '—'}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#61767D]">
                      {sourceInfo?.typeLabel ?? '其他来源'}
                    </span>
                    {sourceInfo?.href ? (
                      <a
                        href={sourceInfo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#E36F2C] hover:underline"
                      >
                        打开来源页 <ExternalLink size={12} />
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-1 break-all text-xs text-[#61767D]">{lead.source || '—'}</div>
                </div>
                <Field label="更新时间" value={formatDate(lead.updated_at)} />
              </div>

              {/* Message */}
              <div>
                <div className="text-xs text-[#61767D] mb-2">留言内容</div>
                <div className="rounded-md bg-[#F7FAFA] border border-[#D8E7E8] p-3 text-sm text-[#1E2C31] whitespace-pre-wrap min-h-[80px]">
                  {lead.message || <span className="text-[#61767D]">(无留言)</span>}
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="text-xs text-[#61767D] mb-2">状态</div>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Assigned to */}
              <div>
                <div className="text-xs text-[#61767D] mb-2">分配销售(邮箱)</div>
                <Input
                  type="email"
                  placeholder="sales@example.com"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div>
                <div className="text-xs text-[#61767D] mb-2">追加备注</div>
                <Textarea
                  rows={3}
                  placeholder="本次保存时会追加到备注顶部,带时间戳"
                  value={noteAppend}
                  onChange={(e) => setNoteAppend(e.target.value)}
                />
                {lead.notes && (
                  <div className="mt-3">
                    <div className="text-xs text-[#61767D] mb-2">历史备注</div>
                    <div className="rounded-md bg-[#F7FAFA] border border-[#D8E7E8] p-3 text-xs text-[#9AA9AD] whitespace-pre-wrap max-h-40 overflow-auto">
                      {lead.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <SheetFooter>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(lead)}
                  disabled={saving}
                >
                  <Trash2 size={16} />
                  删除
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-[#61767D]">{label}</div>
      <div className="text-sm text-[#1E2C31] break-all">{value || '—'}</div>
    </div>
  )
}

function NewLeadDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (form: {
    email: string
    name: string
    inquiry_type: string
    message: string
  }) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [inquiryType, setInquiryType] = useState('B-buyer')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('邮箱必填')
      return
    }
    setSubmitting(true)
    await onSubmit({ email: email.trim(), name: name.trim(), inquiry_type: inquiryType, message: message.trim() })
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建测试线索</DialogTitle>
          <DialogDescription>
            仅用于后台 UI 调试,source 会标记为 admin_test。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#61767D] mb-1.5 block">邮箱 *</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-[#61767D] mb-1.5 block">姓名</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[#61767D] mb-1.5 block">身份</label>
            <Select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
            >
              {INQUIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs text-[#61767D] mb-1.5 block">留言</label>
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? '提交中…' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
