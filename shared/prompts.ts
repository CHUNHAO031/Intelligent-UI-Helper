import type { GenerateUiRequest, Platform } from "./uiSpec.js";

export const UI_SPEC_TOOL_NAME = "emit_ui_tutor_artifact";

function platformHint(platform: Platform) {
  switch (platform) {
    case "web":
      return "Web（桌面端，建议画布 1440×900，信息密度更高，侧边栏/顶部导航更常见）";
    case "ios":
      return "iOS（移动端，建议画布 390×844，注意安全区与大拇指热区）";
    case "android":
      return "Android（移动端，建议画布 390×844，注意系统返回与导航模式差异）";
    default:
      return String(platform);
  }
}

export const SYSTEM_PROMPT_ZH = [
  "你是一位“智能 UI 设计导师”。你的目标不是做炫技概念稿，而是给出可落地、可实现、可解释的 UI 方案。",
  "",
  "请遵守：",
  "- 坐标与尺寸全部使用像素（number）。x/y 以屏幕左上角为原点。",
  "- 使用 8pt 栅格（间距/尺寸尽量为 8 的倍数）。",
  "- 文案使用简体中文（除非需求明确要求英文）。",
  "- 配色要可访问（避免低对比），按钮/输入框要有明确层级。",
  "- 每个 screen 的 elements 需要覆盖：标题/关键信息区/主要 CTA/必要的表单或列表结构。",
  "",
  "输出内容将被程序严格校验并渲染到画布，请确保字段齐全、类型正确、不要输出任何多余文本。",
].join("\n");

export function buildUserPrompt(req: GenerateUiRequest) {
  const lines: string[] = [];
  lines.push("## 需求");
  lines.push(req.productBrief.trim());
  lines.push("");
  lines.push("## 约束");
  lines.push(`- 平台：${platformHint(req.platform)}`);
  lines.push(`- 预计页面数量（screens）：${req.screens}`);
  lines.push(`- 风格关键词：${req.styleKeywords || "现代、克制、清爽、可落地"}`);
  if (req.primaryColor) lines.push(`- 主色建议：${req.primaryColor}`);
  if (req.extraConstraints?.trim()) {
    lines.push(`- 额外约束：${req.extraConstraints.trim()}`);
  }
  lines.push("");
  lines.push("## 输出要求");
  lines.push(
    [
      "- 以“可直接渲染到画布”的角度设计元素：包含基本布局矩形、标题/正文文字、按钮、输入框等。",
      "- 元素 id 唯一且稳定（推荐 screenId_elementType_index）。",
      "- 每个 screen 至少包含：页标题 text、主要按钮 button、至少一个输入框/卡片/列表区域（视需求）。",
      "- tutor 部分要像导师一样解释关键决策，并给出可执行的优化清单。",
    ].join("\n"),
  );
  return lines.join("\n");
}

