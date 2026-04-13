import type { Metadata } from 'next'
import GlobalMapStats from '@/components/GlobalMapStats'
import GlobalMapNoSSR from '@/components/GlobalMapNoSSR'

export const metadata: Metadata = {
  title: '全球营地部署 | VESSEL®',
}

export default function GlobalPage() {
  return (
    <div style={{ overflow: 'hidden', height: '100vh', background: '#1C1A18' }}>
      <GlobalMapStats />
      <div style={{ paddingTop: 56 }}>
        <GlobalMapNoSSR />
      </div>
    </div>
  )
}
