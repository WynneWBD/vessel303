import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminPageHero } from '@/components/admin/AdminUI'
import NewsListClient from '@/components/admin/NewsListClient'
import { listNews, listNewsCategories, type NewsStatus } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NewsConsoleShell,
  PrimaryAction,
  getNewsStats,
  safeLoad,
  type AdminRole,
} from '../_news-console'
import { Archive, FileText, ListChecks, Plus, Tags } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻列表 - VESSEL' }

const LIMIT = 20
const STATUSES = new Set(['draft', 'published'])
const SCHEDULES = new Set(['scheduled'])

type NewsListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function positivePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
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
