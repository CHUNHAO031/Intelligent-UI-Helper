import type { UiTutorArtifact } from "@shared/uiSpec";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function downloadJson(filename: string, jsonText: string) {
  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function JsonPanel(props: { artifact: UiTutorArtifact | null }) {
  const { artifact } = props;
  const jsonText = artifact ? JSON.stringify(artifact, null, 2) : "";

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle>结构化 JSON</CardTitle>
        <CardDescription>这是 Grok 输出并通过校验的 UI 规格，可复制/下载。</CardDescription>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5.5rem)] flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!artifact}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(jsonText);
                toast.success("已复制 JSON 到剪贴板");
              } catch {
                toast.error("复制失败：浏览器不允许访问剪贴板");
              }
            }}
          >
            复制
          </Button>
          <Button
            variant="outline"
            disabled={!artifact}
            onClick={() => {
              if (!artifact) return;
              const ts = new Date().toISOString().replace(/[:.]/g, "-");
              downloadJson(`ui-spec-${ts}.json`, jsonText);
              toast.success("已下载 JSON");
            }}
          >
            下载
          </Button>
        </div>

        <pre className="flex-1 overflow-auto rounded-lg border bg-background p-3 text-xs leading-relaxed">
          {artifact ? jsonText : "暂无数据（请先生成）"}
        </pre>
      </CardContent>
    </Card>
  );
}

