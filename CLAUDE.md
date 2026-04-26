# CLAUDE.md — vessel303.com

你是 vessel303.com(VESSEL 微宿国际 B2B 官网)的开发 agent,直接在本地 repo 改代码。

项目负责人 Wynne(何总)。交付 = `git push origin main` → Vercel 30-60s 自动部署。

## 铁律

1. 每次动手前:`git pull origin main`
2. 每完成一个独立功能:`git add . && git commit -m "…" && git push origin main`(push 超时则告知 Wynne 在普通终端手动执行:`cd ~/Desktop/vessel303 && git push origin main`)
3. 大改动先建分支,不在 main 上做破坏性重构
4. 联系/留资入口统一跳 `https://en.303vessel.cn/contact.html`(新窗口)
5. 产品查看跳 `https://en.303vessel.cn/products_list.html`(新窗口)

## 永久约束(不要改回)

### A. /global 超级工厂五角星
佛山南海狮山五角星(工厂总部标识),hover 和 click 行为完全一致:都只显示 Tooltip popup(工厂名 + 地址,暗底橙边)。
禁止:弹右侧详情面板、跳转到任何页面、复用普通展示项目的 click handler。
文件:`src/components/GlobalMapML.tsx`

### B. /global Navbar 副标
副标文案:中文"全球营地部署" / 英文"Global Map"(不是 Global Deployment)。
手机和桌面均显示,无响应式隐藏。
禁止:改回 hidden md:inline、改英文为 Global Deployment。
文件:`src/components/GlobalMapStats.tsx`

### C. ProtectedImage 组件
移动端图片长按防盗,作用于 5 个固定区块:
1. 产品列表卡片(`products/page.tsx`)
2. V9Gen6 详情页图集(`products/v9-gen6/page.tsx`)
3. About 工厂图网格(`about/page.tsx` 工厂区块)
4. ProjectDetail 项目详情(`ProjectDetail.tsx`)
5. 首页项目网格(`page.tsx`)
禁止:扩大到团队照/创始人照/Logo/认证证书。
禁止:缩减任何一个现有区块。
文件:`src/components/ProtectedImage.tsx`

### D. 广告法合规
《广告法》第九条禁止极限词。禁用:最严苛、最先进、最优质、顶级、极致、唯一、世界领先、独家、第一、史上、空前、最好、最佳、最大(无数据支撑时)、最新(无代际限定时)。
替换原则:主观评价 → 客观事实。
例外:「最大承重 500kg」这类有数据支撑的客观描述可保留。

## V8.0 技术架构铁律(改回会重蹈历史 bug)

### E. /global 地图代理与渲染链路
4/25-26 一连串 bug 的核心教训,**任何一条改回都会让 /global 重新挂掉**。

1. **Edge proxy 必须显式带 Referer**:`Referer: https://www.vessel303.com/`(优先转发调用方的,否则 fallback)。MapTiler key 是 referrer-locked,server-side `fetch` 默认不带 Referer → 上游一律 403 → 整个地图打不开。
2. **Edge proxy 不要 rewrite api.maptiler.com host**:只剥 `?key=`。否则 MapTiler SDK V4 `setPrimaryLanguage` 的域名检查失败 → text-field 保留 `{name:en}` 模板 → maplibre v5 字面渲染"name:en"、中英文切换失效。
3. **客户端 transformRequest 必须返回绝对 URL**:`${window.location.origin}/api/map/...`。maplibre v5 vector tile 在 Web Worker 里 fetch,worker 没有 document.baseURI → 相对路径解析失败 → 底图全空只剩 markers。
4. **不要给加载状态加超时式失败 UI**:China mobile + cold cache 单瓦片 13s+,25s 超时会误报。WebGL2 同步抛错的 try/catch 是例外(真的不能渲染)。
5. **`localIdeographFontFamily` 必须保留**:用本地中文字体(PingFang SC / 微软雅黑 / 鸿蒙)渲染 CJK,跳过 ~10 个 ~80KB 的 glyph PBF 下载。删了 China mobile 首屏直接退化。

文件:`src/app/api/map/[...path]/route.ts` + `src/components/GlobalMapML.tsx`

### F. 后台 /admin 安全与上传
1. **Vercel Serverless 4.5MB 请求体硬限制**:任何文件上传必须用 `@vercel/blob/client` 的 `upload()` 客户端直传方案,API route 只发签名 token。这是平台级限制,不是代码层能突破的。
2. **admin 自我保护必须在服务端**:服务端 PATCH 强制拒绝 admin 改自己 role / 禁用自己 / 改白名单用户 role。客户端 UI 禁用只是 UX,**不是闸门**。
3. **Vercel Blob client uploads 元数据透传**:`size` / `originalName` 通过 `clientPayload` → `tokenPayload` → `onUploadCompleted` 写 DB。不要靠客户端单独发 API 写元数据(竞态)。
4. **Auth.js v5 必须 split config**:`src/auth.config.ts` 极简版给 middleware(无 DB 调用,Edge Runtime 兼容);`src/auth.ts` 完整版含 adapter / callbacks 给 server。**不要在 middleware 里直接 import auth.ts**(会爆 Edge runtime 错)。

文件:`src/auth.config.ts` + `src/auth.ts` + `src/middleware.ts` + `src/lib/blob-client.ts`

## 技术栈速查

- **Next.js 14 + TypeScript**(App Router)
- **Tailwind CSS v4**(`@tailwindcss/postcss`,不要建 `tailwind.config.ts`;shadcn CLI 不兼容,UI 组件全手写在 `src/components/ui/`)
- **Auth.js v5(next-auth)**:split config 模式;环境变量 `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- **Neon Postgres**(新加坡):`/products/[slug]/page.tsx` 必须 `export const dynamic = 'force-dynamic'`
- **Vercel Blob**:`@vercel/blob` 2.3.3,**必须用 client uploads**(浏览器直传,API 只发 token);env `BLOB_READ_WRITE_TOKEN` 自动注入;Store 名 `vessel303-media`,sin1 区域,Public
- **Resend 邮件**
- **MapLibre GL v5 + @maptiler/sdk v4**:API Key `7tbP0DIfmG9T8qWYxh5M`(referrer-locked vessel303.com),dark theme `streets-v2-dark`
- **MapTiler edge proxy**:`/api/map/[...path]` Edge Function,转发 Referer + 不 rewrite host + 只剥 key(见铁律 E)
- **MapLibre 坐标顺序**:`[lng, lat]`(和 Leaflet 相反)
- **MapLibre 组件必须 dynamic import + `ssr:false`**
- **字体**:DM Sans(标题) + Inter(正文),`next/font/google` 自托管;CJK 系统字体 PingFang SC / 微软雅黑(地图标注用)

## 品牌色

- 橙:`#E36F2C`(品牌色,全站占比 ≤10%)
- 暗画布:`#1A1A1A`
- 亮画布:`#F5F2ED`
- 辅助灰:`#8A8580` / 石灰:`#C4B9AB`

## 本地环境

- 路径:`~/Desktop/vessel303`
- GitHub:https://github.com/WynneWBD/vessel303
- 部署:Vercel Pro(push main 自动部署)
- 用户名:wynnewbd,macOS zsh
- handoff 文档:`vessel303_handoff_V{N}_0.docx`(只保留最新版,不入 git)

## V8.0 后台进度速查

- ✅ Step 1-5 已上线(地基 / UI 框架 / 线索 / 用户 / 图片库)
- ✅ /global 性能与稳定性大修完成(commit `c86eaa9`)
- 🔴 Step 6 进行中:新闻管理 + Tiptap 极简富文本
- ⏳ Step 7-8:设置页 + 收尾(Resend 域名 / Vercel 警告清理)
- ⏳ V8.1:项目 CMS;V8.2:产品 CMS

后台路由清单:`/admin` `/admin/login` `/admin/leads` `/admin/users` `/admin/media` `/admin/news`(WIP)`/admin/settings`(WIP)

## 编辑与对话风格

- 中文对话为主
- 不要简化 handoff,不要删历史版本
- 有歧义先问 Wynne,不要擅自决定
- 不要主动修改 CLAUDE.md 里的铁律部分(只有 Wynne 明确授权才改)
- 每完成一个功能推一次,不要攒多个 commit
- 防御性代码要保守:不要给可能正常的状态主动加超时/失败 UI(参考 4/26 25s 超时事件)

---
VESSEL 微宿® · vessel303.com · CLAUDE.md V8.0 · 2026-04-26
