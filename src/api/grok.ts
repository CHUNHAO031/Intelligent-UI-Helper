import {
  GenerateUiRequestSchema,
  UiTutorArtifactSchema,
  type GenerateUiRequest,
  type UiTutorArtifact,
} from "@shared/uiSpec";

export async function generateUiTutorArtifact(
  req: GenerateUiRequest,
  opts?: { signal?: AbortSignal },
): Promise<UiTutorArtifact> {
  const safeReq = GenerateUiRequestSchema.parse(req);

  const res = await fetch("/api/generate-ui", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(safeReq),
    signal: opts?.signal,
  });

  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok || !json?.ok) {
    const message =
      json?.error?.message ?? `请求失败：HTTP ${res.status} ${res.statusText}`;
    const details = json?.error?.payload;
    const err = new Error(message);
    (err as any).details = details;
    throw err;
  }

  return UiTutorArtifactSchema.parse(json.data);
}

