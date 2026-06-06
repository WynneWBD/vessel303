/* eslint-disable @next/next/no-img-element -- 14KB static fallback; avoid the image optimizer while MapLibre loads. */
import type { CSSProperties } from 'react'
import { HQ_MARKER, SHOWCASE_MARKERS } from '@/data/showcaseMarkers'

type Props = {
  showLoading?: boolean
  loadingLabel?: string
}

function clampPercent(value: number) {
  return Math.min(96, Math.max(4, value))
}

function markerStyle(coordinates: [number, number]): CSSProperties {
  const [lng, lat] = coordinates
  return {
    left: `${clampPercent(((lng + 180) / 360) * 100)}%`,
    top: `${clampPercent(((90 - lat) / 180) * 100)}%`,
  }
}

export default function StaticGlobalMapPreview({
  showLoading = false,
  loadingLabel = 'LOADING GLOBAL MAP',
}: Props) {
  return (
    <div className="vessel-static-global-map" aria-hidden="true">
      <div className="vessel-static-global-map__stage">
        <img
          src="/images/about/optimized/about_globalmap-01.jpg"
          alt=""
          className="vessel-static-global-map__image"
          draggable={false}
        />
        <div className="vessel-static-global-map__pins">
          {SHOWCASE_MARKERS.map((marker) => (
            <span
              key={marker.id}
              className="vessel-static-global-map__pin"
              style={markerStyle(marker.coordinates)}
            />
          ))}
          <span
            className="vessel-static-global-map__pin vessel-static-global-map__pin--hq"
            style={markerStyle(HQ_MARKER.coordinates)}
          >
            <span className="vessel-static-global-map__hq-label">VESSEL HQ</span>
          </span>
        </div>
      </div>
      {showLoading ? (
        <div className="vessel-static-global-map__loading">
          <span className="vessel-static-global-map__spinner" />
          <span className="vessel-static-global-map__loading-label">{loadingLabel}</span>
        </div>
      ) : null}
      <style>{`
        .vessel-static-global-map {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #F5F2ED;
        }
        .vessel-static-global-map__stage {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(94vw, 176vh, 1500px);
          aspect-ratio: 900 / 411;
          transform: translate(-50%, -50%);
        }
        .vessel-static-global-map__image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 0.92;
          user-select: none;
          -webkit-user-drag: none;
        }
        .vessel-static-global-map__pins {
          position: absolute;
          inset: 0;
        }
        .vessel-static-global-map__pin {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #E36F2C;
          border: 2px solid #FFFFFF;
          box-shadow: 0 5px 15px rgba(36, 31, 27, 0.24);
          transform: translate(-50%, -50%);
        }
        .vessel-static-global-map__pin--hq {
          width: 14px;
          height: 14px;
          background: #241F1B;
          border-color: #E36F2C;
          z-index: 2;
        }
        .vessel-static-global-map__hq-label {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          white-space: nowrap;
          background: rgba(36, 31, 27, 0.88);
          border: 1px solid rgba(227, 111, 44, 0.72);
          color: #F5F2ED;
          padding: 3px 7px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .vessel-static-global-map__loading {
          position: absolute;
          left: 50%;
          top: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          transform: translate(-50%, -50%);
          padding: 14px 18px;
          background: rgba(245, 242, 237, 0.72);
        }
        .vessel-static-global-map__spinner {
          width: 26px;
          height: 26px;
          border: 2px solid rgba(227, 111, 44, 0.24);
          border-top-color: #E36F2C;
          border-radius: 50%;
          animation: vessel-static-map-spin 0.9s linear infinite;
        }
        .vessel-static-global-map__loading-label {
          color: #8A7D74;
          font-size: 11px;
          letter-spacing: 0.14em;
          font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
        }
        @media (max-width: 640px) {
          .vessel-static-global-map__stage {
            width: 156vw;
            max-width: none;
          }
          .vessel-static-global-map__pin {
            width: 7px;
            height: 7px;
            border-width: 1.5px;
          }
          .vessel-static-global-map__pin--hq {
            width: 12px;
            height: 12px;
          }
          .vessel-static-global-map__hq-label {
            font-size: 9px;
            padding: 2px 5px;
          }
        }
        @keyframes vessel-static-map-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
