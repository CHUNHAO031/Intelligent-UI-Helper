import { useMemo } from "react";
import type { GenerateUiRequest, Platform } from "@shared/uiSpec";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

function platformLabel(p: Platform) {
  switch (p) {
    case "web":
      return "Web（桌面）";
    case "ios":
      return "iOS（移动）";
    case "android":
      return "Android（移动）";
    default:
      return p;
  }
}

const SAMPLE_BRIEF = `你是智能UI设计导师。请为“AI 学习计划软件”设计 UI：\n- 目标用户：大学生\n- 核心流程：创建计划 → 分解任务 → 日历视图 → 今日待办 → 复盘\n- 关键功能：番茄钟、提醒、进度统计、成就徽章\n- 要求：信息清晰、轻量、可落地，避免过度炫酷\n`;

export function PromptForm(props: {
  value: GenerateUiRequest;
  onChange: (next: GenerateUiRequest) => void;
  onGenerate: () => void;
  loading?: boolean;
  canGenerate?: boolean;
}) {
  const { value, onChange, onGenerate, loading, canGenerate } = props;

  const colorPreviewStyle = useMemo(() => {
    const color = value.primaryColor?.trim();
    return { backgroundColor: color || "#1E293B" } as const;
  }, [value.primaryColor]);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle>需求与约束</CardTitle>
        <CardDescription>
          填写需求后点击生成，服务端会用 Grok 返回结构化 JSON 并渲染到画布。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">产品/页面需求</div>
          <Textarea
            value={value.productBrief}
            onChange={(e) => onChange({ ...value, productBrief: e.target.value })}
            placeholder="例如：为一个健身 App 设计“课程列表 + 课程详情 + 下单支付”流程…"
            className="min-h-[160px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">平台</div>
            <Select
              value={value.platform}
              onValueChange={(v) => onChange({ ...value, platform: v as Platform })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择平台" />
              </SelectTrigger>
              <SelectContent>
                {(["web", "ios", "android"] as Platform[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {platformLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">页面数量</div>
            <Input
              type="number"
              min={1}
              max={6}
              value={value.screens}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                onChange({ ...value, screens: Math.max(1, Math.min(6, n)) });
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">风格关键词</div>
          <Input
            value={value.styleKeywords}
            onChange={(e) => onChange({ ...value, styleKeywords: e.target.value })}
            placeholder="例如：现代、克制、清爽、内容优先、轻拟物…"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">主色（建议）</div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md border" style={colorPreviewStyle} />
            <Input
              value={value.primaryColor}
              onChange={(e) => onChange({ ...value, primaryColor: e.target.value })}
              placeholder="#1E293B"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">额外约束（可选）</div>
          <Textarea
            value={value.extraConstraints ?? ""}
            onChange={(e) => onChange({ ...value, extraConstraints: e.target.value })}
            placeholder="例如：必须包含搜索；列表为卡片样式；使用两栏布局；强调无障碍…"
          />
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button onClick={onGenerate} disabled={loading || canGenerate === false}>
            {loading ? "生成中…" : "生成 UI 规格（Grok）"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange({ ...value, productBrief: SAMPLE_BRIEF })}
            disabled={loading}
          >
            填入示例
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange({ ...value, productBrief: "" })}
            disabled={loading}
          >
            清空需求
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          提示：API Key 不会暴露在前端；请在根目录 `.env` 设置 `XAI_API_KEY`，由服务端代理调用。
        </div>
        {canGenerate === false ? (
          <div className="text-xs text-destructive">
            需求描述过短或不完整：请补充后再生成。
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

