import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { logAdminAction } from '@/lib/leads-db'
import {
  createProjectCase,
  isProjectCaseIdTaken,
  listProjectCases,
  type ProjectCaseMapStatus,
  type ProjectCaseStatus,
} from '@/lib/project-cases-db'

export const dynamic = 'force-dynamic'

const statusValues = ['draft', 'published'] as const
const mapStatusValues = ['map-ready', 'missing-coordinates', 'unpublished-with-coordinates'] as const

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

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const projectSchema = z.object({
  id: z.string().max(160).transform(normalizeId).pipe(z.string().min(1).max(160)),
  name_zh: z.string().min(1).max(220),
  name_en: z.string().min(1).max(220),
  location_zh: z.string().min(1).max(220),
  location_en: z.string().min(1).max(220),
  project_type_zh: z.string().max(160).optional().default(''),
  project_type_en: z.string().max(160).optional().default(''),
  area_display: z.string().max(80).optional().default(''),
  investment_display: z.string().max(120).optional().default(''),
  units_display: z.string().max(80).optional().default(''),
  products: z.string().max(260).optional().default(''),
  description_zh: z.string().max(1800).optional().default(''),
  description_en: z.string().max(1800).optional().default(''),
  tags_zh: z.array(z.string().min(1).max(50)).max(12).optional().default([]),
  tags_en: z.array(z.string().min(1).max(50)).max(12).optional().default([]),
  cover_image_url: z.string().max(500).nullable().optional().default(null),
  images: z.array(z.string().min(1).max(500)).max(36).optional().default([]),
  country: z.string().max(80).optional().default(''),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional().default(null),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional().default(null),
  global_amenities: z.array(globalAmenitySchema).max(12).optional().default([]),
  global_transport_zh: z.array(globalTransportSchema).max(12).optional().default([]),
  global_transport_en: z.array(globalTransportSchema).max(12).optional().default([]),
  global_nearby_zh: z.array(globalNearbySchema).max(12).optional().default([]),
  global_nearby_en: z.array(globalNearbySchema).max(12).optional().default([]),
  status: z.enum(statusValues).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
})

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const limit = Math.min(200, Math.max(1, Number(sp.get('limit') ?? 20)))
  const page = Math.max(1, Number(sp.get('page') ?? 1))
  const offset = (page - 1) * limit
  const rawStatus = sp.get('status')
  const status = statusValues.includes(rawStatus as ProjectCaseStatus)
    ? (rawStatus as ProjectCaseStatus)
    : undefined
  const rawMapStatus = sp.get('mapStatus')
  const mapStatus = mapStatusValues.includes(rawMapStatus as ProjectCaseMapStatus)
    ? (rawMapStatus as ProjectCaseMapStatus)
    : undefined

  const result = await listProjectCases({
    status,
    mapStatus,
    search: sp.get('search') ?? undefined,
    limit,
    offset,
  })

  return NextResponse.json({ data: result.rows, total: result.total, page, limit })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const taken = await isProjectCaseIdTaken(parsed.data.id)
  if (taken) {
    return NextResponse.json({ error: 'Project id already in use' }, { status: 409 })
  }

  const project = await createProjectCase(parsed.data)
  await logAdminAction(admin.id, 'project.create', 'project', project.id)

  return NextResponse.json({ data: project }, { status: 201 })
}
