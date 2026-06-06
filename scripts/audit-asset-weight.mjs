import { readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
let target = 'public/images'
let json = false
let limit = 40
let warnMb = 3

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--target') {
    target = args[index + 1] ?? target
    index += 1
  } else if (arg === '--limit') {
    limit = Number.parseInt(args[index + 1] ?? '', 10) || limit
    index += 1
  } else if (arg === '--warn-mb') {
    warnMb = Number.parseFloat(args[index + 1] ?? '') || warnMb
    index += 1
  } else if (arg === '--json') {
    json = true
  }
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else if (entry.isFile()) {
      const stats = statSync(full)
      files.push({
        path: relative(root, full).replace(/\\/g, '/'),
        ext: extname(entry.name).toLowerCase() || '(none)',
        bytes: stats.size,
      })
    }
  }
  return files
}

function mb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2))
}

function byExt(files) {
  const groups = new Map()
  for (const file of files) {
    const current = groups.get(file.ext) ?? { ext: file.ext, count: 0, bytes: 0 }
    current.count += 1
    current.bytes += file.bytes
    groups.set(file.ext, current)
  }
  return Array.from(groups.values())
    .map((item) => ({ ...item, mb: mb(item.bytes) }))
    .sort((a, b) => b.bytes - a.bytes)
}

function byTopDirectory(files) {
  const groups = new Map()
  for (const file of files) {
    const parts = file.path.split('/')
    const key = parts.slice(0, Math.min(parts.length - 1, 3)).join('/')
    const current = groups.get(key) ?? { directory: key, count: 0, bytes: 0 }
    current.count += 1
    current.bytes += file.bytes
    groups.set(key, current)
  }
  return Array.from(groups.values())
    .map((item) => ({ ...item, mb: mb(item.bytes) }))
    .sort((a, b) => b.bytes - a.bytes)
}

const files = walk(join(root, target))
const topFiles = files
  .slice()
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, limit)
  .map((file) => ({ ...file, mb: mb(file.bytes), warning: file.bytes >= warnMb * 1024 * 1024 }))

const summary = {
  target,
  files: files.length,
  totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  totalMb: mb(files.reduce((sum, file) => sum + file.bytes, 0)),
  warnMb,
  extensionSummary: byExt(files),
  directorySummary: byTopDirectory(files).slice(0, limit),
  topFiles,
}

if (json) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(`Asset weight audit: ${summary.target}`)
  console.log(`Total: ${summary.files} files / ${summary.totalMb} MB`)
  console.log('\nBy extension:')
  for (const item of summary.extensionSummary) {
    console.log(`- ${item.ext}: ${item.count} files / ${item.mb} MB`)
  }
  console.log('\nLargest directories:')
  for (const item of summary.directorySummary.slice(0, 12)) {
    console.log(`- ${item.directory}: ${item.count} files / ${item.mb} MB`)
  }
  console.log(`\nTop ${topFiles.length} files:`)
  for (const item of topFiles) {
    console.log(`- ${item.mb} MB${item.warning ? ' WARN' : '     '} ${item.path}`)
  }
}
