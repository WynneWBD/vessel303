'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const t = useT();

  if (status === 'loading') {
    return <div className="w-7 h-7 bg-white/5 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="text-sm px-4 py-2 border border-[#E36F2C]/50 text-[#E36F2C] hover:bg-[#E36F2C] hover:text-white transition-all duration-200 tracking-wider font-medium"
      >
        {t(i18n.nav.signIn)}
      </Link>
    );
  }

  const user = session.user as typeof session.user & { role?: string };
  const isAdminUser = user.role === 'admin' || user.role === 'operator';
  const roleLabel = t({ en: 'Member', zh: '普通会员' });
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
          <div className="text-[#E36F2C] text-[10px] tracking-wider mt-0.5">{roleLabel}</div>
        </div>
        <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44 bg-[#111] border border-white/10 z-40 py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-white/50 hover:text-[#E36F2C] hover:bg-white/5 text-xs tracking-wider transition-colors border-b border-white/5"
            >
              <UserRound size={14} className="shrink-0" />
              {t(i18n.nav.accountCenter)}
            </Link>
            {isAdminUser && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-white/50 hover:text-[#E36F2C] hover:bg-white/5 text-xs tracking-wider transition-colors border-b border-white/5"
              >
                <LayoutDashboard size={14} className="shrink-0" />
                {t(i18n.nav.adminDashboard)}
              </Link>
            )}
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
              className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-white/50 hover:text-white hover:bg-white/5 text-xs tracking-wider transition-colors"
            >
              <LogOut size={14} className="shrink-0" />
              {t(i18n.nav.signOut)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
