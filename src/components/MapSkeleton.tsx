// Shared map-loading skeleton: rendered three places to cover every stage
// of the slow path on mainland-China mobile, so the user sees one continuous
// orange spinner instead of a black flash → spinner → map sequence:
//
//   1. /global/page.tsx Suspense fallback   — appears in SSR HTML, before any JS runs
//   2. GlobalMapDynamic loading prop        — covers maplibre-gl chunk download
//   3. GlobalMapML's own overlay            — covers map-init / first-tile fetch
//
// Bilingual label so we don't need to read LanguageContext (which would force
// this to be a client component and lose the SSR-HTML benefit).

export default function MapSkeleton() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#241F1B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
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
          加载中 · LOADING
        </div>
      </div>
      <style>{`@keyframes vessel-map-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
