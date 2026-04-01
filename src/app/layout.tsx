import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#FAF7F2]">
        <LanguageProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}
