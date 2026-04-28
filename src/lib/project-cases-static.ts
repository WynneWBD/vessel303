export type ProjectCaseStatus = 'draft' | 'published'

export type ProjectGlobalAmenity = {
  icon: string
  label: {
    zh: string
    en: string
  }
}

export type ProjectGlobalTransport = {
  mode: string
  text: string
}

export type ProjectGlobalNearby = {
  name: string
  distance: string
}

export interface ProjectCaseInput {
  id: string
  name_zh: string
  name_en: string
  location_zh: string
  location_en: string
  project_type_zh: string
  project_type_en: string
  area_display: string
  investment_display: string
  units_display: string
  products: string
  description_zh: string
  description_en: string
  tags_zh: string[]
  tags_en: string[]
  cover_image_url: string | null
  images: string[]
  country: string
  latitude: number | null
  longitude: number | null
  global_open_date?: string
  global_units?: number | null
  global_unit_area?: number | null
  global_guests?: string
  global_booking_url?: string
  global_amenities?: ProjectGlobalAmenity[]
  global_transport_zh?: ProjectGlobalTransport[]
  global_transport_en?: ProjectGlobalTransport[]
  global_nearby_zh?: ProjectGlobalNearby[]
  global_nearby_en?: ProjectGlobalNearby[]
  status?: ProjectCaseStatus
  sort_order?: number
}

export type ProjectCaseRow = ProjectCaseInput & {
  global_open_date: string
  global_units: number | null
  global_unit_area: number | null
  global_guests: string
  global_booking_url: string
  global_amenities: ProjectGlobalAmenity[]
  global_transport_zh: ProjectGlobalTransport[]
  global_transport_en: ProjectGlobalTransport[]
  global_nearby_zh: ProjectGlobalNearby[]
  global_nearby_en: ProjectGlobalNearby[]
  status: ProjectCaseStatus
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type StaticProjectCaseSeed = Omit<
  ProjectCaseRow,
  | 'global_open_date'
  | 'global_units'
  | 'global_unit_area'
  | 'global_guests'
  | 'global_booking_url'
  | 'global_amenities'
  | 'global_transport_zh'
  | 'global_transport_en'
  | 'global_nearby_zh'
  | 'global_nearby_en'
> & Partial<Pick<
  ProjectCaseRow,
  | 'global_open_date'
  | 'global_units'
  | 'global_unit_area'
  | 'global_guests'
  | 'global_booking_url'
  | 'global_amenities'
  | 'global_transport_zh'
  | 'global_transport_en'
  | 'global_nearby_zh'
  | 'global_nearby_en'
>>

const staticProjectCaseSeeds: StaticProjectCaseSeed[] = [
  {
    id: 'xunliao-bay-holiday-planet',
    name_zh: '巽寮湾·假日星球滨海野奢营地',
    name_en: 'Holiday Planet Seaside Glamping Camp',
    location_zh: '广东·惠州',
    location_en: 'Huizhou, Guangdong',
    project_type_zh: '滨海野奢度假营地',
    project_type_en: 'Seaside luxury glamping camp',
    area_display: '35,000㎡',
    investment_display: 'RMB 2,500万元',
    units_display: '20台',
    products: 'S5 Gen5 · O5 · E7 Gen5 · V7 Gen5',
    description_zh: '依托惠州巽寮湾天然海岸线，打造集滨海野奢住宿、亲水体验、休闲餐饮于一体的高端度假营地，多种产品型号组合构建丰富的空间层次。',
    description_en: 'A high-end seaside glamping camp along Xunliao Bay, combining coastal stays, waterfront activities, leisure dining, and multiple VESSEL product types.',
    tags_zh: ['滨海', '野奢', '亲子'],
    tags_en: ['Seaside', 'Luxury Camp', 'Family'],
    cover_image_url: null,
    images: [],
    country: '中国',
    latitude: null,
    longitude: null,
    status: 'published',
    sort_order: 1,
    created_at: '',
    updated_at: '',
    deleted_at: null,
  },
  {
    id: 'jiaoding-mountain-elk-life',
    name_zh: '麋鹿高山生活营地',
    name_en: 'Elk Life Alpine Camp',
    location_zh: '四川·轿顶山',
    location_en: 'Jiaoding Mountain, Sichuan',
    project_type_zh: '高原度假营地',
    project_type_en: 'Alpine resort camp',
    area_display: '15,000㎡',
    investment_display: 'RMB 4,500万元',
    units_display: '26台',
    products: 'E7 Gen6 · V9 Gen6 · E6 Gen6',
    description_zh: '海拔3000米以上的轿顶山高原营地，利用VESSEL产品极端气候适应性（-32℃至55℃），实现高原四季全天候运营。云海与星空成为壮丽的天然背景。',
    description_en: 'An alpine camp above 3,000 meters, using VESSEL cabins for all-season operation in extreme climates with cloud seas and starry skies as the backdrop.',
    tags_zh: ['高原', '星空', '云海'],
    tags_en: ['Alpine', 'Starry Sky', 'Cloud Sea'],
    cover_image_url: null,
    images: [],
    country: '中国',
    latitude: null,
    longitude: null,
    status: 'published',
    sort_order: 2,
    created_at: '',
    updated_at: '',
    deleted_at: null,
  },
  {
    id: 'qilian-tuomao-tribe',
    name_zh: '托茂部落生态营地',
    name_en: 'Tuomao Tribe Eco Camp',
    location_zh: '青海·祁连',
    location_en: 'Qilian, Qinghai',
    project_type_zh: '草原度假营地',
    project_type_en: 'Grassland resort camp',
    area_display: '4,000㎡',
    investment_display: 'RMB 500万元',
    units_display: '待定',
    products: 'V9 Gen6 · E6 Gen6',
    description_zh: '祁连山下托茂部落，以蒙古族文化为主题，VESSEL装配建筑与蒙古包景观相互辉映，实现现代舒适与民族特色的融合。',
    description_en: 'A grassland resort near the Qilian Mountains, blending VESSEL prefabricated cabins with Mongolian cultural landscape elements.',
    tags_zh: ['草原', '民族风情', '文化体验'],
    tags_en: ['Grassland', 'Culture', 'Experience'],
    cover_image_url: null,
    images: [],
    country: '中国',
    latitude: null,
    longitude: null,
    status: 'published',
    sort_order: 3,
    created_at: '',
    updated_at: '',
    deleted_at: null,
  },
  {
    id: 'wanlv-lake-leqing-valley',
    name_zh: '万绿湖心乐青谷营地',
    name_en: 'Wanlv Lake Leqing Valley Camp',
    location_zh: '广东·河源',
    location_en: 'Heyuan, Guangdong',
    project_type_zh: '生态保护景区营地',
    project_type_en: 'Eco scenic-area camp',
    area_display: '25,000㎡',
    investment_display: 'RMB 500万元',
    units_display: '15台',
    products: 'V5 Gen5 · V7 Gen5',
    description_zh: '国家级自然保护区内，以轻量化装配建筑减少对生态的干扰。万绿湖碧水倒映下，15台产品点缀湖岸，构建“在自然中住宿”的卓越体验。',
    description_en: 'A light-touch camp inside a protected scenic area, using 15 units along Wanlv Lake to create an immersive stay in nature.',
    tags_zh: ['生态保护', '湖景', '轻奢'],
    tags_en: ['Eco', 'Lake View', 'Light Luxury'],
    cover_image_url: null,
    images: [],
    country: '中国',
    latitude: null,
    longitude: null,
    status: 'published',
    sort_order: 4,
    created_at: '',
    updated_at: '',
    deleted_at: null,
  },
  {
    id: 'foshan-shishan-cultural-camp',
    name_zh: '南海狮山文旅营地',
    name_en: 'Nanhai Shishan Cultural Tourism Camp',
    location_zh: '广东·佛山',
    location_en: 'Foshan, Guangdong',
    project_type_zh: '城郊文旅营地',
    project_type_en: 'Suburban cultural tourism camp',
    area_display: '18,000㎡',
    investment_display: 'RMB 1,800万元',
    units_display: '30台',
    products: 'E7 Gen6 · E6 Gen6 · E3 Gen6',
    description_zh: 'VESSEL 微宿与南海狮山文旅战略合作，打造千万级野趣亲水营地。E7/E6/E3全系出击，覆盖高、中、入门三档客群，显著提升坪效。',
    description_en: 'A suburban cultural tourism camp built with E7, E6, and E3 products to cover multiple guest segments and improve site efficiency.',
    tags_zh: ['城郊', '亲水', '全系应用'],
    tags_en: ['Suburban', 'Waterfront', 'Full Series'],
    cover_image_url: null,
    images: [],
    country: '中国',
    latitude: null,
    longitude: null,
    status: 'published',
    sort_order: 5,
    created_at: '',
    updated_at: '',
    deleted_at: null,
  },
  {
    id: 'huawei-smart-home-showroom',
    name_zh: '华为全屋智能主题馆',
    name_en: 'Huawei Whole-Home Smart Showroom',
    location_zh: '广东·深圳',
    location_en: 'Shenzhen, Guangdong',
    project_type_zh: '品牌体验空间',
    project_type_en: 'Brand experience space',
    area_display: '800㎡',
    investment_display: 'RMB 300万元',
    units_display: '4台',
    products: 'E7 Gen6 · V9 Gen6',
    description_zh: '微宿VESSEL与华为HUAWEI战略合作，装配式预制建筑与华为全屋智能系统完美融合，共同打造未来生活方式体验展馆。',
    description_en: 'A brand experience showroom combining VESSEL prefabricated architecture with Huawei whole-home smart systems.',
    tags_zh: ['科技', '智能家居', '品牌合作'],
    tags_en: ['Technology', 'Smart Home', 'Brand Partner'],
    cover_image_url: null,
    images: [],
    country: '中国',
    latitude: null,
    longitude: null,
    status: 'published',
    sort_order: 6,
    created_at: '',
    updated_at: '',
    deleted_at: null,
  },
]

export const staticProjectCases: ProjectCaseRow[] = staticProjectCaseSeeds.map((item) => ({
  global_open_date: '',
  global_units: null,
  global_unit_area: null,
  global_guests: '',
  global_booking_url: '',
  global_amenities: [],
  global_transport_zh: [],
  global_transport_en: [],
  global_nearby_zh: [],
  global_nearby_en: [],
  ...item,
}))
