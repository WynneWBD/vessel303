'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildNextImageFallbackSrc, inferNextImageFallbackWidth } from '@/lib/image-optimization';
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
  video_url?: string;
  video_poster_url?: string;
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
  const headlineItem = findItem('hero-headline');
  const subtitleItem = findItem('hero-subtitle');
  const tagline = localizedLabel(findItem('hero-tagline'), lang, '');
  const headline = localizedLabel(headlineItem, lang, '');
  const moduleHeadline = localizedModuleTitle(pageModule, lang, '');
  const subtitle = localizedLabel(subtitleItem, lang, '');
  const moduleSubtitle = localizedModuleDescription(pageModule, lang, '');
  const primaryCta = findItem('hero-primary-cta');
  const primaryLabel = localizedLabel(primaryCta, lang, '');
  const primaryHref = displayHref(primaryCta?.href);
  const activeImage = heroSlides.length > 0 ? current % heroSlides.length : 0;
  const nextImage = heroSlides.length > 0 ? (activeImage + 1) % heroSlides.length : 0;
  const activeSlide = heroSlides[activeImage] ?? null;
  const previewSlide = heroSlides[nextImage] ?? activeSlide;
  const activeTagline = activeSlide?.eyebrow || tagline;
  const activeHeadline = headline || moduleHeadline || activeSlide?.headline;
  const activeSubtitle = subtitle || moduleSubtitle || activeSlide?.subtitle;
  const activePrimaryHref = activeSlide?.href || primaryHref;
  const activeTaglineItem = activeSlide?.eyebrow ? activeSlide.id : 'hero-tagline';
  const activeTaglineField = activeSlide?.eyebrow ? `value_${lang}` : `label_${lang}`;
  const activeHeadlineItem = headline ? 'hero-headline' : (moduleHeadline ? undefined : activeSlide?.id);
  const activeHeadlineField = headline ? `label_${lang}` : (moduleHeadline ? `title_${lang}` : `label_${lang}`);
  const activeSubtitleItem = subtitle ? 'hero-subtitle' : (moduleSubtitle ? undefined : activeSlide?.id);
  const activeSubtitleField = subtitle ? `label_${lang}` : (moduleSubtitle ? `description_${lang}` : `content_${lang}`);
  const nextLabel = lang === 'zh' ? '下一张' : 'Next';
  const pauseLabel = lang === 'zh' ? '暂停' : 'Pause';
  const playLabel = lang === 'zh' ? '播放' : 'Play';
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
      className="relative flex min-h-[52svh] items-center overflow-hidden bg-[#172231] sm:min-h-[58svh] lg:min-h-[64vh] xl:min-h-[66vh]"
      data-page-module="home:hero"
      data-page-key="home"
      data-module-key="hero"
    >
      {/* Carousel images */}
      {activeSlide ? (
        <Image
          key={activeSlide.src}
          src={activeSlide.src}
          alt=""
          fill
          priority={activeImage === 0}
          sizes="100vw"
          quality={75}
          overrideSrc={buildNextImageFallbackSrc(activeSlide.src, activeImage === 0 ? 1920 : 1200)}
          className="object-cover transition-opacity duration-700"
          data-page-module-item={activeSlide.id}
          data-page-module-field="image_url"
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,30,44,0.18)_0%,rgba(18,30,44,0.08)_24%,rgba(5,12,18,0.14)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.34)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#071018]/46 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1540px] flex-col px-5 pb-12 pt-20 text-center sm:px-6 sm:pb-16 sm:pt-24 lg:px-10 lg:pb-20 lg:pt-28">
        <div className="mx-auto max-w-[1600px]">
          {activeTagline ? (
            <div className="mb-5 sm:mb-6">
                <p
                  className="text-sm font-semibold uppercase tracking-[0.22em] text-white/86"
                data-page-module-item={activeTaglineItem}
                data-page-module-field={activeTaglineField}
              >
                {activeTagline}
              </p>
            </div>
          ) : null}

          <h1
            className="mx-auto mb-5 max-w-[24rem] break-words font-[family-name:var(--font-heading)] text-4xl font-bold leading-[1.06] text-white sm:max-w-5xl sm:text-5xl sm:leading-[1.04] lg:mb-6 lg:max-w-[1420px] lg:text-[56px] xl:max-w-[1600px] xl:text-[62px]"
            style={{ overflowWrap: 'anywhere', textShadow: '0 20px 58px rgba(0,0,0,0.36)' }}
            data-page-module-item={activeHeadlineItem}
            data-page-module-field={activeHeadlineField}
          >
            {activeHeadline}
          </h1>

          {activeSubtitle ? (
            <p
              className="mx-auto mb-6 max-w-[24rem] text-xl leading-snug text-white sm:max-w-[90vw] sm:text-3xl lg:mb-8 lg:text-[32px] xl:text-[36px]"
              style={{ overflowWrap: 'anywhere', textShadow: '0 14px 42px rgba(0,0,0,0.34)' }}
              data-page-module-item={activeSubtitleItem}
              data-page-module-field={activeSubtitleField}
            >
              {activeSubtitle}
            </p>
          ) : null}

          {primaryLabel && activePrimaryHref ? (
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
              <Link prefetch={false}
                href={activePrimaryHref}
                {...externalLinkProps(activePrimaryHref)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/88 px-8 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#172231]"
                data-page-module-item="hero-primary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {primaryLabel}
              </Link>
            </div>
          ) : null}

        </div>

      </div>

      {heroSlides.length > 1 ? (
        <div
          className="hidden items-end gap-6 xl:flex"
          style={{ position: 'absolute', right: 32, bottom: 32, zIndex: 20 }}
        >
          <button
            type="button"
            onClick={() => setCurrent(nextImage)}
            className="relative overflow-hidden border border-white/72 bg-white/8 text-left shadow-[0_24px_62px_rgba(0,0,0,0.24)] transition hover:border-white"
            style={{ height: 132, width: 262 }}
          >
            {previewSlide ? (
              <Image
                src={previewSlide.src}
                alt=""
                fill
                sizes="262px"
                overrideSrc={buildNextImageFallbackSrc(previewSlide.src, 640)}
                className="object-cover"
              />
            ) : null}
            <span className="sr-only">{previewSlide?.headline || previewSlide?.eyebrow || 'Next slide preview'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrent((prev) => (prev + 1) % heroSlides.length)}
            className="inline-flex items-center justify-center gap-3 border border-white/72 bg-black/10 px-5 text-[17px] font-semibold uppercase tracking-[0.04em] text-white backdrop-blur-[1px] transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-white/70"
            style={{ height: 132, width: 132 }}
          >
            <span>{nextLabel}</span>
            <ChevronRight aria-hidden="true" className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((value) => !value)}
            aria-pressed={isPaused}
            className="inline-flex items-center justify-center border border-white/72 bg-black/10 text-white backdrop-blur-[1px] transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-white/70"
            style={{ height: 132, width: 48 }}
          >
            {isPaused ? (
              <Play aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Pause aria-hidden="true" className="h-5 w-5" />
            )}
            <span className="sr-only">{isPaused ? playLabel : pauseLabel}</span>
          </button>
        </div>
      ) : null}

      {heroSlides.length > 1 ? (
        <div
          className="hidden items-center gap-2 xl:flex"
          style={{ position: 'absolute', right: 430, bottom: 174, zIndex: 20 }}
        >
          {heroSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setCurrent(index)}
              aria-current={index === activeImage ? 'true' : undefined}
              className={`h-1.5 w-8 transition-colors focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#172231] ${index === activeImage ? 'bg-white' : 'bg-white/32 hover:bg-white/58'}`}
            >
              <span className="sr-only">{slide.headline || slide.eyebrow || String(index + 1)}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 animate-bounce">
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none"><path d="M10 0v20M3 13l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </section>
  );
}

// ─── Credentials Bar ─────────────────────────────────────

function CredentialsBar({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  const items = useMemo(() => sortModuleItems(pageModule), [pageModule]);
  const visibleItems = items.filter((item) => item.is_visible);
  const proofVisual = visibleItems.find((item) => item.image_url);
  const stats = visibleItems
    .map((item) => ({
      id: item.id,
      val: localizedValue(item, lang, ''),
      label: localizedLabel(item, lang, ''),
    }))
    .filter((stat) => stat.val || stat.label);
  const proofVisualAlt = proofVisual
    ? [localizedValue(proofVisual, lang, ''), localizedLabel(proofVisual, lang, '')].filter(Boolean).join(' ')
    : '';

  if (!pageModule || !pageModule.is_visible) return null;
  if (stats.length === 0) return null;

  return (
    <section
      className="relative z-20 hidden border-y border-white/10 bg-[#14100E] sm:block"
      data-page-module="home:credentials"
      data-page-key="home"
      data-module-key="credentials"
    >
      <div className="mx-auto max-w-[1540px] px-5 sm:px-6 lg:px-10">
        <div className={`${proofVisual?.image_url ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-stretch' : ''} border-x border-white/10`}>
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {stats.map((s, index) => (
              <div
                key={s.id}
                className={`relative min-w-0 overflow-hidden border-white/10 bg-white/[0.035] px-2 py-1.5 text-left sm:px-3 sm:py-2.5 lg:py-3 ${
                  index % 2 === 0 ? 'border-r' : ''
                } ${index < 2 ? 'border-b sm:border-b-0' : ''} sm:border-r sm:last:border-r-0`}
                data-page-module-item={s.id}
                aria-label={[s.val, s.label].filter(Boolean).join(' ')}
              >
                <span aria-hidden="true" className="mb-1 block h-[2px] w-6 bg-[#F2A36E]/80 sm:mb-1.5 sm:w-7" />
                <div
                  className="mb-0.5 font-[family-name:var(--font-heading)] text-lg font-medium tracking-tight text-[#F2A36E] sm:mb-1 sm:text-2xl lg:text-3xl"
                  style={{ fontFamily: 'var(--font-heading)', fontFeatureSettings: '"tnum"' }}
                  data-page-module-field={`value_${lang}`}
                >
                  {s.val}
                </div>
                <div
                  className="max-w-[12rem] break-words text-[8px] font-semibold uppercase leading-snug tracking-[0.08em] text-white/72 sm:text-[10px] sm:tracking-[0.12em]"
                  data-page-module-field={`label_${lang}`}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          {proofVisual?.image_url ? (
            <div
              className="hidden border-t border-white/10 px-2 py-2 sm:block sm:px-3 lg:border-l lg:border-t-0"
              data-page-module-item={proofVisual.id}
            >
              <div className="relative mx-auto h-[60px] w-full overflow-hidden bg-[#C7D6EA] sm:h-[88px] lg:h-full lg:min-h-[96px] lg:max-h-[118px]">
                <Image
                  src={proofVisual.image_url}
                  alt={proofVisualAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  overrideSrc={buildNextImageFallbackSrc(proofVisual.image_url, 750)}
                  className="object-contain p-1.5 sm:p-2"
                  data-page-module-field="image_url"
                />
                <div className="absolute left-1.5 top-1.5 bg-[#14100E]/82 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/78 backdrop-blur-sm sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
                  {lang === 'zh' ? '可信证明' : 'Credential proof'}
                </div>
              </div>
            </div>
          ) : null}
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
            <Link prefetch={false}
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
            <Link prefetch={false}
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
    .filter((item) => item.is_visible && item.id.startsWith('card-'))
    .map((item) => ({
      id: item.id,
      title: localizedLabel(item, lang, ''),
      meta: localizedValue(item, lang, ''),
      body: localizedContent(item, lang, ''),
      image: item.image_url || '',
      video: item.video_url || '',
      videoPoster: item.video_poster_url || '',
      href: displayHref(item.href),
    }))
    .filter((item) => item.title || item.body || item.image || item.video);
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
                  {(card.image || card.video) ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#E5DED4]">
                      <HomepageVisualCardMedia
                        card={card}
                        altFallback={title}
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
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
                <Link prefetch={false} key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
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
              <Link prefetch={false}
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
              <Link prefetch={false}
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
    .filter((item) => item.is_visible && item.id.startsWith('card-'))
    .map((item) => ({
      id: item.id,
      title: localizedLabel(item, lang, ''),
      meta: localizedValue(item, lang, ''),
      body: localizedContent(item, lang, ''),
      image: item.image_url || '',
      video: item.video_url || '',
      videoPoster: item.video_poster_url || '',
      href: displayHref(item.href),
    }))
    .filter((item) => item.title || item.meta || item.body || item.image || item.video);
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
                  {(card.image || card.video) ? (
                    <div className={`${isProductSeries ? 'aspect-[16/9]' : 'aspect-[4/3]'} relative overflow-hidden bg-[#E5DED4]`}>
                      <HomepageVisualCardMedia
                        card={card}
                        altFallback={title}
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes={isModelGrid ? '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw' : '(max-width: 768px) 100vw, 33vw'}
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
                <Link prefetch={false} key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
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
              <Link prefetch={false}
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
              <Link prefetch={false}
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

type HomepageVisualCard = {
  title: string;
  image: string;
  video: string;
  videoPoster: string;
};

function LazyHomepageVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [canLoad, setCanLoad] = useState(() => typeof window !== 'undefined' && !('IntersectionObserver' in window));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCanLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '640px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={canLoad ? src : undefined}
      poster={canLoad ? poster : undefined}
      autoPlay={canLoad}
      muted
      loop
      playsInline
      preload="none"
      className={className}
      data-page-module-field="video_url"
    />
  );
}

function HomepageVisualCardMedia({
  card,
  altFallback,
  className,
  sizes,
}: {
  card: HomepageVisualCard;
  altFallback: string;
  className: string;
  sizes: string;
}) {
  const videoClassName = className.includes('absolute') ? className : `absolute inset-0 h-full w-full ${className}`;

  if (card.video) {
    return (
      <>
        <LazyHomepageVideo
          src={card.video}
          poster={card.videoPoster || card.image || undefined}
          className={videoClassName}
        />
        {card.videoPoster ? (
          <span
            aria-hidden="true"
            hidden
            data-page-module-field="video_poster_url"
            data-page-module-value={card.videoPoster}
          />
        ) : null}
      </>
    );
  }

  if (card.image) {
    return (
      <Image
        src={card.image}
        alt={card.title || altFallback}
        fill
        loading="lazy"
        className={className}
        sizes={sizes}
        overrideSrc={buildNextImageFallbackSrc(card.image, inferNextImageFallbackWidth(sizes))}
        data-page-module-field="image_url"
      />
    );
  }

  return null;
}

function HomepageVisualSection({ pageModule }: { pageModule: HomePageModule | null }) {
  const { lang } = useLanguage();
  if (!pageModule || !pageModule.is_visible) return null;

  const eyebrow = localizedLabel(findModuleItem(pageModule, 'eyebrow'), lang, '');
  const title = localizedModuleTitle(pageModule, lang, '');
  const description = localizedModuleDescription(pageModule, lang, '');
  const modelMarks = sortModuleItems(pageModule)
    .filter((item) => item.is_visible && item.id.startsWith('model-mark-') && item.image_url)
    .map((item) => ({
      key: item.id.replace(/^model-mark-/, ''),
      id: item.id,
      image: item.image_url || '',
      alt: localizedLabel(item, lang, ''),
    }));
  const modelMarkByKey = new Map(modelMarks.map((mark) => [mark.key, mark]));
  const cards = sortModuleItems(pageModule)
    .filter((item) => item.is_visible && item.id.startsWith('card-'))
    .map((item) => ({
      id: item.id,
      title: localizedLabel(item, lang, ''),
      meta: localizedValue(item, lang, ''),
      body: localizedContent(item, lang, ''),
      image: item.image_url || '',
      video: item.video_url || '',
      videoPoster: item.video_poster_url || '',
      href: displayHref(item.href),
      modelMark: modelMarkByKey.get(item.id.replace(/^card-/, '')) ?? null,
    }))
    .filter((item) => item.title || item.meta || item.body || item.image || item.video);
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
  const isScenario = moduleType === 'scenario-tiles';
  const isFuture = moduleType === 'future-explorer';
  const isDark = isInnovation || isFuture;
  const featuredCard = cards[0];
  const secondaryCards = cards.slice(1);

  if (!title && !description && cards.length === 0) return null;

  if (isLargeProducts) {
    const hasHeader = Boolean(eyebrow || title || description);

    return (
      <section
        className="border-b border-[#E5DED4] bg-[#F3EEE7] py-4 text-[#11100E] lg:py-5"
        style={{ backgroundColor: '#F3EEE7', color: '#11100E' }}
        data-page-module={`home:${pageModule.module_key}`}
        data-page-key="home"
        data-module-key={pageModule.module_key}
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          {hasHeader ? (
            <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-end">
              <div>
                {eyebrow ? (
                  <p
                    className="mb-2 text-xs font-semibold text-[#E36F2C]"
                    data-page-module-item="eyebrow"
                    data-page-module-field={`label_${lang}`}
                  >
                    {eyebrow}
                  </p>
                ) : null}
                {title ? (
                  <h2
                    className="max-w-4xl break-words font-[family-name:var(--font-heading)] text-2xl font-light leading-[1.04] sm:text-3xl lg:text-4xl"
                    data-page-module-field={`title_${lang}`}
                  >
                    {title}
                  </h2>
                ) : null}
              </div>
              {description ? (
                <p
                  className="max-w-3xl text-sm leading-6 text-[#6B625B] sm:text-base lg:ml-auto"
                  data-page-module-field={`description_${lang}`}
                >
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}

          {cards.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {cards.map((card, index) => {
                const isWideCard = index === 0 || (index === 3 && cards.length === 4);
                const cardPrimaryHref = card.href || primaryHref;
                const productCard = (
                  <article
                    className="group relative flex overflow-hidden bg-[#DCD5CC]"
                    style={{ minHeight: isWideCard ? 'clamp(390px, 42vw, 560px)' : 'clamp(340px, 31vw, 440px)' }}
                    data-page-module-item={card.id}
                  >
                    {(card.image || card.video) ? (
                      <HomepageVisualCardMedia
                        card={card}
                        altFallback={title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                        sizes={isWideCard ? '100vw' : '(max-width: 1024px) 100vw, 50vw'}
                      />
                    ) : null}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.34) 34%, rgba(255,255,255,0.08) 70%, rgba(255,255,255,0.16) 100%)',
                      }}
                    />
                    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-5 pb-8 pt-8 text-center sm:px-8 lg:pt-10">
                    {card.meta ? (
                      <p
                        className="mb-3 max-w-full break-words text-sm font-medium text-[#11100E] sm:text-base"
                        data-page-module-field={`value_${lang}`}
                      >
                        {card.meta}
                      </p>
                    ) : null}
                    {card.title ? (
                      <h3
                        className="max-w-full break-words font-[family-name:var(--font-heading)] text-3xl font-light leading-tight sm:text-4xl lg:text-5xl"
                        data-page-module-field={`label_${lang}`}
                      >
                        {card.title}
                      </h3>
                    ) : null}
                    {card.body ? (
                      <p
                        className="mt-4 max-w-2xl break-words text-sm font-medium uppercase leading-6 text-[#11100E]/86 sm:text-base"
                        data-page-module-field={`content_${lang}`}
                      >
                        {card.body}
                      </p>
                    ) : null}
                    {((primaryLabel && cardPrimaryHref) || (secondaryLabel && secondaryHref)) ? (
                      <div className="mt-7 flex flex-wrap items-center justify-center gap-8 text-sm text-[#11100E] sm:text-base">
                        {primaryLabel && cardPrimaryHref ? (
                          <Link prefetch={false}
                            href={cardPrimaryHref}
                            {...externalLinkProps(cardPrimaryHref)}
                            className="inline-flex items-center gap-2 font-medium transition hover:text-[#E36F2C]"
                            data-page-module-item="primary-cta"
                            data-page-module-field={`label_${lang}`}
                          >
                            <span>{primaryLabel}</span>
                            <ChevronRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
                          </Link>
                        ) : null}
                        {secondaryLabel && secondaryHref ? (
                          <Link prefetch={false}
                            href={secondaryHref}
                            {...externalLinkProps(secondaryHref)}
                            className="inline-flex items-center gap-2 font-medium transition hover:text-[#E36F2C]"
                            data-page-module-item="secondary-cta"
                            data-page-module-field={`label_${lang}`}
                          >
                            <span>{secondaryLabel}</span>
                            <ChevronRight aria-hidden="true" className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  </article>
                );

                return (
                  <div key={`${card.id}-${index}`} className={isWideCard ? 'lg:col-span-2' : ''}>
                    {productCard}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (isModelStrip) {
    return (
      <section
        className="relative border-b border-[#E5DED4] bg-[#0E0D0B] text-white"
        style={{ backgroundColor: '#0E0D0B', color: '#FFFFFF' }}
        data-page-module={`home:${pageModule.module_key}`}
        data-page-key="home"
        data-module-key={pageModule.module_key}
      >
        <div className="home-model-carousel flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
          {cards.map((card, index) => {
            const previousCard = cards[(index - 1 + cards.length) % cards.length];
            const nextCard = cards[(index + 1) % cards.length];
            const cardPrimaryHref = card.href || primaryHref;

            return (
              <article
                key={card.id}
                id={`home-model-${card.id}`}
                className="group relative w-full flex-none snap-start overflow-hidden"
                style={{ flex: '0 0 100%', minHeight: 'clamp(560px, calc(100vh - 96px), 780px)', width: '100%' }}
                data-page-module-item={card.id}
              >
                {(card.image || card.video) ? (
                  <HomepageVisualCardMedia
                    card={card}
                    altFallback={title}
                    className="absolute inset-0 h-full w-full object-cover"
                    sizes="100vw"
                  />
                ) : null}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(180deg, rgba(8,9,10,0.18) 0%, rgba(8,9,10,0.24) 48%, rgba(8,9,10,0.42) 100%)',
                  }}
                />
                <div className="relative mx-auto flex min-h-[clamp(560px,calc(100vh-96px),780px)] max-w-5xl flex-col items-center px-5 pb-16 pt-24 text-center sm:px-8 sm:pt-28 lg:pt-32">
                  {card.modelMark?.image ? (
                    <div
                      className="mb-5 flex h-12 min-w-[116px] items-center justify-center bg-white/86 px-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)] backdrop-blur-sm"
                      data-page-module-item={card.modelMark.id}
                      data-page-module-field="image_url"
                    >
                      <Image
                        src={card.modelMark.image}
                        alt={card.modelMark.alt || card.title || title}
                        width={116}
                        height={48}
                        className="h-8 w-auto max-w-[116px] object-contain"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  {card.meta ? (
                    <p
                      className="max-w-full break-words text-sm font-medium text-white/82 sm:text-base"
                      data-page-module-field={`value_${lang}`}
                    >
                      {card.meta}
                    </p>
                  ) : null}
                  {card.title ? (
                    <h3
                      className="mt-3 max-w-full break-words font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl"
                      data-page-module-field={`label_${lang}`}
                    >
                      {card.title}
                    </h3>
                  ) : null}
                  {card.body ? (
                    <p
                      className="mt-4 max-w-3xl break-words text-sm leading-7 text-white/78 sm:text-base"
                      data-page-module-field={`content_${lang}`}
                    >
                      {card.body}
                    </p>
                  ) : null}
                  {((primaryLabel && cardPrimaryHref) || (secondaryLabel && secondaryHref)) ? (
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                      {primaryLabel && cardPrimaryHref ? (
                        <Link prefetch={false}
                          href={cardPrimaryHref}
                          {...externalLinkProps(cardPrimaryHref)}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/76 px-7 text-sm font-medium text-white transition hover:bg-white hover:text-[#11100E]"
                          data-page-module-item="primary-cta"
                          data-page-module-field={`label_${lang}`}
                        >
                          {primaryLabel}
                        </Link>
                      ) : null}
                      {secondaryLabel && secondaryHref ? (
                        <Link prefetch={false}
                          href={secondaryHref}
                          {...externalLinkProps(secondaryHref)}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/76 px-7 text-sm font-medium text-white transition hover:bg-white hover:text-[#11100E]"
                          data-page-module-item="secondary-cta"
                          data-page-module-field={`label_${lang}`}
                        >
                          {secondaryLabel}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {cards.length > 1 ? (
                  <>
                    <a
                      href={`#home-model-${previousCard.id}`}
                      className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/70 text-white transition hover:bg-white hover:text-[#11100E] md:inline-flex"
                      aria-label="Previous model"
                    >
                      <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                    </a>
                    <a
                      href={`#home-model-${nextCard.id}`}
                      className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/70 text-white transition hover:bg-white hover:text-[#11100E] md:inline-flex"
                      aria-label="Next model"
                    >
                      <ChevronRight aria-hidden="true" className="h-6 w-6" />
                    </a>
                    <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3">
                      {cards.map((dotCard, dotIndex) => (
                        <a
                          key={dotCard.id}
                          href={`#home-model-${dotCard.id}`}
                          className={`h-2 rounded-full transition ${dotIndex === index ? 'w-10 bg-white' : 'w-2 bg-white/45 hover:bg-white/80'}`}
                          aria-label={`Open model ${dotIndex + 1}`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  if (isInnovation) {
    const cardActionLabel = primaryLabel || secondaryLabel;

    return (
      <section
        className="border-b border-[#E5DED4] bg-white py-12 text-[#241F1B] lg:py-16"
        style={{ backgroundColor: '#FFFFFF', color: '#241F1B' }}
        data-page-module={`home:${pageModule.module_key}`}
        data-page-key="home"
        data-module-key={pageModule.module_key}
      >
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            {eyebrow ? (
              <p
                className="mb-2 text-xs font-semibold text-[#E36F2C]"
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
                className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-[#6B625B] sm:text-base"
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
                    style={{ minHeight: 'clamp(360px, 39vw, 520px)' }}
                    data-page-module-item={card.id}
                  >
                    <HomepageVisualCardMedia
                      card={card}
                      altFallback={title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, rgba(16, 14, 12, 0.58) 0%, rgba(16, 14, 12, 0.12) 58%, rgba(16, 14, 12, 0.34) 100%)',
                      }}
                    />
                    <div className="relative flex w-full flex-col items-center justify-end px-5 pb-8 pt-12 text-center">
                      {card.meta ? (
                        <p
                          className="mb-2 text-[11px] font-semibold text-white/78"
                          data-page-module-field={`value_${lang}`}
                        >
                          {card.meta}
                        </p>
                      ) : null}
                      {card.title ? (
                        <h3
                          className="max-w-sm font-[family-name:var(--font-heading)] text-xl font-semibold leading-tight sm:text-2xl"
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
                      {card.href && cardActionLabel ? (
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/86 transition group-hover:text-white">
                          <span
                            data-page-module-item="primary-cta"
                            data-page-module-field={`label_${lang}`}
                          >
                            {cardActionLabel}
                          </span>
                          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
                  </article>
                );

                return card.href ? (
                  <Link prefetch={false} key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
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
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              {primaryLabel && primaryHref ? (
                <Link prefetch={false}
                  href={primaryHref}
                  {...externalLinkProps(primaryHref)}
                  className="inline-flex min-h-10 items-center justify-center bg-[#E36F2C] px-4 text-sm font-bold text-white hover:bg-[#C85A1F]"
                  data-page-module-item="primary-cta"
                  data-page-module-field={`label_${lang}`}
                >
                  {primaryLabel}
                </Link>
              ) : null}
              {secondaryLabel && secondaryHref ? (
                <Link prefetch={false}
                  href={secondaryHref}
                  {...externalLinkProps(secondaryHref)}
                  className="inline-flex min-h-10 items-center justify-center border border-[#241F1B]/20 px-4 text-sm font-bold text-[#241F1B]/75 hover:border-[#E36F2C] hover:text-[#E36F2C]"
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

  if (isScenario) {
    const cardActionLabel = primaryLabel || secondaryLabel;

    return (
      <section
        className="border-b border-[#E5DED4] bg-[#F7F1E9] py-14 text-[#241F1B] lg:py-16"
        style={{ backgroundColor: '#F7F1E9', color: '#241F1B' }}
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
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {cards.map((card, index) => {
                const scenarioTile = (
                  <article
                    className="group relative flex overflow-hidden bg-[#241F1B] text-white"
                    style={{ minHeight: 'clamp(420px, 44vw, 560px)' }}
                    data-page-module-item={card.id}
                  >
                    <HomepageVisualCardMedia
                      card={card}
                      altFallback={title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, rgba(18, 16, 14, 0.18) 0%, rgba(18, 16, 14, 0.18) 42%, rgba(18, 16, 14, 0.88) 100%)',
                      }}
                    />
                    <div className="relative mt-auto w-full p-5 sm:p-6">
                      {card.meta ? (
                        <p
                          className="mb-3 text-[11px] font-semibold text-[#F2A36E]"
                          data-page-module-field={`value_${lang}`}
                        >
                          {card.meta}
                        </p>
                      ) : null}
                      {card.title ? (
                        <h3
                          className="font-[family-name:var(--font-heading)] text-2xl font-light leading-tight sm:text-3xl"
                          data-page-module-field={`label_${lang}`}
                        >
                          {card.title}
                        </h3>
                      ) : null}
                      {card.body ? (
                        <p
                          className="mt-3 line-clamp-2 text-sm leading-6 text-white/72"
                          data-page-module-field={`content_${lang}`}
                        >
                          {card.body}
                        </p>
                      ) : null}
                      {card.href && cardActionLabel ? (
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#F2A36E] transition group-hover:text-white">
                          <span
                            data-page-module-item="primary-cta"
                            data-page-module-field={`label_${lang}`}
                          >
                            {cardActionLabel}
                          </span>
                          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
                  </article>
                );

                return card.href ? (
                  <Link prefetch={false} key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
                    {scenarioTile}
                  </Link>
                ) : (
                  <div key={`${card.id}-${index}`} className="h-full">
                    {scenarioTile}
                  </div>
                );
              })}
            </div>
          ) : null}

          {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              {primaryLabel && primaryHref ? (
                <Link prefetch={false}
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
                <Link prefetch={false}
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
    const futureCards = secondaryCards;
    const hasFutureCards = futureCards.length > 0;

    return (
      <section
        className={`border-b border-[#2D2925] bg-[#171410] text-white ${hasFutureCards ? 'py-6 lg:py-8' : ''}`}
        style={{ backgroundColor: '#171410', color: '#FFFFFF' }}
        data-page-module={`home:${pageModule.module_key}`}
        data-page-key="home"
        data-module-key={pageModule.module_key}
      >
        <div className={hasFutureCards ? 'mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8' : 'w-full'}>
          <div
            className="relative overflow-hidden bg-[#201B16]"
            style={{ minHeight: hasFutureCards ? 'clamp(540px, 52vw, 660px)' : 'clamp(620px, 72vw, 900px)' }}
          >
            {(futureLead?.image || futureLead?.video) ? (
              <div className="absolute inset-0" data-page-module-item={futureLead.id}>
                <HomepageVisualCardMedia
                  card={futureLead}
                  altFallback={title}
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            ) : null}
            <div
              className="absolute inset-0"
              style={{
                background: hasFutureCards
                  ? 'linear-gradient(90deg, rgba(18, 16, 14, 0.92) 0%, rgba(18, 16, 14, 0.62) 42%, rgba(18, 16, 14, 0.24) 100%)'
                  : 'linear-gradient(90deg, rgba(12, 11, 10, 0.72) 0%, rgba(12, 11, 10, 0.42) 44%, rgba(12, 11, 10, 0.12) 100%)',
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{
                background: 'linear-gradient(0deg, rgba(18, 16, 14, 0.96) 0%, rgba(18, 16, 14, 0.34) 64%, rgba(18, 16, 14, 0) 100%)',
              }}
            />

            <div className={`${hasFutureCards ? 'grid lg:grid-cols-[minmax(0,1fr)_360px]' : 'flex'} relative min-h-[inherit] gap-0`}>
              <div className={`${hasFutureCards ? 'justify-between p-6 sm:p-8 lg:p-10' : 'justify-center px-6 py-16 sm:px-10 lg:px-[8vw]'} flex min-h-[inherit] flex-col`}>
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
                      className={`${hasFutureCards ? 'sm:text-5xl lg:text-6xl' : 'sm:text-6xl lg:text-7xl'} font-[family-name:var(--font-heading)] text-3xl font-light leading-[1.02]`}
                      data-page-module-field={`title_${lang}`}
                    >
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p
                      className={`${hasFutureCards ? 'max-w-2xl' : 'max-w-3xl'} mt-5 text-sm leading-7 text-white/72 sm:text-base`}
                      data-page-module-field={`description_${lang}`}
                    >
                      {description}
                    </p>
                  ) : null}
                </div>

                {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {primaryLabel && primaryHref ? (
                      <Link prefetch={false}
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
                      <Link prefetch={false}
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
                          {(card.image || card.video) ? (
                            <div className="relative min-h-[112px] overflow-hidden bg-[#241F1B]">
                              <HomepageVisualCardMedia
                                card={card}
                                altFallback={title}
                                className="object-cover transition duration-700 group-hover:scale-[1.035]"
                                sizes="132px"
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
                        <Link prefetch={false} key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block">
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
                  <HomepageVisualCardMedia
                    card={featuredCard}
                    altFallback={title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                    sizes="(max-width: 1024px) 100vw, 62vw"
                  />
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
                <Link prefetch={false} href={featuredCard.href} {...externalLinkProps(featuredCard.href)} className="block h-full">
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
                      {(card.image || card.video) ? (
                        <div className="relative min-h-[180px] overflow-hidden bg-[#DCD5CC] sm:min-h-full">
                          <HomepageVisualCardMedia
                            card={card}
                            altFallback={title}
                            className="object-cover transition duration-700 group-hover:scale-[1.035]"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 42vw, 22vw"
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
                    <Link prefetch={false} key={card.id} href={card.href} {...externalLinkProps(card.href)} className="block h-full">
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
              <Link prefetch={false}
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
              <Link prefetch={false}
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
              <Link prefetch={false}
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
              <Link prefetch={false}
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
    .filter((item) => item.is_visible && item.id.startsWith('card-'))
    .map((item) => ({
      id: item.id,
      title: localizedLabel(item, lang, ''),
      body: localizedContent(item, lang, ''),
    }))
    .filter((item) => item.title || item.body);
  const images = sortModuleItems(pageModule)
    .filter((item) => item.is_visible && item.id.startsWith('image-') && item.image_url)
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
                  overrideSrc={buildNextImageFallbackSrc(item.image_url, index === 0 ? 1200 : 750)}
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
              <Link prefetch={false}
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
              <Link prefetch={false}
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
    <main className="overflow-x-hidden">
      <Navbar />
      {dynamicModules.map((resolved) => renderHomeDynamicModule(resolved))}
      <Footer />
    </main>
  );
}
