import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: '项目案例 | VESSEL 微宿®',
  description: 'VESSEL 微宿® 全国300+高端营地交付案例，覆盖文旅度假、商业空间、公共设施等场景。',
};

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
    <div className={`bg-[#1a1a1a] flex items-center justify-center ${className}`}>
      <span className="text-white/15 text-xs tracking-wider">{label}</span>
    </div>
  );
}

export default function CasesPage() {
  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />

      <PageHero
        label="项目案例"
        title="全国 300+ 高端营地"
        titleGold="项目交付案例"
        subtitle="覆盖文旅度假、商业空间、公共设施，遍布全球30余个国家与地区"
        breadcrumb={[{ label: '首页', href: '/' }, { label: '项目案例' }]}
      />

      {/* Stats bar */}
      <div className="bg-[#111] border-b border-[#c9a84c]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap gap-8 justify-center">
            {[
              ['300+', '全球交付项目'],
              ['30+', '出口国家地区'],
              ['100+', '覆盖城市'],
              ['8年', '品牌积累'],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-[#c9a84c] text-2xl font-black">{num}</div>
                <div className="text-white/35 text-xs tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cases grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-3 mb-10">
          {['全部案例', '文旅度假', '商业空间', '公共设施', '境外项目'].map((tab, i) => (
            <button
              key={tab}
              className={`text-sm px-4 py-1.5 border tracking-wider transition-colors ${
                i === 0
                  ? 'border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5'
                  : 'border-white/15 text-white/40 hover:border-white/30 hover:text-white/60'
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
              className="group bg-[#111] border border-white/8 hover:border-[#c9a84c]/25 transition-all duration-300 overflow-hidden"
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
                        <span className="text-[10px] font-mono text-white/30 tracking-[0.2em]">
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
                      <h3 className="text-xl font-black text-white tracking-wider mb-1">{c.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-white/40">
                        <span>📍 {c.location}</span>
                        <span>·</span>
                        <span>{c.type}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-white/50 text-sm leading-relaxed mb-5">{c.desc}</p>

                  {/* Project specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: '占地面积', value: c.area },
                      { label: '投资规模', value: c.investment },
                      { label: '采购数量', value: c.units },
                      { label: '采购产品', value: c.products },
                    ].map((spec) => (
                      <div key={spec.label} className="bg-[#0a0a0a] px-3 py-2 border border-white/5">
                        <div className="text-white/25 text-[10px] tracking-wider mb-0.5">{spec.label}</div>
                        <div className="text-white/70 text-xs font-semibold tracking-wider">{spec.value}</div>
                      </div>
                    ))}
                  </div>

                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-[#c9a84c] text-xs hover:underline tracking-wider"
                  >
                    查看项目详情
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
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">开启您的项目</div>
          <h2 className="text-2xl font-black text-white mb-3">有意向开发高端营地项目？</h2>
          <p className="text-white/40 text-sm mb-8 tracking-wider">
            我们的项目顾问已服务 300+ 营地投资人，提供从选址、规划到建设、运营的全流程支持
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/contact"
              className="bg-[#c9a84c] text-[#0a0a0a] font-bold text-sm px-8 py-3 hover:bg-[#b8973b] transition-colors tracking-wider"
            >
              预约项目顾问
            </a>
            <a
              href="tel:4008090303"
              className="border border-white/30 text-white text-sm px-8 py-3 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors tracking-wider"
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
