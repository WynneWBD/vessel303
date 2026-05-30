'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage, useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import { trackFormSubmitSuccess } from '@/lib/site-analytics-client';
import { buildLeadSource } from '@/lib/site-links';
import {
  fetchPublicPageModules,
  itemById,
  itemLabel,
  moduleDescription,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type MediaKitResource = {
  id: number;
  title_zh: string;
  title_en: string;
  summary_zh: string | null;
  summary_en: string | null;
  file_url: string | null;
  cta_label_zh: string | null;
  cta_label_en: string | null;
  cta_href: string | null;
};

export default function MediaKitPage() {
  const t = useT();
  const { lang } = useLanguage();
  const [status, setStatus] = useState<Status>('idle');
  const [resources, setResources] = useState<MediaKitResource[]>([]);
  const [pageModules, setPageModules] = useState<PublicPageModule[] | null>(null);
  const heroModule = moduleMap(pageModules).get('hero') ?? null;
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang);
  const heroTitle = moduleTitle(heroModule, lang);
  const heroDescription = moduleDescription(heroModule, lang);
  const formTitle = itemLabel(itemById(heroModule, 'form-title'), lang);
  const formDescription = itemLabel(itemById(heroModule, 'form-description'), lang);
  const resourceHeading = itemLabel(itemById(heroModule, 'resource-heading'), lang);
  const resourceCta = itemLabel(itemById(heroModule, 'resource-cta'), lang);

  const useCaseOptions = [
    { value: 'press',    label: t(i18n.mediaKit.useCasePress) },
    { value: 'brand',    label: t(i18n.mediaKit.useCaseBrand) },
    { value: 'investor', label: t(i18n.mediaKit.useCaseInvestor) },
    { value: 'arch',     label: t(i18n.mediaKit.useCaseArch) },
    { value: 'other',    label: t(i18n.mediaKit.useCaseOther) },
  ];

  useEffect(() => {
    let cancelled = false;
    fetchPublicPageModules('media-kit')
      .then((modules) => {
        if (!cancelled) setPageModules(modules);
      })
      .catch(() => {
        if (!cancelled) setPageModules(null);
      });
    fetch('/api/site-content/media-kit')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.data)) {
          setResources(data.data);
        }
      })
      .catch(() => {
        if (!cancelled) setResources([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      trackFormSubmitSuccess(buildLeadSource('media_kit', payload.useCase, 'request_form'), 'Media Kit Request');
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
      <section className="bg-[#241F1B] px-4 pb-12 pt-28 sm:px-6 sm:pb-16">
        <div className="max-w-5xl mx-auto">
          {heroEyebrow ? (
            <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-4">
              {heroEyebrow}
            </p>
          ) : null}
          {heroTitle ? (
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F5F2ED] leading-tight mb-6"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {heroTitle}
            </h1>
          ) : null}
          {heroDescription ? (
            <p className="text-[#C4B9AB] text-sm sm:text-base leading-relaxed max-w-3xl">
              {heroDescription}
            </p>
          ) : null}
        </div>
      </section>

      {/* Form + Usage notes */}
      <section className="flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
          {/* Form */}
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#2C2A28] mb-3"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {formTitle}
            </h2>
            <p className="text-[#8A8580] text-sm mb-8 leading-relaxed">
              {formDescription}
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
                  className="inline-flex min-h-12 w-full items-center justify-center bg-[#E36F2C] px-10 py-4 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-[#C85A1F] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {status === 'submitting' ? t(i18n.mediaKit.submitting) : t(i18n.mediaKit.submit)}
                </button>
              </form>
            )}
          </div>

          {/* Usage notes */}
          <aside className="space-y-5">
            {resources.length > 0 && (
              <section className="bg-white border border-[#E5DED4] p-8 h-fit shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
                <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-4">
                  {resourceHeading}
                </p>
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <article key={resource.id} className="border-b border-[#E5E0DA] pb-4 last:border-0 last:pb-0">
                      <h3 className="text-sm font-bold text-[#2C2A28]">{resource.title_en || resource.title_zh}</h3>
                      {(resource.summary_en || resource.summary_zh) && (
                        <p className="mt-2 text-xs leading-5 text-[#6B625B]">
                          {resource.summary_en || resource.summary_zh}
                        </p>
                      )}
                      {(resource.cta_href || resource.file_url) && (
                        <a
                          href={resource.cta_href || resource.file_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex text-xs font-semibold text-[#E36F2C] hover:text-[#C85A1F]"
                        >
                          {resource.cta_label_en || resourceCta || resource.title_en || resource.title_zh}
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

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
