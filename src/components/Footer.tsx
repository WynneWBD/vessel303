'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Badge,
  BookOpenText,
  Camera,
  Grid2X2,
  Link2,
  MessageCircle,
  Music2,
  PlaySquare,
  Video,
} from 'lucide-react';
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
  type PublicPageModuleItem,
  type PublicPageModule,
} from '@/lib/page-module-client';
import { useSiteModules } from '@/contexts/SiteModulesContext';

function isExternalActionHref(href: string) {
  return href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http://') || href.startsWith('https://');
}

function isFooterSocialItem(item: PublicPageModuleItem) {
  return item.id.startsWith('social-');
}

function FooterSocialIcon({ itemId }: { itemId: string }) {
  const className = 'h-[18px] w-[18px]';
  const strokeWidth = 1.9;

  if (itemId.includes('wechat')) return <MessageCircle aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
  if (itemId.includes('video')) return <Video aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
  if (itemId.includes('xiaohongshu')) return <BookOpenText aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
  if (itemId.includes('mini')) return <Grid2X2 aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
  if (itemId.includes('tiktok')) return <Music2 aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
  if (itemId.includes('instagram')) return <Camera aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
  if (itemId.includes('youtube')) return <PlaySquare aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
  if (itemId.includes('badge')) return <Badge aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
  return <Link2 aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}

function FooterSocialLink({ item }: { item: PublicPageModuleItem }) {
  const { lang } = useLanguage();
  const label = itemLabel(item, lang);
  const rawHref = item.href ? normalizeSiteHref(item.href, '') : '';
  if (!label) return null;

  const content = (
    <span
      className="inline-flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#E36F2C] text-white transition hover:bg-[#F2A36E]"
      title={label}
      data-page-module-item={item.id}
      data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
    >
      <FooterSocialIcon itemId={item.id} />
      <span className="sr-only">{label}</span>
    </span>
  );

  if (!rawHref) {
    return (
      <span data-page-module-item={item.id} data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>
        {content}
      </span>
    );
  }

  if (isExternalActionHref(rawHref)) {
    return (
      <a
        href={rawHref}
        target={rawHref.startsWith('http') ? '_blank' : undefined}
        rel={rawHref.startsWith('http') ? 'noopener noreferrer' : undefined}
        aria-label={label}
        data-page-module-item={item.id}
        data-page-module-field="href"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={rawHref}
      prefetch={false}
      aria-label={label}
      data-page-module-item={item.id}
      data-page-module-field="href"
    >
      {content}
    </Link>
  );
}

function FooterLinkList({ module }: { module: PublicPageModule | null }) {
  const { lang } = useLanguage();
  const title = moduleTitle(module, lang);
  const items = visibleItems(module).filter((item) => item.href && itemLabel(item, lang));
  if (!module || module.is_visible === false || (!title && items.length === 0)) return null;

  return (
    <div
      data-page-module={`${module.page_key ?? 'site'}:${module.module_key}`}
      data-page-key={module.page_key ?? 'site'}
      data-module-key={module.module_key}
      data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}
    >
      {title ? (
        <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-white" data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}>{title}</h4>
      ) : null}
      <ul className="space-y-2.5">
        {items.map((item) => {
          const href = normalizeSiteHref(item.href, '');
          return (
            <li
              key={item.id}
              data-page-module-item={item.id}
              data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
            >
              {isExternalActionHref(href) ? (
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="group flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-[#E36F2C]"
                  data-page-module-field="href"
                >
                  <span className="text-[#E36F2C]/30 transition-colors group-hover:text-[#E36F2C]">-</span>
                  <span className="tracking-wider" data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>{itemLabel(item, lang)}</span>
                  {itemValue(item, lang) ? (
                    <span className="text-xs text-white/20" data-page-module-field={lang === 'zh' ? 'value_zh' : 'value_en'}>{itemValue(item, lang)}</span>
                  ) : null}
                </a>
              ) : (
                <Link
                  href={href}
                  prefetch={false}
                  className="group flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-[#E36F2C]"
                  data-page-module-field="href"
                >
                <span className="text-[#E36F2C]/30 transition-colors group-hover:text-[#E36F2C]">-</span>
                <span className="tracking-wider" data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>{itemLabel(item, lang)}</span>
                {itemValue(item, lang) ? (
                  <span className="text-xs text-white/20" data-page-module-field={lang === 'zh' ? 'value_zh' : 'value_en'}>{itemValue(item, lang)}</span>
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
  const initialSiteModules = useSiteModules();
  const [siteModules, setSiteModules] = useState<PublicPageModule[] | null>(initialSiteModules);

  useEffect(() => {
    if (Array.isArray(initialSiteModules) && initialSiteModules.length > 0) {
      return;
    }
    const controller = new AbortController();
    fetchPublicPageModules('site', controller.signal)
      .then((modules) => setSiteModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') console.warn('[footer] site modules unavailable', err);
      });
    return () => controller.abort();
  }, [initialSiteModules]);

  const modules = moduleMap(siteModules);
  const uiLabels = modules.get('ui-labels') ?? null;
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
  const brandTextItems = brandItems.filter((item) => item.id !== 'logo' && !isFooterSocialItem(item));
  const brandTagline = brandTextItems.find((item) => item.id === 'tagline') ?? brandTextItems[0] ?? null;
  const brandContactItems = brandTextItems.filter((item) => item.id !== brandTagline?.id);
  const brandSocialItems = brandItems.filter(isFooterSocialItem);
  const footerSocialLabel = itemLabel(itemById(uiLabels, 'footer-social-links'), lang) || 'VESSEL social links';
  const about = modules.get('footer-about') ?? null;
  const contactItems = visibleItems(contact);
  const showAboutLinks = Boolean(about && about.is_visible !== false);

  return (
    <footer id="contact" className="border-t border-[#E36F2C]/15 bg-[#241F1B]">
      {cta?.is_visible !== false && (ctaTitle || ctaDescription || ctaItems.length > 0) ? (
        <div
          className="border-b border-[#E36F2C]/15 bg-[#E36F2C]/5 py-8"
          data-page-module="site:footer-cta"
          data-page-key="site"
          data-module-key="footer-cta"
          data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
            <div>
              {ctaTitle ? <div className="mb-1 text-lg font-bold tracking-wider text-white" data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}>{ctaTitle}</div> : null}
              {ctaDescription ? <div className="text-sm tracking-wider text-white/40" data-page-module-field={lang === 'zh' ? 'description_zh' : 'description_en'}>{ctaDescription}</div> : null}
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
                      data-page-module-item={item.id}
                      data-page-module-field="href"
                    >
                      <span data-page-module-item={item.id} data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>
                        {label}
                      </span>
                    </a>
                  ) : (
                    <Link key={item.id} href={href} prefetch={false} className={className} data-page-module-item={item.id} data-page-module-field="href">
                      <span data-page-module-item={item.id} data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>
                        {label}
                      </span>
                    </Link>
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
            <div
              className="lg:col-span-2"
              data-page-module="site:footer-brand"
              data-page-key="site"
              data-module-key="footer-brand"
              data-page-module-field={lang === 'zh' ? 'description_zh' : 'description_en'}
            >
              <div className="mb-4">
                {brandLogoSrc ? (
                  brandLogoHref ? (
                    <Link
                      href={brandLogoHref}
                      prefetch={false}
                      data-page-module-item="logo"
                      data-page-module-field="href"
                    >
                      <Image
                        src={brandLogoSrc}
                        alt={brandLogoAlt}
                        height={32}
                        width={128}
                        style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: 4, filter: 'brightness(0) invert(1)' }}
                        unoptimized
                        data-page-module-item="logo"
                        data-page-module-field="image_url"
                      />
                    </Link>
                  ) : (
                    <Image
                      src={brandLogoSrc}
                      alt={brandLogoAlt}
                      height={32}
                      width={128}
                      style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: 4, filter: 'brightness(0) invert(1)' }}
                      unoptimized
                      data-page-module-item="logo"
                      data-page-module-field="image_url"
                    />
                  )
                ) : null}
                {brandTagline ? (
                  <div
                    className="text-xs tracking-[0.3em] text-white/30"
                    data-page-module-item={brandTagline.id}
                    data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                  >
                    {itemLabel(brandTagline, lang)}
                  </div>
                ) : null}
              </div>
              {brandDescription ? (
                <p className="mb-5 max-w-xs text-xs leading-relaxed text-white/35" data-page-module-field={lang === 'zh' ? 'description_zh' : 'description_en'}>{brandDescription}</p>
              ) : null}
              <div className="space-y-1 text-xs text-white/20">
                {brandContactItems.map((item) => {
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
                          data-page-module-item={item.id}
                          data-page-module-field="href"
                        >
                        <span data-page-module-item={item.id} data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>
                          {label}
                        </span>
                      </a>
                    );
                  }
                  return <div key={item.id} data-page-module-item={item.id} data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>{label}</div>;
                })}
              </div>
              {brandSocialItems.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-3" aria-label={footerSocialLabel}>
                  {brandSocialItems.map((item) => (
                    <FooterSocialLink key={item.id} item={item} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <FooterLinkList module={products} />
          <FooterLinkList module={company} />
          {showAboutLinks ? <FooterLinkList module={about} /> : null}

          {!showAboutLinks && contact?.is_visible !== false ? (
            <div
              data-page-module="site:footer-contact"
              data-page-key="site"
              data-module-key="footer-contact"
              data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}
            >
              {moduleTitle(contact, lang) ? (
                <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-white" data-page-module-field={lang === 'zh' ? 'title_zh' : 'title_en'}>
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
                      <span className="text-sm text-white/55" data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}>{label}</span>
                      {content ? <span className="mt-0.5 block text-xs text-white/25" data-page-module-field={lang === 'zh' ? 'content_zh' : 'content_en'}>{content}</span> : null}
                    </>
                  );

                  return (
                    <li
                      key={item.id}
                      className="text-xs leading-relaxed text-white/40"
                      data-page-module-item={item.id}
                      data-page-module-field={lang === 'zh' ? 'label_zh' : 'label_en'}
                    >
                      {href && isExternalActionHref(href) ? (
                        <a
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="transition-colors hover:text-[#E36F2C]"
                          data-page-module-field="href"
                        >
                          {body}
                        </a>
                      ) : href ? (
                        <Link href={href} prefetch={false} className="transition-colors hover:text-[#E36F2C]" data-page-module-field="href">
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
