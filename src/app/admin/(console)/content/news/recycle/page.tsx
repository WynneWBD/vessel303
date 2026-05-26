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
  getNewsStats,
  safeLoad,
  type AdminRole,
} from '../_news-console'
import { Archive, ListChecks, Newspaper } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新闻回收站 - VESSEL' }

const LIMIT = 20

type NewsRecyclePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
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

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="recycle"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SectionTitle title="新闻回收站" detail="查看已删除新闻，并在确认后恢复为草稿。" />
            <p className="mt-2 text-xs leading-5 text-[#61767D]">
              对照 300 的回收站入口，本轮只开放软删除恢复；永久删除和批量恢复暂不启用。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="新闻列表" />
            <PrimaryAction href="/admin/content/news" Icon={Newspaper} label="新闻概览" />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SectionTitle title="已删除内容" detail="恢复后统一回到草稿状态，需要重新检查后才能发布。" />
          </div>
          <form action="/admin/content/news/recycle" className="flex flex-wrap items-center gap-2">
            <Input
              name="search"
              defaultValue={search}
              placeholder="搜索标题或 slug..."
              className="w-64"
            />
            <Button type="submit" size="sm">
              搜索
            </Button>
            {search ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/content/news/recycle">清除</Link>
              </Button>
            ) : null}
          </form>
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

        <NewsRecycleClient initialRows={rows} total={total} />
      </section>
    </NewsConsoleShell>
  )
}
