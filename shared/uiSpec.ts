import { z } from "zod";

export const PlatformSchema = z.enum(["web", "ios", "android"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const GenerateUiRequestSchema = z.object({
  productBrief: z
    .string()
    .min(10, "请至少输入 10 个字的产品/页面需求描述。")
    .max(5000),
  platform: PlatformSchema,
  styleKeywords: z
    .string()
    .min(0)
    .max(200)
    .default("现代、克制、清爽、可落地"),
  screens: z.number().int().min(1).max(6).default(3),
  primaryColor: z
    .string()
    .min(0)
    .max(30)
    .default("#1E293B"),
  locale: z.string().min(2).max(20).default("zh-CN"),
  extraConstraints: z.string().max(2000).optional(),
});
export type GenerateUiRequest = z.infer<typeof GenerateUiRequestSchema>;

const ColorString = z.string().min(1).max(30);

export const UiTextStyleSchema = z.object({
  color: ColorString.default("#0F172A"),
  fontSize: z.number().min(8).max(64).default(16),
  fontFamily: z.string().min(1).max(60).default("Inter"),
  fontWeight: z.union([z.number().int(), z.string()]).optional(),
  align: z.enum(["left", "center", "right"]).default("left"),
  lineHeight: z.number().min(0.8).max(3).default(1.2),
});
export type UiTextStyle = z.infer<typeof UiTextStyleSchema>;

export const UiBoxStyleSchema = z.object({
  fill: ColorString.optional(),
  stroke: ColorString.optional(),
  strokeWidth: z.number().min(0).max(20).optional(),
  radius: z.number().min(0).max(64).optional(),
  shadow: z
    .object({
      color: ColorString.default("rgba(0,0,0,0.15)"),
      blur: z.number().min(0).max(80).default(12),
      offsetX: z.number().min(-80).max(80).default(0),
      offsetY: z.number().min(-80).max(80).default(6),
      opacity: z.number().min(0).max(1).default(0.25),
    })
    .optional(),
});
export type UiBoxStyle = z.infer<typeof UiBoxStyleSchema>;

const ElementBaseSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(0).max(80).optional(),
  x: z.number().min(-5000).max(5000),
  y: z.number().min(-5000).max(5000),
  width: z.number().min(1).max(5000),
  height: z.number().min(1).max(5000),
  rotation: z.number().min(-360).max(360).default(0),
  opacity: z.number().min(0).max(1).default(1),
  locked: z.boolean().default(false),
});

export const RectLikeElementSchema = ElementBaseSchema.extend({
  type: z.enum(["rect", "button", "input", "image"]),
  style: UiBoxStyleSchema.default({}),
  label: z.string().max(120).optional(),
  placeholder: z.string().max(120).optional(),
});
export type RectLikeElement = z.infer<typeof RectLikeElementSchema>;

export const TextElementSchema = ElementBaseSchema.extend({
  type: z.literal("text"),
  text: z.string().min(0).max(400),
  style: UiTextStyleSchema.default({}),
});
export type TextElement = z.infer<typeof TextElementSchema>;

export const UiElementSchema = z.discriminatedUnion("type", [
  RectLikeElementSchema,
  TextElementSchema,
]);
export type UiElement = z.infer<typeof UiElementSchema>;

export const ScreenSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  size: z.object({
    width: z.number().int().min(240).max(4000),
    height: z.number().int().min(240).max(4000),
  }),
  background: z.object({
    fill: ColorString.default("#FFFFFF"),
  }),
  elements: z.array(UiElementSchema).default([]),
});
export type Screen = z.infer<typeof ScreenSchema>;

export const TutorNotesSchema = z.object({
  summary: z.string().min(1).max(2000),
  keyDecisions: z.array(z.string().min(1).max(300)).default([]),
  layoutChecklist: z.array(z.string().min(1).max(300)).default([]),
  accessibilityChecklist: z.array(z.string().min(1).max(300)).default([]),
  nextSteps: z.array(z.string().min(1).max(300)).default([]),
});
export type TutorNotes = z.infer<typeof TutorNotesSchema>;

export const UiTutorArtifactSchema = z.object({
  version: z.literal("1.0"),
  generatedAt: z.string().min(1).max(60),
  request: GenerateUiRequestSchema,
  screens: z.array(ScreenSchema).min(1),
  tutor: TutorNotesSchema,
});
export type UiTutorArtifact = z.infer<typeof UiTutorArtifactSchema>;

export function getDefaultCanvasSize(platform: Platform) {
  switch (platform) {
    case "web":
      return { width: 1440, height: 900 };
    case "ios":
    case "android":
      return { width: 390, height: 844 };
    default:
      return { width: 1440, height: 900 };
  }
}

