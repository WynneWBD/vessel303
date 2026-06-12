import Link from 'next/link'
import { formatNumber, loadStatusOverview, safeLoad, type LeadMetrics } from '@/lib/admin-status-metrics'
import {
  summarizeLeadsBySourceStageStatus,
  summarizeLeadsBySourceStatus,
  type LeadSourceStageStatusSummary,
  type LeadSourceStatusSummary,
} from '@/lib/leads-db'
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

type LeadResponseTone = 'critical' | 'warning' | 'review' | 'ready'

type LeadResponseRow = {
  key: string
  priority: string
  stage: string
  title: string
  owner: string
  metric: string
  evidence: string
  impact: string
  href: string
  actionLabel: string
  tone: LeadResponseTone
  Icon: typeof STATUS_ICONS.AlertCircle
}

type LeadSourceQualityRow = {
  type: LeadSourceStatusSummary['type']
  label: string
  total: number
  active: number
  activeRate: number
  won: number
  lost: number
  wonRate: number
  status: string
  statusTone: FunnelMatrixRow['statusTone']
  detail: string
  href: string
  actionLabel: string
}

type LeadSourceStageRow = {
  key: string
  type: LeadSourceStageStatusSummary['type']
  typeLabel: string
  label: string
  rawStage: string
  total: number
  active: number
  activeRate: number
  won: number
  lost: number
  wonRate: number
  status: string
  statusTone: FunnelMatrixRow['statusTone']
  detail: string
  href: string
  actionLabel: string
}

export default async function AdminStatusLeadsPage() {
  const { role, email } = await getStatusAccess()
  const [overview, sourceStatusSummary, sourceStageStatusSummary] = await Promise.all([
    loadStatusOverview(),
    safeLoad(
      'lead source status summary',
      () => summarizeLeadsBySourceStatus(),
      [] as LeadSourceStatusSummary[],
    ),
    safeLoad(
      'lead source stage status summary',
      () => summarizeLeadsBySourceStageStatus(),
      [] as LeadSourceStageStatusSummary[],
    ),
  ])
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

        <LeadResponseOperationsLedger leads={leads} />

        <LeadSourceQualityMatrix sourceStatusSummary={sourceStatusSummary} />

        <LeadSourceStageMatrix sourceStageStatusSummary={sourceStageStatusSummary} />

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

function buildLeadResponseRows(leads: LeadMetrics): LeadResponseRow[] {
  const activePipeline = leads.new + leads.contacting + leads.quoted
  const closed = leads.won + leads.lost
  const closeRate = percent(closed, leads.total)
  const wonRate = percent(leads.won, leads.total)

  return [
    {
      key: 'first-response',
      priority: leads.new > 0 ? 'P0' : 'OK',
      stage: '首次响应',
      title: '新线索待处理',
      owner: '客户与线索',
      metric: `${formatNumber(leads.new)} 条`,
      evidence: `近 7 天新增 ${formatNumber(leads.recent7)} 条 / 近 30 天新增 ${formatNumber(leads.recent30)} 条`,
      impact: '新询盘进入后台后应先确认需求、来源和负责人，避免第一响应断点。',
      href: '/admin/customers/leads?status=new',
      actionLabel: '处理新线索',
      tone: leads.new > 0 ? 'critical' : 'ready',
      Icon: STATUS_ICONS.Inbox,
    },
    {
      key: 'stale-followup',
      priority: leads.staleFollowups > 0 ? 'P0' : 'OK',
      stage: '跟进断点',
      title: '超 7 天未更新',
      owner: '销售跟进',
      metric: `${formatNumber(leads.staleFollowups)} 条`,
      evidence: `覆盖新线索与跟进中线索；当前跟进中 ${formatNumber(leads.contacting)} 条`,
      impact: '先处理超时队列，再看普通跟进，减少高意向线索沉没。',
      href: '/admin/customers/leads?attention=overdue',
      actionLabel: '查看超时队列',
      tone: leads.staleFollowups > 0 ? 'critical' : 'ready',
      Icon: STATUS_ICONS.AlertCircle,
    },
    {
      key: 'active-pipeline',
      priority: activePipeline > 0 ? 'P1' : 'OK',
      stage: '活跃商机',
      title: '活跃漏斗推进',
      owner: '运营负责人',
      metric: `${formatNumber(activePipeline)} 条`,
      evidence: `新线索 ${formatNumber(leads.new)} / 跟进中 ${formatNumber(leads.contacting)} / 已报价 ${formatNumber(leads.quoted)}`,
      impact: '把未收口线索集中成推进池，按状态进入客户线索页处理。',
      href: '/admin/customers/leads?attention=active',
      actionLabel: '查看活跃商机',
      tone: activePipeline > 0 ? 'warning' : 'ready',
      Icon: STATUS_ICONS.ListChecks,
    },
    {
      key: 'quoted-review',
      priority: leads.quoted > 0 ? 'P2' : 'OK',
      stage: '报价回访',
      title: '已报价线索复盘',
      owner: '销售跟进',
      metric: `${formatNumber(leads.quoted)} 条`,
      evidence: `成交 ${formatNumber(leads.won)} / 关闭 ${formatNumber(leads.lost)} / 成交占比 ${wonRate}%`,
      impact: '报价后应复核客户反馈、预算、交付窗口和下一次动作。',
      href: '/admin/customers/leads?status=quoted',
      actionLabel: '查看已报价',
      tone: leads.quoted > 0 ? 'review' : 'ready',
      Icon: STATUS_ICONS.BarChart3,
    },
    {
      key: 'source-conversion',
      priority: leads.recent30 > 0 ? 'P2' : 'P3',
      stage: '来源复盘',
      title: '近 30 天线索来源',
      owner: '增长分析',
      metric: `${formatNumber(leads.recent30)} 条`,
      evidence: `近 7 天 ${formatNumber(leads.recent7)} 条；需结合转化路径页看入口质量`,
      impact: '数据中心只看总量不够，应从来源、入口页和表单路径判断转化质量。',
      href: '/admin/site/conversion',
      actionLabel: '查看转化路径',
      tone: leads.recent30 > 0 ? 'review' : 'ready',
      Icon: STATUS_ICONS.BarChart3,
    },
    {
      key: 'closed-archive',
      priority: closed > 0 ? 'P3' : 'OK',
      stage: '结果归档',
      title: '成交与关闭沉淀',
      owner: '运营复盘',
      metric: `${formatNumber(closed)} 条`,
      evidence: `已成交 ${formatNumber(leads.won)} / 已关闭 ${formatNumber(leads.lost)} / 收口率 ${closeRate}%`,
      impact: '保留成交与关闭原因，用于复盘询盘质量，不在数据中心删除历史线索。',
      href: '/admin/customers/leads?status=won',
      actionLabel: '查看成交归档',
      tone: closed > 0 ? 'review' : 'ready',
      Icon: STATUS_ICONS.ListChecks,
    },
    {
      key: 'operation-boundary',
      priority: 'HOLD',
      stage: '操作边界',
      title: '状态更新仍在客户线索页完成',
      owner: '系统边界',
      metric: '只读',
      evidence: '本页只聚合 leads 指标和跳转入口，不直接保存状态、备注、负责人或删除线索。',
      impact: '避免数据中心变成第二套 CRM；所有写入继续走现有客户线索处理流程。',
      href: '/admin/customers/leads',
      actionLabel: '进入线索列表',
      tone: 'review',
      Icon: STATUS_ICONS.ListChecks,
    },
  ]
}

function LeadResponseOperationsLedger({ leads }: { leads: LeadMetrics }) {
  const rows = buildLeadResponseRows(leads)
  const blockingRows = rows.filter((row) => row.tone === 'critical')
  const reviewRows = rows.filter((row) => row.tone === 'warning' || row.tone === 'review')
  const activePipeline = leads.new + leads.contacting + leads.quoted

  return (
    <section className="space-y-4">
      <SectionTitle
        title="线索响应处理台账"
        detail="先处理首次响应、跟进断点和活跃商机，再进入客户线索页更新状态；本页只读，不直接写入线索数据。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 md:grid-cols-4">
          <FunnelSummary label="阻塞项" value={blockingRows.length} detail="新线索或超时跟进" warn={blockingRows.length > 0} />
          <FunnelSummary label="待复盘项" value={reviewRows.length} detail="活跃商机、报价、来源、归档" warn={reviewRows.length > 0} />
          <FunnelSummary label="活跃漏斗" value={activePipeline} detail="新线索 + 跟进中 + 已报价" warn={activePipeline > 0} />
          <FunnelSummary label="近 30 天新增" value={leads.recent30} detail={`近 7 天 ${formatNumber(leads.recent7)} 条`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                <th className="min-w-32 px-5 py-3 text-left font-semibold">优先级</th>
                <th className="min-w-72 px-4 py-3 text-left font-semibold">处理事项</th>
                <th className="min-w-40 px-4 py-3 text-left font-semibold">当前值</th>
                <th className="min-w-80 px-4 py-3 text-left font-semibold">证据 / 影响</th>
                <th className="min-w-32 px-5 py-3 text-right font-semibold">入口</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EEEE]">
              {rows.map((row) => {
                const Icon = row.Icon

                return (
                  <tr key={row.key} className="align-top transition hover:bg-[#FBFDFD]">
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${leadResponseBadgeClass(row.tone)}`}>
                        {row.priority}
                      </span>
                      <p className="mt-2 text-xs font-semibold text-[#61767D]">{row.stage}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${leadResponseToneClass(row.tone)}`}>
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-[#1E2C31]">{row.title}</span>
                          <span className="mt-1 block text-xs leading-5 text-[#61767D]">{row.owner}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">{row.metric}</td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">
                      <span className="block font-semibold text-[#1E2C31]">{row.evidence}</span>
                      <span className="mt-1 block">{row.impact}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={row.href}
                        className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
                      >
                        {row.actionLabel}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function buildLeadSourceQualityRows(sourceStatusSummary: LeadSourceStatusSummary[]): LeadSourceQualityRow[] {
  return sourceStatusSummary
    .map((source) => {
      const active = source.new + source.contacting + source.quoted
      const closed = source.won + source.lost
      const activeRate = percent(active, source.total)
      const wonRate = percent(source.won, source.total)
      const href =
        active > 0
          ? `/admin/customers/leads?source_type=${source.type}&attention=active`
          : `/admin/customers/leads?source_type=${source.type}`
      const statusTone: FunnelMatrixRow['statusTone'] =
        active > 0 ? 'orange' : source.won > 0 ? 'green' : closed > 0 ? 'blue' : 'gray'
      const detail =
        active > 0
          ? `还有 ${formatNumber(active)} 条未收口线索，优先进入客户线索页处理。`
          : source.won > 0
            ? `成交占比 ${wonRate}%，可复盘该入口的内容和 CTA。`
            : closed > 0
              ? '当前入口线索已收口，重点复盘关闭原因和客户质量。'
              : '当前入口暂无可判断样本，继续观察公开站转化。'

      return {
        type: source.type,
        label: source.label,
        total: source.total,
        active,
        activeRate,
        won: source.won,
        lost: source.lost,
        wonRate,
        status: active > 0 ? '需处理' : source.won > 0 ? '有成交' : closed > 0 ? '已收口' : '观察中',
        statusTone,
        detail,
        href,
        actionLabel: active > 0 ? '处理活跃线索' : '查看来源线索',
      }
    })
    .sort((a, b) => {
      if (b.active !== a.active) return b.active - a.active
      if (b.total !== a.total) return b.total - a.total
      return b.won - a.won
    })
}

function LeadSourceQualityMatrix({ sourceStatusSummary }: { sourceStatusSummary: LeadSourceStatusSummary[] }) {
  const rows = buildLeadSourceQualityRows(sourceStatusSummary)
  const total = rows.reduce((sum, row) => sum + row.total, 0)
  const active = rows.reduce((sum, row) => sum + row.active, 0)
  const won = rows.reduce((sum, row) => sum + row.won, 0)
  const topSource = rows[0]

  return (
    <section className="space-y-4" id="source-quality">
      <SectionTitle
        title="B198 来源质量矩阵"
        detail="把线索来源、活跃漏斗、成交结果和处理入口合在一张表，帮助判断公开站入口质量；本页只读，不直接改线索。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 md:grid-cols-4">
          <FunnelSummary label="来源类型" value={rows.length} detail="已有线索的入口分类" />
          <FunnelSummary label="来源线索" value={total} detail="全部来源聚合" />
          <FunnelSummary label="活跃来源线索" value={active} detail="新线索 + 跟进中 + 已报价" warn={active > 0} />
          <FunnelSummary label="成交来源线索" value={won} detail={topSource ? `Top 来源 ${topSource.label}` : '暂无来源样本'} />
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
              <STATUS_ICONS.BarChart3 size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1E2C31]">暂无来源质量数据</p>
              <p className="mt-1 text-xs text-[#61767D]">公开站表单产生线索后，这里会显示来源质量矩阵。</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                  <th className="min-w-40 px-5 py-3 text-left font-semibold">来源入口</th>
                  <th className="px-4 py-3 text-right font-semibold">全部</th>
                  <th className="min-w-48 px-4 py-3 text-left font-semibold">活跃漏斗</th>
                  <th className="min-w-44 px-4 py-3 text-left font-semibold">成交 / 关闭</th>
                  <th className="min-w-32 px-4 py-3 text-left font-semibold">判断</th>
                  <th className="min-w-72 px-4 py-3 text-left font-semibold">分析说明</th>
                  <th className="min-w-32 px-5 py-3 text-right font-semibold">入口</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EEEE]">
                {rows.map((row) => (
                  <tr key={row.type} className="align-top transition hover:bg-[#FBFDFD]">
                    <td className="px-5 py-4">
                      <Link href={`/admin/customers/leads?source_type=${row.type}`} className="font-semibold text-[#1E2C31] hover:text-[#1889B6]">
                        {row.label}
                      </Link>
                      <p className="mt-1 text-xs text-[#8A9EA4]">source_type={row.type}</p>
                    </td>
                    <td className="px-4 py-4 text-right text-lg font-bold text-[#1E2C31]">{formatNumber(row.total)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-[#61767D]">{formatNumber(row.active)} 条</span>
                        <span className="font-bold text-[#1E2C31]">{row.activeRate}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E6EEEE]">
                        <span className="block h-full rounded-full bg-[#E36F2C]" style={{ width: `${row.activeRate}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">
                      <span className="block font-semibold text-[#1E2C31]">成交 {formatNumber(row.won)} / 关闭 {formatNumber(row.lost)}</span>
                      <span className="mt-1 block">成交占比 {row.wonRate}%</span>
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
        )}
      </div>
    </section>
  )
}

function buildLeadSourceStageRows(sourceStageStatusSummary: LeadSourceStageStatusSummary[]): LeadSourceStageRow[] {
  return sourceStageStatusSummary
    .map((stage) => {
      const active = stage.new + stage.contacting + stage.quoted
      const closed = stage.won + stage.lost
      const activeRate = percent(active, stage.total)
      const wonRate = percent(stage.won, stage.total)
      const statusTone: FunnelMatrixRow['statusTone'] =
        active > 0 ? 'orange' : stage.won > 0 ? 'green' : closed > 0 ? 'blue' : 'gray'
      const detail =
        stage.type === 'product'
          ? active > 0
            ? `该产品来源阶段还有 ${formatNumber(active)} 条未收口线索，先进入产品线索列表处理。`
            : stage.won > 0
              ? `该产品来源阶段已有成交样本，可复盘页面 CTA 和后续跟进质量。`
              : closed > 0
                ? '该产品来源阶段线索已收口，适合复盘关闭原因和客户匹配度。'
                : '该产品来源阶段暂无足够样本，继续观察公开站咨询入口。'
          : active > 0
            ? `该来源阶段还有 ${formatNumber(active)} 条活跃线索，先进入现有线索流程处理。`
            : '该来源阶段当前无活跃积压，可作为入口质量观察项。'

      return {
        key: stage.key,
        type: stage.type,
        typeLabel: stage.typeLabel,
        label: stage.label,
        rawStage: stage.rawStage,
        total: stage.total,
        active,
        activeRate,
        won: stage.won,
        lost: stage.lost,
        wonRate,
        status: active > 0 ? '需处理' : stage.won > 0 ? '有成交' : closed > 0 ? '已收口' : '观察中',
        statusTone,
        detail,
        href: stage.href,
        actionLabel: active > 0 ? '处理该类线索' : '查看该类线索',
      }
    })
    .sort((a, b) => {
      if (b.active !== a.active) return b.active - a.active
      if (b.total !== a.total) return b.total - a.total
      return b.won - a.won
    })
}

function LeadSourceStageMatrix({
  sourceStageStatusSummary,
}: {
  sourceStageStatusSummary: LeadSourceStageStatusSummary[]
}) {
  const rows = buildLeadSourceStageRows(sourceStageStatusSummary)
  const total = rows.reduce((sum, row) => sum + row.total, 0)
  const active = rows.reduce((sum, row) => sum + row.active, 0)
  const productStages = rows.filter((row) => row.type === 'product').length
  const topStage = rows[0]

  return (
    <section className="space-y-4" id="source-stage-quality">
      <SectionTitle
        title="B201 来源阶段矩阵"
        detail="在来源类型之上继续拆出产品卡片 CTA、产品详情表单、产品详情 CTA 等阶段；本页只读，处理动作仍回到客户线索页。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 md:grid-cols-4">
          <FunnelSummary label="来源阶段" value={rows.length} detail="按 source 阶段聚合" />
          <FunnelSummary label="产品阶段" value={productStages} detail="产品卡片 / 详情表单 / 详情 CTA" />
          <FunnelSummary label="活跃阶段线索" value={active} detail={`全部阶段线索 ${formatNumber(total)} 条`} warn={active > 0} />
          <FunnelSummary label="Top 阶段" value={topStage ? topStage.label : '-'} detail={topStage ? `${formatNumber(topStage.total)} 条线索` : '暂无阶段样本'} />
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
              <STATUS_ICONS.BarChart3 size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1E2C31]">暂无来源阶段数据</p>
              <p className="mt-1 text-xs text-[#61767D]">公开站表单产生线索后，这里会按 source 阶段显示入口表现。</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                  <th className="min-w-44 px-5 py-3 text-left font-semibold">来源阶段</th>
                  <th className="min-w-32 px-4 py-3 text-left font-semibold">来源类型</th>
                  <th className="px-4 py-3 text-right font-semibold">全部</th>
                  <th className="min-w-48 px-4 py-3 text-left font-semibold">活跃漏斗</th>
                  <th className="min-w-44 px-4 py-3 text-left font-semibold">成交 / 关闭</th>
                  <th className="min-w-32 px-4 py-3 text-left font-semibold">判断</th>
                  <th className="min-w-72 px-4 py-3 text-left font-semibold">运营说明</th>
                  <th className="min-w-32 px-5 py-3 text-right font-semibold">入口</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EEEE]">
                {rows.map((row) => (
                  <tr key={row.key} className="align-top transition hover:bg-[#FBFDFD]">
                    <td className="px-5 py-4">
                      <Link href={row.href} className="font-semibold text-[#1E2C31] hover:text-[#1889B6]">
                        {row.label}
                      </Link>
                      <p className="mt-1 text-xs text-[#8A9EA4]">stage={row.rawStage}</p>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">
                      <span className="block font-semibold text-[#1E2C31]">{row.typeLabel}</span>
                      <span className="mt-1 block">source_type={row.type}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-lg font-bold text-[#1E2C31]">{formatNumber(row.total)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-[#61767D]">{formatNumber(row.active)} 条</span>
                        <span className="font-bold text-[#1E2C31]">{row.activeRate}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E6EEEE]">
                        <span className="block h-full rounded-full bg-[#E36F2C]" style={{ width: `${row.activeRate}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">
                      <span className="block font-semibold text-[#1E2C31]">成交 {formatNumber(row.won)} / 关闭 {formatNumber(row.lost)}</span>
                      <span className="mt-1 block">成交占比 {row.wonRate}%</span>
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
        )}
      </div>
    </section>
  )
}

function leadResponseToneClass(tone: LeadResponseTone): string {
  if (tone === 'critical') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'warning') return 'bg-[#FFF6EF] text-[#C75F18]'
  if (tone === 'review') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-emerald-50 text-emerald-700'
}

function leadResponseBadgeClass(tone: LeadResponseTone): string {
  if (tone === 'critical') return 'border-[#E36F2C]/35 bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'warning') return 'border-[#E36F2C]/25 bg-[#FFF6EF] text-[#C75F18]'
  if (tone === 'review') return 'border-[#1889B6]/20 bg-[#EAF6F8] text-[#1889B6]'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
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
