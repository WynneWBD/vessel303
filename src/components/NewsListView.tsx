'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import { buildContactHref } from '@/lib/site-links'
import { format, parseISO } from 'date-fns'
import { Search, X } from 'lucide-react'
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
  category_slug: string | null
  category_title_zh: string | null
  category_title_en: string | null
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

function categoryKey(item: NewsItem) {
  return item.category_slug || item.category_title_en || item.category_title_zh || 'uncategorized'
}

export default function NewsListView({
  rows,
  pageModules,
}: {
  rows: NewsItem[]
  pageModules: PublicPageModule[]
}) {
  const { lang } = useLanguage()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const modules = moduleMap(pageModules)
  const heroModule = modules.get('hero') ?? null
  const uiModule = modules.get('ui') ?? null
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang)
  const heroTitle = moduleTitle(heroModule, lang)
  const heroDescription = moduleDescription(heroModule, lang)
  const readMoreLabel = itemLabel(itemById(uiModule, 'read-more'), lang)
  const showHero = heroModule?.is_visible !== false && (heroEyebrow || heroTitle || heroDescription)
  const zh = lang === 'zh'
  const categoryLabels = Array.from(new Set(
    rows
      .map((item) => (zh ? item.category_title_zh || item.category_title_en : item.category_title_en || item.category_title_zh))
      .filter((value): value is string => Boolean(value?.trim())),
  ))
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((item) => {
      const label = zh
        ? item.category_title_zh || item.category_title_en
        : item.category_title_en || item.category_title_zh
      if (label?.trim()) map.set(categoryKey(item), label.trim())
    })
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }))
  }, [rows, zh])
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return rows.filter((item) => {
      const matchesCategory = activeCategory === 'all' || categoryKey(item) === activeCategory
      if (!matchesCategory) return false
      if (!normalizedQuery) return true

      const haystack = [
        item.title_zh,
        item.title_en,
        item.excerpt_zh,
        item.excerpt_en,
        item.category_title_zh,
        item.category_title_en,
      ].join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [activeCategory, query, rows])
  const hasActiveDiscovery = activeCategory !== 'all' || query.trim().length > 0
  const resetDiscovery = () => {
    setQuery('')
    setActiveCategory('all')
  }
  const latestDate = rows[0]?.published_at ? formatNewsDate(rows[0].published_at, lang) : ''
  const contactHref = buildContactHref('news:list:contact_cta')
  const conversionStats = [
    {
      label: zh ? '已发布动态' : 'Published updates',
      value: rows.length.toLocaleString(zh ? 'zh-CN' : 'en-US'),
      detail: zh ? '精选公开内容' : 'Curated public updates',
    },
    {
      label: zh ? '内容分类' : 'Content categories',
      value: categoryLabels.length.toLocaleString(zh ? 'zh-CN' : 'en-US'),
      detail: categoryLabels.slice(0, 2).join(' / ') || (zh ? '持续归档中' : 'Continuing archive'),
    },
    {
      label: zh ? '最近更新' : 'Latest update',
      value: latestDate || '--',
      detail: zh ? '按发布时间排序' : 'Sorted by publish date',
    },
  ]
  const pathLinks = [
    {
      href: '/products',
      label: zh ? '查看产品' : 'Explore products',
      detail: zh ? '从动态回到产品目录' : 'Move from updates to product options',
    },
    {
      href: '/cases',
      label: zh ? '项目案例' : 'Project cases',
      detail: zh ? '对照交付场景' : 'Compare delivery scenarios',
    },
    {
      href: contactHref,
      label: zh ? '提交需求' : 'Start inquiry',
      detail: zh ? '团队按新闻阅读路径跟进' : 'Let the team follow up from the news path',
    },
  ]

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
        <div className="mb-8 overflow-hidden rounded-md border border-[#E5DED4] bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="border-l-4 border-[#E36F2C] px-4 py-5 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E36F2C]">
                {zh ? '新闻阅读路径' : 'News reading path'}
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#2C2A28]">
                {zh ? '从动态了解产品、案例与采购咨询' : 'Move from updates to products, cases, and inquiry'}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B6560]">
                {zh
                  ? '按分类、封面、摘要和发布时间帮助访客快速判断下一步应该查看产品、案例还是直接提交需求。'
                  : 'Scan categories, covers, summaries, and publish timing before moving to products, cases, or inquiry.'}
              </p>
            </div>
            <div className="grid grid-cols-3 border-t border-[#E5DED4] bg-[#FBF8F3] lg:border-l lg:border-t-0">
              {conversionStats.map((stat) => (
                <div key={stat.label} className="min-w-0 border-r border-[#E5DED4] px-3 py-4 last:border-r-0">
                  <p className="truncate text-[11px] font-semibold text-[#8A8580]">{stat.label}</p>
                  <p className="mt-1 truncate text-lg font-bold text-[#2C2A28]">{stat.value}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#6B6560]">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 border-t border-[#E5DED4] md:grid-cols-3">
            {pathLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="group min-h-[92px] border-b border-[#E5DED4] px-4 py-4 transition hover:bg-[#FFF7F0] md:border-b-0 md:border-r last:border-r-0"
              >
                <span className="block text-sm font-bold text-[#2C2A28] transition group-hover:text-[#E36F2C]">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[#6B6560]">{item.detail}</span>
              </Link>
            ))}
          </div>
        </div>

        {rows.length > 0 ? (
          <section id="news-discovery-console" className="mb-6 overflow-hidden rounded-md border border-[#E5DED4] bg-white shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="border-l-4 border-[#1889B6] px-4 py-4 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1889B6]">
                  {zh ? '新闻发现' : 'News discovery'}
                </p>
                <h2 className="mt-2 text-lg font-bold text-[#2C2A28]">
                  {zh ? '按关键词和分类快速定位内容' : 'Find updates by keyword and category'}
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6B6560]">
                  {zh
                    ? '对照 en.303 Blog 的阅读方式，先筛选主题，再进入详情或提交咨询。'
                    : 'Mirror the en.303 Blog reading flow: filter the topic first, then open the article or start an inquiry.'}
                </p>
              </div>
              <div className="border-t border-[#E5DED4] bg-[#FBF8F3] px-4 py-4 lg:border-l lg:border-t-0">
                <p className="text-xs font-semibold text-[#8A8580]">{zh ? '当前结果' : 'Current result'}</p>
                <p className="mt-1 text-2xl font-bold text-[#2C2A28]">
                  {filteredRows.length.toLocaleString(zh ? 'zh-CN' : 'en-US')}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#6B6560]">
                  {zh ? `共 ${rows.length.toLocaleString('zh-CN')} 条公开动态` : `From ${rows.length.toLocaleString('en-US')} public updates`}
                </p>
              </div>
            </div>
            <div className="border-t border-[#E5DED4] px-4 py-4 sm:px-5">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)_auto] lg:items-start">
                <label className="relative block">
                  <span className="sr-only">{zh ? '搜索新闻' : 'Search news'}</span>
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8580]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={zh ? '搜索标题、摘要或分类' : 'Search title, summary, or category'}
                    className="min-h-11 w-full rounded-md border border-[#E5DED4] bg-[#FAF7F2] pl-10 pr-3 text-sm outline-none transition placeholder:text-[#9B9288] focus:border-[#1889B6] focus:bg-white"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`min-h-10 rounded-md border px-3 text-xs font-bold transition ${
                      activeCategory === 'all'
                        ? 'border-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
                        : 'border-[#E5DED4] bg-[#FAF7F2] text-[#6B6560] hover:border-[#1889B6] hover:text-[#1889B6]'
                    }`}
                  >
                    {zh ? '全部' : 'All'}
                  </button>
                  {categoryOptions.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setActiveCategory(category.key)}
                      className={`min-h-10 rounded-md border px-3 text-xs font-bold transition ${
                        activeCategory === category.key
                          ? 'border-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
                          : 'border-[#E5DED4] bg-[#FAF7F2] text-[#6B6560] hover:border-[#1889B6] hover:text-[#1889B6]'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resetDiscovery}
                  disabled={!hasActiveDiscovery}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-[#E5DED4] bg-white px-3 text-xs font-bold text-[#6B6560] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#E5DED4] disabled:hover:text-[#6B6560]"
                >
                  <X size={14} />
                  {zh ? '重置' : 'Reset'}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {filteredRows.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRows.map((item) => {
              const title = lang === 'zh' ? item.title_zh : item.title_en
              const excerpt = lang === 'zh' ? item.excerpt_zh : item.excerpt_en
              const category = zh ? item.category_title_zh || item.category_title_en : item.category_title_en || item.category_title_zh
              const dateStr = formatNewsDate(item.published_at, lang)

              return (
                <Link prefetch={false}
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
                    <div className="flex flex-wrap items-center gap-2">
                      {category ? (
                        <span className="rounded-full border border-[#E36F2C]/20 bg-[#FFF7F0] px-2.5 py-1 text-[11px] font-semibold text-[#B85D21]">
                          {category}
                        </span>
                      ) : null}
                      {dateStr ? (
                        <p className="text-xs tracking-wider text-[#6B6560]">{dateStr}</p>
                      ) : null}
                    </div>
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
        ) : rows.length > 0 ? (
          <div className="rounded-md border border-dashed border-[#E5DED4] bg-white px-5 py-12 text-center">
            <h2 className="text-lg font-bold text-[#2C2A28]">{zh ? '没有匹配的新闻' : 'No matching updates'}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6B6560]">
              {zh ? '可以清空搜索和分类，或直接查看产品、案例与咨询入口。' : 'Clear the search and category filters, or continue to products, cases, and inquiry.'}
            </p>
            <button
              type="button"
              onClick={resetDiscovery}
              className="mt-5 inline-flex min-h-10 items-center rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-4 text-sm font-semibold text-[#2C2A28] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              {zh ? '清空筛选' : 'Clear filters'}
            </button>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#E5DED4] bg-white px-5 py-12 text-center">
            <h2 className="text-lg font-bold text-[#2C2A28]">{zh ? '暂无公开新闻' : 'No public news yet'}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6B6560]">
              {zh ? '可以先查看产品目录、项目案例，或直接提交采购需求。' : 'You can explore products, review project cases, or start an inquiry with the team.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {pathLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-4 text-sm font-semibold text-[#2C2A28] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
