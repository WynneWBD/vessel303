'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, ScaleControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPS } from '@/data/camps'
import { useLanguage } from '@/contexts/LanguageContext'

function hashOffset(str: string, salt: number): number {
  let hash = salt
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (hash % 100) / 1000
}

export default function GlobalMap() {
  const { lang } = useLanguage()
  const en = lang === 'en'

  useEffect(() => {
    // Fix leaflet default icon path issue in Next.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }, [])

  return (
    <MapContainer
      center={[35, 105]}
      zoom={4}
      minZoom={2}
      maxZoom={16}
      style={{ height: 'calc(100vh - 56px)', width: '100%', background: '#a8c8f0' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        noWrap={true}
      />
      <ScaleControl position="bottomleft" imperial={false} />
      {CAMPS.map((camp, i) => (
        <CircleMarker
          key={i}
          center={[camp.lat + hashOffset(camp.name, 1), camp.lng + hashOffset(camp.name, 2)]}
          radius={Math.max(5, Math.sqrt(camp.total) * 1.2)}
          pathOptions={{
            fillColor: '#C9A84C',
            fillOpacity: 0.85,
            color: '#8B6914',
            weight: 1.5,
          }}
          eventHandlers={{
            mouseover: (e) => {
              e.target.setStyle({ fillOpacity: 1 })
            },
            mouseout: (e) => {
              e.target.setStyle({ fillOpacity: 0.85 })
            },
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'sans-serif', minWidth: 160 }}>
              <div style={{ fontWeight: 700, color: '#1C1A18', marginBottom: 4, fontSize: 14 }}>
                {camp.name}
              </div>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 2 }}>
                {camp.country}{camp.province && camp.province !== '—' ? ` · ${camp.province}` : ''}
              </div>
              <div style={{ color: '#444', fontSize: 12, marginBottom: 2 }}>
                {en ? 'Devices: ' : '设备总量：'}<strong>{camp.total}</strong>{en ? '' : ' 台'}
                {camp.online > 0 && <span style={{ color: '#2a9d2a' }}>{en ? ` · Online: ${camp.online}` : `（在线 ${camp.online}）`}</span>}
              </div>
              {camp.models && (
                <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                  {en ? 'Models: ' : '型号：'}{camp.models}
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
