import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  EMPTY_NEWS_STATS,
  NewsConsoleShell,
  PrimaryAction,
  SectionTitle,
  TodoMetric,
  formatNumber,
  getNewsStats,
  safeLoad,
  type AdminRole,
  type NewsStats,
} from './_news-console'
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FileText,
  ImageIcon,
  ListChecks,
  Newspaper,
  Plus,
  SearchCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻资讯 - VESSEL' }

type StatusEntry = {
  title: string
  value: number
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

function getStatusEntries(stats: NewsStats): StatusEntry[] {
  return [
    {
      title: '全部新闻',
      value: stats.total,
      detail: '进入新闻列表继续筛选和编辑',
      href: '/admin/content/news/list',
      Icon: Newspaper,
      tone: 'blue',
    },
    {
      title: '已发布',
      value: stats.published,
      detail: '正在前台 /news 展示的新闻',
      href: '/admin/content/news/list?status=published',
      Icon: CheckCircle2,
      tone: 'green',
    },
    {
      title: '草稿',
      value: stats.draft,
      detail: '等待补齐或发布的新闻',
      href: '/admin/content/news/list?status=draft',
      Icon: FileText,
      tone: 'orange',
    },
    {
      title: '待补内容',
      value: stats.incomplete,
      detail: '缺标题、封面、摘要或正文',
      href: '#todo',
      Icon: CircleDashed,
      tone: 'neutral',
    },
  ]
}

function Hero({ stats }: { stats: NewsStats }) {
  return (
    <section id="overview" className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#FFF2E7_0%,#F4FBFC_56%,#DDF6F8_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1889B6]">新闻资讯</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">新闻运营中心</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            先看发布状态和待补内容，再进入列表处理新建、编辑、预览和发布。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/news/new" Icon={Plus} label="新增新闻" primary />
          <PrimaryAction href="/admin/content/news/list?status=draft" Icon={FileText} label="查看草稿" />
          <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="新闻列表" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetric title="新闻总数" value={stats.total} detail={`已发布 ${formatNumber(stats.published)}`} />
        <HeroMetric title="草稿新闻" value={stats.draft} detail="等待补齐或发布" tone="orange" />
        <HeroMetric title="近 30 天新增" value={stats.recent} detail="按创建时间统计" tone="green" />
        <HeroMetric title="待补新闻" value={stats.incomplete} detail="只做提醒，不阻止发布" tone="blue" />
      </div>
    </section>
  )
}

function HeroMetric({
  title,
  value,
  detail,
  tone = 'blue',
}: {
  title: string
  value: number
  detail: string
  tone?: 'blue' | 'green' | 'orange'
}) {
  const toneClass =
    tone === 'orange'
      ? 'from-[#FF9F2F] to-[#F06B22]'
      : tone === 'green'
        ? 'from-[#20B486] to-[#118F79]'
        : 'from-[#1889B6] to-[#3078C8]'

  return (
    <div className={`flex min-h-32 flex-col justify-between rounded-md bg-gradient-to-br ${toneClass} p-5 text-white`}>
      <span className="text-sm font-medium text-white/82">{title}</span>
      <span>
        <span className="block text-4xl font-bold">{formatNumber(value)}</span>
        <span className="mt-2 block text-sm text-white/82">{detail}</span>
      </span>
    </div>
  )
}

function StatusGrid({ stats }: { stats: NewsStats }) {
  return (
    <section className="space-y-4">
      <SectionTitle title="发布状态" detail="按 300 后台的列表思路，把状态、待补和入口集中在新闻域内。" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {getStatusEntries(stats).map((entry) => (
          <StatusCard key={entry.title} entry={entry} />
        ))}
      </div>
    </section>
  )
}

function StatusCard({ entry }: { entry: StatusEntry }) {
  const Icon = entry.Icon
  const accent =
    entry.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : entry.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : entry.tone === 'neutral'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  return (
    <Link
      href={entry.href}
      className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
    >
      <span className="flex items-start justify-between gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${accent}`}>
          <Icon size={20} />
        </span>
        <span className="text-3xl font-bold text-[#1E2C31]">{formatNumber(entry.value)}</span>
      </span>
      <h3 className="mt-5 text-sm font-bold text-[#1E2C31]">{entry.title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#61767D]">{entry.detail}</p>
    </Link>
  )
}

function TodoPanel({ stats }: { stats: NewsStats }) {
  return (
    <section id="todo" className="scroll-mt-24 space-y-4">
      <SectionTitle title="待补内容" detail="这些提醒只帮助运营排优先级，不改变保存和发布规则。" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TodoMetric title="缺封面" detail="新闻列表和详情页缺少第一视觉" count={stats.missingCover} Icon={ImageIcon} />
        <TodoMetric title="缺中文摘要" detail="中文列表页预览不够完整" count={stats.missingZhExcerpt} Icon={FileText} />
        <TodoMetric title="缺英文摘要" detail="英文展示需要摘要信息" count={stats.missingEnExcerpt} Icon={FileText} />
        <TodoMetric title="缺中文正文" detail="中文新闻详情内容为空" count={stats.missingZhContent} Icon={Newspaper} />
        <TodoMetric title="缺英文正文" detail="英文新闻详情内容为空" count={stats.missingEnContent} Icon={Newspaper} />
        <TodoMetric title="缺标题" detail="标题是发布和前台入口的基础" count={stats.missingZhTitle + stats.missingEnTitle} Icon={SearchCheck} />
      </div>
    </section>
  )
}

type OperationPlan = {
  title: string
  status: string
  detail: string
  evidence: string
  next: string
  href?: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

function OperationRoadmap({ stats }: { stats: NewsStats }) {
  const plans: OperationPlan[] = [
    {
      title: '分类管理',
      status: 'B3-5',
      detail: '300 列表有“所属分类”和“分类管理”，当前新闻表已接入分类字段。',
      evidence: '已新增 news_categories 和 news.category_id，表单保存与列表筛选已接入。',
      next: '查看分类管理页，确认分类数量、分类状态和新闻引用数量。',
      href: '/admin/content/news/categories',
      Icon: Tags,
      tone: 'blue',
    },
    {
      title: '回收站',
      status: `B3-8 · ${formatNumber(stats.deleted)} 条`,
      detail: '现有删除是软删除，前台和列表已经排除 deleted_at 不为空的新闻。',
      evidence: '已提供回收站列表和恢复为草稿能力，恢复不会直接重新发布到前台。',
      next: '进入回收站检查已删除新闻；永久删除、批量恢复和权限分级后续单独排期。',
      href: '/admin/content/news/recycle',
      Icon: Archive,
      tone: 'green',
    },
    {
      title: '批量操作',
      status: 'B3-9',
      detail: '300 底部有发布、定时任务、置顶、状态、转移、删除、翻译等批量按钮。',
      evidence: '新闻列表已开放低风险的批量转分类；发布、删除、定时任务和状态批改仍保持禁用。',
      next: '进入新闻列表选择内容后转移分类；高风险批量写入等权限分级后再开放。',
      href: '/admin/content/news/list',
      Icon: ListChecks,
      tone: 'orange',
    },
    {
      title: '定时发布',
      status: '需排期',
      detail: '当前只有即时发布和 published_at，没有 scheduled_at 或后台任务。',
      evidence: '不在本轮伪造定时任务，避免运营误以为已能自动上线。',
      next: '后续需要新增字段、任务执行器、失败提示和上线验收。',
      Icon: CalendarClock,
      tone: 'neutral',
    },
  ]

  return (
    <section id="b3-3-plan" className="scroll-mt-24 space-y-4">
      <SectionTitle
        title="B3-3 运营能力规划"
        detail="按 300 新闻后台对照分类、回收站、批量操作和定时发布；本轮只落安全入口和状态说明。"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {plans.map((plan) => (
          <OperationPlanCard key={plan.title} plan={plan} />
        ))}
      </div>
    </section>
  )
}

function OperationPlanCard({ plan }: { plan: OperationPlan }) {
  const Icon = plan.Icon
  const accent =
    plan.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : plan.tone === 'green'
        ? 'bg-[#E7F7F4] text-[#159477]'
        : plan.tone === 'neutral'
          ? 'bg-[#F0F2F2] text-[#61767D]'
          : 'bg-[#EAF4FF] text-[#3078C8]'

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${accent}`}>
          <Icon size={20} />
        </span>
        <span className="rounded-full border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-1 text-xs font-bold text-[#61767D]">
          {plan.status}
        </span>
      </div>
      <h3 className="mt-5 text-sm font-bold text-[#1E2C31]">{plan.title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#61767D]">{plan.detail}</p>
      <p className="mt-3 text-xs leading-5 text-[#3F5359]">{plan.evidence}</p>
      <p className="mt-3 border-t border-[#E6EEEE] pt-3 text-xs leading-5 text-[#61767D]">
        {plan.next}
      </p>
    </>
  )

  if (plan.href) {
    return (
      <Link
        href={plan.href}
        className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/60"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      {content}
    </div>
  )
}

function OperationBoundary() {
  return (
    <section className="rounded-md border border-dashed border-[#D8E7E8] bg-white/76 p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">本轮已收口</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            新闻 2.0 主路径、状态筛选、完整度提醒、前台预览和发布入口。
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">保留旧入口</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            旧 /admin/news 继续作为维护备用，不影响现有编辑和 API。
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1E2C31]">后续再做</h2>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            永久删除、真实批量写入、定时发布和权限分级单独排期。
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentNewsPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const stats = await safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS)

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="news"
    >
      <Hero stats={stats} />
      <StatusGrid stats={stats} />
      <TodoPanel stats={stats} />
      <OperationRoadmap stats={stats} />
      <OperationBoundary />
    </NewsConsoleShell>
  )
}
