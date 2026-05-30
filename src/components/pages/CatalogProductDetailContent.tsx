'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ConversionInquiryForm from '@/components/pages/ConversionInquiryForm';
import ProtectedImage from '@/components/ProtectedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogProductPublicHref } from '@/lib/product-public-routes';
import { buildContactHref } from '@/lib/site-links';
import type { ProductAttributeLabel } from '@/lib/product-catalog-db';
import type { CatalogProduct, CatalogCommercialTerms } from '@/lib/products';

interface Props {
  product: CatalogProduct;
  relatedProducts?: CatalogProduct[];
  attributeLabels?: ProductAttributeLabel[];
}

type DetailModule = NonNullable<CatalogProduct['detail_modules']>[number];
type DetailModuleItem = NonNullable<DetailModule['items_cn']>[number];

const TERM_FIELDS: Array<{
  key: string;
  zh: keyof CatalogCommercialTerms;
  en: keyof CatalogCommercialTerms;
}> = [
  { key: 'Delivery Method', zh: 'delivery_method_zh', en: 'delivery_method_en' },
  { key: 'Shipping Location', zh: 'shipping_location_zh', en: 'shipping_location_en' },
  { key: 'Payment Terms', zh: 'payment_terms_zh', en: 'payment_terms_en' },
  { key: 'Delivery Time', zh: 'delivery_time_zh', en: 'delivery_time_en' },
  { key: 'Electrical & Plumbing', zh: 'electrical_standard_zh', en: 'electrical_standard_en' },
  { key: 'Warranty Support', zh: 'warranty_support_zh', en: 'warranty_support_en' },
  { key: 'MOQ', zh: 'moq_zh', en: 'moq_en' },
];

function uniqueImages(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function hasText(value: string | undefined | null) {
  return Boolean(value?.trim());
}

function productHref(product: CatalogProduct) {
  return getCatalogProductPublicHref(product);
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#147C94]">{label}</p>
      <h2 className="mt-2 text-2xl font-black tracking-normal text-[#1F2A31]">{title}</h2>
    </div>
  );
}

function DetailModuleBlock({ module, lang, name }: { module: DetailModule; lang: 'en' | 'zh'; name: string }) {
  const title = lang === 'en' ? module.title_en : module.title_cn;
  const body = lang === 'en' ? module.body_en : module.body_cn;
  const items = lang === 'en' ? module.items_en ?? [] : module.items_cn ?? [];
  const images = uniqueImages([module.image_url, ...(module.images ?? [])]);
  if (!hasText(title) && !hasText(body) && items.length === 0 && images.length === 0) return null;

  return (
    <section className="rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
      {title ? <h3 className="text-lg font-bold text-[#1F2A31]">{title}</h3> : null}
      {body ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#5C6670]">{body}</p> : null}
      {items.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item: DetailModuleItem, index: number) => (
            <div key={`${item.title}-${index}`} className="rounded-md border border-[#ECEFF1] bg-[#F7F8F8] p-4">
              <p className="text-sm font-semibold text-[#1F2A31]">{item.title}</p>
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
                alt={`${name} detail ${index + 1}`}
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
  const name = lang === 'en' ? product.name_en : product.name_cn;
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

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#DADDE1] bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#65707A]">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-[#1F2A31]">{value}</p>
    </div>
  );
}

export default function CatalogProductDetailContent({
  product,
  relatedProducts = [],
  attributeLabels = [],
}: Props) {
  const { lang } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const name = lang === 'en' ? product.name_en : product.name_cn;
  const description = lang === 'en' ? product.description_en : product.description_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const keywords = (lang === 'en' ? product.keywords_en : product.keywords_zh) ?? [];
  const fallbackKeywords = lang === 'en' ? product.tags_en : product.tags_cn;
  const displayKeywords = keywords.length > 0 ? keywords : fallbackKeywords;
  const price = (lang === 'en' ? product.price_display_en : product.price_display_zh)
    || product.price_display_en
    || product.price_display_zh
    || 'Inquire for pricing';
  const terms = product.commercial_terms ?? {};
  const media = useMemo(() => uniqueImages([product.image, ...(product.gallery ?? [])]), [product.gallery, product.image]);
  const activeImage = media[activeImageIndex] ?? media[0] ?? product.image;
  const visibleModules = (product.detail_modules ?? [])
    .filter((module) => module.is_visible !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const termRows = TERM_FIELDS
    .map((field) => ({
      label: field.key,
      value: String((lang === 'en' ? terms[field.en] : terms[field.zh]) || terms[field.en] || terms[field.zh] || '').trim(),
    }))
    .filter((row) => row.value);
  const quickFacts = [
    { label: 'Size', value: product.size },
    { label: 'Series', value: `${product.productSeries} / ${product.gen}` },
    {
      label: 'Category',
      value: String((lang === 'en' ? product.category_title_en : product.category_title_zh)
        || product.category_title_en
        || product.category_title_zh
        || 'Product'),
    },
  ].filter((item) => hasText(item.value));
  const contactHref = buildContactHref(`product_detail:${product.id}:contact_cta`);
  const anchorItems = [
    { href: '#product-description', label: 'Product Description' },
    { href: '#classification', label: 'Classification' },
    { href: '#product-inquiry', label: 'Consult' },
  ];
  if (displayKeywords.length > 0) {
    anchorItems.splice(2, 0, { href: '#keywords', label: 'Keywords' });
  }
  if (relatedProducts.length > 0) {
    anchorItems.push({ href: '#related-products', label: 'Related Products' });
  }

  return (
    <main className="bg-[#F3F7F7] text-[#1F2A31]">
      <section className="border-b border-[#DADDE1] bg-[linear-gradient(180deg,#FFFFFF_0%,#F2F8F8_100%)] pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mb-6 text-xs text-[#65707A]">
            <Link href="/" className="hover:text-[#147C94]">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-[#147C94]">ALL Products</Link>
            <span className="mx-2">/</span>
            <span>{name}</span>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0">
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
                      aria-label={`View image ${index + 1}`}
                    >
                      <ProtectedImage src={src} alt={`${name} thumbnail ${index + 1}`} fill className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm lg:self-start">
              {badge ? <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#C65F22]">{badge}</p> : null}
              <h1 className="text-2xl font-black leading-tight tracking-normal text-[#1F2A31] break-words sm:text-3xl">{name}</h1>
              {description ? <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5C6670]">{description}</p> : null}
              {quickFacts.length > 0 ? (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {quickFacts.map((item) => (
                    <QuickFact key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              ) : null}
              {features.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {features.slice(0, 4).map((feature) => (
                    <span key={feature} className="rounded-full bg-[#EAF6F8] px-3 py-1 text-xs font-semibold text-[#147C94]">
                      {feature}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-5 border-t border-[#DADDE1] pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#65707A]">Price</p>
                <p className="mt-2 text-xl font-black text-[#C65F22]">{price}</p>
              </div>
              {termRows.length > 0 ? (
                <div className="mt-5 border-t border-[#DADDE1] pt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#65707A]">Business Terms</p>
                  <dl className="mt-3 space-y-2">
                    {termRows.map((row) => (
                      <div key={row.label} className="grid grid-cols-1 gap-1 rounded-md bg-[#F7F8F8] px-3 py-2 text-sm sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-3">
                        <dt className="text-[#65707A]">{row.label}</dt>
                        <dd className="font-semibold text-[#1F2A31]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <a
                  href="#product-inquiry"
                  className="bg-[#147C94] px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-[#0E6479]"
                >
                  Consult
                </a>
                <Link
                  href={contactHref}
                  className="border border-[#147C94]/35 px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.12em] text-[#147C94] hover:bg-[#EAF6F8]"
                >
                  Contact Us
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <nav className="sticky top-16 z-20 border-b border-[#DADDE1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {anchorItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 shrink-0 items-center border border-[#DADDE1] px-3 text-xs font-bold uppercase tracking-[0.1em] text-[#65707A] transition hover:border-[#147C94] hover:text-[#147C94]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0 space-y-8">
          <section id="product-description" className="scroll-mt-32 rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
            <SectionTitle label="Product Description" title={name} />
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

          {visibleModules.map((module) => (
            <DetailModuleBlock key={module.id} module={module} lang={lang} name={name} />
          ))}

          <section className="rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
            <SectionTitle label="Contact Us" title="Consult" />
            <p className="text-sm leading-7 text-[#5C6670]">
              Please send your project destination, quantity, configuration and delivery requirement. We will contact you as soon as possible.
            </p>
            <Link
              href={contactHref}
              className="mt-5 inline-flex bg-[#E36F2C] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-[#C65F22]"
            >
              Contact Us
            </Link>
          </section>

          <div id="product-inquiry" className="scroll-mt-28">
            <ConversionInquiryForm
              source={`product_detail:${product.id}:inquiry_form`}
              inquiryType="Product Inquiry"
              model={`${name} (${product.id})`}
              titleEn="Request a product quote"
              titleZh="提交产品咨询"
              descriptionEn="Share your destination, quantity, configuration, and delivery requirements so the team can follow up."
              descriptionZh="请填写项目地点、数量、配置和交付要求，团队会尽快跟进。"
            />
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div id="classification" className="scroll-mt-32 rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
            <SectionTitle label="Classification" title="Products" />
            <div className="space-y-2 text-sm">
              <Link href="/products" className="block text-[#147C94] hover:underline">ALL Products</Link>
              {product.category_title_en || product.category_title_zh ? (
                <p>{lang === 'en' ? product.category_title_en : product.category_title_zh}</p>
              ) : null}
              <p>{product.size}</p>
              <p>{product.productSeries} / {product.gen}</p>
              {attributeLabels.map((item) => (
                <p key={`${item.template_slug}-${item.option_slug}`}>
                  {lang === 'en' ? item.label_en : item.label_zh}
                </p>
              ))}
            </div>
          </div>

          {displayKeywords.length > 0 ? (
            <div id="keywords" className="scroll-mt-32 rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm">
              <SectionTitle label="Key words" title="Keywords" />
              <div className="flex flex-wrap gap-2">
                {displayKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-[#DADDE1] px-2.5 py-1 text-xs text-[#5C6670]">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      {relatedProducts.length > 0 ? (
        <section id="related-products" className="scroll-mt-28 border-t border-[#DADDE1] bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle label="Related Products" title="Related Products" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {relatedProducts.map((item) => (
                <RelatedCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
