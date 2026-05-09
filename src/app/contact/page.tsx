import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { defaultSiteSettings, getSiteSettings } from '@/lib/admin-settings-db'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact VESSEL® | Project Inquiry',
  description:
    'Contact the VESSEL® team for smart prefab resort architecture, product inquiries, procurement consultation and international project support.',
  path: '/contact',
})

export default async function ContactPage() {
  let contactUrl = defaultSiteSettings.contactUrl

  try {
    const settings = await getSiteSettings()
    contactUrl = settings.contactUrl || contactUrl
  } catch (err) {
    console.error('Failed to load contact URL from site_settings:', err)
  }

  redirect(contactUrl)
}
