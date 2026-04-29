import { NextRequest } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth-check'
import { exportUsers } from '@/lib/users-db'

export const dynamic = 'force-dynamic'

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const rows = await exportUsers({
    role: sp.get('role') ?? undefined,
    identity: sp.get('identity') ?? undefined,
    disabled: sp.get('disabled') ?? undefined,
    search: sp.get('search') ?? undefined,
  })

  const headers = [
    'Email',
    'Name',
    'Role',
    'Identity',
    'Disabled',
    'Created At',
    'Last Login At',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      [r.email, r.name, r.role, r.identity, r.disabled, r.created_at, r.last_login_at]
        .map(csvEscape)
        .join(','),
    )
  }

  const csv = '﻿' + lines.join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="users-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
