import Link from 'next/link'
import {
  loadActivityItems,
  loadStatusOverview,
  sumContent,
  type ActivityItem,
  type StatusOverview,
} from '@/lib/admin-status-metrics'
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

type ActivityAuditTone = 'critical' | 'warning' | 'review' | 'ready'

type ActivityAuditRow = {
  key: string
  priority: string
  stage: string
  title: string
  owner: string
  currentValue: string
  evidence: string
  impact: string
  href: string
  actionLabel: string
  tone: ActivityAuditTone
  Icon: typeof STATUS_ICONS.AlertCircle
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

        <ActivityAuditLedger activity={activity} overview={overview} groups={groups} />

        <ActivityOperationsMatrix groups={groups} priorityItems={priorityItems} total={activity.length} />

        <section className="space-y-4">
          <SectionTitle title="变化列表" detail="点击条目进入对应现有后台处理入口。" />
          <ActivityList items={activity} />
        </section>
      </section>
    </StatusPageShell>
  )
}

function formatActivityNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function countActivityBySource(items: ActivityItem[], source: ActivityItem['source']): number {
  return items.filter((item) => item.source === source).length
}

function buildActivityAuditRows({
  activity,
  overview,
  groups,
}: {
  activity: ActivityItem[]
  overview: StatusOverview
  groups: ActivitySourceGroup[]
}): ActivityAuditRow[] {
  const contentTotals = sumContent(overview.content)
  const contentActivityCount =
    countActivityBySource(activity, 'products') +
    countActivityBySource(activity, 'projects') +
    countActivityBySource(activity, 'news')
  const leadActivityCount = countActivityBySource(activity, 'leads')
  const mediaActivityCount = countActivityBySource(activity, 'media')
  const pageActivityCount = countActivityBySource(activity, 'pages')
  const dominantGroup = groups[0]

  return [
    {
      key: 'activity-queue',
      priority: activity.length > 0 ? 'P2' : 'OK',
      stage: '变更样本',
      title: '近期变化样本队列',
      owner: '运营数据中心',
      currentValue: `${formatActivityNumber(activity.length)} 条`,
      evidence: dominantGroup
        ? `最高来源：${dominantGroup.label} ${formatActivityNumber(dominantGroup.count)} 条`
        : '暂无可读近期变化',
      impact: '先判断最近变化集中在哪个运营模块，再进入具体列表处理。',
      href: '/admin/status/activity',
      actionLabel: '查看变化列表',
      tone: activity.length > 0 ? 'review' : 'ready',
      Icon: STATUS_ICONS.ListChecks,
    },
    {
      key: 'lead-audit',
      priority: overview.leads.new > 0 || overview.leads.staleFollowups > 0 ? 'P0' : 'P2',
      stage: '线索跟进',
      title: '新线索与超时跟进',
      owner: '客户与线索',
      currentValue: `新线索 ${formatActivityNumber(overview.leads.new)} / 超时 ${formatActivityNumber(overview.leads.staleFollowups)}`,
      evidence: `近期线索变化 ${formatActivityNumber(leadActivityCount)} 条，30 天新增 ${formatActivityNumber(overview.leads.recent30)} 条`,
      impact: '线索变化优先级高于内容编辑，避免询盘进入后台后无人跟进。',
      href: '/admin/status/leads',
      actionLabel: '查看线索漏斗',
      tone: overview.leads.new > 0 || overview.leads.staleFollowups > 0 ? 'critical' : 'review',
      Icon: STATUS_ICONS.Inbox,
    },
    {
      key: 'content-audit',
      priority: contentTotals.issues > 0 ? 'P1' : contentTotals.draft > 0 ? 'P2' : 'OK',
      stage: '内容发布',
      title: '内容缺项与草稿变化',
      owner: '内容管理',
      currentValue: `缺项 ${formatActivityNumber(contentTotals.issues)} / 草稿 ${formatActivityNumber(contentTotals.draft)}`,
      evidence: `近期内容变化 ${formatActivityNumber(contentActivityCount)} 条，30 天变化 ${formatActivityNumber(contentTotals.recent30)} 条`,
      impact: '把最近内容编辑和当前缺项队列放到同一视图，减少发布前漏检。',
      href: '/admin/status/content',
      actionLabel: '查看内容台账',
      tone: contentTotals.issues > 0 ? 'warning' : contentTotals.draft > 0 ? 'review' : 'ready',
      Icon: STATUS_ICONS.FileText,
    },
    {
      key: 'page-draft-audit',
      priority: overview.site.pages.total > 0 ? 'P1' : 'OK',
      stage: '页面草稿',
      title: '页面模块与结构草稿',
      owner: '网站管理',
      currentValue: `${formatActivityNumber(overview.site.pages.total)} 个草稿`,
      evidence: `近期页面变化 ${formatActivityNumber(pageActivityCount)} 条；模块 ${formatActivityNumber(overview.site.pages.moduleDrafts)} / 结构 ${formatActivityNumber(overview.site.pages.structureDrafts)}`,
      impact: '页面草稿需要在发布前复核导航、CTA、SEO 和前台 smoke。',
      href: '/admin/site/visual',
      actionLabel: '进入视觉管理',
      tone: overview.site.pages.total > 0 ? 'warning' : 'ready',
      Icon: STATUS_ICONS.LayoutTemplate,
    },
    {
      key: 'media-audit',
      priority: mediaActivityCount > 0 ? 'P2' : 'P3',
      stage: '媒体资产',
      title: '素材上传与引用复核',
      owner: '媒体库',
      currentValue: `${formatActivityNumber(mediaActivityCount)} 条变化`,
      evidence: `媒体库 ${formatActivityNumber(overview.site.media.count)} 个素材，风险素材 ${formatActivityNumber(overview.site.media.issueCount)} 个，上传上限 ${formatActivityNumber(overview.site.media.maxUploadMb)} MB`,
      impact: '新素材上传后需要确认派生图、引用关系和公开页面加载表现。',
      href: overview.site.media.issueCount > 0 ? '/admin/site/media?view=issues' : '/admin/site/media',
      actionLabel: overview.site.media.issueCount > 0 ? '处理风险素材' : '查看媒体库',
      tone: overview.site.media.issueCount > 0 ? 'warning' : mediaActivityCount > 0 ? 'review' : 'ready',
      Icon: STATUS_ICONS.Globe2,
    },
    {
      key: 'public-smoke-audit',
      priority: 'P3',
      stage: '发布后复验',
      title: '前台入口 smoke 清单',
      owner: '05 验收',
      currentValue: '人工复验',
      evidence: '每批发布后检查 /、/products、/cases、/news、/global 和后台登录保护。',
      impact: '避免后台变化已上线，但公开列表、详情页、地图例外或登录保护出现回归。',
      href: '/',
      actionLabel: '打开首页',
      tone: 'review',
      Icon: STATUS_ICONS.SearchCheck,
    },
    {
      key: 'audit-boundary',
      priority: 'HOLD',
      stage: '审计边界',
      title: '完整操作日志仍为后续治理',
      owner: '系统设置',
      currentValue: '只读样本',
      evidence: '本页聚合 created_at / updated_at，不记录新的后台操作行为。',
      impact: '当前台账适合运营复盘；如需完整审计日志，需要单独设计服务端记录、权限和留存策略。',
      href: '/admin/status/activity',
      actionLabel: '查看当前样本',
      tone: 'review',
      Icon: STATUS_ICONS.ShieldCheck,
    },
  ]
}

function ActivityAuditLedger({
  activity,
  overview,
  groups,
}: {
  activity: ActivityItem[]
  overview: StatusOverview
  groups: ActivitySourceGroup[]
}) {
  const rows = buildActivityAuditRows({ activity, overview, groups })
  const activeRows = rows.filter((row) => row.tone === 'critical' || row.tone === 'warning' || row.tone === 'review')
  const blockingRows = rows.filter((row) => row.tone === 'critical' || row.tone === 'warning')

  return (
    <section className="space-y-4">
      <SectionTitle
        title="变更审计处理台账"
        detail="把最近变化、线索、内容缺项、页面草稿、媒体资产和发布后 smoke 合并成只读审计队列；本页不写入新的操作日志。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 md:grid-cols-4">
          <AuditSummary label="待关注项" value={activeRows.length} detail="含复盘、优先和阻塞项" warn={blockingRows.length > 0} />
          <AuditSummary label="阻塞/优先" value={blockingRows.length} detail="线索、缺项、页面草稿" warn={blockingRows.length > 0} />
          <AuditSummary label="变化样本" value={activity.length} detail="最近 32 条只读聚合" />
          <AuditSummary label="来源模块" value={groups.length} detail="产品、案例、新闻、线索、媒体、页面" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                <th className="min-w-32 px-5 py-3 text-left font-semibold">优先级</th>
                <th className="min-w-72 px-4 py-3 text-left font-semibold">审计事项</th>
                <th className="min-w-56 px-4 py-3 text-left font-semibold">当前值</th>
                <th className="min-w-72 px-4 py-3 text-left font-semibold">证据 / 影响</th>
                <th className="min-w-32 px-5 py-3 text-right font-semibold">入口</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EEEE]">
              {rows.map((row) => {
                const Icon = row.Icon

                return (
                  <tr key={row.key} className="align-top transition hover:bg-[#FBFDFD]">
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${activityAuditBadgeClass(row.tone)}`}>
                        {row.priority}
                      </span>
                      <p className="mt-2 text-xs font-semibold text-[#61767D]">{row.stage}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${activityAuditToneClass(row.tone)}`}>
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-[#1E2C31]">{row.title}</span>
                          <span className="mt-1 block text-xs leading-5 text-[#61767D]">{row.owner}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">{row.currentValue}</td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">
                      <span className="block font-semibold text-[#1E2C31]">{row.evidence}</span>
                      <span className="mt-1 block">{row.impact}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={row.href}
                        className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
                      >
                        {row.actionLabel}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function AuditSummary({
  label,
  value,
  detail,
  warn,
}: {
  label: string
  value: number | string
  detail: string
  warn?: boolean
}) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-white px-4 py-3">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>
        {typeof value === 'number' ? formatActivityNumber(value) : value}
      </p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function activityAuditToneClass(tone: ActivityAuditTone): string {
  if (tone === 'critical') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'warning') return 'bg-[#FFF6EF] text-[#C75F18]'
  if (tone === 'review') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-emerald-50 text-emerald-700'
}

function activityAuditBadgeClass(tone: ActivityAuditTone): string {
  if (tone === 'critical') return 'border-[#E36F2C]/35 bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'warning') return 'border-[#E36F2C]/25 bg-[#FFF6EF] text-[#C75F18]'
  if (tone === 'review') return 'border-[#1889B6]/20 bg-[#EAF6F8] text-[#1889B6]'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
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
