# vessel303 全站公开页性能优化循环批次验收记录

日期：2026-06-06

范围：公开页性能小批次优化；不包含 `/global`、权限、认证、支付、订单、会员、代理价、国家价格规则、生产数据写入、300 后台真实内容变更。

## 结论

本轮已完成第一批 P0/P1 性能修复：

- P0：首页首屏 HTML 不再提前输出 4 个 Blob 视频资源；视频改为接近视口后再加载。
- P1：`/products` 动态页面的公开 CMS 读取和产品列表读取已减轻；本地 production warm path 从秒级降到几十毫秒级。
- P1：新增 3 个只读审计脚本，用于后续循环持续记录线上资源、route JS 和 public assets 体积。

本轮不是视觉改版，也没有重做页面结构。

## Baseline 摘要

线上只读 baseline 采集目标：`https://www.vessel303.com`，对照旧站 `https://en.303vessel.cn` 可映射公开页。

主要发现：

- `/` 首页：线上可发现首屏资源约 `65406.3 KB`，包含 `4` 个视频；最大 4 个视频约 `18.5 MB`、`17.8 MB`、`13.7 MB`、`11.3 MB`。
- `/products`：线上 HTML 等待多次出现秒级，记录值包括约 `5429 ms`、`4392 ms`、`1873 ms`；本地修复前 production 也出现约 `3913 ms`、`3247 ms`。
- `/cases`：线上可发现资源约 `4078.9 KB`，列表页仍有大图：`japan-space-vessel/exterior-01.jpg` 约 `1211.7 KB`，`guangdong-foshan/image-01.png` 约 `1127.9 KB`。
- `public/images` 本地资产库存：`542` files / `1641.57 MB`；其中 `public/images/projects` 约 `1048.98 MB`，`public/images/products` 约 `346.41 MB`，`public/images/about` 约 `107.16 MB`。
- route JS 估算：产品详情约 `200 KB`，`/about` 约 `188 KB`，`/products` 约 `166 KB`，首页约 `141 KB`。

限制说明：本轮没有使用 Lighthouse/Playwright 真浏览器 trace；用 `fetch`、HEAD/Range、Next build output、route manifest 和 HTML 资源解析替代。脚本统计的是 HTML 中可发现资源，不等于真实浏览器 waterfall 的完整下载量。

## 本轮修改

代码修改：

- `src/components/pages/HomePageContent.tsx`
  - 新增 `LazyHomepageVideo`。
  - 首页 page-module 视频初始不输出 `src`，`preload` 改为 `none`，进入接近视口后再设置 `src` 并播放。

- `src/app/products/page.tsx`
  - 产品列表公开页改用轻量产品卡片读取。
  - 分类、属性、页面模块、产品列表改为并行读取。
  - 当产品图片为本地静态路径时，跳过无意义的 `uploads.variants` 查询。

- `src/lib/product-catalog-db.ts`
  - 新增 `listPublishedCatalogProductCards()`，只取产品列表页实际需要的字段，不把详情页专用 `detail_modules/specs/gallery` 带入列表页 HTML。

- `src/lib/page-modules-db.ts`
  - 新增公开 `page_modules` 读取缓存，TTL `300s`，tag 为 `page-module-public`。

- `src/app/api/admin/page-modules/...`
- `src/app/api/admin/page-structures/...`
  - 在原有 `revalidatePath` 基础上同步 `revalidateTag('page-module-public', { expire: 0 })`，避免 CMS 发布后公开读取缓存长时间不刷新。

新增只读脚本：

- `scripts/audit-public-performance.mjs`
- `scripts/audit-route-js-weight.mjs`
- `scripts/audit-asset-weight.mjs`

新增 npm scripts：

- `audit:public-performance`
- `audit:route-js-weight`
- `audit:asset-weight`

## 本地验收结果

通过检查：

- `npx eslint ...`
- `npx tsc --noEmit`
- `git diff --check`
- `npm run build`

本地 production server：`http://localhost:3107`

核心结果：

- `/`：`HTTP 200 / HTML 122 ms / known 4006.3 KB / assets 35 / scripts 12 / images 21 / videos 0`
- `/products`：`HTTP 200 / HTML 95 ms / known 2743.5 KB / assets 25 / scripts 11 / images 12 / videos 0`
- `/products` warm check：`HTTP 200 / HTML 27 ms`
- `/cases`：`HTTP 200 / HTML 9 ms / known 3977.4 KB`
- `/about`：`HTTP 200 / HTML 12 ms / known 3666.3 KB`
- `/faq`：`HTTP 200 / HTML 9 ms / known 865 KB`

关键对比：

- 首页视频：线上 baseline `4 videos / ~65 MB` 可发现资源，本地修复后 `0 videos / ~4.0 MB` 可发现资源。
- 产品列表：本地修复前秒级 HTML 等待，修复后 warm path `27 ms`。

## 遗留风险

下一轮建议继续处理：

- 产品详情和部分公开页 route JS 仍偏高，最高约 `200 KB`。
- `/cases` 列表仍有 1 MB 级图片，应继续做 case list/card 资源治理。
- `/about` 仍有 `58` 张图片，可继续延后 below-fold 图片和检查 sizes。
- `public/images/projects` 原图库存超过 `1 GB`，需要继续按页面实际引用做变体治理，不建议无授权删除原图。
- 本轮未做 Lighthouse 真浏览器 main thread/hydration trace；线上复验后仍建议下一轮补浏览器级 trace。

## 上线复验

状态：已完成。

部署：

- commit：`8da0eb6 perf(public): reduce homepage media and cache public CMS reads`
- Vercel status：`success`
- Vercel deployment：`dpl_69MUXmxqhuPwe2Za2AUMpy9KCTph`

线上命令：

- `npm run audit:public-performance -- --no-old --asset-limit 140 --route home --route products --route cases --route about --route faq`
- `npm run audit:public-performance -- --no-old --no-assets --route products --route home --route cases --route about --route faq`
- 产品页 5 次连续 HTML 请求。

线上结果：

- `/`：`HTTP 200 / HTML 183 ms / known 4107.5 KB / assets 37 / scripts 12 / images 21 / videos 0`
- `/products`：`HTTP 200 / HTML 185 ms / known 2756.3 KB / assets 25 / scripts 11 / images 12 / videos 0`
- `/products` 5 次连续 HTML：第一次冷启动约 `2007 ms`，后续 `292 ms`、`306 ms`、`343 ms`、`299 ms`
- `/cases`：`HTTP 200 / HTML 128 ms / known 4070.8 KB`
- `/about`：`HTTP 200 / HTML 124 ms / known 3799 KB`
- `/faq`：`HTTP 200 / HTML 123 ms / known 957.3 KB`

线上结论：

- 首页首屏视频资源已从 HTML 可发现资源中移除，线上资源审计视频数为 `0`。
- `/products` 仍可能有部署冷启动，但 warm path 已从秒级降到约 `300 ms` 级。
- 本轮达到“打开页面明显变轻”的第一批目标；剩余 case/about 图片和 route JS 进入下一轮候选，不在本次继续展开。
