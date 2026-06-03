# CODEX.md - vessel303.com Codex 接手文档

最后更新：2026-06-01

这是 `vessel303.com` 给 Codex 使用的接手文档和操作指南。每次新对话或开始大改动时，先读 `AGENTS.md`，再读本文件。

`CLAUDE.md` 是另一个模型留下的历史文档，里面仍然有有用的业务规则和事故记录，但当前 Codex 的工作入口以本文件为准。除非 Wynne 明确要求，不要主动修改 `CLAUDE.md`。

当前开发指导以 Wynne 本机文档库中的 V9 handoff 为准：

`C:\Users\Wynne\Desktop\vessel303\vessel303文档\vessel303_handoff_V9.md`

旧 handoff 已归档，仅作为历史背景，不再作为当前开发依据。

## 项目概况

- 负责人：Wynne / 何总
- 品牌：VESSEL 微宿
- 官网：`https://www.vessel303.com`
- GitHub：`https://github.com/WynneWBD/vessel303`
- 本地真实代码路径：`C:\Users\Wynne\Desktop\vessel303\repo-git`
- 部署：Vercel Pro，push 到 `main` 会自动触发生产部署
- 数据库：Neon Postgres
- 图片存储：Vercel Blob，store 为 `vessel303-media`，public，区域 `sin1`
- 默认沟通语言：中文

这个网站是 VESSEL 微宿的国际 B2B 官网，面向海外度假村开发商、酒店集团、地产开发商、政府采购等客户。它不是国内 C 端营地预订站。

核心目标：展示产品力，通过认证、案例、工厂内容建立信任，并捕获采购线索。

## 当前 Handoff

当前开发指导以 Wynne 本机文档库中的 V9 handoff 为准：

- `C:\Users\Wynne\Desktop\vessel303\vessel303文档\vessel303_handoff_V9.md`

V9 handoff 位于 `repo-git` 外层文档库，不随本仓库 Git 提交；它是 Wynne 本机 Codex 接手时使用的当前指导文件。

旧 handoff 已归档，仅作为历史背景，不再作为当前开发依据。

进入开发前，必须对照 V9、当前代码和必要的数据库只读核对结果。业务需求资料不能直接当作当前代码事实。

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

Next 16 特别提醒：`middleware` 文件约定已经被标记为 deprecated，官方建议使用 `proxy`。本项目已迁移到 `src/proxy.ts`，不要再新增或恢复 `src/middleware.ts`。

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
4. 非 05 聊天框只有 Wynne 在当前任务中明确授权“提交/推送/上线”时，才可以 push `main`；05 可按默认验收流程提交并 push `main`。
5. `push main` 会触发 Vercel 生产部署；push 后要验证对应线上页面。

05 默认验收/上线流程：

- 开发框完成一个明确小任务后，可以直接交给 05 验收。
- 05 先测试并查找问题；如果发现问题、检查失败、存在未知文件或未知 commit，必须停止，不提交、不推送，并报告 Wynne。
- 验收通过后，05 可以提交并 push `main` 上线；push 前必须列出即将推送的 commit 列表，确认没有未知改动或无关 commit。

当前本地常见情况：Wynne 可能会移动或整理参考文档，导致 `参考文档/`、旧 handoff、xlsx 等文件出现在 git status 中。除非 Wynne 明确要求，不要清理这些状态。

## 当前业务边界

当前阶段不要把中长期目标误判为废弃需求，也不要把未确认需求写死到代码里。

产品中心 / 产品管理：后台 B4-0 至 B4-16 已参照 300.cn 产品管理心智完成安全核心能力；B7 已完成产品中心前后台 300 对齐深改；B10 已完成产品中心前后台 / 固定精品页 / CMS 通用详情页闭环；B18 已对通用产品详情做第一轮 UI 精修；B21 已完成产品中心运营路径和前台展示精致度补强；B22 已继续按 300 / 303vessel.cn 的高清产品感、目录感、咨询路径和移动端体感做前台精修；B37 已把产品详情继续推进为 303 式产品册展示，后台发布图库、规格、Buyer Downloads、运输 / 安装 / 认证说明、关键词、相关产品后，前台只负责展示。`/products` 保持正式入口并升级为 300 式 B2B 产品目录：顶部 PRODUCTS banner、左侧分类树、搜索、属性筛选和分页；B22 后首屏改为产品图驱动的目录 hero，产品卡片改为更高图片占比和 Details / Inquiry 双入口，侧边栏补“找不到合适型号”source-aware 咨询卡，让运营能看清产品数量、筛选来源和线索入口。`/products/[slug]` 通用 CMS 详情模板已补齐图库、价格展示、商务条款、Product Description、Classification、Keywords、Consult 和 Related Products，并在 B22 后增加 Product Description / Classification / Keywords / Consult / Related Products 锚点导航和 source-aware 联系入口；B37 后新增后台 labels 驱动的 Product Specifications、Buyer Downloads、Keywords、Related Products 区块标题和首屏 Request Quote 锚点。产品前台详情页现在只有两种合法入口：CMS 通用详情 `/products/{id}` 和固定精品详情 `/products/{detailSlug}`，产品卡片、Related Products、后台官方预览和新版 `/admin/content/products/list` 均使用同一套规则：有 `detailSlug` 优先打开固定精品页，没有则打开 CMS 通用详情。后台产品表单、列表和经营中心已支持价格展示文本、商务条款、关键词、相关产品、官方前台页 / CMS 通用页提示和缺项提示；`product_catalog` 新增 nullable `price_display_zh/en`、`commercial_terms`、`keywords_zh/en`、`related_product_ids`，默认属性模板补齐 `Default Configuration`、`Product Configuration`、`Area`、`Country` 时只在缺失时创建，不覆盖运营配置。价格仅展示，不接支付、订单、会员价、代理价或权限矩阵；CMS 数据为空或生产库没有静态样板产品时，前台详情继续保留静态兜底，缺失字段不显示，不用 TBD 硬填。

页面编辑 / 网站管理：B5-1 至 B5-6 已参照 300.cn 网站管理心智完成安全第一阶段。`/admin/site` 已新增“发布与更新”快捷入口，`/admin/site/pages` 已新增页面清单与编辑边界视图，`/admin/site/navigation` 已新增导航管理只读盘点，`/admin/site/seo` 已新增 SEO / TDK 只读检查入口，`/admin/site/settings` 已新增网站信息 / 三方代码 / 搜索边界只读状态入口，并已由 `src/app/sitemap.ts` 接管 `/sitemap.xml` 动态 sitemap 基线，`public/robots.txt` 指向 `https://www.vessel303.com/sitemap.xml`。B16 已完成 SEO / Search Console 接入准备与索引基础收口：300 后台 SEO 优化入口已只读确认包含网站地图、Robots、TDK 设置、内贸城市产品页和内页辅助收录；vessel 已补齐 `/products`、产品通用详情、`/products/v9-gen6`、FAQ、Media Kit、Display、Scenarios、Innovation 等公开页的 canonical / OpenGraph / Twitter metadata；`/sitemap.xml` 补入固定精品产品页、Scenarios、Innovation、Media Kit、Display 等应收录路径；`/admin/site/seo` 已升级为“SEO / 收录准备中心”，展示 sitemap 覆盖、robots 状态、Search Console 接入清单、页面 metadata 完整度和后台维护入口。B18 已把图片素材和页面可视化编辑补进网站管理 2.0 主路径：新增 `/admin/site/media`、`/admin/site/visual`，并把新后台相关按钮改为直达新路径；旧 `/admin/media`、`/admin/pages/visual` 仅作为兼容入口跳转，不再承载旧壳运营主路径。B20 已完成首页 / About / FAQ / Footer 品牌叙事与前台精致度补强：`/` 新增 Operating Map 运营导览区，`/about` 新增 Brand Decision Path 品牌决策路径，`/faq` 新增 FAQ 使用路径提示，Footer 增加可信度 / 咨询路径提示；B22 继续补强产品、案例、FAQ、About、首页、Scenarios、Innovation、Media Kit 和 Footer 的 300 式视觉节奏、移动端体感和 CTA 可追踪性，并在 `/admin/site/pages`、`/admin/site/navigation`、`/admin/site/conversion` 标明对应前台区块的后台 owner、编辑边界和转化去向。后续若要把这些新增提示变成可运营编辑模块，需另开 Home/About/FAQ/Footer CMS 或可视化编辑任务。当前区分 Home/About 可视化编辑、产品 / 项目 / 新闻独立 CMS、FAQ / 文件下载 / 场景方案 / Display / 技术专题固定内容 CMS、联系入口有限接线索、Global 受保护；不开放自由建站器、自由 HTML / CSS、导航保存、导航排序 / 隐藏 / 新增栏目保存、批量 TDK、三方代码保存、Search Console 真实绑定、Google API 接入、sitemap 提交、DNS / 域名绑定修改或 `/global` 底层修改。

固定内容类型 CMS：B9 已完成除 `/global` 外静态前台模块的第一阶段 CMS 化，范围为 FAQ、Media Kit / 文件下载、Scenarios、Display、Innovation。新增共享 `site_content_categories` / `site_content_items` schema 和 B9 内容 API，后台新增 `/admin/content/faq`、`/admin/content/media-kit`、`/admin/content/scenarios`、`/admin/content/display`、`/admin/content/innovation`，统一支持分类 / 固定 slug / 排序 / draft / published / hidden 状态，不做物理删除；`/faq`、`/media-kit`、`/scenarios/[slug]`、`/display`、`/innovation/viie|vipc|vols` 均为 CMS 优先、静态兜底或安全空状态。`/media-kit` 表单会优先写入 `leads` 并保留邮件通知；B37 后 `/media-kit` 资源从侧栏提升为资料中心网格，只展示后台已发布且带 `file_url` 或可信链接的资源，不显示假下载；Display 优先读取 B9 展示配置，其次读取 published 产品作为兜底展示，不再只依赖代码内静态价格和图片；B18 已为 `/display` 展示项补 Details 与 Consult 链接，CMS 展示项可通过 payload 指定 `href/product_href/detail_href`，未指定时按型号安全推断现有产品详情路径。B9 不批量导入内容、不做自由建站器、不改权限矩阵、不改支付 / 订单 / 会员、不碰 `/global`、MapLibre、MapTiler 或 `/api/map`。

数据分析 / 运营统计：B6 已重新定义为内部运营数据中心，不再沿用早期旧 B 包“设置项接管 B6”编号。`/admin/status` 已升级为“运营数据中心”，并新增 `/admin/status/content`、`/admin/status/leads`、`/admin/status/site`、`/admin/status/activity`、`/admin/status/traffic` 子页；统计集中读取现有 `product_catalog`、`project_cases`、`news`、`leads`、`uploads`、页面草稿表和 `site_settings`，表不存在或查询失败时降级显示，不应 500。B15 已把 `/admin/status/traffic` 从“访问分析准备”升级为第一方网站数据分析：新增 `site_events` 事件表、`/api/analytics/event` 非阻塞事件接口、全站公开页 `page_view` / `cta_click` / `contact_redirect` 埋点、表单成功 `form_submit_success` 记录，以及 `/admin/site/conversion` 转化路径看板 30 天访问 / 动作 / 表单 / 线索 / 转化率联动。B15-9 已完成数据口径校准：主运营指标默认排除 `admin-test` analytics 事件、`admin_test%` source 和 `Codex B* test` 测试线索，测试数据仍保留在生产库但单独显示排除数量，避免 B14 / B15 验收数据抬高转化率。B15-10 已完成真实运营观察与数据口径固化：只读复核生产近 30 天 `site_events` / `leads` 后，确认真实访问、测试事件、真实线索和测试线索能分开解释；本轮只写入 1 条 `admin_test:b15-10:cta_click` analytics 测试事件用于验证排除口径，不创建测试线索、不删除数据。B15 只记录页面路径、事件类型、来源类型、referrer、UTM、设备类型、匿名 visitor/session hash 和时间；不存姓名、邮箱、电话、留言、原始 IP 或完整 User-Agent。不接 GA / Search Console / Vercel Analytics API，不注入第三方统计脚本，不做复杂 BI、会员 / 订单 / 支付，不碰 `/global` 底层。

客户与线索管理：B11 已完成客户与线索后台 2.0 收口。正式线索管理入口为 `/admin/customers/leads`，使用新后台 `AdminSectionShell`，承载线索列表、状态筛选、搜索、详情查看、状态更新、跟进备注、负责人分配和 CSV 导出；旧 `/admin/leads` 仅作为兼容入口保留，带 query 跳转到 `/admin/customers/leads`，不再展示旧 `AdminShell` 侧栏。`/admin` 待处理线索、`/admin/customers` 状态卡、`/admin/status/leads`、`/admin/status/activity`、旧 Legacy / 设置 / 用户关联入口均已收口到新路径。B12 已把前台 Navbar / Footer / 首页 / About / FAQ / Cases / Scenarios / 产品通用详情 / 固定精品详情的咨询入口统一到 `/contact`；B28 后 `/contact` 已切换为新站自有联系页，不再默认跳 300 旧联系页。B14 已完成运营目标全链路对齐与转化闭环：新增 `/admin/site/conversion` 转化路径看板，通用产品详情、FAQ、Scenarios、Innovation 页面新增轻量询盘表单，新闻详情增加带来源参数的联系 CTA；案例和 Media Kit 保持既有表单并复核来源追踪。B28 已把 Contact 从 external 路径调整为 lead 路径：`/contact` 表单复用 `/api/contact` 写入 `leads`，`source` 使用 `contact:main:inquiry_form` 并保留 URL source 参数；`site_settings.contactUrl` 降级为后台备用旧站联系入口，不再作为主跳转。线索 2.0 已把 `source` 技术字符串翻译为运营可读标签，支持来源类型筛选，并在详情中显示来源页面 / 入口类型 / 关联产品或页面和来源跳转。数据和 API 继续使用现有 `leads`、`/api/contact`、`/api/admin/leads`、`/api/admin/leads/[id]`、`/api/admin/leads/export`；生产环境不显示“新建测试线索”，新 2.0 页面不开放删除按钮。B14 真实链路验收创建 6 条低风险生产测试线索，均标记 `Codex B14 test`，不删除。本轮不做客户档案、会员体系、订单、支付、权限矩阵、删除数据或 `/global` 底层。

性能 / 图片 / 前台速度：07 负责全站性能专项，包括首页首屏速度、产品列表打开速度、图片体积、前台缓存、Lighthouse / Chrome Network 基线和线上轻量测速。B8 已完成第一轮性能与图片治理：修复 `/admin/media` 嵌套 button 导致的 hydration 风险，公开产品列表 / 筛选 / 详情改为轻量缓存读取并避免公开路径触发 schema 初始化，首页 hero 改为只渲染当前图和下一张图并新增优化图片资产，后台媒体上传增加大图提示，产品写入后会刷新公开产品缓存。B13 已完成真实性能瓶颈定位、第一修复包、第二阶段图片管线治理和 B13-3 公开页面缓存 / 旧素材小批量回填：第一修复包确认生产 `/about` 慢点主因是首屏原始 Blob 大图，并让 Vercel Blob 图进入 `next/image` 优化；第二阶段新增 `uploads.variants`，上传图片后生成 `thumb/card/detail/original` 派生图，媒体库和后台图片选择器优先用 `thumb`，产品 / 案例 / 新闻 / Display 等前台按场景优先用 `card` 或 `detail`；B13-3 已让 `/products`、`/cases`、`/news`、`/faq`、`/contact` 等公开页面进入可缓存 / 预渲染状态，旧媒体已先回填 5 张缺派生图生产图片，并新增关键静态大图优化副本。真实生产上传验收已创建测试媒体 `b13-variant-pipeline-test.jpg`，验证 `thumb/card/detail/original` 均写入且派生图可访问；测试图不删除，删除仍需单独确认。产品中心体验问题由 01 配合，后台 API、CMS 查询或后台实现瓶颈由 02 处理，05 负责验收性能改动是否真实改善；后续旧素材继续分批回填、后台产品页首屏速度、全站点击体感和 Lighthouse 深测继续由 07 拆小步推进。

项目案例：`project_cases` 当前非删除 9 条、published 8 条、draft 1 条、map-ready CMS 项目 3 条；不建议一次性导入 40 项，继续小批量样板策略。缺失字段不显示。`/cases` 列表已指向 `/cases/[id]` 正式详情页，筛选按钮已真实生效，详情页已补齐 300.cn 对照字段和相关案例入口；B18 已对案例详情做第一轮 UI 精修，强化首屏图文分栏、标签、数据卡片和 CTA 层级。B2-6 全链路回归已完成，前台主导航 Cases 已回到 `/cases`，后台项目引用入口已收口到新版 `/admin/content/projects/{id}/edit`；B2-7 已把案例详情主 CTA 接到页面内 `#case-inquiry`，表单提交走现有 `/api/contact` 并写入 `leads`；Global 仍只作为独立地图展示渠道；空规格字段隐藏，不显示 `-`，不用 TBD 硬填。

新闻资讯：B3-0/1/2 已完成新闻后台 2.0 主路径，正式路径为 `/admin/content/news -> /admin/content/news/list -> /admin/content/news/new 或 /admin/content/news/{id}/edit`；旧 `/admin/news`、旧 new / edit 路径继续作为维护备用。新闻 2.0 已参照 300.cn 新闻资讯模块收口状态筛选、搜索、添加、编辑、预览、发布前检查和删除入口；B3-3 已补 300 对照运营能力规划，在 `/admin/content/news` 展示分类管理、回收站、批量操作、定时发布的安全边界，在 `/admin/content/news/list` 补批量选择和禁用批量操作预演；B3-4 已新增 `/admin/content/news/categories` 新闻分类字段方案页；B3-5 已完成新闻分类真实建表与保存接入，新增 `news_categories` 表、`news.category_id` nullable 字段、后台分类 API、表单保存 / 发布前保存同步分类、后台列表分类列与分类筛选，默认分类为 `公司资讯`、`产品与展会`、`项目案例`、`行业观察`；B3-6 已完成新闻全链路只读回归；B3-7 已开放新闻分类新增、编辑、排序、显示 / 隐藏和稳定测试定位，不做分类物理删除；B3-8 已开放新闻回收站列表和恢复为草稿，不做永久删除；B3-9 已开放低风险批量转分类，不开放批量发布、批量删除、永久删除或翻译；B3-10 已开放单篇新闻定时发布第一阶段，新增 nullable `news.scheduled_at`、定时筛选、表单保存 / 清除计划发布时间和概览定时入口，但不做自动执行器、失败重试或批量定时；B3-11 已开放新闻 SEO 字段治理第一阶段，新增 nullable `news.seo_title_zh`、`news.seo_title_en`、`news.seo_description_zh`、`news.seo_description_en`，编辑页可保存搜索标题 / 描述，前台 `/news/[slug]` metadata 优先读取 SEO 字段；B3-12 已完成生产环境真实全链路回归，作为运营人员从新建草稿、封面、分类、定时、SEO、发布、前台验证、取消发布、批量转分类、软删除、回收站恢复到最终清理均跑通，未发现需要 02 修复的问题。旧 `/admin/news`、旧 new / edit 路径也已接入服务端预加载分类，避免浏览器插件拦截客户端分类 API 时下拉不可用。定时自动执行器、关键词、批量 SEO、SEO 自动生成、权限分级仍作为后续任务，不在普通主路径小修中混入。真实测试新闻 `vessel-news-console-2-test-20260525` 已完成发布、前台验证、删除验证、B3-8 恢复验收、B3-9 批量转分类验收、B3-10 定时保存 / 清除验收和 B3-11 SEO 字段保存验收；B3-12 真实回归测试新闻 `b3-12-news-full-chain-qa-20260526` 已完成发布 / 取消发布 / 回收站恢复全链路，最终 soft-deleted 留在回收站，未永久删除，前台列表不展示，详情页返回 404。

Global：`/global` 未来要 CMS 化，但短期不贸然改地图底层链路。最新生产规则：`/global` 挂在生产展示链路上，在新站正式接管 Global 生产链路前，Global 内所有“联系方式 / 联系我们 / 查看产品 / Contact / Products”入口必须连接老 303 站相关页面：联系走 `https://en.303vessel.cn/contact.html`，产品走 `https://en.303vessel.cn/products_list.html`。这是 B28 新站闭环规则的 Global 例外，不得被 `normalizeSiteHref` 或通用 CTA 规则改回新站 `/contact`、`/products`；MapLibre、MapTiler 和 `/api/map` 仍归 04 地图专项。

价格与会员：价格体系、会员体系、代理后台、中文站、支付系统是中长期专项。价格规则未确认前，不把游客价、注册会员价、代理价、国家价写死。

`site_settings`：已初始化；B28 后 `contactUrl` 不再接管 `/contact` 主跳转，仅作为后台可选备用旧站联系入口。`/contact` 主页面由 `page_modules:contact` 和站点文案字典承接，联系表单写入 `leads`。后续扩展产品外链、SEO 默认值等必须单独任务、单独验收。

B9 真实样板补齐：生产后台已发布 6 条样板内容，用于验证固定内容 CMS 的真实运营链路：FAQ `project-lead-time`、FAQ `multi-unit-resort-support`、Media Kit `vessel-product-assets-pack`、Scenario `tourism`、Display `e7-gen6-sample-display`、Innovation `viie`。本轮同时修复 B9 后台保存链路：`B9ContentManager` 增加可达保存入口和可见表单字段兜底读取，`src/lib/b9-content-db.ts` 修复 `status` 参数类型推断，避免生产插入时报 `inconsistent types deduced for parameter $16`。线上只读验收确认 `/faq`、`/media-kit`、`/scenarios/tourism`、`/display`、`/innovation/viie` 均 200，公开 API 可读到样板内容且中文字段正常；直接用浏览器打开 `/api/admin/site-content*` 可能被本机扩展拦截为 `ERR_BLOCKED_BY_CLIENT`，05 验收应以已登录后台页面、认证 API 请求和前台公开页面组合判断。

B28 主站转化闭环与旧站依赖切断已完成并上线。目标是让 `vessel303.com` 成为海外客户主站，关键路径不再跳回旧 300 英文站。代码提交 `e5df597 feat(site): close main conversion paths`（full SHA `e5df5976c2b8707e3ed71e481dba1866c2ec4a1c`）完成主功能，构建修复提交 `14bcded fix(build): use webpack build on Vercel`（full SHA `14bcded857acebd37205e8b16ad2fdb427fa3e84`）让 Vercel 使用 `next build --webpack`；最终 production deployment `dpl_FJxwfUpBMLaBDxKRFVLXadd2F3pT` READY，production alias 包含 `https://www.vessel303.com`。本轮把 `/contact` 从旧站 redirect 改为新站自有联系页，内容由 `page_modules:contact` 承接，表单写入 `leads`，source 为 `contact:main:inquiry_form` 并保留 URL source；`site_settings.contactUrl` 降级为备用旧站联系入口。Navbar 不再在公开营销导航显示登录姓名、邮箱、`Codex Test Operator` 或角色信息；首页 / Navbar / Footer / 产品相关 CTA 统一归一到新站 `/products`、`/contact`、产品详情和案例详情。Global 是生产展示例外：`/global` 内联系方式、联系我们、查看产品、Contact、Products 入口必须连接老 303 站相关页面，联系走 `https://en.303vessel.cn/contact.html`，产品走 `https://en.303vessel.cn/products_list.html`，不得用通用新站闭环规则改回 `/contact` 或 `/products`。`/global` 未改 MapLibre、MapTiler 或 `/api/map` 底层。`/admin/site/conversion` 中 Contact 已从 external 路径改为 lead 路径，旧站产品 / 联系 URL 由 `normalizeSiteHref` 归一并由后台质检标记为风险旧链；但该归一规则不适用于 `/global` 的生产展示入口。验收记录：`git diff --check`、`node scripts/audit-public-content.mjs`、`node scripts/audit-published-content.mjs`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack`、`npm.cmd run build` 均通过；线上 `/contact` 200 且 `X-Vercel-Cache: HIT`，`/products` 200，`/global` 200，未登录 `/admin/site/conversion` 302 到 `/admin/login`。未删除业务内容，未改权限、认证、支付、订单、会员，未改 `/global` 地图底层。后续如果要重新启用客户确认邮件，应先把邮件正文完整接到后台 `contact:email` 或文案字典后再开放发送。

B29 新站生产切换前总验收与上线准备已完成代码侧检查和上线准备，不执行 DNS、生产域名切换、Search Console 提交、旧站下线或旧站内容批量迁移。代码提交 `7f1de0a chore(site): add B29 readiness audits`（full SHA `7f1de0a15b6c81faefe2602eece049e6b26d5bd3`），Vercel deployment `dpl_76HLe2caKhFCEES5qrwKxNgknE5Z`，URL `https://vessel303-12scc2gge-vessel303.vercel.app`，状态 `READY`，production alias 包含 `https://www.vessel303.com`。本轮新增 `npm.cmd run audit:production-links`，用于生产切换前检查公开主路径 HTTP 状态和旧站依赖：除 `/global` 明确例外和后台备用外链外，主站公开路径不得出现 `en.303vessel.cn/contact.html` 或 `en.303vessel.cn/products_list.html`；`/global` 则必须继续保留老 303 联系和产品跳转。`audit:published-content` 已修正 `300+ Projects Delivered` 这类真实公开指标的误报，仍拦截 `300 对齐`、`300.cn`、`300 后台` 等内部说明词。验收记录：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；线上 `/`、`/contact`、`/products` 为 200 / `PRERENDER`，`/global` 为 200，未登录 `/admin/customers/leads` 302 到 `/admin/login`，`/sitemap.xml` 和 `/robots.txt` 均 200。Chrome 抽查 `/global` 确认 `legacyContact=true`、`legacyProducts=true`、`newContact=false`、`newProducts=false`。B29 真实链路验收写入 7 条低风险测试线索并保留不删除：Contact `8c63d898-9ccf-484f-96fe-68b4f8f5a0be`、Product `e902c978-dda7-4972-800d-c0e008741f48`、Case `c1cdade4-9e80-49ad-b038-0552e48a5786`、FAQ `1df781ce-6bd1-4adb-a114-5f308334c327`、Scenario `943895ec-ed95-4b76-9e3b-f4080e029092`、Innovation `41ffb47e-2b76-4f50-916a-b0c7525c869a`、Media Kit `ff94b926-4c0c-40ec-9799-b94e1b2c399f`；这些记录均带 `Codex B29 test` 标记，按既有 analytics 规则不进入主运营指标。B29 结论：普通公开主路径、Contact、产品 / 案例 / FAQ / Media Kit 线索闭环、基础 analytics、SEO / sitemap / robots 已具备生产切换准备条件；正式切换前仍需 Wynne 单独决定 DNS / 域名、Search Console 真实绑定与提交、旧站下线节奏、旧 303 高价值产品和案例内容迁移，以及 `/global` 地图底层正式接管。生产切换前不得再把 `/global` 的 Contact / Products 改回新站路径。

B30 生产切换决策包与上线 Runbook 已完成。B30 不执行 DNS、域名 alias 切换、Search Console 提交、旧站下线或旧站内容迁移，只输出可执行、可回滚、需人工授权的切换包。规则源复核发现 `AGENTS.md` 仍保留“联系 / 产品统一跳旧站”的广义旧规则，该规则与 B29 / B30 当前业务规则存在冲突；本轮未改 `AGENTS.md`，仅记录风险。当前生产规则以本文件和 V9 handoff 为准：主站普通路径闭环到新站 `/contact` / `leads`，只有 `/global` 的 Contact / Products 在新站正式接管 Global 前继续跳旧 303。B30 彩排验收记录：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；`audit:production-links` 在本地 sandbox 下 HTTP 受限，按既有规则使用已授权网络复跑通过。线上 `/`、`/products`、`/contact`、`/global`、`/sitemap.xml`、`/robots.txt` 均 200，未登录 `/admin/customers/leads` 302 到 `/admin/login`；Chrome 实页抽查 `/global` 确认“查看产品”指向 `https://en.303vessel.cn/products_list.html`，“联系团队”指向 `https://en.303vessel.cn/contact.html`。B30 写入 1 条低风险生产 dry-run 线索并保留不删除：`codex.b30.test@example.com` / `Codex B30 Dry Run`，后台 `/admin/customers/leads` 显示为“通用联系 / Main contact page”，备注含 `Codex B30 dry-run test`，按既有 analytics 规则不进入主运营指标。Resend 正式发件身份仍未配置；客户表单可以入库，但邮件通知 / 客户确认邮件不属于 B30 已闭合的生产能力。B31 前需 Wynne 单独授权并确认：DNS / 域名切换、Vercel domain alias、Search Console token 和 sitemap 提交、旧站下线节奏、旧站内容迁移、Resend 发件域名和通知收件人，以及是否先修正 `AGENTS.md` 的广义旧规则。

B31 海外销售力后台化补强与 303 对齐已完成并上线。代码提交 `f35f2ac feat(site): strengthen overseas sales controls`（full SHA `f35f2aca44eaa9b21f7cad6767c11f29394b8fc1`），Vercel deployment `dpl_9mhRp8ToDogTaDPMR5SUYoBu494x`，URL `https://vessel303-hyrtwzqod-vessel303.vercel.app`，状态 `READY`，production alias 包含 `https://www.vessel303.com`。本轮遵循“后台是控制器，前台是显示器”：新增后台 published 配置 `site:floating-contact` 承接浮动 WhatsApp / Email / Project Inquiry，Footer、Contact、站点默认设置统一到 `303vessel@303industries.cn` 和 `+86 180 2417 6679`；前台只渲染后台已发布配置，无配置则隐藏。`/products` 英文模式修复分类 / 属性筛选中文残留，缺英文 label 时隐藏而不是回退中文；Navbar 桌面断点从 `xl` 调整到 `lg`，避免约 1096px 宽度过早折叠菜单；Footer 支持后台配置的 WhatsApp / http / mailto / tel 链接。后台质检已补充英文字段混中文、旧 400 电话、旧邮箱、旧站链接、产品下载资料缺口、产品商务资料缺口和案例商业证明缺口提示；这些提示只在后台显示，不注入前台。`/api/contact` 已清理硬编码客户确认文案，只有后台 `contact:email` 发布确认邮件文案时才发送客户确认邮件；内部通知默认收件人改为 `303vessel@303industries.cn`。本轮写入低风险后台配置并通过 dry-run 复核，脚本为 `scripts/backfill-b31-sales-contact.mjs`，执行后显示 `No B31 sales contact changes needed.`。验收记录：300 后台登录态已只读确认；`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；线上 `/`、`/products?lang=en`、`/contact?lang=en` 为 200 / `PRERENDER`，`/global` 为 200；Chrome 线上抽查确认 `/products?lang=en` 无 `应用场景 / 度假营地 / 酒店民宿 / 商业展示 / 远程部署 / 产品分类 / 默认配置` 等中文可见残留，普通页面浮动联系入口可见，`/global` 没有被注入新站浮动入口。`/global` 本轮零改动：地图、MapLibre、MapTiler、`/api/map`、Contact / Products 旧站例外均保持不变，继续由 04 专项负责。

## 多对话分工与协作边界

当前 vessel303 采用多对话分工推进。每个对话只处理自己的责任范围，避免并行改动互相覆盖。开始任何任务前，先确认自己属于哪条线，并查看 `git status`，不要触碰其他线未提交的改动。

当前分工：

- 00 项目总控：统一接收 Wynne 需求，拆任务，判断归属，调度 01 / 02 / 05 / 06 / 07，判断问题是否需要上报 Wynne；默认不直接开发、不直接验收、不写文档。
- 01 产品中心 / 产品 CMS：负责产品中心前台体验、产品列表、产品详情页、产品数据口径、产品 CMS 展示字段、价格展示策略和产品内容运营路径；不负责后台 2.0 通用框架、commit / push / 上线。
- 02 后台 2.0 / 运营后台开发：负责后台 2.0、运营后台产品化、300.cn 对照、后台代码开发、后台 API / CMS 读写链路和普通 bug 小修；不负责提交、push、上线，不改 `AGENTS.md`，除非 Wynne 明确授权。
- 03 项目案例 / 项目 CMS：项目数据、项目详情页模型、项目 ID 体系、`/cases` 数据接入。
- 04 Global 地图专项：`/global` 地图链路、MapTiler/MapLibre、点位数据接入风险控制。
- 05 验收 / 提交 / 推送 / 上线：统一验收、检查、真实场景测试、commit、push `main`、等待 Vercel READY、线上轻量检查；05 不主动改业务代码，除非 Wynne 明确授权或 00 明确交回小修。
- 06 文档整理 / Handoff 重写：负责 `CODEX.md`、V9 handoff、admin 2.0 plan、docx 等文档收口；repo-git 内默认只允许 `CODEX.md` 进入 Git；06 不提交、不 push、不上线，交 05 复验。
- 07 性能 / 图片 / 前台速度专项：负责全站响应速度、首页图片、产品列表打开速度、图片体积治理、缓存策略、前台性能基线、Lighthouse / Chrome Network / 线上轻量测速；发现后台 API 或 CMS 查询瓶颈时交 02，发现产品体验取舍时交 01。
- 08 可视化页面编辑器：`/admin/pages/visual`、页面模块可视化预览、受控字段编辑、模块高亮、点击定位、草稿预览 / 发布上线、发布前检查、差异摘要、快照恢复、模块内 item 管理、模块注册表 / 动态渲染基础、只读模块库、Home 结构草稿新增 / 排序 / 结构隐藏受控模块和运营使用规范口径收口；不负责普通后台 A/B 包、产品 / 项目 CMS、`/global` 地图、会员支付。

默认自动流转规则：

1. 00 拆任务并分派给对应线程。
2. 01 / 02 / 07 按职责规划或开发；重大产品设计先只读对照 300.cn，普通 bug / 文案 / lint / build / 小修不必每次看 300。
3. 开发线程完成后交 05 验收。
4. 05 验收通过后可以按授权 commit、push `main`、等待 Vercel READY，并做线上轻量检查。
5. 代码上线后交 06 做文档收口。
6. 06 完成后交 05 复验文档，只 stage 并提交授权的 repo 文件。
7. 05 文档复验、push、Vercel READY 和线上轻量检查通过后，由 00 只汇报最终结果。

必须打断 Wynne 的情况：

- 需求本身存在业务争议，需要 Wynne 判断产品方向。
- 需要改超出当前任务授权范围的文件。
- 需要删除文件或数据、执行数据库迁移、写生产业务数据。
- 涉及权限、认证、支付、订单、会员、代理商、生产敏感配置。
- 需要改 `/global`、MapLibre、MapTiler、`/api/map` 底层链路。
- 需要在 300.cn 执行真实保存、发布、删除、付款或上传。
- `lint`、`tsc`、`build`、浏览器验收、Vercel READY 或线上检查失败。
- git 工作区出现未知改动、未知文件、未知 commit 或无法解释的 diff。
- 发现可能造成线上事故的风险。

普通状态不要打断 Wynne：线程开始、规划完成、验收中、文档编写中、Vercel 部署中，均由 00 内部继续推进。

实际修改 `AGENTS.md` 或 `CODEX.md` 前，必须先给 Wynne 看草稿并获得授权；后续提交、推送按 05 默认验收/上线流程执行。

## Codex 文档维护规则

`AGENTS.md` 和 `CODEX.md` 是后续 Codex 接手项目的重要上下文，但它们本身也会随着项目升级而变化。

维护规则：

- `AGENTS.md` 只记录硬规则和入口指令，少改。
- `CODEX.md` 记录阶段性上下文、已完成模块、重大事故和后续路线，可以阶段性更新。
- 每完成大模块、改变架构、修改数据库关键 schema、修复线上事故，应该判断是否需要同步更新 `CODEX.md`。
- 以后如果 Codex 判断需要修改 `AGENTS.md` 或 `CODEX.md`，必须先通知 Wynne：说明为什么要改、改哪些内容。
- 获得 Wynne 授权修改后，再交 05 按默认验收/上线流程决定是否提交并推送这两个文档。
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

- 联系、留资、采购咨询入口：前台 CTA 默认指向新站 `/contact`；`/contact` 是自有联系页，表单写入 `leads`，不再默认跳 `https://en.303vessel.cn/contact.html`。
- `site_settings.contactUrl` 仅作为后台配置的备用旧站联系入口；如运营明确发布该备用入口，前台可以按后台配置显示，但不能替代主联系闭环。
- 查看产品入口：前台统一指向 `/products`；旧 `https://en.303vessel.cn/products_list.html` 仅作为后台设置和兼容口径保留，不再作为新前台 CTA 默认值。
- `normalizeSiteHref` 会把旧 300 产品 / 联系 URL 归一到新站 `/products` 或 `/contact`；后台质检应把旧站 URL 标记为风险旧链。
- `/global` 是明确例外：在新站正式接管 Global 生产链路前，Global 的联系方式 / 联系我们 / 查看产品 / Contact / Products 入口必须继续连接老 303 站，联系为 `https://en.303vessel.cn/contact.html`，产品为 `https://en.303vessel.cn/products_list.html`。不要把 Global 入口套用 `normalizeSiteHref` 或通用新站 CTA 规则。

## 当前应用状态

官网前台：

- 首页、产品列表、V9 Gen6 详情、About、FAQ、`/cases` 列表、`/cases/[id]` 项目案例详情、News、Contact、`/global`、Display 等页面已存在。
- `/contact` 已切换为新站自有联系页，读取 `page_modules:contact` 渲染 hero、联系渠道、表单文案和备用入口；表单复用 `/api/contact` 写入 `leads`，不再默认 redirect 到 300 旧联系页。
- `/global` 使用 MapLibre/MapTiler，是高风险稳定模块；当前 CMS 接管同 ID static 点位的样板项目为 `astrobase-mamison`、`japan-space-vessel`、`guangdong-foshan`。

账号中心：

- `/account` 页面已接入。
- 已有账号资料表单、密码设置/修改、资料 API、密码 API。
- `users` 表已有 company、country、phone、whatsapp、preferred_language 等资料字段。
- 临时 operator 账号先保留；后续如不再使用，优先禁用，不建议直接删除。

管理后台：

- `/admin/login`：管理员登录页。
- `/admin`：后台运营工作台已上线，按 `admin` / `operator` 分层显示运营卡片和管理入口。
- `/admin/customers/leads`：线索管理 2.0 正式入口，承载线索列表、筛选、详情、状态更新、跟进备注、负责人分配、CSV 导出。
- `/admin/leads`：旧兼容入口，带 query 跳转到 `/admin/customers/leads`，不再展示旧后台侧栏。
- `/admin/users`：总管理专用。用户列表、角色/身份/禁用管理、CSV 导出、服务端自我保护。
- `/admin/media`：基于 Vercel Blob 的图片库，使用 client upload；已补充上传限制提示、引用统计文案、新闻正文引用删除保护。
- `/admin/content/news`：新闻后台 2.0 主路径，包含新闻概览、列表、新建、编辑、预览、发布前检查、发布 / 取消发布和删除入口。
- `/admin/news`：旧新闻管理维护备用路径，仍能新建、编辑、发布、取消发布，并在前台展示。
- `/admin/settings`：总管理专用。设置页已上线，`site_settings` 已初始化；保存设置会写数据库并产生后台审计日志。
- `/admin/products`：产品 CMS 已接入产品列表和通用详情页，支持新建、编辑、复制为草稿、发布/下架、删除、筛选、图片选择/上传、前台预览、详情介绍、详情图库选择器、图库排序、规格参数，以及通用详情页模块（亮点、场景、FAQ、图文内容、定制范围）；固定精细详情页如 `e7`、`v9-gen6` 仍保留原页面。
- `/admin/projects`：项目 / 案例 CMS 已接入，支持新建、编辑、发布/下架、删除、筛选、封面图、图库排序、中英文案例内容、地图发布校验、地图状态筛选，以及 `/global` 详情里的统计数据、预订链接、设施亮点、交通指引和周边景点；前台 `/cases` 列表和 `/cases/[id]` 详情已优先读取数据库并保留静态兜底；带经纬度的已发布项目会进入 `/global` 地图点位和详情面板；产品/项目表单图片控件误触发和窄列布局已修复。
- `/admin/pages`：页面模块 CMS 已上线，首页首屏/数据区、关于我们首屏、数据条、品牌故事、智造实力、品牌历程、三大技术、认证荣誉、合作伙伴、创始人、服务体系已接入前台；后台支持模块显示/隐藏、文字图片编辑、列表项新增/删除/排序、图片选择/上传、未保存防误操作。
- `/admin/pages/visual`：08 C4-2e 已上线，Home 安全插入区内 C4-2c 新增模板模块支持排序和结构隐藏；当前只支持 `simple-text` / `cta-section`，操作包括上移、下移、结构层隐藏、恢复显示；结构隐藏使用 `page_structure_drafts.modules` 的结构层 `isVisible` / `status`，不是内容 item 的 `is_visible`；operator 可排序、隐藏、恢复显示、预览、丢弃但不能发布结构草稿，admin 才能发布；发布后普通前台 `/` 按目标顺序和隐藏状态展示，并可通过页面级快照恢复原结构。C4-2e 已将顶部说明和页面结构边界从旧 C4-1/C4-2b 口径对齐到当前 Home 安全插入区能力；核心模块、About 结构、自由样式 / 自由布局仍锁定。

## 当前阶段工作重点

- 01 产品中心：V9 CMS 详情页第一版模板优化已完成并上线；后续再扩展字段、内容和批量数据。
- 02 后台运营 / 设置：后台运营体验 A 包 A1-A6 已完成并上线：`/admin` 工作台按 `admin` / `operator` 分层；高风险操作统一确认弹窗；产品 / 项目 / 新闻 / 设置长表单已有未保存提醒；线索 / 用户 / 媒体接入分页；媒体详情可显示具体引用来源并跳转编辑；生产环境已关闭“新建测试线索”入口，API 也拒绝 `admin_test` 测试线索创建。A 包不涉及数据库结构变更，不涉及 Resend / Vercel 配置；媒体真实上传 / 删除端到端测试仍需单独授权。
- 后台 B 包内容运营效率升级已完成：新闻 / 产品 / 项目列表筛选状态写入 URL，前台预览入口统一，内容完整度提示和产品 / 项目 / 新闻发布前检查已上线，设置页最近操作可读化，设置项接管计划已作为只读说明展示。B 包不涉及数据库结构变更、API / 权限改造或 `/global` 地图底层；设置项接管计划不会写入新配置，也没有新增前台接管字段。
- 后台 2.0 阶段 A 已开始落地：`/admin` 已脱离旧 `AdminShell` 并重建为运营控制台，`/admin/legacy` 是 admin-only 旧后台维护入口；旧 `/admin/pages`、`/admin/users`、`/admin/settings` 保持 admin-only，`operator` 过渡期仍可访问 `/admin/products`、`/admin/projects`、`/admin/news`、`/admin/media`，旧内容路由暂不迁移。A3 已上线 `/admin/site`，`/admin` 的网站管理入口已指向 `/admin/site`，`/admin/pages/visual` 是编辑网站主入口，`/admin/media` 是图片管理入口，`/global` 只是查看入口；`operator` 可进 `/admin/site` 但不显示维护中心、表单模式、设置、账号和 Legacy，`admin` 可见维护中心和 admin-only 入口。A4 已上线 `/admin/content`，聚合产品 / 项目 / 新闻状态、草稿、近 30 天新增、快捷发布、待补内容和运营流程。A5 已上线 `/admin/customers` 客户与线索新版入口页，B11 已把线索真实工作区收口到 `/admin/customers/leads`，`/admin/leads` 只做兼容跳转；`/admin` / `/admin/site` / `/admin/content` 的“客户与会员”入口已指向客户与线索域，聚合线索状态、近 7/30 天新增、待处理事项和进入线索 2.0 的运营动作；`operator` 只看线索运营内容，`admin` 可见会员管理规划和管理设置。A5/B11 不改数据库、leads API、会员等级 / 价格 / 订单 / 支付或 `/global`；300.cn 实机对照已通过，学习其客户 / 线索状态与待办优先的运营心智；`/global` warning 仍归 04。
- 后台 2.0 A6 已上线：新增统一顶部运营导航 `AdminTopNav`，并接入 `/admin`、`/admin/site`、`/admin/content`、`/admin/customers`、`/admin/status`；新增 `/admin/status` 数据与状态入口页，聚合网站、内容、线索、媒体、配置和风险提醒，只读展示状态。`operator` 不显示管理设置或敏感配置详情，`admin` 只看到“已配置 / 需处理”等状态；本轮不改数据库、旧业务页、复杂数据分析 API、GA / Search Console、支付 / 订单 / 会员价 / 代理商或 `/global`。300.cn 对照通过，学习其稳定顶部导航和状态 / 待办优先心智。
- 后台 2.0 A7-1 已上线：新增 `AdminSectionShell` 二级业务域布局组件，并在 `/admin/content` 试点顶部导航 + 左侧功能树 + 右侧工作区；左侧包含内容概览、待补内容、草稿内容、发布前检查、产品管理、项目案例、新闻资讯和规划中项。组件只做展示 / 跳转，不处理业务数据，不写库，不做保存 / 发布 / 删除；本轮未改 `/admin/site`、`/admin/customers`、`/admin/status`、旧内容业务页、API、数据库或 `/global`，后续扩展见 A7-2 至 A7-4。
- 后台 2.0 A7-2 已上线：`/admin/site` 已接入 `AdminSectionShell`，升级为顶部导航 + 左侧网站管理功能树 + 右侧工作区；左侧包含网站概览、编辑网站、页面草稿、网站待办、图片素材、查看主站、Global 查看、规划中项，以及 admin-only 高级维护。`operator` 不显示高级维护、表单模式、站点设置、维护入口；本轮未改 `/admin/content`、`/admin/customers`、`/admin/status`、旧后台业务页、API、数据库或 `/global`。
- 后台 2.0 A7-3 已上线：`/admin/customers` 已接入 `AdminSectionShell`，升级为顶部导航 + 左侧客户与线索功能树 + 右侧工作区；左侧包含客户概览、新线索、全部线索、跟进中、已报价、已成交、已关闭、待处理和规划中项。B11 后，左侧线索入口进入 `/admin/customers/leads`，旧 `/admin/leads` 只做兼容跳转。`operator` 不显示会员管理、后台账号、站点设置、Legacy / 维护入口；本轮未改 `/admin/content`、`/admin/site`、`/admin/status`、API、数据库或 `/global`。
- 后台 2.0 A7-4 已上线：`/admin/status` 已接入 `AdminSectionShell`，升级为顶部导航 + 左侧数据与状态功能树 + 右侧工作区；左侧包含状态概览、风险提醒、网站 / 内容 / 线索 / 媒体 / 项目地图字段、admin-only 配置状态和规划中项。`operator` 不显示系统状态 / 配置状态 / 管理设置 / 后台账号 / Legacy / 维护入口，`admin` 只看到“已配置 / 需处理”等状态；本轮未改 `/admin/content`、`/admin/site`、`/admin/customers`、旧后台业务页、API、数据库或 `/global`。
- 后台 2.0 A7-5 已上线：二级布局整体回归和细节统一完成，只做 UI / 交互小修不新增功能；`/admin/content` 删除重复发布按钮并收口为“管理入口”，`/admin/customers` 动作区改为线索状态入口，`/admin/site` admin-only 区块统一为“管理设置”并去除旧目录等过渡文案。A7-1 至 A7-5 已让四个二级业务域完成 `AdminSectionShell` 接入和细节统一；本轮未改 `/admin/status`、共享组件、API、数据库、旧后台业务页或 `/global`。
- 后台 2.0 B1 已上线：新增 `/admin/content/products` 产品运营入口页和 `/admin/content/products/list` 新版产品列表页；产品入口聚合总览、状态、待补、常用动作和流程，新列表支持全部 / 已发布 / 草稿 / 待补、搜索、系列 / 类型筛选、完整度提示、预览和编辑入口。旧 `/admin/products`、`/admin/products/new`、旧编辑页继续作为维护 / 实际编辑路径；本轮只读 `product_catalog`，未改数据库、API、`ProductForm`、`ProductListClient`、保存 / 发布 / 下架 / 删除 / 上传逻辑、价格 / 支付 / 订单或 `/global`。当前无明确 SEO 字段，因此不做缺 SEO 统计。
- 后台 2.0 B1-3-1 已上线：新增 `/admin/content/products/[id]/edit` 新版产品编辑入口壳，列表编辑入口已进入新版路径；页面使用 `AdminSectionShell`，包含产品状态头、编辑分区入口、保存影响提示，并复用现有 `ProductForm`。`ProductForm` 仅做低风险适配：自定义返回链接 / 标题、分区锚点、草稿产品隐藏前台预览入口；未改数据库、API、保存 / 发布 / 下架 / 删除 / 上传逻辑、`ProductListClient` 或旧 `/admin/products`。
- 后台 2.0 B1-3-2 已上线：`62c974d feat(admin): organize product form sections`，full SHA `62c974dcc5f2cecb48438bf27215447d2f2b765c`；`ProductForm` 已按 `basic` / `media` / `content` / `details` / `specs` / `publish-check` 六个分区整理，新版 `/admin/content/products/[id]/edit` 左侧锚点已同步并可跳转，已发布产品预览和保存影响提示正常；旧 `/admin/products`、`/admin/products/new`、旧编辑路径仍可用。此轮未改数据库、API、保存 / 发布 / 下架 / 删除 / 上传、媒体库选择、详情模块业务逻辑、字段含义或 `/global`，`/global edge runtime warning` 仍归 04。本轮使用测试 admin 登录验收，可能更新测试账号 `last_login_at`，未改业务内容。
- 后台 2.0 B1-3-3-1 已上线：`e9773d9 feat(admin): refine product detail module editing`，full SHA `e9773d939ad9e2999c0cbda1ae44b03b0c960ba9`；`ProductForm` 的 `detail_modules` 详情内容区已优化为内容块卡片，支持展开 / 收起，模块头部显示类型、标题摘要、显示状态和完整度提示，字段分区为标题与正文、列表项、图片素材、高级设置，`id` / `type` / `sort_order` 降级到高级设置，删除模块有二次确认，空状态有运营化添加入口。未改保存 / 发布 / 下架 / 删除 / 上传、媒体库选择、数据库、API 或 `detail_modules` 数据结构；旧 `/admin/products/new`、旧 `/admin/products/[id]/edit` 仍保留可用；本地测试 admin 登录验收可能更新 `last_login_at`，未改业务内容，`/global edge runtime warning` 仍归 04。
- 后台 2.0 B1-3-4-1 已上线：`7d4273b feat(admin): clarify product publish checks`，full SHA `7d4273bebe6014ec848cea207f0c6655644051c5`，Vercel deployment `dpl_3ZecgZP4W1RYZC5Mr64ZFdMfqB5v`；产品编辑页发布前检查和预览入口已统一，`保存草稿` 改为 `保存当前内容`，`保存并发布` 增加二次确认，草稿 / 新建产品不显示误导性前台预览，已发布产品明确提示保存会影响前台并保留预览入口，发布检查区说明只提醒不阻止保存或发布，旧 `/admin/products/[id]/edit` 已同步 `published-only` 预览策略。未改数据库、API、保存 / 发布 / 下架 / 删除 / 上传或权限逻辑；验收只打开确认弹窗并取消，未改产品内容，`/global edge runtime warning` 仍归 04。
- 后台 2.0 B1-3-6 已上线：B1-3-6-1 `e446361 feat(admin): add product create console`，Vercel deployment `dpl_8oPWtjVWkdnm2exnKy5G6GKW8pXY`，新增 `/admin/content/products/new`，复用 `ProductForm mode="create"`，保存成功后跳新版编辑页 `/admin/content/products/{id}/edit`；B1-3-6-2 `2c90cc3 fix(admin): route product creation to 2 console`，Vercel deployment `dpl_5xhrKGF7ma1XWGiFhGssRN9dAjke`，已将新版后台“新增产品 / 发布产品”入口统一到 `/admin/content/products/new`。旧 `/admin/products`、旧 `/admin/products/new`、旧 `/admin/products/{id}/edit` 仍保留为维护备用入口；本轮未改数据库、API、保存 / 发布 / 下架 / 删除 / 上传或权限逻辑，未保存、未发布、未下架、未删除、未上传、未改产品内容，`/global edge runtime warning` 仍归 04。
- 后台 2.0 B1-4-1 已上线：`546ff8a fix(admin): route product status to 2 console`，full SHA `546ff8ad37e0064ad2fa4bac4e1a4905362084b1`，Vercel deployment `dpl_Dq5ovaGyzdi6DRRi2dGd5E1h5uUg`，Vercel 状态 READY；`/admin/status` 的产品状态卡入口已从 `/admin/products` 改为 `/admin/content/products`，项目案例仍指向 `/admin/projects`，新闻仍指向 `/admin/news`，旧 `/admin/products` 仍可作为维护入口直接访问。未改 API、数据库、权限、保存 / 发布 / 上传逻辑、业务页或 `/global`，`/global edge runtime warning` 仍归 04；产品 2.0 主路径已完成旧入口漏口修正。
- 后台 2.0 B2-1 已上线：`e2e41eb feat(admin): add project operations console`，full SHA `e2e41eb5c8d503079b6c52acf41ec4bba39aaadc`，Vercel deployment `dpl_2eBd6QVvscWu6mgYrj2xd4oeFJ72`，Vercel 状态 READY；新增 `/admin/content/projects` 项目案例运营入口页，`/admin/content` 的项目案例入口已指向新版入口，页面提供项目总览、草稿 / 已发布、近 30 天新增、待补内容、Global 入图状态提示、常用入口和项目运营流程。项目案例是正式内容体系；Global 是独立地图可视化展示渠道，不是项目案例详情页。未改 `/global`、MapLibre、MapTiler、`/api/map`、HQ、点位渲染逻辑、`/cases`、数据库、API、权限、保存 / 发布 / 上传 / 删除逻辑；旧 `/admin/projects`、`/admin/projects/new`、旧编辑页仍保留为维护入口，`/global edge runtime warning` 仍归 04。
- 后台 2.0 B2-2 已上线：`c126dcd feat(admin): add project list console`，full SHA `c126dcd07964f6630f9d916a40ef4efe6b7c767e`，Vercel deployment `dpl_987kC7WkLzGQLMpXfYpudxhLE31n`，Vercel 状态 READY；新增 `/admin/content/projects/list` 新版项目案例列表页，`/admin/content/projects` 的项目列表、草稿、已发布、缺坐标入口已收口到新版列表。新版列表支持项目总览、状态筛选、搜索、完整度提示、Global 入图状态和编辑入口；编辑入口已在 B2-3-3 后收口到新版编辑页。旧 `/admin/projects`、`/admin/projects/new`、旧编辑页仍保留为维护入口；项目案例是正式内容体系，Global 是独立地图可视化展示渠道，不是项目案例详情页。未改 `/global`、MapLibre、MapTiler、`/api/map`、HQ、点位渲染逻辑、`/cases`、数据库、API、权限、保存 / 发布 / 上传 / 删除逻辑；`/global edge runtime warning` 仍归 04。本地 Neon `EACCES` 属本机网络限制，线上未登录路由检查通过。
- 后台 2.0 B2-3-1 已上线：`03b536e feat(admin): add project edit console shell`，full SHA `03b536e8ebe1a1cc720b7d1b932cb678ad83bee4`，Vercel deployment `dpl_ECoXT9p6LqYS5iEhHyZfUKMsbK29`，Vercel 状态 READY；新增 `/admin/content/projects/{id}/edit` 新版项目案例编辑壳，验收项目 id `astrobase-mamison`，使用 `AdminSectionShell` 并复用 `ProjectForm mode="edit"`。顶部包含返回新版项目列表、`/cases` 入口、Global 入图状态提示，文案明确项目案例是正式内容体系，Global 只是地图展示渠道；坐标和 Global 字段只影响地图入图状态，不等于正式案例详情页。`/admin/content/projects/list` 编辑入口已在 B2-3-3 后收口到新版编辑页；旧 `/admin/projects`、`/admin/projects/new`、旧编辑页仍可用。未改 `ProjectForm`、旧项目页、API、数据库、上传、发布、权限、`/global` 或 `/cases`，`/global edge runtime warning` 仍归 04。
- 后台 2.0 B2-3-2-1 已上线：`cc450137 feat(admin): organize project form sections`，full SHA `cc450137af87edadb5d7dba32c61785207f0c86d`，Vercel deployment `dpl_F1wPHbNPvxUZ2pLmVdocVwhCEkLD`，Vercel 状态 READY，验收项目 id `astrobase-mamison`；`ProjectForm` 已分成 `basic` / `media` / `content` / `params` / `global` / `publish-check` 六个真实 section，新版项目编辑页左侧锚点已跳到真实 section。`id` / `sort_order` 已降级到维护字段区，封面图和图库集中到图片素材区，`country` / `latitude` / `longitude` / `global_*` 已集中到 Global 入图信息区；Global 文案明确只是地图展示渠道，不是项目案例详情页。旧 `/admin/projects`、`/admin/projects/new`、旧编辑页仍可打开，`/admin/content/projects/list`、`/cases`、`/global` 未受影响。未改 API、数据库、权限、保存 / 发布 / 上传 / 删除逻辑，未保存、未发布、未下架、未删除、未上传、未改项目内容；`/global edge runtime warning` 仍归 04。B2-3-3 项目编辑入口收口已上线，B2-3-4-1 新版项目案例新建页已上线；B2-3-4-2 新增入口收口已上线；B2-4-1 项目案例 2.0 主路径漏口小修已上线；后续建议 B2-5-0 前台 `/cases` 列表和详情页规划，或先做 B2 后台项目案例链路整体回归盘点，尚未开始开发。
- 后台 2.0 B2-3-3 已上线：`d95ff3e fix(admin): route project edits to 2 console`，full SHA `d95ff3ec7f27cfc51233b4a12a73dfd7ea3ff4e8`，Vercel deployment `dpl_7M7LcgqQ4WKck4prKJmEDwy5e4fn`，Vercel 状态 READY，验收项目 id `astrobase-mamison`；`/admin/content/projects/list` 的“编辑”入口已指向 `/admin/content/projects/{id}/edit`，项目案例主路径已收口为 `/admin/content/projects -> /admin/content/projects/list -> /admin/content/projects/{id}/edit`。线上登录态补验已通过：从新版项目列表点击编辑进入新版项目编辑页。旧 `/admin/projects/{id}/edit` 仍可直接打开，作为维护备用入口；旧 `/admin/projects`、`/admin/projects/new` 仍保留。未改 `ProjectForm`、API、数据库、保存 / 发布 / 上传 / 删除、权限、`/global` 或 `/cases`，`/global edge runtime warning` 仍归 04；B2-3-4-1 新版项目案例新建页已上线，B2-3-4-2 新增入口收口已上线；B2-4-1 项目案例 2.0 主路径漏口小修已上线；后续建议 B2-5-0 前台 `/cases` 列表和详情页规划，或先做 B2 后台项目案例链路整体回归盘点，尚未开始开发。
- 后台 2.0 B2-3-4-1 已上线：`e469477 feat(admin): add project create console`，full SHA `e4694778fddff402f5f8bec30b3b4d67b39c5d07`，Vercel deployment `dpl_ByNn885nn8JA9YNVELLaq1cjMHsm`，Vercel 状态 READY；新增 `/admin/content/projects/new` 新版项目案例新建页，使用 `AdminSectionShell` 并复用 `ProjectForm mode="create"`，返回 `/admin/content/projects/list`，不显示误导性的前台案例详情预览入口。`ProjectForm` 新增带默认值的可选参数 `backHref` / `backLabel` / `title` / `createRedirectBase` / `showPreviewLink`；旧 `/admin/projects/new` 不传参数时创建成功仍跳 `/admin/projects/{id}/edit`，新版传 `createRedirectBase="/admin/content/projects"` 后代码路径跳 `/admin/content/projects/{id}/edit`。项目案例是正式内容体系，Global 是地图可视化展示渠道，坐标 / Global 字段只影响地图入图；未改 API、数据库、权限、保存 / 发布 / 下架 / 删除 / 上传逻辑、`/global`、MapLibre、MapTiler、`/api/map`、`/cases` 或项目内容，旧项目后台路径仍保留为维护备用入口；本地 Chrome 对 `localhost` 的 `ERR_BLOCKED_BY_CLIENT` 已记录为客户端 / 扩展拦截问题，05 没有继续把本地 Chrome 拦截当作代码失败，而是采用本地 HTTP route 检查 + 线上 Chrome 登录态只读补验；`/global edge runtime warning` 仍归 04。B2-3-4-2 新增入口收口已上线，B2-4-1 项目案例 2.0 主路径漏口小修已上线；后续建议 B2-5-0 前台 `/cases` 列表和详情页规划，或先做 B2 后台项目案例链路整体回归盘点，尚未开始开发。
- 后台 2.0 B2-3-4-2 已上线：`31b626c fix(admin): route project creation to 2 console`，full SHA `31b626cc0ee9e9bd1f72d0d2ca4c08d8ce277c2d`，Vercel deployment `dpl_7kbttuJTxFXr4U8KD7qrWuJ9J7eA`，Vercel 状态 READY；新版后台“发布项目 / 新增项目”入口已统一收口到 `/admin/content/projects/new`，覆盖 `/admin`、`/admin/content`、`/admin/content/projects`、`/admin/content/projects/list` 新增项目和空状态入口、`/admin/content/projects/{id}/edit` 左侧新增项目入口。项目案例后台 2.0 主路径已基本闭合为 `/admin/content/projects -> /admin/content/projects/list -> /admin/content/projects/new 或 /admin/content/projects/{id}/edit`；旧 `/admin/projects`、旧 `/admin/projects/new`、旧 `/admin/projects/{id}/edit` 仍保留为维护备用入口。项目案例是正式内容体系，Global 仍是独立地图可视化展示渠道，不是项目案例详情页；未改 `ProjectForm`、API、数据库、权限、保存 / 发布 / 下架 / 删除 / 上传逻辑、`/global`、MapLibre、MapTiler、`/api/map`、`/cases` 或业务数据，`/global edge runtime warning` 仍归 04。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，后台未登录路径 302 到登录页，`/`、`/about`、`/cases`、`/global` 均 200 且无 `__next_error__`；未保存、未发布、未上传、未删除、未改业务数据。B2-4-1 项目案例 2.0 主路径漏口小修已上线；后续建议 B2-5-0 前台 `/cases` 列表和详情页规划，或先做 B2 后台项目案例链路整体回归盘点，尚未开始开发。
- 后台 2.0 B2-4-1 已上线：`629f516 fix(admin): close project console path gaps`，full SHA `629f516b4fa03b6ea107163df870f2cadc9ace92`，Vercel deployment `dpl_JAvUyqsDG8cBnP7Hhpoj8xQvRSLY`，Vercel 状态 READY；项目案例 2.0 主路径漏口小修完成。`/admin/status` 的“项目地图信息”和“项目地图字段”入口已从旧 `/admin/projects?mapStatus=missing-coordinates` 改到 `/admin/content/projects/list?view=missing-coordinates`，“内容变化 / 项目案例”入口已从旧 `/admin/projects` 改到 `/admin/content/projects`；`/admin/content/projects` 过期文案已修正为新建和编辑已进入新版链路，发布、下架、删除等高风险操作仍在维护入口处理。项目案例后台 2.0 主路径保持 `/admin/content/projects -> /admin/content/projects/list -> /admin/content/projects/new 或 /admin/content/projects/{id}/edit`，旧项目后台路径仍保留为维护备用入口；项目案例是正式内容体系，Global 是独立地图可视化展示渠道，不是项目案例详情页。未改 `ProjectForm`、API、数据库、权限、保存 / 发布 / 下架 / 删除 / 上传逻辑、`/global`、MapLibre、MapTiler、`/api/map`、`/cases` 或业务数据，`/global edge runtime warning` 仍归 04；验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，后台未登录路径 302 到 `/admin/login`，`/`、`/about`、`/cases`、`/global` 均 200 且无 `__next_error__`，未保存、未发布、未上传、未删除、未改业务数据。B2-5-1 和 B2-5-2 已随后完成前台 `/cases` 列表与详情页收口。
- 前台项目案例 B2-5-1 已上线：`cc2419d feat(cases): add project detail pages`，full SHA `cc2419d15d0f8deefe80e9eb22b32118a1977aa8`，Vercel deployment `dpl_8WC3C5HV6CG4CH6Mvm6bEkeu8mF8`，Vercel 状态 READY；新增 `/cases/[id]` 项目案例详情页，`/cases` 列表卡片已从 `/global?camp=...` 改为进入正式案例详情。详情页只展示 published 且未删除项目，数据库异常时才回退同 ID 的静态 published 样板；缺失字段隐藏，询盘入口继续走 `https://en.303vessel.cn/contact.html`。本轮只读对照 300.cn 后台“项目案例 / 案例展示 / 项目案例”列表和已发布案例，不复刻 300 的隐藏、删除、撤销发布、翻译、营销页等后台操作；未改数据库、API、后台保存 / 发布 / 删除 / 上传、权限、`/global`、MapLibre、MapTiler 或 `/api/map`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/cases`、`/cases/xunliao-bay-holiday-planet`、`/about`、`/global` 均 200 且无 `__next_error__`；线上 `/cases`、`/cases/xunliao-bay-holiday-planet`、`/global` 均 200 且无 `__next_error__`。
- 前台项目案例 B2-5-2 已上线：`20ab9e3 feat(cases): complete project case frontend`，full SHA `20ab9e3feb02b8e1e140e05cc7efbafb6d9a286c`，Vercel deployment `dpl_Prib2ELhvMTpnDa8yzpFyWgyzPci`，Vercel 状态 READY；`/cases` 筛选按钮已从静态视觉标签改为真实筛选，`/cases/[id]` 详情页已按 300.cn 项目案例字段补齐内容分类、发布状态、内容时间、项目名称、项目类型、项目地点、占地面积、投资规模、采购数量、采购产品和相关案例入口。静态兜底已改为只展示 published 项目，旧 `foshan-shishan-cultural-camp` 保持 draft，空字段继续隐藏；询盘入口继续走现有 leads / 联系外链，不做复杂预订系统。300.cn 对照只读核对列表、编辑字段、设置 / SEO / 标签 / 相关页签和发布 / 隐藏 / 删除 / 翻译等后台操作；本轮不复刻 300 的高风险后台动作，不改数据库结构、API、后台保存 / 发布 / 删除 / 上传、权限、`/global`、MapLibre、MapTiler 或 `/api/map`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/cases`、`/cases/xunliao-bay-holiday-planet`、`/global` 均 200 且无 `__next_error__`，Chrome 只读验收确认筛选和详情字段可用；线上 `/cases`、`/cases/xunliao-bay-holiday-planet`、`/global` 均 200，页面 `data-dpl-id` 为 `dpl_Prib2ELhvMTpnDa8yzpFyWgyzPci`。
- 项目案例 B2-6 全链路回归已上线：`d32b777 fix(admin): close project case regression gaps`，full SHA `d32b777bb82324cdaa6fc4d83511519a699304e9`，Vercel deployment `dpl_AHEiyGkfbrimJK5DYYvZ8zTfTqxY`，Vercel 状态 READY；本轮先只读对照 300.cn 后台“网站管理 > 数字门户全球营销版 > 项目案例 > 案例展示 > 项目案例”，确认 300 侧列表字段、编辑字段、设置 / SEO / 标签 / 相关页签和发布 / 隐藏 / 删除 / 翻译等操作心智；随后仅做 B2-6-1 小修：前台主导航 Cases 从 `/global` 回到正式 `/cases`，后台项目 2.0 文案改为 `/cases/[id]` 已承接正式详情页，项目引用入口从旧 `/admin/projects/{id}/edit` 收口到 `/admin/content/projects/{id}/edit`。未改数据库、API、权限、保存 / 发布 / 删除 / 上传、`/global`、MapLibre、MapTiler 或 `/api/map`；300 后台只读，未保存、未发布、未上传、未删除。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/cases`、`/cases/xunliao-bay-holiday-planet`、`/global` 均 200，后台新旧项目入口未登录均跳 `/admin/login` 且跟随后无 `__next_error__`；线上 `/cases`、`/cases/xunliao-bay-holiday-planet`、`/global` 均 200 且页面 `data-dpl-id` 为 `dpl_AHEiyGkfbrimJK5DYYvZ8zTfTqxY`，线上 `/admin/content/projects` 与旧 `/admin/projects` 均受登录保护跳转。
- 项目案例 B2-7 案例详情 CTA / 询盘入口接线索已上线：`5057a61 feat(cases): connect case inquiries to leads`，full SHA `5057a610fd769ee6d04b707073129c18cab1d752`，Vercel deployment `dpl_72L769PEKZtgeSZyGKyA9piPRCkn`，Vercel 状态 READY；`/cases/[id]` 主 CTA 已锚到页面内 `#case-inquiry`，新增案例询盘表单，提交走 `/api/contact` 并写入现有 `leads`，`source` 为 `case_detail:{projectId}`；邮件通知保留为辅助通道，线索写入成功时邮件失败不阻塞前台提交。300.cn 只读对照确认 300 详情页主要走联系 / 预约入口，本轮没有保存、发布、上传或删除 300 内容；未改数据库结构、权限、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`，未在线上提交表单或写生产业务数据。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/cases`、`/cases/xunliao-bay-holiday-planet`、`/global` 均 200，后台项目入口未登录跳 `/admin/login`；线上 `/cases`、`/cases/xunliao-bay-holiday-planet`、`/global` 均 200，详情页含 `#case-inquiry` 与 `Send Case Inquiry`，页面 `data-dpl-id` 为 `dpl_72L769PEKZtgeSZyGKyA9piPRCkn`。
- 后台 2.0 B3-0/1/2 新闻后台 2.0 已上线：`4172843 feat(admin): add news content console`，full SHA `4172843814f8c863178c92eb92dc78d515883cc1`，Vercel deployment `dpl_A61RLh9J86LJjLDN3gfmVh5SJ7Kb`，Vercel 状态 READY；新增 `/admin/content/news` 新闻运营入口、`/admin/content/news/list` 新版新闻列表、`/admin/content/news/new` 新版新建页、`/admin/content/news/{id}/edit` 新版编辑页，并将 `/admin`、`/admin/content`、`/admin/status`、产品 / 项目内容区和设置页的新闻入口收口到新版路径。`NewsForm` 和 `NewsListClient` 已支持新版 basePath，保留旧 `/admin/news`、旧 new / edit 路径作为维护备用。300.cn 只读对照确认新闻资讯模块的列表、添加、分类管理、回收站、排序、发布、定时任务、状态和删除操作心智；本轮只实现 B3-0/1/2 主路径，不做分类、回收站、批量操作、定时发布或权限分级。真实验收发布测试新闻 `vessel-news-console-2-test-20260525`，前台 `/news` 和详情页验证通过；Wynne 确认后已删除该测试新闻，后台刷新回到 1 条，前台列表不再展示，详情页返回 404。未改数据库结构、权限、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`；`/global edge runtime warning` 仍归 04。
- 后台 2.0 B3-3 新闻运营能力规划已上线：`b77fb32 feat(admin): add news operations planning`，full SHA `b77fb3257ebbd0676929ab6c8d9b9e6d12327af8`，Vercel deployment `dpl_2PpAsGMjAuUHBTsGd4WTtutC18qD`，Vercel 状态 READY；参照 300.cn 新闻资讯后台的分类管理、回收站、批量操作和定时任务心智，`/admin/content/news` 已新增 B3-3 运营能力规划面板，明确分类需要字段、回收站当前只统计软删除数量、批量操作先做预演、定时发布需要后续任务字段和执行器；`/admin/content/news/list` 已新增批量选择和禁用批量操作工具栏，显示已选数量但不执行真实批量发布、删除、状态、转移或翻译。未改数据库结构、API、保存 / 发布 / 删除逻辑、权限、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`；未写生产业务数据。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/news` 200 且页面 `data-dpl-id` 为 `dpl_2PpAsGMjAuUHBTsGd4WTtutC18qD`，未登录 `/admin/content/news` 302 到 `/admin/login`，已登录 Chrome 验收确认 `/admin/content/news` 显示 B3-3 规划面板、`/admin/content/news/list` 显示批量操作预演且浏览器 error 日志为空。`/global edge runtime warning` 仍归 04。
- 后台 2.0 B3-4 新闻分类字段方案已上线：`00b177e feat(admin): add news category planning`，full SHA `00b177e369a8a3021e9fb44cf0091497513fa954`，Vercel deployment `dpl_8uVqhyUnc32RofeTeDN9VngAYqKK`，Vercel 状态 READY；参照 300.cn 新闻资讯后台的 `所属分类` 列和 `分类管理` 入口，新增 `/admin/content/news/categories` 分类方案页，记录 300 对照、候选分类、字段方案和后续落地顺序；新闻概览、列表和左侧二级导航已加入分类方案入口；`NewsForm` 新增 `所属分类` 预留位，显示候选分类和禁用下拉，但不写入 `formBody`、POST/PATCH 或数据库。未改数据库结构、API、保存 / 发布 / 删除逻辑、权限、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`；未写生产业务数据。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/admin/content/news/categories` 和 `/admin/content/news` 未登录均 302 到 `/admin/login`，`/news` 200；线上 `/news` 200 且页面 `data-dpl-id` 为 `dpl_8uVqhyUnc32RofeTeDN9VngAYqKK`，未登录 `/admin/content/news/categories` 302 到 `/admin/login`，已登录 Chrome 验收确认分类方案页和新闻新建页分类预留位可见，浏览器 error 日志为空。`/global edge runtime warning` 仍归 04。
- 后台 2.0 B3-5 新闻分类真实建表与保存接入已上线：`42a56ca feat(admin): connect news categories`，full SHA `42a56cad0ac05030c245860cbff00bea5e0140c3`；小修 `8b86365 fix(admin): preload news categories`，full SHA `8b86365350c832d6af7433e490ace109b161c170`；最终 Vercel deployment `dpl_FbSZToCeRizkRuVkye6yA4uAhMdn`，Vercel 状态 READY，production URL `https://vessel303-3b0gdtv8v-vessel303.vercel.app`。本轮参照 300.cn 创新故事 / 新闻资讯后台的 `分类管理`、`发布状态`、`发布时间`、分类列和批量操作心智，新增非破坏式迁移脚本 `scripts/migrate-b3-5-news-categories.js`，创建 `news_categories` 表并给 `news` 增加 nullable `category_id`；种子分类为 `公司资讯`、`产品与展会`、`项目案例`、`行业观察`；新增 `/api/admin/news/categories` 只读分类 API，新闻 POST/PATCH 校验分类并保存，列表支持分类筛选，`NewsForm` 的 `所属分类` 已启用保存；`/admin/content/news/categories` 改为当前分类状态页。线上验收发现当前 Chrome 环境会对分类 API 触发 `ERR_BLOCKED_BY_CLIENT`，已补服务端预加载分类，保证 `/admin/content/news/new`、新版 edit 和旧维护 new / edit 下拉可用。未改权限、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`；未删除数据，未回填旧新闻分类，未开放分类新增 / 编辑 / 删除。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/news` 200，未登录 `/admin/content/news/categories` 302 到 `/admin/login`，未登录 `/api/admin/news/categories` 401；已登录 Chrome 验收确认分类页显示 4 个分类、新闻新建页分类下拉可用、新闻列表显示分类筛选和所属分类列，浏览器 error 日志为空。`/global edge runtime warning` 仍归 04。
- 后台 2.0 B3-6 新闻全链路只读回归已完成：未改代码、未写生产业务数据、未在 300.cn 保存 / 发布 / 上传 / 删除。300.cn 只读确认创新故事列表含 `发布状态`、`发布时间`、`创新故事分类`、`标题`，分类管理页含 `全部分类`、`添加分类`、`分类名称`、`状态`、`操作`、`多场景适用`、`四种交互方式`。线上 DB 只读确认 `news_categories` 有 4 个 visible 分类，新闻当前 published 1、draft 0、total 1，已发布样本为 `/news/2026`。线上 HTTP 检查：`/news` 200，未登录 `/admin/content/news` 302 到 `/admin/login`，未登录 `/api/admin/news/categories` 401。已登录 Chrome 验收确认 `/admin/content/news/categories`、`/admin/content/news/new`、`/admin/content/news/list`、旧 `/admin/news`、前台 `/news`、`/news/2026` 均可读，分类下拉、分类筛选和所属分类列正常，浏览器 error 日志为空。`/global` 未检查也未改动，edge runtime warning 仍归 04。
- 后台 2.0 B3-7 新闻分类新增 / 编辑 / 隐藏已上线：`5bbeeb3 feat(admin): manage news categories`，full SHA `5bbeeb318007bc09110b5c18f88e5827e1df9fdb`；测试定位修正 `0157060 test(admin): stabilize news category checks`，full SHA `0157060f6dc1d4cf661b49885fbb0dcf638c0c3f`；最终 Vercel deployment `dpl_8TSqi8caUNH9SZF27T1DyZKsuMjm`，Vercel 状态 READY。新增 `/api/admin/news/categories` POST 和 `/api/admin/news/categories/[id]` PATCH，`/admin/content/news/categories` 已支持新增分类、编辑 slug / 中英文名 / 描述 / 排序 / 状态、显示 / 隐藏分类；`NewsForm` 默认仍只加载 visible 分类，编辑旧新闻时兼容 hidden 分类。真实验收创建并编辑测试分类 `b3-7-qa-20260526`，最终保持 `hidden`，`industry-insights` 已恢复 `visible`；线上新建新闻下拉不显示 hidden 测试分类且显示 `行业观察`。未做分类删除、未回填旧新闻、未改权限、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/news` 200，未登录分类页 302 到 `/admin/login`，未登录分类 API 401，已登录 Chrome 验收分类页和新建页浏览器 error 日志为空。
- 后台 2.0 B3-8 新闻回收站恢复已上线：`8511317 feat(admin): restore deleted news drafts`，full SHA `85113173206f85c7b2e1ccc93176bec1f2166f1f`；小修 `267b872 fix(admin): keep news recycle actions focused`，full SHA `267b872b75775edcc82fbefc1488c5dfcdb4a13b`；最终 Vercel deployment `dpl_HmNvHxzEzGKfsXoErpSz3Bu79dvx`，Vercel 状态 READY。新增 `/admin/content/news/recycle` 和 `/api/admin/news/[id]/restore`，回收站只列出 `deleted_at IS NOT NULL` 的新闻，恢复统一变为 draft、清空 `published_at`、清空 `deleted_at`，不直接重新发布到前台；`/admin/content/news` 和 `/admin/content/news/list` 已接入回收站入口。真实验收使用旧测试新闻 `vessel-news-console-2-test-20260525`：线上回收站可见并可恢复，恢复后回收站为空，新闻列表草稿中可见该新闻，前台 `/news` 不展示，`/news/vessel-news-console-2-test-20260525` 返回 404。未做永久删除、批量恢复、权限分级、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/news` 200 且生产别名指向最新部署，未登录回收站 302 到登录，未登录恢复 API 401，已登录 Chrome 验收浏览器 error 日志为空。
- 后台 2.0 B3-9 新闻批量转分类已上线：`69f5609 feat(admin): batch move news categories`，full SHA `69f56094dec55955049e016756ff421f92a90c89`；Vercel deployment `dpl_Ce8Dgz1ci3WbHYjV6ThW97Z5DeGX`，Vercel 状态 READY。新增 `/api/admin/news/batch/category`，新闻列表批量工具栏已开放“目标分类 + 转移分类”，每次最多 100 条，API 只接受 visible 分类且只更新未删除新闻；发布、删除、定时任务、置顶、状态和翻译仍禁用。真实验收使用草稿测试新闻 `vessel-news-console-2-test-20260525`：已登录 Chrome 选择该新闻并批量转到 `项目案例` 分类，DB 只读确认 `category_slug = case-updates`、`status = draft`、`deleted_at = null`；前台 `/news` 不展示该新闻，详情页返回 404。未开放批量发布、批量删除、永久删除、权限分级、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/news` 200 且生产别名指向最新部署，未登录批量 API 401，已登录 Chrome 批量转分类浏览器 error 日志为空。
- 后台 2.0 B3-10 新闻定时发布第一阶段已上线：`1c20a68 feat(admin): schedule news drafts`，full SHA `1c20a688c005011f43026befd567c65ba7bc7393`；验收小修 `eee3437 fix(admin): simplify news scheduling input`，full SHA `eee34370571ce469bddc087d3f116e752aa5181b`；最终 Vercel deployment `dpl_31DC4YexuUWU2RFqT9e3cWSU3UPd`，Vercel 状态 READY。新增非破坏式迁移脚本 `scripts/migrate-b3-10-news-scheduling.js`，已执行并给 `news` 增加 nullable `scheduled_at` 与定时草稿索引；`/admin/content/news`、左侧新闻导航、`/admin/content/news/list?schedule=scheduled` 和 `NewsForm` 已接入单篇计划发布时间保存 / 清除。B3-10 不做自动执行器、失败重试、批量定时、批量发布 / 删除、权限分级、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`。真实验收使用草稿测试新闻 `vessel-news-console-2-test-20260525`：线上后台填写 `2026-06-30T09:30` 后保存草稿，定时列表可见并显示定时日期，DB 只读确认 `status = draft`、`scheduled_at = 2026-06-30 09:30:00`、`published_at = null`、`deleted_at = null`；前台 `/news` 不展示，详情页返回 404；随后线上后台清除定时并保存，定时列表为空，DB 确认 `scheduled_at = null`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/news` 200 且生产别名指向最新部署，未登录定时列表 302 到登录，已登录 Chrome 真实填写 / 清除浏览器 error 日志为空。
- 后台 2.0 B3-11 新闻 SEO 字段治理第一阶段已上线：`e3e740e feat(admin): manage news SEO fields`，full SHA `e3e740e50b431e90708ff3e6a91590fa8eacff69`；Vercel deployment `dpl_EB4G1DitZZb4TX4QVCnXX2af3sNz`，URL `https://vessel303-lcwhprf8l-vessel303.vercel.app`，Vercel 状态 READY。新增非破坏式迁移脚本 `scripts/migrate-b3-11-news-seo-fields.js`，已执行并给 `news` 增加 nullable `seo_title_zh`、`seo_title_en`、`seo_description_zh`、`seo_description_en`；`NewsForm` 已新增 SEO 字段分区，后台概览增加缺 SEO 统计和 SEO 规划入口，`/api/admin/news` 与 `/api/admin/news/[id]` 支持保存 SEO 字段，前台 `/news/[slug]` metadata 优先读取 SEO 标题 / 描述并保留标题 / 摘要兜底。B3-11 不做关键词、批量 SEO、SEO 自动生成、权限分级、认证、支付、订单、`/global`、MapLibre、MapTiler 或 `/api/map`。真实验收使用草稿测试新闻 `vessel-news-console-2-test-20260525`：线上后台填写 B3-11 测试 SEO 标题 / 描述并保存草稿，刷新后字段仍在；DB 只读确认 `status = draft`、4 个 SEO 字段已落库、`scheduled_at = null`、`published_at = null`、`deleted_at = null`；前台 `/news` 不展示该草稿，详情页返回 404。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/news` 200，未登录 `/admin/content/news` 302 到登录，已登录 Chrome 真实填写 / 保存浏览器 error 日志为空。
- 后台 2.0 B3-12 新闻生产全链路回归已完成：本轮未改代码、未迁移数据库、未改 `/global`。300.cn 后台保持登录，已只读确认内容管理、创新故事、SEO 优化、分类等入口正常；05 以运营人员角色在生产后台创建测试新闻 `b3-12-news-full-chain-qa-20260526`，完整填写封面、分类、中文 / 英文标题摘要正文、定时字段和 SEO 字段。验收覆盖：保存定时草稿后 DB 确认 `status = draft`、`scheduled_at = 2026-06-30 10:30:00`、封面和 SEO 字段已落库，前台 `/news` 不展示且详情页 404；发布后 DB 确认 `status = published`、`scheduled_at = null`、`published_at` 有值，前台 `/news` 展示，详情页 200，HTML 包含 B3-12 SEO title / description；取消发布后 DB 回到 draft，前台再次隐藏；批量转分类从 `公司资讯` 转到 `行业观察`，DB 确认 `category_slug = industry-insights`；软删除后进入回收站，恢复后回到 draft 且不发布；最终为避免活跃草稿残留，测试新闻再次 soft-deleted 留在回收站，未永久删除。额外检查：新版 `/admin/content/news`、分类页、已发布列表、旧 `/admin/news` 维护入口均可读且浏览器 error 日志为空；未登录 `/admin/content/news` 302 到登录，未登录 `/api/admin/news` 401；线上 `/news` 200 且不包含 B3-12 测试内容。结论：B3-0 到 B3-11 主链路闭合，未发现需要 02 修复的问题。
- 后台 2.0 B4-0 至 B4-6 产品管理核心能力已上线：`db3b81c feat(admin): expand product management workflow`，full SHA `db3b81cdbf81b3ef5a48ec0ad5a0fe425086a042`，Vercel deployment `dpl_DJiVBrHnCLeDC5ZgiaAkxjNim1zc`，Vercel 状态 READY，production URL `https://vessel303-iedbtn5cc-vessel303.vercel.app`。本轮先只读对照 300.cn 产品管理模块，确认其包含产品列表、分类管理、属性模板、标记管理、品牌管理、筛选管理和橱窗管理；vessel 本阶段只实现安全核心子集：新增 `product_categories` 表、`product_catalog.category_id` 和 nullable 产品 SEO 字段，默认分类为 `标准产品`、`定制产品`、`海外定制`；新增 `/admin/content/products/categories`、`/admin/content/products/recycle`、分类 API、产品恢复 API、低风险批量转分类 API；产品新建 / 编辑页可选择分类并保存 SEO 标题 / 描述，产品列表支持分类筛选和转移分类，前台 `/products/[slug]` metadata 优先读取 SEO 字段。未做属性模板、标签 / 标记、品牌、筛选、橱窗、价格、会员价、代理价、订单、支付、权限矩阵、永久删除、批量发布、批量删除、自动 SEO 或 `/global` 底层；未在 300.cn 执行保存 / 发布 / 删除 / 上传。验收记录：迁移脚本已在线上 Neon 执行成功，`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/products` 与 `/products/e7` 均 200，未登录分类 API 返回 401，未登录产品分类后台跳登录，已登录 Chrome 验收确认产品概览、分类管理、列表、新建页、回收站均可访问且分类 / SEO / 批量转分类 / 恢复入口可见。
- 后台 2.0 B4-7 产品生产全链路真实回归已完成：本轮未改代码、未迁移数据库、未改 `/global`。05 以运营人员角色在生产后台创建测试产品 `b47-product-full-chain-qa-20260526-0619`，完整填写分类、封面 / 图库、中文 / 英文内容、SEO 字段并验证草稿、发布、前台详情、前台列表、取消发布、软删除、回收站恢复和最终清理。发布后详情页 200 且 metadata 使用 B4-7 SEO 字段；草稿 / 恢复草稿 / 最终软删除后详情页均返回 404，前台产品列表不展示；最终测试产品 soft-deleted 留在产品回收站，未永久删除。
- 后台 2.0 B4-8 新版产品列表移入回收站入口已上线：`aed9de0 feat(admin): add product recycle action to console list`，full SHA `aed9de0c3759b930843e248eaac3ac359b2a8915`，Vercel deployment `dpl_J5pLzXhXg5yLUxzHy7N6MbBG9D52`，Vercel 状态 READY。新增 `ProductListDeleteAction`，在 `/admin/content/products/list` 每个产品行开放“移入回收站”图标按钮和确认弹窗，复用既有 `DELETE /api/admin/products/[id]` 软删除接口；不做永久删除、批量删除、权限矩阵、认证、支付、订单、价格、会员价、代理价或 `/global` 底层。线上真实验收先将 B4-7 测试产品从回收站恢复为草稿，再在新版产品列表点击“移入回收站”，确认后列表搜索为空、回收站可见并可恢复为草稿，前台详情页返回 404，前台 `/products` 不包含测试产品 ID。
- 后台 2.0 B4-9 产品属性模板 / 选项管理已上线：`ef846d7 feat(admin): add product attribute management`，full SHA `ef846d7eacb4e0c81340a565b66ed875a779eeab`，Vercel deployment `dpl_DEowtzWqmSpJsfctqDdWZQujripq`，Vercel 状态 READY，deployment URL `https://vessel303-78m2sh5zk-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮参照 300.cn 产品管理的“属性模板”心智，新增非破坏式迁移脚本 `scripts/migrate-b4-9-product-attributes.js`，已在线上 Neon 执行成功，创建 `product_attribute_templates`、`product_attribute_options`、`product_attribute_values` 并种子 5 组默认属性模板；新增 `/admin/content/products/attributes`，支持属性模板和选项新增、编辑、排序、显示 / 隐藏，不做物理删除；产品新建 / 编辑页可勾选属性，产品列表支持属性筛选、属性标签展示和缺属性待补统计。未做标签 / 标记、品牌、筛选管理、橱窗、价格、会员价、代理价、订单、支付、权限矩阵、批量删除、永久删除或 `/global` 底层；未在 300.cn 执行保存 / 发布 / 删除 / 付款 / 上传。05 真实验收创建 1 个 hidden `B4-9 QA` 属性模板和 1 个 hidden 选项用于验证新增 / 编辑 / 隐藏链路；临时给产品 `v9-gen6-standard` 绑定默认属性选项 `度假营地` 后确认列表筛选和编辑页展示正常，随后已恢复该产品原属性状态。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/products` 200 且页面 `data-dpl-id` 为 `dpl_DEowtzWqmSpJsfctqDdWZQujripq`，`/global` 200，未登录属性 API 401，未登录属性后台跳登录，已登录生产后台只读检查属性 API / 属性页 200。
- 后台 2.0 B4-10 产品列表质检与安全运营工具条已上线：`679d608 feat(admin): add product quality filters`，full SHA `679d608c187a5f8d3963bcb87232ec084baf3c96`，Vercel deployment `dpl_3K56o4JMZwpcp12ev5oHzRD164Xw`，Vercel 状态 READY，deployment URL `https://vessel303-6a3v0z7cq-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮再次只读对照 300.cn 产品列表、分类管理、属性模板、标记管理、品牌管理、筛选管理和橱窗管理；vessel 只落地安全质检子集：产品概览待办可跳到新版产品列表对应缺项筛选，`/admin/content/products/list` 新增缺项筛选（缺素材、缺内容、未分类、缺属性、缺 SEO），产品行优先标记缺封面、缺图库、未分类和缺 SEO，`ProductForm` 发布前检查同步提醒分类、属性和 SEO；批量工具条仅增加 300 对照规划占位，不开放批量发布、批量删除、永久删除、置顶、翻译、价格或橱窗写入。未改数据库、API、权限、认证、支付、订单、会员价、代理价、产品保存 / 发布 / 删除 / 上传逻辑或 `/global` 底层；未在 300.cn 执行保存 / 发布 / 删除 / 付款 / 上传。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地后台质检筛选未登录跳 `/admin/login`，前台 `/products` 200；线上 Vercel READY 后，已登录生产后台只读检查确认 `/admin/content/products/list?view=incomplete&issue=seo` 显示缺项 / 缺 SEO 质检内容，前台 `/products` 可打开并展示产品模型。
- 后台 2.0 B4-11 至 B4-15 产品标记 / 品牌 / 筛选 / 橱窗管理已上线：`abd7f63 feat(admin): add product operation modules`，full SHA `abd7f63b29abf2776b31c4501005f16231907f97`，Vercel deployment `dpl_5g1D4UG7QN4zHHNTnc8R4RG2KSLR`，Vercel 状态 READY，deployment URL `https://vessel303-61nb4zh92-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮再次只读对照 300.cn 产品管理，确认 300 产品列表含新增产品、草稿箱、回收站、排序、更多操作、缩略图、产品名称、分类、发布时间、浏览量、状态、已翻译语言和批量工具条，并包含标记管理、品牌管理、筛选管理和橱窗管理；vessel 本轮落地受控子集：新增 `product_marks`、`product_brands`、`product_filter_groups`、`product_filter_group_templates`、`product_showcases`、`product_showcase_items`、`product_mark_values`，并给 `product_catalog` 增加 nullable `brand_id`；新增 `/admin/content/products/marks`、`/brands`、`/filters`、`/showcases` 和对应后台 API；产品新建 / 编辑页支持品牌、运营标记、橱窗绑定；新版产品列表支持品牌 / 标记 / 橱窗筛选和展示；批量工具条开放低风险“添加标记”和“加入橱窗”。不做物理删除、批量发布、批量删除、永久删除、置顶、翻译、价格、会员价、代理价、订单、支付、权限矩阵、认证改造或 `/global` 底层；未在 300.cn 执行保存 / 发布 / 删除 / 付款 / 上传。迁移脚本 `scripts/migrate-b4-11-product-operations.js` 已执行成功，返回 `B4 product operation tables are ready`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；Vercel build READY；线上 `/products` 200；未登录 `/admin/content/products/marks`、`/brands`、`/filters`、`/showcases` 均 302 到 `/admin/login`；Chrome 插件可用且 300 后台未表现为登出。
- 后台 2.0 B4-16 产品管理生产真实运营回归已完成，并完成小修：`530c126 fix(admin): replace product batch confirm dialog`，full SHA `530c1267b0f3ad5ef94e4aa070347b93d5d49f7b`，Vercel deployment `dpl_6meNUSB1uWPi4faBGghKjv4JhZU6`，Vercel 状态 READY。B4-16 回归中 300.cn 后台保持可访问，已登录生产后台按运营人员角色验证 hidden 标记、品牌、筛选、橱窗的新增 / 编辑 / 隐藏链路，测试记录保持隐藏且不作为正式内容使用；回归发现产品列表批量分类 / 添加标记 / 加入橱窗使用浏览器原生 `window.confirm` 会阻塞 Chrome 插件验收，B4-16-1 已将批量确认统一换成后台 `AdminConfirmDialog`，不改接口和业务边界。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/products` 200，未登录 `/admin/content/products/list` 302 到 `/admin/login`；已登录生产后台真实选择产品并执行低风险批量转当前标准分类，确认弹窗可打开、确认后关闭且页面仍可用。未做物理删除、批量发布、批量删除、永久删除、价格、会员价、代理价、订单、支付、权限矩阵、认证改造或 `/global` 底层。
- 产品中心 B7 前后台 300 对齐深改已上线：`cabba2a feat(products): align product center with 300 catalog`，full SHA `cabba2ab5f49e52e0b2125fd48387e174652c144`，Vercel deployment `dpl_54Rc27igVLNAJ4YtmcfkCqjZWqci`，状态 READY；B7 回归小修 `4e8e27e fix(products): preserve static detail fallback`，full SHA `4e8e27e8ed2fb47d68bc951d378aa640dd3bc65d`，Vercel deployment `dpl_CUt9Aqms6pGM4paoBUbg8yoX3Kf1`，状态 READY，deployment URL `https://vessel303-ox55e3kku-vessel303.vercel.app`。本轮 02 只读点击 300 产品后台和 300 前台列表 / 详情，确认 300 后台包含产品列表、分类管理、属性模板、标记管理、品牌管理、筛选管理、橱窗管理，新增产品表单包含设置、SEO、标签、相关、显示状态、产品分类、基本信息、图片、视频、附件、描述、概要、橱窗、标记、品牌和规格；300 前台产品列表包含 PRODUCTS banner、Product Categories、Default Configuration、Product Configuration、Area、Country、Search、卡片和分页，详情页包含价格、Business Terms、Product Description、Classification、Key words、Consult 和 Related Products。vessel 已落地受控子集：`/products` 升级为 300 式目录页，`/products/[slug]` 通用详情模板展示图库、价格展示文本、商务条款、分类、关键词、相关产品和询盘入口；后台产品表单、列表和经营中心支持价格展示文本、商务条款、关键词、相关产品和缺项提示；默认属性模板仅缺失时初始化。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 均通过，构建仅出现既有 `/global` edge runtime warning；线上 `/products` 200、`/products?q=V9` 200、`/products/e3-gen6-standard` 200，未登录 `/admin/content/products/new` 302 到登录页。未做批量导入 300 数据、真实发布 / 删除 / 上传、支付、订单、会员价、代理价、权限矩阵、认证改造或 `/global` 底层。
- B8 性能与图片治理第一轮已上线：核心提交 `f1288f5 perf(site): improve product and image loading`，full SHA `f1288f5f470a64d02f8b217cd3e917edbeb90d0a`；产品公开读取小修 `26470e2 perf(products): streamline public catalog reads`，full SHA `26470e2b00e195946328b49af8187fb2dc512eb1`，Vercel deployment `dpl_BrcRgQNno3BvMCYBGhSyk4zrRE4w`；首页 CMS hero 图片映射小修 `96110c4 perf(home): map hero CMS images to optimized assets`，full SHA `96110c49f9b8f8763d3100c42a8d10da6d9a9c49`，Vercel deployment `dpl_9ffdhtSsW71avxE84xfZLuE4jHFE`，状态 READY。07 修复 `/admin/media` 无效 button 嵌套导致的 React hydration 风险；公开 `/products` 列表 / 筛选 / 详情改用缓存和 DB 下推分页 / 筛选，公开读取不再触发重型 schema 初始化；首页 hero 新增 5 张优化图并只渲染当前图与下一张图，CMS 中旧 `/images/hero/homepage_banner-0X.jpg` 会映射到优化资产；后台媒体上传增加超过 2MB 的前台使用提示。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，构建仅出现既有 `/global` edge runtime warning；线上首页 200 且命中优化 hero 图，`/products` warm 约 1.14s，`/products?q=E7&page=1` 约 2.26s，`/products/e7-gen6-flagship` 约 1.23s，未登录 `/admin/media` 302 到登录页。未删除原图、未批量改业务内容、未改数据库结构、权限、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`。
- B9 未接新后台前台模块 CMS 化已上线：`b8538f9 feat(admin): add fixed content cms modules`，full SHA `b8538f90241a5f619cb96140a52f8ba86823323c`，Vercel deployment `dpl_AqnmSr2QuAAdhntor6RyMTZQDcDP`，状态 READY。02 已完成 300 内容管理心智对照，落地固定内容类型 CMS：FAQ、Media Kit / 文件下载、Scenarios、Display、Innovation；新增后台入口 `/admin/content/faq`、`/admin/content/media-kit`、`/admin/content/scenarios`、`/admin/content/display`、`/admin/content/innovation`，并更新 `/admin/content`、`/admin/site/pages`、`/admin/site/navigation` 的 owner / 边界口径。前台 `/faq`、`/media-kit`、`/scenarios/tourism|commercial|public`、`/display`、`/innovation/viie|vipc|vols` 已接入 CMS 优先和静态兜底；`/media-kit` 表单写入 `leads` 后再做邮件通知。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，构建仅出现既有 `/global` edge runtime warning；线上 `/faq`、`/media-kit`、`/scenarios/tourism`、`/display`、`/innovation/viie` 均 200，未登录 `/admin/content/faq` 302 到登录页，公开内容 API 可安全返回空数据或展示兜底。未批量导入内容、未删除业务数据、未改权限矩阵、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`。
- B9 真实样板补齐与保存链路修复已上线：`63abf3f fix(admin): keep b9 content save reachable`、`8894a6d fix(admin): persist b9 form values from visible fields`、`dc6d55d fix(cms): allow b9 content inserts to publish`、`27e4f80 fix(cms): cast b9 insert status consistently`；最终 full SHA `27e4f803a30eda93dcfa84dfc73d55d2157c95b8`，Vercel deployment `dpl_AsaoKbHoq9BN8GbQTwTUtuDCkNWy`，状态 READY。生产后台已发布 FAQ、Media Kit、Scenario、Display、Innovation 共 6 条正式样板内容，线上 `/faq`、`/media-kit`、`/scenarios/tourism`、`/display`、`/innovation/viie` 均 200，公开内容 API 可读到样板内容且中文字段正常。未删除业务数据、未改权限矩阵、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`。
- B9-9 固定内容 CMS 正式内容第一批补齐已完成（2026-05-29）：本轮不改代码、不做数据库迁移、不上传文件、不物理删除；通过生产后台 API 完成真实运营链路验证和内容发布。链路验证覆盖 FAQ、Media Kit、Scenario、Display、Innovation：新增 / 编辑 / published 前台可见 / hidden 前台不可见均通过，临时验证项最终保持 hidden。最终 published 内容：FAQ 10 条（采购、定制、交付、运输、安装、售后、认证、适用场景、资料申请等），Media Kit 4 条，Scenarios 固定 `tourism` / `commercial` / `public` 3 条，Innovation 固定 `viie` / `vipc` / `vols` 3 条，Display 6 条展示项。验收结果：未登录 `/admin/content/faq` 302；已登录 `/admin/content/faq`、`/admin/content/media-kit`、`/admin/content/scenarios`、`/admin/content/display`、`/admin/content/innovation` 均 200；前台 `/faq`、`/media-kit`、`/scenarios/tourism`、`/scenarios/commercial`、`/scenarios/public`、`/display`、`/innovation/viie`、`/innovation/vipc`、`/innovation/vols` 均 200；公开 API 显示 Media Kit 4 条、Display 6 条、三条 Innovation 均可读。边界：未批量导入 300 内容、未真实上传、未改权限矩阵、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`。
- B10 产品中心前后台 / 固定精品页 / CMS 通用详情页闭环已完成（2026-05-29）：核心提交 `d339e86 feat(products): clarify public detail routing`，full SHA `d339e866d83d6cfb404ab0a3fbf1bb5baa149608`；新版后台漏口小修 `149ceeb fix(admin): surface product public route status`，full SHA `149ceeb59bed371d28d9e52781459ba3dc3e21cd`；Vercel deployment `dpl_53QkXzmujNCmoMCFeKR9prqBh3jU`，状态 READY，deployment URL `https://vessel303-puzdndru5-vessel303.vercel.app`。本轮确认 300 后台产品管理 / 门户产品心智后，统一产品官方前台跳转规则：有 `detailSlug` 优先固定精品页，没有则 CMS 通用详情；前台 `/products` 卡片、通用详情 Related Products、旧 `/admin/products`、新版 `/admin/content/products/list`、新版 `/admin/content/products/{id}/edit` 官方预览均使用同一规则。后台新增“官方前台 / CMS 通用详情 / 固定精细页绑定”提示，并把缺价格展示、缺商务条款、缺关键词、缺相关产品、精品页绑定缺 CMS 基础字段纳入运营缺项提示。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 均通过，构建仅出现既有 `/global` edge runtime warning；线上 `/products` 200、`/products?page=1` 200、`/products/v9-gen6` 200、`/products/v9-gen6-standard` 200，未登录 `/admin/content/products/list` 最终到 `/admin/login`；已登录线上后台 `/admin/content/products/list` 可见“官方前台”提示，编辑页可见“前台页面状态 / 官方前台入口 / CMS 通用详情 / 固定精细页绑定”，无 React hydration / TypeError 级别错误。未做真实发布、删除、上传、数据库迁移、权限矩阵、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`。
- B11 客户与线索后台 2.0 收口已完成（2026-05-29）：`75a9c4f feat(admin): close leads console path`，full SHA `75a9c4f0856252633d5b95efa63ef8984d158db0`；Vercel deployment `dpl_82Gy9FtWvPJEH3SkVq9omoVSBiQw`，状态 READY，deployment URL `https://vessel303-6xq6oi7gd-vessel303.vercel.app`。本轮对照 300 客户 / 线索后台心智后，新增正式线索 2.0 路径 `/admin/customers/leads`，旧 `/admin/leads` 带 query 兼容跳转到新路径；`/admin` 待处理线索、`/admin/customers` 状态卡、`/admin/status/leads`、`/admin/status/activity`、Legacy、设置、用户关联入口均收口到新线索工作区。新页面使用 `AdminSectionShell`，保留现有列表、状态筛选、搜索、详情、状态更新、跟进备注、负责人分配和 CSV 导出能力；新 2.0 页面不显示删除按钮，生产仍不显示新建测试线索。数据和 API 不变，继续使用 `leads` 与 `/api/admin/leads*`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 均通过，构建仅出现既有 `/global` edge runtime warning；线上未登录 `/admin/customers/leads`、`/admin/leads?status=new`、`/admin/customers` 均 302 到登录页；已登录 Chrome 打开旧 `/admin/leads?status=new` 最终进入 `/admin/customers/leads?status=new`，页面可见“线索管理 2.0 / 客户与线索 / 导出 CSV”，无旧 `AdminShell` 侧栏，`/admin` 和 `/admin/customers` 已无旧 `/admin/leads` 链接。未创建生产测试线索，未写生产线索状态 / 备注，未做客户档案、会员体系、订单、支付、权限矩阵、前台 `/contact` 切换、删除数据或 `/global`。
- B12 站点页面 / 导航 / 表单体验与 300 前台继续对齐已完成（2026-05-29）：`9adbf27 feat(site): unify contact and lead paths`，full SHA `9adbf27de9887eae815f4b276d9dc8d3285f7fec`；Vercel deployment `dpl_9TK6ERjNPHh9ArWkeokPRhLHmvrN`，状态 READY，deployment URL `https://vessel303-lwu7tfgcy-vessel303.vercel.app`。本轮新增 `src/lib/site-links.ts` 统一 CTA helper，Navbar / Footer / 首页 / About / FAQ / Cases / Scenarios / 产品通用详情 / 固定精品详情的 Contact / Consult / Inquiry / Purchase / Book a Visit 默认进入 `/contact`，再由 `site_settings.contactUrl` 跳 300 联系页；旧 300 产品列表 URL 在前台默认归一到 `/products`。案例询盘、V9 quick inquiry、Media Kit 申请和通用联系表单继续写入现有 `leads`，并保留 `source`、入口类型、页面上下文和测试可追踪信息；`/admin/site/navigation`、`/admin/site/pages`、`/admin/site/settings` 已同步说明哪些入口走 `/contact`、哪些写入线索 2.0、哪些由 CMS 管理。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 均通过，构建仅出现既有 `/global` edge runtime warning；线上 `/`、`/products/v9-gen6`、`/media-kit`、`/faq`、`/scenarios/tourism`、`/cases` 均 200，`/contact` 307 到 `https://en.303vessel.cn/contact.html`，未登录 `/admin/site/navigation` 302 到登录页；Chrome 生产检查确认主要前台页面 legacy 300 Contact / Products 链接数为 0。生产已创建 3 条 B12 QA 线索用于验证来源追踪：Case `7d0a5df5-84b5-4ab7-b173-565618c28ea3`、V9 `c83e341a-12ab-4d0f-b5d1-fdd51ac29c79`、Media Kit `4977d498-2e80-4725-9d6b-4d96c183860b`，标记 `B12-QA-20260529-9ADBF27`，不做删除。未改数据库结构、权限、认证、支付、订单、会员、自由建站器、`/global`、MapLibre、MapTiler 或 `/api/map`。
- B14 运营目标全链路对齐与转化闭环已完成（2026-05-29）：核心提交 `37cf869 feat(admin): close conversion lead loop`，full SHA `37cf869687e5145f05430da767d9be9f79287334`；hydration 验收小修 `a06f65d fix(admin): stabilize lead date hydration`，full SHA `a06f65d4974bc7ad2d52811bdd38f26f634aef2f`；最终 Vercel deployment `dpl_HpynhpmGgig5577MofqFhSFb1DeD`，状态 READY，deployment URL `https://vessel303-redyiz7zg-vessel303.vercel.app`。新增 `/admin/site/conversion` 运营转化路径看板，统一展示 Navbar、Footer、首页、产品、案例、FAQ、Media Kit、Scenarios、Innovation、News、Contact 的前台入口、后台 owner、当前 CTA、是否写入 leads、source 规则、预览链接和风险提示。通用产品详情 `/products/[slug]`、FAQ、Scenarios、Innovation 页面新增轻量询盘表单，新闻详情底部新增带 `source` 参数的联系 CTA；`/contact` 继续读取 `site_settings.contactUrl` 并跳 300 联系页。线索 2.0 新增来源类型筛选和来源可读标签，详情页显示来源页面 / 入口类型 / 关联对象并可跳回来源页面。真实链路验收已创建 6 条生产测试线索，均标记 `Codex B14 test`：Product `2be5a450-4e6d-444f-97ec-2e41b7c25efe`、FAQ `dc50ac9e-40bc-4e38-9059-c9fddeea260d`、Scenario `3bbdbd8c-f4bb-40fe-9fe4-26d13d6ca6ab`、Innovation `86084451-ea30-4f9e-ad40-20ad1a29aa8a`、Case `1c7861b4-7891-41ad-b236-999d87dc784a`、Media Kit `01855f0f-b0a3-4ccf-8b0e-26365aa8f84d`，不做删除。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 均通过；线上 `/faq`、`/products/v9-gen6-standard`、`/scenarios/tourism`、`/innovation/viie` 均 200 且表单可见，未登录 `/admin/site/conversion` 302 到 `/admin/login`，`/contact?source=news:test:contact_cta` 307 到 300 联系页并保留 source 参数；已登录 Chrome 检查 `/admin/customers/leads?source_type=product&search=Codex%20B14` 可见测试线索和来源筛选，浏览器 error 日志为空。未新增数据库字段，未做客户档案、会员、订单、支付、权限矩阵、删除数据、自由建站器、`/global`、MapLibre、MapTiler 或 `/api/map`。
- B13 第二阶段图片管线与真实点击体感根因治理已完成（2026-05-29）：核心提交 `a292ae4 feat(media): add image variant pipeline`，full SHA `a292ae46c53ef65de602e18a1117891532a50183`，Vercel deployment `dpl_Ai7nCo7moBnLKXvksdf8uHpRWcjd` READY；派生图尺寸小修 `d6d16c6 fix(media): tighten detail variant size`，full SHA `d6d16c61a5fd9b54cb0683075829b15a0360342c`，Vercel deployment `dpl_7AS95SiqacBoVvnvSQsqs1FJTW6q` READY。新增 `uploads.variants JSONB` 低风险字段；服务端图片上传后用 `sharp` 生成 `thumb` 320w WebP、`card` 800w WebP、`detail` 1600w WebP，并保留 `original`；媒体库和后台图片选择器优先使用 `thumb`，前台产品、案例、新闻、Display 和富文本正文按场景优先使用 `card` 或 `detail`，旧图片无派生图时保持原 URL / Next Image 兜底。`/admin/media` 显示原图大小和大图风险提示，原图超过 1.5MB 标记 `LARGE`；FAQ / Contact 公开读取增加短超时兜底，Navbar FAQ / Contact 改为原生 `<a>`，避免外部跳转体感被客户端等待拖慢。真实生产上传验收创建媒体 `b13-variant-pipeline-test.jpg`，`uploads.variants` 包含 `thumb/card/detail/original`，派生图 HEAD 均 200，`thumb` 约 2.7KB、`card` 约 121KB；小修后新 `detail` 质量下调到 78 以压住 800KB 目标。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，构建仅出现既有 `/global` edge runtime warning；线上 `/`、`/about`、`/products`、`/products/v9-gen6-standard`、`/cases`、`/cases/xunliao-bay-holiday-planet`、`/news`、`/display`、`/faq` 均 200，`/contact` 307 到 300 联系页，未登录 `/admin/media` 302/307 到登录页。未删除原图、未批量回填旧素材、未改权限、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`。
- B13-3 公开页面缓存 + 旧素材回填 + 关键静态大图治理已完成（2026-05-29）：代码提交 `0288fbc perf(frontend): cache public content and backfill image variants`，full SHA `0288fbce03c7a6b17a16750a25aa17c7178c76db`；Vercel deployment `dpl_EZqRDpb47zH9GAxPSFdcQQwQBPHF` READY，deployment URL `https://vessel303-bt86yu5tx-vessel303.vercel.app`。本轮把公开 `/products`、`/cases`、`/news`、`/faq`、`/contact`、`/scenarios/[slug]` 和 B9 display/media-kit API 改为可缓存 / 预渲染边界，产品列表由页面服务端 query 改为预渲染后客户端读取 URL query 筛选，案例 / 新闻 list/detail 增加公开 cache tag 与 `generateStaticParams`，后台项目 / 新闻 / 站点设置写入后继续 `revalidatePath` / `revalidateTag`。新增 `scripts/backfill-upload-variants.js` 支持生产旧媒体 dry-run / 小批量回填，已对 5 张缺派生图旧图片生成 `thumb/card/detail/original` 并写回 `uploads.variants`，抽查 Blob `thumb` HEAD 200、`Content-Length: 24800`、`X-Vercel-Cache: HIT`。新增 `/api/admin/media/[id]/variants` 和 `/admin/media` 单图生成入口，允许 admin 对单张媒体补派生图。关键静态大图只处理真实前台路径：新增 E7、首页 tech VOLs/VIPC、V9 main/exploded 优化 WebP 副本，单张约 24KB-156KB，不覆盖、不删除原图。验收记录：`git diff --check`、本轮改动 targeted eslint、`node --check scripts/backfill-upload-variants.js`、`tsc --noEmit`、`next build --webpack` 均通过；全仓库 `eslint -- .` 仍有旧脚本 `require()`、`GlobalMap.backup.tsx` 和 `LanguageContext` 既有问题，未纳入本轮授权范围。线上 `/products`、`/products?q=E7&page=1`、`/cases`、案例详情、`/news`、新闻详情、`/display`、`/faq` 均 200 且返回 `X-Nextjs-Prerender: 1` / `X-Vercel-Cache: PRERENDER`，TTFB 约 0.31-0.58s；`/contact` 仍 307 到 `https://en.303vessel.cn/contact.html`。未删除图片或业务数据、未覆盖原图、未改权限、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`。
- 后台 2.0 B5-1/B5-2 网站管理主控台与页面清单已上线：`5119783 feat(admin): add site page inventory`，full SHA `5119783ea5030e1af2ab9360c058f2da8694060b`，Vercel deployment `dpl_FufSD2Ua9g6PowybSY6NbdFKxTuf`，Vercel 状态 READY，deployment URL `https://vessel303-ng9411vsm-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮只读对照 300.cn 网站管理控制台，确认其包含发布产品、发布内容、项目案例、新闻资讯、导航管理、网站信息、网站 TDK 规则、三方代码、搜索引擎、死链提交和关键词密度等模块；vessel 本轮只落地低风险运营入口和只读页面边界：`/admin/site` 新增“发布与更新”，`/admin/site/pages` 新增页面清单、编辑范围、模块数量、草稿状态和 300 对照边界。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/admin/site` 与 `/admin/site/pages` 未登录均 302 到 `/admin/login`，`/admin/login` 和首页 200 且页面 `data-dpl-id` 为 `dpl_FufSD2Ua9g6PowybSY6NbdFKxTuf`。未改数据库、API、权限矩阵、认证、支付、订单、会员、导航保存、批量 TDK、三方代码保存、`/global`、MapLibre、MapTiler 或 `/api/map`；未在 300.cn 执行保存 / 发布 / 删除 / 上传。
- 后台 2.0 B5-3 导航管理只读入口已上线：`0df6f84 feat(admin): add site navigation inventory`，full SHA `0df6f84738e4d7cd54aba9e6ef7bbf9e54014722`，Vercel deployment `dpl_CquUgUTXx5vcgJ28SiPohzVJx5hT`，Vercel 状态 READY，deployment URL `https://vessel303-ppbh7orxg-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮再次只读对照 300.cn 网站管理，确认 300 导航管理包含“管理导航”“新增栏目”“主导航”，主导航项包含 E7、V9、E6、All Products、Projects、Blog、About、Contact、Global Presence 等；vessel 只落地导航只读盘点：新增 `/admin/site/navigation`，展示当前顶部导航、行动按钮和页脚链接的来源、归属、状态、风险和调整建议，并从 `/admin/site` 与 `/admin/site/pages` 接入口。未改数据库、API、权限矩阵、认证、支付、订单、会员、导航保存、导航排序 / 隐藏 / 新增栏目保存、批量 TDK、三方代码保存、`/global`、MapLibre、MapTiler 或 `/api/map`；未在 300.cn 执行保存 / 发布 / 删除 / 上传。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/admin/site/navigation` 未登录 307 到 `/admin/login`，首页 200；线上首页 200，线上 `/admin/site/navigation` 未登录 302 到 `/admin/login`，已登录 Chrome 打开生产后台该页可见 `B5-3 导航管理`、`网站导航只读盘点`、Products 和 Cases。
- 后台 2.0 B5-4 SEO / TDK 只读检查入口已上线：`931f18c feat(admin): add site SEO inventory`，full SHA `931f18c172e9189a27c1f2b56056b3f07d677460`，Vercel deployment `dpl_GosRjBGcvsY4TVQ8Z3xf7VRf8Era`，Vercel 状态 READY，deployment URL `https://vessel303-q3l5o392r-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮再次只读对照 300.cn 网站管理 / SEO 优化 / TDK 设置心智，确认 300 提供首页设置、其他页面设置、网站地图和 Robots 等入口；vessel 只落地只读检查：新增 `/admin/site/seo`，汇总产品、新闻、项目案例和静态页面的 SEO / TDK 覆盖边界，产品 / 新闻读取既有 SEO 字段，项目案例只检查简介和封面等可派生 metadata，不新增项目 SEO 字段。未改数据库、API、权限矩阵、认证、支付、订单、会员、批量 TDK、SEO 自动生成、三方代码保存、站点地图提交、Robots 保存、`/global`、MapLibre、MapTiler 或 `/api/map`；未在 300.cn 执行保存 / 发布 / 删除 / 上传。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/admin/site/seo` 和 `/admin/site/navigation` 未登录 307 到 `/admin/login`，首页 200；线上首页 200 且页面 `data-dpl-id` 为 `dpl_GosRjBGcvsY4TVQ8Z3xf7VRf8Era`，线上 `/admin/site/seo` 未登录 302 到 `/admin/login`，已登录 Chrome 打开生产后台该页可见 `B5-4 SEO / TDK`、`SEO / TDK 只读检查`、产品详情、新闻详情和项目案例详情，浏览器 error 日志为空。
- 后台 2.0 B5-5 网站信息 / 三方代码 / 搜索边界只读入口已上线：`e6446d3 feat(admin): add site settings inventory`，full SHA `e6446d3ee4e8826c3f549998701a25f1a74d0a21`，Vercel deployment `dpl_4HezCjaJYXHP498daYfUFTBYLZ8k`，Vercel 状态 READY，deployment URL `https://vessel303-aa7n1ak1c-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮再次只读对照 300.cn 网站管理，确认 300 存在网站信息、网站 TDK 规则、三方代码、搜索引擎收录连接、自定义 URL、死链提交、空短页面检测、关键词密度、页面抓取标记、RSS 订阅、SEO 分析和 Google 统计分析等入口；vessel 只落地状态入口：新增 `/admin/site/settings`，读取 `site_settings` 字段存在性、`public/robots.txt` / `public/sitemap.xml` 文件状态和 GA / GTM / Google 验证 env 存在性，展示网站信息接管、第三方代码与搜索边界、300 对照边界和保护线。未改数据库、API、权限矩阵、认证、支付、订单、会员、第三方 HTML / JS 粘贴保存、搜索引擎提交、DNS / 域名绑定、Robots 保存、`/global`、MapLibre、MapTiler 或 `/api/map`；未在 300.cn 执行保存 / 发布 / 删除 / 上传。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/admin/site/settings` 和 `/admin/site/seo` 未登录 307 到 `/admin/login`，首页 200；线上首页 200 且页面 `data-dpl-id` 为 `dpl_4HezCjaJYXHP498daYfUFTBYLZ8k`，线上 `/admin/site/settings` 未登录 302 到 `/admin/login`，已登录 Chrome 打开生产后台该页可见 `B5-5 网站信息`、`网站信息与搜索边界`、`网站信息接管`、`第三方代码与搜索边界`、Robots 和 Sitemap，浏览器 error 日志为空。
- 后台 2.0 B5-6 sitemap / robots 基线已上线：`6d876cf feat(site): add sitemap baseline`，full SHA `6d876cfdf40e739abd577e2efc9797c217a7bea9`，Vercel deployment `dpl_VT15ZmGm7WZ8EzvzCWWMDgjCQQYN`，Vercel 状态 READY，deployment URL `https://vessel303-nt3y8o3nt-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮继续只读对照 300.cn 网站管理 / SEO 入口，确认 300 有网站地图、Robots、搜索引擎连接和死链提交等模块；vessel 只落地安全基线：新增 `src/app/sitemap.ts`，动态输出静态页面、published 产品详情、published 新闻详情和非删除 published 项目案例详情；更新 `/admin/site/settings` 的 Sitemap 状态识别；更新 `public/robots.txt` 的 Sitemap 到 `https://www.vessel303.com/sitemap.xml`。未改数据库结构、未写业务数据、未改权限矩阵、认证、支付、订单、会员、站点地图提交、Robots 编辑器、搜索引擎提交、DNS / 域名绑定、`/global`、MapLibre、MapTiler 或 `/api/map`；未在 300.cn 执行保存 / 发布 / 删除 / 上传。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/sitemap.xml` 200 XML、`/robots.txt` 指向 `www` sitemap、`/admin/site/settings` 未登录 307 到 `/admin/login`，本地 Neon `EACCES` 仅导致动态项回退为静态项，本地 Auth.js `UntrustedHost` 记录为环境限制；线上首页 200 且页面 `data-dpl-id` 为 `dpl_VT15ZmGm7WZ8EzvzCWWMDgjCQQYN`，线上 `/sitemap.xml` 200 `application/xml` 且包含首页、产品列表、案例列表、新闻列表、产品详情、新闻详情和项目案例详情 URL，线上 `/robots.txt` 指向 `https://www.vessel303.com/sitemap.xml`，线上 `/admin/site/settings` 未登录 302 到 `/admin/login`；已登录 Chrome 打开生产后台该页可见 `app/sitemap.ts 已接管`，浏览器 error 日志为空。Chrome 打开 `/sitemap.xml` 被本机扩展拦截为 `ERR_BLOCKED_BY_CLIENT`，已用 `curl.exe --http1.1` 完成线上 sitemap 内容补验。
- 后台 2.0 B6 运营数据中心已上线：`232e182 feat(admin): add operations data center`，full SHA `232e182aad676b26b1d0842f24612a17da6d951c`，Vercel deployment `dpl_CMCneydagndFdJAQyo9BysA54CuZ`，Vercel 状态 READY，deployment URL `https://vessel303-asuaxvt8h-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮只读对照 300.cn 数据 / 状态 / 待办心智，确认 300 插件可连接并识别 300 后台候选页；vessel 将 B6 定义为内部运营数据中心：`/admin/status` 升级为运营总览，新增 `/admin/status/content` 内容统计、`/admin/status/leads` 线索漏斗、`/admin/status/site` 站点健康、`/admin/status/activity` 近期变化，并新增共享只读 `admin-status-metrics` helper 统一 `tableExists`、`safeLoad`、时间窗口和数字格式。统计仅读取现有产品、项目、新闻、线索、媒体、页面草稿和站点设置数据；缺表或查询失败时降级，不应 500；`operator` 可看运营统计，`admin` 才显示配置状态详情。未改数据库结构、未写业务数据、未改 API 写入、权限矩阵、认证、支付、订单、会员、GA / Search Console / Vercel Analytics、`/global`、MapLibre、MapTiler 或 `/api/map`；未在 300.cn 执行保存 / 发布 / 删除 / 上传。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，构建仅出现既有 `/global` edge runtime warning；本地 `/admin/status`、`/admin/status/content`、`/admin/status/leads`、`/admin/status/site`、`/admin/status/activity` 未登录均 307 到 `/admin/login`；线上首页 200，线上 `/admin/status*` 未登录均 302 到登录页，已登录 Chrome 打开生产后台确认 `/admin/status` 与 4 个子页可见对应标题且无 `__next_error__` / Application error。
- 后台 2.0 B6-7 访问分析准备页已上线：`ee14454 feat(admin): add analytics readiness status`，full SHA `ee1445460d9f88d59c63961c5761bc2d032d9f51`，Vercel deployment `dpl_3gG4wrsTinhzW23yme2mmnPFmqcv`，Vercel 状态 READY，deployment URL `https://vessel303-n7ciw16ui-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮延续 300.cn 数据 / 搜索 / 待办心智，新增 `/admin/status/traffic` 只读准备页，集中展示 GA / Tag Manager、Search Console 验证、Sitemap / Robots、Vercel Web Analytics 和隐私 / Cookie 边界的接入前状态；`/admin/status` 左侧数据中心新增“访问分析准备”入口，并继续保留搜索表现与完整操作日志为后续规划。未接 GA / Search Console / Vercel Analytics API，未注入第三方统计脚本，未保存第三方代码，未改数据库、业务数据、权限矩阵、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`；未在 300.cn 执行保存 / 发布 / 删除 / 上传 / 付款。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，构建仅出现既有 `/global` edge runtime warning；本地 `/admin/status/traffic` 未登录 307 到 `/admin/login`；线上首页 200 且 `data-dpl-id` 为 `dpl_3gG4wrsTinhzW23yme2mmnPFmqcv`，线上 `/admin/status/traffic` 未登录 302 到登录页，已登录 Chrome 打开生产后台确认可见“访问分析准备”“外部访问分析与搜索表现接入前检查”“第三方脚本走代码审查”，无 `__next_error__` / Application error，浏览器 error 日志为空。
- B15 网站数据分析 / 转化分析 1.0 已上线：`adee1ce feat(admin): add first-party analytics`，full SHA `adee1ce11317fe074d782c5e0302c1a3b2de113b`，Vercel deployment `dpl_FhumTGfYojun47giv83uHDF2MF52`，Vercel 状态 READY，deployment URL `https://vessel303-bjnpfrto5-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮对照 300 后台网站访问统计、落地页跳出分析、访问行为分析、线索转化分析、Google 统计分析五类心智，把 `/admin/status/traffic` 从接入准备页升级为真实第一方网站数据分析页；新增 `site_events` 表、`/api/analytics/event` 非阻塞事件接口、公开页 `SiteAnalyticsTracker`、表单成功事件上报和 `/admin/site/conversion` 30 天访问 / 动作 / 表单 / 线索 / 转化率联动。隐私边界：只存路径、事件、来源、referrer、UTM、设备类型、匿名 visitor/session hash 和时间，不存姓名、邮箱、电话、留言、原始 IP 或完整 User-Agent；仍不接 GA / Search Console / Vercel Analytics API，不注入第三方脚本，不做复杂 BI、会员、订单、支付或 `/global`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/faq`、`/products` 200，`/api/analytics/event` 返回 `202 {"ok":true}`，未登录 `/admin/status/traffic` 307 到登录页；线上 `/faq`、`/products` 200 且 Vercel cache 为 `PRERENDER`，线上 analytics API 返回 `202 {"ok":true}`，已登录 Chrome 打开 `/admin/status/traffic` 和 `/admin/site/conversion` 均正常可见，生产 `/contact` 继续跳 300 联系页。
- B15-9 网站数据分析口径校准已上线：`65ec61d fix(admin): calibrate analytics test data`，full SHA `65ec61d1877bb17103cd7fd05127e152709c6dfd`，Vercel deployment `dpl_HtLN8k8UNwTMKxnJKcaYs1gDPNnL`，Vercel 状态 READY，deployment URL `https://vessel303-gyuzy3eiz-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮只读复核生产 `site_events` 和 `leads` 口径，确认 B14 / B15 低风险测试数据会影响运营转化率；已将 `/admin/status/traffic` 和 `/admin/site/conversion` 主指标改为排除 `admin-test` analytics 事件、`admin_test%` source 和 `Codex B* test` 测试线索，并在页面单独展示“已排除测试数据”数量。未删除测试线索或测试事件，未改隐私采集范围，未接 GA / Search Console / Vercel Analytics API，未改权限、支付、订单、会员或 `/global`。验收记录：生产只读查询确认 analytics 不含邮箱 / 电话疑似文本；`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，构建仅出现既有 `/global` edge runtime warning；线上 `/faq` 200 且 `X-Vercel-Cache: PRERENDER`，线上 `/admin/status/traffic` 与 `/admin/site/conversion` 未登录均 302 到 `/admin/login`。
- B15-10 真实运营观察与数据口径固化已完成（2026-05-29）：本轮不改业务代码，仅做生产只读观察、1 条 `admin_test:b15-10:cta_click` analytics 测试事件写入验证和文档收口。生产只读结果：近 30 天主指标可区分真实 `page_view`、测试 analytics 事件、真实线索和测试线索；`admin-test` 事件、`admin_test%` source 和 `Codex B* test` 线索未进入主运营指标；`site_events` schema 仅含路径、事件、来源、referrer、UTM、设备、匿名 visitor/session hash、metadata 和时间，不含姓名、邮箱、电话、留言、原始 IP 或完整 User-Agent；疑似邮箱 / 电话文本扫描结果为 0。线上只读复核：`/`、`/products`、产品详情、`/cases`、案例详情、`/faq`、`/media-kit`、`/scenarios/tourism`、`/innovation/viie`、`/news` 均 200 或 PRERENDER / STALE 可缓存状态，`/contact` 307 到 300 联系页；未登录 `/admin/status/traffic`、`/admin/site/conversion`、`/admin/customers/leads` 均 302 到 `/admin/login`。未接 GA / Search Console / Vercel Analytics API，未注入第三方脚本，未创建测试线索，未删除任何测试数据，未改权限、支付、订单、会员或 `/global`。
- B16 SEO / Search Console 接入准备与索引基础收口已上线：`d27e141 feat(seo): prepare search console indexing`，full SHA `d27e141b8a4b02b3d35378bb706f57739bde60f8`，Vercel deployment `dpl_Cn46CgxYoKDMsfaEjZT3vZP1MHM4`，Vercel 状态 READY，deployment URL `https://vessel303-nzexrf7of-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮在 300 后台登录态下只读确认 SEO 优化模块包含网站地图、Robots、TDK 设置、内贸城市产品页、内页辅助收录；vessel 补齐产品列表、产品通用详情、固定精品页 `/products/v9-gen6`、FAQ、Media Kit、Display、Scenarios、Innovation 的基础 metadata，更新 sitemap 固定收录路径，并把 `/admin/site/seo` 升级为 SEO / 收录准备中心。未接 Google Search Console / GA / Vercel Analytics API，未保存第三方验证码或脚本，未提交 sitemap，未改 DNS / 域名，未改数据库、权限、支付、订单、会员或 `/global`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/sitemap.xml` 200 且包含 `/products/v9-gen6`、`/scenarios/tourism|commercial|public`、`/innovation/viie|vipc|vols`、`/media-kit`、`/display`，线上 `/robots.txt` 200 且继续禁止 `/admin/` 和 `/api/admin/`，线上 `/faq` 200 PRERENDER，线上 `/products/v9-gen6` 200，线上 `/admin/site/seo` 未登录 302 到 `/admin/login`。
- B17 Search Console URL 前缀 Meta 验证准备已上线：`3d0abee feat(seo): prepare search console verification`，full SHA `3d0abee37e21b54c7a9464380859db9a6ddca23d`，Vercel deployment `dpl_4nj4giNZJY5KDaW2xyye8YfGUpGr`，Vercel 状态 READY，deployment URL `https://vessel303-jixrcjopv-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮在 300 后台登录态下只读确认 300 的“搜索引擎连接”和“Google 收录分析”需要 Google 账号授权；vessel 只实现安全接入准备：新增 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 环境变量读取 helper，根布局在配置 token 后输出 `google-site-verification` Meta，`/admin/site/seo`、`/admin/site/settings`、`/admin/status/traffic` 显示 URL 前缀验证 token 是否已配置。未把验证码写入 repo / 数据库 / 文档，未接 Google API / OAuth，未点击 Google 验证，未向 Google 提交 sitemap，未改 DNS、数据库、权限、支付、订单、会员或 `/global`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上首页 200 且 `data-dpl-id` 为 `dpl_4nj4giNZJY5KDaW2xyye8YfGUpGr`，当前未输出 Google verification meta 属于预期，因为 Vercel 尚未配置 token；线上 `/sitemap.xml` 200 `application/xml`，`/robots.txt` 200，`/admin/site/seo` 未登录 302 到 `/admin/login`。下一步若要完成真实 Search Console 绑定，需要 Wynne 提供 URL 前缀属性的 Meta content token，配置到 Vercel 环境变量后重新部署，再在 Google 后台点击验证并提交 `https://www.vessel303.com/sitemap.xml`。
- B18 300 对齐补漏与前台 UI 第一轮精修已上线：`89d80e0 feat(admin): align site tools and detail UI`，full SHA `89d80e08f6e205c25fb3742809ad2fee73512cb9`，Vercel deployment `dpl_6YqZqUqxAmzgWew2d5as1QC9L9dD`，Vercel 状态 READY，deployment URL `https://vessel303-ocvgbdi51-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮重新只读对照 300 后台、300 前台产品详情和 vessel 前后台，确认产品、案例、新闻、FAQ、Media Kit、Scenarios、Innovation、Display、线索、数据、SEO 等主链路基本闭合，但 `/admin/media`、`/admin/pages/visual` 仍有旧后台壳痕迹，Display 缺少详情 / 咨询入口，通用产品详情和案例详情精致度不足。已新增 `/admin/site/media`、`/admin/site/visual` 并把新后台按钮直达新路径，旧 `/admin/media`、`/admin/pages/visual` 只做兼容跳转；`/display` 补 Details / Consult；通用产品详情补 Quick Facts、商务条款层级、锚点询盘和卡片视觉；案例详情补图文首屏、标签、数据卡和 CTA 视觉。未改数据库、未写生产业务数据、未删除内容、未改权限、认证、支付、订单、会员或 `/global` 底层。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/display`、`/products/e7-gen6-flagship`、`/cases/xunliao-bay-holiday-planet` 均 200，`/admin/site/media`、`/admin/site/visual` 未登录 307 到 `/admin/login`；线上 `/display`、`/products`、产品详情、案例详情均 200，已登录 Chrome 验证 `/admin/site/media`、`/admin/site/visual` 均在新后台 2.0 壳内加载。下一步建议进入 B19：按 300 前台继续做首页 / About / FAQ / Contact / 页脚等前台 UI 精致度专项，不再混入后台功能开发。
- B19 首页 / About / FAQ / Contact / 页脚前台 UI 精致度专项已上线：`ae0682f feat(frontend): polish site navigation experience`，full SHA `ae0682f819c86ba5a54789e64d58125ec944e93e`，Vercel deployment `dpl_DqAKSrtXAxgP1bEnGt1SmsmmeEbr`，Vercel 状态 READY，deployment URL `https://vessel303-71mgo4xok-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮在 300 后台登录态下只读确认 300 网站管理 / 产品管理 / 数据分析入口可访问，并对照 303vessel.cn 前台和 vessel 前台发现 FAQ / Contact 点击体感、页脚泛链接和联系入口来源追踪仍需收口。已新增 `buildContactHref()` 统一联系入口 source 参数；Navbar 的 FAQ / Contact 改回 Next `Link` 内部跳转，Purchase / Book / Footer / Home / About / FAQ CTA 统一走 `/contact?source=...` 后再跳 300 联系页；Footer 移除泛社交链接和假 ICP 文案，产品链接修正到现有详情路径；FAQ 增加统计提示和空状态；首页 E7 旗舰入口修正到 `/products/e7-gen6-flagship`；`/admin/site/navigation` 与 `/admin/site/conversion` 的入口说明同步为 source-aware 规则。未改数据库、未写生产业务数据、未删除内容、未改权限、认证、支付、订单、会员或 `/global` 底层。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/`、`/about`、`/faq`、`/products/e7-gen6-flagship`、`/products/v9-gen6-standard` 均 200，`/contact?source=navbar%3Apurchase_cta` 307 到 300 联系页并保留 source，`/admin/site/navigation` 未登录 307 到 `/admin/login`；Chrome 本地点击验证 About -> FAQ 可即时进入 `/faq`；线上 `/`、`/about`、`/faq`、两个固定产品详情均 200 / PRERENDER，`/contact?source=navbar%3Apurchase_cta` 正确 307 到 300 联系页，`/admin/site/navigation` 未登录 302 到 `/admin/login`。下一步建议进入 B20：继续按 300 前台审美做首页 / About 大图与品牌叙事精修，或单独开 07 旧素材回填 / Lighthouse 深测。
- B20 首页 / About 品牌叙事与前台精致度补强已上线：`1fff457 feat(site): polish brand entry pages`，full SHA `1fff45778c42cd3274752d91dbd87ff38fae23c6`，Vercel deployment `dpl_2YiPpBteA8bv4DaFtmZD7ZvXn13E`，Vercel 状态 READY，deployment URL `https://vessel303-oyx9pztnh-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮在 300 后台登录态下只读确认 300 可访问，并按 300 / 303vessel.cn 前台心智补强品牌叙事和运营路径说明：首页新增 `Operating Map` 区块，把产品、案例、交付和咨询串成首访买家的运营导览；About 新增 `Brand Decision Path`，帮助客户理解品牌定位、项目能力和下一步动作；FAQ 新增 Before Purchase / During Project / Next Step 支持路径提示；Footer 增加工厂交付与 source-aware inquiry path 可信度提示。后台只同步 `/admin/site`、`/admin/site/pages`、`/admin/site/navigation` 的说明文案，不开放自由建站器或新增可编辑字段。未改数据库、未写生产业务数据、未删除内容、未改权限、认证、支付、订单、会员或 `/global` 底层。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/`、`/about`、`/faq` 均 200，`/admin/site/pages` 未登录 307 到 `/admin/login`；线上 `/`、`/about`、`/faq` 均 200，Chrome DOM 确认 `OPERATING MAP`、`BRAND DECISION PATH`、`BEFORE PURCHASE` / `DURING PROJECT` 可见且无 hydration 文本错误，`/admin/site/pages` 未登录 302 到 `/admin/login`。
- B21 300 对齐复核与前台精致度升级已上线：`f9b4441 feat(site): polish B21 operating paths`，full SHA `f9b4441052ee0533e1d38762d0190fb2a2fa32be`，Vercel deployment `dpl_EeijW6QNFaWNZWcFq37ZbT8rFPMa`，Vercel 状态 READY，deployment URL `https://vessel303-iwkf5s18m-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮在 300 后台登录态下只读确认中企动力控制台和产品 / 官网等入口可访问，并参考 303vessel.cn 前台产品列表 / 详情心智，先复核产品、案例、FAQ、About、首页、Footer 与新后台 owner 的运营路径。已给 `/products` 产品卡片补 Details / Inquiry 双入口和 catalog highlights，给 `/cases` 补 Project filter / Case proof / Conversion 路径提示，FAQ 补 owner / answer count / lead routing 提示，首页和 About 增加产品 / 案例 / 咨询导向 CTA，Footer 增加 B21 运营路径可信提示；`/admin/site`、`/admin/site/pages`、`/admin/site/navigation`、`/admin/site/conversion` 同步 B21 说明。未改数据库、未写生产业务数据、未删除内容、未改权限、认证、支付、订单、会员或 `/global` 底层。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/`、`/products`、`/cases`、`/faq`、`/about` 均 200，`/admin/site/pages` 未登录 307 到 `/admin/login`；线上 `/`、`/products`、`/cases`、`/faq`、`/about` 均 200，`/admin/site/pages` 未登录 302 到 `/admin/login`。
- B22 前台精致度与运营全链路复核已上线：`0b21f36 feat(site): refine B22 frontend operating paths`，full SHA `0b21f366d22140f522ab5c4d93569b4fe70b14de`，Vercel deployment `dpl_1Lmg1tGbYK4CDNAkvBtPBojcsVHE`，Vercel 状态 READY，deployment URL `https://vessel303-ee6vbu0wj-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮在 300 后台登录态下只读确认中企动力控制台、官网、产品、服务、支持等入口可访问，并继续参考 303vessel.cn 前台的高清产品感、目录感和强联系入口心智。已把 `/products` 首屏改为产品图驱动目录 hero，产品卡片提高图片占比并保留 Details / Inquiry，侧边栏补 source-aware 咨询卡；`/products/[slug]` 补详情锚点导航和 source-aware 联系入口；`/cases` 补精选案例图和项目证据卡；`/` 增加视觉 proof grid；`/about` 首屏补产品 / 咨询 CTA；FAQ 补 Buyer Path；Scenarios、Innovation、Media Kit 补统一 CTA / source tracking 提示；Footer 与 `/admin/site/pages`、`/admin/site/navigation`、`/admin/site/conversion` 同步 B22 owner / 编辑边界 / 转化去向说明。未改数据库、未写生产业务数据、未删除内容、未改权限、认证、支付、订单、会员或 `/global` 底层。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；本地 `/`、`/products`、`/products/e7-gen6-flagship`、`/cases`、`/about`、`/faq`、`/scenarios/tourism`、`/innovation/viie`、`/media-kit` 均 200，`/contact` 正常跳 300 联系页；线上同路径均 200 且浏览器无 `#__next_error__`，未登录 `/admin/site/pages`、`/admin/site/navigation`、`/admin/site/conversion` 均 302 到 `/admin/login`。
- 后台 2.0 开发规则：重大产品设计前必须做 300.cn 对照确认；普通 bug、文案、API、权限、lint/build 不必每轮访问。若对 300 交互不确定，先回 300.cn 只读观察，不凭记忆硬做；300 负责启发路径，vessel 负责收口边界。
- 03 项目案例 / 项目 CMS：当前 3 个 Excel/static 样板项目已进入 CMS 发布链路；旧 `foshan-shishan-cultural-camp` 保持 draft，不显示在 `/cases`，不进入 `/global`。前台 `/cases` 列表已进入正式 `/cases/[id]` 详情页链路，筛选、300.cn 对照字段、相关案例入口、B2-6 全链路回归和 B2-7 案例询盘接线索已完成，Global 仍只是地图展示渠道。
- 04 Global 地图专项：`/global` 地图底层仍归 04；03 不直接修改地图底层。`/global` 营地详情首开速度第一阶段已上线：`77b053d perf(global): speed up project detail loading`；预加载 `ProjectDetail` 和 `showcaseProjects`，详情基础文字先显示，轮播图片按当前图加载；未改 `/api/map/[...path]`、runtime、点位、CMS、坐标、HQ，未替换 / 压缩 / 删除图片素材；剩余大图体积治理交 03 / 媒体侧，MapTiler `key=proxied` 403 属既有地图链路问题，`/global` edge runtime warning 仍归 04。
- 05 测试 / 提交 / 推送 / 上线：继续统一验收、提交、push `main` 和 Vercel 上线控制。
- 06 文档整理：继续维护 V9、`CODEX.md` 和文档库。
- 07 性能 / 图片 / 前台速度专项：B8 第一轮性能与图片治理已完成；B13 已完成真实性能瓶颈定位、About 首屏原图修复、图片派生管线第二阶段和 B13-3 公开页面缓存 / 旧素材小批量回填。当前公开产品、案例、新闻、FAQ、联系等主路径已可预渲染 / 缓存；新上传图片会写入 `uploads.variants` 并生成 `thumb/card/detail/original`，前台和后台选择器已按场景优先取小图；旧素材已先回填 5 张，后续继续分批推进，不一次性全量改造。后续继续维护首页、产品中心和全站前台响应速度，按旧素材派生回填、后台产品页首屏速度、Lighthouse 深测和真实点击体感拆小步优化。工具故障和流程问题沉淀转入 00 / 06 文档规则管理。
- 08 可视化页面编辑器：C4-2d Home 安全插入区排序与结构隐藏已上线；可见时“隐藏”发送 `{ isVisible: false }`，隐藏时显示“结构草稿中隐藏”，“恢复显示”发送 `{ isVisible: true }`；测试数据 `C4-2D-QA-20260517` 已清理，无残留；当前仍只支持 Home credentials 后、CoreTech 前的安全插入区，不支持 About、核心模块、整页自由拖拽、跨区排序、自由 HTML / CSS、删除核心模块、产品 / 项目 / 新闻详情或 `/global`；本机 Turbopack `os error 5` 属于本地环境问题，`next build --webpack` 和 Vercel build 已通过；`/global` edge runtime warning 仍归 04 地图专项。
- 08 可视化页面编辑器：C4-2e 可视化编辑器运营使用规范口径小修已上线：`811efee fix(admin): clarify visual editor guardrails`，full SHA `811efee3d1deffdc180aa5ba92040b4ce549077f`，Vercel deployment `dpl_B4vFHT3sYhNJ7bkRkMEYu1qtqGyy`，Vercel 状态 `READY`，deployment URL `https://vessel303-5ht797ic0-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮只修正 `/admin/pages/visual` 的运营使用规范和页面结构边界文案，将过期的“不支持结构草稿 / 新增 / 排序”口径对齐为当前 Home 安全插入区可新增、排序、结构隐藏 / 恢复 `simple-text` / `cta-section`，同时明确核心模块、About 结构、自由样式 / 自由布局仍锁定。未改数据库、API、保存 / 发布 / 删除、权限、认证、支付、订单、会员、`/global`、MapLibre、MapTiler 或 `/api/map`。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过，构建仅出现既有 `/global` edge runtime warning；本地 `/admin/pages/visual` 未登录 307 到 `/admin/login`；线上首页 200，线上 `/admin/pages/visual` 未登录 302 到登录页，已登录 Chrome 打开生产后台确认可见更新后的 Home 安全插入区 / 核心模块锁定口径，无 `__next_error__` / Application error。
- 价格、会员、代理、支付：单独专项，不在普通 CMS 任务中写死规则。
- Resend：正式发件身份仍未配置，缺少 `RESEND_FROM` / `CONTACT_NOTIFY_TO` / `MEDIA_KIT_NOTIFY_TO` 和域名验证信息。
- Vercel edge runtime warning：仍来自 `/api/map/[...path]`，归入 `/global` 地图专项，暂不处理。

## 新闻模块当前状态

截至 2026-05-25，新闻发布和新闻后台 2.0 主路径已经上线。

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
- `src/app/admin/(console)/content/news/page.tsx`
- `src/app/admin/(console)/content/news/list/page.tsx`
- `src/app/admin/(console)/content/news/new/page.tsx`
- `src/app/admin/(console)/content/news/[id]/edit/page.tsx`
- `src/app/admin/(console)/content/news/_news-console.tsx`
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
- 新版后台主路径是 `/admin/content/news -> /admin/content/news/list -> /admin/content/news/new 或 /admin/content/news/{id}/edit`。
- 旧 `/admin/news`、旧 new / edit 路径继续作为维护备用。
- `/admin`、`/admin/content`、`/admin/status` 和内容域内新闻入口已收口到新版路径。
- B3-0/1/2 已完成真实发布和删除验收；测试新闻删除后 `/news/vessel-news-console-2-test-20260525` 返回 404。
- B3-3 已完成分类管理、回收站、批量操作和定时发布的只读规划入口；`/admin/content/news/list` 已有批量选择和禁用批量操作预演。
- B3-5 已完成新闻分类真实建表与保存接入，`/admin/content/news/categories` 可显示当前 DB 分类，`NewsForm` 的 `所属分类` 可选择并保存，新闻列表可按分类筛选。
- B3-6 已完成新闻全链路只读回归；新旧后台入口、分类页、表单、列表、前台列表和详情页当前闭合。
- B3-7 已完成分类新增 / 编辑 / 隐藏；`/admin/content/news/categories` 可管理分类，hidden 分类不进入新建新闻下拉。
- B3-8 已完成新闻回收站恢复；`/admin/content/news/recycle` 可查看已删除新闻并恢复为草稿，不做永久删除。
- B3-9 已完成新闻批量转分类；`/admin/content/news/list` 支持选择新闻后批量转到 visible 分类，不开放批量发布或删除。
- B3-10 已完成新闻定时发布第一阶段；`/admin/content/news/list?schedule=scheduled` 可筛选定时草稿，编辑页可保存 / 清除计划发布时间，但不自动发布。
- B3-11 已完成新闻 SEO 字段治理第一阶段；编辑页可保存搜索标题 / 描述，前台新闻详情 metadata 优先读取 SEO 字段并保留兜底。
- B3-12 已完成生产环境真实全链路回归；新闻从后台创建到前台发布、取消发布、批量转分类、回收站恢复和最终软删除均跑通。
- 定时自动执行器、关键词、批量 SEO、SEO 自动生成和权限分级仍是后续任务，不要混入普通新闻主路径小修。

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

- `src/auth.config.ts`：给 proxy 用的极简配置，不做 DB 调用。
- `src/auth.ts`：服务端完整 auth，包含 DB callbacks。
- `src/proxy.ts`：当前保护 `/admin/*` 登录状态。

不要在 middleware/proxy 中 import `src/auth.ts`，会引发运行时兼容问题。

服务端管理员检查：

- 内容运营类 API routes 使用 `requireAdmin()`，允许 `admin` 和 `operator`。
- 用户管理、设置、白名单、系统配置等敏感 API routes 使用 `requireSuperAdmin()`，只允许 `admin`。
- 当前后台角色语义：
  - `user`：普通前台注册用户，不能进入后台。
  - `operator`：运营人员，可进入后台管理线索、页面模块、新闻、产品、项目、图片库等内容。
  - `admin`：总管理，拥有全部后台权限，包括用户管理和设置。
- 不要把安全限制只做在 UI 禁用上。
- 管理员自我保护必须在服务端实现。
- 管理员不能通过 PATCH 把自己降级、禁用或锁死。
- 白名单管理员不能被误降级。
- Auth JWT callback 会从数据库刷新用户 `role` / `identity` / `disabled`，确保角色调整或禁用后不会长期依赖旧 token。

后台登录规则：

- `/admin/login` 使用邮箱 + 密码作为主登录方式，Google 登录作为备用。
- 不再使用邮箱魔法链接作为后台主入口；邮件送达不稳定时会锁住后台。
- 邮箱密码登录走 Auth.js `credentials` provider，密码存储在 `users.password`，必须是 bcrypt hash。
- 后台访问权限仍由服务端 `role` 判断，普通 `user` 即使能登录前台也不能进入后台。
- 给现有管理员设置或重置密码时，用 `scripts/set-admin-password.js`，不要手写明文 SQL 更新密码。

前台注册与身份规则：

- `users.role` 是后台权限角色，只能表示 `user` / `operator` / `admin`。
- 前台新注册用户默认都是普通会员：`role = 'user'`。
- 注册页和 `/api/register` 不再让用户选择或提交 `identity`，也不要把 `agent` / `investor` 当成用户自选身份。
- 为兼容当前数据库字段，注册 API 服务端仍显式写入 `identity = NULL`；以后价格权限或会员分层不要复用旧 `identity` 自选逻辑。
- Google 新用户不再进入 `/register/complete` 补全身份；Auth callback 创建/更新用户后直接按普通会员返回首页，白名单管理员逻辑保持独立。
- `/register/complete` 和 `/api/register/profile` 只是旧路径兼容，不应再承载前台身份选择。

测试账号与本机运维脚本：

- 当前存在 `user` / `operator` / `admin` 三类测试账号，用于前台账号、运营后台、总管理权限验证。
- 测试账号密码保存在 `repo-git\.env.local`，不进入 Git，不在文档或对话中输出。
- 创建/修复测试账号的脚本位于外层 `C:\Users\Wynne\Desktop\vessel303\local-ops\`，不属于 `repo-git` 项目代码，不随线上部署。
- 该脚本会写数据库；运行前必须获得 Wynne 明确授权。

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
- `/admin/customers/leads`
- `/admin/leads`（兼容跳转到 `/admin/customers/leads`）
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

- `/cases`
- `/cases/[id]`
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

- 03 项目案例 / 项目 CMS：继续小批量样板策略；B2-5 前台 `/cases` 列表与 `/cases/[id]` 详情页已完成筛选、详情字段和相关案例入口，B2-6 全链路回归与 B2-7 案例询盘接线索已完成。发布更多项目前先补齐封面图、图库、经纬度、简介、舱数/规模、设施、交通、周边。下一步建议 03 先补 3-5 个重点案例素材，02 暂不马上开 Global 数据基线。
- 02 后台运营 / 新闻：B3-0/1/2 新闻后台 2.0 主路径已完成并通过真实发布 / 删除验收；B3-3 已完成新闻分类 / 回收站 / 批量操作 / 定时发布只读规划和批量操作预演；B3-4 已完成新闻分类字段方案页；B3-5 已完成分类真实建表、`news.category_id` 保存接入、分类 API、表单选择保存和列表筛选；B3-6 已完成全链路只读回归；B3-7 已完成分类新增 / 编辑 / 隐藏；B3-8 已完成回收站恢复为草稿；B3-9 已完成批量转分类；B3-10 已完成定时发布第一阶段；B3-11 已完成 SEO 字段治理第一阶段；B3-12 已完成生产全链路真实回归。权限分级继续后置，不作为当前下一步。
- 02 后台运营 / 产品与固定内容 CMS：B4-0 至 B4-16 产品管理 2.0 核心运营能力与生产真实运营回归已完成；B7 已完成产品中心前后台 300 对齐深改，`/products` 已升级为 300 式目录页，`/products/[slug]` 通用详情模板已支持图库、价格展示、商务条款、分类、关键词、相关产品和询盘入口，后台产品表单 / 列表 / 经营中心已支持价格展示文本、商务条款、关键词、相关产品和缺项提示；B10 已完成产品官方前台页、CMS 通用详情页和固定精品详情页的路径规则收口，并把新版 `/admin/content/products/list` 与编辑页预览提示接入同一规则。B8 已完成产品公开读取性能治理，产品列表 / 筛选 / 详情的公开读取走轻量缓存和分页 / 筛选下推。B9 已完成 FAQ、Media Kit / 文件下载、Scenarios、Display、Innovation 的固定内容类型 CMS 接入，前台保持 CMS 优先和静态兜底。价格仅展示；权限矩阵仍放到基本建站标准完成后再做；不混入会员价、代理价、订单、支付和 `/global` 底层。
- 02 后台运营 / 客户与线索：B11 已完成客户与线索后台 2.0 收口，正式入口为 `/admin/customers/leads`，旧 `/admin/leads` 仅兼容跳转；B12 已把主要前台咨询 CTA 收口到 `/contact` 并让案例 / V9 / Media Kit / 联系表单写入带来源上下文的线索；B14 已新增 `/admin/site/conversion` 转化路径看板，并让产品通用详情、FAQ、Scenarios、Innovation、新闻联系 CTA、案例和 Media Kit 的来源进入线索 2.0 可读标签 / 筛选 / 来源页面跳转。下一步若继续客户域，应先做只读规划，再决定是否进入客户档案、跟进记录或权限分级；会员、订单、支付仍后置。
- 02 后台运营 / 网站管理：B5-1/B5-2 已完成 `/admin/site` 发布与更新入口和 `/admin/site/pages` 页面清单 / 编辑边界；B5-3 已完成 `/admin/site/navigation` 导航管理只读盘点；B5-4 已完成 `/admin/site/seo` SEO / TDK 只读检查入口；B5-5 已完成 `/admin/site/settings` 网站信息 / 三方代码 / 搜索边界只读状态入口；B5-6 已完成 `/sitemap.xml` 动态 sitemap 基线、`robots.txt` 指向 `www` sitemap 和设置页状态识别；B16 已把 `/admin/site/seo` 升级为 SEO / 收录准备中心，并补齐公开页 metadata 与 sitemap 漏口；B17 已完成 Search Console URL 前缀 Meta 验证代码准备，配置 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 后根页面可输出 Google 验证 Meta，后台能显示 token 配置状态。网站管理安全第一阶段可视为收口；仍不开放自由建站器、自由 HTML / CSS、导航保存、批量 TDK、三方代码保存、Google API / OAuth、Search Console 真实点击验证、搜索引擎提交、DNS / 域名绑定修改或 `/global` 底层。
- 02 后台运营 / 数据中心：B6 已完成 `/admin/status` 运营数据中心、内容统计、线索漏斗、站点健康、近期变化等只读入口；B15 已完成第一方网站数据分析 1.0，`/admin/status/traffic` 可展示近 7 / 30 天 PV、匿名访客、CTA 动作、表单成功、线索数、转化率、Top Pages、来源、落地页动作和近期事件，`/admin/site/conversion` 可按转化路径显示 30 天访问 / 动作 / 表单 / 线索 / 转化率。B15-9 后运营主指标默认排除 Codex 验收测试事件和测试线索，并单独提示排除数量；B15-10 已通过生产只读观察确认真实数据、测试数据、隐私边界和未登录保护口径可解释，测试数据保留不删除。当前仍不接 GA / Search Console / Vercel Analytics API，不注入第三方统计脚本，不做复杂 BI，不新增权限矩阵，不采集表单隐私信息，不碰 `/global`。
- 04 Global 地图专项：地图底层仍归 04；更多 `/global` 点位接入前先等 03 数据基线稳定。
- 02 后台运营 / 设置：`site_settings` 已初始化并接管 `/contact` 的 `contactUrl`；B12 后前台主要 CTA 已通过 `/contact` 间接读取该设置，后续扩展范围单独确认。
- 后台运营体验 A / B 包：A1-A6、B1-B7、新 B6 运营数据中心、B6-7 访问分析准备页、B8 性能与图片治理第一轮、B9 固定内容 CMS 第一阶段、B10 产品中心路径闭环、B11 客户与线索后台 2.0 收口、B12 站点入口 / 表单路径收口、B13 真实性能瓶颈第一修复包、B13 第二阶段图片派生管线、B13-3 公开页面缓存 / 旧素材小批量回填、B14 运营目标全链路对齐与转化闭环、B15 网站数据分析 / 转化分析 1.0、B15-9 数据口径校准与 B15-10 真实运营观察、B16 SEO / Search Console 接入准备与索引基础收口、B17 Search Console URL 前缀 Meta 验证准备已上线 / 收口；媒体真实上传、旧图小批量回填、B14 低风险测试线索写入和 B15 / B15-10 低风险 analytics 测试事件写入均已完成验证并从运营主指标排除，媒体删除和线索删除仍需单独授权。
- 08 可视化页面编辑器：C4-2e 运营使用规范口径小修已上线；旧 `/admin/pages` 仍只是备用表单编辑器，主线继续是 `/admin/pages/visual`；后续继续补页面级结构保护和更细的发布保护，不要扩成自由建站器。
- 价格、会员、代理、支付：单独专项，不在普通 CMS 任务中顺手实现。
- Resend：正式发件身份仍未配置。
- Vercel edge runtime warning：归入 `/global` 地图专项，暂不处理。
- 文档：业务结论变化先更新 V9，再判断是否同步 `CODEX.md`。

## B23 移动端体感 / 图片比例 / 前台设计级复核（2026-05-30）

- Code commit: `7549b27` / `7549b2769a1e3657aef005253104bb2efcf32b70`
- Vercel deployment: `dpl_DqkRBb2c5wwXt7RjDPr81AxstdYy`，状态 `READY`，production alias 包含 `https://www.vessel303.com`
- 本轮定位：B23 是前台设计级移动端与图片比例复核，不新增后台大模块，不批量补内容，不做自由建站器。
- 已完成范围：移动端 Navbar 触达面积和菜单滚动、产品列表 hero / 卡片图片比例 / Details + Inquiry 触达、产品通用详情标题换行 / 锚点 / Related Products、案例列表图片比例和 CTA、FAQ 首屏和 CTA、Scenarios / Innovation / Media Kit 的移动端间距、表单按钮和 CTA 触达。
- 后台同步范围：`/admin/site/pages`、`/admin/site/navigation`、`/admin/site/conversion` 已从 B22 说明更新为 B23 移动端 / 图片比例 / CTA 复核边界，继续只做运营提示，不开放导航保存或自由编辑。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 通过；线上 `/`、`/about`、`/products`、`/products/v9-gen6-standard`、`/products/v9-gen6`、`/cases`、`/cases/xunliao-bay-holiday-planet`、`/faq`、`/scenarios/tourism`、`/innovation/viie`、`/media-kit` 均 200；`/contact` 在 `www` 域名上 307 到 300 联系页；未登录 `/admin/site/pages` 302 到 `/admin/login`。
- Chrome 线上抽查：`/products`、`/faq`、`/scenarios/tourism`、`/media-kit` 无 console error、无横向溢出。
- 未改范围：未改数据库、未写生产业务数据、未改权限 / 认证 / 支付 / 订单 / 会员、未改 `/global`、MapLibre、MapTiler 或 `/api/map`。
- 后续建议：B24 可进入“内容素材与精品页补齐”或“移动端视觉深测 / 旧素材继续回填”，不要把权限矩阵提前插入前台体验链路。

## B24 后台决定前台内容归源治理（2026-05-30）

- Code commit: `e77c2c0` / `e77c2c09fa65e5343b5299e6f66b820c8fa53659`
- Vercel deployment: `dpl_4Xay7mv5ikcqLmhKX7JkxP27hWMk`，状态 `READY`，production alias 包含 `https://www.vessel303.com`
- 硬规则：后台是唯一内容来源，前台只展示后台已发布内容；前台只保留固定展示模板、样式容器、响应式规则和必要系统提示。
- 前台不得自行写死或改写业务文案、图片、CTA 文案、模块说明、排序、显示 / 隐藏状态；这些必须来自产品 CMS、案例 CMS、新闻 CMS、FAQ CMS、B9 固定内容 CMS、Home / About / page modules、站点设置或导航 / 页脚配置。
- 已完成代码范围：扩展 `page_modules` 到 `products`、`faq`、`media-kit`、`site` 等公开页面配置；Navbar / Footer 改为读取 `site` 模块；Home、Products、FAQ、Media Kit 改为读取对应后台模块；FAQ 不再使用本地 FAQ 静态数据作为前台内容；Cases、Innovation、Scenarios、产品详情已清理公开页上的内部运营 / 验收说明。
- 后台编辑范围：`/admin/pages/visual` 与 page module API 已允许 B24 新页面 key；`/admin/site/pages`、`/admin/site/navigation`、`/admin/site/conversion` 继续作为运营说明和 owner 边界入口，不开放自由 HTML / CSS。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 通过；本地 Chrome 抽查 `/`、`/products`、`/faq`、`/media-kit` 无内部说明词；线上 `/`、`/products`、`/faq`、`/media-kit` 均 200 / PRERENDER；未登录 `/admin/site/pages` 302 到 `/admin/login`。
- 已知边界：本轮完成核心公开面归源第一刀，未做全站深层静态 fallback 清零。Scenarios、部分 Innovation 专题、固定精品产品页、About 遗留结构、产品 / 案例 / 新闻的 legacy fallback 仍需后续 B24 follow-up 逐步归源；但公开页不得再出现 `运营导览`、`对照 300`、`Codex`、`后台 owner`、`B23` 等内部说明。
- 未改范围：未改数据库结构、未删除业务内容、未改权限 / 认证 / 支付 / 订单 / 会员、未改 `/global`、MapLibre、MapTiler 或 `/api/map`。

## B25 前后台彻底归源重构与 303vessel.cn 展示对齐（2026-05-30）

- Code commit: `2a885d1` / `2a885d19dd67b722fdf9fb3926fbc4063140aab1`
- Vercel deployment: `dpl_Aj2PTBgMPGhMUHzVRbi5PEJ2CiLo`，状态 `READY`，production alias 包含 `https://www.vessel303.com`
- 本轮定位：B25 覆盖 B24 follow-up，把“后台决定前台”从核心公开面推进到全站客户可见运行时。前台只负责展示模板、响应式布局、图片加载、交互、路由和表单提交；文字、图片、CTA、导航、Footer、表单 labels、SEO、排序、显示 / 隐藏状态均由后台 published 内容或对应 CMS 决定。
- 内容来源规则：公开前台不再运行时使用 `DEFAULT_PAGE_MODULES`、`src/data/*` 或本地静态方案作为业务 fallback。后台没有 published 内容时隐藏对应模块；整页无内容时只允许系统级空状态，不允许前台补业务宣传文案。
- 后台内容承接：`page_modules` 已扩展并补齐 `home`、`about`、`products`、`cases`、`news`、`faq`、`media-kit`、`display`、`scenarios`、`innovation`、`contact`、`auth`、`account`、`site` 等页面 key；B25 backfill 脚本只补缺失 published 内容，不覆盖运营已编辑内容、不删除原内容。
- 导航 / 页脚 / 共享文案：Navbar、Footer、logo、主导航、语言旁动作、联系入口、登录 / 注册 / 账户中心文案、表单字段、placeholder、成功 / 失败提示、产品 / 案例 / FAQ / Media Kit / Scenarios / Innovation 询盘 labels 均已改为后台模块或 CMS 字段读取。
- 前台清理范围：Home、Media Kit、FAQ、Scenarios、Innovation、产品通用详情、固定精品页、案例详情、登录、注册、账户中心均已移除运行时业务预设；`/products/v9-gen6` 通过产品 CMS 的 `detailSlug` / 产品 ID 读取内容，`/products/v9-gen6` 与 `/products/v9-gen6-standard` 均保持 200。
- 禁止项：公开前台源码审计已加入 `scripts/audit-public-content.mjs` 和 `npm run audit:public-content`，用于拦截客户可见业务文案、CTA、placeholder、成功 / 失败提示、内部说明词和业务图片 URL 的运行时硬编码；`/global` 排除在 B25 范围外。
- 验收摘要：`node scripts/audit-public-content.mjs`、`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；本地和线上 `/`、`/about`、`/products`、`/products/e7-gen6-flagship`、`/products/v9-gen6`、`/products/v9-gen6-standard`、`/cases`、`/cases/xunliao-bay-holiday-planet`、`/faq`、`/media-kit`、`/scenarios/tourism`、`/innovation/viie`、`/news` 均 200；`/contact` 307 到 300 联系页；未登录 `/admin/site/pages` 302 到 `/admin/login`。线上核心公开页为 `PRERENDER`，未引入长期 `no-store`。
- 未改范围：未删除业务内容、未改权限 / 认证 / 支付 / 订单 / 会员，未改 `/global`、MapLibre、MapTiler 或 `/api/map`。B25 写入的后台初始内容仅用于承接现有展示，原则是只补缺失、不覆盖运营内容。
- 后续建议：下一步不要再做“前台补文案式精修”。应先让运营在后台补齐真实内容和图片，再由 01 只调整展示模板；若继续深化，优先做 B26 后台可编辑字段体验、内容完整度检查和运营真实改稿验收。

## B26 后台内容治理与运营改稿闭环（2026-05-30）

- Code commit: `6e6ccdb` / `6e6ccdbb8937e1c6d2b34b289270b854a93d2078`
- Vercel deployment: `dpl_DRhkJQWbWixFGWxCc3fzdanh52sY`，状态 `READY`，production alias 包含 `https://www.vessel303.com`
- 本轮定位：B26 把 B25 的“后台决定前台”硬规则变成运营可用的后台工作台。前台仍只展示后台 published 内容；后台负责内容来源、状态、排序、SEO、导航、页脚、资源、表单、质检和发布后的前台同步确认。
- 300 对照结论：300 的精髓不是前台可编辑，而是后台集中管理产品、内容、表单、SEO、资源、数据、质检和发布状态；本轮按这个心智把 vessel 新后台补成“前台内容来源中心 + 质检提示 + 固定字段编辑”的运营闭环。
- 已完成范围：新增 `src/lib/admin-site-governance.ts`，集中维护页面内容合同、后台 owner、内容来源、必需模块、展示 / 隐藏规则、published / draft / hidden 统计、CTA / 图片 / 表单 / SEO 状态和缺口等级。
- `/admin/site/pages` 已升级为“前台内容来源中心”，每个公开页面可查看后台 owner、内容来源、前台预览、后台编辑入口、状态数量、模块数量、SEO / CTA / 表单状态和质检提示；后台只显示管理状态，不向前台注入说明文案。
- `/admin/site/navigation` 已改为读取 `page_modules:site` 的 Navbar / Footer / logo / action 配置状态，展示链接质检、无效链接提示、前台预览和编辑入口；不再把静态 `Navbar.tsx` / `Footer.tsx` 当作运营说明来源。
- `/admin/pages/visual`、`PageModulesClient` 与 `PageVisualEditorClient` 已强化“显示到前台”字段标注；页面模块项目操作从“删除”改为“隐藏”，避免运营误以为可以物理删除内容。
- B9 固定内容 CMS 管理器已补搜索、状态筛选、前台预览、状态标签和“显示到前台”字段提示，覆盖 FAQ、Media Kit、Display、Scenarios、Innovation 等固定内容类型。
- 验收摘要：`node scripts/audit-public-content.mjs`、`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；本地路由检查确认 `/admin/site/pages`、`/admin/site/navigation` 未登录跳 `/admin/login`，公开 `/`、`/products`、`/faq`、`/media-kit`、`/scenarios/tourism`、`/innovation/viie` 可访问且公开页保持缓存状态。
- 线上验收：`https://www.vessel303.com/` 和 `/products` 为 200 / `PRERENDER`；未登录 `/admin/site/pages`、`/admin/site/navigation` 跳登录；登录态 Chrome 抽查 `/admin/site/pages`、`/admin/site/navigation`、`/admin/site/visual` 页面可读且无 console error。
- 已知边界：本轮没有做物理删除，没有改权限 / 认证 / 支付 / 订单 / 会员，没有改 `/global`、MapLibre、MapTiler 或 `/api/map`；真实生产改稿写入仍应由运营在新后台入口按 B26 内容合同执行，05 可按需要做低风险改稿验收。
- 后续建议：下一步不建议再做前台硬编码修补。若继续运营化，优先做 B27“真实内容补齐与运营样板发布”：由运营或 03 提供真实图片 / 文案，02 只补后台字段和质检口径，01 只调整展示模板，05 验证后台改什么前台显示什么。

## B32 海外官网可信度缺口修复与 303 交互对齐（2026-06-01）

- Code commit: `d1bfaa5` / `d1bfaa505a61c9a293c7e001dcdbd1bea8c34734`
- Vercel deployment: `dpl_9EqqGBPynLTGmpP4VKjPecbrsMeo`，状态 `READY`，deployment URL `https://vessel303-44kb9d8ec-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com`
- 本轮定位：排除 `/global` 后，修复海外客户体验官指出的高信任风险：Footer 产品 404、测试感 News、中英混排、表单字段可靠性、产品筛选反馈和 Media Kit 假下载风险。后台仍是控制器，前台只修展示逻辑、字段属性和模板渲染，不写死业务文案或销售承诺。
- Footer 产品链接：后台 `site:footer-products` 配置和默认初始化均已修正，E6 从 `/products/e6` 改为 `/products/e6-gen6-standard`，E3 从 `/products/e3` 改为 `/products/e3-gen6-standard`；production link audit 已覆盖后台 published 导航 / 页脚链接。
- News 规则：测试感 published 新闻（如 `weisu / weisuweisu / test / Codex / Bxx`）已降为 draft；可信英文 published 新闻少于 2 篇时，Navbar / Footer 的 News 入口隐藏，sitemap 不主动收录测试新闻；`/news` 保留 200 安全空状态。
- Scenarios 英文页：`tourism / commercial / public` 已补齐英文 published 内容；英文模式不再回退中文字段，英文内容缺失时隐藏对应模块或显示系统级空状态，避免 `/scenarios/*?lang=en` 出现中文标题、正文或 CTA。
- 表单可靠性：`ConversionInquiryForm` 已补稳定 `name`、`autoComplete`、`aria-label` 技术属性；这是表单识别和可访问性修复，不属于前台业务文案。生产低风险测试已确认 Contact、Product Inquiry、Case Inquiry、Scenario 表单会把姓名、邮箱、电话 / WhatsApp、国家、数量、需求、model、source 写入 `/admin/customers/leads`。
- 产品筛选反馈：`/products` 结果区已增加当前筛选条件、匹配产品数量、清除筛选和无结果状态；所有可见 label 均来自 `page_modules:products/ui-labels`，缺 label 时隐藏，不在前台写默认业务文案。
- Media Kit：资源卡只在存在真实 `file_url` 或可信链接时显示下载 / 打开资源；没有真实文件时保留申请表单和后台内容缺口，不显示假下载按钮。
- 新增 / 强化脚本：`scripts/backfill-b32-trust-cleanup.mjs` 用于 dry-run / apply 低风险后台内容修复；`scripts/audit-production-links.mjs` 已能区分主站禁止旧链与 `/global` 旧站例外；`scripts/audit-published-content.mjs` 已强化 HTTP 失败和英文页中文残留检测。
- 验收摘要：targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links` 均通过；线上 `/`、`/products`、`/products/e6-gen6-standard`、`/products/e3-gen6-standard`、`/news`、`/scenarios/tourism|commercial|public`、`/media-kit`、`/contact`、`/global` 均 200。
- 浏览器验收：线上 `/products?q=E7`、`/products/v9-gen6-standard`、`/news`、`/scenarios/tourism|commercial|public`、`/media-kit`、`/contact` 无可见中文残留、无空 `name` 表单控件、无横向溢出、无 console error。
- 真实测试线索：B32 写入 4 条低风险生产测试线索并保留不删除：Contact `a8ab7cf0-f7fa-43ce-ab35-d18655671825`、Product `f448c146-6d23-412c-8e30-8de48e259528`、Case `0535e9ce-a878-4de9-8a0c-59276dcc1a32`、Scenario `c70eecb3-9305-48d6-9bb5-d782d133ea7f`。
- `/global` 边界：本轮零改动。渲染后 `View Products` 仍指向 `https://en.303vessel.cn/products_list.html`，`Contact Team` 仍指向 `https://en.303vessel.cn/contact.html`；MapLibre、MapTiler、`/api/map` 和 Global 旧站例外继续归 04 / Global 专项。

## B33 303 / 300 复刻式后台控制前台（2026-06-01）

- Code commit: `7fb4a30 feat(site): align 303-style content control`
- Full SHA: `7fb4a30ea82455562bf08de8fd710f6439e35630`
- Vercel deployment: `dpl_GyAV6djtMtyPLDPysGYdaupYBtGi`，状态 `READY`，deployment URL `https://vessel303-pf1risz9b-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`
- 本轮定位：按 303 英文站和 300 后台心智做“运营方式 / 内容结构 / 展示心智”复刻，不复制 300 SaaS 底层，也不复制旧站缺陷。后台继续作为控制器，前台只做显示器；文字、素材、资料入口、产品详情资料区和案例商业证明标签均来自后台 published 内容或 CMS 字段。
- 300 / 303 素材：已只读抓取 303 首页、产品列表、产品详情和联系页 HTML 到 `C:\Users\Wynne\Desktop\vessel303\vessel-assets\300-export\2026-06-01\raw\`；图片 CDN 直连下载被 303 CDN 返回 HTTP 567 拦截，候选素材已记录到 `manifest.csv/json` 并标记 `blocked-by-303-cdn-567-not-published`，未直接发布这些受阻图片。本轮发布样板使用项目内已有公开图片和媒体入口。
- 后台内容样板：新增 `scripts/backfill-b33-303-replica.mjs` 支持 dry-run / apply，已写入低风险 published 配置并复跑 dry-run 显示 `No B33 changes needed.`。内容包括：首页 hero 更直接的海外产品表达、案例详情字段标签、E7 / V9 / E6 / E3 产品采购资料模块、产品图库 / 规格说明补强、Media Kit 真实可打开资源入口。
- 产品详情：产品后台详情模块支持 `Title | URL | Description` 资料链接写法；前台通用产品详情只渲染后台字段，能显示内部链接、外链、`mailto` / `tel`，缺字段则隐藏，不在前台补业务文案。
- 案例详情：商业证明标签改由 `page_modules:cases:detail-labels` 控制，前台只展示 CMS 值和后台 published label；无 label 时不硬写默认业务文案。
- 旧短链和 News：`/products/e6` 301 到 `/products/e6-gen6-standard`，`/products/e3` 301 到 `/products/e3-gen6-standard`；News 真实英文内容不足时不进入主导航 / Footer / sitemap 主收录，`/news` 和测试详情如 `/news/2026` 返回 404，避免展示 `weisu` 等测试内容。
- `/global` 边界：本轮代码 diff 为零；Global 仍引用 `DEFAULT_CONTACT_URL=https://en.303vessel.cn/contact.html` 和 `LEGACY_PRODUCTS_URL=https://en.303vessel.cn/products_list.html`，Contact / Products 旧站例外继续保留，未改 MapLibre、MapTiler、`/api/map`。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；线上 `/`、`/products`、`/products/e7-gen6-flagship`、`/contact`、`/media-kit`、`/cases/astrobase-mamison`、`/global` 均 200；`/products/e6`、`/products/e3` 线上 301 到 canonical；`/news`、`/news/2026` 线上 404；未登录 `/admin` 302 到 `/admin/login`。

## B34 303 英文站内容与素材复刻补齐（2026-06-01）

- Code commits: `7f269ac feat(site): deepen 303 sales content` / `7f269ac174660a6a942140ca76b693da47f5d47f`，以及 `10174e2 fix(site): use published case links in B34 content` / `10174e2e82b2a4f34be03abc0a337b8a420927ac`。
- Vercel deployments: `dpl_3M6DZkbDeeRYJ3mpnWMW1pbxtWP6` READY，最终修复部署 `dpl_HLLPN3cuisFJirkkyzAN32wQhdqQ` READY，deployment URL `https://vessel303-jt5ol5tjb-vessel303.vercel.app`。
- 本轮定位：B34 继续补齐 B33 与 `en.303vessel.cn` 的销售力差距，重点是首页销售模块、产品资料深度、案例商业证明、Media Kit 真实资料入口和海外联系方式统一。后台仍是控制器，前台只做显示器；前台不写死业务文案、图片、CTA、资料下载或 SEO。
- 300 / 303 素材：B34 选定可用资料并落到 repo 静态下载目录 `public/downloads/b34/`，包括 E3 / E5 / E7 / V9 的 floor plan、E3 / E7 / V9 spec sheet 等资料文件；外部素材清单位于 `C:\Users\Wynne\Desktop\vessel303\vessel-assets\300-export\2026-06-01\b34-selected\manifest.csv` 和 `manifest.json`，不进入 Git。疑似第三方或来源不可判断素材不得发布。
- 后台内容写入：新增 `scripts/backfill-b34-sales-assets.mjs`，支持 dry-run / apply；已写入低风险 published 内容和 CMS 字段，复跑 dry-run 显示 `No B34 changes needed.`。内容包括 Home hero / featured products / case proof 模块，E7 / V9 / E6 / E3 / E5 产品图库、specs、detail_modules、下载资料、关键词、SEO、相关产品和商务条款，案例 proof 字段，Media Kit 资料资源，以及统一 Contact 渠道。
- 前台显示器补强：新增 Home `product-showcase` page module template 与 renderer，让首页可通过后台模块展示更接近 303 英文站的产品直给、高清图和强 CTA；前台只渲染后台 published 模块，缺内容时隐藏，不补默认销售文案。
- 链接修复：B34 首次上线后，`audit:production-links` 发现首页 case proof 中两个后台 published 案例链接 404；已把 `/cases/israel-dream-island`、`/cases/argentina-nordelta` 改为已发布案例 `/cases/xunliao-bay-holiday-planet`、`/cases/wanlv-lake-leqing-valley`，并用第二个 commit 修复脚本默认值。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；线上 `/`、`/products`、`/products/v9-gen6-standard`、`/contact`、`/media-kit`、`/cases/xunliao-bay-holiday-planet`、`/cases/wanlv-lake-leqing-valley`、`/global` 均 200；`/downloads/b34/v9-gen6-spec-sheet.pdf` 200；未登录 `/admin` 302 到 `/admin/login`。
- `/global` 边界：本轮未修改 Global 代码、MapLibre、MapTiler 或 `/api/map`；Global Contact / Products 继续保持老 303 跳转例外。
- 后续建议：B35 若继续复刻销售力，应继续由 03 / 运营补更多可确认的 303 原始素材、产品资料和案例商业数据，再由 02 写入后台 published 内容或 CMS 字段；01 只调整展示模板，不在前台补业务内容。

## B35 首页 303 销售力后台化复刻（2026-06-01）

- Code commit: `f948ad3 feat(home): align homepage sales modules` / `f948ad322d8fee4b04b99ee8099f3c5f8e8bdf19`。
- Vercel deployment: `dpl_3tEt3399oA5zYnY7uB51vdx1NAym`，状态 `READY`，deployment URL `https://vessel303-qixk87pqb-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com`。
- 本轮定位：B35 只解决首页与 `en.303vessel.cn` 销售力差距，不扩展到全站。继续锁定“后台是控制器，前台是显示器”：首页客户可见文字、图片、CTA、联系方式、SEO、排序和显示 / 隐藏均来自后台 published 内容；前台只改模板布局、图片比例、响应式、模块渲染、链接规范化、缓存和性能。
- 300 / 303 对照：已只读学习 300 首页模块、栏目、导航、素材、SEO、联系方式和发布状态，以及 303 英文首页的 hero、产品直给、产品系列、项目证明、联系入口、浮动 WhatsApp / Email 和 Footer；未在 300 执行保存、发布、上传、删除或付款。
- 首页内容合同：Home 固定模块升级为 `hero`、`product-series`、`model-grid`、`application-scenes`、`project-proof`、`contact-band`。每个模块只开放标题、正文、图片、按钮文案、按钮链接、卡片、排序、显示状态和发布状态；后台无 published 内容时前台隐藏模块，不显示代码备用业务文案。
- 后台模板与质检：`page_modules` 新增 `home.salesGrid` 和 `home.contactBand` 受控模板；`/admin/pages/visual` 与 `/admin/site/pages` 已能识别 B35 首页模块、首页完整度、产品入口、CTA、SEO、旧链和英文页中文混入等质检项。
- 后台内容写入：新增 `scripts/backfill-b35-homepage-303-sales.mjs`，支持 dry-run / apply；已写入低风险 published 内容并只补缺失 / 刷新 B35 首页模块，不删除业务内容。内容包括更直给的首页 hero、产品系列、型号卡片、应用场景、项目证明、联系横幅和首页 SEO。
- 前台显示器补强：`HomePageContent` 新增 B35 首页 sales grid 与 contact band 渲染；首页首屏改为更接近 303 英文站的“高清大图 + 产品直给 + 项目证明 + 强联系入口”展示方式。所有可见文案、图片和按钮仍来自后台模块；前台不硬写销售文案。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；本地 production `/` 渲染 B35 首页模块，`/global` 200；线上首页 200 且命中 `dpl_3tEt3399oA5zYnY7uB51vdx1NAym`，线上 `/products` 200，`/contact` 200，未登录 `/admin/site/visual` 302 到 `/admin/login`。
- `/global` 边界：本轮未修改 Global 代码、MapLibre、MapTiler 或 `/api/map`；Global Contact / Products 旧站例外继续保持，不套用首页 / 主站新站闭环规则。
- 后续建议：B36 若继续缩小首页差距，应优先由 03 / 运营提供更多可确认的 303 原始图片和产品实拍，再由 02 写入后台 published 内容；01 只继续优化首页显示模板和响应式，不在前台补业务文案。

## B36 首页 303 视觉销售力二次复刻（2026-06-01）

- Code commit: `c84cc73 feat(home): add B36 visual sales modules` / `c84cc73e60b9a648c8a33e413f3d855d3e7b5b0b`。
- Vercel deployment: `dpl_B4TxuEkf6yteo6XFm4emMiysnx5g`，状态 `READY`，deployment URL `https://vessel303-buraaru0g-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com`。
- 本轮定位：B36 只继续优化首页，让 `vessel303.com` 首页在首屏视觉冲击、产品直给、型号露出、项目证明和即时联系入口上更接近 `en.303vessel.cn`；不扩展到全站，不改 `/global`。
- 300 / 303 对照：已确认 Chrome 插件可连接且 300 后台处于登录态，只读对照 300 首页 / 栏目 / 素材 / 导航 / SEO / 联系方式配置，以及 303 英文首页的 hero carousel、大产品卡、型号区、Innovation、Scenarios、Future Explorer、浮动联系和 Footer；未在 300 执行保存、发布、上传、删除或付款。
- 首页内容合同：Home 在 B35 基础上新增 / 强化 `large-product-cards`、`model-strip`、`innovation-story`、`scenario-tiles`、`future-explorer` 等受控模块；`hero` 与 `contact-band` 继续由后台 published 内容控制。每个模块只开放固定字段，后台无 published 内容时前台隐藏，不显示代码备用业务文案。
- 后台内容写入：新增 `scripts/backfill-b36-homepage-303-visual.mjs`，支持 dry-run / apply；已写入 / 刷新 B36 首页 published 内容和首页 SEO，只处理 B36 首页模块，不删除业务内容，不覆盖无关运营内容。旧 B35 的 `product-series`、`model-grid`、`application-scenes`、`project-proof` 已转为隐藏，避免首页重复。
- 素材库：B36 只使用可确认的项目现有素材和已发布媒体，不把原始素材直接放进 repo。外部素材 manifest 位于 `C:\Users\Wynne\Desktop\vessel303\vessel-assets\300-export\2026-06-01\b36-homepage\manifest.csv` 和 `manifest.json`，不进入 Git。
- 前台显示器补强：`HomePageContent` 新增 `home.visualSales` 渲染，首页按后台模块展示更接近 303 的“大图首屏 + 大产品卡 + 型号带 + 技术入口 + 场景入口 + Future Explorer + 联系横幅”节奏；所有客户可见文案、图片、按钮和链接仍来自后台模块或站点配置，前台不硬写销售内容。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过。本地 production 首页渲染 B36 模块且无内部词、无旧站主 CTA、无横向溢出；线上首页 200 且 B36 模块可见，`/products` 200，`/contact` 200，`/global` 200，未登录 `/admin` 302 到 `/admin/login`。
- `/global` 边界：本轮未修改 Global 代码、MapLibre、MapTiler 或 `/api/map`；Global Contact / Products 旧站例外继续保持，不套用首页 / 主站新站闭环规则。
- 后续建议：不要继续只靠前台视觉微调追差距。下一步若继续接近 303 英文站，应优先补产品详情和案例详情的真实素材、长图文、资料下载和商业证明，由 03 / 运营整理可确认素材，02 写入后台 CMS，01 只优化显示模板。

## B37 产品详情 / 案例详情 / Media Kit 303 销售资料复刻（2026-06-02）

- Code commit: `6ed328c feat(site): deepen product and case sales materials` / `6ed328cce9f93bfa96005f2b826782e0a068e267`。
- Vercel deployment: `dpl_AZeckkqwrejMmqN6mcqzMrZSvYf7`，URL `https://vessel303-m8det2k6g-vessel303.vercel.app`，状态 READY，production alias 已包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：B37 不继续磨首页，转向海外客户最关心的产品册、案例商业证明和资料下载。后台仍是控制器，前台只做显示器；所有产品参数、资料下载、案例事实、Media Kit 资源、标题和 CTA label 均来自后台 published 内容或 CMS 字段。
- 300 / 303 对照：实施前已确认 Chrome 插件可连接 300 后台，状态 `ok=true`、`tabCount=12`；本轮仅做只读学习，不在 300 保存、发布、上传、删除或付款。
- 后台内容写入：新增 `scripts/backfill-b37-sales-depth.mjs`，支持 dry-run / apply；已写入 / 刷新低风险 published 内容和 CMS 字段，复跑 dry-run 显示 `No B37 changes needed.`。样板覆盖 E7、V9、E6、E3、E5 产品资料深度，巽寮湾假日星球、夹金山麋鹿星球、万绿湖乐晴谷等案例商业证明，以及 Media Kit 资料资源。
- 产品详情：`/products/[slug]` 通用 CMS 详情新增后台 label 驱动的 Product Specifications、Buyer Downloads、Keywords、Related Products 标题和首屏 Request Quote 锚点；详情模块中的资料链接以更清晰的下载 / 打开资源卡片展示。缺后台字段或缺 label 时隐藏，不在前台补业务文案。
- 案例详情：案例详情新增后台 label 驱动的 Commercial Proof、Project Gallery、Related Project References；面积、投资、采购数量、采购型号等事实只展示 CMS 中已发布字段，不确定内容不硬填。
- Media Kit：`/media-kit` 资源区从侧栏升级为资料中心网格，只展示后台已发布且带 `file_url` 或可信链接的资源；无真实文件不显示假下载按钮，申请表单继续写入 `leads`。
- 资产库：B37 外部素材 manifest 位于 `C:\Users\Wynne\Desktop\vessel303\vessel-assets\300-export\2026-06-01\b37-sales-depth\manifest.csv` 和 `manifest.json`，不进入 repo commit；本轮没有把来源不清素材发布到前台。
- 后台质检：`/admin/site/pages`、`/admin/site/conversion`、产品和案例治理提示新增产品缺 buyer downloads 风险识别；质检只在后台显示，不向前台注入说明。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler、`/api/map` diff；Global Contact / Products 旧站跳转例外继续保持。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；线上 `/products/e7-gen6-flagship`、`/products/v9-gen6-standard`、`/cases/xunliao-bay-holiday-planet`、`/media-kit`、`/contact` 均 200 / PRERENDER，`/global` 200，未登录 `/admin` 302 到 `/admin/login`。
- 后续建议：继续接近 303 英文站时，下一步应优先补第二批真实产品 PDF、更多产品实拍和更多案例商业字段；仍由 03 / 运营整理可确认素材，02 写入后台，01 只优化展示模板。

## B38 产品目录广度与 Contact 采购问答闭环（2026-06-02）

- Code commit: `78f392f feat(site): broaden catalog and procurement FAQ` / `78f392f3e9803b59a686fe8402d3d6ad1dbf3d18`。
- Vercel deployment: `dpl_6YZy7kNZJvVARdSUHPvVFBBMBFe8`，URL `https://vessel303-nekng56ke-vessel303.vercel.app`，状态 READY，production alias 已包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：B38 接在 B37 后，重点补齐 303 英文站更强的“完整产品库、采购 FAQ、案例商业信息、即时联系入口”。后台仍是控制器，前台只做显示器；产品、FAQ、案例、联系方式、下载资料、SEO、按钮文案均来自后台 published 内容。
- 300 / 303 对照：实施前已确认 Chrome 插件可连接 300 后台，状态 `ok=true`、`tabCount=12`；本轮仅做只读学习，不在 300 保存、发布、上传、删除或付款。
- 后台内容写入：新增 `scripts/backfill-b38-catalog-faq.mjs`，支持 dry-run / apply；最终 dry-run 显示 `B38 catalog/FAQ dry-run. No changes needed.`。本轮补齐 `products:ui-labels` 系列展示 label、`contact:faq-panel`、采购 FAQ 分类与问答，以及部分案例商业证明字段。
- 产品目录：`/products` 新增由后台 label 驱动的系列汇总区，产品按 CMS 中的 `productSeries` 形成更接近完整产品库的分组展示；V3 / V5 / V7 / S5 等高把握候选在缺失时可由脚本写入 published 产品，资料不足的型号继续进入 manifest / 后台缺口，不在前台硬补。
- Contact / FAQ：`/contact` 读取 FAQ CMS 中的采购 FAQ，并结合 `contact:faq-panel` 后台模块展示；问答内容、标题和 CTA 均来自后台 published 内容，前台不写默认采购文案。
- 案例列表：`/cases` 卡片可展示后台 CMS 中已发布的面积、采购数量、采购型号等商业事实；可见 label 来自 `cases:detail-labels`，缺字段或缺 label 时隐藏，不展示假数据。
- 资产库：B38 外部素材 / 产品候选 manifest 位于 `C:\Users\Wynne\Desktop\vessel303\vessel-assets\300-export\2026-06-01\b38-catalog-faq\manifest.csv` 和 `manifest.json`，不进入 repo commit；SV918 / RC902 / SC610 等仍作为后续目录缺口记录，未强行发布。
- 真实链路验收：生产环境写入 4 条低风险测试线索并保留不删除：Contact `e8379e4c-57bc-4f2e-aa68-ff13989446ca`，Product `8dcd8b66-a667-4d11-a2f6-619034ebdf78`，Case `be678767-78e5-4ef2-8fde-219c85181ae9`，Media Kit `42ebfc74-80ef-403e-ac2d-686f4ceb0b23`；只读 DB 复核确认 source、姓名、邮箱、电话 / WhatsApp、国家、数量、需求等字段已保存。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；线上 `/products`、`/products?q=V3`、`/contact`、`/faq`、`/cases`、`/media-kit` 均 200 / PRERENDER，`/global` 200，未登录 `/admin` 302 到 `/admin/login`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler、`/api/map` diff；Global Contact / Products 旧站跳转例外继续保持。
- 残留风险：Media Kit 测试线索的 `sku_interest` 仍带既有中英混合资源标签，这是旧 API / 资源 label 口径残留，不影响入库，但建议后续单独做 B39 小修。
- 后续建议：B39 优先做 Media Kit label 口径清理、第二批产品目录候选补全和案例商业字段继续补齐；仍由后台 published 内容承接，01 只优化显示模板。
## B39 第二批产品目录与案例商业证明补齐（2026-06-02）

- Code commit: `003fc6d chore(content): add B39 catalog proof backfill`
- Full SHA: `003fc6dc7c4818762f131cd1e6ae5363f968e2ad`
- Vercel deployment: `dpl_Ct1xuSKJ7qjqLeSfLkBNVV4g3ERU`，状态 `READY`，deployment URL `https://vessel303-hsgj1wslc-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：新增 `09 差距对比 / 体验官线程` 后的第一轮执行包。09 负责只读对比 `en.303vessel.cn`、300 后台和 vessel 线上差距；00 负责定计划和分发；02/03 写入后台 published 内容；01 仅在显示器需要时修模板；05 验收、commit、push、Vercel READY 和线上检查；06 文档收口；07 复测性能。除 300 后台无法登录、Chrome 插件不可用、未知 git 改动、检查失败、Vercel / 线上失败、删除 / 权限 / 支付 / 订单 / 会员 / `/global` 底层风险或重大产品判断外，不再打断 Wynne。
- 300 / 303 对照：实施前已确认 Chrome 插件可连接 300 后台，状态 `ok=true`、`tabCount=12`；本轮仅做只读学习，不在 300 保存、发布、上传、删除或付款。
- 后台内容写入：新增 `scripts/backfill-b39-catalog-case-proof.mjs`，支持 dry-run / apply。脚本已恢复并发布高把握第二批产品 `v3-gen5-standard`、`v5-custom-taiwan`、`v7-custom-reception`、`s5-gen5-standard`，补英文名称、主图、图库、规格、关键词、相关产品、商务条款、详情模块和 SEO；E7 / V9 / E6 / E3 的面积单位从 `㎡` 规范为 `sqm`。复跑 dry-run 显示 `B39 catalog/case proof dry-run. No B39 changes needed.`。
- 案例商业证明：已规范巽寮湾假日星球、夹金山麋鹿星球、祁连托茂部落、万绿湖乐晴谷和华为智慧家居展厅等案例的面积、投资额、采购数量 / 型号、封面和图库；不确定采购数量继续留空，不在前台硬填。
- 素材库：B39 外部素材 / 产品案例映射 manifest 位于 `C:\Users\Wynne\Desktop\vessel303\vessel-assets\300-export\2026-06-01\b39-catalog-case-proof\manifest.csv` 和 `manifest.json`，不进入 repo commit。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；线上 `/products`、`/products/v3-gen5-standard`、`/products/v5-custom-taiwan`、`/products/s5-gen5-standard`、`/cases/qilian-tuomao-tribe`、`/global` 均 200。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` 代码 diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：09 下一轮继续对比 `en.303vessel.cn` 产品库和案例页。若差距仍明显，B40 优先补 SV918 / RC902 / SC610 等剩余产品候选的可确认资料，或做 Media Kit label 口径清理与真实资料下载增强；仍必须由后台 published 内容承接，前台只负责显示。

## B40 产品目录 SSR 显示器修复（2026-06-02）

- Code commit: `bdded81 fix(products): server-render catalog filters`
- Full SHA: `bdded81aa13db9bb5a96e41daecf2856ffad38d2`
- Vercel deployment: `dpl_5y9TCkDH896iVbckCHJ8rDNdqgg2`，状态 `READY`，deployment URL `https://vessel303-24l3loe2m-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com`。
- 本轮定位：09 对比 `en.303vessel.cn/products_list.html` 和 vessel 线上 `/products` 后发现，303 产品列表首屏 HTML 直接包含目录、筛选和产品内容，而 vessel `/products` 曾在生产 HTML 中出现 `BAILOUT_TO_CLIENT_SIDE_RENDERING` 和空的 `min-h-screen` shell。B40 只修显示器问题，让产品目录按后台 published 内容在服务端 HTML 中直接输出；不新增业务文案，不改产品 CMS 内容。
- 技术处理：`src/app/products/page.tsx` 改为在 server page 读取并规范化 `searchParams`，把 `initialFilters` 传给 `ProductsPageContent`；`src/components/pages/ProductsPageContent.tsx` 移除 `useSearchParams()`，不再依赖 client-side bailout 获取筛选条件。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack`、`audit:public-content`、`audit:published-content`、`audit:production-links` 均通过；线上 `/products` 和 `/products?q=E7` 均 200 且 HTML 中不再出现 `BAILOUT_TO_CLIENT_SIDE_RENDERING`，可直接检索到 `E7 Gen6`、`Product Categories`、`Matching products`、`Current filters` 等目录内容；`/global` 200。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` 代码 diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 残留风险：线上 `/products` 当前仍是 `private no-store / X-Vercel-Cache: MISS`，B40 先解决产品目录 HTML 空壳与 303 对齐的显示器问题，缓存可作为后续性能小包单独治理。
- 后续建议：09 下一轮继续对比产品目录广度、Media Kit 下载深度和产品 / 案例销售资料，B41 可优先处理剩余高把握产品候选或 `/products` 缓存边界；仍必须由后台 published 内容承接，前台只负责显示。

## B41 详情页与资料页互动展示器对齐（2026-06-02）

- Code commit: `e5199a2 fix(site): improve sales interaction display`
- Full SHA: `e5199a25c32fc77531a772181df598d346eee80b`
- Vercel deployment: `dpl_TrpW4wLq18VZ28Bx7gn1fj5ZypdV`，状态 `READY`，deployment URL `https://vessel303-giurygfbi-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com`。
- 本轮定位：09 重新对比 300 后台、`en.303vessel.cn` 和 vessel 当前前台后，Wynne 明确纠偏：重点不是继续补产品细节，而是追近 en 站的展示方式、互动节奏和详情页结构。B41 只修显示器问题，不新增前台业务文案、不改后台内容模型、不补产品销售承诺。
- 完成范围：`/products/[slug]` 通用产品详情新增由后台 / CMS 标题驱动的 sticky 锚点导航，锚点覆盖规格、详情模块、Related Products 和 Product Inquiry；`/contact` 去掉表单标题在左侧和表单内重复显示的问题，无备用旧站内容时表单居中；`/media-kit` 从上下堆叠改为资料中心网格 + 右侧 sticky 申请表单；公开产品详情 slug 查询允许后台已发布 `detail_slug` 命中短链接，修复 `/products/v5`、`/products/s5` 这类后台链接线上 404。
- 后台控制边界：所有锚点 label、Contact 表单标题、Media Kit 资源标题和按钮文案仍来自后台 published 内容或 CMS 字段；前台只负责布局、锚点、响应式和路由兼容。未在 TSX 中写入新的销售文案、产品参数、联系方式、下载资料或 CTA 文案。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；构建仅出现本机沙箱 Neon `EACCES` 降级日志和既有 `/global` edge runtime warning，最终退出 0。Vercel READY 后 `npm.cmd run audit:production-links` 通过；线上 `/products/v5`、`/products/s5`、`/products/e7-gen6-flagship`、`/contact`、`/media-kit`、`/global` 均 200，未登录 `/admin` 302 到 `/admin/login`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` 代码 diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 残留风险：线上正文轻量 grep 受响应体读取限制未形成有效证据，但 HTTP、production link audit、本地生产路由和构建均已通过；下一轮 09 应继续用 Chrome 实页对比详情页滚动体验、Media Kit 资料中心视觉节奏和产品目录交互密度。

## B42 产品详情互动显示器二次对齐（2026-06-02）

- Code commit: `edca0d5 fix(products): align detail interaction display`
- Full SHA: `edca0d5a90d255ebbde4e6dbf107c5e6065ae8a4`
- Vercel deployment: `dpl_CU2dPhh6pgfEmUj9SUuN2ZVy27pK`，状态 `READY`，deployment URL `https://vessel303-11fme40nw-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com`。
- 本轮定位：B42 接 B41，继续按 09 对比结论修产品详情“显示器”问题，让 `/products/[slug]` 的浏览节奏更接近 303 产品详情页的 Product Description / Related Products / Consult / Products 互动心智；不新增前台业务文案、不改产品内容模型、不补产品销售承诺。
- 后台内容写入：新增 `scripts/backfill-b42-product-detail-display.mjs`，支持 dry-run / apply；已只补缺失的 `products:ui-labels`，包括 `description-title`、`all-products-label`、`hero-inquiry-cta`，不覆盖运营已编辑 label。
- 前台显示器调整：`CatalogProductDetailContent` 增加后台 label 驱动的 `Product Description` 锚点、sticky 行动区、询盘锚点和 All Products 入口；Related Products 改为横向产品条，更接近 303 产品详情的连续浏览方式。所有可见 label 仍来自后台 published 内容或 CMS 字段，前台只负责布局、锚点、响应式和路由。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；本地构建仅出现沙箱 Neon `EACCES` 降级日志和既有 `/global` edge runtime warning，最终退出 0。Vercel READY 后 `npm.cmd run audit:production-links` 通过；线上 `/products/e7-gen6-flagship`、`/products/v9-gen6-standard`、`/products`、`/global` 均 200，未登录 `/admin` 302 到 `/admin/login`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` 代码 diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：下一轮继续由 09 用 Chrome 实页对比 `en.303vessel.cn` 的产品详情滚动体验、产品目录交互密度、案例详情呈现方式和 Media Kit 资料中心节奏；若是显示器问题交 01，若是后台内容缺失交 02 / 03，继续避免在前台写死业务内容。

## B43 Contact 展示器对齐与可见文案清理（2026-06-02）

- Code commit: `68ae429 fix(contact): align contact hero display` / `68ae429ab5004dc6ffd180088a33a73fd03e102b`。
- Cleanup commit: `47883f9 fix(contact): clean visible module copy` / `47883f978d1efbefc7448a31a29044d0610edf41`。
- Final Vercel deployment: `dpl_9Bkhm7ptGkX4gEagaMMGsfPM5oQr`，deployment URL `https://vessel303-kr7lyjtjz-vessel303.vercel.app`，状态 `READY`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 对比后确认 `/contact` 相比 `en.303vessel.cn/contact.html` 缺少大图视觉冲击和清晰联系方式区域。B43 只修 Contact 显示器和后台 published 内容清理，不在前台写死业务文案，不碰 `/global`。
- 完成范围：`src/components/pages/ContactPageContent.tsx` 读取后台 `contact:hero` image item 并用 `next/image` 渲染为 full-bleed hero 背景；hero proof、联系渠道和表单说明继续来自后台模块或站点配置。`scripts/backfill-b43-contact-display.mjs` 支持 dry-run / apply，只补缺失的 contact hero image / proof items，并清理 `contact:hero`、`contact:channels`、`contact:form` 中遗留的内部说明文案。
- 可见文案清理：`scripts/backfill-b28-contact-closure.mjs` 和 `src/lib/page-modules-db.ts` 中的 contact 默认说明同步改为客户可见口径，避免 `new leads center`、`contact module`、`page source preserved` 等内部说明再次进入前台 published 内容。
- 后台内容写入：B43 backfill 已完成 dry-run / apply，随后复跑 dry-run 显示 `B43 contact display dry-run. No changes needed.`；本轮不删除数据、不覆盖无关运营内容。
- 验收摘要：`git diff --check`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、targeted eslint、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；线上 `/contact` 200 / PRERENDER，HTML 中可见 `homepage_banner-05`，且旧内部短语已清除。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：下一轮继续由 09 对比 `en.303vessel.cn` 的展示方式、互动体验和详情页结构，优先判断差距属于显示器问题还是后台内容缺口；不要再把第一优先级放到产品参数细节堆叠。

## B44 全站浮动联系显示器对齐（2026-06-02）

- Code commit: `7fd2089 feat(site): strengthen floating contact rail`
- Full SHA: `7fd208924e6925be1908ed914004f75e81e427b7`
- Vercel deployment: `dpl_Egy5ntoYb8gsoWhL6TUD8iMHcNho`，状态 `READY`，deployment URL `https://vessel303-onrxxhhnz-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 对比 `en.303vessel.cn` 后确认旧英文站在产品、详情、案例和联系路径中一直有更强的固定联系入口。B44 只修全站浮动联系“显示器”，让非 Global 页面具备更接近 303 的右侧销售联系栏；不新增前台业务文案、不改后台内容来源、不写死联系方式。
- 前台显示器调整：`src/components/FloatingContact.tsx` 从后台 `site:floating-contact` published 模块读取 WhatsApp、Email、Project Inquiry 等配置，并在桌面端渲染为右侧固定联系栏，移动端渲染为底部紧凑操作条。图标、布局和响应式由前台负责；label、号码、邮箱、链接和显示状态继续由后台控制。
- 后台控制边界：所有可见文字、联系方式和 CTA 链接仍来自后台 published 内容或站点配置；前台只负责展示样式、图标映射、链接规范化和响应式，不在 TSX 中写入新的销售文案或联系方式。
- `/global` 边界：`FloatingContact` 继续在 `/global` 路径返回 `null`，不向 Global 注入新站浮动联系栏。本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；线上 `/global` 可见 `View Products` 仍指向 `https://en.303vessel.cn/products_list.html`，`Contact Team` 仍指向 `https://en.303vessel.cn/contact.html`。
- 验收摘要：`git diff --check`、targeted eslint、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；Vercel READY 后线上 `/`、`/products`、`/contact`、`/global` 均 200。Chrome 线上复核确认 `/products` 和 `/contact` 可见右侧浮动联系栏，且 `/global` 不显示该新站浮动栏。
- 后续建议：下一轮继续由 09 对比 `en.303vessel.cn` 的展示方式、互动体验和详情页结构，重点看产品目录侧栏/筛选交互、案例列表与详情的浏览节奏、Media Kit 资料中心节奏，而不是先回到产品参数堆叠。

## B45 案例列表展示器对齐（2026-06-02）
- Code commit: `2fe5e40 fix(cases): align project list display rhythm`
- Full SHA: `2fe5e408db10be2c9ceb9670f1b37db1de505c7e`
- Vercel deployment: `dpl_D8UoJoSvos6jq2zXAAoWtygD2jmy`，状态 `READY`，deployment URL `https://vessel303-p9t6rwsgq-vessel303.vercel.app`，production alias 命中 `https://www.vessel303.com`。
- 本轮定位：09 对比 `en.303vessel.cn/case.html` 后确认，差距主要在案例列表的展示节奏，而不是继续补产品参数。303 案例列表更像“项目编号 + 项目名称 / 类型 / 面积 / 投资 / 采购产品”的商业证明列表，vessel 原 `/cases` 更像普通三列文字卡片。
- 完成范围：`/cases` 从三列卡片改为编号式横向项目行，展示序号、标签、项目图、标题、地点 / 类型、描述和最多 6 个事实块；事实块继续读取 `project_cases` 与 `cases:detail-labels`，前台不新增业务文案、不硬写案例数据。
- 后台控制边界：案例标题、地点、类型、描述、标签、面积、投资、采购产品、数量和图片仍全部来自案例 CMS / 已发布字段；前台只负责展示模板、图片比例、响应式和交互节奏。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd next build --webpack` 均通过；构建仅出现既有 PostgreSQL SSL warning 与 `/global` edge runtime warning。
- 线上检查：`/cases` 200，HTML 已命中新编号式布局并包含 `AstroBase`、`Holiday Planet` 等案例内容；`/cases/astrobase-mamison` 200；未登录 `/admin` 302 到 `/admin/login`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；源码仍保留 Global `View Products` 到 `https://en.303vessel.cn/products_list.html`、`Contact Team` 到 `https://en.303vessel.cn/contact.html` 的旧站例外。
- 后续建议：继续由 09 先对比 `en.303vessel.cn` 和 vessel 前台的展示方式、互动体验、页面节奏，再由 00 拆小包。下一轮优先看案例详情页的商业证明布局、产品目录侧栏 / 筛选交互或 Media Kit 资料中心节奏，而不是直接回到内容堆叠。


## B46 产品详情首屏采购决策区显示器对齐（2026-06-02）

- 代码提交：`6b8d32d` / `6b8d32d79670eb0561a39d1f500c3461565c2523`，`fbbe80e` / `fbbe80ebf629df71d77003f198b46f9cc4c074b7`，`ea26c6e` / `ea26c6ed13dadb86091a02a7fbc983507ae22311`。
- Vercel deployment：`dpl_9GFjAJxckqnH1CwUXTmXk4mDZMA9`，状态 `READY`，deployment URL `https://vessel303-dr4s5e41f-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 对比 300 后台、303 产品详情和 vessel 产品详情后，确认主要差距在产品详情首屏采购决策区的展示节奏。303 更像“缩略图轨道 + 大图 + 右侧 sticky 产品 / 价格 / 商务条款 / Consult 面板”，vessel 原通用详情更像长滚动详情页。B46 只修显示器，不新增前台业务文案、不改后台内容模型、不补销售承诺。
- 前台显示器调整：`CatalogProductDetailContent` 桌面端在多图产品中渲染左侧缩略图轨道、中间大图和右侧 sticky 决策面板；移动端保留横向缩略图；单图产品不保留空缩略图列。右侧面板移除重复长描述，保留产品名、后台事实标签、features、价格展示、Request Quote 和商务条款，并把事实标签 / 商务条款改成紧凑展示。完整 Product Description 仍在下方由 CMS 字段展示。
- 后台控制边界：所有产品名、图片、badge、事实标签、features、价格、商务条款、Request Quote label、All Products label、详情模块和表单 label 仍来自产品 CMS、属性标签和 `products:ui-labels` / `inquiry-form` published 内容；前台只负责布局、缩略图交互、sticky 行为、响应式和显示密度。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links` 均通过；`npx.cmd next build --webpack` 在非沙箱重跑通过，本机沙箱曾因 Neon `EACCES` / Windows build worker 异常失败一次，判定为本机环境限制。Vercel READY 后线上 `/products/e7-gen6-flagship`、`/products`、`/global` 均 200，未登录 `/admin` 302 到 `/admin/login`；Chrome 抽查确认产品详情使用 compact class、右侧面板存在、缩略图 8 个、无横向溢出。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：09 下一轮继续对比产品详情、产品目录、Media Kit 和案例详情的展示方式 / 互动节奏。若差距仍在显示器，交 01；若差距属于后台内容 / 素材缺口，交 02 / 03；不要在前台硬写业务内容。

## B47 产品目录展示节奏提前（2026-06-02）

- Code commit: `3a0e06b fix(products): surface catalog earlier`
- Full SHA: `3a0e06bd5f265084f06a3b5c64e629f98a671acc`
- Vercel deployment: `dpl_9W33eHecBLZGyJ3SLSQ8zCjqhqNY`，状态 `READY`，deployment URL `https://vessel303-btsybogbe-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 对照 `en.303vessel.cn/products_list.html` 和 vessel 线上 `/products` 后确认，当前主要差距不是产品字段，而是产品目录真正开始的位置太靠下。303 产品页更快进入分类、搜索和产品网格；vessel 旧展示先经过 hero、亮点和大图系列区，客户需要滚动更久才进入目录。
- 完成范围：`src/components/pages/ProductsPageContent.tsx` 只调整产品列表显示器。hero 高度和间距压缩；catalog highlights 移入 hero；原独立大图系列区改为目录工作区内的紧凑系列筛选条；搜索和产品网格整体提前。没有新增前台业务文案、产品参数、图片 URL、销售承诺或联系方式。
- 后台控制边界：产品标题、图片、系列、数量、筛选、CTA、结果文案和模块内容继续来自产品 CMS、属性模板和 `products:ui-labels` / page modules published 内容；前台只负责布局、密度、响应式和渲染顺序。后台无内容时前台不补业务文案。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd next build --webpack` 均通过。Vercel READY 后线上 `/products` 200，`/products/e7-gen6-flagship` 200，`/global` 200，未登录 `/admin` 302 到 `/admin/login`。
- Chrome 线上复核：`/products` 无内部词；首个产品入口位于首屏内；搜索表单约在 643px，明显早于旧展示中约 1200px 后才进入目录的节奏；页面无横向溢出。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：继续由 09 对比 `en.303vessel.cn` 与 vessel 的展示方式、互动体感和页面效果。下一轮优先看产品目录侧栏 / 产品卡密度 / Media Kit 资料中心或案例详情节奏；若是显示器问题交 01，若是后台内容或素材缺口交 02 / 03。

## B48 产品目录网格首屏化（2026-06-02）

- Code commit: `fac319b fix(products): move catalog grid into view`
- Full SHA: `fac319b1625a602dc8c09aca050bedc04b2c3bd5`
- Vercel deployment: `dpl_6hJkSYXZa7J8UvzuiZBKbLRpdhc2`，状态 `READY`，deployment URL `https://vessel303-9ms5mtq27-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 继续对比 `en.303vessel.cn/products_list.html` 与 vessel 线上 `/products` 后确认，B47 已经提前目录入口，但真实产品网格仍在搜索区下方偏低。B48 继续只修产品目录显示器，把真实产品卡片进一步推近首屏；不新增前台业务文案、不改产品 CMS 字段、不写死图片 URL 或销售承诺。
- 完成范围：`src/components/pages/ProductsPageContent.tsx` 移除 hero 右侧预览产品图，压缩 hero 与目录区间距；搜索表单和真实产品网格成为首屏内的主要内容；`CatalogHighlights` 与 `SeriesSummary` 移到产品网格之后，避免客户在看到目录前先经过过多说明区。
- 后台控制边界：产品标题、图片、系列、筛选、结果文案、CTA 与页面模块内容继续来自产品 CMS、属性模板和后台 published labels；前台只负责布局密度、模块顺序和响应式。后台无内容时前台不补业务文案。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd next build --webpack` 均通过。Vercel READY 后线上 `/products` 200，`/products/e7-gen6-flagship` 200，`/global` 200，未登录 `/admin` 302 到 `/admin/login`。
- Chrome 线上复核：`/products` 首个真实产品图和产品卡约在 450px 出现，搜索表单约在 301px；页面无内部词、无横向溢出，线上资源命中新部署 `dpl_6hJkSYXZa7J8UvzuiZBKbLRpdhc2`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：继续由 09 对比 `en.303vessel.cn` 与 vessel 的展示方式、互动体感和页面效果。下一轮优先看产品目录侧栏 / 卡片密度、Media Kit 资料中心展示节奏或案例详情商业证明节奏；若是显示器问题交 01，若是后台内容或素材缺口交 02 / 03。

## B49 产品目录工作区密度对齐（2026-06-02）

- Code commit: `2fc1a4e fix(products): tighten catalog workspace`
- Full SHA: `2fc1a4e3f2f39b94f1803a22a6678d61b5e7019f`
- Vercel deployment: `dpl_59QM9bxGmCsuUitCvicPa8za6VAE`，状态 `READY`，deployment URL `https://vessel303-axuiakfib-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 对照 `en.303vessel.cn/products_list.html` 与 vessel 线上 `/products` 后确认，B48 已把真实产品卡推进首屏，但目录工作区仍可继续向 303 的“左侧分类 + 紧凑搜索 + 连续产品网格”靠近。B49 只修产品目录显示器，不新增前台业务文案、不改产品 CMS 字段、不写死图片 URL 或销售承诺。
- 完成范围：`src/components/pages/ProductsPageContent.tsx` 收紧左侧分类和属性筛选间距，把桌面侧栏改为 sticky 工作区；搜索、结果数量和当前筛选合并为一个更紧凑的工具栏；产品卡内容 padding、价格区和按钮间距压缩，产品网格 gap 收紧，整体容器加宽到 `max-w-[1500px]`。
- 后台控制边界：产品标题、图片、系列、筛选、结果文案、CTA 与页面模块内容继续来自产品 CMS、属性模板和后台 published labels；前台只负责布局密度、sticky 行为、响应式和渲染节奏。后台无内容时前台不补业务文案。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd next build --webpack` 均通过。Vercel READY 后线上 `/products` 200，`/products?category=3` 200，`/products/e7-gen6-flagship` 200，`/global` 200，未登录 `/admin` 302 到 `/admin/login`。
- Chrome 线上复核：`/products` 命中新部署 `dpl_59QM9bxGmCsuUitCvicPa8za6VAE`；搜索表单约在 310px，首个真实产品图和产品卡约在 417px，较 B48 的约 450px 进一步提前；页面无内部词、无横向溢出，`lang=en`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：继续由 09 对比 `en.303vessel.cn` 与 vessel 的展示方式、互动体感和页面效果。下一轮优先看 Media Kit 资料中心展示节奏、案例详情商业证明节奏或产品目录筛选互动细节；若是显示器问题交 01，若是后台内容或素材缺口交 02 / 03。

## B50 产品目录 slim catalog header 对齐（2026-06-02）

- Code commit: `67679eb fix(products): compress catalog header`
- Full SHA: `67679ebbfdfbf67e9c1ba7837d7cb98dee8c7405`
- Vercel deployment: `dpl_2qXX3spNcDeDsihrPzEBtmpyDfhX`，状态 `READY`，deployment URL `https://vessel303-ltvexk0p0-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：Chrome 已恢复为较干净的 6 个标签页，并确认 300 / 303 候选页可访问。09 对照 `en.303vessel.cn/products_list.html` 与 vessel 线上 `/products` 后确认，303 产品列表的搜索和产品图更早进入视野；vessel B49 虽已提前到搜索约 310px、首图约 417px，但 hero 仍可继续压缩成更薄的 catalog header。
- 完成范围：`src/components/pages/ProductsPageContent.tsx` 只调整产品目录显示器。产品页 hero 从页面说明区压缩为目录标题条，降低顶部 padding、标题字号、CTA 高度和 route note 密度；目录工作区顶部、搜索表单、结果工具栏和 sticky 侧栏位置继续收紧，让真实产品网格更早出现。
- 后台控制边界：产品标题、图片、系列、筛选、结果文案、CTA 与页面模块内容继续来自产品 CMS、属性模板和后台 published labels；前台只负责布局密度、sticky 位置、响应式和渲染节奏。没有新增前台业务文案、图片 URL、产品参数、销售承诺或联系方式。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd next build --webpack` 均通过；build 仅出现既有 PostgreSQL SSL warning、本机 Neon `EACCES` 降级日志和 `/global` edge runtime warning，最终退出码 0。Vercel READY 后线上 `/products`、`/products?category=3`、`/products/e7-gen6-flagship`、`/global` 均 200，未登录 `/admin` 302 到 `/admin/login`。
- Chrome 线上复核：`/products` 命中新部署 `dpl_2qXX3spNcDeDsihrPzEBtmpyDfhX`；搜索表单约在 252px，首个真实产品图和产品卡约在 345px，较 B49 的约 310px / 417px 进一步提前；页面无内部词、无横向溢出，`lang=en`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：继续由 09 对比 `en.303vessel.cn` 与 vessel 的展示方式、互动体感和页面效果。下一轮优先看 Media Kit 资料中心展示节奏、案例详情商业证明节奏或产品筛选互动细节；若是显示器问题交 01，若是后台内容或素材缺口交 02 / 03。

## B51 案例详情首屏商业证明对齐（2026-06-02）

- Code commit: `c28cce9 fix(cases): surface case proof earlier`
- Full SHA: `c28cce9aabe2268f2451129e7eccf14ec842b091`
- Vercel deployment: `dpl_H7ktXxdwH1TaUfHKLT1PxZssuSfr`，状态 `READY`，deployment URL `https://vessel303-i2o6hf5p9-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 对比 `en.303vessel.cn` 的案例详情页后确认，303 案例详情会在首屏直接给出项目名称、项目类型、地址、采购型号、数量等商业证明；vessel 案例详情原来被大图挤压，商业证明区在约 1292px 后才出现。B51 只修案例详情显示器，不新增前台业务文案，不改 `/global`。
- 前台显示器调整：`CaseDetailPageContent` 将案例标题、简介和后台事实字段提前到首屏左侧，图片保留在右侧；事实卡继续读取 `project_cases` 与 `cases:detail-labels`，前台只调整布局、密度和响应式，不写死案例数据。
- 后台内容修正：新增 `scripts/backfill-b51-case-detail-proof.mjs`，支持 dry-run / apply。经 Wynne 明确授权后，已清除 `astrobase-mamison` 生产后台中错误的 `Japan/Yamanashi` 商业证明字段，并把英文标签归回 `Russia`；复跑 dry-run 显示 `No B51 changes needed.`。同步修正 `scripts/backfill-b38-catalog-faq.mjs`，防止旧样板再次把 AstroBase 写成日本山梨。
- 验收摘要：`git diff --check`、targeted eslint、`npx.cmd tsc --noEmit`、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd next build --webpack` 均通过。构建仅出现既有 PostgreSQL SSL warning、本地 Neon `EACCES` 降级日志和 `/global` edge runtime warning，最终退出码 0。
- 线上检查：`/cases/astrobase-mamison` 200，`/cases` 200，`/global` 200，未登录 `/admin` 302 到 `/admin/login`。Chrome 线上复核确认 `/cases/astrobase-mamison` 的 H1 约 198px、首个商业事实约 352px，`Yamanashi` / `PROJECT AREA Japan` 不再出现，页面无内部词、无横向溢出，`lang=en`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：继续由 09 对比 `en.303vessel.cn` 与 vessel 的展示方式、互动体感和页面效果。下一轮优先看 Media Kit 资料中心节奏、案例详情图库 / 询盘位置，或产品筛选交互细节；若属于显示器问题交 01，若属于后台内容或素材缺口交 02 / 03。

## B52 Media Kit 资料中心资源预览卡对齐（2026-06-02）

- Code commit: `ef4251b fix(media-kit): add resource preview cards`
- Full SHA: `ef4251b55ee092ed763209dee5e206e8bce50a7a`
- Vercel deployment: `dpl_8nPpUXvn5LNXSAHHtrFzsAxsLLJK`，状态 `READY`，deployment URL `https://vessel303-gv69222ls-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 对比 300 / 303 / vessel 后确认，`/media-kit` 已有后台 published 资源，但线上展示仍偏文字列表，缺少 303 式可扫读的资料卡节奏。B52 只修 Media Kit 显示器，不写入新资源内容，不改后台数据，不改 `/global`。
- 前台显示器调整：`src/components/pages/MediaKitPageContent.tsx` 让每个后台资源卡优先渲染 `cover_image_url` 或图片型 `file_url`，无图片时渲染 PDF / IMAGE / LINK 类型预览卡；标题、摘要、按钮文案和资源链接继续来自后台 published 资源字段或页面模块 label。
- 后台控制边界：资料标题、摘要、文件 URL、封面图、CTA 文案、表单 labels 均继续由 B9 Media Kit CMS / page modules 控制；前台只负责卡片布局、图片预览、文件类型视觉提示、响应式和可访问结构。后台无资源时，前台不补业务文案。
- 验收摘要：`git diff --check`、targeted eslint、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；构建仅出现既有 PostgreSQL SSL warning、本地 Neon `EACCES` 降级日志和 `/global` edge runtime warning。
- 线上检查：`/media-kit` 200 / PRERENDER，`/global` 200，未登录 `/admin` 302。Chrome 线上复核确认 `/media-kit` 有 16 个资源 article、8 个资源图片预览、16 个文件类型预览，表单字段为 `name/email/phone/company/country/useCase/message`，无内部词、无横向溢出，`lang=en`。
- `/global` 边界：本轮代码 diff 仅涉及 `src/components/pages/MediaKitPageContent.tsx`，无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：继续由 09 对比 `en.303vessel.cn` 与 vessel 的展示方式、互动体感和页面效果。下一轮优先看 Media Kit 资源内容深度、案例详情图库 / 询盘位置，或产品筛选交互细节；若是显示器问题交 01，若是后台内容或素材缺口交 02 / 03。

## B53 Media Kit 资源预览图片优化（2026-06-02）

- 代码提交：`3a25d69 fix(media-kit): optimize resource previews`，full SHA `3a25d69ab8c6687ace4ea026310ae7567f9a8e40`。
- Vercel deployment：`dpl_J8ri316xU9THc86gQwiNeQCJCSAD`，状态 `READY`，deployment URL `https://vessel303-fxpmfd5me-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：B52 已让 `/media-kit` 资源从文字列表变成资料中心卡片，但图片型资源仍用普通 `<img>` 直出。B53 只修 Media Kit 显示器的图片加载方式，不写入新资源内容，不改后台数据，不改 `/global`。
- 前台显示器调整：`src/components/pages/MediaKitPageContent.tsx` 的资源预览图改为使用 `ProtectedImage`，设置固定 `aspect-[4/3]` 与 `sizes`，让可预览图片进入 Next image 优化链路；PDF / LINK 类型预览卡保持不变。
- 后台控制边界：资源标题、摘要、文件 URL、封面图、CTA 文案和表单 labels 继续由 B9 Media Kit CMS / page modules 控制；前台只负责图片渲染、比例、响应式和保护层，不补业务文案、不改资源链接。
- 验收摘要：`git diff --check`、targeted eslint、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd next build --webpack` 和 build 后 `npx.cmd tsc --noEmit` 均通过；首次 `tsc --noEmit` 因 `.next/types` 尚未生成失败，build 生成类型后重跑通过。
- 线上检查：`/media-kit` 200 / PRERENDER，`/global` 200，未登录 `/admin` 302；线上 HTML 抽查确认 Media Kit 图片资源输出 `/_next/image?...` 优化路径，`lang=en`，无内部词。
- `/global` 边界：本轮代码 diff 仅涉及 `src/components/pages/MediaKitPageContent.tsx`，无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保留。
- 后续建议：继续由 09 对比 `en.303vessel.cn` 与 vessel 的展示方式、互动体感和页面效果。下一轮优先看 Media Kit 资源内容深度、案例详情图库 / 询盘位置，或产品筛选交互细节；若是显示器问题交 01，若是后台内容或素材缺口交 02 / 03。

## B54 非 Global 主站旧站 CTA 收口（2026-06-02）

- 代码提交：`09b1f24 fix(site): keep primary ctas on new site`，full SHA `09b1f24ac9cf8c57020c52fb99f320b61f2e1fc5`。
- Vercel deployment：`dpl_E3x79Daa4aKi2NjvvzU3DT6NtjAt`，状态 `READY`，deployment URL `https://vessel303-n60nyu4hl-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：09 对比 `en.303vessel.cn`、300 后台和 vessel 线上后确认，非 Global 主站壳层仍有部分后台 published CTA / Footer / 首页 / 产品页链接指向旧站 `en.303vessel.cn/products_list.html` 或 `contact.html`。B54 只修显示器的链接规范化，让非 Global 主站 CTA 回到新站闭环；不新增前台业务文案，不改后台 published 内容，不改 `/global`。
- 完成范围：`Navbar`、`Footer`、`HomePageContent`、`ProductsPageContent` 的客户可点击链接统一通过 `normalizeSiteHref` 规范化；后台仍然决定 label、排序、显示状态和原始 href，前台只把旧站产品 / 联系 URL 在非 Global 场景映射到新站 `/products` 或 `/contact`。
- `/global` 边界：本轮没有修改 `/global`、MapLibre、MapTiler 或 `/api/map`；Global Contact / Products 继续保留旧 303 跳转例外。
- 验收摘要：`git diff --check`、targeted eslint、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack`、`npm.cmd run audit:production-links` 均通过；线上 `/`、`/products`、`/global` 均 200。
- 后续建议：继续由 09 做展示差距对比。下一轮优先检查非 Global 主站是否仍有旧站依赖、产品筛选交互细节、Media Kit 资料内容深度或案例详情图库 / 询盘位置；仍按“显示器问题交 01，后台内容或素材缺口交 02 / 03”的规则推进。

## B55 非 Global published CTA 服务端收口（2026-06-02）

- 代码提交：`988d884 fix(site): normalize published CTA links`，full SHA `988d884c29d2650c9ff6e7ef7b686ee8fd7249fe`。
- Vercel deployment：`dpl_GqGQDReEiGowoWArojtzf8gLWYFD`，状态 `READY`，deployment URL `https://vessel303-ipcwypa80-vessel303.vercel.app`，production alias 包含 `https://www.vessel303.com` 和 `https://vessel303.com`。
- 本轮定位：B54 已修客户可点击链接，但 09 / 05 复核线上 `/products` HTML / RSC 时发现旧 303 产品 / 联系 URL 仍会从后台 published page modules 被服务端序列化出来。B55 继续按“后台是控制器、前台是显示器”的边界，只修公开 published 数据出站规范化，不新增前台业务文案，不改后台原始内容。
- 完成范围：`src/lib/page-modules-db.ts` 在 `listPublishedPageModules` / `getPublishedPageModule` 公开读取边界归一化旧 303 产品 / 联系 href；admin 原始列表、草稿和后台编辑仍保留原始 href，`contact:backup` 旧站备用入口保留。`src/components/pages/ProductsPageContent.tsx` 的 breadcrumb home href 同步走展示层规范化。`scripts/audit-production-links.mjs` 增强为扫描 HTML body 中的旧站 URL，不只检查 `href=`。
- `/global` 边界：本轮无 `/global`、MapLibre、MapTiler 或 `/api/map` diff；Global Contact / Products 旧 303 跳转例外继续保持，不套用主站新站闭环规则。
- 验收摘要：`git diff --check`、targeted eslint、`npm.cmd run audit:public-content`、`npm.cmd run audit:published-content`、`npm.cmd run audit:production-links`、`npx.cmd tsc --noEmit`、`npx.cmd next build --webpack` 均通过；构建仅出现既有 PostgreSQL SSL warning、本地 Neon `EACCES` 降级日志和 `/global` edge runtime warning。Vercel READY 后线上 `/products`、`/contact`、`/global` 均 200，未登录 `/admin` 302 到 `/admin/login`，增强后的 `audit:production-links` 通过。
- 后续建议：继续由 09 做展示差距对比。下一轮优先看非 Global 主站的展示方式和互动体感，不再只看可点击 href；若属于显示器问题交 01，若属于后台内容、素材或字段缺口交 02 / 03。
## B56 Homepage floating contact display alignment (2026-06-02)

- Code commit: `2157b40 fix(site): compact floating contact rail`
- Full SHA: `2157b40efab6d639549ebfea8fee4a9246e3a909`
- Vercel deployment: `dpl_GeeGiVXqc38nRVSXVS9BvSLvU4FS`
- Deployment URL: `https://vessel303-j6u0ewvpi-vessel303.vercel.app`
- Status: `READY`
- Production aliases include `https://www.vessel303.com` and `https://vessel303.com`.
- Scope: B56 was a display-only fix for the main-site floating contact rail after 09 comparison found that the desktop floating contact block could overlap the homepage hero proof cards. No backend content, labels, contact values, CTA hrefs, images, or business copy were changed.
- Frontend display change: `FloatingContact` now renders the desktop rail as compact 44px icon buttons with hover/focus tooltips, closer to the narrow 303 right-side contact rail. Tablet and mobile continue to use the bottom action bar. The homepage proof-card column reserves right-side space on large screens.
- Backend-control boundary: all visible labels, WhatsApp number, email, project inquiry label and links still come from backend published `site:floating-contact` configuration. The frontend only controls layout, icon mapping, responsive behavior and hover presentation.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. `FloatingContact` still returns `null` for `/global`; Global Contact / Products old 303 exception remains out of scope.
- Validation: `git diff --check`, targeted eslint, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, `npx.cmd tsc --noEmit`, and `npx.cmd next build --webpack` passed. Build logs only showed existing PostgreSQL SSL warnings, local Neon sandbox `EACCES` fallback logs, and the known `/global` edge-runtime warning.
- Online checks: `/`, `/products`, `/contact`, `/global` returned 200 after Vercel READY. Browser measurement on `https://www.vessel303.com/` confirmed the desktop floating rail width is 44px; actual hero proof cards end at x=1162 while the floating rail starts at x=1214, leaving about 52px of visual clearance. `/global` had no floating-contact component injected.
- Note: an in-app browser mobile viewport probe reported a likely tool-min-width artifact (`innerWidth=390` with layout width around 466). No code change was made for that measurement because the visible overflow source matched the tool viewport minimum rather than the B56 floating-contact change.
- Next step: 09 should continue comparing display effect, interaction style and page rhythm against `en.303vessel.cn`, prioritizing visible display gaps over content-detail accumulation. If a gap is a display-template issue, assign 01; if it is backend content, material or field completeness, assign 02 / 03.

## B58 Product detail gallery display alignment (2026-06-02)

- Code commit: `f7d0560 fix(products): add gallery section to detail pages`
- Full SHA: `f7d056038bf758dbc23425d99841d9d22cf8d627`
- Vercel deployment: `dpl_8PyZJrZ7gNy8LJGkeM7iRYvXUNR2`
- Deployment URL: `https://vessel303-ef14gqwea-vessel303.vercel.app`
- Status: `READY`
- Scope: B58 was a display-template fix for CMS product detail pages after 09 comparison found that `en.303vessel.cn` product details carry a stronger product-brochure gallery rhythm. No product copy, image URL, product parameter, contact value, sales promise, or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `CatalogProductDetailContent` now renders a `product-gallery` section from the product CMS image/gallery array, using one larger image plus compact supporting thumbnails before specifications and description. The section title comes from backend `products:ui-labels` as `gallery-title`.
- Backend support: `scripts/backfill-b58-product-gallery-label.mjs` added the missing published `Product Gallery` label to `products:ui-labels`; `scripts/backfill-b37-sales-depth.mjs` was updated so future B37 backfills keep that label.
- Backend-control boundary: product images still come from product CMS `image` / `gallery`; visible section text still comes from published labels. The frontend only controls layout, image ratio, responsive grid behavior, and anchor placement.
- Validation: `git diff --check`, targeted eslint, `audit:public-content`, `audit:published-content`, `audit:production-links`, `tsc --noEmit`, and `next build --webpack` passed. Build logs only showed existing PostgreSQL SSL warnings, local Neon sandbox `EACCES` fallback logs, and the known `/global` edge-runtime warning.
- Online checks: `/products/e7-gen6-flagship?lang=en`, `/products?lang=en`, and `/global` returned 200 after Vercel READY. The product detail HTML contains `id="product-gallery"` and `Product Gallery`; main product pages did not expose old 303 product/contact links.
- `/global` boundary: no `/global`, MapLibre, MapTiler, or `/api/map` diff. The Global old 303 Contact / Products exception remains out of scope for B58.
- Next step: 09 should continue comparing display effect, interaction style and page rhythm against `en.303vessel.cn`, prioritizing product detail visual rhythm, case-detail browsing rhythm, and Media Kit resource-center behavior over adding more raw content.

## B59 Product detail buyer resources hero alignment (2026-06-02)

- Code commit: `a17acc7 fix(products): surface buyer resources in detail hero`
- Full SHA: `a17acc7705c64a6518d45a487076f53ca76f60de`
- Vercel deployment: `dpl_H8xyW6R2ezeRSRmc2BjcZMRJor3j`
- Deployment URL: `https://vessel303-43pf2rak3-vessel303.vercel.app`
- Status: `READY`
- Scope: B59 was a product-detail display-template fix after 09 comparison confirmed that the remaining gap was buyer action timing: backend-published buyer downloads existed, but customers reached them too late in the long product detail flow. No product copy, file URL, image URL, contact value, sales promise, or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `CatalogProductDetailContent` now surfaces up to three backend-published buyer resource links in the hero decision panel, before the longer gallery/specification/detail sections. The preview is limited to detail modules whose id or title indicates buyer/download/resource/material content.
- Backend-control boundary: the section title still comes from backend `products:ui-labels` (`downloads-title`), and every resource title, body and href comes from product CMS `detail_modules`. The frontend only controls extraction, placement, card styling, and internal/external link rendering.
- Validation: `git diff --check`, targeted eslint, `audit:public-content`, `audit:published-content`, `audit:production-links`, `tsc --noEmit`, and `next build --webpack` passed. Build logs only showed existing PostgreSQL SSL warnings, local Neon sandbox `EACCES` fallback logs, and the known `/global` edge-runtime warning.
- Online checks: Vercel reached `READY`; `/products/e7-gen6-flagship?lang=en`, `/products?lang=en`, and `/global` returned 200, and unauthenticated `/admin` redirected to `/admin/login`. The product detail HTML now places `Buyer Downloads` at text position 639 and `Request E7 buyer pack` at 729, before `Product Gallery`, `Specifications`, and `Product Inquiry`.
- `/global` boundary: no `/global`, MapLibre, MapTiler, or `/api/map` diff. The Global old 303 Contact / Products exception remains out of scope for B59.
- Next step: 09 should continue comparing visible display effect and interaction rhythm against `en.303vessel.cn`, especially product detail scroll rhythm, case-detail gallery/inquiry position, and Media Kit resource-center depth. Display-template gaps go to 01; backend content, material, file and field gaps go to 02 / 03; performance/image regressions go to 07.

## B61 Case list visual gallery alignment (2026-06-02)

- Code commit: `0c70a28 fix(cases): make case list more visual`
- Full SHA: `0c70a28bffba7e8ad98eb0fb9e340669e0102e26`
- Vercel deployment: `dpl_Fw3KzFBjVer73kUv1p53bFwukwam`
- Deployment URL: `https://vessel303-k3j9vo0tj-vessel303.vercel.app`
- Status: `READY`
- Scope: B61 was a display-template fix for `/cases` after 09 comparison found that the vessel case list still felt less visual than the 303 project gallery rhythm. No case title, location, proof field, tag, image URL, CTA copy, sales promise, backend content, or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `CasesPageContent` now renders the case list as an image-first responsive gallery. The first published case is featured wider on desktop, each case card uses the CMS cover image as the primary visual, overlays the existing CMS tags/type/index, and keeps CMS-sourced location, description and commercial facts in the lower content area.
- Backend-control boundary: case names, images, locations, project types, descriptions, tags, area, investment, products, units and detail labels still come from `project_cases` and published `cases:detail-labels`. The frontend only controls layout, image ratio, responsive grid behavior, hover treatment and the icon-only affordance.
- Validation: `git diff --check`, targeted eslint for `src/components/pages/CasesPageContent.tsx`, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, `npx.cmd tsc --noEmit`, and `npx.cmd next build --webpack` passed. Build logs only showed existing PostgreSQL SSL warnings, local Neon sandbox `EACCES` fallback logs, Auth.js local `UntrustedHost`, and the known `/global` edge-runtime warning.
- Local check: production `next start` on port `3177` returned `/cases?lang=en` 200 / prerender cache hit. Chrome extension DOM check confirmed `lang=en`, 8 visible case cards, first card image present, no horizontal overflow, no bad arrow, and no internal words.
- Online checks: Vercel reached `READY`; `https://www.vessel303.com/cases?lang=en&b61=0c70a28`, `https://www.vessel303.com/cases/astrobase-mamison?lang=en&b61=0c70a28`, and `https://www.vessel303.com/global?b61=0c70a28` returned 200. Unauthenticated `/admin` redirected to `/admin/login`. Online HTML scan found no `Codex`, `B61`, internal owner text, bad arrow, `Japan`, or `Yamanashi` in the checked case paths.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. Global Contact / Products old 303 exception remains out of scope for B61.
- Next step: 09 should compare the updated `/cases` gallery against `en.303vessel.cn/case.html` and then choose the next visible display gap. Likely candidates are case detail gallery/inquiry rhythm, product detail scroll rhythm, or product catalog interaction density. Backend content and material gaps should still go to 02 / 03; performance/image regressions go to 07.

## B63 Case detail immersive display alignment (2026-06-02)

- Code commit: `140ec42 fix(cases): make case detail more immersive`
- Full SHA: `140ec42de44d7ab54c98a33d851d4ed40e076221`
- Vercel deployment: `dpl_9fDk2z6mM1ZJodGavpPnTAmgPauz`
- Deployment URL: `https://vessel303-6e0gw06mb-vessel303.vercel.app`
- Status: `READY`
- Scope: B63 was a display-template fix for case detail pages after 09 comparison found that `/cases/astrobase-mamison` still felt like an information panel, while the 303 project flow uses stronger hero imagery, gallery rhythm and project proof. No case title, case copy, proof value, image URL, CTA copy, sales promise, backend content or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `CaseDetailPageContent` now renders a full-bleed image hero, overlays existing CMS tags/name/description, surfaces existing commercial facts in the hero, moves the gallery into an image-first dark section, then presents proof facts in a clearer numbered grid before the inquiry section.
- Backend-control boundary: all visible case content still comes from `project_cases` and published `cases` page modules. The frontend only controls layout, image ratio, responsive behavior, dark/light presentation, gallery placement and anchor placement.
- Validation: `git diff --check`, targeted eslint for `src/components/pages/CaseDetailPageContent.tsx`, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, `npx.cmd tsc --noEmit`, and `npx.cmd next build --webpack` passed. Build logs only showed existing PostgreSQL SSL warnings, local Neon sandbox `EACCES` fallback logs, and the known `/global` edge-runtime warning.
- Online checks: Vercel reached `READY`; `https://www.vessel303.com/cases/astrobase-mamison`, `https://www.vessel303.com/cases`, and `https://www.vessel303.com/global` returned 200. Unauthenticated `/admin` redirected to `/admin/login`. Online HTML scan confirmed `case-gallery` and `case-inquiry` are present, while `Japan`, `Yamanashi`, `Codex`, `B63`, internal owner text and the bad arrow glyph were absent.
- Performance smoke: online curl timing was about `0.17s` total for the case detail page and `0.16s` total for the case list. `/global` remained 200 and was not modified.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. Global Contact / Products old 303 exception remains unchanged.
- Next step: 09 should compare the updated case detail page against `en.303vessel.cn` project browsing rhythm and then choose the next visible display gap. Likely candidates are product catalog interaction density, product detail scroll rhythm, or Media Kit resource-center depth. Display-template gaps go to 01; backend content/material/field gaps go to 02 / 03; performance/image regressions go to 07.

## B64 Media Kit primary resource display alignment (2026-06-02)

- Code commit: `2f8f120 fix(media-kit): feature primary resource card`
- Full SHA: `2f8f120f34b9173c5eaa0b0255e048a7c37bf446`
- Vercel deployment: `dpl_5Zb16zCkHdzkHeZKZizRWqUHSoTx`
- Deployment URL: `https://vessel303-olrxzhloj-vessel303.vercel.app`
- Status: `READY`
- Scope: B64 was a display-template fix for `/media-kit` after 09 comparison found that the page had backend-published resources but still read like a plain request form instead of a stronger resource-center entry. No media resource title, file URL, image URL, contact value, CTA copy, sales promise, backend content or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `MediaKitPageContent` now derives resource entries from published Media Kit CMS records, features the first resource as a larger visual card, renders remaining resources as compact cards, and keeps the request form as the right-side action panel.
- Backend-control boundary: all visible resource titles, summaries, CTA labels, file URLs, cover images and form labels still come from published Media Kit CMS records and `media-kit` page modules. The frontend only controls card hierarchy, image ratio, responsive grid behavior and link rendering.
- Validation: `git diff --check`, targeted eslint for `src/components/pages/MediaKitPageContent.tsx`, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, `npx.cmd tsc --noEmit`, and `npx.cmd next build --webpack` passed. Build logs only showed existing PostgreSQL SSL warnings, local Neon sandbox `EACCES` fallback logs, and the known `/global` edge-runtime warning.
- Online checks: Vercel reached `READY`; `https://www.vessel303.com/media-kit?lang=en` returned 200 and the page HTML was served from deployment `dpl_5Zb16zCkHdzkHeZKZizRWqUHSoTx`. Unauthenticated `/admin` redirected to `/admin/login`. Online HTML confirmed published Media Kit resources and no `Codex`, `B64`, internal owner text or 300-alignment notes.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. Global Contact / Products old 303 exception remains unchanged.
- Next step: 09 should compare the updated Media Kit resource-center rhythm against `en.303vessel.cn` and then choose the next visible display gap. Likely candidates are product catalog interaction density, product detail scroll rhythm, or Contact / FAQ purchase-flow rhythm. Display-template gaps go to 01; backend content/material/file gaps go to 02 / 03; performance/image regressions go to 07.

## B65 Contact purchase-flow display alignment (2026-06-02)

- Code commit: `9ff4f3f fix(contact): pair inquiry form with purchase faq`
- Full SHA: `9ff4f3fdabeae6bfa84cb180b833df6c2d42fbe0`
- Vercel deployment: `dpl_wuyG74J31DiAULHNXt4dduY6uPEe`
- Deployment URL: `https://vessel303-k1o356b4i-vessel303.vercel.app`
- Status: `READY`
- Scope: B65 was a Contact display-template fix after 09 comparison found that `/contact` still behaved too much like a single form page, while the 303 contact flow keeps procurement support and inquiry action visible together. No contact copy, FAQ text, form label, phone, email, WhatsApp value, image URL, CTA copy, sales promise, backend content or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `ContactPageContent` now pairs the backend-published procurement FAQ panel with the contact inquiry form in the main form section, keeps the form sticky on desktop, and moves only overflow FAQ items into a lower secondary grid.
- Backend-control boundary: the FAQ panel title and description still come from `page_modules:contact/faq-panel`; form text and labels still come from `page_modules:contact/form`; question and answer content still comes from published FAQ CMS items. The frontend only controls placement, card rhythm, responsive grid behavior and sticky form timing.
- Validation: `git diff --check`, targeted eslint for `src/components/pages/ContactPageContent.tsx`, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, serial `npx.cmd tsc --noEmit`, and `npx.cmd next build --webpack` passed. The first parallel `tsc` run failed because `next build` was rebuilding `.next/types` at the same time; the serial rerun passed.
- Online checks: Vercel reached `READY`; `https://www.vessel303.com/contact?lang=en&b65=9ff4f3f` returned 200 and was served from deployment `dpl_wuyG74J31DiAULHNXt4dduY6uPEe`; `/faq?lang=en` returned 200; `/global` returned 200; unauthenticated `/admin` redirected to `/admin/login`. Online Contact HTML contains `Procurement FAQ` and published FAQ CMS data.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. Global Contact / Products old 303 exception remains unchanged.
- Next step: 09 should compare the updated Contact purchase-flow rhythm against `en.303vessel.cn/contact.html`. Likely next visible display candidates are product catalog interaction density, product detail scroll rhythm, and homepage/product-entry sales rhythm. Display-template gaps go to 01; backend content/material/file gaps go to 02 / 03; performance/image regressions go to 07.

## B66 Homepage sales rhythm tightening (2026-06-03)

- Code commit: `b373c33 fix(home): tighten homepage sales rhythm`
- Full SHA: `b373c33aaa7e55b911dc1ec35f63e3dbc2a203d8`
- Vercel deployment: `dpl_CeTinNDpN5sKUVDqifw9L9KtiF9z`
- Deployment URL: `https://vessel303-mqveayvg7-vessel303.vercel.app`
- Status: `READY`
- Scope: B66 was a homepage display-template fix after 09/00 confirmed that the first-screen rhythm still felt too far from `en.303vessel.cn`: the hero occupied too much vertical space and delayed the product section. No homepage copy, image URL, CTA label, contact value, product fact, backend content, or `/global` behavior was added in the frontend.
- Frontend display change: `HomePageContent` now uses a shorter capped hero height, tighter hero spacing, mobile-safe headline wrapping, stronger secondary CTA visibility, denser proof-card treatment, and reliable dark/light section backgrounds so the product families section appears earlier and remains readable.
- Backend-control boundary: all visible homepage text, images, CTA labels, links, proof values and product-card content still come from published Home page modules and site configuration. The frontend only controls layout rhythm, color rendering, responsive spacing, button contrast and text wrapping.
- Validation: `git diff --check`, targeted eslint for `src/components/pages/HomePageContent.tsx`, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, `npx.cmd tsc --noEmit`, and `npx.cmd next build --webpack` passed. Build logs only showed existing PostgreSQL SSL warnings and the known `/global` edge-runtime warning.
- Online checks: Vercel reached `READY`; `https://www.vessel303.com/?lang=en`, `/products`, `/contact`, and `/global` returned 200. Online homepage screenshot confirmed the product section now enters the desktop first-screen capture after the hero/proof band instead of being delayed by a full-height hero.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. Global Contact / Products old 303 exception remains unchanged.
- Next step: 09 should compare the updated homepage against `en.303vessel.cn` again. If the gap is still visual rhythm or interaction, assign 01; if the gap is missing homepage content, product material or media, assign 02 / 03; if image weight or click feel regresses, assign 07.

## B67 Mobile homepage sales rhythm compaction (2026-06-03)

- Code commit: `c126e73 fix(home): compact mobile sales rhythm`
- Full SHA: `c126e732e64df2884cc9a9a1145518cab5ab86b3`
- Online serving evidence: `https://www.vessel303.com/?lang=en`, `/products`, `/contact`, and `/global` returned 200 from Vercel; unauthenticated `/admin` redirected through `/admin/login`. Response headers referenced deployment asset tag `dpl_9CoreNn8TdZwRQ4DV7p7xVL8C3Rv`. The Vercel MCP deployment-list tool was unavailable in this run, so READY was not independently read through MCP.
- Scope: B67 was a homepage display-template adjustment after 09/00 found that mobile still spent too much vertical space on hero/proof/credentials before showing product content. No homepage copy, image URL, CTA label, contact value, product fact, backend content, module order, or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `HomePageContent` now compacts the mobile hero height and spacing, hides the next-slide preview below `sm`, lays proof cards in a tighter three-column mobile grid, hides the fourth proof item until desktop, and compresses the credentials bar on mobile so the product systems section enters the early scroll sooner.
- Backend-control boundary: all visible homepage text, images, CTA labels, links, proof values and product-card content still come from published Home page modules and site configuration. The frontend only controls responsive layout rhythm, spacing, card density and mobile visibility.
- Validation: `git diff --check`, targeted eslint for `src/components/pages/HomePageContent.tsx`, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, `npx.cmd tsc --noEmit`, and `npx.cmd next build --webpack` passed. Build logs only showed existing PostgreSQL SSL warnings and the known `/global` edge-runtime warning.
- Visual check: local desktop and mobile screenshots confirmed the desktop rhythm remained stable and the mobile product systems section now appears directly after the compacted hero/proof/credentials area instead of being delayed by a taller first screen.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. Global Contact / Products old 303 exception remains unchanged.
- Next step: 09 should run another visual comparison of the live homepage against `en.303vessel.cn`. If the next gap is still mobile/desktop display rhythm or interaction, assign 01; if it requires different homepage content, product imagery, or proof assets, assign 02 / 03; if image weight or click feel regresses, assign 07.

## B68 Homepage hero visual impact alignment (2026-06-03)

- Code commit: `9dd0ae5 fix(home): strengthen hero visual impact`
- Full SHA: `9dd0ae5fc02ae97df94a34713bc5d8ae6c129be2`
- Vercel deployment: `dpl_5s4CcKXiuFfDsrU1eiHgEdbCLXAx`
- Deployment URL: `https://vessel303-42tfkvas5-vessel303.vercel.app`
- Status: `READY`
- Scope: B68 was a homepage display-template fix after 09 comparison found that `en.303vessel.cn` leads with a centered full-bleed real-scene hero, while vessel303 still read too much like a dark information panel. No homepage copy, image URL, CTA label, contact value, product fact, backend content, module order, or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `HomePageContent` now reduces the hero overlay strength, centers the backend-published hero headline/subtitle/CTA stack, adds text shadow for readability, renders the next-slide control as a backend-image thumbnail preview, and avoids an empty proof-card column when fewer than four proof items are available.
- Backend-control boundary: all visible homepage text, images, CTA labels, links, proof values and product-card content still come from published Home page modules and site configuration. The frontend only controls visual alignment, overlay strength, carousel preview treatment, responsive proof-grid columns and text contrast.
- Validation: `git diff --check`, targeted eslint for `src/components/pages/HomePageContent.tsx`, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, `npx.cmd tsc --noEmit`, and `npx.cmd next build --webpack` passed. The first build attempt failed in sandbox because Google Fonts fetch was blocked; the approved network rerun passed. Build logs only showed existing PostgreSQL SSL warnings and the known `/global` edge-runtime warning.
- Online checks: Vercel reached `READY`; `https://www.vessel303.com/?lang=en&b68=9dd0ae5` returned 200 after naked-domain redirect, `/global?b68=9dd0ae5` returned 200, and unauthenticated `/admin` redirected to `/admin/login`. Online desktop Chrome screenshot confirmed the hero now uses the real-scene image as the dominant first-screen visual, with centered title/CTAs, one thumbnail next-slide preview, three proof boxes and no horizontal overflow.
- Mobile limitation: this run could not capture a mobile viewport because the current Chrome extension tab remained at 1920 px after a resize attempt. Mobile behavior was not visually verified in B68 and should be rechecked by 09 / 07 when a viewport-capable browser path is available.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. Global Contact / Products old 303 exception remains unchanged.
- Next step: 09 should recompare the live homepage against `en.303vessel.cn`, with emphasis on mobile hero readability and whether the desktop proof strip should stay in the first screen or move lower. If the next gap is display rhythm, assign 01; if it requires different homepage content or imagery, assign 02 / 03; if mobile or image performance regresses, assign 07.

## B69 Homepage hero proof strip lightening (2026-06-03)

- Code commit: `e72bce2 fix(home): lighten hero proof strip`
- Full SHA: `e72bce27e3abd3c36b48d1ea44c5782cdef32e14`
- Vercel deployment: `dpl_4inumfUYAqz36KdacmfxgPJV4vcu`
- Deployment URL: `https://vessel303-hvq3byrm4-vessel303.vercel.app`
- Status: `READY`
- Scope: B69 was a homepage display-template fix after 09 comparison found that vessel303 was now close to the `en.303vessel.cn` full-bleed hero rhythm, but the desktop proof strip still felt too heavy in the first screen. No homepage copy, image URL, CTA label, contact value, product fact, backend content, module order, or `/global` behavior was hardcoded in the frontend.
- Frontend display change: `HomePageContent` now caps the desktop hero proof strip width, slightly reduces proof-card padding and number size, and clamps proof body text more tightly on desktop so the first screen keeps the backend proof content while feeling less like a large information panel.
- Backend-control boundary: all visible homepage text, images, CTA labels, links, proof values and product-card content still come from published Home page modules and site configuration. The frontend only controls proof strip width, spacing, typography scale and text wrapping.
- Validation: `git diff --check`, targeted eslint for `src/components/pages/HomePageContent.tsx`, `npx.cmd tsc --noEmit`, `npm.cmd run audit:public-content`, `npm.cmd run audit:published-content`, `npm.cmd run audit:production-links`, and `npx.cmd next build --webpack` passed. The local build exited 0; logs only showed existing PostgreSQL SSL warnings, sandbox database `EACCES` fallback logs, and the known `/global` edge-runtime warning.
- Online checks: Vercel reached `READY`; `https://vessel303.com/?lang=en&b69=e72bce2` redirected to `www` and returned 200, `/global?b69=e72bce2` returned 200, and unauthenticated `/admin` redirected to `/admin/login` and returned 200. Online desktop Chrome screenshot at 1920 x 889 confirmed no horizontal overflow, one next-slide thumbnail preview, and a three-card hero proof strip measuring about 938 x 119 px.
- Mobile limitation: the current browser path still has no viewport/resize capability, so B69 did not produce a real mobile screenshot. Mobile behavior remains code-reviewed and covered by build/type/audit checks, but should be visually rechecked by 09 / 07 when a viewport-capable browser path is available.
- `/global` boundary: no `/global`, MapLibre, MapTiler or `/api/map` diff. Global Contact / Products old 303 exception remains unchanged.
- Next step: 09 should recompare the live homepage against `en.303vessel.cn`, with emphasis on whether the remaining first-screen gap is proof placement, carousel control behavior, mobile hero readability, or backend material/content selection. Display-template gaps go to 01; backend content/material gaps go to 02 / 03; mobile/image performance regressions go to 07.
