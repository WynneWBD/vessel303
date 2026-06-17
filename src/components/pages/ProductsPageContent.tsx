'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogProductPublicHref } from '@/lib/product-public-routes';
import { normalizeSiteHref } from '@/lib/site-links';
import {
  itemById,
  itemContent,
  itemLabel,
  itemValue,
  moduleDescription,
  moduleMap,
  moduleTitle,
  visibleItems,
  type PublicPageModule,
  type PublicPageModuleItem,
} from '@/lib/page-module-client';
import {
  catalogCardFlag,
  catalogCardItemValue,
  findProductCatalogCardModule,
} from '@/lib/product-card-settings';
import type { ProductAttributeTemplateWithOptions, ProductCategoryRow } from '@/lib/product-catalog-db';
import type { CatalogProduct } from '@/lib/products';

type DirectoryFilters = {
  q: string;
  category: string;
  attribute: string;
  page: number;
};

type DirectoryCategory = Pick<ProductCategoryRow, 'id' | 'title_zh' | 'title_en' | 'product_count'>;
type ProductCardMode = 'poster' | 'plain';
type ProductListLabels = {
  sidebarTitle: string;
  allCategories: string;
  defaultCategoryGroup: string;
  attributeGroups: string[];
  contactCardTitle: string;
  priceEmpty: string;
  cardPriceEyebrow: string;
  modelDetail: string;
  imagePlaceholder: string;
  paginationPrevious: string;
  paginationNext: string;
};

interface Props {
  products: CatalogProduct[];
  pageSize: number;
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  pageModules: PublicPageModule[];
  initialFilters: DirectoryFilters;
}

const PRODUCT_CARD_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px';

function buildHref(filters: DirectoryFilters, patch: Partial<DirectoryFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q.trim()) params.set('q', next.q.trim());
  if (next.category) params.set('category', next.category);
  if (next.attribute) params.set('attribute', next.attribute);
  if (next.page > 1) params.set('page', String(next.page));
  const query = params.toString();
  return query ? `/products?${query}` : '/products';
}

function productHref(product: CatalogProduct) {
  return getCatalogProductPublicHref(product);
}

function displayHref(href: string | null | undefined) {
  const value = String(href ?? '').trim();
  return value ? normalizeSiteHref(value, '') : '';
}

function fallbackCopy(lang: 'en' | 'zh', en: string, zh: string) {
  return lang === 'zh' ? zh : en;
}

function formatAreaNumber(value: number | null | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return '';
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1).replace(/\.0$/, '');
}

function productAreaLabel(product: CatalogProduct) {
  const area = formatAreaNumber(product.area);
  return area ? `${area}m²` : product.size;
}

function productPrice(product: CatalogProduct, lang: 'en' | 'zh') {
  const price = lang === 'en' ? product.price_display_en : product.price_display_zh;
  return price || product.price_display_en || product.price_display_zh || '';
}

function cardPriceText(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return '';
  if (['inquire for pricing', 'price on request', 'request quote', '询价', '价格请咨询', '请咨询'].includes(normalized)) {
    return '';
  }
  return value;
}

function formatCount(value: number | null | undefined) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? String(count) : '';
}

function localizedText(en: string | null | undefined, zh: string | null | undefined, lang: 'en' | 'zh') {
  return (lang === 'en' ? en : zh)?.trim() || (lang === 'en' ? zh : en)?.trim() || '';
}

function rawItemById(pageModule: PublicPageModule | null | undefined, id: string) {
  if (!pageModule || pageModule.is_visible === false || !Array.isArray(pageModule.items)) return null;
  return pageModule.items.find((item) => item.id === id) ?? null;
}

function parseConfigFlag(value: string, fallback: boolean) {
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (!normalized) return fallback;
  if (['0', 'false', 'off', 'no', 'hide', 'hidden', '否', '不显示', '隐藏'].includes(normalized)) return false;
  if (['1', 'true', 'on', 'yes', 'show', 'visible', '是', '显示'].includes(normalized)) return true;
  return fallback;
}

function configFlag(pageModule: PublicPageModule | null | undefined, id: string, lang: 'en' | 'zh', fallback: boolean) {
  const item = rawItemById(pageModule, id);
  if (!item) return fallback;
  if (item.is_visible === false) return false;
  return parseConfigFlag(itemValue(item, lang) || itemLabel(item, lang), fallback);
}

function cardModeFromConfig(item: PublicPageModuleItem | null, lang: 'en' | 'zh'): ProductCardMode {
  const raw = item && item.is_visible !== false ? (itemValue(item, lang) || itemLabel(item, lang)) : '';
  const normalized = raw.trim().toLowerCase();
  if (['plain', 'normal', 'simple', '普通', '普通卡', '普通封面'].some((value) => normalized.includes(value))) {
    return 'plain';
  }
  return 'poster';
}

function categoryTitle(category: DirectoryCategory | undefined, lang: 'en' | 'zh') {
  if (!category) return '';
  return localizedText(category.title_en, category.title_zh, lang);
}

function attributeOptionTitle(
  attributeTemplates: ProductAttributeTemplateWithOptions[],
  optionId: string,
  lang: 'en' | 'zh',
) {
  const id = Number(optionId);
  if (!Number.isInteger(id)) return '';
  for (const template of attributeTemplates) {
    const option = template.options.find((item) => item.id === id);
    if (!option) continue;
    const templateLabel = localizedText(template.title_en, template.title_zh, lang);
    const optionLabel = localizedText(option.label_en, option.label_zh, lang);
    return [templateLabel, optionLabel].filter(Boolean).join(': ');
  }
  return '';
}

function productMatchesSearch(product: CatalogProduct, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  const text = [
    product.id,
    product.productSeries,
    product.name_cn,
    product.name_en,
    product.gen,
    product.size,
    ...(product.tags_cn ?? []),
    ...(product.tags_en ?? []),
    ...(product.features_cn ?? []),
    ...(product.features_en ?? []),
    ...(product.keywords_zh ?? []),
    ...(product.keywords_en ?? []),
  ].join(' ').toLowerCase();
  return text.includes(q);
}

function productMatchesFilters(product: CatalogProduct, filters: DirectoryFilters) {
  if (!productMatchesSearch(product, filters.q)) return false;
  if (filters.category && String(product.category_id ?? '') !== filters.category) return false;
  if (filters.attribute) {
    const attributeId = Number(filters.attribute);
    if (!Number.isInteger(attributeId) || !(product.attribute_option_ids ?? []).includes(attributeId)) return false;
  }
  return true;
}

function ProductsHero({
  pageModule,
  totalProducts,
  totalLabel,
  breadcrumbHome,
  breadcrumbCurrent,
}: {
  pageModule: PublicPageModule | null;
  totalProducts: number;
  totalLabel: string;
  breadcrumbHome: string;
  breadcrumbCurrent: string;
}) {
  const { lang } = useLanguage();
  if (!pageModule || pageModule.is_visible === false) return null;

  const title = moduleTitle(pageModule, lang);
  const description = moduleDescription(pageModule, lang);
  const primaryCta = itemById(pageModule, 'primary-cta');
  const secondaryCta = itemById(pageModule, 'secondary-cta');
  const routeNote = itemById(pageModule, 'route-note');
  const featuredLabel = itemLabel(itemById(pageModule, 'featured-label'), lang);
  const heroImage = itemById(pageModule, 'hero-image');
  const primaryLabel = itemLabel(primaryCta, lang);
  const secondaryLabel = itemLabel(secondaryCta, lang);
  const primaryHref = displayHref(primaryCta?.href);
  const secondaryHref = displayHref(secondaryCta?.href);
  const routeNoteLabel = itemLabel(routeNote, lang);
  const routeNoteBody = itemContent(routeNote, lang);
  const heroImageLabel = itemLabel(heroImage, lang);
  const heroImageHref = displayHref(heroImage?.href);
  const heroImageSrc = heroImage?.image_url?.trim() || '';
  const hasHeroCopy = title || description || primaryLabel || secondaryLabel || routeNoteLabel || routeNoteBody || heroImageSrc;
  if (!hasHeroCopy) return null;

  const media = heroImageSrc ? (
    <ProtectedImage
      src={heroImageSrc}
      alt={heroImageLabel || title}
      fill
      priority
      className="object-cover"
      sizes="(max-width: 1024px) 100vw, 640px"
      data-page-module-item="hero-image"
      data-page-module-field="image_url"
    />
  ) : (
    <div className="flex h-full min-h-[280px] items-center justify-center bg-[#E7E7E7] text-sm font-bold uppercase text-[#888]">
      {heroImageLabel || 'VESSEL'}
    </div>
  );

  return (
    <section
      className="bg-white pt-24 text-[#222] sm:pt-28"
      data-page-module="products:hero"
      data-page-key="products"
      data-module-key="hero"
    >
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(440px,0.7fr)] lg:px-0 lg:pb-16">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-8 text-sm text-[#555]">
            <Link prefetch={false} href="/" className="hover:text-[#E97936]">
              {breadcrumbHome}
            </Link>
            <span className="mx-2 text-[#B7B7B7]">/</span>
            <span>{breadcrumbCurrent}</span>
          </div>

          {title ? (
            <h1
              className="max-w-[880px] break-words font-[family-name:var(--font-heading)] text-4xl font-black leading-tight tracking-normal text-[#1F1F1F] sm:text-5xl lg:text-[58px]"
              data-page-module-field={`title_${lang}`}
            >
              {title}
            </h1>
          ) : null}

          {description ? (
            <p
              className="mt-5 max-w-[760px] text-base leading-8 text-[#555] sm:text-lg"
              data-page-module-field={`description_${lang}`}
            >
              {description}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {primaryLabel && primaryHref ? (
              <Link
                prefetch={false}
                href={primaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded bg-[#E97936] px-6 text-sm font-bold text-white transition hover:bg-[#CA6228]"
                data-page-module-item="primary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Link
                prefetch={false}
                href={secondaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded border border-[#D8D8D8] bg-white px-6 text-sm font-bold text-[#333] transition hover:border-[#E97936] hover:text-[#E97936]"
                data-page-module-item="secondary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>

          {routeNoteLabel || routeNoteBody ? (
            <div className="mt-8 border-l-4 border-[#E97936] pl-5 text-sm leading-7 text-[#5C5C5C]">
              {routeNoteLabel ? (
                <p
                  className="font-bold uppercase tracking-[0.08em] text-[#E97936]"
                  data-page-module-item="route-note"
                  data-page-module-field={`label_${lang}`}
                >
                  {routeNoteLabel}
                </p>
              ) : null}
              {routeNoteBody ? (
                <p data-page-module-item="route-note" data-page-module-field={`content_${lang}`}>
                  {routeNoteBody}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[340px] overflow-hidden rounded-[8px] bg-[#E7E7E7] lg:min-h-[460px]">
          {heroImageHref ? (
            <Link prefetch={false} href={heroImageHref} className="absolute inset-0 block">
              {media}
            </Link>
          ) : (
            <div className="absolute inset-0">{media}</div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/58 to-transparent px-6 pb-6 pt-24 text-white">
            {featuredLabel ? (
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] text-white/75"
                data-page-module-item="featured-label"
                data-page-module-field={`label_${lang}`}
              >
                {featuredLabel}
              </p>
            ) : null}
            {heroImageLabel ? (
              <p
                className="mt-2 text-2xl font-black uppercase leading-tight"
                data-page-module-item="hero-image"
                data-page-module-field={`label_${lang}`}
              >
                {heroImageLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-y border-[#EEEEEE] bg-[#FAFAFA]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 text-sm text-[#666] sm:px-6 lg:px-0">
          <span className="font-semibold text-[#222]">{breadcrumbCurrent}</span>
          <span>{totalLabel}: {totalProducts}</span>
        </div>
      </div>
    </section>
  );
}

function ProductsHighlights({ pageModule }: { pageModule: PublicPageModule | null }) {
  const { lang } = useLanguage();
  const items = visibleItems(pageModule);
  if (!pageModule || pageModule.is_visible === false || items.length === 0) return null;

  return (
    <section
      className="bg-[#F3F3F3] pt-10 text-[#222]"
      data-page-module="products:highlights"
      data-page-key="products"
      data-module-key="highlights"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-0">
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => {
            const value = itemValue(item, lang);
            const label = itemLabel(item, lang);
            const content = itemContent(item, lang);
            if (!value && !label && !content) return null;
            return (
              <div key={item.id} className="border-l-4 border-[#E97936] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                {value ? (
                  <p
                    className="text-xs font-black uppercase tracking-[0.16em] text-[#E97936]"
                    data-page-module-item={item.id}
                    data-page-module-field={`value_${lang}`}
                  >
                    {value}
                  </p>
                ) : null}
                {label ? (
                  <h2
                    className="mt-2 text-lg font-black leading-snug text-[#222]"
                    data-page-module-item={item.id}
                    data-page-module-field={`label_${lang}`}
                  >
                    {label}
                  </h2>
                ) : null}
                {content ? (
                  <p
                    className="mt-2 text-sm leading-6 text-[#666]"
                    data-page-module-item={item.id}
                    data-page-module-field={`content_${lang}`}
                  >
                    {content}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FilterRow({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number | null;
}) {
  return (
    <Link
      prefetch={false}
      href={href}
      className={`flex min-h-10 items-center justify-between gap-3 border-t border-[#E9E9E9] px-4 text-[15px] transition ${
        active ? 'bg-[#FFF3EC] font-semibold text-[#E57A3C]' : 'bg-white text-[#333] hover:bg-[#F8F8F8] hover:text-[#E57A3C]'
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      {formatCount(count) ? <span className="shrink-0 text-xs text-[#999]">{formatCount(count)}</span> : null}
    </Link>
  );
}

function Sidebar({
  categories,
  attributeTemplates,
  filters,
  contactModule,
  totalProducts,
  labels,
}: {
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  filters: DirectoryFilters;
  contactModule: PublicPageModule | null;
  totalProducts: number;
  labels: ProductListLabels;
}) {
  const { lang } = useLanguage();
  const headline = itemLabel(itemById(contactModule, 'headline'), lang);
  const body = itemContent(itemById(contactModule, 'body'), lang);
  const contactTitle = itemLabel(itemById(contactModule, 'eyebrow'), lang) || labels.contactCardTitle;
  const cta = itemById(contactModule, 'primary-cta');
  const ctaLabel = itemLabel(cta, lang);
  const ctaHref = displayHref(cta?.href);
  const showContact = contactModule?.is_visible !== false && (contactTitle || headline || body || (ctaLabel && ctaHref));

  return (
    <aside className="space-y-8">
      <div className="overflow-hidden bg-white shadow-[0_16px_44px_rgba(0,0,0,0.08)]">
        <div className="bg-[#E97936] px-5 py-5 text-[22px] font-black leading-tight text-white">
          {labels.sidebarTitle}
        </div>
        <FilterRow
          href={buildHref(filters, { category: '', attribute: '', page: 1 })}
          active={!filters.category && !filters.attribute}
          label={labels.allCategories}
          count={totalProducts}
        />
        {categories.length > 0 ? (
          <details className="group border-t border-[#E9E9E9]" open={Boolean(filters.category)}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 bg-white px-4 text-[15px] text-[#222] transition hover:text-[#E97936] [&::-webkit-details-marker]:hidden">
              <span>{labels.defaultCategoryGroup}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[#999] transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div>
              {categories.map((category) => {
                const label = categoryTitle(category, lang);
                if (!label) return null;
                return (
                  <FilterRow
                    key={category.id}
                    href={buildHref(filters, { category: String(category.id), page: 1 })}
                    active={filters.category === String(category.id)}
                    label={label}
                    count={category.product_count}
                  />
                );
              })}
            </div>
          </details>
        ) : null}
        {attributeTemplates.map((template, index) => {
          const templateTitle = localizedText(template.title_en, template.title_zh, lang);
          const visibleOptions = template.options
            .map((option) => ({
              ...option,
              displayLabel: localizedText(option.label_en, option.label_zh, lang),
            }))
            .filter((option) => option.displayLabel);
          if (!templateTitle && visibleOptions.length === 0) return null;
          const open = visibleOptions.some((option) => filters.attribute === String(option.id));
          const fallbackTitle = labels.attributeGroups[index] || templateTitle;

          return (
            <details key={template.id} className="group border-t border-[#E9E9E9]" open={open}>
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 bg-white px-4 text-[15px] text-[#222] transition hover:text-[#E97936] [&::-webkit-details-marker]:hidden">
                <span>{templateTitle || fallbackTitle}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#999] transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div>
                {visibleOptions.map((option) => (
                  <FilterRow
                    key={option.id}
                    href={buildHref(filters, { attribute: String(option.id), page: 1 })}
                    active={filters.attribute === String(option.id)}
                    label={option.displayLabel}
                    count={option.product_count}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      {showContact ? (
        <div className="overflow-hidden bg-white shadow-[0_16px_44px_rgba(0,0,0,0.08)]">
          {contactTitle ? (
            <div className="bg-[#E97936] px-5 py-5 text-[22px] font-black text-white">
              {contactTitle}
            </div>
          ) : null}
          <div className="space-y-4 px-5 py-5 text-sm leading-6 text-[#555]">
            {headline ? <p className="font-semibold text-[#222]">{headline}</p> : null}
            {body ? <p>{body}</p> : null}
            {ctaLabel && ctaHref ? (
              <Link
                prefetch={false}
                href={ctaHref}
                className="inline-flex min-h-10 items-center justify-center bg-[#E97936] px-5 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#CA6228]"
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function ProductCard({
  product,
  cardMode,
  labels,
}: {
  product: CatalogProduct;
  cardMode: ProductCardMode;
  labels: Pick<ProductListLabels, 'priceEmpty' | 'cardPriceEyebrow' | 'modelDetail' | 'imagePlaceholder'>;
}) {
  const { lang } = useLanguage();
  const cardModule = findProductCatalogCardModule(product.detail_modules);
  const name = localizedText(product.name_en, product.name_cn, lang) || product.id;
  const subtitle = [product.productSeries, product.gen].filter(Boolean).join(' ');
  const usePosterLayer = cardMode === 'poster' && cardModule?.is_visible !== false;
  const showArea = catalogCardFlag(cardModule, 'showArea', true);
  const showRegion = catalogCardFlag(cardModule, 'showRegion', true);
  const showPrice = catalogCardFlag(cardModule, 'showPrice', true);
  const area = showArea ? (catalogCardItemValue(cardModule, 'area', lang) || productAreaLabel(product)) : '';
  const cardPriceOverride = cardPriceText((lang === 'en' ? cardModule?.body_en : cardModule?.body_cn)?.trim() || '');
  const price = showPrice
    ? (cardPriceOverride || cardPriceText(productPrice(product, lang)))
    : '';
  const seriesLabel = catalogCardItemValue(cardModule, 'model', lang)
    || (product.productSeries ? `${product.productSeries} ${product.gen}`.trim() : 'VESSEL');
  const cardRegion = showRegion
    ? localizedText(cardModule?.title_en, cardModule?.title_cn, lang)
      || product.category_title_en
      || product.category_title_zh
      || product.productSeries
      || 'VESSEL'
    : '';
  const posterImage = cardModule?.image_url?.trim() || '';
  const imageSrc = usePosterLayer ? (posterImage || product.image) : (product.image || posterImage);
  const priceEyebrow = catalogCardItemValue(cardModule, 'priceEyebrow', lang)
    || labels.cardPriceEyebrow
    || fallbackCopy(lang, 'Starting from', '完整交付价');

  return (
    <article className="group overflow-hidden rounded-[8px] bg-white p-7 shadow-[0_18px_46px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(0,0,0,0.14)]">
      <Link
        prefetch={false}
        href={productHref(product)}
        className={`relative block aspect-square overflow-hidden bg-[#E8E8E8] ${
          usePosterLayer ? 'border-[5px] border-[#E97936]' : 'border border-[#ECECEC]'
        }`}
      >
        {imageSrc ? (
          <ProtectedImage
            src={imageSrc}
            alt={name}
            fill
            loading="lazy"
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes={PRODUCT_CARD_IMAGE_SIZES}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#E8E8E8] text-sm font-semibold text-[#999]">
            {labels.imagePlaceholder}
          </div>
        )}
        {usePosterLayer ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-black/28 via-transparent to-black/28" />
            {cardRegion ? (
              <div className="absolute left-0 top-0 max-w-[72%] bg-[#E97936] px-4 py-2 text-[15px] font-black uppercase leading-tight tracking-[0.03em] text-white">
                {cardRegion}
              </div>
            ) : null}
            {area ? (
              <div className="absolute right-3 top-3 rounded-sm bg-white px-4 py-1 text-[18px] font-black leading-none text-[#E97936] shadow-sm">
                {area}
              </div>
            ) : null}
            <div className="absolute left-5 right-5 top-[36%] text-center text-[20px] font-black uppercase leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              {seriesLabel}
            </div>
            {showPrice ? (
              <div className="absolute bottom-0 right-0 min-w-[52%] rounded-tl-[48px] bg-[#E97936] px-5 py-3 text-right text-white">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-90">
                  {price ? priceEyebrow : labels.modelDetail}
                </div>
                <div className="mt-1 text-[20px] font-black leading-none">
                  {price || labels.priceEmpty || fallbackCopy(lang, 'Open', '查看')}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/12 to-transparent px-5 pb-5 pt-16">
            <div className="text-[18px] font-black uppercase leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              {seriesLabel}
            </div>
            {[cardRegion, area].filter(Boolean).length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/85">
                {cardRegion ? <span>{cardRegion}</span> : null}
                {area ? <span>{area}</span> : null}
              </div>
            ) : null}
          </div>
        )}
      </Link>
      <Link
        prefetch={false}
        href={productHref(product)}
        className="mt-5 block min-h-[56px] text-center text-[17px] font-medium leading-7 text-[#222] transition hover:text-[#E97936]"
      >
        {name}
      </Link>
      {subtitle ? <p className="mt-2 text-center text-xs uppercase tracking-[0.12em] text-[#999]">{subtitle}</p> : null}
    </article>
  );
}

function Pagination({
  filters,
  currentPage,
  totalPages,
  labels,
}: {
  filters: DirectoryFilters;
  currentPage: number;
  totalPages: number;
  labels: Pick<ProductListLabels, 'paginationPrevious' | 'paginationNext'>;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 8);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <Link
        prefetch={false}
        href={buildHref(filters, { page: Math.max(1, currentPage - 1) })}
        aria-label={labels.paginationPrevious}
        className="flex h-10 min-w-10 items-center justify-center rounded bg-white px-3 text-sm font-semibold text-[#666] shadow-sm transition hover:bg-[#E97936] hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
      {pages.map((page) => (
        <Link
          prefetch={false}
          key={page}
          href={buildHref(filters, { page })}
          className={`flex h-10 min-w-10 items-center justify-center rounded px-3 text-sm font-semibold shadow-sm transition ${
            page === currentPage
              ? 'bg-[#E97936] text-white'
              : 'bg-white text-[#666] hover:bg-[#E97936] hover:text-white'
          }`}
        >
          {page}
        </Link>
      ))}
      <Link
        prefetch={false}
        href={buildHref(filters, { page: Math.min(totalPages, currentPage + 1) })}
        aria-label={labels.paginationNext}
        className="flex h-10 min-w-10 items-center justify-center rounded bg-white px-3 text-sm font-semibold text-[#666] shadow-sm transition hover:bg-[#E97936] hover:text-white"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}

export default function ProductsPageContent({
  products,
  pageSize,
  categories,
  attributeTemplates,
  pageModules,
  initialFilters,
}: Props) {
  const { lang } = useLanguage();
  const modules = moduleMap(pageModules);
  const heroModule = modules.get('hero') ?? null;
  const highlightsModule = modules.get('highlights') ?? null;
  const contactModule = modules.get('contact-card') ?? null;
  const uiModule = modules.get('ui-labels') ?? null;
  const label = (id: string) => itemLabel(itemById(uiModule, id), lang);
  const cardMode = cardModeFromConfig(rawItemById(uiModule, 'card-mode'), lang);
  const showSearch = configFlag(uiModule, 'search-visible', lang, true);
  const showSidebar = configFlag(uiModule, 'sidebar-visible', lang, true);
  const heroBreadcrumbHome = itemLabel(itemById(heroModule, 'breadcrumb-home'), lang);
  const heroBreadcrumbCurrent = itemLabel(itemById(heroModule, 'breadcrumb-current'), lang);
  const uiLabels = {
    pageTitle: label('catalog-title') || label('all-products-label') || fallbackCopy(lang, 'ALL Products 所有产品', 'ALL Products 所有产品'),
    breadcrumbLabel: label('breadcrumb-label') || label('all-products-label') || fallbackCopy(lang, 'ALL Products 所有产品', 'ALL Products 所有产品'),
    breadcrumbHome: label('breadcrumb-home-label') || heroBreadcrumbHome || fallbackCopy(lang, 'Home', '首页'),
    sidebarTitle: label('category-heading') || fallbackCopy(lang, 'Product Categories 产品分类', 'Product Categories 产品分类'),
    allCategories: label('all-categories-label') || label('all-products-label') || fallbackCopy(lang, 'All categories', '全部产品'),
    defaultCategoryGroup: label('default-category-group') || fallbackCopy(lang, 'Default Configuration 默认配置', 'Default Configuration 默认配置'),
    attributeGroups: [
      label('attribute-group-01') || fallbackCopy(lang, 'Product Configuration 热销配置', 'Product Configuration 热销配置'),
      label('attribute-group-02') || fallbackCopy(lang, 'Area 面积', 'Area 面积'),
      label('attribute-group-03') || fallbackCopy(lang, 'Country 国家', 'Country 国家'),
    ],
    contactCardTitle: label('contact-card-title') || fallbackCopy(lang, 'Contact Us', '联系我们'),
    searchPlaceholder: label('search-placeholder') || 'Please enter keyword / 请输入关键词',
    searchButton: label('search-button') || 'Search 搜索',
    resetButton: label('reset-button') || fallbackCopy(lang, 'Reset', '重置'),
    rangeOf: label('range-of') || fallbackCopy(lang, 'of', '共'),
    catalogTotal: label('catalog-total-label') || fallbackCopy(lang, 'Catalog total', '产品总数'),
    matchingProducts: label('matching-products-label') || fallbackCopy(lang, 'Matching products', '匹配产品'),
    activeFilters: label('active-filters-label') || fallbackCopy(lang, 'Active filters', '当前筛选'),
    queryFilter: label('query-filter-label') || fallbackCopy(lang, 'Keyword', '关键词'),
    categoryFilter: label('category-filter-label') || fallbackCopy(lang, 'Category', '分类'),
    attributeFilter: label('attribute-filter-label') || fallbackCopy(lang, 'Attribute', '属性'),
    clearFilter: label('clear-filter-label') || fallbackCopy(lang, 'Clear', '清除'),
    emptyState: label('empty-state') || fallbackCopy(lang, 'No products found', '暂无匹配产品'),
    emptyStateBody: label('empty-state-body') || fallbackCopy(lang, 'Try another keyword or category.', '请更换关键词或分类。'),
    priceEmpty: label('card-price-empty') || fallbackCopy(lang, 'Details', '查看详情'),
    cardPriceEyebrow: label('card-price-eyebrow') || fallbackCopy(lang, 'Starting from', '完整交付价'),
    modelDetail: label('model-detail-label') || fallbackCopy(lang, 'Model detail', '型号详情'),
    imagePlaceholder: label('image-placeholder') || 'VESSEL',
    paginationPrevious: label('pagination-previous') || fallbackCopy(lang, 'Previous page', '上一页'),
    paginationNext: label('pagination-next') || fallbackCopy(lang, 'Next page', '下一页'),
  };
  const rawFilters = initialFilters;
  const filteredProducts = useMemo(
    () => products.filter((product) => productMatchesFilters(product, rawFilters)),
    [products, rawFilters],
  );
  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(rawFilters.page, totalPages);
  const filters = { ...rawFilters, page: currentPage };
  const pageProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, currentPage * pageSize);
  const selectedCategory = categoryTitle(categories.find((category) => String(category.id) === filters.category), lang);
  const selectedAttribute = attributeOptionTitle(attributeTemplates, filters.attribute, lang);
  const activeFilters = [
    filters.q && uiLabels.queryFilter ? { key: 'q', label: uiLabels.queryFilter, value: filters.q } : null,
    selectedCategory && uiLabels.categoryFilter ? { key: 'category', label: uiLabels.categoryFilter, value: selectedCategory } : null,
    selectedAttribute && uiLabels.attributeFilter ? { key: 'attribute', label: uiLabels.attributeFilter, value: selectedAttribute } : null,
  ].filter((item): item is { key: string; label: string; value: string } => Boolean(item));
  const removeFilterHref = (key: string) => {
    if (key === 'q') return buildHref(filters, { q: '', page: 1 });
    if (key === 'category') return buildHref(filters, { category: '', page: 1 });
    if (key === 'attribute') return buildHref(filters, { attribute: '', page: 1 });
    return buildHref(filters, { page: 1 });
  };

  return (
    <main className="bg-[#F3F3F3] text-[#222]">
      <ProductsHero
        pageModule={heroModule}
        totalProducts={products.length}
        totalLabel={uiLabels.catalogTotal}
        breadcrumbHome={uiLabels.breadcrumbHome}
        breadcrumbCurrent={heroBreadcrumbCurrent || uiLabels.breadcrumbLabel}
      />
      <ProductsHighlights pageModule={highlightsModule} />

      <section className="pb-16 pt-10" data-page-module="products:catalog" data-page-key="products">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-0">
        <div className={`grid gap-10 lg:gap-14 ${showSidebar ? 'lg:grid-cols-[340px_minmax(0,1fr)]' : ''}`}>
          {showSidebar ? (
            <Sidebar
              categories={categories}
              attributeTemplates={attributeTemplates}
              filters={filters}
              contactModule={contactModule}
              totalProducts={products.length}
              labels={{
                sidebarTitle: uiLabels.sidebarTitle,
                allCategories: uiLabels.allCategories,
                defaultCategoryGroup: uiLabels.defaultCategoryGroup,
                attributeGroups: uiLabels.attributeGroups,
                contactCardTitle: uiLabels.contactCardTitle,
                priceEmpty: uiLabels.priceEmpty,
                cardPriceEyebrow: uiLabels.cardPriceEyebrow,
                modelDetail: uiLabels.modelDetail,
                imagePlaceholder: uiLabels.imagePlaceholder,
                paginationPrevious: uiLabels.paginationPrevious,
                paginationNext: uiLabels.paginationNext,
              }}
            />
          ) : null}

          <div className="min-w-0">
            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <h1 className="text-[22px] font-bold tracking-normal text-[#222] sm:text-[26px]">
                {uiLabels.pageTitle}
              </h1>
              {showSearch ? (
                <form action="/products" className="flex w-full max-w-[568px] overflow-hidden bg-white shadow-sm">
                  <input type="hidden" name="category" value={filters.category} />
                  <input type="hidden" name="attribute" value={filters.attribute} />
                  <input
                    name="q"
                    defaultValue={filters.q}
                    placeholder={uiLabels.searchPlaceholder}
                    className="min-h-10 min-w-0 flex-1 border border-[#E2E2E2] border-r-0 px-4 text-center text-sm text-[#333] outline-none placeholder:text-[#A7A7A7]"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-10 w-[160px] shrink-0 items-center justify-center gap-2 bg-[#E97936] px-7 text-sm font-semibold text-white transition hover:bg-[#CA6228]"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    <span>{uiLabels.searchButton}</span>
                  </button>
                </form>
              ) : null}
            </div>

            <div className="sr-only mb-7 flex flex-wrap items-center justify-between gap-3 text-sm text-[#777]">
              <span>
                {uiLabels.matchingProducts}: {rangeStart}-{rangeEnd} {uiLabels.rangeOf} {total}
              </span>
              <span>{uiLabels.catalogTotal}: {products.length}</span>
            </div>

            {activeFilters.length > 0 ? (
              <div className="mb-7 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#777]">{uiLabels.activeFilters}</span>
                {activeFilters.map((item) => (
                  <Link
                    prefetch={false}
                    key={item.key}
                    href={removeFilterHref(item.key)}
                    aria-label={`${uiLabels.clearFilter} ${item.label}: ${item.value}`}
                    className="inline-flex min-h-8 items-center gap-2 rounded bg-white px-3 text-xs font-semibold text-[#333] shadow-sm transition hover:text-[#E97936]"
                  >
                    <span className="text-[#888]">{item.label}</span>
                    <span>{item.value}</span>
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Link>
                ))}
                <Link
                  prefetch={false}
                  href="/products"
                  className="inline-flex min-h-8 items-center rounded bg-[#E97936] px-3 text-xs font-bold text-white transition hover:bg-[#CA6228]"
                >
                  {uiLabels.clearFilter}
                </Link>
              </div>
            ) : null}

            {filters.q || filters.category || filters.attribute ? (
              <div className="mb-7">
                <Link
                  prefetch={false}
                  href="/products"
                  className="inline-flex min-h-9 items-center rounded bg-white px-4 text-sm font-semibold text-[#666] shadow-sm transition hover:text-[#E97936]"
                >
                  {uiLabels.resetButton}
                </Link>
              </div>
            ) : null}

            {pageProducts.length === 0 ? (
              <div className="rounded-[8px] bg-white px-8 py-20 text-center text-sm text-[#777] shadow-[0_18px_46px_rgba(0,0,0,0.08)]">
                <p className="font-semibold text-[#222]">{uiLabels.emptyState}</p>
                <p className="mt-2">{uiLabels.emptyStateBody}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
                {pageProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cardMode={cardMode}
                    labels={{
                      priceEmpty: uiLabels.priceEmpty,
                      cardPriceEyebrow: uiLabels.cardPriceEyebrow,
                      modelDetail: uiLabels.modelDetail,
                      imagePlaceholder: uiLabels.imagePlaceholder,
                    }}
                  />
                ))}
              </div>
            )}

            <Pagination
              filters={filters}
              currentPage={currentPage}
              totalPages={totalPages}
              labels={{
                paginationPrevious: uiLabels.paginationPrevious,
                paginationNext: uiLabels.paginationNext,
              }}
            />
          </div>
        </div>
      </div>
      </section>
    </main>
  );
}
