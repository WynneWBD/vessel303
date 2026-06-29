export type PageModuleCatalogPage =
  | 'home'
  | 'products'
  | 'cases'
  | 'contact'
  | 'site'
  | 'about'
  | 'global'
  | 'faq'
  | 'media-kit'
  | 'scenarios'
  | 'innovation'
  | 'display'
  | 'news'
  | 'all'

export type PageModuleCatalogStatus = 'planned' | 'locked' | 'not_open'

export type PageModuleCatalogItem = {
  id: string
  name: string
  pages: PageModuleCatalogPage[]
  status: PageModuleCatalogStatus
  canAdd: boolean
  canDelete: boolean
  canSort: boolean
  description: string
  unavailableReason?: string
}

export const PLANNED_PAGE_MODULE_CATALOG: PageModuleCatalogItem[] = [
  {
    id: 'cta-section',
    name: 'CTA 区',
    pages: ['all'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '用于放置标题、说明文字和一个或两个按钮，适合承接咨询、下载、跳转等动作。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'simple-text',
    name: '简单文字区',
    pages: ['all'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '用于展示小标题、标题和正文，不允许自定义字体、颜色或排版。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'text-image',
    name: '图文区',
    pages: ['all'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '固定左右图文结构，只允许更换图片、文字和链接。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'product-series',
    name: '首页产品系列',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示产品系列入口，可维护标题、图片、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'model-grid',
    name: '首页产品型号',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示产品型号卡片，可维护图片、文案、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'application-scenes',
    name: '首页应用场景',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示应用场景入口，可维护图片、文案、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'project-proof',
    name: '首页项目案例',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示项目案例入口，可维护图片、文案、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'contact-band',
    name: '首页联系入口',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示咨询转化入口，可维护标题、按钮和跳转链接。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'large-product-cards',
    name: '首页大产品卡',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示大图产品卡，可维护图片、文案、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'model-strip',
    name: '首页型号横排',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示重点型号入口，可维护图片、文案、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'innovation-story',
    name: '首页创新技术',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示创新技术入口，可维护图片、文案、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'scenario-tiles',
    name: '首页场景卡片',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示多组场景卡片，可维护图片、文案、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'future-explorer',
    name: '首页探索入口',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '展示品牌或项目引导入口，可维护图片、文案、链接、排序和显示状态。',
    unavailableReason: '当前只在首页指定位置开放新增。',
  },
  {
    id: 'gallery',
    name: '图片组 / Gallery',
    pages: ['all'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '用于展示多张图片和可选说明，适合工厂、资质、案例图片墙。',
    unavailableReason: '需要页面级快照纳入图片引用保护后再开放。',
  },
  {
    id: 'faq',
    name: 'FAQ',
    pages: ['all'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '固定问答列表结构，适合常见问题、服务说明和运营补充说明。',
    unavailableReason: '当前只开放已有 FAQ 内容编辑。',
  },
  {
    id: 'logo-wall',
    name: '合作伙伴 / Logo wall',
    pages: ['all'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '用于展示合作伙伴、客户或认证 logo，只允许编辑图片、名称和链接。',
    unavailableReason: '需要先限制图片比例和每组最大数量。',
  },
  {
    id: 'stats',
    name: '统计区',
    pages: ['all'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: '固定 3-6 个统计数字项，适合展示产能、经验、项目数量等信息。',
    unavailableReason: '当前只开放已有统计内容编辑。',
  },
]

export const RESTRICTED_PAGE_MODULE_CATALOG: PageModuleCatalogItem[] = [
  {
    id: 'navbar',
    name: 'Navbar',
    pages: ['all'],
    status: 'locked',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '全站导航可在“导航页脚”中维护。',
    unavailableReason: '导航入口请通过现有导航管理维护。',
  },
  {
    id: 'footer',
    name: 'Footer',
    pages: ['all'],
    status: 'locked',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '全站页脚可在“导航页脚”中维护。',
    unavailableReason: '页脚入口请通过现有导航页脚管理维护。',
  },
  {
    id: 'global-map-preview',
    name: 'GlobalMapPreview',
    pages: ['about'],
    status: 'locked',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: 'About 页里的全球地图预览保持固定展示。',
    unavailableReason: '地图内容请在 Global 相关入口维护。',
  },
  {
    id: 'dynamic-content',
    name: '产品 / 项目 / 新闻动态数据区',
    pages: ['all'],
    status: 'not_open',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '产品、项目和新闻列表从对应内容库读取。',
    unavailableReason: '请到对应内容管理页面维护。',
  },
  {
    id: 'pricing-membership-agent',
    name: '价格 / 会员 / 代理模块',
    pages: ['all'],
    status: 'not_open',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '价格、会员和代理相关模块不在页面编辑器维护。',
    unavailableReason: '请使用对应业务后台维护。',
  },
  {
    id: 'free-html',
    name: '自由 HTML',
    pages: ['all'],
    status: 'not_open',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '不提供自由 HTML 插入能力。',
    unavailableReason: '当前使用固定设计组件维护页面。',
  },
  {
    id: 'custom-css',
    name: '自定义 CSS',
    pages: ['all'],
    status: 'not_open',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '不提供自定义 CSS 能力。',
    unavailableReason: '当前使用固定设计组件维护页面。',
  },
]

export const PAGE_STRUCTURE_BOUNDARY_NOTES = [
  '首页可在指定位置新增模块，并支持排序、隐藏和恢复。',
  '发布前会先保存页面版本，发布后前台才会更新。',
  '其他页面当前以编辑已有模块为主。',
  '登录、账户和业务规则请在对应后台维护。',
]
