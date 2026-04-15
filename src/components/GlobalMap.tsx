'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPS } from '@/data/camps'
import type { Camp } from '@/data/camps'

const DEALER_COUNTRIES = ['俄罗斯', '台湾', '沙特阿拉伯', '阿联酋', '韩国', '美国']

// CSS injected into <head> — scoped to .vessel-map class
const MAP_CSS = `
@keyframes vesselPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(42, 92, 90, 0.55); }
  60%       { box-shadow: 0 0 0 10px rgba(42, 92, 90, 0); }
}
.vessel-pin {
  border-radius: 50%;
  background: rgba(42, 92, 90, 0.88);
  border: 1.5px solid #2A5C5A;
  animation: vesselPulse 2.6s ease-out infinite;
  cursor: pointer !important;
  box-sizing: border-box;
}
.vessel-pin-dealer {
  border: 2px dashed #A67C5B !important;
  background: rgba(42, 92, 90, 0.82) !important;
}
/* Dim the Voyager tile layer */
.vessel-map .leaflet-tile-pane {
  filter: brightness(0.72) saturate(0.8);
}
/* Hide default leaflet marker shadows */
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

// Fly to target when selectedCamp changes
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

// Close panel on map background click — uses a suppress ref to avoid double-firing
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
}

export default function GlobalMap({ onCampSelect, onMapClick, flyTarget }: Props) {
  const [mounted, setMounted] = useState(false)
  const suppressMapClick = useRef(false)

  useEffect(() => {
    // Inject scoped CSS once
    const id = 'vessel-map-css'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = MAP_CSS
      document.head.appendChild(style)
    }

    // Fix Leaflet default icon paths
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

  // Placeholder until Leaflet is ready
  if (!mounted) {
    return <div style={{ height: '100%', width: '100%', background: '#111114' }} />
  }

  // Safe to require after mount (ssr:false guaranteed)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet') as typeof import('leaflet')

  function createIcon(size: number, isDealer: boolean) {
    const s = Math.round(Math.max(8, size))
    return L.divIcon({
      className: '',
      html: `<div class="vessel-pin${isDealer ? ' vessel-pin-dealer' : ''}" style="width:${s}px;height:${s}px"></div>`,
      iconSize: [s, s],
      iconAnchor: [s / 2, s / 2],
    })
  }

  return (
    <MapContainer
      center={[35, 105]}
      zoom={4}
      minZoom={2}
      maxZoom={16}
      className="vessel-map"
      style={{ height: '100%', width: '100%', background: '#b8c4be' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        noWrap={true}
      />
      <ScaleControl position="bottomleft" imperial={false} />
      <FlyToController target={flyTarget ?? null} />
      <MapClickHandler onMapClick={onMapClick} suppress={suppressMapClick} />

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
