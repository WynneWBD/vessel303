import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import ProductAttributeManagerClient from '@/components/admin/ProductAttributeManagerClient'
import {
  countCatalogProductsByStatus,
  countDeletedCatalogProducts,
  listProductAttributeTemplatesWithOptions,
} from '@/lib/product-catalog-db'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CircleDashed,
  FileText,
  Layers3,
  ListChecks,
  Package,
  Plus,
  SearchCheck,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '产品属性模板 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type AttributeSummary = {
  products: number
  draft: number
  deleted: number
  templates: number
  options: number
  visibleTemplates: number
  hiddenTemplates: number
  emptyTemplates: number
  hiddenOptions: number
}

type GovernanceCard = {
  label: string
  value: string
  detail: string
  href: string
  cta: string
  tone: 'blue' | 'green' | 'orange' | 'gray'
  Icon: LucideIcon
}

function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

function getSideNavGroups(summary: AttributeSummary): AdminSideNavGroup[] {
  return [
    {
      title: '内容运营',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', badge: summary.products, Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'drafts', label: '草稿内容', href: '/admin/content/products/list?status=draft', badge: summary.draft, Icon: FileText },
        { key: 'todo', label: '待补内容', href: '/admin/content/products/list?view=incomplete', Icon: CircleDashed },
      ],
    },
    {
      title: '产品治理',
      items: [
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', badge: summary.templates, Icon: SlidersHorizontal },
        { key: 'attribute-readiness', label: '筛选准备', href: '#attribute-filter-readiness-desk', Icon: SearchCheck },
        { key: 'batch-governance', label: '批量治理', href: '/admin/content/products/list#product-batch-governance', Icon: ListChecks },
        { key: 'recycle', label: '产品回收站', href: '/admin/content/products/recycle', badge: summary.deleted, Icon: Archive },
      ],
    },
  ]
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    console.error(`[admin-content-products-attributes] ${label} failed`, err)
    return fallback
  }
}

export default async function AdminContentProductAttributesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [templates, statusCounts, deleted] = await Promise.all([
    safeLoad('product attribute templates', () => listProductAttributeTemplatesWithOptions({ includeHidden: true }), []),
    safeLoad('product status counts', countCatalogProductsByStatus, { total: 0, draft: 0, published: 0 }),
    safeLoad('deleted product count', countDeletedCatalogProducts, 0),
  ])

  const summary: AttributeSummary = {
    products: statusCounts.total,
    draft: statusCounts.draft,
    deleted,
    templates: templates.length,
    options: templates.reduce((sum, template) => sum + template.options.length, 0),
    visibleTemplates: templates.filter((template) => template.status === 'visible').length,
    hiddenTemplates: templates.filter((template) => template.status === 'hidden').length,
    emptyTemplates: templates.filter((template) => template.options.length === 0).length,
    hiddenOptions: templates.reduce((sum, template) => (
      sum + template.options.filter((option) => option.status === 'hidden').length
    ), 0),
  }
  const adminRole: AdminRole = role

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品属性模板"
      description="维护产品属性组和选项，为后台筛选和后续前台筛选打底。"
      sideNavGroups={getSideNavGroups(summary)}
      activeItem="attributes"
    >
      <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#E7F7F8_0%,#F7FAFA_58%,#FFF2E7_100%)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <Link
              href="/admin/content/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1889B6] transition hover:text-[#E36F2C]"
            >
              <ArrowLeft size={15} />
              返回产品管理
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-[#1E2C31] md:text-4xl">产品属性模板</h1>
              <span className="inline-flex h-7 items-center rounded-full bg-[#FFF2E7] px-3 text-xs font-semibold text-[#E36F2C]">
                筛选基础
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61767D]">
              对照产品管理的属性模板能力，先建立产品属性组和选项；价格、订单和权限在对应业务模块处理。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/content/products/list"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D8E7E8] bg-white px-3 text-sm font-semibold text-[#1E2C31] transition hover:border-[#E36F2C]/55 hover:text-[#E36F2C]"
            >
              <ListChecks size={16} />
              产品列表
            </Link>
            <Link
              href="/admin/content/products/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E36F2C] px-3 text-sm font-semibold text-white transition hover:bg-[#C95E22]"
            >
              <Plus size={16} />
              新增产品
            </Link>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SummaryCard title="属性模板" value={summary.templates} detail={`可见 ${formatNumber(summary.visibleTemplates)} / 隐藏 ${formatNumber(summary.hiddenTemplates)}`} />
          <SummaryCard title="属性选项" value={summary.options} detail={`隐藏 ${formatNumber(summary.hiddenOptions)}`} />
          <SummaryCard title="产品总数" value={summary.products} detail={`草稿 ${formatNumber(summary.draft)}`} />
          <SummaryCard title="回收站" value={summary.deleted} detail="不参与属性补齐" tone="orange" />
        </div>
      </section>

      <AttributeGovernancePanel summary={summary} />
      <AttributeFilterReadinessPanel summary={summary} />

      <div id="attribute-manager" className="scroll-mt-24">
        <ProductAttributeManagerClient initialTemplates={templates} />
      </div>
    </AdminSectionShell>
  )
}

function AttributeGovernancePanel({ summary }: { summary: AttributeSummary }) {
  const cards: GovernanceCard[] = [
    {
      label: '模板覆盖',
      value: formatNumber(summary.visibleTemplates),
      detail: `当前可见模板 ${formatNumber(summary.visibleTemplates)} 个，支撑后台产品属性和前台产品筛选基础。`,
      href: '#attribute-manager',
      cta: '维护模板',
      tone: summary.visibleTemplates > 0 ? 'green' : 'orange',
      Icon: SlidersHorizontal,
    },
    {
      label: '空模板风险',
      value: formatNumber(summary.emptyTemplates),
      detail: '空模板会让运营误以为已有筛选项，但产品无法真正选择属性。',
      href: '#attribute-manager',
      cta: '补选项',
      tone: summary.emptyTemplates > 0 ? 'orange' : 'green',
      Icon: CircleDashed,
    },
    {
      label: '缺属性产品',
      value: '队列',
      detail: '回到产品列表只看缺属性产品，再使用批量分类、标记和单品表单补齐。',
      href: '/admin/content/products/list?view=incomplete&issue=attributes',
      cta: '查看缺口',
      tone: 'blue',
      Icon: SearchCheck,
    },
    {
      label: '批量治理',
      value: formatNumber(summary.products),
      detail: '把属性模板维护接回产品列表批量治理工作台，形成“模板 - 产品 - 公开筛选”的运营路径。',
      href: '/admin/content/products/list#product-batch-governance',
      cta: '打开治理台',
      tone: 'blue',
      Icon: ListChecks,
    },
  ]

  return (
    <section id="attribute-governance" className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-l-4 border-[#1889B6] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#1889B6]">属性治理</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">属性模板与产品筛选</h2>
          <p className="mt-1 text-sm leading-6 text-[#61767D]">
            属性模板先服务后台产品录入和列表筛选，再沉淀成前台产品目录的筛选基础。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products/list?view=incomplete&issue=attributes"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <SearchCheck size={13} />
            缺属性产品
          </Link>
          <Link
            href="/admin/content/products/list#product-batch-governance"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#1889B6] px-3 text-xs font-semibold text-white transition hover:bg-[#126D91]"
          >
            <ListChecks size={13} />
            批量治理
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-[#E6EEEE] bg-[#FBFDFD] md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <GovernanceLinkCard key={card.label} card={card} />
        ))}
      </div>
    </section>
  )
}

function AttributeFilterReadinessPanel({ summary }: { summary: AttributeSummary }) {
  const templateReady = summary.visibleTemplates > 0
  const optionReady = summary.options > 0 && summary.emptyTemplates === 0
  const hiddenRiskCount = summary.hiddenTemplates + summary.hiddenOptions
  const publishReady = templateReady && optionReady
  const readyScore = [templateReady, optionReady, hiddenRiskCount === 0].filter(Boolean).length
  const cards: GovernanceCard[] = [
    {
      label: '新建准备',
      value: `${readyScore}/3`,
      detail: '回到新建产品前的线索反馈与内容准备区，把属性模板作为创建草稿前的筛选底座。',
      href: '/admin/content/products/new#new-product-lead-feedback-desk',
      cta: '打开新建准备',
      tone: publishReady ? 'green' : 'orange',
      Icon: Plus,
    },
    {
      label: '缺属性产品',
      value: '队列',
      detail: '从产品列表筛出缺属性产品，先补影响公开筛选和买家判断的核心型号。',
      href: '/admin/content/products/list?view=incomplete&issue=attributes',
      cta: '查看产品缺口',
      tone: 'blue',
      Icon: SearchCheck,
    },
    {
      label: '分类联动',
      value: '分类',
      detail: '分类解决目录入口，属性解决筛选维度；两者一起决定新产品能否被运营快速归档。',
      href: '/admin/content/products/categories#category-governance',
      cta: '打开分类检查',
      tone: 'blue',
      Icon: Tags,
    },
    {
      label: '筛选组',
      value: 'filters',
      detail: '属性模板稳定后再进入筛选管理，把模板组合成公开产品目录的筛选组。',
      href: '/admin/content/products/filters',
      cta: '打开筛选管理',
      tone: templateReady ? 'green' : 'gray',
      Icon: SlidersHorizontal,
    },
  ]
  const workflow = [
    {
      label: '01 先确认可见模板',
      detail: templateReady
        ? `当前可见模板 ${formatNumber(summary.visibleTemplates)} 个，可作为新产品属性底座。`
        : '还没有可见属性模板，先在下方管理器建立可被运营选择的模板。',
      href: '#attribute-manager',
      Icon: SlidersHorizontal,
      primary: !templateReady,
    },
    {
      label: '02 再补空模板选项',
      detail: summary.emptyTemplates > 0
        ? `当前有 ${formatNumber(summary.emptyTemplates)} 个空模板，容易让运营以为已有筛选但实际不可选。`
        : '当前没有空模板风险，可以继续检查隐藏模板和隐藏选项。',
      href: '#attribute-manager',
      Icon: CircleDashed,
      primary: summary.emptyTemplates > 0,
    },
    {
      label: '03 回新建页填写属性',
      detail: '新建产品前先看线索反馈，再进入产品属性区选择模板和选项。',
      href: '/admin/content/products/new#attributes',
      Icon: Plus,
      primary: false,
    },
    {
      label: '04 回列表处理缺口',
      detail: '发布前回到产品列表缺属性队列，优先处理已发布或高转化产品。',
      href: '/admin/content/products/list?view=incomplete&issue=attributes',
      Icon: ListChecks,
      primary: false,
    },
  ]

  return (
    <section
      id="attribute-filter-readiness-desk"
      data-attribute-filter-readiness="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] bg-[#FBFDFD] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.08em] text-[#E36F2C]">Attribute Readiness</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">属性模板到新建产品筛选准备</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#61767D]">
            汇总新建产品准备、内容补齐、分类联动和筛选组状态，帮助运营确认模板是否可用于产品录入。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content/products/new#new-product-lead-feedback-desk"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#E36F2C] px-3 text-xs font-semibold text-white transition hover:bg-[#C95D22]"
          >
            <Plus size={13} />
            新建准备
          </Link>
          <Link
            href="/admin/content/products/list?view=incomplete&issue=attributes"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#1889B6] hover:bg-[#F0F7F8]"
          >
            <SearchCheck size={13} />
            缺属性产品
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#E6EEEE] bg-[#F7FAFA] md:grid-cols-4">
        <AttributeReadinessMetric label="可见模板" value={summary.visibleTemplates} detail={`总模板 ${formatNumber(summary.templates)}`} tone={templateReady ? 'green' : 'orange'} />
        <AttributeReadinessMetric label="属性选项" value={summary.options} detail={`空模板 ${formatNumber(summary.emptyTemplates)}`} tone={optionReady ? 'green' : 'orange'} />
        <AttributeReadinessMetric label="隐藏风险" value={hiddenRiskCount} detail={`模板 ${formatNumber(summary.hiddenTemplates)} / 选项 ${formatNumber(summary.hiddenOptions)}`} tone={hiddenRiskCount > 0 ? 'orange' : 'green'} />
        <AttributeReadinessMetric label="准备得分" value={readyScore} detail="模板/选项/可见性" tone={publishReady ? 'green' : 'orange'} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_390px] lg:divide-x lg:divide-y-0">
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {cards.map((card) => (
            <GovernanceLinkCard key={card.label} card={card} />
          ))}
        </div>

        <aside className="bg-[#FBFDFD]">
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <h3 className="text-sm font-bold text-[#1E2C31]">属性准备动作顺序</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              先保证模板和选项可用，再回新建页和产品列表补齐具体产品。
            </p>
          </div>
          <div className="divide-y divide-[#E6EEEE]">
            {workflow.map((step) => {
              const Icon = step.Icon
              return (
                <Link
                  key={step.label}
                  href={step.href}
                  className={`block px-5 py-4 transition ${step.primary ? 'bg-[#FFF7F0] hover:bg-[#FFF2E7]' : 'hover:bg-[#F0F7F8]'}`}
                >
                  <span className="flex gap-3">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${step.primary ? 'bg-[#E36F2C] text-white' : 'bg-white text-[#1889B6]'}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#1E2C31]">{step.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#61767D]">{step.detail}</span>
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </aside>
      </div>
    </section>
  )
}

function GovernanceLinkCard({ card }: { card: GovernanceCard }) {
  const Icon = card.Icon
  const toneClass =
    card.tone === 'green'
      ? 'text-emerald-700'
      : card.tone === 'orange'
        ? 'text-[#E36F2C]'
        : card.tone === 'gray'
          ? 'text-[#61767D]'
          : 'text-[#1889B6]'

  return (
    <Link
      href={card.href}
      className="group min-h-[148px] border-b border-[#E6EEEE] px-4 py-4 transition hover:bg-white md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-xs font-bold tracking-[0.08em] text-[#8A9EA4]">{card.label}</span>
          <span className={`mt-2 block text-2xl font-bold ${toneClass}`}>{card.value}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D8E7E8] bg-white text-[#1889B6] transition group-hover:border-[#1889B6]">
          <Icon size={16} />
        </span>
      </span>
      <span className="mt-3 block min-h-10 text-xs leading-5 text-[#61767D]">{card.detail}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6]">
        {card.cta}
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function AttributeReadinessMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: number
  detail: string
  tone: 'green' | 'orange'
}) {
  return (
    <div className="border-b border-r border-[#E6EEEE] p-4 last:border-r-0 md:border-b-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone === 'green' ? 'text-emerald-700' : 'text-[#E36F2C]'}`}>
        {formatNumber(value)}
      </p>
      <p className="mt-1 truncate text-xs text-[#8A9EA4]" title={detail}>{detail}</p>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  detail,
  tone = 'blue',
}: {
  title: string
  value: number
  detail: string
  tone?: 'blue' | 'orange'
}) {
  return (
    <div className="rounded-md border border-white/70 bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#61767D]">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${tone === 'orange' ? 'text-[#E36F2C]' : 'text-[#1889B6]'}`}>
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}
