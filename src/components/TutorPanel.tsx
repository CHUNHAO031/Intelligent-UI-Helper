import type { TutorNotes } from "@shared/uiSpec";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function List(props: { title: string; items: string[] }) {
  const { title, items } = props;
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((it, idx) => (
          <li key={`${idx}-${it}`}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export function TutorPanel(props: { tutor: TutorNotes | null }) {
  const { tutor } = props;

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle>导师建议</CardTitle>
        <CardDescription>解释关键决策，并给出下一步可执行的优化清单。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tutor ? (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium">摘要</div>
              <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {tutor.summary}
              </div>
            </div>
            <Separator />
            <List title="关键决策" items={tutor.keyDecisions} />
            <List title="布局检查清单" items={tutor.layoutChecklist} />
            <List title="无障碍检查清单" items={tutor.accessibilityChecklist} />
            <List title="下一步" items={tutor.nextSteps} />
          </>
        ) : (
          <div className="text-sm text-muted-foreground">暂无导师内容（请先生成）</div>
        )}
      </CardContent>
    </Card>
  );
}

