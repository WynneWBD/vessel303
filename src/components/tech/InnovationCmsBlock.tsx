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

function getSections(payload: Record<string, unknown>): Section[] {
  const value = payload.sections
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Section => Boolean(item) && typeof item === 'object')
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
  const inquiryTitle = moduleTitle(inquiryModule, lang)
  const inquiryType = itemLabel(itemById(inquiryModule, 'inquiry-type'), lang)
  const formLabels: FormLabels = {
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

  return (
    <section className="border-y border-[#E5DED4] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B66A3A]">
              {zh ? '技术专题' : 'Innovation Topic'}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[#2C2A28] md:text-4xl">{title}</h1>
            {summary && <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6B625B]">{summary}</p>}
            {body && <p className="mt-6 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#2C2A28]/75">{body}</p>}
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
                  <Link
                    key={item.href}
                    href={item.href}
                    data-innovation-route-card="true"
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
          <Link
            href={primaryHref}
            className="mt-8 inline-flex items-center gap-2 bg-[#E36F2C] px-6 py-3 text-sm font-semibold tracking-wider text-white transition hover:bg-[#C85A1F]"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}

        {inquiryTitle ? (
          <div className="mt-10">
            <ConversionInquiryForm
              source={`innovation:${slug}:inquiry_form`}
              inquiryType={inquiryType}
              model={title}
              titleEn={inquiryModule?.title_en ?? ''}
              titleZh={inquiryModule?.title_zh ?? ''}
              descriptionEn={inquiryModule?.description_en ?? ''}
              descriptionZh={inquiryModule?.description_zh ?? ''}
              labels={formLabels}
              compact
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
