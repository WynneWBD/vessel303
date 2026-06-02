'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { normalizeSiteHref } from '@/lib/site-links';
import {
  fetchPublicPageModules,
  itemById,
  itemContent,
  itemLabel,
  itemValue,
  moduleDescription,
  moduleMap,
  moduleTitle,
  visibleItems,
  type PublicPageModule,
} from '@/lib/page-module-client';

function isExternalActionHref(href: string) {
  return href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http://') || href.startsWith('https://');
}

function FooterLinkList({ module }: { module: PublicPageModule | null }) {
  const { lang } = useLanguage();
  const title = moduleTitle(module, lang);
  const items = visibleItems(module).filter((item) => item.href && itemLabel(item, lang));
  if (!module || module.is_visible === false || (!title && items.length === 0)) return null;

  return (
    <div>
      {title ? (
        <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-white">{title}</h4>
      ) : null}
      <ul className="space-y-2.5">
        {items.map((item) => {
          const href = normalizeSiteHref(item.href, '');
          return (
            <li key={item.id}>
              {isExternalActionHref(href) ? (
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="group flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-[#E36F2C]"
                >
                  <span className="text-[#E36F2C]/30 transition-colors group-hover:text-[#E36F2C]">-</span>
                  <span className="tracking-wider">{itemLabel(item, lang)}</span>
                  {itemValue(item, lang) ? (
                    <span className="text-xs text-white/20">{itemValue(item, lang)}</span>
                  ) : null}
                </a>
              ) : (
                <Link
                  href={href}
                  className="group flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-[#E36F2C]"
                >
                <span className="text-[#E36F2C]/30 transition-colors group-hover:text-[#E36F2C]">-</span>
                <span className="tracking-wider">{itemLabel(item, lang)}</span>
                {itemValue(item, lang) ? (
                  <span className="text-xs text-white/20">{itemValue(item, lang)}</span>
                ) : null}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { lang } = useLanguage();
  const [siteModules, setSiteModules] = useState<PublicPageModule[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicPageModules('site', controller.signal)
      .then((modules) => setSiteModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') console.warn('[footer] site modules unavailable', err);
      });
    return () => controller.abort();
  }, []);

  const modules = moduleMap(siteModules);
  const cta = modules.get('footer-cta') ?? null;
  const brand = modules.get('footer-brand') ?? null;
  const products = modules.get('footer-products') ?? null;
  const company = modules.get('footer-company') ?? null;
  const contact = modules.get('footer-contact') ?? null;

  const ctaTitle = moduleTitle(cta, lang);
  const ctaDescription = moduleDescription(cta, lang);
  const ctaItems = visibleItems(cta).filter((item) => item.href && itemLabel(item, lang));
  const brandDescription = moduleDescription(brand, lang);
  const brandItems = visibleItems(brand);
  const brandLogo = itemById(brand, 'logo');
  const brandLogoSrc = brandLogo?.image_url || '';
  const brandLogoHref = brandLogo?.href ? normalizeSiteHref(brandLogo.href, '') : '';
  const brandLogoAlt = itemLabel(brandLogo, lang);
  const contactItems = visibleItems(contact);

  return (
    <footer id="contact" className="border-t border-[#E36F2C]/15 bg-[#241F1B]">
      {cta?.is_visible !== false && (ctaTitle || ctaDescription || ctaItems.length > 0) ? (
        <div className="border-b border-[#E36F2C]/15 bg-[#E36F2C]/5 py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
            <div>
              {ctaTitle ? <div className="mb-1 text-lg font-bold tracking-wider text-white">{ctaTitle}</div> : null}
              {ctaDescription ? <div className="text-sm tracking-wider text-white/40">{ctaDescription}</div> : null}
            </div>
            {ctaItems.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {ctaItems.map((item, index) => {
                  const label = itemLabel(item, lang);
                  const href = normalizeSiteHref(item.href, '');
                  const isExternalAction = isExternalActionHref(href);
                  const className = index === 0
                    ? 'bg-[#E36F2C] px-6 py-3 text-sm font-bold tracking-wider text-white transition-colors hover:bg-[#C85A1F]'
                    : 'border border-[#E36F2C]/40 px-6 py-3 text-sm tracking-wider text-[#E36F2C] transition-colors hover:bg-[#E36F2C]/10';
                  return isExternalAction ? (
                    <a
                      key={item.id}
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className={className}
                    >
                      {label}
                    </a>
                  ) : (
                    <Link key={item.id} href={href} className={className}>{label}</Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {brand?.is_visible !== false ? (
            <div className="lg:col-span-2">
              <div className="mb-4">
                {brandLogoSrc ? (
                  brandLogoHref ? (
                    <Link href={brandLogoHref}>
                      <Image
                        src={brandLogoSrc}
                        alt={brandLogoAlt}
                        height={32}
                        width={128}
                        style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: 4 }}
                        unoptimized
                      />
                    </Link>
                  ) : (
                    <Image
                      src={brandLogoSrc}
                      alt={brandLogoAlt}
                      height={32}
                      width={128}
                      style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: 4 }}
                      unoptimized
                    />
                  )
                ) : null}
                {brandItems[0] ? (
                  <div className="text-xs tracking-[0.3em] text-white/30">{itemLabel(brandItems[0], lang)}</div>
                ) : null}
              </div>
              {brandDescription ? (
                <p className="mb-5 max-w-xs text-xs leading-relaxed text-white/35">{brandDescription}</p>
              ) : null}
              <div className="space-y-1 text-xs text-white/20">
                {brandItems.slice(1).map((item) => {
                  const label = itemLabel(item, lang);
                  if (!label) return null;
                  const href = item.href ? normalizeSiteHref(item.href, '') : '';
                  if (href && isExternalActionHref(href)) {
                    return (
                      <a
                        key={item.id}
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="block hover:text-[#E36F2C]"
                      >
                        {label}
                      </a>
                    );
                  }
                  return <div key={item.id}>{label}</div>;
                })}
              </div>
            </div>
          ) : null}

          <FooterLinkList module={products} />
          <FooterLinkList module={company} />

          {contact?.is_visible !== false ? (
            <div>
              {moduleTitle(contact, lang) ? (
                <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  {moduleTitle(contact, lang)}
                </h4>
              ) : null}
              <ul className="space-y-4">
                {contactItems.map((item) => {
                  const label = itemLabel(item, lang);
                  const content = itemContent(item, lang);
                  if (!label) return null;
                  const href = item.href ? normalizeSiteHref(item.href, '') : '';
                  const body = (
                    <>
                      <span className="text-sm text-white/55">{label}</span>
                      {content ? <span className="mt-0.5 block text-xs text-white/25">{content}</span> : null}
                    </>
                  );

                  return (
                    <li key={item.id} className="text-xs leading-relaxed text-white/40">
                      {href && isExternalActionHref(href) ? (
                        <a
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="transition-colors hover:text-[#E36F2C]"
                        >
                          {body}
                        </a>
                      ) : href ? (
                        <Link href={href} className="transition-colors hover:text-[#E36F2C]">
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
