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
  type AnalyticsRankRow,
} from '@/lib/site-analytics'
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
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#DDF6F8_0%,#F4FBFC_62%,#FFF3E7_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1889B6]">B6 数据分析 / 运营统计</p>
              <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">运营数据中心</h1>
              <p className="mt-2 text-sm text-[#61767D]">
                先看访问、转化、内容缺口、线索漏斗和站点健康；统计只读，不写业务数据。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill ok={analytics.available} label={analytics.available ? '第一方事件可用' : '事件表未就绪'} />
              <StatusPill ok label={`排除测试 ${formatNumber(thirtyDays.testEvents)} 事件 / ${formatNumber(thirtyDays.testLeads)} 线索`} />
              <StatusPill ok label="不接第三方 API" />
              <StatusPill ok label="不触碰 /global" />
            </div>
          </div>

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
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section className="space-y-4">
            <SectionTitle title="数据分析总览" detail="按 300 后台常见心智先看访问、入口、行为、线索和转化，再进入细分页面。" />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <AnalysisEntry
                  title="网站访问统计"
                  value={`${formatNumber(thirtyDays.pageViews)} PV`}
                  detail="查看 7 / 30 天访问、访客、Top Pages。"
                  href="/admin/status/traffic"
                />
                <AnalysisEntry
                  title="落地页分析"
                  value={analytics.landingPages.length}
                  detail="看入口页访问与后续动作，不先做复杂跳出率。"
                  href="/admin/status/traffic"
                />
                <AnalysisEntry
                  title="访问行为"
                  value={formatNumber(thirtyDayActions)}
                  detail="聚合 CTA 点击、联系跳转和表单成功。"
                  href="/admin/status/traffic"
                />
                <AnalysisEntry
                  title="线索转化"
                  value={formatAnalyticsPercent(thirtyDays.conversionRate)}
                  detail="真实线索数 / 页面访问数，排除测试数据。"
                  href="/admin/site/conversion"
                />
              </div>
              <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1E2C31]">30 天入口概览</h2>
                    <p className="mt-1 text-xs leading-5 text-[#61767D]">只展示路径、来源和动作数量，不展示表单隐私字段。</p>
                  </div>
                  <Link href="/admin/status/traffic" className="text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                    详细分析
                  </Link>
                </div>
                <div className="mt-4 space-y-4">
                  <MiniRankList title="Top Pages" rows={analytics.topPages} empty="暂无页面访问事件。" />
                  <MiniRankList title="来源类型" rows={analytics.sourceTypes} empty="暂无 CTA / 表单来源数据。" formatLabel={sourceTypeLabel} />
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

function AnalysisEntry({
  title,
  value,
  detail,
  href,
}: {
  title: string
  value: number | string
  detail: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex min-h-32 flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
    >
      <span className="block text-xs font-semibold text-[#1889B6]">{title}</span>
      <span>
        <span className="block text-2xl font-black text-[#1E2C31]">{typeof value === 'number' ? formatNumber(value) : value}</span>
        <span className="mt-2 block text-xs leading-5 text-[#61767D]">{detail}</span>
      </span>
    </Link>
  )
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
