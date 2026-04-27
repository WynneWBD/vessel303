'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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

  const title = lang === 'zh' ? news.title_zh : news.title_en
  const excerpt = lang === 'zh' ? news.excerpt_zh : news.excerpt_en
  const html = lang === 'zh' ? htmlZh : htmlEn
  const dateStr = formatNewsDate(news.published_at, lang)

  return (
    <main className="min-h-screen bg-[#1A1A1A] text-[#F0F0F0]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 bg-[#0F0F0F]">
        {news.cover_image_url ? (
          <div className="relative h-[420px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={news.cover_image_url}
              alt={title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent" />
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 max-w-3xl mx-auto">
              <HeroMeta dateStr={dateStr} />
              <h1
                className="text-white mt-3"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </h1>
              {excerpt && (
                <p className="mt-3 text-[#C4B9AB] text-sm leading-relaxed max-w-2xl">
                  {excerpt}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-10">
            <HeroMeta dateStr={dateStr} />
            <h1
              className="text-white mt-3"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {excerpt && (
              <p className="mt-4 text-[#8A8580] text-base leading-relaxed">{excerpt}</p>
            )}
          </div>
        )}
      </section>

      {/* Prose content */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {html ? (
            <div
              className="prose prose-invert prose-orange max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-[#6B6560] italic text-sm">
              {lang === 'zh' ? '(暂无正文内容)' : '(No content yet)'}
            </p>
          )}
        </div>
      </section>

      {/* Back link */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-[#8A8580] hover:text-[#E36F2C] transition-colors"
        >
          <ArrowLeft size={16} />
          {lang === 'zh' ? '返回新闻列表' : 'Back to News'}
        </Link>
      </div>

      <Footer />
    </main>
  )
}

function HeroMeta({ dateStr }: { dateStr: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs px-2 py-0.5 rounded"
        style={{
          background: 'rgba(227,111,44,0.15)',
          color: '#E36F2C',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}
      >
        VESSEL®
      </span>
      {dateStr && (
        <span className="text-xs text-[#8A8580]">{dateStr}</span>
      )}
    </div>
  )
}
