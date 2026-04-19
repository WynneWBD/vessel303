export type ProductSlug = 'e7' | 'e6' | 'e3' | 'v9' | 'v5' | 's5' | 'e7-gen5';

export interface ProductFeature { title: string; desc: string }
export interface ProductSpace { name: string; desc: string }
export interface ProductMaterial { title: string; spec: string }

export interface ProductData {
  slug: ProductSlug;
  model: string;
  gen: string;
  series: 'Gen6' | 'Gen5';
  tag: string;
  size: string;
  tagline: string;
  tagline2: string;
  dimensions: { length: number; width: number; height: number };
  floorArea: string;
  power: string;
  weight: string;
  capacity: string;
  zones: string[];
  designPhilosophy: string;
  features: ProductFeature[];
  spaces: ProductSpace[];
  materials: ProductMaterial[];
  image: string;
  badge: string;
  accentColor: string;
  /** Price shown to logged-in users */
  priceDisplay: string;
  /** Price teaser shown to guests */
  priceHidden: string;
  /** Numeric area for filtering */
  area: number;
  /** Product generation number */
  generation: 5 | 6;
  /** Product type for filtering */
  productType: 'compact' | 'standard' | 'luxury';
  /** Badge in English */
  badge_en: string;
  /** Tags */
  tags_cn: string[];
  tags_en: string[];
  /** 3 key features */
  features_cn: string[];
  features_en: string[];
  /** Price range strings */
  price_range_cn: string;
  price_range_en: string;
  prev?: ProductSlug;
  next?: ProductSlug;
}

export const products: ProductData[] = [
  {
    slug: 'e7',
    model: 'E7',
    gen: 'Gen6',
    series: 'Gen6',
    tag: '旗舰款',
    size: '38.8㎡',
    tagline: '38.8㎡ 新旗舰大空间',
    tagline2: '全能型旅居新旗舰，经典范式的自我超越',
    dimensions: { length: 11400, width: 3400, height: 3400 },
    floorArea: '38.8㎡',
    power: '16/24kW',
    weight: '约9吨',
    capacity: '2-4人',
    zones: ['入户玄关', '起居空间', '户外露台', '主卧室', '三分离卫浴'],
    designPhilosophy:
      '以飞船轮廓为灵感，流线外观传递速度与未来感。飞翼式门檐在入口处形成独特的遮阳廊道，红色轮廓灯与霓虹侧灯在夜间构筑科技感光影场景。',
    features: [
      {
        title: '流线型轮廓',
        desc: '如飞船般的流线外观，飞翼式门檐提供遮阳避雨功能，视觉冲击力十足。',
      },
      {
        title: '灯光系统',
        desc: '红色轮廓灯 + 霓虹侧灯 + 氛围灯带，夜间营造强烈科技感视觉体验。',
      },
      {
        title: '三分离卫浴',
        desc: '日式三分离设计，如厕 / 沐浴 / 洗漱独立分区，互不干扰，高效便捷。',
      },
      {
        title: 'VIIE Gen6 智控',
        desc: '第六代 VIIE 智能控制系统，支持远程管理全屋设备，语音 / App 双控。',
      },
      {
        title: '1.8m 弧形景观床',
        desc: '1.8m 大床正对弧形全景玻璃，躺卧即可欣赏户外景致。',
      },
      {
        title: '模块化家具',
        desc: '轻型可移动模块家具，沙发组件可灵活重组，适应不同社交场景。',
      },
    ],
    spaces: [
      { name: '入户玄关', desc: '独立玄关区域，储物挂衣一体，进出整洁有序。' },
      { name: '起居空间', desc: '宽敞客厅配弧形全景玻璃，室内外景色无缝衔接。' },
      { name: '户外露台', desc: '延伸露台与客厅相连，户外用餐、观星两相宜。' },
      { name: '主卧室', desc: '1.8m 大床 + 内嵌式储物 + 电动遮帘，私密舒适。' },
      { name: '三分离卫浴', desc: '日式三分离设计，如厕 / 淋浴 / 洗漱各自独立。' },
    ],
    materials: [
      { title: '高强度热镀锌钢骨架', spec: '壁厚4.75mm，抗压承重性能优异' },
      { title: '氟碳喷涂铝板', spec: '43μm 涂层，耐腐蚀、不褪色' },
      { title: '断桥隔热门窗', spec: '35mm+ 断桥宽度，隔热隔噪双效' },
      { title: 'LOW-E 三玻两腔', spec: '18mm 氩气腔，紫外线隔绝率42.39%' },
      { title: '硬质聚氨酯喷涂', spec: '导热系数0.0294W/mK，高效隔热' },
    ],
    image: '/images/e7-gen6.jpg',
    badge: '畅销 No.1',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 488,000 起',
    priceHidden: 'XX万起',
    area: 38.8, generation: 6, productType: 'luxury',
    badge_en: 'New Flagship',
    tags_cn: ['大空间', '智能'], tags_en: ['Spacious', 'Smart'],
    features_cn: ['飞翼式门檐', '开放式社交空间', '多类型收纳柜'],
    features_en: ['Wing-type door canopy', 'Open social space', 'Multi-type storage cabinets'],
    price_range_cn: '¥ 488,000 起', price_range_en: 'From ¥488,000',
    next: 'e6',
  },
  {
    slug: 'e6',
    model: 'E6',
    gen: 'Gen6',
    series: 'Gen6',
    tag: '明星款',
    size: '29.6㎡',
    tagline: '29.6㎡ 明星第六代旅居版',
    tagline2: '传承经典，焕新演绎',
    dimensions: { length: 8700, width: 3400, height: 3400 },
    floorArea: '29.6㎡',
    power: '13/20kW',
    weight: '约7吨',
    capacity: '2-4人',
    zones: ['多功能起居室', '淋浴间', '卫生间', '多功能吧台', '卧室'],
    designPhilosophy:
      '对称、和谐、张弛有度，探索秩序之美。微双曲面弧线为基础，灰白雅境配色呈现极简美学，第六代锁扣屋顶系统实现物理级防水。',
    features: [
      {
        title: '微双曲面',
        desc: '弧线为基础的曲面设计，视觉柔和，区别于方正硬朗的传统建筑。',
      },
      {
        title: '灰白雅境',
        desc: '灰白配色极简美学，空间视觉更开阔，百搭各类自然景观背景。',
      },
      {
        title: '灵动之光',
        desc: '无缝 LED 灯带制造立体光效，昼夜两种风格，各具迷人气质。',
      },
      {
        title: '第六代锁扣屋顶',
        desc: '物理防水锁扣系统，不依赖胶水密封，长期稳定防水不失效。',
      },
      {
        title: '180° 全景窗',
        desc: '客厅 180° 环绕景观窗，视野宽阔，将户外风景纳入室内。',
      },
      {
        title: '一车双运',
        desc: '8700mm 车身长度支持一辆平板车同时运输两台，降低物流成本。',
      },
    ],
    spaces: [
      { name: '多功能起居室', desc: '180° 全景窗 + 多功能吧台，休闲社交两不误。' },
      { name: '主卧室', desc: '270° 落地全景窗 + 电动遮帘，沉浸式景观体验。' },
      { name: '亲子主题房', desc: '可配置双 1.2m 床，适合亲子家庭出行。' },
      { name: '淋浴间', desc: '独立淋浴空间，干湿分离，使用舒适。' },
      { name: '多功能吧台', desc: '吧台与起居区相连，可用于早餐、办公、休闲。' },
    ],
    materials: [
      { title: '高强度热镀锌钢骨架', spec: '壁厚4.75mm，结构强度高' },
      { title: '氟碳喷涂铝板', spec: '43μm 耐候涂层' },
      { title: '断桥隔热门窗', spec: '高热工性能，隔热隔噪' },
      { title: 'LOW-E 中空玻璃', spec: '低辐射镀膜，节能高效' },
      { title: '无甲醛板材', spec: 'E0 级甲醛标准，健康环保' },
    ],
    image: '/images/e6-gen6.jpg',
    badge: '全球热销',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 388,000 起',
    priceHidden: 'XX万起',
    area: 29.6, generation: 6, productType: 'standard',
    badge_en: 'Star Model',
    tags_cn: ['旅居版', '快速部署'], tags_en: ['Glamping', 'Fast Deploy'],
    features_cn: ['270°环幕视野', '四大功能分区', '灵活切换大床/双床'],
    features_en: ['270° panoramic view', '4 functional zones', 'King/twin flexible config'],
    price_range_cn: '¥ 388,000 起', price_range_en: 'From ¥388,000',
    prev: 'e7',
    next: 'e3',
  },
  {
    slug: 'e3',
    model: 'E3',
    gen: 'Gen6',
    series: 'Gen6',
    tag: 'mini 版',
    size: '19㎡',
    tagline: '19㎡ 至臻第六代 mini 版',
    tagline2: '够宽敞，也够满足',
    dimensions: { length: 5600, width: 3400, height: 3400 },
    floorArea: '19㎡',
    power: '10/15kW',
    weight: '约5吨',
    capacity: '1-2人',
    zones: ['卫生间', '淋浴间', '开角式衣柜', '一体式橱柜', '卧室'],
    designPhilosophy:
      '以游艇立面美学为设计语言，无痕光域灯带环绕全身，半圆弧形玻璃窗以紧凑尺寸实现 180° 无遮挡景观视野。',
    features: [
      {
        title: '游艇式立面',
        desc: '流线型游艇美学外观，精致小巧却气场十足。',
      },
      {
        title: '无痕光域',
        desc: '无痕灯带环绕全身，昼日简约夜间绚丽，灯光即是设计。',
      },
      {
        title: '180° 弧形景观窗',
        desc: '半圆弧形全景玻璃，19㎡ 小空间也能享受大视野。',
      },
      {
        title: '智能电动遮帘',
        desc: '一键电动遮帘，轻松切换私密模式与观景模式。',
      },
    ],
    spaces: [
      { name: '卧室', desc: '2m 大床 + 内嵌式气候调节头枕系统。' },
      { name: '卫生间', desc: '集成式卫浴，紧凑不失功能。' },
      { name: '开角式衣柜', desc: '转角空间充分利用，收纳充足。' },
      { name: '一体式橱柜', desc: '迷你厨房功能，满足基础饮食需求。' },
    ],
    materials: [
      { title: '热镀锌钢结构', spec: '轻量化设计，5吨净重' },
      { title: '氟碳铝板', spec: '耐腐蚀长效涂层' },
      { title: '弧形钢化玻璃', spec: '定制半圆弧形，安全耐用' },
      { title: 'SPC 防水地板', spec: '防水防潮，耐磨易清洁' },
    ],
    image: '/images/e6-gen6.jpg',
    badge: '入门推荐',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 228,000 起',
    priceHidden: 'XX万起',
    area: 19, generation: 6, productType: 'compact',
    badge_en: 'Entry Choice',
    tags_cn: ['迷你', '经济'], tags_en: ['Mini', 'Economical'],
    features_cn: ['内嵌式门廊', '270°环幕视野', '一车可运两台'],
    features_en: ['Integrated hallway', '270° panoramic view', '2 units per truck'],
    price_range_cn: '¥ 228,000 起', price_range_en: 'From ¥228,000',
    prev: 'e6',
    next: 'v9',
  },
  {
    slug: 'v9',
    model: 'V9',
    gen: 'Gen6',
    series: 'Gen6',
    tag: '家居款',
    size: '38㎡',
    tagline: '38㎡ 旗舰第六代家居版',
    tagline2: '遵循「钻石切割」的设计理念',
    dimensions: { length: 11400, width: 3400, height: 3400 },
    floorArea: '38㎡',
    power: '16/24kW',
    weight: '约9吨',
    capacity: '2-4人',
    zones: ['卫生间', '淋浴间', '厨房', '餐厅', '起居空间', '主卧'],
    designPhilosophy:
      '遵循「钻石切割」的设计理念，塑造一种类似于「菱境」般的外观状态。弧线与折线的交织，呈现刚柔并济的建筑美学。',
    features: [
      {
        title: '钻石切割设计',
        desc: '菱形「钻石切割」外观，弧线与折线交织，刚柔并济的建筑美学。',
      },
      {
        title: '17.0㎡ 全景采光',
        desc: '17.0㎡ 超大采光面积，42.39% 紫外线隔绝率，舒适无惧暴晒。',
      },
      {
        title: '2.4m 超宽沙发',
        desc: '2.4m 宽躺沙配置，宽敞起居区彰显生活品质。',
      },
      {
        title: '岛台一体厨房',
        desc: '2.3m 延伸厨柜 + 四人位岛台餐桌，烹饪与用餐一体化。',
      },
      {
        title: '五大结构主材',
        desc: '高强钢骨架 + 氟碳铝板 + 断桥门窗 + LOW-E 三玻 + 聚氨酯喷涂。',
      },
      {
        title: 'AI 语音智控',
        desc: 'AI 语音控制灯光、窗帘、空调，一句话切换日夜/观景模式。',
      },
    ],
    spaces: [
      { name: '起居空间', desc: '2.4m 宽躺沙 + 全景玻璃，客厅即是观景台。' },
      { name: '岛台厨餐一体', desc: '2.3m 延伸厨柜 + 四人岛台，生活化设计。' },
      { name: '主卧', desc: '全包覆衣柜 + 内置梳妆台，功能齐全。' },
      { name: '卫浴空间', desc: '干湿分离 + 浴缸选配，旅居品质不妥协。' },
    ],
    materials: [
      { title: '高强热镀锌钢骨架', spec: '壁厚4.75mm，强度一流' },
      { title: '氟碳喷涂铝板', spec: '43μm，耐候20年+' },
      { title: '断桥隔热门窗', spec: '35mm+ 断桥，优越热工性能' },
      { title: 'LOW-E 三玻两腔', spec: '18mm 氩气腔，隔热隔噪' },
      { title: '硬质聚氨酯喷涂', spec: '导热系数0.0294W/mK' },
    ],
    image: '/images/v9-gen6.jpg',
    badge: '长居推荐',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 458,000 起',
    priceHidden: 'XX万起',
    area: 38, generation: 6, productType: 'luxury',
    badge_en: 'Long-stay Choice',
    tags_cn: ['家居版', '旗舰'], tags_en: ['Residential', 'Flagship'],
    features_cn: ['17㎡落地景观窗', '180°全景玻璃', 'VIIE智能系统'],
    features_en: ['17㎡ floor-to-ceiling windows', '180° panoramic glass', 'VIIE smart system'],
    price_range_cn: '¥ 458,000 起', price_range_en: 'From ¥458,000',
    prev: 'e3',
    next: 'v5',
  },
  {
    slug: 'v5',
    model: 'V5',
    gen: 'Gen5',
    series: 'Gen5',
    tag: '全景款',
    size: '24.8㎡',
    tagline: '超广角视野，融入自然画卷',
    tagline2: '以全景视野连接自然，让旅居更纯粹',
    dimensions: { length: 7500, width: 3300, height: 3200 },
    floorArea: '24.8㎡',
    power: '12/15kW',
    weight: '约6吨',
    capacity: '1-2人',
    zones: ['卧室', '吧台', '卫生间', '玄关', '双人床区'],
    designPhilosophy:
      '以超广角全景玻璃为核心，将自然景色充分引入室内。轻量化 6 吨结构支持快速运输部署，是打造景观度假营地的理想单元。',
    features: [
      {
        title: '超广角全景',
        desc: '超大面积观景玻璃，将山海林野全景纳入室内视野。',
      },
      {
        title: '轻量化设计',
        desc: '6 吨净重，可通过普通平板车运输，快速部署。',
      },
      {
        title: '精品吧台',
        desc: '内置精品吧台，轻松调制饮品，度假氛围满分。',
      },
      {
        title: '双人床配置',
        desc: '舒适双人床区，两人度假的理想选择。',
      },
    ],
    spaces: [
      { name: '全景起居区', desc: '超大景观玻璃，室内外无界连通。' },
      { name: '精品吧台', desc: '内嵌式吧台，休闲度假必备。' },
      { name: '双人卧室', desc: '舒适双人床 + 收纳空间。' },
      { name: '卫生间', desc: '集成卫浴，干净实用。' },
    ],
    materials: [
      { title: '热镀锌钢结构', spec: '轻量化6吨' },
      { title: '大面积观景玻璃', spec: '超广角景观窗' },
      { title: '氟碳铝板', spec: '耐候涂层' },
      { title: 'SPC 防水地板', spec: '防水耐磨' },
    ],
    image: '/images/v9-gen6.jpg',
    badge: '两人度假',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 288,000 起',
    priceHidden: 'XX万起',
    area: 24.8, generation: 5, productType: 'compact',
    badge_en: 'Couples Retreat',
    tags_cn: ['全景', '轻量'], tags_en: ['Panoramic', 'Lightweight'],
    features_cn: ['超广角全景玻璃', '精品内嵌吧台', '6吨轻量化设计'],
    features_en: ['Ultra-wide panoramic glass', 'Built-in premium bar', '6-ton lightweight design'],
    price_range_cn: '¥ 288,000 起', price_range_en: 'From ¥288,000',
    prev: 'v9',
    next: 's5',
  },
  {
    slug: 's5',
    model: 'S5',
    gen: 'Gen5',
    series: 'Gen5',
    tag: '天光款',
    size: '29.6㎡',
    tagline: '超越空间感，尽收天光云景',
    tagline2: '天光倾泻，云景入怀',
    dimensions: { length: 8700, width: 3400, height: 3400 },
    floorArea: '29.6㎡',
    power: '13/20kW',
    weight: '约7吨',
    capacity: '2-4人',
    zones: ['卫生间', '淋浴间', '玄关', '起居空间', '卧室'],
    designPhilosophy:
      '超越空间感，尽收天光云景。独特的天窗采光系统将自然光线垂直引入室内，随时间变化的光影成为空间独特的装饰。',
    features: [
      {
        title: '天光采光系统',
        desc: '顶部天窗设计，将天空与云景引入室内，随日照变化呈现不同光影。',
      },
      {
        title: '多面大窗视野',
        desc: '多方向大面积玻璃设计，多方位全面观景体验。',
      },
      {
        title: '精品卫浴',
        desc: '独立卫浴区，干湿分离设计，使用舒适。',
      },
      {
        title: '灵活布局',
        desc: '可根据项目需求定制室内布局，满足不同使用场景。',
      },
    ],
    spaces: [
      { name: '天光起居区', desc: '天窗 + 侧窗双重采光，光线充沛。' },
      { name: '主卧室', desc: '景观卧室，与自然共眠。' },
      { name: '玄关', desc: '独立入户玄关，整洁有序。' },
      { name: '卫浴间', desc: '干湿分离，舒适使用。' },
    ],
    materials: [
      { title: '热镀锌钢结构', spec: '结构稳固' },
      { title: '天窗采光系统', spec: '定制顶部天窗' },
      { title: '氟碳铝板', spec: '耐候涂层' },
      { title: 'LOW-E 玻璃', spec: '节能隔热' },
    ],
    image: '/images/e6-gen6.jpg',
    badge: '景观推荐',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 328,000 起',
    priceHidden: 'XX万起',
    area: 28, generation: 5, productType: 'standard',
    badge_en: 'Classic Legend',
    tags_cn: ['科幻风格', '星空天窗'], tags_en: ['Futuristic', 'Starry skylight'],
    features_cn: ['3.3米全景阳台', '1.68㎡星空天窗', '飞船造型'],
    features_en: ['3.3m panoramic balcony', '1.68㎡ starry skylight', 'Spaceship silhouette'],
    price_range_cn: '¥ 328,000 起', price_range_en: 'From ¥328,000',
    prev: 'v5',
    next: 'e7-gen5',
  },
  {
    slug: 'e7-gen5' as ProductSlug,
    model: 'E7',
    gen: 'Gen5',
    series: 'Gen5',
    tag: '豪华经典',
    size: '38㎡',
    tagline: '38㎡ 豪华第五代经典',
    tagline2: '礼宾级旅居，不过时的经典',
    dimensions: { length: 11400, width: 3400, height: 3400 },
    floorArea: '38㎡',
    power: '16/24kW',
    weight: '约9吨',
    capacity: '2-4人',
    zones: ['入户玄关', '270°环幕客厅', '主卧室', '礼宾空间', '卫浴间'],
    designPhilosophy: '以礼宾级行政空间为核心设计语言，270°环幕客厅提供全方位景观体验，全屋电动窗帘与智能系统实现高品质旅居享受。',
    features: [
      { title: '270°环幕客厅', desc: '270°全景环绕设计，将户外风景充分引入室内。' },
      { title: '礼宾级空间', desc: '行政礼宾级内饰，匹配高端度假营地定位。' },
      { title: '全屋电动窗帘', desc: '全屋电动遮帘，一键调节私密与观景模式。' },
      { title: '第五代经典设计', desc: '历经市场考验的成熟设计，广受全球采购商认可。' },
    ],
    spaces: [
      { name: '270°环幕客厅', desc: '全景环绕玻璃，开阔视野无遮挡。' },
      { name: '礼宾行政空间', desc: '高规格内饰，彰显品位。' },
      { name: '主卧室', desc: '舒适主卧，电动遮帘系统。' },
      { name: '卫浴间', desc: '独立卫浴，干湿分离。' },
    ],
    materials: [
      { title: '热镀锌钢结构', spec: '壁厚4.75mm' },
      { title: '氟碳铝板', spec: '43μm耐候涂层' },
      { title: '断桥隔热门窗', spec: '优越热工性能' },
      { title: 'LOW-E 玻璃', spec: '节能隔热' },
    ],
    image: '/images/e7-gen6.jpg',
    badge: '豪华经典',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 368,000 起',
    priceHidden: 'XX万起',
    area: 38,
    generation: 5 as const,
    productType: 'luxury' as const,
    badge_en: 'Luxury Classic',
    tags_cn: ['舒适', '行业开创者'],
    tags_en: ['Comfort', 'Industry Pioneer'],
    features_cn: ['270°环幕客厅', '礼宾级行政空间', '全屋电动窗帘'],
    features_en: ['270° encircling living room', 'Concierge-level space', 'Full electric curtains'],
    price_range_cn: '¥ 368,000 起',
    price_range_en: 'From ¥368,000',
    prev: 's5',
  },
];

export function getProduct(slug: string): ProductData | undefined {
  return products.find((p) => p.slug === slug);
}

export const gen6Products = products.filter((p) => p.series === 'Gen6');
export const gen5Products = products.filter((p) => p.series === 'Gen5');

// ──────────────────────────────────────────────
// Catalog products – full variant listing page
// ──────────────────────────────────────────────

export type ProductSeriesCode = 'E3' | 'E5' | 'E6' | 'E7' | 'V3' | 'V5' | 'V7' | 'V9' | 'S5';

export interface CatalogProduct {
  id: string;
  productSeries: ProductSeriesCode;
  name_cn: string;
  name_en: string;
  gen: string;
  size: string;
  area: number;
  generation: 5 | 6;
  productType: 'compact' | 'standard' | 'luxury';
  badge_cn: string;
  badge_en: string;
  tags_cn: string[];
  tags_en: string[];
  features_cn: string[];
  features_en: string[];
  image: string;
  isCustom: boolean;
  /** If set, "查看详情" links to /products/{detailSlug}; otherwise links to /contact */
  detailSlug?: string;
}

export const catalogProducts: CatalogProduct[] = [
  // ── E3 ──────────────────────────────────────
  { id: 'e3-gen6-standard', productSeries: 'E3', name_cn: 'E3 Gen6 · 国标版', name_en: 'E3 Gen6 · China Standard', gen: 'Gen6', size: '19㎡', area: 19, generation: 6, productType: 'compact', badge_cn: '入门推荐', badge_en: 'Entry Pick', tags_cn: ['迷你', '经济', '双台运输'], tags_en: ['Mini', 'Economical', '2-per-truck'], features_cn: ['内嵌式入户门廊', '270°环幕视野', '一车可运两台'], features_en: ['Integrated entrance hallway', '270° panoramic view', '2 units per 40ft container'], image: '/images/products/E3-Gen6_render-01.jpg', isCustom: false, detailSlug: 'e3' },
  { id: 'e3-custom-airport', productSeries: 'E3', name_cn: 'E3 Gen6 · 机场茶室版', name_en: 'E3 Gen6 · Airport Lounge', gen: 'Gen6', size: '19㎡', area: 19, generation: 6, productType: 'compact', badge_cn: '定制案例', badge_en: 'Custom Case', tags_cn: ['商业定制', '机场配套'], tags_en: ['Commercial Custom', 'Airport'], features_cn: ['商业场景定制内装', '快速模块化部署', '符合机场运营标准'], features_en: ['Commercial interior customization', 'Fast modular deployment', 'Airport operation compliant'], image: '/images/products/custom_E3-Gen6_airport-tearoom_01.jpg', isCustom: true },
  { id: 'e3-custom-germany', productSeries: 'E3', name_cn: 'E3 Gen6 · 德国版', name_en: 'E3 Gen6 · Germany Edition', gen: 'Gen6', size: '19㎡', area: 19, generation: 6, productType: 'compact', badge_cn: '海外定制', badge_en: 'Overseas Custom', tags_cn: ['欧盟认证', '海外定制'], tags_en: ['EU Certified', 'Overseas'], features_cn: ['符合欧盟建筑法规', '定制外观结构', '海运整体交付'], features_en: ['EU building code compliant', 'Custom exterior', 'Integral shipping'], image: '/images/products/custom_E3-Gen6_Germany_01.jpg', isCustom: true },
  // ── E5 ──────────────────────────────────────
  { id: 'e5-gen5-standard', productSeries: 'E5', name_cn: 'E5 Gen5 · 国标版', name_en: 'E5 Gen5 · China Standard', gen: 'Gen5', size: '24.8㎡', area: 24.8, generation: 5, productType: 'compact', badge_cn: '经典款', badge_en: 'Classic', tags_cn: ['紧凑', '经典'], tags_en: ['Compact', 'Classic'], features_cn: ['经典紧凑设计', '标准国内配置', '快速交付'], features_en: ['Classic compact design', 'Standard domestic config', 'Fast delivery'], image: '/images/products/E5-Gen5_render-01.jpg', isCustom: false },
  { id: 'e5-custom-uav', productSeries: 'E5', name_cn: 'E5 Gen5 · 无人机控制室–广州版', name_en: 'E5 Gen5 · UAV Control Room', gen: 'Gen5', size: '24.8㎡', area: 24.8, generation: 5, productType: 'compact', badge_cn: '特种定制', badge_en: 'Special Custom', tags_cn: ['特种用途', '定制内装'], tags_en: ['Special Purpose', 'Custom Interior'], features_cn: ['无人机控制室定制内装', '设备机柜集成设计', '商业运营场景'], features_en: ['UAV control room interior', 'Equipment rack integration', 'Commercial operation'], image: '/images/products/custom_E5-Gen6_drone-room-Guangzhou_01.jpg', isCustom: true },
  // ── E6 ──────────────────────────────────────
  { id: 'e6-gen6-standard', productSeries: 'E6', name_cn: 'E6 Gen6 · 国标版', name_en: 'E6 Gen6 · China Standard', gen: 'Gen6', size: '29.6㎡', area: 29.6, generation: 6, productType: 'standard', badge_cn: '明星款', badge_en: 'Star Model', tags_cn: ['旅居版', '快速部署'], tags_en: ['Glamping', 'Fast Deploy'], features_cn: ['270°环幕视野', '四大功能分区', '灵活切换大床/双床'], features_en: ['270° panoramic view', '4 functional zones', 'King/twin flexible config'], image: '/images/products/E6-Gen6_render-01.jpg', isCustom: false, detailSlug: 'e6' },
  // ── E7 ──────────────────────────────────────
  { id: 'e7-gen6-flagship', productSeries: 'E7', name_cn: 'E7 Gen6 · 样板间旗舰版', name_en: 'E7 Gen6 · Flagship Showroom', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '新旗舰', badge_en: 'New Flagship', tags_cn: ['大空间', '智能'], tags_en: ['Spacious', 'Smart'], features_cn: ['飞翼式门檐', '开放式社交空间', 'VIIE智能系统'], features_en: ['Wing-type door canopy', 'Open social space', 'VIIE smart system'], image: '/images/products/E7-Gen6_render-01.jpg', isCustom: false, detailSlug: 'e7' },
  { id: 'e7-gen5-standard', productSeries: 'E7', name_cn: 'E7 Gen5 · 国标版', name_en: 'E7 Gen5 · China Standard', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '经典豪华', badge_en: 'Classic Luxury', tags_cn: ['行业开创者', '经典'], tags_en: ['Industry Pioneer', 'Classic'], features_cn: ['270°环幕客厅', '礼宾级行政空间', '全屋电动窗帘'], features_en: ['270° encircling living room', 'Concierge-level space', 'Full electric curtains'], image: '/images/products/E7-Gen5_render-01.jpg', isCustom: false, detailSlug: 'e7-gen5' },
  { id: 'e7-custom-huawei', productSeries: 'E7', name_cn: 'E7 Gen5 · 鸿蒙展厅–华为版', name_en: 'E7 Gen5 · HarmonyOS Showroom', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '品牌合作', badge_en: 'Brand Collab', tags_cn: ['华为合作', '智能展厅'], tags_en: ['Huawei Collab', 'Smart Showroom'], features_cn: ['华为鸿蒙全屋智能集成', '品牌展厅定制内装', '多媒体展示系统'], features_en: ['Huawei HarmonyOS integration', 'Brand showroom interior', 'Multimedia display system'], image: '/images/products/custom_E7-Gen5_harmonyos-Huawei_01.jpg', isCustom: true },
  { id: 'e7-custom-taiwan', productSeries: 'E7', name_cn: 'E7 Gen5 · 三拼双层–台湾版', name_en: 'E7 Gen5 · Triple-Module Double-Storey Taiwan', gen: 'Gen5', size: '114㎡', area: 114, generation: 5, productType: 'luxury', badge_cn: '组合定制', badge_en: 'Multi-Module', tags_cn: ['三拼', '双层', '台湾'], tags_en: ['Triple-module', 'Double-storey', 'Taiwan'], features_cn: ['三舱拼接超大空间', '双层螺旋楼梯设计', '台湾建筑规范适配'], features_en: ['Triple-module mega space', 'Double-storey spiral staircase', 'Taiwan code compliant'], image: '/images/products/custom_E7-Gen5_triple-spiral-Taiwan_01.jpg', isCustom: true },
  { id: 'e7-custom-usa', productSeries: 'E7', name_cn: 'E7 Gen5 · 封阳台双房–美国版', name_en: 'E7 Gen5 · Enclosed Balcony Twin Room USA', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '美国认证', badge_en: 'US Certified', tags_cn: ['美国认证', '封阳台'], tags_en: ['US Certified', 'Enclosed Balcony'], features_cn: ['符合美国IBC建筑规范', '封阳台双床房布局', 'UL认证电气系统'], features_en: ['US IBC building code compliant', 'Enclosed balcony twin layout', 'UL certified electrical'], image: '/images/products/custom_E7-Gen5_enclosed-balcony-USA-Michigan_01.jpg', isCustom: true },
  { id: 'e7-custom-mexico', productSeries: 'E7', name_cn: 'E7 Gen5 · 封阳台双房–墨西哥版', name_en: 'E7 Gen5 · Enclosed Balcony Twin Room Mexico', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '海外定制', badge_en: 'Overseas Custom', tags_cn: ['墨西哥', '封阳台'], tags_en: ['Mexico', 'Enclosed Balcony'], features_cn: ['适配墨西哥气候条件', '封阳台防晒设计', '完整海外售后支持'], features_en: ['Mexico climate adapted', 'Sun-shading enclosed balcony', 'Full overseas after-sales'], image: '/images/products/custom_E7-Gen5_enclosed-balcony-Mexico_01.jpg', isCustom: true },
  { id: 'e7-custom-russia', productSeries: 'E7', name_cn: 'E7 Gen5 · 带厨房–俄罗斯版', name_en: 'E7 Gen5 · With Kitchen Russia', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '极寒定制', badge_en: 'Arctic Custom', tags_cn: ['俄罗斯', '带厨房', '极寒'], tags_en: ['Russia', 'With Kitchen', 'Arctic'], features_cn: ['极寒气候保温升级', '集成厨房功能模块', '摩尔曼斯克落地案例'], features_en: ['Arctic climate insulation upgrade', 'Integrated kitchen module', 'Deployed in Murmansk'], image: '/images/products/custom_E7-Gen5_kitchen-Russia_01.jpg', isCustom: true },
  { id: 'e7-custom-brazil', productSeries: 'E7', name_cn: 'E7 Gen5 · 封阳台–巴西版', name_en: 'E7 Gen5 · Enclosed Balcony Brazil', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '海外定制', badge_en: 'Overseas Custom', tags_cn: ['巴西', '南美市场'], tags_en: ['Brazil', 'South America'], features_cn: ['适配南美热带气候', '封阳台防晒通风设计', '海运整体交付'], features_en: ['South American tropical climate', 'Ventilated enclosed balcony', 'Integral sea shipping'], image: '/images/products/custom_E7-Gen5_enclosed-balcony-Brazil_01.jpg', isCustom: true },
  { id: 'e7-custom-siberia', productSeries: 'E7', name_cn: 'E7 Gen5 · 水暖系统–西伯利亚版', name_en: 'E7 Gen5 · Hydronic Heating Siberia', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '极寒定制', badge_en: 'Arctic Custom', tags_cn: ['西伯利亚', '水暖系统'], tags_en: ['Siberia', 'Hydronic Heating'], features_cn: ['集成水暖供热系统', '西伯利亚极寒适配', '三层保温结构升级'], features_en: ['Integrated hydronic heating', 'Siberia extreme cold adapted', 'Triple-layer insulation upgrade'], image: '/images/products/custom_E7-Gen5_water-heating-Siberia_01.jpg', isCustom: true },
  { id: 'e7-custom-libya', productSeries: 'E7', name_cn: 'E7 Gen5 · 外观定制–利比亚版', name_en: 'E7 Gen5 · Custom Exterior Libya', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '海外定制', badge_en: 'Overseas Custom', tags_cn: ['利比亚', '外观定制'], tags_en: ['Libya', 'Custom Exterior'], features_cn: ['高温沙漠气候适配', '外观结构定制设计', '耐高温涂装材料'], features_en: ['Desert high-temp climate adapted', 'Custom exterior structure', 'High-temp resistant coating'], image: '/images/products/custom_E7-Gen5_custom-exterior-Libya_01.jpg', isCustom: true },
  { id: 'e7-custom-argentina', productSeries: 'E7', name_cn: 'E7 Gen5 · 海外定制–阿根廷版', name_en: 'E7 Gen5 · Overseas Custom Argentina', gen: 'Gen5', size: '38㎡', area: 38, generation: 5, productType: 'luxury', badge_cn: '海外定制', badge_en: 'Overseas Custom', tags_cn: ['阿根廷', '南美'], tags_en: ['Argentina', 'South America'], features_cn: ['适配阿根廷建筑规范', '定制外观与内装', '完整本地交付支持'], features_en: ['Argentina building code compliant', 'Custom exterior & interior', 'Full local delivery support'], image: '/images/products/custom_E7-Gen5_Argentina_01.jpg', isCustom: true },
  // ── V3 ──────────────────────────────────────
  { id: 'v3-gen5-standard', productSeries: 'V3', name_cn: 'V3 Gen5 · 国标版', name_en: 'V3 Gen5 · China Standard', gen: 'Gen5', size: '12.3㎡', area: 12.3, generation: 5, productType: 'compact', badge_cn: '经典紧凑', badge_en: 'Classic Compact', tags_cn: ['紧凑', '经典'], tags_en: ['Compact', 'Classic'], features_cn: ['经典V系设计语言', '标准国内配置', '快速部署交付'], features_en: ['Classic V-series design', 'Standard domestic config', 'Fast deployment'], image: '/images/products/V3-Gen5_render-01.jpg', isCustom: false },
  { id: 'v3-gen6-standard', productSeries: 'V3', name_cn: 'V3 Gen6 Pro · 满配版', name_en: 'V3 Gen6 Pro · Full Config', gen: 'Gen6', size: '14.6㎡', area: 14.6, generation: 6, productType: 'compact', badge_cn: '满配旗舰', badge_en: 'Full Config', tags_cn: ['Gen6升级', '满配'], tags_en: ['Gen6 Upgrade', 'Full Config'], features_cn: ['第六代全套升级', '满配智能系统', '底层设备架构'], features_en: ['Full Gen6 upgrade', 'Complete smart system', 'Underfloor mechanical level'], image: '/images/products/V3-Gen6_render-01.jpg', isCustom: false },
  { id: 'v3-custom-argentina', productSeries: 'V3', name_cn: 'V3 Gen5 · 灰色外观–阿根廷版', name_en: 'V3 Gen5 · Gray Exterior Argentina', gen: 'Gen5', size: '12.3㎡', area: 12.3, generation: 5, productType: 'compact', badge_cn: '海外定制', badge_en: 'Overseas Custom', tags_cn: ['阿根廷', '灰色外观'], tags_en: ['Argentina', 'Gray Exterior'], features_cn: ['灰色防腐蚀外观涂装', '防水门廊设计', '适配南美气候'], features_en: ['Gray corrosion-resistant coating', 'Waterproof canopy', 'South America climate'], image: '/images/products/custom_V3-Gen5_grey-exterior-Argentina_01.jpg', isCustom: true },
  // ── V5 ──────────────────────────────────────
  { id: 'v5-custom-taiwan', productSeries: 'V5', name_cn: 'V5 Gen5 · 双拼木纹–台湾版', name_en: 'V5 Gen5 · Double Wood Grain Taiwan', gen: 'Gen5', size: '24.8㎡', area: 24.8, generation: 5, productType: 'standard', badge_cn: '双拼定制', badge_en: 'Double Module', tags_cn: ['木纹外观', '双拼', '台湾'], tags_en: ['Wood Grain', 'Double Module', 'Taiwan'], features_cn: ['木纹氟碳喷涂外观', '双舱拼接大空间', '台湾建筑规范适配'], features_en: ['Wood grain fluorocarbon coating', 'Double-module space', 'Taiwan code compliant'], image: '/images/products/custom_V5-Gen5_woodgrain-double-Taiwan_01.jpg', isCustom: true, detailSlug: 'v5' },
  { id: 'v5-custom-sinopec', productSeries: 'V5', name_cn: 'V5 Gen6 · 污水处理–中石化版', name_en: 'V5 Gen6 · Sewage Treatment Sinopec', gen: 'Gen6', size: '24.8㎡', area: 24.8, generation: 6, productType: 'standard', badge_cn: '工业定制', badge_en: 'Industrial Custom', tags_cn: ['工业场景', '中石化'], tags_en: ['Industrial', 'Sinopec'], features_cn: ['集成污水处理系统', '工业级定制配置', '中石化项目案例'], features_en: ['Integrated sewage treatment', 'Industrial grade configuration', 'Sinopec project case'], image: '/images/products/custom_V5-Gen6_wastewater-Sinopec_01.jpg', isCustom: true },
  // ── V7 ──────────────────────────────────────
  { id: 'v7-custom-reception', productSeries: 'V7', name_cn: 'V7 Gen5 · 接待室版', name_en: 'V7 Gen5 · Reception Room', gen: 'Gen5', size: '30㎡', area: 30, generation: 5, productType: 'standard', badge_cn: '商务定制', badge_en: 'Business Custom', tags_cn: ['接待室', '商务场景'], tags_en: ['Reception', 'Business'], features_cn: ['商务接待室定制内装', '高端会客空间设计', '品牌形象定制外观'], features_en: ['Business reception interior', 'Premium meeting space', 'Brand identity exterior'], image: '/images/products/custom_V7-Gen5_reception_01.jpg', isCustom: true },
  { id: 'v7-custom-newzealand', productSeries: 'V7', name_cn: 'V7 Gen5 · 双拼–新西兰版', name_en: 'V7 Gen5 · Double Module New Zealand', gen: 'Gen5', size: '60㎡', area: 60, generation: 5, productType: 'standard', badge_cn: '双拼定制', badge_en: 'Double Module', tags_cn: ['新西兰', '双拼'], tags_en: ['New Zealand', 'Double Module'], features_cn: ['双舱拼接大空间', '新西兰建筑规范适配', '带厨房完整配置'], features_en: ['Double-module large space', 'NZ building code compliant', 'Full kitchen configuration'], image: '/images/products/custom_V7-Gen5_double-NewZealand_01.jpg', isCustom: true },
  { id: 'v7-custom-pakistan', productSeries: 'V7', name_cn: 'V7 Gen6 · 雾化玻璃–巴基斯坦版', name_en: 'V7 Gen6 · Smart Glass Pakistan', gen: 'Gen6', size: '35㎡', area: 35, generation: 6, productType: 'standard', badge_cn: '智能玻璃', badge_en: 'Smart Glass', tags_cn: ['巴基斯坦', '雾化玻璃'], tags_en: ['Pakistan', 'Smart Glass'], features_cn: ['电控雾化玻璃系统', '隐私与采光智能切换', '高温气候适配设计'], features_en: ['Electric smart glass system', 'Privacy/lighting smart switch', 'High-temp climate adapted'], image: '/images/products/custom_V7-Gen6_frosted-glass-Pakistan_01.jpg', isCustom: true },
  // ── V9 ──────────────────────────────────────
  { id: 'v9-gen6-standard', productSeries: 'V9', name_cn: 'V9 Gen6 · 国标旗舰版', name_en: 'V9 Gen6 · China Flagship', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '长居推荐', badge_en: 'Long-stay Pick', tags_cn: ['家居版', '旗舰'], tags_en: ['Residential', 'Flagship'], features_cn: ['17㎡落地景观窗', '180°全景玻璃', 'VIIE智能系统'], features_en: ['17㎡ floor-to-ceiling windows', '180° panoramic glass', 'VIIE smart system'], image: '/images/products/V9-Gen6_render-01.jpg', isCustom: false, detailSlug: 'v9-gen6' },
  { id: 'v9-gen5-standard', productSeries: 'V9', name_cn: 'V9 Gen5 · 国标版', name_en: 'V9 Gen5 · China Standard', gen: 'Gen5', size: '37.6㎡', area: 37.6, generation: 5, productType: 'luxury', badge_cn: '经典旗舰', badge_en: 'Classic Flagship', tags_cn: ['家居版', '经典'], tags_en: ['Residential', 'Classic'], features_cn: ['超大落地景观窗', '完整家居功能配置', '高端精装交付'], features_en: ['Large floor-to-ceiling windows', 'Full residential features', 'Premium fully-fitted delivery'], image: '/images/products/V9-Gen5_render-01.jpg', isCustom: false },
  { id: 'v9-custom-saudi', productSeries: 'V9', name_cn: 'V9 Gen6 · 带厨房–沙特版', name_en: 'V9 Gen6 · With Kitchen Saudi Arabia', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '高温定制', badge_en: 'High-Temp Custom', tags_cn: ['沙特', '带厨房', '极热'], tags_en: ['Saudi Arabia', 'With Kitchen', 'Extreme Heat'], features_cn: ['沙特利雅得落地（+55℃）', '集成厨房模块', '高温保温隔热升级'], features_en: ['Riyadh deployed (+55°C)', 'Integrated kitchen module', 'High-temp insulation upgrade'], image: '/images/products/custom_V9-Gen6_Saudi-kitchen_01.jpg', isCustom: true },
  { id: 'v9-custom-japan', productSeries: 'V9', name_cn: 'V9 Gen6 · 带底盘–日本版', name_en: 'V9 Gen6 · With Chassis Japan', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '可移动', badge_en: 'Mobile', tags_cn: ['日本', '带底盘', '可移动'], tags_en: ['Japan', 'With Chassis', 'Mobile'], features_cn: ['集成底盘可移动部署', '日本建筑规范适配', '港口标准吊装规格'], features_en: ['Integrated mobile chassis', 'Japan building code compliant', 'Port standard lifting spec'], image: '/images/products/custom_V9-Gen6_chassis-Japan_01.jpg', isCustom: true },
  { id: 'v9-custom-russia', productSeries: 'V9', name_cn: 'V9 Gen6 · 接待室–俄罗斯版', name_en: 'V9 Gen6 · Reception Russia', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '极寒定制', badge_en: 'Arctic Custom', tags_cn: ['俄罗斯', '接待室', '极寒'], tags_en: ['Russia', 'Reception', 'Arctic'], features_cn: ['极寒气候三层保温', '接待室定制内装', '摩尔曼斯克落地案例'], features_en: ['Triple-layer arctic insulation', 'Reception room interior', 'Murmansk deployment case'], image: '/images/products/custom_V9-Gen6_reception-Russia_01.jpg', isCustom: true },
  { id: 'v9-custom-ireland', productSeries: 'V9', name_cn: 'V9 Gen6 · 带厨房–爱尔兰版', name_en: 'V9 Gen6 · With Kitchen Ireland', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '海外定制', badge_en: 'Overseas Custom', tags_cn: ['爱尔兰', '带厨房'], tags_en: ['Ireland', 'With Kitchen'], features_cn: ['爱尔兰建筑规范适配', '集成厨房功能模块', '防雨防潮升级设计'], features_en: ['Ireland building code compliant', 'Integrated kitchen module', 'Rain & moisture protection upgrade'], image: '/images/products/custom_V9-Gen6_kitchen-Ireland_01.jpg', isCustom: true },
  { id: 'v9-custom-brazil', productSeries: 'V9', name_cn: 'V9 Gen6 · 带厨房–巴西版', name_en: 'V9 Gen6 · With Kitchen Brazil', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '海外定制', badge_en: 'Overseas Custom', tags_cn: ['巴西', '带厨房'], tags_en: ['Brazil', 'With Kitchen'], features_cn: ['热带气候通风升级', '集成厨房功能模块', '南美洲海运整体交付'], features_en: ['Tropical ventilation upgrade', 'Integrated kitchen module', 'South America sea shipping'], image: '/images/products/custom_V9-Gen6_kitchen-Brazil_01.jpg', isCustom: true },
  { id: 'v9-custom-israel', productSeries: 'V9', name_cn: 'V9 Gen6 · 带厨房–以色列版', name_en: 'V9 Gen6 · With Kitchen Israel', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '旗舰定制', badge_en: 'Flagship Custom', tags_cn: ['以色列', '带厨房', '旗舰配置'], tags_en: ['Israel', 'With Kitchen', 'Flagship Config'], features_cn: ['旗舰满配版本', '集成厨房岛台设计', '中东气候适配'], features_en: ['Flagship full configuration', 'Integrated kitchen island', 'Middle East climate adapted'], image: '/images/products/custom_V9-Gen6_kitchen-Israel_01.jpg', isCustom: true },
  { id: 'v9-custom-australia', productSeries: 'V9', name_cn: 'V9 Gen6 · 海外定制–澳洲版', name_en: 'V9 Gen6 · Overseas Custom Australia', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '澳洲认证', badge_en: 'AU Certified', tags_cn: ['澳洲', '海外定制'], tags_en: ['Australia', 'Overseas Custom'], features_cn: ['澳洲建筑规范适配', '防晒隔热升级', '本地交付售后支持'], features_en: ['Australia building code compliant', 'UV insulation upgrade', 'Local delivery & after-sales'], image: '/images/products/custom_V9-Gen6_AUS-Victor_01.jpg', isCustom: true },
  { id: 'v9-custom-murmansk', productSeries: 'V9', name_cn: 'V9 Gen6 · 海外定制–摩尔曼斯克版', name_en: 'V9 Gen6 · Overseas Custom Murmansk', gen: 'Gen6', size: '38.8㎡', area: 38.8, generation: 6, productType: 'luxury', badge_cn: '极寒落地', badge_en: 'Arctic Deployed', tags_cn: ['摩尔曼斯克', '极寒', '-32℃落地'], tags_en: ['Murmansk', 'Arctic', '-32°C Deployed'], features_cn: ['-32℃摩尔曼斯克已落地', '极寒三层保温结构', '完整离网供暖系统'], features_en: ['Deployed at -32°C Murmansk', 'Triple-layer arctic insulation', 'Full off-grid heating system'], image: '/images/products/custom_V9-Gen6_Murmansk_01.jpg', isCustom: true },
  { id: 'v9-custom-double', productSeries: 'V9', name_cn: 'V9 Gen6 · 双拼版', name_en: 'V9 Gen6 · Double Module', gen: 'Gen6', size: '77.6㎡', area: 77.6, generation: 6, productType: 'luxury', badge_cn: '双拼定制', badge_en: 'Double Module', tags_cn: ['双拼', '超大空间'], tags_en: ['Double Module', 'Extra Large'], features_cn: ['双舱拼接77.6㎡超大空间', '两套完整功能分区', '整体运输分体安装'], features_en: ['Double-module 77.6㎡ mega space', 'Two complete functional zones', 'Integral shipping split install'], image: '/images/products/custom_V9-Gen5_double-unit_01.jpg', isCustom: true },
  // ── S5 ──────────────────────────────────────
  { id: 's5-gen5-standard', productSeries: 'S5', name_cn: 'S5 Gen5 · 经典版', name_en: 'S5 Gen5 · Classic Edition', gen: 'Gen5', size: '28㎡', area: 28, generation: 5, productType: 'standard', badge_cn: '经典传奇', badge_en: 'Classic Legend', tags_cn: ['科幻风格', '星空天窗'], tags_en: ['Futuristic', 'Starry skylight'], features_cn: ['3.3米全景阳台', '1.68㎡星空天窗', '飞船造型外观'], features_en: ['3.3m panoramic balcony', '1.68㎡ starry skylight', 'Spaceship silhouette'], image: '/images/products/S5-Gen6_render-01.jpg', isCustom: false, detailSlug: 's5' },
  { id: 's5-custom-solar', productSeries: 'S5', name_cn: 'S5 Gen6 · 太阳能离网–展厅版', name_en: 'S5 Gen6 · Solar Off-grid Showroom', gen: 'Gen6', size: '28㎡', area: 28, generation: 6, productType: 'standard', badge_cn: '离网定制', badge_en: 'Off-grid Custom', tags_cn: ['太阳能', '离网', '展厅'], tags_en: ['Solar', 'Off-grid', 'Showroom'], features_cn: ['光伏太阳能离网系统', '储能电池集成', '展厅展示功能定制'], features_en: ['Photovoltaic off-grid system', 'Energy storage integration', 'Showroom display customization'], image: '/images/products/custom_S5-Gen6_solar-offgrid-showroom_01.jpg', isCustom: true },
  { id: 's5-custom-double', productSeries: 'S5', name_cn: 'S5 · 双层定制–台湾版', name_en: 'S5 · Double-Storey Taiwan', gen: 'Gen5', size: '56㎡', area: 56, generation: 5, productType: 'luxury', badge_cn: '双层定制', badge_en: 'Double-Storey', tags_cn: ['双层', '台湾', '定制'], tags_en: ['Double-Storey', 'Taiwan', 'Custom'], features_cn: ['S5外观双层叠加设计', '台湾落地交付案例', '超大空间双层布局'], features_en: ['S5 silhouette double-storey', 'Taiwan deployment case', 'Extra large double-level layout'], image: '/images/products/custom_S5-Gen6_double-floor-Taiwan_01.jpg', isCustom: true },
];
