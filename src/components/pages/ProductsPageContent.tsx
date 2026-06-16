'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import ProtectedImage from '@/components/ProtectedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogProductPublicHref } from '@/lib/product-public-routes';
import { normalizeSiteHref } from '@/lib/site-links';
import {
  itemById,
  itemContent,
  itemLabel,
  moduleMap,
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

const PRODUCT_CARD_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px';

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

function formatCount(value: number | null | undefined) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? String(count) : '';
}

function localizedText(en: string | null | undefined, zh: string | null | undefined, lang: 'en' | 'zh') {
  return (lang === 'en' ? en : zh)?.trim() || (lang === 'en' ? zh : en)?.trim() || '';
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
}: {
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  filters: DirectoryFilters;
  contactModule: PublicPageModule | null;
  totalProducts: number;
}) {
  const { lang } = useLanguage();
  const headline = itemLabel(itemById(contactModule, 'headline'), lang);
  const body = itemContent(itemById(contactModule, 'body'), lang);
  const cta = itemById(contactModule, 'primary-cta');
  const ctaLabel = itemLabel(cta, lang);
  const ctaHref = displayHref(cta?.href);
  const showContact = contactModule?.is_visible !== false && (headline || body || (ctaLabel && ctaHref));

  return (
    <aside className="space-y-8">
      <div className="overflow-hidden bg-white shadow-[0_16px_44px_rgba(0,0,0,0.08)]">
        <div className="bg-[#E97936] px-5 py-5 text-[22px] font-black leading-tight text-white">
          Product Categories 产品分类
        </div>
        <FilterRow
          href={buildHref(filters, { category: '', attribute: '', page: 1 })}
          active={!filters.category && !filters.attribute}
          label="All categories"
          count={totalProducts}
        />
        {categories.length > 0 ? (
          <details className="group border-t border-[#E9E9E9]" open={Boolean(filters.category)}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 bg-white px-4 text-[15px] text-[#222] transition hover:text-[#E97936] [&::-webkit-details-marker]:hidden">
              <span>{fallbackCopy(lang, 'Default Configuration 默认配置', 'Default Configuration 默认配置')}</span>
              <span className="text-sm text-[#999] group-open:rotate-180">v</span>
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
          const fallbackTitle = index === 0
            ? 'Product Configuration 热销配置'
            : index === 1
              ? 'Area 面积'
              : index === 2
                ? 'Country 国家'
                : templateTitle;

          return (
            <details key={template.id} className="group border-t border-[#E9E9E9]" open={open}>
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 bg-white px-4 text-[15px] text-[#222] transition hover:text-[#E97936] [&::-webkit-details-marker]:hidden">
                <span>{templateTitle || fallbackTitle}</span>
                <span className="text-sm text-[#999] group-open:rotate-180">v</span>
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
          <div className="bg-[#E97936] px-5 py-5 text-[22px] font-black text-white">Contact Us</div>
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

function ProductCard({ product }: { product: CatalogProduct }) {
  const { lang } = useLanguage();
  const name = localizedText(product.name_en, product.name_cn, lang) || product.id;
  const subtitle = [product.productSeries, product.gen].filter(Boolean).join(' ');

  return (
    <article className="group overflow-hidden rounded-[8px] bg-white p-5 shadow-[0_18px_46px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(0,0,0,0.14)]">
      <Link prefetch={false} href={productHref(product)} className="relative block aspect-square overflow-hidden rounded-[2px] bg-[#E8E8E8]">
        {product.image ? (
          <ProtectedImage
            src={product.image}
            alt={name}
            fill
            loading="lazy"
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes={PRODUCT_CARD_IMAGE_SIZES}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#E8E8E8] text-sm font-semibold text-[#999]">
            VESSEL
          </div>
        )}
      </Link>
      <Link
        prefetch={false}
        href={productHref(product)}
        className="mt-5 block min-h-[56px] text-[16px] font-medium leading-7 text-[#222] transition hover:text-[#E97936]"
      >
        {name}
      </Link>
      {subtitle ? <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#999]">{subtitle}</p> : null}
    </article>
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
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <Link
        prefetch={false}
        href={buildHref(filters, { page: Math.max(1, currentPage - 1) })}
        className="flex h-10 min-w-10 items-center justify-center rounded bg-white px-3 text-sm font-semibold text-[#666] shadow-sm transition hover:bg-[#E97936] hover:text-white"
      >
        &lt;
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
        className="flex h-10 min-w-10 items-center justify-center rounded bg-white px-3 text-sm font-semibold text-[#666] shadow-sm transition hover:bg-[#E97936] hover:text-white"
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
  const contactModule = modules.get('contact-card') ?? null;
  const uiModule = modules.get('ui-labels') ?? null;
  const label = (id: string) => itemLabel(itemById(uiModule, id), lang);
  const uiLabels = {
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
    <section className="bg-[#F3F3F3] pb-16 pt-24 text-[#222] sm:pt-28">
      <div className="mx-auto max-w-[1300px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-sm text-[#333]">
          <Link prefetch={false} href="/" className="hover:text-[#E97936]">Home</Link>
          <span className="mx-2 text-[#999]">/</span>
          <span>ALL Products 所有产品</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-14">
          <Sidebar
            categories={categories}
            attributeTemplates={attributeTemplates}
            filters={filters}
            contactModule={contactModule}
            totalProducts={products.length}
          />

          <div className="min-w-0">
            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <h1 className="text-[22px] font-bold tracking-normal text-[#222] sm:text-[26px]">
                ALL Products 所有产品
              </h1>
              <form action="/products" className="flex w-full max-w-[480px] overflow-hidden rounded-[4px] bg-white shadow-sm">
                <input type="hidden" name="category" value={filters.category} />
                <input type="hidden" name="attribute" value={filters.attribute} />
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder={uiLabels.searchPlaceholder}
                  className="min-h-11 min-w-0 flex-1 px-4 text-sm text-[#333] outline-none placeholder:text-[#A7A7A7]"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[#E97936] px-7 text-sm font-semibold text-white transition hover:bg-[#CA6228]"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>{uiLabels.searchButton}</span>
                </button>
              </form>
            </div>

            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-sm text-[#777]">
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
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {pageProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <Pagination filters={filters} currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </section>
  );
}
