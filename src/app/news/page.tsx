import type { Metadata } from 'next'
import { listPublishedNews } from '@/lib/news-db'
import NewsListView from '@/components/NewsListView'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildPageMetadata({
  title: 'News & Events | VESSEL®',
  description:
    'Read VESSEL® brand news, product updates, project highlights, exhibition notes and smart prefab architecture industry insights.',
  path: '/news',
})

export default async function NewsPage() {
  const { rows } = await listPublishedNews({ limit: 20, offset: 0 }).catch(() => ({
    rows: [],
    total: 0,
  }))

  return <NewsListView rows={rows} />
}
