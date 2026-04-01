'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

const cases = [
  {
    id: 1,
    name: '巽寮湾·假日星球滨海野奢营地',
    location: '广东·惠州',
    type: '滨海野奢度假营地',
    area: '35,000㎡',
    investment: 'RMB 2,500万元',
    units: '20台',
    products: 'S5 Gen5 · O5 · E7 Gen5 · V7 Gen5',
    desc: '依托惠州巽寮湾天然海岸线，打造集滨海野奢住宿、亲水体验、休闲餐饮于一体的高端度假营地，多种产品型号组合构建丰富的空间层次。',
    tags: ['滨海', '野奢', '亲子'],
    accentColor: '#4a8fc9',
  },
  {
    id: 2,
    name: '麋鹿高山生活营地',
    location: '四川·轿顶山',
    type: '高原度假营地',
    area: '15,000㎡',
    investment: 'RMB 4,500万元',
    units: '26台',
    products: 'E7 Gen6 · V9 Gen6 · E6 Gen6',
    desc: '海拔3000米以上的轿顶山高原营地，利用VESSEL产品极端气候适应性（-32℃至55℃），实现高原四季全天候运营。云海与星空成为最美的天然背景。',
    tags: ['高原', '星空', '云海'],
    accentColor: '#4ac97a',
  },
  {
    id: 3,
    name: '托茂部落生态营地',
    location: '青海·祁连',
    type: '草原度假营地',
    area: '4,000㎡',
    investment: 'RMB 500万元',
    units: '待定',
    products: 'V9 Gen6 · E6 Gen6',
    desc: '祁连山下托茂部落，以蒙古族文化为主题，VESSEL装配建筑与蒙古包景观相互辉映，实现现代舒适与民族特色的融合。',
    tags: ['草原', '民族风情', '文化体验'],
    accentColor: '#c9a84c',
  },
  {
    id: 4,
    name: '万绿湖心乐青谷营地',
    location: '广东·河源',
    type: '生态保护景区营地',
    area: '25,000㎡',
    investment: 'RMB 500万元',
    units: '15台',
    products: 'V5 Gen5 · V7 Gen5',
    desc: '国家级自然保护区内，以轻量化装配建筑减少对生态的干扰。万绿湖碧水倒映下，15台产品点缀湖岸，构建"在自然中住宿"的极致体验。',
    tags: ['生态保护', '湖景', '轻奢'],
    accentColor: '#7a9ec9',
  },
  {
    id: 5,
    name: '南海狮山文旅营地',
    location: '广东·佛山',
    type: '城郊文旅营地',
    area: '18,000㎡',
    investment: 'RMB 1,800万元',
    units: '30台',
    products: 'E7 Gen6 · E6 Gen6 · E3 Gen6',
    desc: 'VESSEL 微宿与南海狮山文旅战略合作，打造千万级野趣亲水营地。E7/E6/E3全系出击，覆盖高、中、入门三档客群，实现最大坪效。',
    tags: ['城郊', '亲水', '全系应用'],
    accentColor: '#e07b4a',
  },
  {
    id: 6,
    name: '华为全屋智能主题馆',
    location: '广东·深圳',
    type: '品牌体验空间',
    area: '800㎡',
    investment: 'RMB 300万元',
    units: '4台',
    products: 'E7 Gen6 · V9 Gen6',
    desc: '微宿VESSEL与华为HUAWEI战略合作，装配式预制建筑与华为全屋智能系统完美融合，共同打造未来生活方式体验展馆。',
    tags: ['科技', '智能家居', '品牌合作'],
    accentColor: '#c97a9e',
  },
];

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`bg-[#E8E4DE] flex items-center justify-center ${className}`}>
      <span className="text-[#CCCCCC] text-xs tracking-wider">{label}</span>
    </div>
  );
}

export default function CasesPage() {
  const t = useT();

  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      <PageHero
        label={t(i18n.cases.heroLabel)}
        title={t(i18n.cases.heroTitle1)}
        titleGold={t(i18n.cases.heroTitleGold)}
        subtitle={t(i18n.cases.heroSubtitle)}
        breadcrumb={[{ label: t(i18n.productDetail.home), href: '/' }, { label: t(i18n.nav.cases) }]}
      />

      {/* Stats bar */}
      <div className="bg-[#FAF7F2] border-b border-[#c9a84c]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap gap-8 justify-center">
            {[
              [t(i18n.cases.stat1Val), t(i18n.cases.stat1)],
              [t(i18n.cases.stat2Val), t(i18n.cases.stat2)],
              [t(i18n.cases.stat3Val), t(i18n.cases.stat3)],
              [t(i18n.cases.stat4Val), t(i18n.cases.stat4)],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-[#c9a84c] text-2xl font-black">{num}</div>
                <div className="text-[#6B6560] text-xs tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cases grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            t(i18n.cases.filterAll),
            t(i18n.cases.filterTourism),
            t(i18n.cases.filterCommercial),
            t(i18n.cases.filterPublic),
            t(i18n.cases.filterOverseas),
          ].map((tab, i) => (
            <button
              key={tab}
              className={`text-sm px-4 py-1.5 border tracking-wider transition-colors ${
                i === 0
                  ? 'border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5'
                  : 'border-[#D8D4CE] text-[#6B6560] hover:border-[#BBBBBB] hover:text-[#555555]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cases list */}
        <div className="space-y-6">
          {cases.map((c, i) => (
            <div
              key={c.id}
              className="group bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/25 transition-all duration-300 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {/* Image placeholder */}
                <Placeholder
                  label={`${c.name} · 现场图片`}
                  className="h-52 md:h-auto"
                />

                {/* Content */}
                <div className="md:col-span-2 p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-mono text-[#999999] tracking-[0.2em]">
                          CASE {String(i + 1).padStart(3, '0')}
                        </span>
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 tracking-wider"
                            style={{ background: `${c.accentColor}15`, color: c.accentColor, border: `1px solid ${c.accentColor}30` }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-xl font-black text-[#2C2A28] tracking-wider mb-1">{c.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-[#6B6560]">
                        <span>📍 {c.location}</span>
                        <span>·</span>
                        <span>{c.type}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[#6B6560] text-sm leading-relaxed mb-5">{c.desc}</p>

                  {/* Project specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: t(i18n.cases.specArea), value: c.area },
                      { label: t(i18n.cases.specInvestment), value: c.investment },
                      { label: t(i18n.cases.specUnits), value: c.units },
                      { label: t(i18n.cases.specProducts), value: c.products },
                    ].map((spec) => (
                      <div key={spec.label} className="bg-[#F8F6F2] px-3 py-2 border border-[#E8E4DE]">
                        <div className="text-[#AAAAAA] text-[10px] tracking-wider mb-0.5">{spec.label}</div>
                        <div className="text-[#444444] text-xs font-semibold tracking-wider">{spec.value}</div>
                      </div>
                    ))}
                  </div>

                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-[#c9a84c] text-xs hover:underline tracking-wider"
                  >
                    {t(i18n.cases.viewDetail)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center p-12 border border-[#c9a84c]/15 bg-[#c9a84c]/3">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">{t(i18n.cases.ctaBadge)}</div>
          <h2 className="text-2xl font-black text-[#2C2A28] mb-3">{t(i18n.cases.ctaTitle)}</h2>
          <p className="text-[#6B6560] text-sm mb-8 tracking-wider">
            {t(i18n.cases.ctaSubtitle)}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/contact"
              className="bg-[#c9a84c] text-[#1C1A18] font-bold text-sm px-8 py-3 hover:bg-[#b8973b] transition-colors tracking-wider"
            >
              {t(i18n.cases.ctaBtn1)}
            </a>
            <a
              href="tel:4008090303"
              className="border border-[#999999] text-[#2C2A28] text-sm px-8 py-3 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors tracking-wider"
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
