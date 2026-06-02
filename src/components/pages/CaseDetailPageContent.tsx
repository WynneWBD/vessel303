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
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client'
import type { ProjectCaseRow } from '@/lib/project-cases-static'
import ConversionInquiryForm, { type FormLabels } from './ConversionInquiryForm'

function text(value: string | null | undefined) {
  return value?.trim() ?? ''
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
  const name = zh ? project.name_zh || project.name_en : project.name_en || project.name_zh
  const location = zh ? project.location_zh || project.location_en : project.location_en || project.location_zh
  const type = zh ? project.project_type_zh || project.project_type_en : project.project_type_en || project.project_type_zh
  const description = zh ? project.description_zh || project.description_en : project.description_en || project.description_zh
  const tags = zh ? project.tags_zh : project.tags_en
  const heroImage = project.cover_image_url || project.images[0] || null
  const gallery = [
    project.cover_image_url,
    ...project.images,
  ].filter((image, index, images): image is string => Boolean(image) && images.indexOf(image) === index)
  const modules = moduleMap(pageModules)
  const detailLabels = modules.get('detail-labels') ?? null
  const facts = [
    { label: itemLabel(itemById(detailLabels, 'fact-location'), lang), value: location },
    { label: itemLabel(itemById(detailLabels, 'fact-type'), lang), value: type },
    { label: itemLabel(itemById(detailLabels, 'fact-area'), lang), value: project.area_display },
    { label: itemLabel(itemById(detailLabels, 'fact-investment'), lang), value: project.investment_display },
    { label: itemLabel(itemById(detailLabels, 'fact-units'), lang), value: project.units_display },
    { label: itemLabel(itemById(detailLabels, 'fact-products'), lang), value: project.products },
  ].map((fact) => ({ ...fact, value: text(fact.value) })).filter((fact) => Boolean(fact.value))
  const proofTitle = itemLabel(itemById(detailLabels, 'proof-title'), lang)
  const galleryTitle = itemLabel(itemById(detailLabels, 'gallery-title'), lang)
  const relatedTitle = itemLabel(itemById(detailLabels, 'related-title'), lang)
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
                  <a href="#case-inquiry" className="inline-flex min-h-12 items-center justify-center border border-white bg-white px-5 text-sm font-bold uppercase tracking-[0.12em] text-[#201B17] transition hover:bg-[#E36F2C] hover:text-white">
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
        <section className="border-t border-[#E5DED4] bg-[#F5F2ED] py-16">
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
                  <Link
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
