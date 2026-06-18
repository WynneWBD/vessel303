'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchPublicPageModules,
  itemById,
  itemLabel,
  itemValue,
  moduleDescription,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client';

const AUTH_REGISTER_FALLBACK_MODULES: PublicPageModule[] = [
  {
    page_key: 'auth',
    module_key: 'shared',
    is_visible: true,
    sort_order: 10,
    items: [
      {
        id: 'brand',
        href: '/',
        label_zh: 'VESSEL',
        label_en: 'VESSEL',
        is_visible: true,
        sort_order: 10,
      },
    ],
  },
  {
    page_key: 'auth',
    module_key: 'register',
    title_zh: '注册',
    title_en: 'Create account',
    description_zh: '创建您的 VESSEL 账户。',
    description_en: 'Create your VESSEL account.',
    is_visible: true,
    sort_order: 30,
    items: [
      { id: 'name-label', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 10 },
      { id: 'name-placeholder', label_zh: '姓名占位', label_en: 'Name placeholder', value_zh: '您的姓名', value_en: 'Your name', is_visible: true, sort_order: 20 },
      { id: 'email-label', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 30 },
      { id: 'email-placeholder', label_zh: '邮箱占位', label_en: 'Email placeholder', value_zh: 'name@example.com', value_en: 'name@example.com', is_visible: true, sort_order: 40 },
      { id: 'password-label', label_zh: '密码', label_en: 'Password', is_visible: true, sort_order: 50 },
      { id: 'password-placeholder', label_zh: '密码占位', label_en: 'Password placeholder', value_zh: '设置密码', value_en: 'Set password', is_visible: true, sort_order: 60 },
      { id: 'google-button', label_zh: '使用 Google 注册', label_en: 'Continue with Google', is_visible: true, sort_order: 70 },
      { id: 'divider', label_zh: '或', label_en: 'or', is_visible: true, sort_order: 80 },
      { id: 'submit', label_zh: '注册', label_en: 'Create account', is_visible: true, sort_order: 90 },
      { id: 'submitting', label_zh: '注册中', label_en: 'Creating account', is_visible: true, sort_order: 100 },
      { id: 'error', label_zh: '注册失败，请稍后再试。', label_en: 'Registration failed. Please try again.', is_visible: true, sort_order: 110 },
      { id: 'has-account', label_zh: '已有账户？', label_en: 'Already have an account?', is_visible: true, sort_order: 120 },
      { id: 'login-link', href: '/login', label_zh: '登录', label_en: 'Sign in', is_visible: true, sort_order: 130 },
    ],
  },
];

export default function RegisterPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [pageModules, setPageModules] = useState<PublicPageModule[] | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicPageModules('auth', controller.signal)
      .then((modules) => setPageModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setPageModules(null);
      });
    return () => controller.abort();
  }, []);

  const modules = moduleMap(pageModules ?? AUTH_REGISTER_FALLBACK_MODULES);
  const registerModule = modules.get('register') ?? null;
  const sharedModule = modules.get('shared') ?? null;
  const title = moduleTitle(registerModule, lang);
  const subtitle = moduleDescription(registerModule, lang);
  const brand = itemById(sharedModule, 'brand');
  const brandLabel = itemLabel(brand, lang);
  const labels = {
    name: itemLabel(itemById(registerModule, 'name-label'), lang),
    namePlaceholder: itemValue(itemById(registerModule, 'name-placeholder'), lang),
    email: itemLabel(itemById(registerModule, 'email-label'), lang),
    emailPlaceholder: itemValue(itemById(registerModule, 'email-placeholder'), lang),
    password: itemLabel(itemById(registerModule, 'password-label'), lang),
    passwordPlaceholder: itemValue(itemById(registerModule, 'password-placeholder'), lang),
    google: itemLabel(itemById(registerModule, 'google-button'), lang),
    divider: itemLabel(itemById(registerModule, 'divider'), lang),
    submit: itemLabel(itemById(registerModule, 'submit'), lang),
    submitting: itemLabel(itemById(registerModule, 'submitting'), lang),
    error: itemLabel(itemById(registerModule, 'error'), lang),
    hasAccount: itemLabel(itemById(registerModule, 'has-account'), lang),
    loginLink: itemLabel(itemById(registerModule, 'login-link'), lang),
  };
  const canRenderForm = Boolean(labels.name && labels.email && labels.password && labels.submit);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    setLoading(true);

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? labels.error);
      setLoading(false);
      return;
    }

    const signInRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push('/login');
    } else {
      router.push('/');
      router.refresh();
    }
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/' });
  }

  return (
    <div className="w-full max-w-md py-10">
      {(brandLabel || title || subtitle) ? (
        <div className="mb-10 text-center">
          {brandLabel && brand?.href ? (
            <Link href={brand.href} className="inline-block">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-[#E36F2C]">{brandLabel}</span>
            </Link>
          ) : null}
          {title ? <h1 className="mt-3 text-2xl font-black tracking-wider text-[#2C2A28]">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-sm tracking-wider text-[#8A7D74]">{subtitle}</p> : null}
        </div>
      ) : null}

      {canRenderForm ? (
        <div className="border border-[#E5DED4] bg-white p-8">
          {labels.google ? (
            <button
              onClick={handleGoogle}
              className="mb-6 flex w-full items-center justify-center gap-3 border border-[#E5DED4] py-3 text-sm tracking-wider text-[#6B625B] transition-all duration-200 hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {labels.google}
            </button>
          ) : null}

          {labels.divider ? (
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5DED4]" />
              <span className="text-xs tracking-wider text-[#C4B9AB]">{labels.divider}</span>
              <div className="h-px flex-1 bg-[#E5DED4]" />
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs tracking-wider text-[#8A7D74]">{labels.name}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                placeholder={labels.namePlaceholder}
                className="w-full border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3 text-sm tracking-wider text-[#2C2A28] outline-none transition-colors placeholder:text-[#C4B9AB] focus:border-[#E36F2C]/60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs tracking-wider text-[#8A7D74]">{labels.email}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                autoComplete="email"
                placeholder={labels.emailPlaceholder}
                className="w-full border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3 text-sm tracking-wider text-[#2C2A28] outline-none transition-colors placeholder:text-[#C4B9AB] focus:border-[#E36F2C]/60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs tracking-wider text-[#8A7D74]">{labels.password}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                autoComplete="new-password"
                placeholder={labels.passwordPlaceholder}
                className="w-full border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3 text-sm tracking-wider text-[#2C2A28] outline-none transition-colors placeholder:text-[#C4B9AB] focus:border-[#E36F2C]/60"
              />
            </div>

            {error ? (
              <p className="border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs tracking-wider text-red-400/80">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#E36F2C] py-3 text-sm font-bold tracking-wider text-white transition-colors hover:bg-[#C85A1F] disabled:opacity-50"
            >
              {loading && labels.submitting ? labels.submitting : labels.submit}
            </button>
          </form>
        </div>
      ) : null}

      {labels.hasAccount && labels.loginLink ? (
        <p className="mt-6 text-center text-sm tracking-wider text-[#8A7D74]">
          {labels.hasAccount}{' '}
          <Link href="/login" className="text-[#E36F2C] transition-colors hover:text-[#C85A1F]">
            {labels.loginLink}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
