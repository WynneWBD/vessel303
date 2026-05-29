import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Display | VESSEL® Product Showcase',
  description:
    'Explore VESSEL® product showcase slides for smart prefab architecture models, configurations, product highlights, and inquiry-ready display content.',
  path: '/display',
})

export default function DisplayLayout({ children }: { children: ReactNode }) {
  return children
}
