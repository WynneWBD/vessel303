import { NextRequest } from 'next/server'
import { z } from 'zod'
import { recordSiteEventSafe, type SiteAnalyticsEventName } from '@/lib/site-analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const eventNames = ['page_view', 'cta_click', 'form_submit_success', 'contact_redirect'] as const

const metadataValue = z.union([z.string().max(240), z.number(), z.boolean(), z.null()])

const schema = z.object({
  eventName: z.enum(eventNames),
  path: z.string().min(1).max(300),
  source: z.string().max(160).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  utmSource: z.string().max(120).optional().nullable(),
  utmMedium: z.string().max(120).optional().nullable(),
  utmCampaign: z.string().max(160).optional().nullable(),
  utmTerm: z.string().max(160).optional().nullable(),
  utmContent: z.string().max(160).optional().nullable(),
  deviceType: z.string().max(32).optional().nullable(),
  visitorId: z.string().max(160).optional().nullable(),
  sessionId: z.string().max(160).optional().nullable(),
  metadata: z.record(z.string().max(48), metadataValue).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false }, { status: 202 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ ok: false }, { status: 202 })
  }

  const eventName = parsed.data.eventName as SiteAnalyticsEventName
  await recordSiteEventSafe({
    eventName,
    path: parsed.data.path,
    source: parsed.data.source,
    referrer: parsed.data.referrer,
    utmSource: parsed.data.utmSource,
    utmMedium: parsed.data.utmMedium,
    utmCampaign: parsed.data.utmCampaign,
    utmTerm: parsed.data.utmTerm,
    utmContent: parsed.data.utmContent,
    deviceType: parsed.data.deviceType,
    visitorId: parsed.data.visitorId,
    sessionId: parsed.data.sessionId,
    metadata: parsed.data.metadata,
  })

  return Response.json({ ok: true }, { status: 202 })
}
