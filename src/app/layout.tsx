import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import ImageProtection from "@/components/ImageProtection";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DEFAULT_OG_IMAGE, DEFAULT_SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VESSEL® | Smart Prefab Architecture for Tourism Resorts",
  description: DEFAULT_SITE_DESCRIPTION,
  keywords: "prefab architecture,modular building,tourism resort,VESSEL,camp resort,smart building",
  openGraph: {
    title: "VESSEL® | Smart Prefab Architecture",
    description: DEFAULT_SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE }],
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VESSEL® | Smart Prefab Architecture',
    description: DEFAULT_SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

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
        </LanguageProvider>
        <ImageProtection />
      </body>
    </html>
  );
}
