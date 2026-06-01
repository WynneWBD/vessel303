'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ConversionInquiryForm from '@/components/pages/ConversionInquiryForm'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import type { B9ContentItem } from '@/lib/b9-content-db'
import type { PageModuleItem, PageModuleRow } from '@/lib/page-modules-db'

type LabelValue = { label: string; value: string }
type TitleBody = { title: string; body: string; step?: string }
type RelatedCase = { name: string; location?: string; body?: string; href?: string }
type ProductLink = { label: string; href?: string }
type PublicLang = 'zh' | 'en'

type Props = {
  scenario: B9ContentItem
  scenarios: B9ContentItem[]
  pageModules: PageModuleRow[]
}

const CJK_RE = /[\u3400-\u9FFF]/

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function stripEnglishFallback(value: string): string {
  return CJK_RE.test(value) ? '' : value
}

function localizedText(en: string | null | undefined, zh: string | null | undefined, lang: PublicLang) {
  if (lang === 'en') return stripEnglishFallback((en ?? '').trim())
  return (zh ?? '').trim() || (en ?? '').trim()
}

function payloadValue(row: B9ContentItem, key: string, lang: PublicLang): unknown {
  const payload = row.payload ?? {}
  const localized = payload[`${key}${lang === 'en' ? 'En' : 'Zh'}`]
  if (localized !== undefined) return localized
  const fallback = payload[key]
  if (lang === 'en' && fallback !== undefined && CJK_RE.test(JSON.stringify(fallback))) return undefined
  return fallback
}

function payloadText(row: B9ContentItem, key: string, lang: PublicLang) {
  const value = asString(payloadValue(row, key, lang))
  return lang === 'en' ? stripEnglishFallback(value) : value
}

function payloadArray(row: B9ContentItem, key: string, lang: PublicLang) {
  const value = payloadValue(row, key, lang)
  return Array.isArray(value) ? value : []
}

function asLabelValues(value: unknown): LabelValue[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const label = asString(record.label)
      const itemValue = asString(record.value)
      return label && itemValue ? { label, value: itemValue } : null
    })
    .filter((item): item is LabelValue => Boolean(item))
}

function asTitleBodies(value: unknown): TitleBody[] {
  if (!Array.isArray(value)) return []
  const rows: TitleBody[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const title = asString(record.title)
    const body = asString(record.body) || asString(record.desc)
    const step = asString(record.step)
    if (title || body) rows.push({ title, body, ...(step ? { step } : {}) })
  }
  return rows
}

function asProductLinks(value: unknown): ProductLink[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const label = item.trim()
        return label ? { label } : null
      }
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const label = asString(record.label) || asString(record.name)
      const href = asString(record.href)
      return label ? { label, href: href || undefined } : null
    })
    .filter((item): item is ProductLink => Boolean(item))
}

function asRelatedCases(value: unknown): RelatedCase[] {
  if (!Array.isArray(value)) return []
  const rows: RelatedCase[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const name = asString(record.name)
    const location = asString(record.location)
    const body = asString(record.body) || asString(record.desc)
    const href = asString(record.href)
    if (name) rows.push({ name, ...(location ? { location } : {}), ...(body ? { body } : {}), ...(href ? { href } : {}) })
  }
  return rows
}

function moduleByKey(modules: PageModuleRow[], key: string) {
  return modules.find((module) => module.module_key === key && module.is_visible !== false) ?? null
}

function visibleModuleItems(module: PageModuleRow | null) {
  if (!module) return []
  return [...(module.items ?? [])]
    .filter((item) => item.is_visible !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
}

function moduleItemById(module: PageModuleRow | null, id: string) {
  return visibleModuleItems(module).find((item) => item.id === id) ?? null
}

function itemText(item: PageModuleItem | null, field: 'label' | 'content', lang: PublicLang) {
  if (!item) return ''
  if (field === 'content') return localizedText(item.content_en, item.content_zh, lang)
  return localizedText(item.label_en, item.label_zh, lang)
}

function ScenarioHero({
  label,
  title,
  titleGold,
  subtitle,
}: {
  label?: string
  title: string
  titleGold?: string
  subtitle?: string
}) {
  return (
    <>
      <section className="relative overflow-hidden bg-[#241F1B] pb-20 pt-32">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(227,111,44,0.08) 0%, transparent 70%)' }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#241F1B] to-transparent" />
        <div className="absolute left-6 top-24 h-10 w-10 border-l border-t border-[#E36F2C]/25" />
        <div className="absolute right-6 top-24 h-10 w-10 border-r border-t border-[#E36F2C]/25" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {label ? <div className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-[#E36F2C]">{label}</div> : null}
          <h1 className="mb-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            <span className="text-white">{title}</span>
            {titleGold ? (
              <>
                <br />
                <span className="text-gold-gradient">{titleGold}</span>
              </>
            ) : null}
          </h1>
          {subtitle ? <p className="max-w-2xl text-sm leading-relaxed tracking-wide text-white/45 sm:text-base">{subtitle}</p> : null}
          <div className="mt-8 h-0.5 w-16 bg-gradient-to-r from-[#E36F2C] to-transparent" />
        </div>
      </section>
      <div className="h-20 bg-gradient-to-b from-[#241F1B] to-[#FAF7F2]" />
    </>
  )
}

export default function ScenarioPageContent({ scenario, scenarios, pageModules }: Props) {
  const { lang } = useLanguage()

  const label = payloadText(scenario, 'label', lang) || localizedText(scenario.title_en, scenario.title_zh, lang)
  const title = localizedText(scenario.title_en, scenario.title_zh, lang)
  const titleGold = payloadText(scenario, 'titleGold', lang)
  const subtitle = payloadText(scenario, 'heroTagline', lang) || localizedText(scenario.summary_en, scenario.summary_zh, lang)
  const intro = localizedText(scenario.body_en, scenario.body_zh, lang) || localizedText(scenario.summary_en, scenario.summary_zh, lang)
  const accentColor = asString(scenario.payload?.accentColor) || '#E36F2C'
  const specs = asLabelValues(payloadArray(scenario, 'specs', lang))
  const features = asTitleBodies(payloadArray(scenario, 'features', lang))
  const process = asTitleBodies(payloadArray(scenario, 'process', lang))
  const products = asProductLinks(payloadArray(scenario, 'recommendedProducts', lang))
  const cases = asRelatedCases(payloadArray(scenario, 'cases', lang))
  const sections = [
    { key: 'features', label: payloadText(scenario, 'featuresLabel', lang), title: payloadText(scenario, 'featuresTitle', lang), rows: features },
    { key: 'process', label: payloadText(scenario, 'processLabel', lang), title: payloadText(scenario, 'processTitle', lang), rows: process },
  ].filter((section) => section.rows.length > 0)
  const relatedScenarios = scenarios
    .filter((item) => item.slug !== scenario.slug)
    .map((item) => ({
      ...item,
      displayTitle: localizedText(item.title_en, item.title_zh, lang),
      displaySummary: localizedText(item.summary_en, item.summary_zh, lang),
    }))
    .filter((item) => item.displayTitle)
  const inquiryTitleZh = payloadText(scenario, 'inquiryTitle', 'zh') || payloadText(scenario, 'inquiryTitleZh', 'zh')
  const inquiryTitleEn = payloadText(scenario, 'inquiryTitle', 'en') || payloadText(scenario, 'inquiryTitleEn', 'en')
  const inquiryDescriptionZh = payloadText(scenario, 'inquiryDescription', 'zh') || payloadText(scenario, 'inquiryDescriptionZh', 'zh')
  const inquiryDescriptionEn = payloadText(scenario, 'inquiryDescription', 'en') || payloadText(scenario, 'inquiryDescriptionEn', 'en')
  const contactLabel = localizedText(scenario.cta_label_en, scenario.cta_label_zh, lang)
  const inquiryModule = moduleByKey(pageModules, 'inquiry-form')
  const formTitleZh = inquiryTitleZh || inquiryModule?.title_zh || ''
  const formTitleEn = inquiryTitleEn || inquiryModule?.title_en || ''
  const formDescriptionZh = inquiryDescriptionZh || inquiryModule?.description_zh || ''
  const formDescriptionEn = inquiryDescriptionEn || inquiryModule?.description_en || ''
  const inquiryLabelsZh = {
    eyebrow: itemText(moduleItemById(inquiryModule, 'form-eyebrow'), 'label', 'zh'),
    name: itemText(moduleItemById(inquiryModule, 'form-name'), 'label', 'zh'),
    email: itemText(moduleItemById(inquiryModule, 'form-email'), 'label', 'zh'),
    phone: itemText(moduleItemById(inquiryModule, 'form-phone'), 'label', 'zh'),
    country: itemText(moduleItemById(inquiryModule, 'form-country'), 'label', 'zh'),
    company: itemText(moduleItemById(inquiryModule, 'form-company'), 'label', 'zh'),
    quantity: itemText(moduleItemById(inquiryModule, 'form-quantity'), 'label', 'zh'),
    message: itemText(moduleItemById(inquiryModule, 'form-message'), 'label', 'zh'),
    submit: itemText(moduleItemById(inquiryModule, 'form-submit'), 'label', 'zh'),
    submitting: itemText(moduleItemById(inquiryModule, 'form-submitting'), 'label', 'zh'),
    success: itemText(moduleItemById(inquiryModule, 'form-success'), 'label', 'zh'),
    error: itemText(moduleItemById(inquiryModule, 'form-error'), 'label', 'zh'),
    sourcePrefix: itemText(moduleItemById(inquiryModule, 'form-source-prefix'), 'label', 'zh'),
    companyPrefix: itemText(moduleItemById(inquiryModule, 'form-company-prefix'), 'label', 'zh'),
  }
  const inquiryLabelsEn = {
    eyebrow: itemText(moduleItemById(inquiryModule, 'form-eyebrow'), 'label', 'en'),
    name: itemText(moduleItemById(inquiryModule, 'form-name'), 'label', 'en'),
    email: itemText(moduleItemById(inquiryModule, 'form-email'), 'label', 'en'),
    phone: itemText(moduleItemById(inquiryModule, 'form-phone'), 'label', 'en'),
    country: itemText(moduleItemById(inquiryModule, 'form-country'), 'label', 'en'),
    company: itemText(moduleItemById(inquiryModule, 'form-company'), 'label', 'en'),
    quantity: itemText(moduleItemById(inquiryModule, 'form-quantity'), 'label', 'en'),
    message: itemText(moduleItemById(inquiryModule, 'form-message'), 'label', 'en'),
    submit: itemText(moduleItemById(inquiryModule, 'form-submit'), 'label', 'en'),
    submitting: itemText(moduleItemById(inquiryModule, 'form-submitting'), 'label', 'en'),
    success: itemText(moduleItemById(inquiryModule, 'form-success'), 'label', 'en'),
    error: itemText(moduleItemById(inquiryModule, 'form-error'), 'label', 'en'),
    sourcePrefix: itemText(moduleItemById(inquiryModule, 'form-source-prefix'), 'label', 'en'),
    companyPrefix: itemText(moduleItemById(inquiryModule, 'form-company-prefix'), 'label', 'en'),
  }

  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      {title ? <ScenarioHero label={label} title={title} titleGold={titleGold} subtitle={subtitle} /> : null}

      {(intro || specs.length > 0 || scenario.cover_image_url) ? (
        <section className="border-b border-[#E5DED4] py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
            <div>
              {intro ? <p className="mb-8 text-base leading-loose text-[#6B625B]">{intro}</p> : null}
              {specs.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {specs.map((spec) => (
                    <div key={spec.label} className="border border-[#E5DED4] bg-white p-3">
                      <div className="mb-0.5 text-[10px] tracking-wider text-[#8A7D74]">{spec.label}</div>
                      <div className="text-sm font-bold tracking-wider" style={{ color: accentColor }}>
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {scenario.cover_image_url ? (
              <div className="relative aspect-[4/3] overflow-hidden bg-[#E5DED4]">
                <ProtectedImage
                  src={scenario.cover_image_url}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {sections.map((section) => (
        <section key={section.key} className="border-b border-[#E5DED4] bg-[#F5F2ED] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {(section.label || section.title) ? (
              <div className="mb-10 text-center">
                {section.label ? (
                  <div className="mb-3 text-xs font-medium uppercase tracking-[0.3em]" style={{ color: accentColor }}>
                    {section.label}
                  </div>
                ) : null}
                {section.title ? <h2 className="text-3xl font-black text-[#2C2A28]">{section.title}</h2> : null}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.rows.map((item, index) => (
                <div key={`${section.key}-${item.title}-${index}`} className="border border-[#E5DED4] bg-white p-6">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center text-sm font-black"
                    style={{ background: `${accentColor}15`, color: accentColor }}
                  >
                    {item.step || String(index + 1).padStart(2, '0')}
                  </div>
                  {item.title ? <h3 className="mb-2 font-bold tracking-wider text-[#2C2A28]">{item.title}</h3> : null}
                  {item.body ? <p className="text-sm leading-relaxed text-[#6B625B]">{item.body}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {products.length > 0 ? (
        <section className="border-b border-[#E5DED4] bg-[#F5F2ED] py-14">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
            {products.map((product) => product.href ? (
              <Link
                key={product.label}
                href={product.href}
                className="inline-flex min-h-11 items-center justify-center border border-[#E5DED4] px-6 py-3 text-sm tracking-wider text-[#6B625B] transition-all hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
              >
                {product.label}
              </Link>
            ) : (
              <span
                key={product.label}
                className="inline-flex min-h-11 items-center justify-center border border-[#E5DED4] px-6 py-3 text-sm tracking-wider text-[#6B625B]"
              >
                {product.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {cases.length > 0 ? (
        <section className="border-b border-[#E5DED4] py-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {cases.map((item) => (
              <article key={item.name} className="border border-[#E5DED4] bg-white p-5">
                {item.href ? (
                  <Link href={item.href} className="font-bold tracking-wider text-[#2C2A28] hover:text-[#E36F2C]">
                    {item.name}
                  </Link>
                ) : (
                  <h2 className="font-bold tracking-wider text-[#2C2A28]">{item.name}</h2>
                )}
                {item.location ? <p className="mt-1 text-xs tracking-wider text-[#8A7D74]">{item.location}</p> : null}
                {item.body ? <p className="mt-3 text-xs leading-relaxed text-[#6B625B]">{item.body}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {relatedScenarios.length > 0 ? (
        <section className="py-14">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            {relatedScenarios.map((item) => (
              <Link
                key={item.slug}
                href={`/scenarios/${item.slug}`}
                className="group border border-[#E5DED4] bg-white p-6 transition-all hover:border-[#E36F2C]/30"
              >
                <h2 className="font-bold tracking-wider text-[#2C2A28] transition-colors group-hover:text-[#E36F2C]">
                  {item.displayTitle}
                </h2>
                {item.displaySummary ? (
                  <p className="mt-2 text-xs leading-relaxed text-[#8A7D74]">{item.displaySummary}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {(formTitleZh && formTitleEn) ? (
        <section className="border-t border-[#E5DED4] bg-[#F5F2ED] py-14">
          <div className="mx-auto max-w-3xl px-4">
            <ConversionInquiryForm
              source={`scenario:${scenario.slug}:inquiry_form`}
              inquiryType="Scenario Inquiry"
              model={title}
              titleEn={formTitleEn}
              titleZh={formTitleZh}
              descriptionEn={formDescriptionEn}
              descriptionZh={formDescriptionZh}
              labelsZh={inquiryLabelsZh}
              labelsEn={inquiryLabelsEn}
            />
          </div>
        </section>
      ) : null}

      {(contactLabel && scenario.cta_href) ? (
        <section className="border-t border-[#E5DED4] bg-[#F5F2ED] px-4 py-10 text-center">
          <Link
            href={scenario.cta_href}
            className="inline-flex min-h-11 items-center justify-center px-8 py-3 text-sm font-bold tracking-wider text-white transition-colors"
            style={{ background: accentColor }}
          >
            {contactLabel}
          </Link>
        </section>
      ) : null}

      <Footer />
    </main>
  )
}
