'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConversionInquiryForm from '@/components/pages/ConversionInquiryForm';
import InnovationCmsBlock from '@/components/tech/InnovationCmsBlock';
import VolsContent from '@/components/tech/VolsContent';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VolsPage() {
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

      <InnovationCmsBlock slug="vols" lang={lang} />

      <VolsContent lang={lang} />

      <section className="border-y border-[#E5DED4] bg-white px-4 py-8">
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
          {[
            zh ? '技术专题 CMS' : 'Topic CMS',
            zh ? '产品/场景可追溯' : 'Product and scenario context',
            zh ? '咨询进入线索 2.0' : 'Inquiry enters leads 2.0',
          ].map((item) => (
            <div key={item} className="border border-[#E5DED4] bg-[#F5F2ED] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B625B]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F5F2ED] px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <ConversionInquiryForm
            source="innovation:vols:inquiry_form"
            inquiryType="Innovation Inquiry"
            model="VOLS"
            titleEn="Discuss VOLS deployment"
            titleZh="提交 VOLS 技术咨询"
            descriptionEn="This request enters the leads console with VOLS source tracking."
            descriptionZh="该咨询会进入新线索后台，并标记为 VOLS 技术专题来源。"
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
