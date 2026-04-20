import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import ImageProtection from "@/components/ImageProtection";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
  title: "VESSEL® | Smart Prefab Architecture for Tourism Resorts",
  description: "VESSEL® — EU+US certified smart prefab architecture. 300+ projects, 30+ countries. E7/E6/V9 Gen6 luxury camp resort solutions.",
  keywords: "prefab architecture,modular building,tourism resort,VESSEL,camp resort,smart building",
  openGraph: {
    title: "VESSEL® | Smart Prefab Architecture",
    description: "EU+US Certified | 30+ Countries | 300+ Projects Delivered",
    url: "https://vessel303.com",
    siteName: "VESSEL®",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${dmSans.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-[#F5F0EB]">
        <LanguageProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </LanguageProvider>
        <ImageProtection />
      </body>
    </html>
  );
}
