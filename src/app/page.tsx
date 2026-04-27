'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProtectedImage from '@/components/ProtectedImage';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TechDrawer from '@/components/TechDrawer';
import { useT, useLanguage } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

type Tech = 'viie' | 'vols' | 'vipc';

// ─── Hero ────────────────────────────────────────────────

const HERO_IMAGES = [
  '/images/hero/homepage_banner-01.jpg',
  '/images/hero/homepage_banner-02.png',
  '/images/hero/homepage_banner-03.jpg',
  '/images/hero/homepage_banner-04.jpg',
  '/images/hero/homepage_banner-05.jpg',
];

function HeroSection() {
  const t = useT();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-[#241F1B]">
      {/* Carousel images */}
      {HERO_IMAGES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt="VESSEL architecture"
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-[#241F1B]/48" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="text-base sm:text-lg tracking-[0.15em] text-white/70 font-light font-[family-name:var(--font-heading)]">
            {t(i18n.home.heroTagline)}
          </p>
          <div className="w-12 h-px bg-[#E36F2C] mx-auto mt-4" />
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-normal text-white mb-10 leading-[1.12] tracking-[0.08em] sm:tracking-[0.15em] break-words font-[family-name:var(--font-heading)]">
          {t(i18n.home.heroHeadline)}
        </h1>

        <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
          {t(i18n.home.heroSubtitle)}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/products" className="bg-[#E36F2C] text-white px-10 py-4 text-sm tracking-wider hover:bg-[#C85A1F] transition-colors">
            {t(i18n.home.heroCta)}
          </Link>
          <Link href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer" className="border border-white/30 text-white/80 px-10 py-4 text-sm tracking-wider hover:border-white/60 transition-colors">
            {t(i18n.home.heroCtaSecondary)}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 animate-bounce">
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none"><path d="M10 0v20M3 13l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </section>
  );
}

// ─── Credentials Bar ─────────────────────────────────────

function CredentialsBar() {
  const t = useT();
  const stats = [
    { val: t(i18n.home.credStat1), label: t(i18n.home.credLabel1) },
    { val: t(i18n.home.credStat2), label: t(i18n.home.credLabel2) },
    { val: t(i18n.home.credStat3), label: t(i18n.home.credLabel3) },
    { val: t(i18n.home.credStat4), label: t(i18n.home.credLabel4) },
  ];
  return (
    <section className="bg-[#F5F2ED] py-14 border-y border-[#E5DED4]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#E5DED4] bg-white border border-[#E5DED4] shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
          {stats.map((s) => (
            <div key={s.label} className="text-center py-6 px-4">
              <div
                className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#E36F2C] tracking-tight mb-2"
                style={{ fontFamily: 'var(--font-heading)', fontFeatureSettings: '"tnum"' }}
              >
                {s.val}
              </div>
              <div className="text-xs tracking-wider text-[#8A7D74] uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Core Tech Systems ───────────────────────────────────

function CoreTechSection({ onOpenTech }: { onOpenTech: (tech: Tech) => void }) {
  const t = useT();

  const cards: { tech: Tech; title: string; sub: string; desc: string; icon: React.ReactNode }[] = [
    {
      tech: 'viie',
      title: t(i18n.home.coreViieTitle),
      sub: t(i18n.home.coreViieSub),
      desc: t(i18n.home.coreViieDesc),
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="6" width="28" height="20" rx="1.5" />
          <path d="M12 30h12M18 26v4" />
          <circle cx="10" cy="12" r="1.4" fill="#E36F2C" />
          <path d="M14 12h14" strokeWidth="1.3" />
          <path d="M14 16h10" strokeWidth="1.3" opacity="0.6" />
          <path d="M14 20h12" strokeWidth="1.3" opacity="0.4" />
        </svg>
      ),
    },
    {
      tech: 'vols',
      title: t(i18n.home.coreVolsTitle),
      sub: t(i18n.home.coreVolsSub),
      desc: t(i18n.home.coreVolsDesc),
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="12" r="4.5" />
          <path d="M18 3v2.5M18 18v2.5M9 12h2.5M24.5 12H27M11.6 5.6l1.8 1.8M22.6 16.6l1.8 1.8M24.4 5.6l-1.8 1.8M13.4 16.6l-1.8 1.8" />
          <rect x="10" y="24" width="16" height="8" rx="1" />
          <path d="M14 24v-1.5h8V24" />
          <path d="M13 28h2M17 28h2M21 28h2" strokeWidth="1.3" opacity="0.7" />
        </svg>
      ),
    },
    {
      tech: 'vipc',
      title: t(i18n.home.coreVipcTitle),
      sub: t(i18n.home.coreVipcSub),
      desc: t(i18n.home.coreVipcDesc),
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="6" width="13" height="10" rx="0.5" />
          <rect x="19" y="6" width="13" height="10" rx="0.5" />
          <rect x="4" y="18" width="13" height="12" rx="0.5" />
          <rect x="19" y="18" width="13" height="12" rx="0.5" />
          <path d="M8 24h2M13 24h2M23 24h2M28 24h2" strokeWidth="1.3" opacity="0.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-[#FAF7F2] py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-4 font-medium">
            {t(i18n.home.coreLabel)}
          </p>
          <h2
            className="text-3xl lg:text-4xl font-light text-[#2C2A28] mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t(i18n.home.coreTitle)}
          </h2>
          <p className="text-sm text-[#6B625B] max-w-2xl mx-auto leading-relaxed">
            {t(i18n.home.coreSub)}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <button
              key={card.tech}
              type="button"
              onClick={() => onOpenTech(card.tech)}
              className="group bg-white rounded-lg border border-[#E5DED4] border-t-2 border-t-[#E36F2C] hover:border-[#E36F2C]/45 hover:shadow-[0_18px_50px_rgba(44,42,40,0.10)] p-8 flex flex-col text-left transition-all duration-200 cursor-pointer"
            >
              <div className="mb-6">{card.icon}</div>
              <h3
                className="text-lg font-medium text-[#2C2A28] mb-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {card.title}
              </h3>
              <p className="text-xs text-[#E36F2C]/70 tracking-wider uppercase mb-4">{card.sub}</p>
              <p className="text-sm text-[#6B625B] leading-relaxed flex-1">{card.desc}</p>
              <div className="mt-6 flex items-center gap-1 text-[#E36F2C] text-sm tracking-wider">
                <span>{t(i18n.home.coreLearnMore)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Certifications ──────────────────────────────────────

function CertificationsSection() {
  const t = useT();
  const certs = [
    {
      name: t(i18n.home.certEuName),
      std: t(i18n.home.certEuStd),
      desc: t(i18n.home.certEuDesc),
      icon: (
        <svg viewBox="0 0 190 140" className="h-10 w-auto" fill="#2C2A28">
          <path d="M70 0C31.3 0 0 31.3 0 70c0 38.7 31.3 70 70 70 18.4 0 35.2-7.1 47.7-18.8l-10.5-11.3C97.4 119.4 84.2 125 70 125c-30.4 0-55-24.6-55-55s24.6-55 55-55c14.2 0 27.4 5.6 37.2 15.1l10.5-11.3C105.2 7.1 88.4 0 70 0z"/>
          <path d="M190 0h-80v15h65v47.5h-55v15h55V125h-65v15h80z"/>
        </svg>
      ),
    },
    {
      name: t(i18n.home.certUsName),
      std: t(i18n.home.certUsStd),
      desc: t(i18n.home.certUsDesc),
      icon: (
        <svg viewBox="0 0 120 48" className="h-10 w-auto">
          <rect x="1" y="1" width="118" height="46" rx="6" fill="none" stroke="#2C2A28" strokeWidth="2"/>
          <text x="60" y="32" textAnchor="middle" fill="#2C2A28" fontSize="22" fontWeight="600" letterSpacing="0.1em" style={{fontFamily: 'var(--font-heading), sans-serif'}}>IBC</text>
        </svg>
      ),
    },
    {
      name: t(i18n.home.certIsoName),
      std: t(i18n.home.certIsoStd),
      desc: t(i18n.home.certIsoDesc),
      icon: (
        <svg viewBox="0 0 160 48" className="h-10 w-auto">
          <text x="80" y="34" textAnchor="middle" fill="#2C2A28" fontSize="28" fontWeight="300" letterSpacing="0.05em" style={{fontFamily: 'var(--font-heading), sans-serif'}}>ISO</text>
          <line x1="0" y1="44" x2="160" y2="44" stroke="#E36F2C" strokeWidth="2"/>
        </svg>
      ),
    },
    {
      name: t(i18n.home.certAuName),
      std: t(i18n.home.certAuStd),
      desc: t(i18n.home.certAuDesc),
      icon: (
        <svg viewBox="0 0 48 48" className="h-10 w-auto" fill="none" stroke="#2C2A28" strokeWidth="2">
          <path d="M24 4L8 14v12c0 10 6.8 19.4 16 22 9.2-2.6 16-12 16-22V14L24 4z"/>
          <path d="M16 24l6 6 10-12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];
  return (
    <section className="bg-[#F5F2ED] py-24 lg:py-32 border-y border-[#E5DED4]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-4 font-medium">{t(i18n.home.certLabel)}</p>
          <h2 className="text-3xl lg:text-4xl font-light text-[#2C2A28] mb-4 font-[family-name:var(--font-heading)]">
            {t(i18n.home.certTitle)}
          </h2>
          <p className="text-sm text-[#6B625B] max-w-2xl mx-auto">{t(i18n.home.certSubtitle)}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {certs.map((c, i) => (
            <div key={i} className="text-center group">
              <div className="h-14 flex items-center justify-center mb-6 opacity-70 group-hover:opacity-100 transition-opacity">{c.icon}</div>
              <div className="text-[#2C2A28] text-base font-medium mb-2 font-[family-name:var(--font-heading)]">{c.name}</div>
              <div className="text-[#A67C5B] text-[11px] tracking-wider font-mono mb-3">{c.std}</div>
              <p className="text-[#6B625B] text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Philosophy ──────────────────────────────────────────

function PhilosophySection() {
  const t = useT();
  return (
    <section className="bg-[#F5F2ED] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-6 font-medium">
              {t(i18n.home.philoLabel)}
            </p>
            <h2
              className="text-3xl lg:text-4xl font-light text-[#1A1A1E] mb-8 leading-snug"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t(i18n.home.philoTitle)}
            </h2>
            <p className="text-base text-[#4A4744] leading-relaxed">{t(i18n.home.philoBody)}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image src="/images/homepage/story-01.jpg" alt="VESSEL philosophy" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Flagship ────────────────────────────────────────────

function FlagshipSection() {
  const t = useT();
  const specs = [
    { val: t(i18n.home.flagshipSpec1), label: t(i18n.home.flagshipSpec1L) },
    { val: t(i18n.home.flagshipSpec2), label: t(i18n.home.flagshipSpec2L) },
    { val: t(i18n.home.flagshipSpec3), label: t(i18n.home.flagshipSpec3L) },
  ];
  return (
    <section className="bg-[#FAF7F2] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-3 font-medium">
          {t(i18n.home.flagshipLabel)}
        </p>
        <p className="text-sm text-[#8A7D74] tracking-wider mb-4">{t(i18n.home.flagshipModel)}</p>
        <h2
          className="text-3xl lg:text-5xl font-light text-[#2C2A28] mb-6 leading-tight max-w-2xl"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t(i18n.home.flagshipTitle)}
        </h2>
        <p className="text-sm text-[#6B625B] mb-12 max-w-2xl leading-relaxed">
          {t(i18n.home.flagshipWhy)}
        </p>

        <div className="flex gap-12 mb-16">
          {specs.map((s) => (
            <div key={s.label} className="pr-12 border-r border-[#E5DED4] last:border-0 last:pr-0">
              <div
                className="text-3xl lg:text-4xl font-light text-[#E36F2C] mb-1 whitespace-nowrap"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {s.val}
              </div>
              <div className="text-xs text-[#8A7D74] tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="relative aspect-[16/9] overflow-hidden bg-[#E5DED4] mb-10 shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
          <Image src="/images/e7-gen6.jpg" alt="VESSEL E7 Gen6" fill sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
        </div>

        <Link
          href="/products/e7-gen6"
          className="inline-flex items-center gap-2 text-[#E36F2C] text-sm tracking-wider hover:text-[#C85A1F] transition-colors"
        >
          {t(i18n.home.flagshipCta)}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

// ─── Technology (3-column grid with images) ──────────────

function TechnologySection() {
  const t = useT();
  const techs = [
    { tag: t(i18n.home.tech1Tag), title: t(i18n.home.tech1Title), body: t(i18n.home.tech1Body), img: '/images/homepage/tech-viie.jpg' },
    { tag: t(i18n.home.tech2Tag), title: t(i18n.home.tech2Title), body: t(i18n.home.tech2Body), img: '/images/homepage/tech-vols.jpg' },
    { tag: t(i18n.home.tech3Tag), title: t(i18n.home.tech3Title), body: t(i18n.home.tech3Body), img: '/images/homepage/tech-vipc.jpg' },
  ];
  return (
    <section className="bg-[#F5F2ED] py-24 lg:py-32 border-y border-[#E5DED4]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-4 font-medium">
            {t(i18n.home.techLabel)}
          </p>
          <h2
            className="text-3xl lg:text-4xl font-light text-[#2C2A28]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t(i18n.home.techTitle)}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {techs.map((tech) => (
            <div key={tech.tag} className="bg-white border border-[#E5DED4] rounded-lg flex flex-col overflow-hidden shadow-[0_12px_40px_rgba(44,42,40,0.06)]">
              <div className="relative aspect-[16/10] bg-[#E5DED4] overflow-hidden">
                <Image
                  src={tech.img}
                  alt={tech.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <p className="text-[#E36F2C] text-xs tracking-[0.3em] font-medium mb-4 uppercase">{tech.tag}</p>
                <h3
                  className="text-xl font-medium text-[#2C2A28] mb-4"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {tech.title}
                </h3>
                <p className="text-sm text-[#6B625B] leading-relaxed">{tech.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Projects Grid ───────────────────────────────────────

function ProjectsSection() {
  const t = useT();
  const REGIONS = [
    { label: t(i18n.home.projReg1), desc: t(i18n.home.projReg1Desc), img: '/images/products/region-asia-huawei.jpg' },
    { label: t(i18n.home.projReg2), desc: t(i18n.home.projReg2Desc), img: '/images/products/region-europe-russia.jpg' },
    { label: t(i18n.home.projReg3), desc: t(i18n.home.projReg3Desc), img: '/images/products/region-americas.jpg' },
    { label: t(i18n.home.projReg4), desc: t(i18n.home.projReg4Desc), img: '/images/homepage/region-mideast.jpg' },
    { label: t(i18n.home.projReg5), desc: t(i18n.home.projReg5Desc), img: '/images/homepage/region-oceania.jpg' },
    { label: t(i18n.home.projReg6), desc: t(i18n.home.projReg6Desc), img: '/images/products/region-africa.jpg' },
  ];
  return (
    <section className="bg-[#F5F2ED] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-4 font-medium">
            {t(i18n.home.projLabel)}
          </p>
          <h2
            className="text-3xl lg:text-4xl font-light text-[#1A1A1E]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t(i18n.home.projTitle)}
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {REGIONS.map((r) => (
            <div key={r.label} className="relative aspect-[4/3] overflow-hidden group">
              <ProtectedImage
                src={r.img}
                alt={r.label}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <p
                  className="text-white text-lg font-medium mb-0.5"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {r.label}
                </p>
                <p className="text-white/60 text-xs">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/global"
              className="inline-flex items-center gap-2 text-[#E36F2C] text-sm tracking-wider hover:text-[#C85A1F] transition-colors"
          >
            {t(i18n.home.projCta)}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Manufacturing ───────────────────────────────────────

function ManufacturingSection() {
  const t = useT();
  return (
    <section className="bg-[#FAF7F2] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-6 font-medium">
              {t(i18n.home.mfgLabel)}
            </p>
            <h2
              className="text-3xl lg:text-5xl font-light text-[#2C2A28] mb-8 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t(i18n.home.mfgTitle)}
            </h2>
            <p className="text-base text-[#6B625B] leading-relaxed">{t(i18n.home.mfgBody)}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-[#E5DED4] shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
            <Image src="/images/homepage/factory-01.jpg" alt="VESSEL factory" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Scenarios ───────────────────────────────────────────

function ScenariosSection() {
  const t = useT();
  const scenes = [
    { title: t(i18n.home.scen1Title), desc: t(i18n.home.scen1Desc), img: '/images/homepage/scene-tourism.jpg' },
    { title: t(i18n.home.scen2Title), desc: t(i18n.home.scen2Desc), img: '/images/products/scenario-commercial.jpg' },
    { title: t(i18n.home.scen3Title), desc: t(i18n.home.scen3Desc), img: '/images/products/scenario-public.jpg' },
  ];
  return (
    <section className="bg-[#F5F2ED] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-4 font-medium">{t(i18n.home.scenLabel)}</p>
          <h2 className="text-3xl lg:text-4xl font-light text-[#1A1A1E] font-[family-name:var(--font-heading)]">{t(i18n.home.scenTitle)}</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          {scenes.map((s) => (
            <div key={s.title} className="group overflow-hidden border border-[#E5E0DA] hover:border-[#E36F2C]/40 transition-colors">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={s.img} alt={s.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-7">
                <div className="h-0.5 bg-[#E36F2C] w-8 mb-5" />
                <h3 className="text-xl font-medium text-[#1A1A1E] mb-2 font-[family-name:var(--font-heading)]">{s.title}</h3>
                <p className="text-sm text-[#8A8580] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────

function CtaSection() {
  const t = useT();
  return (
    <section className="bg-[#241F1B] py-32 text-center">
      <div className="max-w-2xl mx-auto px-6">
        <h2
          className="text-3xl lg:text-4xl font-light text-[#F5F2ED] mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t(i18n.home.ctaTitle)}
        </h2>
        <p className="text-base text-[#C9BEB4] mb-10 leading-relaxed">{t(i18n.home.ctaBody)}</p>
        <Link
          href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
          className="inline-block bg-[#E36F2C] text-white px-10 py-4 text-sm tracking-wider hover:bg-[#C85A1F] transition-colors"
        >
          {t(i18n.home.ctaBtn)}
        </Link>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────

export default function HomePage() {
  const { lang } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTech, setActiveTech] = useState<Tech | null>(null);

  const openTech = (tech: Tech) => {
    setActiveTech(tech);
    setDrawerOpen(true);
  };

  return (
    <main>
      <Navbar />
      <HeroSection />
      <CredentialsBar />
      <CoreTechSection onOpenTech={openTech} />
      <CertificationsSection />
      <PhilosophySection />
      <FlagshipSection />
      <TechnologySection />
      <ProjectsSection />
      <ManufacturingSection />
      <ScenariosSection />
      <CtaSection />
      <Footer />
      <TechDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tech={activeTech}
        lang={lang}
      />
    </main>
  );
}
