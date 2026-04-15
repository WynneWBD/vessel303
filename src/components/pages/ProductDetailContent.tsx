'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import type { ProductData } from '@/lib/products';

interface Props {
  product: ProductData;
  isLoggedIn: boolean;
  prevProduct: ProductData | null;
  nextProduct: ProductData | null;
}

export default function ProductDetailContent({ product, isLoggedIn, prevProduct, nextProduct }: Props) {
  const t = useT();

  return (
    <main className="bg-white text-[#1A1A1A]">
      {/* ── Hero ── */}
      <section className="relative min-h-[70vh] flex items-end pb-16 overflow-hidden bg-white">
        <Image
          src={product.image}
          alt={`${product.model} ${product.gen}`}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A18] via-[#1C1A18]/60 to-[#1C1A18]/20" />
        {/* Gold glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 30% 80%, ${product.accentColor}12, transparent)`,
          }}
        />

        {/* Breadcrumb */}
        <div className="absolute top-24 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-[#999999] tracking-wider">
              <Link href="/" className="hover:text-[#c9a84c] transition-colors">{t(i18n.productDetail.home)}</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-[#c9a84c] transition-colors">{t(i18n.productDetail.breadcrumbProducts)}</Link>
              <span>/</span>
              <span className="text-[#666666]">{product.model} {product.gen}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">
            VESSEL 微宿® · {product.series} · {product.tag}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-none mb-4">
            <span style={{ color: product.accentColor }}>{product.model}</span>
            <span className="text-[#1A1A1A] ml-4">{product.gen}</span>
          </h1>
          <p className="text-[#444444] text-lg sm:text-xl font-light mb-2 tracking-wider">{product.tagline}</p>
          <p className="text-[#888888] text-sm tracking-wider italic">{product.tagline2}</p>

          {/* Quick specs */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: t(i18n.productDetail.specArea), value: product.floorArea },
              { label: t(i18n.productDetail.specDimensions), value: `${product.dimensions.length/1000}m × ${product.dimensions.width/1000}m × ${product.dimensions.height/1000}m` },
              { label: t(i18n.productDetail.specPower), value: product.power },
              { label: t(i18n.productDetail.specCapacity), value: product.capacity },
              { label: t(i18n.productDetail.specWeight), value: product.weight },
            ].map((spec) => (
              <div key={spec.label} className="bg-black/50 backdrop-blur-sm border border-[#E0DCD6] px-4 py-2">
                <div className="text-[#888888] text-[10px] tracking-wider">{spec.label}</div>
                <div className="text-[#1A1A1A] font-bold text-sm tracking-wider">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Strip ── */}
      <div
        className="py-5 border-b border-[#F0EDE8]"
        style={{ background: `${product.accentColor}10` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="text-xs px-3 py-1 font-bold tracking-wider"
              style={{ background: `${product.accentColor}`, color: '#1C1A18' }}
            >
              {product.badge}
            </span>
            <span className="text-[#888888] text-sm tracking-wider">
              {t(i18n.productDetail.deliveryStrip)}
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
              className="text-sm font-bold px-6 py-2.5 tracking-wider transition-colors"
              style={{ background: product.accentColor, color: '#1C1A18' }}
            >
              {t(i18n.productDetail.inquireBtn)}
            </Link>
            <Link
              href="/products"
              className="text-sm px-6 py-2.5 border border-[#D0CCC6] text-[#444444] hover:border-white/40 transition-colors tracking-wider"
            >
              {t(i18n.productDetail.otherProducts)}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Price Block ── */}
        <section className="py-10 border-b border-[#F0EDE8]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-2 font-medium">{t(i18n.productDetail.priceLabel)}</div>
              {isLoggedIn ? (
                <div className="text-3xl font-black text-[#c9a84c] tracking-wider">
                  {product.priceDisplay}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black text-[#BBBBBB] tracking-wider blur-[6px] select-none">
                    {product.priceHidden}
                  </div>
                  <Link
                    href="/login"
                    className="text-xs px-4 py-2 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#1C1A18] transition-all tracking-wider"
                  >
                    {t(i18n.productDetail.loginToView)}
                  </Link>
                </div>
              )}
            </div>
            {isLoggedIn && (
              <p className="text-[#AAAAAA] text-xs tracking-wider max-w-xs">
                {t(i18n.productDetail.priceNote)}
              </p>
            )}
          </div>
        </section>

        {/* ── Design Philosophy ── */}
        <section className="py-20 border-b border-[#F0EDE8]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-4 font-medium">{t(i18n.productDetail.designLabel)}</div>
              <h2 className="text-3xl font-black text-[#1A1A1A] mb-6 leading-tight">
                {product.tagline2}
              </h2>
              <p className="text-[#666666] text-sm leading-loose">{product.designPhilosophy}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {product.zones.map((zone) => (
                  <span
                    key={zone}
                    className="text-xs px-3 py-1.5 border tracking-wider"
                    style={{ borderColor: `${product.accentColor}30`, color: `${product.accentColor}` }}
                  >
                    {zone}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] bg-white overflow-hidden">
              <Image
                src={product.image}
                alt={product.model}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${product.accentColor}15, transparent 50%)`,
                }}
              />
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section className="py-20 border-b border-[#F0EDE8]">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.productDetail.featuresLabel)}</div>
            <h2 className="text-3xl font-black text-[#1A1A1A]">{t(i18n.productDetail.featuresTitle)}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.features.map((feature, i) => (
              <div
                key={i}
                className="bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/30 transition-all duration-300 p-6 group"
              >
                <div
                  className="w-8 h-8 flex items-center justify-center text-sm font-black mb-4"
                  style={{ background: `${product.accentColor}20`, color: product.accentColor }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-[#1A1A1A] font-bold mb-2 tracking-wider">{feature.title}</h3>
                <p className="text-[#666666] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Space Configuration ── */}
        <section className="py-20 border-b border-[#F0EDE8]">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.productDetail.spacesLabel)}</div>
            <h2 className="text-3xl font-black text-[#1A1A1A]">{t(i18n.productDetail.spacesTitle)}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.spaces.map((space, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/20 transition-all"
              >
                <div
                  className="shrink-0 w-10 h-10 flex items-center justify-center font-black text-sm"
                  style={{ background: `${product.accentColor}15`, color: product.accentColor }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className="text-[#1A1A1A] font-bold text-sm mb-1 tracking-wider">{space.name}</div>
                  <div className="text-[#666666] text-sm leading-relaxed">{space.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Materials ── */}
        <section className="py-20 border-b border-[#F0EDE8]">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.productDetail.materialsLabel)}</div>
            <h2 className="text-3xl font-black text-[#1A1A1A]">{t(i18n.productDetail.materialsTitle)}</h2>
            <p className="text-[#888888] text-sm mt-3 max-w-xl mx-auto tracking-wider">
              {t(i18n.productDetail.materialsNote)}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.materials.map((mat, i) => (
              <div
                key={i}
                className="p-5 bg-white border border-[#E8E4DE] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: product.accentColor }} />
                <div className="pl-3">
                  <div className="text-[#1A1A1A] font-bold text-sm mb-1 tracking-wider">{mat.title}</div>
                  <div className="text-[#888888] text-xs tracking-wider">{mat.spec}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Full specs table */}
          <div className="mt-10 border border-[#E8E4DE] overflow-hidden">
            <div className="bg-white px-6 py-3 border-b border-[#E8E4DE]">
              <span className="text-[#888888] text-xs tracking-wider uppercase">{t(i18n.productDetail.specsLabel)}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-white/5">
              {[
                [t(i18n.productDetail.specModel), `${product.model} ${product.gen}`],
                [t(i18n.productDetail.specLength), `${product.dimensions.length}mm`],
                [t(i18n.productDetail.specWidth), `${product.dimensions.width}mm`],
                [t(i18n.productDetail.specHeight), `${product.dimensions.height}mm`],
                [t(i18n.productDetail.specFloorArea), product.floorArea],
                [t(i18n.productDetail.specPower), product.power],
                [t(i18n.productDetail.specWeight), product.weight],
                [t(i18n.productDetail.specCapacity), product.capacity],
                [t(i18n.productDetail.specSeries), product.series],
              ].map(([k, v]) => (
                <div key={k} className="p-4">
                  <div className="text-[#999999] text-[10px] tracking-wider mb-1">{k}</div>
                  <div className="text-[#1A1A1A] text-sm font-semibold tracking-wider">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 text-center">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-4 font-medium">{t(i18n.productDetail.startCoop)}</div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mb-4">
            {t(i18n.productDetail.interested).replace('{model}', product.model).replace('{gen}', product.gen)}
          </h2>
          <p className="text-[#888888] text-sm mb-10 max-w-lg mx-auto tracking-wider">
            {t(i18n.productDetail.consultDesc)}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
              className="text-sm font-bold px-8 py-3 tracking-wider transition-colors"
              style={{ background: product.accentColor, color: '#1C1A18' }}
            >
              {t(i18n.productDetail.inquireBtn)}
            </Link>
            <a
              href="tel:4008090303"
              className="text-sm px-8 py-3 border border-[#BBBBBB] text-[#1A1A1A] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors tracking-wider"
            >
              400-8090-303
            </a>
          </div>
        </section>
      </div>

      {/* ── Product Navigation ── */}
      {(prevProduct || nextProduct) && (
        <div className="border-t border-[#E8E4DE] bg-[#F0EDE8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 divide-x divide-white/8">
              <div className="py-6 pr-8">
                {prevProduct && (
                  <Link href={`/products/${prevProduct.slug}`} className="group flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#999999] group-hover:text-[#c9a84c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <div>
                      <div className="text-[#AAAAAA] text-xs mb-0.5">{t(i18n.productDetail.prevProductLabel)}</div>
                      <div className="text-[#1A1A1A] group-hover:text-[#c9a84c] transition-colors font-bold tracking-wider">
                        {prevProduct.model} {prevProduct.gen}
                      </div>
                    </div>
                  </Link>
                )}
              </div>
              <div className="py-6 pl-8 text-right">
                {nextProduct && (
                  <Link href={`/products/${nextProduct.slug}`} className="group inline-flex items-center gap-3">
                    <div>
                      <div className="text-[#AAAAAA] text-xs mb-0.5">{t(i18n.productDetail.nextProductLabel)}</div>
                      <div className="text-[#1A1A1A] group-hover:text-[#c9a84c] transition-colors font-bold tracking-wider">
                        {nextProduct.model} {nextProduct.gen}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-[#999999] group-hover:text-[#c9a84c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
