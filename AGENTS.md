# vessel303 AGENTS.md

默认用中文和 Wynne 沟通；代码、命令、文件名、API、package、技术名词保留 English。

本文件只写工作纪律。项目技术地图、目录职责、子线程分工、验证命令和部署规则见 `CODEX.md`。

## 开始前必须做

- 改代码或整理文件前，先读本文件、`CODEX.md`、`package.json` 和相关代码/文档。
- 开始执行前说明：当前理解、涉及文件、风险点、执行步骤。
- 不知道就说不知道；没有验证就说未验证。
- 不要把记忆、推测、旧截图当成当前状态；用当前 worktree、命令输出、线上检查作为依据。

## 工作边界

- `repo-git/` 是唯一代码仓库。
- `vessel303-assets/` 是唯一素材库入口。
- `00_项目总控入口/vessel303_当前总控handoff.md` 是当前总控入口。
- 不要在根目录继续制造新的素材库、临时项目目录或重复入口。
- 不要碰与当前任务无关的文件，不要顺手重构。

## 安全边界

未经 Wynne 明确授权，不得执行：

- 删除文件或不可逆清理。
- 数据库迁移或生产数据库重大写入。
- 修改权限、认证、支付、订单、会员、代理价、国家版本价格规则。
- push 到 `main` 或触发生产上线。
- 输出密码、密钥、token、cookie、数据库连接串或 300 后台账号信息。

已授权执行某一批任务时，也必须保持批次边界清楚、可回滚、可验证。

## 300 后台与 en303 对照

- `300.cn 后台` 只允许只读学习、截图对照、字段观察和必要资料下载。
- 不得在 300 后台保存、发布、上传、删除、付款、购买、提交表单或修改配置。
- `en.303vessel.cn` 只作为公开站对照，不把未经确认的业务事实硬编码进新站。

## 高风险模块

- `/global`、MapLibre、MapTiler、`/api/map` 属于高风险链路；非明确任务不要触碰。
- Auth.js v5 使用 split config；`proxy`/middleware 不得 import `src/auth.ts`。
- 大文件上传必须走 Vercel Blob client upload，不得把大文件 body 直接打到 API route。
- 后台权限必须服务端校验，不能只靠前端隐藏按钮。

## 执行与验证

- 修改前先看 `git status --short --branch`。
- 一个批次只处理一个明确模块或一类归档问题。
- 修改后优先运行相关检查，例如 targeted eslint、`tsc --noEmit`、`npm run build`、内容审计或目录 inventory。
- 无法运行检查时，说明原因和替代验证。
- 完成后说明：改了哪些文件、为什么改、如何验证、还有什么风险。

## Git 与上线

- `main` 会触发 Vercel production deployment。
- commit、push、等待 Vercel READY 和线上复验只在 Wynne 授权的批次内执行。
- push 前必须确认将推送的 commit、当前分支状态和远端同步状态。

## 文档维护

- `AGENTS.md` 保持短、硬、稳定，只写纪律。
- `CODEX.md` 写技术规则、目录职责和业务型 00-11 分工。
- handoff 写当前总控状态和历史摘要；不要再无限追加长流水账。
