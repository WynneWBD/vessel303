'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SHOWCASE_MARKERS, type ShowcaseMarker } from '@/data/showcaseMarkers'
import type { ShowcaseProject } from '@/data/showcaseProjects'
import MapSkeleton from './MapSkeleton'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  buildGlobalCmsLabels,
  globalItemAttrs,
  globalModuleAttrs,
  type GlobalCmsLabels,
  type GlobalCmsLang,
  type GlobalPageModuleLike,
} from '@/lib/global-page-cms'

const GlobalMapDynamic = dynamic(() => import('./GlobalMapML'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

type ShowcaseProjectsModule = typeof import('@/data/showcaseProjects')

let showcaseProjectsModulePromise: Promise<ShowcaseProjectsModule> | null = null

function loadProjectDetailModule() {
  return import('./ProjectDetail')
}

function loadShowcaseProjectsModule() {
  showcaseProjectsModulePromise ??= import('@/data/showcaseProjects')
  return showcaseProjectsModulePromise
}

function scheduleIdlePreload(work: () => void) {
  if (typeof window === 'undefined') return undefined

  const idleWindow = window as Window & typeof globalThis & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
    cancelIdleCallback?: (handle: number) => void
  }

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(work, { timeout: 3500 })
    return () => {
      idleWindow.cancelIdleCallback?.(handle)
    }
  }

  const handle = window.setTimeout(work, 1800)
  return () => {
    window.clearTimeout(handle)
  }
}

const ProjectDetailDynamic = dynamic(loadProjectDetailModule, {
  ssr: false,
})

function visualOpenPanelAttrs(key: string) {
  return { 'data-visual-open-panel': key }
}

function setCampParam(id: string | null) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('camp', id)
  else url.searchParams.delete('camp')
  window.history.replaceState({}, '', url)
}

function PanelLoadingPreview({
  marker,
  lang,
  labels,
  onClose,
}: {
  marker: ShowcaseMarker
  lang: GlobalCmsLang
  labels: GlobalCmsLabels
  onClose: () => void
}) {
  const zh = lang === 'zh'
  const markerName = marker.name[zh ? 'zh' : 'en'] ?? marker.name.en
  return (
    <div
      {...globalModuleAttrs('map-labels')}
      style={{
        height: '100%',
        background: '#F5F2ED',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
      }}
    >
      <button
        onClick={onClose}
        aria-label={labels.closeLabel}
        {...visualOpenPanelAttrs('global-panel-close')}
        {...globalItemAttrs('map-labels', 'close', lang)}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          background: '#241F1B',
          border: '1px solid rgba(227,111,44,0.25)',
          borderRadius: 4,
          color: '#F5F2ED',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        x
      </button>
      <div
        style={{
          width: 'min(420px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: '2px solid rgba(227,111,44,0.25)',
            borderTopColor: '#E36F2C',
            borderRadius: '50%',
            animation: 'vessel-panel-spin 0.9s linear infinite',
          }}
        />
        <div
          style={{
            color: '#E36F2C',
            fontSize: 12,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontFamily: "-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif",
          }}
          {...globalItemAttrs('map-labels', 'panel-opening', lang)}
        >
          {labels.panelOpeningLabel}
        </div>
        <h2
          style={{
            color: '#241F1B',
            fontSize: 24,
            lineHeight: 1.25,
            margin: 0,
            fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
          }}
        >
          {markerName}
        </h2>
        <p
          style={{
            color: '#8A7D74',
            fontSize: 14,
            lineHeight: 1.7,
            margin: 0,
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
          {...globalItemAttrs('map-labels', 'panel-loading-body', lang, 'content')}
        >
          {labels.panelLoadingBody}
        </p>
      </div>
      <style>{`@keyframes vessel-panel-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function GlobalMapView({
  cmsProjects = [],
  pageModules = [],
}: {
  cmsProjects?: ShowcaseProject[]
  pageModules?: GlobalPageModuleLike[]
}) {
  const [selectedMarker, setSelectedMarker] = useState<ShowcaseMarker | null>(null)
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null)
  const [resetViewKey, setResetViewKey] = useState(0)
  const { lang } = useLanguage()
  const cmsLang: GlobalCmsLang = lang === 'zh' ? 'zh' : 'en'
  const labels = buildGlobalCmsLabels(pageModules, cmsLang)
  const searchParams = useSearchParams()
  const visualDraftPreview = searchParams?.get('visualDraft') === '1'
  const panelOpen = selectedMarker !== null
  const detailRequestId = useRef(0)
  const mirroredUrlOnce = useRef(false)
  const cmsProjectById = useMemo(() => new Map(cmsProjects.map((p) => [p.id, p])), [cmsProjects])
  const editableMarkerIds = useMemo(
    () => (visualDraftPreview ? cmsProjects.map((project) => project.id) : []),
    [cmsProjects, visualDraftPreview],
  )
  const showcaseMarkers = useMemo<ShowcaseMarker[]>(() => {
    const cmsMarkers = cmsProjects.map((project) => ({
      id: project.id,
      name: project.name,
      coordinates: project.coordinates,
    }))
    const cmsIds = new Set(cmsMarkers.map((m) => m.id))
    return [
      ...SHOWCASE_MARKERS.filter((marker) => !cmsIds.has(marker.id)),
      ...cmsMarkers,
    ]
  }, [cmsProjects])

  useEffect(() => {
    return scheduleIdlePreload(() => {
      void loadProjectDetailModule()
      void loadShowcaseProjectsModule()
    })
  }, [])

  const loadProjectDetails = useCallback(async (markerId: string, requestId: number) => {
    const cmsProject = cmsProjectById.get(markerId)
    if (cmsProject) {
      if (requestId !== detailRequestId.current) return
      setSelectedProject(cmsProject)
      return
    }
    const { SHOWCASE_PROJECTS } = await loadShowcaseProjectsModule()
    if (requestId !== detailRequestId.current) return
    const project = SHOWCASE_PROJECTS.find((p) => p.id === markerId) ?? null
    setSelectedProject(project)
  }, [cmsProjectById])

  const hydratedOnce = useRef(false)
  useEffect(() => {
    if (hydratedOnce.current) return
    hydratedOnce.current = true
    const campId = searchParams?.get('camp')
    if (!campId) return
    const marker = showcaseMarkers.find((m) => m.id === campId)
    if (!marker) return
    const frame = requestAnimationFrame(() => {
      const requestId = detailRequestId.current + 1
      detailRequestId.current = requestId
      setSelectedMarker(marker)
      setSelectedProject(null)
      loadProjectDetails(marker.id, requestId)
    })
    return () => cancelAnimationFrame(frame)
  }, [searchParams, loadProjectDetails, showcaseMarkers])

  useEffect(() => {
    if (!mirroredUrlOnce.current) {
      mirroredUrlOnce.current = true
      return
    }
    setCampParam(selectedMarker?.id ?? null)
  }, [selectedMarker])

  const handleShowcaseSelect = useCallback((marker: ShowcaseMarker) => {
    const requestId = detailRequestId.current + 1
    detailRequestId.current = requestId
    setSelectedMarker(marker)
    setSelectedProject(null)
    loadProjectDetails(marker.id, requestId)
  }, [loadProjectDetails])

  const handleClose = useCallback(() => {
    detailRequestId.current += 1
    setSelectedMarker(null)
    setSelectedProject(null)
    setResetViewKey((key) => key + 1)
  }, [])

  const flyTarget = selectedMarker
    ? [selectedMarker.coordinates[1], selectedMarker.coordinates[0]] as [number, number]
    : null
  const selectedProjectEditable = Boolean(
    visualDraftPreview && selectedProject && cmsProjectById.has(selectedProject.id),
  )

  return (
    <div
      {...globalModuleAttrs('map-labels')}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100dvh - var(--global-map-header-height, 56px))',
        overflow: 'hidden',
        display: 'flex',
        background: '#F5F2ED',
      }}
    >
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          width: panelOpen ? '30%' : '100%',
          height: '100%',
          transition: 'width 300ms ease-out',
        }}
      >
        <GlobalMapDynamic
          onShowcaseSelect={handleShowcaseSelect}
          onMapClick={handleClose}
          flyTarget={flyTarget}
          resetViewKey={resetViewKey}
          lang={lang}
          showcaseMarkers={showcaseMarkers}
          editableMarkerIds={editableMarkerIds}
          pageModules={pageModules}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '70%',
          height: '100%',
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out',
          zIndex: 100,
          borderLeft: '1px solid #E5DED4',
          background: '#F5F2ED',
        }}
      >
        {selectedProject ? (
          <ProjectDetailDynamic
            project={selectedProject}
            lang={lang}
            editable={selectedProjectEditable}
            pageModules={pageModules}
            onClose={handleClose}
          />
        ) : panelOpen ? (
          selectedMarker && (
            <PanelLoadingPreview
              marker={selectedMarker}
              lang={cmsLang}
              labels={labels}
              onClose={handleClose}
            />
          )
        ) : null}
      </div>
    </div>
  )
}
