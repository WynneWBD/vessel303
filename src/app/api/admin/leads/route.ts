import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { createLead, listLeads, logAdminAction } from '@/lib/leads-db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const result = await listLeads({
    status: sp.get('status') ?? undefined,
    inquiry_type: sp.get('inquiry_type') ?? undefined,
    country: sp.get('country') ?? undefined,
    search: sp.get('search') ?? undefined,
    page: sp.get('page') ? Number(sp.get('page')) : undefined,
    limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
  })

  return NextResponse.json(result)
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  inquiry_type: z.string().optional().nullable(),
  sku_interest: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
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
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const lead = await createLead(parsed.data)
  await logAdminAction(admin.id, 'create', 'lead', lead.id)

  return NextResponse.json({ lead }, { status: 201 })
}
