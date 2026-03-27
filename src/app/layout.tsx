import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "VESSEL 微宿 | 文旅智能装配建筑 全球领导品牌",
  description: "VESSEL 微宿 — 专注文旅智能装配建筑，欧盟+美国建筑认证，全球30+国家，300+项目交付。提供E7/E6/V9 Gen6系列高端装配式建筑解决方案。",
  keywords: "文旅建筑,装配式建筑,智能建筑,VESSEL,微宿,文旅度假,模块化建筑",
  openGraph: {
    title: "VESSEL 微宿 | 文旅智能装配建筑",
    description: "欧盟+美国建筑认证 | 全球30+国家 | 300+项目交付",
    url: "https://vessel303.com",
    siteName: "VESSEL 微宿",
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
