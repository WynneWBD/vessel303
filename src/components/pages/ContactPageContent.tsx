'use client'

import { useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
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
    content_id: number
    slug: string
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

function faqCmsEditAttrs({
  contentId,
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
  contentId: number
  field: string
  patchKey: string
  targetId: string
  search: string
  value: string
  input?: 'text' | 'textarea'
  maxLength?: number
  required?: boolean
  nullable?: boolean
}) {
  const safeSearch = search.trim() || String(contentId)
  return {
    'data-cms-edit-kind': 'site-content',
    'data-cms-edit-title': 'FAQ 内容',
    'data-cms-edit-field': field,
    'data-cms-edit-url': `/admin/content/faq?search=${encodeURIComponent(safeSearch)}#b9-content-workbench`,
    'data-cms-edit-id': `site-content-faq-${contentId}-${targetId}`,
    'data-cms-edit-value': value,
    'data-cms-edit-api-url': `/api/admin/site-content/${contentId}`,
    'data-cms-edit-patch-key': patchKey,
    'data-cms-edit-input': input,
    'data-cms-edit-max-length': String(maxLength ?? (input === 'textarea' ? 20000 : 240)),
    'data-cms-edit-required': required ? '1' : '0',
    'data-cms-edit-nullable': nullable ? '1' : '0',
  }
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

function VisualImageEditButton({
  itemId,
  label = '编辑图片',
}: {
  itemId?: string | null
  label?: string
}) {
  const visualDraftPreview = useVisualDraftPreview()
  if (!visualDraftPreview || !itemId) return null

  return (
    <button
      type="button"
      aria-label={label}
      className="absolute left-4 top-24 z-30 inline-flex h-9 items-center gap-1.5 rounded-md border border-white/75 bg-black/55 px-3 text-white shadow-[0_12px_28px_rgba(0,0,0,0.24)] backdrop-blur-sm transition hover:border-[#E36F2C] hover:bg-[#E36F2C] focus:outline-none focus:ring-2 focus:ring-[#E36F2C] focus:ring-offset-2 focus:ring-offset-transparent"
      data-page-module-item={itemId}
      data-page-module-field="image_url"
    >
      <ImageIcon aria-hidden="true" className="h-4 w-4" />
      <span className="text-xs font-semibold">图片</span>
    </button>
  )
}

export default function ContactPageContent({ pageModules, purchaseFaqItems, initialSource = null }: Props) {
  const { lang } = useLanguage()
  const visualDraftPreview = useVisualDraftPreview()
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

  const heroTitle = moduleTitle(heroModule, lang) || (visualDraftPreview && heroModule ? (lang === 'zh' ? '联系 VESSEL' : 'Contact VESSEL') : '')
  const heroDescription = moduleDescription(heroModule, lang) || (visualDraftPreview && heroModule ? (lang === 'zh' ? '补充联系页首屏说明。' : 'Add the contact hero description.') : '')
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang) || (visualDraftPreview && heroModule ? (lang === 'zh' ? '联系我们' : 'Contact') : '')
  const primaryCta = itemById(heroModule, 'primary-cta')
  const secondaryCta = itemById(heroModule, 'secondary-cta')
  const primaryCtaLabel = itemLabel(primaryCta, lang) || (visualDraftPreview && primaryCta ? (lang === 'zh' ? '提交咨询' : 'Send inquiry') : '')
  const primaryCtaHref = primaryCta?.href || (visualDraftPreview && primaryCta ? '#contact-form' : '')
  const secondaryCtaLabel = itemLabel(secondaryCta, lang) || (visualDraftPreview && secondaryCta ? (lang === 'zh' ? '查看产品' : 'View products') : '')
  const secondaryCtaHref = secondaryCta?.href || (visualDraftPreview && secondaryCta ? '/products' : '')
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
  const backupTitle = moduleTitle(backupModule, lang) || (visualDraftPreview && backupModule ? (lang === 'zh' ? '备用联系方式' : 'Backup contact') : '')
  const backupDescription = moduleDescription(backupModule, lang) || (visualDraftPreview && backupModule ? (lang === 'zh' ? '补充无法提交表单时的备用联系说明。' : 'Add backup contact instructions for visitors who cannot submit the form.') : '')
  const backupLink = itemById(backupModule, 'legacy-contact')
  const backupLinkLabel = itemLabel(backupLink, lang) || (visualDraftPreview && backupLink ? (lang === 'zh' ? '联系团队' : 'Contact team') : '')
  const backupLinkHref = backupLink?.href || (visualDraftPreview && backupLink ? '/contact' : '')
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
          <section
            className="relative overflow-hidden bg-[#241F1B] text-white"
            data-page-module="contact:hero"
            data-page-key="contact"
            data-module-key="hero"
          >
            {heroPrimaryImage?.image_url ? (
              <Image
                src={heroPrimaryImage.image_url}
                alt={itemLabel(heroPrimaryImage, lang)}
                fill
                priority
                sizes="100vw"
                overrideSrc={buildNextImageFallbackSrc(heroPrimaryImage.image_url, 1920)}
                className="absolute inset-0 h-full w-full object-cover"
                data-page-module-item={heroPrimaryImage.id}
                data-page-module-field="image_url"
              />
            ) : null}
            <VisualImageEditButton itemId={heroPrimaryImage?.id} label={lang === 'zh' ? '编辑联系页首屏图片' : 'Edit contact hero image'} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#17120F] via-[#17120F]/85 to-[#17120F]/30" />
            <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:py-24 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:py-16">
              <div
                className="max-w-4xl"
                data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}
              >
                {heroEyebrow ? (
                  <p
                    className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#E36F2C]"
                    data-page-module-item="eyebrow"
                    data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                  >
                    {heroEyebrow}
                  </p>
                ) : null}
                {heroTitle ? (
                  <h1
                    className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-6xl"
                    data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}
                  >
                    {heroTitle}
                  </h1>
                ) : null}
                {heroDescription ? (
                  <p
                    className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg"
                    data-page-module-field={lang === 'zh' ? 'description_zh' : 'description_en'}
                  >
                    {heroDescription}
                  </p>
                ) : null}
                <div className="mt-7 flex flex-wrap gap-3">
                  {primaryCta && primaryCtaLabel && primaryCtaHref ? (
                    <Link prefetch={false}
                      href={normalizeSiteHref(primaryCtaHref)}
                      className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]"
                      data-page-module-item="primary-cta"
                      data-page-module-field="href"
                    >
                      <span
                        data-page-module-item="primary-cta"
                        data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                      >
                        {primaryCtaLabel}
                      </span>
                    </Link>
                  ) : null}
                  {secondaryCta && secondaryCtaLabel && secondaryCtaHref ? (
                    <Link prefetch={false}
                      href={normalizeSiteHref(secondaryCtaHref, '/products')}
                      className="inline-flex min-h-11 items-center justify-center border border-white/25 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white/80 transition hover:border-[#E36F2C] hover:text-[#E36F2C]"
                      data-page-module-item="secondary-cta"
                      data-page-module-field="href"
                    >
                      <span
                        data-page-module-item="secondary-cta"
                        data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                      >
                        {secondaryCtaLabel}
                      </span>
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
                        <div
                          key={item.id}
                          className="border border-white/15 bg-black/20 p-4 backdrop-blur-sm"
                          data-page-module-item={item.id}
                          data-page-module-field={itemValue(item, lang) ? (lang === 'zh' ? 'value_zh' : 'value_en') : (lang === 'zh' ? 'label_zh' : 'label_en')}
                        >
                          {value ? <div className="text-lg font-black text-white" data-page-module-field={itemValue(item, lang) ? (lang === 'zh' ? 'value_zh' : 'value_en') : (lang === 'zh' ? 'label_zh' : 'label_en')}>{value}</div> : null}
                          {content ? <div className="mt-1 text-xs leading-5 text-white/65" data-page-module-field={lang === 'zh' ? 'content_zh' : 'content_en'}>{content}</div> : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              {channelsModule?.is_visible !== false && visibleItems(channelsModule).length > 0 ? (
                <div
                  className="border border-white/15 bg-[#14110F]/80 p-5 shadow-2xl backdrop-blur-md"
                  data-page-module="contact:channels"
                  data-page-key="contact"
                  data-module-key="channels"
                >
                  <div className="space-y-3">
                    {visibleItems(channelsModule).map((item) => {
                      const label = itemLabel(item, lang)
                      const content = itemContent(item, lang)
                      if (!label && !content) return null
                      const body = (
                        <>
                          {label ? (
                            <div className="text-sm font-bold text-white" data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>
                              {label}
                            </div>
                          ) : null}
                          {content ? (
                            <div className="mt-1 text-sm leading-6 text-white/55" data-page-module-field={lang === 'zh' ? 'content_zh' : 'content_en'}>
                              {content}
                            </div>
                          ) : null}
                        </>
                      )
                      return (
                        <div
                          key={item.id}
                          className="border-b border-white/10 pb-3 last:border-0 last:pb-0"
                          data-page-module-item={item.id}
                          data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                        >
                          {isDirectContactHref(item.href)
                            ? <a href={item.href} className="block rounded-sm px-2 py-1 transition hover:bg-white/10 hover:text-[#E36F2C]" data-page-module-field="href">{body}</a>
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
                    <div
                      className="border border-[#DADDE1] bg-white p-5 sm:p-6"
                      data-page-module="contact:faq-panel"
                      data-page-key="contact"
                      data-module-key="faq-panel"
                      data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}
                    >
                      <div className="border-b border-[#E5E0DA] pb-5">
                        {faqPanelTitle ? (
                          <h2
                            className="text-2xl font-black tracking-normal text-[#1F2A31] sm:text-3xl"
                            data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}
                          >
                            {faqPanelTitle}
                          </h2>
                        ) : null}
                        {faqPanelDescription ? (
                          <p
                            className="mt-3 max-w-2xl text-sm leading-7 text-[#5C6670]"
                            data-page-module-field={lang === 'zh' ? 'description_zh' : 'description_en'}
                          >
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
                            const faqSearch = item.slug || question
                            const questionPatchKey = lang === 'zh' ? 'title_zh' : 'title_en'
                            const answerPatchKey = lang === 'zh' ? 'body_zh' : 'body_en'
                            const questionEditAttrs = faqCmsEditAttrs({
                              contentId: item.content_id,
                              field: 'FAQ 问题',
                              patchKey: questionPatchKey,
                              targetId: 'question',
                              search: faqSearch,
                              value: question,
                              maxLength: 240,
                              required: true,
                            })
                            const answerEditAttrs = faqCmsEditAttrs({
                              contentId: item.content_id,
                              field: 'FAQ 答案',
                              patchKey: answerPatchKey,
                              targetId: 'answer',
                              search: faqSearch,
                              value: answer,
                              input: 'textarea',
                              maxLength: 20000,
                              nullable: true,
                            })
                            return (
                              <article key={item.id} className="py-4" {...questionEditAttrs}>
                                <h3
                                  className="text-base font-black leading-snug text-[#1F2A31]"
                                  {...questionEditAttrs}
                                >
                                  {question}
                                </h3>
                                <p
                                  className="mt-2 text-sm leading-7 text-[#5C6670]"
                                  {...answerEditAttrs}
                                >
                                  {answer}
                                </p>
                              </article>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {hasBackupContent ? (
                    <div
                      className="border border-[#DADDE1] bg-white p-5"
                      data-page-module="contact:backup"
                      data-page-key="contact"
                      data-module-key="backup"
                      data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}
                    >
                      {backupTitle ? (
                        <div className="text-sm font-bold text-[#1F2A31]" data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}>
                          {backupTitle}
                        </div>
                      ) : null}
                      {backupDescription ? (
                        <p className="mt-2 text-sm leading-6 text-[#5C6670]" data-page-module-field={lang === 'zh' ? 'description_zh' : 'description_en'}>
                          {backupDescription}
                        </p>
                      ) : null}
                      {backupLink && backupLinkHref && backupLinkLabel ? (
                        <a
                          href={backupLinkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex text-sm font-bold text-[#E36F2C] hover:text-[#C85A1F]"
                          data-page-module-item="legacy-contact"
                          data-page-module-field="href"
                        >
                          <span
                            data-page-module-item="legacy-contact"
                            data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                          >
                            {backupLinkLabel}
                          </span>
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div
                className={hasSupportPanel ? 'lg:sticky lg:top-24' : undefined}
                data-page-module="contact:form"
                data-page-key="contact"
                data-module-key="form"
              >
                {context ? (
                  <div
                    className="mb-4 border border-[#DADDE1] bg-white p-4 shadow-sm"
                    data-page-module="contact:source-context"
                    data-page-key="contact"
                    data-module-key="source-context"
                    data-page-module-item={context.itemId}
                    data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
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
                  visualModuleId="contact:form"
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
                  const faqSearch = item.slug || question
                  const questionPatchKey = lang === 'zh' ? 'title_zh' : 'title_en'
                  const answerPatchKey = lang === 'zh' ? 'body_zh' : 'body_en'
                  const questionEditAttrs = faqCmsEditAttrs({
                    contentId: item.content_id,
                    field: 'FAQ 问题',
                    patchKey: questionPatchKey,
                    targetId: 'question-secondary',
                    search: faqSearch,
                    value: question,
                    maxLength: 240,
                    required: true,
                  })
                  const answerEditAttrs = faqCmsEditAttrs({
                    contentId: item.content_id,
                    field: 'FAQ 答案',
                    patchKey: answerPatchKey,
                    targetId: 'answer-secondary',
                    search: faqSearch,
                    value: answer,
                    input: 'textarea',
                    maxLength: 20000,
                    nullable: true,
                  })
                  return (
                    <article key={item.id} className="border border-[#DADDE1] bg-[#FAFBFB] p-5" {...questionEditAttrs}>
                      <h3
                        className="text-base font-black leading-snug text-[#1F2A31]"
                        {...questionEditAttrs}
                      >
                        {question}
                      </h3>
                      <p
                        className="mt-3 text-sm leading-7 text-[#5C6670]"
                        {...answerEditAttrs}
                      >
                        {answer}
                      </p>
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
