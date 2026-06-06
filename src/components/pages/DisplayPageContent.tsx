'use client';

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DisplaySlide } from '@/lib/display-slides';
import { buildContactHref, normalizeSiteHref, SITE_PRODUCTS_HREF } from '@/lib/site-links';

type DisplayContentRow = DisplaySlide & {
  title_zh?: string;
  title_en?: string;
  summary_zh?: string | null;
  summary_en?: string | null;
  body_zh?: string | null;
  body_en?: string | null;
  cover_image_url?: string | null;
  payload?: Record<string, unknown>;
};

const INTERVAL = 5000;
const DISPLAY_CONTACT_HREF = buildContactHref('display:showcase-contact');

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function textLines(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function mapDisplayRow(row: DisplayContentRow): DisplaySlide | null {
  const payload = row.payload ?? {};
  const model = row.model || asText(payload.model) || row.title_en || row.title_zh || '';
  const image = row.image || row.cover_image_url || '';
  if (!model || !image) return null;

  return {
    model,
    gen: row.gen || asText(payload.gen) || row.summary_en || '',
    tag: row.tag || asText(payload.tag) || row.summary_zh || '',
    size: row.size || asText(payload.size),
    capacity: row.capacity || asText(payload.capacity),
    tagline: row.tagline || row.body_en || row.body_zh || '',
    features: row.features?.length
      ? row.features
      : asTextArray(payload.features).concat(textLines(row.body_zh || row.body_en)).slice(0, 3),
    price: row.price || asText(payload.price),
    image,
    detailHref: normalizeSiteHref(row.detailHref || asText(payload.href) || asText(payload.product_href) || asText(payload.detail_href), SITE_PRODUCTS_HREF) || undefined,
    detailLabel: row.detailLabel || asText(payload.detail_label),
    consultHref: normalizeDisplayContactHref(row.consultHref || asText(payload.consult_href)) || undefined,
    consultLabel: row.consultLabel || asText(payload.consult_label),
  };
}

function normalizeDisplayContactHref(href: string | null | undefined) {
  const normalized = normalizeSiteHref(href, DISPLAY_CONTACT_HREF);
  return normalized === '/contact' ? DISPLAY_CONTACT_HREF : normalized;
}

function DisplayTopNav() {
  return (
    <header className="absolute left-4 right-4 top-4 z-40 flex flex-wrap items-center justify-between gap-3 border border-white/12 bg-[#241F1B]/55 px-4 py-3 text-white shadow-2xl shadow-black/20 backdrop-blur md:left-6 md:right-6 md:px-5">
      <Link prefetch={false} href="/" className="text-sm font-black uppercase tracking-[0.24em] text-white">
        VESSEL Display
      </Link>
      <nav aria-label="Display page navigation" className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
        <Link prefetch={false} href={SITE_PRODUCTS_HREF} className="min-h-9 px-3 py-2 transition hover:text-white">
          Products
        </Link>
        <Link prefetch={false} href="/cases" className="min-h-9 px-3 py-2 transition hover:text-white">
          Cases
        </Link>
        <Link prefetch={false} href={DISPLAY_CONTACT_HREF} className="min-h-9 bg-[#E36F2C] px-3 py-2 text-white transition hover:bg-[#C95E22]">
          Contact
        </Link>
      </nav>
    </header>
  );
}

export default function DisplayPageContent({
  initialSlides = [],
}: {
  initialSlides?: DisplaySlide[];
}) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [slides, setSlides] = useState<DisplaySlide[]>(initialSlides);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const slideCount = slides.length;

  const goTo = useCallback((index: number) => {
    if (transitioning || slideCount === 0) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTransitioning(false);
    }, 400);
  }, [slideCount, transitioning]);

  const prev = useCallback(() => {
    if (slideCount === 0) return;
    goTo((current - 1 + slideCount) % slideCount);
  }, [current, goTo, slideCount]);

  const next = useCallback(() => {
    if (slideCount === 0) return;
    goTo((current + 1) % slideCount);
  }, [current, goTo, slideCount]);

  useEffect(() => {
    if (initialSlides.length > 0) return;
    let cancelled = false;
    fetch('/api/site-content/display-slides')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data: { data?: DisplayContentRow[] }) => {
        if (cancelled) return;
        const mapped = Array.isArray(data.data)
          ? data.data.map(mapDisplayRow).filter((item): item is DisplaySlide => Boolean(item))
          : [];
        setSlides(mapped);
        setCurrent((currentIndex) => currentIndex % Math.max(mapped.length, 1));
      })
      .catch(() => {
        if (!cancelled) setSlides([]);
      });
    return () => {
      cancelled = true;
    };
  }, [initialSlides]);

  useEffect(() => {
    if (paused || slideCount <= 1) return;
    const id = setInterval(() => {
      setCurrent((index) => (index + 1) % slideCount);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [paused, slideCount]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setPaused(true);
        prev();
      }
      if (event.key === 'ArrowRight') {
        setPaused(true);
        next();
      }
      if (event.key === ' ') setPaused((value) => !value);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    const dy = event.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      setPaused(true);
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const slide = slides[current];
  if (!slide) {
    return (
      <div className="relative min-h-screen bg-[#241F1B] text-white">
        <DisplayTopNav />
      </div>
    );
  }

  const idx = String(current + 1).padStart(2, '0');
  const total = String(slideCount).padStart(2, '0');
  const detailHref = normalizeSiteHref(slide.detailHref, SITE_PRODUCTS_HREF);
  const detailLabel = slide.detailLabel || 'View Products';
  const consultHref = normalizeDisplayContactHref(slide.consultHref);
  const consultLabel = slide.consultLabel || 'Start Inquiry';

  return (
    <div
      className="relative h-screen w-screen select-none overflow-hidden bg-[#241F1B]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <DisplayTopNav />

      <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: transitioning ? 0 : 1 }}>
        <Image
          key={slide.image + slide.model}
          src={slide.image}
          alt={slide.model}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#241F1B]/88 via-[#241F1B]/55 to-[#241F1B]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241F1B]/75 via-transparent to-[#241F1B]/35" />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 pb-36 pt-28 transition-opacity duration-500 sm:px-12 lg:px-24" style={{ opacity: transitioning ? 0 : 1 }}>
        {(slide.gen || slide.tag) ? (
          <div className="mb-5 flex items-center gap-3">
            {slide.gen ? (
              <span className="border border-[#E36F2C]/50 px-3 py-1 text-xs font-bold uppercase tracking-[0.32em] text-[#E36F2C]">
                {slide.gen}
              </span>
            ) : null}
            {slide.tag ? (
              <span className="text-xs uppercase tracking-[0.24em] text-white/45">
                {slide.tag}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap items-end gap-4">
          <h1 className="text-6xl font-black leading-none tracking-tight text-white sm:text-8xl lg:text-[12rem]">
            {slide.model}
          </h1>
          {(slide.size || slide.capacity) ? (
            <div className="mb-2">
              {slide.size ? <div className="text-2xl font-black tracking-wider text-[#E36F2C] sm:text-4xl">{slide.size}</div> : null}
              {slide.capacity ? <div className="mt-1 text-xs tracking-[0.24em] text-white/45 sm:text-sm">{slide.capacity}</div> : null}
            </div>
          ) : null}
        </div>

        {slide.tagline ? (
          <p className="mb-8 max-w-2xl text-base font-light leading-8 tracking-[0.08em] text-white/72 sm:text-xl">
            {slide.tagline}
          </p>
        ) : null}

        {slide.features.length > 0 ? (
          <div className="flex max-w-5xl flex-wrap gap-3">
            {slide.features.map((feature, index) => (
              <span key={`${feature}-${index}`} className="border-l-4 border-[#E36F2C] pl-3 text-xs font-medium tracking-wider text-white sm:text-sm">
                {feature}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-5 px-6 pb-7 sm:px-12 md:flex-row md:items-end md:justify-between lg:px-24">
        <div>
          <div className="flex items-center gap-3">
            {slides.map((item, index) => (
              <button
                key={`${item.model}-${index}`}
                type="button"
                aria-label={`Show ${item.model}`}
                onClick={() => {
                  setPaused(true);
                  goTo(index);
                }}
                className={index === current ? 'h-1 w-8 bg-[#E36F2C]' : 'h-px w-4 bg-white/35'}
              />
            ))}
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-wider text-[#E36F2C]">{idx}</span>
            <span className="text-white/25">/</span>
            <span className="text-white/25">{total}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {slide.price ? <div className="text-2xl font-black tracking-wider text-[#E36F2C]">{slide.price}</div> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Link prefetch={false} href={detailHref} className="inline-flex min-h-10 items-center border border-white/30 bg-white/12 px-4 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur transition hover:border-[#E36F2C] hover:bg-[#E36F2C]">
              {detailLabel}
            </Link>
            <Link prefetch={false} href={consultHref} className="inline-flex min-h-10 items-center bg-[#E36F2C] px-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#C95E22]">
              {consultLabel}
            </Link>
          </div>
        </div>
      </div>

      {!paused && slideCount > 1 ? (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-0.5 bg-white/5">
          <div key={current} className="h-full bg-[#C9A84C]/70" style={{ animation: `dp-progress ${INTERVAL}ms linear` }} />
        </div>
      ) : null}

      <style>{`
        @keyframes dp-progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
