type ProductRouteSource = {
  id: string
  detailSlug?: string | null
}

function cleanSlug(value: string | null | undefined) {
  const slug = value?.trim()
  return slug || null
}

export function getCatalogProductRouteInfo(product: ProductRouteSource) {
  const detailSlug = cleanSlug(product.detailSlug)
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
