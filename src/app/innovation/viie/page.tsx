'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ViieContent from '@/components/tech/ViieContent';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ViIePage() {
  const { lang } = useLanguage();
  const zh = lang === 'zh';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2ED]">
      <Navbar />

      <div className="pt-24 bg-[#F5F2ED]">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#E36F2C] hover:text-[#C85A1F] text-sm tracking-wider transition-colors"
          >
            {zh ? '← 返回' : '← Back'}
          </Link>
        </div>
      </div>

      <ViieContent lang={lang} />

      <Footer />
    </div>
  );
}
