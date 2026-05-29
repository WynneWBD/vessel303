import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { NEWS_PUBLIC_CACHE_TAG, bulkUpdateNewsCategory, getNewsCategoryById } from '@/lib/news-db'

export const dynamic = 'force-dynamic'

const batchCategorySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
  category_id: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = batchCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const category = await getNewsCategoryById(parsed.data.category_id, { visibleOnly: true })
  if (!category) {
    return NextResponse.json({ error: 'Invalid news category' }, { status: 400 })
  }

  const result = await bulkUpdateNewsCategory(parsed.data.ids, category.id)
  revalidateTag(NEWS_PUBLIC_CACHE_TAG, { expire: 0 })
  revalidatePath('/news')
  revalidatePath('/sitemap.xml')
  await logAdminAction(
    admin.id,
    'news.batch.category',
    'news',
    result.updatedIds.join(',') || parsed.data.ids.join(','),
  )

  return NextResponse.json({
    data: {
      ...result,
      category,
    },
  })
}
