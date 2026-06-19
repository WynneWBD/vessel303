const DEFAULT_VISUAL_MODULE_BY_PAGE: Record<string, string> = {
  home: 'hero',
  products: 'hero',
  cases: 'hero',
  contact: 'hero',
  site: 'navbar',
  auth: 'shared',
  account: 'header',
  about: 'hero',
  global: 'hero',
  faq: 'hero',
  'media-kit': 'hero',
  scenarios: 'inquiry-form',
  innovation: 'inquiry-form',
  display: 'hero',
  news: 'hero',
}

export function visualEditorModuleHref(moduleId: string): string {
  const safeModuleId = moduleId.includes(':') ? moduleId : visualEditorPageModuleId(moduleId)
  return `/admin/site/visual?module=${encodeURIComponent(safeModuleId)}#visual-editor`
}

export function visualEditorPageModuleHref(pageKey: string, moduleKey: string): string {
  return visualEditorModuleHref(`${pageKey}:${moduleKey}`)
}

export function visualEditorPageHref(pageKey: string | null | undefined): string {
  return visualEditorModuleHref(visualEditorPageModuleId(pageKey))
}

export const VISUAL_EDITOR_HOME_HERO_HREF = visualEditorPageHref('home')

function visualEditorPageModuleId(pageKey: string | null | undefined): string {
  const safePageKey = pageKey?.trim()
  if (!safePageKey) return 'home:hero'
  const moduleKey = DEFAULT_VISUAL_MODULE_BY_PAGE[safePageKey]
  return moduleKey ? `${safePageKey}:${moduleKey}` : 'home:hero'
}
