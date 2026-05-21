# CODEX.md - vessel303.com Codex 接手文档

最后更新：2026-05-15

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

产品中心：先做 1 个标准产品详情页模型，不急着恢复或导入全部 39 SKU。字段和详情页结构确认后，再批量导入后台 CMS。缺失字段不显示，不用 TBD 硬填。

项目案例：`project_cases` 当前非删除 9 条、published 8 条、draft 1 条、map-ready CMS 项目 3 条；不建议一次性导入 40 项，继续小批量样板策略。缺失字段不显示。`/cases` 空规格字段已隐藏，不显示 `-`，不用 TBD 硬填。

Global：`/global` 未来要 CMS 化，但短期不贸然改地图链路。稳定性优先于功能扩展。

价格与会员：价格体系、会员体系、代理后台、中文站、支付系统是中长期专项。价格规则未确认前，不把游客价、注册会员价、代理价、国家价写死。

`site_settings`：已初始化；`/contact` 已由后台设置 `contactUrl` 接管，异常时回退默认联系链接。后续扩展产品外链、SEO 默认值等必须单独任务、单独验收。

## 多对话分工与协作边界

当前 vessel303 采用多对话分工推进。每个对话只处理自己的责任范围，避免并行改动互相覆盖。开始任何任务前，先确认自己属于哪条线，并查看 `git status`，不要触碰其他线未提交的改动。

当前分工：

- 00 项目总控与需求确认：盘点、拆任务、确认风险、协调各线，不改文件。
- 01 产品中心 / 产品 CMS：产品列表、产品数据、产品详情页模板、价格显示策略配合研究。
- 02 后台运营 / 设置：后台设置、`site_settings`、测试账号、媒体库、邮件配置状态。
- 03 项目案例 / 项目 CMS：项目数据、项目详情页模型、项目 ID 体系、`/cases` 数据接入。
- 04 Global 地图专项：`/global` 地图链路、MapTiler/MapLibre、点位数据接入风险控制。
- 05 测试 / 提交 / 推送 / 上线：统一验收、检查、提交、push `main`、Vercel 上线控制。
- 06 文档整理 / Handoff 重写：文档库整理、handoff 重写、`CODEX.md` 更新。
- 07 使用规范与故障排查：Codex 使用规范、Browser Use / 工具故障排查、流程问题沉淀。
- 08 可视化页面编辑器：`/admin/pages/visual`、页面模块可视化预览、受控字段编辑、模块高亮、点击定位、草稿预览 / 发布上线、发布前检查、差异摘要、快照恢复、模块内 item 管理、模块注册表 / 动态渲染基础、只读模块库、Home 结构草稿新增 / 排序 / 结构隐藏受控模块和后续运营使用规范；不负责普通后台 A/B 包、产品 / 项目 CMS、`/global` 地图、会员支付。

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

- 联系、留资、采购咨询入口：默认链接为 `https://en.303vessel.cn/contact.html`；当前 `/contact` 由后台 `site_settings.contactUrl` 接管，异常时回退该默认链接。
- 查看产品入口：`https://en.303vessel.cn/products_list.html`
- 这些外链默认新窗口打开。

## 当前应用状态

官网前台：

- 首页、产品列表、V9 Gen6 详情、About、FAQ、Cases、News、Contact、`/global`、Display 等页面已存在。
- `/contact` 保留为跳转/承接页，已读取后台设置 `contactUrl`，异常时回退统一外部联系页。
- `/global` 使用 MapLibre/MapTiler，是高风险稳定模块；当前 CMS 接管同 ID static 点位的样板项目为 `astrobase-mamison`、`japan-space-vessel`、`guangdong-foshan`。

账号中心：

- `/account` 页面已接入。
- 已有账号资料表单、密码设置/修改、资料 API、密码 API。
- `users` 表已有 company、country、phone、whatsapp、preferred_language 等资料字段。
- 临时 operator 账号先保留；后续如不再使用，优先禁用，不建议直接删除。

管理后台：

- `/admin/login`：管理员登录页。
- `/admin`：后台运营工作台已上线，按 `admin` / `operator` 分层显示运营卡片和管理入口。
- `/admin/leads`：线索列表、筛选、详情、状态更新、CSV 导出。
- `/admin/users`：总管理专用。用户列表、角色/身份/禁用管理、CSV 导出、服务端自我保护。
- `/admin/media`：基于 Vercel Blob 的图片库，使用 client upload；已补充上传限制提示、引用统计文案、新闻正文引用删除保护。
- `/admin/news`：新闻管理，已能新建、编辑、发布、取消发布，并在前台展示。
- `/admin/settings`：总管理专用。设置页已上线，`site_settings` 已初始化；保存设置会写数据库并产生后台审计日志。
- `/admin/products`：产品 CMS 已接入产品列表和通用详情页，支持新建、编辑、复制为草稿、发布/下架、删除、筛选、图片选择/上传、前台预览、详情介绍、详情图库选择器、图库排序、规格参数，以及通用详情页模块（亮点、场景、FAQ、图文内容、定制范围）；固定精细详情页如 `e7`、`v9-gen6` 仍保留原页面。
- `/admin/projects`：项目 / 案例 CMS 已接入，支持新建、编辑、发布/下架、删除、筛选、封面图、图库排序、中英文案例内容、地图发布校验、地图状态筛选，以及 `/global` 详情里的统计数据、预订链接、设施亮点、交通指引和周边景点；前台 `/cases` 已优先读取数据库并保留静态兜底；带经纬度的已发布项目会进入 `/global` 地图点位和详情面板；产品/项目表单图片控件误触发和窄列布局已修复。
- `/admin/pages`：页面模块 CMS 已上线，首页首屏/数据区、关于我们首屏、数据条、品牌故事、智造实力、品牌历程、三大技术、认证荣誉、合作伙伴、创始人、服务体系已接入前台；后台支持模块显示/隐藏、文字图片编辑、列表项新增/删除/排序、图片选择/上传、未保存防误操作。
- `/admin/pages/visual`：08 C4-2d 已上线，Home 安全插入区内 C4-2c 新增模板模块支持排序和结构隐藏；当前只支持 `simple-text` / `cta-section`，操作包括上移、下移、结构层隐藏、恢复显示；结构隐藏使用 `page_structure_drafts.modules` 的结构层 `isVisible` / `status`，不是内容 item 的 `is_visible`；operator 可排序、隐藏、恢复显示、预览、丢弃但不能发布结构草稿，admin 才能发布；发布后普通前台 `/` 按目标顺序和隐藏状态展示，并可通过页面级快照恢复原结构。

## 当前阶段工作重点

- 01 产品中心：V9 CMS 详情页第一版模板优化已完成并上线；后续再扩展字段、内容和批量数据。
- 02 后台运营 / 设置：后台运营体验 A 包 A1-A6 已完成并上线：`/admin` 工作台按 `admin` / `operator` 分层；高风险操作统一确认弹窗；产品 / 项目 / 新闻 / 设置长表单已有未保存提醒；线索 / 用户 / 媒体接入分页；媒体详情可显示具体引用来源并跳转编辑；生产环境已关闭“新建测试线索”入口，API 也拒绝 `admin_test` 测试线索创建。A 包不涉及数据库结构变更，不涉及 Resend / Vercel 配置；媒体真实上传 / 删除端到端测试仍需单独授权。
- 后台 B 包内容运营效率升级已完成：新闻 / 产品 / 项目列表筛选状态写入 URL，前台预览入口统一，内容完整度提示和产品 / 项目 / 新闻发布前检查已上线，设置页最近操作可读化，设置项接管计划已作为只读说明展示。B 包不涉及数据库结构变更、API / 权限改造或 `/global` 地图底层；设置项接管计划不会写入新配置，也没有新增前台接管字段。
- 后台 2.0 阶段 A 已开始落地：`/admin` 已脱离旧 `AdminShell` 并重建为运营控制台，`/admin/legacy` 是 admin-only 旧后台维护入口；旧 `/admin/pages`、`/admin/users`、`/admin/settings` 保持 admin-only，`operator` 过渡期仍可访问 `/admin/products`、`/admin/projects`、`/admin/news`、`/admin/leads`、`/admin/media`，旧内容路由暂不迁移。A3 已上线 `/admin/site`，`/admin` 的网站管理入口已指向 `/admin/site`，`/admin/pages/visual` 是编辑网站主入口，`/admin/media` 是图片管理入口，`/global` 只是查看入口；`operator` 可进 `/admin/site` 但不显示维护中心、表单模式、设置、账号和 Legacy，`admin` 可见维护中心和 admin-only 入口。A4 已上线 `/admin/content`，聚合产品 / 项目 / 新闻状态、草稿、近 30 天新增、快捷发布、待补内容和运营流程。A5 已上线 `/admin/customers` 客户与线索新版入口页，`/admin` / `/admin/site` / `/admin/content` 的“客户与会员”入口已指向该页，聚合线索状态、近 7/30 天新增、待处理事项和进入 `/admin/leads` 的运营动作；`operator` 只看线索运营内容，`admin` 可见会员管理规划和管理设置。A5 不改数据库、leads API、旧 `/admin/leads`、会员等级 / 价格 / 订单 / 支付或 `/global`；300.cn 实机对照已通过，学习其客户 / 线索状态与待办优先的运营心智；`/global` warning 仍归 04。
- 后台 2.0 A6 已上线：新增统一顶部运营导航 `AdminTopNav`，并接入 `/admin`、`/admin/site`、`/admin/content`、`/admin/customers`、`/admin/status`；新增 `/admin/status` 数据与状态入口页，聚合网站、内容、线索、媒体、配置和风险提醒，只读展示状态。`operator` 不显示管理设置或敏感配置详情，`admin` 只看到“已配置 / 需处理”等状态；本轮不改数据库、旧业务页、复杂数据分析 API、GA / Search Console、支付 / 订单 / 会员价 / 代理商或 `/global`。300.cn 对照通过，学习其稳定顶部导航和状态 / 待办优先心智。
- 后台 2.0 A7-1 已上线：新增 `AdminSectionShell` 二级业务域布局组件，并在 `/admin/content` 试点顶部导航 + 左侧功能树 + 右侧工作区；左侧包含内容概览、待补内容、草稿内容、发布前检查、产品管理、项目案例、新闻资讯和规划中项。组件只做展示 / 跳转，不处理业务数据，不写库，不做保存 / 发布 / 删除；本轮未改 `/admin/site`、`/admin/customers`、`/admin/status`、旧内容业务页、API、数据库或 `/global`，后续扩展见 A7-2 至 A7-4。
- 后台 2.0 A7-2 已上线：`/admin/site` 已接入 `AdminSectionShell`，升级为顶部导航 + 左侧网站管理功能树 + 右侧工作区；左侧包含网站概览、编辑网站、页面草稿、网站待办、图片素材、查看主站、Global 查看、规划中项，以及 admin-only 高级维护。`operator` 不显示高级维护、表单模式、站点设置、维护入口；本轮未改 `/admin/content`、`/admin/customers`、`/admin/status`、旧后台业务页、API、数据库或 `/global`。
- 后台 2.0 A7-3 已上线：`/admin/customers` 已接入 `AdminSectionShell`，升级为顶部导航 + 左侧客户与线索功能树 + 右侧工作区；左侧包含客户概览、新线索、全部线索、跟进中、已报价、已成交、已关闭、待处理和规划中项。`operator` 不显示会员管理、后台账号、站点设置、Legacy / 维护入口；本轮未改 `/admin/content`、`/admin/site`、`/admin/status`、旧 `/admin/leads`、API、数据库或 `/global`。
- 后台 2.0 A7-4 已上线：`/admin/status` 已接入 `AdminSectionShell`，升级为顶部导航 + 左侧数据与状态功能树 + 右侧工作区；左侧包含状态概览、风险提醒、网站 / 内容 / 线索 / 媒体 / 项目地图字段、admin-only 配置状态和规划中项。`operator` 不显示系统状态 / 配置状态 / 管理设置 / 后台账号 / Legacy / 维护入口，`admin` 只看到“已配置 / 需处理”等状态；本轮未改 `/admin/content`、`/admin/site`、`/admin/customers`、旧后台业务页、API、数据库或 `/global`。
- 后台 2.0 A7-5 已上线：二级布局整体回归和细节统一完成，只做 UI / 交互小修不新增功能；`/admin/content` 删除重复发布按钮并收口为“管理入口”，`/admin/customers` 动作区改为线索状态入口，`/admin/site` admin-only 区块统一为“管理设置”并去除旧目录等过渡文案。A7-1 至 A7-5 已让四个二级业务域完成 `AdminSectionShell` 接入和细节统一；本轮未改 `/admin/status`、共享组件、API、数据库、旧后台业务页或 `/global`。
- 后台 2.0 B1 已上线：新增 `/admin/content/products` 产品运营入口页和 `/admin/content/products/list` 新版产品列表页；产品入口聚合总览、状态、待补、常用动作和流程，新列表支持全部 / 已发布 / 草稿 / 待补、搜索、系列 / 类型筛选、完整度提示、预览和编辑入口。旧 `/admin/products`、`/admin/products/new`、旧编辑页继续作为维护 / 实际编辑路径；本轮只读 `product_catalog`，未改数据库、API、`ProductForm`、`ProductListClient`、保存 / 发布 / 下架 / 删除 / 上传逻辑、价格 / 支付 / 订单或 `/global`。当前无明确 SEO 字段，因此不做缺 SEO 统计。
- 后台 2.0 B1-3-1 已上线：新增 `/admin/content/products/[id]/edit` 新版产品编辑入口壳，列表编辑入口已进入新版路径；页面使用 `AdminSectionShell`，包含产品状态头、编辑分区入口、保存影响提示，并复用现有 `ProductForm`。`ProductForm` 仅做低风险适配：自定义返回链接 / 标题、分区锚点、草稿产品隐藏前台预览入口；未改数据库、API、保存 / 发布 / 下架 / 删除 / 上传逻辑、`ProductListClient` 或旧 `/admin/products`。
- 后台 2.0 B1-3-2 已上线：`62c974d feat(admin): organize product form sections`，full SHA `62c974dcc5f2cecb48438bf27215447d2f2b765c`；`ProductForm` 已按 `basic` / `media` / `content` / `details` / `specs` / `publish-check` 六个分区整理，新版 `/admin/content/products/[id]/edit` 左侧锚点已同步并可跳转，已发布产品预览和保存影响提示正常；旧 `/admin/products`、`/admin/products/new`、旧编辑路径仍可用。此轮未改数据库、API、保存 / 发布 / 下架 / 删除 / 上传、媒体库选择、详情模块业务逻辑、字段含义或 `/global`，`/global edge runtime warning` 仍归 04。本轮使用测试 admin 登录验收，可能更新测试账号 `last_login_at`，未改业务内容。
- 后台 2.0 开发规则：重大产品设计前必须做 300.cn 对照确认；普通 bug、文案、API、权限、lint/build 不必每轮访问。若对 300 交互不确定，先回 300.cn 只读观察，不凭记忆硬做；300 负责启发路径，vessel 负责收口边界。
- 03 项目案例 / 项目 CMS：当前 3 个 Excel/static 样板项目已进入 CMS 发布链路；旧 `foshan-shishan-cultural-camp` 保持 draft，不显示在 `/cases`，不进入 `/global`。
- 04 Global 地图专项：`/global` 地图底层仍归 04；03 不直接修改地图底层。`/global` 营地详情首开速度第一阶段已上线：`77b053d perf(global): speed up project detail loading`；预加载 `ProjectDetail` 和 `showcaseProjects`，详情基础文字先显示，轮播图片按当前图加载；未改 `/api/map/[...path]`、runtime、点位、CMS、坐标、HQ，未替换 / 压缩 / 删除图片素材；剩余大图体积治理交 03 / 媒体侧，MapTiler `key=proxied` 403 属既有地图链路问题，`/global` edge runtime warning 仍归 04。
- 05 测试 / 提交 / 推送 / 上线：继续统一验收、提交、push `main` 和 Vercel 上线控制。
- 06 文档整理：继续维护 V9、`CODEX.md` 和文档库。
- 07 使用规范与故障排查：沉淀 Codex 使用规范、Browser Use / 工具故障和流程问题。
- 08 可视化页面编辑器：C4-2d Home 安全插入区排序与结构隐藏已上线；可见时“隐藏”发送 `{ isVisible: false }`，隐藏时显示“结构草稿中隐藏”，“恢复显示”发送 `{ isVisible: true }`；测试数据 `C4-2D-QA-20260517` 已清理，无残留；当前仍只支持 Home credentials 后、CoreTech 前的安全插入区，不支持 About、核心模块、整页自由拖拽、跨区排序、自由 HTML / CSS、删除核心模块、产品 / 项目 / 新闻详情或 `/global`；本机 Turbopack `os error 5` 属于本地环境问题，`next build --webpack` 和 Vercel build 已通过；`/global` edge runtime warning 仍归 04 地图专项。
- 价格、会员、代理、支付：单独专项，不在普通 CMS 任务中写死规则。
- Resend：正式发件身份仍未配置，缺少 `RESEND_FROM` / `CONTACT_NOTIFY_TO` / `MEDIA_KIT_NOTIFY_TO` 和域名验证信息。
- Vercel edge runtime warning：仍来自 `/api/map/[...path]`，归入 `/global` 地图专项，暂不处理。

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

- 03 项目案例 / 项目 CMS：继续小批量样板策略；发布更多项目前先补齐封面图、图库、经纬度、简介、舱数/规模、设施、交通、周边。
- 04 Global 地图专项：地图底层仍归 04；更多 `/global` 点位接入前先等 03 数据基线稳定。
- 02 后台运营 / 设置：`site_settings` 已初始化并接管 `/contact` 的 `contactUrl`；后续扩展范围单独确认。
- 后台运营体验 A / B 包：A1-A6 和 B1-B6 已上线；媒体真实上传 / 删除端到端测试仍需单独授权。
- 08 可视化页面编辑器：C4-2d Home 安全插入区排序与结构隐藏已上线；旧 `/admin/pages` 仍只是备用表单编辑器，主线继续是 `/admin/pages/visual`；后续继续补运营使用规范和页面级结构保护，不要扩成自由建站器。
- 价格、会员、代理、支付：单独专项，不在普通 CMS 任务中顺手实现。
- Resend：正式发件身份仍未配置。
- Vercel edge runtime warning：归入 `/global` 地图专项，暂不处理。
- 文档：业务结论变化先更新 V9，再判断是否同步 `CODEX.md`。
