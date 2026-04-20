'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AuthButton from './AuthButton';
import LanguageToggle from './LanguageToggle';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

interface DropdownItem {
  label: string;
  href: string;
  sub?: string;
  group?: string;
}

interface NavLink {
  label: string;
  href: string;
  dropdown?: DropdownItem[];
}

function ProductsDropdown({ items }: { items: DropdownItem[] }) {
  const gen6Items = items.slice(0, 4);
  const gen5Items = items.slice(4, 6);
  const allLink = items[6];
  const t = useT();

  return (
    <div className="absolute top-full left-0 mt-1 w-[440px] bg-[#1A1A1A] border border-[#E36F2C]/20 shadow-2xl shadow-black/60 z-50">
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-[#E36F2C]/60 to-transparent" />
      <div className="grid grid-cols-2 divide-x divide-white/5">
        {/* Gen6 */}
        <div className="p-3">
          <div className="text-[#E36F2C]/60 text-[10px] tracking-[0.3em] uppercase font-medium px-2 pb-2 border-b border-white/5 mb-1">
            {t(i18n.nav.gen6Label)}
          </div>
          {gen6Items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-2 py-2.5 text-white/65 hover:text-[#E36F2C] hover:bg-[#E36F2C]/5 transition-colors rounded group"
            >
              <span className="text-sm tracking-wider font-medium">{item.label}</span>
              {item.sub && (
                <span className="text-white/25 text-[11px] group-hover:text-[#E36F2C]/50 ml-2 shrink-0">{item.sub}</span>
              )}
            </Link>
          ))}
        </div>
        {/* Gen5 */}
        <div className="p-3">
          <div className="text-white/30 text-[10px] tracking-[0.3em] uppercase font-medium px-2 pb-2 border-b border-white/5 mb-1">
            {t(i18n.nav.gen5Label)}
          </div>
          {gen5Items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-2 py-2.5 text-white/65 hover:text-[#E36F2C] hover:bg-[#E36F2C]/5 transition-colors rounded group"
            >
              <span className="text-sm tracking-wider font-medium">{item.label}</span>
              {item.sub && (
                <span className="text-white/25 text-[11px] group-hover:text-[#E36F2C]/50 ml-2 shrink-0">{item.sub}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
      {allLink && (
        <div className="border-t border-white/5">
          <Link
            href={allLink.href}
            className="block px-5 py-2.5 text-[#E36F2C]/70 hover:text-[#E36F2C] hover:bg-[#E36F2C]/5 text-xs tracking-[0.2em] transition-colors text-center"
          >
            {allLink.label}
          </Link>
        </div>
      )}
    </div>
  );
}

function SimpleDropdown({ items }: { items: DropdownItem[] }) {
  return (
    <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-[#1A1A1A] border border-[#2A2A2E] shadow-2xl shadow-black/60 z-50">
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-[#E36F2C]/60 to-transparent" />
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-0 px-4 py-2.5 text-white/65 hover:text-[#E36F2C] hover:bg-[#E36F2C]/5 transition-all duration-150 text-sm border-b border-white/5 last:border-0 tracking-wider border-l-2 border-l-transparent hover:border-l-[#E36F2C] pl-3"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const t = useT();

  const navLinks: NavLink[] = [
    { label: t(i18n.nav.products), href: '/products' },
    { label: t(i18n.nav.cases), href: '/global' },
    {
      label: t(i18n.nav.about),
      href: '/about',
      dropdown: [
        { label: t(i18n.nav.aboutBrandStory), href: '/about' },
        { label: t(i18n.nav.aboutCoreTech), href: '/innovation' },
        { label: t(i18n.nav.aboutCerts), href: '/about#certifications' },
        { label: t(i18n.nav.aboutFounder), href: '/about#founder' },
      ],
    },
    { label: t(i18n.nav.faq), href: '/faq' },
    { label: t(i18n.nav.news), href: '/news' },
    { label: t(i18n.nav.contact), href: '/contact' },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#1A1A1A]/98 backdrop-blur-md border-b border-[#E36F2C]/20 shadow-lg shadow-black/50'
          : 'bg-[#1A1A1A]/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/vessel-logo.png"
              alt="VESSEL 微宿"
              height={40}
              width={160}
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              className="h-7 lg:h-[40px]"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5 mx-4">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.dropdown && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {link.dropdown ? (
                  <button
                    className="flex items-center gap-1 text-white/65 hover:text-[#E36F2C] text-sm font-medium tracking-wide px-2.5 py-2 transition-colors duration-200 whitespace-nowrap relative group"
                    onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                  >
                    {link.label}
                    <svg
                      className={`w-3 h-3 shrink-0 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="absolute bottom-0 left-2.5 w-0 h-px bg-[#E36F2C] transition-all duration-200 group-hover:w-[calc(100%-20px)]" />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className="text-white/65 hover:text-[#E36F2C] text-sm font-medium tracking-wide px-2.5 py-2 transition-colors duration-200 whitespace-nowrap relative group block"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-2.5 w-0 h-px bg-[#E36F2C] transition-all duration-200 group-hover:w-[calc(100%-20px)]" />
                  </Link>
                )}

                {/* Dropdown */}
                {link.dropdown && openDropdown === link.label && (
                  <div>
                    {link.label === t(i18n.nav.products)
                      ? <ProductsDropdown items={link.dropdown} />
                      : <SimpleDropdown items={link.dropdown} />
                    }
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA + Toggle */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link
              href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
              className="text-white text-sm font-semibold px-3.5 py-2 border border-white/50 hover:bg-white hover:text-[#1A1A1A] transition-all duration-200 tracking-wider whitespace-nowrap"
            >
              {t(i18n.nav.purchaseBtn)}
            </Link>
            <Link
              href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
              className="text-white/75 text-sm font-medium px-3.5 py-2 border border-white/20 hover:border-[#E36F2C] hover:text-[#E36F2C] transition-all duration-200 tracking-wider whitespace-nowrap"
            >
              {t(i18n.nav.bookingBtn)}
            </Link>
            <LanguageToggle />
            <AuthButton />
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden text-white/80 hover:text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
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
            isOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 border-t border-white/10 space-y-0.5">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.dropdown ? (
                  <>
                    <button
                      className="w-full flex items-center justify-between text-white/70 text-sm py-3 px-2 tracking-wider"
                      onClick={() => setMobileOpen(mobileOpen === link.label ? null : link.label)}
                    >
                      <span>{link.label}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${mobileOpen === link.label ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {mobileOpen === link.label && (
                      <div className="pl-4 pb-2 space-y-0.5 border-l border-[#E36F2C]/20 ml-2">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between text-white/50 hover:text-[#E36F2C] text-sm py-2 px-2 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <span>{item.label}</span>
                            {item.sub && <span className="text-white/25 text-xs">{item.sub}</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className="block text-white/70 hover:text-[#E36F2C] text-sm py-3 px-2 border-b border-white/5 transition-colors tracking-wider"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Link
                href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center bg-[#1A1A1A] text-white text-sm font-semibold py-3 border border-white/60 tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                {t(i18n.nav.purchaseBtn)}
              </Link>
              <Link
                href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center bg-transparent text-white/80 text-sm py-3 border border-white/25 tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                {t(i18n.nav.bookingBtn)}
              </Link>
            </div>
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
