'use client'

import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

const countries    = '30+'
const campCount    = '300+'
const totalDevices = '2000+'

export default function GlobalMapStats() {
  const { lang, setLang } = useLanguage()
  const zh = lang === 'zh'

  return (
    <div
      className="flex flex-col md:flex-row md:items-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#F5F2ED',
        zIndex: 1000,
        borderBottom: '1px solid #E5DED4',
      }}
    >
      {/* ── Row 1: Brand + desktop stats + lang switcher ── */}
      <div className="flex items-center h-14 flex-1" style={{ padding: '0 24px' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span
            onClick={() => window.history.back()}
            role="button"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Image
              src="/images/vessel-logo.png"
              alt="VESSEL 微宿"
              height={24}
              width={96}
              style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
              unoptimized
            />
          </span>
          <div style={{ width: 1, height: 20, background: 'rgba(138,133,128,0.4)' }} />
          <span
            style={{ color: '#8A7D74', fontSize: 13, letterSpacing: '0.1em' }}
          >
            {zh ? '全球营地部署' : 'Global Map'}
          </span>
        </div>

        {/* Stats: desktop only, right-aligned between brand and lang switcher */}
        <div
          className="hidden md:flex"
          style={{ alignItems: 'center', gap: 32, marginLeft: 'auto', marginRight: 24 }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
              {countries}
            </span>
            <span style={{ color: '#8A7D74', fontSize: 12, marginLeft: 4 }}>
              {zh ? '国家/地区' : 'Countries'}
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: '#E5DED4' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
              {campCount}
            </span>
            <span style={{ color: '#8A7D74', fontSize: 12, marginLeft: 4 }}>
              {zh ? '个营地' : 'Camps'}
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: '#E5DED4' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
              {totalDevices}
            </span>
            <span style={{ color: '#8A7D74', fontSize: 12, marginLeft: 4 }}>
              {zh ? '台设备' : 'Devices'}
            </span>
          </div>
        </div>

        {/* Lang switcher: always visible; ml-auto on mobile pushes it right */}
        <div
          className="ml-auto md:ml-0"
          style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5DED4', overflow: 'hidden', flexShrink: 0 }}
        >
          <button
            onClick={() => setLang('en')}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              border: 'none',
              background: lang === 'en' ? '#E36F2C' : 'transparent',
              color: lang === 'en' ? '#F5F2ED' : '#8A7D74',
              fontWeight: lang === 'en' ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            EN
          </button>
          <div style={{ width: 1, height: 12, background: '#E5DED4' }} />
          <button
            onClick={() => setLang('zh')}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              border: 'none',
              background: lang === 'zh' ? '#E36F2C' : 'transparent',
              color: lang === 'zh' ? '#F5F2ED' : '#8A7D74',
              fontWeight: lang === 'zh' ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            中
          </button>
        </div>
      </div>

      {/* ── Row 2: mobile-only stats ── */}
      <div
        className="flex md:hidden items-center justify-center gap-4 w-full h-9"
        style={{ borderTop: '1px solid #E5DED4', padding: '0 24px' }}
      >
        <div>
          <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em' }}>
            {countries}
          </span>
          <span style={{ color: '#8A7D74', fontSize: 11, marginLeft: 3 }}>
            {zh ? '国家/地区' : 'Countries'}
          </span>
        </div>
        <span style={{ color: '#C4B9AB', fontSize: 12 }}>·</span>
        <div>
          <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em' }}>
            {campCount}
          </span>
          <span style={{ color: '#8A7D74', fontSize: 11, marginLeft: 3 }}>
            {zh ? '个营地' : 'Camps'}
          </span>
        </div>
        <span style={{ color: '#C4B9AB', fontSize: 12 }}>·</span>
        <div>
          <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em' }}>
            {totalDevices}
          </span>
          <span style={{ color: '#8A7D74', fontSize: 11, marginLeft: 3 }}>
            {zh ? '台设备' : 'Devices'}
          </span>
        </div>
      </div>
    </div>
  )
}
