import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildPageMetadata } from '@/lib/seo'

const CONTACT_URL = 'https://en.303vessel.cn/contact.html'

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact VESSEL® | Project Inquiry',
  description:
    'Contact the VESSEL® team for smart prefab resort architecture, product inquiries, procurement consultation and international project support.',
  path: '/contact',
})

export default function ContactPage() {
  redirect(CONTACT_URL)
}
