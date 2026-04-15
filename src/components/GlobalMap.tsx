'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, Popup, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPS } from '@/data/camps'
import type { Camp } from '@/data/camps'

const DEALER_COUNTRIES = ['俄罗斯', '台湾', '沙特阿拉伯', '阿联酋', '韩国', '美国']

// VESSEL HQ — Foshan, Guangdong
const HQ = {
  lat: 23.0833,
  lng: 113.0167,
  labelEn: 'VESSEL HQ & Smart Factory',
  labelZh: 'VESSEL 微宿 · 超级工厂',
  titleEn: 'VESSEL Smart Manufacturing HQ',
  titleZh: 'VESSEL 微宿智造总部',
  addressEn: 'Xingye North Road 253, Shishan, Nanhai, Foshan, Guangdong',
  addressZh: '广东省佛山市南海区狮山镇兴业北路253号',
  statsEn: '28,800㎡ Factory · 150 Units/Month · Shipping to 30+ Countries',
  statsZh: '28,800㎡ 超级工厂 · 月产能 150台 · 远销 30+ 国家',
  taglineEn: 'Every VESSEL unit starts here.',
  taglineZh: '每一台微宿，从这里出发。',
}

// CSS injected into <head> — scoped to .vessel-map class
const MAP_CSS = `
@keyframes vesselPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(227, 111, 44, 0.55); }
  60%       { box-shadow: 0 0 0 10px rgba(227, 111, 44, 0); }
}
@keyframes hqPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(227, 111, 44, 0.75); }
  60%       { box-shadow: 0 0 0 16px rgba(227, 111, 44, 0); }
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
.vessel-hq-pin {
  width: 16px;
  height: 16px;
  background: #E36F2C;
  border: 2.5px solid #fff;
  transform: rotate(45deg);
  animation: hqPulse 2s ease-out infinite;
  cursor: pointer !important;
  box-sizing: border-box;
}
/* Leaflet tooltip for permanent HQ label */
.vessel-hq-label {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}
.vessel-hq-label::before { display: none !important; }
/* Dark popup for HQ */
.vessel-hq-popup .leaflet-popup-content-wrapper {
  background: #1A1A1E;
  color: #F0F0F0;
  border: 1px solid #2A2A2E;
  border-radius: 4px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.7);
  padding: 0;
}
.vessel-hq-popup .leaflet-popup-tip-container { display: none; }
.vessel-hq-popup .leaflet-popup-content { margin: 0; }
.vessel-hq-popup .leaflet-popup-close-button {
  color: #8A8580 !important;
  font-size: 18px !important;
  top: 8px !important;
  right: 10px !important;
}
/* Dim tile pane */
.vessel-map .leaflet-tile-pane {
  filter: brightness(0.72) saturate(0.8);
}
/* Hide default leaflet marker shadows */
.vessel-map .leaflet-marker-shadow { display: none !important; }
`

// CartoDB Voyager — works for both EN and ZH (auto local language at higher zoom)
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

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

// Close panel on map background click
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
    html: '<div class="vessel-hq-pin"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

  return (
    <MapContainer
      center={[35, 105]}
      zoom={isZh ? 4 : 2}
      minZoom={2}
      maxZoom={16}
      className="vessel-map"
      style={{ height: '100%', width: '100%', background: '#b8c4be' }}
    >
      <TileLayer
        key={isZh ? 'tile-zh' : 'tile-en'}
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={TILE_URL}
        noWrap={true}
      />
      <ScaleControl position="bottomleft" imperial={false} />
      <FlyToController target={flyTarget ?? null} />
      <MapClickHandler onMapClick={onMapClick} suppress={suppressMapClick} />

      {/* VESSEL HQ marker */}
      <Marker
        position={[HQ.lat, HQ.lng]}
        icon={hqIcon}
        zIndexOffset={1000}
        eventHandlers={{
          click: () => { suppressMapClick.current = true },
        }}
      >
        <Tooltip
          permanent
          direction="top"
          offset={[0, -14]}
          className="vessel-hq-label"
        >
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#E36F2C',
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap', letterSpacing: '0.04em',
          }}>
            {isZh ? HQ.labelZh : HQ.labelEn}
          </span>
        </Tooltip>
        <Popup className="vessel-hq-popup" minWidth={280} maxWidth={320}>
          <div style={{ padding: '16px 20px 20px', fontFamily: 'sans-serif' }}>
            {/* Header strip */}
            <div style={{ borderBottom: '1px solid #2A2A2E', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#E36F2C', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
                {isZh ? '智造总部' : 'Smart Manufacturing HQ'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0', letterSpacing: '0.02em' }}>
                {isZh ? HQ.titleZh : HQ.titleEn}
              </div>
            </div>
            {/* Address */}
            <div style={{ fontSize: 11, color: '#8A8580', lineHeight: 1.5, marginBottom: 10 }}>
              {isZh ? HQ.addressZh : HQ.addressEn}
            </div>
            {/* Stats */}
            <div style={{
              fontSize: 11, color: '#E36F2C', background: 'rgba(227,111,44,0.08)',
              border: '1px solid rgba(227,111,44,0.2)',
              padding: '6px 10px', marginBottom: 12, lineHeight: 1.6,
            }}>
              {isZh ? HQ.statsZh : HQ.statsEn}
            </div>
            {/* Tagline */}
            <div style={{ fontSize: 12, color: '#6A6560', fontStyle: 'italic', letterSpacing: '0.03em' }}>
              "{isZh ? HQ.taglineZh : HQ.taglineEn}"
            </div>
          </div>
        </Popup>
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
