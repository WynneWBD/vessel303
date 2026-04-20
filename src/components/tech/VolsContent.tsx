'use client';

import { Reveal } from './Reveal';

const SUBSYSTEMS = [
  {
    icon: '☀️',
    en: 'Solar Generation',
    zh: '屋顶光伏',
    desc_en: 'Rooftop PV panels integrated in partnership with Lotus Cars. Standardized mounting interface on all Gen6 units. Powers the entire cabin including AC, lighting, and appliances.',
    desc_zh: '与Lotus Cars合作集成屋顶光伏板，第六代全系标配安装接口，为舱内空调、照明、家电全量供电。',
  },
  {
    icon: '🔋',
    en: 'Energy Storage',
    zh: '大容量储能',
    desc_en: 'Optional battery capacity over 100kWh. 90% charge-discharge cycle efficiency. Supports multi-day autonomy in low-sunlight conditions.',
    desc_zh: '可选超100kWh容量蓄电池，90%充放电循环效率，低光照条件下支持多日自给。',
  },
  {
    icon: '💧',
    en: 'Water Supply',
    zh: '净水系统',
    desc_en: 'Integrated freshwater tank and filtration system. Clean water on tap without municipal connection. Configurable tank capacity based on unit count and usage.',
    desc_zh: '集成净水箱与过滤系统，无市政管网接入即可实现正常用水，根据项目规模配置储水容量。',
  },
  {
    icon: '♻️',
    en: 'VSRB Wastewater Treatment',
    zh: 'VSRB污水处理',
    desc_en: 'VSRB biological wastewater treatment — biodegradation technology achieving zero-pollution discharge. Integrated septic tank and VSRB treatment pool. No sewage connection required.',
    desc_zh: 'VSRB生物污水处理系统，生物降解技术实现零污染排放，集成化粪池与VSRB处理池，无需市政排污接入。',
  },
];

const SPECS = [
  { en: 'Battery Capacity', zh: '储能容量', value: '100kWh+ (optional / 可选)' },
  { en: 'Charge-discharge Efficiency', zh: '充放电效率', value: '90%' },
  { en: 'Solar Partner', zh: '光伏合作方', value: 'Lotus Cars (UK)' },
  { en: 'Wastewater Technology', zh: '污水处理技术', value: 'VSRB Biological Degradation' },
  { en: 'Discharge Standard', zh: '排放标准', value: 'Zero Pollution / 零污染排放' },
  { en: 'Infrastructure Required', zh: '基建要求', value: 'None / 无需市政水电' },
];

const SCENARIOS = [
  {
    en: 'Remote Mountain',
    zh: '偏远山区',
    desc_en: 'No grid access, extreme terrain — VOLS enables full operations at altitude.',
    desc_zh: '无电网接入、极端地形——VOLS助力高海拔全面运营。',
    icon: '⛰️',
  },
  {
    en: 'Desert & Arid Regions',
    zh: '沙漠干旱地区',
    desc_en: 'High solar yield, no municipal infrastructure — ideal VOLS conditions.',
    desc_zh: '光照充足，无市政配套——VOLS理想应用环境。',
    icon: '🏜️',
  },
  {
    en: 'Island & Marine Environments',
    zh: '海岛滨海环境',
    desc_en: 'Salt-air resistant systems, water independence for island luxury resorts.',
    desc_zh: '耐盐雾系统，海岛度假营地水源完全自给。',
    icon: '🏝️',
  },
];

export default function VolsContent({ lang }: { lang: 'en' | 'zh' }) {
  const zh = lang === 'zh';

  return (
    <div className="bg-[#F5F2ED]">
      {/* Overview */}
      <section className="bg-[#F5F2ED] py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Overview</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '真正的能源自由' : 'True Energy Independence'}
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="max-w-3xl space-y-4 text-[#1A1A1A]/70 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {zh ? (
                <>
                  <p>微宿离网系统（VOLS）使第六代微宿产品完全脱离市政水电基础设施独立运行，无需现场配套水电管线工程。</p>
                  <p>VOLS是微宿与Lotus Cars战略合作的成果，将Lotus Cars先进太阳能屋顶技术与微宿模块化建筑深度融合。系统将屋顶光伏发电、大容量储能、净水管理和生物污水处理整合于底层设备层，一体化集成交付。</p>
                </>
              ) : (
                <>
                  <p>The VESSEL Off-grid Living System (VOLS) enables VESSEL Gen6 units to operate completely independently of municipal water and electricity infrastructure. No on-site piping or electrical grid connection is required.</p>
                  <p>VOLS is the product of a strategic partnership with Lotus Cars, integrating advanced solar roof technology with VESSEL&apos;s modular architecture. The system combines rooftop photovoltaic generation, high-capacity battery storage, freshwater management, and biological wastewater treatment into a single integrated underfloor mechanical level.</p>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Four Subsystems */}
      <section className="bg-[#1A1A1A] py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Systems</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '四大一体化子系统' : 'Four Integrated Systems'}
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-4">
            {SUBSYSTEMS.map((s, i) => (
              <Reveal key={s.en} delay={i * 70}>
                <div className="bg-[#2A2A2E] p-7 flex flex-col gap-4 border border-transparent hover:border-[#E36F2C]/20 transition-colors h-full">
                  <span className="text-3xl">{s.icon}</span>
                  <p className="text-[#F0F0F0] font-semibold text-base" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {zh ? s.zh : s.en}
                  </p>
                  <p className="text-[#8A8580] text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {zh ? s.desc_zh : s.desc_en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="bg-[#F5F2ED] py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Specifications</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '技术规格' : 'Technical Specifications'}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div className="border border-[#E5E0DA] overflow-hidden">
              {SPECS.map((s, i) => (
                <div key={s.en} className={`grid grid-cols-2 items-center px-6 py-4 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F2ED]'} border-b border-[#E5E0DA] last:border-0`}>
                  <span className="text-[#1A1A1A]/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {zh ? s.zh : s.en}
                  </span>
                  <span className="text-[#1A1A1A] text-sm font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Scenarios */}
      <section className="bg-[#1A1A1A] py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">Applications</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '离网部署的理想解决方案' : 'Ideal For Off-grid Deployment'}
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {SCENARIOS.map((s, i) => (
              <Reveal key={s.en} delay={i * 70}>
                <div className="bg-[#2A2A2E] p-7 flex flex-col gap-4 border border-transparent hover:border-[#E36F2C]/30 transition-colors">
                  <span className="text-4xl">{s.icon}</span>
                  <p className="text-[#F0F0F0] font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {zh ? s.zh : s.en}
                  </p>
                  <p className="text-[#8A8580] text-sm leading-relaxed">{zh ? s.desc_zh : s.desc_en}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
