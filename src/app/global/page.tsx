import type { Metadata } from 'next'
import GlobalMapStats from '@/components/GlobalMapStats'
import GlobalMapView from '@/components/GlobalMapView'

export const metadata: Metadata = {
  title: '全球营地部署 | VESSEL®',
}

export default function GlobalPage() {
  return (
    <div style={{ overflow: 'hidden', height: '100vh', background: '#1A1A1A' }}>
      <GlobalMapStats />
      {/* mobile navbar = row1(56px) + row2(36px) = 92px; desktop = 56px */}
      <div className="pt-[92px] md:pt-14">
        <GlobalMapView />
      </div>
    </div>
  )
}
