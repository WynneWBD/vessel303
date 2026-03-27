import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { getAllProducts } from '@/lib/db-products';
import ProductsPageContent from '@/components/pages/ProductsPageContent';

export const metadata: Metadata = {
  title: '全部产品 | VESSEL 微宿®',
  description: 'VESSEL 微宿® Gen6/Gen5 全系列文旅智能装配建筑产品，包括E7、E6、E3、V9、V5、S5等型号。',
};

export default async function ProductsPage() {
  const allProducts = await getAllProducts();
  const gen6Products = allProducts.filter((p) => p.series === 'Gen6');
  const gen5Products = allProducts.filter((p) => p.series === 'Gen5');

  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />

      <PageHero
        label="产品中心"
        title="VESSEL 微宿® 全系列"
        titleGold="文旅智能装配建筑"
        subtitle="45天工厂预制 | 2小时落地安装 | 欧盟+美国双认证 | 全球30+国家交付"
        breadcrumb={[{ label: '首页', href: '/' }, { label: '全部产品' }]}
      />

      {/* Key specs bar */}
      <div className="bg-[#111] border-b border-[#c9a84c]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              ['尺寸范围', '19㎡ — 38.8㎡'],
              ['标准生产周期', '45天'],
              ['安装时间', '2小时'],
              ['适用温度', '-32℃ 至 55℃'],
              ['运输方式', '40尺平架集装箱'],
              ['海关编码', 'HS 9406.90'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-sm">
                <span className="text-white/30 tracking-wider">{k}</span>
                <span className="text-[#c9a84c] font-semibold tracking-wider">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProductsPageContent gen6Products={gen6Products} gen5Products={gen5Products} />

      <Footer />
    </main>
  );
}
