'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchPublicPageModules,
  itemContent,
  itemLabel,
  itemValue,
  moduleMap,
  visibleItems,
  type PublicPageModule,
} from '@/lib/page-module-client';

function isExternalHref(href: string) {
  return href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http://') || href.startsWith('https://');
}

export default function FloatingContact() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [siteModules, setSiteModules] = useState<PublicPageModule[] | null>(null);

  useEffect(() => {
    if (pathname?.startsWith('/global')) return;
    const controller = new AbortController();
    fetchPublicPageModules('site', controller.signal)
      .then((modules) => setSiteModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') console.warn('[floating-contact] site modules unavailable', err);
      });
    return () => controller.abort();
  }, [pathname]);

  if (pathname?.startsWith('/global')) return null;

  const floatingModule = moduleMap(siteModules).get('floating-contact') ?? null;
  const items = visibleItems(floatingModule)
    .map((item) => ({
      id: item.id,
      label: itemLabel(item, lang),
      content: itemContent(item, lang),
      value: itemValue(item, lang),
      href: item.href || '',
      sort_order: item.sort_order,
    }))
    .filter((item) => item.label && item.href);

  if (floatingModule?.is_visible === false || items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {items.map((item, index) => {
        const body = (
          <>
            <span className="text-xs font-bold uppercase tracking-[0.12em]">{item.label}</span>
            {item.content || item.value ? (
              <span className="hidden text-[11px] font-medium opacity-70 sm:inline">
                {item.content || item.value}
              </span>
            ) : null}
          </>
        );
        const className = index === 0
          ? 'inline-flex min-h-11 items-center gap-2 bg-[#E36F2C] px-4 py-2 text-white shadow-[0_16px_40px_rgba(36,31,27,0.22)] transition hover:bg-[#C85A1F]'
          : 'inline-flex min-h-10 items-center gap-2 border border-[#DADDE1] bg-white px-3 py-2 text-[#1F2A31] shadow-[0_12px_30px_rgba(36,31,27,0.14)] transition hover:border-[#E36F2C] hover:text-[#C85A1F]';

        return isExternalHref(item.href) ? (
          <a
            key={item.id}
            href={item.href}
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={className}
          >
            {body}
          </a>
        ) : (
          <Link key={item.id} href={item.href} className={className}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}
