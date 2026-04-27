import type { ShowcaseMarker } from '@/data/showcaseMarkers'
import type { ShowcaseProject } from '@/data/showcaseProjects'
import type { ProjectCaseRow } from '@/lib/project-cases-static'

const FALLBACK_IMAGE = '/images/projects/guangdong-huizhou/image-01.jpg'

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
  const images = [
    project.cover_image_url,
    ...project.images,
  ].filter((src): src is string => Boolean(src))

  return {
    id: project.id,
    name: { en: project.name_en, zh: project.name_zh },
    location: { en: project.location_en, zh: project.location_zh },
    coordinates: [project.longitude, project.latitude],
    country: project.country || '📍',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: project.units_display || 'TBD',
    bookingUrl: '',
    description: {
      en: project.description_en || project.description_zh,
      zh: project.description_zh || project.description_en,
    },
    amenities: [
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
    ],
    transport: {
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
    },
    nearby: {
      en: [
        { name: project.area_display || 'Project Area', distance: project.investment_display || '—' },
        { name: 'Units', distance: project.units_display || '—' },
      ],
      zh: [
        { name: project.area_display || '项目面积', distance: project.investment_display || '—' },
        { name: '舱数', distance: project.units_display || '—' },
      ],
    },
    images: images.length > 0 ? images : [FALLBACK_IMAGE],
  }
}
