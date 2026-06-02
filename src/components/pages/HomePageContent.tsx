'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { normalizeSiteHref } from '@/lib/site-links';
import {
  isResolvedPageModuleVisible,
  resolveDynamicPageModules,
  type PageModuleRegistryEntry,
  type ResolvedPageModule,
} from '@/lib/page-module-rendering';
import { getPageModuleTemplateByModuleType, isTemplateBackedPageModule } from '@/lib/page-module-templates';

type Lang = 'zh' | 'en';

type HomeModuleItem = {
  id: string;
  image_url?: string;
  href?: string;
  value_zh?: string;
  value_en?: string;
  content_zh?: string;
  content_en?: string;
  label_zh: string;
  label_en: string;
  is_visible: boolean;
  sort_order: number;
};

type HomePageModule = {
  id?: string;
  page_key?: string;
  module_key: string;
  module_type?: string;
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  is_visible: boolean;
  sort_order: number;
  items?: HomeModuleItem[];
};

type HomePageModulesResponse = {
  data: HomePageModule[] | null;
};

const HOME_MODULE_REGISTRY = [
  {
    rendererKey: 'home.hero',
    pageKey: 'home',
    moduleKey: 'hero',
    moduleType: 'fixed-content',
    defaultSortOrder: 10,
    dynamicEnabled: true,
  },
  {
    rendererKey: 'home.credentials',
    pageKey: 'home',
    moduleKey: 'credentials',
    moduleType: 'stats',
    defaultSortOrder: 20,
    dynamicEnabled: true,
  },
  {
    rendererKey: 'home.operatingProof',
    pageKey: 'home',
    moduleKey: 'operating-proof',
    moduleType: 'fixed-content',
    defaultSortOrder: 25,
    dynamicEnabled: true,
  },
] satisfies PageModuleRegistryEntry[];

function useHomePageModules(initialModules: HomePageModule[] | null | undefined) {
  const [pageModules, setPageModules] = useState<HomePageModule[] | null>(initialModules ?? null);

  useEffect(() => {
    const controller = new AbortController();
    const sp = new URLSearchParams();
    const currentParams = new URLSearchParams(window.location.search);
    const previewVersion = currentParams.get('visualPreview');
    const hasDraftPreview = currentParams.get('visualDraft') === '1';
    if (hasDraftPreview) sp.set('draft', '1');
    if (previewVersion) sp.set('visualPreview', previewVersion);
    if (!hasDraftPreview && !previewVersion && Array.isArray(initialModules) && initialModules.length > 0) return;
    const queryString = sp.toString();
    const url = queryString ? `/api/page-modules/home?${queryString}` : '/api/page-modules/home';

    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: HomePageModulesResponse | null) => {
        if (Array.isArray(payload?.data)) setPageModules(payload.data);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          console.warn('[home] page modules unavailable', err);
        }
      });

    return () => controller.abort();
  }, [initialModules]);

  return pageModules;
}

function moduleItemSortOrder(item: HomeModuleItem) {
  const sortOrder = Number(item.sort_order);
  return Number.isFinite(sortOrder) ? sortOrder : 0;
}

function sortModuleItems(pageModule: HomePageModule | null) {
  if (!pageModule?.is_visible) return [];
  if (!Array.isArray(pageModule.items)) return [];
  return [...pageModule.items].sort((a, b) => moduleItemSortOrder(a) - moduleItemSortOrder(b));
}

function localizedLabel(item: HomeModuleItem | undefined, lang: Lang, _fallback: string) {
  void _fallback;
  if (!item) return '';
  if (!item.is_visible) return '';
  return (lang === 'zh' ? item.label_zh : item.label_en) || '';
}

function localizedValue(item: HomeModuleItem | undefined, lang: Lang, _fallback: string) {
  void _fallback;
  if (!item) return '';
  if (!item.is_visible) return '';
  return (lang === 'zh' ? item.value_zh : item.value_en) || '';
}

function localizedContent(item: HomeModuleItem | undefined, lang: Lang, _fallback: string) {
  void _fallback;
  if (!item) return '';
  if (!item.is_visible) return '';
  return (lang === 'zh' ? item.content_zh : item.content_en) || '';
}

function localizedModuleTitle(pageModule: HomePageModule | null, lang: Lang, _fallback: string) {
  void _fallback;
  if (!pageModule) return '';
  return (lang === 'zh' ? pageModule.title_zh : pageModule.title_en) || '';
}

function localizedModuleDescription(pageModule: HomePageModule | null, lang: Lang, _fallback: string) {
  void _fallback;
  if (!pageModule) return '';
  return (lang === 'zh' ? pageModule.description_zh : pageModule.description_en) || '';
}

function externalLinkProps(href: string) {
  if (/^https?:\/\//i.test(href)) {
    return { target: '_blank', rel: 'noopener noreferrer' };
  }

  return {};
}

function displayHref(href: string | null | undefined) {
  const value = String(href ?? '').trim();
  return value ? normalizeSiteHref(value, '') : '';
}

// ─── Hero ────────────────────────────────────────────────

function optimizedHeroImageUrl(imageUrl: string) {
  const trimmed = imageUrl.trim();
  if (!trimmed) return trimmed;

  try {
    const pathname = new URL(trimmed, 'https://www.vessel303.com').pathname;
    const match = pathname.match(/^\/images\/hero\/homepage_banner-(0[1-5])\.jpg$/i);
    if (match) return `/images/hero/optimized/homepage_banner-${match[1]}.jpg`;
  } catch {
    return trimmed;
  }

  return trimmed;
}

function HeroSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  const [current, setCurrent] = useState(0);
  const items = useMemo(() => sortModuleItems(pageModule), [pageModule]);
  const heroImages = useMemo(() => {
    const editableImages = items
      .filter((item) => typeof item.id === 'string' && item.id.startsWith('hero-image') && item.is_visible && item.image_url)
      .map((item) => optimizedHeroImageUrl(item.image_url as string));

    return editableImages;
  }, [items]);
  const findItem = (id: string) => items.find((item) => typeof item.id === 'string' && item.id === id);
  const tagline = localizedLabel(findItem('hero-tagline'), lang, '');
  const headline = localizedLabel(findItem('hero-headline'), lang, '');
  const subtitle = localizedLabel(findItem('hero-subtitle'), lang, '');
  const primaryCta = findItem('hero-primary-cta');
  const secondaryCta = findItem('hero-secondary-cta');
  const primaryLabel = localizedLabel(primaryCta, lang, '');
  const secondaryLabel = localizedLabel(secondaryCta, lang, '');
  const primaryHref = displayHref(primaryCta?.href);
  const secondaryHref = displayHref(secondaryCta?.href);
  const proofItems = items
    .filter((item) => item.id.startsWith('hero-proof-'))
    .map((item) => ({
      id: item.id,
      value: localizedValue(item, lang, ''),
      label: localizedLabel(item, lang, ''),
      body: localizedContent(item, lang, ''),
    }))
    .filter((item) => item.value || item.label || item.body);
  const activeImage = heroImages.length > 0 ? current % heroImages.length : 0;
  const visibleHeroImages = useMemo(() => {
    if (heroImages.length === 0) return [];
    const nextImage = (activeImage + 1) % heroImages.length;
    return Array.from(new Set([activeImage, nextImage])).map((index) => ({
      index,
      src: heroImages[index],
      active: index === activeImage,
    }));
  }, [activeImage, heroImages]);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  if (!pageModule || !pageModule.is_visible || heroImages.length === 0 || !headline) return null;

  return (
    <section
      className="relative flex min-h-[650px] items-center overflow-hidden bg-[#241F1B] lg:min-h-[690px]"
      data-page-module="home:hero"
      data-page-key="home"
      data-module-key="hero"
    >
      {/* Carousel images */}
      {visibleHeroImages.map(({ src, index, active }) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={active && index === 0}
          sizes="100vw"
          quality={75}
          className={`object-cover transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}
          data-page-module-item={`hero-image-${String(index + 1).padStart(2, '0')}`}
          data-page-module-field="image_url"
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#241F1B]/82 via-[#241F1B]/52 to-[#241F1B]/22" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-5 py-24 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.5fr)] lg:items-end lg:px-8">
        <div className="max-w-3xl text-left">
        {tagline ? (
          <div className="mb-6">
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70"
              data-page-module-item="hero-tagline"
              data-page-module-field={`label_${lang}`}
            >
              {tagline}
            </p>
            <div className="mt-4 h-px w-16 bg-[#E36F2C]" />
          </div>
        ) : null}

        <h1
          className="mb-6 break-words font-[family-name:var(--font-heading)] text-4xl font-normal leading-[1.04] text-white sm:text-6xl lg:text-6xl"
          data-page-module-item="hero-headline"
          data-page-module-field={`label_${lang}`}
        >
          {headline}
        </h1>

        {subtitle ? (
          <p
            className="mb-8 max-w-2xl text-base leading-8 text-white/70 sm:text-lg"
            data-page-module-item="hero-subtitle"
            data-page-module-field={`label_${lang}`}
          >
            {subtitle}
          </p>
        ) : null}

        {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {primaryLabel && primaryHref ? (
              <Link
                href={primaryHref}
                {...externalLinkProps(primaryHref)}
                className="inline-flex min-h-12 items-center justify-center bg-[#E36F2C] px-8 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#C85A1F]"
                data-page-module-item="hero-primary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                {...externalLinkProps(secondaryHref)}
                className="inline-flex min-h-12 items-center justify-center border border-white/35 px-8 text-sm font-bold uppercase tracking-[0.12em] text-white/85 transition-colors hover:border-white/70"
                data-page-module-item="hero-secondary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

        {proofItems.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:pr-20">
            {proofItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="border border-white/18 bg-white/[0.08] p-3 backdrop-blur-sm"
                data-page-module-item={item.id}
              >
                {item.value ? (
                  <p
                    className="font-[family-name:var(--font-heading)] text-2xl font-light leading-none text-white"
                    data-page-module-field={`value_${lang}`}
                  >
                    {item.value}
                  </p>
                ) : null}
                {item.label ? (
                  <p
                    className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F2A36E]"
                    data-page-module-field={`label_${lang}`}
                  >
                    {item.label}
                  </p>
                ) : null}
                {item.body ? (
                  <p
                    className="mt-2 text-xs leading-5 text-white/68"
                    data-page-module-field={`content_${lang}`}
                  >
                    {item.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/20 animate-bounce">
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none"><path d="M10 0v20M3 13l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </section>
  );
}

// ─── Credentials Bar ─────────────────────────────────────

function CredentialsBar({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  const items = useMemo(() => sortModuleItems(pageModule), [pageModule]);
  const stats = items
    .filter((item) => item.is_visible)
    .map((item) => ({
      id: item.id,
      val: localizedValue(item, lang, ''),
      label: localizedLabel(item, lang, ''),
    }))
    .filter((stat) => stat.val || stat.label);

  if (!pageModule || !pageModule.is_visible) return null;
  if (stats.length === 0) return null;

  return (
    <section
      className="relative z-20 -mt-8 bg-transparent pb-6 border-b border-[#E5DED4]"
      data-page-module="home:credentials"
      data-page-key="home"
      data-module-key="credentials"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#E5DED4] bg-white border border-[#E5DED4] shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
          {stats.map((s) => (
            <div key={s.id} className="text-center py-4 px-4" data-page-module-item={s.id}>
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#E36F2C] tracking-tight mb-2"
                style={{ fontFamily: 'var(--font-heading)', fontFeatureSettings: '"tnum"' }}
                data-page-module-field={`value_${lang}`}
              >
                {s.val}
              </div>
              <div
                className="text-xs tracking-wider text-[#8A7D74] uppercase"
                data-page-module-field={`label_${lang}`}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function findModuleItem(pageModule: HomePageModule | null, itemId: string) {
  return sortModuleItems(pageModule).find((item) => item.id === itemId);
}

function SimpleTextSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  if (!pageModule || !pageModule.is_visible) return null;

  const eyebrow = localizedLabel(findModuleItem(pageModule, 'eyebrow'), lang, '');
  const title = localizedModuleTitle(pageModule, lang, '');
  const description = localizedModuleDescription(pageModule, lang, '');
  const body = localizedContent(findModuleItem(pageModule, 'body'), lang, description);

  if (!title && !body) return null;

  return (
    <section
      className="bg-[#FAF7F2] py-20 border-b border-[#E5DED4]"
      data-page-module={`home:${pageModule.module_key}`}
      data-page-key="home"
      data-module-key={pageModule.module_key}
    >
      <div className="max-w-4xl mx-auto px-6 text-center">
        {eyebrow ? (
          <p
            className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-5 font-medium"
            data-page-module-item="eyebrow"
            data-page-module-field={`label_${lang}`}
          >
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2
            className="text-3xl lg:text-4xl font-light text-[#2C2A28] mb-5 font-[family-name:var(--font-heading)]"
            data-page-module-field={`title_${lang}`}
          >
            {title}
          </h2>
        ) : null}
        {body ? (
          <p
            className="text-sm sm:text-base leading-8 text-[#6B625B] max-w-3xl mx-auto"
            data-page-module-item="body"
            data-page-module-field={`content_${lang}`}
          >
            {body}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CtaModuleSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  if (!pageModule || !pageModule.is_visible) return null;

  const eyebrow = localizedLabel(findModuleItem(pageModule, 'eyebrow'), lang, '');
  const title = localizedModuleTitle(pageModule, lang, '');
  const description = localizedModuleDescription(pageModule, lang, '');
  const primary = findModuleItem(pageModule, 'primary-cta');
  const secondary = findModuleItem(pageModule, 'secondary-cta');
  const primaryLabel = localizedLabel(primary, lang, '');
  const secondaryLabel = localizedLabel(secondary, lang, '');
  const primaryHref = displayHref(primary?.href);
  const secondaryHref = displayHref(secondary?.href);

  if (!title && !description && !(primaryLabel && primaryHref) && !(secondaryLabel && secondaryHref)) return null;

  return (
    <section
      className="bg-[#241F1B] py-20"
      data-page-module={`home:${pageModule.module_key}`}
      data-page-key="home"
      data-module-key={pageModule.module_key}
    >
      <div className="max-w-5xl mx-auto px-6 text-center">
        {eyebrow ? (
          <p
            className="text-xs tracking-[0.3em] uppercase text-[#E36F2C] mb-5 font-medium"
            data-page-module-item="eyebrow"
            data-page-module-field={`label_${lang}`}
          >
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2
            className="text-3xl lg:text-5xl font-light text-white mb-5 font-[family-name:var(--font-heading)]"
            data-page-module-field={`title_${lang}`}
          >
            {title}
          </h2>
        ) : null}
        {description ? (
          <p
            className="text-sm sm:text-base leading-8 text-white/65 max-w-2xl mx-auto mb-9"
            data-page-module-field={`description_${lang}`}
          >
            {description}
          </p>
        ) : null}
        {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {primaryLabel && primaryHref ? (
            <Link
              href={primaryHref}
              {...externalLinkProps(primaryHref)}
              className="bg-[#E36F2C] text-white px-10 py-4 text-sm tracking-wider hover:bg-[#C85A1F] transition-colors"
              data-page-module-item="primary-cta"
              data-page-module-field={`label_${lang}`}
            >
              {primaryLabel}
            </Link>
          ) : null}
          {secondaryLabel && secondaryHref ? (
            <Link
              href={secondaryHref}
              {...externalLinkProps(secondaryHref)}
              className="border border-white/25 text-white/80 px-10 py-4 text-sm tracking-wider hover:border-white/60 transition-colors"
              data-page-module-item="secondary-cta"
              data-page-module-field={`label_${lang}`}
            >
              {secondaryLabel}
            </Link>
          ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ProductShowcaseSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  if (!pageModule || !pageModule.is_visible) return null;

  const eyebrow = localizedLabel(findModuleItem(pageModule, 'eyebrow'), lang, '');
  const title = localizedModuleTitle(pageModule, lang, '');
  const description = localizedModuleDescription(pageModule, lang, '');
  const cards = sortModuleItems(pageModule)
    .filter((item) => item.id.startsWith('card-'))
    .map((item) => ({
      id: item.id,
      title: localizedLabel(item, lang, ''),
      meta: localizedValue(item, lang, ''),
      body: localizedContent(item, lang, ''),
      image: item.image_url || '',
      href: displayHref(item.href),
    }))
    .filter((item) => item.title || item.body || item.image);
  const primary = findModuleItem(pageModule, 'primary-cta');
  const secondary = findModuleItem(pageModule, 'secondary-cta');
  const primaryLabel = localizedLabel(primary, lang, '');
  const secondaryLabel = localizedLabel(secondary, lang, '');
  const primaryHref = displayHref(primary?.href);
  const secondaryHref = displayHref(secondary?.href);

  if (!title && !description && cards.length === 0) return null;

  return (
    <section
      className="border-b border-[#E5DED4] bg-[#F5F2ED] py-10 lg:py-12"
      data-page-module={`home:${pageModule.module_key}`}
      data-page-key="home"
      data-module-key={pageModule.module_key}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            {eyebrow ? (
              <p
                className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-[#E36F2C]"
                data-page-module-item="eyebrow"
                data-page-module-field={`label_${lang}`}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                className="font-[family-name:var(--font-heading)] text-3xl font-light leading-tight text-[#241F1B] lg:text-4xl"
                data-page-module-field={`title_${lang}`}
              >
                {title}
              </h2>
            ) : null}
          </div>
          {description ? (
            <p
              className="max-w-2xl text-sm leading-7 text-[#6B625B] lg:ml-auto"
              data-page-module-field={`description_${lang}`}
            >
              {description}
            </p>
          ) : null}
        </div>

        {cards.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const content = (
                <article
                  className="group flex h-full flex-col overflow-hidden border border-[#E5DED4] bg-white shadow-[0_18px_60px_rgba(44,42,40,0.08)]"
                  data-page-module-item={card.id}
                >
                  {card.image ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#E5DED4]">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        loading="lazy"
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        data-page-module-field="image_url"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    {card.meta ? (
                      <p
                        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E36F2C]"
                        data-page-module-field={`value_${lang}`}
                      >
                        {card.meta}
                      </p>
                    ) : null}
                    {card.title ? (
                      <h3
                        className="font-[family-name:var(--font-heading)] text-xl font-medium leading-snug text-[#241F1B]"
                        data-page-module-field={`label_${lang}`}
                      >
                        {card.title}
                      </h3>
                    ) : null}
                    {card.body ? (
                      <p
                        className="mt-3 text-sm leading-6 text-[#6B625B]"
                        data-page-module-field={`content_${lang}`}
                      >
                        {card.body}
                      </p>
                    ) : null}
                  </div>
                </article>
              );

              return card.href ? (
                <Link key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
                  {content}
                </Link>
              ) : (
                <div key={card.id} className="h-full">{content}</div>
              );
            })}
          </div>
        ) : null}

        {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {primaryLabel && primaryHref ? (
              <Link
                href={primaryHref}
                {...externalLinkProps(primaryHref)}
                className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-5 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-[#C85A1F]"
                data-page-module-item="primary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                {...externalLinkProps(secondaryHref)}
                className="inline-flex min-h-11 items-center justify-center border border-[#241F1B]/20 px-5 text-sm font-bold uppercase tracking-[0.12em] text-[#241F1B]/75 hover:border-[#E36F2C] hover:text-[#E36F2C]"
                data-page-module-item="secondary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SalesGridSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  if (!pageModule || !pageModule.is_visible) return null;

  const eyebrow = localizedLabel(findModuleItem(pageModule, 'eyebrow'), lang, '');
  const title = localizedModuleTitle(pageModule, lang, '');
  const description = localizedModuleDescription(pageModule, lang, '');
  const cards = sortModuleItems(pageModule)
    .filter((item) => item.id.startsWith('card-'))
    .map((item) => ({
      id: item.id,
      title: localizedLabel(item, lang, ''),
      meta: localizedValue(item, lang, ''),
      body: localizedContent(item, lang, ''),
      image: item.image_url || '',
      href: displayHref(item.href),
    }))
    .filter((item) => item.title || item.meta || item.body || item.image);
  const primary = findModuleItem(pageModule, 'primary-cta');
  const secondary = findModuleItem(pageModule, 'secondary-cta');
  const primaryLabel = localizedLabel(primary, lang, '');
  const secondaryLabel = localizedLabel(secondary, lang, '');
  const primaryHref = displayHref(primary?.href);
  const secondaryHref = displayHref(secondary?.href);
  const isProductSeries = pageModule.module_type === 'product-series';
  const isModelGrid = pageModule.module_type === 'model-grid';
  const isProjectProof = pageModule.module_type === 'project-proof';

  if (!title && !description && cards.length === 0) return null;

  return (
    <section
      className={`${isProjectProof ? 'bg-[#241F1B] text-white' : 'bg-[#FAF7F2] text-[#241F1B]'} border-b border-[#E5DED4] py-16 lg:py-20`}
      data-page-module={`home:${pageModule.module_key}`}
      data-page-key="home"
      data-module-key={pageModule.module_key}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.1fr] lg:items-end">
          <div>
            {eyebrow ? (
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#E36F2C]"
                data-page-module-item="eyebrow"
                data-page-module-field={`label_${lang}`}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                className={`${isProductSeries ? 'lg:text-6xl' : 'lg:text-5xl'} font-[family-name:var(--font-heading)] text-3xl font-light leading-tight`}
                data-page-module-field={`title_${lang}`}
              >
                {title}
              </h2>
            ) : null}
          </div>
          {description ? (
            <p
              className={`${isProjectProof ? 'text-white/68' : 'text-[#6B625B]'} max-w-2xl text-sm leading-7 lg:ml-auto`}
              data-page-module-field={`description_${lang}`}
            >
              {description}
            </p>
          ) : null}
        </div>

        {cards.length > 0 ? (
          <div className={`${isModelGrid ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} mt-10 grid gap-4 md:grid-cols-2`}>
            {cards.map((card) => {
              const cardContent = (
                <article
                  className={`${isProjectProof ? 'border-white/12 bg-white/[0.06]' : 'border-[#E5DED4] bg-white'} group flex h-full flex-col overflow-hidden border`}
                  data-page-module-item={card.id}
                >
                  {card.image ? (
                    <div className={`${isProductSeries ? 'aspect-[16/9]' : 'aspect-[4/3]'} relative overflow-hidden bg-[#E5DED4]`}>
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        loading="lazy"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes={isModelGrid ? '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw' : '(max-width: 768px) 100vw, 33vw'}
                        data-page-module-field="image_url"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5 lg:p-6">
                    {card.meta ? (
                      <p
                        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E36F2C]"
                        data-page-module-field={`value_${lang}`}
                      >
                        {card.meta}
                      </p>
                    ) : null}
                    {card.title ? (
                      <h3
                        className="font-[family-name:var(--font-heading)] text-xl font-medium leading-snug"
                        data-page-module-field={`label_${lang}`}
                      >
                        {card.title}
                      </h3>
                    ) : null}
                    {card.body ? (
                      <p
                        className={`${isProjectProof ? 'text-white/62' : 'text-[#6B625B]'} mt-3 text-sm leading-6`}
                        data-page-module-field={`content_${lang}`}
                      >
                        {card.body}
                      </p>
                    ) : null}
                  </div>
                </article>
              );

              return card.href ? (
                <Link key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
                  {cardContent}
                </Link>
              ) : (
                <div key={card.id} className="h-full">{cardContent}</div>
              );
            })}
          </div>
        ) : null}

        {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
          <div className="mt-9 flex flex-wrap gap-3">
            {primaryLabel && primaryHref ? (
              <Link
                href={primaryHref}
                {...externalLinkProps(primaryHref)}
                className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-5 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-[#C85A1F]"
                data-page-module-item="primary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                {...externalLinkProps(secondaryHref)}
                className={`${isProjectProof ? 'border-white/24 text-white/78 hover:border-white/60' : 'border-[#241F1B]/20 text-[#241F1B]/75 hover:border-[#E36F2C] hover:text-[#E36F2C]'} inline-flex min-h-11 items-center justify-center border px-5 text-sm font-bold uppercase tracking-[0.12em]`}
                data-page-module-item="secondary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HomepageVisualSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  if (!pageModule || !pageModule.is_visible) return null;

  const eyebrow = localizedLabel(findModuleItem(pageModule, 'eyebrow'), lang, '');
  const title = localizedModuleTitle(pageModule, lang, '');
  const description = localizedModuleDescription(pageModule, lang, '');
  const cards = sortModuleItems(pageModule)
    .filter((item) => item.id.startsWith('card-'))
    .map((item) => ({
      id: item.id,
      title: localizedLabel(item, lang, ''),
      meta: localizedValue(item, lang, ''),
      body: localizedContent(item, lang, ''),
      image: item.image_url || '',
      href: displayHref(item.href),
    }))
    .filter((item) => item.title || item.meta || item.body || item.image);
  const primary = findModuleItem(pageModule, 'primary-cta');
  const secondary = findModuleItem(pageModule, 'secondary-cta');
  const primaryLabel = localizedLabel(primary, lang, '');
  const secondaryLabel = localizedLabel(secondary, lang, '');
  const primaryHref = displayHref(primary?.href);
  const secondaryHref = displayHref(secondary?.href);
  const moduleType = pageModule.module_type ?? '';
  const isLargeProducts = moduleType === 'large-product-cards';
  const isModelStrip = moduleType === 'model-strip';
  const isInnovation = moduleType === 'innovation-story';
  const isFuture = moduleType === 'future-explorer';
  const isDark = isInnovation || isFuture;

  if (!title && !description && cards.length === 0) return null;

  return (
    <section
      className={`${isDark ? 'bg-[#1F1C19] text-white' : 'bg-[#F7F1E9] text-[#241F1B]'} border-b border-[#E5DED4] py-16 lg:py-24`}
      data-page-module={`home:${pageModule.module_key}`}
      data-page-key="home"
      data-module-key={pageModule.module_key}
    >
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10">
        <div className={`${isLargeProducts ? 'lg:grid-cols-[0.58fr_0.42fr]' : 'lg:grid-cols-[0.74fr_0.82fr]'} grid gap-6 lg:items-end`}>
          <div>
            {eyebrow ? (
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#E36F2C]"
                data-page-module-item="eyebrow"
                data-page-module-field={`label_${lang}`}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                className={`${isLargeProducts ? 'lg:text-6xl' : 'lg:text-5xl'} max-w-4xl font-[family-name:var(--font-heading)] text-3xl font-light leading-[1.03] sm:text-4xl`}
                data-page-module-field={`title_${lang}`}
              >
                {title}
              </h2>
            ) : null}
          </div>
          {description ? (
            <p
              className={`${isDark ? 'text-white/68' : 'text-[#6B625B]'} max-w-3xl text-sm leading-7 sm:text-base lg:ml-auto`}
              data-page-module-field={`description_${lang}`}
            >
              {description}
            </p>
          ) : null}
        </div>

        {cards.length > 0 ? (
          <div
            className={`${isLargeProducts ? 'lg:grid-cols-2' : isModelStrip ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} mt-10 grid gap-4 md:grid-cols-2`}
          >
            {cards.map((card, index) => {
              const article = (
                <article
                  className={`${isDark ? 'border-white/12 bg-white/[0.06]' : 'border-[#E5DED4] bg-white'} group flex h-full flex-col overflow-hidden border`}
                  data-page-module-item={card.id}
                >
                  {card.image ? (
                    <div
                      className={`${isLargeProducts ? 'aspect-[16/10] min-h-[280px] lg:min-h-[410px]' : isModelStrip ? 'aspect-[4/3]' : 'aspect-[16/11]'} relative overflow-hidden bg-[#DCD5CC]`}
                    >
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        loading={index === 0 && isLargeProducts ? 'eager' : 'lazy'}
                        className="object-cover transition duration-700 group-hover:scale-[1.035]"
                        sizes={
                          isLargeProducts
                            ? '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 720px'
                            : isModelStrip
                              ? '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw'
                              : '(max-width: 768px) 100vw, 33vw'
                        }
                        data-page-module-field="image_url"
                      />
                    </div>
                  ) : null}
                  <div className={`${isLargeProducts ? 'p-6 lg:p-8' : 'p-5 lg:p-6'} flex flex-1 flex-col`}>
                    {card.meta ? (
                      <p
                        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E36F2C]"
                        data-page-module-field={`value_${lang}`}
                      >
                        {card.meta}
                      </p>
                    ) : null}
                    {card.title ? (
                      <h3
                        className={`${isLargeProducts ? 'text-2xl lg:text-3xl' : 'text-xl'} font-[family-name:var(--font-heading)] font-medium leading-tight`}
                        data-page-module-field={`label_${lang}`}
                      >
                        {card.title}
                      </h3>
                    ) : null}
                    {card.body ? (
                      <p
                        className={`${isDark ? 'text-white/62' : 'text-[#6B625B]'} mt-4 text-sm leading-6`}
                        data-page-module-field={`content_${lang}`}
                      >
                        {card.body}
                      </p>
                    ) : null}
                  </div>
                </article>
              );

              return card.href ? (
                <Link key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
                  {article}
                </Link>
              ) : (
                <div key={card.id} className="h-full">{article}</div>
              );
            })}
          </div>
        ) : null}

        {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {primaryLabel && primaryHref ? (
              <Link
                href={primaryHref}
                {...externalLinkProps(primaryHref)}
                className="inline-flex min-h-12 items-center justify-center bg-[#E36F2C] px-7 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-[#C85A1F]"
                data-page-module-item="primary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                {...externalLinkProps(secondaryHref)}
                className={`${isDark ? 'border-white/24 text-white/78 hover:border-white/60' : 'border-[#241F1B]/20 text-[#241F1B]/75 hover:border-[#E36F2C] hover:text-[#E36F2C]'} inline-flex min-h-12 items-center justify-center border px-7 text-sm font-bold uppercase tracking-[0.12em]`}
                data-page-module-item="secondary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ContactBandSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  if (!pageModule || !pageModule.is_visible) return null;

  const eyebrow = localizedLabel(findModuleItem(pageModule, 'eyebrow'), lang, '');
  const title = localizedModuleTitle(pageModule, lang, '');
  const description = localizedModuleDescription(pageModule, lang, '');
  const primary = findModuleItem(pageModule, 'primary-cta');
  const secondary = findModuleItem(pageModule, 'secondary-cta');
  const primaryLabel = localizedLabel(primary, lang, '');
  const secondaryLabel = localizedLabel(secondary, lang, '');
  const primaryHref = displayHref(primary?.href);
  const secondaryHref = displayHref(secondary?.href);

  if (!title && !description && !(primaryLabel && primaryHref) && !(secondaryLabel && secondaryHref)) return null;

  return (
    <section
      className="border-b border-[#E5DED4] bg-[#E36F2C] py-14 text-white lg:py-16"
      data-page-module={`home:${pageModule.module_key}`}
      data-page-key="home"
      data-module-key={pageModule.module_key}
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div>
          {eyebrow ? (
            <p
              className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-white/72"
              data-page-module-item="eyebrow"
              data-page-module-field={`label_${lang}`}
            >
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2
              className="font-[family-name:var(--font-heading)] text-3xl font-light leading-tight lg:text-5xl"
              data-page-module-field={`title_${lang}`}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p
              className="mt-4 max-w-3xl text-sm leading-7 text-white/78"
              data-page-module-field={`description_${lang}`}
            >
              {description}
            </p>
          ) : null}
        </div>
        {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            {primaryLabel && primaryHref ? (
              <Link
                href={primaryHref}
                {...externalLinkProps(primaryHref)}
                className="inline-flex min-h-12 items-center justify-center bg-white px-6 text-sm font-bold uppercase tracking-[0.12em] text-[#241F1B] hover:bg-[#F5F2ED]"
                data-page-module-item="primary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                {...externalLinkProps(secondaryHref)}
                className="inline-flex min-h-12 items-center justify-center border border-white/45 px-6 text-sm font-bold uppercase tracking-[0.12em] text-white hover:border-white"
                data-page-module-item="secondary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function resolveHomeDynamicModules(pageModules: HomePageModule[] | null) {
  const fixed = resolveDynamicPageModules(pageModules, HOME_MODULE_REGISTRY);
  const fixedModuleKeys = new Set(HOME_MODULE_REGISTRY.map((entry) => entry.moduleKey));
  const templateModules = (pageModules ?? [])
    .filter((pageModule) => (
      !fixedModuleKeys.has(pageModule.module_key) &&
      isTemplateBackedPageModule('home', pageModule.module_type ?? '')
    ))
    .map<ResolvedPageModule<HomePageModule> | null>((pageModule) => {
      const template = getPageModuleTemplateByModuleType(pageModule.module_type ?? '');
      if (!template) return null;

      return {
        registry: {
          rendererKey: template.rendererKey,
          pageKey: 'home',
          moduleKey: pageModule.module_key,
          moduleType: template.moduleType,
          defaultSortOrder: Number(pageModule.sort_order) || 30,
          dynamicEnabled: true,
        },
        pageModule,
        sortOrder: Number(pageModule.sort_order) || 30,
      };
    })
    .filter((resolved): resolved is ResolvedPageModule<HomePageModule> => Boolean(resolved));

  return [...fixed, ...templateModules].sort((a, b) => (
    a.sortOrder - b.sortOrder || a.registry.moduleKey.localeCompare(b.registry.moduleKey)
  ));
}

function renderHomeDynamicModule(resolved: ResolvedPageModule<HomePageModule>) {
  if (!isResolvedPageModuleVisible(resolved)) return null;

  switch (resolved.registry.rendererKey) {
    case 'home.hero':
      return <HeroSection key={resolved.registry.rendererKey} pageModule={resolved.pageModule} />;
    case 'home.credentials':
      return <CredentialsBar key={resolved.registry.rendererKey} pageModule={resolved.pageModule} />;
    case 'home.operatingProof':
      return <BackendOperatingProofSection key={resolved.registry.rendererKey} pageModule={resolved.pageModule} />;
    case 'home.simpleText':
      return <SimpleTextSection key={resolved.pageModule?.module_key ?? resolved.registry.moduleKey} pageModule={resolved.pageModule} />;
    case 'home.ctaSection':
      return <CtaModuleSection key={resolved.pageModule?.module_key ?? resolved.registry.moduleKey} pageModule={resolved.pageModule} />;
    case 'home.productShowcase':
      return <ProductShowcaseSection key={resolved.pageModule?.module_key ?? resolved.registry.moduleKey} pageModule={resolved.pageModule} />;
    case 'home.salesGrid':
      return <SalesGridSection key={resolved.pageModule?.module_key ?? resolved.registry.moduleKey} pageModule={resolved.pageModule} />;
    case 'home.visualSales':
      return <HomepageVisualSection key={resolved.pageModule?.module_key ?? resolved.registry.moduleKey} pageModule={resolved.pageModule} />;
    case 'home.contactBand':
      return <ContactBandSection key={resolved.pageModule?.module_key ?? resolved.registry.moduleKey} pageModule={resolved.pageModule} />;
    default:
      return null;
  }
}

function BackendOperatingProofSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  if (!pageModule || !pageModule.is_visible) return null;

  const eyebrow = localizedLabel(findModuleItem(pageModule, 'eyebrow'), lang, '');
  const intro = findModuleItem(pageModule, 'intro');
  const title = localizedLabel(intro, lang, localizedModuleTitle(pageModule, lang, ''));
  const description = localizedContent(intro, lang, localizedModuleDescription(pageModule, lang, ''));
  const cards = sortModuleItems(pageModule)
    .filter((item) => item.id.startsWith('card-'))
    .map((item) => ({
      id: item.id,
      title: localizedLabel(item, lang, ''),
      body: localizedContent(item, lang, ''),
    }))
    .filter((item) => item.title || item.body);
  const images = sortModuleItems(pageModule)
    .filter((item) => item.id.startsWith('image-') && item.image_url)
    .slice(0, 3);
  const primary = findModuleItem(pageModule, 'primary-cta');
  const secondary = findModuleItem(pageModule, 'secondary-cta');
  const primaryLabel = localizedLabel(primary, lang, '');
  const secondaryLabel = localizedLabel(secondary, lang, '');
  const primaryHref = displayHref(primary?.href);
  const secondaryHref = displayHref(secondary?.href);

  if (!title && !description && cards.length === 0 && images.length === 0) return null;

  return (
    <section
      className="border-b border-[#E5DED4] bg-white py-16"
      data-page-module="home:operating-proof"
      data-page-key="home"
      data-module-key="operating-proof"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-end">
          <div>
            {eyebrow ? (
              <p
                className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-[#E36F2C]"
                data-page-module-item="eyebrow"
                data-page-module-field={`label_${lang}`}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                className="font-[family-name:var(--font-heading)] text-3xl font-light leading-tight text-[#241F1B] lg:text-4xl"
                data-page-module-item="intro"
                data-page-module-field={`label_${lang}`}
              >
                {title}
              </h2>
            ) : null}
          </div>
          {description ? (
            <p
              className="max-w-2xl text-sm leading-7 text-[#6B625B] lg:ml-auto"
              data-page-module-item="intro"
              data-page-module-field={`content_${lang}`}
            >
              {description}
            </p>
          ) : null}
        </div>

        {cards.length > 0 ? (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {cards.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-[#E5DED4] bg-[#FAF7F2] p-6"
                data-page-module-item={item.id}
              >
                {item.title ? (
                  <h3
                    className="font-[family-name:var(--font-heading)] text-xl font-medium text-[#241F1B]"
                    data-page-module-field={`label_${lang}`}
                  >
                    {item.title}
                  </h3>
                ) : null}
                {item.body ? (
                  <p
                    className="mt-3 text-sm leading-6 text-[#6B625B]"
                    data-page-module-field={`content_${lang}`}
                  >
                    {item.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {images.length > 0 ? (
          <div className="mt-8 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="relative min-h-[180px] overflow-hidden border border-[#E5DED4] bg-[#E5DED4] md:first:min-h-[260px]"
                data-page-module-item={item.id}
              >
                <Image
                  src={item.image_url as string}
                  alt={localizedLabel(item, lang, '')}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes={index === 0 ? '(max-width: 768px) 100vw, 48vw' : '(max-width: 768px) 100vw, 26vw'}
                  data-page-module-field="image_url"
                />
                {localizedLabel(item, lang, '') ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#241F1B]/75 to-transparent p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
                      {localizedLabel(item, lang, '')}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {primaryLabel && primaryHref ? (
              <Link
                href={primaryHref}
                {...externalLinkProps(primaryHref)}
                className="inline-flex min-h-10 items-center justify-center bg-[#E36F2C] px-4 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#C85A1F]"
                data-page-module-item="primary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                {...externalLinkProps(secondaryHref)}
                className="inline-flex min-h-10 items-center justify-center border border-[#241F1B]/20 px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#241F1B]/75 hover:border-[#E36F2C] hover:text-[#E36F2C]"
                data-page-module-item="secondary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── Core Tech Systems ───────────────────────────────────

export default function HomePageContent({
  initialModules = null,
}: {
  initialModules?: HomePageModule[] | null;
}) {
  const pageModules = useHomePageModules(initialModules);
  const dynamicModules = useMemo(
    () => resolveHomeDynamicModules(pageModules),
    [pageModules],
  );

  return (
    <main>
      <Navbar />
      {dynamicModules.map(renderHomeDynamicModule)}
      <Footer />
    </main>
  );
}
