// Edge proxy for MapTiler — routes every map asset (style.json, tiles,
// glyphs, sprite) through Vercel's Hong Kong/Tokyo/Singapore edge nodes,
// then caches the response immutably. Mainland-China users hit the edge
// cache on the second access instead of the MapTiler origin in the US/EU.
//
// Visual parity is byte-identical: we transparently forward MapTiler's
// response body (or, for style.json, only rewrite absolute URLs back to
// this proxy path so nested asset requests also stay on the cached route).

export const runtime = 'edge'
// Earlier attempt pinned preferredRegion = 'hkg1', but Vercel's plan/region
// gate returned 403 before our function ran, killing /global. Leave region
// auto-selected; the immutable cache header on tile responses already keeps
// repeat visits cheap.

// Hardcoded default matches the legacy GlobalMapML key. Override via Vercel
// env `MAPTILER_KEY` when you want to rotate without redeploying code.
const MAPTILER_KEY = process.env.MAPTILER_KEY || '7tbP0DIfmG9T8qWYxh5M'
const UPSTREAM_ORIGIN = 'https://api.maptiler.com'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params
  if (!path?.length) {
    return new Response('Missing path', { status: 400 })
  }

  const reqUrl = new URL(req.url)
  const upstream = new URL(`${UPSTREAM_ORIGIN}/${path.join('/')}`)
  // Forward every query param except the client-side key (we force our own).
  reqUrl.searchParams.forEach((value, key) => {
    if (key !== 'key') upstream.searchParams.set(key, value)
  })
  upstream.searchParams.set('key', MAPTILER_KEY)

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(upstream.toString(), {
      // Accept encoded bodies transparently; fetch on edge handles decoding.
      headers: { accept: req.headers.get('accept') ?? '*/*' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'MapTiler proxy fetch failed', detail: String(err) }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    )
  }

  if (!upstreamRes.ok) {
    return new Response(upstreamRes.statusText, { status: upstreamRes.status })
  }

  const contentType = upstreamRes.headers.get('content-type') ?? ''
  const isJson = contentType.includes('json')

  // style.json / tile-json responses carry absolute MapTiler URLs inside the
  // body. Rewrite those so the map SDK keeps hitting our proxy for every
  // downstream asset (tiles, glyphs, sprite).
  let body: BodyInit
  if (isJson) {
    const text = await upstreamRes.text()
    body = text
      .replace(/https:\/\/api\.maptiler\.com\//g, `${reqUrl.origin}/api/map/`)
      // strip leaked ?key= / &key= now that the proxy injects its own
      .replace(/([?&])key=[^&"\\]+/g, (m) => (m.startsWith('?') ? '?' : ''))
      // collapse resulting "?&" or trailing "?" artifacts
      .replace(/\?&/g, '?')
      .replace(/\?"/g, '"')
  } else {
    body = upstreamRes.body ?? ''
  }

  // Tiles / glyphs / sprites are byte-identical forever — cache for a year,
  // immutable, so every edge node across the fleet can serve repeat views
  // without ever hitting upstream again. style.json can shift when MapTiler
  // tweaks a paint layer, so keep that on a shorter SWR window.
  const cacheHeader = isJson
    ? 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
    : 'public, max-age=31536000, s-maxage=31536000, immutable'

  const headers = new Headers({
    'content-type': contentType,
    'cache-control': cacheHeader,
  })
  const len = upstreamRes.headers.get('content-length')
  if (len && !isJson) headers.set('content-length', len)

  return new Response(body, { status: 200, headers })
}
