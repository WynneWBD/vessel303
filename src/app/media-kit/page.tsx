'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function MediaKitPage() {
  const t = useT();
  const [status, setStatus] = useState<Status>('idle');

  const useCaseOptions = [
    { value: 'press',    label: t(i18n.mediaKit.useCasePress) },
    { value: 'brand',    label: t(i18n.mediaKit.useCaseBrand) },
    { value: 'investor', label: t(i18n.mediaKit.useCaseInvestor) },
    { value: 'arch',     label: t(i18n.mediaKit.useCaseArch) },
    { value: 'other',    label: t(i18n.mediaKit.useCaseOther) },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name:    String(formData.get('name')    ?? '').trim(),
      email:   String(formData.get('email')   ?? '').trim(),
      phone:   String(formData.get('phone')   ?? '').trim(),
      company: String(formData.get('company') ?? '').trim(),
      country: String(formData.get('country') ?? '').trim(),
      useCase: String(formData.get('useCase') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
    };

    try {
      const res = await fetch('/api/media-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2ED]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#241F1B] pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-4">
            {t(i18n.mediaKit.heroLabel)}
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F5F2ED] leading-tight mb-6"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {t(i18n.mediaKit.heroTitle)}
          </h1>
          <p className="text-[#C4B9AB] text-sm sm:text-base leading-relaxed max-w-3xl">
            {t(i18n.mediaKit.heroSubtitle)}
          </p>
        </div>
      </section>

      {/* Form + Usage notes */}
      <section className="flex-1 py-16 px-6">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_320px] gap-12">
          {/* Form */}
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#2C2A28] mb-3"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {t(i18n.mediaKit.formHeading)}
            </h2>
            <p className="text-[#8A8580] text-sm mb-8 leading-relaxed">
              {t(i18n.mediaKit.formIntro)}
            </p>

            {status === 'success' ? (
              <div className="bg-white border border-[#E36F2C]/30 p-8">
                <p className="text-[#E36F2C] text-lg font-bold mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {t(i18n.mediaKit.successTitle)}
                </p>
                <p className="text-[#2C2A28]/70 text-sm leading-relaxed">
                  {t(i18n.mediaKit.successBody)}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={t(i18n.mediaKit.labelName)} name="name" required />
                  <Field label={t(i18n.mediaKit.labelEmail)} name="email" type="email" required />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={t(i18n.mediaKit.labelPhone)} name="phone" required />
                  <Field label={t(i18n.mediaKit.labelCompany)} name="company" required />
                </div>
                <Field label={t(i18n.mediaKit.labelCountry)} name="country" required />

                <div>
                  <label className="block text-[#2C2A28]/70 text-xs tracking-wider uppercase mb-2 font-medium">
                    {t(i18n.mediaKit.labelUseCase)} <span className="text-[#E36F2C]">*</span>
                  </label>
                  <select
                    name="useCase"
                    required
                    defaultValue=""
                    className="w-full border border-[#E5E0DA] bg-white px-4 py-3 text-sm text-[#2C2A28] focus:outline-none focus:border-[#E36F2C]"
                  >
                    <option value="" disabled>—</option>
                    {useCaseOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#2C2A28]/70 text-xs tracking-wider uppercase mb-2 font-medium">
                    {t(i18n.mediaKit.labelMessage)}
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    className="w-full border border-[#E5E0DA] bg-white px-4 py-3 text-sm text-[#2C2A28] focus:outline-none focus:border-[#E36F2C] resize-y"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-600 text-sm">{t(i18n.mediaKit.errorBody)}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="inline-block bg-[#E36F2C] text-white px-10 py-4 text-sm font-semibold tracking-wider hover:bg-[#C85A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? t(i18n.mediaKit.submitting) : t(i18n.mediaKit.submit)}
                </button>
              </form>
            )}
          </div>

          {/* Usage notes */}
          <aside className="bg-white border border-[#E5DED4] p-8 h-fit shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-4">
              {t(i18n.mediaKit.noteTitle)}
            </p>
            <ul className="space-y-4 text-[#6B625B] text-sm leading-relaxed">
              {[i18n.mediaKit.note1, i18n.mediaKit.note2, i18n.mediaKit.note3].map((k, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#E36F2C] shrink-0">·</span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[#2C2A28]/70 text-xs tracking-wider uppercase mb-2 font-medium">
        {label} {required && <span className="text-[#E36F2C]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full border border-[#E5E0DA] bg-white px-4 py-3 text-sm text-[#2C2A28] focus:outline-none focus:border-[#E36F2C]"
      />
    </div>
  );
}
