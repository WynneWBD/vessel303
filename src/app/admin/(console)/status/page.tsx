import Link from 'next/link'
import { CONVERSION_PATHS } from '@/lib/admin-conversion-paths'
import {
  formatNumber,
  loadStatusOverview,
  sumContent,
  type ContentMetric,
  type SeoMetrics,
} from '@/lib/admin-status-metrics'
import { loadCaseInquiryHealth, type CaseInquiryHealth } from '@/lib/project-case-inquiry-health'
import {
  formatAnalyticsPercent,
  loadSiteAnalyticsDashboard,
  sourceTypeLabel,
  type AnalyticsAllTimeMetric,
  type AnalyticsBehaviorStep,
  type AnalyticsComparisonMetric,
  type AnalyticsConversionMetric,
  type AnalyticsDeltaMetric,
  type AnalyticsPeriodMetric,
  type AnalyticsRankRow,
  type AnalyticsTrendRow,
  type AnalyticsWindowMetric,
  type SiteAnalyticsDashboard,
} from '@/lib/site-analytics'
import { AdminPageHero } from '@/components/admin/AdminUI'
import {
  ActivityList,
  buildStatusBadges,
  SectionTitle,
  StatusPageShell,
  StatusPill,
  STATUS_ICONS,
} from './_components'
import { getStatusAccess } from './_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '运营数据中心 - VESSEL' }

type SharedTrafficMetric = {
  pageViews: number
  visitors: number
  ctaClicks?: number
  contactRedirects?: number
  formSubmits: number
  leads: number
  testEvents?: number
  testLeads?: number
  conversionRate?: number
}

type LedgerRow = {
  key: string
  label: string
  note: string
  metric: SharedTrafficMetric
  href: string
  dateLabel?: string
}

type SourceSeoHealthRow = {
  key: string
  label: string
  sourceType: string
  metric: AnalyticsConversionMetric
  seoMissing: number
  contentIssues: number
  contentHref: string
  seoHref: string
  leadHref: string
  conversionHref: string
  status: string
  tone: 'green' | 'orange' | 'blue' | 'gray'
}

export default async function AdminStatusPage() {
  const { role, email } = await getStatusAccess()
  const [overview, analytics, caseInquiryHealth] = await Promise.all([
    loadStatusOverview(),
    loadSiteAnalyticsDashboard(),
    loadCaseInquiryHealth(),
  ])

  const contentTotals = sumContent(overview.content)
  const today = analytics.periods.find((item) => item.key === 'today') ?? analytics.periods[0]
  const yesterday = analytics.periods.find((item) => item.key === 'yesterday') ?? analytics.periods[1] ?? today
  const sevenDays = analytics.windows.find((item) => item.days === 7) ?? analytics.windows[0]
  const thirtyDays = analytics.windows.find((item) => item.days === 30) ?? analytics.windows[1] ?? sevenDays
  const todayComparison = analytics.comparisons.find((item) => item.key === 'today')
  const thirtyComparison = analytics.comparisons.find((item) => item.key === '30')
  const siteIssues =
    overview.site.pages.total +
    overview.site.seo.missing +
    (overview.site.media.bytes > 800 * 1024 * 1024 ? 1 : 0) +
    (role === 'admin' ? overview.site.configChecks.filter((item) => !item.ok).length : 0)
  const queueTotal = overview.leads.new + contentTotals.issues + siteIssues + caseInquiryHealth.weak

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="overview"
      badges={buildStatusBadges(overview, role)}
    >
      <section className="space-y-6">
        <AdminPageHero
          kicker="Analytics / Operations"
          title="运营数据中心"
          description="按专业后台的数据分析流程组织：先选站点和时间，再看汇总台账、趋势、行为路径、转化入口和处理队列。统计只读，不写业务数据。"
          actions={
            <>
              <StatusPill ok={analytics.available} label={analytics.available ? '第一方事件可用' : '事件表未就绪'} />
              <StatusPill ok label={`排除测试 ${formatNumber(thirtyDays.testEvents)} 事件 / ${formatNumber(thirtyDays.testLeads)} 线索`} />
              <StatusPill ok label="不接第三方 API" />
              <StatusPill ok label="不触碰 /global" />
            </>
          }
        >
          <ExecutiveStrip
            today={today}
            thirtyDays={thirtyDays}
            queueTotal={queueTotal}
            contentIssues={contentTotals.issues}
            siteIssues={siteIssues}
            newLeads={overview.leads.new}
            caseConversionWeak={caseInquiryHealth.weak}
          />
        </AdminPageHero>

        <AnalysisControlStrip
          allTime={analytics.allTime}
          bestDay={analytics.bestDay}
          activeRange="30"
        />

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <TrafficLedger
              today={today}
              yesterday={yesterday}
              sevenDays={sevenDays}
              thirtyDays={thirtyDays}
              allTime={analytics.allTime}
              bestDay={analytics.bestDay}
            />

            <TrendPanel rows={analytics.dailyTrend} />

            <BehaviorPanel
              steps={analytics.behaviorSteps}
              topPages={analytics.topPages}
              landingPages={analytics.landingPages}
              sourceTypes={analytics.sourceTypes}
              thirtyDays={thirtyDays}
            />

            <SourceSeoHealthLedger
              analytics={analytics}
              products={overview.content.products}
              projects={overview.content.projects}
              news={overview.content.news}
              seo={overview.site.seo}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <ConversionPathTable conversionPaths={analytics.conversionPaths} />
              <RankWorkspace analytics={analytics} />
            </div>

            <ContentLedger
              products={overview.content.products}
              projects={overview.content.projects}
              news={overview.content.news}
            />

            <section className="space-y-4">
              <SectionTitle title="近期变化" detail="只读聚合最近内容和运营动作，不替代完整操作日志。" />
              <ActivityList items={overview.activity} />
            </section>
          </div>

          <aside className="space-y-6 2xl:sticky 2xl:top-24 2xl:self-start">
            <PriorityQueue
              newLeads={overview.leads.new}
              contactingLeads={overview.leads.contacting}
              contentIssues={contentTotals.issues}
              siteIssues={siteIssues}
              pageDrafts={overview.site.pages.total}
              caseInquiryHealth={caseInquiryHealth}
              thirtyDays={thirtyDays}
              todayComparison={todayComparison}
              thirtyComparison={thirtyComparison}
            />
            <ModuleEntryPanel
              analytics={analytics}
              contentIssues={contentTotals.issues}
              siteIssues={siteIssues}
              newLeads={overview.leads.new}
              caseInquiryHealth={caseInquiryHealth}
            />
          </aside>
        </div>
      </section>
    </StatusPageShell>
  )
}

function SourceSeoHealthLedger({
  analytics,
  products,
  projects,
  news,
  seo,
}: {
  analytics: SiteAnalyticsDashboard
  products: ContentMetric
  projects: ContentMetric
  news: ContentMetric
  seo: SeoMetrics
}) {
  const rows = buildSourceSeoHealthRows({ analytics, products, projects, news, seo })
  const totalViews = rows.reduce((sum, row) => sum + row.metric.views, 0)
  const totalActions = rows.reduce((sum, row) => sum + sourceActions(row.metric), 0)
  const totalLeads = rows.reduce((sum, row) => sum + row.metric.leads, 0)
  const totalOpenItems = rows.reduce((sum, row) => sum + row.seoMissing + row.contentIssues, 0)

  return (
    <section id="source-seo-health" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">B280 来源与 SEO 健康台账</h2>
          <p className="mt-1 text-xs text-[#61767D]">
            把 B279 来源总控接入数据中心：产品、案例、新闻同时看访问、动作、线索、SEO 缺项和内容承接缺项。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusLink href="/admin/site#source-seo-control" label="站点总控" />
          <StatusLink href="/admin/site/conversion#source-contract-portfolio" label="来源合同" />
          <StatusLink href="/admin/site/seo#seo-conversion-closure" label="SEO 闭环" />
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-[#E6EEEE] md:grid-cols-4 md:divide-y-0">
        <SourceSeoStat label="来源访问" value={totalViews} detail="产品 + 案例 + 新闻" />
        <SourceSeoStat label="来源动作" value={totalActions} detail="CTA / 联系 / 表单" />
        <SourceSeoStat label="真实线索" value={totalLeads} detail="三类来源汇总" />
        <SourceSeoStat label="待补项" value={totalOpenItems} detail="SEO + 内容承接" warn={totalOpenItems > 0} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-y border-[#E6EEEE] bg-white text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">来源合同</th>
              <th className="px-4 py-3 text-right font-medium">访问</th>
              <th className="px-4 py-3 text-right font-medium">动作</th>
              <th className="px-4 py-3 text-right font-medium">线索</th>
              <th className="px-4 py-3 text-right font-medium">转化率</th>
              <th className="px-4 py-3 text-right font-medium">SEO 待补</th>
              <th className="px-4 py-3 text-right font-medium">内容缺项</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-right font-medium">下钻</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-4 py-3">
                  <Link href={row.conversionHref} className="font-semibold text-[#1E2C31] hover:text-[#1889B6]">
                    {row.label}
                  </Link>
                  <div className="mt-1 text-xs text-[#8A9EA4]">source_type={row.sourceType}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#1E2C31]">{formatNumber(row.metric.views)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(sourceActions(row.metric))}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.metric.leads)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1889B6]">{formatAnalyticsPercent(row.metric.conversionRate)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${row.seoMissing > 0 ? 'text-[#E36F2C]' : 'text-emerald-700'}`}>
                  {formatNumber(row.seoMissing)}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${row.contentIssues > 0 ? 'text-[#E36F2C]' : 'text-emerald-700'}`}>
                  {formatNumber(row.contentIssues)}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${sourceSeoToneClass(row.tone)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={row.leadHref} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                      线索
                    </Link>
                    <Link href={row.seoHref} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                      SEO
                    </Link>
                    <Link href={row.contentHref} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                      内容
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SourceSeoStat({
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
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      <div className={`mt-1 text-2xl font-black ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>{formatNumber(value)}</div>
      <div className="mt-1 truncate text-xs text-[#61767D]">{detail}</div>
    </div>
  )
}

function StatusLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-semibold text-[#61767D] transition hover:border-[#1889B6] hover:text-[#1889B6]"
    >
      {label}
    </Link>
  )
}

function ExecutiveStrip({
  today,
  thirtyDays,
  queueTotal,
  contentIssues,
  siteIssues,
  newLeads,
  caseConversionWeak,
}: {
  today: AnalyticsPeriodMetric
  thirtyDays: AnalyticsWindowMetric
  queueTotal: number
  contentIssues: number
  siteIssues: number
  newLeads: number
  caseConversionWeak: number
}) {
  const cells = [
    {
      label: '今日 PV',
      value: formatNumber(today.pageViews),
      detail: `${formatNumber(today.visitors)} 访客 / ${formatNumber(metricActions(today))} 动作`,
      href: '/admin/status/traffic?range=today',
    },
    {
      label: '30 天 PV',
      value: formatNumber(thirtyDays.pageViews),
      detail: `${formatNumber(thirtyDays.visitors)} 访客 / ${formatAnalyticsPercent(thirtyDays.conversionRate)} 转化`,
      href: '/admin/status/traffic?range=30',
    },
    {
      label: '真实线索',
      value: formatNumber(thirtyDays.leads),
      detail: `表单成功 ${formatNumber(thirtyDays.formSubmits)} / 测试线索 ${formatNumber(thirtyDays.testLeads)}`,
      href: '/admin/site/conversion',
    },
    {
      label: '运营待处理',
      value: formatNumber(queueTotal),
      detail: `线索 ${formatNumber(newLeads)} / 内容 ${formatNumber(contentIssues)} / 案例 ${formatNumber(caseConversionWeak)} / 站点 ${formatNumber(siteIssues)}`,
      href: caseConversionWeak > 0 ? '/admin/content/projects/list?view=case-conversion-weak' : queueTotal > 0 ? '/admin/status/content' : '/admin/status/activity',
    },
  ]

  return (
    <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] overflow-hidden rounded-md border border-[#D8E7E8] md:grid-cols-4 md:divide-x md:divide-y-0">
      {cells.map((cell) => (
        <Link key={cell.label} href={cell.href} className="bg-[#FBFDFD] px-4 py-3 transition hover:bg-[#F3F8F9]">
          <span className="block text-xs font-semibold text-[#61767D]">{cell.label}</span>
          <span className="mt-1 block text-2xl font-black text-[#1E2C31]">{cell.value}</span>
          <span className="mt-1 block truncate text-xs text-[#61767D]">{cell.detail}</span>
        </Link>
      ))}
    </div>
  )
}

function AnalysisControlStrip({
  allTime,
  bestDay,
  activeRange,
}: {
  allTime: AnalyticsAllTimeMetric
  bestDay: AnalyticsTrendRow | null
  activeRange: 'today' | 'yesterday' | '7' | '30'
}) {
  const ranges = [
    { key: 'today', label: '今天' },
    { key: 'yesterday', label: '昨天' },
    { key: '7', label: '最近 7 天' },
    { key: '30', label: '最近 30 天' },
  ] as const
  const historyWindow =
    allTime.firstEventAt && allTime.lastEventAt
      ? `${formatDateTime(allTime.firstEventAt)} - ${formatDateTime(allTime.lastEventAt)}`
      : '暂无历史事件'

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 border-b border-[#E6EEEE] text-sm xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="inline-flex h-9 min-w-56 items-center border border-[#D8E7E8] bg-[#FBFDFD] px-3 font-semibold text-[#1E2C31]">
            英文站 vessel303.com
          </span>
          <span className="inline-flex overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
            {ranges.map((item, index) => (
              <Link
                key={item.key}
                href={`/admin/status/traffic?range=${item.key}`}
                className={`inline-flex h-9 items-center px-3 text-xs font-semibold md:text-sm ${
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
          <span className="inline-flex h-9 items-center rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 text-xs font-semibold text-[#61767D] md:text-sm">
            指标：PV / 访客 / 动作 / 线索
          </span>
        </div>
        <div className="flex items-center border-t border-[#E6EEEE] px-4 py-3 text-xs text-[#61767D] xl:border-t-0 xl:border-l">
          数据约每小时聚合；当前页只读。
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-4 md:divide-x md:divide-y-0">
        <ToolbarStat label="历史窗口" value={historyWindow} />
        <ToolbarStat label="历史累计 PV" value={formatNumber(allTime.pageViews)} />
        <ToolbarStat label="历史真实线索" value={formatNumber(allTime.leads)} />
        <ToolbarStat label="最高访问日" value={bestDay ? `${formatTrendDate(bestDay.date)} / ${formatNumber(bestDay.pageViews)} PV` : '暂无趋势'} />
      </div>
    </section>
  )
}

function ToolbarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-[#1E2C31]">{value}</div>
    </div>
  )
}

function TrafficLedger({
  today,
  yesterday,
  sevenDays,
  thirtyDays,
  allTime,
  bestDay,
}: {
  today: AnalyticsPeriodMetric
  yesterday: AnalyticsPeriodMetric
  sevenDays: AnalyticsWindowMetric
  thirtyDays: AnalyticsWindowMetric
  allTime: AnalyticsAllTimeMetric
  bestDay: AnalyticsTrendRow | null
}) {
  const rows: LedgerRow[] = [
    { key: 'today', label: '今天', note: '实时口径', metric: today, href: '/admin/status/traffic?range=today' },
    { key: 'yesterday', label: '昨天', note: '昨日对照', metric: yesterday, href: '/admin/status/traffic?range=yesterday' },
    { key: '7', label: '最近 7 天', note: '短期观察', metric: sevenDays, href: '/admin/status/traffic?range=7' },
    { key: '30', label: '最近 30 天', note: '运营主口径', metric: thirtyDays, href: '/admin/status/traffic?range=30' },
    { key: 'all', label: '历史累计', note: historyNote(allTime), metric: allTime, href: '/admin/status/traffic?range=30' },
  ]
  if (bestDay) {
    rows.push({
      key: 'best',
      label: '历史最高日',
      note: formatTrendDate(bestDay.date),
      metric: {
        pageViews: bestDay.pageViews,
        visitors: bestDay.visitors,
        formSubmits: bestDay.formSubmits,
        leads: bestDay.leads,
        ctaClicks: bestDay.actions,
        contactRedirects: 0,
        conversionRate: safeRate(bestDay.leads, bestDay.pageViews),
      },
      href: '/admin/status/traffic?range=30#trend-analysis',
      dateLabel: bestDay.date,
    })
  }

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">访问与转化台账</h2>
          <p className="mt-1 text-xs text-[#61767D]">按 300 后台的常用口径把访问、动作、线索、转化率和测试排除放到同一张表。</p>
        </div>
        <Link href="/admin/status/traffic?range=30" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          进入网站访问统计
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">统计口径</th>
              <th className="px-4 py-3 text-right font-medium">PV</th>
              <th className="px-4 py-3 text-right font-medium">访客(UV)</th>
              <th className="px-4 py-3 text-right font-medium">转化动作</th>
              <th className="px-4 py-3 text-right font-medium">表单成功</th>
              <th className="px-4 py-3 text-right font-medium">真实线索</th>
              <th className="px-4 py-3 text-right font-medium">访问转化率</th>
              <th className="px-4 py-3 text-right font-medium">已排除测试</th>
              <th className="px-4 py-3 text-right font-medium">下钻</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#1E2C31]">{row.label}</div>
                  <div className="mt-1 text-xs text-[#8A9EA4]">{row.note}</div>
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#1E2C31]">{formatNumber(row.metric.pageViews)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.visitors)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(metricActions(row.metric))}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.formSubmits)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.metric.leads)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1889B6]">{formatAnalyticsPercent(row.metric.conversionRate ?? 0)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">
                  {formatNumber(row.metric.testEvents ?? 0)} / {formatNumber(row.metric.testLeads ?? 0)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={row.href} className="font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                    查看
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

function TrendPanel({ rows }: { rows: AnalyticsTrendRow[] }) {
  const displayRows = rows.slice(-14)
  const maxViews = Math.max(1, ...displayRows.map((row) => row.pageViews))

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">访问趋势</h2>
          <p className="mt-1 text-xs text-[#61767D]">最近 {formatNumber(displayRows.length)} 天 PV、动作和线索对照。</p>
        </div>
        <Link href="/admin/status/traffic?range=30#trend-analysis" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          查看趋势
        </Link>
      </div>
      {displayRows.length === 0 ? (
        <div className="mt-5 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-4 text-sm text-[#61767D]">暂无可用趋势数据。</div>
      ) : (
        <>
          <div className="mt-5 flex h-52 items-end gap-2 border-b border-[#E6EEEE] pb-3">
            {displayRows.map((row) => {
              const pvHeight = Math.max(8, Math.round((row.pageViews / maxViews) * 168))
              const actionHeight = Math.max(4, Math.round((row.actions / maxViews) * 168))
              const leadHeight = Math.max(row.leads > 0 ? 4 : 0, Math.round((row.leads / maxViews) * 168))
              return (
                <div key={row.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-44 w-full items-end justify-center gap-1">
                    <span className="w-2 rounded-t bg-[#1889B6]" style={{ height: pvHeight }} title={`${formatNumber(row.pageViews)} PV`} />
                    <span className="w-2 rounded-t bg-[#E36F2C]" style={{ height: actionHeight }} title={`${formatNumber(row.actions)} 动作`} />
                    <span className="w-2 rounded-t bg-emerald-600" style={{ height: leadHeight }} title={`${formatNumber(row.leads)} 线索`} />
                  </div>
                  <span className="w-full truncate text-center text-[11px] text-[#8A9EA4]">{formatTrendDate(row.date)}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#61767D]">
            <LegendDot color="bg-[#1889B6]" label="PV" />
            <LegendDot color="bg-[#E36F2C]" label="转化动作" />
            <LegendDot color="bg-emerald-600" label="真实线索" />
          </div>
        </>
      )}
    </section>
  )
}

function BehaviorPanel({
  steps,
  topPages,
  landingPages,
  sourceTypes,
  thirtyDays,
}: {
  steps: AnalyticsBehaviorStep[]
  topPages: AnalyticsRankRow[]
  landingPages: AnalyticsRankRow[]
  sourceTypes: AnalyticsRankRow[]
  thirtyDays: AnalyticsWindowMetric
}) {
  const hasSteps = steps.some((step) => step.nodes.length > 0)
  const actionRows = landingPages
    .filter((row) => (row.secondary ?? 0) > 0)
    .map((row) => ({ ...row, value: row.secondary ?? 0 }))
  const conversionRows: AnalyticsRankRow[] = [
    { key: 'leads', label: '真实线索', value: thirtyDays.leads },
    { key: 'forms', label: '表单成功', value: thirtyDays.formSubmits },
    { key: 'rate', label: '访问转化率', value: Math.round(thirtyDays.conversionRate * 10000) / 100 },
  ]
  const diagnostics = [
    {
      label: '首要入口',
      value: topPages[0]?.label ?? '暂无入口',
      detail: topPages[0]
        ? `${formatNumber(topPages[0].value)} PV / ${formatNumber(topPages[0].secondary ?? 0)} 访客`
        : '等待访问事件进入统计。',
    },
    {
      label: '动作入口',
      value: actionRows[0]?.label ?? '暂无动作',
      detail: actionRows[0]
        ? `${formatNumber(actionRows[0].value)} 次动作 / ${formatNumber(landingPages.find((row) => row.key === actionRows[0]?.key)?.value ?? 0)} 次访问`
        : 'CTA、联系跳转或表单成功后出现。',
    },
    {
      label: '主要来源',
      value: sourceTypes[0] ? sourceTypeLabel(sourceTypes[0].key) : '暂无来源',
      detail: sourceTypes[0] ? `${formatNumber(sourceTypes[0].value)} 次转化动作` : '等待来源类型事件进入统计。',
    },
    {
      label: '线索结果',
      value: `${formatNumber(thirtyDays.leads)} 条`,
      detail: `${formatNumber(thirtyDays.formSubmits)} 次表单成功 / ${formatAnalyticsPercent(thirtyDays.conversionRate)} 转化率`,
    },
  ]

  return (
    <section id="behavior-flow" className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">访问行为路径</h2>
          <p className="mt-1 text-xs text-[#61767D]">按 300 后台常见路径心智，把入口页面、行为步骤、留存率和转化诊断放在同屏判断。</p>
        </div>
        <Link href="/admin/status/traffic#behavior-analysis" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          行为分析
        </Link>
      </div>

      {hasSteps ? (
        <BehaviorFlowMap steps={steps} />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FlowColumn title="入口页面" rows={topPages} empty="暂无入口" />
          <FlowColumn title="后续动作" rows={actionRows} empty="暂无动作" />
          <FlowColumn title="来源类型" rows={sourceTypes} empty="暂无来源" formatLabel={sourceTypeLabel} />
          <FlowColumn title="线索结果" rows={conversionRows} empty="暂无线索" percentKey="rate" />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 divide-y divide-[#E6EEEE] rounded-md border border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4 md:divide-x md:divide-y-0">
        {diagnostics.map((item) => (
          <div key={item.label} className="min-w-0 px-4 py-3">
            <div className="text-[11px] font-bold text-[#8A9EA4]">{item.label}</div>
            <div className="mt-1 truncate text-sm font-bold text-[#1E2C31]">{item.value}</div>
            <div className="mt-1 truncate text-xs text-[#61767D]">{item.detail}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function BehaviorFlowMap({ steps }: { steps: AnalyticsBehaviorStep[] }) {
  const visibleSteps = steps.slice(0, 5)
  const maxNodeValue = Math.max(1, ...visibleSteps.flatMap((step) => step.nodes.map((node) => node.value)))

  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-[#D8E7E8] bg-[#F7FAFA]">
      <div className="grid min-w-[1080px] grid-cols-5 gap-3 p-4">
        {visibleSteps.map((step, index) => (
          <div key={step.step} className="relative min-w-0">
            {index > 0 ? <span className="absolute -left-3 top-16 h-px w-3 bg-[#C9DCDF]" /> : null}
            <div className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
              <div className="border-b border-[#E6EEEE] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#1E2C31]">{step.label}</span>
                  <span className="rounded bg-[#E8F6FA] px-2 py-0.5 text-[11px] font-bold text-[#1889B6]">
                    {formatAnalyticsPercent(step.retainedRate)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[#61767D]">{formatNumber(step.visits)} 次访问</div>
              </div>
              <div className="space-y-2 px-3 py-3">
                {step.nodes.length === 0 ? (
                  <div className="rounded border border-dashed border-[#D8E7E8] px-3 py-4 text-xs text-[#8A9EA4]">暂无路径节点</div>
                ) : (
                  step.nodes.slice(0, 6).map((node) => {
                    const width = Math.max(8, Math.round((node.value / maxNodeValue) * 100))
                    const share = step.visits > 0 ? node.value / step.visits : 0

                    return (
                      <div key={`${step.step}-${node.key}`} className="rounded border border-[#E6EEEE] bg-[#FBFDFD] p-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 truncate text-xs font-semibold text-[#1E2C31]" title={node.label}>
                            {node.label}
                          </span>
                          <span className="shrink-0 text-xs font-bold text-[#1889B6]">{formatNumber(node.value)}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6EEEE]">
                          <span className="block h-full rounded-full bg-[#1889B6]" style={{ width: `${width}%` }} />
                        </div>
                        <div className="mt-1 text-[11px] text-[#8A9EA4]">{formatAnalyticsPercent(share)} / 本步</div>
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
  )
}

function ConversionPathTable({
  conversionPaths,
}: {
  conversionPaths: Record<string, AnalyticsConversionMetric>
}) {
  const rows = CONVERSION_PATHS.map((item) => ({
    key: item.key,
    label: item.area,
    href: item.adminHref,
    metric: conversionPaths[item.key] ?? {
      views: 0,
      ctaClicks: 0,
      formSubmits: 0,
      leads: 0,
      conversionRate: 0,
    },
  })).sort((a, b) => conversionScore(b.metric) - conversionScore(a.metric))

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">线索转化路径</h2>
          <p className="mt-1 text-xs text-[#61767D]">只统计现有公开路径的访问、动作、表单和真实线索。</p>
        </div>
        <Link href="/admin/site/conversion" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          转化管理
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">路径</th>
              <th className="px-4 py-3 text-right font-medium">访问</th>
              <th className="px-4 py-3 text-right font-medium">CTA</th>
              <th className="px-4 py-3 text-right font-medium">表单</th>
              <th className="px-4 py-3 text-right font-medium">线索</th>
              <th className="px-4 py-3 text-right font-medium">转化率</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 6).map((row) => (
              <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-4 py-3">
                  <Link href={row.href} className="font-semibold text-[#1E2C31] hover:text-[#1889B6]">
                    {row.label}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#1E2C31]">{formatNumber(row.metric.views)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.ctaClicks)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.formSubmits)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.metric.leads)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1889B6]">{formatAnalyticsPercent(row.metric.conversionRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RankWorkspace({ analytics }: { analytics: SiteAnalyticsDashboard }) {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">入口与来源排行</h2>
          <p className="mt-1 text-xs text-[#61767D]">运营先看高访问页面、来源类型和高访问低动作入口。</p>
        </div>
        <Link href="/admin/status/traffic#landing-analysis" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          落地页分析
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RankList title="Top Pages" rows={analytics.topPages} empty="暂无访问页面。" />
        <RankList title="来源类型" rows={analytics.sourceTypes} empty="暂无来源事件。" formatLabel={sourceTypeLabel} />
        <RankList title="落地页动作" rows={analytics.landingPages} empty="暂无落地页事件。" secondaryLabel="动作" />
      </div>
    </section>
  )
}

function ContentLedger({
  products,
  projects,
  news,
}: {
  products: ContentMetric
  projects: ContentMetric
  news: ContentMetric
}) {
  const rows = [products, projects, news]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">内容运营台账</h2>
          <p className="mt-1 text-xs text-[#61767D]">产品、项目案例、新闻按发布状态、近期变化和缺项统一排查。</p>
        </div>
        <Link href="/admin/status/content" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          内容统计
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">内容类型</th>
              <th className="px-4 py-3 text-right font-medium">总量</th>
              <th className="px-4 py-3 text-right font-medium">已发布</th>
              <th className="px-4 py-3 text-right font-medium">草稿</th>
              <th className="px-4 py-3 text-right font-medium">30 天变化</th>
              <th className="px-4 py-3 text-right font-medium">缺项</th>
              <th className="px-4 py-3 text-right font-medium">处理</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-4 py-3 font-semibold text-[#1E2C31]">{row.label}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1E2C31]">{formatNumber(row.total)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.published)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.draft)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.recent30)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${row.issues > 0 ? 'text-[#E36F2C]' : 'text-emerald-700'}`}>
                  {formatNumber(row.issues)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={row.issues > 0 ? row.issueHref : row.href} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                    进入
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

function PriorityQueue({
  newLeads,
  contactingLeads,
  contentIssues,
  siteIssues,
  pageDrafts,
  caseInquiryHealth,
  thirtyDays,
  todayComparison,
  thirtyComparison,
}: {
  newLeads: number
  contactingLeads: number
  contentIssues: number
  siteIssues: number
  pageDrafts: number
  caseInquiryHealth: CaseInquiryHealth
  thirtyDays: AnalyticsWindowMetric
  todayComparison?: AnalyticsComparisonMetric
  thirtyComparison?: AnalyticsComparisonMetric
}) {
  const queue = [
    {
      label: '新线索',
      value: newLeads,
      detail: newLeads > 0 ? `跟进中 ${formatNumber(contactingLeads)}，优先进入线索列表处理。` : '暂无新线索。',
      href: '/admin/customers/leads?status=new',
      ok: newLeads === 0,
    },
    {
      label: '内容缺项',
      value: contentIssues,
      detail: contentIssues > 0 ? '优先补齐会影响展示和 SEO 的字段。' : '内容关键字段状态正常。',
      href: '/admin/status/content',
      ok: contentIssues === 0,
    },
    {
      label: '发布转化弱',
      value: caseInquiryHealth.weak,
      detail:
        caseInquiryHealth.weak > 0
          ? `已发布案例 ${formatNumber(caseInquiryHealth.published)} 个，其中 ${formatNumber(caseInquiryHealth.weak)} 个待补询盘承接要素。`
          : `已发布案例 ${formatNumber(caseInquiryHealth.published)} 个，询盘承接关键字段正常。`,
      href: '/admin/content/projects/list?view=case-conversion-weak',
      ok: caseInquiryHealth.weak === 0,
    },
    {
      label: '站点问题',
      value: siteIssues,
      detail: siteIssues > 0 ? `页面草稿 ${formatNumber(pageDrafts)}，同步检查 SEO / sitemap / 媒体。` : '站点健康项暂无待处理。',
      href: '/admin/status/site',
      ok: siteIssues === 0,
    },
    {
      label: '访问转化',
      value: thirtyDays.leads,
      detail: thirtyDays.pageViews > 0 ? `30 天访问转化率 ${formatAnalyticsPercent(thirtyDays.conversionRate)}。` : '暂无访问事件。',
      href: '/admin/status/traffic?range=30',
      ok: thirtyDays.pageViews === 0 || thirtyDays.leads > 0,
    },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4">
        <h2 className="text-sm font-bold text-[#1E2C31]">今日优先级</h2>
        <p className="mt-1 text-xs text-[#61767D]">按影响运营效率的顺序排列。</p>
      </div>
      <div className="grid grid-cols-2 border-b border-[#E6EEEE]">
        <DeltaCell title="今日 PV" metric={todayComparison?.pageViews} />
        <DeltaCell title="今日线索" metric={todayComparison?.leads} />
        <DeltaCell title="30 天 PV" metric={thirtyComparison?.pageViews} />
        <DeltaCell title="30 天转化率" metric={thirtyComparison?.conversionRate} rate />
      </div>
      <div className="divide-y divide-[#E6EEEE]">
        {queue.map((item) => (
          <QueueRow key={item.label} {...item} />
        ))}
      </div>
    </section>
  )
}

function ModuleEntryPanel({
  analytics,
  contentIssues,
  siteIssues,
  newLeads,
  caseInquiryHealth,
}: {
  analytics: SiteAnalyticsDashboard
  contentIssues: number
  siteIssues: number
  newLeads: number
  caseInquiryHealth: CaseInquiryHealth
}) {
  const modules = [
    {
      label: '网站访问统计',
      value: `${formatNumber(analytics.allTime.pageViews)} PV`,
      detail: '历史累计、最高日、趋势、Top Pages。',
      href: '/admin/status/traffic?range=30',
    },
    {
      label: '落地页跳出分析',
      value: `${formatNumber(analytics.landingPages.length)} 页`,
      detail: '识别高访问低动作入口页面。',
      href: '/admin/status/traffic#landing-analysis',
    },
    {
      label: '访问行为分析',
      value: `${formatNumber(analytics.behaviorSteps.reduce((sum, step) => sum + step.visits, 0))} 次`,
      detail: '入口、来源、动作和留存路径。',
      href: '/admin/status/traffic#behavior-analysis',
    },
    {
      label: '线索转化分析',
      value: formatNumber(newLeads),
      detail: '进入客户线索和转化路径处理。',
      href: '/admin/site/conversion',
    },
    {
      label: '案例转化健康',
      value: formatNumber(caseInquiryHealth.weak),
      detail:
        caseInquiryHealth.weak > 0
          ? `已发布 ${formatNumber(caseInquiryHealth.published)}，可承接 ${formatNumber(caseInquiryHealth.ready)}。`
          : '案例询盘承接字段正常。',
      href: '/admin/content/projects/list?view=case-conversion-weak',
    },
    {
      label: 'Google收录分析',
      value: formatNumber(siteIssues),
      detail: '从 SEO 字段和站点文件状态进入。',
      href: '/admin/site/seo',
    },
    {
      label: '内容统计',
      value: formatNumber(contentIssues),
      detail: '产品、案例、新闻缺项治理。',
      href: '/admin/status/content',
    },
  ]

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-[#1E2C31]">数据模块入口</h2>
      <p className="mt-1 text-xs text-[#61767D]">按 300 后台常见分析路径保留清晰下钻。</p>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {modules.map((module) => (
          <Link key={module.label} href={module.href} className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] p-3 transition hover:border-[#1889B6]/60 hover:bg-white">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#1E2C31]">{module.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[#61767D]">{module.detail}</span>
              </span>
              <span className="shrink-0 text-sm font-black text-[#1889B6]">{module.value}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function QueueRow({
  label,
  value,
  detail,
  href,
  ok,
}: {
  label: string
  value: number
  detail: string
  href: string
  ok: boolean
}) {
  return (
    <Link href={href} className="flex gap-3 px-5 py-4 transition hover:bg-[#F7FAFA]">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          ok ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
        }`}
      >
        {ok ? <STATUS_ICONS.CheckCircle2 size={16} /> : <STATUS_ICONS.AlertCircle size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#1E2C31]">{label}</span>
          <span className={`text-sm font-bold ${ok ? 'text-emerald-700' : 'text-[#E36F2C]'}`}>{formatNumber(value)}</span>
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{detail}</span>
      </span>
    </Link>
  )
}

function DeltaCell({ title, metric, rate = false }: { title: string; metric?: AnalyticsDeltaMetric; rate?: boolean }) {
  const tone = metric && metric.delta > 0 ? 'text-emerald-700' : metric && metric.delta < 0 ? 'text-[#E36F2C]' : 'text-[#61767D]'
  const value = metric ? (rate ? formatAnalyticsPercent(metric.current) : formatNumber(metric.current)) : '--'
  const delta = metric ? (rate ? formatRateDelta(metric) : formatNumberDelta(metric)) : '暂无对比'

  return (
    <div className="border-r border-b border-[#E6EEEE] p-4 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <div className="text-xs font-semibold text-[#61767D]">{title}</div>
      <div className="mt-2 text-xl font-black text-[#1E2C31]">{value}</div>
      <div className={`mt-1 text-xs font-bold ${tone}`}>{delta}</div>
    </div>
  )
}

function FlowColumn({
  title,
  rows,
  empty,
  formatLabel,
  percentKey,
  meta,
}: {
  title: string
  rows: AnalyticsRankRow[]
  empty: string
  formatLabel?: (value: string) => string
  percentKey?: string
  meta?: string
}) {
  const displayRows = rows.slice(0, 5)

  return (
    <div className="min-w-0 rounded-md border border-[#E6EEEE] bg-[#FBFDFD]">
      <div className="border-b border-[#E6EEEE] px-3 py-2">
        <div className="text-xs font-bold text-[#1E2C31]">{title}</div>
        {meta ? <div className="mt-1 text-[11px] font-semibold text-[#1889B6]">{meta}</div> : null}
      </div>
      <div className="divide-y divide-[#E6EEEE]">
        {displayRows.length === 0 ? (
          <div className="px-3 py-3 text-xs text-[#8A9EA4]">{empty}</div>
        ) : (
          displayRows.map((row) => (
            <div key={row.key} className="px-3 py-2">
              <div className="truncate text-xs font-semibold text-[#1E2C31]">{formatLabel ? formatLabel(row.key) : row.label}</div>
              <div className="mt-1 text-xs font-bold text-[#1889B6]">
                {percentKey === row.key ? `${formatNumber(row.value)}%` : formatNumber(row.value)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function RankList({
  title,
  rows,
  empty,
  formatLabel,
  secondaryLabel,
}: {
  title: string
  rows: AnalyticsRankRow[]
  empty: string
  formatLabel?: (value: string) => string
  secondaryLabel?: string
}) {
  const displayRows = rows.slice(0, 5)

  return (
    <div className="min-w-0">
      <h3 className="text-xs font-semibold text-[#61767D]">{title}</h3>
      <div className="mt-2 divide-y divide-[#E6EEEE] rounded-md border border-[#E6EEEE] bg-[#F7FAFA]">
        {displayRows.length === 0 ? (
          <div className="p-3 text-xs text-[#8A9EA4]">{empty}</div>
        ) : (
          displayRows.map((row) => (
            <div key={row.key} className="flex items-start justify-between gap-3 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-[#1E2C31]">
                  {formatLabel ? formatLabel(row.key) : row.label}
                </span>
                {row.secondary !== undefined ? (
                  <span className="mt-0.5 block text-[11px] text-[#8A9EA4]">{secondaryLabel ?? '访客'} {formatNumber(row.secondary)}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs font-bold text-[#1889B6]">{formatNumber(row.value)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}

function metricActions(metric: SharedTrafficMetric) {
  return (metric.ctaClicks ?? 0) + (metric.contactRedirects ?? 0) + metric.formSubmits
}

function sourceActions(metric: AnalyticsConversionMetric) {
  return metric.ctaClicks + metric.formSubmits
}

function buildSourceSeoHealthRows({
  analytics,
  products,
  projects,
  news,
  seo,
}: {
  analytics: SiteAnalyticsDashboard
  products: ContentMetric
  projects: ContentMetric
  news: ContentMetric
  seo: SeoMetrics
}): SourceSeoHealthRow[] {
  return [
    {
      key: 'products',
      label: '产品来源合同',
      sourceType: 'product',
      metric: getConversionMetric(analytics, 'products'),
      seoMissing: seo.productsMissing,
      contentIssues: products.issues,
      contentHref: '/admin/content/products/list#product-source-contract',
      seoHref: '/admin/content/products/list?view=incomplete&issue=seo',
      leadHref: '/admin/customers/leads?source_type=product',
      conversionHref: '/admin/site/conversion#source-contract-portfolio',
    },
    {
      key: 'cases',
      label: '案例来源合同',
      sourceType: 'case',
      metric: getConversionMetric(analytics, 'cases'),
      seoMissing: seo.projectsMissing,
      contentIssues: projects.issues,
      contentHref: '/admin/content/projects/list#case-source-contract',
      seoHref: '/admin/content/projects/list?view=incomplete',
      leadHref: '/admin/customers/leads?source_type=case',
      conversionHref: '/admin/site/conversion#source-contract-portfolio',
    },
    {
      key: 'news',
      label: '新闻来源合同',
      sourceType: 'news',
      metric: getConversionMetric(analytics, 'news'),
      seoMissing: seo.newsMissing,
      contentIssues: news.issues,
      contentHref: '/admin/content/news#news-operations-hub',
      seoHref: '/admin/content/news/list',
      leadHref: '/admin/customers/leads?source_type=news',
      conversionHref: '/admin/site/conversion#source-contract-portfolio',
    },
  ].map((row) => {
    const needsContent = row.seoMissing + row.contentIssues > 0
    const hasTrafficGap = row.metric.views > 0 && row.metric.leads === 0
    const hasLeads = row.metric.leads > 0

    return {
      ...row,
      status: needsContent ? '待补内容' : hasTrafficGap ? '有访问待转化' : hasLeads ? '已有线索' : '待积累样本',
      tone: needsContent || hasTrafficGap ? 'orange' : hasLeads ? 'green' : row.metric.views > 0 ? 'blue' : 'gray',
    }
  })
}

function getConversionMetric(analytics: SiteAnalyticsDashboard, key: string): AnalyticsConversionMetric {
  return analytics.conversionPaths[key] ?? {
    views: 0,
    ctaClicks: 0,
    formSubmits: 0,
    leads: 0,
    conversionRate: 0,
  }
}

function sourceSeoToneClass(tone: SourceSeoHealthRow['tone']) {
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#C85F24]'
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'blue') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-[#F0F2F2] text-[#61767D]'
}

function safeRate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0
  return numerator / denominator
}

function conversionScore(metric: AnalyticsConversionMetric) {
  return metric.leads * 1000 + metric.formSubmits * 100 + metric.ctaClicks + metric.views * 0.01
}

function historyNote(metric: AnalyticsAllTimeMetric) {
  if (!metric.firstEventAt || !metric.lastEventAt) return '暂无历史事件'
  return `${formatDateTime(metric.firstEventAt)} 起`
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

function formatTrendDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}
