import { loadActivityItems, loadStatusOverview } from '@/lib/admin-status-metrics'
import {
  ActivityList,
  buildStatusBadges,
  MetricCard,
  SectionTitle,
  StatusPageShell,
  STATUS_ICONS,
} from '../_components'
import { getStatusAccess } from '../_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '近期变化 - 运营数据中心 - VESSEL' }

export default async function AdminStatusActivityPage() {
  const { role, email } = await getStatusAccess()
  const [overview, activity] = await Promise.all([loadStatusOverview(), loadActivityItems(32)])
  const counts = activity.reduce<Record<string, number>>((acc, item) => {
    acc[item.source] = (acc[item.source] ?? 0) + 1
    return acc
  }, {})

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="activity"
      badges={buildStatusBadges(overview, role)}
    >
      <section className="space-y-5">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#1889B6]">B6-5 近期变化</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">内容、线索、媒体和页面草稿更新</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            只聚合现有表的 created_at / updated_at，不替代完整审计日志，也不记录新的操作行为。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="近期变化" value={activity.length} detail="最多展示最近 32 条只读变化。" Icon={STATUS_ICONS.ListChecks} />
          <MetricCard title="内容变化" value={(counts.products ?? 0) + (counts.projects ?? 0) + (counts.news ?? 0)} detail="产品、项目案例和新闻更新。" href="/admin/content" Icon={STATUS_ICONS.FileText} />
          <MetricCard title="线索变化" value={counts.leads ?? 0} detail="最近更新的线索记录。" href="/admin/customers/leads" Icon={STATUS_ICONS.Inbox} />
          <MetricCard title="页面 / 媒体" value={(counts.pages ?? 0) + (counts.media ?? 0)} detail="页面草稿和媒体素材变化。" href="/admin/site" Icon={STATUS_ICONS.LayoutTemplate} />
        </div>

        <section className="space-y-4">
          <SectionTitle title="变化列表" detail="点击条目进入对应现有后台处理入口。" />
          <ActivityList items={activity} />
        </section>
      </section>
    </StatusPageShell>
  )
}
