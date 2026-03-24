import type { RectLikeElement, TextElement, UiElement } from "@shared/uiSpec";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function numberOr(prev: number, raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : prev;
}

export function ElementInspector(props: {
  element: UiElement | null;
  onUpdate: (updates: Partial<UiElement>) => void;
  onResetRotation?: () => void;
}) {
  const { element, onUpdate, onResetRotation } = props;

  if (!element) {
    return (
      <Card className="h-full">
        <CardHeader className="space-y-1">
          <CardTitle>元素检查器</CardTitle>
          <CardDescription>在画布中点击一个元素以查看/编辑属性。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">暂无选中元素</CardContent>
      </Card>
    );
  }

  const isText = element.type === "text";
  const isRectLike = element.type !== "text";

  const rectLike = element as RectLikeElement;
  const textEl = element as TextElement;

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle>元素检查器</CardTitle>
        <CardDescription className="break-all">
          <span className="font-medium">{element.type}</span> · {element.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-xs font-medium">x</div>
            <Input
              value={String(element.x)}
              onChange={(e) => onUpdate({ x: numberOr(element.x, e.target.value) } as any)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-medium">y</div>
            <Input
              value={String(element.y)}
              onChange={(e) => onUpdate({ y: numberOr(element.y, e.target.value) } as any)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-medium">width</div>
            <Input
              value={String(element.width)}
              onChange={(e) =>
                onUpdate({ width: Math.max(1, numberOr(element.width, e.target.value)) } as any)
              }
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-medium">height</div>
            <Input
              value={String(element.height)}
              onChange={(e) =>
                onUpdate({ height: Math.max(1, numberOr(element.height, e.target.value)) } as any)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-xs font-medium">rotation</div>
            <Input
              value={String(element.rotation)}
              onChange={(e) =>
                onUpdate({ rotation: numberOr(element.rotation ?? 0, e.target.value) } as any)
              }
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-medium">opacity（0-1）</div>
            <Input
              value={String(element.opacity)}
              onChange={(e) => {
                const next = Math.min(1, Math.max(0, numberOr(element.opacity ?? 1, e.target.value)));
                onUpdate({ opacity: next } as any);
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!element.locked}
              onChange={(e) => onUpdate({ locked: e.target.checked } as any)}
            />
            锁定（禁止拖拽/缩放）
          </label>
          {onResetRotation ? (
            <Button variant="outline" size="sm" onClick={onResetRotation}>
              重置旋转
            </Button>
          ) : null}
        </div>

        <Separator />

        {isRectLike ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">外观（矩形类）</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="text-xs font-medium">fill</div>
                <Input
                  value={rectLike.style?.fill ?? ""}
                  onChange={(e) =>
                    onUpdate({ style: { ...rectLike.style, fill: e.target.value } } as any)
                  }
                  placeholder="#FFFFFF"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium">stroke</div>
                <Input
                  value={rectLike.style?.stroke ?? ""}
                  onChange={(e) =>
                    onUpdate({ style: { ...rectLike.style, stroke: e.target.value } } as any)
                  }
                  placeholder="#CBD5E1"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium">strokeWidth</div>
                <Input
                  value={String(rectLike.style?.strokeWidth ?? 0)}
                  onChange={(e) =>
                    onUpdate({
                      style: {
                        ...rectLike.style,
                        strokeWidth: Math.max(0, numberOr(rectLike.style?.strokeWidth ?? 0, e.target.value)),
                      },
                    } as any)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium">radius</div>
                <Input
                  value={String(rectLike.style?.radius ?? 0)}
                  onChange={(e) =>
                    onUpdate({
                      style: { ...rectLike.style, radius: Math.max(0, numberOr(rectLike.style?.radius ?? 0, e.target.value)) },
                    } as any)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="text-xs font-medium">label</div>
                <Input
                  value={rectLike.label ?? ""}
                  onChange={(e) => onUpdate({ label: e.target.value } as any)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium">placeholder</div>
                <Input
                  value={rectLike.placeholder ?? ""}
                  onChange={(e) => onUpdate({ placeholder: e.target.value } as any)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {isText ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">文本内容</div>
            <Input value={textEl.text} onChange={(e) => onUpdate({ text: e.target.value } as any)} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="text-xs font-medium">fontSize</div>
                <Input
                  value={String(textEl.style?.fontSize ?? 16)}
                  onChange={(e) =>
                    onUpdate({
                      style: { ...textEl.style, fontSize: Math.max(8, numberOr(textEl.style?.fontSize ?? 16, e.target.value)) },
                    } as any)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium">color</div>
                <Input
                  value={textEl.style?.color ?? ""}
                  onChange={(e) => onUpdate({ style: { ...textEl.style, color: e.target.value } } as any)}
                  placeholder="#0F172A"
                />
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

