import { listPublishedNews } from '@/lib/news-db'
import NewsListView from '@/components/NewsListView'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const { rows } = await listPublishedNews({ limit: 20, offset: 0 }).catch(() => ({
    rows: [],
    total: 0,
  }))

  return <NewsListView rows={rows} />
}
