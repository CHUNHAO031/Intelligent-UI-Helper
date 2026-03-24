## 智能 UI 设计导师（Vite + React + Konva + Grok）

这是一个**可运行的完整项目**：你在左侧输入产品/页面需求，点击生成后，后端会调用 **xAI Grok API** 返回**结构化 JSON（严格按 Zod schema 校验）**，前端使用 **React-Konva** 将其渲染为可拖拽/可选中的画布布局，并在右侧提供检查器、JSON 与“导师建议”。

### 技术栈

- **前端**：Vite + React 18 + TypeScript + TailwindCSS + shadcn/ui（本项目内置了常用组件代码）
- **画布**：React-Konva + Konva
- **后端**：Node + Express（安全代理调用 xAI，避免在浏览器暴露 API Key）
- **结构化输出**：Zod + function calling（优先使用 xAI `Responses API`，必要时回退 `chat/completions`）

### 目录结构（关键）

```
.
├─ server/                # Express 代理服务
├─ shared/                # 前后端共用：schema/types + prompts
├─ src/                   # React 前端
└─ .env.example           # 环境变量模板（含 Grok API Key）
```

### 1) 准备环境

- **Node.js**：建议 Node 18+（需要内置 `fetch`）

### 2) 配置 Grok API Key（必做）

1. 复制环境变量模板：

```bash
copy .env.example .env
```

2. 编辑根目录 `.env`，填入你的 Key：

```bash
XAI_API_KEY=xxxxxxxxxxxxxxxx
```

- **获取 API Key**：在 xAI 控制台创建 Key（参考：`https://console.x.ai/team/default/api-keys`）

### 3) 安装依赖与启动开发环境

```bash
npm install
npm run dev
```

默认会同时启动：

- **前端**：`http://localhost:5173`
- **后端**：`http://localhost:8787`（前端通过 Vite proxy 访问 `/api/*`）

### 4) 构建与生产启动

```bash
npm run build
npm start
```

然后访问：

- `http://localhost:8787`

### API 说明

- **健康检查**：`GET /api/health`
- **生成 UI 规格**：`POST /api/generate-ui`

请求体（示例）：

```json
{
  "productBrief": "为一个健身 App 设计 3 个页面：课程列表/课程详情/支付确认…",
  "platform": "web",
  "styleKeywords": "现代、克制、清爽、内容优先",
  "screens": 3,
  "primaryColor": "#1E293B",
  "locale": "zh-CN",
  "extraConstraints": "必须包含搜索与筛选"
}
```

成功返回（示例结构）：

```json
{
  "ok": true,
  "data": {
    "version": "1.0",
    "generatedAt": "2026-03-18T00:00:00.000Z",
    "request": { "...": "..." },
    "screens": [ { "id": "...", "name": "...", "size": { "width": 1440, "height": 900 }, "elements": [] } ],
    "tutor": { "summary": "...", "keyDecisions": [], "layoutChecklist": [], "accessibilityChecklist": [], "nextSteps": [] }
  }
}
```

### Prompt 工程与结构化 JSON（你可以从这里改“更像导师”）

- **schema/type（前后端共用）**：`shared/uiSpec.ts`
  - `GenerateUiRequestSchema`：请求校验
  - `UiTutorArtifactSchema`：模型输出校验（screens + elements + tutor）
- **提示词模板**：`shared/prompts.ts`
  - `SYSTEM_PROMPT_ZH`：系统提示词（导师角色 + 约束）
  - `buildUserPrompt()`：把表单输入转成可控的 user prompt

后端会把 `UiTutorArtifactSchema` 转成 JSON Schema，作为 function calling 的 `parameters`，强制 Grok 输出结构化 JSON。

### 常见问题

- **为什么不在前端直接调用 Grok？**
  - 因为浏览器里会暴露 `XAI_API_KEY`。本项目用 `server/` 做代理，前端只请求 `/api/*`。
- **如何换模型？**
  - 在 `.env` 设置 `XAI_MODEL=...`（默认已写在 `.env.example`）。

