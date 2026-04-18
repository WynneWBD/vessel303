'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '300+', en: 'Projects Delivered', zh: '落地项目' },
  { value: '30+',  en: 'Countries Exported', zh: '出口国家' },
  { value: '150+', en: 'National Patents',   zh: '国家专利' },
  { value: '28,800㎡', en: 'Factory Floor Area', zh: '工厂面积' },
];

const TIMELINE = [
  {
    year: '2018',
    en: 'Studio 303 Design establishes VESSEL brand. First steel-framed prototype completed. First production base set up in Sanshui, Foshan.',
    zh: 'Studio 303设计创立VESSEL微宿品牌，完成首台钢结构原型，佛山三水首个生产基地建立。',
  },
  {
    year: '2019',
    en: 'VESSEL C70 (renamed E7) launched. Featured on CCTV News Live. Projects in Hebei and Sichuan.',
    zh: 'E7（原C70）发布，登上央视新闻直播间，河北、四川项目落地。',
  },
  {
    year: '2020',
    en: 'VESSEL V Series and E5 launched. Partnered with China Aerospace and CRRC for R&D.',
    zh: 'V系列与E5发布，与中国航天、中车集团开展联合研发。',
  },
  {
    year: '2021',
    en: 'Second production base established. Projects in Inner Mongolia, Yunnan, Sichuan.',
    zh: '南沙第二生产基地建立，内蒙古、云南、四川等地项目落地。',
  },
  {
    year: '2022',
    en: 'S5 launched. R&D Center opens in Shishan, Foshan. Awarded High-Tech Enterprise status. 100+ projects across all provinces.',
    zh: 'S5发布，佛山狮山研发中心成立，获高新技术企业认定，落地项目覆盖全国全省份。',
  },
  {
    year: '2023',
    en: 'E7 licensed for Japan (Kyushu). Delivered to Iran, Saudi Arabia (+55°C climate). Partnered with Lotus Cars for solar architecture. Partnered with Massimo Corp. for North America.',
    zh: 'E7获日本（九州）认证，成功交付伊朗、沙特（+55°C极端气候）。与Lotus Cars达成太阳能建筑战略合作，与Massimo Corp.合作拓展北美市场。',
  },
  {
    year: '2024',
    en: 'E3 Gen6, E6 Gen6 launched. Partnered with Huawei Smart Home. Projects in Qatar Lake. Completed Qinghai Lake extreme winter test (−32°C).',
    zh: 'E3 Gen6、E6 Gen6发布，与华为智能家居合作，完成青海湖极寒测试（−32°C）。',
  },
  {
    year: '2025',
    en: 'E7 Gen6 launched. VESSEL passed multiple international certifications. Debuted at St. Petersburg International Economic Forum. Participated in Canton Fair.',
    zh: 'E7 Gen6发布，通过多项国际权威认证，亮相圣彼得堡国际经济论坛，参展广交会。',
  },
];

const HONORS = [
  {
    icon: '🏆',
    en: 'Guangdong High-Tech Enterprise',
    zh: '广东省高新技术企业',
    sub_en: '2022',
    sub_zh: '2022',
  },
  {
    icon: '🇪🇺',
    en: 'EU Building Safety Certification',
    zh: '欧盟建筑安全许可证',
    sub_en: 'One of 2–3 qualified Chinese manufacturers',
    sub_zh: '极少数获资质中国制造商之一',
  },
  {
    icon: '🇺🇸',
    en: 'US Building Access Certification',
    zh: '美国建筑准入认证',
    sub_en: 'Compliant export to US market',
    sub_zh: '合规出口美国市场',
  },
  {
    icon: '🎖️',
    en: '2023 Beijing Cultural Tourism Expo — Best Sales Award',
    zh: '2023北京文旅博览会最佳销售奖',
    sub_en: 'National industry recognition',
    sub_zh: '国家级行业认可',
  },
  {
    icon: '🌍',
    en: 'International Mountain Tourism Alliance Member',
    zh: '国际山地旅游联盟成员单位',
    sub_en: 'Global tourism industry body',
    sub_zh: '全球旅游行业组织',
  },
  {
    icon: '💡',
    en: '150+ National IP Patents',
    zh: '150余项国家知识产权专利',
    sub_en: 'Architecture & manufacturing innovation',
    sub_zh: '建筑与制造创新',
  },
];

const PARTNERS = [
  { name: 'Huawei 华为',          desc_en: 'Smart Home Integration', desc_zh: '智能家居集成' },
  { name: 'CRRC 中国中车',         desc_en: 'Joint R&D Partnership',  desc_zh: '联合研发合作' },
  { name: 'China Aerospace 中国航天', desc_en: 'Space-Grade Materials', desc_zh: '航天级材料合作' },
  { name: 'Lotus Cars',           desc_en: 'Solar Roof Technology',   desc_zh: '太阳能屋顶技术' },
  { name: 'Massimo Corp.',        desc_en: 'North America Distribution', desc_zh: '北美市场拓展' },
  { name: "Lin's Furniture 林氏家具", desc_en: 'Interior Furnishing Partner', desc_zh: '室内家具供应商' },
];

// ─── scroll-reveal hook ───────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { lang } = useLanguage();
  const zh = lang === 'zh';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2ED]">
      <Navbar />

      {/* ── S1 Hero ──────────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-4">
            {zh ? 'VESSEL 微宿®' : 'VESSEL®'}
          </p>
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#F0F0F0] leading-none tracking-tight mb-5"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {zh ? '关于微宿' : 'About VESSEL'}
          </h1>
          <p className="text-[#C4B9AB] text-lg sm:text-xl mb-3 tracking-wide">
            {zh ? '高端度假营地开创者' : 'Founder of Space-themed Luxury Camp Resort'}
          </p>
          <p className="text-[#8A8580] text-sm sm:text-base max-w-lg">
            {zh
              ? '自2018年起，重构自然的栖居方式。'
              : 'Since 2018, redefining how the world experiences nature.'}
          </p>
        </div>
      </section>

      {/* ── S2 Stats ─────────────────────────────────────────── */}
      <section className="bg-[#F5F2ED] py-16 px-4 border-b border-[#E5E0DA]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <Reveal key={s.value} delay={i * 80}>
              <div className="text-center">
                <div
                  className="text-4xl sm:text-5xl font-bold text-[#E36F2C] mb-2"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {s.value}
                </div>
                <div className="text-[#8A8580] text-xs sm:text-sm tracking-wider uppercase">
                  {zh ? s.zh : s.en}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── S3 Brand Story ───────────────────────────────────── */}
      <section className="bg-[#F5F2ED] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">
              {zh ? '品牌故事' : 'Our Story'}
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-10"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '从佛山走向世界' : 'From Foshan to the World'}
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal delay={100}>
              <div className="space-y-5 text-[#1A1A1A]/70 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                {zh ? (
                  <>
                    <p>VESSEL微宿®是高端度假营地的开创者。自2018年Studio 303设计团队在佛山创立品牌以来，微宿已在全国落地300余个项目，出口覆盖六大洲30余国，带领中国文旅创新品类"太空主题营地"走向全球。</p>
                    <p>广东微宿文旅发展有限公司作为品牌经营主体，总部位于广东佛山，原创研发团队已获得各项国家专利150余件，自建工厂生产线28,800平方米，月产能150台。</p>
                    <p>微宿全系列产品均采用VIPC整装预制技术——出厂即成品，符合国际海运标准及各国道路运输法规，现场2小时即可完成安装，无需打地基，不破坏一草一木。</p>
                  </>
                ) : (
                  <>
                    <p>VESSEL® is the pioneer of space-themed luxury camp resort. Since Studio 303 Design established the brand in Foshan in 2018, VESSEL has delivered 300+ projects across China and exported to 30+ countries across six continents — bringing the 'Space-themed Luxury Camp Resort' as a Chinese glamping paradigm innovation to the global stage.</p>
                    <p>Guangdong VESSEL Cultural Tourism Development Co., Ltd. operates the brand from its headquarters in Foshan, Guangdong. Our original design team has developed 150+ national intellectual property patents. Our self-owned factory assembly line spans 28,800㎡ with a monthly production capacity of 150+ units.</p>
                    <p>VESSEL products feature the VIPC (Vessel Integral Pre-fab Construction) system — every unit is manufactured as a finished product, compliant with international shipping standards and road transport regulations across most countries. Each unit can be installed in 2 hours, without foundation work or site disruption.</p>
                  </>
                )}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative">
                {/* brand image placeholder */}
                <div className="aspect-[4/3] bg-[#1A1A1A] flex flex-col items-center justify-center rounded-sm overflow-hidden">
                  <div className="w-16 h-16 mb-4 opacity-60">
                    {/* vessel logo mark */}
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" fill="#1A1A1A"/>
                      <path d="M8 16 L32 48 L56 16" stroke="#E36F2C" strokeWidth="3" strokeLinejoin="round" fill="none"/>
                      <path d="M16 16 L32 40 L48 16" stroke="#E36F2C" strokeWidth="1.5" strokeLinejoin="round" fill="none" opacity="0.4"/>
                    </svg>
                  </div>
                  <p className="text-[#E36F2C] text-lg font-bold tracking-widest" style={{ fontFamily: 'DM Sans, sans-serif' }}>VESSEL®</p>
                  <p className="text-[#8A8580] text-xs tracking-[0.25em] mt-1">微 宿</p>
                </div>
                {/* stat badge */}
                <div className="absolute -bottom-4 -right-4 bg-[#E36F2C] text-white px-5 py-3 shadow-lg">
                  <div className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>2018</div>
                  <div className="text-xs tracking-wider opacity-80">{zh ? '品牌创立' : 'Est.'}</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── S4 Timeline ──────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">
              {zh ? '品牌历程' : 'VESSEL Timeline'}
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] mb-14"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '每一步，皆有印记' : 'Every milestone, a mark made'}
            </h2>
          </Reveal>

          <div className="relative">
            {/* vertical spine */}
            <div className="absolute left-[72px] sm:left-1/2 top-0 bottom-0 w-px bg-[#2A2A2E]" />

            <div className="space-y-10">
              {TIMELINE.map((item, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <Reveal key={item.year} delay={i * 60}>
                    {/* mobile: always year-left, text-right-of-spine */}
                    <div className="flex sm:hidden items-start gap-0">
                      <div className="w-[72px] shrink-0 text-right pr-4 pt-0.5">
                        <span className="text-[#E36F2C] text-sm font-bold tracking-wider">{item.year}</span>
                      </div>
                      <div className="relative pl-4 flex-1">
                        <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-[#E36F2C] ring-2 ring-[#1A1A1A]" />
                        <p className="text-[#F0F0F0]/70 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {zh ? item.zh : item.en}
                        </p>
                      </div>
                    </div>

                    {/* desktop: alternating */}
                    <div className="hidden sm:grid grid-cols-2 gap-0 items-start">
                      {isLeft ? (
                        <>
                          <div className="text-right pr-8 pb-2">
                            <span className="text-[#E36F2C] text-sm font-bold tracking-widest block mb-1">{item.year}</span>
                            <p className="text-[#F0F0F0]/70 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {zh ? item.zh : item.en}
                            </p>
                          </div>
                          <div className="pl-8 relative">
                            <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-[#E36F2C] ring-2 ring-[#1A1A1A]" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="pr-8 relative text-right">
                            <div className="absolute right-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-[#E36F2C] ring-2 ring-[#1A1A1A]" />
                          </div>
                          <div className="pl-8">
                            <span className="text-[#E36F2C] text-sm font-bold tracking-widest block mb-1">{item.year}</span>
                            <p className="text-[#F0F0F0]/70 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {zh ? item.zh : item.en}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── S5 Founder ───────────────────────────────────────── */}
      <section className="bg-[#F5F2ED] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">
              {zh ? '创始人 & 首席设计师' : 'Founder & Chief Designer'}
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-10"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '王帅斌' : 'Wang Shuaibin'}
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start">
            <Reveal delay={100}>
              {/* avatar placeholder */}
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-[#E36F2C] flex items-center justify-center shrink-0 mx-auto lg:mx-0 shadow-lg">
                <span
                  className="text-white text-5xl font-bold"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  W
                </span>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div>
                <p className="text-[#8A8580] text-sm tracking-wider uppercase mb-4">
                  {zh ? '建筑师 · 企业家 · 先行者' : 'Architect · Entrepreneur · Visionary'}
                </p>
                <div className="space-y-4 text-[#1A1A1A]/70 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {zh ? (
                    <p>王帅斌于2018年创立VESSEL微宿，以国际建筑师视野重新定义中国文旅行业。他持有英国邓迪大学建筑学硕士（RIBA Part II认证）及美国圣路易斯华盛顿大学建筑学硕士学位，曾任职于纽约华尔街SOM建筑设计事务所。在他的带领下，微宿开创了"太空主题高端度假营地"品类，成长为出口30余国的全球知名品牌。</p>
                  ) : (
                    <p>Wang Shuaibin founded VESSEL in 2018, bringing an international architectural perspective to the cultural tourism industry. He holds Master of Architecture degrees from both the University of Dundee (RIBA Part II) and Washington University in St. Louis, and previously worked at SOM Architects on Wall Street, New York City. Under his leadership, VESSEL pioneered the 'space-themed luxury camp resort' category and has grown into a globally recognized brand with exports across 30+ countries.</p>
                  )}
                </div>

                {/* credential tags */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {[
                    zh ? 'Dundee RIBA Part II' : 'Univ. of Dundee — RIBA Part II',
                    zh ? '华盛顿大学建筑学硕士' : 'Washington Univ. in St. Louis — M.Arch',
                    zh ? 'SOM 建筑事务所 纽约' : 'SOM Architects — NYC',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 border border-[#C4B9AB] text-[#8A8580] tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── S6 Honors ────────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">
              {zh ? '荣誉与认证' : 'Recognition & Certifications'}
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] mb-10"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '国际认可，品质背书' : 'Globally recognised, quality assured'}
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {HONORS.map((h, i) => (
              <Reveal key={h.en} delay={i * 60}>
                <div className="bg-[#2A2A2E] p-5 h-full flex flex-col gap-3 hover:border-[#E36F2C]/30 border border-transparent transition-colors">
                  <span className="text-2xl">{h.icon}</span>
                  <p
                    className="text-[#F0F0F0] text-sm font-semibold leading-snug"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {zh ? h.zh : h.en}
                  </p>
                  <p className="text-[#8A8580] text-xs leading-snug mt-auto">
                    {zh ? h.sub_zh : h.sub_en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── S7 Partners ──────────────────────────────────────── */}
      <section className="bg-[#F5F2ED] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-2">
              {zh ? '战略合作伙伴' : 'Strategic Partners'}
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '与世界同行' : 'Building with the best'}
            </h2>
            <p className="text-[#8A8580] text-sm max-w-lg mb-10 leading-relaxed">
              {zh
                ? '与全球知名品牌联合开发，共同引领智能居住前沿。'
                : 'Collaborating with world-leading brands to innovate at the frontier of smart living.'}
            </p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PARTNERS.map((p, i) => (
              <Reveal key={p.name} delay={i * 60}>
                <div className="bg-white border border-[#E5E0DA] p-5 flex flex-col gap-2 hover:border-[#E36F2C]/40 hover:shadow-sm transition-all">
                  <p
                    className="text-[#1A1A1A] text-sm font-semibold leading-snug"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {p.name}
                  </p>
                  <p className="text-[#8A8580] text-xs leading-snug">
                    {zh ? p.desc_zh : p.desc_en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {zh ? '合作咨询' : 'Partner with us'}
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '准备将微宿引入您的项目？' : 'Ready to bring VESSEL to your project?'}
            </h2>
            <p className="text-[#8A8580] text-sm max-w-md mx-auto mb-8 leading-relaxed">
              {zh
                ? '专业顾问团队为您提供一对一方案咨询，24小时内响应。'
                : 'Our specialist team offers 1-on-1 project consulting. Response within 24 hours.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="https://en.303vessel.cn/contact.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3.5 bg-[#E36F2C] text-white text-sm font-semibold tracking-wider hover:bg-[#C85A1F] transition-colors"
              >
                {zh ? '联系我们' : 'Contact VESSEL'}
              </Link>
              <Link
                href="/global"
                className="inline-block px-8 py-3.5 border border-white/20 text-white/70 text-sm font-medium tracking-wider hover:border-[#E36F2C] hover:text-[#E36F2C] transition-colors"
              >
                {zh ? '查看全球项目' : 'View Global Projects'}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
