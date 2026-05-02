'use client'

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type AccountProfile = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: 'user' | 'operator' | 'admin'
  identity: string | null
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

type ProfileForm = {
  name: string
  company: string
  country: string
  phone: string
  whatsapp: string
  preferred_language: string
}

type PasswordForm = {
  currentPassword: string
  newPassword: string
}

const emptyProfile: ProfileForm = {
  name: '',
  company: '',
  country: '',
  phone: '',
  whatsapp: '',
  preferred_language: '',
}

function asForm(profile: AccountProfile): ProfileForm {
  return {
    name: profile.name ?? '',
    company: profile.company ?? '',
    country: profile.country ?? '',
    phone: profile.phone ?? '',
    whatsapp: profile.whatsapp ?? '',
    preferred_language: profile.preferred_language ?? '',
  }
}

type AccountApiResponse = {
  error?: string
  issues?: Array<{ message?: string }>
  profile?: AccountProfile
  mode?: 'changed' | 'set'
}

async function readJson(res: Response): Promise<AccountApiResponse> {
  return (await res.json().catch(() => ({}))) as AccountApiResponse
}

function getApiError(data: AccountApiResponse, fallback: string) {
  return data.error ?? data.issues?.[0]?.message ?? fallback
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[#8A8580] text-xs tracking-[0.16em] uppercase mb-1.5"
    >
      {children}
    </label>
  )
}

function StatusMessage({
  tone,
  children,
}: {
  tone: 'success' | 'error'
  children: ReactNode
}) {
  const cls =
    tone === 'success'
      ? 'border-green-600/25 bg-green-600/10 text-green-700'
      : 'border-red-600/25 bg-red-600/10 text-red-700'
  return (
    <div
      className={`border px-3 py-2 text-sm ${cls}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}

export default function AccountForms() {
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile)
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setProfileError('')
      try {
        const res = await fetch('/api/account/profile', { cache: 'no-store' })
        const data = await readJson(res)
        if (!res.ok || !data.profile) {
          throw new Error(getApiError(data, '账户资料加载失败'))
        }
        if (!cancelled) {
          setProfile(data.profile)
          setProfileForm(asForm(data.profile))
        }
      } catch (err) {
        if (!cancelled) {
          setProfileError(err instanceof Error ? err.message : '账户资料加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const passwordMode = profile?.has_password ? 'change' : 'set'
  const passwordTitle = passwordMode === 'change' ? '修改密码' : '设置密码'
  const passwordHelp = useMemo(() => {
    if (passwordMode === 'change') return '请输入当前密码后设置新密码。'
    return '当前账户尚未设置邮箱密码，可直接设置新密码。'
  }, [passwordMode])

  function setProfileField(field: keyof ProfileForm, value: string) {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
    setProfileSuccess('')
    setProfileError('')
  }

  function setPasswordField(field: keyof PasswordForm, value: string) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
    setPasswordSuccess('')
    setPasswordError('')
  }

  async function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      const data = await readJson(res)
      if (!res.ok || !data.profile) {
        throw new Error(getApiError(data, '资料保存失败'))
      }
      setProfile(data.profile)
      setProfileForm(asForm(data.profile))
      setProfileSuccess('资料已保存')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : '资料保存失败')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      const payload =
        passwordMode === 'change'
          ? passwordForm
          : { newPassword: passwordForm.newPassword }
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await readJson(res)
      if (!res.ok) {
        throw new Error(getApiError(data, '密码保存失败'))
      }
      setPasswordForm({ currentPassword: '', newPassword: '' })
      setPasswordSuccess(data.mode === 'set' ? '密码已设置' : '密码已修改')
      setProfile((current) =>
        current ? { ...current, has_password: true } : current,
      )
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '密码保存失败')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-white border border-[#E5DED4] p-6 sm:p-8">
        <div className="h-5 w-40 bg-[#E5DED4] animate-pulse mb-6" />
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <div className="h-3 w-24 bg-[#E5DED4] animate-pulse mb-2" />
              <div className="h-10 bg-[#F5F2ED] animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="bg-white border border-[#E5DED4] p-6 sm:p-8">
        <h2 className="text-[#2C2A28] text-lg font-bold tracking-wider mb-4">
          账户资料
        </h2>
        <StatusMessage tone="error">
          {profileError || '账户资料加载失败'}
        </StatusMessage>
      </section>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <section className="bg-white border border-[#E5DED4] p-6 sm:p-8">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-[#2C2A28] text-lg font-bold tracking-wider">
            资料维护
          </h2>
          {profile.email ? (
            <p className="text-[#8A8580] text-sm break-all">{profile.email}</p>
          ) : null}
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="account-name">姓名 / Name</FieldLabel>
              <Input
                id="account-name"
                value={profileForm.name}
                onChange={(e) => setProfileField('name', e.target.value)}
                placeholder="Your name"
                maxLength={50}
                autoComplete="name"
                disabled={savingProfile}
              />
            </div>
            <div>
              <FieldLabel htmlFor="account-company">公司 / Company</FieldLabel>
              <Input
                id="account-company"
                value={profileForm.company}
                onChange={(e) => setProfileField('company', e.target.value)}
                placeholder="Company"
                maxLength={200}
                autoComplete="organization"
                disabled={savingProfile}
              />
            </div>
            <div>
              <FieldLabel htmlFor="account-country">国家 / Country</FieldLabel>
              <Input
                id="account-country"
                value={profileForm.country}
                onChange={(e) => setProfileField('country', e.target.value)}
                placeholder="Country"
                maxLength={100}
                autoComplete="country-name"
                disabled={savingProfile}
              />
            </div>
            <div>
              <FieldLabel htmlFor="account-phone">电话 / Phone</FieldLabel>
              <Input
                id="account-phone"
                value={profileForm.phone}
                onChange={(e) => setProfileField('phone', e.target.value)}
                placeholder="+86 ..."
                maxLength={50}
                autoComplete="tel"
                disabled={savingProfile}
              />
            </div>
            <div>
              <FieldLabel htmlFor="account-whatsapp">WhatsApp</FieldLabel>
              <Input
                id="account-whatsapp"
                value={profileForm.whatsapp}
                onChange={(e) => setProfileField('whatsapp', e.target.value)}
                placeholder="+86 ..."
                maxLength={80}
                autoComplete="tel"
                disabled={savingProfile}
              />
            </div>
            <div>
              <FieldLabel htmlFor="account-language">
                偏好语言 / Language
              </FieldLabel>
              <Select
                id="account-language"
                value={profileForm.preferred_language}
                onChange={(e) =>
                  setProfileField('preferred_language', e.target.value)
                }
                disabled={savingProfile}
              >
                <option value="">未设置 / Not set</option>
                <option value="zh">中文</option>
                <option value="en">English</option>
              </Select>
            </div>
          </div>

          {profileError ? (
            <StatusMessage tone="error">{profileError}</StatusMessage>
          ) : null}
          {profileSuccess ? (
            <StatusMessage tone="success">{profileSuccess}</StatusMessage>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? '保存中...' : '保存资料'}
            </Button>
          </div>
        </form>
      </section>

      <aside className="bg-[#241F1B] border border-[#3A302A] p-6 text-[#F5F2ED]">
        <h2 className="text-base font-bold tracking-wider mb-2">
          {passwordTitle}
        </h2>
        <p className="text-white/45 text-xs leading-5 mb-5">{passwordHelp}</p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordMode === 'change' ? (
            <div>
              <label
                htmlFor="account-current-password"
                className="block text-white/45 text-xs tracking-[0.16em] uppercase mb-1.5"
              >
                当前密码
              </label>
              <Input
                id="account-current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordField('currentPassword', e.target.value)
                }
                autoComplete="current-password"
                disabled={savingPassword}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-[#E36F2C]"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="account-new-password"
              className="block text-white/45 text-xs tracking-[0.16em] uppercase mb-1.5"
            >
              新密码
            </label>
            <Input
              id="account-new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordField('newPassword', e.target.value)}
              autoComplete="new-password"
              placeholder="至少8位，包含字母和数字"
              disabled={savingPassword}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-[#E36F2C]"
            />
          </div>

          {passwordError ? (
            <StatusMessage tone="error">{passwordError}</StatusMessage>
          ) : null}
          {passwordSuccess ? (
            <StatusMessage tone="success">{passwordSuccess}</StatusMessage>
          ) : null}

          <Button type="submit" className="w-full" disabled={savingPassword}>
            {savingPassword ? '提交中...' : passwordTitle}
          </Button>
        </form>
      </aside>
    </div>
  )
}
