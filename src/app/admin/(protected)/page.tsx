import { auth } from '@/auth'
import { Users, Inbox, Newspaper, Image as ImageIcon, type LucideIcon } from 'lucide-react'

type StatCard = {
  Icon: LucideIcon
  label: string
  value: string
  footer: string
  footerColor: string
}

// TODO: 接真实数据
const stats: StatCard[] = [
  {
    Icon: Users,
    label: '总用户数',
    value: '128',
    footer: '+12 本月新增',
    footerColor: '#E36F2C',
  },
  {
    Icon: Inbox,
    label: '新线索',
    value: '24',
    footer: '18 待跟进',
    footerColor: '#E36F2C',
  },
  {
    Icon: Newspaper,
    label: '已发布新闻',
    value: '7',
    footer: '本月发布 2',
    footerColor: '#8A8580',
  },
  {
    Icon: ImageIcon,
    label: '图片资源',
    value: '1,484',
    footer: '已用 2.3 GB',
    footerColor: '#8A8580',
  },
]

export default async function AdminDashboard() {
  const session = await auth()
  const email = session?.user?.email ?? ''

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 28,
            color: '#F0F0F0',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome Admin
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[#0F0F0F] border border-[#2A2A2E] rounded-lg p-6"
          >
            <div className="flex items-center gap-2">
              <s.Icon size={16} style={{ color: '#8A8580' }} />
              <span style={{ color: '#8A8580', fontSize: 14 }}>{s.label}</span>
            </div>
            <div
              className="text-3xl font-bold text-white mt-3"
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
        // 后续这里加最近线索列表 / 注册趋势图 / 待办事项
      </p>
    </div>
  )
}
