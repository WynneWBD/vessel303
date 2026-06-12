import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import ProjectForm from '@/components/admin/ProjectForm'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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

type CaseInquiryCreationCheckpoint = {
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

const CASE_INQUIRY_CREATION_CHECKPOINTS: CaseInquiryCreationCheckpoint[] = [
  {
    key: 'identity',
    title: '先定案例身份',
    detail: '名称、位置、类型和案例 ID 决定保存后的编辑入口与公开路径。',
    href: '#basic',
    Icon: Pencil,
  },
  {
    key: 'proof',
    title: '先补证明素材',
    detail: '封面和图库会进入列表、详情首屏和咨询前信任判断。',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'context',
    title: '再补咨询上下文',
    detail: '简介、标签、面积、舱数和产品型号会影响销售理解来源需求。',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'publish',
    title: '最后复核发布影响',
    detail: '草稿没有 `/cases/{id}#case-inquiry`；发布后才进入前台咨询路径。',
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
        { key: 'case-inquiry-plan', label: '案例咨询承接', href: '#case-inquiry-plan', Icon: SearchCheck },
        { key: 'taxonomy', label: '分类与标签', planned: true, Icon: Tags },
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

function CaseInquiryCreationPlan() {
  return (
    <section id="case-inquiry-plan" className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1889B6]">Case Inquiry Creation Plan</p>
          <h2 className="mt-2 text-xl font-bold text-[#1E2C31]">创建前的案例咨询承接</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#61767D]">
            对齐编辑页和表单侧栏的“案例咨询承接”判断：新建阶段先保证保存后能进入正确编辑路径，再补齐发布后支撑 `/cases/[id]#case-inquiry` 的内容。这里不新增保存限制。
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-[#F2C6A7] bg-[#FFF7F0] px-3 py-1 text-xs font-bold text-[#E36F2C]">
          草稿阶段无前台咨询锚点
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {CASE_INQUIRY_CREATION_CHECKPOINTS.map((checkpoint, index) => (
          <Link
            key={checkpoint.key}
            href={checkpoint.href}
            className="min-h-36 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-4 transition hover:-translate-y-0.5 hover:border-[#1889B6]/55 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#1889B6]">
                <checkpoint.Icon size={17} />
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#61767D]">
                {index + 1}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-[#1E2C31]">{checkpoint.title}</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">{checkpoint.detail}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1889B6]">
              定位 <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} />
            保存后
          </div>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">进入新版项目编辑页，由 B210 的只读面板继续核查已保存数据。</p>
        </div>
        <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} />
            表单中
          </div>
          <p className="mt-1 text-xs leading-5 text-[#61767D]">由 B211 的右侧摘要按当前未保存输入实时判断咨询承接。</p>
        </div>
        <div className="rounded-md border border-[#F2C6A7] bg-[#FFF7F0] p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E36F2C]">
            <AlertTriangle size={14} />
            发布前
          </div>
          <p className="mt-1 text-xs leading-5 text-[#8A3F16]">只有保存并发布后，前台才会出现可核查的案例详情和咨询锚点。</p>
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
  const consoleMetrics: ProductEditorMetric[] = [
    {
      label: '默认状态',
      value: '草稿',
      detail: '保存后进入项目编辑页，发布前不会公开展示。',
      tone: 'ready',
    },
    {
      label: '编辑分区',
      value: EDIT_SECTIONS.length.toString(),
      detail: '基础、媒体、内容、参数、Global、发布检查。',
      tone: 'neutral',
    },
    {
      label: 'Global 入图',
      value: '受控',
      detail: '发布且坐标有效后才进入公开地图点位。',
      tone: 'warning',
    },
    {
      label: '公开案例',
      value: '未公开',
      detail: '创建草稿不会影响 /cases 和 /global。',
      tone: 'ready',
    },
    {
      label: '咨询承接',
      value: '待发布',
      detail: '保存并发布后才会出现案例咨询锚点。',
      tone: 'warning',
    },
  ]
  const consoleSignals: ProductEditorSignal[] = [
    {
      label: '新建会写入项目数据',
      detail: '点击保存后创建项目案例记录；发布仍由 ProjectForm 的状态字段和保存动作控制。',
      tone: 'warning',
      href: '#publish-check',
    },
    {
      label: '图片上传立即进入媒体库',
      detail: '选择图片只回填当前表单，最终仍需保存项目才生效。',
      tone: 'warning',
      href: '#media',
    },
    {
      label: 'Global 不是案例详情页',
      detail: 'Global 只做地图点位；正式案例内容、图库和叙事归 /cases/[id]。',
      tone: 'neutral',
      href: '#global',
    },
    {
      label: '先补正式展示再看入图',
      detail: '建议先补基础信息、封面图库、案例简介和项目参数，再填写坐标与地图资料。',
      tone: 'ready',
      href: '#basic',
    },
    {
      label: '案例咨询从创建质量开始',
      detail: '素材、叙事和项目事实会决定发布后的 /cases/[id]#case-inquiry 承接质量。',
      tone: 'warning',
      href: '#case-inquiry-plan',
    },
  ]

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
      <ProductEditorConsole
        title="新建项目案例任务台"
        description="先确认项目案例的创建边界、编辑顺序、图片保存、案例咨询承接和 Global 入图规则，再进入长表单填写。"
        sections={EDIT_SECTIONS}
        metrics={consoleMetrics}
        signals={consoleSignals}
      />
      <CaseInquiryCreationPlan />
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
