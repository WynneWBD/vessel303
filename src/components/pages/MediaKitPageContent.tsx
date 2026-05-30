'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackFormSubmitSuccess } from '@/lib/site-analytics-client';
import { buildLeadSource } from '@/lib/site-links';
import {
  fetchPublicPageModules,
  itemById,
  itemLabel,
  moduleDescription,
  moduleMap,
  moduleTitle,
  visibleItems,
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

export default function MediaKitPageContent({
  initialResources = [],
  initialPageModules = null,
}: {
  initialResources?: MediaKitResource[]
  initialPageModules?: PublicPageModule[] | null
}) {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<Status>('idle');
  const [resources, setResources] = useState<MediaKitResource[]>(initialResources);
  const [pageModules, setPageModules] = useState<PublicPageModule[] | null>(initialPageModules);
  const modules = moduleMap(pageModules);
  const heroModule = modules.get('hero') ?? null;
  const formModule = modules.get('form') ?? heroModule;
  const heroEyebrow = itemLabel(itemById(heroModule, 'eyebrow'), lang);
  const heroTitle = moduleTitle(heroModule, lang);
  const heroDescription = moduleDescription(heroModule, lang);
  const formTitle = itemLabel(itemById(formModule, 'form-title'), lang) || moduleTitle(formModule, lang);
  const formDescription = itemLabel(itemById(formModule, 'form-description'), lang) || moduleDescription(formModule, lang);
  const resourceHeading = itemLabel(itemById(heroModule, 'resource-heading'), lang);
  const resourceCta = itemLabel(itemById(heroModule, 'resource-cta'), lang);
  const labels = {
    name: itemLabel(itemById(formModule, 'label-name'), lang),
    email: itemLabel(itemById(formModule, 'label-email'), lang),
    phone: itemLabel(itemById(formModule, 'label-phone'), lang),
    company: itemLabel(itemById(formModule, 'label-company'), lang),
    country: itemLabel(itemById(formModule, 'label-country'), lang),
    useCase: itemLabel(itemById(formModule, 'label-use-case'), lang),
    message: itemLabel(itemById(formModule, 'label-message'), lang),
    submit: itemLabel(itemById(formModule, 'submit'), lang),
    submitting: itemLabel(itemById(formModule, 'submitting'), lang),
    successTitle: itemLabel(itemById(formModule, 'success-title'), lang),
    successBody: itemLabel(itemById(formModule, 'success-body'), lang),
    errorBody: itemLabel(itemById(formModule, 'error-body'), lang),
  };
  const useCaseOptions = visibleItems(formModule)
    .filter((item) => item.id.startsWith('use-case-'))
    .map((item) => ({ value: item.value_en || item.value_zh || item.id.replace(/^use-case-/, ''), label: itemLabel(item, lang) }))
    .filter((option) => option.value && option.label);
  const canRenderForm = Boolean(
    formTitle &&
    labels.name &&
    labels.email &&
    labels.phone &&
    labels.company &&
    labels.country &&
    labels.useCase &&
    labels.submit &&
    useCaseOptions.length > 0,
  );

  useEffect(() => {
    if (Array.isArray(initialPageModules) && Array.isArray(initialResources)) return;
    let cancelled = false;
    if (!Array.isArray(initialPageModules)) {
      fetchPublicPageModules('media-kit')
        .then((modules) => {
          if (!cancelled) setPageModules(modules);
        })
        .catch(() => {
          if (!cancelled) setPageModules(null);
        });
    }
    if (!Array.isArray(initialResources)) {
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
    }
    return () => {
      cancelled = true;
    };
  }, [initialPageModules, initialResources]);

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
      trackFormSubmitSuccess(buildLeadSource('media_kit', payload.useCase, 'request_form'), formTitle);
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
          {canRenderForm ? (
            <div>
              {formTitle ? (
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#2C2A28] mb-3"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {formTitle}
                </h2>
              ) : null}
              {formDescription ? (
                <p className="text-[#8A8580] text-sm mb-8 leading-relaxed">
                  {formDescription}
                </p>
              ) : null}

              {status === 'success' && labels.successTitle ? (
                <div className="bg-white border border-[#E36F2C]/30 p-8">
                  <p className="text-[#E36F2C] text-lg font-bold mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {labels.successTitle}
                  </p>
                  {labels.successBody ? (
                    <p className="text-[#2C2A28]/70 text-sm leading-relaxed">
                      {labels.successBody}
                    </p>
                  ) : null}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={labels.name} name="name" required />
                    <Field label={labels.email} name="email" type="email" required />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={labels.phone} name="phone" required />
                    <Field label={labels.company} name="company" required />
                  </div>
                  <Field label={labels.country} name="country" required />

                  <div>
                    <label className="block text-[#2C2A28]/70 text-xs tracking-wider uppercase mb-2 font-medium">
                      {labels.useCase} <span className="text-[#E36F2C]">*</span>
                    </label>
                    <select
                      name="useCase"
                      required
                      defaultValue=""
                      className="w-full border border-[#E5E0DA] bg-white px-4 py-3 text-sm text-[#2C2A28] focus:outline-none focus:border-[#E36F2C]"
                    >
                      <option value="" disabled />
                      {useCaseOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {labels.message ? (
                    <div>
                      <label className="block text-[#2C2A28]/70 text-xs tracking-wider uppercase mb-2 font-medium">
                        {labels.message}
                      </label>
                      <textarea
                        name="message"
                        rows={4}
                        className="w-full border border-[#E5E0DA] bg-white px-4 py-3 text-sm text-[#2C2A28] focus:outline-none focus:border-[#E36F2C] resize-y"
                      />
                    </div>
                  ) : null}

                  {status === 'error' && labels.errorBody ? (
                    <p className="text-red-600 text-sm">{labels.errorBody}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex min-h-12 w-full items-center justify-center bg-[#E36F2C] px-10 py-4 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-[#C85A1F] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {status === 'submitting' && labels.submitting ? labels.submitting : labels.submit}
                  </button>
                </form>
              )}
            </div>
          ) : null}

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
