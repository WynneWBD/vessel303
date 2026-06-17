'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Filter,
  Globe2,
  ImageIcon,
  Layers3,
  MapPin,
  MessageSquareText,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react'
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
type CaseListLabels = {
  publishedCases: string
  publishedCasesDetail: string
  matchingNow: string
  matchingNowDetail: string
  productReferences: string
  productReferencesDetail: string
  projectLocations: string
  projectLocationsDetail: string
  caseControl: string
  caseControlTitle: string
  caseControlBody: string
  reset: string
  highSignalFilters: string
  currentRoute: string
  allPublishedCases: string
  projectType: string
  caseTags: string
  locationProductNote: string
  visibleCases: string
  visibleCasesDetailPrefix: string
  proofReady: string
  proofReadyDetail: string
  reviewProof: string
  basicProof: string
  imageProof: string
  imageProofDetail: string
  proofProductReferencesDetail: string
  scenario: string
  scenarioDetail: string
  proof: string
  proofDetail: string
  inquiry: string
  inquiryDetail: string
  caseProofDensity: string
  proofDensityTitle: string
  proofDensityBody: string
  openProofRichCase: string
  startCaseInquiry: string
  buyerDecisionPath: string
  typeFilter: string
  tagsFilter: string
  allTypes: string
  allTags: string
  empty: string
  openCase: string
  caseInquiry: string
  photosUnit: string
  gallery: string
  facts: string
  products: string
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

function moduleLabel(pageModule: PublicPageModule | null, id: string, lang: 'en' | 'zh', en: string, zh: string) {
  return itemLabel(itemById(pageModule, id), lang) || (lang === 'zh' ? zh : en)
}

function buildCaseListLabels(pageModule: PublicPageModule | null, lang: 'en' | 'zh'): CaseListLabels {
  const label = (id: string, en: string, zh: string) => moduleLabel(pageModule, id, lang, en, zh)
  return {
    publishedCases: label('list-published-cases', 'Published cases', '已发布案例'),
    publishedCasesDetail: label('list-published-cases-detail', 'Visible public case library', '来自公开项目案例库'),
    matchingNow: label('list-matching-now', 'Matching now', '当前匹配'),
    matchingNowDetail: label('list-matching-now-detail', 'Follows type and tag filters', '跟随当前类型和标签筛选'),
    productReferences: label('list-product-references', 'Product references', '产品引用'),
    productReferencesDetail: label('list-product-references-detail', 'Models or series in this scope', '当前范围内出现的型号/系列'),
    projectLocations: label('list-project-locations', 'Project locations', '项目地点'),
    projectLocationsDetail: label('list-project-locations-detail', 'Locations represented in this scope', '当前范围内的地点数量'),
    caseControl: label('list-case-control', 'Case control', '案例控制台'),
    caseControlTitle: label('list-case-control-title', 'Filter the scenario, verify proof, then open the project inquiry.', '先筛场景，再看证据，最后进入项目咨询。'),
    caseControlBody: label('list-case-control-body', 'Use project type, tags, product references, and locations to narrow the library before opening a detailed case.', '按项目类型、标签、产品引用和地点快速缩小范围，列表页先完成第一轮项目适配判断。'),
    reset: label('list-reset', 'Reset', '重置'),
    highSignalFilters: label('list-high-signal-filters', 'High-signal filters', '高频筛选'),
    currentRoute: label('list-current-route', 'Current route', '当前路径'),
    allPublishedCases: label('list-all-published-cases', 'All published cases', '全部公开案例'),
    projectType: label('fact-type', 'Project type', '项目类型'),
    caseTags: label('list-case-tags', 'Case tags', '案例标签'),
    locationProductNote: label('list-location-product-note', 'Locations and product references are derived from existing case fields.', '项目地点和产品引用只从现有案例字段读取。'),
    visibleCases: label('list-visible-cases', 'Visible cases', '当前案例'),
    visibleCasesDetailPrefix: label('list-visible-cases-detail-prefix', 'All public', '全部公开'),
    proofReady: label('list-proof-ready', 'Proof-ready', '证明完整'),
    proofReadyDetail: label('list-proof-ready-detail', 'Image, narrative, facts, and product reference', '有图像、叙事、参数和产品引用'),
    reviewProof: label('list-review-proof', 'Review proof', '重点复核'),
    basicProof: label('list-basic-proof', 'Basic proof', '基础展示'),
    imageProof: label('list-image-proof', 'Image proof', '图片证据'),
    imageProofDetail: label('list-image-proof-detail', 'Cover and gallery assets', '封面与图库合计'),
    proofProductReferencesDetail: label('list-proof-product-references-detail', 'Connects proof to product fit', '可回到产品判断适配'),
    scenario: label('list-scenario', 'Scenario', '场景'),
    scenarioDetail: label('list-scenario-detail', 'Type, location, and tags establish project fit.', '类型、地点、标签先判断项目相似度。'),
    proof: label('list-proof', 'Proof', '证据'),
    proofDetail: label('list-proof-detail', 'Images, facts, and models support delivery trust.', '图片、参数、产品型号支撑交付可信度。'),
    inquiry: label('list-inquiry', 'Inquiry', '咨询'),
    inquiryDetail: label('list-inquiry-detail', 'Detail pages keep the inquiry anchor in the traceable lead path.', '详情页保留案例咨询锚点，进入可追踪线索路径。'),
    caseProofDensity: label('list-proof-density', 'Case Proof Density', '案例证明密度'),
    proofDensityTitle: label('list-proof-density-title', 'Keep project proof, product references, and inquiry entry in one buyer path.', '把项目证据、产品引用和询盘入口放在同一条客户判断路径上。'),
    proofDensityBody: label('list-proof-density-body', 'The case list carries the first trust pass: visual proof, project facts, product references, and the next inquiry route.', '案例列表先承担第一轮信任建立：快速看到图像证据、项目事实、使用产品和下一步咨询入口。'),
    openProofRichCase: label('list-open-proof-rich-case', 'Open proof-rich case', '查看高证据案例'),
    startCaseInquiry: label('list-start-case-inquiry', 'Start case inquiry', '进入案例咨询'),
    buyerDecisionPath: label('list-buyer-decision-path', 'Buyer decision path', '客户侧判断顺序'),
    typeFilter: label('list-type-filter', 'Project Type', '项目类型'),
    tagsFilter: label('list-tags-filter', 'Tags', '标签'),
    allTypes: label('list-all-types', 'All Projects', '全部类型'),
    allTags: label('list-all-tags', 'All Tags', '全部标签'),
    empty: label('list-empty', 'No cases match the selected filters.', '当前筛选暂无案例'),
    openCase: label('list-open-case', 'Open case', '查看案例'),
    caseInquiry: label('list-case-inquiry', 'Case inquiry', '案例咨询'),
    photosUnit: label('list-photos-unit', 'photos', '张图'),
    gallery: label('gallery-title', 'Gallery', '图库'),
    facts: label('list-facts', 'Facts', '事实'),
    products: label('fact-products', 'Products', '产品'),
  }
}

function splitProducts(value: string | null | undefined) {
  return cleanText(value)
    .split(/[·,，、/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function hasText(value: string | null | undefined) {
  return cleanText(value).length > 0
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

function caseProofProfile(project: ProjectCaseRow) {
  const imageCount = [project.cover_image_url, ...project.images].filter(Boolean).length
  const products = splitProducts(project.products)
  const factCount = [
    project.project_type_en || project.project_type_zh,
    project.location_en || project.location_zh,
    project.area_display,
    project.units_display,
    project.products,
  ].filter((item) => hasText(item)).length
  const hasNarrative = hasText(project.description_en) || hasText(project.description_zh)
  const hasInquiryContext = hasNarrative && products.length > 0 && factCount >= 4
  const proofScore = imageCount + factCount + (hasNarrative ? 1 : 0)

  return {
    imageCount,
    productsCount: products.length,
    factCount,
    hasNarrative,
    hasInquiryContext,
    proofScore,
  }
}

function caseProofTone(profile: ReturnType<typeof caseProofProfile>) {
  if (profile.hasInquiryContext && profile.imageCount > 0) return 'ready'
  if (profile.hasInquiryContext || profile.imageCount > 0) return 'review'
  return 'basic'
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
  labels,
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
  labels: CaseListLabels
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
      label: labels.publishedCases,
      value: cases.length,
      detail: labels.publishedCasesDetail,
      Icon: ShieldCheck,
    },
    {
      label: labels.matchingNow,
      value: filteredCases.length,
      detail: labels.matchingNowDetail,
      Icon: Search,
    },
    {
      label: labels.productReferences,
      value: productCount,
      detail: labels.productReferencesDetail,
      Icon: Layers3,
    },
    {
      label: labels.projectLocations,
      value: locationCount,
      detail: labels.projectLocationsDetail,
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
                {labels.caseControl}
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-[#2C2A28] sm:text-3xl">
                {labels.caseControlTitle}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6560]">
                {labels.caseControlBody}
              </p>
            </div>
            {hasActiveFilter ? (
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-2 border border-[#E5DED4] bg-[#FAF7F2] px-3 text-xs font-bold uppercase tracking-[0.1em] text-[#5F5A55] transition-colors hover:border-[#E36F2C]/45 hover:text-[#2C2A28]"
                onClick={onReset}
              >
                <RotateCcw size={14} strokeWidth={2.4} aria-hidden="true" />
                {labels.reset}
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
            {labels.highSignalFilters}
          </p>
          <div className="mt-3 border border-[#E5DED4] bg-white px-3 py-2 text-xs leading-5 text-[#6B6560]">
            <span className="font-black text-[#2C2A28]">{labels.currentRoute}: </span>
            {activeTypeLabel || activeTagLabel
              ? [activeTypeLabel, activeTagLabel].filter(Boolean).join(' / ')
              : labels.allPublishedCases}
          </div>

          {quickTypes.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]">{labels.projectType}</p>
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
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]">{labels.caseTags}</p>
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
              <span>{labels.locationProductNote}</span>
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

function CaseProofPathPanel({
  cases,
  filteredCases,
  labels,
}: {
  cases: ProjectCaseRow[]
  filteredCases: ProjectCaseRow[]
  labels: CaseListLabels
}) {
  const profiles = filteredCases.map(caseProofProfile)
  const proofReadyCount = profiles.filter((profile) => profile.hasInquiryContext && profile.imageCount > 0).length
  const galleryCount = profiles.reduce((sum, profile) => sum + profile.imageCount, 0)
  const productCount = uniqueProductCount(filteredCases)
  const strongestCase = filteredCases
    .map((project) => ({ project, profile: caseProofProfile(project) }))
    .sort((a, b) => b.profile.proofScore - a.profile.proofScore || a.project.sort_order - b.project.sort_order)[0]?.project
  const strongestCaseHref = strongestCase ? `/cases/${strongestCase.id}` : '/contact'
  const strongestInquiryHref = strongestCase ? `/cases/${strongestCase.id}#case-inquiry` : '/contact'
  const statItems = [
    {
      label: labels.visibleCases,
      value: filteredCases.length,
      detail: `${labels.visibleCasesDetailPrefix} ${cases.length}`,
      Icon: ShieldCheck,
    },
    {
      label: labels.proofReady,
      value: proofReadyCount,
      detail: labels.proofReadyDetail,
      Icon: CheckCircle2,
    },
    {
      label: labels.imageProof,
      value: galleryCount,
      detail: labels.imageProofDetail,
      Icon: ImageIcon,
    },
    {
      label: labels.productReferences,
      value: productCount,
      detail: labels.proofProductReferencesDetail,
      Icon: Package,
    },
  ]
  const routeSteps = [
    {
      label: labels.scenario,
      detail: labels.scenarioDetail,
    },
    {
      label: labels.proof,
      detail: labels.proofDetail,
    },
    {
      label: labels.inquiry,
      detail: labels.inquiryDetail,
    },
  ]

  return (
    <section className="mb-5 overflow-hidden border border-[#D8E7E8] bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#1889B6] px-4 py-4 sm:px-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1889B6]">
            {labels.caseProofDensity}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#2C2A28] sm:text-3xl">
            {labels.proofDensityTitle}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[#6B6560]">
            {labels.proofDensityBody}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              prefetch={false}
              href={strongestCaseHref}
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#E36F2C] bg-[#E36F2C] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-[#C95E22] hover:bg-[#C95E22]"
            >
              {labels.openProofRichCase}
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <Link
              prefetch={false}
              href={strongestInquiryHref}
              data-analytics-cta="true"
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#2C2A28] bg-[#2C2A28] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-[#1889B6] hover:bg-[#1889B6]"
            >
              <MessageSquareText size={15} strokeWidth={2.4} aria-hidden="true" />
              {labels.startCaseInquiry}
            </Link>
          </div>
        </div>

        <aside className="border-t border-[#E6EEEE] bg-[#F7FAFA] px-4 py-4 sm:px-5 lg:border-l lg:border-t-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2C2A28]">
            {labels.buyerDecisionPath}
          </p>
          <div className="mt-3 space-y-2">
            {routeSteps.map((step, index) => (
              <div key={step.label} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-none border border-[#D8E7E8] bg-white px-3 py-3">
                <span className="flex h-7 w-7 items-center justify-center bg-[#EAF6F8] text-xs font-black text-[#1889B6]">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-black uppercase tracking-[0.12em] text-[#2C2A28]">{step.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#6B6560]">{step.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] md:grid-cols-2 xl:grid-cols-4">
        {statItems.map(({ label, value, detail, Icon }) => (
          <div key={label} className="min-w-0 border-b border-[#E6EEEE] px-4 py-4 md:border-r xl:border-b-0 xl:last:border-r-0">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]" title={label}>{label}</p>
              <Icon size={16} strokeWidth={2.4} className="shrink-0 text-[#1889B6]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-black leading-none text-[#2C2A28]">{value}</p>
            <p className="mt-2 text-xs leading-5 text-[#6B6560]">{detail}</p>
          </div>
        ))}
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
  const labels = buildCaseListLabels(detailLabelsModule, lang)
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang)
  const heroTitle = moduleTitle(heroModule, lang)
  const heroDescription = moduleDescription(heroModule, lang)
  const showHero = heroModule?.is_visible !== false && (heroEyebrow || heroTitle || heroDescription)
  const typeFilterLabel = labels.typeFilter
  const tagFilterLabel = labels.tagsFilter
  const allTypeLabel = labels.allTypes
  const allTagLabel = labels.allTags
  const resetLabel = labels.reset
  const emptyLabel = labels.empty
  const openCaseLabel = labels.openCase
  const caseInquiryLabel = labels.caseInquiry
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
        <section
          className="border-b border-[#E36F2C]/10 bg-[#241F1B] px-4 pb-14 pt-32 sm:px-6"
          data-page-module="cases:hero"
          data-page-key="cases"
          data-module-key="hero"
        >
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
            labels={labels}
          />

          <CaseProofPathPanel
            cases={cases}
            filteredCases={filteredCases}
            labels={labels}
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
              const proofProfile = caseProofProfile(item)
              const proofTone = caseProofTone(proofProfile)
              const proofToneClass =
                proofTone === 'ready'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : proofTone === 'review'
                    ? 'border-[#B9DDE7] bg-[#EAF6F8] text-[#1889B6]'
                    : 'border-[#E5DED4] bg-[#FAF7F2] text-[#8A8580]'
              const proofLabel =
                proofTone === 'ready'
                  ? labels.proofReady
                  : proofTone === 'review'
                    ? labels.reviewProof
                    : labels.basicProof
              const facts = [
                { label: itemLabel(itemById(detailLabelsModule, 'fact-type'), lang), value: type },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-location'), lang), value: location },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-investment'), lang), value: item.investment_display },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-products'), lang), value: item.products },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-units'), lang), value: item.units_display },
                { label: itemLabel(itemById(detailLabelsModule, 'fact-area'), lang), value: item.area_display },
              ].filter((fact) => fact.label && fact.value)
              const featured = index === 0
              const caseHref = `/cases/${item.id}`
              const caseInquiryHref = `${caseHref}#case-inquiry`

              return (
                <article
                  key={item.id}
                  className={`group flex min-h-full flex-col overflow-hidden border border-[#E5DED4] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#E36F2C]/35 hover:shadow-[0_24px_60px_rgba(44,42,40,0.10)] ${featured ? 'xl:col-span-2' : ''}`}
                >
                  {item.cover_image_url ? (
                    <Link prefetch={false} href={caseHref} className="block">
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
                            <span
                              className="bg-[#E36F2C] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                            >
                              {type}
                            </span>
                          ) : null}
                        </div>
                        <div className="absolute right-4 top-4 flex max-w-[45%] flex-wrap justify-end gap-2">
                          <span className="bg-[#1889B6] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                            {proofProfile.imageCount} {labels.photosUnit}
                          </span>
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
                    </Link>
                  ) : (
                    <Link prefetch={false} href={caseHref} className={`block bg-[#E5DED4] ${featured ? 'aspect-[16/9] md:aspect-[21/10]' : 'aspect-[4/3]'}`} />
                  )}

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {name ? (
                      <h2 className={`${featured ? 'text-2xl sm:text-3xl' : 'text-xl'} font-black leading-tight text-[#2C2A28]`}>
                        <Link prefetch={false} href={caseHref} className="transition-colors hover:text-[#E36F2C]">
                          {name}
                        </Link>
                      </h2>
                    ) : null}
                    {location ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8580]">
                        {location}
                      </p>
                    ) : null}
                    {desc ? (
                      <p className={`mt-4 text-sm leading-6 text-[#6B6560] ${featured ? 'line-clamp-3' : 'line-clamp-2'}`}>{desc}</p>
                    ) : null}
                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#E5DED4] pt-4 sm:grid-cols-4">
                      <div className={`col-span-2 min-w-0 border px-3 py-2 sm:col-span-1 ${proofToneClass}`}>
                        <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em]" title={proofLabel}>{proofLabel}</span>
                        <span className="mt-1 block text-sm font-black leading-5">{proofProfile.proofScore}</span>
                      </div>
                      <div className="min-w-0 border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2 text-[#2C2A28]">
                        <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#8A8580]">{labels.gallery}</span>
                        <span className="mt-1 block text-sm font-black leading-5">{proofProfile.imageCount}</span>
                      </div>
                      <div className="min-w-0 border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2 text-[#2C2A28]">
                        <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#8A8580]">{labels.facts}</span>
                        <span className="mt-1 block text-sm font-black leading-5">{proofProfile.factCount}/5</span>
                      </div>
                      <div className="min-w-0 border border-[#D8E7E8] bg-[#F7FAFA] px-3 py-2 text-[#2C2A28]">
                        <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#8A8580]">{labels.products}</span>
                        <span className="mt-1 block text-sm font-black leading-5">{proofProfile.productsCount}</span>
                      </div>
                    </div>
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
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                      <Link
                        prefetch={false}
                        href={caseHref}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#E36F2C] transition-transform duration-300 hover:translate-x-1"
                      >
                        {openCaseLabel}
                        <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                      </Link>
                      <Link
                        prefetch={false}
                        href={caseInquiryHref}
                        data-analytics-cta="true"
                        className="inline-flex min-h-10 items-center justify-center border border-[#2C2A28] bg-[#2C2A28] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-[#E36F2C] hover:bg-[#E36F2C]"
                      >
                        {caseInquiryLabel}
                      </Link>
                    </div>
                  </div>
                </article>
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
