'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ConversionInquiryForm from '@/components/pages/ConversionInquiryForm'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  fetchPublicPageModules,
  itemById,
  itemContent,
  itemLabel,
  moduleDescription,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client'

export type FaqCategoryView = {
  key: string
  zh: string
  en: string
}

export type FaqItemView = {
  id: string
  category: string
  question_zh: string
  question_en: string
  answer_zh: string
  answer_en: string
}

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className={`border-b border-[#E5E0DA] transition-colors ${isOpen ? 'bg-white' : 'bg-transparent'}`}>
      <button
        className="group flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span
          className={`text-base font-medium leading-snug transition-colors ${
            isOpen ? 'text-[#2C2A28]' : 'text-[#2C2A28]/80 group-hover:text-[#E36F2C]'
          }`}
          style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
        >
          {question}
        </span>
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
            isOpen
              ? 'border-[#E36F2C] bg-[#E36F2C] text-white'
              : 'border-[#C4B9AB] text-[#8A8580] group-hover:border-[#E36F2C] group-hover:text-[#E36F2C]'
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-45' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-6 border-l-2 border-[#E36F2C] px-6 pb-6">
          <p
            className="text-sm leading-relaxed text-[#2C2A28]/70"
            style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FaqView({
  categories,
  items,
}: {
  categories: FaqCategoryView[]
  items: FaqItemView[]
}) {
  const { lang } = useLanguage()
  const [openId, setOpenId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [pageModules, setPageModules] = useState<PublicPageModule[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchPublicPageModules('faq', controller.signal)
      .then((modules) => setPageModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setPageModules(null)
      })
    return () => controller.abort()
  }, [])

  const modules = moduleMap(pageModules)
  const heroModule = modules.get('hero') ?? null
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang)
  const heroTitle = moduleTitle(heroModule, lang)
  const heroDescription = moduleDescription(heroModule, lang)
  const categoriesLabel = itemLabel(itemById(heroModule, 'categories-label'), lang)
  const answersLabel = itemLabel(itemById(heroModule, 'answers-label'), lang)
  const allLabel = itemLabel(itemById(heroModule, 'all-categories-label'), lang)
  const emptyLabel = itemLabel(itemById(heroModule, 'empty-state'), lang)
  const contactCta = itemById(heroModule, 'contact-cta')
  const secondaryCta = itemById(heroModule, 'secondary-cta')
  const formTitleItem = itemById(heroModule, 'inquiry-title')
  const formDescriptionItem = itemById(heroModule, 'inquiry-description')
  const formTitle = itemLabel(formTitleItem, lang)
  const formDescription = itemContent(formDescriptionItem, lang)

  const filteredCategories = activeCategory
    ? categories.filter((category) => category.key === activeCategory)
    : categories

  const visibleItemCount = useMemo(
    () => filteredCategories.reduce(
      (count, category) => count + items.filter((item) => item.category === category.key).length,
      0,
    ),
    [filteredCategories, items],
  )

  const toggle = (id: string) => setOpenId(openId === id ? null : id)

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#F5F2ED' }}>
      <Navbar />

      {(heroEyebrow || heroTitle || heroDescription || categoriesLabel || answersLabel) ? (
        <section className="px-4 pb-12 pt-28 sm:pb-16" style={{ backgroundColor: '#241F1B' }}>
          <div className="mx-auto max-w-5xl">
            {heroEyebrow ? (
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-[#E36F2C]">
                {heroEyebrow}
              </p>
            ) : null}
            {heroTitle ? (
              <h1
                className="mb-5 text-4xl font-bold leading-none tracking-tight text-[#F5F2ED] sm:text-6xl"
                style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
              >
                {heroTitle}
              </h1>
            ) : null}
            {heroDescription ? (
              <p className="max-w-2xl text-base leading-relaxed text-[#C9BEB4] sm:text-lg">
                {heroDescription}
              </p>
            ) : null}
            {(categoriesLabel || answersLabel) ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {categoriesLabel ? (
                  <span className="border border-white/15 px-3 py-1.5 text-xs tracking-wider text-white/55">
                    {categories.length} {categoriesLabel}
                  </span>
                ) : null}
                {answersLabel ? (
                  <span className="border border-white/15 px-3 py-1.5 text-xs tracking-wider text-white/55">
                    {items.length} {answersLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="sticky top-16 z-30 border-b border-[#E5E0DA]" style={{ backgroundColor: '#F5F2ED' }}>
        <div className="mx-auto max-w-4xl overflow-x-auto px-4">
          <div className="flex min-w-max gap-1 py-3">
            {allLabel ? (
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-sm px-3.5 py-1.5 text-xs font-medium tracking-wider whitespace-nowrap transition-all ${
                  activeCategory === null
                    ? 'bg-[#241F1B] text-[#F5F2ED]'
                    : 'text-[#8A8580] hover:bg-[#E5E0DA] hover:text-[#2C2A28]'
                }`}
              >
                {allLabel}
              </button>
            ) : null}
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(activeCategory === category.key ? null : category.key)}
                className={`rounded-sm px-3.5 py-1.5 text-xs font-medium tracking-wider whitespace-nowrap transition-all ${
                  activeCategory === category.key
                    ? 'bg-[#E36F2C] text-white'
                    : 'text-[#8A8580] hover:bg-[#E5E0DA] hover:text-[#2C2A28]'
                }`}
              >
                {lang === 'zh' ? category.zh : category.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-10">
          {filteredCategories.map((category) => {
            const categoryItems = items.filter((item) => item.category === category.key)
            if (categoryItems.length === 0) return null
            return (
              <section key={category.key}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-5 w-1 shrink-0 rounded-full bg-[#E36F2C]" />
                  <h2
                    className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2C2A28]/50"
                    style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
                  >
                    {lang === 'zh' ? category.zh : category.en}
                  </h2>
                </div>

                <div className="overflow-hidden rounded-sm border border-[#E5E0DA]">
                  {categoryItems.map((item) => (
                    <AccordionItem
                      key={item.id}
                      question={lang === 'zh' ? item.question_zh : item.question_en}
                      answer={lang === 'zh' ? item.answer_zh : item.answer_en}
                      isOpen={openId === item.id}
                      onToggle={() => toggle(item.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
          {visibleItemCount === 0 && emptyLabel ? (
            <div className="border border-dashed border-[#C4B9AB] bg-white px-6 py-10 text-center text-sm text-[#6B625B]">
              {emptyLabel}
            </div>
          ) : null}
        </div>
      </main>

      {(contactCta || secondaryCta || formTitle || formDescription) ? (
        <section style={{ backgroundColor: '#241F1B' }} className="px-4 py-16">
          <div className="mx-auto max-w-4xl">
            {(contactCta || secondaryCta) ? (
              <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
                {contactCta && itemLabel(contactCta, lang) && contactCta.href ? (
                  <Link
                    href={contactCta.href}
                    className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-8 py-3.5 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-[#C85A1F]"
                  >
                    {itemLabel(contactCta, lang)}
                  </Link>
                ) : null}
                {secondaryCta && itemLabel(secondaryCta, lang) && secondaryCta.href ? (
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex min-h-11 items-center justify-center border border-white/20 px-8 py-3.5 text-sm font-medium tracking-wider text-white/70 transition-colors hover:border-[#E36F2C] hover:text-[#E36F2C]"
                  >
                    {itemLabel(secondaryCta, lang)}
                  </Link>
                ) : null}
              </div>
            ) : null}
            {(formTitle || formDescription) ? (
              <ConversionInquiryForm
                source="faq:general:inquiry_form"
                inquiryType="FAQ Inquiry"
                model="FAQ"
                titleEn={formTitleItem?.label_en ?? ''}
                titleZh={formTitleItem?.label_zh ?? ''}
                descriptionEn={formDescriptionItem?.content_en ?? ''}
                descriptionZh={formDescriptionItem?.content_zh ?? ''}
                compact
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <Footer />
    </div>
  )
}
