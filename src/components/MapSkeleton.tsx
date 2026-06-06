import StaticGlobalMapPreview from './StaticGlobalMapPreview'

// Shared map-loading skeleton for /global. It must stay light enough to render
// before MapLibre, style JSON, worker chunks, and map tiles finish loading.
export default function MapSkeleton() {
  return <StaticGlobalMapPreview showLoading loadingLabel="LOADING" />
}
