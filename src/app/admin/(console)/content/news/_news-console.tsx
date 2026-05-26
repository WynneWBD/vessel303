import Link from 'next/link'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { pool } from '@/lib/db'
import {
  Archive,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ExternalLink,
  FileText,
  ImageIcon,
  Layers3,
  ListChecks,
  Newspaper,
  Plus,
  SearchCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

export type AdminRole = 'admin' | 'operator'

export type NewsStats = {
  total: number
  published: number
  draft: number
  deleted: number
  recent: number
  incomplete: number
  missingCover: number
  missingZhTitle: number
  missingEnTitle: number
  missingZhExcerpt: number
  missingEnExcerpt: number
  missingZhContent: number
  missingEnContent: number
}

type NewsStatsRow = Record<keyof NewsStats, string>

export const EMPTY_NEWS_STATS: NewsStats = {
  total: 0,
  published: 0,
  draft: 0,
  deleted: 0,
  recent: 0,
  incomplete: 0,
  missingCover: 0,
  missingZhTitle: 0,
  missingEnTitle: 0,
  missingZhExcerpt: 0,
  missingEnExcerpt: 0,
  missingZhContent: 0,
  missingEnContent: 0,
}

const EMPTY_NEWS_CONTENT_SQL = `(
  {column} IS NULL
  OR {column} IN (
    '{}'::jsonb,
    '[]'::jsonb,
    'null'::jsonb,
    '{"type":"doc","content":[]}'::jsonb
  )
)`

const MISSING_ZH_CONTENT_SQL = EMPTY_NEWS_CONTENT_SQL.replaceAll('{column}', 'content_zh')
const MISSING_EN_CONTENT_SQL = EMPTY_NEWS_CONTENT_SQL.replaceAll('{column}', 'content_en')

const NEWS_INCOMPLETE_SQL = `(
  NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(title_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(title_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(excerpt_zh, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(excerpt_en, '')), '') IS NULL
  OR ${MISSING_ZH_CONTENT_SQL}
  OR ${MISSING_EN_CONTENT_SQL}
)`

const ACTIVE_NEWS_SQL = 'deleted_at IS NULL'

function parseCount(value: string | undefined): number {
  return parseInt(value ?? '0', 10)
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

export async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content-news] ${label} failed`, err)
    return fallback
  }
}

export async function getNewsStats(): Promise<NewsStats> {
  if (!(await tableExists('public.news'))) return EMPTY_NEWS_STATS

  const res = await pool.query<NewsStatsRow>(
    `SELECT
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL})::text AS total,
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND status = 'published')::text AS published,
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND status = 'draft')::text AS draft,
       COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::text AS deleted,
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND created_at >= NOW() - INTERVAL '30 days')::text AS recent,
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND ${NEWS_INCOMPLETE_SQL})::text AS incomplete,
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND NULLIF(BTRIM(COALESCE(cover_image_url, '')), '') IS NULL)::text AS "missingCover",
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND NULLIF(BTRIM(COALESCE(title_zh, '')), '') IS NULL)::text AS "missingZhTitle",
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND NULLIF(BTRIM(COALESCE(title_en, '')), '') IS NULL)::text AS "missingEnTitle",
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND NULLIF(BTRIM(COALESCE(excerpt_zh, '')), '') IS NULL)::text AS "missingZhExcerpt",
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND NULLIF(BTRIM(COALESCE(excerpt_en, '')), '') IS NULL)::text AS "missingEnExcerpt",
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND ${MISSING_ZH_CONTENT_SQL})::text AS "missingZhContent",
       COUNT(*) FILTER (WHERE ${ACTIVE_NEWS_SQL} AND ${MISSING_EN_CONTENT_SQL})::text AS "missingEnContent"
     FROM news`,
  )
  const row = res.rows[0]

  return {
    total: parseCount(row?.total),
    published: parseCount(row?.published),
    draft: parseCount(row?.draft),
    deleted: parseCount(row?.deleted),
    recent: parseCount(row?.recent),
    incomplete: parseCount(row?.incomplete),
    missingCover: parseCount(row?.missingCover),
    missingZhTitle: parseCount(row?.missingZhTitle),
    missingEnTitle: parseCount(row?.missingEnTitle),
    missingZhExcerpt: parseCount(row?.missingZhExcerpt),
    missingEnExcerpt: parseCount(row?.missingEnExcerpt),
    missingZhContent: parseCount(row?.missingZhContent),
    missingEnContent: parseCount(row?.missingEnContent),
  }
}

export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

export function getNewsSideNavGroups(stats: NewsStats): AdminSideNavGroup[] {
  return [
    {
      title: '内容管理',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'news', label: '新闻资讯', href: '/admin/content/news', badge: stats.total, Icon: Newspaper },
        { key: 'news-list', label: '新闻列表', href: '/admin/content/news/list', Icon: ListChecks },
        { key: 'news-new', label: '新建新闻', href: '/admin/content/news/new', Icon: Plus },
      ],
    },
    {
      title: '新闻运营',
      items: [
        { key: 'published', label: '已发布', href: '/admin/content/news/list?status=published', badge: stats.published, Icon: CheckCircle2 },
        { key: 'drafts', label: '草稿内容', href: '/admin/content/news/list?status=draft', badge: stats.draft, Icon: FileText },
        { key: 'incomplete', label: '待补内容', href: '#todo', badge: stats.incomplete, Icon: CircleDashed },
        { key: 'front-news', label: '查看前台新闻', href: '/news', Icon: ExternalLink },
      ],
    },
    {
      title: 'B3-3 规划',
      items: [
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/news/categories', Icon: Tags },
        { key: 'recycle', label: '新闻回收站', href: '/admin/content/news/recycle', badge: stats.deleted, Icon: Archive },
        { key: 'scheduled', label: '定时发布', planned: true, Icon: Clock3 },
        { key: 'seo', label: 'SEO 字段治理', planned: true, Icon: SearchCheck },
      ],
    },
  ]
}

export function NewsConsoleShell({
  role,
  email,
  stats,
  activeItem,
  children,
}: {
  role: AdminRole
  email?: string | null
  stats: NewsStats
  activeItem: string
  children: ReactNode
}) {
  return (
    <AdminSectionShell
      topNavActive="content"
      role={role}
      email={email}
      title="新闻资讯"
      description="维护新闻标题、封面、正文、预览和发布状态。"
      sideNavGroups={getNewsSideNavGroups(stats)}
      activeItem={activeItem}
    >
      {children}
    </AdminSectionShell>
  )
}

export function PrimaryAction({
  href,
  Icon,
  label,
  primary = false,
}: {
  href: string
  Icon: LucideIcon
  label: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
        primary
          ? 'bg-[#E36F2C] text-white shadow-sm hover:bg-[#C95E22]'
          : 'border border-[#D8E7E8] bg-white text-[#1E2C31] hover:border-[#E36F2C]/55 hover:text-[#E36F2C]'
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  )
}

export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E2C31]">{title}</h2>
      {detail && <p className="mt-1 text-sm text-[#61767D]">{detail}</p>}
    </div>
  )
}

export function TodoMetric({
  title,
  detail,
  count,
  Icon,
}: {
  title: string
  detail: string
  count: number
  Icon: LucideIcon
}) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
      <span className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#FFF2E7] text-[#E36F2C]">
          <Icon size={18} />
        </span>
        <span className="text-2xl font-bold text-[#1E2C31]">{formatNumber(count)}</span>
      </span>
      <h3 className="mt-4 text-sm font-bold text-[#1E2C31]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#61767D]">{detail}</p>
    </div>
  )
}

export const NEWS_EDIT_SECTIONS: Array<{
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}> = [
  {
    key: 'basic',
    title: '基础信息',
    detail: 'Slug、标题、发布状态',
    href: '#basic',
    Icon: FileText,
  },
  {
    key: 'taxonomy',
    title: '所属分类',
    detail: '分类字段已接入保存',
    href: '#taxonomy',
    Icon: Tags,
  },
  {
    key: 'media',
    title: '图片素材',
    detail: '封面图、图片库选择',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'content',
    title: '中英文正文',
    detail: '摘要、富文本正文',
    href: '#content',
    Icon: Newspaper,
  },
  {
    key: 'publish-check',
    title: '发布检查',
    detail: '完整度、预览和发布',
    href: '#publish-check',
    Icon: SearchCheck,
  },
]
