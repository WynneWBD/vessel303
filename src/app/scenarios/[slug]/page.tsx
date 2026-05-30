import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import ConversionInquiryForm from '@/components/pages/ConversionInquiryForm'
import ProtectedImage from '@/components/ProtectedImage'
import {
  getPublicB9ContentItem,
  listPublicB9ContentItems,
  type B9ContentItem,
} from '@/lib/b9-content-db'
import { listPublishedPageModules, type PageModuleItem, type PageModuleRow } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

const SCENARIO_SLUGS = ['tourism', 'commercial', 'public'] as const
type ScenarioSlug = (typeof SCENARIO_SLUGS)[number]

type LabelValue = { label: string; value: string }
type TitleBody = { title: string; body: string; step?: string }
type RelatedCase = { name: string; location?: string; body?: string; href?: string }
type ProductLink = { label: string; href?: string }

function isScenarioSlug(value: string): value is ScenarioSlug {
  return SCENARIO_SLUGS.includes(value as ScenarioSlug)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
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

function payloadText(row: B9ContentItem, key: string) {
  return asString(row.payload?.[key])
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

function itemText(item: PageModuleItem | null, field: 'label' | 'content', lang: 'zh' | 'en') {
  if (!item) return ''
  if (field === 'content') return lang === 'zh' ? item.content_zh || item.content_en || '' : item.content_en || item.content_zh || ''
  return lang === 'zh' ? item.label_zh || item.label_en || '' : item.label_en || item.label_zh || ''
}

async function loadScenario(slug: ScenarioSlug) {
  return getPublicB9ContentItem('scenario', slug).catch((err) => {
    console.error(`[scenarios/${slug}] CMS load failed`, err)
    return null
  })
}

export function generateStaticParams() {
  return SCENARIO_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isScenarioSlug(slug)) return {}
  const scenario = await loadScenario(slug)
  if (!scenario) return {}
  const title = scenario.title_en || scenario.title_zh
  const description = scenario.summary_en || scenario.summary_zh || scenario.body_en || scenario.body_zh || ''
  if (!title || !description) return {}
  return buildPageMetadata({
    title,
    description,
    path: `/scenarios/${scenario.slug}`,
    image: scenario.cover_image_url,
  })
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isScenarioSlug(slug)) notFound()

  const [scenario, scenarios, pageModules] = await Promise.all([
    loadScenario(slug),
    listPublicB9ContentItems('scenario').catch((err) => {
      console.error('[scenarios] related CMS load failed', err)
      return []
    }),
    listPublishedPageModules('scenarios').catch((err) => {
      console.error('[scenarios] page modules load failed', err)
      return []
    }),
  ])
  if (!scenario) notFound()

  const payload = scenario.payload ?? {}
  const label = payloadText(scenario, 'label') || scenario.title_zh || scenario.title_en
  const title = scenario.title_zh || scenario.title_en
  const titleGold = payloadText(scenario, 'titleGold')
  const subtitle = payloadText(scenario, 'heroTagline') || scenario.summary_zh || scenario.summary_en || ''
  const intro = scenario.body_zh || scenario.body_en || scenario.summary_zh || scenario.summary_en || ''
  const accentColor = payloadText(scenario, 'accentColor') || '#E36F2C'
  const specs = asLabelValues(payload.specs)
  const features = asTitleBodies(payload.features)
  const process = asTitleBodies(payload.process)
  const products = asProductLinks(payload.recommendedProducts)
  const cases = asRelatedCases(payload.cases)
  const sections = [
    { key: 'features', label: payloadText(scenario, 'featuresLabel'), title: payloadText(scenario, 'featuresTitle'), rows: features },
    { key: 'process', label: payloadText(scenario, 'processLabel'), title: payloadText(scenario, 'processTitle'), rows: process },
  ].filter((section) => section.rows.length > 0)
  const relatedScenarios = scenarios.filter((item) => item.slug !== scenario.slug)
  const inquiryTitleZh = payloadText(scenario, 'inquiryTitleZh')
  const inquiryTitleEn = payloadText(scenario, 'inquiryTitleEn')
  const inquiryDescriptionZh = payloadText(scenario, 'inquiryDescriptionZh')
  const inquiryDescriptionEn = payloadText(scenario, 'inquiryDescriptionEn')
  const contactLabel = scenario.cta_label_zh || scenario.cta_label_en || ''
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

      <PageHero
        label={label}
        title={title}
        titleGold={titleGold}
        subtitle={subtitle}
      />

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
                  {item.title_zh || item.title_en}
                </h2>
                {(item.summary_zh || item.summary_en) ? (
                  <p className="mt-2 text-xs leading-relaxed text-[#8A7D74]">{item.summary_zh || item.summary_en}</p>
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
