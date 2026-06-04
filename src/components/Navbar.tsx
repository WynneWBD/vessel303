'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteModules } from '@/contexts/SiteModulesContext';
import { normalizeSiteHref } from '@/lib/site-links';
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
  id: string;
  label: string;
  href: string;
  imageUrl?: string;
  content?: string;
}

export default function Navbar() {
  const initialSiteModules = useSiteModules();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [siteModules, setSiteModules] = useState<PublicPageModule[] | null>(initialSiteModules);
  const { lang } = useLanguage();

  const navbarModule = moduleMap(siteModules).get('navbar') ?? null;
  const uiLabelsModule = moduleMap(siteModules).get('ui-labels') ?? null;
  const navbarItems = visibleItems(navbarModule);
  const logoItem = itemById(navbarModule, 'logo');
  const logoSrc = logoItem?.image_url || '';
  const logoHref = logoItem?.href ? normalizeSiteHref(logoItem.href, '') : '';
  const logoAlt = itemLabel(logoItem, lang);
  const navLinks: NavLink[] = navbarItems
    .filter((item) => itemValue(item, lang) === 'primary')
    .map((item) => ({
      id: item.id,
      label: itemLabel(item, lang),
      href: item.href ? normalizeSiteHref(item.href, '') : '',
      imageUrl: item.image_url,
      content: lang === 'zh' ? item.content_zh : item.content_en,
    }))
    .filter((item) => item.label && item.href);
  const modelLinks: NavLink[] = navbarItems
    .filter((item) => itemValue(item, lang) === 'model')
    .map((item) => ({
      id: item.id,
      label: itemLabel(item, lang),
      href: item.href ? normalizeSiteHref(item.href, '') : '',
      imageUrl: item.image_url,
      content: lang === 'zh' ? item.content_zh : item.content_en,
    }))
    .filter((item) => item.label && item.href);
  const actionLinks = navbarItems
    .filter((item) => itemValue(item, lang) === 'action')
    .map((item) => ({
      id: item.id,
      label: itemLabel(item, lang),
      href: item.href ? normalizeSiteHref(item.href, '') : '',
      imageUrl: item.image_url,
      content: lang === 'zh' ? item.content_zh : item.content_en,
    }))
    .filter((item) => item.label && item.href);
  const menuToggleLabel = itemLabel(itemById(uiLabelsModule, 'menu-toggle'), lang);
  const desktopNavLinks = [...modelLinks, ...navLinks];
  const currentLanguageLabel = lang === 'zh' ? 'Chinese' : 'English';

  useEffect(() => {
    if (Array.isArray(initialSiteModules) && initialSiteModules.length > 0) {
      return;
    }
    const controller = new AbortController();
    fetchPublicPageModules('site', controller.signal)
      .then((modules) => setSiteModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') console.warn('[navbar] site modules unavailable', err);
      });
    return () => controller.abort();
  }, [initialSiteModules]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-[#263647]/82 shadow-[0_14px_42px_rgba(15,23,42,0.22)] backdrop-blur-md'
          : 'bg-[#42576D]/26 backdrop-blur-[2px]'
      }`}
    >
      <div className="relative mx-auto max-w-[1420px] px-5 sm:px-8 lg:px-10">
        <div className="flex h-16 items-center justify-between lg:h-[92px]">

          {logoSrc && logoHref ? (
            <Link href={logoHref} className="flex shrink-0 items-center">
              <Image
                src={logoSrc}
                alt={logoAlt}
                height={40}
                width={160}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                className="h-7 w-auto max-w-[176px] sm:h-8 sm:max-w-[210px] lg:h-[42px] lg:max-w-none"
                priority
                unoptimized
              />
            </Link>
          ) : null}

          {/* Desktop Nav */}
          <div className="mx-10 hidden flex-1 items-center justify-center gap-8 lg:flex xl:gap-9">
            {desktopNavLinks.map((link) => (
              <div key={link.id} className="relative group">
                <Link
                  href={link.href}
                  className="relative block whitespace-nowrap py-2 text-[14px] font-medium text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.32)] transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-200 group-hover:w-full" />
                </Link>
              </div>
            ))}
          </div>

          {/* CTA + Toggle */}
          <div className="hidden shrink-0 items-center gap-3 2xl:flex">
            <LanguageToggle />
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden inline-flex min-h-11 min-w-11 items-center justify-center text-white/80 hover:text-white"
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
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-[calc(100vh-4rem)] overflow-y-auto opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 border-t border-white/10 space-y-0.5">
            {navLinks.map((link) => (
              <div key={link.id}>
                <Link
                  href={link.href}
                  className="block text-white/70 hover:text-[#E36F2C] text-sm py-3 px-2 border-b border-white/5 transition-colors tracking-wider"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
                {link.id === 'nav-products' && modelLinks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 border-b border-white/5 px-2 py-3">
                    {modelLinks.map((model) => (
                      <Link
                        key={model.id}
                        href={model.href}
                        className="flex min-h-14 items-center gap-2 border border-white/10 bg-white/[0.03] px-2 py-2 text-white/75"
                        onClick={() => setIsOpen(false)}
                      >
                        {model.imageUrl ? (
                          <span className="relative h-10 w-12 shrink-0 overflow-hidden bg-white/5">
                            <Image
                              src={model.imageUrl}
                              alt={model.label}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          </span>
                        ) : null}
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold tracking-wide">{model.label}</span>
                          {model.content ? (
                            <span className="mt-0.5 block truncate text-[11px] text-white/45">{model.content}</span>
                          ) : null}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
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
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute left-[max(1.25rem,calc((100vw-1420px)/2+2.5rem))] top-[78px] hidden lg:block">
        <div className="inline-flex min-h-11 items-center gap-4 rounded-full bg-white px-6 text-[15px] text-[#334155] shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
          <span>{currentLanguageLabel}</span>
          <span aria-hidden="true" className="text-xs text-[#64748B]">v</span>
        </div>
      </div>
    </nav>
  );
}
