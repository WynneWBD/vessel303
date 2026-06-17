import StaticGlobalMapPreview from './StaticGlobalMapPreview'
import type { GlobalCmsLang, GlobalPageModuleLike } from '@/lib/global-page-cms'

// Shared map-loading skeleton for /global. It must stay light enough to render
// before MapLibre, style JSON, worker chunks, and map tiles finish loading.
export default function MapSkeleton({
  lang = 'en',
  pageModules,
}: {
  lang?: GlobalCmsLang
  pageModules?: GlobalPageModuleLike[]
}) {
  return <StaticGlobalMapPreview showLoading lang={lang} pageModules={pageModules} />
}
