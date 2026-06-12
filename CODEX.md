# vessel303 Codex 技术手册

最后更新：2026-06-12

本文件是 Codex 在 vessel303 工作区的技术地图。行为纪律见 `AGENTS.md`；当前项目总控状态见 `C:\Users\Wynne\Desktop\vessel303\00_项目总控入口\vessel303_当前总控handoff.md`。

## 1. 当前结论

- 官网：`https://www.vessel303.com`
- 代码仓库：`C:\Users\Wynne\Desktop\vessel303\repo-git`
- 当前循环：B221 已完成并上线；下一轮从 B222 继续按 00-11 工作流推进。
- 最近功能批次：B221 / `fc17666 feat(admin): add case path signal to project list`
- 最近生产验证 deployment：`dpl_GiZK13xJKX7mkoqH6GTCDCTquSNG`
- 当前精确状态以 `00_项目总控入口/vessel303_当前总控handoff.md` 和 `vercel inspect https://www.vessel303.com` 为准。
- 当前目标：前台对齐 `en.303vessel.cn` 的生产官网能力，后台对齐 `300.cn 后台` 的运营效率和数据分析心智。
- 当前对照边界：`en.303vessel.cn` 当前由 `openresty` 响应，公开产品/案例路径只读 smoke 返回 403，后台路径返回 404；本仓库部署 smoke 以 `https://www.vessel303.com` / Vercel alias 为准。

## 2. 项目定位

`vessel303.com` 是 VESSEL 微宿海外 B2B 官网，面向度假村开发商、酒店集团、地产开发商、政府采购和渠道合作伙伴。

核心目标：

- 展示产品力、工厂能力、交付能力和项目证明。
- 通过产品目录、案例、资料中心、FAQ、联系表单获取采购线索。
- 后台 published 内容是客户可见内容的主要来源。
- 后台不是自由建站器，不复制 `300.cn` 的自由 HTML / CSS / DOM 能力。

## 3. 工作区目录职责

- `repo-git/`：唯一代码仓库。所有代码修改、构建、提交、推送都在这里完成。
- `00_项目总控入口/`：当前总控 handoff 入口。用户优先打开这里看项目状态。
- `vessel303-assets/`：唯一素材库入口。官网、产品、项目、300 后台、en303、截图和下载素材统一进入这里。
- `vessel303文档/`：产品计划、历史 handoff、历史规则归档、业务参考、旧资料。
- `local-ops/`：本地运维脚本和敏感配置，可能含 `.env`，不随便移动或提交。
- `90_历史归档/`：旧副本、空目录、历史残留、已淘汰但暂不删除的资料。
- `99_临时产物_待清理/`：Codex 截图、日志、docx render、临时脚本和 inventory。

不要在根目录新建新的素材库、临时项目库或重复入口。

## 4. 素材库规则

- `vessel303-assets/` 是唯一素材库入口。
- 官网实际使用素材以 `repo-git/public/images/` 为准。
- 从 `300.cn 后台`、`en.303vessel.cn`、截图、下载得到的参考素材，先进入 `vessel303-assets/05_300后台导出素材/` 或 `vessel303-assets/06_en303对照素材/`。
- 不直接删除素材；重复素材先进入查重清单。
- 源文件、压缩图、导出版同名不代表重复，必须看 hash、尺寸、用途和来源。

素材库目录职责：

- `00_素材库说明/`：素材库说明、使用规则、查重清单和来源记录。
- `01_官网正式使用素材/`：准备进入官网正式使用的候选素材；线上实际引用仍以 `repo-git/public/images/` 为准。
- `02_产品素材/`：产品图、渲染图、型号素材、customs 和产品页候选素材。
- `03_项目案例素材/`：项目案例、营地图片、项目详情页和案例叙事素材。
- `04_品牌素材/`：logo、品牌色、品牌对外材料和视觉识别素材。
- `05_300后台导出素材/`：`300.cn 后台` 只读导出、下载和对照素材。
- `06_en303对照素材/`：`en.303vessel.cn` 公开页对照素材。
- `07_截图与测试素材/`：测试截图、复验截图、视觉对照截图和问题记录素材。
- `90_历史素材归档/`：旧副本、旧版本和需要保留但不再直接参与当前制作的素材。
- `99_待筛选临时素材/`：未分类下载、未确认来源、待判断用途的临时素材。

## 5. 技术栈

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

这是 Next.js 16。涉及框架行为、缓存、路由、proxy、构建问题时，优先读当前代码和本地 `node_modules/next/dist/docs/`。

## 6. 本地命令

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

Windows 下优先使用：

```bash
cmd /c npm run build
cmd /c npx tsc --noEmit
cmd /c npx eslint "path/to/file.tsx"
```

已知非阻断日志包括 PostgreSQL SSL warning、本地 sandbox PostgreSQL `EACCES` fallback、部分 Edge runtime warning 和 CMS fallback/revalidation 日志。不要未经判断就归因到本轮变更。

## 7. Git、部署与线上复验

- 生产部署由 `main` 触发。
- commit/push/等待 Vercel READY/线上复验只在 Wynne 授权批次内执行。
- push 前确认 `git status --short --branch` 和 `git rev-list --left-right --count HEAD...origin/main`。
- Vercel production READY 后再做线上 smoke。
- 后台受登录保护，未登录线上 smoke 只能确认跳转 `/admin/login`、部署状态和公开页健康。

常用 Vercel 检查：

```bash
cmd /c npx --yes vercel@50.28.0 inspect https://www.vessel303.com --scope vessel303
```

## 8. 生产与数据边界

默认不得执行：

- 生产数据库重大写入或迁移。
- 修改权限、认证、支付、订单、会员、代理价、国家版本价格规则。
- 真实删除、批量覆盖、不可逆生产数据操作。
- 输出任何密码、密钥、token、cookie 或数据库连接串。

后台统计和 readiness 可以做只读派生；不得伪造未确认业务事实。

## 9. 前台入口规则

普通主站：

- 联系、留资、采购咨询入口默认走 `/contact`。
- 产品入口默认走 `/products`。
- 不硬编码未经确认的业务文案、产品事实、联系方式、价格承诺或旧站链接。

`/global` 例外：

- `/global`、MapLibre、MapTiler、`/api/map` 是高风险链路。
- 新站正式接管 Global 生产链路前，Global 内 Contact / Products 可继续保持旧 303 页面策略。
- 不要为了普通主站、产品、案例、后台任务顺手改 `/global`。

## 10. 后台重构边界

后台目标是专业运营后台：

- 学习 `300.cn 后台` 的信息密度、列表效率、字段组织、数据分析页、发布流程和运营心智。
- 不学习自由 HTML / CSS / DOM 能力。
- 不破坏现有 Next.js / CMS / 权限 / 数据结构。
- 不改变支付、订单、会员、代理价、国家版本价格规则。

重点页面：

- `/admin`
- `/admin/site`
- `/admin/content`
- `/admin/content/products/list`
- `/admin/content/projects/list`
- `/admin/content/news/list`
- `/admin/status`
- `/admin/status/traffic`
- `/admin/site/media`
- `/admin/site/visual`
- `/admin/customers/leads`
- `/admin/site/seo`
- `/admin/settings`

## 11. 300 后台与 en303 对照规则

- `300.cn 后台` 只允许只读学习、截图对照、字段观察和必要资料下载。
- 不得保存、发布、上传、删除、付款、购买、提交表单或修改配置。
- 300 后台账号密码只允许从本机 env 使用，不得写入文档、代码、commit 或聊天输出。
- `en.303vessel.cn` 用于公开页对照；不能把旧站未经确认的业务事实直接硬编码到新站。

## 12. vessel303 业务型 00-11 子线程分工与工作流

编号和流转方式对齐 `VESSEL_Lead_OS`，但职责按 vessel303 的真实业务链路重塑：公开官网获客、CMS 内容生产、运营后台效率、素材与媒体、数据增长、上线安全。不要照搬 AI 客服、线索处理系统的角色边界。

所有线程最终以 `00_project_controller` 为准。子线程可提出建议和局部实现，但不得绕过 00 的边界、验证、commit/push/上线和 handoff。

| 编号 | 标准角色 | vessel303 职责 |
| --- | --- | --- |
| 00 | `00_project_controller` | 项目总控。接收 Wynne 需求，定目标、边界、批次和停止点，调度 01-11，决定是否进入验收、提交、上线和 handoff 更新。 |
| 01 | `01_public_site_conversion` | 公开官网与转化。负责首页、产品、案例、新闻、Global、Contact 的信息架构、客户路径、CTA、移动端阅读体验和 `en.303vessel.cn` 对照；不硬编码未经确认的业务事实。 |
| 02 | `02_content_cms_workflow` | 内容与 CMS 工作流。负责产品/案例/新闻/页面模块的字段组织、草稿/发布、内容缺口、published 内容质量和编辑效率；不做生产重大写入。 |
| 03 | `03_admin_operations_center` | 运营后台。负责 `/admin` 信息架构、列表效率、编辑效率、发布流程、媒体库、数据中心、线索处理和 `300.cn 后台` 只读对照。 |
| 04 | `04_frontend_visual_system` | 前端与视觉系统。负责公开页和后台 UI 的组件、布局、响应式、状态标签、按钮、表格、表单、Visual Editor 和交互落地。 |
| 05 | `05_backend_api_data` | API、数据与服务端。负责 `src/app/api/**`、CMS 读写路径、leads、media、analytics、auth、server validation、Neon/Postgres schema 边界；不改支付、订单、会员、代理价、国家版本价格规则。 |
| 06 | `06_assets_media_pipeline` | 素材与媒体链路。负责 `vessel303-assets/`、`repo-git/public/images/`、Vercel Blob、媒体库、300/en303 对照素材、图片体积、来源记录和重复素材清单。 |
| 07 | `07_growth_analytics_seo` | 数据增长与 SEO。负责第一方 analytics、`/admin/status`、traffic、conversion、SEO、metadata、内容缺口优先级、搜索表现和转化路径分析。 |
| 08 | `08_security_production_guard` | 安全与生产边界。负责权限、认证、cookies、secrets、env、生产数据库、300 后台只读边界和不可逆操作拦截。 |
| 09 | `09_docs_archive_closure` | 文档与归档收口。负责 `AGENTS.md`、`CODEX.md`、当前 handoff、历史归档、素材 README、inventory 和目录治理。 |
| 10 | `10_acceptance_release` | 验收与发布。负责 typecheck、lint、build、audit、Browser/Chrome smoke、git 状态、Vercel READY、线上复验；commit/push/上线只在授权批次内执行。 |
| 11 | `11_operator_customer_experience` | 运营与客户体验验收。以运营人员和客户视角走后台操作路径、公开站转化路径、300 后台差距、en303 差距和截图证据；默认只读，不做真实变更。 |

基础流转：

```text
00 定目标、边界和批次
→ 责任角色执行
→ 涉及 UI、运营路径、客户路径的大改交 11 复看
→ 10 做技术验收和上线前检查
→ 阶段结束或规则/路径变化交 09 更新文档
→ 00 决定是否 commit、push、上线或停止
```

任务分流：

- 小改：由 00 直接调度对应单一角色，完成后做必要验证。
- 中改：由 00 指定主责角色，必要时拉 10 做验收、09 更新文档。
- 大改：必须先由 00 拆批次；涉及前台/后台体验的批次，04 执行后交 11 复看，再交 10 验收。

业务流转：

- 公开官网转化：01 定客户路径和页面目标 → 04 落地界面 → 07 看数据/SEO影响 → 11 以客户视角复看 → 10 验收。
- CMS 内容生产：02 定字段、内容缺口和发布流程 → 05 确认数据/API边界 → 03 组织后台操作效率 → 11 以运营视角复看 → 10 验收。
- 后台运营效率：03 主责对齐 `300.cn 后台` 的信息密度和操作心智 → 04 落地 UI → 07 补数据中心/转化分析 → 11 复看 → 10 验收。
- 素材和媒体：06 主责素材来源、归档、媒体库和图片链路 → 04/05 按需接入页面或后台 → 10 验收。
- 安全生产边界：任何角色触碰认证、权限、secrets、生产数据库、不可逆操作或 300 后台真实变更时，必须先交 08。

专项标签不占编号：`global-map`、`admin-2.0`、`performance-images`、`asset-library`、`seo-content`、`media-library`。专项可以跨角色调度，但最终仍归 00 收口。

## 13. 当前模块边界

- Products：`/products` 是正式产品目录入口；产品详情优先 fixed detail slug，没有则走 CMS 通用详情。
- Cases：`/cases` 和 `/cases/[id]` 已上线；案例详情 CTA 走新站询盘表单。
- Contact：`/contact` 是新站自有联系页，表单写入 `leads`。
- Visual Editor：不是自由建站器，只做受控页面模块和字段编辑。
- Analytics：第一方统计只记录路径、事件、来源、referrer、UTM、设备、匿名 visitor/session hash 和时间；不保存原始 IP、姓名、邮箱、电话、留言正文或完整 User-Agent。

## 14. 文档维护规则

- `AGENTS.md` 只保留行为纪律。
- `CODEX.md` 保留当前技术规则、目录职责、素材规则、业务型 00-11 分工和验证部署规则。
- 当前 handoff 是最全面入口，但只保留当前状态、规则摘要和最近 5-10 批摘要。
- 旧的长 handoff 不删除，作为完整历史归档。
- 每批完成后，把上一轮当前状态压缩保留，不再无限追加长流水账。
