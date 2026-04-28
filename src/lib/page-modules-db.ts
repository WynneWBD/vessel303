import { pool } from '@/lib/db'

export type PageModuleItem = {
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

type DbPageModuleRow = Omit<PageModuleRow, 'items'> & {
  items: unknown
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
        href: 'https://en.303vessel.cn/products_list.html',
        label_zh: '探索产品',
        label_en: 'Explore Products',
        is_visible: true,
        sort_order: 40,
      },
      {
        id: 'hero-secondary-cta',
        href: 'https://en.303vessel.cn/contact.html',
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
        label_zh: '自 2018 年创立，已在全国落地 300+ 项目，出口远销 30+ 国家，带领中国文旅创新品类走向全球。',
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
        label_zh: '高端度假营地\n开创者',
        label_en: 'Pioneer of the\nSpace-Themed\nLuxury Camp Resort',
        is_visible: true,
        sort_order: 20,
      },
      {
        id: 'story-paragraph-01',
        label_zh: '段落 1',
        label_en: 'Paragraph 1',
        content_zh: 'VESSEL 微宿® 是高端度假营地开创者。我们以科幻感强烈的装配式舱体产品为特色，为全球文旅运营方提供一站式营地解决方案。自 2018 年创立，已在全国落地 300+ 项目，出口远销 30+ 国家，带领中国文旅创新品类"太空主题营地"走向全球。',
        content_en: 'VESSEL® pioneered the space-themed luxury camp resort category. We design, manufacture and deliver sci-fi-inspired prefabricated cabins, offering a turnkey solution for resort operators worldwide. Since 2018 we have delivered 300+ projects across China and exported to 30+ countries, taking the space-themed resort — a new Chinese category of experiential tourism — to the global market.',
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
        content_zh: 'VESSEL 在文旅场景之外，也与头部企业共创，产品广泛应用于养老度假地产、城市移动商业、便民服务设施等多元场景。我们构建了 VIPC 整装预制、VIIE 智能交互、VOLS 离网系统三大核心技术体系，让每一台微宿都能独立面对全球的气候、运输、运营挑战。',
        content_en: 'Beyond tourism, VESSEL® partners with leading enterprises on mixed-use deployments — senior resort real estate, urban mobile retail, and public amenity installations. Our three proprietary technology systems — VIPC, VIIE and VOLS — allow every unit to operate autonomously under diverse climates, logistics routes and operating models worldwide.',
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
        content_zh: '王帅斌于 2018 年创立 VESSEL 微宿，以国际建筑师视野重新定义中国文旅行业。他持有英国邓迪大学建筑学硕士（RIBA Part II 认证）及美国圣路易斯华盛顿大学建筑学硕士学位，曾任职于纽约华尔街 SOM 建筑设计事务所。在他的带领下，微宿开创了"太空主题高端度假营地"品类，成长为出口 30 余国的全球知名品牌。',
        content_en: 'Wang Shuaibin founded VESSEL in 2018, bringing an international architectural perspective to the cultural tourism industry. He holds Master of Architecture degrees from the University of Dundee (RIBA Part II) and Washington University in St. Louis, and previously worked at SOM Architects on Wall Street, New York City. Under his leadership, VESSEL pioneered the space-themed luxury camp resort category and has grown into a globally recognised brand with exports across 30+ countries.',
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

function normalizeItems(value: unknown): PageModuleItem[] {
  if (!Array.isArray(value)) return []
  const items: PageModuleItem[] = []
  value.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const raw = item as Partial<PageModuleItem>
    items.push({
      id: typeof raw.id === 'string' && raw.id ? raw.id : `item-${index + 1}`,
      image_url: typeof raw.image_url === 'string' ? raw.image_url : undefined,
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

async function seedDefaultPageModules() {
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
  await seedDefaultPageModules()
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
  await seedDefaultPageModules()
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
