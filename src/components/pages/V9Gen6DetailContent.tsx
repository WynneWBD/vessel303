'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import { catalogProducts } from '@/lib/products';

// ─── Gallery data ────────────────────────────────────────────────────────────
const RENDERS = [
  { src: '/images/products/v9-gen6/main.jpg',        label_cn: '外观主图',    label_en: 'Main View' },
  { src: '/images/products/v9-gen6/render-full.png', label_cn: '全景渲染',    label_en: 'Full Render' },
  { src: '/images/products/v9-gen6/render-03.jpg',   label_cn: '角度03',      label_en: 'View 03' },
  { src: '/images/products/v9-gen6/render-05.jpg',   label_cn: '角度05',      label_en: 'View 05' },
  { src: '/images/products/v9-gen6/render-07.png',   label_cn: '角度07',      label_en: 'View 07' },
  { src: '/images/products/v9-gen6/render-08.jpg',   label_cn: '角度08',      label_en: 'View 08' },
  { src: '/images/products/v9-gen6/render-09.jpg',   label_cn: '角度09',      label_en: 'View 09' },
  { src: '/images/products/v9-gen6/render-10.jpg',   label_cn: '超流体立面',  label_en: 'Fluid Facade' },
  { src: '/images/products/v9-gen6/angle.jpg',       label_cn: '大斜角',      label_en: 'Side Angle' },
  { src: '/images/products/v9-gen6/bedroom.jpg',     label_cn: '卧室净高',    label_en: 'Bedroom Height' },
  { src: '/images/products/v9-gen6/lights.jpg',      label_cn: '灯环效果',    label_en: 'Lighting Effect' },
];

const PHOTOS = Array.from({ length: 21 }, (_, i) => ({
  src: `/images/products/v9-gen6/photo-${String(i).padStart(2, '0')}.jpg`,
  label_cn: `实拍 ${String(i).padStart(2, '0')}`,
  label_en: `Photo ${String(i).padStart(2, '0')}`,
})).concat([{
  src: '/images/products/v9-gen6/photo-2002.jpg',
  label_cn: '实拍 2002',
  label_en: 'Photo 2002',
}]);

const ALL_IMAGES = [...RENDERS, ...PHOTOS];

// ─── Spec grid ───────────────────────────────────────────────────────────────
const SPECS = [
  { label_cn: '建筑面积', label_en: 'Floor Area',    value: '38.8 ㎡' },
  { label_cn: '外形尺寸', label_en: 'Dimensions',    value: '11.4 × 3.4 × 3.4 m' },
  { label_cn: '额定功率', label_en: 'Power',          value: '16 / 24 kW' },
  { label_cn: '容纳人数', label_en: 'Capacity',       value: '2 – 4 人' },
  { label_cn: '自重',     label_en: 'Weight',         value: '约 9 吨' },
  { label_cn: '代别',     label_en: 'Generation',     value: 'Gen6 第六代' },
];

// ─── Config groups ────────────────────────────────────────────────────────────
interface ConfigGroup {
  id: string;
  label_cn: string;
  label_en: string;
  items_cn: string[];
  items_en: string[];
}

const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: 'hvac',
    label_cn: '空调与通风',
    label_en: 'HVAC & Ventilation',
    items_cn: ['隐藏式中央空调（冷暖两用）', '新风换气系统', '空气净化过滤'],
    items_en: ['Concealed central A/C (heating & cooling)', 'Fresh-air ventilation system', 'Air purification filter'],
  },
  {
    id: 'bathroom',
    label_cn: '卫浴系统',
    label_en: 'Bathroom System',
    items_cn: ['独立卫浴空间', '三分离设计（如厕 / 淋浴 / 洗漱）', '80L 加热热水器', '智能镜柜（可选带除雾）'],
    items_en: ['Private bathroom', '3-zone separation (toilet / shower / vanity)', '80L water heater', 'Smart mirror cabinet (defogging optional)'],
  },
  {
    id: 'windows',
    label_cn: '门窗系统',
    label_en: 'Door & Window System',
    items_cn: ['17㎡ 落地景观窗', '180° 全景玻璃', '高性能断桥铝合金门窗', '电动遮阳帘（全遮光）', 'LOW-E 中空玻璃（节能隔热）'],
    items_en: ['17㎡ floor-to-ceiling panoramic windows', '180° panoramic glass', 'High-performance thermal-break aluminum frames', 'Electric blackout curtains', 'LOW-E insulating glass (energy saving)'],
  },
  {
    id: 'lighting',
    label_cn: '照明系统',
    label_en: 'Lighting System',
    items_cn: ['双层氛围照明设计', '全铝曲面天花板', '可调色温 LED 主灯', '轮廓灯带（红色 / 金色可选）'],
    items_en: ['Dual-layer ambient lighting', 'Full aluminum curved ceiling', 'Tunable CCT LED main lights', 'Outline accent lights (red / gold optional)'],
  },
  {
    id: 'smart',
    label_cn: '智能系统',
    label_en: 'Smart System',
    items_cn: ['VIIE 微宿第六代智能交互系统', '智能门锁（指纹 / 密码 / APP）', '手机 APP 远程控制', 'AI 语音控制（灯光 / 窗帘 / 空调）', '全屋传感器联动'],
    items_en: ['VIIE Gen6 smart interaction system', 'Smart lock (fingerprint / code / APP)', 'Remote control via smartphone APP', 'AI voice control (lights / curtains / A/C)', 'Whole-home sensor automation'],
  },
  {
    id: 'kitchen',
    label_cn: '厨房配置',
    label_en: 'Kitchen',
    items_cn: ['2.3m 超长延伸橱柜', '四座岛台餐桌', '冰箱接口预留', '洗碗机接口预留', '抽油烟机接口预留'],
    items_en: ['2.3m extended kitchen cabinet', '4-seat island dining table', 'Refrigerator space reserved', 'Dishwasher space reserved', 'Range hood space reserved'],
  },
  {
    id: 'bedroom',
    label_cn: '卧室配置',
    label_en: 'Bedroom',
    items_cn: ['1.8m 豪华大床', '全包覆集成衣柜', '集成梳妆台', '床头集成控制系统（灯光 / 空调 / 窗帘）'],
    items_en: ['1.8m luxury bed', 'Full wrap-around built-in wardrobe', 'Integrated vanity dresser', 'Bedside control panel (lights / A/C / curtains)'],
  },
  {
    id: 'structure',
    label_cn: '结构主材',
    label_en: 'Core Materials',
    items_cn: ['热镀锌钢骨架（壁厚 4.75mm）', '氟碳喷涂铝板（43μm 耐候涂层）', 'LOW-E 三玻两腔中空玻璃', '硬质聚氨酯喷涂保温', 'SPC 防水地板'],
    items_en: ['Hot-dip galvanized steel frame (4.75mm wall)', 'Fluorocarbon aluminum cladding (43μm coating)', 'LOW-E triple-pane insulating glass', 'Rigid polyurethane spray insulation', 'SPC waterproof flooring'],
  },
];

// ─── Business terms ───────────────────────────────────────────────────────────
const TERMS = [
  { cn: '交付方式', en: 'Delivery',        val_cn: '工厂自提（EXW）',            val_en: 'Ex Works (EXW)' },
  { cn: '发货地点', en: 'Origin',           val_cn: '中国 · 广东佛山',             val_en: 'Foshan, Guangdong, China' },
  { cn: '付款条款', en: 'Payment',          val_cn: '预付 50%，发货前 50%',        val_en: '50% deposit, 50% before shipment' },
  { cn: '生产周期', en: 'Lead Time',        val_cn: '45 天',                      val_en: '45 days' },
  { cn: '水电标准', en: 'Utilities',        val_cn: '适配中国 / 欧美 / 海外标准',  val_en: 'CN / EU / US standards supported' },
  { cn: '售后支持', en: 'After-sales',      val_cn: '原厂保修 1 年，终身售后',     val_en: '1-year factory warranty, lifetime support' },
  { cn: '起订量',   en: 'Min. Order',       val_cn: '1 台起订',                   val_en: '1 unit minimum' },
];

// ─── Related V9 products ──────────────────────────────────────────────────────
const RELATED = catalogProducts.filter(
  (p) => p.productSeries === 'V9' && p.id !== 'v9-gen6-standard'
).slice(0, 4);

// ─── Main component ───────────────────────────────────────────────────────────
interface Props { isLoggedIn: boolean }

export default function V9Gen6DetailContent({ isLoggedIn }: Props) {
  const { lang } = useLanguage();
  const t = useT();

  // Gallery state
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = ALL_IMAGES[activeIdx] ?? ALL_IMAGES[0];

  // Config expand state
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleGroup = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Inquiry form state
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', quantity: '1', remarks: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryType: '咨询报价',
          model: 'V9 Gen6',
          name: form.name,
          phone: form.phone || form.email,
          email: form.email || form.phone,
          location: form.location,
          quantity: form.quantity,
          remarks: form.remarks,
          company: '',
          projectType: '',
        }),
      });
      setFormStatus(res.ok ? 'sent' : 'error');
    } catch {
      setFormStatus('error');
    }
  };

  const gold = '#c9a84c';

  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative h-[55vh] min-h-[340px] overflow-hidden">
        <Image
          src="/images/products/v9-gen6/main.jpg"
          alt="VESSEL V9 Gen6"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/55 to-[#0a0a0a]/15" />
        {/* Breadcrumb */}
        <div className="absolute top-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-[11px] text-white/35 tracking-wider">
            <Link href="/" className="hover:text-[#c9a84c] transition-colors">{t(i18n.productDetail.home)}</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#c9a84c] transition-colors">{t(i18n.productDetail.breadcrumbProducts)}</Link>
            <span>/</span>
            <span className="text-white/55">V9 Gen6</span>
          </nav>
        </div>
        {/* Title */}
        <div className="absolute bottom-10 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-[11px] tracking-[0.3em] text-[#c9a84c] uppercase mb-2 font-medium">
            VESSEL 微宿® · Gen6 · {lang === 'en' ? 'Flagship Long-Stay' : '旗舰家居版'}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-wide">
            <span style={{ color: gold }}>V9</span>
            <span className="text-white ml-4">Gen6</span>
          </h1>
          <p className="mt-3 text-white/50 text-sm sm:text-base tracking-wider max-w-xl">
            {lang === 'en'
              ? '38.8㎡ · 180° Panoramic Glass · VIIE Smart System · Global Delivery'
              : '38.8㎡ · 180° 全景玻璃 · VIIE 智能系统 · 全球交付'}
          </p>
        </div>
      </section>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12">

          {/* ════ LEFT COLUMN ════════════════════════════════════════════ */}
          <div className="space-y-14">

            {/* 1. Gallery */}
            <section>
              {/* Main image */}
              <div className="relative aspect-[16/10] bg-[#111] overflow-hidden group">
                <Image
                  key={activeImage.src}
                  src={activeImage.src}
                  alt={lang === 'en' ? activeImage.label_en : activeImage.label_cn}
                  fill
                  className="object-cover object-center transition-opacity duration-300"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                {/* Nav arrows */}
                <button
                  onClick={() => setActiveIdx((i) => (i - 1 + ALL_IMAGES.length) % ALL_IMAGES.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#c9a84c] hover:text-black hover:border-[#c9a84c]"
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  onClick={() => setActiveIdx((i) => (i + 1) % ALL_IMAGES.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#c9a84c] hover:text-black hover:border-[#c9a84c]"
                  aria-label="Next"
                >
                  ›
                </button>
                {/* Counter */}
                <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 text-[10px] text-white/60 tracking-widest">
                  {activeIdx + 1} / {ALL_IMAGES.length}
                </div>
                {/* Label */}
                <div className="absolute bottom-3 left-3 text-[10px] bg-black/70 px-2 py-1 text-white/50 tracking-wider">
                  {lang === 'en' ? activeImage.label_en : activeImage.label_cn}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
                {ALL_IMAGES.map((img, idx) => (
                  <button
                    key={img.src}
                    onClick={() => setActiveIdx(idx)}
                    className={`relative shrink-0 w-20 h-14 overflow-hidden border-2 transition-all duration-150 ${
                      idx === activeIdx
                        ? 'border-[#c9a84c]'
                        : 'border-transparent opacity-50 hover:opacity-80 hover:border-white/30'
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt={lang === 'en' ? img.label_en : img.label_cn}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Spec grid */}
            <section>
              <SectionLabel cn="核心规格参数" en="Core Specifications" lang={lang} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/8 border border-white/8 mt-4">
                {SPECS.map(({ label_cn, label_en, value }) => (
                  <div key={label_cn} className="bg-[#0f0f0f] p-5">
                    <div className="text-white/35 text-[10px] tracking-[0.2em] uppercase mb-2">
                      {lang === 'en' ? label_en : label_cn}
                    </div>
                    <div className="text-white font-bold text-base tracking-wide">{value}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Config list */}
            <section>
              <SectionLabel cn="完整配置清单" en="Full Configuration" lang={lang} />
              <div className="mt-4 space-y-1">
                {CONFIG_GROUPS.map((group) => {
                  const open = !collapsed.has(group.id);
                  const items = lang === 'en' ? group.items_en : group.items_cn;
                  return (
                    <div key={group.id} className="border border-white/8 overflow-hidden">
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#111] hover:bg-[#151515] transition-colors text-left"
                      >
                        <span className="text-sm font-semibold tracking-wider text-white/85">
                          {lang === 'en' ? group.label_en : group.label_cn}
                        </span>
                        <span className={`text-[#c9a84c] text-lg leading-none transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>
                          ›
                        </span>
                      </button>
                      {open && (
                        <ul className="px-5 py-3 bg-[#0d0d0d] space-y-2">
                          {items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-white/55">
                              <span className="text-[#c9a84c] text-[10px] mt-1 shrink-0">▸</span>
                              <span className="leading-relaxed tracking-wide">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. Design philosophy */}
            <section>
              <SectionLabel cn="设计理念" en="Design Philosophy" lang={lang} />
              <div className="mt-4 border-l-2 border-[#c9a84c]/40 pl-6 space-y-4">
                {lang === 'zh' ? (
                  <>
                    <p className="text-white/65 text-sm leading-[1.9] tracking-wide">
                      VESSEL V9 作为首款定位全球市场的长居度假型产品，38.8㎡ 的空间内囊括主卧、卫浴、起居与餐厨四大完整功能区。聚焦舒适性与实用性，完美兼容海内外各类高端家电的集成需求，以工业级精度重新定义高品质移动生活方式。
                    </p>
                    <p className="text-white/50 text-sm leading-[1.9] tracking-wide">
                      遵循「钻石切割」设计理念，弧线与折线交织，呈现刚柔并济的建筑美学。17.0㎡ 超大采光面，42.39% 紫外线隔绝率，让自然光线在每一天的不同时刻演绎专属的光影故事。
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white/65 text-sm leading-[1.9] tracking-wide">
                      VESSEL V9 is our first long-stay model purpose-built for the global market. 38.8㎡ includes four fully functional zones: bedroom, bathroom, living room, and kitchen-dining. Focused on comfort and practicality, compatible with premium appliances worldwide — redefining luxury prefab living with industrial precision.
                    </p>
                    <p className="text-white/50 text-sm leading-[1.9] tracking-wide">
                      Inspired by the "diamond cut" design language, curves and facets interweave to create an architecture of both strength and elegance. The 17.0㎡ panoramic glazing with 42.39% UV rejection lets natural light tell a different story at every hour of the day.
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* 5. Real photo gallery */}
            <section>
              <SectionLabel cn="真实落地实拍" en="Real Project Photos" lang={lang} />
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PHOTOS.map((img, idx) => (
                  <button
                    key={img.src}
                    onClick={() => setActiveIdx(RENDERS.length + idx)}
                    className="relative aspect-[4/3] overflow-hidden group bg-[#111]"
                  >
                    <Image
                      src={img.src}
                      alt={lang === 'en' ? img.label_en : img.label_cn}
                      fill
                      loading="lazy"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-white/30 text-xs tracking-wider">
                {lang === 'en' ? 'Click any photo to view in gallery above' : '点击图片可在上方图库中查看大图'}
              </p>
            </section>

            {/* 6. Transport */}
            <section>
              <SectionLabel cn="运输说明" en="Shipping & Transport" lang={lang} />
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="relative aspect-video bg-[#111] overflow-hidden">
                  <Image
                    src="/images/products/v9-gen6/exploded-view.png"
                    alt="Exploded view"
                    fill
                    className="object-contain object-center p-4"
                    sizes="(max-width: 640px) 100vw, 30vw"
                  />
                </div>
                <div className="space-y-3 text-sm text-white/55 leading-relaxed">
                  <div className="flex gap-2">
                    <span className="text-[#c9a84c] shrink-0">▸</span>
                    <span>{lang === 'en' ? 'Container: 40ft Flat Rack (11.762 × 2.240 × 2.034 m)' : '集装箱规格：40ft Flat Rack（11.762 × 2.240 × 2.034 m）'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#c9a84c] shrink-0">▸</span>
                    <span>{lang === 'en' ? 'Complies with international sea freight and port lifting standards worldwide' : '符合国际海运及各国港口标准吊装规格'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#c9a84c] shrink-0">▸</span>
                    <span>{lang === 'en' ? 'HS Code: 9406.90 (Prefabricated Buildings)' : 'HS 编码：9406.90（装配式房屋）'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#c9a84c] shrink-0">▸</span>
                    <span>{lang === 'en' ? 'On-site installation: approx. 2 hours with standard crane' : '现场安装：约 2 小时，标准吊装设备即可'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#c9a84c] shrink-0">▸</span>
                    <span>{lang === 'en' ? 'Free port-to-port shipping included (select regions)' : '部分地区免费送至目的港'}</span>
                  </div>
                </div>
              </div>
            </section>

          </div>{/* end left column */}

          {/* ════ RIGHT COLUMN (sticky) ═══════════════════════════════════ */}
          <div className="lg:sticky lg:top-[80px] lg:self-start space-y-4">

            {/* Price card */}
            <div className="bg-[#111] border border-white/8 p-6">
              <div className="text-[10px] tracking-[0.25em] text-[#c9a84c] uppercase mb-3">
                {t(i18n.productDetail.priceLabel)}
              </div>
              {isLoggedIn ? (
                <div>
                  <div className="text-3xl font-black text-white tracking-wide">
                    ¥ 296,000 <span className="text-base font-normal text-white/40">{lang === 'en' ? 'from' : '起'}</span>
                  </div>
                  <p className="mt-2 text-white/35 text-xs leading-relaxed">
                    {lang === 'en'
                      ? 'Base config, inc. VAT, ex-works. Shipping & installation extra.'
                      : '基础配置含税出厂价，不含运输及现场安装费用。'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-black text-white/20 tracking-widest select-none">
                    ¥ *** , ***
                  </div>
                  <Link
                    href="/login"
                    className="mt-3 flex items-center gap-2 text-xs text-[#c9a84c] hover:text-[#dbb85e] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="tracking-wider">{t(i18n.productDetail.loginToView)}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Delivery strip */}
            <div className="bg-[#c9a84c]/8 border border-[#c9a84c]/20 px-5 py-3">
              <p className="text-[#c9a84c] text-[11px] tracking-wider leading-relaxed">
                {t(i18n.productDetail.deliveryStrip)}
              </p>
            </div>

            {/* Business terms */}
            <div className="bg-[#111] border border-white/8 p-5">
              <div className="text-[10px] tracking-[0.25em] text-[#c9a84c] uppercase mb-4">
                {lang === 'en' ? 'Trade Terms' : '商务条款'}
              </div>
              <dl className="space-y-2.5">
                {TERMS.map(({ cn, en, val_cn, val_en }) => (
                  <div key={cn} className="flex justify-between gap-3 text-xs border-b border-white/5 pb-2.5">
                    <dt className="text-white/35 tracking-wider shrink-0">{lang === 'en' ? en : cn}</dt>
                    <dd className="text-white/70 tracking-wide text-right">{lang === 'en' ? val_en : val_cn}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Contact info */}
            <div className="bg-[#111] border border-white/8 p-5 space-y-3">
              <div className="text-[10px] tracking-[0.25em] text-[#c9a84c] uppercase mb-1">
                {lang === 'en' ? 'Contact Us' : '联系方式'}
              </div>
              <a
                href="https://wa.me/8618024176679"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs text-white/60 hover:text-[#c9a84c] transition-colors"
              >
                <span className="text-base">📱</span>
                <span className="tracking-wider">WhatsApp: +86 180-2417-6679</span>
              </a>
              <a
                href="tel:4008090303"
                className="flex items-center gap-2.5 text-xs text-white/60 hover:text-[#c9a84c] transition-colors"
              >
                <span className="text-base">📞</span>
                <span className="tracking-wider">400-8090-303</span>
              </a>
              <a
                href="mailto:vessel.sale@303industries.cn"
                className="flex items-center gap-2.5 text-xs text-white/60 hover:text-[#c9a84c] transition-colors break-all"
              >
                <span className="text-base">✉️</span>
                <span className="tracking-wider">vessel.sale@303industries.cn</span>
              </a>
            </div>

            {/* Inquiry form */}
            <div className="bg-[#111] border border-white/8 p-5">
              <div className="text-[10px] tracking-[0.25em] text-[#c9a84c] uppercase mb-4">
                {lang === 'en' ? 'Quick Inquiry' : '快速询价'}
              </div>

              {formStatus === 'sent' ? (
                <div className="py-6 text-center">
                  <div className="text-[#c9a84c] text-2xl mb-2">✓</div>
                  <p className="text-white/60 text-sm tracking-wider">
                    {lang === 'en' ? 'Inquiry sent! We\'ll reply within 24h.' : '已提交！顾问将在 24 小时内联系您。'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder={lang === 'en' ? 'Your name *' : '姓名 *'}
                    value={form.name}
                    onChange={setField('name')}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-[#c9a84c]/40 tracking-wider"
                  />
                  <input
                    type="tel"
                    required
                    placeholder={lang === 'en' ? 'Phone *' : '联系电话 *'}
                    value={form.phone}
                    onChange={setField('phone')}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-[#c9a84c]/40 tracking-wider"
                  />
                  <input
                    type="email"
                    required
                    placeholder={lang === 'en' ? 'Email *' : '邮箱 *'}
                    value={form.email}
                    onChange={setField('email')}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-[#c9a84c]/40 tracking-wider"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'Country / City' : '所在国家 / 城市'}
                    value={form.location}
                    onChange={setField('location')}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-[#c9a84c]/40 tracking-wider"
                  />
                  <select
                    value={form.quantity}
                    onChange={setField('quantity')}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2.5 text-xs text-white/70 outline-none focus:border-[#c9a84c]/40 tracking-wider cursor-pointer"
                  >
                    {['1', '2–5', '6–10', '11–20', '20+'].map((q) => (
                      <option key={q} value={q} className="bg-[#111]">
                        {lang === 'en' ? `Quantity: ${q}` : `采购数量：${q} 台`}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={3}
                    placeholder={lang === 'en' ? 'Project description / requirements' : '项目描述 / 需求说明'}
                    value={form.remarks}
                    onChange={setField('remarks')}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-[#c9a84c]/40 tracking-wider resize-none"
                  />
                  {formStatus === 'error' && (
                    <p className="text-red-400 text-xs tracking-wider">
                      {lang === 'en' ? 'Submit failed. Please try again.' : '提交失败，请重试。'}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={formStatus === 'sending'}
                    className="w-full py-3 bg-[#c9a84c] text-[#0a0a0a] text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#b8973d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {formStatus === 'sending'
                      ? (lang === 'en' ? 'Sending...' : '提交中...')
                      : (lang === 'en' ? 'Send Inquiry' : '立即发送询价')}
                  </button>
                </form>
              )}
            </div>

          </div>{/* end right column */}
        </div>
      </div>

      {/* ── Related Products ──────────────────────────────────────────── */}
      {RELATED.length > 0 && (
        <section className="border-t border-white/8 bg-[#0d0d0d]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="text-[10px] tracking-[0.3em] text-[#c9a84c] uppercase mb-6">
              {lang === 'en' ? 'Other V9 Series Variants' : 'V9 系列其他版本'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {RELATED.map((p) => (
                <Link
                  key={p.id}
                  href={p.detailSlug ? `/products/${p.detailSlug}` : `/products/${p.id}`}
                  className="group block bg-[#111] border border-white/8 hover:border-[#c9a84c]/40 overflow-hidden transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden bg-[#0d0d0d]">
                    <Image
                      src={p.image}
                      alt={lang === 'en' ? p.name_en : p.name_cn}
                      fill
                      loading="lazy"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#c9a84c] text-[#0a0a0a]">
                        {lang === 'en' ? p.badge_en : p.badge_cn}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-white/70 text-xs font-semibold tracking-wider leading-snug">
                      {lang === 'en' ? p.name_en : p.name_cn}
                    </div>
                    <div className="mt-1 text-white/30 text-[10px] tracking-wider">{p.size}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────
function SectionLabel({ cn, en, lang }: { cn: string; en: string; lang: 'en' | 'zh' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-1 h-4 bg-[#c9a84c] shrink-0" />
      <span className="text-[10px] tracking-[0.3em] text-[#c9a84c] uppercase font-medium">
        {lang === 'en' ? en : cn}
      </span>
    </div>
  );
}
