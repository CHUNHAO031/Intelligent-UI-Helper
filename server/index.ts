import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import express from "express";

import { GrokApiError, generateUiTutorArtifact } from "./grokClient.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.post("/api/generate-ui", async (req, res) => {
  try {
    const data = await generateUiTutorArtifact(req.body);
    res.json({ ok: true, data });
  } catch (e) {
    const isGrok = e instanceof GrokApiError;
    const status = isGrok ? Math.min(Math.max(e.status, 400), 599) : 500;
    const message = e instanceof Error ? e.message : String(e);
    res.status(status).json({
      ok: false,
      error: {
        message,
        ...(isGrok ? { status: e.status, payload: e.payload } : {}),
      },
    });
  }
});

// 约定：无论 dev 还是 build 后运行，都从项目根目录启动（npm scripts 默认如此）
const distDir = path.resolve(process.cwd(), "dist");
const distIndex = path.resolve(distDir, "index.html");

// 当检测到已构建的前端产物时，同端口提供静态资源 + API
// 如需禁用（只跑 API），可设置：SERVE_STATIC=0
const shouldServeStatic = fs.existsSync(distIndex) && process.env.SERVE_STATIC !== "0";
if (shouldServeStatic) {
  app.use(express.static(distDir));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).end();
      return;
    }
    res.sendFile(distIndex);
  });
}

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
});

