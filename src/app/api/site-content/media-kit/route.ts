import { NextResponse } from 'next/server'
import { listPublicB9ContentItems } from '@/lib/b9-content-db'

export const revalidate = 300

export async function GET() {
  try {
    const data = await listPublicB9ContentItems('media_file')
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[site-content/media-kit] fallback empty', err)
    return NextResponse.json({ data: [] })
  }
}
