import bcrypt from 'bcryptjs'
import { pool } from '@/lib/db'
import type { UserIdentity, UserRole } from '@/lib/users-db'

export type AccountProfile = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: UserRole
  identity: UserIdentity | null
  disabled: boolean
  created_at: string
  last_login_at: string | null
  company: string | null
  country: string | null
  phone: string | null
  whatsapp: string | null
  preferred_language: string | null
  has_password: boolean
}

export type UpdateAccountProfileInput = {
  name?: string | null
  company?: string | null
  country?: string | null
  phone?: string | null
  whatsapp?: string | null
  preferred_language?: string | null
}

export type UpdateAccountPasswordInput = {
  currentPassword?: string
  newPassword: string
}

export type UpdateAccountPasswordResult =
  | { ok: true; hadPassword: boolean }
  | {
      ok: false
      reason:
        | 'not_found'
        | 'disabled'
        | 'current_password_required'
        | 'current_password_invalid'
    }

const ACCOUNT_PROFILE_COLUMNS = `
  id, email, name, image, role, identity, disabled, created_at, last_login_at,
  company, country, phone, whatsapp, preferred_language,
  (password IS NOT NULL) AS has_password
`

function hasOwn<T extends object>(obj: T, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export async function getAccountProfile(userId: string) {
  const res = await pool.query<AccountProfile>(
    `SELECT ${ACCOUNT_PROFILE_COLUMNS} FROM users WHERE id = $1`,
    [userId],
  )
  return res.rows[0] ?? null
}

export async function updateAccountProfile(
  userId: string,
  input: UpdateAccountProfileInput,
) {
  const existing = await getAccountProfile(userId)
  if (!existing) return null
  if (existing.disabled) return existing

  const next = {
    name: hasOwn(input, 'name') ? input.name ?? null : existing.name,
    company: hasOwn(input, 'company') ? input.company ?? null : existing.company,
    country: hasOwn(input, 'country') ? input.country ?? null : existing.country,
    phone: hasOwn(input, 'phone') ? input.phone ?? null : existing.phone,
    whatsapp: hasOwn(input, 'whatsapp') ? input.whatsapp ?? null : existing.whatsapp,
    preferred_language: hasOwn(input, 'preferred_language')
      ? input.preferred_language ?? null
      : existing.preferred_language,
  }

  const res = await pool.query<AccountProfile>(
    `UPDATE users
     SET name = $2,
         company = $3,
         country = $4,
         phone = $5,
         whatsapp = $6,
         preferred_language = $7
     WHERE id = $1 AND disabled = false
     RETURNING ${ACCOUNT_PROFILE_COLUMNS}`,
    [
      userId,
      next.name,
      next.company,
      next.country,
      next.phone,
      next.whatsapp,
      next.preferred_language,
    ],
  )

  return res.rows[0] ?? (await getAccountProfile(userId))
}

export async function updateAccountPassword(
  userId: string,
  input: UpdateAccountPasswordInput,
): Promise<UpdateAccountPasswordResult> {
  const res = await pool.query<{ password: string | null; disabled: boolean }>(
    `SELECT password, disabled FROM users WHERE id = $1`,
    [userId],
  )
  const user = res.rows[0]
  if (!user) return { ok: false, reason: 'not_found' }
  if (user.disabled) return { ok: false, reason: 'disabled' }

  if (user.password) {
    if (!input.currentPassword) {
      return { ok: false, reason: 'current_password_required' }
    }

    const valid = await bcrypt.compare(input.currentPassword, user.password)
    if (!valid) {
      return { ok: false, reason: 'current_password_invalid' }
    }
  }

  const hashed = await bcrypt.hash(input.newPassword, 12)
  const updateRes = await pool.query<{ id: string }>(
    `UPDATE users SET password = $2 WHERE id = $1 AND disabled = false RETURNING id`,
    [userId, hashed],
  )
  if (!updateRes.rows[0]) return { ok: false, reason: 'disabled' }

  return { ok: true, hadPassword: Boolean(user.password) }
}
