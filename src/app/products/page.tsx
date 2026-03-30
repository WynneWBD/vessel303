import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { catalogProducts } from '@/lib/products';
import ProductsPageContent from '@/components/pages/ProductsPageContent';

export const metadata: Metadata = {
  title: 'Products | VESSEL® Smart Prefab Architecture',
  description: 'VESSEL® Gen6/Gen5 smart prefab architecture. E3, E5, E6, E7, V3, V5, V7, V9, S5 — 39 variants. EU+US certified.',
};

export default function ProductsPage() {
  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />
      <ProductsPageContent products={catalogProducts} />
      <Footer />
    </main>
  );
}
