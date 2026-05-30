'use client';

import { useEffect, useRef } from 'react';
import InnovationCmsBlock from './tech/InnovationCmsBlock';

type Tech = 'viie' | 'vols' | 'vipc' | null;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tech: Tech;
  lang: 'en' | 'zh';
  closeLabel?: string;
}

export default function TechDrawer({ isOpen, onClose, tech, lang: _lang, closeLabel }: Props) {
  void _lang
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
        <div className="shrink-0 bg-[#241F1B] border-b border-[#3A302A] px-6 lg:px-10 py-5 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="shrink-0 text-[#8A8580] hover:text-[#E36F2C] transition-colors p-2"
            aria-label={closeLabel || undefined}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {tech ? <InnovationCmsBlock slug={tech} /> : null}
        </div>
      </div>
    </>
  );
}
