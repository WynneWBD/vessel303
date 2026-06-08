import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import NewsForm from '@/components/admin/NewsForm'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import { getNewsById, listNewsCategories } from '@/lib/news-db'
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
import { ArrowLeft, ExternalLink, ListChecks } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '编辑新闻 - VESSEL' }

type PageProps = {
  params: Promise<{ id: string }>
}

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
