import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProjectForm from '@/components/admin/ProjectForm'
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  ImageIcon,
  Layers3,
  ListChecks,
  MapPinned,
  Pencil,
  Plus,
  SearchCheck,
  Settings2,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新建项目案例 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type EditSection = {
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}

const EDIT_SECTIONS: EditSection[] = [
  {
    key: 'basic',
    title: '基础信息',
    detail: '名称、地点、类型、维护字段',
    href: '#basic',
    Icon: Pencil,
  },
  {
    key: 'media',
    title: '图片素材',
    detail: '封面、图库、图片 URL',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'content',
    title: '案例内容',
    detail: '简介、标签、正式展示内容',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'params',
    title: '项目参数',
    detail: '面积、投资、数量、产品型号',
    href: '#params',
    Icon: Settings2,
  },
  {
    key: 'global-info',
    title: 'Global 入图信息',
    detail: '坐标、国家、地图展示资料',
    href: '#global',
    Icon: MapPinned,
  },
  {
    key: 'publish-check',
    title: '发布检查',
    detail: '状态、完整度、展示影响',
    href: '#publish-check',
    Icon: SearchCheck,
  },
]

function getSideNavGroups(): AdminSideNavGroup[] {
  return [
    {
      title: '内容管理',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'projects', label: '项目案例', href: '/admin/content/projects', Icon: MapPinned },
        { key: 'project-list', label: '项目列表', href: '/admin/content/projects/list', Icon: ListChecks },
        { key: 'project-new', label: '新建项目', href: '/admin/content/projects/new', Icon: Plus },
      ],
    },
    {
      title: '编辑分区',
      items: EDIT_SECTIONS.map((section) => ({
        key: section.key,
        label: section.title,
        href: section.href,
        Icon: section.Icon,
      })),
    },
    {
      title: '后续规划',
      items: [
        { key: 'taxonomy', label: '分类与标签', planned: true, Icon: Tags },
        { key: 'lead-cta', label: '询盘入口接线索', planned: true, Icon: FileText },
      ],
    },
  ]
}

function Hero() {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E4F6F0_0%,#F4FBFC_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/content/projects/list"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]"
          >
            <ArrowLeft size={15} />
            返回项目列表
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[#1E2C31] md:text-4xl">新建项目案例</h1>
            <span className="inline-flex h-7 items-center rounded-full bg-[#FFF2E7] px-3 text-xs font-semibold text-[#E36F2C]">
              草稿
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            先创建正式项目案例草稿，再补齐图片、案例内容、项目参数和发布检查。Global 只是地图可视化展示渠道，不是项目案例详情页。
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard title="默认状态" value="草稿" />
        <InfoCard title="保存后去向" value="新版项目编辑页" />
        <InfoCard title="Global 入图" value="发布并填写有效坐标后才可展示" />
      </div>
    </section>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-white/70 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className="mt-2 text-sm font-bold text-[#1E2C31]">{value}</p>
    </div>
  )
}

function EditSectionGrid() {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {EDIT_SECTIONS.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          className="flex min-h-20 items-start gap-3 rounded-md border border-[#D8E7E8] bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF6F8] text-[#1889B6]">
            <section.Icon size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#1E2C31]">{section.title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#61767D]">{section.detail}</span>
          </span>
        </Link>
      ))}
    </section>
  )
}

function RiskNotice() {
  return (
    <section className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#E36F2C]">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#8A3F16]">保存前请确认必填内容</h2>
          <p className="mt-1 text-xs leading-5 text-[#8A3F16]">
            新建项目会写入项目案例数据。图片上传会立即进入媒体库，选择图片只回填表单，最终仍要保存项目才生效。坐标和 Global 字段只影响地图入图；发布后正式案例详情页归 /cases/[id]。
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentProjectNewPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="项目新建"
      description="创建项目案例草稿，并沿用项目案例编辑页的分区表单。"
      sideNavGroups={getSideNavGroups()}
      activeItem="project-new"
    >
      <Hero />
      <EditSectionGrid />
      <RiskNotice />
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
        <ProjectForm
          mode="create"
          backHref="/admin/content/projects/list"
          backLabel="返回项目列表"
          title="新建项目案例"
          createRedirectBase="/admin/content/projects"
          showPreviewLink={false}
        />
      </section>
    </AdminSectionShell>
  )
}
