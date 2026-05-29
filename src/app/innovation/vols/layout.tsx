import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'VOLS Operations System | VESSEL® Innovation',
  description:
    'Understand VESSEL® VOLS operations logic for prefab resort deployment, product lifecycle, project delivery, and long-term operations.',
  path: '/innovation/vols',
})

export default function VolsLayout({ children }: { children: ReactNode }) {
  return children
}
