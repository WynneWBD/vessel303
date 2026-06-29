'use client'

import { type FormEvent, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { trackFormSubmitSuccess } from '@/lib/site-analytics-client'

type FormState = {
  name: string
  email: string
  phone: string
  company: string
  country: string
  quantity: string
  message: string
}

export type FormLabels = {
  eyebrow: string
  name: string
  email: string
  phone: string
  country: string
  company: string
  quantity: string
  message: string
  submit: string
  submitting: string
  success: string
  error: string
  sourcePrefix: string
  companyPrefix: string
}

type Props = {
  source: string
  inquiryType: string
  model?: string
  titleEn: string
  titleZh: string
  descriptionEn?: string
  descriptionZh?: string
  compact?: boolean
  labels?: FormLabels
  labelsZh?: FormLabels
  labelsEn?: FormLabels
  visualModuleId?: string
}

function visualLabelAttrs(itemId: string, lang: 'en' | 'zh') {
  return {
    'data-page-module-item': itemId,
    'data-page-module-field': lang === 'zh' ? 'label_zh' : 'label_en',
  }
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  country: '',
  quantity: '',
  message: '',
}

function hasFormLabels(labels: FormLabels | undefined): labels is FormLabels {
  if (!labels) return false
  return [
    labels.eyebrow,
    labels.name,
    labels.email,
    labels.phone,
    labels.country,
    labels.company,
    labels.quantity,
    labels.message,
    labels.submit,
    labels.submitting,
    labels.success,
    labels.error,
    labels.sourcePrefix,
    labels.companyPrefix,
  ].every((value) => value.trim())
}

function buildMessage(form: FormState, source: string, labels: FormLabels) {
  return [
    form.message.trim(),
    `${labels.sourcePrefix}: ${source}`,
    form.company.trim() ? `${labels.companyPrefix}: ${form.company.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function resolveSubmitSource(source: string) {
  if (typeof window === 'undefined') return source
  const urlSource = new URLSearchParams(window.location.search).get('source')
  if (!urlSource) return source
  const normalizedUrlSource = urlSource.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 160)
  const compactUrlSource = urlSource
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
  if (
    source.includes(urlSource) ||
    source.includes(normalizedUrlSource) ||
    source.includes(compactUrlSource)
  ) {
    return source
  }
  return `${source}:${normalizedUrlSource}`
}

export default function ConversionInquiryForm({
  source,
  inquiryType,
  model = '',
  titleEn,
  titleZh,
  descriptionEn,
  descriptionZh,
  compact = false,
  labels,
  labelsZh,
  labelsEn,
  visualModuleId,
}: Props) {
  const { lang } = useLanguage()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const title = lang === 'zh' ? titleZh : titleEn
  const description = lang === 'zh' ? descriptionZh : descriptionEn
  const activeLabels = lang === 'zh' ? labelsZh ?? labels : labelsEn ?? labels
  const titleField = lang === 'zh' ? 'title_zh' : 'title_en'
  const descriptionField = lang === 'zh' ? 'description_zh' : 'description_en'
  if (!hasFormLabels(activeLabels) || !title || !inquiryType.trim()) return null

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (status !== 'idle') {
      setStatus('idle')
      setError('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus('idle')
    setError('')

    try {
      const submitSource = resolveSubmitSource(source)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryType,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          location: form.country.trim(),
          quantity: form.quantity.trim(),
          model,
          projectType: inquiryType,
          remarks: buildMessage(form, submitSource, activeLabels),
          source: submitSource,
        }),
      })
      if (!res.ok) {
        throw new Error(activeLabels.error)
      }
      trackFormSubmitSuccess(submitSource, inquiryType)
      setForm(EMPTY_FORM)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : activeLabels.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`border border-[#DADDE1] bg-white ${compact ? 'p-5' : 'p-6 sm:p-7'}`}
      data-page-module={visualModuleId}
      data-page-module-field={titleField}
    >
      <div className="mb-5" data-page-module-field={titleField}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#147C94]" {...visualLabelAttrs('form-eyebrow', lang)}>{activeLabels.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-normal text-[#1F2A31]" data-page-module-field={titleField}>{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-[#5C6670]" data-page-module-field={descriptionField}>{description}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field required name="name" autoComplete="name" label={activeLabels.name} visualItemId="form-name" visualLang={lang} value={form.name} onChange={(value) => update('name', value)} />
        <Field required name="email" autoComplete="email" label={activeLabels.email} visualItemId="form-email" visualLang={lang} type="email" value={form.email} onChange={(value) => update('email', value)} />
        <Field required name="phone" autoComplete="tel" label={activeLabels.phone} visualItemId="form-phone" visualLang={lang} value={form.phone} onChange={(value) => update('phone', value)} />
        <Field name="country" autoComplete="country-name" label={activeLabels.country} visualItemId="form-country" visualLang={lang} value={form.country} onChange={(value) => update('country', value)} />
        <Field name="company" autoComplete="organization" label={activeLabels.company} visualItemId="form-company" visualLang={lang} value={form.company} onChange={(value) => update('company', value)} />
        <Field name="quantity" autoComplete="off" label={activeLabels.quantity} visualItemId="form-quantity" visualLang={lang} value={form.quantity} onChange={(value) => update('quantity', value)} />
      </div>

      <label className="mt-3 block text-sm font-semibold text-[#1F2A31]" {...visualLabelAttrs('form-message', lang)}>
        {activeLabels.message}
        <textarea
          name="message"
          aria-label={activeLabels.message}
          rows={4}
          value={form.message}
          onChange={(event) => update('message', event.target.value)}
          data-visual-open-panel="inquiry-message"
          className="mt-1 w-full resize-y border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex bg-[#E36F2C] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#C65F22] disabled:cursor-not-allowed disabled:opacity-60"
        {...visualLabelAttrs(submitting ? 'form-submitting' : 'form-submit', lang)}
      >
        {submitting ? activeLabels.submitting : activeLabels.submit}
      </button>
      {status === 'success' ? <p className="mt-3 text-sm font-semibold text-emerald-700">{activeLabels.success}</p> : null}
      {status === 'error' ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </form>
  )
}

function Field({
  name,
  label,
  type = 'text',
  autoComplete,
  required = false,
  visualItemId,
  visualLang,
  value,
  onChange,
}: {
  name: keyof FormState
  label: string
  type?: string
  autoComplete?: string
  required?: boolean
  visualItemId?: string
  visualLang?: 'en' | 'zh'
  value: string
  onChange: (value: string) => void
}) {
  if (!label) return null

  return (
    <label className="text-sm font-semibold text-[#1F2A31]" {...(visualItemId && visualLang ? visualLabelAttrs(visualItemId, visualLang) : {})}>
      {label} {required ? '*' : null}
      <input
        name={name}
        autoComplete={autoComplete}
        aria-label={label}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-visual-open-panel="inquiry-field"
        className="mt-1 w-full border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
      />
    </label>
  )
}
