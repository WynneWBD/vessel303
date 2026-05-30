import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()

const includeRoots = [
  'src/app',
  'src/components',
]

const skipped = [
  'src/app/admin',
  'src/app/api',
  'src/app/api/admin',
  'src/components/admin',
  'src/app/global',
  'src/components/ProjectDetail.tsx',
  'src/components/Global',
]

const fileExtensions = new Set(['.ts', '.tsx'])

const blockedPatterns = [
  { pattern: /运营导览/g, reason: 'internal operating copy' },
  { pattern: /对照\s*300/g, reason: 'internal benchmark copy' },
  { pattern: /后台\s*owner/gi, reason: 'admin ownership copy' },
  { pattern: /Codex/g, reason: 'test or internal agent copy' },
  { pattern: /B2[0-9]/g, reason: 'internal phase marker' },
  { pattern: /DEFAULT_PAGE_MODULES/g, reason: 'runtime default page modules' },
  { pattern: /staticPublishedProjectCases/g, reason: 'static project fallback' },
  { pattern: /STATIC_SLIDES/g, reason: 'static display fallback' },
  { pattern: /src\/data\/faq|@\/data\/faq/g, reason: 'static FAQ fallback' },
  { pattern: /@\/lib\/i18n/g, reason: 'public runtime i18n business copy' },
  { pattern: /useT\(/g, reason: 'public runtime i18n business copy' },
  { pattern: /Inquire for pricing/g, reason: 'hardcoded product price copy' },
  { pattern: /Product Description/g, reason: 'hardcoded product detail label' },
  { pattern: /Related Products/g, reason: 'hardcoded related product label' },
  { pattern: /Contact VESSEL/g, reason: 'hardcoded contact CTA' },
  { pattern: /Source:/g, reason: 'hardcoded form source label' },
  { pattern: /Company:/g, reason: 'hardcoded form company label' },
  { pattern: /Submit failed/g, reason: 'hardcoded form error copy' },
  { pattern: /Network error/g, reason: 'hardcoded form network error copy' },
  { pattern: /Your name/g, reason: 'hardcoded form placeholder' },
  { pattern: /For project follow-up/g, reason: 'hardcoded form placeholder' },
  { pattern: /Project Requirements/g, reason: 'hardcoded form label' },
  { pattern: /Send Case Inquiry/g, reason: 'hardcoded case form CTA' },
  { pattern: /Submit Another/g, reason: 'hardcoded form CTA' },
  { pattern: /Received/g, reason: 'hardcoded form success copy' },
  { pattern: /Toggle menu/g, reason: 'hardcoded navigation aria copy' },
  { pattern: /aria-label="Close"/g, reason: 'hardcoded drawer aria copy' },
  { pattern: /aria-label=\{`image \$\{index \+ 1\}`\}/g, reason: 'hardcoded product image label' },
  { pattern: /aria-label=\{`slide \$\{index \+ 1\}`\}/g, reason: 'hardcoded carousel label' },
]

function isSkipped(path) {
  const normalized = path.replaceAll('\\', '/')
  return skipped.some((prefix) => normalized.startsWith(prefix))
}

function extension(path) {
  const index = path.lastIndexOf('.')
  return index >= 0 ? path.slice(index) : ''
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const relPath = relative(root, fullPath).replaceAll('\\', '/')
    if (isSkipped(relPath)) continue
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      walk(fullPath, files)
    } else if (fileExtensions.has(extension(fullPath))) {
      files.push(fullPath)
    }
  }
  return files
}

const violations = []

for (const includeRoot of includeRoots) {
  const absoluteRoot = join(root, includeRoot)
  for (const file of walk(absoluteRoot)) {
    const relPath = relative(root, file).replaceAll('\\', '/')
    const content = readFileSync(file, 'utf8')
    for (const rule of blockedPatterns) {
      rule.pattern.lastIndex = 0
      let match
      while ((match = rule.pattern.exec(content)) !== null) {
        const line = content.slice(0, match.index).split(/\r?\n/).length
        violations.push(`${relPath}:${line} ${rule.reason}: ${match[0]}`)
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Public content audit failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log('Public content audit passed')
