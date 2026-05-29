import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Media Kit | VESSEL®',
  description:
    'Request VESSEL® media resources, brand imagery, press materials, and architecture project assets for approved editorial and partner use.',
  path: '/media-kit',
})

export default function MediaKitLayout({ children }: { children: ReactNode }) {
  return children
}
