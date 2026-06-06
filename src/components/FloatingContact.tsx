'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ExternalLink, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteModules } from '@/contexts/SiteModulesContext';
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
  const initialSiteModules = useSiteModules();
  const [siteModules, setSiteModules] = useState<PublicPageModule[] | null>(initialSiteModules);
  const [activeDesktopItemId, setActiveDesktopItemId] = useState<string | null>(null);
  const isHomePath = pathname === '/';
  const [showHomeMobileActions, setShowHomeMobileActions] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith('/global')) return;
    if (Array.isArray(initialSiteModules) && initialSiteModules.length > 0) {
      return;
    }
    const controller = new AbortController();
    fetchPublicPageModules('site', controller.signal)
      .then((modules) => setSiteModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') console.warn('[floating-contact] site modules unavailable', err);
      });
    return () => controller.abort();
  }, [initialSiteModules, pathname]);

  useEffect(() => {
    if (!isHomePath) return;

    const updateHomeMobileActions = () => {
      setShowHomeMobileActions(window.scrollY > Math.max(480, window.innerHeight * 0.86));
    };

    const initialFrame = window.requestAnimationFrame(updateHomeMobileActions);
    window.addEventListener('scroll', updateHomeMobileActions, { passive: true });
    window.addEventListener('resize', updateHomeMobileActions);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener('scroll', updateHomeMobileActions);
      window.removeEventListener('resize', updateHomeMobileActions);
    };
  }, [isHomePath]);

  if (pathname?.startsWith('/global')) return null;

  const floatingModule = moduleMap(siteModules).get('floating-contact') ?? null;
  const items = visibleItems(floatingModule)
    .map((item) => ({
      id: item.id,
      label: itemLabel(item, lang),
      content: itemContent(item, lang),
      value: itemValue(item, lang),
      href: normalizeSiteHref(item.href || '', ''),
      image: item.image_url?.trim() || '',
      sort_order: item.sort_order,
    }))
    .filter((item) => item.label && (item.href || item.image));

  if (floatingModule?.is_visible === false || items.length === 0) return null;

  const renderAction = (item: (typeof items)[number], variant: 'desktop' | 'mobile') => {
    const Icon = actionIcon(item.id);
    const content = item.content || item.value;
    const showDesktopImage = variant === 'desktop' && item.image && activeDesktopItemId === item.id;
    const desktopInteractionProps = variant === 'desktop'
      ? {
          onMouseEnter: () => setActiveDesktopItemId(item.id),
          onMouseLeave: () => setActiveDesktopItemId((current) => current === item.id ? null : current),
          onFocus: () => setActiveDesktopItemId(item.id),
          onBlur: () => setActiveDesktopItemId((current) => current === item.id ? null : current),
        }
      : {};
    const body = variant === 'desktop' ? (
      <>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#2F3032] text-white">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className={`pointer-events-none invisible absolute right-full top-1/2 mr-2 -translate-y-1/2 border border-white/10 bg-[#2F3032]/96 px-3 py-2 text-left opacity-0 shadow-[0_16px_40px_rgba(15,23,42,0.2)] backdrop-blur-md transition group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${item.image ? 'w-48' : 'min-w-44'}`}>
          <span className="block truncate text-xs font-black uppercase tracking-[0.14em]">{item.label}</span>
          {content ? <span className="mt-0.5 block truncate text-[11px] opacity-65">{content}</span> : null}
          {showDesktopImage ? (
            <span className="mt-3 block bg-white p-2">
              <Image
                src={item.image}
                alt={content ? `${item.label} ${content}` : item.label}
                width={150}
                height={150}
                className="h-[150px] w-[150px] object-contain"
                unoptimized
              />
            </span>
          ) : null}
        </span>
      </>
    ) : (
      <>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="truncate text-xs font-black uppercase tracking-[0.12em]">{item.label}</span>
      </>
    );

    const className = variant === 'desktop'
      ? 'group relative flex h-11 w-11 items-center justify-center overflow-visible border border-white/10 bg-[#2F3032]/94 text-white shadow-[0_16px_40px_rgba(15,23,42,0.2)] backdrop-blur-md transition hover:border-white/40 hover:bg-[#222326]'
      : 'inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 border border-[#DADDE1] bg-white px-3 text-[#1F2A31] shadow-[0_10px_28px_rgba(36,31,27,0.18)] transition hover:border-[#E36F2C] hover:text-[#C85A1F]';

    if (!item.href) {
      return (
        <button
          key={item.id}
          type="button"
          className={className}
          aria-label={content ? `${item.label} ${content}` : item.label}
          {...desktopInteractionProps}
        >
          {body}
        </button>
      );
    }

    return isExternalHref(item.href) ? (
      <a
        key={item.id}
        href={item.href}
        target={item.href.startsWith('http') ? '_blank' : undefined}
        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={className}
        aria-label={content ? `${item.label} ${content}` : item.label}
        {...desktopInteractionProps}
      >
        {body}
      </a>
    ) : (
      <Link
        key={item.id}
        href={item.href}
        prefetch={false}
        className={className}
        aria-label={content ? `${item.label} ${content}` : item.label}
        {...desktopInteractionProps}
      >
        {body}
      </Link>
    );
  };

  return (
    <>
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2 lg:flex" data-floating-contact="desktop">
        {items.map((item) => renderAction(item, 'desktop'))}
      </div>
      <div
        className={`fixed bottom-4 left-4 right-4 z-40 flex gap-2 transition duration-300 lg:hidden ${
          isHomePath && !showHomeMobileActions ? 'pointer-events-none translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        }`}
        data-floating-contact="mobile"
      >
        {items.slice(0, 3).map((item) => renderAction(item, 'mobile'))}
      </div>
    </>
  );
}
