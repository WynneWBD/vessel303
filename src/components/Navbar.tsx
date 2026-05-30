'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AuthButton from './AuthButton';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchPublicPageModules,
  itemById,
  itemLabel,
  itemValue,
  moduleMap,
  visibleItems,
  type PublicPageModule,
} from '@/lib/page-module-client';

interface NavLink {
  label: string;
  href: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [siteModules, setSiteModules] = useState<PublicPageModule[] | null>(null);
  const { lang } = useLanguage();

  const navbarModule = moduleMap(siteModules).get('navbar') ?? null;
  const uiLabelsModule = moduleMap(siteModules).get('ui-labels') ?? null;
  const navbarItems = visibleItems(navbarModule);
  const logoItem = itemById(navbarModule, 'logo');
  const logoSrc = logoItem?.image_url || '';
  const logoHref = logoItem?.href || '';
  const logoAlt = itemLabel(logoItem, lang);
  const navLinks: NavLink[] = navbarItems
    .filter((item) => itemValue(item, lang) === 'primary')
    .map((item) => ({ label: itemLabel(item, lang), href: item.href || '' }))
    .filter((item) => item.label && item.href);
  const actionLinks = navbarItems
    .filter((item) => itemValue(item, lang) === 'action')
    .map((item) => ({ label: itemLabel(item, lang), href: item.href || '' }))
    .filter((item) => item.label && item.href);
  const menuToggleLabel = itemLabel(itemById(uiLabelsModule, 'menu-toggle'), lang);

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicPageModules('site', controller.signal)
      .then((modules) => setSiteModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') console.warn('[navbar] site modules unavailable', err);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#241F1B]/98 backdrop-blur-md border-b border-[#E36F2C]/20 shadow-lg shadow-black/40'
          : 'bg-[#241F1B]/88 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 xl:h-[72px]">

          {logoSrc && logoHref ? (
            <Link href={logoHref} className="flex shrink-0 items-center">
              <Image
                src={logoSrc}
                alt={logoAlt}
                height={40}
                width={160}
                style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                className="h-7 xl:h-[40px]"
                priority
                unoptimized
              />
            </Link>
          ) : null}

          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-0.5 mx-4">
            {navLinks.map((link) => (
              <div key={link.label} className="relative">
                <Link
                  href={link.href}
                  className="text-white/65 hover:text-[#E36F2C] text-sm font-medium tracking-wide px-2.5 py-2 transition-colors duration-200 whitespace-nowrap relative group block"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-2.5 w-0 h-px bg-[#E36F2C] transition-all duration-200 group-hover:w-[calc(100%-20px)]" />
                </Link>
              </div>
            ))}
          </div>

          {/* CTA + Toggle */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {actionLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={index === 0
                  ? 'text-white text-sm font-semibold px-3.5 py-2 border border-white/50 hover:bg-[#F5F2ED] hover:text-[#241F1B] transition-all duration-200 tracking-wider whitespace-nowrap'
                  : 'text-white/75 text-sm font-medium px-3.5 py-2 border border-white/20 hover:border-[#E36F2C] hover:text-[#E36F2C] transition-all duration-200 tracking-wider whitespace-nowrap'}
              >
                {link.label}
              </Link>
            ))}
            <LanguageToggle />
            <AuthButton />
          </div>

          {/* Mobile Toggle */}
          <button
            className="xl:hidden inline-flex min-h-11 min-w-11 items-center justify-center text-white/80 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={menuToggleLabel || undefined}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`xl:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-[calc(100vh-4rem)] overflow-y-auto opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 border-t border-white/10 space-y-0.5">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="block text-white/70 hover:text-[#E36F2C] text-sm py-3 px-2 border-b border-white/5 transition-colors tracking-wider"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </div>
            ))}

            {actionLinks.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
                {actionLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={index === 0
                      ? 'inline-flex min-h-11 items-center justify-center bg-[#241F1B] px-4 text-center text-sm font-semibold tracking-wider text-white border border-white/60'
                      : 'inline-flex min-h-11 items-center justify-center bg-transparent px-4 text-center text-sm tracking-wider text-white/80 border border-white/25'}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="pt-3 flex items-center justify-between px-1">
              <LanguageToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
