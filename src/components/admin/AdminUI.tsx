import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type AdminTone = 'blue' | 'green' | 'orange' | 'gray' | 'neutral' | 'red'
export type AdminSegmentTabItem = {
  label: string
  href: string
  active: boolean
  count?: number | string
}

function toneIconClass(tone: AdminTone): string {
  if (tone === 'orange') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'green') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'red') return 'bg-red-50 text-red-700'
  if (tone === 'gray' || tone === 'neutral') return 'bg-[#F0F2F2] text-[#61767D]'
  return 'bg-[#EAF6F8] text-[#1889B6]'
}

function toneBorderClass(tone: AdminTone): string {
  if (tone === 'orange') return 'border-l-[#E36F2C]'
  if (tone === 'green') return 'border-l-emerald-500'
  if (tone === 'red') return 'border-l-red-500'
  if (tone === 'gray' || tone === 'neutral') return 'border-l-[#8A9EA4]'
  return 'border-l-[#1889B6]'
}

export function AdminPageHero({
  kicker,
  title,
  description,
  actions,
  children,
}: {
  kicker?: string
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="border-l-4 border-[#1889B6] p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            {kicker ? (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1889B6]">{kicker}</p>
            ) : null}
            <h1 className="mt-2 text-2xl font-bold text-[#1E2C31] md:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </section>
  )
}

export function AdminSectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h2 className="text-lg font-bold text-[#1E2C31] md:text-xl">{title}</h2>
      {detail ? <p className="text-sm leading-6 text-[#61767D]">{detail}</p> : null}
    </div>
  )
}

export function AdminSegmentTabs({ items }: { items: AdminSegmentTabItem[] }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="列表筛选">
      {items.map((item) => (
        <Link
          key={`${item.label}-${item.href}`}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition md:text-sm ${
            item.active
              ? 'border-[#1889B6] bg-[#1889B6] text-white shadow-sm'
              : 'border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#1889B6]/65 hover:text-[#1889B6]'
          }`}
        >
          {item.label}
          {item.count !== undefined ? (
            <span className={`rounded px-1.5 py-0.5 text-[11px] ${item.active ? 'bg-white/18 text-white' : 'bg-[#F0F7F8] text-[#1889B6]'}`}>
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  )
}

export function AdminActionLink({
  href,
  Icon,
  label,
  primary = false,
  external = false,
}: {
  href: string
  Icon?: LucideIcon
  label: string
  primary?: boolean
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
        primary
          ? 'bg-[#E36F2C] text-white shadow-sm hover:bg-[#C95E22]'
          : 'border border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#1889B6]/65 hover:text-[#1889B6]'
      }`}
    >
      {Icon ? <Icon size={16} /> : null}
      {label}
    </Link>
  )
}

export function AdminMetricCard({
  id,
  title,
  value,
  detail,
  href,
  Icon,
  tone = 'blue',
}: {
  id?: string
  title: string
  value: number | string
  detail?: string
  href?: string
  Icon?: LucideIcon
  tone?: AdminTone
}) {
  const content = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#61767D]">{title}</span>
          <span className="mt-2 block break-words text-3xl font-bold text-[#1E2C31]">{value}</span>
        </span>
        {Icon ? (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneIconClass(tone)}`}>
            <Icon size={18} />
          </span>
        ) : null}
      </span>
      {detail ? <span className="mt-3 block text-xs leading-5 text-[#61767D]">{detail}</span> : null}
      {href ? (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
          查看
          <ArrowRight size={13} />
        </span>
      ) : null}
    </>
  )
  const className = `group rounded-md border border-l-4 border-[#D8E7E8] ${toneBorderClass(tone)} bg-white p-4 shadow-sm transition hover:border-[#1889B6]/55`

  if (!href) return <div id={id} className={className}>{content}</div>
  return (
    <Link id={id} href={href} className={`${className} hover:-translate-y-0.5`}>
      {content}
    </Link>
  )
}

export function AdminInfoCard({
  title,
  detail,
  href,
  Icon,
  tone = 'blue',
  children,
}: {
  title: string
  detail?: string
  href?: string
  Icon?: LucideIcon
  tone?: AdminTone
  children?: ReactNode
}) {
  const content = (
    <>
      <span className="flex items-start gap-3">
        {Icon ? (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneIconClass(tone)}`}>
            <Icon size={18} />
          </span>
        ) : null}
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#1E2C31]">{title}</span>
          {detail ? <span className="mt-1 block text-xs leading-5 text-[#61767D]">{detail}</span> : null}
        </span>
      </span>
      {children ? <span className="mt-4 block">{children}</span> : null}
    </>
  )
  const className = 'rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm transition hover:border-[#1889B6]/55'

  if (!href) return <div className={className}>{content}</div>
  return (
    <Link href={href} className={`${className} hover:-translate-y-0.5`}>
      {content}
    </Link>
  )
}

export function AdminStatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FFF2E7] text-[#E36F2C]'
      }`}
    >
      {ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {label}
    </span>
  )
}
