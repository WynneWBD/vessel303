'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Pause, Play } from 'lucide-react';
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
  const [isPaused, setIsPaused] = useState(false);
  const items = useMemo(() => sortModuleItems(pageModule), [pageModule]);
  const heroSlides = useMemo(() => {
    return items
      .filter((item) => typeof item.id === 'string' && item.id.startsWith('hero-image') && item.is_visible && item.image_url)
      .map((item) => ({
        id: item.id,
        src: optimizedHeroImageUrl(item.image_url as string),
        eyebrow: localizedValue(item, lang, ''),
        headline: localizedLabel(item, lang, ''),
        subtitle: localizedContent(item, lang, ''),
        href: displayHref(item.href),
      }));
  }, [items, lang]);
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
  const visibleProofItems = proofItems.slice(0, 4);
  const activeImage = heroSlides.length > 0 ? current % heroSlides.length : 0;
  const activeSlide = heroSlides[activeImage] ?? null;
  const activeTagline = activeSlide?.eyebrow || tagline;
  const activeHeadline = activeSlide?.headline || headline;
  const activeSubtitle = activeSlide?.subtitle || subtitle;
  const activePrimaryHref = activeSlide?.href || primaryHref;
  const activeTaglineItem = activeSlide?.eyebrow ? activeSlide.id : 'hero-tagline';
  const activeTaglineField = activeSlide?.eyebrow ? `value_${lang}` : `label_${lang}`;
  const activeHeadlineItem = activeSlide?.headline ? activeSlide.id : 'hero-headline';
  const activeSubtitleItem = activeSlide?.subtitle ? activeSlide.id : 'hero-subtitle';
  const nextSlide = heroSlides.length > 1 ? heroSlides[(activeImage + 1) % heroSlides.length] : null;
  const nextLabel = lang === 'zh' ? '下一张' : 'Next';
  const pauseLabel = lang === 'zh' ? '暂停' : 'Pause';
  const playLabel = lang === 'zh' ? '播放' : 'Play';
  const visibleHeroImages = useMemo(() => {
    if (heroSlides.length === 0) return [];
    const nextImage = (activeImage + 1) % heroSlides.length;
    return Array.from(new Set([activeImage, nextImage])).map((index) => ({
      index,
      slide: heroSlides[index],
      active: index === activeImage,
    }));
  }, [activeImage, heroSlides]);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length, isPaused]);

  if (!pageModule || !pageModule.is_visible || heroSlides.length === 0 || !activeHeadline) return null;

  return (
    <section
      className="relative flex min-h-[600px] items-center overflow-hidden bg-[#241F1B] sm:min-h-[720px] lg:min-h-[760px] xl:min-h-[calc(100svh-24px)]"
      data-page-module="home:hero"
      data-page-key="home"
      data-module-key="hero"
    >
      {/* Carousel images */}
      {visibleHeroImages.map(({ slide, index, active }) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt=""
          fill
          priority={active && index === 0}
          sizes="100vw"
          quality={75}
          className={`object-cover transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}
          data-page-module-item={slide.id}
          data-page-module-field="image_url"
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#191512]/74 via-[#191512]/30 to-[#191512]/8" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#191512]/78 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1540px] flex-col gap-8 px-5 py-16 text-center sm:gap-10 sm:px-6 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {activeTagline ? (
            <div className="mb-6">
              <p
                className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70"
                data-page-module-item={activeTaglineItem}
                data-page-module-field={activeTaglineField}
              >
                {activeTagline}
              </p>
              <div className="mx-auto mt-4 h-px w-16 bg-[#E36F2C]" />
            </div>
          ) : null}

          <h1
            className="mx-auto mb-6 max-w-[22rem] break-words font-[family-name:var(--font-heading)] text-3xl font-normal leading-[1.05] text-white sm:max-w-5xl sm:text-6xl sm:leading-[0.98] lg:text-7xl xl:text-8xl"
            style={{ overflowWrap: 'anywhere', textShadow: '0 18px 50px rgba(0,0,0,0.46)' }}
            data-page-module-item={activeHeadlineItem}
            data-page-module-field={`label_${lang}`}
          >
            {activeHeadline}
          </h1>

          {activeSubtitle ? (
            <p
              className="mx-auto mb-8 max-w-[22rem] text-base leading-8 text-white/78 sm:max-w-2xl sm:text-lg"
              style={{ overflowWrap: 'anywhere', textShadow: '0 12px 36px rgba(0,0,0,0.42)' }}
              data-page-module-item={activeSubtitleItem}
              data-page-module-field={activeSlide?.subtitle ? `content_${lang}` : `label_${lang}`}
            >
              {activeSubtitle}
            </p>
          ) : null}

          {((primaryLabel && activePrimaryHref) || (secondaryLabel && secondaryHref)) ? (
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
              {primaryLabel && activePrimaryHref ? (
                <Link
                  href={activePrimaryHref}
                  {...externalLinkProps(activePrimaryHref)}
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
                  className="inline-flex min-h-12 items-center justify-center border px-8 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white/70"
                  style={{ borderColor: 'rgba(255,255,255,0.35)' }}
                  data-page-module-item="hero-secondary-cta"
                  data-page-module-field={`label_${lang}`}
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-auto grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:gap-6">
          {visibleProofItems.length > 0 ? (
            <div className="flex max-w-full flex-wrap items-center gap-x-5 gap-y-2 border-l border-white/24 bg-[#191512]/34 px-4 py-3 text-left backdrop-blur-sm sm:max-w-3xl lg:max-w-[760px] lg:justify-self-start">
              {visibleProofItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`${index === 3 ? 'hidden xl:flex' : 'flex'} min-w-0 items-baseline gap-2`}
                  data-page-module-item={item.id}
                >
                  {item.value ? (
                    <p
                      className="font-[family-name:var(--font-heading)] text-lg font-light leading-none text-white sm:text-xl"
                      data-page-module-field={`value_${lang}`}
                    >
                      {item.value}
                    </p>
                  ) : null}
                  {item.label ? (
                    <p
                      className="max-w-[10rem] truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F2A36E]"
                      style={{ color: '#F2A36E' }}
                      data-page-module-field={`label_${lang}`}
                    >
                      {item.label}
                    </p>
                  ) : null}
                  {item.body ? (
                    <span className="sr-only" data-page-module-field={`content_${lang}`}>
                      {item.body}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {heroSlides.length > 1 ? (
            <div className="flex flex-col gap-3 sm:items-end">
              {nextSlide ? (
                <button
                  type="button"
                  onClick={() => setCurrent((prev) => (prev + 1) % heroSlides.length)}
                  className="group hidden min-w-0 overflow-hidden border border-white/18 bg-[#191512]/48 text-left text-white/80 backdrop-blur-sm transition hover:border-white/40 hover:bg-[#191512]/66 sm:block sm:w-72"
                >
                  <span className="relative block h-24 bg-white/10">
                    <Image
                      src={nextSlide.src}
                      alt=""
                      fill
                      loading="lazy"
                      className="object-cover opacity-90 transition duration-700 group-hover:scale-[1.04]"
                      sizes="18rem"
                    />
                  </span>
                  <span className="block p-3">
                  {nextSlide.eyebrow ? (
                    <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F2A36E]">
                      {nextSlide.eyebrow}
                    </span>
                  ) : null}
                  {nextSlide.headline ? (
                    <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-5 text-white/76 transition group-hover:text-white">
                      {nextSlide.headline}
                    </span>
                  ) : null}
                  </span>
                </button>
              ) : null}
              <div className="hidden w-full items-center justify-end gap-2 sm:flex sm:w-72">
                <button
                  type="button"
                  onClick={() => setCurrent((prev) => (prev + 1) % heroSlides.length)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-white/18 bg-[#191512]/48 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white/82 backdrop-blur-sm transition hover:border-white/42 hover:bg-[#191512]/66 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#E36F2C]/70 focus:ring-offset-2 focus:ring-offset-[#191512]"
                >
                  <span>{nextLabel}</span>
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaused((value) => !value)}
                  aria-pressed={isPaused}
                  className="inline-flex min-h-11 w-12 items-center justify-center border border-white/18 bg-[#191512]/48 text-white/82 backdrop-blur-sm transition hover:border-white/42 hover:bg-[#191512]/66 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#E36F2C]/70 focus:ring-offset-2 focus:ring-offset-[#191512]"
                >
                  {isPaused ? (
                    <Play aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Pause aria-hidden="true" className="h-4 w-4" />
                  )}
                  <span className="sr-only">{isPaused ? playLabel : pauseLabel}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-current={index === activeImage ? 'true' : undefined}
                    className={`h-1.5 w-8 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E36F2C]/70 focus:ring-offset-2 focus:ring-offset-[#191512] ${index === activeImage ? 'bg-[#E36F2C]' : 'bg-white/32 hover:bg-white/58'}`}
                  >
                    <span className="sr-only">{slide.headline || slide.eyebrow || String(index + 1)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
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
      className="relative z-20 border-y border-white/10 bg-[#14100E]"
      data-page-module="home:credentials"
      data-page-key="home"
      data-module-key="credentials"
    >
      <div className="mx-auto max-w-[1540px] px-5 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 border-x border-white/10 sm:grid-cols-4">
          {stats.map((s, index) => (
            <div
              key={s.id}
              className={`min-w-0 border-white/10 px-4 py-4 text-center sm:px-5 sm:py-5 ${
                index % 2 === 0 ? 'border-r' : ''
              } ${index < 2 ? 'border-b sm:border-b-0' : ''} sm:border-r sm:last:border-r-0`}
              data-page-module-item={s.id}
            >
              <div
                className="mb-2 font-[family-name:var(--font-heading)] text-3xl font-light tracking-tight text-[#F2A36E] sm:text-4xl"
                style={{ fontFamily: 'var(--font-heading)', fontFeatureSettings: '"tnum"' }}
                data-page-module-field={`value_${lang}`}
              >
                {s.val}
              </div>
              <div
                className="mx-auto max-w-[12rem] truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/52 sm:text-xs"
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
  const featuredCard = cards[0];
  const secondaryCards = cards.slice(1);

  if (!title && !description && cards.length === 0) return null;

  if (isLargeProducts) {
      const featuredArticle = featuredCard ? (
        <article
          className="group relative flex min-h-[620px] flex-col justify-between overflow-hidden bg-[#241F1B] p-6 text-white sm:min-h-[680px] sm:p-8 lg:min-h-[720px] lg:p-10"
          data-page-module-item={featuredCard.id}
        >
          {featuredCard.image ? (
            <Image
              src={featuredCard.image}
              alt={featuredCard.title || title}
              fill
              loading="eager"
              className="object-cover transition duration-700 group-hover:scale-[1.025]"
              sizes="100vw"
              data-page-module-field="image_url"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#11100E]/94 via-[#11100E]/34 to-[#11100E]/52" />
          <div className="relative max-w-4xl">
            {eyebrow ? (
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#F2A36E]"
                data-page-module-item="eyebrow"
                data-page-module-field={`label_${lang}`}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                className="font-[family-name:var(--font-heading)] text-3xl font-light leading-[1.02] sm:text-5xl lg:text-6xl"
                data-page-module-field={`title_${lang}`}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base"
                data-page-module-field={`description_${lang}`}
              >
                {description}
              </p>
            ) : null}
          </div>
          <div className="relative mt-12 max-w-3xl">
            {featuredCard.meta ? (
              <p
                className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2A36E]"
                data-page-module-field={`value_${lang}`}
              >
                {featuredCard.meta}
              </p>
            ) : null}
            {featuredCard.title ? (
              <h3
                className="font-[family-name:var(--font-heading)] text-4xl font-light leading-tight sm:text-5xl lg:text-7xl"
                data-page-module-field={`label_${lang}`}
              >
                {featuredCard.title}
              </h3>
            ) : null}
            {featuredCard.body ? (
              <p
                className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base"
                data-page-module-field={`content_${lang}`}
              >
                {featuredCard.body}
              </p>
            ) : null}
          </div>
        </article>
      ) : null;

      return (
        <section
          className="border-b border-[#E5DED4] bg-[#15120F] py-6 text-white lg:py-8"
          style={{ backgroundColor: '#15120F', color: '#FFFFFF' }}
          data-page-module={`home:${pageModule.module_key}`}
          data-page-key="home"
          data-module-key={pageModule.module_key}
        >
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            {featuredArticle ? (
              featuredCard?.href ? (
                <Link href={featuredCard.href} {...externalLinkProps(featuredCard.href)} className="block">
                  {featuredArticle}
                </Link>
              ) : featuredArticle
            ) : (
              <div className="grid gap-4 lg:grid-cols-[0.58fr_0.72fr] lg:items-end">
                <div>
                  {eyebrow ? (
                    <p
                      className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#E36F2C]"
                      data-page-module-item="eyebrow"
                      data-page-module-field={`label_${lang}`}
                    >
                      {eyebrow}
                    </p>
                  ) : null}
                  {title ? (
                    <h2
                      className="max-w-4xl font-[family-name:var(--font-heading)] text-3xl font-light leading-[1.02] sm:text-4xl lg:text-5xl"
                      data-page-module-field={`title_${lang}`}
                    >
                      {title}
                    </h2>
                  ) : null}
                </div>
                {description ? (
                  <p
                    className="max-w-3xl text-sm leading-7 text-white/68 sm:text-base lg:ml-auto"
                    data-page-module-field={`description_${lang}`}
                  >
                    {description}
                  </p>
                ) : null}
              </div>
            )}

            {secondaryCards.length > 0 ? (
              <div className={`${secondaryCards.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'} mt-3 grid gap-3`}>
                {secondaryCards.map((card, index) => {
                  const secondaryArticle = (
                    <article
                      className="group relative flex min-h-[380px] overflow-hidden bg-[#241F1B] text-white sm:min-h-[460px] lg:min-h-[520px]"
                      data-page-module-item={card.id}
                    >
                      {card.image ? (
                        <Image
                          src={card.image}
                          alt={card.title || title}
                          fill
                          loading="lazy"
                          className="object-cover transition duration-700 group-hover:scale-[1.03]"
                          sizes={
                            secondaryCards.length > 1
                              ? '(max-width: 768px) 100vw, 50vw'
                              : '100vw'
                          }
                          data-page-module-field="image_url"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#11100E]/94 via-[#11100E]/30 to-transparent" />
                      <div className="relative mt-auto w-full p-6 sm:p-8">
                        {card.meta ? (
                          <p
                            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F2A36E]"
                            data-page-module-field={`value_${lang}`}
                          >
                            {card.meta}
                          </p>
                        ) : null}
                        {card.title ? (
                          <h3
                            className="max-w-3xl font-[family-name:var(--font-heading)] text-3xl font-light leading-tight sm:text-4xl"
                            data-page-module-field={`label_${lang}`}
                          >
                            {card.title}
                          </h3>
                        ) : null}
                        {card.body ? (
                          <p
                            className="mt-4 max-w-2xl text-sm leading-6 text-white/70"
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
                      {secondaryArticle}
                    </Link>
                  ) : (
                    <div key={`${card.id}-${index}`} className="h-full">{secondaryArticle}</div>
                  );
                })}
              </div>
            ) : null}

            {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                    className="inline-flex min-h-12 items-center justify-center border border-white/24 px-7 text-sm font-bold uppercase tracking-[0.12em] text-white/78 hover:border-white/60"
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

  if (isModelStrip) {
    const modelLeadArticle = featuredCard ? (
      <article
        className="group relative flex overflow-hidden bg-[#14110F] text-white"
        style={{ minHeight: 'clamp(440px, 52vw, 660px)' }}
        data-page-module-item={featuredCard.id}
      >
        {featuredCard.image ? (
          <Image
            src={featuredCard.image}
            alt={featuredCard.title || title}
            fill
            loading="lazy"
            className="object-cover transition duration-700 group-hover:scale-[1.025]"
            sizes="(max-width: 1024px) 100vw, 70vw"
            data-page-module-field="image_url"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(13, 12, 11, 0.9) 0%, rgba(13, 12, 11, 0.48) 42%, rgba(13, 12, 11, 0.08) 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{
            background: 'linear-gradient(0deg, rgba(13, 12, 11, 0.94) 0%, rgba(13, 12, 11, 0.62) 42%, rgba(13, 12, 11, 0) 100%)',
          }}
        />
        <div className="relative mt-auto max-w-3xl p-6 sm:p-8 lg:p-10">
          {featuredCard.meta ? (
            <p
              className="mb-4 text-xs font-semibold text-[#F2A36E]"
              data-page-module-field={`value_${lang}`}
            >
              {featuredCard.meta}
            </p>
          ) : null}
          {featuredCard.title ? (
            <h3
              className="font-[family-name:var(--font-heading)] text-4xl font-light leading-tight sm:text-5xl lg:text-7xl"
              data-page-module-field={`label_${lang}`}
            >
              {featuredCard.title}
            </h3>
          ) : null}
          {featuredCard.body ? (
            <p
              className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base"
              data-page-module-field={`content_${lang}`}
            >
              {featuredCard.body}
            </p>
          ) : null}
        </div>
      </article>
    ) : null;
    const modelRailCards = featuredCard ? secondaryCards : cards;

    return (
      <section
        className="border-b border-[#2D2925] bg-[#0F0E0C] py-6 text-white lg:py-8"
        style={{ backgroundColor: '#0F0E0C', color: '#FFFFFF' }}
        data-page-module={`home:${pageModule.module_key}`}
        data-page-key="home"
        data-module-key={pageModule.module_key}
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {modelLeadArticle ? (
              featuredCard?.href ? (
                <Link href={featuredCard.href} {...externalLinkProps(featuredCard.href)} className="block h-full lg:col-span-2">
                  {modelLeadArticle}
                </Link>
              ) : (
                <div className="lg:col-span-2">{modelLeadArticle}</div>
              )
            ) : null}

            <aside className={`${modelLeadArticle ? '' : 'lg:col-span-3'} flex min-h-full flex-col border border-white/12 bg-[#171410]`}>
              <div className="border-b border-white/12 p-5 sm:p-6">
                {eyebrow ? (
                  <p
                    className="mb-3 text-xs font-semibold text-[#F2A36E]"
                    data-page-module-item="eyebrow"
                    data-page-module-field={`label_${lang}`}
                  >
                    {eyebrow}
                  </p>
                ) : null}
                {title ? (
                  <h2
                    className="font-[family-name:var(--font-heading)] text-3xl font-light leading-[1.05] sm:text-4xl"
                    data-page-module-field={`title_${lang}`}
                  >
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p
                    className="mt-4 text-sm leading-7 text-white/66"
                    data-page-module-field={`description_${lang}`}
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              {modelRailCards.length > 0 ? (
                <div className="grid gap-px bg-white/10">
                  {modelRailCards.map((card, index) => {
                    const modelTile = (
                      <article
                        className="group flex bg-[#1D1915] text-white"
                        style={{ minHeight: 150 }}
                        data-page-module-item={card.id}
                      >
                        <div className="relative w-28 shrink-0 overflow-hidden bg-[#241F1B] sm:w-36 lg:w-32" style={{ minHeight: 150 }}>
                          {card.image ? (
                            <Image
                              src={card.image}
                              alt={card.title || title}
                              fill
                              loading="lazy"
                              className="object-cover transition duration-700 group-hover:scale-[1.035]"
                              sizes="160px"
                              data-page-module-field="image_url"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-[#11100E]/18" />
                        </div>
                        <div className="flex min-w-0 flex-col justify-between p-4">
                          <div>
                            {card.meta ? (
                              <p
                                className="text-[11px] font-semibold text-[#F2A36E]"
                                data-page-module-field={`value_${lang}`}
                              >
                                {card.meta}
                              </p>
                            ) : null}
                            {card.title ? (
                              <h3
                                className="mt-2 break-words font-[family-name:var(--font-heading)] text-2xl font-light leading-tight"
                                data-page-module-field={`label_${lang}`}
                              >
                                {card.title}
                              </h3>
                            ) : null}
                            {card.body ? (
                              <p
                                className="mt-3 line-clamp-2 text-sm leading-6 text-white/62"
                                data-page-module-field={`content_${lang}`}
                              >
                                {card.body}
                              </p>
                            ) : null}
                          </div>
                          <ChevronRight className="mt-3 h-5 w-5 text-[#F2A36E]" aria-hidden="true" />
                        </div>
                      </article>
                    );

                    return card.href ? (
                      <Link key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block">
                        {modelTile}
                      </Link>
                    ) : (
                      <div key={`${card.id}-${index}`}>{modelTile}</div>
                    );
                  })}
                </div>
              ) : null}

              {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
                <div className="mt-auto flex flex-col gap-3 border-t border-white/12 p-5 sm:flex-row sm:flex-wrap sm:p-6 lg:flex-col">
                  {primaryLabel && primaryHref ? (
                    <Link
                      href={primaryHref}
                      {...externalLinkProps(primaryHref)}
                      className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-5 text-sm font-bold text-white hover:bg-[#C85A1F]"
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
                      className="inline-flex min-h-11 items-center justify-center border border-white/24 px-5 text-sm font-bold text-white/78 hover:border-white/60 hover:text-white"
                      data-page-module-item="secondary-cta"
                      data-page-module-field={`label_${lang}`}
                    >
                      {secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    );
  }

  if (isInnovation) {
    return (
      <section
        className="border-b border-[#E5DED4] bg-white py-12 text-[#241F1B] lg:py-14"
        style={{ backgroundColor: '#FFFFFF', color: '#241F1B' }}
        data-page-module={`home:${pageModule.module_key}`}
        data-page-key="home"
        data-module-key={pageModule.module_key}
      >
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            {eyebrow ? (
              <p
                className="mb-3 text-xs font-semibold text-[#E36F2C]"
                data-page-module-item="eyebrow"
                data-page-module-field={`label_${lang}`}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                className="font-[family-name:var(--font-heading)] text-3xl font-light leading-[1.05] sm:text-4xl lg:text-5xl"
                data-page-module-field={`title_${lang}`}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#6B625B] sm:text-base"
                data-page-module-field={`description_${lang}`}
              >
                {description}
              </p>
            ) : null}
          </div>

          {cards.length > 0 ? (
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {cards.map((card, index) => {
                const innovationCard = (
                  <article
                    className="group relative flex overflow-hidden bg-[#DCD5CC] text-white"
                    style={{ minHeight: 'clamp(280px, 30vw, 390px)' }}
                    data-page-module-item={card.id}
                  >
                    {card.image ? (
                      <Image
                        src={card.image}
                        alt={card.title || title}
                        fill
                        loading="lazy"
                        className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        data-page-module-field="image_url"
                      />
                    ) : null}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, rgba(16, 14, 12, 0.58) 0%, rgba(16, 14, 12, 0.12) 58%, rgba(16, 14, 12, 0.34) 100%)',
                      }}
                    />
                    <div className="relative flex w-full flex-col items-center px-5 pt-16 text-center">
                      {card.meta ? (
                        <p
                          className="mb-3 text-[11px] font-semibold text-white/78"
                          data-page-module-field={`value_${lang}`}
                        >
                          {card.meta}
                        </p>
                      ) : null}
                      {card.title ? (
                        <h3
                          className="max-w-sm font-[family-name:var(--font-heading)] text-2xl font-semibold leading-tight sm:text-3xl"
                          data-page-module-field={`label_${lang}`}
                        >
                          {card.title}
                        </h3>
                      ) : null}
                      {card.body ? (
                        <p className="sr-only" data-page-module-field={`content_${lang}`}>
                          {card.body}
                        </p>
                      ) : null}
                      {card.href ? (
                        <ChevronRight className="mt-4 h-5 w-5 text-white/82 transition group-hover:translate-x-1" aria-hidden="true" />
                      ) : null}
                    </div>
                  </article>
                );

                return card.href ? (
                  <Link key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
                    {innovationCard}
                  </Link>
                ) : (
                  <div key={`${card.id}-${index}`} className="h-full">
                    {innovationCard}
                  </div>
                );
              })}
            </div>
          ) : null}

          {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              {primaryLabel && primaryHref ? (
                <Link
                  href={primaryHref}
                  {...externalLinkProps(primaryHref)}
                  className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-5 text-sm font-bold text-white hover:bg-[#C85A1F]"
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
                  className="inline-flex min-h-11 items-center justify-center border border-[#241F1B]/20 px-5 text-sm font-bold text-[#241F1B]/75 hover:border-[#E36F2C] hover:text-[#E36F2C]"
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

  if (isFuture) {
    const futureLead = featuredCard;
    const futureCards = cards;

    return (
      <section
        className="border-b border-[#2D2925] bg-[#171410] py-6 text-white lg:py-8"
        style={{ backgroundColor: '#171410', color: '#FFFFFF' }}
        data-page-module={`home:${pageModule.module_key}`}
        data-page-key="home"
        data-module-key={pageModule.module_key}
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden bg-[#201B16]"
            style={{ minHeight: 'clamp(540px, 52vw, 660px)' }}
          >
            {futureLead?.image ? (
              <Image
                src={futureLead.image}
                alt={futureLead.title || title}
                fill
                loading="lazy"
                className="object-cover"
                sizes="100vw"
                data-page-module-item={futureLead.id}
                data-page-module-field="image_url"
              />
            ) : null}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, rgba(18, 16, 14, 0.92) 0%, rgba(18, 16, 14, 0.62) 42%, rgba(18, 16, 14, 0.24) 100%)',
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{
                background: 'linear-gradient(0deg, rgba(18, 16, 14, 0.96) 0%, rgba(18, 16, 14, 0.34) 64%, rgba(18, 16, 14, 0) 100%)',
              }}
            />

            <div className="relative grid min-h-[inherit] gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-h-[inherit] flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div className="max-w-4xl">
                  {eyebrow ? (
                    <p
                      className="mb-4 text-xs font-semibold text-[#F2A36E]"
                      data-page-module-item="eyebrow"
                      data-page-module-field={`label_${lang}`}
                    >
                      {eyebrow}
                    </p>
                  ) : null}
                  {title ? (
                    <h2
                      className="font-[family-name:var(--font-heading)] text-3xl font-light leading-[1.02] sm:text-5xl lg:text-6xl"
                      data-page-module-field={`title_${lang}`}
                    >
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p
                      className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base"
                      data-page-module-field={`description_${lang}`}
                    >
                      {description}
                    </p>
                  ) : null}
                </div>

                {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {primaryLabel && primaryHref ? (
                      <Link
                        href={primaryHref}
                        {...externalLinkProps(primaryHref)}
                        className="inline-flex min-h-11 items-center justify-center bg-[#E36F2C] px-5 text-sm font-bold text-white hover:bg-[#C85A1F]"
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
                        className="inline-flex min-h-11 items-center justify-center border border-white/24 px-5 text-sm font-bold text-white/78 hover:border-white/60 hover:text-white"
                        data-page-module-item="secondary-cta"
                        data-page-module-field={`label_${lang}`}
                      >
                        {secondaryLabel}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {futureCards.length > 0 ? (
                <aside className="border-t border-white/14 bg-[#11100E]/86 p-4 backdrop-blur-sm lg:border-l lg:border-t-0">
                  <div className="grid gap-3 lg:p-5">
                    {futureCards.map((card, index) => {
                      const futureTile = (
                        <article
                          className="group grid overflow-hidden border border-white/12 bg-white/[0.06] text-white sm:grid-cols-[132px_minmax(0,1fr)] lg:grid-cols-[116px_minmax(0,1fr)]"
                          data-page-module-item={card.id}
                        >
                          {card.image ? (
                            <div className="relative min-h-[112px] overflow-hidden bg-[#241F1B]">
                              <Image
                                src={card.image}
                                alt={card.title || title}
                                fill
                                loading="lazy"
                                className="object-cover transition duration-700 group-hover:scale-[1.035]"
                                sizes="132px"
                                data-page-module-field="image_url"
                              />
                              <div className="absolute inset-0 bg-[#11100E]/18" />
                            </div>
                          ) : null}
                          <div className="flex min-w-0 flex-col justify-between p-4 lg:p-3">
                            <div>
                              {card.meta ? (
                                <p
                                  className="text-[11px] font-semibold text-[#F2A36E]"
                                  data-page-module-field={`value_${lang}`}
                                >
                                  {card.meta}
                                </p>
                              ) : null}
                              {card.title ? (
                                <h3
                                  className="mt-2 font-[family-name:var(--font-heading)] text-lg font-light leading-tight"
                                  data-page-module-field={`label_${lang}`}
                                >
                                  {card.title}
                                </h3>
                              ) : null}
                              {card.body ? (
                                <p
                                  className="mt-2 line-clamp-1 text-sm leading-6 text-white/62"
                                  data-page-module-field={`content_${lang}`}
                                >
                                  {card.body}
                                </p>
                              ) : null}
                            </div>
                            <ChevronRight className="mt-3 h-5 w-5 text-[#F2A36E] transition group-hover:translate-x-1" aria-hidden="true" />
                          </div>
                        </article>
                      );

                      return card.href ? (
                        <Link key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block">
                          {futureTile}
                        </Link>
                      ) : (
                        <div key={`${card.id}-${index}`}>{futureTile}</div>
                      );
                    })}
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${isDark ? 'bg-[#1F1C19] text-white' : 'bg-[#F7F1E9] text-[#241F1B]'} border-b border-[#E5DED4] py-14 lg:py-20`}
      style={{ backgroundColor: isDark ? '#1F1C19' : '#F7F1E9', color: isDark ? '#FFFFFF' : '#241F1B' }}
      data-page-module={`home:${pageModule.module_key}`}
      data-page-key="home"
      data-module-key={pageModule.module_key}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.78fr_0.92fr] lg:items-end">
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
                className="max-w-5xl font-[family-name:var(--font-heading)] text-3xl font-light leading-[1.03] sm:text-4xl lg:text-6xl"
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

        {featuredCard ? (
          <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            {(() => {
              const featuredArticle = (
                <article
                  className="group relative flex min-h-[460px] overflow-hidden bg-[#241F1B] lg:min-h-[660px]"
                  data-page-module-item={featuredCard.id}
                >
                  {featuredCard.image ? (
                    <Image
                      src={featuredCard.image}
                      alt={featuredCard.title}
                      fill
                      loading="lazy"
                      className="object-cover transition duration-700 group-hover:scale-[1.035]"
                      sizes="(max-width: 1024px) 100vw, 62vw"
                      data-page-module-field="image_url"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#11100E]/94 via-[#11100E]/34 to-transparent" />
                  <div className="relative mt-auto max-w-3xl p-6 text-white sm:p-8 lg:p-10">
                    {featuredCard.meta ? (
                      <p
                        className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2A36E]"
                        data-page-module-field={`value_${lang}`}
                      >
                        {featuredCard.meta}
                      </p>
                    ) : null}
                    {featuredCard.title ? (
                      <h3
                        className="font-[family-name:var(--font-heading)] text-3xl font-light leading-tight sm:text-4xl lg:text-6xl"
                        data-page-module-field={`label_${lang}`}
                      >
                        {featuredCard.title}
                      </h3>
                    ) : null}
                    {featuredCard.body ? (
                      <p
                        className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base"
                        data-page-module-field={`content_${lang}`}
                      >
                        {featuredCard.body}
                      </p>
                    ) : null}
                  </div>
                </article>
              );

              return featuredCard.href ? (
                <Link href={featuredCard.href} {...externalLinkProps(featuredCard.href)} className="block h-full">
                  {featuredArticle}
                </Link>
              ) : featuredArticle;
            })()}

            {secondaryCards.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {secondaryCards.map((card, index) => {
                  const compactArticle = (
                    <article
                      className={`${isDark ? 'border-white/12 bg-white/[0.06]' : 'border-[#E5DED4] bg-white'} group grid min-h-[220px] overflow-hidden border sm:grid-cols-[0.88fr_1.12fr] lg:min-h-[213px]`}
                      data-page-module-item={card.id}
                    >
                      {card.image ? (
                        <div className="relative min-h-[180px] overflow-hidden bg-[#DCD5CC] sm:min-h-full">
                          <Image
                            src={card.image}
                            alt={card.title}
                            fill
                            loading="lazy"
                            className="object-cover transition duration-700 group-hover:scale-[1.035]"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 42vw, 22vw"
                            data-page-module-field="image_url"
                          />
                        </div>
                      ) : null}
                      <div className="flex flex-col justify-end p-5 lg:p-6">
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
                            className="font-[family-name:var(--font-heading)] text-xl font-medium leading-tight lg:text-2xl"
                            data-page-module-field={`label_${lang}`}
                          >
                            {card.title}
                          </h3>
                        ) : null}
                        {card.body ? (
                          <p
                            className={`${isDark ? 'text-white/62' : 'text-[#6B625B]'} mt-3 line-clamp-3 text-sm leading-6`}
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
                      {compactArticle}
                    </Link>
                  ) : (
                    <div key={`${card.id}-${index}`} className="h-full">{compactArticle}</div>
                  );
                })}
              </div>
            ) : null}
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
