'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  itemById,
  itemLabel,
  moduleMap,
  type PublicPageModule,
} from '@/lib/page-module-client'
import { buildContactHref, normalizeSiteHref } from '@/lib/site-links'
import { format, parseISO } from 'date-fns'

type NewsData = {
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

type NewsRelatedItem = NewsData & {
  id?: number
}

interface Props {
  news: NewsData
  htmlZh: string
  htmlEn: string
  relatedNews?: NewsRelatedItem[]
  previousNews?: NewsRelatedItem | null
  nextNews?: NewsRelatedItem | null
  pageModules?: PublicPageModule[]
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

function displayNewsTitle(item: NewsRelatedItem, lang: 'zh' | 'en') {
  return lang === 'zh' ? item.title_zh || item.title_en : item.title_en || item.title_zh
}

function displayNewsExcerpt(item: NewsRelatedItem, lang: 'zh' | 'en') {
  return lang === 'zh' ? item.excerpt_zh || item.excerpt_en : item.excerpt_en || item.excerpt_zh
}

type VisualAttrs = Record<`data-${string}`, string>

function newsModuleFieldAttrs(moduleKey: 'ui', itemId: string | null, field: string): VisualAttrs {
  const attrs: VisualAttrs = {
    'data-page-module': `news:${moduleKey}`,
    'data-page-key': 'news',
    'data-module-key': moduleKey,
    'data-page-module-field': field,
  }
  if (itemId) attrs['data-page-module-item'] = itemId
  return attrs
}

function newsLabelAttrs(moduleKey: 'ui', itemId: string, lang: 'en' | 'zh') {
  return newsModuleFieldAttrs(moduleKey, itemId, lang === 'zh' ? 'label_zh' : 'label_en')
}

function newsHrefAttrs(moduleKey: 'ui', itemId: string) {
  return newsModuleFieldAttrs(moduleKey, itemId, 'href')
}

function newsCmsEditAttrs({
  newsId,
  field,
  targetId,
  search,
  value,
  patchKey,
  input = 'text',
  maxLength,
  required = false,
  nullable = false,
}: {
  newsId: number
  field: string
  targetId: string
  search: string
  value: string
  patchKey?: string
  input?: 'text' | 'textarea' | 'image'
  maxLength?: number
  required?: boolean
  nullable?: boolean
}): VisualAttrs {
  const attrs: VisualAttrs = {
    'data-cms-edit-kind': 'news',
    'data-cms-edit-title': '新闻内容',
    'data-cms-edit-field': field,
    'data-cms-edit-url': `/admin/content/news/${newsId}/edit`,
    'data-cms-edit-id': `news-${newsId}-${targetId}`,
    'data-cms-edit-value': value,
    'data-cms-edit-input': input,
    'data-cms-edit-max-length': String(maxLength ?? (input === 'textarea' ? 500 : 300)),
    'data-cms-edit-required': required ? '1' : '0',
    'data-cms-edit-nullable': nullable ? '1' : '0',
    'data-cms-edit-search': search.trim() || String(newsId),
  }

  if (patchKey) {
    attrs['data-cms-edit-api-url'] = `/api/admin/news/${newsId}`
    attrs['data-cms-edit-patch-key'] = patchKey
  }

  return attrs
}

export default function NewsDetailView({
  news,
  htmlZh,
  htmlEn,
  relatedNews = [],
  previousNews = null,
  nextNews = null,
  pageModules = [],
}: Props) {
  const { lang } = useLanguage()
  const modules = moduleMap(pageModules)
  const uiModule = modules.get('ui') ?? null
  const title = lang === 'zh' ? news.title_zh || news.title_en : news.title_en || news.title_zh
  const excerpt = lang === 'zh' ? news.excerpt_zh || news.excerpt_en : news.excerpt_en || news.excerpt_zh
  const html = lang === 'zh' ? htmlZh : htmlEn
  const dateStr = formatNewsDate(news.published_at, lang)
  const zh = lang === 'zh'
  const category = zh
    ? news.category_title_zh || news.category_title_en
    : news.category_title_en || news.category_title_zh
  const contactHref = buildContactHref(`news:${news.slug}:contact_cta`)
  const uiItem = (id: string) => itemById(uiModule, id)
  const uiLabel = (id: string, fallbackZh: string, fallbackEn: string) => itemLabel(uiItem(id), lang) || (zh ? fallbackZh : fallbackEn)
  const uiHref = (id: string, fallbackHref: string) => normalizeSiteHref(uiItem(id)?.href, fallbackHref)
  const heroCtaLabel = uiLabel('detail-hero-cta', '带着这篇动态咨询', 'Inquire from this update')
  const titleAttrs = newsCmsEditAttrs({
    newsId: news.id,
    field: zh ? '新闻标题（中文）' : 'News title',
    targetId: `detail-title-${lang}`,
    search: title,
    value: title,
    patchKey: zh ? 'title_zh' : 'title_en',
    required: true,
  })
  const excerptAttrs = newsCmsEditAttrs({
    newsId: news.id,
    field: zh ? '新闻摘要（中文）' : 'News excerpt',
    targetId: `detail-excerpt-${lang}`,
    search: title,
    value: excerpt ?? '',
    patchKey: zh ? 'excerpt_zh' : 'excerpt_en',
    input: 'textarea',
    maxLength: 500,
    nullable: true,
  })
  const coverAttrs = newsCmsEditAttrs({
    newsId: news.id,
    field: '新闻封面',
    targetId: 'detail-cover',
    search: title,
    value: news.cover_image_source_url ?? news.cover_image_url ?? '',
    patchKey: 'cover_image_url',
    input: 'image',
    maxLength: 1000,
    nullable: true,
  })
  const bodyAttrs = newsCmsEditAttrs({
    newsId: news.id,
    field: zh ? '新闻正文（中文）' : 'News body',
    targetId: `detail-body-${lang}`,
    search: title,
    value: '',
    input: 'textarea',
  })
  const relatedTitleAttrs = (item: NewsRelatedItem, targetId: string) => newsCmsEditAttrs({
    newsId: item.id,
    field: zh ? '新闻标题（中文）' : 'News title',
    targetId: `${targetId}-title-${lang}`,
    search: displayNewsTitle(item, lang),
    value: displayNewsTitle(item, lang),
    patchKey: zh ? 'title_zh' : 'title_en',
    required: true,
  })
  const relatedExcerptAttrs = (item: NewsRelatedItem, targetId: string) => newsCmsEditAttrs({
    newsId: item.id,
    field: zh ? '新闻摘要（中文）' : 'News excerpt',
    targetId: `${targetId}-excerpt-${lang}`,
    search: displayNewsTitle(item, lang),
    value: displayNewsExcerpt(item, lang) ?? '',
    patchKey: zh ? 'excerpt_zh' : 'excerpt_en',
    input: 'textarea',
    maxLength: 500,
    nullable: true,
  })
  const relatedCoverAttrs = (item: NewsRelatedItem, targetId: string) => newsCmsEditAttrs({
    newsId: item.id,
    field: '新闻封面',
    targetId: `${targetId}-cover`,
    search: displayNewsTitle(item, lang),
    value: item.cover_image_source_url ?? item.cover_image_url ?? '',
    patchKey: 'cover_image_url',
    input: 'image',
    maxLength: 1000,
    nullable: true,
  })
  const nextSteps = [
    {
      id: 'detail-step-products',
      detailId: 'detail-step-products-body',
      href: uiHref('detail-step-products', '/products'),
      label: uiLabel('detail-step-products', '查看相关产品', 'Explore products'),
      detail: uiLabel('detail-step-products-body', '回到产品目录，对照型号与配置。', 'Review product lines and configurations.'),
    },
    {
      id: 'detail-step-cases',
      detailId: 'detail-step-cases-body',
      href: uiHref('detail-step-cases', '/cases'),
      label: uiLabel('detail-step-cases', '查看项目案例', 'View project cases'),
      detail: uiLabel('detail-step-cases-body', '用真实项目判断场景适配。', 'Use project references to compare scenarios.'),
    },
    {
      id: 'detail-step-contact',
      detailId: 'detail-step-contact-body',
      href: uiHref('detail-step-contact', contactHref),
      label: uiLabel('detail-step-contact', '提交采购需求', 'Start inquiry'),
      detail: uiLabel('detail-step-contact-body', '团队按这篇动态跟进采购背景。', 'Let the team follow up from this article context.'),
    },
  ]
  const readingLinks = [
    nextNews
      ? {
          key: 'next',
          itemId: 'detail-newer',
          label: uiLabel('detail-newer', '更新一篇', 'Newer update'),
          item: nextNews,
        }
      : null,
    previousNews
      ? {
          key: 'previous',
          itemId: 'detail-older',
          label: uiLabel('detail-older', '上一篇', 'Older update'),
          item: previousNews,
        }
      : null,
  ].filter((item): item is { key: string; itemId: string; label: string; item: NewsRelatedItem } => Boolean(item))

  if (!title) return null

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      <section className="relative bg-[#241F1B] pt-28">
        {news.cover_image_url ? (
          <div className="relative h-[420px] overflow-hidden" {...coverAttrs}>
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
              <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl" {...titleAttrs}>{title}</h1>
              {excerpt ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C9BEB4]" {...excerptAttrs}>{excerpt}</p> : null}
              <Link
                href={uiHref('detail-hero-cta', contactHref)}
                prefetch={false}
                className="mt-5 inline-flex min-h-10 items-center bg-[#E36F2C] px-4 text-sm font-bold text-white transition hover:bg-[#C85A1F]"
                {...newsHrefAttrs('ui', 'detail-hero-cta')}
              >
                <span {...newsLabelAttrs('ui', 'detail-hero-cta', lang)}>{heroCtaLabel}</span>
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
            <h1 className="mt-3 text-3xl font-bold leading-tight text-[#F5F2ED] sm:text-4xl" {...titleAttrs}>{title}</h1>
            {excerpt ? <p className="mt-4 text-base leading-relaxed text-[#C9BEB4]" {...excerptAttrs}>{excerpt}</p> : null}
            <Link
              href={uiHref('detail-hero-cta', contactHref)}
              prefetch={false}
              className="mt-5 inline-flex min-h-10 items-center bg-[#E36F2C] px-4 text-sm font-bold text-white transition hover:bg-[#C85A1F]"
              {...newsHrefAttrs('ui', 'detail-hero-cta')}
            >
              <span {...newsLabelAttrs('ui', 'detail-hero-cta', lang)}>{heroCtaLabel}</span>
            </Link>
          </div>
        )}
      </section>

      {html ? (
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div
              className="prose prose-stone prose-orange max-w-none"
              {...bodyAttrs}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </section>
      ) : null}

      <section id="news-reading-continuity" className="pb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-md border border-[#E5DED4] bg-white shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="border-l-4 border-[#1889B6] px-4 py-5 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1889B6]" {...newsLabelAttrs('ui', 'detail-continue-eyebrow', lang)}>
                  {uiLabel('detail-continue-eyebrow', '继续阅读', 'Continue reading')}
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#2C2A28]" {...newsLabelAttrs('ui', 'detail-continue-title', lang)}>
                  {uiLabel('detail-continue-title', '从这篇动态继续浏览新闻与相关主题', 'Keep browsing updates and related topics')}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B6560]" {...newsLabelAttrs('ui', 'detail-continue-body', lang)}>
                  {uiLabel('detail-continue-body', '继续查看上一篇、下一篇和相关动态，也可以进入产品、案例或咨询路径。', 'Continue to newer, older, and related updates, or move into products, cases, and inquiry.')}
                </p>
              </div>
              <div className="border-t border-[#E5DED4] bg-[#FBF8F3] px-4 py-4 lg:border-l lg:border-t-0">
                <p className="text-xs font-semibold text-[#8A8580]" {...newsLabelAttrs('ui', 'detail-reading-path', lang)}>
                  {uiLabel('detail-reading-path', '阅读路径', 'Reading path')}
                </p>
                <p className="mt-1 text-2xl font-bold text-[#2C2A28]">
                  {(readingLinks.length + relatedNews.length).toLocaleString(zh ? 'zh-CN' : 'en-US')}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#6B6560]" {...newsLabelAttrs('ui', 'detail-reading-path-note', lang)}>
                  {uiLabel('detail-reading-path-note', '可继续打开的新闻入口', 'News entries available from here')}
                </p>
              </div>
            </div>

            {readingLinks.length > 0 ? (
              <div className="grid grid-cols-1 border-t border-[#E5DED4] md:grid-cols-2">
                {readingLinks.map((link) => {
                  const itemTitle = displayNewsTitle(link.item, lang)
                  const itemDate = formatNewsDate(link.item.published_at, lang)
                  return (
                    <Link
                      key={link.key}
                      href={`/news/${link.item.slug}`}
                      prefetch={false}
                      data-visual-open-panel="news-reading-link"
                      className="group min-h-[112px] border-b border-[#E5DED4] px-4 py-4 transition hover:bg-[#FFF7F0] md:border-b-0 md:border-r last:border-r-0"
                    >
                      <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[#1889B6]" {...newsLabelAttrs('ui', link.itemId, lang)}>{link.label}</span>
                      <span className="mt-2 line-clamp-2 block text-sm font-bold leading-5 text-[#2C2A28] transition group-hover:text-[#E36F2C]" {...relatedTitleAttrs(link.item, `reading-${link.key}`)}>
                        {itemTitle}
                      </span>
                      {itemDate ? <span className="mt-2 block text-xs text-[#8A8580]">{itemDate}</span> : null}
                    </Link>
                  )
                })}
              </div>
            ) : null}

            {relatedNews.length > 0 ? (
              <div className="border-t border-[#E5DED4] px-4 py-5 sm:px-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-[#2C2A28]" {...newsLabelAttrs('ui', 'detail-related-title', lang)}>
                    {uiLabel('detail-related-title', '相关新闻', 'Related news')}
                  </h3>
                  <Link
                    href={uiHref('detail-related-back', '/news#news-discovery-console')}
                    prefetch={false}
                    className="text-xs font-bold text-[#1889B6] transition hover:text-[#E36F2C]"
                    {...newsHrefAttrs('ui', 'detail-related-back')}
                  >
                    <span {...newsLabelAttrs('ui', 'detail-related-back', lang)}>{uiLabel('detail-related-back', '回到新闻发现', 'Back to discovery')}</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {relatedNews.map((item) => {
                    const itemTitle = displayNewsTitle(item, lang)
                    const itemExcerpt = displayNewsExcerpt(item, lang)
                    const itemDate = formatNewsDate(item.published_at, lang)

                    return (
                      <Link
                        key={item.slug}
                        href={`/news/${item.slug}`}
                        prefetch={false}
                        data-visual-open-panel="news-related-card"
                        className="group overflow-hidden rounded-md border border-[#E5DED4] bg-[#FAF7F2] transition hover:border-[#E36F2C]/50 hover:bg-white"
                      >
                        {item.cover_image_url ? (
                          <div className="relative h-28 overflow-hidden bg-[#EFE8DE]" {...relatedCoverAttrs(item, `related-${item.id}`)}>
                            <ProtectedImage
                              src={item.cover_image_url}
                              alt={itemTitle}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          </div>
                        ) : null}
                        <span className="block p-3">
                          {itemDate ? <span className="block text-[11px] text-[#8A8580]">{itemDate}</span> : null}
                          <span className="mt-1 line-clamp-2 block text-sm font-bold leading-5 text-[#2C2A28] transition group-hover:text-[#E36F2C]" {...relatedTitleAttrs(item, `related-${item.id}`)}>
                            {itemTitle}
                          </span>
                          {itemExcerpt ? (
                            <span className="mt-2 line-clamp-2 block text-xs leading-5 text-[#6B6560]" {...relatedExcerptAttrs(item, `related-${item.id}`)}>
                              {itemExcerpt}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-md border border-[#E5DED4] bg-white shadow-sm">
            <div className="border-l-4 border-[#E36F2C] px-4 py-5 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E36F2C]" {...newsLabelAttrs('ui', 'detail-next-eyebrow', lang)}>
                {uiLabel('detail-next-eyebrow', '下一步路径', 'Next step')}
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#2C2A28]" {...newsLabelAttrs('ui', 'detail-next-title', lang)}>
                {uiLabel('detail-next-title', '把新闻线索转成产品、案例或采购咨询', 'Turn this update into product, case, or inquiry context')}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B6560]" {...newsLabelAttrs('ui', 'detail-next-body', lang)}>
                {uiLabel('detail-next-body', '如果这篇动态与你的项目相关，可以继续查看产品目录和交付案例，或直接把需求提交给团队。', 'If this update is relevant to your project, continue to product lines, delivery cases, or submit an inquiry to the team.')}
              </p>
            </div>
            <div className="grid grid-cols-1 border-t border-[#E5DED4] md:grid-cols-3">
              {nextSteps.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={false}
                  className="group min-h-[108px] border-b border-[#E5DED4] px-4 py-4 transition hover:bg-[#FFF7F0] md:border-b-0 md:border-r last:border-r-0"
                  {...newsHrefAttrs('ui', item.id)}
                >
                  <span className="block text-sm font-bold text-[#2C2A28] transition group-hover:text-[#E36F2C]" {...newsLabelAttrs('ui', item.id, lang)}>{item.label}</span>
                  <span className="mt-2 block text-xs leading-5 text-[#6B6560]" {...newsLabelAttrs('ui', item.detailId, lang)}>{item.detail}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <Link
              href={uiHref('detail-back-list', '/news')}
              prefetch={false}
              className="inline-flex min-h-10 items-center rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-4 text-sm font-semibold text-[#2C2A28] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
              {...newsHrefAttrs('ui', 'detail-back-list')}
            >
              <span {...newsLabelAttrs('ui', 'detail-back-list', lang)}>{uiLabel('detail-back-list', '返回新闻列表', 'Back to news')}</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
