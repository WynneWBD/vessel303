import type { Metadata } from 'next'
import { Suspense } from 'react'
import GlobalMapStats from '@/components/GlobalMapStats'
import GlobalMapView from '@/components/GlobalMapView'
import MapSkeleton from '@/components/MapSkeleton'
import { listPublishedProjectCases } from '@/lib/project-cases-db'
import { projectCaseToShowcaseProject } from '@/lib/project-cases-global'
import type { ShowcaseProject } from '@/data/showcaseProjects'

export const metadata: Metadata = {
  title: '全球营地部署 | VESSEL®',
}

export const dynamic = 'force-dynamic'

export default async function GlobalPage() {
  const cmsProjects: ShowcaseProject[] = await listPublishedProjectCases()
    .then((projects) => projects
      .map(projectCaseToShowcaseProject)
      .filter((project): project is ShowcaseProject => Boolean(project)))
    .catch((err) => {
      console.error('[global] project cases db unavailable', err)
      return []
    })

  return (
    <div style={{ overflow: 'hidden', height: '100vh', background: '#241F1B' }}>
      {/* Preload the style.json through our edge proxy so the browser starts
          fetching it in parallel with the map JS chunk, instead of waiting
          for maplibre-gl to finish parsing before requesting it. Saves one
          serial round-trip on slow mainland-China mobile links.
          NOTE: no `crossOrigin` attribute — maplibre's internal fetch is
          same-origin without `crossorigin` mode, and the preload's
          credentials mode must match for the browser to reuse it. With
          `crossOrigin="anonymous"` the preload is double-fetched. */}
      <link
        rel="preload"
        as="fetch"
        href="/api/map/maps/streets-v2-dark/style.json"
      />
      <GlobalMapStats />
      {/* mobile navbar = row1(56px) + row2(36px) = 92px; desktop = 56px */}
      <div className="pt-[92px] md:pt-14" style={{ position: 'relative', height: '100vh' }}>
        {/* GlobalMapView uses useSearchParams (for ?camp=… deep link),
            which requires a Suspense boundary for static prerender. The
            fallback is rendered into the SSR HTML, so users see the orange
            spinner the moment the document arrives — no black flash while
            the map JS chunk is downloading. */}
        <Suspense fallback={<MapSkeleton />}>
          <GlobalMapView cmsProjects={cmsProjects} />
        </Suspense>
      </div>
    </div>
  )
}
