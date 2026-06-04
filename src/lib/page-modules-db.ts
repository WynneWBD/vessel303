import { createHash, randomUUID } from 'crypto'
import { pool } from '@/lib/db'
import {
  clonePageModuleTemplateContent,
  getPageModuleTemplate,
  getPageModuleTemplateByModuleType,
  isTemplateBackedPageModule,
  isPageModuleTemplateAllowedOnPage,
  type PageModuleTemplate,
} from '@/lib/page-module-templates'
import { DEFAULT_CONTACT_URL, SITE_CONTACT_HREF, SITE_PRODUCTS_HREF, normalizeSiteHref } from '@/lib/site-links'

export const PAGE_MODULE_PAGE_KEYS = [
  'home',
  'about',
  'products',
  'cases',
  'faq',
  'media-kit',
  'scenarios',
  'innovation',
  'display',
  'news',
  'contact',
  'auth',
  'account',
  'site',
] as const

export type PageModulePageKey = (typeof PAGE_MODULE_PAGE_KEYS)[number]

export function isPageModulePageKey(value: string): value is PageModulePageKey {
  return PAGE_MODULE_PAGE_KEYS.includes(value as PageModulePageKey)
}

export function pageModulePublicPaths(pageKey: string): string[] {
  if (pageKey === 'home') return ['/']
  if (pageKey === 'about') return ['/about']
  if (pageKey === 'products') return ['/products']
  if (pageKey === 'cases') return ['/cases']
  if (pageKey === 'faq') return ['/faq']
  if (pageKey === 'media-kit') return ['/media-kit']
  if (pageKey === 'scenarios') return ['/scenarios/tourism', '/scenarios/commercial', '/scenarios/public']
  if (pageKey === 'innovation') return ['/innovation/viie', '/innovation/vipc', '/innovation/vols']
  if (pageKey === 'display') return ['/display']
  if (pageKey === 'news') return ['/news']
  if (pageKey === 'contact') return ['/contact']
  if (pageKey === 'auth') return ['/login', '/signup']
  if (pageKey === 'account') return ['/account']
  if (pageKey === 'site') {
    return [
      '/',
      '/products',
      '/cases',
      '/about',
      '/faq',
      '/news',
      '/media-kit',
      '/contact',
      '/display',
      '/scenarios/tourism',
      '/scenarios/commercial',
      '/scenarios/public',
      '/innovation/viie',
      '/innovation/vipc',
      '/innovation/vols',
    ]
  }
  return []
}

export type PageModuleItem = {
  id: string
  image_url?: string
  video_url?: string
  video_poster_url?: string
  href?: string
  value_zh?: string
  value_en?: string
  content_zh?: string
  content_en?: string
  label_zh: string
  label_en: string
  is_visible: boolean
  sort_order: number
}

export type PageModuleLiveState = {
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  items: PageModuleItem[]
  is_visible: boolean
  sort_order: number
  updated_at: string
  updated_by_email: string | null
}

export type PageModuleRow = {
  id: string
  page_key: string
  module_key: string
  module_type: string
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  items: PageModuleItem[]
  is_visible: boolean
  sort_order: number
  updated_at: string
  updated_by_email: string | null
  has_draft?: boolean
  draft_updated_at?: string | null
  draft_updated_by_email?: string | null
  live_updated_at?: string | null
  live_updated_by_email?: string | null
  live_state?: PageModuleLiveState | null
}

export type PageModuleSnapshotRow = {
  id: string
  page_key: string
  module_key: string
  module_id: string
  module_type: string
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  items: PageModuleItem[]
  is_visible: boolean
  sort_order: number
  created_at: string
  created_by_email: string | null
}

export type PageModuleInput = {
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  items: PageModuleItem[]
  is_visible: boolean
  sort_order: number
}

export type PageStructureDraftStatus = 'active' | 'stale' | 'review' | 'discarded'

export type PageStructureModuleStatus = 'existing' | 'added' | 'removed' | 'hidden'

export type PageStructureModule = {
  moduleKey: string
  rendererKey: string
  moduleType: string
  sortOrder: number
  isVisible: boolean
  status: PageStructureModuleStatus
  locked: boolean
  required: boolean
  sourceModuleKey: string | null
  createdFromTemplate: string | null
}

export type PageStructureSummary = {
  moduleCount: number
  visibleCount: number
  addedCount: number
  removedCount: number
  hiddenCount: number
  imageCount: number
}

export type PageStructureDraftRow = {
  id: string
  page_key: string
  base_hash: string
  base_updated_at: string | null
  modules: PageStructureModule[]
  updated_at: string
  updated_by_email: string | null
  draft_status: PageStructureDraftStatus
  schema_version: number
  summary: PageStructureSummary
  image_refs: string[]
}

export type PageStructureSnapshotRow = {
  id: string
  page_key: string
  base_hash: string
  modules: PageStructureModule[]
  created_at: string
  created_by_email: string | null
  schema_version: number
  summary: PageStructureSummary
  image_refs: string[]
}

export type PageStructurePublishResult = {
  conflict: boolean
  noChanges?: boolean
  draft: PageStructureDraftRow
  publishedModules: PageModuleRow[]
  currentHash?: string
}

type DbPageModuleRow = Omit<PageModuleRow, 'items'> & {
  items: unknown
}

type DbPageModuleSnapshotRow = Omit<PageModuleSnapshotRow, 'items'> & {
  items: unknown
}

type DbPageModuleDraftRow = Omit<PageModuleRow, 'items'> & {
  items: unknown
}

type DbPageStructureDraftRow = Omit<PageStructureDraftRow, 'modules' | 'summary' | 'image_refs'> & {
  modules: unknown
  summary: unknown
  image_refs: unknown
}

type DbPageStructureSnapshotRow = Omit<PageStructureSnapshotRow, 'modules' | 'summary' | 'image_refs'> & {
  modules: unknown
  summary: unknown
  image_refs: unknown
}

export const DEFAULT_PAGE_MODULES: PageModuleRow[] = [
  {
    id: 'home:hero',
    page_key: 'home',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '首页首屏',
    title_en: 'Homepage Hero',
    description_zh: '首页首屏标题、说明、轮播图和按钮。这个模块已接入前台，可以直接影响首页首屏展示。',
    description_en: 'Hero title, intro, background image, and calls to action.',
    items: [
      {
        id: 'hero-tagline',
        label_zh: '重构自然的栖居',
        label_en: 'Redefine Natural Dwelling',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'hero-headline',
        label_zh: '建 筑 无 界',
        label_en: 'Architecture Without\nBoundaries',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'hero-subtitle',
        label_zh: '45天工厂预制，2小时现场安装，欧盟+美国双认证，为全球文旅项目提供可复制、可运营、可持续的智能装配建筑系统。',
        label_en: '45-day factory production, 2-hour on-site installation, EU+US certified smart prefab architecture for resort, hospitality and public-sector projects worldwide.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'hero-primary-cta',
        href: SITE_PRODUCTS_HREF,
        label_zh: '探索产品',
        label_en: 'Explore Products',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'hero-secondary-cta',
        href: SITE_CONTACT_HREF,
        label_zh: '联系我们',
        label_en: 'Get in Touch',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'hero-image-01',
        image_url: '/images/hero/homepage_banner-01.jpg',
        label_zh: '首页轮播图 01',
        label_en: 'Homepage hero image 01',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'hero-image-02',
        image_url: '/images/hero/homepage_banner-02.png',
        label_zh: '首页轮播图 02',
        label_en: 'Homepage hero image 02',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'hero-image-03',
        image_url: '/images/hero/homepage_banner-03.jpg',
        label_zh: '首页轮播图 03',
        label_en: 'Homepage hero image 03',
        is_visible: true,
        sort_order: 80,
      },
      {
        id: 'hero-image-04',
        image_url: '/images/hero/homepage_banner-04.jpg',
        label_zh: '首页轮播图 04',
        label_en: 'Homepage hero image 04',
        is_visible: true,
        sort_order: 90,
      },
      {
        id: 'hero-image-05',
        image_url: '/images/hero/homepage_banner-05.jpg',
        label_zh: '首页轮播图 05',
        label_en: 'Homepage hero image 05',
        is_visible: true,
        sort_order: 100,
      },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'home:credentials',
    page_key: 'home',
    module_key: 'credentials',
    module_type: 'stats',
    title_zh: '首页数据区',
    title_en: 'Homepage Stats',
    description_zh: '首页首屏下方核心数据。这个模块已接入前台，可以直接影响首页数据条展示。',
    description_en: 'Key statistics shown below the homepage hero.',
    items: [
      {
        id: 'cred-stat-01',
        value_zh: '300+',
        value_en: '300+',
        label_zh: '落地项目',
        label_en: 'Projects Delivered',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'cred-stat-02',
        value_zh: '30+',
        value_en: '30+',
        label_zh: '覆盖国家',
        label_en: 'Countries',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'cred-stat-03',
        value_zh: '150+',
        value_en: '150+',
        label_zh: '自主专利',
        label_en: 'Patents',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'cred-stat-04',
        value_zh: '28,800',
        value_en: '28,800',
        label_zh: '平方米工厂',
        label_en: 'Sqm Factory',
        is_visible: true,
        sort_order: 40,
      },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'home:operating-proof',
    page_key: 'home',
    module_key: 'operating-proof',
    module_type: 'fixed-content',
    title_zh: '首页项目能力展示',
    title_en: 'Homepage Project Proof',
    description_zh: '用于首页展示产品、项目和咨询入口的客户可见内容。前台只读取本模块已发布内容。',
    description_en: 'Customer-facing homepage copy for product, project, and inquiry sections. The frontend only renders this published module.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '项目能力',
        label_en: 'Project Capability',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'intro',
        label_zh: '从产品目录到项目交付',
        label_en: 'From catalog selection to project delivery',
        content_zh: '通过产品系列、项目案例和咨询入口，帮助采购方快速了解 VESSEL 的产品适配、交付能力和项目经验。',
        content_en: 'Product series, project cases, and inquiry paths help buyers evaluate model fit, delivery capability, and project experience.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'card-01',
        label_zh: '产品选择',
        label_en: 'Product Selection',
        content_zh: '按系列、配置、面积和适用场景了解产品。',
        content_en: 'Explore products by series, configuration, area, and use scenario.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'card-02',
        label_zh: '项目参考',
        label_en: 'Project Reference',
        content_zh: '通过已发布项目查看真实场地、落地方式和交付效果。',
        content_en: 'Review published projects for site context, deployment method, and delivery proof.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'card-03',
        label_zh: '采购咨询',
        label_en: 'Procurement Inquiry',
        content_zh: '提交国家、场景、数量和时间计划，便于团队给出适配建议。',
        content_en: 'Send country, scenario, quantity, and timeline so the team can respond with fit guidance.',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'image-01',
        image_url: '/images/hero/homepage_banner-01.jpg',
        label_zh: '项目场景图 1',
        label_en: 'Project image 1',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'image-02',
        image_url: '/images/hero/homepage_banner-02.png',
        label_zh: '项目场景图 2',
        label_en: 'Project image 2',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'image-03',
        image_url: '/images/hero/homepage_banner-03.jpg',
        label_zh: '项目场景图 3',
        label_en: 'Project image 3',
        is_visible: true,
        sort_order: 80,
      },
      {
        id: 'primary-cta',
        href: '/products',
        label_zh: '查看产品',
        label_en: 'View Products',
        is_visible: true,
        sort_order: 90,
      },
      {
        id: 'secondary-cta',
        href: '/cases',
        label_zh: '查看案例',
        label_en: 'View Cases',
        is_visible: true,
        sort_order: 100,
      },
    ],
    is_visible: true,
    sort_order: 25,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'home:technology',
    page_key: 'home',
    module_key: 'technology',
    module_type: 'fixed-content',
    title_zh: '首页技术体系',
    title_en: 'Homepage Technology',
    description_zh: '首页三大技术卡片与说明文案。当前先作为模块化 CMS 规划项，后续逐步接入前台。',
    description_en: 'Technology cards and supporting copy on the homepage.',
    items: [],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'products:hero',
    page_key: 'products',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '产品中心',
    title_en: 'PRODUCTS',
    description_zh: '按分类、配置、面积和国家浏览 VESSEL 产品目录。',
    description_en: 'Browse VESSEL products by category, configuration, area, and country.',
    items: [
      {
        id: 'breadcrumb-home',
        href: '/',
        label_zh: '首页',
        label_en: 'Home',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'breadcrumb-current',
        label_zh: '产品中心',
        label_en: 'Products',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'primary-cta',
        href: '/contact?source=products:catalog_inquiry_cta',
        label_zh: '提交产品需求',
        label_en: 'Send product brief',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'secondary-cta',
        href: '/cases',
        label_zh: '查看项目案例',
        label_en: 'View project cases',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'featured-label',
        label_zh: '精选产品',
        label_en: 'Featured Product',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'route-note',
        label_zh: '选型路径',
        label_en: 'Buyer Route',
        content_zh: '先筛选目录，再查看详情与商务条款，最后提交咨询。',
        content_en: 'Filter the catalog, review product details and terms, then submit an inquiry.',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'hero-image',
        href: '/products/e7-gen6-flagship',
        image_url: '/images/products/e7-gen6-flagship.jpg',
        label_zh: 'E7 Gen6',
        label_en: 'E7 Gen6',
        is_visible: true,
        sort_order: 70,
      },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'products:highlights',
    page_key: 'products',
    module_key: 'highlights',
    module_type: 'list',
    title_zh: '产品目录亮点',
    title_en: 'Catalog Highlights',
    description_zh: '产品目录页顶部的客户可见提示。',
    description_en: 'Customer-facing highlights shown above the product grid.',
    items: [
      {
        id: 'catalog',
        value_zh: '目录',
        value_en: 'Catalog',
        label_zh: '已发布产品',
        label_en: 'Published products',
        content_zh: '后台发布的产品进入正式目录。',
        content_en: 'Published products appear in the live catalog.',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'filters',
        value_zh: '筛选',
        value_en: 'Filters',
        label_zh: '分类与属性',
        label_en: 'Categories and attributes',
        content_zh: '分类、配置、面积和国家用于采购筛选。',
        content_en: 'Categories, configuration, area, and country support buyer filtering.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'inquiry',
        value_zh: '咨询',
        value_en: 'Inquiry',
        label_zh: '需求提交',
        label_en: 'Requirement submission',
        content_zh: '列表和详情页的咨询入口进入统一联系路径。',
        content_en: 'List and detail inquiry actions use the unified contact path.',
        is_visible: true,
        sort_order: 30,
      },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'products:contact-card',
    page_key: 'products',
    module_key: 'contact-card',
    module_type: 'fixed-content',
    title_zh: '产品咨询卡片',
    title_en: 'Product Inquiry Card',
    description_zh: '产品目录侧栏的咨询入口文案。',
    description_en: 'Inquiry copy shown in the product catalog sidebar.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '联系我们',
        label_en: 'Contact Us',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'headline',
        label_zh: '找不到合适型号？',
        label_en: 'Need a matching model?',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'body',
        label_zh: '产品需求说明',
        label_en: 'Requirement note',
        content_zh: '提交项目国家、场景、数量和交付要求，团队会按产品目录给出适配建议。',
        content_en: 'Send country, scenario, quantity, and delivery notes so the team can recommend a matching model.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'primary-cta',
        href: '/contact?source=products:sidebar_contact_card',
        label_zh: '提交需求',
        label_en: 'Send Requirement',
        is_visible: true,
        sort_order: 40,
      },
    ],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'faq:hero',
    page_key: 'faq',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '常见问题',
    title_en: 'Frequently Asked Questions',
    description_zh: '查看产品、运输、安装、认证和商务条款相关问题。',
    description_en: 'Review product, transport, installation, certification, and commercial questions.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '服务支持',
        label_en: 'Support',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'categories-label',
        label_zh: '个分类',
        label_en: 'categories',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'answers-label',
        label_zh: '条问答',
        label_en: 'answers',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'all-categories-label',
        label_zh: '全部',
        label_en: 'All',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'empty-state',
        label_zh: '当前分类暂无已发布问题。',
        label_en: 'No published questions are available in this category.',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'contact-cta',
        href: '/contact?source=faq:general:contact_cta',
        label_zh: '联系我们',
        label_en: 'Contact VESSEL',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'secondary-cta',
        href: '/products',
        label_zh: '查看产品',
        label_en: 'View Products',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'inquiry-title',
        label_zh: '提交项目问题',
        label_en: 'Send your question',
        is_visible: true,
        sort_order: 80,
      },
      {
        id: 'inquiry-description',
        content_zh: '请填写您的项目背景和问题，团队会按 FAQ 来源跟进。',
        content_en: 'Share your project context and question so the team can follow up from the FAQ source.',
        label_zh: 'FAQ 咨询说明',
        label_en: 'FAQ inquiry note',
        is_visible: true,
        sort_order: 90,
      },
      { id: 'form-eyebrow', label_zh: '项目咨询', label_en: 'Project Inquiry', is_visible: true, sort_order: 100 },
      { id: 'form-name', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 110 },
      { id: 'form-email', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 120 },
      { id: 'form-phone', label_zh: '电话 / WhatsApp', label_en: 'Phone / WhatsApp', is_visible: true, sort_order: 130 },
      { id: 'form-country', label_zh: '国家 / 城市', label_en: 'Country / City', is_visible: true, sort_order: 140 },
      { id: 'form-company', label_zh: '公司 / 机构', label_en: 'Company / Organization', is_visible: true, sort_order: 150 },
      { id: 'form-quantity', label_zh: '预计数量', label_en: 'Expected Quantity', is_visible: true, sort_order: 160 },
      { id: 'form-message', label_zh: '问题或项目需求', label_en: 'Question or Project Requirements', is_visible: true, sort_order: 170 },
      { id: 'form-submit', label_zh: '提交咨询', label_en: 'Submit Inquiry', is_visible: true, sort_order: 180 },
      { id: 'form-submitting', label_zh: '提交中', label_en: 'Submitting', is_visible: true, sort_order: 190 },
      { id: 'form-success', label_zh: '已收到，我们会按该页面来源跟进。', label_en: 'Received. The team will follow up from this page source.', is_visible: true, sort_order: 200 },
      { id: 'form-error', label_zh: '提交失败，请稍后再试。', label_en: 'Submission failed. Please try again.', is_visible: true, sort_order: 210 },
      { id: 'form-source-prefix', label_zh: '来源', label_en: 'Source', is_visible: true, sort_order: 220 },
      { id: 'form-company-prefix', label_zh: '公司', label_en: 'Company', is_visible: true, sort_order: 230 },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'products:ui-labels',
    page_key: 'products',
    module_key: 'ui-labels',
    module_type: 'fixed-content',
    title_zh: '产品目录界面文案',
    title_en: 'Product catalog interface labels',
    description_zh: '产品目录页筛选、按钮、空状态和价格缺省提示等客户可见文字。',
    description_en: 'Customer-facing labels for filters, buttons, empty state, and missing price text on the product catalog.',
    items: [
      { id: 'category-heading', label_zh: '产品分类', label_en: 'Product Categories', is_visible: true, sort_order: 10 },
      { id: 'all-products-label', label_zh: '全部产品', label_en: 'All Products', is_visible: true, sort_order: 20 },
      { id: 'filters-label', label_zh: '筛选', label_en: 'Filters', is_visible: true, sort_order: 30 },
      { id: 'search-placeholder', label_zh: '搜索', label_en: 'Search', is_visible: true, sort_order: 40 },
      { id: 'search-button', label_zh: '搜索', label_en: 'Search', is_visible: true, sort_order: 50 },
      { id: 'reset-button', label_zh: '重置', label_en: 'Reset', is_visible: true, sort_order: 60 },
      { id: 'range-prefix', label_zh: '产品', label_en: 'Products', is_visible: true, sort_order: 70 },
      { id: 'range-of', label_zh: '共', label_en: 'of', is_visible: true, sort_order: 80 },
      { id: 'catalog-total-label', label_zh: '目录总数', label_en: 'Catalog total', is_visible: true, sort_order: 90 },
      { id: 'matching-products-label', label_zh: '匹配产品', label_en: 'Matching products', is_visible: true, sort_order: 100 },
      { id: 'active-filters-label', label_zh: '当前筛选', label_en: 'Current filters', is_visible: true, sort_order: 110 },
      { id: 'query-filter-label', label_zh: '搜索', label_en: 'Search', is_visible: true, sort_order: 120 },
      { id: 'category-filter-label', label_zh: '分类', label_en: 'Category', is_visible: true, sort_order: 130 },
      { id: 'attribute-filter-label', label_zh: '属性', label_en: 'Attribute', is_visible: true, sort_order: 140 },
      { id: 'clear-filter-label', label_zh: '清除筛选', label_en: 'Clear filters', is_visible: true, sort_order: 150 },
      { id: 'empty-state', label_zh: '暂无匹配产品。', label_en: 'No matching products.', is_visible: true, sort_order: 160 },
      { id: 'empty-state-body', label_zh: '请调整搜索词或筛选条件后重试。', label_en: 'Adjust the search term or filters and try again.', is_visible: true, sort_order: 170 },
      { id: 'details-cta', label_zh: '查看详情', label_en: 'Details', is_visible: true, sort_order: 180 },
      { id: 'inquiry-cta', label_zh: '询盘', label_en: 'Inquiry', is_visible: true, sort_order: 190 },
      { id: 'price-empty', label_zh: '询价', label_en: 'Inquire for pricing', is_visible: true, sort_order: 200 },
      { id: 'image-label-prefix', label_zh: '产品图片', label_en: 'Product image', is_visible: true, sort_order: 210 },
    ],
    is_visible: true,
    sort_order: 40,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'products:inquiry-form',
    page_key: 'products',
    module_key: 'inquiry-form',
    module_type: 'fixed-content',
    title_zh: '产品询盘',
    title_en: 'Product Inquiry',
    description_zh: '填写项目需求，后台会按产品详情页来源生成线索。',
    description_en: 'Share project requirements and the backend will track this lead from the product detail page.',
    items: [
      { id: 'inquiry-type', label_zh: '产品询盘', label_en: 'Product Inquiry', is_visible: true, sort_order: 10 },
      { id: 'form-eyebrow', label_zh: '产品咨询', label_en: 'Product Consultation', is_visible: true, sort_order: 20 },
      { id: 'form-name', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 30 },
      { id: 'form-email', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 40 },
      { id: 'form-phone', label_zh: '电话 / WhatsApp', label_en: 'Phone / WhatsApp', is_visible: true, sort_order: 50 },
      { id: 'form-country', label_zh: '国家 / 城市', label_en: 'Country / City', is_visible: true, sort_order: 60 },
      { id: 'form-company', label_zh: '公司 / 机构', label_en: 'Company / Organization', is_visible: true, sort_order: 70 },
      { id: 'form-quantity', label_zh: '预计数量', label_en: 'Expected Quantity', is_visible: true, sort_order: 80 },
      { id: 'form-message', label_zh: '产品需求', label_en: 'Product Requirements', is_visible: true, sort_order: 90 },
      { id: 'form-submit', label_zh: '提交产品询盘', label_en: 'Submit Product Inquiry', is_visible: true, sort_order: 100 },
      { id: 'form-submitting', label_zh: '提交中', label_en: 'Submitting', is_visible: true, sort_order: 110 },
      { id: 'form-success', label_zh: '已收到产品需求，我们会按该产品来源跟进。', label_en: 'Received. The team will follow up from this product source.', is_visible: true, sort_order: 120 },
      { id: 'form-error', label_zh: '提交失败，请稍后再试。', label_en: 'Submission failed. Please try again.', is_visible: true, sort_order: 130 },
      { id: 'form-source-prefix', label_zh: '来源', label_en: 'Source', is_visible: true, sort_order: 140 },
      { id: 'form-company-prefix', label_zh: '公司', label_en: 'Company', is_visible: true, sort_order: 150 },
    ],
    is_visible: true,
    sort_order: 45,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'cases:inquiry-form',
    page_key: 'cases',
    module_key: 'inquiry-form',
    module_type: 'fixed-content',
    title_zh: '案例咨询',
    title_en: 'Case Inquiry',
    description_zh: '填写项目背景，后台会按案例详情页来源生成线索。',
    description_en: 'Share project context and the backend will track this lead from the case detail page.',
    items: [
      { id: 'inquiry-type', label_zh: '案例咨询', label_en: 'Project Case Inquiry', is_visible: true, sort_order: 10 },
      { id: 'form-eyebrow', label_zh: '案例咨询', label_en: 'Case Consultation', is_visible: true, sort_order: 20 },
      { id: 'form-name', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 30 },
      { id: 'form-email', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 40 },
      { id: 'form-phone', label_zh: '电话 / WhatsApp', label_en: 'Phone / WhatsApp', is_visible: true, sort_order: 50 },
      { id: 'form-country', label_zh: '项目国家 / 城市', label_en: 'Project Country / City', is_visible: true, sort_order: 60 },
      { id: 'form-company', label_zh: '公司 / 机构', label_en: 'Company / Organization', is_visible: true, sort_order: 70 },
      { id: 'form-quantity', label_zh: '预计舱体数量', label_en: 'Expected Units', is_visible: true, sort_order: 80 },
      { id: 'form-message', label_zh: '项目需求', label_en: 'Project Requirements', is_visible: true, sort_order: 90 },
      { id: 'form-submit', label_zh: '提交案例咨询', label_en: 'Submit Case Inquiry', is_visible: true, sort_order: 100 },
      { id: 'form-submitting', label_zh: '提交中', label_en: 'Submitting', is_visible: true, sort_order: 110 },
      { id: 'form-success', label_zh: '已收到案例咨询，我们会按该案例来源跟进。', label_en: 'Received. The team will follow up from this case source.', is_visible: true, sort_order: 120 },
      { id: 'form-error', label_zh: '提交失败，请稍后再试。', label_en: 'Submission failed. Please try again.', is_visible: true, sort_order: 130 },
      { id: 'form-source-prefix', label_zh: '来源', label_en: 'Source', is_visible: true, sort_order: 140 },
      { id: 'form-company-prefix', label_zh: '公司', label_en: 'Company', is_visible: true, sort_order: 150 },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'scenarios:inquiry-form',
    page_key: 'scenarios',
    module_key: 'inquiry-form',
    module_type: 'fixed-content',
    title_zh: '场景方案咨询',
    title_en: 'Scenario Inquiry',
    description_zh: '填写场景需求，后台会按场景页来源生成线索。',
    description_en: 'Share scenario requirements and the backend will track this lead from the scenario page.',
    items: [
      { id: 'form-eyebrow', label_zh: '场景咨询', label_en: 'Scenario Consultation', is_visible: true, sort_order: 10 },
      { id: 'form-name', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 20 },
      { id: 'form-email', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 30 },
      { id: 'form-phone', label_zh: '电话 / WhatsApp', label_en: 'Phone / WhatsApp', is_visible: true, sort_order: 40 },
      { id: 'form-country', label_zh: '项目国家 / 城市', label_en: 'Project Country / City', is_visible: true, sort_order: 50 },
      { id: 'form-company', label_zh: '公司 / 机构', label_en: 'Company / Organization', is_visible: true, sort_order: 60 },
      { id: 'form-quantity', label_zh: '预计数量', label_en: 'Expected Quantity', is_visible: true, sort_order: 70 },
      { id: 'form-message', label_zh: '场景需求', label_en: 'Scenario Requirements', is_visible: true, sort_order: 80 },
      { id: 'form-submit', label_zh: '提交场景咨询', label_en: 'Submit Scenario Inquiry', is_visible: true, sort_order: 90 },
      { id: 'form-submitting', label_zh: '提交中', label_en: 'Submitting', is_visible: true, sort_order: 100 },
      { id: 'form-success', label_zh: '已收到场景需求，我们会按该场景来源跟进。', label_en: 'Received. The team will follow up from this scenario source.', is_visible: true, sort_order: 110 },
      { id: 'form-error', label_zh: '提交失败，请稍后再试。', label_en: 'Submission failed. Please try again.', is_visible: true, sort_order: 120 },
      { id: 'form-source-prefix', label_zh: '来源', label_en: 'Source', is_visible: true, sort_order: 130 },
      { id: 'form-company-prefix', label_zh: '公司', label_en: 'Company', is_visible: true, sort_order: 140 },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'innovation:inquiry-form',
    page_key: 'innovation',
    module_key: 'inquiry-form',
    module_type: 'fixed-content',
    title_zh: '技术专题咨询',
    title_en: 'Innovation Inquiry',
    description_zh: '填写技术或项目需求，后台会按技术专题来源生成线索。',
    description_en: 'Share technical or project requirements and the backend will track this lead from the innovation page.',
    items: [
      { id: 'inquiry-type', label_zh: '技术专题咨询', label_en: 'Innovation Inquiry', is_visible: true, sort_order: 10 },
      { id: 'form-eyebrow', label_zh: '技术咨询', label_en: 'Technology Consultation', is_visible: true, sort_order: 20 },
      { id: 'form-name', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 30 },
      { id: 'form-email', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 40 },
      { id: 'form-phone', label_zh: '电话 / WhatsApp', label_en: 'Phone / WhatsApp', is_visible: true, sort_order: 50 },
      { id: 'form-country', label_zh: '国家 / 城市', label_en: 'Country / City', is_visible: true, sort_order: 60 },
      { id: 'form-company', label_zh: '公司 / 机构', label_en: 'Company / Organization', is_visible: true, sort_order: 70 },
      { id: 'form-quantity', label_zh: '预计数量', label_en: 'Expected Quantity', is_visible: true, sort_order: 80 },
      { id: 'form-message', label_zh: '技术或项目需求', label_en: 'Technology or Project Requirements', is_visible: true, sort_order: 90 },
      { id: 'form-submit', label_zh: '提交技术咨询', label_en: 'Submit Innovation Inquiry', is_visible: true, sort_order: 100 },
      { id: 'form-submitting', label_zh: '提交中', label_en: 'Submitting', is_visible: true, sort_order: 110 },
      { id: 'form-success', label_zh: '已收到咨询，我们会按该专题来源跟进。', label_en: 'Received. The team will follow up from this innovation source.', is_visible: true, sort_order: 120 },
      { id: 'form-error', label_zh: '提交失败，请稍后再试。', label_en: 'Submission failed. Please try again.', is_visible: true, sort_order: 130 },
      { id: 'form-source-prefix', label_zh: '来源', label_en: 'Source', is_visible: true, sort_order: 140 },
      { id: 'form-company-prefix', label_zh: '公司', label_en: 'Company', is_visible: true, sort_order: 150 },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'media-kit:hero',
    page_key: 'media-kit',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '媒体资料',
    title_en: 'Media Kit',
    description_zh: '获取 VESSEL 产品图片、品牌资料和项目资料申请入口。',
    description_en: 'Request VESSEL product images, brand materials, and project references.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '资源申请',
        label_en: 'Resource Request',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'form-title',
        label_zh: '申请资料',
        label_en: 'Request materials',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'form-description',
        label_zh: '填写用途后提交，团队会按需求回复可用资料。',
        label_en: 'Submit your intended use and the team will respond with suitable materials.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'resource-heading',
        label_zh: '可申请资源',
        label_en: 'Available Assets',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'resource-cta',
        label_zh: '申请访问',
        label_en: 'Request access',
        is_visible: true,
        sort_order: 50,
      },
      { id: 'label-name', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 60 },
      { id: 'label-email', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 70 },
      { id: 'label-phone', label_zh: '电话 / WhatsApp', label_en: 'Phone / WhatsApp', is_visible: true, sort_order: 80 },
      { id: 'label-company', label_zh: '公司 / 机构', label_en: 'Company / Organization', is_visible: true, sort_order: 90 },
      { id: 'label-country', label_zh: '国家 / 城市', label_en: 'Country / City', is_visible: true, sort_order: 100 },
      { id: 'label-use-case', label_zh: '资料用途', label_en: 'Asset Use Case', is_visible: true, sort_order: 110 },
      { id: 'label-message', label_zh: '补充说明', label_en: 'Additional Notes', is_visible: true, sort_order: 120 },
      { id: 'submit', label_zh: '提交资料申请', label_en: 'Submit Media Request', is_visible: true, sort_order: 130 },
      { id: 'submitting', label_zh: '提交中', label_en: 'Submitting', is_visible: true, sort_order: 140 },
      { id: 'success-title', label_zh: '已收到资料申请', label_en: 'Media Request Received', is_visible: true, sort_order: 150 },
      { id: 'success-body', label_zh: '团队会按您的用途回复可用资料。', label_en: 'The team will respond with suitable assets for your use case.', is_visible: true, sort_order: 160 },
      { id: 'error-body', label_zh: '提交失败，请稍后再试。', label_en: 'Submission failed. Please try again.', is_visible: true, sort_order: 170 },
      { id: 'use-case-press', value_en: 'press', value_zh: 'press', label_zh: '媒体报道', label_en: 'Press Coverage', is_visible: true, sort_order: 180 },
      { id: 'use-case-proposal', value_en: 'proposal', value_zh: 'proposal', label_zh: '项目提案', label_en: 'Project Proposal', is_visible: true, sort_order: 190 },
      { id: 'use-case-channel', value_en: 'channel', value_zh: 'channel', label_zh: '渠道介绍', label_en: 'Channel Introduction', is_visible: true, sort_order: 200 },
      { id: 'use-case-research', value_en: 'research', value_zh: 'research', label_zh: '研究参考', label_en: 'Research Reference', is_visible: true, sort_order: 210 },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'contact:hero',
    page_key: 'contact',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: 'Contact VESSEL',
    title_en: 'Contact VESSEL',
    description_zh: 'Share your country, project scenario, quantity, and timeline so the team can route your inquiry to the right contact.',
    description_en: 'Share your country, project scenario, quantity, and timeline so the team can route your inquiry to the right contact.',
    items: [
      { id: 'eyebrow', label_zh: 'Project Inquiry', label_en: 'Project Inquiry', is_visible: true, sort_order: 10 },
      { id: 'primary-cta', href: '/contact?source=contact:hero_primary', label_zh: 'Send Inquiry', label_en: 'Send Inquiry', is_visible: true, sort_order: 20 },
      { id: 'secondary-cta', href: '/products', label_zh: 'View Products', label_en: 'View Products', is_visible: true, sort_order: 30 },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'contact:channels',
    page_key: 'contact',
    module_key: 'channels',
    module_type: 'fixed-content',
    title_zh: 'Contact Channels',
    title_en: 'Contact Channels',
    description_zh: 'Reach the project team through the published WhatsApp, email, and phone channels.',
    description_en: 'Reach the project team through the published WhatsApp, email, and phone channels.',
    items: [
      { id: 'whatsapp', href: 'https://wa.me/8618024176679', label_zh: 'WhatsApp', label_en: 'WhatsApp', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679', is_visible: true, sort_order: 10 },
      { id: 'email', href: 'mailto:303vessel@303industries.cn', label_zh: 'Email', label_en: 'Email', content_zh: '303vessel@303industries.cn', content_en: '303vessel@303industries.cn', is_visible: true, sort_order: 20 },
      { id: 'phone', href: 'tel:+8618024176679', label_zh: 'Phone', label_en: 'Phone', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679', is_visible: true, sort_order: 30 },
      { id: 'address', label_zh: 'Address', label_en: 'Address', content_zh: 'China factory and international project support', content_en: 'China factory and international project support', is_visible: true, sort_order: 40 },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'contact:form',
    page_key: 'contact',
    module_key: 'form',
    module_type: 'form',
    title_zh: 'Send your project brief',
    title_en: 'Send your project brief',
    description_zh: 'Share your project scope so the sales team can review the right model, quantity, and destination.',
    description_en: 'Share your project scope so the sales team can review the right model, quantity, and destination.',
    items: [
      { id: 'inquiry-type', label_zh: 'Contact Inquiry', label_en: 'Contact Inquiry', is_visible: true, sort_order: 10 },
      { id: 'form-eyebrow', label_zh: 'Inquiry Form', label_en: 'Inquiry Form', is_visible: true, sort_order: 20 },
      { id: 'form-name', label_zh: 'Name', label_en: 'Name', is_visible: true, sort_order: 30 },
      { id: 'form-email', label_zh: 'Email', label_en: 'Email', is_visible: true, sort_order: 40 },
      { id: 'form-phone', label_zh: 'Phone / WhatsApp', label_en: 'Phone / WhatsApp', is_visible: true, sort_order: 50 },
      { id: 'form-country', label_zh: 'Country / City', label_en: 'Country / City', is_visible: true, sort_order: 60 },
      { id: 'form-company', label_zh: 'Company / Organization', label_en: 'Company / Organization', is_visible: true, sort_order: 70 },
      { id: 'form-quantity', label_zh: 'Quantity / Site Scale', label_en: 'Quantity / Site Scale', is_visible: true, sort_order: 80 },
      { id: 'form-message', label_zh: 'Project Brief', label_en: 'Project Brief', is_visible: true, sort_order: 90 },
      { id: 'form-submit', label_zh: 'Submit Inquiry', label_en: 'Submit Inquiry', is_visible: true, sort_order: 100 },
      { id: 'form-submitting', label_zh: 'Submitting', label_en: 'Submitting', is_visible: true, sort_order: 110 },
      { id: 'form-success', label_zh: 'Inquiry received. The team will review your project details and respond.', label_en: 'Inquiry received. The team will review your project details and respond.', is_visible: true, sort_order: 120 },
      { id: 'form-error', label_zh: 'Submission failed. Please try again.', label_en: 'Submission failed. Please try again.', is_visible: true, sort_order: 130 },
      { id: 'form-source-prefix', label_zh: 'Source', label_en: 'Source', is_visible: true, sort_order: 140 },
      { id: 'form-company-prefix', label_zh: 'Company', label_en: 'Company', is_visible: true, sort_order: 150 },
      { id: 'form-model', label_zh: 'Main contact page', label_en: 'Main contact page', is_visible: true, sort_order: 160 },
    ],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'contact:backup',
    page_key: 'contact',
    module_key: 'backup',
    module_type: 'fixed-content',
    title_zh: 'Legacy contact backup',
    title_en: 'Legacy contact backup',
    description_zh: 'Optional backup link to the legacy 300 contact page. The new site form remains the main contact path.',
    description_en: 'Optional backup link to the legacy 300 contact page. The new site form remains the main contact path.',
    items: [
      { id: 'legacy-contact', href: DEFAULT_CONTACT_URL, label_zh: 'Open legacy contact page', label_en: 'Open legacy contact page', is_visible: false, sort_order: 10 },
    ],
    is_visible: false,
    sort_order: 40,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'contact:email',
    page_key: 'contact',
    module_key: 'email',
    module_type: 'fixed-content',
    title_zh: 'Contact email copy',
    title_en: 'Contact email copy',
    description_zh: 'Customer confirmation email copy for contact inquiries.',
    description_en: 'Customer confirmation email copy for contact inquiries.',
    items: [
      { id: 'confirmation-subject', label_zh: 'We received your VESSEL inquiry', label_en: 'We received your VESSEL inquiry', is_visible: true, sort_order: 10 },
      { id: 'confirmation-greeting', label_zh: 'Thank you for contacting VESSEL.', label_en: 'Thank you for contacting VESSEL.', is_visible: true, sort_order: 20 },
      { id: 'confirmation-body', label_zh: 'Your inquiry has been saved and the team will review your project information.', label_en: 'Your inquiry has been saved and the team will review your project information.', is_visible: true, sort_order: 30 },
    ],
    is_visible: true,
    sort_order: 50,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'site:navbar',
    page_key: 'site',
    module_key: 'navbar',
    module_type: 'navigation',
    title_zh: '顶部导航',
    title_en: 'Navbar',
    description_zh: '全站顶部导航和行动按钮。前台只渲染已发布且可见的项目。',
    description_en: 'Global navbar links and action buttons. The frontend renders only published visible items.',
    items: [
      { id: 'logo', href: '/', image_url: '/images/vessel-logo.png', value_zh: 'brand', value_en: 'brand', label_zh: 'VESSEL 微宿', label_en: 'VESSEL', is_visible: true, sort_order: 5 },
      { id: 'nav-products', href: '/products', value_zh: 'primary', value_en: 'primary', label_zh: '产品系列', label_en: 'Products', is_visible: true, sort_order: 10 },
      { id: 'nav-cases', href: '/cases', value_zh: 'primary', value_en: 'primary', label_zh: '项目案例', label_en: 'Cases', is_visible: true, sort_order: 20 },
      { id: 'nav-about', href: '/about', value_zh: 'primary', value_en: 'primary', label_zh: '关于我们', label_en: 'About', is_visible: true, sort_order: 30 },
      { id: 'nav-faq', href: '/faq', value_zh: 'primary', value_en: 'primary', label_zh: '常见问题', label_en: 'FAQ', is_visible: true, sort_order: 40 },
      { id: 'nav-news', href: '/news', value_zh: 'primary', value_en: 'primary', label_zh: '新闻活动', label_en: 'News', is_visible: false, sort_order: 50 },
      { id: 'nav-contact', href: '/contact?source=navbar:contact_nav', value_zh: 'primary', value_en: 'primary', label_zh: '联系我们', label_en: 'Contact', is_visible: true, sort_order: 60 },
      { id: 'action-purchase', href: '/contact?source=navbar:purchase_cta', value_zh: 'action', value_en: 'action', label_zh: '采购咨询', label_en: 'Purchase Inquiry', is_visible: true, sort_order: 70 },
      { id: 'action-booking', href: '/contact?source=navbar:booking_cta', value_zh: 'action', value_en: 'action', label_zh: '预订营地', label_en: 'Book a Visit', is_visible: true, sort_order: 80 },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'site:ui-labels',
    page_key: 'site',
    module_key: 'ui-labels',
    module_type: 'fixed-content',
    title_zh: '全站界面标签',
    title_en: 'Global interface labels',
    description_zh: '导航、抽屉、图片和轮播等客户可见交互标签。',
    description_en: 'Customer-facing interaction labels for navigation, drawers, images, and carousel controls.',
    items: [
      { id: 'menu-toggle', label_zh: '打开或关闭菜单', label_en: 'Toggle menu', is_visible: true, sort_order: 10 },
      { id: 'drawer-close', label_zh: '关闭', label_en: 'Close', is_visible: true, sort_order: 20 },
    ],
    is_visible: true,
    sort_order: 15,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'site:footer-cta',
    page_key: 'site',
    module_key: 'footer-cta',
    module_type: 'fixed-content',
    title_zh: '准备规划您的 VESSEL 项目？',
    title_en: 'Planning a VESSEL project?',
    description_zh: '联系团队获取产品资料、项目适配建议和采购沟通支持。',
    description_en: 'Contact the team for product materials, project fit guidance, and procurement support.',
    items: [
      { id: 'whatsapp', href: 'https://wa.me/8618024176679', label_zh: 'WhatsApp', label_en: 'WhatsApp', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679', is_visible: true, sort_order: 10 },
      { id: 'message', href: '/contact?source=footer:message_cta', label_zh: '留言咨询', label_en: 'Message', is_visible: true, sort_order: 20 },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'site:footer-brand',
    page_key: 'site',
    module_key: 'footer-brand',
    module_type: 'fixed-content',
    title_zh: 'VESSEL 微宿',
    title_en: 'VESSEL',
    description_zh: '面向文旅度假、商业空间和公共服务场景的智能装配式建筑系统。',
    description_en: 'Smart prefab architecture for resorts, commercial spaces, and public facilities.',
    items: [
      { id: 'logo', href: '/', image_url: '/images/vessel-logo.png', label_zh: 'VESSEL 微宿', label_en: 'VESSEL', is_visible: true, sort_order: 5 },
      { id: 'tagline', label_zh: '智能装配式建筑', label_en: 'Smart Prefab Architecture', is_visible: true, sort_order: 10 },
      { id: 'whatsapp', href: 'https://wa.me/8618024176679', label_zh: 'WhatsApp: +86 180 2417 6679', label_en: 'WhatsApp: +86 180 2417 6679', is_visible: true, sort_order: 20 },
      { id: 'email', href: 'mailto:303vessel@303industries.cn', label_zh: 'Email: 303vessel@303industries.cn', label_en: 'Email: 303vessel@303industries.cn', is_visible: true, sort_order: 30 },
    ],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'site:footer-products',
    page_key: 'site',
    module_key: 'footer-products',
    module_type: 'navigation',
    title_zh: '产品系列',
    title_en: 'Products',
    description_zh: '页脚产品入口。',
    description_en: 'Footer product links.',
    items: [
      { id: 'e7', href: '/products/e7-gen6-flagship', value_zh: '38.8㎡', value_en: '38.8 sqm', label_zh: 'E7 Gen6', label_en: 'E7 Gen6', is_visible: true, sort_order: 10 },
      { id: 'e6', href: '/products/e6-gen6-standard', value_zh: '29.6㎡', value_en: '29.6 sqm', label_zh: 'E6 Gen6', label_en: 'E6 Gen6', is_visible: true, sort_order: 20 },
      { id: 'e3', href: '/products/e3-gen6-standard', value_zh: '19㎡ mini', value_en: '19 sqm mini', label_zh: 'E3 Gen6', label_en: 'E3 Gen6', is_visible: true, sort_order: 30 },
      { id: 'v9', href: '/products/v9-gen6-standard', value_zh: '38㎡', value_en: '38 sqm', label_zh: 'V9 Gen6', label_en: 'V9 Gen6', is_visible: true, sort_order: 40 },
      { id: 'all-products', href: '/products', label_zh: '全部产品', label_en: 'All Products', is_visible: true, sort_order: 50 },
    ],
    is_visible: true,
    sort_order: 40,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'site:footer-company',
    page_key: 'site',
    module_key: 'footer-company',
    module_type: 'navigation',
    title_zh: '公司与内容',
    title_en: 'Company',
    description_zh: '页脚内容入口。',
    description_en: 'Footer content links.',
    items: [
      { id: 'about', href: '/about', label_zh: '关于我们', label_en: 'About', is_visible: true, sort_order: 10 },
      { id: 'cases', href: '/cases', label_zh: '项目案例', label_en: 'Cases', is_visible: true, sort_order: 20 },
      { id: 'news', href: '/news', label_zh: '新闻活动', label_en: 'News', is_visible: false, sort_order: 30 },
      { id: 'contact', href: '/contact?source=footer:company_contact', label_zh: '联系我们', label_en: 'Contact', is_visible: true, sort_order: 40 },
      { id: 'media-kit', href: '/media-kit', label_zh: '媒体资料', label_en: 'Media Kit', is_visible: true, sort_order: 50 },
      { id: 'scenario-tourism', href: '/scenarios/tourism', label_zh: '文旅度假', label_en: 'Tourism & Resort', is_visible: true, sort_order: 60 },
      { id: 'scenario-commercial', href: '/scenarios/commercial', label_zh: '商业空间', label_en: 'Commercial Space', is_visible: true, sort_order: 70 },
      { id: 'scenario-public', href: '/scenarios/public', label_zh: '公共设施', label_en: 'Public Facilities', is_visible: true, sort_order: 80 },
    ],
    is_visible: true,
    sort_order: 50,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'site:footer-contact',
    page_key: 'site',
    module_key: 'footer-contact',
    module_type: 'fixed-content',
    title_zh: '联系信息',
    title_en: 'Contact',
    description_zh: '页脚联系信息。',
    description_en: 'Footer contact information.',
    items: [
      { id: 'whatsapp', href: 'https://wa.me/8618024176679', label_zh: 'WhatsApp', label_en: 'WhatsApp', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679', is_visible: true, sort_order: 10 },
      { id: 'email', href: 'mailto:303vessel@303industries.cn', label_zh: '303vessel@303industries.cn', label_en: '303vessel@303industries.cn', is_visible: true, sort_order: 20 },
      { id: 'address', label_zh: '广东省佛山市顺德区', label_en: 'Shunde District, Foshan, Guangdong, China', is_visible: true, sort_order: 30 },
    ],
    is_visible: true,
    sort_order: 60,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'site:floating-contact',
    page_key: 'site',
    module_key: 'floating-contact',
    module_type: 'fixed-content',
    title_zh: '浮动联系入口',
    title_en: 'Floating contact actions',
    description_zh: '面向海外访客的 WhatsApp、邮箱和询盘入口。',
    description_en: 'WhatsApp, email, and inquiry actions for overseas visitors.',
    items: [
      { id: 'whatsapp', href: 'https://wa.me/8618024176679', label_zh: 'WhatsApp', label_en: 'WhatsApp', content_zh: '+86 180 2417 6679', content_en: '+86 180 2417 6679', is_visible: true, sort_order: 10 },
      { id: 'email', href: 'mailto:303vessel@303industries.cn', label_zh: 'Email', label_en: 'Email', content_zh: '303vessel@303industries.cn', content_en: '303vessel@303industries.cn', is_visible: true, sort_order: 20 },
      { id: 'inquiry', href: '/contact?source=floating:inquiry', label_zh: 'Project Inquiry', label_en: 'Project Inquiry', is_visible: true, sort_order: 30 },
    ],
    is_visible: true,
    sort_order: 65,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'auth:shared',
    page_key: 'auth',
    module_key: 'shared',
    module_type: 'fixed-content',
    title_zh: '登录注册共享文案',
    title_en: 'Auth shared copy',
    description_zh: '登录和注册页面共享品牌入口。',
    description_en: 'Shared brand entry for login and registration pages.',
    items: [
      { id: 'brand', href: '/', label_zh: 'VESSEL 微宿', label_en: 'VESSEL', is_visible: true, sort_order: 10 },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'auth:login',
    page_key: 'auth',
    module_key: 'login',
    module_type: 'fixed-content',
    title_zh: '登录',
    title_en: 'Sign in',
    description_zh: '进入您的 VESSEL 账户。',
    description_en: 'Access your VESSEL account.',
    items: [
      { id: 'email-label', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 10 },
      { id: 'email-placeholder', label_zh: '邮箱占位', label_en: 'Email placeholder', value_zh: 'name@example.com', value_en: 'name@example.com', is_visible: true, sort_order: 20 },
      { id: 'password-label', label_zh: '密码', label_en: 'Password', is_visible: true, sort_order: 30 },
      { id: 'password-placeholder', label_zh: '密码占位', label_en: 'Password placeholder', value_zh: '请输入密码', value_en: 'Enter password', is_visible: true, sort_order: 40 },
      { id: 'google-button', label_zh: '使用 Google 登录', label_en: 'Continue with Google', is_visible: true, sort_order: 50 },
      { id: 'divider', label_zh: '或', label_en: 'or', is_visible: true, sort_order: 60 },
      { id: 'submit', label_zh: '登录', label_en: 'Sign in', is_visible: true, sort_order: 70 },
      { id: 'submitting', label_zh: '登录中', label_en: 'Signing in', is_visible: true, sort_order: 80 },
      { id: 'error', label_zh: '登录失败，请检查邮箱或密码。', label_en: 'Sign in failed. Check your email or password.', is_visible: true, sort_order: 90 },
      { id: 'no-account', label_zh: '还没有账户？', label_en: 'No account yet?', is_visible: true, sort_order: 100 },
      { id: 'register-link', href: '/register', label_zh: '注册', label_en: 'Create account', is_visible: true, sort_order: 110 },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'auth:register',
    page_key: 'auth',
    module_key: 'register',
    module_type: 'fixed-content',
    title_zh: '注册',
    title_en: 'Create account',
    description_zh: '创建您的 VESSEL 账户。',
    description_en: 'Create your VESSEL account.',
    items: [
      { id: 'name-label', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 10 },
      { id: 'name-placeholder', label_zh: '姓名占位', label_en: 'Name placeholder', value_zh: '您的姓名', value_en: 'Your name', is_visible: true, sort_order: 20 },
      { id: 'email-label', label_zh: '邮箱', label_en: 'Email', is_visible: true, sort_order: 30 },
      { id: 'email-placeholder', label_zh: '邮箱占位', label_en: 'Email placeholder', value_zh: 'name@example.com', value_en: 'name@example.com', is_visible: true, sort_order: 40 },
      { id: 'password-label', label_zh: '密码', label_en: 'Password', is_visible: true, sort_order: 50 },
      { id: 'password-placeholder', label_zh: '密码占位', label_en: 'Password placeholder', value_zh: '设置密码', value_en: 'Set password', is_visible: true, sort_order: 60 },
      { id: 'google-button', label_zh: '使用 Google 注册', label_en: 'Continue with Google', is_visible: true, sort_order: 70 },
      { id: 'divider', label_zh: '或', label_en: 'or', is_visible: true, sort_order: 80 },
      { id: 'submit', label_zh: '注册', label_en: 'Create account', is_visible: true, sort_order: 90 },
      { id: 'submitting', label_zh: '注册中', label_en: 'Creating account', is_visible: true, sort_order: 100 },
      { id: 'error', label_zh: '注册失败，请稍后再试。', label_en: 'Registration failed. Please try again.', is_visible: true, sort_order: 110 },
      { id: 'has-account', label_zh: '已有账户？', label_en: 'Already have an account?', is_visible: true, sort_order: 120 },
      { id: 'login-link', href: '/login', label_zh: '登录', label_en: 'Sign in', is_visible: true, sort_order: 130 },
    ],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'account:header',
    page_key: 'account',
    module_key: 'header',
    module_type: 'fixed-content',
    title_zh: '账户中心',
    title_en: 'Account Center',
    description_zh: '',
    description_en: '',
    items: [
      { id: 'eyebrow', label_zh: '账户', label_en: 'Account', is_visible: true, sort_order: 10 },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'account:profile',
    page_key: 'account',
    module_key: 'profile',
    module_type: 'fixed-content',
    title_zh: '资料',
    title_en: 'Profile',
    description_zh: '更新联系信息，方便项目沟通。',
    description_en: 'Update contact information for project communication.',
    items: [
      { id: 'name-label', label_zh: '姓名', label_en: 'Name', is_visible: true, sort_order: 10 },
      { id: 'name-placeholder', label_zh: '姓名占位', label_en: 'Name placeholder', value_zh: '您的姓名', value_en: 'Your name', is_visible: true, sort_order: 20 },
      { id: 'company-label', label_zh: '公司 / 机构', label_en: 'Company / Organization', is_visible: true, sort_order: 30 },
      { id: 'company-placeholder', label_zh: '公司占位', label_en: 'Company placeholder', value_zh: '公司名称', value_en: 'Company name', is_visible: true, sort_order: 40 },
      { id: 'country-label', label_zh: '国家 / 城市', label_en: 'Country / City', is_visible: true, sort_order: 50 },
      { id: 'country-placeholder', label_zh: '国家占位', label_en: 'Country placeholder', value_zh: '项目所在国家或城市', value_en: 'Project country or city', is_visible: true, sort_order: 60 },
      { id: 'phone-label', label_zh: '电话', label_en: 'Phone', is_visible: true, sort_order: 70 },
      { id: 'phone-placeholder', label_zh: '电话占位', label_en: 'Phone placeholder', value_zh: '电话', value_en: 'Phone number', is_visible: true, sort_order: 80 },
      { id: 'whatsapp-label', label_zh: 'WhatsApp', label_en: 'WhatsApp', is_visible: true, sort_order: 90 },
      { id: 'whatsapp-placeholder', label_zh: 'WhatsApp 占位', label_en: 'WhatsApp placeholder', value_zh: 'WhatsApp', value_en: 'WhatsApp', is_visible: true, sort_order: 100 },
      { id: 'language-label', label_zh: '首选语言', label_en: 'Preferred Language', is_visible: true, sort_order: 110 },
      { id: 'language-empty', label_zh: '不指定', label_en: 'Not specified', is_visible: true, sort_order: 120 },
      { id: 'language-zh', label_zh: '中文', label_en: 'Chinese', is_visible: true, sort_order: 130 },
      { id: 'language-en', label_zh: '英文', label_en: 'English', is_visible: true, sort_order: 140 },
      { id: 'save', label_zh: '保存资料', label_en: 'Save Profile', is_visible: true, sort_order: 150 },
      { id: 'saving', label_zh: '保存中', label_en: 'Saving', is_visible: true, sort_order: 160 },
      { id: 'success', label_zh: '资料已保存。', label_en: 'Profile saved.', is_visible: true, sort_order: 170 },
      { id: 'load-error', label_zh: '资料加载失败，请稍后再试。', label_en: 'Profile failed to load. Please try again.', is_visible: true, sort_order: 180 },
      { id: 'save-error', label_zh: '资料保存失败，请稍后再试。', label_en: 'Profile save failed. Please try again.', is_visible: true, sort_order: 190 },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'account:password',
    page_key: 'account',
    module_key: 'password',
    module_type: 'fixed-content',
    title_zh: '密码',
    title_en: 'Password',
    description_zh: '',
    description_en: '',
    items: [
      { id: 'title-change', label_zh: '修改密码', label_en: 'Change password', is_visible: true, sort_order: 10 },
      { id: 'title-set', label_zh: '设置密码', label_en: 'Set password', is_visible: true, sort_order: 20 },
      { id: 'help-change', label_zh: '输入当前密码并设置新密码。', label_en: 'Enter current password and set a new one.', is_visible: true, sort_order: 30 },
      { id: 'help-set', label_zh: '为您的账户设置密码。', label_en: 'Set a password for your account.', is_visible: true, sort_order: 40 },
      { id: 'current-label', label_zh: '当前密码', label_en: 'Current Password', is_visible: true, sort_order: 50 },
      { id: 'new-label', label_zh: '新密码', label_en: 'New Password', is_visible: true, sort_order: 60 },
      { id: 'new-placeholder', label_zh: '新密码占位', label_en: 'New password placeholder', value_zh: '输入新密码', value_en: 'Enter new password', is_visible: true, sort_order: 70 },
      { id: 'save', label_zh: '保存密码', label_en: 'Save Password', is_visible: true, sort_order: 80 },
      { id: 'saving', label_zh: '保存中', label_en: 'Saving', is_visible: true, sort_order: 90 },
      { id: 'set-success', label_zh: '密码已设置。', label_en: 'Password set.', is_visible: true, sort_order: 100 },
      { id: 'change-success', label_zh: '密码已修改。', label_en: 'Password changed.', is_visible: true, sort_order: 110 },
      { id: 'save-error', label_zh: '密码保存失败，请稍后再试。', label_en: 'Password save failed. Please try again.', is_visible: true, sort_order: 120 },
    ],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:hero',
    page_key: 'about',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '关于我们 · 首屏',
    title_en: 'About · Hero',
    description_zh: '关于我们首屏标题、说明和背景图。这个模块已接入前台，可以直接影响 /about 首屏展示。',
    description_en: 'Hero title, intro, and background image on the About page.',
    items: [
      {
        id: 'about-hero-eyebrow',
        label_zh: 'VESSEL® · 关于微宿',
        label_en: 'VESSEL® · About',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'about-hero-headline',
        label_zh: '重构\n自然的栖居',
        label_en: 'Reimagining\nNatural Dwelling',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'about-hero-subtitle',
        label_zh: '自 2018 年创立，已在全国落地 300+ 项目，出口远销 30+ 国家，推动中国文旅创新品类进入国际市场。',
        label_en: 'Since 2018 we have delivered 300+ projects across China and exported to 30+ countries, taking a new Chinese category of experiential tourism to the global market.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'about-hero-image',
        image_url: '/images/about/about_scene-01.jpg',
        label_zh: '关于我们首屏背景图',
        label_en: 'About hero background image',
        is_visible: true,
        sort_order: 40,
      },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:stats',
    page_key: 'about',
    module_key: 'stats',
    module_type: 'stats',
    title_zh: '关于我们 · 数据条',
    title_en: 'About · Stats',
    description_zh: '关于我们首屏下方核心数据。这个模块已接入前台，可以直接影响 /about 数据条展示。',
    description_en: 'Key statistics below the About hero.',
    items: [
      {
        id: 'about-stat-01',
        value_zh: '300+',
        value_en: '300+',
        label_zh: '落地项目',
        label_en: 'Projects Delivered',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'about-stat-02',
        value_zh: '30+',
        value_en: '30+',
        label_zh: '出口国家',
        label_en: 'Countries',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'about-stat-03',
        value_zh: '28,800㎡',
        value_en: '28,800㎡',
        label_zh: '自建工厂',
        label_en: 'Owned Factory',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'about-stat-04',
        value_zh: '150+',
        value_en: '150+',
        label_zh: '国家专利',
        label_en: 'National Patents',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'about-stat-05',
        value_zh: '150 台',
        value_en: '150 units',
        label_zh: '月产能',
        label_en: 'Monthly Capacity',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'about-stat-06',
        value_zh: '1000万+',
        value_en: '10M+',
        label_zh: '全网粉丝',
        label_en: 'Social Followers',
        is_visible: true,
        sort_order: 60,
      },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:brand-story',
    page_key: 'about',
    module_key: 'brand-story',
    module_type: 'fixed-content',
    title_zh: '关于我们 · 品牌故事',
    title_en: 'About · Brand Story',
    description_zh: '关于我们品牌故事区。这个模块已接入前台，可以直接影响 /about 品牌介绍展示。',
    description_en: 'Brand story section on the About page.',
    items: [
      {
        id: 'story-kicker',
        label_zh: '品牌介绍',
        label_en: 'About VESSEL®',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'story-heading',
        label_zh: '高端度假营地\n解决方案',
        label_en: 'Space-Themed\nLuxury Camp\nResort Solutions',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'story-paragraph-01',
        label_zh: '段落 1',
        label_en: 'Paragraph 1',
        content_zh: 'VESSEL 微宿® 专注于高端度假营地解决方案。我们以科幻感强烈的装配式舱体产品为特色，为全球文旅运营方提供一站式营地解决方案。自 2018 年创立，已在全国落地 300+ 项目，出口远销 30+ 国家，推动中国文旅创新品类"太空主题营地"进入国际市场。',
        content_en: 'VESSEL® focuses on space-themed luxury camp resort solutions. We design, manufacture and deliver sci-fi-inspired prefabricated cabins, offering a turnkey solution for resort operators worldwide. Since 2018 we have delivered 300+ projects across China and exported to 30+ countries, supporting the space-themed resort category in international markets.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'story-paragraph-02',
        label_zh: '段落 2',
        label_en: 'Paragraph 2',
        content_zh: 'VESSEL 品牌由广东微宿文旅发展有限公司运营，总部位于广东佛山。我们坚持原创研发与自建工厂双核心：研发团队累计获得国家专利 150+ 件，自有生产线占地 28,800 ㎡，月产能 150 台。',
        content_en: 'The VESSEL® brand is operated by Guangdong Vessel Cultural Tourism Development Co., Ltd., headquartered in Foshan, China. In-house R&D and owned manufacturing are our two strategic pillars: our design team holds 150+ national patents, and our 28,800 m² production line delivers a monthly capacity of 150 units.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'story-paragraph-03',
        label_zh: '段落 3',
        label_en: 'Paragraph 3',
        content_zh: 'VESSEL 在文旅场景之外，也与知名企业共创，产品广泛应用于养老度假地产、城市移动商业、便民服务设施等多元场景。我们构建了 VIPC 整装预制、VIIE 智能交互、VOLS 离网系统三大核心技术体系，让每一台微宿都能独立面对全球的气候、运输、运营挑战。',
        content_en: 'Beyond tourism, VESSEL® partners with established enterprises on mixed-use deployments — senior resort real estate, urban mobile retail, and public amenity installations. Our three proprietary technology systems — VIPC, VIIE and VOLS — allow every unit to operate autonomously under diverse climates, logistics routes and operating models worldwide.',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'story-image',
        image_url: '/images/about/about_factory-02.jpg',
        label_zh: '品牌故事配图',
        label_en: 'Brand story image',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'story-badge',
        value_zh: '2018',
        value_en: '2018',
        label_zh: '品牌创立',
        label_en: 'FOUNDED',
        is_visible: true,
        sort_order: 70,
      },
    ],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:factory',
    page_key: 'about',
    module_key: 'factory',
    module_type: 'gallery-with-captions',
    title_zh: '关于我们 · 智造实力',
    title_en: 'About · Manufacturing',
    description_zh: '关于我们智造实力区。这个模块已接入前台，可以直接影响 /about 工厂标题、说明和图片。',
    description_en: 'Manufacturing section on the About page.',
    items: [
      {
        id: 'factory-kicker',
        label_zh: '智造实力',
        label_en: 'Manufacturing',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'factory-heading',
        label_zh: '28,800㎡\n精密智造基地',
        label_en: '28,800 m²\nPrecision Factory',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'factory-summary',
        label_zh: '佛山狮山自有工厂，月产能 150 台，出厂即成品。',
        label_en: 'Self-owned facility in Shishan, Foshan. 150 units monthly. Every unit leaves as a finished product.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'factory-image-hero',
        image_url: '/images/about/about_factory-01.jpg',
        label_zh: '工厂主图',
        label_en: 'Factory hero image',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'factory-image-01',
        image_url: '/images/about/about_factory-03.jpg',
        label_zh: '工厂图片 01',
        label_en: 'Factory image 01',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'factory-image-02',
        image_url: '/images/about/about_factory-04.jpg',
        label_zh: '工厂图片 02',
        label_en: 'Factory image 02',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'factory-image-03',
        image_url: '/images/about/about_factory-05.jpg',
        label_zh: '工厂图片 03',
        label_en: 'Factory image 03',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'factory-image-04',
        image_url: '/images/about/about_factory-06.png',
        label_zh: '工厂图片 04',
        label_en: 'Factory image 04',
        is_visible: true,
        sort_order: 80,
      },
    ],
    is_visible: true,
    sort_order: 40,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:timeline',
    page_key: 'about',
    module_key: 'timeline',
    module_type: 'list',
    title_zh: '关于我们 · 品牌历程',
    title_en: 'About · Timeline',
    description_zh: '关于我们品牌历程区。这个模块已接入前台，可以直接影响 /about 时间线展示。',
    description_en: 'Timeline section on the About page.',
    items: [
      {
        id: 'timeline-kicker',
        label_zh: '品牌历程',
        label_en: 'Timeline',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'timeline-heading',
        label_zh: '每一步，皆有印记',
        label_en: 'Every milestone,\na mark made',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'timeline-2018',
        value_zh: '2018',
        value_en: '2018',
        label_zh: '2018',
        label_en: '2018',
        content_zh: 'Studio 303 设计创立 VESSEL 微宿®，完成首台钢结构原型，佛山三水首个生产基地建立。',
        content_en: 'Studio 303 Design establishes VESSEL®. First steel-framed prototype completed. First production base set up in Sanshui, Foshan.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'timeline-2019',
        value_zh: '2019',
        value_en: '2019',
        label_zh: '2019',
        label_en: '2019',
        content_zh: 'E7（原 C70）发布，登上央视新闻直播间，河北、四川项目落地。',
        content_en: 'E7 (originally C70) launches. Featured live on CCTV National News. Projects delivered to Hebei and Sichuan.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'timeline-2020',
        value_zh: '2020',
        value_en: '2020',
        label_zh: '2020',
        label_en: '2020',
        content_zh: 'V 系列与 E5 发布，与中国航天、中车集团开展联合研发。',
        content_en: 'V Series and E5 launch. Joint R&D partnerships formed with China Aerospace and CRRC.',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'timeline-2021',
        value_zh: '2021',
        value_en: '2021',
        label_zh: '2021',
        label_en: '2021',
        content_zh: '南沙第二生产基地建立，内蒙古、云南、四川等地项目落地。',
        content_en: 'Second production base established. Projects across Inner Mongolia, Yunnan, and Sichuan.',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'timeline-2022',
        value_zh: '2022',
        value_en: '2022',
        label_zh: '2022',
        label_en: '2022',
        content_zh: 'S5 发布，佛山狮山研发中心成立，获高新技术企业认定，落地项目覆盖全国全省份。',
        content_en: 'S5 launched. R&D Center opens in Shishan, Foshan. Awarded High-Tech Enterprise status. Projects now cover all provinces.',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'timeline-2023',
        value_zh: '2023',
        value_en: '2023',
        label_zh: '2023',
        label_en: '2023',
        content_zh: 'E7 获日本（九州）认证，成功交付伊朗、沙特（+55°C）。与 Lotus Cars 太阳能建筑战略合作，与 Massimo Corp. 拓展北美市场。',
        content_en: 'E7 certified for Japan (Kyushu). Delivered to Iran and Saudi Arabia (+55°C). Strategic partnership with Lotus Cars. North America expansion with Massimo Corp.',
        is_visible: true,
        sort_order: 80,
      },
      {
        id: 'timeline-2024',
        value_zh: '2024',
        value_en: '2024',
        label_zh: '2024',
        label_en: '2024',
        content_zh: 'E3 Gen6、E6 Gen6 发布，华为智能家居合作，青海湖极寒测试（−32°C）完成。',
        content_en: 'E3 Gen6 and E6 Gen6 launch. Huawei Smart Home partnership. Projects at Qatar Lake. Qinghai Lake winter test completed (−32°C).',
        is_visible: true,
        sort_order: 90,
      },
      {
        id: 'timeline-2025',
        value_zh: '2025',
        value_en: '2025',
        label_zh: '2025',
        label_en: '2025',
        content_zh: 'E7 Gen6 发布，通过多项国际权威认证，亮相圣彼得堡国际经济论坛，参展广交会。',
        content_en: 'E7 Gen6 launches. Multiple international certifications passed. Debut at St. Petersburg International Economic Forum. Canton Fair participation.',
        is_visible: true,
        sort_order: 100,
      },
    ],
    is_visible: true,
    sort_order: 45,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:technologies',
    page_key: 'about',
    module_key: 'technologies',
    module_type: 'list',
    title_zh: '关于我们 · 三大技术',
    title_en: 'About · Technologies',
    description_zh: '关于我们三大技术区。这个模块已接入前台，可以直接影响 /about 技术列表展示。',
    description_en: 'Technology systems shown on the About page.',
    items: [
      {
        id: 'tech-kicker',
        label_zh: '核心技术体系',
        label_en: 'CORE TECHNOLOGIES',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'tech-heading',
        label_zh: '三大自研技术体系',
        label_en: 'Three Proprietary Systems',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'tech-summary',
        label_zh: '每一台微宿背后的工程基础——面向全球部署而生。',
        label_en: 'The engineering foundation behind every VESSEL unit — built for global deployment.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'tech-viie',
        value_zh: 'viie',
        value_en: 'viie',
        label_zh: 'VesselOS · 智能交互',
        label_en: 'VesselOS · VIIE',
        content_zh: '完全自研平台，全球1,400余台舱体联网，远程掌控灯光、空调、门锁与实时监控。',
        content_en: 'Proprietary platform. 1,400+ units globally connected. Full remote control of lighting, climate, access and monitoring.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'tech-vols',
        value_zh: 'vols',
        value_en: 'vols',
        label_zh: 'VOLS · 离网系统',
        label_en: 'VOLS · Off-grid System',
        content_zh: '光伏发电 + 100kWh+储能 + VSRB生物污水零排放，完全脱离市政水电基础设施。',
        content_en: 'Solar generation + 100kWh+ storage + VSRB zero-discharge treatment. No municipal infrastructure needed.',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'tech-vipc',
        value_zh: 'vipc',
        value_en: 'vipc',
        label_zh: 'VIPC · 整装预制',
        label_en: 'VIPC · Pre-fab System',
        content_zh: '工厂100%成品出厂，现场2小时完成安装，符合40尺平架集装箱规格，已合规交付30余国。',
        content_en: '100% finished at factory. 2-hour site installation. 40ft Flat Rack compliant. 30+ countries delivered.',
        is_visible: true,
        sort_order: 60,
      },
    ],
    is_visible: true,
    sort_order: 50,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:recognition-awards',
    page_key: 'about',
    module_key: 'recognition-awards',
    module_type: 'gallery-with-captions',
    title_zh: '关于我们 · 奖项荣誉',
    title_en: 'About · Awards',
    description_zh: '关于我们认证荣誉区的奖杯/证书图片标题。这个模块已接入前台，可以直接影响 /about 展示。',
    description_en: 'Award and recognition image captions shown on the About page.',
    items: [
      {
        id: 'about-award-01',
        image_url: '/images/about/about_award-01.jpg',
        label_zh: '2020景筑奖 · 民宿酒店应用示范项目',
        label_en: '2020 Jingzhu Award · Homestay Hotel Application Demonstration Project',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'about-award-02',
        image_url: '/images/about/about_award-02.jpg',
        label_zh: '2021粤港澳大湾区数字时尚大奖',
        label_en: '2021 Greater Bay Area Digital Fashion Award',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'about-award-03',
        image_url: '/images/about/about_award-03.jpg',
        label_zh: '2019中国创新创业成果交易会 · 技术创新成长企业',
        label_en: '2019 China Innovation & Entrepreneurship Fair · Technology Innovation Growth Enterprise',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'about-award-04',
        image_url: '/images/about/about_award-04.jpg',
        label_zh: '2023海北州生态露营季 · 银奖',
        label_en: '2023 Haibei Eco Camping Season · Silver Award',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'about-award-05',
        image_url: '/images/about/about_award-05.jpg',
        label_zh: '中国旅游车船协会 · 旅游出行行业创新发展服务',
        label_en: 'China Tourism Vehicle & Cruise Association · Innovative Travel Service Recognition',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'about-award-06',
        image_url: '/images/about/about_award-06.jpg',
        label_zh: '2018全球移动互联网开发创意大赛 · 体育文旅创新创业赛第一名',
        label_en: '2018 Global Mobile Internet Creative Development Competition · First Place',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'about-award-07',
        image_url: '/images/about/about_award-07.jpg',
        label_zh: '2023海北州生态露营季 · 银奖',
        label_en: '2023 Haibei Eco Camping Season · Silver Award',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'about-award-08',
        image_url: '/images/about/about_award-08.jpg',
        label_zh: '同路创意集团文旅装备产研基地',
        label_en: 'Partner Creative Group Cultural & Tourism Equipment Production and Research Base',
        is_visible: true,
        sort_order: 80,
      },
      {
        id: 'about-award-09',
        image_url: '/images/about/about_award-09.jpg',
        label_zh: '2023海北州生态露营季 · 银奖证书',
        label_en: '2023 Haibei Eco Camping Season · Silver Award Certificate',
        is_visible: true,
        sort_order: 90,
      },
      {
        id: 'about-award-10',
        image_url: '/images/about/about_award-10.jpg',
        label_zh: '中企信办信用建设工作委员会会员单位',
        label_en: 'Member of the Enterprise Credit Construction Committee',
        is_visible: true,
        sort_order: 100,
      },
      {
        id: 'about-award-11',
        image_url: '/images/about/about_award-11.jpg',
        label_zh: '2023北京国际文旅消费博览会 · 文旅消费产品销售奖',
        label_en: '2023 Beijing International Cultural Tourism Consumption Expo · Product Sales Award',
        is_visible: true,
        sort_order: 110,
      },
      {
        id: 'about-award-12',
        image_url: '/images/about/about_award-12.jpg',
        label_zh: '国际山地旅游联盟会员证',
        label_en: 'International Mountain Tourism Alliance Membership Certificate',
        is_visible: true,
        sort_order: 120,
      },
      {
        id: 'about-award-13',
        image_url: '/images/about/about_award-13.jpg',
        label_zh: '2025高新技术企业证书',
        label_en: '2025 High-Tech Enterprise Certificate',
        is_visible: true,
        sort_order: 130,
      },
    ],
    is_visible: true,
    sort_order: 70,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:partners',
    page_key: 'about',
    module_key: 'partners',
    module_type: 'gallery',
    title_zh: '关于我们 · 合作伙伴',
    title_en: 'About · Partners',
    description_zh: '关于我们合作伙伴区。这个模块已接入前台，可以直接影响 /about 合作伙伴展示。',
    description_en: 'Partner logo gallery on the About page.',
    items: [
      {
        id: 'partners-kicker',
        label_zh: '战略合作伙伴',
        label_en: 'Strategic Partners',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'partners-heading',
        label_zh: '与世界同行',
        label_en: 'Building with\nPartners',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'partners-summary',
        label_zh: '与全球知名品牌联合开发，共同参与智能居住实践。',
        label_en: 'Collaborating with established global brands on smart living solutions.',
        is_visible: true,
        sort_order: 30,
      },
      ...Array.from({ length: 33 }, (_, index): PageModuleItem => {
        const number = String(index + 1).padStart(2, '0')
        return {
          id: `partner-${number}`,
          image_url: `/images/about/about_partner-${number}.png`,
          label_zh: `合作伙伴 ${number}`,
          label_en: `Partner ${number}`,
          is_visible: true,
          sort_order: 40 + index * 10,
        }
      }),
    ],
    is_visible: true,
    sort_order: 80,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:founder',
    page_key: 'about',
    module_key: 'founder',
    module_type: 'fixed-content',
    title_zh: '关于我们 · 创始人',
    title_en: 'About · Founder',
    description_zh: '关于我们创始人区。这个模块已接入前台，可以直接影响 /about 创始人展示。',
    description_en: 'Founder section on the About page.',
    items: [
      {
        id: 'founder-section-kicker',
        label_zh: '团队',
        label_en: 'Team',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'founder-section-heading',
        label_zh: '100+ 人精英团队',
        label_en: '100+ Expert Team',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'founder-photo',
        image_url: '/images/about/about_team-05.jpg',
        label_zh: '创始人头像',
        label_en: 'Founder portrait',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'founder-role',
        label_zh: '创始人 & 首席设计师',
        label_en: 'Founder & Chief Designer',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'founder-name',
        label_zh: '王帅斌',
        label_en: 'Wang Shuaibin',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'founder-subtitle',
        label_zh: '建筑师 · 企业家 · 先行者',
        label_en: 'Architect · Entrepreneur · Visionary',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'founder-bio',
        label_zh: '创始人介绍',
        label_en: 'Founder bio',
        content_zh: '王帅斌于 2018 年创立 VESSEL 微宿，以国际建筑师视野参与中国文旅行业创新。他持有英国邓迪大学建筑学硕士（RIBA Part II 认证）及美国圣路易斯华盛顿大学建筑学硕士学位，曾任职于纽约华尔街 SOM 建筑设计事务所。在团队持续研发与全球项目交付中，微宿形成了"太空主题高端度假营地"解决方案，产品出口 30 余国。',
        content_en: 'Wang Shuaibin founded VESSEL in 2018, bringing an international architectural perspective to the cultural tourism industry. He holds Master of Architecture degrees from the University of Dundee (RIBA Part II) and Washington University in St. Louis, and previously worked at SOM Architects on Wall Street, New York City. Through ongoing team R&D and global project delivery, VESSEL has developed space-themed luxury camp resort solutions with exports across 30+ countries.',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'founder-tag-01',
        label_zh: '邓迪大学 — RIBA Part II',
        label_en: 'Univ. of Dundee — RIBA Part II',
        is_visible: true,
        sort_order: 80,
      },
      {
        id: 'founder-tag-02',
        label_zh: '华盛顿大学圣路易斯 — 建筑学硕士',
        label_en: 'Washington Univ. in St. Louis — M.Arch',
        is_visible: true,
        sort_order: 90,
      },
      {
        id: 'founder-tag-03',
        label_zh: 'SOM建筑事务所 — 纽约',
        label_en: 'SOM Architects — NYC',
        is_visible: true,
        sort_order: 100,
      },
    ],
    is_visible: true,
    sort_order: 90,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'about:services',
    page_key: 'about',
    module_key: 'services',
    module_type: 'list',
    title_zh: '关于我们 · 服务体系',
    title_en: 'About · Services',
    description_zh: '关于我们三大服务体系。这个模块已接入前台，可以直接影响 /about 服务卡片展示。',
    description_en: 'Three service systems shown on the About page.',
    items: [
      {
        id: 'services-kicker',
        label_zh: '三大服务体系',
        label_en: 'Three Service Systems',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'services-heading',
        label_zh: '从选址到运营\n全程陪跑',
        label_en: 'From Site Selection\nto Full Operations',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'service-01',
        value_zh: '01',
        value_en: '01',
        label_zh: '规划策划服务',
        label_en: 'Strategic Planning & Consulting',
        content_zh: '从项目立项起介入：项目定位、整体规划、产品选型、舱体布置、投资测算、运营策略——让营地从"能开业"变成"能挣钱"。',
        content_en: "We engage from day one — positioning, master planning, product selection, cabin layout, investment modelling and operating strategy — so the resort doesn't just open, it performs.",
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'service-02',
        value_zh: '02',
        value_en: '02',
        label_zh: '产品定制开发',
        label_en: 'Bespoke Product Development',
        content_zh: '全方位定制：室内布局、外观结构、多舱组合、水电智能深度集成，支持海外本地零部件组装，适配不同场景与各国法规。',
        content_en: 'End-to-end customisation — interior layout, exterior form, multi-cabin configurations, deep MEP and smart integration, and assembly of locally sourced components for overseas projects.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'service-03',
        value_zh: '03',
        value_en: '03',
        label_zh: '运营陪跑服务',
        label_en: 'Operations Support & Acceleration',
        content_zh: '从 0 到 1 搭建社媒账号矩阵与 OTA 分销渠道，借助微宿品牌官方资源做千万级流量引流，让营地运营省心高效。',
        content_en: "We build the full online stack from scratch — social media, OTA distribution, creator partnerships — backed by VESSEL's own brand resources for tens-of-millions-reach traffic support.",
        is_visible: true,
        sort_order: 50,
      },
    ],
    is_visible: true,
    sort_order: 100,
    updated_at: '',
    updated_by_email: null,
  },
]

let schemaReady: Promise<void> | null = null
let seededReady: Promise<void> | null = null
let snapshotSchemaReady: Promise<void> | null = null
let draftSchemaReady: Promise<void> | null = null
let structureDraftSchemaReady: Promise<void> | null = null
let structureSnapshotSchemaReady: Promise<void> | null = null

const PAGE_STRUCTURE_SCHEMA_VERSION = 1

const PAGE_MODULE_RENDERER_KEYS: Record<string, string> = {
  'home:hero': 'home.hero',
  'home:credentials': 'home.credentials',
  'about:hero': 'about.hero',
  'about:stats': 'about.stats',
  'about:brand-story': 'about.brandStory',
  'about:factory': 'about.factory',
  'about:timeline': 'about.timeline',
  'about:technologies': 'about.technologies',
  'about:recognition-awards': 'about.recognitionAwards',
  'about:partners': 'about.partners',
  'about:founder': 'about.founder',
  'about:services': 'about.services',
}

function pageStructureRendererKey(pageKey: string, moduleKey: string) {
  return PAGE_MODULE_RENDERER_KEYS[`${pageKey}:${moduleKey}`] ?? `${pageKey}.${moduleKey}`
}

function firstStringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string') return value
  }
  return undefined
}

function normalizeItems(value: unknown): PageModuleItem[] {
  if (!Array.isArray(value)) return []
  const items: PageModuleItem[] = []
  value.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const raw = item as Partial<PageModuleItem>
    const rawMedia = raw as Partial<PageModuleItem> & Record<string, unknown>
    const videoUrl = firstStringValue(raw.video_url, rawMedia.videoUrl, rawMedia.videoUrl_symbol, rawMedia.video_url_symbol)
    const videoPosterUrl = firstStringValue(
      raw.video_poster_url,
      rawMedia.video_poster,
      rawMedia.videoPosterUrl,
      rawMedia.video_cover_url,
      rawMedia.videoCoverUrl,
      rawMedia.videoCoverUrl_symbol,
      rawMedia.video_cover_url_symbol,
    )
    items.push({
      id: typeof raw.id === 'string' && raw.id ? raw.id : `item-${index + 1}`,
      image_url: typeof raw.image_url === 'string' ? raw.image_url : undefined,
      video_url: videoUrl,
      video_poster_url: videoPosterUrl,
      href: typeof raw.href === 'string' ? raw.href : undefined,
      value_zh: typeof raw.value_zh === 'string' ? raw.value_zh : undefined,
      value_en: typeof raw.value_en === 'string' ? raw.value_en : undefined,
      content_zh: typeof raw.content_zh === 'string' ? raw.content_zh : undefined,
      content_en: typeof raw.content_en === 'string' ? raw.content_en : undefined,
      label_zh: typeof raw.label_zh === 'string' ? raw.label_zh : '',
      label_en: typeof raw.label_en === 'string' ? raw.label_en : '',
      is_visible: raw.is_visible !== false,
      sort_order: Number.isFinite(Number(raw.sort_order)) ? Number(raw.sort_order) : (index + 1) * 10,
    })
  })

  return items.sort((a, b) => a.sort_order - b.sort_order)
}

function normalizeRow(row: DbPageModuleRow): PageModuleRow {
  return {
    ...row,
    items: normalizeItems(row.items),
  }
}

function shouldPreserveLegacyPublishedHref(row: PageModuleRow) {
  return row.page_key === 'contact' && row.module_key === 'backup'
}

function normalizePublishedRow(row: DbPageModuleRow): PageModuleRow {
  const normalized = normalizeRow(row)
  if (shouldPreserveLegacyPublishedHref(normalized)) return normalized

  return {
    ...normalized,
    items: normalized.items.map((item) => {
      const href = item.href ? normalizeSiteHref(item.href, '') : ''
      if (!href || href === item.href) return item
      return { ...item, href }
    }),
  }
}

function normalizeDraftRow(row: DbPageModuleDraftRow): PageModuleRow {
  return {
    ...row,
    items: normalizeItems(row.items),
    has_draft: true,
    draft_updated_at: row.updated_at,
    draft_updated_by_email: row.updated_by_email,
  }
}

function normalizeSnapshotRow(row: DbPageModuleSnapshotRow): PageModuleSnapshotRow {
  return {
    ...row,
    items: normalizeItems(row.items),
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0))]
}

function normalizeStructureStatus(value: unknown): PageStructureModuleStatus {
  if (value === 'added' || value === 'removed' || value === 'hidden') return value
  return 'existing'
}

function normalizeDraftStatus(value: unknown): PageStructureDraftStatus {
  if (value === 'stale' || value === 'review' || value === 'discarded') return value
  return 'active'
}

function normalizeStructureSummary(value: unknown): PageStructureSummary {
  const raw = value && typeof value === 'object' ? value as Partial<PageStructureSummary> : {}
  return {
    moduleCount: Number(raw.moduleCount) || 0,
    visibleCount: Number(raw.visibleCount) || 0,
    addedCount: Number(raw.addedCount) || 0,
    removedCount: Number(raw.removedCount) || 0,
    hiddenCount: Number(raw.hiddenCount) || 0,
    imageCount: Number(raw.imageCount) || 0,
  }
}

function normalizeStructureModules(value: unknown): PageStructureModule[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const raw = item as Partial<PageStructureModule>
      const moduleKey = typeof raw.moduleKey === 'string' && raw.moduleKey ? raw.moduleKey : `module-${index + 1}`
      const status = normalizeStructureStatus(raw.status)

      return {
        moduleKey,
        rendererKey: typeof raw.rendererKey === 'string' && raw.rendererKey ? raw.rendererKey : pageStructureRendererKey('', moduleKey),
        moduleType: typeof raw.moduleType === 'string' && raw.moduleType ? raw.moduleType : 'fixed-content',
        sortOrder: Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : (index + 1) * 10,
        isVisible: status === 'hidden' ? false : raw.isVisible !== false,
        status,
        locked: raw.locked === true,
        required: raw.required === true,
        sourceModuleKey: typeof raw.sourceModuleKey === 'string' ? raw.sourceModuleKey : null,
        createdFromTemplate: typeof raw.createdFromTemplate === 'string' ? raw.createdFromTemplate : null,
      }
    })
    .filter((item): item is PageStructureModule => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.moduleKey.localeCompare(b.moduleKey))
}

function normalizeStructureDraftRow(row: DbPageStructureDraftRow): PageStructureDraftRow {
  return {
    ...row,
    draft_status: normalizeDraftStatus(row.draft_status),
    schema_version: Number(row.schema_version) || PAGE_STRUCTURE_SCHEMA_VERSION,
    modules: normalizeStructureModules(row.modules),
    summary: normalizeStructureSummary(row.summary),
    image_refs: normalizeStringArray(row.image_refs),
  }
}

function normalizeStructureSnapshotRow(row: DbPageStructureSnapshotRow): PageStructureSnapshotRow {
  return {
    ...row,
    schema_version: Number(row.schema_version) || PAGE_STRUCTURE_SCHEMA_VERSION,
    modules: normalizeStructureModules(row.modules),
    summary: normalizeStructureSummary(row.summary),
    image_refs: normalizeStringArray(row.image_refs),
  }
}

function pageModuleToInput(pageModule: PageModuleRow): PageModuleInput {
  return {
    title_zh: pageModule.title_zh,
    title_en: pageModule.title_en,
    description_zh: pageModule.description_zh,
    description_en: pageModule.description_en,
    items: pageModule.items,
    is_visible: pageModule.is_visible,
    sort_order: pageModule.sort_order,
  }
}

function pageModuleToLiveState(pageModule: PageModuleRow): PageModuleLiveState {
  return {
    ...pageModuleToInput(pageModule),
    items: pageModule.items.map((item) => ({ ...item })),
    updated_at: pageModule.updated_at,
    updated_by_email: pageModule.updated_by_email,
  }
}

function pageModuleToStructureModule(pageModule: PageModuleRow): PageStructureModule {
  const template = getPageModuleTemplateByModuleType(pageModule.module_type)
  const templateAllowed = Boolean(template && isPageModuleTemplateAllowedOnPage(template, pageModule.page_key))

  return {
    moduleKey: pageModule.module_key,
    rendererKey: templateAllowed && template ? template.rendererKey : pageStructureRendererKey(pageModule.page_key, pageModule.module_key),
    moduleType: pageModule.module_type,
    sortOrder: Number(pageModule.sort_order) || 0,
    isVisible: pageModule.is_visible,
    status: pageModule.is_visible ? 'existing' : 'hidden',
    locked: pageModule.module_key === 'hero',
    required: pageModule.module_key === 'hero',
    sourceModuleKey: null,
    createdFromTemplate: templateAllowed && template ? template.templateId : null,
  }
}

function structureModuleToPageModule(
  pageKey: string,
  module: PageStructureModule,
  contentSource?: PageModuleRow | null,
): PageModuleRow {
  const fallback = contentSource ?? getDefaultPageModule(pageKey, module.moduleKey)
  return {
    id: fallback?.id ?? `${pageKey}:${module.moduleKey}`,
    page_key: pageKey,
    module_key: module.moduleKey,
    module_type: module.moduleType || fallback?.module_type || 'fixed-content',
    title_zh: fallback?.title_zh ?? '',
    title_en: fallback?.title_en ?? '',
    description_zh: fallback?.description_zh ?? '',
    description_en: fallback?.description_en ?? '',
    items: fallback?.items.map((item) => ({ ...item })) ?? [],
    is_visible: module.status === 'hidden' ? false : module.isVisible,
    sort_order: module.sortOrder,
    updated_at: fallback?.updated_at ?? '',
    updated_by_email: fallback?.updated_by_email ?? null,
    has_draft: fallback?.has_draft,
    draft_updated_at: fallback?.draft_updated_at,
    draft_updated_by_email: fallback?.draft_updated_by_email,
    live_updated_at: fallback?.live_updated_at,
    live_updated_by_email: fallback?.live_updated_by_email,
    live_state: fallback?.live_state,
  }
}

function extractPageStructureImageRefs(modules: PageStructureModule[]): string[] {
  void modules
  return []
}

function buildPageStructureSummary(modules: PageStructureModule[]): PageStructureSummary {
  const imageRefs = extractPageStructureImageRefs(modules)
  return {
    moduleCount: modules.length,
    visibleCount: modules.filter((module) => module.status !== 'removed' && module.isVisible).length,
    addedCount: modules.filter((module) => module.status === 'added').length,
    removedCount: modules.filter((module) => module.status === 'removed').length,
    hiddenCount: modules.filter((module) => module.status === 'hidden' || !module.isVisible).length,
    imageCount: imageRefs.length,
  }
}

function pageStructureHashFromModules(modules: PageStructureModule[]) {
  const comparable = modules
    .map((module) => ({
      moduleKey: module.moduleKey,
      rendererKey: module.rendererKey,
      moduleType: module.moduleType,
      sortOrder: Number(module.sortOrder) || 0,
      isVisible: module.isVisible,
      status: module.status,
      locked: module.locked,
      required: module.required,
      sourceModuleKey: module.sourceModuleKey,
      createdFromTemplate: module.createdFromTemplate,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.moduleKey.localeCompare(b.moduleKey))

  return createHash('sha256').update(JSON.stringify(comparable)).digest('hex')
}

function sortPageStructureModules(modules: PageStructureModule[]) {
  return [...modules].sort((a, b) => a.sortOrder - b.sortOrder || a.moduleKey.localeCompare(b.moduleKey))
}

function shortModuleKeySuffix() {
  return randomUUID().replace(/-/g, '').slice(0, 6)
}

function countTemplateInstances(modules: PageStructureModule[], template: PageModuleTemplate) {
  return modules.filter((module) => (
    module.status !== 'removed' &&
    (module.createdFromTemplate === template.templateId || module.moduleType === template.moduleType)
  )).length
}

function nextHomeInsertSortOrder(modules: PageStructureModule[]) {
  const credentials = modules.find((module) => module.moduleKey === 'credentials')
  const base = Number(credentials?.sortOrder) || 20
  const insertAreaModules = modules.filter((module) => (
    module.status !== 'removed' &&
    module.moduleKey !== 'hero' &&
    module.moduleKey !== 'credentials' &&
    Number(module.sortOrder) > base
  ))
  const highest = insertAreaModules.reduce((max, module) => Math.max(max, Number(module.sortOrder) || 0), base)
  return highest + 10
}

function buildTemplateModuleInput(template: PageModuleTemplate, sortOrder: number): PageModuleInput {
  const content = clonePageModuleTemplateContent(template)
  return {
    title_zh: content.title_zh,
    title_en: content.title_en,
    description_zh: content.description_zh,
    description_en: content.description_en,
    items: content.items,
    is_visible: content.is_visible,
    sort_order: sortOrder,
  }
}

function isTemplateBackedLivePageModule(pageModule: PageModuleRow) {
  return isTemplateBackedPageModule(pageModule.page_key, pageModule.module_type)
}

function isTemplateBackedStructureModule(pageKey: string, structureModule: PageStructureModule) {
  if (pageKey !== 'home') return false
  const template = structureModule.createdFromTemplate
    ? getPageModuleTemplate(structureModule.createdFromTemplate)
    : getPageModuleTemplateByModuleType(structureModule.moduleType)

  if (!template || !isPageModuleTemplateAllowedOnPage(template, pageKey)) return false
  return (
    structureModule.moduleType === template.moduleType ||
    structureModule.rendererKey === template.rendererKey ||
    structureModule.createdFromTemplate === template.templateId
  )
}

function getSafeHomeInsertModules(modules: PageStructureModule[]) {
  return sortPageStructureModules(
    modules.filter((structureModule) => (
      structureModule.status !== 'removed' &&
      !structureModule.locked &&
      !structureModule.required &&
      isTemplateBackedStructureModule('home', structureModule)
    )),
  )
}

async function updatePageStructureDraftModules(pageKey: string, modules: PageStructureModule[], adminId: string) {
  const normalizedModules = sortPageStructureModules(modules)
  const summary = buildPageStructureSummary(normalizedModules)
  const imageRefs = extractPageStructureImageRefs(normalizedModules)

  await ensurePageStructureDraftsSchema()
  await pool.query(
    `UPDATE page_structure_drafts
     SET modules = $2::jsonb,
         updated_by = $3,
         updated_at = NOW(),
         draft_status = 'active',
         schema_version = $4,
         summary = $5::jsonb,
         image_refs = $6::jsonb
     WHERE page_key = $1`,
    [
      pageKey,
      JSON.stringify(normalizedModules),
      adminId,
      PAGE_STRUCTURE_SCHEMA_VERSION,
      JSON.stringify(summary),
      JSON.stringify(imageRefs),
    ],
  )
}

function latestModuleUpdatedAt(modules: PageModuleRow[]) {
  return modules
    .map((module) => module.updated_at)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null
}

export function getDefaultPageModule(pageKey: string, moduleKey: string): PageModuleRow | null {
  return DEFAULT_PAGE_MODULES.find((pageModule) => pageModule.page_key === pageKey && pageModule.module_key === moduleKey) ?? null
}

export function listDefaultPageModules(pageKey?: string): PageModuleRow[] {
  return DEFAULT_PAGE_MODULES
    .filter((pageModule) => !pageKey || pageModule.page_key === pageKey)
    .map((pageModule) => ({ ...pageModule, items: pageModule.items.map((item) => ({ ...item })) }))
    .sort((a, b) => a.page_key.localeCompare(b.page_key) || a.sort_order - b.sort_order)
}

export async function ensurePageModulesSchema() {
  schemaReady ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_modules (
        id             TEXT        PRIMARY KEY,
        page_key       TEXT        NOT NULL,
        module_key     TEXT        NOT NULL,
        module_type    TEXT        NOT NULL DEFAULT 'fixed-content',
        title_zh       TEXT        NOT NULL DEFAULT '',
        title_en       TEXT        NOT NULL DEFAULT '',
        description_zh TEXT        NOT NULL DEFAULT '',
        description_en TEXT        NOT NULL DEFAULT '',
        items          JSONB       NOT NULL DEFAULT '[]',
        is_visible     BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order     INTEGER     NOT NULL DEFAULT 0,
        updated_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (page_key, module_key)
      )
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_page_modules_page
        ON page_modules (page_key, sort_order)
    `)
  })()

  return schemaReady
}

export async function ensurePageModuleSnapshotsSchema() {
  snapshotSchemaReady ??= (async () => {
    await ensurePageModulesSchema()
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_module_snapshots (
        id             TEXT        PRIMARY KEY,
        page_key       TEXT        NOT NULL,
        module_key     TEXT        NOT NULL,
        module_id      TEXT        NOT NULL,
        module_type    TEXT        NOT NULL DEFAULT 'fixed-content',
        title_zh       TEXT        NOT NULL DEFAULT '',
        title_en       TEXT        NOT NULL DEFAULT '',
        description_zh TEXT        NOT NULL DEFAULT '',
        description_en TEXT        NOT NULL DEFAULT '',
        items          JSONB       NOT NULL DEFAULT '[]',
        is_visible     BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order     INTEGER     NOT NULL DEFAULT 0,
        created_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_page_module_snapshots_module
        ON page_module_snapshots (page_key, module_key, created_at DESC)
    `)
  })()

  return snapshotSchemaReady
}

export async function ensurePageModuleDraftsSchema() {
  draftSchemaReady ??= (async () => {
    await ensurePageModulesSchema()
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_module_drafts (
        id              TEXT        PRIMARY KEY,
        page_key        TEXT        NOT NULL,
        module_key      TEXT        NOT NULL,
        module_type     TEXT        NOT NULL DEFAULT 'fixed-content',
        title_zh        TEXT        NOT NULL DEFAULT '',
        title_en        TEXT        NOT NULL DEFAULT '',
        description_zh  TEXT        NOT NULL DEFAULT '',
        description_en  TEXT        NOT NULL DEFAULT '',
        items           JSONB       NOT NULL DEFAULT '[]',
        is_visible      BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order      INTEGER     NOT NULL DEFAULT 0,
        base_updated_at TIMESTAMPTZ,
        updated_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (page_key, module_key)
      )
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_page_module_drafts_page
        ON page_module_drafts (page_key, sort_order)
    `)
  })()

  return draftSchemaReady
}

export async function ensurePageStructureDraftsSchema() {
  structureDraftSchemaReady ??= (async () => {
    await ensurePageModulesSchema()
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_structure_drafts (
        id              TEXT        PRIMARY KEY,
        page_key        TEXT        NOT NULL UNIQUE,
        base_hash       TEXT        NOT NULL DEFAULT '',
        base_updated_at TIMESTAMPTZ,
        modules         JSONB       NOT NULL DEFAULT '[]',
        updated_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        draft_status    TEXT        NOT NULL DEFAULT 'active',
        schema_version  INTEGER     NOT NULL DEFAULT 1,
        summary         JSONB       NOT NULL DEFAULT '{}',
        image_refs      JSONB       NOT NULL DEFAULT '[]'
      )
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_page_structure_drafts_page
        ON page_structure_drafts (page_key, updated_at DESC)
    `)
  })()

  return structureDraftSchemaReady
}

export async function ensurePageStructureSnapshotsSchema() {
  structureSnapshotSchemaReady ??= (async () => {
    await ensurePageStructureDraftsSchema()
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_structure_snapshots (
        id             TEXT        PRIMARY KEY,
        page_key       TEXT        NOT NULL,
        base_hash      TEXT        NOT NULL DEFAULT '',
        modules        JSONB       NOT NULL DEFAULT '[]',
        created_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        schema_version INTEGER     NOT NULL DEFAULT 1,
        summary        JSONB       NOT NULL DEFAULT '{}',
        image_refs     JSONB       NOT NULL DEFAULT '[]'
      )
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_page_structure_snapshots_page
        ON page_structure_snapshots (page_key, created_at DESC)
    `)
  })()

  return structureSnapshotSchemaReady
}

export async function seedDefaultPageModules() {
  seededReady ??= (async () => {
    await ensurePageModulesSchema()
    for (const pageModule of DEFAULT_PAGE_MODULES) {
      await pool.query(
        `INSERT INTO page_modules (
           id, page_key, module_key, module_type, title_zh, title_en,
           description_zh, description_en, items, is_visible, sort_order
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
         ON CONFLICT (page_key, module_key)
         DO UPDATE SET
           module_type = EXCLUDED.module_type,
           title_zh = EXCLUDED.title_zh,
           title_en = EXCLUDED.title_en,
           description_zh = EXCLUDED.description_zh,
           description_en = EXCLUDED.description_en,
           items = EXCLUDED.items,
           is_visible = EXCLUDED.is_visible,
           sort_order = EXCLUDED.sort_order
         WHERE page_modules.updated_by IS NULL AND page_modules.items = '[]'::jsonb`,
        [
          pageModule.id,
          pageModule.page_key,
          pageModule.module_key,
          pageModule.module_type,
          pageModule.title_zh,
          pageModule.title_en,
          pageModule.description_zh,
          pageModule.description_en,
          JSON.stringify(pageModule.items),
          pageModule.is_visible,
          pageModule.sort_order,
        ],
      )
    }
  })()

  return seededReady
}

export async function listPageModules(pageKey?: string): Promise<PageModuleRow[]> {
  await ensurePageModulesSchema()
  const params: string[] = []
  const where = pageKey ? 'WHERE pm.page_key = $1' : ''
  if (pageKey) params.push(pageKey)

  const res = await pool.query<DbPageModuleRow>(
    `SELECT
       pm.id,
       pm.page_key,
       pm.module_key,
       pm.module_type,
       pm.title_zh,
       pm.title_en,
       pm.description_zh,
       pm.description_en,
       pm.items,
       pm.is_visible,
       pm.sort_order,
       pm.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_modules pm
     LEFT JOIN users u ON u.id = pm.updated_by
     ${where}
     ORDER BY pm.page_key ASC, pm.sort_order ASC`,
    params,
  )

  return res.rows.map(normalizeRow)
}

export async function getPageModule(pageKey: string, moduleKey: string): Promise<PageModuleRow | null> {
  await ensurePageModulesSchema()
  const res = await pool.query<DbPageModuleRow>(
    `SELECT
       pm.id,
       pm.page_key,
       pm.module_key,
       pm.module_type,
       pm.title_zh,
       pm.title_en,
       pm.description_zh,
       pm.description_en,
       pm.items,
       pm.is_visible,
       pm.sort_order,
       pm.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_modules pm
     LEFT JOIN users u ON u.id = pm.updated_by
     WHERE pm.page_key = $1 AND pm.module_key = $2
     LIMIT 1`,
    [pageKey, moduleKey],
  )

  return res.rows[0] ? normalizeRow(res.rows[0]) : null
}

export async function listPublishedPageModules(pageKey?: string): Promise<PageModuleRow[]> {
  await ensurePageModulesSchema()
  const params: string[] = []
  const where = ['pm.is_visible = TRUE']
  if (pageKey) {
    params.push(pageKey)
    where.push(`pm.page_key = $${params.length}`)
  }

  const res = await pool.query<DbPageModuleRow>(
    `SELECT
       pm.id,
       pm.page_key,
       pm.module_key,
       pm.module_type,
       pm.title_zh,
       pm.title_en,
       pm.description_zh,
       pm.description_en,
       pm.items,
       pm.is_visible,
       pm.sort_order,
       pm.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_modules pm
     LEFT JOIN users u ON u.id = pm.updated_by
     WHERE ${where.join(' AND ')}
     ORDER BY pm.page_key ASC, pm.sort_order ASC`,
    params,
  )

  return res.rows.map(normalizePublishedRow)
}

export async function getPublishedPageModule(pageKey: string, moduleKey: string): Promise<PageModuleRow | null> {
  await ensurePageModulesSchema()
  const res = await pool.query<DbPageModuleRow>(
    `SELECT
       pm.id,
       pm.page_key,
       pm.module_key,
       pm.module_type,
       pm.title_zh,
       pm.title_en,
       pm.description_zh,
       pm.description_en,
       pm.items,
       pm.is_visible,
       pm.sort_order,
       pm.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_modules pm
     LEFT JOIN users u ON u.id = pm.updated_by
     WHERE pm.page_key = $1
       AND pm.module_key = $2
       AND pm.is_visible = TRUE
     LIMIT 1`,
    [pageKey, moduleKey],
  )

  return res.rows[0] ? normalizePublishedRow(res.rows[0]) : null
}

export async function getPageModuleDraft(pageKey: string, moduleKey: string): Promise<PageModuleRow | null> {
  await ensurePageModuleDraftsSchema()
  const res = await pool.query<DbPageModuleDraftRow>(
    `SELECT
       d.id,
       d.page_key,
       d.module_key,
       d.module_type,
       d.title_zh,
       d.title_en,
       d.description_zh,
       d.description_en,
       d.items,
       d.is_visible,
       d.sort_order,
       d.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_module_drafts d
     LEFT JOIN users u ON u.id = d.updated_by
     WHERE d.page_key = $1 AND d.module_key = $2
     LIMIT 1`,
    [pageKey, moduleKey],
  )

  return res.rows[0] ? normalizeDraftRow(res.rows[0]) : null
}

async function listPageModuleDrafts(pageKey: string): Promise<PageModuleRow[]> {
  await ensurePageModuleDraftsSchema()
  const res = await pool.query<DbPageModuleDraftRow>(
    `SELECT
       d.id,
       d.page_key,
       d.module_key,
       d.module_type,
       d.title_zh,
       d.title_en,
       d.description_zh,
       d.description_en,
       d.items,
       d.is_visible,
       d.sort_order,
       d.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_module_drafts d
     LEFT JOIN users u ON u.id = d.updated_by
     WHERE d.page_key = $1
     ORDER BY d.sort_order ASC, d.module_key ASC`,
    [pageKey],
  )

  return res.rows.map(normalizeDraftRow)
}

export async function listPageModulesForVisualEditor(pageKey?: string): Promise<PageModuleRow[]> {
  const liveModules = await listPageModules(pageKey)
  await ensurePageModuleDraftsSchema()

  const params: string[] = []
  const where = pageKey ? 'WHERE d.page_key = $1' : ''
  if (pageKey) params.push(pageKey)

  const draftsRes = await pool.query<DbPageModuleDraftRow>(
    `SELECT
       d.id,
       d.page_key,
       d.module_key,
       d.module_type,
       d.title_zh,
       d.title_en,
       d.description_zh,
       d.description_en,
       d.items,
       d.is_visible,
       d.sort_order,
       d.updated_at::text AS updated_at,
       u.email AS updated_by_email
     FROM page_module_drafts d
     LEFT JOIN users u ON u.id = d.updated_by
     ${where}
     ORDER BY d.page_key ASC, d.sort_order ASC`,
    params,
  )

  const draftsByModule = new Map(
    draftsRes.rows.map((row) => [`${row.page_key}:${row.module_key}`, normalizeDraftRow(row)]),
  )

  return liveModules
    .map((live) => {
      const draft = draftsByModule.get(`${live.page_key}:${live.module_key}`)
      if (!draft) {
        return {
          ...live,
          has_draft: false,
          draft_updated_at: null,
          draft_updated_by_email: null,
          live_updated_at: live.updated_at,
          live_updated_by_email: live.updated_by_email,
          live_state: pageModuleToLiveState(live),
        }
      }

      return {
        ...draft,
        has_draft: true,
        live_updated_at: live.updated_at,
        live_updated_by_email: live.updated_by_email,
        live_state: pageModuleToLiveState(live),
      }
    })
    .sort((a, b) => a.page_key.localeCompare(b.page_key) || a.sort_order - b.sort_order)
}

export async function getPageModuleForPreview(
  pageKey: string,
  moduleKey: string,
  includeDraft: boolean,
): Promise<PageModuleRow | null> {
  if (includeDraft) {
    const draft = await getPageModuleDraft(pageKey, moduleKey)
    if (draft) return draft
  }

  return getPageModule(pageKey, moduleKey)
}

export async function listPageModulesForPreview(
  pageKey: string,
  includeDraft: boolean,
): Promise<PageModuleRow[]> {
  if (includeDraft) {
    const structureDraft = await getPageStructureDraft(pageKey)
    if (structureDraft && structureDraft.draft_status !== 'discarded') {
      const liveModules = await listPageModules(pageKey)
      const liveByKey = new Map(liveModules.map((pageModule) => [pageModule.module_key, pageModule]))
      const moduleDrafts = await listPageModuleDrafts(pageKey)
      const draftsByKey = new Map(moduleDrafts.map((draft) => [draft.module_key, draft]))

      const modules = structureDraft.modules
        .filter((module) => module.status !== 'removed')
        .map((module) => {
          const contentSource = draftsByKey.get(module.moduleKey) ?? liveByKey.get(module.moduleKey)
          return structureModuleToPageModule(pageKey, module, contentSource)
        })

      return modules
        .sort((a, b) => a.sort_order - b.sort_order || a.module_key.localeCompare(b.module_key))
    }

    return listPageModulesForVisualEditor(pageKey)
  }
  return listPageModules(pageKey)
}

export async function getPageStructureDraft(pageKey: string): Promise<PageStructureDraftRow | null> {
  await ensurePageStructureDraftsSchema()
  const res = await pool.query<DbPageStructureDraftRow>(
    `SELECT
       d.id,
       d.page_key,
       d.base_hash,
       d.base_updated_at::text AS base_updated_at,
       d.modules,
       d.updated_at::text AS updated_at,
       u.email AS updated_by_email,
       d.draft_status,
       d.schema_version,
       d.summary,
       d.image_refs
     FROM page_structure_drafts d
     LEFT JOIN users u ON u.id = d.updated_by
     WHERE d.page_key = $1
     LIMIT 1`,
    [pageKey],
  )

  return res.rows[0] ? normalizeStructureDraftRow(res.rows[0]) : null
}

export async function listPageStructureDrafts(): Promise<PageStructureDraftRow[]> {
  await ensurePageStructureDraftsSchema()
  const res = await pool.query<DbPageStructureDraftRow>(
    `SELECT
       d.id,
       d.page_key,
       d.base_hash,
       d.base_updated_at::text AS base_updated_at,
       d.modules,
       d.updated_at::text AS updated_at,
       u.email AS updated_by_email,
       d.draft_status,
       d.schema_version,
       d.summary,
       d.image_refs
     FROM page_structure_drafts d
     LEFT JOIN users u ON u.id = d.updated_by
     ORDER BY d.page_key ASC`,
  )

  return res.rows.map(normalizeStructureDraftRow)
}

export async function createPageStructureDraft(pageKey: string, adminId: string): Promise<PageStructureDraftRow> {
  const existing = await getPageStructureDraft(pageKey)
  if (existing && existing.draft_status !== 'discarded') return existing

  const liveModules = await listPageModules(pageKey)
  const modules = liveModules.map(pageModuleToStructureModule)
  const baseModules = modules
  const baseHash = pageStructureHashFromModules(baseModules)
  const baseUpdatedAt = latestModuleUpdatedAt(liveModules)
  const summary = buildPageStructureSummary(modules)
  const imageRefs = extractPageStructureImageRefs(modules)
  const id = existing?.id ?? randomUUID()

  await ensurePageStructureDraftsSchema()
  await pool.query(
    `INSERT INTO page_structure_drafts (
       id, page_key, base_hash, base_updated_at, modules, updated_by,
       updated_at, draft_status, schema_version, summary, image_refs
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW(), 'active', $7, $8::jsonb, $9::jsonb)
     ON CONFLICT (page_key)
     DO UPDATE SET
       base_hash = EXCLUDED.base_hash,
       base_updated_at = EXCLUDED.base_updated_at,
       modules = EXCLUDED.modules,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW(),
       draft_status = 'active',
       schema_version = EXCLUDED.schema_version,
       summary = EXCLUDED.summary,
       image_refs = EXCLUDED.image_refs`,
    [
      id,
      pageKey,
      baseHash,
      baseUpdatedAt,
      JSON.stringify(modules),
      adminId,
      PAGE_STRUCTURE_SCHEMA_VERSION,
      JSON.stringify(summary),
      JSON.stringify(imageRefs),
    ],
  )

  const draft = await getPageStructureDraft(pageKey)
  if (!draft) throw new Error('Failed to create page structure draft')
  return draft
}

export async function deletePageStructureDraft(pageKey: string): Promise<boolean> {
  await ensurePageStructureDraftsSchema()
  const draft = await getPageStructureDraft(pageKey)
  const addedModuleKeys = draft?.modules
    .filter((module) => module.status === 'added')
    .map((module) => module.moduleKey) ?? []
  if (addedModuleKeys.length > 0) await ensurePageModuleDraftsSchema()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (addedModuleKeys.length > 0) {
      await client.query(
        `DELETE FROM page_module_drafts
         WHERE page_key = $1 AND module_key = ANY($2::text[])`,
        [pageKey, addedModuleKeys],
      )
    }

    const res = await client.query<{ id: string }>(
      `DELETE FROM page_structure_drafts
       WHERE page_key = $1
       RETURNING id`,
      [pageKey],
    )

    await client.query('COMMIT')
    return Boolean(res.rows[0]?.id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function addPageStructureDraftModule(
  pageKey: string,
  templateId: string,
  adminId: string,
): Promise<{ draft: PageStructureDraftRow; pageModule: PageModuleRow }> {
  const template = getPageModuleTemplate(templateId)
  if (!template || !isPageModuleTemplateAllowedOnPage(template, pageKey)) {
    throw new Error('Template not available for this page')
  }

  if (pageKey !== 'home') {
    throw new Error('Only Home supports adding modules in C4-2c')
  }

  const draft = await createPageStructureDraft(pageKey, adminId)
  if (draft.draft_status === 'stale') {
    throw new Error('Structure draft is stale')
  }

  if (countTemplateInstances(draft.modules, template) >= template.maxInstances) {
    throw new Error('Template instance limit reached')
  }

  const liveModules = await listPageModules(pageKey)
  const moduleDrafts = await listPageModuleDrafts(pageKey)
  const usedKeys = new Set([
    ...draft.modules.map((module) => module.moduleKey),
    ...liveModules.map((module) => module.module_key),
    ...moduleDrafts.map((module) => module.module_key),
  ])

  let moduleKey = ''
  for (let i = 0; i < 20; i += 1) {
    const candidate = `${template.templateId}-${shortModuleKeySuffix()}`
    if (!usedKeys.has(candidate)) {
      moduleKey = candidate
      break
    }
  }
  if (!moduleKey) throw new Error('Failed to generate module key')

  const sortOrder = nextHomeInsertSortOrder(draft.modules)
  const structureModule: PageStructureModule = {
    moduleKey,
    rendererKey: template.rendererKey,
    moduleType: template.moduleType,
    sortOrder,
    isVisible: true,
    status: 'added',
    locked: false,
    required: false,
    sourceModuleKey: null,
    createdFromTemplate: template.templateId,
  }
  const modules = sortPageStructureModules([...draft.modules, structureModule])
  const input = buildTemplateModuleInput(template, sortOrder)

  await updatePageStructureDraftModules(pageKey, modules, adminId)
  const pageModule = await savePageModuleDraft(pageKey, moduleKey, input, adminId, template.moduleType)
  const nextDraft = await getPageStructureDraft(pageKey)
  if (!nextDraft || !pageModule) throw new Error('Failed to add module to structure draft')

  return { draft: nextDraft, pageModule }
}

export async function deleteAddedPageStructureDraftModule(
  pageKey: string,
  moduleKey: string,
  adminId: string,
): Promise<PageStructureDraftRow | null> {
  const draft = await getPageStructureDraft(pageKey)
  if (!draft || draft.draft_status === 'discarded') return null

  const target = draft.modules.find((module) => module.moduleKey === moduleKey)
  if (!target) return draft
  if (target.status !== 'added') {
    throw new Error('Only draft-added modules can be deleted')
  }

  const modules = draft.modules.filter((module) => module.moduleKey !== moduleKey)
  await updatePageStructureDraftModules(pageKey, modules, adminId)
  await deletePageModuleDraft(pageKey, moduleKey)

  return getPageStructureDraft(pageKey)
}

export async function updatePageStructureDraftModuleVisibility(
  pageKey: string,
  moduleKey: string,
  isVisible: boolean,
  adminId: string,
): Promise<PageStructureDraftRow | null> {
  if (pageKey !== 'home') {
    throw new Error('Only Home supports structure module visibility in C4-2d')
  }

  const draft = await getPageStructureDraft(pageKey)
  if (!draft || draft.draft_status === 'discarded') return null
  if (draft.draft_status === 'stale') {
    throw new Error('Structure draft is stale')
  }

  const target = draft.modules.find((module) => module.moduleKey === moduleKey)
  if (!target) return null
  if (!isTemplateBackedStructureModule(pageKey, target) || target.locked || target.required || target.status === 'removed') {
    throw new Error('Only C4-2c template modules can be hidden or shown')
  }

  const modules = draft.modules.map((structureModule) => {
    if (structureModule.moduleKey !== moduleKey) return structureModule
    return {
      ...structureModule,
      isVisible,
      status: structureModule.status === 'added'
        ? 'added'
        : isVisible
          ? 'existing'
          : 'hidden',
    } satisfies PageStructureModule
  })

  await updatePageStructureDraftModules(pageKey, modules, adminId)
  return getPageStructureDraft(pageKey)
}

export async function reorderPageStructureDraftSafeHomeModules(
  pageKey: string,
  moduleKeys: string[],
  adminId: string,
): Promise<PageStructureDraftRow | null> {
  if (pageKey !== 'home') {
    throw new Error('Only Home supports structure module reorder in C4-2d')
  }

  const draft = await getPageStructureDraft(pageKey)
  if (!draft || draft.draft_status === 'discarded') return null
  if (draft.draft_status === 'stale') {
    throw new Error('Structure draft is stale')
  }

  const safeModules = getSafeHomeInsertModules(draft.modules)
  if (safeModules.length === 0) {
    throw new Error('No C4-2c template modules to reorder')
  }

  const uniqueModuleKeys = [...new Set(moduleKeys)]
  const safeKeys = safeModules.map((module) => module.moduleKey)
  const sameLength = uniqueModuleKeys.length === safeKeys.length
  const sameMembers = sameLength && safeKeys.every((key) => uniqueModuleKeys.includes(key))
  if (!sameMembers) {
    throw new Error('Reorder payload must contain only all Home safe insert modules')
  }

  const credentials = draft.modules.find((module) => module.moduleKey === 'credentials')
  const base = Number(credentials?.sortOrder) || 20
  const nextSortOrders = new Map(uniqueModuleKeys.map((moduleKey, index) => [moduleKey, base + (index + 1) * 10]))
  const modules = draft.modules.map((structureModule) => {
    const nextSortOrder = nextSortOrders.get(structureModule.moduleKey)
    if (!nextSortOrder) return structureModule
    return { ...structureModule, sortOrder: nextSortOrder }
  })

  await updatePageStructureDraftModules(pageKey, modules, adminId)
  return getPageStructureDraft(pageKey)
}

async function markPageStructureDraftStale(pageKey: string): Promise<PageStructureDraftRow | null> {
  await ensurePageStructureDraftsSchema()
  await pool.query(
    `UPDATE page_structure_drafts
     SET draft_status = 'stale',
         updated_at = NOW()
     WHERE page_key = $1`,
    [pageKey],
  )
  return getPageStructureDraft(pageKey)
}

export async function listPageStructureSnapshots(
  pageKey: string,
  limit = 20,
): Promise<PageStructureSnapshotRow[]> {
  await ensurePageStructureSnapshotsSchema()
  const safeLimit = Math.min(50, Math.max(1, limit))
  const res = await pool.query<DbPageStructureSnapshotRow>(
    `SELECT
       s.id,
       s.page_key,
       s.base_hash,
       s.modules,
       s.created_at::text AS created_at,
       u.email AS created_by_email,
       s.schema_version,
       s.summary,
       s.image_refs
     FROM page_structure_snapshots s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.page_key = $1
     ORDER BY s.created_at DESC
     LIMIT $2`,
    [pageKey, safeLimit],
  )

  return res.rows.map(normalizeStructureSnapshotRow)
}

export async function getPageStructureSnapshot(snapshotId: string): Promise<PageStructureSnapshotRow | null> {
  await ensurePageStructureSnapshotsSchema()
  const res = await pool.query<DbPageStructureSnapshotRow>(
    `SELECT
       s.id,
       s.page_key,
       s.base_hash,
       s.modules,
       s.created_at::text AS created_at,
       u.email AS created_by_email,
       s.schema_version,
       s.summary,
       s.image_refs
     FROM page_structure_snapshots s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.id = $1
     LIMIT 1`,
    [snapshotId],
  )

  return res.rows[0] ? normalizeStructureSnapshotRow(res.rows[0]) : null
}

export async function restorePageStructureSnapshotToDraft(
  pageKey: string,
  snapshotId: string,
  adminId: string,
): Promise<PageStructureDraftRow | null> {
  const snapshot = await getPageStructureSnapshot(snapshotId)
  if (!snapshot || snapshot.page_key !== pageKey) return null

  const existingDraft = await getPageStructureDraft(pageKey)
  const existingAddedModuleKeys = existingDraft?.modules
    .filter((module) => module.status === 'added')
    .map((module) => module.moduleKey) ?? []
  if (existingAddedModuleKeys.length > 0) await ensurePageModuleDraftsSchema()
  const liveModules = await listPageModules(pageKey)
  const baseModules = liveModules.map(pageModuleToStructureModule)
  const baseHash = pageStructureHashFromModules(baseModules)
  const baseUpdatedAt = latestModuleUpdatedAt(liveModules)
  const summary = buildPageStructureSummary(snapshot.modules)
  const imageRefs = extractPageStructureImageRefs(snapshot.modules)

  await ensurePageStructureDraftsSchema()
  if (existingAddedModuleKeys.length > 0) {
    await pool.query(
      `DELETE FROM page_module_drafts
       WHERE page_key = $1 AND module_key = ANY($2::text[])`,
      [pageKey, existingAddedModuleKeys],
    )
  }

  await pool.query(
    `INSERT INTO page_structure_drafts (
       id, page_key, base_hash, base_updated_at, modules, updated_by,
       updated_at, draft_status, schema_version, summary, image_refs
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW(), 'active', $7, $8::jsonb, $9::jsonb)
     ON CONFLICT (page_key)
     DO UPDATE SET
       base_hash = EXCLUDED.base_hash,
       base_updated_at = EXCLUDED.base_updated_at,
       modules = EXCLUDED.modules,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW(),
       draft_status = 'active',
       schema_version = EXCLUDED.schema_version,
       summary = EXCLUDED.summary,
       image_refs = EXCLUDED.image_refs`,
    [
      randomUUID(),
      pageKey,
      baseHash,
      baseUpdatedAt,
      JSON.stringify(snapshot.modules),
      adminId,
      PAGE_STRUCTURE_SCHEMA_VERSION,
      JSON.stringify(summary),
      JSON.stringify(imageRefs),
    ],
  )

  return getPageStructureDraft(pageKey)
}

export async function publishPageStructureDraft(
  pageKey: string,
  adminId: string,
): Promise<PageStructurePublishResult | null> {
  const draft = await getPageStructureDraft(pageKey)
  if (!draft) return null

  const liveModules = await listPageModules(pageKey)
  const liveStructureModules = liveModules.map(pageModuleToStructureModule)
  const currentHash = pageStructureHashFromModules(liveStructureModules)
  const draftHash = pageStructureHashFromModules(draft.modules)

  if (draftHash === currentHash) {
    return {
      conflict: false,
      noChanges: true,
      draft,
      publishedModules: [],
      currentHash,
    }
  }

  if (draft.base_hash && draft.base_hash !== currentHash) {
    const staleDraft = await markPageStructureDraftStale(pageKey)
    return {
      conflict: true,
      draft: staleDraft ?? draft,
      publishedModules: [],
      currentHash,
    }
  }

  await ensurePageStructureSnapshotsSchema()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const snapshotSummary = buildPageStructureSummary(liveStructureModules)
    const snapshotImageRefs = extractPageStructureImageRefs(liveStructureModules)
    await client.query(
      `INSERT INTO page_structure_snapshots (
         id, page_key, base_hash, modules, created_by, created_at,
         schema_version, summary, image_refs
       )
       VALUES ($1, $2, $3, $4::jsonb, $5, NOW(), $6, $7::jsonb, $8::jsonb)`,
      [
        randomUUID(),
        pageKey,
        currentHash,
        JSON.stringify(liveStructureModules),
        adminId,
        PAGE_STRUCTURE_SCHEMA_VERSION,
        JSON.stringify(snapshotSummary),
        JSON.stringify(snapshotImageRefs),
      ],
    )

    const liveByKey = new Map(liveModules.map((pageModule) => [pageModule.module_key, pageModule]))
    const draftContentByKey = new Map((await listPageModuleDrafts(pageKey)).map((pageModule) => [pageModule.module_key, pageModule]))
    const publishedAddedKeys: string[] = []
    const targetModuleKeys = new Set(draft.modules.map((structureModule) => structureModule.moduleKey))
    const liveModulesMissingFromTarget = liveModules.filter((pageModule) => !targetModuleKeys.has(pageModule.module_key))
    const removableLiveOnlyKeys: string[] = []

    for (const pageModule of liveModulesMissingFromTarget) {
      if (!isTemplateBackedLivePageModule(pageModule)) {
        throw new Error(`Cannot remove non-template module missing from target structure: ${pageKey}:${pageModule.module_key}`)
      }
      removableLiveOnlyKeys.push(pageModule.module_key)
    }

    for (const structureModule of draft.modules) {
      if (structureModule.status === 'removed') {
        await client.query(
          `UPDATE page_modules
           SET is_visible = FALSE,
               sort_order = $3,
               updated_by = $4,
               updated_at = NOW()
           WHERE page_key = $1 AND module_key = $2`,
          [pageKey, structureModule.moduleKey, structureModule.sortOrder, adminId],
        )
        continue
      }

      if (structureModule.status === 'added') {
        const draftContent = draftContentByKey.get(structureModule.moduleKey)
        if (!draftContent) {
          throw new Error(`Cannot publish added module without content draft: ${pageKey}:${structureModule.moduleKey}`)
        }

        const inserted = await client.query(
          `INSERT INTO page_modules (
             id, page_key, module_key, module_type, title_zh, title_en,
             description_zh, description_en, items, is_visible, sort_order, updated_by, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, NOW())
           ON CONFLICT (page_key, module_key)
           DO NOTHING`,
          [
            `${pageKey}:${structureModule.moduleKey}`,
            pageKey,
            structureModule.moduleKey,
            structureModule.moduleType,
            draftContent.title_zh,
            draftContent.title_en,
            draftContent.description_zh,
            draftContent.description_en,
            JSON.stringify(draftContent.items),
            structureModule.isVisible,
            structureModule.sortOrder,
            adminId,
          ],
        )
        if (inserted.rowCount !== 1) {
          throw new Error(`Failed to insert added module: ${pageKey}:${structureModule.moduleKey}`)
        }
        publishedAddedKeys.push(structureModule.moduleKey)
        continue
      }

      if (!liveByKey.has(structureModule.moduleKey)) {
        throw new Error(`Cannot publish structure module without live module: ${pageKey}:${structureModule.moduleKey}`)
      }

      await client.query(
        `UPDATE page_modules
         SET module_type = $3,
             is_visible = $4,
             sort_order = $5,
             updated_by = $6,
             updated_at = NOW()
         WHERE page_key = $1 AND module_key = $2`,
        [
          pageKey,
          structureModule.moduleKey,
          structureModule.moduleType,
          structureModule.status === 'hidden' ? false : structureModule.isVisible,
          structureModule.sortOrder,
          adminId,
        ],
      )
    }

    if (removableLiveOnlyKeys.length > 0) {
      await client.query(
        `DELETE FROM page_modules
         WHERE page_key = $1 AND module_key = ANY($2::text[])`,
        [pageKey, removableLiveOnlyKeys],
      )
      await client.query(
        `DELETE FROM page_module_drafts
         WHERE page_key = $1 AND module_key = ANY($2::text[])`,
        [pageKey, removableLiveOnlyKeys],
      )
    }

    await client.query(
      `DELETE FROM page_structure_drafts
       WHERE page_key = $1`,
      [pageKey],
    )

    if (publishedAddedKeys.length > 0) {
      await client.query(
        `DELETE FROM page_module_drafts
         WHERE page_key = $1 AND module_key = ANY($2::text[])`,
        [pageKey, publishedAddedKeys],
      )
    }

    await client.query(
      `DELETE FROM page_structure_snapshots
       WHERE page_key = $1
         AND id NOT IN (
           SELECT id
           FROM page_structure_snapshots
           WHERE page_key = $1
           ORDER BY created_at DESC
           LIMIT $2
         )`,
      [pageKey, 30],
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return {
    conflict: false,
    draft,
    publishedModules: await listPageModules(pageKey),
  }
}

export async function savePageModuleDraft(
  pageKey: string,
  moduleKey: string,
  input: PageModuleInput,
  adminId: string,
  moduleTypeOverride?: string,
): Promise<PageModuleRow | null> {
  await ensurePageModuleDraftsSchema()
  const live = await getPageModule(pageKey, moduleKey)
  const fallback = getDefaultPageModule(pageKey, moduleKey)
  const structureDraft = !live && !fallback ? await getPageStructureDraft(pageKey) : null
  const structureDraftModule = structureDraft?.modules.find((module) => module.moduleKey === moduleKey)
  const moduleType = moduleTypeOverride ?? live?.module_type ?? fallback?.module_type ?? structureDraftModule?.moduleType ?? 'fixed-content'
  const id = live?.id ?? fallback?.id ?? `${pageKey}:${moduleKey}`
  const baseUpdatedAt = live?.updated_at || null

  await pool.query(
    `INSERT INTO page_module_drafts (
       id, page_key, module_key, module_type, title_zh, title_en,
       description_zh, description_en, items, is_visible, sort_order,
       base_updated_at, updated_by, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, NOW())
     ON CONFLICT (page_key, module_key)
     DO UPDATE SET
       title_zh = EXCLUDED.title_zh,
       title_en = EXCLUDED.title_en,
       description_zh = EXCLUDED.description_zh,
       description_en = EXCLUDED.description_en,
       items = EXCLUDED.items,
       is_visible = EXCLUDED.is_visible,
       sort_order = EXCLUDED.sort_order,
       base_updated_at = EXCLUDED.base_updated_at,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()`,
    [
      id,
      pageKey,
      moduleKey,
      moduleType,
      input.title_zh,
      input.title_en,
      input.description_zh,
      input.description_en,
      JSON.stringify(input.items),
      input.is_visible,
      input.sort_order,
      baseUpdatedAt,
      adminId,
    ],
  )

  const draft = await getPageModuleDraft(pageKey, moduleKey)
  if (!draft) return null

  return {
    ...draft,
    live_updated_at: live?.updated_at ?? null,
    live_updated_by_email: live?.updated_by_email ?? null,
    live_state: live ? pageModuleToLiveState(live) : null,
  }
}

export async function deletePageModuleDraft(pageKey: string, moduleKey: string): Promise<boolean> {
  await ensurePageModuleDraftsSchema()
  const res = await pool.query<{ id: string }>(
    `DELETE FROM page_module_drafts
     WHERE page_key = $1 AND module_key = $2
     RETURNING id`,
    [pageKey, moduleKey],
  )

  return Boolean(res.rows[0]?.id)
}

export async function updatePageModule(
  pageKey: string,
  moduleKey: string,
  input: PageModuleInput,
  adminId: string,
): Promise<PageModuleRow | null> {
  const existing = await getPageModule(pageKey, moduleKey)
  const fallback = getDefaultPageModule(pageKey, moduleKey)
  const moduleType = existing?.module_type ?? fallback?.module_type ?? 'fixed-content'
  const id = existing?.id ?? fallback?.id ?? `${pageKey}:${moduleKey}`

  await pool.query(
    `INSERT INTO page_modules (
       id, page_key, module_key, module_type, title_zh, title_en,
       description_zh, description_en, items, is_visible, sort_order, updated_by, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, NOW())
     ON CONFLICT (page_key, module_key)
     DO UPDATE SET
       title_zh = EXCLUDED.title_zh,
       title_en = EXCLUDED.title_en,
       description_zh = EXCLUDED.description_zh,
       description_en = EXCLUDED.description_en,
       items = EXCLUDED.items,
       is_visible = EXCLUDED.is_visible,
       sort_order = EXCLUDED.sort_order,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()`,
    [
      id,
      pageKey,
      moduleKey,
      moduleType,
      input.title_zh,
      input.title_en,
      input.description_zh,
      input.description_en,
      JSON.stringify(input.items),
      input.is_visible,
      input.sort_order,
      adminId,
    ],
  )

  return getPageModule(pageKey, moduleKey)
}

export function pageModuleInputChanged(pageModule: PageModuleRow, input: PageModuleInput) {
  return JSON.stringify({
    title_zh: pageModule.title_zh,
    title_en: pageModule.title_en,
    description_zh: pageModule.description_zh,
    description_en: pageModule.description_en,
    items: pageModule.items,
    is_visible: pageModule.is_visible,
    sort_order: Number(pageModule.sort_order) || 0,
  }) !== JSON.stringify({
    title_zh: input.title_zh,
    title_en: input.title_en,
    description_zh: input.description_zh,
    description_en: input.description_en,
    items: input.items,
    is_visible: input.is_visible,
    sort_order: Number(input.sort_order) || 0,
  })
}

export async function createPageModuleSnapshot(pageModule: PageModuleRow, adminId: string) {
  await ensurePageModuleSnapshotsSchema()
  const id = randomUUID()

  await pool.query(
    `INSERT INTO page_module_snapshots (
       id, page_key, module_key, module_id, module_type, title_zh, title_en,
       description_zh, description_en, items, is_visible, sort_order, created_by, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, NOW())`,
    [
      id,
      pageModule.page_key,
      pageModule.module_key,
      pageModule.id,
      pageModule.module_type,
      pageModule.title_zh,
      pageModule.title_en,
      pageModule.description_zh,
      pageModule.description_en,
      JSON.stringify(pageModule.items),
      pageModule.is_visible,
      pageModule.sort_order,
      adminId,
    ],
  )

  return id
}

export async function prunePageModuleSnapshots(pageKey: string, moduleKey: string, keep = 30) {
  await ensurePageModuleSnapshotsSchema()
  const safeKeep = Math.min(100, Math.max(1, keep))

  await pool.query(
    `DELETE FROM page_module_snapshots
     WHERE page_key = $1
       AND module_key = $2
       AND id NOT IN (
         SELECT id
         FROM page_module_snapshots
         WHERE page_key = $1 AND module_key = $2
         ORDER BY created_at DESC
         LIMIT $3
       )`,
    [pageKey, moduleKey, safeKeep],
  )
}

export async function listPageModuleSnapshots(
  pageKey: string,
  moduleKey: string,
  limit = 20,
): Promise<PageModuleSnapshotRow[]> {
  await ensurePageModuleSnapshotsSchema()
  const safeLimit = Math.min(50, Math.max(1, limit))

  const res = await pool.query<DbPageModuleSnapshotRow>(
    `SELECT
       s.id,
       s.page_key,
       s.module_key,
       s.module_id,
       s.module_type,
       s.title_zh,
       s.title_en,
       s.description_zh,
       s.description_en,
       s.items,
       s.is_visible,
       s.sort_order,
       s.created_at::text AS created_at,
       u.email AS created_by_email
     FROM page_module_snapshots s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.page_key = $1 AND s.module_key = $2
     ORDER BY s.created_at DESC
     LIMIT $3`,
    [pageKey, moduleKey, safeLimit],
  )

  return res.rows.map(normalizeSnapshotRow)
}

export async function getPageModuleSnapshot(snapshotId: string): Promise<PageModuleSnapshotRow | null> {
  await ensurePageModuleSnapshotsSchema()

  const res = await pool.query<DbPageModuleSnapshotRow>(
    `SELECT
       s.id,
       s.page_key,
       s.module_key,
       s.module_id,
       s.module_type,
       s.title_zh,
       s.title_en,
       s.description_zh,
       s.description_en,
       s.items,
       s.is_visible,
       s.sort_order,
       s.created_at::text AS created_at,
       u.email AS created_by_email
     FROM page_module_snapshots s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.id = $1
     LIMIT 1`,
    [snapshotId],
  )

  return res.rows[0] ? normalizeSnapshotRow(res.rows[0]) : null
}

export async function restorePageModuleSnapshot(
  pageKey: string,
  moduleKey: string,
  snapshotId: string,
  adminId: string,
): Promise<PageModuleRow | null> {
  const snapshot = await getPageModuleSnapshot(snapshotId)
  if (!snapshot || snapshot.page_key !== pageKey || snapshot.module_key !== moduleKey) return null

  const current = await getPageModule(pageKey, moduleKey)
  if (current) {
    await createPageModuleSnapshot(current, adminId)
  }

  const restored = await updatePageModule(
    pageKey,
    moduleKey,
    {
      title_zh: snapshot.title_zh,
      title_en: snapshot.title_en,
      description_zh: snapshot.description_zh,
      description_en: snapshot.description_en,
      items: snapshot.items,
      is_visible: snapshot.is_visible,
      sort_order: snapshot.sort_order,
    },
    adminId,
  )

  await prunePageModuleSnapshots(pageKey, moduleKey)
  return restored
}

export async function publishPageModuleDraft(
  pageKey: string,
  moduleKey: string,
  adminId: string,
): Promise<PageModuleRow | null> {
  const structureDraft = await getPageStructureDraft(pageKey)
  const structureDraftModule = structureDraft?.modules.find((module) => module.moduleKey === moduleKey)
  if (structureDraftModule?.status === 'added') {
    throw new Error('Draft-added modules must be published through the page structure draft')
  }

  const draft = await getPageModuleDraft(pageKey, moduleKey)
  if (!draft) return null

  const live = await getPageModule(pageKey, moduleKey)
  const input = pageModuleToInput(draft)

  if (live && pageModuleInputChanged(live, input)) {
    await createPageModuleSnapshot(live, adminId)
  }

  const published = await updatePageModule(pageKey, moduleKey, input, adminId)
  if (!published) return null

  await deletePageModuleDraft(pageKey, moduleKey)
  await prunePageModuleSnapshots(pageKey, moduleKey)

  return {
    ...published,
    has_draft: false,
    draft_updated_at: null,
    draft_updated_by_email: null,
    live_updated_at: published.updated_at,
    live_updated_by_email: published.updated_by_email,
    live_state: pageModuleToLiveState(published),
  }
}

export async function restorePageModuleSnapshotToDraft(
  pageKey: string,
  moduleKey: string,
  snapshotId: string,
  adminId: string,
): Promise<PageModuleRow | null> {
  const snapshot = await getPageModuleSnapshot(snapshotId)
  if (!snapshot || snapshot.page_key !== pageKey || snapshot.module_key !== moduleKey) return null

  return savePageModuleDraft(
    pageKey,
    moduleKey,
    {
      title_zh: snapshot.title_zh,
      title_en: snapshot.title_en,
      description_zh: snapshot.description_zh,
      description_en: snapshot.description_en,
      items: snapshot.items,
      is_visible: snapshot.is_visible,
      sort_order: snapshot.sort_order,
    },
    adminId,
  )
}
