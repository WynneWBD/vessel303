import type { Metadata } from 'next'
import GlobalMapStats from '@/components/GlobalMapStats'
import GlobalMapView from '@/components/GlobalMapView'

export const metadata: Metadata = {
  title: '全球营地部署 | VESSEL®',
}

export default function GlobalPage() {
  return (
    <div style={{ overflow: 'hidden', height: '100vh', background: '#111114' }}>
      <GlobalMapStats />
      <div style={{ paddingTop: 56 }}>
        <GlobalMapView />
      </div>
    </div>
  )
}
