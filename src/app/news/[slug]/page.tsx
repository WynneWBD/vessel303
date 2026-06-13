import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getNewsBySlug, listPublishedNews, type NewsListItem } from '@/lib/news-db'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import type { JSONContent } from '@tiptap/core'
import NewsDetailView from '@/components/NewsDetailView'
import { buildPageMetadata } from '@/lib/seo'
import {
  extractImageSrcsFromHtml,
  getUploadVariantsByUrls,
  mapUploadImageUrl,
  replaceImageSrcsInHtml,
} from '@/lib/upload-image-variants'

export const dynamic = 'force-dynamic'
export const revalidate = 300

const EXTS = [StarterKit, Link]

export async function generateStaticParams() {
  const { rows } = await listPublishedNews({ limit: 50, offset: 0 }).catch((err) => {
    console.error('[news/static-params] news db unavailable', err)
    return { rows: [], total: 0 }
  })
  return rows.map((item) => ({ slug: item.slug }))
}

function toHTML(content: unknown): string {
  if (
    !content ||
    typeof content !== 'object' ||
    Object.keys(content as object).length === 0
  ) {
    return ''
  }
  try {
    return generateHTML(content as JSONContent, EXTS)
  } catch {
    return ''
  }
}

function textFallback(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim())?.trim() ?? ''
}

function textFromUnknown(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function isLikelyTestNews(item: {
  slug?: string | null
  title_zh?: string | null
  title_en?: string | null
  excerpt_zh?: string | null
  excerpt_en?: string | null
  content_zh?: unknown
  content_en?: unknown
}) {
  const text = [
    item.slug,
    item.title_zh,
    item.title_en,
    item.excerpt_zh,
    item.excerpt_en,
    textFromUnknown(item.content_zh),
    textFromUnknown(item.content_en),
  ].join(' ')
  return /\b(?:weisu|weisuweisu|codex|test|b\d{2}(?:-\d+)?)\b/i.test(text)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const news = await getNewsBySlug(slug).catch(() => null)

  if (!news || isLikelyTestNews(news)) {
    return {}
  }

  const title = textFallback(news.seo_title_en, news.seo_title_zh, news.title_en, news.title_zh)
  const description = textFallback(
    news.seo_description_en,
    news.seo_description_zh,
    news.excerpt_en,
    news.excerpt_zh,
  )

  return buildPageMetadata({
    title,
    description,
    path: `/news/${news.slug}`,
    image: news.cover_image_url,
    type: 'article',
  })
}

export default async function NewsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const news = await getNewsBySlug(slug).catch(() => null)
  if (!news || isLikelyTestNews(news)) notFound()

  const { rows: publishedRows } = await listPublishedNews({ limit: 50, offset: 0 }).catch((err) => {
    console.error('[news/detail] related news unavailable', err)
    return { rows: [] as NewsListItem[], total: 0 }
  })
  const readableRows = publishedRows.filter((item) => !isLikelyTestNews(item))
  const currentIndex = readableRows.findIndex((item) => item.slug === news.slug)
  const nextReadable = currentIndex > 0 ? readableRows[currentIndex - 1] : null
  const previousReadable = currentIndex >= 0 && currentIndex < readableRows.length - 1
    ? readableRows[currentIndex + 1]
    : null
  const relatedRows = readableRows
    .filter((item) => item.slug !== news.slug)
    .filter((item) => !news.category_slug || item.category_slug === news.category_slug)
    .slice(0, 3)
  const fallbackRelatedRows = relatedRows.length > 0
    ? relatedRows
    : readableRows.filter((item) => item.slug !== news.slug).slice(0, 3)

  const htmlZh = toHTML(news.content_zh)
  const htmlEn = toHTML(news.content_en)
  const imageVariants = await getUploadVariantsByUrls([
    news.cover_image_url,
    previousReadable?.cover_image_url,
    nextReadable?.cover_image_url,
    ...fallbackRelatedRows.map((item) => item.cover_image_url),
    ...extractImageSrcsFromHtml(htmlZh),
    ...extractImageSrcsFromHtml(htmlEn),
  ]).catch((err) => {
    console.error('[news/detail] load news image variants failed', err)
    return new Map()
  })
  const displayNews = {
    ...news,
    cover_image_url: mapUploadImageUrl(news.cover_image_url, imageVariants, 'detail') || news.cover_image_url,
  }
  const mapListItem = (item: NewsListItem | null) => item
    ? {
        ...item,
        cover_image_url: mapUploadImageUrl(item.cover_image_url, imageVariants, 'card') || item.cover_image_url,
      }
    : null
  const displayHtmlZh = replaceImageSrcsInHtml(htmlZh, imageVariants, 'detail')
  const displayHtmlEn = replaceImageSrcsInHtml(htmlEn, imageVariants, 'detail')

  return (
    <NewsDetailView
      news={displayNews}
      htmlZh={displayHtmlZh}
      htmlEn={displayHtmlEn}
      relatedNews={fallbackRelatedRows.map((item) => mapListItem(item)).filter((item): item is NewsListItem => Boolean(item))}
      previousNews={mapListItem(previousReadable)}
      nextNews={mapListItem(nextReadable)}
    />
  )
}
