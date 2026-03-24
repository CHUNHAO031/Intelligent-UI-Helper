import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Group, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { RectLikeElement, Screen, TextElement, UiElement } from "@shared/uiSpec";
import { useElementSize } from "@/hooks/useElementSize";
import { useKeyHeld } from "@/hooks/useKeyHeld";

type Viewport = { scale: number; x: number; y: number };

export function DesignCanvas(props: {
  screen: Screen | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<UiElement>) => void;
  primaryColor?: string;
}) {
  const { screen, selectedId, onSelect, onUpdateElement, primaryColor } = props;
  const spaceHeld = useKeyHeld("Space");

  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({});

  const [view, setView] = useState<Viewport>({ scale: 1, x: 0, y: 0 });

  // 进入/切换 screen 时自动居中
  useEffect(() => {
    if (!screen) return;
    if (size.width <= 0 || size.height <= 0) return;
    const pad = 48;
    const scaleX = (size.width - pad * 2) / screen.size.width;
    const scaleY = (size.height - pad * 2) / screen.size.height;
    const nextScale = Math.max(0.1, Math.min(scaleX, scaleY, 1));
    const x = (size.width - screen.size.width * nextScale) / 2;
    const y = (size.height - screen.size.height * nextScale) / 2;
    setView({ scale: nextScale, x, y });
  }, [screen?.id, screen?.size.width, screen?.size.height, size.width, size.height]);

  // 选中元素时绑定 Transformer
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, screen]);

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    if (!screen) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const nextScaleUnclamped = direction > 0 ? view.scale * scaleBy : view.scale / scaleBy;
    const nextScale = Math.min(5, Math.max(0.15, nextScaleUnclamped));

    const mousePointTo = {
      x: (pointer.x - view.x) / view.scale,
      y: (pointer.y - view.y) / view.scale,
    };

    const nextPos = {
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale,
    };

    setView({ scale: nextScale, x: nextPos.x, y: nextPos.y });
  };

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const target = e.target;
    if (!stage) return;
    const clickedOnEmpty = target === stage || target.name() === "screen-bg";
    if (clickedOnEmpty) onSelect(null);
  };

  const renderRectLike = (el: RectLikeElement) => {
    const fill =
      el.style.fill ??
      (el.type === "button" ? primaryColor ?? "#0F172A" : el.type === "image" ? "#E2E8F0" : "#FFFFFF");
    const stroke =
      el.style.stroke ??
      (el.type === "input" ? "#CBD5E1" : el.type === "rect" ? "#E2E8F0" : undefined);
    const strokeWidth = el.style.strokeWidth ?? (stroke ? 1 : 0);
    const radius = el.style.radius ?? 10;

    const label =
      el.type === "button"
        ? el.label ?? "主要按钮"
        : el.type === "input"
          ? el.placeholder ?? el.label ?? "请输入…"
          : el.type === "image"
            ? el.label ?? "图片"
            : el.label;

    const labelColor =
      el.type === "button" ? "#FFFFFF" : el.type === "input" ? "#94A3B8" : "#334155";

    return (
      <Group
        key={el.id}
        ref={(node) => {
          nodeRefs.current[el.id] = node;
        }}
        x={el.x}
        y={el.y}
        rotation={el.rotation}
        opacity={el.opacity}
        draggable={!el.locked}
        onClick={(evt) => {
          evt.cancelBubble = true;
          onSelect(el.id);
        }}
        onTap={(evt) => {
          evt.cancelBubble = true;
          onSelect(el.id);
        }}
        onDragEnd={(evt) => {
          onUpdateElement(el.id, { x: evt.target.x(), y: evt.target.y() } as any);
        }}
        onTransformEnd={(evt) => {
          const node = evt.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const nextWidth = Math.max(1, el.width * scaleX);
          const nextHeight = Math.max(1, el.height * scaleY);
          onUpdateElement(el.id, {
            x: node.x(),
            y: node.y(),
            width: nextWidth,
            height: nextHeight,
            rotation: node.rotation(),
          } as any);
        }}
      >
        <Rect
          width={el.width}
          height={el.height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={radius}
        />
        {label ? (
          <Text
            text={label}
            width={el.width}
            height={el.height}
            align="center"
            verticalAlign="middle"
            fontSize={14}
            fill={labelColor}
          />
        ) : null}
      </Group>
    );
  };

  const renderText = (el: TextElement) => {
    const style = el.style ?? ({} as any);
    return (
      <Group
        key={el.id}
        ref={(node) => {
          nodeRefs.current[el.id] = node;
        }}
        x={el.x}
        y={el.y}
        rotation={el.rotation}
        opacity={el.opacity}
        draggable={!el.locked}
        onClick={(evt) => {
          evt.cancelBubble = true;
          onSelect(el.id);
        }}
        onTap={(evt) => {
          evt.cancelBubble = true;
          onSelect(el.id);
        }}
        onDragEnd={(evt) => {
          onUpdateElement(el.id, { x: evt.target.x(), y: evt.target.y() } as any);
        }}
        onTransformEnd={(evt) => {
          const node = evt.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const nextWidth = Math.max(1, el.width * scaleX);
          const nextHeight = Math.max(1, el.height * scaleY);
          onUpdateElement(el.id, {
            x: node.x(),
            y: node.y(),
            width: nextWidth,
            height: nextHeight,
            rotation: node.rotation(),
          } as any);
        }}
      >
        <Text
          text={el.text}
          width={el.width}
          height={el.height}
          fontSize={style.fontSize ?? 16}
          fontFamily={style.fontFamily ?? "Inter"}
          fontStyle={typeof style.fontWeight === "string" ? style.fontWeight : undefined}
          fill={style.color ?? "#0F172A"}
          align={style.align ?? "left"}
        />
      </Group>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full rounded-xl border bg-muted/30"
    >
      {screen ? (
        <Stage
          ref={(node) => {
            stageRef.current = node;
          }}
          width={size.width}
          height={size.height}
          scaleX={view.scale}
          scaleY={view.scale}
          x={view.x}
          y={view.y}
          draggable={spaceHeld}
          onDragEnd={(evt) => {
            const st = evt.target;
            setView((v) => ({ ...v, x: st.x(), y: st.y() }));
          }}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          style={{ background: "transparent" }}
        >
          <Layer>
            <Group>
              {/* screen 背景 */}
              <Rect
                name="screen-bg"
                x={0}
                y={0}
                width={screen.size.width}
                height={screen.size.height}
                fill={screen.background.fill}
                stroke="#CBD5E1"
                strokeWidth={1}
                cornerRadius={18}
                shadowColor="rgba(0,0,0,0.2)"
                shadowBlur={16}
                shadowOffsetX={0}
                shadowOffsetY={10}
                shadowOpacity={0.15}
              />

              {/* elements */}
              {(screen.elements ?? []).map((el) => {
                if (el.type === "text") return renderText(el);
                return renderRectLike(el);
              })}
            </Group>
            <Transformer
              ref={(node) => {
                transformerRef.current = node;
              }}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                // 防止缩到不可见
                if (newBox.width < 8 || newBox.height < 8) return oldBox;
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          先在左侧输入需求并生成设计（将渲染到这里）
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-3 text-xs text-muted-foreground">
        <div>滚轮缩放</div>
        <div>按住空格拖拽平移</div>
        {selectedId ? <div>已选中：{selectedId}</div> : <div>未选中元素</div>}
      </div>
    </div>
  );
}

