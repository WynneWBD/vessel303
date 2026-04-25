// Slim marker dataset for the global map. Only the fields the map needs
// to render a pin and its hover popup — the heavy per-project payload
// (description, amenities, transport, nearby, images) lives in
// `showcaseProjects.ts` and is dynamic-imported on first marker click.
//
// IMPORTANT: this list is the source of truth for which projects appear
// on the map. If you add or remove a project here, update
// `src/data/showcaseProjects.ts` to match (and vice versa). Order does
// not need to match — lookups are by `id`.

export interface ShowcaseMarker {
  id: string
  name: { en: string; zh: string }
  coordinates: [number, number]  // [lng, lat] — MapLibre order
}

export const SHOWCASE_MARKERS: ShowcaseMarker[] = [
  // ═══ 海外项目 ═══
  { id: 'astrobase-mamison',     name: { en: 'AstroBase Mamison Hotel',                                  zh: 'AstroBase 太空基地酒店' },                  coordinates: [43.839825, 42.662101] },
  { id: 'israel-dream-island',   name: { en: 'Dream Island Spa & Health Resort',                         zh: 'Dream Island 水疗健康度假村' },              coordinates: [34.676849, 31.645723] },
  { id: 'argentina-nordelta',    name: { en: 'Holihaus Argentina Showroom — Centro Comercial Nordelta',  zh: 'Holihaus 阿根廷展厅 · Nordelta 购物中心' },   coordinates: [-58.6066, -34.3855] },
  { id: 'russia-kalak',          name: { en: 'Kalak Ski Station — Mamison Resort',                       zh: 'Калак 滑雪站 · Mamison 度假区' },             coordinates: [43.855, 42.668] },
  { id: 'usa-clewiston',         name: { en: 'V9 Eco Smart Community — Clewiston, Florida',              zh: 'V9 智能生态社区 · 佛罗里达州克莱威斯顿' },     coordinates: [-80.9329, 26.7535] },
  { id: 'usa-georgetown',        name: { en: 'E9 Eco Smart Cabin Community — Georgetown, Louisiana',     zh: 'E9 智能生态小屋社区 · 路易斯安那州乔治城' },   coordinates: [-92.3988, 31.617] },
  { id: 'usa-mount-pleasant',    name: { en: 'E9 Eco Smart Cabin Community — Mount Pleasant, Texas',     zh: 'E9 智能生态小屋社区 · 德克萨斯州芒特普莱森特' }, coordinates: [-95.0025, 33.1562] },
  { id: 'japan-space-vessel',    name: { en: 'SPACE-VESSEL Base — Vacation STAY',                        zh: 'SPACE-VESSEL Base 宇宙船主题住宿' },          coordinates: [131.343, 33.284] },
  { id: 'japan-setonohama',      name: { en: 'Setonohama Beach & Resort',                                zh: '瀬戸の浜 Beach & Resort' },                  coordinates: [134.5155, 34.4813] },
  { id: 'thailand-nx-space',     name: { en: 'Nx Space Pool Villa',                                      zh: 'Nx Space 泳池别墅' },                         coordinates: [101.2159, 14.3485] },

  // ═══ 国内项目 ═══
  { id: 'changzhou-taihu',       name: { en: 'Taihu Bay Camping Valley',                                 zh: '常州太湖湾露营谷' },                          coordinates: [119.828, 31.365] },
  { id: 'dunhuang-yardang',      name: { en: 'Yardang Geopark Star Station',                             zh: '敦煌雅丹国家地质公园星辰驿站' },               coordinates: [92.9166, 40.5097] },
  { id: 'fujian-dongshan',       name: { en: 'Caidie Bay Seaside B&B — Huandao Road',                    zh: '东山彩蝶湾景区特色民宿（环岛路分店）' },        coordinates: [117.5075, 23.7062] },
  { id: 'gansu-baiyin',          name: { en: 'Longshan Cliff Capsule Inn — Yellow River Cloud Town',     zh: '甘肃白银龙山民宿·黄河云客小镇' },              coordinates: [104.1369, 36.544] },
  { id: 'gansu-hezheng',         name: { en: 'Xingyu Yunduan Alpine Eco Resort',                         zh: '甘肃和政星语云端' },                           coordinates: [103.3513, 35.439] },
  { id: 'guangdong-foshan',      name: { en: 'Jianjiá Cangcang Wetland Glamping — Yundonghai',           zh: '佛山云东海蒹葭苍苍露营地' },                    coordinates: [112.894, 23.123] },
  { id: 'guangdong-heyuan',      name: { en: 'Wanlv Lake Lèqīng Valley Glamping',                        zh: '广东河源万绿湖心乐青谷' },                      coordinates: [114.7443, 23.9875] },
  { id: 'guangdong-huizhou',     name: { en: 'HelloSpace Holiday Planet — Xunliao Bay',                  zh: '惠州巽寮湾假日星球' },                          coordinates: [114.836, 22.792] },
  { id: 'guangdong-zhaoqing',    name: { en: 'Liujiaoquan Forest Health Resort',                         zh: '广东肇庆六角泉森林康养基地' },                  coordinates: [111.4858, 23.4361] },
  { id: 'guangdong-zhuhai',      name: { en: 'Linhai Starry Sea-View Inn — Feisha Beach',                zh: '珠海临海·星空海景美宿（飞沙滩店）' },           coordinates: [113.308, 21.958] },
  { id: 'guangxi-hezhou',        name: { en: 'Quemingchun Tea Garden Capsule Inn',                       zh: '广西贺州鹊鸣春太空舱民宿' },                    coordinates: [110.8127, 24.1749] },
  { id: 'guangxi-huangyao',      name: { en: 'Leyun Farmstead — Huangyao',                               zh: '广西黄姚乐耘庄园' },                            coordinates: [110.9267, 24.1055] },
  { id: 'guizhou-huaxi',         name: { en: 'Wanxia Xingsu Star-Camp — Huaxi Gaopo',                    zh: '贵州花溪晚霞星宿营地' },                        coordinates: [106.748, 26.302] },
  { id: 'hainan-qionghai',       name: { en: 'Wusuoguizhi Xiyu Coastal Inn',                             zh: '海南琼海无所归止汐语民宿' },                    coordinates: [110.5744, 19.2539] },
  { id: 'hebei-zhangbei',        name: { en: 'Wuse Tianlu Tent Camp — Zhangbei Grassland',               zh: '河北张家口五色天路帐篷营地' },                  coordinates: [115.06, 41.16] },
  { id: 'heilongjiang-fuyuan',   name: { en: "Shell Beach Camp — China's Easternmost Point",             zh: '黑龙江东极岛贝壳沙滩营地' },                    coordinates: [134.3064, 48.3648] },
  { id: 'hubei-wuhan',           name: { en: 'Planet Capsule Inn — Mulan Qingliangzhai',                 zh: '武汉清凉寨树影行星太空舱民宿' },                coordinates: [114.497, 31.078] },
  { id: 'qinghai-tongbao',       name: { en: 'Tongbao Mountain Lake-View Glamping',                      zh: '青海湖同宝山登山观湖特色野奢露营民宿' },         coordinates: [100.6167, 37.0219] },
  { id: 'qinghai-qilian',        name: { en: 'Tuomao Tribe Eco Camp — Qilian',                           zh: '青海祁连托茂部落·生态营地' },                   coordinates: [100.2428, 38.1775] },
  { id: 'shanxi-dayu',           name: { en: "Dayu's Ford Space Capsule Bay — Yellow River",             zh: '山西西建大禹渡太空舱休闲度假湾' },              coordinates: [110.6794, 34.7386] },
  { id: 'shanxi-yunqiu',         name: { en: 'Qingye HOME Hotel — Yunqiu Mountain',                      zh: '山西云丘山轻野·HOME酒店' },                     coordinates: [111.02, 35.74] },
  { id: 'sichuan-chengdu',       name: { en: 'Panda Forest CAMP',                                        zh: '四川成都熊猫森林' },                            coordinates: [103.930, 31.100] },
  { id: 'sichuan-jiaoding',      name: { en: 'Elk Life Camp — Jiaoding Mountain',                        zh: '四川轿顶山麋鹿生活营' },                        coordinates: [102.5391, 29.3732] },
  { id: 'sichuan-suining',       name: { en: 'Yanhuoli Tent Camp — Suining',                             zh: '四川遂宁烟火里帐篷营地' },                      coordinates: [105.5926, 30.5332] },
  { id: 'taiwan-daxueshan',      name: { en: 'Daxueshan Mountain Camp',                                  zh: '台湾惠来大雪山营地' },                          coordinates: [121.0, 24.26] },
  { id: 'tibet-jiala',           name: { en: 'Jiala Peach Blossom Snow Peak Hot Spring Inn',             zh: '西藏加拉桃源雪峰温泉民宿' },                    coordinates: [95.0, 29.6] },
  { id: 'xinjiang-yili',         name: { en: 'Black Bee Manor Eco Hotel — Tangbula Grassland',           zh: '新疆伊犁黑蜂庄园生态酒店' },                    coordinates: [83.567, 43.624] },
  { id: 'yunnan-mosuo',          name: { en: 'Bazhu Springtime Mosuo Home',                              zh: '云南八珠在春天摩梭家园' },                      coordinates: [100.8353, 27.7183] },
  { id: 'yunnan-yuxi',           name: { en: 'Yingyue Tan Dream Camp Hotel',                             zh: '云南玉溪映月潭圆梦营酒店' },                    coordinates: [102.5491, 24.3537] },
  { id: 'wuhai-desert',          name: { en: 'Wuhai Desert Mohai Shanjing Camp',                         zh: '乌海漠海山境露营地' },                          coordinates: [106.7, 39.5] },
]

// VESSEL HQ super-factory marker — drawn separately on top of all showcase
// pins. Carries the location strings inline because the HQ tooltip popup
// shows name + address; no need to pull the full HQ_PROJECT entry from
// showcaseProjects.ts to render the hover.
export const HQ_MARKER = {
  id: 'vessel-hq',
  name: { en: 'VESSEL HQ & Smart Factory', zh: 'VESSEL 微宿 · 超级工厂' },
  location: {
    en: '253 Xingye North Road, Shishan Town, Nanhai District, Foshan, Guangdong',
    zh: '广东省佛山市南海区狮山镇兴业北路253号',
  },
  coordinates: [113.0021, 23.1247] as [number, number],
}
