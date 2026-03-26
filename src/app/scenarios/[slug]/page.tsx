import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

type ScenarioSlug = 'tourism' | 'commercial' | 'public';

interface ScenarioData {
  slug: ScenarioSlug;
  label: string;
  title: string;
  titleGold: string;
  subtitle: string;
  intro: string;
  heroTagline: string;
  specs: Array<{ label: string; value: string }>;
  features: Array<{ title: string; desc: string }>;
  process: Array<{ step: string; title: string; desc: string }>;
  recommendedProducts: string[];
  cases: Array<{ name: string; location: string; desc: string }>;
  accentColor: string;
}

const scenarios: ScenarioData[] = [
  {
    slug: 'tourism',
    label: '文旅度假',
    title: '文旅度假营地',
    titleGold: '整体解决方案',
    subtitle: 'VESSEL 微宿度假营地解决方案',
    intro:
      '以自然景观为依托，VESSEL 装配建筑快速建设高品质度假营地，实现土地价值最大化。建设周期比传统建筑缩短 80%，45 天即可完成交付，助力文旅投资者快速实现盈利。',
    heroTagline: '45天交付 · 高ROI文旅度假营地解决方案',
    specs: [
      { label: '推荐产品', value: 'E7 Gen6 / V9 Gen6 / E6 Gen6' },
      { label: '适用面积', value: '5,000㎡ 以上' },
      { label: '最快交付', value: '45天' },
      { label: '最小起订量', value: '5台起' },
      { label: '自重', value: '7–9吨/台' },
      { label: '适用气候', value: '-32℃ 至 55℃' },
    ],
    features: [
      {
        title: '快速盈利模型',
        desc: '相较传统建筑，建设成本降低 40%，运营后 18–24 个月内可回收成本，ROI 显著优于传统酒店。',
      },
      {
        title: '多场景适配',
        desc: '适用于山地、湖滨、海边、草原、沙漠等各类自然环境，轻量化结构减少对生态的干扰。',
      },
      {
        title: '可移动资产',
        desc: '装配式结构支持整体拆卸迁移，场地租约到期或政策变化时，资产可原地保值或异地再用。',
      },
      {
        title: '品牌差异化',
        desc: '标志性外观设计自带网红属性，社交媒体传播力极强，有效降低营销获客成本。',
      },
    ],
    process: [
      { step: '01', title: '确认规格', desc: '根据项目地块、预算、目标客群确认产品型号与数量' },
      { step: '02', title: '设计咨询', desc: '1v1 专业设计顾问，提供营地整体规划与效果图' },
      { step: '03', title: '配置方案', desc: '根据气候条件、当地法规定制产品配置方案' },
      { step: '04', title: '软装服务', desc: '提供标准软装套餐或定制软装设计服务' },
      { step: '05', title: '送货安装', desc: '工厂直发，到场 2 小时完成安装，接通水电即可使用' },
    ],
    recommendedProducts: ['E7 Gen6', 'V9 Gen6', 'E6 Gen6', 'E3 Gen6'],
    cases: [
      { name: '巽寮湾·假日星球营地', location: '广东·惠州', desc: '35,000㎡ 滨海野奢营地，20台产品组合' },
      { name: '麋鹿高山生活营地', location: '四川·轿顶山', desc: '15,000㎡ 高原营地，26台产品' },
      { name: '托茂部落生态营地', location: '青海·祁连', desc: '草原民族文化主题营地' },
    ],
    accentColor: '#c9a84c',
  },
  {
    slug: 'commercial',
    label: '商业空间',
    title: '商业空间',
    titleGold: '模块化组合方案',
    subtitle: 'VESSEL 微宿空间组合拓展方案',
    intro:
      '灵活的模块化装配设计为商业空间提供无限可能。垂直叠拼、平行叠拼、组合排列，快速部署，随时迁移，适应瞬息万变的商业环境，将空间部署变成竞争优势。',
    heroTagline: '模块化组合 · 快速部署 · 可移动商业空间',
    specs: [
      { label: '垂直叠拼面积', value: '74㎡' },
      { label: '平行叠拼面积', value: '76㎡' },
      { label: '最大额定功率', value: '36/42kW' },
      { label: '叠拼净重', value: '18–20吨' },
      { label: '最快交付', value: '45天' },
      { label: '定制类型', value: '不限' },
    ],
    features: [
      {
        title: '垂直叠拼设计',
        desc: '两台产品上下叠拼，建筑面积达 74㎡，形成双层空间体验，打造更震撼的商业场景。',
      },
      {
        title: '平行叠拼设计',
        desc: '两台产品左右拼合，建筑面积达 76㎡，形成宽敞横向空间，适用于餐饮、展厅、会客中心。',
      },
      {
        title: '灵活迁移',
        desc: '整体结构可拆卸转移，适合租赁场地的快闪品牌和阶段性商业项目，有效控制固定资产风险。',
      },
      {
        title: '无限定制',
        desc: '支持按品牌调性定制外观涂装、内装、功能布局，可打造咖啡馆、展厅、酒吧、办公室等各类业态。',
      },
    ],
    process: [
      { step: '01', title: '确认规格', desc: '明确空间用途、所需面积与楼层需求' },
      { step: '02', title: '设计咨询', desc: '品牌调性解读，输出专属空间设计方案' },
      { step: '03', title: '配置方案', desc: '结合场地情况规划叠拼方式与水电布局' },
      { step: '04', title: '软装服务', desc: '品牌化软装配套，家具、灯光、陈设一站搞定' },
      { step: '05', title: '送货安装', desc: '专业吊装团队现场就位，快速开业' },
    ],
    recommendedProducts: ['V9 Gen6', 'E7 Gen6', 'E6 Gen6'],
    cases: [
      { name: '华为全屋智能体验馆', location: '广东·深圳', desc: '品牌体验空间，E7+V9 双产品组合' },
      { name: '南海狮山文旅商业街', location: '广东·佛山', desc: '城郊商业文旅综合体' },
      { name: '广交会品牌展示', location: '广东·广州', desc: '137届广交会展位部署' },
    ],
    accentColor: '#4a8fc9',
  },
  {
    slug: 'public',
    label: '公共设施',
    title: '公共设施',
    titleGold: '快速部署方案',
    subtitle: 'VESSEL 微宿公共设施解决方案',
    intro:
      '满足公共应急与民生服务需求，VESSEL 产品可快速部署于灾区、边远地区或临时活动场所。出厂即成品，现场接通水电即可投入使用，高效可靠，服务于各类公共事业场景。',
    heroTagline: '快速响应 · 公共服务 · 可持续部署',
    specs: [
      { label: '推荐产品', value: 'E7 Gen6 / V9 Gen6' },
      { label: '建筑面积', value: '19–38.8㎡' },
      { label: '额定功率', value: '9kW / 24kW' },
      { label: '外形长度', value: '5,600–11,400mm' },
      { label: '总净重', value: '5–10吨' },
      { label: '功能区', value: '玄关+卫生间+阅读区+书架' },
    ],
    features: [
      {
        title: '应急快速响应',
        desc: '工厂直发，到场 2 小时完成安装，可在最短时间内为灾区居民或边远地区提供临时居所与公共服务设施。',
      },
      {
        title: '可持续使用',
        desc: '高强度结构 + 极端气候适应性，建筑寿命超 20 年，可长期稳定服务于公共设施需求。',
      },
      {
        title: '多功能适配',
        desc: '可定制为图书馆、诊疗站、便民服务中心、展览馆、临时办公室等多种公共服务场景。',
      },
      {
        title: '低运维成本',
        desc: '出厂即成品，无需砌墙施工，维护简单，配合太阳能储能系统可实现离网运行。',
      },
    ],
    process: [
      { step: '01', title: '需求评估', desc: '明确使用场景、服务对象和功能需求' },
      { step: '02', title: '方案设计', desc: '针对公共服务需求进行专项功能布局设计' },
      { step: '03', title: '配置规划', desc: '根据当地基础设施条件规划水电配套方案' },
      { step: '04', title: '政府对接', desc: '协助对接建设许可、消防验收等合规流程' },
      { step: '05', title: '快速交付', desc: '优先排期，确保快速到位，投入使用' },
    ],
    recommendedProducts: ['E7 Gen6', 'V9 Gen6', 'E6 Gen6', 'E3 Gen6'],
    cases: [
      { name: 'NESSEL 社会住房项目', location: '国际', desc: '为弱势群体构筑有尊严的临时家园' },
      { name: '边境服务设施', location: '多地', desc: '多地边境及偏远地区公共服务配套' },
      { name: '展会临时场馆', location: '全国', desc: '广交会等大型展会临时展览空间' },
    ],
    accentColor: '#4ac97a',
  },
];

export async function generateStaticParams() {
  return scenarios.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scenario = scenarios.find((s) => s.slug === slug);
  if (!scenario) return {};
  return {
    title: `${scenario.label} | VESSEL 微宿®`,
    description: scenario.intro,
  };
}

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`bg-[#1a1a1a] flex items-center justify-center ${className}`}>
      <span className="text-white/15 text-xs tracking-wider">{label}</span>
    </div>
  );
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scenario = scenarios.find((s) => s.slug === slug);
  if (!scenario) notFound();

  const otherScenarios = scenarios.filter((s) => s.slug !== scenario.slug);

  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />

      <PageHero
        label={scenario.label}
        title={scenario.title}
        titleGold={scenario.titleGold}
        subtitle={scenario.heroTagline}
        breadcrumb={[
          { label: '首页', href: '/' },
          { label: '应用场景', href: '/cases' },
          { label: scenario.label },
        ]}
      />

      {/* ── Intro ── */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-white/55 text-base leading-loose mb-8">{scenario.intro}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {scenario.specs.map((spec) => (
                  <div key={spec.label} className="bg-[#111] border border-white/8 p-3">
                    <div className="text-white/30 text-[10px] tracking-wider mb-0.5">{spec.label}</div>
                    <div
                      className="text-sm font-bold tracking-wider"
                      style={{ color: scenario.accentColor }}
                    >
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Placeholder label={`${scenario.label} 应用场景图`} className="aspect-[4/3]" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-[#080808] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div
              className="text-xs tracking-[0.3em] uppercase mb-3 font-medium"
              style={{ color: scenario.accentColor }}
            >
              方案优势
            </div>
            <h2 className="text-3xl font-black text-white">为什么选择 VESSEL？</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scenario.features.map((f, i) => (
              <div
                key={i}
                className="bg-[#111] border border-white/8 hover:border-[#c9a84c]/20 transition-all p-7 group"
              >
                <div
                  className="w-10 h-10 flex items-center justify-center font-black text-sm mb-4"
                  style={{ background: `${scenario.accentColor}15`, color: scenario.accentColor }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-white font-bold mb-2 tracking-wider">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5-Step Process ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div
              className="text-xs tracking-[0.3em] uppercase mb-3 font-medium"
              style={{ color: scenario.accentColor }}
            >
              合作流程
            </div>
            <h2 className="text-3xl font-black text-white">五步实现您的项目</h2>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div
              className="absolute top-8 left-8 right-8 h-px hidden lg:block"
              style={{ background: `linear-gradient(90deg, ${scenario.accentColor}40, transparent)` }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {scenario.process.map((step) => (
                <div key={step.step} className="relative bg-[#111] border border-white/8 p-5 text-center group">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg mx-auto mb-4 border-2 bg-[#0a0a0a]"
                    style={{ borderColor: scenario.accentColor, color: scenario.accentColor }}
                  >
                    {step.step}
                  </div>
                  <h3 className="text-white font-bold text-sm mb-2 tracking-wider">{step.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Recommended Products ── */}
      <section className="py-16 bg-[#080808] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div
              className="text-xs tracking-[0.3em] uppercase mb-3 font-medium"
              style={{ color: scenario.accentColor }}
            >
              推荐产品
            </div>
            <h2 className="text-2xl font-black text-white">适合{scenario.label}的产品</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {scenario.recommendedProducts.map((p) => (
              <Link
                key={p}
                href={`/products/${p.split(' ')[0].toLowerCase()}`}
                className="flex items-center gap-3 px-6 py-3 border border-white/15 hover:border-[#c9a84c]/50 hover:text-[#c9a84c] text-white/70 text-sm transition-all tracking-wider group"
              >
                <span>{p}</span>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            ))}
            <Link
              href="/products"
              className="flex items-center gap-2 px-6 py-3 border border-[#c9a84c]/30 text-[#c9a84c] text-sm hover:bg-[#c9a84c]/5 transition-all tracking-wider"
            >
              查看全部产品 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Related Cases ── */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div
              className="text-xs tracking-[0.3em] uppercase mb-3 font-medium"
              style={{ color: scenario.accentColor }}
            >
              典型案例
            </div>
            <h2 className="text-2xl font-black text-white">相关项目案例</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {scenario.cases.map((c) => (
              <div key={c.name} className="bg-[#111] border border-white/8 hover:border-[#c9a84c]/25 transition-all overflow-hidden group">
                <Placeholder label={c.name} className="h-44" />
                <div className="p-5">
                  <div className="text-white/30 text-xs mb-1 tracking-wider">📍 {c.location}</div>
                  <div className="text-white font-bold text-sm mb-2 tracking-wider">{c.name}</div>
                  <div className="text-white/45 text-xs leading-relaxed">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 border border-white/20 text-white/60 text-sm px-6 py-3 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors tracking-wider"
            >
              查看全部案例 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Other Scenarios ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl font-black text-white/60">更多应用场景</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {otherScenarios.map((s) => (
              <Link
                key={s.slug}
                href={`/scenarios/${s.slug}`}
                className="group flex items-center gap-4 p-6 bg-[#111] border border-white/8 hover:border-[#c9a84c]/30 transition-all"
              >
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0 text-lg font-black"
                  style={{ background: `${s.accentColor}15`, color: s.accentColor }}
                >
                  {s.label[0]}
                </div>
                <div>
                  <div className="text-white font-bold tracking-wider group-hover:text-[#c9a84c] transition-colors">
                    {s.title} {s.titleGold}
                  </div>
                  <div className="text-white/35 text-xs mt-0.5 tracking-wider">{s.heroTagline}</div>
                </div>
                <svg className="w-5 h-5 text-white/20 group-hover:text-[#c9a84c] transition-colors ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="border-t border-white/5 bg-[#080808] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div
            className="text-xs tracking-[0.3em] uppercase mb-4 font-medium"
            style={{ color: scenario.accentColor }}
          >
            开始合作
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
            有{scenario.label}项目需求？
          </h2>
          <p className="text-white/40 text-sm mb-8 tracking-wider">
            专业顾问团队提供从选址规划到交付运营的全程服务，45天即可实现项目落地
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="text-sm font-bold px-8 py-3 tracking-wider transition-colors"
              style={{ background: scenario.accentColor, color: '#0a0a0a' }}
            >
              立即咨询方案
            </Link>
            <a
              href="tel:4008090303"
              className="text-sm px-8 py-3 border border-white/30 text-white hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors tracking-wider"
            >
              400-8090-303
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
