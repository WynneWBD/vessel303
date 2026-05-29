import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getNewsBySlug, listPublishedNews } from '@/lib/news-db'
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const news = await getNewsBySlug(slug).catch(() => null)

  if (!news) {
    return buildPageMetadata({
      title: 'News | VESSEL®',
      description: 'VESSEL® brand news, product updates and smart prefab architecture project highlights.',
      path: `/news/${slug}`,
    })
  }

  const fallbackTitle = textFallback(news.title_en, news.title_zh, 'VESSEL® News')
  const title = textFallback(news.seo_title_en, news.seo_title_zh) || `${fallbackTitle} | VESSEL® News`
  const description = textFallback(
    news.seo_description_en,
    news.seo_description_zh,
    news.excerpt_en,
    news.excerpt_zh,
    'VESSEL® brand news, product updates and smart prefab architecture project highlights.',
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
  if (!news) notFound()

  const htmlZh = toHTML(news.content_zh)
  const htmlEn = toHTML(news.content_en)
  const imageVariants = await getUploadVariantsByUrls([
    news.cover_image_url,
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
  const displayHtmlZh = replaceImageSrcsInHtml(htmlZh, imageVariants, 'detail')
  const displayHtmlEn = replaceImageSrcsInHtml(htmlEn, imageVariants, 'detail')

  return <NewsDetailView news={displayNews} htmlZh={displayHtmlZh} htmlEn={displayHtmlEn} />
}
