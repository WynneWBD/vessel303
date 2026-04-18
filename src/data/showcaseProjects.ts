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
    coordinates: [119.828, 31.365],
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

  // ─── 福建 · 东山彩蝶湾景区特色民宿（环岛路分店）───
  {
    id: 'fujian-dongshan',
    name: { en: 'Caidie Bay Seaside B&B — Huandao Road', zh: '东山彩蝶湾景区特色民宿（环岛路分店）' },
    location: { en: 'Aojiao Village, Chengcheng Town, Dongshan County, Fujian, China', zh: '中国福建·东山县陈城镇澳角村·彩蝶湾景区环岛路' },
    coordinates: [117.5075, 23.7062],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A coastal boutique guesthouse on Dongshan Island\'s scenic ring road — steps from Caidie Bay\'s pristine beach. Space capsules, sea-view courtyards and loft suites all feature panoramic sea views, smart amenities and independent bathrooms. Sunrise over the reefs, tide-pool exploring, ring-island cycling and local seafood await.',
      zh: '坐落于福建东山县环岛景观带，紧邻彩蝶湾景区，步行即达沙滩。太空舱、海景小院及Loft跃层等房型均配全景海景视野与智能配套，推窗见礁石碧海。可赶海、拾贝壳、环岛骑行，享受东山岛沉浸式滨海度假体验。',
    },
    amenities: [
      { icon: '🌊', label: { en: 'Beachfront Location', zh: '步行达沙滩' } },
      { icon: '🛸', label: { en: 'Space Capsule Rooms', zh: '太空舱房型' } },
      { icon: '☀️', label: { en: 'Sea-View Terrace', zh: '海景观景露台' } },
      { icon: '☕', label: { en: 'Seaside Coffee Bar', zh: '滨海咖啡吧' } },
      { icon: '🅿️', label: { en: 'Free Parking', zh: '免费停车场' } },
      { icon: '🦀', label: { en: 'Seafood Processing', zh: '海鲜加工服务' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Yunxiao Zhangzhou Airport — ~60 km, then taxi' }, { mode: '🚗', text: 'From Zhangzhou via G15 — ~2h drive' }, { mode: '🚂', text: 'Yunxiao High-Speed Station — ~45 min drive, shuttle available' }],
      zh: [{ mode: '✈️', text: '漳州云霄机场 — 约60公里转出租' }, { mode: '🚗', text: '漳州沿G15高速 — 约2小时' }, { mode: '🚂', text: '云霄高铁站 — 约45分钟，可预约接送' }],
    },
    nearby: {
      en: [{ name: 'Caidie Bay Beach', distance: 'Steps away' }, { name: 'Jinluan Bay "Mirror Beach"', distance: '~15 min drive' }, { name: 'Wind Rock (Fengdong Shi)', distance: '~20 min drive' }],
      zh: [{ name: '彩蝶湾沙滩', distance: '步行即达' }, { name: '金銮湾"镜面沙滩"', distance: '约15分钟' }, { name: '风动石景区', distance: '约20分钟' }],
    },
    images: ['/images/projects/fujian-dongshan/image-01.jpg', '/images/projects/fujian-dongshan/image-02.jpg', '/images/projects/fujian-dongshan/image-03.jpg', '/images/projects/fujian-dongshan/image-04.jpg'],
  },

  // ─── 甘肃 · 白银龙山民宿 ───
  {
    id: 'gansu-baiyin',
    name: { en: 'Longshan Cliff Capsule Inn — Yellow River Cloud Town', zh: '甘肃白银龙山民宿·黄河云客小镇' },
    location: { en: 'Shuichuan Town, Baiyin District, Baiyin City, Gansu, China', zh: '中国甘肃·白银市白银区水川镇蒋家湾五柳村' },
    coordinates: [104.1369, 36.544],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'VESSEL E5 & E7 space capsules perched along a loess cliff above the Yellow River\'s Wujin Gorge — part of the "Yellow River · Baiyin Cloud Town" rural revitalization project. Push the window open to an unobstructed panorama of the Yellow River and ancient Great Wall ruins. Sunsets over the Huang He and Milky Way nights make this a photographer\'s paradise.',
      zh: '依托黄河乌金峡北岸崖壁与古长城遗址打造，VESSEL E5/E7 太空舱沿黄土崖壁错落排布，是"黄河·白银云客小镇"乡村振兴文旅项目核心。推窗即可无遮挡俯瞰黄河壮阔河景，远眺古长城遗址，实现"卧看长河落日、夜揽星河入梦"的沉浸式体验。',
    },
    amenities: [
      { icon: '🌊', label: { en: 'Yellow River Cliff View', zh: '黄河悬崖观景' } },
      { icon: '🏯', label: { en: 'Great Wall Ruins Nearby', zh: '古长城遗址毗邻' } },
      { icon: '🛸', label: { en: 'VESSEL E5/E7 Capsules', zh: 'VESSEL E5/E7 太空舱' } },
      { icon: '🌌', label: { en: 'Milky Way Stargazing', zh: '银河观星' } },
      { icon: '📷', label: { en: 'Sunset Photography', zh: '日落摄影打卡' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Baiyin city center — ~30 min drive' }, { mode: '✈️', text: 'Lanzhou Zhongchuan Airport — ~90 min drive' }, { mode: '🚗', text: 'From Lanzhou via G6 — ~1.5h drive' }],
      zh: [{ mode: '🚗', text: '白银市区 — 约30分钟车程' }, { mode: '✈️', text: '兰州中川机场 — 约90分钟车程' }, { mode: '🚗', text: '兰州沿G6高速 — 约1.5小时' }],
    },
    nearby: {
      en: [{ name: 'Yellow River Wujin Gorge', distance: 'On cliff' }, { name: 'Han Dynasty Great Wall Ruins', distance: 'Adjacent' }, { name: 'Shuichuan Wetland Park', distance: '~5 km' }],
      zh: [{ name: '黄河乌金峡', distance: '崖壁之上' }, { name: '汉长城遗址', distance: '紧邻' }, { name: '水川国家湿地公园', distance: '约5公里' }],
    },
    images: ['/images/projects/gansu-baiyin/image-01.jpg', '/images/projects/gansu-baiyin/image-02.jpg', '/images/projects/gansu-baiyin/image-03.jpg', '/images/projects/gansu-baiyin/image-04.jpg'],
  },

  // ─── 甘肃 · 和政星语云端 ───
  {
    id: 'gansu-hezheng',
    name: { en: 'Xingyu Yunduan Alpine Eco Resort', zh: '甘肃和政星语云端' },
    location: { en: 'Dahualiáng, Songling Town, Hezheng County, Linxia, Gansu, China', zh: '中国甘肃·临夏州和政县松鸣镇大桦梁·太子山脚下' },
    coordinates: [103.3513, 35.439],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 30,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A high-altitude eco retreat at 2,400 m on the slopes of Taizishan, Hezheng County — 10 VESSEL smart space capsules, 10 forest wooden cabins and 10 sci-fi themed suites (ring panoramic windows). Zero light pollution for naked-eye Milky Way; cloud sea and mountain views at dawn. Activities include paragliding, hot-air ballooning and family farm picking.',
      zh: '坐落于甘肃和政县太子山脚下松鸣镇大桦梁，海拔约2400米，占地200公顷。10间微宿太空舱、10间野奢木屋与10间星月居科幻主题民宿依山错落。零光污染环境下可裸眼观银河，清晨云海翻涌，配套动力伞、热气球与亲子农场体验。',
    },
    amenities: [
      { icon: '🌌', label: { en: 'Zero-Pollution Dark Sky', zh: '零光污染暗夜星空' } },
      { icon: '☁️', label: { en: 'Cloud Sea at Dawn', zh: '清晨云海观赏' } },
      { icon: '🪟', label: { en: 'Ring Panoramic Windows', zh: '环绕式全景落地窗' } },
      { icon: '🪂', label: { en: 'Paragliding & Hot Air Balloon', zh: '动力伞/热气球' } },
      { icon: '🏊', label: { en: 'Infinity Pool', zh: '无边泳池' } },
      { icon: '🍽', label: { en: 'Hezhou Cuisine Restaurant', zh: '地道河州风味餐厅' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Linxia city — ~40 min drive' }, { mode: '🚗', text: 'From Lanzhou via G75 — ~2.5h drive' }, { mode: '✈️', text: 'Lanzhou Zhongchuan Airport — ~3h drive' }],
      zh: [{ mode: '🚗', text: '临夏市区 — 约40分钟车程' }, { mode: '🚗', text: '兰州沿G75高速 — 约2.5小时' }, { mode: '✈️', text: '兰州中川机场 — 约3小时车程' }],
    },
    nearby: {
      en: [{ name: 'Songming Rock Scenic Area', distance: '~5 km' }, { name: 'Songming Rock Int\'l Ski Resort', distance: '~8 km' }, { name: 'Taizishan National Nature Reserve', distance: 'Adjacent' }],
      zh: [{ name: '松鸣岩国家级风景区', distance: '约5公里' }, { name: '松鸣岩国际滑雪场', distance: '约8公里' }, { name: '太子山国家级自然保护区', distance: '紧邻' }],
    },
    images: ['/images/projects/gansu-hezheng/image-01.jpg', '/images/projects/gansu-hezheng/image-02.jpg', '/images/projects/gansu-hezheng/image-03.jpg', '/images/projects/gansu-hezheng/image-04.jpg', '/images/projects/gansu-hezheng/image-05.jpg'],
  },

  // ─── 广东 · 佛山云东海蒹葭苍苍露营地 ───
  {
    id: 'guangdong-foshan',
    name: { en: 'Jianjiá Cangcang Wetland Glamping — Yundonghai', zh: '佛山云东海蒹葭苍苍露营地' },
    location: { en: 'Moon Park North, Yundonghai Avenue, Sanshui District, Foshan, Guangdong, China', zh: '中国广东·佛山三水区·云东海大道月亮公园北侧' },
    coordinates: [112.894, 23.123],
    country: '🇨🇳',
    openDate: '2023',
    units: 12,
    unitArea: 35,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A VESSEL-built wetland glamping resort adjacent to Yundonghai National Wetland Park, Foshan — 12 independent space capsules (V5/V7/V9, 27–38 m²) each with a private courtyard, plus 6 glamping tents. Push the window open to reeds swaying in the lake breeze. Weekends feature molten iron flower shows and fireworks.',
      zh: '佛山三水区云东海国家湿地公园旁，VESSEL 微宿打造的湿地湖景野奢太空舱露营地，2023年开业。12间独立太空舱（V5/V7/V9，27-38㎡）配专属小院，6顶帐篷，推窗见芦苇荡漾湖光，周末有打铁花表演与烟花秀。',
    },
    amenities: [
      { icon: '🌾', label: { en: 'Wetland Reed Lake Views', zh: '芦苇湖景' } },
      { icon: '🛶', label: { en: 'Kayak & Dock', zh: '皮划艇码头' } },
      { icon: '🎣', label: { en: 'Free Fishing (Keep Your Catch)', zh: '免费钓鱼可带走' } },
      { icon: '🎆', label: { en: 'Weekend Fireworks Show', zh: '周末打铁花/烟花' } },
      { icon: '🎤', label: { en: 'KTV & Recreation', zh: 'KTV与棋牌' } },
      { icon: '🌌', label: { en: 'Star-Gazing Skylight', zh: '星空天窗' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Guangzhou / Foshan via Guanghe Expressway — ~1h' }, { mode: '🚉', text: 'Yundonghai Station — ~12 min taxi' }, { mode: '🚇', text: 'Guangfo Metro to Sanshui — then taxi' }],
      zh: [{ mode: '🚗', text: '广佛市区沿广贺高速 — 约1小时' }, { mode: '🚉', text: '云东海站 — 打车约12分钟' }, { mode: '🚇', text: '广佛地铁至三水 — 转出租车' }],
    },
    nearby: {
      en: [{ name: 'Yundonghai National Wetland Park', distance: 'Adjacent' }, { name: 'Moon Park Sanshui', distance: 'On-site' }, { name: 'Sanshui City Center', distance: '~15 km' }],
      zh: [{ name: '云东海国家湿地公园', distance: '紧邻' }, { name: '三水月亮公园', distance: '园区内' }, { name: '三水城区', distance: '约15公里' }],
    },
    images: ['/images/projects/guangdong-foshan/image-01.png', '/images/projects/guangdong-foshan/image-02.jpg', '/images/projects/guangdong-foshan/image-03.png', '/images/projects/guangdong-foshan/image-04.jpg'],
  },

  // ─── 广东 · 河源万绿湖心乐青谷 ───
  {
    id: 'guangdong-heyuan',
    name: { en: 'Wanlv Lake Lèqīng Valley Glamping', zh: '广东河源万绿湖心乐青谷' },
    location: { en: 'Wanlv Lake Scenic Area, Dongyuan County, Heyuan, Guangdong, China', zh: '中国广东·河源市东源县·万绿湖风景区·私密半岛' },
    coordinates: [114.7443, 23.9875],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 16,
    unitArea: 31,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'VESSEL-built glamping resort on a private peninsula in Wanlv Lake scenic area, Heyuan — 16 independent V5/V7 capsules (27–35 m²), surrounded on three sides by China\'s largest reservoir-lake with Class I drinking-water quality. Panoramic lake views, SUP/kayak, fishing pier and lakeside lawns create the ultimate Pearl River Delta lakeside escape.',
      zh: '位于广东河源万绿湖风景区私密半岛，三面环湖、一面靠山，坐拥国家I类直饮水质。VESSEL 微宿打造的16间独立V5/V7太空舱（27-35㎡），配独立庭院，全景湖景、桨板皮划艇、垂钓区与湖畔大草坪，是大湾区高品质湖景度假优选。',
    },
    amenities: [
      { icon: '🏞', label: { en: 'Private Peninsula 3-Side Lake', zh: '三面环湖私密半岛' } },
      { icon: '🏄', label: { en: 'SUP & Kayak', zh: '桨板与皮划艇' } },
      { icon: '🎣', label: { en: 'Fishing Pier', zh: '湖畔垂钓区' } },
      { icon: '🌌', label: { en: 'Star-Gazing Skylight', zh: '星空天窗' } },
      { icon: '🎤', label: { en: 'KTV', zh: 'KTV包厢' } },
      { icon: '🍽', label: { en: 'Farm-to-Table Dining', zh: '本地农家菜' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Guangzhou / Shenzhen via G25 — ~1.5–2h drive' }, { mode: '✈️', text: 'Shenzhen Airport — ~2h drive' }, { mode: '🚂', text: 'Heyuan Station — then taxi ~40 min' }],
      zh: [{ mode: '🚗', text: '广深沿G25高速 — 约1.5-2小时' }, { mode: '✈️', text: '深圳机场 — 约2小时' }, { mode: '🚂', text: '河源站 — 转出租约40分钟' }],
    },
    nearby: {
      en: [{ name: 'Wanlv Lake (National Scenic Area)', distance: 'On-site' }, { name: 'New Fengmen Island', distance: '~10 km (boat)' }, { name: 'Heyuan City Center', distance: '~40 km' }],
      zh: [{ name: '万绿湖国家级风景区', distance: '园区内' }, { name: '新丰门岛', distance: '约10公里（船）' }, { name: '河源市区', distance: '约40公里' }],
    },
    images: ['/images/projects/guangdong-heyuan/image-01.jpg', '/images/projects/guangdong-heyuan/image-02.jpg', '/images/projects/guangdong-heyuan/image-03.jpg', '/images/projects/guangdong-heyuan/image-04.jpg', '/images/projects/guangdong-heyuan/image-05.jpg', '/images/projects/guangdong-heyuan/image-06.jpg', '/images/projects/guangdong-heyuan/image-07.jpg', '/images/projects/guangdong-heyuan/image-08.png'],
  },

  // ─── 广东 · 惠州巽寮湾假日星球 ───
  {
    id: 'guangdong-huizhou',
    name: { en: 'HelloSpace Holiday Planet — Xunliao Bay', zh: '惠州巽寮湾假日星球' },
    location: { en: 'Qingxun Mountain, Huidong County, Huizhou, Guangdong, China', zh: '中国广东·惠州市惠东县·青巽山景区内·巽寮湾滨海旅游带' },
    coordinates: [114.836, 22.792],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: 33,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'VESSEL HelloSpace Holiday Planet — a luxury glamping resort on Qingxun Mountain within the Xunliao Bay coastal tourism corridor, Huizhou. Independent S5/E7/O5/V7 capsule villas (27–38 m²) surround a private lake and hillside, some featuring stargazing skylights and private hot tubs. SUP, paddleboard and glass boat activities complement the pristine near-ocean setting.',
      zh: '位于惠州惠东县青巽山景区，毗邻巽寮湾滨海旅游带，VESSEL 微宿打造的高端野奢太空舱度假营地。多栋独立S5/E7/O5/V7太空舱（27-38㎡），依山环湖而建，部分带星空天窗与私人泡池，可体验桨板、皮划艇和玻璃船等水上项目。',
    },
    amenities: [
      { icon: '🏝', label: { en: 'Hill & Lake Setting', zh: '依山环湖' } },
      { icon: '🛸', label: { en: 'VESSEL S5/E7/O5/V7', zh: 'VESSEL 多型号太空舱' } },
      { icon: '♨️', label: { en: 'Private Hot Tub (Select)', zh: '私人泡池（部分房型）' } },
      { icon: '🚣', label: { en: 'Glass Boat & Waterboard', zh: '玻璃船与桨板' } },
      { icon: '🌌', label: { en: 'Star-Gazing Skylight', zh: '星空天窗' } },
      { icon: '🏕', label: { en: 'Lawn & Observation Deck', zh: '大草坪与观景台' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Shenzhen / Guangzhou via G15 — ~2.5h drive' }, { mode: '✈️', text: 'Shenzhen Airport — ~2h drive' }, { mode: '🚂', text: 'Huizhou South Station — ~1h taxi/shuttle' }],
      zh: [{ mode: '🚗', text: '深圳/广州沿G15高速 — 约2.5小时' }, { mode: '✈️', text: '深圳机场 — 约2小时' }, { mode: '🚂', text: '惠州南站 — 约1小时接送' }],
    },
    nearby: {
      en: [{ name: 'Xunliao Bay Beach', distance: '~5 km' }, { name: 'Qingxun Mountain Forest Park', distance: 'On-site' }, { name: 'Shuangyuewan National Park', distance: '~30 km' }],
      zh: [{ name: '巽寮湾海滩', distance: '约5公里' }, { name: '青巽山森林公园', distance: '园区内' }, { name: '双月湾国家公园', distance: '约30公里' }],
    },
    images: ['/images/projects/guangdong-huizhou/image-01.jpg', '/images/projects/guangdong-huizhou/image-02.jpg', '/images/projects/guangdong-huizhou/image-03.jpg', '/images/projects/guangdong-huizhou/image-04.jpg', '/images/projects/guangdong-huizhou/image-05.jpg', '/images/projects/guangdong-huizhou/image-06.jpg', '/images/projects/guangdong-huizhou/image-07.jpg', '/images/projects/guangdong-huizhou/image-08.jpg'],
  },

  // ─── 广东 · 肇庆六角泉森林康养基地 ───
  {
    id: 'guangdong-zhaoqing',
    name: { en: 'Liujiaoquan Forest Health Resort', zh: '广东肇庆六角泉森林康养基地' },
    location: { en: 'Fengkai County, Zhaoqing, Guangdong, China', zh: '中国广东·肇庆市封开县江口街道扶来村' },
    coordinates: [111.4858, 23.4361],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 4,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'Guangdong\'s first Forest Health Base pilot — 98 hectares of 90%+ forest cover in Fengkai County, Zhaoqing, transformed from a state forest farm. VESSEL O5 and E7 space capsules with panoramic skylights are nestled among the trees: mountain cloud-sea by day, Milky Way by night. Complemented by herbal-medicine valley trails, mountain spring pools and children\'s nature education.',
      zh: '广东省首批森林康养基地试点，位于肇庆封开县，总面积98.08公顷，森林覆盖率超90%。VESSEL O5/E7 太空舱嵌入林间，配全景天窗，白天坐拥山林云海，夜晚卧赏银河。设南药溪谷、山泉泳池、五感步道、儿童欢乐谷等游玩业态。',
    },
    amenities: [
      { icon: '🌲', label: { en: '90%+ Forest Cover', zh: '90%以上森林覆盖' } },
      { icon: '🌌', label: { en: 'Panoramic Skylight', zh: '全景天窗' } },
      { icon: '🏊', label: { en: 'Mountain Spring Pool', zh: '山泉泳池' } },
      { icon: '🌿', label: { en: 'Herbal Medicine Valley', zh: '南药溪谷' } },
      { icon: '🧒', label: { en: 'Nature Education Base', zh: '自然教育基地' } },
      { icon: '🏍', label: { en: 'ATV Off-Road', zh: '四轮摩托越野' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Guangzhou via G321 — ~3h drive' }, { mode: '🚗', text: 'From Zhaoqing city — ~1.5h drive' }, { mode: '✈️', text: 'Guangzhou Baiyun Airport — ~3h drive' }],
      zh: [{ mode: '🚗', text: '广州沿G321国道 — 约3小时' }, { mode: '🚗', text: '肇庆市区 — 约1.5小时' }, { mode: '✈️', text: '广州白云机场 — 约3小时' }],
    },
    nearby: {
      en: [{ name: 'Hejiang Blueway Scenic Corridor', distance: 'Adjacent' }, { name: 'Fengkai Water Sports Center', distance: '~15 km' }, { name: 'Liangguang Headwaters Museum', distance: '~20 km' }],
      zh: [{ name: '贺江碧道画廊', distance: '紧邻' }, { name: '封开水上运动中心', distance: '约15公里' }, { name: '两广源流博物馆', distance: '约20公里' }],
    },
    images: ['/images/projects/guangdong-zhaoqing/image-01.jpg', '/images/projects/guangdong-zhaoqing/image-02.jpg', '/images/projects/guangdong-zhaoqing/image-03.jpg', '/images/projects/guangdong-zhaoqing/image-04.jpg'],
  },

  // ─── 广东 · 珠海临海·星空海景美宿（飞沙滩店）───
  {
    id: 'guangdong-zhuhai',
    name: { en: 'Linhai Starry Sea-View Inn — Feisha Beach', zh: '珠海临海·星空海景美宿（飞沙滩店）' },
    location: { en: 'Feisha Village, Nanshui Town, Jinwan District, Zhuhai, Guangdong, China', zh: '中国广东·珠海市金湾区南水镇飞沙村' },
    coordinates: [113.308, 21.958],
    country: '🇨🇳',
    openDate: '2022',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A VESSEL-partnered immersive coastal resort at Feisha Beach, Zhuhai — stargazing sea-view space capsules steps from the sand. Panoramic floor-to-ceiling glass, private courtyards, and smart amenities let you fall asleep to ocean waves and wake to golden sunrises. Surfing lessons, tidal-flat foraging, and a sea-view restaurant serving fresh local seafood.',
      zh: '与 VESSEL 微宿品牌合作，位于珠海金湾区飞沙滩，步行即达海滩，星空海景太空舱配全景落地窗、私家庭院与智能客控。枕着海浪声入眠，推窗见碧海，白天冲浪、赶海，夜晚繁星满天，是珠海滨海度假的沉浸式体验地。',
    },
    amenities: [
      { icon: '🌊', label: { en: 'Steps to the Beach', zh: '步行即达沙滩' } },
      { icon: '🌌', label: { en: 'Stargazing Sea View', zh: '星空海景观赏' } },
      { icon: '🏄', label: { en: 'Surf Lessons', zh: '冲浪课程' } },
      { icon: '🦀', label: { en: 'Tidal-Flat Foraging', zh: '赶海拾趣' } },
      { icon: '🍽', label: { en: 'Seafood Restaurant', zh: '海景餐厅海鲜料理' } },
      { icon: '🅿️', label: { en: 'Free Parking', zh: '免费停车' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Zhuhai city / Hong Kong-Zhuhai-Macao Bridge — ~40 min' }, { mode: '✈️', text: 'Zhuhai Airport — ~20 min drive' }, { mode: '🚗', text: 'From Guangzhou via G4W2 — ~2h' }],
      zh: [{ mode: '🚗', text: '珠海市区/港珠澳大桥 — 约40分钟' }, { mode: '✈️', text: '珠海机场 — 约20分钟' }, { mode: '🚗', text: '广州沿G4W2 — 约2小时' }],
    },
    nearby: {
      en: [{ name: 'Feisha Beach Scenic Area', distance: 'Walking' }, { name: 'Shangchuan Island Wind Farm', distance: '~50 km' }, { name: 'Nagin Peninsula ("Little Santorini")', distance: '~40 km' }],
      zh: [{ name: '飞沙滩景区', distance: '步行' }, { name: '上川岛风车山', distance: '约50公里' }, { name: '那琴半岛"小圣托里尼"', distance: '约40公里' }],
    },
    images: ['/images/projects/guangdong-zhuhai/image-01.jpg', '/images/projects/guangdong-zhuhai/image-02.jpg', '/images/projects/guangdong-zhuhai/image-03.jpg'],
  },

  // ─── 广西 · 贺州鹊鸣春太空舱民宿 ───
  {
    id: 'guangxi-hezhou',
    name: { en: 'Quemingchun Tea Garden Capsule Inn', zh: '广西贺州鹊鸣春太空舱民宿' },
    location: { en: 'Organic Tea Garden, Mashen Village, Zhaoping Town, Zhaoping County, Hezhou, Guangxi, China', zh: '中国广西·贺州市昭平县昭平镇马圣村有机茶园内' },
    coordinates: [110.8127, 24.1749],
    country: '🇨🇳',
    openDate: '2024',
    units: 6,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'Six VESSEL space capsules "floating" above Zhaoping\'s organic tea hills — a tea-culture glamping fusion resort opened late 2024. Fully transparent panoramic design lets you wake to rolling tea-garden waves and mountain mist. Tea-picking tours, artisanal tea-making workshops, oil-tea hotpot, and charcoal BBQ round out an immersive Guangxi tea-country experience.',
      zh: '2024年底落成，6座 VESSEL 太空舱"悬浮"于昭平县有机茶园，全景透明设计，卧床即观茶海起伏与远山云雾。配套烧烤场、多功能会议厅，提供采茶研学、制茶工坊、油茶火锅与围炉煮茶等特色体验。',
    },
    amenities: [
      { icon: '🍵', label: { en: 'Tea Garden Panorama', zh: '茶园全景景观' } },
      { icon: '🌿', label: { en: 'Tea Picking & Making', zh: '采茶制茶体验' } },
      { icon: '🔥', label: { en: 'BBQ & Charcoal Tea', zh: '烧烤与围炉煮茶' } },
      { icon: '🏫', label: { en: 'Research & Education', zh: '研学教育活动' } },
      { icon: '📶', label: { en: 'Smart Temperature Control', zh: '智能温控系统' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Hezhou city — ~30 min drive' }, { mode: '🚗', text: 'From Guilin via G72 — ~2h drive' }, { mode: '✈️', text: 'Guilin Liangjiang Airport — ~2h drive' }],
      zh: [{ mode: '🚗', text: '贺州市区 — 约30分钟' }, { mode: '🚗', text: '桂林沿G72 — 约2小时' }, { mode: '✈️', text: '桂林两江机场 — 约2小时' }],
    },
    nearby: {
      en: [{ name: 'Huangyao Ancient Town', distance: '~40 min drive' }, { name: 'Nanshan Tea Sea', distance: '~20 km' }, { name: 'Zhaoping Guijiang River Cruise', distance: '~15 km' }],
      zh: [{ name: '黄姚古镇', distance: '约40分钟' }, { name: '南山茶海（华南最大高山茶园）', distance: '约20公里' }, { name: '昭平桂江游船', distance: '约15公里' }],
    },
    images: ['/images/projects/guangxi-hezhou/image-01.png', '/images/projects/guangxi-hezhou/image-02.png', '/images/projects/guangxi-hezhou/image-03.jpg', '/images/projects/guangxi-hezhou/image-04.png', '/images/projects/guangxi-hezhou/image-05.png', '/images/projects/guangxi-hezhou/image-06.jpg'],
  },

  // ─── 广西 · 黄姚乐耘庄园 ───
  {
    id: 'guangxi-huangyao',
    name: { en: 'Leyun Farmstead — Huangyao', zh: '广西黄姚乐耘庄园' },
    location: { en: 'Beilai Village, Huangyao Town, Zhaoping County, Hezhou, Guangxi, China', zh: '中国广西·贺州市昭平县黄姚镇北莱村' },
    coordinates: [110.9267, 24.1055],
    country: '🇨🇳',
    openDate: '2023',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A Guangdong–Guangxi rural-revitalization showcase 10 minutes from Huangyao Ancient Town (5A) — 100-acre farmstead combining organic agriculture, intangible cultural heritage, and eco-tourism. Space capsules, tatami suites and sunshine villas with smart controls and panoramic nature views. Includes a black sesame paste heritage hall, jungle mini-train, and kids\' farm.',
      zh: '距国家5A景区黄姚古镇约10分钟，粤桂合作乡村振兴重点项目。100亩庄园融合有机农业、非遗文化（黄姚豆豉古法制作）与亲子度假。太空舱、榻榻米房、阳光房均配智能客控，设丛林穿越小火车、萌宠喂养、农家大灶台等，是广西中小学研学实践教育基地。',
    },
    amenities: [
      { icon: '🏺', label: { en: 'Intangible Heritage Workshops', zh: '非遗工坊体验' } },
      { icon: '🚂', label: { en: '2000 m Jungle Train', zh: '2000米丛林小火车' } },
      { icon: '🐾', label: { en: 'Pet & Animal Farm', zh: '萌宠喂养' } },
      { icon: '🛸', label: { en: 'Space Capsule Rooms', zh: '太空舱住宿' } },
      { icon: '🍳', label: { en: 'Farm-style Restaurant', zh: '乐耘佳味馆农家菜' } },
      { icon: '🐕', label: { en: 'Pet Friendly', zh: '宠物友好' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Hezhou city — ~1h drive' }, { mode: '🚗', text: 'From Guilin via G72 — ~2.5h drive' }, { mode: '✈️', text: 'Guilin Airport — ~2.5h drive' }],
      zh: [{ mode: '🚗', text: '贺州市区 — 约1小时' }, { mode: '🚗', text: '桂林沿G72 — 约2.5小时' }, { mode: '✈️', text: '桂林机场 — 约2.5小时' }],
    },
    nearby: {
      en: [{ name: 'Huangyao Ancient Town (5A)', distance: '~10 min drive' }, { name: 'Gupo Mountain National Forest Park', distance: '~40 km' }, { name: 'Hezhou City Center', distance: '~80 km' }],
      zh: [{ name: '黄姚古镇（5A景区）', distance: '约10分钟' }, { name: '姑婆山国家森林公园', distance: '约40公里' }, { name: '贺州市区', distance: '约80公里' }],
    },
    images: ['/images/projects/guangxi-huangyao/image-01.jpg', '/images/projects/guangxi-huangyao/image-02.jpg', '/images/projects/guangxi-huangyao/image-03.jpg', '/images/projects/guangxi-huangyao/image-04.jpg'],
  },

  // ─── 贵州 · 花溪晚霞星宿营地 ───
  {
    id: 'guizhou-huaxi',
    name: { en: 'Wanxia Xingsu Star-Camp — Huaxi Gaopo', zh: '贵州花溪晚霞星宿营地' },
    location: { en: 'Gaopo Town, Huaxi District, Guiyang, Guizhou, China', zh: '中国贵州·贵阳市花溪区高坡·海拔1400米喀斯特台地' },
    coordinates: [106.748, 26.302],
    country: '🇨🇳',
    openDate: '2025.07',
    units: 24,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'Guiyang\'s first space-capsule glamping camp, perched atop a 1,400 m karst plateau in Huaxi Gaopo — opened July 2025. 24 silver capsules and 10 glamping tents arranged across the clifftop, each with 270° unobstructed views of terraced fields, wind turbines, canyons and nightly 6.5-magnitude starfields. Acoustic smart control, private bath and cloud-edge viewing platform.',
      zh: '贵阳首家太空舱野奢露营营地，2025年7月开业，坐落于花溪高坡海拔1400米喀斯特台地。24座银白色太空舱沿崖台错落，270°无界视野将梯田、风车与峡谷尽收眼底，实测星空能见度达6.5等星，是都市人逃离喧嚣的云端乌托邦。',
    },
    amenities: [
      { icon: '🌌', label: { en: '6.5-Mag Dark Sky', zh: '6.5等星暗夜天空' } },
      { icon: '🌅', label: { en: 'Sunset & Cloud Sea', zh: '晚霞云海观赏' } },
      { icon: '🪟', label: { en: '270° Cliff Panorama', zh: '270° 悬崖全景' } },
      { icon: '🎪', label: { en: 'Outdoor Lawn Concert', zh: '无界草坪音乐会' } },
      { icon: '☕', label: { en: 'Cloud-Edge Café & BBQ', zh: '云崖餐吧与烧烤区' } },
      { icon: '🔊', label: { en: 'Voice-Control Smart Room', zh: '声控智能系统' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Guiyang city center — ~1.5h drive' }, { mode: '✈️', text: 'Guiyang Longdongbao Airport — ~1.5h drive' }, { mode: '🚂', text: 'Guiyang North Station — ~1.5h drive to Gaopo' }],
      zh: [{ mode: '🚗', text: '贵阳市区 — 约1.5小时车程' }, { mode: '✈️', text: '贵阳龙洞堡机场 — 约1.5小时' }, { mode: '🚂', text: '贵阳北站 — 约1.5小时到高坡' }],
    },
    nearby: {
      en: [{ name: 'Gaopo Karst Plateau', distance: 'On-site' }, { name: 'Qingman Miao Village', distance: '~10 km' }, { name: 'Huaxi Park (4A)', distance: '~30 km' }],
      zh: [{ name: '高坡喀斯特台地', distance: '营地内' }, { name: '青曼苗寨', distance: '约10公里' }, { name: '花溪公园（4A）', distance: '约30公里' }],
    },
    images: ['/images/projects/guizhou-huaxi/image-01.png', '/images/projects/guizhou-huaxi/image-02.png', '/images/projects/guizhou-huaxi/image-03.jpg', '/images/projects/guizhou-huaxi/image-04.jpg', '/images/projects/guizhou-huaxi/image-05.jpg'],
  },

  // ─── 海南 · 琼海无所归止汐语民宿 ───
  {
    id: 'hainan-qionghai',
    name: { en: 'Wusuoguizhi Xiyu Coastal Inn', zh: '海南琼海无所归止汐语民宿' },
    location: { en: 'Paigang Village, Tanmen Town, Qionghai, Hainan, China', zh: '中国海南·琼海市潭门镇排港村·潭门湾畔' },
    coordinates: [110.5744, 19.2539],
    country: '🇨🇳',
    openDate: '2018',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'National Grade-A B&B and Hainan Gold-Star designation — opened 2018 on Tanmen Bay, steps from a private beach. Panoramic ocean-view rooms with crashing-wave soundscapes, a fishermen-village boat-bar, and a tidal-flat foraging base. Nightly seafood feasts sourced straight from the South China Sea; bonfire evenings on the beach.',
      zh: '全国甲级民宿、省级金宿，2018年开业，面朝潭门湾，步行即达专属沙滩。全景海景视野，设渔乡船屋音乐吧、潮捕赶海基地，晚餐直供南海海鲜。距潭门海鲜市场步行15分钟，距博鳌亚洲论坛会址20分钟，是琼海东线滨海度假标杆。',
    },
    amenities: [
      { icon: '🌊', label: { en: 'Private Beach Access', zh: '专属沙滩步行可达' } },
      { icon: '🦀', label: { en: 'Tidal Foraging Base', zh: '潮捕赶海基地' } },
      { icon: '🎵', label: { en: 'Boat Music Bar', zh: '船屋音乐吧' } },
      { icon: '🍲', label: { en: 'South China Sea Seafood', zh: '南海海鲜宴' } },
      { icon: '🔥', label: { en: 'Beach Bonfire BBQ', zh: '篝火海鲜烧烤' } },
      { icon: '📚', label: { en: 'Fishermen Library', zh: '渔家书屋' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Qionghai city — ~30 min drive' }, { mode: '🚗', text: 'From Sanya via G98 — ~2h drive' }, { mode: '🚂', text: 'Qionghai High-Speed Station — ~30 min taxi' }],
      zh: [{ mode: '🚗', text: '琼海市区 — 约30分钟' }, { mode: '🚗', text: '三亚沿G98 — 约2小时' }, { mode: '🚂', text: '琼海高铁站 — 约30分钟出租' }],
    },
    nearby: {
      en: [{ name: 'Tanmen Seafood Market', distance: '15 min walk' }, { name: 'Boao Asia Forum Site', distance: '~20 min drive' }, { name: 'Wanquan River Wetland', distance: '~10 km' }],
      zh: [{ name: '潭门海鲜市场', distance: '步行15分钟' }, { name: '博鳌亚洲论坛永久会址', distance: '约20分钟' }, { name: '万泉河湿地', distance: '约10公里' }],
    },
    images: ['/images/projects/hainan-qionghai/image-01.jpg', '/images/projects/hainan-qionghai/image-02.jpg', '/images/projects/hainan-qionghai/image-03.jpg', '/images/projects/hainan-qionghai/image-04.jpg'],
  },

  // ─── 河北 · 张家口五色天路帐篷营地 ───
  {
    id: 'hebei-zhangbei',
    name: { en: 'Wuse Tianlu Tent Camp — Zhangbei Grassland', zh: '河北张家口五色天路帐篷营地' },
    location: { en: 'Abutigou Village, Zhanhai Township, Zhangbei County, Zhangjiakou, Hebei, China', zh: '中国河北·张家口市张北县战海乡阿不太沟村·奥伦达部落' },
    coordinates: [115.06, 41.16],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 57,
    unitArea: 75,
    guests: '2-9',
    bookingUrl: '',
    description: {
      en: 'A luxury grassland tent camp 10 km from the Caoyuan Tianlu Scenic Road, Zhangbei — 57 premium tents (8 types including VESSEL capsules) at 1,600 m elevation on the Inner Mongolian border. Double-layer tents (90 m²) for 6–9 guests; star-gazing suites with full-panoramic skylights. UTV off-road, hang-gliding, archery, bonfires and Mongolian Andai dance on weekends.',
      zh: '奥伦达部落五色天路运动休闲特色小镇，距草原天路10公里，海拔约1600米，57顶豪奢帐篷含8种房型（包含VESSEL微宿）。双层帐篷90㎡可住6-9人，星空房含全景天窗。周末提供UTV越野、三角翼飞行、射箭、篝火晚会与蒙古安代舞，是北京周边自驾2小时到达的草原营地。',
    },
    amenities: [
      { icon: '🌌', label: { en: 'Panoramic Skylight', zh: '全景星空天窗' } },
      { icon: '🏎', label: { en: 'UTV Off-Road', zh: 'UTV越野' } },
      { icon: '🪂', label: { en: 'Hang-Gliding', zh: '三角翼飞行' } },
      { icon: '🏹', label: { en: 'Archery', zh: '射箭' } },
      { icon: '🔥', label: { en: 'Mongolian Bonfire Dance', zh: '蒙古篝火安代舞' } },
      { icon: '📚', label: { en: 'Grassland Library Café', zh: '流浪书咖' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Beijing via G6 — ~2.5h drive' }, { mode: '🚂', text: 'Zhangjiakou South Station — ~1h drive' }, { mode: '✈️', text: 'Zhangjiakou Airport — ~1h drive' }],
      zh: [{ mode: '🚗', text: '北京沿G6高速 — 约2.5小时' }, { mode: '🚂', text: '张家口南站 — 约1小时' }, { mode: '✈️', text: '张家口机场 — 约1小时' }],
    },
    nearby: {
      en: [{ name: 'Caoyuan Tianlu Scenic Road', distance: '~10 km' }, { name: 'Chongli Ski Resorts (Winter Olympics)', distance: '~50 km' }, { name: 'Flash Lake (Shandianhu)', distance: '~30 km' }],
      zh: [{ name: '草原天路', distance: '约10公里' }, { name: '崇礼冬奥滑雪场', distance: '约50公里' }, { name: '闪电湖', distance: '约30公里' }],
    },
    images: ['/images/projects/hebei-zhangbei/image-01.jpg'],
  },

  // ─── 黑龙江 · 东极岛贝壳沙滩营地 ───
  {
    id: 'heilongjiang-fuyuan',
    name: { en: 'Shell Beach Camp — China\'s Easternmost Point', zh: '黑龙江东极岛贝壳沙滩营地' },
    location: { en: 'Near Dongji Square, Fuyuan City, Heilongjiang, China', zh: '中国黑龙江·抚远市·东极广场西侧·乌苏里江畔' },
    coordinates: [134.3064, 48.3648],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: 23,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'VESSEL\'s easternmost China camp — on the banks of the Ussuri River in Fuyuan, just 800 m from China\'s Dongji (Eastern Extreme) Square. A 40,000 m² resort where you sleep in a capsule and receive the nation\'s first sunrise. 270° panoramic river-view capsules, tidal beach play zones, night-sky BBQ and fresh Heilongjiang river fish.',
      zh: 'VESSEL 打造的华夏东极网红露营地，距祖国最东端地标东极广场仅800米，乌苏里江畔4万㎡。太空舱配270°全景江景，卧床即可迎接祖国第一缕阳光。设沙滩亲水区、天幕烧烤区与美食休闲区，提供江鲜宴与篝火晚会，是中国最东端科技度假目的地。',
    },
    amenities: [
      { icon: '🌅', label: { en: 'First Sunrise in China', zh: '迎祖国第一缕阳光' } },
      { icon: '🌊', label: { en: 'Ussuri River Views', zh: '乌苏里江畔' } },
      { icon: '🪟', label: { en: '270° Panoramic Capsule', zh: '270° 全景落地窗太空舱' } },
      { icon: '🐟', label: { en: 'Heilongjiang River Fish', zh: '抚远特色江鲜' } },
      { icon: '🏖', label: { en: 'Shell Beach Waterplay', zh: '贝壳沙滩亲水区' } },
      { icon: '🔥', label: { en: 'Bonfire & BBQ', zh: '篝火天幕烧烤' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Fuyuan Dongji Airport — ~40 km / ~35 min drive' }, { mode: '🚗', text: 'From Jiamusi via G221 — ~3h drive' }, { mode: '🚗', text: 'From Harbin — ~600 km / ~6h drive' }],
      zh: [{ mode: '✈️', text: '抚远东极机场 — 约40公里/35分钟' }, { mode: '🚗', text: '佳木斯沿G221 — 约3小时' }, { mode: '🚗', text: '哈尔滨出发 — 约600公里/6小时' }],
    },
    nearby: {
      en: [{ name: 'Dongji Square (Eastern Extreme)', distance: '~800 m' }, { name: 'Heixiazi Island', distance: '~10 km (boat)' }, { name: 'Fuyuan City Center', distance: '~25 min drive' }],
      zh: [{ name: '东极广场（最东端地标）', distance: '约800米' }, { name: '黑瞎子岛', distance: '约10公里（船）' }, { name: '抚远市区', distance: '约25分钟' }],
    },
    images: ['/images/projects/heilongjiang-fuyuan/image-01.jpg', '/images/projects/heilongjiang-fuyuan/image-02.jpg', '/images/projects/heilongjiang-fuyuan/image-03.jpg', '/images/projects/heilongjiang-fuyuan/image-04.jpg', '/images/projects/heilongjiang-fuyuan/image-05.jpg', '/images/projects/heilongjiang-fuyuan/image-06.jpg'],
  },

  // ─── 湖北 · 武汉清凉寨树影行星太空舱民宿 ───
  {
    id: 'hubei-wuhan',
    name: { en: 'Planet Capsule Inn — Mulan Qingliangzhai', zh: '武汉清凉寨树影行星太空舱民宿' },
    location: { en: 'Mulan Qingliangzhai Scenic Area (4A), Huangpi District, Wuhan, Hubei, China', zh: '中国湖北·武汉市黄陂区·木兰清凉寨4A级景区·半山腰悬崖边' },
    coordinates: [114.497, 31.078],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 9,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: '9 standalone white capsules on a clifftop inside Mulan Qingliangzhai (4A), each named after one of the nine solar-system planets. 270° panoramic floor-to-ceiling windows and full-ceiling skylights frame forests, sea of flowers, lake views and starlit skies — delivered by smart voice controls, Dyson hairdryer and Marshall speakers. Drive to the summit for sunrise.',
      zh: '位于武汉木兰清凉寨4A景区半山腰悬崖边，9间独立白色太空舱以太阳系九大行星命名，270°全景落地窗+全景天窗将青山花海湖景与星空纳入室内。配语音全屋智能控制、戴森吹风机、马歇尔音响，可开车直达山顶观日出，是武汉周边独具科幻感的网红住宿。',
    },
    amenities: [
      { icon: '🌌', label: { en: 'Full Skylight Ceiling', zh: '全景天窗' } },
      { icon: '🪟', label: { en: '270° Forest Panorama', zh: '270° 森林全景' } },
      { icon: '🎙', label: { en: 'Voice Smart Control', zh: '语音全屋智能' } },
      { icon: '🔊', label: { en: 'Marshall Speaker', zh: '马歇尔音响' } },
      { icon: '🌸', label: { en: 'Sea of Flowers View', zh: '花海景观' } },
      { icon: '🌅', label: { en: 'Drive-to Summit Sunrise', zh: '开车直达山顶观日出' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Wuhan city — ~1.5h drive' }, { mode: '✈️', text: 'Wuhan Tianhe Airport — ~1.5h drive' }, { mode: '🚂', text: 'Wuhan Station — then self-drive ~1.5h' }],
      zh: [{ mode: '🚗', text: '武汉市区 — 约1.5小时' }, { mode: '✈️', text: '武汉天河机场 — 约1.5小时' }, { mode: '🚂', text: '武汉站 — 自驾约1.5小时' }],
    },
    nearby: {
      en: [{ name: 'Qingliangzhai Scenic Area (4A)', distance: 'On-site' }, { name: 'Mulan Mountain', distance: '~20 km' }, { name: 'Mulan Lake', distance: '~30 km' }],
      zh: [{ name: '清凉寨景区（4A）', distance: '营地内' }, { name: '木兰山', distance: '约20公里' }, { name: '木兰湖', distance: '约30公里' }],
    },
    images: ['/images/projects/hubei-wuhan/image-01.jpg', '/images/projects/hubei-wuhan/image-02.jpg', '/images/projects/hubei-wuhan/image-03.jpg', '/images/projects/hubei-wuhan/image-04.jpg', '/images/projects/hubei-wuhan/image-05.jpg', '/images/projects/hubei-wuhan/image-06.jpg'],
  },

  // ─── 青海 · 同宝山登山观湖特色野奢露营民宿 ───
  {
    id: 'qinghai-tongbao',
    name: { en: 'Tongbao Mountain Lake-View Glamping', zh: '青海湖同宝山登山观湖特色野奢露营民宿' },
    location: { en: 'Daying Wugu Village, Qinghai Lake Township, Haiyan County, Haibei, Qinghai, China', zh: '中国青海·海北州海晏县青海湖乡达玉五谷村·同宝山·海拔3200米' },
    coordinates: [100.6167, 37.0219],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 27,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A high-altitude glamping base at 3,200 m on the north shore of Qinghai Lake — 27 sci-fi capsule rooms (space capsules, star capsules, couple suites, family suites) with titanium alloy shells and multi-angle panoramic windows. Lie in bed watching the blue expanse of Qinghai Lake. Drive 20 minutes to reach the 4,024 m Tongbao summit for a 360° panorama. Oxygen equipment provided.',
      zh: '位于青海湖北岸海拔3200米，背靠同宝山，直面青海湖碧波。27间科幻感装配式住宿舱，钛合金铝板外壳，多角度超大景观窗，实现"躺在床上看青海湖"的卓越体验。驾车20分钟可达海拔4024米山巅360°俯瞰全景，备有氧气瓶应对高反。',
    },
    amenities: [
      { icon: '🏔', label: { en: '3200m Altitude Camp', zh: '海拔3200米营地' } },
      { icon: '🌊', label: { en: 'Qinghai Lake Panorama', zh: '青海湖全景' } },
      { icon: '🌌', label: { en: 'Zero-Pollution Night Sky', zh: '零光污染星空' } },
      { icon: '🫧', label: { en: 'Oxygen Equipment Provided', zh: '备有氧气瓶' } },
      { icon: '🥩', label: { en: 'Yak Hot Pot & Halal Food', zh: '牦牛火锅与清真餐饮' } },
      { icon: '📷', label: { en: 'Sunrise Photography', zh: '日出摄影黄金地' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Xining via G6 — ~2.5h drive' }, { mode: '✈️', text: 'Xining Caojiapu Airport — ~2.5h drive' }, { mode: '🚗', text: 'From Qinghai Lake scenic area — ~30 min drive' }],
      zh: [{ mode: '🚗', text: '西宁沿G6高速 — 约2.5小时' }, { mode: '✈️', text: '西宁曹家堡机场 — 约2.5小时' }, { mode: '🚗', text: '青海湖景区 — 约30分钟' }],
    },
    nearby: {
      en: [{ name: 'Qinghai Lake National Scenic Area', distance: 'On shore' }, { name: 'Jinsha Bay Beach', distance: '~5 km' }, { name: 'Yuanzi Atomic City (Red Heritage)', distance: '~30 km' }],
      zh: [{ name: '青海湖国家级风景区', distance: '湖畔' }, { name: '金沙湾', distance: '约5公里' }, { name: '原子城（爱国主义教育基地）', distance: '约30公里' }],
    },
    images: ['/images/projects/qinghai-tongbao/image-01.png', '/images/projects/qinghai-tongbao/image-02.jpg', '/images/projects/qinghai-tongbao/image-03.jpg', '/images/projects/qinghai-tongbao/image-04.jpg', '/images/projects/qinghai-tongbao/image-05.jpg'],
  },

  // ─── 青海 · 祁连托茂部落·生态营地 ───
  {
    id: 'qinghai-qilian',
    name: { en: 'Tuomao Tribe Eco Camp — Qilian', zh: '青海祁连托茂部落·生态营地' },
    location: { en: 'Zasha Village, Moule Town, Qilian County, Haibei, Qinghai, China', zh: '中国青海·海北州祁连县默勒镇扎沙村·天境圣湖景区·海拔3120米' },
    coordinates: [100.2428, 38.1775],
    country: '🇨🇳',
    openDate: '2022',
    units: 3,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'National 4C self-drive camping base at 3,120 m in Qilian County — VESSEL\'s benchmark alpine grassland glamping project. 3 VESSEL star-river capsules (270° lake panoramic windows, private terrace) plus 7 view rooms, 3 wooden cabins and 30+ RV spots. Watch Toumao Lake shimmer and Gangshika Snow Mountain silhouetted at dawn from your bed.',
      zh: '国家4C级自驾车旅居车营地，VESSEL 微宿打造的祁连山草原野奢标杆营地，2022年投放运营，海拔3120米，占地1041亩，总投资4500万元。3间VESSEL星河揽月太空舱配270°环湖落地窗+全景天窗、专属湖景露台，卧床可观托茂湖与岗什卡雪山剪影。',
    },
    amenities: [
      { icon: '🏔', label: { en: '3120m Altitude', zh: '海拔3120米' } },
      { icon: '🌊', label: { en: 'Lake & Snow Mountain Views', zh: '托茂湖与雪山景观' } },
      { icon: '🌌', label: { en: 'Star-River Skylight', zh: '星河揽月全景天窗' } },
      { icon: '🐎', label: { en: 'Horse Riding on Grassland', zh: '草原骑行' } },
      { icon: '🔥', label: { en: 'Bonfire & Tibetan BBQ', zh: '篝火与藏式烧烤' } },
      { icon: '🎪', label: { en: 'Intangible Heritage Workshop', zh: '非遗手工坊体验' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Xining via G6 / G215 — ~2.5h drive' }, { mode: '🚗', text: 'From Qilian County town — ~30 min drive' }, { mode: '✈️', text: 'Xining Airport — ~2.5h drive' }],
      zh: [{ mode: '🚗', text: '西宁沿G6/G215 — 约2.5小时' }, { mode: '🚗', text: '祁连县城 — 约30分钟' }, { mode: '✈️', text: '西宁机场 — 约2.5小时' }],
    },
    nearby: {
      en: [{ name: 'Toumao Lake (Tianjing Sacred Lake)', distance: 'On-site' }, { name: 'Gangshika Snow Mountain', distance: '~50 km' }, { name: 'Zhangye National Geopark (Rainbow Mountains)', distance: '~200 km' }],
      zh: [{ name: '托茂湖（天境圣湖）', distance: '营地内' }, { name: '岗什卡雪山', distance: '约50公里' }, { name: '张掖丹霞国家地质公园', distance: '约200公里' }],
    },
    images: ['/images/projects/qinghai-qilian/image-01.jpg', '/images/projects/qinghai-qilian/image-02.jpg', '/images/projects/qinghai-qilian/image-03.jpg', '/images/projects/qinghai-qilian/image-04.jpg', '/images/projects/qinghai-qilian/image-05.jpg'],
  },

  // ─── 山西 · 西建大禹渡太空舱休闲度假湾 ───
  {
    id: 'shanxi-dayu',
    name: { en: 'Dayu\'s Ford Space Capsule Bay — Yellow River', zh: '山西西建大禹渡太空舱休闲度假湾' },
    location: { en: 'Dayu\'s Ford Scenic Area, Ruicheng County, Yuncheng, Shanxi, China', zh: '中国山西·运城市芮城县·大禹渡景区附近·黄河百米峭壁之上' },
    coordinates: [110.6794, 34.7386],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 7,
    unitArea: null,
    guests: '2',
    bookingUrl: '',
    description: {
      en: '"The First Space Capsule on Ten Thousand Li of Yellow River" — 7 independent capsules arranged like the Big Dipper on a sheer 100 m cliff above the Yellow River. Paired with 7 themed tent suites. 270° unobstructed views of the river and Zhongtiaoshan range. Lie in bed watching Yellow River sunsets; star-gaze through the electric skylight at night.',
      zh: '"万里黄河第一舱"，7座独立太空舱形似北斗七星，悬于黄河百米峭壁之上，搭配7顶主题帐篷酒店。270°全景落地窗无遮挡直面黄河与中条山，可"躺看长河落日、夜揽星河听涛"，毗邻大禹渡景区，感受黄河治水文化。',
    },
    amenities: [
      { icon: '🌊', label: { en: 'Cliff-Top Yellow River View', zh: '黄河悬崖全景' } },
      { icon: '⭐', label: { en: 'Big Dipper Layout', zh: '北斗七星布局' } },
      { icon: '🌌', label: { en: 'Electric Skylight', zh: '电动星空天窗' } },
      { icon: '🍽', label: { en: 'Yellow River Fish Feast', zh: '黄河鱼宴餐厅' } },
      { icon: '🏺', label: { en: 'Dayu Culture Heritage', zh: '大禹治水文化' } },
      { icon: '📷', label: { en: 'Sunset Photography', zh: '日落摄影圣地' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Yuncheng via G5 — ~1.5h drive' }, { mode: '🚗', text: 'From Xi\'an via G5 — ~2h drive' }, { mode: '✈️', text: 'Yuncheng Guanhan Airport — ~1.5h drive' }],
      zh: [{ mode: '🚗', text: '运城沿G5 — 约1.5小时' }, { mode: '🚗', text: '西安沿G5 — 约2小时' }, { mode: '✈️', text: '运城关汉卿机场 — 约1.5小时' }],
    },
    nearby: {
      en: [{ name: 'Dayu\'s Ford Scenic Area', distance: '~2 km' }, { name: 'Yongle Palace Murals (National Treasure)', distance: '~30 km' }, { name: 'Pujin Ferry (Historic Yellow River Crossing)', distance: '~20 km' }],
      zh: [{ name: '大禹渡景区', distance: '约2公里' }, { name: '永乐宫壁画（国宝）', distance: '约30公里' }, { name: '蒲津渡遗址', distance: '约20公里' }],
    },
    images: ['/images/projects/shanxi-dayu/image-01.jpg', '/images/projects/shanxi-dayu/image-02.jpg', '/images/projects/shanxi-dayu/image-03.jpg', '/images/projects/shanxi-dayu/image-04.jpg'],
  },

  // ─── 山西 · 云丘山轻野·HOME酒店 ───
  {
    id: 'shanxi-yunqiu',
    name: { en: 'Qingye HOME Hotel — Yunqiu Mountain', zh: '山西云丘山轻野·HOME酒店' },
    location: { en: 'Yunqiu Mountain 5A Scenic Area, Xiangning County, Linfen, Shanxi, China', zh: '中国山西·临汾市乡宁县·云丘山5A景区·海拔1330米悬崖边' },
    coordinates: [111.02, 35.74],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 10,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'Ten limited-edition space capsules perched on a 1,330 m clifftop within Yunqiu Mountain 5A Scenic Area — one of China\'s few smart capsule inns with card-swipe access and full voice-control. Three room types (Moonrise, Starhouse, Cloudlodge) all feature 270° panoramic windows and skylights for cloud-sea dawns, starlit nights and sunrises. Unlimited scenic area entry during stay.',
      zh: '坐落于山西云丘山5A景区海拔1330米悬崖边，10间限量客房分轻野月栖、星舍、云居三种房型，智能门禁刷卡入舱，语音控制全屋设备，270°环绕落地窗与星空天窗可观云海、赏星河、迎日出。住宿期间可无限次进出景区。',
    },
    amenities: [
      { icon: '⛰', label: { en: '1330m Clifftop Setting', zh: '海拔1330米悬崖' } },
      { icon: '🌌', label: { en: 'Cloud-Sea & Starry Sky', zh: '云海与星河观赏' } },
      { icon: '🗣', label: { en: 'Voice Smart Control', zh: '语音全屋控制' } },
      { icon: '🎫', label: { en: 'Unlimited Park Access', zh: '无限次进出景区' } },
      { icon: '🧖', label: { en: 'Herbal Health Soup', zh: '免费特色养生汤锅' } },
      { icon: '📷', label: { en: 'Star Photography', zh: '星空摄影绝佳地' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Linfen via G5 — ~1.5h drive' }, { mode: '🚗', text: 'From Yuncheng via G5 — ~1.5h drive' }, { mode: '🚂', text: 'Linfen Station — ~1.5h drive to scenic area' }],
      zh: [{ mode: '🚗', text: '临汾沿G5 — 约1.5小时' }, { mode: '🚗', text: '运城沿G5 — 约1.5小时' }, { mode: '🚂', text: '临汾站 — 约1.5小时到景区' }],
    },
    nearby: {
      en: [{ name: 'Yunqiu Mountain Ice Caves (World Top 3)', distance: 'In park' }, { name: 'Kangjia Ancient Village', distance: '~10 km' }, { name: 'Tianzi Mountain Hope Farm', distance: '~15 km' }],
      zh: [{ name: '云丘山冰洞群（世界三大冰洞之一）', distance: '景区内' }, { name: '康家坪古村', distance: '约10公里' }, { name: '天子山希望农场', distance: '约15公里' }],
    },
    images: ['/images/projects/shanxi-yunqiu/image-01.png', '/images/projects/shanxi-yunqiu/image-02.jpg', '/images/projects/shanxi-yunqiu/image-03.jpg', '/images/projects/shanxi-yunqiu/image-04.jpg'],
  },

  // ─── 四川 · 成都熊猫森林 ───
  {
    id: 'sichuan-chengdu',
    name: { en: 'Panda Forest CAMP', zh: '四川成都熊猫森林' },
    location: { en: 'Zhongba Village, Longmen Mountain Town, Pengzhou City, Chengdu, Sichuan, China', zh: '中国四川·成都彭州市龙门山镇中坝村·中坝森林秘境·海拔1200-1500米' },
    coordinates: [103.930, 31.100],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 10,
    unitArea: 25,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'VESSEL\'s first domestic project — Panda Forest CAMP in the Longmen Mountain forest at 1,200–1,500 m, Pengzhou. 10 independent S5 capsules (24–25 m²) perched among the treetops with 270° panoramic windows and stargazing skylights. Average summer temperature 25°C with sky-high negative ions. Lakeside cascade, panda pool, sports courts and forest restaurant.',
      zh: 'VESSEL 微宿国内首个落地项目，位于彭州市龙门山镇中坝森林秘境，占地约35亩，海拔1200-1500米。10栋独立S5太空舱（24-25㎡）悬于林梢，270°全景落地窗+星空天窗，夏季均温25°C，负氧离子爆表。配湖畔叠水、熊猫沙池、运动球场与森林餐厅。',
    },
    amenities: [
      { icon: '🐼', label: { en: 'Panda Theme', zh: '熊猫主题' } },
      { icon: '🌲', label: { en: 'Treetop Capsules', zh: '悬于林梢太空舱' } },
      { icon: '🌌', label: { en: 'Stargazing Skylight', zh: '星空天窗' } },
      { icon: '🍃', label: { en: 'High Negative Ions', zh: '负氧离子爆表' } },
      { icon: '🍃', label: { en: 'Forest Restaurant & Café', zh: '森林餐厅与咖啡厅' } },
      { icon: '💧', label: { en: 'Lakeside Cascade', zh: '湖畔叠水景观' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Chengdu via G5 — ~1.5h drive' }, { mode: '✈️', text: 'Chengdu Tianfu Airport — ~1.5h drive' }, { mode: '🚄', text: 'Pengzhou High-Speed Station — ~20 min taxi/ride' }],
      zh: [{ mode: '🚗', text: '成都沿G5高速 — 约1.5小时' }, { mode: '✈️', text: '天府国际机场 — 约1.5小时' }, { mode: '🚄', text: '犀浦高铁30分钟至彭州再转车' }],
    },
    nearby: {
      en: [{ name: 'Longmen Mountain National Forest Park', distance: '~10 km' }, { name: 'Baili Rhododendron Scenic Area', distance: '~20 km' }, { name: 'Pengzhou City Center', distance: '~30 km' }],
      zh: [{ name: '龙门山国家森林公园', distance: '约10公里' }, { name: '白鹿百里杜鹃景区', distance: '约20公里' }, { name: '彭州市区', distance: '约30公里' }],
    },
    images: ['/images/projects/sichuan-chengdu/image-01.jpg', '/images/projects/sichuan-chengdu/image-02.jpg', '/images/projects/sichuan-chengdu/image-03.jpg', '/images/projects/sichuan-chengdu/image-04.jpg', '/images/projects/sichuan-chengdu/image-05.jpg'],
  },

  // ─── 四川 · 轿顶山麋鹿生活营 ───
  {
    id: 'sichuan-jiaoding',
    name: { en: 'Elk Life Camp — Jiaoding Mountain', zh: '四川轿顶山麋鹿生活营' },
    location: { en: 'Jiaoding Mountain Scenic Area, Hanyuan County, Ya\'an, Sichuan, China', zh: '中国四川·雅安市汉源县·轿顶山景区·海拔3500米高山观景带' },
    coordinates: [102.5391, 29.3732],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A luxury alpine glamping camp at 3,500 m on Jiaoding Mountain, Hanyuan — unobstructed face-on views of Gongga Snow Mountain (7,556 m). Space capsules with smart control, private bath and heating gear positioned on a panoramic ridge for sunrise, cloud-sea, sunset and Milky Way stargazing. Adjacent to Hanyuan Lake for lakeside strolling.',
      zh: '位于四川雅安汉源县轿顶山景区海拔3500米高山观景带，视野开阔无遮挡，可直面贡嘎雪山（7556米）。太空舱配智能系统、独立卫浴与保暖设备，轻松观赏日出、云海、晚霞与银河星空，邻近汉源湖，可环湖漫步与休闲垂钓。',
    },
    amenities: [
      { icon: '🏔', label: { en: '3500m Alpine Ridge', zh: '海拔3500米高山' } },
      { icon: '🗻', label: { en: 'Gongga Snow Mountain View', zh: '直面贡嘎雪山' } },
      { icon: '🌌', label: { en: 'Milky Way Stargazing', zh: '银河星空观赏' } },
      { icon: '☁️', label: { en: 'Cloud Sea & Sunrise', zh: '云海与日出' } },
      { icon: '🦌', label: { en: 'Elk & Wild Life', zh: '麋鹿等野生动物' } },
      { icon: '🎣', label: { en: 'Hanyuan Lake Fishing', zh: '汉源湖垂钓' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Chengdu via G5 — ~4h drive' }, { mode: '🚗', text: 'From Ya\'an via G318 — ~2h drive' }, { mode: '✈️', text: 'Chengdu Tianfu Airport — ~4h drive' }],
      zh: [{ mode: '🚗', text: '成都沿G5 — 约4小时' }, { mode: '🚗', text: '雅安沿G318 — 约2小时' }, { mode: '✈️', text: '天府国际机场 — 约4小时' }],
    },
    nearby: {
      en: [{ name: 'Jiaoding Mountain Summit Viewpoint', distance: 'On-site' }, { name: 'Hanyuan Lake', distance: '~30 km' }, { name: 'Luding Bridge (Historic)', distance: '~80 km' }],
      zh: [{ name: '轿顶山全景观景台', distance: '营地内' }, { name: '汉源湖', distance: '约30公里' }, { name: '泸定桥（历史名胜）', distance: '约80公里' }],
    },
    images: ['/images/projects/sichuan-jiaoding/image-01.jpg', '/images/projects/sichuan-jiaoding/image-02.jpg', '/images/projects/sichuan-jiaoding/image-03.png', '/images/projects/sichuan-jiaoding/image-04.png', '/images/projects/sichuan-jiaoding/image-05.png'],
  },

  // ─── 四川 · 遂宁烟火里帐篷营地 ───
  {
    id: 'sichuan-suining',
    name: { en: 'Yanhuoli Tent Camp — Suining', zh: '四川遂宁烟火里帐篷营地' },
    location: { en: 'Yangsheng Valley, Hedong New District, Chuanshan District, Suining, Sichuan, China', zh: '中国四川·遂宁市船山区·河东新区灵泉大道养生谷·紧邻灵泉风景区' },
    coordinates: [105.5926, 30.5332],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: '2-6',
    bookingUrl: '',
    description: {
      en: 'A 70,000 m² urban-edge glamping complex adjacent to Lingquan Scenic Area (Guanyin culture), Suining — star rooms, tree houses, boat suites and luxury tents scattered through forest, open 24 hours with free park entry. Famous for colorful rapeseed flower fields in spring (Mar–Apr), weekend bonfire parties and whole-roasted lamb for groups of 8–10.',
      zh: '坐落于四川遂宁灵泉大道养生谷，紧邻中国观音故里灵泉风景区，占地7万余㎡，24小时开放，免费入园。星空房、树屋、船屋与轻奢帐篷散落林间，春季3-4月彩色油菜花田是热门打卡地，周末有篝火晚会与烤全羊，配套田园餐厅和亲子拓展区。',
    },
    amenities: [
      { icon: '🌸', label: { en: 'Spring Rapeseed Flower Fields', zh: '春季彩色油菜花田' } },
      { icon: '🏕', label: { en: '24-Hour Open Camp', zh: '24小时开放免费入园' } },
      { icon: '🐑', label: { en: 'Whole Roasted Lamb', zh: '烤全羊盛宴' } },
      { icon: '🌲', label: { en: 'Tree Houses & Boat Suites', zh: '树屋与船屋' } },
      { icon: '🎪', label: { en: 'Bonfire & Live Music', zh: '篝火晚会与演出' } },
      { icon: '👨‍👩‍👧', label: { en: 'Kids Adventure Zone', zh: '亲子拓展区' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'Suining city center — ~10 min drive' }, { mode: '🚂', text: 'Suining High-Speed Station — ~20 min drive' }, { mode: '🚗', text: 'From Chengdu via G75 — ~2h drive' }],
      zh: [{ mode: '🚗', text: '遂宁市区 — 约10分钟' }, { mode: '🚂', text: '遂宁高铁站 — 约20分钟' }, { mode: '🚗', text: '成都沿G75 — 约2小时' }],
    },
    nearby: {
      en: [{ name: 'Lingquan Scenic Area (Guanyin Culture)', distance: 'Walking' }, { name: 'Hedong New District Commercial Center', distance: '~10 min drive' }, { name: 'Suining Ancient City', distance: '~20 min drive' }],
      zh: [{ name: '灵泉风景区（观音故里）', distance: '步行可达' }, { name: '河东新区核心商圈', distance: '约10分钟' }, { name: '遂宁古城', distance: '约20分钟' }],
    },
    images: ['/images/projects/sichuan-suining/image-01.jpg', '/images/projects/sichuan-suining/image-02.jpg', '/images/projects/sichuan-suining/image-03.jpg', '/images/projects/sichuan-suining/image-04.jpg', '/images/projects/sichuan-suining/image-05.jpg'],
  },

  // ─── 台湾 · 惠来大雪山营地 ───
  {
    id: 'taiwan-daxueshan',
    name: { en: 'Daxueshan Mountain Camp', zh: '台湾惠来大雪山营地' },
    location: { en: 'Daxueshan National Forest Recreation Area, Heping District, Taichung, Taiwan, China', zh: '中国台湾·台中市和平区·大雪山国家森林游乐区·海拔1800-2996米' },
    coordinates: [121.0, 24.26],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'VESSEL V5 Gen5 capsules installed in Daxueshan National Forest Recreation Area, Taichung — altitude 1,800–2,996 m among ancient red cypress groves. Zero-pollution installation preserves the original mountain forest; capsules hide among pine and cypress with panoramic windows, full smart systems and private bath. Four-season scenery: spring flowers, summer cool, autumn maple, winter snow.',
      zh: '台湾台中大雪山国家森林游乐区，海拔1800-2996米，VESSEL V5 Gen5太空舱零污染安装，不破坏原生山林，舱体隐于苍松翠柏间。配全景落地窗、全屋智能与独立卫浴，可卧赏云海星空。春赏花、夏避暑、秋观枫、冬览雪景，可邂逅山羌、帝雉等珍稀动植物。',
    },
    amenities: [
      { icon: '🌲', label: { en: 'Ancient Red Cypress Forest', zh: '千年红桧神木群' } },
      { icon: '🌌', label: { en: 'Cloud Sea & Stars', zh: '云海与星空观赏' } },
      { icon: '🦌', label: { en: 'Mikado Pheasant & Wildlife', zh: '帝雉等珍稀野生动物' } },
      { icon: '🍁', label: { en: '4-Season Mountain Views', zh: '四季山林风光' } },
      { icon: '🥾', label: { en: 'Forest Bath Trails', zh: '森林浴步道' } },
      { icon: '🔭', label: { en: 'Stargazing Activity', zh: '夜间观星活动' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Taichung city via Taiwan Route 8 — ~2.5h drive' }, { mode: '🚗', text: 'From Dongshi District, Taichung — ~1.5h drive' }, { mode: '✈️', text: 'Taichung Airport — ~2h drive' }],
      zh: [{ mode: '🚗', text: '台中市区沿台8线 — 约2.5小时' }, { mode: '🚗', text: '台中东势区 — 约1.5小时' }, { mode: '✈️', text: '台中清泉岗机场 — 约2小时' }],
    },
    nearby: {
      en: [{ name: 'Daxueshan Summit (2996 m)', distance: 'In park' }, { name: 'Dongshi Forest Recreation Area', distance: '~1h drive' }, { name: 'Guguan Hot Springs', distance: '~1.5h drive' }],
      zh: [{ name: '大雪山主峰（2996米）', distance: '景区内' }, { name: '东势林场', distance: '约1小时' }, { name: '谷关温泉', distance: '约1.5小时' }],
    },
    images: ['/images/projects/taiwan-daxueshan/image-01.jpg', '/images/projects/taiwan-daxueshan/image-02.jpg', '/images/projects/taiwan-daxueshan/image-03.jpg', '/images/projects/taiwan-daxueshan/image-04.jpg'],
  },

  // ─── 西藏 · 加拉桃源雪峰温泉民宿 ───
  {
    id: 'tibet-jiala',
    name: { en: 'Jiala Peach Blossom Snow Peak Hot Spring Inn', zh: '西藏加拉桃源雪峰温泉民宿' },
    location: { en: 'Yusong Village, Pai Town, Milin (Mainling) City, Nyingchi, Tibet, China', zh: '中国西藏·林芝市米林市派镇玉松村·雅鲁藏布大峡谷核心地带·海拔3100米' },
    coordinates: [95.0, 29.6],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A high-altitude secret retreat at 3,100 m in Pai Town, Nyingchi — facing Namcha Barwa (7,782 m) and beside 100+ acres of wild peach blossom. Three room series: panoramic 5 m floor-to-ceiling star rooms, 260° smart Tibetan suites, and traditional Tibetan rooms. Natural hot-spring pools open at night for snow-mountain soaking. Oxygen supply available for altitude comfort.',
      zh: '藏于雅鲁藏布大峡谷核心地带，海拔3100米，直面"西藏众山之父"南迦巴瓦峰（7782米），毗邻百亩野生桃花园。三大系列住宿：5米全景落地窗星空观景房、260度全景智能藏式客房、传统藏式客房。20点开放温泉池边泡汤远眺雪山，备有夜间供氧系统。',
    },
    amenities: [
      { icon: '🌸', label: { en: 'Wild Peach Blossom (Mar–Apr)', zh: '百亩野生桃花（3-4月）' } },
      { icon: '🏔', label: { en: 'Namcha Barwa View', zh: '直面南迦巴瓦峰' } },
      { icon: '♨️', label: { en: 'Natural Hot Spring (Night)', zh: '天然温泉（夜间开放）' } },
      { icon: '🫧', label: { en: 'Night Oxygen System', zh: '夜间供氧系统' } },
      { icon: '🍲', label: { en: 'Tibetan Cuisine & Butter Tea', zh: '藏香猪火锅与酥油茶' } },
      { icon: '🙏', label: { en: 'Mani Pile Blessing Walk', zh: '玛尼堆祈福' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Lhasa via G318 — ~4h drive' }, { mode: '🚂', text: 'Lhasa Station — Nyingchi by train ~3.5h, then drive ~1.5h' }, { mode: '✈️', text: 'Nyingchi Mainling Airport — ~1h drive' }],
      zh: [{ mode: '🚗', text: '拉萨沿G318国道 — 约4小时' }, { mode: '🚂', text: '拉萨站乘动车至林芝约3.5小时，再驾车约1.5小时' }, { mode: '✈️', text: '林芝米林机场 — 约1小时' }],
    },
    nearby: {
      en: [{ name: 'Namcha Barwa Base Camp', distance: '~1.5 km' }, { name: 'Ancient Millennium Mulberry Tree', distance: '~5 km' }, { name: 'Yarlung Tsangpo Grand Canyon', distance: '~20 km' }],
      zh: [{ name: '南迦巴瓦峰大本营', distance: '约1.5公里' }, { name: '千年古桑树', distance: '约5公里' }, { name: '雅鲁藏布大峡谷', distance: '约20公里' }],
    },
    images: ['/images/projects/tibet-jiala/image-01.webp', '/images/projects/tibet-jiala/image-02.webp', '/images/projects/tibet-jiala/image-03.webp', '/images/projects/tibet-jiala/image-04.webp', '/images/projects/tibet-jiala/image-05.webp', '/images/projects/tibet-jiala/image-06.webp', '/images/projects/tibet-jiala/image-07.webp'],
  },

  // ─── 新疆 · 伊犁黑蜂庄园生态酒店 ───
  {
    id: 'xinjiang-yili',
    name: { en: 'Black Bee Manor Eco Hotel — Tangbula Grassland', zh: '新疆伊犁黑蜂庄园生态酒店' },
    location: { en: 'Tangbula Grassland, Nilka County, Ili Kazakh Autonomous Prefecture, Xinjiang, China', zh: '中国新疆·伊犁哈萨克自治州尼勒克县·唐布拉草原·海拔1600米' },
    coordinates: [83.567, 43.624],
    country: '🇨🇳',
    openDate: 'TBD',
    units: null,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'Ili Valley\'s first bee-culture themed eco hotel at 1,600 m on Tangbula Grassland — VESSEL capsules, luxury log cabins, Kazakh yurts and star-gazing tents. VESSEL panoramic capsules with smart climate control and private bath overlook snow peaks and streams. Fresh honey pressing, horse riding, wildflower hiking and Kazakh nomadic cultural immersion.',
      zh: '伊犁河谷首家蜂文化主题生态酒店，位于尼勒克县唐布拉草原海拔1600米，是唐布拉百里画廊起点地标。VESSEL 微宿太空舱全景通透，推窗即见草原雪山与溪流，配套割蜜工坊、高加索餐厅、草原骑马与千人露营地，可明火烧烤自助扎营。',
    },
    amenities: [
      { icon: '🐝', label: { en: 'Black Bee Honey Experience', zh: '黑蜂割蜜工坊体验' } },
      { icon: '🏔', label: { en: 'Tian Shan Snow Mountain Views', zh: '天山雪山全景' } },
      { icon: '🐎', label: { en: 'Horse Riding & Grassland', zh: '草原骑马' } },
      { icon: '🌸', label: { en: 'Wildflower Valley Hiking', zh: '花海徒步' } },
      { icon: '🏕', label: { en: 'Thousand-Person Camp', zh: '千人露营地' } },
      { icon: '🥘', label: { en: 'Caucasus Restaurant', zh: '高加索餐厅' } },
    ],
    transport: {
      en: [{ mode: '✈️', text: 'Narat Airport (Xinyuan) — ~69 km / ~50 min drive' }, { mode: '🚗', text: 'From Yining city via S315 — ~2.5h drive' }, { mode: '🚗', text: 'Self-drive on Yili Scenic Ring Road (Golden Route)' }],
      zh: [{ mode: '✈️', text: '那拉提机场（新源）— 约69公里/50分钟' }, { mode: '🚗', text: '伊宁市沿S315省道 — 约2.5小时' }, { mode: '🚗', text: '伊犁自驾黄金线路经过此地' }],
    },
    nearby: {
      en: [{ name: 'Tangbula 100 km Scenic Corridor', distance: 'Starting point' }, { name: 'Narat National Scenic Area', distance: '~100 km' }, { name: 'Sailimu Lake', distance: '~150 km' }],
      zh: [{ name: '唐布拉百里画廊', distance: '起点' }, { name: '那拉提国家级风景区', distance: '约100公里' }, { name: '赛里木湖', distance: '约150公里' }],
    },
    images: ['/images/projects/xinjiang-yili/image-01.jpg', '/images/projects/xinjiang-yili/image-02.jpg', '/images/projects/xinjiang-yili/image-03.jpg', '/images/projects/xinjiang-yili/image-04.jpg', '/images/projects/xinjiang-yili/image-05.jpg'],
  },

  // ─── 云南 · 八珠在春天摩梭家园 ───
  {
    id: 'yunnan-mosuo',
    name: { en: 'Bazhu Springtime Mosuo Home', zh: '云南八珠在春天摩梭家园' },
    location: { en: 'Bazhu Village, Yongning Town, Ninglang County, Lijiang, Yunnan, China', zh: '中国云南·丽江市宁蒗县永宁镇泥鳅沟村委会八珠村·距泸沽湖10分钟' },
    coordinates: [100.8353, 27.7183],
    country: '🇨🇳',
    openDate: '2024',
    units: 51,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'Opened 2024 — 51-room immersive Mosuo cultural resort in Bazhu Village, Ninglang, 10 minutes from Lugu Lake. Mosuo log-house architecture fused with contemporary design: boutique rooms, space capsules and star-gazing tents, all with en-suite baths and smart controls. Nightly bonfire Jiaco dance with villagers, Mosuo culture museum, and springtime Gersa flower sea.',
      zh: '2024年全新开业，坐落于云南宁蒗八珠村，距泸沽湖仅10分钟，51间客房融合摩梭木楞房元素与现代设计。特色客房、太空舱及星空帐篷均配独立卫浴与智能客控。每晚带餐篝火晚会，与村民共跳传统甲搓舞；设摩梭文化展示馆，春日可赏格桑花海，感受原生摩梭风情。',
    },
    amenities: [
      { icon: '🏠', label: { en: 'Mosuo Log House Architecture', zh: '摩梭木楞房建筑' } },
      { icon: '🔥', label: { en: 'Nightly Bonfire Dance', zh: '每晚篝火甲搓舞' } },
      { icon: '🌸', label: { en: 'Springtime Gersa Flowers', zh: '格桑花海（春季）' } },
      { icon: '🏛', label: { en: 'Mosuo Culture Museum', zh: '摩梭文化展示馆' } },
      { icon: '🌌', label: { en: 'Stargazing Skylights', zh: '星空天窗' } },
      { icon: '🍽', label: { en: 'Sour-Broth Hotpot', zh: '酸汤火锅与生态美食' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Lugu Lake scenic area — ~10 min drive' }, { mode: '🚗', text: 'From Lijiang via G245 — ~4h drive' }, { mode: '✈️', text: 'Lijiang Sanyi Airport — ~4h drive' }],
      zh: [{ mode: '🚗', text: '泸沽湖景区 — 约10分钟' }, { mode: '🚗', text: '丽江沿G245 — 约4小时' }, { mode: '✈️', text: '丽江三义机场 — 约4小时' }],
    },
    nearby: {
      en: [{ name: 'Lugu Lake National Scenic Area', distance: '~10 min drive' }, { name: 'Lige Island', distance: '~20 min' }, { name: 'Mosuo Ancient Town', distance: '~15 min' }],
      zh: [{ name: '泸沽湖国家级风景区', distance: '约10分钟' }, { name: '里格岛', distance: '约20分钟' }, { name: '摩梭小镇', distance: '约15分钟' }],
    },
    images: ['/images/projects/yunnan-mosuo/image-01.jpg', '/images/projects/yunnan-mosuo/image-02.jpg', '/images/projects/yunnan-mosuo/image-03.jpg', '/images/projects/yunnan-mosuo/image-04.jpg'],
  },

  // ─── 云南 · 玉溪映月潭圆梦营酒店 ───
  {
    id: 'yunnan-yuxi',
    name: { en: 'Yingyue Tan Dream Camp Hotel', zh: '云南玉溪映月潭圆梦营酒店' },
    location: { en: 'Yingyue Tan Leisure Culture Center (4A), Yuxi City, Yunnan, China', zh: '中国云南·玉溪市·映月潭修闲文化中心（国家4A级旅游景区）' },
    coordinates: [102.5491, 24.3537],
    country: '🇨🇳',
    openDate: 'TBD',
    units: 26,
    unitArea: null,
    guests: '2-4',
    bookingUrl: '',
    description: {
      en: 'A "hot spring + space capsule + glamping" resort within the 4A-rated Yingyue Tan Cultural Center, Yuxi — 26 futuristic capsule rooms with private hot-spring soaking pools in each courtyard. The 51°C natural geothermal spring from 2,000 m underground is rich in fluoride and silicic acid. Unlimited hot-spring access included with stay. BBQ kits and open-fire tea service in-courtyard.',
      zh: '坐落于云南玉溪映月潭国家4A景区，是"温泉+太空舱+露营"沉浸式度假标杆。26间科技感太空舱，每间独立庭院标配私人泡池，源自地下2000米51°C天然矿泉富含氟与偏硅酸，住店即享无限次温泉权益。庭院内设烧烤台与围炉煮茶区，可步行至景区40+功能泡池。',
    },
    amenities: [
      { icon: '♨️', label: { en: 'Private Hot-Spring Pool', zh: '独立庭院私人泡池' } },
      { icon: '🌡', label: { en: '51°C Natural Geothermal Spring', zh: '51°C天然地热矿泉' } },
      { icon: '🛸', label: { en: '26 Space Capsule Suites', zh: '26间科技感太空舱' } },
      { icon: '🔥', label: { en: 'In-Courtyard BBQ & Fire Tea', zh: '庭院烧烤与围炉煮茶' } },
      { icon: '🏊', label: { en: '40+ Pool Spa (Unlimited)', zh: '40+功能泡池（无限次）' } },
      { icon: '⛪', label: { en: 'Yuquan Temple Nearby', zh: '玉泉寺1公里' } },
    ],
    transport: {
      en: [{ mode: '🚗', text: 'From Yuxi city center — ~15 min drive' }, { mode: '🚗', text: 'From Kunming via G8511 — ~1.5h drive' }, { mode: '✈️', text: 'Kunming Changshui Airport — ~1.5h drive' }],
      zh: [{ mode: '🚗', text: '玉溪市区 — 约15分钟' }, { mode: '🚗', text: '昆明沿G8511 — 约1.5小时' }, { mode: '✈️', text: '昆明长水机场 — 约1.5小时' }],
    },
    nearby: {
      en: [{ name: 'Yingyue Tan Hot Spring (40+ Pools)', distance: 'Walking' }, { name: 'Yuquan Temple', distance: '~1 km' }, { name: 'Dataying Commercial Street', distance: '~3 km' }],
      zh: [{ name: '映月潭温泉（40+泡池）', distance: '步行可达' }, { name: '玉泉寺', distance: '约1公里' }, { name: '大营街商圈', distance: '约3公里' }],
    },
    images: ['/images/projects/yunnan-yuxi/image-01.jpg', '/images/projects/yunnan-yuxi/image-02.jpg', '/images/projects/yunnan-yuxi/image-03.jpg', '/images/projects/yunnan-yuxi/image-04.jpg'],
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

// ── VESSEL HQ — separate from showcase list, used by GlobalMapML ─────────────
export const HQ_PROJECT: ShowcaseProject = {
  id: 'vessel-hq',
  name: { en: 'VESSEL HQ & Smart Factory', zh: 'VESSEL 微宿 · 超级工厂' },
  location: {
    en: '253 Xingye North Road, Shishan Town, Nanhai District, Foshan, Guangdong',
    zh: '广东省佛山市南海区狮山镇兴业北路253号',
  },
  coordinates: [113.0021, 23.1247],
  country: '🇨🇳',
  openDate: '2018',
  units: null,
  unitArea: null,
  guests: '—',
  bookingUrl: '',   // no "Book Now"; only "Contact VESSEL" CTA will show
  description: {
    en: 'VESSEL\'s 28,800 ㎡ precision smart factory is the manufacturing heart of every micro-resort unit. Established in 2018 in Foshan\'s Nanhai Shishan industrial zone — China\'s most dynamic prefab manufacturing corridor — three dedicated production lines deliver up to 150 units per month. Every cabin is engineered, quality-tested, and internationally certified here before shipping to clients in 30+ countries.',
    zh: 'VESSEL 28,800㎡ 超级工厂坐落于广东省佛山市南海区狮山镇，是每一套微宿产品的诞生地。工厂建于2018年，配备3条专属生产线，月产能达150台，累计服务全球30余个国家与地区。工厂持有150+项专利，全面通过 ISO、CE 等国际认证，是中国预制模块建筑行业的标杆制造基地。',
  },
  amenities: [
    { icon: '🏭', label: { en: '28,800 ㎡ Smart Factory', zh: '28,800㎡ 精密智造基地' } },
    { icon: '🏠', label: { en: '150 Units / Month Capacity', zh: '月产能 150 台' } },
    { icon: '👥', label: { en: '75+ Skilled Staff', zh: '75+ 人专业团队' } },
    { icon: '🏆', label: { en: '150+ Patents', zh: '150+ 项专利' } },
    { icon: '🌍', label: { en: 'Shipped to 30+ Countries', zh: '产品出口 30+ 国家' } },
    { icon: '✅', label: { en: 'ISO · CE · SGS Certified', zh: 'ISO · CE · SGS 国际认证' } },
  ],
  transport: {
    en: [
      { mode: '✈️', text: 'Guangzhou Baiyun Airport — 45 min drive' },
      { mode: '✈️', text: 'Foshan Shunde Airport — 30 min drive' },
      { mode: '🚇', text: 'Guangfo Metro Line 1 · Shishan Station — 10 min walk' },
    ],
    zh: [
      { mode: '✈️', text: '广州白云国际机场 — 约45分钟车程' },
      { mode: '✈️', text: '佛山顺德机场 — 约30分钟车程' },
      { mode: '🚇', text: '广佛地铁1号线 · 狮山站 — 步行约10分钟' },
    ],
  },
  nearby: {
    en: [
      { name: 'Guangfo Interchange (广佛互通)', distance: '5 min drive' },
      { name: 'Foshan CBD (Chancheng District)', distance: '25 min drive' },
      { name: 'Guangzhou city centre', distance: '45 min drive' },
    ],
    zh: [
      { name: '广佛高速互通', distance: '5分钟车程' },
      { name: '佛山禅城区CBD', distance: '25分钟车程' },
      { name: '广州市区', distance: '45分钟车程' },
    ],
  },
  images: [
    '/images/homepage/factory-01.jpg',
    '/images/homepage/factory-02.jpg',
  ],
}
