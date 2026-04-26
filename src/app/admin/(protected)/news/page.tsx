import { listNews } from '@/lib/news-db'
import NewsListClient from '@/components/admin/NewsListClient'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const { rows, total } = await listNews({ limit: 20, offset: 0 }).catch(() => ({
    rows: [],
    total: 0,
  }))

  return <NewsListClient initialRows={rows} initialTotal={total} />
}
