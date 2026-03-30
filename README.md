# ✨ Intelligent UI Helper / 智能 UI 导师

**English** · A workspace that ships a **Figma plugin** powered by **Qwen** on **SiliconFlow**, plus an optional **web** UI tutor (Vite + React + Konva + Express).

**中文** · 本仓库包含：基于 **硅基流动 SiliconFlow + Qwen** 的 **Figma 插件**，以及可选的 **Web 画布导师**（Vite + React + Konva + Express）。

| | **English** | **中文** |
|---|-------------|----------|
| **Primary focus** | Figma plugin: chat, text-to-image, image edit | Figma 插件：对话、文生图、图像编辑 |
| **LLM (plugin)** | Qwen via SiliconFlow API | 通过 SiliconFlow 调用 Qwen 系列模型 |

---

## 📖 Introduction / 简介

### Figma plugin (`figma-ui-tutor/`) · Figma 插件

**EN** · The plugin UI runs in `ui-v3.html`. The main thread (`code.js`) exports selected layers as PNG, calls SiliconFlow **without browser CORS issues**, and supports bilingual UI (中文 / English).

**中文** · 界面在 `ui-v3.html`，主线程 `code.js` 负责导出选中图层、发起网络请求（绕过 iframe 的 CORS），并支持中英界面切换。

### Web app (repo root) · Web 应用（根目录）

**EN** · `package.json` defines a Vite + React frontend and an Express server (`server/`). The server currently proxies **xAI Grok** for structured UI generation—**separate** from the Figma plugin’s SiliconFlow setup. Use `npm run dev` to run both.

**中文** · 根目录 `package.json` 为 **Vite + React** 前端与 **Express** 后端（`server/`）。后端当前对接 **xAI Grok** 做结构化 UI 生成，与 Figma 插件的 **SiliconFlow** 配置**相互独立**。使用 `npm run dev` 同时启动前后端。

---

## ✨ Features / 特性

| Feature | EN | 中文 |
|---------|----|------|
| 💬 Chat | UI/UX mentor-style Q&A (Qwen chat model) | 设计导师式问答（Qwen 对话模型） |
| 🎨 Text-to-image | `/v1/images/generations` with T2I model | 文生图接口与文生图模型 |
| 🖼️ Image edit | Base64 PNG + JSON body from main thread | 主线程 JSON + Base64 图生图/编辑 |
| 🌐 i18n | Toggle 中文 / English in header | 标题栏切换中英 |
| ⚙️ Settings | API Key, Base URL, chat / T2I / I2I model IDs | API Key、Base URL、对话/文生图/图生图模型 |

---

## 🔑 SiliconFlow · Qwen (Figma plugin defaults) · 插件默认配置

**Default chat Base URL (also used to derive image endpoints)** · **默认对话 Base URL（生图 URL 由此推导）**

```text
https://api.siliconflow.cn/v1/chat/completions
```

**Default test API Key** · **默认测试 API Key**（⚠️ rotate if leaked · 泄露请尽快轮换）

```text
sk-yllgcljmiwlyxxyqpkuwyuyysbjuifthhsatfqccorotccqc
```

**Docs** · **文档**：[SiliconFlow API](https://docs.siliconflow.cn/) · [Models](https://cloud.siliconflow.cn/me/models)

**Typical model IDs** · **常用模型示例**

| Role | Example ID | 说明 |
|------|------------|------|
| Chat | `Qwen/Qwen2.5-7B-Instruct` | 纯文本对话 |
| Text-to-image | `Qwen/Qwen-Image` | 文生图 |
| Image edit | `Qwen/Qwen-Image-Edit-2509` | 图生图 / 编辑 |

---

## 🚀 Quick start / 快速开始

### A) Figma plugin · Figma 插件

**EN**

1. Open Figma → **Plugins** → **Development** → **Import plugin from manifest…**
2. Pick `figma-ui-tutor/manifest.json`
3. Run the plugin → **Settings** → paste API Key & adjust models if needed
4. After editing files: **Plugins** → **Development** → **Reload** (or reopen plugin)

**中文**

1. Figma → **插件** → **开发** → **从清单导入插件…**
2. 选择 `figma-ui-tutor/manifest.json`
3. 运行插件 → **设置** → 填写 API Key，按需调整模型
4. 改代码后：**插件** → **开发** → **重新加载**

### B) Web app (optional) · Web 应用（可选）

**EN** · Requires Node **18+**.

```bash
cd Intelligent-UI-Helper
npm install
copy .env.example .env   # Windows; use cp on macOS/Linux
# Edit .env for server (see .env.example — Grok / xAI for this stack)
npm run dev
```

- Frontend · 前端：`http://localhost:5173` (proxied `/api/*` to server)
- API · 接口：`http://localhost:8787` (see `server/index.ts`)

**中文** · 需要 Node **18+**。安装依赖后复制 `.env.example` 为 `.env` 并配置后端密钥，再执行 `npm run dev`。

---

## 📝 Usage examples / 使用示例

**Figma · Chat** · “Recommend an eye-friendly dark palette for a dashboard.” / “给仪表盘推荐一套护眼的深色配色。”

**Figma · Image** · “Minimal mobile settings screen, light mode.” / “简洁的移动端设置页，浅色模式。”

**Figma · Edit** · Select a frame → **Extract layer** → “Change background to snowy mountains.” / 选中图层 → **提取选中图层** → “把背景换成雪山。”

**Web** · Fill the form in the left panel → **Generate** → inspect canvas / JSON / tutor panel on the right.

---

## 📁 Project structure / 项目结构

```text
Intelligent-UI-Helper/
├── package.json              # Web: scripts, Vite + React + Express deps
├── vite.config.ts            # Web frontend bundler (if present)
├── server/                   # Express API (Grok client for web flow)
├── src/                      # React + Konva UI (web)
├── shared/                   # Zod schemas & prompts (web)
├── figma-ui-tutor/
│   ├── manifest.json         # Figma: main=code.js, ui=ui-v3.html
│   ├── code.js               # Main thread: fetch, export PNG, notify
│   └── ui-v3.html            # Plugin UI + SiliconFlow / Qwen logic
└── README.md                 # This file / 本说明
```

---

## 🛠 Tech stack / 技术栈

| Layer | EN | 中文 |
|-------|----|------|
| Figma | Plugin API, `fetch` in main, `figma.base64Encode` | Figma 插件 API，主线程请求，Base64 编码 |
| Figma UI | HTML + Tailwind (CDN) + `marked` | HTML + Tailwind CDN + Markdown 渲染 |
| Web | Vite, React 18, TypeScript, Tailwind, Konva | Vite、React、TS、Tailwind、Konva |
| Web API | Express, Zod, dotenv | Express、Zod、环境变量 |
| LLM (plugin) | **SiliconFlow · Qwen** | **硅基流动 · Qwen** |
| LLM (web server) | xAI Grok (see `server/grokClient`) | xAI Grok（见 `server/`） |

---

## 🤝 Contributing / 贡献指南

**EN** · Issues & PRs welcome. For the Figma plugin, test in **Development** mode after each change. For the web app, run `npm run lint` before submitting.

**中文** · 欢迎 Issue 与 PR。修改 Figma 插件后请在**开发模式**下自测；提交 Web 相关改动前建议执行 `npm run lint`。

---

## 📄 License / 许可证

**MIT** (unless otherwise noted in subfolders / 除非子目录另有说明)

---

## 👤 Author / 作者

**CHUNHAO031**

- GitHub: [CHUNHAO031](https://github.com/CHUNHAO031)
- Related repo · 相关仓库: [Intelligent-UI-Helper-0325](https://github.com/CHUNHAO031/Intelligent-UI-Helper-0325)

---

**Happy designing · 设计愉快** 🎨
