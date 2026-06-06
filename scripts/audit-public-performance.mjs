const DEFAULT_NEW_BASE = 'https://www.vessel303.com'
const DEFAULT_OLD_BASE = 'https://en.303vessel.cn'

const DEFAULT_ROUTES = [
  { label: 'home', path: '/', oldPath: '/' },
  { label: 'about', path: '/about', oldPath: '/about.html' },
  { label: 'products', path: '/products', oldPath: '/products_list.html' },
  { label: 'product-s5', path: '/products/s5', oldPath: null },
  { label: 'cases', path: '/cases', oldPath: '/case.html' },
  { label: 'case-astrobase', path: '/cases/astrobase-mamison', oldPath: null },
  { label: 'scenario-tourism', path: '/scenarios/tourism', oldPath: null },
  { label: 'scenario-commercial', path: '/scenarios/commercial', oldPath: null },
  { label: 'display', path: '/display', oldPath: null },
  { label: 'contact', path: '/contact', oldPath: '/contact.html' },
  { label: 'faq', path: '/faq', oldPath: null },
  { label: 'media-kit', path: '/media-kit', oldPath: null },
  { label: 'news', path: '/news', oldPath: '/news.html' },
]

const args = process.argv.slice(2)
let newBase = DEFAULT_NEW_BASE
let oldBase = DEFAULT_OLD_BASE
let json = false
let compareOld = true
let measureAssets = true
let assetLimit = 120
const requestedRoutes = []

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--base-url') {
    newBase = args[index + 1] ?? newBase
    index += 1
  } else if (arg === '--old-base-url') {
    oldBase = args[index + 1] ?? oldBase
    index += 1
  } else if (arg === '--route') {
    const route = args[index + 1]
    if (route) requestedRoutes.push(route)
    index += 1
  } else if (arg === '--asset-limit') {
    assetLimit = Number.parseInt(args[index + 1] ?? '', 10) || assetLimit
    index += 1
  } else if (arg === '--no-old') {
    compareOld = false
  } else if (arg === '--no-assets') {
    measureAssets = false
  } else if (arg === '--json') {
    json = true
  }
}

const routeSet = requestedRoutes.length > 0
  ? DEFAULT_ROUTES.filter((route) => requestedRoutes.includes(route.path) || requestedRoutes.includes(route.label))
  : DEFAULT_ROUTES

function bytesToKb(bytes) {
  return Number((bytes / 1024).toFixed(1))
}

function buildUrl(base, path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function attrsFromTag(tag) {
  const attrs = {}
  for (const match of tag.matchAll(/\s([a-zA-Z0-9_:-]+)(?:=(["'])(.*?)\2)?/g)) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[3] ?? '')
  }
  return attrs
}

function firstSrcsetUrl(srcset) {
  if (!srcset) return ''
  return srcset.split(',')[0]?.trim().split(/\s+/)[0] ?? ''
}

function assetType(url) {
  const clean = url.split('?')[0].toLowerCase()
  if (/\.(woff2?|ttf|otf)$/i.test(clean)) return 'font'
  if (clean.includes('/_next/static/chunks/') || clean.endsWith('.js')) return 'script'
  if (clean.endsWith('.css')) return 'style'
  if (/\.(avif|webp|png|jpe?g|gif|svg|ico)$/i.test(clean) || url.includes('/_next/image')) return 'image'
  if (/\.(mp4|webm|mov|m4v)$/i.test(clean)) return 'video'
  return 'other'
}

function normalizeUrl(raw, pageUrl) {
  if (!raw || raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('#')) return null
  try {
    return new URL(raw, pageUrl).toString()
  } catch {
    return null
  }
}

function uniqueAssets(assets) {
  const seen = new Set()
  return assets.filter((asset) => {
    if (!asset.url || seen.has(asset.url)) return false
    seen.add(asset.url)
    return true
  })
}

function collectAssets(html, pageUrl) {
  const assets = []
  for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
    const attrs = attrsFromTag(match[0])
    const url = normalizeUrl(attrs.src, pageUrl)
    if (url) assets.push({ type: 'script', url, loading: attrs.async ? 'async' : attrs.defer ? 'defer' : 'blocking' })
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attrsFromTag(match[0])
    const rel = (attrs.rel || '').toLowerCase()
    const href = normalizeUrl(attrs.href, pageUrl)
    if (!href) continue
    if (rel.includes('stylesheet')) assets.push({ type: 'style', url: href, rel })
    if (rel.includes('preload') || rel.includes('modulepreload') || rel.includes('preconnect')) {
      assets.push({ type: assetType(href), url: href, rel, as: attrs.as || '' })
    }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const attrs = attrsFromTag(match[0])
    const src = attrs.src || firstSrcsetUrl(attrs.srcset)
    const url = normalizeUrl(src, pageUrl)
    if (url) assets.push({ type: 'image', url, loading: attrs.loading || '', fetchpriority: attrs.fetchpriority || '' })
  }
  for (const match of html.matchAll(/<source\b[^>]*>/gi)) {
    const attrs = attrsFromTag(match[0])
    const url = normalizeUrl(attrs.src || firstSrcsetUrl(attrs.srcset), pageUrl)
    if (url) assets.push({ type: assetType(url), url })
  }
  for (const match of html.matchAll(/<video\b[^>]*>/gi)) {
    const attrs = attrsFromTag(match[0])
    const src = normalizeUrl(attrs.src, pageUrl)
    const poster = normalizeUrl(attrs.poster, pageUrl)
    if (src) assets.push({ type: 'video', url: src, preload: attrs.preload || '', autoplay: attrs.autoplay !== undefined })
    if (poster) assets.push({ type: 'image', url: poster, role: 'video-poster' })
  }
  return uniqueAssets(assets)
}

async function timedFetch(url, options = {}) {
  const started = performance.now()
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'codex-public-performance-audit',
      ...(options.headers ?? {}),
    },
    ...options,
  })
  const elapsedMs = Math.round(performance.now() - started)
  return { res, elapsedMs }
}

async function fetchHtml(url) {
  try {
    const { res, elapsedMs } = await timedFetch(url)
    const text = await res.text()
    return {
      ok: res.ok,
      url,
      finalUrl: res.url,
      status: res.status,
      elapsedMs,
      bytes: Buffer.byteLength(text),
      headers: Object.fromEntries(res.headers.entries()),
      html: text,
      error: '',
    }
  } catch (err) {
    return {
      ok: false,
      url,
      finalUrl: '',
      status: null,
      elapsedMs: null,
      bytes: 0,
      headers: {},
      html: '',
      error: err.message,
    }
  }
}

function parseContentRange(value) {
  const match = String(value || '').match(/\/(\d+)$/)
  return match ? Number.parseInt(match[1], 10) : null
}

async function measureAsset(asset) {
  try {
    const head = await timedFetch(asset.url, { method: 'HEAD' })
    const contentLength = Number.parseInt(head.res.headers.get('content-length') || '', 10)
    if (Number.isFinite(contentLength)) {
      return {
        ...asset,
        status: head.res.status,
        elapsedMs: head.elapsedMs,
        bytes: contentLength,
        contentType: head.res.headers.get('content-type') || '',
        cacheControl: head.res.headers.get('cache-control') || '',
      }
    }
    const range = await timedFetch(asset.url, { headers: { range: 'bytes=0-0' } })
    const total = parseContentRange(range.res.headers.get('content-range'))
    return {
      ...asset,
      status: range.res.status,
      elapsedMs: range.elapsedMs,
      bytes: total ?? 0,
      contentType: range.res.headers.get('content-type') || '',
      cacheControl: range.res.headers.get('cache-control') || '',
    }
  } catch (err) {
    return {
      ...asset,
      status: null,
      elapsedMs: null,
      bytes: 0,
      contentType: '',
      cacheControl: '',
      error: err.message,
    }
  }
}

async function mapLimit(items, concurrency, mapper) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

function summarizeMeasuredAssets(assets) {
  const byType = new Map()
  for (const asset of assets) {
    const current = byType.get(asset.type) ?? { type: asset.type, count: 0, bytes: 0 }
    current.count += 1
    current.bytes += asset.bytes || 0
    byType.set(asset.type, current)
  }
  return Array.from(byType.values())
    .map((item) => ({ ...item, kb: bytesToKb(item.bytes) }))
    .sort((a, b) => b.bytes - a.bytes)
}

async function auditPage(label, url) {
  const fetched = await fetchHtml(url)
  const assets = fetched.ok ? collectAssets(fetched.html, fetched.finalUrl || url).slice(0, assetLimit) : []
  const measuredAssets = measureAssets ? await mapLimit(assets, 8, measureAsset) : assets.map((asset) => ({ ...asset, bytes: 0 }))
  const assetBytes = measuredAssets.reduce((sum, asset) => sum + (asset.bytes || 0), 0)
  return {
    label,
    url,
    finalUrl: fetched.finalUrl,
    status: fetched.status,
    ok: fetched.ok,
    htmlMs: fetched.elapsedMs,
    htmlKb: bytesToKb(fetched.bytes),
    assetCount: measuredAssets.length,
    assetKb: bytesToKb(assetBytes),
    totalKnownKb: bytesToKb(assetBytes + fetched.bytes),
    byType: summarizeMeasuredAssets(measuredAssets),
    largestAssets: measuredAssets
      .slice()
      .sort((a, b) => (b.bytes || 0) - (a.bytes || 0))
      .slice(0, 12)
      .map((asset) => ({
        type: asset.type,
        kb: bytesToKb(asset.bytes || 0),
        status: asset.status,
        url: asset.url,
      })),
    scripts: measuredAssets.filter((asset) => asset.type === 'script').length,
    images: measuredAssets.filter((asset) => asset.type === 'image').length,
    videos: measuredAssets.filter((asset) => asset.type === 'video').length,
    error: fetched.error,
  }
}

const results = []
for (const route of routeSet) {
  const nextUrl = buildUrl(newBase, route.path)
  const oldUrl = compareOld && route.oldPath ? buildUrl(oldBase, route.oldPath) : null
  results.push({
    route: route.label,
    new: await auditPage(`new:${route.label}`, nextUrl),
    old: oldUrl ? await auditPage(`old:${route.label}`, oldUrl) : null,
  })
}

const summary = {
  generatedAt: new Date().toISOString(),
  newBase,
  oldBase: compareOld ? oldBase : null,
  measureAssets,
  assetLimit,
  results,
}

if (json) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(`Public performance audit: ${newBase}`)
  if (compareOld) console.log(`Old-site comparison where mapped: ${oldBase}`)
  for (const row of results) {
    const current = row.new
    const old = row.old
    console.log(`\n${row.route}`)
    console.log(`- new: HTTP ${current.status} / HTML ${current.htmlMs} ms / known ${current.totalKnownKb} KB / assets ${current.assetCount} / scripts ${current.scripts} / images ${current.images} / videos ${current.videos}`)
    if (old) {
      console.log(`- old: HTTP ${old.status} / HTML ${old.htmlMs} ms / known ${old.totalKnownKb} KB / assets ${old.assetCount} / scripts ${old.scripts} / images ${old.images} / videos ${old.videos}`)
    }
    for (const asset of current.largestAssets.slice(0, 5)) {
      console.log(`  - ${asset.kb} KB ${asset.type} ${asset.url}`)
    }
  }
}
