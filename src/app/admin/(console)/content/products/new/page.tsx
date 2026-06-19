import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSectionShell, type AdminSideNavGroup } from '@/components/admin/AdminSectionShell'
import { AdminActionLink, AdminPageHero } from '@/components/admin/AdminUI'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import ProductForm from '@/components/admin/ProductForm'
import { defaultSiteSettings, normalizeMediaMaxUploadMb } from '@/lib/admin-settings-db'
import { pool } from '@/lib/db'
import { listCatalogProducts, listProductAttributeTemplatesWithOptions, listProductCategories } from '@/lib/product-catalog-db'
import { listProductBrands, listProductMarks, listProductShowcases } from '@/lib/product-operations-db'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  FileText,
  ImageIcon,
  Layers3,
  ListChecks,
  Package,
  Pencil,
  Plus,
  SearchCheck,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新建产品 - VESSEL' }

type AdminRole = 'admin' | 'operator'

type EditSection = {
  key: string
  title: string
  detail: string
  href: string
  Icon: LucideIcon
}

type NewProductClosureItem = {
  label: string
  value: string
  detail: string
  href: string
  Icon: LucideIcon
  tone: 'ready' | 'warning' | 'neutral'
}

const EDIT_SECTIONS: EditSection[] = [
  {
    key: 'basic',
    title: '基础信息',
    detail: '名称、系列、类型、代际、排序',
    href: '#basic',
    Icon: Pencil,
  },
  {
    key: 'seo',
    title: 'SEO 信息',
    detail: '搜索标题、搜索摘要',
    href: '#seo',
    Icon: SearchCheck,
  },
  {
    key: 'commercial',
    title: '商务条款',
    detail: '价格展示、300 风格贸易条款',
    href: '#commercial',
    Icon: FileText,
  },
  {
    key: 'relations',
    title: '关键词 / 关联产品',
    detail: '搜索关键词和关联推荐产品',
    href: '#relations',
    Icon: Tags,
  },
  {
    key: 'attributes',
    title: '产品属性',
    detail: '属性模板、筛选属性',
    href: '#attributes',
    Icon: SlidersHorizontal,
  },
  {
    key: 'media',
    title: '图片素材',
    detail: '封面图、图库、图片 URL',
    href: '#media',
    Icon: ImageIcon,
  },
  {
    key: 'content',
    title: '中英文内容',
    detail: '标签、亮点、简介',
    href: '#content',
    Icon: FileText,
  },
  {
    key: 'details',
    title: '详情内容',
    detail: '详情介绍、详情图库',
    href: '#details',
    Icon: Layers3,
  },
  {
    key: 'specs',
    title: '规格参数',
    detail: '中英文规格项',
    href: '#specs',
    Icon: Settings2,
  },
  {
    key: 'publish-check',
    title: '发布检查',
    detail: '状态、完整度、前台预览',
    href: '#publish-check',
    Icon: SearchCheck,
  },
]

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query<{ table_name: string | null }>('SELECT to_regclass($1) AS table_name', [tableName])
  return Boolean(res.rows[0]?.table_name)
}

async function getMediaMaxUploadMbReadOnly(): Promise<number> {
  if (!(await tableExists('public.site_settings'))) {
    return defaultSiteSettings.mediaMaxUploadMb
  }

  const res = await pool.query<{ value: unknown }>(
    `SELECT value
     FROM site_settings
     WHERE key = 'mediaMaxUploadMb'
     LIMIT 1`,
  )
  return normalizeMediaMaxUploadMb(res.rows[0]?.value ?? defaultSiteSettings.mediaMaxUploadMb)
}

function getSideNavGroups(): AdminSideNavGroup[] {
  return [
    {
      title: '内容管理',
      items: [
        { key: 'overview', label: '内容概览', href: '/admin/content', Icon: Layers3 },
        { key: 'products', label: '产品管理', href: '/admin/content/products', Icon: Package },
        { key: 'product-list', label: '产品列表', href: '/admin/content/products/list', Icon: ListChecks },
        { key: 'product-new', label: '新建产品', href: '/admin/content/products/new', Icon: Plus },
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
      title: '产品治理',
      items: [
        { key: 'new-product-closure', label: '新建预检', href: '#new-product-closure', Icon: BarChart3 },
        { key: 'new-product-lead-feedback', label: '线索反馈准备', href: '#new-product-lead-feedback-desk', Icon: ListChecks },
        { key: 'new-product-draft-approval', label: '草稿审批准备', href: '#new-product-draft-approval-desk', Icon: SearchCheck },
        { key: 'taxonomy', label: '分类管理', href: '/admin/content/products/categories', Icon: Tags },
        { key: 'attributes', label: '属性模板', href: '/admin/content/products/attributes', Icon: SlidersHorizontal },
        { key: 'publish-flow', label: '发布审核', planned: true, Icon: SearchCheck },
      ],
    },
  ]
}

function Hero() {
  return (
    <AdminPageHero
      kicker="产品管理"
      title="新建产品内容"
      description="先创建产品草稿，再补齐图片、中英文内容、详情模块和发布检查。"
      actions={<AdminActionLink href="/admin/content/products/list" Icon={ArrowLeft} label="返回产品列表" />}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard title="默认状态" value="草稿" />
        <InfoCard title="保存后去向" value="新版产品编辑页" />
        <InfoCard title="前台状态" value="保存前不会公开展示" />
      </div>
    </AdminPageHero>
  )
}

function closureToneClass(tone: NewProductClosureItem['tone']): string {
  if (tone === 'ready') return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  if (tone === 'warning') return 'border-[#F2C6A7] bg-[#FFF2E7] text-[#E36F2C]'
  return 'border-[#D8E7E8] bg-white text-[#61767D]'
}

function NewProductPreflightPanel({
  categories,
  attributeTemplates,
  relatedProductCount,
  maxUploadMb,
}: {
  categories: number
  attributeTemplates: number
  relatedProductCount: number
  maxUploadMb: number
}) {
  const items: NewProductClosureItem[] = [
    {
      label: '产品内容闭环',
      value: 'B233',
      detail: '创建前先看产品总览里的内容缺口、SEO 待补和路径承接。',
      href: '/admin/content/products#content-closure',
      Icon: Package,
      tone: 'neutral',
    },
    {
      label: '分类与筛选底座',
      value: `${categories}/${attributeTemplates}`,
      detail: '对照 en303 的分类、面积和国家筛选心智，先确认分类与属性模板可用。',
      href: categories > 0 && attributeTemplates > 0 ? '/admin/content/products/attributes' : '/admin/content/products/categories',
      Icon: SlidersHorizontal,
      tone: categories > 0 && attributeTemplates > 0 ? 'ready' : 'warning',
    },
    {
      label: '媒体准备',
      value: `${maxUploadMb} MB`,
      detail: '封面和图库会决定产品列表与详情页首屏质量；上传仍走媒体库。',
      href: '/admin/site/media#media-replacement-workbench',
      Icon: ImageIcon,
      tone: maxUploadMb > 0 ? 'ready' : 'warning',
    },
    {
      label: 'SEO 与关键词',
      value: '待填写',
      detail: '新建时同步准备 SEO 标题、摘要、关键词和关联产品。',
      href: '/admin/content/products/list?view=incomplete&issue=seo',
      Icon: Sparkles,
      tone: 'neutral',
    },
    {
      label: '产品路径分析',
      value: 'B232',
      detail: '上线后回到路径分析看产品访问、动作、表单和真实线索。',
      href: '/admin/status/traffic#product-conversion-path',
      Icon: BarChart3,
      tone: 'neutral',
    },
    {
      label: '关联推荐池',
      value: relatedProductCount.toString(),
      detail: '创建时可选择已发布产品做详情页继续浏览入口。',
      href: '/admin/content/products/list?status=published',
      Icon: Tags,
      tone: relatedProductCount > 0 ? 'ready' : 'neutral',
    },
  ]
  const prepLanes: NewProductClosureItem[] = [
    {
      label: '适配字段准备',
      value: categories > 0 && attributeTemplates > 0 ? '可用' : '待配置',
      detail: '先准备分类、属性、系列、面积和用途标签，避免保存后再反复补筛选字段。',
      href: categories > 0 && attributeTemplates > 0 ? '#attributes' : '/admin/content/products/attributes',
      Icon: SlidersHorizontal,
      tone: categories > 0 && attributeTemplates > 0 ? 'ready' : 'warning',
    },
    {
      label: '媒体证明准备',
      value: `${maxUploadMb} MB`,
      detail: '准备封面、图库和可追溯素材来源；上传仍走媒体库，表单只保存引用。',
      href: '#media',
      Icon: ImageIcon,
      tone: maxUploadMb > 0 ? 'ready' : 'warning',
    },
    {
      label: '详情证明准备',
      value: '文案/模块',
      detail: '创建前先备好中英文简介、亮点、规格、详情模块和买家资料结构。',
      href: '#details',
      Icon: Layers3,
      tone: 'neutral',
    },
    {
      label: '搜索入口准备',
      value: 'SEO',
      detail: '同步准备 SEO 标题、摘要、关键词和可搜索的产品命名，承接公开目录流量。',
      href: '#seo',
      Icon: SearchCheck,
      tone: 'neutral',
    },
    {
      label: '询盘交接准备',
      value: relatedProductCount > 0 ? '有关联池' : '待补关联',
      detail: '提前准备价格展示、商务条款、关联推荐和买家资料，保存后能接入产品线索队列。',
      href: '#commercial',
      Icon: ListChecks,
      tone: relatedProductCount > 0 ? 'ready' : 'neutral',
    },
  ]

  return (
    <section
      id="new-product-closure"
      data-new-product-backflow-preflight="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <span id="new-product-backflow-preflight" className="block scroll-mt-24" aria-hidden="true" />
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-bold text-[#1889B6]">B319 新建前回流预检</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">创建产品前先确认适配、证明、搜索和询盘资料</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            承接 B317/B318 的产品回流路径，把新建前准备项放在同一屏；这里只读提示和跳转，不新增保存、发布或价格规则。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionLink href="/admin/content/products/list" Icon={ListChecks} label="产品列表" />
          <AdminActionLink href="/admin/content/products#content-closure" Icon={Package} label="产品闭环总览" />
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="group block min-h-40 p-5 transition hover:bg-[#F7FAFA]">
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-md border ${closureToneClass(item.tone)}`}>
                <item.Icon size={18} />
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${closureToneClass(item.tone)}`}>
                {item.value}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-[#1E2C31]">{item.label}</p>
            <p className="mt-2 text-xs leading-5 text-[#61767D]">{item.detail}</p>
          </Link>
        ))}
      </div>
      <div className="border-t border-[#E6EEEE] bg-[#F7FAFA] px-5 py-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1889B6]">Creation Packet</p>
            <h3 className="mt-1 text-sm font-bold text-[#1E2C31]">创建前资料路径</h3>
          </div>
          <p className="max-w-3xl text-xs leading-5 text-[#61767D]">
            先把前台会展示和客户会询问的内容准备好，再进入长表单保存草稿。
          </p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {prepLanes.map((lane) => (
            <Link key={lane.label} href={lane.href} className="group min-h-[128px] rounded-md border border-[#D8E7E8] bg-white p-3 transition hover:border-[#1889B6] hover:bg-[#F0F7F8]">
              <span className="flex items-start justify-between gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${closureToneClass(lane.tone)}`}>
                  <lane.Icon size={15} />
                </span>
                <span className={`max-w-[96px] truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold ${closureToneClass(lane.tone)}`} title={lane.value}>
                  {lane.value}
                </span>
              </span>
              <span className="mt-3 block text-sm font-bold text-[#1E2C31]">{lane.label}</span>
              <span className="mt-1 line-clamp-3 text-xs leading-5 text-[#61767D]">{lane.detail}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function NewProductLeadFeedbackPrepPanel({
  categories,
  attributeTemplates,
  relatedProductCount,
  maxUploadMb,
}: {
  categories: number
  attributeTemplates: number
  relatedProductCount: number
  maxUploadMb: number
}) {
  const taxonomyReady = categories > 0 && attributeTemplates > 0
  const mediaReady = maxUploadMb > 0
  const relatedReady = relatedProductCount > 0
  const readyCount = [taxonomyReady, mediaReady, relatedReady].filter(Boolean).length
  const feedbackCards: NewProductClosureItem[] = [
    {
      label: 'B327 单品检查',
      value: '保存后',
      detail: '产品保存为草稿后，回到单品编辑页检查发布缺项、询盘交接和前台路径。',
      href: '#publish-check',
      Icon: Pencil,
      tone: 'neutral',
    },
    {
      label: 'B326 内容回流',
      value: '列表队列',
      detail: '先看产品列表的内容回流优先级，把线索反馈转成 SEO、商务和资料补齐顺序。',
      href: '/admin/content/products/list#product-content-lead-feedback-desk',
      Icon: Package,
      tone: 'neutral',
    },
    {
      label: 'B325 跟进分诊',
      value: '线索质量',
      detail: '从产品线索质量、表单阶段和跟进断点判断新产品需要补哪些买家判断材料。',
      href: '/admin/status/leads#product-lead-quality-followup-desk',
      Icon: ListChecks,
      tone: 'neutral',
    },
    {
      label: 'B324 线索复盘',
      value: 'product',
      detail: '进入 product 来源线索队列，对照客户问题、CTA 来源和运营跟进状态。',
      href: '/admin/customers/leads?source_type=product#product-lead-ops-review-desk',
      Icon: BarChart3,
      tone: 'neutral',
    },
  ]
  const prepCards: NewProductClosureItem[] = [
    {
      label: '分类与属性底座',
      value: `${categories}/${attributeTemplates}`,
      detail: taxonomyReady ? '分类和属性模板已可用，可进入产品属性区填写。' : '先补分类或属性模板，再创建可筛选的产品内容。',
      href: taxonomyReady ? '#attributes' : '/admin/content/products/attributes',
      Icon: SlidersHorizontal,
      tone: taxonomyReady ? 'ready' : 'warning',
    },
    {
      label: '媒体上传环境',
      value: `${maxUploadMb} MB`,
      detail: mediaReady ? '上传上限可用；先准备封面、图库和可追溯素材来源。' : '媒体上传上限异常，先检查媒体设置后再录入图片。',
      href: '#media',
      Icon: ImageIcon,
      tone: mediaReady ? 'ready' : 'warning',
    },
    {
      label: '关联推荐池',
      value: relatedProductCount.toString(),
      detail: relatedReady ? '已有相关产品可做详情页继续浏览入口。' : '暂无相关产品池，新产品保存后需要补关联推荐。',
      href: relatedReady ? '#relations' : '/admin/content/products/list?status=published',
      Icon: Tags,
      tone: relatedReady ? 'ready' : 'neutral',
    },
  ]
  const workflow = [
    {
      label: '01 看线索反馈',
      detail: '先读 B325/B324，确认 product 来源线索卡在跟进、表单、CTA 还是内容证明。',
      href: '/admin/status/leads#product-lead-quality-followup-desk',
      Icon: ListChecks,
      primary: false,
    },
    {
      label: '02 定内容缺口',
      detail: '回 B326 看现有产品的内容回流队列，把缺口转成新产品的 SEO、商务和资料清单。',
      href: '/admin/content/products/list#product-content-lead-feedback-desk',
      Icon: Package,
      primary: false,
    },
    {
      label: '03 准备新建资料',
      detail: `按 B319 先准备分类属性、媒体、详情证明和询盘交接；当前准备底座 ${readyCount}/3。`,
      href: '#new-product-closure',
      Icon: Layers3,
      primary: readyCount < 3,
    },
    {
      label: '04 填表保存草稿',
      detail: '进入基础信息、SEO、商务、图片、详情和发布检查；保存后再回单品编辑页复盘。',
      href: '#basic',
      Icon: Pencil,
      primary: false,
    },
  ]

  return (
    <section
      id="new-product-lead-feedback-desk"
      data-new-product-lead-feedback="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold text-[#E36F2C]">B328 新建产品线索反馈与内容准备</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">创建前先把线索反馈转成内容准备清单</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            把 B327 单品检查、B326 内容回流、B325 跟进分诊和 B324 产品线索复盘前置到新建产品前；本区只做只读准备路径，不保存产品、不发布产品、不更新线索。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionLink href="/admin/content/products/list#product-content-lead-feedback-desk" Icon={Package} label="B326 回流" />
          <AdminActionLink href="/admin/status/leads#product-lead-quality-followup-desk" Icon={ListChecks} label="B325 分诊" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#E6EEEE] bg-[#F7FAFA] md:grid-cols-4">
        <NewProductFeedbackInfoCell label="准备底座" value={`${readyCount}/3`} detail="分类属性、媒体、关联池" tone={readyCount === 3 ? 'ready' : readyCount > 0 ? 'neutral' : 'warning'} />
        <NewProductFeedbackInfoCell label="线索来源" value="product" detail="B325/B324 只读复盘" tone="neutral" />
        <NewProductFeedbackInfoCell label="内容回流" value="B326" detail="列表优先级队列" tone="neutral" />
        <NewProductFeedbackInfoCell label="保存影响" value="草稿" detail="未保存前不会公开展示" tone="ready" />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_420px] lg:divide-x lg:divide-y-0">
        <div>
          <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {feedbackCards.map((card) => (
              <Link key={card.label} href={card.href} className="block min-h-[154px] p-4 transition hover:bg-[#F7FAFA]">
                <span className="flex items-start justify-between gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${closureToneClass(card.tone)}`}>
                    <card.Icon size={17} />
                  </span>
                  <span className={`max-w-[104px] truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold ${closureToneClass(card.tone)}`} title={card.value}>
                    {card.value}
                  </span>
                </span>
                <span className="mt-3 block text-sm font-bold text-[#1E2C31]">{card.label}</span>
                <span className="mt-2 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 border-t border-[#E6EEEE] bg-[#F7FAFA] p-4 md:grid-cols-3">
            {prepCards.map((card) => (
              <Link key={card.label} href={card.href} className="rounded-md border border-[#D8E7E8] bg-white p-4 transition hover:border-[#1889B6] hover:bg-[#F0F7F8]">
                <span className="flex items-start justify-between gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${closureToneClass(card.tone)}`}>
                    <card.Icon size={16} />
                  </span>
                  <span className={`max-w-[96px] truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold ${closureToneClass(card.tone)}`} title={card.value}>
                    {card.value}
                  </span>
                </span>
                <span className="mt-3 block text-sm font-bold text-[#1E2C31]">{card.label}</span>
                <span className="mt-2 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="bg-[#FBFDFD]">
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <h3 className="text-sm font-bold text-[#1E2C31]">新建前动作顺序</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              先读线索反馈，再看内容回流，最后进入表单保存草稿。
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

function NewProductDraftApprovalPrepPanel({
  categories,
  attributeTemplates,
  relatedProductCount,
  maxUploadMb,
}: {
  categories: number
  attributeTemplates: number
  relatedProductCount: number
  maxUploadMb: number
}) {
  const taxonomyReady = categories > 0 && attributeTemplates > 0
  const mediaReady = maxUploadMb > 0
  const relatedReady = relatedProductCount > 0
  const readyCount = [taxonomyReady, mediaReady, relatedReady].filter(Boolean).length
  const approvalCards: NewProductClosureItem[] = [
    {
      label: 'B338 发布审批摘要',
      value: '表单底部',
      detail: '填写后在发布检查区核对保存状态、发布缺项、运营归属和询盘交接。',
      href: '#publish-check',
      Icon: SearchCheck,
      tone: 'neutral',
    },
    {
      label: 'B337 单品检查',
      value: '保存后',
      detail: '草稿保存后进入单品编辑页，再做恢复后发布前检查和人工确认。',
      href: '#publish-check',
      Icon: Pencil,
      tone: 'neutral',
    },
    {
      label: 'B328 线索反馈准备',
      value: '已前置',
      detail: '先把 product 来源线索问题转成 SEO、商务条款、资料和关联推荐准备项。',
      href: '#new-product-lead-feedback-desk',
      Icon: ListChecks,
      tone: 'ready',
    },
    {
      label: 'B336 草稿补齐队列',
      value: '保存后',
      detail: '保存为草稿后回到产品列表，进入草稿恢复和补齐队列继续治理。',
      href: '/admin/content/products/list?status=draft#product-draft-recovery-readiness-desk',
      Icon: Package,
      tone: 'neutral',
    },
  ]
  const gateCards: NewProductClosureItem[] = [
    {
      label: '分类属性底座',
      value: taxonomyReady ? '可进入' : '先补齐',
      detail: taxonomyReady ? '分类和属性模板已可承接新产品筛选。' : '缺分类或属性模板时，保存后会增加运营补齐成本。',
      href: taxonomyReady ? '#attributes' : '/admin/content/products/attributes',
      Icon: SlidersHorizontal,
      tone: taxonomyReady ? 'ready' : 'warning',
    },
    {
      label: '素材上传环境',
      value: `${maxUploadMb} MB`,
      detail: mediaReady ? '媒体上传上限可用，先准备封面、图库和素材来源。' : '媒体上传上限异常，先检查媒体设置。',
      href: '#media',
      Icon: ImageIcon,
      tone: mediaReady ? 'ready' : 'warning',
    },
    {
      label: '关联推荐承接',
      value: relatedProductCount.toString(),
      detail: relatedReady ? '已有相关产品池，可在保存前规划详情页继续浏览入口。' : '关联产品池不足，保存后需要补推荐链路。',
      href: relatedReady ? '#relations' : '/admin/content/products/list?status=published',
      Icon: Tags,
      tone: relatedReady ? 'ready' : 'neutral',
    },
    {
      label: '发布影响边界',
      value: '草稿',
      detail: '新建保存默认草稿；发布仍需要人工点击发布相关动作，不在本区自动触发。',
      href: '#publish-check',
      Icon: FileText,
      tone: 'ready',
    },
  ]

  return (
    <section
      id="new-product-draft-approval-desk"
      data-new-product-draft-approval="true"
      className="scroll-mt-24 overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-[#D8E7E8] bg-[#FBFDFD] px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold text-[#E36F2C]">B339 新建产品草稿审批准备</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E2C31]">保存草稿前先对齐审批、补齐和回跳路径</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            承接 B338 发布审批摘要、B337 单品检查、B336 草稿补齐和 B328 线索反馈准备；这里只做只读路径提示，不保存产品、不发布产品、不更新线索。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionLink href="#publish-check" Icon={SearchCheck} label="发布检查" />
          <AdminActionLink href="/admin/content/products/list?status=draft#product-draft-recovery-readiness-desk" Icon={Package} label="草稿队列" />
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#E6EEEE] bg-[#F7FAFA] md:grid-cols-4">
        <NewProductFeedbackInfoCell label="准备通过" value={`${readyCount}/3`} detail="分类属性、媒体、关联池" tone={readyCount === 3 ? 'ready' : readyCount > 0 ? 'neutral' : 'warning'} />
        <NewProductFeedbackInfoCell label="新建状态" value="草稿" detail="保存前不公开展示" tone="ready" />
        <NewProductFeedbackInfoCell label="审批承接" value="B338" detail="表单底部只读摘要" tone="neutral" />
        <NewProductFeedbackInfoCell label="补齐承接" value="B336" detail="保存后回列表治理" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-[minmax(0,1fr)_420px] lg:divide-x lg:divide-y-0">
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {approvalCards.map((card) => (
            <Link key={card.label} href={card.href} className="block min-h-[160px] p-4 transition hover:bg-[#F7FAFA]">
              <span className="flex items-start justify-between gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${closureToneClass(card.tone)}`}>
                  <card.Icon size={17} />
                </span>
                <span className={`max-w-[104px] truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold ${closureToneClass(card.tone)}`} title={card.value}>
                  {card.value}
                </span>
              </span>
              <span className="mt-3 block text-sm font-bold text-[#1E2C31]">{card.label}</span>
              <span className="mt-2 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
            </Link>
          ))}
        </div>

        <aside className="bg-[#FBFDFD]">
          <div className="border-b border-[#E6EEEE] px-5 py-4">
            <h3 className="text-sm font-bold text-[#1E2C31]">保存前审批门槛</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">
              先确认底座可用，再进入长表单保存草稿，减少保存后的反复补齐。
            </p>
          </div>
          <div className="divide-y divide-[#E6EEEE]">
            {gateCards.map((card) => (
              <Link key={card.label} href={card.href} className="block px-5 py-4 transition hover:bg-[#F0F7F8]">
                <span className="flex gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${closureToneClass(card.tone)}`}>
                    <card.Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-[#1E2C31]">{card.label}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${closureToneClass(card.tone)}`}>
                        {card.value}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#61767D]">{card.detail}</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}

function NewProductFeedbackInfoCell({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: NewProductClosureItem['tone']
}) {
  return (
    <div className="border-b border-r border-[#E6EEEE] p-4 last:border-r-0 md:border-b-0">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-2 text-xl font-bold ${tone === 'warning' ? 'text-[#E36F2C]' : tone === 'ready' ? 'text-emerald-700' : 'text-[#1E2C31]'}`}>
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-[#61767D]" title={detail}>{detail}</p>
    </div>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
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
            新建产品会写入产品数据。图片上传会立即进入媒体库，选择图片只回填表单，最终仍要保存产品才生效。
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentProductNewPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const maxUploadMb = await getMediaMaxUploadMbReadOnly().catch((err) => {
    console.error('[admin-content-product-new] load media limit failed', err)
    return defaultSiteSettings.mediaMaxUploadMb
  })
  const [categories, attributeTemplates, brands, marks, showcases, relatedProducts] = await Promise.all([
    listProductCategories({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product categories failed', err)
      return []
    }),
    listProductAttributeTemplatesWithOptions({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product attributes failed', err)
      return []
    }),
    listProductBrands({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product brands failed', err)
      return []
    }),
    listProductMarks({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product marks failed', err)
      return []
    }),
    listProductShowcases({ includeHidden: true }).catch((err) => {
      console.error('[admin-content-product-new] load product showcases failed', err)
      return []
    }),
    listCatalogProducts({ limit: 300, offset: 0 }).catch((err) => {
      console.error('[admin-content-product-new] load related products failed', err)
      return { rows: [], total: 0 }
    }),
  ])
  const adminRole: AdminRole = role
  const consoleMetrics: ProductEditorMetric[] = [
    {
      label: '分类',
      value: categories.length.toString(),
      detail: '可选产品分类，保存时写入 category_id。',
      tone: categories.length > 0 ? 'ready' : 'warning',
    },
    {
      label: '属性模板',
      value: attributeTemplates.length.toString(),
      detail: '用于筛选属性和前台产品对比。',
      tone: attributeTemplates.length > 0 ? 'ready' : 'warning',
    },
    {
      label: '运营标签',
      value: `${brands.length}/${marks.length}/${showcases.length}`,
      detail: '品牌 / 标记 / 展位选项数量。',
      tone: 'neutral',
    },
    {
      label: '相关产品',
      value: relatedProducts.rows.length.toString(),
      detail: '用于详情页相关推荐。',
      tone: relatedProducts.rows.length > 0 ? 'ready' : 'neutral',
    },
  ]
  const consoleSignals: ProductEditorSignal[] = [
    {
      label: '默认状态为草稿',
      detail: '新建保存后进入编辑页，发布前不会出现在公开产品页。',
      tone: 'ready',
    },
    {
      label: '图片上传立即进入媒体库',
      detail: `当前上传上限 ${maxUploadMb} MB；选择图片只回填表单，最终仍需保存产品才生效。`,
      tone: 'warning',
      href: '/admin/site/media#media-replacement-workbench',
    },
    {
      label: '保存会写入产品数据',
      detail: '本页不新增自动发布规则，点击保存或发布前仍由表单处理确认。',
      tone: 'warning',
      href: '#publish-check',
    },
    {
      label: '发布前先补完整度',
      detail: '建议按基础信息、SEO、商务条款、图片、内容、详情和规格顺序补齐。',
      tone: 'neutral',
      href: '#basic',
    },
  ]

  return (
    <AdminSectionShell
      topNavActive="content"
      role={adminRole}
      email={session.user.email}
      title="产品新建"
      description="创建产品草稿，并沿用产品编辑页的分区表单。"
      sideNavGroups={getSideNavGroups()}
      activeItem="product-new"
    >
      <Hero />
      <ProductEditorConsole
        title="新建产品编辑任务台"
        description="先确认分类、属性、运营标签、相关产品和媒体上传环境，再进入长表单逐项填写。"
        sections={EDIT_SECTIONS}
        metrics={consoleMetrics}
        signals={consoleSignals}
      />
      <NewProductPreflightPanel
        categories={categories.length}
        attributeTemplates={attributeTemplates.length}
        relatedProductCount={relatedProducts.rows.length}
        maxUploadMb={maxUploadMb}
      />
      <NewProductLeadFeedbackPrepPanel
        categories={categories.length}
        attributeTemplates={attributeTemplates.length}
        relatedProductCount={relatedProducts.rows.length}
        maxUploadMb={maxUploadMb}
      />
      <NewProductDraftApprovalPrepPanel
        categories={categories.length}
        attributeTemplates={attributeTemplates.length}
        relatedProductCount={relatedProducts.rows.length}
        maxUploadMb={maxUploadMb}
      />
      <EditSectionGrid />
      <RiskNotice />
      <section className="rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm md:p-5">
        <ProductForm
          mode="create"
          maxUploadMb={maxUploadMb}
          backHref="/admin/content/products/list"
          backLabel="返回产品列表"
          title="新建产品内容"
          previewPolicy="published-only"
          createRedirectBase="/admin/content/products"
          categories={categories}
          attributeTemplates={attributeTemplates}
          brands={brands}
          marks={marks}
          showcases={showcases}
          relatedProductOptions={relatedProducts.rows}
        />
      </section>
    </AdminSectionShell>
  )
}
