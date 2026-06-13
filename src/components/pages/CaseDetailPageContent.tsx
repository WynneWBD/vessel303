'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Images, MapPin, MessageSquareText } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  itemById,
  itemLabel,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client'
import type { ProjectCaseRow } from '@/lib/project-cases-static'
import ConversionInquiryForm, { type FormLabels } from './ConversionInquiryForm'

function text(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function localizedText(zh: boolean, zhValue: string | null | undefined, enValue: string | null | undefined) {
  return text(zh ? zhValue || enValue : enValue || zhValue)
}

function localizedList(zh: boolean, zhValues: string[], enValues: string[]) {
  return zhValues.length > 0 ? (zh ? zhValues : enValues.length > 0 ? enValues : zhValues) : enValues
}

function fallbackLabel(value: string, fallback: string) {
  return value || fallback
}

function splitProducts(value: string | null | undefined) {
  return text(value)
    .split(/[·,，、/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function ProjectImage({ src, alt, className }: { src: string | null | undefined; alt: string; className: string }) {
  if (!src) return null
  return (
    <div className={`relative overflow-hidden bg-[#E5DED4] ${className}`}>
      <ProtectedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  )
}

function FactGrid({
  facts,
  className = '',
  theme = 'light',
}: {
  facts: Array<{ label: string; value: string }>
  className?: string
  theme?: 'light' | 'dark'
}) {
  if (facts.length === 0) return null

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}>
      {facts.map((fact) => (
        <p
          key={`${fact.label}-${fact.value}`}
          className={`rounded-md border px-4 py-3 text-sm leading-6 shadow-sm ${
            theme === 'dark'
              ? 'border-white/14 bg-white/10 text-white backdrop-blur'
              : 'border-[#E5DED4] bg-white text-[#2C2A28]'
          }`}
        >
          {fact.label ? (
            <span className={`mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] ${theme === 'dark' ? 'text-white/58' : 'text-[#8A8580]'}`}>
              {fact.label}
            </span>
          ) : null}
          <span className="font-bold">{fact.value}</span>
        </p>
      ))}
    </div>
  )
}

function CaseDecisionSummary({
  title,
  subtitle,
  snapshotTitle,
  proofTitle,
  actionTitle,
  snapshotFacts,
  proofFacts,
  galleryHref,
  galleryLabel,
  inquiryHref,
  inquiryLabel,
  hasGallery,
  zh,
}: {
  title: string
  subtitle: string
  snapshotTitle: string
  proofTitle: string
  actionTitle: string
  snapshotFacts: Array<{ label: string; value: string }>
  proofFacts: Array<{ label: string; value: string }>
  galleryHref: string
  galleryLabel: string
  inquiryHref: string
  inquiryLabel: string
  hasGallery: boolean
  zh: boolean
}) {
  const actionItems = [
    zh ? '先核对项目地点、类型、面积和舱体规模。' : 'Check location, project type, area, and unit scale first.',
    zh ? '再查看产品引用、投资信息和图库证据。' : 'Then review product references, investment context, and gallery evidence.',
    zh ? '最后带着项目背景进入案例咨询表单。' : 'Finally open the case inquiry with project context.',
  ]

  return (
    <section className="border-b border-[#E5DED4] bg-white py-8 lg:py-10" data-case-decision-summary="true">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(260px,0.28fr)] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1889B6]">
              {zh ? '案例决策摘要' : 'Case decision summary'}
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-[#2C2A28] sm:text-3xl">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6560]">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {hasGallery ? (
              <a
                href={galleryHref}
                className="inline-flex min-h-10 items-center gap-2 border border-[#E5DED4] bg-[#FAF7F2] px-3 text-xs font-black uppercase tracking-[0.12em] text-[#2C2A28] transition-colors hover:border-[#E36F2C]/45"
              >
                <Images size={15} strokeWidth={2.4} aria-hidden="true" />
                {galleryLabel}
              </a>
            ) : null}
            <a
              href={inquiryHref}
              data-analytics-cta="true"
              className="inline-flex min-h-10 items-center gap-2 border border-[#E36F2C] bg-[#E36F2C] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#C75D22]"
            >
              {inquiryLabel}
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="border border-[#E5DED4] bg-[#FAF7F2] p-4">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2C2A28]">
              <MapPin size={15} strokeWidth={2.4} className="text-[#1889B6]" aria-hidden="true" />
              {snapshotTitle}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {snapshotFacts.map((fact) => (
                <div key={`${fact.label}-${fact.value}`} className="border border-[#E5DED4] bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8580]">{fact.label}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#2C2A28]">{fact.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-[#E5DED4] bg-[#FAF7F2] p-4">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2C2A28]">
              <CheckCircle2 size={15} strokeWidth={2.4} className="text-[#1889B6]" aria-hidden="true" />
              {proofTitle}
            </p>
            <div className="mt-4 grid gap-2">
              {proofFacts.map((fact) => (
                <div key={`${fact.label}-${fact.value}`} className="border border-[#E5DED4] bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8580]">{fact.label}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#2C2A28]">{fact.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-[#E5DED4] bg-[#2C2A28] p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">{actionTitle}</p>
            <div className="mt-4 grid gap-3">
              {actionItems.map((item, index) => (
                <p key={item} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 text-sm leading-6 text-white/78">
                  <span className="text-lg font-black leading-6 text-[#E36F2C]">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function CaseInquiryProofBridge({
  title,
  subtitle,
  proofPoints,
  metrics,
  galleryHref,
  inquiryHref,
  relatedHref,
  galleryLabel,
  inquiryLabel,
  relatedLabel,
  hasGallery,
  hasRelated,
  zh,
}: {
  title: string
  subtitle: string
  proofPoints: string[]
  metrics: Array<{ label: string; value: string; detail: string }>
  galleryHref: string
  inquiryHref: string
  relatedHref: string
  galleryLabel: string
  inquiryLabel: string
  relatedLabel: string
  hasGallery: boolean
  hasRelated: boolean
  zh: boolean
}) {
  return (
    <section id="case-inquiry-proof-bridge" className="border-b border-[#E5DED4] bg-white py-10 lg:py-12">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.74fr)_minmax(320px,0.26fr)] lg:px-8">
        <div className="border-l-4 border-[#1889B6] bg-[#FAF7F2] px-4 py-4 sm:px-5">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1889B6]">
            <MessageSquareText size={15} strokeWidth={2.4} aria-hidden="true" />
            {zh ? '询盘前证明链' : 'Pre-inquiry proof chain'}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#2C2A28] sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6560]">{subtitle}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {proofPoints.map((point, index) => (
              <div key={point} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border border-[#D8E7E8] bg-white px-3 py-3">
                <span className="flex h-8 w-8 items-center justify-center bg-[#EAF6F8] text-xs font-black text-[#1889B6]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-bold leading-6 text-[#2C2A28]">{point}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {hasGallery ? (
              <a
                href={galleryHref}
                className="inline-flex min-h-10 items-center gap-2 border border-[#D8E7E8] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#2C2A28] transition-colors hover:border-[#1889B6] hover:text-[#1889B6]"
              >
                <Images size={15} strokeWidth={2.4} aria-hidden="true" />
                {galleryLabel}
              </a>
            ) : null}
            {hasRelated ? (
              <a
                href={relatedHref}
                className="inline-flex min-h-10 items-center gap-2 border border-[#D8E7E8] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#2C2A28] transition-colors hover:border-[#1889B6] hover:text-[#1889B6]"
              >
                {relatedLabel}
              </a>
            ) : null}
            <a
              href={inquiryHref}
              data-analytics-cta="true"
              className="inline-flex min-h-10 items-center gap-2 border border-[#E36F2C] bg-[#E36F2C] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#C75D22]"
            >
              {inquiryLabel}
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </a>
          </div>
        </div>

        <aside className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0 border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]" title={metric.label}>{metric.label}</p>
              <p className="mt-2 text-2xl font-black leading-none text-[#2C2A28]">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 text-[#6B6560]">{metric.detail}</p>
            </div>
          ))}
        </aside>
      </div>
    </section>
  )
}

export default function CaseDetailPageContent({
  project,
  relatedCases = [],
  pageModules = [],
}: {
  project: ProjectCaseRow
  relatedCases?: ProjectCaseRow[]
  pageModules?: PublicPageModule[]
}) {
  const { lang } = useLanguage()
  const zh = lang === 'zh'
  const name = localizedText(zh, project.name_zh, project.name_en)
  const location = localizedText(zh, project.location_zh, project.location_en)
  const type = localizedText(zh, project.project_type_zh, project.project_type_en)
  const description = localizedText(zh, project.description_zh, project.description_en)
  const tags = localizedList(zh, project.tags_zh, project.tags_en)
  const heroImage = project.cover_image_url || project.images[0] || null
  const gallery = [
    project.cover_image_url,
    ...project.images,
  ].filter((image, index, images): image is string => Boolean(image) && images.indexOf(image) === index)
  const modules = moduleMap(pageModules)
  const detailLabels = modules.get('detail-labels') ?? null
  const locationLabel = fallbackLabel(itemLabel(itemById(detailLabels, 'fact-location'), lang), zh ? '项目位置' : 'Location')
  const typeLabel = fallbackLabel(itemLabel(itemById(detailLabels, 'fact-type'), lang), zh ? '项目类型' : 'Project Type')
  const areaLabel = fallbackLabel(itemLabel(itemById(detailLabels, 'fact-area'), lang), zh ? '项目面积' : 'Project Area')
  const investmentLabel = fallbackLabel(itemLabel(itemById(detailLabels, 'fact-investment'), lang), zh ? '投资规模' : 'Investment')
  const unitsLabel = fallbackLabel(itemLabel(itemById(detailLabels, 'fact-units'), lang), zh ? '舱体数量' : 'Units')
  const productsLabel = fallbackLabel(itemLabel(itemById(detailLabels, 'fact-products'), lang), zh ? '产品型号' : 'Products')
  const facts = [
    { label: locationLabel, value: location },
    { label: typeLabel, value: type },
    { label: areaLabel, value: project.area_display },
    { label: investmentLabel, value: project.investment_display },
    { label: unitsLabel, value: project.units_display },
    { label: productsLabel, value: project.products },
  ].map((fact) => ({ ...fact, value: text(fact.value) })).filter((fact) => Boolean(fact.value))
  const products = splitProducts(project.products)
  const proofTitle = fallbackLabel(itemLabel(itemById(detailLabels, 'proof-title'), lang), zh ? '项目证据' : 'Project proof')
  const galleryTitle = fallbackLabel(itemLabel(itemById(detailLabels, 'gallery-title'), lang), zh ? '项目图库' : 'Project gallery')
  const relatedTitle = fallbackLabel(itemLabel(itemById(detailLabels, 'related-title'), lang), zh ? '相关案例' : 'Related cases')
  const inquiryModule = modules.get('inquiry-form') ?? null
  const inquiryTitle = moduleTitle(inquiryModule, lang)
  const inquiryType = itemLabel(itemById(inquiryModule, 'inquiry-type'), lang)
  const inquiryLabels: FormLabels = {
    eyebrow: itemLabel(itemById(inquiryModule, 'form-eyebrow'), lang),
    name: itemLabel(itemById(inquiryModule, 'form-name'), lang),
    email: itemLabel(itemById(inquiryModule, 'form-email'), lang),
    phone: itemLabel(itemById(inquiryModule, 'form-phone'), lang),
    country: itemLabel(itemById(inquiryModule, 'form-country'), lang),
    company: itemLabel(itemById(inquiryModule, 'form-company'), lang),
    quantity: itemLabel(itemById(inquiryModule, 'form-quantity'), lang),
    message: itemLabel(itemById(inquiryModule, 'form-message'), lang),
    submit: itemLabel(itemById(inquiryModule, 'form-submit'), lang),
    submitting: itemLabel(itemById(inquiryModule, 'form-submitting'), lang),
    success: itemLabel(itemById(inquiryModule, 'form-success'), lang),
    error: itemLabel(itemById(inquiryModule, 'form-error'), lang),
    sourcePrefix: itemLabel(itemById(inquiryModule, 'form-source-prefix'), lang),
    companyPrefix: itemLabel(itemById(inquiryModule, 'form-company-prefix'), lang),
  }
  const heroGallery = gallery.filter((image) => image !== heroImage).slice(0, 3)
  const storyPanelFacts = facts.length > 0
    ? facts
    : tags.map((tag) => ({ label: '', value: tag }))
  const storyPanels = gallery.slice(0, 4).map((image, index) => ({
    image,
    fact: storyPanelFacts[index % Math.max(storyPanelFacts.length, 1)] ?? null,
  }))
  const snapshotFacts = [
    { label: locationLabel, value: location },
    { label: typeLabel, value: type },
    { label: areaLabel, value: project.area_display },
    { label: unitsLabel, value: project.units_display },
  ].map((fact) => ({ ...fact, value: text(fact.value) })).filter((fact) => Boolean(fact.value))
  const proofFacts = [
    { label: productsLabel, value: project.products },
    { label: investmentLabel, value: project.investment_display },
    { label: zh ? '图库素材' : 'Gallery assets', value: gallery.length > 0 ? String(gallery.length) : '' },
  ].map((fact) => ({ ...fact, value: text(fact.value) })).filter((fact) => Boolean(fact.value))
  const inquiryProofMetrics = [
    {
      label: zh ? '图库证据' : 'Gallery proof',
      value: gallery.length > 0 ? String(gallery.length) : '0',
      detail: zh ? '封面与现场图片' : 'Cover and site images',
    },
    {
      label: zh ? '项目事实' : 'Project facts',
      value: `${facts.length}/6`,
      detail: zh ? '地点、类型、面积、规模等' : 'Location, type, area, scale, and more',
    },
    {
      label: zh ? '产品引用' : 'Product references',
      value: products.length > 0 ? String(products.length) : '0',
      detail: zh ? '关联 VESSEL 型号/系列' : 'Linked VESSEL models or series',
    },
    {
      label: zh ? '相关案例' : 'Related cases',
      value: String(relatedCases.length),
      detail: zh ? '继续横向比较项目类型' : 'Compare adjacent project types',
    },
  ]
  const inquiryProofPoints = [
    zh ? '先用图库和项目事实确认交付可信度。' : 'Use gallery and project facts to confirm delivery credibility.',
    zh ? '再用产品引用判断型号、规模和场景适配。' : 'Use product references to judge model, scale, and scenario fit.',
    zh ? '最后带着明确项目背景进入案例咨询。' : 'Enter the inquiry with a clear project context.',
  ]

  if (!name) return null

  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      <section className="relative min-h-[720px] overflow-hidden bg-[#201B17] pt-20 text-white sm:pt-24">
        {heroImage ? (
          <div className="absolute inset-0">
            <ProtectedImage
              src={heroImage}
              alt={name}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(32,27,23,0.92)_0%,rgba(32,27,23,0.62)_42%,rgba(32,27,23,0.28)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(32,27,23,0)_0%,#201B17_92%)]" />
          </div>
        ) : null}

        <div className="relative z-10 mx-auto grid min-h-[640px] max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.58fr)] lg:px-8 lg:py-14">
          <div className="flex min-w-0 flex-col justify-end">
            {tags.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/78 backdrop-blur">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-wide text-white sm:text-5xl lg:text-7xl">{name}</h1>
            {description ? <p className="mt-5 max-w-2xl text-sm leading-7 text-white/76 sm:text-base sm:leading-8">{description}</p> : null}

            {(inquiryLabels.submit || galleryTitle) ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {inquiryLabels.submit ? (
                  <a href="#case-inquiry" data-analytics-cta="true" className="inline-flex min-h-12 items-center justify-center border border-white bg-white px-5 text-sm font-bold uppercase tracking-[0.12em] text-[#201B17] transition hover:bg-[#E36F2C] hover:text-white">
                    {inquiryLabels.submit}
                  </a>
                ) : null}
                {galleryTitle && gallery.length > 1 ? (
                  <a href="#case-gallery" className="inline-flex min-h-12 items-center justify-center border border-white/36 px-5 text-sm font-bold uppercase tracking-[0.12em] text-white/82 transition hover:border-white hover:text-white">
                    {galleryTitle}
                  </a>
                ) : null}
              </div>
            ) : null}
            <div className="mt-5 grid max-w-2xl grid-cols-3 gap-2">
              {[
                { label: zh ? '图库' : 'Gallery', value: gallery.length },
                { label: zh ? '事实' : 'Facts', value: facts.length },
                { label: zh ? '产品' : 'Products', value: products.length },
              ].map((item) => (
                <div key={item.label} className="border border-white/16 bg-white/10 px-3 py-2 backdrop-blur">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-white/58">{item.label}</p>
                  <p className="mt-1 text-xl font-black leading-none text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="flex min-w-0 flex-col justify-end gap-3">
            {facts.length > 0 ? (
              <FactGrid facts={facts} theme="dark" className="rounded-md border border-white/14 bg-black/24 p-3 shadow-2xl shadow-black/25 backdrop-blur" />
            ) : null}
            {heroGallery.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {heroGallery.map((image, index) => (
                  <ProjectImage
                    key={image}
                    src={image}
                    alt={`${name} ${index + 2}`}
                    className="aspect-[4/3] w-full border border-white/16 bg-white/8"
                  />
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {(snapshotFacts.length > 0 || proofFacts.length > 0) ? (
        <CaseDecisionSummary
          title={zh ? '先完成项目适配判断，再进入图库和咨询。' : 'Validate project fit before opening gallery and inquiry.'}
          subtitle={zh
            ? '案例详情页先把地点、类型、规模、产品引用和询盘路径集中展示，减少用户在长页面里反复查找。'
            : 'The case detail page surfaces location, type, scale, product references, and inquiry path before the longer story sections.'}
          snapshotTitle={zh ? '项目快照' : 'Project snapshot'}
          proofTitle={zh ? '交付证据' : 'Delivery proof'}
          actionTitle={zh ? '阅读路径' : 'Reading path'}
          snapshotFacts={snapshotFacts}
          proofFacts={proofFacts}
          galleryHref="#case-gallery"
          galleryLabel={galleryTitle}
          inquiryHref="#case-inquiry"
          inquiryLabel={inquiryLabels.submit || (zh ? '提交案例咨询' : 'Submit Case Inquiry')}
          hasGallery={gallery.length > 1}
          zh={zh}
        />
      ) : null}

      {gallery.length > 1 ? (
        <section id="case-gallery" className="border-b border-[#E5DED4] bg-[#201B17] py-12 text-white lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {galleryTitle ? <h2 className="mb-6 text-2xl font-black tracking-wide text-white">{galleryTitle}</h2> : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:grid-rows-2">
              {gallery.slice(0, 5).map((image, index) => (
                <ProjectImage
                  key={image}
                  src={image}
                  alt={`${name} ${index + 1}`}
                  className={`${index === 0 ? 'md:col-span-2 md:row-span-2' : ''} aspect-[4/3] w-full border border-white/12 bg-white/8`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {storyPanels.length >= 3 ? (
        <section className="border-b border-[#E5DED4] bg-[#FAF7F2] py-12 lg:py-16" data-case-story-rhythm="true">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {storyPanels.map((panel, index) => (
                <article
                  key={`${panel.image}-${index}`}
                  className={`group border border-[#E5DED4] bg-white ${index === 0 ? 'lg:col-span-2' : ''}`}
                  data-case-story-panel={index + 1}
                >
                  <ProjectImage
                    src={panel.image}
                    alt={`${name} ${index + 1}`}
                    className={`${index === 0 ? 'aspect-[16/10]' : 'aspect-[4/3]'} w-full border-b border-[#E5DED4]`}
                  />
                  {panel.fact ? (
                    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 p-4">
                      <p className="text-xl font-black leading-none text-[#E36F2C]/70">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                      <div className="min-w-0">
                        {panel.fact.label ? (
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8580]">
                            {panel.fact.label}
                          </p>
                        ) : null}
                        <p className="text-sm font-bold leading-6 text-[#2C2A28]">{panel.fact.value}</p>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {facts.length > 0 && proofTitle ? (
        <section className="border-b border-[#E5DED4] bg-white py-12 lg:py-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(240px,0.35fr)_minmax(0,1fr)] lg:px-8">
            <div>
              <h2 className="text-2xl font-black tracking-wide text-[#2C2A28] sm:text-3xl">{proofTitle}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {facts.map((fact, index) => (
                <article key={`${fact.label}-${fact.value}`} className="grid grid-cols-[52px_minmax(0,1fr)] gap-4 border border-[#E5DED4] bg-[#FAF7F2] p-4">
                  <p className="text-3xl font-black leading-none text-[#E36F2C]/70">{String(index + 1).padStart(2, '0')}</p>
                  <div className="min-w-0">
                    {fact.label ? <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8580]">{fact.label}</p> : null}
                    <p className="text-base font-black leading-7 text-[#2C2A28]">{fact.value}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {inquiryTitle ? (
        <CaseInquiryProofBridge
          title={zh ? '提交前再次核对项目证据、产品引用和相似案例。' : 'Review proof, product references, and adjacent cases before inquiry.'}
          subtitle={zh
            ? '这一段把详情页已有证据收束到询盘前，帮助采购方带着明确项目背景进入表单。'
            : 'This bridge condenses existing case proof before the form so buyers enter with a clear project context.'}
          proofPoints={inquiryProofPoints}
          metrics={inquiryProofMetrics}
          galleryHref="#case-gallery"
          inquiryHref="#case-inquiry"
          relatedHref="#case-related"
          galleryLabel={galleryTitle}
          inquiryLabel={inquiryLabels.submit || (zh ? '提交案例咨询' : 'Submit Case Inquiry')}
          relatedLabel={relatedTitle}
          hasGallery={gallery.length > 1}
          hasRelated={relatedCases.length > 0}
          zh={zh}
        />
      ) : null}

      {inquiryTitle ? (
        <section id="case-inquiry" className="border-t border-[#E5DED4] bg-[#F5F2ED] py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <ConversionInquiryForm
              source={`case_detail:${project.id}:inquiry_form`}
              inquiryType={inquiryType}
              model={project.products || name}
              titleEn={inquiryModule?.title_en ?? ''}
              titleZh={inquiryModule?.title_zh ?? ''}
              descriptionEn={inquiryModule?.description_en ?? ''}
              descriptionZh={inquiryModule?.description_zh ?? ''}
              labels={inquiryLabels}
            />
          </div>
        </section>
      ) : null}

      {relatedCases.length > 0 ? (
        <section id="case-related" className="border-t border-[#E5DED4] bg-[#F5F2ED] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {relatedTitle ? <h2 className="mb-6 text-2xl font-black tracking-wide text-[#2C2A28]">{relatedTitle}</h2> : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {relatedCases.map((item) => {
                const relatedName = zh ? item.name_zh || item.name_en : item.name_en || item.name_zh
                const relatedType = zh ? item.project_type_zh || item.project_type_en : item.project_type_en || item.project_type_zh
                const relatedLocation = zh ? item.location_zh || item.location_en : item.location_en || item.location_zh
                const relatedImage = item.cover_image_url || item.images[0] || null
                if (!relatedName) return null

                return (
                  <Link prefetch={false}
                    key={item.id}
                    href={`/cases/${item.id}`}
                    className="group border border-[#E5DED4] bg-white transition-colors hover:border-[#E36F2C]/35"
                  >
                    <ProjectImage src={relatedImage} alt={relatedName} className="aspect-[4/3] w-full border-b border-[#E5DED4]" />
                    <div className="p-5">
                      {relatedLocation ? <div className="mb-2 text-[10px] tracking-wider text-[#8A8580]">{relatedLocation}</div> : null}
                      <h2 className="text-base font-black leading-6 tracking-wide text-[#2C2A28]">{relatedName}</h2>
                      {relatedType ? <div className="mt-2 text-xs leading-5 tracking-wider text-[#6B6560]">{relatedType}</div> : null}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Footer />
    </main>
  )
}
