'use client';

import ProtectedImage from '@/components/ProtectedImage';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useT } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import type { CatalogProduct, ProductSeriesCode } from '@/lib/products';

type SizeFilter = 'all' | 'small' | 'medium' | 'large';
type TypeFilter = 'all' | 'compact' | 'standard' | 'luxury';
type GenFilter = 'all' | 6 | 5;
type SeriesFilter = 'all' | ProductSeriesCode;
type SortKey = 'default' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
type ViewMode = 'grid' | 'list';

const SERIES_LIST: SeriesFilter[] = ['all', 'E3', 'E5', 'E6', 'E7', 'V3', 'V5', 'V7', 'V9', 'S5'];

interface Props {
  products: CatalogProduct[];
}

function Select({
  value,
  onChange,
  options,
  active,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  active: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs px-3 py-2 border tracking-wider bg-white outline-none cursor-pointer transition-colors ${
        active
          ? 'border-[#E36F2C]/60 text-[#E36F2C]'
          : 'border-[#E5DED4] text-[#5F5750] hover:border-[#C4B9AB]'
      }`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-white text-[#2C2A28]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function GridCard({ product, t, lang }: { product: CatalogProduct; t: ReturnType<typeof useT>; lang: 'en' | 'zh' }) {
  const tags = lang === 'en' ? product.tags_en : product.tags_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge_cn;
  const href = product.detailSlug ? `/products/${product.detailSlug}` : `/products/${product.id}`;

  return (
    <div className="group flex flex-col bg-white border border-[#E5DED4] hover:border-[#E36F2C]/45 transition-all duration-300 overflow-hidden shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
      {/* Image area */}
      <div className="relative aspect-video overflow-hidden bg-[#E5DED4]">
        <ProtectedImage
          src={product.image}
          alt={lang === 'en' ? product.name_en : product.name_cn}
          fill
          loading="lazy"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top-left: Gen tag */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-bold px-2 py-1 bg-[#241F1B]/80 text-white tracking-wider">
            {product.gen}
          </span>
        </div>
        {/* Top-right: Area */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2 py-1 bg-white text-[#241F1B] tracking-wider">
            {product.size}
          </span>
        </div>
        {/* Bottom-left: Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-bold px-2.5 py-1 bg-[#E36F2C] text-white tracking-wider">
            {badge}
          </span>
        </div>
        {/* Bottom-right: Custom indicator */}
        {product.isCustom && (
          <div className="absolute bottom-3 right-3">
            <span className="text-[10px] px-2 py-1 bg-[#241F1B]/70 text-white tracking-wider border border-white/30">
              {lang === 'en' ? 'Custom' : '定制'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Model name */}
        <h3 className="text-[#2C2A28] text-base font-black tracking-wider mb-1 leading-snug">
          {lang === 'en' ? product.name_en : product.name_cn}
        </h3>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-[#FAF7F2] text-[#5F5750] border border-[#E5DED4] tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Features */}
        {features && features.length > 0 && (
          <ul className="space-y-1 mb-4 flex-1">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-1.5 text-xs text-[#5F5750]">
                <span className="text-[#E36F2C] mt-0.5 text-[10px] shrink-0">▸</span>
                <span className="tracking-wide leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-[#E5DED4] pt-4 mt-auto">
          {/* Price row */}
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3 h-3 text-[#999999] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[#8A7D74] text-xs tracking-wider">{t(i18n.products.loginToView)}</span>
          </div>

          {/* CTA */}
          <Link
            href={href}
            className="block text-center text-xs py-2.5 font-semibold tracking-wider bg-[#E36F2C] text-white border border-[#E36F2C] hover:bg-[#C85A1F] hover:border-[#C85A1F] transition-all duration-200"
          >
            {t(i18n.products.viewDetails)}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ListCard({ product, t, lang }: { product: CatalogProduct; t: ReturnType<typeof useT>; lang: 'en' | 'zh' }) {
  const tags = lang === 'en' ? product.tags_en : product.tags_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge_cn;
  const href = product.detailSlug ? `/products/${product.detailSlug}` : `/products/${product.id}`;

  return (
    <div className="group flex bg-white border border-[#E5DED4] hover:border-[#E36F2C]/45 transition-all duration-300 overflow-hidden shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
      {/* Image */}
      <div className="relative w-[240px] shrink-0 overflow-hidden bg-[#E5DED4]">
        <ProtectedImage
          src={product.image}
          alt={lang === 'en' ? product.name_en : product.name_cn}
          fill
          loading="lazy"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          sizes="240px"
        />
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] font-bold px-2 py-1 bg-[#E36F2C] text-white tracking-wider">
            {badge}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="text-[#E36F2C] text-[10px] tracking-[0.25em] uppercase mb-1">
                {product.gen} · {product.size}
              </div>
              <h3 className="text-[#2C2A28] text-lg font-black tracking-wider leading-snug">
                {lang === 'en' ? product.name_en : product.name_cn}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] font-bold px-2 py-1 bg-[#241F1B]/70 text-white tracking-wider">
                {product.gen}
              </span>
              {product.isCustom && (
                <span className="text-[10px] px-2 py-0.5 border border-[#E5DED4] text-[#5F5750] tracking-wider">
                  {lang === 'en' ? 'Custom' : '定制'}
                </span>
              )}
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#FAF7F2] text-[#5F5750] border border-[#E5DED4] tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {features && features.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {features.map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-xs text-[#5F5750]">
                  <span className="text-[#E36F2C] text-[10px]">▸</span>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5DED4]">
          <div className="flex items-center gap-2 text-[#999999] text-xs">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="tracking-wider">{t(i18n.products.loginToView)}</span>
          </div>
          <Link
            href={href}
            className="text-xs px-5 py-2 font-semibold tracking-wider bg-[#E36F2C] text-white border border-[#E36F2C] hover:bg-[#C85A1F] hover:border-[#C85A1F] transition-all duration-200"
          >
            {t(i18n.products.viewDetails)}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPageContent({ products }: Props) {
  const t = useT();
  const { lang } = useLanguage();

  const [seriesFilter, setSeriesFilter] = useState<SeriesFilter>('all');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [genFilter, setGenFilter] = useState<GenFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filtered = useMemo(() => {
    let list = [...products];

    if (seriesFilter !== 'all') list = list.filter((p) => p.productSeries === seriesFilter);
    if (sizeFilter === 'small')  list = list.filter((p) => p.area <= 25);
    if (sizeFilter === 'medium') list = list.filter((p) => p.area > 25 && p.area <= 35);
    if (sizeFilter === 'large')  list = list.filter((p) => p.area > 35);
    if (typeFilter !== 'all') list = list.filter((p) => p.productType === typeFilter);
    if (genFilter !== 'all')  list = list.filter((p) => p.generation === genFilter);

    switch (sortKey) {
      case 'price_asc':  list.sort((a, b) => a.area - b.area); break;
      case 'price_desc': list.sort((a, b) => b.area - a.area); break;
      case 'area_asc':   list.sort((a, b) => a.area - b.area); break;
      case 'area_desc':  list.sort((a, b) => b.area - a.area); break;
    }

    return list;
  }, [products, seriesFilter, sizeFilter, typeFilter, genFilter, sortKey]);

  const sizeOptions = [
    { value: 'all', label: t(i18n.products.filterSizeAll) },
    { value: 'small', label: t(i18n.products.filterSizeS) },
    { value: 'medium', label: t(i18n.products.filterSizeM) },
    { value: 'large', label: t(i18n.products.filterSizeL) },
  ];
  const typeOptions = [
    { value: 'all', label: t(i18n.products.filterTypeAll) },
    { value: 'compact', label: t(i18n.products.filterTypeCompact) },
    { value: 'standard', label: t(i18n.products.filterTypeStd) },
    { value: 'luxury', label: t(i18n.products.filterTypeLux) },
  ];
  const genOptions = [
    { value: 'all', label: t(i18n.products.filterGenAll) },
    { value: '6', label: t(i18n.products.filterGen6) },
    { value: '5', label: t(i18n.products.filterGen5) },
  ];
  const sortOptions = [
    { value: 'default', label: t(i18n.products.sortDefault) },
    { value: 'price_asc', label: t(i18n.products.sortPriceAsc) },
    { value: 'price_desc', label: t(i18n.products.sortPriceDesc) },
    { value: 'area_asc', label: t(i18n.products.sortAreaAsc) },
    { value: 'area_desc', label: t(i18n.products.sortAreaDesc) },
  ];
  const heroSubtitle =
    lang === 'zh'
      ? '45天预制 · 2小时安装 · 欧盟/美国认证 · 全球交付'
      : '45-day production · 2-hour install · EU+US certified · global delivery';

  return (
    <>
      <section className="relative overflow-hidden bg-[#F5F2ED] border-b border-[#E5DED4] pt-28 sm:pt-32 pb-8 lg:pb-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#E36F2C]" />
        <div className="absolute right-0 top-0 h-full w-2/3 bg-[radial-gradient(circle_at_80%_35%,rgba(227,111,44,0.16),transparent_42%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <nav className="flex items-center gap-2 text-xs text-[#8A7D74] mb-8 tracking-wider">
            <Link href="/" className="hover:text-[#E36F2C] transition-colors">
              {t(i18n.productDetail.home)}
            </Link>
            <span>/</span>
            <span>{t(i18n.nav.products)}</span>
          </nav>

          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.48fr)] gap-8 lg:gap-12 items-center min-h-[260px]">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-semibold">
                  VESSEL®
                </span>
                <span className="h-px w-10 bg-[#E36F2C]/35" />
                <span className="text-[#8A7D74] text-xs tracking-[0.22em] uppercase">
                  {t(i18n.products.heroLabel)}
                </span>
              </div>
              <h1 className="text-[#241F1B] text-4xl sm:text-5xl lg:text-[56px] font-black leading-tight tracking-normal mb-5 max-w-4xl">
                {t(i18n.products.heroTitleGold)}
              </h1>
              <p className="text-[#6B625B] text-base sm:text-lg leading-relaxed max-w-2xl">
                {heroSubtitle}
              </p>
            </div>

            <div className="hidden md:block relative h-52 lg:h-60">
              <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0),rgba(255,255,255,0.58)_42%,rgba(227,111,44,0.10))]" />
              <ProtectedImage
                src="/images/products/V9-Gen6_render-01.jpg"
                alt={lang === 'en' ? 'VESSEL V9 Gen6 smart prefab architecture' : 'VESSEL V9 Gen6 文旅智能装配建筑'}
                fill
                priority
                sizes="(max-width: 1024px) 40vw, 420px"
                className="object-contain object-center drop-shadow-[0_30px_60px_rgba(44,42,40,0.18)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key specs bar */}
      <div className="bg-[#FAF7F2] border-b border-[#E5DED4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              [t(i18n.products.specSize), t(i18n.products.specSizeVal)],
              [t(i18n.products.specProd), t(i18n.products.specProdVal)],
              [t(i18n.products.specInstall), t(i18n.products.specInstallVal)],
              [t(i18n.products.specTemp), t(i18n.products.specTempVal)],
              [t(i18n.products.specTransport), t(i18n.products.specTransportVal)],
              [t(i18n.products.specHS), t(i18n.products.specHSVal)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-sm">
                <span className="text-[#8A7D74] tracking-wider">{k}</span>
                <span className="text-[#E36F2C] font-semibold tracking-wider">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[72px] z-30 bg-[#F5F2ED]/95 backdrop-blur-sm border-b border-[#E5DED4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">

          {/* Row 1: Series quick filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SERIES_LIST.map((s) => (
              <button
                key={s}
                onClick={() => setSeriesFilter(s)}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 tracking-widest border transition-all duration-150 ${
                  seriesFilter === s
                    ? 'bg-[#E36F2C] text-white border-[#E36F2C]'
                    : 'bg-transparent text-[#E36F2C]/80 border-[#E36F2C]/40 hover:border-[#E36F2C] hover:text-[#E36F2C]'
                }`}
              >
                {s === 'all' ? (lang === 'en' ? 'ALL' : '全部') : s}
              </button>
            ))}
          </div>

          {/* Row 2: Dropdowns + sort + view */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Select
              value={sizeFilter}
              onChange={(v) => setSizeFilter(v as SizeFilter)}
              options={sizeOptions}
              active={sizeFilter !== 'all'}
            />
            <Select
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as TypeFilter)}
              options={typeOptions}
              active={typeFilter !== 'all'}
            />
            <Select
              value={String(genFilter)}
              onChange={(v) => setGenFilter(v === 'all' ? 'all' : Number(v) as 5 | 6)}
              options={genOptions}
              active={genFilter !== 'all'}
            />

            <div className="flex-1" />

            <Select
              value={sortKey}
              onChange={(v) => setSortKey(v as SortKey)}
              options={sortOptions}
              active={sortKey !== 'default'}
            />

            {/* View toggle */}
            <div className="flex border border-[#E5DED4] overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('grid')}
                title={t(i18n.products.gridView)}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#E36F2C] text-white' : 'text-[#8A7D74] hover:text-[#2C2A28]'}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="0" y="0" width="6" height="6" /><rect x="10" y="0" width="6" height="6" />
                  <rect x="0" y="10" width="6" height="6" /><rect x="10" y="10" width="6" height="6" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                title={t(i18n.products.listView)}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#E36F2C] text-white' : 'text-[#8A7D74] hover:text-[#2C2A28]'}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="0" y="0" width="16" height="3" /><rect x="0" y="6" width="16" height="3" />
                  <rect x="0" y="12" width="16" height="3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Count */}
          <div className="mt-1.5 text-[#8A7D74] text-xs tracking-wider">
            {t(i18n.products.foundCount).replace('{n}', String(filtered.length))}
          </div>
        </div>
      </div>

      {/* Product grid / list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-[#999999] text-sm tracking-wider">
            {t(i18n.products.noResults)}
          </div>
        ) : viewMode === 'grid' ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 transition-opacity duration-150 ${
            filtered.length === 1 ? 'lg:grid-cols-[minmax(0,520px)] justify-center' : 'lg:grid-cols-4'
          }`}>
            {filtered.map((p) => (
              <GridCard key={p.id} product={p} t={t} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="space-y-4 transition-opacity duration-150">
            {filtered.map((p) => (
              <ListCard key={p.id} product={p} t={t} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
