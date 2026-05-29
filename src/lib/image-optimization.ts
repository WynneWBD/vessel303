export function canUseNextImageOptimization(src: unknown) {
  if (typeof src !== 'string') return true
  if (!/^https?:\/\//i.test(src)) return true

  try {
    const { hostname } = new URL(src)
    return hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}
