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

const ACCOUNT_PREVIEW_PROFILE: AccountProfile = {
  id: 'visual-preview',
  email: 'preview@vessel303.com',
  name: 'VESSEL Preview',
  image: null,
  role: 'user',
  identity: null,
  disabled: false,
  created_at: '2026-01-01T00:00:00.000Z',
  last_login_at: null,
  company: 'VESSEL',
  country: 'Singapore',
  phone: '+65 0000 0000',
  whatsapp: '+65 0000 0000',
  preferred_language: 'en',
  has_password: true,
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

const ACCOUNT_FALLBACK_MODULES: PublicPageModule[] = [
  {
    page_key: 'account',
    module_key: 'header',
    title_zh: '账户中心',
    title_en: 'Account Center',
    is_visible: true,
    sort_order: 10,
    items: [
      { id: 'eyebrow', label_zh: '账户', label_en: 'Account', is_visible: true, sort_order: 10 },
    ],
  },
  {
    page_key: 'account',
    module_key: 'profile',
    title_zh: '资料',
    title_en: 'Profile',
    description_zh: '更新联系信息，方便项目沟通。',
    description_en: 'Update contact information for project communication.',
    is_visible: true,
    sort_order: 20,
    items: [
      { id: 'name-label', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 10 },
      { id: 'name-placeholder', label_zh: '姓名占位', label_en: 'Name placeholder', value_zh: '您的姓名', value_en: 'Your name', is_visible: true, sort_order: 20 },
      { id: 'company-label', label_zh: '公司 / 机构', label_en: 'Company / Organization', is_visible: true, sort_order: 30 },
      { id: 'company-placeholder', label_zh: '公司占位', label_en: 'Company placeholder', value_zh: '公司名称', value_en: 'Company name', is_visible: true, sort_order: 40 },
      { id: 'country-label', label_zh: '国家 / 城市', label_en: 'Country / City', is_visible: true, sort_order: 50 },
      { id: 'country-placeholder', label_zh: '国家占位', label_en: 'Country placeholder', value_zh: '项目所在国家或城市', value_en: 'Project country or city', is_visible: true, sort_order: 60 },
      { id: 'phone-label', label_zh: '电话', label_en: 'Phone', is_visible: true, sort_order: 70 },
      { id: 'phone-placeholder', label_zh: '电话占位', label_en: 'Phone placeholder', value_zh: '电话', value_en: 'Phone number', is_visible: true, sort_order: 80 },
      { id: 'whatsapp-label', label_zh: 'WhatsApp', label_en: 'WhatsApp', is_visible: true, sort_order: 90 },
      { id: 'whatsapp-placeholder', label_zh: 'WhatsApp 占位', label_en: 'WhatsApp placeholder', value_zh: 'WhatsApp', value_en: 'WhatsApp', is_visible: true, sort_order: 100 },
      { id: 'language-label', label_zh: '首选语言', label_en: 'Preferred Language', is_visible: true, sort_order: 110 },
      { id: 'language-empty', label_zh: '不指定', label_en: 'Not specified', is_visible: true, sort_order: 120 },
      { id: 'language-zh', label_zh: '中文', label_en: 'Chinese', is_visible: true, sort_order: 130 },
      { id: 'language-en', label_zh: '英文', label_en: 'English', is_visible: true, sort_order: 140 },
      { id: 'save', label_zh: '保存资料', label_en: 'Save Profile', is_visible: true, sort_order: 150 },
      { id: 'saving', label_zh: '保存中', label_en: 'Saving', is_visible: true, sort_order: 160 },
      { id: 'success', label_zh: '资料已保存。', label_en: 'Profile saved.', is_visible: true, sort_order: 170 },
      { id: 'load-error', label_zh: '资料加载失败，请稍后再试。', label_en: 'Profile failed to load. Please try again.', is_visible: true, sort_order: 180 },
      { id: 'save-error', label_zh: '资料保存失败，请稍后再试。', label_en: 'Profile save failed. Please try again.', is_visible: true, sort_order: 190 },
    ],
  },
  {
    page_key: 'account',
    module_key: 'password',
    title_zh: '密码',
    title_en: 'Password',
    is_visible: true,
    sort_order: 30,
    items: [
      { id: 'title-change', label_zh: '修改密码', label_en: 'Change password', is_visible: true, sort_order: 10 },
      { id: 'title-set', label_zh: '设置密码', label_en: 'Set password', is_visible: true, sort_order: 20 },
      { id: 'help-change', label_zh: '输入当前密码并设置新密码。', label_en: 'Enter current password and set a new one.', is_visible: true, sort_order: 30 },
      { id: 'help-set', label_zh: '为您的账户设置密码。', label_en: 'Set a password for your account.', is_visible: true, sort_order: 40 },
      { id: 'current-label', label_zh: '当前密码', label_en: 'Current Password', is_visible: true, sort_order: 50 },
      { id: 'new-label', label_zh: '新密码', label_en: 'New Password', is_visible: true, sort_order: 60 },
      { id: 'new-placeholder', label_zh: '新密码占位', label_en: 'New password placeholder', value_zh: '输入新密码', value_en: 'Enter new password', is_visible: true, sort_order: 70 },
      { id: 'save', label_zh: '保存密码', label_en: 'Save Password', is_visible: true, sort_order: 80 },
      { id: 'saving', label_zh: '保存中', label_en: 'Saving', is_visible: true, sort_order: 90 },
      { id: 'set-success', label_zh: '密码已设置。', label_en: 'Password set.', is_visible: true, sort_order: 100 },
      { id: 'change-success', label_zh: '密码已修改。', label_en: 'Password changed.', is_visible: true, sort_order: 110 },
      { id: 'save-error', label_zh: '密码保存失败，请稍后再试。', label_en: 'Password save failed. Please try again.', is_visible: true, sort_order: 120 },
    ],
  },
]

function accountModuleAttrs(moduleKey: string) {
  return { 'data-page-module': `account:${moduleKey}` }
}

function accountModuleFieldAttrs(moduleKey: string, field: 'title' | 'description', lang: 'en' | 'zh') {
  return {
    'data-page-module': `account:${moduleKey}`,
    'data-page-module-field': field === 'title'
      ? (lang === 'zh' ? 'title_zh' : 'title_en')
      : (lang === 'zh' ? 'description_zh' : 'description_en'),
  }
}

function accountItemFieldAttrs(
  moduleKey: string,
  itemId: string,
  field: 'label' | 'value',
  lang: 'en' | 'zh',
) {
  return {
    'data-page-module': `account:${moduleKey}`,
    'data-page-module-item': itemId,
    'data-page-module-field': field === 'label'
      ? (lang === 'zh' ? 'label_zh' : 'label_en')
      : (lang === 'zh' ? 'value_zh' : 'value_en'),
  }
}

function FieldLabel({
  htmlFor,
  children,
  visualAttrs,
}: {
  htmlFor: string
  children: ReactNode
  visualAttrs?: Record<string, string>
}) {
  if (!children) return null
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[#8A8580] text-xs tracking-[0.16em] uppercase mb-1.5"
      {...visualAttrs}
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

type AccountFormsProps = {
  previewMode?: boolean
}

export default function AccountForms({ previewMode = false }: AccountFormsProps) {
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

  const modules = moduleMap(pageModules ?? ACCOUNT_FALLBACK_MODULES)
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
      if (previewMode) {
        setProfile(ACCOUNT_PREVIEW_PROFILE)
        setProfileForm(asForm(ACCOUNT_PREVIEW_PROFILE))
        setProfileError('')
        setLoading(false)
        return
      }

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
  }, [previewMode])

  const accountHeader = useMemo(() => (
    labels.eyebrow || labels.title ? (
      <div className="mb-8" {...accountModuleAttrs('header')}>
        {labels.eyebrow ? (
          <p className="text-[#E36F2C] text-xs tracking-[0.35em] uppercase font-medium mb-3" {...accountItemFieldAttrs('header', 'eyebrow', 'label', lang)}>
            {labels.eyebrow}
          </p>
        ) : null}
        {labels.title ? (
          <h1
            className="text-[#2C2A28] text-3xl sm:text-4xl font-black tracking-wider"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
            {...accountModuleFieldAttrs('header', 'title', lang)}
          >
            {labels.title}
          </h1>
        ) : null}
      </div>
    ) : null
  ), [labels.eyebrow, labels.title, lang])

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
    if (previewMode) {
      setProfileError('')
      setProfileSuccess(labels.profileSuccess)
      return
    }
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
    if (previewMode) {
      setPasswordError('')
      setPasswordSuccess(labels.passwordChangeSuccess || labels.passwordSetSuccess)
      return
    }
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
          <section className="bg-white border border-[#E5DED4] p-6 sm:p-8" {...accountModuleAttrs('profile')}>
            <div className="flex flex-col gap-1 mb-6">
              {profileTitle ? (
                <h2 className="text-[#2C2A28] text-lg font-bold tracking-wider" {...accountModuleFieldAttrs('profile', 'title', lang)}>
                  {profileTitle}
                </h2>
              ) : null}
              {profileDescription ? (
                <p className="text-[#8A8580] text-sm" {...accountModuleFieldAttrs('profile', 'description', lang)}>{profileDescription}</p>
              ) : null}
              {profile.email ? (
                <p className="text-[#8A8580] text-sm break-all">{profile.email}</p>
              ) : null}
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="account-name" visualAttrs={accountItemFieldAttrs('profile', 'name-label', 'label', lang)}>{labels.name}</FieldLabel>
                  <Input
                    id="account-name"
                    value={profileForm.name}
                    onChange={(e) => setProfileField('name', e.target.value)}
                    placeholder={labels.namePlaceholder}
                    {...accountItemFieldAttrs('profile', 'name-placeholder', 'value', lang)}
                    maxLength={50}
                    autoComplete="name"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-company" visualAttrs={accountItemFieldAttrs('profile', 'company-label', 'label', lang)}>{labels.company}</FieldLabel>
                  <Input
                    id="account-company"
                    value={profileForm.company}
                    onChange={(e) => setProfileField('company', e.target.value)}
                    placeholder={labels.companyPlaceholder}
                    {...accountItemFieldAttrs('profile', 'company-placeholder', 'value', lang)}
                    maxLength={200}
                    autoComplete="organization"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-country" visualAttrs={accountItemFieldAttrs('profile', 'country-label', 'label', lang)}>{labels.country}</FieldLabel>
                  <Input
                    id="account-country"
                    value={profileForm.country}
                    onChange={(e) => setProfileField('country', e.target.value)}
                    placeholder={labels.countryPlaceholder}
                    {...accountItemFieldAttrs('profile', 'country-placeholder', 'value', lang)}
                    maxLength={100}
                    autoComplete="country-name"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-phone" visualAttrs={accountItemFieldAttrs('profile', 'phone-label', 'label', lang)}>{labels.phone}</FieldLabel>
                  <Input
                    id="account-phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileField('phone', e.target.value)}
                    placeholder={labels.phonePlaceholder}
                    {...accountItemFieldAttrs('profile', 'phone-placeholder', 'value', lang)}
                    maxLength={50}
                    autoComplete="tel"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-whatsapp" visualAttrs={accountItemFieldAttrs('profile', 'whatsapp-label', 'label', lang)}>{labels.whatsapp}</FieldLabel>
                  <Input
                    id="account-whatsapp"
                    value={profileForm.whatsapp}
                    onChange={(e) => setProfileField('whatsapp', e.target.value)}
                    placeholder={labels.whatsappPlaceholder}
                    {...accountItemFieldAttrs('profile', 'whatsapp-placeholder', 'value', lang)}
                    maxLength={80}
                    autoComplete="tel"
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-language" visualAttrs={accountItemFieldAttrs('profile', 'language-label', 'label', lang)}>{labels.language}</FieldLabel>
                  <Select
                    id="account-language"
                    value={profileForm.preferred_language}
                    onChange={(e) =>
                      setProfileField('preferred_language', e.target.value)
                    }
                    disabled={savingProfile}
                  >
                    {labels.languageEmpty ? <option value="" {...accountItemFieldAttrs('profile', 'language-empty', 'label', lang)}>{labels.languageEmpty}</option> : null}
                    {labels.languageZh ? <option value="zh" {...accountItemFieldAttrs('profile', 'language-zh', 'label', lang)}>{labels.languageZh}</option> : null}
                    {labels.languageEn ? <option value="en" {...accountItemFieldAttrs('profile', 'language-en', 'label', lang)}>{labels.languageEn}</option> : null}
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
                <Button type="submit" disabled={savingProfile} {...accountItemFieldAttrs('profile', savingProfile && labels.profileSaving ? 'saving' : 'save', 'label', lang)}>
                  {savingProfile && labels.profileSaving ? labels.profileSaving : labels.profileSave}
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        {canRenderPassword ? (
          <aside className="bg-[#241F1B] border border-[#3A302A] p-6 text-[#F5F2ED]" {...accountModuleAttrs('password')}>
            {passwordTitle ? (
              <h2
                className="text-base font-bold tracking-wider mb-2"
                {...accountItemFieldAttrs('password', passwordMode === 'change' ? 'title-change' : 'title-set', 'label', lang)}
              >
                {passwordTitle}
              </h2>
            ) : null}
            {passwordHelp ? (
              <p
                className="text-white/45 text-xs leading-5 mb-5"
                {...accountItemFieldAttrs('password', passwordMode === 'change' ? 'help-change' : 'help-set', 'label', lang)}
              >
                {passwordHelp}
              </p>
            ) : null}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMode === 'change' && labels.currentPassword ? (
                <div>
                  <label
                    htmlFor="account-current-password"
                    className="block text-white/45 text-xs tracking-[0.16em] uppercase mb-1.5"
                    {...accountItemFieldAttrs('password', 'current-label', 'label', lang)}
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
                  {...accountItemFieldAttrs('password', 'new-label', 'label', lang)}
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
                  {...accountItemFieldAttrs('password', 'new-placeholder', 'value', lang)}
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

              <Button type="submit" className="w-full" disabled={savingPassword} {...accountItemFieldAttrs('password', savingPassword && labels.passwordSaving ? 'saving' : 'save', 'label', lang)}>
                {savingPassword && labels.passwordSaving ? labels.passwordSaving : labels.passwordSave}
              </Button>
            </form>
          </aside>
        ) : null}
      </div>
    </>
  )
}
