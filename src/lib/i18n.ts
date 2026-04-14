type BiLang = { en: string; zh: string };

function b(en: string, zh: string): BiLang {
  return { en, zh };
}

export const i18n = {
  nav: {
    products:         b('Products', '产品系列'),
    cases:            b('Cases', '项目案例'),
    about:            b('About', '关于我们'),
    news:             b('News', '新闻活动'),
    contact:          b('Contact', '联系我们'),
    gen6Label:        b('Gen6 · Latest', 'Gen6 · 最新系列'),
    gen5Label:        b('Gen5 · Classic', 'Gen5 · 经典系列'),
    allProducts:      b('All Products →', '查看全部产品 →'),
    scenarioTourism:  b('Tourism & Resort', '文旅度假营地'),
    scenarioCommercial: b('Commercial Space', '商业空间案例'),
    scenarioPublic:   b('Public Facilities', '公共设施案例'),
    allCases:         b('All Cases →', '全部案例 →'),
    purchaseBtn:      b('Purchase Inquiry', '采购咨询'),
    bookingBtn:       b('Book a Camp', '预订营地'),
    displayMode:      b('Showroom Mode', '展厅展示模式'),
    signOut:          b('Sign Out', '退出登录'),
    signIn:           b('Sign In', '登录'),
    globalPresence:   b('Global Presence', '全球部署'),
  },
  footer: {
    ctaTitle:         b('Ready to start your tourism architecture project?', '准备好开始您的文旅建筑项目了吗？'),
    ctaSubtitle:      b('Our professional team provides 1-on-1 consulting', '专业团队为您提供一对一方案咨询服务'),
    phoneBtn:         b('Call Us', '电话咨询'),
    messageBtn:       b('Leave a Message', '在线留言'),
    brandTagline:     b('VESSEL® · Smart Prefab Architecture for Tourism', '微宿®·文旅智能装配建筑'),
    brandDesc:        b(
      'One-stop resort camp solution. 8 years in tourism architecture, EU+US certified, 30+ countries.',
      '高端度假营地一站式解决方案服务商，8年深耕文旅建筑赛道，欧盟+美国双认证，全球30+国家交付。'
    ),
    productsHeading:  b('Products', '产品系列'),
    allProducts:      b('All Products', '全部产品'),
    companyHeading:   b('Company', '公司'),
    contactHeading:   b('Contact Us', '联系我们'),
    workHours:        b('Mon–Fri 9:00–18:00', '工作日 9:00–18:00'),
    address:          b(
      'No.253 Xingyebei Rd, Shishan Town, Nanhai District, Foshan, Guangdong',
      '广东省佛山市南海区狮山镇兴业北路253号'
    ),
    copyright:        b(
      '© 2025 VESSEL® · 303 Industries. All rights reserved.',
      '© 2025 VESSEL 微宿® · 303 Industries. 保留所有权利。'
    ),
    privacy:          b('Privacy Policy', '隐私政策'),
    terms:            b('Terms of Use', '使用条款'),
  },
  home: {
    // === HERO ===
    heroTagline:      b('Redefine Natural Dwelling', '重构自然的栖居'),
    heroHeadline:     b('Architecture Without\nBoundaries', '建筑\n无界'),
    heroSubtitle:     b(
      'VESSEL creates smart prefab architecture that dissolves the boundary between technology and nature. Delivered complete. Anywhere on Earth.',
      'VESSEL 创造智能装配建筑，消弭科技与自然的边界。出厂即成品，落地即生活。'
    ),
    heroCta:          b('Explore Products', '探索产品'),
    heroCtaSecondary: b('Get in Touch', '联系我们'),

    // === CREDENTIALS BAR ===
    credStat1:        b('300+', '300+'),
    credLabel1:       b('Projects Delivered', '交付项目'),
    credStat2:        b('30+', '30+'),
    credLabel2:       b('Countries', '覆盖国家'),
    credStat3:        b('150+', '150+'),
    credLabel3:       b('Patents', '自主专利'),
    credStat4:        b('28,800', '28,800'),
    credLabel4:       b('m² Factory', 'm² 工厂'),

    // === CERTIFICATIONS ===
    certLabel:        b('Global Compliance', '全球资质认证'),
    certTitle:        b('Certified for the World\'s Most Demanding Markets', '通过全球最严苛市场的建筑认证'),
    certEuName:       b('EU CE Mark', '欧盟 CE 认证'),
    certEuStd:        b('EN 1337 · CPR', 'EN 1337 · CPR'),
    certEuDesc:       b('Construction Products Regulation — direct market access to 27 EU member states', '建筑产品法规——直接进入27个欧盟成员国市场'),
    certUsName:       b('US IBC', '美国 IBC 认证'),
    certUsStd:        b('IBC 2021 · ASTM', 'IBC 2021 · ASTM'),
    certUsDesc:       b('International Building Code — compliant for US and IBC-adopting countries', '国际建筑规范——符合美国及采用IBC标准的国家'),
    certIsoName:      b('ISO 9001:2015', 'ISO 9001:2015'),
    certIsoStd:       b('Quality Management', '质量管理体系'),
    certIsoDesc:      b('International quality management system certification', '国际质量管理体系认证'),
    certAuName:       b('AU/NZ Compliance', '澳新合规认证'),
    certAuStd:        b('NZS 2208 · AS 4666', 'NZS 2208 · AS 4666'),
    certAuDesc:       b('Safety glazing and glass compliance for Australian & NZ markets', '澳大利亚及新西兰市场安全玻璃合规认证'),
    certSubtitle:     b('Only 2-3 Chinese manufacturers hold simultaneous EU + US building certifications', '国内同时持有欧盟+美国建筑认证的企业仅2-3家'),

    // === PHILOSOPHY ===
    philoLabel:       b('Our Philosophy', '品牌理念'),
    philoTitle:       b('Where Technology Disappears Into Landscape', '当科技消融于风景'),
    philoBody:        b(
      'Since 2018, VESSEL has pioneered space-themed prefab architecture — merging futuristic design with the warmth of natural dwelling. Every unit ships complete from our factory, ready to inhabit the moment it touches ground.',
      '自2018年创立以来，VESSEL 以科幻美学与自然栖居的融合开创了太空主题装配建筑品类。每一台产品从工厂出发时已是成品，落地即可入住。'
    ),

    // === FLAGSHIP ===
    flagshipLabel:    b('Flagship', '旗舰产品'),
    flagshipModel:    b('VESSEL · E7 Gen6', 'VESSEL · E7 Gen6'),
    flagshipTitle:    b('The Industry-Defining Space', '重新定义行业标准'),
    flagshipSpec1:    b('38.8㎡', '38.8㎡'),
    flagshipSpec1L:   b('Floor Area', '建筑面积'),
    flagshipSpec2:    b('270°', '270°'),
    flagshipSpec2L:   b('Panoramic View', '环幕视野'),
    flagshipSpec3:    b('VIIE', 'VIIE'),
    flagshipSpec3L:   b('Smart System', '智能系统'),
    flagshipCta:      b('View Details', '查看详情'),
    flagshipWhy:      b('Featured on CCTV National News upon launch in 2019. The one-bedroom-one-living layout became the industry paradigm.', '2019年发布即登上央视新闻直播间，一室一厅布局已成为行业经典范式。'),

    // === TECHNOLOGY ===
    techLabel:        b('Core Technology', '核心技术'),
    techTitle:        b('Three Systems. Total Independence.', '三大技术体系，完全自主'),
    tech1Tag:         b('VIIE', 'VIIE'),
    tech1Title:       b('Intelligent Interactive Experience', '智能交互体验'),
    tech1Body:        b(
      'AI voice + App dual control. One-touch scenes for lighting, climate, curtains. Compatible with global smart home ecosystems including Huawei HarmonyOS.',
      'AI语音 + App远程双控，一键切换照明、温控、遮帘场景，兼容全球智能家居生态，深度融合华为鸿蒙系统。'
    ),
    tech2Tag:         b('VOLS', 'VOLS'),
    tech2Title:       b('Off-Grid Living System', '离网生活系统'),
    tech2Body:        b(
      'Rooftop solar + 100kWh battery storage. Integrated water purification and VSRB bio-wastewater treatment. Zero dependence on municipal infrastructure.',
      '屋顶光伏 + 100kWh储能电池，集成净水与VSRB生物污水处理系统，完全脱离市政基础设施。'
    ),
    tech3Tag:         b('VIPC', 'VIPC'),
    tech3Title:       b('Integral Pre-fab Construction', '整装预制工艺'),
    tech3Body:        b(
      'Factory precision ±0.5mm. Ships whole via 40ft flat rack. Survives repeated transport without deformation. On-site in 2 hours.',
      '工厂精度±0.5mm，40尺框架柜整体运输，多次吊装不变形，现场2小时安装。'
    ),

    // === PROJECTS ===
    projLabel:        b('Global Presence', '全球实践'),
    projTitle:        b('Deployed Across 6 Continents', '部署覆盖六大洲'),
    projCta:          b('View All Projects', '查看全部项目'),

    // === MANUFACTURING ===
    mfgLabel:         b('Manufacturing', '智造实力'),
    mfgTitle:         b('28,800㎡ of Precision', '28,800㎡ 精密智造'),
    mfgBody:          b(
      '150+ units per month. 150+ patents. Every VESSEL is built with automotive-grade precision in our Foshan factory — then shipped complete to anywhere on Earth.',
      '月产能150+台，150+项自主专利。每一台VESSEL都在佛山工厂以汽车级精度制造——然后整体运往世界任何角落。'
    ),

    // === SCENARIOS ===
    scenLabel:        b('Applications', '应用场景'),
    scenTitle:        b('One Architecture, Infinite Contexts', '一种建筑，无限场景'),
    scen1Title:       b('Tourism & Resort', '文旅度假'),
    scen1Desc:        b('Premium camp resorts, boutique hotels, nature retreats', '高端度假营地、精品酒店、自然旅居'),
    scen2Title:       b('Commercial Space', '商业空间'),
    scen2Desc:        b('Pop-up retail, brand experience centers, creative offices', '快闪零售、品牌体验中心、创意办公'),
    scen3Title:       b('Public & Emergency', '公共服务'),
    scen3Desc:        b('Emergency housing, mobile medical, border facilities', '应急安置、移动医疗、边境服务设施'),

    // === CTA ===
    ctaTitle:         b('Start Your Project', '开启您的项目'),
    ctaBody:          b(
      'From site consultation to global delivery — our team has supported 300+ projects across 30+ countries.',
      '从选址咨询到全球交付——我们的团队已支持30+国家的300+个项目。'
    ),
    ctaBtn:           b('Contact Us', '联系我们'),

    // === SHARED ===
    learnMore:        b('Learn More', '了解更多'),
    inquireBtn:       b('Inquire Now', '立即咨询'),
    scrollDown:       b('Scroll', '向下'),
  },
  about: {
    heroLabel:        b('About Us', '关于我们'),
    heroTitleGold:    b('Founder of Luxury Camp Resorts', '高端度假营地开创者'),
    heroSubtitle:     b(
      'Prefab technology leading the future of tourism dwelling, reshaping the boundaries of travel experience through architecture.',
      '装配式科技领跑未来旅居，用建筑重塑文旅体验边界'
    ),
    missionLabel:     b('Brand Mission', '品牌使命'),
    missionTitle1:    b('Luxury Camp Resort', '高端度假营地'),
    missionTitle2:    b('One-Stop Solution Provider', '一站式解决方案服务商'),
    missionMain:      b(
      "VESSEL® is dedicated to becoming the one-stop solution provider for luxury camp resorts, leading China's innovative tourism category onto the global stage. Our products focus on the core values of smart prefab tourism architecture: rapid delivery, long-lasting durability, high aesthetics, and low maintenance cost.",
      'VESSEL 微宿® 致力于成为高端度假营地一站式解决方案服务商，带领中国文旅创新品类走向全球。我们的产品专注于文旅智能装配建筑的本质价值：快速交付、经久耐用、高颜值、低运维成本。'
    ),
    missionSub:       b(
      'Founded in 2018, we have served tourism developers in 30+ countries over 8 years, completing over 300 premium camp projects, establishing ourselves as the industry benchmark brand.',
      '创立于 2018 年，8 年间我们服务了全球 30+ 国家的文旅开发者，打造了超过 300 个高端营地项目，成为行业标杆品牌。'
    ),
    stat1Val:         b('300+', '300+'),
    stat1:            b('Projects Delivered', '全球交付项目'),
    stat2Val:         b('30+', '30+'),
    stat2:            b('Export Countries', '出口国家地区'),
    stat3Val:         b('28,800㎡', '28,800㎡'),
    stat3:            b('Factory Area', '自有工厂面积'),
    stat4Val:         b('150+/mo', '150台+/月'),
    stat4:            b('Monthly Capacity', '月交付能力'),
    stat5Val:         b('150+', '150+'),
    stat5:            b('Patents', '自主研发专利'),
    stat6Val:         b('8M+', '800万+'),
    stat6:            b('Followers', '全网粉丝关注'),
    rdLabel:          b('R&D Capability', '自主研发设计能力'),
    rdTitle:          b('Our Creativity', '我们的创造力'),
    rd1Title:         b('Industrial Manufacturing', '工业级制造'),
    rd1Desc:          b(
      '28,800㎡ self-owned factory, precision control ±0.5mm, monthly capacity over 150 units, full QC throughout.',
      '28,800㎡ 自有工厂，精度控制 ±0.5mm，月产能超 150 台，全程质检把控。'
    ),
    rd2Title:         b('Independent R&D', '自主研发'),
    rd2Desc:          b(
      '150+ self-developed patents covering structure, materials, smart control, waterproofing and other core technologies.',
      '150+ 自主研发专利，覆盖结构、材料、智能控制、防水系统等核心技术领域。'
    ),
    rd3Title:         b('Global Presence', '全球布局'),
    rd3Desc:          b(
      'Products cover 30+ countries across 6 continents, with offices in Taiwan, Japan, UK, Slovakia, New Zealand, Saudi Arabia.',
      '产品已覆盖 6 大洲 30+ 国家，在台湾、日本、英国、斯洛伐克、新西兰、沙特设有办事处。'
    ),
    timelineLabel:    b('Brand History', '品牌历程'),
    timelineTitle:    b('VESSEL® Journey of Exploration', 'VESSEL 微宿® 探索之旅'),
    timeline0:        b('303 Design Studio founded the VESSEL brand', '三零三设计工作室创立微宿品牌'),
    timeline1:        b('First prototype steel frame completed', '首台样板钢结构框架完成'),
    timeline2:        b('First production base established in Sanshui, Foshan', '佛山三水首家生产基地成立'),
    timeline3:        b("World's first VESSEL prefab unit unveiled", '全球第一台微宿装配式建筑面世'),
    timeline4:        b('Products exported to Southeast Asia, entering international market', '产品出口东南亚，开拓国际市场'),
    timeline5:        b('Obtained EU CE certification, entering European market', '获欧盟 CE 建筑认证，进入欧洲市场'),
    timeline6:        b('Obtained US IBC certification, entering North American market', '获美国 IBC 建筑认证，进入北美市场'),
    timeline7:        b('Global deliveries exceeded 200 projects', '全球交付项目突破 200 个'),
    timeline8:        b('Strategic partnership signed with HUAWEI to advance smart integration', '与华为 HUAWEI 战略签约，推进智能化升级'),
    timeline9:        b('6th Generation Gen6 full lineup officially launched', '第六代 Gen6 全系列正式发布'),
    timeline10:       b('Global projects exceeded 300, covering 30+ countries', '全球项目突破 300 个，覆盖 30+ 国家'),
    globalLabel:      b('China Leading, Global Presence', '中国领先，全球布局'),
    globalTitle:      b('30+ Countries Across 6 Continents', '全球 6 大洲 30+ 国家'),
    globalSubtitle:   b(
      'As of 2025, VESSEL has delivered 300+ projects nationally and exported to 30+ countries across 100+ cities.',
      '截至 2025 年，微宿已在全国落地 300 余个项目，出口至全球 30+ 国家，覆盖 100+ 城市'
    ),
    region0:          b('Asia', '亚洲'),
    region0Countries: b('China, Japan, South Korea, SE Asia', '中国、日本、韩国、东南亚'),
    region1:          b('Europe', '欧洲'),
    region1Countries: b('UK, Slovakia, Germany, France', '英国、斯洛伐克、德国、法国'),
    region2:          b('North America', '北美洲'),
    region2Countries: b('USA, Canada, Mexico', '美国、加拿大、墨西哥'),
    region3:          b('Oceania', '大洋洲'),
    region3Countries: b('New Zealand, Australia', '新西兰、澳大利亚'),
    region4:          b('Middle East', '中东'),
    region4Countries: b('Saudi Arabia, Dubai, Qatar', '沙特、迪拜、卡塔尔'),
    region5:          b('Africa', '非洲'),
    region5Countries: b('South Africa, Kenya', '南非、肯尼亚'),
    globalOfficesNote: b('Global Offices: Taiwan · Japan · UK·Manchester · Slovakia · New Zealand · Saudi Arabia and more', '全球办事处：台湾·台中 · 日本 · 英国·Manchester · 斯洛伐克 · 新西兰 · 沙特及更多地区'),
    honorsLabel:      b('Brand Honors', '品牌荣誉'),
    honorsTitle:      b('R&D Strength Certified', '研发实力认证'),
    honor0:           b('Guangdong High-Tech Enterprise Certification', '广东省高新技术企业认证'),
    honor1:           b('100+ Self-Developed Patents', '100+ 自主研发专利'),
    honor2:           b('EU CE Building Product Certification', '欧盟 CE 建筑产品认证'),
    honor3:           b('US IBC International Building Code Certification', '美国 IBC 国际建筑规范认证'),
    honor4:           b('ISO 9001:2015 Quality Management System', 'ISO 9001:2015 质量管理体系认证'),
    honor5:           b('China Prefab Architecture Outstanding Case', '中国装配式建筑优秀案例'),
    honor6:           b('St. Petersburg Economic Forum Featured Brand', '圣彼得堡国际经济论坛展示企业'),
    honor7:           b('Official Canton Fair Exhibitor Brand', '广交会官方参展品牌'),
    partnersLabel:    b('Strategic Partners', '战略合作'),
    partnersTitle:    b('Our Partners', '合作伙伴'),
    partnerDesc0:     b('Smart Home System Strategic Partner', '全屋智能系统战略合作伙伴'),
    partnerDesc1:     b('Cultural Tourism Development Strategic Partner', '文旅开发战略合作'),
    partnerDesc2:     b('Social Housing International Partner', '社会住房国际合作'),
    partnerDesc3:     b('Official Featured Brand', '官方合作展示品牌'),
    founderLabel:     b('Brand Founder', '品牌创始人'),
    founderTitle:     b('Wang Shuaibin', '王帅斌'),
    founderRole:      b('Founder / Chief Designer', '创始人 / 总设计师'),
    founderCred0:     b('Master of Architecture, University of Dundee, UK', '英国邓迪大学建筑学硕士'),
    founderCred1:     b('RIBA Part II Accredited, Royal Institute of British Architects', '英国皇家建筑师协会 RIBA Part Ⅱ 认证'),
    founderCred2:     b('Master of Architecture, Washington University in St. Louis, USA', '美国圣路易斯华盛顿大学建筑学硕士'),
    founderCred3:     b('Former Architect at SOM, New York', '曾任职纽约 SOM 建筑师事务所'),
    founderCred4:     b('Founder & Chief Designer of VESSEL 微宿®', 'VESSEL 微宿® 品牌创始人兼总设计师'),
    founderBio:       b(
      "With a solid international architecture background and deep understanding of China's tourism market, Wang Shuaibin founded VESSEL® in 2018, integrating industrial precision manufacturing with architectural aesthetics, pioneering a new category of premium prefab tourism architecture in China.",
      '王帅斌以扎实的国际建筑学背景和对中国文旅市场的深刻理解，于 2018 年创立 VESSEL 微宿®，将工业化精密制造与建筑美学融为一体，开创了中国高端装配式文旅建筑的全新品类。'
    ),
  },
  contact: {
    heroLabel:        b('Contact Us', '联系我们'),
    heroTitleGold:    b('Premium Service', '尊享服务'),
    heroSubtitle:     b(
      'Purchase Inquiry · Project Partnership · Agency · Custom — Professional team serving you throughout',
      '采购咨询 · 项目合作 · 代理加盟 · 定制服务，专业团队全程服务'
    ),
    formLabel:        b('Online Message', '在线留言'),
    contactLabel:     b('Contact Info', '联系方式'),
    phoneLabel:       b('China Hotline', '国内服务热线'),
    workHours:        b('Mon–Fri 9:00–18:00', '工作日 9:00–18:00'),
    waLabel:          b('WhatsApp / International', 'WhatsApp / 国际'),
    emailLabel:       b('Email', '电子邮箱'),
    addressLabel:     b('HQ Address', '总部地址'),
    wechatLabel:      b('Scan WeChat QR', '微信扫码咨询'),
    wechatSub:        b('Scan to chat instantly', '扫一扫，立即咨询'),
    officesLabel:     b('Global Offices', '全球办事处'),
    operating:        b('Active', '运营中'),
    building:         b('Coming Soon', '筹建中'),
    city0:            b('Taiwan · Taichung', '台湾·台中'),
    city1:            b('Japan', '日本'),
    city2:            b('UK · Manchester', '英国·Manchester'),
    city3:            b('Slovakia', '斯洛伐克'),
    city4:            b('New Zealand', '新西兰'),
    city5:            b('Saudi Arabia', '沙特阿拉伯'),
    city6:            b('Germany', '德国'),
    city7:            b('Australia', '澳大利亚'),
    faqLabel:         b('FAQ', '常见问题'),
    faqTitle:         b('FAQ', 'FAQ'),
    faq1Q:            b('What materials are the products made of?', '产品由哪些材料组成？'),
    faq1A:            b(
      'VESSEL uses five core structural materials: high-strength hot-dip galvanized steel frame, corrosion-resistant fluorocarbon-coated aluminum panels, low-radiation LOW-E insulating glass, high-thermal-performance thermal-break windows & doors, and rigid polyurethane spray insulation.',
      '采用「微宿五大结构主材」：高强度热镀锌钢骨架、耐腐蚀氟碳喷涂铝板、低辐射 LOW-E 中空玻璃、高热工性能断桥门窗、绝热喷涂硬质聚氨酯。'
    ),
    faq2Q:            b('What are the Gen6 upgrades?', '第六代产品有哪些升级亮点？'),
    faq2A:            b(
      'Gen6 key upgrades: interlocked physical waterproof roof (replacing sealant waterproofing), underfloor mechanical level (equipment bay), glue-free assembly (reduced VOC), and new VIIE Gen6 smart system.',
      '第六代主要升级：锁扣式物理防水屋顶（取代胶水防水）、设备层架构（底部设备仓）、无胶装配工艺（减少VOC），以及全新 VIIE Gen6 智控系统。'
    ),
    faq3Q:            b('Which models are available?', '目前有哪些型号可选？'),
    faq3A:            b(
      'Gen6: V9 (38㎡), E7 (38.8㎡), E6 (29.6㎡), E3 (19㎡); Gen5: V5 (24.8㎡), S5 (29.6㎡). Full customization supported.',
      'Gen6 系列：V9（38㎡）、E7（38.8㎡）、E6（29.6㎡）、E3（19㎡）；Gen5 系列：V5（24.8㎡）、S5（29.6㎡）等，支持全系定制。'
    ),
    faq4Q:            b('Can products adapt to extreme climates?', '产品能适应极端气候吗？'),
    faq4A:            b(
      'Tested for -32°C (Russia extreme cold) to 55°C (Saudi extreme heat). With thermal-break windows and polyurethane insulation, comfortable use all year round.',
      '经测试，可适用 -32℃（俄罗斯严寒环境）至 55℃（沙特高温环境），配合断桥门窗和聚氨酯喷涂隔热层，四季均可舒适使用。'
    ),
    faq5Q:            b('How is it transported? What is the HS code?', '如何运输？海关编码是什么？'),
    faq5A:            b(
      'Transported via 40ft Flat Rack Container, compliant with international shipping standards. HS Code: 9406.90 (Prefabricated Buildings).',
      '通过 40 尺平架集装箱（Flat Rack Container）运输，符合国际海运规范。海关商品编码：HS 9406.90（预制建筑物）。'
    ),
    faq6Q:            b('How long does production take? How is installation done?', '生产周期多久？安装方式？'),
    faq6A:            b(
      'Standard production cycle is 45 days. Ready to use upon delivery — just connect utilities. No traditional construction needed. Professional team installs on-site in ~2 hours.',
      '标准生产周期 45 天。出厂即成品，现场接通水电即可使用，无需传统建筑施工，专业团队现场安装约 2 小时完成。'
    ),
  },
  products: {
    heroLabel:        b('Products', '产品中心'),
    heroTitleGold:    b('Smart Prefab Architecture', '文旅智能装配建筑'),
    heroSubtitle:     b(
      '45-Day Factory Production | 2-Hour On-site Install | EU+US Certified | 30+ Countries Delivered',
      '45天工厂预制 | 2小时落地安装 | 欧盟+美国双认证 | 全球30+国家交付'
    ),
    specSize:         b('Size Range', '尺寸范围'),
    specSizeVal:      b('19㎡ — 38.8㎡', '19㎡ — 38.8㎡'),
    specProd:         b('Production Cycle', '标准生产周期'),
    specProdVal:      b('45 Days', '45天'),
    specInstall:      b('Installation', '安装时间'),
    specInstallVal:   b('2 Hours', '2小时'),
    specTemp:         b('Temperature Range', '适用温度'),
    specTempVal:      b('-32°C to 55°C', '-32℃ 至 55℃'),
    specTransport:    b('Transport', '运输方式'),
    specTransportVal: b('40ft Flat Rack Container', '40尺平架集装箱'),
    specHS:           b('HS Code', '海关编码'),
    specHSVal:        b('HS 9406.90', 'HS 9406.90'),
    gen6Label:        b('6th Generation · Latest', '第六代 · 最新系列'),
    gen6Title:        b('Gen6 Series', 'Gen6 系列'),
    gen5Label:        b('5th Generation · Classic', '第五代 · 经典系列'),
    gen5Title:        b('Gen5 Series', 'Gen5 系列'),
    productCount:     b('{n} Models', '{n} 款产品'),
    tableTitle:       b('Gen6 Comparison', 'Gen6 系列对比'),
    tableLabel:       b('Model Selection Guide', '选型参考'),
    thModel:          b('Model', '型号'),
    thSize:           b('Dimensions', '尺寸'),
    thArea:           b('Floor Area', '面积'),
    thPower:          b('Power', '电功率'),
    thCapacity:       b('Capacity', '容纳人数'),
    thScenario:       b('Scenario', '适用场景'),
    detailLink:       b('Details →', '详情 →'),
    viewDetail:       b('View Details →', '查看详情 →'),
    faq1Q:            b('How long is production?', '生产周期多久？'),
    faq1A:            b(
      'Standard 45 days. Rush options available.',
      '标准生产周期 45 天，可根据项目排期协商加急方案。'
    ),
    faq2Q:            b('What climates are supported?', '适用哪些气候？'),
    faq2A:            b(
      'Tested for -32°C (Russia) to 55°C (Saudi Arabia).',
      '产品经测试，可适用 -32℃（俄罗斯）至 55℃（沙特）极端气候条件。'
    ),
    faq3Q:            b('How is it transported?', '如何运输？'),
    faq3A:            b(
      'Via 40ft Flat Rack Container, HS 9406.90.',
      '通过 40 尺平架集装箱运输，符合国际海运规范，海关编码 HS 9406.90。'
    ),
    // Filter bar
    filterBarLabel:    b('Filter Products', '筛选产品'),
    filterSizeAll:     b('All Sizes', '全部面积'),
    filterSizeS:       b('Compact ≤25㎡', '小型 ≤25㎡'),
    filterSizeM:       b('Medium 26-35㎡', '中型 26-35㎡'),
    filterSizeL:       b('Large ≥36㎡', '大型 ≥36㎡'),
    filterTypeAll:     b('All Types', '全部类型'),
    filterTypeCompact: b('Compact', '紧凑型'),
    filterTypeStd:     b('Standard', '标准型'),
    filterTypeLux:     b('Luxury', '豪华型'),
    filterGenAll:      b('All Generations', '全部代别'),
    filterGen6:        b('Gen6 · 6th Generation', '第六代 Gen6'),
    filterGen5:        b('Gen5 · 5th Generation', '第五代 Gen5'),
    sortDefault:       b('Default', '默认排序'),
    sortPriceAsc:      b('Price: Low to High', '价格从低到高'),
    sortPriceDesc:     b('Price: High to Low', '价格从高到低'),
    sortAreaAsc:       b('Size: Small to Large', '面积从小到大'),
    sortAreaDesc:      b('Size: Large to Small', '面积从大到小'),
    foundCount:        b('{n} models found', '共找到 {n} 款产品'),
    noResults:         b('No products found', '暂无符合条件的产品'),
    loginToView:       b('Login to view price', '登录查看价格'),
    viewDetails:       b('View Details →', '查看详情 →'),
    gridView:          b('Grid view', '网格视图'),
    listView:          b('List view', '列表视图'),
  },
  productDetail: {
    breadcrumbProducts: b('Products', '产品'),
    specArea:           b('Floor Area', '建筑面积'),
    specDimensions:     b('Dimensions', '外形尺寸'),
    specPower:          b('Power', '额定功率'),
    specCapacity:       b('Capacity', '容纳人数'),
    specWeight:         b('Weight', '自重'),
    deliveryStrip:      b('45-Day Delivery · 2-Hour Install · Free Port Shipping', '45天交付 · 2小时安装 · 全球包邮至港口'),
    inquireBtn:         b('Inquire for Price', '立即咨询报价'),
    otherProducts:      b('Other Products', '查看其他产品'),
    priceLabel:         b('Reference Price', '参考价格'),
    loginToView:        b('Login to View Price', '登录查看价格'),
    priceNote:          b(
      'Includes basic assembly. Excludes shipping and on-site installation. Contact consultant for exact quote.',
      '含基础装配，不含运输及现场安装费用。具体报价请联系顾问。'
    ),
    designLabel:        b('Design Philosophy', '设计理念'),
    featuresLabel:      b('Core Features', '核心特性'),
    featuresTitle:      b('6 Design Highlights', '六大设计亮点'),
    spacesLabel:        b('Space Layout', '空间配置'),
    spacesTitle:        b('Functional Zone Planning', '功能区域规划'),
    materialsLabel:     b('Five Core Materials', '五大结构主材'),
    materialsTitle:     b('Industrial-Grade Build Standard', '工业级建造标准'),
    materialsNote:      b(
      'Ready to use upon delivery — just connect utilities. No traditional construction needed.',
      '出厂即成品，现场接通水电即可使用，无需传统建筑施工'
    ),
    specsLabel:         b('Full Specifications', '完整规格参数'),
    prevProduct:        b('Previous', '上一款'),
    nextProduct:        b('Next', '下一款'),
    home:               b('Home', '首页'),
    startCoop:          b('Start Cooperation', '开始合作'),
    interested:         b('Interested in {model} {gen}?', '对 {model} {gen} 感兴趣？'),
    consultDesc:        b(
      'Fill in the inquiry form, and our professional consultant will contact you within 24 hours with a customized plan and quote.',
      '填写需求表单，专业顾问将在 24 小时内联系您，提供定制方案与报价'
    ),
    prevProductLabel:   b('Previous Product', '上一个产品'),
    nextProductLabel:   b('Next Product', '下一个产品'),
    specModel:          b('Model', '型号'),
    specLength:         b('Length', '外形长度'),
    specWidth:          b('Width', '外形宽度'),
    specHeight:         b('Height', '外形高度'),
    specFloorArea:      b('Floor Area', '建筑面积'),
    specSeries:         b('Series', '系列'),
  },
  cases: {
    heroLabel:          b('Project Cases', '项目案例'),
    heroTitle1:         b('300+ Premium Camps', '全国 300+ 高端营地'),
    heroTitleGold:      b('Project Delivery Cases', '项目交付案例'),
    heroSubtitle:       b(
      'Tourism resorts, commercial spaces, public facilities — spanning 30+ countries',
      '覆盖文旅度假、商业空间、公共设施，遍布全球30余个国家与地区'
    ),
    stat1Val:           b('300+', '300+'),
    stat1:              b('Projects Delivered', '全球交付项目'),
    stat2Val:           b('30+', '30+'),
    stat2:              b('Export Countries', '出口国家地区'),
    stat3Val:           b('100+', '100+'),
    stat3:              b('Cities Covered', '覆盖城市'),
    stat4Val:           b('8 Yrs', '8年'),
    stat4:              b('Brand Heritage', '品牌积累'),
    filterAll:          b('All Cases', '全部案例'),
    filterTourism:      b('Tourism Resort', '文旅度假'),
    filterCommercial:   b('Commercial', '商业空间'),
    filterPublic:       b('Public', '公共设施'),
    filterOverseas:     b('Overseas', '境外项目'),
    viewDetail:         b('View Project Details', '查看项目详情'),
    ctaBadge:           b('Start Your Project', '开启您的项目'),
    ctaTitle:           b('Interested in developing a premium camp?', '有意向开发高端营地项目？'),
    ctaSubtitle:        b(
      'Our consultants have served 300+ camp investors with full-cycle support from site selection to operation.',
      '我们的项目顾问已服务 300+ 营地投资人，提供从选址、规划到建设、运营的全流程支持'
    ),
    ctaBtn1:            b('Book a Consultant', '预约项目顾问'),
    specArea:           b('Site Area', '占地面积'),
    specInvestment:     b('Investment', '投资规模'),
    specUnits:          b('Units Purchased', '采购数量'),
    specProducts:       b('Products', '采购产品'),
  },
  news: {
    heroLabel:          b('News & Events', '新闻活动'),
    heroTitleGold:      b('Latest Updates', '最新动态'),
    heroSubtitle:       b(
      'Product launches, industry insights, brand partnerships, trade shows — stay updated with VESSEL.',
      '产品发布、行业资讯、品牌合作、展会活动，全面了解 VESSEL 最新进展'
    ),
    filterAll:          b('All News', '全部资讯'),
    topBadge:           b('Pinned', '置顶'),
    readMore:           b('Read More', '阅读更多'),
    readFull:           b('Read Full Article', '阅读全文'),
    loadMore:           b('Load More', '加载更多资讯'),
  },
  display: {
    refPrice:           b('Reference Price', '参考价格'),
    paused:             b('Paused', '已暂停'),
  },
  auth: {
    loginTitle:         b('Sign In', '登录账号'),
    loginSubtitle:      b('Sign in to view full product pricing', '登录后查看完整产品价格'),
    googleBtn:          b('Continue with Google', '使用 Google 账号登录'),
    orEmail:            b('or use email', '或使用邮箱'),
    emailLabel:         b('Email', '邮箱地址'),
    passwordLabel:      b('Password', '密码'),
    loginBtn:           b('Sign In', '登录'),
    signingIn:          b('Signing in...', '登录中...'),
    loginError:         b('Incorrect email or password', '邮箱或密码错误，请重试'),
    noAccount:          b("Don't have an account?", '还没有账号？'),
    registerLink:       b('Register now', '立即注册'),
    registerTitle:      b('Create Account', '创建账号'),
    registerSubtitle:   b('Register to view full pricing and resources', '注册后查看完整产品价格与资料'),
    googleRegBtn:       b('Continue with Google', '使用 Google 账号注册'),
    orFill:             b('or fill in details', '或填写信息注册'),
    roleLabel:          b('Select your role *', '选择您的身份 *'),
    roleBuyer:          b('Buyer', '采购商'),
    roleBuyerDesc:      b('Plan to purchase for commercial projects', '计划采购产品用于商业项目'),
    roleAgent:          b('Agent', '代理商'),
    roleAgentDesc:      b('Interested in distributing VESSEL products', '希望代理销售 VESSEL 产品'),
    roleIndividual:     b('Individual', '个人用户'),
    roleIndividualDesc: b('Personal stay or vacation use', '个人旅居或度假使用'),
    nameLabel:          b('Full Name', '姓名'),
    namePlaceholder:    b('Your name', '您的姓名'),
    roleError:          b('Please select your role', '请选择您的身份'),
    registerError:      b('Registration failed, please try again', '注册失败，请重试'),
    registerBtn:        b('Create Account', '创建账号'),
    registering:        b('Creating...', '注册中...'),
    hasAccount:         b('Already have an account?', '已有账号？'),
    loginLink:          b('Sign in', '立即登录'),
  },
  form: {
    inquiryTypeLabel:   b('Inquiry Type *', '咨询类型 *'),
    nameLabel:          b('Name *', '姓名 *'),
    phoneLabel:         b('Phone *', '联系电话 *'),
    emailLabel:         b('Email *', '邮箱 *'),
    companyLabel:       b('Company', '公司名称'),
    locationLabel:      b('Country / City', '所在国家/城市'),
    projectTypeLabel:   b('Project Type', '项目类型'),
    quantityLabel:      b('Quantity (units)', '订购数量（台）'),
    modelLabel:         b('Preferred Model', '产品型号偏好'),
    remarksLabel:       b('Remarks', '备注'),
    namePlaceholder:    b('Your name', '您的姓名'),
    phonePlaceholder:   b('+86 138 0000 0000', '+86 138 0000 0000'),
    emailPlaceholder:   b('your@email.com', 'your@email.com'),
    companyPlaceholder: b('Company / Organization', '公司/组织名称'),
    locationPlaceholder: b('e.g. Guangzhou, China', '如：中国·广州'),
    projectTypePlaceholder: b('Select project type', '请选择项目类型'),
    quantityPlaceholder: b('Estimated quantity', '预计采购数量'),
    modelPlaceholder:   b('Select model', '请选择'),
    remarksPlaceholder: b(
      'Describe your project, special requirements or questions...',
      '请描述您的项目概况、特殊需求或其他问题...'
    ),
    submitBtn:          b('Submit Inquiry', '提交咨询'),
    submitting:         b('Submitting...', '提交中...'),
    submitNote:         b(
      'Our consultant will contact you within 24 hours after submission',
      '提交后专业顾问将在 24 小时内与您取得联系'
    ),
    successBadge:       b('Submitted', '提交成功'),
    successTitle:       b('Thank you for your inquiry', '感谢您的咨询'),
    successMsg:         b(
      'We have received your message. Our consultant will contact you within 24 hours.',
      '我们已收到您的留言，专业顾问将在 24 小时内与您联系。'
    ),
    successEmail:       b('Confirmation email sent to your inbox.', '确认邮件已发送至您的邮箱。'),
    resubmit:           b('Submit Again', '再次提交'),
    emailRequired:      b('Email is required', '请填写邮箱地址'),
    emailInvalid:       b('Please enter a valid email address', '请输入有效的邮箱地址'),
    networkError:       b('Network error, please check connection', '网络错误，请检查连接后重试'),
    submitFailed:       b('Submission failed, please try again', '提交失败，请稍后再试'),
    inquiry1:           b('Get Materials', '索取资料'),
    inquiry2:           b('Price Inquiry', '咨询报价'),
    inquiry3:           b('Agency', '合作代理'),
    inquiry4:           b('Custom Service', '定制服务'),
    project1:           b('Tourism Resort Camp', '文旅度假营地'),
    project2:           b('Boutique Hotel & Inn', '精品酒店民宿'),
    project3:           b('Commercial Space', '商业空间'),
    project4:           b('Public Facilities', '公共设施'),
    project5:           b('Other', '其他'),
    modelUnknown:       b('Not Yet Decided', '暂未确定'),
    successEmailNote:   b('A confirmation email has been sent to your inbox.', '确认邮件已发送至您的邮箱。'),
  },
};

export type I18n = typeof i18n;
