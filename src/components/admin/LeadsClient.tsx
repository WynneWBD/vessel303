'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Plus, Trash2, Mail } from 'lucide-react'
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
import type { Lead, LeadStatus } from '@/lib/leads-db'

type Filters = {
  status: string
  inquiry_type: string
  country: string
  search: string
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
      return 'bg-red-600/20 text-red-400 border-red-600/30'
    case 'contacting':
      return 'bg-[#E36F2C]/20 text-[#E36F2C] border-[#E36F2C]/30'
    case 'quoted':
      return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
    case 'won':
      return 'bg-green-600/20 text-green-400 border-green-600/30'
    case 'lost':
      return 'bg-gray-600/20 text-gray-400 border-gray-600/30'
    default:
      return 'bg-gray-600/20 text-gray-400 border-gray-600/30'
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
}: {
  initialLeads: Lead[]
  initialTotal: number
  initialFilters: Filters
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [newOpen, setNewOpen] = useState(false)

  const buildQuery = useCallback((f: Filters) => {
    const sp = new URLSearchParams()
    if (f.status && f.status !== 'all') sp.set('status', f.status)
    if (f.inquiry_type && f.inquiry_type !== 'all') sp.set('inquiry_type', f.inquiry_type)
    if (f.country) sp.set('country', f.country)
    if (f.search) sp.set('search', f.search)
    return sp.toString()
  }, [])

  const reload = useCallback(
    async (f: Filters) => {
      setLoading(true)
      try {
        const qs = buildQuery(f)
        const res = await fetch(`/api/admin/leads${qs ? `?${qs}` : ''}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('Failed to load')
        const data = (await res.json()) as { leads: Lead[]; total: number }
        setLeads(data.leads)
        setTotal(data.total)
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
      reload(filters)
    }, 300)
    return () => clearTimeout(t)
  }, [filters, reload])

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
    if (!window.confirm('确定删除这条线索?此操作可在数据库恢复。')) return
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('已删除')
      setSelected(null)
      await reload(filters)
      router.refresh()
    } catch (err) {
      toast.error('删除失败')
      console.error(err)
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
      await reload(filters)
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
      await reload(filters)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新建失败')
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1
          className="text-[#2C2A28]"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          线索管理
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
            <Plus size={16} />
            新建测试线索
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={16} />
            导出 CSV
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
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
          onChange={(e) => setFilters((f) => ({ ...f, inquiry_type: e.target.value }))}
        >
          <option value="all">身份:全部</option>
          {INQUIRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input
          placeholder="国家"
          value={filters.country}
          onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
        />
        <Input
          placeholder="关键词(邮箱/姓名/公司/留言)"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#E5DED4] bg-[#FFFFFF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5DED4] text-[#8A8580]">
                <th className="text-left font-medium px-4 py-3">状态</th>
                <th className="text-left font-medium px-4 py-3">邮箱</th>
                <th className="text-left font-medium px-4 py-3">姓名</th>
                <th className="text-left font-medium px-4 py-3">公司</th>
                <th className="text-left font-medium px-4 py-3">国家</th>
                <th className="text-left font-medium px-4 py-3">身份</th>
                <th className="text-left font-medium px-4 py-3">SKU 兴趣</th>
                <th className="text-left font-medium px-4 py-3">创建时间</th>
                <th className="text-left font-medium px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <Mail size={32} className="text-[#4A4744]" />
                      <p className="text-[#C4B9AB]">暂无线索</p>
                      <p className="text-xs text-[#6B6560]">
                        公开询价表单接入后,线索会自动显示在这里
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[#E5DED4] hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                  onClick={() => handleSelect(lead)}
                >
                  <td className="px-4 py-3">
                    <Badge className={statusBadgeClass(lead.status)}>
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#2C2A28]">{lead.email}</td>
                  <td className="px-4 py-3 text-[#C4B9AB]">{lead.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[#C4B9AB]">{lead.company ?? '—'}</td>
                  <td className="px-4 py-3 text-[#C4B9AB]">{lead.country ?? '—'}</td>
                  <td className="px-4 py-3 text-[#C4B9AB]">{lead.inquiry_type ?? '—'}</td>
                  <td className="px-4 py-3 text-[#C4B9AB]">{lead.sku_interest ?? '—'}</td>
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

      <div className="text-xs text-[#8A8580] flex items-center gap-3">
        <span>共 {total} 条</span>
        {loading && <span>加载中…</span>}
      </div>

      {/* Detail sheet */}
      <LeadDetailSheet
        lead={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* New test lead dialog */}
      <NewLeadDialog open={newOpen} onOpenChange={setNewOpen} onSubmit={handleCreate} />
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
  onDelete: (id: string) => Promise<void>
}) {
  const [status, setStatus] = useState<LeadStatus>('new')
  const [assignedTo, setAssignedTo] = useState('')
  const [noteAppend, setNoteAppend] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (lead) {
      setStatus(lead.status)
      setAssignedTo(lead.assigned_to ?? '')
      setNoteAppend('')
    }
  }, [lead])

  const handleSave = async () => {
    if (!lead) return
    setSaving(true)
    await onSave(lead, { status, assigned_to: assignedTo, note_append: noteAppend })
    setNoteAppend('')
    setSaving(false)
  }

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
                <Field label="来源" value={lead.source} />
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
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(lead.id)}
                disabled={saving}
              >
                <Trash2 size={16} />
                删除
              </Button>
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

  useEffect(() => {
    if (!open) {
      setEmail('')
      setName('')
      setInquiryType('B-buyer')
      setMessage('')
    }
  }, [open])

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
