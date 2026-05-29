import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { defaultSiteSettings, getSiteSettings } from '@/lib/admin-settings-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact VESSEL® | Project Inquiry',
  description:
    'Contact the VESSEL® team for smart prefab resort architecture, product inquiries, procurement consultation and international project support.',
  path: '/contact',
})

const CONTACT_SETTINGS_TIMEOUT_MS = 250

function timeoutFallback<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms)
  })
}

function appendSource(url: string, source: string | undefined) {
  if (!source?.trim()) return url
  try {
    const target = new URL(url)
    target.searchParams.set('source', source.trim().slice(0, 160))
    return target.toString()
  } catch {
    return url
  }
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  let contactUrl = defaultSiteSettings.contactUrl

  try {
    const settings = await Promise.race([
      getSiteSettings(),
      timeoutFallback(CONTACT_SETTINGS_TIMEOUT_MS, defaultSiteSettings),
    ])
    contactUrl = settings.contactUrl || contactUrl
  } catch (err) {
    console.error('Failed to load contact URL from site_settings:', err)
  }

  const sp = searchParams ? await searchParams : {}
  const sourceParam = sp.source
  const source = Array.isArray(sourceParam) ? sourceParam[0] : sourceParam

  redirect(appendSource(contactUrl, source))
}
