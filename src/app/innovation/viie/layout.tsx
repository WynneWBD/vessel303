import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'VIIE Smart System | VESSEL® Innovation',
  description:
    'Learn about the VESSEL® VIIE smart system for intelligent prefab architecture control, comfort, energy, and resort operations.',
  path: '/innovation/viie',
})

export default function ViieLayout({ children }: { children: ReactNode }) {
  return children
}
