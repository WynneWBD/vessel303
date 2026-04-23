import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth-check'
import { exportLeads } from '@/lib/leads-db'

export const dynamic = 'force-dynamic'

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const sp = req.nextUrl.searchParams
  const rows = await exportLeads({
    status: sp.get('status') ?? undefined,
    inquiry_type: sp.get('inquiry_type') ?? undefined,
    country: sp.get('country') ?? undefined,
    search: sp.get('search') ?? undefined,
  })

  const headers = [
    'ID',
    'Email',
    'Name',
    'Phone',
    'Company',
    'Country',
    'Inquiry Type',
    'SKU Interest',
    'Message',
    'Status',
    'Assigned To',
    'Notes',
    'Created At',
  ]

  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.email,
        r.name,
        r.phone,
        r.company,
        r.country,
        r.inquiry_type,
        r.sku_interest,
        r.message,
        r.status,
        r.assigned_to,
        r.notes,
        r.created_at,
      ]
        .map(csvEscape)
        .join(','),
    )
  }

  // BOM so Excel opens UTF-8 CSV with Chinese characters correctly
  const csv = '﻿' + lines.join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
