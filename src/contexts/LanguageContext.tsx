'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Lang = 'en' | 'zh';
interface LangCtx { lang: Lang; setLang: (l: Lang) => void }
const LanguageContext = createContext<LangCtx>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  useEffect(() => {
    const saved = localStorage.getItem('vessel-lang') as Lang | null;
    if (saved === 'en' || saved === 'zh') {
      setLangState(saved);
      document.documentElement.lang = saved === 'zh' ? 'zh-CN' : 'en';
    }
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('vessel-lang', l);
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
  }, []);
  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
export function useT() {
  const { lang } = useLanguage();
  return function t(key: { en: string; zh: string }) { return key[lang]; };
}
