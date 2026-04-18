export interface FaqItem {
  id: string;
  category: string;
  category_zh: string;
  question_en: string;
  answer_en: string;
  question_zh: string;
  answer_zh: string;
}

export const FAQ_DATA: FaqItem[] = [
  // Product & Materials
  {
    id: 'pm-1',
    category: 'Product & Materials',
    category_zh: '产品与材料',
    question_en: 'What materials are used in VESSEL structures?',
    answer_en: 'All VESSEL models are built on five core structural materials: High-Strength Hot-Dip Galvanized Steel Frame (zinc coating 30μm, wall thickness 4.75mm), Corrosion-Resistant Fluorocarbon-Coated Aluminum Panel (zinc coating 43μm, impact resistance 20kg/cm²), High-Performance Argon Low-E Double Glazing (thermal conductivity 1.58 W/m·k), Ultra-Low Thermal Bridge Window & Door System (thermal break width >35mm), and High-Density Spray Foam Polyurethane Insulation (thermal conductivity 0.0294 W/m·k). The structure is rated Seismic Intensity 8.0, Wind Resistance Level 11, and maintains a 50°C indoor-outdoor temperature differential.',
    question_zh: 'VESSEL 结构使用什么材料？',
    answer_zh: '所有 VESSEL 型号均采用五大核心结构材料：高强度热镀锌钢框架（镀锌层 30μm，壁厚 4.75mm）、耐腐蚀氟碳涂层铝板（镀锌层 43μm，抗冲击 20kg/cm²）、高性能氩气 Low-E 双层玻璃（导热系数 1.58 W/m·k）、超低热桥门窗系统（断热桥宽度 >35mm）、高密度喷涂聚氨酯保温层（导热系数 0.0294 W/m·k）。结构抗震烈度 8.0 级，抗风等级 11 级，室内外温差维持能力达 50°C。',
  },
  {
    id: 'pm-2',
    category: 'Product & Materials',
    category_zh: '产品与材料',
    question_en: 'What are the key upgrades of the sixth-generation (Gen6) products?',
    answer_en: 'Gen6 features six major upgrades: (1) Interlocked watertight roof — physical waterproofing that prevents leakage even as sealant ages; (2) Underfloor semi-open mechanical level — houses AC units, batteries and equipment below the floor without occupying interior space; (3) Glue-free joint finish — no gaps, no formaldehyde, easier to clean; (4) High-performance thermal break windows & doors — break width >35mm for superior insulation; (5) Integrated bedside system — ambient lighting and switches built into the headboard; (6) Iconic "Diamond-shaped Realm" exterior — eliminates the "square box" look of conventional prefab buildings.',
    question_zh: '第六代（Gen6）产品有哪些重要升级？',
    answer_zh: 'Gen6 拥有六大核心升级：(1) 互扣式防水屋顶——物理防水，即使密封胶老化也不渗漏；(2) 地板下半开放式设备层——空调、电池等设备下置，不占用室内空间；(3) 无胶缝收口——无缝隙、无甲醛、易清洁；(4) 高性能断热桥门窗——断桥宽度 >35mm，保温性能卓越；(5) 床头集成系统——氛围灯与开关内嵌于床头板；(6) 标志性"钻石领域"外观——彻底告别传统装配式建筑的"方盒子"形象。',
  },
  {
    id: 'pm-3',
    category: 'Product & Materials',
    category_zh: '产品与材料',
    question_en: 'How many product models does VESSEL offer?',
    answer_en: 'VESSEL currently offers five flagship models: V9 Gen6 (38.8㎡, full kitchen + living + bedroom); E7 Gen6 (38.8㎡, industry-pioneering one-bedroom-one-living layout); E6 Gen6 (29.6㎡, 4-zone star model); E3 Gen6 (19㎡, ultra-compact, two units per truck); and S5 Gen5 (28㎡, the original space-themed icon with 3.3m panoramic balcony and starlight skylight). Each model is available in base and Pro configurations, with custom variants for specific regional standards.',
    question_zh: 'VESSEL 提供多少款产品型号？',
    answer_zh: 'VESSEL 目前提供五款旗舰型号：V9 Gen6（38.8㎡，全厨房+客厅+卧室）；E7 Gen6（38.8㎡，行业首创一室一厅格局）；E6 Gen6（29.6㎡，四分区明星款）；E3 Gen6（19㎡，超紧凑型，两台一车）；S5 Gen5（28㎡，太空主题经典款，3.3m 全景阳台+星光天窗）。每款均提供标准版和 Pro 版配置，并有针对特定地区标准的定制版本。',
  },

  // Climate & Performance
  {
    id: 'cp-1',
    category: 'Climate & Performance',
    category_zh: '气候与性能',
    question_en: 'Can VESSEL products perform in extreme climates?',
    answer_en: 'Yes. VESSEL has delivered projects across the world\'s most extreme environments. The highest recorded ambient temperature in our portfolio is +55°C in Riyadh, Saudi Arabia; the lowest is -32°C in Murmansk, Russia. For extreme cold or heat, units can be specified with an Enhanced Insulation Package. The structure is also rated for Seismic Intensity 8.0 and Wind Force Level 11.',
    question_zh: 'VESSEL 产品能在极端气候下使用吗？',
    answer_zh: '能。VESSEL 已在全球最极端的环境中完成交付。我们项目记录的最高环境温度为沙特利雅得的 +55°C，最低为俄罗斯摩尔曼斯克的 -32°C。针对极寒或极热地区，可选配增强保温方案。结构同时通过抗震烈度 8.0 级和抗风 11 级认证。',
  },
  {
    id: 'cp-2',
    category: 'Climate & Performance',
    category_zh: '气候与性能',
    question_en: 'How is the thermal and acoustic insulation performance?',
    answer_en: 'The triple-layer insulation system — rigid polyurethane foam + Low-E double glazing + thermal-break window frames — maintains a 50°C indoor-outdoor temperature differential. The same assembly also provides acoustic separation significantly above standard construction. Acoustic performance is further optimized by sensible site planning and spacing between units.',
    question_zh: '热工与隔音性能如何？',
    answer_zh: '三重保温体系——硬质聚氨酯泡沫 + Low-E 双层玻璃 + 断热桥窗框——可维持室内外 50°C 温差。同一体系同样提供远超普通建造标准的隔音性能。合理的场地规划与单元间距可进一步优化声学表现。',
  },

  // Transport & Logistics
  {
    id: 'tl-1',
    category: 'Transport & Logistics',
    category_zh: '运输与物流',
    question_en: 'How are VESSEL units transported internationally?',
    answer_en: 'All VESSEL models are designed for integral transportation as finished goods. External dimensions comply with international port loading regulations for standard 40ft Flat Rack Containers (11.762m × 2.240m × 2.034m), and meet road transport regulations in the majority of countries. VESSEL has exported to 30+ countries across six continents. Smaller models such as E3 and E6 support a "two-units-per-truck" configuration, significantly reducing logistics costs.',
    question_zh: 'VESSEL 产品如何进行国际运输？',
    answer_zh: '所有 VESSEL 型号均以成品整体运输方式设计。外部尺寸符合国际港口装载规范，适配标准 40 英尺平架集装箱（11.762m × 2.240m × 2.034m），并满足大多数国家的公路运输法规。VESSEL 已向全球六大洲 30+ 个国家出口。E3、E6 等小型号支持"两台一车"配置，大幅降低物流成本。',
  },
  {
    id: 'tl-2',
    category: 'Transport & Logistics',
    category_zh: '运输与物流',
    question_en: 'What is the HS code for VESSEL products, and how are customs duties handled?',
    answer_en: 'The internationally recognized Harmonized System code is HS 9406.90 (Prefabricated Buildings). For specific tariff rates in your country, we recommend consulting your national customs authority or a licensed customs broker. VESSEL can provide all necessary product documentation to support the import process.',
    question_zh: 'VESSEL 产品的 HS 编码是什么？关税如何处理？',
    answer_zh: '国际通用协调商品编码为 HS 9406.90（预制建筑物）。具体关税税率建议咨询您所在国家的海关机构或持牌报关行。VESSEL 可提供进口所需的全套产品文件。',
  },
  {
    id: 'tl-3',
    category: 'Transport & Logistics',
    category_zh: '运输与物流',
    question_en: 'What is the lead time from order to delivery?',
    answer_en: 'Standard production cycle is 45 days per batch. For specific delivery schedules based on model, quantity, and configuration, VESSEL will prepare a detailed timeline. We recommend placing orders well in advance of peak periods.',
    question_zh: '从下订单到交货的周期是多久？',
    answer_zh: '标准生产周期为每批次 45 天。VESSEL 将根据型号、数量和配置提供详细的交期计划。建议在旺季前提前下单。',
  },

  // Installation & Site Requirements
  {
    id: 'is-1',
    category: 'Installation & Site Requirements',
    category_zh: '安装与场地要求',
    question_en: 'What site preparation is required for installation?',
    answer_en: 'Minimal. VESSEL units are 100% factory-fabricated and arrive as finished goods — simply connect water and electricity on-site. No foundation is required. The units are designed for all terrain types including mountain peaks, dense forest, wetlands, and grasslands. Site work is typically completed within 2 hours per unit.',
    question_zh: '安装前需要做哪些场地准备？',
    answer_zh: '极少。VESSEL 产品 100% 工厂预制，以成品到达现场，只需接驳水电即可。无需地基。产品适配所有地形，包括山顶、密林、湿地和草原。每台现场安装通常在 2 小时内完成。',
  },
  {
    id: 'is-2',
    category: 'Installation & Site Requirements',
    category_zh: '安装与场地要求',
    question_en: 'Can VESSEL units operate completely off-grid?',
    answer_en: 'Yes. Gen6 units support the VESSEL Off-grid Living System (VOLS): rooftop photovoltaic panels (partnered with Lotus Cars for solar roof technology), underfloor battery storage up to 100kWh+ with 90% charge-discharge efficiency, and an integrated VSRB biological wastewater treatment system with zero-pollution discharge. VOLS units require no municipal water or electricity infrastructure.',
    question_zh: 'VESSEL 产品可以完全离网运行吗？',
    answer_zh: '可以。Gen6 支持 VESSEL 离网生活系统（VOLS）：屋顶光伏板（与路特斯汽车合作的太阳能屋顶技术）、地板下电池储能可达 100kWh+（充放电效率 90%），以及集成 VSRB 生物污水处理系统（零污染排放）。VOLS 版本无需任何市政供水或供电基础设施。',
  },
  {
    id: 'is-3',
    category: 'Installation & Site Requirements',
    category_zh: '安装与场地要求',
    question_en: 'Can units be stacked or combined into multi-story or multi-unit configurations?',
    answer_en: 'Yes. VESSEL has delivered configurations from 2 to 8 stories, and multi-unit combinations of 30+ units for resort reception centers, ski lodge service stations, and scenic area visitor centers. Structural design for multi-unit configurations is handled on a project-by-project basis.',
    question_zh: '产品可以叠层或组合成多层、多单元配置吗？',
    answer_zh: '可以。VESSEL 已交付 2 至 8 层的叠层项目，以及 30+ 台组合的度假区接待中心、滑雪场服务站、景区游客中心。多单元配置的结构设计按项目定制处理。',
  },

  // Certifications & Compliance
  {
    id: 'cc-1',
    category: 'Certifications & Compliance',
    category_zh: '认证与合规',
    question_en: 'What international certifications do VESSEL products hold?',
    answer_en: 'VESSEL holds EU building safety permits and US building access certifications — one of only 2–3 Chinese manufacturers with equivalent credentials. These certifications cover structural safety, fire resistance, and material standards. Products have been successfully deployed in compliance with local regulations across the US, UK, Russia, Saudi Arabia, Japan, South Korea, and 25+ additional countries.',
    question_zh: 'VESSEL 产品持有哪些国际认证？',
    answer_zh: 'VESSEL 持有欧盟建筑安全许可和美国建筑准入认证，是少数几家（2-3 家）拥有同等资质的中国制造商之一。认证涵盖结构安全、防火性能和材料标准。产品已在美国、英国、俄罗斯、沙特阿拉伯、日本、韩国及 25+ 个国家合规落地。',
  },
  {
    id: 'cc-2',
    category: 'Certifications & Compliance',
    category_zh: '认证与合规',
    question_en: 'Is VESSEL a verified manufacturer? How do I confirm the company?',
    answer_en: 'Yes. The brand is owned by Guangdong VESSEL Cultural Tourism Development Co., Ltd. (广东微宿文旅发展有限公司), verifiable on China\'s National Enterprise Credit Information Publicity System. The company holds 150+ national patents, operates a 28,800㎡ self-owned factory in Foshan with monthly output of 150+ units, and has been awarded Guangdong High-Tech Enterprise status.',
    question_zh: 'VESSEL 是经过核实的制造商吗？如何确认公司资质？',
    answer_zh: '是的。品牌归属广东微宿文旅发展有限公司，可在中国国家企业信用信息公示系统查询核实。公司持有 150+ 项国家专利，在佛山运营 28,800㎡ 自有工厂，月产能 150+ 台，并荣获广东省高新技术企业认定。',
  },

  // Pricing & Commercial Terms
  {
    id: 'pc-1',
    category: 'Pricing & Commercial Terms',
    category_zh: '价格与商务条款',
    question_en: 'What is the price range for VESSEL products?',
    answer_en: 'Domestic China pricing ranges from RMB 70,000 to 370,000 per unit, depending on model and configuration. International pricing is FOB Foshan. We do not publish international list prices online — contact us with your project specifications for a customized quotation including transport and installation estimates.',
    question_zh: 'VESSEL 产品的价格区间是多少？',
    answer_zh: '中国国内定价为每台人民币 7 万至 37 万，具体取决于型号和配置。海外定价为 FOB 佛山。我们不在网上公布国际报价——请提供您的项目规格，我们将为您提供包含运输和安装估算的定制报价。',
  },
  {
    id: 'pc-2',
    category: 'Pricing & Commercial Terms',
    category_zh: '价格与商务条款',
    question_en: 'What is the minimum order quantity?',
    answer_en: 'Single unit. There is no minimum order requirement. Volume pricing is available — contact our sales team for tiered pricing details.',
    question_zh: '最低起订量是多少？',
    answer_zh: '单台起订，无最低起订量限制。批量采购可享受阶梯价格——请联系我们的销售团队了解详情。',
  },
  {
    id: 'pc-3',
    category: 'Pricing & Commercial Terms',
    category_zh: '价格与商务条款',
    question_en: 'What payment terms are typical?',
    answer_en: 'Standard terms are 30% deposit to lock pricing (valid 90 days), with the balance due before shipment. Large orders and long-term partnerships may qualify for flexible payment schedules. Specific terms are confirmed during the commercial negotiation process.',
    question_zh: '通常的付款条款是什么？',
    answer_zh: '标准条款为 30% 定金锁价（有效期 90 天），余款在发货前付清。大额订单及长期合作伙伴可申请灵活付款安排。具体条款在商务谈判过程中确认。',
  },
];

export const FAQ_CATEGORIES = [
  { key: 'Product & Materials', en: 'Product & Materials', zh: '产品与材料' },
  { key: 'Climate & Performance', en: 'Climate & Performance', zh: '气候与性能' },
  { key: 'Transport & Logistics', en: 'Transport & Logistics', zh: '运输与物流' },
  { key: 'Installation & Site Requirements', en: 'Installation & Site Requirements', zh: '安装与场地要求' },
  { key: 'Certifications & Compliance', en: 'Certifications & Compliance', zh: '认证与合规' },
  { key: 'Pricing & Commercial Terms', en: 'Pricing & Commercial Terms', zh: '价格与商务条款' },
];
