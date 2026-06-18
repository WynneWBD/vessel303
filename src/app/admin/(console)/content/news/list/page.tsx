import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminPageHero } from '@/components/admin/AdminUI'
import NewsListClient from '@/components/admin/NewsListClient'
import { pool } from '@/lib/db'
import { listNews, listNewsCategories, type NewsCategoryRow, type NewsRow, type NewsStatus } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NewsConsoleShell,
  PrimaryAction,
  getNewsStats,
  safeLoad,
  type AdminRole,
  type NewsStats,
} from '../_news-console'
import {
  Archive,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Link2,
  ListChecks,
  Newspaper,
  Plus,
  SearchCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻列表 - VESSEL' }

const LIMIT = 20
const STATUSES = new Set(['draft', 'published'])
const SCHEDULES = new Set(['scheduled'])

type NewsListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type NewsScheduleFilter = '' | 'scheduled'

type NewsFilterState = {
  status: NewsStatus | ''
  schedule: NewsScheduleFilter
  category: string
  search: string
  page: number
}

type NewsCategoryOption = Pick<NewsCategoryRow, 'id' | 'title_zh' | 'title_en' | 'news_count'>

type NewsPriorityItem = {
  item: NewsRow
  issues: string[]
  label: string
  score: number
}

type NewsIssueSummary = {
  cover: number
  body: number
  excerpt: number
  category: number
  seo: number
  scheduled: number
}

type ActiveFilterChip = {
  label: string
  value: string
  href: string
}

type NewsSourceSeoBridgeItem = {
  label: string
  value: string
  detail: string
  href: string
  action: string
  tone: 'blue' | 'green' | 'orange'
}

type NewsListSourceConversionQueueItem = {
  label: string
  value: string
  detail: string
  href: string
  action: string
  Icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'neutral'
}

const EMPTY_NEWS_ISSUE_SUMMARY: NewsIssueSummary = {
  cover: 0,
  body: 0,
  excerpt: 0,
  category: 0,
  seo: 0,
  scheduled: 0,
}

const EMPTY_NEWS_CONTENT_SQL = `(
  {column} IS NULL
  OR {column} IN (
    '{}'::jsonb,
    '[]'::jsonb,
    'null'::jsonb,
    '{"type":"doc","content":[]}'::jsonb
  )
)`

const MISSING_ZH_CONTENT_SQL = EMPTY_NEWS_CONTENT_SQL.replaceAll('{column}', 'content_zh')
const MISSING_EN_CONTENT_SQL = EMPTY_NEWS_CONTENT_SQL.replaceAll('{column}', 'content_en')
const ACTIVE_NEWS_SQL = 'deleted_at IS NULL'

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

function parseCount(value: string | undefined) {
  return parseInt(value ?? '0', 10)
}

function createHref(filters: NewsFilterState, patch: Partial<NewsFilterState & { clearSearch: boolean }>) {
  const next: NewsFilterState = {
    ...filters,
    ...patch,
    page: patch.page ?? 1,
  }
  const params = new URLSearchParams()

  if (next.status) params.set('status', next.status)
  if (next.schedule) params.set('schedule', next.schedule)
  if (next.category) params.set('category', next.category)
  if (!patch.clearSearch && next.search) params.set('search', next.search)
  if (next.page > 1) params.set('page', String(next.page))

  const query = params.toString()
  return query ? `/admin/content/news/list?${query}` : '/admin/content/news/list'
}

function displayTitle(zh?: string | null, en?: string | null) {
  return zh?.trim() || en?.trim() || '未命名'
}

function findCategoryTitle(categories: NewsCategoryOption[], value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) return null
  const category = categories.find((item) => item.id === id)
  return category ? displayTitle(category.title_zh, category.title_en) : null
}

function buildActiveFilterChips(filters: NewsFilterState, categories: NewsCategoryOption[]): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  if (filters.status) {
    chips.push({
      label: '状态',
      value: filters.status === 'published' ? '已发布' : '草稿',
      href: createHref(filters, { status: '' }),
    })
  }

  if (filters.schedule) {
    chips.push({
      label: '排期',
      value: '定时发布',
      href: createHref(filters, { schedule: '' }),
    })
  }

  if (filters.category) {
    chips.push({
      label: '分类',
      value: findCategoryTitle(categories, filters.category) ?? filters.category,
      href: createHref(filters, { category: '' }),
    })
  }

  if (filters.search) {
    chips.push({
      label: '搜索',
      value: filters.search,
      href: createHref(filters, { clearSearch: true }),
    })
  }

  return chips
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

async function getNewsIssueSummary(): Promise<NewsIssueSummary> {
  const res = await pool.query<Record<keyof NewsIssueSummary, string>>(
    `SELECT
       COUNT(*) FILTER (
         WHERE ${ACTIVE_NEWS_SQL}
           AND NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL
       )::text AS cover,
       COUNT(*) FILTER (
         WHERE ${ACTIVE_NEWS_SQL}
           AND (${MISSING_ZH_CONTENT_SQL} OR ${MISSING_EN_CONTENT_SQL})
       )::text AS body,
       COUNT(*) FILTER (
         WHERE ${ACTIVE_NEWS_SQL}
           AND (
             NULLIF(BTRIM(COALESCE(excerpt_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(excerpt_en, '')), '') IS NULL
           )
       )::text AS excerpt,
       COUNT(*) FILTER (
         WHERE ${ACTIVE_NEWS_SQL}
           AND category_id IS NULL
       )::text AS category,
       COUNT(*) FILTER (
         WHERE ${ACTIVE_NEWS_SQL}
           AND (
             NULLIF(BTRIM(COALESCE(seo_title_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_title_en, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_description_zh, '')), '') IS NULL
             OR NULLIF(BTRIM(COALESCE(seo_description_en, '')), '') IS NULL
           )
       )::text AS seo,
       COUNT(*) FILTER (
         WHERE ${ACTIVE_NEWS_SQL}
           AND status = 'draft'
           AND scheduled_at IS NOT NULL
       )::text AS scheduled
     FROM news`,
  )
  const row = res.rows[0]
  return {
    cover: parseCount(row?.cover),
    body: parseCount(row?.body),
    excerpt: parseCount(row?.excerpt),
    category: parseCount(row?.category),
    seo: parseCount(row?.seo),
    scheduled: parseCount(row?.scheduled),
  }
}

function NewsListControlStrip({
  filters,
  categories,
  stats,
  total,
  rowsCount,
}: {
  filters: NewsFilterState
  categories: NewsCategoryOption[]
  stats: NewsStats
  total: number
  rowsCount: number
}) {
  const chips = buildActiveFilterChips(filters, categories)
  const firstRowNumber = total > 0 ? (filters.page - 1) * LIMIT + 1 : 0
  const lastRowNumber = total > 0 ? Math.min(total, firstRowNumber + rowsCount - 1) : 0
  const pageCount = Math.max(1, Math.ceil(total / LIMIT))
  const quickLinks: Array<{ label: string; href: string; count: number | null; active: boolean }> = [
    { label: '全部新闻', href: '/admin/content/news/list', count: stats.total, active: chips.length === 0 },
    {
      label: '已发布',
      href: createHref(filters, { status: 'published', schedule: '' }),
      count: stats.published,
      active: filters.status === 'published' && !filters.schedule,
    },
    {
      label: '草稿',
      href: createHref(filters, { status: 'draft', schedule: '' }),
      count: stats.draft,
      active: filters.status === 'draft' && !filters.schedule,
    },
    {
      label: '定时',
      href: createHref(filters, { status: '', schedule: 'scheduled' }),
      count: stats.scheduled,
      active: filters.schedule === 'scheduled',
    },
    {
      label: '待补治理',
      href: '/admin/content/news#todo',
      count: stats.incomplete,
      active: false,
    },
    {
      label: '缺 SEO',
      href: '/admin/content/news#news-operations-hub',
      count: stats.missingSeo,
      active: false,
    },
    {
      label: '来源 SEO',
      href: '/admin/status/leads#source-seo-lead-quality',
      count: null,
      active: false,
    },
    {
      label: '分类管理',
      href: '/admin/content/news/categories',
      count: categories.length,
      active: false,
    },
  ]

  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="border-l-4 border-[#1889B6] px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">News List Console</p>
          <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#1E2C31]">当前新闻视图</h2>
              <p className="mt-1 text-sm leading-6 text-[#61767D]">
                当前筛选命中 {formatNumber(total)} 条新闻，本页显示 {formatNumber(rowsCount)} 条；先确认状态、排期、分类和搜索条件，再进入下方列表处理。
              </p>
            </div>
            <Link
              href="/admin/content/news/list"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#61767D] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              清空全部筛选
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-[#E6EEEE] bg-[#FBFDFD] lg:border-l lg:border-t-0">
          <NewsControlStat label="结果总量" value={formatNumber(total)} detail={`第 ${formatNumber(filters.page)} / ${formatNumber(pageCount)} 页`} />
          <NewsControlStat label="当前区间" value={`${formatNumber(firstRowNumber)}-${formatNumber(lastRowNumber)}`} detail={`每页 ${formatNumber(LIMIT)} 条`} />
          <NewsControlStat label="发布率" value={formatPercent(stats.published, stats.total)} detail={`${formatNumber(stats.published)} 已发布`} />
        </div>
      </div>

      <div className="border-t border-[#E6EEEE] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A9EA4]">Active Filters</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.length > 0 ? (
                chips.map((chip) => (
                  <Link
                    key={`${chip.label}-${chip.value}`}
                    href={chip.href}
                    className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#D8E7E8] bg-[#F7FAFA] px-2.5 py-1 text-xs text-[#61767D] transition hover:border-[#1889B6] hover:bg-[#EAF6F8] hover:text-[#1889B6]"
                  >
                    <span className="font-semibold text-[#1E2C31]">{chip.label}</span>
                    <span className="max-w-[220px] truncate">{chip.value}</span>
                    <span className="text-[#8A9EA4]">移除</span>
                  </Link>
                ))
              ) : (
                <span className="inline-flex min-h-8 items-center rounded-md border border-dashed border-[#D8E7E8] px-2.5 py-1 text-xs font-semibold text-[#8A9EA4]">
                  当前为全部新闻视图
                </span>
              )}
            </div>
          </div>

          <div className="grid min-w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[560px] xl:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                  link.active
                    ? 'border-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
                    : 'border-[#D8E7E8] bg-white text-[#61767D] hover:border-[#1889B6] hover:text-[#1889B6]'
                }`}
              >
                <span>{link.label}</span>
                {link.count === null ? (
                  <ArrowRight size={13} />
                ) : (
                  <span className="rounded bg-[#F0F7F8] px-1.5 py-0.5 text-[11px]">{formatNumber(link.count)}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function NewsListGovernancePanel({
  filters,
  categories,
  stats,
  issueSummary,
  total,
  rowsCount,
}: {
  filters: NewsFilterState
  categories: NewsCategoryOption[]
  stats: NewsStats
  issueSummary: NewsIssueSummary
  total: number
  rowsCount: number
}) {
  const chips = buildActiveFilterChips(filters, categories)
  const activeFilterLabel = chips.length > 0
    ? chips.map((chip) => `${chip.label}:${chip.value}`).join(' / ')
    : '全部新闻'
  const contentIssueCount = issueSummary.cover
    + issueSummary.body
    + issueSummary.excerpt
    + issueSummary.category
    + issueSummary.seo
  const cards = [
    {
      label: '当前列表视图',
      value: formatNumber(total),
      detail: `${activeFilterLabel}；本页 ${formatNumber(rowsCount)} 条`,
      href: '#news-list-table',
      action: '进入列表',
    },
    {
      label: '批量转分类',
      value: formatNumber(categories.length),
      detail: '仅保留低风险分类归档，高风险批量写入继续关闭',
      href: '#news-list-table',
      action: '选择新闻',
    },
    {
      label: '缺口优先级',
      value: formatNumber(contentIssueCount),
      detail: `封面 ${formatNumber(issueSummary.cover)} · 正文 ${formatNumber(issueSummary.body)} · SEO ${formatNumber(issueSummary.seo)}`,
      href: '#news-list-priority',
      action: '查看矩阵',
    },
    {
      label: '发布台账',
      value: formatNumber(rowsCount),
      detail: '按封面、正文、语言、SEO、分类和排期排序',
      href: '#news-list-table',
      action: '查看台账',
    },
    {
      label: '来源承接',
      value: '6 入口',
      detail: '状态桥、质量桥、发布桥、来源面板、转化承接和新闻线索已回连',
      href: '/admin/status/leads#source-seo-lead-quality',
      action: '看质量桥',
    },
    {
      label: '运营总览',
      value: formatPercent(stats.published, stats.total),
      detail: `${formatNumber(stats.published)} 已发布，${formatNumber(stats.incomplete)} 条待补`,
      href: '/admin/content/news#news-operations-hub',
      action: '回到总览',
    },
  ]
  const sourceHandoffLinks = [
    { label: '状态桥', href: '/admin/status/leads#news-lead-path-bridge' },
    { label: '质量桥', href: '/admin/status/leads#source-seo-lead-quality' },
    { label: '发布桥', href: '/admin/status/site#source-seo-release-bridge' },
    { label: '来源面板', href: '/admin/status/traffic#news-source-handoff' },
    { label: '转化承接', href: '/admin/site/conversion#news-conversion-handoff' },
    { label: '新闻线索', href: '/admin/customers/leads?source_type=news' },
  ]
  const sourceSeoBridgeCards: NewsSourceSeoBridgeItem[] = [
    {
      label: 'B283 处理焦点',
      value: contentIssueCount > 0 ? `${formatNumber(contentIssueCount)} 待补` : '已归零',
      detail: '把新闻列表缺项、SEO 待补和当前筛选样本放到同一处理入口。',
      href: '#news-list-priority',
      action: '查看优先级',
      tone: contentIssueCount > 0 ? 'orange' : 'green',
    },
    {
      label: 'SEO 来源质量',
      value: formatNumber(issueSummary.seo),
      detail: '新闻 SEO 缺口直连 B282 来源线索质量桥，方便复核内容补齐后是否带来有效询盘。',
      href: '/admin/status/leads#source-seo-lead-quality',
      action: '看质量桥',
      tone: issueSummary.seo > 0 ? 'orange' : 'green',
    },
    {
      label: '发布回看',
      value: formatNumber(rowsCount),
      detail: '当前列表样本可回看 B281 发布桥，确认发布后的 SEO、来源和线索路径。',
      href: '/admin/status/site#source-seo-release-bridge',
      action: '看发布桥',
      tone: 'blue',
    },
    {
      label: '新闻线索',
      value: 'news',
      detail: '用 source_type=news 进入线索队列，对照 en.303 新闻入口的访问和转化承接。',
      href: '/admin/customers/leads?source_type=news',
      action: '看线索',
      tone: 'blue',
    },
  ]

  return (
    <section id="news-list-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="border-l-4 border-[#E36F2C] px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E36F2C]">List Governance</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻列表治理闭环</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            将筛选视图、批量转分类、缺口优先级、发布台账、来源承接和运营总览收在同一入口，方便运营按列表完成“发现问题、筛选处理、编辑复核、回看获客、回到总览”的闭环。
          </p>
        </div>
        <div className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-4 py-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A9EA4]">Safety Boundary</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#1E2C31]">
            批量发布、批量删除、批量定时仍关闭；当前页只承接筛选、分类归档、单篇复核和只读来源下钻。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sourceHandoffLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex items-center gap-1 rounded border border-[#D8E7E8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6]"
              >
                {link.label}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group min-h-[132px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-[#F7FAFA] md:border-r xl:border-b-0 last:border-r-0"
          >
            <span className="block text-xs font-semibold text-[#61767D]">{card.label}</span>
            <span className="mt-2 block truncate text-2xl font-bold text-[#1E2C31]">{card.value}</span>
            <span className="mt-2 block min-h-10 text-xs leading-5 text-[#61767D]">{card.detail}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6]">
              {card.action}
              <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
      <div id="news-source-seo-list-bridge" className="border-t border-[#E6EEEE] bg-[#FBFDFD] px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">B283 Source SEO Bridge</p>
            <h3 className="mt-1 text-base font-bold text-[#1E2C31]">新闻 SEO 与来源处理桥</h3>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
              对照 en.303 新闻页的分类、搜索、摘要、详情和联系入口，把后台新闻列表的 SEO 缺口、内容缺项、发布回看和新闻线索队列合并成一条运营路径。
            </p>
          </div>
          <Link
            href="/admin/content/news#news-operations-hub"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#EAF6F8]"
          >
            回到新闻总览
            <ArrowRight size={13} />
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sourceSeoBridgeCards.map((card) => (
            <NewsSourceSeoBridgeCard key={card.label} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}

function NewsSourceSeoBridgeCard({ card }: { card: NewsSourceSeoBridgeItem }) {
  const toneClass =
    card.tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : card.tone === 'orange'
        ? 'bg-[#FFF2E7] text-[#E36F2C]'
        : 'bg-[#EAF6F8] text-[#1889B6]'

  return (
    <Link
      href={card.href}
      className="group flex min-h-[148px] flex-col justify-between rounded-md border border-[#D8E7E8] bg-white p-4 transition hover:border-[#1889B6] hover:shadow-sm"
    >
      <span>
        <span className="block text-xs font-semibold text-[#61767D]">{card.label}</span>
        <span className={`mt-2 inline-flex rounded-md px-2 py-1 text-lg font-bold ${toneClass}`}>
          {card.value}
        </span>
        <span className="mt-3 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
      </span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6]">
        {card.action}
        <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function NewsListSourceConversionQueue({
  filters,
  categories,
  stats,
  issueSummary,
  total,
  rowsCount,
}: {
  filters: NewsFilterState
  categories: NewsCategoryOption[]
  stats: NewsStats
  issueSummary: NewsIssueSummary
  total: number
  rowsCount: number
}) {
  const chips = buildActiveFilterChips(filters, categories)
  const activeFilterLabel = chips.length > 0
    ? chips.map((chip) => `${chip.label}:${chip.value}`).join(' / ')
    : '全部新闻'
  const contentBacklog = issueSummary.cover + issueSummary.body + issueSummary.excerpt + issueSummary.category
  const openIssues = contentBacklog + issueSummary.seo
  const items: NewsListSourceConversionQueueItem[] = [
    {
      label: '新闻优化台',
      value: 'B294',
      detail: '回到新闻内容到来源线索优化台，统一看内容待补、SEO 待补和新闻来源线索承接。',
      href: '/admin/content/news#news-source-lead-optimization-desk',
      action: '看优化台',
      Icon: Newspaper,
      tone: 'green',
    },
    {
      label: '流量分诊',
      value: 'B293',
      detail: '从新闻列表处理完缺口后，回看访问路径、新闻动作和“有访问无线索”异常。',
      href: '/admin/status/traffic#traffic-to-lead-exception-desk',
      action: '看流量',
      Icon: SearchCheck,
      tone: openIssues > 0 ? 'orange' : 'blue',
    },
    {
      label: '来源线索处理',
      value: 'B292',
      detail: '按 source_type=news 复核新闻来源线索、活跃度、阶段和运营跟进质量。',
      href: '/admin/status/leads#source-lead-quality-workdesk',
      action: '看线索处理',
      Icon: Link2,
      tone: 'blue',
    },
    {
      label: '转化复盘',
      value: 'B291',
      detail: '把当前新闻列表筛选结果接入 SEO 到线索转化复盘，判断补内容后的获客承接。',
      href: '/admin/site/conversion#seo-to-lead-conversion-review',
      action: '看转化',
      Icon: ListChecks,
      tone: 'green',
    },
    {
      label: '新闻线索队列',
      value: 'source_type=news',
      detail: '直接进入新闻来源线索队列；本页只做跳转，不改变线索状态或客户数据。',
      href: '/admin/customers/leads?source_type=news',
      action: '打开队列',
      Icon: Link2,
      tone: 'neutral',
    },
    {
      label: '当前列表处理',
      value: formatNumber(rowsCount),
      detail: `${activeFilterLabel}；先处理本页高优先级内容和 SEO 缺口，再回看流量与线索。`,
      href: '#news-list-table',
      action: '处理列表',
      Icon: FileText,
      tone: openIssues > 0 ? 'orange' : 'green',
    },
  ]

  return (
    <section id="news-list-source-conversion-queue" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#E36F2C] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">B295 NEWS LIST SOURCE CONVERSION QUEUE</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻列表来源转化处理队列</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">
            把当前新闻列表筛选、B294 新闻优化台、B293 流量分诊、B292 来源线索处理、B291 转化复盘和 `source_type=news` 线索队列接成一条处理链；先在列表补齐内容和 SEO，再回看新闻访问与线索承接。本区只读，不新增发布、删除、保存或线索写入能力。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryAction href="/admin/content/news#news-source-lead-optimization-desk" Icon={Newspaper} label="B294 优化台" primary />
            <PrimaryAction href="/admin/status/traffic#traffic-to-lead-exception-desk" Icon={SearchCheck} label="B293 流量分诊" />
            <PrimaryAction href="/admin/status/leads#source-lead-quality-workdesk" Icon={Link2} label="B292 线索处理" />
            <PrimaryAction href="/admin/site/conversion#seo-to-lead-conversion-review" Icon={ListChecks} label="B291 转化复盘" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#E6EEEE] bg-[#FBFDFD] lg:border-l lg:border-t-0">
          <NewsQueueStat label="当前筛选" value={formatNumber(total)} detail={activeFilterLabel} />
          <NewsQueueStat label="本页样本" value={formatNumber(rowsCount)} detail={`每页 ${formatNumber(LIMIT)} 条`} />
          <NewsQueueStat label="内容待补" value={formatNumber(contentBacklog)} detail="封面/正文/摘要/分类" warn={contentBacklog > 0} />
          <NewsQueueStat label="SEO 待补" value={formatNumber(issueSummary.seo)} detail={`${formatNumber(stats.missingSeo)} 条总览待补`} warn={issueSummary.seo > 0 || stats.missingSeo > 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <NewsListSourceConversionCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  )
}

function NewsQueueStat({
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

function NewsListSourceConversionCard({ item }: { item: NewsListSourceConversionQueueItem }) {
  const Icon = item.Icon
  const toneClass =
    item.tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : item.tone === 'orange'
        ? 'border-[#F4C7A6] bg-[#FFF2E7] text-[#C85F24]'
        : item.tone === 'neutral'
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
        {item.action}
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function NewsControlStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-r border-[#E6EEEE] px-4 py-4 last:border-r-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-[#1E2C31]">{value}</p>
      <p className="mt-1 truncate text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function NewsOperationsMatrix({
  stats,
  issueSummary,
  rows,
}: {
  stats: NewsStats
  issueSummary: NewsIssueSummary
  rows: NewsRow[]
}) {
  const priorityItems = buildNewsPriorityItems(rows)
  const signals = [
    {
      key: 'cover',
      label: '封面缺口',
      detail: '影响列表和详情首屏展示',
      count: issueSummary.cover,
      pageCount: countPageIssue(rows, (issues) => issues.includes('缺封面')),
      href: '/admin/content/news#todo',
    },
    {
      key: 'body',
      label: '正文缺口',
      detail: '中英文正文缺失',
      count: issueSummary.body,
      pageCount: countPageIssue(rows, (issues) => issues.includes('缺中文正文') || issues.includes('缺英文正文')),
      href: '/admin/content/news#todo',
    },
    {
      key: 'excerpt',
      label: '摘要缺口',
      detail: '中英文摘要缺失',
      count: issueSummary.excerpt,
      pageCount: countPageIssue(rows, (issues) => issues.includes('缺中文摘要') || issues.includes('缺英文摘要')),
      href: '/admin/content/news#todo',
    },
    {
      key: 'category',
      label: '分类缺口',
      detail: '未绑定新闻分类',
      count: issueSummary.category,
      pageCount: countPageIssue(rows, (issues) => issues.includes('未分类')),
      href: '/admin/content/news/categories',
    },
    {
      key: 'seo',
      label: 'SEO 缺口',
      detail: '搜索标题或描述缺失',
      count: issueSummary.seo,
      pageCount: countPageIssue(rows, (issues) => issues.includes('缺 SEO')),
      href: '/admin/content/news/list#news-source-seo-list-bridge',
    },
    {
      key: 'scheduled',
      label: '定时排期',
      detail: '草稿但已有 scheduled_at',
      count: issueSummary.scheduled,
      pageCount: rows.filter(isScheduledNews).length,
      href: '/admin/content/news/list?schedule=scheduled',
    },
  ]

  return (
    <section id="news-list-priority" className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1889B6]">News Operations</p>
            <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">新闻内容运营矩阵</h2>
            <p className="mt-1 text-sm leading-6 text-[#61767D]">
              主数字按全库统计，先扫发布、草稿、排期和内容缺口，再进入列表筛选、分类治理或单篇编辑。
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
                  <span className="mt-1 block text-[11px] leading-5 text-[#8A9EA4]">
                    本页命中 {formatNumber(signal.pageCount)}
                  </span>
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
  const filters: NewsFilterState = {
    status: status ?? '',
    schedule: schedule ?? '',
    category: categoryId ? String(categoryId) : '',
    search,
    page,
  }

  const [{ rows, total }, categories, stats, issueSummary] = await Promise.all([
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
    safeLoad('news issue summary', () => getNewsIssueSummary(), EMPTY_NEWS_ISSUE_SUMMARY),
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
      <div className="space-y-6">
        <NewsListGovernancePanel
          filters={filters}
          categories={categories}
          stats={stats}
          issueSummary={issueSummary}
          total={total}
          rowsCount={rows.length}
        />
        <NewsListSourceConversionQueue
          filters={filters}
          categories={categories}
          stats={stats}
          issueSummary={issueSummary}
          total={total}
          rowsCount={rows.length}
        />
        <NewsListControlStrip
          filters={filters}
          categories={categories}
          stats={stats}
          total={total}
          rowsCount={rows.length}
        />
        <NewsOperationsMatrix stats={stats} issueSummary={issueSummary} rows={rows} />
        <section id="news-list-table" className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <NewsListClient
            initialRows={rows}
            initialTotal={total}
            initialPage={page}
            initialFilters={filters}
            initialCategories={categories}
            basePath="/admin/content/news"
          />
        </section>
      </div>
    </NewsConsoleShell>
  )
}
