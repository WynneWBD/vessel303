'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Plus, Trash2, Mail, SearchX, Inbox, Clock3, FileText, BadgeCheck, ExternalLink } from 'lucide-react'
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
import type { Lead, LeadStatus } from '@/lib/leads-db'
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

function formatDate(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
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
}: {
  initialLeads: Lead[]
  initialTotal: number
  initialFilters: Filters
  initialPage: number
  initialLimit: number
  allowTestLeadCreation: boolean
  allowDelete?: boolean
  summary?: LeadDashboardSummary
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
            <p className="text-xs font-semibold tracking-[0.22em] text-[#1889B6] uppercase">B11 Leads 2.0</p>
            <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">线索管理 2.0</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
              新后台统一处理官网表单、案例询盘和 Media Kit 申请。旧 /admin/leads 只做兼容入口，不再展示旧侧边栏。
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

      {/* Filter bar */}
      <div className="grid grid-cols-1 gap-3 rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
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

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
                <th className="text-left font-medium px-4 py-3">状态</th>
                <th className="text-left font-medium px-4 py-3">邮箱</th>
                <th className="text-left font-medium px-4 py-3">姓名</th>
                <th className="text-left font-medium px-4 py-3">公司</th>
                <th className="text-left font-medium px-4 py-3">国家</th>
                <th className="text-left font-medium px-4 py-3">身份</th>
                <th className="text-left font-medium px-4 py-3">来源</th>
                <th className="text-left font-medium px-4 py-3">SKU 兴趣</th>
                <th className="text-left font-medium px-4 py-3">创建时间</th>
                <th className="text-left font-medium px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      {hasActiveFilters ? (
                        <SearchX size={32} className="text-[#8A9EA4]" />
                      ) : (
                        <Mail size={32} className="text-[#8A9EA4]" />
                      )}
                      <p className="text-[#61767D]">
                        {hasActiveFilters ? '没有找到符合条件的线索' : '暂无线索'}
                      </p>
                      <p className="text-xs text-[#6B6560]">
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
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer border-b border-[#E6EEEE] transition-colors hover:bg-[#F7FAFA]"
                  onClick={() => handleSelect(lead)}
                >
                  <td className="px-4 py-3">
                    <Badge className={statusBadgeClass(lead.status)}>
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#2C2A28]">{lead.email}</td>
                  <td className="px-4 py-3 text-[#61767D]">{lead.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[#61767D]">{lead.company ?? '—'}</td>
                  <td className="px-4 py-3 text-[#61767D]">{lead.country ?? '—'}</td>
                  <td className="px-4 py-3 text-[#61767D]">{lead.inquiry_type ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-[#D8E7E8] bg-[#F7FAFA] px-2 py-1 text-xs text-[#61767D]">
                      {describeLeadSource(lead.source).typeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#61767D]">{lead.sku_interest ?? '—'}</td>
                  <td className="px-4 py-3 text-[#8A8580] whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#E36F2C] text-xs">查看 ›</span>
                  </td>
                </tr>
              ))}
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

  return (
    <Sheet
      open={!!lead}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <SheetContent>
        {lead && (
          <>
            <SheetHeader>
              <SheetTitle className="break-all pr-8">{lead.email}</SheetTitle>
              <div className="flex items-center gap-2">
                <Badge className={statusBadgeClass(lead.status)}>
                  {STATUS_LABEL[lead.status] ?? lead.status}
                </Badge>
                <span className="text-xs text-[#8A8580]">
                  创建于 {formatDate(lead.created_at)}
                </span>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
              {/* Core info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="姓名" value={lead.name} />
                <Field label="公司" value={lead.company} />
                <Field label="电话" value={lead.phone} />
                <Field label="国家" value={lead.country} />
                <Field label="身份" value={lead.inquiry_type} />
                <Field label="SKU 兴趣" value={lead.sku_interest} />
                <div className="col-span-2 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3">
                  <div className="text-xs text-[#8A8580]">来源</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#2C2A28]">
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
                  <div className="mt-1 break-all text-xs text-[#8A8580]">{lead.source || '—'}</div>
                </div>
                <Field label="更新时间" value={formatDate(lead.updated_at)} />
              </div>

              {/* Message */}
              <div>
                <div className="text-xs text-[#8A8580] mb-2">留言内容</div>
                <div className="rounded-md bg-[#FAF7F2] border border-[#E5DED4] p-3 text-sm text-[#2C2A28] whitespace-pre-wrap min-h-[80px]">
                  {lead.message || <span className="text-[#6B6560]">(无留言)</span>}
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="text-xs text-[#8A8580] mb-2">状态</div>
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
                <div className="text-xs text-[#8A8580] mb-2">分配销售(邮箱)</div>
                <Input
                  type="email"
                  placeholder="sales@example.com"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div>
                <div className="text-xs text-[#8A8580] mb-2">追加备注</div>
                <Textarea
                  rows={3}
                  placeholder="本次保存时会追加到备注顶部,带时间戳"
                  value={noteAppend}
                  onChange={(e) => setNoteAppend(e.target.value)}
                />
                {lead.notes && (
                  <div className="mt-3">
                    <div className="text-xs text-[#8A8580] mb-2">历史备注</div>
                    <div className="rounded-md bg-[#FAF7F2] border border-[#E5DED4] p-3 text-xs text-[#C4B9AB] whitespace-pre-wrap max-h-40 overflow-auto">
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
      <div className="text-xs text-[#8A8580]">{label}</div>
      <div className="text-sm text-[#2C2A28] break-all">{value || '—'}</div>
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
            <label className="text-xs text-[#8A8580] mb-1.5 block">邮箱 *</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-[#8A8580] mb-1.5 block">姓名</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[#8A8580] mb-1.5 block">身份</label>
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
            <label className="text-xs text-[#8A8580] mb-1.5 block">留言</label>
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
