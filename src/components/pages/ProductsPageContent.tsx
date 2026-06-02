'use client';

import { useMemo } from 'react';
import Link from 'next/link';
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
} from '@/lib/page-module-client';
import type { ProductAttributeTemplateWithOptions, ProductCategoryRow } from '@/lib/product-catalog-db';
import type { CatalogProduct } from '@/lib/products';

type DirectoryFilters = {
  q: string;
  category: string;
  attribute: string;
  page: number;
};

type DirectoryCategory = Pick<ProductCategoryRow, 'id' | 'title_zh' | 'title_en'>;

interface Props {
  products: CatalogProduct[];
  pageSize: number;
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  pageModules: PublicPageModule[];
  initialFilters: DirectoryFilters;
}

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

function productPrice(product: CatalogProduct, lang: 'en' | 'zh') {
  const price = lang === 'en' ? product.price_display_en : product.price_display_zh;
  return price || product.price_display_en || product.price_display_zh || '';
}

function localizedText(en: string | null | undefined, zh: string | null | undefined, lang: 'en' | 'zh') {
  return (lang === 'en' ? en : zh)?.trim() ?? '';
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

function Sidebar({
  categories,
  attributeTemplates,
  filters,
  contactModule,
  uiLabels,
}: {
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  filters: DirectoryFilters;
  contactModule: PublicPageModule | null;
  uiLabels: Record<string, string>;
}) {
  const { lang } = useLanguage();
  const eyebrow = itemLabel(itemById(contactModule, 'eyebrow'), lang);
  const headline = itemLabel(itemById(contactModule, 'headline'), lang);
  const body = itemContent(itemById(contactModule, 'body'), lang);
  const cta = itemById(contactModule, 'primary-cta');
  const ctaLabel = itemLabel(cta, lang);
  const ctaHref = displayHref(cta?.href);

  return (
    <aside className="space-y-3">
      <div className="border border-[#DADDE1] bg-white">
        <div className="border-b border-[#DADDE1] bg-[#F5F7F8] px-4 py-2.5 text-sm font-bold text-[#1F2A31]">
          {uiLabels.categoryHeading}
        </div>
        <div className="divide-y divide-[#ECEFF1]">
          <Link
            href={buildHref(filters, { category: '', page: 1 })}
            className={`block px-4 py-2.5 text-sm transition ${
              !filters.category ? 'bg-[#EAF4F6] font-semibold text-[#147C94]' : 'text-[#5C6670] hover:bg-[#F7FAFA]'
            }`}
          >
            {uiLabels.allProducts}
          </Link>
          {categories.map((category) => {
            const categoryLabel = localizedText(category.title_en, category.title_zh, lang);
            if (!categoryLabel) return null;
            return (
              <Link
                key={category.id}
                href={buildHref(filters, { category: String(category.id), page: 1 })}
                className={`block px-4 py-2.5 text-sm transition ${
                  filters.category === String(category.id)
                    ? 'bg-[#EAF4F6] font-semibold text-[#147C94]'
                    : 'text-[#5C6670] hover:bg-[#F7FAFA]'
                }`}
              >
                {categoryLabel}
              </Link>
            );
          })}
        </div>
      </div>

      {attributeTemplates.map((template) => {
        const templateTitle = localizedText(template.title_en, template.title_zh, lang);
        const visibleOptions = template.options
          .map((option) => ({
            ...option,
            displayLabel: localizedText(option.label_en, option.label_zh, lang),
          }))
          .filter((option) => option.displayLabel);
        if (!templateTitle && visibleOptions.length === 0) return null;

        return (
          <div key={template.id} className="border border-[#DADDE1] bg-white">
            {templateTitle ? (
              <div className="border-b border-[#DADDE1] bg-[#F5F7F8] px-4 py-2.5">
                <p className="text-sm font-bold text-[#1F2A31]">{templateTitle}</p>
              </div>
            ) : null}
            <div className="divide-y divide-[#ECEFF1]">
              {visibleOptions.map((option) => (
                <Link
                  key={option.id}
                  href={buildHref(filters, { attribute: String(option.id), page: 1 })}
                  className={`block px-4 py-2.5 text-sm transition ${
                    filters.attribute === String(option.id)
                      ? 'bg-[#FFF4EC] font-semibold text-[#C65F22]'
                      : 'text-[#5C6670] hover:bg-[#F7FAFA]'
                  }`}
                >
                  {option.displayLabel}
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {contactModule?.is_visible !== false && (eyebrow || headline || body || ctaLabel) ? (
        <div className="border border-[#DADDE1] bg-[#1F2A31] p-4 text-white">
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#F2A36F]">{eyebrow}</p>
          ) : null}
          {headline ? <h2 className="mt-3 text-lg font-black leading-snug">{headline}</h2> : null}
          {body ? <p className="mt-3 text-sm leading-6 text-white/65">{body}</p> : null}
          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className="mt-5 inline-flex min-h-10 w-full items-center justify-center bg-[#E36F2C] px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#C85A1F]"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

function ProductCard({
  product,
  uiLabels,
  inquiryHref,
}: {
  product: CatalogProduct;
  uiLabels: Record<string, string>;
  inquiryHref: string;
}) {
  const { lang } = useLanguage();
  const name = lang === 'en' ? product.name_en : product.name_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge_cn;
  const tags = lang === 'en' ? product.tags_en : product.tags_cn;

  return (
    <article className="group flex min-h-full flex-col border border-[#DADDE1] bg-white transition hover:-translate-y-0.5 hover:border-[#147C94]/60 hover:shadow-[0_18px_46px_rgba(24,44,54,0.13)]">
      <Link href={productHref(product)} className="relative block aspect-[4/3] overflow-hidden bg-[#EEF1F3] sm:aspect-square">
        <ProtectedImage
          src={product.image}
          alt={name}
          fill
          loading="lazy"
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 280px"
        />
        <div className="absolute left-3 top-3 bg-[#1F2A31]/88 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          {product.gen}
        </div>
        {badge ? (
          <div className="absolute bottom-3 left-3 bg-[#E36F2C] px-2.5 py-1 text-[11px] font-bold text-white">
            {badge}
          </div>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A9299]">
          <span>{product.productSeries}</span>
          <span>{product.size}</span>
        </div>
        <Link href={productHref(product)} className="text-base font-bold leading-snug text-[#1F2A31] break-words hover:text-[#147C94]">
          {name}
        </Link>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="border border-[#DADDE1] px-2 py-0.5 text-[11px] text-[#65707A]">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-3 border-t border-[#ECEFF1] pt-3">
          {productPrice(product, lang) ? (
            <span className="min-w-0 truncate text-sm font-semibold text-[#C65F22]">{productPrice(product, lang)}</span>
          ) : null}
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {uiLabels.detailsCta ? (
              <Link
                href={productHref(product)}
                className="inline-flex min-h-10 items-center justify-center bg-[#147C94] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#0E6479]"
              >
                {uiLabels.detailsCta}
              </Link>
            ) : null}
            {uiLabels.inquiryCta && inquiryHref ? (
              <Link
                href={inquiryHref}
                className="inline-flex min-h-10 items-center justify-center border border-[#E36F2C]/35 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#C65F22] transition hover:border-[#E36F2C] hover:bg-[#FFF4EC]"
              >
                {uiLabels.inquiryCta}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function SeriesSummary({
  products,
  uiLabels,
}: {
  products: CatalogProduct[];
  uiLabels: Record<string, string>;
}) {
  const series = Array.from(
    products.reduce((map, product) => {
      const current = map.get(product.productSeries) ?? { count: 0, image: '', href: '' };
      map.set(product.productSeries, {
        count: current.count + 1,
        image: current.image || product.image,
        href: current.href || buildHref({ q: product.productSeries, category: '', attribute: '', page: 1 }, {}),
      });
      return map;
    }, new Map<string, { count: number; image: string; href: string }>()),
  ).sort(([a], [b]) => a.localeCompare(b));

  if (series.length === 0 || !uiLabels.seriesHeading) return null;

  return (
    <div className="mb-5 border border-[#DADDE1] bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#1F2A31]">{uiLabels.seriesHeading}</h2>
        {uiLabels.seriesBody ? <p className="max-w-2xl text-xs leading-5 text-[#65707A]">{uiLabels.seriesBody}</p> : null}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {series.map(([code, item]) => (
          <Link
            key={code}
            href={item.href}
            className="group flex min-w-[120px] items-center justify-between gap-3 border border-[#E5E9EC] bg-[#FAFBFB] px-3 py-2 transition hover:border-[#147C94]/55 hover:bg-white"
          >
            <span className="text-sm font-black text-[#1F2A31]">{code}</span>
            {uiLabels.seriesCountSuffix ? (
              <span className="text-[11px] font-semibold text-[#65707A]">
                {item.count} {uiLabels.seriesCountSuffix}
              </span>
            ) : null}
            {uiLabels.seriesCta ? (
              <span className="sr-only">{uiLabels.seriesCta}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

function CatalogHighlights({ items }: { items: Array<{ id: string; label: string; value: string; body: string }> }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="border border-[#DADDE1] bg-white/86 p-3 backdrop-blur">
          <div className="flex items-baseline justify-between gap-3">
            {item.label ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#65707A]">{item.label}</p>
            ) : null}
            {item.value ? <p className="text-lg font-black text-[#147C94]">{item.value}</p> : null}
          </div>
          {item.body ? <p className="mt-1 text-[11px] leading-5 text-[#65707A]">{item.body}</p> : null}
        </div>
      ))}
    </div>
  );
}

function Pagination({
  filters,
  currentPage,
  totalPages,
}: {
  filters: DirectoryFilters;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 8);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <Link
        href={buildHref(filters, { page: Math.max(1, currentPage - 1) })}
        className="border border-[#DADDE1] bg-white px-3 py-2 text-sm font-semibold text-[#5C6670] hover:border-[#147C94]"
      >
        &lt;
      </Link>
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(filters, { page })}
          className={`border px-3 py-2 text-sm font-semibold ${
            page === currentPage
              ? 'border-[#147C94] bg-[#147C94] text-white'
              : 'border-[#DADDE1] bg-white text-[#5C6670] hover:border-[#147C94]'
          }`}
        >
          {page}
        </Link>
      ))}
      <Link
        href={buildHref(filters, { page: Math.min(totalPages, currentPage + 1) })}
        className="border border-[#DADDE1] bg-white px-3 py-2 text-sm font-semibold text-[#5C6670] hover:border-[#147C94]"
      >
        &gt;
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
  const uiItem = (id: string) => itemById(uiModule, id);
  const uiLabels = {
    categoryHeading: label('category-heading'),
    allProducts: label('all-products-label'),
    filters: label('filters-label'),
    searchPlaceholder: label('search-placeholder'),
    searchButton: label('search-button'),
    resetButton: label('reset-button'),
    rangePrefix: label('range-prefix'),
    rangeOf: label('range-of'),
    catalogTotal: label('catalog-total-label'),
    matchingProducts: label('matching-products-label'),
    activeFilters: label('active-filters-label'),
    queryFilter: label('query-filter-label'),
    categoryFilter: label('category-filter-label'),
    attributeFilter: label('attribute-filter-label'),
    clearFilter: label('clear-filter-label'),
    emptyState: label('empty-state'),
    emptyStateBody: label('empty-state-body'),
    detailsCta: label('details-cta'),
    inquiryCta: label('inquiry-cta'),
    seriesHeading: label('series-heading'),
    seriesBody: label('series-body'),
    seriesCountSuffix: label('series-count-suffix'),
    seriesCta: label('series-cta'),
  };
  const inquiryHref = displayHref(uiItem('inquiry-cta')?.href);
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
  const heroTitle = moduleTitle(heroModule, lang);
  const heroDescription = moduleDescription(heroModule, lang);
  const primaryCta = itemById(heroModule, 'primary-cta');
  const secondaryCta = itemById(heroModule, 'secondary-cta');
  const heroImage = itemById(heroModule, 'hero-image');
  const primaryCtaLabel = itemLabel(primaryCta, lang);
  const secondaryCtaLabel = itemLabel(secondaryCta, lang);
  const primaryCtaHref = displayHref(primaryCta?.href);
  const secondaryCtaHref = displayHref(secondaryCta?.href);
  const heroImageSrc = heroImage?.image_url || itemValue(heroImage, lang) || itemContent(heroImage, lang);
  const heroImageHref = displayHref(heroImage?.href);
  const heroImageAlt = itemLabel(heroImage, lang) || heroTitle;
  const breadcrumbHome = itemById(heroModule, 'breadcrumb-home');
  const breadcrumbCurrent = itemById(heroModule, 'breadcrumb-current');
  const breadcrumbHomeLabel = itemLabel(breadcrumbHome, lang);
  const breadcrumbCurrentLabel = itemLabel(breadcrumbCurrent, lang);
  const routeNote = itemById(heroModule, 'route-note');
  const routeNoteLabel = itemLabel(routeNote, lang);
  const routeNoteBody = itemContent(routeNote, lang);
  const hasRouteNote = Boolean(routeNoteLabel || routeNoteBody);
  const catalogHighlights = visibleItems(highlightsModule)
    .map((item) => ({
      id: item.id,
      label: itemLabel(item, lang),
      value: itemValue(item, lang),
      body: itemContent(item, lang),
    }))
    .filter((item) => item.label || item.value || item.body);

  return (
    <>
      <section className="border-b border-[#DADDE1] bg-[#EEF3F5] pt-16 sm:pt-20">
        <div className="mx-auto max-w-[1500px] px-4 pb-4 sm:px-6 lg:px-8">
          <div className={`grid gap-4 lg:items-stretch ${heroImageSrc ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)]' : hasRouteNote ? 'lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.34fr)] lg:items-center' : ''}`}>
            <div>
              {(breadcrumbHomeLabel || breadcrumbCurrentLabel) ? (
                <div className="text-xs text-[#65707A]">
                  {breadcrumbHomeLabel && breadcrumbHome?.href ? (
                    <Link href={displayHref(breadcrumbHome.href)} className="hover:text-[#147C94]">{breadcrumbHomeLabel}</Link>
                  ) : null}
                  {breadcrumbHomeLabel && breadcrumbCurrentLabel ? <span className="mx-2">/</span> : null}
                  {breadcrumbCurrentLabel ? <span>{breadcrumbCurrentLabel}</span> : null}
                </div>
              ) : null}
              {heroTitle ? (
                <h1 className="mt-2 text-3xl font-black tracking-normal text-[#1F2A31] sm:text-4xl">
                  {heroTitle}
                </h1>
              ) : null}
              {heroDescription ? (
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#5C6670] sm:text-sm">{heroDescription}</p>
              ) : null}
              {((primaryCtaLabel && primaryCtaHref) || (secondaryCtaLabel && secondaryCtaHref)) ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {primaryCtaLabel && primaryCtaHref ? (
                    <Link href={primaryCtaHref} className="inline-flex min-h-10 w-full items-center justify-center bg-[#E36F2C] px-4 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#C85A1F] sm:w-auto">
                      {primaryCtaLabel}
                    </Link>
                  ) : null}
                  {secondaryCtaLabel && secondaryCtaHref ? (
                    <Link href={secondaryCtaHref} className="inline-flex min-h-10 w-full items-center justify-center border border-[#C7CDD2] bg-white px-4 text-xs font-semibold text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] sm:w-auto">
                      {secondaryCtaLabel}
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {hasRouteNote ? (
                <div className="mt-3 max-w-xl border border-[#DADDE1] bg-white/90 p-3">
                  {routeNoteLabel ? (
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#147C94]">{routeNoteLabel}</p>
                  ) : null}
                  {routeNoteBody ? (
                    <p className="mt-1 text-[11px] leading-4 text-[#65707A]">{routeNoteBody}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {heroImageSrc ? (
              heroImageHref ? (
                <Link
                  href={heroImageHref}
                  data-products-hero-image="true"
                  className="group relative block min-h-52 overflow-hidden border border-white/70 bg-[#DADDE1] shadow-[0_20px_60px_rgba(31,42,49,0.14)] sm:min-h-64 lg:min-h-72"
                >
                  <ProtectedImage
                    src={heroImageSrc}
                    alt={heroImageAlt}
                    fill
                    priority
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111820]/35 via-transparent to-transparent" />
                </Link>
              ) : (
                <div
                  data-products-hero-image="true"
                  className="relative min-h-52 overflow-hidden border border-white/70 bg-[#DADDE1] shadow-[0_20px_60px_rgba(31,42,49,0.14)] sm:min-h-64 lg:min-h-72"
                >
                  <ProtectedImage
                    src={heroImageSrc}
                    alt={heroImageAlt}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111820]/35 via-transparent to-transparent" />
                </div>
              )
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8F8] py-2">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
          <div className="lg:hidden">
            <details className="border border-[#DADDE1] bg-white">
              <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-bold text-[#1F2A31]">{uiLabels.filters}</summary>
              <div className="border-t border-[#DADDE1] p-4">
                <Sidebar categories={categories} attributeTemplates={attributeTemplates} filters={filters} contactModule={contactModule} uiLabels={uiLabels} />
              </div>
            </details>
          </div>

          <div className="hidden lg:block lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
            <Sidebar categories={categories} attributeTemplates={attributeTemplates} filters={filters} contactModule={contactModule} uiLabels={uiLabels} />
          </div>

          <div className="min-w-0">
            <div className="mb-2 border border-[#DADDE1] bg-white p-2.5">
              <form action="/products" className="flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="category" value={filters.category} />
                <input type="hidden" name="attribute" value={filters.attribute} />
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder={uiLabels.searchPlaceholder}
                  className="min-h-9 flex-1 border border-[#DADDE1] px-3 text-sm outline-none focus:border-[#147C94]"
                />
                <button className="min-h-9 bg-[#147C94] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-[#0E6479]">
                  {uiLabels.searchButton}
                </button>
                {(filters.q || filters.category || filters.attribute) ? (
                  <Link
                    href="/products"
                    className="inline-flex min-h-9 items-center justify-center border border-[#DADDE1] px-4 text-sm font-semibold text-[#5C6670] hover:border-[#147C94]"
                  >
                    {uiLabels.resetButton}
                  </Link>
                ) : null}
              </form>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#ECEFF1] pt-2 text-xs text-[#65707A] sm:text-sm">
                <span>
                  {uiLabels.matchingProducts || uiLabels.rangePrefix} {rangeStart}-{rangeEnd} {uiLabels.rangeOf} {total}
                </span>
                <span>
                  {uiLabels.catalogTotal}: {products.length}
                </span>
              </div>
              {activeFilters.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {uiLabels.activeFilters ? (
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#65707A]">{uiLabels.activeFilters}</span>
                  ) : null}
                  {activeFilters.map((item) => (
                    <span key={item.key} className="inline-flex items-center gap-1 border border-[#DADDE1] bg-[#F7F8F8] px-3 py-1 text-xs font-semibold text-[#1F2A31]">
                      <span className="text-[#65707A]">{item.label}</span>
                      <span>{item.value}</span>
                    </span>
                  ))}
                  {uiLabels.clearFilter ? (
                    <Link href="/products" className="inline-flex items-center border border-[#147C94] px-3 py-1 text-xs font-bold text-[#147C94] hover:bg-[#147C94] hover:text-white">
                      {uiLabels.clearFilter}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            {pageProducts.length === 0 ? (
              <div className="border border-dashed border-[#C7CDD2] bg-white px-6 py-20 text-center text-sm text-[#65707A]">
                {uiLabels.emptyState ? <p className="font-semibold text-[#1F2A31]">{uiLabels.emptyState}</p> : null}
                {uiLabels.emptyStateBody ? <p className="mt-2">{uiLabels.emptyStateBody}</p> : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pageProducts.map((product) => (
                  <ProductCard key={product.id} product={product} uiLabels={uiLabels} inquiryHref={inquiryHref} />
                ))}
              </div>
            )}

            <CatalogHighlights items={catalogHighlights} />

            <div className="mt-6">
              <SeriesSummary products={products} uiLabels={uiLabels} />
            </div>

            <Pagination filters={filters} currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
      </section>
    </>
  );
}
