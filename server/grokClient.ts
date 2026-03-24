import { zodToJsonSchema } from "zod-to-json-schema";

import {
  GenerateUiRequestSchema,
  UiTutorArtifactSchema,
  type GenerateUiRequest,
  type UiTutorArtifact,
} from "../shared/uiSpec.js";
import {
  buildUserPrompt,
  SYSTEM_PROMPT_ZH,
  UI_SPEC_TOOL_NAME,
} from "../shared/prompts.js";

type XaiResponsesOutputItem =
  | {
      type: "message";
      content?: Array<{ text?: string }>;
    }
  | {
      type: "function_call";
      name: string;
      arguments: string;
      call_id?: string;
    }
  | {
      type: string;
      [k: string]: unknown;
    };

type XaiResponsesResponse = {
  id?: string;
  output?: XaiResponsesOutputItem[];
  [k: string]: unknown;
};

export class GrokApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "GrokApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getEnv(name: string) {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

function buildToolParameters() {
  const full = zodToJsonSchema(UiTutorArtifactSchema, {
    name: "UiTutorArtifact",
  }) as any;

  // zod-to-json-schema 常见输出：{ $ref, definitions: { UiTutorArtifact: {...} } }
  const def = full?.definitions?.UiTutorArtifact;
  return def ?? full;
}

function extractJsonFromMessage(item: XaiResponsesOutputItem | undefined) {
  if (!item || item.type !== "message") return undefined;
  const content =
    Array.isArray(item.content) ? (item.content as Array<{ text?: string }>) : [];
  const text = content.map((c) => c.text ?? "").join("");
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  // 允许模型把 JSON 放在 ```json ... ``` 中（尽量不发生，但做容错）
  const fenceMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  return trimmed;
}

function safeJsonParse(s: string) {
  try {
    return { ok: true as const, value: JSON.parse(s) };
  } catch (e) {
    return { ok: false as const, error: e };
  }
}

async function xaiPostJson(path: string, body: unknown) {
  const baseUrl = getEnv("XAI_BASE_URL") ?? "https://api.x.ai/v1";
  const apiKey = getEnv("XAI_API_KEY");
  if (!apiKey) {
    throw new GrokApiError(
      "缺少环境变量 XAI_API_KEY。请在项目根目录创建 .env 并设置 XAI_API_KEY。",
      500,
    );
  }

  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown = text;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new GrokApiError(
      `xAI API 请求失败（${res.status}）。`,
      res.status,
      json,
    );
  }

  return json;
}

async function callResponsesApi(req: GenerateUiRequest): Promise<UiTutorArtifact> {
  const model =
    getEnv("XAI_MODEL") ?? "grok-4.20-beta-latest-non-reasoning";

  const parameters = buildToolParameters();
  const body = {
    model,
    stream: false,
    input: [
      { role: "system", content: SYSTEM_PROMPT_ZH },
      { role: "user", content: buildUserPrompt(req) },
    ],
    tools: [
      {
        type: "function",
        name: UI_SPEC_TOOL_NAME,
        description:
          "输出一个可渲染的 UI 设计规格（JSON），用于画布渲染与导师点评。",
        parameters,
      },
    ],
    tool_choice: { type: "function", function: { name: UI_SPEC_TOOL_NAME } },
    parallel_tool_calls: false,
  };

  const json = (await xaiPostJson("/responses", body)) as XaiResponsesResponse;

  const output = Array.isArray(json.output) ? json.output : [];
  const fc = output.find(
    (o) => o.type === "function_call" && (o as any).name === UI_SPEC_TOOL_NAME,
  ) as Extract<XaiResponsesOutputItem, { type: "function_call" }> | undefined;

  if (fc?.arguments) {
    const parsed = safeJsonParse(fc.arguments);
    if (!parsed.ok) {
      throw new GrokApiError("模型返回的 function_call.arguments 不是合法 JSON。", 502, {
        arguments: fc.arguments,
      });
    }

    const obj = parsed.value as Record<string, unknown>;
    // 服务器侧保证关键字段一致，避免模型“漂移”
    if (typeof obj === "object" && obj) {
      (obj as any).version = "1.0";
      (obj as any).request = req;
      if (!(obj as any).generatedAt) {
        (obj as any).generatedAt = new Date().toISOString();
      }
    }

    const validated = UiTutorArtifactSchema.parse(obj);
    return validated;
  }

  // fallback：尝试从 message 里解析 JSON
  const msg = output.find((o) => o.type === "message");
  const messageJsonText = extractJsonFromMessage(msg);
  if (messageJsonText) {
    const parsed = safeJsonParse(messageJsonText);
    if (!parsed.ok) {
      throw new GrokApiError("模型返回 message 但无法解析为 JSON。", 502, {
        text: messageJsonText,
      });
    }
    const obj = parsed.value as Record<string, unknown>;
    if (typeof obj === "object" && obj) {
      (obj as any).version = "1.0";
      (obj as any).request = req;
      if (!(obj as any).generatedAt) {
        (obj as any).generatedAt = new Date().toISOString();
      }
    }
    const validated = UiTutorArtifactSchema.parse(obj);
    return validated;
  }

  throw new GrokApiError(
    "未在 xAI Responses API 返回中找到 function_call 或可解析的 JSON message。",
    502,
    json,
  );
}

async function callChatCompletionsApi(
  req: GenerateUiRequest,
): Promise<UiTutorArtifact> {
  const model =
    getEnv("XAI_MODEL") ?? "grok-4.20-beta-latest-non-reasoning";

  const parameters = buildToolParameters();

  // OpenAI 兼容：tools.function.parameters
  const body = {
    model,
    stream: false,
    messages: [
      { role: "system", content: SYSTEM_PROMPT_ZH },
      { role: "user", content: buildUserPrompt(req) },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: UI_SPEC_TOOL_NAME,
          description:
            "输出一个可渲染的 UI 设计规格（JSON），用于画布渲染与导师点评。",
          parameters,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: UI_SPEC_TOOL_NAME } },
    parallel_tool_calls: false,
  };

  const json = (await xaiPostJson(
    "/chat/completions",
    body,
  )) as Record<string, any>;

  const choice = json?.choices?.[0];
  const msg = choice?.message;
  const toolCalls = msg?.tool_calls as
    | Array<{ function?: { name?: string; arguments?: string } }>
    | undefined;

  const first = toolCalls?.find((tc) => tc.function?.name === UI_SPEC_TOOL_NAME);
  const argsText = first?.function?.arguments;

  if (typeof argsText === "string" && argsText.trim()) {
    const parsed = safeJsonParse(argsText);
    if (!parsed.ok) {
      throw new GrokApiError(
        "Chat Completions 工具调用 arguments 不是合法 JSON。",
        502,
        { arguments: argsText },
      );
    }

    const obj = parsed.value as Record<string, unknown>;
    if (typeof obj === "object" && obj) {
      (obj as any).version = "1.0";
      (obj as any).request = req;
      if (!(obj as any).generatedAt) {
        (obj as any).generatedAt = new Date().toISOString();
      }
    }
    return UiTutorArtifactSchema.parse(obj);
  }

  const content = msg?.content;
  if (typeof content === "string" && content.trim()) {
    const parsed = safeJsonParse(content.trim());
    if (parsed.ok) {
      const obj = parsed.value as Record<string, unknown>;
      if (typeof obj === "object" && obj) {
        (obj as any).version = "1.0";
        (obj as any).request = req;
        if (!(obj as any).generatedAt) {
          (obj as any).generatedAt = new Date().toISOString();
        }
      }
      return UiTutorArtifactSchema.parse(obj);
    }
  }

  throw new GrokApiError(
    "Chat Completions 返回中未找到可用的 tool_calls 或 JSON content。",
    502,
    json,
  );
}

export async function generateUiTutorArtifact(input: unknown) {
  const req = GenerateUiRequestSchema.parse(input);
  try {
    return await callResponsesApi(req);
  } catch (e) {
    // 尝试回退到 legacy chat/completions（某些账号/模型可能尚未开通 responses）
    if (e instanceof GrokApiError && (e.status === 404 || e.status === 400)) {
      return await callChatCompletionsApi(req);
    }
    if (e instanceof Error) throw e;
    throw new Error(String(e));
  }
}

