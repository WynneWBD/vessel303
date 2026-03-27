'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

const slides = [
  {
    model: 'E7',
    gen: 'Gen6',
    tag: '旗舰款',
    size: '38.8㎡',
    capacity: '2–4 人',
    tagline: '全能型旅居新旗舰，经典范式的自我超越',
    features: ['流线型轮廓 · 飞翼式门檐', '日式三分离卫浴', 'VIIE Gen6 全屋智控'],
    price: '¥ 488,000 起',
    image: '/images/e7-gen6.jpg',
  },
  {
    model: 'E6',
    gen: 'Gen6',
    tag: '明星款',
    size: '29.6㎡',
    capacity: '2–4 人',
    tagline: '最好的传承，是新生',
    features: ['180° 全景环绕窗', '第六代锁扣防水屋顶', '一车双运 · 降低物流成本'],
    price: '¥ 388,000 起',
    image: '/images/e6-gen6.jpg',
  },
  {
    model: 'E3',
    gen: 'Gen6',
    tag: 'mini 款',
    size: '19㎡',
    capacity: '1–2 人',
    tagline: '够宽敞，也够满足',
    features: ['游艇式流线立面', '180° 弧形景观窗', '智能电动遮帘'],
    price: '¥ 228,000 起',
    image: '/images/e6-gen6.jpg',
  },
  {
    model: 'V9',
    gen: 'Gen6',
    tag: '家居款',
    size: '38㎡',
    capacity: '2–4 人',
    tagline: '遵循「钻石切割」的设计理念',
    features: ['17.0㎡ 超大采光面积', '岛台一体厨餐空间', 'AI 语音智能控制'],
    price: '¥ 458,000 起',
    image: '/images/v9-gen6.jpg',
  },
  {
    model: 'V5',
    gen: 'Gen5',
    tag: '全景款',
    size: '24.8㎡',
    capacity: '1–2 人',
    tagline: '以全景视野连接自然，让旅居更纯粹',
    features: ['超广角全景玻璃', '精品内嵌吧台', '6 吨轻量化设计'],
    price: '¥ 288,000 起',
    image: '/images/v9-gen6.jpg',
  },
  {
    model: 'S5',
    gen: 'Gen5',
    tag: '天光款',
    size: '29.6㎡',
    capacity: '2–4 人',
    tagline: '天光倾泻，云景入怀',
    features: ['顶部天窗采光系统', '多面大窗全方位视野', '可定制室内布局'],
    price: '¥ 328,000 起',
    image: '/images/e6-gen6.jpg',
  },
];

const INTERVAL = 5000;

export default function DisplayPage() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);

  // Touch tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTransitioning(false);
    }, 400);
  }, [transitioning]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [paused]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { setPaused(true); prev(); }
      if (e.key === 'ArrowRight') { setPaused(true); next(); }
      if (e.key === ' ')           setPaused((p) => !p);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only handle horizontal swipes (horizontal movement > vertical, and at least 40px)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      setPaused(true);
      dx < 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const slide = slides[current];
  const idx   = String(current + 1).padStart(2, '0');
  const total = String(slides.length).padStart(2, '0');

  return (
    <div
      className="relative overflow-hidden bg-black select-none"
      style={{ width: '100vw', height: '100vh' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <Image
          key={slide.image + slide.model}
          src={slide.image}
          alt={slide.model}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/55 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35" />
      </div>

      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#c9a84c] via-[#c9a84c]/40 to-transparent z-10" />

      {/* ── Main content ── */}
      <div
        className="absolute inset-0 z-10 flex flex-col justify-center transition-opacity duration-500"
        style={{
          opacity: transitioning ? 0 : 1,
          padding: 'clamp(1.5rem, 5vw, 6rem)',
          paddingBottom: 'clamp(5rem, 12vh, 10rem)',
        }}
      >
        {/* Series badge */}
        <div className="flex items-center gap-3 mb-[clamp(0.5rem,1.5vh,1.5rem)]">
          <span
            className="text-[#c9a84c] font-bold uppercase border border-[#c9a84c]/50 tracking-[0.4em]"
            style={{ fontSize: 'clamp(0.55rem, 1vw, 0.8rem)', padding: 'clamp(2px,0.4vh,5px) clamp(6px,0.8vw,12px)' }}
          >
            {slide.gen}
          </span>
          <span
            className="text-white/40 uppercase tracking-[0.3em]"
            style={{ fontSize: 'clamp(0.55rem, 1vw, 0.8rem)' }}
          >
            {slide.tag}
          </span>
        </div>

        {/* Model + size */}
        <div className="flex items-end gap-[clamp(0.75rem,2vw,2rem)] mb-[clamp(0.5rem,1.5vh,1.5rem)]">
          <h1
            className="font-black leading-none tracking-tight text-white"
            style={{
              fontSize: 'clamp(3.5rem, 14vw, 12rem)',
              textShadow: '0 0 80px rgba(201,168,76,0.25)',
            }}
          >
            {slide.model}
          </h1>
          <div style={{ marginBottom: 'clamp(0.5rem, 1.5vw, 1.5rem)' }}>
            <div
              className="text-[#c9a84c] font-black tracking-wider"
              style={{ fontSize: 'clamp(1.2rem, 3.5vw, 3rem)' }}
            >
              {slide.size}
            </div>
            <div
              className="text-white/40 tracking-[0.3em] mt-1"
              style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.875rem)' }}
            >
              {slide.capacity}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-white/70 font-light tracking-[0.12em] max-w-[min(42rem,70vw)]"
          style={{
            fontSize: 'clamp(0.85rem, 2.2vw, 1.75rem)',
            marginBottom: 'clamp(1rem, 3vh, 2.5rem)',
          }}
        >
          {slide.tagline}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-y-3" style={{ gap: 'clamp(0.5rem, 1.5vw, 0px)' }}>
          {slide.features.map((f, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center" style={{ gap: 'clamp(0.4rem, 0.8vw, 0.75rem)', paddingRight: 'clamp(0.75rem, 2vw, 2rem)' }}>
                <div
                  className="bg-[#c9a84c] shrink-0"
                  style={{ width: 'clamp(2px, 0.25vw, 4px)', height: 'clamp(1.2rem, 2.5vh, 2rem)' }}
                />
                <span
                  className="text-white font-medium tracking-wider whitespace-nowrap"
                  style={{ fontSize: 'clamp(0.7rem, 1.6vw, 1.2rem)' }}
                >
                  {f}
                </span>
              </div>
              {i < slide.features.length - 1 && (
                <div
                  className="bg-white/15 shrink-0"
                  style={{ width: '1px', height: 'clamp(1rem, 2vh, 1.5rem)', marginRight: 'clamp(0.75rem, 2vw, 2rem)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between"
        style={{
          padding: `0 clamp(1.5rem, 5vw, 6rem) clamp(1.2rem, 3.5vh, 3rem)`,
        }}
      >
        {/* Left: dots + counter */}
        <div className="flex flex-col" style={{ gap: 'clamp(0.4rem, 1vh, 1rem)' }}>
          <div className="flex items-center" style={{ gap: 'clamp(0.4rem, 0.8vw, 0.75rem)' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setPaused(true); goTo(i); }}
                className={`transition-all duration-300 ${
                  i === current
                    ? 'bg-[#c9a84c]'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                style={{
                  width:  i === current ? 'clamp(1.2rem, 2.5vw, 2rem)' : 'clamp(0.6rem, 1.2vw, 1rem)',
                  height: i === current ? 'clamp(2px, 0.3vh, 4px)' : '1px',
                }}
              />
            ))}
          </div>
          <div className="flex items-baseline" style={{ gap: 'clamp(0.25rem, 0.5vw, 0.5rem)' }}>
            <span
              className="text-[#c9a84c] font-black tracking-wider tabular-nums"
              style={{ fontSize: 'clamp(1.4rem, 4vw, 3rem)' }}
            >
              {idx}
            </span>
            <span
              className="text-white/25"
              style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.25rem)' }}
            >
              /
            </span>
            <span
              className="text-white/25 tracking-wider tabular-nums"
              style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.25rem)' }}
            >
              {total}
            </span>
            {paused && (
              <span
                className="text-white/25 uppercase tracking-[0.2em]"
                style={{ fontSize: 'clamp(0.5rem, 0.9vw, 0.7rem)', marginLeft: 'clamp(0.5rem, 1vw, 1rem)' }}
              >
                已暂停
              </span>
            )}
          </div>
        </div>

        {/* Right: price + logo */}
        <div
          className="flex flex-col items-end transition-opacity duration-500"
          style={{
            opacity: transitioning ? 0 : 1,
            gap: 'clamp(0.4rem, 1vh, 0.75rem)',
          }}
        >
          <div className="text-right">
            <div
              className="text-white/30 uppercase tracking-[0.3em]"
              style={{ fontSize: 'clamp(0.5rem, 0.9vw, 0.7rem)', marginBottom: '0.15rem' }}
            >
              参考价格
            </div>
            <div
              className="text-[#c9a84c] font-black tracking-wider"
              style={{ fontSize: 'clamp(1rem, 2.8vw, 2rem)' }}
            >
              {slide.price}
            </div>
          </div>
          <div
            className="bg-white/10 self-center"
            style={{ width: '1px', height: 'clamp(1rem, 2vh, 2rem)' }}
          />
          <div className="text-right">
            <div
              className="text-white font-black uppercase leading-none tracking-[0.25em]"
              style={{ fontSize: 'clamp(0.75rem, 1.8vw, 1.4rem)' }}
            >
              VESSEL
            </div>
            <div
              className="text-white/40 tracking-[0.3em] mt-0.5"
              style={{ fontSize: 'clamp(0.5rem, 0.9vw, 0.7rem)' }}
            >
              微宿®
            </div>
          </div>
        </div>
      </div>

      {/* Side nav arrows */}
      <button
        onClick={() => { setPaused(true); prev(); }}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-white/20 hover:text-[#c9a84c] hover:bg-white/5 transition-all duration-200"
        style={{ width: 'clamp(2.5rem, 5vw, 4rem)', height: 'clamp(2.5rem, 5vw, 4rem)' }}
        aria-label="上一张"
      >
        <svg style={{ width: 'clamp(1rem, 2vw, 1.5rem)', height: 'clamp(1rem, 2vw, 1.5rem)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => { setPaused(true); next(); }}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-white/20 hover:text-[#c9a84c] hover:bg-white/5 transition-all duration-200"
        style={{ width: 'clamp(2.5rem, 5vw, 4rem)', height: 'clamp(2.5rem, 5vw, 4rem)' }}
        aria-label="下一张"
      >
        <svg style={{ width: 'clamp(1rem, 2vw, 1.5rem)', height: 'clamp(1rem, 2vw, 1.5rem)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Progress bar */}
      {!paused && (
        <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: '2px', background: 'rgba(255,255,255,0.05)' }}>
          <div
            key={current}
            style={{
              height: '100%',
              background: 'rgba(201,168,76,0.6)',
              animation: `dp-progress ${INTERVAL}ms linear`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes dp-progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
