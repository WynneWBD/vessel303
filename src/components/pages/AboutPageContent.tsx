'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import ProtectedImage from '@/components/ProtectedImage';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TechDrawer from '@/components/TechDrawer';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  isResolvedPageModuleVisible,
  resolveDynamicPageModules,
  type PageModuleRegistryEntry,
  type ResolvedPageModule,
} from '@/lib/page-module-rendering';
import { canUseNextImageOptimization } from '@/lib/image-optimization';

type Tech = 'viie' | 'vols' | 'vipc';

type RemotePageModuleItem = {
  id?: string;
  image_url?: string;
  value_zh?: string;
  value_en?: string;
  label_zh?: string;
  label_en?: string;
  content_zh?: string;
  content_en?: string;
  is_visible?: boolean;
  sort_order?: number;
};

type RemotePageModule = {
  module_key: string;
  module_type?: string;
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  is_visible?: boolean;
  sort_order?: number;
  items?: RemotePageModuleItem[];
};

type RemotePageModulesResponse = {
  data?: RemotePageModule[] | null;
};

const ABOUT_MODULE_REGISTRY = [
  { rendererKey: 'about.hero', pageKey: 'about', moduleKey: 'hero', moduleType: 'fixed-content', defaultSortOrder: 10, dynamicEnabled: true },
  { rendererKey: 'about.stats', pageKey: 'about', moduleKey: 'stats', moduleType: 'stats', defaultSortOrder: 20, dynamicEnabled: true },
  { rendererKey: 'about.brandStory', pageKey: 'about', moduleKey: 'brand-story', moduleType: 'fixed-content', defaultSortOrder: 30, dynamicEnabled: true },
  { rendererKey: 'about.factory', pageKey: 'about', moduleKey: 'factory', moduleType: 'gallery-with-captions', defaultSortOrder: 40, dynamicEnabled: true },
  { rendererKey: 'about.timeline', pageKey: 'about', moduleKey: 'timeline', moduleType: 'list', defaultSortOrder: 45, dynamicEnabled: true },
  { rendererKey: 'about.technologies', pageKey: 'about', moduleKey: 'technologies', moduleType: 'list', defaultSortOrder: 50, dynamicEnabled: true },
  { rendererKey: 'about.recognitionAwards', pageKey: 'about', moduleKey: 'recognition-awards', moduleType: 'gallery-with-captions', defaultSortOrder: 70, dynamicEnabled: true },
  { rendererKey: 'about.partners', pageKey: 'about', moduleKey: 'partners', moduleType: 'gallery', defaultSortOrder: 80, dynamicEnabled: true },
  { rendererKey: 'about.founder', pageKey: 'about', moduleKey: 'founder', moduleType: 'fixed-content', defaultSortOrder: 90, dynamicEnabled: true },
  { rendererKey: 'about.services', pageKey: 'about', moduleKey: 'services', moduleType: 'list', defaultSortOrder: 100, dynamicEnabled: true },
] satisfies PageModuleRegistryEntry[];

const ABOUT_ORDER_GROUPS = {
  hero: 10_000,
  preCertifications: 30_000,
  postCertifications: 50_000,
};

function optimizedAboutImage(src: string) {
  if (
    !src.startsWith('/images/about/') ||
    src.startsWith('/images/about/optimized/') ||
    !/\.(jpe?g|png)$/i.test(src)
  ) {
    return src;
  }

  const fileName = src.split('/').pop();
  return fileName ? `/images/about/optimized/${fileName.replace(/\.(jpe?g|png)$/i, '.jpg')}` : src;
}

// ─── scroll reveal ────────────────────────────────────────────────────────────

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children, delay = 0, className = '', from = 'bottom',
}: {
  children: React.ReactNode; delay?: number; className?: string; from?: 'bottom' | 'left' | 'right' | 'none';
}) {
  const { ref, visible } = useReveal();
  const translateMap = { bottom: 'translateY(28px)', left: 'translateX(-28px)', right: 'translateX(28px)', none: 'none' };
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0)' : translateMap[from],
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function useAboutPageModules(initialModules: RemotePageModule[] | null | undefined) {
  const [pageModules, setPageModules] = useState<RemotePageModule[] | null>(initialModules ?? null);

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
    const url = queryString ? `/api/page-modules/about?${queryString}` : '/api/page-modules/about';

    async function loadModules() {
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as RemotePageModulesResponse;
        if (Array.isArray(data?.data)) setPageModules(data.data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('[about] page modules unavailable', err);
        }
      }
    }

    loadModules();
    return () => { controller.abort(); };
  }, [initialModules]);

  return pageModules;
}

function resolvedModuleByKey(resolvedModules: ResolvedPageModule<RemotePageModule>[], moduleKey: string) {
  return resolvedModules.find((resolved) => resolved.registry.moduleKey === moduleKey);
}

function pageModuleFromResolved(resolvedModules: ResolvedPageModule<RemotePageModule>[], moduleKey: string) {
  return resolvedModuleByKey(resolvedModules, moduleKey)?.pageModule ?? null;
}

function visibleResolvedModule(resolvedModules: ResolvedPageModule<RemotePageModule>[], moduleKey: string) {
  const resolved = resolvedModuleByKey(resolvedModules, moduleKey);
  return resolved ? isResolvedPageModuleVisible(resolved) : false;
}

function clampedSortOrder(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(9999, parsed));
}

function moduleVisualOrder(
  resolvedModules: ResolvedPageModule<RemotePageModule>[],
  moduleKey: string,
  groupBase: number,
  fallbackSortOrder: number,
) {
  const resolved = resolvedModuleByKey(resolvedModules, moduleKey);
  return groupBase + clampedSortOrder(resolved?.sortOrder, fallbackSortOrder);
}

function hasModuleItemArray(pageModule: RemotePageModule | null) {
  return Array.isArray(pageModule?.items);
}

function moduleItemSortOrder(item: RemotePageModuleItem) {
  const sortOrder = Number(item.sort_order);
  return Number.isFinite(sortOrder) ? sortOrder : 0;
}

function allModuleItems(pageModule: RemotePageModule | null) {
  if (!pageModule || pageModule.is_visible === false || !Array.isArray(pageModule.items)) return [];
  return [...pageModule.items].sort((a, b) => moduleItemSortOrder(a) - moduleItemSortOrder(b));
}

function moduleItems(pageModule: RemotePageModule | null) {
  return allModuleItems(pageModule)
    .filter((item) => item.is_visible !== false)
}

function itemById(items: RemotePageModuleItem[], id: string) {
  return items.find((item) => item.id === id);
}

function localText(item: RemotePageModuleItem | undefined, zh: boolean, _fallback: string) {
  void _fallback;
  if (!item) return '';
  return (zh ? item.label_zh : item.label_en) || '';
}

function localContent(item: RemotePageModuleItem | undefined, zh: boolean, _fallback: string) {
  void _fallback;
  if (!item) return '';
  return (zh ? item.content_zh : item.content_en) || '';
}

function localValue(item: RemotePageModuleItem | undefined, zh: boolean, _fallback: string) {
  void _fallback;
  if (!item) return '';
  return (zh ? item.value_zh : item.value_en) || '';
}

export default function AboutPageContent({
  initialModules = null,
}: {
  initialModules?: RemotePageModule[] | null;
}) {
  const { lang } = useLanguage();
  const zh = lang === 'zh';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTech, setActiveTech] = useState<Tech | null>(null);
  const pageModules = useAboutPageModules(initialModules);
  const dynamicModules = useMemo(
    () => resolveDynamicPageModules(pageModules, ABOUT_MODULE_REGISTRY),
    [pageModules],
  );
  const heroModule = pageModuleFromResolved(dynamicModules, 'hero');
  const statsModule = pageModuleFromResolved(dynamicModules, 'stats');
  const brandStoryModule = pageModuleFromResolved(dynamicModules, 'brand-story');
  const factoryModule = pageModuleFromResolved(dynamicModules, 'factory');
  const timelineModule = pageModuleFromResolved(dynamicModules, 'timeline');
  const technologiesModule = pageModuleFromResolved(dynamicModules, 'technologies');
  const recognitionAwardsModule = pageModuleFromResolved(dynamicModules, 'recognition-awards');
  const founderModule = pageModuleFromResolved(dynamicModules, 'founder');
  const servicesModule = pageModuleFromResolved(dynamicModules, 'services');
  const partnersModule = pageModuleFromResolved(dynamicModules, 'partners');
  const heroItems = moduleItems(heroModule);
  const statsItems = moduleItems(statsModule);
  const storyItems = moduleItems(brandStoryModule);
  const factoryItems = moduleItems(factoryModule);
  const timelineItems = moduleItems(timelineModule);
  const techModuleItems = moduleItems(technologiesModule);
  const recognitionAwardItems = allModuleItems(recognitionAwardsModule);
  const founderItems = moduleItems(founderModule);
  const serviceModuleItems = moduleItems(servicesModule);
  const partnerItems = moduleItems(partnersModule);
  const showHero = visibleResolvedModule(dynamicModules, 'hero');
  const heroImage = optimizedAboutImage(itemById(heroItems, 'about-hero-image')?.image_url || '');
  const storyImage = optimizedAboutImage(itemById(storyItems, 'story-image')?.image_url || '');
  const storyBadge = itemById(storyItems, 'story-badge');
  const showStats = visibleResolvedModule(dynamicModules, 'stats');
  const aboutStats = !showStats
    ? []
    : hasModuleItemArray(statsModule)
    ? statsItems.map((item, index) => ({
        id: item.id ?? `about-stat-${String(index + 1).padStart(2, '0')}`,
        value: localValue(item, zh, ''),
        en: item.label_en || '',
        zh: item.label_zh || '',
      })).filter((item) => item.value || item.en || item.zh)
    : [];
  const showBrandStory = visibleResolvedModule(dynamicModules, 'brand-story');
  const storyParagraphs = ['story-paragraph-01', 'story-paragraph-02', 'story-paragraph-03']
    .map((id) => ({
      id,
      text: localContent(itemById(storyItems, id), zh, ''),
    }))
    .filter((item) => Boolean(item.text));
  const showFactory = visibleResolvedModule(dynamicModules, 'factory');
  const factoryHeroImage = optimizedAboutImage(itemById(factoryItems, 'factory-image-hero')?.image_url || '');
  const factoryGridImages = ['factory-image-01', 'factory-image-02', 'factory-image-03', 'factory-image-04']
    .map((id) => ({
      id,
      src: optimizedAboutImage(itemById(factoryItems, id)?.image_url || ''),
    }))
    .filter((item): item is { id: string; src: string } => Boolean(item.src));
  const showTimeline = visibleResolvedModule(dynamicModules, 'timeline');
  const timelineEntries = hasModuleItemArray(timelineModule)
    ? timelineItems
        .filter((item) => typeof item.id === 'string' && item.id.startsWith('timeline-') && item.id !== 'timeline-kicker' && item.id !== 'timeline-heading')
        .map((item, index) => ({
          id: item.id ?? `timeline-${index + 1}`,
          year: localValue(item, zh, ''),
          text: localContent(item, zh, ''),
        }))
        .filter((item) => item.year || item.text)
    : [];
  const showTechnologies = visibleResolvedModule(dynamicModules, 'technologies');
  const techKeyById: Record<string, Tech> = {
    'tech-viie': 'viie',
    'tech-vols': 'vols',
    'tech-vipc': 'vipc',
  };
  const technologyCards = hasModuleItemArray(technologiesModule)
    ? techModuleItems
        .filter((item) => item.id && techKeyById[item.id])
        .map((item) => {
          const tech = item.id ? techKeyById[item.id] : 'viie';
          return {
            id: item.id ?? tech,
            tech,
            nameEn: item.label_en || '',
            nameZh: item.label_zh || '',
            descEn: item.content_en || '',
            descZh: item.content_zh || '',
          };
        })
    : [];
  const showFounder = visibleResolvedModule(dynamicModules, 'founder');
  const founderPhoto = optimizedAboutImage(itemById(founderItems, 'founder-photo')?.image_url || '');
  const founderTags = ['founder-tag-01', 'founder-tag-02', 'founder-tag-03']
    .map((id) => {
      return localText(itemById(founderItems, id), zh, '');
    })
    .filter(Boolean);
  const showServices = visibleResolvedModule(dynamicModules, 'services');
  const serviceCards = hasModuleItemArray(servicesModule)
    ? serviceModuleItems.map((item, index) => {
        return {
          id: item.id ?? `service-${String(index + 1).padStart(2, '0')}`,
          n: localValue(item, zh, ''),
          en: item.label_en || '',
          zh: item.label_zh || '',
          desc_en: item.content_en || '',
          desc_zh: item.content_zh || '',
        };
      }).filter((item) => item.n || item.en || item.zh || item.desc_en || item.desc_zh)
    : [];
  const showPartners = visibleResolvedModule(dynamicModules, 'partners');
  const partnerImages = hasModuleItemArray(partnersModule)
    ? partnerItems
        .filter((item) => Boolean(item.image_url))
        .map((item, index) => ({
          id: item.id ?? `partner-${String(index + 1).padStart(2, '0')}`,
          src: optimizedAboutImage(item.image_url as string),
          alt: localText(item, zh, ''),
        }))
    : [];
  const showRecognitionAwards = visibleResolvedModule(dynamicModules, 'recognition-awards');
  const awards = showRecognitionAwards && hasModuleItemArray(recognitionAwardsModule)
    ? recognitionAwardItems
        .filter((item) => item.image_url)
        .map((item, index) => ({
          id: item.id ?? `recognition-award-${index + 1}`,
          src: optimizedAboutImage(item.image_url as string),
          zh: item.label_zh || '',
          en: item.label_en || '',
          isVisible: item.is_visible !== false,
        }))
        .filter((award) => award.isVisible)
    : [];

  const openTech = (tech: Tech) => {
    setActiveTech(tech);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#241F1B]">
      <Navbar />

      {/* ── S1 Hero ───────────────────────────────────────────── */}
      {showHero ? (
      <section
        className="relative h-[90vh] min-h-[600px] flex items-end"
        style={{ order: moduleVisualOrder(dynamicModules, 'hero', ABOUT_ORDER_GROUPS.hero, 10) }}
        data-page-module="about:hero"
        data-page-key="about"
        data-module-key="hero"
      >
        {heroImage ? (
          <Image
            src={heroImage}
            alt={localText(itemById(heroItems, 'about-hero-image'), zh, '')}
            fill
            priority
            sizes="100vw"
            quality={78}
            className="object-cover"
            unoptimized={!canUseNextImageOptimization(heroImage)}
            data-page-module-item="about-hero-image"
            data-page-module-field="image_url"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#241F1B] via-[#241F1B]/50 to-[#241F1B]/10" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 w-full">
          <p
            className="text-[#E36F2C] text-xs tracking-[0.4em] uppercase font-medium mb-5"
            data-page-module-item="about-hero-eyebrow"
            data-page-module-field={zh ? 'label_zh' : 'label_en'}
          >
            {localText(itemById(heroItems, 'about-hero-eyebrow'), zh, '')}
          </p>
          <h1
            className="text-4xl sm:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-5 break-words"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
            data-page-module-item="about-hero-headline"
            data-page-module-field={zh ? 'label_zh' : 'label_en'}
          >
            {localText(itemById(heroItems, 'about-hero-headline'), zh, '')}
          </h1>
          <p
            className="text-white/60 text-lg sm:text-xl max-w-xl leading-relaxed"
            data-page-module-item="about-hero-subtitle"
            data-page-module-field={zh ? 'label_zh' : 'label_en'}
          >
            {localText(
              itemById(heroItems, 'about-hero-subtitle'),
              zh,
              '',
            )}
          </p>
        </div>
      </section>
      ) : null}

      {/* ── Anchor Nav ───────────────────────────────────────── */}

      {/* ── S2 Stats bar ─────────────────────────────────────── */}
      {aboutStats.length > 0 ? (
        <section
          className="bg-[#F5F2ED] border-b border-[#E5E0DA]"
          style={{ order: moduleVisualOrder(dynamicModules, 'stats', ABOUT_ORDER_GROUPS.preCertifications, 20) }}
          data-page-module="about:stats"
          data-page-key="about"
          data-module-key="stats"
        >
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-3 lg:grid-cols-6 divide-x divide-[#E5E0DA]">
              {aboutStats.map((s, i) => (
                <Reveal key={`${s.value}-${i}`} delay={i * 50} className="py-8 px-4 text-center">
                  <div
                    className="text-2xl sm:text-3xl font-bold text-[#E36F2C] mb-1"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                    data-page-module-item={s.id}
                    data-page-module-field={zh ? 'value_zh' : 'value_en'}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-[#8A8580] text-[11px] tracking-wider uppercase leading-tight"
                    data-page-module-item={s.id}
                    data-page-module-field={zh ? 'label_zh' : 'label_en'}
                  >
                    {zh ? s.zh : s.en}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── S3 Brand story ───────────────────────────────────── */}
      {showBrandStory ? (
      <section
        id="brand-story"
        className="bg-[#F5F2ED] py-24 px-6"
        style={{ order: moduleVisualOrder(dynamicModules, 'brand-story', ABOUT_ORDER_GROUPS.preCertifications, 30) }}
        data-page-module="about:brand-story"
        data-page-key="about"
        data-module-key="brand-story"
      >
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <p
                className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3"
                data-page-module-item="story-kicker"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(itemById(storyItems, 'story-kicker'), zh, '')}
              </p>
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#241F1B] mb-8 leading-tight"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
                data-page-module-item="story-heading"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(
                  itemById(storyItems, 'story-heading'),
                  zh,
                  '',
                )}
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div
                className="space-y-5 text-[#241F1B]/70 text-base leading-relaxed"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {storyParagraphs.map((paragraph) => (
                  <p
                    key={paragraph.id}
                    data-page-module-item={paragraph.id}
                    data-page-module-field={zh ? 'content_zh' : 'content_en'}
                  >
                    {paragraph.text}
                  </p>
                ))}
              </div>
            </Reveal>
          </div>

          {storyImage ? (
          <Reveal delay={80} from="right" className="relative">
            <div
              className="relative aspect-[4/5] overflow-hidden"
              data-page-module-item="story-image"
              data-page-module-field="image_url"
            >
              <Image
                src={storyImage}
                alt={localText(itemById(storyItems, 'story-image'), zh, '')}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                quality={78}
                className="object-cover"
                unoptimized={!canUseNextImageOptimization(storyImage)}
              />
            </div>
            {/* stat badge */}
            <div className="absolute -bottom-5 -left-5 bg-[#E36F2C] text-white px-6 py-4 shadow-xl">
              <div
                className="text-3xl font-bold leading-none"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
                data-page-module-item="story-badge"
                data-page-module-field={zh ? 'value_zh' : 'value_en'}
              >
                {localValue(storyBadge, zh, '')}
              </div>
              <div
                className="text-xs tracking-widest opacity-80 mt-1"
                data-page-module-item="story-badge"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(storyBadge, zh, '')}
              </div>
            </div>
          </Reveal>
          ) : null}
        </div>
      </section>
      ) : null}

      {/* ── S4 Factory ───────────────────────────────────────── */}
      {showFactory ? (
      <section
        className="bg-[#241F1B] py-24 px-6"
        style={{ order: moduleVisualOrder(dynamicModules, 'factory', ABOUT_ORDER_GROUPS.preCertifications, 40) }}
        data-page-module="about:factory"
        data-page-key="about"
        data-module-key="factory"
      >
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p
              className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3"
              data-page-module-item="factory-kicker"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(factoryItems, 'factory-kicker'), zh, '')}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#F5F2ED] leading-tight"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
                data-page-module-item="factory-heading"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(itemById(factoryItems, 'factory-heading'), zh, '')}
              </h2>
              <p
                className="text-[#8A8580] text-sm max-w-xs leading-relaxed"
                data-page-module-item="factory-summary"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(
                  itemById(factoryItems, 'factory-summary'),
                  zh,
                  '',
                )}
              </p>
            </div>
          </Reveal>

          {/* factory grid B: full-width hero + 2-col small grid */}
          <div className="flex flex-col gap-2">
            {factoryHeroImage ? (
            <Reveal>
              <div
                className="relative w-full rounded-sm overflow-hidden"
                style={{ aspectRatio: '16/9' }}
                data-page-module-item="factory-image-hero"
                data-page-module-field="image_url"
              >
                <ProtectedImage src={factoryHeroImage} alt={localText(itemById(factoryItems, 'factory-image-hero'), zh, '')} fill sizes="(min-width: 1024px) 1152px, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-700" containerClassName="group" />
              </div>
            </Reveal>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              {factoryGridImages.map((item, i) => (
                <Reveal key={`${item.id}-${i}`} delay={i * 60}>
                  <div
                    className="relative rounded-sm overflow-hidden"
                    style={{ aspectRatio: '4/3' }}
                    data-page-module-item={item.id}
                    data-page-module-field="image_url"
                  >
                    <ProtectedImage src={item.src} alt={localText(itemById(factoryItems, item.id), zh, '')} fill sizes="(min-width: 1024px) 576px, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" containerClassName="group" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* ── S5 Timeline ──────────────────────────────────────── */}
      {showTimeline && timelineEntries.length > 0 ? (
      <section
        className="bg-[#F5F2ED] py-24 px-6"
        style={{ order: moduleVisualOrder(dynamicModules, 'timeline', ABOUT_ORDER_GROUPS.preCertifications, 45) }}
        data-page-module="about:timeline"
        data-page-key="about"
        data-module-key="timeline"
      >
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-14">
            <p
              className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3"
              data-page-module-item="timeline-kicker"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(timelineItems, 'timeline-kicker'), zh, '')}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#241F1B]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
              data-page-module-item="timeline-heading"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(timelineItems, 'timeline-heading'), zh, '')}
            </h2>
          </Reveal>

          <div className="space-y-0">
            {timelineEntries.map((item, i) => (
              <Reveal key={`${item.year}-${i}`} delay={i * 40}>
                <div
                  className={`grid sm:grid-cols-[120px_1fr] gap-0 border-t border-[#E5E0DA] py-7 group ${i === timelineEntries.length - 1 ? 'border-b' : ''}`}
                  data-page-module-item={item.id}
                >
                  <div className="flex items-start pt-1">
                    <span
                      className="text-3xl font-bold text-[#E36F2C] group-hover:text-[#C85A1F] transition-colors"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                      data-page-module-field={zh ? 'value_zh' : 'value_en'}
                    >
                      {item.year}
                    </span>
                  </div>
                  <p
                    className="text-[#241F1B]/70 text-sm sm:text-base leading-relaxed"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    data-page-module-field={zh ? 'content_zh' : 'content_en'}
                  >
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ── Technologies ─────────────────────────────────────── */}
      {showTechnologies ? (
      <section
        id="technologies"
        className="bg-[#F5F2ED] py-20 px-6"
        style={{ order: moduleVisualOrder(dynamicModules, 'technologies', ABOUT_ORDER_GROUPS.preCertifications, 50) }}
        data-page-module="about:technologies"
        data-page-key="about"
        data-module-key="technologies"
      >
        <div className="max-w-4xl mx-auto">
          <Reveal className="mb-12">
            <p
              className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-4"
              data-page-module-item="tech-kicker"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(techModuleItems, 'tech-kicker'), zh, '')}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#241F1B] mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
              data-page-module-item="tech-heading"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(techModuleItems, 'tech-heading'), zh, '')}
            </h2>
            <p
              className="text-[#8A8580] text-sm max-w-2xl leading-relaxed"
              data-page-module-item="tech-summary"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(
                itemById(techModuleItems, 'tech-summary'),
                zh,
                '',
              )}
            </p>
          </Reveal>

          <div className="border-t border-[#E5E0DA]">
            {technologyCards.map((item) => (
              <Reveal key={item.tech}>
                <button
                  type="button"
                  onClick={() => openTech(item.tech)}
                  className="group w-full flex items-start gap-5 py-8 border-b border-[#E5E0DA] text-left hover:bg-[#EDE8E0]/50 transition-colors duration-200 px-2"
                  data-page-module-item={item.id}
                >
                  <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#E36F2C] mt-2.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-2">
                      <h3
                        className="text-xl sm:text-2xl font-bold text-[#241F1B]"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                        data-page-module-field={zh ? 'label_zh' : 'label_en'}
                      >
                        {zh ? item.nameZh : item.nameEn}
                      </h3>
                    </div>
                    <p
                      className="text-[#241F1B]/60 text-sm sm:text-base leading-relaxed"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      data-page-module-field={zh ? 'content_zh' : 'content_en'}
                    >
                      {zh ? item.descZh : item.descEn}
                    </p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ── S8 Certifications ────────────────────────────────── */}
      {showRecognitionAwards && awards.length > 0 ? (
      <section id="certifications" className="bg-[#241F1B] py-24 px-6" style={{ order: 40_000 }}>
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#F5F2ED]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {zh ? recognitionAwardsModule?.title_zh : recognitionAwardsModule?.title_en}
              </h2>
              <p className="text-[#8A8580] text-sm max-w-xs leading-relaxed">
                {zh ? recognitionAwardsModule?.description_zh : recognitionAwardsModule?.description_en}
              </p>
            </div>
          </Reveal>

          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            data-page-module="about:recognition-awards"
            data-page-key="about"
            data-module-key="recognition-awards"
          >
            {awards.map((award, i) => (
              <Reveal key={`${award.id}-${i}`} delay={i * 30}>
                <div
                  className="bg-white p-3 min-h-full overflow-hidden group flex flex-col gap-3"
                  data-page-module-item={award.id}
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={optimizedAboutImage(award.src)}
                      alt={zh ? award.zh : award.en}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                      quality={78}
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      unoptimized={!canUseNextImageOptimization(optimizedAboutImage(award.src))}
                      data-page-module-field="image_url"
                    />
                  </div>
                  <p
                    className="text-[#8A8580] text-xs leading-snug text-center min-h-[2.5rem] flex items-center justify-center"
                    data-page-module-field={zh ? 'label_zh' : 'label_en'}
                  >
                    {zh ? award.zh : award.en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ── S9 Partners ──────────────────────────────────────── */}
      {showPartners && partnerImages.length > 0 ? (
      <section
        className="bg-[#F5F2ED] py-24 px-6"
        style={{ order: moduleVisualOrder(dynamicModules, 'partners', ABOUT_ORDER_GROUPS.postCertifications, 80) }}
        data-page-module="about:partners"
        data-page-key="about"
        data-module-key="partners"
      >
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p
              className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3"
              data-page-module-item="partners-kicker"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(partnerItems, 'partners-kicker'), zh, '')}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#241F1B]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
                data-page-module-item="partners-heading"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(itemById(partnerItems, 'partners-heading'), zh, '')}
              </h2>
              <p
                className="text-[#8A8580] text-sm max-w-xs leading-relaxed"
                data-page-module-item="partners-summary"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(
                  itemById(partnerItems, 'partners-summary'),
                  zh,
                  '',
                )}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {partnerImages.map((partner, i) => (
              <Reveal key={`${partner.src}-${i}`} delay={Math.floor(i / 6) * 60}>
                <div
                  className="bg-white border border-[#E5E0DA] rounded-lg p-3 aspect-square relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                  data-page-module-item={partner.id}
                  data-page-module-field="image_url"
                >
                  <Image
                    src={partner.src}
                    alt={partner.alt}
                    fill
                    sizes="(min-width: 1024px) 12.5vw, (min-width: 640px) 16vw, 25vw"
                    quality={78}
                    className="object-contain p-3"
                    unoptimized={!canUseNextImageOptimization(partner.src)}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ── S6 Founder ───────────────────────────────────────── */}
      {showFounder ? (
      <section
        id="founder"
        className="bg-[#241F1B] py-24 px-6"
        style={{ order: moduleVisualOrder(dynamicModules, 'founder', ABOUT_ORDER_GROUPS.postCertifications, 90) }}
        data-page-module="about:founder"
        data-page-key="about"
        data-module-key="founder"
      >
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p
              className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3"
              data-page-module-item="founder-section-kicker"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(founderItems, 'founder-section-kicker'), zh, '')}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#F5F2ED]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
              data-page-module-item="founder-section-heading"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(founderItems, 'founder-section-heading'), zh, '')}
            </h2>
          </Reveal>

          {/* Founder */}
          <Reveal delay={100} className={`${founderPhoto ? 'grid lg:grid-cols-[256px_1fr]' : 'grid'} gap-10 items-start`}>
            {founderPhoto ? (
            <div
              className="w-64 h-64 rounded-full overflow-hidden shrink-0 mx-auto lg:mx-0 relative"
              data-page-module-item="founder-photo"
              data-page-module-field="image_url"
            >
              <Image
                src={founderPhoto}
                alt={localText(itemById(founderItems, 'founder-name'), zh, '')}
                fill
                sizes="256px"
                quality={78}
                className="object-cover object-top"
                unoptimized={!canUseNextImageOptimization(founderPhoto)}
              />
            </div>
            ) : null}
            <div className="pt-2">
              <p
                className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3"
                data-page-module-item="founder-role"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(itemById(founderItems, 'founder-role'), zh, '')}
              </p>
              <p
                className="text-[#F5F2ED] text-3xl font-bold mb-2"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
                data-page-module-item="founder-name"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(itemById(founderItems, 'founder-name'), zh, '')}
              </p>
              <p
                className="text-[#8A8580] text-sm tracking-wider mb-6"
                data-page-module-item="founder-subtitle"
                data-page-module-field={zh ? 'label_zh' : 'label_en'}
              >
                {localText(itemById(founderItems, 'founder-subtitle'), zh, '')}
              </p>
              <p
                className="text-[#F5F2ED]/65 text-base leading-relaxed max-w-2xl mb-6"
                style={{ fontFamily: 'Inter, sans-serif' }}
                data-page-module-item="founder-bio"
                data-page-module-field={zh ? 'content_zh' : 'content_en'}
              >
                {localContent(
                  itemById(founderItems, 'founder-bio'),
                  zh,
                  '',
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {founderTags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="text-xs px-3 py-1.5 border border-[#3A302A] text-[#8A8580] tracking-wider"
                    data-page-module-item={`founder-tag-${String(index + 1).padStart(2, '0')}`}
                    data-page-module-field={zh ? 'label_zh' : 'label_en'}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      ) : null}

      {/* ── S7 Three Services ────────────────────────────────── */}
      {showServices ? (
      <section
        className="bg-[#F5F2ED] py-24 px-6"
        style={{ order: moduleVisualOrder(dynamicModules, 'services', ABOUT_ORDER_GROUPS.postCertifications, 100) }}
        data-page-module="about:services"
        data-page-key="about"
        data-module-key="services"
      >
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <p
              className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3"
              data-page-module-item="services-kicker"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(serviceModuleItems, 'services-kicker'), zh, '')}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#241F1B]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
              data-page-module-item="services-heading"
              data-page-module-field={zh ? 'label_zh' : 'label_en'}
            >
              {localText(itemById(serviceModuleItems, 'services-heading'), zh, '')}
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {serviceCards.map((s, i) => (
              <Reveal key={`${s.id}-${i}`} delay={i * 80}>
                <div
                  className="border border-[#E5E0DA] bg-white p-8 flex flex-col gap-5 h-full hover:border-[#E36F2C]/40 hover:shadow-sm transition-all"
                  data-page-module-item={`service-${String(i + 1).padStart(2, '0')}`}
                >
                  <span
                    className="text-4xl font-bold text-[#E36F2C]/20"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                    data-page-module-field={zh ? 'value_zh' : 'value_en'}
                  >
                    {s.n}
                  </span>
                  <h3
                    className="text-[#241F1B] font-bold text-lg leading-snug"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                    data-page-module-field={zh ? 'label_zh' : 'label_en'}
                  >
                    {zh ? s.zh : s.en}
                  </h3>
                  <p
                    className="text-[#8A8580] text-sm leading-relaxed flex-1"
                    data-page-module-field={zh ? 'content_zh' : 'content_en'}
                  >
                    {zh ? s.desc_zh : s.desc_en}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      <div style={{ order: 80_000 }}>
        <Footer />
      </div>

      <div style={{ order: 90_000 }}>
        <TechDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          tech={activeTech}
          lang={lang}
        />
      </div>
    </div>
  );
}
