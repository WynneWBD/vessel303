import { NextResponse } from 'next/server'
import { listPublicDisplaySlides } from '@/lib/display-slides'

export const revalidate = 300

export async function GET() {
  try {
    return NextResponse.json({
      data: await listPublicDisplaySlides(),
    })
  } catch (err) {
    console.error('[site-content/display-slides] managed content failed', err)
  }
  return NextResponse.json({ data: [] })
}
