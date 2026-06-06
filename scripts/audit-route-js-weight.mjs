import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
let json = false
let limit = 50

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--json') {
    json = true
  } else if (arg === '--limit') {
    limit = Number.parseInt(args[index + 1] ?? '', 10) || limit
    index += 1
  }
}

const appDir = join(root, '.next/server/app')
const staticDir = join(root, '.next')

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else if (entry.isFile() && entry.name.endsWith('_client-reference-manifest.js')) {
      files.push(full)
    }
  }
  return files
}

function parseManifest(file) {
  const raw = readFileSync(file, 'utf8')
  const match = raw.match(/__RSC_MANIFEST\["([^"]+)"\]=(\{[\s\S]*\});?\s*$/)
  if (!match) return null
  try {
    return {
      key: match[1],
      manifest: JSON.parse(match[2]),
    }
  } catch (err) {
    return {
      key: match[1],
      parseError: err.message,
      manifest: null,
    }
  }
}

function routeFromManifestKey(key) {
  if (key === '/page') return '/'
  if (key.endsWith('/page')) return key.slice(0, -'/page'.length) || '/'
  if (key.endsWith('/route')) return key.slice(0, -'/route'.length) || '/'
  return key
}

function chunkPaths(manifest) {
  const chunks = new Set()
  const modules = []
  for (const [modulePath, entry] of Object.entries(manifest.clientModules ?? {})) {
    const jsChunks = (entry.chunks ?? []).filter((chunk) => typeof chunk === 'string' && chunk.endsWith('.js'))
    if (jsChunks.length > 0) {
      for (const chunk of jsChunks) chunks.add(chunk)
      modules.push({
        module: modulePath.replace(root, '').replace(/^\\+/, '').replace(/\\/g, '/'),
        chunks: jsChunks,
      })
    }
  }
  return { chunks: Array.from(chunks).sort(), modules }
}

function fileSizeForChunk(chunk) {
  const file = join(staticDir, chunk)
  if (!existsSync(file)) return 0
  return statSync(file).size
}

function kb(bytes) {
  return Number((bytes / 1024).toFixed(1))
}

function isTrackedPublicRoute(route) {
  if (!route) return false
  if (route === '/') return true
  if (route === '/about') return true
  if (route === '/products' || route.startsWith('/products/')) return true
  if (route === '/cases' || route.startsWith('/cases/')) return true
  if (route.startsWith('/scenarios/')) return true
  if (route.startsWith('/innovation/')) return true
  if (route === '/display') return true
  if (route === '/contact') return true
  if (route === '/faq') return true
  if (route === '/media-kit') return true
  if (route === '/news' || route.startsWith('/news/')) return true
  return false
}

if (!existsSync(appDir)) {
  console.error('Missing .next/server/app. Run npm run build first.')
  process.exit(1)
}

const rows = walk(appDir)
  .map((file) => {
    const parsed = parseManifest(file)
    if (!parsed) {
      return {
        route: relative(appDir, file).replace(/\\/g, '/'),
        error: 'manifest parse marker missing',
      }
    }
    if (parsed.parseError) {
      return {
        route: parsed.key,
        error: parsed.parseError,
      }
    }
    const { chunks, modules } = chunkPaths(parsed.manifest)
    const bytes = chunks.reduce((sum, chunk) => sum + fileSizeForChunk(chunk), 0)
    return {
      route: routeFromManifestKey(parsed.key),
      manifestKey: parsed.key,
      chunks,
      chunkCount: chunks.length,
      bytes,
      kb: kb(bytes),
      modules: modules.map((item) => item.module).sort(),
    }
  })
  .sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0))

const publicRows = rows.filter((row) => isTrackedPublicRoute(row.route))

const summary = {
  generatedAt: new Date().toISOString(),
  routes: rows.length,
  publicRoutes: publicRows.length,
  topPublicRoutes: publicRows.slice(0, limit),
  topAllRoutes: rows.slice(0, limit),
}

if (json) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log('Route JS weight audit from .next client reference manifests')
  console.log(`Routes: ${summary.routes}; public routes: ${summary.publicRoutes}`)
  console.log('\nTop public routes:')
  for (const row of summary.topPublicRoutes.slice(0, limit)) {
    if (row.error) {
      console.log(`- ${row.route}: ERROR ${row.error}`)
      continue
    }
    console.log(`- ${row.route}: ${row.kb} KB / ${row.chunkCount} chunks`)
    for (const chunk of row.chunks.slice(0, 8)) {
      console.log(`  - ${chunk} (${kb(fileSizeForChunk(chunk))} KB)`)
    }
  }
}
