export type PageModuleTemplatePage = 'home' | 'about'

export type PageModuleTemplateId = 'simple-text' | 'cta-section'

export type PageModuleTemplateFieldType = 'text' | 'textarea' | 'url'

export type PageModuleTemplateField = {
  id: string
  label: string
  type: PageModuleTemplateFieldType
  required: boolean
  maxLength: number
}

export type PageModuleTemplateItem = {
  id: string
  image_url?: string
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

export type PageModuleTemplateContent = {
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  items: PageModuleTemplateItem[]
  is_visible: boolean
  sort_order: number
}

export type PageModuleTemplate = {
  templateId: PageModuleTemplateId
  displayName: string
  moduleType: string
  rendererKey: string
  allowedPages: PageModuleTemplatePage[]
  maxInstances: number
  insertArea: 'home-after-credentials'
  defaultContent: PageModuleTemplateContent
  fields: PageModuleTemplateField[]
}

export const PAGE_MODULE_TEMPLATES: PageModuleTemplate[] = [
  {
    templateId: 'simple-text',
    displayName: '简单文字区',
    moduleType: 'simple-text',
    rendererKey: 'home.simpleText',
    allowedPages: ['home'],
    maxInstances: 3,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: '首页补充说明',
      title_en: 'Homepage Note',
      description_zh: '在这里填写一段用于首页的补充说明，适合承接品牌、技术或服务优势。',
      description_en: 'Use this section for a concise homepage note about brand, technology, or service strengths.',
      is_visible: true,
      sort_order: 0,
      items: [
        {
          id: 'eyebrow',
          label_zh: '页面补充',
          label_en: 'PAGE NOTE',
          is_visible: true,
          sort_order: 10,
        },
        {
          id: 'body',
          label_zh: '正文',
          label_en: 'Body',
          content_zh: '请将这里替换为面向海外客户的说明文字，保持客观、克制、可验证。',
          content_en: 'Replace this with concise copy for international buyers. Keep the wording factual and verifiable.',
          is_visible: true,
          sort_order: 20,
        },
      ],
    },
    fields: [
      { id: 'title_zh', label: '中文标题', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: '中文说明', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'body.content_zh', label: '中文正文', type: 'textarea', required: false, maxLength: 1600 },
      { id: 'body.content_en', label: 'English body', type: 'textarea', required: false, maxLength: 2200 },
    ],
  },
  {
    templateId: 'cta-section',
    displayName: 'CTA 区',
    moduleType: 'cta-section',
    rendererKey: 'home.ctaSection',
    allowedPages: ['home'],
    maxInstances: 2,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: '准备规划您的 VESSEL 项目？',
      title_en: 'Planning a VESSEL project?',
      description_zh: '联系团队获取产品资料、项目适配建议和采购沟通支持。',
      description_en: 'Contact the team for product materials, project fit guidance, and procurement support.',
      is_visible: true,
      sort_order: 0,
      items: [
        {
          id: 'eyebrow',
          label_zh: '项目咨询',
          label_en: 'PROJECT INQUIRY',
          is_visible: true,
          sort_order: 10,
        },
        {
          id: 'primary-cta',
          label_zh: '联系团队',
          label_en: 'Contact Team',
          href: 'https://en.303vessel.cn/contact.html',
          is_visible: true,
          sort_order: 20,
        },
        {
          id: 'secondary-cta',
          label_zh: '查看产品',
          label_en: 'View Products',
          href: 'https://en.303vessel.cn/products_list.html',
          is_visible: true,
          sort_order: 30,
        },
      ],
    },
    fields: [
      { id: 'title_zh', label: '中文标题', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: '中文说明', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'primary-cta.label_zh', label: '主按钮中文', type: 'text', required: true, maxLength: 500 },
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: true, maxLength: 700 },
      { id: 'primary-cta.href', label: '主按钮链接', type: 'url', required: true, maxLength: 500 },
      { id: 'secondary-cta.label_zh', label: '次按钮中文', type: 'text', required: false, maxLength: 500 },
      { id: 'secondary-cta.label_en', label: 'Secondary button', type: 'text', required: false, maxLength: 700 },
      { id: 'secondary-cta.href', label: '次按钮链接', type: 'url', required: false, maxLength: 500 },
    ],
  },
]

export const HOME_ADDABLE_PAGE_MODULE_TEMPLATES = PAGE_MODULE_TEMPLATES.filter((template) =>
  template.allowedPages.includes('home'),
)

export function getPageModuleTemplate(templateId: string) {
  return PAGE_MODULE_TEMPLATES.find((template) => template.templateId === templateId) ?? null
}

export function getPageModuleTemplateByModuleType(moduleType: string) {
  return PAGE_MODULE_TEMPLATES.find((template) => template.moduleType === moduleType) ?? null
}

export function isPageModuleTemplateAllowedOnPage(template: PageModuleTemplate, pageKey: string) {
  return template.allowedPages.includes(pageKey as PageModuleTemplatePage)
}

export function isTemplateBackedPageModule(pageKey: string, moduleType: string) {
  const template = getPageModuleTemplateByModuleType(moduleType)
  return Boolean(template && isPageModuleTemplateAllowedOnPage(template, pageKey))
}

export function clonePageModuleTemplateContent(template: PageModuleTemplate): PageModuleTemplateContent {
  return {
    ...template.defaultContent,
    items: template.defaultContent.items.map((item) => ({ ...item })),
  }
}
