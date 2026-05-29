import { NextRequest, NextResponse } from 'next/server'
import { getPublicB9ContentItem } from '@/lib/b9-content-db'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? ''
  if (!slug) return NextResponse.json({ data: null })

  try {
    const data = await getPublicB9ContentItem('innovation', slug)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[site-content/innovation] fallback empty', err)
    return NextResponse.json({ data: null })
  }
}
