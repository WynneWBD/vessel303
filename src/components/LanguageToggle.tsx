'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center border border-white/15 text-xs tracking-wider overflow-hidden shrink-0">
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1.5 transition-all duration-150 ${
          lang === 'en' ? 'bg-[#E36F2C] text-white font-bold' : 'text-white/40 hover:text-white/70'
        }`}
      >
        EN
      </button>
      <div className="w-px h-3 bg-white/15" />
      <button
        onClick={() => setLang('zh')}
        className={`px-2.5 py-1.5 transition-all duration-150 ${
          lang === 'zh' ? 'bg-[#E36F2C] text-white font-bold' : 'text-white/40 hover:text-white/70'
        }`}
      >
        中
      </button>
    </div>
  );
}
