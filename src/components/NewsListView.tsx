'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import { format, parseISO } from 'date-fns'
import {
  itemById,
  itemLabel,
  moduleDescription,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client'

type NewsItem = {
  id: number
  slug: string
  title_zh: string
  title_en: string
  excerpt_zh: string | null
  excerpt_en: string | null
  cover_image_url: string | null
  published_at: string | Date | null
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

export default function NewsListView({
  rows,
  pageModules,
}: {
  rows: NewsItem[]
  pageModules: PublicPageModule[]
}) {
  const { lang } = useLanguage()
  const modules = moduleMap(pageModules)
  const heroModule = modules.get('hero') ?? null
  const uiModule = modules.get('ui') ?? null
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang)
  const heroTitle = moduleTitle(heroModule, lang)
  const heroDescription = moduleDescription(heroModule, lang)
  const readMoreLabel = itemLabel(itemById(uiModule, 'read-more'), lang)
  const showHero = heroModule?.is_visible !== false && (heroEyebrow || heroTitle || heroDescription)

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      {showHero ? (
        <section className="relative border-b border-[#E36F2C]/20 bg-[#241F1B] pb-16 pt-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {heroEyebrow ? (
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#E36F2C]">
                {heroEyebrow}
              </p>
            ) : null}
            {heroTitle ? (
              <h1
                className="text-[#F5F2ED]"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                {heroTitle}
              </h1>
            ) : null}
            {heroDescription ? (
              <p className="mt-4 max-w-xl text-sm text-[#C9BEB4]">
                {heroDescription}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {rows.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((item) => {
              const title = lang === 'zh' ? item.title_zh : item.title_en
              const excerpt = lang === 'zh' ? item.excerpt_zh : item.excerpt_en
              const dateStr = formatNewsDate(item.published_at, lang)

              return (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-[#E5DED4] bg-white transition-all duration-300 hover:border-[#E36F2C]/40 hover:shadow-[0_18px_50px_rgba(44,42,40,0.10)]"
                >
                  {item.cover_image_url ? (
                    <div className="relative h-48 shrink-0 overflow-hidden bg-[#FAF7F2]">
                      <ProtectedImage
                        src={item.cover_image_url}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#E36F2C] transition-all duration-300 group-hover:w-full" />
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    {dateStr ? (
                      <p className="text-xs tracking-wider text-[#6B6560]">{dateStr}</p>
                    ) : null}
                    {title ? (
                      <h2
                        className="line-clamp-2 font-semibold leading-snug text-[#2C2A28] transition-colors group-hover:text-[#E36F2C]"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16 }}
                      >
                        {title}
                      </h2>
                    ) : null}
                    {excerpt ? (
                      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-[#8A8580]">
                        {excerpt}
                      </p>
                    ) : null}
                    {readMoreLabel ? (
                      <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-[#E36F2C]/60 transition-colors group-hover:text-[#E36F2C]">
                        <span>{readMoreLabel}</span>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : null}
      </section>

      <Footer />
    </main>
  )
}
