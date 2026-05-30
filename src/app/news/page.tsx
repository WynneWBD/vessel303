import type { Metadata } from 'next'
import { listPublishedNews } from '@/lib/news-db'
import NewsListView from '@/components/NewsListView'
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants'
import { listPublishedPageModules } from '@/lib/page-modules-db'

export const revalidate = 300

export const metadata: Metadata = {}

export default async function NewsPage() {
  const { rows } = await listPublishedNews({ limit: 20, offset: 0 }).catch(() => ({
    rows: [],
    total: 0,
  }))
  const imageVariants = await getUploadVariantsByUrls(rows.map((item) => item.cover_image_url)).catch((err) => {
    console.error('[news] load news image variants failed', err)
    return new Map()
  })
  const displayRows = rows.map((item) => ({
    ...item,
    cover_image_url: mapUploadImageUrl(item.cover_image_url, imageVariants, 'card') || item.cover_image_url,
  }))
  const pageModules = await listPublishedPageModules('news').catch((err) => {
    console.error('[news] page modules unavailable', err)
    return []
  })

  return <NewsListView rows={displayRows} pageModules={pageModules} />
}
