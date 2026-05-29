import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { auth } from '@/auth';
import V9Gen6DetailContent from '@/components/pages/V9Gen6DetailContent';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'V9 Gen6 · 旗舰家居版 | VESSEL 微宿®',
  description:
    'VESSEL V9 Gen6 — 38.8㎡ 旗舰长居型智能装配建筑。17㎡落地景观窗，180°全景玻璃，VIIE Gen6智能系统，全球50+国家交付。',
  path: '/products/v9-gen6',
  image: '/images/products/V9-Gen6_render-01.jpg',
});

export default async function V9Gen6Page() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  return (
    <>
      <Navbar />
      <V9Gen6DetailContent isLoggedIn={isLoggedIn} />
      <Footer />
    </>
  );
}
