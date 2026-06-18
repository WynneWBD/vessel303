import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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

type TrafficToLeadExceptionRow = {
  key: 'product' | 'case' | 'news'
  label: string
  routeLabel: string
  metric: AnalyticsConversionMetric
  sourceActions: number
  seoMissing: number
  contentIssues: number
  priority: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  diagnosis: string
  leadHref: string
  pathHref: string
  workdeskHref: string
  conversionHref: string
  contentHref: string
}

type CasePathBackflowCard = {
  key: string
  label: string
  value: string
  detail: string
  href: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
}

type CaseLoopTrafficCard = CasePathBackflowCard

type ProductPathQualityCard = CasePathBackflowCard

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

        <TrafficToLeadExceptionDesk analytics={analytics} overview={overview} />

        <ProductPublishPathReviewHandoffDesk analytics={analytics} overview={overview} />

        <ProductPathQualityReviewDesk analytics={analytics} overview={overview} />

        <CasePathLeadBackflowDesk analytics={analytics} health={caseInquiryHealth} />

        <CaseLoopTrafficQualityReviewDesk analytics={analytics} health={caseInquiryHealth} />

        <TrafficDrilldownWorkbench
          analytics={analytics}
          activeMetric={activeMetric}
          activeRange={activeRange}
        />

        <TrafficRouteMatrix analytics={analytics} activeMetric={activeMetric} />

        <TrafficSourceStagePanel analytics={analytics} />

        <NewsTrafficPanel analytics={analytics} />

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

function TrafficToLeadExceptionDesk({
  analytics,
  overview,
}: {
  analytics: SiteAnalyticsDashboard
  overview: Awaited<ReturnType<typeof loadStatusOverview>>
}) {
  const rows = buildTrafficToLeadExceptionRows(analytics, overview)
  const totalViews = rows.reduce((sum, row) => sum + row.metric.views, 0)
  const totalActions = rows.reduce((sum, row) => sum + row.metric.ctaClicks, 0)
  const totalLeads = rows.reduce((sum, row) => sum + row.metric.leads, 0)
  const exceptionCount = rows.filter((row) => row.tone === 'orange').length

  return (
    <section id="traffic-to-lead-exception-desk" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E36F2C]">B293 Traffic To Lead Triage</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">流量到线索异常分诊台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把 B292 来源线索质量处理台、B291 转化复盘和产品 / 案例 / 新闻路径访问动作放到同一屏；先找有访问无线索、有动作无线索和 SEO/内容承接缺口。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TrafficTriageAction href="/admin/status/leads#source-lead-quality-workdesk" label="B292 线索处理" />
          <TrafficTriageAction href="/admin/site/conversion#seo-to-lead-conversion-review" label="B291 转化复盘" />
          <TrafficTriageAction href="/admin/site/seo#seo-operations-command-bridge" label="SEO 操作台" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
        <TrafficTriageStat label="三类路径访问" value={totalViews} detail="产品 / 案例 / 新闻" />
        <TrafficTriageStat label="路径动作" value={totalActions} detail="CTA + 联系 + 表单" />
        <TrafficTriageStat label="路径线索" value={totalLeads} detail="30 天真实线索" />
        <TrafficTriageStat label="异常路径" value={exceptionCount} detail="需分诊处理" warn={exceptionCount > 0} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] xl:grid-cols-3 xl:divide-x xl:divide-y-0">
        {rows.map((row) => (
          <TrafficToLeadExceptionCard key={row.key} row={row} />
        ))}
      </div>
    </section>
  )
}

function TrafficToLeadExceptionCard({ row }: { row: TrafficToLeadExceptionRow }) {
  const openQuality = row.seoMissing + row.contentIssues

  return (
    <div className="flex min-h-80 flex-col justify-between px-5 py-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1E2C31]">{row.label}</p>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">{row.routeLabel}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${trafficMatrixToneClass(row.tone)}`}>
            {row.priority}
          </span>
        </div>

        <p className="mt-4 min-h-12 text-xs leading-5 text-[#61767D]">{row.diagnosis}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <TrafficTriageMini label="访问" value={row.metric.views} warn={row.metric.views > 0 && row.metric.leads === 0} />
          <TrafficTriageMini label="动作" value={row.metric.ctaClicks} warn={row.metric.ctaClicks > 0 && row.metric.leads === 0} />
          <TrafficTriageMini label="线索" value={row.metric.leads} />
          <TrafficTriageMini label="SEO/内容" value={openQuality} warn={openQuality > 0} />
        </div>

        <div className="mt-4 rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 text-xs leading-5 text-[#61767D]">
          <span className="font-semibold text-[#1E2C31]">source 动作 {formatNumber(row.sourceActions)}</span>
          <span className="mx-1 text-[#C9D7DA]">/</span>
          <span>转化 {formatAnalyticsPercent(row.metric.conversionRate)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <TrafficTriageAction href={row.workdeskHref} label="线索处理" primary={row.tone === 'orange'} compact />
        <TrafficTriageAction href={row.conversionHref} label="转化复盘" compact />
        <TrafficTriageAction href={row.pathHref} label="路径分析" compact />
        <TrafficTriageAction href={row.leadHref} label="线索队列" compact />
        <TrafficTriageAction href={row.contentHref} label="内容/SEO" primary={openQuality > 0} compact />
      </div>
    </div>
  )
}

function TrafficTriageStat({
  label,
  value,
  detail,
  warn = false,
}: {
  label: string
  value: number
  detail: string
  warn?: boolean
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>{formatNumber(value)}</p>
      <p className="mt-1 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

function TrafficTriageMini({
  label,
  value,
  warn = false,
}: {
  label: string
  value: number
  warn?: boolean
}) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 text-lg font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>{formatNumber(value)}</p>
    </div>
  )
}

function TrafficTriageAction({
  href,
  label,
  primary = false,
  compact = false,
}: {
  href: string
  label: string
  primary?: boolean
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md border text-xs font-semibold transition ${compact ? 'min-h-9 px-2 py-1' : 'h-9 px-3'} ${primary ? 'border-[#E36F2C]/50 bg-[#FFF2E7] text-[#E36F2C] hover:border-[#E36F2C]' : 'border-[#D8E7E8] bg-white text-[#1889B6] hover:border-[#1889B6]'}`}
    >
      {label}
    </Link>
  )
}

function buildTrafficToLeadExceptionRows(
  analytics: SiteAnalyticsDashboard,
  overview: Awaited<ReturnType<typeof loadStatusOverview>>,
): TrafficToLeadExceptionRow[] {
  const emptyMetric: AnalyticsConversionMetric = {
    views: 0,
    ctaClicks: 0,
    formSubmits: 0,
    leads: 0,
    conversionRate: 0,
  }
  const sourceActionsFor = (key: TrafficToLeadExceptionRow['key']) =>
    analytics.sourceTypes.find((row) => row.key === key)?.value ?? 0
  const rows: Array<Omit<TrafficToLeadExceptionRow, 'priority' | 'tone' | 'diagnosis' | 'sourceActions'>> = [
    {
      key: 'product',
      label: '产品流量到产品线索',
      routeLabel: '/products 与产品详情',
      metric: analytics.conversionPaths.products ?? emptyMetric,
      seoMissing: overview.site.seo.productsMissing,
      contentIssues: overview.content.products.issues,
      leadHref: '/admin/customers/leads?source_type=product',
      pathHref: '#product-conversion-path',
      workdeskHref: '/admin/status/leads#source-lead-quality-workdesk',
      conversionHref: '/admin/site/conversion#seo-to-lead-conversion-review',
      contentHref: '/admin/content/products/list?view=incomplete&issue=seo',
    },
    {
      key: 'case',
      label: '案例流量到案例询盘',
      routeLabel: '/cases 与案例详情',
      metric: analytics.conversionPaths.cases ?? emptyMetric,
      seoMissing: overview.site.seo.projectsMissing,
      contentIssues: overview.content.projects.issues,
      leadHref: '/admin/customers/leads?source_type=case',
      pathHref: '#case-inquiry-path',
      workdeskHref: '/admin/status/leads#source-lead-quality-workdesk',
      conversionHref: '/admin/site/conversion#seo-to-lead-conversion-review',
      contentHref: '/admin/content/projects/list?view=case-conversion-weak',
    },
    {
      key: 'news',
      label: '新闻流量到新闻来源',
      routeLabel: '/news 与新闻详情',
      metric: analytics.conversionPaths.news ?? emptyMetric,
      seoMissing: overview.site.seo.newsMissing,
      contentIssues: overview.content.news.issues,
      leadHref: '/admin/customers/leads?source_type=news',
      pathHref: '#news-source-handoff',
      workdeskHref: '/admin/status/leads#source-lead-quality-workdesk',
      conversionHref: '/admin/site/conversion#seo-to-lead-conversion-review',
      contentHref: '/admin/content/news#news-operations-hub',
    },
  ]

  return rows
    .map((row) => {
      const openQuality = row.seoMissing + row.contentIssues
      const hasActionGap = row.metric.ctaClicks > 0 && row.metric.leads === 0
      const hasTrafficGap = row.metric.views > 0 && row.metric.leads === 0
      const sourceActions = sourceActionsFor(row.key)
      const priority =
        hasActionGap
          ? 'P0 动作无线索'
          : hasTrafficGap
            ? 'P1 访问无线索'
            : openQuality > 0
              ? 'P1 承接待补'
              : row.metric.leads > 0
                ? 'P2 复盘质量'
                : 'P3 观察'
      const tone: TrafficToLeadExceptionRow['tone'] =
        hasActionGap || hasTrafficGap || openQuality > 0
          ? 'orange'
          : row.metric.leads > 0
            ? 'green'
            : row.metric.views > 0 || sourceActions > 0
              ? 'blue'
              : 'gray'
      const diagnosis =
        hasActionGap
          ? `近 30 天已有 ${formatNumber(row.metric.ctaClicks)} 次路径动作但暂无线索，先查表单成功、source 参数和线索归因。`
          : hasTrafficGap
            ? `近 30 天已有 ${formatNumber(row.metric.views)} 次访问但暂无线索，先查 CTA 位置、移动端入口和 B292 线索处理台。`
            : openQuality > 0
              ? `SEO/内容还有 ${formatNumber(openQuality)} 个待补项，先补公开承接，再观察路径动作和线索质量。`
              : row.metric.leads > 0
                ? `已有 ${formatNumber(row.metric.leads)} 条路径线索，回到 B291/B292 复盘来源质量和后续跟进。`
                : '当前访问、动作和线索样本不足，保持路径分析、转化复盘和线索队列可下钻。'

      return {
        ...row,
        sourceActions,
        priority,
        tone,
        diagnosis,
      }
    })
    .sort((a, b) => {
      const score = (row: TrafficToLeadExceptionRow) =>
        (row.metric.ctaClicks > 0 && row.metric.leads === 0 ? 1000 : 0) +
        (row.metric.views > 0 && row.metric.leads === 0 ? 500 : 0) +
        (row.seoMissing + row.contentIssues) * 20 +
        row.metric.views +
        row.metric.ctaClicks * 3

      return score(b) - score(a)
    })
}

function ProductPublishPathReviewHandoffDesk({
  analytics,
  overview,
}: {
  analytics: SiteAnalyticsDashboard
  overview: Awaited<ReturnType<typeof loadStatusOverview>>
}) {
  const metric = analytics.conversionPaths.products ?? {
    views: 0,
    ctaClicks: 0,
    formSubmits: 0,
    leads: 0,
    conversionRate: 0,
  }
  const productContent = overview.content.products
  const seoMissing = overview.site.seo.productsMissing
  const contentGaps = productContent.issues + seoMissing
  const pathActions = metric.ctaClicks + metric.formSubmits
  const productStageActions = analytics.sourceStageActions
    .filter((row) => row.key.startsWith('product:'))
    .reduce((sum, row) => sum + row.value, 0)
  const topProductPages = analytics.topPages
    .filter((row) => isProductPath(row.key) || isProductPath(row.label))
    .slice(0, 3)
  const publishedRate = productContent.total > 0 ? productContent.published / productContent.total : 0
  const needsPathReview = (metric.views > 0 && pathActions === 0) || (pathActions > 0 && metric.leads === 0)
  const handoffTone: ProductPathQualityCard['tone'] =
    needsPathReview || contentGaps > 0
      ? 'orange'
      : metric.leads > 0
        ? 'green'
        : metric.views > 0 || productStageActions > 0
          ? 'blue'
          : 'gray'
  const handoffDecision =
    pathActions > 0 && metric.leads === 0
      ? '产品路径已有动作但暂无线索，先回产品线索队列核对 source_type=product，再回 B341 队列检查已发布产品的内容缺口。'
      : metric.views > 0 && pathActions === 0
        ? '产品路径已有访问但动作不足，先复盘公开目录、详情 CTA 和发布后筛选承接，再回 B341 队列补齐发布缺口。'
        : contentGaps > 0
          ? '产品内容或 SEO 仍有缺口，先回 B341 队列和产品列表筛选缺项，再观察路径动作和线索质量。'
          : metric.leads > 0
            ? '产品路径已有线索样本，可以回到 B341 队列和转化复盘确认哪些发布内容带来有效询盘。'
            : '产品路径样本不足，先保留发布队列、公开目录和产品线索入口，等待真实访问样本。'
  const cards: ProductPathQualityCard[] = [
    {
      key: 'queue',
      label: 'B341 发布队列',
      value: `${formatNumber(productContent.published)} 已发布`,
      detail: `产品总数 ${formatNumber(productContent.total)}，发布占比 ${formatAnalyticsPercent(publishedRate)}。`,
      href: '/admin/content/products/list#product-create-publish-queue-handoff',
      tone: contentGaps > 0 ? 'orange' : 'green',
    },
    {
      key: 'views',
      label: '产品路径访问',
      value: `${formatNumber(metric.views)} PV`,
      detail: '近 30 天 /products 与产品详情页访问。',
      href: '#product-conversion-path',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
    {
      key: 'actions',
      label: '路径动作',
      value: formatNumber(pathActions),
      detail: `CTA ${formatNumber(metric.ctaClicks)}，表单成功 ${formatNumber(metric.formSubmits)}。`,
      href: '#behavior-analysis',
      tone: pathActions > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      key: 'leads',
      label: '真实线索',
      value: formatNumber(metric.leads),
      detail: `产品路径转化率 ${formatAnalyticsPercent(metric.conversionRate)}。`,
      href: '/admin/customers/leads?source_type=product',
      tone: metric.leads > 0 ? 'green' : pathActions > 0 ? 'orange' : 'gray',
    },
    {
      key: 'gaps',
      label: '内容/SEO缺口',
      value: formatNumber(contentGaps),
      detail: `内容缺口 ${formatNumber(productContent.issues)}，SEO 待补 ${formatNumber(seoMissing)}。`,
      href: '/admin/content/products/list?view=incomplete#product-create-publish-queue-handoff',
      tone: contentGaps > 0 ? 'orange' : 'green',
    },
    {
      key: 'public',
      label: '公开目录复盘',
      value: topProductPages[0] ? `${formatNumber(topProductPages[0].value)} PV` : '只读入口',
      detail: topProductPages[0] ? `最高产品页：${topProductPages[0].label}` : '公开产品目录与详情页复验入口。',
      href: '/products',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
  ]

  return (
    <section
      id="product-publish-path-review-handoff"
      data-product-publish-path-review-handoff="true"
      className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold text-[#E36F2C]">B342 Product Publish Path Review</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品发布后路径复盘承接</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            承接 B341 新建到发布队列，把已发布产品、公开 /products 访问、路径动作、真实线索和内容缺口放到同一块复盘面板；本区只读，不写 analytics、不改线索、不保存或发布产品。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TrafficTriageAction href="/admin/content/products/list#product-create-publish-queue-handoff" label="B341 队列" primary={contentGaps > 0} />
          <TrafficTriageAction href="/admin/customers/leads?source_type=product" label="产品线索" primary={metric.leads > 0} />
          <TrafficTriageAction href="/admin/site/conversion#conversion-ledger" label="转化复盘" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-6">
        {cards.map((card) => (
          <Link key={card.key} href={card.href} className="block min-w-0 p-5 transition hover:bg-[#F7FAFA]">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(card.tone)}`}>
              {card.label}
            </span>
            <span className="mt-3 block truncate text-2xl font-black text-[#1E2C31]" title={card.value}>
              {card.value}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trafficMatrixToneClass(handoffTone)}`}>
              {needsPathReview ? '需复盘' : metric.leads > 0 ? '有线索样本' : contentGaps > 0 ? '待补承接' : '观察'}
            </span>
            <span className="text-sm font-semibold text-[#1E2C31]">发布后路径判断</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#61767D]">{handoffDecision}</p>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            {topProductPages.length > 0 ? (
              topProductPages.map((row) => (
                <Link key={row.key} href={row.key} className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 transition hover:border-[#1889B6]">
                  <span className="block truncate text-xs font-bold text-[#1E2C31]" title={row.label}>{row.label}</span>
                  <span className="mt-1 block text-lg font-black text-[#1889B6]">{formatNumber(row.value)}</span>
                  <span className="mt-1 block text-[11px] text-[#8A9EA4]">产品页 PV</span>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[#D8E7E8] bg-[#FBFDFD] px-3 py-4 text-xs text-[#8A9EA4] md:col-span-3">
                暂无产品 Top Pages 样本，保留 B341 队列、公开目录和线索入口等待访问数据。
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:border-l xl:border-t-0">
          <p className="text-sm font-bold text-[#1E2C31]">运营回看顺序</p>
          <div className="mt-3 space-y-2 text-xs leading-5 text-[#61767D]">
            <StatusLine ok={contentGaps === 0} label={`先回 B341 队列：内容/SEO 缺口 ${formatNumber(contentGaps)} 项。`} />
            <StatusLine ok={pathActions > 0 || metric.views === 0} label={`再看公开路径动作：${formatNumber(pathActions)} 次。`} />
            <StatusLine ok={metric.leads > 0 || pathActions === 0} label={`最后看产品线索：${formatNumber(metric.leads)} 条。`} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <TrafficTriageAction href="/admin/content/products/list#product-create-publish-queue-handoff" label="B341 队列" compact primary={contentGaps > 0} />
            <TrafficTriageAction href="#product-conversion-path" label="路径分析" compact primary={needsPathReview} />
            <TrafficTriageAction href="/admin/customers/leads?source_type=product" label="产品线索" compact />
            <TrafficTriageAction href="/products" label="公开目录" compact />
          </div>
        </div>
      </div>
    </section>
  )
}

function ProductPathQualityReviewDesk({
  analytics,
  overview,
}: {
  analytics: SiteAnalyticsDashboard
  overview: Awaited<ReturnType<typeof loadStatusOverview>>
}) {
  const metric = analytics.conversionPaths.products ?? {
    views: 0,
    ctaClicks: 0,
    formSubmits: 0,
    leads: 0,
    conversionRate: 0,
  }
  const productContent = overview.content.products
  const seoMissing = overview.site.seo.productsMissing
  const contentIssues = productContent.issues
  const productStageTotal = analytics.sourceStageActions
    .filter((row) => row.key.startsWith('product:'))
    .reduce((sum, row) => sum + row.value, 0)
  const productSourceActions = analytics.sourceTypes.find((row) => row.key === 'product')?.value ?? 0
  const topProductPages = analytics.topPages
    .filter((row) => isProductPath(row.key) || isProductPath(row.label))
    .slice(0, 3)
  const pathActions = metric.ctaClicks + metric.formSubmits
  const trafficNoLead = metric.views > 0 && metric.leads === 0
  const actionNoLead = pathActions > 0 && metric.leads === 0
  const pathNoAction = metric.views > 0 && pathActions === 0
  const qualitySignals = seoMissing + contentIssues + (trafficNoLead ? 1 : 0) + (actionNoLead ? 1 : 0) + (pathNoAction ? 1 : 0)
  const contentReadyRate = productContent.total > 0 ? Math.max(0, (productContent.total - contentIssues) / productContent.total) : 0
  const priority =
    actionNoLead
      ? 'P0 动作无线索'
      : pathNoAction
        ? 'P1 访问未动作'
        : (seoMissing > 0 || contentIssues > 0) && metric.views > 0
          ? 'P1 承接缺口'
          : metric.leads > 0
            ? 'P2 样本复盘'
            : 'P3 等待样本'
  const priorityTone: ProductPathQualityCard['tone'] =
    actionNoLead || pathNoAction || ((seoMissing > 0 || contentIssues > 0) && metric.views > 0)
      ? 'orange'
      : metric.leads > 0
        ? 'green'
        : metric.views > 0 || productStageTotal > 0
          ? 'blue'
          : 'gray'
  const decision =
    actionNoLead
      ? '产品路径已有动作但无线索，先回产品线索队列核对 source_type=product，再从 B321 SEO 生命周期和 B320 产品生命周期检查承接页。'
      : pathNoAction
        ? '产品路径有访问但动作不足，先查 /products 与详情页 CTA、参数和产品适配证明，再回 B317 队列补证明链。'
        : seoMissing > 0 || contentIssues > 0
          ? '产品路径仍有 SEO 或内容缺口，优先回 B320/B321 处理公开承接，再观察路径动作和线索质量。'
          : metric.leads > 0
            ? '产品路径已有线索样本，可以回 B320 总控复盘哪些产品带来动作、线索和后续跟进。'
            : '产品路径样本不足，保留公开入口、生命周期、SEO 和线索入口，等待真实访问样本。'
  const cards: ProductPathQualityCard[] = [
    {
      key: 'path',
      label: '产品路径访问',
      value: `${formatNumber(metric.views)} PV`,
      detail: `路径动作 ${formatNumber(pathActions)}，产品来源阶段动作 ${formatNumber(productStageTotal)}。`,
      href: '#product-conversion-path',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
    {
      key: 'leads',
      label: '产品线索',
      value: formatNumber(metric.leads),
      detail: `source_type=product 动作 ${formatNumber(productSourceActions)}，转化率 ${formatAnalyticsPercent(metric.conversionRate)}。`,
      href: '/admin/customers/leads?source_type=product',
      tone: metric.leads > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      key: 'lifecycle',
      label: 'B320 生命周期',
      value: `${formatNumber(contentIssues)} 缺口`,
      detail: `产品总数 ${formatNumber(productContent.total)}，已发布 ${formatNumber(productContent.published)}。`,
      href: '/admin/content/products#product-lifecycle',
      tone: contentIssues > 0 ? 'orange' : 'green',
    },
    {
      key: 'seo',
      label: 'B321 SEO 生命周期',
      value: `${formatNumber(seoMissing)} 项`,
      detail: '回到产品 SEO 生命周期桥，核对标题、摘要、路径和公开承接。',
      href: '/admin/site/seo#product-seo-lifecycle-bridge',
      tone: seoMissing > 0 ? 'orange' : 'green',
    },
    {
      key: 'proof',
      label: 'B317 证明回流',
      value: `${formatNumber(qualitySignals)} 信号`,
      detail: '把流量质量问题回到产品证明、媒体、详情和询盘交接队列。',
      href: '/admin/content/products/list#product-fit-proof-backflow',
      tone: qualitySignals > 0 ? 'orange' : 'green',
    },
    {
      key: 'front',
      label: '前台 /products',
      value: topProductPages[0] ? `${formatNumber(topProductPages[0].value)} PV` : '只读入口',
      detail: topProductPages[0] ? `当前最高产品页：${topProductPages[0].label}` : '公开产品列表与详情页只读复验入口。',
      href: '/products',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
  ]

  return (
    <section id="product-path-quality-review-desk" data-product-path-quality-review="true" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">B322 Product Path Quality</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">产品路径到生命周期质量复盘台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把 B321 产品 SEO 生命周期、B320 产品生命周期、B317 证明回流、前台 /products 和产品线索队列放到同一条只读复盘链路；运营用它判断问题来自访问不足、动作不足、SEO/内容承接还是线索回流。本区不写埋点、不改线索、不发布产品。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TrafficTriageAction href="/admin/content/products#product-lifecycle" label="B320 生命周期" primary />
          <TrafficTriageAction href="/admin/site/seo#product-seo-lifecycle-bridge" label="B321 SEO" />
          <TrafficTriageAction href="/admin/content/products/list#product-fit-proof-backflow" label="B317 回流队列" primary={qualitySignals > 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-6">
        {cards.map((card) => (
          <Link key={card.key} href={card.href} className="block min-w-0 p-5 transition hover:bg-[#F7FAFA]">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(card.tone)}`}>
              {card.label}
            </span>
            <span className="mt-3 block truncate text-2xl font-black text-[#1E2C31]" title={card.value}>
              {card.value}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trafficMatrixToneClass(priorityTone)}`}>
              {priority}
            </span>
            <span className="text-sm font-semibold text-[#1E2C31]">产品流量质量判断</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#61767D]">{decision}</p>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            {topProductPages.length > 0 ? (
              topProductPages.map((row) => (
                <Link key={row.key} href={row.key} className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 transition hover:border-[#1889B6]">
                  <span className="block truncate text-xs font-bold text-[#1E2C31]" title={row.label}>{row.label}</span>
                  <span className="mt-1 block text-lg font-black text-[#1889B6]">{formatNumber(row.value)}</span>
                  <span className="mt-1 block text-[11px] text-[#8A9EA4]">产品页 PV</span>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[#D8E7E8] bg-[#FBFDFD] px-3 py-4 text-xs text-[#8A9EA4] md:col-span-3">
                暂无产品 Top Pages 样本，先保留 /products、B320 和 B321 入口等待访问数据。
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:border-l xl:border-t-0">
          <p className="text-sm font-bold text-[#1E2C31]">建议回看顺序</p>
          <div className="mt-3 space-y-2 text-xs leading-5 text-[#61767D]">
            <StatusLine ok={!actionNoLead} label="先看产品线索队列：确认 product 来源动作是否转成真实线索。" />
            <StatusLine ok={contentReadyRate >= 0.8} label={`再看 B320 产品生命周期：内容可承接率 ${formatAnalyticsPercent(contentReadyRate)}。`} />
            <StatusLine ok={seoMissing === 0} label={`最后看 B321 SEO 生命周期：待补 SEO ${formatNumber(seoMissing)} 项。`} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <TrafficTriageAction href="/admin/content/products/list?view=incomplete&issue=seo#product-fit-proof-backflow" label="B317 队列" compact primary={qualitySignals > 0} />
            <TrafficTriageAction href="/admin/content/products/list" label="B318 编辑" compact />
            <TrafficTriageAction href="/admin/content/products/new#new-product-backflow-preflight" label="B319 新建" compact />
            <TrafficTriageAction href="/admin/site/conversion" label="转化复盘" compact />
          </div>
        </div>
      </div>
    </section>
  )
}

function CasePathLeadBackflowDesk({
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
  const caseStageActions = analytics.sourceStageActions.filter((row) => row.key.startsWith('case:'))
  const caseStageTotal = caseStageActions.reduce((sum, row) => sum + row.value, 0)
  const inquiryFormActions = caseStageActions.find((row) => row.key === 'case:inquiry_form')?.value ?? 0
  const topCasePage = analytics.topPages.find((row) => isCasePath(row.key) || isCasePath(row.label))
  const readyRate = health.published > 0 ? health.ready / health.published : 0
  const actionGap = metric.ctaClicks > 0 && metric.leads === 0
  const trafficGap = metric.views > 0 && metric.ctaClicks === 0
  const contentGap = health.weak > 0
  const priority =
    actionGap
      ? 'P0 动作无线索'
      : trafficGap
        ? 'P1 访问未动作'
        : contentGap && metric.views > 0
          ? 'P1 内容承接'
          : metric.leads > 0
            ? 'P2 复盘样本'
            : 'P3 等待样本'
  const priorityTone: CasePathBackflowCard['tone'] =
    actionGap || trafficGap || (contentGap && metric.views > 0)
      ? 'orange'
      : metric.leads > 0
        ? 'green'
        : metric.views > 0 || caseStageTotal > 0
          ? 'blue'
          : 'gray'
  const decision =
    actionGap
      ? '案例路径已有动作但无线索，先从 B304 回流台核对 case 来源线索，再查 case:inquiry_form 和表单成功事件。'
      : trafficGap
        ? '案例页面已有访问但动作不足，优先复核 /cases 与详情页 CTA、移动端入口和案例证明链。'
        : contentGap && metric.views > 0
          ? '案例路径已有访问且仍有弱案例，先回到 B300 队列补齐发布承接，再观察路径动作。'
          : metric.leads > 0
            ? '案例路径已有真实线索样本，继续回到 B304 线索回流台和 B303 案例总控复盘内容来源。'
            : '案例路径样本不足，保留前台入口、路径分析和线索回流入口，等待事件样本。'
  const cards: CasePathBackflowCard[] = [
    {
      key: 'route',
      label: '案例路径访问',
      value: `${formatNumber(metric.views)} PV`,
      detail: topCasePage
        ? `最高案例页 ${topCasePage.label} / ${formatNumber(topCasePage.value)} PV。`
        : '近 30 天 /cases 与案例详情访问。',
      href: '#case-inquiry-path',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
    {
      key: 'stage',
      label: '来源阶段动作',
      value: formatNumber(caseStageTotal),
      detail: `case:inquiry_form ${formatNumber(inquiryFormActions)}，路径动作 ${formatNumber(metric.ctaClicks)}。`,
      href: '#case-source-stage-backflow',
      tone: caseStageTotal > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      key: 'lead',
      label: '案例线索回流',
      value: formatNumber(metric.leads),
      detail: `路径转化率 ${formatAnalyticsPercent(metric.conversionRate)}，回到 B304 线索回流台。`,
      href: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk',
      tone: metric.leads > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      key: 'content',
      label: '内容承接缺口',
      value: `${formatNumber(health.weak)} 弱`,
      detail: `已发布 ${formatNumber(health.published)}，可承接率 ${formatAnalyticsPercent(readyRate)}。`,
      href: '/admin/content/projects/list?view=case-conversion-weak#case-list-inquiry-conversion-queue',
      tone: health.weak > 0 ? 'orange' : 'green',
    },
  ]
  const workbenchLinks = [
    {
      label: 'B304 线索回流',
      detail: '按 source_type=case 回看线索与内容缺口',
      href: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk',
      tone: metric.leads > 0 ? 'green' : 'blue',
    },
    {
      label: 'B303 案例总控',
      detail: '回到案例内容到询盘转化总控',
      href: '/admin/content/projects#case-content-inquiry-command-center',
      tone: 'blue',
    },
    {
      label: 'B300 弱案例队列',
      detail: `当前弱案例 ${formatNumber(health.weak)}`,
      href: '/admin/content/projects/list?view=case-conversion-weak#case-list-inquiry-conversion-queue',
      tone: health.weak > 0 ? 'orange' : 'green',
    },
    {
      label: '前台案例入口',
      detail: '只读查看公开 /cases 承接路径',
      href: '/cases',
      tone: metric.views > 0 ? 'green' : 'gray',
    },
  ] satisfies Array<{
    label: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  return (
    <section id="case-path-lead-backflow-desk" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">B305 Case Path Backflow</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例路径到线索回流诊断台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把案例路径访问、来源阶段动作、B304 案例线索回流、B303 案例总控、B300 弱案例队列和前台 /cases 串成同屏只读链路；只做诊断和下钻，不写入埋点、不改线索状态、不发布内容。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TrafficTriageAction href="/admin/customers/leads?source_type=case#case-lead-content-backflow-desk" label="B304 回流台" primary={actionGap} />
          <TrafficTriageAction href="/admin/content/projects#case-content-inquiry-command-center" label="B303 总控" />
          <TrafficTriageAction href="/cases" label="前台 /cases" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.key} href={card.href} className="block min-w-0 p-5 transition hover:bg-[#F7FAFA]">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(card.tone)}`}>
              {card.label}
            </span>
            <span className="mt-3 block truncate text-2xl font-black text-[#1E2C31]" title={card.value}>
              {card.value}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trafficMatrixToneClass(priorityTone)}`}>
              {priority}
            </span>
            <span className="text-sm font-semibold text-[#1E2C31]">运营判断</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#61767D]">{decision}</p>
          <div id="case-source-stage-backflow" className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            {caseStageActions.slice(0, 3).map((row) => (
              <Link key={row.key} href={row.href} className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 transition hover:border-[#1889B6]">
                <span className="block truncate text-xs font-bold text-[#1E2C31]" title={row.label}>{row.label}</span>
                <span className="mt-1 block text-lg font-black text-[#1889B6]">{formatNumber(row.value)}</span>
                <span className="mt-1 block truncate font-mono text-[11px] text-[#8A9EA4]" title={row.key}>{row.key}</span>
              </Link>
            ))}
            {caseStageActions.length === 0 ? (
              <div className="rounded-md border border-dashed border-[#D8E7E8] bg-[#FBFDFD] px-3 py-4 text-xs text-[#8A9EA4] md:col-span-3">
                暂无 case 来源阶段动作，保留入口等待事件样本。
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:border-l xl:border-t-0">
          {workbenchLinks.map((item) => (
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
                进入下钻
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CaseLoopTrafficQualityReviewDesk({
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
  const caseStageActions = analytics.sourceStageActions.filter((row) => row.key.startsWith('case:'))
  const caseStageTotal = caseStageActions.reduce((sum, row) => sum + row.value, 0)
  const pathActions = metric.ctaClicks + metric.formSubmits
  const readyRate = health.published > 0 ? health.ready / health.published : 0
  const topCasePages = analytics.topPages
    .filter((row) => isCasePath(row.key) || isCasePath(row.label))
    .slice(0, 3)
  const trafficNoLead = metric.views > 0 && metric.leads === 0
  const actionNoLead = pathActions > 0 && metric.leads === 0
  const pathNoAction = metric.views > 0 && pathActions === 0
  const qualitySignals = health.weak + (trafficNoLead ? 1 : 0) + (actionNoLead ? 1 : 0)
  const priority =
    actionNoLead
      ? 'P0 动作无线索'
      : pathNoAction
        ? 'P1 访问未动作'
        : health.weak > 0 && metric.views > 0
          ? 'P1 内容质量'
          : metric.leads > 0
            ? 'P2 样本复盘'
            : 'P3 等待样本'
  const priorityTone: CaseLoopTrafficCard['tone'] =
    actionNoLead || pathNoAction || (health.weak > 0 && metric.views > 0)
      ? 'orange'
      : metric.leads > 0
        ? 'green'
        : metric.views > 0 || caseStageTotal > 0
          ? 'blue'
          : 'gray'
  const decision =
    actionNoLead
      ? '案例路径已有动作但无线索，先回 B304 线索回流和 B307 转化复盘核对表单成功、source_type=case 与来源阶段。'
      : pathNoAction
        ? '案例路径有访问但动作不足，先从 B311 闭环总控回查内容证明链，再检查 /cases 与详情页 CTA 位置。'
        : health.weak > 0 && metric.views > 0
          ? '案例路径已有访问且仍有弱案例，先回 B308/B309 补齐内容，再继续看流量质量。'
          : metric.leads > 0
            ? '案例路径已有线索样本，可以回 B311 总控复盘哪些内容带来路径动作和真实线索。'
            : '案例路径样本不足，保留公开入口、路径分析和内容总控入口，等待真实访问样本。'
  const cards: CaseLoopTrafficCard[] = [
    {
      key: 'loop',
      label: 'B311 闭环总控',
      value: `${formatNumber(qualitySignals)} 信号`,
      detail: `弱案例 ${formatNumber(health.weak)}，可承接率 ${formatAnalyticsPercent(readyRate)}。`,
      href: '/admin/content/projects#case-creation-backfill-review-loop-center',
      tone: qualitySignals > 0 ? 'orange' : 'green',
    },
    {
      key: 'conversion',
      label: 'B307 转化复盘',
      value: formatAnalyticsPercent(metric.conversionRate),
      detail: `路径动作 ${formatNumber(pathActions)}，真实线索 ${formatNumber(metric.leads)}。`,
      href: '/admin/site/conversion#case-followup-conversion-review-bridge',
      tone: metric.leads > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      key: 'backflow',
      label: 'B305 路径回流',
      value: `${formatNumber(metric.views)} PV`,
      detail: '回到案例路径到线索回流诊断台，查看访问、动作、线索和弱案例。',
      href: '#case-path-lead-backflow-desk',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
    {
      key: 'leads',
      label: 'B304 线索回流',
      value: formatNumber(metric.leads),
      detail: '只读查看 source_type=case 线索队列，不改线索状态或负责人。',
      href: '/admin/customers/leads?source_type=case#case-lead-content-backflow-desk',
      tone: metric.leads > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      key: 'content',
      label: 'B308 内容补位',
      value: `${formatNumber(health.weak)} 弱`,
      detail: '把流量质量问题回到内容补位队列和单篇复核，不在流量页改内容。',
      href: '/admin/content/projects/list#case-conversion-content-backfill-desk',
      tone: health.weak > 0 ? 'orange' : 'green',
    },
    {
      key: 'front',
      label: '前台 /cases',
      value: topCasePages[0] ? `${formatNumber(topCasePages[0].value)} PV` : '只读入口',
      detail: topCasePages[0] ? `当前最高案例页：${topCasePages[0].label}` : '公开案例列表与详情页只读复验入口。',
      href: '/cases',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
  ]

  return (
    <section id="case-loop-traffic-quality-review-desk" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#E36F2C] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E36F2C]">B312 Case Loop Traffic Quality</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">案例闭环到流量质量复盘台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把 B311 闭环总控、B307 转化复盘、B305 案例路径回流、B304 案例线索回流和前台 /cases 放到同一条只读质量链路；运营用它判断流量问题来自访问不足、动作不足、线索回流还是内容承接。本区不写埋点、不改线索、不发布内容。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TrafficTriageAction href="/admin/content/projects#case-creation-backfill-review-loop-center" label="B311 闭环总控" primary />
          <TrafficTriageAction href="/admin/site/conversion#case-followup-conversion-review-bridge" label="B307 转化复盘" />
          <TrafficTriageAction href="/admin/customers/leads?source_type=case#case-lead-content-backflow-desk" label="B304 回流台" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-6">
        {cards.map((card) => (
          <Link key={card.key} href={card.href} className="block min-w-0 p-5 transition hover:bg-[#F7FAFA]">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(card.tone)}`}>
              {card.label}
            </span>
            <span className="mt-3 block truncate text-2xl font-black text-[#1E2C31]" title={card.value}>
              {card.value}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trafficMatrixToneClass(priorityTone)}`}>
              {priority}
            </span>
            <span className="text-sm font-semibold text-[#1E2C31]">流量质量判断</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#61767D]">{decision}</p>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            {topCasePages.length > 0 ? (
              topCasePages.map((row) => (
                <Link key={row.key} href={row.key} className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] px-3 py-2 transition hover:border-[#1889B6]">
                  <span className="block truncate text-xs font-bold text-[#1E2C31]" title={row.label}>{row.label}</span>
                  <span className="mt-1 block text-lg font-black text-[#1889B6]">{formatNumber(row.value)}</span>
                  <span className="mt-1 block text-[11px] text-[#8A9EA4]">案例页 PV</span>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[#D8E7E8] bg-[#FBFDFD] px-3 py-4 text-xs text-[#8A9EA4] md:col-span-3">
                暂无案例 Top Pages 样本，先保留 /cases、B305 和 B311 入口等待访问数据。
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:border-l xl:border-t-0">
          {caseStageActions.slice(0, 4).map((row) => (
            <Link
              key={row.key}
              href={row.href}
              className="group rounded-md border border-[#D8E7E8] bg-white px-3 py-3 transition hover:border-[#1889B6] hover:bg-[#F7FAFA]"
            >
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(row.value > 0 ? 'blue' : 'gray')}`}>
                {row.label}
              </span>
              <span className="mt-2 block text-lg font-black text-[#1E2C31]">{formatNumber(row.value)}</span>
              <span className="mt-1 block truncate font-mono text-[11px] text-[#8A9EA4]" title={row.key}>{row.key}</span>
            </Link>
          ))}
          {caseStageActions.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#D8E7E8] bg-[#FBFDFD] px-3 py-4 text-xs text-[#8A9EA4] md:col-span-2">
              暂无 case 来源阶段动作，暂不推断阶段质量。
            </div>
          ) : null}
        </div>
      </div>
    </section>
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
    { title: '案例询盘路径', value: `${formatNumber(casePathActions)} 动作`, href: '#case-loop-traffic-quality-review-desk', detail: `弱案例 ${formatNumber(weakCases)}` },
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

function NewsTrafficPanel({ analytics }: { analytics: SiteAnalyticsDashboard }) {
  const metric = analytics.conversionPaths.news ?? {
    views: 0,
    ctaClicks: 0,
    formSubmits: 0,
    leads: 0,
    conversionRate: 0,
  }
  const sourceActions = analytics.sourceTypes.find((row) => row.key === 'news')?.value ?? 0
  const topNewsPage = analytics.topPages.find((row) => isNewsPath(row.key))
  const quietNewsLanding = analytics.landingPages.find((row) => isNewsPath(row.key) && row.value > 0 && (row.secondary ?? 0) === 0)
  const hasNewsSignal = metric.views > 0 || sourceActions > 0 || metric.leads > 0
  const rows = [
    {
      label: '新闻访问',
      value: `${formatNumber(metric.views)} PV`,
      detail: topNewsPage
        ? `最高新闻页 ${topNewsPage.label}，${formatNumber(topNewsPage.value)} PV。`
        : '近 30 天 /news 与新闻详情访问。',
      href: '#behavior-analysis',
      tone: metric.views > 0 ? 'blue' : 'gray',
    },
    {
      label: '来源动作',
      value: formatNumber(sourceActions),
      detail: `source_type=news 的 CTA / 联系 / 表单动作；路径动作合计 ${formatNumber(metric.ctaClicks)}。`,
      href: '/admin/customers/leads?source_type=news',
      tone: sourceActions > 0 ? 'green' : metric.views > 0 ? 'orange' : 'gray',
    },
    {
      label: '真实线索',
      value: formatNumber(metric.leads),
      detail: `新闻来源访问转化率 ${formatAnalyticsPercent(metric.conversionRate)}。`,
      href: '/admin/customers/leads?source_type=news',
      tone: metric.leads > 0 ? 'green' : sourceActions > 0 ? 'orange' : 'gray',
    },
    {
      label: '内容承接',
      value: quietNewsLanding ? '待复核' : hasNewsSignal ? '可观察' : '待样本',
      detail: quietNewsLanding
        ? `${quietNewsLanding.label} 有访问但暂无后续动作。`
        : '回到新闻运营总览，检查发布、分类、SEO 和内容待补。',
      href: '/admin/content/news#news-operations-hub',
      tone: quietNewsLanding ? 'orange' : hasNewsSignal ? 'blue' : 'gray',
    },
  ] satisfies Array<{
    label: string
    value: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  const decision =
    metric.views > 0 && sourceActions === 0
      ? '新闻已有阅读样本但暂无新闻来源动作，优先复核 news:*:contact_cta 是否带到 Contact。'
      : sourceActions > 0 && metric.leads === 0
        ? '新闻已产生来源动作但暂无真实线索，继续观察 Contact 表单提交和 source_type=news 归因。'
        : metric.leads > 0
          ? '新闻来源已有真实线索样本，可继续复盘高阅读新闻与后续产品/案例承接。'
          : '新闻来源暂无足够样本，先保持公开新闻入口和后台内容运营链路可下钻。'
  const sourceContracts = [
    {
      label: '来源命名',
      value: 'news:*',
      detail: '公开新闻列表和详情页统一使用 news:list:contact_cta / news:{slug}:contact_cta。',
      href: '/news',
      tone: 'blue' as const,
    },
    {
      label: 'Contact 承接',
      value: 'Contact',
      detail: '新闻阅读页带 source 参数进入 Contact 主表单，保持文章轻量阅读。',
      href: '/contact?source=news:list:contact_cta',
      tone: 'green' as const,
    },
    {
      label: '后台筛选',
      value: 'source_type=news',
      detail: 'Contact 写入后进入新闻来源线索队列，便于运营按来源复盘。',
      href: '/admin/customers/leads?source_type=news',
      tone: metric.leads > 0 ? 'green' as const : sourceActions > 0 ? 'orange' as const : 'blue' as const,
    },
  ] satisfies Array<{
    label: string
    value: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>
  const closureLinks = [
    {
      label: '线索状态桥',
      detail: '复盘新闻路径、来源动作和线索状态',
      href: '/admin/status/leads#news-lead-path-bridge',
      tone: metric.leads > 0 ? 'green' as const : hasNewsSignal ? 'blue' as const : 'gray' as const,
    },
    {
      label: '新闻线索队列',
      detail: '只看 source_type=news 的线索承接',
      href: '/admin/customers/leads?source_type=news',
      tone: metric.leads > 0 ? 'green' as const : sourceActions > 0 ? 'orange' as const : 'blue' as const,
    },
    {
      label: '公开新闻入口',
      detail: '查看前台新闻列表和公开阅读路径',
      href: '/news',
      tone: metric.views > 0 ? 'green' as const : 'blue' as const,
    },
    {
      label: '新闻运营总览',
      detail: '回到发布、分类、SEO 和待补内容',
      href: '/admin/content/news#news-operations-hub',
      tone: quietNewsLanding ? 'orange' as const : 'blue' as const,
    },
    {
      label: '转化台账',
      detail: '和其他公开路径统一看承接状态',
      href: '/admin/site/conversion#news-conversion-handoff',
      tone: hasNewsSignal ? 'green' as const : 'gray' as const,
    },
  ] satisfies Array<{
    label: string
    detail: string
    href: string
    tone: 'blue' | 'green' | 'orange' | 'gray'
  }>

  return (
    <section id="news-source-handoff" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">新闻来源承接分析</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            把 B250 新闻阅读路径、B251 Contact source 承接和 B252 news 来源线索归因放在同屏；本区只读，不写新闻、不写线索。
          </p>
        </div>
        <span className="rounded-full bg-[#EAF6F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
          30 天新闻来源
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

      <div className="border-t border-[#E6EEEE] bg-[#FBFDFD]">
        <div className="px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">News Contact Source Contract</p>
          <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">新闻 Contact 来源合同</h3>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-[#61767D]">
            对齐 300 后台式“入口 - 行为 - 线索 - 处理”阅读顺序，把公开新闻访问、Contact source 和新闻线索筛选收在同一块流量面板里。
          </p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] border-t border-[#E6EEEE] md:grid-cols-3 md:divide-x md:divide-y-0">
          {sourceContracts.map((item) => (
            <Link key={item.label} href={item.href} className="group block min-w-0 p-5 transition hover:bg-white">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trafficMatrixToneClass(item.tone)}`}>
                {item.label}
              </span>
              <span className="mt-3 block truncate text-xl font-black text-[#1E2C31]" title={item.value}>
                {item.value}
              </span>
              <span className="mt-2 block min-h-10 text-xs leading-5 text-[#61767D]">{item.detail}</span>
              <span className="mt-3 inline-flex text-xs font-semibold text-[#1889B6] group-hover:text-[#E36F2C]">
                下钻核对
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] px-5 py-4 md:grid-cols-2 xl:grid-cols-5">
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

function isNewsPath(path: string) {
  return path === '/news' || path.startsWith('/news/')
}

function isProductPath(path: string) {
  return path === '/products' || path.startsWith('/products/')
}

function isCasePath(path: string) {
  return path === '/cases' || path.startsWith('/cases/')
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
          {item.href ? (
            <Link
              href={item.href}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-bold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
            >
              {readinessActionLabel(item.state)}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
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

function readinessActionLabel(state: AnalyticsReadinessItem['state']): string {
  if (state === 'active') return '查看下钻'
  if (state === 'partial') return '继续配置'
  if (state === 'planned') return '进入接入入口'
  return '查看上线前事项'
}
