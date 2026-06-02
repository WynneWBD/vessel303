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
type SpecItem = NonNullable<CatalogProduct['specs_en']>[number];

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

function isInternalHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

function localizedProductName(product: CatalogProduct, lang: 'en' | 'zh') {
  return lang === 'en' ? product.name_en || product.name_cn : product.name_cn || product.name_en;
}

function localizedSpecRows(product: CatalogProduct, lang: 'en' | 'zh') {
  return (lang === 'en' ? product.specs_en : product.specs_cn) ?? [];
}

function DetailModuleBlock({
  module,
  lang,
  name,
  anchorId,
}: {
  module: DetailModule;
  lang: 'en' | 'zh';
  name: string;
  anchorId?: string;
}) {
  const title = lang === 'en' ? module.title_en : module.title_cn;
  const body = lang === 'en' ? module.body_en : module.body_cn;
  const items = lang === 'en' ? module.items_en ?? [] : module.items_cn ?? [];
  const images = uniqueImages([module.image_url, ...(module.images ?? [])]);
  const linkItems = items.filter((item) => text(item.href));
  const textItems = items.filter((item) => !text(item.href));
  if (!text(title) && !text(body) && items.length === 0 && images.length === 0) return null;

  return (
    <section id={anchorId} className="scroll-mt-28 rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm sm:p-6">
      {title ? <h2 className="text-2xl font-black leading-tight text-[#1F2A31]">{title}</h2> : null}
      {body ? <p className="mt-3 whitespace-pre-line text-sm leading-8 text-[#5C6670]">{body}</p> : null}
      {linkItems.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {linkItems.map((item: DetailModuleItem, index: number) => {
            const href = text(item.href);
            const card = (
              <>
                {item.title ? <span className="block text-sm font-black text-[#1F2A31]">{item.title}</span> : null}
                {item.body ? <span className="mt-2 block text-sm leading-6 text-[#65707A]">{item.body}</span> : null}
              </>
            );
            return isInternalHref(href) ? (
              <Link
                key={`${item.title}-${index}`}
                href={href}
                className="group rounded-md border border-[#147C94]/20 bg-[#F2F8F8] p-4 transition hover:border-[#147C94]/60 hover:bg-white"
              >
                {card}
              </Link>
            ) : (
              <a
                key={`${item.title}-${index}`}
                href={href}
                target={/^https?:\/\//i.test(href) ? '_blank' : undefined}
                rel={/^https?:\/\//i.test(href) ? 'noopener noreferrer' : undefined}
                className="group rounded-md border border-[#147C94]/20 bg-[#F2F8F8] p-4 transition hover:border-[#147C94]/60 hover:bg-white"
              >
                {card}
              </a>
            );
          })}
        </div>
      ) : null}
      {textItems.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {textItems.map((item: DetailModuleItem, index: number) => {
            return (
              <div key={`${item.title}-${index}`} className="rounded-md border border-[#ECEFF1] bg-[#F7F8F8] p-4">
                {item.title ? <p className="text-sm font-semibold text-[#1F2A31]">{item.title}</p> : null}
                {item.body ? <p className="mt-2 text-sm leading-6 text-[#65707A]">{item.body}</p> : null}
              </div>
            );
          })}
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

function ProductVisualGallery({
  images,
  title,
  name,
}: {
  images: string[];
  title: string;
  name: string;
}) {
  if (images.length === 0) return null;
  const [primaryImage, ...secondaryImages] = images;

  return (
    <section id="product-gallery" className="scroll-mt-28 rounded-md border border-[#DADDE1] bg-white p-4 shadow-sm sm:p-5">
      {title ? <h2 className="mb-4 text-2xl font-black tracking-normal text-[#1F2A31]">{title}</h2> : null}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#EEF1F3] lg:aspect-[16/11]">
          <ProtectedImage
            src={primaryImage}
            alt={name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 58vw"
          />
        </div>
        {secondaryImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {secondaryImages.slice(0, 4).map((src, index) => (
              <div key={`${src}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#EEF1F3]">
                <ProtectedImage
                  src={src}
                  alt={`${name} ${index + 2}`}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 280px"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
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
  const specs = localizedSpecRows(product, lang);
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
  const specsTitle = itemLabel(itemById(uiLabels, 'specs-title'), lang);
  const descriptionTitle = itemLabel(itemById(uiLabels, 'description-title'), lang);
  const downloadsTitle = itemLabel(itemById(uiLabels, 'downloads-title'), lang);
  const keywordsTitle = itemLabel(itemById(uiLabels, 'keywords-title'), lang);
  const relatedTitle = itemLabel(itemById(uiLabels, 'related-title'), lang);
  const galleryTitle = itemLabel(itemById(uiLabels, 'gallery-title'), lang);
  const heroInquiryCta = itemLabel(itemById(uiLabels, 'hero-inquiry-cta'), lang);
  const allProductsLabel = itemLabel(itemById(uiLabels, 'all-products-label'), lang);
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
  const moduleAnchors = visibleModules
    .map((module, index) => {
      const label = text(lang === 'en' ? module.title_en : module.title_cn) || text(module.title_en) || text(module.title_cn);
      return label ? { href: `#product-module-${index}`, label } : null;
    })
    .filter((item): item is { href: string; label: string } => Boolean(item));
  const detailAnchors = [
    media.length > 1 && galleryTitle ? { href: '#product-gallery', label: galleryTitle } : null,
    (description || features.length > 0) && descriptionTitle ? { href: '#product-description', label: descriptionTitle } : null,
    specs.length > 0 && specsTitle ? { href: '#product-specifications', label: specsTitle } : null,
    ...moduleAnchors,
    relatedProducts.length > 0 && relatedTitle ? { href: '#related-products', label: relatedTitle } : null,
    inquiryTitle ? { href: '#product-inquiry', label: inquiryTitle } : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item));
  const actionLinks = [
    heroInquiryCta && inquiryTitle ? { href: '#product-inquiry', label: heroInquiryCta, tone: 'primary' } : null,
    allProductsLabel ? { href: '/products', label: allProductsLabel, tone: 'secondary' } : null,
  ].filter((item): item is { href: string; label: string; tone: 'primary' | 'secondary' } => Boolean(item));
  const hasMediaRail = media.length > 1;
  const heroGridClass = hasMediaRail
    ? 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,96px)_minmax(0,1fr)_400px] lg:items-start'
    : 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start';

  if (!name) return null;

  return (
    <main className="bg-[#F3F7F7] text-[#1F2A31]">
      <section className="border-b border-[#DADDE1] bg-[linear-gradient(180deg,#FFFFFF_0%,#F2F8F8_100%)] pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className={heroGridClass}>
            {hasMediaRail ? (
              <div className="hidden min-w-0 gap-2 lg:flex lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:pr-1">
                {media.map((src, index) => (
                  <button
                    key={`${src}-${index}-rail`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md border-2 bg-[#EEF1F3] transition ${
                      index === activeImageIndex ? 'border-[#147C94]' : 'border-[#DADDE1] opacity-75 hover:opacity-100'
                    }`}
                    aria-label={imageLabelPrefix ? `${imageLabelPrefix} ${index + 1}` : undefined}
                  >
                    <ProtectedImage src={src} alt={`${name} ${index + 1}`} fill className="object-cover" sizes="96px" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className={`min-w-0 ${hasMediaRail ? 'lg:col-start-2' : ''}`}>
              {activeImage ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[#DADDE1] bg-[#EEF1F3] shadow-sm lg:aspect-[5/4]">
                  <ProtectedImage
                    src={activeImage}
                    alt={name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
              ) : null}
              {media.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
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

            <aside className={`rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start ${hasMediaRail ? 'lg:col-start-3' : ''}`}>
              {badge ? <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#C65F22]">{badge}</p> : null}
              <h1 className="text-2xl font-black leading-tight tracking-normal text-[#1F2A31] break-words sm:text-3xl">{name}</h1>
              {facts.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {facts.map((item) => (
                    <span key={item} className="rounded-full border border-[#DADDE1] bg-white px-3 py-1.5 text-xs font-bold leading-5 text-[#1F2A31]">
                      {item}
                    </span>
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
              {heroInquiryCta && inquiryTitle ? (
                <a
                  href="#product-inquiry"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-[#147C94] px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#0F6477]"
                >
                  {heroInquiryCta}
                </a>
              ) : null}
              {termRows.length > 0 ? (
                <div className="mt-5 border-t border-[#DADDE1] pt-5">
                  <div className="grid grid-cols-1 gap-2">
                    {termRows.map((value, index) => (
                      <p key={`${value}-${index}`} className="rounded-md bg-[#F7F8F8] px-3 py-2 text-xs font-semibold leading-5 text-[#1F2A31]">
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

      {detailAnchors.length > 0 ? (
        <nav className="sticky top-16 z-20 border-b border-[#DADDE1] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex min-w-0 gap-2 overflow-x-auto">
              {detailAnchors.map((anchor) => (
                <a
                  key={anchor.href}
                  href={anchor.href}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-sm border border-[#DADDE1] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94]"
                >
                  {anchor.label}
                </a>
              ))}
            </div>
            {actionLinks.length > 0 ? (
              <div className="flex shrink-0 gap-2 overflow-x-auto lg:justify-end">
                {actionLinks.map((action) => {
                  const className = action.tone === 'primary'
                    ? 'inline-flex min-h-10 shrink-0 items-center justify-center rounded-sm bg-[#E36F2C] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]'
                    : 'inline-flex min-h-10 shrink-0 items-center justify-center rounded-sm border border-[#147C94]/35 bg-[#EAF6F8] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#147C94] transition hover:border-[#147C94] hover:bg-white';
                  return isInternalHref(action.href) ? (
                    <Link key={action.href} href={action.href} className={className}>
                      {action.label}
                    </Link>
                  ) : (
                    <a key={action.href} href={action.href} className={className}>
                      {action.label}
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
      ) : null}

      {(media.length > 1 || specs.length > 0 || description || features.length > 0 || visibleModules.length > 0 || keywords.length > 0) ? (
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div className="min-w-0 space-y-8">
            {media.length > 1 ? (
              <ProductVisualGallery images={media.slice(1, 7)} title={galleryTitle} name={name} />
            ) : null}

            {specs.length > 0 && specsTitle ? (
              <section id="product-specifications" className="scroll-mt-28 rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-5 text-2xl font-black tracking-normal text-[#1F2A31]">{specsTitle}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {specs.map((item: SpecItem) => (
                    <p key={`${item.label}-${item.value}`} className="rounded-md border border-[#ECEFF1] bg-[#F7F8F8] p-4 text-sm leading-6 text-[#1F2A31]">
                      {item.label ? <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#65707A]">{item.label}</span> : null}
                      <span className="font-bold">{item.value}</span>
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
            {(description || features.length > 0) ? (
              <section id="product-description" className="scroll-mt-28 rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-2xl font-black tracking-normal text-[#1F2A31]">{descriptionTitle || name}</h2>
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

            {visibleModules.map((module, index) => {
              const moduleHasLinks = ((lang === 'en' ? module.items_en : module.items_cn) ?? []).some((item) => text(item.href));
              return (
                <div key={module.id}>
                  {moduleHasLinks && downloadsTitle ? (
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#147C94]">{downloadsTitle}</p>
                  ) : null}
                  <DetailModuleBlock module={module} lang={lang} name={name} anchorId={`product-module-${index}`} />
                </div>
              );
            })}
          </div>

          {keywords.length > 0 ? (
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
                {keywordsTitle ? <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#65707A]">{keywordsTitle}</p> : null}
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
        <section id="related-products" className="scroll-mt-28 border-t border-[#DADDE1] bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {relatedTitle ? <h2 className="mb-5 text-2xl font-black text-[#1F2A31]">{relatedTitle}</h2> : null}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {relatedProducts.map((item) => (
                <div key={item.id} className="min-w-[220px] max-w-[260px] flex-1 sm:min-w-[240px] lg:min-w-[260px]">
                  <RelatedCard product={item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {inquiryTitle ? (
        <section id="product-inquiry" className="border-t border-[#DADDE1] bg-[#F3F7F7] py-10">
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
