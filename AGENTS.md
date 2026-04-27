<!-- BEGIN:nextjs-agent-rules -->
# 这不是你记忆里的 Next.js

本项目使用的 Next.js 版本有破坏性变化。API、约定和文件结构都可能不同于旧经验。写代码前必须先读 `node_modules/next/dist/docs/` 里的相关本地文档，并留意废弃提示。
<!-- END:nextjs-agent-rules -->

# vessel303 Codex 入口规则

本仓库是 VESSEL 微宿国际 B2B 官网 `vessel303.com` 的生产代码。

开始改代码前，先读 `CODEX.md`。它是 Codex 专用的项目接手和操作文档。`CLAUDE.md` 是另一个模型留下的历史上下文，可以参考，但除非 Wynne 明确要求，不要主动修改。

默认用中文和 Wynne 沟通。工作区里可能有 Wynne 正在整理的文件，任何与当前任务无关的改动都不要碰。

后续如果需要更新 `AGENTS.md` 或 `CODEX.md`，先通知 Wynne 说明原因，获得授权后再提交和推送。

推送 `main` 会触发 Vercel 生产部署。只有 Wynne 在当前任务里明确授权提交/推送/上线时，才可以 push。

必须记住的硬规则：

- `/global` 的 MapTiler 代理和 MapLibre 请求链路很脆，改之前必须读 `CODEX.md` 和相关代码。
- Auth.js v5 使用 split config，middleware/proxy 不能 import `src/auth.ts`。
- 大文件上传必须走 Vercel Blob client upload，不能把文件 body 直接打到 API route。
- 管理员安全限制必须在服务端实现，不能只靠前端 UI 禁用。
- 联系/留资入口统一跳 `https://en.303vessel.cn/contact.html`。
- 查看产品入口统一跳 `https://en.303vessel.cn/products_list.html`。
