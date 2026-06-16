import type { CatalogDetailModule, CatalogDetailModuleItem } from '@/lib/products'

export const PRODUCT_CATALOG_CARD_MODULE_ID = 'catalog-card'

export type CatalogCardItemKey =
  | 'area'
  | 'model'
  | 'priceEyebrow'
  | 'showArea'
  | 'showRegion'
  | 'showPrice'

export function isProductCatalogCardModule(module: Pick<CatalogDetailModule, 'id'> | null | undefined) {
  return module?.id === PRODUCT_CATALOG_CARD_MODULE_ID
}

export function findProductCatalogCardModule(modules: CatalogDetailModule[] | null | undefined) {
  return modules?.find(isProductCatalogCardModule) ?? null
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function findModuleItem(items: CatalogDetailModuleItem[] | undefined, key: CatalogCardItemKey) {
  const normalizedKey = normalizeKey(key)
  return (items ?? []).find((item) => normalizeKey(item.title) === normalizedKey)
}

function itemValue(items: CatalogDetailModuleItem[] | undefined, key: CatalogCardItemKey) {
  const item = findModuleItem(items, key)
  return String(item?.body ?? '').trim()
}

export function catalogCardItemValue(
  module: CatalogDetailModule | null | undefined,
  key: CatalogCardItemKey,
  lang: 'en' | 'zh',
) {
  if (!module) return ''
  const primary = lang === 'en' ? module.items_en : module.items_cn
  const fallback = lang === 'en' ? module.items_cn : module.items_en
  return itemValue(primary, key) || itemValue(fallback, key)
}

export function catalogCardFlag(
  module: CatalogDetailModule | null | undefined,
  key: Extract<CatalogCardItemKey, 'showArea' | 'showRegion' | 'showPrice'>,
  fallback: boolean,
) {
  const raw = [
    itemValue(module?.items_cn, key),
    itemValue(module?.items_en, key),
  ].find(Boolean)

  if (!raw) return fallback
  const normalized = normalizeKey(raw)
  if (['0', 'false', 'off', 'no', 'hide', 'hidden', '否', '不显示', '隐藏'].includes(normalized)) return false
  if (['1', 'true', 'on', 'yes', 'show', 'visible', '是', '显示'].includes(normalized)) return true
  return fallback
}

export function upsertCatalogCardItem(
  items: CatalogDetailModuleItem[] | undefined,
  key: CatalogCardItemKey,
  value: string,
) {
  const next = [...(items ?? [])]
  const index = next.findIndex((item) => normalizeKey(item.title) === normalizeKey(key))
  const cleanValue = value.trim()
  if (!cleanValue) {
    return index >= 0 ? next.filter((_, itemIndex) => itemIndex !== index) : next
  }
  const item = { title: key, body: cleanValue }
  if (index >= 0) {
    next[index] = { ...next[index], ...item }
  } else {
    next.push(item)
  }
  return next
}
