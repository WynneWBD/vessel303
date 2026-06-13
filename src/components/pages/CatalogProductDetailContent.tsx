'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Layers3,
  MessageSquare,
  PackageCheck,
  Ruler,
  type LucideIcon,
} from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogProductPublicHref } from '@/lib/product-public-routes';
import { hasInternalPublicCopy, publicText } from '@/lib/product-public-content';
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
type DecisionMetric = {
  label: string;
  value: string;
  detail?: string;
  Icon: LucideIcon;
};

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

const HERO_IMAGE_SIZES_WITH_RAIL = '(max-width: 1024px) 100vw, (max-width: 1344px) calc(100vw - 624px), 720px';
const HERO_IMAGE_SIZES_WITHOUT_RAIL = '(max-width: 1024px) 100vw, (max-width: 1344px) calc(100vw - 496px), 848px';
const DETAIL_MODULE_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 460px';
const RESOURCE_MODULE_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 220px';
const DETAIL_GALLERY_PRIMARY_SIZES = '(max-width: 1024px) 100vw, 680px';
const HERO_DESKTOP_THUMBNAILS = 8;
const HERO_MOBILE_THUMBNAILS = 9;

function uniqueImages(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function productHref(product: CatalogProduct) {
  return getCatalogProductPublicHref(product);
}

function text(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function visibleDetailItems(items: DetailModuleItem[]) {
  return items.filter((item) => !hasInternalPublicCopy(item.title, item.body));
}

function moduleItemsForLanguage(module: DetailModule, lang: 'en' | 'zh') {
  const localizedItems = lang === 'en' ? module.items_en ?? [] : module.items_cn ?? [];
  const seen = new Set<string>();
  return visibleDetailItems([...localizedItems, ...(module.items ?? []), ...(module.links ?? [])]).filter((item) => {
    const key = [item.href ?? '', item.title ?? '', item.body ?? ''].join('\n');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isInternalHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

function thumbnailWindow<T>(items: T[], activeIndex: number, size: number) {
  if (items.length <= size) return { start: 0, items };
  const half = Math.floor(size / 2);
  const maxStart = Math.max(0, items.length - size);
  const start = Math.min(Math.max(activeIndex - half, 0), maxStart);
  return {
    start,
    items: items.slice(start, start + size),
  };
}

function isBuyerResourceModule(module: DetailModule) {
  const marker = [
    module.id,
    module.title_en,
    module.title_cn,
  ].map((value) => text(value).toLowerCase()).join(' ');
  return /buyer|download|resource|material/.test(marker);
}

function localizedProductName(product: CatalogProduct, lang: 'en' | 'zh') {
  return lang === 'en' ? product.name_en || product.name_cn : product.name_cn || product.name_en;
}

function localizedSpecRows(product: CatalogProduct, lang: 'en' | 'zh') {
  return (lang === 'en' ? product.specs_en : product.specs_cn) ?? [];
}

function fallbackLabel(lang: 'en' | 'zh', en: string, zh: string) {
  return lang === 'en' ? en : zh;
}

function productTypeLabel(productType: CatalogProduct['productType'], lang: 'en' | 'zh') {
  const labels: Record<CatalogProduct['productType'], { en: string; zh: string }> = {
    compact: { en: 'Compact model', zh: '紧凑型' },
    standard: { en: 'Standard model', zh: '标准型' },
    luxury: { en: 'Flagship model', zh: '旗舰型' },
  };
  return lang === 'en' ? labels[productType].en : labels[productType].zh;
}

function productAreaLabel(product: CatalogProduct) {
  return text(product.size) || (Number(product.area) > 0 ? `${product.area}㎡` : '');
}

function usableSpecs(specs: SpecItem[]) {
  return specs.filter((item) => text(item.label) && text(item.value));
}

function ProductDecisionSummary({
  product,
  lang,
  specs,
  features,
  termRows,
  mediaCount,
  factCount,
  relatedCount,
  resourceCount,
  price,
  specsTitle,
  inquiryTitle,
  inquiryCta,
}: {
  product: CatalogProduct;
  lang: 'en' | 'zh';
  specs: SpecItem[];
  features: string[];
  termRows: string[];
  mediaCount: number;
  factCount: number;
  relatedCount: number;
  resourceCount: number;
  price: string;
  specsTitle: string;
  inquiryTitle: string;
  inquiryCta: string;
}) {
  const usableSpecRows = usableSpecs(specs);
  const specPreview = usableSpecRows.slice(0, 6);
  const termPreview = termRows.slice(0, 3);
  const inquiryHref = inquiryTitle ? '#product-inquiry' : '/contact';
  const fitSignalCount = features.length + factCount;
  const metricRows: DecisionMetric[] = [
    {
      label: fallbackLabel(lang, 'Floor area', '面积'),
      value: productAreaLabel(product),
      detail: fallbackLabel(lang, 'Comparable model scale', '用于快速判断型号尺度'),
      Icon: Ruler,
    },
    {
      label: fallbackLabel(lang, 'Model system', '产品体系'),
      value: [product.productSeries, product.gen].filter(Boolean).join(' '),
      detail: fallbackLabel(lang, 'Series and generation', '系列与代际'),
      Icon: Layers3,
    },
    {
      label: fallbackLabel(lang, 'Configuration tier', '配置层级'),
      value: productTypeLabel(product.productType, lang),
      detail: fallbackLabel(lang, 'Catalog classification', '来自产品目录分类'),
      Icon: PackageCheck,
    },
    {
      label: fallbackLabel(lang, 'Media depth', '素材深度'),
      value: mediaCount > 1
        ? fallbackLabel(lang, `${mediaCount} images`, `${mediaCount} 张图片`)
        : fallbackLabel(lang, 'Primary image', '主图'),
      detail: fallbackLabel(lang, 'Gallery available for inspection', '用于首屏和图库查看'),
      Icon: ClipboardList,
    },
  ].filter((item) => text(item.value));
  const hasCommercialPanel = text(price) || termPreview.length > 0 || text(inquiryTitle);
  const bridgeRows = [
    {
      label: fallbackLabel(lang, 'Media proof', 'Media proof'),
      value: mediaCount > 1 ? `${mediaCount} ${fallbackLabel(lang, 'images', 'images')}` : fallbackLabel(lang, 'Primary image', 'Primary image'),
      detail: fallbackLabel(lang, 'Inspect the visual payload before asking for a quote.', 'Inspect the visual payload before asking for a quote.'),
      href: mediaCount > 1 ? '#product-gallery' : inquiryHref,
    },
    {
      label: fallbackLabel(lang, 'Specification proof', 'Specification proof'),
      value: usableSpecRows.length > 0 ? `${usableSpecRows.length} ${fallbackLabel(lang, 'specs', 'specs')}` : fallbackLabel(lang, 'Specs pending', 'Specs pending'),
      detail: fallbackLabel(lang, 'Confirm model scale, system and delivery fit.', 'Confirm model scale, system and delivery fit.'),
      href: usableSpecRows.length > 0 ? '#product-specifications' : inquiryHref,
    },
    {
      label: fallbackLabel(lang, 'Fit signals', 'Fit signals'),
      value: fitSignalCount > 0 ? `${fitSignalCount} ${fallbackLabel(lang, 'signals', 'signals')}` : fallbackLabel(lang, 'Fit pending', 'Fit pending'),
      detail: fallbackLabel(lang, 'Use tags, features and category facts to qualify the model.', 'Use tags, features and category facts to qualify the model.'),
      href: features.length > 0 ? '#product-description' : inquiryHref,
    },
    {
      label: fallbackLabel(lang, 'Buyer resources', 'Buyer resources'),
      value: resourceCount > 0 ? `${resourceCount} ${fallbackLabel(lang, 'modules', 'modules')}` : fallbackLabel(lang, 'No resource module', 'No resource module'),
      detail: fallbackLabel(lang, 'Check files, buyer notes or supporting modules when available.', 'Check files, buyer notes or supporting modules when available.'),
      href: resourceCount > 0 ? '#buyer-resources' : inquiryHref,
    },
    {
      label: fallbackLabel(lang, 'Related options', 'Related options'),
      value: relatedCount > 0 ? `${relatedCount} ${fallbackLabel(lang, 'models', 'models')}` : fallbackLabel(lang, 'Single model route', 'Single model route'),
      detail: fallbackLabel(lang, 'Compare nearby models before sending the request.', 'Compare nearby models before sending the request.'),
      href: relatedCount > 0 ? '#related-products' : inquiryHref,
    },
    {
      label: fallbackLabel(lang, 'Inquiry handoff', 'Inquiry handoff'),
      value: fallbackLabel(lang, 'Source ready', 'Source ready'),
      detail: fallbackLabel(lang, 'The product inquiry keeps this model as the lead source.', 'The product inquiry keeps this model as the lead source.'),
      href: inquiryHref,
    },
  ];
  if (metricRows.length === 0 && specPreview.length === 0 && features.length === 0 && !hasCommercialPanel) return null;

  return (
    <section className="border-b border-[#DADDE1] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.9fr)_300px] lg:px-8">
        <div className="border border-[#DADDE1] bg-[#F7F8F8] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#147C94]">
            {fallbackLabel(lang, 'Product Snapshot', '产品速览')}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#1F2A31]">
            {fallbackLabel(lang, 'Evaluate the model before scrolling', '先判断型号，再进入详情')}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {metricRows.map((item) => (
              <div key={item.label} className="min-h-[112px] border border-[#DADDE1] bg-white p-4">
                <div className="flex items-center gap-2 text-[#147C94]">
                  <item.Icon size={16} />
                  <p className="text-[11px] font-black uppercase tracking-[0.14em]">{item.label}</p>
                </div>
                <p className="mt-3 text-lg font-black leading-tight text-[#1F2A31] break-words">{item.value}</p>
                {item.detail ? <p className="mt-2 text-xs leading-5 text-[#65707A]">{item.detail}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#DADDE1] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#65707A]">
                {fallbackLabel(lang, 'Technical check', '技术参数')}
              </p>
              <h2 className="mt-2 text-xl font-black text-[#1F2A31]">{specsTitle}</h2>
            </div>
            {specPreview.length > 0 ? (
              <a
                href="#product-specifications"
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm border border-[#147C94]/35 px-3 text-xs font-black uppercase tracking-[0.12em] text-[#147C94] transition hover:border-[#147C94] hover:bg-[#F2F8F8]"
              >
                {fallbackLabel(lang, 'View all', '查看全部')}
                <ArrowRight size={14} />
              </a>
            ) : null}
          </div>
          {specPreview.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 border-t border-[#DADDE1] sm:grid-cols-2">
              {specPreview.map((item, index) => (
                <div key={`${item.label}-${item.value}-${index}`} className="border-b border-[#DADDE1] px-3 py-3 sm:border-r">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65707A]">{item.label}</p>
                  <p className="mt-1 text-sm font-black leading-6 text-[#1F2A31]">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[#65707A]">
              {fallbackLabel(lang, 'Technical parameters will appear here after the CMS fields are completed.', '补齐 CMS 技术参数后，这里会展示关键规格。')}
            </p>
          )}
          {features.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {features.slice(0, 4).map((feature, index) => (
                <span key={`${feature}-${index}`} className="rounded-full bg-[#EAF6F8] px-3 py-1 text-xs font-semibold text-[#147C94]">
                  {feature}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {hasCommercialPanel ? (
          <aside className="border border-[#1F2A31] bg-[#1F2A31] p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8FD5E1]">
              {fallbackLabel(lang, 'Inquiry path', '咨询入口')}
            </p>
            <h2 className="mt-2 text-xl font-black leading-tight text-white">{inquiryTitle}</h2>
            {price ? <p className="mt-4 border-t border-white/15 pt-4 text-lg font-black text-[#F0B083]">{price}</p> : null}
            {termPreview.length > 0 ? (
              <div className="mt-4 space-y-2">
                {termPreview.map((term, index) => (
                  <p key={`${term}-${index}`} className="rounded-sm bg-white/8 px-3 py-2 text-xs font-semibold leading-5 text-white/85">
                    {term}
                  </p>
                ))}
              </div>
            ) : null}
            {inquiryCta ? (
              <a
                href="#product-inquiry"
                data-analytics-cta="true"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#E36F2C] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]"
              >
                <MessageSquare size={15} />
                {inquiryCta}
              </a>
            ) : null}
          </aside>
        ) : null}
        <div className="border border-[#DADDE1] bg-[#F7F8F8] p-4 lg:col-span-3" data-product-proof-inquiry-bridge="true">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#147C94]">
                {fallbackLabel(lang, 'Proof-to-inquiry bridge', 'Proof-to-inquiry bridge')}
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight text-[#1F2A31]">
                {fallbackLabel(lang, 'Review proof, compare fit, then send the model inquiry.', 'Review proof, compare fit, then send the model inquiry.')}
              </h2>
            </div>
            {inquiryCta ? (
              <a
                href={inquiryHref}
                data-analytics-cta="true"
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 bg-[#E36F2C] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]"
              >
                {inquiryCta}
                <ArrowRight size={14} />
              </a>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
            {bridgeRows.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group flex min-h-[132px] flex-col justify-between border border-[#DADDE1] bg-white p-3 transition hover:border-[#147C94]/60 hover:bg-[#F2F8F8]"
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#65707A]">{item.label}</span>
                  <span className="mt-2 block text-base font-black leading-tight text-[#1F2A31]">{item.value}</span>
                  <span className="mt-2 block text-xs leading-5 text-[#65707A]">{item.detail}</span>
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#147C94]">
                  {fallbackLabel(lang, 'Open', 'Open')}
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
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
  const title = publicText(lang === 'en' ? module.title_en : module.title_cn);
  const body = publicText(lang === 'en' ? module.body_en : module.body_cn);
  const items = moduleItemsForLanguage(module, lang);
  const images = uniqueImages([module.image_url, ...(module.images ?? [])]);
  const linkItems = items.filter((item) => text(item.href));
  const textItems = items.filter((item) => !text(item.href) && (publicText(item.title) || publicText(item.body)));
  if (!text(title) && !text(body) && items.length === 0 && images.length === 0) return null;

  return (
    <section id={anchorId} className="scroll-mt-28 border-t border-[#DADDE1] py-8 sm:py-10">
      {title ? <h2 className="max-w-3xl text-3xl font-black leading-tight text-[#1F2A31]">{title}</h2> : null}
      {body ? <p className="mt-4 max-w-4xl whitespace-pre-line text-base leading-8 text-[#5C6670]">{body}</p> : null}
      {linkItems.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {linkItems.map((item: DetailModuleItem, index: number) => {
            const href = text(item.href);
            const itemTitle = publicText(item.title);
            const itemBody = publicText(item.body);
            const card = (
              <>
                {itemTitle ? <span className="block text-sm font-black uppercase tracking-[0.12em] text-[#1F2A31]">{itemTitle}</span> : null}
                {itemBody ? <span className="mt-3 block text-sm leading-6 text-[#65707A]">{itemBody}</span> : null}
              </>
            );
            return isInternalHref(href) ? (
              <Link prefetch={false}
                key={`${itemTitle || href}-${index}`}
                href={href}
                className="group border border-[#147C94]/20 bg-white p-5 transition hover:border-[#147C94]/60 hover:bg-[#F2F8F8]"
              >
                {card}
              </Link>
            ) : (
              <a
                key={`${itemTitle || href}-${index}`}
                href={href}
                target={/^https?:\/\//i.test(href) ? '_blank' : undefined}
                rel={/^https?:\/\//i.test(href) ? 'noopener noreferrer' : undefined}
                className="group border border-[#147C94]/20 bg-white p-5 transition hover:border-[#147C94]/60 hover:bg-[#F2F8F8]"
              >
                {card}
              </a>
            );
          })}
        </div>
      ) : null}
      {textItems.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {textItems.map((item: DetailModuleItem, index: number) => {
            const itemTitle = publicText(item.title);
            const itemBody = publicText(item.body);
            return (
              <div key={`${itemTitle}-${index}`} className="border-l-2 border-[#147C94] bg-white px-5 py-4">
                {itemTitle ? <p className="text-sm font-black uppercase tracking-[0.12em] text-[#1F2A31]">{itemTitle}</p> : null}
                {itemBody ? <p className="mt-2 text-sm leading-6 text-[#65707A]">{itemBody}</p> : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {images.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.slice(0, 4).map((src, index) => (
            <div key={`${src}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-[#EEF1F3]">
              <ProtectedImage
                src={src}
                alt={`${name} ${index + 1}`}
                fill
                loading="lazy"
                className="object-cover"
                sizes={DETAIL_MODULE_IMAGE_SIZES}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BuyerResourceHub({
  modules,
  lang,
  name,
  title,
}: {
  modules: DetailModule[];
  lang: 'en' | 'zh';
  name: string;
  title: string;
}) {
  if (modules.length === 0) return null;
  const hasContent = modules.some((module) => {
    const moduleTitleText = publicText(lang === 'en' ? module.title_en : module.title_cn);
    const moduleBodyText = publicText(lang === 'en' ? module.body_en : module.body_cn);
    const items = moduleItemsForLanguage(module, lang);
    const images = uniqueImages([module.image_url, ...(module.images ?? [])]);
    return text(moduleTitleText) || text(moduleBodyText) || items.length > 0 || images.length > 0;
  });
  if (!hasContent) return null;

  return (
    <section id="buyer-resources" className="scroll-mt-28 border-y border-[#DADDE1] bg-white py-8 sm:py-10">
      {title ? <h2 className="px-1 text-3xl font-black leading-tight text-[#1F2A31]">{title}</h2> : null}
      <div className={title ? 'mt-6 grid grid-cols-1 gap-4 px-1 lg:grid-cols-2' : 'grid grid-cols-1 gap-4 px-1 lg:grid-cols-2'}>
        {modules.map((module) => {
          const moduleTitleText = publicText(lang === 'en' ? module.title_en : module.title_cn);
          const moduleBodyText = publicText(lang === 'en' ? module.body_en : module.body_cn);
          const items = moduleItemsForLanguage(module, lang);
          const images = uniqueImages([module.image_url, ...(module.images ?? [])]);
          const linkItems = items.filter((item) => text(item.href));
          const textItems = items.filter((item) => !text(item.href) && (publicText(item.title) || publicText(item.body)));
          if (!text(moduleTitleText) && !text(moduleBodyText) && items.length === 0 && images.length === 0) return null;

          return (
            <div key={module.id} className="border border-[#DADDE1] bg-[#F7F8F8] p-5">
              {moduleTitleText ? <h3 className="text-base font-black uppercase leading-tight tracking-[0.12em] text-[#1F2A31]">{moduleTitleText}</h3> : null}
              {moduleBodyText ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#5C6670]">{moduleBodyText}</p> : null}
              {linkItems.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {linkItems.map((item: DetailModuleItem, index: number) => {
                    const href = text(item.href);
                    const itemTitle = publicText(item.title);
                    const itemBody = publicText(item.body);
                    const card = (
                      <>
                        {itemTitle ? <span className="block text-sm font-black text-[#1F2A31]">{itemTitle}</span> : null}
                        {itemBody ? <span className="mt-2 block text-sm leading-6 text-[#65707A]">{itemBody}</span> : null}
                      </>
                    );
                    const className = 'block border border-[#147C94]/20 bg-white p-4 transition hover:border-[#147C94]/60 hover:bg-[#F2F8F8]';
                    return isInternalHref(href) ? (
                      <Link prefetch={false} key={`${itemTitle || href}-${index}`} href={href} className={className}>
                        {card}
                      </Link>
                    ) : (
                      <a
                        key={`${itemTitle || href}-${index}`}
                        href={href}
                        target={/^https?:\/\//i.test(href) ? '_blank' : undefined}
                        rel={/^https?:\/\//i.test(href) ? 'noopener noreferrer' : undefined}
                        className={className}
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
                    const itemTitle = publicText(item.title);
                    const itemBody = publicText(item.body);
                    return (
                      <div key={`${itemTitle}-${index}`} className="border-l-2 border-[#147C94] bg-white px-4 py-3">
                        {itemTitle ? <p className="text-sm font-black text-[#1F2A31]">{itemTitle}</p> : null}
                        {itemBody ? <p className="mt-2 text-sm leading-6 text-[#65707A]">{itemBody}</p> : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {images.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {images.slice(0, 4).map((src, index) => (
                    <div key={`${src}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-[#EEF1F3]">
                      <ProtectedImage
                        src={src}
                        alt={`${name} ${index + 1}`}
                        fill
                        loading="lazy"
                        className="object-cover"
                        sizes={RESOURCE_MODULE_IMAGE_SIZES}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RelatedCard({ product }: { product: CatalogProduct }) {
  const { lang } = useLanguage();
  const name = localizedProductName(product, lang);
  if (!name || !product.image) return null;
  return (
    <Link prefetch={false} href={productHref(product)} className="group overflow-hidden border border-[#DADDE1] bg-white transition hover:-translate-y-0.5 hover:border-[#147C94]/60">
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
    <section id="product-gallery" className="scroll-mt-28 bg-[#1F1C19] p-4 text-white sm:p-5">
      {title ? <h2 className="mb-5 text-3xl font-black tracking-normal text-white">{title}</h2> : null}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#2A2521] lg:aspect-[16/10]">
          <ProtectedImage
            src={primaryImage}
            alt={name}
            fill
            loading="lazy"
            className="object-cover"
            sizes={DETAIL_GALLERY_PRIMARY_SIZES}
          />
        </div>
        {secondaryImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {secondaryImages.slice(0, 4).map((src, index) => (
              <div key={`${src}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-[#2A2521]">
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
  const terms = product.commercial_terms ?? {};
  const media = useMemo(() => uniqueImages([product.image, ...(product.gallery ?? [])]), [product.gallery, product.image]);
  const activeImage = media[activeImageIndex] ?? media[0] ?? product.image;
  const visibleModules = (product.detail_modules ?? [])
    .filter((module) => module.is_visible !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const resourceModules = visibleModules.filter(isBuyerResourceModule);
  const contentModules = visibleModules.filter((module) => !isBuyerResourceModule(module));
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
  const priceEmptyLabel = itemLabel(itemById(uiLabels, 'price-empty'), lang)
    || fallbackLabel(lang, 'Price on request', '价格请咨询');
  const price = (lang === 'en' ? product.price_display_en : product.price_display_zh)
    || product.price_display_en
    || product.price_display_zh
    || priceEmptyLabel;
  const imageLabelPrefix = itemLabel(itemById(uiLabels, 'image-label-prefix'), lang);
  const specsTitle = itemLabel(itemById(uiLabels, 'specs-title'), lang)
    || fallbackLabel(lang, 'Technical Parameters', '技术参数');
  const descriptionTitle = itemLabel(itemById(uiLabels, 'description-title'), lang)
    || fallbackLabel(lang, 'Model Overview', '型号概览');
  const downloadsTitle = itemLabel(itemById(uiLabels, 'downloads-title'), lang)
    || fallbackLabel(lang, 'Buyer Resources', '买家资料');
  const keywordsTitle = itemLabel(itemById(uiLabels, 'keywords-title'), lang)
    || fallbackLabel(lang, 'Search Keywords', '搜索关键词');
  const relatedTitle = itemLabel(itemById(uiLabels, 'related-title'), lang)
    || fallbackLabel(lang, 'More Models', '更多型号');
  const galleryTitle = itemLabel(itemById(uiLabels, 'gallery-title'), lang)
    || fallbackLabel(lang, 'Product Gallery', '产品图库');
  const heroInquiryCta = itemLabel(itemById(uiLabels, 'hero-inquiry-cta'), lang);
  const allProductsLabel = itemLabel(itemById(uiLabels, 'all-products-label'), lang)
    || fallbackLabel(lang, 'All Products', '全部产品');
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
  const resourceAnchorLabel = downloadsTitle
    || text(lang === 'en' ? resourceModules[0]?.title_en : resourceModules[0]?.title_cn)
    || text(resourceModules[0]?.title_en)
    || text(resourceModules[0]?.title_cn);
  const moduleAnchors = contentModules
    .map((module, index) => {
      const label = text(lang === 'en' ? module.title_en : module.title_cn) || text(module.title_en) || text(module.title_cn);
      return label ? { href: `#product-module-${index}`, label } : null;
    })
    .filter((item): item is { href: string; label: string } => Boolean(item));
  const detailAnchors = [
    media.length > 1 && galleryTitle ? { href: '#product-gallery', label: galleryTitle } : null,
    (description || features.length > 0) && descriptionTitle ? { href: '#product-description', label: descriptionTitle } : null,
    specs.length > 0 && specsTitle ? { href: '#product-specifications', label: specsTitle } : null,
    resourceModules.length > 0 && resourceAnchorLabel ? { href: '#buyer-resources', label: resourceAnchorLabel } : null,
    ...moduleAnchors,
    relatedProducts.length > 0 && relatedTitle ? { href: '#related-products', label: relatedTitle } : null,
    inquiryTitle ? { href: '#product-inquiry', label: inquiryTitle } : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item));
  const actionLinks = [
    heroInquiryCta && inquiryTitle ? { href: '#product-inquiry', label: heroInquiryCta, tone: 'primary' } : null,
    allProductsLabel ? { href: '/products', label: allProductsLabel, tone: 'secondary' } : null,
  ].filter((item): item is { href: string; label: string; tone: 'primary' | 'secondary' } => Boolean(item));
  const buyerResourceLinks = resourceModules
    .flatMap((module) => moduleItemsForLanguage(module, lang)
      .map((item) => ({
        href: text(item.href),
        title: text(item.title),
        body: text(item.body),
      })))
    .filter((item) => item.href && (item.title || item.body))
    .slice(0, 3);
  const hasMediaRail = media.length > 1;
  const desktopThumbnailWindow = thumbnailWindow(media, activeImageIndex, HERO_DESKTOP_THUMBNAILS);
  const mobileThumbnailWindow = thumbnailWindow(media, activeImageIndex, HERO_MOBILE_THUMBNAILS);
  const canMovePreviousImage = activeImageIndex > 0;
  const canMoveNextImage = activeImageIndex < media.length - 1;
  const previousImageLabel = imageLabelPrefix ? `${imageLabelPrefix} previous` : 'Previous image';
  const nextImageLabel = imageLabelPrefix ? `${imageLabelPrefix} next` : 'Next image';
  const selectImageLabel = (index: number) => imageLabelPrefix ? `${imageLabelPrefix} ${index + 1}` : `Image ${index + 1}`;
  const goToPreviousImage = () => setActiveImageIndex((index) => Math.max(index - 1, 0));
  const goToNextImage = () => setActiveImageIndex((index) => Math.min(index + 1, media.length - 1));
  const heroGridClass = hasMediaRail
    ? 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,96px)_minmax(0,1fr)_400px] lg:items-start'
    : 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start';
  const heroImageSizes = hasMediaRail ? HERO_IMAGE_SIZES_WITH_RAIL : HERO_IMAGE_SIZES_WITHOUT_RAIL;

  if (!name) return null;

  return (
    <main className="bg-[#F3F7F7] text-[#1F2A31]">
      <section className="border-b border-[#DADDE1] bg-[linear-gradient(180deg,#FFFFFF_0%,#F2F8F8_100%)] pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className={heroGridClass}>
            {hasMediaRail ? (
              <div className="hidden min-w-0 gap-2 lg:flex lg:max-h-[640px] lg:flex-col lg:pr-1">
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  disabled={!canMovePreviousImage}
                  aria-label={previousImageLabel}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-sm border border-[#DADDE1] bg-white text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronUp size={16} />
                </button>
                <div className="flex min-w-0 flex-col gap-2 overflow-hidden">
                  {desktopThumbnailWindow.items.map((src, offset) => {
                    const index = desktopThumbnailWindow.start + offset;
                    return (
                      <button
                        key={`${src}-${index}-rail`}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md border-2 bg-[#EEF1F3] transition ${
                          index === activeImageIndex ? 'border-[#147C94]' : 'border-[#DADDE1] opacity-75 hover:opacity-100'
                        }`}
                        aria-label={selectImageLabel(index)}
                      >
                        <ProtectedImage src={src} alt={`${name} ${index + 1}`} fill className="object-cover" sizes="96px" />
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={goToNextImage}
                  disabled={!canMoveNextImage}
                  aria-label={nextImageLabel}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-sm border border-[#DADDE1] bg-white text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            ) : null}

            <div className={`min-w-0 ${hasMediaRail ? 'lg:col-start-2' : ''}`}>
              {activeImage ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[#DADDE1] bg-[#EEF1F3] shadow-sm lg:aspect-[5/4]">
                  <Image
                    src={activeImage}
                    alt={name}
                    fill
                    priority
                    draggable={false}
                    className="object-cover"
                    sizes={heroImageSizes}
                    style={{ userSelect: 'none' }}
                  />
                </div>
              ) : null}
              {media.length > 1 ? (
                <div className="mt-3 grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 lg:hidden">
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    disabled={!canMovePreviousImage}
                    aria-label={previousImageLabel}
                    className="inline-flex h-16 items-center justify-center rounded-md border border-[#DADDE1] bg-white text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] disabled:pointer-events-none disabled:opacity-35"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                    {mobileThumbnailWindow.items.map((src, offset) => {
                      const index = mobileThumbnailWindow.start + offset;
                      return (
                        <button
                          key={`${src}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
                            index === activeImageIndex ? 'border-[#147C94]' : 'border-[#DADDE1] opacity-70'
                          }`}
                          aria-label={selectImageLabel(index)}
                        >
                          <ProtectedImage src={src} alt={`${name} ${index + 1}`} fill className="object-cover" sizes="80px" />
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    disabled={!canMoveNextImage}
                    aria-label={nextImageLabel}
                    className="inline-flex h-16 items-center justify-center rounded-md border border-[#DADDE1] bg-white text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] disabled:pointer-events-none disabled:opacity-35"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : null}
            </div>

            <aside className={`rounded-md border border-[#DADDE1] bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start ${hasMediaRail ? 'lg:col-start-3' : ''}`}>
              {badge ? <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#C65F22]">{badge}</p> : null}
              <h1 className="text-2xl font-black leading-tight tracking-normal text-[#1F2A31] break-words sm:text-3xl">{name}</h1>
              {facts.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {facts.map((item, index) => (
                    <span key={`${item}-${index}`} className="rounded-full border border-[#DADDE1] bg-white px-3 py-1.5 text-xs font-bold leading-5 text-[#1F2A31]">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
              {features.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <span key={`${feature}-${index}`} className="rounded-full bg-[#EAF6F8] px-3 py-1 text-xs font-semibold text-[#147C94]">
                      {feature}
                    </span>
                  ))}
                </div>
              ) : null}
              {price ? <p className="mt-5 border-t border-[#DADDE1] pt-5 text-xl font-black text-[#C65F22]">{price}</p> : null}
              {heroInquiryCta && inquiryTitle ? (
                <a
                  href="#product-inquiry"
                  data-analytics-cta="true"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-[#147C94] px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#0F6477]"
                >
                  {heroInquiryCta}
                </a>
              ) : null}
              {buyerResourceLinks.length > 0 ? (
                <div className="mt-5 border-t border-[#DADDE1] pt-5">
                  {downloadsTitle ? <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#65707A]">{downloadsTitle}</p> : null}
                  <div className="grid grid-cols-1 gap-2">
                    {buyerResourceLinks.map((item, index) => {
                      const body = (
                        <>
                          {item.title ? <span className="block text-xs font-black leading-5 text-[#1F2A31]">{item.title}</span> : null}
                          {item.body ? <span className="mt-1 block text-xs leading-5 text-[#65707A]">{item.body}</span> : null}
                        </>
                      );
                      const className = 'block rounded-md border border-[#147C94]/20 bg-[#F2F8F8] px-3 py-2 transition hover:border-[#147C94]/60 hover:bg-white';
                      return isInternalHref(item.href) ? (
                        <Link prefetch={false} key={`${item.href}-${index}`} href={item.href} className={className}>
                          {body}
                        </Link>
                      ) : (
                        <a
                          key={`${item.href}-${index}`}
                          href={item.href}
                          target={/^https?:\/\//i.test(item.href) ? '_blank' : undefined}
                          rel={/^https?:\/\//i.test(item.href) ? 'noopener noreferrer' : undefined}
                          className={className}
                        >
                          {body}
                        </a>
                      );
                    })}
                  </div>
                </div>
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

      <ProductDecisionSummary
        product={product}
        lang={lang}
        specs={specs}
        features={features}
        termRows={termRows}
        mediaCount={media.length}
        factCount={facts.length}
        relatedCount={relatedProducts.length}
        resourceCount={resourceModules.length}
        price={price}
        specsTitle={specsTitle}
        inquiryTitle={inquiryTitle}
        inquiryCta={heroInquiryCta}
      />

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
                    <Link
                      prefetch={false}
                      key={action.href}
                      href={action.href}
                      data-analytics-cta={action.tone === 'primary' ? 'true' : undefined}
                      className={className}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <a
                      key={action.href}
                      href={action.href}
                      data-analytics-cta={action.tone === 'primary' ? 'true' : undefined}
                      className={className}
                    >
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
        <section className="bg-[#F7F8F8]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
          <div className="min-w-0">
            {media.length > 1 ? (
              <ProductVisualGallery images={media.slice(1, 7)} title={galleryTitle} name={name} />
            ) : null}

            {specs.length > 0 && specsTitle ? (
              <section id="product-specifications" className="scroll-mt-28 border-b border-[#DADDE1] bg-white px-1 py-8 sm:py-10">
                <h2 className="mb-6 text-3xl font-black tracking-normal text-[#1F2A31]">{specsTitle}</h2>
                <div className="grid grid-cols-1 border-t border-[#DADDE1] sm:grid-cols-2">
                  {specs.map((item: SpecItem, index) => (
                    <p key={`${item.label}-${item.value}-${index}`} className="border-b border-[#DADDE1] bg-white px-4 py-4 text-sm leading-6 text-[#1F2A31] sm:border-r">
                      {item.label ? <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#65707A]">{item.label}</span> : null}
                      <span className="font-bold">{item.value}</span>
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
            {(description || features.length > 0) ? (
              <section id="product-description" className="scroll-mt-28 border-b border-[#DADDE1] py-8 sm:py-10">
                <h2 className="mb-6 max-w-3xl text-3xl font-black tracking-normal text-[#1F2A31]">{descriptionTitle || name}</h2>
                {description ? <p className="max-w-4xl whitespace-pre-line text-base leading-8 text-[#5C6670]">{description}</p> : null}
                {features.length > 0 ? (
                  <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {features.map((feature, index) => (
                      <li key={`${feature}-${index}`} className="border-l-2 border-[#147C94] bg-white px-5 py-4 text-sm leading-6 text-[#1F2A31]">
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            {resourceModules.length > 0 ? (
              <BuyerResourceHub modules={resourceModules} lang={lang} name={name} title={resourceAnchorLabel} />
            ) : null}

            {contentModules.map((module, index) => {
              const moduleHasLinks = moduleItemsForLanguage(module, lang).some((item) => text(item.href));
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
              <div className="border border-[#DADDE1] bg-white p-5">
                {keywordsTitle ? <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#65707A]">{keywordsTitle}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span key={`${keyword}-${index}`} className="rounded-full border border-[#DADDE1] px-2.5 py-1 text-xs text-[#5C6670]">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
          </div>
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
