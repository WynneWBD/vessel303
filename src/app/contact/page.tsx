'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ContactForm from '@/components/ContactForm';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';

export default function ContactPage() {
  const t = useT();

  const officeLocations = [
    { city: t(i18n.contact.city0), status: 'operating' as const },
    { city: t(i18n.contact.city1), status: 'operating' as const },
    { city: t(i18n.contact.city2), status: 'operating' as const },
    { city: t(i18n.contact.city3), status: 'operating' as const },
    { city: t(i18n.contact.city4), status: 'operating' as const },
    { city: t(i18n.contact.city5), status: 'operating' as const },
    { city: t(i18n.contact.city6), status: 'building' as const },
    { city: t(i18n.contact.city7), status: 'building' as const },
  ];

  const faqs = [
    { q: t(i18n.contact.faq1Q), a: t(i18n.contact.faq1A) },
    { q: t(i18n.contact.faq2Q), a: t(i18n.contact.faq2A) },
    { q: t(i18n.contact.faq3Q), a: t(i18n.contact.faq3A) },
    { q: t(i18n.contact.faq4Q), a: t(i18n.contact.faq4A) },
    { q: t(i18n.contact.faq5Q), a: t(i18n.contact.faq5A) },
    { q: t(i18n.contact.faq6Q), a: t(i18n.contact.faq6A) },
  ];

  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      <PageHero
        label={t(i18n.contact.heroLabel)}
        title="VESSEL 微宿®"
        titleGold={t(i18n.contact.heroTitleGold)}
        subtitle={t(i18n.contact.heroSubtitle)}
        breadcrumb={[{ label: t(i18n.productDetail.home), href: '/' }, { label: t(i18n.nav.contact) }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Contact Form ── */}
          <div className="lg:col-span-2">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-6 font-medium">{t(i18n.contact.formLabel)}</div>
            <ContactForm />
          </div>

          {/* ── Contact Info Sidebar ── */}
          <div className="space-y-6">
            <div>
              <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-6 font-medium">{t(i18n.contact.contactLabel)}</div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white border border-[#E8E4DE]">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#c9a84c]/10 shrink-0">
                    <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[#999999] text-[10px] tracking-wider mb-1">{t(i18n.contact.phoneLabel)}</div>
                    <a href="tel:4008090303" className="text-[#2C2A28] font-bold tracking-wider hover:text-[#c9a84c] transition-colors">
                      400-8090-303
                    </a>
                    <div className="text-[#AAAAAA] text-xs mt-0.5">{t(i18n.contact.workHours)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white border border-[#E8E4DE]">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#c9a84c]/10 shrink-0">
                    <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[#999999] text-[10px] tracking-wider mb-1">{t(i18n.contact.waLabel)}</div>
                    <a href="tel:+8618024176679" className="text-[#2C2A28] font-bold tracking-wider hover:text-[#c9a84c] transition-colors">
                      +86 180-2417-6679
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white border border-[#E8E4DE]">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#c9a84c]/10 shrink-0">
                    <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[#999999] text-[10px] tracking-wider mb-1">{t(i18n.contact.emailLabel)}</div>
                    <a href="mailto:wynne@303vessel.cn" className="text-[#444444] text-sm hover:text-[#c9a84c] transition-colors break-all">
                      wynne@303vessel.cn
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white border border-[#E8E4DE]">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#c9a84c]/10 shrink-0">
                    <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[#999999] text-[10px] tracking-wider mb-1">{t(i18n.contact.addressLabel)}</div>
                    <div className="text-[#555555] text-sm leading-relaxed">
                      广东省佛山市南海区<br />
                      狮山镇兴业北路253号
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR code placeholder */}
            <div className="p-5 bg-white border border-[#E8E4DE] text-center">
              <div className="text-[#999999] text-xs tracking-wider mb-3">{t(i18n.contact.wechatLabel)}</div>
              <div className="w-28 h-28 mx-auto bg-[#E8E4DE] flex items-center justify-center">
                <span className="text-[#CCCCCC] text-xs">企业微信二维码</span>
              </div>
              <div className="text-[#BBBBBB] text-xs mt-2">{t(i18n.contact.wechatSub)}</div>
            </div>

            {/* Global offices */}
            <div>
              <div className="text-[#999999] text-xs tracking-[0.25em] uppercase mb-4">{t(i18n.contact.officesLabel)}</div>
              <div className="grid grid-cols-2 gap-2">
                {officeLocations.map((loc) => (
                  <div key={loc.city} className="flex items-center justify-between px-3 py-2 bg-white border border-[#F0EDE8] text-xs">
                    <span className="text-[#6B6560] tracking-wider">{loc.city}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 ${
                        loc.status === 'operating'
                          ? 'text-[#27ae60] bg-[#27ae60]/10'
                          : 'text-[#999999] bg-white/5'
                      }`}
                    >
                      {loc.status === 'operating' ? t(i18n.contact.operating) : t(i18n.contact.building)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">{t(i18n.contact.faqLabel)}</div>
            <h2 className="text-2xl font-black text-[#2C2A28]">{t(i18n.contact.faqTitle)}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-[#E8E4DE] p-6 hover:border-[#c9a84c]/20 transition-all">
                <div className="flex items-start gap-3">
                  <span className="text-[#c9a84c] font-black text-lg shrink-0 leading-none mt-0.5">Q</span>
                  <div>
                    <div className="text-[#2C2A28] font-semibold text-sm mb-2 tracking-wider">{faq.q}</div>
                    <div className="text-[#6B6560] text-sm leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
