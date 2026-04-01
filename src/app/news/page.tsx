'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

const newsItems = [
  {
    id: 27,
    tag: '要闻',
    date: '2025-11-03',
    title: '带轮式 VESSEL E3 Gen6 首秀广交会',
    preview:
      'VESSEL 微宿携全球首发带轮式 VESSEL E3 Gen6，及覆盖全系产品的定制车架系统震撼亮相 B 区 13.0 C12-13 展位。',
    href: '#',
    featured: true,
  },
  {
    id: 24,
    tag: '行业资讯',
    date: '2025-06-23',
    title: '马斯克入住预制房引关注，VESSEL 双拼 V5 给出品质新解',
    preview:
      'VESSEL 微宿双拼 V5 以 49.6㎡ 科幻设计、5.9 万美金定价打造兼具空间美学与性价比的特色方案，引发全球关注。',
    href: '#',
    featured: false,
  },
  {
    id: 23,
    tag: '合作动态',
    date: '2025-03-28',
    title: 'VESSEL 微宿与南海狮山文旅战略合作，打造千万级亲水营地',
    preview:
      '广东省佛山市南海区狮山镇政府与 VESSEL 微宿签订战略合作协议，共同打造千万级野趣亲水营地。',
    href: '#',
    featured: false,
  },
  {
    id: 20,
    tag: '品牌合作',
    date: '2024-12-12',
    title: '微宿 VESSEL 与华为 HUAWEI 合作签约',
    preview:
      '装配式预制建筑与华为全屋智能系统的完美融合，双方正式签署战略合作协议，共同探索智慧文旅新业态。',
    href: '#',
    featured: false,
  },
  {
    id: 19,
    tag: '公益项目',
    date: '2025-07-09',
    title: '为弱势群体打造可持续居所',
    preview:
      'VESSEL 微宿与 NESSEL Housing 携手，为弱势群体构筑兼具尊严与温度的临时家园，彰显企业社会责任。',
    href: '#',
    featured: false,
  },
  {
    id: 18,
    tag: '国际展会',
    date: '2025-07-03',
    title: '圣彼得堡国际经济论坛亮点——已落地 200+ 项目，出口 20 余国',
    preview:
      'VESSEL 微宿亮相圣彼得堡国际经济论坛，展示 200+ 全球项目成果，宣布进一步拓展欧洲及中东市场战略。',
    href: '#',
    featured: false,
  },
  {
    id: 17,
    tag: '活动资讯',
    date: '2025-05-09',
    title: 'VESSEL 微宿两大活动瞩目启幕，137 届广交会成功举办',
    preview:
      '第 137 届广交会 VESSEL 展位人流涌动，E7 Gen6 旗舰款引爆全场，多个国际采购商现场洽谈合作意向。',
    href: '#',
    featured: false,
  },
];

const categories = ['全部资讯', '要闻', '行业资讯', '品牌合作', '国际展会', '公益项目'];

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`bg-[#E8E4DE] flex items-center justify-center ${className}`}>
      <span className="text-[#CCCCCC] text-xs tracking-wider">{label}</span>
    </div>
  );
}

export default function NewsPage() {
  const t = useT();
  const featured = newsItems.find((n) => n.featured);
  const rest = newsItems.filter((n) => !n.featured);

  return (
    <main className="bg-white text-[#1A1A1A]">
      <Navbar />

      <PageHero
        label={t(i18n.news.heroLabel)}
        title="VESSEL 微宿®"
        titleGold={t(i18n.news.heroTitleGold)}
        subtitle={t(i18n.news.heroSubtitle)}
        breadcrumb={[{ label: t(i18n.productDetail.home), href: '/' }, { label: t(i18n.nav.news) }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`text-sm px-4 py-1.5 border tracking-wider transition-colors ${
                i === 0
                  ? 'border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/5'
                  : 'border-[#D8D4CE] text-[#888888] hover:border-[#BBBBBB] hover:text-[#555555]'
              }`}
            >
              {i === 0 ? t(i18n.news.filterAll) : cat}
            </button>
          ))}
        </div>

        {/* Featured article */}
        {featured && (
          <a href={featured.href} className="group block mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 bg-white border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 transition-all overflow-hidden">
              <Placeholder label={featured.title} className="h-64 lg:h-auto" />
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[#c9a84c] text-[#0a0a0a] text-[10px] font-bold px-2 py-1 tracking-wider">
                    {featured.tag}
                  </span>
                  <span className="text-[#c9a84c] text-xs px-2 py-0.5 border border-[#c9a84c]/30">{t(i18n.news.topBadge)}</span>
                  <span className="text-[#AAAAAA] text-xs">{featured.date}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] mb-4 leading-snug group-hover:text-[#c9a84c] transition-colors tracking-wider">
                  {featured.title}
                </h2>
                <p className="text-[#666666] text-sm leading-relaxed mb-6">{featured.preview}</p>
                <div className="flex items-center gap-2 text-[#c9a84c] text-sm">
                  <span>{t(i18n.news.readFull)}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </a>
        )}

        {/* News grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="group block bg-white border border-[#E8E4DE] hover:border-[#c9a84c]/30 transition-all duration-300 overflow-hidden"
            >
              <Placeholder label={item.title} className="h-44" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] px-2 py-0.5 border tracking-wider"
                    style={{
                      color: '#c9a84c',
                      borderColor: 'rgba(201,168,76,0.3)',
                      background: 'rgba(201,168,76,0.05)',
                    }}
                  >
                    {item.tag}
                  </span>
                  <span className="text-[#AAAAAA] text-xs">{item.date}</span>
                </div>
                <h3 className="text-[#1A1A1A] font-bold text-sm mb-2 leading-snug group-hover:text-[#c9a84c] transition-colors tracking-wider line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-[#888888] text-xs leading-relaxed line-clamp-3">{item.preview}</p>
                <div className="mt-4 flex items-center gap-1 text-[#c9a84c]/60 text-xs group-hover:text-[#c9a84c] transition-colors">
                  <span>{t(i18n.news.readMore)}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Load more */}
        <div className="mt-10 text-center">
          <button className="border border-[#D0CCC6] text-[#666666] text-sm px-8 py-3 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors tracking-wider">
            {t(i18n.news.loadMore)}
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
