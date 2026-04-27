'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import type { CatalogProduct } from '@/lib/products';

interface Props {
  product: CatalogProduct;
  isLoggedIn: boolean;
}

const TYPE_LABEL: Record<string, { cn: string; en: string }> = {
  compact:  { cn: '紧凑型', en: 'Compact' },
  standard: { cn: '标准型', en: 'Standard' },
  luxury:   { cn: '豪华型', en: 'Luxury' },
};

export default function CatalogProductDetailContent({ product, isLoggedIn }: Props) {
  const t = useT();
  const { lang } = useLanguage();

  const name    = lang === 'en' ? product.name_en : product.name_cn;
  const badge   = lang === 'en' ? product.badge_en : product.badge_cn;
  const tags    = lang === 'en' ? product.tags_en  : product.tags_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const typeLabel = TYPE_LABEL[product.productType] ?? TYPE_LABEL.standard;

  return (
    <main className="bg-white text-[#2C2A28]">
      {/* ── Hero image ── */}
      <section className="relative h-[400px] sm:h-[500px] overflow-hidden bg-white">
        <Image
          src={product.image}
          alt={name}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A18] via-[#1C1A18]/50 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-6 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-[#888888] tracking-wider">
              <Link href="/" className="hover:text-[#E36F2C] transition-colors">
                {t(i18n.productDetail.home)}
              </Link>
              <span>/</span>
              <Link href="/products" className="hover:text-[#E36F2C] transition-colors">
                {t(i18n.productDetail.breadcrumbProducts)}
              </Link>
              <span>/</span>
              <span className="text-[#555555]">{name}</span>
            </div>
          </div>
        </div>

        {/* Overlay text */}
        <div className="absolute bottom-8 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold px-2.5 py-1 bg-[#E36F2C] text-white tracking-wider">
                {badge}
              </span>
              {product.isCustom && (
                <span className="text-[10px] px-2.5 py-1 border border-[#BBBBBB] text-[#555555] tracking-wider">
                  {lang === 'en' ? 'Custom Case' : '定制案例'}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-wide leading-tight">
              <span className="text-[#E36F2C]">VESSEL</span>
              <span className="text-white ml-3 drop-shadow-sm">{name}</span>
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: main info */}
          <div className="lg:col-span-2 space-y-10">

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 bg-white/5 text-[#555555] border border-[#E0DCD6] tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Features */}
            <div>
              <div className="text-[#E36F2C] text-[10px] tracking-[0.25em] uppercase mb-4">
                {t(i18n.productDetail.featuresLabel)}
              </div>
              <ul className="space-y-4">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#E36F2C] text-sm mt-0.5 shrink-0">▸</span>
                    <span className="text-[#5A5A5A] text-sm leading-relaxed tracking-wide">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[#E36F2C] text-[10px] tracking-[0.25em] uppercase mb-4">
                {lang === 'en' ? 'Best-fit scenarios' : '适用场景'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(lang === 'en'
                  ? ['Resort guest rooms', 'Remote camp expansion', 'Commercial showcase']
                  : ['度假营地客房', '远程营地扩容', '商业展示空间']
                ).map((item) => (
                  <div key={item} className="border border-[#E5DED4] bg-[#FAF9F6] p-4">
                    <div className="text-sm font-semibold text-[#2C2A28] tracking-wide">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* isCustom notice */}
            {product.isCustom && (
              <div className="border border-[#E36F2C]/20 bg-[#E36F2C]/5 p-5">
                <div className="text-[#E36F2C] text-xs tracking-[0.2em] uppercase mb-2">
                  {lang === 'en' ? 'Custom Case · Real Project' : '定制案例 · 真实落地项目'}
                </div>
                <p className="text-[#5A5A5A] text-sm leading-relaxed">
                  {lang === 'en'
                    ? 'This is a real custom delivery case. VESSEL can customize interior layout, exterior finish, structure, and systems based on local building codes and climate conditions. Contact us to discuss your specific requirements.'
                    : '这是一个真实落地的定制交付案例。VESSEL 可根据当地建筑法规、气候条件，对内部布局、外观饰面、结构及系统进行全面定制。欢迎联系我们探讨您的具体需求。'}
                </p>
              </div>
            )}

            {/* 4 param grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 border border-[#E5DED4]">
              {[
                {
                  label: t(i18n.productDetail.specArea),
                  value: product.size,
                },
                {
                  label: lang === 'en' ? 'Generation' : '代别',
                  value: product.gen,
                },
                {
                  label: t(i18n.productDetail.specSeries),
                  value: `VESSEL ${product.productSeries}`,
                },
                {
                  label: lang === 'en' ? 'Type' : '产品类型',
                  value: lang === 'en' ? typeLabel.en : typeLabel.cn,
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white p-5">
                  <div className="text-[#888888] text-[10px] tracking-[0.2em] uppercase mb-2">{label}</div>
                  <div className="text-[#2C2A28] font-bold text-lg tracking-wider">{value}</div>
                </div>
              ))}
            </div>

            <div className="border border-[#E5DED4] p-5">
              <div className="text-[#E36F2C] text-[10px] tracking-[0.25em] uppercase mb-3">
                {lang === 'en' ? 'Customization scope' : '可定制范围'}
              </div>
              <p className="text-[#5A5A5A] text-sm leading-relaxed">
                {lang === 'en'
                  ? 'Exterior finish, interior layout, furniture package, climate systems, off-grid energy, bathroom/kitchen modules, and local compliance details can be configured by project.'
                  : '可按项目配置外观饰面、内部布局、家具包、暖通系统、离网能源、卫浴/厨房模块，以及当地规范适配细节。'}
              </p>
            </div>
          </div>

          {/* Right: price + CTA */}
          <div className="space-y-5">
            {/* Price card */}
            <div className="bg-white border border-[#E5DED4] p-6">
              <div className="text-[#E36F2C] text-[10px] tracking-[0.25em] uppercase mb-4">
                {t(i18n.productDetail.priceLabel)}
              </div>
              {isLoggedIn ? (
                <div className="text-[#666666] text-sm tracking-wider">
                  {lang === 'en'
                    ? 'Contact our consultant for a customized quote.'
                    : '请联系顾问获取定制报价。'}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#888888] text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="tracking-wider">{t(i18n.productDetail.loginToView)}</span>
                </div>
              )}
              <p className="mt-4 text-[#999999] text-xs leading-relaxed">
                {t(i18n.productDetail.priceNote)}
              </p>
            </div>

            {/* Delivery strip */}
            <div className="bg-[#E36F2C]/8 border border-[#E36F2C]/20 p-4">
              <div className="text-[#E36F2C] text-xs tracking-wider leading-relaxed">
                {t(i18n.productDetail.deliveryStrip)}
              </div>
            </div>

            {/* CTA */}
            <Link
              href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
              className="block text-center py-4 font-bold tracking-[0.2em] uppercase text-sm bg-[#E36F2C] text-white hover:bg-[#C85A1F] transition-colors duration-200"
            >
              {t(i18n.productDetail.inquireBtn)}
            </Link>

            <Link
              href="/products"
              className="block text-center py-3 text-xs font-semibold tracking-[0.2em] uppercase text-[#E36F2C]/70 border border-[#E36F2C]/20 hover:border-[#E36F2C]/50 hover:text-[#E36F2C] transition-colors duration-200"
            >
              {t(i18n.productDetail.otherProducts)}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
