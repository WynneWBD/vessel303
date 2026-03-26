import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: '联系我们 | VESSEL 微宿®',
  description: '联系 VESSEL 微宿® — 采购咨询、项目合作、代理加盟，400-8090-303，全球30+国家服务。',
};

const officeLocations = [
  { city: '台湾·台中', status: '运营中' },
  { city: '日本', status: '运营中' },
  { city: '英国·Manchester', status: '运营中' },
  { city: '斯洛伐克', status: '运营中' },
  { city: '新西兰', status: '运营中' },
  { city: '沙特阿拉伯', status: '运营中' },
  { city: '德国', status: '筹建中' },
  { city: '澳大利亚', status: '筹建中' },
];

const faqs = [
  {
    q: '产品由哪些材料组成？',
    a: '采用「微宿五大结构主材」：高强度热镀锌钢骨架、耐腐蚀氟碳喷涂铝板、低辐射 LOW-E 中空玻璃、高热工性能断桥门窗、绝热喷涂硬质聚氨酯。',
  },
  {
    q: '第六代产品有哪些升级亮点？',
    a: '第六代主要升级：锁扣式物理防水屋顶（取代胶水防水）、设备层架构（底部设备仓）、无胶装配工艺（减少VOC），以及全新 VIIE Gen6 智控系统。',
  },
  {
    q: '目前有哪些型号可选？',
    a: 'Gen6 系列：V9（38㎡）、E7（38.8㎡）、E6（29.6㎡）、E3（19㎡）；Gen5 系列：V5（24.8㎡）、S5（29.6㎡）等，支持全系定制。',
  },
  {
    q: '产品能适应极端气候吗？',
    a: '经测试，可适用 -32℃（俄罗斯严寒环境）至 55℃（沙特高温环境），配合断桥门窗和聚氨酯喷涂隔热层，四季均可舒适使用。',
  },
  {
    q: '如何运输？海关编码是什么？',
    a: '通过 40 尺平架集装箱（Flat Rack Container）运输，符合国际海运规范。海关商品编码：HS 9406.90（预制建筑物）。',
  },
  {
    q: '生产周期多久？安装方式？',
    a: '标准生产周期 45 天。出厂即成品，现场接通水电即可使用，无需传统建筑施工，专业团队现场安装约 2 小时完成。',
  },
];

export default function ContactPage() {
  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />

      <PageHero
        label="联系我们"
        title="VESSEL 微宿®"
        titleGold="尊享服务"
        subtitle="采购咨询 · 项目合作 · 代理加盟 · 定制服务，专业团队全程服务"
        breadcrumb={[{ label: '首页', href: '/' }, { label: '联系我们' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Contact Form ── */}
          <div className="lg:col-span-2">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-6 font-medium">在线留言</div>
            <form className="space-y-5">
              {/* Inquiry type */}
              <div>
                <label className="block text-white/50 text-xs tracking-wider mb-2">咨询类型 *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['索取资料', '咨询报价', '合作代理', '定制服务'].map((type, i) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="inquiryType"
                        value={type}
                        defaultChecked={i === 0}
                        className="accent-[#c9a84c]"
                      />
                      <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors tracking-wider">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Name + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs tracking-wider mb-2">姓名 *</label>
                  <input
                    type="text"
                    placeholder="您的姓名"
                    className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs tracking-wider mb-2">联系电话 *</label>
                  <input
                    type="tel"
                    placeholder="+86 138 0000 0000"
                    className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
                  />
                </div>
              </div>

              {/* Email + Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs tracking-wider mb-2">邮箱</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs tracking-wider mb-2">公司名称</label>
                  <input
                    type="text"
                    placeholder="公司/组织名称"
                    className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
                  />
                </div>
              </div>

              {/* Country + Project type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs tracking-wider mb-2">所在国家/城市</label>
                  <input
                    type="text"
                    placeholder="如：中国·广州"
                    className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs tracking-wider mb-2">项目类型</label>
                  <select className="w-full bg-[#111] border border-white/15 text-white/70 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60">
                    <option value="">请选择项目类型</option>
                    <option>文旅度假营地</option>
                    <option>精品酒店民宿</option>
                    <option>商业空间</option>
                    <option>公共设施</option>
                    <option>其他</option>
                  </select>
                </div>
              </div>

              {/* Quantity + Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs tracking-wider mb-2">订购数量（台）</label>
                  <input
                    type="number"
                    placeholder="预计采购数量"
                    min="1"
                    className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs tracking-wider mb-2">产品型号偏好</label>
                  <select className="w-full bg-[#111] border border-white/15 text-white/70 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60">
                    <option value="">请选择</option>
                    <option>E7 Gen6 · 38.8㎡</option>
                    <option>E6 Gen6 · 29.6㎡</option>
                    <option>E3 Gen6 · 19㎡</option>
                    <option>V9 Gen6 · 38㎡</option>
                    <option>V5 Gen5 · 24.8㎡</option>
                    <option>S5 Gen5 · 29.6㎡</option>
                    <option>暂未确定</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-white/50 text-xs tracking-wider mb-2">备注</label>
                <textarea
                  rows={4}
                  placeholder="请描述您的项目概况、特殊需求或其他问题..."
                  className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 resize-none tracking-wider"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#c9a84c] text-[#0a0a0a] font-bold text-sm py-4 hover:bg-[#b8973b] transition-colors tracking-[0.2em] uppercase"
              >
                提交咨询
              </button>
              <p className="text-white/20 text-xs text-center tracking-wider">
                提交后专业顾问将在 24 小时内与您取得联系
              </p>
            </form>
          </div>

          {/* ── Contact Info Sidebar ── */}
          <div className="space-y-6">
            <div>
              <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-6 font-medium">联系方式</div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[#111] border border-white/8">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#c9a84c]/10 shrink-0">
                    <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/30 text-[10px] tracking-wider mb-1">国内服务热线</div>
                    <a href="tel:4008090303" className="text-white font-bold tracking-wider hover:text-[#c9a84c] transition-colors">
                      400-8090-303
                    </a>
                    <div className="text-white/25 text-xs mt-0.5">工作日 9:00–18:00</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#111] border border-white/8">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#c9a84c]/10 shrink-0">
                    <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/30 text-[10px] tracking-wider mb-1">WhatsApp / 国际</div>
                    <a href="tel:+8618024176679" className="text-white font-bold tracking-wider hover:text-[#c9a84c] transition-colors">
                      +86 180-2417-6679
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#111] border border-white/8">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#c9a84c]/10 shrink-0">
                    <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/30 text-[10px] tracking-wider mb-1">电子邮箱</div>
                    <a href="mailto:vessel.sale@303industries.cn" className="text-white/70 text-sm hover:text-[#c9a84c] transition-colors break-all">
                      vessel.sale@303industries.cn
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#111] border border-white/8">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#c9a84c]/10 shrink-0">
                    <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/30 text-[10px] tracking-wider mb-1">总部地址</div>
                    <div className="text-white/60 text-sm leading-relaxed">
                      广东省佛山市南海区<br />
                      狮山镇兴业北路253号
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR code placeholder */}
            <div className="p-5 bg-[#111] border border-white/8 text-center">
              <div className="text-white/30 text-xs tracking-wider mb-3">微信扫码咨询</div>
              <div className="w-28 h-28 mx-auto bg-[#1a1a1a] flex items-center justify-center">
                <span className="text-white/15 text-xs">企业微信二维码</span>
              </div>
              <div className="text-white/20 text-xs mt-2">扫一扫，立即咨询</div>
            </div>

            {/* Global offices */}
            <div>
              <div className="text-white/30 text-xs tracking-[0.25em] uppercase mb-4">全球办事处</div>
              <div className="grid grid-cols-2 gap-2">
                {officeLocations.map((loc) => (
                  <div key={loc.city} className="flex items-center justify-between px-3 py-2 bg-[#111] border border-white/5 text-xs">
                    <span className="text-white/50 tracking-wider">{loc.city}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 ${
                        loc.status === '运营中'
                          ? 'text-[#27ae60] bg-[#27ae60]/10'
                          : 'text-white/30 bg-white/5'
                      }`}
                    >
                      {loc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">常见问题</div>
            <h2 className="text-2xl font-black text-white">FAQ</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#111] border border-white/8 p-6 hover:border-[#c9a84c]/20 transition-all">
                <div className="flex items-start gap-3">
                  <span className="text-[#c9a84c] font-black text-lg shrink-0 leading-none mt-0.5">Q</span>
                  <div>
                    <div className="text-white font-semibold text-sm mb-2 tracking-wider">{faq.q}</div>
                    <div className="text-white/45 text-sm leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
