import Link from 'next/link'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminMetricCard, AdminSectionTitle, AdminStatusChip } from '@/components/admin/AdminUI'
import { formatNumber, sumContent, type ActivityItem, type StatusOverview } from '@/lib/admin-status-metrics'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Globe2,
  Inbox,
  LayoutTemplate,
  ListChecks,
  Newspaper,
  Package,
  PieChart,
  SearchCheck,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

export type AdminRole = 'admin' | 'operator'

export type StatusBadges = {
  contentIssues?: number
  contentDrafts?: number
  leadNew?: number
  staleLeads?: number
  siteIssues?: number
  activityCount?: number
}

export function buildStatusBadges(overview: StatusOverview, role: AdminRole): StatusBadges {
  const contentTotals = sumContent(overview.content)
  const siteIssues =
    overview.site.pages.total +
    overview.site.seo.missing +
    (overview.site.media.bytes > 800 * 1024 * 1024 ? 1 : 0) +
    (role === 'admin' ? overview.site.configChecks.filter((item) => !item.ok).length : 0)

  return {
    contentIssues: contentTotals.issues,
    contentDrafts: contentTotals.draft,
    leadNew: overview.leads.new,
    staleLeads: overview.leads.staleFollowups,
    siteIssues,
    activityCount: overview.activity.length,
  }
}

export function StatusPageShell({
  role,
  email,
  activeItem,
  badges,
  children,
}: {
  role: AdminRole
  email?: string | null
  activeItem: string
  badges: StatusBadges
  children: ReactNode
}) {
  return (
    <AdminSectionShell
      topNavActive="status"
      role={role}
      email={email}
      title="运营数据中心"
      description="集中查看待办、内容缺口、线索漏斗和站点健康状态。"
      sideNavGroups={getStatusSideNav(badges)}
      activeItem={activeItem}
    >
      {children}
    </AdminSectionShell>
  )
}

export function getStatusSideNav(badges: StatusBadges): AdminSideNavGroup[] {
  const siteIssues = badges.siteIssues && badges.siteIssues > 0 ? badges.siteIssues : undefined

  return [
    {
      title: '数据中心',
      items: [
        { key: 'overview', label: '运营总览', href: '/admin/status', Icon: Activity },
        {
          key: 'content',
          label: '内容统计',
          href: '/admin/status/content',
          badge: badges.contentIssues && badges.contentIssues > 0 ? badges.contentIssues : undefined,
          Icon: FileText,
        },
        {
          key: 'leads',
          label: '线索漏斗',
          href: '/admin/status/leads',
          badge: badges.leadNew && badges.leadNew > 0 ? badges.leadNew : undefined,
          Icon: Inbox,
        },
        {
          key: 'site',
          label: '站点健康',
          href: '/admin/status/site',
          badge: siteIssues,
          Icon: Globe2,
        },
        {
          key: 'activity',
          label: '近期变化',
          href: '/admin/status/activity',
          badge: badges.activityCount && badges.activityCount > 0 ? formatNumber(badges.activityCount) : undefined,
          Icon: ListChecks,
        },
        {
          key: 'traffic',
          label: '网站数据分析',
          href: '/admin/status/traffic',
          Icon: BarChart3,
        },
      ],
    },
    {
      title: '处理入口',
      items: [
        {
          key: 'content-workbench',
          label: '内容管理',
          href: '/admin/content',
          badge: badges.contentDrafts && badges.contentDrafts > 0 ? badges.contentDrafts : undefined,
          Icon: Newspaper,
        },
        {
          key: 'lead-workbench',
          label: '客户与线索',
          href: '/admin/customers',
          badge: badges.staleLeads && badges.staleLeads > 0 ? badges.staleLeads : undefined,
          Icon: PieChart,
        },
        { key: 'site-workbench', label: '网站管理', href: '/admin/site', Icon: LayoutTemplate },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'search-console', label: '搜索表现', planned: true, Icon: SearchCheck },
        { key: 'audit-log', label: '完整操作日志', planned: true, adminOnly: true, Icon: ShieldCheck },
      ],
    },
  ]
}

export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return <AdminSectionTitle title={title} detail={detail} />
}

export function MetricCard({
  title,
  value,
  detail,
  href,
  Icon,
  tone = 'blue',
}: {
  title: string
  value: number | string
  detail: string
  href?: string
  Icon: LucideIcon
  tone?: 'blue' | 'green' | 'orange' | 'gray'
}) {
  return <AdminMetricCard title={title} value={value} detail={detail} href={href} Icon={Icon} tone={tone} />
}

export function ActionCard({
  title,
  detail,
  href,
  Icon,
  primary = false,
}: {
  title: string
  detail: string
  href: string
  Icon: LucideIcon
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-28 items-start gap-4 rounded-md border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
        primary
          ? 'border-[#E36F2C]/35 bg-[#FFF6EF] hover:border-[#E36F2C]/60'
          : 'border-[#D8E7E8] bg-white hover:border-[#1889B6]/60'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${
          primary ? 'bg-[#E36F2C] text-white' : 'bg-[#EAF6F8] text-[#1889B6]'
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#1E2C31]">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{detail}</span>
      </span>
    </Link>
  )
}

export function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return <AdminStatusChip ok={ok} label={label} />
}

export function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-[#D8E7E8] bg-white p-5 text-sm text-[#61767D] shadow-sm">
        暂无可读取的近期变化。
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#E6EEEE] rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      {items.map((item) => (
        <Link key={item.key} href={item.href} className="flex gap-4 px-5 py-4 transition hover:bg-[#F7FAFA]">
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${sourceDotClass(item.source)}`} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <span className="truncate text-sm font-semibold text-[#1E2C31]">{item.title}</span>
              <span className="shrink-0 text-xs text-[#8A9EA4]">{formatDateTime(item.changedAt)}</span>
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#61767D]">
              <span className="rounded-full bg-[#F0F7F8] px-2 py-0.5 font-semibold text-[#1889B6]">
                {item.sourceLabel}
              </span>
              {item.detail}
            </span>
          </span>
          <ArrowRight size={15} className="mt-1 shrink-0 text-[#9FB0B4]" />
        </Link>
      ))}
    </div>
  )
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sourceDotClass(source: ActivityItem['source']): string {
  if (source === 'leads') return 'bg-[#E36F2C]'
  if (source === 'media') return 'bg-[#3078C8]'
  if (source === 'pages') return 'bg-[#159477]'
  if (source === 'projects') return 'bg-[#7C65D1]'
  if (source === 'news') return 'bg-[#1889B6]'
  return 'bg-[#1E2C31]'
}

export const STATUS_ICONS = {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FileText,
  Globe2,
  Inbox,
  LayoutTemplate,
  ListChecks,
  Newspaper,
  Package,
  SearchCheck,
  Settings,
  ShieldCheck,
}
