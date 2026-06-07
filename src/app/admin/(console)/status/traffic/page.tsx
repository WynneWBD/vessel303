import Link from 'next/link'
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
  type AnalyticsHourlyTrendRow,
  type AnalyticsPeriodMetric,
  type AnalyticsWindowMetric,
  type AnalyticsRankRow,
  type SiteAnalyticsDashboard,
  type AnalyticsTrendRow,
} from '@/lib/site-analytics'
import { AdminPageHero } from '@/components/admin/AdminUI'
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

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type TrafficRange = 'today' | 'yesterday' | '7' | '30'
type TrafficMetric = AnalyticsPeriodMetric | AnalyticsWindowMetric
type TrendDisplayRow = {
  key: string
  label: string
  pageViews: number
  visitors: number
  actions: number
  formSubmits: number
  leads: number
}

export default async function AdminStatusTrafficPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {}
  const activeRange = normalizeRange(sp.range)
  const { role, email } = await getStatusAccess()
  const overview = await loadStatusOverview()
  const readiness = loadAnalyticsReadinessMetrics()
  const analytics = await loadSiteAnalyticsDashboard()
  const today = analytics.periods.find((item) => item.key === 'today') ?? analytics.periods[0]
  const yesterday = analytics.periods.find((item) => item.key === 'yesterday') ?? analytics.periods[1] ?? today
  const sevenDays = analytics.windows.find((item) => item.days === 7) ?? analytics.windows[0]
  const thirtyDays = analytics.windows.find((item) => item.days === 30) ?? analytics.windows[1] ?? sevenDays
  const activeMetric = getActiveMetric(activeRange, today, yesterday, sevenDays, thirtyDays)
  const trendRows = buildTrendRows(activeRange, analytics.hourlyTrend, analytics.dailyTrend)
  const insights = buildInsightItems(analytics, activeMetric, activeRange)

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="traffic"
      badges={buildStatusBadges(overview, role)}
    >
      <section className="space-y-6">
        <AdminPageHero
          kicker="Website Analytics"
          title="网站访问统计"
          description="按专业后台的数据分析流程组织：选择站点与时间口径，先看汇总表和趋势，再进入来源、落地页、行为事件和线索转化。"
        >
          <div className="flex flex-wrap gap-2">
            <StatusPill ok={analytics.available} label={analytics.available ? '事件表可用' : '事件表未就绪'} />
            <StatusPill ok label="不采集表单隐私" />
            <StatusPill ok label="不接第三方 API" />
            <StatusPill ok label={`已排除测试数据 ${formatNumber(activeMetric.testEvents)} 事件 / ${formatNumber(activeMetric.testLeads)} 线索`} />
          </div>
        </AdminPageHero>

        <TrafficControlBar activeRange={activeRange} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title={`${rangeLabel(activeRange)} PV`}
            value={activeMetric.pageViews}
            detail={`对照 30 天 ${formatNumber(thirtyDays.pageViews)} 次页面访问`}
            Icon={STATUS_ICONS.BarChart3}
            tone="blue"
          />
          <MetricCard
            title={`${rangeLabel(activeRange)}访客`}
            value={activeMetric.visitors}
            detail="基于匿名 visitor id hash，不保存 IP。"
            Icon={STATUS_ICONS.Activity}
            tone="green"
          />
          <MetricCard
            title="CTA 动作"
            value={activeMetric.ctaClicks + activeMetric.contactRedirects}
            detail={`表单成功 ${formatNumber(activeMetric.formSubmits)} 次`}
            Icon={STATUS_ICONS.ListChecks}
            tone="orange"
          />
          <MetricCard
            title="线索"
            value={activeMetric.leads}
            detail={`近 7 天 ${formatNumber(sevenDays.leads)} 条 leads；不含 Codex 测试线索`}
            href="/admin/customers/leads"
            Icon={STATUS_ICONS.Inbox}
            tone="green"
          />
          <MetricCard
            title="访问转化率"
            value={formatAnalyticsPercent(activeMetric.conversionRate)}
            detail="真实线索数 / 页面访问数，已排除 admin_test 和 Codex 测试。"
            Icon={STATUS_ICONS.ShieldCheck}
            tone="blue"
          />
        </div>

          <TrafficModeNav
          pageViews={activeMetric.pageViews}
          landingPages={analytics.landingPages.length}
          actions={activeMetric.ctaClicks + activeMetric.contactRedirects + activeMetric.formSubmits}
          leads={activeMetric.leads}
          readiness={`${readiness.readyCount}/${readiness.items.length}`}
        />

        <TrafficSummaryTable
          today={today}
          yesterday={yesterday}
          sevenDays={sevenDays}
          thirtyDays={thirtyDays}
          activeRange={activeRange}
        />

        <section id="trend-analysis" className="space-y-4">
          <SectionTitle title={activeRange === 'today' ? '今日小时趋势' : '访问趋势'} detail="聚合 PV、访客、转化动作、表单成功和真实线索，先看趋势再看排行。" />
          <TrendWorkspace rows={trendRows} />
        </section>

        <section className="space-y-4">
          <SectionTitle title="运营诊断" detail="把 300 后台式统计结果转成可处理提示；这里只提示风险，不自动改内容或线索状态。" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            {insights.map((item) => (
              <InsightCard key={item.key} item={item} />
            ))}
          </div>
        </section>

        <section id="behavior-analysis" className="space-y-4">
          <SectionTitle title="访问行为分析" detail="把 Top Pages、referrer、source type 和动作来源放在同屏，先判断访客从哪里来、看什么、点什么。" />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
            <section className="space-y-4">
              <SectionTitle title="Top Pages" detail="近 30 天访问最多的前台页面。" />
              <RankTable rows={analytics.topPages} empty="暂无页面访问事件。" valueLabel="访问" secondaryLabel="访客" />
            </section>

            <section className="space-y-4">
              <SectionTitle title="来源与入口" detail="先按 referrer 和 source type 做运营判断。" />
              <RankList rows={analytics.topReferrers} empty="暂无 referrer 数据。" />
              <RankList rows={analytics.sourceTypes} empty="暂无 CTA / 表单来源数据。" />
            </section>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section id="landing-analysis" className="space-y-4">
            <SectionTitle title="落地页跳出分析" detail="先用同一路径内页面访问和后续动作判断高访问低动作页面；精确跳出率需要会话级链路后续单独接入。" />
            <RankTable rows={analytics.landingPages} empty="暂无落地页事件。" valueLabel="访问" secondaryLabel="动作" />
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

function TrafficControlBar({ activeRange }: { activeRange: TrafficRange }) {
  const ranges: Array<{ key: TrafficRange; label: string }> = [
    { key: 'today', label: '今天' },
    { key: 'yesterday', label: '昨天' },
    { key: '7', label: '最近 7 天' },
    { key: '30', label: '最近 30 天' },
  ]

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 min-w-60 items-center rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 text-sm font-medium text-[#1E2C31]">
            英文站 en.303vessel.cn / vessel303.com
          </span>
          <span className="inline-flex overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
            {ranges.map((item, index) => (
              <Link
                key={item.key}
                href={`/admin/status/traffic?range=${item.key}`}
                className={`inline-flex h-9 items-center px-3 text-sm font-semibold ${
                  index > 0 ? 'border-l border-[#D8E7E8]' : ''
                } ${
                  activeRange === item.key
                    ? 'bg-[#1889B6] text-white'
                    : 'text-[#61767D] hover:bg-[#F0F7F8] hover:text-[#1889B6]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </span>
          <span className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 text-sm text-[#61767D]">
            指标：浏览次数(PV)
          </span>
          <span className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 text-sm text-[#61767D]">
            + 转化动作
          </span>
        </div>
        <span className="text-xs text-[#8A9EA4]">页面打开时实时读取第一方事件；测试数据不计入运营口径。</span>
      </div>
    </div>
  )
}

function TrafficModeNav({
  pageViews,
  landingPages,
  actions,
  leads,
  readiness,
}: {
  pageViews: number
  landingPages: number
  actions: number
  leads: number
  readiness: string
}) {
  const items = [
    { title: '网站访问统计', value: `${formatNumber(pageViews)} PV`, href: '#trend-analysis' },
    { title: '落地页跳出分析', value: `${formatNumber(landingPages)} 页`, href: '#landing-analysis' },
    { title: '访问行为分析', value: `${formatNumber(actions)} 次`, href: '#behavior-analysis' },
    { title: '线索转化分析', value: `${formatNumber(leads)} 条`, href: '/admin/site/conversion' },
    { title: 'Google收录分析', value: readiness, href: '/admin/site/seo' },
  ]

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
        >
          <span className="block text-xs font-semibold text-[#1889B6]">{item.title}</span>
          <span className="mt-3 block text-2xl font-black text-[#1E2C31]">{item.value}</span>
        </Link>
      ))}
    </section>
  )
}

function TrafficSummaryTable({
  today,
  yesterday,
  sevenDays,
  thirtyDays,
  activeRange,
}: {
  today: AnalyticsPeriodMetric
  yesterday: AnalyticsPeriodMetric
  sevenDays: AnalyticsWindowMetric
  thirtyDays: AnalyticsWindowMetric
  activeRange: TrafficRange
}) {
  const rows = [
    { label: '今天', metric: today, active: activeRange === 'today' },
    { label: '昨天', metric: yesterday, active: activeRange === 'yesterday' },
    { label: '最近 7 天', metric: sevenDays, active: activeRange === '7' },
    { label: '最近 30 天', metric: thirtyDays, active: activeRange === '30' },
  ]

  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3">
        <h2 className="text-sm font-bold text-[#1E2C31]">网站访问统计表</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">口径</th>
              <th className="px-4 py-3 text-right font-medium">PV</th>
              <th className="px-4 py-3 text-right font-medium">访客(UV)</th>
              <th className="px-4 py-3 text-right font-medium">CTA</th>
              <th className="px-4 py-3 text-right font-medium">联系跳转</th>
              <th className="px-4 py-3 text-right font-medium">表单成功</th>
              <th className="px-4 py-3 text-right font-medium">真实线索</th>
              <th className="px-4 py-3 text-right font-medium">访问转化率</th>
              <th className="px-4 py-3 text-right font-medium">排除测试</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={`border-b border-[#E6EEEE] last:border-0 ${row.active ? 'bg-[#F0F7F8]' : ''}`}>
                <td className="px-4 py-3 font-semibold text-[#1E2C31]">{row.label}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1E2C31]">{formatNumber(row.metric.pageViews)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.visitors)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.ctaClicks)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.contactRedirects)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.formSubmits)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.metric.leads)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1889B6]">{formatAnalyticsPercent(row.metric.conversionRate)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">
                  {formatNumber(row.metric.testEvents)} / {formatNumber(row.metric.testLeads)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrendWorkspace({ rows }: { rows: TrendDisplayRow[] }) {
  if (rows.length === 0) {
    return <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">暂无可用趋势数据。</div>
  }

  const maxViews = Math.max(1, ...rows.map((row) => row.pageViews))
  const displayRows = rows.slice(-14)

  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#1889B6]">浏览次数(PV)</span>
          <span className="rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#61767D]">访客(UV)</span>
          <span className="rounded-md border border-[#D8E7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#61767D]">转化动作</span>
        </div>
        <span className="text-xs text-[#8A9EA4]">蓝色为 PV，橙色为转化动作。</span>
      </div>
      <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="p-5">
          <div className="flex h-72 items-end gap-2 border-b border-[#E6EEEE] pb-4">
            {displayRows.map((row) => {
              const height = Math.max(10, Math.round((row.pageViews / maxViews) * 230))
              const actionHeight = Math.max(6, Math.round((row.actions / maxViews) * 230))
              return (
                <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-60 w-full items-end justify-center gap-1">
                    <span className="w-2.5 rounded-t bg-[#1889B6]" style={{ height }} title={`${formatNumber(row.pageViews)} PV`} />
                    <span className="w-2.5 rounded-t bg-[#E36F2C]" style={{ height: actionHeight }} title={`${formatNumber(row.actions)} 动作`} />
                  </div>
                  <span className="w-full truncate text-center text-[11px] text-[#8A9EA4]">{row.label}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="border-t border-[#E6EEEE] xl:border-l xl:border-t-0">
          <TrendTable rows={displayRows} />
        </div>
      </div>
    </div>
  )
}

function TrendTable({ rows }: { rows: TrendDisplayRow[] }) {
  if (rows.length === 0) {
    return <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">暂无可用趋势数据。</div>
  }

  const maxViews = Math.max(1, ...rows.map((row) => row.pageViews))

  return (
    <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">日期</th>
              <th className="px-4 py-3 text-left font-medium">PV 趋势</th>
              <th className="px-4 py-3 text-right font-medium">访客</th>
              <th className="px-4 py-3 text-right font-medium">动作</th>
              <th className="px-4 py-3 text-right font-medium">表单</th>
              <th className="px-4 py-3 text-right font-medium">线索</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-4 py-3 font-medium text-[#1E2C31]">{row.label}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-12 shrink-0 text-right font-semibold text-[#1E2C31]">{formatNumber(row.pageViews)}</span>
                    <span className="h-2 min-w-28 flex-1 rounded-full bg-[#E6EEEE]">
                      <span
                        className="block h-2 rounded-full bg-[#1889B6]"
                        style={{ width: `${Math.max(4, Math.round((row.pageViews / maxViews) * 100))}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.visitors)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.actions)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.formSubmits)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.leads)}</td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  )
}

type InsightSeverity = 'ok' | 'watch' | 'issue'

type InsightItem = {
  key: string
  title: string
  value: string
  detail: string
  severity: InsightSeverity
}

function buildInsightItems(
  analytics: SiteAnalyticsDashboard,
  windowMetric: TrafficMetric,
  activeRange: TrafficRange,
): InsightItem[] {
  const actionTotal = analytics.sourceTypes.reduce((sum, row) => sum + row.value, 0)
  const otherActions = analytics.sourceTypes.find((row) => row.key === 'other')?.value ?? 0
  const otherShare = actionTotal > 0 ? otherActions / actionTotal : 0
  const quietLandingPage = analytics.landingPages.find((row) => row.value >= 20 && (row.secondary ?? 0) === 0)
  const topPage = analytics.topPages[0]
  const currentRangeLabel = rangeLabel(activeRange)
  const conversionSeverity: InsightSeverity =
    windowMetric.pageViews >= 100 && windowMetric.leads === 0
      ? 'issue'
      : windowMetric.pageViews >= 100 && windowMetric.conversionRate < 0.005
        ? 'watch'
        : 'ok'

  return [
    {
      key: 'conversion-rate',
      title: '访问转化率',
      value: formatAnalyticsPercent(windowMetric.conversionRate),
      detail:
        windowMetric.pageViews === 0
          ? `暂无 ${currentRangeLabel}访问事件。`
          : `${currentRangeLabel} ${formatNumber(windowMetric.pageViews)} PV / ${formatNumber(windowMetric.leads)} 条真实线索。`,
      severity: conversionSeverity,
    },
    {
      key: 'quiet-landing-page',
      title: '高访问低动作',
      value: quietLandingPage ? quietLandingPage.label : '暂无',
      detail: quietLandingPage
        ? `${formatNumber(quietLandingPage.value)} 次访问但暂无 CTA / 联系 / 表单动作。`
        : '当前 Top landing pages 均有动作或访问量较低。',
      severity: quietLandingPage ? 'watch' : 'ok',
    },
    {
      key: 'source-classification',
      title: '来源归类',
      value: actionTotal > 0 ? `${Math.round(otherShare * 100)}% other` : '暂无动作',
      detail:
        actionTotal > 0
          ? `${currentRangeLabel}动作 ${formatNumber(actionTotal)} 次，其中 other ${formatNumber(otherActions)} 次。`
          : '暂无 CTA / 联系 / 表单来源事件。',
      severity: otherShare > 0.5 ? 'watch' : 'ok',
    },
    {
      key: 'top-page',
      title: '最高访问页',
      value: topPage?.label ?? '暂无',
      detail: topPage
        ? `${formatNumber(topPage.value)} 次访问 / ${formatNumber(topPage.secondary ?? 0)} 名匿名访客。`
        : `暂无 ${currentRangeLabel}页面访问事件。`,
      severity: 'ok',
    },
  ]
}

function InsightCard({ item }: { item: InsightItem }) {
  return (
    <div className={`rounded-md border p-5 shadow-sm ${insightClass(item.severity)}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#1E2C31]">{item.title}</h3>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">{insightLabel(item.severity)}</span>
      </div>
      <div className="mt-4 truncate text-2xl font-black text-[#1E2C31]">{item.value}</div>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{item.detail}</p>
    </div>
  )
}

function RankTable({
  rows,
  empty,
  valueLabel = '数量',
  secondaryLabel,
}: {
  rows: AnalyticsRankRow[]
  empty: string
  valueLabel?: string
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
            <th className="px-4 py-3 text-right font-medium">{valueLabel}</th>
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

function insightLabel(severity: InsightSeverity): string {
  if (severity === 'issue') return '需处理'
  if (severity === 'watch') return '需观察'
  return '正常'
}

function insightClass(severity: InsightSeverity): string {
  if (severity === 'issue') return 'border-[#E36F2C]/45 bg-[#FFF2E7]'
  if (severity === 'watch') return 'border-[#F2C46D]/60 bg-[#FFF9EA]'
  return 'border-[#D8E7E8] bg-white'
}

function formatTrendDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
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

function getActiveMetric(
  range: TrafficRange,
  today: AnalyticsPeriodMetric,
  yesterday: AnalyticsPeriodMetric,
  sevenDays: AnalyticsWindowMetric,
  thirtyDays: AnalyticsWindowMetric,
): TrafficMetric {
  if (range === 'today') return today
  if (range === 'yesterday') return yesterday
  if (range === '7') return sevenDays
  return thirtyDays
}

function buildTrendRows(
  range: TrafficRange,
  hourlyRows: AnalyticsHourlyTrendRow[],
  dailyRows: AnalyticsTrendRow[],
): TrendDisplayRow[] {
  if (range === 'today') {
    return hourlyRows.map((row) => ({
      key: row.hour,
      label: row.hour,
      pageViews: row.pageViews,
      visitors: row.visitors,
      actions: row.actions,
      formSubmits: row.formSubmits,
      leads: 0,
    }))
  }

  const days = range === '7' ? 7 : 14
  return dailyRows.slice(-days).map((row) => ({
    key: row.date,
    label: formatTrendDate(row.date),
    pageViews: row.pageViews,
    visitors: row.visitors,
    actions: row.actions,
    formSubmits: row.formSubmits,
    leads: row.leads,
  }))
}

function rangeLabel(range: TrafficRange): string {
  if (range === 'today') return '今日'
  if (range === 'yesterday') return '昨日'
  return `${range} 天`
}

function normalizeRange(value: string | string[] | undefined): TrafficRange {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === 'today' || raw === 'yesterday' || raw === '7') return raw
  return '30'
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
