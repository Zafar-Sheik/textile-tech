"use client";

import { useEffect, useRef } from "react";
import type { MaterialDef } from "@/lib/materials";
import { getWeaveMaps } from "@/lib/weave";

/** A flat close-up of a material's weave, dyed in the given colour. */
export default function Swatch({
  material,
  color,
  className = "",
  zoom = 1,
}: {
  material: MaterialDef;
  color: string;
  className?: string;
  /** Higher values show the weave closer up. */
  zoom?: number;
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
      const { shade } = getWeaveMaps(material.weave, material.contrast);
      // Screen pixels per texture pixel, so every swatch shows a dozen or so threads.
      const scale = (zoom * dpr) / 1.5;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
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
  }, [material, color, zoom]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
