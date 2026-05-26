import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { listNewsCategories } from '@/lib/news-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const categories = await listNewsCategories()

  return NextResponse.json({ data: categories })
}
