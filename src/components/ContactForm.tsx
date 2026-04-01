'use client';

import { useState } from 'react';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

type Status = 'idle' | 'loading' | 'success' | 'error';

const INQUIRY_TYPES_DATA = [
  { value: '索取资料', key: i18n.form.inquiry1 },
  { value: '咨询报价', key: i18n.form.inquiry2 },
  { value: '合作代理', key: i18n.form.inquiry3 },
  { value: '定制服务', key: i18n.form.inquiry4 },
] as const;

const PROJECT_TYPES_DATA = [
  { value: '文旅度假营地', key: i18n.form.project1 },
  { value: '精品酒店民宿', key: i18n.form.project2 },
  { value: '商业空间', key: i18n.form.project3 },
  { value: '公共设施', key: i18n.form.project4 },
  { value: '其他', key: i18n.form.project5 },
];

const MODELS = [
  'E7 Gen6 · 38.8㎡',
  'E6 Gen6 · 29.6㎡',
  'E3 Gen6 · 19㎡',
  'V9 Gen6 · 38㎡',
  'V5 Gen5 · 24.8㎡',
  'S5 Gen5 · 29.6㎡',
];

export default function ContactForm() {
  const t = useT();
  const [form, setForm] = useState({
    inquiryType: '索取资料',
    name: '',
    phone: '',
    email: '',
    company: '',
    location: '',
    projectType: '',
    quantity: '',
    model: '',
    remarks: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [emailError, setEmailError] = useState('');

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'email') setEmailError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.email.trim()) {
      setEmailError(t(i18n.form.emailRequired));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setEmailError(t(i18n.form.emailInvalid));
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? t(i18n.form.submitFailed));
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg(t(i18n.form.networkError));
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full border-2 border-[#c9a84c] flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.form.successBadge)}</div>
        <h3 className="text-[#1A1A1A] text-xl font-black mb-3 tracking-wider">{t(i18n.form.successTitle)}</h3>
        <p className="text-[#666666] text-sm leading-relaxed max-w-sm tracking-wider">
          {t(i18n.form.successMsg)}
          {form.email && ' ' + t(i18n.form.successEmail)}
        </p>
        <button
          onClick={() => {
            setStatus('idle');
            setForm({
              inquiryType: '索取资料', name: '', phone: '', email: '',
              company: '', location: '', projectType: '', quantity: '', model: '', remarks: '',
            });
          }}
          className="mt-8 text-xs border border-[#D8D4CE] text-[#888888] hover:border-[#c9a84c]/40 hover:text-[#c9a84c] px-5 py-2 transition-all tracking-wider"
        >
          {t(i18n.form.resubmit)}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Inquiry type */}
      <div>
        <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.inquiryTypeLabel)}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INQUIRY_TYPES_DATA.map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="inquiryType"
                value={type.value}
                checked={form.inquiryType === type.value}
                onChange={() => set('inquiryType', type.value)}
                className="accent-[#c9a84c]"
              />
              <span className="text-sm text-[#555555] group-hover:text-[#333333] transition-colors tracking-wider">
                {t(type.key)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.nameLabel)}</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t(i18n.form.namePlaceholder)}
            className="w-full bg-white border border-[#D8D4CE] text-[#1A1A1A] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
        <div>
          <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.phoneLabel)}</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder={t(i18n.form.phonePlaceholder)}
            className="w-full bg-white border border-[#D8D4CE] text-[#1A1A1A] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
      </div>

      {/* Email + Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#666666] text-xs tracking-wider mb-2">
            {t(i18n.form.emailLabel)}
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder={t(i18n.form.emailPlaceholder)}
            className={`w-full bg-white border text-[#1A1A1A] text-sm px-4 py-3 focus:outline-none placeholder-white/20 tracking-wider ${emailError ? 'border-red-500/60 focus:border-red-500/80' : 'border-[#D8D4CE] focus:border-[#c9a84c]/60'}`}
          />
          {emailError && (
            <p className="text-red-400/80 text-xs tracking-wider mt-1">{emailError}</p>
          )}
        </div>
        <div>
          <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.companyLabel)}</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder={t(i18n.form.companyPlaceholder)}
            className="w-full bg-white border border-[#D8D4CE] text-[#1A1A1A] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
      </div>

      {/* Country + Project type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.locationLabel)}</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder={t(i18n.form.locationPlaceholder)}
            className="w-full bg-white border border-[#D8D4CE] text-[#1A1A1A] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
        <div>
          <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.projectTypeLabel)}</label>
          <select
            value={form.projectType}
            onChange={(e) => set('projectType', e.target.value)}
            className="w-full bg-white border border-[#D8D4CE] text-[#444444] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60"
          >
            <option value="">{t(i18n.form.projectTypePlaceholder)}</option>
            {PROJECT_TYPES_DATA.map((p) => <option key={p.value} value={p.value}>{t(p.key)}</option>)}
          </select>
        </div>
      </div>

      {/* Quantity + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.quantityLabel)}</label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            placeholder={t(i18n.form.quantityPlaceholder)}
            className="w-full bg-white border border-[#D8D4CE] text-[#1A1A1A] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
        <div>
          <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.modelLabel)}</label>
          <select
            value={form.model}
            onChange={(e) => set('model', e.target.value)}
            className="w-full bg-white border border-[#D8D4CE] text-[#444444] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60"
          >
            <option value="">{t(i18n.form.modelPlaceholder)}</option>
            {MODELS.map((m) => <option key={m}>{m}</option>)}
            <option value="暂未确定">{t(i18n.form.modelUnknown)}</option>
          </select>
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-[#666666] text-xs tracking-wider mb-2">{t(i18n.form.remarksLabel)}</label>
        <textarea
          rows={4}
          value={form.remarks}
          onChange={(e) => set('remarks', e.target.value)}
          placeholder={t(i18n.form.remarksPlaceholder)}
          className="w-full bg-white border border-[#D8D4CE] text-[#1A1A1A] text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 resize-none tracking-wider"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-400/80 text-xs tracking-wider border border-red-500/20 bg-red-500/5 px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#c9a84c] text-[#1C1A18] font-bold text-sm py-4 hover:bg-[#b8973b] disabled:opacity-60 transition-colors tracking-[0.2em] uppercase"
      >
        {status === 'loading' ? t(i18n.form.submitting) : t(i18n.form.submitBtn)}
      </button>
      <p className="text-[#BBBBBB] text-xs text-center tracking-wider">
        {t(i18n.form.submitNote)}
      </p>
    </form>
  );
}
