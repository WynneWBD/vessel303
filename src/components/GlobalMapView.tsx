'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import type { ShowcaseProject } from '@/data/showcaseProjects'
import ProjectDetail from './ProjectDetail'
import { useLanguage } from '@/contexts/LanguageContext'

const GlobalMapDynamic = dynamic(() => import('./GlobalMapML'), { ssr: false })

export default function GlobalMapView() {
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null)
  const [resetViewKey, setResetViewKey] = useState(0)
  const { lang } = useLanguage()
  const panelOpen = selectedProject !== null

  const handleShowcaseSelect = useCallback((project: ShowcaseProject) => {
    setSelectedProject(project)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedProject(null)
    setResetViewKey(k => k + 1)
  }, [])

  // flyTarget in [lat, lng] for the map component
  // showcase project coordinates are [lng, lat] so we swap
  const flyTarget = selectedProject
    ? [selectedProject.coordinates[1], selectedProject.coordinates[0]] as [number, number]
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
        <ProjectDetail
          project={selectedProject}
          lang={lang}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
