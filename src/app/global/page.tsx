import type { Metadata } from 'next'
import { Suspense } from 'react'
import GlobalMapStats from '@/components/GlobalMapStats'
import GlobalMapView from '@/components/GlobalMapView'
import MapSkeleton from '@/components/MapSkeleton'
import { buildGlobalCmsLabels } from '@/lib/global-page-cms'
import { listPublishedProjectCases } from '@/lib/project-cases-db'
import { projectCaseToShowcaseProject } from '@/lib/project-cases-global'
import { listPublishedPageModules } from '@/lib/page-modules-db'
import type { ShowcaseProject } from '@/data/showcaseProjects'

export const dynamic = 'force-dynamic'

async function loadGlobalPageModules() {
  return listPublishedPageModules('global').catch((err) => {
    console.warn('[global] page modules unavailable', err)
    return []
  })
}

export async function generateMetadata(): Promise<Metadata> {
  const pageModules = await loadGlobalPageModules()
  const labels = buildGlobalCmsLabels(pageModules, 'en')

  return {
    title: labels.seoTitle,
    description: labels.seoDescription,
    openGraph: {
      title: labels.seoTitle,
      description: labels.seoDescription,
      url: 'https://www.vessel303.com/global',
      siteName: 'VESSEL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: labels.seoTitle,
      description: labels.seoDescription,
    },
  }
}

export default async function GlobalPage() {
  const [cmsProjects, pageModules] = await Promise.all([
    listPublishedProjectCases()
      .then((projects) => projects
        .map(projectCaseToShowcaseProject)
        .filter((project): project is ShowcaseProject => Boolean(project)))
      .catch((err) => {
        console.error('[global] project cases db unavailable', err)
        return []
      }),
    loadGlobalPageModules(),
  ])

  return (
    <div className="vessel-global-page" style={{ overflow: 'hidden', height: '100vh', background: '#F5F2ED' }}>
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
        href="/api/map/maps/streets-v2-light/style.json"
      />
      <GlobalMapStats pageModules={pageModules} />
      {/* mobile navbar = row1(56px) + row2(36px) = 92px; desktop = 56px */}
      <div className="vessel-global-map-stage" style={{ position: 'relative', height: '100vh' }}>
        {/* GlobalMapView uses useSearchParams (for ?camp=… deep link),
            which requires a Suspense boundary for static prerender. The
            fallback is rendered into the SSR HTML, so users see the orange
            spinner the moment the document arrives — no black flash while
            the map JS chunk is downloading. */}
        <Suspense fallback={<MapSkeleton pageModules={pageModules} />}>
          <GlobalMapView cmsProjects={cmsProjects} pageModules={pageModules} />
        </Suspense>
      </div>
      <style>{`
        html,
        body {
          margin: 0;
        }
        .vessel-global-page {
          --global-map-header-height: 92px;
        }
        .vessel-global-map-stage {
          box-sizing: border-box;
          padding-top: var(--global-map-header-height);
        }
        @media (min-width: 768px) {
          .vessel-global-page {
            --global-map-header-height: 56px;
          }
        }
      `}</style>
    </div>
  )
}
