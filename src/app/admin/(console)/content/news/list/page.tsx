import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import NewsListClient from '@/components/admin/NewsListClient'
import { listNews, type NewsStatus } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NewsConsoleShell,
  PrimaryAction,
  SectionTitle,
  getNewsStats,
  safeLoad,
  type AdminRole,
} from '../_news-console'
import { FileText, ListChecks, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻列表 - VESSEL' }

const LIMIT = 20
const STATUSES = new Set(['draft', 'published'])

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
  const page = positivePage(firstParam(sp.page))
  const status = STATUSES.has(statusParam ?? '') ? statusParam as NewsStatus : undefined

  const [{ rows, total }, stats] = await Promise.all([
    listNews({
      status,
      search,
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
    }).catch(() => ({
      rows: [],
      total: 0,
    })),
    safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS),
  ])

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="news-list"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SectionTitle title="新闻列表" detail="筛选、预览、编辑和删除新闻内容。" />
            <p className="mt-2 text-xs leading-5 text-[#61767D]">
              参照 300 的新闻列表保留状态筛选、搜索、发布状态和操作入口；分类、回收站、批量操作暂不启用。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryAction href="/admin/content/news/new" Icon={Plus} label="新增新闻" primary />
            <PrimaryAction href="/admin/content/news/list?status=draft" Icon={FileText} label="查看草稿" />
            <PrimaryAction href="/admin/content/news" Icon={ListChecks} label="新闻概览" />
          </div>
        </div>
      </section>
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <NewsListClient
          initialRows={rows}
          initialTotal={total}
          initialPage={page}
          initialFilters={{
            status: status ?? '',
            search,
          }}
          basePath="/admin/content/news"
        />
      </section>
    </NewsConsoleShell>
  )
}
