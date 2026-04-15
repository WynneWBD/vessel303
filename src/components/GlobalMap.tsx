'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPS } from '@/data/camps'
import type { Camp } from '@/data/camps'

const DEALER_COUNTRIES = ['俄罗斯', '台湾', '沙特阿拉伯', '阿联酋', '韩国', '美国']

// Tile layers
const TILE_EN = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const TILE_ZH = 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=7tbP0DIfmG9T8qWYxh5M&language=zh'

// VESSEL HQ — Foshan Nanhai Shishan, Guangdong
const HQ = {
  lat: 23.0833,
  lng: 113.0167,
  labelEn: 'VESSEL HQ & Smart Factory',
  labelZh: 'VESSEL 微宿 · 超级工厂',
}

// CSS injected into <head> — scoped to .vessel-map
const MAP_CSS = `
@keyframes vesselPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(227, 111, 44, 0.55); }
  60%       { box-shadow: 0 0 0 10px rgba(227, 111, 44, 0); }
}
@keyframes hq-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}
.vessel-pin {
  border-radius: 50%;
  background: rgba(227, 111, 44, 0.88);
  border: 1.5px solid #E36F2C;
  animation: vesselPulse 2.6s ease-out infinite;
  cursor: pointer !important;
  box-sizing: border-box;
}
.vessel-pin-dealer {
  border: 2px dashed #A67C5B !important;
  background: rgba(227, 111, 44, 0.82) !important;
}
.vessel-hq-star {
  animation: hq-pulse 2s ease-in-out infinite;
  display: block;
  pointer-events: none;
}
/* Dim CartoDB tile layer (EN mode) */
.vessel-map .leaflet-tile-pane {
  filter: brightness(0.72) saturate(0.8);
}
/* Brighter dim for MapTiler (ZH mode — light base map) */
.vessel-map .leaflet-tile-pane.maptiler-dim {
  filter: brightness(0.6) contrast(1.15) saturate(0.8);
}
/* HQ permanent tooltip */
.vessel-hq-tooltip {
  background: rgba(26,26,26,0.85) !important;
  color: #F0F0F0 !important;
  border: 1px solid #E36F2C !important;
  border-radius: 4px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  padding: 4px 10px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
  white-space: nowrap !important;
}
.vessel-hq-tooltip::before { border-right-color: rgba(26,26,26,0.85) !important; }
/* Hide default marker shadows */
.vessel-map .leaflet-marker-shadow { display: none !important; }
`

function hashOffset(str: string, salt: number): number {
  let hash = salt
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (hash % 100) / 1000
}

function FlyToController({ target }: { target: [number, number] | null }) {
  const map = useMap()
  const prevKey = useRef('')
  useEffect(() => {
    if (!target) return
    const key = `${target[0]},${target[1]}`
    if (key === prevKey.current) return
    prevKey.current = key
    map.flyTo(target, 9, { duration: 1.5 })
  }, [target, map])
  return null
}

function MapClickHandler({
  onMapClick,
  suppress,
}: {
  onMapClick?: () => void
  suppress: React.MutableRefObject<boolean>
}) {
  useMapEvents({
    click: () => {
      if (suppress.current) {
        suppress.current = false
        return
      }
      onMapClick?.()
    },
  })
  return null
}

interface Props {
  onCampSelect?: (camp: Camp) => void
  onMapClick?: () => void
  flyTarget?: [number, number] | null
  lang?: string
}

export default function GlobalMap({ onCampSelect, onMapClick, flyTarget, lang }: Props) {
  const [mounted, setMounted] = useState(false)
  const suppressMapClick = useRef(false)

  useEffect(() => {
    const id = 'vessel-map-css'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = MAP_CSS
      document.head.appendChild(style)
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ height: '100%', width: '100%', background: '#1A1A1A' }} />
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet') as typeof import('leaflet')

  const isZh = lang === 'zh'

  function createIcon(size: number, isDealer: boolean) {
    const s = Math.round(Math.max(8, size))
    return L.divIcon({
      className: '',
      html: `<div class="vessel-pin${isDealer ? ' vessel-pin-dealer' : ''}" style="width:${s}px;height:${s}px"></div>`,
      iconSize: [s, s],
      iconAnchor: [s / 2, s / 2],
    })
  }

  const hqIcon = L.divIcon({
    className: '',
    html: `<svg class="vessel-hq-star" width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <polygon points="18,2 22.8,13.2 35,13.2 25,21.4 28.5,33 18,26 7.5,33 11,21.4 1,13.2 13.2,13.2"
        fill="#E36F2C" stroke="#fff" stroke-width="1.5"/>
    </svg>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })

  return (
    <MapContainer
      center={isZh ? [30, 105] : [20, 10]}
      zoom={isZh ? 4 : 2}
      minZoom={2}
      maxZoom={16}
      className="vessel-map"
      style={{ height: '100%', width: '100%', background: '#b8c4be' }}
    >
      {isZh ? (
        <TileLayer
          key="tile-zh"
          attribution="&copy; <a href='https://www.maptiler.com/copyright/'>MapTiler</a> &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
          url={TILE_ZH}
          tileSize={512}
          zoomOffset={-1}
          noWrap={true}
          className="maptiler-dim"
        />
      ) : (
        <TileLayer
          key="tile-en"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={TILE_EN}
          noWrap={true}
        />
      )}
      <ScaleControl position="bottomleft" imperial={false} />
      <FlyToController target={flyTarget ?? null} />
      <MapClickHandler onMapClick={onMapClick} suppress={suppressMapClick} />

      {/* VESSEL HQ — orange star with permanent label */}
      <Marker
        position={[HQ.lat, HQ.lng]}
        icon={hqIcon}
        zIndexOffset={9999}
        interactive={false}
      >
        <Tooltip
          permanent
          direction="right"
          offset={[20, 0]}
          className="vessel-hq-tooltip"
        >
          {isZh ? HQ.labelZh : HQ.labelEn}
        </Tooltip>
      </Marker>

      {/* Camp markers */}
      {CAMPS.map((camp, i) => {
        const radius = Math.max(5, Math.sqrt(camp.total) * 1.2)
        const size = radius * 2
        const isDealer = DEALER_COUNTRIES.includes(camp.country)
        const lat = camp.lat + hashOffset(camp.name, 1)
        const lng = camp.lng + hashOffset(camp.name, 2)

        return (
          <Marker
            key={i}
            position={[lat, lng]}
            icon={createIcon(size, isDealer)}
            eventHandlers={{
              click: () => {
                suppressMapClick.current = true
                onCampSelect?.(camp)
              },
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -Math.round(size / 2) - 2]}
              opacity={0.95}
              sticky={false}
            >
              <span style={{ fontSize: 12, color: '#1A1A1E', whiteSpace: 'nowrap', fontFamily: 'sans-serif' }}>
                {camp.name}
              </span>
            </Tooltip>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
