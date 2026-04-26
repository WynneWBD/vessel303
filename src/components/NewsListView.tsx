'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'
import { format, parseISO } from 'date-fns'

type NewsItem = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  excerpt_zh: string | null
  excerpt_en: string | null
  cover_image_url: string | null
  published_at: string | null
}

function formatNewsDate(dateStr: string | null, lang: 'zh' | 'en'): string {
  if (!dateStr) return ''
  try {
    const d = parseISO(dateStr)
    return lang === 'zh' ? format(d, 'yyyy-MM-dd') : format(d, 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export default function NewsListView({ rows }: { rows: NewsItem[] }) {
  const { lang } = useLanguage()

  const isEmpty = rows.length === 0

  return (
    <main className="min-h-screen bg-[#1A1A1A] text-[#F0F0F0]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-[#0F0F0F] border-b border-[#2A2A2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs tracking-[0.2em] text-[#E36F2C] uppercase mb-3">
            {lang === 'zh' ? '新闻动态' : 'News & Events'}
          </p>
          <h1
            className="text-white"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {lang === 'zh' ? '最新动态' : 'Latest Updates'}
          </h1>
          <p className="mt-4 text-[#8A8580] text-sm max-w-xl">
            {lang === 'zh'
              ? 'VESSEL 微宿®品牌动态、行业资讯与项目合作'
              : 'Brand news, industry insights and project highlights from VESSEL®'}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-2xl text-[#4A4744]">—</p>
            <p className="text-[#8A8580]">
              {lang === 'zh' ? '暂无新闻' : 'No news yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((item) => {
              const title = lang === 'zh' ? item.title_zh : item.title_en
              const excerpt = lang === 'zh' ? item.excerpt_zh : item.excerpt_en
              const dateStr = formatNewsDate(item.published_at, lang)

              return (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-[#2A2A2E] bg-[#141414] hover:border-[#E36F2C]/40 transition-all duration-300"
                >
                  {/* Cover */}
                  <div className="relative h-48 overflow-hidden bg-[#0F0F0F] shrink-0">
                    {item.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover_image_url}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background:
                            'linear-gradient(135deg, #1A1A1A 0%, #E36F2C22 50%, #1A1A1A 100%)',
                        }}
                      >
                        <div className="flex h-full items-center justify-center">
                          <span
                            style={{
                              fontFamily: 'DM Sans, sans-serif',
                              color: '#E36F2C',
                              fontSize: 13,
                              fontWeight: 600,
                              letterSpacing: '0.15em',
                              opacity: 0.5,
                            }}
                          >
                            VESSEL®
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Orange accent bar on hover */}
                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#E36F2C] transition-all duration-300 group-hover:w-full" />
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-5 gap-3">
                    {dateStr && (
                      <p className="text-xs text-[#6B6560] tracking-wider">{dateStr}</p>
                    )}
                    <h2
                      className="text-[#F0F0F0] font-semibold leading-snug line-clamp-2 group-hover:text-[#E36F2C] transition-colors"
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16 }}
                    >
                      {title}
                    </h2>
                    {excerpt && (
                      <p className="text-sm text-[#8A8580] leading-relaxed line-clamp-3 flex-1">
                        {excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-[#E36F2C]/60 group-hover:text-[#E36F2C] transition-colors mt-auto pt-2">
                      <span>{lang === 'zh' ? '阅读更多' : 'Read More'}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
