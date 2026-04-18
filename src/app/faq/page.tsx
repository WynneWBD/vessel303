'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { FAQ_DATA, FAQ_CATEGORIES } from '@/data/faq';

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`border-b border-[#E5E0DA] transition-colors ${isOpen ? 'bg-white' : 'bg-transparent'}`}
    >
      <button
        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left group"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span
          className={`text-base font-medium leading-snug transition-colors ${
            isOpen ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/80 group-hover:text-[#E36F2C]'
          }`}
          style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
        >
          {question}
        </span>
        <span
          className={`mt-0.5 shrink-0 w-6 h-6 flex items-center justify-center rounded-full border transition-all ${
            isOpen
              ? 'border-[#E36F2C] bg-[#E36F2C] text-white'
              : 'border-[#C4B9AB] text-[#8A8580] group-hover:border-[#E36F2C] group-hover:text-[#E36F2C]'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-45' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 border-l-2 border-[#E36F2C] ml-6">
          <p
            className="text-[#1A1A1A]/70 text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const { lang } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  const filteredCategories = activeCategory
    ? FAQ_CATEGORIES.filter((c) => c.key === activeCategory)
    : FAQ_CATEGORIES;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F2ED' }}>
      <Navbar />

      {/* Hero */}
      <section
        className="pt-28 pb-16 px-4"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-4">
            {lang === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold text-[#F0F0F0] mb-5 leading-none tracking-tight"
            style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
          >
            FAQ
          </h1>
          <p className="text-[#8A8580] text-base sm:text-lg max-w-xl leading-relaxed">
            {lang === 'zh'
              ? '关于 VESSEL 产品、运输、安装、认证及商务条款的专业解答。'
              : 'Expert answers on VESSEL products, transport, installation, certifications, and commercial terms.'}
          </p>
        </div>
      </section>

      {/* Category filter bar */}
      <div
        className="sticky top-16 z-30 border-b border-[#E5E0DA]"
        style={{ backgroundColor: '#F5F2ED' }}
      >
        <div className="max-w-4xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 py-3 min-w-max">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3.5 py-1.5 text-xs tracking-wider font-medium transition-all whitespace-nowrap rounded-sm ${
                activeCategory === null
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#8A8580] hover:text-[#1A1A1A] hover:bg-[#E5E0DA]'
              }`}
            >
              {lang === 'zh' ? '全部' : 'All'}
            </button>
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                className={`px-3.5 py-1.5 text-xs tracking-wider font-medium transition-all whitespace-nowrap rounded-sm ${
                  activeCategory === cat.key
                    ? 'bg-[#E36F2C] text-white'
                    : 'text-[#8A8580] hover:text-[#1A1A1A] hover:bg-[#E5E0DA]'
                }`}
              >
                {lang === 'zh' ? cat.zh : cat.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ body */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          {filteredCategories.map((cat) => {
            const items = FAQ_DATA.filter((f) => f.category === cat.key);
            return (
              <section key={cat.key}>
                {/* Category heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-5 bg-[#E36F2C] rounded-full shrink-0" />
                  <h2
                    className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]/50"
                    style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
                  >
                    {lang === 'zh' ? cat.zh : cat.en}
                  </h2>
                </div>

                {/* Accordion */}
                <div className="border border-[#E5E0DA] rounded-sm overflow-hidden">
                  {items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      question={lang === 'zh' ? item.question_zh : item.question_en}
                      answer={lang === 'zh' ? item.answer_zh : item.answer_en}
                      isOpen={openId === item.id}
                      onToggle={() => toggle(item.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* CTA */}
      <section style={{ backgroundColor: '#1A1A1A' }} className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#E36F2C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
            {lang === 'zh' ? '还有问题？' : 'Still have questions?'}
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] mb-4"
            style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
          >
            {lang === 'zh' ? '我们的团队随时为您解答' : 'Our team is ready to help'}
          </h2>
          <p className="text-[#8A8580] text-sm mb-8 max-w-md mx-auto leading-relaxed">
            {lang === 'zh'
              ? '提交您的项目需求，专业顾问将在 24 小时内与您联系。'
              : 'Submit your project requirements and a specialist will contact you within 24 hours.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="https://en.303vessel.cn/contact.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3.5 bg-[#E36F2C] text-white text-sm font-semibold tracking-wider hover:bg-[#C85A1F] transition-colors"
            >
              {lang === 'zh' ? '联系我们' : 'Contact VESSEL'}
            </Link>
            <Link
              href="/global"
              className="inline-block px-8 py-3.5 border border-white/20 text-white/70 text-sm font-medium tracking-wider hover:border-[#E36F2C] hover:text-[#E36F2C] transition-colors"
            >
              {lang === 'zh' ? '查看全球项目' : 'View Global Projects'}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
