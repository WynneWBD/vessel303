'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
        <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              const featured = index === 0

              return (
                <Link
                  key={item.id}
                  href={`/cases/${item.id}`}
                  className={`group flex min-h-full flex-col overflow-hidden border border-[#E5DED4] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#E36F2C]/35 hover:shadow-[0_24px_60px_rgba(44,42,40,0.10)] ${featured ? 'xl:col-span-2' : ''}`}
                >
                  {item.cover_image_url ? (
                    <div className={`relative overflow-hidden bg-[#E5DED4] ${featured ? 'aspect-[16/9] md:aspect-[21/10]' : 'aspect-[4/3]'}`}>
                      <ProtectedImage
                        src={item.cover_image_url}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes={featured ? '(max-width: 1280px) 100vw, 58vw' : '(max-width: 768px) 100vw, 32vw'}
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-[#16110D]/80 via-[#16110D]/16 to-transparent" />
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span className="bg-white/92 px-2.5 py-1 text-[11px] font-black text-[#2C2A28]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {type ? (
                          <span className="bg-[#E36F2C] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                            {type}
                          </span>
                        ) : null}
                      </div>
                      {tags.length > 0 ? (
                        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                          {tags.slice(0, featured ? 4 : 2).map((tag) => (
                            <span
                              key={tag}
                              className="border border-white/25 bg-white/14 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white backdrop-blur"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className={`bg-[#E5DED4] ${featured ? 'aspect-[16/9] md:aspect-[21/10]' : 'aspect-[4/3]'}`} />
                  )}

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {name ? (
                      <h2 className={`${featured ? 'text-2xl sm:text-3xl' : 'text-xl'} font-black leading-tight text-[#2C2A28]`}>{name}</h2>
                    ) : null}
                    {location ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8580]">
                        {location}
                      </p>
                    ) : null}
                    {desc ? (
                      <p className={`mt-4 text-sm leading-6 text-[#6B6560] ${featured ? 'line-clamp-3' : 'line-clamp-2'}`}>{desc}</p>
                    ) : null}
                    {facts.length > 0 ? (
                      <div className={`mt-6 grid gap-2 border-t border-[#E5DED4] pt-5 ${featured ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                        {facts.slice(0, featured ? 6 : 4).map((fact, factIndex) => (
                          <div key={`${fact.label}-${factIndex}`} className="min-w-0 border border-[#E5DED4] bg-[#FAF7F2] px-3 py-2">
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9A8F86]">{fact.label}</span>
                            <span className="mt-1 block text-sm font-bold leading-5 text-[#2C2A28]">{fact.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <span className="mt-auto inline-flex justify-end pt-6 text-[#E36F2C] transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                      <ArrowRight size={20} strokeWidth={2.4} />
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
