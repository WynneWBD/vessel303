# CODEX.md - vessel303.com Codex 接手文档

最后更新：2026-04-27

这是 `vessel303.com` 给 Codex 使用的接手文档和操作指南。每次新对话或开始大改动时，先读 `AGENTS.md`，再读本文件。

`CLAUDE.md` 是另一个模型留下的历史文档，里面仍然有有用的业务规则和事故记录，但当前 Codex 的工作入口以本文件为准。除非 Wynne 明确要求，不要主动修改 `CLAUDE.md`。

## 项目概况

- 负责人：Wynne / 何总
- 品牌：VESSEL 微宿
- 官网：`https://www.vessel303.com`
- GitHub：`https://github.com/WynneWBD/vessel303`
- 本地路径：`/Users/wynnewbd/Desktop/vessel303`
- 部署：Vercel Pro，push 到 `main` 会自动触发生产部署
- 数据库：Neon Postgres
- 图片存储：Vercel Blob，store 为 `vessel303-media`，public，区域 `sin1`
- 默认沟通语言：中文

这个网站是 VESSEL 微宿的国际 B2B 官网，面向海外度假村开发商、酒店集团、地产开发商、政府采购等客户。它不是国内 C 端营地预订站。

核心目标：展示产品力，通过认证、案例、工厂内容建立信任，并捕获采购线索。

## 参考文档

Wynne 已经把旧参考资料整理到 `参考文档/` 目录。它们是背景资料：

- `参考文档/vessel303_handoff_V8_0.docx`
- `参考文档/vessel303_handoff_V7_0.docx`
- `参考文档/vessel303-项目清单-40个.xlsx`
- `参考文档/vessel303官网开发（ai辅助版）.docx`

注意：当前代码状态已经比 V8.0 handoff 更新。最重要的变化是：V8.0 Step 6 新闻管理已经做到可发布、可前台展示。

## 技术栈

- Next.js `16.2.1`，App Router
- React `19.2.4`
- TypeScript 5
- Tailwind CSS v4，使用 `@tailwindcss/postcss`
- Auth.js v5 / `next-auth`
- Neon Postgres，通过 `pg` 连接
- Vercel Blob，通过 `@vercel/blob`
- Resend
- MapLibre GL v5
- `@maptiler/sdk` v4
- Tiptap v3，用于后台新闻富文本
- `lucide-react` 图标
- 手写 UI 组件在 `src/components/ui/`

重要：这是 Next.js 16，不是旧版 Next.js。写框架相关代码前，必须读本地文档 `node_modules/next/dist/docs/` 中对应章节。

Next 16 特别提醒：`middleware` 文件约定已经被标记为 deprecated，官方建议改为 `proxy`。本项目目前仍有 `src/middleware.ts`，不要在无关任务里顺手迁移。

## 常用命令

```bash
npm run dev
npm run build
npx tsc --noEmit
npm run lint
```

`npm run build` 可能需要联网，因为 `next/font` 构建时会拉取 Google Fonts 资源。

已知情况：全仓库 `npm run lint` 有一些历史遗留问题。做局部任务时，至少对触碰过的文件跑 targeted lint，再跑 `npx tsc --noEmit` 和 `npm run build`。

## Git 与上线规则

生产部署由 `main` 分支自动触发。

Codex 默认工作方式：

1. 改代码前先看 `git status`。
2. 不要碰和当前任务无关的用户改动。
3. 需要提交时，一个独立功能一个 commit。
4. 只有 Wynne 在当前任务中明确授权“提交/推送/上线”时，才可以 push `main`。
5. push 后要验证对应线上页面。

当前本地常见情况：Wynne 可能会移动或整理参考文档，导致 `参考文档/`、旧 handoff、xlsx 等文件出现在 git status 中。除非 Wynne 明确要求，不要清理这些状态。

## Codex 文档维护规则

`AGENTS.md` 和 `CODEX.md` 是后续 Codex 接手项目的重要上下文，但它们本身也会随着项目升级而变化。

维护规则：

- `AGENTS.md` 只记录硬规则和入口指令，少改。
- `CODEX.md` 记录阶段性上下文、已完成模块、重大事故和后续路线，可以阶段性更新。
- 每完成大模块、改变架构、修改数据库关键 schema、修复线上事故，应该判断是否需要同步更新 `CODEX.md`。
- 以后如果 Codex 判断需要修改 `AGENTS.md` 或 `CODEX.md`，必须先通知 Wynne：说明为什么要改、改哪些内容。
- 获得 Wynne 授权后，才提交并推送这两个文档。
- 不要在普通功能开发里悄悄改这两个文件。

## 品牌与文案规则

品牌色：

- 橙色：`#E36F2C`
- 暗画布：`#1A1A1A`
- 亮画布：`#F5F2ED` / `#F5F0EB`
- 次要文字：`#8A8580`
- 石灰中性色：`#C4B9AB`

字体：

- 标题：DM Sans
- 正文：Inter
- 中文 fallback：PingFang SC / Microsoft YaHei / 系统中文字体

广告法合规很重要。避免使用绝对化、极限化表达，例如：

- 最严苛
- 最先进
- 最优质
- 顶级
- 极致
- 唯一
- 世界领先
- 独家
- 第一
- 史上
- 空前
- 最好 / 最佳
- 最大，除非有客观数据支撑
- 最新，除非明确绑定代际，例如 Gen6

写文案时用客观、可验证的事实表达替代主观夸张。

外部跳转规则：

- 联系、留资、采购咨询入口：`https://en.303vessel.cn/contact.html`
- 查看产品入口：`https://en.303vessel.cn/products_list.html`
- 这些外链默认新窗口打开。

## 当前应用状态

官网前台：

- 首页、产品列表、V9 Gen6 详情、About、FAQ、Cases、News、Contact、`/global`、Display 等页面已存在。
- `/contact` 保留为跳转/承接页，最终导向旧 300.cn 站点联系页。
- `/global` 使用 MapLibre/MapTiler，已经经过 V8 大修。

管理后台：

- `/admin/login`：管理员登录页。
- `/admin`：数据看板，接真实统计。
- `/admin/leads`：线索列表、筛选、详情、状态更新、CSV 导出。
- `/admin/users`：用户列表、角色/身份/禁用管理、CSV 导出、服务端自我保护。
- `/admin/media`：基于 Vercel Blob 的图片库，使用 client upload。
- `/admin/news`：新闻管理，已能新建、编辑、发布、取消发布，并在前台展示。
- `/admin/settings`：设置页已上线，包含站点运营配置表单、系统健康检查、白名单展示和最近操作日志。
- `/admin/products`：产品 CMS 已接入产品列表和通用详情页，支持新建、编辑、复制为草稿、发布/下架、删除、筛选、图片选择、前台预览、详情介绍、详情图库选择器、图库排序和规格参数；固定精细详情页如 `e7`、`v9-gen6` 仍保留原页面。
- `/admin/projects`：项目 / 案例 CMS 已接入，支持新建、编辑、发布/下架、删除、筛选、封面图、图库排序、中英文案例内容、地图发布校验、地图状态筛选，以及 `/global` 详情里的统计数据、预订链接、设施亮点、交通指引和周边景点；前台 `/cases` 已优先读取数据库并保留静态兜底；带经纬度的已发布项目会进入 `/global` 地图点位和详情面板。

## V8 后台进度

已完成：

- Step 1：后台地基、Auth split config、数据库基础表。
- Step 2：后台 UI shell 和手写 UI 组件。
- Step 3：线索管理。
- Step 4：用户管理。
- Step 5：图片库和 Vercel Blob client upload。
- Step 6：新闻管理和前台新闻展示。
- Step 7：设置页、站点运营配置、系统配置检查。
- Step 8：产品 CMS 基础发布链路，含公开详情 slug 校验、后台预览、产品复制、通用详情介绍、图库选择器和规格参数。
- Step 9：项目 / 案例 CMS 基础发布链路，含后台 CRUD、`/cases` 数据库接入、`/global` 地图点位和详情面板接库。
- V8.1：项目 / 案例 CMS 增强，含地图状态筛选、图库排序、`/global` 详情统计、预订链接、设施、交通和周边字段。

下一步：

- Step 10：Resend 域名验证、Vercel warning 清理。
- V8.2：产品 CMS 高级详情模块、产品图片批量管理和规格模板。

## 新闻模块当前状态

截至 2026-04-27，新闻发布已经上线。

关键文件：

- `src/lib/news-db.ts`
- `src/app/api/admin/news/route.ts`
- `src/app/api/admin/news/[id]/route.ts`
- `src/app/api/admin/news/[id]/publish/route.ts`
- `src/app/api/admin/news/[id]/unpublish/route.ts`
- `src/components/admin/NewsListClient.tsx`
- `src/components/admin/NewsForm.tsx`
- `src/components/admin/NewsEditor.tsx`
- `src/components/admin/CoverImagePicker.tsx`
- `src/app/admin/(protected)/news/page.tsx`
- `src/app/admin/(protected)/news/new/page.tsx`
- `src/app/admin/(protected)/news/[id]/edit/page.tsx`
- `src/app/news/page.tsx`
- `src/app/news/[slug]/page.tsx`
- `src/components/NewsListView.tsx`
- `src/components/NewsDetailView.tsx`
- `scripts/migrate-v8-step6.js`

已有行为：

- 管理员可以创建草稿。
- 管理员可以从图片库选择封面图。
- 支持中英文标题、摘要、正文。
- 正文使用 Tiptap 富文本。
- 支持保存、发布、取消发布。
- 已发布新闻出现在 `/news`。
- 新闻详情页在 `/news/[slug]` 渲染。
- 前台新闻页面动态读取 Neon 数据库。

2026-04-27 修过的重要 bug：

- Neon/Postgres 返回 `timestamp` 字段时，Node `pg` 会给 JS `Date`。
- Next 16 跨 RSC 边界传给客户端组件时，会保留 Date 类型。
- `date-fns/parseISO()` 只接受字符串，传 Date 会报 `dateString.split is not a function`。
- 这个 bug 曾导致 `/news` 和 `/news/[slug]` 线上 500。
- 当前修法：`src/lib/news-db.ts` 在 SQL 里把新闻时间字段 cast 成 text，同时前台日期格式函数兼容 `string | Date | null`。
- 以后新增 DB 驱动的前台页面时，所有日期字段过 server/client 边界前都要规范化。

新闻表期望结构：

- `id SERIAL PRIMARY KEY`
- `slug VARCHAR(200) UNIQUE NOT NULL`
- `title_zh`, `title_en`
- `content_zh JSONB`, `content_en JSONB`
- `excerpt_zh`, `excerpt_en`
- `cover_image_url`
- `status`：`draft | published`
- `published_at`
- `author_id`
- `created_at`, `updated_at`, `deleted_at`

迁移脚本注意事项：

- `scripts/migrate-v8-step6.js` 是非破坏式脚本。
- 如果发现旧占位 `news` 表，会把它改名为 `news_legacy_<timestamp>`，再创建生产表并迁移旧数据。
- 不要把它改回 `DROP TABLE news` 这种破坏式迁移。

## 管理员认证与安全规则

Auth.js v5 使用 split config：

- `src/auth.config.ts`：给 middleware/proxy 用的极简配置，不做 DB 调用。
- `src/auth.ts`：服务端完整 auth，包含 DB callbacks。
- `src/middleware.ts`：当前保护 `/admin/*` 登录状态。

不要在 middleware/proxy 中 import `src/auth.ts`，会引发运行时兼容问题。

服务端管理员检查：

- API routes 使用 `requireAdmin()`。
- 不要把安全限制只做在 UI 禁用上。
- 管理员自我保护必须在服务端实现。
- 管理员不能通过 PATCH 把自己降级、禁用或锁死。
- 白名单管理员不能被误降级。

## Vercel Blob 上传规则

Vercel Serverless 有 4.5MB request body 限制。大文件不能直接通过普通 API route body 上传。

必须使用的模式：

- 浏览器端用 `@vercel/blob/client` 的 `upload()`。
- API route 只负责生成/验证 client upload token。
- 文件大小、原始文件名等元数据通过 `clientPayload -> tokenPayload -> onUploadCompleted` 传递。
- DB 写入发生在 `onUploadCompleted`。

关键文件：

- `src/app/api/admin/media/route.ts`
- `src/app/api/admin/media/[id]/route.ts`
- `src/lib/uploads-db.ts`
- `src/components/admin/MediaClient.tsx`

图片删除引用检查：

- 新闻封面引用字段是 `news.cover_image_url`。
- 不要再使用旧字段 `news.cover_image`。

## /global 地图规则

这一块很脆，已经出过多次线上事故。改动前必须读代码和本地 Next/Map 相关文档。

关键文件：

- `src/app/api/map/[...path]/route.ts`
- `src/components/GlobalMapML.tsx`
- `src/components/GlobalMapView.tsx`
- `src/components/GlobalMapStats.tsx`
- `src/components/MapSkeleton.tsx`
- `src/data/showcaseMarkers.ts`
- `src/data/showcaseProjects.ts`

不可改回的点：

- Edge proxy 必须显式设置 `Referer: https://www.vessel303.com/`，除非转发有效 caller referer。
- 不要 rewrite MapTiler JSON 里的 `api.maptiler.com` host，只能剥掉 `key`。MapTiler SDK 会检查 source host 来做语言重写。
- 客户端 `transformRequest` 必须返回绝对 URL，例如 `${window.location.origin}/api/map/...`。MapLibre 的 vector tile fetch 在 worker 里，不能可靠解析相对路径。
- 不要给地图慢加载加超时式失败 UI。中国移动网络冷缓存慢但不代表失败。
- 保留 `localIdeographFontFamily`，用于本地 CJK 字体渲染。
- MapLibre 坐标顺序是 `[lng, lat]`，不是 Leaflet 的 `[lat, lng]`。
- MapLibre 组件必须 dynamic import，并设置 `ssr: false`。

产品交互规则：

- `/global` 佛山南海狮山超级工厂五角星，hover/click 都只显示 tooltip。
- 它不能打开普通项目的右侧详情面板。

导航副标题规则：

- `/global` 副标题中文是 `全球营地部署`，英文是 `Global Map`。
- 手机和桌面都应显示。

## 图片保护规则

项目有全局图片拖拽/右键保护，但 `ProtectedImage` 的作用范围要保持克制。

`ProtectedImage` 当前只应用于这五处：

- 产品列表卡片。
- V9 Gen6 详情页图集。
- About 工厂图片网格。
- `ProjectDetail` 项目详情图片。
- 首页项目网格。

不要扩展到团队照、创始人照、Logo、证书图片，除非 Wynne 明确要求。

也不要从已有五处里移除。

## 数据库注意事项

核心 DB 文件：

- `src/lib/db.ts`
- `src/lib/leads-db.ts`
- `src/lib/users-db.ts`
- `src/lib/uploads-db.ts`
- `src/lib/news-db.ts`
- `src/lib/db-products.ts`

旧的 `src/lib/schema.sql` 不一定代表当前完整 schema。V8 迁移脚本在 `scripts/migrate-v8*.js`。假设字段前，先查迁移脚本或实际数据库。

前台页面如果读取数据库数据，注意日期字段不要直接跨 server/client 边界。

## 文件与路由速查

后台页面：

- `/admin`
- `/admin/login`
- `/admin/leads`
- `/admin/users`
- `/admin/media`
- `/admin/news`
- `/admin/news/new`
- `/admin/news/[id]/edit`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]/edit`
- `/admin/projects`
- `/admin/projects/new`
- `/admin/projects/[id]/edit`
- `/admin/settings`

后台 API：

- `/api/admin/leads`
- `/api/admin/leads/[id]`
- `/api/admin/leads/export`
- `/api/admin/users`
- `/api/admin/users/[id]`
- `/api/admin/users/export`
- `/api/admin/media`
- `/api/admin/media/[id]`
- `/api/admin/projects`
- `/api/admin/projects/[id]`
- `/api/admin/products`
- `/api/admin/products/[id]`
- `/api/admin/news`
- `/api/admin/news/[id]`
- `/api/admin/news/[id]/publish`
- `/api/admin/news/[id]/unpublish`

前台动态内容：

- `/news`
- `/news/[slug]`
- `/products/[slug]`
- `/products/v9-gen6`
- `/global`

## 验证清单

后台或 API 改动：

```bash
npx tsc --noEmit
npx eslint <本次改动的文件>
npm run build
```

新闻相关改动，部署后还要验证线上：

```bash
curl -I https://www.vessel303.com/news
curl -I https://www.vessel303.com/news/<slug>
```

预期：HTTP 200，HTML 里没有 `id="__next_error__"`。

`/global` 相关改动要额外做地图资源和视觉行为验证。不要把慢加载误判成失败。

## 当前已知后续事项

- 将前台联系方式、SEO 默认值、外部跳转逐步接入 `/admin/settings` 的 `site_settings` 数据源。
- 产品 CMS 下一阶段：增加高级详情模块、规格模板和批量图片排序能力，减少对固定精细页的依赖。
- 评估是否把 `src/middleware.ts` 迁移到 Next 16 推荐的 `src/proxy.ts`。
- 历史 lint 问题单独开任务清理，不要混在功能开发里。
- 如果 Wynne 需要，再生成新的 V9 全量 handoff 文档。
- V8.2：产品 CMS 详情内容、产品图片和规格管理。
