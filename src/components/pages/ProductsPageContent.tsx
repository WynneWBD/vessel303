'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useT } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import PageHero from '@/components/PageHero';
import type { ProductData } from '@/lib/products';

type SizeFilter = 'all' | 'small' | 'medium' | 'large';
type TypeFilter = 'all' | 'compact' | 'standard' | 'luxury';
type GenFilter = 'all' | 6 | 5;
type SortKey = 'default' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
type ViewMode = 'grid' | 'list';

interface Props {
  products: ProductData[];
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
      className={`text-xs px-3 py-2 border tracking-wider bg-[#111] outline-none cursor-pointer transition-colors ${
        active
          ? 'border-[#c9a84c]/60 text-[#c9a84c]'
          : 'border-white/15 text-white/55 hover:border-white/30'
      }`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#111] text-white">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function GridCard({ product, t, lang }: { product: ProductData; t: ReturnType<typeof useT>; lang: 'en' | 'zh' }) {
  const tags = lang === 'en' ? product.tags_en : product.tags_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge;
  const hasDetailPage = product.slug !== 'e7-gen5';
  const href = hasDetailPage ? `/products/${product.slug}` : '/contact';

  return (
    <div className="group flex flex-col bg-[#111] border border-white/8 hover:border-[#c9a84c]/40 transition-all duration-300 overflow-hidden">
      {/* Image area */}
      <div className="relative aspect-video overflow-hidden bg-[#0d0d0d]">
        <Image
          src={product.image}
          alt={`${product.model} ${product.gen}`}
          fill
          loading="lazy"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top-left: Gen tag */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-bold px-2 py-1 bg-black/80 text-white tracking-wider">
            {product.gen}
          </span>
        </div>
        {/* Top-right: Area */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2 py-1 bg-white text-black tracking-wider">
            {product.size}
          </span>
        </div>
        {/* Bottom-left: Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-bold px-2.5 py-1 bg-[#c9a84c] text-[#0a0a0a] tracking-wider">
            {badge}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Model name */}
        <h3 className="text-white text-lg font-black tracking-wider mb-2">
          VESSEL {product.model} {product.gen}
        </h3>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-white/5 text-white/50 border border-white/10 tracking-wider"
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
              <li key={f} className="flex items-start gap-1.5 text-xs text-white/50">
                <span className="text-[#c9a84c] mt-0.5 text-[10px] shrink-0">▸</span>
                <span className="tracking-wide leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-white/8 pt-4 mt-auto">
          {/* Price row */}
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3 h-3 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-white/35 text-xs tracking-wider">{t(i18n.products.loginToView)}</span>
          </div>

          {/* CTA */}
          <Link
            href={href}
            className="block text-center text-xs py-2.5 font-semibold tracking-wider bg-[#0a0a0a] text-[#c9a84c] border border-[#c9a84c]/30 hover:bg-[#c9a84c] hover:text-[#0a0a0a] transition-all duration-200"
          >
            {t(i18n.products.viewDetails)}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ListCard({ product, t, lang }: { product: ProductData; t: ReturnType<typeof useT>; lang: 'en' | 'zh' }) {
  const tags = lang === 'en' ? product.tags_en : product.tags_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge;
  const hasDetailPage = product.slug !== 'e7-gen5';
  const href = hasDetailPage ? `/products/${product.slug}` : '/contact';

  return (
    <div className="group flex bg-[#111] border border-white/8 hover:border-[#c9a84c]/30 transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative w-[240px] shrink-0 overflow-hidden bg-[#0d0d0d]">
        <Image
          src={product.image}
          alt={`${product.model} ${product.gen}`}
          fill
          loading="lazy"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          sizes="240px"
        />
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] font-bold px-2 py-1 bg-[#c9a84c] text-[#0a0a0a] tracking-wider">
            {badge}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="text-[#c9a84c] text-[10px] tracking-[0.25em] uppercase mb-1">
                {product.gen} · {product.size}
              </div>
              <h3 className="text-white text-xl font-black tracking-wider">
                VESSEL {product.model} {product.gen}
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-black/60 text-white tracking-wider shrink-0">
              {product.gen}
            </span>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/5 text-white/50 border border-white/10 tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {features && features.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {features.map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-xs text-white/50">
                  <span className="text-[#c9a84c] text-[10px]">▸</span>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="tracking-wider">{t(i18n.products.loginToView)}</span>
          </div>
          <Link
            href={href}
            className="text-xs px-5 py-2 font-semibold tracking-wider bg-[#0a0a0a] text-[#c9a84c] border border-[#c9a84c]/30 hover:bg-[#c9a84c] hover:text-[#0a0a0a] transition-all duration-200"
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

  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [genFilter, setGenFilter] = useState<GenFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filtered = useMemo(() => {
    let list = [...products];

    if (sizeFilter === 'small')  list = list.filter((p) => p.area <= 25);
    if (sizeFilter === 'medium') list = list.filter((p) => p.area > 25 && p.area <= 35);
    if (sizeFilter === 'large')  list = list.filter((p) => p.area > 35);

    if (typeFilter !== 'all') list = list.filter((p) => p.productType === typeFilter);
    if (genFilter !== 'all')  list = list.filter((p) => p.generation === genFilter);

    switch (sortKey) {
      case 'price_asc':  list.sort((a, b) => a.area - b.area); break; // approximate by area
      case 'price_desc': list.sort((a, b) => b.area - a.area); break;
      case 'area_asc':   list.sort((a, b) => a.area - b.area); break;
      case 'area_desc':  list.sort((a, b) => b.area - a.area); break;
    }

    return list;
  }, [products, sizeFilter, typeFilter, genFilter, sortKey]);

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

  return (
    <>
      <PageHero
        label={t(i18n.products.heroLabel)}
        title="VESSEL®"
        titleGold={t(i18n.products.heroTitleGold)}
        subtitle={t(i18n.products.heroSubtitle)}
        breadcrumb={[
          { label: t(i18n.productDetail.home), href: '/' },
          { label: t(i18n.nav.products) },
        ]}
      />

      {/* Key specs bar */}
      <div className="bg-[#111] border-b border-[#c9a84c]/10">
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
                <span className="text-white/30 tracking-wider">{k}</span>
                <span className="text-[#c9a84c] font-semibold tracking-wider">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[72px] z-30 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort */}
            <Select
              value={sortKey}
              onChange={(v) => setSortKey(v as SortKey)}
              options={sortOptions}
              active={sortKey !== 'default'}
            />

            {/* View toggle */}
            <div className="flex border border-white/15 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                title={t(i18n.products.gridView)}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#c9a84c] text-[#0a0a0a]' : 'text-white/40 hover:text-white/70'}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="0" y="0" width="6" height="6" /><rect x="10" y="0" width="6" height="6" />
                  <rect x="0" y="10" width="6" height="6" /><rect x="10" y="10" width="6" height="6" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                title={t(i18n.products.listView)}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#c9a84c] text-[#0a0a0a]' : 'text-white/40 hover:text-white/70'}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="0" y="0" width="16" height="3" /><rect x="0" y="6" width="16" height="3" />
                  <rect x="0" y="12" width="16" height="3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Count */}
          <div className="mt-2 text-white/35 text-xs tracking-wider">
            {t(i18n.products.foundCount).replace('{n}', String(filtered.length))}
          </div>
        </div>
      </div>

      {/* Product grid / list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-white/30 text-sm tracking-wider">
            {t(i18n.products.noResults)}
          </div>
        ) : viewMode === 'grid' ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-opacity duration-150"
          >
            {filtered.map((p) => (
              <GridCard key={p.slug} product={p} t={t} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="space-y-4 transition-opacity duration-150">
            {filtered.map((p) => (
              <ListCard key={p.slug} product={p} t={t} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
