'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPS } from '@/data/camps'
import type { Camp } from '@/data/camps'
import { useLanguage } from '@/contexts/LanguageContext'

const DEALER_COUNTRIES = ['俄罗斯', '台湾', '沙特阿拉伯', '阿联酋', '韩国', '美国']

function hashOffset(str: string, salt: number): number {
  let hash = salt
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (hash % 100) / 1000
}

// Fly to a target when it changes
function FlyToController({ target }: { target: [number, number] | null }) {
  const map = useMap()
  const prevKey = useRef<string>('')
  useEffect(() => {
    if (!target) return
    const key = `${target[0]},${target[1]}`
    if (key === prevKey.current) return
    prevKey.current = key
    map.flyTo(target, 9, { duration: 1.5 })
  }, [target, map])
  return null
}

// Close panel when map background is clicked
function MapClickHandler({ onMapClick }: { onMapClick?: () => void }) {
  useMapEvents({ click: () => onMapClick?.() })
  return null
}

interface Props {
  onCampSelect?: (camp: Camp) => void
  onMapClick?: () => void
  flyTarget?: [number, number] | null
}

export default function GlobalMap({ onCampSelect, onMapClick, flyTarget }: Props) {
  const { lang } = useLanguage()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }, [])

  // suppress unused warning — lang is used indirectly via parent panel
  void lang

  return (
    <MapContainer
      center={[35, 105]}
      zoom={4}
      minZoom={2}
      maxZoom={16}
      style={{ height: '100%', width: '100%', background: '#111114' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        noWrap={true}
      />
      <ScaleControl position="bottomleft" imperial={false} />
      <FlyToController target={flyTarget ?? null} />
      <MapClickHandler onMapClick={onMapClick} />

      {/* Glow rings (decorative, behind main dots) */}
      {CAMPS.map((camp, i) => {
        const radius = Math.max(5, Math.sqrt(camp.total) * 1.2)
        const lat = camp.lat + hashOffset(camp.name, 1)
        const lng = camp.lng + hashOffset(camp.name, 2)
        return (
          <CircleMarker
            key={`glow-${i}`}
            center={[lat, lng]}
            radius={radius + 6}
            pathOptions={{ fillColor: '#2A5C5A', fillOpacity: 0.12, color: 'transparent', weight: 0 }}
          />
        )
      })}

      {/* Dealer copper rings */}
      {CAMPS.filter(c => DEALER_COUNTRIES.includes(c.country)).map((camp, i) => {
        const radius = Math.max(5, Math.sqrt(camp.total) * 1.2)
        const lat = camp.lat + hashOffset(camp.name, 1)
        const lng = camp.lng + hashOffset(camp.name, 2)
        return (
          <CircleMarker
            key={`dealer-${i}`}
            center={[lat, lng]}
            radius={radius + 4}
            pathOptions={{
              fillColor: 'transparent',
              fillOpacity: 0,
              color: '#A67C5B',
              weight: 2,
              opacity: 0.7,
              dashArray: '4 3',
            }}
          />
        )
      })}

      {/* Main markers */}
      {CAMPS.map((camp, i) => {
        const radius = Math.max(5, Math.sqrt(camp.total) * 1.2)
        const lat = camp.lat + hashOffset(camp.name, 1)
        const lng = camp.lng + hashOffset(camp.name, 2)
        return (
          <CircleMarker
            key={`marker-${i}`}
            center={[lat, lng]}
            radius={radius}
            pathOptions={{ fillColor: '#2A5C5A', fillOpacity: 0.75, color: '#2A5C5A', weight: 1.5 }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation()
                onCampSelect?.(camp)
              },
              mouseover: (e) => {
                e.target.setStyle({ fillOpacity: 1 })
                const el = e.target.getElement()
                if (el) el.style.cursor = 'pointer'
              },
              mouseout: (e) => {
                e.target.setStyle({ fillOpacity: 0.75 })
              },
            }}
          />
        )
      })}
    </MapContainer>
  )
}
