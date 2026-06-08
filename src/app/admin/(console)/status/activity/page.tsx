import Link from 'next/link'
import { loadActivityItems, loadStatusOverview } from '@/lib/admin-status-metrics'
import {
  ActivityList,
  buildStatusBadges,
  formatDateTime,
  MetricCard,
  SectionTitle,
  StatusPageShell,
  STATUS_ICONS,
} from '../_components'
import { getStatusAccess } from '../_access'
import type { ActivityItem } from '@/lib/admin-status-metrics'

export const dynamic = 'force-dynamic'

export const metadata = { title: '近期变化 - 运营数据中心 - VESSEL' }

type ActivitySourceGroup = {
  source: ActivityItem['source']
  label: string
  count: number
  latestAt: string | null
  href: string
  detail: string
}

const ACTIVITY_SOURCE_META: Record<ActivityItem['source'], { label: string; href: string; detail: string }> = {
  products: { label: '产品', href: '/admin/content/products/list', detail: '产品内容更新和草稿变化' },
  projects: { label: '项目案例', href: '/admin/content/projects/list', detail: '案例内容、坐标和图库变化' },
  news: { label: '新闻', href: '/admin/content/news/list', detail: '新闻发布和草稿变化' },
  leads: { label: '线索', href: '/admin/customers/leads', detail: '客户线索状态或备注变化' },
  media: { label: '媒体', href: '/admin/site/media', detail: '图片素材上传或素材库变化' },
  pages: { label: '页面草稿', href: '/admin/site/visual', detail: '页面模块或结构草稿变化' },
}

export default async function AdminStatusActivityPage() {
  const { role, email } = await getStatusAccess()
  const [overview, activity] = await Promise.all([loadStatusOverview(), loadActivityItems(32)])
  const counts = activity.reduce<Record<string, number>>((acc, item) => {
    acc[item.source] = (acc[item.source] ?? 0) + 1
    return acc
  }, {})
  const groups = buildActivitySourceGroups(activity)
  const priorityItems = buildActivityPriority(activity).slice(0, 6)

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

        <ActivityOperationsMatrix groups={groups} priorityItems={priorityItems} total={activity.length} />

        <section className="space-y-4">
          <SectionTitle title="变化列表" detail="点击条目进入对应现有后台处理入口。" />
          <ActivityList items={activity} />
        </section>
      </section>
    </StatusPageShell>
  )
}

function buildActivitySourceGroups(items: ActivityItem[]): ActivitySourceGroup[] {
  const groups = new Map<ActivityItem['source'], ActivitySourceGroup>()

  for (const item of items) {
    const meta = ACTIVITY_SOURCE_META[item.source]
    const current = groups.get(item.source) ?? {
      source: item.source,
      label: meta.label,
      count: 0,
      latestAt: null,
      href: meta.href,
      detail: meta.detail,
    }
    current.count += 1
    if (!current.latestAt || Date.parse(item.changedAt) > Date.parse(current.latestAt)) {
      current.latestAt = item.changedAt
    }
    groups.set(item.source, current)
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return Date.parse(b.latestAt ?? '') - Date.parse(a.latestAt ?? '')
  })
}

function activityPriorityScore(item: ActivityItem) {
  const sourceScore: Record<ActivityItem['source'], number> = {
    leads: 60,
    pages: 50,
    products: 40,
    projects: 40,
    news: 30,
    media: 20,
  }
  const changedAt = Date.parse(item.changedAt)
  const ageHours = Number.isFinite(changedAt) ? Math.max(0, Math.floor((Date.now() - changedAt) / 36e5)) : 999
  const recencyScore = ageHours <= 24 ? 20 : ageHours <= 24 * 7 ? 10 : 0
  return sourceScore[item.source] + recencyScore
}

function buildActivityPriority(items: ActivityItem[]) {
  return [...items].sort((a, b) => {
    const scoreDiff = activityPriorityScore(b) - activityPriorityScore(a)
    if (scoreDiff !== 0) return scoreDiff
    return Date.parse(b.changedAt) - Date.parse(a.changedAt)
  })
}

function ActivityOperationsMatrix({
  groups,
  priorityItems,
  total,
}: {
  groups: ActivitySourceGroup[]
  priorityItems: ActivityItem[]
  total: number
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <SectionTitle title="变化来源矩阵" detail="按来源聚合最近 32 条变化，先判断变化集中在哪个运营模块。" />
        <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
          <div className="border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4">
            <p className="text-xs font-semibold text-[#61767D]">当前样本</p>
            <p className="mt-1 text-2xl font-bold text-[#1E2C31]">{total.toLocaleString('zh-CN')} 条近期变化</p>
          </div>
          {groups.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#61767D]">暂无可读取的近期变化。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                    <th className="min-w-32 px-5 py-3 text-left font-semibold">来源</th>
                    <th className="px-4 py-3 text-right font-semibold">数量</th>
                    <th className="min-w-40 px-4 py-3 text-left font-semibold">最近变化</th>
                    <th className="min-w-64 px-4 py-3 text-left font-semibold">说明</th>
                    <th className="min-w-28 px-5 py-3 text-right font-semibold">入口</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EEEE]">
                  {groups.map((group) => (
                    <tr key={group.source}>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#F0F7F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
                          {group.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-lg font-bold text-[#1E2C31]">
                        {group.count.toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-[#61767D]">
                        {group.latestAt ? formatDateTime(group.latestAt) : '—'}
                      </td>
                      <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">{group.detail}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={group.href}
                          className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
                        >
                          进入处理
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <SectionTitle title="优先关注" detail="按线索、页面草稿、内容和时间新旧排序。" />
        <div className="divide-y divide-[#E6EEEE] rounded-md border border-[#D8E7E8] bg-white shadow-sm">
          {priorityItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#61767D]">暂无优先项。</p>
          ) : (
            priorityItems.map((item) => (
              <Link key={item.key} href={item.href} className="block px-5 py-4 transition hover:bg-[#F7FAFA]">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#1E2C31]">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#61767D]">
                      {item.sourceLabel} / {item.detail}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[#8A9EA4]">
                    {formatDateTime(item.changedAt)}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      </aside>
    </section>
  )
}
