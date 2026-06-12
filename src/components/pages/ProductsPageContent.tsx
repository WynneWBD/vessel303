'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
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

type DirectoryCategory = Pick<ProductCategoryRow, 'id' | 'title_zh' | 'title_en' | 'product_count'>;

interface Props {
  products: CatalogProduct[];
  pageSize: number;
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  pageModules: PublicPageModule[];
  initialFilters: DirectoryFilters;
}

const PRODUCTS_HERO_IMAGE_SIZES = '(max-width: 1024px) 100vw, (max-width: 1564px) 40vw, 560px';
const PRODUCT_CARD_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) calc((100vw - 356px) / 2), (max-width: 1564px) calc((100vw - 372px) / 3), 400px';

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

function fallbackCopy(lang: 'en' | 'zh', en: string, zh: string) {
  return lang === 'zh' ? zh : en;
}

function formatAreaNumber(value: number | null | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return '';
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1).replace(/\.0$/, '');
}

function productAreaLabel(product: CatalogProduct) {
  const value = formatAreaNumber(product.area);
  return value ? `${value} sqm` : product.size;
}

function areaRangeLabel(products: CatalogProduct[]) {
  const areas = products.map((product) => Number(product.area)).filter((area) => Number.isFinite(area) && area > 0);
  if (areas.length === 0) return '';
  const min = Math.min(...areas);
  const max = Math.max(...areas);
  return min === max ? `${formatAreaNumber(min)} sqm` : `${formatAreaNumber(min)}-${formatAreaNumber(max)} sqm`;
}

function productTypeLabel(productType: CatalogProduct['productType'], lang: 'en' | 'zh') {
  const labels: Record<CatalogProduct['productType'], { en: string; zh: string }> = {
    compact: { en: 'Compact', zh: '紧凑型' },
    standard: { en: 'Standard', zh: '标准型' },
    luxury: { en: 'Flagship', zh: '旗舰型' },
  };
  const label = labels[productType];
  return label ? fallbackCopy(lang, label.en, label.zh) : '';
}

function formatCount(value: number | null | undefined) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? String(count) : '';
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
  totalProducts,
  contactHeadingTag = 'h2',
}: {
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  filters: DirectoryFilters;
  contactModule: PublicPageModule | null;
  uiLabels: Record<string, string>;
  totalProducts: number;
  contactHeadingTag?: 'h2' | 'p';
}) {
  const { lang } = useLanguage();
  const eyebrow = itemLabel(itemById(contactModule, 'eyebrow'), lang);
  const headline = itemLabel(itemById(contactModule, 'headline'), lang);
  const body = itemContent(itemById(contactModule, 'body'), lang);
  const cta = itemById(contactModule, 'primary-cta');
  const ctaLabel = itemLabel(cta, lang);
  const ctaHref = displayHref(cta?.href);
  const ContactHeading = contactHeadingTag;

  return (
    <aside className="space-y-3">
      <div className="border border-[#DADDE1] bg-white">
        <div className="border-b border-[#DADDE1] bg-[#F5F7F8] px-4 py-2.5 text-sm font-bold text-[#1F2A31]">
          {uiLabels.categoryHeading}
        </div>
        <div className="divide-y divide-[#ECEFF1]">
          <Link prefetch={false}
            href={buildHref(filters, { category: '', page: 1 })}
            className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition ${
              !filters.category ? 'bg-[#EAF4F6] font-semibold text-[#147C94]' : 'text-[#5C6670] hover:bg-[#F7FAFA]'
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{uiLabels.allProducts}</span>
            <span className="shrink-0 rounded-sm bg-[#EEF3F5] px-2 py-0.5 text-[11px] font-bold text-[#53616B]">
              {totalProducts}
            </span>
          </Link>
          {categories.map((category) => {
            const categoryLabel = localizedText(category.title_en, category.title_zh, lang);
            if (!categoryLabel) return null;
            return (
              <Link prefetch={false}
                key={category.id}
                href={buildHref(filters, { category: String(category.id), page: 1 })}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition ${
                  filters.category === String(category.id)
                    ? 'bg-[#EAF4F6] font-semibold text-[#147C94]'
                    : 'text-[#5C6670] hover:bg-[#F7FAFA]'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{categoryLabel}</span>
                {formatCount(category.product_count) ? (
                  <span className="shrink-0 rounded-sm bg-[#EEF3F5] px-2 py-0.5 text-[11px] font-bold text-[#53616B]">
                    {formatCount(category.product_count)}
                  </span>
                ) : null}
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
                <Link prefetch={false}
                  key={option.id}
                  href={buildHref(filters, { attribute: String(option.id), page: 1 })}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition ${
                    filters.attribute === String(option.id)
                      ? 'bg-[#FFF4EC] font-semibold text-[#C65F22]'
                      : 'text-[#5C6670] hover:bg-[#F7FAFA]'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.displayLabel}</span>
                  {formatCount(option.product_count) ? (
                    <span className="shrink-0 rounded-sm bg-[#F8F0EA] px-2 py-0.5 text-[11px] font-bold text-[#9A4C1B]">
                      {formatCount(option.product_count)}
                    </span>
                  ) : null}
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
          {headline ? <ContactHeading className="mt-3 text-lg font-black leading-snug">{headline}</ContactHeading> : null}
          {body ? <p className="mt-3 text-sm leading-6 text-white/65">{body}</p> : null}
          {ctaLabel && ctaHref ? (
            <Link prefetch={false}
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
  categories,
  attributeTemplates,
}: {
  product: CatalogProduct;
  uiLabels: Record<string, string>;
  inquiryHref: string;
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
}) {
  const { lang } = useLanguage();
  const name = lang === 'en' ? product.name_en : product.name_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge_cn;
  const tags = lang === 'en' ? product.tags_en : product.tags_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const category = categoryTitle(
    categories.find((item) => item.id === product.category_id),
    lang,
  );
  const attributeLabels = (product.attribute_option_ids ?? [])
    .map((id) => attributeOptionTitle(attributeTemplates, String(id), lang))
    .filter(Boolean)
    .slice(0, 2);
  const displayPrice = productPrice(product, lang) || uiLabels.priceEmpty;
  const metaItems = [
    category,
    [product.productSeries, product.gen].filter(Boolean).join(' / '),
    ...attributeLabels,
  ].filter(Boolean);
  const decisionSpecs = [
    { label: fallbackCopy(lang, 'Area', '面积'), value: productAreaLabel(product) },
    { label: fallbackCopy(lang, 'Type', '类型'), value: productTypeLabel(product.productType, lang) },
    { label: fallbackCopy(lang, 'Series', '系列'), value: [product.productSeries, product.gen].filter(Boolean).join(' ') },
  ].filter((item) => item.value);

  return (
    <article className="group flex min-h-full flex-col border border-[#DADDE1] bg-white transition hover:-translate-y-0.5 hover:border-[#147C94]/60 hover:shadow-[0_18px_46px_rgba(24,44,54,0.13)]">
      <Link prefetch={false} href={productHref(product)} className="relative block aspect-[4/3] overflow-hidden bg-[#EEF1F3] sm:aspect-square">
        <ProtectedImage
          src={product.image}
          alt={name}
          fill
          loading="lazy"
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes={PRODUCT_CARD_IMAGE_SIZES}
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
        <Link prefetch={false} href={productHref(product)} className="text-base font-bold leading-snug text-[#1F2A31] break-words hover:text-[#147C94]">
          {name}
        </Link>
        {metaItems.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {metaItems.slice(0, 4).map((item) => (
              <span key={item} className="rounded-sm bg-[#F2F6F7] px-2 py-1 text-[11px] font-semibold leading-4 text-[#53616B]">
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {decisionSpecs.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 border border-[#E5E9EC] bg-[#F8FAFA]">
            {decisionSpecs.map((item) => (
              <div key={item.label} className="min-w-0 border-r border-[#E5E9EC] px-2 py-2 last:border-r-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A9299]">{item.label}</p>
                <p className="mt-1 truncate text-xs font-black text-[#1F2A31]">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="border border-[#DADDE1] px-2 py-0.5 text-[11px] text-[#65707A]">
              {tag}
            </span>
          ))}
        </div>
        {features.length > 0 ? (
          <ul className="mt-3 space-y-1 border-t border-[#ECEFF1] pt-3">
            {features.slice(0, 3).map((feature) => (
              <li key={feature} className="flex gap-2 text-xs leading-5 text-[#53616B]">
                <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-[#147C94]" />
                <span className="min-w-0">{feature}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3 border-t border-[#ECEFF1] pt-3">
          {displayPrice ? (
            <span className="min-w-0 truncate text-sm font-semibold text-[#C65F22]">{displayPrice}</span>
          ) : null}
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {uiLabels.detailsCta ? (
              <Link prefetch={false}
                href={productHref(product)}
                className="inline-flex min-h-10 items-center justify-center bg-[#147C94] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#0E6479]"
              >
                {uiLabels.detailsCta}
              </Link>
            ) : null}
            {uiLabels.inquiryCta && inquiryHref ? (
              <Link prefetch={false}
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
  className = '',
}: {
  products: CatalogProduct[];
  uiLabels: Record<string, string>;
  className?: string;
}) {
  const series = Array.from(
    products.reduce((map, product) => {
      const area = Number(product.area);
      const current = map.get(product.productSeries) ?? { count: 0, image: '', href: '', minArea: area, maxArea: area };
      map.set(product.productSeries, {
        count: current.count + 1,
        image: current.image || product.image,
        href: current.href || buildHref({ q: product.productSeries, category: '', attribute: '', page: 1 }, {}),
        minArea: Number.isFinite(area) && area > 0 ? Math.min(current.minArea, area) : current.minArea,
        maxArea: Number.isFinite(area) && area > 0 ? Math.max(current.maxArea, area) : current.maxArea,
      });
      return map;
    }, new Map<string, { count: number; image: string; href: string; minArea: number; maxArea: number }>()),
  ).sort(([a], [b]) => a.localeCompare(b));

  if (series.length === 0 || !uiLabels.seriesHeading) return null;

  return (
    <div className={`mb-5 border border-[#DADDE1] bg-white p-4 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#1F2A31]">{uiLabels.seriesHeading}</h2>
        {uiLabels.seriesBody ? <p className="max-w-2xl text-xs leading-5 text-[#65707A]">{uiLabels.seriesBody}</p> : null}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {series.map(([code, item]) => (
          <Link prefetch={false}
            key={code}
            href={item.href}
            className="group relative flex min-h-[120px] min-w-[190px] overflow-hidden border border-[#E5E9EC] bg-[#1F2A31] transition hover:border-[#147C94]/55"
          >
            {item.image ? (
              <ProtectedImage
                src={item.image}
                alt={code}
                fill
                loading="lazy"
                className="object-cover opacity-82 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
                sizes="220px"
              />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-t from-[#111820]/82 via-[#111820]/18 to-transparent" />
            <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-3 text-white">
              <span className="min-w-0">
                <span className="block text-base font-black">{code}</span>
                <span className="mt-1 block text-[11px] font-semibold text-white/75">
                  {item.minArea === item.maxArea
                    ? `${formatAreaNumber(item.minArea)} sqm`
                    : `${formatAreaNumber(item.minArea)}-${formatAreaNumber(item.maxArea)} sqm`}
                </span>
              </span>
              {uiLabels.seriesCountSuffix ? (
                <span className="shrink-0 bg-white/12 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                  {item.count} {uiLabels.seriesCountSuffix}
                </span>
              ) : null}
            </span>
            {uiLabels.seriesCta ? (
              <span className="sr-only">{uiLabels.seriesCta}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

function CatalogCommandPanel({
  products,
  filteredProducts,
  filters,
  activeFilters,
  categories,
  attributeTemplates,
  uiLabels,
  inquiryHref,
}: {
  products: CatalogProduct[];
  filteredProducts: CatalogProduct[];
  filters: DirectoryFilters;
  activeFilters: Array<{ key: string; label: string; value: string }>;
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  uiLabels: Record<string, string>;
  inquiryHref: string;
}) {
  const { lang } = useLanguage();
  const scopeProducts = filteredProducts.length > 0 ? filteredProducts : products;
  const seriesCount = new Set(scopeProducts.map((product) => product.productSeries).filter(Boolean)).size;
  const areaRange = areaRangeLabel(scopeProducts);
  const activeRoute = activeFilters.length > 0
    ? activeFilters.map((item) => `${item.label}: ${item.value}`).join(' / ')
    : fallbackCopy(lang, 'All published models', '全部已发布型号');
  const quickCategoryFilters = categories
    .filter((category) => Number(category.product_count ?? 0) > 0)
    .slice(0, 3)
    .map((category) => ({
      key: `category-${category.id}`,
      label: localizedText(category.title_en, category.title_zh, lang),
      count: category.product_count ?? 0,
      href: buildHref(filters, { category: String(category.id), page: 1 }),
      tone: 'category',
    }));
  const quickAttributeFilters = attributeTemplates
    .flatMap((template) =>
      template.options.map((option) => ({
        key: `option-${option.id}`,
        label: localizedText(option.label_en, option.label_zh, lang),
        count: option.product_count ?? 0,
        href: buildHref(filters, { attribute: String(option.id), page: 1 }),
        tone: 'attribute',
      })),
    )
    .filter((item) => item.label && item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const quickFilters = [...quickCategoryFilters, ...quickAttributeFilters].slice(0, 8);
  const stats = [
    {
      label: fallbackCopy(lang, 'Published models', '已发布型号'),
      value: formatCount(products.length) || '0',
      detail: fallbackCopy(lang, 'Live catalog', '公开目录'),
    },
    {
      label: uiLabels.matchingProducts || fallbackCopy(lang, 'Matching now', '当前匹配'),
      value: formatCount(filteredProducts.length) || '0',
      detail: activeFilters.length > 0 ? fallbackCopy(lang, 'After filters', '筛选后') : fallbackCopy(lang, 'No filter applied', '未筛选'),
    },
    {
      label: fallbackCopy(lang, 'Series', '系列'),
      value: formatCount(seriesCount) || '0',
      detail: fallbackCopy(lang, 'Visible in this scope', '当前范围'),
    },
    {
      label: fallbackCopy(lang, 'Area range', '面积区间'),
      value: areaRange || '-',
      detail: fallbackCopy(lang, 'For model sizing', '用于选型'),
    },
  ];

  return (
    <section className="mb-4 border border-[#C7CDD2] bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
        <div className="border-b border-[#DADDE1] p-4 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#147C94]">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                {fallbackCopy(lang, 'Catalog control', '目录控制台')}
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight text-[#1F2A31] sm:text-2xl">
                {fallbackCopy(lang, 'Filter first, compare fast, then open the model.', '先筛选，再比较，再进入型号详情。')}
              </h2>
            </div>
            <div className="max-w-md border border-[#E5E9EC] bg-[#F7F8F8] px-3 py-2 text-xs leading-5 text-[#65707A]">
              <span className="font-bold text-[#1F2A31]">{fallbackCopy(lang, 'Current route', '当前路径')}</span>
              <span className="mx-2 text-[#B8C0C6]">/</span>
              <span>{activeRoute}</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="border border-[#E5E9EC] bg-[#F8FAFA] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65707A]">{stat.label}</p>
                <p className="mt-2 text-2xl font-black text-[#1F2A31]">{stat.value}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#7A858E]">{stat.detail}</p>
              </div>
            ))}
          </div>
          {quickFilters.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#65707A]">
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                {fallbackCopy(lang, 'High-signal filters', '高频筛选')}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((item) => (
                  <Link
                    prefetch={false}
                    key={item.key}
                    href={item.href}
                    className={`inline-flex min-h-8 items-center gap-2 border px-3 text-xs font-bold transition ${
                      item.tone === 'category'
                        ? 'border-[#147C94]/25 bg-[#EAF4F6] text-[#147C94] hover:border-[#147C94]'
                        : 'border-[#E36F2C]/25 bg-[#FFF4EC] text-[#B4551D] hover:border-[#E36F2C]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="rounded-sm bg-white/80 px-1.5 py-0.5 text-[10px] text-[#53616B]">{item.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col justify-between gap-4 bg-[#1F2A31] p-4 text-white">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8FD5E1]">
              {fallbackCopy(lang, 'Buyer route', '采购路径')}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {fallbackCopy(
                lang,
                'Use filters to narrow the catalog, open the strongest model, then submit one inquiry from the matched product.',
                '用筛选缩小目录范围，打开最匹配型号，再从匹配产品提交询盘。',
              )}
            </p>
          </div>
          {uiLabels.inquiryCta && inquiryHref ? (
            <Link
              prefetch={false}
              href={inquiryHref}
              className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#E36F2C] px-4 text-xs font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#C85A1F]"
            >
              <span>{uiLabels.inquiryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
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
      <Link prefetch={false}
        href={buildHref(filters, { page: Math.max(1, currentPage - 1) })}
        className="border border-[#DADDE1] bg-white px-3 py-2 text-sm font-semibold text-[#5C6670] hover:border-[#147C94]"
      >
        &lt;
      </Link>
      {pages.map((page) => (
        <Link prefetch={false}
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
      <Link prefetch={false}
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
  const primaryCta = itemById(heroModule, 'primary-cta');
  const secondaryCta = itemById(heroModule, 'secondary-cta');
  const contactCta = itemById(contactModule, 'primary-cta');
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
    priceEmpty: label('price-empty'),
    seriesHeading: label('series-heading'),
    seriesBody: label('series-body'),
    seriesCountSuffix: label('series-count-suffix'),
    seriesCta: label('series-cta'),
  };
  const inquiryHref = displayHref(uiItem('inquiry-cta')?.href) || displayHref(primaryCta?.href) || displayHref(contactCta?.href);
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
  const heroTitle = moduleTitle(heroModule, lang);
  const heroDescription = moduleDescription(heroModule, lang);
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
                    <Link prefetch={false} href={displayHref(breadcrumbHome.href)} className="hover:text-[#147C94]">{breadcrumbHomeLabel}</Link>
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
                    <Link prefetch={false} href={primaryCtaHref} className="inline-flex min-h-10 w-full items-center justify-center bg-[#E36F2C] px-4 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#C85A1F] sm:w-auto">
                      {primaryCtaLabel}
                    </Link>
                  ) : null}
                  {secondaryCtaLabel && secondaryCtaHref ? (
                    <Link prefetch={false} href={secondaryCtaHref} className="inline-flex min-h-10 w-full items-center justify-center border border-[#C7CDD2] bg-white px-4 text-xs font-semibold text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94] sm:w-auto">
                      {secondaryCtaLabel}
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {hasRouteNote ? (
                <div className="mt-2 max-w-xl border border-[#DADDE1] bg-white/90 p-2.5 sm:mt-3 sm:p-3">
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
                <Link prefetch={false}
                  href={heroImageHref}
                  data-products-hero-image="true"
                  className="group relative block min-h-36 overflow-hidden border border-white/70 bg-[#DADDE1] shadow-[0_20px_60px_rgba(31,42,49,0.14)] sm:min-h-64 lg:min-h-72"
                >
                  <ProtectedImage
                    src={heroImageSrc}
                    alt={heroImageAlt}
                    fill
                    priority
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes={PRODUCTS_HERO_IMAGE_SIZES}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111820]/35 via-transparent to-transparent" />
                </Link>
              ) : (
                <div
                  data-products-hero-image="true"
                  className="relative min-h-36 overflow-hidden border border-white/70 bg-[#DADDE1] shadow-[0_20px_60px_rgba(31,42,49,0.14)] sm:min-h-64 lg:min-h-72"
                >
                  <ProtectedImage
                    src={heroImageSrc}
                    alt={heroImageAlt}
                    fill
                    priority
                    className="object-cover"
                    sizes={PRODUCTS_HERO_IMAGE_SIZES}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111820]/35 via-transparent to-transparent" />
                </div>
              )
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8F8] py-2">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <CatalogHighlights items={catalogHighlights} />
          <CatalogCommandPanel
            products={products}
            filteredProducts={filteredProducts}
            filters={filters}
            activeFilters={activeFilters}
            categories={categories}
            attributeTemplates={attributeTemplates}
            uiLabels={uiLabels}
            inquiryHref={inquiryHref}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="lg:hidden">
              <details className="border border-[#DADDE1] bg-white">
                <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 text-sm font-bold text-[#1F2A31]">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  <span>{uiLabels.filters}</span>
                </summary>
                <div className="border-t border-[#DADDE1] p-4">
                  <Sidebar categories={categories} attributeTemplates={attributeTemplates} filters={filters} contactModule={contactModule} uiLabels={uiLabels} totalProducts={products.length} contactHeadingTag="p" />
                </div>
              </details>
            </div>

            <div className="hidden lg:block lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
              <Sidebar categories={categories} attributeTemplates={attributeTemplates} filters={filters} contactModule={contactModule} uiLabels={uiLabels} totalProducts={products.length} />
            </div>

            <div className="flex min-w-0 flex-col">
              <SeriesSummary products={products} uiLabels={uiLabels} className="order-2 mt-2 lg:order-none lg:mt-0" />

            <div className="order-1 mb-2 border border-[#DADDE1] bg-white p-2.5 lg:order-none">
              <form action="/products" className="flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="category" value={filters.category} />
                <input type="hidden" name="attribute" value={filters.attribute} />
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder={uiLabels.searchPlaceholder}
                  className="min-h-9 flex-1 border border-[#DADDE1] px-3 text-sm outline-none focus:border-[#147C94]"
                />
                <button type="submit" className="inline-flex min-h-9 items-center justify-center gap-2 bg-[#147C94] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-[#0E6479]">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>{uiLabels.searchButton}</span>
                </button>
                {(filters.q || filters.category || filters.attribute) ? (
                  <Link prefetch={false}
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
                    <Link prefetch={false}
                      key={item.key}
                      href={removeFilterHref(item.key)}
                      aria-label={`${uiLabels.clearFilter || 'Clear'} ${item.label}: ${item.value}`}
                      className="inline-flex items-center gap-1 border border-[#DADDE1] bg-[#F7F8F8] px-3 py-1 text-xs font-semibold text-[#1F2A31] transition hover:border-[#147C94] hover:bg-[#EAF4F6]"
                    >
                      <span className="text-[#65707A]">{item.label}</span>
                      <span>{item.value}</span>
                      <X className="ml-1 h-3 w-3 text-[#147C94]" aria-hidden="true" />
                    </Link>
                  ))}
                  {uiLabels.clearFilter ? (
                    <Link prefetch={false} href="/products" className="inline-flex items-center border border-[#147C94] px-3 py-1 text-xs font-bold text-[#147C94] hover:bg-[#147C94] hover:text-white">
                      {uiLabels.clearFilter}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            {pageProducts.length === 0 ? (
              <div className="order-3 border border-dashed border-[#C7CDD2] bg-white px-6 py-20 text-center text-sm text-[#65707A] lg:order-none">
                {uiLabels.emptyState ? <p className="font-semibold text-[#1F2A31]">{uiLabels.emptyState}</p> : null}
                {uiLabels.emptyStateBody ? <p className="mt-2">{uiLabels.emptyStateBody}</p> : null}
              </div>
            ) : (
              <div className="order-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:order-none">
                {pageProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    uiLabels={uiLabels}
                    inquiryHref={inquiryHref}
                    categories={categories}
                    attributeTemplates={attributeTemplates}
                  />
                ))}
              </div>
            )}

            <div className="order-5 lg:order-none">
              <Pagination filters={filters} currentPage={currentPage} totalPages={totalPages} />
            </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
