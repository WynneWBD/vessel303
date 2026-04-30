import type { Metadata } from 'next'

export const SITE_URL = 'https://www.vessel303.com'
export const SITE_NAME = 'VESSEL®'
export const DEFAULT_OG_IMAGE = '/images/hero/homepage_banner-01.jpg'
export const DEFAULT_SITE_DESCRIPTION =
  'VESSEL® provides EU and US certified smart prefab architecture for tourism resorts, with 300+ projects delivered across 30+ countries.'

type PageMetadataInput = {
  title: string
  description: string
  path: string
  image?: string | null
  type?: 'website' | 'article'
}

export function buildPageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
}: PageMetadataInput): Metadata {
  const images = image ? [{ url: image }] : undefined

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      images,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}
