'use client';

import Link from 'next/link';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 flex items-center justify-center border border-white/15 text-white/50 hover:border-[#c9a84c]/60 hover:text-[#c9a84c] transition-all duration-200"
    >
      {children}
    </a>
  );
}

const socialLinks = [
  { label: 'WeChat', href: 'https://weixin.qq.com', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.063-6.122zm-3.718 3.19c.533 0 .963.441.963.983a.973.973 0 01-.963.983.973.973 0 01-.964-.983c0-.542.43-.983.964-.983zm4.56 0c.533 0 .963.441.963.983a.973.973 0 01-.963.983.973.973 0 01-.964-.983c0-.542.43-.983.964-.983z"/></svg> },
  { label: 'Weibo', href: 'https://weibo.com', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM11.907 17c-.355-.044-.505.113-.565.268-.062.17.015.33.138.395.267.14.69.14.916-.02.217-.157.215-.41-.006-.519-.176-.088-.393-.1-.483-.124zM9.832 16.79c-.916.185-1.56.89-1.444 1.57.115.685 1.008 1.065 1.93.88.924-.186 1.553-.892 1.44-1.575-.114-.68-1.005-1.066-1.926-.875zM22.94 8.628a5.27 5.27 0 00-4.25-3.48A3.627 3.627 0 0014.95 2c-1.793.35-2.83 1.97-2.322 3.619l.116.36-.376.028c-5.388.412-9.461 4.108-9.129 8.257.343 4.274 5.012 7.301 10.436 6.782 5.744-.548 10.053-4.614 9.638-9.08a5.26 5.26 0 00-1.372-3.338zm-1.79 3.15c-.12 1.6-1.34 2.95-3.06 3.6-.37.14-.64.08-.78-.14-.13-.22-.06-.5.18-.68 1.03-.77 1.54-1.84 1.42-3.01-.09-.84-.54-1.56-1.28-2.08-.38-.27-.44-.58-.2-.85.24-.26.61-.28.97.01 1.38 1.07 2.04 2.6 1.75 3.15z"/></svg> },
  { label: 'Douyin', href: 'https://www.douyin.com', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/></svg> },
  { label: 'Xiaohongshu', href: 'https://www.xiaohongshu.com', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14.5v-9l7 4.5-7 4.5z"/></svg> },
  { label: 'YouTube', href: 'https://www.youtube.com', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
];

export default function Footer() {
  const t = useT();

  const productLinks = [
    ['E7 Gen6', '38.8㎡', '/products/e7'],
    ['E6 Gen6', '29.6㎡', '/products/e6'],
    ['E3 Gen6', '19㎡ mini', '/products/e3'],
    ['V9 Gen6', '38㎡', '/products/v9'],
    ['V5 Gen5', '24.8㎡', '/products/v5'],
    ['S5 Gen5', '29.6㎡', '/products/s5'],
  ] as const;

  const companyLinks = [
    { label: t(i18n.nav.about), href: '/about' },
    { label: t(i18n.nav.cases), href: '/cases' },
    { label: t(i18n.nav.news), href: '/news' },
    { label: t(i18n.nav.contact), href: '/contact' },
    { label: t(i18n.nav.scenarioTourism), href: '/scenarios/tourism' },
    { label: t(i18n.nav.scenarioCommercial), href: '/scenarios/commercial' },
    { label: t(i18n.nav.scenarioPublic), href: '/scenarios/public' },
  ];

  return (
    <footer id="contact" className="bg-[#1C1A18] border-t border-[#c9a84c]/15">
      {/* CTA bar */}
      <div className="bg-[#c9a84c]/5 border-b border-[#c9a84c]/15 py-8">
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
              className="bg-[#c9a84c] text-[#1C1A18] font-bold text-sm px-6 py-3 hover:bg-[#b8973b] transition-colors tracking-wider"
            >
              {t(i18n.footer.phoneBtn)}
            </a>
            <Link
              href="/contact"
              className="border border-[#c9a84c]/40 text-[#c9a84c] text-sm px-6 py-3 hover:bg-[#c9a84c]/10 transition-colors tracking-wider"
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
              <div className="text-[#c9a84c] font-black text-2xl tracking-[0.25em] uppercase mb-1">VESSEL</div>
              <div className="text-white/30 text-xs tracking-[0.3em]">{t(i18n.footer.brandTagline)}</div>
            </div>
            <p className="text-white/35 text-xs leading-relaxed mb-5 max-w-xs">
              {t(i18n.footer.brandDesc)}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {socialLinks.map((s) => (
                <SocialIcon key={s.label} href={s.href} label={s.label}>
                  {s.icon}
                </SocialIcon>
              ))}
            </div>
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
                    className="flex items-center gap-2 text-white/40 hover:text-[#c9a84c] transition-colors text-sm group"
                  >
                    <span className="text-[#c9a84c]/30 group-hover:text-[#c9a84c] transition-colors">›</span>
                    <span className="tracking-wider">{name}</span>
                    <span className="text-white/20 text-xs">{desc}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="flex items-center gap-2 text-white/40 hover:text-[#c9a84c] transition-colors text-sm group">
                  <span className="text-[#c9a84c]/30 group-hover:text-[#c9a84c] transition-colors">›</span>
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
                    className="flex items-center gap-2 text-white/40 hover:text-[#c9a84c] transition-colors text-sm group"
                  >
                    <span className="text-[#c9a84c]/30 group-hover:text-[#c9a84c] transition-colors">›</span>
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
                <svg className="w-4 h-4 text-[#c9a84c] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <a href="tel:4008090303" className="text-white/60 text-sm hover:text-[#c9a84c] transition-colors font-medium tracking-wider">
                    400-8090-303
                  </a>
                  <div className="text-white/25 text-xs mt-0.5">{t(i18n.footer.workHours)}</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#c9a84c] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:vessel.sale@303industries.cn" className="text-white/50 text-xs hover:text-[#c9a84c] transition-colors break-all">
                  vessel.sale@303industries.cn
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#c9a84c] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <Link href="#" className="text-white/20 hover:text-white/40 text-xs tracking-wider transition-colors">{t(i18n.footer.privacy)}</Link>
            <span className="text-white/10">·</span>
            <Link href="#" className="text-white/20 hover:text-white/40 text-xs tracking-wider transition-colors">{t(i18n.footer.terms)}</Link>
            <span className="text-white/10">·</span>
            <span className="text-white/20 text-xs tracking-wider">粤ICP备XXXXXXXX号</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
