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

  // ═══ 国内项目 (30) ═══

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
