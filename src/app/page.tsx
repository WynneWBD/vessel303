'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function HeroSection() {
  const t = useT();
  return (
    <>
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1C1A18] hero-grid"
    >
      {/* Real hero background image */}
      <Image
        src="/images/hero-bg.jpg"
        alt="VESSEL 文旅智能装配建筑"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      {/* Dark overlay so text remains readable */}
      <div className="absolute inset-0 bg-[#1C1A18]/75 pointer-events-none" />
      {/* Gold ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(201,168,76,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Decorative corner lines */}
      <div className="absolute top-20 left-8 w-16 h-16 border-t border-l border-[#c9a84c]/30" />
      <div className="absolute top-20 right-8 w-16 h-16 border-t border-r border-[#c9a84c]/30" />
      <div className="absolute bottom-20 left-8 w-16 h-16 border-b border-l border-[#c9a84c]/30" />
      <div className="absolute bottom-20 right-8 w-16 h-16 border-b border-r border-[#c9a84c]/30" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 border border-[#c9a84c]/40 bg-[#c9a84c]/5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
          <span className="text-[#c9a84c] text-xs tracking-[0.2em] font-medium uppercase">
            {t(i18n.home.heroBadge)}
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-tight mb-4">
          <span className="text-white">{t(i18n.home.heroTitle1)}</span>
          <br />
          <span className="text-gold-gradient">{t(i18n.home.heroTitle2)}</span>
        </h1>

        {/* Subtitle */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6 mt-6">
          {[
            { icon: '🇪🇺', text: t(i18n.home.badge1) },
            { icon: '🇺🇸', text: t(i18n.home.badge2) },
            { icon: '🌍', text: t(i18n.home.badge3) },
            { icon: '🏗️', text: t(i18n.home.badge4) },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-[#E0DCD6] rounded-full text-sm text-white/70"
            >
              <span>{item.icon}</span>
              <span className="tracking-wider">{item.text}</span>
            </div>
          ))}
        </div>

        <p className="text-white/50 text-sm sm:text-base tracking-wider mb-12 max-w-xl mx-auto">
          {t(i18n.home.heroSubtitle)}
        </p>

        {/* Dual CTA — B2B / B2C */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch max-w-2xl mx-auto">

          {/* B2B CTA */}
          <div className="flex-1 group relative overflow-hidden border border-[#c9a84c]/60 bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 transition-all duration-300 p-6 text-left cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a84c]/5 rounded-full -translate-y-12 translate-x-12 group-hover:bg-[#c9a84c]/10 transition-all" />
            <div className="text-[#c9a84c] text-[10px] tracking-[0.3em] uppercase mb-2 font-medium">{t(i18n.home.b2bLabel)}</div>
            <div className="text-white text-xl font-bold mb-1 tracking-wider">{t(i18n.home.b2bTitle)}</div>
            <div className="text-white/50 text-xs mb-4 tracking-wider">{t(i18n.home.b2bSub)}</div>
            <a
              href="#procurement"
              className="inline-flex items-center gap-2 bg-[#c9a84c] text-[#1C1A18] text-sm font-bold px-6 py-2.5 hover:bg-[#b8973b] transition-colors tracking-wider"
            >
              {t(i18n.home.b2bBtn)}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {/* B2C CTA */}
          <div className="flex-1 group relative overflow-hidden border border-[#D0CCC6] bg-white/3 hover:bg-white/6 transition-all duration-300 p-6 text-left cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/3 rounded-full -translate-y-12 translate-x-12 group-hover:bg-white/5 transition-all" />
            <div className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-2 font-medium">{t(i18n.home.b2cLabel)}</div>
            <div className="text-white text-xl font-bold mb-1 tracking-wider">{t(i18n.home.b2cTitle)}</div>
            <div className="text-white/50 text-xs mb-4 tracking-wider">{t(i18n.home.b2cSub)}</div>
            <a
              href="#booking"
              className="inline-flex items-center gap-2 border border-white/40 text-white text-sm font-medium px-6 py-2.5 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors tracking-wider"
            >
              {t(i18n.home.b2cBtn)}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-white text-[10px] tracking-[0.3em] uppercase">{t(i18n.home.scrollDown)}</span>
        <div className="w-px h-8 bg-gradient-to-b from-white to-transparent animate-pulse" />
      </div>
    </section>
    {/* Hero → content gradient transition */}
    <div className="h-20 bg-gradient-to-b from-[#1C1A18] to-[#FAF7F2]" />
    </>
  );
}

/* ─────────────────────────────────────────────
   CERTIFICATIONS
───────────────────────────────────────────── */
function CertificationsSection() {
  const t = useT();
  const certs = [
    { region: t(i18n.home.certEuRegion), flag: '🇪🇺', name: 'CE Mark', desc: t(i18n.home.certEuDesc), standard: 'EN 1337 / EN 13501', color: '#003399' },
    { region: t(i18n.home.certUsRegion), flag: '🇺🇸', name: 'ICC / IBC', desc: t(i18n.home.certUsDesc), standard: 'IBC 2021 / ASTM E119', color: '#c9a84c' },
    { region: t(i18n.home.certCnRegion), flag: '🇨🇳', name: '国家建筑标准', desc: t(i18n.home.certCnDesc), standard: 'GB/T 51231-2016', color: '#c0392b' },
    { region: t(i18n.home.certIsoRegion), flag: '🌐', name: 'ISO 9001', desc: t(i18n.home.certIsoDesc), standard: 'ISO 9001:2015', color: '#27ae60' },
  ];

  return (
    <section id="certifications" className="py-20 bg-[#FAF7F2] border-t border-[#c9a84c]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.home.certLabel)}</div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#2C2A28] mb-3">
            {t(i18n.home.certTitle)}
          </h2>
          <p className="text-[#6B6560] text-sm tracking-wider max-w-xl mx-auto">
            {t(i18n.home.certSubtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {certs.map((cert) => (
            <div
              key={cert.name}
              className="relative bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/40 transition-all duration-300 p-6 group"
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${cert.color}80, transparent)` }}
              />

              <div className="text-3xl mb-3">{cert.flag}</div>
              <div className="text-[#c9a84c] text-[10px] tracking-[0.2em] uppercase mb-1 font-medium">
                {cert.region}
              </div>
              <div className="text-[#2C2A28] text-lg font-bold mb-1 tracking-wider">{cert.name}</div>
              <div className="text-[#6B6560] text-xs mb-3 leading-relaxed">{cert.desc}</div>
              <div
                className="inline-block text-[10px] px-2 py-1 font-mono tracking-wider border"
                style={{ color: cert.color, borderColor: `${cert.color}40` }}
              >
                {cert.standard}
              </div>

              {/* Verified badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <svg className="w-4 h-4 text-[#27ae60]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Highlight bar */}
        <div className="mt-8 p-4 border border-[#c9a84c]/20 bg-[#c9a84c]/5 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <span className="text-[#c9a84c] text-sm font-semibold tracking-wider">
            {t(i18n.home.certHighlight).split(' — ')[0]}
          </span>
          <span className="hidden sm:block text-[#BBBBBB]">|</span>
          <span className="text-[#6B6560] text-sm tracking-wider">
            {t(i18n.home.certHighlight).split(' — ')[1]}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PRODUCTS
───────────────────────────────────────────── */
function ProductsSection() {
  const t = useT();
  const products = [
    {
      model: 'E7 Gen6', tag: t(i18n.home.homeProd1Tag), size: '38㎡',
      title: t(i18n.home.homeProd1Title), desc: t(i18n.home.homeProd1Desc),
      features: [t(i18n.home.homeProd1F1), t(i18n.home.homeProd1F2), t(i18n.home.homeProd1F3), t(i18n.home.homeProd1F4)],
      image: '/images/e7-gen6.jpg', accentColor: '#c9a84c', badge: t(i18n.home.homeProd1Badge),
    },
    {
      model: 'E6 Gen6', tag: t(i18n.home.homeProd2Tag), size: '30㎡',
      title: t(i18n.home.homeProd2Title), desc: t(i18n.home.homeProd2Desc),
      features: [t(i18n.home.homeProd2F1), t(i18n.home.homeProd2F2), t(i18n.home.homeProd2F3), t(i18n.home.homeProd2F4)],
      image: '/images/e6-gen6.jpg', accentColor: '#4a8fc9', badge: t(i18n.home.homeProd2Badge),
    },
    {
      model: 'V9 Gen6', tag: t(i18n.home.homeProd3Tag), size: '38㎡',
      title: t(i18n.home.homeProd3Title), desc: t(i18n.home.homeProd3Desc),
      features: [t(i18n.home.homeProd3F1), t(i18n.home.homeProd3F2), t(i18n.home.homeProd3F3), t(i18n.home.homeProd3F4)],
      image: '/images/v9-gen6.jpg', accentColor: '#4ac97a', badge: t(i18n.home.homeProd3Badge),
    },
  ];

  return (
    <section id="products" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.home.productsLabel)}</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2C2A28] mb-4">
            {t(i18n.home.productsTitle)}
          </h2>
          <p className="text-[#6B6560] text-sm tracking-wider max-w-2xl mx-auto">
            {t(i18n.home.productsSubtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.model}
              className="group relative bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/40 transition-all duration-500 overflow-hidden flex flex-col"
            >
              {/* Product image */}
              <div className="relative h-52 bg-[#F0EDE8] overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.model}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Subtle dark gradient at bottom for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111]/80 via-transparent to-transparent" />

                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(ellipse 60% 40% at 50% 100%, ${product.accentColor}20, transparent)`,
                  }}
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className="text-[10px] font-bold px-2 py-1 tracking-wider"
                    style={{ background: `${product.accentColor}20`, color: product.accentColor, border: `1px solid ${product.accentColor}40` }}
                  >
                    {product.size}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold px-2 py-1 tracking-wider bg-[#c9a84c]/90 text-[#1C1A18]">
                    {product.badge}
                  </span>
                </div>

                {/* Model label */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono tracking-[0.2em] opacity-60"
                    style={{ color: product.accentColor }}
                  >
                    VESSEL · {product.model}
                  </span>
                  <span className="text-[#999999] text-[10px] tracking-wider">{product.tag}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="mb-3">
                  <div className="text-[#c9a84c] text-[10px] tracking-[0.25em] uppercase mb-1">{product.model} · {product.size}</div>
                  <h3 className="text-[#2C2A28] text-xl font-bold tracking-wide">{product.title}</h3>
                </div>

                <p className="text-[#6B6560] text-sm leading-relaxed mb-4 flex-1">{product.desc}</p>

                {/* Features */}
                <ul className="grid grid-cols-2 gap-1.5 mb-5">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-[#6B6560]">
                      <span style={{ color: product.accentColor }} className="text-[10px]">▸</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-3 border-t border-[#E8E4DE] pt-4">
                  <a
                    href="#procurement"
                    className="flex-1 text-center text-sm py-2.5 font-semibold tracking-wider transition-all duration-200"
                    style={{
                      background: `${product.accentColor}20`,
                      color: product.accentColor,
                      border: `1px solid ${product.accentColor}40`,
                    }}
                  >
                    {t(i18n.home.inquireBtn)}
                  </a>
                  <a
                    href="#products"
                    className="flex-1 text-center border border-[#D8D4CE] text-[#555555] text-sm py-2.5 hover:border-[#BBBBBB] hover:text-[#2C2A28] transition-all duration-200 tracking-wider"
                  >
                    {t(i18n.home.learnMore)}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
function StatsSection() {
  const t = useT();
  const stats = [
    { number: t(i18n.home.stat1Val), unit: '', label: t(i18n.home.stat1Title), sub: t(i18n.home.stat1Sub) },
    { number: t(i18n.home.stat2Val), unit: '', label: t(i18n.home.stat2Title), sub: t(i18n.home.stat2Sub) },
    { number: t(i18n.home.stat3Val), unit: '', label: t(i18n.home.stat3Title), sub: t(i18n.home.stat3Sub) },
    { number: t(i18n.home.stat4Val), unit: '', label: t(i18n.home.stat4Title), sub: t(i18n.home.stat4Sub) },
  ];

  return (
    <section
      id="stats"
      className="py-20 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FAF7F2 0%, #F2EFE8 50%, #FAF7F2 100%)',
      }}
    >
      {/* Gold horizontal lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-[#c9a84c]/10">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center py-10 px-6 text-center group hover:bg-[#c9a84c]/3 transition-colors duration-300"
            >
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-gold-gradient leading-none">
                  {stat.number}
                </span>
                {stat.unit && (
                  <span className="text-xl sm:text-2xl font-bold text-[#c9a84c]/80 mb-1">{stat.unit}</span>
                )}
              </div>
              <div className="text-[#2C2A28] font-semibold tracking-wider mb-1 text-sm sm:text-base">{stat.label}</div>
              <div className="text-[#6B6560] text-xs tracking-wider">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SCENARIOS
───────────────────────────────────────────── */
function ScenariosSection() {
  const t = useT();
  const scenarios = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      title: t(i18n.home.tourismTitle),
      subtitle: t(i18n.home.tourismSub),
      desc: t(i18n.home.tourismDesc),
      tags: [t(i18n.home.tourismTag1), t(i18n.home.tourismTag2), t(i18n.home.tourismTag3), t(i18n.home.tourismTag4)],
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: t(i18n.home.commercialTitle),
      subtitle: t(i18n.home.commercialSub),
      desc: t(i18n.home.commercialDesc),
      tags: [t(i18n.home.commercialTag1), t(i18n.home.commercialTag2), t(i18n.home.commercialTag3), t(i18n.home.commercialTag4)],
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
        </svg>
      ),
      title: t(i18n.home.publicTitle),
      subtitle: t(i18n.home.publicSub),
      desc: t(i18n.home.publicDesc),
      tags: [t(i18n.home.publicTag1), t(i18n.home.publicTag2), t(i18n.home.publicTag3), t(i18n.home.publicTag4)],
    },
  ];

  return (
    <section id="cases" className="py-24 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.home.scenariosLabel)}</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2C2A28] mb-4">
            {t(i18n.home.scenariosTitle)}
          </h2>
          <p className="text-[#6B6560] text-sm tracking-wider max-w-2xl mx-auto">
            {t(i18n.home.scenariosSubtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((scene, i) => (
            <div
              key={i}
              className="group bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/30 transition-all duration-300 p-8 relative overflow-hidden"
            >
              {/* Background number */}
              <div className="absolute -right-2 -top-4 text-8xl font-black text-white/3 select-none leading-none">
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Icon */}
              <div className="text-[#c9a84c] mb-4 relative z-10">{scene.icon}</div>

              <div className="relative z-10">
                <div className="text-[#c9a84c] text-[10px] tracking-[0.2em] uppercase mb-1 font-medium">
                  {scene.subtitle}
                </div>
                <h3 className="text-[#2C2A28] text-2xl font-bold mb-3 tracking-wide">{scene.title}</h3>
                <p className="text-[#6B6560] text-sm leading-relaxed mb-5">{scene.desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {scene.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-1 border border-[#c9a84c]/20 text-[#c9a84c]/70 tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   ABOUT / BRAND STORY
───────────────────────────────────────────── */
function AboutSection() {
  const t = useT();
  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 100% 50%, rgba(201,168,76,0.04), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <div>
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-4 font-medium">{t(i18n.home.aboutLabel)}</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2C2A28] mb-6 leading-tight">
              {t(i18n.home.slogan)}
              <br />
              <span className="text-gold-gradient">{t(i18n.home.aboutTitle)}</span>
            </h2>
            <p className="text-[#6B6560] text-sm leading-loose mb-6">
              {t(i18n.home.aboutDesc)}
            </p>
          </div>

          {/* Visual side */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 border border-[#c9a84c]/15 rotate-45" />
              {/* Inner ring */}
              <div className="absolute inset-8 border border-[#c9a84c]/10 rotate-12" />
              {/* Center block */}
              <div className="absolute inset-16 bg-white border border-[#c9a84c]/20 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-[#c9a84c] text-4xl font-black mb-2">8</div>
                <div className="text-[#555555] text-sm tracking-[0.2em] mb-4">{t(i18n.home.stat4Title)}</div>
                <div className="gold-divider w-12 mx-auto mb-4" />
                <div className="text-[#c9a84c] font-black text-2xl mb-1">VESSEL</div>
                <div className="text-[#999999] text-xs tracking-widest">{t(i18n.home.brandWatermark)}</div>
              </div>
              {/* Corner dots */}
              {[
                'top-0 left-0',
                'top-0 right-0',
                'bottom-0 left-0',
                'bottom-0 right-0',
              ].map((pos) => (
                <div key={pos} className={`absolute ${pos} w-2 h-2 bg-[#c9a84c]`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   INNOVATION
───────────────────────────────────────────── */
function InnovationSection() {
  const t = useT();
  const innovations = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      tag: t(i18n.home.innov1Tag), title: t(i18n.home.innov1Title), desc: t(i18n.home.innov1Desc), link: '/about', color: '#c9a84c',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      tag: t(i18n.home.innov2Tag), title: t(i18n.home.innov2Title), desc: t(i18n.home.innov2Desc), link: '/about', color: '#4ac97a',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      tag: t(i18n.home.innov3Tag), title: t(i18n.home.innov3Title), desc: t(i18n.home.innov3Desc), link: '/about', color: '#4a8fc9',
    },
  ];

  return (
    <section className="py-24 bg-white border-t border-[#c9a84c]/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.home.innovLabel)}</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2C2A28] mb-4">
            {t(i18n.home.innovTitle)}
          </h2>
          <p className="text-[#6B6560] text-sm tracking-wider max-w-xl mx-auto">
            {t(i18n.home.innovSubtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {innovations.map((item) => (
            <div
              key={item.title}
              className="group bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/30 transition-all duration-300 p-8 relative overflow-hidden"
            >
              {/* Accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${item.color}60, transparent)` }} />

              <div style={{ color: item.color }} className="mb-4">{item.icon}</div>

              <div
                className="text-[10px] tracking-[0.25em] uppercase mb-2 font-medium"
                style={{ color: item.color }}
              >
                {item.tag}
              </div>
              <h3 className="text-[#2C2A28] text-xl font-bold mb-3 tracking-wide">{item.title}</h3>
              <p className="text-[#6B6560] text-sm leading-relaxed mb-5">{item.desc}</p>

              <Link
                href={item.link}
                className="inline-flex items-center gap-1.5 text-xs tracking-wider transition-colors"
                style={{ color: `${item.color}80` }}
              >
                {t(i18n.home.learnMore)}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   NEWS PREVIEW
───────────────────────────────────────────── */
function NewsPreviewSection() {
  const t = useT();
  const news = [
    {
      tag: '要闻',
      date: '2025-11-03',
      title: '带轮式 VESSEL E3 Gen6 首秀广交会',
      preview: '全球首发带轮式 E3 Gen6，定制车架系统亮相 B 区展位，引爆全场。',
    },
    {
      tag: '品牌合作',
      date: '2024-12-12',
      title: '微宿 VESSEL 与华为 HUAWEI 正式签约合作',
      preview: '装配式预制建筑与华为全屋智能系统完美融合，共探智慧文旅新业态。',
    },
    {
      tag: '国际展会',
      date: '2025-07-03',
      title: '圣彼得堡国际经济论坛亮点展示',
      preview: '已落地 200+ 项目，出口 20 余国，VESSEL 站上国际舞台。',
    },
  ];

  return (
    <section className="py-20 bg-[#FAF7F2] border-t border-[#F0EDE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-2 font-medium">{t(i18n.home.aboutLabel)}</div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2C2A28]">{t(i18n.nav.news)}</h2>
          </div>
          <Link
            href="/news"
            className="text-[#c9a84c]/70 text-sm hover:text-[#c9a84c] transition-colors tracking-wider hidden sm:flex items-center gap-1"
          >
            {t(i18n.home.viewAll)}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {news.map((item, i) => (
            <Link
              key={i}
              href="/news"
              className="group block bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/25 transition-all overflow-hidden"
            >
              <div className="h-36 bg-[#E8E4DE] flex items-center justify-center">
                <span className="text-[#DDDDDD] text-xs tracking-wider">{item.title}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 text-[#c9a84c] border border-[#c9a84c]/30 bg-[#c9a84c]/5 tracking-wider">
                    {item.tag}
                  </span>
                  <span className="text-[#AAAAAA] text-xs">{item.date}</span>
                </div>
                <h3 className="text-[#2C2A28] font-bold text-sm mb-2 leading-snug group-hover:text-[#c9a84c] transition-colors tracking-wider">
                  {item.title}
                </h3>
                <p className="text-[#6B6560] text-xs leading-relaxed line-clamp-2">{item.preview}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/news" className="text-[#c9a84c]/70 text-sm tracking-wider">{t(i18n.home.viewAllNews)}</Link>
        </div>
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────
   PAGE ROOT
───────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />
      <HeroSection />
      <CertificationsSection />
      <ProductsSection />
      <InnovationSection />
      <StatsSection />
      <ScenariosSection />
      <AboutSection />
      <NewsPreviewSection />
      <Footer />
    </main>
  );
}
