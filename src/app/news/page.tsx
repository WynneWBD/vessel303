import type { Metadata } from 'next'
import { listPublishedNews } from '@/lib/news-db'
import NewsListView from '@/components/NewsListView'
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants'
import { getDefaultPageModule, getPublishedPageModule, listDefaultPageModules, listPublishedPageModules } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const heroModule = await getPublishedPageModule('news', 'hero').catch((err) => {
    console.error('[news/metadata] hero module load failed', err)
    return null
  })
  const safeHeroModule = heroModule ?? getDefaultPageModule('news', 'hero')
  const title = safeHeroModule?.title_en || safeHeroModule?.title_zh || ''
  const description = safeHeroModule?.description_en || safeHeroModule?.description_zh || ''
  if (!title || !description) return {}

  return buildPageMetadata({
    title,
    description,
    path: '/news',
    image: safeHeroModule?.items.find((item) => item.is_visible && item.image_url)?.image_url ?? null,
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
    cover_image_source_url: item.cover_image_url,
    cover_image_url: mapUploadImageUrl(item.cover_image_url, imageVariants, 'card') || item.cover_image_url,
  }))
  const pageModules = await listPublishedPageModules('news').catch((err) => {
    console.error('[news] page modules unavailable', err)
    return []
  })

  const safePageModules = pageModules.length > 0 ? pageModules : listDefaultPageModules('news')
  return <NewsListView rows={displayRows} pageModules={safePageModules} />
}
