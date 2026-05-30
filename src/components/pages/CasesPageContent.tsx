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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((item) => {
              const name = zh ? item.name_zh : item.name_en
              const location = zh ? item.location_zh : item.location_en
              const type = zh ? item.project_type_zh : item.project_type_en
              const desc = zh ? item.description_zh : item.description_en
              const tags = zh ? item.tags_zh : item.tags_en

              return (
                <Link
                  key={item.id}
                  href={`/cases/${item.id}`}
                  className="group flex min-h-full flex-col overflow-hidden border border-[#E5DED4] bg-white transition-all duration-300 hover:border-[#E36F2C]/30 hover:shadow-[0_18px_50px_rgba(44,42,40,0.10)]"
                >
                  {item.cover_image_url ? (
                    <div className="relative h-56 overflow-hidden bg-[#E5DED4]">
                      <ProtectedImage
                        src={item.cover_image_url}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    {tags.length > 0 ? (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="border border-[#E36F2C]/20 bg-[#E36F2C]/10 px-2 py-0.5 text-[10px] tracking-wider text-[#E36F2C]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {name ? (
                      <h2 className="text-lg font-black leading-snug text-[#2C2A28]">{name}</h2>
                    ) : null}
                    {(location || type) ? (
                      <p className="mt-2 text-xs leading-5 text-[#6B6560]">
                        {[location, type].filter(Boolean).join(' / ')}
                      </p>
                    ) : null}
                    {desc ? (
                      <p className="mt-4 line-clamp-4 text-sm leading-6 text-[#6B6560]">{desc}</p>
                    ) : null}
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
