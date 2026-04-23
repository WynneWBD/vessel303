import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { listUsers } from '@/lib/users-db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const result = await listUsers({
    role: sp.get('role') ?? undefined,
    identity: sp.get('identity') ?? undefined,
    disabled: sp.get('disabled') ?? undefined,
    search: sp.get('search') ?? undefined,
    page: sp.get('page') ? Number(sp.get('page')) : undefined,
    limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
  })

  return NextResponse.json(result)
}
