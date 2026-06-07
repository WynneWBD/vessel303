import { createHash } from 'node:crypto'
import { pool } from '@/lib/db'
import { CONVERSION_PATHS } from '@/lib/admin-conversion-paths'
import { getLeadSourceType, type LeadSourceType } from '@/lib/lead-source'

export type SiteAnalyticsEventName =
  | 'page_view'
  | 'cta_click'
  | 'form_submit_success'
  | 'contact_redirect'

export type RecordSiteEventInput = {
  eventName: SiteAnalyticsEventName
  path: string
  source?: string | null
  referrer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  deviceType?: string | null
  visitorId?: string | null
  sessionId?: string | null
  metadata?: Record<string, string | number | boolean | null>
}

export type AnalyticsWindowMetric = {
  days: number
  pageViews: number
  visitors: number
  ctaClicks: number
  contactRedirects: number
  formSubmits: number
  leads: number
  testEvents: number
  testLeads: number
  conversionRate: number
}

export type AnalyticsPeriodKey = 'today' | 'yesterday'

export type AnalyticsPeriodMetric = {
  key: AnalyticsPeriodKey
  label: string
  pageViews: number
  visitors: number
  ctaClicks: number
  contactRedirects: number
  formSubmits: number
  leads: number
  testEvents: number
  testLeads: number
  conversionRate: number
}

export type AnalyticsRankRow = {
  key: string
  label: string
  value: number
  secondary?: number
}

export type AnalyticsConversionMetric = {
  views: number
  ctaClicks: number
  formSubmits: number
  leads: number
  conversionRate: number
}

export type AnalyticsTrendRow = {
  date: string
  pageViews: number
  visitors: number
  actions: number
  formSubmits: number
  leads: number
}

export type AnalyticsHourlyTrendRow = {
  hour: string
  pageViews: number
  visitors: number
  actions: number
  formSubmits: number
}

export type SiteAnalyticsDashboard = {
  available: boolean
  periods: AnalyticsPeriodMetric[]
  windows: AnalyticsWindowMetric[]
  hourlyTrend: AnalyticsHourlyTrendRow[]
  dailyTrend: AnalyticsTrendRow[]
  topPages: AnalyticsRankRow[]
  topReferrers: AnalyticsRankRow[]
  sourceTypes: AnalyticsRankRow[]
  landingPages: AnalyticsRankRow[]
  conversionPaths: Record<string, AnalyticsConversionMetric>
  recentEvents: Array<{
    eventName: string
    path: string
    source: string | null
    sourceType: string | null
    createdAt: string
  }>
}

const EMPTY_CONVERSION_METRIC: AnalyticsConversionMetric = {
  views: 0,
  ctaClicks: 0,
  formSubmits: 0,
  leads: 0,
  conversionRate: 0,
}

export const EMPTY_ANALYTICS_DASHBOARD: SiteAnalyticsDashboard = {
  available: false,
  periods: [
    {
      key: 'today',
      label: '今日',
      pageViews: 0,
      visitors: 0,
      ctaClicks: 0,
      contactRedirects: 0,
      formSubmits: 0,
      leads: 0,
      testEvents: 0,
      testLeads: 0,
      conversionRate: 0,
    },
    {
      key: 'yesterday',
      label: '昨日',
      pageViews: 0,
      visitors: 0,
      ctaClicks: 0,
      contactRedirects: 0,
      formSubmits: 0,
      leads: 0,
      testEvents: 0,
      testLeads: 0,
      conversionRate: 0,
    },
  ],
  windows: [7, 30].map((days) => ({
    days,
    pageViews: 0,
    visitors: 0,
    ctaClicks: 0,
    contactRedirects: 0,
    formSubmits: 0,
    leads: 0,
    testEvents: 0,
    testLeads: 0,
    conversionRate: 0,
  })),
  hourlyTrend: [],
  dailyTrend: [],
  topPages: [],
  topReferrers: [],
  sourceTypes: [],
  landingPages: [],
  conversionPaths: Object.fromEntries(CONVERSION_PATHS.map((item) => [item.key, EMPTY_CONVERSION_METRIC])),
  recentEvents: [],
}

let ensurePromise: Promise<void> | null = null

const REAL_EVENT_CONDITION = "source_type <> 'admin-test'"
const TEST_EVENT_CONDITION = "source_type = 'admin-test'"
const REAL_LEAD_CONDITION = `
  deleted_at IS NULL
  AND COALESCE(source, '') NOT ILIKE 'admin_test%'
  AND COALESCE(message, '') NOT ILIKE '%Codex B% test%'
`
const TEST_LEAD_CONDITION = `
  deleted_at IS NULL
  AND (
    COALESCE(source, '') ILIKE 'admin_test%'
    OR COALESCE(message, '') ILIKE '%Codex B% test%'
  )
`

export async function ensureSiteAnalyticsTables() {
  ensurePromise ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_events (
        id BIGSERIAL PRIMARY KEY,
        event_name VARCHAR(64) NOT NULL,
        path TEXT NOT NULL,
        source VARCHAR(160),
        source_type VARCHAR(40),
        referrer TEXT,
        utm_source VARCHAR(120),
        utm_medium VARCHAR(120),
        utm_campaign VARCHAR(160),
        utm_term VARCHAR(160),
        utm_content VARCHAR(160),
        device_type VARCHAR(32),
        visitor_id_hash VARCHAR(64),
        session_id_hash VARCHAR(64),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_site_events_created_at ON site_events (created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_site_events_event_created ON site_events (event_name, created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_site_events_path_created ON site_events (path, created_at DESC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_site_events_source_type_created ON site_events (source_type, created_at DESC)`)
  })()

  return ensurePromise
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ exists: string | null }>('SELECT to_regclass($1) AS exists', [tableName])
  return Boolean(res.rows[0]?.exists)
}

function cleanText(value: string | null | undefined, max: number) {
  const text = String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, ' ')
  return text ? text.slice(0, max) : null
}

function normalizePath(path: string | null | undefined) {
  const raw = String(path ?? '/').trim() || '/'
  try {
    const url = new URL(raw, 'https://www.vessel303.com')
    return cleanText(url.pathname || '/', 240) ?? '/'
  } catch {
    return cleanText(raw.split('?')[0] || '/', 240) ?? '/'
  }
}

function normalizeReferrer(referrer: string | null | undefined) {
  const raw = cleanText(referrer, 400)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return cleanText(`${url.hostname}${url.pathname}`, 260)
  } catch {
    return raw.slice(0, 260)
  }
}

function hashIdentifier(value: string | null | undefined) {
  const clean = cleanText(value, 160)
  if (!clean) return null
  return createHash('sha256').update(clean).digest('hex')
}

function normalizeMetadata(metadata: Record<string, string | number | boolean | null> | undefined) {
  if (!metadata || typeof metadata !== 'object') return {}
  return Object.fromEntries(
    Object.entries(metadata)
      .slice(0, 16)
      .map(([key, value]) => {
        const cleanKey = cleanText(key, 48) ?? 'field'
        if (typeof value === 'string') return [cleanKey, cleanText(value, 180)]
        if (typeof value === 'number' && Number.isFinite(value)) return [cleanKey, value]
        if (typeof value === 'boolean' || value === null) return [cleanKey, value]
        return [cleanKey, null]
      }),
  )
}

function getSourceType(source: string | null): LeadSourceType {
  if (!source) return 'other'
  const type = getLeadSourceType(source)
  return type === 'all' ? 'other' : type
}

export async function recordSiteEvent(input: RecordSiteEventInput) {
  await ensureSiteAnalyticsTables()

  const source = cleanText(input.source, 160)
  const sourceType = getSourceType(source)

  await pool.query(
    `INSERT INTO site_events
       (event_name, path, source, source_type, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        device_type, visitor_id_hash, session_id_hash, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)`,
    [
      input.eventName,
      normalizePath(input.path),
      source,
      sourceType,
      normalizeReferrer(input.referrer),
      cleanText(input.utmSource, 120),
      cleanText(input.utmMedium, 120),
      cleanText(input.utmCampaign, 160),
      cleanText(input.utmTerm, 160),
      cleanText(input.utmContent, 160),
      cleanText(input.deviceType, 32),
      hashIdentifier(input.visitorId),
      hashIdentifier(input.sessionId),
      JSON.stringify(normalizeMetadata(input.metadata)),
    ],
  )
}

export async function recordSiteEventSafe(input: RecordSiteEventInput) {
  try {
    await recordSiteEvent(input)
  } catch (err) {
    console.error('[site-analytics] event insert failed', err)
  }
}

async function loadWindowMetric(days: number): Promise<AnalyticsWindowMetric> {
  const [eventRes, leadRes] = await Promise.all([
    pool.query<{
      page_views: string
      visitors: string
      cta_clicks: string
      contact_redirects: string
      form_submits: string
      test_events: string
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE event_name = 'page_view' AND ${REAL_EVENT_CONDITION})::text AS page_views,
         COUNT(DISTINCT visitor_id_hash) FILTER (WHERE event_name = 'page_view' AND visitor_id_hash IS NOT NULL AND ${REAL_EVENT_CONDITION})::text AS visitors,
         COUNT(*) FILTER (WHERE event_name = 'cta_click' AND ${REAL_EVENT_CONDITION})::text AS cta_clicks,
         COUNT(*) FILTER (WHERE event_name = 'contact_redirect' AND ${REAL_EVENT_CONDITION})::text AS contact_redirects,
         COUNT(*) FILTER (WHERE event_name = 'form_submit_success' AND ${REAL_EVENT_CONDITION})::text AS form_submits,
         COUNT(*) FILTER (WHERE ${TEST_EVENT_CONDITION})::text AS test_events
       FROM site_events
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')`,
      [days],
    ),
    loadLeadCount(days),
  ])

  const row = eventRes.rows[0]
  const pageViews = toInt(row?.page_views)
  const leads = leadRes.leads
  return {
    days,
    pageViews,
    visitors: toInt(row?.visitors),
    ctaClicks: toInt(row?.cta_clicks),
    contactRedirects: toInt(row?.contact_redirects),
    formSubmits: toInt(row?.form_submits),
    leads,
    testEvents: toInt(row?.test_events),
    testLeads: leadRes.testLeads,
    conversionRate: pageViews > 0 ? leads / pageViews : 0,
  }
}

async function loadPeriodMetric(key: AnalyticsPeriodKey): Promise<AnalyticsPeriodMetric> {
  const { label, startSql, endSql } = periodSql(key)
  const [eventRes, leadRes] = await Promise.all([
    pool.query<{
      page_views: string
      visitors: string
      cta_clicks: string
      contact_redirects: string
      form_submits: string
      test_events: string
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE event_name = 'page_view' AND ${REAL_EVENT_CONDITION})::text AS page_views,
         COUNT(DISTINCT visitor_id_hash) FILTER (WHERE event_name = 'page_view' AND visitor_id_hash IS NOT NULL AND ${REAL_EVENT_CONDITION})::text AS visitors,
         COUNT(*) FILTER (WHERE event_name = 'cta_click' AND ${REAL_EVENT_CONDITION})::text AS cta_clicks,
         COUNT(*) FILTER (WHERE event_name = 'contact_redirect' AND ${REAL_EVENT_CONDITION})::text AS contact_redirects,
         COUNT(*) FILTER (WHERE event_name = 'form_submit_success' AND ${REAL_EVENT_CONDITION})::text AS form_submits,
         COUNT(*) FILTER (WHERE ${TEST_EVENT_CONDITION})::text AS test_events
       FROM site_events
       WHERE created_at >= ${startSql}
         AND created_at < ${endSql}`,
    ),
    loadLeadPeriodCount(key),
  ])

  const row = eventRes.rows[0]
  const pageViews = toInt(row?.page_views)
  const leads = leadRes.leads
  return {
    key,
    label,
    pageViews,
    visitors: toInt(row?.visitors),
    ctaClicks: toInt(row?.cta_clicks),
    contactRedirects: toInt(row?.contact_redirects),
    formSubmits: toInt(row?.form_submits),
    leads,
    testEvents: toInt(row?.test_events),
    testLeads: leadRes.testLeads,
    conversionRate: pageViews > 0 ? leads / pageViews : 0,
  }
}

async function loadLeadPeriodCount(key: AnalyticsPeriodKey) {
  if (!(await tableExists('public.leads'))) return { leads: 0, testLeads: 0 }
  const { startSql, endSql } = periodSql(key)
  const res = await pool.query<{ count: string; test_count: string }>(
    `SELECT COUNT(*) FILTER (WHERE ${REAL_LEAD_CONDITION})::text AS count,
            COUNT(*) FILTER (WHERE ${TEST_LEAD_CONDITION})::text AS test_count
     FROM leads
     WHERE created_at >= ${startSql}
       AND created_at < ${endSql}`,
  )
  return {
    leads: toInt(res.rows[0]?.count),
    testLeads: toInt(res.rows[0]?.test_count),
  }
}

async function loadLeadCount(days: number) {
  if (!(await tableExists('public.leads'))) return { leads: 0, testLeads: 0 }
  const res = await pool.query<{ count: string; test_count: string }>(
    `SELECT COUNT(*) FILTER (WHERE ${REAL_LEAD_CONDITION})::text AS count,
            COUNT(*) FILTER (WHERE ${TEST_LEAD_CONDITION})::text AS test_count
     FROM leads
     WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')`,
    [days],
  )
  return {
    leads: toInt(res.rows[0]?.count),
    testLeads: toInt(res.rows[0]?.test_count),
  }
}

async function loadLeadSourceCounts(days: number) {
  if (!(await tableExists('public.leads'))) return new Map<LeadSourceType, number>()
  const res = await pool.query<{ source: string | null; count: string }>(
    `SELECT source, COUNT(*)::text AS count
     FROM leads
     WHERE ${REAL_LEAD_CONDITION}
       AND created_at >= NOW() - ($1::int * INTERVAL '1 day')
     GROUP BY source`,
    [days],
  )
  const counts = new Map<LeadSourceType, number>()
  for (const row of res.rows) {
    const type = getSourceType(row.source)
    counts.set(type, (counts.get(type) ?? 0) + toInt(row.count))
  }
  return counts
}

async function loadLeadDailyCounts(days: number) {
  if (!(await tableExists('public.leads'))) return new Map<string, number>()
  const res = await pool.query<{ date: string; count: string }>(
    `SELECT created_at::date::text AS date, COUNT(*)::text AS count
     FROM leads
     WHERE ${REAL_LEAD_CONDITION}
       AND created_at >= CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day')
     GROUP BY created_at::date
     ORDER BY created_at::date`,
    [days],
  )
  return new Map(res.rows.map((row) => [row.date, toInt(row.count)]))
}

async function loadHourlyTrend(): Promise<AnalyticsHourlyTrendRow[]> {
  const res = await pool.query<{
    hour: string
    page_views: string
    visitors: string
    actions: string
    form_submits: string
  }>(
    `WITH hours AS (
       SELECT generate_series(0, 23) AS hour
     )
     SELECT
       LPAD(hours.hour::text, 2, '0') || ':00' AS hour,
       COUNT(site_events.id) FILTER (WHERE site_events.event_name = 'page_view' AND ${REAL_EVENT_CONDITION})::text AS page_views,
       COUNT(DISTINCT site_events.visitor_id_hash) FILTER (
         WHERE site_events.event_name = 'page_view'
           AND site_events.visitor_id_hash IS NOT NULL
           AND ${REAL_EVENT_CONDITION}
       )::text AS visitors,
       COUNT(site_events.id) FILTER (
         WHERE site_events.event_name IN ('cta_click', 'contact_redirect', 'form_submit_success')
           AND ${REAL_EVENT_CONDITION}
       )::text AS actions,
       COUNT(site_events.id) FILTER (WHERE site_events.event_name = 'form_submit_success' AND ${REAL_EVENT_CONDITION})::text AS form_submits
     FROM hours
     LEFT JOIN site_events
       ON site_events.created_at >= CURRENT_DATE + (hours.hour * INTERVAL '1 hour')
      AND site_events.created_at < CURRENT_DATE + ((hours.hour + 1) * INTERVAL '1 hour')
     GROUP BY hours.hour
     ORDER BY hours.hour`,
  )

  return res.rows.map((row) => ({
    hour: row.hour,
    pageViews: toInt(row.page_views),
    visitors: toInt(row.visitors),
    actions: toInt(row.actions),
    formSubmits: toInt(row.form_submits),
  }))
}

async function loadDailyTrend(days = 14): Promise<AnalyticsTrendRow[]> {
  const [eventRes, leadCounts] = await Promise.all([
    pool.query<{
      date: string
      page_views: string
      visitors: string
      actions: string
      form_submits: string
    }>(
      `WITH days AS (
         SELECT generate_series(
           CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day'),
           CURRENT_DATE,
           INTERVAL '1 day'
         )::date AS day
       )
       SELECT
         days.day::text AS date,
         COUNT(site_events.id) FILTER (WHERE site_events.event_name = 'page_view' AND ${REAL_EVENT_CONDITION})::text AS page_views,
         COUNT(DISTINCT site_events.visitor_id_hash) FILTER (
           WHERE site_events.event_name = 'page_view'
             AND site_events.visitor_id_hash IS NOT NULL
             AND ${REAL_EVENT_CONDITION}
         )::text AS visitors,
         COUNT(site_events.id) FILTER (
           WHERE site_events.event_name IN ('cta_click', 'contact_redirect', 'form_submit_success')
             AND ${REAL_EVENT_CONDITION}
         )::text AS actions,
         COUNT(site_events.id) FILTER (WHERE site_events.event_name = 'form_submit_success' AND ${REAL_EVENT_CONDITION})::text AS form_submits
       FROM days
       LEFT JOIN site_events ON site_events.created_at::date = days.day
       GROUP BY days.day
       ORDER BY days.day`,
      [days],
    ),
    loadLeadDailyCounts(days),
  ])

  return eventRes.rows.map((row) => ({
    date: row.date,
    pageViews: toInt(row.page_views),
    visitors: toInt(row.visitors),
    actions: toInt(row.actions),
    formSubmits: toInt(row.form_submits),
    leads: leadCounts.get(row.date) ?? 0,
  }))
}

async function loadRankRows(
  sql: string,
  params: unknown[],
  mapRow: (row: Record<string, unknown>) => AnalyticsRankRow,
) {
  const res = await pool.query<Record<string, unknown>>(sql, params)
  return res.rows.map(mapRow)
}

export async function loadSiteAnalyticsDashboard(): Promise<SiteAnalyticsDashboard> {
  try {
    if (!(await tableExists('public.site_events'))) {
      return EMPTY_ANALYTICS_DASHBOARD
    }

    const [periods, windows, hourlyTrend, dailyTrend, topPages, topReferrers, sourceTypes, landingPages, conversionPaths, recentEvents] =
      await Promise.all([
        Promise.all([loadPeriodMetric('today'), loadPeriodMetric('yesterday')]),
        Promise.all([loadWindowMetric(7), loadWindowMetric(30)]),
        loadHourlyTrend(),
        loadDailyTrend(14),
        loadRankRows(
          `SELECT path AS key, COUNT(*)::text AS value,
                  COUNT(DISTINCT visitor_id_hash) FILTER (WHERE visitor_id_hash IS NOT NULL)::text AS secondary
           FROM site_events
           WHERE event_name = 'page_view'
             AND ${REAL_EVENT_CONDITION}
             AND created_at >= NOW() - INTERVAL '30 days'
           GROUP BY path
           ORDER BY COUNT(*) DESC
           LIMIT 10`,
          [],
          (row) => ({
            key: String(row.key ?? '/'),
            label: String(row.key ?? '/'),
            value: toInt(row.value),
            secondary: toInt(row.secondary),
          }),
        ),
        loadRankRows(
          `SELECT COALESCE(NULLIF(referrer, ''), 'Direct / unknown') AS key, COUNT(*)::text AS value
           FROM site_events
           WHERE event_name = 'page_view'
             AND ${REAL_EVENT_CONDITION}
             AND created_at >= NOW() - INTERVAL '30 days'
           GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct / unknown')
           ORDER BY COUNT(*) DESC
           LIMIT 8`,
          [],
          (row) => ({ key: String(row.key), label: String(row.key), value: toInt(row.value) }),
        ),
        loadRankRows(
          `SELECT COALESCE(NULLIF(source_type, ''), 'other') AS key, COUNT(*)::text AS value
           FROM site_events
           WHERE event_name IN ('cta_click', 'contact_redirect', 'form_submit_success')
             AND ${REAL_EVENT_CONDITION}
             AND created_at >= NOW() - INTERVAL '30 days'
           GROUP BY COALESCE(NULLIF(source_type, ''), 'other')
           ORDER BY COUNT(*) DESC
           LIMIT 10`,
          [],
          (row) => ({ key: String(row.key), label: sourceTypeLabel(String(row.key)), value: toInt(row.value) }),
        ),
        loadRankRows(
          `SELECT path AS key,
                  COUNT(*) FILTER (WHERE event_name = 'page_view')::text AS value,
                  COUNT(*) FILTER (WHERE event_name IN ('cta_click', 'contact_redirect', 'form_submit_success'))::text AS secondary
           FROM site_events
           WHERE ${REAL_EVENT_CONDITION}
             AND created_at >= NOW() - INTERVAL '30 days'
           GROUP BY path
           ORDER BY COUNT(*) FILTER (WHERE event_name = 'page_view') DESC, COUNT(*) DESC
           LIMIT 10`,
          [],
          (row) => ({
            key: String(row.key ?? '/'),
            label: String(row.key ?? '/'),
            value: toInt(row.value),
            secondary: toInt(row.secondary),
          }),
        ),
        loadConversionPathAnalytics(30),
        pool.query<{
          event_name: string
          path: string
          source: string | null
          source_type: string | null
          created_at: string
        }>(
          `SELECT event_name, path, source, source_type, created_at::text
           FROM site_events
           WHERE ${REAL_EVENT_CONDITION}
           ORDER BY created_at DESC
           LIMIT 12`,
        ),
      ])

    return {
      available: true,
      periods,
      windows,
      hourlyTrend,
      dailyTrend,
      topPages,
      topReferrers,
      sourceTypes,
      landingPages,
      conversionPaths,
      recentEvents: recentEvents.rows.map((row) => ({
        eventName: row.event_name,
        path: row.path,
        source: row.source,
        sourceType: row.source_type,
        createdAt: row.created_at,
      })),
    }
  } catch (err) {
    console.error('[site-analytics] dashboard load failed', err)
    return EMPTY_ANALYTICS_DASHBOARD
  }
}

export async function loadConversionPathAnalytics(days = 30): Promise<Record<string, AnalyticsConversionMetric>> {
  try {
    if (!(await tableExists('public.site_events'))) {
      return Object.fromEntries(CONVERSION_PATHS.map((item) => [item.key, EMPTY_CONVERSION_METRIC]))
    }

    const [eventRes, leadCounts] = await Promise.all([
      pool.query<{ event_name: string; path: string; source_type: string | null; count: string }>(
        `SELECT event_name, path, source_type, COUNT(*)::text AS count
         FROM site_events
         WHERE ${REAL_EVENT_CONDITION}
           AND created_at >= NOW() - ($1::int * INTERVAL '1 day')
         GROUP BY event_name, path, source_type`,
        [days],
      ),
      loadLeadSourceCounts(days),
    ])

    const rows = eventRes.rows.map((row) => ({
      eventName: row.event_name,
      path: row.path,
      sourceType: row.source_type ?? 'other',
      count: toInt(row.count),
    }))

    return Object.fromEntries(
      CONVERSION_PATHS.map((item) => {
        const sourceType = conversionSourceType(item.key)
        const views = rows
          .filter((row) => row.eventName === 'page_view' && pathMatchesConversion(row.path, item.key, item.frontendHref))
          .reduce((sum, row) => sum + row.count, 0)
        const ctaClicks = rows
          .filter((row) => row.eventName === 'cta_click' && (row.sourceType === sourceType || pathMatchesConversion(row.path, item.key, item.frontendHref)))
          .reduce((sum, row) => sum + row.count, 0)
        const contactRedirects = rows
          .filter((row) => row.eventName === 'contact_redirect' && (row.sourceType === sourceType || pathMatchesConversion(row.path, item.key, item.frontendHref)))
          .reduce((sum, row) => sum + row.count, 0)
        const formSubmits = rows
          .filter((row) => row.eventName === 'form_submit_success' && row.sourceType === sourceType)
          .reduce((sum, row) => sum + row.count, 0)
        const leads = leadCounts.get(sourceType as LeadSourceType) ?? 0
        const actions = ctaClicks + contactRedirects + formSubmits

        return [
          item.key,
          {
            views,
            ctaClicks: actions,
            formSubmits,
            leads,
            conversionRate: views > 0 ? leads / views : 0,
          },
        ]
      }),
    )
  } catch (err) {
    console.error('[site-analytics] conversion metrics failed', err)
    return Object.fromEntries(CONVERSION_PATHS.map((item) => [item.key, EMPTY_CONVERSION_METRIC]))
  }
}

function periodSql(key: AnalyticsPeriodKey) {
  if (key === 'yesterday') {
    return {
      label: '昨日',
      startSql: "CURRENT_DATE - INTERVAL '1 day'",
      endSql: 'CURRENT_DATE',
    }
  }

  return {
    label: '今日',
    startSql: 'CURRENT_DATE',
    endSql: "CURRENT_DATE + INTERVAL '1 day'",
  }
}

function conversionSourceType(key: string): LeadSourceType {
  if (key === 'products') return 'product'
  if (key === 'cases') return 'case'
  if (key === 'media-kit') return 'media-kit'
  if (key === 'faq') return 'faq'
  if (key === 'scenarios') return 'scenario'
  if (key === 'innovation') return 'innovation'
  if (key === 'news') return 'news'
  if (key === 'contact' || key === 'navbar') return 'contact'
  return 'other'
}

function pathMatchesConversion(path: string, key: string, frontendHref: string) {
  const base = frontendHref.split('?')[0]
  if (key === 'navbar') return path === '/'
  if (key === 'products') return path === '/products' || path.startsWith('/products/')
  if (key === 'cases') return path === '/cases' || path.startsWith('/cases/')
  if (key === 'scenarios') return path.startsWith('/scenarios/')
  if (key === 'innovation') return path.startsWith('/innovation/')
  if (key === 'news') return path === '/news' || path.startsWith('/news/')
  return path === base || path.startsWith(`${base}/`)
}

function toInt(value: unknown) {
  const parsed = parseInt(String(value ?? '0'), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatAnalyticsPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0%'
  return `${(value * 100).toFixed(value < 0.01 ? 2 : 1)}%`
}

export function sourceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    product: '产品',
    case: '案例',
    'media-kit': 'Media Kit',
    faq: 'FAQ',
    scenario: '场景',
    innovation: '技术专题',
    news: '新闻',
    contact: '通用联系',
    'admin-test': '后台测试',
    other: '其他',
  }
  return labels[type] ?? type
}
