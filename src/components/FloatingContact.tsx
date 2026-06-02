'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, Mail, MessageCircle, Phone, Send } from 'lucide-react';
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
import { normalizeSiteHref } from '@/lib/site-links';

function isExternalHref(href: string) {
  return href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http://') || href.startsWith('https://');
}

function actionIcon(id: string) {
  const key = id.toLowerCase();
  if (key.includes('whatsapp')) return MessageCircle;
  if (key.includes('email') || key.includes('mail')) return Mail;
  if (key.includes('phone') || key.includes('tel')) return Phone;
  if (key.includes('inquiry') || key.includes('message')) return Send;
  return ExternalLink;
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
      href: normalizeSiteHref(item.href || ''),
      sort_order: item.sort_order,
    }))
    .filter((item) => item.label && item.href);

  if (floatingModule?.is_visible === false || items.length === 0) return null;

  const renderAction = (item: (typeof items)[number], variant: 'desktop' | 'mobile') => {
    const Icon = actionIcon(item.id);
    const content = item.content || item.value;
    const body = variant === 'desktop' ? (
      <>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-white/10 bg-[#E36F2C] text-white">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0 px-3 py-2">
          <span className="block truncate text-xs font-black uppercase tracking-[0.14em]">{item.label}</span>
          {content ? <span className="mt-0.5 block truncate text-[11px] opacity-65">{content}</span> : null}
        </span>
      </>
    ) : (
      <>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="truncate text-xs font-black uppercase tracking-[0.12em]">{item.label}</span>
      </>
    );

    const className = variant === 'desktop'
      ? 'group flex min-h-10 w-52 items-stretch overflow-hidden border border-white/10 bg-[#241F1B]/92 text-white shadow-[0_16px_40px_rgba(36,31,27,0.26)] backdrop-blur-md transition hover:border-[#E36F2C] hover:bg-[#17120F]'
      : 'inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 border border-[#DADDE1] bg-white px-3 text-[#1F2A31] shadow-[0_10px_28px_rgba(36,31,27,0.18)] transition hover:border-[#E36F2C] hover:text-[#C85A1F]';

    return isExternalHref(item.href) ? (
      <a
        key={item.id}
        href={item.href}
        target={item.href.startsWith('http') ? '_blank' : undefined}
        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={className}
        aria-label={content ? `${item.label} ${content}` : item.label}
      >
        {body}
      </a>
    ) : (
      <Link
        key={item.id}
        href={item.href}
        className={className}
        aria-label={content ? `${item.label} ${content}` : item.label}
      >
        {body}
      </Link>
    );
  };

  return (
    <>
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2 md:flex">
        {items.map((item) => renderAction(item, 'desktop'))}
      </div>
      <div className="fixed bottom-4 left-4 right-4 z-40 flex gap-2 md:hidden">
        {items.slice(0, 3).map((item) => renderAction(item, 'mobile'))}
      </div>
    </>
  );
}
