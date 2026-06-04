import { SITE_CONTACT_HREF, SITE_PRODUCTS_HREF } from '@/lib/site-links'

export type PageModuleTemplatePage = 'home' | 'about'

export type PageModuleTemplateId =
  | 'simple-text'
  | 'cta-section'
  | 'product-showcase'
  | 'product-series'
  | 'model-grid'
  | 'application-scenes'
  | 'project-proof'
  | 'large-product-cards'
  | 'model-strip'
  | 'innovation-story'
  | 'scenario-tiles'
  | 'future-explorer'
  | 'contact-band'

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

const VISUAL_CARD_MEDIA_FIELDS: PageModuleTemplateField[] = [
  { id: 'card-01.video_url', label: 'Card video URL', type: 'url', required: false, maxLength: 500 },
  { id: 'card-01.video_poster_url', label: 'Card video poster', type: 'url', required: false, maxLength: 500 },
]

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
          href: SITE_CONTACT_HREF,
          is_visible: true,
          sort_order: 20,
        },
        {
          id: 'secondary-cta',
          label_zh: '查看产品',
          label_en: 'View Products',
          href: SITE_PRODUCTS_HREF,
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
  {
    templateId: 'product-showcase',
    displayName: '产品展示区',
    moduleType: 'product-showcase',
    rendererKey: 'home.productShowcase',
    allowedPages: ['home'],
    maxInstances: 3,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: '产品展示',
      title_en: 'Product Showcase',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        {
          id: 'eyebrow',
          label_zh: '产品',
          label_en: 'Products',
          is_visible: true,
          sort_order: 10,
        },
        {
          id: 'card-01',
          label_zh: '产品标题',
          label_en: 'Product title',
          content_zh: '',
          content_en: '',
          href: '/products',
          is_visible: true,
          sort_order: 20,
        },
        {
          id: 'primary-cta',
          label_zh: '查看产品',
          label_en: 'View Products',
          href: SITE_PRODUCTS_HREF,
          is_visible: true,
          sort_order: 100,
        },
      ],
    },
    fields: [
      { id: 'title_zh', label: '中文标题', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: '中文说明', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_zh', label: '卡片中文标题', type: 'text', required: false, maxLength: 160 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_zh', label: '卡片中文说明', type: 'textarea', required: false, maxLength: 800 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: '卡片链接', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_zh', label: '主按钮中文', type: 'text', required: false, maxLength: 500 },
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: '主按钮链接', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'product-series',
    displayName: 'Home product series',
    moduleType: 'product-series',
    rendererKey: 'home.salesGrid',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Product series',
      title_en: 'Product series',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Product series', label_en: 'Product series', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Series title', label_en: 'Series title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Series title', label_en: 'Series title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 30 },
        { id: 'card-03', label_zh: 'Series title', label_en: 'Series title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 40 },
        { id: 'primary-cta', label_zh: 'View products', label_en: 'View products', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'model-grid',
    displayName: 'Home model grid',
    moduleType: 'model-grid',
    rendererKey: 'home.salesGrid',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Model grid',
      title_en: 'Model grid',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Models', label_en: 'Models', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Model title', label_en: 'Model title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Model title', label_en: 'Model title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 30 },
        { id: 'card-03', label_zh: 'Model title', label_en: 'Model title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 40 },
        { id: 'primary-cta', label_zh: 'Compare models', label_en: 'Compare models', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'application-scenes',
    displayName: 'Home application scenes',
    moduleType: 'application-scenes',
    rendererKey: 'home.salesGrid',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Application scenes',
      title_en: 'Application scenes',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Applications', label_en: 'Applications', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Scene title', label_en: 'Scene title', content_zh: '', content_en: '', href: '/scenarios/tourism', is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Scene title', label_en: 'Scene title', content_zh: '', content_en: '', href: '/scenarios/commercial', is_visible: true, sort_order: 30 },
        { id: 'card-03', label_zh: 'Scene title', label_en: 'Scene title', content_zh: '', content_en: '', href: '/scenarios/public', is_visible: true, sort_order: 40 },
        { id: 'primary-cta', label_zh: 'View scenarios', label_en: 'View scenarios', href: '/scenarios/tourism', is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'project-proof',
    displayName: 'Home project proof',
    moduleType: 'project-proof',
    rendererKey: 'home.salesGrid',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Project proof',
      title_en: 'Project proof',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Projects', label_en: 'Projects', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Project title', label_en: 'Project title', content_zh: '', content_en: '', href: '/cases', is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Project title', label_en: 'Project title', content_zh: '', content_en: '', href: '/cases', is_visible: true, sort_order: 30 },
        { id: 'card-03', label_zh: 'Project title', label_en: 'Project title', content_zh: '', content_en: '', href: '/cases', is_visible: true, sort_order: 40 },
        { id: 'primary-cta', label_zh: 'View cases', label_en: 'View cases', href: '/cases', is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'contact-band',
    displayName: 'Home contact band',
    moduleType: 'contact-band',
    rendererKey: 'home.contactBand',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Contact band',
      title_en: 'Contact band',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Contact', label_en: 'Contact', is_visible: true, sort_order: 10 },
        { id: 'primary-cta', label_zh: 'Send inquiry', label_en: 'Send inquiry', href: SITE_CONTACT_HREF, is_visible: true, sort_order: 20 },
        { id: 'secondary-cta', label_zh: 'View products', label_en: 'View products', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 30 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
      { id: 'secondary-cta.label_en', label: 'Secondary button', type: 'text', required: false, maxLength: 700 },
      { id: 'secondary-cta.href', label: 'Secondary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'large-product-cards',
    displayName: 'Home large product cards',
    moduleType: 'large-product-cards',
    rendererKey: 'home.visualSales',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Large product cards',
      title_en: 'Large product cards',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Products', label_en: 'Products', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Product title', label_en: 'Product title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Product title', label_en: 'Product title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 30 },
        { id: 'primary-cta', label_zh: 'View products', label_en: 'View products', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'model-strip',
    displayName: 'Home model strip',
    moduleType: 'model-strip',
    rendererKey: 'home.visualSales',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Model strip',
      title_en: 'Model strip',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Models', label_en: 'Models', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Model title', label_en: 'Model title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Model title', label_en: 'Model title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 30 },
        { id: 'card-03', label_zh: 'Model title', label_en: 'Model title', content_zh: '', content_en: '', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 40 },
        { id: 'primary-cta', label_zh: 'Compare models', label_en: 'Compare models', href: SITE_PRODUCTS_HREF, is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'innovation-story',
    displayName: 'Home innovation story',
    moduleType: 'innovation-story',
    rendererKey: 'home.visualSales',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Innovation story',
      title_en: 'Innovation story',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Innovation', label_en: 'Innovation', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Technology title', label_en: 'Technology title', content_zh: '', content_en: '', href: '/innovation/viie', is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Technology title', label_en: 'Technology title', content_zh: '', content_en: '', href: '/innovation/vipc', is_visible: true, sort_order: 30 },
        { id: 'primary-cta', label_zh: 'View innovation', label_en: 'View innovation', href: '/innovation/viie', is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'scenario-tiles',
    displayName: 'Home scenario tiles',
    moduleType: 'scenario-tiles',
    rendererKey: 'home.visualSales',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Scenario tiles',
      title_en: 'Scenario tiles',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Scenarios', label_en: 'Scenarios', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Scenario title', label_en: 'Scenario title', content_zh: '', content_en: '', href: '/scenarios/tourism', is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Scenario title', label_en: 'Scenario title', content_zh: '', content_en: '', href: '/scenarios/commercial', is_visible: true, sort_order: 30 },
        { id: 'card-03', label_zh: 'Scenario title', label_en: 'Scenario title', content_zh: '', content_en: '', href: '/scenarios/public', is_visible: true, sort_order: 40 },
        { id: 'primary-cta', label_zh: 'View scenarios', label_en: 'View scenarios', href: '/scenarios/tourism', is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
    ],
  },
  {
    templateId: 'future-explorer',
    displayName: 'Home future explorer',
    moduleType: 'future-explorer',
    rendererKey: 'home.visualSales',
    allowedPages: ['home'],
    maxInstances: 1,
    insertArea: 'home-after-credentials',
    defaultContent: {
      title_zh: 'Future explorer',
      title_en: 'Future explorer',
      description_zh: '',
      description_en: '',
      is_visible: true,
      sort_order: 0,
      items: [
        { id: 'eyebrow', label_zh: 'Explore', label_en: 'Explore', is_visible: true, sort_order: 10 },
        { id: 'card-01', label_zh: 'Entry title', label_en: 'Entry title', content_zh: '', content_en: '', href: '/about', is_visible: true, sort_order: 20 },
        { id: 'card-02', label_zh: 'Entry title', label_en: 'Entry title', content_zh: '', content_en: '', href: '/cases', is_visible: true, sort_order: 30 },
        { id: 'primary-cta', label_zh: 'Contact team', label_en: 'Contact team', href: SITE_CONTACT_HREF, is_visible: true, sort_order: 100 },
      ],
    },
    fields: [
      { id: 'title_zh', label: 'Chinese title', type: 'text', required: true, maxLength: 160 },
      { id: 'title_en', label: 'English title', type: 'text', required: true, maxLength: 180 },
      { id: 'description_zh', label: 'Chinese description', type: 'textarea', required: false, maxLength: 800 },
      { id: 'description_en', label: 'English description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.label_en', label: 'Card title', type: 'text', required: false, maxLength: 180 },
      { id: 'card-01.content_en', label: 'Card description', type: 'textarea', required: false, maxLength: 1000 },
      { id: 'card-01.href', label: 'Card link', type: 'url', required: false, maxLength: 500 },
      ...VISUAL_CARD_MEDIA_FIELDS,
      { id: 'primary-cta.label_en', label: 'Primary button', type: 'text', required: false, maxLength: 700 },
      { id: 'primary-cta.href', label: 'Primary link', type: 'url', required: false, maxLength: 500 },
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
