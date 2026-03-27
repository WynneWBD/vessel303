'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

interface Props {
  name: string;
  roleLabel: string;
  initial: string;
}

export default function AuthButtonClient({ name, roleLabel, initial }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 group"
      >
        {/* Avatar */}
        <div className="w-7 h-7 bg-[#c9a84c] text-[#0a0a0a] flex items-center justify-center text-xs font-black">
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-white/80 text-xs tracking-wider leading-none">{name}</div>
          <div className="text-[#c9a84c] text-[10px] tracking-wider mt-0.5">{roleLabel}</div>
        </div>
        <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-40 bg-[#111] border border-white/10 z-40 py-1">
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
