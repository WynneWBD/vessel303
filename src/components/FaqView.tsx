'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ConversionInquiryForm from '@/components/pages/ConversionInquiryForm'
import { useLanguage } from '@/contexts/LanguageContext'
import { buildContactHref } from '@/lib/site-links'

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

  const toggle = (id: string) => setOpenId(openId === id ? null : id)

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.key === activeCategory)
    : categories
  const visibleItemCount = filteredCategories.reduce(
    (count, cat) => count + items.filter((item) => item.category === cat.key).length,
    0,
  )
  const supportCards = [
    {
      label: lang === 'zh' ? '采购前' : 'Before Purchase',
      title: lang === 'zh' ? '确认场景和产品适配' : 'Match scenario and product',
      body: lang === 'zh'
        ? '先看安装、运输、交付和认证，再进入产品详情或提交咨询。'
        : 'Review installation, transport, delivery, and certification before moving into product detail or inquiry.',
    },
    {
      label: lang === 'zh' ? '项目中' : 'During Project',
      title: lang === 'zh' ? '明确交付边界' : 'Clarify delivery scope',
      body: lang === 'zh'
        ? 'FAQ 用来解释常见商务和技术问题，具体配置仍回到产品后台资料。'
        : 'FAQ explains common commercial and technical questions while detailed configuration stays with product records.',
    },
    {
      label: lang === 'zh' ? '下一步' : 'Next Step',
      title: lang === 'zh' ? '带着问题提交线索' : 'Submit with project context',
      body: lang === 'zh'
        ? '没有答案的问题可直接提交表单，后台会按 FAQ 来源进入线索。'
        : 'Unanswered questions can be submitted directly and enter the leads console with FAQ source context.',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#F5F2ED' }}>
      <Navbar />

      <section className="px-4 pb-12 pt-28 sm:pb-16" style={{ backgroundColor: '#241F1B' }}>
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-[#E36F2C]">
              {lang === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
            </p>
            <h1
              className="mb-5 text-4xl font-bold leading-none tracking-tight text-[#F5F2ED] sm:text-6xl"
              style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
            >
              FAQ
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#C9BEB4] sm:text-lg">
              {lang === 'zh'
                ? '关于 VESSEL 产品、运输、安装、认证及商务条款的专业解答。'
                : 'Expert answers on VESSEL products, transport, installation, certifications, and commercial terms.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="border border-white/15 px-3 py-1.5 text-xs tracking-wider text-white/55">
                {lang === 'zh' ? `${categories.length} 个分类` : `${categories.length} categories`}
              </span>
              <span className="border border-white/15 px-3 py-1.5 text-xs tracking-wider text-white/55">
                {lang === 'zh' ? `${items.length} 条问答` : `${items.length} answers`}
              </span>
              <span className="border border-[#E36F2C]/40 px-3 py-1.5 text-xs tracking-wider text-[#E36F2C]">
                {lang === 'zh' ? '可提交线索' : 'Lead tracking ready'}
              </span>
            </div>
          </div>
          <div className="border border-white/10 bg-white/[0.06] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E36F2C]">
              {lang === 'zh' ? '使用路径' : 'Buyer Path'}
            </p>
            <div className="mt-4 space-y-3">
              {[
                lang === 'zh' ? '先按分类查看运输、安装、认证和商务问题。' : 'Browse transport, installation, certification, and commercial answers by category.',
                lang === 'zh' ? '仍不清楚时，直接提交 FAQ 来源的项目问题。' : 'If the answer is missing, submit a FAQ-sourced project question.',
                lang === 'zh' ? '后台线索 2.0 能识别 FAQ 来源并跟进。' : 'The leads console can identify and follow up FAQ-sourced inquiries.',
              ].map((item, index) => (
                <div key={item} className="flex gap-3 border border-white/10 bg-[#241F1B]/45 p-3 text-sm leading-6 text-white/70">
                  <span className="text-[#E36F2C]">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#E5E0DA] bg-white px-4 py-8">
        <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-3">
          {supportCards.map((card) => (
            <div key={card.label} className="rounded-md border border-[#E5E0DA] bg-[#F5F2ED] p-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E36F2C]">
                {card.label}
              </p>
              <h2 className="text-base font-semibold text-[#2C2A28]">{card.title}</h2>
              <p className="mt-2 text-xs leading-5 text-[#6B625B]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b border-[#E5E0DA]" style={{ backgroundColor: '#F5F2ED' }}>
        <div className="mx-auto max-w-4xl overflow-x-auto px-4">
          <div className="flex min-w-max gap-1 py-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-sm px-3.5 py-1.5 text-xs font-medium tracking-wider whitespace-nowrap transition-all ${
                activeCategory === null
                  ? 'bg-[#241F1B] text-[#F5F2ED]'
                  : 'text-[#8A8580] hover:bg-[#E5E0DA] hover:text-[#2C2A28]'
              }`}
            >
              {lang === 'zh' ? '全部' : 'All'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                className={`rounded-sm px-3.5 py-1.5 text-xs font-medium tracking-wider whitespace-nowrap transition-all ${
                  activeCategory === cat.key
                    ? 'bg-[#E36F2C] text-white'
                    : 'text-[#8A8580] hover:bg-[#E5E0DA] hover:text-[#2C2A28]'
                }`}
              >
                {lang === 'zh' ? cat.zh : cat.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="border-b border-[#E5E0DA] bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 text-xs text-[#6B625B] sm:flex-row sm:items-center sm:justify-between">
          <div className="font-semibold tracking-[0.16em] text-[#2C2A28]">
            {lang === 'zh' ? `当前显示 ${visibleItemCount} 条答案` : `Showing ${visibleItemCount} answers`}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="border border-[#E5E0DA] px-3 py-1.5">
              {lang === 'zh' ? '后台 owner: FAQ CMS' : 'Owner: FAQ CMS'}
            </span>
            <span className="border border-[#E36F2C]/25 px-3 py-1.5 text-[#C65F22]">
              {lang === 'zh' ? '未解答问题可直接进入线索' : 'Unanswered questions can become leads'}
            </span>
          </div>
        </div>
      </section>

      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-10">
          {filteredCategories.map((cat) => {
            const categoryItems = items.filter((item) => item.category === cat.key)
            if (categoryItems.length === 0) return null
            return (
              <section key={cat.key}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-5 w-1 shrink-0 rounded-full bg-[#E36F2C]" />
                  <h2
                    className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2C2A28]/50"
                    style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
                  >
                    {lang === 'zh' ? cat.zh : cat.en}
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
          {visibleItemCount === 0 ? (
            <div className="border border-dashed border-[#C4B9AB] bg-white px-6 py-10 text-center text-sm text-[#6B625B]">
              {lang === 'zh' ? '当前分类暂无已发布问题。' : 'No published questions are available in this category.'}
            </div>
          ) : null}
        </div>
      </main>

      <section style={{ backgroundColor: '#241F1B' }} className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[#E36F2C]">
            {lang === 'zh' ? '还有问题？' : 'Still have questions?'}
          </p>
          <h2
            className="mb-4 text-3xl font-bold text-[#F5F2ED] sm:text-4xl"
            style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
          >
            {lang === 'zh' ? '我们的团队随时为您解答' : 'Our team is ready to help'}
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-[#C9BEB4]">
            {lang === 'zh'
              ? '提交您的项目需求，专业顾问将在 24 小时内与您联系。'
              : 'Submit your project requirements and a specialist will contact you within 24 hours.'}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={buildContactHref('faq:general:contact_cta')}
              className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-8 py-3.5 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-[#C85A1F]"
            >
              {lang === 'zh' ? '联系我们' : 'Contact VESSEL'}
            </Link>
            <Link
              href="/global"
              className="inline-flex min-h-11 items-center justify-center border border-white/20 px-8 py-3.5 text-sm font-medium tracking-wider text-white/70 transition-colors hover:border-[#E36F2C] hover:text-[#E36F2C]"
            >
              {lang === 'zh' ? '查看全球项目' : 'View Global Projects'}
            </Link>
          </div>
          <div className="mt-8 text-left">
            <ConversionInquiryForm
              source="faq:general:inquiry_form"
              inquiryType="FAQ Inquiry"
              model="FAQ"
              titleEn="Send your question"
              titleZh="提交常见问题咨询"
              descriptionEn="Questions submitted here enter the new leads console with FAQ source tracking."
              descriptionZh="这里提交的问题会进入新线索后台，并标记为 FAQ 来源。"
              compact
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
