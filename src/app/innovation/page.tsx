'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const CARDS = [
  {
    href: '/innovation/viie',
    tag: 'VesselOS · VIIE',
    en_title: 'Vessel Intelligent Interactive Experience',
    zh_title: '微宿智能交互',
    en_sub: 'Full cabin remote control · 1,400+ units online · Proprietary platform',
    zh_sub: 'VesselOS 全屋智能控制系统 · 1,400余台联网 · 完全自研',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="36" height="24" rx="2" stroke="#E36F2C" strokeWidth="2"/>
        <path d="M16 38h16" stroke="#E36F2C" strokeWidth="2" strokeLinecap="round"/>
        <path d="M24 34v4" stroke="#E36F2C" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="2" fill="#E36F2C"/>
        <circle cx="24" cy="18" r="2" fill="#E36F2C" opacity="0.5"/>
        <circle cx="30" cy="18" r="2" fill="#E36F2C" opacity="0.3"/>
        <path d="M14 26h20" stroke="#E36F2C" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 22h12" stroke="#E36F2C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    href: '/innovation/vols',
    tag: 'VOLS',
    en_title: 'Vessel Off-grid Living System',
    zh_title: '微宿离网系统',
    en_sub: 'Solar generation · 100kWh+ storage · Zero-pollution discharge',
    zh_sub: '太阳能发电 · 100kWh+储能 · 污水零排放',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="20" r="7" stroke="#E36F2C" strokeWidth="2"/>
        <path d="M24 6v3M24 31v3M10 20H7M37 20h3M14.1 10.1l2.1 2.1M31.8 27.8l2.1 2.1M14.1 29.9l2.1-2.1M31.8 12.2l2.1-2.1" stroke="#E36F2C" strokeWidth="2" strokeLinecap="round"/>
        <rect x="12" y="36" width="24" height="6" rx="1" stroke="#E36F2C" strokeWidth="1.5"/>
        <path d="M18 36v-2h12v2" stroke="#E36F2C" strokeWidth="1.5"/>
        <path d="M15 39h4M21 39h4M27 39h4" stroke="#E36F2C" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
  },
  {
    href: '/innovation/vipc',
    tag: 'VIPC',
    en_title: 'Vessel Integral Pre-fab Construction',
    zh_title: '微宿整装预制系统',
    en_sub: '100% factory-complete · 2-hour installation · Global shipping compliant',
    zh_sub: '出厂即成品 · 2小时现场安装 · 全球合规运输',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="20" width="32" height="20" rx="1" stroke="#E36F2C" strokeWidth="2"/>
        <path d="M8 24l16-14 16 14" stroke="#E36F2C" strokeWidth="2" strokeLinejoin="round"/>
        <rect x="18" y="28" width="12" height="12" rx="0.5" stroke="#E36F2C" strokeWidth="1.5"/>
        <path d="M18 34h12" stroke="#E36F2C" strokeWidth="1" opacity="0.5"/>
        <path d="M24 28v12" stroke="#E36F2C" strokeWidth="1" opacity="0.5"/>
        <circle cx="36" cy="12" r="5" fill="#E36F2C" opacity="0.15" stroke="#E36F2C" strokeWidth="1.5"/>
        <path d="M33.5 12l2 2 3-3" stroke="#E36F2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function InnovationPage() {
  const { lang } = useLanguage();
  const zh = lang === 'zh';

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1A1A]">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-4">
            {zh ? '核心技术体系' : 'Proprietary Technology'}
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold text-[#F0F0F0] leading-none tracking-tight mb-5"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {zh ? '微宿三大技术体系' : 'VESSEL Advanced\nTechnical Systems'}
          </h1>
          <p className="text-[#8A8580] text-base sm:text-lg max-w-xl leading-relaxed">
            {zh
              ? '三大自研技术体系，构建微宿核心竞争壁垒。'
              : 'Three proprietary systems that define the VESSEL advantage.'}
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="flex-1 px-4 pb-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col bg-[#2A2A2E] border border-[#2A2A2E] hover:border-[#E36F2C]/60 transition-all duration-300 p-8 relative overflow-hidden"
            >
              {/* top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#E36F2C]/0 via-[#E36F2C]/60 to-[#E36F2C]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="mb-6">{card.icon}</div>

              <p className="text-[#E36F2C] text-xs tracking-[0.25em] uppercase font-bold mb-2">
                {card.tag}
              </p>
              <h2
                className="text-[#F0F0F0] text-xl font-bold mb-3 leading-snug group-hover:text-white transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {zh ? card.zh_title : card.en_title}
              </h2>
              <p className="text-[#8A8580] text-xs leading-relaxed flex-1">
                {zh ? card.zh_sub : card.en_sub}
              </p>

              <div className="mt-8 flex items-center gap-2 text-[#E36F2C] text-xs font-medium tracking-wider">
                <span>{zh ? '了解详情' : 'Learn more'}</span>
                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* bottom CTA */}
      <section className="border-t border-[#2A2A2E] py-14 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[#F0F0F0] text-lg font-semibold mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '了解微宿技术如何应用于您的项目' : 'See how VESSEL technology fits your project'}
            </p>
            <p className="text-[#8A8580] text-sm">{zh ? '专业顾问一对一解答' : '1-on-1 specialist consultation'}</p>
          </div>
          <a
            href="https://en.303vessel.cn/contact.html"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-8 py-3.5 bg-[#E36F2C] text-white text-sm font-semibold tracking-wider hover:bg-[#C85A1F] transition-colors whitespace-nowrap"
          >
            {zh ? '联系我们' : 'Contact VESSEL'}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
