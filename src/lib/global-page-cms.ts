export type GlobalCmsLang = 'en' | 'zh'

export type GlobalPageModuleItemLike = {
  id: string
  value_zh?: string
  value_en?: string
  content_zh?: string
  content_en?: string
  label_zh: string
  label_en: string
  is_visible?: boolean
}

export type GlobalPageModuleLike = {
  module_key: string
  title_zh?: string
  title_en?: string
  description_zh?: string
  description_en?: string
  is_visible?: boolean
  items?: GlobalPageModuleItemLike[]
}

type GlobalCmsTextSet = {
  seoTitle: string
  seoDescription: string
  headerTitle: string
  logoAlt: string
  countriesValue: string
  countriesLabel: string
  campsValue: string
  campsLabel: string
  devicesValue: string
  devicesLabel: string
  languageEn: string
  languageZh: string
  loadingLabel: string
  closeLabel: string
  panelOpeningLabel: string
  panelLoadingBody: string
  mapErrorTitle: string
  mapInitErrorBody: string
  mapStyleErrorBody: string
  mapRetryLabel: string
  shareLabel: string
  shareTitlePrefix: string
  shareText: string
  linkCopied: string
  copyPrompt: string
  unitsLabel: string
  perUnitLabel: string
  guestsLabel: string
  openedLabel: string
  overviewEyebrow: string
  overviewTitle: string
  amenitiesEyebrow: string
  amenitiesTitle: string
  galleryEyebrow: string
  galleryTitle: string
  transportEyebrow: string
  transportTitle: string
  nearbyTitle: string
  bookNowLabel: string
  contactLabel: string
  backToMapLabel: string
}

export type GlobalCmsLabels = GlobalCmsTextSet

const FALLBACK_LABELS: Record<GlobalCmsLang, GlobalCmsTextSet> = {
  en: {
    seoTitle: 'Global Deployment Map | VESSEL',
    seoDescription: 'Explore VESSEL global project locations, published camp references, regional deployment signals, and project inquiry paths.',
    headerTitle: 'Global Map',
    logoAlt: 'VESSEL',
    countriesValue: '30+',
    countriesLabel: 'Countries',
    campsValue: '300+',
    campsLabel: 'Camps',
    devicesValue: '2000+',
    devicesLabel: 'Devices',
    languageEn: 'EN',
    languageZh: 'ZH',
    loadingLabel: 'LOADING GLOBAL MAP',
    closeLabel: 'Close',
    panelOpeningLabel: 'OPENING CAMP',
    panelLoadingBody: 'Project details are loading now.',
    mapErrorTitle: 'MAP LOAD FAILED',
    mapInitErrorBody: 'Your browser or GPU does not support WebGL2. Please open this page in Chrome or Safari instead.',
    mapStyleErrorBody: 'Map style failed to load. Please retry shortly.',
    mapRetryLabel: 'RETRY',
    shareLabel: 'Share',
    shareTitlePrefix: 'VESSEL',
    shareText: 'Explore this VESSEL prefab camp project.',
    linkCopied: 'Link copied',
    copyPrompt: 'Copy the link:',
    unitsLabel: 'Units',
    perUnitLabel: 'Per Unit',
    guestsLabel: 'Guests',
    openedLabel: 'Opened',
    overviewEyebrow: 'Overview',
    overviewTitle: 'About This Project',
    amenitiesEyebrow: 'Amenities',
    amenitiesTitle: "What's Included",
    galleryEyebrow: 'Gallery',
    galleryTitle: 'Interior & Exterior',
    transportEyebrow: 'Getting There',
    transportTitle: 'Location & Transport',
    nearbyTitle: 'Nearby Attractions',
    bookNowLabel: 'Book Now',
    contactLabel: 'Contact VESSEL',
    backToMapLabel: 'Back to Map',
  },
  zh: {
    seoTitle: '全球项目地图 | VESSEL',
    seoDescription: '查看 VESSEL 全球项目地点、公开营地参考、区域部署信号和项目咨询路径。',
    headerTitle: '全球项目地图',
    logoAlt: 'VESSEL 微宿',
    countriesValue: '30+',
    countriesLabel: '国家/地区',
    campsValue: '300+',
    campsLabel: '营地',
    devicesValue: '2000+',
    devicesLabel: '设备',
    languageEn: 'EN',
    languageZh: '中',
    loadingLabel: '正在加载全球地图',
    closeLabel: '关闭',
    panelOpeningLabel: '正在打开营地',
    panelLoadingBody: '项目详情正在加载，基础信息会优先显示。',
    mapErrorTitle: '地图加载失败',
    mapInitErrorBody: '当前浏览器或显卡不支持 WebGL2，地图无法显示。请尝试在 Chrome 或 Safari 中打开本页面。',
    mapStyleErrorBody: '地图样式加载出错，请稍后重试。',
    mapRetryLabel: '重新加载',
    shareLabel: '分享',
    shareTitlePrefix: 'VESSEL 微宿',
    shareText: '查看这个 VESSEL 微宿全球营地项目。',
    linkCopied: '链接已复制',
    copyPrompt: '复制链接:',
    unitsLabel: '舱数',
    perUnitLabel: '每间面积',
    guestsLabel: '入住人数',
    openedLabel: '开业时间',
    overviewEyebrow: '项目概览',
    overviewTitle: '关于本项目',
    amenitiesEyebrow: '配套设施',
    amenitiesTitle: '设施亮点',
    galleryEyebrow: '项目图集',
    galleryTitle: '实景照片',
    transportEyebrow: '交通指引',
    transportTitle: '位置与交通',
    nearbyTitle: '周边景点',
    bookNowLabel: '立即预订',
    contactLabel: '联系 VESSEL',
    backToMapLabel: '返回地图',
  },
}

function clean(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function moduleByKey(modules: GlobalPageModuleLike[] | null | undefined, moduleKey: string) {
  return (modules ?? []).find((pageModule) => (
    pageModule.module_key === moduleKey && pageModule.is_visible !== false
  )) ?? null
}

function itemById(pageModule: GlobalPageModuleLike | null, id: string) {
  return (pageModule?.items ?? []).find((item) => item.id === id && item.is_visible !== false) ?? null
}

function localizedField(
  item: GlobalPageModuleItemLike | null,
  lang: GlobalCmsLang,
  field: 'label' | 'content' | 'value',
  fallback: string,
) {
  if (!item) return fallback
  const zhValue = field === 'label' ? item.label_zh : field === 'content' ? item.content_zh : item.value_zh
  const enValue = field === 'label' ? item.label_en : field === 'content' ? item.content_en : item.value_en
  return clean(lang === 'zh' ? zhValue || enValue : enValue || zhValue) || fallback
}

function moduleTitle(pageModule: GlobalPageModuleLike | null, lang: GlobalCmsLang, fallback: string) {
  if (!pageModule) return fallback
  return clean(lang === 'zh' ? pageModule.title_zh || pageModule.title_en : pageModule.title_en || pageModule.title_zh) || fallback
}

function moduleDescription(pageModule: GlobalPageModuleLike | null, lang: GlobalCmsLang, fallback: string) {
  if (!pageModule) return fallback
  return clean(lang === 'zh' ? pageModule.description_zh || pageModule.description_en : pageModule.description_en || pageModule.description_zh) || fallback
}

export function buildGlobalCmsLabels(
  modules: GlobalPageModuleLike[] | null | undefined,
  lang: GlobalCmsLang,
): GlobalCmsLabels {
  const fallback = FALLBACK_LABELS[lang]
  const hero = moduleByKey(modules, 'hero')
  const header = moduleByKey(modules, 'header')
  const mapLabels = moduleByKey(modules, 'map-labels')
  const detailLabels = moduleByKey(modules, 'detail-labels')
  const ctaLabels = moduleByKey(modules, 'cta-labels')

  const headerLabel = (id: string, field: 'label' | 'content' | 'value', value: string) =>
    localizedField(itemById(header, id), lang, field, value)
  const mapLabel = (id: string, value: string) =>
    localizedField(itemById(mapLabels, id), lang, 'label', value)
  const mapContent = (id: string, value: string) =>
    localizedField(itemById(mapLabels, id), lang, 'content', value)
  const detailLabel = (id: string, value: string) =>
    localizedField(itemById(detailLabels, id), lang, 'label', value)
  const detailContent = (id: string, value: string) =>
    localizedField(itemById(detailLabels, id), lang, 'content', value)
  const ctaLabel = (id: string, value: string) =>
    localizedField(itemById(ctaLabels, id), lang, 'label', value)

  return {
    seoTitle: moduleTitle(hero, lang, fallback.seoTitle),
    seoDescription: moduleDescription(hero, lang, fallback.seoDescription),
    headerTitle: moduleTitle(header, lang, fallback.headerTitle),
    logoAlt: headerLabel('logo-alt', 'label', fallback.logoAlt),
    countriesValue: headerLabel('countries', 'value', fallback.countriesValue),
    countriesLabel: headerLabel('countries', 'label', fallback.countriesLabel),
    campsValue: headerLabel('camps', 'value', fallback.campsValue),
    campsLabel: headerLabel('camps', 'label', fallback.campsLabel),
    devicesValue: headerLabel('devices', 'value', fallback.devicesValue),
    devicesLabel: headerLabel('devices', 'label', fallback.devicesLabel),
    languageEn: headerLabel('language-en', 'label', fallback.languageEn),
    languageZh: headerLabel('language-zh', 'label', fallback.languageZh),
    loadingLabel: mapLabel('loading', fallback.loadingLabel),
    closeLabel: mapLabel('close', fallback.closeLabel),
    panelOpeningLabel: mapLabel('panel-opening', fallback.panelOpeningLabel),
    panelLoadingBody: mapContent('panel-loading-body', fallback.panelLoadingBody),
    mapErrorTitle: mapLabel('map-error-title', fallback.mapErrorTitle),
    mapInitErrorBody: mapContent('map-init-error-body', fallback.mapInitErrorBody),
    mapStyleErrorBody: mapContent('map-style-error-body', fallback.mapStyleErrorBody),
    mapRetryLabel: mapLabel('map-retry', fallback.mapRetryLabel),
    shareLabel: detailLabel('share', fallback.shareLabel),
    shareTitlePrefix: detailLabel('share-title-prefix', fallback.shareTitlePrefix),
    shareText: detailContent('share-text', fallback.shareText),
    linkCopied: detailLabel('link-copied', fallback.linkCopied),
    copyPrompt: detailLabel('copy-prompt', fallback.copyPrompt),
    unitsLabel: detailLabel('units', fallback.unitsLabel),
    perUnitLabel: detailLabel('per-unit', fallback.perUnitLabel),
    guestsLabel: detailLabel('guests', fallback.guestsLabel),
    openedLabel: detailLabel('opened', fallback.openedLabel),
    overviewEyebrow: detailLabel('overview-eyebrow', fallback.overviewEyebrow),
    overviewTitle: detailLabel('overview-title', fallback.overviewTitle),
    amenitiesEyebrow: detailLabel('amenities-eyebrow', fallback.amenitiesEyebrow),
    amenitiesTitle: detailLabel('amenities-title', fallback.amenitiesTitle),
    galleryEyebrow: detailLabel('gallery-eyebrow', fallback.galleryEyebrow),
    galleryTitle: detailLabel('gallery-title', fallback.galleryTitle),
    transportEyebrow: detailLabel('transport-eyebrow', fallback.transportEyebrow),
    transportTitle: detailLabel('transport-title', fallback.transportTitle),
    nearbyTitle: detailLabel('nearby-title', fallback.nearbyTitle),
    bookNowLabel: ctaLabel('book-now', fallback.bookNowLabel),
    contactLabel: ctaLabel('contact', fallback.contactLabel),
    backToMapLabel: ctaLabel('back-to-map', fallback.backToMapLabel),
  }
}
