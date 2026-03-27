import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getProductBySlug } from '@/lib/db-products';
import { auth } from '@/auth';

// Slugs are stable — no DB call needed at build time
export function generateStaticParams() {
  return ['e7', 'e6', 'e3', 'v9', 'v5', 's5'].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.model} ${product.gen} | VESSEL 微宿®`,
    description: `${product.tagline} — ${product.tagline2}。${product.floorArea}，${product.power}，${product.capacity}。`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [session, prevProduct, nextProduct] = await Promise.all([
    auth(),
    product.prev ? getProductBySlug(product.prev) : Promise.resolve(null),
    product.next ? getProductBySlug(product.next) : Promise.resolve(null),
  ]);
  const isLoggedIn = !!session?.user;

  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[70vh] flex items-end pb-16 overflow-hidden bg-[#0a0a0a]">
        <Image
          src={product.image}
          alt={`${product.model} ${product.gen}`}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]/20" />
        {/* Gold glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 30% 80%, ${product.accentColor}12, transparent)`,
          }}
        />

        {/* Breadcrumb */}
        <div className="absolute top-24 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-white/30 tracking-wider">
              <Link href="/" className="hover:text-[#c9a84c] transition-colors">首页</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-[#c9a84c] transition-colors">产品</Link>
              <span>/</span>
              <span className="text-white/50">{product.model} {product.gen}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">
            VESSEL 微宿® · {product.series} · {product.tag}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-none mb-4">
            <span style={{ color: product.accentColor }}>{product.model}</span>
            <span className="text-white ml-4">{product.gen}</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl font-light mb-2 tracking-wider">{product.tagline}</p>
          <p className="text-white/40 text-sm tracking-wider italic">{product.tagline2}</p>

          {/* Quick specs */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: '建筑面积', value: product.floorArea },
              { label: '外形尺寸', value: `${product.dimensions.length/1000}m × ${product.dimensions.width/1000}m × ${product.dimensions.height/1000}m` },
              { label: '额定功率', value: product.power },
              { label: '容纳人数', value: product.capacity },
              { label: '自重', value: product.weight },
            ].map((spec) => (
              <div key={spec.label} className="bg-black/50 backdrop-blur-sm border border-white/10 px-4 py-2">
                <div className="text-white/35 text-[10px] tracking-wider">{spec.label}</div>
                <div className="text-white font-bold text-sm tracking-wider">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Strip ── */}
      <div
        className="py-5 border-b border-white/5"
        style={{ background: `${product.accentColor}10` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="text-xs px-3 py-1 font-bold tracking-wider"
              style={{ background: `${product.accentColor}`, color: '#0a0a0a' }}
            >
              {product.badge}
            </span>
            <span className="text-white/40 text-sm tracking-wider">
              45天交付 · 2小时安装 · 全球包邮至港口
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/contact"
              className="text-sm font-bold px-6 py-2.5 tracking-wider transition-colors"
              style={{ background: product.accentColor, color: '#0a0a0a' }}
            >
              立即咨询报价
            </Link>
            <Link
              href="/products"
              className="text-sm px-6 py-2.5 border border-white/20 text-white/70 hover:border-white/40 transition-colors tracking-wider"
            >
              查看其他产品
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Price Block ── */}
        <section className="py-10 border-b border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-2 font-medium">参考价格</div>
              {isLoggedIn ? (
                <div className="text-3xl font-black text-[#c9a84c] tracking-wider">
                  {product.priceDisplay}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black text-white/20 tracking-wider blur-[6px] select-none">
                    {product.priceHidden}
                  </div>
                  <Link
                    href="/login"
                    className="text-xs px-4 py-2 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#0a0a0a] transition-all tracking-wider"
                  >
                    登录查看价格
                  </Link>
                </div>
              )}
            </div>
            {isLoggedIn && (
              <p className="text-white/25 text-xs tracking-wider max-w-xs">
                含基础装配，不含运输及现场安装费用。具体报价请联系顾问。
              </p>
            )}
          </div>
        </section>

        {/* ── Design Philosophy ── */}
        <section className="py-20 border-b border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-4 font-medium">设计理念</div>
              <h2 className="text-3xl font-black text-white mb-6 leading-tight">
                {product.tagline2}
              </h2>
              <p className="text-white/50 text-sm leading-loose">{product.designPhilosophy}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {product.zones.map((zone) => (
                  <span
                    key={zone}
                    className="text-xs px-3 py-1.5 border tracking-wider"
                    style={{ borderColor: `${product.accentColor}30`, color: `${product.accentColor}` }}
                  >
                    {zone}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] bg-[#111] overflow-hidden">
              <Image
                src={product.image}
                alt={product.model}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${product.accentColor}15, transparent 50%)`,
                }}
              />
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section className="py-20 border-b border-white/5">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">核心特性</div>
            <h2 className="text-3xl font-black text-white">六大设计亮点</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.features.map((feature, i) => (
              <div
                key={i}
                className="bg-[#111] border border-white/8 hover:border-[#c9a84c]/30 transition-all duration-300 p-6 group"
              >
                <div
                  className="w-8 h-8 flex items-center justify-center text-sm font-black mb-4"
                  style={{ background: `${product.accentColor}20`, color: product.accentColor }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-white font-bold mb-2 tracking-wider">{feature.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Space Configuration ── */}
        <section className="py-20 border-b border-white/5">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">空间配置</div>
            <h2 className="text-3xl font-black text-white">功能区域规划</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.spaces.map((space, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 bg-[#111] border border-white/8 hover:border-[#c9a84c]/20 transition-all"
              >
                <div
                  className="shrink-0 w-10 h-10 flex items-center justify-center font-black text-sm"
                  style={{ background: `${product.accentColor}15`, color: product.accentColor }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-1 tracking-wider">{space.name}</div>
                  <div className="text-white/45 text-sm leading-relaxed">{space.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Materials ── */}
        <section className="py-20 border-b border-white/5">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">五大结构主材</div>
            <h2 className="text-3xl font-black text-white">工业级建造标准</h2>
            <p className="text-white/40 text-sm mt-3 max-w-xl mx-auto tracking-wider">
              出厂即成品，现场接通水电即可使用，无需传统建筑施工
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.materials.map((mat, i) => (
              <div
                key={i}
                className="p-5 bg-[#111] border border-white/8 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: product.accentColor }} />
                <div className="pl-3">
                  <div className="text-white font-bold text-sm mb-1 tracking-wider">{mat.title}</div>
                  <div className="text-white/40 text-xs tracking-wider">{mat.spec}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Full specs table */}
          <div className="mt-10 border border-white/8 overflow-hidden">
            <div className="bg-[#111] px-6 py-3 border-b border-white/8">
              <span className="text-white/40 text-xs tracking-wider uppercase">完整规格参数</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-white/5">
              {[
                ['型号', `${product.model} ${product.gen}`],
                ['外形长度', `${product.dimensions.length}mm`],
                ['外形宽度', `${product.dimensions.width}mm`],
                ['外形高度', `${product.dimensions.height}mm`],
                ['建筑面积', product.floorArea],
                ['额定功率', product.power],
                ['自重', product.weight],
                ['容纳人数', product.capacity],
                ['系列', product.series],
              ].map(([k, v]) => (
                <div key={k} className="p-4">
                  <div className="text-white/30 text-[10px] tracking-wider mb-1">{k}</div>
                  <div className="text-white text-sm font-semibold tracking-wider">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 text-center">
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-4 font-medium">开始合作</div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            对 {product.model} {product.gen} 感兴趣？
          </h2>
          <p className="text-white/40 text-sm mb-10 max-w-lg mx-auto tracking-wider">
            填写需求表单，专业顾问将在 24 小时内联系您，提供定制方案与报价
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="text-sm font-bold px-8 py-3 tracking-wider transition-colors"
              style={{ background: product.accentColor, color: '#0a0a0a' }}
            >
              立即咨询报价
            </Link>
            <a
              href="tel:4008090303"
              className="text-sm px-8 py-3 border border-white/30 text-white hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors tracking-wider"
            >
              400-8090-303
            </a>
          </div>
        </section>
      </div>

      {/* ── Product Navigation ── */}
      {(prevProduct || nextProduct) && (
        <div className="border-t border-white/8 bg-[#0d0d0d]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 divide-x divide-white/8">
              <div className="py-6 pr-8">
                {prevProduct && (
                  <Link href={`/products/${prevProduct.slug}`} className="group flex items-center gap-3">
                    <svg className="w-5 h-5 text-white/30 group-hover:text-[#c9a84c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <div>
                      <div className="text-white/25 text-xs mb-0.5">上一个产品</div>
                      <div className="text-white group-hover:text-[#c9a84c] transition-colors font-bold tracking-wider">
                        {prevProduct.model} {prevProduct.gen}
                      </div>
                    </div>
                  </Link>
                )}
              </div>
              <div className="py-6 pl-8 text-right">
                {nextProduct && (
                  <Link href={`/products/${nextProduct.slug}`} className="group inline-flex items-center gap-3">
                    <div>
                      <div className="text-white/25 text-xs mb-0.5">下一个产品</div>
                      <div className="text-white group-hover:text-[#c9a84c] transition-colors font-bold tracking-wider">
                        {nextProduct.model} {nextProduct.gen}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-white/30 group-hover:text-[#c9a84c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
