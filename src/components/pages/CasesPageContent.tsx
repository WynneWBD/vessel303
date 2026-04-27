'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import { useT, useLanguage } from '@/contexts/LanguageContext'
import { i18n } from '@/lib/i18n'
import type { ProjectCaseRow } from '@/lib/project-cases-static'

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`bg-[#E5DED4] flex items-center justify-center ${className}`}>
      <span className="text-[#8A8580] text-xs tracking-wider">{label}</span>
    </div>
  )
}

export default function CasesPageContent({ cases }: { cases: ProjectCaseRow[] }) {
  const t = useT()
  const { lang } = useLanguage()
  const zh = lang === 'zh'

  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      <PageHero
        label={t(i18n.cases.heroLabel)}
        title={t(i18n.cases.heroTitle1)}
        titleGold={t(i18n.cases.heroTitleGold)}
        subtitle={t(i18n.cases.heroSubtitle)}
        breadcrumb={[{ label: t(i18n.productDetail.home), href: '/' }, { label: t(i18n.nav.cases) }]}
      />

      <div className="bg-[#FAF7F2] border-b border-[#E36F2C]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap gap-8 justify-center">
            {[
              [t(i18n.cases.stat1Val), t(i18n.cases.stat1)],
              [t(i18n.cases.stat2Val), t(i18n.cases.stat2)],
              [t(i18n.cases.stat3Val), t(i18n.cases.stat3)],
              [t(i18n.cases.stat4Val), t(i18n.cases.stat4)],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-[#E36F2C] text-2xl font-black">{num}</div>
                <div className="text-[#6B6560] text-xs tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            t(i18n.cases.filterAll),
            t(i18n.cases.filterTourism),
            t(i18n.cases.filterCommercial),
            t(i18n.cases.filterPublic),
            t(i18n.cases.filterOverseas),
          ].map((tab, i) => (
            <button
              key={tab}
              className={`text-sm px-4 py-1.5 border tracking-wider transition-colors ${
                i === 0
                  ? 'border-[#E36F2C] text-[#E36F2C] bg-[#E36F2C]/5'
                  : 'border-[#E5DED4] text-[#6B6560] hover:border-[#BBBBBB] hover:text-[#555555]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {cases.map((item, i) => {
            const name = zh ? item.name_zh : item.name_en
            const location = zh ? item.location_zh : item.location_en
            const type = zh ? item.project_type_zh : item.project_type_en
            const desc = zh ? item.description_zh : item.description_en
            const tags = zh ? item.tags_zh : item.tags_en
            return (
              <div
                key={item.id}
                className="group bg-white border border-[#E5DED4] hover:border-[#E36F2C]/25 transition-all duration-300 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                  {item.cover_image_url ? (
                    <div className="h-52 md:h-auto bg-[#E5DED4] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.cover_image_url} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  ) : (
                    <Placeholder label={`${name} · 现场图片`} className="h-52 md:h-auto" />
                  )}

                  <div className="md:col-span-2 p-6 md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="text-[10px] font-mono text-[#999999] tracking-[0.2em]">
                            CASE {String(i + 1).padStart(3, '0')}
                          </span>
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 tracking-wider bg-[#E36F2C]/10 text-[#E36F2C] border border-[#E36F2C]/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-xl font-black text-[#2C2A28] tracking-wider mb-1">{name}</h3>
                        <div className="flex items-center gap-3 text-sm text-[#6B6560]">
                          <span>{location}</span>
                          {type && (
                            <>
                              <span>·</span>
                              <span>{type}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-[#6B6560] text-sm leading-relaxed mb-5">{desc}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: t(i18n.cases.specArea), value: item.area_display },
                        { label: t(i18n.cases.specInvestment), value: item.investment_display },
                        { label: t(i18n.cases.specUnits), value: item.units_display },
                        { label: t(i18n.cases.specProducts), value: item.products },
                      ].map((spec) => (
                        <div key={spec.label} className="bg-[#F8F6F2] px-3 py-2 border border-[#E5DED4]">
                          <div className="text-[#AAAAAA] text-[10px] tracking-wider mb-0.5">{spec.label}</div>
                          <div className="text-[#444444] text-xs font-semibold tracking-wider">{spec.value || '-'}</div>
                        </div>
                      ))}
                    </div>

                    <a
                      href={`/global?camp=${item.id}`}
                      className="inline-flex items-center gap-2 text-[#E36F2C] text-xs hover:underline tracking-wider"
                    >
                      {t(i18n.cases.viewDetail)}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center p-12 border border-[#E36F2C]/15 bg-[#E36F2C]/3">
          <div className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase mb-3">{t(i18n.cases.ctaBadge)}</div>
          <h2 className="text-2xl font-black text-[#2C2A28] mb-3">{t(i18n.cases.ctaTitle)}</h2>
          <p className="text-[#6B6560] text-sm mb-8 tracking-wider">{t(i18n.cases.ctaSubtitle)}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://en.303vessel.cn/contact.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#E36F2C] text-white font-bold text-sm px-8 py-3 hover:bg-[#C85A1F] transition-colors tracking-wider"
            >
              {t(i18n.cases.ctaBtn1)}
            </a>
            <a
              href="tel:4008090303"
              className="border border-[#999999] text-[#2C2A28] text-sm px-8 py-3 hover:border-[#E36F2C] hover:text-[#E36F2C] transition-colors tracking-wider"
            >
              400-8090-303
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
