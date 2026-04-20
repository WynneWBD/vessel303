'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

const STATS = [
  { value: '1,400+', en: 'Connected Units Globally', zh: '全球联网舱体' },
  { value: '470+',   en: 'Currently Online',         zh: '当前在线' },
  { value: '100%',   en: 'Proprietary System',       zh: '完全自研' },
  { value: '24/7',   en: 'Remote Monitoring',        zh: '全天候远程监控' },
];

const CAPABILITIES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M12 21a9 9 0 100-18 9 9 0 000 18z"/>
      </svg>
    ),
    en: 'Lighting Control', zh: '灯光控制',
    desc_en: 'Full ambient and scene lighting management',
    desc_zh: '全屋氛围灯场景化管理',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1010 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/>
      </svg>
    ),
    en: 'Climate Control', zh: '空调控制',
    desc_en: 'Remote temperature and mode setting',
    desc_zh: '远程温控与模式切换',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    en: 'Electric Curtains', zh: '电动窗帘',
    desc_en: 'Scheduled and remote curtain operation',
    desc_zh: '定时与远程帘布控制',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
    en: 'Access Control', zh: '门锁密码',
    desc_en: 'Generate, send and expire temporary access codes',
    desc_zh: '生成、发送、自动失效临时密码',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    en: 'Real-time Monitoring', zh: '实时状态监控',
    desc_en: 'Batch query of all online units, second-level refresh',
    desc_zh: '批量查询全部在线舱体状态，秒级刷新',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#E36F2C" strokeWidth="1.8" strokeLinecap="round">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
    ),
    en: 'Alert System', zh: '异常告警',
    desc_en: 'Network offline, abnormal runtime, anomaly detection',
    desc_zh: '网关掉线、异常运行时长、设备异常检测',
  },
];

const ROADMAP = [
  {
    phase: 'Phase 1',
    label_en: 'Current',
    label_zh: '当前',
    en: 'Full device control — lighting, AC, curtains, access codes, real-time monitoring',
    zh: '完整设备控制：灯光/空调/窗帘/门锁密码/实时监控',
    active: true,
  },
  {
    phase: 'Phase 2',
    label_en: '2027',
    label_zh: '2027',
    en: 'Booking integration — OTA sync, automated check-in codes, housekeeping triggers',
    zh: '预订联动：OTA同步、自动入住密码、保洁触发',
    active: false,
  },
  {
    phase: 'Phase 3',
    label_en: '2027–2028',
    label_zh: '2027–2028',
    en: 'AI pricing & predictive maintenance — dynamic rate suggestions, fault prediction',
    zh: 'AI定价与预测性维保：动态定价建议、故障预判',
    active: false,
  },
  {
    phase: 'Phase 4',
    label_en: '2028+',
    label_zh: '2028+',
    en: 'Global platform — multi-currency, multi-timezone, open API for non-VESSEL clients',
    zh: '全球平台：多货币/多时区，开放API，非微宿客户接入',
    active: false,
  },
];

export default function ViIePage() {
  const { lang } = useLanguage();
  const zh = lang === 'zh';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2ED]">
      <Navbar />

      {/* S1 Hero */}
      <section className="bg-[#1A1A1A] pt-28 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #E36F2C 0%, transparent 60%)' }} />
        <div className="max-w-5xl mx-auto relative">
          <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-4">
            Proprietary · Self-developed · Global Deployment
          </p>
          <h1 className="text-6xl sm:text-7xl font-bold text-[#F0F0F0] leading-none tracking-tight mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {zh ? '微宿智能\n交互系统' : 'VesselOS · VIIE'}
          </h1>
          <p className="text-[#C4B9AB] text-lg sm:text-xl mt-2">
            {zh ? 'VesselOS — 全球文旅空间智能运营系统' : 'Vessel Intelligent Interactive Experience'}
          </p>
          <div className="flex gap-2 mt-8 flex-wrap">
            {['VesselOS', zh ? '完全自研' : '100% Proprietary', zh ? '1,400+ 联网舱体' : '1,400+ Connected Units'].map(tag => (
              <span key={tag} className="text-xs px-3 py-1.5 border border-[#E36F2C]/30 text-[#E36F2C]/80 tracking-wider">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* S2 Overview */}
      <section className="bg-[#F5F2ED] py-20 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <Reveal>
              <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Overview</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {zh ? '完全自研智能控制平台' : 'Fully Proprietary Smart Control Platform'}
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="space-y-4 text-[#1A1A1A]/70 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                {zh ? (
                  <>
                    <p>VesselOS是微宿完全自主研发的智能空间运营系统，不依赖涂鸦、BroadLink等任何第三方平台。系统已连接全球1,400余台微宿舱体，让营地运营方和设备业主能够实时查看并远程控制每台舱体。</p>
                    <p>平台支持兼容各国主流智联家居生态，实现微宿1+2+N全屋智能方案：一个核心网关、两大控制界面、无限扩展设备接入。远程管理通过微宿自建服务器（佛山）完成，借助阿里云和AWS实现全球加速。</p>
                  </>
                ) : (
                  <>
                    <p>VesselOS is VESSEL's proprietary smart space operating system — built entirely in-house, not dependent on third-party platforms such as Tuya or BroadLink. The system connects 1,400+ VESSEL units across the globe, providing operators and owners with real-time visibility and full remote control of every cabin.</p>
                    <p>The platform supports integration with mainstream smart home ecosystems across different countries, enabling VESSEL's 1+2+N full-home smart solution: one core gateway, two primary control interfaces, and unlimited device expansion. Remote management is handled through VESSEL's own server infrastructure in Foshan, accelerated globally via Alibaba Cloud and AWS.</p>
                  </>
                )}
              </div>
            </Reveal>
          </div>

          {/* Stats grid */}
          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div key={s.value} className="bg-[#1A1A1A] p-5 flex flex-col gap-2">
                  <span className="text-3xl font-bold text-[#E36F2C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.value}</span>
                  <span className="text-[#8A8580] text-xs tracking-wider leading-snug">{zh ? s.zh : s.en}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* S3 Capabilities */}
      <section className="bg-[#1A1A1A] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '全设备控制能力' : 'Full Device Control Capability'}
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((c, i) => (
              <Reveal key={c.en} delay={i * 50}>
                <div className="bg-[#2A2A2E] p-5 flex flex-col gap-3 border border-transparent hover:border-[#E36F2C]/20 transition-colors">
                  {c.icon}
                  <p className="text-[#F0F0F0] text-sm font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {zh ? c.zh : c.en}
                  </p>
                  <p className="text-[#8A8580] text-xs leading-relaxed">{zh ? c.desc_zh : c.desc_en}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* S4 1+2+N */}
      <section className="bg-[#F5F2ED] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Framework</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '1+2+N 全屋智能方案' : 'The 1+2+N Smart Home Framework'}
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                num: '1',
                en: '1 Core Gateway',
                zh: '1个核心网关',
                desc_en: 'Central hub managing all devices in the unit',
                desc_zh: '统一管理舱内所有设备',
              },
              {
                num: '2',
                en: '2 Control Interfaces',
                zh: '2套控制界面',
                desc_en: 'Owner app + operator dashboard, independently permissioned',
                desc_zh: '业主App与运营后台独立授权',
              },
              {
                num: 'N',
                en: 'N Device Expansion',
                zh: 'N路设备扩展',
                desc_en: 'Compatible with major smart home ecosystems globally, unlimited device types',
                desc_zh: '兼容各国主流智联生态，设备类型无限扩展',
              },
            ].map((item, i) => (
              <Reveal key={item.num} delay={i * 80}>
                <div className="border border-[#E5E0DA] bg-white p-7 flex flex-col gap-4">
                  <span className="text-5xl font-bold text-[#E36F2C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{item.num}</span>
                  <p className="text-[#1A1A1A] font-semibold text-base" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {zh ? item.zh : item.en}
                  </p>
                  <p className="text-[#8A8580] text-sm leading-relaxed">{zh ? item.desc_zh : item.desc_en}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* S5 Roadmap */}
      <section className="bg-[#1A1A1A] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Roadmap</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] mb-12" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? 'VesselOS 产品路线图' : 'VesselOS Roadmap'}
            </h2>
          </Reveal>

          {/* horizontal on desktop, vertical on mobile */}
          <div className="hidden md:grid grid-cols-4 gap-0 relative">
            {/* spine */}
            <div className="absolute top-[28px] left-[12.5%] right-[12.5%] h-px bg-[#2A2A2E]" />
            {ROADMAP.map((r, i) => (
              <Reveal key={r.phase} delay={i * 80}>
                <div className="flex flex-col items-center text-center px-3">
                  <div className={`w-5 h-5 rounded-full border-2 mb-4 z-10 relative ${r.active ? 'bg-[#E36F2C] border-[#E36F2C]' : 'bg-[#1A1A1A] border-[#2A2A2E]'}`} />
                  <p className={`text-xs font-bold tracking-[0.2em] uppercase mb-1 ${r.active ? 'text-[#E36F2C]' : 'text-[#8A8580]'}`}>
                    {r.phase}
                  </p>
                  <p className={`text-xs mb-3 ${r.active ? 'text-[#E36F2C]/70' : 'text-[#8A8580]/60'}`}>
                    {zh ? r.label_zh : r.label_en}
                  </p>
                  <p className={`text-xs leading-relaxed ${r.active ? 'text-[#F0F0F0]/80' : 'text-[#8A8580]/60'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                    {zh ? r.zh : r.en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* mobile vertical */}
          <div className="md:hidden space-y-6 relative pl-6">
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[#2A2A2E]" />
            {ROADMAP.map((r, i) => (
              <Reveal key={r.phase} delay={i * 60}>
                <div className="relative">
                  <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 ${r.active ? 'bg-[#E36F2C] border-[#E36F2C]' : 'bg-[#1A1A1A] border-[#2A2A2E]'}`} />
                  <p className={`text-xs font-bold tracking-widest uppercase mb-0.5 ${r.active ? 'text-[#E36F2C]' : 'text-[#8A8580]'}`}>{r.phase} · {zh ? r.label_zh : r.label_en}</p>
                  <p className={`text-sm leading-relaxed ${r.active ? 'text-[#F0F0F0]/80' : 'text-[#8A8580]/60'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                    {zh ? r.zh : r.en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F5F2ED] border-t border-[#E5E0DA] py-14 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[#1A1A1A] font-semibold text-lg mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '了解更多微宿技术体系' : 'Explore all VESSEL systems'}
            </p>
            <p className="text-[#8A8580] text-sm">{zh ? '返回关于我们 · 三大技术' : 'Back to About · Technologies'}</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center sm:justify-end">
            <Link href="/about#technologies" className="px-6 py-3 border border-[#C4B9AB] text-[#8A8580] text-sm tracking-wider hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
              {zh ? '← 返回' : '← Back'}
            </Link>
            <a href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-[#E36F2C] text-white text-sm font-semibold tracking-wider hover:bg-[#C85A1F] transition-colors">
              {zh ? '联系我们' : 'Contact VESSEL'}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
