import type { Metadata } from 'next'
import { listPublishedNews } from '@/lib/news-db'
import NewsListView from '@/components/NewsListView'
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants'
import { getPublishedPageModule, listPublishedPageModules } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const heroModule = await getPublishedPageModule('news', 'hero').catch((err) => {
    console.error('[news/metadata] hero module load failed', err)
    return null
  })
  const title = heroModule?.title_en || heroModule?.title_zh || ''
  const description = heroModule?.description_en || heroModule?.description_zh || ''
  if (!title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/news',
    image: heroModule?.items.find((item) => item.is_visible && item.image_url)?.image_url ?? null,
  })
}

function isLikelyTestNews(item: {
  slug?: string | null
  title_zh?: string | null
  title_en?: string | null
  excerpt_zh?: string | null
  excerpt_en?: string | null
}) {
  const text = [
    item.slug,
    item.title_zh,
    item.title_en,
    item.excerpt_zh,
    item.excerpt_en,
  ].join(' ')
  return /\b(?:weisu|weisuweisu|codex|test|b\d{2}(?:-\d+)?)\b/i.test(text)
}

export default async function NewsPage() {
  const { rows } = await listPublishedNews({ limit: 20, offset: 0 }).catch(() => ({
    rows: [],
    total: 0,
  }))
  const credibleRows = rows.filter((item) => !isLikelyTestNews(item))
  const imageVariants = await getUploadVariantsByUrls(credibleRows.map((item) => item.cover_image_url)).catch((err) => {
    console.error('[news] load news image variants failed', err)
    return new Map()
  })
  const displayRows = credibleRows.map((item) => ({
    ...item,
    cover_image_url: mapUploadImageUrl(item.cover_image_url, imageVariants, 'card') || item.cover_image_url,
  }))
  const pageModules = await listPublishedPageModules('news').catch((err) => {
    console.error('[news] page modules unavailable', err)
    return []
  })

  return <NewsListView rows={displayRows} pageModules={pageModules} />
}
