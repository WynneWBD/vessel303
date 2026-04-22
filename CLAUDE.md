# CLAUDE.md — vessel303.com

你是 vessel303.com(VESSEL 微宿国际 B2B 官网)的开发 agent,直
接在本地 repo 改代码。

项目负责人 Wynne(何总)。交付 = `git push origin main` → Verc
el 30-60s 自动部署。

## 铁律

1. 每次动手前:`git pull origin main`
2. 每完成一个独立功能:`git add . && git commit -m "…" && git
 push origin main`(push 超时则告知 Wynne 在普通终端手动执行:
`cd ~/Desktop/vessel303 && git push origin main`)
3. 大改动先建分支,不在 main 上做破坏性重构
4. 联系/留资入口统一跳 `https://en.303vessel.cn/contact.html`
(新窗口)
5. 产品查看跳 `https://en.303vessel.cn/products_list.html`(新
窗口)

## 永久约束(不要改回)

### A. /global 超级工厂五角星
佛山南海狮山五角星(工厂总部标识),hover 和 click 行为完全一致
:都只显示 Tooltip popup(工厂名 + 地址,暗底橙边)。
禁止:弹右侧详情面板、跳转到任何页面、复用普通展示项目的 click 
handler。
文件:src/components/GlobalMapML.tsx

### B. /global Navbar 副标
副标文案:中文"全球营地部署" / 英文"Global Map"(不是 Global Deployment)。
手机和桌面均显示,无响应式隐藏。
禁止:改回 hidden md:inline、改英文为 Global Deployment。
文件:src/components/GlobalMapStats.tsx

### C. ProtectedImage 组件
移动端图片长按防盗,作用于 5 个固定区块:
1. 产品列表卡片(products/page.tsx)
2. V9Gen6 详情页图集(products/v9-gen6/page.tsx)
3. About 工厂图网格(about/page.tsx 工厂区块)
4. ProjectDetail 项目详情(ProjectDetail.tsx)
5. 首页项目网格(page.tsx)
禁止:扩大到团队照/创始人照/Logo/认证证书。
禁止:缩减任何一个现有区块。
文件:src/components/ProtectedImage.tsx

### D. 广告法合规
《广告法》第九条禁止极限词。禁用:最严苛、最先进、最优质、顶级
、极致、唯一、世界领先、独家、第一、史上、空前、最好、最佳、最
大(无数据支撑时)、最新(无代际限定时)。
替换原则:主观评价 → 客观事实。
例外:「最大承重 500kg」这类有数据支撑的客观描述可保留。

## 技术栈速查

- Next.js 14 + TypeScript
- Tailwind CSS v4(`@tailwindcss/postcss`,不要用 tailwind.con
fig.ts)
- next-auth v5(Auth.js):环境变量用 `AUTH_GOOGLE_ID` / `AUTH
_GOOGLE_SECRET`
- Neon Postgres(新加坡):/products/[slug]/page.tsx 必须 `exp
ort const dynamic = 'force-dynamic'`
- Resend 邮件
- MapLibre GL + @maptiler/sdk:API Key `7tbP0DIfmG9T8qWYxh5M`
,dark theme `streets-v2-dark`
- MapLibre 坐标顺序:`[lng, lat]`(和 Leaflet 相反)
- MapLibre 组件必须 dynamic import + ssr:false
- 字体:DM Sans(标题) + Inter(正文),next/font/google 自托管

## 品牌色

- 橙:#E36F2C(品牌色,全站占比 ≤10%)
- 暗画布:#1A1A1A
- 亮画布:#F5F2ED
- 辅助灰:#8A8580 / 石灰:#C4B9AB

## 本地环境

- 路径:`~/Desktop/vessel303`
- GitHub:https://github.com/WynneWBD/vessel303
- 部署:Vercel Pro(push main 自动部署)
- 用户名:wynnewbd,macOS zsh

## 编辑与对话风格

- 中文对话为主
- 不要简化 handoff,不要删历史版本
- 有歧义先问 Wynne,不要擅自决定
- 不要主动修改 CLAUDE.md 里的铁律部分(只有 Wynne 明确授权才改)
- 每完成一个功能推一次,不要攒多个 commit

---
VESSEL 微宿® · vessel303.com · CLAUDE.md V7.0 · 2026-04-21