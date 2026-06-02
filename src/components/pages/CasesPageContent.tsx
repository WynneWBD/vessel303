'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedImage from '@/components/ProtectedImage'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  itemById,
  itemLabel,
  moduleDescription,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client'
import type { ProjectCaseRow } from '@/lib/project-cases-static'

export default function CasesPageContent({
  cases,
  pageModules,
}: {
  cases: ProjectCaseRow[]
  pageModules: PublicPageModule[]
}) {
  const { lang } = useLanguage()
  const zh = lang === 'zh'
  const modules = moduleMap(pageModules)
  const heroModule = modules.get('hero') ?? null
  const detailLabelsModule = modules.get('detail-labels') ?? null
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang)
  const heroTitle = moduleTitle(heroModule, lang)
  const heroDescription = moduleDescription(heroModule, lang)
  const showHero = heroModule?.is_visible !== false && (heroEyebrow || heroTitle || heroDescription)

  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      {showHero ? (
        <section className="border-b border-[#E36F2C]/10 bg-[#241F1B] px-4 pb-14 pt-32 sm:px-6">
          <div className="mx-auto max-w-7xl">
            {heroEyebrow ? (
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-[#E36F2C]">
                {heroEyebrow}
              </p>
            ) : null}
            {heroTitle ? (
              <h1 className="max-w-4xl text-4xl font-black leading-tight text-[#F5F2ED] sm:text-5xl">
                {heroTitle}
              </h1>
            ) : null}
            {heroDescription ? (
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#C9BEB4]">
                {heroDescription}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {cases.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {cases.map((item, index) => {
              const name = zh ? item.name_zh : item.name_en
              const location = zh ? item.location_zh : item.location_en
              const type = zh ? item.project_type_zh : item.project_type_en
              const desc = zh ? item.description_zh : item.description_en
              const tags = zh ? item.tags_zh : item.tags_en
              const facts = [
                { label: itemLabel(itemById(detailLabelsModule, 'fact-type'), lang), value: type },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-location'), lang), value: location },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-investment'), lang), value: item.investment_display },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-products'), lang), value: item.products },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-units'), lang), value: item.units_display },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-area'), lang), value: item.area_display },
              ].filter((fact) => fact.label && fact.value)

              return (
                <Link
                  key={item.id}
                  href={`/cases/${item.id}`}
                  className="group grid overflow-hidden border border-[#E5DED4] bg-white transition-all duration-300 hover:border-[#E36F2C]/35 hover:shadow-[0_24px_60px_rgba(44,42,40,0.10)] lg:grid-cols-[96px_minmax(280px,0.9fr)_minmax(0,1.1fr)]"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[#E5DED4] bg-[#F5F2ED] px-5 py-4 lg:block lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
                    <span className="block text-3xl font-black text-[#E36F2C]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 lg:mt-5">
                        {tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="border border-[#E36F2C]/20 bg-white px-2 py-0.5 text-[10px] tracking-wider text-[#E36F2C]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {item.cover_image_url ? (
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#E5DED4] lg:aspect-auto lg:min-h-[260px]">
                      <ProtectedImage
                        src={item.cover_image_url}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 38vw"
                      />
                    </div>
                  ) : (
                    <div className="hidden bg-[#E5DED4] lg:block" />
                  )}

                  <div className="flex min-h-full flex-col p-5 sm:p-6 lg:p-7">
                    {name ? (
                      <h2 className="text-xl font-black leading-tight text-[#2C2A28] sm:text-2xl">{name}</h2>
                    ) : null}
                    {(location || type) ? (
                      <p className="mt-2 text-xs leading-5 text-[#6B6560]">
                        {[location, type].filter(Boolean).join(' / ')}
                      </p>
                    ) : null}
                    {desc ? (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#6B6560]">{desc}</p>
                    ) : null}
                    {facts.length > 0 ? (
                      <div className="mt-6 grid gap-2 border-t border-[#E5DED4] pt-5 sm:grid-cols-2">
                        {facts.slice(0, 6).map((fact, factIndex) => (
                          <div key={`${fact.label}-${factIndex}`} className="border border-[#E5DED4] bg-[#FAF7F2] px-3 py-2">
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9A8F86]">{fact.label}</span>
                            <span className="mt-1 block text-sm font-bold leading-5 text-[#2C2A28]">{fact.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <span className="mt-6 inline-flex text-sm font-bold text-[#E36F2C] transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      <Footer />
    </main>
  )
}
