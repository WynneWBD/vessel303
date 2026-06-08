import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminPageHero } from '@/components/admin/AdminUI'
import NewsListClient from '@/components/admin/NewsListClient'
import { listNews, listNewsCategories, type NewsRow, type NewsStatus } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NewsConsoleShell,
  PrimaryAction,
  getNewsStats,
  safeLoad,
  type AdminRole,
  type NewsStats,
} from '../_news-console'
import { Archive, ArrowRight, BarChart3, CheckCircle2, FileText, ListChecks, Plus, Tags } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻列表 - VESSEL' }

const LIMIT = 20
const STATUSES = new Set(['draft', 'published'])
const SCHEDULES = new Set(['scheduled'])

type NewsListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type NewsPriorityItem = {
  item: NewsRow
  issues: string[]
  label: string
  score: number
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function positivePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN')
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasRichTextContent(value: unknown) {
  let found = false

  const visit = (node: unknown) => {
    if (found) return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!node || typeof node !== 'object') return

    const current = node as { text?: unknown; content?: unknown }
    if (typeof current.text === 'string' && current.text.trim()) {
      found = true
      return
    }
    visit(current.content)
  }

  visit(value)
  return found
}

function getNewsIssues(item: NewsRow): string[] {
  const issues: string[] = []
  if (!hasText(item.cover_image_url)) issues.push('缺封面')
  if (!hasText(item.title_zh)) issues.push('缺中文标题')
  if (!hasText(item.title_en)) issues.push('缺英文标题')
  if (!hasText(item.excerpt_zh)) issues.push('缺中文摘要')
  if (!hasText(item.excerpt_en)) issues.push('缺英文摘要')
  if (!hasRichTextContent(item.content_zh)) issues.push('缺中文正文')
  if (!hasRichTextContent(item.content_en)) issues.push('缺英文正文')
  if (!item.category_id) issues.push('未分类')
  if (
    !hasText(item.seo_title_zh)
    || !hasText(item.seo_title_en)
    || !hasText(item.seo_description_zh)
    || !hasText(item.seo_description_en)
  ) {
    issues.push('缺 SEO')
  }
  return issues
}

function isScheduledNews(item: NewsRow) {
  return item.status === 'draft' && Boolean(item.scheduled_at)
}

function getNewsPriorityScore(item: NewsRow, issues: string[]) {
  let score = 0
  if (issues.includes('缺封面')) score += 24
  if (issues.includes('缺中文正文') || issues.includes('缺英文正文')) score += 18
  if (issues.includes('缺中文摘要') || issues.includes('缺英文摘要')) score += 14
  if (issues.includes('缺 SEO')) score += 14
  if (issues.includes('未分类')) score += 12
  if (item.status === 'draft') score += 8
  if (isScheduledNews(item)) score += 10
  score += Math.min(8, Math.max(0, issues.length - 1) * 2)
  return score
}

function getNewsPriorityLabel(item: NewsRow, issues: string[]) {
  if (issues.includes('缺封面')) return '先补封面'
  if (issues.includes('缺中文正文') || issues.includes('缺英文正文')) return '补正文'
  if (isScheduledNews(item)) return '检查排期'
  if (issues.includes('缺 SEO')) return '补 SEO'
  if (issues.includes('未分类')) return '定分类'
  return '补内容字段'
}

function buildNewsPriorityItems(rows: NewsRow[]): NewsPriorityItem[] {
  return rows
    .map((item) => {
      const issues = getNewsIssues(item)
      return {
        item,
        issues,
        label: getNewsPriorityLabel(item, issues),
        score: getNewsPriorityScore(item, issues),
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime()
    })
    .slice(0, 6)
}

function countPageIssue(rows: NewsRow[], predicate: (issues: string[], item: NewsRow) => boolean) {
  return rows.filter((item) => predicate(getNewsIssues(item), item)).length
}

function NewsOperationsMatrix({ stats, rows }: { stats: NewsStats; rows: NewsRow[] }) {
  const priorityItems = buildNewsPriorityItems(rows)
  const signals = [
    {
      key: 'cover',
      label: '封面缺口',
      detail: '影响列表和详情首屏展示',
      count: countPageIssue(rows, (issues) => issues.includes('缺封面')),
      href: '/admin/content/news#todo',
    },
    {
      key: 'body',
      label: '正文缺口',
      detail: '中英文正文缺失',
      count: countPageIssue(rows, (issues) => issues.includes('缺中文正文') || issues.includes('缺英文正文')),
      href: '/admin/content/news#todo',
    },
    {
      key: 'excerpt',
      label: '摘要缺口',
      detail: '中英文摘要缺失',
      count: countPageIssue(rows, (issues) => issues.includes('缺中文摘要') || issues.includes('缺英文摘要')),
      href: '/admin/content/news#todo',
    },
    {
      key: 'category',
      label: '分类缺口',
      detail: '未绑定新闻分类',
      count: countPageIssue(rows, (issues) => issues.includes('未分类')),
      href: '/admin/content/news/categories',
    },
    {
      key: 'seo',
      label: 'SEO 缺口',
      detail: '搜索标题或描述缺失',
      count: countPageIssue(rows, (issues) => issues.includes('缺 SEO')),
      href: '/admin/content/news#b3-3-plan',
    },
    {
      key: 'scheduled',
      label: '定时排期',
      detail: '草稿但已有 scheduled_at',
      count: rows.filter(isScheduledNews).length,
      href: '/admin/content/news/list?schedule=scheduled',
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">News Operations</p>
            <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻内容运营矩阵</h2>
            <p className="mt-1 text-sm leading-6 text-[#61767D]">
              先扫发布、草稿、排期和内容缺口，再进入列表筛选、分类治理或单篇编辑。
            </p>
          </div>
          <Link
            href="/admin/content/news/list?status=draft"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            查看草稿
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 border-y border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-4">
          <NewsMatrixKpi label="发布率" value={formatPercent(stats.published, stats.total)} detail={`${formatNumber(stats.published)} / ${formatNumber(stats.total)}`} tone="green" />
          <NewsMatrixKpi label="缺项率" value={formatPercent(stats.incomplete, stats.total)} detail={`${formatNumber(stats.incomplete)} 条待补`} tone={stats.incomplete > 0 ? 'orange' : 'green'} />
          <NewsMatrixKpi label="定时内容" value={formatNumber(stats.scheduled)} detail="已设置发布时间" tone={stats.scheduled > 0 ? 'blue' : 'gray'} />
          <NewsMatrixKpi label="当前页样本" value={formatNumber(rows.length)} detail={`每页最多 ${formatNumber(LIMIT)} 条`} tone="blue" />
        </div>

        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
          {signals.map((signal) => (
            <Link
              key={signal.key}
              href={signal.href}
              className="group min-h-[112px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-[#F7FAFA] xl:border-b-0"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#1E2C31]">{signal.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#61767D]">{signal.detail}</span>
                </span>
                <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                  signal.count > 0 ? 'bg-[#FFF2E7] text-[#E36F2C]' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {formatNumber(signal.count)}
                </span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] opacity-80 transition group-hover:opacity-100">
                进入处理
                <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <aside className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="border-b border-[#E6EEEE] px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
              <BarChart3 size={17} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#1E2C31]">本页优先处理</h2>
              <p className="mt-1 text-xs text-[#61767D]">按封面、正文、排期、SEO 和分类排序。</p>
            </div>
          </div>
        </div>
        {priorityItems.length > 0 ? (
          <div className="divide-y divide-[#E6EEEE]">
            {priorityItems.map((entry) => (
              <Link
                key={entry.item.id}
                href={`/admin/content/news/${entry.item.id}/edit`}
                className="block px-4 py-3 transition hover:bg-[#F7FAFA]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#1E2C31]">
                      {entry.item.title_zh || entry.item.title_en || entry.item.slug}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[#61767D]">/news/{entry.item.slug}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-[#FFF2E7] px-2 py-1 text-xs font-bold text-[#E36F2C]">
                    {entry.label}
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {entry.issues.slice(0, 3).map((issue) => (
                    <span key={issue} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600">
                      {issue}
                    </span>
                  ))}
                  {entry.issues.length > 3 ? (
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500">
                      +{entry.issues.length - 3}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={28} />
            <p className="mt-3 text-sm font-bold text-[#1E2C31]">当前页无高优先级缺口</p>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">可继续切换筛选条件检查其他新闻。</p>
          </div>
        )}
      </aside>
    </section>
  )
}

function NewsMatrixKpi({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'orange'
        ? 'text-[#E36F2C]'
        : tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <div className="border-b border-[#E6EEEE] px-4 py-3 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

export default async function AdminContentNewsListPage({ searchParams }: NewsListPageProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const sp = await searchParams
  const statusParam = firstParam(sp.status)
  const search = firstParam(sp.search)?.trim() ?? ''
  const categoryParam = Number(firstParam(sp.category))
  const categoryId = Number.isInteger(categoryParam) && categoryParam > 0 ? categoryParam : undefined
  const page = positivePage(firstParam(sp.page))
  const status = STATUSES.has(statusParam ?? '') ? statusParam as NewsStatus : undefined
  const scheduleParam = firstParam(sp.schedule)
  const schedule = SCHEDULES.has(scheduleParam ?? '') ? scheduleParam as 'scheduled' : undefined

  const [{ rows, total }, categories, stats] = await Promise.all([
    listNews({
      status,
      search,
      categoryId,
      scheduledOnly: schedule === 'scheduled',
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
    }).catch(() => ({
      rows: [],
      total: 0,
    })),
    listNewsCategories().catch(() => []),
    safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS),
  ])

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="news-list"
    >
      <AdminPageHero
        kicker="新闻运营"
        title="新闻列表"
        description="筛选、预览、编辑和删除新闻内容；单篇定时字段和定时筛选已开放，批量定时、批量发布和批量删除继续后置。"
        actions={(
          <>
            <PrimaryAction href="/admin/content/news/new" Icon={Plus} label="新增新闻" primary />
            <PrimaryAction href="/admin/content/news/list?status=draft" Icon={FileText} label="查看草稿" />
            <PrimaryAction href="/admin/content/news/categories" Icon={Tags} label="分类管理" />
            <PrimaryAction href="/admin/content/news/recycle" Icon={Archive} label="回收站" />
            <PrimaryAction href="/admin/content/news" Icon={ListChecks} label="新闻概览" />
          </>
        )}
      />
      <NewsOperationsMatrix stats={stats} rows={rows} />
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <NewsListClient
          initialRows={rows}
          initialTotal={total}
          initialPage={page}
          initialFilters={{
            status: status ?? '',
            search,
            category: categoryId ? String(categoryId) : '',
            schedule: schedule ?? '',
          }}
          initialCategories={categories}
          basePath="/admin/content/news"
        />
      </section>
    </NewsConsoleShell>
  )
}
