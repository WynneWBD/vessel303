import Link from 'next/link'
import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { countLeadsByStatus } from '@/lib/leads-db'
import { countNewsByStatus } from '@/lib/news-db'
import { countUploads, sumStorageSize } from '@/lib/uploads-db'
import { getUserSummary, type UserSummary } from '@/lib/users-db'
import {
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  MapPinned,
  Newspaper,
  Package,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

type AdminRole = 'admin' | 'operator'

type StatusSummary = {
  draft: number
  published: number
  total: number
}

type WorkCard = {
  title: string
  value: string
  detail: string
  href: string
  Icon: LucideIcon
  tone?: 'default' | 'warning' | 'success'
}

type ConfigCheck = {
  label: string
  ok: boolean
}

const EMPTY_STATUS_SUMMARY: StatusSummary = {
  draft: 0,
  published: 0,
  total: 0,
}

const WARNING_BYTES = 800 * 1024 * 1024

function formatBytes(n: number): string {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

async function safeLoad<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[dashboard] ${label} failed`, err)
    return fallback
  }
}

async function countStatusByTable(label: 'products' | 'projects'): Promise<StatusSummary> {
  const table = label === 'products' ? 'product_catalog' : 'project_cases'
  const res = await pool.query<{ draft: string; published: string; total: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE status = 'published')::text AS published,
       COUNT(*)::text AS total
     FROM ${table}
     WHERE deleted_at IS NULL`,
  )

  return {
    draft: parseInt(res.rows[0]?.draft ?? '0', 10),
    published: parseInt(res.rows[0]?.published ?? '0', 10),
    total: parseInt(res.rows[0]?.total ?? '0', 10),
  }
}

function getConfigChecks(): ConfigCheck[] {
  return [
    { label: 'Auth Secret', ok: Boolean(process.env.AUTH_SECRET) },
    {
      label: 'Google OAuth',
      ok: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    },
    { label: 'Resend API', ok: Boolean(process.env.RESEND_API_KEY) },
    { label: 'Resend From', ok: Boolean(process.env.RESEND_FROM) },
    { label: 'Vercel Blob', ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
    { label: 'MapTiler Key', ok: Boolean(process.env.MAPTILER_KEY) },
  ]
}

function toneStyles(tone: WorkCard['tone']) {
  if (tone === 'warning') {
    return {
      iconBg: 'bg-[#E36F2C]/12',
      iconColor: 'text-[#E36F2C]',
      valueColor: 'text-[#E36F2C]',
    }
  }

  if (tone === 'success') {
    return {
      iconBg: 'bg-emerald-600/10',
      iconColor: 'text-emerald-700',
      valueColor: 'text-emerald-700',
    }
  }

  return {
    iconBg: 'bg-[#F5F2ED]',
    iconColor: 'text-[#8A8580]',
    valueColor: 'text-[#2C2A28]',
  }
}

function DashboardCard({ card }: { card: WorkCard }) {
  const styles = toneStyles(card.tone)

  return (
    <Link
      href={card.href}
      className="group block rounded-lg border border-[#E5DED4] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#E36F2C]/50 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${styles.iconBg}`}
        >
          <card.Icon size={18} className={styles.iconColor} />
        </div>
        <span className="text-xs font-medium text-[#C4B9AB] transition group-hover:text-[#E36F2C]">
          进入
        </span>
      </div>
      <div className="mt-5">
        <p className="text-sm text-[#8A8580]">{card.title}</p>
        <p
          className={`mt-2 text-3xl font-bold ${styles.valueColor}`}
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {card.value}
        </p>
        <p className="mt-2 text-xs leading-5 text-[#8A8580]">{card.detail}</p>
      </div>
    </Link>
  )
}

function ConfigStatusList({ items }: { items: ConfigCheck[] }) {
  return (
    <div className="rounded-lg border border-[#E5DED4] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#2C2A28]">系统配置提醒</h2>
          <p className="mt-1 text-xs text-[#8A8580]">
            只显示配置状态，不展示密钥、token 或环境变量值。
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="text-xs font-medium text-[#E36F2C] hover:underline"
        >
          查看设置
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-md border border-[#E5DED4] bg-[#FAF7F2] px-3 py-2"
          >
            <span className="text-sm text-[#2C2A28]">{item.label}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                item.ok
                  ? 'border-emerald-600/20 bg-emerald-600/10 text-emerald-700'
                  : 'border-[#E36F2C]/30 bg-[#E36F2C]/10 text-[#E36F2C]'
              }`}
            >
              {item.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {item.ok ? '已配置' : '需处理'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildUserStatusDetail(userSummary: UserSummary | null): string {
  if (!userSummary) return '用户统计读取失败'
  return `管理员 ${userSummary.admins} · 运营 ${userSummary.operators} · 禁用 ${userSummary.disabled}`
}

export default async function AdminDashboard() {
  const session = await auth()
  const email = session?.user?.email ?? ''
  const role: AdminRole = session?.user?.role === 'admin' ? 'admin' : 'operator'
  const isAdmin = role === 'admin'

  const [
    newLeadCount,
    newsSummary,
    productSummary,
    projectSummary,
    uploadCount,
    uploadBytes,
    userSummary,
  ] = await Promise.all([
    safeLoad('count new leads', () => countLeadsByStatus('new'), 0),
    safeLoad('count news', () => countNewsByStatus(), EMPTY_STATUS_SUMMARY),
    safeLoad('count products', () => countStatusByTable('products'), EMPTY_STATUS_SUMMARY),
    safeLoad('count projects', () => countStatusByTable('projects'), EMPTY_STATUS_SUMMARY),
    safeLoad('count uploads', () => countUploads(), 0),
    safeLoad('sum upload storage', () => sumStorageSize(), 0),
    isAdmin
      ? safeLoad<UserSummary | null>('user summary', () => getUserSummary(), null)
      : Promise.resolve(null),
  ])

  const configChecks = isAdmin ? getConfigChecks() : []
  const configIssues = configChecks.filter((item) => !item.ok).length

  const operationCards: WorkCard[] = [
    {
      title: '新线索',
      value: newLeadCount.toLocaleString(),
      detail: newLeadCount > 0 ? '待跟进线索' : '当前没有新线索',
      href: '/admin/leads?status=new',
      Icon: Inbox,
      tone: newLeadCount > 0 ? 'warning' : 'default',
    },
    {
      title: '草稿新闻',
      value: newsSummary.draft.toLocaleString(),
      detail: `已发布 ${newsSummary.published.toLocaleString()} 篇`,
      href: '/admin/news',
      Icon: Newspaper,
      tone: newsSummary.draft > 0 ? 'warning' : 'default',
    },
    {
      title: '草稿产品',
      value: productSummary.draft.toLocaleString(),
      detail: `已发布 ${productSummary.published.toLocaleString()} 个`,
      href: '/admin/products',
      Icon: Package,
      tone: productSummary.draft > 0 ? 'warning' : 'default',
    },
    {
      title: '草稿项目',
      value: projectSummary.draft.toLocaleString(),
      detail: `已发布 ${projectSummary.published.toLocaleString()} 个`,
      href: '/admin/projects',
      Icon: MapPinned,
      tone: projectSummary.draft > 0 ? 'warning' : 'default',
    },
    {
      title: '媒体库',
      value: uploadCount.toLocaleString(),
      detail: `已用 ${formatBytes(uploadBytes)}`,
      href: '/admin/media',
      Icon: ImageIcon,
      tone: uploadBytes > WARNING_BYTES ? 'warning' : 'default',
    },
    {
      title: '页面模块',
      value: '编辑',
      detail: '首页、关于我们等页面内容',
      href: '/admin/pages',
      Icon: LayoutTemplate,
    },
  ]

  const adminCards: WorkCard[] = isAdmin
    ? [
        {
          title: '用户状态',
          value: userSummary ? userSummary.total.toLocaleString() : '—',
          detail: buildUserStatusDetail(userSummary),
          href: '/admin/users',
          Icon: ShieldCheck,
          tone: userSummary && userSummary.untagged > 0 ? 'warning' : 'default',
        },
        {
          title: '用户管理',
          value: userSummary ? userSummary.untagged.toLocaleString() : '—',
          detail: '未标记用户与角色管理',
          href: '/admin/users',
          Icon: Users,
          tone: userSummary && userSummary.untagged > 0 ? 'warning' : 'default',
        },
        {
          title: '设置',
          value: '配置',
          detail: '站点设置、系统状态、白名单',
          href: '/admin/settings',
          Icon: Settings,
        },
        {
          title: '配置提醒',
          value: configIssues > 0 ? `${configIssues} 项` : '正常',
          detail: configIssues > 0 ? '有配置需要处理' : '关键配置已就绪',
          href: '/admin/settings',
          Icon: configIssues > 0 ? AlertTriangle : CheckCircle2,
          tone: configIssues > 0 ? 'warning' : 'success',
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-[#E36F2C]">
            Operation Workspace
          </p>
          <h1
            className="mt-2 text-[#2C2A28]"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: '-0.02em',
            }}
          >
            运营工作台
          </h1>
          <p className="mt-2 text-sm text-[#8A8580]">
            {isAdmin
              ? '管理员视图包含运营任务、用户状态和系统配置提醒。'
              : '运营视图只显示内容、线索和媒体相关入口。'}
          </p>
        </div>
        <div className="rounded-md border border-[#E5DED4] bg-white px-4 py-3 text-xs text-[#8A8580]">
          <span className="text-[#2C2A28]">{isAdmin ? '管理员' : '运营人员'}</span>
          <span className="mx-2 text-[#C4B9AB]">·</span>
          <span>{email}</span>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#2C2A28]">运营状态</h2>
            <p className="mt-1 text-xs text-[#8A8580]">
              常用内容和待处理项入口，点击卡片进入对应后台页面。
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {operationCards.map((card) => (
            <DashboardCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#2C2A28]">管理员视图</h2>
            <p className="mt-1 text-xs text-[#8A8580]">
              只对管理员显示用户管理、设置入口和配置状态。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {adminCards.map((card) => (
              <DashboardCard key={card.title} card={card} />
            ))}
          </div>
          <ConfigStatusList items={configChecks} />
        </section>
      )}
    </div>
  )
}
