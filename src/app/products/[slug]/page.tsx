export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getProductBySlug } from '@/lib/db-products';
import { catalogProducts } from '@/lib/products';
import { auth } from '@/auth';
import ProductDetailContent from '@/components/pages/ProductDetailContent';
import CatalogProductDetailContent from '@/components/pages/CatalogProductDetailContent';

// All catalog product ids + legacy DB slugs
export function generateStaticParams() {
  const legacySlugs = ['e7', 'e6', 'e3', 'v9', 'v5', 's5'];
  const catalogIds = catalogProducts.map((p) => p.id);
  return [...new Set([...legacySlugs, ...catalogIds])].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Catalog product (static data — no DB needed)
  const catalogProduct = catalogProducts.find((p) => p.id === slug);
  if (catalogProduct) {
    return {
      title: `${catalogProduct.name_en} | VESSEL 微宿®`,
      description: `${catalogProduct.name_cn} · ${catalogProduct.size} · ${catalogProduct.features_cn.join('，')}`,
    };
  }

  // Legacy DB product
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

  // ── 1. Catalog product (static, no DB) ──────────────────
  const catalogProduct = catalogProducts.find((p) => p.id === slug);
  if (catalogProduct) {
    const session = await auth();
    return (
      <>
        <Navbar />
        <CatalogProductDetailContent
          product={catalogProduct}
          isLoggedIn={!!session?.user}
        />
        <Footer />
      </>
    );
  }

  // ── 2. Legacy rich DB product ────────────────────────────
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
