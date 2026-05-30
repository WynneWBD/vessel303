'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage, useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import { buildContactHref } from '@/lib/site-links';

export default function Footer() {
  const t = useT();
  const { lang } = useLanguage();

  const productLinks = [
    ['E7 Gen6', '38.8㎡', '/products/e7-gen6-flagship'],
    ['E6 Gen6', '29.6㎡', '/products/e6'],
    ['E3 Gen6', '19㎡ mini', '/products/e3'],
    ['V9 Gen6', '38㎡', '/products/v9-gen6-standard'],
    ['V5 Gen5', '24.8㎡', '/products/v5'],
    ['S5 Gen5', '29.6㎡', '/products/s5'],
  ] as const;

  const companyLinks = [
    { label: t(i18n.nav.about), href: '/about' },
    { label: t(i18n.nav.cases), href: '/cases' },
    { label: t(i18n.nav.news), href: '/news' },
    { label: t(i18n.nav.contact), href: buildContactHref('footer:company_contact') },
    { label: t(i18n.footer.mediaKit), href: '/media-kit' },
    { label: t(i18n.nav.scenarioTourism), href: '/scenarios/tourism' },
    { label: t(i18n.nav.scenarioCommercial), href: '/scenarios/commercial' },
    { label: t(i18n.nav.scenarioPublic), href: '/scenarios/public' },
  ];

  return (
    <footer id="contact" className="bg-[#241F1B] border-t border-[#E36F2C]/15">
      {/* CTA bar */}
      <div className="bg-[#E36F2C]/5 border-b border-[#E36F2C]/15 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-white font-bold text-lg tracking-wider mb-1">
              {t(i18n.footer.ctaTitle)}
            </div>
            <div className="text-white/40 text-sm tracking-wider">
              {t(i18n.footer.ctaSubtitle)}
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="tel:4008090303"
              className="bg-[#E36F2C] text-white font-bold text-sm px-6 py-3 hover:bg-[#C85A1F] transition-colors tracking-wider"
            >
              {t(i18n.footer.phoneBtn)}
            </a>
            <Link
              href={buildContactHref('footer:message_cta')}
              className="border border-[#E36F2C]/40 text-[#E36F2C] text-sm px-6 py-3 hover:bg-[#E36F2C]/10 transition-colors tracking-wider"
            >
              {t(i18n.footer.messageBtn)}
            </Link>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Image
                src="/images/vessel-logo.png"
                alt="VESSEL 微宿"
                height={32}
                width={128}
                style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: 4 }}
                unoptimized
              />
              <div className="text-white/30 text-xs tracking-[0.3em]">{t(i18n.footer.brandTagline)}</div>
            </div>
            <p className="text-white/35 text-xs leading-relaxed mb-5 max-w-xs">
              {t(i18n.footer.brandDesc)}
            </p>
            <div className="text-white/20 text-xs space-y-1">
              <div>WhatsApp: +86 180-2417-6679</div>
              <div>Email: 303vessel@303industries.cn</div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white text-xs font-semibold tracking-[0.25em] mb-5 uppercase">{t(i18n.footer.productsHeading)}</h4>
            <ul className="space-y-2.5">
              {productLinks.map(([name, desc, href]) => (
                <li key={name}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-white/40 hover:text-[#E36F2C] transition-colors text-sm group"
                  >
                    <span className="text-[#E36F2C]/30 group-hover:text-[#E36F2C] transition-colors">›</span>
                    <span className="tracking-wider">{name}</span>
                    <span className="text-white/20 text-xs">{desc}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="flex items-center gap-2 text-white/40 hover:text-[#E36F2C] transition-colors text-sm group">
                  <span className="text-[#E36F2C]/30 group-hover:text-[#E36F2C] transition-colors">›</span>
                  <span className="tracking-wider">{t(i18n.footer.allProducts)}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-xs font-semibold tracking-[0.25em] mb-5 uppercase">{t(i18n.footer.companyHeading)}</h4>
            <ul className="space-y-2.5">
              {companyLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-white/40 hover:text-[#E36F2C] transition-colors text-sm group"
                  >
                    <span className="text-[#E36F2C]/30 group-hover:text-[#E36F2C] transition-colors">›</span>
                    <span className="tracking-wider">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-xs font-semibold tracking-[0.25em] mb-5 uppercase">{t(i18n.footer.contactHeading)}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#E36F2C] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <a href="tel:4008090303" className="text-white/60 text-sm hover:text-[#E36F2C] transition-colors font-medium tracking-wider">
                    400-8090-303
                  </a>
                  <div className="text-white/25 text-xs mt-0.5">{t(i18n.footer.workHours)}</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#E36F2C] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:vessel.sale@303industries.cn" className="text-white/50 text-xs hover:text-[#E36F2C] transition-colors break-all">
                  vessel.sale@303industries.cn
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#E36F2C] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white/40 text-xs leading-relaxed">{t(i18n.footer.address)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-white/20 text-xs tracking-wider">
            {t(i18n.footer.copyright)}
          </div>
          <div className="flex items-center gap-4">
            <span className="cursor-not-allowed text-white/20 text-xs tracking-wider" title="待配置">
              {t(i18n.footer.privacy)}
            </span>
            <span className="text-white/10">·</span>
            <span className="cursor-not-allowed text-white/20 text-xs tracking-wider" title="待配置">
              {t(i18n.footer.terms)}
            </span>
            <span className="text-white/10">·</span>
            <span className="text-white/20 text-xs tracking-wider">
              {lang === 'zh' ? '备案信息待配置' : 'ICP filing pending'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
