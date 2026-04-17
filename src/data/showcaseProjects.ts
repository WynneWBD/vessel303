export interface ShowcaseProject {
  id: string
  name: { en: string; zh: string }
  location: { en: string; zh: string }
  coordinates: [number, number]  // [lng, lat] — MapLibre order
  country: string  // flag emoji
  openDate: string           // 'TBD' allowed when unknown
  units: number | null       // null → UI displays '—'
  unitArea: number | null    // null → UI displays '—'
  guests: string             // 'TBD' allowed when unknown
  bookingUrl: string
  description: { en: string; zh: string }
  amenities: Array<{
    icon: string
    label: { en: string; zh: string }
  }>
  transport: {
    en: Array<{ mode: string; text: string }>
    zh: Array<{ mode: string; text: string }>
  }
  nearby: {
    en: Array<{ name: string; distance: string }>
    zh: Array<{ name: string; distance: string }>
  }
  images: string[]
}

export const SHOWCASE_PROJECTS: ShowcaseProject[] = [
  // ═══ 海外项目 (10) ═══
  {
    id: 'astrobase-mamison',
    name: { en: 'AstroBase Mamison Hotel', zh: 'AstroBase 太空基地酒店' },
    location: { en: 'Mamison Ski Resort, North Ossetia, Russia', zh: '俄罗斯北奥塞梯·Mamison滑雪度假区' },
    coordinates: [43.839825, 42.662101],
    country: '🇷🇺',
    openDate: '2025.03',
    units: 20,
    unitArea: 35,
    guests: '2-4',
    bookingUrl: 'https://astrobasehotel.ru/',
    description: {
      en: 'A futuristic glamping resort nestled in the Caucasus Mountains at Mamison Ski Resort. 20 independent space capsule units with panoramic windows, smart home systems, and private terraces.',
      zh: '坐落于高加索山脉Mamison滑雪度假区的未来感豪华露营地。20栋独立太空舱，配备全景落地窗、智能家居和私人阳台。',
    },
    amenities: [
      { icon: '🏔', label: { en: 'Ski Resort 1km', zh: '滑雪场1km' } },
      { icon: '🪟', label: { en: 'Panoramic Windows', zh: '全景落地窗' } },
      { icon: '📱', label: { en: 'Smart Control', zh: '智能控制' } },
      { icon: '🍳', label: { en: 'Full Kitchen', zh: '独立厨房' } },
      { icon: '🅿️', label: { en: 'Free Parking', zh: '免费停车' } },
      { icon: '♨️', label: { en: 'Floor Heating', zh: '地暖系统' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Vladikavkaz Airport — 1.5h drive' }, { mode: '🚂', text: 'Alagir Station — 45min drive' }, { mode: '🚗', text: 'From Vladikavkaz via M29 — 1.5h' }],
      zh: [{ mode: '✈️', text: '弗拉季高加索机场 — 车程1.5小时' }, { mode: '🚂', text: '阿拉吉尔火车站 — 车程45分钟' }, { mode: '🚗', text: '弗拉季高加索沿M29高速 — 1.5小时' }],
    },
    nearby: {
      en: [{ name: 'Kalak Ski Station', distance: '1 km' }, { name: 'Mamihdon River Gorge', distance: 'Walking' }, { name: 'Mount Elbrus', distance: '2h drive' }],
      zh: [{ name: 'Калак滑雪站', distance: '1公里' }, { name: 'Mamihdon河峡谷', distance: '步行可达' }, { name: '厄尔布鲁士山', distance: '车程2小时' }],
    },
    images: ['/images/projects/astrobase-mamison/exterior-01.png', '/images/projects/astrobase-mamison/interior-01.png', '/images/projects/astrobase-mamison/exterior-02.jpg', '/images/projects/astrobase-mamison/interior-02.png', '/images/projects/astrobase-mamison/exterior-03.jpg', '/images/projects/astrobase-mamison/interior-03.png'],
  },

  // ─── Israel · Dream Island Spa & Health Resort ───
  {
    id: 'israel-dream-island',
    name: { en: 'Dream Island Spa & Health Resort', zh: 'Dream Island 水疗健康度假村' },
    location: { en: "Sde Yo'av, Southern District, Israel", zh: "以色列南部区·Sde Yo'av·Yoav 集体农场" },
    coordinates: [34.676849, 31.645723],
    country: '🇮🇱',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: 'TBD',
    bookingUrl: 'https://www.dream-island.co.il/orderonline/booking',
    description: {
      en: "A 60-dunam private wellness oasis on the edge of Kibbutz Sde Yo'av in southern Israel, anchored by the Hamei Yoav hot springs. Mediterranean-inspired architecture combines Turkish hammam, year-round outdoor pools, and full-service spa suites for a fully immersive retreat between Kiryat Gat and Ashkelon.",
      zh: '坐落于以色列南部 Sde Yoav 集体农场边缘，占地 60 德南的高端水疗健康度假村，前身为 HameiYoav 温泉。融合地中海风情建筑与沉浸式疗愈体验：土耳其浴、四季泳池、多元 spa 与客房服务，位处 Kiryat Gat 与 Ashkelon 之间，是以色列南部热门度假地标。',
    },
    amenities: [
      { icon: '♨️', label: { en: 'Hot Springs & Spa', zh: '温泉水疗' } },
      { icon: '🏊', label: { en: 'Year-Round Pool', zh: '四季泳池' } },
      { icon: '🍽', label: { en: 'Mediterranean Dining', zh: '地中海餐厅' } },
      { icon: '🛁', label: { en: 'Turkish Hammam', zh: '土耳其浴' } },
      { icon: '📶', label: { en: 'Free WiFi', zh: '免费 WiFi' } },
      { icon: '🅿️', label: { en: 'Private Parking', zh: '私人停车场' } },
    ],
    transport: {
      en: [
        { mode: '✈️', text: 'Ben Gurion Airport — ~59 km / 1h drive' },
        { mode: '🚂', text: 'Kiryat Gat Station — 15 km, then taxi/bus' },
        { mode: '🚗', text: 'From Tel Aviv / Jerusalem via A35 / A3 — ~1h' },
      ],
      zh: [
        { mode: '✈️', text: '本·古里安国际机场 — 约 59 公里 / 车程 1 小时' },
        { mode: '🚂', text: 'Kiryat Gat 火车站 — 15 公里，转出租或巴士' },
        { mode: '🚗', text: '特拉维夫 / 耶路撒冷 沿 A35 / A3 — 车程约 1 小时' },
      ],
    },
    nearby: {
      en: [
        { name: 'Ashkelon National Park', distance: '~25 km' },
        { name: 'Yoav Valley', distance: 'Adjacent' },
        { name: 'Kiryat Gat City Center', distance: '15 km' },
        { name: 'Jerusalem (Holy Sites)', distance: '~1.5h drive' },
      ],
      zh: [
        { name: 'Ashkelon 国家公园', distance: '约 25 公里' },
        { name: 'Yoav 河谷', distance: '紧邻' },
        { name: 'Kiryat Gat 市中心', distance: '15 公里' },
        { name: '耶路撒冷 (宗教景点)', distance: '车程约 1.5 小时' },
      ],
    },
    images: [
      '/images/projects/israel-dream-island/exterior-01.jpg',
      '/images/projects/israel-dream-island/exterior-02.jpg',
      '/images/projects/israel-dream-island/exterior-03-web.jpg',
      '/images/projects/israel-dream-island/exterior-04.jpg',
    ],
  },

  // ─── Argentina · Holihaus Centro Comercial Nordelta ───
  {
    id: 'argentina-nordelta',
    name: { en: 'Holihaus Argentina Showroom — Centro Comercial Nordelta', zh: 'Holihaus 阿根廷展厅 · Nordelta 购物中心' },
    location: { en: 'Centro Comercial Nordelta, Tigre, Buenos Aires Province, Argentina', zh: '阿根廷布宜诺斯艾利斯省·蒂格雷市·诺德尔塔购物中心' },
    coordinates: [-58.6066, -34.3855],
    country: '🇦🇷',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: 'TBD',
    bookingUrl: '',
    description: {
      en: 'VESSEL\'s Latin American showroom at Centro Comercial Nordelta, located in the upscale waterfront district of Nordelta, Tigre. A permanent exhibition space showcasing modular space-capsule architecture and smart living solutions to the South American market.',
      zh: '位于阿根廷蒂格雷市高端滨水富人区诺德尔塔购物中心，是 VESSEL 微宿在拉丁美洲的首个展厅，面向南美市场展示模块化太空舱建筑与智能居住方案。',
    },
    amenities: [
      { icon: '🏙', label: { en: 'Waterfront Location', zh: '滨水地段' } },
      { icon: '🛸', label: { en: 'Space Capsule Display', zh: '太空舱实体展示' } },
      { icon: '🔧', label: { en: 'Custom Design Consult', zh: '定制设计咨询' } },
      { icon: '🅿️', label: { en: 'Shopping Center Parking', zh: '购物中心停车场' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Buenos Aires Ezeiza Airport — ~55 km / 1h drive' }, { mode: '🚢', text: 'Tigre delta ferry connections nearby' }, { mode: '🚗', text: 'From Buenos Aires city via Panamericana — ~45 min' }],
      zh: [{ mode: '✈️', text: '布宜诺斯艾利斯埃塞萨机场 — 约55公里/车程1小时' }, { mode: '🚢', text: '附近有蒂格雷三角洲轮渡' }, { mode: '🚗', text: '布宜诺斯艾利斯市区沿泛美高速 — 约45分钟' }],
    },
    nearby: {
      en: [{ name: 'Nordelta Lakes District', distance: 'On-site' }, { name: 'Tigre Delta', distance: '~5 km' }, { name: 'Buenos Aires city center', distance: '~45 km' }],
      zh: [{ name: '诺德尔塔湖区', distance: '园区内' }, { name: '蒂格雷三角洲', distance: '约5公里' }, { name: '布宜诺斯艾利斯市中心', distance: '约45公里' }],
    },
    images: ['/images/projects/argentina-nordelta/exterior-01.jpg', '/images/projects/argentina-nordelta/exterior-02.jpg', '/images/projects/argentina-nordelta/interior-01.jpg', '/images/projects/argentina-nordelta/interior-02.jpg'],
  },

  // ─── Russia · Калак Ski Station ───
  {
    id: 'russia-kalak',
    name: { en: 'Kalak Ski Station — Mamison Resort', zh: 'Калак 滑雪站 · Mamison 度假区' },
    location: { en: 'Mamison Valley, Alagir District, North Ossetia, Russia', zh: '俄罗斯北奥塞梯·阿拉吉尔区·Mamison峡谷' },
    coordinates: [43.855, 42.668],
    country: '🇷🇺',
    openDate: '2025.03',
    units: null,
    unitArea: null,
    guests: 'TBD',
    bookingUrl: 'https://miragrp.ru/realizovannye-proekty/elbrus',
    description: {
      en: 'Калак (Kalak) is the main ski station of the Mamison all-season mountain resort in North Ossetia — the gateway hub at 2,025 m elevation, connecting to Zaramag-1 and Zaramag-2 via the longest gondola line in the North Caucasus. 19 km of ski runs from beginner green to expert black, with summer hiking, rafting and mountain biking.',
      zh: 'Калак 是北奥塞梯 Mamison 全季度假区起点滑雪站，海拔 2025 米，连接 Zaramag-1/2 高海拔站，拥有北高加索最长的 gondola 缆车（约 3.3 公里）。19 公里滑雪道覆盖初-中-高-专业四级，夏季可徒步、漂流和山地骑行。',
    },
    amenities: [
      { icon: '⛷', label: { en: '19 km Ski Runs', zh: '19公里滑雪道' } },
      { icon: '🚡', label: { en: 'Gondola Cable Car', zh: 'gondola 缆车' } },
      { icon: '🎿', label: { en: 'Ski Rental & School', zh: '装备租赁与滑雪学校' } },
      { icon: '☕', label: { en: 'MoonBase Café', zh: 'MoonBase 咖啡馆' } },
      { icon: '🚌', label: { en: 'Free Resort Shuttle', zh: '度假区免费接驳车' } },
      { icon: '🏔', label: { en: '4-Season Activities', zh: '四季户外活动' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Vladikavkaz Airport — 1.5h drive' }, { mode: '🚂', text: 'Alagir Station — 45 min drive' }, { mode: '🚌', text: 'Free shuttle from resort accommodation' }],
      zh: [{ mode: '✈️', text: '弗拉季高加索机场 — 车程1.5小时' }, { mode: '🚂', text: '阿拉吉尔火车站 — 车程45分钟' }, { mode: '🚌', text: '度假区住宿免费接驳车' }],
    },
    nearby: {
      en: [{ name: 'AstroBase Mamison Hotel', distance: '1 km' }, { name: 'Mamihdon River Gorge', distance: 'Walking' }, { name: 'Mount Elbrus', distance: '2h drive' }, { name: 'Tsey Gorge', distance: '1.5h drive' }],
      zh: [{ name: 'AstroBase Mamison 酒店', distance: '1公里' }, { name: 'Mamihdon 河峡谷', distance: '步行可达' }, { name: '厄尔布鲁士山', distance: '车程2小时' }, { name: 'Tsey 峡谷', distance: '车程1.5小时' }],
    },
    images: ['/images/projects/russia-kalak/exterior-01.webp', '/images/projects/russia-kalak/exterior-02.webp', '/images/projects/russia-kalak/exterior-03.png'],
  },

  // ─── USA · Clewiston, Florida ───
  {
    id: 'usa-clewiston',
    name: { en: 'V9 Eco Smart Community — Clewiston, Florida', zh: 'V9 智能生态社区 · 佛罗里达州克莱威斯顿' },
    location: { en: 'Clewiston, Hendry County, Florida, USA', zh: '美国佛罗里达州·亨德里县·克莱威斯顿' },
    coordinates: [-80.9329, 26.7535],
    country: '🇺🇸',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: 'TBD',
    bookingUrl: '',
    description: {
      en: 'A sustainable smart-living community in Clewiston, Florida — featuring VESSEL V9-series modular space-capsule homes with 270° panoramic glass walls overlooking lake and wetland scenery. Built with high-strength eco-friendly materials, each unit installs on-site in under 2 hours and integrates a full smart-home system with smart locks, climate control, lighting and motorized blinds.',
      zh: '位于佛罗里达州亨德里县克莱威斯顿的可持续智能生态社区，采用 VESSEL V9 系列太空舱式模块化住宅，270° 全景落地窗俯瞰湖景与湿地。高强度环保结构，现场安装仅需 2 小时，内置完整智能家居系统，实现科技、环保与自然景观的融合。',
    },
    amenities: [
      { icon: '🪟', label: { en: '270° Panoramic Windows', zh: '270° 全景落地窗' } },
      { icon: '📱', label: { en: 'Full Smart Home', zh: '全套智能家居' } },
      { icon: '🌿', label: { en: 'Eco-Friendly Build', zh: '环保建造' } },
      { icon: '💧', label: { en: 'Lake & Wetland Views', zh: '湖景湿地景观' } },
      { icon: '⚡', label: { en: '2-Hour Installation', zh: '2小时现场安装' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Fort Lauderdale Airport — ~150 km / 1.5h drive' }, { mode: '🚗', text: 'From Miami via US-27 — ~2h drive' }, { mode: '🚗', text: 'From Fort Myers via US-27 — ~1h drive' }],
      zh: [{ mode: '✈️', text: '劳德代尔堡机场 — 约150公里/车程1.5小时' }, { mode: '🚗', text: '迈阿密沿US-27公路 — 约2小时' }, { mode: '🚗', text: '迈尔斯堡沿US-27 — 约1小时' }],
    },
    nearby: {
      en: [{ name: 'Lake Okeechobee', distance: '~10 km' }, { name: 'Big Cypress National Preserve', distance: '~60 km' }, { name: 'Everglades National Park', distance: '~120 km' }],
      zh: [{ name: '奥基乔比湖', distance: '约10公里' }, { name: '大柏树国家保护区', distance: '约60公里' }, { name: '大沼泽地国家公园', distance: '约120公里' }],
    },
    images: ['/images/projects/usa-clewiston/exterior-01.jpg', '/images/projects/usa-clewiston/exterior-02.jpg', '/images/projects/usa-clewiston/exterior-03.jpg'],
  },

  // ─── USA · Georgetown, Louisiana ───
  {
    id: 'usa-georgetown',
    name: { en: 'E9 Eco Smart Cabin Community — Georgetown, Louisiana', zh: 'E9 智能生态小屋社区 · 路易斯安那州乔治城' },
    location: { en: 'Georgetown, Grant Parish, Louisiana, USA', zh: '美国路易斯安那州·格兰特县·乔治城镇' },
    coordinates: [-92.3988, 31.617],
    country: '🇺🇸',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: 'TBD',
    bookingUrl: '',
    description: {
      en: 'VESSEL E9-series smart eco-cabins in Georgetown, Louisiana — set against the rolling hills of the Kisatchie National Forest, the only national forest in Louisiana. Each streamlined space-capsule home features 270° panoramic windows framing pine-forest sunrises and star-filled night skies, merging sustainable living with deep nature immersion.',
      zh: '位于路易斯安那州格兰特县乔治城镇，背靠路易斯安那州唯一的国家森林 Kisatchie，采用 VESSEL E9 系列流线型太空舱智能生态小屋，270° 全景落地窗将松林日出与满天星空纳入室内，是追求自然与现代生活平衡的理想居所。',
    },
    amenities: [
      { icon: '🌲', label: { en: 'National Forest Setting', zh: '国家森林环境' } },
      { icon: '🪟', label: { en: '270° Panoramic Windows', zh: '270° 全景落地窗' } },
      { icon: '📱', label: { en: 'Smart Home System', zh: '智能家居系统' } },
      { icon: '🎣', label: { en: 'Fishing & Hiking Nearby', zh: '附近钓鱼徒步' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Alexandria Regional Airport — ~30 min drive' }, { mode: '🚗', text: 'From Alexandria via US-165 — ~30 min' }, { mode: '🚗', text: 'From Shreveport — ~2h drive' }],
      zh: [{ mode: '✈️', text: '亚历山大地区机场 — 约30分钟车程' }, { mode: '🚗', text: '亚历山大沿US-165 — 约30分钟' }, { mode: '🚗', text: '什里夫波特出发 — 约2小时' }],
    },
    nearby: {
      en: [{ name: 'Kisatchie National Forest', distance: 'Adjacent (600k+ acres)' }, { name: 'Alexandria City Center', distance: '~30 min' }, { name: 'Colfax Historic Site', distance: '~20 km' }],
      zh: [{ name: 'Kisatchie 国家森林（超60万英亩）', distance: '紧邻' }, { name: '亚历山大市中心', distance: '约30分钟' }, { name: 'Colfax 历史遗址', distance: '约20公里' }],
    },
    images: ['/images/projects/usa-georgetown/exterior-01.jpg', '/images/projects/usa-georgetown/exterior-02.jpg', '/images/projects/usa-georgetown/exterior-03.jpg', '/images/projects/usa-georgetown/exterior-04.jpg'],
  },

  // ─── USA · Mount Pleasant, Texas ───
  {
    id: 'usa-mount-pleasant',
    name: { en: 'E9 Eco Smart Cabin Community — Mount Pleasant, Texas', zh: 'E9 智能生态小屋社区 · 德克萨斯州芒特普莱森特' },
    location: { en: 'Twin Lakes Resort, Mount Pleasant, Titus County, Texas, USA', zh: '美国德克萨斯州·泰特斯县·芒特普莱森特·双湖度假村' },
    coordinates: [-95.0025, 33.1562],
    country: '🇺🇸',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: 'TBD',
    bookingUrl: '',
    description: {
      en: 'VESSEL E9 space-capsule homes at Twin Lakes Resort in Mount Pleasant, Texas — set between Bob Sandlin Lake and Cypress Springs Lake. Futuristic streamlined design meets lakeside nature: fishing, boating, kayaking, and resort amenities (pool, gym, BBQ, mini-golf) steps away. A 1.5-hour drive from the Dallas–Fort Worth metroplex.',
      zh: '位于德克萨斯州泰特斯县芒特普莱森特双湖度假村，E9 系列太空舱式智能生态小屋坐落于 Bob Sandlin 湖与 Cypress Springs 湖之间，融合未来感设计与湖畔自然美景，钓鱼、划船、皮划艇及度假村配套设施一应俱全，距达拉斯/沃斯堡都会区约1.5小时。',
    },
    amenities: [
      { icon: '🏊', label: { en: 'Dual Lake Waterfront', zh: '双湖滨水' } },
      { icon: '🎣', label: { en: 'Fishing & Boating', zh: '钓鱼划船' } },
      { icon: '🏋', label: { en: 'Resort Gym & Pool', zh: '度假村健身房与泳池' } },
      { icon: '🪟', label: { en: '270° Panoramic Windows', zh: '270° 全景落地窗' } },
      { icon: '⛳', label: { en: 'Mini Golf On-site', zh: '园内迷你高尔夫' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Dallas/Fort Worth Airport — ~1.5h drive' }, { mode: '🚗', text: 'From Dallas via I-30 East — ~1.5h' }, { mode: '🚗', text: 'From Texarkana — ~1h drive' }],
      zh: [{ mode: '✈️', text: '达拉斯/沃斯堡机场 — 约1.5小时车程' }, { mode: '🚗', text: '达拉斯沿I-30东行 — 约1.5小时' }, { mode: '🚗', text: 'Texarkana 出发 — 约1小时' }],
    },
    nearby: {
      en: [{ name: 'Bob Sandlin State Park', distance: '~5 km' }, { name: 'Caddo National Grasslands', distance: '~40 min' }, { name: 'Mount Pleasant City Center', distance: '~10 km' }],
      zh: [{ name: 'Bob Sandlin 州立公园', distance: '约5公里' }, { name: 'Caddo 国家草原', distance: '约40分钟' }, { name: '芒特普莱森特市中心', distance: '约10公里' }],
    },
    images: ['/images/projects/usa-mount-pleasant/exterior-01.jpg', '/images/projects/usa-mount-pleasant/exterior-02.jpg', '/images/projects/usa-mount-pleasant/exterior-03.jpg'],
  },

  // ─── Japan · SPACE-VESSEL Base — Vacation STAY 42244v ───
  {
    id: 'japan-space-vessel',
    name: { en: 'SPACE-VESSEL Base — Vacation STAY', zh: 'SPACE-VESSEL Base 宇宙船主题住宿' },
    location: { en: 'Tsukahara, Yufuin-cho, Yufu City, Oita Prefecture, Japan', zh: '日本大分县由布市湯布院町塚原' },
    coordinates: [131.343, 33.284],
    country: '🇯🇵',
    openDate: 'TBD',
    units: 1,
    unitArea: 38,
    guests: '2-5',
    bookingUrl: 'https://www.booking.com/hotel/jp/yufu-city-camp-vacation-stay-42244v.zh-cn.html',
    description: {
      en: 'A futuristic spacecraft-themed vacation stay in the mountains of Yufuin-cho, Yufu City, Oita — just 7.4 km from the iconic Kinrin Lake. The 38 m² space-capsule unit sleeps up to 5 guests with a full kitchen, private terrace, free BBQ, and a "Salon Lunaire" lunar lounge area. Surrounded by forest streams with views of Mount Yufu.',
      zh: '位于日本大分县由布市汤布院町塚原，距著名金鱗湖仅7.4公里的宇宙船主题住宿。38㎡太空舱，最多容纳5名客人，配全套厨房、私人露台、免费烧烤区及月球沙龙休闲空间，绿树环绕、溪流相伴，可眺望由布岳。',
    },
    amenities: [
      { icon: '🛸', label: { en: 'Spacecraft Interior Design', zh: '宇宙船沉浸式内饰' } },
      { icon: '🍳', label: { en: 'Full Kitchen', zh: '完整厨房设备' } },
      { icon: '🔥', label: { en: 'Outdoor BBQ', zh: '户外无烟烧烤' } },
      { icon: '🅿️', label: { en: 'Free Parking', zh: '免费专用停车场' } },
      { icon: '📶', label: { en: 'High-Speed WiFi', zh: '全屋高速WiFi' } },
      { icon: '🏔', label: { en: 'Mt. Yufu Views', zh: '由布岳山景' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'Yufuin Station — 18 min drive (6 km)' }, { mode: '🚗', text: 'Minami-Yufu Station — 25 min drive (9 km)' }, { mode: '✈️', text: 'Oita Airport — ~50 min drive' }],
      zh: [{ mode: '🚗', text: '由布院駅 — 车程约18分钟（6公里）' }, { mode: '🚗', text: '南由布駅 — 车程约25分钟（9公里）' }, { mode: '✈️', text: '大分机场 — 车程约50分钟' }],
    },
    nearby: {
      en: [{ name: 'Kinrin Lake (Yufuin)', distance: '7.4 km' }, { name: 'Yufuin Onsen Ryokan District', distance: '~10 km' }, { name: 'Mount Yufu (Hiking)', distance: '~8 km' }],
      zh: [{ name: '金鱗湖', distance: '7.4公里' }, { name: '汤布院温泉旅馆区', distance: '约10公里' }, { name: '由布岳（徒步）', distance: '约8公里' }],
    },
    images: ['/images/projects/japan-space-vessel/exterior-01.jpg', '/images/projects/japan-space-vessel/exterior-02.jpg', '/images/projects/japan-space-vessel/exterior-03.jpg', '/images/projects/japan-space-vessel/exterior-04.png', '/images/projects/japan-space-vessel/interior-01.png', '/images/projects/japan-space-vessel/interior-02.png'],
  },

  // ─── Japan · 瀬戸の浜 Beach & Resort ───
  {
    id: 'japan-setonohama',
    name: { en: 'Setonohama Beach & Resort', zh: '瀬戸の浜 Beach & Resort' },
    location: { en: 'Sakate, Shodoshima-cho, Shodoshima Island, Kagawa Prefecture, Japan', zh: '日本香川县小豆郡小豆岛町坂手' },
    coordinates: [134.5155, 34.4813],
    country: '🇯🇵',
    openDate: '2025.04',
    units: 5,
    unitArea: 28,
    guests: '2-3',
    bookingUrl: 'https://setonohama.com/#access',
    description: {
      en: 'Opened April 2025 on the shores of Shodoshima Island, Kagawa — 5 independent spacecraft-shaped VESSEL Bezel S5 units facing the Seto Inland Sea. Each private villa includes a King Size bed, smart home controls, projector, BBQ terrace, and complimentary SUP/kayak use. One pet-friendly unit available. Stunning sunrise, sunset and stargazing.',
      zh: '2025年4月开业，位于濑户内海小豆岛坂手海岸，5栋独立宇宙船造型 VESSEL Bezel S5 太空舱，每栋面向濑户内海，配 King Size 大床、智能家居、投影仪与专属 BBQ 露台，免费提供 SUP 和皮划艇。含1栋宠物友好房型，可欣赏日出、日落与璀璨星空。',
    },
    amenities: [
      { icon: '🌊', label: { en: 'Seto Inland Sea View', zh: '濑户内海景观' } },
      { icon: '🛸', label: { en: 'Spacecraft Capsule Design', zh: '宇宙船造型设计' } },
      { icon: '🏄', label: { en: 'Free SUP & Kayak', zh: '免费SUP与皮划艇' } },
      { icon: '🔥', label: { en: 'Private BBQ Terrace', zh: '私人BBQ露台' } },
      { icon: '🐕', label: { en: 'Pet-Friendly Unit', zh: '宠物友好房型' } },
      { icon: '🎣', label: { en: 'Ocean Activities', zh: '海上活动体验' } },
    ],
    transport: {
      en: [{ mode: '⛴', text: 'Sakate Port — 5 min drive / 20 min walk' }, { mode: '⛴', text: 'Ferry from Osaka/Kobe/Okayama to Sakate' }, { mode: '🚗', text: 'From Ikeda Port / Tonosho Port — ~30 min drive' }],
      zh: [{ mode: '⛴', text: '坂手港 — 车程5分钟/步行20分钟' }, { mode: '⛴', text: '大阪/神户/冈山乘船至坂手港' }, { mode: '🚗', text: '池田港/土庄港出发 — 约30分钟' }],
    },
    nearby: {
      en: [{ name: 'Setonohama Beach (Walk)', distance: 'Steps away' }, { name: '24 Pupils Film Village', distance: '~20 min drive' }, { name: 'Olive Park', distance: '~20 min drive' }, { name: 'Angel Road', distance: '~30 min drive' }],
      zh: [{ name: '瀬戸の浜海滩', distance: '步行即达' }, { name: '二十四瞳映画村', distance: '车程约20分钟' }, { name: '橄榄公园', distance: '车程约20分钟' }, { name: '天使之路', distance: '车程约30分钟' }],
    },
    images: ['/images/projects/japan-setonohama/exterior-01.png', '/images/projects/japan-setonohama/exterior-02.webp', '/images/projects/japan-setonohama/interior-01.webp', '/images/projects/japan-setonohama/interior-02.jpg'],
  },

  // ─── Thailand · Nx Space Pool Villa ───
  {
    id: 'thailand-nx-space',
    name: { en: 'Nx Space Pool Villa', zh: 'Nx Space 泳池别墅' },
    location: { en: 'Pak Phli District, Nakhon Nayok Province, Thailand', zh: '泰国那空那育府·Pak Phli 区' },
    coordinates: [101.2159, 14.3485],
    country: '🇹🇭',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: '2-9',
    bookingUrl: 'https://www.booking.com/hotel/th/nx-space-phluuwillaa.zh-cn.html',
    description: {
      en: 'A high-end private villa in Nakhon Nayok Province, ~80–90 km from Bangkok — modern minimalist design with an infinity pool at its center, open-plan living, lush garden and full privacy. 4 bedrooms, 3 bathrooms, for up to 9 guests. VESSEL modular space capsules integrated into the resort aesthetic. Ideal for families, friends and group retreats.',
      zh: '位于泰国那空那育府 Pak Phli 区，距曼谷约80-90公里的高端私人别墅度假地，现代简约轻奢风格，无边际泳池为核心景观，4卧3卫最多入住9人。全屋通透采光、绿植环绕，VESSEL 模块化太空舱融入度假美学，私密性极强。',
    },
    amenities: [
      { icon: '🏊', label: { en: 'Infinity Pool', zh: '无边际泳池' } },
      { icon: '🌿', label: { en: 'Garden & Nature Views', zh: '花园绿植环绕' } },
      { icon: '🍳', label: { en: 'Full Open Kitchen', zh: '全套开放厨房' } },
      { icon: '📶', label: { en: 'High-Speed WiFi', zh: '高速WiFi' } },
      { icon: '🅿️', label: { en: 'Free Parking (Multi-car)', zh: '免费多车位停车' } },
      { icon: '🏡', label: { en: 'Entire Villa — Full Privacy', zh: '整栋独享·私密无扰' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Bangkok via Ratchadaphisek Rd / Route 305 — ~1.5–2h' }, { mode: '✈️', text: 'Suvarnabhumi Airport — ~1.5h drive' }, { mode: '🚌', text: 'Bus from Bangkok Northern Terminal to Nakhon Nayok — ~2h' }],
      zh: [{ mode: '🚗', text: '曼谷沿拉差达披塞路/305号公路 — 约1.5-2小时' }, { mode: '✈️', text: '素万那普机场 — 车程约1.5小时' }, { mode: '🚌', text: '曼谷北部巴士站至那空那育府 — 约2小时' }],
    },
    nearby: {
      en: [{ name: 'Khao Yai National Park', distance: '~50 km' }, { name: 'Haew Suwat Waterfall', distance: '~60 km' }, { name: 'Nakhon Nayok City', distance: '~15 km' }],
      zh: [{ name: '考艾国家公园', distance: '约50公里' }, { name: '豪苏瓦特瀑布', distance: '约60公里' }, { name: '那空那育府城区', distance: '约15公里' }],
    },
    images: ['/images/projects/thailand-nx-space/exterior-01.jpg', '/images/projects/thailand-nx-space/exterior-02.jpg', '/images/projects/thailand-nx-space/exterior-03.jpg', '/images/projects/thailand-nx-space/exterior-04.jpg', '/images/projects/thailand-nx-space/interior-01.jpg', '/images/projects/thailand-nx-space/interior-02.jpg'],
  },

  // ═══ 国内项目 (30) ═══

  // ─── 江苏 · 常州太湖湾露营谷 ───
  {
    id: 'changzhou-taihu',
    name: { en: 'Taihu Bay Camping Valley', zh: '常州太湖湾露营谷' },
    location: { en: 'Taihu Bay National Tourism Resort, Liyang, Changzhou, Jiangsu, China', zh: '中国江苏·常州·太湖湾国家旅游度假区' },
    coordinates: [119.4814, 31.3655],
    country: '🇨🇳',
    openDate: '2019.03',
    units: 127,
    unitArea: null,
    guests: '2-9',
    bookingUrl: '',
    description: {
      en: 'One of China\'s first National 5C Self-Drive Camping Resorts — 700 acres on the shores of Taihu Bay, Changzhou, opened March 2019. 127 accommodation units including VESSEL space capsules, mushroom houses, star-gazing rooms, twin RV courtyards and lakeside tree-villa suites. Upgraded in Jan 2026 with new themed suites.',
      zh: '首批国家5C自驾车旅居车营地，2019年3月开园，占地近700亩，位于常州太湖湾国家旅游度假区。127个宿营单元含VESSEL太空舱、蘑菇屋、星空房、双拼房车院落、湖畔树屋别墅等，2026年1月新增松果亲子套房与主题房。',
    },
    amenities: [
      { icon: '🛸', label: { en: 'VESSEL Space Capsules', zh: 'VESSEL太空舱' } },
      { icon: '🎢', label: { en: 'Forest Karting (800 m)', zh: '森林卡丁车赛道800m' } },
      { icon: '🚂', label: { en: '1500 m Loop Train', zh: '1500米环线小火车' } },
      { icon: '🐌', label: { en: 'Snail Farm & Pets', zh: '蜗牛农场萌宠' } },
      { icon: '🎡', label: { en: 'Amusement Park Adjacent', zh: '正对环球动漫嬉戏谷' } },
      { icon: '🐕', label: { en: 'Pet Friendly', zh: '宠物友好' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Changzhou city — ~1h drive' }, { mode: '🚗', text: 'From Shanghai / Nanjing — ~2.5h drive' }, { mode: '🚂', text: 'Changzhou North Station — then taxi ~40 min' }],
      zh: [{ mode: '🚗', text: '常州市区 — 约1小时车程' }, { mode: '🚗', text: '上海/南京自驾 — 约2.5小时' }, { mode: '🚂', text: '常州北站 — 转出租车约40分钟' }],
    },
    nearby: {
      en: [{ name: 'Huanqiu Anime Park', distance: 'Adjacent' }, { name: 'Xixihai Water Park', distance: 'Adjacent' }, { name: 'Taihu Bay Forest Trails (13 km)', distance: 'On-site' }],
      zh: [{ name: '环球动漫嬉戏谷', distance: '正对面' }, { name: '嬉戏海上水乐园', distance: '紧邻' }, { name: '太湖湾13公里森林步道', distance: '园区内' }],
    },
    images: ['/images/projects/changzhou-taihu/image-01.png', '/images/projects/changzhou-taihu/image-02.png', '/images/projects/changzhou-taihu/image-03.jpg', '/images/projects/changzhou-taihu/image-04.jpg', '/images/projects/changzhou-taihu/image-05.jpg', '/images/projects/changzhou-taihu/image-06.jpg'],
  },

  // ─── 甘肃 · 敦煌雅丹国家地质公园星辰驿站 ───
  {
    id: 'dunhuang-yardang',
    name: { en: 'Yardang Geopark Star Station', zh: '敦煌雅丹国家地质公园星辰驿站' },
    location: { en: 'Yardang National Geological Park, Dunhuang, Gansu, China', zh: '中国甘肃·敦煌市·雅丹国家地质公园核心区' },
    coordinates: [92.9166, 40.5097],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: 'TBD',
    bookingUrl: '',
    description: {
      en: 'The only accommodation station inside Dunhuang Yardang National Geological Park — a stargazing-themed glamping outpost deep in the Gobi Desert. Panoramic skylight capsules and scenic rooms overlook the dramatic "Devil City" yardang landforms. Skip the daytime crowds and experience Gobi sunsets, silver Milky Way, and desert dawns from your bed.',
      zh: '敦煌雅丹国家地质公园核心区内唯一住宿接待站，西北戈壁极具特色的星空主题野奢驿站。全景天窗太空舱与观景客房直面壮阔雅丹地貌，避开日间人流，独享戈壁日落、银河星空与沙漠日出的沉浸式体验。',
    },
    amenities: [
      { icon: '🌌', label: { en: 'Dark Sky Stargazing', zh: '暗夜银河观星' } },
      { icon: '🪟', label: { en: 'Panoramic Skylight', zh: '全景观景天窗' } },
      { icon: '🏜', label: { en: 'Inside Yardang Geopark', zh: '公园核心区内' } },
      { icon: '🍽', label: { en: 'Dining & Rest Area', zh: '餐饮休息大厅' } },
      { icon: '📷', label: { en: 'Sunrise / Sunset Views', zh: '日出日落观赏' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Dunhuang city — ~80 km / 1h drive' }, { mode: '✈️', text: 'Dunhuang Airport — ~90 km / 1.5h drive' }, { mode: '🚌', text: 'Tour bus from Dunhuang — available at main scenic area' }],
      zh: [{ mode: '🚗', text: '敦煌市区 — 约80公里/1小时' }, { mode: '✈️', text: '敦煌机场 — 约90公里/1.5小时' }, { mode: '🚌', text: '敦煌景区旅游大巴可达' }],
    },
    nearby: {
      en: [{ name: 'Yardang "Devil City" Formations', distance: 'On-site' }, { name: 'Yumen Pass (Jade Gate)', distance: '~30 km' }, { name: 'Han Dynasty Great Wall', distance: '~40 km' }, { name: 'Mogao Caves', distance: '~110 km' }],
      zh: [{ name: '雅丹"魔鬼城"地貌', distance: '园区内' }, { name: '玉门关', distance: '约30公里' }, { name: '汉长城遗址', distance: '约40公里' }, { name: '莫高窟', distance: '约110公里' }],
    },
    images: ['/images/projects/dunhuang-yardang/image-01.jpg', '/images/projects/dunhuang-yardang/image-02.jpg', '/images/projects/dunhuang-yardang/image-03.jpg'],
  },

  // ─── 内蒙古 · 乌海漠海山境露营地 ───
  {
    id: 'wuhai-desert',
    name: { en: 'Wuhai Desert Mohai Shanjing Camp', zh: '乌海漠海山境露营地' },
    location: { en: 'Wuda District, Wuhai City, Inner Mongolia, China', zh: '中国内蒙古·乌海市乌达区·现代生态园' },
    coordinates: [106.7, 39.5],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 11,
    unitArea: 25,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: "VESSEL's first desert-oasis glamping site in Inner Mongolia — 11 independent S5/V5 space capsules set on a 21,000 m² plot at the edge of the Gobi. Each unit features a 270° panoramic glass wall, star-gazing skylight, one-touch privacy glass, smart climate control and aerospace-grade acoustic insulation for silent nights under the desert sky.",
      zh: '建于内蒙古乌海市乌达区现代生态园内，占地 2.1 万㎡，是 VESSEL 打造的内蒙古首座沙漠绿洲太空舱营地。11 台独立 S5/V5 太空舱，单台面积 24-27㎡，配 270° 全景落地窗 + 星空天窗、一键雾化玻璃、全屋智能、航天级隔音，在大漠星空下享受静谧睡眠。',
    },
    amenities: [
      { icon: '🪟', label: { en: '270° Panoramic Glass', zh: '270° 全景落地窗' } },
      { icon: '✨', label: { en: 'Stargazing Skylight', zh: '星空天窗' } },
      { icon: '🔒', label: { en: 'Smart Privacy Glass', zh: '一键雾化玻璃' } },
      { icon: '🛏', label: { en: 'Zero-Pressure Mattress', zh: '零压床垫' } },
      { icon: '🔥', label: { en: 'Bonfire & Desert BBQ', zh: '篝火星空 BBQ' } },
      { icon: '🏕', label: { en: 'Family Play Park', zh: '无动力亲子乐园' } },
    ],
    transport: {
      en: [
        { mode: '✈️', text: 'Wuhai Airport — ~33 km drive' },
        { mode: '🚗', text: 'Wuhai city center — ~20 min drive' },
        { mode: '🚂', text: 'Wuhai West Railway Station — ~25 min drive' },
      ],
      zh: [
        { mode: '✈️', text: '乌海机场 — 约 33 公里车程' },
        { mode: '🚗', text: '乌海市区 — 自驾约 20 分钟' },
        { mode: '🚂', text: '乌海西站 — 车程约 25 分钟' },
      ],
    },
    nearby: {
      en: [
        { name: 'Ulan Buh Desert Edge', distance: 'On-site' },
        { name: 'Yellow River Gorge', distance: '~30 km' },
        { name: 'Wuda Modern Eco-Park', distance: 'Within park' },
        { name: 'Wuhai Lake (Wuhai Hu)', distance: '~25 km' },
      ],
      zh: [
        { name: '乌兰布和沙漠边缘', distance: '营地内' },
        { name: '黄河峡谷', distance: '约 30 公里' },
        { name: '乌达区现代生态园', distance: '园内' },
        { name: '乌海湖', distance: '约 25 公里' },
      ],
    },
    images: [
      '/images/projects/wuhai-desert/image-01-web.jpg',
      '/images/projects/wuhai-desert/image-02-web.jpg',
      '/images/projects/wuhai-desert/image-03-web.jpg',
      '/images/projects/wuhai-desert/image-04-web.jpg',
      '/images/projects/wuhai-desert/image-05-web.jpg',
    ],
  },
]
