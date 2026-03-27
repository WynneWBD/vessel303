import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getProductBySlug } from '@/lib/db-products';
import { auth } from '@/auth';
import ProductDetailContent from '@/components/pages/ProductDetailContent';

// Slugs are stable — no DB call needed at build time
export function generateStaticParams() {
  return ['e7', 'e6', 'e3', 'v9', 'v5', 's5'].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.model} ${product.gen} | VESSEL 微宿®`,
    description: `${product.tagline} — ${product.tagline2}。${product.floorArea}，${product.power}，${product.capacity}。`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [session, prevProduct, nextProduct] = await Promise.all([
    auth(),
    product.prev ? getProductBySlug(product.prev) : Promise.resolve(null),
    product.next ? getProductBySlug(product.next) : Promise.resolve(null),
  ]);
  const isLoggedIn = !!session?.user;

  return (
    <>
      <Navbar />
      <ProductDetailContent
        product={product}
        isLoggedIn={isLoggedIn}
        prevProduct={prevProduct ?? null}
        nextProduct={nextProduct ?? null}
      />
      <Footer />
    </>
  );
}
