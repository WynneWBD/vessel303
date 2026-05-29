'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { buildLeadSource } from '@/lib/site-links'

type CaseInquiryFormProps = {
  projectId: string
  projectName: string
  projectType: string
  projectLocation: string
  products: string
  zh: boolean
}

type FormState = {
  name: string
  email: string
  phone: string
  company: string
  country: string
  message: string
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  country: '',
  message: '',
}

function clean(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function buildRemarks(form: FormState, props: CaseInquiryFormProps) {
  return [
    `Project case: ${props.projectName} (${props.projectId})`,
    'Entry: case detail inquiry form',
    props.projectType ? `Project type: ${props.projectType}` : '',
    props.projectLocation ? `Reference location: ${props.projectLocation}` : '',
    props.products ? `Related products: ${props.products}` : '',
    form.message ? `Client message: ${form.message}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export default function CaseInquiryForm(props: CaseInquiryFormProps) {
  const { zh } = props
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [error, setError] = useState('')

  function patch(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (status === 'error') {
      setStatus('idle')
      setError('')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setError('')

    const projectType = clean(props.projectType) || 'Project Case'
    const products = clean(props.products)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryType: 'Project Case Inquiry',
          name: clean(form.name),
          email: clean(form.email),
          phone: clean(form.phone),
          company: clean(form.company),
          location: clean(form.country),
          projectType,
          quantity: '',
          model: products,
          remarks: buildRemarks(form, props),
          source: buildLeadSource('case_detail', props.projectId, 'inquiry_form'),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        setError(data.error || (zh ? '提交失败，请稍后再试。' : 'Submit failed. Please try again.'))
        setStatus('error')
        return
      }

      setStatus('success')
      setForm(INITIAL_FORM)
    } catch {
      setError(zh ? '网络连接失败，请稍后再试。' : 'Network error. Please try again.')
      setStatus('error')
    }
  }

  const submitLabel = status === 'submitting'
    ? (zh ? '提交中' : 'Sending')
    : (zh ? '提交案例询盘' : 'Send Case Inquiry')

  if (status === 'success') {
    return (
      <div className="border border-[#E5DED4] bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#E36F2C]" aria-hidden="true" />
        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#E36F2C]">
          {zh ? '已收到' : 'Received'}
        </div>
        <h3 className="mt-3 text-xl font-black tracking-wide text-[#2C2A28]">
          {zh ? '项目顾问会跟进这条案例询盘' : 'Our team will follow up on this case inquiry'}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6B6560]">
          {zh
            ? '我们会结合你关注的案例、场地条件和产品需求，继续沟通适合的项目方案。'
            : 'We will review the referenced case, site needs and product fit before replying.'}
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 border border-[#C4B9AB] px-5 py-2 text-xs font-semibold tracking-wider text-[#2C2A28] transition-colors hover:border-[#E36F2C] hover:text-[#E36F2C]"
        >
          {zh ? '继续提交' : 'Submit Another'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="border border-[#E5DED4] bg-white p-5 shadow-sm md:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label={zh ? '姓名' : 'Name'}
          required
          value={form.name}
          onChange={(value) => patch('name', value)}
          placeholder={zh ? '你的姓名' : 'Your name'}
        />
        <Field
          label={zh ? '邮箱' : 'Email'}
          type="email"
          required
          value={form.email}
          onChange={(value) => patch('email', value)}
          placeholder="name@example.com"
        />
        <Field
          label={zh ? '电话 / WhatsApp' : 'Phone / WhatsApp'}
          type="tel"
          required
          value={form.phone}
          onChange={(value) => patch('phone', value)}
          placeholder={zh ? '便于项目顾问联系' : 'For project follow-up'}
        />
        <Field
          label={zh ? '公司 / 机构' : 'Company'}
          value={form.company}
          onChange={(value) => patch('company', value)}
          placeholder={zh ? '选填' : 'Optional'}
        />
        <Field
          label={zh ? '项目所在国家 / 城市' : 'Project Country / City'}
          value={form.country}
          onChange={(value) => patch('country', value)}
          placeholder={zh ? '例如：泰国清迈' : 'e.g. Chiang Mai, Thailand'}
          className="sm:col-span-2"
        />
        <label className="sm:col-span-2">
          <span className="mb-2 block text-xs font-semibold tracking-wider text-[#6B6560]">
            {zh ? '项目需求' : 'Project Requirements'}
          </span>
          <textarea
            rows={4}
            value={form.message}
            onChange={(event) => patch('message', event.target.value)}
            placeholder={
              zh
                ? '场地规模、预计舱体数量、预算阶段或想参考本案例的部分'
                : 'Site scale, expected units, budget stage, or what you want to reference from this case'
            }
            className="w-full resize-none border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3 text-sm text-[#2C2A28] outline-none transition-colors placeholder:text-[#8A8580] focus:border-[#E36F2C]"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 bg-[#E36F2C] px-5 text-sm font-bold tracking-wider text-white transition-colors hover:bg-[#C85A1F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
        {submitLabel}
      </button>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  className?: string
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-semibold tracking-wider text-[#6B6560]">
        {label}
        {required && <span className="text-[#E36F2C]"> *</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3 text-sm text-[#2C2A28] outline-none transition-colors placeholder:text-[#8A8580] focus:border-[#E36F2C]"
      />
    </label>
  )
}
