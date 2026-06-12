import { tableExists } from '@/lib/admin-status-metrics'
import { pool } from '@/lib/db'
import { MIN_PROJECT_CASE_DESCRIPTION_CHARS } from '@/lib/project-case-readiness'

export type CaseInquiryHealth = {
  total: number
  published: number
  ready: number
  weak: number
  draft: number
}

export const EMPTY_CASE_INQUIRY_HEALTH: CaseInquiryHealth = {
  total: 0,
  published: 0,
  ready: 0,
  weak: 0,
  draft: 0,
}

const CASE_INQUIRY_READY_SQL = `(
  NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NOT NULL
  AND jsonb_array_length(COALESCE(images, '[]'::jsonb)) > 0
  AND NULLIF(BTRIM(COALESCE(description_zh, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NOT NULL
  AND LENGTH(BTRIM(COALESCE(description_zh, ''))) >= ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
  AND LENGTH(BTRIM(COALESCE(description_en, ''))) >= ${MIN_PROJECT_CASE_DESCRIPTION_CHARS}
  AND NULLIF(BTRIM(COALESCE(project_type_zh, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(project_type_en, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(area_display, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(units_display, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(products, '')), '') IS NOT NULL
  AND jsonb_array_length(COALESCE(tags_zh, '[]'::jsonb)) > 0
  AND jsonb_array_length(COALESCE(tags_en, '[]'::jsonb)) > 0
)`

function parseCount(value: string | undefined): number {
  const count = parseInt(value ?? '0', 10)
  return Number.isFinite(count) ? count : 0
}

export async function loadCaseInquiryHealth(): Promise<CaseInquiryHealth> {
  try {
    if (!(await tableExists('public.project_cases'))) return EMPTY_CASE_INQUIRY_HEALTH

    const res = await pool.query<{
      total: string
      published: string
      ready: string
      weak: string
      draft: string
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE status = 'published')::text AS published,
         COUNT(*) FILTER (
           WHERE status = 'published' AND ${CASE_INQUIRY_READY_SQL}
         )::text AS ready,
         COUNT(*) FILTER (
           WHERE status = 'published' AND NOT ${CASE_INQUIRY_READY_SQL}
         )::text AS weak,
         COUNT(*) FILTER (WHERE status = 'draft')::text AS draft
       FROM project_cases
       WHERE deleted_at IS NULL`,
    )
    const row = res.rows[0]

    return {
      total: parseCount(row?.total),
      published: parseCount(row?.published),
      ready: parseCount(row?.ready),
      weak: parseCount(row?.weak),
      draft: parseCount(row?.draft),
    }
  } catch (err) {
    console.error('[project-case-inquiry-health] load failed', err)
    return EMPTY_CASE_INQUIRY_HEALTH
  }
}
