'use client'

import { useEffect, useRef } from 'react'
import {
  Map as MaptilerMap,
  MapStyle,
  Language,
  Marker,
  NavigationControl,
  ScaleControl,
  Popup,
  config as maptilerConfig,
} from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import { CAMPS } from '@/data/camps'
import { SHOWCASE_PROJECTS } from '@/data/showcaseProjects'
import type { ShowcaseProject } from '@/data/showcaseProjects'

maptilerConfig.apiKey = '7tbP0DIfmG9T8qWYxh5M'

const DEALER_COUNTRIES = ['俄罗斯', '台湾', '沙特阿拉伯', '阿联酋', '韩国', '美国']

const HQ = {
  lng: 113.0167,
  lat: 23.0833,
  labelEn: 'VESSEL HQ & Smart Factory',
  labelZh: 'VESSEL 微宿 · 超级工厂',
}

function hashOffset(str: string, salt: number): number {
  let hash = salt
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (hash % 100) / 1000
}

const MARKER_CSS = `
@keyframes vesselPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(227, 111, 44, 0.55); }
  60%       { box-shadow: 0 0 0 10px rgba(227, 111, 44, 0); }
}
@keyframes hq-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}
@keyframes showcase-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.6), 0 0 0 0 rgba(227,111,44,0.55); }
  60%       { box-shadow: 0 0 0 14px rgba(255,255,255,0), 0 0 0 26px rgba(227,111,44,0); }
}
.vessel-hq-star {
  animation: hq-pulse 2s ease-in-out infinite;
  display: block;
  pointer-events: none;
}
.vessel-hq-label {
  position: absolute;
  left: 44px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(26,26,26,0.88);
  color: #F0F0F0;
  border: 1px solid #E36F2C;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  white-space: nowrap;
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  pointer-events: none;
}
/* Showcase project pin — much larger, white border, strong pulse halo */
.vessel-showcase-pin {
  width: 40px;
  height: 40px;
  background: #E36F2C;
  border: 4px solid #FFFFFF;
  border-radius: 50%;
  cursor: pointer;
  box-sizing: border-box;
  animation: showcase-ring 2.4s ease-out infinite;
  transition: transform 0.18s ease;
  position: relative;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
.vessel-showcase-pin:hover {
  transform: scale(1.25);
}
.vessel-showcase-pin::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.25);
  pointer-events: none;
}
/* Camp name hover popup */
.vessel-camp-popup .maplibregl-popup-content {
  background: rgba(240,240,240,0.96);
  color: #1A1A1E;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
  font-family: -apple-system, sans-serif;
  box-shadow: 0 1px 4px rgba(0,0,0,0.35);
  border: none;
}
.vessel-camp-popup .maplibregl-popup-tip {
  border-top-color: rgba(240,240,240,0.96);
}
/* MapLibre control buttons — dark theme */
.maplibregl-ctrl-group {
  background: rgba(26,26,26,0.85) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
}
.maplibregl-ctrl-group button {
  background-color: transparent !important;
  color: #F0F0F0 !important;
}
.maplibregl-ctrl-group button:hover {
  background-color: rgba(227,111,44,0.2) !important;
}
.maplibregl-ctrl-group button span {
  filter: invert(1) !important;
}
`

interface Props {
  onShowcaseSelect?: (project: ShowcaseProject) => void
  onMapClick?: () => void
  flyTarget?: [number, number] | null  // [lat, lng] — Leaflet convention from parent
  resetViewKey?: number  // increment to fly back to global default view
  lang?: string
}

export default function GlobalMapML({
  onShowcaseSelect,
  onMapClick,
  flyTarget,
  resetViewKey,
  lang,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaptilerMap | null>(null)
  const suppressClick = useRef(false)
  const hqLabelRef = useRef<HTMLDivElement | null>(null)
  const prevFlyKey = useRef('')
  const prevResetKey = useRef(resetViewKey ?? 0)
  const isZhRef = useRef(lang === 'zh')

  // Keep callbacks current without re-initializing the map
  const onShowcaseSelectRef = useRef(onShowcaseSelect)
  const onMapClickRef = useRef(onMapClick)
  useEffect(() => { onShowcaseSelectRef.current = onShowcaseSelect }, [onShowcaseSelect])
  useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])

  const isZh = lang === 'zh'

  // ── Initialize map (once) ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const cssId = 'vessel-mapml-css'
    if (!document.getElementById(cssId)) {
      const style = document.createElement('style')
      style.id = cssId
      style.textContent = MARKER_CSS
      document.head.appendChild(style)
    }

    const map = new MaptilerMap({
      container: containerRef.current,
      style: MapStyle.STREETS.DARK,
      center: isZhRef.current ? [105, 30] : [10, 20],
      zoom: isZhRef.current ? 3 : 2,
      minZoom: 1.5,
      maxZoom: 16,
      renderWorldCopies: false,
    })
    mapRef.current = map

    // Hover popup for regular camp name
    const hoverPopup = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'vessel-camp-popup',
    })

    map.on('load', () => {
      // ── Language ──────────────────────────────────────────────────────
      map.setLanguage(isZhRef.current ? Language.CHINESE : Language.ENGLISH)

      // ── Regular camp GeoJSON ──────────────────────────────────────────
      const campFeatures: GeoJSON.Feature<GeoJSON.Point>[] = CAMPS.map((camp, i) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            camp.lng + hashOffset(camp.name, 2),
            camp.lat + hashOffset(camp.name, 1),
          ],
        },
        properties: {
          index: i,
          name: camp.name,
          isDealer: DEALER_COUNTRIES.includes(camp.country),
          radius: Math.max(5, Math.sqrt(camp.total) * 1.2),
        },
      }))

      map.addSource('camps', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: campFeatures },
      })

      // Regular camp circles (below showcase markers)
      map.addLayer({
        id: 'camps-layer',
        type: 'circle',
        source: 'camps',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': '#E36F2C',
          'circle-opacity': 0.85,
          'circle-stroke-width': ['case', ['boolean', ['get', 'isDealer'], false], 2.5, 1.5],
          'circle-stroke-color': ['case', ['boolean', ['get', 'isDealer'], false], '#A67C5B', 'rgba(255,255,255,0.22)'],
          'circle-stroke-opacity': 1,
        },
      })

      // Hover: cursor + name popup
      map.on('mouseenter', 'camps-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const feats = (e as { features?: { geometry: unknown; properties: Record<string, unknown> }[] }).features
        if (feats?.length) {
          const coords = (feats[0].geometry as GeoJSON.Point).coordinates as [number, number]
          const name = (feats[0].properties?.name ?? '') as string
          hoverPopup.setLngLat(coords).setText(name).addTo(map)
        }
      })
      map.on('mouseleave', 'camps-layer', () => {
        map.getCanvas().style.cursor = ''
        hoverPopup.remove()
      })

      // Click regular camp — suppress background dismiss, show tooltip only
      map.on('click', 'camps-layer', () => {
        suppressClick.current = true
      })

      // Background click — close detail panel
      map.on('click', () => {
        if (suppressClick.current) { suppressClick.current = false; return }
        onMapClickRef.current?.()
      })

      // ── Map controls ──────────────────────────────────────────────────
      map.addControl(new NavigationControl({ showCompass: false }), 'top-left')
      map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left')

      // ── VESSEL HQ star ────────────────────────────────────────────────
      const hqWrapper = document.createElement('div')
      hqWrapper.style.cssText = 'position:relative;width:36px;height:36px;pointer-events:none;'
      hqWrapper.innerHTML = `
        <svg class="vessel-hq-star" width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <polygon points="18,2 22.8,13.2 35,13.2 25,21.4 28.5,33 18,26 7.5,33 11,21.4 1,13.2 13.2,13.2"
            fill="#E36F2C" stroke="#fff" stroke-width="1.5"/>
        </svg>
        <div class="vessel-hq-label">${isZhRef.current ? HQ.labelZh : HQ.labelEn}</div>
      `
      hqLabelRef.current = hqWrapper.querySelector<HTMLDivElement>('.vessel-hq-label')

      new Marker({ element: hqWrapper, anchor: 'center' })
        .setLngLat([HQ.lng, HQ.lat])
        .addTo(map)

      // ── Showcase project markers (HTML, with pulse animation) ─────────
      SHOWCASE_PROJECTS.forEach((project) => {
        const el = document.createElement('div')
        el.className = 'vessel-showcase-pin'
        el.title = project.name.en

        // Click → open detail panel (stops propagation so map click doesn't also fire)
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          onShowcaseSelectRef.current?.(project)
        })

        // Hover popup with project name
        const showcasePopup = new Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 18,
          className: 'vessel-camp-popup',
        })

        el.addEventListener('mouseenter', () => {
          map.getCanvas().style.cursor = 'pointer'
          showcasePopup
            .setLngLat(project.coordinates)
            .setText(project.name[isZhRef.current ? 'zh' : 'en'])
            .addTo(map)
        })
        el.addEventListener('mouseleave', () => {
          map.getCanvas().style.cursor = ''
          showcasePopup.remove()
        })

        console.log(`[VESSEL MAP] Showcase marker "${project.id}": setLngLat([${project.coordinates[0]}, ${project.coordinates[1]}]) — lng=${project.coordinates[0]}, lat=${project.coordinates[1]}`)
        new Marker({ element: el, anchor: 'center' })
          .setLngLat(project.coordinates)
          .addTo(map)
      })
    })

    // Auto-resize on container dimension change (panel open/close)
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Language switching ────────────────────────────────────────────────
  useEffect(() => {
    isZhRef.current = isZh
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      map.setLanguage(isZh ? Language.CHINESE : Language.ENGLISH)
      if (hqLabelRef.current) {
        hqLabelRef.current.textContent = isZh ? HQ.labelZh : HQ.labelEn
      }
    }
    if (map.loaded()) apply()
    else map.once('load', apply)
  }, [isZh])

  // ── FlyTo showcase project ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyTarget) return
    const key = `${flyTarget[0]},${flyTarget[1]}`
    if (key === prevFlyKey.current) return
    prevFlyKey.current = key
    // flyTarget is [lat, lng]; MapLibre wants [lng, lat]
    map.flyTo({ center: [flyTarget[1], flyTarget[0]], zoom: 11, duration: 1600 })
  }, [flyTarget])

  // ── Reset to global view when panel closes ────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (resetViewKey === undefined || resetViewKey === 0) return
    if (resetViewKey === prevResetKey.current) return
    prevResetKey.current = resetViewKey
    prevFlyKey.current = ''  // allow re-selecting same project
    map.flyTo({
      center: isZhRef.current ? [105, 30] : [10, 20],
      zoom: isZhRef.current ? 3 : 2,
      duration: 1400,
    })
  }, [resetViewKey])

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', background: '#1A1A1A' }}
    />
  )
}
