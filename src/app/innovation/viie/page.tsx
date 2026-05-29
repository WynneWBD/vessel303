'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConversionInquiryForm from '@/components/pages/ConversionInquiryForm';
import InnovationCmsBlock from '@/components/tech/InnovationCmsBlock';
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

      <InnovationCmsBlock slug="viie" lang={lang} />

      <ViieContent lang={lang} />

      <section className="bg-[#F5F2ED] px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <ConversionInquiryForm
            source="innovation:viie:inquiry_form"
            inquiryType="Innovation Inquiry"
            model="VIIE"
            titleEn="Discuss VIIE integration"
            titleZh="提交 VIIE 技术咨询"
            descriptionEn="This request enters the leads console with VIIE source tracking."
            descriptionZh="该咨询会进入新线索后台，并标记为 VIIE 技术专题来源。"
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
