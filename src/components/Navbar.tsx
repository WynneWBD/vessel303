'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AuthButton from './AuthButton';

interface NavLink {
  label: string;
  href: string;
  dropdown?: Array<{ label: string; href: string; sub?: string }>;
}

const navLinks: NavLink[] = [
  { label: '微宿 E7 Gen6', href: '/products/e7' },
  { label: '微宿 V9 Gen6', href: '/products/v9' },
  { label: '微宿 E6 Gen6', href: '/products/e6' },
  {
    label: '更多产品',
    href: '/products',
    dropdown: [
      { label: 'E7 Gen6', sub: '38.8㎡ 旗舰版', href: '/products/e7' },
      { label: 'E6 Gen6', sub: '29.6㎡ 明星版', href: '/products/e6' },
      { label: 'E3 Gen6', sub: '19㎡ mini版', href: '/products/e3' },
      { label: 'V9 Gen6', sub: '38㎡ 家居版', href: '/products/v9' },
      { label: 'V5 Gen5', sub: '24.8㎡ 全景版', href: '/products/v5' },
      { label: 'S5 Gen5', sub: '29.6㎡ 天光版', href: '/products/s5' },
    ],
  },
  {
    label: '项目案例',
    href: '/cases',
    dropdown: [
      { label: '文旅度假营地', href: '/scenarios/tourism' },
      { label: '商业空间案例', href: '/scenarios/commercial' },
      { label: '公共设施案例', href: '/scenarios/public' },
      { label: '全部案例', href: '/cases' },
    ],
  },
  { label: '关于我们', href: '/about' },
  { label: '新闻活动', href: '/news' },
  { label: '联系我们', href: '/contact' },
];

function DropdownMenu({ items }: { items: NonNullable<NavLink['dropdown']> }) {
  return (
    <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-[#111] border border-[#c9a84c]/20 shadow-2xl shadow-black/60 z-50">
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-[#c9a84c]/60 to-transparent" />
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center justify-between px-4 py-3 text-white/65 hover:text-[#c9a84c] hover:bg-[#c9a84c]/5 transition-colors text-sm border-b border-white/5 last:border-0 group"
        >
          <span className="tracking-wider">{item.label}</span>
          {item.sub && (
            <span className="text-white/25 text-xs group-hover:text-[#c9a84c]/50 ml-3">{item.sub}</span>
          )}
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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close dropdown on outside click
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
          ? 'bg-[#0a0a0a]/98 backdrop-blur-md border-b border-[#c9a84c]/20 shadow-lg shadow-black/50'
          : 'bg-[#0a0a0a]/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative flex flex-col">
              <span className="text-[#c9a84c] font-black text-xl tracking-[0.25em] uppercase leading-none">
                VESSEL
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-px w-full bg-gradient-to-r from-[#c9a84c]/60 to-transparent" />
                <span className="text-white/40 text-[10px] tracking-[0.3em] whitespace-nowrap">微宿®</span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.href} className="relative">
                {link.dropdown ? (
                  <button
                    className="flex items-center gap-1 text-white/65 hover:text-[#c9a84c] text-sm font-medium tracking-wider px-3 py-2 transition-colors duration-200 group"
                    onMouseEnter={() => setOpenDropdown(link.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                    onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                  >
                    {link.label}
                    <svg
                      className={`w-3 h-3 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="absolute -bottom-0.5 left-3 w-0 h-px bg-[#c9a84c] transition-all duration-200 group-hover:w-[calc(100%-24px)]" />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className="text-white/65 hover:text-[#c9a84c] text-sm font-medium tracking-wider px-3 py-2 transition-colors duration-200 relative group block"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-3 w-0 h-px bg-[#c9a84c] transition-all duration-200 group-hover:w-[calc(100%-24px)]" />
                  </Link>
                )}

                {/* Dropdown */}
                {link.dropdown && openDropdown === link.label && (
                  <div
                    onMouseEnter={() => setOpenDropdown(link.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <DropdownMenu items={link.dropdown} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="bg-[#0a0a0a] text-white text-sm font-semibold px-4 py-2 border border-white/60 hover:bg-white hover:text-[#0a0a0a] transition-all duration-200 tracking-wider"
            >
              采购咨询
            </Link>
            <Link
              href="/contact"
              className="bg-transparent text-white/80 text-sm font-medium px-4 py-2 border border-white/25 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all duration-200 tracking-wider"
            >
              预订营地
            </Link>
            <AuthButton />
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden text-white/80 hover:text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="切换菜单"
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
            isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 border-t border-white/10 space-y-0.5">
            {navLinks.map((link) => (
              <div key={link.href}>
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
                      <div className="pl-4 pb-2 space-y-0.5 border-l border-[#c9a84c]/20 ml-2">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between text-white/50 hover:text-[#c9a84c] text-sm py-2 px-2 transition-colors"
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
                    className="block text-white/70 hover:text-[#c9a84c] text-sm py-3 px-2 border-b border-white/5 transition-colors tracking-wider"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Link
                href="/contact"
                className="flex-1 text-center bg-[#0a0a0a] text-white text-sm font-semibold py-3 border border-white/60 tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                采购咨询
              </Link>
              <Link
                href="/contact"
                className="flex-1 text-center bg-transparent text-white/80 text-sm py-3 border border-white/25 tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                预订营地
              </Link>
            </div>
            <div className="pt-3 flex justify-center">
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
