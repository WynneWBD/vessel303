import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const root = process.cwd()
const DEFAULT_VIDEO_DIR = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-videos'
const DEFAULT_OUTPUT = 'C:/Users/Wynne/Desktop/vessel303/.codex-temp/homepage-303-videos/manifest.json'

const videoMap = [
  {
    moduleKey: 'model-strip',
    itemId: 'card-v9',
    localName: 'homepage-product-system-a5df8944.mp4',
    sourceUrl: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/a5df8944-7dfa-4ec1-b5ad-6b1ab81a2f7a.mp4',
    role: 'en.303 V9 Gen6 model video candidate',
  },
  {
    moduleKey: 'model-strip',
    itemId: 'card-e6',
    localName: 'homepage-model-range-0cec74ca.mp4',
    sourceUrl: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/0cec74ca-7048-4fa1-92c0-8924077a6df7.mp4',
    role: 'en.303 E6 Gen6 model video candidate',
  },
  {
    moduleKey: 'model-strip',
    itemId: 'card-e3',
    localName: 'homepage-innovation-cee38c3a.mp4',
    sourceUrl: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/cee38c3a-79fe-4739-8f00-d810b5f9a394.mp4',
    role: 'en.303 E3 Gen6 model video candidate',
  },
  {
    moduleKey: 'future-explorer',
    itemId: 'card-about',
    localName: 'homepage-scenario-cb16afab.mp4',
    sourceUrl: 'https://omo-oss-video110.thefastvideo.com/portal-saas/pg2024062819261469079/cms/vedio/cb16afab-0b1f-4d23-9dc6-49b2783ca914.mp4',
    role: 'en.303 Future Sojourn Explorer video candidate',
    requiresReview: true,
  },
]

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  return process.argv[index + 1] ?? fallback
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function mp4HeaderOk(bytes) {
  return bytes.subarray(4, 8).toString('ascii') === 'ftyp'
}

const videoDir = resolve(root, argValue('--video-dir', DEFAULT_VIDEO_DIR))
const output = resolve(root, argValue('--output', DEFAULT_OUTPUT))
const entries = []
const errors = []

for (const item of videoMap) {
  const localPath = resolve(videoDir, item.localName)
  if (!existsSync(localPath)) {
    errors.push(`Missing video file: ${localPath}`)
    continue
  }

  const bytes = readFileSync(localPath)
  if (!mp4HeaderOk(bytes)) errors.push(`MP4 header check failed: ${localPath}`)

  entries.push({
    moduleKey: item.moduleKey,
    itemId: item.itemId,
    role: item.role,
    requiresReview: Boolean(item.requiresReview),
    sourceUrl: item.sourceUrl,
    localPath,
    filename: basename(localPath),
    mime: 'video/mp4',
    bytes: bytes.length,
    sha256: sha256(bytes),
    publicUrl: '',
  })
}

const manifest = {
  generatedAt: new Date().toISOString(),
  purpose: 'Homepage 303 video transfer manifest. Fill publicUrl after uploading each local MP4 to vessel303-owned storage.',
  entries,
  errors,
}

if (!process.argv.includes('--dry-run')) {
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`)
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(manifest, null, 2))
} else {
  console.log('Homepage 303 video manifest')
  console.log(`Video dir: ${videoDir}`)
  console.log(`Output: ${output}`)
  console.log(`Entries: ${entries.length}`)
  for (const entry of entries) {
    console.log(`- home:${entry.moduleKey} / ${entry.itemId}: ${entry.filename} (${entry.bytes} bytes, ${entry.sha256})`)
  }
  if (errors.length > 0) {
    console.log('Errors:')
    for (const error of errors) console.log(`- ${error}`)
  }
}

if (errors.length > 0) process.exitCode = 1
