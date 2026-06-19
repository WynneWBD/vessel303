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
import { VISUAL_EDITOR_HOME_HERO_HREF } from '@/lib/admin-visual-links'

export const dynamic = 'force-dynamic'

type LegacyEntry = {
  title: string
  description: string
  href: string
  Icon: LucideIcon
  cta: string
  sensitive?: boolean
}

const legacyEntries: LegacyEntry[] = [
  {
    title: '产品运营',
    description: '进入新版产品列表，处理完整度、分类、素材、SEO 和编辑复核。',
    href: '/admin/content/products/list',
    Icon: Package,
    cta: '进入产品运营',
  },
  {
    title: '项目案例',
    description: '进入新版项目列表，处理案例内容、Global 入图、转化承接和编辑复核。',
    href: '/admin/content/projects/list',
    Icon: MapPinned,
    cta: '进入项目运营',
  },
  {
    title: '新闻运营',
    description: '进入新版新闻列表，处理草稿、分类、SEO、定时复核和内容缺口。',
    href: '/admin/content/news/list',
    Icon: Newspaper,
    cta: '进入新闻运营',
  },
  {
    title: '线索处理',
    description: '进入客户线索台，按来源、状态、阶段和关键词处理跟进队列。',
    href: '/admin/customers/leads',
    Icon: Inbox,
    cta: '进入线索处理',
  },
  {
    title: '媒体库',
    description: '进入新版媒体库，处理素材搜索、引用详情、风险筛选和替换工作台。',
    href: '/admin/site/media',
    Icon: ImageIcon,
    cta: '进入媒体库',
  },
  {
    title: '可视化页面编辑',
    description: '进入 Visual Editor 首屏模块；固定表单模式只作为管理员低频备用。',
    href: VISUAL_EDITOR_HOME_HERO_HREF,
    Icon: LayoutTemplate,
    cta: '进入可视化编辑',
  },
  {
    title: '用户与权限',
    description: '后台账号、角色、身份标记和禁用状态。',
    href: '/admin/users',
    Icon: ShieldCheck,
    cta: '进入账号维护',
    sensitive: true,
  },
  {
    title: '站点设置',
    description: 'site_settings、配置状态和最近操作记录。',
    href: '/admin/settings',
    Icon: Settings,
    cta: '进入站点设置',
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
          {entry.sensitive ? 'Admin only' : '2.0 入口'}
        </span>
      </div>
      <h2 className="mt-4 text-sm font-semibold text-[#2C2A28]">{entry.title}</h2>
      <p className="mt-2 min-h-10 text-xs leading-5 text-[#8A8580]">{entry.description}</p>
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#E36F2C]">
        {entry.cta}
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
              Operations routing
            </div>
            <h1
              className="mt-3 text-2xl font-bold text-[#2C2A28]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              维护与兼容入口
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#8A8580]">
              这里把常用内容、线索、媒体和页面运营入口优先指向新版 2.0 控制台。旧路由仍保留作兼容和低频排障。
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
