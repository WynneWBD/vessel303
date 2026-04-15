export interface ShowcaseProject {
  id: string
  name: { en: string; zh: string }
  location: { en: string; zh: string }
  coordinates: [number, number]  // [lng, lat] — MapLibre order
  country: string  // flag emoji
  openDate: string
  units: number
  unitArea: number
  guests: string
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
  {
    id: 'astrobase-mamison',
    name: { en: 'AstroBase Mamison Hotel', zh: 'AstroBase 太空基地酒店' },
    location: { en: 'Mamison Ski Resort, North Ossetia, Russia', zh: '俄罗斯北奥塞梯·Mamison滑雪度假区' },
    coordinates: [43.839825, 42.662101],  // [lng, lat]
    country: '🇷🇺',
    openDate: '2025.03',
    units: 20,
    unitArea: 35,
    guests: '2-4',
    bookingUrl: 'https://astrobasehotel.ru/',
    description: {
      en: 'A futuristic glamping resort nestled in the Caucasus Mountains at Mamison Ski Resort. 20 independent space capsule units with panoramic windows, smart home systems, and private terraces — where cutting-edge technology meets the raw beauty of the Greater Caucasus.',
      zh: '坐落于高加索山脉Mamison滑雪度假区的未来感豪华露营地。20栋独立太空舱式房屋，配备全景落地窗、智能家居系统和私人阳台——高科技与高加索山脉自然风光的完美融合。',
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
      en: [
        { mode: '✈️', text: 'Vladikavkaz Airport — 1.5h drive' },
        { mode: '🚂', text: 'Alagir Station — 45min drive' },
        { mode: '🚗', text: 'From Vladikavkaz via M29 — 1.5h' },
      ],
      zh: [
        { mode: '✈️', text: '弗拉季高加索机场 — 车程1.5小时' },
        { mode: '🚂', text: '阿拉吉尔火车站 — 车程45分钟' },
        { mode: '🚗', text: '弗拉季高加索市沿M29高速 — 1.5小时' },
      ],
    },
    nearby: {
      en: [
        { name: 'Калак Ski Station', distance: '1 km' },
        { name: 'Mamihdon River Gorge', distance: 'Walking distance' },
        { name: 'Caucasus Viewpoint', distance: '5 km' },
        { name: 'Mount Elbrus', distance: '2h drive' },
      ],
      zh: [
        { name: 'Калак滑雪站', distance: '1公里' },
        { name: 'Mamihdon河峡谷', distance: '步行可达' },
        { name: '高加索山脉观景台', distance: '5公里' },
        { name: '厄尔布鲁士山', distance: '车程2小时' },
      ],
    },
    images: [
      '/images/projects/astrobase-mamison/exterior-01.png',
      '/images/projects/astrobase-mamison/interior-01.png',
      '/images/projects/astrobase-mamison/exterior-02.jpg',
      '/images/projects/astrobase-mamison/interior-02.png',
      '/images/projects/astrobase-mamison/exterior-03.jpg',
      '/images/projects/astrobase-mamison/interior-03.png',
    ],
  },
]
