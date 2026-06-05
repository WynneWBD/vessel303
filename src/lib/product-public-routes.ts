type ProductRouteSource = {
  id: string
  detailSlug?: string | null
}

const FIXED_DETAIL_SLUG_BY_PRODUCT_ID: Record<string, string> = {
  'v9-gen6-standard': 'v9-gen6',
}

const PUBLIC_PRODUCT_HREF_BY_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(FIXED_DETAIL_SLUG_BY_PRODUCT_ID).map(([id, detailSlug]) => [`/products/${id}`, `/products/${detailSlug}`]),
)

function cleanSlug(value: string | null | undefined) {
  const slug = value?.trim()
  return slug || null
}

export function getCatalogProductRouteInfo(product: ProductRouteSource) {
  const detailSlug = cleanSlug(product.detailSlug) ?? FIXED_DETAIL_SLUG_BY_PRODUCT_ID[product.id.trim()]
  const cmsHref = product.id ? `/products/${product.id}` : '/products'
  const curatedHref = detailSlug ? `/products/${detailSlug}` : null

  return {
    cmsHref,
    curatedHref,
    publicHref: curatedHref ?? cmsHref,
    usesCuratedDetail: Boolean(curatedHref),
    publicLabel: curatedHref ? '固定精细页' : 'CMS 通用详情',
  }
}

export function getCatalogProductPublicHref(product: ProductRouteSource) {
  return getCatalogProductRouteInfo(product).publicHref
}

export function normalizeCatalogProductPublicHref(href: string): string {
  const value = href.trim()
  if (!value) return value

  try {
    const url = new URL(value, 'https://www.vessel303.com')
    const isRelativeHref = value.startsWith('/')
    const isVesselHref = url.hostname === 'www.vessel303.com' || url.hostname === 'vessel303.com'
    const publicPath = PUBLIC_PRODUCT_HREF_BY_PATH[url.pathname]
    if (!publicPath || (!isRelativeHref && !isVesselHref)) return value
    return `${publicPath}${url.search}${url.hash}`
  } catch {
    return value
  }
}
