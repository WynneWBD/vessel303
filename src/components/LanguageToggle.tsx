'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const activeLabel = lang === 'zh' ? 'Chinese' : 'English';

  const selectLanguage = (value: 'zh' | 'en') => {
    setLang(value);
    setOpen(false);
  };

  return (
    <div className="relative shrink-0 text-xs tracking-wide">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-9 min-w-[98px] items-center justify-center gap-3 rounded-[3px] bg-white px-4 text-[#334155] shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition hover:bg-white/92"
        aria-expanded={open}
      >
        <span>{lang === 'zh' ? 'language' : 'language'}</span>
        <span aria-hidden="true" className="text-[10px] text-[#64748B]">
          v
        </span>
      </button>
      <div
        className={`absolute right-0 top-full mt-2 min-w-[130px] overflow-hidden rounded-[3px] bg-white text-[#334155] shadow-[0_18px_42px_rgba(15,23,42,0.24)] transition ${
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={() => selectLanguage('en')}
          className={`block min-h-10 w-full px-4 text-left transition hover:bg-[#EEF3F8] ${lang === 'en' ? 'font-semibold text-[#E36F2C]' : ''}`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => selectLanguage('zh')}
          className={`block min-h-10 w-full px-4 text-left transition hover:bg-[#EEF3F8] ${lang === 'zh' ? 'font-semibold text-[#E36F2C]' : ''}`}
        >
          Chinese
        </button>
      </div>
      <span className="sr-only">{activeLabel}</span>
    </div>
  );
}
