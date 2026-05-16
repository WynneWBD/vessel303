export type PageModuleRegistryEntry = {
  rendererKey: string
  pageKey: string
  moduleKey: string
  moduleType: string
  defaultSortOrder: number
  dynamicEnabled: boolean
}

export type PageModuleForRendering = {
  module_key: string
  is_visible?: boolean
  sort_order?: number
}

export type ResolvedPageModule<TModule extends PageModuleForRendering> = {
  registry: PageModuleRegistryEntry
  pageModule: TModule | null
  sortOrder: number
}

type InternalResolvedPageModule<TModule extends PageModuleForRendering> = ResolvedPageModule<TModule> & {
  registryOrder: number
}

function toSortOrder(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function resolveDynamicPageModules<TModule extends PageModuleForRendering>(
  pageModules: TModule[] | null | undefined,
  registry: PageModuleRegistryEntry[],
): ResolvedPageModule<TModule>[] {
  const moduleByKey = new Map<string, TModule>()

  if (Array.isArray(pageModules)) {
    for (const pageModule of pageModules) {
      if (typeof pageModule.module_key === 'string' && !moduleByKey.has(pageModule.module_key)) {
        moduleByKey.set(pageModule.module_key, pageModule)
      }
    }
  }

  return registry
    .filter((entry) => entry.dynamicEnabled)
    .map<InternalResolvedPageModule<TModule>>((entry, index) => {
      const pageModule = moduleByKey.get(entry.moduleKey) ?? null

      return {
        registry: entry,
        pageModule,
        sortOrder: toSortOrder(pageModule?.sort_order, entry.defaultSortOrder),
        registryOrder: index,
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.registryOrder - b.registryOrder)
    .map((resolved) => ({
      registry: resolved.registry,
      pageModule: resolved.pageModule,
      sortOrder: resolved.sortOrder,
    }))
}

export function isResolvedPageModuleVisible<TModule extends PageModuleForRendering>(
  resolved: ResolvedPageModule<TModule>,
) {
  return resolved.pageModule?.is_visible !== false
}
