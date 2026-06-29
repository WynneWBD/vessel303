'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ImagePlus, Images, MapPin, MessageSquareText } from 'lucide-react'
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

function moduleLabel(pageModule: PublicPageModule | null, id: string, lang: 'en' | 'zh', en: string, zh: string) {
  return itemLabel(itemById(pageModule, id), lang) || (lang === 'zh' ? zh : en)
}

function visualLabelAttrs(itemId: string, lang: 'en' | 'zh') {
  return {
    'data-page-module': 'cases:detail-labels',
    'data-page-key': 'cases',
    'data-module-key': 'detail-labels',
    'data-page-module-item': itemId,
    'data-page-module-field': lang === 'zh' ? 'label_zh' : 'label_en',
  }
}

function visualOpenPanelAttrs(key: string) {
  return { 'data-visual-open-panel': key }
}

function inquiryFormLabelAttrs(itemId: string, lang: 'en' | 'zh') {
  return {
    'data-page-module': 'cases:inquiry-form',
    'data-page-key': 'cases',
    'data-module-key': 'inquiry-form',
    'data-page-module-item': itemId,
    'data-page-module-field': lang === 'zh' ? 'label_zh' : 'label_en',
  }
}

type CaseCmsEditOptions = {
  patchKey?: string
  input?: 'text' | 'textarea' | 'image'
  arrayIndex?: number
  arrayMode?: 'append'
  maxLength?: number
  required?: boolean
  nullable?: boolean
  value?: string | null
}

type EditableFact = {
  label: string
  value: string
  editAttrs?: Record<string, string>
}

function caseCmsEditAttrs(
  caseId: string,
  section: 'basic' | 'media' | 'content' | 'params' | 'publish-check' | 'global',
  field: string,
  targetId: string,
  options: CaseCmsEditOptions = {},
) {
  const attrs: Record<string, string> = {
    'data-cms-edit-kind': 'project',
    'data-cms-edit-title': '案例内容',
    'data-cms-edit-field': field,
    'data-cms-edit-url': `/admin/content/projects/${encodeURIComponent(caseId)}/edit#${section}`,
    'data-cms-edit-id': `project-${caseId}-${targetId}`,
  }

  if (options.patchKey) {
    attrs['data-cms-edit-api-url'] = `/api/admin/projects/${encodeURIComponent(caseId)}`
    attrs['data-cms-edit-patch-key'] = options.patchKey
    attrs['data-cms-edit-input'] = options.input ?? 'text'
  }
  if (options.arrayIndex != null) attrs['data-cms-edit-array-index'] = String(options.arrayIndex)
  if (options.arrayMode) attrs['data-cms-edit-array-mode'] = options.arrayMode
  if (options.maxLength != null) attrs['data-cms-edit-max-length'] = String(options.maxLength)
  if (options.required) attrs['data-cms-edit-required'] = '1'
  if (options.nullable) attrs['data-cms-edit-nullable'] = '1'
  if (options.value != null) attrs['data-cms-edit-value'] = options.value

  return attrs
}

function subscribeVisualDraftPreview() {
  return () => undefined
}

function getVisualDraftPreviewSnapshot() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visualDraft') === '1'
}

function getVisualDraftPreviewServerSnapshot() {
  return false
}

function useVisualDraftPreview() {
  return useSyncExternalStore(
    subscribeVisualDraftPreview,
    getVisualDraftPreviewSnapshot,
    getVisualDraftPreviewServerSnapshot,
  )
}

function caseImageEditAttrs(project: ProjectCaseRow, image: string | null | undefined, targetId: string) {
  const imageValue = text(image)
  const galleryIndex = imageValue && imageValue !== project.cover_image_url
    ? project.images.findIndex((item) => item === imageValue)
    : -1

  if (galleryIndex >= 0) {
    return caseCmsEditAttrs(project.id, 'media', '图库图片', targetId, {
      patchKey: 'images',
      input: 'image',
      arrayIndex: galleryIndex,
      maxLength: 500,
      required: true,
      value: imageValue,
    })
  }

  return caseCmsEditAttrs(project.id, 'media', '案例封面', targetId, {
    patchKey: 'cover_image_url',
    input: 'image',
    maxLength: 500,
    nullable: true,
    value: imageValue,
  })
}

function splitProducts(value: string | null | undefined) {
  return text(value)
    .split(/[·,，、/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function ProjectImage({
  src,
  alt,
  className,
  editAttrs,
}: {
  src: string | null | undefined
  alt: string
  className: string
  editAttrs?: Record<string, string>
}) {
  if (!src) return null
  return (
    <div className={`relative overflow-hidden bg-[#E5DED4] ${className}`} {...editAttrs}>
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
  facts: EditableFact[]
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
          {...fact.editAttrs}
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
  eyebrow,
  title,
  subtitle,
  snapshotTitle,
  proofTitle,
  actionTitle,
  actionItems,
  snapshotFacts,
  proofFacts,
  galleryHref,
  galleryLabel,
  inquiryHref,
  inquiryLabel,
  inquiryLabelAttrs,
  hasGallery,
  lang,
}: {
  eyebrow: string
  title: string
  subtitle: string
  snapshotTitle: string
  proofTitle: string
  actionTitle: string
  actionItems: string[]
  snapshotFacts: EditableFact[]
  proofFacts: EditableFact[]
  galleryHref: string
  galleryLabel: string
  inquiryHref: string
  inquiryLabel: string
  inquiryLabelAttrs: Record<string, string>
  hasGallery: boolean
  lang: 'en' | 'zh'
}) {
  const actionItemIds = ['detail-reading-step-1', 'detail-reading-step-2', 'detail-reading-step-3']

  return (
    <section
      className="border-b border-[#E5DED4] bg-white py-8 lg:py-10"
      data-case-decision-summary="true"
      data-page-module="cases:detail-labels"
      data-page-key="cases"
      data-module-key="detail-labels"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(260px,0.28fr)] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1889B6]" {...visualLabelAttrs('detail-decision-eyebrow', lang)}>
              {eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-[#2C2A28] sm:text-3xl" {...visualLabelAttrs('detail-decision-title', lang)}>{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6560]" {...visualLabelAttrs('detail-decision-subtitle', lang)}>{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {hasGallery ? (
              <a
                href={galleryHref}
                {...visualOpenPanelAttrs('case-gallery-anchor')}
                className="inline-flex min-h-10 items-center gap-2 border border-[#E5DED4] bg-[#FAF7F2] px-3 text-xs font-black uppercase tracking-[0.12em] text-[#2C2A28] transition-colors hover:border-[#E36F2C]/45"
                {...visualLabelAttrs('gallery-title', lang)}
              >
                <Images size={15} strokeWidth={2.4} aria-hidden="true" />
                {galleryLabel}
              </a>
            ) : null}
            <a
              href={inquiryHref}
              data-analytics-cta="true"
              {...visualOpenPanelAttrs('case-inquiry-anchor')}
              className="inline-flex min-h-10 items-center gap-2 border border-[#E36F2C] bg-[#E36F2C] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#C75D22]"
              {...inquiryLabelAttrs}
            >
              {inquiryLabel}
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="border border-[#E5DED4] bg-[#FAF7F2] p-4">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2C2A28]" {...visualLabelAttrs('detail-snapshot-title', lang)}>
              <MapPin size={15} strokeWidth={2.4} className="text-[#1889B6]" aria-hidden="true" />
              {snapshotTitle}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {snapshotFacts.map((fact) => (
                <div
                  key={`${fact.label}-${fact.value}`}
                  className="border border-[#E5DED4] bg-white px-3 py-2"
                  {...fact.editAttrs}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8580]">{fact.label}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#2C2A28]">{fact.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-[#E5DED4] bg-[#FAF7F2] p-4">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2C2A28]" {...visualLabelAttrs('detail-delivery-proof-title', lang)}>
              <CheckCircle2 size={15} strokeWidth={2.4} className="text-[#1889B6]" aria-hidden="true" />
              {proofTitle}
            </p>
            <div className="mt-4 grid gap-2">
              {proofFacts.map((fact) => (
                <div
                  key={`${fact.label}-${fact.value}`}
                  className="border border-[#E5DED4] bg-white px-3 py-2"
                  {...fact.editAttrs}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8580]">{fact.label}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#2C2A28]">{fact.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-[#E5DED4] bg-[#2C2A28] p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70" {...visualLabelAttrs('detail-reading-path-title', lang)}>{actionTitle}</p>
            <div className="mt-4 grid gap-3">
              {actionItems.map((item, index) => (
                <p key={item} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 text-sm leading-6 text-white/78">
                  <span className="text-lg font-black leading-6 text-[#E36F2C]">{String(index + 1).padStart(2, '0')}</span>
                  <span {...visualLabelAttrs(actionItemIds[index] ?? actionItemIds[0], lang)}>{item}</span>
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
  eyebrow,
  title,
  subtitle,
  proofPoints,
  metrics,
  galleryHref,
  inquiryHref,
  relatedHref,
  galleryLabel,
  inquiryLabel,
  inquiryLabelAttrs,
  relatedLabel,
  hasGallery,
  hasRelated,
  lang,
}: {
  eyebrow: string
  title: string
  subtitle: string
  proofPoints: string[]
  metrics: Array<{ label: string; value: string; detail: string; labelItemId: string; detailItemId: string }>
  galleryHref: string
  inquiryHref: string
  relatedHref: string
  galleryLabel: string
  inquiryLabel: string
  inquiryLabelAttrs: Record<string, string>
  relatedLabel: string
  hasGallery: boolean
  hasRelated: boolean
  lang: 'en' | 'zh'
}) {
  const proofPointIds = ['detail-inquiry-proof-point-1', 'detail-inquiry-proof-point-2', 'detail-inquiry-proof-point-3']

  return (
    <section
      id="case-inquiry-proof-bridge"
      className="border-b border-[#E5DED4] bg-white py-10 lg:py-12"
      data-page-module="cases:detail-labels"
      data-page-key="cases"
      data-module-key="detail-labels"
    >
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.74fr)_minmax(320px,0.26fr)] lg:px-8">
        <div className="border-l-4 border-[#1889B6] bg-[#FAF7F2] px-4 py-4 sm:px-5">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1889B6]" {...visualLabelAttrs('detail-inquiry-proof-eyebrow', lang)}>
            <MessageSquareText size={15} strokeWidth={2.4} aria-hidden="true" />
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#2C2A28] sm:text-3xl" {...visualLabelAttrs('detail-inquiry-proof-title', lang)}>{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6560]" {...visualLabelAttrs('detail-inquiry-proof-subtitle', lang)}>{subtitle}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {proofPoints.map((point, index) => (
              <div key={point} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border border-[#D8E7E8] bg-white px-3 py-3">
                <span className="flex h-8 w-8 items-center justify-center bg-[#EAF6F8] text-xs font-black text-[#1889B6]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-bold leading-6 text-[#2C2A28]" {...visualLabelAttrs(proofPointIds[index] ?? proofPointIds[0], lang)}>{point}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {hasGallery ? (
              <a
                href={galleryHref}
                {...visualOpenPanelAttrs('case-gallery-anchor')}
                className="inline-flex min-h-10 items-center gap-2 border border-[#D8E7E8] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#2C2A28] transition-colors hover:border-[#1889B6] hover:text-[#1889B6]"
                {...visualLabelAttrs('gallery-title', lang)}
              >
                <Images size={15} strokeWidth={2.4} aria-hidden="true" />
                {galleryLabel}
              </a>
            ) : null}
            {hasRelated ? (
              <a
                href={relatedHref}
                {...visualOpenPanelAttrs('case-related-anchor')}
                className="inline-flex min-h-10 items-center gap-2 border border-[#D8E7E8] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#2C2A28] transition-colors hover:border-[#1889B6] hover:text-[#1889B6]"
                {...visualLabelAttrs('related-title', lang)}
              >
                {relatedLabel}
              </a>
            ) : null}
            <a
              href={inquiryHref}
              data-analytics-cta="true"
              {...visualOpenPanelAttrs('case-inquiry-anchor')}
              className="inline-flex min-h-10 items-center gap-2 border border-[#E36F2C] bg-[#E36F2C] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#C75D22]"
              {...inquiryLabelAttrs}
            >
              {inquiryLabel}
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </a>
          </div>
        </div>

        <aside className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0 border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8580]" title={metric.label} {...visualLabelAttrs(metric.labelItemId, lang)}>{metric.label}</p>
              <p className="mt-2 text-2xl font-black leading-none text-[#2C2A28]">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 text-[#6B6560]" {...visualLabelAttrs(metric.detailItemId, lang)}>{metric.detail}</p>
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
  const visualDraft = useVisualDraftPreview()
  const zh = lang === 'zh'
  const name = localizedText(zh, project.name_zh, project.name_en)
  const location = localizedText(zh, project.location_zh, project.location_en)
  const type = localizedText(zh, project.project_type_zh, project.project_type_en)
  const description = localizedText(zh, project.description_zh, project.description_en)
  const descriptionFallback = lang === 'zh' ? '添加案例简介' : 'Add case summary'
  const tags = localizedList(zh, project.tags_zh, project.tags_en)
  const namePatchKey = lang === 'zh' ? 'name_zh' : 'name_en'
  const locationPatchKey = lang === 'zh' ? 'location_zh' : 'location_en'
  const typePatchKey = lang === 'zh' ? 'project_type_zh' : 'project_type_en'
  const descriptionPatchKey = lang === 'zh' ? 'description_zh' : 'description_en'
  const tagPatchKey = lang === 'zh' ? 'tags_zh' : 'tags_en'
  const heroImage = project.cover_image_url || project.images[0] || null
  const gallery = [
    project.cover_image_url,
    ...project.images,
  ].filter((image, index, images): image is string => Boolean(image) && images.indexOf(image) === index)
  const modules = moduleMap(pageModules)
  const detailLabels = modules.get('detail-labels') ?? null
  const label = (id: string, en: string, zhText: string) => moduleLabel(detailLabels, id, lang, en, zhText)
  const locationLabel = label('fact-location', 'Location', '项目位置')
  const typeLabel = label('fact-type', 'Project Type', '项目类型')
  const areaLabel = label('fact-area', 'Project Area', '项目面积')
  const investmentLabel = label('fact-investment', 'Investment', '投资规模')
  const unitsLabel = label('fact-units', 'Units', '舱体数量')
  const productsLabel = label('fact-products', 'Products', '产品型号')
  const galleryStatLabel = label('gallery-title', 'Gallery', '图库')
  const factsStatLabel = label('detail-facts', 'Facts', '事实')
  const productsStatLabel = label('detail-products', 'Products', '产品')
  const galleryAssetsLabel = label('detail-gallery-assets', 'Gallery assets', '图库素材')
  const galleryProofLabel = label('detail-gallery-proof', 'Gallery proof', '图库证据')
  const galleryProofDetail = label('detail-gallery-proof-detail', 'Cover and site images', '封面与现场图片')
  const projectFactsLabel = label('detail-project-facts', 'Project facts', '项目事实')
  const projectFactsDetail = label('detail-project-facts-detail', 'Location, type, area, scale, and more', '地点、类型、面积、规模等')
  const productReferencesLabel = label('detail-product-references', 'Product references', '产品引用')
  const productReferencesDetail = label('detail-product-references-detail', 'Linked VESSEL models or series', '关联 VESSEL 型号/系列')
  const relatedCasesMetricDetail = label('detail-related-cases-detail', 'Compare adjacent project types', '继续横向比较项目类型')
  const decisionEyebrow = label('detail-decision-eyebrow', 'Case decision summary', '案例决策摘要')
  const decisionTitle = label('detail-decision-title', 'Validate project fit before opening gallery and inquiry.', '先完成项目适配判断，再进入图库和咨询。')
  const decisionSubtitle = label('detail-decision-subtitle', 'The case detail page surfaces location, type, scale, product references, and inquiry path before the longer story sections.', '案例详情页先把地点、类型、规模、产品引用和询盘路径集中展示，减少用户在长页面里反复查找。')
  const snapshotTitle = label('detail-snapshot-title', 'Project snapshot', '项目快照')
  const deliveryProofTitle = label('detail-delivery-proof-title', 'Delivery proof', '交付证据')
  const readingPathTitle = label('detail-reading-path-title', 'Reading path', '阅读路径')
  const readingStep1 = label('detail-reading-step-1', 'Check location, project type, area, and unit scale first.', '先核对项目地点、类型、面积和舱体规模。')
  const readingStep2 = label('detail-reading-step-2', 'Then review product references, investment context, and gallery evidence.', '再查看产品引用、投资信息和图库证据。')
  const readingStep3 = label('detail-reading-step-3', 'Finally open the case inquiry with project context.', '最后带着项目背景进入案例咨询表单。')
  const inquiryProofEyebrow = label('detail-inquiry-proof-eyebrow', 'Pre-inquiry proof chain', '询盘前证明链')
  const inquiryProofTitle = label('detail-inquiry-proof-title', 'Review proof, product references, and adjacent cases before inquiry.', '提交前再次核对项目证据、产品引用和相似案例。')
  const inquiryProofSubtitle = label('detail-inquiry-proof-subtitle', 'This bridge condenses existing case proof before the form so buyers enter with a clear project context.', '这一段把详情页已有证据收束到询盘前，帮助采购方带着明确项目背景进入表单。')
  const inquiryProofPoint1 = label('detail-inquiry-proof-point-1', 'Use gallery and project facts to confirm delivery credibility.', '先用图库和项目事实确认交付可信度。')
  const inquiryProofPoint2 = label('detail-inquiry-proof-point-2', 'Use product references to judge model, scale, and scenario fit.', '再用产品引用判断型号、规模和场景适配。')
  const inquiryProofPoint3 = label('detail-inquiry-proof-point-3', 'Enter the inquiry with a clear project context.', '最后带着明确项目背景进入案例咨询。')
  const submitCaseInquiryFallback = label('detail-submit-case-inquiry', 'Submit Case Inquiry', '提交案例咨询')
  const facts: EditableFact[] = [
    {
      label: locationLabel,
      value: location,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '项目地点', 'fact-location', {
        patchKey: locationPatchKey,
        maxLength: 220,
        required: true,
        value: location,
      }),
    },
    {
      label: typeLabel,
      value: type,
      editAttrs: caseCmsEditAttrs(project.id, 'basic', '项目类型', 'fact-type', {
        patchKey: typePatchKey,
        maxLength: 160,
        value: type,
      }),
    },
    {
      label: areaLabel,
      value: project.area_display,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '项目面积', 'fact-area', {
        patchKey: 'area_display',
        maxLength: 80,
        value: project.area_display,
      }),
    },
    {
      label: investmentLabel,
      value: project.investment_display,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '投资信息', 'fact-investment', {
        patchKey: 'investment_display',
        maxLength: 120,
        value: project.investment_display,
      }),
    },
    {
      label: unitsLabel,
      value: project.units_display,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '舱数', 'fact-units', {
        patchKey: 'units_display',
        maxLength: 80,
        value: project.units_display,
      }),
    },
    {
      label: productsLabel,
      value: project.products,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '关联产品', 'fact-products', {
        patchKey: 'products',
        maxLength: 260,
        value: project.products,
      }),
    },
  ].map((fact) => ({ ...fact, value: text(fact.value) })).filter((fact) => Boolean(fact.value))
  const products = splitProducts(project.products)
  const proofTitle = label('proof-title', 'Project proof', '项目证据')
  const galleryTitle = label('gallery-title', 'Project gallery', '项目图库')
  const relatedTitle = label('related-title', 'Related cases', '相关案例')
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
  const caseInquirySubmitLabel = inquiryLabels.submit || submitCaseInquiryFallback
  const caseInquirySubmitEditAttrs = inquiryLabels.submit
    ? inquiryFormLabelAttrs('form-submit', lang)
    : visualLabelAttrs('detail-submit-case-inquiry', lang)
  const heroGallery = gallery.filter((image) => image !== heroImage).slice(0, 3)
  const heroBackgroundEditAttrs = caseCmsEditAttrs(project.id, 'media', '案例封面', 'hero-background', {
    patchKey: 'cover_image_url',
    input: 'image',
    maxLength: 500,
    nullable: true,
    value: heroImage,
  })
  const heroTitleEditAttrs = caseCmsEditAttrs(project.id, 'basic', '案例标题', 'hero-name', {
    patchKey: namePatchKey,
    maxLength: 220,
    required: true,
    value: name,
  })
  const heroDescriptionEditAttrs = caseCmsEditAttrs(project.id, 'content', '案例简介', 'hero-description', {
    patchKey: descriptionPatchKey,
    input: 'textarea',
    maxLength: 6000,
    nullable: true,
    value: description,
  })
  const storyPanelFacts: EditableFact[] = facts.length > 0
    ? facts
    : tags.map((tag) => ({ label: '', value: tag }))
  const storyPanels = gallery.slice(0, 4).map((image, index) => ({
    image,
    fact: storyPanelFacts[index % Math.max(storyPanelFacts.length, 1)] ?? null,
  }))
  const snapshotFacts: EditableFact[] = [
    {
      label: locationLabel,
      value: location,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '项目地点', 'snapshot-location', {
        patchKey: locationPatchKey,
        maxLength: 220,
        required: true,
        value: location,
      }),
    },
    {
      label: typeLabel,
      value: type,
      editAttrs: caseCmsEditAttrs(project.id, 'basic', '项目类型', 'snapshot-type', {
        patchKey: typePatchKey,
        maxLength: 160,
        value: type,
      }),
    },
    {
      label: areaLabel,
      value: project.area_display,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '项目面积', 'snapshot-area', {
        patchKey: 'area_display',
        maxLength: 80,
        value: project.area_display,
      }),
    },
    {
      label: unitsLabel,
      value: project.units_display,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '舱数', 'snapshot-units', {
        patchKey: 'units_display',
        maxLength: 80,
        value: project.units_display,
      }),
    },
  ].map((fact) => ({ ...fact, value: text(fact.value) })).filter((fact) => Boolean(fact.value))
  const proofFacts: EditableFact[] = [
    {
      label: productsLabel,
      value: project.products,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '关联产品', 'proof-products', {
        patchKey: 'products',
        maxLength: 260,
        value: project.products,
      }),
    },
    {
      label: investmentLabel,
      value: project.investment_display,
      editAttrs: caseCmsEditAttrs(project.id, 'params', '投资信息', 'proof-investment', {
        patchKey: 'investment_display',
        maxLength: 120,
        value: project.investment_display,
      }),
    },
    { label: galleryAssetsLabel, value: gallery.length > 0 ? String(gallery.length) : '' },
  ].map((fact) => ({ ...fact, value: text(fact.value) })).filter((fact) => Boolean(fact.value))
  const inquiryProofMetrics = [
    {
      label: galleryProofLabel,
      value: gallery.length > 0 ? String(gallery.length) : '0',
      detail: galleryProofDetail,
      labelItemId: 'detail-gallery-proof',
      detailItemId: 'detail-gallery-proof-detail',
    },
    {
      label: projectFactsLabel,
      value: `${facts.length}/6`,
      detail: projectFactsDetail,
      labelItemId: 'detail-project-facts',
      detailItemId: 'detail-project-facts-detail',
    },
    {
      label: productReferencesLabel,
      value: products.length > 0 ? String(products.length) : '0',
      detail: productReferencesDetail,
      labelItemId: 'detail-product-references',
      detailItemId: 'detail-product-references-detail',
    },
    {
      label: relatedTitle,
      value: String(relatedCases.length),
      detail: relatedCasesMetricDetail,
      labelItemId: 'related-title',
      detailItemId: 'detail-related-cases-detail',
    },
  ]
  const inquiryProofPoints = [
    inquiryProofPoint1,
    inquiryProofPoint2,
    inquiryProofPoint3,
  ]

  if (!name) return null

  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      <section
        className="relative min-h-[720px] overflow-hidden bg-[#201B17] pt-20 text-white sm:pt-24"
        data-page-module="cases:detail-labels"
        data-page-key="cases"
        data-module-key="detail-labels"
      >
        {heroImage ? (
          <div
            className="absolute inset-0"
            {...heroBackgroundEditAttrs}
          >
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
        ) : visualDraft ? (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(227,111,44,0.22),transparent_28%),linear-gradient(135deg,#2C2A28_0%,#201B17_56%,#11100F_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(32,27,23,0.92)_0%,rgba(32,27,23,0.68)_48%,rgba(32,27,23,0.38)_100%)]" />
            <div
              className="pointer-events-auto absolute left-5 top-28 z-10 inline-flex items-center gap-2 border border-white/18 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/82 backdrop-blur sm:left-8 sm:top-32"
              {...heroBackgroundEditAttrs}
            >
              <ImagePlus size={16} strokeWidth={2.4} aria-hidden="true" />
              <span>添加案例封面</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(32,27,23,0)_0%,#201B17_92%)]" />
          </div>
        ) : null}
        <div className="relative z-10 mx-auto grid min-h-[640px] max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.58fr)] lg:px-8 lg:py-14">
          <div className="flex min-w-0 flex-col justify-end">
            {tags.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {tags.map((tag, tagIndex) => (
                  <span
                    key={tag}
                    className="border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/78 backdrop-blur"
                    {...caseCmsEditAttrs(project.id, 'content', '案例标签', `tag-${tagIndex}`, {
                      patchKey: tagPatchKey,
                      arrayIndex: tagIndex,
                      maxLength: 50,
                      required: true,
                      value: tag,
                    })}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <h1
              className="max-w-4xl text-4xl font-black leading-[1.02] tracking-wide text-white sm:text-5xl lg:text-7xl"
              {...heroTitleEditAttrs}
            >
              {name}
            </h1>
            {description || visualDraft ? (
              <p
                className="mt-5 max-w-2xl text-sm leading-7 text-white/76 sm:text-base sm:leading-8"
                {...heroDescriptionEditAttrs}
              >
                {description || descriptionFallback}
              </p>
            ) : null}

            {(inquiryLabels.submit || galleryTitle) ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {inquiryLabels.submit ? (
                  <a
                    href="#case-inquiry"
                    data-analytics-cta="true"
                    {...visualOpenPanelAttrs('case-inquiry-anchor')}
                    className="inline-flex min-h-12 items-center justify-center border border-white bg-white px-5 text-sm font-bold uppercase tracking-[0.12em] text-[#201B17] transition hover:bg-[#E36F2C] hover:text-white"
                    {...inquiryFormLabelAttrs('form-submit', lang)}
                  >
                    {inquiryLabels.submit}
                  </a>
                ) : null}
                {galleryTitle && gallery.length > 1 ? (
                  <a
                    href="#case-gallery"
                    {...visualOpenPanelAttrs('case-gallery-anchor')}
                    className="inline-flex min-h-12 items-center justify-center border border-white/36 px-5 text-sm font-bold uppercase tracking-[0.12em] text-white/82 transition hover:border-white hover:text-white"
                    {...visualLabelAttrs('gallery-title', lang)}
                  >
                    {galleryTitle}
                  </a>
                ) : null}
              </div>
            ) : null}
            <div className="mt-5 grid max-w-2xl grid-cols-3 gap-2">
              {[
                { label: galleryStatLabel, value: gallery.length },
                { label: factsStatLabel, value: facts.length },
                { label: productsStatLabel, value: products.length },
              ].map((item) => (
                <div key={item.label} className="border border-white/16 bg-white/10 px-3 py-2 backdrop-blur">
                  <p
                    className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-white/58"
                    {...visualLabelAttrs(
                      item.label === galleryStatLabel ? 'gallery-title' : item.label === factsStatLabel ? 'detail-facts' : 'detail-products',
                      lang,
                    )}
                  >
                    {item.label}
                  </p>
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
                    editAttrs={caseImageEditAttrs(project, image, `hero-gallery-${index}`)}
                  />
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {(snapshotFacts.length > 0 || proofFacts.length > 0) ? (
        <CaseDecisionSummary
          eyebrow={decisionEyebrow}
          title={decisionTitle}
          subtitle={decisionSubtitle}
          snapshotTitle={snapshotTitle}
          proofTitle={deliveryProofTitle}
          actionTitle={readingPathTitle}
          actionItems={[readingStep1, readingStep2, readingStep3]}
          snapshotFacts={snapshotFacts}
          proofFacts={proofFacts}
          galleryHref="#case-gallery"
          galleryLabel={galleryTitle}
          inquiryHref="#case-inquiry"
          inquiryLabel={caseInquirySubmitLabel}
          inquiryLabelAttrs={caseInquirySubmitEditAttrs}
          hasGallery={gallery.length > 1}
          lang={lang}
        />
      ) : null}

      {gallery.length > 1 ? (
        <section id="case-gallery" className="border-b border-[#E5DED4] bg-[#201B17] py-12 text-white lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {galleryTitle ? <h2 className="mb-6 text-2xl font-black tracking-wide text-white" {...visualLabelAttrs('gallery-title', lang)}>{galleryTitle}</h2> : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:grid-rows-2">
              {gallery.slice(0, 5).map((image, index) => (
                <ProjectImage
                  key={image}
                  src={image}
                  alt={`${name} ${index + 1}`}
                  className={`${index === 0 ? 'md:col-span-2 md:row-span-2' : ''} aspect-[4/3] w-full border border-white/12 bg-white/8`}
                  editAttrs={caseImageEditAttrs(project, image, `gallery-${index}`)}
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
                    editAttrs={caseImageEditAttrs(project, panel.image, `story-image-${index}`)}
                  />
                  {panel.fact ? (
                    <div
                      className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 p-4"
                      {...panel.fact.editAttrs}
                    >
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
              <h2 className="text-2xl font-black tracking-wide text-[#2C2A28] sm:text-3xl" {...visualLabelAttrs('proof-title', lang)}>{proofTitle}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {facts.map((fact, index) => (
                <article
                  key={`${fact.label}-${fact.value}`}
                  className="grid grid-cols-[52px_minmax(0,1fr)] gap-4 border border-[#E5DED4] bg-[#FAF7F2] p-4"
                  {...fact.editAttrs}
                >
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
          eyebrow={inquiryProofEyebrow}
          title={inquiryProofTitle}
          subtitle={inquiryProofSubtitle}
          proofPoints={inquiryProofPoints}
          metrics={inquiryProofMetrics}
          galleryHref="#case-gallery"
          inquiryHref="#case-inquiry"
          relatedHref="#case-related"
          galleryLabel={galleryTitle}
          inquiryLabel={caseInquirySubmitLabel}
          inquiryLabelAttrs={caseInquirySubmitEditAttrs}
          relatedLabel={relatedTitle}
          hasGallery={gallery.length > 1}
          hasRelated={relatedCases.length > 0}
          lang={lang}
        />
      ) : null}

      {inquiryTitle ? (
        <section
          id="case-inquiry"
          className="border-t border-[#E5DED4] bg-[#F5F2ED] py-14"
          data-page-module="cases:inquiry-form"
          data-page-key="cases"
          data-module-key="inquiry-form"
        >
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
              visualModuleId="cases:inquiry-form"
            />
          </div>
        </section>
      ) : null}

      {relatedCases.length > 0 ? (
        <section id="case-related" className="border-t border-[#E5DED4] bg-[#F5F2ED] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {relatedTitle ? <h2 className="mb-6 text-2xl font-black tracking-wide text-[#2C2A28]" {...visualLabelAttrs('related-title', lang)}>{relatedTitle}</h2> : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {relatedCases.map((item) => {
                const relatedName = zh ? item.name_zh || item.name_en : item.name_en || item.name_zh
                const relatedType = zh ? item.project_type_zh || item.project_type_en : item.project_type_en || item.project_type_zh
                const relatedLocation = zh ? item.location_zh || item.location_en : item.location_en || item.location_zh
                const relatedImage = item.cover_image_url || item.images[0] || null
                const relatedNamePatchKey = lang === 'zh' ? 'name_zh' : 'name_en'
                const relatedLocationPatchKey = lang === 'zh' ? 'location_zh' : 'location_en'
                const relatedTypePatchKey = lang === 'zh' ? 'project_type_zh' : 'project_type_en'
                if (!relatedName) return null

                return (
                  <Link prefetch={false}
                    key={item.id}
                    href={`/cases/${item.id}`}
                    className="group border border-[#E5DED4] bg-white transition-colors hover:border-[#E36F2C]/35"
                    {...caseCmsEditAttrs(item.id, 'basic', '案例标题', 'related-card-shell', {
                      patchKey: relatedNamePatchKey,
                      maxLength: 220,
                      required: true,
                      value: relatedName,
                    })}
                  >
                    <ProjectImage
                      src={relatedImage}
                      alt={relatedName}
                      className="aspect-[4/3] w-full border-b border-[#E5DED4]"
                      editAttrs={caseCmsEditAttrs(item.id, 'media', '案例封面', 'related-cover-image', {
                        patchKey: 'cover_image_url',
                        input: 'image',
                        maxLength: 500,
                        nullable: true,
                        value: relatedImage,
                      })}
                    />
                    <div className="p-5">
                      {relatedLocation ? (
                        <div
                          className="mb-2 text-[10px] tracking-wider text-[#8A8580]"
                          {...caseCmsEditAttrs(item.id, 'params', '项目地点', 'related-location', {
                            patchKey: relatedLocationPatchKey,
                            maxLength: 220,
                            required: true,
                            value: relatedLocation,
                          })}
                        >
                          {relatedLocation}
                        </div>
                      ) : null}
                      <h2
                        className="text-base font-black leading-6 tracking-wide text-[#2C2A28]"
                        {...caseCmsEditAttrs(item.id, 'basic', '案例标题', 'related-name', {
                          patchKey: relatedNamePatchKey,
                          maxLength: 220,
                          required: true,
                          value: relatedName,
                        })}
                      >
                        {relatedName}
                      </h2>
                      {relatedType ? (
                        <div
                          className="mt-2 text-xs leading-5 tracking-wider text-[#6B6560]"
                          {...caseCmsEditAttrs(item.id, 'basic', '项目类型', 'related-type', {
                            patchKey: relatedTypePatchKey,
                            maxLength: 160,
                            value: relatedType,
                          })}
                        >
                          {relatedType}
                        </div>
                      ) : null}
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
