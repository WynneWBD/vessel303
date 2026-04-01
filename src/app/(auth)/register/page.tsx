'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

type Role = 'buyer' | 'agent' | 'individual';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();

  const ROLES: { value: Role; label: string; desc: string }[] = [
    { value: 'buyer' as Role, label: t(i18n.auth.roleBuyer), desc: t(i18n.auth.roleBuyerDesc) },
    { value: 'agent' as Role, label: t(i18n.auth.roleAgent), desc: t(i18n.auth.roleAgentDesc) },
    { value: 'individual' as Role, label: t(i18n.auth.roleIndividual), desc: t(i18n.auth.roleIndividualDesc) },
  ];

  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' as Role | '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.role) {
      setError(t(i18n.auth.roleError));
      return;
    }

    setLoading(true);

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? t(i18n.auth.registerError));
      setLoading(false);
      return;
    }

    // Auto sign-in after successful registration
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
      {/* Logo */}
      <div className="text-center mb-10">
        <Link href="/" className="inline-block">
          <span className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase font-bold">VESSEL 微宿®</span>
        </Link>
        <h1 className="text-white text-2xl font-black mt-3 tracking-wider">{t(i18n.auth.registerTitle)}</h1>
        <p className="text-white/35 text-sm mt-1 tracking-wider">{t(i18n.auth.registerSubtitle)}</p>
      </div>

      <div className="bg-[#0f0f0f] border border-white/8 p-8">
        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 border border-white/15 text-white/70 hover:border-[#c9a84c]/50 hover:text-white py-3 text-sm tracking-wider transition-all duration-200 mb-6"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t(i18n.auth.googleRegBtn)}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-white/20 text-xs tracking-wider">{t(i18n.auth.orFill)}</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selection */}
          <div>
            <label className="block text-white/40 text-xs tracking-wider mb-2">{t(i18n.auth.roleLabel)}</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set('role', r.value)}
                  className={`border p-3 text-left transition-all duration-150 ${
                    form.role === r.value
                      ? 'border-[#c9a84c] bg-[#c9a84c]/8'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className={`text-xs font-bold tracking-wider mb-0.5 ${form.role === r.value ? 'text-[#c9a84c]' : 'text-white/60'}`}>
                    {r.label}
                  </div>
                  <div className="text-white/30 text-[10px] leading-tight">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white/40 text-xs tracking-wider mb-1.5">{t(i18n.auth.nameLabel)}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder={t(i18n.auth.namePlaceholder)}
              className="w-full bg-[#1a1a1a] border border-white/10 focus:border-[#c9a84c]/60 outline-none text-white text-sm px-4 py-3 tracking-wider placeholder:text-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-white/40 text-xs tracking-wider mb-1.5">{t(i18n.auth.emailLabel)}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              autoComplete="email"
              placeholder="your@email.com"
              className="w-full bg-[#1a1a1a] border border-white/10 focus:border-[#c9a84c]/60 outline-none text-white text-sm px-4 py-3 tracking-wider placeholder:text-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-white/40 text-xs tracking-wider mb-1.5">{t(i18n.auth.passwordLabel)}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              autoComplete="new-password"
              placeholder="至少8位，包含字母和数字"
              className="w-full bg-[#1a1a1a] border border-white/10 focus:border-[#c9a84c]/60 outline-none text-white text-sm px-4 py-3 tracking-wider placeholder:text-white/20 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400/80 text-xs tracking-wider border border-red-500/20 bg-red-500/5 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a84c] text-[#1C1A18] font-bold text-sm py-3 tracking-wider hover:bg-[#d4b55a] disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? t(i18n.auth.registering) : t(i18n.auth.registerBtn)}
          </button>
        </form>
      </div>

      <p className="text-center text-white/30 text-sm mt-6 tracking-wider">
        {t(i18n.auth.hasAccount)}{' '}
        <Link href="/login" className="text-[#c9a84c] hover:text-[#d4b55a] transition-colors">
          {t(i18n.auth.loginLink)}
        </Link>
      </p>
    </div>
  );
}
