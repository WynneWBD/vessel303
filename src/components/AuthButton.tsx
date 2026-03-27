'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  buyer: '采购商',
  agent: '代理商',
  individual: '个人',
};

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === 'loading') {
    return <div className="w-7 h-7 bg-white/5 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="text-sm px-4 py-2 border border-[#c9a84c]/50 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#0a0a0a] transition-all duration-200 tracking-wider font-medium"
      >
        登录
      </Link>
    );
  }

  const user = session.user as typeof session.user & { role?: string };
  const roleLabel = ROLE_LABELS[user.role ?? ''] ?? '用户';
  const initial = (user.name ?? user.email ?? '?')[0].toUpperCase();

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2">
        <div className="w-7 h-7 bg-[#c9a84c] text-[#0a0a0a] flex items-center justify-center text-xs font-black shrink-0">
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
          <div className="absolute right-0 top-full mt-2 w-36 bg-[#111] border border-white/10 z-40 py-1">
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
              className="w-full text-left px-4 py-2.5 text-white/50 hover:text-white hover:bg-white/5 text-xs tracking-wider transition-colors"
            >
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}
