'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Boxes, Building2, Send } from 'lucide-react'
import ConversionInquiryForm, { type FormLabels } from '@/components/pages/ConversionInquiryForm'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  fetchPublicPageModules,
  itemById,
  itemLabel,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client'
import { buildContactHref, normalizeSiteHref } from '@/lib/site-links'

type InnovationRow = {
  id: number
  title_zh: string
  title_en: string
  summary_zh: string | null
  summary_en: string | null
  body_zh: string | null
  body_en: string | null
  cta_label_zh: string | null
  cta_label_en: string | null
  cta_href: string | null
  payload: Record<string, unknown>
}

type Section = {
  title_zh?: string
  title_en?: string
  body_zh?: string
  body_en?: string
}
type VisualEditAttrs = Record<string, string | number | undefined>

function getSections(payload: Record<string, unknown>): Section[] {
  const value = payload.sections
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Section => Boolean(item) && typeof item === 'object')
}

function innovationEditAttrs(row: InnovationRow, slug: string, options: {
  id: string
  field: string
  value?: string | null
  patchKey?: string | null
  input?: 'text' | 'textarea'
  maxLength?: number
  required?: boolean
  nullable?: boolean
}): VisualEditAttrs {
  const attrs: VisualEditAttrs = {
    'data-cms-edit-url': `/admin/content/innovation?search=${encodeURIComponent(slug)}#b9-content-workbench`,
    'data-cms-edit-kind': 'content',
    'data-cms-edit-title': '技术专题',
    'data-cms-edit-field': options.field,
    'data-cms-edit-id': `innovation-${row.id}-${options.id}`,
    'data-cms-edit-value': options.value ?? '',
    'data-cms-edit-input': options.input ?? 'text',
  }
  if (row.id > 0 && options.patchKey) {
    attrs['data-cms-edit-api-url'] = `/api/admin/site-content/${row.id}`
    attrs['data-cms-edit-patch-key'] = options.patchKey
  }
  if (options.maxLength) attrs['data-cms-edit-max-length'] = options.maxLength
  if (options.required) attrs['data-cms-edit-required'] = '1'
  if (options.nullable) attrs['data-cms-edit-nullable'] = '1'
  return attrs
}

export default function InnovationCmsBlock({
  slug,
  initialRow = null,
  initialPageModules = null,
}: {
  slug: 'viie' | 'vipc' | 'vols'
  initialRow?: InnovationRow | null
  initialPageModules?: PublicPageModule[] | null
}) {
  const { lang } = useLanguage()
  const [row, setRow] = useState<InnovationRow | null>(initialRow)
  const [pageModules, setPageModules] = useState<PublicPageModule[] | null>(initialPageModules)

  useEffect(() => {
    if (initialRow) return
    let cancelled = false
    fetch(`/api/site-content/innovation?slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((data) => {
        if (!cancelled) setRow(data.data ?? null)
      })
      .catch(() => {
        if (!cancelled) setRow(null)
      })
    return () => {
      cancelled = true
    }
  }, [initialRow, slug])

  useEffect(() => {
    if (Array.isArray(initialPageModules)) return
    const controller = new AbortController()
    fetchPublicPageModules('innovation', controller.signal)
      .then((modules) => setPageModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setPageModules(null)
      })
    return () => controller.abort()
  }, [initialPageModules])

  if (!row) return null

  const zh = lang === 'zh'
  const title = zh ? row.title_zh : row.title_en
  const summary = zh ? row.summary_zh : row.summary_en
  const body = zh ? row.body_zh : row.body_en
  const ctaLabel = zh ? row.cta_label_zh : row.cta_label_en
  const sections = getSections(row.payload)
  const primaryHref = normalizeSiteHref(row.cta_href, slug === 'vols' ? '/cases' : '/products')
  const contactHref = buildContactHref(`innovation:${slug}:contact_cta`)
  const routeCards = [
    {
      href: '/products',
      label: zh ? '产品路径' : 'Products',
      description: zh ? '系列、规格与型号详情' : 'Series, specs and model detail pages',
      Icon: Boxes,
    },
    {
      href: '/cases',
      label: zh ? '项目案例' : 'Cases',
      description: zh ? '已发布项目与应用场景' : 'Published projects and scenario references',
      Icon: Building2,
    },
    {
      href: contactHref,
      label: zh ? '提交需求' : 'Start Inquiry',
      description: zh ? '带专题来源进入咨询表单' : 'Continue with a source-aware inquiry path',
      Icon: Send,
    },
  ]
  const modules = moduleMap(pageModules)
  const inquiryModule = modules.get('inquiry-form') ?? null
  const fallbackLabels: FormLabels = zh
    ? {
        eyebrow: '项目咨询',
        name: '姓名',
        email: '邮箱',
        phone: '电话 / WhatsApp',
        country: '国家 / 地区',
        company: '公司 / 项目方',
        quantity: '预计数量',
        message: '项目需求',
        submit: '提交需求',
        submitting: '提交中...',
        success: '已收到需求，我们会尽快跟进。',
        error: '提交失败，请稍后重试或通过其他方式联系。',
        sourcePrefix: '来源',
        companyPrefix: '公司',
      }
    : {
        eyebrow: 'Project Inquiry',
        name: 'Name',
        email: 'Email',
        phone: 'Phone / WhatsApp',
        country: 'Country / Region',
        company: 'Company / Project Owner',
        quantity: 'Estimated Quantity',
        message: 'Project Requirements',
        submit: 'Send Inquiry',
        submitting: 'Sending...',
        success: 'Received. The team will follow up soon.',
        error: 'Submission failed. Please try again later or contact us another way.',
        sourcePrefix: 'Source',
        companyPrefix: 'Company',
      }
  const fallbackInquiryTitleZh = '提交技术专题需求'
  const fallbackInquiryTitleEn = 'Send Technology Project Requirements'
  const fallbackInquiryDescriptionZh = '填写国家、项目场景、数量和时间计划，团队将按技术专题来源跟进。'
  const fallbackInquiryDescriptionEn = 'Share country, project scenario, quantity, and schedule so the team can follow up with innovation context.'
  const fallbackInquiryTitle = zh ? fallbackInquiryTitleZh : fallbackInquiryTitleEn
  const inquiryTitle = moduleTitle(inquiryModule, lang) || fallbackInquiryTitle
  const inquiryType = itemLabel(itemById(inquiryModule, 'inquiry-type'), lang) || 'Innovation Inquiry'
  const formLabels: FormLabels = {
    eyebrow: itemLabel(itemById(inquiryModule, 'form-eyebrow'), lang) || fallbackLabels.eyebrow,
    name: itemLabel(itemById(inquiryModule, 'form-name'), lang) || fallbackLabels.name,
    email: itemLabel(itemById(inquiryModule, 'form-email'), lang) || fallbackLabels.email,
    phone: itemLabel(itemById(inquiryModule, 'form-phone'), lang) || fallbackLabels.phone,
    country: itemLabel(itemById(inquiryModule, 'form-country'), lang) || fallbackLabels.country,
    company: itemLabel(itemById(inquiryModule, 'form-company'), lang) || fallbackLabels.company,
    quantity: itemLabel(itemById(inquiryModule, 'form-quantity'), lang) || fallbackLabels.quantity,
    message: itemLabel(itemById(inquiryModule, 'form-message'), lang) || fallbackLabels.message,
    submit: itemLabel(itemById(inquiryModule, 'form-submit'), lang) || fallbackLabels.submit,
    submitting: itemLabel(itemById(inquiryModule, 'form-submitting'), lang) || fallbackLabels.submitting,
    success: itemLabel(itemById(inquiryModule, 'form-success'), lang) || fallbackLabels.success,
    error: itemLabel(itemById(inquiryModule, 'form-error'), lang) || fallbackLabels.error,
    sourcePrefix: itemLabel(itemById(inquiryModule, 'form-source-prefix'), lang) || fallbackLabels.sourcePrefix,
    companyPrefix: itemLabel(itemById(inquiryModule, 'form-company-prefix'), lang) || fallbackLabels.companyPrefix,
  }
  const titleAttrs = innovationEditAttrs(row, slug, {
    id: `title-${lang}`,
    field: zh ? '中文标题' : '英文标题',
    value: title,
    patchKey: zh ? 'title_zh' : 'title_en',
    maxLength: 240,
    required: true,
  })
  const summaryAttrs = innovationEditAttrs(row, slug, {
    id: `summary-${lang}`,
    field: zh ? '中文摘要' : '英文摘要',
    value: summary,
    patchKey: zh ? 'summary_zh' : 'summary_en',
    input: 'textarea',
    maxLength: 4000,
    nullable: true,
  })
  const bodyAttrs = innovationEditAttrs(row, slug, {
    id: `body-${lang}`,
    field: zh ? '中文正文' : '英文正文',
    value: body,
    patchKey: zh ? 'body_zh' : 'body_en',
    input: 'textarea',
    maxLength: 20000,
    nullable: true,
  })
  const ctaLabelAttrs = innovationEditAttrs(row, slug, {
    id: `cta-label-${lang}`,
    field: zh ? '中文按钮文字' : '英文按钮文字',
    value: ctaLabel,
    patchKey: zh ? 'cta_label_zh' : 'cta_label_en',
    maxLength: 120,
    nullable: true,
  })
  const ctaHrefAttrs = innovationEditAttrs(row, slug, {
    id: 'cta-href',
    field: zh ? '按钮链接' : 'CTA link',
    value: row.cta_href || primaryHref,
    patchKey: 'cta_href',
    maxLength: 1000,
    nullable: true,
  })

  return (
    <section className="border-y border-[#E5DED4] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B66A3A]">
              {zh ? '技术专题' : 'Innovation Topic'}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[#2C2A28] md:text-4xl" {...titleAttrs}>{title}</h1>
            {summary && <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6B625B]" {...summaryAttrs}>{summary}</p>}
            {body && <p className="mt-6 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#2C2A28]/75" {...bodyAttrs}>{body}</p>}
          </div>

          <nav
            aria-label={zh ? '技术专题转化路径' : 'Innovation conversion paths'}
            className="border border-[#E5DED4] bg-[#FAF7F2] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8C8176]">
              {zh ? '下一步' : 'Next paths'}
            </p>
            <div className="mt-4 grid gap-3">
              {routeCards.map((item) => {
                const Icon = item.Icon
                return (
                  <Link prefetch={false}
                    key={item.href}
                    href={item.href}
                    data-innovation-route-card="true"
                    data-visual-open-panel="innovation-route-card"
                    className="group flex min-h-[76px] items-center gap-3 border border-[#E5DED4] bg-white px-4 py-3 text-left transition hover:border-[#E36F2C] hover:text-[#C85A1F]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#E5DED4] text-[#B66A3A]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#2C2A28] group-hover:text-[#C85A1F]">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#6B625B]">{item.description}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#B66A3A] transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>

        {sections.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {sections.map((section, index) => {
              const sectionTitle = zh ? section.title_zh : section.title_en
              const sectionBody = zh ? section.body_zh : section.body_en
              if (!sectionTitle && !sectionBody) return null
              return (
                <article
                  key={`${sectionTitle ?? 'section'}-${index}`}
                  data-innovation-section-card="true"
                  className="border border-[#E5DED4] bg-[#FAF7F2] p-5"
                >
                  {sectionTitle && <h2 className="text-base font-bold text-[#2C2A28]">{sectionTitle}</h2>}
                  {sectionBody && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6B625B]">{sectionBody}</p>}
                </article>
              )
            })}
          </div>
        )}

        {ctaLabel && row.cta_href && (
          <Link prefetch={false}
            href={primaryHref}
            className="mt-8 inline-flex items-center gap-2 bg-[#E36F2C] px-6 py-3 text-sm font-semibold tracking-wider text-white transition hover:bg-[#C85A1F]"
            {...ctaHrefAttrs}
          >
            <span {...ctaLabelAttrs}>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}

        {inquiryTitle ? (
          <div className="mt-10" data-page-module="innovation:inquiry-form">
            <ConversionInquiryForm
              source={`innovation:${slug}:inquiry_form`}
              inquiryType={inquiryType}
              model={title}
              titleEn={inquiryModule?.title_en ?? fallbackInquiryTitleEn}
              titleZh={inquiryModule?.title_zh ?? fallbackInquiryTitleZh}
              descriptionEn={inquiryModule?.description_en ?? fallbackInquiryDescriptionEn}
              descriptionZh={inquiryModule?.description_zh ?? fallbackInquiryDescriptionZh}
              labels={formLabels}
              compact
              visualModuleId="innovation:inquiry-form"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
