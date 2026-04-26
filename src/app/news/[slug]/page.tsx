import { notFound } from 'next/navigation'
import { getNewsBySlug } from '@/lib/news-db'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import type { JSONContent } from '@tiptap/core'
import NewsDetailView from '@/components/NewsDetailView'

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
