import Link from 'next/link'
import { CONVERSION_PATHS } from '@/lib/admin-conversion-paths'
import {
  loadAnalyticsReadinessMetrics,
  loadStatusOverview,
  formatNumber,
  type AnalyticsReadinessItem,
} from '@/lib/admin-status-metrics'
import { loadCaseInquiryHealth, type CaseInquiryHealth } from '@/lib/project-case-inquiry-health'
import {
  formatAnalyticsPercent,
  loadSiteAnalyticsDashboard,
  sourceTypeLabel,
  type AnalyticsBehaviorStep,
  type AnalyticsComparisonMetric,
  type AnalyticsDeltaMetric,
  type AnalyticsAllTimeMetric,
  type AnalyticsHourlyTrendRow,
  type AnalyticsPeriodMetric,
  type AnalyticsWindowMetric,
  type AnalyticsRankRow,
  type SiteAnalyticsDashboard,
  type AnalyticsTrendRow,
  type AnalyticsConversionMetric,
} from '@/lib/site-analytics'
import { AdminPageHero } from '@/components/admin/AdminUI'
import {
  buildStatusBadges,
  SectionTitle,
  StatusPageShell,
  StatusPill,
} from '../_components'
import { getStatusAccess } from '../_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '网站数据分析 - 运营数据中心 - VESSEL' }

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type TrafficRange = 'today' | 'yesterday' | '7' | '30'
type TrafficMetric = AnalyticsPeriodMetric | AnalyticsWindowMetric
type TrafficAggregateMetric = TrafficMetric | AnalyticsAllTimeMetric
type TrendDisplayRow = {
  key: string
  label: string
  pageViews: number
  visitors: number
  actions: number
  formSubmits: number
  leads: number
}
type TrafficLedgerTone = 'blocker' | 'review' | 'watch' | 'ready'
type TrafficLedgerRow = {
  key: string
  stage: string
  priority: string
  item: string
  value: string
  evidence: string
  nextAction: string
  href: string
  tone: TrafficLedgerTone
}

export default async function AdminStatusTrafficPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {}
  const activeRange = normalizeRange(sp.range)
  const { role, email } = await getStatusAccess()
  const readiness = loadAnalyticsReadinessMetrics()
  const [overview, analytics, caseInquiryHealth] = await Promise.all([
    loadStatusOverview(),
    loadSiteAnalyticsDashboard(),
    loadCaseInquiryHealth(),
  ])
  const today = analytics.periods.find((item) => item.key === 'today') ?? analytics.periods[0]
  const yesterday = analytics.periods.find((item) => item.key === 'yesterday') ?? analytics.periods[1] ?? today
  const sevenDays = analytics.windows.find((item) => item.days === 7) ?? analytics.windows[0]
  const thirtyDays = analytics.windows.find((item) => item.days === 30) ?? analytics.windows[1] ?? sevenDays
  const activeMetric = getActiveMetric(activeRange, today, yesterday, sevenDays, thirtyDays)
  const activeComparison = analytics.comparisons.find((item) => item.key === activeRange)
  const trendRows = buildTrendRows(activeRange, analytics.hourlyTrend, analytics.yesterdayHourlyTrend, analytics.dailyTrend)
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

        <TrafficControlBar
          activeRange={activeRange}
          allTime={analytics.allTime}
          bestDay={analytics.bestDay}
        />

        <TrafficAnalysisConsole
          analytics={analytics}
          trendRows={trendRows}
          today={today}
          yesterday={yesterday}
          sevenDays={sevenDays}
          thirtyDays={thirtyDays}
          allTime={analytics.allTime}
          bestDay={analytics.bestDay}
          activeRange={activeRange}
          activeMetric={activeMetric}
          readiness={`${readiness.readyCount}/${readiness.items.length}`}
          caseInquiryHealth={caseInquiryHealth}
        />

        <ComparisonStrip comparison={activeComparison} />

        <TrafficOperationsLedger
          analytics={analytics}
          activeMetric={activeMetric}
          activeRange={activeRange}
          trendRows={trendRows}
          comparison={activeComparison}
        />

        <TrafficDrilldownWorkbench
          analytics={analytics}
          activeMetric={activeMetric}
          activeRange={activeRange}
        />

        <TrafficRouteMatrix analytics={analytics} activeMetric={activeMetric} />

        <TrafficSourceStagePanel analytics={analytics} />

        <ProductTrafficPanel analytics={analytics} />

        <CaseInquiryTrafficPanel analytics={analytics} health={caseInquiryHealth} />

        <section id="trend-analysis" className="space-y-4">
          <SectionTitle title={activeRange === 'today' ? '今日小时趋势' : activeRange === 'yesterday' ? '昨日小时趋势' : '访问趋势'} detail="聚合 PV、访客、转化动作、表单成功和真实线索，先看趋势再看排行。" />
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
          <BehaviorPathBoard steps={analytics.behaviorSteps} />
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

function TrafficControlBar({
  activeRange,
  allTime,
  bestDay,
}: {
  activeRange: TrafficRange
  allTime: AnalyticsAllTimeMetric
  bestDay: AnalyticsTrendRow | null
}) {
  const ranges: Array<{ key: TrafficRange; label: string }> = [
    { key: 'today', label: '今天' },
    { key: 'yesterday', label: '昨天' },
    { key: '7', label: '最近 7 天' },
    { key: '30', label: '最近 30 天' },
  ]
  const historyWindow =
    allTime.firstEventAt && allTime.lastEventAt
      ? `${formatEventDate(allTime.firstEventAt)} - ${formatEventDate(allTime.lastEventAt)}`
      : '暂无历史事件'

  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 border-b border-[#E6EEEE] text-sm xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="inline-flex h-8 items-center border border-[#D8E7E8] bg-[#FBFDFD] px-3 font-semibold text-[#1E2C31]">
            英文站 vessel303.com
          </span>
          <span className="inline-flex h-8 items-center border border-[#D8E7E8] bg-white px-3 text-[#61767D]">
            数据源：第一方 site_events
          </span>
          <span className="inline-flex h-8 items-center border border-[#D8E7E8] bg-white px-3 text-[#61767D]">
            历史窗口：{historyWindow}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[#E6EEEE] px-4 py-3 xl:border-l xl:border-t-0">
          <span className="text-xs font-semibold text-[#8A9EA4]">时间口径</span>
          <span className="inline-flex overflow-hidden border border-[#D8E7E8] bg-white">
            {ranges.map((item, index) => (
              <Link
                key={item.key}
                href={`/admin/status/traffic?range=${item.key}`}
                className={`inline-flex h-8 items-center px-3 text-xs font-semibold ${
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
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-4 md:divide-x md:divide-y-0">
        <ToolbarStat label="当前指标" value="PV / UV / Actions / Leads" detail="测试事件已排除" />
        <ToolbarStat label="历史累计 PV" value={formatNumber(allTime.pageViews)} detail={`${formatNumber(allTime.visitors)} 匿名访客`} />
        <ToolbarStat
          label="历史最高日"
          value={bestDay ? formatTrendDate(bestDay.date) : '暂无'}
          detail={bestDay ? `${formatNumber(bestDay.pageViews)} PV / ${formatNumber(bestDay.actions)} 动作` : '等待事件样本'}
        />
        <ToolbarStat label="更新频率" value="实时读取" detail="页面打开时聚合" />
      </div>
    </div>
  )
}

function ToolbarStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[11px] font-semibold text-[#8A9EA4]">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-[#1E2C31]" title={value}>{value}</div>
      <div className="mt-1 truncate text-xs text-[#61767D]" title={detail}>{detail}</div>
    </div>
  )
}

function TrafficAnalysisConsole({
  analytics,
  trendRows,
  today,
  yesterday,
  sevenDays,
  thirtyDays,
  allTime,
  bestDay,
  activeRange,
  activeMetric,
  readiness,
  caseInquiryHealth,
}: {
  analytics: SiteAnalyticsDashboard
  trendRows: TrendDisplayRow[]
  today: AnalyticsPeriodMetric
  yesterday: AnalyticsPeriodMetric
  sevenDays: AnalyticsWindowMetric
  thirtyDays: AnalyticsWindowMetric
  allTime: AnalyticsAllTimeMetric
  bestDay: AnalyticsTrendRow | null
  activeRange: TrafficRange
  activeMetric: TrafficMetric
  readiness: string
  caseInquiryHealth: CaseInquiryHealth
}) {
  const actions = activeMetric.ctaClicks + activeMetric.contactRedirects + activeMetric.formSubmits

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <SectionTitle
          title="网站访问统计工作台"
          detail="按 300 后台式流程组织：先看统计表和趋势，再看 Top 页面、落地页、来源和下钻入口。"
        />
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-[#D8E7E8] bg-white px-3 py-2 font-semibold text-[#1E2C31]">
            当前口径：{rangeLabel(activeRange)}
          </span>
          <span className="rounded-md border border-[#D8E7E8] bg-white px-3 py-2 font-semibold text-[#1889B6]">
            PV {formatNumber(activeMetric.pageViews)}
          </span>
          <span className="rounded-md border border-[#D8E7E8] bg-white px-3 py-2 font-semibold text-[#E36F2C]">
            动作 {formatNumber(actions)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.18fr)_minmax(420px,0.82fr)]">
        <div className="space-y-4">
          <TrafficSummaryTable
            today={today}
            yesterday={yesterday}
            sevenDays={sevenDays}
            thirtyDays={thirtyDays}
            allTime={allTime}
            bestDay={bestDay}
            activeRange={activeRange}
          />
          <TrafficModuleStrip
            pageViews={activeMetric.pageViews}
            landingPages={analytics.landingPages.length}
            actions={actions}
            leads={activeMetric.leads}
            readiness={readiness}
            productPathActions={analytics.conversionPaths.products?.ctaClicks ?? 0}
            casePathActions={analytics.conversionPaths.cases?.ctaClicks ?? 0}
            weakCases={caseInquiryHealth.weak}
          />
        </div>

        <div className="space-y-4">
          <TrafficLineChart rows={trendRows} activeRange={activeRange} />
          <TrafficRankConsole analytics={analytics} />
        </div>
      </div>
    </section>
  )
}

function TrafficLineChart({ rows, activeRange }: { rows: TrendDisplayRow[]; activeRange: TrafficRange }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">
        暂无可用趋势数据。
      </div>
    )
  }

  const displayRows = rows.slice(activeRange === 'today' || activeRange === 'yesterday' ? -24 : -14)
  const width = 520
  const height = 210
  const left = 34
  const right = 18
  const top = 22
  const bottom = 34
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const maxValue = Math.max(1, ...displayRows.flatMap((row) => [row.pageViews, row.actions]))
  const xFor = (index: number) => left + (displayRows.length <= 1 ? chartWidth : (index / (displayRows.length - 1)) * chartWidth)
  const yFor = (value: number) => top + chartHeight - (value / maxValue) * chartHeight
  const pvPoints = displayRows.map((row, index) => `${xFor(index)},${yFor(row.pageViews)}`).join(' ')
  const actionPoints = displayRows.map((row, index) => `${xFor(index)},${yFor(row.actions)}`).join(' ')
  const lastRow = displayRows[displayRows.length - 1]
  const firstLabel = displayRows[0]?.label ?? ''
  const lastLabel = lastRow?.label ?? ''

  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">流量趋势图</h2>
          <p className="mt-1 text-xs text-[#61767D]">蓝线为 PV，橙线为 CTA / 联系 / 表单动作合计。</p>
        </div>
        <span className="text-xs font-semibold text-[#1889B6]">{rangeLabel(activeRange)} / {formatNumber(displayRows.length)} 个点</span>
      </div>
      <div className="px-4 py-4">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="PV 和转化动作趋势" className="h-64 w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = top + ratio * chartHeight
            return <line key={ratio} x1={left} x2={width - right} y1={y} y2={y} stroke="#E6EEEE" strokeWidth="1" />
          })}
          <polyline fill="none" points={pvPoints} stroke="#1889B6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <polyline fill="none" points={actionPoints} stroke="#E36F2C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {displayRows.map((row, index) => (
            <circle key={`${row.key}-pv`} cx={xFor(index)} cy={yFor(row.pageViews)} r="3.5" fill="#1889B6">
              <title>{`${row.label}: ${formatNumber(row.pageViews)} PV`}</title>
            </circle>
          ))}
          {displayRows.map((row, index) => (
            <circle key={`${row.key}-actions`} cx={xFor(index)} cy={yFor(row.actions)} r="3" fill="#E36F2C">
              <title>{`${row.label}: ${formatNumber(row.actions)} 动作`}</title>
            </circle>
          ))}
          <text x={left} y={height - 10} fill="#8A9EA4" fontSize="11">{firstLabel}</text>
          <text x={width - right} y={height - 10} fill="#8A9EA4" fontSize="11" textAnchor="end">{lastLabel}</text>
        </svg>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <SnapshotMetric label="末点 PV" value={lastRow?.pageViews ?? 0} detail="最后一个趋势点" />
          <SnapshotMetric label="末点动作" value={lastRow?.actions ?? 0} detail="转化动作" />
          <SnapshotMetric label="末点访客" value={lastRow?.visitors ?? 0} detail="匿名 UV" />
        </div>
      </div>
    </div>
  )
}

function TrafficRankConsole({ analytics }: { analytics: SiteAnalyticsDashboard }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3">
        <h2 className="text-sm font-bold text-[#1E2C31]">核心排行</h2>
        <p className="mt-1 text-xs text-[#61767D]">同屏查看页面、落地页和来源，避免只看单一 PV。</p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] xl:grid-cols-3 xl:divide-x xl:divide-y-0">
        <TrafficRankMiniSection title="Top Pages" rows={analytics.topPages} empty="暂无页面访问事件。" valueLabel="PV" secondaryLabel="UV" />
        <TrafficRankMiniSection title="落地页动作" rows={analytics.landingPages} empty="暂无落地页事件。" valueLabel="访问" secondaryLabel="动作" />
        <TrafficRankMiniSection
          title="来源类型"
          rows={analytics.sourceTypes}
          empty="暂无来源事件。"
          valueLabel="动作"
          secondaryLabel="占位"
          formatLabel={sourceTypeLabel}
          hideSecondary
        />
      </div>
    </div>
  )
}

function TrafficRankMiniSection({
  title,
  rows,
  empty,
  valueLabel,
  secondaryLabel,
  formatLabel,
  hideSecondary = false,
}: {
  title: string
  rows: AnalyticsRankRow[]
  empty: string
  valueLabel: string
  secondaryLabel: string
  formatLabel?: (value: string) => string
  hideSecondary?: boolean
}) {
  const displayRows = rows.slice(0, 5)

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 border-b border-[#E6EEEE] px-4 py-3">
        <h3 className="text-xs font-bold text-[#1E2C31]">{title}</h3>
        <span className="text-[11px] font-semibold text-[#8A9EA4]">{valueLabel}{hideSecondary ? '' : ` / ${secondaryLabel}`}</span>
      </div>
      <div className="divide-y divide-[#E6EEEE]">
        {displayRows.length === 0 ? (
          <div className="px-4 py-4 text-xs text-[#8A9EA4]">{empty}</div>
        ) : (
          displayRows.map((row) => (
            <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_72px] gap-3 px-4 py-3 text-xs">
              <div className="min-w-0">
                <div className="truncate font-semibold text-[#1E2C31]" title={row.label}>
                  {formatLabel ? formatLabel(row.key) : row.label}
                </div>
                {!hideSecondary ? <div className="mt-1 text-[#8A9EA4]">{secondaryLabel} {formatNumber(row.secondary ?? 0)}</div> : null}
              </div>
              <div className="text-right font-bold text-[#1889B6]">{formatNumber(row.value)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TrafficModuleStrip({
  pageViews,
  landingPages,
  actions,
  leads,
  readiness,
  productPathActions,
  casePathActions,
  weakCases,
}: {
  pageViews: number
  landingPages: number
  actions: number
  leads: number
  readiness: string
  productPathActions: number
  casePathActions: number
  weakCases: number
}) {
  const items = [
    { title: '网站访问统计', value: `${formatNumber(pageViews)} PV`, href: '#trend-analysis', detail: '进入下钻' },
    { title: '落地页跳出分析', value: `${formatNumber(landingPages)} 页`, href: '#landing-analysis', detail: '进入下钻' },
    { title: '访问行为分析', value: `${formatNumber(actions)} 次`, href: '#behavior-analysis', detail: '进入下钻' },
    { title: '线索转化分析', value: `${formatNumber(leads)} 条`, href: '/admin/site/conversion', detail: '进入下钻' },
    { title: '产品路径分析', value: `${formatNumber(productPathActions)} 动作`, href: '#product-conversion-path', detail: '回连产品闭环' },
    { title: '案例询盘路径', value: `${formatNumber(casePathActions)} 动作`, href: '#case-inquiry-path', detail: `弱案例 ${formatNumber(weakCases)}` },
    { title: 'Google收录分析', value: readiness, href: '/admin/site/seo', detail: '进入下钻' },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-3 md:divide-x md:divide-y-0 2xl:grid-cols-7">
      {items.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          className="min-h-24 px-4 py-3 transition hover:bg-[#F7FAFA]"
        >
          <span className="block truncate text-xs font-semibold text-[#1889B6]">{item.title}</span>
          <span className="mt-3 block truncate text-xl font-black text-[#1E2C31]">{item.value}</span>
          <span className="mt-2 block text-[11px] text-[#8A9EA4]">{item.detail}</span>
        </Link>
      ))}
      </div>
    </section>
  )
}

function TrafficSummaryTable({
  today,
  yesterday,
  sevenDays,
  thirtyDays,
  allTime,
  bestDay,
  activeRange,
}: {
  today: AnalyticsPeriodMetric
  yesterday: AnalyticsPeriodMetric
  sevenDays: AnalyticsWindowMetric
  thirtyDays: AnalyticsWindowMetric
  allTime: AnalyticsAllTimeMetric
  bestDay: AnalyticsTrendRow | null
  activeRange: TrafficRange
}) {
  const rows: Array<{
    label: string
    note: string
    pageViews: number
    visitors: number
    actions: number
    formSubmits: number
    leads: number
    conversionRate: number
    excluded: string
    active?: boolean
  }> = [
    summaryTableRow('今天', '实时口径', today, activeRange === 'today'),
    summaryTableRow('昨天', '昨日对照', yesterday, activeRange === 'yesterday'),
    summaryTableRow('最近 7 天', '短期观察', sevenDays, activeRange === '7'),
    summaryTableRow('最近 30 天', '运营主口径', thirtyDays, activeRange === '30'),
    summaryTableRow('历史累计', allTime.firstEventAt ? 'site_events 全量' : '暂无历史事件', allTime),
    {
      label: '历史最高日',
      note: bestDay ? formatTrendDate(bestDay.date) : '暂无历史样本',
      pageViews: bestDay?.pageViews ?? 0,
      visitors: bestDay?.visitors ?? 0,
      actions: bestDay?.actions ?? 0,
      formSubmits: bestDay?.formSubmits ?? 0,
      leads: bestDay?.leads ?? 0,
      conversionRate: bestDay && bestDay.pageViews > 0 ? bestDay.leads / bestDay.pageViews : 0,
      excluded: '--',
    },
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
              <th className="px-4 py-3 text-right font-medium">转化动作</th>
              <th className="px-4 py-3 text-right font-medium">表单成功</th>
              <th className="px-4 py-3 text-right font-medium">真实线索</th>
              <th className="px-4 py-3 text-right font-medium">访问转化率</th>
              <th className="px-4 py-3 text-right font-medium">排除测试</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={`border-b border-[#E6EEEE] last:border-0 ${row.active ? 'bg-[#F0F7F8]' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#1E2C31]">{row.label}</div>
                  <div className="mt-1 text-xs text-[#8A9EA4]">{row.note}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#1E2C31]">{formatNumber(row.pageViews)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.visitors)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.actions)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.formSubmits)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.leads)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1889B6]">{formatAnalyticsPercent(row.conversionRate)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">
                  {row.excluded}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function summaryTableRow(label: string, note: string, metric: TrafficAggregateMetric, active = false) {
  return {
    label,
    note,
    pageViews: metric.pageViews,
    visitors: metric.visitors,
    actions: metricActions(metric),
    formSubmits: metric.formSubmits,
    leads: metric.leads,
    conversionRate: metric.conversionRate,
    excluded: `${formatNumber(metric.testEvents)} / ${formatNumber(metric.testLeads)}`,
    active,
  }
}

function ComparisonStrip({ comparison }: { comparison?: AnalyticsComparisonMetric }) {
  if (!comparison) {
    return (
      <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">
        暂无上一周期对比数据。
      </div>
    )
  }

  const items = [
    { label: 'PV', metric: comparison.pageViews, kind: 'number' as const },
    { label: '访客(UV)', metric: comparison.visitors, kind: 'number' as const },
    { label: '转化动作', metric: comparison.actions, kind: 'number' as const },
    { label: '真实线索', metric: comparison.leads, kind: 'number' as const },
    { label: '访问转化率', metric: comparison.conversionRate, kind: 'rate' as const },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">上一周期对比</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            {comparison.label} 对比 {comparison.previousLabel}，先看变化幅度，再判断是否需要下钻页面和来源。
          </p>
        </div>
        <span className="text-xs text-[#8A9EA4]">所有口径均排除测试事件和测试线索。</span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {items.map((item) => (
          <ComparisonCell key={item.label} label={item.label} metric={item.metric} kind={item.kind} previousLabel={comparison.previousLabel} />
        ))}
      </div>
    </section>
  )
}

function TrafficOperationsLedger({
  analytics,
  activeMetric,
  activeRange,
  trendRows,
  comparison,
}: {
  analytics: SiteAnalyticsDashboard
  activeMetric: TrafficMetric
  activeRange: TrafficRange
  trendRows: TrendDisplayRow[]
  comparison?: AnalyticsComparisonMetric
}) {
  const rows = buildTrafficOperationsRows(analytics, activeMetric, activeRange, trendRows, comparison)
  const blockerCount = rows.filter((row) => row.tone === 'blocker').length
  const reviewCount = rows.filter((row) => row.tone === 'review').length
  const watchCount = rows.filter((row) => row.tone === 'watch').length

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">访问分析处理台账</h2>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            按 300 后台常用分析顺序，把访问量、趋势、落地页、行为路径、来源归因和线索转化转成可下钻清单；本页只读，不写业务数据。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#FFF2E7] px-2.5 py-1 font-semibold text-[#E36F2C]">阻塞 {blockerCount}</span>
          <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 font-semibold text-[#1889B6]">复核 {reviewCount}</span>
          <span className="rounded-full bg-[#FFF9EA] px-2.5 py-1 font-semibold text-[#9A6A00]">观察 {watchCount}</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">口径 {rangeLabel(activeRange)}</span>
        </div>
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
              <th className="px-5 py-3 text-left font-medium">阶段</th>
              <th className="px-4 py-3 text-left font-medium">处理事项</th>
              <th className="px-4 py-3 text-left font-medium">当前值</th>
              <th className="px-4 py-3 text-left font-medium">证据 / 影响</th>
              <th className="px-4 py-3 text-left font-medium">优先级</th>
              <th className="px-5 py-3 text-right font-medium">下钻入口</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-5 py-3 font-semibold text-[#1E2C31]">{row.stage}</td>
                <td className="max-w-[250px] px-4 py-3">
                  <div className="truncate font-semibold text-[#1E2C31]" title={row.item}>{row.item}</div>
                </td>
                <td className="max-w-[220px] px-4 py-3">
                  <div className="truncate font-semibold text-[#1889B6]" title={row.value}>{row.value}</div>
                </td>
                <td className="max-w-[360px] px-4 py-3">
                  <div className="truncate text-[#61767D]" title={row.evidence}>{row.evidence}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficLedgerBadgeClass(row.tone)}`}>
                    {row.priority}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={row.href} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                    {row.nextAction}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] xl:hidden">
        {rows.map((row) => (
          <Link key={row.key} href={row.href} className="block p-5 transition hover:bg-[#F7FAFA]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#8A9EA4]">{row.stage}</div>
                <div className="mt-1 truncate text-base font-bold text-[#1E2C31]" title={row.item}>{row.item}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${trafficLedgerBadgeClass(row.tone)}`}>
                {row.priority}
              </span>
            </div>
            <div className="mt-3 text-sm font-semibold text-[#1889B6]">{row.value}</div>
            <div className="mt-2 text-xs leading-5 text-[#61767D]">{row.evidence}</div>
            <div className="mt-3 text-xs font-semibold text-[#1889B6]">{row.nextAction}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function buildTrafficOperationsRows(
  analytics: SiteAnalyticsDashboard,
  activeMetric: TrafficMetric,
  activeRange: TrafficRange,
  trendRows: TrendDisplayRow[],
  comparison?: AnalyticsComparisonMetric,
): TrafficLedgerRow[] {
  const actionTotal = metricActions(activeMetric)
  const quietLandingPage = analytics.landingPages.find((row) => row.value >= 20 && (row.secondary ?? 0) === 0)
  const entryStep = analytics.behaviorSteps.find((step) => step.step === 1)
  const secondStep = analytics.behaviorSteps.find((step) => step.step === 2)
  const sourceTotal = analytics.sourceTypes.reduce((sum, row) => sum + row.value, 0)
  const otherSource = analytics.sourceTypes.find((row) => row.key === 'other')?.value ?? 0
  const otherShare = sourceTotal > 0 ? otherSource / sourceTotal : 0
  const topPage = analytics.topPages[0]
  const topReferrer = analytics.topReferrers[0]
  const topSource = analytics.sourceTypes[0]
  const latestTrend = trendRows[trendRows.length - 1]
  const previousTrend = trendRows[trendRows.length - 2]
  const trendDelta = latestTrend && previousTrend ? latestTrend.pageViews - previousTrend.pageViews : 0
  const trendTone: TrafficLedgerTone =
    comparison && comparison.pageViews.delta < 0
      ? 'watch'
      : trendDelta > Math.max(30, (previousTrend?.pageViews ?? 0) * 1.5)
        ? 'review'
        : 'ready'
  const behaviorTone: TrafficLedgerTone =
    (entryStep?.visits ?? 0) >= 20 && (secondStep?.retainedRate ?? 0) < 0.2
      ? 'review'
      : (entryStep?.visits ?? 0) > 0
        ? 'ready'
        : 'watch'
  const sourceTone: TrafficLedgerTone =
    sourceTotal === 0 && actionTotal > 0
      ? 'review'
      : otherShare > 0.5
        ? 'review'
        : otherShare > 0.3
          ? 'watch'
          : 'ready'
  const conversionTone: TrafficLedgerTone =
    activeMetric.pageViews >= 100 && activeMetric.leads === 0
      ? 'blocker'
      : activeMetric.pageViews >= 100 && activeMetric.conversionRate < 0.005
        ? 'review'
        : activeMetric.pageViews > 0
          ? 'ready'
          : 'watch'

  return [
    {
      key: 'traffic-sample',
      stage: '访问样本',
      priority: activeMetric.pageViews > 0 ? '正常' : '观察',
      item: `${rangeLabel(activeRange)}访问基础`,
      value: `${formatNumber(activeMetric.pageViews)} PV / ${formatNumber(activeMetric.visitors)} UV`,
      evidence: `已排除测试 ${formatNumber(activeMetric.testEvents)} 事件 / ${formatNumber(activeMetric.testLeads)} 线索。`,
      nextAction: '看趋势',
      href: '#trend-analysis',
      tone: activeMetric.pageViews > 0 ? 'ready' : 'watch',
    },
    {
      key: 'trend-movement',
      stage: '趋势变化',
      priority: trendTone === 'review' ? '复核' : trendTone === 'watch' ? '观察' : '正常',
      item: comparison ? `${comparison.label} 对比 ${comparison.previousLabel}` : '趋势样本',
      value: comparison ? formatNumberDelta(comparison.pageViews) : latestTrend ? `${formatNumber(latestTrend.pageViews)} PV` : '暂无趋势',
      evidence: latestTrend
        ? `末点 ${latestTrend.label}：${formatNumber(latestTrend.pageViews)} PV，较上一点 ${trendDelta >= 0 ? '+' : ''}${formatNumber(trendDelta)}。`
        : '暂无趋势点，等待 site_events 样本。',
      nextAction: '看趋势表',
      href: '#trend-analysis',
      tone: trendTone,
    },
    {
      key: 'landing-action-gap',
      stage: '落地页',
      priority: quietLandingPage ? '复核' : '正常',
      item: quietLandingPage ? '高访问低动作页' : '落地页动作覆盖',
      value: quietLandingPage?.label ?? `${formatNumber(analytics.landingPages.length)} 个落地页`,
      evidence: quietLandingPage
        ? `${formatNumber(quietLandingPage.value)} 次访问，CTA / 联系 / 表单动作 ${formatNumber(quietLandingPage.secondary ?? 0)}。`
        : '当前 Top landing pages 未出现明显高访问 0 动作样本。',
      nextAction: '看落地页',
      href: '#landing-analysis',
      tone: quietLandingPage ? 'review' : 'ready',
    },
    {
      key: 'behavior-retention',
      stage: '行为路径',
      priority: behaviorTone === 'review' ? '复核' : behaviorTone === 'watch' ? '观察' : '正常',
      item: '入口到第二步留存',
      value: secondStep ? formatAnalyticsPercent(secondStep.retainedRate) : '暂无路径',
      evidence: entryStep
        ? `入口 ${formatNumber(entryStep.visits)} 次，第二步 ${formatNumber(secondStep?.visits ?? 0)} 次；只读匿名 session / visitor 聚合。`
        : '暂无足够 page_view 路径样本。',
      nextAction: '看行为路径',
      href: '#behavior-analysis',
      tone: behaviorTone,
    },
    {
      key: 'source-attribution',
      stage: '来源归因',
      priority: sourceTone === 'review' ? '复核' : sourceTone === 'watch' ? '观察' : '正常',
      item: topReferrer?.label ?? (topSource ? sourceTypeLabel(topSource.key) : '来源样本不足'),
      value: sourceTotal > 0 ? `${formatAnalyticsPercent(otherShare)} other` : '暂无来源动作',
      evidence:
        sourceTotal > 0
          ? `动作来源 ${formatNumber(sourceTotal)} 次，other ${formatNumber(otherSource)} 次。`
          : '暂无 CTA / 联系 / 表单来源事件。',
      nextAction: '看来源',
      href: '#behavior-analysis',
      tone: sourceTone,
    },
    {
      key: 'conversion-handoff',
      stage: '线索转化',
      priority: conversionTone === 'blocker' ? '阻塞' : conversionTone === 'review' ? '复核' : conversionTone === 'watch' ? '观察' : '正常',
      item: '访问到真实线索',
      value: `${formatNumber(activeMetric.leads)} 线索 / ${formatAnalyticsPercent(activeMetric.conversionRate)}`,
      evidence: `${formatNumber(activeMetric.pageViews)} PV，${formatNumber(actionTotal)} 个 CTA / 联系 / 表单动作。`,
      nextAction: '看转化页',
      href: '/admin/site/conversion',
      tone: conversionTone,
    },
    {
      key: 'analytics-boundary',
      stage: '数据边界',
      priority: analytics.available ? '正常' : '观察',
      item: '第一方事件口径',
      value: analytics.available ? 'site_events 可读' : '事件表未就绪',
      evidence: `Top page：${topPage?.label ?? '暂无'}；本页不读取 GA / Search Console / Vercel Analytics API。`,
      nextAction: '看接入状态',
      href: '/admin/site/seo',
      tone: analytics.available ? 'ready' : 'watch',
    },
  ]
}

function trafficLedgerBadgeClass(tone: TrafficLedgerTone) {
  if (tone === 'blocker') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'review') return 'bg-[#EAF6F8] text-[#1889B6]'
  if (tone === 'watch') return 'bg-[#FFF9EA] text-[#9A6A00]'
  return 'bg-emerald-50 text-emerald-700'
}

function TrafficDrilldownWorkbench({
  analytics,
  activeMetric,
  activeRange,
}: {
  analytics: SiteAnalyticsDashboard
  activeMetric: TrafficMetric
  activeRange: TrafficRange
}) {
  const topPage = analytics.topPages[0]
  const topReferrer = analytics.topReferrers[0]
  const topSource = analytics.sourceTypes[0]
  const quietLandingPage = analytics.landingPages.find((row) => row.value >= 20 && (row.secondary ?? 0) === 0)
  const topConversion = getTopConversionPath(analytics.conversionPaths)
  const activeActions = activeMetric.ctaClicks + activeMetric.contactRedirects + activeMetric.formSubmits
  const hasTrafficSample = activeMetric.pageViews > 0
  const rows = [
    {
      label: '页面访问',
      value: topPage?.label ?? '暂无访问页面',
      detail: topPage
        ? `${formatNumber(topPage.value)} PV / ${formatNumber(topPage.secondary ?? 0)} 名匿名访客`
        : `${rangeLabel(activeRange)}没有页面访问样本。`,
      href: '#behavior-analysis',
      tone: 'blue',
    },
    {
      label: '落地页低动作',
      value: quietLandingPage?.label ?? '暂无明显低动作页',
      detail: quietLandingPage
        ? `${formatNumber(quietLandingPage.value)} 次访问，但动作数为 ${formatNumber(quietLandingPage.secondary ?? 0)}。`
        : '当前落地页没有明显“访问高但无动作”的样本。',
      href: '#landing-analysis',
      tone: quietLandingPage ? 'orange' : 'green',
    },
    {
      label: '来源渠道',
      value: topReferrer?.label ?? topSource?.label ?? '暂无来源数据',
      detail: topReferrer
        ? `${formatNumber(topReferrer.value)} 次 referrer 样本。`
        : topSource
          ? `${formatNumber(topSource.value)} 次 source type 样本。`
          : '暂无 referrer 或 source type 样本。',
      href: '#behavior-analysis',
      tone: topReferrer || topSource ? 'blue' : 'gray',
    },
    {
      label: '转化路径',
      value: topConversion?.label ?? '暂无转化路径样本',
      detail: topConversion
        ? `访问 ${formatNumber(topConversion.metric.views)} / 动作 ${formatNumber(topConversion.metric.ctaClicks)} / 线索 ${formatNumber(topConversion.metric.leads)}。`
        : '暂无路径级访问、动作或线索样本。',
      href: '/admin/site/conversion',
      tone: topConversion ? 'green' : 'gray',
    },
  ] satisfies Array<{
    label: string
    value: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1E2C31]">下钻诊断工作台</h2>
            <p className="mt-1 text-xs text-[#61767D]">
              先选时间口径，再按页面、落地页、来源和转化路径下钻；所有入口只读跳转。
            </p>
          </div>
          <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
            {rangeLabel(activeRange)}口径
          </span>
        </div>
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0">
          {rows.map((row) => (
            <TrafficDrilldownRow key={row.label} row={row} />
          ))}
        </div>
      </div>

      <aside className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">当前口径快照</h2>
          <p className="mt-1 text-xs text-[#61767D]">用于判断是否值得继续下钻，不替代完整审计日志。</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5">
          <SnapshotMetric label="PV" value={activeMetric.pageViews} detail="页面访问" />
          <SnapshotMetric label="UV" value={activeMetric.visitors} detail="匿名访客" />
          <SnapshotMetric label="动作" value={activeActions} detail="CTA/联系/表单" />
          <SnapshotMetric label="线索" value={activeMetric.leads} detail="真实 leads" />
        </div>
        <div className="border-t border-[#E6EEEE] px-5 py-4">
          <div className="space-y-2 text-xs">
            <StatusLine ok={analytics.available} label={analytics.available ? '第一方事件表可读取' : '第一方事件表未就绪'} />
            <StatusLine ok={hasTrafficSample} label={hasTrafficSample ? '当前口径已有访问样本' : '当前口径暂无访问样本'} />
            <StatusLine ok label={`已排除测试 ${formatNumber(activeMetric.testEvents)} 事件 / ${formatNumber(activeMetric.testLeads)} 线索`} />
          </div>
        </div>
      </aside>
    </section>
  )
}

function TrafficDrilldownRow({
  row,
}: {
  row: {
    label: string
    value: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }
}) {
  const toneClass =
    row.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : row.tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : row.tone === 'gray'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link href={row.href} className="block p-5 transition hover:bg-[#F7FAFA]">
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${toneClass}`}>{row.label}</span>
      <span className="mt-3 block truncate text-xl font-black text-[#1E2C31]">{row.value}</span>
      <span className="mt-2 block text-xs leading-5 text-[#61767D]">{row.detail}</span>
    </Link>
  )
}

function TrafficRouteMatrix({
  analytics,
  activeMetric,
}: {
  analytics: SiteAnalyticsDashboard
  activeMetric: TrafficMetric
}) {
  const topPage = analytics.topPages[0]
  const topLandingPage = analytics.landingPages[0]
  const quietLandingPage = analytics.landingPages.find((row) => row.value >= 20 && (row.secondary ?? 0) === 0)
  const topReferrer = analytics.topReferrers[0]
  const topSource = analytics.sourceTypes[0]
  const topConversion = getTopConversionPath(analytics.conversionPaths)
  const actionTotal = activeMetric.ctaClicks + activeMetric.contactRedirects + activeMetric.formSubmits
  const sourceTotal = analytics.sourceTypes.reduce((sum, row) => sum + row.value, 0)
  const otherSource = analytics.sourceTypes.find((row) => row.key === 'other')?.value ?? 0
  const otherShare = sourceTotal > 0 ? otherSource / sourceTotal : 0
  const rows = [
    {
      stage: '入口页',
      signal: topPage ? topPage.label : '暂无页面访问',
      metric: topPage ? `${formatNumber(topPage.value)} PV / ${formatNumber(topPage.secondary ?? 0)} UV` : '0',
      judgement: topPage ? '可继续看访问路径' : '等待事件样本',
      action: 'Top Pages',
      href: '#behavior-analysis',
      tone: topPage ? 'blue' : 'gray',
    },
    {
      stage: '落地页',
      signal: quietLandingPage ? quietLandingPage.label : topLandingPage?.label ?? '暂无落地页',
      metric: quietLandingPage
        ? `${formatNumber(quietLandingPage.value)} 访问 / 0 动作`
        : topLandingPage
          ? `${formatNumber(topLandingPage.value)} 访问 / ${formatNumber(topLandingPage.secondary ?? 0)} 动作`
          : '0',
      judgement: quietLandingPage ? '高访问低动作' : topLandingPage ? '可观察' : '等待样本',
      action: '落地页分析',
      href: '#landing-analysis',
      tone: quietLandingPage ? 'orange' : topLandingPage ? 'green' : 'gray',
    },
    {
      stage: '来源',
      signal: topReferrer?.label ?? (topSource ? sourceTypeLabel(topSource.key) : '暂无来源'),
      metric: topReferrer
        ? `${formatNumber(topReferrer.value)} referrer`
        : topSource
          ? `${formatNumber(topSource.value)} source`
          : '0',
      judgement: otherShare > 0.5 ? 'other 占比偏高' : topReferrer || topSource ? '来源可读' : '等待样本',
      action: '来源与入口',
      href: '#behavior-analysis',
      tone: otherShare > 0.5 ? 'orange' : topReferrer || topSource ? 'blue' : 'gray',
    },
    {
      stage: '动作',
      signal: actionTotal > 0 ? 'CTA / 联系 / 表单' : '暂无转化动作',
      metric: `CTA ${formatNumber(activeMetric.ctaClicks)} / 联系 ${formatNumber(activeMetric.contactRedirects)} / 表单 ${formatNumber(activeMetric.formSubmits)}`,
      judgement: actionTotal > 0 ? '有动作样本' : activeMetric.pageViews > 0 ? '访问未触发动作' : '等待访问',
      action: '行为分析',
      href: '#behavior-analysis',
      tone: actionTotal > 0 ? 'green' : activeMetric.pageViews > 0 ? 'orange' : 'gray',
    },
    {
      stage: '线索',
      signal: topConversion?.label ?? '暂无路径线索',
      metric: `${formatNumber(activeMetric.leads)} 真实线索 / ${formatAnalyticsPercent(activeMetric.conversionRate)}`,
      judgement: activeMetric.leads > 0 ? '已有线索承接' : activeMetric.pageViews > 0 ? '访问未转化为线索' : '等待访问',
      action: '转化路径',
      href: '/admin/site/conversion',
      tone: activeMetric.leads > 0 ? 'green' : activeMetric.pageViews > 0 ? 'orange' : 'gray',
    },
  ] satisfies Array<{
    stage: string
    signal: string
    metric: string
    judgement: string
    action: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">入口 / 来源 / 动作 / 线索矩阵</h2>
          <p className="mt-1 text-xs text-[#61767D]">把访问统计页拆成可处理的运营链路，避免只看单个数字。</p>
        </div>
        <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
          当前口径动作 {formatNumber(actionTotal)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
              <th className="px-5 py-3 text-left font-medium">链路阶段</th>
              <th className="px-4 py-3 text-left font-medium">当前信号</th>
              <th className="px-4 py-3 text-left font-medium">指标</th>
              <th className="px-4 py-3 text-left font-medium">判断</th>
              <th className="px-5 py-3 text-right font-medium">下钻</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.stage} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-5 py-3 font-semibold text-[#1E2C31]">{row.stage}</td>
                <td className="max-w-[280px] px-4 py-3">
                  <div className="truncate font-medium text-[#1E2C31]" title={row.signal}>
                    {row.signal}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#61767D]">{row.metric}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(row.tone)}`}>
                    {row.judgement}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={row.href} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                    {row.action}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TrafficSourceStagePanel({ analytics }: { analytics: SiteAnalyticsDashboard }) {
  const rows = analytics.sourceStageActions
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  const topRow = rows[0]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">B207 公开站来源阶段复盘</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            按近 30 天产品与案例 CTA、联系跳转和表单成功事件聚合来源阶段；Contact 承接型来源按原入口归类，不写入业务数据。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
            来源阶段动作 {formatNumber(total)}
          </span>
          <Link href="/admin/site/conversion" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
            查看转化台账
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-5 text-sm text-[#61767D]">暂无近 30 天公开站来源阶段事件。</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
                <th className="px-5 py-3 text-left font-medium">来源阶段</th>
                <th className="px-4 py-3 text-left font-medium">归因口径</th>
                <th className="px-4 py-3 text-right font-medium">动作数</th>
                <th className="px-4 py-3 text-right font-medium">阶段占比</th>
                <th className="px-4 py-3 text-left font-medium">运营判断</th>
                <th className="px-4 py-3 text-right font-medium">线索下钻</th>
                <th className="px-5 py-3 text-right font-medium">转化台账</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const share = total > 0 ? row.value / total : 0
                const isTop = row.key === topRow?.key
                const route = sourceStageTrafficRoute(row.key)
                return (
                  <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#1E2C31]">{row.label}</div>
                      <div className="mt-1 font-mono text-[11px] text-[#8A9EA4]">{row.key}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(route.tone)}`}>
                        {route.label}
                      </span>
                      <div className="mt-1 text-[11px] leading-5 text-[#61767D]">{route.detail}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#1889B6]">{formatNumber(row.value)}</td>
                    <td className="px-4 py-3 text-right text-[#61767D]">{formatAnalyticsPercent(share)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(isTop ? 'blue' : 'green')}`}>
                        {isTop ? '优先复盘' : '保持观察'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={row.href} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                        查看阶段线索
                      </Link>
                      <div className="mt-1 text-[11px] text-[#8A9EA4]">已带 source_stage</div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href="/admin/site/conversion" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                        看承接矩阵
                      </Link>
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

function sourceStageTrafficRoute(key: string): { label: string; detail: string; tone: 'blue' | 'green' | 'orange' | 'gray' } {
  if (key.startsWith('case:')) {
    return {
      label: '案例入口',
      detail: '案例详情与 Contact 承接来源合并看案例询盘效率。',
      tone: 'green',
    }
  }

  if (key.startsWith('product:')) {
    return {
      label: '产品入口',
      detail: '产品详情与 Contact 承接来源合并看产品询盘效率。',
      tone: 'blue',
    }
  }

  return {
    label: '其他入口',
    detail: '保留来源阶段，等待更多样本后再拆分。',
    tone: 'gray',
  }
}

function ProductTrafficPanel({ analytics }: { analytics: SiteAnalyticsDashboard }) {
  const metric = analytics.conversionPaths.products ?? {
    views: 0,
    ctaClicks: 0,
    formSubmits: 0,
    leads: 0,
    conversionRate: 0,
  }
  const hasPathActions = metric.ctaClicks > 0
  const rows = [
    {
      label: '产品访问',
      value: `${formatNumber(metric.views)} PV`,
      detail: '近 30 天 /products 与产品详情访问',
      href: '#behavior-analysis',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
    {
      label: '路径动作',
      value: formatNumber(metric.ctaClicks),
      detail: `CTA / 联系 / 表单动作合计，表单成功 ${formatNumber(metric.formSubmits)}。`,
      href: '#behavior-analysis',
      tone: hasPathActions ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      label: '真实线索',
      value: formatNumber(metric.leads),
      detail: `产品路径访问转化率 ${formatAnalyticsPercent(metric.conversionRate)}。`,
      href: '/admin/status/leads#product-lead-path-bridge',
      tone: metric.leads > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      label: 'SEO 回修',
      value: 'B230',
      detail: '从产品 SEO 待补回看路径、表单和线索承接。',
      href: '/admin/site/seo#seo-conversion-closure',
      tone: 'blue',
    },
  ] satisfies Array<{
    label: string
    value: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  const decision =
    metric.views > 0 && metric.leads === 0
      ? '产品已有访问但暂无真实线索，优先复核产品详情 CTA、表单阶段和 SEO 摘要质量。'
      : metric.leads > 0
        ? '产品路径已有线索样本，继续观察来源阶段、表单和 SEO 修复后的转化质量。'
        : '产品路径暂无访问样本，先等待事件或从前台产品入口复验。'
  const closureLinks = [
    {
      label: 'B231 产品复盘',
      detail: '回到转化中心产品路径复盘',
      href: '/admin/site/conversion',
      tone: 'blue' as const,
    },
    {
      label: 'B229 线索承接',
      detail: '看产品路径与线索承接',
      href: '/admin/status/leads#product-lead-path-bridge',
      tone: metric.leads > 0 ? 'green' as const : metric.views > 0 ? 'orange' as const : 'gray' as const,
    },
    {
      label: '产品线索队列',
      detail: '回到 B228 source_type=product',
      href: '/admin/customers/leads?source_type=product',
      tone: metric.leads > 0 ? 'green' as const : 'blue' as const,
    },
    {
      label: '产品 SEO 待补',
      detail: '回到 B230 SEO 修复闭环',
      href: '/admin/content/products/list?view=incomplete&issue=seo',
      tone: metric.views > 0 && metric.leads === 0 ? 'orange' as const : 'blue' as const,
    },
  ] satisfies Array<{
    label: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  return (
    <section id="product-conversion-path" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">产品路径分析</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            把产品访问、路径动作、表单成功、真实线索和 SEO 修复入口放在同屏；本区只读，不写线索、不保存产品内容。
          </p>
        </div>
        <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
          30 天产品路径
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {rows.map((row) => (
          <Link key={row.label} href={row.href} className="block min-w-0 p-5 transition hover:bg-[#F7FAFA]">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(row.tone)}`}>
              {row.label}
            </span>
            <span className="mt-3 block truncate text-2xl font-black text-[#1E2C31]" title={row.value}>
              {row.value}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{row.detail}</span>
          </Link>
        ))}
      </div>

      <div className="border-t border-[#E6EEEE] px-5 py-4 text-sm font-semibold text-[#1E2C31]">
        运营判断：{decision}
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
        {closureLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(item.tone)}`}>
              {item.label}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
            <span className="mt-2 inline-flex text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
              进入闭环
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function CaseInquiryTrafficPanel({
  analytics,
  health,
}: {
  analytics: SiteAnalyticsDashboard
  health: CaseInquiryHealth
}) {
  const metric = analytics.conversionPaths.cases ?? {
    views: 0,
    ctaClicks: 0,
    formSubmits: 0,
    leads: 0,
    conversionRate: 0,
  }
  const readyRate = health.published > 0 ? health.ready / health.published : 0
  const hasPathActions = metric.ctaClicks > 0
  const rows = [
    {
      label: '案例访问',
      value: `${formatNumber(metric.views)} PV`,
      detail: '近 30 天 /cases 与案例详情访问',
      href: '#behavior-analysis',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
    {
      label: '路径动作',
      value: formatNumber(metric.ctaClicks),
      detail: `CTA / 联系 / 表单动作合计，表单成功 ${formatNumber(metric.formSubmits)}。`,
      href: '#behavior-analysis',
      tone: hasPathActions ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      label: '真实线索',
      value: formatNumber(metric.leads),
      detail: `案例路径访问转化率 ${formatAnalyticsPercent(metric.conversionRate)}。`,
      href: '/admin/status/leads#case-lead-path-bridge',
      tone: metric.leads > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      label: '内容承接',
      value: `${formatNumber(health.weak)} 弱`,
      detail: `已发布 ${formatNumber(health.published)}，可承接率 ${formatAnalyticsPercent(readyRate)}。`,
      href: '/admin/content/projects/list?view=case-conversion-weak',
      tone: health.weak > 0 ? 'orange' : 'green',
    },
  ] satisfies Array<{
    label: string
    value: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  const decision =
    health.weak > 0 && metric.views > 0
      ? '优先补齐发布转化弱案例，再复盘案例详情 CTA 和表单成功。'
      : metric.views > 0 && metric.leads === 0
        ? '案例已有访问但暂无真实线索，优先复核详情页 CTA、表单和内容证明链。'
        : metric.leads > 0
          ? '案例路径已有线索样本，继续观察来源、表单和内容承接质量。'
          : '案例路径暂无访问样本，先等待事件或从前台入口复验。'
  const closureLinks = [
    {
      label: '线索承接面板',
      detail: '看 B223 案例路径与线索承接',
      href: '/admin/status/leads#case-lead-path-bridge',
      tone: metric.leads > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      label: '案例线索队列',
      detail: '回到 B222 source_type=case',
      href: '/admin/customers/leads?source_type=case',
      tone: metric.leads > 0 ? 'green' : 'blue',
    },
    {
      label: '案例表单线索',
      detail: '只看 case:inquiry_form 阶段',
      href: '/admin/customers/leads?source_type=case&source_stage=case%3Ainquiry_form',
      tone: metric.formSubmits > 0 ? 'green' : 'gray',
    },
    {
      label: '发布转化弱',
      detail: `当前弱案例 ${formatNumber(health.weak)}`,
      href: '/admin/content/projects/list?view=case-conversion-weak',
      tone: health.weak > 0 ? 'orange' : 'green',
    },
  ] satisfies Array<{
    label: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  return (
    <section id="case-inquiry-path" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">案例询盘路径分析</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            把案例访问、路径动作、表单成功、真实线索和弱案例队列放在同屏；本区只读，不写线索、不发布内容。
          </p>
        </div>
        <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
          30 天案例路径
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {rows.map((row) => (
          <Link key={row.label} href={row.href} className="block min-w-0 p-5 transition hover:bg-[#F7FAFA]">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(row.tone)}`}>
              {row.label}
            </span>
            <span className="mt-3 block truncate text-2xl font-black text-[#1E2C31]" title={row.value}>
              {row.value}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{row.detail}</span>
          </Link>
        ))}
      </div>

      <div className="border-t border-[#E6EEEE] px-5 py-4 text-sm font-semibold text-[#1E2C31]">
        运营判断：{decision}
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
        {closureLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(item.tone)}`}>
              {item.label}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
            <span className="mt-2 inline-flex text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
              进入闭环
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function trafficMatrixToneClass(tone: 'blue' | 'green' | 'orange' | 'gray') {
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'blue') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-[#F0F2F2] text-[#61767D]'
}

function SnapshotMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] p-3">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#1E2C31]">{formatNumber(value)}</p>
      <p className="mt-1 text-[11px] text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-[#E36F2C]'}`} />
      <span className="leading-5 text-[#61767D]">{label}</span>
    </div>
  )
}

function getTopConversionPath(conversionPaths: Record<string, AnalyticsConversionMetric>) {
  const rows = CONVERSION_PATHS.map((item) => ({
    key: item.key,
    label: item.area,
    metric: conversionPaths[item.key] ?? {
      views: 0,
      ctaClicks: 0,
      formSubmits: 0,
      leads: 0,
      conversionRate: 0,
    },
  })).sort((a, b) => conversionMetricScore(b.metric) - conversionMetricScore(a.metric))

  return rows.find((row) => conversionMetricScore(row.metric) > 0)
}

function conversionMetricScore(metric: AnalyticsConversionMetric) {
  return metric.views + metric.ctaClicks * 3 + metric.formSubmits * 5 + metric.leads * 10
}

function ComparisonCell({
  label,
  metric,
  kind,
  previousLabel,
}: {
  label: string
  metric: AnalyticsDeltaMetric
  kind: 'number' | 'rate'
  previousLabel: string
}) {
  const tone = comparisonTone(metric)
  const currentValue = kind === 'rate' ? formatAnalyticsPercent(metric.current) : formatNumber(metric.current)
  const previousValue = kind === 'rate' ? formatAnalyticsPercent(metric.previous) : formatNumber(metric.previous)
  const deltaValue = kind === 'rate' ? formatRateDelta(metric) : formatNumberDelta(metric)

  return (
    <div className="min-w-0 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#61767D]">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.badge}`}>{tone.label}</span>
      </div>
      <div className="mt-3 text-2xl font-black text-[#1E2C31]">{currentValue}</div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-[#8A9EA4]">{previousLabel}</span>
        <span className="font-semibold text-[#61767D]">{previousValue}</span>
      </div>
      <div className={`mt-3 text-sm font-bold ${tone.text}`}>{deltaValue}</div>
    </div>
  )
}

function TrendWorkspace({ rows }: { rows: TrendDisplayRow[] }) {
  if (rows.length === 0) {
    return <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">暂无可用趋势数据。</div>
  }

  const maxViews = Math.max(1, ...rows.map((row) => row.pageViews))
  const displayRows = rows.slice(-30)

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

function BehaviorPathBoard({ steps }: { steps: AnalyticsBehaviorStep[] }) {
  const hasData = steps.some((step) => step.nodes.length > 0)

  if (!hasData) {
    return (
      <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">
        暂无足够的访问路径数据。
      </div>
    )
  }

  const visibleSteps = steps.slice(0, 5)
  const nodeCount = visibleSteps.reduce((sum, step) => sum + step.nodes.length, 0)
  const activeStepCount = visibleSteps.filter((step) => step.nodes.length > 0).length
  const entryVisits = visibleSteps[0]?.visits ?? 0
  const finalStep = [...visibleSteps].reverse().find((step) => step.visits > 0) ?? visibleSteps[0]
  const maxNodeValue = Math.max(1, ...visibleSteps.flatMap((step) => step.nodes.map((node) => node.value)))

  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1E2C31]">访问路径流</h3>
          <p className="mt-1 text-xs text-[#61767D]">按匿名 session / visitor 的前 5 次页面访问聚合，显示路径节点、节点占比和跨步留存。</p>
        </div>
        <span className="text-xs text-[#8A9EA4]">不是表单个人信息，不保存 IP。</span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-4 md:divide-x md:divide-y-0">
        <PathSummaryCell label="入口访问" value={`${formatNumber(entryVisits)} 次`} detail={visibleSteps[0]?.label ?? '入口页面'} />
        <PathSummaryCell label="有效层级" value={`${formatNumber(activeStepCount)} / ${formatNumber(visibleSteps.length)}`} detail="有节点的路径步骤" />
        <PathSummaryCell label="路径节点" value={`${formatNumber(nodeCount)} 个`} detail="每步最多显示 6 个节点" />
        <PathSummaryCell
          label="末级留存"
          value={formatAnalyticsPercent(finalStep?.retainedRate ?? 0)}
          detail={finalStep ? `${finalStep.label} / ${formatNumber(finalStep.visits)} 次` : '暂无末级访问'}
        />
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[1120px] grid-cols-5 gap-3 p-4">
          {visibleSteps.map((step, index) => (
            <div key={step.step} className="relative min-w-0">
              {index > 0 ? <span className="absolute -left-3 top-16 h-px w-3 bg-[#C9DCDF]" /> : null}
              <div className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD]">
                <div className="border-b border-[#E6EEEE] bg-white px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#1E2C31]">{step.label}</h4>
                    <span className="rounded bg-[#E8F6FA] px-2 py-0.5 text-[11px] font-bold text-[#1889B6]">
                      {formatAnalyticsPercent(step.retainedRate)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8A9EA4]">{formatNumber(step.visits)} 次访问</p>
                </div>
                <div className="space-y-2 p-3">
                  {step.nodes.length === 0 ? (
                    <div className="rounded border border-dashed border-[#D8E7E8] bg-white px-3 py-4 text-xs text-[#8A9EA4]">暂无路径节点</div>
                  ) : (
                    step.nodes.slice(0, 6).map((node) => {
                      const stepShare = step.visits > 0 ? node.value / step.visits : 0
                      const width = Math.max(8, Math.round((node.value / maxNodeValue) * 100))

                      return (
                        <div key={node.key} className="rounded border border-[#E6EEEE] bg-white p-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="min-w-0 truncate text-xs font-semibold text-[#1E2C31]" title={node.label}>
                              {node.label}
                            </span>
                            <span className="shrink-0 text-xs font-bold text-[#1889B6]">{formatNumber(node.value)}</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6EEEE]">
                            <span className="block h-full rounded-full bg-[#1889B6]" style={{ width: `${width}%` }} />
                          </div>
                          <div className="mt-1 text-[11px] text-[#8A9EA4]">{formatAnalyticsPercent(stepShare)} / 本步</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PathSummaryCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="text-[11px] font-semibold text-[#8A9EA4]">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-[#1E2C31]" title={value}>{value}</div>
      <div className="mt-1 truncate text-xs text-[#61767D]" title={detail}>{detail}</div>
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

function metricActions(metric: Pick<TrafficAggregateMetric, 'ctaClicks' | 'contactRedirects' | 'formSubmits'>) {
  return metric.ctaClicks + metric.contactRedirects + metric.formSubmits
}

function buildTrendRows(
  range: TrafficRange,
  hourlyRows: AnalyticsHourlyTrendRow[],
  yesterdayHourlyRows: AnalyticsHourlyTrendRow[],
  dailyRows: AnalyticsTrendRow[],
): TrendDisplayRow[] {
  if (range === 'today' || range === 'yesterday') {
    const rows = range === 'today' ? hourlyRows : yesterdayHourlyRows
    return rows.map((row) => ({
      key: row.hour,
      label: row.hour,
      pageViews: row.pageViews,
      visitors: row.visitors,
      actions: row.actions,
      formSubmits: row.formSubmits,
      leads: 0,
    }))
  }

  const days = range === '7' ? 7 : 30
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

function formatNumberDelta(metric: AnalyticsDeltaMetric): string {
  const signedDelta = `${metric.delta > 0 ? '+' : ''}${formatNumber(metric.delta)}`
  if (metric.rate === null) return `${signedDelta} / 新增`
  return `${signedDelta} / ${metric.rate > 0 ? '+' : ''}${(metric.rate * 100).toFixed(1)}%`
}

function formatRateDelta(metric: AnalyticsDeltaMetric): string {
  const percentagePoints = metric.delta * 100
  return `${percentagePoints > 0 ? '+' : ''}${percentagePoints.toFixed(2)}pp`
}

function comparisonTone(metric: AnalyticsDeltaMetric) {
  if (metric.delta > 0) {
    return {
      label: '上升',
      text: 'text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700',
    }
  }
  if (metric.delta < 0) {
    return {
      label: '下降',
      text: 'text-[#E36F2C]',
      badge: 'bg-[#FFF2E7] text-[#E36F2C]',
    }
  }
  return {
    label: '持平',
    text: 'text-[#61767D]',
    badge: 'bg-[#F0F7F8] text-[#61767D]',
  }
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
