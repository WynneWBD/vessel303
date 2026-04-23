import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-check'
import { isAdminEmail } from '@/lib/admin-whitelist'
import { logAdminAction } from '@/lib/leads-db'
import {
  getUser,
  updateUser,
  getUserStats,
  type UserIdentity,
  type UserRole,
} from '@/lib/users-db'

export const dynamic = 'force-dynamic'

const IDENTITIES = ['buyer', 'investor', 'agent', 'individual'] as const
const IDENTITY_OR_NULL = [...IDENTITIES, 'null'] as const

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params
  const user = await getUser(id)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const stats = await getUserStats(user)
  return NextResponse.json({
    user: { ...user, is_whitelisted: isAdminEmail(user.email) },
    stats,
  })
}

const patchSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  identity: z.enum(IDENTITY_OR_NULL).nullable().optional(),
  disabled: z.boolean().optional(),
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

  const target = await getUser(id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isSelf = admin.id === target.id
  const isWhitelist = isAdminEmail(target.email)

  // Never demote a whitelist admin: their role is sourced from ADMIN_EMAIL_WHITELIST.
  if (parsed.data.role && parsed.data.role !== target.role && isWhitelist) {
    return NextResponse.json(
      { error: '白名单用户角色由代码硬编码管理,无法通过后台修改' },
      { status: 403 },
    )
  }

  // Prevent self-lockout.
  if (isSelf && parsed.data.role && parsed.data.role !== 'admin') {
    return NextResponse.json(
      { error: '无法修改自己的角色' },
      { status: 403 },
    )
  }
  if (isSelf && parsed.data.disabled === true) {
    return NextResponse.json(
      { error: '无法禁用自己' },
      { status: 403 },
    )
  }

  // identity: 'null' (string) → actual null; leave undefined untouched.
  let identityValue: UserIdentity | null | undefined = undefined
  if (parsed.data.identity !== undefined) {
    identityValue =
      parsed.data.identity === null || parsed.data.identity === 'null'
        ? null
        : (parsed.data.identity as UserIdentity)
  }

  const updated = await updateUser(id, {
    role: parsed.data.role as UserRole | undefined,
    identity: identityValue,
    disabled: parsed.data.disabled,
  })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Audit log — split by what changed so admin_logs is queryable.
  const actions: string[] = []
  if (parsed.data.role !== undefined && parsed.data.role !== target.role) {
    actions.push('update_user_role')
  }
  if (parsed.data.identity !== undefined) {
    actions.push('update_user_identity')
  }
  if (
    parsed.data.disabled !== undefined &&
    parsed.data.disabled !== target.disabled
  ) {
    actions.push('toggle_user_disabled')
  }
  for (const action of actions) {
    await logAdminAction(admin.id, action, 'user', id)
  }

  return NextResponse.json({ user: { ...updated, is_whitelisted: isWhitelist } })
}
