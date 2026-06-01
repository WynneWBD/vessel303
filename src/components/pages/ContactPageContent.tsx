'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ConversionInquiryForm, { type FormLabels } from '@/components/pages/ConversionInquiryForm'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  itemById,
  itemContent,
  itemLabel,
  moduleDescription,
  moduleMap,
  moduleTitle,
  visibleItems,
  type PublicPageModule,
} from '@/lib/page-module-client'
import { buildLeadSource, normalizeSiteHref } from '@/lib/site-links'

type Props = {
  pageModules: PublicPageModule[]
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

export default function ContactPageContent({ pageModules }: Props) {
  const { lang } = useLanguage()
  const modules = moduleMap(pageModules)
  const heroModule = modules.get('hero') ?? null
  const channelsModule = modules.get('channels') ?? null
  const formModule = modules.get('form') ?? null
  const backupModule = modules.get('backup') ?? null
  const source = sourceFromUrl(null)

  const heroTitle = moduleTitle(heroModule, lang)
  const heroDescription = moduleDescription(heroModule, lang)
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang)
  const primaryCta = itemById(heroModule, 'primary-cta')
  const secondaryCta = itemById(heroModule, 'secondary-cta')
  const formInquiryType = itemLabel(itemById(formModule, 'inquiry-type'), lang)
  const formModel = itemLabel(itemById(formModule, 'form-model'), lang)
  const formLabels = formLabelsFromModule(formModule, lang)
  const backupTitle = moduleTitle(backupModule, lang)
  const backupDescription = moduleDescription(backupModule, lang)
  const backupLink = itemById(backupModule, 'legacy-contact')
  const hasAnyContent = pageModules.some((module) => module.is_visible !== false)

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1F2A31]">
      <Navbar />
      <main className="pt-16">
        {heroModule?.is_visible !== false && (heroTitle || heroDescription || heroEyebrow) ? (
          <section className="bg-[#241F1B] px-4 py-20 text-white sm:py-24">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
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
                    <Link
                      href={normalizeSiteHref(primaryCta.href)}
                      className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]"
                    >
                      {itemLabel(primaryCta, lang)}
                    </Link>
                  ) : null}
                  {secondaryCta && itemLabel(secondaryCta, lang) && secondaryCta.href ? (
                    <Link
                      href={normalizeSiteHref(secondaryCta.href, '/products')}
                      className="inline-flex min-h-11 items-center justify-center border border-white/25 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white/80 transition hover:border-[#E36F2C] hover:text-[#E36F2C]"
                    >
                      {itemLabel(secondaryCta, lang)}
                    </Link>
                  ) : null}
                </div>
              </div>

              {channelsModule?.is_visible !== false && visibleItems(channelsModule).length > 0 ? (
                <div className="border border-white/10 bg-white/[0.04] p-5">
                  <div className="space-y-4">
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
                        <div key={item.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                          {item.href?.startsWith('mailto:') || item.href?.startsWith('tel:') || item.href?.startsWith('https://wa.me/')
                            ? <a href={item.href} className="block transition hover:text-[#E36F2C]">{body}</a>
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
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)]">
              <div>
                {moduleTitle(formModule, lang) ? (
                  <h2 className="text-3xl font-black tracking-normal text-[#1F2A31]">
                    {moduleTitle(formModule, lang)}
                  </h2>
                ) : null}
                {moduleDescription(formModule, lang) ? (
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[#5C6670]">
                    {moduleDescription(formModule, lang)}
                  </p>
                ) : null}
                {backupModule?.is_visible !== false && (backupTitle || backupDescription || backupLink) ? (
                  <div className="mt-8 border border-[#DADDE1] bg-white p-5">
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
          </section>
        ) : null}

        {!hasAnyContent ? <section className="min-h-[40vh]" /> : null}
      </main>
      <Footer />
    </div>
  )
}
