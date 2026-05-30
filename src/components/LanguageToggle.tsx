'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex shrink-0 items-center overflow-hidden border border-white/15 text-xs tracking-wider">
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`min-h-10 min-w-10 px-2.5 transition-all duration-150 ${
          lang === 'en' ? 'bg-[#E36F2C] text-white font-bold' : 'text-white/40 hover:text-white/70'
        }`}
      >
        EN
      </button>
      <div className="w-px h-3 bg-white/15" />
      <button
        type="button"
        onClick={() => setLang('zh')}
        className={`min-h-10 min-w-10 px-2.5 transition-all duration-150 ${
          lang === 'zh' ? 'bg-[#E36F2C] text-white font-bold' : 'text-white/40 hover:text-white/70'
        }`}
      >
        中
      </button>
    </div>
  );
}
