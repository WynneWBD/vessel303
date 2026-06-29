import type { B9ContentItem, B9ContentKind } from '@/lib/b9-content-db'

const FALLBACK_TIMESTAMP = '1970-01-01T00:00:00.000Z'

function item(input: {
  id: number
  kind: B9ContentKind
  slug: string
  titleZh: string
  titleEn: string
  summaryZh?: string
  summaryEn?: string
  bodyZh?: string
  bodyEn?: string
  cover?: string
  ctaZh?: string
  ctaEn?: string
  ctaHref?: string
  payload?: Record<string, unknown>
  sortOrder?: number
}): B9ContentItem {
  return {
    id: input.id,
    kind: input.kind,
    slug: input.slug,
    category_id: null,
    category_slug: null,
    category_title_zh: null,
    category_title_en: null,
    title_zh: input.titleZh,
    title_en: input.titleEn,
    summary_zh: input.summaryZh ?? null,
    summary_en: input.summaryEn ?? null,
    body_zh: input.bodyZh ?? null,
    body_en: input.bodyEn ?? null,
    cover_image_url: input.cover ?? null,
    file_url: null,
    cta_label_zh: input.ctaZh ?? null,
    cta_label_en: input.ctaEn ?? null,
    cta_href: input.ctaHref ?? null,
    payload: input.payload ?? {},
    status: 'published',
    sort_order: input.sortOrder ?? 0,
    published_at: FALLBACK_TIMESTAMP,
    created_at: FALLBACK_TIMESTAMP,
    updated_at: FALLBACK_TIMESTAMP,
    deleted_at: null,
  }
}

const scenarioDefaults: B9ContentItem[] = [
  item({
    id: -3101,
    kind: 'scenario',
    slug: 'tourism',
    titleZh: '文旅度假项目',
    titleEn: 'Tourism & Resort Projects',
    summaryZh: '适用于度假营地、景区住宿、目的地商业和长期运营型文旅项目。',
    summaryEn: 'For resorts, destination camps, scenic hospitality, and long-stay tourism projects.',
    bodyZh: '用标准化产品、工厂交付和现场快速安装，帮助运营方更快完成住宿、接待和配套空间落地。',
    bodyEn: 'Use standardized products, factory delivery, and fast on-site installation to launch accommodation, reception, and supporting spaces faster.',
    cover: '/images/homepage/scene-tourism.jpg',
    ctaZh: '提交场景需求',
    ctaEn: 'Start Scenario Inquiry',
    ctaHref: '/contact',
    sortOrder: 10,
    payload: {
      labelZh: '应用场景',
      labelEn: 'Application Scenario',
      titleGoldZh: '从营地到目的地运营',
      titleGoldEn: 'From Campsites to Destination Operations',
      heroTaglineZh: '把住宿、接待、配套和运营动线放进同一套可复制的产品方案。',
      heroTaglineEn: 'A repeatable product system for accommodation, reception, amenities, and site operations.',
      specs: [
        { label: '交付方式', value: 'Factory-built' },
        { label: '项目类型', value: 'Resort / Camp / Scenic site' },
        { label: '运营目标', value: 'Fast opening' },
      ],
      features: [
        { title: '住宿单元', body: '适配度假住宿、长期营地和景区配套客房。' },
        { title: '接待空间', body: '服务中心、前台和公共配套空间可以统一规划。' },
        { title: '快速部署', body: '用标准化模块降低现场施工和二次调整压力。' },
      ],
      process: [
        { step: '01', title: '确认场地', body: '先确认国家、气候、地形、数量和运营周期。' },
        { step: '02', title: '匹配产品', body: '按客群、预算和交付节奏选择产品组合。' },
        { step: '03', title: '进入咨询', body: '提交信息后由团队继续跟进报价和技术条件。' },
      ],
      recommendedProducts: [
        { label: 'V9 Gen6', href: '/products/v9-gen6' },
        { label: 'All Products', href: '/products' },
      ],
      inquiryTitleZh: '提交文旅项目需求',
      inquiryTitleEn: 'Send Tourism Project Requirements',
      inquiryDescriptionZh: '填写国家、项目类型、数量和时间计划，团队将按场景来源跟进。',
      inquiryDescriptionEn: 'Share country, project type, quantity, and schedule so the team can follow up with scenario context.',
    },
  }),
  item({
    id: -3102,
    kind: 'scenario',
    slug: 'commercial',
    titleZh: '商业空间项目',
    titleEn: 'Commercial Space Projects',
    summaryZh: '适用于零售展示、快闪商业、接待中心和复合型商业空间。',
    summaryEn: 'For retail display, pop-up commerce, reception centers, and mixed-use commercial spaces.',
    bodyZh: '用可复制的空间模块快速搭建展示、接待和交易场景，降低非标施工的不确定性。',
    bodyEn: 'Use repeatable spatial modules to build display, reception, and transaction scenarios with less custom construction uncertainty.',
    cover: '/images/homepage/scene-commercial.jpg',
    ctaZh: '提交商业需求',
    ctaEn: 'Start Commercial Inquiry',
    ctaHref: '/contact',
    sortOrder: 20,
    payload: {
      labelZh: '商业应用',
      labelEn: 'Commercial Use',
      titleGoldZh: '更快开业的空间方案',
      titleGoldEn: 'Faster-Opening Commercial Spaces',
      heroTaglineZh: '适配展示、接待、零售和品牌运营场景。',
      heroTaglineEn: 'Built for display, reception, retail, and branded operations.',
      specs: [
        { label: '空间类型', value: 'Retail / Reception / Showroom' },
        { label: '部署方式', value: 'Modular' },
        { label: '运营重点', value: 'Brand experience' },
      ],
      features: [
        { title: '品牌展示', body: '可用于临时展厅、销售接待和品牌体验空间。' },
        { title: '灵活落位', body: '适合商场、园区、户外场地和目的地商业节点。' },
        { title: '统一交付', body: '外观、结构、内装和基础机电可作为一套方案管理。' },
      ],
      process: [
        { step: '01', title: '确认用途', body: '确认展示、销售、接待或复合商业目标。' },
        { step: '02', title: '确认配置', body: '匹配面积、动线、门头和机电需求。' },
        { step: '03', title: '提交需求', body: '进入咨询后继续确认交付与预算。' },
      ],
      recommendedProducts: [
        { label: 'Product Center', href: '/products' },
        { label: 'Projects', href: '/cases' },
      ],
      inquiryTitleZh: '提交商业空间需求',
      inquiryTitleEn: 'Send Commercial Space Requirements',
      inquiryDescriptionZh: '填写用途、面积、国家和预计开放时间，团队将按商业场景跟进。',
      inquiryDescriptionEn: 'Share use case, area, country, and launch timeline so the team can follow up with commercial context.',
    },
  }),
  item({
    id: -3103,
    kind: 'scenario',
    slug: 'public',
    titleZh: '公共设施项目',
    titleEn: 'Public Facility Projects',
    summaryZh: '适用于公共服务点、景区配套、园区服务和城市更新中的轻量空间。',
    summaryEn: 'For public service points, scenic amenities, park operations, and lightweight urban renewal spaces.',
    bodyZh: '用可控工期和标准化产品，为公共服务、园区运营和配套设施提供稳定落地路径。',
    bodyEn: 'Use controlled timelines and standardized products to support public services, park operations, and amenity projects.',
    cover: '/images/homepage/scene-public.jpg',
    ctaZh: '提交公共项目需求',
    ctaEn: 'Start Public Project Inquiry',
    ctaHref: '/contact',
    sortOrder: 30,
    payload: {
      labelZh: '公共项目',
      labelEn: 'Public Projects',
      titleGoldZh: '可复制的公共配套空间',
      titleGoldEn: 'Repeatable Public Amenity Spaces',
      heroTaglineZh: '服务点、接待点、园区配套和公共休憩空间可以统一规划。',
      heroTaglineEn: 'Plan service points, reception nodes, park amenities, and public rest spaces in one system.',
      specs: [
        { label: '应用范围', value: 'Public service / Amenity' },
        { label: '交付重点', value: 'Reliability' },
        { label: '管理目标', value: 'Repeatable rollout' },
      ],
      features: [
        { title: '公共服务', body: '适合服务点、咨询点、公共接待和轻量配套。' },
        { title: '稳定交付', body: '减少非标施工对项目节点的影响。' },
        { title: '统一维护', body: '便于后续复制、替换和运营维护。' },
      ],
      process: [
        { step: '01', title: '确认场地条件', body: '确认用地、气候、设备、审批和运营要求。' },
        { step: '02', title: '确认产品组合', body: '匹配服务功能、面积和配套系统。' },
        { step: '03', title: '进入项目沟通', body: '提交需求后继续确认实施路径。' },
      ],
      recommendedProducts: [
        { label: 'Products', href: '/products' },
        { label: 'Cases', href: '/cases' },
      ],
      inquiryTitleZh: '提交公共设施需求',
      inquiryTitleEn: 'Send Public Facility Requirements',
      inquiryDescriptionZh: '填写国家、场地、功能和数量，团队将按公共项目来源跟进。',
      inquiryDescriptionEn: 'Share country, site, function, and quantity so the team can follow up with public project context.',
    },
  }),
]

const innovationDefaults: B9ContentItem[] = [
  item({
    id: -3201,
    kind: 'innovation',
    slug: 'viie',
    titleZh: 'VIIE 智能集成系统',
    titleEn: 'VIIE Intelligent Integration System',
    summaryZh: '围绕能源、控制、舒适度和设备状态，把空间运行能力集成进产品交付。',
    summaryEn: 'Integrates energy, controls, comfort, and equipment status into the delivered spatial product.',
    bodyZh: 'VIIE 用于支持海外项目和长期运营场景，让产品不仅是建筑空间，也具备可管理、可维护的运行能力。',
    bodyEn: 'VIIE supports overseas projects and long-term operation scenarios, making each unit manageable and maintainable beyond the physical space.',
    ctaZh: '查看产品',
    ctaEn: 'View Products',
    ctaHref: '/products',
    sortOrder: 10,
    payload: {
      sections: [
        {
          title_zh: '集成控制',
          title_en: 'Integrated Control',
          body_zh: '把关键设备和使用状态集中到统一的运行框架中。',
          body_en: 'Centralizes key equipment and operating status into one management framework.',
        },
        {
          title_zh: '长期运营',
          title_en: 'Long-Term Operation',
          body_zh: '面向度假、商业和海外项目持续使用场景。',
          body_en: 'Designed for sustained use across resort, commercial, and overseas deployments.',
        },
      ],
    },
  }),
  item({
    id: -3202,
    kind: 'innovation',
    slug: 'vipc',
    titleZh: 'VIPC 产品配置体系',
    titleEn: 'VIPC Product Configuration System',
    summaryZh: '用统一配置语言管理型号、面积、功能和项目适配。',
    summaryEn: 'A unified configuration language for model, area, function, and project fit.',
    bodyZh: 'VIPC 帮助运营和销售团队用更清晰的产品结构承接不同国家、不同场景的项目需求。',
    bodyEn: 'VIPC helps operations and sales teams handle project requirements across countries and scenarios with a clearer product structure.',
    ctaZh: '查看产品中心',
    ctaEn: 'Open Product Center',
    ctaHref: '/products',
    sortOrder: 20,
    payload: {
      sections: [
        {
          title_zh: '配置表达',
          title_en: 'Configuration Language',
          body_zh: '把面积、版本、功能和使用场景整理成运营可理解的结构。',
          body_en: 'Turns area, version, function, and use scenarios into an operator-readable structure.',
        },
        {
          title_zh: '项目匹配',
          title_en: 'Project Matching',
          body_zh: '支持从场景需求快速匹配到可沟通的产品组合。',
          body_en: 'Supports faster matching from scenario requirements to product combinations.',
        },
      ],
    },
  }),
  item({
    id: -3203,
    kind: 'innovation',
    slug: 'vols',
    titleZh: 'VOLS 运营交付体系',
    titleEn: 'VOLS Operations Delivery System',
    summaryZh: '围绕项目交付、现场安装、运维响应和复制扩张建立运营路径。',
    summaryEn: 'An operating path for project delivery, on-site installation, maintenance response, and repeat rollout.',
    bodyZh: 'VOLS 让产品从工厂、物流、现场安装到后续运营形成可追踪的项目闭环。',
    bodyEn: 'VOLS connects factory production, logistics, on-site installation, and ongoing operations into a trackable project loop.',
    ctaZh: '查看项目案例',
    ctaEn: 'View Projects',
    ctaHref: '/cases',
    sortOrder: 30,
    payload: {
      sections: [
        {
          title_zh: '交付节奏',
          title_en: 'Delivery Rhythm',
          body_zh: '用统一节点管理生产、运输、安装和交付。',
          body_en: 'Uses consistent milestones for production, transport, installation, and handover.',
        },
        {
          title_zh: '复制扩张',
          title_en: 'Repeat Rollout',
          body_zh: '让多项目、多国家落地时保持更稳定的执行方式。',
          body_en: 'Keeps execution more consistent across multiple projects and countries.',
        },
      ],
    },
  }),
]

const defaultsByKind: Partial<Record<B9ContentKind, B9ContentItem[]>> = {
  scenario: scenarioDefaults,
  innovation: innovationDefaults,
}

export function getDefaultB9ContentItem(kind: B9ContentKind, slug: string) {
  return defaultsByKind[kind]?.find((entry) => entry.slug === slug) ?? null
}

export function listDefaultB9ContentItems(kind: B9ContentKind) {
  return [...(defaultsByKind[kind] ?? [])]
}

export function withDefaultB9ContentItems(kind: B9ContentKind, rows: B9ContentItem[]) {
  const bySlug = new Map(listDefaultB9ContentItems(kind).map((entry) => [entry.slug, entry]))
  for (const row of rows) bySlug.set(row.slug, row)
  return [...bySlug.values()].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
}
