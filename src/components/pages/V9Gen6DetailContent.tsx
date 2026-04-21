'use client';

import ProtectedImage from '@/components/ProtectedImage';
import Link from 'next/link';
import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import { catalogProducts } from '@/lib/products';

// ─── Gallery images (按指定顺序) ─────────────────────────────────────────────
const GALLERY = [
  // 渲染图
  { src: '/images/products/v9-gen6/main.jpg',        cn: '外观主图',   en: 'Main View' },
  { src: '/images/products/v9-gen6/render-03.jpg',   cn: '渲染角度 03', en: 'View 03' },
  { src: '/images/products/v9-gen6/render-05.jpg',   cn: '渲染角度 05', en: 'View 05' },
  { src: '/images/products/v9-gen6/render-07.png',   cn: '渲染角度 07', en: 'View 07' },
  { src: '/images/products/v9-gen6/render-08.jpg',   cn: '渲染角度 08', en: 'View 08' },
  { src: '/images/products/v9-gen6/render-09.jpg',   cn: '渲染角度 09', en: 'View 09' },
  { src: '/images/products/v9-gen6/render-10.jpg',   cn: '超流体立面',  en: 'Fluid Facade' },
  { src: '/images/products/v9-gen6/angle.jpg',       cn: '大斜角',      en: 'Side Angle' },
  // 实拍图 photo-00 ~ photo-20
  ...Array.from({ length: 21 }, (_, i) => ({
    src: `/images/products/v9-gen6/photo-${String(i).padStart(2, '0')}.jpg`,
    cn: `实拍 ${String(i).padStart(2, '0')}`,
    en: `Photo ${String(i).padStart(2, '0')}`,
  })),
  { src: '/images/products/v9-gen6/photo-2002.jpg',  cn: '实拍 2002',   en: 'Photo 2002' },
  // 爆炸图
  { src: '/images/products/v9-gen6/exploded-view.png', cn: '结构爆炸图', en: 'Exploded View' },
];

// Default to photo-00 (index 8)
const DEFAULT_IDX = 8;

// ─── Spec grid ────────────────────────────────────────────────────────────────
const SPECS = [
  { cn: '建筑面积', en: 'Floor Area',  val: '38.8 ㎡' },
  { cn: '外形尺寸', en: 'Dimensions', val: '11.4 × 3.4 × 3.4 m' },
  { cn: '额定功率', en: 'Power',       val: '16 / 24 kW' },
  { cn: '容纳人数', en: 'Capacity',    val: '2 – 4 人' },
  { cn: '自重',     en: 'Weight',      val: '约 9 吨' },
  { cn: '代别',     en: 'Generation',  val: 'Gen6 第六代' },
];

// ─── Config groups ────────────────────────────────────────────────────────────
const CONFIG_GROUPS = [
  { id: 'hvac',      cn: '空调与通风',   en: 'HVAC & Ventilation',
    items_cn: ['隐藏式中央空调（冷暖两用）', '新风换气系统', '空气净化过滤'],
    items_en: ['Concealed central A/C (heating & cooling)', 'Fresh-air ventilation system', 'Air purification filter'] },
  { id: 'bathroom',  cn: '卫浴系统',     en: 'Bathroom System',
    items_cn: ['独立卫浴空间', '三分离设计（如厕 / 淋浴 / 洗漱）', '80L 加热热水器', '智能镜柜'],
    items_en: ['Private bathroom', '3-zone separation (toilet / shower / vanity)', '80L water heater', 'Smart mirror cabinet'] },
  { id: 'windows',   cn: '门窗系统',     en: 'Door & Window System',
    items_cn: ['17㎡ 落地景观窗', '180° 全景玻璃', '高性能断桥铝合金门窗', '电动遮阳帘（全遮光）', 'LOW-E 中空玻璃'],
    items_en: ['17㎡ floor-to-ceiling windows', '180° panoramic glass', 'Thermal-break aluminum frames', 'Electric blackout curtains', 'LOW-E insulating glass'] },
  { id: 'lighting',  cn: '照明系统',     en: 'Lighting System',
    items_cn: ['双层氛围照明设计', '全铝曲面天花板', '可调色温 LED 主灯', '轮廓灯带（红色 / 金色可选）'],
    items_en: ['Dual-layer ambient lighting', 'Full aluminum curved ceiling', 'Tunable CCT LED main lights', 'Outline accent lights (red / gold optional)'] },
  { id: 'smart',     cn: '智能系统',     en: 'Smart System',
    items_cn: ['VIIE 微宿第六代智能交互系统', '智能门锁（指纹 / 密码 / APP）', 'APP 远程控制', 'AI 语音控制灯光 / 窗帘 / 空调'],
    items_en: ['VIIE Gen6 smart interaction system', 'Smart lock (fingerprint / code / APP)', 'Remote control via smartphone APP', 'AI voice control (lights / curtains / A/C)'] },
  { id: 'kitchen',   cn: '厨房配置',     en: 'Kitchen',
    items_cn: ['2.3m 超长延伸橱柜', '四座岛台餐桌', '冰箱 / 洗碗机 / 抽油烟机接口预留'],
    items_en: ['2.3m extended kitchen cabinet', '4-seat island dining table', 'Fridge / dishwasher / range hood space reserved'] },
  { id: 'bedroom',   cn: '卧室配置',     en: 'Bedroom',
    items_cn: ['1.8m 豪华大床', '全包覆集成衣柜', '集成梳妆台', '床头集成控制系统'],
    items_en: ['1.8m luxury bed', 'Full wrap-around built-in wardrobe', 'Integrated vanity dresser', 'Bedside control panel'] },
  { id: 'structure', cn: '结构主材',     en: 'Core Materials',
    items_cn: ['热镀锌钢骨架（壁厚 4.75mm）', '氟碳喷涂铝板（43μm 耐候涂层）', 'LOW-E 三玻两腔中空玻璃', '硬质聚氨酯喷涂保温', 'SPC 防水地板'],
    items_en: ['Hot-dip galvanized steel frame (4.75mm)', 'Fluorocarbon aluminum cladding (43μm)', 'LOW-E triple-pane insulating glass', 'Rigid PU spray insulation', 'SPC waterproof flooring'] },
];

// ─── Business terms ───────────────────────────────────────────────────────────
const TERMS = [
  { cn: '交付方式', en: 'Delivery',    vcn: '工厂自提（EXW）',           ven: 'Ex Works (EXW)' },
  { cn: '发货地点', en: 'Origin',      vcn: '中国 · 广东佛山',            ven: 'Foshan, Guangdong, CN' },
  { cn: '付款条款', en: 'Payment',     vcn: '预付 50%，发货前 50%',       ven: '50% deposit, 50% before shipment' },
  { cn: '生产周期', en: 'Lead Time',   vcn: '45 天',                     ven: '45 days' },
  { cn: '水电标准', en: 'Utilities',   vcn: '中国 / 欧美 / 海外标准可选', ven: 'CN / EU / US standards' },
  { cn: '售后支持', en: 'After-sales', vcn: '原厂保修 1 年，终身售后',    ven: '1-year warranty, lifetime support' },
  { cn: '起订量',   en: 'Min. Order',  vcn: '1 台起订',                  ven: '1 unit minimum' },
];

// ─── Related products ─────────────────────────────────────────────────────────
const RELATED = catalogProducts.filter(
  (p) => p.productSeries === 'V9' && p.id !== 'v9-gen6-standard'
).slice(0, 4);

// ─────────────────────────────────────────────────────────────────────────────

interface Props { isLoggedIn: boolean }

export default function V9Gen6DetailContent({ isLoggedIn }: Props) {
  const { lang } = useLanguage();
  const t = useT();

  // Gallery
  const [activeIdx, setActiveIdx] = useState(DEFAULT_IDX);
  const thumbContainerRef = useRef<HTMLDivElement>(null);

  const selectImage = useCallback((idx: number) => {
    setActiveIdx(idx);
    // Scroll thumbnail into view (vertical list on desktop)
    const container = thumbContainerRef.current;
    if (!container) return;
    const thumb = container.children[idx] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  const prev = () => selectImage((activeIdx - 1 + GALLERY.length) % GALLERY.length);
  const next = () => selectImage((activeIdx + 1) % GALLERY.length);

  // Config collapse
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setCollapsed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  // Inquiry form
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', quantity: '1', remarks: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryType: '咨询报价', model: 'V9 Gen6', name: form.name, phone: form.phone || form.email, email: form.email || form.phone, location: form.location, quantity: form.quantity, remarks: form.remarks, company: '', projectType: '' }),
      });
      setStatus(r.ok ? 'sent' : 'error');
    } catch { setStatus('error'); }
  };

  const active = GALLERY[activeIdx]!;

  return (
    <div className="bg-[#1C1A18] text-white min-h-screen">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3">
        <nav className="flex items-center gap-2 text-[11px] text-white/30 tracking-wider">
          <Link href="/" className="hover:text-[#c9a84c] transition-colors">{t(i18n.productDetail.home)}</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#c9a84c] transition-colors">{t(i18n.productDetail.breadcrumbProducts)}</Link>
          <span>/</span>
          <span className="text-white/50">V9 Gen6</span>
        </nav>
      </div>

      {/* ── 三栏主体 ─────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 items-start">

          {/* ══ 左栏：缩略图竖排 (桌面) / 横排 (平板/手机) ══════════════ */}
          {/* 桌面：固定宽度 96px，竖排 */}
          <div className="hidden lg:block w-[96px] shrink-0">
            <div
              ref={thumbContainerRef}
              className="flex flex-col gap-1.5 overflow-y-auto"
              style={{ maxHeight: 'calc(min(70vw * 0.75, 620px))' }}
            >
              {GALLERY.map((img, idx) => (
                <button
                  key={img.src}
                  onClick={() => selectImage(idx)}
                  className={`relative w-full aspect-square shrink-0 overflow-hidden border-2 transition-all duration-150 ${
                    idx === activeIdx
                      ? 'border-[#c9a84c] opacity-100'
                      : 'border-white/10 opacity-45 hover:opacity-75 hover:border-white/30'
                  }`}
                >
                  <ProtectedImage src={img.src} alt={lang === 'en' ? img.en : img.cn} fill className="object-cover" sizes="96px" />
                </button>
              ))}
            </div>
          </div>

          {/* ══ 中栏：主图 + 内容 ════════════════════════════════════════ */}
          <div className="flex-1 min-w-0">

            {/* 主图 */}
            <div className="relative aspect-[4/3] bg-[#0d0d0d] overflow-hidden group">
              <ProtectedImage
                key={active.src}
                src={active.src}
                alt={lang === 'en' ? active.en : active.cn}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
              {/* Arrows */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 border border-white/15 flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#c9a84c] hover:text-black hover:border-[#c9a84c]"
                aria-label="Previous image"
              >‹</button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 border border-white/15 flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#c9a84c] hover:text-black hover:border-[#c9a84c]"
                aria-label="Next image"
              >›</button>
              {/* Counter */}
              <div className="absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 text-[10px] text-white/55 tracking-widest">
                {activeIdx + 1} / {GALLERY.length}
              </div>
              {/* Label */}
              <div className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 text-[10px] text-white/50 tracking-wider">
                {lang === 'en' ? active.en : active.cn}
              </div>
            </div>

            {/* 平板/手机：缩略图横排，置于主图下方 */}
            <div className="lg:hidden flex gap-1.5 overflow-x-auto py-2 scrollbar-none">
              {GALLERY.map((img, idx) => (
                <button
                  key={img.src}
                  onClick={() => selectImage(idx)}
                  className={`relative shrink-0 w-16 h-12 overflow-hidden border-2 transition-all ${
                    idx === activeIdx ? 'border-[#c9a84c]' : 'border-white/10 opacity-50 hover:opacity-80'
                  }`}
                >
                  <ProtectedImage src={img.src} alt={lang === 'en' ? img.en : img.cn} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>

            {/* ─── 产品内容区 ────────────────────────────────────────── */}
            <div className="mt-8 space-y-12">

              {/* ① 核心参数格 */}
              <section>
                <Label cn="核心规格参数" en="Core Specifications" lang={lang} />
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/8 border border-white/8">
                  {SPECS.map(s => (
                    <div key={s.cn} className="bg-[#0f0f0f] p-4">
                      <div className="text-white/30 text-[10px] tracking-[0.2em] uppercase mb-1.5">
                        {lang === 'en' ? s.en : s.cn}
                      </div>
                      <div className="text-white font-bold text-sm tracking-wide">{s.val}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ② 完整配置清单 */}
              <section>
                <Label cn="完整配置清单" en="Full Configuration" lang={lang} />
                <div className="mt-4 space-y-1">
                  {CONFIG_GROUPS.map(g => {
                    const open = !collapsed.has(g.id);
                    const items = lang === 'en' ? g.items_en : g.items_cn;
                    return (
                      <div key={g.id} className="border border-white/8">
                        <button
                          onClick={() => toggle(g.id)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-[#221F1C] hover:bg-[#141414] transition-colors text-left"
                        >
                          <span className="text-sm font-semibold tracking-wider text-white/80">
                            {lang === 'en' ? g.en : g.cn}
                          </span>
                          <span className={`text-[#c9a84c] text-base transition-transform duration-200 ${open ? 'rotate-90' : 'rotate-0'}`}>›</span>
                        </button>
                        {open && (
                          <ul className="px-4 py-3 bg-[#0d0d0d] space-y-2">
                            {items.map(item => (
                              <li key={item} className="flex items-start gap-2 text-xs text-white/50 leading-relaxed">
                                <span className="text-[#c9a84c] text-[10px] mt-0.5 shrink-0">▸</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ③ 设计理念 */}
              <section>
                <Label cn="设计理念" en="Design Philosophy" lang={lang} />
                <div className="mt-4 border-l-2 border-[#c9a84c]/40 pl-5 space-y-4">
                  {lang === 'zh' ? (
                    <>
                      <p className="text-white/60 text-sm leading-[1.9] tracking-wide">
                        VESSEL V9 作为首款定位全球市场的长居度假型产品，38.8㎡ 内囊括主卧、卫浴、起居与餐厨四大完整功能区。聚焦舒适性与实用性，完美兼容海内外各类高端家电的集成需求，以工业级精度重新定义高品质移动生活方式。
                      </p>
                      <p className="text-white/40 text-sm leading-[1.9] tracking-wide">
                        遵循「钻石切割」设计理念，弧线与折线交织，刚柔并济的建筑美学。17.0㎡ 超大采光面，42.39% 紫外线隔绝率，让自然光线在每一天的不同时刻演绎专属的光影故事。
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/60 text-sm leading-[1.9] tracking-wide">
                        VESSEL V9 is our first long-stay model purpose-built for the global market. 38.8㎡ includes four fully functional zones: bedroom, bathroom, living room, and kitchen-dining. Focused on comfort and practicality, compatible with premium appliances worldwide — redefining luxury prefab living with industrial precision.
                      </p>
                      <p className="text-white/40 text-sm leading-[1.9] tracking-wide">
                        Inspired by the "diamond cut" design language, curves and facets interweave to deliver an architecture of strength and elegance. The 17.0㎡ panoramic glazing with 42.39% UV rejection lets natural light tell a different story every hour of the day.
                      </p>
                    </>
                  )}
                </div>
              </section>

              {/* ④ 实拍图瀑布流 */}
              <section>
                <Label cn="真实落地实拍" en="Real Project Photos" lang={lang} />
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GALLERY.slice(8, 30).map((img, i) => (
                    <button
                      key={img.src}
                      onClick={() => selectImage(8 + i)}
                      className="relative aspect-[4/3] overflow-hidden group bg-[#0d0d0d]"
                    >
                      <ProtectedImage
                        src={img.src}
                        alt={lang === 'en' ? img.en : img.cn}
                        fill
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-white/25 text-[11px] tracking-wider">
                  {lang === 'en' ? 'Click any photo to view in gallery' : '点击图片可在上方主图中查看大图'}
                </p>
              </section>

              {/* ⑤ 运输说明 */}
              <section>
                <Label cn="运输说明" en="Shipping & Transport" lang={lang} />
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div className="relative aspect-video bg-[#0d0d0d] border border-white/8">
                    <ProtectedImage
                      src="/images/products/v9-gen6/exploded-view.png"
                      alt="Exploded view"
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 640px) 100vw, 28vw"
                    />
                  </div>
                  <ul className="space-y-3 text-sm text-white/50">
                    {[
                      lang === 'en' ? '40ft Flat Rack Container: 11.762 × 2.240 × 2.034 m' : '集装箱规格：40ft Flat Rack（11.762 × 2.240 × 2.034 m）',
                      lang === 'en' ? 'Complies with international sea freight & port lifting standards' : '符合国际海运及各国港口标准吊装规格',
                      lang === 'en' ? 'HS Code: 9406.90 (Prefabricated Buildings)' : 'HS 编码：9406.90（装配式房屋）',
                      lang === 'en' ? 'On-site install: ~2 hours with standard crane' : '现场安装：约 2 小时，标准吊装设备即可',
                    ].map(s => (
                      <li key={s} className="flex gap-2">
                        <span className="text-[#c9a84c] text-[10px] mt-1 shrink-0">▸</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

            </div>{/* end content */}
          </div>{/* end 中栏 */}

          {/* ══ 右栏（sticky）════════════════════════════════════════════ */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 lg:sticky lg:top-24 lg:self-start mt-8 lg:mt-0 space-y-4">

            {/* 产品名称 */}
            <div className="bg-[#111] border border-white/8 px-5 pt-5 pb-4">
              <div className="text-[10px] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">
                VESSEL 微宿® · Gen6 · {lang === 'en' ? 'Flagship Long-Stay' : '旗舰家居版'}
              </div>
              <h1 className="text-3xl font-black tracking-wide leading-none">
                <span className="text-[#c9a84c]">V9</span>
                <span className="text-white ml-3">Gen6</span>
              </h1>
              <p className="mt-2 text-white/35 text-xs tracking-wider">
                {lang === 'en' ? '38.8㎡ · 180° Panoramic · VIIE Smart System' : '38.8㎡ · 180° 全景玻璃 · VIIE 智能系统'}
              </p>
            </div>

            {/* 价格 */}
            <div className="bg-[#111] border border-white/8 px-5 py-4">
              <div className="text-[10px] tracking-[0.25em] text-[#c9a84c] uppercase mb-3">
                {t(i18n.productDetail.priceLabel)}
              </div>
              {isLoggedIn ? (
                <div>
                  <div className="text-[11px] text-white/35 tracking-widest mb-1">EXW / CNY</div>
                  <div className="text-3xl font-black text-white tracking-wide">
                    ¥ 296,000
                    <span className="text-sm font-normal text-white/35 ml-2">{lang === 'en' ? 'from' : '起'}</span>
                  </div>
                  <p className="mt-2 text-white/30 text-[11px] leading-relaxed">
                    {lang === 'en' ? 'Base config, VAT incl., ex-works. Shipping & install extra.' : '基础配置含税出厂价，不含运输及现场安装费用。'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-black text-white/15 tracking-widest select-none mb-2">
                    ¥ *** , ***
                  </div>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#dbb85e] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="tracking-wider">{t(i18n.productDetail.loginToView)}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 商务条款 */}
            <div className="bg-[#111] border border-white/8 px-5 py-4">
              <div className="text-[10px] tracking-[0.25em] text-[#c9a84c] uppercase mb-3">
                {lang === 'en' ? 'Trade Terms' : '商务条款'}
              </div>
              <dl className="space-y-2">
                {TERMS.map(t2 => (
                  <div key={t2.cn} className="flex justify-between gap-3 pb-2 border-b border-white/5 text-[11px]">
                    <dt className="text-white/30 shrink-0 tracking-wider">{lang === 'en' ? t2.en : t2.cn}</dt>
                    <dd className="text-white/65 text-right tracking-wide">{lang === 'en' ? t2.ven : t2.vcn}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* 联系方式 */}
            <div className="bg-[#111] border border-white/8 px-5 py-4 space-y-3">
              <div className="text-[10px] tracking-[0.25em] text-[#c9a84c] uppercase mb-1">
                {lang === 'en' ? 'Contact Us' : '联系方式'}
              </div>
              <a
                href="https://api.whatsapp.com/send?phone=8618024176679"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[11px] text-white/55 hover:text-[#c9a84c] transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>+86 180-2417-6679</span>
              </a>
              <a
                href="tel:4008090303"
                className="flex items-center gap-2.5 text-[11px] text-white/55 hover:text-[#c9a84c] transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                <span>400-8090-303</span>
              </a>
              <a
                href="mailto:vessel.sale@303industries.cn"
                className="flex items-center gap-2.5 text-[11px] text-white/55 hover:text-[#c9a84c] transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span className="break-all">vessel.sale@303industries.cn</span>
              </a>
            </div>

            {/* 两个按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="https://en.303vessel.cn/contact.html" target="_blank" rel="noopener noreferrer"
                className="py-3 text-center text-[11px] font-bold tracking-[0.2em] uppercase bg-[#c9a84c] text-[#1C1A18] hover:bg-[#b8973d] transition-colors"
              >
                {lang === 'en' ? 'Inquire Now' : '立即咨询'}
              </Link>
              <Link
                href="/products"
                className="py-3 text-center text-[11px] font-bold tracking-[0.2em] uppercase border border-[#c9a84c]/50 text-[#c9a84c] hover:border-[#c9a84c] hover:bg-[#c9a84c]/8 transition-colors"
              >
                {lang === 'en' ? 'All Products' : '查看全系列'}
              </Link>
            </div>

            {/* 询价表单 */}
            <div className="bg-[#111] border border-white/8 px-5 py-4">
              <div className="text-[10px] tracking-[0.25em] text-[#c9a84c] uppercase mb-4">
                {lang === 'en' ? 'Quick Inquiry' : '快速询价'}
              </div>
              {status === 'sent' ? (
                <div className="py-5 text-center">
                  <div className="text-[#c9a84c] text-2xl mb-2">✓</div>
                  <p className="text-white/50 text-xs tracking-wider">
                    {lang === 'en' ? "Sent! We'll reply within 24h." : '已提交！顾问将在 24 小时内联系您。'}
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-2.5">
                  {[
                    { k: 'name' as const,     type: 'text',  ph_cn: '姓名 *',        ph_en: 'Your name *',      req: true },
                    { k: 'phone' as const,    type: 'tel',   ph_cn: '联系电话 *',    ph_en: 'Phone *',          req: true },
                    { k: 'email' as const,    type: 'email', ph_cn: '邮箱 *',        ph_en: 'Email *',          req: true },
                    { k: 'location' as const, type: 'text',  ph_cn: '国家 / 城市',   ph_en: 'Country / City',   req: false },
                  ].map(({ k, type, ph_cn, ph_en, req }) => (
                    <input
                      key={k}
                      type={type}
                      required={req}
                      placeholder={lang === 'en' ? ph_en : ph_cn}
                      value={form[k]}
                      onChange={set(k)}
                      className="w-full bg-[#1C1A18] border border-white/10 px-3 py-2.5 text-[11px] text-white placeholder-white/20 outline-none focus:border-[#c9a84c]/40 tracking-wider"
                    />
                  ))}
                  <select
                    value={form.quantity}
                    onChange={set('quantity')}
                    className="w-full bg-[#1C1A18] border border-white/10 px-3 py-2.5 text-[11px] text-white/60 outline-none focus:border-[#c9a84c]/40 tracking-wider cursor-pointer"
                  >
                    {['1', '2–5', '6–10', '11–20', '20+'].map(q => (
                      <option key={q} value={q} className="bg-[#111]">
                        {lang === 'en' ? `Qty: ${q}` : `采购数量：${q} 台`}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={2}
                    placeholder={lang === 'en' ? 'Project description / requirements' : '项目描述 / 需求说明'}
                    value={form.remarks}
                    onChange={set('remarks')}
                    className="w-full bg-[#1C1A18] border border-white/10 px-3 py-2.5 text-[11px] text-white placeholder-white/20 outline-none focus:border-[#c9a84c]/40 tracking-wider resize-none"
                  />
                  {status === 'error' && (
                    <p className="text-red-400 text-[11px] tracking-wider">
                      {lang === 'en' ? 'Submit failed. Please try again.' : '提交失败，请重试。'}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full py-3 bg-[#c9a84c] text-[#1C1A18] text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#b8973d] transition-colors disabled:opacity-50"
                  >
                    {status === 'sending'
                      ? (lang === 'en' ? 'Sending...' : '提交中...')
                      : (lang === 'en' ? 'Send Inquiry' : '立即发送询价')}
                  </button>
                </form>
              )}
            </div>

          </div>{/* end 右栏 */}
        </div>
      </div>

      {/* ── Related Products ─────────────────────────────────────────────── */}
      {RELATED.length > 0 && (
        <section className="border-t border-white/8 bg-[#0d0d0d]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-[10px] tracking-[0.3em] text-[#c9a84c] uppercase mb-6">
              {lang === 'en' ? 'Other V9 Series Variants' : 'V9 系列其他版本'}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {RELATED.map(p => (
                <Link
                  key={p.id}
                  href={p.detailSlug ? `/products/${p.detailSlug}` : `/products/${p.id}`}
                  className="group block bg-[#221F1C] border border-white/8 hover:border-[#c9a84c]/40 overflow-hidden transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden bg-[#0d0d0d]">
                    <ProtectedImage
                      src={p.image}
                      alt={lang === 'en' ? p.name_en : p.name_cn}
                      fill
                      loading="lazy"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#c9a84c] text-[#1C1A18]">
                        {lang === 'en' ? p.badge_en : p.badge_cn}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white/65 text-[11px] font-semibold tracking-wider leading-snug">
                      {lang === 'en' ? p.name_en : p.name_cn}
                    </div>
                    <div className="mt-1 text-white/25 text-[10px] tracking-wider">{p.size}</div>
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

// ─── Section label helper ─────────────────────────────────────────────────────
function Label({ cn, en, lang }: { cn: string; en: string; lang: 'en' | 'zh' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-0.5 h-4 bg-[#c9a84c] shrink-0" />
      <span className="text-[10px] tracking-[0.3em] text-[#c9a84c] uppercase font-medium">
        {lang === 'en' ? en : cn}
      </span>
    </div>
  );
}
