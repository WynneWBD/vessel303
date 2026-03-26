import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { products, gen6Products, gen5Products } from '@/lib/products';

export const metadata: Metadata = {
  title: '全部产品 | VESSEL 微宿®',
  description: 'VESSEL 微宿® Gen6/Gen5 全系列文旅智能装配建筑产品，包括E7、E6、E3、V9、V5、S5等型号。',
};

function ProductCard({ product }: { product: (typeof products)[0] }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-[#111] border border-white/8 hover:border-[#c9a84c]/40 transition-all duration-500 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-52 bg-[#0d0d0d] overflow-hidden">
        <Image
          src={product.image}
          alt={`${product.model} ${product.gen}`}
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/80 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] font-bold px-2 py-1 tracking-wider"
            style={{
              background: `${product.accentColor}20`,
              color: product.accentColor,
              border: `1px solid ${product.accentColor}40`,
            }}
          >
            {product.size}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2 py-1 bg-[#c9a84c]/90 text-[#0a0a0a]">
            {product.badge}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-[0.2em] opacity-60" style={{ color: product.accentColor }}>
            VESSEL · {product.model} {product.gen}
          </span>
          <span className="text-white/30 text-[10px]">{product.tag}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="text-[#c9a84c] text-[10px] tracking-[0.25em] uppercase mb-1">
          {product.model} {product.gen} · {product.size}
        </div>
        <h3 className="text-white text-lg font-bold tracking-wide mb-2">{product.tagline}</h3>
        <p className="text-white/45 text-sm leading-relaxed mb-4 line-clamp-2">{product.tagline2}</p>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-xs text-white/30 mb-4 border-t border-white/8 pt-3">
          <span>{product.dimensions.length / 1000}m × {product.dimensions.width / 1000}m</span>
          <span>·</span>
          <span>{product.power}</span>
          <span>·</span>
          <span>{product.capacity}</span>
        </div>

        {/* CTA */}
        <div
          className="text-center text-xs py-2 font-semibold tracking-wider transition-all duration-200"
          style={{
            background: `${product.accentColor}15`,
            color: product.accentColor,
            border: `1px solid ${product.accentColor}30`,
          }}
        >
          查看详情 →
        </div>
      </div>
    </Link>
  );
}

export default function ProductsPage() {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Gen6 Series */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div>
              <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-1 font-medium">第六代 · 最新系列</div>
              <h2 className="text-2xl font-black text-white tracking-wider">Gen6 系列</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-[#c9a84c]/30 to-transparent" />
            <span className="text-white/20 text-xs tracking-wider border border-white/10 px-3 py-1">
              {gen6Products.length} 款产品
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {gen6Products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>

        {/* Gen5 Series */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div>
              <div className="text-white/30 text-xs tracking-[0.3em] uppercase mb-1">第五代 · 经典系列</div>
              <h2 className="text-2xl font-black text-white tracking-wider">Gen5 系列</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            <span className="text-white/20 text-xs tracking-wider border border-white/10 px-3 py-1">
              {gen5Products.length} 款产品
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {gen5Products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>

        {/* Compare table */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">选型参考</div>
            <h2 className="text-2xl font-black text-white">Gen6 系列对比</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#c9a84c]/20">
                  <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">型号</th>
                  <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">尺寸</th>
                  <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">面积</th>
                  <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">电功率</th>
                  <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">容纳人数</th>
                  <th className="text-left py-3 px-4 text-white/40 font-normal tracking-wider">适用场景</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {gen6Products.map((p, i) => (
                  <tr
                    key={p.slug}
                    className={`border-b border-white/5 hover:bg-[#c9a84c]/3 transition-colors ${
                      i === 0 ? 'bg-[#c9a84c]/3' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: p.accentColor }}
                        />
                        <span className="text-white font-bold tracking-wider">
                          {p.model} {p.gen}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white/50 font-mono text-xs">
                      {p.dimensions.length / 1000}m × {p.dimensions.width / 1000}m × {p.dimensions.height / 1000}m
                    </td>
                    <td className="py-4 px-4">
                      <span style={{ color: p.accentColor }} className="font-bold">{p.floorArea}</span>
                    </td>
                    <td className="py-4 px-4 text-white/50">{p.power}</td>
                    <td className="py-4 px-4 text-white/50">{p.capacity}</td>
                    <td className="py-4 px-4 text-white/50 text-xs">{p.tag}</td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/products/${p.slug}`}
                        className="text-[#c9a84c] text-xs hover:underline tracking-wider"
                      >
                        详情 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ highlight */}
        <div className="mt-16 p-8 border border-[#c9a84c]/15 bg-[#c9a84c]/3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                q: '生产周期多久？',
                a: '标准生产周期 45 天，可根据项目排期协商加急方案。',
              },
              {
                q: '适用哪些气候？',
                a: '产品经测试，可适用 -32℃（俄罗斯）至 55℃（沙特）极端气候条件。',
              },
              {
                q: '如何运输？',
                a: '通过 40 尺平架集装箱运输，符合国际海运规范，海关编码 HS 9406.90。',
              },
            ].map((item) => (
              <div key={item.q}>
                <div className="text-[#c9a84c] font-bold text-sm mb-2 tracking-wider">{item.q}</div>
                <div className="text-white/50 text-sm leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
