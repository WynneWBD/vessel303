'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProtectedImage from '@/components/ProtectedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogProductPublicHref } from '@/lib/product-public-routes';
import { buildContactHref } from '@/lib/site-links';
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

function productInquiryHref(product: CatalogProduct) {
  return buildContactHref(`product_list:${product.id}:inquiry_cta`);
}

function productPrice(product: CatalogProduct, lang: 'en' | 'zh') {
  const price = lang === 'en' ? product.price_display_en : product.price_display_zh;
  return price || product.price_display_en || product.price_display_zh || 'Inquire for pricing';
}

function normalizePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
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

function useDirectoryFilters(): DirectoryFilters {
  const searchParams = useSearchParams();

  return useMemo(() => ({
    q: searchParams.get('q')?.trim() ?? '',
    category: searchParams.get('category')?.trim() ?? '',
    attribute: searchParams.get('attribute')?.trim() ?? '',
    page: normalizePage(searchParams.get('page')),
  }), [searchParams]);
}

function Sidebar({
  categories,
  attributeTemplates,
  filters,
}: {
  categories: DirectoryCategory[];
  attributeTemplates: ProductAttributeTemplateWithOptions[];
  filters: DirectoryFilters;
}) {
  const { lang } = useLanguage();

  return (
    <aside className="space-y-5">
      <div className="border border-[#DADDE1] bg-white">
        <div className="border-b border-[#DADDE1] bg-[#F5F7F8] px-4 py-3 text-sm font-bold text-[#1F2A31]">
          Product Categories 产品分类
        </div>
        <div className="divide-y divide-[#ECEFF1]">
          <Link
            href={buildHref(filters, { category: '', page: 1 })}
            className={`block px-4 py-3 text-sm transition ${
              !filters.category ? 'bg-[#EAF4F6] font-semibold text-[#147C94]' : 'text-[#5C6670] hover:bg-[#F7FAFA]'
            }`}
          >
            All Products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={buildHref(filters, { category: String(category.id), page: 1 })}
              className={`block px-4 py-3 text-sm transition ${
                filters.category === String(category.id)
                  ? 'bg-[#EAF4F6] font-semibold text-[#147C94]'
                  : 'text-[#5C6670] hover:bg-[#F7FAFA]'
              }`}
            >
              {lang === 'en' ? category.title_en : category.title_zh}
            </Link>
          ))}
        </div>
      </div>

      {attributeTemplates.map((template) => (
        <div key={template.id} className="border border-[#DADDE1] bg-white">
          <div className="border-b border-[#DADDE1] bg-[#F5F7F8] px-4 py-3">
            <p className="text-sm font-bold text-[#1F2A31]">
              {template.title_en} <span className="font-medium text-[#7A838B]">{template.title_zh}</span>
            </p>
          </div>
          <div className="divide-y divide-[#ECEFF1]">
            {template.options.map((option) => (
              <Link
                key={option.id}
                href={buildHref(filters, { attribute: String(option.id), page: 1 })}
                className={`block px-4 py-2.5 text-sm transition ${
                  filters.attribute === String(option.id)
                    ? 'bg-[#FFF4EC] font-semibold text-[#C65F22]'
                    : 'text-[#5C6670] hover:bg-[#F7FAFA]'
                }`}
              >
                {option.label_en} <span className="text-[#8A9299]">{option.label_zh}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { lang } = useLanguage();
  const name = lang === 'en' ? product.name_en : product.name_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge_cn;
  const tags = lang === 'en' ? product.tags_en : product.tags_cn;

  return (
    <article className="group flex min-h-full flex-col border border-[#DADDE1] bg-white transition hover:border-[#147C94]/60 hover:shadow-[0_14px_40px_rgba(24,44,54,0.12)]">
      <Link href={productHref(product)} className="relative block aspect-[4/3] overflow-hidden bg-[#EEF1F3]">
        <ProtectedImage
          src={product.image}
          alt={name}
          fill
          loading="lazy"
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 280px"
        />
        <div className="absolute left-3 top-3 bg-[#1F2A31]/88 px-2.5 py-1 text-[11px] font-bold text-white">
          {product.gen}
        </div>
        {badge ? (
          <div className="absolute bottom-3 left-3 bg-[#E36F2C] px-2.5 py-1 text-[11px] font-bold text-white">
            {badge}
          </div>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={productHref(product)} className="text-base font-bold leading-snug text-[#1F2A31] hover:text-[#147C94]">
          {name}
        </Link>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="border border-[#DADDE1] px-2 py-0.5 text-[11px] text-[#65707A]">{product.size}</span>
          <span className="border border-[#DADDE1] px-2 py-0.5 text-[11px] text-[#65707A]">{product.productSeries}</span>
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="border border-[#DADDE1] px-2 py-0.5 text-[11px] text-[#65707A]">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 border-t border-[#ECEFF1] pt-3">
          <span className="min-w-0 truncate text-sm font-semibold text-[#C65F22]">{productPrice(product, lang)}</span>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={productHref(product)}
              className="inline-flex min-h-10 items-center justify-center bg-[#147C94] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#0E6479]"
            >
              Details
            </Link>
            <Link
              href={productInquiryHref(product)}
              className="inline-flex min-h-10 items-center justify-center border border-[#E36F2C]/35 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#C65F22] transition hover:border-[#E36F2C] hover:bg-[#FFF4EC]"
            >
              Inquiry
            </Link>
          </div>
        </div>
      </div>
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
}: Props) {
  const { lang } = useLanguage();
  const rawFilters = useDirectoryFilters();
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
  const catalogHighlights = [
    {
      label: lang === 'zh' ? '产品总量' : 'Catalog',
      value: String(products.length),
      body: lang === 'zh' ? '后台已发布产品进入正式目录' : 'Published products feed the live catalog',
    },
    {
      label: lang === 'zh' ? '筛选维度' : 'Filters',
      value: String(categories.length + attributeTemplates.length),
      body: lang === 'zh' ? '分类、配置、面积和国家用于运营筛选' : 'Categories and attributes support buyer filtering',
    },
    {
      label: lang === 'zh' ? '咨询路径' : 'Inquiry',
      value: 'Source',
      body: lang === 'zh' ? '列表与详情咨询统一进入可追踪联系路径' : 'List and detail CTAs keep traceable source context',
    },
  ];

  return (
    <>
      <section className="border-b border-[#DADDE1] bg-[#EEF3F5] pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-xs text-[#65707A]">
            <Link href="/" className="hover:text-[#147C94]">Home</Link>
            <span className="mx-2">/</span>
            <span>Product_list</span>
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-normal text-[#1F2A31] sm:text-5xl">
            PRODUCTS
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5C6670]">
            {lang === 'en'
              ? 'Browse VESSEL product models by category, configuration, area and country.'
              : '按分类、配置、面积和国家浏览 VESSEL 产品目录。'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={buildContactHref('products:catalog_inquiry_cta')}
              className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-5 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#C85A1F]"
            >
              {lang === 'zh' ? '提交产品需求' : 'Send product brief'}
            </Link>
            <Link
              href="/cases"
              className="inline-flex min-h-11 items-center justify-center border border-[#C7CDD2] bg-white px-5 text-sm font-semibold text-[#1F2A31] transition hover:border-[#147C94] hover:text-[#147C94]"
            >
              {lang === 'zh' ? '查看项目案例' : 'View project cases'}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[#DADDE1] bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-3 lg:px-8">
          {catalogHighlights.map((item) => (
            <div key={item.label} className="border border-[#E5E9EC] bg-[#FAFBFB] p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#65707A]">{item.label}</p>
                <p className="text-xl font-black text-[#147C94]">{item.value}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#65707A]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F7F8F8] py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
          <div className="lg:hidden">
            <details className="border border-[#DADDE1] bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[#1F2A31]">Filters</summary>
              <div className="border-t border-[#DADDE1] p-4">
                <Sidebar categories={categories} attributeTemplates={attributeTemplates} filters={filters} />
              </div>
            </details>
          </div>

          <div className="hidden lg:block">
            <Sidebar categories={categories} attributeTemplates={attributeTemplates} filters={filters} />
          </div>

          <div className="min-w-0">
            <form action="/products" className="mb-5 flex flex-col gap-3 border border-[#DADDE1] bg-white p-4 sm:flex-row">
              <input type="hidden" name="category" value={filters.category} />
              <input type="hidden" name="attribute" value={filters.attribute} />
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Search 搜索"
                className="min-h-11 flex-1 border border-[#DADDE1] px-3 text-sm outline-none focus:border-[#147C94]"
              />
              <button className="min-h-11 bg-[#147C94] px-5 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-[#0E6479]">
                Search
              </button>
              {(filters.q || filters.category || filters.attribute) ? (
                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center justify-center border border-[#DADDE1] px-4 text-sm font-semibold text-[#5C6670] hover:border-[#147C94]"
                >
                  Reset
                </Link>
              ) : null}
            </form>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#65707A]">
              <span>
                Products {rangeStart}-{rangeEnd} of {total}
              </span>
              <span>
                Catalog total: {products.length}
              </span>
            </div>

            {pageProducts.length === 0 ? (
              <div className="border border-dashed border-[#C7CDD2] bg-white py-20 text-center text-sm text-[#65707A]">
                No matching products.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pageProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <Pagination filters={filters} currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
      </section>
    </>
  );
}
