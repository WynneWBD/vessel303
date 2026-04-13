import { CAMPS } from '@/data/camps'

const campCount = CAMPS.length
const countries = new Set(CAMPS.filter(c => c.region !== '内部').map(c => c.country)).size
const totalDevices = CAMPS.reduce((s, c) => s + c.total, 0).toLocaleString()

export default function GlobalMapStats() {

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
        gap: 0,
        borderBottom: '1px solid rgba(201,168,76,0.2)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span
          style={{
            color: '#C9A84C',
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          VESSEL
        </span>
        <div style={{ width: 1, height: 20, background: 'rgba(201,168,76,0.3)' }} />
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: '0.1em' }}>
          全球营地部署
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          marginLeft: 'auto',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {countries}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 4 }}>
            国家/地区
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {campCount}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 4 }}>
            个营地
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
            {totalDevices}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 4 }}>
            台设备
          </span>
        </div>
      </div>
    </div>
  )
}
