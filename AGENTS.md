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
- 普通主站联系/留资/采购咨询入口统一走新站 `/contact` 和后台 `leads` 闭环，不再默认跳旧站 `https://en.303vessel.cn/contact.html`。
- 普通主站查看产品入口统一走新站 `/products`，不再默认跳旧站 `https://en.303vessel.cn/products_list.html`。
- `/global` 是唯一明确例外：在新站正式接管 Global 生产链路前，Global 内的 Contact / Products 继续跳旧 303 联系和产品页；不要为了普通主站任务顺手改 `/global`。
- 300.cn 后台只允许只读查看、下载、对照和必要的页面字段读取/填写；不得保存、发布、上传、发送、删除、付款、购买或执行任何真实变更。300 后台账号密码只从本机 env 使用，不能写入文档、commit 或聊天输出。
