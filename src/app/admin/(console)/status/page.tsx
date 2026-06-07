import Link from 'next/link'
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
  type AnalyticsPeriodMetric,
  type AnalyticsRankRow,
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
  const thirtyDayActions = thirtyDays.ctaClicks + thirtyDays.contactRedirects + thirtyDays.formSubmits
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
