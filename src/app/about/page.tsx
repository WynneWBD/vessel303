'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`bg-[#1a1a1a] flex items-center justify-center ${className}`}>
      <span className="text-white/15 text-xs tracking-wider">{label}</span>
    </div>
  );
}

export default function AboutPage() {
  const t = useT();

  const milestones = [
    { year: '2018', month_zh: '5月', month_en: 'May', event: t(i18n.about.timeline0) },
    { year: '2018', month_zh: '7月', month_en: 'Jul', event: t(i18n.about.timeline1) },
    { year: '2018', month_zh: '8月', month_en: 'Aug', event: t(i18n.about.timeline2) },
    { year: '2018', month_zh: '12月', month_en: 'Dec', event: t(i18n.about.timeline3) },
    { year: '2020', month_zh: '', month_en: '', event: t(i18n.about.timeline4) },
    { year: '2021', month_zh: '', month_en: '', event: t(i18n.about.timeline5) },
    { year: '2022', month_zh: '', month_en: '', event: t(i18n.about.timeline6) },
    { year: '2023', month_zh: '', month_en: '', event: t(i18n.about.timeline7) },
    { year: '2024', month_zh: '', month_en: '', event: t(i18n.about.timeline8) },
    { year: '2024', month_zh: '', month_en: '', event: t(i18n.about.timeline9) },
    { year: '2025', month_zh: '', month_en: '', event: t(i18n.about.timeline10) },
  ];

  const honors = [
    t(i18n.about.honor0),
    t(i18n.about.honor1),
    t(i18n.about.honor2),
    t(i18n.about.honor3),
    t(i18n.about.honor4),
    t(i18n.about.honor5),
    t(i18n.about.honor6),
    t(i18n.about.honor7),
  ];

  const partners = [
    { name: '华为 HUAWEI', desc: t(i18n.about.partnerDesc0) },
    { name: '南海狮山文旅', desc: t(i18n.about.partnerDesc1) },
    { name: 'NESSEL Housing', desc: t(i18n.about.partnerDesc2) },
    { name: '圣彼得堡国际经济论坛', desc: t(i18n.about.partnerDesc3) },
  ];

  const globalRegions = [
    { region: t(i18n.about.region0), countries: t(i18n.about.region0Countries) },
    { region: t(i18n.about.region1), countries: t(i18n.about.region1Countries) },
    { region: t(i18n.about.region2), countries: t(i18n.about.region2Countries) },
    { region: t(i18n.about.region3), countries: t(i18n.about.region3Countries) },
    { region: t(i18n.about.region4), countries: t(i18n.about.region4Countries) },
    { region: t(i18n.about.region5), countries: t(i18n.about.region5Countries) },
  ];

  const founderCreds = [
    t(i18n.about.founderCred0),
    t(i18n.about.founderCred1),
    t(i18n.about.founderCred2),
    t(i18n.about.founderCred3),
    t(i18n.about.founderCred4),
  ];

  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />

      <PageHero
        label={t(i18n.about.heroLabel)}
        title="VESSEL 微宿®"
        titleGold={t(i18n.about.heroTitleGold)}
        subtitle={t(i18n.about.heroSubtitle)}
        breadcrumb={[{ label: t(i18n.productDetail.home), href: '/' }, { label: t(i18n.nav.about) }]}
      />

      {/* ── Mission ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-4 font-medium">{t(i18n.about.missionLabel)}</div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight">
                {t(i18n.about.missionTitle1)}<br />
                <span className="text-gold-gradient">{t(i18n.about.missionTitle2)}</span>
              </h2>
              <p className="text-white/50 text-sm leading-loose mb-4">
                {t(i18n.about.missionMain)}
              </p>
              <p className="text-white/50 text-sm leading-loose mb-8">
                {t(i18n.about.missionSub)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: t(i18n.about.stat1Val), l: t(i18n.about.stat1) },
                  { v: t(i18n.about.stat2Val), l: t(i18n.about.stat2) },
                  { v: t(i18n.about.stat3Val), l: t(i18n.about.stat3) },
                  { v: t(i18n.about.stat4Val), l: t(i18n.about.stat4) },
                  { v: t(i18n.about.stat5Val), l: t(i18n.about.stat5) },
                  { v: t(i18n.about.stat6Val), l: t(i18n.about.stat6) },
                ].map((item) => (
                  <div key={item.l} className="bg-[#111] border border-white/8 p-4">
                    <div className="text-[#c9a84c] text-xl font-black mb-0.5">{item.v}</div>
                    <div className="text-white/35 text-xs tracking-wider">{item.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Placeholder label="品牌介绍图" className="w-full aspect-[4/3]" />
              <div className="grid grid-cols-2 gap-4">
                <Placeholder label="工厂实景" className="aspect-[4/3]" />
                <Placeholder label="产品展示" className="aspect-[4/3]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── R&D Capability ── */}
      <section className="py-20 bg-[#080808] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.about.rdLabel)}</div>
            <h2 className="text-3xl font-black text-white">{t(i18n.about.rdTitle)}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🏭',
                title: t(i18n.about.rd1Title),
                desc: t(i18n.about.rd1Desc),
              },
              {
                icon: '🔬',
                title: t(i18n.about.rd2Title),
                desc: t(i18n.about.rd2Desc),
              },
              {
                icon: '🌏',
                title: t(i18n.about.rd3Title),
                desc: t(i18n.about.rd3Desc),
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#111] border border-white/8 p-8 text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-white font-bold text-lg mb-3 tracking-wider">{item.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.about.timelineLabel)}</div>
            <h2 className="text-3xl font-black text-white">{t(i18n.about.timelineTitle)}</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gradient-to-b from-[#c9a84c]/50 via-[#c9a84c]/20 to-transparent" />

            <div className="space-y-1">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-6 items-start pl-0 group">
                  {/* Year */}
                  <div className="w-[72px] shrink-0 text-right">
                    <span className="text-[#c9a84c] text-xs font-bold tracking-wider">
                      {m.year}
                      {m.month_zh && <span className="text-[#c9a84c]/60 ml-1">{m.month_zh}</span>}
                    </span>
                  </div>
                  {/* Dot */}
                  <div className="relative flex items-center shrink-0 mt-0.5">
                    <div className="w-3 h-3 border-2 border-[#c9a84c] bg-[#0a0a0a] rounded-full group-hover:bg-[#c9a84c] transition-colors" />
                  </div>
                  {/* Content */}
                  <div className="pb-6 flex-1">
                    <p className="text-white/60 text-sm tracking-wider group-hover:text-white/80 transition-colors leading-relaxed">
                      {m.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Layout ── */}
      <section className="py-20 bg-[#080808] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.about.globalLabel)}</div>
            <h2 className="text-3xl font-black text-white mb-3">{t(i18n.about.globalTitle)}</h2>
            <p className="text-white/40 text-sm tracking-wider max-w-xl mx-auto">
              {t(i18n.about.globalSubtitle)}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
            {globalRegions.map((item) => (
              <div key={item.region} className="bg-[#111] border border-white/8 p-4 text-center">
                <div className="text-[#c9a84c] font-bold mb-1 tracking-wider text-sm">{item.region}</div>
                <div className="text-white/30 text-xs leading-relaxed">{item.countries}</div>
              </div>
            ))}
          </div>
          <div className="p-6 border border-[#c9a84c]/15 bg-[#c9a84c]/3 text-center">
            <div className="text-white/50 text-sm tracking-wider">
              {t(i18n.about.globalOfficesNote)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Honors ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.about.honorsLabel)}</div>
            <h2 className="text-3xl font-black text-white">{t(i18n.about.honorsTitle)}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {honors.map((honor) => (
              <div key={honor} className="bg-[#111] border border-white/8 hover:border-[#c9a84c]/30 transition-all p-5 text-center group">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#c9a84c]/60 group-hover:text-[#c9a84c] transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-white/50 text-xs leading-relaxed group-hover:text-white/70 transition-colors">{honor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="py-20 bg-[#080808] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.about.partnersLabel)}</div>
            <h2 className="text-3xl font-black text-white">{t(i18n.about.partnersTitle)}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {partners.map((p) => (
              <div key={p.name} className="bg-[#111] border border-white/8 p-6 text-center">
                <Placeholder label={`${p.name} Logo`} className="w-24 h-10 mx-auto mb-4" />
                <div className="text-white font-bold tracking-wider mb-1">{p.name}</div>
                <div className="text-white/35 text-xs">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.about.founderLabel)}</div>
            <h2 className="text-3xl font-black text-white">{t(i18n.about.founderTitle)}</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <Placeholder label="王帅斌 创始人照片" className="aspect-[3/4]" />
              <div className="md:col-span-2">
                <div className="text-[#c9a84c] font-bold text-lg mb-1 tracking-wider">{t(i18n.about.founderTitle)}</div>
                <div className="text-white/40 text-sm mb-5 tracking-wider">{t(i18n.about.founderRole)}</div>
                <ul className="space-y-2 mb-5">
                  {founderCreds.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-white/60 text-sm">
                      <span className="text-[#c9a84c] text-xs">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-white/40 text-sm leading-relaxed">
                  {t(i18n.about.founderBio)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
