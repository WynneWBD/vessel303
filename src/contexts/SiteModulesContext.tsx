'use client'

import { createContext, useContext } from 'react'
import type { PublicPageModule } from '@/lib/page-module-client'

const SiteModulesContext = createContext<PublicPageModule[] | null>(null)

export function SiteModulesProvider({
  children,
  initialModules,
}: {
  children: React.ReactNode
  initialModules: PublicPageModule[] | null
}) {
  return <SiteModulesContext.Provider value={initialModules}>{children}</SiteModulesContext.Provider>
}

export function useSiteModules() {
  return useContext(SiteModulesContext)
}
