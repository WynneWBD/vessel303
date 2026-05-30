'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import ProtectedImage from '@/components/ProtectedImage'
import { useT, useLanguage } from '@/contexts/LanguageContext'
import { i18n } from '@/lib/i18n'
import { buildContactHref } from '@/lib/site-links'
import type { ProjectCaseRow } from '@/lib/project-cases-static'

type CaseFilter = 'all' | 'tourism' | 'commercial' | 'public' | 'overseas'

const tourismKeywords = [
  'tourism',
  'resort',
  'camp',
  'glamping',
  'scenic',
  'alpine',
  'grassland',
  'eco',
  'cultural tourism',
  '文旅',
  '度假',
  '营地',
  '野奢',
  '高原',
  '草原',
  '生态',
  '景区',
  '滨海',
  '亲子',
  '湖景',
]

const commercialKeywords = [
  'commercial',
  'showroom',
  'brand',
  'technology',
  'smart home',
  '商业',
  '品牌',
  '展馆',
  '体验空间',
  '科技',
  '智能家居',
  '合作',
]

const publicKeywords = [
  'public',
  'facility',
  'facilities',
  'municipal',
  '公共',
  '公建',
  '政务',
  '设施',
]

function searchableText(item: ProjectCaseRow) {
  return [
    item.name_zh,
    item.name_en,
    item.location_zh,
    item.location_en,
    item.project_type_zh,
    item.project_type_en,
    item.description_zh,
    item.description_en,
    item.tags_zh.join(' '),
    item.tags_en.join(' '),
    item.country,
  ].join(' ').toLowerCase()
}

function matchesKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

function isOverseasCase(item: ProjectCaseRow) {
  const country = item.country.trim().toLowerCase()
  return country.length > 0 && country !== '中国' && country !== 'china'
}

function matchesFilter(item: ProjectCaseRow, filter: CaseFilter) {
  if (filter === 'all') return true
  if (filter === 'overseas') return isOverseasCase(item)

  const text = searchableText(item)
  if (filter === 'tourism') return matchesKeyword(text, tourismKeywords)
  if (filter === 'commercial') return matchesKeyword(text, commercialKeywords)
  return matchesKeyword(text, publicKeywords)
}

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
  const [activeFilter, setActiveFilter] = useState<CaseFilter>('all')
  const filters: { key: CaseFilter; label: string }[] = [
    { key: 'all', label: t(i18n.cases.filterAll) },
    { key: 'tourism', label: t(i18n.cases.filterTourism) },
    { key: 'commercial', label: t(i18n.cases.filterCommercial) },
    { key: 'public', label: t(i18n.cases.filterPublic) },
    { key: 'overseas', label: t(i18n.cases.filterOverseas) },
  ]
  const visibleCases = useMemo(
    () => cases.filter((item) => matchesFilter(item, activeFilter)),
    [cases, activeFilter],
  )
  const featuredCases = cases.filter((item) => item.cover_image_url).slice(0, 3)
  const caseHighlights = [
    {
      label: zh ? '项目筛选' : 'Project filter',
      title: zh ? '按运营场景先分流' : 'Route by operating scenario',
      body: zh ? '旅游营地、商业展示、公共设施和海外项目先分组，方便采购方快速找到参考。' : 'Tourism, commercial, public, and overseas filters help buyers find relevant proof faster.',
    },
    {
      label: zh ? '案例证据' : 'Case proof',
      title: zh ? '图片、参数和产品同时展示' : 'Image, specs, and products together',
      body: zh ? '每个案例保留封面、地点、项目类型、面积、数量和使用产品，支撑后续咨询判断。' : 'Each case keeps cover, location, type, scale, units, and product references for inquiry context.',
    },
    {
      label: zh ? '转化入口' : 'Conversion',
      title: zh ? '详情页继续承接线索' : 'Detail pages keep lead context',
      body: zh ? '列表先筛选，详情页再提交需求，后台能识别案例来源。' : 'The list filters interest, while detail pages submit inquiries with case source tracking.',
    },
  ]

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

      {featuredCases.length > 0 ? (
        <section className="border-b border-[#E5DED4] bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <Link href={`/cases/${featuredCases[0].id}`} className="group relative min-h-[300px] overflow-hidden bg-[#E5DED4]">
              <ProtectedImage
                src={featuredCases[0].cover_image_url || ''}
                alt={zh ? featuredCases[0].name_zh : featuredCases[0].name_en}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#241F1B]/88 to-transparent p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#E36F2C]">
                  {zh ? '精选案例' : 'Featured Case'}
                </p>
                <h2 className="mt-2 text-xl font-black text-white">{zh ? featuredCases[0].name_zh : featuredCases[0].name_en}</h2>
                <p className="mt-1 text-sm text-white/65">{zh ? featuredCases[0].location_zh : featuredCases[0].location_en}</p>
              </div>
            </Link>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {featuredCases.slice(1, 3).map((item) => (
                <Link key={item.id} href={`/cases/${item.id}`} className="group grid grid-cols-1 overflow-hidden border border-[#E5DED4] bg-[#FAF7F2] sm:grid-cols-[140px_minmax(0,1fr)]">
                  <span className="relative min-h-[180px] overflow-hidden bg-[#E5DED4] sm:min-h-[150px]">
                    <ProtectedImage
                      src={item.cover_image_url || ''}
                      alt={zh ? item.name_zh : item.name_en}
                      fill
                      loading="lazy"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 140px"
                    />
                  </span>
                  <span className="flex min-w-0 flex-col justify-center p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E36F2C]">
                      {zh ? '项目证据' : 'Project Proof'}
                    </span>
                    <span className="mt-2 text-sm font-black leading-snug text-[#2C2A28]">{zh ? item.name_zh : item.name_en}</span>
                    <span className="mt-1 text-xs leading-5 text-[#6B6560]">{zh ? item.location_zh : item.location_en}</span>
                  </span>
                </Link>
              ))}
              <div className="border border-[#E5DED4] bg-[#241F1B] p-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#E36F2C]">
                  {zh ? '运营链路' : 'Operating Route'}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  {zh
                    ? '先用场景筛选案例，再进入详情页提交带案例来源的项目询盘。'
                    : 'Filter by scenario, inspect case details, then submit a case-source inquiry.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-[#E5DED4] bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-3 lg:px-8">
          {caseHighlights.map((item) => (
            <div key={item.label} className="border border-[#E5DED4] bg-[#FAF7F2] p-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E36F2C]">{item.label}</p>
              <h2 className="text-base font-black text-[#2C2A28]">{item.title}</h2>
              <p className="mt-2 text-xs leading-5 text-[#6B6560]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-wrap gap-3 mb-10">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              aria-pressed={activeFilter === filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`text-sm px-4 py-1.5 border tracking-wider transition-colors ${
                activeFilter === filter.key
                  ? 'border-[#E36F2C] text-[#E36F2C] bg-[#E36F2C]/5'
                  : 'border-[#E5DED4] text-[#6B6560] hover:border-[#BBBBBB] hover:text-[#555555]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {visibleCases.map((item, i) => {
            const name = zh ? item.name_zh : item.name_en
            const location = zh ? item.location_zh : item.location_en
            const type = zh ? item.project_type_zh : item.project_type_en
            const desc = zh ? item.description_zh : item.description_en
            const tags = zh ? item.tags_zh : item.tags_en
            const specs = [
              { label: t(i18n.cases.specArea), value: item.area_display?.trim() ?? '' },
              { label: t(i18n.cases.specInvestment), value: item.investment_display?.trim() ?? '' },
              { label: t(i18n.cases.specUnits), value: item.units_display?.trim() ?? '' },
              { label: t(i18n.cases.specProducts), value: item.products?.trim() ?? '' },
            ].filter((spec) => spec.value.length > 0)
            return (
              <div
                key={item.id}
                className="group bg-white border border-[#E5DED4] hover:border-[#E36F2C]/25 transition-all duration-300 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                  {item.cover_image_url ? (
                    <div className="relative h-52 overflow-hidden bg-[#E5DED4] md:h-auto">
                      <ProtectedImage
                        src={item.cover_image_url}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
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

                    {specs.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {specs.map((spec) => (
                          <div key={spec.label} className="bg-[#F8F6F2] px-3 py-2 border border-[#E5DED4]">
                            <div className="text-[#AAAAAA] text-[10px] tracking-wider mb-0.5">{spec.label}</div>
                            <div className="text-[#444444] text-xs font-semibold tracking-wider">{spec.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/cases/${item.id}`}
                      className="inline-flex items-center gap-2 text-[#E36F2C] text-xs hover:underline tracking-wider"
                    >
                      {t(i18n.cases.viewDetail)}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
          {visibleCases.length === 0 && (
            <div className="border border-dashed border-[#D7CEC2] bg-white px-6 py-12 text-center">
              <div className="text-sm font-semibold tracking-wider text-[#2C2A28]">
                {zh ? '当前筛选暂无已发布案例' : 'No published cases match this filter yet'}
              </div>
              <p className="mt-2 text-xs tracking-wider text-[#8A8580]">
                {zh ? '请切换到全部案例查看已发布内容。' : 'Switch back to all cases to view published projects.'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-16 border border-[#E36F2C]/15 bg-[#E36F2C]/3 p-6 text-center sm:p-12">
          <div className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase mb-3">{t(i18n.cases.ctaBadge)}</div>
          <h2 className="text-2xl font-black text-[#2C2A28] mb-3">{t(i18n.cases.ctaTitle)}</h2>
          <p className="text-[#6B6560] text-sm mb-8 tracking-wider">{t(i18n.cases.ctaSubtitle)}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row sm:flex-wrap">
            <Link
              href={buildContactHref('cases:list_cta')}
              className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-8 py-3 text-sm font-bold tracking-wider text-white transition-colors hover:bg-[#C85A1F]"
            >
              {t(i18n.cases.ctaBtn1)}
            </Link>
            <a
              href="tel:4008090303"
              className="inline-flex min-h-11 items-center justify-center border border-[#999999] px-8 py-3 text-sm tracking-wider text-[#2C2A28] transition-colors hover:border-[#E36F2C] hover:text-[#E36F2C]"
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
