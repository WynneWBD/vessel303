import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { NEWS_PUBLIC_CACHE_TAG, publishNews } from '@/lib/news-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function revalidateNewsPublicRoutes(slug?: string | null) {
  revalidateTag(NEWS_PUBLIC_CACHE_TAG, { expire: 0 })
  revalidatePath('/news')
  revalidatePath('/sitemap.xml')
  if (slug) revalidatePath(`/news/${slug}`)
}

export async function POST(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id: raw } = await ctx.params
  const id = parseInt(raw, 10)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const news = await publishNews(id)
  if (!news) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'news.publish', 'news', String(id))
  revalidateNewsPublicRoutes(news.slug)

  return NextResponse.json({ data: news })
}
