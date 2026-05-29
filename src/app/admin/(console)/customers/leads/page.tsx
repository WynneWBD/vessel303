import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import LeadsClient, { type LeadDashboardSummary } from '@/components/admin/LeadsClient'
import { countLeadsByStatus, listLeads, type Lead, type LeadStatus } from '@/lib/leads-db'
import {
  BadgeCheck,
  Clock3,
  FileText,
  Inbox,
  ListChecks,
  MessageSquareText,
  SearchCheck,
  Settings,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '线索管理 2.0 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type LeadsResult = Awaited<ReturnType<typeof listLeads>>

const EMPTY_LEADS_RESULT: LeadsResult = {
  leads: [] as Lead[],
  total: 0,
  page: 1,
  limit: 50,
}

const EMPTY_SUMMARY: LeadDashboardSummary = {
  total: 0,
  new: 0,
  contacting: 0,
  quoted: 0,
  won: 0,
  lost: 0,
}

function buildLeadsPath(status?: LeadStatus) {
  return status ? `/admin/customers/leads?status=${status}` : '/admin/customers/leads'
}

function getCustomerSideNav(summary: LeadDashboardSummary): AdminSideNavGroup[] {
  return [
    {
      title: '线索运营',
      items: [
        { key: 'overview', label: '客户概览', href: '/admin/customers', Icon: Users },
        { key: 'new', label: '新线索', href: buildLeadsPath('new'), badge: summary.new, Icon: Inbox },
        { key: 'all', label: '全部线索', href: buildLeadsPath(), badge: summary.total, Icon: MessageSquareText },
        {
          key: 'contacting',
          label: '跟进中',
          href: buildLeadsPath('contacting'),
          badge: summary.contacting,
          Icon: Clock3,
        },
        { key: 'quoted', label: '已报价', href: buildLeadsPath('quoted'), badge: summary.quoted, Icon: FileText },
        { key: 'won', label: '已成交', href: buildLeadsPath('won'), badge: summary.won, Icon: BadgeCheck },
        { key: 'lost', label: '已关闭', href: buildLeadsPath('lost'), badge: summary.lost, Icon: UserRoundX },
      ],
    },
    {
      title: '待处理',
      items: [
        { key: 'todo', label: '新线索待跟进', href: buildLeadsPath('new'), badge: summary.new, Icon: ListChecks },
        { key: 'recent7', label: '近 7 天新增', href: '/admin/customers', Icon: Clock3 },
        { key: 'recent30', label: '近 30 天新增', href: '/admin/customers', Icon: SearchCheck },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'customer-files', label: '客户档案', planned: true, Icon: Users },
        { key: 'members', label: '会员管理', planned: true, adminOnly: true, Icon: UserRoundCheck },
        { key: 'followups', label: '跟进记录', planned: true, Icon: FileText },
        { key: 'settings', label: '客户设置', planned: true, adminOnly: true, Icon: Settings },
      ],
    },
  ]
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-customers-leads] ${label} failed`, err)
    return fallback
  }
}

async function getLeadSummary(): Promise<LeadDashboardSummary> {
  const [newCount, contacting, quoted, won, lost] = await Promise.all([
    countLeadsByStatus('new'),
    countLeadsByStatus('contacting'),
    countLeadsByStatus('quoted'),
    countLeadsByStatus('won'),
    countLeadsByStatus('lost'),
  ])

  return {
    total: newCount + contacting + quoted + won + lost,
    new: newCount,
    contacting,
    quoted,
    won,
    lost,
  }
}

function getActiveItem(status: string) {
  if (['new', 'contacting', 'quoted', 'won', 'lost'].includes(status)) return status
  return 'all'
}

export default async function AdminCustomerLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const sp = await searchParams
  const getStr = (key: string) => {
    const value = sp[key]
    return Array.isArray(value) ? value[0] : value
  }

  const filters = {
    status: getStr('status') ?? 'all',
    inquiry_type: getStr('inquiry_type') ?? 'all',
    country: getStr('country') ?? '',
    search: getStr('search') ?? '',
  }
  const page = Math.max(1, Number(getStr('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(20, Number(getStr('limit') ?? 50) || 50))

  const [summary, result] = await Promise.all([
    safeLoad('lead summary', () => getLeadSummary(), EMPTY_SUMMARY),
    safeLoad(
      'lead list',
      () =>
        listLeads({
          status: filters.status,
          inquiry_type: filters.inquiry_type,
          country: filters.country || undefined,
          search: filters.search || undefined,
          page,
          limit,
        }),
      { ...EMPTY_LEADS_RESULT, page, limit },
    ),
  ])

  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="customers"
      role={adminRole}
      email={session.user.email}
      title="客户与线索"
      description="处理官网询盘、更新跟进状态，并把旧线索入口统一收口到 2.0。"
      sideNavGroups={getCustomerSideNav(summary)}
      activeItem={getActiveItem(filters.status)}
    >
      <LeadsClient
        initialLeads={result.leads}
        initialTotal={result.total}
        initialFilters={filters}
        initialPage={result.page}
        initialLimit={result.limit}
        allowTestLeadCreation={process.env.NODE_ENV !== 'production'}
        allowDelete={false}
        summary={summary}
      />
    </AdminSectionShell>
  )
}
