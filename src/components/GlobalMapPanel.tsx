'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Camp } from '@/data/camps'

const DEALER_COUNTRIES = ['俄罗斯', '台湾', '沙特阿拉伯', '阿联酋', '韩国', '美国']

// Deterministic image selection based on camp name hash
const PANEL_IMAGES = [
  '/images/hero/homepage_banner-01.jpg',
  '/images/hero/homepage_banner-04.jpg',
  '/images/hero/homepage_banner-05.jpg',
  '/images/products/region-europe-russia.jpg',
  '/images/products/custom_E7-Gen5_harmonyos-Huawei_01.jpg',
]

function getPanelImage(name: string, models: string): string {
  if (models.includes('V9')) return '/images/products/custom_V9-Gen6_Murmansk_01.jpg'
  if (models.includes('E3')) return '/images/products/custom_E3-Gen6_Germany_01.jpg'
  if (models.includes('E7')) return '/images/products/custom_E7-Gen5_harmonyos-Huawei_01.jpg'
  // hash name to pick from PANEL_IMAGES
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return PANEL_IMAGES[Math.abs(h) % PANEL_IMAGES.length]
}

interface Props {
  camp: Camp | null
  lang: string
  onClose: () => void
}

export default function GlobalMapPanel({ camp, lang, onClose }: Props) {
  const en = lang === 'en'
  const isDealer = camp ? DEALER_COUNTRIES.includes(camp.country) : false

  return (
    <div
      style={{
        position: 'fixed',
        top: 56,
        right: 0,
        width: 380,
        height: 'calc(100vh - 56px)',
        background: '#1A1A1E',
        zIndex: 900,
        transform: camp ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        borderLeft: '1px solid #2A2A2E',
      }}
    >
      {camp && (
        <>
          {/* Photo */}
          <div style={{ position: 'relative', height: 200, flexShrink: 0, background: '#111114' }}>
            <Image
              src={getPanelImage(camp.name, camp.models)}
              alt={camp.name}
              fill
              sizes="380px"
              className="object-cover"
              style={{ opacity: 0.85 }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(26,26,30,0.6) 100%)' }} />
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                background: 'rgba(17,17,20,0.85)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4,
                color: '#F0F0F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                lineHeight: 1,
                zIndex: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 24px', flex: 1 }}>
            {/* Name + location */}
            <h2 style={{
              color: '#F0F0F0', fontSize: 18, fontWeight: 600, marginBottom: 6,
              lineHeight: 1.3, fontFamily: 'var(--font-heading), sans-serif',
            }}>
              {camp.name}
            </h2>
            <p style={{ color: '#8A8580', fontSize: 13, marginBottom: 16 }}>
              {camp.country}{camp.province && camp.province !== '—' ? ` · ${camp.province}` : ''}
            </p>

            <div style={{ height: 1, background: '#2A2A2E', marginBottom: 20 }} />

            {/* Device stats */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span style={{
                  color: '#2A5C5A', fontSize: 36, fontWeight: 700,
                  fontFamily: 'var(--font-heading), sans-serif', letterSpacing: '-0.02em',
                }}>
                  {camp.total}
                </span>
                <span style={{ color: '#8A8580', fontSize: 13 }}>
                  {en ? 'Units Deployed' : '台设备'}
                </span>
              </div>
            </div>

            {/* Model pills */}
            {camp.models && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#6A6560', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {en ? 'Identified Models' : '已识别型号'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {camp.models.split(/[、,，]/).map((m) => m.trim()).filter(Boolean).map((model) => (
                    <span
                      key={model}
                      style={{
                        border: '1px solid #2A5C5A', color: '#2A5C5A',
                        fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        letterSpacing: '0.05em', fontFamily: 'var(--font-heading), sans-serif',
                      }}
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dealer badge */}
            {isDealer && (
              <>
                <div style={{ height: 1, background: '#2A2A2E', marginBottom: 20 }} />
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#2A5C5A', color: '#F0F0F0',
                    fontSize: 11, padding: '4px 10px', borderRadius: 4,
                    fontWeight: 600, letterSpacing: '0.08em', marginBottom: 10,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1l1.2 2.4L9 4 7 5.8l.4 2.8L5 7.4 2.6 8.6 3 5.8 1 4l2.8-.6L5 1z" fill="currentColor" />
                    </svg>
                    {en ? 'VESSEL Authorized Partner' : 'VESSEL 授权合作伙伴'}
                  </div>
                  <p style={{ color: '#6A6560', fontSize: 12, marginBottom: 12 }}>
                    {en ? 'Local partner information coming soon' : '当地合作伙伴信息即将更新'}
                  </p>
                  <Link
                    href="/contact"
                    style={{
                      display: 'inline-block', border: '1px solid #2A5C5A',
                      color: '#2A5C5A', fontSize: 12, padding: '6px 14px',
                      borderRadius: 4, textDecoration: 'none', letterSpacing: '0.05em',
                    }}
                  >
                    {en ? 'Contact Local Partner' : '联系当地合作伙伴'}
                  </Link>
                </div>
              </>
            )}

            <div style={{ height: 1, background: '#2A2A2E', marginBottom: 20 }} />

            {/* Bottom actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/products"
                style={{
                  display: 'block', textAlign: 'center',
                  background: '#2A5C5A', color: '#F0F0F0',
                  fontSize: 13, padding: '10px 16px',
                  textDecoration: 'none', letterSpacing: '0.08em', fontWeight: 500,
                }}
              >
                {en ? 'Explore Products' : '查看产品系列'}
              </Link>
              <a
                href="https://en.303vessel.cn/contact.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center',
                  border: '1px solid #2A2A2E', color: '#8A8580',
                  fontSize: 13, padding: '10px 16px',
                  textDecoration: 'none', letterSpacing: '0.08em',
                }}
              >
                {en ? 'Contact Us' : '联系我们'}
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
