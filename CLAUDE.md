# vessel303.com — Agent 操作手册

> 文档版本 V5.1 · 2026-04-18 · 只放当前事实与规则，历史/说明去查 `vessel303_handoff_V5_0.docx`

## 角色与工作方式

你是 vessel303.com（VESSEL 微宿国际 B2B 官网）的开发 agent，直接在本地 repo 改代码。
项目负责人 Wynne（何总）。交付 = `git push origin main` → Vercel 30-60s 自动部署。

## 铁律

1. 每次动手前：`git pull origin main`
2. 每完成一个独立功能：`git add . && git commit -m "…" && git push origin main`
3. 大改动先建分支，不在 main 上做破坏性重构
4. 联系/留资入口统一跳 `https://en.303vessel.cn/contact.html`；产品查看跳 `https://en.303vessel.cn/products_list.html`
5. 价格权限严格分级（见第 4 节），海外不显示具体价格
6. GitHub https://github.com/WynneWBD/vessel303 · 线上 https://vessel303.com

## 1. 技术栈（当前）

- Next.js 14 + TypeScript + Tailwind CSS **v4**（配置走 `@tailwindcss/postcss`，不用 `tailwind.config.ts`）
- NextAuth.js v5（email/password + Google OAuth）
- Neon Postgres（新加坡区域）· Resend 邮件
- **地图**：MapLibre GL + `@maptiler/sdk`（V5.0 从 Leaflet 迁移；旧代码备份在 `GlobalMap.backup.tsx`）
- 字体：DM Sans（标题）+ Inter（正文），走 `next/font/google` 自托管
- 部署：Vercel Pro 连 GitHub main

### MapTiler 配置
- API Key `7tbP0DIfmG9T8qWYxh5M`
- Origin 白名单 `vessel303.com` / `www.vessel303.com` / `localhost:3000`
- 暗色底图 `streets-v2-dark`，中英文走 `setLanguage()` 切换

## 2. 已知的坑（踩过的，别再踩）

- **Auth.js v5 环境变量**：必须用 `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`，不是 `GOOGLE_CLIENT_ID`
- **MapLibre 坐标是 `[lng, lat]`**，和 Leaflet 的 `[lat, lng]` 相反——最容易翻车
- **MapLibre 必须 dynamic import + `ssr: false`**
- **Tailwind v4** 用 `@tailwindcss/postcss`，不用 `tailwind.config.ts`
- **globals.css 保留旧变量映射**：`--gold → #E36F2C`、`--accent-teal → #E36F2C`、`--warm-dark → #1A1A1A`、`--warm-white → #F5F2ED`，子页面靠映射过渡，不要删
- **MapLibre HTML Marker 不能加 `position: relative`**：MapLibre 会在 `.maplibregl-marker` 上设 `position: absolute`，若自定义 CSS 或 inline style 加了 `position: relative`，后者会覆盖，导致所有 marker 跑到错误坐标（印度洋/南极）。自定义样式只能加在 marker element 的子元素上
- **`transition: transform` 不能加在 Marker element 本身**：MapLibre 靠 `transform: translate(x, y)` 定位 marker，若 element 有 `transition: transform`，每次地图平移/缩放都会触发动画延迟（lag）。必须用两层结构：outer wrap（MapLibre 控制，无 transition）+ inner pin（视觉层，transition 安全）
- **HQ 五角星要最后 `addTo(map)`**：HTML marker 按 DOM 插入顺序堆叠，HQ 必须在所有展示项目 marker 之后 `addTo`，并加 `z-index:9999` inline，才能保证永远浮在最上层

## 3. 设计规范（V4.0 品牌橙，占比 ≤10%）

| CSS 变量 | 色值 | 用途 |
|---|---|---|
| `--accent-orange` | `#E36F2C` | 品牌主色：CTA、Logo、hover、关键数字 |
| `--hover-orange` | `#C85A1F` | 橙色 hover 加深态 |
| `--accent-stone` | `#C4B9AB` | 次要中性色 |
| `--bg-dark` | `#1A1A1A` | 暗画布（Hero / 导航 / Footer） |
| `--bg-light` | `#F5F2ED` | 亮画布（内容区） |
| `--text-on-dark` | `#F0F0F0` | 暗底文字 |
| `--text-on-light` | `#1A1A1A` | 亮底文字 |
| `--text-muted` | `#8A8580` | 次要文字 |
| `--border-light` / `--border-dark` | `#E5E0DA` / `#2A2A2E` | 分隔线 |

Logo：透明背景橙色 PNG（含中文"微宿"），`/images/vessel-logo.png`。Navbar 40px · Footer 32px · GlobalMap 统计栏 24px。不加可见水印，靠 IPTC 元数据 + 中分辨率发布 + 高清图锁表单保护。

## 4. 业务规则

### 用户权限

| 用户 | 能看 | 看不到 |
|---|---|---|
| 游客 | 产品列表、案例、认证、公司介绍 | 价格、配置单 |
| 注册用户 | + 价格区间 + 配置单下载 | 底价、批量折扣 |
| 代理商 | + 底价 + 批量折扣 + 代理后台 | — |
| 管理员 | 全部 + CMS + 数据管理 | — |

### 产品线
39 SKU：E3 / E5 / E6 / E7 / V3 / V5 / V7 / V9 / S5，每系列 Gen5 / Gen6。定制款命名「型号-代别_国家」（俄罗斯版、沙特版、台湾版、美国版）。

### 定价
国内 7-37 万 RMB/台；海外 FOB 佛山，网站不显示具体价，引导留资。定金 30% 锁价 90 天。

## 5. 关键文件路径

| 文件 | 作用 |
|---|---|
| `src/components/GlobalMapML.tsx` | MapLibre 地图主组件（V5.0 新） |
| `src/components/GlobalMapView.tsx` | /global 页面容器（状态 + 详情面板） |
| `src/components/ProjectDetail.tsx` | 展示项目详情侧栏 |
| `src/data/showcaseProjects.ts` | 展示项目数据（独立于普通营地 `camps.ts`） |
| `src/data/camps.ts` | 普通营地数据（~232 个点） |
| `src/components/GlobalMap.backup.tsx` | 旧 Leaflet 版本备份，保留不删 |
| `public/images/projects/<slug>/` | 展示项目图片，命名 `exterior-NN.*` / `interior-NN.*` / `image-NN.*` |
| `vessel303-assets/新官网项目详情/` | 展示项目原始资料（docx + 图），40 个项目 |
| `public/images/vessel-logo.png` | 品牌 Logo |
| `src/data/showcaseProjects.ts` 末尾 `HQ_PROJECT` | 总部工厂作为特殊展示项目，`bookingUrl:''` 抑制预订按钮，点击弹详情面板 |

## 6. 已上线页面

`/`（Hero 5 图轮播）· `/products`（39 SKU）· `/products/v9-gen6`（详情模板）· `/global`（MapLibre 暗色 + 工厂五角星可点击弹详情 + **40 个展示项目**全部上线 + 随缩放动态缩放红点 + 中英双语营地标签）· `/about` · `/news` · `/contact`（跳 303vessel.cn）· `/scenarios/*` · `/display` · `/auth/*` · 价格权限全站生效 · i18n EN/ZH（EN 默认）

## 7. 待办（优先级）

### ✅ 已完成
1. **展示项目扩容**：全部 40 个项目上线（10 海外 + 30 国内），含 HQ 工厂可点击详情面板、随缩放缩放红点、中英双语营地标签

### 🔴 进行中
2. `/global` 代理商联系方式填充
3. 子页面配色细节清理（about / news / scenarios 残留旧色）

### 🟡 近期
4. 其余产品详情页（V9 Gen6 模板）；缺渲染图：S5-Gen5 / V5-Gen6 / V7-Gen5 / V7-Gen6（先占位）
5. 管理员 CMS 后台
6. Resend 验证 303vessel.cn 域名

### ⏳ 规划
7. AWS EC2 迁移 · 代理商后台 · 完整 agent 权限分级

## 8. 品牌数据（文案用）

项目 **300+** · 国家 **30+** · 工厂 **28,800 ㎡** · 月产 **150 units** · 成立 **2018** · 团队 **75 人** · 专利 **150+** · 全网粉丝 **1000万+ / 10M+**

## 9. 对外联系方式

WhatsApp **+86 180-2417-6679** · 销售邮箱 **vessel.sale@303industries.cn** · 电话 **400-8090-303** · 项目邮箱（暂）**wynnewbd@gmail.com**（最终迁到 `wynne@303vessel.cn`）

---
*VESSEL 微宿® · vessel303.com · CLAUDE.md V5.1 · 完整档案看 `vessel303_handoff_V5_0.docx`*
