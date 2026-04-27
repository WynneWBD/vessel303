'use client';

import { useEffect, useRef } from 'react';
import ViieContent from './tech/ViieContent';
import VolsContent from './tech/VolsContent';
import VipcContent from './tech/VipcContent';

type Tech = 'viie' | 'vols' | 'vipc' | null;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tech: Tech;
  lang: 'en' | 'zh';
}

const TECH_LABELS: Record<Exclude<Tech, null>, { en: string; zh: string }> = {
  viie: { en: 'VesselOS · VIIE', zh: 'VesselOS · 智能交互' },
  vols: { en: 'VOLS · Off-grid Living System', zh: 'VOLS · 离网系统' },
  vipc: { en: 'VIPC · Pre-fab Construction', zh: 'VIPC · 整装预制' },
};

export default function TechDrawer({ isOpen, onClose, tech, lang }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen, tech]);

  const zh = lang === 'zh';
  const label = tech ? TECH_LABELS[tech] : null;
  const title = label ? (zh ? label.zh : label.en) : '';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[#241F1B]/65 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full lg:w-[60vw] bg-[#F5F2ED] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* Top bar */}
        <div className="shrink-0 bg-[#241F1B] border-b border-[#3A302A] px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[#E36F2C] text-[10px] tracking-[0.35em] uppercase font-medium mb-1">
              {zh ? '核心技术' : 'Core Technology'}
            </p>
            <h2
              className="text-[#F5F2ED] text-lg lg:text-xl font-bold truncate"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-[#8A8580] hover:text-[#E36F2C] transition-colors p-2"
            aria-label={zh ? '关闭' : 'Close'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {tech === 'viie' && <ViieContent lang={lang} />}
          {tech === 'vols' && <VolsContent lang={lang} />}
          {tech === 'vipc' && <VipcContent lang={lang} />}
        </div>
      </div>
    </>
  );
}
