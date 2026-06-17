'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ConversionInquiryForm, { type FormLabels } from '@/components/pages/ConversionInquiryForm'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  itemById,
  itemContent,
  itemLabel,
  itemValue,
  moduleDescription,
  moduleMap,
  moduleTitle,
  visibleItems,
  type PublicPageModule,
} from '@/lib/page-module-client'
import { buildNextImageFallbackSrc } from '@/lib/image-optimization'
import { buildLeadSource, normalizeSiteHref } from '@/lib/site-links'

type Props = {
  pageModules: PublicPageModule[]
  purchaseFaqItems: Array<{
    id: string
    question_zh: string
    question_en: string
    answer_zh: string
    answer_en: string
  }>
  initialSource?: string | null
}

function formLabelsFromModule(pageModule: PublicPageModule | null, lang: 'en' | 'zh'): FormLabels {
  return {
    eyebrow: itemLabel(itemById(pageModule, 'form-eyebrow'), lang),
    name: itemLabel(itemById(pageModule, 'form-name'), lang),
    email: itemLabel(itemById(pageModule, 'form-email'), lang),
    phone: itemLabel(itemById(pageModule, 'form-phone'), lang),
    country: itemLabel(itemById(pageModule, 'form-country'), lang),
    company: itemLabel(itemById(pageModule, 'form-company'), lang),
    quantity: itemLabel(itemById(pageModule, 'form-quantity'), lang),
    message: itemLabel(itemById(pageModule, 'form-message'), lang),
    submit: itemLabel(itemById(pageModule, 'form-submit'), lang),
    submitting: itemLabel(itemById(pageModule, 'form-submitting'), lang),
    success: itemLabel(itemById(pageModule, 'form-success'), lang),
    error: itemLabel(itemById(pageModule, 'form-error'), lang),
    sourcePrefix: itemLabel(itemById(pageModule, 'form-source-prefix'), lang),
    companyPrefix: itemLabel(itemById(pageModule, 'form-company-prefix'), lang),
  }
}

function sourceFromUrl(value: string | null) {
  return buildLeadSource('contact', 'main', 'inquiry_form', value)
}

function sanitizeSource(value: string | null) {
  const clean = String(value ?? '').trim()
  if (!clean) return null
  return clean.slice(0, 160)
}

function newsSourceHref(source: string) {
  const slug = source.split(':')[1]?.trim() ?? ''
  if (!slug || slug === 'list' || !/^[a-zA-Z0-9_-]+$/.test(slug)) return '/news'
  return `/news/${slug}`
}

function sourceContext(value: string | null, lang: 'en' | 'zh', pageModule: PublicPageModule | null) {
  const source = sanitizeSource(value)
  if (!source) return null
  if (pageModule?.is_visible === false) return null
  const zh = lang === 'zh'
  const lower = source.toLowerCase()

  if (lower.startsWith('news')) {
    const href = newsSourceHref(source)
    const item = itemById(pageModule, 'context-news')
    const detailLabelItem = itemById(pageModule, 'context-news-detail')
    return {
      itemId: 'context-news',
      hrefLabelItemId: href === '/news' ? 'context-news' : 'context-news-detail',
      title: itemLabel(item, lang) || (zh ? '来自新闻动态' : 'From a news update'),
      detail: itemContent(item, lang) || (
        zh
          ? '如果这条动态与你的项目相关，可以在表单里补充产品、场景或采购时间。'
          : 'If the update is relevant, add product, scenario, or timing context in the form.'
      ),
      href,
      hrefLabel: href === '/news'
        ? itemValue(item, lang) || (zh ? '返回新闻' : 'Back to news')
        : itemValue(detailLabelItem, lang) || (zh ? '返回这篇动态' : 'Back to this update'),
    }
  }

  if (lower.startsWith('product') || lower.includes('products')) {
    const item = itemById(pageModule, 'context-product')
    return {
      itemId: 'context-product',
      hrefLabelItemId: 'context-product',
      title: itemLabel(item, lang) || (zh ? '来自产品路径' : 'From a product path'),
      detail: itemContent(item, lang) || (
        zh
          ? '团队会结合你查看的产品路径判断型号、配置和数量需求。'
          : 'The team can use the product path to discuss model, configuration, and quantity needs.'
      ),
      href: normalizeSiteHref(item?.href, '/products'),
      hrefLabel: itemValue(item, lang) || (zh ? '返回产品' : 'Back to products'),
    }
  }

  if (lower.startsWith('case') || lower.includes('cases')) {
    const item = itemById(pageModule, 'context-case')
    return {
      itemId: 'context-case',
      hrefLabelItemId: 'context-case',
      title: itemLabel(item, lang) || (zh ? '来自项目案例' : 'From a project case'),
      detail: itemContent(item, lang) || (
        zh
          ? '可以补充项目所在地、场地类型、预计规模和交付时间。'
          : 'Add location, site type, approximate scale, and delivery timing if available.'
      ),
      href: normalizeSiteHref(item?.href, '/cases'),
      hrefLabel: itemValue(item, lang) || (zh ? '返回案例' : 'Back to cases'),
    }
  }

  const item = itemById(pageModule, 'context-site')
  return {
    itemId: 'context-site',
    hrefLabelItemId: 'context-site',
    title: itemLabel(item, lang) || (zh ? '来自站内咨询入口' : 'From a site inquiry path'),
    detail: itemContent(item, lang) || (
      zh
        ? '团队会参考本次访问路径，更快理解你的咨询背景。'
        : 'The team can use this context to understand your inquiry path faster.'
    ),
    href: normalizeSiteHref(item?.href, '/products'),
    hrefLabel: itemValue(item, lang) || (zh ? '查看产品' : 'View products'),
  }
}

function isDirectContactHref(href: string | undefined) {
  return Boolean(
    href?.startsWith('mailto:') ||
    href?.startsWith('tel:') ||
    href?.startsWith('https://wa.me/'),
  )
}

export default function ContactPageContent({ pageModules, purchaseFaqItems, initialSource = null }: Props) {
  const { lang } = useLanguage()
  const modules = moduleMap(pageModules)
  const heroModule = modules.get('hero') ?? null
  const channelsModule = modules.get('channels') ?? null
  const formModule = modules.get('form') ?? null
  const backupModule = modules.get('backup') ?? null
  const faqPanelModule = modules.get('faq-panel') ?? null
  const sourceContextModule = modules.get('source-context') ?? null
  const source = sourceFromUrl(initialSource)
  const context = sourceContext(initialSource, lang, sourceContextModule)
  const contextEyebrow = itemLabel(itemById(sourceContextModule, 'context-eyebrow'), lang) || (lang === 'zh' ? '咨询来源' : 'Inquiry context')

  const heroTitle = moduleTitle(heroModule, lang)
  const heroDescription = moduleDescription(heroModule, lang)
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang)
  const primaryCta = itemById(heroModule, 'primary-cta')
  const secondaryCta = itemById(heroModule, 'secondary-cta')
  const heroItems = visibleItems(heroModule)
  const heroImages = heroItems.filter((item) => item.image_url)
  const heroPrimaryImage = heroImages[0] ?? null
  const heroProofItems = heroItems.filter((item) => {
    if (item.image_url) return false
    if (['eyebrow', 'primary-cta', 'secondary-cta'].includes(item.id)) return false
    return Boolean(itemValue(item, lang) || itemContent(item, lang) || itemLabel(item, lang))
  })
  const formInquiryType = itemLabel(itemById(formModule, 'inquiry-type'), lang)
  const formModel = itemLabel(itemById(formModule, 'form-model'), lang)
  const formLabels = formLabelsFromModule(formModule, lang)
  const backupTitle = moduleTitle(backupModule, lang)
  const backupDescription = moduleDescription(backupModule, lang)
  const backupLink = itemById(backupModule, 'legacy-contact')
  const hasBackupContent = Boolean(backupModule?.is_visible !== false && (backupTitle || backupDescription || backupLink))
  const faqPanelTitle = moduleTitle(faqPanelModule, lang)
  const faqPanelDescription = moduleDescription(faqPanelModule, lang)
  const hasFaqPanel = Boolean(
    faqPanelModule?.is_visible !== false &&
    purchaseFaqItems.length > 0 &&
    (faqPanelTitle || faqPanelDescription),
  )
  const primaryFaqItems = hasFaqPanel ? purchaseFaqItems.slice(0, 4) : []
  const secondaryFaqItems = hasFaqPanel ? purchaseFaqItems.slice(4, 8) : []
  const hasSupportPanel = hasBackupContent || hasFaqPanel
  const hasAnyContent = pageModules.some((module) => module.is_visible !== false)

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1F2A31]">
      <Navbar />
      <main className="pt-16">
        {heroModule?.is_visible !== false && (heroTitle || heroDescription || heroEyebrow) ? (
          <section className="relative overflow-hidden bg-[#241F1B] text-white">
            {heroPrimaryImage?.image_url ? (
              <Image
                src={heroPrimaryImage.image_url}
                alt={itemLabel(heroPrimaryImage, lang)}
                fill
                priority
                sizes="100vw"
                overrideSrc={buildNextImageFallbackSrc(heroPrimaryImage.image_url, 1920)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-[#17120F] via-[#17120F]/85 to-[#17120F]/30" />
            <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:py-24 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:py-16">
              <div className="max-w-4xl">
                {heroEyebrow ? (
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#E36F2C]">
                    {heroEyebrow}
                  </p>
                ) : null}
                {heroTitle ? (
                  <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                    {heroTitle}
                  </h1>
                ) : null}
                {heroDescription ? (
                  <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                    {heroDescription}
                  </p>
                ) : null}
                <div className="mt-7 flex flex-wrap gap-3">
                  {primaryCta && itemLabel(primaryCta, lang) && primaryCta.href ? (
                    <Link prefetch={false}
                      href={normalizeSiteHref(primaryCta.href)}
                      className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]"
                    >
                      {itemLabel(primaryCta, lang)}
                    </Link>
                  ) : null}
                  {secondaryCta && itemLabel(secondaryCta, lang) && secondaryCta.href ? (
                    <Link prefetch={false}
                      href={normalizeSiteHref(secondaryCta.href, '/products')}
                      className="inline-flex min-h-11 items-center justify-center border border-white/25 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white/80 transition hover:border-[#E36F2C] hover:text-[#E36F2C]"
                    >
                      {itemLabel(secondaryCta, lang)}
                    </Link>
                  ) : null}
                </div>
                {heroProofItems.length > 0 ? (
                  <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                    {heroProofItems.slice(0, 3).map((item) => {
                      const value = itemValue(item, lang) || itemLabel(item, lang)
                      const content = itemContent(item, lang)
                      if (!value && !content) return null
                      return (
                        <div key={item.id} className="border border-white/15 bg-black/20 p-4 backdrop-blur-sm">
                          {value ? <div className="text-lg font-black text-white">{value}</div> : null}
                          {content ? <div className="mt-1 text-xs leading-5 text-white/65">{content}</div> : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              {channelsModule?.is_visible !== false && visibleItems(channelsModule).length > 0 ? (
                <div className="border border-white/15 bg-[#14110F]/80 p-5 shadow-2xl backdrop-blur-md">
                  <div className="space-y-3">
                    {visibleItems(channelsModule).map((item) => {
                      const label = itemLabel(item, lang)
                      const content = itemContent(item, lang)
                      if (!label && !content) return null
                      const body = (
                        <>
                          {label ? <div className="text-sm font-bold text-white">{label}</div> : null}
                          {content ? <div className="mt-1 text-sm leading-6 text-white/55">{content}</div> : null}
                        </>
                      )
                      return (
                        <div key={item.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                          {isDirectContactHref(item.href)
                            ? <a href={item.href} className="block rounded-sm px-2 py-1 transition hover:bg-white/10 hover:text-[#E36F2C]">{body}</a>
                            : body}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {formModule && formModule.is_visible !== false ? (
          <section className="px-4 py-14 sm:py-16">
            <div className={`mx-auto grid gap-8 ${hasSupportPanel ? 'max-w-7xl lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:items-start' : 'max-w-3xl'}`}>
              {hasSupportPanel ? (
                <div className="space-y-5">
                  {hasFaqPanel ? (
                    <div className="border border-[#DADDE1] bg-white p-5 sm:p-6">
                      <div className="border-b border-[#E5E0DA] pb-5">
                        {faqPanelTitle ? (
                          <h2 className="text-2xl font-black tracking-normal text-[#1F2A31] sm:text-3xl">
                            {faqPanelTitle}
                          </h2>
                        ) : null}
                        {faqPanelDescription ? (
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5C6670]">
                            {faqPanelDescription}
                          </p>
                        ) : null}
                      </div>
                      {primaryFaqItems.length > 0 ? (
                        <div className="divide-y divide-[#E5E0DA]">
                          {primaryFaqItems.map((item) => {
                            const question = lang === 'zh' ? item.question_zh : item.question_en
                            const answer = lang === 'zh' ? item.answer_zh : item.answer_en
                            if (!question || !answer) return null
                            return (
                              <article key={item.id} className="py-4">
                                <h3 className="text-base font-black leading-snug text-[#1F2A31]">{question}</h3>
                                <p className="mt-2 text-sm leading-7 text-[#5C6670]">{answer}</p>
                              </article>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {hasBackupContent ? (
                    <div className="border border-[#DADDE1] bg-white p-5">
                      {backupTitle ? <div className="text-sm font-bold text-[#1F2A31]">{backupTitle}</div> : null}
                      {backupDescription ? <p className="mt-2 text-sm leading-6 text-[#5C6670]">{backupDescription}</p> : null}
                      {backupLink?.href && itemLabel(backupLink, lang) ? (
                        <a
                          href={backupLink.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex text-sm font-bold text-[#E36F2C] hover:text-[#C85A1F]"
                        >
                          {itemLabel(backupLink, lang)}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className={hasSupportPanel ? 'lg:sticky lg:top-24' : undefined}>
                {context ? (
                  <div
                    className="mb-4 border border-[#DADDE1] bg-white p-4 shadow-sm"
                    data-page-module="contact:source-context"
                    data-page-key="contact"
                    data-module-key="source-context"
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-[0.16em] text-[#147C94]"
                      data-page-module-item="context-eyebrow"
                      data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                    >
                      {contextEyebrow}
                    </p>
                    <h2
                      className="mt-2 text-base font-black text-[#1F2A31]"
                      data-page-module-item={context.itemId}
                      data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                    >
                      {context.title}
                    </h2>
                    <p
                      className="mt-2 text-sm leading-6 text-[#5C6670]"
                      data-page-module-item={context.itemId}
                      data-page-module-field={lang === 'zh' ? 'content_zh' : 'content_en'}
                    >
                      {context.detail}
                    </p>
                    <Link
                      href={context.href}
                      prefetch={false}
                      className="mt-3 inline-flex min-h-9 items-center border border-[#DADDE1] px-3 text-xs font-bold text-[#1F2A31] transition hover:border-[#E36F2C]/60 hover:text-[#E36F2C]"
                      data-page-module-item={context.hrefLabelItemId}
                      data-page-module-field={lang === 'zh' ? 'value_zh' : 'value_en'}
                    >
                      {context.hrefLabel}
                    </Link>
                  </div>
                ) : null}
                <ConversionInquiryForm
                  source={source}
                  inquiryType={formInquiryType}
                  model={formModel}
                  titleEn={formModule.title_en ?? ''}
                  titleZh={formModule.title_zh ?? ''}
                  descriptionEn={formModule.description_en ?? ''}
                  descriptionZh={formModule.description_zh ?? ''}
                  labels={formLabels}
                />
              </div>
            </div>
          </section>
        ) : null}

        {secondaryFaqItems.length > 0 ? (
          <section className="border-y border-[#DADDE1] bg-white px-4 py-14 sm:py-16">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-4 md:grid-cols-2">
                {secondaryFaqItems.map((item) => {
                  const question = lang === 'zh' ? item.question_zh : item.question_en
                  const answer = lang === 'zh' ? item.answer_zh : item.answer_en
                  if (!question || !answer) return null
                  return (
                    <article key={item.id} className="border border-[#DADDE1] bg-[#FAFBFB] p-5">
                      <h3 className="text-base font-black leading-snug text-[#1F2A31]">{question}</h3>
                      <p className="mt-3 text-sm leading-7 text-[#5C6670]">{answer}</p>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {!hasAnyContent ? <section className="min-h-[40vh]" /> : null}
      </main>
      <Footer />
    </div>
  )
}
