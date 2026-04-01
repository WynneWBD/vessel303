'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

const ROLE_LABELS: Record<string, { en: string; zh: string }> = {
  buyer:      { en: 'Buyer',      zh: '采购商' },
  agent:      { en: 'Agent',      zh: '代理商' },
  individual: { en: 'Individual', zh: '个人' },
};

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
        className="text-sm px-4 py-2 border border-[#c9a84c]/50 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#1C1A18] transition-all duration-200 tracking-wider font-medium"
      >
        {t(i18n.nav.signIn)}
      </Link>
    );
  }

  const user = session.user as typeof session.user & { role?: string };
  const rolePair = ROLE_LABELS[user.role ?? ''] ?? { en: 'User', zh: '用户' };
  const roleLabel = t(rolePair);
  const initial = (user.name ?? user.email ?? '?')[0].toUpperCase();

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2">
        <div className="w-7 h-7 bg-[#c9a84c] text-[#1C1A18] flex items-center justify-center text-xs font-black shrink-0">
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-white/80 text-xs tracking-wider leading-none max-w-[80px] truncate">
            {user.name ?? user.email}
          </div>
          <div className="text-[#c9a84c] text-[10px] tracking-wider mt-0.5">{roleLabel}</div>
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
              href="/display"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-white/50 hover:text-[#c9a84c] hover:bg-white/5 text-xs tracking-wider transition-colors border-b border-white/5"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t(i18n.nav.displayMode)}
            </Link>
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
              className="w-full text-left px-4 py-2.5 text-white/50 hover:text-white hover:bg-white/5 text-xs tracking-wider transition-colors"
            >
              {t(i18n.nav.signOut)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
