import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { SiteSettings } from '@/lib/admin-settings-db'
import { getStoredSiteSettings } from '@/lib/admin-settings-db'
import { recordSiteEventSafe } from '@/lib/site-analytics'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {}

const CONTACT_SETTINGS_TIMEOUT_MS = 5000

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
  const settings = await Promise.race<Partial<SiteSettings>>([
    getStoredSiteSettings(),
    timeoutFallback<Partial<SiteSettings>>(CONTACT_SETTINGS_TIMEOUT_MS, {}),
  ]).catch((err) => {
    console.error('Failed to load contact URL from site_settings:', err)
    return {} as Partial<SiteSettings>
  })
  const contactUrl = typeof settings.contactUrl === 'string' ? settings.contactUrl.trim() : ''
  if (!contactUrl) notFound()

  const sp = searchParams ? await searchParams : {}
  const sourceParam = sp.source
  const source = Array.isArray(sourceParam) ? sourceParam[0] : sourceParam

  await Promise.race([
    recordSiteEventSafe({
      eventName: 'contact_redirect',
      path: '/contact',
      source: source || 'website_contact',
      metadata: { target: 'configured_contact_url' },
    }),
    new Promise((resolve) => setTimeout(resolve, 150)),
  ])

  redirect(appendSource(contactUrl, source))
}
