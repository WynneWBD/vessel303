import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import NewsForm from '@/components/admin/NewsForm'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import { getNewsById, listNewsCategories, type NewsRow } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NEWS_EDIT_SECTIONS,
  NewsConsoleShell,
  PrimaryAction,
  SectionTitle,
  getNewsStats,
  safeLoad,
  type AdminRole,
} from '../../_news-console'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  ListChecks,
  SearchCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '编辑新闻 - VESSEL' }

type PageProps = {
  params: Promise<{ id: string }>
}

type NewsEditorReadinessGroupKey = 'content' | 'taxonomy' | 'seo' | 'media' | 'publish'

type NewsEditorReadinessSeverity = 'high' | 'medium' | 'status'

type NewsEditorReadinessIssue = {
  key: string
  group: NewsEditorReadinessGroupKey
  label: string
  detail: string
  href: string
  severity: NewsEditorReadinessSeverity
  rank: number
}

type NewsEditorReadinessGroup = {
  key: NewsEditorReadinessGroupKey
  title: string
  detail: string
  href: string
  Icon: LucideIcon
  issueCount: number
  done: boolean
}

type NewsEditorReadiness = {
  issues: NewsEditorReadinessIssue[]
  groups: NewsEditorReadinessGroup[]
  requiredIssueCount: number
  reviewIssueCount: number
  completedGroups: number
  completionPercent: number
  nextIssue: NewsEditorReadinessIssue | null
}

const READINESS_GROUPS: Omit<NewsEditorReadinessGroup, 'issueCount' | 'done'>[] = [
  {
    key: 'content',
    title: '双语内容',
    detail: 'Slug、标题、摘要和正文',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'taxonomy',
    title: '分类排期',
    detail: '分类归档和定时发布',
    href: '#taxonomy',
    Icon: Tags,
  },
  {
    key: 'seo',
    title: '搜索表现',
    detail: '中英文 SEO 标题和描述',
    href: '#seo',
    Icon: SearchCheck,
  },
  {
    key: 'media',
    title: '展示素材',
    detail: '新闻封面和列表首屏',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'publish',
    title: '发布影响',
    detail: '公开状态和前台影响',
    href: '#publish-check',
    Icon: CalendarClock,
  },
]

const NEWS_SOURCE_HANDOFF_LINKS = [
  { label: '状态桥', href: '/admin/status/leads#news-lead-path-bridge' },
  { label: '来源面板', href: '/admin/status/traffic#news-source-handoff' },
  { label: '转化承接', href: '/admin/site/conversion#news-conversion-handoff' },
  { label: '新闻线索', href: '/admin/customers/leads?source_type=news' },
]

function parseId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return Number.isFinite(id) && id > 0 ? id : null
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasRichTextContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (!value || typeof value !== 'object') return false

  let found = false

  const visit = (node: unknown) => {
    if (found || !node || typeof node !== 'object') return

    const record = node as { text?: unknown; content?: unknown }
    if (typeof record.text === 'string' && record.text.trim().length > 0) {
      found = true
      return
    }

    if (Array.isArray(record.content)) {
      record.content.forEach(visit)
    }
  }

  visit(value)
  return found
}

function buildNewsEditorReadiness(news: NewsRow): NewsEditorReadiness {
  const issues: NewsEditorReadinessIssue[] = []
  const seoMissingCount = [
    !hasText(news.seo_title_zh),
    !hasText(news.seo_title_en),
    !hasText(news.seo_description_zh),
    !hasText(news.seo_description_en),
  ].filter(Boolean).length
  const introMissingCount = [
    !hasText(news.title_zh),
    !hasText(news.title_en),
    !hasText(news.excerpt_zh),
    !hasText(news.excerpt_en),
  ].filter(Boolean).length

  const addIssue = (issue: NewsEditorReadinessIssue) => {
    issues.push(issue)
  }

  if (!hasText(news.slug)) {
    addIssue({
      key: 'slug',
      group: 'content',
      label: '补 Slug',
      detail: 'Slug 决定新闻详情 URL，缺失会影响保存后的稳定入口和前台预览。',
      href: '#basic',
      severity: 'high',
      rank: 110,
    })
  }

  if (introMissingCount > 0) {
    addIssue({
      key: 'intro',
      group: 'content',
      label: '补标题和摘要',
      detail: `中英文标题、摘要还有 ${introMissingCount} 项缺口，先补齐再进入发布复核。`,
      href: '#content',
      severity: introMissingCount >= 2 ? 'high' : 'medium',
      rank: 100,
    })
  }

  if (!hasRichTextContent(news.content_zh) || !hasRichTextContent(news.content_en)) {
    addIssue({
      key: 'body',
      group: 'content',
      label: '补中英文正文',
      detail: '正文为空会让公开详情页只剩标题或摘要，是发布前的高优先级缺口。',
      href: '#content',
      severity: 'high',
      rank: 94,
    })
  }

  if (!hasText(news.cover_image_url)) {
    addIssue({
      key: 'cover',
      group: 'media',
      label: '补封面图',
      detail: '封面影响新闻列表、详情首屏和分享观感，建议先补正式图片再发布。',
      href: '#media',
      severity: 'high',
      rank: 88,
    })
  }

  if (!news.category_id) {
    addIssue({
      key: 'category',
      group: 'taxonomy',
      label: '绑定新闻分类',
      detail: '未分类会影响后台筛选、前台归档和后续内容治理。',
      href: '#taxonomy',
      severity: 'medium',
      rank: 76,
    })
  }

  if (seoMissingCount > 0) {
    addIssue({
      key: 'seo',
      group: 'seo',
      label: '补 SEO 字段',
      detail: `SEO 标题和描述还有 ${seoMissingCount} 项缺口；补齐后搜索结果口径更稳定。`,
      href: '#seo',
      severity: 'medium',
      rank: 64,
    })
  }

  if (news.status === 'published') {
    addIssue({
      key: 'published-impact',
      group: 'publish',
      label: '复核已发布影响',
      detail: `当前新闻已公开${hasText(news.slug) ? `：/news/${news.slug}` : ''}，保存前先确认标题、封面、正文和 SEO。`,
      href: hasText(news.slug) ? `/news/${news.slug}` : '#publish-check',
      severity: 'status',
      rank: 40,
    })
  } else if (hasText(news.scheduled_at)) {
    addIssue({
      key: 'scheduled-impact',
      group: 'publish',
      label: '复核定时发布',
      detail: `已设置计划发布时间：${news.scheduled_at}。发布前确认排期、标题和 SEO 是否匹配。`,
      href: '#schedule',
      severity: 'status',
      rank: 34,
    })
  }

  const sortedIssues = issues.sort((a, b) => b.rank - a.rank)
  const requiredIssues = sortedIssues.filter((issue) => issue.severity !== 'status')
  const groups = READINESS_GROUPS.map((group) => {
    const issueCount = requiredIssues.filter((issue) => issue.group === group.key).length
    return {
      ...group,
      issueCount,
      done: issueCount === 0,
    }
  })
  const completedGroups = groups.filter((group) => group.done).length

  return {
    issues: sortedIssues,
    groups,
    requiredIssueCount: requiredIssues.length,
    reviewIssueCount: sortedIssues.length - requiredIssues.length,
    completedGroups,
    completionPercent: Math.round((completedGroups / groups.length) * 100),
    nextIssue: requiredIssues[0] ?? sortedIssues[0] ?? null,
  }
}

function readinessIssueClass(severity: NewsEditorReadinessSeverity) {
  if (severity === 'high') return 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
  if (severity === 'medium') return 'border-[#B7DDE4] bg-[#EAF6F8] text-[#1889B6]'
  return 'border-[#D8E7E8] bg-[#F0F2F2] text-[#61767D]'
}

function readinessIssueLabel(severity: NewsEditorReadinessSeverity) {
  if (severity === 'high') return '优先'
  if (severity === 'medium') return '建议'
  return '复核'
}

function NewsReadinessPanel({ readiness }: { readiness: NewsEditorReadiness }) {
  const ready = readiness.requiredIssueCount === 0

  return (
    <section id="news-editor-readiness" className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
      <div className="grid grid-cols-1 gap-4 border-b border-[#E6EEEE] pb-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1889B6]">Publish Readiness</p>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">新闻发布就绪路线图</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#61767D]">
            先把列表页发现的缺项落到单篇编辑处理路径：内容、分类排期、SEO、封面、发布影响和来源承接分开判断。这里是只读运营提示，不新增保存或发布限制。
          </p>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-md border border-[#D8E7E8] bg-[#F7FAFA] text-center text-xs">
          <div className="border-r border-[#D8E7E8] p-3">
            <span className="block font-semibold text-[#61767D]">正式缺项</span>
            <span className={readiness.requiredIssueCount > 0 ? 'mt-1 block text-xl font-bold text-[#E36F2C]' : 'mt-1 block text-xl font-bold text-emerald-700'}>
              {readiness.requiredIssueCount}
            </span>
          </div>
          <div className="border-r border-[#D8E7E8] p-3">
            <span className="block font-semibold text-[#61767D]">复核提醒</span>
            <span className={readiness.reviewIssueCount > 0 ? 'mt-1 block text-xl font-bold text-[#1889B6]' : 'mt-1 block text-xl font-bold text-emerald-700'}>
              {readiness.reviewIssueCount}
            </span>
          </div>
          <div className="p-3">
            <span className="block font-semibold text-[#61767D]">完成度</span>
            <span className="mt-1 block text-xl font-bold text-[#1E2C31]">{readiness.completionPercent}%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        {readiness.groups.map((group) => {
          const Icon = group.Icon
          return (
            <Link
              key={group.key}
              href={group.href}
              className={`min-h-36 rounded-md border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                group.done
                  ? 'border-emerald-100 bg-emerald-50/70 hover:border-emerald-200'
                  : 'border-[#F2C6A7] bg-[#FFF7F0] hover:border-[#E36F2C]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={group.done ? 'flex h-9 w-9 items-center justify-center rounded-md bg-white text-emerald-700' : 'flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#E36F2C]'}>
                  <Icon size={17} />
                </span>
                <span className={group.done ? 'text-emerald-700' : 'text-[#E36F2C]'}>
                  {group.done ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-[#1E2C31]">{group.title}</h3>
              <p className="mt-1 min-h-10 text-xs leading-5 text-[#61767D]">{group.detail}</p>
              <p className={group.done ? 'mt-3 text-xs font-bold text-emerald-700' : 'mt-3 text-xs font-bold text-[#E36F2C]'}>
                {group.done ? 'Ready' : `${group.issueCount} 项待处理`}
              </p>
            </Link>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-md border border-[#D8E7E8]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#1E2C31]">下一步处理队列</h3>
              <p className="mt-1 text-xs text-[#61767D]">按发布影响排序，点击即可跳到对应表单分区。</p>
            </div>
            <span className={ready ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700' : 'rounded-full bg-[#FFF2E7] px-3 py-1 text-xs font-bold text-[#E36F2C]'}>
              {ready ? '无正式缺项' : `${readiness.requiredIssueCount} 项`}
            </span>
          </div>
          {readiness.issues.length === 0 ? (
            <div className="px-4 py-5 text-sm font-semibold text-emerald-700">
              当前新闻已通过入口级检查，可进入表单内发布前人工复核。
            </div>
          ) : (
            <div className="divide-y divide-[#E6EEEE]">
              {readiness.issues.slice(0, 6).map((issue) => (
                <Link key={issue.key} href={issue.href} className="block bg-white px-4 py-3 transition hover:bg-[#F7FAFA]">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${readinessIssueClass(issue.severity)}`}>
                          {readinessIssueLabel(issue.severity)}
                        </span>
                        <span className="text-sm font-bold text-[#1E2C31]">{issue.label}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#61767D]">{issue.detail}</p>
                    </div>
                    <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-[#1889B6]/30 px-3 text-xs font-bold text-[#1889B6]">
                      处理 <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-4">
          <h3 className="text-sm font-bold text-[#1E2C31]">发布判断</h3>
          <p className="mt-2 text-xs leading-5 text-[#61767D]">
            正式新闻页优先看双语内容、封面、分类和 SEO；已发布或定时状态只作为复核提醒，不反向阻止保存。
          </p>
          <Link
            href={readiness.nextIssue?.href ?? '#publish-check'}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1889B6] px-3 text-xs font-bold text-white hover:bg-[#137A9F]"
          >
            {readiness.nextIssue ? `先处理：${readiness.nextIssue.label}` : '进入表单复核'}
            <ArrowRight size={13} />
          </Link>
          <div className="mt-4 border-t border-[#D8E7E8] pt-4">
            <h4 className="text-sm font-bold text-[#1E2C31]">来源承接复核</h4>
            <p className="mt-2 text-xs leading-5 text-[#61767D]">
              保存或发布前，可从新闻来源链路复看访问、状态桥、转化承接和 `source_type=news` 线索队列；本区只做只读下钻。
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {NEWS_SOURCE_HANDOFF_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="inline-flex min-h-9 items-center justify-between gap-2 rounded-md border border-[#D8E7E8] bg-white px-2.5 text-xs font-bold text-[#1889B6] transition hover:border-[#1889B6]"
                >
                  {link.label}
                  <ArrowRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function Hero({ slug, status }: { slug: string; status: string }) {
  const isPublished = status === 'published'

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#FFF2E7_0%,#F4FBFC_56%,#DDF6F8_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <PrimaryAction href="/admin/content/news/list" Icon={ArrowLeft} label="返回新闻列表" />
          <div className="mt-5">
            <SectionTitle title="编辑新闻" detail={isPublished ? '当前新闻已发布，保存更新会影响前台内容。' : '当前新闻是草稿，发布后才会进入前台新闻页。'} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPublished && (
            <PrimaryAction href={`/news/${slug}`} Icon={ExternalLink} label="查看前台" />
          )}
          <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="新闻列表" primary />
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentNewsEditPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const { id: raw } = await params
  const id = parseId(raw)
  if (!id) notFound()

  const [news, stats, categories] = await Promise.all([
    getNewsById(id).catch(() => null),
    safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS),
    listNewsCategories({ includeHidden: true }).catch(() => []),
  ])
  if (!news) notFound()

  const isPublished = news.status === 'published'
  const isScheduled = !isPublished && Boolean(news.scheduled_at)
  const hasCover = hasText(news.cover_image_url)
  const bodyReady = hasRichTextContent(news.content_zh) && hasRichTextContent(news.content_en)
  const seoReady =
    hasText(news.seo_title_zh) &&
    hasText(news.seo_title_en) &&
    hasText(news.seo_description_zh) &&
    hasText(news.seo_description_en)
  const categoryReady = Boolean(news.category_id)
  const editorReadiness = buildNewsEditorReadiness(news)

  const editorMetrics: ProductEditorMetric[] = [
    {
      label: '状态',
      value: isPublished ? '已发布' : isScheduled ? '定时' : '草稿',
      detail: isPublished ? '保存和取消发布会影响前台新闻页。' : '发布前不会进入公开新闻详情。',
      tone: isPublished ? 'warning' : 'ready',
    },
    {
      label: '正文',
      value: bodyReady ? 'OK' : '待补',
      detail: '中英文正文影响新闻详情页质量。',
      tone: bodyReady ? 'ready' : 'warning',
    },
    {
      label: '封面',
      value: hasCover ? '已配置' : '缺',
      detail: '封面影响新闻列表和详情首屏。',
      tone: hasCover ? 'ready' : 'warning',
    },
    {
      label: 'SEO / 分类',
      value: `${seoReady ? 'OK' : '缺'} / ${categoryReady ? 'OK' : '缺'}`,
      detail: '搜索字段与分类归档状态。',
      tone: seoReady && categoryReady ? 'ready' : 'warning',
    },
  ]

  const editorSignals: ProductEditorSignal[] = [
    {
      label: isPublished ? '保存会更新前台新闻' : '当前不是公开新闻',
      detail: isPublished
        ? `公开路由 /news/${news.slug} 已展示，保存前需复核标题、正文、封面和 SEO。`
        : '草稿或定时新闻保存后不会立即公开，发布仍需 NewsForm 的确认弹窗。',
      tone: isPublished ? 'warning' : 'ready',
      href: isPublished ? `/news/${news.slug}` : '#publish-check',
    },
    {
      label: hasText(news.slug) ? 'Slug 已设置' : '缺 Slug',
      detail: hasText(news.slug) ? `/news/${news.slug}` : '缺 Slug 无法形成稳定新闻 URL。',
      tone: hasText(news.slug) ? 'ready' : 'warning',
      href: '#basic',
    },
    {
      label: categoryReady ? '分类已绑定' : '未分类',
      detail: categoryReady ? `category_id ${news.category_id}` : '未分类会影响新闻列表筛选和内容归档。',
      tone: categoryReady ? 'ready' : 'warning',
      href: '#taxonomy',
    },
    {
      label: seoReady ? 'SEO 已补齐' : 'SEO 待补',
      detail: '中英文搜索标题和描述决定搜索结果口径。',
      tone: seoReady ? 'ready' : 'warning',
      href: '#seo',
    },
    {
      label: '来源承接已回连',
      detail: '状态桥、来源面板、转化承接和新闻线索队列可用于复看新闻获客影响；这里不写线索状态。',
      tone: 'neutral',
      href: '/admin/status/leads#news-lead-path-bridge',
      Icon: Link2,
    },
  ]

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="news-list"
    >
      <Hero slug={news.slug} status={news.status} />
      <ProductEditorConsole
        title="新闻编辑任务台"
        description="先判断公开状态、正文、封面、分类和 SEO 缺口，再进入原有新闻表单完成编辑和发布。"
        sections={NEWS_EDIT_SECTIONS}
        metrics={editorMetrics}
        signals={editorSignals}
      />
      <NewsReadinessPanel readiness={editorReadiness} />
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
            <p className="px-2 text-xs font-semibold text-[#8A9EA4]">编辑分区</p>
            <div className="mt-2 space-y-1">
              {NEWS_EDIT_SECTIONS.map((section) => (
                <a
                  key={section.key}
                  href={section.href}
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#1E2C31] transition hover:bg-[#F0F7F8] hover:text-[#1889B6]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
                    <section.Icon size={16} />
                  </span>
                  <span>
                    <span className="block">{section.title}</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-[#8A9EA4]">{section.detail}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </aside>
        <NewsForm
          mode="edit"
          initialData={news}
          basePath="/admin/content/news"
          initialCategories={categories}
        />
      </section>
    </NewsConsoleShell>
  )
}
