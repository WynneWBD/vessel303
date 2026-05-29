import Link from 'next/link'
import { formatNumber, loadStatusOverview } from '@/lib/admin-status-metrics'
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
