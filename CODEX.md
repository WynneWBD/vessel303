# CODEX.md - vessel303.com Codex 接手文档

最后更新：2026-05-27

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

产品中心 / 产品管理：先做 1 个标准产品详情页模型，不急着恢复或导入全部 39 SKU。后台 B4-0 至 B4-16 已参照 300.cn 产品管理心智完成安全核心能力：产品分类管理、列表分类筛选、低风险批量转分类、产品回收站恢复为草稿、新版产品列表移入回收站、单篇产品 SEO 字段、产品属性模板 / 选项和产品属性绑定、产品列表质检与安全运营工具条、产品标记管理、品牌管理、筛选管理、橱窗管理、产品表单品牌 / 标记 / 橱窗绑定，以及低风险批量加标记 / 加入橱窗；B4-16 已完成已登录生产后台真实运营回归，并修复批量操作原生确认框阻塞；前台产品详情 metadata 已读取 SEO 字段；B4-7 已完成生产环境真实全链路回归。字段和详情页结构确认后，再批量导入后台 CMS。缺失字段不显示，不用 TBD 硬填。

页面编辑 / 网站管理：B5-1/B5-2 已参照 300.cn 网站管理心智完成安全第一阶段。`/admin/site` 已新增“发布与更新”快捷入口，`/admin/site/pages` 已新增页面清单与编辑边界视图，区分 Home/About 可视化编辑、产品 / 项目 / 新闻独立 CMS、联系入口 / Display / Global 受保护。当前只做入口和只读盘点，不开放自由建站器、自由 HTML / CSS、导航保存、批量 TDK、三方代码保存或 `/global` 底层修改。

项目案例：`project_cases` 当前非删除 9 条、published 8 条、draft 1 条、map-ready CMS 项目 3 条；不建议一次性导入 40 项，继续小批量样板策略。缺失字段不显示。`/cases` 列表已指向 `/cases/[id]` 正式详情页，筛选按钮已真实生效，详情页已补齐 300.cn 对照字段和相关案例入口；B2-6 全链路回归已完成，前台主导航 Cases 已回到 `/cases`，后台项目引用入口已收口到新版 `/admin/content/projects/{id}/edit`；B2-7 已把案例详情主 CTA 接到页面内 `#case-inquiry`，表单提交走现有 `/api/contact` 并写入 `leads`；Global 仍只作为独立地图展示渠道；空规格字段隐藏，不显示 `-`，不用 TBD 硬填。

新闻资讯：B3-0/1/2 已完成新闻后台 2.0 主路径，正式路径为 `/admin/content/news -> /admin/content/news/list -> /admin/content/news/new 或 /admin/content/news/{id}/edit`；旧 `/admin/news`、旧 new / edit 路径继续作为维护备用。新闻 2.0 已参照 300.cn 新闻资讯模块收口状态筛选、搜索、添加、编辑、预览、发布前检查和删除入口；B3-3 已补 300 对照运营能力规划，在 `/admin/content/news` 展示分类管理、回收站、批量操作、定时发布的安全边界，在 `/admin/content/news/list` 补批量选择和禁用批量操作预演；B3-4 已新增 `/admin/content/news/categories` 新闻分类字段方案页；B3-5 已完成新闻分类真实建表与保存接入，新增 `news_categories` 表、`news.category_id` nullable 字段、后台分类 API、表单保存 / 发布前保存同步分类、后台列表分类列与分类筛选，默认分类为 `公司资讯`、`产品与展会`、`项目案例`、`行业观察`；B3-6 已完成新闻全链路只读回归；B3-7 已开放新闻分类新增、编辑、排序、显示 / 隐藏和稳定测试定位，不做分类物理删除；B3-8 已开放新闻回收站列表和恢复为草稿，不做永久删除；B3-9 已开放低风险批量转分类，不开放批量发布、批量删除、永久删除或翻译；B3-10 已开放单篇新闻定时发布第一阶段，新增 nullable `news.scheduled_at`、定时筛选、表单保存 / 清除计划发布时间和概览定时入口，但不做自动执行器、失败重试或批量定时；B3-11 已开放新闻 SEO 字段治理第一阶段，新增 nullable `news.seo_title_zh`、`news.seo_title_en`、`news.seo_description_zh`、`news.seo_description_en`，编辑页可保存搜索标题 / 描述，前台 `/news/[slug]` metadata 优先读取 SEO 字段；B3-12 已完成生产环境真实全链路回归，作为运营人员从新建草稿、封面、分类、定时、SEO、发布、前台验证、取消发布、批量转分类、软删除、回收站恢复到最终清理均跑通，未发现需要 02 修复的问题。旧 `/admin/news`、旧 new / edit 路径也已接入服务端预加载分类，避免浏览器插件拦截客户端分类 API 时下拉不可用。定时自动执行器、关键词、批量 SEO、SEO 自动生成、权限分级仍作为后续任务，不在普通主路径小修中混入。真实测试新闻 `vessel-news-console-2-test-20260525` 已完成发布、前台验证、删除验证、B3-8 恢复验收、B3-9 批量转分类验收、B3-10 定时保存 / 清除验收和 B3-11 SEO 字段保存验收；B3-12 真实回归测试新闻 `b3-12-news-full-chain-qa-20260526` 已完成发布 / 取消发布 / 回收站恢复全链路，最终 soft-deleted 留在回收站，未永久删除，前台列表不展示，详情页返回 404。

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

- 首页、产品列表、V9 Gen6 详情、About、FAQ、`/cases` 列表、`/cases/[id]` 项目案例详情、News、Contact、`/global`、Display 等页面已存在。
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
- `/admin/content/news`：新闻后台 2.0 主路径，包含新闻概览、列表、新建、编辑、预览、发布前检查、发布 / 取消发布和删除入口。
- `/admin/news`：旧新闻管理维护备用路径，仍能新建、编辑、发布、取消发布，并在前台展示。
- `/admin/settings`：总管理专用。设置页已上线，`site_settings` 已初始化；保存设置会写数据库并产生后台审计日志。
- `/admin/products`：产品 CMS 已接入产品列表和通用详情页，支持新建、编辑、复制为草稿、发布/下架、删除、筛选、图片选择/上传、前台预览、详情介绍、详情图库选择器、图库排序、规格参数，以及通用详情页模块（亮点、场景、FAQ、图文内容、定制范围）；固定精细详情页如 `e7`、`v9-gen6` 仍保留原页面。
- `/admin/projects`：项目 / 案例 CMS 已接入，支持新建、编辑、发布/下架、删除、筛选、封面图、图库排序、中英文案例内容、地图发布校验、地图状态筛选，以及 `/global` 详情里的统计数据、预订链接、设施亮点、交通指引和周边景点；前台 `/cases` 列表和 `/cases/[id]` 详情已优先读取数据库并保留静态兜底；带经纬度的已发布项目会进入 `/global` 地图点位和详情面板；产品/项目表单图片控件误触发和窄列布局已修复。
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
- 后台 2.0 B5-1/B5-2 网站管理主控台与页面清单已上线：`5119783 feat(admin): add site page inventory`，full SHA `5119783ea5030e1af2ab9360c058f2da8694060b`，Vercel deployment `dpl_FufSD2Ua9g6PowybSY6NbdFKxTuf`，Vercel 状态 READY，deployment URL `https://vessel303-ng9411vsm-vessel303.vercel.app`，production alias 已包含 `https://www.vessel303.com`。本轮只读对照 300.cn 网站管理控制台，确认其包含发布产品、发布内容、项目案例、新闻资讯、导航管理、网站信息、网站 TDK 规则、三方代码、搜索引擎、死链提交和关键词密度等模块；vessel 本轮只落地低风险运营入口和只读页面边界：`/admin/site` 新增“发布与更新”，`/admin/site/pages` 新增页面清单、编辑范围、模块数量、草稿状态和 300 对照边界。验收记录：`git diff --check`、targeted eslint、`tsc --noEmit`、`next build --webpack` 通过；线上 `/admin/site` 与 `/admin/site/pages` 未登录均 302 到 `/admin/login`，`/admin/login` 和首页 200 且页面 `data-dpl-id` 为 `dpl_FufSD2Ua9g6PowybSY6NbdFKxTuf`。未改数据库、API、权限矩阵、认证、支付、订单、会员、导航保存、批量 TDK、三方代码保存、`/global`、MapLibre、MapTiler 或 `/api/map`；未在 300.cn 执行保存 / 发布 / 删除 / 上传。
- 后台 2.0 开发规则：重大产品设计前必须做 300.cn 对照确认；普通 bug、文案、API、权限、lint/build 不必每轮访问。若对 300 交互不确定，先回 300.cn 只读观察，不凭记忆硬做；300 负责启发路径，vessel 负责收口边界。
- 03 项目案例 / 项目 CMS：当前 3 个 Excel/static 样板项目已进入 CMS 发布链路；旧 `foshan-shishan-cultural-camp` 保持 draft，不显示在 `/cases`，不进入 `/global`。前台 `/cases` 列表已进入正式 `/cases/[id]` 详情页链路，筛选、300.cn 对照字段、相关案例入口、B2-6 全链路回归和 B2-7 案例询盘接线索已完成，Global 仍只是地图展示渠道。
- 04 Global 地图专项：`/global` 地图底层仍归 04；03 不直接修改地图底层。`/global` 营地详情首开速度第一阶段已上线：`77b053d perf(global): speed up project detail loading`；预加载 `ProjectDetail` 和 `showcaseProjects`，详情基础文字先显示，轮播图片按当前图加载；未改 `/api/map/[...path]`、runtime、点位、CMS、坐标、HQ，未替换 / 压缩 / 删除图片素材；剩余大图体积治理交 03 / 媒体侧，MapTiler `key=proxied` 403 属既有地图链路问题，`/global` edge runtime warning 仍归 04。
- 05 测试 / 提交 / 推送 / 上线：继续统一验收、提交、push `main` 和 Vercel 上线控制。
- 06 文档整理：继续维护 V9、`CODEX.md` 和文档库。
- 07 使用规范与故障排查：沉淀 Codex 使用规范、Browser Use / 工具故障和流程问题。
- 08 可视化页面编辑器：C4-2d Home 安全插入区排序与结构隐藏已上线；可见时“隐藏”发送 `{ isVisible: false }`，隐藏时显示“结构草稿中隐藏”，“恢复显示”发送 `{ isVisible: true }`；测试数据 `C4-2D-QA-20260517` 已清理，无残留；当前仍只支持 Home credentials 后、CoreTech 前的安全插入区，不支持 About、核心模块、整页自由拖拽、跨区排序、自由 HTML / CSS、删除核心模块、产品 / 项目 / 新闻详情或 `/global`；本机 Turbopack `os error 5` 属于本地环境问题，`next build --webpack` 和 Vercel build 已通过；`/global` edge runtime warning 仍归 04 地图专项。
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
- 02 后台运营 / 产品：B4-0 至 B4-16 产品管理 2.0 核心运营能力与生产真实运营回归已完成，已接入产品分类、列表分类筛选、低风险批量转分类、回收站恢复为草稿、新版列表移入回收站入口、SEO 字段治理第一阶段、产品属性模板 / 选项管理、产品属性绑定、属性筛选、产品列表缺项质检筛选、总览待办跳转、发布前检查扩展、标记管理、品牌管理、筛选管理、橱窗管理、产品表单品牌 / 标记 / 橱窗绑定，以及低风险批量加标记 / 加入橱窗；批量操作确认弹窗已从原生 confirm 改为后台统一弹窗并上线验证。权限矩阵仍放到基本建站标准完成后再做；不混入价格、会员价、代理价、订单、支付和 `/global` 底层。
- 02 后台运营 / 网站管理：B5-1/B5-2 已完成 `/admin/site` 发布与更新入口和 `/admin/site/pages` 页面清单 / 编辑边界。下一步建议进入 B5-3 导航管理只读规划入口或 B5-4 SEO / TDK 检查入口；仍不开放自由建站器、自由 HTML / CSS、导航保存、批量 TDK、三方代码保存或 `/global` 底层。
- 04 Global 地图专项：地图底层仍归 04；更多 `/global` 点位接入前先等 03 数据基线稳定。
- 02 后台运营 / 设置：`site_settings` 已初始化并接管 `/contact` 的 `contactUrl`；后续扩展范围单独确认。
- 后台运营体验 A / B 包：A1-A6 和 B1-B6 已上线；媒体真实上传 / 删除端到端测试仍需单独授权。
- 08 可视化页面编辑器：C4-2d Home 安全插入区排序与结构隐藏已上线；旧 `/admin/pages` 仍只是备用表单编辑器，主线继续是 `/admin/pages/visual`；后续继续补运营使用规范和页面级结构保护，不要扩成自由建站器。
- 价格、会员、代理、支付：单独专项，不在普通 CMS 任务中顺手实现。
- Resend：正式发件身份仍未配置。
- Vercel edge runtime warning：归入 `/global` 地图专项，暂不处理。
- 文档：业务结论变化先更新 V9，再判断是否同步 `CODEX.md`。
