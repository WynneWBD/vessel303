import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'VIPC Product Architecture | VESSEL® Innovation',
  description:
    'Explore VESSEL® VIPC innovation for prefab architecture product design, structural systems, industrialized delivery, and scenario adaptation.',
  path: '/innovation/vipc',
})

export default function VipcLayout({ children }: { children: ReactNode }) {
  return children
}
