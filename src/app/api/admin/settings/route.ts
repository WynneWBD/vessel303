import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import { getSiteSettings, updateSiteSettings } from '@/lib/admin-settings-db'

export const dynamic = 'force-dynamic'

const settingsSchema = z.object({
  siteNameZh: z.string().min(1).max(120),
  siteNameEn: z.string().min(1).max(120),
  seoTitleZh: z.string().min(1).max(160),
  seoTitleEn: z.string().min(1).max(160),
  seoDescriptionZh: z.string().min(1).max(300),
  seoDescriptionEn: z.string().min(1).max(300),
  contactUrl: z.string().url().max(300),
  productsLegacyUrl: z.string().url().max(300),
  salesEmail: z.string().email().max(200),
  salesPhone: z.string().min(1).max(80),
  whatsapp: z.string().min(1).max(80),
  mediaMaxUploadMb: z.coerce.number().int().min(1).max(100),
  mapProvider: z.string().min(1).max(80),
  maintenanceMode: z.boolean(),
  maintenanceNotice: z.string().max(500),
})

export async function GET() {
  const admin = await requireSuperAdmin()
  if (admin instanceof Response) return admin

  const settings = await getSiteSettings()
  return NextResponse.json({ data: settings })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireSuperAdmin()
  if (admin instanceof Response) return admin

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const settings = await updateSiteSettings(parsed.data, admin.id)
  await logAdminAction(admin.id, 'settings.update', 'site_settings', 'global')

  return NextResponse.json({ data: settings })
}
