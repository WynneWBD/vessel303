'use client'

import { useEffect, useState } from 'react'

type Language = 'en' | 'zh'

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
  lang,
}: {
  slug: 'viie' | 'vipc' | 'vols'
  lang: Language
}) {
  const [row, setRow] = useState<InnovationRow | null>(null)

  useEffect(() => {
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
  }, [slug])

  if (!row) return null

  const zh = lang === 'zh'
  const title = zh ? row.title_zh : row.title_en
  const summary = zh ? row.summary_zh : row.summary_en
  const body = zh ? row.body_zh : row.body_en
  const ctaLabel = zh ? row.cta_label_zh : row.cta_label_en
  const sections = getSections(row.payload)

  return (
    <section className="border-y border-[#E5DED4] bg-white">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#E36F2C]">
          CMS Update
        </p>
        <h1 className="text-3xl font-bold text-[#2C2A28] md:text-4xl">{title}</h1>
        {summary && <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6B625B]">{summary}</p>}
        {body && <p className="mt-6 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#2C2A28]/75">{body}</p>}

        {sections.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {sections.map((section, index) => {
              const sectionTitle = zh ? section.title_zh : section.title_en
              const sectionBody = zh ? section.body_zh : section.body_en
              if (!sectionTitle && !sectionBody) return null
              return (
                <article key={`${sectionTitle ?? 'section'}-${index}`} className="border border-[#E5DED4] bg-[#FAF7F2] p-5">
                  {sectionTitle && <h2 className="text-base font-bold text-[#2C2A28]">{sectionTitle}</h2>}
                  {sectionBody && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6B625B]">{sectionBody}</p>}
                </article>
              )
            })}
          </div>
        )}

        {ctaLabel && row.cta_href && (
          <a
            href={row.cta_href}
            className="mt-8 inline-flex bg-[#E36F2C] px-6 py-3 text-sm font-semibold tracking-wider text-white transition hover:bg-[#C85A1F]"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  )
}
