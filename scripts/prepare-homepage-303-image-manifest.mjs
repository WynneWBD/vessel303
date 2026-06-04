import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'

const root = process.cwd()
const DEFAULT_EN_URL = 'https://en.303vessel.cn/'
const DEFAULT_OUTPUT = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/manifest.json'
const DEFAULT_IMAGE_DIR = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-images/files'
const DEFAULT_MODULES_URL = 'https://www.vessel303.com/api/page-modules/home'

const args = process.argv.slice(2)
const download = args.includes('--download')
const json = args.includes('--json')

function argValue(name, fallback = '') {
  const index = args.indexOf(name)
  if (index < 0) return fallback
  return args[index + 1] ?? fallback
}

function decodeAttr(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function attrValue(tag, name) {
  const quoted = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(tag)
  if (quoted) return decodeAttr(quoted[2])
  const unquoted = new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, 'i').exec(tag)
  return unquoted ? decodeAttr(unquoted[1]) : ''
}

function usableMediaSource(value) {
  const source = value.trim()
  if (!source || source === '#') return ''
  const lower = source.toLowerCase()
  if (lower.startsWith('data:') || lower.startsWith('javascript:')) return ''
  if (lower.endsWith('/npublic/img/s.png') || lower.endsWith('/npublic/img/playvideo.png')) return ''
  return source
}

function unique(values) {
  return Array.from(new Set(values.map(usableMediaSource).filter(Boolean)))
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function contentExtension(contentType, fallbackUrl) {
  const lower = contentType.toLowerCase()
  if (lower.includes('webp')) return '.webp'
  if (lower.includes('png')) return '.png'
  if (lower.includes('gif')) return '.gif'
  if (lower.includes('jpeg') || lower.includes('jpg')) return '.jpg'
  const pathname = new URL(fallbackUrl).pathname
  const ext = extname(pathname)
  return ext || '.jpg'
}

function sourceSlug(url) {
  const pathname = new URL(url).pathname
  const raw = basename(pathname).replace(/\.[a-z0-9]+$/i, '')
  return raw.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 80) || 'image'
}

function responseLength(headers) {
  const contentRange = headers.get('content-range') || ''
  const total = /\/(\d+)\s*$/.exec(contentRange)?.[1]
  if (total) return Number(total)
  return Number(headers.get('content-length') || 0) || null
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; codex-home-image-manifest)',
      Referer: DEFAULT_EN_URL,
    },
  })
  if (!res.ok) throw new Error(`Fetch failed ${url}: HTTP ${res.status}`)
  return res.text()
}

function imageSourcesFromHtml(html, baseUrl) {
  const imgTags = Array.from(html.matchAll(/<img\b[^>]*>/gi), (match) => match[0])
  const sources = []
  for (const tag of imgTags) {
    sources.push(attrValue(tag, 'src'))
    sources.push(attrValue(tag, 'data-src'))
    sources.push(attrValue(tag, 'data-original'))
    sources.push(attrValue(tag, 'data-lazy-src'))
  }
  return unique(sources)
    .map((source) => new URL(source, baseUrl).toString())
    .filter((source) => {
      const host = new URL(source).hostname.toLowerCase()
      return host.includes('thefastimg.com') || host.includes('thefastvideo.com')
    })
}

function modulesFromPayload(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.modules)) return payload.modules
  if (Array.isArray(payload)) return payload
  return []
}

async function fetchVesselModuleImageSources(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'codex-home-image-manifest' } })
  if (!res.ok) return []
  const modules = modulesFromPayload(await res.json())
  return unique(modules.flatMap((pageModule) => {
    if (pageModule?.is_visible === false || !Array.isArray(pageModule?.items)) return []
    return pageModule.items
      .filter((item) => item?.is_visible !== false)
      .map((item) => typeof item?.image_url === 'string' ? item.image_url : '')
  }))
}

async function checkImageUrl(url, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const head = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; codex-home-image-manifest)',
        Referer: DEFAULT_EN_URL,
      },
      signal: controller.signal,
    })
    if (head.ok) {
      return {
        ok: true,
        method: 'HEAD',
        status: head.status,
        contentType: head.headers.get('content-type') || '',
        contentLength: responseLength(head.headers),
      }
    }
    const ranged = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; codex-home-image-manifest)',
        Referer: DEFAULT_EN_URL,
        Range: 'bytes=0-16',
      },
      signal: controller.signal,
    })
    await ranged.body?.cancel()
    return {
      ok: ranged.ok,
      method: 'GET',
      status: ranged.status,
      headStatus: head.status,
      contentType: ranged.headers.get('content-type') || head.headers.get('content-type') || '',
      contentLength: responseLength(ranged.headers),
    }
  } catch (error) {
    return { ok: false, method: 'HEAD', status: null, contentType: '', contentLength: null, error: error.message }
  } finally {
    clearTimeout(timeout)
  }
}

async function downloadImage(url, localPath, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; codex-home-image-manifest)',
        Referer: DEFAULT_EN_URL,
      },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`Unexpected content type: ${contentType}`)
    const bytes = Buffer.from(await res.arrayBuffer())
    writeFileSync(localPath, bytes)
    return {
      ok: true,
      contentType,
      bytes: bytes.length,
      sha256: sha256(bytes),
    }
  } finally {
    clearTimeout(timeout)
  }
}

const enUrl = new URL(argValue('--en-url', process.env.EN303_HOME_URL || DEFAULT_EN_URL)).toString()
const output = resolve(root, argValue('--output', DEFAULT_OUTPUT))
const imageDir = resolve(root, argValue('--image-dir', DEFAULT_IMAGE_DIR))
const modulesUrl = argValue('--modules-url', process.env.VESSEL_HOME_MODULES_URL || DEFAULT_MODULES_URL)
const timeoutMs = Number(argValue('--timeout-ms', '15000')) || 15000

const errors = []
const html = await fetchText(enUrl)
const sourceUrls = imageSourcesFromHtml(html, enUrl)
const vesselModuleImageSources = await fetchVesselModuleImageSources(modulesUrl)

if (download) mkdirSync(imageDir, { recursive: true })

const entries = []
for (let index = 0; index < sourceUrls.length; index += 1) {
  const sourceUrl = sourceUrls[index]
  const checked = await checkImageUrl(sourceUrl, timeoutMs)
  const ext = contentExtension(checked.contentType, sourceUrl)
  const sourceHash = sha256(Buffer.from(sourceUrl)).slice(0, 12)
  const filename = `${String(index + 1).padStart(2, '0')}-${sourceHash}-${sourceSlug(sourceUrl)}${ext}`
  const localPath = resolve(imageDir, filename)
  let downloaded = null

  if (download) {
    try {
      downloaded = await downloadImage(sourceUrl, localPath, timeoutMs)
    } catch (error) {
      errors.push(`Download failed: ${sourceUrl} (${error.message})`)
      downloaded = { ok: false, error: error.message }
    }
  }

  entries.push({
    index: index + 1,
    sourceUrl,
    sourceType: sourceUrl.includes('/cms/vedio/') ? 'video-poster' : 'image',
    contentType: checked.contentType,
    contentLength: checked.contentLength,
    checkOk: checked.ok,
    checkStatus: checked.status,
    filename,
    localPath: download && existsSync(localPath) ? localPath : '',
    bytes: downloaded?.bytes ?? null,
    sha256: downloaded?.sha256 ?? '',
    publicUrl: '',
    targetModuleKey: '',
    targetItemId: '',
    notes: '',
  })
}

const manifest = {
  generatedAt: new Date().toISOString(),
  purpose: 'Homepage 303 image transfer manifest. Fill targetModuleKey, targetItemId, and publicUrl only after approved import into vessel303-owned storage/backend content.',
  enUrl,
  modulesUrl,
  imageDir: download ? imageDir : '',
  entries,
  summary: {
    entries: entries.length,
    reachable: entries.filter((entry) => entry.checkOk).length,
    downloaded: entries.filter((entry) => entry.localPath).length,
    vesselHomeModuleImageSources: vesselModuleImageSources.length,
  },
  errors,
}

if (!args.includes('--dry-run')) {
  mkdirSync(resolve(output, '..'), { recursive: true })
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`)
}

if (json) {
  console.log(JSON.stringify(manifest, null, 2))
} else {
  console.log('Homepage 303 image manifest')
  console.log(`en.303: ${enUrl}`)
  console.log(`Output: ${output}`)
  console.log(`Download: ${download ? 'yes' : 'no'}`)
  console.log(`Entries: ${manifest.summary.entries}`)
  console.log(`Reachable: ${manifest.summary.reachable}/${manifest.summary.entries}`)
  console.log(`Downloaded: ${manifest.summary.downloaded}/${manifest.summary.entries}`)
  console.log(`vessel303 module image URLs: ${manifest.summary.vesselHomeModuleImageSources}`)
  for (const entry of entries.slice(0, 10)) {
    console.log(`- ${entry.index}. ${entry.sourceType}: ${entry.sourceUrl}`)
    console.log(`  ${entry.contentType || 'unknown'}${entry.contentLength ? `, ${entry.contentLength} bytes` : ''}`)
  }
  if (entries.length > 10) console.log(`... ${entries.length - 10} more entries`)
  if (errors.length > 0) {
    console.log('Errors:')
    for (const error of errors) console.log(`- ${error}`)
  }
}

if (errors.length > 0 || entries.some((entry) => !entry.checkOk)) process.exitCode = 1
