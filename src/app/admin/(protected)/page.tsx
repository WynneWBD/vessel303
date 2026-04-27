import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { countUploads, sumStorageSize } from '@/lib/uploads-db'
import { countNewsByStatus } from '@/lib/news-db'
import { Users, Inbox, Newspaper, Image as ImageIcon, type LucideIcon } from 'lucide-react'

function formatBytes(n: number): string {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export const dynamic = 'force-dynamic'

type StatCard = {
  Icon: LucideIcon
  label: string
  value: string
  footer: string
  footerColor: string
}

async function safeCount(sql: string, params: unknown[] = []): Promise<number> {
  try {
    const res = await pool.query<{ count: string }>(sql, params)
    return parseInt(res.rows[0]?.count ?? '0', 10)
  } catch (err) {
    console.error('[dashboard] count query failed', err)
    return 0
  }
}

export default async function AdminDashboard() {
  const session = await auth()
  const email = session?.user?.email ?? ''

  const [
    activeUserCount,
    adminCount,
    disabledCount,
    newLeadCount,
    newsSummary,
    uploadCount,
    uploadBytes,
  ] = await Promise.all([
    safeCount(`SELECT COUNT(*)::text AS count FROM users WHERE disabled = false`),
    safeCount(`SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin'`),
    safeCount(`SELECT COUNT(*)::text AS count FROM users WHERE disabled = true`),
    safeCount(
      `SELECT COUNT(*)::text AS count FROM leads WHERE status = 'new' AND deleted_at IS NULL`,
    ),
    countNewsByStatus().catch((err) => {
      console.error('[dashboard] countNewsByStatus failed', err)
      return null
    }),
    countUploads().catch(() => 0),
    sumStorageSize().catch(() => 0),
  ])

  const storageWarning = uploadBytes > 800 * 1024 * 1024

  const stats: StatCard[] = [
    {
      Icon: Users,
      label: '总用户数',
      value: activeUserCount.toLocaleString(),
      footer: `管理员 ${adminCount} · 已禁用 ${disabledCount}`,
      footerColor: '#8A8580',
    },
    {
      Icon: Inbox,
      label: '新线索',
      value: newLeadCount.toLocaleString(),
      footer: `${newLeadCount} 待跟进`,
      footerColor: '#E36F2C',
    },
    {
      Icon: Newspaper,
      label: '已发布新闻',
      value: newsSummary ? newsSummary.published.toLocaleString() : '—',
      footer: newsSummary
        ? newsSummary.draft > 0
          ? `草稿 ${newsSummary.draft} 篇`
          : '暂无草稿'
        : '数据获取失败',
      footerColor: newsSummary && newsSummary.draft > 0 ? '#E36F2C' : '#8A8580',
    },
    {
      Icon: ImageIcon,
      label: '图片资源',
      value: uploadCount.toLocaleString(),
      footer: `已用 ${formatBytes(uploadBytes)}`,
      footerColor: storageWarning ? '#E36F2C' : '#8A8580',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 28,
            color: '#2C2A28',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome Admin
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(44,42,40,0.55)' }}>{email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[#FFFFFF] border border-[#E5DED4] rounded-lg p-6"
          >
            <div className="flex items-center gap-2">
              <s.Icon size={16} style={{ color: '#8A8580' }} />
              <span style={{ color: '#8A8580', fontSize: 14 }}>{s.label}</span>
            </div>
            <div
              className="text-3xl font-bold text-[#2C2A28] mt-3"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {s.value}
            </div>
            <div className="mt-2" style={{ fontSize: 12, color: s.footerColor }}>
              {s.footer}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-[#8A8580] italic">
        后续这里加最近线索列表 / 注册趋势图 / 待办事项
      </p>
    </div>
  )
}
