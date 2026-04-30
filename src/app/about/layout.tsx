import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'About VESSEL® | Smart Prefab Architecture Manufacturer',
  description:
    'Learn about VESSEL® micro resort architecture, Foshan manufacturing, global project delivery, certifications, technology systems and resort development services.',
  path: '/about',
})

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
