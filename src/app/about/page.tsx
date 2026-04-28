'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ProtectedImage from '@/components/ProtectedImage';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TechDrawer from '@/components/TechDrawer';
import GlobalMapPreview from '@/components/GlobalMapPreview';
import { useLanguage } from '@/contexts/LanguageContext';

type Tech = 'viie' | 'vols' | 'vipc';

type AwardItem = {
  id: string;
  src: string;
  en: string;
  zh: string;
  isVisible: boolean;
};

type RemotePageModuleItem = {
  id?: string;
  image_url?: string;
  value_zh?: string;
  value_en?: string;
  label_zh?: string;
  label_en?: string;
  content_zh?: string;
  content_en?: string;
  is_visible?: boolean;
  sort_order?: number;
};

type RemotePageModule = {
  is_visible?: boolean;
  items?: RemotePageModuleItem[];
};

// ─── scroll reveal ────────────────────────────────────────────────────────────

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children, delay = 0, className = '', from = 'bottom',
}: {
  children: React.ReactNode; delay?: number; className?: string; from?: 'bottom' | 'left' | 'right' | 'none';
}) {
  const { ref, visible } = useReveal();
  const translateMap = { bottom: 'translateY(28px)', left: 'translateX(-28px)', right: 'translateX(28px)', none: 'none' };
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0)' : translateMap[from],
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function useAboutModule(moduleKey: string) {
  const [pageModule, setPageModule] = useState<RemotePageModule | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModule() {
      try {
        const res = await fetch(`/api/page-modules/about?module=${moduleKey}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPageModule(data?.data ?? null);
      } catch {
        // Keep static fallback content if the CMS endpoint is unavailable.
      }
    }

    loadModule();
    return () => { cancelled = true; };
  }, [moduleKey]);

  return pageModule;
}

function moduleItems(pageModule: RemotePageModule | null) {
  if (!pageModule || pageModule.is_visible === false || !Array.isArray(pageModule.items)) return [];
  return [...pageModule.items]
    .filter((item) => item.is_visible !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

function itemById(items: RemotePageModuleItem[], id: string) {
  return items.find((item) => item.id === id);
}

function localText(item: RemotePageModuleItem | undefined, zh: boolean, fallback: string) {
  if (!item) return fallback;
  return (zh ? item.label_zh : item.label_en) || fallback;
}

function localContent(item: RemotePageModuleItem | undefined, zh: boolean, fallback: string) {
  if (!item) return fallback;
  return (zh ? item.content_zh : item.content_en) || fallback;
}

function localValue(item: RemotePageModuleItem | undefined, zh: boolean, fallback: string) {
  if (!item) return fallback;
  return (zh ? item.value_zh : item.value_en) || fallback;
}

// ─── data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '300+',    en: 'Projects Delivered',   zh: '落地项目' },
  { value: '30+',     en: 'Countries',            zh: '出口国家' },
  { value: '28,800㎡',en: 'Owned Factory',        zh: '自建工厂' },
  { value: '150+',    en: 'National Patents',      zh: '国家专利' },
  { value: '150 units', valueZh: '150 台', en: 'Monthly Capacity', zh: '月产能' },
  { value: '10M+', valueZh: '1000万+', en: 'Social Followers', zh: '全网粉丝' },
];

const TIMELINE = [
  {
    year: '2018',
    en: 'Studio 303 Design establishes VESSEL®. First steel-framed prototype completed. First production base set up in Sanshui, Foshan.',
    zh: 'Studio 303 设计创立 VESSEL 微宿®，完成首台钢结构原型，佛山三水首个生产基地建立。',
  },
  {
    year: '2019',
    en: 'E7 (originally C70) launches. Featured live on CCTV National News. Projects delivered to Hebei and Sichuan.',
    zh: 'E7（原 C70）发布，登上央视新闻直播间，河北、四川项目落地。',
  },
  {
    year: '2020',
    en: 'V Series and E5 launch. Joint R&D partnerships formed with China Aerospace and CRRC.',
    zh: 'V 系列与 E5 发布，与中国航天、中车集团开展联合研发。',
  },
  {
    year: '2021',
    en: 'Second production base established. Projects across Inner Mongolia, Yunnan, and Sichuan.',
    zh: '南沙第二生产基地建立，内蒙古、云南、四川等地项目落地。',
  },
  {
    year: '2022',
    en: 'S5 launched. R&D Center opens in Shishan, Foshan. Awarded High-Tech Enterprise status. Projects now cover all provinces.',
    zh: 'S5 发布，佛山狮山研发中心成立，获高新技术企业认定，落地项目覆盖全国全省份。',
  },
  {
    year: '2023',
    en: 'E7 certified for Japan (Kyushu). Delivered to Iran and Saudi Arabia (+55°C). Strategic partnership with Lotus Cars. North America expansion with Massimo Corp.',
    zh: 'E7 获日本（九州）认证，成功交付伊朗、沙特（+55°C）。与 Lotus Cars 太阳能建筑战略合作，与 Massimo Corp. 拓展北美市场。',
  },
  {
    year: '2024',
    en: 'E3 Gen6 and E6 Gen6 launch. Huawei Smart Home partnership. Projects at Qatar Lake. Qinghai Lake winter test completed (−32°C).',
    zh: 'E3 Gen6、E6 Gen6 发布，华为智能家居合作，青海湖极寒测试（−32°C）完成。',
  },
  {
    year: '2025',
    en: 'E7 Gen6 launches. Multiple international certifications passed. Debut at St. Petersburg International Economic Forum. Canton Fair participation.',
    zh: 'E7 Gen6 发布，通过多项国际权威认证，亮相圣彼得堡国际经济论坛，参展广交会。',
  },
];

const AWARDS: AwardItem[] = [
  {
    id: 'about-award-01',
    src: '/images/about/about_award-01.jpg',
    en: '2020 Jingzhu Award · Homestay Hotel Application Demonstration Project',
    zh: '2020景筑奖 · 民宿酒店应用示范项目',
    isVisible: true,
  },
  {
    id: 'about-award-02',
    src: '/images/about/about_award-02.jpg',
    en: '2021 Greater Bay Area Digital Fashion Award',
    zh: '2021粤港澳大湾区数字时尚大奖',
    isVisible: true,
  },
  {
    id: 'about-award-03',
    src: '/images/about/about_award-03.jpg',
    en: '2019 China Innovation & Entrepreneurship Fair · Technology Innovation Growth Enterprise',
    zh: '2019中国创新创业成果交易会 · 技术创新成长企业',
    isVisible: true,
  },
  {
    id: 'about-award-04',
    src: '/images/about/about_award-04.jpg',
    en: '2023 Haibei Eco Camping Season · Silver Award',
    zh: '2023海北州生态露营季 · 银奖',
    isVisible: true,
  },
  {
    id: 'about-award-05',
    src: '/images/about/about_award-05.jpg',
    en: 'China Tourism Vehicle & Cruise Association · Innovative Travel Service Recognition',
    zh: '中国旅游车船协会 · 旅游出行行业创新发展服务',
    isVisible: true,
  },
  {
    id: 'about-award-06',
    src: '/images/about/about_award-06.jpg',
    en: '2018 Global Mobile Internet Creative Development Competition · First Place',
    zh: '2018全球移动互联网开发创意大赛 · 体育文旅创新创业赛第一名',
    isVisible: true,
  },
  {
    id: 'about-award-07',
    src: '/images/about/about_award-07.jpg',
    en: '2023 Haibei Eco Camping Season · Silver Award',
    zh: '2023海北州生态露营季 · 银奖',
    isVisible: true,
  },
  {
    id: 'about-award-08',
    src: '/images/about/about_award-08.jpg',
    en: 'Partner Creative Group Cultural & Tourism Equipment Production and Research Base',
    zh: '同路创意集团文旅装备产研基地',
    isVisible: true,
  },
  {
    id: 'about-award-09',
    src: '/images/about/about_award-09.jpg',
    en: '2023 Haibei Eco Camping Season · Silver Award Certificate',
    zh: '2023海北州生态露营季 · 银奖证书',
    isVisible: true,
  },
  {
    id: 'about-award-10',
    src: '/images/about/about_award-10.jpg',
    en: 'Member of the Enterprise Credit Construction Committee',
    zh: '中企信办信用建设工作委员会会员单位',
    isVisible: true,
  },
  {
    id: 'about-award-11',
    src: '/images/about/about_award-11.jpg',
    en: '2023 Beijing International Cultural Tourism Consumption Expo · Product Sales Award',
    zh: '2023北京国际文旅消费博览会 · 文旅消费产品销售奖',
    isVisible: true,
  },
  {
    id: 'about-award-12',
    src: '/images/about/about_award-12.jpg',
    en: 'International Mountain Tourism Alliance Membership Certificate',
    zh: '国际山地旅游联盟会员证',
    isVisible: true,
  },
  {
    id: 'about-award-13',
    src: '/images/about/about_award-13.jpg',
    en: '2025 High-Tech Enterprise Certificate',
    zh: '2025高新技术企业证书',
    isVisible: true,
  },
];

const PARTNERS = Array.from({ length: 33 }, (_, i) => `/images/about/about_partner-${String(i + 1).padStart(2, '0')}.png`);

// factory-02 used in brand story; remaining: 01(hero) + 03/04/05/06 (grid)
const FACTORY_HERO = '/images/about/about_factory-01.jpg';
const FACTORY_GRID = [
  '/images/about/about_factory-03.jpg',
  '/images/about/about_factory-04.jpg',
  '/images/about/about_factory-05.jpg',
  '/images/about/about_factory-06.png',
];

const SERVICES = [
  {
    n: '01',
    en: 'Strategic Planning & Consulting',
    zh: '规划策划服务',
    desc_en: 'We engage from day one — positioning, master planning, product selection, cabin layout, investment modelling and operating strategy — so the resort doesn\'t just open, it performs.',
    desc_zh: '从项目立项起介入：项目定位、整体规划、产品选型、舱体布置、投资测算、运营策略——让营地从"能开业"变成"能挣钱"。',
  },
  {
    n: '02',
    en: 'Bespoke Product Development',
    zh: '产品定制开发',
    desc_en: 'End-to-end customisation — interior layout, exterior form, multi-cabin configurations, deep MEP and smart integration, and assembly of locally sourced components for overseas projects.',
    desc_zh: '全方位定制：室内布局、外观结构、多舱组合、水电智能深度集成，支持海外本地零部件组装，适配不同场景与各国法规。',
  },
  {
    n: '03',
    en: 'Operations Support & Acceleration',
    zh: '运营陪跑服务',
    desc_en: 'We build the full online stack from scratch — social media, OTA distribution, creator partnerships — backed by VESSEL\'s own brand resources for tens-of-millions-reach traffic support.',
    desc_zh: '从 0 到 1 搭建社媒账号矩阵与 OTA 分销渠道，借助微宿品牌官方资源做千万级流量引流，让营地运营省心高效。',
  },
];

// ─── anchor nav ──────────────────────────────────────────────────────────────

const ANCHOR_LINKS = [
  { id: 'brand-story', en: 'Brand Story',   zh: '品牌故事' },
  { id: 'technologies', en: 'Technologies', zh: '三大技术' },
  { id: 'certifications', en: 'Certifications', zh: '认证荣誉' },
  { id: 'founder',     en: 'Founder',       zh: '创始人' },
];

function AnchorNav({ activeSection, zh }: { activeSection: string; zh: boolean }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div className="sticky top-16 lg:top-[72px] z-40 bg-[#241F1B] border-b border-[#3A302A]">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-8 py-3 overflow-x-auto">
        {ANCHOR_LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            onClick={(e) => handleClick(e, link.id)}
            className={`text-sm tracking-wider whitespace-nowrap transition-colors duration-150 pb-0.5 ${
              activeSection === link.id
                ? 'text-[#E36F2C] border-b border-[#E36F2C]'
                : 'text-[#8A8580] hover:text-[#E36F2C]'
            }`}
          >
            {zh ? link.zh : link.en}
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { lang } = useLanguage();
  const zh = lang === 'zh';
  const [activeSection, setActiveSection] = useState('brand-story');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTech, setActiveTech] = useState<Tech | null>(null);
  const [awards, setAwards] = useState(AWARDS);
  const heroModule = useAboutModule('hero');
  const statsModule = useAboutModule('stats');
  const brandStoryModule = useAboutModule('brand-story');
  const heroItems = moduleItems(heroModule);
  const statsItems = moduleItems(statsModule);
  const storyItems = moduleItems(brandStoryModule);
  const heroImage = itemById(heroItems, 'about-hero-image')?.image_url || '/images/about/about_scene-01.jpg';
  const storyImage = itemById(storyItems, 'story-image')?.image_url || '/images/about/about_factory-02.jpg';
  const storyBadge = itemById(storyItems, 'story-badge');
  const aboutStats = statsModule?.is_visible === false
    ? []
    : statsModule
    ? statsItems.map((item, index) => ({
        value: localValue(item, zh, STATS[index]?.value ?? ''),
        en: item.label_en || STATS[index]?.en || '',
        zh: item.label_zh || STATS[index]?.zh || '',
      })).filter((item) => item.value || item.en || item.zh)
    : STATS.map((item) => ({
        value: zh && item.valueZh ? item.valueZh : item.value,
        en: item.en,
        zh: item.zh,
      }));
  const showBrandStory = brandStoryModule?.is_visible !== false;
  const storyParagraphFallbacks = [
    {
      id: 'story-paragraph-01',
      zh: 'VESSEL 微宿® 是高端度假营地开创者。我们以科幻感强烈的装配式舱体产品为特色，为全球文旅运营方提供一站式营地解决方案。自 2018 年创立，已在全国落地 300+ 项目，出口远销 30+ 国家，带领中国文旅创新品类"太空主题营地"走向全球。',
      en: 'VESSEL® pioneered the space-themed luxury camp resort category. We design, manufacture and deliver sci-fi-inspired prefabricated cabins, offering a turnkey solution for resort operators worldwide. Since 2018 we have delivered 300+ projects across China and exported to 30+ countries, taking the space-themed resort — a new Chinese category of experiential tourism — to the global market.',
    },
    {
      id: 'story-paragraph-02',
      zh: 'VESSEL 品牌由广东微宿文旅发展有限公司运营，总部位于广东佛山。我们坚持原创研发与自建工厂双核心：研发团队累计获得国家专利 150+ 件，自有生产线占地 28,800 ㎡，月产能 150 台。',
      en: 'The VESSEL® brand is operated by Guangdong Vessel Cultural Tourism Development Co., Ltd., headquartered in Foshan, China. In-house R&D and owned manufacturing are our two strategic pillars: our design team holds 150+ national patents, and our 28,800 m² production line delivers a monthly capacity of 150 units.',
    },
    {
      id: 'story-paragraph-03',
      zh: 'VESSEL 在文旅场景之外，也与头部企业共创，产品广泛应用于养老度假地产、城市移动商业、便民服务设施等多元场景。我们构建了 VIPC 整装预制、VIIE 智能交互、VOLS 离网系统三大核心技术体系，让每一台微宿都能独立面对全球的气候、运输、运营挑战。',
      en: 'Beyond tourism, VESSEL® partners with leading enterprises on mixed-use deployments — senior resort real estate, urban mobile retail, and public amenity installations. Our three proprietary technology systems — VIPC, VIIE and VOLS — allow every unit to operate autonomously under diverse climates, logistics routes and operating models worldwide.',
    },
  ];
  const storyParagraphs = storyParagraphFallbacks
    .map((item) => localContent(itemById(storyItems, item.id), zh, zh ? item.zh : item.en))
    .filter(Boolean);

  const openTech = (tech: Tech) => {
    setActiveTech(tech);
    setDrawerOpen(true);
  };

  useEffect(() => {
    const ids = ['brand-story', 'technologies', 'certifications', 'founder'];
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.25 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAwards() {
      try {
        const res = await fetch('/api/page-modules/about?module=recognition-awards', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const pageModule = data?.data;
        if (!pageModule || pageModule.is_visible === false || !Array.isArray(pageModule.items)) {
          if (!cancelled && pageModule?.is_visible === false) setAwards([]);
          return;
        }

        const remote = new Map<string, RemotePageModuleItem>();
        for (const item of pageModule.items as unknown[]) {
          if (!item || typeof item !== 'object') continue;
          const value = item as RemotePageModuleItem;
          const key = value.image_url || value.id || '';
          if (key) remote.set(key, value);
        }

        const merged = AWARDS
          .map((award) => {
            const value = remote.get(award.src) ?? remote.get(award.id);
            if (!value) return award;
            return {
              ...award,
              zh: value.label_zh || award.zh,
              en: value.label_en || award.en,
              isVisible: value.is_visible !== false,
            };
          })
          .filter((award) => award.isVisible);

        if (!cancelled) setAwards(merged);
      } catch {
        // Keep the static fallback content if the CMS endpoint is unavailable.
      }
    }

    loadAwards();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#241F1B]">
      <Navbar />

      {/* ── S1 Hero ───────────────────────────────────────────── */}
      <section className="relative h-[90vh] min-h-[600px] flex items-end">
        <Image
          src={heroImage}
          alt="VESSEL® brand"
          fill
          priority
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241F1B] via-[#241F1B]/50 to-[#241F1B]/10" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 w-full">
          <p className="text-[#E36F2C] text-xs tracking-[0.4em] uppercase font-medium mb-5">
            {localText(itemById(heroItems, 'about-hero-eyebrow'), zh, `VESSEL® · ${zh ? '关于微宿' : 'About'}`)}
          </p>
          <h1
            className="text-4xl sm:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-5 break-words"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {localText(itemById(heroItems, 'about-hero-headline'), zh, zh ? '重构\n自然的栖居' : 'Reimagining\nNatural Dwelling')}
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-xl leading-relaxed">
            {localText(
              itemById(heroItems, 'about-hero-subtitle'),
              zh,
              zh
                ? '自 2018 年创立，已在全国落地 300+ 项目，出口远销 30+ 国家，带领中国文旅创新品类走向全球。'
                : 'Since 2018 we have delivered 300+ projects across China and exported to 30+ countries, taking a new Chinese category of experiential tourism to the global market.',
            )}
          </p>
        </div>
      </section>

      {/* ── Anchor Nav ───────────────────────────────────────── */}
      <AnchorNav activeSection={activeSection} zh={zh} />

      {/* ── S2 Stats bar ─────────────────────────────────────── */}
      {aboutStats.length > 0 ? (
        <section className="bg-[#F5F2ED] border-b border-[#E5E0DA]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-3 lg:grid-cols-6 divide-x divide-[#E5E0DA]">
              {aboutStats.map((s, i) => (
                <Reveal key={`${s.value}-${i}`} delay={i * 50} className="py-8 px-4 text-center">
                  <div
                    className="text-2xl sm:text-3xl font-bold text-[#E36F2C] mb-1"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {s.value}
                  </div>
                  <div className="text-[#8A8580] text-[11px] tracking-wider uppercase leading-tight">
                    {zh ? s.zh : s.en}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── S3 Brand story ───────────────────────────────────── */}
      {showBrandStory ? (
      <section id="brand-story" className="bg-[#F5F2ED] py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
                {localText(itemById(storyItems, 'story-kicker'), zh, zh ? '品牌介绍' : 'About VESSEL®')}
              </p>
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#241F1B] mb-8 leading-tight"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {localText(
                  itemById(storyItems, 'story-heading'),
                  zh,
                  zh ? '高端度假营地\n开创者' : 'Pioneer of the\nSpace-Themed\nLuxury Camp Resort',
                )}
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div
                className="space-y-5 text-[#241F1B]/70 text-base leading-relaxed"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={80} from="right" className="relative">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={storyImage}
                alt="VESSEL factory aerial"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {/* stat badge */}
            <div className="absolute -bottom-5 -left-5 bg-[#E36F2C] text-white px-6 py-4 shadow-xl">
              <div className="text-3xl font-bold leading-none" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {localValue(storyBadge, zh, '2018')}
              </div>
              <div className="text-xs tracking-widest opacity-80 mt-1">
                {localText(storyBadge, zh, zh ? '品牌创立' : 'FOUNDED')}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      ) : null}

      {/* ── S4 Factory ───────────────────────────────────────── */}
      <section className="bg-[#241F1B] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {zh ? '智造实力' : 'Manufacturing'}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#F5F2ED] leading-tight"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {zh ? '28,800㎡\n精密智造基地' : '28,800 m²\nPrecision Factory'}
              </h2>
              <p className="text-[#8A8580] text-sm max-w-xs leading-relaxed">
                {zh
                  ? '佛山狮山自有工厂，月产能 150 台，出厂即成品。'
                  : 'Self-owned facility in Shishan, Foshan. 150 units monthly. Every unit leaves as a finished product.'}
              </p>
            </div>
          </Reveal>

          {/* factory grid B: full-width hero + 2-col small grid */}
          <div className="flex flex-col gap-2">
            <Reveal>
              <div className="relative w-full rounded-sm overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <ProtectedImage src={FACTORY_HERO} alt="VESSEL factory" fill className="object-cover group-hover:scale-105 transition-transform duration-700" containerClassName="group" unoptimized />
              </div>
            </Reveal>
            <div className="grid grid-cols-2 gap-2">
              {FACTORY_GRID.map((src, i) => (
                <Reveal key={src} delay={i * 60}>
                  <div className="relative rounded-sm overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <ProtectedImage src={src} alt={`VESSEL factory ${i + 2}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" containerClassName="group" unoptimized />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── S5 Timeline ──────────────────────────────────────── */}
      <section className="bg-[#F5F2ED] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-14">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {zh ? '品牌历程' : 'Timeline'}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#241F1B]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '每一步，皆有印记' : 'Every milestone,\na mark made'}
            </h2>
          </Reveal>

          <div className="space-y-0">
            {TIMELINE.map((item, i) => (
              <Reveal key={item.year} delay={i * 40}>
                <div className={`grid sm:grid-cols-[120px_1fr] gap-0 border-t border-[#E5E0DA] py-7 group ${i === TIMELINE.length - 1 ? 'border-b' : ''}`}>
                  <div className="flex items-start pt-1">
                    <span
                      className="text-3xl font-bold text-[#E36F2C] group-hover:text-[#C85A1F] transition-colors"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {item.year}
                    </span>
                  </div>
                  <p
                    className="text-[#241F1B]/70 text-sm sm:text-base leading-relaxed"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {zh ? item.zh : item.en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technologies ─────────────────────────────────────── */}
      <section id="technologies" className="bg-[#F5F2ED] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal className="mb-12">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-4">
              {zh ? '核心技术体系' : 'CORE TECHNOLOGIES'}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#241F1B] mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '三大自研技术体系' : 'Three Proprietary Systems'}
            </h2>
            <p className="text-[#8A8580] text-sm max-w-2xl leading-relaxed">
              {zh
                ? '每一台微宿背后的工程基础——面向全球部署而生。'
                : 'The engineering foundation behind every VESSEL unit — built for global deployment.'}
            </p>
          </Reveal>

          <div className="border-t border-[#E5E0DA]">
            {[
              {
                tech: 'viie' as const,
                nameEn: 'VesselOS · VIIE',
                nameZh: 'VesselOS · 智能交互',
                descEn: 'Proprietary platform. 1,400+ units globally connected. Full remote control of lighting, climate, access and monitoring.',
                descZh: '完全自研平台，全球1,400余台舱体联网，远程掌控灯光、空调、门锁与实时监控。',
              },
              {
                tech: 'vols' as const,
                nameEn: 'VOLS · Off-grid System',
                nameZh: 'VOLS · 离网系统',
                descEn: 'Solar generation + 100kWh+ storage + VSRB zero-discharge treatment. No municipal infrastructure needed.',
                descZh: '光伏发电 + 100kWh+储能 + VSRB生物污水零排放，完全脱离市政水电基础设施。',
              },
              {
                tech: 'vipc' as const,
                nameEn: 'VIPC · Pre-fab System',
                nameZh: 'VIPC · 整装预制',
                descEn: '100% finished at factory. 2-hour site installation. 40ft Flat Rack compliant. 30+ countries delivered.',
                descZh: '工厂100%成品出厂，现场2小时完成安装，符合40尺平架集装箱规格，已合规交付30余国。',
              },
            ].map((item) => (
              <Reveal key={item.tech}>
                <button
                  type="button"
                  onClick={() => openTech(item.tech)}
                  className="group w-full flex items-start gap-5 py-8 border-b border-[#E5E0DA] text-left hover:bg-[#EDE8E0]/50 transition-colors duration-200 px-2"
                >
                  <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#E36F2C] mt-2.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-2">
                      <h3
                        className="text-xl sm:text-2xl font-bold text-[#241F1B]"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {zh ? item.nameZh : item.nameEn}
                      </h3>
                      <span className="shrink-0 text-[#E36F2C] text-sm tracking-wider group-hover:translate-x-1 transition-transform duration-200">
                        {zh ? '了解详情 →' : 'View Details →'}
                      </span>
                    </div>
                    <p
                      className="text-[#241F1B]/60 text-sm sm:text-base leading-relaxed"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {zh ? item.descZh : item.descEn}
                    </p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── S8 Certifications ────────────────────────────────── */}
      <section id="certifications" className="bg-[#241F1B] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {zh ? '荣誉与认证' : 'Recognition & Certifications'}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#F5F2ED]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {zh ? '国际认可\n品质背书' : 'Globally Recognised,\nQuality Assured'}
              </h2>
              <p className="text-[#8A8580] text-sm max-w-xs leading-relaxed">
                {zh
                  ? '欧盟建筑安全许可 · 美国建筑准入认证 · 广东省高新技术企业'
                  : 'EU Building Safety · US Building Access · Guangdong High-Tech Enterprise'}
              </p>
            </div>
          </Reveal>

          {/* International cert photos */}
          <Reveal className="mb-10">
            <p className="text-[#F5F2ED] text-sm font-semibold mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {zh ? '国际认证证书' : 'International Certifications'}
            </p>
            <p className="text-[#8A8580] text-xs mb-6">
              {zh ? '欧盟及国际权威机构颁发' : 'Issued by European and international accredited bodies'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  src: '/images/about/certs/cert-cpr.png',
                  en: 'CE Factory Production Control · EN 1090-1',
                  zh: 'CE欧盟工厂生产合规认证 · EN 1090-1',
                },
                {
                  src: '/images/about/certs/cert-ce-gpsd.png',
                  en: 'CE General Product Safety · ECM Italy',
                  zh: 'CE通用产品安全认证 · ECM意大利',
                },
                {
                  src: '/images/about/certs/cert-iso9001.png',
                  en: 'ISO 9001:2015 Quality Management System',
                  zh: 'ISO 9001质量管理体系',
                },
                {
                  src: '/images/about/certs/cert-voc.png',
                  en: 'EU CPR Verification of Conformity · 40+ Models Covered',
                  zh: '欧盟CPR合规验证 · 覆盖40+型号',
                },
              ].map((cert, i) => (
                <Reveal key={cert.src} delay={i * 60}>
                  <div className="bg-white rounded-lg p-4 flex flex-col gap-3">
                    <div className="relative w-full" style={{ maxHeight: '200px', height: '200px' }}>
                      <Image
                        src={cert.src}
                        alt={cert.en}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <p className="text-[#8A8580] text-xs leading-snug text-center">
                      {zh ? cert.zh : cert.en}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {awards.map((award, i) => (
              <Reveal key={award.id} delay={i * 30}>
                <div className="bg-white p-3 min-h-full overflow-hidden group flex flex-col gap-3">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={award.src}
                      alt={zh ? award.zh : award.en}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                  <p className="text-[#8A8580] text-xs leading-snug text-center min-h-[2.5rem] flex items-center justify-center">
                    {zh ? award.zh : award.en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── S9 Partners ──────────────────────────────────────── */}
      <section className="bg-[#F5F2ED] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {zh ? '战略合作伙伴' : 'Strategic Partners'}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#241F1B]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {zh ? '与世界同行' : 'Building with\nthe Best'}
              </h2>
              <p className="text-[#8A8580] text-sm max-w-xs leading-relaxed">
                {zh
                  ? '与全球知名品牌联合开发，共同引领智能居住前沿。'
                  : 'Collaborating with world-leading brands to innovate at the frontier of smart living.'}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {PARTNERS.map((src, i) => (
              <Reveal key={src} delay={Math.floor(i / 6) * 60}>
                <div className="bg-white border border-[#E5E0DA] rounded-lg p-3 aspect-square relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                  <Image
                    src={src}
                    alt={`Partner ${i + 1}`}
                    fill
                    className="object-contain p-3"
                    unoptimized
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── S6 Founder ───────────────────────────────────────── */}
      <section id="founder" className="bg-[#241F1B] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {zh ? '团队' : 'Team'}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#F5F2ED]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '100+ 人精英团队' : '100+ Expert Team'}
            </h2>
          </Reveal>

          {/* Founder */}
          <Reveal delay={100} className="grid lg:grid-cols-[256px_1fr] gap-10 items-start">
            <div className="w-64 h-64 rounded-full overflow-hidden shrink-0 mx-auto lg:mx-0 relative">
              <Image
                src="/images/about/about_team-05.jpg"
                alt="Wang Shuaibin"
                fill
                className="object-cover object-top"
                unoptimized
              />
            </div>
            <div className="pt-2">
              <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
                {zh ? '创始人 & 首席设计师' : 'Founder & Chief Designer'}
              </p>
              <p className="text-[#F5F2ED] text-3xl font-bold mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {zh ? '王帅斌' : 'Wang Shuaibin'}
              </p>
              <p className="text-[#8A8580] text-sm tracking-wider mb-6">
                {zh ? '建筑师 · 企业家 · 先行者' : 'Architect · Entrepreneur · Visionary'}
              </p>
              <p className="text-[#F5F2ED]/65 text-base leading-relaxed max-w-2xl mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                {zh
                  ? '王帅斌于 2018 年创立 VESSEL 微宿，以国际建筑师视野重新定义中国文旅行业。他持有英国邓迪大学建筑学硕士（RIBA Part II 认证）及美国圣路易斯华盛顿大学建筑学硕士学位，曾任职于纽约华尔街 SOM 建筑设计事务所。在他的带领下，微宿开创了"太空主题高端度假营地"品类，成长为出口 30 余国的全球知名品牌。'
                  : 'Wang Shuaibin founded VESSEL in 2018, bringing an international architectural perspective to the cultural tourism industry. He holds Master of Architecture degrees from the University of Dundee (RIBA Part II) and Washington University in St. Louis, and previously worked at SOM Architects on Wall Street, New York City. Under his leadership, VESSEL pioneered the space-themed luxury camp resort category and has grown into a globally recognised brand with exports across 30+ countries.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(zh
                  ? ['邓迪大学 — RIBA Part II', '华盛顿大学圣路易斯 — 建筑学硕士', 'SOM建筑事务所 — 纽约']
                  : ['Univ. of Dundee — RIBA Part II', 'Washington Univ. in St. Louis — M.Arch', 'SOM Architects — NYC']
                ).map(tag => (
                  <span key={tag} className="text-xs px-3 py-1.5 border border-[#3A302A] text-[#8A8580] tracking-wider">{tag}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── S7 Three Services ────────────────────────────────── */}
      <section className="bg-[#F5F2ED] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {zh ? '三大服务体系' : 'Three Service Systems'}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#241F1B]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '从选址到运营\n全程陪跑' : 'From Site Selection\nto Full Operations'}
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="border border-[#E5E0DA] bg-white p-8 flex flex-col gap-5 h-full hover:border-[#E36F2C]/40 hover:shadow-sm transition-all">
                  <span className="text-4xl font-bold text-[#E36F2C]/20" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.n}</span>
                  <h3 className="text-[#241F1B] font-bold text-lg leading-snug" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {zh ? s.zh : s.en}
                  </h3>
                  <p className="text-[#8A8580] text-sm leading-relaxed flex-1">{zh ? s.desc_zh : s.desc_en}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── S10 Global reach ─────────────────────────────────── */}
      <section className="bg-[#241F1B] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-8">
            <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
              {zh ? '全球版图' : 'Global Footprint'}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#F5F2ED]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '微宿全球营地部署' : 'VESSEL Global Camp Deployment'}
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <div
              className="rounded-lg overflow-hidden border border-[#3A302A] shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
              style={{ height: '520px' }}
              aria-label={zh ? '微宿全球营地部署预览地图' : 'VESSEL global camp deployment preview map'}
            >
              <GlobalMapPreview />
            </div>
            <div className="mt-4 flex flex-col gap-2 text-right sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-[#8A8580]">
                {zh
                  ? '预览地图仅展示全球点位，不支持缩放和拖拽。'
                  : 'Preview only. Zoom, drag and project details are available on the full map.'}
              </p>
              <Link
                href="/global"
                className="text-[#E36F2C] hover:text-[#C85A1F] text-sm font-medium tracking-wider transition-colors"
              >
                {zh ? '查看完整全球地图 →' : 'View Full Global Map →'}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#E36F2C] py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2
              className="text-4xl sm:text-5xl font-bold text-white mb-3"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {zh ? '准备将微宿引入\n您的项目？' : 'Ready to bring VESSEL\nto your project?'}
            </h2>
            <p className="text-white/70 text-base max-w-md">
              {zh
                ? '专业顾问团队为您提供一对一方案咨询，24 小时内响应。'
                : 'Our specialist team offers 1-on-1 project consulting. Response within 24 hours.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href="https://en.303vessel.cn/contact.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-9 py-4 bg-white text-[#E36F2C] text-sm font-bold tracking-wider hover:bg-[#F5F2ED] transition-colors whitespace-nowrap"
            >
              {zh ? '联系我们' : 'Contact VESSEL'}
            </a>
            <Link
              href="/global"
              className="px-9 py-4 border-2 border-white/40 text-white text-sm font-medium tracking-wider hover:border-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {zh ? '查看全球项目' : 'View Global Projects'}
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <TechDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tech={activeTech}
        lang={lang}
      />
    </div>
  );
}
