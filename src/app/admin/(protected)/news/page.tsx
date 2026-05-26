import { listNews, listNewsCategories, type NewsStatus } from '@/lib/news-db'
import NewsListClient from '@/components/admin/NewsListClient'

export const dynamic = 'force-dynamic'

const LIMIT = 20
const STATUSES = new Set(['draft', 'published'])
const SCHEDULES = new Set(['scheduled'])

type NewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function positivePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const sp = await searchParams
  const statusParam = firstParam(sp.status)
  const search = firstParam(sp.search)?.trim() ?? ''
  const categoryParam = Number(firstParam(sp.category))
  const categoryId = Number.isInteger(categoryParam) && categoryParam > 0 ? categoryParam : undefined
  const page = positivePage(firstParam(sp.page))
  const status = STATUSES.has(statusParam ?? '') ? statusParam as NewsStatus : undefined
  const scheduleParam = firstParam(sp.schedule)
  const schedule = SCHEDULES.has(scheduleParam ?? '') ? scheduleParam as 'scheduled' : undefined

  const [{ rows, total }, categories] = await Promise.all([
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
  ])

  return (
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
    />
  )
}
