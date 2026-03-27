import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { products } from '@/lib/products';
import ProductsPageContent from '@/components/pages/ProductsPageContent';

export const metadata: Metadata = {
  title: 'Products | VESSEL® Smart Prefab Architecture',
  description: 'VESSEL® Gen6/Gen5 smart prefab architecture. E7, E6, E3, V9, V5, S5 and more. EU+US certified.',
};

export default function ProductsPage() {
  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />
      <ProductsPageContent products={products} />
      <Footer />
    </main>
  );
}
