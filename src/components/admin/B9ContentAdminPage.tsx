import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import B9ContentManager from '@/components/admin/B9ContentManager'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
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
  type B9ContentCategory,
  type B9ContentItem,
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
          <p className="mt-5 text-sm font-semibold text-[#1889B6]">固定内容管理</p>
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

function getB9PreviewHref(kind: B9ContentKind): string {
  if (kind === 'faq') return '/faq'
  if (kind === 'media_file') return '/media-kit'
  if (kind === 'scenario') return '/scenarios/tourism'
  if (kind === 'display_slide') return '/display'
  if (kind === 'innovation') return '/innovation/viie'
  return '/'
}

function isPubliclyRenderableB9Item(
  kind: B9ContentKind,
  item: B9ContentItem,
  visibleCategorySlugs: Set<string>,
): boolean {
  if (item.status !== 'published') return false
  if (kind === 'faq' && visibleCategorySlugs.size > 0) {
    return Boolean(item.category_slug && visibleCategorySlugs.has(item.category_slug))
  }
  if (kind === 'display_slide') return Boolean(item.cover_image_url?.trim())
  return true
}

function B9ReadinessPanel({
  copy,
  rows,
  categories,
  count,
}: {
  copy: B9AdminCopy
  rows: B9ContentItem[]
  categories: B9ContentCategory[]
  count: { draft: number; published: number; hidden: number }
}) {
  const previewHref = getB9PreviewHref(copy.kind)
  const visibleCategorySlugs = new Set(
    categories
      .filter((category) => category.status === 'visible')
      .map((category) => category.slug),
  )
  const renderableRows = rows.filter((item) => isPubliclyRenderableB9Item(copy.kind, item, visibleCategorySlugs))
  const publishedButNotRenderable = rows.filter((item) => (
    item.status === 'published' && !isPubliclyRenderableB9Item(copy.kind, item, visibleCategorySlugs)
  ))
  const fixedSlugMissing = copy.fixedSlugs?.filter((slug) => (
    !rows.some((item) => item.slug === slug && isPubliclyRenderableB9Item(copy.kind, item, visibleCategorySlugs))
  )) ?? []
  const hasBlockingIssue = renderableRows.length === 0 || fixedSlugMissing.length > 0
  const needsCategory = copy.allowCategories !== false && categories.length === 0
  const publishedCoverageDetail = publishedButNotRenderable.length > 0
    ? `${publishedButNotRenderable.length} 条 published 缺少前台必要字段，可能不会展示。`
    : renderableRows.length > 0
      ? '前台可读取并展示 published 内容。'
      : '没有前台可见内容时，前台会显示空状态或静态兜底。'

  return (
    <section className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {hasBlockingIssue ? (
              <AlertTriangle size={18} className="text-[#E36F2C]" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-600" />
            )}
            <h2 className="text-xl font-bold text-[#1E2C31]">发布就绪与下一步动作</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            固定内容只展示 published；草稿和 hidden 不进入前台。先处理阻断项，再打开前台复验。
          </p>
        </div>
        <Link
          href={previewHref}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1E2C31] transition hover:border-[#1889B6]/60 hover:text-[#1889B6]"
        >
          <Eye size={14} />
          前台预览
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ReadinessAction
          title="前台可见覆盖"
          value={renderableRows.length > 0 ? `${renderableRows.length} 条` : '0 条'}
          detail={publishedCoverageDetail}
          href={renderableRows.length > 0 ? previewHref : '#b9-content-workbench'}
          actionLabel={renderableRows.length > 0 ? '打开前台' : '补齐并发布'}
          tone={renderableRows.length > 0 && publishedButNotRenderable.length === 0 ? 'green' : 'orange'}
        />
        <ReadinessAction
          title="草稿收口"
          value={`${count.draft} 条`}
          detail={count.draft > 0 ? '草稿需要决定发布、继续补齐或保留内部。' : '暂无草稿积压。'}
          href="#b9-content-workbench"
          actionLabel={count.draft > 0 ? '查看草稿' : '进入列表'}
          tone={count.draft > 0 ? 'orange' : 'green'}
        />
        <ReadinessAction
          title="固定 slug"
          value={copy.fixedSlugs?.length ? `${copy.fixedSlugs.length - fixedSlugMissing.length}/${copy.fixedSlugs.length}` : '不限制'}
          detail={fixedSlugMissing.length > 0 ? `待发布：${fixedSlugMissing.join(' / ')}` : '固定路径覆盖正常。'}
          href="#b9-content-workbench"
          actionLabel="检查 slug"
          tone={fixedSlugMissing.length > 0 ? 'orange' : 'green'}
        />
        <ReadinessAction
          title="分类状态"
          value={copy.allowCategories === false ? '不使用' : `${categories.length} 个`}
          detail={needsCategory ? '当前没有分类，FAQ 等页面会按未分类列表展示。' : '分类配置可用于前台分组或后台筛选。'}
          href="#b9-content-workbench"
          actionLabel={needsCategory ? '创建分类' : '查看分类'}
          tone={needsCategory ? 'blue' : 'green'}
        />
      </div>
    </section>
  )
}

function ReadinessAction({
  title,
  value,
  detail,
  href,
  actionLabel,
  tone,
}: {
  title: string
  value: string
  detail: string
  href: string
  actionLabel: string
  tone: 'orange' | 'green' | 'blue'
}) {
  const toneClass =
    tone === 'orange'
      ? 'border-orange-100 bg-orange-50 text-orange-700'
      : tone === 'blue'
        ? 'border-[#D8E7E8] bg-[#F7FAFA] text-[#1889B6]'
        : 'border-emerald-100 bg-emerald-50 text-emerald-700'

  return (
    <div className={`rounded-md border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-2 min-h-10 text-xs leading-5">{detail}</p>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-bold hover:underline">
        {actionLabel}
        <ArrowRight size={13} />
      </Link>
    </div>
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
      <B9ReadinessPanel copy={copy} rows={rows} categories={categories} count={count} />
      <div id="b9-content-workbench">
        <B9ContentManager
          kind={copy.kind}
          initialRows={rows}
          initialCategories={categories}
          allowCategories={copy.allowCategories}
          fixedSlugs={copy.fixedSlugs}
        />
      </div>
    </AdminSectionShell>
  )
}
