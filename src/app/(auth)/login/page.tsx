'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
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

const AUTH_FALLBACK_MODULES: PublicPageModule[] = [
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
    module_key: 'login',
    title_zh: '登录',
    title_en: 'Sign in',
    description_zh: '进入您的 VESSEL 账户。',
    description_en: 'Access your VESSEL account.',
    is_visible: true,
    sort_order: 20,
    items: [
      { id: 'email-label', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 10 },
      { id: 'email-placeholder', label_zh: '邮箱占位', label_en: 'Email placeholder', value_zh: 'name@example.com', value_en: 'name@example.com', is_visible: true, sort_order: 20 },
      { id: 'password-label', label_zh: '密码', label_en: 'Password', is_visible: true, sort_order: 30 },
      { id: 'password-placeholder', label_zh: '密码占位', label_en: 'Password placeholder', value_zh: '请输入密码', value_en: 'Enter password', is_visible: true, sort_order: 40 },
      { id: 'google-button', label_zh: '使用 Google 登录', label_en: 'Continue with Google', is_visible: true, sort_order: 50 },
      { id: 'divider', label_zh: '或', label_en: 'or', is_visible: true, sort_order: 60 },
      { id: 'submit', label_zh: '登录', label_en: 'Sign in', is_visible: true, sort_order: 70 },
      { id: 'submitting', label_zh: '登录中', label_en: 'Signing in', is_visible: true, sort_order: 80 },
      { id: 'error', label_zh: '登录失败，请检查邮箱或密码。', label_en: 'Sign in failed. Check your email or password.', is_visible: true, sort_order: 90 },
      { id: 'no-account', label_zh: '还没有账户？', label_en: 'No account yet?', is_visible: true, sort_order: 100 },
      { id: 'register-link', href: '/register', label_zh: '注册', label_en: 'Create account', is_visible: true, sort_order: 110 },
    ],
  },
];

function LoginForm() {
  const { lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [pageModules, setPageModules] = useState<PublicPageModule[] | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const modules = moduleMap(pageModules?.length ? pageModules : AUTH_FALLBACK_MODULES);
  const loginModule = modules.get('login') ?? null;
  const sharedModule = modules.get('shared') ?? null;
  const title = moduleTitle(loginModule, lang);
  const subtitle = moduleDescription(loginModule, lang);
  const brand = itemById(sharedModule, 'brand');
  const brandLabel = itemLabel(brand, lang);
  const emailLabel = itemLabel(itemById(loginModule, 'email-label'), lang);
  const emailPlaceholder = itemValue(itemById(loginModule, 'email-placeholder'), lang);
  const passwordLabel = itemLabel(itemById(loginModule, 'password-label'), lang);
  const passwordPlaceholder = itemValue(itemById(loginModule, 'password-placeholder'), lang);
  const googleLabel = itemLabel(itemById(loginModule, 'google-button'), lang);
  const dividerLabel = itemLabel(itemById(loginModule, 'divider'), lang);
  const submitLabel = itemLabel(itemById(loginModule, 'submit'), lang);
  const submittingLabel = itemLabel(itemById(loginModule, 'submitting'), lang);
  const errorLabel = itemLabel(itemById(loginModule, 'error'), lang);
  const noAccountLabel = itemLabel(itemById(loginModule, 'no-account'), lang);
  const registerLabel = itemLabel(itemById(loginModule, 'register-link'), lang);
  const canRenderForm = Boolean(emailLabel && passwordLabel && submitLabel);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError(errorLabel);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl });
  }

  return (
    <div className="w-full max-w-md">
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
          {googleLabel ? (
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
              {googleLabel}
            </button>
          ) : null}

          {dividerLabel ? (
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5DED4]" />
              <span className="text-xs tracking-wider text-[#C4B9AB]">{dividerLabel}</span>
              <div className="h-px flex-1 bg-[#E5DED4]" />
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs tracking-wider text-[#8A7D74]">{emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={emailPlaceholder}
                className="w-full border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3 text-sm tracking-wider text-[#2C2A28] outline-none transition-colors placeholder:text-[#C4B9AB] focus:border-[#E36F2C]/60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs tracking-wider text-[#8A7D74]">{passwordLabel}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder={passwordPlaceholder}
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
              {loading && submittingLabel ? submittingLabel : submitLabel}
            </button>
          </form>
        </div>
      ) : null}

      {noAccountLabel && registerLabel ? (
        <p className="mt-6 text-center text-sm tracking-wider text-[#8A7D74]">
          {noAccountLabel}{' '}
          <Link href="/register" className="text-[#E36F2C] transition-colors hover:text-[#C85A1F]">
            {registerLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
