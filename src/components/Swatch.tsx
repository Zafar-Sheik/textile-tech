"use client";

import { memo, useEffect, useRef } from "react";
import type { MaterialDef } from "@/lib/materials";
import { getPatternMask, type PatternId } from "@/lib/patterns";
import { getWeaveThumb } from "@/lib/weave";

/** A flat close-up of a material's weave, dyed in the given colour. */
function Swatch({
  material,
  color,
  className = "",
  zoom = 1,
  pattern = "solid",
  accent,
}: {
  material: MaterialDef;
  color: string;
  className?: string;
  /** Higher values show the weave closer up. */
  zoom?: number;
  pattern?: PatternId;
  /** Second colour, used by patterns. */
  accent?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const shade = getWeaveThumb(material.weave, material.contrast);
      // Screen pixels per texture pixel, so every swatch shows a dozen or so threads.
      const scale = (zoom * dpr) / 1.5;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      if (pattern !== "solid" && accent) {
        // Accent colour cut to the pattern's shape, a few repeats across.
        const layer = document.createElement("canvas");
        layer.width = w;
        layer.height = h;
        const lctx = layer.getContext("2d")!;
        const mask = getPatternMask(pattern);
        const repeat = pattern === "tartan" ? 1.4 : 2.5;
        const tile = Math.max(w, h) / repeat;
        for (let y = 0; y < h; y += tile) {
          for (let x = 0; x < w; x += tile) lctx.drawImage(mask, x, y, tile, tile);
        }
        lctx.globalCompositeOperation = "source-in";
        lctx.fillStyle = accent;
        lctx.fillRect(0, 0, w, h);
        ctx.drawImage(layer, 0, 0);
      }
      ctx.globalCompositeOperation = "multiply";
      ctx.imageSmoothingQuality = "high";
      const sw = Math.min(shade.width, w / scale);
      const sh = Math.min(shade.height, h / scale);
      ctx.drawImage(shade, 0, 0, sw, sh, 0, 0, w, h);
      // Lift the result slightly so multiply does not dull the colour.
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(0, 0, w, h);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [material, color, zoom, pattern, accent]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

export default memo(Swatch);
