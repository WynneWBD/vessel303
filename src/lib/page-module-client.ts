'use client'

export type PublicPageModuleItem = {
  id: string
  image_url?: string
  video_url?: string
  video_poster_url?: string
  href?: string
  value_zh?: string
  value_en?: string
  content_zh?: string
  content_en?: string
  label_zh: string
  label_en: string
  is_visible: boolean
  sort_order: number
}

export type PublicPageModule = {
  id?: string
  page_key?: string
  module_key: string
  module_type?: string
  title_zh?: string
  title_en?: string
  description_zh?: string
  description_en?: string
  is_visible: boolean
  sort_order: number
  items?: PublicPageModuleItem[]
}

type PageModulesResponse = {
  data?: PublicPageModule[] | PublicPageModule | null
}

export type PublicLang = 'zh' | 'en'

export function moduleMap(modules: PublicPageModule[] | null | undefined) {
  return new Map((modules ?? []).map((pageModule) => [pageModule.module_key, pageModule]))
}

export function visibleItems(pageModule: PublicPageModule | null | undefined) {
  if (!pageModule || pageModule.is_visible === false || !Array.isArray(pageModule.items)) return []
  return [...pageModule.items]
    .filter((item) => item.is_visible !== false)
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
}

export function itemById(pageModule: PublicPageModule | null | undefined, id: string) {
  return visibleItems(pageModule).find((item) => item.id === id)
}

export function moduleTitle(pageModule: PublicPageModule | null | undefined, lang: PublicLang) {
  if (!pageModule || pageModule.is_visible === false) return ''
  return (lang === 'zh' ? pageModule.title_zh : pageModule.title_en) || ''
}

export function moduleDescription(pageModule: PublicPageModule | null | undefined, lang: PublicLang) {
  if (!pageModule || pageModule.is_visible === false) return ''
  return (lang === 'zh' ? pageModule.description_zh : pageModule.description_en) || ''
}

export function itemLabel(item: PublicPageModuleItem | null | undefined, lang: PublicLang) {
  if (!item || item.is_visible === false) return ''
  return (lang === 'zh' ? item.label_zh : item.label_en) || ''
}

export function itemContent(item: PublicPageModuleItem | null | undefined, lang: PublicLang) {
  if (!item || item.is_visible === false) return ''
  return (lang === 'zh' ? item.content_zh : item.content_en) || ''
}

export function itemValue(item: PublicPageModuleItem | null | undefined, lang: PublicLang) {
  if (!item || item.is_visible === false) return ''
  return (lang === 'zh' ? item.value_zh : item.value_en) || ''
}

export async function fetchPublicPageModules(pageKey: string, signal?: AbortSignal) {
  const res = await fetch(`/api/page-modules/${pageKey}`, { signal })
  if (!res.ok) return null
  const payload = (await res.json()) as PageModulesResponse
  return Array.isArray(payload.data) ? payload.data : null
}
