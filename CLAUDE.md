# vessel303.com — Agent 操作手册

> V7.0 · 2026-04-21 · 只放当前事实与规则，历史/说明去查 `vessel303_handoff_V7_0.docx`

## 角色与工作方式

你是 vessel303.com（VESSEL 微宿国际 B2B 官网）的开发 agent，直接在本地 repo 改代码。
项目负责人 Wynne（何总）。交付 = `git push origin main` → Vercel 30-60s 自动部署。

## 铁律

1. 每次动手前：`git pull origin main`
2. 每完成一个独立功能：`git add . && git commit -m "…" && git push origin main`（push 超时则告知 Wynne 在普通终端手动执行：`cd ~/Desktop/vessel303 && git push origin main`）
3. 大改动先建分支，不在 main 上做破坏性重构
4. 联系/留资入口统一跳 `https://en.303vessel.cn/contact.html`（新窗口）
5. 产品查看跳 `https://en.303vessel.cn/products_list.html`（新窗口）
6. 价格权限严格分级（见第 4 节），海外不显示具体价格
7. **广告法合规**：禁用极限词（最严苛/最先进/最优质/顶级/极致/唯一/世界领先/独家），违规罚款 20 万起。替换原则：主观评价 → 客观事实
8. **V7.0 永久铁律**：
   - `/global` 超级工厂五角星（佛山南海狮山）：hover/click 只显示 Tooltip popup，**不弹详情面板，不跳转**
   - `ProtectedImage` 组件只作用于 5 个固定区块：产品列表卡片 / V9Gen6 图集 / About 工厂图网格 / ProjectDetail / 首页项目网格，不扩大不缩减

## 1. 技术栈

- Next.js 14 + TypeScript + Tailwind CSS **v4**（`@tailwindcss/postcss`，不用 `tailwind.config.ts`）
- NextAuth.js v5（email + Google OAuth）
- Neon Postgres（新加坡）· Resend 邮件
- **地图**：MapLibre GL + `@maptiler/sdk`（旧 Leaflet 备份在 `GlobalMap.backup.tsx`）
- 字体：DM Sans（标题）+ Inter（正文），`next/font/google` 自托管
- 部署：Vercel Pro 连 GitHub main

### MapTiler 配置
- API Key `7tbP0DIfmG9T8qWYxh5M`
- Origin 白名单：`vessel303.com` / `www.vessel303.com` / `localhost:3000`
- 暗色底图 `streets-v2-dark`，中英文走 `setLanguage()` 切换

## 2. 已知的坑

- **Auth.js v5**：必须用 `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`，不是 `GOOGLE_CLIENT_ID`
- **MapLibre 坐标 `[lng, lat]`**，和 Leaflet 的 `[lat, lng]` 相反
- **MapLibre 必须 dynamic import + `ssr: false`**
- **Tailwind v4** 用 `@tailwindcss/postcss`，不用 `tailwind.config.ts`
- **globals.css 旧变量映射不要删**：`--gold → #E36F2C`、`--accent-teal → #E36F2C`、`--warm-dark → #1A1A1A`、`--warm-white → #F5F2ED`
- **Neon DB 构建超时**：`/products/[slug]/page.tsx` 必须加 `export const dynamic = 'force-dynamic'`
- **MapLibre HTML Marker 不能加 `position: relative`**：会覆盖 MapLibre 的 `position: absolute` 导致所有 marker 跑偏。自定义样式只加在 marker 子元素上
- **`transition: transform` 不能加在 Marker element 本身**：MapLibre 靠 `transform: translate(x,y)` 定位，加 transition 会导致地图平移时 lag。用两层结构：outer wrap（无 transition）+ inner pin（有 transition）
- **HQ 五角星要最后 `addTo(map)`**：加 `z-index:9999` inline，保证浮在所有 marker 最上层
- **`src/app/favicon.ico` 会覆盖 `public/favicon.svg`**：如果存在须删除，确保新 favicon 生效

## 3. 设计规范（品牌橙体系，占比 ≤10%）

| CSS 变量 | 色值 | 用途 |
|---|---|---|
| `--accent-orange` | `#E36F2C` | 品牌主色：CTA、Logo、hover、关键数字 |
| `--hover-orange` | `#C85A1F` | 橙色 hover 加深 |
| `--accent-stone` | `#C4B9AB` | 次要中性色 |
| `--bg-dark` | `#1A1A1A` | 暗画布（Hero / 导航 / Footer） |
| `--bg-light` | `#F5F2ED` | 亮画布（内容区） |
| `--text-on-dark` | `#F0F0F0` | 暗底文字 |
| `--text-on-light` | `#1A1A1A` | 亮底文字 |
| `--text-muted` | `#8A8580` | 次要文字 |
| `--border-light` | `#E5E0DA` | 亮底分隔线 |
| `--border-dark` | `#2A2A2E` | 暗底分隔线 |

Logo：`/images/vessel-logo.png`（透明背景橙色 PNG，含中文"微宿"）。Navbar 40px · Footer 32px · GlobalMap 统计栏 24px。

Favicon（V7.0）：橙底白字 VESSEL 方案。`public/favicon.svg`（主）/ `favicon.ico` / `apple-touch-icon.png`（180×180）/ `icon-192.png` / `icon-512.png`。在 `src/app/layout.tsx` metadata.icons 注册。

## 4. 业务规则

### 用户权限

| 用户 | 能看 | 看不到 |
|---|---|---|
| 游客 | 产品列表、案例、认证、公司介绍 | 价格、配置单 |
| 注册用户 | + 价格区间 + 配置单下载 | 底价、批量折扣 |
| 代理商 | + 底价 + 批量折扣 + 代理后台 | — |
| 管理员 | 全部 + CMS + 数据管理 | — |

### 产品线
39 SKU：E3 / E5 / E6 / E7 / V3 / V5 / V7 / V9 / S5，每系列 Gen5 / Gen6。定制款命名「型号-代别_国家」。

### 定价
国内 7-37 万 RMB/台；海外 FOB 佛山，网站不显示具体价，引导留资。定金 30% 锁价 90 天。

## 5. 关键文件路径

| 文件 | 作用 |
|---|---|
| `src/components/GlobalMapML.tsx` | MapLibre 地图主组件 |
| `src/components/GlobalMapView.tsx` | /global 页面容器 |
| `src/components/GlobalMapStats.tsx` | /global Navbar 统计栏（手机端双行响应式） |
| `src/components/ProjectDetail.tsx` | 展示项目详情侧栏 |
| `src/components/TechDrawer.tsx` | 三大技术右滑 Drawer（60vw 桌面 / 100vw 移动） |
| `src/components/tech/ViieContent.tsx` | VIIE 技术内容组件（接收 lang prop） |
| `src/components/tech/VolsContent.tsx` | VOLS 技术内容组件 |
| `src/components/tech/VipcContent.tsx` | VIPC 技术内容组件 |
| `src/components/tech/Reveal.tsx` | IntersectionObserver 显现动画组件 |
| `src/components/ImageProtection.tsx` | 图片防盗（屏蔽右键/dragstart，全局） |
| `src/components/ProtectedImage.tsx` | 移动端长按防盗（V7.0，覆盖 5 个区块） |
| `src/data/showcaseProjects.ts` | 展示项目数据（40 个，中英双语） |
| `src/data/camps.ts` | 普通营地数据（~232 个点） |
| `src/lib/i18n.ts` | 中英文文案 |
| `scripts/embed-copyright.sh` | 批量写入 IPTC 版权元数据（新增图片后本地跑一次） |
| `public/images/about/certs/` | 4 张国际认证证书图 |
| `public/images/projects/<slug>/` | 展示项目图片 |
| `GlobalMap.backup.tsx` | 旧 Leaflet 版本备份，保留不删 |

## 6. 已上线页面（V7.0）

| 页面 | 状态 |
|---|---|
| `/` | Hero 5 图轮播 + 三大技术 TechDrawer + 认证区块；项目网格接入 ProtectedImage |
| `/products` | 39 SKU，分类筛选；卡片图接入 ProtectedImage |
| `/products/v9-gen6` | 详情模板；图集接入 ProtectedImage |
| `/global` | MapLibre 暗色 + 40 个展示项目 + 工厂五角星 Tooltip + 手机端双行 Navbar |
| `/about` | 10 区块，64 张真实图片，锚点导航，国际认证，TechDrawer；工厂图接入 ProtectedImage |
| `/faq` | 16 条双语 Q&A，accordion |
| `/innovation/viie` `/vols` `/vipc` | Orphan page，不挂导航，内容复用组件 |
| `/media-kit` | 双语留资表单 + 邮件通知 |
| `/news` `/contact` `/scenarios/*` `/display` `/auth/*` | 上线 |

**导航结构（6 项）**：产品系列 → 项目案例 → 关于我们 → 常见问题 → 新闻活动 → 联系我们
`/innovation` → 301 重定向到 `/about#technologies`

## 7. 待办（优先级）

### 🔴 立即
- `/global` 代理商联系方式填充（需提供代理商数据）

### 🟡 近期
- 管理员后台 CMS（V8.0 目标）
- 其余产品详情页（E7 / E6 / E3 / S5 / V5 / V7，参考 V9 Gen6 模板）
- Resend 验证 303vessel.cn 域名
- Pixsy 注册 + 上传 20-30 张关键图监控盗图
- 证书图片打码（签名 / 公章 / 统一社会信用代码）
- 其他 39 个展示项目资料收集

### ⏳ 规划
- AWS EC2 迁移 · 代理商后台 · HD 高清图锁定表单

## 8. 品牌数据（文案用）

项目 **300+** · 国家 **30+** · 工厂 **28,800 ㎡** · 月产 **150 台** · 成立 **2018** · 团队 **75 人** · 专利 **150+** · 全网粉丝 **中文 1000万+ / 英文 10M+**

## 9. 对外联系方式

WhatsApp **+86 180-2417-6679** · 销售邮箱 **vessel.sale@303industries.cn** · 电话 **400-8090-303**

---
*VESSEL 微宿® · vessel303.com · CLAUDE.md V7.0 · 2026-04-21 · 完整档案看 `vessel303_handoff_V7_0.docx`*
