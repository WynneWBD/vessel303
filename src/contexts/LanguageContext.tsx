'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Lang = 'en' | 'zh';
interface LangCtx { lang: Lang; setLang: (l: Lang) => void }
const LanguageContext = createContext<LangCtx>({ lang: 'en', setLang: () => {} });

function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'zh';
}

function readStoredLang(): Lang | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem('vessel-lang');
    return isLang(saved) ? saved : null;
  } catch {
    return null;
  }
}

function writeStoredLang(lang: Lang) {
  try {
    window.localStorage.setItem('vessel-lang', lang);
  } catch {
    // Some embedded preview/browser modes block localStorage. Language still works for the current render.
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const storedLang = readStoredLang();
    if (!storedLang) return;
    const timeoutId = window.setTimeout(() => setLangState(storedLang), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    writeStoredLang(l);
  }, []);
  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
export function useT() {
  const { lang } = useLanguage();
  return function t(key: { en: string; zh: string }) { return key[lang]; };
}
