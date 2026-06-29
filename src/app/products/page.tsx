import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  listPublishedCatalogProductCards,
  listPublicProductAttributeTemplatesWithOptions,
  listPublicProductCategories,
} from '@/lib/product-catalog-db';
import { catalogProducts } from '@/lib/products';
import ProductsPageContent from '@/components/pages/ProductsPageContent';
import { getUploadVariantsByUrls, mapUploadImageUrl } from '@/lib/upload-image-variants';
import { buildPageMetadata } from '@/lib/seo';
import {
  getDefaultPageModule,
  getPublishedPageModule,
  listDefaultPageModules,
  listPublishedPageModules,
} from '@/lib/page-modules-db';
import { sanitizePublicCatalogProduct } from '@/lib/product-public-content';

export const revalidate = 300;

const PRODUCTS_METADATA_TITLE_FALLBACK = 'VESSEL Product Catalog | Modular Hospitality Units';

function productsMetadataTitle(value: string) {
  const title = value.trim();
  return title && title.toLowerCase() !== 'products' ? title : PRODUCTS_METADATA_TITLE_FALLBACK;
}

export async function generateMetadata(): Promise<Metadata> {
  const heroModule = await getPublishedPageModule('products', 'hero').catch((err) => {
    console.error('[products/metadata] load page module failed', err);
    return null;
  });
  const safeHeroModule = heroModule ?? getDefaultPageModule('products', 'hero');
  const title = productsMetadataTitle(safeHeroModule?.title_en || safeHeroModule?.title_zh || '');
  const description = safeHeroModule?.description_en || safeHeroModule?.description_zh || '';
  if (!title || !description) return {};
  return buildPageMetadata({ title, description, path: '/products' });
}

const PAGE_SIZE = 12;

type ProductsSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePage(value: string | string[] | undefined) {
  const page = Number(firstParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeFilters(searchParams: ProductsSearchParams | undefined) {
  return {
    q: firstParam(searchParams?.q)?.trim() ?? '',
    category: firstParam(searchParams?.category)?.trim() ?? '',
    attribute: firstParam(searchParams?.attribute)?.trim() ?? '',
    page: normalizePage(searchParams?.page),
  };
}

function shouldLookupUploadVariants(url: string | null | undefined) {
  const value = String(url ?? '').trim();
  if (!/^https?:\/\//i.test(value)) return false;

  try {
    return new URL(value).hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<ProductsSearchParams>;
}) {
  const filters = normalizeFilters(searchParams ? await searchParams : undefined);
  const catalogRowsPromise = listPublishedCatalogProductCards().catch((err) => {
    console.error('[products] catalog db unavailable', err);
    return catalogProducts;
  });
  const categoriesPromise = listPublicProductCategories().catch((err) => {
    console.error('[products] load categories failed', err);
    return [];
  });
  const attributeTemplatesPromise = listPublicProductAttributeTemplatesWithOptions().catch((err) => {
    console.error('[products] load attribute templates failed', err);
    return [];
  });
  const pageModulesPromise = listPublishedPageModules('products').catch((err) => {
    console.error('[products] load page modules failed', err);
    return listDefaultPageModules('products');
  });

  const [catalogRows, categories, attributeTemplates, pageModules] = await Promise.all([
    catalogRowsPromise,
    categoriesPromise,
    attributeTemplatesPromise,
    pageModulesPromise,
  ]);

  const imageVariantUrls = catalogRows.map((product) => product.image).filter(shouldLookupUploadVariants);
  const imageVariants = await getUploadVariantsByUrls(imageVariantUrls).catch((err) => {
    console.error('[products] load product image variants failed', err);
    return new Map();
  });
  const displayProducts = catalogRows.map((product) => ({
    ...sanitizePublicCatalogProduct(product),
    image: mapUploadImageUrl(product.image, imageVariants, 'card') || product.image,
  }));

  return (
    <main className="bg-[#F5F2ED] text-[#2C2A28]">
      <Navbar />
      <ProductsPageContent
        products={displayProducts}
        pageSize={PAGE_SIZE}
        categories={categories}
        attributeTemplates={attributeTemplates}
        pageModules={pageModules}
        initialFilters={filters}
      />
      <Footer />
    </main>
  );
}
