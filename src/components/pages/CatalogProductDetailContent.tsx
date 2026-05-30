'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ProtectedImage from '@/components/ProtectedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogProductPublicHref } from '@/lib/product-public-routes';
import {
  itemById,
  itemLabel,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client';
import type { ProductAttributeLabel } from '@/lib/product-catalog-db';
import type { CatalogProduct, CatalogCommercialTerms } from '@/lib/products';
import ConversionInquiryForm, { type FormLabels } from './ConversionInquiryForm';

interface Props {
  product: CatalogProduct;
  relatedProducts?: CatalogProduct[];
  attributeLabels?: ProductAttributeLabel[];
  pageModules?: PublicPageModule[];
}

type DetailModule = NonNullable<CatalogProduct['detail_modules']>[number];
type DetailModuleItem = NonNullable<DetailModule['items_cn']>[number];

const TERM_FIELDS: Array<{
  zh: keyof CatalogCommercialTerms;
  en: keyof CatalogCommercialTerms;
}> = [
  { zh: 'delivery_method_zh', en: 'delivery_method_en' },
  { zh: 'shipping_location_zh', en: 'shipping_location_en' },
  { zh: 'payment_terms_zh', en: 'payment_terms_en' },
  { zh: 'delivery_time_zh', en: 'delivery_time_en' },
  { zh: 'electrical_standard_zh', en: 'electrical_standard_en' },
  { zh: 'warranty_support_zh', en: 'warranty_support_en' },
  { zh: 'moq_zh', en: 'moq_en' },
];

function uniqueImages(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function productHref(product: CatalogProduct) {
  return getCatalogProductPublicHref(product);
}

function text(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function localizedProductName(product: CatalogProduct, lang: 'en' | 'zh') {
  return lang === 'en' ? product.name_en || product.name_cn : product.name_cn || product.name_en;
}

function DetailModuleBlock({ module, lang, name }: { module: DetailModule; lang: 'en' | 'zh'; name: string }) {
  const title = lang === 'en' ? module.title_en : module.title_cn;
  const body = lang === 'en' ? module.body_en : module.body_cn;
  const items = lang === 'en' ? module.items_en ?? [] : module.items_cn ?? [];
  const images = uniqueImages([module.image_url, ...(module.images ?? [])]);
  if (!text(title) && !text(body) && items.length === 0 && images.length === 0) return null;

  return (
    <section className="rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
      {title ? <h2 className="text-xl font-bold text-[#1F2A31]">{title}</h2> : null}
      {body ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#5C6670]">{body}</p> : null}
      {items.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item: DetailModuleItem, index: number) => (
            <div key={`${item.title}-${index}`} className="rounded-md border border-[#ECEFF1] bg-[#F7F8F8] p-4">
              {item.title ? <p className="text-sm font-semibold text-[#1F2A31]">{item.title}</p> : null}
              {item.body ? <p className="mt-2 text-sm leading-6 text-[#65707A]">{item.body}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {images.slice(0, 4).map((src, index) => (
            <div key={`${src}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#EEF1F3]">
              <ProtectedImage
                src={src}
                alt={`${name} ${index + 1}`}
                fill
                loading="lazy"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RelatedCard({ product }: { product: CatalogProduct }) {
  const { lang } = useLanguage();
  const name = localizedProductName(product, lang);
  if (!name || !product.image) return null;
  return (
    <Link href={productHref(product)} className="group overflow-hidden rounded-md border border-[#DADDE1] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#147C94]/60">
      <span className="relative block aspect-[4/3] overflow-hidden bg-[#EEF1F3]">
        <ProtectedImage
          src={product.image}
          alt={name}
          fill
          loading="lazy"
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 220px"
        />
      </span>
      <span className="block p-3 text-sm font-semibold leading-snug text-[#1F2A31] break-words group-hover:text-[#147C94]">
        {name}
      </span>
    </Link>
  );
}

export default function CatalogProductDetailContent({
  product,
  relatedProducts = [],
  attributeLabels = [],
  pageModules = [],
}: Props) {
  const { lang } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const name = localizedProductName(product, lang);
  const description = lang === 'en' ? product.description_en || product.description_cn : product.description_cn || product.description_en;
  const badge = lang === 'en' ? product.badge_en || product.badge_cn : product.badge_cn || product.badge_en;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const keywords = (lang === 'en' ? product.keywords_en : product.keywords_zh) ?? [];
  const price = (lang === 'en' ? product.price_display_en : product.price_display_zh)
    || product.price_display_en
    || product.price_display_zh
    || '';
  const terms = product.commercial_terms ?? {};
  const media = useMemo(() => uniqueImages([product.image, ...(product.gallery ?? [])]), [product.gallery, product.image]);
  const activeImage = media[activeImageIndex] ?? media[0] ?? product.image;
  const visibleModules = (product.detail_modules ?? [])
    .filter((module) => module.is_visible !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const termRows = TERM_FIELDS
    .map((field) => String((lang === 'en' ? terms[field.en] : terms[field.zh]) || terms[field.en] || terms[field.zh] || '').trim())
    .filter(Boolean);
  const facts = [
    product.size,
    [product.productSeries, product.gen].filter(Boolean).join(' / '),
    lang === 'en' ? product.category_title_en || product.category_title_zh : product.category_title_zh || product.category_title_en,
    ...attributeLabels.map((item) => (lang === 'en' ? item.label_en : item.label_zh)),
  ].map(text).filter(Boolean);
  const modules = moduleMap(pageModules);
  const uiLabels = modules.get('ui-labels') ?? null;
  const inquiryModule = modules.get('inquiry-form') ?? null;
  const imageLabelPrefix = itemLabel(itemById(uiLabels, 'image-label-prefix'), lang);
  const inquiryLabels: FormLabels = {
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
  };
  const inquiryTitle = moduleTitle(inquiryModule, lang);

  if (!name) return null;

  return (
    <main className="bg-[#F3F7F7] text-[#1F2A31]">
      <section className="border-b border-[#DADDE1] bg-[linear-gradient(180deg,#FFFFFF_0%,#F2F8F8_100%)] pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0">
              {activeImage ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[#DADDE1] bg-[#EEF1F3] shadow-sm">
                  <ProtectedImage
                    src={activeImage}
                    alt={name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 62vw"
                  />
                </div>
              ) : null}
              {media.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {media.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
                        index === activeImageIndex ? 'border-[#147C94]' : 'border-[#DADDE1] opacity-70'
                      }`}
                      aria-label={imageLabelPrefix ? `${imageLabelPrefix} ${index + 1}` : undefined}
                    >
                      <ProtectedImage src={src} alt={`${name} ${index + 1}`} fill className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm lg:self-start">
              {badge ? <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#C65F22]">{badge}</p> : null}
              <h1 className="text-2xl font-black leading-tight tracking-normal text-[#1F2A31] break-words sm:text-3xl">{name}</h1>
              {description ? <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5C6670]">{description}</p> : null}
              {facts.length > 0 ? (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {facts.map((item) => (
                    <p key={item} className="rounded-md border border-[#DADDE1] bg-white px-3 py-2 text-sm font-bold leading-5 text-[#1F2A31]">
                      {item}
                    </p>
                  ))}
                </div>
              ) : null}
              {features.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <span key={feature} className="rounded-full bg-[#EAF6F8] px-3 py-1 text-xs font-semibold text-[#147C94]">
                      {feature}
                    </span>
                  ))}
                </div>
              ) : null}
              {price ? <p className="mt-5 border-t border-[#DADDE1] pt-5 text-xl font-black text-[#C65F22]">{price}</p> : null}
              {termRows.length > 0 ? (
                <div className="mt-5 border-t border-[#DADDE1] pt-5">
                  <div className="space-y-2">
                    {termRows.map((value, index) => (
                      <p key={`${value}-${index}`} className="rounded-md bg-[#F7F8F8] px-3 py-2 text-sm font-semibold text-[#1F2A31]">
                        {value}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      {(description || features.length > 0 || visibleModules.length > 0 || keywords.length > 0) ? (
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div className="min-w-0 space-y-8">
            {(description || features.length > 0) ? (
              <section className="rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-2xl font-black tracking-normal text-[#1F2A31]">{name}</h2>
                {description ? <p className="whitespace-pre-line text-sm leading-8 text-[#5C6670]">{description}</p> : null}
                {features.length > 0 ? (
                  <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {features.map((feature) => (
                      <li key={feature} className="rounded-md border border-[#ECEFF1] bg-[#F7F8F8] p-4 text-sm leading-6 text-[#1F2A31]">
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            {visibleModules.map((module) => (
              <DetailModuleBlock key={module.id} module={module} lang={lang} name={name} />
            ))}
          </div>

          {keywords.length > 0 ? (
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-[#DADDE1] px-2.5 py-1 text-xs text-[#5C6670]">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section className="border-t border-[#DADDE1] bg-white py-10">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6 md:grid-cols-4 lg:grid-cols-6 lg:px-8">
            {relatedProducts.map((item) => (
              <RelatedCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {inquiryTitle ? (
        <section className="border-t border-[#DADDE1] bg-[#F3F7F7] py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <ConversionInquiryForm
              source={`product_detail:${product.id}:inquiry_form`}
              inquiryType={itemLabel(itemById(inquiryModule, 'inquiry-type'), lang)}
              model={name}
              titleEn={inquiryModule?.title_en ?? ''}
              titleZh={inquiryModule?.title_zh ?? ''}
              descriptionEn={inquiryModule?.description_en ?? ''}
              descriptionZh={inquiryModule?.description_zh ?? ''}
              labels={inquiryLabels}
            />
          </div>
        </section>
      ) : null}
    </main>
  );
}
