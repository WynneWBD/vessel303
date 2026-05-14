import ProductListClient from '@/components/admin/ProductListClient'
import { listCatalogProducts, type CatalogProductStatus } from '@/lib/product-catalog-db'
import type { ProductSeriesCode } from '@/lib/products'

export const dynamic = 'force-dynamic'

const LIMIT = 20
const STATUSES = new Set(['draft', 'published'])
const SERIES = new Set(['E3', 'E5', 'E6', 'E7', 'V3', 'V5', 'V7', 'V9', 'S5'])

type ProductsAdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function positivePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export default async function ProductsAdminPage({ searchParams }: ProductsAdminPageProps) {
  const sp = await searchParams
  const statusParam = firstParam(sp.status)
  const seriesParam = firstParam(sp.series)
  const search = firstParam(sp.search)?.trim() ?? ''
  const page = positivePage(firstParam(sp.page))
  const status = STATUSES.has(statusParam ?? '') ? statusParam as CatalogProductStatus : undefined
  const series = SERIES.has(seriesParam ?? '') ? seriesParam as ProductSeriesCode : undefined

  const { rows, total } = await listCatalogProducts({
    status,
    series,
    search,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  }).catch((err) => {
    console.error('[admin/products] list failed', err)
    return { rows: [], total: 0 }
  })

  return (
    <ProductListClient
      initialRows={rows}
      initialTotal={total}
      initialPage={page}
      initialFilters={{
        status: status ?? '',
        series: series ?? '',
        search,
      }}
    />
  )
}
