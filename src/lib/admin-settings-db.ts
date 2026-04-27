import { pool } from '@/lib/db'

export type SiteSettings = {
  siteNameZh: string
  siteNameEn: string
  seoTitleZh: string
  seoTitleEn: string
  seoDescriptionZh: string
  seoDescriptionEn: string
  contactUrl: string
  productsLegacyUrl: string
  salesEmail: string
  salesPhone: string
  whatsapp: string
  mediaMaxUploadMb: number
  mapProvider: string
  maintenanceMode: boolean
  maintenanceNotice: string
}

type SiteSettingKey = keyof SiteSettings

type SettingRow = {
  key: SiteSettingKey
  value: unknown
  updated_at: string
  updated_by_email: string | null
}

export const defaultSiteSettings: SiteSettings = {
  siteNameZh: 'VESSEL 微宿',
  siteNameEn: 'VESSEL',
  seoTitleZh: 'VESSEL® 微宿 | 文旅智能装配建筑',
  seoTitleEn: 'VESSEL® | Smart Prefab Architecture',
  seoDescriptionZh: '45天工厂预制，2小时落地安装，欧盟与美国认证，服务全球文旅营地部署。',
  seoDescriptionEn: '45-day factory production, 2-hour on-site installation, EU+US certified smart prefab architecture.',
  contactUrl: 'https://en.303vessel.cn/contact.html',
  productsLegacyUrl: 'https://en.303vessel.cn/products_list.html',
  salesEmail: 'vessel.sale@303industries.cn',
  salesPhone: '400-8090-303',
  whatsapp: '+86 180-2417-6679',
  mediaMaxUploadMb: 20,
  mapProvider: 'MapTiler',
  maintenanceMode: false,
  maintenanceNotice: '',
}

const SETTING_KEYS = Object.keys(defaultSiteSettings) as SiteSettingKey[]

let schemaReady: Promise<void> | null = null

function coerceSettingValue(key: SiteSettingKey, value: unknown): SiteSettings[SiteSettingKey] {
  const fallback = defaultSiteSettings[key]
  if (typeof fallback === 'boolean') return Boolean(value)
  if (typeof fallback === 'number') {
    const n = Number(value)
    return (Number.isFinite(n) ? n : fallback) as SiteSettings[SiteSettingKey]
  }
  return (typeof value === 'string' ? value : fallback) as SiteSettings[SiteSettingKey]
}

function normalizeSettings(input: Partial<SiteSettings>): SiteSettings {
  const next = { ...defaultSiteSettings }
  for (const key of SETTING_KEYS) {
    if (input[key] !== undefined) {
      next[key] = coerceSettingValue(key, input[key]) as never
    }
  }
  return next
}

export async function ensureAdminSettingsSchema() {
  schemaReady ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key        TEXT        PRIMARY KEY,
        value      JSONB       NOT NULL,
        updated_by UUID        REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  })()

  return schemaReady
}

export async function getSiteSettings(): Promise<SiteSettings> {
  await ensureAdminSettingsSchema()
  const res = await pool.query<{ key: SiteSettingKey; value: unknown }>(
    `SELECT key, value FROM site_settings`,
  )
  const stored: Partial<SiteSettings> = {}
  for (const row of res.rows) {
    if (SETTING_KEYS.includes(row.key)) {
      stored[row.key] = coerceSettingValue(row.key, row.value) as never
    }
  }
  return normalizeSettings(stored)
}

export async function updateSiteSettings(input: SiteSettings, adminId: string): Promise<SiteSettings> {
  await ensureAdminSettingsSchema()
  const settings = normalizeSettings(input)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    for (const key of SETTING_KEYS) {
      await client.query(
        `INSERT INTO site_settings (key, value, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [key, JSON.stringify(settings[key]), adminId],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return getSiteSettings()
}

export async function getSettingsUpdatedMeta() {
  await ensureAdminSettingsSchema()
  const res = await pool.query<SettingRow>(
    `SELECT
       s.key,
       s.value,
       s.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM site_settings s
     LEFT JOIN users u ON u.id = s.updated_by
     ORDER BY s.updated_at DESC
     LIMIT 1`,
  )
  return res.rows[0] ?? null
}
