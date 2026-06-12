'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, Filter, Globe2, Layers3, MapPin, RotateCcw, Search, ShieldCheck } from 'lucide-react'
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

const ALL_FILTER = 'all'

type FilterOption = {
  key: string
  label: string
  count?: number
}

function cleanText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function optionKey(value: string | null | undefined) {
  return cleanText(value).toLowerCase().replace(/\s+/g, ' ')
}

function optionFromPair(zh: boolean, zhValue: string | null | undefined, enValue: string | null | undefined): FilterOption | null {
  const key = optionKey(enValue || zhValue)
  const label = cleanText(zh ? zhValue || enValue : enValue || zhValue)
  if (!key || !label) return null
  return { key, label }
}

function localizedText(zh: boolean, zhValue: string | null | undefined, enValue: string | null | undefined) {
  return cleanText(zh ? zhValue || enValue : enValue || zhValue)
}

function localizedList(zh: boolean, zhValues: string[], enValues: string[]) {
  return zhValues.length > 0 ? (zh ? zhValues : enValues.length > 0 ? enValues : zhValues) : enValues
}

function splitProducts(value: string | null | undefined) {
  return cleanText(value)
    .split(/[·,，、/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function uniqueProductCount(projects: ProjectCaseRow[]) {
  const productSet = new Set<string>()
  for (const project of projects) {
    for (const product of splitProducts(project.products)) {
      productSet.add(product.toLowerCase())
    }
  }
  return productSet.size
}

function uniqueLocationCount(projects: ProjectCaseRow[], zh: boolean) {
  const locationSet = new Set<string>()
  for (const project of projects) {
    const location = localizedText(zh, project.location_zh, project.location_en)
    if (location) locationSet.add(location.toLowerCase())
  }
  return locationSet.size
}

function tagOptionsForCase(project: ProjectCaseRow, zh: boolean) {
  const tagsZh = Array.isArray(project.tags_zh) ? project.tags_zh : []
  const tagsEn = Array.isArray(project.tags_en) ? project.tags_en : []
  const maxLength = Math.max(tagsZh.length, tagsEn.length)
  return Array.from({ length: maxLength }, (_item, index) => optionFromPair(zh, tagsZh[index], tagsEn[index]))
    .filter((item): item is FilterOption => Boolean(item))
}

function uniqueOptions(options: FilterOption[]) {
  const optionMap = new Map<string, FilterOption>()
  for (const option of options) {
    const current = optionMap.get(option.key)
    optionMap.set(option.key, {
      ...option,
      count: (current?.count ?? 0) + 1,
    })
  }
  return Array.from(optionMap.values())
}

function filterButtonClass(active: boolean) {
  return [
    'min-h-10 max-w-full border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.1em] transition-colors',
    active
      ? 'border-[#E36F2C] bg-[#E36F2C] text-white'
      : 'border-[#E5DED4] bg-[#FAF7F2] text-[#5F5A55] hover:border-[#E36F2C]/45 hover:text-[#2C2A28]',
  ].join(' ')
}

function CountedFilterLabel({ label, count }: { label: string; count?: number }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <span className="truncate">{label}</span>
      {typeof count === 'number' ? (
        <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-[#2C2A28]">
          {count}
        </span>
      ) : null}
    </span>
  )
}

function CaseCommandPanel({
  cases,
  filteredCases,
  typeOptions,
  tagOptions,
  activeType,
  activeTag,
  onTypeChange,
  onTagChange,
  onReset,
  zh,
}: {
  cases: ProjectCaseRow[]
  filteredCases: ProjectCaseRow[]
  typeOptions: FilterOption[]
  tagOptions: FilterOption[]
  activeType: string
  activeTag: string
  onTypeChange: (key: string) => void
  onTagChange: (key: string) => void
  onReset: () => void
  zh: boolean
}) {
  const activeTypeLabel = typeOptions.find((option) => option.key === activeType)?.label
  const activeTagLabel = tagOptions.find((option) => option.key === activeTag)?.label
  const productCount = uniqueProductCount(filteredCases)
  const locationCount = uniqueLocationCount(filteredCases, zh)
  const hasActiveFilter = activeType !== ALL_FILTER || activeTag !== ALL_FILTER
  const quickTypes = typeOptions.slice(0, 4)
  const quickTags = tagOptions.slice(0, 6)
  const statItems = [
    {
      label: zh ? '已发布案例' : 'Published cases',
      value: cases.length,
      detail: zh ? '来自公开项目案例库' : 'Visible public case library',
      Icon: ShieldCheck,
    },
    {
      label: zh ? '当前匹配' : 'Matching now',
      value: filteredCases.length,
      detail: zh ? '跟随当前类型和标签筛选' : 'Follows type and tag filters',
      Icon: Search,
    },
    {
      label: zh ? '产品引用' : 'Product references',
      value: productCount,
      detail: zh ? '当前范围内出现的型号/系列' : 'Models or series in this scope',
      Icon: Layers3,
    },
    {
      label: zh ? '项目地点' : 'Project locations',
      value: locationCount,
      detail: zh ? '当前范围内的地点数量' : 'Locations represented in this scope',
      Icon: MapPin,
    },
  ]

  return (
    <section
      className="mb-5 border border-[#E5DED4] bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5"
      data-case-command-panel="true"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.45fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1889B6]">
                <BarChart3 size={15} strokeWidth={2.4} aria-hidden="true" />
                {zh ? '案例控制台' : 'Case control'}
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-[#2C2A28] sm:text-3xl">
                {zh ? '先筛场景，再看证据，最后进入项目咨询。' : 'Filter the scenario, verify proof, then open the project inquiry.'}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6560]">
                {zh
                  ? '按项目类型、标签、产品引用和地点快速缩小范围，列表页先完成第一轮项目适配判断。'
                  : 'Use project type, tags, product references, and locations to narrow the library before opening a detailed case.'}
              </p>
            </div>
            {hasActiveFilter ? (
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-2 border border-[#E5DED4] bg-[#FAF7F2] px-3 text-xs font-bold uppercase tracking-[0.1em] text-[#5F5A55] transition-colors hover:border-[#E36F2C]/45 hover:text-[#2C2A28]"
                onClick={onReset}
              >
                <RotateCcw size={14} strokeWidth={2.4} aria-hidden="true" />
                {zh ? '重置' : 'Reset'}
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statItems.map(({ label, value, detail, Icon }) => (
              <div key={label} className="border border-[#E5DED4] bg-[#FAF7F2] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]">{label}</p>
                  <Icon size={16} strokeWidth={2.4} className="text-[#1889B6]" aria-hidden="true" />
                </div>
                <p className="mt-3 text-3xl font-black leading-none text-[#2C2A28]">{value}</p>
                <p className="mt-2 text-xs leading-5 text-[#6B6560]">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="min-w-0 border border-[#E5DED4] bg-[#FAF7F2] p-4">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2C2A28]">
            <Filter size={15} strokeWidth={2.4} aria-hidden="true" />
            {zh ? '高频筛选' : 'High-signal filters'}
          </p>
          <div className="mt-3 border border-[#E5DED4] bg-white px-3 py-2 text-xs leading-5 text-[#6B6560]">
            <span className="font-black text-[#2C2A28]">{zh ? '当前路径' : 'Current route'}: </span>
            {activeTypeLabel || activeTagLabel
              ? [activeTypeLabel, activeTagLabel].filter(Boolean).join(' / ')
              : zh ? '全部公开案例' : 'All published cases'}
          </div>

          {quickTypes.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]">{zh ? '项目类型' : 'Project type'}</p>
              <div className="flex flex-wrap gap-2">
                {quickTypes.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={activeType === option.key}
                    className={filterButtonClass(activeType === option.key)}
                    onClick={() => onTypeChange(option.key)}
                  >
                    <CountedFilterLabel label={option.label} count={option.count} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {quickTags.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]">{zh ? '案例标签' : 'Case tags'}</p>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={activeTag === option.key}
                    className={filterButtonClass(activeTag === option.key)}
                    onClick={() => onTagChange(option.key)}
                  >
                    <CountedFilterLabel label={option.label} count={option.count} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-2 border-t border-[#E5DED4] pt-4 text-xs leading-5 text-[#6B6560]">
            <p className="flex items-start gap-2">
              <Globe2 size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-[#1889B6]" aria-hidden="true" />
              <span>{zh ? '项目地点和产品引用只从现有案例字段读取。' : 'Locations and product references are derived from existing case fields.'}</span>
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

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
  const typeFilterLabel = itemLabel(itemById(detailLabelsModule, 'fact-type'), lang) || (zh ? '项目类型' : 'Project Type')
  const tagFilterLabel = zh ? '标签' : 'Tags'
  const allTypeLabel = zh ? '全部类型' : 'All Projects'
  const allTagLabel = zh ? '全部标签' : 'All Tags'
  const resetLabel = zh ? '重置' : 'Reset'
  const emptyLabel = zh ? '当前筛选暂无案例' : 'No cases match the selected filters.'
  const openCaseLabel = zh ? '查看案例' : 'Open case'
  const [activeType, setActiveType] = useState(ALL_FILTER)
  const [activeTag, setActiveTag] = useState(ALL_FILTER)
  const typeOptions = useMemo(
    () => uniqueOptions(cases.map((project) => optionFromPair(zh, project.project_type_zh, project.project_type_en)).filter((item): item is FilterOption => Boolean(item))),
    [cases, zh],
  )
  const tagOptions = useMemo(
    () => uniqueOptions(cases.flatMap((project) => tagOptionsForCase(project, zh))),
    [cases, zh],
  )
  const filteredCases = useMemo(
    () => cases.filter((project) => {
      const projectTypeKey = optionKey(project.project_type_en || project.project_type_zh)
      const projectTagKeys = tagOptionsForCase(project, false).map((option) => option.key)
      const typeMatches = activeType === ALL_FILTER || projectTypeKey === activeType
      const tagMatches = activeTag === ALL_FILTER || projectTagKeys.includes(activeTag)
      return typeMatches && tagMatches
    }),
    [activeTag, activeType, cases],
  )
  const hasFilters = typeOptions.length > 1 || tagOptions.length > 1
  const hasActiveFilter = activeType !== ALL_FILTER || activeTag !== ALL_FILTER

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
          <CaseCommandPanel
            cases={cases}
            filteredCases={filteredCases}
            typeOptions={typeOptions}
            tagOptions={tagOptions}
            activeType={activeType}
            activeTag={activeTag}
            onTypeChange={setActiveType}
            onTagChange={setActiveTag}
            onReset={() => {
              setActiveType(ALL_FILTER)
              setActiveTag(ALL_FILTER)
            }}
            zh={zh}
          />

          {hasFilters ? (
            <div className="mb-5 border border-[#E5DED4] bg-white px-4 py-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-4">
                  {typeOptions.length > 1 ? (
                    <div className="grid gap-2 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-start">
                      <p className="pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]">{typeFilterLabel}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-pressed={activeType === ALL_FILTER}
                          className={filterButtonClass(activeType === ALL_FILTER)}
                          onClick={() => setActiveType(ALL_FILTER)}
                        >
                          <CountedFilterLabel label={allTypeLabel} count={cases.length} />
                        </button>
                        {typeOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            aria-pressed={activeType === option.key}
                            className={filterButtonClass(activeType === option.key)}
                            onClick={() => setActiveType(option.key)}
                          >
                            <CountedFilterLabel label={option.label} count={option.count} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {tagOptions.length > 1 ? (
                    <div className="grid gap-2 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-start">
                      <p className="pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]">{tagFilterLabel}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-pressed={activeTag === ALL_FILTER}
                          className={filterButtonClass(activeTag === ALL_FILTER)}
                          onClick={() => setActiveTag(ALL_FILTER)}
                        >
                          <CountedFilterLabel label={allTagLabel} count={cases.length} />
                        </button>
                        {tagOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            aria-pressed={activeTag === option.key}
                            className={filterButtonClass(activeTag === option.key)}
                            onClick={() => setActiveTag(option.key)}
                          >
                            <CountedFilterLabel label={option.label} count={option.count} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E5DED4] pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8A8580]">
                    {filteredCases.length}/{cases.length}
                  </p>
                  {hasActiveFilter ? (
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-2 border border-[#E5DED4] bg-[#FAF7F2] px-3 text-xs font-bold uppercase tracking-[0.1em] text-[#5F5A55] transition-colors hover:border-[#E36F2C]/45 hover:text-[#2C2A28]"
                      onClick={() => {
                        setActiveType(ALL_FILTER)
                        setActiveTag(ALL_FILTER)
                      }}
                    >
                      <RotateCcw size={14} strokeWidth={2.4} aria-hidden="true" />
                      {resetLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {filteredCases.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCases.map((item, index) => {
              const name = localizedText(zh, item.name_zh, item.name_en)
              const location = localizedText(zh, item.location_zh, item.location_en)
              const type = localizedText(zh, item.project_type_zh, item.project_type_en)
              const desc = localizedText(zh, item.description_zh, item.description_en)
              const tags = localizedList(zh, item.tags_zh, item.tags_en)
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
                <Link prefetch={false}
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
                    <span className="mt-auto inline-flex items-center justify-end gap-2 pt-6 text-xs font-black uppercase tracking-[0.14em] text-[#E36F2C] transition-transform duration-300 group-hover:translate-x-1">
                      {openCaseLabel}
                      <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
          ) : (
            <div className="border border-[#E5DED4] bg-white px-5 py-10 text-center text-sm font-bold uppercase tracking-[0.12em] text-[#8A8580]">
              {emptyLabel}
            </div>
          )}
        </section>
      ) : null}

      <Footer />
    </main>
  )
}
