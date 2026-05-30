'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
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
    if (!hasDraftPreview && !previewVersion && Array.isArray(initialModules)) return;
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
  const primaryHref = primaryCta?.href || '';
  const secondaryHref = secondaryCta?.href || '';
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
      className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-[#241F1B]"
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
      <div className="absolute inset-0 bg-[#241F1B]/48" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {tagline ? (
          <div className="mb-10">
            <p
              className="text-base sm:text-lg tracking-[0.15em] text-white/70 font-light font-[family-name:var(--font-heading)]"
              data-page-module-item="hero-tagline"
              data-page-module-field={`label_${lang}`}
            >
              {tagline}
            </p>
            <div className="w-12 h-px bg-[#E36F2C] mx-auto mt-4" />
          </div>
        ) : null}

        <h1
          className="text-4xl sm:text-6xl lg:text-8xl font-normal text-white mb-10 leading-[1.12] tracking-[0.08em] sm:tracking-[0.15em] break-words font-[family-name:var(--font-heading)]"
          data-page-module-item="hero-headline"
          data-page-module-field={`label_${lang}`}
        >
          {headline}
        </h1>

        {subtitle ? (
          <p
            className="text-white/55 text-base sm:text-lg leading-relaxed mb-12 max-w-2xl mx-auto"
            data-page-module-item="hero-subtitle"
            data-page-module-field={`label_${lang}`}
          >
            {subtitle}
          </p>
        ) : null}

        {((primaryLabel && primaryHref) || (secondaryLabel && secondaryHref)) ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {primaryLabel && primaryHref ? (
              <Link
                href={primaryHref}
                {...externalLinkProps(primaryHref)}
                className="bg-[#E36F2C] text-white px-10 py-4 text-sm tracking-wider hover:bg-[#C85A1F] transition-colors"
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
                className="border border-white/30 text-white/80 px-10 py-4 text-sm tracking-wider hover:border-white/60 transition-colors"
                data-page-module-item="hero-secondary-cta"
                data-page-module-field={`label_${lang}`}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 animate-bounce">
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
      className="bg-[#F5F2ED] py-14 border-y border-[#E5DED4]"
      data-page-module="home:credentials"
      data-page-key="home"
      data-module-key="credentials"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#E5DED4] bg-white border border-[#E5DED4] shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
          {stats.map((s) => (
            <div key={s.id} className="text-center py-6 px-4" data-page-module-item={s.id}>
              <div
                className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#E36F2C] tracking-tight mb-2"
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
  const primaryHref = primary?.href || '';
  const secondaryHref = secondary?.href || '';

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
  const primaryHref = primary?.href || '';
  const secondaryHref = secondary?.href || '';

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
