'use client'

import dynamic from 'next/dynamic'

const GlobalMap = dynamic(() => import('./GlobalMap'), { ssr: false })

export default function GlobalMapNoSSR() {
  return <GlobalMap />
}
