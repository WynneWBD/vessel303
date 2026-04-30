import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getNewsBySlug } from '@/lib/news-db'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import type { JSONContent } from '@tiptap/core'
import NewsDetailView from '@/components/NewsDetailView'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const EXTS = [StarterKit, Link]

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

  const title = textFallback(news.title_en, news.title_zh, 'VESSEL® News')
  const description = textFallback(
    news.excerpt_en,
    news.excerpt_zh,
    'VESSEL® brand news, product updates and smart prefab architecture project highlights.',
  )

  return buildPageMetadata({
    title: `${title} | VESSEL® News`,
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

  return <NewsDetailView news={news} htmlZh={htmlZh} htmlEn={htmlEn} />
}
