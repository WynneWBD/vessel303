import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { catalogProducts } from '@/lib/products';
import {
  listProductAttributeTemplatesWithOptions,
  listProductCategories,
  listPublishedCatalogProducts,
} from '@/lib/product-catalog-db';
import ProductsPageContent from '@/components/pages/ProductsPageContent';
import type { CatalogProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Products | VESSEL® Smart Prefab Architecture',
  description: 'VESSEL® Gen6/Gen5 smart prefab architecture. E3, E5, E6, E7, V3, V5, V7, V9, S5 — 39 variants. EU+US certified.',
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 12;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function productMatchesSearch(product: CatalogProduct, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  const text = [
    product.id,
    product.productSeries,
    product.name_cn,
    product.name_en,
    product.gen,
    product.size,
    ...(product.tags_cn ?? []),
    ...(product.tags_en ?? []),
    ...(product.features_cn ?? []),
    ...(product.features_en ?? []),
    ...(product.keywords_zh ?? []),
    ...(product.keywords_en ?? []),
  ].join(' ').toLowerCase();
  return text.includes(q);
}

function productMatchesFilters(product: CatalogProduct, filters: { q: string; category: string; attribute: string }) {
  if (!productMatchesSearch(product, filters.q)) return false;
  if (filters.category && String(product.category_id ?? '') !== filters.category) return false;
  if (filters.attribute) {
    const attributeId = Number(filters.attribute);
    if (!Number.isInteger(attributeId) || !(product.attribute_option_ids ?? []).includes(attributeId)) return false;
  }
  return true;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const filters = {
    q: firstParam(sp.q)?.trim() ?? '',
    category: firstParam(sp.category)?.trim() ?? '',
    attribute: firstParam(sp.attribute)?.trim() ?? '',
    page: normalizePage(firstParam(sp.page)),
  };
  const products = await listPublishedCatalogProducts().catch((err) => {
    console.error('[products] catalog db unavailable, falling back to static catalog', err);
    return catalogProducts;
  });
  const [categories, attributeTemplates] = await Promise.all([
    listProductCategories({ includeHidden: false }).catch((err) => {
      console.error('[products] load categories failed', err);
      return [];
    }),
    listProductAttributeTemplatesWithOptions({ includeHidden: false }).catch((err) => {
      console.error('[products] load attribute templates failed', err);
      return [];
    }),
  ]);
  const filtered = products.filter((product) => productMatchesFilters(product, filters));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const pageProducts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main className="bg-[#F5F2ED] text-[#2C2A28]">
      <Navbar />
      <ProductsPageContent
        products={pageProducts}
        allProductsCount={products.length}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        currentPage={currentPage}
        totalPages={totalPages}
        filters={{ ...filters, page: currentPage }}
        categories={categories}
        attributeTemplates={attributeTemplates}
      />
      <Footer />
    </main>
  );
}
