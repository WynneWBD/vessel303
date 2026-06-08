import Link from 'next/link'
import { formatNumber, loadStatusOverview, type LeadMetrics } from '@/lib/admin-status-metrics'
import {
  ActionCard,
  buildStatusBadges,
  MetricCard,
  SectionTitle,
  StatusPageShell,
  STATUS_ICONS,
} from '../_components'
import { getStatusAccess } from '../_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '线索漏斗 - 运营数据中心 - VESSEL' }

const FUNNEL_STEPS = [
  { key: 'new', label: '新线索', href: '/admin/customers/leads?status=new' },
  { key: 'contacting', label: '跟进中', href: '/admin/customers/leads?status=contacting' },
  { key: 'quoted', label: '已报价', href: '/admin/customers/leads?status=quoted' },
  { key: 'won', label: '已成交', href: '/admin/customers/leads?status=won' },
  { key: 'lost', label: '已关闭', href: '/admin/customers/leads?status=lost' },
] as const

type FunnelStepKey = (typeof FUNNEL_STEPS)[number]['key']

type FunnelMatrixRow = {
  key: FunnelStepKey
  label: string
  count: number
  share: number
  status: string
  statusTone: 'orange' | 'blue' | 'green' | 'gray'
  detail: string
  href: string
  actionLabel: string
}

export default async function AdminStatusLeadsPage() {
  const { role, email } = await getStatusAccess()
  const overview = await loadStatusOverview()
  const leads = overview.leads
  const wonRate = leads.total > 0 ? Math.round((leads.won / leads.total) * 100) : 0

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="leads"
      badges={buildStatusBadges(overview, role)}
    >
      <section className="space-y-5">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#1889B6]">B6-3 线索漏斗</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">从新线索到成交的运营状态</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            统计来自现有 leads 表，只做状态聚合和入口分流，不新增 CRM、会员、订单或支付逻辑。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="线索总量"
            value={leads.total}
            detail={`近 30 天新增 ${formatNumber(leads.recent30)} / 近 7 天新增 ${formatNumber(leads.recent7)}`}
            href="/admin/customers/leads"
            Icon={STATUS_ICONS.Inbox}
          />
          <MetricCard
            title="新线索"
            value={leads.new}
            detail="需要运营人员优先查看、分配或回复。"
            href="/admin/customers/leads?status=new"
            Icon={STATUS_ICONS.AlertCircle}
            tone={leads.new > 0 ? 'orange' : 'green'}
          />
          <MetricCard
            title="超 7 天未更新"
            value={leads.staleFollowups}
            detail="仅统计新线索和跟进中线索，用于提醒跟进断点。"
            href="/admin/customers/leads"
            Icon={STATUS_ICONS.ListChecks}
            tone={leads.staleFollowups > 0 ? 'orange' : 'green'}
          />
          <MetricCard
            title="成交占比"
            value={`${wonRate}%`}
            detail={`已成交 ${formatNumber(leads.won)} / 已关闭 ${formatNumber(leads.lost)}`}
            href="/admin/customers/leads?status=won"
            Icon={STATUS_ICONS.BarChart3}
            tone="blue"
          />
        </div>

        <LeadFunnelOperationsMatrix leads={leads} />

        <section className="space-y-4">
          <SectionTitle title="漏斗状态" detail="按现有后台筛选入口处理，不在数据中心直接改状态。" />
          <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              {FUNNEL_STEPS.map((step) => {
                const value = leads[step.key]
                return (
                  <Link
                    key={step.key}
                    href={step.href}
                    className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-4 transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
                  >
                    <span className="block text-sm font-semibold text-[#1E2C31]">{step.label}</span>
                    <span className="mt-3 block text-3xl font-bold text-[#1E2C31]">{formatNumber(value)}</span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[#E6EEEE]">
                      <span
                        className="block h-full rounded-full bg-[#1889B6]"
                        style={{ width: `${leads.total > 0 ? Math.max(6, Math.round((value / leads.total) * 100)) : 0}%` }}
                      />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title="运营动作" detail="先处理漏斗异常，再查看完整线索列表。" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <ActionCard
              title="处理新线索"
              detail={`${formatNumber(leads.new)} 条新线索等待首次处理。`}
              href="/admin/customers/leads?status=new"
              Icon={STATUS_ICONS.Inbox}
              primary={leads.new > 0}
            />
            <ActionCard
              title="查看跟进中"
              detail={`${formatNumber(leads.contacting)} 条线索仍在跟进中。`}
              href="/admin/customers/leads?status=contacting"
              Icon={STATUS_ICONS.ListChecks}
              primary={leads.staleFollowups > 0}
            />
            <ActionCard
              title="查看客户中心"
              detail="回到客户与线索总入口，继续按现有流程处理。"
              href="/admin/customers"
              Icon={STATUS_ICONS.BarChart3}
            />
          </div>
        </section>
      </section>
    </StatusPageShell>
  )
}

function percent(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

function buildFunnelMatrixRows(leads: LeadMetrics): FunnelMatrixRow[] {
  const total = leads.total
  return [
    {
      key: 'new',
      label: '新线索',
      count: leads.new,
      share: percent(leads.new, total),
      status: leads.new > 0 ? '需首次响应' : '已清零',
      statusTone: leads.new > 0 ? 'orange' : 'green',
      detail: '优先确认需求、来源和负责人。',
      href: '/admin/customers/leads?status=new',
      actionLabel: '处理新线索',
    },
    {
      key: 'contacting',
      label: '跟进中',
      count: leads.contacting,
      share: percent(leads.contacting, total),
      status: leads.staleFollowups > 0 ? '有断点' : '跟进中',
      statusTone: leads.staleFollowups > 0 ? 'orange' : 'blue',
      detail: `超 7 天未更新 ${formatNumber(leads.staleFollowups)} 条，需检查备注和负责人。`,
      href: '/admin/customers/leads?status=contacting',
      actionLabel: '查看跟进',
    },
    {
      key: 'quoted',
      label: '已报价',
      count: leads.quoted,
      share: percent(leads.quoted, total),
      status: leads.quoted > 0 ? '待回访' : '无积压',
      statusTone: leads.quoted > 0 ? 'blue' : 'green',
      detail: '关注报价后反馈，及时更新成交或关闭状态。',
      href: '/admin/customers/leads?status=quoted',
      actionLabel: '查看报价',
    },
    {
      key: 'won',
      label: '已成交',
      count: leads.won,
      share: percent(leads.won, total),
      status: '成交归档',
      statusTone: 'green',
      detail: '用于观察线索处理结果，不在数据中心改成交状态。',
      href: '/admin/customers/leads?status=won',
      actionLabel: '查看成交',
    },
    {
      key: 'lost',
      label: '已关闭',
      count: leads.lost,
      share: percent(leads.lost, total),
      status: '关闭归档',
      statusTone: 'gray',
      detail: '保留关闭原因和历史线索记录，避免误删数据。',
      href: '/admin/customers/leads?status=lost',
      actionLabel: '查看关闭',
    },
  ]
}

function LeadFunnelOperationsMatrix({ leads }: { leads: LeadMetrics }) {
  const rows = buildFunnelMatrixRows(leads)
  const activePipeline = leads.new + leads.contacting + leads.quoted
  const closed = leads.won + leads.lost
  const wonRate = percent(leads.won, leads.total)

  return (
    <section className="space-y-4">
      <SectionTitle title="线索漏斗效率矩阵" detail="把状态数量、占比、异常判断和处理入口集中到一张表，数据中心只读，不直接改状态。" />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 md:grid-cols-3">
          <FunnelSummary label="活跃漏斗" value={activePipeline} detail="新线索 + 跟进中 + 已报价" warn={activePipeline > 0} />
          <FunnelSummary label="已收口" value={closed} detail="已成交 + 已关闭" />
          <FunnelSummary label="成交占比" value={`${wonRate}%`} detail={`已成交 ${formatNumber(leads.won)} / 总量 ${formatNumber(leads.total)}`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                <th className="min-w-32 px-5 py-3 text-left font-semibold">状态</th>
                <th className="px-4 py-3 text-right font-semibold">数量</th>
                <th className="min-w-44 px-4 py-3 text-left font-semibold">占比</th>
                <th className="min-w-32 px-4 py-3 text-left font-semibold">判断</th>
                <th className="min-w-72 px-4 py-3 text-left font-semibold">处理说明</th>
                <th className="min-w-28 px-5 py-3 text-right font-semibold">入口</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EEEE]">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-5 py-4">
                    <Link href={row.href} className="font-semibold text-[#1E2C31] hover:text-[#1889B6]">
                      {row.label}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-bold text-[#1E2C31]">{formatNumber(row.count)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-[#61767D]">占比</span>
                      <span className="font-bold text-[#1E2C31]">{row.share}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E6EEEE]">
                      <span className="block h-full rounded-full bg-[#1889B6]" style={{ width: `${row.share}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <FunnelStatusBadge label={row.status} tone={row.statusTone} />
                  </td>
                  <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">{row.detail}</td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={row.href}
                      className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
                    >
                      {row.actionLabel}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function FunnelSummary({
  label,
  value,
  detail,
  warn,
}: {
  label: string
  value: number | string
  detail: string
  warn?: boolean
}) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-white px-4 py-3">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function FunnelStatusBadge({ label, tone }: { label: string; tone: FunnelMatrixRow['statusTone'] }) {
  const className =
    tone === 'orange'
      ? 'border-[#E36F2C]/25 bg-[#FFF2E7] text-[#E36F2C]'
      : tone === 'blue'
        ? 'border-[#1889B6]/20 bg-[#EAF6F8] text-[#1889B6]'
        : tone === 'gray'
          ? 'border-slate-200 bg-slate-50 text-slate-600'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
