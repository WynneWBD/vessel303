import { createHash, randomUUID } from 'crypto'
import { unstable_cache } from 'next/cache'
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
  'global',
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

export const PAGE_MODULE_PUBLIC_CACHE_TAG = 'page-module-public'
const PAGE_MODULE_PUBLIC_CACHE_SECONDS = 300
const PAGE_MODULE_DEFAULTS_CACHE_VERSION = '2026-06-17-b346-global-about-contact-shell-labels'

export type PageModulePageKey = (typeof PAGE_MODULE_PAGE_KEYS)[number]

export function isPageModulePageKey(value: string): value is PageModulePageKey {
  return PAGE_MODULE_PAGE_KEYS.includes(value as PageModulePageKey)
}

export function pageModulePublicPaths(pageKey: string): string[] {
  if (pageKey === 'home') return ['/']
  if (pageKey === 'about') return ['/about']
  if (pageKey === 'products') return ['/products']
  if (pageKey === 'cases') return ['/cases']
  if (pageKey === 'global') return ['/global']
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
      '/global',
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

function buildDefaultHomeTemplateModule({
  moduleKey,
  templateId,
  sortOrder,
  titleZh,
  titleEn,
  descriptionZh,
  descriptionEn,
  items,
}: {
  moduleKey: string
  templateId: string
  sortOrder: number
  titleZh: string
  titleEn: string
  descriptionZh: string
  descriptionEn: string
  items: PageModuleItem[]
}): PageModuleRow {
  const template = getPageModuleTemplate(templateId)
  if (!template) throw new Error(`Missing page module template: ${templateId}`)

  return {
    id: `home:${moduleKey}`,
    page_key: 'home',
    module_key: moduleKey,
    module_type: template.moduleType,
    title_zh: titleZh,
    title_en: titleEn,
    description_zh: descriptionZh,
    description_en: descriptionEn,
    items,
    is_visible: true,
    sort_order: sortOrder,
    updated_at: '',
    updated_by_email: null,
  }
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
  buildDefaultHomeTemplateModule({
    moduleKey: 'large-product-cards',
    templateId: 'large-product-cards',
    sortOrder: 22,
    titleZh: '首页产品入口',
    titleEn: 'VESSEL Product Systems',
    descriptionZh: '展示重点产品系列、产品入口和咨询入口。这个模块已接入前台，后台发布后会影响首页产品展示。',
    descriptionEn: 'Controlled homepage product entries, catalog links, and inquiry paths.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '产品入口',
        label_en: 'Products',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'card-v9',
        image_url: '/images/products/v9-gen6/main.jpg',
        href: '/products/v9-gen6',
        value_zh: '38 平方米旗舰长住度假舱',
        value_en: '38 sqm flagship long-stay resort cabin',
        label_zh: 'VESSEL V9 Gen6',
        label_en: 'VESSEL V9 Gen6',
        content_zh: '适合高端度假营地、长期旅居和复合型文旅项目。',
        content_en: 'For premium resorts, long-stay hospitality, and mixed-use destination projects.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'card-e7',
        image_url: '/images/products/e7-gen6-flagship.jpg',
        href: '/products/e7-gen6-flagship',
        value_zh: '38.8 平方米旗舰舱',
        value_en: '38.8 sqm flagship cabin',
        label_zh: 'VESSEL E7 Gen6',
        label_en: 'VESSEL E7 Gen6',
        content_zh: '用于展示高端度假、接待和复合住宿场景的旗舰产品入口。',
        content_en: 'Flagship entry for premium hospitality, reception, and accommodation scenarios.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'primary-cta',
        href: SITE_PRODUCTS_HREF,
        label_zh: '查看产品目录',
        label_en: 'View Product Catalog',
        is_visible: true,
        sort_order: 100,
      },
      {
        id: 'secondary-cta',
        href: `${SITE_CONTACT_HREF}?source=home:product_entry`,
        label_zh: '提交产品需求',
        label_en: 'Send Product Brief',
        is_visible: true,
        sort_order: 110,
      },
    ],
  }),
  buildDefaultHomeTemplateModule({
    moduleKey: 'model-strip',
    templateId: 'model-strip',
    sortOrder: 28,
    titleZh: '首页型号轮播',
    titleEn: 'VESSEL Model Carousel',
    descriptionZh: '展示核心型号入口、图片/视频和产品详情链接。',
    descriptionEn: 'Model carousel with media, model copy, and product detail links.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '型号系列',
        label_en: 'Models',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'card-e3',
        image_url: '/images/products/e3-gen6-standard.jpg',
        href: '/products/e3-gen6-standard',
        value_zh: '19 平方米紧凑型舱体',
        value_en: '19 sqm compact cabin',
        label_zh: 'VESSEL E3 Gen6',
        label_en: 'VESSEL E3 Gen6',
        content_zh: '适合轻量住宿、配套空间和小型营地部署。',
        content_en: 'For compact stays, support spaces, and lightweight destination deployments.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'card-v9',
        image_url: '/images/products/v9-gen6/main.jpg',
        href: '/products/v9-gen6',
        value_zh: '38 平方米长住度假舱',
        value_en: '38 sqm long-stay resort cabin',
        label_zh: 'VESSEL V9 Gen6',
        label_en: 'VESSEL V9 Gen6',
        content_zh: '面向高端文旅营地和长期旅居项目。',
        content_en: 'Designed for premium resorts and long-stay hospitality projects.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'card-e6',
        image_url: '/images/products/e6-gen6-standard.jpg',
        href: '/products/e6-gen6-standard',
        value_zh: '31 平方米度假住宿舱',
        value_en: '31 sqm hospitality cabin',
        label_zh: 'VESSEL E6 Gen6',
        label_en: 'VESSEL E6 Gen6',
        content_zh: '平衡舒适、效率和营地批量部署。',
        content_en: 'Balancing comfort, operating efficiency, and repeatable deployment.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'primary-cta',
        href: SITE_PRODUCTS_HREF,
        label_zh: '比较型号',
        label_en: 'Compare Models',
        is_visible: true,
        sort_order: 100,
      },
      {
        id: 'secondary-cta',
        href: `${SITE_CONTACT_HREF}?source=home:model_strip`,
        label_zh: '预约咨询',
        label_en: 'Book Consultation',
        is_visible: true,
        sort_order: 110,
      },
    ],
  }),
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
    is_visible: false,
    sort_order: 25,
    updated_at: '',
    updated_by_email: null,
  },
  buildDefaultHomeTemplateModule({
    moduleKey: 'innovation-story',
    templateId: 'innovation-story',
    sortOrder: 34,
    titleZh: '首页核心卖点',
    titleEn: 'VESSEL Innovation Story',
    descriptionZh: '展示智能交互、能源系统和污水处理等核心卖点入口。',
    descriptionEn: 'Editable homepage entries for smart interaction, energy systems, and wastewater treatment.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '核心卖点',
        label_en: 'Innovation',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'card-viie',
        image_url: '/images/homepage/tech-viie.jpg',
        href: '/innovation/viie',
        label_zh: '智能交互',
        label_en: 'Intelligent interaction',
        content_zh: '用智能系统提升住宿、运营和远程管理体验。',
        content_en: 'Smart systems for guest experience, operations, and remote management.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'card-vipc',
        image_url: '/images/homepage/tech-vipc.jpg',
        href: '/innovation/vipc',
        label_zh: '可再生能源系统',
        label_en: 'Renewable energy systems',
        content_zh: '支持不同项目条件下的能源方案表达。',
        content_en: 'Energy solution storytelling for different project conditions.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'card-vols',
        image_url: '/images/homepage/tech-vols.jpg',
        href: '/innovation/vols',
        label_zh: '污水处理',
        label_en: 'Wastewater treatment',
        content_zh: '面向营地、市政和离网场景的配套能力入口。',
        content_en: 'Support capability for resorts, public facilities, and off-grid sites.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'primary-cta',
        href: '/innovation/viie',
        label_zh: '查看技术专题',
        label_en: 'View Innovation',
        is_visible: true,
        sort_order: 100,
      },
    ],
  }),
  buildDefaultHomeTemplateModule({
    moduleKey: 'scenario-tiles',
    templateId: 'scenario-tiles',
    sortOrder: 40,
    titleZh: '首页场景入口',
    titleEn: 'Explore VESSEL Application Scenarios',
    descriptionZh: '展示文旅、商业和公共设施等应用场景入口。',
    descriptionEn: 'Editable entry points for tourism, commercial, and public facility scenarios.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '应用场景',
        label_en: 'Scenarios',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'card-tourism',
        image_url: '/images/homepage/scene-tourism.jpg',
        href: '/scenarios/tourism',
        label_zh: '文旅度假',
        label_en: 'Vacation',
        content_zh: '度假村、营地、景区和目的地住宿。',
        content_en: 'Resorts, campsites, scenic destinations, and hospitality stays.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'card-commercial',
        image_url: '/images/homepage/scene-commercial.jpg',
        href: '/scenarios/commercial',
        label_zh: '商业空间',
        label_en: 'Commercial Space',
        content_zh: '接待、展示、服务中心和复合型商业空间。',
        content_en: 'Reception, showroom, service center, and mixed-use commercial spaces.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'card-public',
        image_url: '/images/homepage/scene-public.jpg',
        href: '/scenarios/public',
        label_zh: '公共设施',
        label_en: 'Public Facilities',
        content_zh: '公共服务、临时配套和特殊场地部署。',
        content_en: 'Public service, temporary support, and special-site deployment.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'primary-cta',
        href: '/scenarios/tourism',
        label_zh: '查看应用场景',
        label_en: 'View Scenarios',
        is_visible: true,
        sort_order: 100,
      },
    ],
  }),
  buildDefaultHomeTemplateModule({
    moduleKey: 'project-entry',
    templateId: 'project-proof',
    sortOrder: 44,
    titleZh: '首页项目入口',
    titleEn: 'Project Proof',
    descriptionZh: '展示项目案例入口，承接客户对真实交付、场地和运营结果的判断。',
    descriptionEn: 'Editable project proof section for delivery, site context, and operating evidence.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '项目案例',
        label_en: 'Projects',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'card-astrobase',
        image_url: '/images/projects/astrobase-mamison/exterior-01.png',
        href: '/cases/astrobase-mamison',
        value_zh: '海外项目',
        value_en: 'Overseas project',
        label_zh: 'Mamison Ski Resort',
        label_en: 'Mamison Ski Resort',
        content_zh: '用于展示海外度假项目中的产品落地和项目表达。',
        content_en: 'A project entry for overseas resort deployment and destination storytelling.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'card-usa',
        image_url: '/images/projects/usa-mount-pleasant/exterior-01.jpg',
        href: '/cases/usa-mount-pleasant',
        value_zh: '北美项目',
        value_en: 'North America project',
        label_zh: 'Mount Pleasant Resort',
        label_en: 'Mount Pleasant Resort',
        content_zh: '用于承接海外场地、批量部署和采购咨询。',
        content_en: 'Project proof for overseas sites, repeat deployment, and buyer inquiry paths.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'card-japan',
        image_url: '/images/projects/japan-setonohama/exterior-01.png',
        href: '/cases/japan-setonohama',
        value_zh: '日本项目',
        value_en: 'Japan project',
        label_zh: 'Setonohama Resort',
        label_en: 'Setonohama Resort',
        content_zh: '展示海滨度假场景和住宿体验表达。',
        content_en: 'A coastal hospitality reference for destination accommodation.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'primary-cta',
        href: '/cases',
        label_zh: '查看项目案例',
        label_en: 'View Cases',
        is_visible: true,
        sort_order: 100,
      },
      {
        id: 'secondary-cta',
        href: `${SITE_CONTACT_HREF}?source=home:project_proof`,
        label_zh: '提交项目需求',
        label_en: 'Send Project Brief',
        is_visible: true,
        sort_order: 110,
      },
    ],
  }),
  buildDefaultHomeTemplateModule({
    moduleKey: 'global-entry',
    templateId: 'future-explorer',
    sortOrder: 48,
    titleZh: '首页 Global 入口',
    titleEn: 'Global Deployment Entry',
    descriptionZh: '展示全球交付入口，承接全球地图、海外项目和跨区域咨询路径。',
    descriptionEn: 'Editable homepage entry for global deployment, overseas projects, and regional inquiries.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '全球交付',
        label_en: 'Global',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'card-global',
        image_url: '/images/about/about_globalmap-01.jpg',
        href: '/global',
        value_zh: '全球项目网络',
        value_en: 'Global project network',
        label_zh: '查看 Global',
        label_en: 'Open Global Map',
        content_zh: '从首页进入 Global，查看全球部署和项目分布入口。',
        content_en: 'Enter Global from the homepage to review deployment and project distribution.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'card-cases',
        image_url: '/images/homepage/region-americas.jpg',
        href: '/cases',
        value_zh: '项目案例',
        value_en: 'Project cases',
        label_zh: '海外项目参考',
        label_en: 'Overseas References',
        content_zh: '将全球入口与可验证项目案例连接起来。',
        content_en: 'Connect global reach with published project references.',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'primary-cta',
        href: '/global',
        label_zh: '查看 Global',
        label_en: 'View Global',
        is_visible: true,
        sort_order: 100,
      },
      {
        id: 'secondary-cta',
        href: `${SITE_CONTACT_HREF}?source=home:global_entry`,
        label_zh: '咨询海外项目',
        label_en: 'Discuss Overseas Project',
        is_visible: true,
        sort_order: 110,
      },
    ],
  }),
  buildDefaultHomeTemplateModule({
    moduleKey: 'contact-cta',
    templateId: 'contact-band',
    sortOrder: 58,
    titleZh: '准备规划您的 VESSEL 项目？',
    titleEn: 'Planning a VESSEL project?',
    descriptionZh: '告诉我们国家、场地类型、计划数量和时间表，团队会据此给出产品与项目适配建议。',
    descriptionEn: 'Share country, site type, planned quantity, and timeline so the team can respond with product and project-fit guidance.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '联系入口',
        label_en: 'Contact',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'primary-cta',
        href: `${SITE_CONTACT_HREF}?source=home:contact_cta`,
        label_zh: '提交项目需求',
        label_en: 'Send Inquiry',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'secondary-cta',
        href: SITE_PRODUCTS_HREF,
        label_zh: '查看产品目录',
        label_en: 'View Products',
        is_visible: true,
        sort_order: 30,
      },
    ],
  }),
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
      { id: 'catalog-title', label_zh: 'ALL Products 所有产品', label_en: 'ALL Products 所有产品', is_visible: true, sort_order: 220 },
      { id: 'breadcrumb-label', label_zh: 'ALL Products 所有产品', label_en: 'ALL Products 所有产品', is_visible: true, sort_order: 230 },
      { id: 'all-categories-label', label_zh: '全部产品', label_en: 'All categories', is_visible: true, sort_order: 240 },
      { id: 'default-category-group', label_zh: 'Default Configuration 默认配置', label_en: 'Default Configuration 默认配置', is_visible: true, sort_order: 250 },
      { id: 'search-visible', value_zh: 'true', value_en: 'true', label_zh: '显示搜索', label_en: 'Show search', is_visible: true, sort_order: 260 },
      { id: 'sidebar-visible', value_zh: 'true', value_en: 'true', label_zh: '显示左栏分类', label_en: 'Show left categories', is_visible: true, sort_order: 270 },
      { id: 'card-mode', value_zh: 'poster', value_en: 'poster', label_zh: '产品卡模式：poster / plain', label_en: 'Card mode: poster / plain', is_visible: true, sort_order: 280 },
      { id: 'card-price-eyebrow', label_zh: '完整交付价', label_en: 'Starting from', is_visible: true, sort_order: 290 },
      { id: 'card-price-empty', label_zh: '查看详情', label_en: 'Details', is_visible: true, sort_order: 300 },
      { id: 'breadcrumb-home-label', label_zh: '首页', label_en: 'Home', is_visible: true, sort_order: 310 },
      { id: 'contact-card-title', label_zh: '联系我们', label_en: 'Contact Us', is_visible: true, sort_order: 320 },
      { id: 'attribute-group-01', label_zh: 'Product Configuration 热销配置', label_en: 'Product Configuration 热销配置', is_visible: true, sort_order: 330 },
      { id: 'attribute-group-02', label_zh: 'Area 面积', label_en: 'Area 面积', is_visible: true, sort_order: 340 },
      { id: 'attribute-group-03', label_zh: 'Country 国家', label_en: 'Country 国家', is_visible: true, sort_order: 350 },
      { id: 'model-detail-label', label_zh: '型号详情', label_en: 'Model detail', is_visible: true, sort_order: 360 },
      { id: 'image-placeholder', label_zh: 'VESSEL', label_en: 'VESSEL', is_visible: true, sort_order: 370 },
      { id: 'pagination-previous', label_zh: '上一页', label_en: 'Previous page', is_visible: true, sort_order: 380 },
      { id: 'pagination-next', label_zh: '下一页', label_en: 'Next page', is_visible: true, sort_order: 390 },
    ],
    is_visible: true,
    sort_order: 40,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'products:detail-labels',
    page_key: 'products',
    module_key: 'detail-labels',
    module_type: 'fixed-content',
    title_zh: '产品详情页界面文案',
    title_en: 'Product detail interface labels',
    description_zh: '产品详情页首屏、证明桥、参数、图库、相关产品和询盘路径的客户可见文字。',
    description_en: 'Customer-facing labels for the product detail hero, proof bridge, specs, gallery, related products, and inquiry path.',
    items: [
      { id: 'price-empty', label_zh: '价格请咨询', label_en: 'Price on request', is_visible: true, sort_order: 10 },
      { id: 'specs-title', label_zh: '技术参数', label_en: 'Technical Parameters', is_visible: true, sort_order: 20 },
      { id: 'description-title', label_zh: '型号概览', label_en: 'Model Overview', is_visible: true, sort_order: 30 },
      { id: 'downloads-title', label_zh: '买家资料', label_en: 'Buyer Resources', is_visible: true, sort_order: 40 },
      { id: 'keywords-title', label_zh: '搜索关键词', label_en: 'Search Keywords', is_visible: true, sort_order: 50 },
      { id: 'related-title', label_zh: '更多型号', label_en: 'More Models', is_visible: true, sort_order: 60 },
      { id: 'gallery-title', label_zh: '产品图库', label_en: 'Product Gallery', is_visible: true, sort_order: 70 },
      { id: 'hero-inquiry-cta', label_zh: '提交咨询', label_en: 'Send Inquiry', is_visible: true, sort_order: 80 },
      { id: 'all-products-label', label_zh: '全部产品', label_en: 'All Products', is_visible: true, sort_order: 90 },
      { id: 'image-label-prefix', label_zh: '产品图片', label_en: 'Product image', is_visible: true, sort_order: 100 },
      { id: 'previous-image', label_zh: '上一张图片', label_en: 'Previous image', is_visible: true, sort_order: 110 },
      { id: 'next-image', label_zh: '下一张图片', label_en: 'Next image', is_visible: true, sort_order: 120 },
      { id: 'snapshot-eyebrow', label_zh: '产品速览', label_en: 'Product Snapshot', is_visible: true, sort_order: 130 },
      { id: 'snapshot-title', label_zh: '先判断型号，再进入详情', label_en: 'Evaluate the model before scrolling', is_visible: true, sort_order: 140 },
      { id: 'technical-check', label_zh: '技术参数', label_en: 'Technical check', is_visible: true, sort_order: 150 },
      { id: 'view-all', label_zh: '查看全部', label_en: 'View all', is_visible: true, sort_order: 160 },
      { id: 'specs-empty', label_zh: '补齐 CMS 技术参数后，这里会展示关键规格。', label_en: 'Technical parameters will appear here after the CMS fields are completed.', is_visible: true, sort_order: 170 },
      { id: 'inquiry-path', label_zh: '咨询入口', label_en: 'Inquiry path', is_visible: true, sort_order: 180 },
      { id: 'bridge-eyebrow', label_zh: '证明到询盘路径', label_en: 'Proof-to-inquiry bridge', is_visible: true, sort_order: 190 },
      { id: 'bridge-title', label_zh: '先看证明、对比适配，再提交型号咨询。', label_en: 'Review proof, compare fit, then send the model inquiry.', is_visible: true, sort_order: 200 },
      { id: 'bridge-open', label_zh: '打开', label_en: 'Open', is_visible: true, sort_order: 210 },
      { id: 'metric-floor-area', label_zh: '面积', label_en: 'Floor area', is_visible: true, sort_order: 220 },
      { id: 'metric-floor-area-detail', label_zh: '用于快速判断型号尺度', label_en: 'Comparable model scale', is_visible: true, sort_order: 230 },
      { id: 'metric-model-system', label_zh: '产品体系', label_en: 'Model system', is_visible: true, sort_order: 240 },
      { id: 'metric-model-system-detail', label_zh: '系列与代际', label_en: 'Series and generation', is_visible: true, sort_order: 250 },
      { id: 'metric-configuration-tier', label_zh: '配置层级', label_en: 'Configuration tier', is_visible: true, sort_order: 260 },
      { id: 'metric-configuration-tier-detail', label_zh: '来自产品目录分类', label_en: 'Catalog classification', is_visible: true, sort_order: 270 },
      { id: 'metric-media-depth', label_zh: '素材深度', label_en: 'Media depth', is_visible: true, sort_order: 280 },
      { id: 'metric-media-depth-detail', label_zh: '用于首屏和图库查看', label_en: 'Gallery available for inspection', is_visible: true, sort_order: 290 },
      { id: 'unit-images', label_zh: '张图片', label_en: 'images', is_visible: true, sort_order: 300 },
      { id: 'primary-image', label_zh: '主图', label_en: 'Primary image', is_visible: true, sort_order: 310 },
      { id: 'bridge-media-proof', label_zh: '素材证明', label_en: 'Media proof', is_visible: true, sort_order: 320 },
      { id: 'bridge-media-proof-detail', label_zh: '询价前先查看视觉资料。', label_en: 'Inspect the visual payload before asking for a quote.', is_visible: true, sort_order: 330 },
      { id: 'bridge-specification-proof', label_zh: '规格证明', label_en: 'Specification proof', is_visible: true, sort_order: 340 },
      { id: 'bridge-specification-proof-detail', label_zh: '确认型号尺度、体系和交付适配。', label_en: 'Confirm model scale, system and delivery fit.', is_visible: true, sort_order: 350 },
      { id: 'unit-specs', label_zh: '项参数', label_en: 'specs', is_visible: true, sort_order: 360 },
      { id: 'specs-pending', label_zh: '参数待补', label_en: 'Specs pending', is_visible: true, sort_order: 370 },
      { id: 'bridge-fit-signals', label_zh: '适配信号', label_en: 'Fit signals', is_visible: true, sort_order: 380 },
      { id: 'bridge-fit-signals-detail', label_zh: '用标签、卖点和分类信息判断型号适配。', label_en: 'Use tags, features and category facts to qualify the model.', is_visible: true, sort_order: 390 },
      { id: 'unit-signals', label_zh: '项信号', label_en: 'signals', is_visible: true, sort_order: 400 },
      { id: 'fit-pending', label_zh: '适配信息待补', label_en: 'Fit pending', is_visible: true, sort_order: 410 },
      { id: 'bridge-buyer-resources', label_zh: '买家资料', label_en: 'Buyer resources', is_visible: true, sort_order: 420 },
      { id: 'bridge-buyer-resources-detail', label_zh: '如有文件、买家说明或资料模块，可先查看。', label_en: 'Check files, buyer notes or supporting modules when available.', is_visible: true, sort_order: 430 },
      { id: 'unit-resource-modules', label_zh: '个模块', label_en: 'modules', is_visible: true, sort_order: 440 },
      { id: 'no-resource-module', label_zh: '暂无资料模块', label_en: 'No resource module', is_visible: true, sort_order: 450 },
      { id: 'bridge-related-options', label_zh: '相关选择', label_en: 'Related options', is_visible: true, sort_order: 460 },
      { id: 'bridge-related-options-detail', label_zh: '提交需求前可对比相近型号。', label_en: 'Compare nearby models before sending the request.', is_visible: true, sort_order: 470 },
      { id: 'unit-related-models', label_zh: '个型号', label_en: 'models', is_visible: true, sort_order: 480 },
      { id: 'single-model-route', label_zh: '单型号路径', label_en: 'Single model route', is_visible: true, sort_order: 490 },
      { id: 'bridge-inquiry-handoff', label_zh: '咨询交接', label_en: 'Inquiry handoff', is_visible: true, sort_order: 500 },
      { id: 'source-ready', label_zh: '来源已就绪', label_en: 'Source ready', is_visible: true, sort_order: 510 },
      { id: 'bridge-inquiry-handoff-detail', label_zh: '产品咨询会保留当前型号来源。', label_en: 'The product inquiry keeps this model as the lead source.', is_visible: true, sort_order: 520 },
      { id: 'product-type-compact', label_zh: '紧凑型', label_en: 'Compact model', is_visible: true, sort_order: 530 },
      { id: 'product-type-standard', label_zh: '标准型', label_en: 'Standard model', is_visible: true, sort_order: 540 },
      { id: 'product-type-luxury', label_zh: '旗舰型', label_en: 'Flagship model', is_visible: true, sort_order: 550 },
    ],
    is_visible: true,
    sort_order: 42,
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
    id: 'cases:hero',
    page_key: 'cases',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '项目案例',
    title_en: 'Projects / Cases',
    description_zh: '查看 VESSEL 已发布项目案例，按类型、地点、标签和产品引用判断适配。',
    description_en: 'Browse published VESSEL projects and evaluate fit by type, location, tags, and product references.',
    items: [
      { id: 'eyebrow', label_zh: '项目证明', label_en: 'Project Proof', is_visible: true, sort_order: 10 },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'cases:detail-labels',
    page_key: 'cases',
    module_key: 'detail-labels',
    module_type: 'fixed-content',
    title_zh: '案例列表与详情页界面文案',
    title_en: 'Case list and detail interface labels',
    description_zh: '案例列表筛选、证明密度、详情决策摘要、图库、相关案例和询盘证明链的客户可见文字。',
    description_en: 'Customer-facing labels for case filters, proof density, decision summary, gallery, related cases, and inquiry proof bridge.',
    items: [
      { id: 'fact-location', label_zh: '项目位置', label_en: 'Location', is_visible: true, sort_order: 10 },
      { id: 'fact-type', label_zh: '项目类型', label_en: 'Project Type', is_visible: true, sort_order: 20 },
      { id: 'fact-area', label_zh: '项目面积', label_en: 'Project Area', is_visible: true, sort_order: 30 },
      { id: 'fact-investment', label_zh: '投资规模', label_en: 'Investment', is_visible: true, sort_order: 40 },
      { id: 'fact-units', label_zh: '舱体数量', label_en: 'Units', is_visible: true, sort_order: 50 },
      { id: 'fact-products', label_zh: '产品型号', label_en: 'Products', is_visible: true, sort_order: 60 },
      { id: 'proof-title', label_zh: '项目证据', label_en: 'Project proof', is_visible: true, sort_order: 70 },
      { id: 'gallery-title', label_zh: '项目图库', label_en: 'Project gallery', is_visible: true, sort_order: 80 },
      { id: 'related-title', label_zh: '相关案例', label_en: 'Related cases', is_visible: true, sort_order: 90 },
      { id: 'list-published-cases', label_zh: '已发布案例', label_en: 'Published cases', is_visible: true, sort_order: 100 },
      { id: 'list-published-cases-detail', label_zh: '来自公开项目案例库', label_en: 'Visible public case library', is_visible: true, sort_order: 110 },
      { id: 'list-matching-now', label_zh: '当前匹配', label_en: 'Matching now', is_visible: true, sort_order: 120 },
      { id: 'list-matching-now-detail', label_zh: '跟随当前类型和标签筛选', label_en: 'Follows type and tag filters', is_visible: true, sort_order: 130 },
      { id: 'list-product-references', label_zh: '产品引用', label_en: 'Product references', is_visible: true, sort_order: 140 },
      { id: 'list-product-references-detail', label_zh: '当前范围内出现的型号/系列', label_en: 'Models or series in this scope', is_visible: true, sort_order: 150 },
      { id: 'list-project-locations', label_zh: '项目地点', label_en: 'Project locations', is_visible: true, sort_order: 160 },
      { id: 'list-project-locations-detail', label_zh: '当前范围内的地点数量', label_en: 'Locations represented in this scope', is_visible: true, sort_order: 170 },
      { id: 'list-case-control', label_zh: '案例控制台', label_en: 'Case control', is_visible: true, sort_order: 180 },
      { id: 'list-case-control-title', label_zh: '先筛场景，再看证据，最后进入项目咨询。', label_en: 'Filter the scenario, verify proof, then open the project inquiry.', is_visible: true, sort_order: 190 },
      { id: 'list-case-control-body', label_zh: '按项目类型、标签、产品引用和地点快速缩小范围，列表页先完成第一轮项目适配判断。', label_en: 'Use project type, tags, product references, and locations to narrow the library before opening a detailed case.', is_visible: true, sort_order: 200 },
      { id: 'list-reset', label_zh: '重置', label_en: 'Reset', is_visible: true, sort_order: 210 },
      { id: 'list-high-signal-filters', label_zh: '高频筛选', label_en: 'High-signal filters', is_visible: true, sort_order: 220 },
      { id: 'list-current-route', label_zh: '当前路径', label_en: 'Current route', is_visible: true, sort_order: 230 },
      { id: 'list-all-published-cases', label_zh: '全部公开案例', label_en: 'All published cases', is_visible: true, sort_order: 240 },
      { id: 'list-case-tags', label_zh: '案例标签', label_en: 'Case tags', is_visible: true, sort_order: 250 },
      { id: 'list-location-product-note', label_zh: '项目地点和产品引用只从现有案例字段读取。', label_en: 'Locations and product references are derived from existing case fields.', is_visible: true, sort_order: 260 },
      { id: 'list-visible-cases', label_zh: '当前案例', label_en: 'Visible cases', is_visible: true, sort_order: 270 },
      { id: 'list-visible-cases-detail-prefix', label_zh: '全部公开', label_en: 'All public', is_visible: true, sort_order: 280 },
      { id: 'list-proof-ready', label_zh: '证明完整', label_en: 'Proof-ready', is_visible: true, sort_order: 290 },
      { id: 'list-proof-ready-detail', label_zh: '有图像、叙事、参数和产品引用', label_en: 'Image, narrative, facts, and product reference', is_visible: true, sort_order: 300 },
      { id: 'list-review-proof', label_zh: '重点复核', label_en: 'Review proof', is_visible: true, sort_order: 310 },
      { id: 'list-basic-proof', label_zh: '基础展示', label_en: 'Basic proof', is_visible: true, sort_order: 320 },
      { id: 'list-image-proof', label_zh: '图片证据', label_en: 'Image proof', is_visible: true, sort_order: 330 },
      { id: 'list-image-proof-detail', label_zh: '封面与图库合计', label_en: 'Cover and gallery assets', is_visible: true, sort_order: 340 },
      { id: 'list-proof-product-references-detail', label_zh: '可回到产品判断适配', label_en: 'Connects proof to product fit', is_visible: true, sort_order: 350 },
      { id: 'list-scenario', label_zh: '场景', label_en: 'Scenario', is_visible: true, sort_order: 360 },
      { id: 'list-scenario-detail', label_zh: '类型、地点、标签先判断项目相似度。', label_en: 'Type, location, and tags establish project fit.', is_visible: true, sort_order: 370 },
      { id: 'list-proof', label_zh: '证据', label_en: 'Proof', is_visible: true, sort_order: 380 },
      { id: 'list-proof-detail', label_zh: '图片、参数、产品型号支撑交付可信度。', label_en: 'Images, facts, and models support delivery trust.', is_visible: true, sort_order: 390 },
      { id: 'list-inquiry', label_zh: '咨询', label_en: 'Inquiry', is_visible: true, sort_order: 400 },
      { id: 'list-inquiry-detail', label_zh: '详情页保留案例咨询锚点，进入可追踪线索路径。', label_en: 'Detail pages keep the inquiry anchor in the traceable lead path.', is_visible: true, sort_order: 410 },
      { id: 'list-proof-density', label_zh: '案例证明密度', label_en: 'Case Proof Density', is_visible: true, sort_order: 420 },
      { id: 'list-proof-density-title', label_zh: '把项目证据、产品引用和询盘入口放在同一条客户判断路径上。', label_en: 'Keep project proof, product references, and inquiry entry in one buyer path.', is_visible: true, sort_order: 430 },
      { id: 'list-proof-density-body', label_zh: '案例列表先承担第一轮信任建立：快速看到图像证据、项目事实、使用产品和下一步咨询入口。', label_en: 'The case list carries the first trust pass: visual proof, project facts, product references, and the next inquiry route.', is_visible: true, sort_order: 440 },
      { id: 'list-open-proof-rich-case', label_zh: '查看高证据案例', label_en: 'Open proof-rich case', is_visible: true, sort_order: 450 },
      { id: 'list-start-case-inquiry', label_zh: '进入案例咨询', label_en: 'Start case inquiry', is_visible: true, sort_order: 460 },
      { id: 'list-buyer-decision-path', label_zh: '客户侧判断顺序', label_en: 'Buyer decision path', is_visible: true, sort_order: 470 },
      { id: 'list-type-filter', label_zh: '项目类型', label_en: 'Project Type', is_visible: true, sort_order: 480 },
      { id: 'list-tags-filter', label_zh: '标签', label_en: 'Tags', is_visible: true, sort_order: 490 },
      { id: 'list-all-types', label_zh: '全部类型', label_en: 'All Projects', is_visible: true, sort_order: 500 },
      { id: 'list-all-tags', label_zh: '全部标签', label_en: 'All Tags', is_visible: true, sort_order: 510 },
      { id: 'list-empty', label_zh: '当前筛选暂无案例', label_en: 'No cases match the selected filters.', is_visible: true, sort_order: 520 },
      { id: 'list-open-case', label_zh: '查看案例', label_en: 'Open case', is_visible: true, sort_order: 530 },
      { id: 'list-case-inquiry', label_zh: '案例咨询', label_en: 'Case inquiry', is_visible: true, sort_order: 540 },
      { id: 'list-photos-unit', label_zh: '张图', label_en: 'photos', is_visible: true, sort_order: 550 },
      { id: 'list-facts', label_zh: '事实', label_en: 'Facts', is_visible: true, sort_order: 560 },
      { id: 'detail-facts', label_zh: '事实', label_en: 'Facts', is_visible: true, sort_order: 570 },
      { id: 'detail-products', label_zh: '产品', label_en: 'Products', is_visible: true, sort_order: 580 },
      { id: 'detail-gallery-assets', label_zh: '图库素材', label_en: 'Gallery assets', is_visible: true, sort_order: 590 },
      { id: 'detail-gallery-proof', label_zh: '图库证据', label_en: 'Gallery proof', is_visible: true, sort_order: 600 },
      { id: 'detail-gallery-proof-detail', label_zh: '封面与现场图片', label_en: 'Cover and site images', is_visible: true, sort_order: 610 },
      { id: 'detail-project-facts', label_zh: '项目事实', label_en: 'Project facts', is_visible: true, sort_order: 620 },
      { id: 'detail-project-facts-detail', label_zh: '地点、类型、面积、规模等', label_en: 'Location, type, area, scale, and more', is_visible: true, sort_order: 630 },
      { id: 'detail-product-references', label_zh: '产品引用', label_en: 'Product references', is_visible: true, sort_order: 640 },
      { id: 'detail-product-references-detail', label_zh: '关联 VESSEL 型号/系列', label_en: 'Linked VESSEL models or series', is_visible: true, sort_order: 650 },
      { id: 'detail-related-cases-detail', label_zh: '继续横向比较项目类型', label_en: 'Compare adjacent project types', is_visible: true, sort_order: 660 },
      { id: 'detail-decision-eyebrow', label_zh: '案例决策摘要', label_en: 'Case decision summary', is_visible: true, sort_order: 670 },
      { id: 'detail-decision-title', label_zh: '先完成项目适配判断，再进入图库和咨询。', label_en: 'Validate project fit before opening gallery and inquiry.', is_visible: true, sort_order: 680 },
      { id: 'detail-decision-subtitle', label_zh: '案例详情页先把地点、类型、规模、产品引用和询盘路径集中展示，减少用户在长页面里反复查找。', label_en: 'The case detail page surfaces location, type, scale, product references, and inquiry path before the longer story sections.', is_visible: true, sort_order: 690 },
      { id: 'detail-snapshot-title', label_zh: '项目快照', label_en: 'Project snapshot', is_visible: true, sort_order: 700 },
      { id: 'detail-delivery-proof-title', label_zh: '交付证据', label_en: 'Delivery proof', is_visible: true, sort_order: 710 },
      { id: 'detail-reading-path-title', label_zh: '阅读路径', label_en: 'Reading path', is_visible: true, sort_order: 720 },
      { id: 'detail-reading-step-1', label_zh: '先核对项目地点、类型、面积和舱体规模。', label_en: 'Check location, project type, area, and unit scale first.', is_visible: true, sort_order: 730 },
      { id: 'detail-reading-step-2', label_zh: '再查看产品引用、投资信息和图库证据。', label_en: 'Then review product references, investment context, and gallery evidence.', is_visible: true, sort_order: 740 },
      { id: 'detail-reading-step-3', label_zh: '最后带着项目背景进入案例咨询表单。', label_en: 'Finally open the case inquiry with project context.', is_visible: true, sort_order: 750 },
      { id: 'detail-inquiry-proof-eyebrow', label_zh: '询盘前证明链', label_en: 'Pre-inquiry proof chain', is_visible: true, sort_order: 760 },
      { id: 'detail-inquiry-proof-title', label_zh: '提交前再次核对项目证据、产品引用和相似案例。', label_en: 'Review proof, product references, and adjacent cases before inquiry.', is_visible: true, sort_order: 770 },
      { id: 'detail-inquiry-proof-subtitle', label_zh: '这一段把详情页已有证据收束到询盘前，帮助采购方带着明确项目背景进入表单。', label_en: 'This bridge condenses existing case proof before the form so buyers enter with a clear project context.', is_visible: true, sort_order: 780 },
      { id: 'detail-inquiry-proof-point-1', label_zh: '先用图库和项目事实确认交付可信度。', label_en: 'Use gallery and project facts to confirm delivery credibility.', is_visible: true, sort_order: 790 },
      { id: 'detail-inquiry-proof-point-2', label_zh: '再用产品引用判断型号、规模和场景适配。', label_en: 'Use product references to judge model, scale, and scenario fit.', is_visible: true, sort_order: 800 },
      { id: 'detail-inquiry-proof-point-3', label_zh: '最后带着明确项目背景进入案例咨询。', label_en: 'Enter the inquiry with a clear project context.', is_visible: true, sort_order: 810 },
      { id: 'detail-submit-case-inquiry', label_zh: '提交案例咨询', label_en: 'Submit Case Inquiry', is_visible: true, sort_order: 820 },
    ],
    is_visible: true,
    sort_order: 15,
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
    id: 'global:hero',
    page_key: 'global',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '全球项目地图 | VESSEL',
    title_en: 'Global Deployment Map | VESSEL',
    description_zh: '查看 VESSEL 全球项目地点、公开营地参考、区域部署信号和项目咨询路径。',
    description_en: 'Explore VESSEL global project locations, published camp references, regional deployment signals, and project inquiry paths.',
    items: [
      { id: 'eyebrow', label_zh: '全球部署', label_en: 'Global Deployment', is_visible: true, sort_order: 10 },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'global:header',
    page_key: 'global',
    module_key: 'header',
    module_type: 'fixed-content',
    title_zh: '全球项目地图',
    title_en: 'Global Map',
    description_zh: 'Global 地图顶部品牌、标题、数字区和语言按钮。',
    description_en: 'Top brand, title, statistics, and language labels for the Global map.',
    items: [
      { id: 'logo-alt', label_zh: 'VESSEL 微宿', label_en: 'VESSEL', is_visible: true, sort_order: 10 },
      { id: 'countries', value_zh: '30+', value_en: '30+', label_zh: '国家/地区', label_en: 'Countries', is_visible: true, sort_order: 20 },
      { id: 'camps', value_zh: '300+', value_en: '300+', label_zh: '营地', label_en: 'Camps', is_visible: true, sort_order: 30 },
      { id: 'devices', value_zh: '2000+', value_en: '2000+', label_zh: '设备', label_en: 'Devices', is_visible: true, sort_order: 40 },
      { id: 'language-en', label_zh: 'EN', label_en: 'EN', is_visible: true, sort_order: 50 },
      { id: 'language-zh', label_zh: '中', label_en: 'ZH', is_visible: true, sort_order: 60 },
    ],
    is_visible: true,
    sort_order: 20,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'global:map-labels',
    page_key: 'global',
    module_key: 'map-labels',
    module_type: 'fixed-content',
    title_zh: 'Global 地图交互文案',
    title_en: 'Global map interaction labels',
    description_zh: '地图加载、详情打开、错误兜底和基础交互提示。',
    description_en: 'Loading, detail-opening, error fallback, and base interaction labels for the map.',
    items: [
      { id: 'loading', label_zh: '正在加载全球地图', label_en: 'LOADING GLOBAL MAP', is_visible: true, sort_order: 10 },
      { id: 'close', label_zh: '关闭', label_en: 'Close', is_visible: true, sort_order: 20 },
      { id: 'panel-opening', label_zh: '正在打开营地', label_en: 'OPENING CAMP', is_visible: true, sort_order: 30 },
      { id: 'panel-loading-body', label_zh: '项目详情正在加载。', label_en: 'Project details are loading now.', content_zh: '项目详情正在加载，基础信息会优先显示。', content_en: 'Project details are loading now.', is_visible: true, sort_order: 40 },
      { id: 'map-error-title', label_zh: '地图加载失败', label_en: 'MAP LOAD FAILED', is_visible: true, sort_order: 50 },
      { id: 'map-init-error-body', label_zh: '当前浏览器或显卡不支持 WebGL2。', label_en: 'WebGL2 is not supported.', content_zh: '当前浏览器或显卡不支持 WebGL2，地图无法显示。请尝试在 Chrome 或 Safari 中打开本页面。', content_en: 'Your browser or GPU does not support WebGL2. Please open this page in Chrome or Safari instead.', is_visible: true, sort_order: 60 },
      { id: 'map-style-error-body', label_zh: '地图样式加载出错。', label_en: 'Map style failed.', content_zh: '地图样式加载出错，请稍后重试。', content_en: 'Map style failed to load. Please retry shortly.', is_visible: true, sort_order: 70 },
      { id: 'map-retry', label_zh: '重新加载', label_en: 'RETRY', is_visible: true, sort_order: 80 },
    ],
    is_visible: true,
    sort_order: 30,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'global:detail-labels',
    page_key: 'global',
    module_key: 'detail-labels',
    module_type: 'fixed-content',
    title_zh: 'Global 项目详情标签',
    title_en: 'Global project detail labels',
    description_zh: '地图点位详情面板里的统计、图集、交通、周边和分享文案。',
    description_en: 'Stats, gallery, transport, nearby, and sharing labels in the Global detail panel.',
    items: [
      { id: 'share', label_zh: '分享', label_en: 'Share', is_visible: true, sort_order: 10 },
      { id: 'share-title-prefix', label_zh: 'VESSEL 微宿', label_en: 'VESSEL', is_visible: true, sort_order: 20 },
      { id: 'share-text', label_zh: '查看这个 VESSEL 微宿全球营地项目。', label_en: 'Explore this VESSEL prefab camp project.', content_zh: '查看这个 VESSEL 微宿全球营地项目。', content_en: 'Explore this VESSEL prefab camp project.', is_visible: true, sort_order: 30 },
      { id: 'link-copied', label_zh: '链接已复制', label_en: 'Link copied', is_visible: true, sort_order: 40 },
      { id: 'copy-prompt', label_zh: '复制链接:', label_en: 'Copy the link:', is_visible: true, sort_order: 50 },
      { id: 'units', label_zh: '舱数', label_en: 'Units', is_visible: true, sort_order: 60 },
      { id: 'per-unit', label_zh: '每间面积', label_en: 'Per Unit', is_visible: true, sort_order: 70 },
      { id: 'guests', label_zh: '入住人数', label_en: 'Guests', is_visible: true, sort_order: 80 },
      { id: 'opened', label_zh: '开业时间', label_en: 'Opened', is_visible: true, sort_order: 90 },
      { id: 'overview-eyebrow', label_zh: '项目概览', label_en: 'Overview', is_visible: true, sort_order: 100 },
      { id: 'overview-title', label_zh: '关于本项目', label_en: 'About This Project', is_visible: true, sort_order: 110 },
      { id: 'amenities-eyebrow', label_zh: '配套设施', label_en: 'Amenities', is_visible: true, sort_order: 120 },
      { id: 'amenities-title', label_zh: '设施亮点', label_en: "What's Included", is_visible: true, sort_order: 130 },
      { id: 'gallery-eyebrow', label_zh: '项目图集', label_en: 'Gallery', is_visible: true, sort_order: 140 },
      { id: 'gallery-title', label_zh: '实景照片', label_en: 'Interior & Exterior', is_visible: true, sort_order: 150 },
      { id: 'transport-eyebrow', label_zh: '交通指引', label_en: 'Getting There', is_visible: true, sort_order: 160 },
      { id: 'transport-title', label_zh: '位置与交通', label_en: 'Location & Transport', is_visible: true, sort_order: 170 },
      { id: 'nearby-title', label_zh: '周边景点', label_en: 'Nearby Attractions', is_visible: true, sort_order: 180 },
    ],
    is_visible: true,
    sort_order: 40,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'global:cta-labels',
    page_key: 'global',
    module_key: 'cta-labels',
    module_type: 'fixed-content',
    title_zh: 'Global 详情行动按钮',
    title_en: 'Global detail action buttons',
    description_zh: '点位详情面板里的预订、联系和返回地图按钮文案。',
    description_en: 'Booking, contact, and back-to-map button labels in the Global detail panel.',
    items: [
      { id: 'book-now', label_zh: '立即预订', label_en: 'Book Now', is_visible: true, sort_order: 10 },
      { id: 'contact', href: DEFAULT_CONTACT_URL, label_zh: '联系 VESSEL', label_en: 'Contact VESSEL', is_visible: true, sort_order: 20 },
      { id: 'back-to-map', label_zh: '返回地图', label_en: 'Back to Map', is_visible: true, sort_order: 30 },
    ],
    is_visible: true,
    sort_order: 50,
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
    id: 'news:hero',
    page_key: 'news',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '新闻动态',
    title_en: 'News & Updates',
    description_zh: '查看 VESSEL 产品、项目、交付和行业相关动态。',
    description_en: 'Review VESSEL product, project, delivery, and industry updates.',
    items: [
      {
        id: 'eyebrow',
        label_zh: '新闻中心',
        label_en: 'Newsroom',
        is_visible: true,
        sort_order: 10,
      },
    ],
    is_visible: true,
    sort_order: 10,
    updated_at: '',
    updated_by_email: null,
  },
  {
    id: 'news:ui',
    page_key: 'news',
    module_key: 'ui',
    module_type: 'fixed-content',
    title_zh: '新闻列表文案',
    title_en: 'News list labels',
    description_zh: '新闻列表中的按钮和列表标签文案。',
    description_en: 'Button and list labels used by the news listing page.',
    items: [
      {
        id: 'read-more',
        label_zh: '查看详情',
        label_en: 'Read more',
        is_visible: true,
        sort_order: 10,
      },
    ],
    is_visible: true,
    sort_order: 20,
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
    id: 'contact:source-context',
    page_key: 'contact',
    module_key: 'source-context',
    module_type: 'fixed-content',
    title_zh: '联系页 · 咨询来源提示',
    title_en: 'Contact · Inquiry context',
    description_zh: '表单上方根据来源参数展示的来源提示、说明和返回按钮文案。',
    description_en: 'Source-aware context title, description, and return link labels above the contact form.',
    items: [
      {
        id: 'context-eyebrow',
        label_zh: '咨询来源',
        label_en: 'Inquiry context',
        is_visible: true,
        sort_order: 10,
      },
      {
        id: 'context-news',
        href: '/news',
        value_zh: '返回新闻',
        value_en: 'Back to news',
        label_zh: '来自新闻动态',
        label_en: 'From a news update',
        content_zh: '如果这条动态与你的项目相关，可以在表单里补充产品、场景或采购时间。',
        content_en: 'If the update is relevant, add product, scenario, or timing context in the form.',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'context-news-detail',
        value_zh: '返回这篇动态',
        value_en: 'Back to this update',
        label_zh: '新闻详情返回按钮',
        label_en: 'News detail return label',
        is_visible: true,
        sort_order: 30,
      },
      {
        id: 'context-product',
        href: '/products',
        value_zh: '返回产品',
        value_en: 'Back to products',
        label_zh: '来自产品路径',
        label_en: 'From a product path',
        content_zh: '团队会结合你查看的产品路径判断型号、配置和数量需求。',
        content_en: 'The team can use the product path to discuss model, configuration, and quantity needs.',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'context-case',
        href: '/cases',
        value_zh: '返回案例',
        value_en: 'Back to cases',
        label_zh: '来自项目案例',
        label_en: 'From a project case',
        content_zh: '可以补充项目所在地、场地类型、预计规模和交付时间。',
        content_en: 'Add location, site type, approximate scale, and delivery timing if available.',
        is_visible: true,
        sort_order: 50,
      },
      {
        id: 'context-site',
        href: '/products',
        value_zh: '查看产品',
        value_en: 'View products',
        label_zh: '来自站内咨询入口',
        label_en: 'From a site inquiry path',
        content_zh: '团队会参考本次访问路径，更快理解你的咨询背景。',
        content_en: 'The team can use this context to understand your inquiry path faster.',
        is_visible: true,
        sort_order: 60,
      },
    ],
    is_visible: true,
    sort_order: 35,
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
      { id: 'footer-social-links', label_zh: 'VESSEL 社交媒体链接', label_en: 'VESSEL social links', is_visible: true, sort_order: 30 },
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
      { id: 'v9', href: '/products/v9-gen6', value_zh: '38㎡', value_en: '38 sqm', label_zh: 'V9 Gen6', label_en: 'V9 Gen6', is_visible: true, sort_order: 40 },
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
    id: 'site:footer-about',
    page_key: 'site',
    module_key: 'footer-about',
    module_type: 'navigation',
    title_zh: '关于 VESSEL',
    title_en: 'About VESSEL',
    description_zh: '可选页脚 About 链接组。默认隐藏，启用后会替换页脚联系信息列。',
    description_en: 'Optional footer about links. Hidden by default; when enabled, it replaces the footer contact column.',
    items: [
      { id: 'about', href: '/about', label_zh: '品牌与工厂', label_en: 'Brand & Factory', is_visible: true, sort_order: 10 },
      { id: 'global', href: '/global', label_zh: '全球项目', label_en: 'Global Projects', is_visible: true, sort_order: 20 },
      { id: 'faq', href: '/faq', label_zh: '常见问题', label_en: 'FAQ', is_visible: true, sort_order: 30 },
      { id: 'contact', href: '/contact?source=footer:about_contact', label_zh: '联系团队', label_en: 'Contact Team', is_visible: true, sort_order: 40 },
    ],
    is_visible: false,
    sort_order: 55,
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
      {
        id: 'services-cta-products',
        href: '/products',
        label_zh: '查看产品',
        label_en: 'View Products',
        is_visible: true,
        sort_order: 60,
      },
      {
        id: 'services-cta-cases',
        href: '/cases',
        label_zh: '项目案例',
        label_en: 'Project Cases',
        is_visible: true,
        sort_order: 70,
      },
      {
        id: 'services-cta-contact',
        href: '/contact?source=about:inquiry_cta',
        label_zh: '发起咨询',
        label_en: 'Start Inquiry',
        is_visible: true,
        sort_order: 80,
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
  'home:large-product-cards': 'home.visualSales',
  'home:model-strip': 'home.visualSales',
  'home:innovation-story': 'home.visualSales',
  'home:scenario-tiles': 'home.visualSales',
  'home:project-entry': 'home.salesGrid',
  'home:project-proof': 'home.salesGrid',
  'home:future-explorer': 'home.visualSales',
  'home:global-entry': 'home.visualSales',
  'home:contact-cta': 'home.contactBand',
  'home:operating-proof': 'home.operatingProof',
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

function shouldAppendMissingDefaultItems(row: PageModuleRow) {
  return (
    (row.page_key === 'products' && row.module_key === 'ui-labels') ||
    (row.page_key === 'about' && row.module_key === 'services') ||
    (row.page_key === 'site' && row.module_key === 'ui-labels')
  )
}

function normalizeRow(row: DbPageModuleRow): PageModuleRow {
  const normalized = {
    ...row,
    items: normalizeItems(row.items),
  }

  if (!shouldAppendMissingDefaultItems(normalized)) return normalized

  const fallback = getDefaultPageModule(normalized.page_key, normalized.module_key)
  if (!fallback) return normalized

  const existingIds = new Set(normalized.items.map((item) => item.id))
  const missingItems = fallback.items
    .filter((item) => !existingIds.has(item.id))
    .map((item) => ({ ...item }))

  if (missingItems.length === 0) return normalized

  return {
    ...normalized,
    items: [...normalized.items, ...missingItems].sort((a, b) => a.sort_order - b.sort_order),
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

function clonePageModule(pageModule: PageModuleRow): PageModuleRow {
  return {
    ...pageModule,
    items: pageModule.items.map((item) => ({ ...item })),
  }
}

function sortPageModuleRows(rows: PageModuleRow[]) {
  return rows.sort((a, b) => (
    a.page_key.localeCompare(b.page_key) ||
    a.sort_order - b.sort_order ||
    a.module_key.localeCompare(b.module_key)
  ))
}

function mergeWithDefaultPageModules(rows: PageModuleRow[], pageKey?: string): PageModuleRow[] {
  const existingKeys = new Set(rows.map((row) => `${row.page_key}:${row.module_key}`))
  const merged = rows.map(clonePageModule)

  for (const pageModule of DEFAULT_PAGE_MODULES) {
    if (pageKey && pageModule.page_key !== pageKey) continue
    const key = `${pageModule.page_key}:${pageModule.module_key}`
    if (existingKeys.has(key)) continue
    merged.push(clonePageModule(pageModule))
  }

  return sortPageModuleRows(merged)
}

export function listDefaultPageModules(pageKey?: string): PageModuleRow[] {
  return DEFAULT_PAGE_MODULES
    .filter((pageModule) => !pageKey || pageModule.page_key === pageKey)
    .map(clonePageModule)
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

  return mergeWithDefaultPageModules(res.rows.map(normalizeRow), pageKey)
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

async function loadPublishedPageModules(pageKey?: string): Promise<PageModuleRow[]> {
  await ensurePageModulesSchema()
  const params: string[] = []
  const where: string[] = []
  if (pageKey) {
    params.push(pageKey)
    where.push(`pm.page_key = $${params.length}`)
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

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
     ${whereSql}
     ORDER BY pm.page_key ASC, pm.sort_order ASC`,
    params,
  )

  return mergeWithDefaultPageModules(res.rows.map(normalizePublishedRow), pageKey)
    .filter((pageModule) => pageModule.is_visible)
}

const listPublishedPageModulesCached = unstable_cache(
  async (pageKeyKey: string): Promise<PageModuleRow[]> => loadPublishedPageModules(pageKeyKey || undefined),
  ['page-modules-public-list', PAGE_MODULE_DEFAULTS_CACHE_VERSION],
  { revalidate: PAGE_MODULE_PUBLIC_CACHE_SECONDS, tags: [PAGE_MODULE_PUBLIC_CACHE_TAG] },
)

export async function listPublishedPageModules(pageKey?: string): Promise<PageModuleRow[]> {
  return listPublishedPageModulesCached(pageKey ?? '')
}

async function loadPublishedPageModule(pageKey: string, moduleKey: string): Promise<PageModuleRow | null> {
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
     LIMIT 1`,
    [pageKey, moduleKey],
  )

  if (res.rows[0]) {
    const pageModule = normalizePublishedRow(res.rows[0])
    return pageModule.is_visible ? pageModule : null
  }

  const fallback = getDefaultPageModule(pageKey, moduleKey)
  return fallback?.is_visible ? clonePageModule(fallback) : null
}

const getPublishedPageModuleCached = unstable_cache(
  async (pageKey: string, moduleKey: string): Promise<PageModuleRow | null> => loadPublishedPageModule(pageKey, moduleKey),
  ['page-modules-public-one', PAGE_MODULE_DEFAULTS_CACHE_VERSION],
  { revalidate: PAGE_MODULE_PUBLIC_CACHE_SECONDS, tags: [PAGE_MODULE_PUBLIC_CACHE_TAG] },
)

export async function getPublishedPageModule(pageKey: string, moduleKey: string): Promise<PageModuleRow | null> {
  return getPublishedPageModuleCached(pageKey, moduleKey)
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
