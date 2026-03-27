'use client';

import { useState, useEffect, useCallback } from 'react';
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
      if (e.key === 'ArrowLeft') { setPaused(true); prev(); }
      if (e.key === 'ArrowRight') { setPaused(true); next(); }
      if (e.key === ' ') setPaused((p) => !p);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  const slide = slides[current];
  const idx = String(current + 1).padStart(2, '0');
  const total = String(slides.length).padStart(2, '0');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">

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
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      </div>

      {/* Top bar — thin gold line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#c9a84c] via-[#c9a84c]/40 to-transparent z-10" />

      {/* Main content */}
      <div
        className="absolute inset-0 flex flex-col justify-center px-16 z-10 transition-opacity duration-500"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        {/* Series badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase font-bold border border-[#c9a84c]/50 px-3 py-1">
            {slide.gen}
          </span>
          <span className="text-white/40 text-xs tracking-[0.3em] uppercase">{slide.tag}</span>
        </div>

        {/* Model + size */}
        <div className="flex items-end gap-8 mb-5">
          <h1 className="text-[10rem] font-black leading-none tracking-tight text-white"
              style={{ textShadow: '0 0 80px rgba(201,168,76,0.3)' }}>
            {slide.model}
          </h1>
          <div className="mb-6">
            <div className="text-[#c9a84c] text-4xl font-black tracking-wider">{slide.size}</div>
            <div className="text-white/40 text-sm tracking-[0.3em] mt-1">{slide.capacity}</div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-white/70 text-2xl font-light tracking-[0.15em] mb-10 max-w-2xl">
          {slide.tagline}
        </p>

        {/* Features */}
        <div className="flex gap-0">
          {slide.features.map((f, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-3 pr-8">
                <div className="w-1 h-8 bg-[#c9a84c]" />
                <span className="text-white text-lg tracking-wider font-medium">{f}</span>
              </div>
              {i < slide.features.length - 1 && (
                <div className="w-px h-6 bg-white/15 mr-8" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between px-16 pb-12">

        {/* Left: counter + dots + pause hint */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setPaused(true); goTo(i); }}
                className={`transition-all duration-300 ${
                  i === current
                    ? 'w-8 h-1 bg-[#c9a84c]'
                    : 'w-4 h-px bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[#c9a84c] text-4xl font-black tracking-wider tabular-nums">{idx}</span>
            <span className="text-white/25 text-lg">/</span>
            <span className="text-white/25 text-lg tracking-wider tabular-nums">{total}</span>
            {paused && (
              <span className="ml-4 text-white/25 text-xs tracking-[0.2em] uppercase">已暂停</span>
            )}
          </div>
        </div>

        {/* Right: price + logo */}
        <div
          className="flex flex-col items-end gap-3 transition-opacity duration-500"
          style={{ opacity: transitioning ? 0 : 1 }}
        >
          <div className="text-right">
            <div className="text-white/30 text-xs tracking-[0.3em] uppercase mb-1">参考价格</div>
            <div className="text-[#c9a84c] text-3xl font-black tracking-wider">{slide.price}</div>
          </div>
          <div className="w-px h-8 bg-white/10 self-center" />
          <div className="text-right">
            <div className="text-white font-black text-xl tracking-[0.25em] uppercase leading-none">VESSEL</div>
            <div className="text-white/40 text-xs tracking-[0.3em] mt-0.5">微宿®</div>
          </div>
        </div>
      </div>

      {/* Side nav arrows (hover to reveal) */}
      <button
        onClick={() => { setPaused(true); prev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center text-white/20 hover:text-[#c9a84c] hover:bg-white/5 transition-all duration-200"
        aria-label="上一张"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => { setPaused(true); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center text-white/20 hover:text-[#c9a84c] hover:bg-white/5 transition-all duration-200"
        aria-label="下一张"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Progress bar */}
      {!paused && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5 z-30">
          <div
            key={current}
            className="h-full bg-[#c9a84c]/60"
            style={{
              animation: `progress ${INTERVAL}ms linear`,
              transformOrigin: 'left',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
