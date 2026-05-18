import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  ArrowRight,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  Newspaper,
  Package,
  Settings,
  ShieldCheck,
  Wrench,
  MapPinned,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

type LegacyEntry = {
  title: string
  description: string
  href: string
  Icon: LucideIcon
  sensitive?: boolean
}

const legacyEntries: LegacyEntry[] = [
  {
    title: '产品维护',
    description: '旧产品 CMS 列表、新建、编辑、发布和下架。',
    href: '/admin/products',
    Icon: Package,
  },
  {
    title: '项目维护',
    description: '旧项目案例 CMS 列表、新建、编辑和地图资料维护。',
    href: '/admin/projects',
    Icon: MapPinned,
  },
  {
    title: '新闻维护',
    description: '旧新闻 CMS 列表、新建、编辑、发布和下架。',
    href: '/admin/news',
    Icon: Newspaper,
  },
  {
    title: '线索维护',
    description: '旧线索列表、筛选、详情和导出。',
    href: '/admin/leads',
    Icon: Inbox,
  },
  {
    title: '媒体维护',
    description: '旧媒体库、引用详情和上传入口。',
    href: '/admin/media',
    Icon: ImageIcon,
  },
  {
    title: '页面表单模式',
    description: '旧页面模块表单编辑器；日常页面运营优先使用可视化编辑。',
    href: '/admin/pages',
    Icon: LayoutTemplate,
    sensitive: true,
  },
  {
    title: '用户与权限',
    description: '后台账号、角色、身份标记和禁用状态。',
    href: '/admin/users',
    Icon: ShieldCheck,
    sensitive: true,
  },
  {
    title: '站点设置',
    description: 'site_settings、配置状态和最近操作记录。',
    href: '/admin/settings',
    Icon: Settings,
    sensitive: true,
  },
]

function LegacyCard({ entry }: { entry: LegacyEntry }) {
  const Icon = entry.Icon
  return (
    <Link
      href={entry.href}
      className="group block rounded-lg border border-[#E5DED4] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#E36F2C]/50 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F2ED] text-[#E36F2C]">
          <Icon size={18} />
        </span>
        <span
          className={`inline-flex min-h-6 items-center rounded-full border px-2 text-xs ${
            entry.sensitive
              ? 'border-[#E36F2C]/30 bg-[#E36F2C]/10 text-[#E36F2C]'
              : 'border-[#E5DED4] bg-[#FAF7F2] text-[#8A8580]'
          }`}
        >
          {entry.sensitive ? 'Admin only' : '维护入口'}
        </span>
      </div>
      <h2 className="mt-4 text-sm font-semibold text-[#2C2A28]">{entry.title}</h2>
      <p className="mt-2 min-h-10 text-xs leading-5 text-[#8A8580]">{entry.description}</p>
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#E36F2C]">
        进入旧维护页
        <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

export default async function LegacyAdminPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    redirect('/admin?error=forbidden')
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-[#E5DED4] bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#E36F2C]">
              <Wrench size={16} />
              Legacy maintenance
            </div>
            <h1
              className="mt-3 text-2xl font-bold text-[#2C2A28]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              旧后台维护入口
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#8A8580]">
              这里仅用于当前官网数据维护、排障和开发回溯。日常运营请优先回到新版 2.0 控制台。
              本页只是索引页，不迁移旧路由，也不触发任何保存、发布、上传或删除。
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#E36F2C] px-4 text-sm font-semibold text-[#E36F2C] transition hover:bg-[#E36F2C] hover:text-white"
          >
            返回 2.0 控制台
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {legacyEntries.map((entry) => (
          <LegacyCard key={entry.href} entry={entry} />
        ))}
      </section>
    </div>
  )
}
