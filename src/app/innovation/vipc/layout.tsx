import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {}

export default function VipcLayout({ children }: { children: ReactNode }) {
  return children
}
