import {
  loadAnalyticsReadinessMetrics,
  loadStatusOverview,
  formatNumber,
  type AnalyticsReadinessItem,
} from '@/lib/admin-status-metrics'
import {
  formatAnalyticsPercent,
  loadSiteAnalyticsDashboard,
  sourceTypeLabel,
  type AnalyticsRankRow,
} from '@/lib/site-analytics'
import {
  buildStatusBadges,
  MetricCard,
  SectionTitle,
  StatusPageShell,
  StatusPill,
  STATUS_ICONS,
} from '../_components'
import { getStatusAccess } from '../_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '网站数据分析 - 运营数据中心 - VESSEL' }

export default async function AdminStatusTrafficPage() {
  const { role, email } = await getStatusAccess()
  const overview = await loadStatusOverview()
  const readiness = loadAnalyticsReadinessMetrics()
  const analytics = await loadSiteAnalyticsDashboard()
  const sevenDays = analytics.windows.find((item) => item.days === 7) ?? analytics.windows[0]
  const thirtyDays = analytics.windows.find((item) => item.days === 30) ?? analytics.windows[1] ?? sevenDays

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="traffic"
      badges={buildStatusBadges(overview, role)}
    >
      <section className="space-y-6">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1889B6]">B15 网站数据分析 / 转化分析 1.0</p>
              <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">第一方网站数据分析</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
                对齐 300 的网站访问统计、落地页分析、访问行为、线索转化和 Google 分析心智；本页先读取本站第一方事件和现有 leads，不接外部 API，不保存个人隐私字段。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill ok={analytics.available} label={analytics.available ? '事件表可用' : '事件表未就绪'} />
              <StatusPill ok label="不采集表单隐私" />
              <StatusPill ok label="不接第三方 API" />
              <StatusPill ok label={`已排除测试数据 ${formatNumber(thirtyDays.testEvents)} 事件 / ${formatNumber(thirtyDays.testLeads)} 线索`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="30 天 PV"
            value={thirtyDays.pageViews}
            detail={`近 7 天 ${formatNumber(sevenDays.pageViews)} 次页面访问`}
            Icon={STATUS_ICONS.BarChart3}
            tone="blue"
          />
          <MetricCard
            title="30 天访客"
            value={thirtyDays.visitors}
            detail="基于匿名 visitor id hash，不保存 IP。"
            Icon={STATUS_ICONS.Activity}
            tone="green"
          />
          <MetricCard
            title="CTA 动作"
            value={thirtyDays.ctaClicks + thirtyDays.contactRedirects}
            detail={`表单成功 ${formatNumber(thirtyDays.formSubmits)} 次`}
            Icon={STATUS_ICONS.ListChecks}
            tone="orange"
          />
          <MetricCard
            title="线索"
            value={thirtyDays.leads}
            detail={`近 7 天 ${formatNumber(sevenDays.leads)} 条 leads；不含 Codex 测试线索`}
            href="/admin/customers/leads"
            Icon={STATUS_ICONS.Inbox}
            tone="green"
          />
          <MetricCard
            title="访问转化率"
            value={formatAnalyticsPercent(thirtyDays.conversionRate)}
            detail="真实线索数 / 页面访问数，已排除 admin_test 和 Codex 测试。"
            Icon={STATUS_ICONS.ShieldCheck}
            tone="blue"
          />
        </div>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <AnalysisModeCard title="网站访问统计" value={`${formatNumber(thirtyDays.pageViews)} PV`} detail="PV、匿名访客、Top Pages 和来源入口。" />
          <AnalysisModeCard title="落地页跳出分析" value={analytics.landingPages.length} detail="先看入口页访问与后续动作数，复杂跳出率后续补。" />
          <AnalysisModeCard title="访问行为分析" value={formatNumber(thirtyDays.ctaClicks + thirtyDays.contactRedirects)} detail="记录 CTA 点击、联系跳转和表单成功。" />
          <AnalysisModeCard title="线索转化分析" value={formatNumber(thirtyDays.leads)} detail="与 B14 source 和线索 2.0 联动。" />
          <AnalysisModeCard title="Google 统计分析" value={`${readiness.readyCount}/${readiness.items.length}`} detail="本轮只显示接入状态，不拉 Google API。" />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <section className="space-y-4">
            <SectionTitle title="Top Pages" detail="近 30 天访问最多的前台页面。" />
            <RankTable rows={analytics.topPages} empty="暂无页面访问事件。" secondaryLabel="访客" />
          </section>

          <section className="space-y-4">
            <SectionTitle title="来源与入口" detail="先按 referrer 和 source type 做运营判断。" />
            <RankList rows={analytics.topReferrers} empty="暂无 referrer 数据。" />
            <RankList rows={analytics.sourceTypes} empty="暂无 CTA / 表单来源数据。" />
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="space-y-4">
            <SectionTitle title="落地页动作" detail="同一路径内页面访问、CTA、联系跳转和表单成功的合计。" />
            <RankTable rows={analytics.landingPages} empty="暂无落地页事件。" secondaryLabel="动作" />
          </section>

          <section className="space-y-4">
            <SectionTitle title="近期事件" detail="只显示事件类型、路径和 source，不显示表单个人信息。" />
            <div className="divide-y divide-[#E6EEEE] rounded-md border border-[#D8E7E8] bg-white shadow-sm">
              {analytics.recentEvents.length === 0 ? (
                <div className="p-5 text-sm text-[#61767D]">暂无事件。</div>
              ) : (
                analytics.recentEvents.map((event, index) => (
                  <div key={`${event.createdAt}-${index}`} className="px-5 py-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-[#1E2C31]">{eventLabel(event.eventName)}</span>
                      <span className="text-xs text-[#8A9EA4]">{formatEventDate(event.createdAt)}</span>
                    </div>
                    <div className="mt-1 text-xs text-[#61767D]">{event.path}</div>
                    <div className="mt-1 text-xs text-[#1889B6]">
                      {event.sourceType ? sourceTypeLabel(event.sourceType) : '未分类'} · {event.source || 'no source'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <SectionTitle title="外部统计接入状态" detail="保留 GA / Search Console / Vercel Analytics 的准备状态；正式接入另开任务。" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {readiness.items.map((item) => (
              <ReadinessCard key={item.key} item={item} showAdminNote={role === 'admin'} />
            ))}
          </div>
        </section>
      </section>
    </StatusPageShell>
  )
}

function AnalysisModeCard({ title, value, detail }: { title: string; value: number | string; detail: string }) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-[#1889B6]">{title}</div>
      <div className="mt-3 text-2xl font-black text-[#1E2C31]">{typeof value === 'number' ? formatNumber(value) : value}</div>
      <div className="mt-2 text-xs leading-5 text-[#61767D]">{detail}</div>
    </div>
  )
}

function RankTable({
  rows,
  empty,
  secondaryLabel,
}: {
  rows: AnalyticsRankRow[]
  empty: string
  secondaryLabel: string
}) {
  if (rows.length === 0) {
    return <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">{empty}</div>
  }
  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
            <th className="px-4 py-3 text-left font-medium">页面</th>
            <th className="px-4 py-3 text-right font-medium">数量</th>
            <th className="px-4 py-3 text-right font-medium">{secondaryLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
              <td className="max-w-[360px] truncate px-4 py-3 font-medium text-[#1E2C31]">{row.label}</td>
              <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.value)}</td>
              <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.secondary ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RankList({ rows, empty }: { rows: AnalyticsRankRow[]; empty: string }) {
  if (rows.length === 0) {
    return <div className="rounded-md border border-[#D8E7E8] bg-white p-4 text-sm text-[#61767D] shadow-sm">{empty}</div>
  }
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      {rows.slice(0, 6).map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 border-b border-[#E6EEEE] px-4 py-3 last:border-0">
          <span className="min-w-0 truncate text-sm font-medium text-[#1E2C31]">{row.label}</span>
          <span className="shrink-0 text-sm font-bold text-[#1889B6]">{formatNumber(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

function ReadinessCard({ item, showAdminNote }: { item: AnalyticsReadinessItem; showAdminNote: boolean }) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">{item.title}</h2>
          <p className="mt-2 text-sm font-semibold text-[#1889B6]">{item.status}</p>
          <p className="mt-2 text-sm leading-6 text-[#61767D]">{item.detail}</p>
          {showAdminNote && item.adminNote ? (
            <p className="mt-3 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3 text-xs leading-5 text-[#61767D]">
              {item.adminNote}
            </p>
          ) : null}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statePillClass(item.state)}`}>
          {stateLabel(item.state)}
        </span>
      </div>
    </div>
  )
}

function eventLabel(eventName: string) {
  if (eventName === 'page_view') return '页面访问'
  if (eventName === 'cta_click') return 'CTA 点击'
  if (eventName === 'form_submit_success') return '表单成功'
  if (eventName === 'contact_redirect') return '联系跳转'
  return eventName
}

function formatEventDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function stateLabel(state: AnalyticsReadinessItem['state']): string {
  if (state === 'active') return '已准备'
  if (state === 'partial') return '部分准备'
  if (state === 'planned') return '待接入'
  return '上线前确认'
}

function statePillClass(state: AnalyticsReadinessItem['state']): string {
  if (state === 'active') return 'bg-emerald-50 text-emerald-700'
  if (state === 'partial') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (state === 'planned') return 'bg-[#FFF2E7] text-[#E36F2C]'
  return 'bg-[#F5F2ED] text-[#6B625B]'
}
