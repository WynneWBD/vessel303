import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import B9ContentManager from '@/components/admin/B9ContentManager'
import {
  FileArchive,
  FileQuestion,
  GalleryHorizontalEnd,
  Lightbulb,
  ListChecks,
  MapPinned,
  Newspaper,
  Package,
  Presentation,
  type LucideIcon,
} from 'lucide-react'
import {
  listB9ContentCategories,
  listB9ContentItems,
  type B9ContentKind,
} from '@/lib/b9-content-db'

type AdminRole = 'admin' | 'operator'

type B9AdminCopy = {
  title: string
  description: string
  activeItem: string
  kind: B9ContentKind
  allowCategories?: boolean
  fixedSlugs?: string[]
  heroTitle: string
  heroDetail: string
  Icon: LucideIcon
}

const CONTENT_NAV: AdminSideNavGroup[] = [
  {
    title: '核心内容',
    items: [
      { key: 'overview', label: '内容概览', href: '/admin/content', Icon: ListChecks },
      { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
      { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
      { key: 'news', label: '新闻资讯', href: '/admin/content/news', Icon: Newspaper },
    ],
  },
  {
    title: '固定内容 CMS',
    items: [
      { key: 'faq', label: 'FAQ', href: '/admin/content/faq', Icon: FileQuestion },
      { key: 'media-kit', label: '文件下载', href: '/admin/content/media-kit', Icon: FileArchive },
      { key: 'scenarios', label: '场景方案', href: '/admin/content/scenarios', Icon: Presentation },
      { key: 'display', label: 'Display 展示', href: '/admin/content/display', Icon: GalleryHorizontalEnd },
      { key: 'innovation', label: '技术专题', href: '/admin/content/innovation', Icon: Lightbulb },
    ],
  },
]

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[b9-content] ${label} failed`, err)
    return fallback
  }
}

function Hero({
  copy,
  count,
}: {
  copy: B9AdminCopy
  count: { draft: number; published: number; hidden: number }
}) {
  const Icon = copy.Icon
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#EAF6F8_0%,#FFFFFF_58%,#FFF3E7_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#1889B6] text-white">
            <Icon size={21} />
          </span>
          <p className="mt-5 text-sm font-semibold text-[#1889B6]">B9 固定内容 CMS</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1E2C31] md:text-4xl">{copy.heroTitle}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#61767D]">{copy.heroDetail}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
          <Metric label="草稿" value={count.draft} />
          <Metric label="已发布" value={count.published} tone="green" />
          <Metric label="隐藏" value={count.hidden} tone="muted" />
        </div>
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  tone = 'blue',
}: {
  label: string
  value: number
  tone?: 'blue' | 'green' | 'muted'
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'muted'
        ? 'bg-zinc-50 text-zinc-600'
        : 'bg-[#EAF6F8] text-[#1889B6]'
  return (
    <span className={`rounded-md border border-[#D8E7E8] p-4 ${toneClass}`}>
      <span className="block text-xs font-semibold">{label}</span>
      <span className="mt-1 block text-2xl font-bold">{value.toLocaleString('zh-CN')}</span>
    </span>
  )
}

export async function B9ContentAdminPage(copy: B9AdminCopy) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') redirect('/admin/login?error=unauthorized')

  const [{ rows }, categories] = await Promise.all([
    safeLoad(
      `${copy.kind} rows`,
      () => listB9ContentItems({ kind: copy.kind, status: 'all', limit: 100, offset: 0 }),
      { rows: [], total: 0 },
    ),
    safeLoad(`${copy.kind} categories`, () => listB9ContentCategories(copy.kind, true), []),
  ])
  const count = {
    draft: rows.filter((item) => item.status === 'draft').length,
    published: rows.filter((item) => item.status === 'published').length,
    hidden: rows.filter((item) => item.status === 'hidden').length,
  }

  return (
    <AdminSectionShell
      topNavActive="content"
      role={role as AdminRole}
      email={session.user.email}
      title={copy.title}
      description={copy.description}
      sideNavGroups={CONTENT_NAV}
      activeItem={copy.activeItem}
    >
      <Hero copy={copy} count={count} />
      <B9ContentManager
        kind={copy.kind}
        initialRows={rows}
        initialCategories={categories}
        allowCategories={copy.allowCategories}
        fixedSlugs={copy.fixedSlugs}
      />
    </AdminSectionShell>
  )
}
