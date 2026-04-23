'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Download, Shield, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type {
  AdminUserRow,
  UserIdentity,
  UserRole,
  UserSummary,
} from '@/lib/users-db'

type Filters = {
  role: string
  identity: string
  disabled: string
  search: string
}

const IDENTITY_LABEL: Record<string, string> = {
  buyer: 'B-采购商',
  investor: 'B-投资方',
  agent: 'B-代理',
  individual: 'C-个人',
}

function relativeTime(ts: string | null): string {
  if (!ts) return '从未登录'
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (isNaN(diff)) return ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  const mon = Math.floor(day / 30)
  if (mon < 12) return `${mon} 个月前`
  return `${Math.floor(mon / 12)} 年前`
}

function formatDate(ts: string | null) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function roleBadgeClass(role: UserRole) {
  return role === 'admin'
    ? 'bg-[#E36F2C]/20 text-[#E36F2C] border-[#E36F2C]/30'
    : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
}

function identityBadgeClass(identity: UserIdentity | null) {
  if (!identity) return 'bg-gray-600/15 text-gray-500 border-gray-600/20'
  if (identity === 'individual') {
    return 'bg-green-600/20 text-green-400 border-green-600/30'
  }
  return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
}

type UserWithFlag = AdminUserRow & { is_whitelisted?: boolean }

export default function UsersClient({
  initialUsers,
  initialTotal,
  initialFilters,
  initialSummary,
  whitelist,
  currentUserId,
}: {
  initialUsers: AdminUserRow[]
  initialTotal: number
  initialFilters: Filters
  initialSummary: UserSummary
  whitelist: string[]
  currentUserId: string
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [summary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<UserWithFlag | null>(null)

  const isWhitelist = useCallback(
    (email: string | null | undefined) => {
      if (!email) return false
      return whitelist.includes(email.toLowerCase())
    },
    [whitelist],
  )

  const buildQuery = useCallback((f: Filters) => {
    const sp = new URLSearchParams()
    if (f.role && f.role !== 'all') sp.set('role', f.role)
    if (f.identity && f.identity !== 'all') sp.set('identity', f.identity)
    if (f.disabled && f.disabled !== 'all') sp.set('disabled', f.disabled)
    if (f.search) sp.set('search', f.search)
    return sp.toString()
  }, [])

  const reload = useCallback(
    async (f: Filters) => {
      setLoading(true)
      try {
        const qs = buildQuery(f)
        const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('load failed')
        const data = (await res.json()) as { users: AdminUserRow[]; total: number }
        setUsers(data.users)
        setTotal(data.total)
      } catch (err) {
        toast.error('加载失败')
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [buildQuery],
  )

  useEffect(() => {
    const t = setTimeout(() => reload(filters), 300)
    return () => clearTimeout(t)
  }, [filters, reload])

  const handleExport = () => {
    const qs = buildQuery(filters)
    window.location.href = `/api/admin/users/export${qs ? `?${qs}` : ''}`
  }

  const handleSelect = async (u: AdminUserRow) => {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = (await res.json()) as { user: UserWithFlag }
        setSelected(data.user)
        return
      }
    } catch {
      /* ignore */
    }
    setSelected({ ...u, is_whitelisted: isWhitelist(u.email) })
  }

  const handleSave = async (
    u: UserWithFlag,
    patch: { role: UserRole; identity: string; disabled: boolean },
  ) => {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: patch.role,
          identity: patch.identity === 'null' ? null : patch.identity,
          disabled: patch.disabled,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '保存失败')
      }
      const data = (await res.json()) as { user: UserWithFlag }
      toast.success('已保存')
      setSelected(data.user)
      await reload(filters)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title + summary + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <h1
            className="text-white"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            用户管理
          </h1>
          <div className="text-xs text-[#8A8580]">
            共 {summary.total} 个用户 · 管理员 {summary.admins} 个 · 已禁用{' '}
            {summary.disabled} 个
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download size={16} />
          导出 CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          value={filters.role}
          onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
        >
          <option value="all">角色:全部</option>
          <option value="admin">admin</option>
          <option value="user">user</option>
        </Select>
        <Select
          value={filters.identity}
          onChange={(e) => setFilters((f) => ({ ...f, identity: e.target.value }))}
        >
          <option value="all">身份:全部</option>
          <option value="buyer">B-采购商</option>
          <option value="investor">B-投资方</option>
          <option value="agent">B-代理</option>
          <option value="individual">C-个人</option>
          <option value="null">未标记</option>
        </Select>
        <Select
          value={filters.disabled}
          onChange={(e) => setFilters((f) => ({ ...f, disabled: e.target.value }))}
        >
          <option value="all">状态:全部</option>
          <option value="false">已激活</option>
          <option value="true">已禁用</option>
        </Select>
        <Input
          placeholder="搜索邮箱或姓名"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#2A2A2E] bg-[#0F0F0F] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A2E] text-[#8A8580]">
                <th className="text-left font-medium px-4 py-3">邮箱</th>
                <th className="text-left font-medium px-4 py-3">姓名</th>
                <th className="text-left font-medium px-4 py-3">角色</th>
                <th className="text-left font-medium px-4 py-3">身份</th>
                <th className="text-left font-medium px-4 py-3">注册时间</th>
                <th className="text-left font-medium px-4 py-3">最近登录</th>
                <th className="text-left font-medium px-4 py-3">状态</th>
                <th className="text-left font-medium px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-[#C4B9AB]">
                    暂无用户
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const wl = isWhitelist(u.email)
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-[#2A2A2E] hover:bg-[#141414] cursor-pointer transition-colors ${
                      wl ? 'bg-[#E36F2C]/5' : ''
                    }`}
                    onClick={() => handleSelect(u)}
                  >
                    <td className="px-4 py-3 text-[#F0F0F0]">
                      <div className="flex items-center gap-2">
                        <span>{u.email}</span>
                        {wl && (
                          <span
                            className="inline-flex items-center gap-1 rounded-sm border border-[#E36F2C]/30 bg-[#E36F2C]/10 px-1.5 py-0.5 text-[10px] text-[#E36F2C]"
                            title="硬编码白名单"
                          >
                            <Shield size={10} />
                            白名单
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#C4B9AB]">{u.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={roleBadgeClass(u.role)}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={identityBadgeClass(u.identity)}>
                        {u.identity ? IDENTITY_LABEL[u.identity] ?? u.identity : '未标记'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#8A8580] whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[#8A8580] whitespace-nowrap">
                      {relativeTime(u.last_login_at)}
                    </td>
                    <td className="px-4 py-3">
                      {u.disabled ? (
                        <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                          已禁用
                        </Badge>
                      ) : (
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                          已激活
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[#E36F2C] text-xs">查看 ›</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-[#8A8580] flex items-center gap-3">
        <span>共 {total} 条</span>
        {loading && <span>加载中…</span>}
      </div>

      <UserDetailSheet
        user={selected}
        currentUserId={currentUserId}
        onClose={() => setSelected(null)}
        onSave={handleSave}
      />
    </div>
  )
}

function UserDetailSheet({
  user,
  currentUserId,
  onClose,
  onSave,
}: {
  user: UserWithFlag | null
  currentUserId: string
  onClose: () => void
  onSave: (
    user: UserWithFlag,
    patch: { role: UserRole; identity: string; disabled: boolean },
  ) => Promise<void>
}) {
  const [role, setRole] = useState<UserRole>('user')
  const [identity, setIdentity] = useState<string>('null')
  const [disabled, setDisabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<{ leads_count: number; news_count: number }>({
    leads_count: 0,
    news_count: 0,
  })

  useEffect(() => {
    if (!user) return
    setRole(user.role)
    setIdentity(user.identity ?? 'null')
    setDisabled(user.disabled)
    // Fetch stats alongside
    fetch(`/api/admin/users/${user.id}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setStats(data.stats)
      })
      .catch(() => void 0)
  }, [user])

  const isSelf = user?.id === currentUserId
  const isWhitelisted = !!user?.is_whitelisted

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await onSave(user, { role, identity, disabled })
    setSaving(false)
  }

  return (
    <Sheet
      open={!!user}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <SheetContent>
        {user && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#2A2A2E] flex items-center justify-center text-sm text-[#C4B9AB]">
                    {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <SheetTitle className="break-all pr-8">{user.email}</SheetTitle>
                  {isWhitelisted && (
                    <span className="inline-flex items-center gap-1 mt-1 rounded-sm border border-[#E36F2C]/30 bg-[#E36F2C]/10 px-1.5 py-0.5 text-[10px] text-[#E36F2C]">
                      <Shield size={10} />
                      白名单
                    </span>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="姓名" value={user.name} />
                <Field label="来源" value={user.has_password ? 'Email' : 'Google'} />
                <Field label="注册时间" value={formatDate(user.created_at)} />
                <Field label="最近登录" value={relativeTime(user.last_login_at)} />
              </div>

              {/* Role */}
              <div>
                <div className="text-xs text-[#8A8580] mb-2 flex items-center gap-2">
                  <span>角色管理</span>
                  <Badge className={roleBadgeClass(user.role)}>{user.role}</Badge>
                </div>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={isWhitelisted || isSelf}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </Select>
                {isWhitelisted && (
                  <p className="mt-1.5 text-xs text-[#8A8580]">
                    此用户在硬编码白名单中,无法修改角色
                  </p>
                )}
                {isSelf && !isWhitelisted && (
                  <p className="mt-1.5 text-xs text-[#8A8580]">无法修改自己的角色</p>
                )}
              </div>

              {/* Identity */}
              <div>
                <div className="text-xs text-[#8A8580] mb-2">身份标记</div>
                <Select
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                >
                  <option value="null">未标记</option>
                  <option value="buyer">B-采购商</option>
                  <option value="investor">B-投资方</option>
                  <option value="agent">B-代理</option>
                  <option value="individual">C-个人</option>
                </Select>
              </div>

              {/* Related */}
              <div className="rounded-md border border-[#2A2A2E] bg-[#141414] p-4 flex flex-col gap-2 text-sm">
                <div className="text-xs text-[#8A8580] mb-1">关联数据</div>
                <Link
                  href={`/admin/leads?search=${encodeURIComponent(user.email)}`}
                  className="flex items-center justify-between text-[#F0F0F0] hover:text-[#E36F2C]"
                >
                  <span>提交线索</span>
                  <span className="text-[#E36F2C]">{stats.leads_count} 条 ›</span>
                </Link>
                <Link
                  href={`/admin/news?author=${user.id}`}
                  className="flex items-center justify-between text-[#F0F0F0] hover:text-[#E36F2C]"
                >
                  <span>创作新闻</span>
                  <span className="text-[#E36F2C]">{stats.news_count} 篇 ›</span>
                </Link>
              </div>

              {/* Disable switch */}
              <div>
                <div className="text-xs text-[#8A8580] mb-2">账户状态</div>
                <div className="flex items-center justify-between rounded-md border border-[#2A2A2E] bg-[#141414] p-3">
                  <div>
                    <div className="text-sm text-[#F0F0F0]">
                      {disabled ? '已禁用' : '已激活'}
                    </div>
                    <div className="text-xs text-[#8A8580] mt-0.5">
                      {disabled ? '该用户无法登录' : '允许登录'}
                    </div>
                  </div>
                  <Switch
                    checked={!disabled}
                    disabled={isSelf}
                    onCheckedChange={(v) => setDisabled(!v)}
                  />
                </div>
                {disabled && !isSelf && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                    <AlertTriangle size={12} />
                    禁用后该用户无法登录
                  </p>
                )}
                {isSelf && (
                  <p className="mt-2 text-xs text-[#8A8580]">无法禁用自己</p>
                )}
              </div>
            </div>

            <SheetFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saving}
              >
                取消
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-[#8A8580]">{label}</div>
      <div className="text-sm text-[#F0F0F0] break-all">{value || '—'}</div>
    </div>
  )
}

