export type ProductSlug = 'e7' | 'e6' | 'e3' | 'v9' | 'v5' | 's5';

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
      { title: '硬质聚氨酯喷涂', spec: '导热系数0.0294W/mK，极致隔热' },
    ],
    image: '/images/e7-gen6.jpg',
    badge: '畅销 No.1',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 488,000 起',
    priceHidden: 'XX万起',
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
    tagline2: '最好的传承，是新生',
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
    badge: '全球最畅销',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 388,000 起',
    priceHidden: 'XX万起',
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
      '以游艇立面美学为设计语言，无痕光域灯带环绕全身，半圆弧形玻璃窗以最小尺寸实现 180° 无遮挡景观视野。',
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
      { name: '开角式衣柜', desc: '转角空间最大化利用，收纳充足。' },
      { name: '一体式橱柜', desc: '迷你厨房功能，满足基础饮食需求。' },
    ],
    materials: [
      { title: '热镀锌钢结构', spec: '轻量化设计，5吨净重' },
      { title: '氟碳铝板', spec: '耐腐蚀长效涂层' },
      { title: '弧形钢化玻璃', spec: '定制半圆弧形，安全耐用' },
      { title: 'SPC 防水地板', spec: '防水防潮，耐磨易清洁' },
    ],
    image: '/images/e6-gen6.jpg',
    badge: '入门首选',
    accentColor: '#e07b4a',
    priceDisplay: '¥ 228,000 起',
    priceHidden: 'XX万起',
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
    badge: '长居首选',
    accentColor: '#c9a84c',
    priceDisplay: '¥ 458,000 起',
    priceHidden: 'XX万起',
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
      '以超广角全景玻璃为核心，将自然景色最大限度引入室内。轻量化 6 吨结构支持快速运输部署，是打造景观度假营地的理想单元。',
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
    accentColor: '#7a9ec9',
    priceDisplay: '¥ 288,000 起',
    priceHidden: 'XX万起',
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
      '超越空间感，尽收天光云景。独特的天窗采光系统将自然光线垂直引入室内，随时间变化的光影成为空间最美的装饰。',
    features: [
      {
        title: '天光采光系统',
        desc: '顶部天窗设计，将天空与云景引入室内，随日照变化呈现不同光影。',
      },
      {
        title: '多面大窗视野',
        desc: '多方向大面积玻璃设计，最大化全方位观景体验。',
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
    badge: '景观首选',
    accentColor: '#c97a9e',
    priceDisplay: '¥ 328,000 起',
    priceHidden: 'XX万起',
    prev: 'v5',
  },
];

export function getProduct(slug: string): ProductData | undefined {
  return products.find((p) => p.slug === slug);
}

export const gen6Products = products.filter((p) => p.series === 'Gen6');
export const gen5Products = products.filter((p) => p.series === 'Gen5');
