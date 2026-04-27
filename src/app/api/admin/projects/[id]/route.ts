import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  getProjectCaseById,
  softDeleteProjectCase,
  updateProjectCase,
} from '@/lib/project-cases-db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const statusValues = ['draft', 'published'] as const

const globalAmenitySchema = z.object({
  icon: z.string().min(1).max(12),
  label: z.object({
    zh: z.string().min(1).max(120),
    en: z.string().min(1).max(160),
  }),
})

const globalTransportSchema = z.object({
  mode: z.string().min(1).max(12),
  text: z.string().min(1).max(220),
})

const globalNearbySchema = z.object({
  name: z.string().min(1).max(120),
  distance: z.string().min(1).max(120),
})

const patchSchema = z.object({
  name_zh: z.string().min(1).max(220).optional(),
  name_en: z.string().min(1).max(220).optional(),
  location_zh: z.string().min(1).max(220).optional(),
  location_en: z.string().min(1).max(220).optional(),
  project_type_zh: z.string().max(160).optional(),
  project_type_en: z.string().max(160).optional(),
  area_display: z.string().max(80).optional(),
  investment_display: z.string().max(120).optional(),
  units_display: z.string().max(80).optional(),
  products: z.string().max(260).optional(),
  description_zh: z.string().max(1800).optional(),
  description_en: z.string().max(1800).optional(),
  tags_zh: z.array(z.string().min(1).max(50)).max(12).optional(),
  tags_en: z.array(z.string().min(1).max(50)).max(12).optional(),
  cover_image_url: z.string().max(500).nullable().optional(),
  images: z.array(z.string().min(1).max(500)).max(36).optional(),
  country: z.string().max(80).optional(),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  global_amenities: z.array(globalAmenitySchema).max(12).optional(),
  global_transport_zh: z.array(globalTransportSchema).max(12).optional(),
  global_transport_en: z.array(globalTransportSchema).max(12).optional(),
  global_nearby_zh: z.array(globalNearbySchema).max(12).optional(),
  global_nearby_en: z.array(globalNearbySchema).max(12).optional(),
  status: z.enum(statusValues).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
})

export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const project = await getProjectCaseById(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: project })
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const updated = await updateProjectCase(id, parsed.data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'project.update', 'project', id)
  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const deletedId = await softDeleteProjectCase(id)
  if (!deletedId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'project.delete', 'project', id)
  return NextResponse.json({ data: { ok: true, id: deletedId } })
}
