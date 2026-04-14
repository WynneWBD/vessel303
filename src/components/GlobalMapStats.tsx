'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { CAMPS } from '@/data/camps'

const campCount = CAMPS.length
const countries = new Set(CAMPS.filter(c => c.region !== '内部').map(c => c.country)).size
const totalDevices = CAMPS.reduce((s, c) => s + c.total, 0).toLocaleString()

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
        background: '#1C1A18',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Link
          href="/"
          style={{
            color: '#C9A84C',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '3px',
            textDecoration: 'none',
          }}
        >
          VESSEL
        </Link>
        <div style={{ width: 1, height: 20, background: 'rgba(201,168,76,0.3)' }} />
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: '0.1em' }}>
          {zh ? '全球营地部署' : 'Global Deployment'}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginLeft: 'auto', marginRight: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {countries}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 4 }}>
            {zh ? '国家/地区' : 'Countries'}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {campCount}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 4 }}>
            {zh ? '个营地' : 'Camps'}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {totalDevices}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 4 }}>
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
            background: lang === 'en' ? '#C9A84C' : 'transparent',
            color: lang === 'en' ? '#1C1A18' : 'rgba(255,255,255,0.4)',
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
            background: lang === 'zh' ? '#C9A84C' : 'transparent',
            color: lang === 'zh' ? '#1C1A18' : 'rgba(255,255,255,0.4)',
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
