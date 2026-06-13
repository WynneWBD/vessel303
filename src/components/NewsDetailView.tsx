'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import { buildContactHref } from '@/lib/site-links'
import { format, parseISO } from 'date-fns'

type NewsData = {
  slug: string
  title_zh: string
  title_en: string
  excerpt_zh: string | null
  excerpt_en: string | null
  cover_image_url: string | null
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
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
  const zh = lang === 'zh'
  const category = zh
    ? news.category_title_zh || news.category_title_en
    : news.category_title_en || news.category_title_zh
  const contactHref = buildContactHref(`news:${news.slug}:contact_cta`)
  const nextSteps = [
    {
      href: '/products',
      label: zh ? '查看相关产品' : 'Explore products',
      detail: zh ? '回到产品目录，对照型号与配置。' : 'Review product lines and configurations.',
    },
    {
      href: '/cases',
      label: zh ? '查看项目案例' : 'View project cases',
      detail: zh ? '用真实项目判断场景适配。' : 'Use project references to compare scenarios.',
    },
    {
      href: contactHref,
      label: zh ? '提交采购需求' : 'Start inquiry',
      detail: zh ? '团队按这篇动态跟进采购背景。' : 'Let the team follow up from this article context.',
    },
  ]

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
              <div className="flex flex-wrap items-center gap-2">
                {category ? (
                  <span className="rounded-full border border-[#E36F2C]/30 bg-[#E36F2C]/15 px-2.5 py-1 text-[11px] font-semibold text-[#FFE1C9]">
                    {category}
                  </span>
                ) : null}
                {dateStr ? <p className="text-xs text-[#C9BEB4]">{dateStr}</p> : null}
              </div>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h1>
              {excerpt ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C9BEB4]">{excerpt}</p> : null}
              <Link
                href={contactHref}
                prefetch={false}
                className="mt-5 inline-flex min-h-10 items-center bg-[#E36F2C] px-4 text-sm font-bold text-white transition hover:bg-[#C85A1F]"
              >
                {zh ? '带着这篇动态咨询' : 'Inquire from this update'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              {category ? (
                <span className="rounded-full border border-[#E36F2C]/30 bg-[#E36F2C]/15 px-2.5 py-1 text-[11px] font-semibold text-[#FFE1C9]">
                  {category}
                </span>
              ) : null}
              {dateStr ? <p className="text-xs text-[#C9BEB4]">{dateStr}</p> : null}
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-[#F5F2ED] sm:text-4xl">{title}</h1>
            {excerpt ? <p className="mt-4 text-base leading-relaxed text-[#C9BEB4]">{excerpt}</p> : null}
            <Link
              href={contactHref}
              prefetch={false}
              className="mt-5 inline-flex min-h-10 items-center bg-[#E36F2C] px-4 text-sm font-bold text-white transition hover:bg-[#C85A1F]"
            >
              {zh ? '带着这篇动态咨询' : 'Inquire from this update'}
            </Link>
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

      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-md border border-[#E5DED4] bg-white shadow-sm">
            <div className="border-l-4 border-[#E36F2C] px-4 py-5 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E36F2C]">
                {zh ? '下一步路径' : 'Next step'}
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#2C2A28]">
                {zh ? '把新闻线索转成产品、案例或采购咨询' : 'Turn this update into product, case, or inquiry context'}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B6560]">
                {zh
                  ? '如果这篇动态与你的项目相关，可以继续查看产品目录和交付案例，或直接把需求提交给团队。'
                  : 'If this update is relevant to your project, continue to product lines, delivery cases, or submit an inquiry to the team.'}
              </p>
            </div>
            <div className="grid grid-cols-1 border-t border-[#E5DED4] md:grid-cols-3">
              {nextSteps.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className="group min-h-[108px] border-b border-[#E5DED4] px-4 py-4 transition hover:bg-[#FFF7F0] md:border-b-0 md:border-r last:border-r-0"
                >
                  <span className="block text-sm font-bold text-[#2C2A28] transition group-hover:text-[#E36F2C]">{item.label}</span>
                  <span className="mt-2 block text-xs leading-5 text-[#6B6560]">{item.detail}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <Link
              href="/news"
              prefetch={false}
              className="inline-flex min-h-10 items-center rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-4 text-sm font-semibold text-[#2C2A28] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              {zh ? '返回新闻列表' : 'Back to news'}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
