'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Map as MaptilerMap,
  Language,
  Marker,
  NavigationControl,
  ScaleControl,
  Popup,
  config as maptilerConfig,
} from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import { CAMPS } from '@/data/camps'
import { SHOWCASE_MARKERS, HQ_MARKER, type ShowcaseMarker } from '@/data/showcaseMarkers'

// The real MapTiler API key now lives on the edge proxy (see src/app/api/map/
// [...path]/route.ts). Setting the SDK's apiKey to a placeholder stops it from
// rejecting calls before our transformRequest rewrites them.
maptilerConfig.apiKey = 'proxied'

// Pin to streets-v2-dark via our edge proxy. The first mainland-China visitor
// pays the cold-miss penalty (one edge round-trip); everyone after that hits
// the cached tile within ~30–80 ms from HK/Tokyo/Singapore.
const STYLE_URL = '/api/map/maps/streets-v2-dark/style.json'

// Any MapTiler URL the SDK computes internally still needs to be redirected
// through the proxy — this handler rewrites https://api.maptiler.com/* at
// request time, stripping the (now unnecessary) key query param.
//
// IMPORTANT: must return an absolute URL. maplibre v5 fetches vector tiles
// from a Web Worker that has no document.baseURI, so a relative `/api/map/…`
// path fails to resolve in the worker and every tile request silently dies
// — symptom is a working spinner-clear but a blank base map underneath the
// HTML markers (which are rendered on the main thread, not the worker).
const PROXY_TRANSFORM = (url: string) => {
  if (!url || !url.startsWith('https://api.maptiler.com/')) return { url }
  const u = new URL(url)
  u.searchParams.delete('key')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return { url: `${origin}/api/map${u.pathname}${u.search}` }
}

const DEALER_COUNTRIES = ['俄罗斯', '台湾', '沙特阿拉伯', '阿联酋', '韩国', '美国']

// ── EN label helpers for camp hover popup ─────────────────────────────────────
const COUNTRY_EN: Record<string, string> = {
  '中国': 'China', '俄罗斯': 'Russia', '利比亚': 'Libya', '印度': 'India',
  '印度尼西亚': 'Indonesia', '吉尔吉斯坦': 'Kyrgyzstan', '坦桑尼亚': 'Tanzania',
  '塞浦路斯': 'Cyprus', '墨西哥': 'Mexico', '奥地利': 'Austria',
  '巴基斯坦': 'Pakistan', '巴西': 'Brazil', '德国': 'Germany',
  '斯洛伐克': 'Slovakia', '新西兰': 'New Zealand', '日本': 'Japan',
  '柬埔寨': 'Cambodia', '沙特阿拉伯': 'Saudi Arabia', '泰国': 'Thailand',
  '澳大利亚': 'Australia', '爱尔兰': 'Ireland', '罗马尼亚': 'Romania',
  '美国': 'USA', '荷兰': 'Netherlands', '蒙古国': 'Mongolia',
  '西班牙': 'Spain', '越南': 'Vietnam', '迪拜(阿联酋)': 'Dubai, UAE',
  '阿根廷': 'Argentina', '韩国': 'South Korea', '马来西亚': 'Malaysia',
  '中东': 'Middle East',
}
const PROVINCE_EN: Record<string, string> = {
  '上海': 'Shanghai', '云南': 'Yunnan', '内蒙古': 'Inner Mongolia',
  '北京': 'Beijing', '台湾': 'Taiwan', '吉林': 'Jilin', '四川': 'Sichuan',
  '天津': 'Tianjin', '安徽': 'Anhui', '安徽/江苏': 'Anhui / Jiangsu',
  '山东': 'Shandong', '山西': 'Shanxi', '广东': 'Guangdong', '广西': 'Guangxi',
  '新疆': 'Xinjiang', '江苏': 'Jiangsu', '江西': 'Jiangxi', '河北': 'Hebei',
  '河南': 'Henan', '浙江': 'Zhejiang', '海南': 'Hainan', '湖北': 'Hubei',
  '湖南': 'Hunan', '甘肃': 'Gansu', '福建': 'Fujian', '西藏': 'Tibet',
  '贵州': 'Guizhou', '辽宁': 'Liaoning', '重庆': 'Chongqing',
  '陕西': 'Shaanxi', '青海': 'Qinghai', '黑龙江': 'Heilongjiang',
  // overseas sub-regions
  '南卡罗来纳州': 'South Carolina', '密歇根州': 'Michigan', '德克萨斯州': 'Texas',
  '富山县': 'Toyama', '茨城县': 'Ibaraki', '香川县': 'Kagawa',
  '清迈府': 'Chiang Mai', '维多利亚州': 'Victoria',
  '摩尔曼斯克州': 'Murmansk Oblast', '巴什科尔托斯坦共和国': 'Bashkortostan',
  '迪拜': 'Dubai',
}

function campLabelEn(country: string, province: string): string {
  const countryEn = COUNTRY_EN[country] || country
  if (country === '中国' || country === '中国（内部）') {
    const provEn = province !== '—' ? PROVINCE_EN[province] : null
    return provEn ? `${provEn}, China` : 'China'
  }
  const provEn = province !== '—' ? PROVINCE_EN[province] : null
  return provEn ? `${countryEn} · ${provEn}` : countryEn
}

const HQ = {
  lng: HQ_MARKER.coordinates[0],   // 113.0021 — OSM-verified Shishan Town
  lat: HQ_MARKER.coordinates[1],   // 23.1247
  labelEn: HQ_MARKER.name.en,
  labelZh: HQ_MARKER.name.zh,
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
  transition: background 0.15s, border-color 0.15s;
}
.vessel-hq-label:hover {
  background: rgba(227,111,44,0.15);
  border-color: #fff;
}
/* Showcase marker uses a two-layer structure to decouple map positioning
   from visual effects:
     .vessel-showcase-wrap  — outer element given to MapLibre; only used for
                              its transform (translate) placement. Has no
                              transitions so it tracks pan/zoom frame-by-frame.
     .vessel-showcase-pin   — inner circle that owns visuals: pulse ring,
                              hover scale, halo. Its transform:scale on hover
                              is scoped to this inner element and never fights
                              MapLibre's transform on the wrap. */
.vessel-showcase-wrap {
  width: 40px;
  height: 40px;
}
.vessel-showcase-pin {
  position: absolute;
  inset: 0;
  background: #E36F2C;
  border: 4px solid #FFFFFF;
  border-radius: 50%;
  cursor: pointer;
  box-sizing: border-box;
  animation: showcase-ring 2.4s ease-out infinite;
  transition: transform 0.18s ease;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0,0,0,0.5);
  /* --vessel-zoom-scale is updated by JS on every zoom event */
  transform: scale(var(--vessel-zoom-scale, 1));
}
.vessel-showcase-pin:hover {
  transform: scale(calc(var(--vessel-zoom-scale, 1) * 1.25));
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
/* HQ factory tooltip popup */
.vessel-hq-popup .maplibregl-popup-content {
  background: rgba(26,26,26,0.94);
  color: #F0F0F0;
  border: 1px solid #E36F2C;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  white-space: nowrap;
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  box-shadow: 0 2px 12px rgba(0,0,0,0.5);
  min-width: 160px;
}
.vessel-hq-popup .maplibregl-popup-tip {
  border-top-color: #E36F2C;
}
.vessel-hq-popup-name {
  font-weight: 600;
  font-size: 13px;
  color: #F0F0F0;
  margin-bottom: 3px;
}
.vessel-hq-popup-addr {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
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

// Rewrite MapTiler's default Taiwan country label ("Taiwan" / "中華民國") to
// "中国台湾" / "Taiwan, China". Walks symbol layers whose id looks like a
// country label and wraps text-field in a case expression that matches TW
// by ISO code or common name variants; other features fall through unchanged.
// Must be re-applied after setLanguage, which rewrites text-field.
function applyTaiwanLabelOverride(map: MaptilerMap, isZh: boolean) {
  const label = isZh ? '中国台湾' : 'Taiwan, China'
  const style = map.getStyle()
  const layers = (style?.layers ?? []) as Array<{ id: string; type: string }>
  layers.forEach((layer) => {
    if (layer.type !== 'symbol') return
    if (!String(layer.id).toLowerCase().includes('country')) return
    const current = map.getLayoutProperty(layer.id, 'text-field')
    if (current === undefined || current === null) return
    try {
      map.setLayoutProperty(layer.id, 'text-field', [
        'case',
        ['any',
          ['==', ['get', 'iso_a2'], 'TW'],
          ['==', ['get', 'iso_3166_1'], 'TW'],
          ['==', ['get', 'name:en'], 'Taiwan'],
          ['==', ['get', 'name'], 'Taiwan'],
          ['==', ['get', 'name'], '中華民國'],
          ['==', ['get', 'name'], '台灣'],
          ['==', ['get', 'name'], '臺灣'],
        ],
        label,
        current,
      ])
    } catch {
      // Schema mismatch on this layer — leave it alone.
    }
  })
}

interface Props {
  onShowcaseSelect?: (marker: ShowcaseMarker) => void
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
  const hqPopupRef = useRef<InstanceType<typeof Popup> | null>(null)
  const prevFlyKey = useRef('')
  const prevResetKey = useRef(resetViewKey ?? 0)
  const isZhRef = useRef(lang === 'zh')
  const [mapReady, setMapReady] = useState(false)
  // 'init-failed' = MaptilerMap constructor threw (e.g. WebGL2 unsupported);
  // 'fatal'       = maplibre fired an 'error' event we couldn't recover from.
  // No "timeout" state: a slow load is not a failure — better to keep the
  // spinner than tell a patient mainland-China user the map is broken when
  // it is in fact still streaming tiles in over a 200 ms-RTT link.
  const [loadError, setLoadError] = useState<null | 'init-failed' | 'fatal'>(null)

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

    // MapTiler SDK v4 throws synchronously when WebGL2 is unavailable
    // (older Android WeChat browser, hardware-accelerated mode disabled,
    // some restricted WebViews). Catch so we can show a fallback instead
    // of leaving the user staring at a forever spinner.
    let map: MaptilerMap
    try {
      map = new MaptilerMap({
        container: containerRef.current,
        style: STYLE_URL,
        center: isZhRef.current ? [105, 30] : [10, 20],
        zoom: isZhRef.current ? 3 : 2,
        minZoom: 1.5,
        maxZoom: 16,
        renderWorldCopies: false,
        transformRequest: PROXY_TRANSFORM,
        // Render CJK characters using the device's system font instead of
        // fetching MapTiler's glyph PBFs for those Unicode ranges. Saves
        // ~10 separate font requests (≈ 800 KB total) on the first render
        // for any Chinese-language view — the single biggest win for slow
        // mainland-China mobile connections.
        localIdeographFontFamily:
          "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif",
      })
    } catch (err) {
      console.error('[VESSEL] MapTiler init failed', err)
      setLoadError('init-failed')
      return
    }
    mapRef.current = map

    // Hover popup for regular camp name
    const hoverPopup = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'vessel-camp-popup',
    })

    // Surface maplibre's own error events to the console for debugging,
    // but never automatically promote them to a "失败" UI — individual
    // tile / glyph errors over a flaky mainland-China link are routine
    // and the SDK retries them. Forcing a fatal banner on transient
    // errors yesterday was the regression that prompted this rollback.
    map.on('error', (ev) => {
      console.warn('[VESSEL] map error', ev)
    })

    map.on('load', () => {
      // ── Language ──────────────────────────────────────────────────────
      map.setLanguage(isZhRef.current ? Language.CHINESE : Language.ENGLISH)
      applyTaiwanLabelOverride(map, isZhRef.current)
      setMapReady(true)

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
          nameEn: campLabelEn(camp.country, camp.province),
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
          const props = feats[0].properties ?? {}
          const label = isZhRef.current
            ? (props.name ?? '') as string
            : (props.nameEn ?? props.name ?? '') as string
          hoverPopup.setLngLat(coords).setText(label).addTo(map)
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
      // Declared here, added to map AFTER showcase markers so it sits on top
      // in DOM order and is never covered by any showcase pin.
      const hqWrapper = document.createElement('div')
      hqWrapper.style.cssText = 'width:36px;height:36px;cursor:pointer;z-index:9999;'
      hqWrapper.innerHTML = `
        <svg class="vessel-hq-star" width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <polygon points="18,2 22.8,13.2 35,13.2 25,21.4 28.5,33 18,26 7.5,33 11,21.4 1,13.2 13.2,13.2"
            fill="#E36F2C" stroke="#fff" stroke-width="1.5"/>
        </svg>
        <div class="vessel-hq-label">${isZhRef.current ? HQ.labelZh : HQ.labelEn}</div>
      `
      hqLabelRef.current = hqWrapper.querySelector<HTMLDivElement>('.vessel-hq-label')

      // HQ popup helpers
      const hqPopup = new Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 22,
        className: 'vessel-hq-popup',
      })
      hqPopupRef.current = hqPopup

      function getHqPopupHtml() {
        const zh = isZhRef.current
        const name = zh ? HQ_MARKER.name.zh : HQ_MARKER.name.en
        const addr = zh ? HQ_MARKER.location.zh : HQ_MARKER.location.en
        return `<div class="vessel-hq-popup-name">${name}</div><div class="vessel-hq-popup-addr">${addr}</div>`
      }

      hqWrapper.addEventListener('mouseenter', () => {
        const map = mapRef.current
        if (!map) return
        hqPopup.setLngLat([HQ.lng, HQ.lat]).setHTML(getHqPopupHtml()).addTo(map)
      })
      hqWrapper.addEventListener('mouseleave', () => {
        hqPopup.remove()
      })
      hqWrapper.addEventListener('click', (ev) => {
        ev.stopPropagation()
        const map = mapRef.current
        if (!map) return
        if (!hqPopup.isOpen()) {
          hqPopup.setLngLat([HQ.lng, HQ.lat]).setHTML(getHqPopupHtml()).addTo(map)
        }
      })

      // ── Zoom-responsive scale for showcase pins ───────────────────────
      // Maps zoom level → CSS scale factor for the inner pin element.
      // wrap stays 40px (MapLibre anchor math), only the visual pin scales.
      const showcasePins: HTMLDivElement[] = []

      function getPinScale(zoom: number): number {
        if (zoom <= 2) return 0.35
        if (zoom <= 6) return 0.35 + (zoom - 2) / 4 * 0.65   // 0.35 → 1.0
        if (zoom <= 10) return 1.0 + (zoom - 6) / 4 * 0.5    // 1.0 → 1.5
        return 1.5
      }

      function updatePinScales() {
        const s = getPinScale(map.getZoom()).toFixed(3)
        showcasePins.forEach(p => p.style.setProperty('--vessel-zoom-scale', s))
      }

      map.on('zoom', updatePinScales)

      // ── Showcase project markers (HTML, with pulse animation) ─────────
      SHOWCASE_MARKERS.forEach((marker) => {
        // Outer wrap = the element MapLibre controls via transform. No
        // transitions on it, so it tracks pan/zoom in lockstep with the canvas.
        const wrap = document.createElement('div')
        wrap.className = 'vessel-showcase-wrap'

        // Inner pin owns the visuals (pulse, hover scale, tooltip target).
        const pin = document.createElement('div')
        pin.className = 'vessel-showcase-pin'
        pin.title = marker.name.en
        wrap.appendChild(pin)
        showcasePins.push(pin)

        pin.addEventListener('click', (ev) => {
          ev.stopPropagation()
          onShowcaseSelectRef.current?.(marker)
        })

        const showcasePopup = new Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 18,
          className: 'vessel-camp-popup',
        })

        pin.addEventListener('mouseenter', () => {
          map.getCanvas().style.cursor = 'pointer'
          showcasePopup
            .setLngLat(marker.coordinates)
            .setText(marker.name[isZhRef.current ? 'zh' : 'en'])
            .addTo(map)
        })
        pin.addEventListener('mouseleave', () => {
          map.getCanvas().style.cursor = ''
          showcasePopup.remove()
        })

        new Marker({ element: wrap, anchor: 'center' })
          .setLngLat(marker.coordinates)
          .addTo(map)
      })

      // Apply initial scale after all pins are created
      updatePinScales()

      // Add HQ last → highest DOM order → always renders above all showcase pins
      new Marker({ element: hqWrapper, anchor: 'center' })
        .setLngLat([HQ.lng, HQ.lat])
        .addTo(map)
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
      applyTaiwanLabelOverride(map, isZh)
      if (hqLabelRef.current) {
        hqLabelRef.current.textContent = isZh ? HQ.labelZh : HQ.labelEn
      }
      const hqPopup = hqPopupRef.current
      if (hqPopup?.isOpen()) {
        const name = isZh ? HQ_MARKER.name.zh : HQ_MARKER.name.en
        const addr = isZh ? HQ_MARKER.location.zh : HQ_MARKER.location.en
        hqPopup.setHTML(`<div class="vessel-hq-popup-name">${name}</div><div class="vessel-hq-popup-addr">${addr}</div>`)
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
    // flyTarget is [lat, lng]; MapLibre wants [lng, lat]
    const fly = () => {
      prevFlyKey.current = key
      map.flyTo({ center: [flyTarget[1], flyTarget[0]], zoom: 11, duration: 1600 })
    }
    // Deep-link case (URL carries ?camp=…): flyTarget is set before map finishes loading.
    if (map.loaded()) fly()
    else map.once('load', fly)
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

  const zh = isZhRef.current
  const errorTitle = zh ? '地图加载失败' : 'MAP LOAD FAILED'
  const errorBody =
    loadError === 'init-failed'
      ? zh
        ? '当前浏览器或显卡不支持 WebGL 加速渲染，地图无法显示。请尝试在系统浏览器（Chrome / Safari）中打开本页面。'
        : 'Your browser or GPU does not support WebGL2. Please open this page in Chrome or Safari instead.'
      : zh
      ? '地图样式加载出错。请稍后重试。'
      : 'Map style failed to load. Please retry shortly.'

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: '#1A1A1A' }}>
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%', background: '#1A1A1A' }}
      />
      <div
        aria-hidden={mapReady && !loadError}
        style={{
          position: 'absolute',
          inset: 0,
          background: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: mapReady && !loadError ? 0 : 1,
          pointerEvents: mapReady && !loadError ? 'none' : 'auto',
          transition: 'opacity 400ms ease-out',
          zIndex: 50,
          padding: '0 24px',
        }}
      >
        {loadError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 360, textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: '1.5px solid rgba(227,111,44,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#E36F2C', fontSize: 22, fontWeight: 600,
            }}>!</div>
            <div style={{
              color: '#F0F0F0', fontSize: 14, fontWeight: 600, letterSpacing: '0.08em',
              fontFamily: "-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif",
            }}>{errorTitle}</div>
            <div style={{
              color: 'rgba(240,240,240,0.55)', fontSize: 12, lineHeight: 1.6,
              fontFamily: "-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif",
            }}>{errorBody}</div>
            {loadError !== 'init-failed' && (
              <button
                onClick={() => { if (typeof window !== 'undefined') window.location.reload() }}
                style={{
                  marginTop: 4,
                  padding: '8px 22px',
                  background: '#E36F2C', color: '#F0F0F0',
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, letterSpacing: '0.12em', fontWeight: 600,
                  fontFamily: "-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif",
                }}
              >
                {zh ? '重新加载' : 'RETRY'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 28,
                height: 28,
                border: '2px solid rgba(227,111,44,0.25)',
                borderTopColor: '#E36F2C',
                borderRadius: '50%',
                animation: 'vessel-map-spin 0.9s linear infinite',
              }}
            />
            <div
              style={{
                color: 'rgba(240,240,240,0.55)',
                fontSize: 12,
                letterSpacing: '0.15em',
                fontFamily: "-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif",
              }}
            >
              {zh ? '全球地图加载中' : 'LOADING GLOBAL MAP'}
            </div>
          </div>
        )}
        <style>{`@keyframes vessel-map-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
