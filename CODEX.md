# CODEX.md - vessel303.com Codex 当前操作入口

最后更新：2026-06-04

本文件是 `vessel303.com` 给 Codex 使用的当前操作入口。它只保留当前事实、硬规则、模块边界和下一步，不再承载 B1-B74 的完整历史流水。

开始任何代码改动前，先读 `AGENTS.md`，再读本文件。需要更完整的当前 handoff 时，以 Wynne 本机文档库中的 V10 为准：

`C:\Users\Wynne\Desktop\vessel303\vessel303文档\vessel303_handoff_V10.md`

V9 handoff 是完整历史归档，仅用于追溯，不再作为日常开发入口。`CLAUDE.md` 是历史上下文，可参考，但除非 Wynne 明确要求，不主动修改。

## 1. 项目当前事实

- 品牌：VESSEL 微宿
- 官网：`https://www.vessel303.com`
- GitHub：`https://github.com/WynneWBD/vessel303`
- 本地真实代码：`C:\Users\Wynne\Desktop\vessel303\repo-git`
- 本机文档库：`C:\Users\Wynne\Desktop\vessel303\vessel303文档`
- 部署：Vercel Pro，push 到 `main` 会触发生产部署
- 数据库：Neon Postgres
- 图片存储：Vercel Blob，store 为 `vessel303-media`
- 默认沟通语言：中文

`vessel303.com` 是 VESSEL 微宿国际 B2B 官网，面向海外度假村开发商、酒店集团、地产开发商、政府采购等客户。它不是国内 C 端营地预订站。

当前核心目标：

- 展示产品力、工厂能力、交付能力和项目证明。
- 通过产品目录、案例、资料中心、FAQ、联系表单捕获采购线索。
- 后台 published 内容是客户可见内容的唯一来源；前台负责展示模板、交互、路由、图片加载和表单提交。

## 2. 技术栈和框架规则

- Next.js `16.2.1` / App Router
- React `19.2.4`
- TypeScript 5
- Tailwind CSS v4 / `@tailwindcss/postcss`
- Auth.js v5 / `next-auth`
- Neon Postgres / `pg`
- Vercel Blob / `@vercel/blob`
- Resend
- MapLibre GL v5 / MapTiler SDK v4
- Tiptap v3
- `lucide-react`

这是 Next.js 16，不是旧版 Next.js。涉及框架行为、缓存、路由、`proxy`、构建问题时，必须先读当前代码和本地 `node_modules/next/dist/docs/` 里的对应文档。

项目已迁移到 `src/proxy.ts`。不要新增或恢复 `src/middleware.ts`。

## 3. 硬规则

未经 Wynne 明确授权，不得执行：

- push 到 `main`
- 上线生产环境
- 提交代码
- 删除文件
- 修改生产数据库数据
- 执行数据库迁移
- 修改账号权限
- 删除或禁用账号
- 修改支付、认证、权限核心逻辑
- 修改 `AGENTS.md` / `CODEX.md`
- 输出任何密码、密钥、数据库连接串、临时账号密码
- 在 300.cn 后台保存、发布、上传、发送、提交表单、删除、付款、购买或修改配置

服务端安全规则：

- 后台权限必须在服务端实现，不能只靠前端隐藏按钮。
- Auth.js v5 使用 split config，`proxy` 不能 import `src/auth.ts`。
- 大文件上传必须走 Vercel Blob client upload，不能把大文件 body 直接打到 API route。
- `/global` 是高风险模块，涉及 MapLibre / MapTiler / `/api/map`。除非任务明确归 04，不要碰地图底层。

300.cn 后台边界：

- 300.cn 后台可以登录，但只用于只读对照、学习后台/CMS/Visual Editor/运营后台产品心智、查看、下载和必要的页面字段读取/填写确认。
- 涉及后台、CMS、Visual Editor 或运营后台产品心智时，不确定处可以多去只读学习和核对 300.cn 后台。
- 如果已有登录态，可以读取页面内容、复制/下载资料、核对字段和填写临时字段用于观察。
- 点击保存、发布、上传、发送、删除、付款、购买、提交表单、改线上配置或任何真实变更动作前必须停止，并另行获得 Wynne 明确授权。
- 300 后台账号密码只从本机 env 使用，不能写入文档、代码、commit、PR 或聊天输出。

## 4. 主站入口规则

普通主站：

- 联系、留资、采购咨询入口默认走新站 `/contact`。
- `/contact` 是新站自有联系页，表单写入 `leads`。
- 查看产品入口默认走新站 `/products`。
- 前台不硬编码业务文案、产品事实、联系方式、价格承诺或旧站链接。

`/global` 例外：

- 在新站正式接管 Global 生产链路前，`/global` 内 Contact / Products 继续跳旧 303 页面。
- 联系：`https://en.303vessel.cn/contact.html`
- 产品：`https://en.303vessel.cn/products_list.html`
- 不要把 Global 入口套用 `normalizeSiteHref` 或普通主站 CTA 规则。
- 不为了普通主站、产品、案例、后台任务顺手改 `/global`。

## 5. Git、验证和上线

生产部署由 `main` 分支自动触发。

默认工作方式：

1. 改代码前先看 `git status`。
2. 不碰与当前任务无关的用户改动。
3. 一个明确小任务对应一个聚焦变更。
4. 非 05 聊天框完成开发后，不自行提交、push 或上线。
5. 05 验收通过后，才按流程 commit、push `main` 并等待 Vercel READY。
6. push 前必须列出即将推送的 commit，确认没有未知改动或无关 commit。

常用命令：

```bash
npm run dev
npx tsc --noEmit
npm run lint
npm run build
git diff --check
npm run audit:public-content
npm run audit:published-content
npm run audit:production-links
npx next build --webpack
```

注意：

- `npm run build` 可能联网拉取 Google Fonts。
- 全仓库 `npm run lint` 有历史遗留问题；局部任务至少跑 touched files 的 targeted lint，再跑 `tsc` 和 build。
- 构建日志中既有 PostgreSQL SSL warning、本机数据库 `EACCES` 降级或 `/global` edge runtime warning 时，按任务上下文判断，不要误判为本轮新问题。

## 6. 当前总目标和调度循环

当前阶段不是继续堆功能，也不是自由建站器，而是把新站稳定打磨成海外 B2B 主站。

主线目标：

1. 前台展示继续对齐 `en.303vessel.cn` 的产品视觉、销售节奏、案例证明和联系路径。
2. 后台 published 内容继续作为客户可见内容唯一来源。
3. 前台不硬编码未确认业务内容。
4. 后台继续按 300.cn 操作心智做受控能力，不做自由 HTML / CSS、自由 DOM 或任意建站器。
5. 每次只做一个明确小任务，小步修改、可回滚、可验证。

当前循环：

`09 差距对比 -> 00 拆任务 -> 01/02/03/07 开发或修复 -> 05 验收上线 -> 06 文档收口 -> 05 文档复验上线 -> 09 继续对比`

归属判断：

- 显示节奏、视觉模板、页面互动：交 01。
- 后台内容、字段、素材、CMS 读写、模块能力：交 02 / 03。
- 速度、图片、缓存、移动端性能：交 07。
- `/global`、MapLibre、MapTiler、`/api/map`：交 04。
- 规则、文档、handoff、流程口径：交 06。
- 验收、提交、push、Vercel READY、线上检查：交 05。

## 7. 角色分工

| 聊天框 | 当前职责 |
| --- | --- |
| 00 项目总控 | 接收 Wynne 需求，拆任务，判断归属，调度 01 / 02 / 03 / 04 / 05 / 06 / 07 / 08 / 09。默认不直接开发、不验收、不写长文档，除非当前任务明确要求。 |
| 01 产品中心 / 前台展示 | 产品中心、产品列表、产品详情、首页 / 产品视觉展示模板、前台展示节奏和页面交互。 |
| 02 后台 2.0 / 运营后台 | 后台 2.0、CMS、后台 API、内容读写链路、300.cn 操作心智对照、普通后台 bug。 |
| 03 项目案例 / 项目 CMS | 项目案例数据、`/cases`、案例详情、项目 ID 体系和项目 CMS。 |
| 04 Global 地图专项 | `/global`、MapLibre、MapTiler、地图点位、地图详情面板、地图数据接入风险。 |
| 05 验收 / 提交 / 推送 / 上线 | 统一验收、检查、commit、push `main`、等待 Vercel READY、线上轻量检查。默认不主动改业务代码。 |
| 06 文档整理 | `CODEX.md`、handoff、docx、阶段性归档、流程规则收口。默认不提交、不 push、不上线。 |
| 07 性能 / 图片 / 前台速度 | 全站响应速度、图片体积、上传派生图、缓存、Lighthouse、Chrome Network、线上轻量测速。 |
| 08 可视化页面编辑器 | `/admin/pages/visual`、页面模块可视化编辑、草稿 / 发布、快照恢复、Home 安全插入区。 |
| 09 差距对比 / 体验官 | 只读对比 `en.303vessel.cn`、300 后台和 vessel 线上效果，发现展示、内容、交互、性能差距，并给 00 分派依据。 |

## 8. 当前模块边界

首页 / 前台主站：

- 首页已由后台 published Home modules 控制。
- Home hero、credentials、large product cards、model strip 等核心模块仍由后台内容驱动。
- B66-B81 连续处理首页展示节奏。
- B81 已上线：稳定 `HeroSection` headline/subtitle source priority，避免轮播状态切换后 H1 被 active slide 文案替换。
- 当前下一步：09 重新对比线上首页和 `en.303vessel.cn`，判断差距来自显示模板、后台内容/素材、模块新增能力，还是移动端/图片性能；涉及后台不懂处可只读学习 300.cn 后台。
- 风险：B81 解决的是 hero 主文案稳定，不代表两个首页已经完全对齐。Blog 导航、旧站型号 / footer 入口、CTA 节奏、nav / footer / model / blog / global presence 仍是 09 后续对比项，B81 未处理。Home visual editor/catalog 模板多于 draft add-module API 白名单，API 目前只接受 `simple-text` 和 `cta-section`。

Products / 产品中心：

- `/products` 是正式产品目录入口。
- 产品前台详情有两类合法入口：CMS 通用详情 `/products/{id}` 和固定精品详情 `/products/{detailSlug}`。
- 有 `detailSlug` 优先固定精品页，没有则走 CMS 通用详情。
- 价格仅展示，不接支付、订单、会员价、代理价或权限矩阵。
- CMS 数据为空时允许安全兜底或隐藏缺失字段，不用 TBD 硬填。

Cases / 项目案例：

- `/cases` 列表和 `/cases/[id]` 详情页已上线。
- 列表筛选真实生效，详情页已补 300.cn 对照字段。
- 案例详情主 CTA 已接页面内询盘表单，提交走 `/api/contact` 写入 `leads`。
- 当前项目数据基线：非删除 9 条、published 8 条、draft 1 条、map-ready CMS 项目 3 条。
- 不建议一次性导入大量项目，继续小批量样板策略。

Admin 2.0 / 运营后台：

- `/admin` 已重建为运营控制台。
- `/admin/legacy` 是 `admin-only` 旧后台维护入口。
- 内容管理主路径覆盖产品、新闻、项目、固定内容类型。
- 客户与线索正式入口是 `/admin/customers/leads`，旧 `/admin/leads` 只做兼容跳转。
- 后台 2.0 学习 300.cn 操作心智，不学习自由建站器能力。

Visual Editor：

- 主路径是 `/admin/pages/visual`。
- 已支持页面模块可视化预览、受控字段编辑、草稿 / 发布、发布前检查、差异摘要、快照恢复、模块内 item 管理。
- Home 安全插入区支持 `simple-text` / `cta-section` 的有限新增、排序和结构隐藏。
- 不是自由建站器；不支持自由 HTML / CSS、自由 DOM 或任意布局。

固定内容类型：

- FAQ、Media Kit、Scenarios、Display、Innovation 已接入 CMS 第一阶段。
- 前台优先读 CMS published 内容，保留静态兜底或安全空状态。
- Media Kit 只展示后台已发布且带可信 `file_url` 或可信链接的资源，不展示假下载。

Contact / Leads / Conversion：

- `/contact` 已切换为新站自有联系页。
- 表单复用 `/api/contact` 写入 `leads`。
- 前台 CTA 默认走 `/contact?source=...`，保留来源参数。
- `/admin/site/conversion` 是转化路径看板。
- 不做客户档案、会员体系、订单、支付；新线索后台不开放删除按钮。

SEO / Analytics / Performance：

- `/sitemap.xml` 已由 `src/app/sitemap.ts` 动态接管。
- `public/robots.txt` 指向 `https://www.vessel303.com/sitemap.xml`。
- 不做真实 Google Search Console 验证、sitemap 提交、DNS 或域名绑定修改，除非 Wynne 单独授权。
- `/admin/status` 是运营总览，包含内容、线索、站点、活动、访问分析等子页。
- 第一方 analytics 只记录路径、事件、来源、referrer、UTM、设备、匿名 visitor/session hash 和时间；不采集姓名、邮箱、电话、留言、原始 IP 或完整 User-Agent 到 analytics 事件。
- 新上传图片生成 `thumb/card/detail/original`；不删除原图，不一次性全量重算旧素材。

## 9. 当前最新节点

最新线上节点：B81。

B81 摘要：

- 名称：stabilize hero headline copy / 稳定首页 hero 主文案来源
- 日期：2026-06-04
- commit：`1f601f5` / full `1f601f5c3a2139fe687f77248f530a906eaae0e9`
- commit message：`fix(home): stabilize hero headline copy`
- Vercel deployment：`dpl_EyiJaN9JDGz36KatSXEKbvp8n99Q`
- Deployment URL：`https://vessel303-3m6pcts7g-vessel303.vercel.app`
- Alias：`www.vessel303.com`、`vessel303.com`
- 状态：READY
- 代码文件：`src/components/pages/HomePageContent.tsx`
- 范围：只调整 `HeroSection` headline/subtitle source priority。H1 优先 `hero-headline.label_*`，其次 module `title_*`，最后 fallback active slide `label_*`；subtitle 优先 `hero-subtitle.label_*`，其次 module `description_*`，最后 fallback active slide `content_*`；active slide `value_*` 仍作为 eyebrow 小上下文显示。
- 目标：轮播图片或 active slide 切换时，首页 H1 和 subtitle 仍稳定使用专用 hero 文案来源。
- 未改：CTA label/href、图片 URL、轮播图片、proof rail、Home module 顺序、后台 API、数据库、认证、权限、支付、订单、`/global`。
- 未新增：文案、素材或业务 claim；不要硬编码或新增 `Dual Certified`、`EU+US certified`、`45-day`、具体认证名/编号等未核实事实。
- 01 验证：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 均通过；仅既有 PostgreSQL SSL warning 和 `/global` edge runtime warning。
- 05 线上检查：首页 200 且无 `__next_error__`，线上 HTML 检到 H1 `VESSEL | Redefining What Space Can Be`；`/global` 200 且无 `__next_error__`；未登录 `/admin` 302 到 `https://vessel303.com/admin/login`。
- 05 最终 git status：`## main...origin/main`。
- 00/07 desktop 证据：1440x1000 initial 下 hero 0/700、credentials 700/158、large-product-cards 858/1633、SV918 title 954/60、scrollWidth/clientWidth 1434/1434、`__next_error__=false`；H1 source 为 `hero-headline.label_en`，text 为 `VESSEL | Redefining What Space Can Be`，subtitle source 为 `hero-subtitle.label_en`。轮播状态切到 `Share a destination plan...` 后，H1 仍来自 `hero-headline.label_en`。
- 00/07 mobile 证据：390x844 initial 下 hero 0/512、credentials 512/140、large-product-cards 652/1541、SV918 title 732/38、scrollWidth/clientWidth 384/384、`__next_error__=false`。4.4s/6.6s 后 active slide 为 `hero-image-02`、eyebrow 为 `MODEL RANGE`，H1 仍为 `VESSEL | Redefining What Space Can Be` 且来自 `hero-headline.label_en`，subtitle 仍来自 `hero-subtitle.label_en`；large-product-cards top 692、SV918 title top 772，不差于 B80 09 mobile 线上测量。
- 风险：B81 解决的是 hero 主文案稳定，不代表两个首页已经完全对齐；下轮回到 09 继续对比。
- proof 信息边界：只复用当前首页已发布 credentials stats；不要硬编码或新增 `Dual Certified`、`EU+US certified`、`45-day factory production`、具体 cert 名称/编号、或 broad global compliance。

下一步：

1. 05 验收 docs、commit、push 并等待 Vercel READY 后，交 09 重新对比 `www.vessel303.com` 与 `en.303vessel.cn`。
2. 09 下一轮重点看 hero H1/copy 语义是否仍有差异、mobile 首屏产品露出位置、nav / footer / model / blog / global presence 差异，以及旧站与新站 desktop/mobile product rhythm 是否还需要继续收敛。
3. 显示模板问题交 01。
4. Home module 内容、素材、模块新增能力问题交 02 / 03。
5. 移动端、图片、性能问题交 07。
6. 涉及后台/CMS/Visual Editor/运营后台产品心智时，不确定处可只读学习 300.cn 后台。
7. Blog 导航、旧站型号 / footer 入口、CTA 节奏仍由 09 后续判断，不要写成 B81 已处理。

## 10. 文档维护规则

- `CODEX.md` 只保留当前可执行依据，不再记录完整过程流水。
- 当前事实、硬规则、角色分工、模块边界、最新线上基线和下一步改变时，可更新本文件。
- 需要完整历史时，打开 V9 full archive，不要把 B1-B74 流水重新复制回 `CODEX.md`。
- V10 是本机当前 handoff 基线；如果 V10 和本文件冲突，先按 V10 暂停并通知 Wynne/06 收口。
- 不要删除历史归档里的 V9。
