import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import NewsRecycleClient from '@/components/admin/NewsRecycleClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listDeletedNews } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NewsConsoleShell,
  PrimaryAction,
  SectionTitle,
  formatNumber,
  getNewsStats,
  safeLoad,
  type AdminRole,
} from '../_news-console'
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  FileText,
  Link2,
  ListChecks,
  Newspaper,
  RotateCcw,
  Search,
  SearchCheck,
  ShieldCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻回收站 - VESSEL' }

const LIMIT = 20

type NewsRecyclePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type NewsRecycleSummary = {
  total: number
  published: number
  draft: number
  incomplete: number
  missingSeo: number
  deletedTotal: number
  deletedMatched: number
  pageRows: number
  deletedPublishedOnPage: number
  deletedDraftOnPage: number
  search: string
}

type NewsRecycleGovernanceCard = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  Icon: LucideIcon
}

type NewsRecycleSourceSafetyItem = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  Icon: LucideIcon
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminContentNewsRecyclePage({ searchParams }: NewsRecyclePageProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const sp = await searchParams
  const search = firstParam(sp.search)?.trim() ?? ''

  const [{ rows, total }, stats] = await Promise.all([
    listDeletedNews({
      search,
      limit: LIMIT,
      offset: 0,
    }).catch(() => ({
      rows: [],
      total: 0,
    })),
    safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS),
  ])

  const summary: NewsRecycleSummary = {
    total: stats.total,
    published: stats.published,
    draft: stats.draft,
    incomplete: stats.incomplete,
    missingSeo: stats.missingSeo,
    deletedTotal: stats.deleted,
    deletedMatched: total,
    pageRows: rows.length,
    deletedPublishedOnPage: rows.filter((item) => item.status === 'published').length,
    deletedDraftOnPage: rows.filter((item) => item.status === 'draft').length,
    search,
  }

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="recycle"
    >
      <NewsRecycleHero summary={summary} />
      <NewsRecycleGovernancePanel summary={summary} />
      <NewsRecycleSourceSafetyDesk summary={summary} />

      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SectionTitle title="已删除内容" detail="恢复后统一回到草稿状态，需要重新检查后才能发布。" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/content/news/list?status=draft">恢复后草稿</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/content/news#todo">内容待补</Link>
            </Button>
          </div>
        </div>

        <div className="mb-4 rounded-md border border-[#F1D7C6] bg-[#FFF8F3] p-3 text-xs leading-5 text-[#8A5A36]">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Archive size={14} />
            安全边界
          </span>
          <span className="ml-2">
            本页没有永久删除按钮；恢复不会直接上线，前台 /news 仍只展示已发布且未删除的新闻。
          </span>
        </div>

        <div id="news-recycle-list" className="scroll-mt-24">
          <NewsRecycleClient initialRows={rows} total={total} />
        </div>
      </section>
    </NewsConsoleShell>
  )
}

function NewsRecycleHero({ summary }: { summary: NewsRecycleSummary }) {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#FFF2E7_0%,#F4FBFC_58%,#DDF6F8_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1889B6]">新闻资讯</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">新闻回收站</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
            对照 300.cn 后台的回收站心智，已删除新闻只允许恢复为草稿，再回到内容复核和发布检查。
          </p>
        </div>
        <form action="/admin/content/news/recycle" className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9EA4]" size={16} />
            <Input
              name="search"
              defaultValue={summary.search}
              placeholder="搜索已删除新闻"
              className="h-10 w-64 bg-white pl-9"
            />
          </label>
          <Button type="submit" size="sm" className="h-10">
            搜索
          </Button>
          {summary.search ? (
            <Button asChild variant="outline" size="sm" className="h-10">
              <Link href="/admin/content/news/recycle">清除</Link>
            </Button>
          ) : null}
        </form>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <NewsRecycleHeroStat
          title="回收站"
          value={summary.deletedTotal}
          detail="全部已删除新闻"
          tone={summary.deletedTotal > 0 ? 'orange' : 'blue'}
        />
        <NewsRecycleHeroStat
          title="当前页"
          value={summary.pageRows}
          detail={summary.search ? `命中 ${formatNumber(summary.deletedMatched)}` : '本页可恢复'}
        />
        <NewsRecycleHeroStat
          title="删前已发布"
          value={summary.deletedPublishedOnPage}
          detail={`删前草稿 ${formatNumber(summary.deletedDraftOnPage)}`}
          tone="orange"
        />
        <NewsRecycleHeroStat
          title="当前草稿"
          value={summary.draft}
          detail="恢复后进入这里"
          tone="green"
        />
      </div>
    </section>
  )
}

function NewsRecycleGovernancePanel({ summary }: { summary: NewsRecycleSummary }) {
  const cards: NewsRecycleGovernanceCard[] = [
    {
      label: '安全边界',
      value: '仅恢复',
      detail: '本页不提供永久删除，不开放批量恢复；恢复动作只把新闻放回草稿，不会直接重新发布。',
      href: '#news-recycle-list',
      cta: '查看可恢复项',
      tone: 'green',
      Icon: ShieldCheck,
    },
    {
      label: '待恢复池',
      value: formatNumber(summary.deletedMatched),
      detail: summary.search
        ? `当前关键词“${summary.search}”命中 ${formatNumber(summary.deletedMatched)} 条已删除新闻。`
        : `当前共有 ${formatNumber(summary.deletedTotal)} 条已删除新闻，按删除时间倒序处理。`,
      href: '#news-recycle-list',
      cta: '复核回收站',
      tone: summary.deletedMatched > 0 ? 'orange' : 'green',
      Icon: RotateCcw,
    },
    {
      label: '恢复后草稿',
      value: formatNumber(summary.draft),
      detail: '恢复后的新闻统一进入草稿队列，发布时间和排期会清空，需要运营重新检查。',
      href: '/admin/content/news/list?status=draft',
      cta: '查看草稿',
      tone: 'blue',
      Icon: FileText,
    },
    {
      label: '发布前复核',
      value: formatNumber(summary.incomplete),
      detail: `当前有效新闻 ${formatNumber(summary.total)} 条、已发布 ${formatNumber(summary.published)} 条；恢复后先补 ${formatNumber(summary.incomplete)} 条内容缺口和 ${formatNumber(summary.missingSeo)} 条 SEO 缺口。`,
      href: '/admin/content/news#todo',
      cta: '进入待补治理',
      tone: summary.incomplete > 0 ? 'orange' : 'green',
      Icon: SearchCheck,
    },
  ]

  return (
    <section id="news-recycle-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">回收治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">误删保护到重新发布闭环</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            回收站把误删保护、恢复草稿、内容补齐、分类复核和 SEO 检查串成一条新闻 CMS 安全运营路径；本区只做只读统计和入口串联。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/news/categories" Icon={Tags} label="分类管理" />
          <PrimaryAction href="/admin/content/news#b3-3-plan" Icon={CheckCircle2} label="发布规划" primary />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <NewsRecycleGovernanceLink key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function NewsRecycleGovernanceLink({ card }: { card: NewsRecycleGovernanceCard }) {
  const Icon = card.Icon
  const toneClass =
    card.tone === 'green'
      ? 'text-emerald-700'
      : card.tone === 'orange'
        ? 'text-[#E36F2C]'
        : card.tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <Link
      href={card.href}
      className="group min-h-[148px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold tracking-[0.08em] text-[#8A9EA4]">{card.label}</span>
          <span className={`mt-2 block text-2xl font-bold ${toneClass}`}>{card.value}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block min-h-10 text-xs leading-5 text-[#61767D]">{card.detail}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
        {card.cta}
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function NewsRecycleSourceSafetyDesk({ summary }: { summary: NewsRecycleSummary }) {
  const recycleRiskSignals = summary.deletedMatched + summary.incomplete + summary.missingSeo
  const items: NewsRecycleSourceSafetyItem[] = [
    {
      label: '分类治理复核',
      value: 'B296',
      detail: '恢复前先回看新闻分类到来源转化治理台，避免恢复后继续未分类或分类承接断层。',
      href: '/admin/content/news/categories#news-category-source-conversion-desk',
      cta: '看分类治理',
      tone: 'green',
      Icon: Tags,
    },
    {
      label: '列表处理队列',
      value: 'B295',
      detail: '恢复为草稿后进入新闻列表来源转化处理队列，按内容、SEO、分类和线索承接复核。',
      href: '/admin/content/news/list#news-list-source-conversion-queue',
      cta: '看列表队列',
      tone: 'blue',
      Icon: ListChecks,
    },
    {
      label: '新闻优化台',
      value: 'B294',
      detail: '从新闻内容到来源线索优化台确认恢复内容不会直接进入公开发布链路。',
      href: '/admin/content/news#news-source-lead-optimization-desk',
      cta: '看优化台',
      tone: 'green',
      Icon: Newspaper,
    },
    {
      label: '流量异常回看',
      value: 'B293',
      detail: '被删除或恢复的新闻若曾带来访问，需要回看新闻路径和来源动作是否影响线索判断。',
      href: '/admin/status/traffic#traffic-to-lead-exception-desk',
      cta: '看流量分诊',
      tone: recycleRiskSignals > 0 ? 'orange' : 'blue',
      Icon: SearchCheck,
    },
    {
      label: '来源线索处理',
      value: 'B292',
      detail: '按 source_type=news 复核新闻来源线索，避免内容恢复后线索归因和运营跟进断开。',
      href: '/admin/status/leads#source-lead-quality-workdesk',
      cta: '看线索处理',
      tone: 'blue',
      Icon: Link2,
    },
    {
      label: '恢复后草稿',
      value: formatNumber(summary.draft),
      detail: '恢复只进入草稿；必须重新补内容、补 SEO、核分类，再按发布前流程处理。',
      href: '/admin/content/news/list?status=draft',
      cta: '看草稿',
      tone: summary.draft > 0 ? 'orange' : 'gray',
      Icon: FileText,
    },
  ]

  return (
    <section id="news-recycle-source-safety-desk" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#E36F2C] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">B297 NEWS RECYCLE SOURCE SAFETY</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻回收与来源安全复核台</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把新闻回收站、B296 分类治理、B295 列表处理、B294 新闻优化、B293 流量分诊和 B292 来源线索处理合成一条只读安全复核链；恢复只回草稿，不直接上线，不新增永久删除、批量恢复或线索写入能力。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryAction href="/admin/content/news/categories#news-category-source-conversion-desk" Icon={Tags} label="B296 分类治理" primary />
            <PrimaryAction href="/admin/content/news/list#news-list-source-conversion-queue" Icon={ListChecks} label="B295 列表队列" />
            <PrimaryAction href="/admin/content/news#news-source-lead-optimization-desk" Icon={Newspaper} label="B294 优化台" />
            <PrimaryAction href="/admin/customers/leads?source_type=news" Icon={Link2} label="新闻线索" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-[#FBFDFD] lg:border-l lg:border-t-0">
          <NewsRecycleSourceStat label="回收站总量" value={formatNumber(summary.deletedTotal)} detail="全部已删除新闻" warn={summary.deletedTotal > 0} />
          <NewsRecycleSourceStat label="当前命中" value={formatNumber(summary.deletedMatched)} detail={summary.search ? `关键词 ${summary.search}` : '未使用搜索'} warn={summary.deletedMatched > 0} />
          <NewsRecycleSourceStat label="内容待补" value={formatNumber(summary.incomplete)} detail="恢复后仍需复核" warn={summary.incomplete > 0} />
          <NewsRecycleSourceStat label="SEO 待补" value={formatNumber(summary.missingSeo)} detail="影响来源判断" warn={summary.missingSeo > 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <NewsRecycleSourceSafetyCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  )
}

function NewsRecycleSourceStat({
  label,
  value,
  detail,
  warn = false,
}: {
  label: string
  value: string
  detail: string
  warn?: boolean
}) {
  return (
    <div className="min-w-0 border-b border-[#E6EEEE] px-4 py-3 even:border-l">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 truncate text-2xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`} title={value}>{value}</p>
      <p className="mt-1 truncate text-xs text-[#8A9EA4]" title={detail}>{detail}</p>
    </div>
  )
}

function NewsRecycleSourceSafetyCard({ item }: { item: NewsRecycleSourceSafetyItem }) {
  const Icon = item.Icon
  const toneClass =
    item.tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : item.tone === 'orange'
        ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
        : item.tone === 'gray'
          ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#61767D]'
          : 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link
      href={item.href}
      className="group min-h-[168px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-[#FBFDFD] md:odd:border-r xl:border-r"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold text-[#1E2C31]">{item.label}</span>
          <span className={`mt-2 inline-flex min-h-7 max-w-full items-center rounded-md border px-2.5 text-[11px] font-bold ${toneClass}`}>
            <span className="truncate">{item.value}</span>
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block min-h-12 text-xs leading-5 text-[#61767D]">{item.detail}</span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6] group-hover:text-[#E36F2C]">
        {item.cta}
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function NewsRecycleHeroStat({
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
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'orange'
        ? 'text-[#E36F2C]'
        : 'text-[#1889B6]'

  return (
    <div className="rounded-md border border-white/70 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}
