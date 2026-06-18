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
    unavailableReason: 'C4-2c 仅开放 Home 的 credentials 后、CoreTech 前安全插入区。',
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
    unavailableReason: 'C4-2c 仅开放 Home 的 credentials 后、CoreTech 前安全插入区。',
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
    unavailableReason: '需要先确认 Home 试点插入区和图片必填规则。',
  },
  {
    id: 'product-series',
    name: 'Home product series',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'Controlled homepage product-family block. Operations edits text, images, links, order, and visibility from the backend.',
    unavailableReason: 'B35 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'model-grid',
    name: 'Home model grid',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'Controlled homepage model card grid for published product entry points.',
    unavailableReason: 'B35 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'application-scenes',
    name: 'Home application scenes',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'Controlled homepage scene block for linking published scenario pages.',
    unavailableReason: 'B35 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'project-proof',
    name: 'Home project proof',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'Controlled homepage project proof block for published case entry points.',
    unavailableReason: 'B35 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'contact-band',
    name: 'Home contact band',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'Controlled homepage contact band connected to backend contact and product paths.',
    unavailableReason: 'B35 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'large-product-cards',
    name: 'Home large product cards',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'B36 homepage product showroom block with large backend-controlled images, copy, links, order, and visibility.',
    unavailableReason: 'B36 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'model-strip',
    name: 'Home model strip',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'B36 homepage model exposure block for V9 / E7 / E6 / E3 style product entries controlled from page_modules.',
    unavailableReason: 'B36 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'innovation-story',
    name: 'Home innovation story',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'B36 homepage technology bridge block that links to published innovation pages without frontend business copy.',
    unavailableReason: 'B36 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'scenario-tiles',
    name: 'Home scenario tiles',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'B36 homepage application-scenario block for backend-controlled tourism, commercial, and public facility entries.',
    unavailableReason: 'B36 opens this only as a fixed homepage module template, not as free page building.',
  },
  {
    id: 'future-explorer',
    name: 'Home future explorer',
    pages: ['home'],
    status: 'planned',
    canAdd: true,
    canDelete: true,
    canSort: true,
    description: 'B36 homepage final brand and project transition block controlled by published backend content.',
    unavailableReason: 'B36 opens this only as a fixed homepage module template, not as free page building.',
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
    unavailableReason: '需要先确认字段长度和多语言内容规则。',
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
    unavailableReason: '需要先定义数字、单位和说明字段的校验规则。',
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
    description: '页面导航属于全站核心结构，不进入运营模块库。',
    unavailableReason: '会影响全站入口、SEO 和用户路径，需要继续由代码控制。',
  },
  {
    id: 'footer',
    name: 'Footer',
    pages: ['all'],
    status: 'locked',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '页脚属于全站核心结构，不进入运营模块库。',
    unavailableReason: '包含全站链接、联系信息和合规内容，需要继续由代码控制。',
  },
  {
    id: 'global-map-preview',
    name: 'GlobalMapPreview',
    pages: ['about'],
    status: 'locked',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: 'About 页里的全球地图预览保持锁定。',
    unavailableReason: '它依赖 /global 地图链路和项目数据，不属于 visual editor 第一阶段。',
  },
  {
    id: 'dynamic-content',
    name: '产品 / 项目 / 新闻动态数据区',
    pages: ['all'],
    status: 'not_open',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '从产品、项目、新闻 CMS 自动读取的数据区暂不纳入页面模块库。',
    unavailableReason: '这些内容有独立 CMS 和数据规则，不能和页面结构编辑混在一起。',
  },
  {
    id: 'pricing-membership-agent',
    name: '价格 / 会员 / 代理模块',
    pages: ['all'],
    status: 'not_open',
    canAdd: false,
    canDelete: false,
    canSort: false,
    description: '涉及商业规则或权限规则的模块暂不开放。',
    unavailableReason: '这类模块会影响业务流程，不适合在页面搭建 MVP 中开放。',
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
    unavailableReason: '会破坏品牌样式、页面稳定性和安全边界。',
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
    unavailableReason: '会绕过受控设计系统，导致前台视觉和响应式不可控。',
  },
]

export const PAGE_STRUCTURE_BOUNDARY_NOTES = [
  '当前只开放 Home 安全插入区，不等于已经支持整页自由搭建。',
  'Home 安全插入区支持受控模板目录中的可新增模块，以及排序、结构隐藏和恢复；核心模块仍锁定。',
  '页面级结构草稿和快照已接入；恢复快照只会回到草稿，发布后才影响前台。',
  'About 暂只支持已有模块内容编辑，不开放结构新增、排序或隐藏。',
]
