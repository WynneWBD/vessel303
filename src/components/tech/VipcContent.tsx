'use client';

import { Reveal } from './Reveal';

const SHIPPING = [
  { en: 'Container Standard', zh: '集装箱标准', value: '40ft Flat Rack Container' },
  { en: 'Dimensions', zh: '运输尺寸', value: '11.762m × 2.240m × 2.034m' },
  { en: 'Port Compliance', zh: '港口合规', value: 'International loading regulations' },
  { en: 'Road Compliance', zh: '道路合规', value: 'Multi-country road transport regulations' },
  { en: 'Logistics Optimization', zh: '物流优化', value: 'E3 & E6 — 2 units per truck' },
];

const STEPS = [
  {
    n: '01',
    en: 'Factory Complete',
    zh: '工厂完工',
    desc_en: '100% finished unit leaves Foshan — furnishings, MEP and smart controls fully installed.',
    desc_zh: '100%成品出厂，家具、机电、智控全部安装完毕。',
  },
  {
    n: '02',
    en: 'International Shipping',
    zh: '国际海运',
    desc_en: '40ft Flat Rack, compliant with port loading standards. Delivered to 30+ countries.',
    desc_zh: '40英尺平架集装箱，符合港口装载标准，交付30余国。',
  },
  {
    n: '03',
    en: 'On-site Crane Lift',
    zh: '现场吊装',
    desc_en: 'No foundation, no excavation. Any terrain — mountain, forest, wetland or desert.',
    desc_zh: '无需地基，无需开挖。适配山地、密林、湿地、沙漠一切地形。',
  },
  {
    n: '04',
    en: 'Connect & Operate',
    zh: '接通即营业',
    desc_en: 'Water and electricity hookup only. Ready for guests in as little as 2 hours.',
    desc_zh: '仅需接通水电，2小时内即可接待宾客。',
  },
];

const PERF = [
  { value: '8.0',      en: 'Seismic Rating',       zh: '抗震设防烈度' },
  { value: 'Lv. 11',  en: 'Wind Resistance',       zh: '防风等级' },
  { value: '50°C',    en: 'Thermal Differential',  zh: '室内外温差保温' },
  { value: '15+ yrs', en: 'Design Lifespan',       zh: '设计使用寿命' },
  { value: '45 days', en: 'Production Cycle',      zh: '标准生产周期' },
  { value: '2 hrs',   en: 'On-site Installation',  zh: '现场安装时间' },
];

export default function VipcContent({ lang }: { lang: 'en' | 'zh' }) {
  const zh = lang === 'zh';

  return (
    <div className="bg-[#F5F2ED]">
      {/* Core concept */}
      <section className="bg-[#F5F2ED] py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Philosophy</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C2A28] mb-6 leading-tight whitespace-pre-line" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh
                ? '像造汽车一样造建筑\n像插插头一样完成安装'
                : 'Built Like a Car,\nInstalled Like a Plug'}
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="max-w-3xl space-y-4 text-[#2C2A28]/70 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {zh ? (
                <>
                  <p>微宿整装预制（VIPC）系统是微宿交付模式的核心基础。每台舱体从佛山工厂出厂时均为100%成品——室内家具、机电系统、智能控制均已安装调试完毕，现场只需接通水电即可投入使用。</p>
                  <p>VIPC通过100余次真实项目交付锤炼而成，覆盖高山、密林、滩涂、沙漠、极寒等多种地形。结构工程经过专项设计，确保舱体在多次长途运输和反复吊装过程中不变形，保持整体结构稳定安全。</p>
                </>
              ) : (
                <>
                  <p>The VESSEL Integral Pre-fab Construction (VIPC) system is the foundation of VESSEL&apos;s delivery model. Every unit exits the Foshan factory as a 100% finished product — furnishings, mechanical systems, and smart controls fully installed and tested. On-site work consists only of connecting water and electricity.</p>
                  <p>VIPC was developed through 100+ real-world delivery projects across diverse terrain types including mountain peaks, dense forests, wetlands, deserts, and arctic environments. The structural engineering has been refined to withstand multiple long-distance transports and repeated crane lifts without deformation.</p>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Shipping specs */}
      <section className="bg-[#FAF7F2] py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Logistics</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C2A28] mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '国际运输合规标准' : 'Global Shipping Compliance'}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div className="border border-[#E5DED4] overflow-hidden">
              {SHIPPING.map((s, i) => (
                <div key={s.en} className={`grid grid-cols-2 items-center px-6 py-4 border-b border-[#E5DED4] last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F2ED]'}`}>
                  <span className="text-[#8A8580] text-sm">{zh ? s.zh : s.en}</span>
                  <span className="text-[#2C2A28] text-sm font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Installation steps */}
      <section className="bg-[#F5F2ED] py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C2A28] mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '从工厂到营业，仅需2小时' : 'From Factory to Operating in 2 Hours'}
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-[#E5E0DA]" style={{ top: '2rem' }} />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="relative bg-white border border-[#E5E0DA] p-6 flex flex-col gap-4">
                  <div className="w-10 h-10 bg-[#E36F2C] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold tracking-wider">{s.n}</span>
                  </div>
                  <p className="text-[#2C2A28] font-semibold text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {zh ? s.zh : s.en}
                  </p>
                  <p className="text-[#8A8580] text-xs leading-relaxed">{zh ? s.desc_zh : s.desc_en}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Performance */}
      <section className="bg-[#FAF7F2] py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Performance</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C2A28] mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '结构性能参数' : 'Structural Performance'}
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PERF.map((p, i) => (
              <Reveal key={p.en} delay={i * 60}>
                <div className="bg-white p-6 flex flex-col gap-2 border border-transparent hover:border-[#E36F2C]/20 transition-colors">
                  <span className="text-3xl sm:text-4xl font-bold text-[#E36F2C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{p.value}</span>
                  <span className="text-[#8A8580] text-xs tracking-wider leading-snug">{zh ? p.zh : p.en}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
