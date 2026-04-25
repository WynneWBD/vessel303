import type { Metadata } from 'next'
import { Suspense } from 'react'
import GlobalMapStats from '@/components/GlobalMapStats'
import GlobalMapView from '@/components/GlobalMapView'

export const metadata: Metadata = {
  title: '全球营地部署 | VESSEL®',
}

export default function GlobalPage() {
  return (
    <div style={{ overflow: 'hidden', height: '100vh', background: '#1A1A1A' }}>
      {/* Preload the style.json through our edge proxy so the browser starts
          fetching it in parallel with the map JS chunk, instead of waiting
          for maplibre-gl to finish parsing before requesting it. Saves one
          serial round-trip on slow mainland-China mobile links. */}
      <link
        rel="preload"
        as="fetch"
        href="/api/map/maps/streets-v2-dark/style.json"
        crossOrigin="anonymous"
      />
      <GlobalMapStats />
      {/* mobile navbar = row1(56px) + row2(36px) = 92px; desktop = 56px */}
      <div className="pt-[92px] md:pt-14">
        {/* GlobalMapView uses useSearchParams (for ?camp=… deep link),
            which requires a Suspense boundary for static prerender. */}
        <Suspense fallback={null}>
          <GlobalMapView />
        </Suspense>
      </div>
    </div>
  )
}
