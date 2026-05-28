import Link from 'next/link'
import {
  formatBytes,
  formatNumber,
  loadStatusOverview,
  sumContent,
} from '@/lib/admin-status-metrics'
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
  const overview = await loadStatusOverview()
  const contentTotals = sumContent(overview.content)
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
                先看今日待办、内容缺口、线索漏斗和站点健康；统计只读，不写业务数据。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill ok label="只读统计" />
              <StatusPill ok label="不接外部流量分析" />
              <StatusPill ok label="不触碰 /global" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricCard
              title="内容草稿"
              value={contentTotals.draft}
              detail={`内容总量 ${formatNumber(contentTotals.total)} / 近 30 天新增 ${formatNumber(contentTotals.recent30)}`}
              href="/admin/status/content"
              Icon={STATUS_ICONS.FileText}
              tone={contentTotals.draft > 0 ? 'orange' : 'green'}
            />
            <MetricCard
              title="新线索"
              value={overview.leads.new}
              detail={`线索总量 ${formatNumber(overview.leads.total)} / 超 7 天未更新 ${formatNumber(overview.leads.staleFollowups)}`}
              href="/admin/status/leads"
              Icon={STATUS_ICONS.Inbox}
              tone={overview.leads.new > 0 ? 'orange' : 'green'}
            />
            <MetricCard
              title="站点待处理"
              value={siteIssues}
              detail={`页面草稿 ${formatNumber(overview.site.pages.total)} / SEO 缺项 ${formatNumber(overview.site.seo.missing)}`}
              href="/admin/status/site"
              Icon={STATUS_ICONS.Globe2}
              tone={siteIssues > 0 ? 'orange' : 'green'}
            />
            <MetricCard
              title="媒体空间"
              value={formatBytes(overview.site.media.bytes)}
              detail={`${formatNumber(overview.site.media.count)} 个素材 / 单图上限 ${formatNumber(overview.site.media.maxUploadMb)} MB`}
              href="/admin/media"
              Icon={STATUS_ICONS.Package}
              tone={overview.site.media.bytes > 800 * 1024 * 1024 ? 'orange' : 'blue'}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
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
                href="/admin/leads?status=new"
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
                href="/admin/leads?status=new"
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
                href="/admin/pages/visual"
              />
            </div>
          </section>
        </aside>
      </div>
    </StatusPageShell>
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
