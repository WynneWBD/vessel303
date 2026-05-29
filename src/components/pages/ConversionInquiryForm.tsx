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

type Props = {
  source: string
  inquiryType: string
  model?: string
  titleEn: string
  titleZh: string
  descriptionEn?: string
  descriptionZh?: string
  compact?: boolean
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

function buildMessage(form: FormState, source: string) {
  return [
    form.message.trim(),
    `Source: ${source}`,
    form.company.trim() ? `Company: ${form.company.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n')
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
}: Props) {
  const { lang } = useLanguage()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const title = lang === 'zh' ? titleZh : titleEn
  const description = lang === 'zh' ? descriptionZh : descriptionEn

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
          remarks: buildMessage(form, source),
          source,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'Submit failed')
      }
      trackFormSubmitSuccess(source, inquiryType)
      setForm(EMPTY_FORM)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`border border-[#DADDE1] bg-white ${compact ? 'p-5' : 'p-6 sm:p-7'}`}
    >
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#147C94]">
          {lang === 'zh' ? '项目咨询' : 'Inquiry'}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-normal text-[#1F2A31]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-[#5C6670]">{description}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#1F2A31]">
          {lang === 'zh' ? '姓名' : 'Name'} *
          <input
            required
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            className="mt-1 w-full border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
          />
        </label>
        <label className="text-sm font-semibold text-[#1F2A31]">
          Email *
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            className="mt-1 w-full border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
          />
        </label>
        <label className="text-sm font-semibold text-[#1F2A31]">
          Phone / WhatsApp *
          <input
            required
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
            className="mt-1 w-full border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
          />
        </label>
        <label className="text-sm font-semibold text-[#1F2A31]">
          {lang === 'zh' ? '国家/地区' : 'Country / Region'}
          <input
            value={form.country}
            onChange={(event) => update('country', event.target.value)}
            className="mt-1 w-full border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
          />
        </label>
        <label className="text-sm font-semibold text-[#1F2A31]">
          {lang === 'zh' ? '公司' : 'Company'}
          <input
            value={form.company}
            onChange={(event) => update('company', event.target.value)}
            className="mt-1 w-full border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
          />
        </label>
        <label className="text-sm font-semibold text-[#1F2A31]">
          {lang === 'zh' ? '数量' : 'Quantity'}
          <input
            value={form.quantity}
            onChange={(event) => update('quantity', event.target.value)}
            className="mt-1 w-full border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm font-semibold text-[#1F2A31]">
        {lang === 'zh' ? '需求说明' : 'Message'}
        <textarea
          rows={4}
          value={form.message}
          onChange={(event) => update('message', event.target.value)}
          className="mt-1 w-full resize-y border border-[#DADDE1] px-3 py-2 text-sm font-normal outline-none focus:border-[#147C94]"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex bg-[#E36F2C] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#C65F22] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (lang === 'zh' ? '提交中...' : 'Submitting...') : lang === 'zh' ? '提交咨询' : 'Submit Inquiry'}
      </button>
      {status === 'success' ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          {lang === 'zh' ? '已提交，我们会尽快联系您。' : 'Submitted. Our team will contact you soon.'}
        </p>
      ) : null}
      {status === 'error' ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </form>
  )
}
