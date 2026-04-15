'use client'

import { useLanguage } from '@/contexts/LanguageContext'

const countries = '30+'
const campCount = '300+'
const totalDevices = '2000+'

export default function GlobalMapStats() {
  const { lang, setLang } = useLanguage()
  const zh = lang === 'zh'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: '#111114',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid rgba(42,92,90,0.25)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span
          onClick={() => window.history.back()}
          role="button"
          style={{
            color: '#F0F0F0',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '3px',
            cursor: 'pointer',
          }}
        >
          VESSEL
        </span>
        <div style={{ width: 1, height: 20, background: 'rgba(138,133,128,0.4)' }} />
        <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13, letterSpacing: '0.1em' }}>
          {zh ? '全球营地部署' : 'Global Deployment'}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginLeft: 'auto', marginRight: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#2A5C5A', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {countries}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, marginLeft: 4 }}>
            {zh ? '国家/地区' : 'Countries'}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(138,133,128,0.3)' }} />
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#2A5C5A', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {campCount}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, marginLeft: 4 }}>
            {zh ? '个营地' : 'Camps'}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(138,133,128,0.3)' }} />
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#2A5C5A', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {totalDevices}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, marginLeft: 4 }}>
            {zh ? '台设备' : 'Devices'}
          </span>
        </div>
      </div>

      {/* Lang switcher */}
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden', flexShrink: 0 }}>
        <button
          onClick={() => setLang('en')}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            border: 'none',
            background: lang === 'en' ? '#2A5C5A' : 'transparent',
            color: lang === 'en' ? '#F0F0F0' : 'rgba(255,255,255,0.4)',
            fontWeight: lang === 'en' ? 700 : 400,
            transition: 'all 0.15s',
          }}
        >
          EN
        </button>
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
        <button
          onClick={() => setLang('zh')}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            border: 'none',
            background: lang === 'zh' ? '#2A5C5A' : 'transparent',
            color: lang === 'zh' ? '#F0F0F0' : 'rgba(255,255,255,0.4)',
            fontWeight: lang === 'zh' ? 700 : 400,
            transition: 'all 0.15s',
          }}
        >
          中
        </button>
      </div>
    </div>
  )
}
