'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import type { ProductData } from '@/lib/products';

function ProductCard({ product }: { product: ProductData }) {
  const t = useT();
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-[#111] border border-white/8 hover:border-[#c9a84c]/40 transition-all duration-500 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-52 bg-[#0d0d0d] overflow-hidden">
        <Image
          src={product.image}
          alt={`${product.model} ${product.gen}`}
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/80 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] font-bold px-2 py-1 tracking-wider"
            style={{
              background: `${product.accentColor}20`,
              color: product.accentColor,
              border: `1px solid ${product.accentColor}40`,
            }}
          >
            {product.size}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2 py-1 bg-[#c9a84c]/90 text-[#0a0a0a]">
            {product.badge}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-[0.2em] opacity-60" style={{ color: product.accentColor }}>
            VESSEL · {product.model} {product.gen}
          </span>
          <span className="text-white/30 text-[10px]">{product.tag}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="text-[#c9a84c] text-[10px] tracking-[0.25em] uppercase mb-1">
          {product.model} {product.gen} · {product.size}
        </div>
        <h3 className="text-white text-lg font-bold tracking-wide mb-2">{product.tagline}</h3>
        <p className="text-white/45 text-sm leading-relaxed mb-4 line-clamp-2">{product.tagline2}</p>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-xs text-white/30 mb-4 border-t border-white/8 pt-3">
          <span>{product.dimensions.length / 1000}m × {product.dimensions.width / 1000}m</span>
          <span>·</span>
          <span>{product.power}</span>
          <span>·</span>
          <span>{product.capacity}</span>
        </div>

        {/* CTA */}
        <div
          className="text-center text-xs py-2 font-semibold tracking-wider transition-all duration-200"
          style={{
            background: `${product.accentColor}15`,
            color: product.accentColor,
            border: `1px solid ${product.accentColor}30`,
          }}
        >
          {t(i18n.products.viewDetail)}
        </div>
      </div>
    </Link>
  );
}

interface Props {
  gen6Products: ProductData[];
  gen5Products: ProductData[];
}

export default function ProductsPageContent({ gen6Products, gen5Products }: Props) {
  const t = useT();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Gen6 Series */}
      <div className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-1 font-medium">{t(i18n.products.gen6Label)}</div>
            <h2 className="text-2xl font-black text-white tracking-wider">{t(i18n.products.gen6Title)}</h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-[#c9a84c]/30 to-transparent" />
          <span className="text-white/20 text-xs tracking-wider border border-white/10 px-3 py-1">
            {t(i18n.products.productCount).replace('{n}', String(gen6Products.length))}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {gen6Products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>

      {/* Gen5 Series */}
      <div>
        <div className="flex items-center gap-4 mb-8">
          <div>
            <div className="text-white/30 text-xs tracking-[0.3em] uppercase mb-1">{t(i18n.products.gen5Label)}</div>
            <h2 className="text-2xl font-black text-white tracking-wider">{t(i18n.products.gen5Title)}</h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          <span className="text-white/20 text-xs tracking-wider border border-white/10 px-3 py-1">
            {t(i18n.products.productCount).replace('{n}', String(gen5Products.length))}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {gen5Products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>

      {/* Compare table */}
      <div className="mt-20">
        <div className="text-center mb-10">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.products.tableLabel)}</div>
          <h2 className="text-2xl font-black text-white">{t(i18n.products.tableTitle)}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#c9a84c]/20">
                <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">{t(i18n.products.thModel)}</th>
                <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">{t(i18n.products.thSize)}</th>
                <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">{t(i18n.products.thArea)}</th>
                <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">{t(i18n.products.thPower)}</th>
                <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">{t(i18n.products.thCapacity)}</th>
                <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">{t(i18n.products.thScenario)}</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {gen6Products.map((p, i) => (
                <tr
                  key={p.slug}
                  className={`border-b border-white/5 hover:bg-[#c9a84c]/3 transition-colors ${
                    i === 0 ? 'bg-[#c9a84c]/3' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: p.accentColor }}
                      />
                      <span className="text-white font-bold tracking-wider">
                        {p.model} {p.gen}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white/50 font-mono text-xs">
                    {p.dimensions.length / 1000}m × {p.dimensions.width / 1000}m × {p.dimensions.height / 1000}m
                  </td>
                  <td className="py-4 px-4">
                    <span style={{ color: p.accentColor }} className="font-bold">{p.floorArea}</span>
                  </td>
                  <td className="py-4 px-4 text-white/50">{p.power}</td>
                  <td className="py-4 px-4 text-white/50">{p.capacity}</td>
                  <td className="py-4 px-4 text-white/50 text-xs">{p.tag}</td>
                  <td className="py-4 px-4">
                    <Link
                      href={`/products/${p.slug}`}
                      className="text-[#c9a84c] text-xs hover:underline tracking-wider"
                    >
                      {t(i18n.products.detailLink)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ highlight */}
      <div className="mt-16 p-8 border border-[#c9a84c]/15 bg-[#c9a84c]/3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              q: t(i18n.products.faq1Q),
              a: t(i18n.products.faq1A),
            },
            {
              q: t(i18n.products.faq2Q),
              a: t(i18n.products.faq2A),
            },
            {
              q: t(i18n.products.faq3Q),
              a: t(i18n.products.faq3A),
            },
          ].map((item) => (
            <div key={item.q}>
              <div className="text-[#c9a84c] font-bold text-sm mb-2 tracking-wider">{item.q}</div>
              <div className="text-white/50 text-sm leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
