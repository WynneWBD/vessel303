'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

// ─── Hero ────────────────────────────────────────────────

function HeroSection() {
  const t = useT();
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-[#111114]">
      <Image src="/images/homepage/hero-bg.jpg" alt="VESSEL architecture in mountain landscape" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[#111114]/55" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="text-sm sm:text-base tracking-[0.25em] uppercase text-white/50 mb-10 font-medium">
          {t(i18n.home.heroTagline)}
        </p>

        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-light text-white mb-10 leading-[1.08] tracking-[0.15em] font-[family-name:var(--font-heading)]">
          {t(i18n.home.heroHeadline)}
        </h1>

        <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
          {t(i18n.home.heroSubtitle)}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/products" className="bg-[#2A5C5A] text-white px-10 py-4 text-sm tracking-wider hover:bg-[#1E4543] transition-colors">
            {t(i18n.home.heroCta)}
          </Link>
          <Link href="/contact" className="border border-white/30 text-white/80 px-10 py-4 text-sm tracking-wider hover:border-white/60 transition-colors">
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
    <section className="bg-[#111114] py-16 border-y border-[#333]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#333]">
          {stats.map((s) => (
            <div key={s.label} className="text-center py-6 px-4">
              <div
                className="text-5xl lg:text-6xl font-light text-[#F0F0F0] tracking-tight mb-2"
                style={{ fontFamily: 'var(--font-heading)', fontFeatureSettings: '"tnum"' }}
              >
                {s.val}
              </div>
              <div className="text-xs tracking-wider text-[#8A8580] uppercase">{s.label}</div>
            </div>
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
      region: 'EU',
      name: t(i18n.home.certEuName),
      std: t(i18n.home.certEuStd),
      desc: t(i18n.home.certEuDesc),
      icon: (
        <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
          <circle cx="20" cy="20" r="18" stroke="#2A5C5A" strokeWidth="1.5" />
          <text x="20" y="24" textAnchor="middle" fill="#2A5C5A" fontSize="12" fontWeight="500" fontFamily="var(--font-heading)">CE</text>
        </svg>
      ),
    },
    {
      region: 'US',
      name: t(i18n.home.certUsName),
      std: t(i18n.home.certUsStd),
      desc: t(i18n.home.certUsDesc),
      icon: (
        <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
          <rect x="2" y="6" width="36" height="28" rx="2" stroke="#2A5C5A" strokeWidth="1.5" />
          <path d="M2 14h36" stroke="#2A5C5A" strokeWidth="1" />
          <text x="20" y="29" textAnchor="middle" fill="#2A5C5A" fontSize="9" fontWeight="500" fontFamily="var(--font-heading)">IBC</text>
        </svg>
      ),
    },
    {
      region: 'INTL',
      name: t(i18n.home.certIsoName),
      std: t(i18n.home.certIsoStd),
      desc: t(i18n.home.certIsoDesc),
      icon: (
        <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
          <circle cx="20" cy="20" r="14" stroke="#2A5C5A" strokeWidth="1.5" />
          <path d="M14 20l4 4 8-8" stroke="#2A5C5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      region: 'AU/NZ',
      name: t(i18n.home.certAuName),
      std: t(i18n.home.certAuStd),
      desc: t(i18n.home.certAuDesc),
      icon: (
        <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
          <path d="M20 4l4 8h9l-7 5 3 9-9-6-9 6 3-9-7-5h9l4-8z" stroke="#2A5C5A" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];
  return (
    <section className="bg-[#111114] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-6">
          <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-4 font-medium">{t(i18n.home.certLabel)}</p>
          <h2 className="text-3xl lg:text-4xl font-light text-[#F0F0F0] mb-4 font-[family-name:var(--font-heading)]">
            {t(i18n.home.certTitle)}
          </h2>
          <p className="text-sm text-[#8A8580] max-w-xl mx-auto">{t(i18n.home.certSubtitle)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {certs.map((c) => (
            <div key={c.region} className="border border-[#2A2A2E] p-8 hover:border-[#2A5C5A]/40 transition-colors">
              <div className="mb-6">{c.icon}</div>
              <div className="text-[#F0F0F0] text-lg font-medium mb-2 font-[family-name:var(--font-heading)]">{c.name}</div>
              <div className="text-[#A67C5B] text-xs tracking-wider font-mono mb-4">{c.std}</div>
              <p className="text-[#8A8580] text-sm leading-relaxed">{c.desc}</p>
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
    <section className="bg-[#111114] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-3 font-medium">
          {t(i18n.home.flagshipLabel)}
        </p>
        <p className="text-sm text-[#8A8580] tracking-wider mb-4">{t(i18n.home.flagshipModel)}</p>
        <h2
          className="text-3xl lg:text-5xl font-light text-[#F0F0F0] mb-6 leading-tight max-w-2xl"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t(i18n.home.flagshipTitle)}
        </h2>
        <p className="text-sm text-[#8A8580] mb-12 max-w-2xl leading-relaxed">
          {t(i18n.home.flagshipWhy)}
        </p>

        <div className="flex gap-12 mb-16">
          {specs.map((s) => (
            <div key={s.label} className="pr-12 border-r border-[#333] last:border-0 last:pr-0">
              <div
                className="text-3xl lg:text-4xl font-light text-[#F0F0F0] mb-1 whitespace-nowrap"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {s.val}
              </div>
              <div className="text-xs text-[#8A8580] tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="relative aspect-[16/9] overflow-hidden bg-[#1A1A1E] mb-10">
          <Image src="/images/e7-gen6.jpg" alt="VESSEL E7 Gen6" fill sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
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

// ─── Technology (3-column grid with images) ──────────────

function TechnologySection() {
  const t = useT();
  const techs = [
    { tag: t(i18n.home.tech1Tag), title: t(i18n.home.tech1Title), body: t(i18n.home.tech1Body), img: '/images/homepage/tech-viie.jpg' },
    { tag: t(i18n.home.tech2Tag), title: t(i18n.home.tech2Title), body: t(i18n.home.tech2Body), img: '/images/homepage/tech-vols.jpg' },
    { tag: t(i18n.home.tech3Tag), title: t(i18n.home.tech3Title), body: t(i18n.home.tech3Body), img: '/images/homepage/tech-vipc.jpg' },
  ];
  return (
    <section className="bg-[#111114] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-4 font-medium">
            {t(i18n.home.techLabel)}
          </p>
          <h2
            className="text-3xl lg:text-4xl font-light text-[#F0F0F0]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t(i18n.home.techTitle)}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-px bg-[#333]">
          {techs.map((tech) => (
            <div key={tech.tag} className="bg-[#111114] flex flex-col">
              <div className="relative aspect-[16/10] bg-[#1A1A1E] overflow-hidden">
                <Image
                  src={tech.img}
                  alt={tech.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover opacity-80"
                />
              </div>
              <div className="p-8">
                <p className="text-[#2A5C5A] text-xs tracking-[0.3em] font-medium mb-4 uppercase">{tech.tag}</p>
                <h3
                  className="text-xl font-medium text-[#F0F0F0] mb-4"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {tech.title}
                </h3>
                <p className="text-sm text-[#8A8580] leading-relaxed">{tech.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Projects Grid ───────────────────────────────────────

const REGIONS = [
  { label: 'Asia', desc: 'China · Taiwan · Japan · Korea · SE Asia', img: '/images/homepage/region-asia.jpg' },
  { label: 'Europe', desc: 'Russia · Slovakia · Austria · Germany · Ireland', img: '/images/homepage/region-europe.jpg' },
  { label: 'Americas', desc: 'USA · Mexico · Brazil · Argentina', img: '/images/homepage/region-americas.jpg' },
  { label: 'Middle East', desc: 'UAE · Saudi Arabia · Libya · Cyprus', img: '/images/homepage/region-mideast.jpg' },
  { label: 'Oceania', desc: 'Australia · New Zealand', img: '/images/homepage/region-oceania.jpg' },
  { label: 'Africa', desc: 'Tanzania · Emerging markets', img: '/images/homepage/region-africa.jpg' },
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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {REGIONS.map((r) => (
            <div key={r.label} className="relative aspect-[4/3] overflow-hidden group">
              <Image
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

// ─── Manufacturing ───────────────────────────────────────

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
            <p className="text-base text-[#8A8580] leading-relaxed">{t(i18n.home.mfgBody)}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-[#1A1A1E]">
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
    { title: t(i18n.home.scen2Title), desc: t(i18n.home.scen2Desc), img: '/images/homepage/scene-commercial.jpg' },
    { title: t(i18n.home.scen3Title), desc: t(i18n.home.scen3Desc), img: '/images/homepage/scene-public.jpg' },
  ];
  return (
    <section className="bg-[#F5F0EB] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#2A5C5A] mb-4 font-medium">{t(i18n.home.scenLabel)}</p>
          <h2 className="text-3xl lg:text-4xl font-light text-[#1A1A1E] font-[family-name:var(--font-heading)]">{t(i18n.home.scenTitle)}</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          {scenes.map((s) => (
            <div key={s.title} className="group overflow-hidden border border-[#E5E0DA] hover:border-[#2A5C5A]/40 transition-colors">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={s.img} alt={s.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-7">
                <div className="h-0.5 bg-[#2A5C5A] w-8 mb-5" />
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
    <section className="bg-[#111114] py-32 text-center">
      <div className="max-w-2xl mx-auto px-6">
        <h2
          className="text-3xl lg:text-4xl font-light text-[#F0F0F0] mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t(i18n.home.ctaTitle)}
        </h2>
        <p className="text-base text-[#8A8580] mb-10 leading-relaxed">{t(i18n.home.ctaBody)}</p>
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

// ─── Page ────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <CredentialsBar />
      <CertificationsSection />
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
