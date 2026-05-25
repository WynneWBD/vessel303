import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import NewsForm from '@/components/admin/NewsForm'
import { getNewsById } from '@/lib/news-db'
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

  const [news, stats] = await Promise.all([
    getNewsById(id).catch(() => null),
    safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS),
  ])
  if (!news) notFound()

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="news-list"
    >
      <Hero slug={news.slug} status={news.status} />
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
        <NewsForm mode="edit" initialData={news} basePath="/admin/content/news" />
      </section>
    </NewsConsoleShell>
  )
}
