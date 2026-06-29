import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ScenarioPageContent from '@/components/pages/ScenarioPageContent'
import {
  getPublicB9ContentItem,
  listPublicB9ContentItems,
} from '@/lib/b9-content-db'
import {
  getDefaultB9ContentItem,
  withDefaultB9ContentItems,
} from '@/lib/b9-content-defaults'
import { listDefaultPageModules, listPublishedPageModules } from '@/lib/page-modules-db'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 300

const SCENARIO_SLUGS = ['tourism', 'commercial', 'public'] as const
type ScenarioSlug = (typeof SCENARIO_SLUGS)[number]

function isScenarioSlug(value: string): value is ScenarioSlug {
  return SCENARIO_SLUGS.includes(value as ScenarioSlug)
}

async function loadScenario(slug: ScenarioSlug) {
  const row = await getPublicB9ContentItem('scenario', slug).catch((err) => {
    console.error(`[scenarios/${slug}] CMS load failed`, err)
    return null
  })
  return row ?? getDefaultB9ContentItem('scenario', slug)
}

export function generateStaticParams() {
  return SCENARIO_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isScenarioSlug(slug)) return {}
  const scenario = await loadScenario(slug)
  if (!scenario) return {}
  const title = scenario.title_en
  const description = scenario.summary_en || scenario.body_en || ''
  if (!title || !description) return {}
  return buildPageMetadata({
    title,
    description,
    path: `/scenarios/${scenario.slug}`,
    image: scenario.cover_image_url,
  })
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isScenarioSlug(slug)) notFound()

  const [scenario, scenarios, pageModules] = await Promise.all([
    loadScenario(slug),
    listPublicB9ContentItems('scenario').then((rows) => withDefaultB9ContentItems('scenario', rows)).catch((err) => {
      console.error('[scenarios] related CMS load failed', err)
      return withDefaultB9ContentItems('scenario', [])
    }),
    listPublishedPageModules('scenarios').catch((err) => {
      console.error('[scenarios] page modules load failed', err)
      return listDefaultPageModules('scenarios')
    }),
  ])
  if (!scenario) notFound()

  return (
    <ScenarioPageContent
      scenario={scenario}
      scenarios={scenarios}
      pageModules={pageModules}
    />
  )
}
