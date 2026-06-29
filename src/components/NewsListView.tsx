'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import { buildContactHref, normalizeSiteHref } from '@/lib/site-links'
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
  cover_image_source_url?: string | null
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

function subscribeVisualDraftPreview() {
  return () => undefined
}

function getVisualDraftPreviewSnapshot() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visualDraft') === '1'
}

function getVisualDraftPreviewServerSnapshot() {
  return false
}

function useVisualDraftPreview() {
  return useSyncExternalStore(
    subscribeVisualDraftPreview,
    getVisualDraftPreviewSnapshot,
    getVisualDraftPreviewServerSnapshot,
  )
}

type VisualAttrs = Record<`data-${string}`, string>

function newsModuleFieldAttrs(moduleKey: 'hero' | 'ui', itemId: string | null, field: string): VisualAttrs {
  const attrs: VisualAttrs = {
    'data-page-module': `news:${moduleKey}`,
    'data-page-key': 'news',
    'data-module-key': moduleKey,
    'data-page-module-field': field,
  }
  if (itemId) attrs['data-page-module-item'] = itemId
  return attrs
}

function newsLabelAttrs(moduleKey: 'hero' | 'ui', itemId: string, lang: 'en' | 'zh') {
  return newsModuleFieldAttrs(moduleKey, itemId, lang === 'zh' ? 'label_zh' : 'label_en')
}

function newsCmsEditAttrs({
  newsId,
  field,
  patchKey,
  targetId,
  search,
  value,
  input = 'text',
  maxLength,
  required = false,
  nullable = false,
}: {
  newsId: number
  field: string
  patchKey: string
  targetId: string
  search: string
  value: string
  input?: 'text' | 'textarea' | 'image'
  maxLength?: number
  required?: boolean
  nullable?: boolean
}): VisualAttrs {
  const safeSearch = search.trim() || String(newsId)
  return {
    'data-cms-edit-kind': 'news',
    'data-cms-edit-title': '新闻内容',
    'data-cms-edit-field': field,
    'data-cms-edit-url': `/admin/content/news/${newsId}/edit`,
    'data-cms-edit-id': `news-${newsId}-${targetId}`,
    'data-cms-edit-value': value,
    'data-cms-edit-api-url': `/api/admin/news/${newsId}`,
    'data-cms-edit-patch-key': patchKey,
    'data-cms-edit-input': input,
    'data-cms-edit-max-length': String(maxLength ?? (input === 'textarea' ? 500 : 300)),
    'data-cms-edit-required': required ? '1' : '0',
    'data-cms-edit-nullable': nullable ? '1' : '0',
    'data-cms-edit-search': safeSearch,
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
  const visualDraftPreview = useVisualDraftPreview()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const modules = moduleMap(pageModules)
  const heroModule = modules.get('hero') ?? null
  const uiModule = modules.get('ui') ?? null
  const zh = lang === 'zh'
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang)
  const heroTitle = moduleTitle(heroModule, lang)
  const heroDescription = moduleDescription(heroModule, lang)
  const heroEyebrowText = heroEyebrow || (visualDraftPreview ? (zh ? '添加新闻页眉标' : 'Add news eyebrow') : '')
  const heroTitleText = heroTitle || (visualDraftPreview ? (zh ? '添加新闻页标题' : 'Add news page title') : '')
  const heroDescriptionText = heroDescription || (visualDraftPreview ? (zh ? '添加新闻页说明' : 'Add news page description') : '')
  const readMoreLabel = itemLabel(itemById(uiModule, 'read-more'), lang)
  const searchPlaceholder = itemLabel(itemById(uiModule, 'search-placeholder'), lang) || (zh ? '搜索标题、摘要或分类' : 'Search title, summary, or category')
  const allFilterLabel = itemLabel(itemById(uiModule, 'filter-all'), lang) || (zh ? '全部' : 'All')
  const resetLabel = itemLabel(itemById(uiModule, 'filter-reset'), lang) || (zh ? '重置' : 'Reset')
  const resultLabel = itemLabel(itemById(uiModule, 'filter-results'), lang) || (zh ? '结果' : 'Results')
  const noMatchTitle = itemLabel(itemById(uiModule, 'empty-filter-title'), lang) || (zh ? '没有匹配的新闻' : 'No matching updates')
  const noMatchBody = itemLabel(itemById(uiModule, 'empty-filter-body'), lang) || (
    zh ? '可以清空搜索和分类，或直接查看产品、案例与咨询入口。' : 'Clear the search and category filters, or continue to products, cases, and inquiry.'
  )
  const clearFiltersLabel = itemLabel(itemById(uiModule, 'clear-filters'), lang) || (zh ? '清空筛选' : 'Clear filters')
  const noNewsTitle = itemLabel(itemById(uiModule, 'empty-public-title'), lang) || (zh ? '暂无公开新闻' : 'No public news yet')
  const noNewsBody = itemLabel(itemById(uiModule, 'empty-public-body'), lang) || (
    zh ? '可以先查看产品目录、项目案例，或直接提交采购需求。' : 'You can explore products, review project cases, or start an inquiry with the team.'
  )
  const showHero = heroModule?.is_visible !== false && (heroEyebrow || heroTitle || heroDescription || visualDraftPreview)
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
  const contactHref = buildContactHref('news:list:contact_cta')
  const newsPathLink = (itemId: string, fallbackHref: string, fallbackLabel: string) => {
    const item = itemById(uiModule, itemId)
    return {
      itemId,
      href: normalizeSiteHref(item?.href, fallbackHref),
      label: itemLabel(item, lang) || fallbackLabel,
    }
  }
  const pathLinks = [
    newsPathLink('path-products', '/products', zh ? '查看产品' : 'Explore products'),
    newsPathLink('path-cases', '/cases', zh ? '项目案例' : 'Project cases'),
    newsPathLink('path-contact', contactHref, zh ? '提交需求' : 'Start inquiry'),
  ]

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      {showHero ? (
        <section className="relative border-b border-[#E36F2C]/20 bg-[#241F1B] pb-16 pt-32" data-page-module="news:hero">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {heroEyebrowText ? (
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#E36F2C]" {...newsLabelAttrs('hero', 'eyebrow', lang)}>
                {heroEyebrowText}
              </p>
            ) : null}
            {heroTitleText ? (
              <h1
                className="text-[#F5F2ED]"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
                {...newsModuleFieldAttrs('hero', null, lang === 'zh' ? 'title_zh' : 'title_en')}
              >
                {heroTitleText}
              </h1>
            ) : null}
            {heroDescriptionText ? (
              <p className="mt-4 max-w-xl text-sm text-[#C9BEB4]" {...newsModuleFieldAttrs('hero', null, lang === 'zh' ? 'description_zh' : 'description_en')}>
                {heroDescriptionText}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section id="news-discovery-console" className="mb-6 rounded-md border border-[#E5DED4] bg-white px-4 py-4 shadow-sm sm:px-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)_auto_auto] lg:items-start">
              <label className="relative block">
                <span className="sr-only">{zh ? '搜索新闻' : 'Search news'}</span>
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8580]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="min-h-11 w-full rounded-md border border-[#E5DED4] bg-[#FAF7F2] pl-10 pr-3 text-sm outline-none transition placeholder:text-[#9B9288] focus:border-[#1889B6] focus:bg-white"
                  data-visual-open-panel="news-search"
                  {...newsLabelAttrs('ui', 'search-placeholder', lang)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  data-visual-open-panel="news-filter"
                  className={`min-h-10 rounded-md border px-3 text-xs font-bold transition ${
                    activeCategory === 'all'
                      ? 'border-[#1889B6] bg-[#EAF6F8] text-[#1889B6]'
                      : 'border-[#E5DED4] bg-[#FAF7F2] text-[#6B6560] hover:border-[#1889B6] hover:text-[#1889B6]'
                  }`}
                >
                  <span {...newsLabelAttrs('ui', 'filter-all', lang)}>{allFilterLabel}</span>
                </button>
                {categoryOptions.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setActiveCategory(category.key)}
                    data-visual-open-panel="news-filter"
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
                data-visual-open-panel="news-reset"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-[#E5DED4] bg-white px-3 text-xs font-bold text-[#6B6560] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#E5DED4] disabled:hover:text-[#6B6560]"
              >
                <X size={14} />
                <span {...newsLabelAttrs('ui', 'filter-reset', lang)}>{resetLabel}</span>
              </button>
              <div className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#FAF7F2] px-3 text-xs font-bold text-[#6B6560]">
                <span {...newsLabelAttrs('ui', 'filter-results', lang)}>{resultLabel}</span>&nbsp;{filteredRows.length.toLocaleString(zh ? 'zh-CN' : 'en-US')} / {rows.length.toLocaleString(zh ? 'zh-CN' : 'en-US')}
              </div>
            </div>
        </section>

        {filteredRows.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRows.map((item) => {
              const title = lang === 'zh' ? item.title_zh : item.title_en
              const excerpt = lang === 'zh' ? item.excerpt_zh : item.excerpt_en
              const category = zh ? item.category_title_zh || item.category_title_en : item.category_title_en || item.category_title_zh
              const dateStr = formatNewsDate(item.published_at, lang)
              const titleAttrs = newsCmsEditAttrs({
                newsId: item.id,
                field: lang === 'zh' ? '新闻标题（中文）' : 'News title',
                patchKey: lang === 'zh' ? 'title_zh' : 'title_en',
                targetId: `title-${lang}`,
                search: title,
                value: title,
                required: true,
              })
              const excerptAttrs = newsCmsEditAttrs({
                newsId: item.id,
                field: lang === 'zh' ? '新闻摘要（中文）' : 'News excerpt',
                patchKey: lang === 'zh' ? 'excerpt_zh' : 'excerpt_en',
                targetId: `excerpt-${lang}`,
                search: title,
                value: excerpt ?? '',
                input: 'textarea',
                maxLength: 500,
                nullable: true,
              })
              const coverAttrs = newsCmsEditAttrs({
                newsId: item.id,
                field: '新闻封面',
                patchKey: 'cover_image_url',
                targetId: 'cover-image',
                search: title,
                value: item.cover_image_source_url ?? item.cover_image_url ?? '',
                input: 'image',
                maxLength: 1000,
                nullable: true,
              })

              return (
                <Link prefetch={false}
                  key={item.id}
                  href={`/news/${item.slug}`}
                  data-visual-open-panel="news-card"
                  className="group flex flex-col overflow-hidden rounded-lg border border-[#E5DED4] bg-white transition-all duration-300 hover:border-[#E36F2C]/40 hover:shadow-[0_18px_50px_rgba(44,42,40,0.10)]"
                >
                  {item.cover_image_url ? (
                    <div className="relative h-48 shrink-0 overflow-hidden bg-[#FAF7F2]" {...coverAttrs}>
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
                        {...titleAttrs}
                      >
                        {title}
                      </h2>
                    ) : null}
                    {excerpt ? (
                      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-[#8A8580]" {...excerptAttrs}>
                        {excerpt}
                      </p>
                    ) : null}
                    {readMoreLabel ? (
                      <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-[#E36F2C]/60 transition-colors group-hover:text-[#E36F2C]">
                        <span {...newsLabelAttrs('ui', 'read-more', lang)}>{readMoreLabel}</span>
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
            <h2 className="text-lg font-bold text-[#2C2A28]" {...newsLabelAttrs('ui', 'empty-filter-title', lang)}>{noMatchTitle}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6B6560]" {...newsLabelAttrs('ui', 'empty-filter-body', lang)}>
              {noMatchBody}
            </p>
            <button
              type="button"
              onClick={resetDiscovery}
              data-visual-open-panel="news-reset"
              className="mt-5 inline-flex min-h-10 items-center rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-4 text-sm font-semibold text-[#2C2A28] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
            >
              <span {...newsLabelAttrs('ui', 'clear-filters', lang)}>{clearFiltersLabel}</span>
            </button>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#E5DED4] bg-white px-5 py-12 text-center">
            <h2 className="text-lg font-bold text-[#2C2A28]" {...newsLabelAttrs('ui', 'empty-public-title', lang)}>{noNewsTitle}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6B6560]" {...newsLabelAttrs('ui', 'empty-public-body', lang)}>
              {noNewsBody}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {pathLinks.map((item) => (
                <Link
                  key={item.itemId}
                  href={item.href}
                  prefetch={false}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-4 text-sm font-semibold text-[#2C2A28] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
                  {...newsModuleFieldAttrs('ui', item.itemId, 'href')}
                >
                  <span {...newsLabelAttrs('ui', item.itemId, lang)}>{item.label}</span>
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
