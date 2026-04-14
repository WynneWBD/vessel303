'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

// ─── Hero ──────────────────────────────────────────────────────────────────

function HeroSection() {
  const t = useT();
  return (
    <section className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden bg-[#111114]">
      <Image
        src="/images/homepage/hero-bg.jpg"
        alt="VESSEL architecture"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#111114]/65" />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <p className="text-xs tracking-[0.35em] uppercase text-[#2A5C5A] mb-6 font-medium">
          {t(i18n.home.heroTagline)}
        </p>
        <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          {t(i18n.home.heroSubtitle)}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/products"
            className="bg-[#2A5C5A] text-white px-8 py-3.5 text-sm tracking-wider hover:bg-[#1E4543] transition-colors"
          >
            {t(i18n.home.heroCta)}
          </Link>
          <Link
            href="/contact"
            className="border border-white/30 text-white/80 px-8 py-3.5 text-sm tracking-wider hover:border-white/60 transition-colors"
          >
            {t(i18n.home.heroCtaSecondary)}
          </Link>
        </div>
      </div>

      {/* Scroll arrow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25 animate-bounce">
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
          <path d="M10 0v20M3 13l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}

// ─── Credentials Bar ───────────────────────────────────────────────────────

function CredentialsBar() {
  const t = useT();
  const stats = [
    { val: t(i18n.home.credStat1), label: t(i18n.home.credLabel1) },
    { val: t(i18n.home.credStat2), label: t(i18n.home.credLabel2) },
    { val: t(i18n.home.credStat3), label: t(i18n.home.credLabel3) },
    { val: t(i18n.home.credStat4), label: t(i18n.home.credLabel4) },
  ];
  return (
    <section className="bg-[#111114] py-16 border-y border-[#2A2A2E]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#2A2A2E]">
          {stats.map((s) => (
            <div key={s.label} className="text-center py-6 px-4">
              <div
                className="text-5xl lg:text-6xl font-light text-[#F0F0F0] tracking-tight mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {s.val}
              </div>
              <div className="text-xs tracking-wider text-[#8A8580] uppercase">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs tracking-[0.2em] text-[#2A5C5A] mt-8 uppercase">
          {t(i18n.home.credCerts)}
        </p>
      </div>
    </section>
  );
}

// ─── Philosophy ────────────────────────────────────────────────────────────

function PhilosophySection() {
  const t = useT();
  return (
    <section className="bg-[#F5F0EB] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-6 font-medium">
              {t(i18n.home.philoLabel)}
            </p>
            <h2
              className="text-3xl lg:text-4xl font-light text-[#1A1A1E] mb-8 leading-snug"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t(i18n.home.philoTitle)}
            </h2>
            <p className="text-base text-[#4A4744] leading-relaxed">
              {t(i18n.home.philoBody)}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src="/images/homepage/story-01.jpg"
              alt="VESSEL philosophy"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Flagship Product ──────────────────────────────────────────────────────

function FlagshipSection() {
  const t = useT();
  const specs = [
    { val: t(i18n.home.flagshipSpec1), label: t(i18n.home.flagshipSpec1L) },
    { val: t(i18n.home.flagshipSpec2), label: t(i18n.home.flagshipSpec2L) },
    { val: t(i18n.home.flagshipSpec3), label: t(i18n.home.flagshipSpec3L) },
  ];
  return (
    <section className="bg-[#111114] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-3 font-medium">
          {t(i18n.home.flagshipLabel)}
        </p>
        <p className="text-sm text-[#8A8580] tracking-wider mb-4">{t(i18n.home.flagshipModel)}</p>
        <h2
          className="text-3xl lg:text-5xl font-light text-[#F0F0F0] mb-12 leading-tight max-w-2xl"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t(i18n.home.flagshipTitle)}
        </h2>

        <div className="grid grid-cols-3 divide-x divide-[#2A2A2E] mb-16 max-w-xl">
          {specs.map((s) => (
            <div key={s.label} className="px-6 first:pl-0">
              <div
                className="text-4xl font-light text-[#F0F0F0] mb-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {s.val}
              </div>
              <div className="text-xs text-[#8A8580] tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="relative aspect-[16/9] overflow-hidden bg-[#1A1A1E] mb-10">
          <Image
            src="/images/e7-gen6.jpg"
            alt="VESSEL E7 Gen6"
            fill
            sizes="(max-width: 1280px) 100vw, 1152px"
            className="object-cover"
          />
        </div>

        <Link
          href="/products/e7-gen6"
          className="inline-flex items-center gap-2 text-[#2A5C5A] text-sm tracking-wider hover:text-[#3D7A77] transition-colors"
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

// ─── Technology Triptych ───────────────────────────────────────────────────

interface TechCardProps {
  tag: string;
  title: string;
  body: string;
  abbr: string;
}

function TechCard({ tag, title, body, abbr }: TechCardProps) {
  return (
    <section className="bg-[#111114] min-h-[80vh] flex items-center">
      <div className="max-w-6xl mx-auto px-6 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-6 font-medium">{tag}</p>
            <h3
              className="text-2xl lg:text-3xl font-light text-[#F0F0F0] mb-8 leading-snug"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {title}
            </h3>
            <p className="text-base text-[#8A8580] leading-relaxed">{body}</p>
          </div>
          <div className="flex items-center justify-center lg:justify-end">
            <span
              className="font-light text-[#2A2A2E] leading-none select-none"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '120px' }}
            >
              {abbr}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TechnologySection() {
  const t = useT();
  const techs = [
    { tag: t(i18n.home.tech1Tag), title: t(i18n.home.tech1Title), body: t(i18n.home.tech1Body), abbr: 'VIIE' },
    { tag: t(i18n.home.tech2Tag), title: t(i18n.home.tech2Title), body: t(i18n.home.tech2Body), abbr: 'VOLS' },
    { tag: t(i18n.home.tech3Tag), title: t(i18n.home.tech3Title), body: t(i18n.home.tech3Body), abbr: 'VIPC' },
  ];
  return (
    <>
      <div className="bg-[#111114] pt-24 pb-0">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] font-medium">
            {t(i18n.home.techLabel)}
          </p>
        </div>
      </div>
      {techs.map((tech, i) => (
        <div key={tech.abbr}>
          {i > 0 && <div className="h-px bg-[#2A2A2E]" />}
          <TechCard {...tech} />
        </div>
      ))}
    </>
  );
}

// ─── Projects Grid ─────────────────────────────────────────────────────────

const REGIONS = [
  { label: 'Asia', desc: 'China · Taiwan · Japan · Korea · Southeast Asia' },
  { label: 'Europe', desc: 'Russia · Slovakia · Austria · Germany · Ireland' },
  { label: 'Americas', desc: 'USA · Mexico · Brazil · Argentina' },
  { label: 'Middle East', desc: 'UAE · Saudi Arabia · Libya · Cyprus' },
  { label: 'Oceania', desc: 'Australia · New Zealand' },
  { label: 'Africa', desc: 'Tanzania · Emerging markets' },
];

function ProjectsSection() {
  const t = useT();
  return (
    <section className="bg-[#F5F0EB] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-4 font-medium">
            {t(i18n.home.projLabel)}
          </p>
          <h2
            className="text-3xl lg:text-4xl font-light text-[#1A1A1E]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t(i18n.home.projTitle)}
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {REGIONS.map((r) => (
            <div key={r.label} className="bg-[#E5E0DA] p-6 aspect-[4/3] flex flex-col justify-end">
              <p
                className="text-lg font-medium text-[#1A1A1E] mb-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {r.label}
              </p>
              <p className="text-xs text-[#8A8580] leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/global"
            className="inline-flex items-center gap-2 text-[#2A5C5A] text-sm tracking-wider hover:text-[#3D7A77] transition-colors"
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

// ─── Manufacturing ─────────────────────────────────────────────────────────

function ManufacturingSection() {
  const t = useT();
  return (
    <section className="bg-[#111114] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-6 font-medium">
              {t(i18n.home.mfgLabel)}
            </p>
            <h2
              className="text-3xl lg:text-5xl font-light text-[#F0F0F0] mb-8 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t(i18n.home.mfgTitle)}
            </h2>
            <p className="text-base text-[#8A8580] leading-relaxed">
              {t(i18n.home.mfgBody)}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-[#1A1A1E]">
            <Image
              src="/images/homepage/factory-01.jpg"
              alt="VESSEL factory"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Scenarios ─────────────────────────────────────────────────────────────

function ScenariosSection() {
  const t = useT();
  const scenes = [
    { title: t(i18n.home.scen1Title), desc: t(i18n.home.scen1Desc) },
    { title: t(i18n.home.scen2Title), desc: t(i18n.home.scen2Desc) },
    { title: t(i18n.home.scen3Title), desc: t(i18n.home.scen3Desc) },
  ];
  return (
    <section className="bg-[#F5F0EB] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-4 font-medium">
            {t(i18n.home.scenLabel)}
          </p>
          <h2
            className="text-3xl lg:text-4xl font-light text-[#1A1A1E]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t(i18n.home.scenTitle)}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {scenes.map((s) => (
            <div
              key={s.title}
              className="border border-[#E5E0DA] p-8 hover:border-[#2A5C5A]/40 transition-colors"
            >
              <div className="h-0.5 bg-[#2A5C5A] w-8 mb-6" />
              <h3
                className="text-xl font-medium text-[#1A1A1E] mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {s.title}
              </h3>
              <p className="text-sm text-[#8A8580] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────────────────

function CtaSection() {
  const t = useT();
  return (
    <section className="bg-[#111114] py-32 text-center">
      <div className="max-w-2xl mx-auto px-6">
        <h2
          className="text-3xl lg:text-4xl font-light text-[#F0F0F0] mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t(i18n.home.ctaTitle)}
        </h2>
        <p className="text-base text-[#8A8580] mb-10 leading-relaxed">
          {t(i18n.home.ctaBody)}
        </p>
        <Link
          href="/contact"
          className="inline-block bg-[#2A5C5A] text-white px-10 py-4 text-sm tracking-wider hover:bg-[#1E4543] transition-colors"
        >
          {t(i18n.home.ctaBtn)}
        </Link>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <CredentialsBar />
      <PhilosophySection />
      <FlagshipSection />
      <TechnologySection />
      <ProjectsSection />
      <ManufacturingSection />
      <ScenariosSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
