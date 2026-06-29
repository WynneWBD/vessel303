import type { ShowcaseMarker } from '@/data/showcaseMarkers'
import type { ShowcaseProject, ShowcaseProjectImageSource } from '@/data/showcaseProjects'
import type { ProjectCaseRow } from '@/lib/project-cases-static'

const FALLBACK_IMAGE = '/images/projects/guangdong-huizhou/image-01.jpg'

function buildProjectImages(project: ProjectCaseRow) {
  const seen = new Set<string>()
  const images: string[] = []
  const cmsImageSources: ShowcaseProjectImageSource[] = []
  const pushImage = (url: string | null | undefined, source: ShowcaseProjectImageSource) => {
    if (!url || seen.has(url)) return false
    seen.add(url)
    images.push(url)
    cmsImageSources.push(source)
    return true
  }

  pushImage(project.cover_image_url, { patchKey: 'cover_image_url' })
  project.images.forEach((url, index) => {
    pushImage(url, { patchKey: 'images', arrayIndex: index })
  })

  return { images, cmsImageSources }
}

function fallbackAmenities(project: ProjectCaseRow): ShowcaseProject['amenities'] {
  return [
    {
      icon: '🏕',
      label: {
        en: project.project_type_en || 'Project Case',
        zh: project.project_type_zh || '项目案例',
      },
    },
    {
      icon: '🛏',
      label: {
        en: project.products || 'VESSEL Units',
        zh: project.products || '微宿产品',
      },
    },
    ...project.tags_zh.slice(0, 4).map((tag, index) => ({
      icon: ['✨', '🌿', '🧭', '🏗'][index] ?? '•',
      label: {
        en: project.tags_en[index] ?? tag,
        zh: tag,
      },
    })),
  ]
}

function fallbackTransport(project: ProjectCaseRow): ShowcaseProject['transport'] {
  return {
    en: [
      {
        mode: '📍',
        text: project.location_en,
      },
    ],
    zh: [
      {
        mode: '📍',
        text: project.location_zh,
      },
    ],
  }
}

function fallbackNearby(project: ProjectCaseRow): ShowcaseProject['nearby'] {
  return {
    en: [
      { name: project.area_display || 'Project Area', distance: project.investment_display || '—' },
      { name: 'Units', distance: project.units_display || '—' },
    ],
    zh: [
      { name: project.area_display || '项目面积', distance: project.investment_display || '—' },
      { name: '舱数', distance: project.units_display || '—' },
    ],
  }
}

export function projectCaseToMarker(project: ProjectCaseRow): ShowcaseMarker | null {
  if (project.longitude == null || project.latitude == null) return null
  return {
    id: project.id,
    name: {
      en: project.name_en,
      zh: project.name_zh,
    },
    coordinates: [project.longitude, project.latitude],
  }
}

export function projectCaseToShowcaseProject(project: ProjectCaseRow): ShowcaseProject | null {
  if (project.longitude == null || project.latitude == null) return null
  const { images, cmsImageSources } = buildProjectImages(project)
  const hasProjectImages = images.length > 0
  const hasGlobalAmenities = project.global_amenities.length > 0
  const hasGlobalTransportZh = project.global_transport_zh.length > 0
  const hasGlobalTransportEn = project.global_transport_en.length > 0
  const hasGlobalNearbyZh = project.global_nearby_zh.length > 0
  const hasGlobalNearbyEn = project.global_nearby_en.length > 0

  return {
    id: project.id,
    name: { en: project.name_en, zh: project.name_zh },
    location: { en: project.location_en, zh: project.location_zh },
    coordinates: [project.longitude, project.latitude],
    country: project.country || '📍',
    openDate: project.global_open_date || 'TBD',
    units: project.global_units,
    unitArea: project.global_unit_area,
    guests: project.global_guests || project.units_display || 'TBD',
    bookingUrl: project.global_booking_url,
    description: {
      en: project.description_en || project.description_zh,
      zh: project.description_zh || project.description_en,
    },
    amenities: hasGlobalAmenities ? project.global_amenities : fallbackAmenities(project),
    transport: hasGlobalTransportZh || hasGlobalTransportEn
      ? {
          en: hasGlobalTransportEn ? project.global_transport_en : project.global_transport_zh,
          zh: hasGlobalTransportZh ? project.global_transport_zh : project.global_transport_en,
        }
      : fallbackTransport(project),
    nearby: hasGlobalNearbyZh || hasGlobalNearbyEn
      ? {
          en: hasGlobalNearbyEn ? project.global_nearby_en : project.global_nearby_zh,
          zh: hasGlobalNearbyZh ? project.global_nearby_zh : project.global_nearby_en,
        }
      : fallbackNearby(project),
    images: hasProjectImages ? images : [FALLBACK_IMAGE],
    cmsImageSources: hasProjectImages ? cmsImageSources : undefined,
    cmsGlobalSources: {
      amenities: hasGlobalAmenities,
      transport: {
        en: hasGlobalTransportEn,
        zh: hasGlobalTransportZh,
      },
      nearby: {
        en: hasGlobalNearbyEn,
        zh: hasGlobalNearbyZh,
      },
    },
  }
}
