import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { generateUiTutorArtifact } from "@/api/grok";
import { DesignCanvas } from "@/components/DesignCanvas";
import { ElementInspector } from "@/components/ElementInspector";
import { JsonPanel } from "@/components/JsonPanel";
import { PromptForm } from "@/components/PromptForm";
import { TutorPanel } from "@/components/TutorPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";

import {
  GenerateUiRequestSchema,
  type GenerateUiRequest,
  type Platform,
  type Screen,
  type UiTutorArtifact,
  type UiElement,
} from "@shared/uiSpec";

const DEFAULT_REQ: GenerateUiRequest = {
  productBrief: "",
  platform: "web",
  styleKeywords: "现代、克制、清爽、可落地",
  screens: 3,
  primaryColor: "#1E293B",
  locale: "zh-CN",
};

function screenLabel(s: Screen) {
  return `${s.name}（${s.size.width}×${s.size.height}）`;
}

export default function App() {
  const [req, setReq] = useState<GenerateUiRequest>(DEFAULT_REQ);
  const [artifact, setArtifact] = useState<UiTutorArtifact | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const screens: Screen[] = artifact?.screens ?? [];
  const activeScreen: Screen | null =
    screens.find((s) => s.id === activeScreenId) ?? screens[0] ?? null;

  const selectedElement: UiElement | null =
    activeScreen?.elements?.find((el) => el.id === selectedId) ?? null;

  const platform: Platform = req.platform;
  const canSelectScreen = screens.length > 1;

  const canGenerate = useMemo(() => {
    const parsed = GenerateUiRequestSchema.safeParse(req);
    return parsed.success;
  }, [req]);

  async function onGenerate() {
    const parsed = GenerateUiRequestSchema.safeParse(req);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "请检查输入。");
      return;
    }

    setLoading(true);
    const ctrl = new AbortController();
    try {
      const data = await generateUiTutorArtifact(parsed.data, { signal: ctrl.signal });
      setArtifact(data);
      setActiveScreenId(data.screens?.[0]?.id ?? null);
      setSelectedId(null);
      setResetKey((k) => k + 1);
      toast.success("生成成功：已渲染到画布");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function updateSelected(updates: Partial<UiElement>) {
    if (!artifact || !activeScreen) return;
    if (!selectedElement) return;

    const id = selectedElement.id;
    const nextScreens = artifact.screens.map((s: Screen) => {
      if (s.id !== activeScreen.id) return s;
      const nextElements = (s.elements ?? []).map((el: UiElement) => {
        if (el.id !== id) return el;
        const u: any = updates;
        const next: any = { ...el, ...u };
        if (u.style) next.style = { ...(el as any).style, ...u.style };
        return next as UiElement;
      });
      return { ...s, elements: nextElements };
    });

    setArtifact({ ...artifact, screens: nextScreens });
  }

  function updateElement(id: string, updates: Partial<UiElement>) {
    if (!artifact || !activeScreen) return;
    const nextScreens = artifact.screens.map((s: Screen) => {
      if (s.id !== activeScreen.id) return s;
      const nextElements = (s.elements ?? []).map((el: UiElement) => {
        if (el.id !== id) return el;
        const u: any = updates;
        const next: any = { ...el, ...u };
        if (u.style) next.style = { ...(el as any).style, ...u.style };
        return next as UiElement;
      });
      return { ...s, elements: nextElements };
    });
    setArtifact({ ...artifact, screens: nextScreens });
  }

  return (
    <div className="h-full min-h-screen bg-background text-foreground">
      <Toaster richColors />

      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <div className="text-base font-semibold tracking-tight">智能 UI 设计导师</div>
          <div className="hidden text-sm text-muted-foreground md:block">
            Vite + React18 + TS + Tailwind + shadcn/ui + Konva + Grok
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setDark((d) => !d)}
            title="切换明暗主题（本地）"
          >
            {dark ? "浅色" : "深色"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setResetKey((k) => k + 1)}
            disabled={!activeScreen}
            title="重置视图（重新居中）"
          >
            重置视图
          </Button>
        </div>
      </header>

      <main className="grid h-[calc(100%-3.5rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[380px_1fr_380px]">
        <section className="min-h-0">
          <PromptForm
            value={req}
            onChange={setReq}
            onGenerate={onGenerate}
            loading={loading}
            canGenerate={canGenerate}
          />
        </section>

        <section className="min-h-0">
          <Card className="h-full">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>画布</CardTitle>
                  <CardDescription>
                    {activeScreen ? `当前：${activeScreen.name}` : "等待生成…"}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={activeScreen?.id ?? ""}
                    onValueChange={(v) => {
                      setActiveScreenId(v);
                      setSelectedId(null);
                      setResetKey((k) => k + 1);
                    }}
                    disabled={!canSelectScreen}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="选择 screen" />
                    </SelectTrigger>
                    <SelectContent>
                      {screens.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {screenLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
            </CardHeader>
            <CardContent className="h-[calc(100%-6.5rem)]">
              <div className="h-full">
                <DesignCanvas
                  key={`${activeScreen?.id ?? "none"}-${resetKey}-${platform}`}
                  screen={activeScreen}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onUpdateElement={updateElement}
                  primaryColor={req.primaryColor}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="min-h-0">
          <Tabs defaultValue="inspector" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inspector">检查器</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="tutor">导师</TabsTrigger>
            </TabsList>

            <TabsContent value="inspector" className="h-[calc(100%-2.5rem)]">
              <ElementInspector
                element={selectedElement}
                onUpdate={updateSelected}
                onResetRotation={
                  selectedElement ? () => updateSelected({ rotation: 0 } as any) : undefined
                }
              />
            </TabsContent>
            <TabsContent value="json" className="h-[calc(100%-2.5rem)]">
              <JsonPanel artifact={artifact} />
            </TabsContent>
            <TabsContent value="tutor" className="h-[calc(100%-2.5rem)]">
              <TutorPanel tutor={artifact?.tutor ?? null} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}


