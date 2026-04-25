'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SHOWCASE_MARKERS, type ShowcaseMarker } from '@/data/showcaseMarkers'
import type { ShowcaseProject } from '@/data/showcaseProjects'
import MapSkeleton from './MapSkeleton'
import { useLanguage } from '@/contexts/LanguageContext'

const GlobalMapDynamic = dynamic(() => import('./GlobalMapML'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

// Detail panel chunk (~25 KB gz) — only fetched after the user clicks a
// marker, so the map first-paint never pays its cost.
const ProjectDetailDynamic = dynamic(() => import('./ProjectDetail'), {
  ssr: false,
})

// Sync URL without triggering a Next router re-render — the map state owns
// what's visible, the URL is just a shareable mirror.
function setCampParam(id: string | null) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('camp', id)
  else url.searchParams.delete('camp')
  window.history.replaceState({}, '', url)
}

// Shown inside the right-hand panel during the brief gap between marker click
// and project detail being ready (chunk + showcaseProjects.ts download). Only
// appears on the very first marker click of the session; subsequent clicks
// hit the cached module and render content synchronously.
function PanelLoadingSpinner({ lang, onClose }: { lang: string; onClose: () => void }) {
  const zh = lang === 'zh'
  return (
    <div style={{
      height: '100%',
      background: '#141414',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <button
        onClick={onClose}
        aria-label={zh ? '关闭' : 'Close'}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 36, height: 36,
          background: 'rgba(14,14,14,0.88)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 4, color: '#F0F0F0',
          cursor: 'pointer', fontSize: 20, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ×
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 28, height: 28,
          border: '2px solid rgba(227,111,44,0.25)',
          borderTopColor: '#E36F2C',
          borderRadius: '50%',
          animation: 'vessel-panel-spin 0.9s linear infinite',
        }} />
        <div style={{
          color: 'rgba(240,240,240,0.55)',
          fontSize: 12,
          letterSpacing: '0.15em',
          fontFamily: "-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif",
        }}>
          {zh ? '加载项目详情' : 'LOADING PROJECT'}
        </div>
      </div>
      <style>{`@keyframes vessel-panel-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function GlobalMapView() {
  // selectedMarker drives panel-open + flyTo (slim, always-loaded);
  // selectedProject drives ProjectDetail content (lazy-loaded on first click).
  const [selectedMarker, setSelectedMarker] = useState<ShowcaseMarker | null>(null)
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null)
  const [resetViewKey, setResetViewKey] = useState(0)
  const { lang } = useLanguage()
  const panelOpen = selectedMarker !== null

  // Async-load the full ShowcaseProject for a given marker id. First call
  // pays a chunk download; subsequent calls reuse the cached module.
  const loadProjectDetails = useCallback(async (markerId: string) => {
    const { SHOWCASE_PROJECTS } = await import('@/data/showcaseProjects')
    const project = SHOWCASE_PROJECTS.find((p) => p.id === markerId) ?? null
    setSelectedProject((prev) => {
      // If user navigated away or switched markers while we were loading,
      // bail out so we don't stomp the newer selection.
      if (prev && prev.id !== markerId) return prev
      return project
    })
  }, [])

  // ── Deep link: open ?camp=<id> on mount ────────────────────────────────
  const searchParams = useSearchParams()
  const hydratedOnce = useRef(false)
  useEffect(() => {
    if (hydratedOnce.current) return
    hydratedOnce.current = true
    const campId = searchParams?.get('camp')
    if (!campId) return
    const marker = SHOWCASE_MARKERS.find((m) => m.id === campId)
    if (!marker) return
    setSelectedMarker(marker)
    loadProjectDetails(marker.id)
  }, [searchParams, loadProjectDetails])

  // Mirror state → URL
  useEffect(() => {
    setCampParam(selectedMarker?.id ?? null)
  }, [selectedMarker])

  const handleShowcaseSelect = useCallback((marker: ShowcaseMarker) => {
    setSelectedMarker(marker)
    setSelectedProject(null)  // clear stale content while new details load
    loadProjectDetails(marker.id)
  }, [loadProjectDetails])

  const handleClose = useCallback(() => {
    setSelectedMarker(null)
    setSelectedProject(null)
    setResetViewKey(k => k + 1)
  }, [])

  // flyTarget in [lat, lng] for the map component
  // marker.coordinates is [lng, lat] so we swap
  const flyTarget = selectedMarker
    ? [selectedMarker.coordinates[1], selectedMarker.coordinates[0]] as [number, number]
    : null

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 56px)',
      overflow: 'hidden',
      display: 'flex',
      background: '#1A1A1A',
    }}>

      {/* ── Map — shrinks to 30% when detail panel is open ── */}
      <div style={{
        flexShrink: 0,
        width: panelOpen ? '30%' : '100%',
        height: '100%',
        transition: 'width 300ms ease-out',
      }}>
        <GlobalMapDynamic
          onShowcaseSelect={handleShowcaseSelect}
          onMapClick={handleClose}
          flyTarget={flyTarget}
          resetViewKey={resetViewKey}
          lang={lang}
        />
      </div>

      {/* ── Project Detail Panel — slides in from right, 70% width ── */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: '70%', height: '100%',
        transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease-out',
        zIndex: 100,
        borderLeft: '1px solid #2A2A2E',
      }}>
        {selectedProject ? (
          <ProjectDetailDynamic
            project={selectedProject}
            lang={lang}
            onClose={handleClose}
          />
        ) : panelOpen ? (
          <PanelLoadingSpinner lang={lang} onClose={handleClose} />
        ) : null}
      </div>
    </div>
  )
}
