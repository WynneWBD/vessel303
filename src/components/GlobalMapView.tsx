'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import type { Camp } from '@/data/camps'
import GlobalMapPanel from './GlobalMapPanel'
import { useLanguage } from '@/contexts/LanguageContext'

const GlobalMapDynamic = dynamic(() => import('./GlobalMap'), { ssr: false })

export default function GlobalMapView() {
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null)
  const { lang } = useLanguage()

  const handleCampSelect = useCallback((camp: Camp) => {
    setSelectedCamp(camp)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedCamp(null)
  }, [])

  const panelOpen = selectedCamp !== null

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <div
        style={{
          width: panelOpen ? 'calc(100% - 380px)' : '100%',
          height: '100%',
          transition: 'width 300ms ease',
        }}
      >
        <GlobalMapDynamic
          onCampSelect={handleCampSelect}
          onMapClick={handleClose}
          flyTarget={selectedCamp ? [selectedCamp.lat, selectedCamp.lng] : null}
          lang={lang}
        />
      </div>
      <GlobalMapPanel camp={selectedCamp} lang={lang} onClose={handleClose} />
    </div>
  )
}
