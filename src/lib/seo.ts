import type { Metadata } from 'next'

export const SITE_URL = 'https://www.vessel303.com'

type PageMetadataInput = {
  title: string
  description: string
  path: string
  image?: string | null
  siteName?: string | null
  type?: 'website' | 'article'
}

export function buildPageMetadata({
  title,
  description,
  path,
  image = null,
  siteName = null,
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
      ...(siteName ? { siteName } : {}),
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
