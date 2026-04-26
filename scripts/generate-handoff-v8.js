#!/usr/bin/env node
// Build vessel303_handoff_V8_0.docx
//
// Strategy: load v7-content.json (verbatim V7.0 paragraphs + tables),
// re-emit blocks 0..148 unchanged, then for the V8.0 update:
//   • inject the full V8.0 entry into 第三部分 (after V7.0)
//   • REPLACE 第四部分 (当前状态) with the V8.0-current content
//   • KEEP 第五部分 (三期开发规划)
//   • REPLACE 第六部分 (新对话启动模板) with V8.0 template
//   • DROP 第七部分 (V8.0 预告 — superseded by the actual V8.0 entry)
//
// Run: node scripts/generate-handoff-v8.js
// Output: ~/Desktop/vessel303/vessel303_handoff_V8_0.docx (NOT pushed to git)

const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, LevelFormat,
} = require('docx')

const V7 = require('./v7-content.json')
const OUT = path.join(__dirname, '..', 'vessel303_handoff_V8_0.docx')

// ── Brand palette (matches V7.0) ─────────────────────────────────────────────
const ORANGE = 'E36F2C'
const BODY = '1A1A1A'
const GRAY = '666666'
const TABLE_HEAD_BG = 'FFF1E8'
const TABLE_BORDER = 'D9D2C9'

// ── Helpers ──────────────────────────────────────────────────────────────────
function P(text, opts = {}) {
  const {
    style, heading, bold, color, size, align, spacingAfter,
  } = opts
  return new Paragraph({
    style,
    heading,
    alignment: align,
    spacing: spacingAfter !== undefined ? { after: spacingAfter } : undefined,
    children: [new TextRun({
      text: text || '',
      bold,
      color,
      size,
      font: { name: 'PingFang SC' },
    })],
  })
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, color: ORANGE, size: 36, font: { name: 'PingFang SC' } })],
  })
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, color: BODY, size: 28, font: { name: 'PingFang SC' } })],
  })
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, bold: true, color: BODY, size: 24, font: { name: 'PingFang SC' } })],
  })
}
function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.align,
    children: [new TextRun({
      text: text || '',
      bold: opts.bold,
      color: opts.color || BODY,
      size: opts.size || 22,
      font: { name: 'PingFang SC' },
    })],
  })
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, color: BODY, font: { name: 'PingFang SC' } })],
  })
}
function spacer() {
  return new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } })
}

function singleBorder() {
  return {
    top:    { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
    left:   { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
    right:  { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
  }
}

function makeTable(rows, opts = {}) {
  const { headerRow = true } = opts
  const widthPct = 100
  return new Table({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    rows: rows.map((cells, ri) => new TableRow({
      tableHeader: ri === 0 && headerRow,
      children: cells.map(text => new TableCell({
        borders: singleBorder(),
        shading: ri === 0 && headerRow
          ? { type: ShadingType.CLEAR, color: 'auto', fill: TABLE_HEAD_BG }
          : undefined,
        children: [new Paragraph({
          children: [new TextRun({
            text: String(text ?? ''),
            bold: ri === 0 && headerRow,
            color: BODY,
            size: 22,
            font: { name: 'PingFang SC' },
          })],
        })],
      })),
    })),
  })
}

// ── Re-emit any V7.0 block as docx-js child ─────────────────────────────────
function emitV7Block(b) {
  if (b.kind === 'table') {
    return [makeTable(b.rows), spacer()]
  }
  // paragraph
  const text = b.text || ''
  if (b.style === 'Heading1') return [h1(text)]
  if (b.style === 'Heading2') return [h2(text)]
  if (b.style === 'Heading3') return [h3(text)]
  if (b.style === 'ListParagraph') return [bullet(text)]
  // Normal — try to detect title-block leading lines (first 4 blocks)
  return [body(text)]
}

// ── Title block (special styling for blocks 0..4) ────────────────────────────
function titleBlock() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'VESSEL 微宿®', bold: true, color: ORANGE, size: 48, font: { name: 'PingFang SC' } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'vessel303.com 项目全量文档', bold: true, color: BODY, size: 32, font: { name: 'PingFang SC' } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: '含版本历史 · 环境配置 · 业务逻辑 · 当前状态 · 待办事项', color: GRAY, size: 22, font: { name: 'PingFang SC' } })],
    }),
    body(
      '⚠️ 此文档为全量文档,每次更新只增不删,新版本完整替代旧版本。更新时请保留所有历史版本信息,仅在版本历史、当前状态、待办事项三个部分做覆盖更新。',
      { color: ORANGE }
    ),
    spacer(),
  ]
}

// ── V8.0 NEW CONTENT ─────────────────────────────────────────────────────────

function v8VersionEntry() {
  const out = []

  out.push(h2('V8.0 · 2026-04-21 ~ 04-26 · 管理员后台 MVP + /global 性能与稳定性大修'))

  out.push(h3('整体目标'))
  out.push(body('V8.0 两条并行主线:'))
  out.push(bullet('主线 1:从零搭建 vessel303.com 自营管理员后台 /admin(MVP 范围:登录鉴权 / 线索 / 用户 / 图片库 / 数据看板)'))
  out.push(bullet('主线 2:修复销售反馈的 /global 中国手机端加载慢问题,在排查过程中暴露并修复了更深层的代理 bug'))
  out.push(spacer())

  // ── 主线 1: Admin backend ──────────────────────────────────────────────
  out.push(h3('主线 1:管理员后台 V8.0 Step 1-5'))
  out.push(body('技术路线:Next.js 14 App Router + Auth.js v5 split config + Neon Postgres + Vercel Blob + 手写 UI 组件(Tailwind v4 兼容)。后续 V8.1/V8.2 在此基础上加新闻/产品 CMS。'))
  out.push(spacer())

  out.push(h3('Step 1 · 地基(2026-04-21)'))
  out.push(bullet('Auth.js v5 split config 模式:src/auth.config.ts 极简版给 middleware(无 DB 调用,Edge Runtime 兼容)'))
  out.push(bullet('src/auth.ts 完整版给 server,含数据库 adapter + signIn/jwt/session callbacks'))
  out.push(bullet('middleware.ts 拦截 /admin/* 未登录跳 /admin/login;role 检查移到 admin layout server component(双保险)'))
  out.push(bullet('DB 5 张表:users 扩 role/identity 字段 + leads + news + uploads + admin_logs'))
  out.push(bullet('白名单常量 src/lib/admin-whitelist.ts,硬编码 wynnewbd@gmail.com'))
  out.push(bullet('/admin/login 页(暗底橙字 + 邮箱魔法链接 + Google OAuth 按钮)'))
  out.push(bullet('robots.txt 禁抓 /admin'))

  out.push(h3('Step 2 · UI 框架(2026-04-21)'))
  out.push(bullet('Tailwind v4 + shadcn CLI 不兼容(CLI 强制建 tailwind.config.ts),改用手写组件方案'))
  out.push(bullet('新装依赖:class-variance-authority + clsx + tailwind-merge + lucide-react'))
  out.push(bullet('手写 UI 组件 9 个在 src/components/ui/(card/button/dialog/sheet/input/textarea/select/badge/switch)'))
  out.push(bullet('AdminShell 客户端组件 + AdminHeader(usePathname 动态标题)'))
  out.push(bullet('6 个菜单 sidebar:概览 / 线索管理 / 用户管理 / 新闻管理 / 图片库 / 设置'))
  out.push(bullet('Dashboard 4 张数据卡片(初版假数据)+ 5 个 Coming Soon 占位页'))

  out.push(h3('Step 3 · 线索管理(2026-04-23)'))
  out.push(bullet('4 个 API routes:GET/POST 列表 + GET/PATCH/DELETE 详情 + GET 导出 CSV'))
  out.push(bullet('requireAdmin() helper 鉴权(src/lib/auth-check.ts)'))
  out.push(bullet('src/lib/leads-db.ts 数据库封装(listLeads/exportLeads/getLead/createLead/updateLead/softDeleteLead/countLeadsByStatus/logAdminAction)'))
  out.push(bullet('LeadsClient.tsx 筛选栏 + 表格 + 详情 Sheet + Dialog'))
  out.push(bullet('状态机 5 档:new → contacting → quoted → won/lost,5 色 Badge 系统'))
  out.push(bullet('CSV UTF-8 BOM 解决 Excel 中文乱码'))
  out.push(bullet('Dashboard 接真实数据(safeCount + try-catch 防挂)'))
  out.push(bullet('Sidebar Leads 角标显示 status=\'new\' 数量'))

  out.push(h3('Step 4 · 用户管理(2026-04-23)'))
  out.push(bullet('DB migration 加 disabled BOOLEAN + last_login_at TIMESTAMP'))
  out.push(bullet('Auth.js signIn callback 加 last_login_at 更新(只在真实登录事件写一次)+ disabled 拒绝登录'))
  out.push(bullet('4 个 API routes 含 export CSV'))
  out.push(bullet('UsersClient.tsx 含白名单识别(行背景淡橙 bg-[#E36F2C]/5 + Shield 角标)'))
  out.push(bullet('自我保护机制三道闸:服务端 PATCH 拒绝 admin 改自己 role / 拒绝禁用自己 / 白名单用户 role 不可改;客户端 UI 同步禁用控件'))
  out.push(bullet('详情 Sheet:角色 Select + 身份 Select + 禁用 Switch + 关联 leads/news 统计'))
  out.push(bullet('getUserSummary 用单 SQL CTE 聚合 total/admins/disabled/untagged 避免 4 次 round-trip'))
  out.push(bullet('Google 用户没密码,用 password IS NULL 判断来源("Google" vs "Email")'))
  out.push(bullet('Dashboard 总用户数接真实数据,底部副标"管理员 X · 已禁用 Y"'))

  out.push(h3('Step 5 · 图片库 + Vercel Blob(2026-04-23)'))
  out.push(bullet('Vercel Blob Store 创建:vessel303-media,Public 模式,sin1 区域,环境变量 BLOB_READ_WRITE_TOKEN 自动注入项目'))
  out.push(bullet('装 @vercel/blob 2.3.3'))
  out.push(bullet('第一版踩坑:Vercel Serverless Functions 4.5MB request body 硬限制,5MB 以上图片 413 失败'))
  out.push(bullet('第二版正解:改用 @vercel/blob/client 的 upload() 客户端直传方案'))
  out.push(bullet('  浏览器直接传 Blob,API route 只发签名 token', 1))
  out.push(bullet('  onUploadCompleted 服务端回调写 DB', 1))
  out.push(bullet('  size/originalName 通过 clientPayload → tokenPayload 透传', 1))
  out.push(bullet('  单文件上限放宽到 50MB', 1))
  out.push(bullet('API routes:POST(client uploads token)+ GET 列表 + GET/[id] 详情 + DELETE'))
  out.push(bullet('MediaClient.tsx:网格 + 单/批量上传 + 全屏拖拽蒙层(dragCounter 防抖解决子元素闪烁)+ 真实 XHR 进度条 + 详情 Sheet'))
  out.push(bullet('串行上传(for await uploadOne)更稳定,避免 Vercel Blob 单请求节流'))
  out.push(bullet('上传成功延迟 1.5s 等 onUploadCompleted 完成 DB 写入再刷新列表'))
  out.push(bullet('Sidebar 角标 clampBadge(">99") + Dashboard 卡片接真实数据'))
  out.push(bullet('实测 13MB 图片可正常上传'))

  out.push(h3('V8.0 Step 1-5 关键技术决策'))
  out.push(bullet('Tailwind v4 + shadcn:CLI 不兼容,全部手写组件,反而 bundle 更轻、版本可控'))
  out.push(bullet('Auth.js v5 Edge Runtime 限制:必须 split config,middleware 用极简 authConfig(无 DB),完整 auth 留给 server component。这是 Auth.js v5 文档官方推荐模式'))
  out.push(bullet('Vercel Blob 4.5MB 限制是平台级硬限制:必须用 client uploads,不是代码层能突破的。这是 V8.0 + 未来所有大文件上传(产品多图、PDF 规格书)的统一方案'))
  out.push(bullet('数据库软删 vs 硬删的语义化选择:leads 软删(deleted_at,业务有审计需求);uploads 硬删(图片库场景软删无意义,Blob 也跟着删了);users 不删只 disabled'))
  out.push(bullet('自我保护原则在服务端实现:客户端 UI 禁用只是 UX,真正的闸门在 API PATCH 里。admin 不能锁死自己'))
  out.push(bullet('数据库聚合查询用 CTE:多个 count 用单 SQL 跑完(getUserSummary),避免 N 次 round-trip'))

  out.push(h3('V8.0 后续计划'))
  out.push(bullet('Step 6 · 新闻管理 + Tiptap 极简版富文本(11 个按钮)+ 双语 JSONB + 草稿/发布 + 封面图选 Media 库已上传图(下一步)'))
  out.push(bullet('Step 7 · 设置页(白名单管理 + 系统配置)'))
  out.push(bullet('Step 8 · 收尾:Resend 域名验证 + Vercel "Needs Attention" 警告清理'))
  out.push(bullet('V8.1 · 2-3 周:项目 CMS(showcaseProjects 迁移)+ 案例 CMS'))
  out.push(bullet('V8.2 · 3-4 周:产品 CMS(39 SKU 迁移 + 多图管理)+ i18n 文案管理'))
  out.push(spacer())

  // ── 主线 2: /global rescue ────────────────────────────────────────────
  out.push(h3('主线 2:/global 性能与稳定性大修(2026-04-25 ~ 04-26)'))
  out.push(body('背景:销售反馈中国手机端 /global 加载慢。在排查与优化过程中暴露出更深层的代理 bug,整个链路被反复迭代,最终全部修复。'))
  out.push(spacer())

  out.push(h3('完整 commit 时间线'))
  out.push(makeTable([
    ['commit', '内容', '结果'],
    ['8388bb8', 'A · 删 layout 里指向 api.maptiler.com 的死 preconnect(proxy 引入后已无效),换成真正有用的 <link rel="preload"> 抓 style.json', '保留'],
    ['d1d413b', 'C · 把 edge proxy 函数 pin 到 hkg1(Vercel 香港 PoP)', '立刻引发问题 1,已回滚'],
    ['2904513', 'D · 创建 MapSkeleton.tsx,SSR HTML / dynamic loading prop / map 内部 spinner 三处共用,首屏不再黑屏', '保留'],
    ['51e732e', 'B · 新建 showcaseMarkers.ts(40 项 slim 数据);showcaseProjects.ts 全量数据和 ProjectDetail.tsx 改 dynamic import,只在点 marker 时下载', '保留'],
    ['4f15be8', 'fix · 回滚 hkg1 region pin(问题 1)', '修复'],
    ['4e916a9', 'fix · proxy 强制带 Referer: https://www.vessel303.com/(满足 MapTiler key referrer-lock)(问题 2)', '修复 致命'],
    ['0ed7869', '加 try/catch + 25s 超时 + 错误 UI;preload 删 crossOrigin 避免双取', '部分回滚(超时撤了)'],
    ['42357b7', '加 localIdeographFontFamily,跳过 ~10 个 ~80KB CJK glyph PBF 下载', '保留'],
    ['c250709', 'fix · proxy 停止 rewrite api.maptiler.com host,只剥 ?key=(问题 3:setLanguage 域名检查)', '修复'],
    ['7759c2f', 'fix · 删除 25s 超时和 map.on(\'error\') 自动升级 fatal 的逻辑(问题 4)', '修复'],
    ['c86eaa9', 'fix · transformRequest 返回绝对 URL,worker 可解析(问题 5)', '修复 终极'],
  ]))
  out.push(spacer())

  out.push(h3('问题 1:pin region 导致全部 403'))
  out.push(bullet('现象:用户报"现在还是卡,完全打不开了"'))
  out.push(bullet('排查:curl /api/map/* 直接 403'))
  out.push(bullet('真因:Vercel 当前套餐不允许 preferredRegion = \'hkg1\',函数被平台层直接拒绝'))
  out.push(bullet('修复 4f15be8:回滚 C,让 region 自动选'))

  out.push(h3('问题 2:MapTiler key 是 Referrer-locked,proxy 没转发(致命)'))
  out.push(bullet('现象:回滚 C 之后还是 403'))
  out.push(bullet('排查:直接 curl https://api.maptiler.com/... 也是 403 "Key usage restricted";带 Referer: https://www.vessel303.com/ 立即变 200'))
  out.push(bullet('真因:MapTiler 控制台给这个 key 设了 referer 白名单(限定 vessel303.com)。浏览器直连 MapTiler 时自动带 Referer 所以正常。4/25 上午引入 edge proxy(commit 8796e02)的那一刻,server-side fetch() 默认不带 Referer → MapTiler 一律 403 → 从那时起 /global 完全打不开。之后所有"性能优化"都建立在错误前提上'))
  out.push(bullet('修复 4e916a9:proxy 强制带 Referer: https://www.vessel303.com/(优先用调用方的 Referer,否则 fallback)'))

  out.push(h3('问题 3:地图标签显示字面 "name:en",语言切换失效'))
  out.push(bullet('现象:用户看到所有国家名字渲染成字面 name:en,按钮切换中英文无效'))
  out.push(bullet('排查:读 node_modules/@maptiler/sdk/dist/maptiler-sdk.mjs 的 setPrimaryLanguage 源码,发现里面有:if (new URL(f.url).host !== W.maptilerApiHost) continue —— SDK 只对 source URL 的 host 是 api.maptiler.com 的图层重写 text-field'))
  out.push(bullet('真因:早上 proxy 把 style.json 里所有 https://api.maptiler.com/ 都 rewrite 成 https://www.vessel303.com/api/map/。SDK 域名检查 → 跳过所有图层 → text-field 保留 MapTiler 默认的 {name:en} 模板。而 maplibre-gl v5(5.23.0)已经不再支持 {...} token 语法,直接渲染成字面字符串'))
  out.push(bullet('修复 c250709:proxy 停止 rewrite host,只剥 ?key=。客户端 transformRequest 已经会把每个 api.maptiler.com 请求重定向到 proxy,缓存收益不变'))

  out.push(h3('问题 4:25s 超时把"慢"误判为"失败"'))
  out.push(bullet('现象:第二天用户看到"地图加载失败"卡片'))
  out.push(bullet('排查:proxy 返回 200,但单瓦片冷启动 13s,多瓦片串起来超 25s'))
  out.push(bullet('真因:0ed7869 加的 25s 超时是为了避免"无限转圈",但在用户真实网络下成了规则触发器。地图其实在正常加载,是代码主动报错'))
  out.push(bullet('修复 7759c2f:删除 25s 超时和 map.on(\'error\') 自动升级为 fatal 的逻辑,只保留 WebGL2 不支持的同步 catch'))

  out.push(h3('问题 5:底图全空,只有橙色点(终极问题)'))
  out.push(bullet('现象:用户报告"打开后只有营地的橙色点,没有底下的地图"。橙色 marker、五角星、中英文切换、版权都正常,但 vector tile 渲染的内容(陆地、海洋、国家边界、地名)全部不出来'))
  out.push(bullet('排查:headless Chrome 复现,console 反复打 [VESSEL] map error,但 markers 已成功创建(说明 map.on(\'load\') 触发过),矛盾'))
  out.push(bullet('真因:c250709 之后,maplibre 拿到的 source URL 是 https://api.maptiler.com/tiles/v3/tiles.json,走 transformRequest 重写到 /api/map/tiles/v3/tiles.json(相对路径)'))
  out.push(bullet('  主线程 fetch(style.json、sprite、glyphs)能用 document.baseURI 解析相对路径 → 正常', 1))
  out.push(bullet('  maplibre v5 的 vector tile 在 Web Worker 里 fetch,worker 没有 document context → 相对路径无法解析 → 每个 tile 请求都失败 → 底图空白', 1))
  out.push(bullet('修复 c86eaa9:transformRequest 返回绝对 URL(${window.location.origin}/api/map/...),worker 能正确 resolve'))
  out.push(spacer())

  out.push(h3('当前最终方案(commit c86eaa9)'))

  out.push(body('1. Edge proxy(src/app/api/map/[...path]/route.ts)', { bold: true }))
  out.push(bullet('runtime: edge(不 pin region,让 Vercel 自动选)'))
  out.push(bullet('转发请求到 https://api.maptiler.com/<path>,自动注入 MAPTILER_KEY'))
  out.push(bullet('强制设 Referer: https://www.vessel303.com/(满足 referrer-lock,否则 403)'))
  out.push(bullet('不 rewrite api.maptiler.com host(让 SDK 的 setLanguage host 检查通过)'))
  out.push(bullet('只剥 ?key= 字符串(API key 不暴露给浏览器)'))
  out.push(bullet('cache-control:JSON 1h browser / 24h CDN / 7d SWR;tile/sprite/glyph 1 年 immutable'))

  out.push(body('2. 地图组件(src/components/GlobalMapML.tsx)', { bold: true }))
  out.push(bullet('style 入口:/api/map/maps/streets-v2-dark/style.json(走 proxy)'))
  out.push(bullet('transformRequest:把 api.maptiler.com URL 重写成绝对的 ${origin}/api/map/<path>,worker 可解析'))
  out.push(bullet('localIdeographFontFamily:用本地中文字体渲染 CJK,跳过约 10 个 ~80KB 的字形 PBF 下载(中国移动端最大单点优化)'))
  out.push(bullet('try/catch 包 new MaptilerMap(...):WebGL2 不支持时显示"请用 Chrome / Safari"提示,不会无限转圈'))
  out.push(bullet('map.on(\'error\') 只 console.warn,不主动弹失败 UI'))

  out.push(body('3. 入口页(src/app/global/page.tsx)', { bold: true }))
  out.push(bullet('<link rel="preload" as="fetch" href="/api/map/.../style.json">(没有 crossOrigin,让 maplibre 内部 fetch 能复用浏览器 preload 缓存)'))
  out.push(bullet('<Suspense fallback={<MapSkeleton />}> 包 GlobalMapView,SSR HTML 首帧就有橙色 spinner'))

  out.push(body('4. 数据分割', { bold: true }))
  out.push(bullet('src/data/showcaseMarkers.ts(新文件):40 个 slim 项 {id, name, coordinates},跟随地图首屏 JS chunk(~5KB)'))
  out.push(bullet('src/data/showcaseProjects.ts(全量数据,~120KB):dynamic-import,仅在点击 marker 或深链 ?camp=xxx 时下载'))
  out.push(bullet('src/components/ProjectDetail.tsx:dynamic-import,与 showcaseProjects 同时下载'))

  out.push(body('5. 共享加载骨架(src/components/MapSkeleton.tsx,新文件)', { bold: true }))
  out.push(bullet('SSR fallback、dynamic loading prop、map 内部 spinner 三处共用'))
  out.push(bullet('双语标签 加载中 · LOADING'))
  out.push(spacer())

  out.push(h3('性能收益(与 4/25 上午的版本对比)'))
  out.push(bullet('首屏 JS chunk 瘦身约 25 KB gzipped(splitting)'))
  out.push(bullet('首次渲染中文标签省 ~10 个 PBF / ~800 KB(localIdeographFontFamily)'))
  out.push(bullet('浏览器拿到 HTML 立刻看到加载骨架(不再黑屏)'))
  out.push(bullet('边缘代理 + Vercel CDN:瓦片首次 cold-miss 后 1 年免回源'))

  out.push(h3('兜底'))
  out.push(bullet('WebGL2 不支持 → 友好提示页(不会无限转圈)'))
  out.push(bullet('网络慢 → 继续转圈(不再误报"加载失败")'))
  out.push(bullet('错误细节 → console.warn(不打扰用户)'))

  out.push(h3('教训记下来防再犯'))
  out.push(bullet('proxy 替换上游域名要测整条链路:从 SDK 内部到 worker 的所有 fetch 路径,不要只测主线程'))
  out.push(bullet('transformRequest 必须返回绝对 URL(maplibre v5 worker 不能 resolve 相对路径)'))
  out.push(bullet('不要给可能正常的状态加超时式失败 UI:超时阈值在 China mobile + cold cache 下太容易触发,要么超过 60s,要么干脆不加'))
  out.push(bullet('依赖第三方 SDK 的 host 检查这种隐式逻辑要先读 SDK 源码:MapTiler SDK V4 的 setLanguage host 检查是只有读 dist 才能发现的'))
  out.push(bullet('Referrer-lock 的 API key 套了 server-side proxy 后必须显式设 Referer header'))
  out.push(spacer())

  return out
}

function v8CurrentStatus() {
  const out = []

  out.push(h1('第四部分:当前状态(截至 2026-04-26)'))

  out.push(h2('4.1 已上线功能清单'))
  out.push(makeTable([
    ['模块', '状态', '说明'],
    ['前端官网 8 个核心页面', '已上线', '首页 / 产品列表 / 产品详情(V9 Gen6 等) / About / FAQ / News / Contact / /global'],
    ['/global 全球地图', '已上线 V8.0 大修', 'MapTiler edge proxy + CJK 本地字体 + 数据分割 + 加载骨架。中国移动端首屏可用'],
    ['后台 /admin (Step 1-5)', '已上线 V8.0', 'Dashboard / Login / Leads / Users / Media,5 个模块完成,3 个 Coming Soon'],
    ['留资 / 联系跳转', '已上线', '统一跳 https://en.303vessel.cn/contact.html'],
    ['图片防盗(ProtectedImage)', '已上线', '5 个固定区块(产品列表 / V9 Gen6 详情 / About 工厂图 / ProjectDetail / 首页项目网格)'],
    ['多语言中英文切换', '已上线', 'LanguageContext + 全站 UI + /global MapTiler setLanguage'],
  ]))
  out.push(spacer())

  out.push(h2('4.2 后台路由清单(V8.0 新增)'))
  out.push(makeTable([
    ['路由', '说明', '状态'],
    ['/admin', 'Dashboard 4 张实时数据卡', '已上线'],
    ['/admin/login', '邮箱魔法链接 + Google OAuth', '已上线'],
    ['/admin/leads', '线索管理(列表 / 筛选 / Sheet / CSV)', '已上线'],
    ['/admin/users', '用户管理(列表 / 角色 / 禁用 / CSV)', '已上线'],
    ['/admin/media', '图片库(网格 / 拖拽上传 / 详情 / Vercel Blob)', '已上线'],
    ['/admin/news', '新闻管理 + Tiptap 富文本', 'Step 6 实施中'],
    ['/admin/settings', '系统配置 + 白名单管理', 'Step 7 计划'],
  ]))
  out.push(spacer())

  out.push(h2('4.3 API routes(V8.0 新增)'))
  out.push(bullet('/api/admin/leads (GET / POST), /[id] (GET / PATCH / DELETE), /export (GET CSV)'))
  out.push(bullet('/api/admin/users (GET), /[id] (GET / PATCH), /export (GET CSV)'))
  out.push(bullet('/api/admin/media (GET / POST client upload token), /[id] (GET / DELETE)'))
  out.push(bullet('/api/map/[...path] (GET edge proxy → MapTiler)'))
  out.push(spacer())

  out.push(h2('4.4 关键文件路径(累积清单,只增不删)'))
  out.push(h3('V8.0 新增'))
  out.push(bullet('src/auth.config.ts / src/auth.ts(Auth.js v5 split config)'))
  out.push(bullet('src/middleware.ts(/admin/* 鉴权)'))
  out.push(bullet('src/lib/admin-whitelist.ts(硬编码白名单)'))
  out.push(bullet('src/lib/auth-check.ts(requireAdmin helper)'))
  out.push(bullet('src/lib/leads-db.ts / users-db.ts / uploads-db.ts(数据库封装)'))
  out.push(bullet('src/lib/blob-client.ts(Vercel Blob 封装)'))
  out.push(bullet('src/components/admin/AdminShell.tsx(客户端 layout)'))
  out.push(bullet('src/components/admin/LeadsClient.tsx / UsersClient.tsx / MediaClient.tsx'))
  out.push(bullet('src/components/ui/*.tsx(手写 9 个 UI 组件)'))
  out.push(bullet('src/app/api/map/[...path]/route.ts(MapTiler edge proxy)'))
  out.push(bullet('src/data/showcaseMarkers.ts(地图首屏 slim 数据)'))
  out.push(bullet('src/components/MapSkeleton.tsx(地图加载骨架)'))
  out.push(bullet('scripts/migrate-v8.js / migrate-v8-step3.js / migrate-v8-step4.js(数据库迁移脚本)'))
  out.push(h3('V7.0 及之前(保留)'))
  out.push(bullet('src/components/GlobalMapML.tsx(地图组件)'))
  out.push(bullet('src/components/GlobalMapView.tsx(地图容器)'))
  out.push(bullet('src/components/ProjectDetail.tsx(项目详情面板)'))
  out.push(bullet('src/components/ProtectedImage.tsx(图片防盗)'))
  out.push(bullet('src/data/showcaseProjects.ts(全量项目数据)'))
  out.push(bullet('src/data/camps.ts(营地点位数据)'))
  out.push(bullet('src/contexts/LanguageContext.tsx(中英文切换)'))
  out.push(spacer())

  out.push(h2('4.5 新增依赖(V8.0)'))
  out.push(bullet('@vercel/blob 2.3.3(图片库存储,client uploads 方案)'))
  out.push(bullet('class-variance-authority(手写 UI 组件 variant 管理)'))
  out.push(bullet('clsx + tailwind-merge(className 合并)'))
  out.push(bullet('lucide-react(图标库)'))
  out.push(spacer())

  out.push(h2('4.6 新增环境变量(V8.0)'))
  out.push(bullet('BLOB_READ_WRITE_TOKEN(Vercel Blob,自动注入,无需手动设置)'))
  out.push(bullet('MAPTILER_KEY(原来在客户端,V8.0 改在 server-side edge proxy 用)'))
  out.push(spacer())

  // ── 4.7 展示项目资料模板 (V7.0 沿用,只增不删) ────────────────────────────
  out.push(h2('4.7 展示项目资料模板(团队收集用,V7.0 沿用)'))
  // Pull straight from V7 block 146 to keep the wording byte-identical
  const v7ProjTpl = V7.blocks[146]
  if (v7ProjTpl && v7ProjTpl.kind === 'table') {
    out.push(makeTable(v7ProjTpl.rows))
    out.push(spacer())
  }

  out.push(h2('4.8 待办事项(优先级排序,截至 2026-04-26)'))
  out.push(bullet('🔴 V8.0 Step 6:新闻管理 + Tiptap 极简版富文本(进行中)'))
  out.push(bullet('🔴 V8.0 Step 7:设置页(白名单管理 + 系统配置)'))
  out.push(bullet('🟡 V8.0 Step 8:Resend 域名验证 + Vercel "Needs Attention" 警告清理'))
  out.push(bullet('🟡 /global 代理商信息填充(留资数据接入)'))
  out.push(bullet('🟢 其余产品详情页(E7 / E6 / E3 / S5 / V5 / V7)'))
  out.push(bullet('🟢 其他 39 个展示项目资料收集'))
  out.push(bullet('🟢 V8.1:项目 CMS(showcaseProjects 迁移)+ 案例 CMS(2-3 周)'))
  out.push(bullet('🟢 V8.2:产品 CMS(39 SKU 迁移 + 多图管理)+ i18n 文案管理(3-4 周)'))
  out.push(bullet('🔵 证书图片打码 / Pixsy 盗图监控注册'))
  out.push(spacer())

  return out
}

function v8StartupTemplate() {
  const out = []

  out.push(h1('第六部分:新对话启动模板(V8.0,直接复制使用)'))
  out.push(body('━━━━━━━━━━ 复制以下内容到新对话 ━━━━━━━━━━', { color: GRAY }))
  out.push(spacer())

  out.push(body('我是 Wynne(何总),负责 vessel303.com B2B 国际站。请你作为这个项目的开发 agent。', { bold: true }))
  out.push(spacer())

  out.push(body('【项目基本信息】', { bold: true, color: ORANGE }))
  out.push(bullet('GitHub:https://github.com/WynneWBD/vessel303(public)'))
  out.push(bullet('部署:Vercel Pro,push main 自动部署 30-60s'))
  out.push(bullet('本地路径:~/Desktop/vessel303,macOS / zsh / 用户名 wynnewbd'))
  out.push(bullet('品牌色:#E36F2C(橙)、#1A1A1A(暗)、#F5F2ED(亮)'))
  out.push(bullet('技术栈:Next.js 14 App Router + TypeScript + Tailwind v4 + Auth.js v5 + Neon Postgres + Vercel Blob + Resend + MapLibre GL/MapTiler SDK'))
  out.push(spacer())

  out.push(body('【V8.0 进度】', { bold: true, color: ORANGE }))
  out.push(bullet('✅ Step 1-5 已上线(地基 / UI 框架 / 线索 / 用户 / 图片库)'))
  out.push(bullet('✅ /global 性能与稳定性大修完成(commit c86eaa9)'))
  out.push(bullet('🔴 Step 6 进行中:新闻管理 + Tiptap 极简富文本'))
  out.push(bullet('⏳ Step 7-8:设置页 + 收尾(Resend 域名 / Vercel 警告清理)'))
  out.push(spacer())

  out.push(body('【永久铁律 —— 改回会被骂】', { bold: true, color: ORANGE }))

  out.push(h3('A · 产品 UI 层(V7.0 沿用)'))
  out.push(bullet('/global 超级工厂五角星(佛山南海狮山):hover/click 都只显示 Tooltip popup(工厂名+地址),不弹详情面板,不跳转'))
  out.push(bullet('/global Navbar 副标:中文"全球营地部署" / 英文"Global Map"(不是 Global Deployment),手机和桌面均显示'))
  out.push(bullet('ProtectedImage 组件作用于 5 个固定区块:产品列表卡片 / V9Gen6 详情页图集 / About 工厂图网格 / ProjectDetail 项目详情 / 首页项目网格。不扩大不缩减'))
  out.push(bullet('广告法第九条禁用极限词(最严苛 / 顶级 / 最优质 / 唯一 / 第一 等),主观评价 → 客观事实'))

  out.push(h3('B · /global 地图技术架构(V8.0 新增,改回会重蹈 5 个 bug 覆辙)'))
  out.push(bullet('Edge proxy 必须显式设 Referer: https://www.vessel303.com/(MapTiler key 是 referrer-lock,server-side fetch 默认不带 Referer 会 403)'))
  out.push(bullet('Edge proxy 不要 rewrite api.maptiler.com host(否则 MapTiler SDK V4 setLanguage 域名检查失败 → 国家名渲染成字面 {name:en})'))
  out.push(bullet('客户端 transformRequest 必须返回绝对 URL(${origin}/api/map/...),maplibre v5 worker 不能 resolve 相对路径,否则 vector tile 全部 fetch 不到 → 底图空白只剩 markers'))
  out.push(bullet('不要给地图加载状态加超时式失败 UI(China mobile cold cache 容易误报),WebGL2 同步抛错的 catch 例外'))
  out.push(bullet('localIdeographFontFamily 必须保留:用本地中文字体渲染 CJK,省 ~10 个 ~80KB CJK glyph PBF 下载'))

  out.push(h3('C · 后台 /admin 安全(V8.0 新增)'))
  out.push(bullet('Vercel Serverless Functions 4.5MB 请求体硬限制,任何文件上传必须用 @vercel/blob/client 客户端直传方案,不是代码层能突破的'))
  out.push(bullet('admin 自我保护必须在服务端 PATCH 强制拒绝(改自己 role / 禁用自己 / 改白名单用户 role),客户端 UI 禁用只是 UX 不是闸门'))
  out.push(bullet('Vercel Blob client uploads 的 size / originalName 通过 clientPayload → tokenPayload 透传(签名 token 模式)'))
  out.push(bullet('Auth.js v5 split config:src/auth.config.ts 极简版给 middleware(无 DB,Edge 兼容),src/auth.ts 完整版给 server。不要在 middleware 里直接 import auth.ts'))
  out.push(spacer())

  out.push(body('【技术栈速查】', { bold: true, color: ORANGE }))
  out.push(bullet('环境变量命名:Auth.js v5 用 AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET(不是 GOOGLE_CLIENT_ID)'))
  out.push(bullet('MapLibre 必须 dynamic import + ssr:false;坐标顺序 [lng, lat] 和 Leaflet 相反'))
  out.push(bullet('Tailwind v4 用 @tailwindcss/postcss,不要建 tailwind.config.ts(shadcn CLI 不兼容,改用手写组件)'))
  out.push(bullet('Neon DB:/products/[slug]/page.tsx 必须 export const dynamic = \'force-dynamic\'(防构建超时)'))
  out.push(bullet('字体:DM Sans(标题) + Inter(正文) + PingFang SC / 微软雅黑(中文系统字体)'))
  out.push(bullet('MapTiler API key:7tbP0DIfmG9T8qWYxh5M(referrer-locked vessel303.com,server-side proxy 必须带 Referer)'))
  out.push(spacer())

  out.push(body('【联系跳转】', { bold: true, color: ORANGE }))
  out.push(bullet('"联系我们" / 留资入口 → https://en.303vessel.cn/contact.html(新窗口)'))
  out.push(bullet('"查看产品" → https://en.303vessel.cn/products_list.html(新窗口)'))
  out.push(spacer())

  out.push(body('【工作流程】', { bold: true, color: ORANGE }))
  out.push(bullet('每次动手前 git pull origin main'))
  out.push(bullet('每完成一个独立功能 git add . && git commit -m "..." && git push origin main'))
  out.push(bullet('Push 超时(罕见),fallback 给 Wynne 在普通终端:cd ~/Desktop/vessel303 && git push origin main'))
  out.push(bullet('大改动先建分支,不在 main 上做破坏性重构'))
  out.push(bullet('有歧义先问 Wynne,不要擅自决定'))
  out.push(spacer())

  out.push(body('【已知坑】', { bold: true, color: ORANGE }))
  out.push(bullet('Auth.js v5 用 AUTH_GOOGLE_ID 不是 GOOGLE_CLIENT_ID'))
  out.push(bullet('MapLibre 必须 dynamic import + ssr:false'))
  out.push(bullet('MapLibre 坐标 [lng, lat] 和 Leaflet 相反'))
  out.push(bullet('Tailwind v4 用 @tailwindcss/postcss(不建 config.ts)'))
  out.push(bullet('Neon DB 构建超时需 force-dynamic'))
  out.push(bullet('/global edge proxy 必须带 Referer 否则 MapTiler 403'))
  out.push(bullet('/global transformRequest 必须返回绝对 URL 否则 worker fetch 失败'))
  out.push(bullet('Vercel Serverless 4.5MB 限制,大文件用 @vercel/blob/client'))
  out.push(spacer())

  out.push(body('━━━━━━━━━━ 复制结束 ━━━━━━━━━━', { color: GRAY }))
  out.push(spacer())

  return out
}

// ── Assemble document ────────────────────────────────────────────────────────
const children = []

// Title block (custom styling, replaces V7 blocks 0..4)
children.push(...titleBlock())

// V7 blocks 5..136 verbatim (info table, maintenance notice, sections 1/2/3 up to V7.0 entry)
for (let i = 5; i <= 137; i++) {
  const b = V7.blocks[i]
  if (!b) continue
  // Patch the V7.0 doc-version row in the info table (block 5 is the table)
  if (i === 5 && b.kind === 'table') {
    const patched = b.rows.map(row => {
      if (row[0] === '文档版本') return ['文档版本', 'V8.0']
      if (row[0] === '更新日期') return ['更新日期', '2026-04-26']
      return row
    })
    children.push(makeTable(patched), spacer())
    continue
  }
  emitV7Block(b).forEach(el => children.push(el))
}

// Inject V8.0 entry into 第三部分 (after V7.0 entry, before 第四部分)
v8VersionEntry().forEach(el => children.push(el))

// REPLACE 第四部分 with V8.0 current status
v8CurrentStatus().forEach(el => children.push(el))

// V7 blocks 147..148 (第五部分 三期开发规划) — keep verbatim
for (let i = 147; i <= 148; i++) {
  const b = V7.blocks[i]
  if (!b) continue
  emitV7Block(b).forEach(el => children.push(el))
}

// REPLACE 第六部分 with V8.0 startup template
v8StartupTemplate().forEach(el => children.push(el))

// 第七部分 V8.0 预告 → DROPPED (superseded by the V8.0 entry above)

// Footer
children.push(spacer())
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({
    text: 'VESSEL 微宿® · vessel303.com · 文档版本 V8.0 · 2026-04-26 · 整理人 Wynne',
    color: GRAY,
    size: 20,
    font: { name: 'PingFang SC' },
  })],
}))

const doc = new Document({
  creator: 'Wynne',
  title: 'vessel303.com handoff V8.0',
  description: 'Full-context handoff doc (V1.0–V8.0)',
  styles: {
    default: {
      document: {
        run: { font: { name: 'PingFang SC' }, size: 22 },
      },
    },
  },
  sections: [{
    properties: {
      page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
    },
    children,
  }],
})

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf)
  const sizeKB = (buf.length / 1024).toFixed(1)
  console.log(`✓ Written ${OUT}`)
  console.log(`  size: ${sizeKB} KB`)
  console.log(`  total children blocks: ${children.length}`)
})
