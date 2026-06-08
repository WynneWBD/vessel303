import Link from 'next/link'
import { CONVERSION_PATHS } from '@/lib/admin-conversion-paths'
import {
  formatNumber,
  loadStatusOverview,
  sumContent,
} from '@/lib/admin-status-metrics'
import {
  formatAnalyticsPercent,
  loadSiteAnalyticsDashboard,
  sourceTypeLabel,
  type AnalyticsBehaviorStep,
  type AnalyticsComparisonMetric,
  type AnalyticsConversionMetric,
  type AnalyticsDeltaMetric,
  type AnalyticsPeriodMetric,
  type AnalyticsRankRow,
  type SiteAnalyticsDashboard,
  type AnalyticsTrendRow,
  type AnalyticsWindowMetric,
} from '@/lib/site-analytics'
import { AdminPageHero } from '@/components/admin/AdminUI'
import {
  ActionCard,
  ActivityList,
  buildStatusBadges,
  MetricCard,
  SectionTitle,
  StatusPageShell,
  StatusPill,
  STATUS_ICONS,
} from './_components'
import { getStatusAccess } from './_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '运营数据中心 - VESSEL' }

export default async function AdminStatusPage() {
  const { role, email } = await getStatusAccess()
  const [overview, analytics] = await Promise.all([
    loadStatusOverview(),
    loadSiteAnalyticsDashboard(),
  ])
  const contentTotals = sumContent(overview.content)
  const today = analytics.periods.find((item) => item.key === 'today') ?? analytics.periods[0]
  const yesterday = analytics.periods.find((item) => item.key === 'yesterday') ?? analytics.periods[1] ?? today
  const sevenDays = analytics.windows.find((item) => item.days === 7) ?? analytics.windows[0]
  const thirtyDays = analytics.windows.find((item) => item.days === 30) ?? analytics.windows[1] ?? sevenDays
  const todayComparison = analytics.comparisons.find((item) => item.key === 'today')
  const thirtyComparison = analytics.comparisons.find((item) => item.key === '30')
  const thirtyDayActions = metricActions(thirtyDays)
  const siteIssues =
    overview.site.pages.total +
    overview.site.seo.missing +
    (overview.site.media.bytes > 800 * 1024 * 1024 ? 1 : 0) +
    (role === 'admin' ? overview.site.configChecks.filter((item) => !item.ok).length : 0)

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="overview"
      badges={buildStatusBadges(overview, role)}
    >
      <AdminPageHero
        kicker="Analytics / Operations"
        title="运营数据中心"
        description="先看访问、转化、内容缺口、线索漏斗和站点健康；统计只读，不写业务数据。"
        actions={
          <>
            <StatusPill ok={analytics.available} label={analytics.available ? '第一方事件可用' : '事件表未就绪'} />
            <StatusPill ok label={`排除测试 ${formatNumber(thirtyDays.testEvents)} 事件 / ${formatNumber(thirtyDays.testLeads)} 线索`} />
            <StatusPill ok label="不接第三方 API" />
            <StatusPill ok label="不触碰 /global" />
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="30 天 PV"
              value={thirtyDays.pageViews}
              detail={`近 7 天 ${formatNumber(sevenDays.pageViews)} 次页面访问`}
              href="/admin/status/traffic"
              Icon={STATUS_ICONS.BarChart3}
              tone="blue"
            />
            <MetricCard
              title="30 天访客"
              value={thirtyDays.visitors}
              detail="匿名 visitor hash 统计，不保存 IP。"
              href="/admin/status/traffic"
              Icon={STATUS_ICONS.Activity}
              tone="green"
            />
            <MetricCard
              title="转化动作"
              value={thirtyDayActions}
              detail={`CTA ${formatNumber(thirtyDays.ctaClicks)} / 跳转 ${formatNumber(thirtyDays.contactRedirects)} / 表单 ${formatNumber(thirtyDays.formSubmits)}`}
              href="/admin/status/traffic"
              Icon={STATUS_ICONS.ListChecks}
              tone={thirtyDayActions > 0 ? 'orange' : 'gray'}
            />
            <MetricCard
              title="30 天真实线索"
              value={thirtyDays.leads}
              detail={`近 7 天 ${formatNumber(sevenDays.leads)} 条 / 转化率 ${formatAnalyticsPercent(thirtyDays.conversionRate)}`}
              href="/admin/status/leads"
              Icon={STATUS_ICONS.Inbox}
              tone={thirtyDays.leads > 0 ? 'green' : 'blue'}
            />
            <MetricCard
              title="运营待处理"
              value={contentTotals.issues + siteIssues + overview.leads.new}
              detail={`内容缺项 ${formatNumber(contentTotals.issues)} / 站点 ${formatNumber(siteIssues)} / 新线索 ${formatNumber(overview.leads.new)}`}
              href="/admin/status/content"
              Icon={STATUS_ICONS.AlertCircle}
              tone={contentTotals.issues + siteIssues + overview.leads.new > 0 ? 'orange' : 'green'}
            />
        </div>
      </AdminPageHero>

      <OperationsPulseBoard
        today={today}
        yesterday={yesterday}
        sevenDays={sevenDays}
        thirtyDays={thirtyDays}
        todayComparison={todayComparison}
        thirtyComparison={thirtyComparison}
        newLeads={overview.leads.new}
        contentIssues={contentTotals.issues}
        siteIssues={siteIssues}
        pageDrafts={overview.site.pages.total}
      />

      <AnalyticsCommandWorkbench
        analytics={analytics}
        today={today}
        yesterday={yesterday}
        sevenDays={sevenDays}
        thirtyDays={thirtyDays}
        newLeads={overview.leads.new}
        contentIssues={contentTotals.issues}
        siteIssues={siteIssues}
        pageDrafts={overview.site.pages.total}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section className="space-y-4">
            <SectionTitle
              title="数据分析总览"
              detail="按 300 后台的数据分析心智组织：先选站点和时间，再看访问汇总、趋势、行为路径、入口页面和转化处理。"
            />
            <AnalysisToolbar activeRange="30" />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <WindowSummaryTable today={today} yesterday={yesterday} sevenDays={sevenDays} thirtyDays={thirtyDays} />

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <TrendPreview rows={analytics.dailyTrend} />
                  <BehaviorFlowPreview
                    behaviorSteps={analytics.behaviorSteps}
                    topPages={analytics.topPages}
                    landingPages={analytics.landingPages}
                    sourceTypes={analytics.sourceTypes}
                    windowMetric={thirtyDays}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <AnalysisModuleCard
                    title="网站访问统计"
                    value={`${formatNumber(thirtyDays.pageViews)} PV`}
                    detail="PV、UV、Top Pages、来源入口和趋势。"
                    href="/admin/status/traffic?range=30"
                    tone="blue"
                  />
                  <AnalysisModuleCard
                    title="落地页跳出分析"
                    value={`${formatNumber(analytics.landingPages.length)} 页`}
                    detail="入口页访问与后续动作，优先识别高访问低动作页面。"
                    href="/admin/status/traffic#landing-analysis"
                    tone="orange"
                  />
                  <AnalysisModuleCard
                    title="访问行为分析"
                    value={formatNumber(thirtyDayActions)}
                    detail="CTA 点击、联系跳转、表单成功按路径聚合。"
                    href="/admin/status/traffic#behavior-analysis"
                    tone="green"
                  />
                  <AnalysisModuleCard
                    title="线索转化分析"
                    value={formatAnalyticsPercent(thirtyDays.conversionRate)}
                    detail="真实线索 / 页面访问，排除测试线索。"
                    href="/admin/site/conversion"
                    tone="green"
                  />
                  <AnalysisModuleCard
                    title="Google收录分析"
                    value={`${formatNumber(overview.site.seo.missing)} 缺项`}
                    detail="先从 SEO 字段和站点地图状态进入，不接第三方 API。"
                    href="/admin/site/seo"
                    tone="blue"
                  />
                  <AnalysisModuleCard
                    title="运营待处理"
                    value={formatNumber(contentTotals.issues + siteIssues + overview.leads.new)}
                    detail="内容缺项、站点问题和新线索统一排优先级。"
                    href="/admin/status/content"
                    tone="orange"
                  />
                </div>
              </div>

              <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1E2C31]">30 天入口概览</h2>
                    <p className="mt-1 text-xs leading-5 text-[#61767D]">只展示路径、来源和动作数量，不展示表单隐私字段。</p>
                  </div>
                  <Link href="/admin/status/traffic?range=30" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                    详细分析
                  </Link>
                </div>
                <div className="mt-4 space-y-4">
                  <MiniRankList title="Top Pages" rows={analytics.topPages} empty="暂无页面访问事件。" />
                  <MiniRankList title="来源类型" rows={analytics.sourceTypes} empty="暂无 CTA / 表单来源数据。" formatLabel={sourceTypeLabel} />
                  <MiniRankList title="落地页动作" rows={analytics.landingPages} empty="暂无落地页事件。" />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="核心工作台" detail="所有入口都回到现有业务页面处理，数据中心只做判断和分流。" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ActionCard
                title="处理内容缺口"
                detail={`当前 ${formatNumber(contentTotals.issues)} 个内容项需要补齐关键字段。`}
                href="/admin/status/content"
                Icon={STATUS_ICONS.FileText}
                primary
              />
              <ActionCard
                title="跟进新线索"
                detail={`新线索 ${formatNumber(overview.leads.new)}，跟进中 ${formatNumber(overview.leads.contacting)}。`}
                href="/admin/customers/leads?status=new"
                Icon={STATUS_ICONS.Inbox}
              />
              <ActionCard
                title="检查站点健康"
                detail="页面草稿、SEO、sitemap、robots 和媒体空间集中查看。"
                href="/admin/status/site"
                Icon={STATUS_ICONS.Globe2}
              />
              <ActionCard
                title="查看近期变化"
                detail="按更新时间聚合内容、线索、媒体和页面草稿。"
                href="/admin/status/activity"
                Icon={STATUS_ICONS.ListChecks}
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="内容变化" detail="按现有产品、项目案例、新闻表只读统计。" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {Object.values(overview.content).map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#1E2C31]">{item.label}</span>
                    <span className="text-xs font-semibold text-[#1889B6]">进入管理</span>
                  </span>
                  <span className="mt-5 grid grid-cols-3 gap-3">
                    <SmallStat label="总量" value={item.total} />
                    <SmallStat label="草稿" value={item.draft} />
                    <SmallStat label="缺项" value={item.issues} />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="近期变化" detail="只读聚合最近内容和运营动作，不替代完整审计日志。" />
            <ActivityList items={overview.activity} />
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-md border border-[#D8E7E8] bg-white shadow-sm">
            <div className="border-b border-[#E6EEEE] px-5 py-4">
              <h2 className="text-lg font-bold text-[#1E2C31]">今日优先级</h2>
              <p className="mt-1 text-xs text-[#61767D]">按影响运营效率的顺序排列。</p>
            </div>
            <div className="divide-y divide-[#E6EEEE]">
              <PriorityRow
                ok={overview.leads.new === 0}
                title="新线索"
                detail={overview.leads.new > 0 ? '优先进入线索列表处理' : '暂无新线索'}
                count={overview.leads.new}
                href="/admin/customers/leads?status=new"
              />
              <PriorityRow
                ok={contentTotals.issues === 0}
                title="内容缺项"
                detail={contentTotals.issues > 0 ? '优先补齐影响展示和 SEO 的字段' : '内容关键字段状态正常'}
                count={contentTotals.issues}
                href="/admin/status/content"
              />
              <PriorityRow
                ok={overview.site.pages.total === 0}
                title="页面草稿"
                detail={overview.site.pages.total > 0 ? '进入可视化编辑器确认草稿' : '暂无页面草稿'}
                count={overview.site.pages.total}
                href="/admin/site/visual"
              />
              <PriorityRow
                ok={thirtyDays.leads > 0 || thirtyDays.pageViews === 0}
                title="访问转化"
                detail={thirtyDays.pageViews > 0 ? '查看访问、入口和线索转化是否匹配' : '暂无访问事件'}
                count={thirtyDays.leads}
                href="/admin/status/traffic"
              />
            </div>
          </section>
        </aside>
      </div>
    </StatusPageShell>
  )
}

function AnalyticsCommandWorkbench({
  analytics,
  today,
  yesterday,
  sevenDays,
  thirtyDays,
  newLeads,
  contentIssues,
  siteIssues,
  pageDrafts,
}: {
  analytics: SiteAnalyticsDashboard
  today: AnalyticsPeriodMetric
  yesterday: AnalyticsPeriodMetric
  sevenDays: AnalyticsWindowMetric
  thirtyDays: AnalyticsWindowMetric
  newLeads: number
  contentIssues: number
  siteIssues: number
  pageDrafts: number
}) {
  const bestDay = getBestTrafficDay(analytics.dailyTrend)
  const topPage = analytics.topPages[0]
  const topLandingPage = analytics.landingPages[0]
  const quietLandingPage = analytics.landingPages.find((row) => row.value >= 10 && (row.secondary ?? 0) === 0)
  const topSource = analytics.sourceTypes[0]
  const topConversionPath = getTopConversionPath(analytics.conversionPaths)
  const queueTotal = newLeads + contentIssues + siteIssues + pageDrafts
  const timeRows = [
    { label: '今日', value: today.pageViews, visitors: today.visitors, actions: metricActions(today), leads: today.leads, rate: today.conversionRate },
    { label: '昨日', value: yesterday.pageViews, visitors: yesterday.visitors, actions: metricActions(yesterday), leads: yesterday.leads, rate: yesterday.conversionRate },
    { label: '近 7 天', value: sevenDays.pageViews, visitors: sevenDays.visitors, actions: metricActions(sevenDays), leads: sevenDays.leads, rate: sevenDays.conversionRate },
    { label: '近 30 天', value: thirtyDays.pageViews, visitors: thirtyDays.visitors, actions: metricActions(thirtyDays), leads: thirtyDays.leads, rate: thirtyDays.conversionRate },
  ]
  const funnelRows = [
    {
      label: '入口访问',
      value: thirtyDays.pageViews,
      detail: topPage ? `Top page ${topPage.label}` : '暂无访问页面',
      href: '/admin/status/traffic?range=30#trend-analysis',
    },
    {
      label: '有效访客',
      value: thirtyDays.visitors,
      detail: '匿名 hash 统计，不保存 IP',
      href: '/admin/status/traffic?range=30',
    },
    {
      label: '转化动作',
      value: metricActions(thirtyDays),
      detail: `CTA ${formatNumber(thirtyDays.ctaClicks)} / 表单 ${formatNumber(thirtyDays.formSubmits)}`,
      href: '/admin/status/traffic#behavior-analysis',
    },
    {
      label: '真实线索',
      value: thirtyDays.leads,
      detail: `访问转化率 ${formatAnalyticsPercent(thirtyDays.conversionRate)}`,
      href: '/admin/site/conversion',
    },
    {
      label: '处理队列',
      value: queueTotal,
      detail: `线索 ${formatNumber(newLeads)} / 内容 ${formatNumber(contentIssues)} / 站点 ${formatNumber(siteIssues)}`,
      href: queueTotal > 0 ? '/admin/status/content' : '/admin/status/activity',
    },
  ]
  const signalRows = [
    {
      signal: '高访问页面',
      value: topPage ? `${topPage.label} / ${formatNumber(topPage.value)} PV` : '暂无访问',
      status: topPage ? '可下钻' : '等待数据',
      detail: topPage ? `${formatNumber(topPage.secondary ?? 0)} 个匿名访客` : '第一方事件表没有可展示样本。',
      href: '/admin/status/traffic?range=30#behavior-analysis',
      tone: topPage ? 'blue' : 'gray',
    },
    {
      signal: '高访问低动作',
      value: quietLandingPage ? `${quietLandingPage.label} / ${formatNumber(quietLandingPage.value)} PV` : '未发现',
      status: quietLandingPage ? '优先检查' : '正常',
      detail: quietLandingPage
        ? '该落地页当前没有后续动作，建议核对 CTA、首屏和内容匹配。'
        : topLandingPage
          ? `当前入口页已有动作样本：${topLandingPage.label}`
          : '暂无落地页样本。',
      href: '/admin/status/traffic#landing-analysis',
      tone: quietLandingPage ? 'orange' : 'green',
    },
    {
      signal: '线索承接',
      value: `${formatNumber(newLeads)} 新线索`,
      status: newLeads > 0 ? '立即处理' : '正常',
      detail: topConversionPath
        ? `当前最高转化入口：${topConversionPath.label}`
        : '暂无可排序的转化路径样本。',
      href: '/admin/customers/leads?status=new',
      tone: newLeads > 0 ? 'orange' : 'green',
    },
    {
      signal: '内容与站点缺口',
      value: `${formatNumber(contentIssues + siteIssues + pageDrafts)} 项`,
      status: contentIssues + siteIssues + pageDrafts > 0 ? '排队处理' : '正常',
      detail: `内容 ${formatNumber(contentIssues)} / 站点 ${formatNumber(siteIssues)} / 页面草稿 ${formatNumber(pageDrafts)}`,
      href: '/admin/status/content',
      tone: contentIssues + siteIssues + pageDrafts > 0 ? 'orange' : 'green',
    },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1E2C31]">分析指挥台</h2>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            英文站、访问口径、转化动作和处理队列集中在同一屏；只读统计，不写业务数据。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 font-semibold text-[#1E2C31]">
            www.vessel303.com
          </span>
          <span className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-[#61767D]">
            主口径：近 30 天
          </span>
          <Link href="/admin/status/traffic?range=30" className="inline-flex h-8 items-center rounded-md bg-[#1889B6] px-3 font-semibold text-white hover:bg-[#14799F]">
            详细数据分析
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="border-b border-[#E6EEEE] xl:border-r xl:border-b-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] bg-white text-[#61767D]">
                  <th className="px-5 py-3 text-left font-medium">时间口径</th>
                  <th className="px-4 py-3 text-right font-medium">PV</th>
                  <th className="px-4 py-3 text-right font-medium">访客</th>
                  <th className="px-4 py-3 text-right font-medium">动作</th>
                  <th className="px-4 py-3 text-right font-medium">线索</th>
                  <th className="px-5 py-3 text-right font-medium">转化率</th>
                </tr>
              </thead>
              <tbody>
                {timeRows.map((row) => (
                  <tr key={row.label} className="border-b border-[#E6EEEE] last:border-0">
                    <td className="px-5 py-3 font-semibold text-[#1E2C31]">{row.label}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#1E2C31]">{formatNumber(row.value)}</td>
                    <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.visitors)}</td>
                    <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.actions)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.leads)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-[#1889B6]">{formatAnalyticsPercent(row.rate)}</td>
                  </tr>
                ))}
                <tr className="bg-[#FBFDFD]">
                  <td className="px-5 py-3 font-semibold text-[#1E2C31]">近 30 天最高日</td>
                  <td className="px-4 py-3 text-right font-bold text-[#1E2C31]">{bestDay ? formatNumber(bestDay.pageViews) : '--'}</td>
                  <td className="px-4 py-3 text-right text-[#61767D]">{bestDay ? formatNumber(bestDay.visitors) : '--'}</td>
                  <td className="px-4 py-3 text-right text-[#61767D]">{bestDay ? formatNumber(bestDay.actions) : '--'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{bestDay ? formatNumber(bestDay.leads) : '--'}</td>
                  <td className="px-5 py-3 text-right text-xs font-semibold text-[#61767D]">{bestDay ? formatTrendDate(bestDay.date) : '暂无趋势'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] border-t border-[#E6EEEE] md:grid-cols-5 md:divide-x md:divide-y-0">
            {funnelRows.map((row) => (
              <Link key={row.label} href={row.href} className="min-h-28 p-4 transition hover:bg-[#F7FAFA]">
                <span className="block text-xs font-semibold text-[#61767D]">{row.label}</span>
                <span className="mt-2 block text-2xl font-black text-[#1E2C31]">{formatNumber(row.value)}</span>
                <span className="mt-2 block text-xs leading-5 text-[#61767D]">{row.detail}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <SignalMiniCard
              label="主要来源"
              value={topSource ? `${sourceTypeLabel(topSource.key)} / ${formatNumber(topSource.value)}` : '暂无来源'}
              detail="按 CTA、联系跳转和表单 source type 聚合。"
            />
            <SignalMiniCard
              label="最高转化入口"
              value={topConversionPath ? topConversionPath.label : '暂无转化路径'}
              detail={topConversionPath ? `动作 ${formatNumber(topConversionPath.metric.ctaClicks)} / 线索 ${formatNumber(topConversionPath.metric.leads)}` : '等待更多事件样本。'}
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-md border border-[#E6EEEE]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
                  <th className="px-3 py-2 text-left font-medium">运营信号</th>
                  <th className="px-3 py-2 text-left font-medium">状态</th>
                  <th className="px-3 py-2 text-right font-medium">处理</th>
                </tr>
              </thead>
              <tbody>
                {signalRows.map((row) => (
                  <tr key={row.signal} className="border-b border-[#E6EEEE] last:border-0">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[#1E2C31]">{row.signal}</div>
                      <div className="mt-1 text-xs text-[#61767D]">{row.value}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${signalToneClass(row.tone)}`}>
                        {row.status}
                      </span>
                      <div className="mt-1 text-xs leading-5 text-[#61767D]">{row.detail}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link href={row.href} className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                        进入
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function SignalMiniCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-[#FBFDFD] p-3">
      <div className="text-xs font-semibold text-[#61767D]">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-[#1E2C31]">{value}</div>
      <div className="mt-1 text-xs leading-5 text-[#61767D]">{detail}</div>
    </div>
  )
}

function getBestTrafficDay(rows: AnalyticsTrendRow[]) {
  if (rows.length === 0) return null
  return rows.reduce((best, row) => {
    if (row.pageViews > best.pageViews) return row
    if (row.pageViews === best.pageViews && row.actions > best.actions) return row
    return best
  }, rows[0])
}

function getTopConversionPath(conversionPaths: Record<string, AnalyticsConversionMetric>) {
  const rows = CONVERSION_PATHS
    .map((item) => ({
      key: item.key,
      label: item.area,
      metric: conversionPaths[item.key] ?? {
        views: 0,
        ctaClicks: 0,
        formSubmits: 0,
        leads: 0,
        conversionRate: 0,
      },
    }))
    .sort((a, b) => conversionMetricScore(b.metric) - conversionMetricScore(a.metric))
  return rows.find((row) => conversionMetricScore(row.metric) > 0)
}

function conversionMetricScore(metric: AnalyticsConversionMetric) {
  return metric.leads * 1000 + metric.formSubmits * 100 + metric.ctaClicks + metric.views * 0.01
}

function signalToneClass(tone: string) {
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'blue') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-[#F0F2F2] text-[#61767D]'
}

function AnalysisToolbar({ activeRange }: { activeRange: 'today' | 'yesterday' | '7' | '30' }) {
  const ranges = [
    { key: 'today', label: '今天' },
    { key: 'yesterday', label: '昨天' },
    { key: '7', label: '最近 7 天' },
    { key: '30', label: '最近 30 天' },
  ] as const

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 min-w-60 items-center rounded-md border border-[#D8E7E8] bg-[#FBFDFD] px-3 text-sm font-medium text-[#1E2C31]">
            英文站 www.vessel303.com
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
            指标：浏览次数(PV) + 转化动作
          </span>
        </div>
        <Link href="/admin/status/traffic?range=30" className="text-sm font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          进入网站访问统计
        </Link>
      </div>
    </div>
  )
}

function OperationsPulseBoard({
  today,
  yesterday,
  sevenDays,
  thirtyDays,
  todayComparison,
  thirtyComparison,
  newLeads,
  contentIssues,
  siteIssues,
  pageDrafts,
}: {
  today: AnalyticsPeriodMetric
  yesterday: AnalyticsPeriodMetric
  sevenDays: AnalyticsWindowMetric
  thirtyDays: AnalyticsWindowMetric
  todayComparison?: AnalyticsComparisonMetric
  thirtyComparison?: AnalyticsComparisonMetric
  newLeads: number
  contentIssues: number
  siteIssues: number
  pageDrafts: number
}) {
  const rows = [
    { label: '今日', metric: today, href: '/admin/status/traffic?range=today', note: '实时' },
    { label: '昨日', metric: yesterday, href: '/admin/status/traffic?range=yesterday', note: '对照' },
    { label: '近 7 天', metric: sevenDays, href: '/admin/status/traffic?range=7', note: '短期' },
    { label: '近 30 天', metric: thirtyDays, href: '/admin/status/traffic?range=30', note: '主口径' },
  ]

  const queue = [
    { label: '新线索', value: newLeads, href: '/admin/customers/leads?status=new' },
    { label: '内容缺项', value: contentIssues, href: '/admin/status/content' },
    { label: '站点问题', value: siteIssues, href: '/admin/status/site' },
    { label: '页面草稿', value: pageDrafts, href: '/admin/site/visual' },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E2C31]">运营日报看板</h2>
            <p className="mt-1 text-xs text-[#61767D]">把 300 后台常用的时间口径、访问、动作、线索和转化率压到一张表里。</p>
          </div>
          <Link href="/admin/status/traffic?range=30" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
            进入详细数据分析
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
                <th className="px-4 py-3 text-left font-medium">口径</th>
                <th className="px-4 py-3 text-right font-medium">PV</th>
                <th className="px-4 py-3 text-right font-medium">访客</th>
                <th className="px-4 py-3 text-right font-medium">转化动作</th>
                <th className="px-4 py-3 text-right font-medium">表单</th>
                <th className="px-4 py-3 text-right font-medium">真实线索</th>
                <th className="px-4 py-3 text-right font-medium">访问转化率</th>
                <th className="px-4 py-3 text-right font-medium">下钻</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[#E6EEEE] last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#1E2C31]">{row.label}</div>
                    <div className="mt-1 text-xs text-[#8A9EA4]">{row.note}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1E2C31]">{formatNumber(row.metric.pageViews)}</td>
                  <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.visitors)}</td>
                  <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(metricActions(row.metric))}</td>
                  <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.formSubmits)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.metric.leads)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1889B6]">{formatAnalyticsPercent(row.metric.conversionRate)}</td>
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
      </div>

      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3">
          <h2 className="text-sm font-bold text-[#1E2C31]">今日变化与处理队列</h2>
          <p className="mt-1 text-xs text-[#61767D]">先看变化，再处理会影响运营效率的事项。</p>
        </div>
        <div className="grid grid-cols-2 border-b border-[#E6EEEE]">
          <PulseChangeCard title="今日 PV" metric={todayComparison?.pageViews} />
          <PulseChangeCard title="今日线索" metric={todayComparison?.leads} />
          <PulseChangeCard title="30 天 PV" metric={thirtyComparison?.pageViews} />
          <PulseChangeCard title="30 天转化率" metric={thirtyComparison?.conversionRate} rate />
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {queue.map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#F7FAFA]">
              <span className="text-sm font-semibold text-[#1E2C31]">{item.label}</span>
              <span className={`text-sm font-bold ${item.value > 0 ? 'text-[#E36F2C]' : 'text-emerald-700'}`}>{formatNumber(item.value)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function PulseChangeCard({ title, metric, rate = false }: { title: string; metric?: AnalyticsDeltaMetric; rate?: boolean }) {
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

function WindowSummaryTable({
  today,
  yesterday,
  sevenDays,
  thirtyDays,
}: {
  today: AnalyticsPeriodMetric
  yesterday: AnalyticsPeriodMetric
  sevenDays: AnalyticsWindowMetric
  thirtyDays: AnalyticsWindowMetric
}) {
  const rows = [
    { label: '今天', metric: today, note: '实时口径' },
    { label: '昨天', metric: yesterday, note: '昨日对照' },
    { label: '最近 7 天', metric: sevenDays, note: '短期观察' },
    { label: '最近 30 天', metric: thirtyDays, note: '运营主口径' },
  ]

  return (
    <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3">
        <h2 className="text-sm font-bold text-[#1E2C31]">访问与转化汇总</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-[#61767D]">
              <th className="px-4 py-3 text-left font-medium">统计口径</th>
              <th className="px-4 py-3 text-right font-medium">PV</th>
              <th className="px-4 py-3 text-right font-medium">访客</th>
              <th className="px-4 py-3 text-right font-medium">CTA</th>
              <th className="px-4 py-3 text-right font-medium">联系跳转</th>
              <th className="px-4 py-3 text-right font-medium">表单</th>
              <th className="px-4 py-3 text-right font-medium">线索</th>
              <th className="px-4 py-3 text-right font-medium">转化率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-[#E6EEEE] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#1E2C31]">{row.label}</div>
                  <div className="mt-1 text-xs text-[#8A9EA4]">{row.note}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#1E2C31]">{formatNumber(row.metric.pageViews)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.visitors)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.ctaClicks)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.contactRedirects)}</td>
                <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(row.metric.formSubmits)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#E36F2C]">{formatNumber(row.metric.leads)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1889B6]">{formatAnalyticsPercent(row.metric.conversionRate)}</td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-3">
                <div className="font-semibold text-[#1E2C31]">已排除测试</div>
                <div className="mt-1 text-xs text-[#8A9EA4]">不计入运营判断</div>
              </td>
              <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(thirtyDays.testEvents)}</td>
              <td className="px-4 py-3 text-right text-[#8A9EA4]">--</td>
              <td className="px-4 py-3 text-right text-[#8A9EA4]">--</td>
              <td className="px-4 py-3 text-right text-[#8A9EA4]">--</td>
              <td className="px-4 py-3 text-right text-[#8A9EA4]">--</td>
              <td className="px-4 py-3 text-right text-[#61767D]">{formatNumber(thirtyDays.testLeads)}</td>
              <td className="px-4 py-3 text-right text-[#8A9EA4]">--</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrendPreview({ rows }: { rows: AnalyticsTrendRow[] }) {
  const displayRows = rows.slice(-10)
  if (displayRows.length === 0) {
    return (
      <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">
        暂无可用趋势数据。
      </div>
    )
  }

  const maxViews = Math.max(1, ...displayRows.map((row) => row.pageViews))

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">访问趋势预览</h2>
          <p className="mt-1 text-xs text-[#61767D]">最近 {formatNumber(displayRows.length)} 天 PV 与动作对照。</p>
        </div>
        <Link href="/admin/status/traffic?range=30#trend-analysis" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          查看趋势
        </Link>
      </div>
      <div className="mt-5 flex h-48 items-end gap-2 border-b border-[#E6EEEE] pb-3">
        {displayRows.map((row) => {
          const height = Math.max(8, Math.round((row.pageViews / maxViews) * 150))
          const actionHeight = Math.max(4, Math.round((row.actions / maxViews) * 150))
          return (
            <div key={row.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <span className="w-2 rounded-t bg-[#1889B6]" style={{ height }} title={`${formatNumber(row.pageViews)} PV`} />
                <span className="w-2 rounded-t bg-[#E36F2C]" style={{ height: actionHeight }} title={`${formatNumber(row.actions)} 动作`} />
              </div>
              <span className="w-full truncate text-center text-[11px] text-[#8A9EA4]">{formatTrendDate(row.date)}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#61767D]">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1889B6]" />PV</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#E36F2C]" />转化动作</span>
      </div>
    </div>
  )
}

function BehaviorFlowPreview({
  behaviorSteps,
  topPages,
  landingPages,
  sourceTypes,
  windowMetric,
}: {
  behaviorSteps: AnalyticsBehaviorStep[]
  topPages: AnalyticsRankRow[]
  landingPages: AnalyticsRankRow[]
  sourceTypes: AnalyticsRankRow[]
  windowMetric: AnalyticsWindowMetric
}) {
  const hasBehaviorSteps = behaviorSteps.some((step) => step.nodes.length > 0)
  const actionRows = landingPages
    .filter((row) => (row.secondary ?? 0) > 0)
    .map((row) => ({ ...row, value: row.secondary ?? 0 }))
  const conversionRows: AnalyticsRankRow[] = [
    { key: 'leads', label: '真实线索', value: windowMetric.leads },
    { key: 'forms', label: '表单成功', value: windowMetric.formSubmits },
    { key: 'rate', label: '访问转化率', value: Math.round(windowMetric.conversionRate * 10000) / 100 },
  ]

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">访问行为路径</h2>
          <p className="mt-1 text-xs text-[#61767D]">入口页面、动作来源和线索结果放在同屏判断。</p>
        </div>
        <Link href="/admin/status/traffic#behavior-analysis" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          行为分析
        </Link>
      </div>
      {hasBehaviorSteps ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {behaviorSteps.map((step) => (
            <FlowColumn
              key={step.step}
              title={step.label}
              rows={step.nodes}
              empty="暂无路径"
              meta={`${formatNumber(step.visits)} 次 / ${formatAnalyticsPercent(step.retainedRate)}`}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <FlowColumn title="入口页面" rows={topPages} empty="暂无入口" />
          <FlowColumn title="后续动作" rows={actionRows} empty="暂无动作" />
          <FlowColumn title="来源类型" rows={sourceTypes} empty="暂无来源" formatLabel={sourceTypeLabel} />
          <FlowColumn title="线索结果" rows={conversionRows} empty="暂无线索" percentKey="rate" />
        </div>
      )}
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

function AnalysisModuleCard({
  title,
  value,
  detail,
  href,
  tone,
}: {
  title: string
  value: number | string
  detail: string
  href: string
  tone: 'blue' | 'green' | 'orange'
}) {
  const toneClass =
    tone === 'orange'
      ? 'border-l-[#E36F2C]'
      : tone === 'green'
        ? 'border-l-emerald-500'
        : 'border-l-[#1889B6]'

  return (
    <Link
      href={href}
      className={`rounded-md border border-l-4 border-[#D8E7E8] ${toneClass} bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60`}
    >
      <span className="block text-sm font-bold text-[#1E2C31]">{title}</span>
      <span className="mt-3 block text-2xl font-black text-[#1E2C31]">{typeof value === 'number' ? formatNumber(value) : value}</span>
      <span className="mt-2 block text-xs leading-5 text-[#61767D]">{detail}</span>
    </Link>
  )
}

function metricActions(metric: AnalyticsPeriodMetric | AnalyticsWindowMetric) {
  return metric.ctaClicks + metric.contactRedirects + metric.formSubmits
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

function MiniRankList({
  title,
  rows,
  empty,
  formatLabel,
}: {
  title: string
  rows: AnalyticsRankRow[]
  empty: string
  formatLabel?: (value: string) => string
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-[#61767D]">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3 text-xs text-[#61767D]">{empty}</p>
      ) : (
        <div className="mt-2 divide-y divide-[#E6EEEE] rounded-md border border-[#E6EEEE] bg-[#F7FAFA]">
          {rows.slice(0, 4).map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0 truncate text-xs font-medium text-[#1E2C31]">
                {formatLabel ? formatLabel(row.key) : row.label}
              </span>
              <span className="shrink-0 text-xs font-bold text-[#1889B6]">{formatNumber(row.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-3">
      <span className="block text-xs text-[#61767D]">{label}</span>
      <span className="mt-1 block text-xl font-bold text-[#1E2C31]">{formatNumber(value)}</span>
    </span>
  )
}

function PriorityRow({
  ok,
  title,
  detail,
  count,
  href,
}: {
  ok: boolean
  title: string
  detail: string
  count: number
  href: string
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
          <span className="text-sm font-semibold text-[#1E2C31]">{title}</span>
          <span className="text-sm font-bold text-[#E36F2C]">{formatNumber(count)}</span>
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{detail}</span>
      </span>
    </Link>
  )
}
