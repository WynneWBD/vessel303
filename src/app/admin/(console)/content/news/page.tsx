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
  CheckCircle2,
  CircleDashed,
  FileText,
  ImageIcon,
  ListChecks,
  Newspaper,
  Plus,
  SearchCheck,
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
            分类、回收站、批量操作、定时发布和权限分级单独排期。
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
      <OperationBoundary />
    </NewsConsoleShell>
  )
}
