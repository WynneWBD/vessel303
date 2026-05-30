'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import { format, parseISO } from 'date-fns'

type NewsData = {
  slug: string
  title_zh: string
  title_en: string
  excerpt_zh: string | null
  excerpt_en: string | null
  cover_image_url: string | null
  published_at: string | Date | null
}

interface Props {
  news: NewsData
  htmlZh: string
  htmlEn: string
}

function formatNewsDate(value: string | Date | null, lang: 'zh' | 'en'): string {
  if (!value) return ''
  try {
    const d = value instanceof Date ? value : parseISO(value)
    return lang === 'zh' ? format(d, 'yyyy-MM-dd') : format(d, 'MMM d, yyyy')
  } catch {
    return String(value)
  }
}

export default function NewsDetailView({ news, htmlZh, htmlEn }: Props) {
  const { lang } = useLanguage()
  const title = lang === 'zh' ? news.title_zh || news.title_en : news.title_en || news.title_zh
  const excerpt = lang === 'zh' ? news.excerpt_zh || news.excerpt_en : news.excerpt_en || news.excerpt_zh
  const html = lang === 'zh' ? htmlZh : htmlEn
  const dateStr = formatNewsDate(news.published_at, lang)

  if (!title) return null

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      <section className="relative bg-[#241F1B] pt-28">
        {news.cover_image_url ? (
          <div className="relative h-[420px] overflow-hidden">
            <ProtectedImage
              src={news.cover_image_url}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#241F1B] via-[#241F1B]/45 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-3xl px-6 pb-10">
              {dateStr ? <p className="text-xs text-[#C9BEB4]">{dateStr}</p> : null}
              <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h1>
              {excerpt ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C9BEB4]">{excerpt}</p> : null}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 sm:px-6">
            {dateStr ? <p className="text-xs text-[#C9BEB4]">{dateStr}</p> : null}
            <h1 className="mt-3 text-3xl font-bold leading-tight text-[#F5F2ED] sm:text-4xl">{title}</h1>
            {excerpt ? <p className="mt-4 text-base leading-relaxed text-[#C9BEB4]">{excerpt}</p> : null}
          </div>
        )}
      </section>

      {html ? (
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div
              className="prose prose-stone prose-orange max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </section>
      ) : null}

      <Footer />
    </main>
  )
}
