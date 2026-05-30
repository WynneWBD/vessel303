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
import { useLanguage } from '@/contexts/LanguageContext'
import {
  fetchPublicPageModules,
  itemById,
  itemLabel,
  itemValue,
  moduleDescription,
  moduleMap,
  moduleTitle,
  type PublicPageModule,
} from '@/lib/page-module-client'

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
  if (!children) return null
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
  if (!children) return null
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
  const { lang } = useLanguage()
  const [pageModules, setPageModules] = useState<PublicPageModule[] | null>(null)
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
    const controller = new AbortController()
    fetchPublicPageModules('account', controller.signal)
      .then((modules) => setPageModules(modules))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setPageModules(null)
      })
    return () => controller.abort()
  }, [])

  const modules = moduleMap(pageModules)
  const headerModule = modules.get('header') ?? null
  const profileModule = modules.get('profile') ?? null
  const passwordModule = modules.get('password') ?? null
  const profileTitle = moduleTitle(profileModule, lang)
  const profileDescription = moduleDescription(profileModule, lang)
  const passwordMode = profile?.has_password ? 'change' : 'set'
  const passwordTitle = passwordMode === 'change'
    ? itemLabel(itemById(passwordModule, 'title-change'), lang)
    : itemLabel(itemById(passwordModule, 'title-set'), lang)
  const passwordHelp = passwordMode === 'change'
    ? itemLabel(itemById(passwordModule, 'help-change'), lang)
    : itemLabel(itemById(passwordModule, 'help-set'), lang)
  const labels = {
    eyebrow: itemLabel(itemById(headerModule, 'eyebrow'), lang),
    title: moduleTitle(headerModule, lang),
    name: itemLabel(itemById(profileModule, 'name-label'), lang),
    namePlaceholder: itemValue(itemById(profileModule, 'name-placeholder'), lang),
    company: itemLabel(itemById(profileModule, 'company-label'), lang),
    companyPlaceholder: itemValue(itemById(profileModule, 'company-placeholder'), lang),
    country: itemLabel(itemById(profileModule, 'country-label'), lang),
    countryPlaceholder: itemValue(itemById(profileModule, 'country-placeholder'), lang),
    phone: itemLabel(itemById(profileModule, 'phone-label'), lang),
    phonePlaceholder: itemValue(itemById(profileModule, 'phone-placeholder'), lang),
    whatsapp: itemLabel(itemById(profileModule, 'whatsapp-label'), lang),
    whatsappPlaceholder: itemValue(itemById(profileModule, 'whatsapp-placeholder'), lang),
    language: itemLabel(itemById(profileModule, 'language-label'), lang),
    languageEmpty: itemLabel(itemById(profileModule, 'language-empty'), lang),
    languageZh: itemLabel(itemById(profileModule, 'language-zh'), lang),
    languageEn: itemLabel(itemById(profileModule, 'language-en'), lang),
    profileSave: itemLabel(itemById(profileModule, 'save'), lang),
    profileSaving: itemLabel(itemById(profileModule, 'saving'), lang),
    profileSuccess: itemLabel(itemById(profileModule, 'success'), lang),
    profileLoadError: itemLabel(itemById(profileModule, 'load-error'), lang),
    profileSaveError: itemLabel(itemById(profileModule, 'save-error'), lang),
    currentPassword: itemLabel(itemById(passwordModule, 'current-label'), lang),
    newPassword: itemLabel(itemById(passwordModule, 'new-label'), lang),
    newPasswordPlaceholder: itemValue(itemById(passwordModule, 'new-placeholder'), lang),
    passwordSave: itemLabel(itemById(passwordModule, 'save'), lang),
    passwordSaving: itemLabel(itemById(passwordModule, 'saving'), lang),
    passwordSetSuccess: itemLabel(itemById(passwordModule, 'set-success'), lang),
    passwordChangeSuccess: itemLabel(itemById(passwordModule, 'change-success'), lang),
    passwordSaveError: itemLabel(itemById(passwordModule, 'save-error'), lang),
  }
  const canRenderProfile = Boolean(
    profileTitle &&
    labels.name &&
    labels.company &&
    labels.country &&
    labels.phone &&
    labels.whatsapp &&
    labels.language &&
    labels.profileSave,
  )
  const canRenderPassword = Boolean(passwordTitle && labels.newPassword && labels.passwordSave)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setProfileError('')
      try {
        const res = await fetch('/api/account/profile', { cache: 'no-store' })
        const data = await readJson(res)
        if (!res.ok || !data.profile) {
          throw new Error(getApiError(data, ''))
        }
        if (!cancelled) {
          setProfile(data.profile)
          setProfileForm(asForm(data.profile))
        }
      } catch (err) {
        if (!cancelled) {
          setProfileError(err instanceof Error ? err.message : '')
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

  const accountHeader = useMemo(() => (
    labels.eyebrow || labels.title ? (
      <div className="mb-8">
        {labels.eyebrow ? (
          <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-3">
            {labels.eyebrow}
          </p>
        ) : null}
        {labels.title ? (
          <h1
            className="text-[#2C2A28] text-3xl sm:text-4xl font-black tracking-wider"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {labels.title}
          </h1>
        ) : null}
      </div>
    ) : null
  ), [labels.eyebrow, labels.title])

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
        throw new Error(getApiError(data, labels.profileSaveError))
      }
      setProfile(data.profile)
      setProfileForm(asForm(data.profile))
      setProfileSuccess(labels.profileSuccess)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : labels.profileSaveError)
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
        throw new Error(getApiError(data, labels.passwordSaveError))
      }
      setPasswordForm({ currentPassword: '', newPassword: '' })
      setPasswordSuccess(data.mode === 'set' ? labels.passwordSetSuccess : labels.passwordChangeSuccess)
      setProfile((current) =>
        current ? { ...current, has_password: true } : current,
      )
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : labels.passwordSaveError)
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <>
        {accountHeader}
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
      </>
    )
  }

  if (!profile) {
    return (
      <>
        {accountHeader}
        {profileError || labels.profileLoadError ? (
          <section className="bg-white border border-[#E5DED4] p-6 sm:p-8">
            <StatusMessage tone="error">
              {profileError || labels.profileLoadError}
            </StatusMessage>
          </section>
        ) : null}
      </>
    )
  }

  if (!canRenderProfile && !canRenderPassword) {
    return <>{accountHeader}</>
  }

  return (
    <>
      {accountHeader}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {canRenderProfile ? (
          <section className="bg-white border border-[#E5DED4] p-6 sm:p-8">
            <div className="flex flex-col gap-1 mb-6">
              {profileTitle ? (
                <h2 className="text-[#2C2A28] text-lg font-bold tracking-wider">
                  {profileTitle}
                </h2>
              ) : null}
              {profileDescription ? (
                <p className="text-[#8A8580] text-sm">{profileDescription}</p>
              ) : null}
              {profile.email ? (
                <p className="text-[#8A8580] text-sm break-all">{profile.email}</p>
              ) : null}
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="account-name">{labels.name}</FieldLabel>
                  <Input
                    id="account-name"
                    value={profileForm.name}
                    onChange={(e) => setProfileField('name', e.target.value)}
                    placeholder={labels.namePlaceholder}
                    maxLength={50}
                    autoComplete="name"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-company">{labels.company}</FieldLabel>
                  <Input
                    id="account-company"
                    value={profileForm.company}
                    onChange={(e) => setProfileField('company', e.target.value)}
                    placeholder={labels.companyPlaceholder}
                    maxLength={200}
                    autoComplete="organization"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-country">{labels.country}</FieldLabel>
                  <Input
                    id="account-country"
                    value={profileForm.country}
                    onChange={(e) => setProfileField('country', e.target.value)}
                    placeholder={labels.countryPlaceholder}
                    maxLength={100}
                    autoComplete="country-name"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-phone">{labels.phone}</FieldLabel>
                  <Input
                    id="account-phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileField('phone', e.target.value)}
                    placeholder={labels.phonePlaceholder}
                    maxLength={50}
                    autoComplete="tel"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-whatsapp">{labels.whatsapp}</FieldLabel>
                  <Input
                    id="account-whatsapp"
                    value={profileForm.whatsapp}
                    onChange={(e) => setProfileField('whatsapp', e.target.value)}
                    placeholder={labels.whatsappPlaceholder}
                    maxLength={80}
                    autoComplete="tel"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-language">{labels.language}</FieldLabel>
                  <Select
                    id="account-language"
                    value={profileForm.preferred_language}
                    onChange={(e) =>
                      setProfileField('preferred_language', e.target.value)
                    }
                    disabled={savingProfile}
                  >
                    {labels.languageEmpty ? <option value="">{labels.languageEmpty}</option> : null}
                    {labels.languageZh ? <option value="zh">{labels.languageZh}</option> : null}
                    {labels.languageEn ? <option value="en">{labels.languageEn}</option> : null}
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
                  {savingProfile && labels.profileSaving ? labels.profileSaving : labels.profileSave}
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        {canRenderPassword ? (
          <aside className="bg-[#241F1B] border border-[#3A302A] p-6 text-[#F5F2ED]">
            {passwordTitle ? (
              <h2 className="text-base font-bold tracking-wider mb-2">
                {passwordTitle}
              </h2>
            ) : null}
            {passwordHelp ? <p className="text-white/45 text-xs leading-5 mb-5">{passwordHelp}</p> : null}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMode === 'change' && labels.currentPassword ? (
                <div>
                  <label
                    htmlFor="account-current-password"
                    className="block text-white/45 text-xs tracking-[0.16em] uppercase mb-1.5"
                  >
                    {labels.currentPassword}
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
                  {labels.newPassword}
                </label>
                <Input
                  id="account-new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordField('newPassword', e.target.value)}
                  autoComplete="new-password"
                  placeholder={labels.newPasswordPlaceholder}
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
                {savingPassword && labels.passwordSaving ? labels.passwordSaving : labels.passwordSave}
              </Button>
            </form>
          </aside>
        ) : null}
      </div>
    </>
  )
}
