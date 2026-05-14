import { listNews, type NewsStatus } from '@/lib/news-db'
import NewsListClient from '@/components/admin/NewsListClient'

export const dynamic = 'force-dynamic'

const LIMIT = 20
const STATUSES = new Set(['draft', 'published'])

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
  const page = positivePage(firstParam(sp.page))
  const status = STATUSES.has(statusParam ?? '') ? statusParam as NewsStatus : undefined

  const { rows, total } = await listNews({
    status,
    search,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  }).catch(() => ({
    rows: [],
    total: 0,
  }))

  return (
    <NewsListClient
      initialRows={rows}
      initialTotal={total}
      initialPage={page}
      initialFilters={{
        status: status ?? '',
        search,
      }}
    />
  )
}
