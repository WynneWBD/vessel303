'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, Popup, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPS } from '@/data/camps'
import type { Camp } from '@/data/camps'

const DEALER_COUNTRIES = ['俄罗斯', '台湾', '沙特阿拉伯', '阿联酋', '韩国', '美国']

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

// VESSEL HQ — Foshan Nanhai Shishan, Guangdong
const HQ = {
  lat: 23.0833,
  lng: 113.0167,
  tooltipEn: 'VESSEL Smart Factory · Foshan, China',
  tooltipZh: 'VESSEL 微宿智造总部 · 广东佛山',
  titleEn: 'VESSEL Smart Manufacturing HQ',
  titleZh: 'VESSEL 微宿智造总部',
  addressEn: 'Xingye North Road 253, Shishan, Nanhai, Foshan',
  addressZh: '广东省佛山市南海区狮山镇兴业北路253号',
  statsEn: '28,800㎡ Factory · 150 Units/Month · 30+ Countries',
  statsZh: '28,800㎡ 超级工厂 · 月产能150台 · 远销30+国家',
  sloganEn: 'Every VESSEL unit starts here.',
  sloganZh: '每一台微宿，从这里出发。',
}

// CSS injected into <head> — scoped to .vessel-map
const MAP_CSS = `
@keyframes vesselPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(227, 111, 44, 0.55); }
  60%       { box-shadow: 0 0 0 10px rgba(227, 111, 44, 0); }
}
@keyframes hqRipple {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(3); opacity: 0; }
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
/* HQ radar-tower marker */
.vessel-hq-marker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
}
.vessel-hq-marker .hq-core {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #E36F2C;
  border: 2px solid rgba(255,255,255,0.9);
  z-index: 2;
  cursor: pointer;
}
.vessel-hq-marker .hq-ring {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(227, 111, 44, 0.55);
  animation: hqRipple 2.5s ease-out infinite;
}
.vessel-hq-marker .hq-ring-2 {
  animation-delay: 0.8s;
}
/* HQ Popup dark override */
.vessel-hq-popup .leaflet-popup-content-wrapper {
  background: #1A1A1A;
  color: #F0F0F0;
  border-radius: 8px;
  border: 1px solid rgba(227,111,44,0.25);
  box-shadow: 0 8px 32px rgba(0,0,0,0.7);
  padding: 0;
}
.vessel-hq-popup .leaflet-popup-tip {
  background: #1A1A1A;
}
.vessel-hq-popup .leaflet-popup-content {
  margin: 0;
  width: auto !important;
}
.vessel-hq-popup .leaflet-popup-close-button {
  color: rgba(255,255,255,0.5) !important;
  font-size: 20px !important;
  top: 6px !important;
  right: 10px !important;
}
.vessel-hq-popup .leaflet-popup-close-button:hover {
  color: #fff !important;
}
/* Dim tile pane */
.vessel-map .leaflet-tile-pane {
  filter: brightness(0.72) saturate(0.8);
}
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
    html: `<div class="vessel-hq-marker">
      <div class="hq-ring"></div>
      <div class="hq-ring hq-ring-2"></div>
      <div class="hq-core"></div>
    </div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
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
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={TILE_URL}
        noWrap={true}
      />
      <ScaleControl position="bottomleft" imperial={false} />
      <FlyToController target={flyTarget ?? null} />
      <MapClickHandler onMapClick={onMapClick} suppress={suppressMapClick} />

      {/* VESSEL HQ — radar tower marker */}
      <Marker
        position={[HQ.lat, HQ.lng]}
        icon={hqIcon}
        zIndexOffset={9999}
        eventHandlers={{
          click: () => { suppressMapClick.current = true },
        }}
      >
        <Tooltip direction="top" offset={[0, -10]} opacity={0.97}>
          <span style={{ fontSize: 12, color: '#1A1A1E', whiteSpace: 'nowrap', fontFamily: 'sans-serif' }}>
            {isZh ? HQ.tooltipZh : HQ.tooltipEn}
          </span>
        </Tooltip>
        <Popup className="vessel-hq-popup" maxWidth={280} minWidth={240}>
          <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#E36F2C', marginBottom: 6, letterSpacing: '0.02em' }}>
              {isZh ? HQ.titleZh : HQ.titleEn}
            </div>
            <div style={{ fontSize: 11, color: '#8A8580', marginBottom: 12, lineHeight: 1.5 }}>
              {isZh ? HQ.addressZh : HQ.addressEn}
            </div>
            <div style={{ fontSize: 12, color: '#F0F0F0', marginBottom: 14, lineHeight: 1.6 }}>
              {isZh ? HQ.statsZh : HQ.statsEn}
            </div>
            <div style={{ fontSize: 11, color: '#E36F2C', fontStyle: 'italic', borderTop: '1px solid #2A2A2E', paddingTop: 10 }}>
              &ldquo;{isZh ? HQ.sloganZh : HQ.sloganEn}&rdquo;
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
