'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchPublicPageModules,
  itemById,
  itemLabel,
  moduleMap,
  type PublicPageModule,
} from '@/lib/page-module-client';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [pageModules, setPageModules] = useState<PublicPageModule[] | null>(null);
  const { lang } = useLanguage();
  const authModule = moduleMap(pageModules).get('navbar-auth') ?? moduleMap(pageModules).get('shared') ?? null;
  const signInLabel = itemLabel(itemById(authModule, 'sign-in'), lang);
  const roleLabel = itemLabel(itemById(authModule, 'role-user'), lang);
  const accountLabel = itemLabel(itemById(authModule, 'account-center'), lang);
  const adminLabel = itemLabel(itemById(authModule, 'admin-dashboard'), lang);
  const signOutLabel = itemLabel(itemById(authModule, 'sign-out'), lang);

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicPageModules('auth', controller.signal)
      .then((modules) => setPageModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setPageModules(null);
      });
    return () => controller.abort();
  }, []);

  if (status === 'loading') {
    return <div className="w-7 h-7 bg-white/5 animate-pulse" />;
  }

  if (!session?.user) {
    if (!signInLabel) return null;
    return (
      <Link
        href="/login"
        className="text-sm px-4 py-2 border border-[#E36F2C]/50 text-[#E36F2C] hover:bg-[#E36F2C] hover:text-white transition-all duration-200 tracking-wider font-medium"
      >
        {signInLabel}
      </Link>
    );
  }

  const user = session.user as typeof session.user & { role?: string };
  const isAdminUser = user.role === 'admin' || user.role === 'operator';
  const initial = (user.name ?? user.email ?? '?')[0].toUpperCase();

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2">
        <div className="w-7 h-7 bg-[#E36F2C] text-white flex items-center justify-center text-xs font-black shrink-0">
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-white/80 text-xs tracking-wider leading-none max-w-[80px] truncate">
            {user.name ?? user.email}
          </div>
          {roleLabel ? <div className="text-[#E36F2C] text-[10px] tracking-wider mt-0.5">{roleLabel}</div> : null}
        </div>
        <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44 bg-[#111] border border-white/10 z-40 py-1">
            {accountLabel ? (
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-white/50 hover:text-[#E36F2C] hover:bg-white/5 text-xs tracking-wider transition-colors border-b border-white/5"
              >
                <UserRound size={14} className="shrink-0" />
                {accountLabel}
              </Link>
            ) : null}
            {isAdminUser && adminLabel ? (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-white/50 hover:text-[#E36F2C] hover:bg-white/5 text-xs tracking-wider transition-colors border-b border-white/5"
              >
                <LayoutDashboard size={14} className="shrink-0" />
                {adminLabel}
              </Link>
            ) : null}
            {signOutLabel ? (
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-white/50 hover:text-white hover:bg-white/5 text-xs tracking-wider transition-colors"
              >
                <LogOut size={14} className="shrink-0" />
                {signOutLabel}
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
