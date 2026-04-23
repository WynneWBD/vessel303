import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import {
  getLead,
  updateLead,
  softDeleteLead,
  logAdminAction,
  type LeadStatus,
} from '@/lib/leads-db'

export const dynamic = 'force-dynamic'

const STATUSES: LeadStatus[] = ['new', 'contacting', 'quoted', 'won', 'lost']

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const lead = await getLead(id)
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ lead })
}

const patchSchema = z.object({
  status: z.enum(STATUSES as [string, ...string[]]).optional(),
  assigned_to: z.string().nullable().optional(),
  note_append: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
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

  const updated = await updateLead(id, {
    status: parsed.data.status as LeadStatus | undefined,
    assigned_to: parsed.data.assigned_to ?? undefined,
    note_append: parsed.data.note_append ?? undefined,
  })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'update', 'lead', id)
  return NextResponse.json({ lead: updated })
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const deletedId = await softDeleteLead(id)
  if (!deletedId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logAdminAction(admin.id, 'delete', 'lead', id)
  return NextResponse.json({ ok: true, id: deletedId })
}
