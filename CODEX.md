# CODEX.md - vessel303.com Codex 当前操作入口

最后更新：2026-06-05

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
5. 默认按同主题批次推进：多个小修可以先合并成一个可验收的大变动批次，但批次内仍要保持边界清楚、可回滚、可验证。

当前循环：

`09 差距对比 -> 00 拆任务 -> 01/02/03/07 开发或修复 -> 05 验收上线 -> 06 文档收口 -> 05 文档复验上线 -> 09 继续对比`

批次闭环规则：

- 09 可以持续发现差距，但不再默认每发现一个 `x.x.1` 小点就触发完整 `05 -> 06 -> 05 -> 09` 闭环。
- 00 默认把同主题、同风险等级、同一业务口径下的小修合成一个 `x.1` 批次，再分派 01 / 02 / 03 / 07 连续处理。
- 00 是是否提前收口的默认裁决人；01 / 02 / 03 / 07 / 09 可以建议提前收口，但不能自行进入 05 / 06 / push / 上线。
- 只有出现 P0 / P1、生产风险、检查失败、上下文即将失控、跨模块范围过大、未知 git 状态、或 Wynne 明确要求时，00 才提前交 05 验收上线和 06 文档收口。
- 批次合并不能覆盖安全边界：数据库、权限、认证、支付、订单、生产配置、300.cn 后台真实变更、`/global` 底层风险仍需单独授权和单独收口。
- 05 / 06 默认只在一个批次完成或 00 判定需要提前收口时介入；05 仍负责最终验收、commit、push、Vercel READY 和线上检查，06 仍负责文档收口。

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
| 00 项目总控 | 接收 Wynne 需求，拆任务，判断归属，合并同主题批次，调度 01 / 02 / 03 / 04 / 05 / 06 / 07 / 08 / 09，并决定是否提前收口进入 05 / 06。默认不直接开发、不验收、不写长文档，除非当前任务明确要求。 |
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
- B66-B82 连续处理首页展示节奏和主导航入口。
- B82 已上线：修复 desktop 1440 下 `Global Presence` 导航入口不可见问题，`nav-global` wrapper class 从 `hidden 2xl:block` 改为 `hidden xl:block`。
- 当前下一步：09 重新对比线上首页和 `en.303vessel.cn`，判断差距来自显示模板、后台内容/素材、模块新增能力，还是移动端/图片性能；涉及后台不懂处可只读学习 300.cn 后台。
- 风险：B82 只解决 `nav-global` desktop 1440 可见性，不代表两个首页已经完全对齐。Blog / News 不公开；`/news` 当前 404 / 保护状态不作为失败；`nav-news` / footer blog 仍 hidden / empty；不恢复 footer old model / blog 列表。Home visual editor/catalog 模板多于 draft add-module API 白名单，API 目前只接受 `simple-text` 和 `cta-section`。

Products / 产品中心：

- `/products` 是正式产品目录入口。
- 产品前台详情有两类合法入口：CMS 通用详情 `/products/{id}` 和固定精品详情 `/products/{detailSlug}`。
- 有 `detailSlug` 优先固定精品页，没有则走 CMS 通用详情。
- B83 已完成产品页优化闭环：以 E7、V9、E6、E3、S5 五个样板为主，打磨 `/products`、V9/S5 详情页、CMS 字段完整度、公开内容清洗、图片展示负载和产品审计脚本；这不是“全部产品上架”任务。
- V9/S5 样板产品 CMS 字段已由 00 授权写入 vessel 自有后台范围；300.cn 后台未保存、上传、发布、删除或改配置。
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

最新线上节点：B83。

B83 摘要：

- 名称：product page optimization closure / 产品页优化闭环。
- 日期：2026-06-05（America/New_York；部署 READY 跨 UTC 2026-06-06）。
- commit：`bef8fdb` / full `bef8fdba6b8c3c954fc0dd9854d0255741457f93`。
- commit message：`feat(products): close sample product page loop`。
- Vercel deployment：`dpl_6JErfD5tpKzfiGRaWhGSfcG9NnxH`。
- Deployment URL：`https://vessel303-b5jbyh7i1-vessel303.vercel.app`。
- Alias：`www.vessel303.com`、`vessel303.com`。
- 状态：READY。
- 范围：`/products` 产品列表页、核心产品详情页、产品后台字段完整度、产品图片公开展示负载、产品审计 / 授权 / 写入脚本。
- 样板范围：E7、V9、E6、E3、S5 五个重点样板；不是全部产品上架。
- 已完成：V9/S5 样板 CMS 字段补齐，产品列表和详情页公开内容清洗，V9 图库公开展示截断，详情模块 `items` / `links` 渲染支持，产品卡片 / 详情价格空值安全兜底，后台产品列表完整度提示和商业条款字段识别。
- 00 授权边界：本轮只写入 vessel 自有后台 V9/S5 样板产品字段；300.cn 后台未保存、上传、发布、删除、提交表单或改配置。
- 05 验证：targeted eslint、`git diff --check`、`git diff --cached --check`、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 通过；线上 `/products`、`/products/v9-gen6`、`/products/s5` 均 200；线上 `audit:published-content` 通过，线上 `audit:product-public-rhythm` 为 0 issue。
- 未改：`/global`、MapLibre / MapTiler、300.cn 后台、权限、认证、支付、订单、会员、代理价、国家版本价格规则。
- 非阻断风险：V9 CMS 内部图片库存仍多于公开展示负载，但前台已截断展示且图片审计无性能告警；后续如要整理媒体库，单独交 07。

下一步：

1. 05 验收 docs、commit、push 并等待 Vercel READY 后，交 09 做产品页只读复核。
2. 09 下一轮重点看 `www.vessel303.com/products`、V9/S5 详情页与 `en.303vessel.cn` 产品列表 / 详情节奏是否仍有差距。
3. 若是显示方式、详情页首屏、图库、CTA、相关产品、询盘路径问题，交 01。
4. 若是 CMS 字段、published 内容、产品资料样板缺口，交 02；继续控制在 3-5 个样板，不追求全部产品上架。
5. 若是图片体积、移动端加载、V9 CMS 图片库存治理，交 07。
6. 300.cn 后台仍只读对照和资料获取，不得保存、上传、发布、删除、付款、购买、提交表单或改配置。

## 10. 文档维护规则

- `CODEX.md` 只保留当前可执行依据，不再记录完整过程流水。
- 当前事实、硬规则、角色分工、模块边界、最新线上基线和下一步改变时，可更新本文件。
- 需要完整历史时，打开 V9 full archive，不要把 B1-B74 流水重新复制回 `CODEX.md`。
- V10 是本机当前 handoff 基线；如果 V10 和本文件冲突，先按 V10 暂停并通知 Wynne/06 收口。
- 不要删除历史归档里的 V9。
