import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import {
  AdminActionLink,
  AdminMetricCard,
  AdminPageHero,
  AdminSectionTitle,
} from '@/components/admin/AdminUI'
import { pool } from '@/lib/db'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  CircleDashed,
  FileText,
  Inbox,
  ListChecks,
  MessageSquareText,
  SearchCheck,
  Settings,
  UserRoundCheck,
  UserRoundX,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '客户线索 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type LeadSummary = {
  total: number
  new: number
  contacting: number
  quoted: number
  won: number
  lost: number
  recent7: number
  recent30: number
  staleFollowups: number
}

type StatusCardConfig = {
  label: string
  value: keyof Pick<LeadSummary, 'new' | 'contacting' | 'quoted' | 'won' | 'lost'>
  href: string
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
}

type ActionItem = {
  label: string
  detail: string
  href: string
  Icon: LucideIcon
  primary?: boolean
}

type TodoItem = {
  title: string
  detail: string
  href?: string
  count?: number
  ok: boolean
}

const EMPTY_LEAD_SUMMARY: LeadSummary = {
  total: 0,
  new: 0,
  contacting: 0,
  quoted: 0,
  won: 0,
  lost: 0,
  recent7: 0,
  recent30: 0,
  staleFollowups: 0,
}

const STATUS_CARDS: StatusCardConfig[] = [
  {
    label: '新线索',
    value: 'new',
    href: '/admin/customers/leads?status=new',
    detail: '需要优先处理',
    tone: 'orange',
  },
  {
    label: '跟进中',
    value: 'contacting',
    href: '/admin/customers/leads?status=contacting',
    detail: '正在沟通',
    tone: 'blue',
  },
  {
    label: '已报价',
    value: 'quoted',
    href: '/admin/customers/leads?status=quoted',
    detail: '等待反馈',
    tone: 'blue',
  },
  {
    label: '已成交',
    value: 'won',
    href: '/admin/customers/leads?status=won',
    detail: '成交线索',
    tone: 'green',
  },
  {
    label: '已关闭',
    value: 'lost',
    href: '/admin/customers/leads?status=lost',
    detail: '归档线索',
    tone: 'gray',
  },
]

const ACTIONS: ActionItem[] = [
  {
    label: '处理新线索',
    detail: '进入新线索列表，优先跟进询盘。',
    href: '/admin/customers/leads?status=new',
    Icon: Inbox,
    primary: true,
  },
  {
    label: '跟进中',
    detail: '查看正在沟通的线索。',
    href: '/admin/customers/leads?status=contacting',
    Icon: Clock3,
  },
  {
    label: '已报价',
    detail: '查看已进入报价阶段的线索。',
    href: '/admin/customers/leads?status=quoted',
    Icon: FileText,
  },
  {
    label: '线索管理',
    detail: '查看、筛选、更新全部线索。',
    href: '/admin/customers/leads',
    Icon: SearchCheck,
  },
]

function getCustomerSideNav(summary: LeadSummary): AdminSideNavGroup[] {
  return [
    {
      title: '线索运营',
      items: [
        { key: 'overview', label: '客户概览', href: '/admin/customers', Icon: Users },
        { key: 'new', label: '新线索', href: '/admin/customers/leads?status=new', badge: summary.new, Icon: Inbox },
        { key: 'all', label: '全部线索', href: '/admin/customers/leads', badge: summary.total, Icon: MessageSquareText },
        {
          key: 'contacting',
          label: '跟进中',
          href: '/admin/customers/leads?status=contacting',
          badge: summary.contacting,
          Icon: Clock3,
        },
        { key: 'quoted', label: '已报价', href: '/admin/customers/leads?status=quoted', badge: summary.quoted, Icon: FileText },
        { key: 'won', label: '已成交', href: '/admin/customers/leads?status=won', badge: summary.won, Icon: BadgeCheck },
        { key: 'lost', label: '已关闭', href: '/admin/customers/leads?status=lost', badge: summary.lost, Icon: UserRoundX },
      ],
    },
    {
      title: '待处理',
      items: [
        { key: 'todo', label: '新线索待跟进', href: '#todo', badge: summary.new, Icon: ListChecks },
        { key: 'recent7', label: '近 7 天新增', href: '#recent', badge: summary.recent7, Icon: Clock3 },
        { key: 'recent30', label: '近 30 天新增', href: '#recent', badge: summary.recent30, Icon: SearchCheck },
      ],
    },
    {
      title: '后续规划',
      items: [
        { key: 'customer-files', label: '客户档案', planned: true, Icon: Users },
        { key: 'members', label: '会员管理', planned: true, adminOnly: true, Icon: UserRoundCheck },
        { key: 'followups', label: '跟进记录', planned: true, Icon: FileText },
        { key: 'chat', label: '在线沟通', planned: true, Icon: MessageSquareText },
      ],
    },
  ]
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-customers] ${label} failed`, err)
    return fallback
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>(
    'SELECT to_regclass($1) AS table_name',
    [tableName],
  )
  return Boolean(res.rows[0]?.table_name)
}

async function getLeadSummary(): Promise<LeadSummary> {
  if (!(await tableExists('public.leads'))) return EMPTY_LEAD_SUMMARY

  const res = await pool.query<{
    total: string
    new_count: string
    contacting: string
    quoted: string
    won: string
    lost: string
    recent7: string
    recent30: string
    stale_followups: string
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'new')::text AS new_count,
       COUNT(*) FILTER (WHERE status = 'contacting')::text AS contacting,
       COUNT(*) FILTER (WHERE status = 'quoted')::text AS quoted,
       COUNT(*) FILTER (WHERE status = 'won')::text AS won,
       COUNT(*) FILTER (WHERE status = 'lost')::text AS lost,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS recent7,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent30,
       COUNT(*) FILTER (
         WHERE status IN ('new', 'contacting')
           AND updated_at < NOW() - INTERVAL '7 days'
       )::text AS stale_followups
     FROM leads
     WHERE deleted_at IS NULL`,
  )
  const row = res.rows[0]
  return {
    total: parseInt(row?.total ?? '0', 10),
    new: parseInt(row?.new_count ?? '0', 10),
    contacting: parseInt(row?.contacting ?? '0', 10),
    quoted: parseInt(row?.quoted ?? '0', 10),
    won: parseInt(row?.won ?? '0', 10),
    lost: parseInt(row?.lost ?? '0', 10),
    recent7: parseInt(row?.recent7 ?? '0', 10),
    recent30: parseInt(row?.recent30 ?? '0', 10),
    staleFollowups: parseInt(row?.stale_followups ?? '0', 10),
  }
}

function buildTodos(summary: LeadSummary): TodoItem[] {
  return [
    {
      title: '新线索待跟进',
      detail: summary.new > 0 ? '有新询盘需要处理' : '暂无新线索',
      href: '/admin/customers/leads?status=new',
      count: summary.new,
      ok: summary.new === 0,
    },
    {
      title: '跟进中线索',
      detail: summary.contacting > 0 ? '保持沟通并更新状态' : '暂无跟进中线索',
      href: '/admin/customers/leads?status=contacting',
      count: summary.contacting,
      ok: summary.contacting === 0,
    },
    {
      title: '超过 7 天未更新',
      detail: summary.staleFollowups > 0 ? '建议检查跟进记录' : '暂无长时间未更新线索',
      href: '/admin/customers/leads',
      count: summary.staleFollowups,
      ok: summary.staleFollowups === 0,
    },
  ]
}

function Hero({ summary }: { summary: LeadSummary }) {
  return (
    <AdminPageHero
      kicker="Lead Operations"
      title="客户线索中心"
      description="先处理新线索，再跟进报价、成交和关闭状态；本轮只做线索运营，不扩展订单、支付或会员价格体系。"
      actions={
        <>
          <AdminActionLink href="/admin/customers/leads?status=new" Icon={Inbox} label="处理新线索" primary />
          <AdminActionLink href="/admin/customers/leads" Icon={MessageSquareText} label="查看全部线索" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <AdminMetricCard title="线索总量" value={summary.total} detail="全部有效线索" Icon={MessageSquareText} />
        <AdminMetricCard
          title="新线索"
          value={summary.new}
          detail="待处理询盘"
          Icon={Inbox}
          tone={summary.new > 0 ? 'orange' : 'green'}
        />
        <AdminMetricCard
          id="recent"
          title="近 7 天新增"
          value={summary.recent7}
          detail={`近 30 天 ${formatNumber(summary.recent30)}`}
          Icon={Clock3}
          tone="green"
        />
        <AdminMetricCard title="跟进中" value={summary.contacting} detail="需要持续更新" Icon={FileText} tone="blue" />
      </div>
    </AdminPageHero>
  )
}

function StatusGrid({ summary }: { summary: LeadSummary }) {
  return (
    <section className="space-y-4">
      <AdminSectionTitle title="线索状态" detail="按当前跟进状态查看线索数量。" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {STATUS_CARDS.map((card) => (
          <StatusCard key={card.value} card={card} count={summary[card.value]} />
        ))}
      </div>
    </section>
  )
}

function StatusCard({ card, count }: { card: StatusCardConfig; count: number }) {
  const toneClass =
    card.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : card.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : card.tone === 'gray'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <Link
      href={card.href}
      className="group rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
    >
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
        {card.label}
      </span>
      <span className="mt-5 block text-4xl font-bold text-[#1E2C31]">{formatNumber(count)}</span>
      <span className="mt-2 flex items-center justify-between gap-3 text-sm text-[#61767D]">
        {card.detail}
        <ArrowRight size={15} className="transition group-hover:translate-x-0.5 group-hover:text-[#E36F2C]" />
      </span>
    </Link>
  )
}

function ActionGrid() {
  return (
    <section className="space-y-4">
      <AdminSectionTitle title="常用动作" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action) => (
          <ActionCard key={action.label} action={action} />
        ))}
      </div>
    </section>
  )
}

function ActionCard({ action }: { action: ActionItem }) {
  const Icon = action.Icon
  return (
    <Link
      href={action.href}
      className={`flex min-h-28 items-start gap-4 rounded-md border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
        action.primary
          ? 'border-[#E36F2C]/35 bg-[#FFF6EF] hover:border-[#E36F2C]/60'
          : 'border-[#D8E7E8] bg-white hover:border-[#1889B6]/60'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${
          action.primary ? 'bg-[#E36F2C] text-white' : 'bg-[#EAF6F8] text-[#1889B6]'
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#1E2C31]">{action.label}</span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{action.detail}</span>
      </span>
    </Link>
  )
}

function WorkflowPanel() {
  const steps = ['查看新线索', '联系客户', '报价跟进', '成交或关闭']

  return (
    <section className="space-y-4">
      <AdminSectionTitle title="线索处理流程" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step} className="rounded-md border border-[#D8E7E8] bg-white p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E36F2C] text-sm font-bold text-white">
              {index + 1}
            </span>
            <p className="mt-4 text-sm font-semibold text-[#1E2C31]">{step}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function TodoPanel({ items, isAdmin }: { items: TodoItem[]; isAdmin: boolean }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section id="todo" className="scroll-mt-24 rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1E2C31]">待处理事项</h2>
          <p className="mt-1 text-xs text-[#61767D]">优先处理橙色提示项。</p>
        </div>
        <div className="divide-y divide-[#E6EEEE]">
          {items.map((item) => (
            <TodoRow key={item.title} item={item} />
          ))}
        </div>
      </section>
      {isAdmin && <MemberReserveCard />}
    </aside>
  )
}

function TodoRow({ item }: { item: TodoItem }) {
  const icon = item.ok ? (
    <CheckCircle2 size={18} className="text-emerald-600" />
  ) : (
    <CircleDashed size={18} className="text-[#E36F2C]" />
  )
  const content = (
    <span className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#1E2C31]">{item.title}</span>
          {item.count != null && <span className="text-sm font-bold text-[#E36F2C]">{formatNumber(item.count)}</span>}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#61767D]">{item.detail}</span>
      </span>
    </span>
  )

  if (!item.href) return <div className="block px-5 py-4">{content}</div>
  return (
    <Link href={item.href} className="block px-5 py-4 transition hover:bg-[#F7FAFA]">
      {content}
    </Link>
  )
}

function MemberReserveCard() {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F0F2F2] text-[#61767D]">
          <Users size={19} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">会员管理</h2>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">
            基础会员管理后续开放，本轮不提供会员操作。
          </p>
        </div>
      </div>
    </section>
  )
}

function MaintenanceBlock() {
  return (
    <section id="maintenance" className="rounded-md border border-dashed border-[#D8E7E8] bg-white/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1E2C31]">管理设置</h2>
          <p className="mt-1 text-xs text-[#61767D]">仅管理员使用，客户运营优先使用上方入口。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MaintenanceLink href="/admin/settings" label="站点设置" Icon={Settings} />
          <MaintenanceLink href="/admin/users" label="后台账号" Icon={UserRoundCheck} />
        </div>
      </div>
    </section>
  )
}

function MaintenanceLink({
  href,
  label,
  Icon,
}: {
  href: string
  label: string
  Icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}

export default async function AdminCustomersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const summary = await safeLoad('lead summary', () => getLeadSummary(), EMPTY_LEAD_SUMMARY)
  const adminRole: AdminRole = role
  const isAdmin = adminRole === 'admin'
  const todos = buildTodos(summary)
  const sideNavGroups = getCustomerSideNav(summary)

  return (
    <AdminSectionShell
      topNavActive="customers"
      role={adminRole}
      email={session.user.email}
      title="客户与线索"
      description="处理新线索，并查看报价、成交和关闭状态。会员、订单和支付不在本轮范围。"
      sideNavGroups={sideNavGroups}
      activeItem="overview"
    >
      <Hero summary={summary} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <StatusGrid summary={summary} />
          <ActionGrid />
          <WorkflowPanel />
          {isAdmin && <MaintenanceBlock />}
        </div>
        <TodoPanel items={todos} isAdmin={isAdmin} />
      </div>
    </AdminSectionShell>
  )
}
