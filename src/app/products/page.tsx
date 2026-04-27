import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { catalogProducts } from '@/lib/products';
import { listPublishedCatalogProducts } from '@/lib/product-catalog-db';
import ProductsPageContent from '@/components/pages/ProductsPageContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Products | VESSEL® Smart Prefab Architecture',
  description: 'VESSEL® Gen6/Gen5 smart prefab architecture. E3, E5, E6, E7, V3, V5, V7, V9, S5 — 39 variants. EU+US certified.',
};

export default async function ProductsPage() {
  const products = await listPublishedCatalogProducts().catch((err) => {
    console.error('[products] catalog db unavailable, falling back to static catalog', err);
    return catalogProducts;
  });

  return (
    <main className="bg-[#F5F2ED] text-[#2C2A28]">
      <Navbar />
      <ProductsPageContent products={products} />
      <Footer />
    </main>
  );
}
