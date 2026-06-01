import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import ImageProtection from "@/components/ImageProtection";
import SiteAnalyticsTracker from "@/components/SiteAnalyticsTracker";
import FloatingContact from "@/components/FloatingContact";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { getGoogleSiteVerificationToken } from "@/lib/google-site-verification";
import { getStoredSiteSettings, type SiteSettings } from "@/lib/admin-settings-db";
import { SITE_URL } from "@/lib/seo";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

const googleSiteVerification = getGoogleSiteVerificationToken();

export async function generateMetadata(): Promise<Metadata> {
  const settings: Partial<SiteSettings> = await getStoredSiteSettings().catch((err) => {
    console.error('[layout/metadata] site settings unavailable', err);
    return {};
  });
  const title = settings.seoTitleEn || settings.seoTitleZh || settings.siteNameEn || settings.siteNameZh || '';
  const description = settings.seoDescriptionEn || settings.seoDescriptionZh || '';
  const siteName = settings.siteNameEn || settings.siteNameZh || undefined;

  return {
    metadataBase: new URL(SITE_URL),
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(title || description || siteName
      ? {
          openGraph: {
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            url: '/',
            ...(siteName ? { siteName } : {}),
            type: "website",
          },
          twitter: {
            card: 'summary_large_image',
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
          },
        }
      : {}),
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-touch-icon.png',
    },
    ...(googleSiteVerification
      ? {
          verification: {
            google: googleSiteVerification,
          },
        }
      : {}),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${dmSans.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-[#F5F2ED]">
        <LanguageProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
          <FloatingContact />
        </LanguageProvider>
        <Suspense fallback={null}>
          <SiteAnalyticsTracker />
        </Suspense>
        <ImageProtection />
      </body>
    </html>
  );
}
