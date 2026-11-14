"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import FabricCanvas from "@/components/fabric/FabricCanvas";
import Swatch from "@/components/Swatch";
import Wordmark from "@/components/Wordmark";
import {
  colorName,
  harmonies,
  isValidHex,
  randomColor,
  readableOn,
  stageTint,
  tonalRange,
} from "@/lib/color";
import { MATERIALS, MATERIAL_BY_ID, isMaterialId } from "@/lib/materials";
import { useConfigurator } from "@/store/useConfigurator";

gsap.registerPlugin(useGSAP);

function Chip({
  hex,
  label,
  selected,
  onPick,
  className = "",
}: {
  hex: string;
  label: string;
  selected?: boolean;
  onPick: (hex: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onPick(hex)}
      className={`relative aspect-square rounded-full border border-line transition-transform duration-200 hover:scale-110 ${className}`}
      style={{ background: hex }}
    >
      {selected && (
        <span className="absolute -inset-[5px] rounded-full border-2 border-ink" />
      )}
    </button>
  );
}

export default function Studio() {
  const materialId = useConfigurator((s) => s.materialId);
  const colors = useConfigurator((s) => s.colors);
  const setMaterial = useConfigurator((s) => s.setMaterial);
  const setColor = useConfigurator((s) => s.setColor);
  const reset = useConfigurator((s) => s.reset);

  const material = MATERIAL_BY_ID[materialId];
  const color = colors[materialId];
  const named = useMemo(() => colorName(color), [color]);
  const tones = useMemo(() => tonalRange(color), [color]);
  const partners = useMemo(() => harmonies(color), [color]);

  const root = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  // Deep links from the landing page: /studio?m=silk&c=1f4fa3
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("m");
    if (isMaterialId(m)) setMaterial(m);
    const c = `#${params.get("c") ?? ""}`;
    if (isValidHex(c)) setColor(c);
  }, [setMaterial, setColor]);

  useGSAP(
    () => {
      gsap.from("[data-enter]", {
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.06,
        clearProps: "all",
      });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      gsap.fromTo(
        title.current,
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
      );
    },
    { dependencies: [materialId], scope: root },
  );

  const surprise = () => {
    const others = MATERIALS.filter((m) => m.id !== materialId);
    const next = others[Math.floor(Math.random() * others.length)];
    setMaterial(next.id);
    setColor(randomColor());
  };

  return (
    <div
      ref={root}
      className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_420px]"
    >
      {/* Stage */}
      <section
        className="relative h-[58dvh] min-h-[380px] overflow-hidden transition-colors duration-700 lg:h-auto"
        style={{ background: stageTint(color) }}
        aria-label="Live fabric preview"
      >
        <div className="absolute inset-0 cursor-grab active:cursor-grabbing lg:left-[10%]">
          <FabricCanvas materialId={materialId} color={color} />
        </div>

        <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5 lg:p-8">
          <div className="pointer-events-auto">
            <Wordmark />
          </div>
          <span className="eyebrow hidden sm:block">Drag to turn · scroll to zoom</span>
        </header>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden p-8 lg:block">
          <p className="eyebrow mb-1">Now showing</p>
          <div className="overflow-hidden">
            <h1
              ref={title}
              className="font-display text-7xl leading-[0.95] tracking-tight"
            >
              {material.name}
            </h1>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3.5 w-3.5 rounded-full border border-line"
              style={{ background: color }}
            />
            <span>
              {named.exact ? named.name : `Custom, near ${named.name}`}
            </span>
            <span className="font-mono text-xs uppercase text-muted">{color}</span>
          </p>
        </div>
      </section>

      {/* Controls */}
      <aside className="flex flex-col gap-9 border-line bg-card p-5 lg:overflow-y-auto lg:border-l lg:p-8">
        <div className="flex items-end justify-between gap-4 lg:hidden">
          <div>
            <p className="eyebrow mb-1">Now showing</p>
            <p className="font-display text-5xl leading-none tracking-tight">{material.name}</p>
          </div>
          <p className="flex items-center gap-2 pb-1 text-sm">
            <span
              className="inline-block h-3.5 w-3.5 rounded-full border border-line"
              style={{ background: color }}
            />
            {named.exact ? named.name : `Near ${named.name}`}
          </p>
        </div>

        <section data-enter aria-labelledby="material-heading">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="material-heading" className="eyebrow">
              01 · Material
            </h2>
            <span className="text-xs text-muted">{material.weaveLabel}</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5 lg:grid-cols-4">
            {MATERIALS.map((m) => {
              const active = m.id === materialId;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMaterial(m.id)}
                  className="group text-left"
                >
                  <span
                    className={`block overflow-hidden rounded-xl border-2 p-0.5 transition-colors ${
                      active ? "border-ink" : "border-transparent group-hover:border-line"
                    }`}
                  >
                    <Swatch
                      material={m}
                      color={colors[m.id]}
                      className="block aspect-square w-full rounded-[9px]"
                    />
                  </span>
                  <span
                    className={`mt-1.5 block text-center text-xs ${
                      active ? "font-medium text-ink" : "text-muted"
                    }`}
                  >
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{material.description}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
            {[
              ["Weave", material.weaveLabel],
              ["Weight", material.weight],
              ["Hand", material.hand],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="eyebrow mb-1">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section data-enter aria-labelledby="colour-heading">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="colour-heading" className="eyebrow">
              02 · Colour for {material.name}
            </h2>
            <span className="text-xs text-muted">Curated range</span>
          </div>
          <div className="grid grid-cols-8 gap-3">
            {material.palette.map((swatch) => (
              <Chip
                key={swatch.hex}
                hex={swatch.hex}
                label={swatch.name}
                selected={swatch.hex === color}
                onPick={setColor}
              />
            ))}
          </div>

          <div className="picker mt-6">
            <HexColorPicker color={color} onChange={setColor} />
            <label className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2">
              <span
                className="h-7 w-7 shrink-0 rounded-full border border-line"
                style={{ background: color }}
              />
              <span className="eyebrow">Hex</span>
              <HexColorInput
                color={color}
                onChange={setColor}
                prefixed
                aria-label="Hex colour"
                className="w-full bg-transparent font-mono text-sm uppercase outline-none"
              />
            </label>
          </div>

          <div className="mt-6">
            <h3 className="eyebrow mb-2.5">Tonal range</h3>
            <div className="flex overflow-hidden rounded-xl border border-line">
              {tones.map((tone, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Tone ${index + 1} of ${tones.length}, ${tone}`}
                  title={tone}
                  onClick={() => setColor(tone)}
                  className="h-10 flex-1 transition-[flex-grow] duration-300 hover:grow-[1.8]"
                  style={{ background: tone }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="eyebrow mb-2.5">Pairs well with</h3>
            <div className="grid grid-cols-4 gap-2">
              {partners.map((partner, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setColor(partner.hex)}
                  className="rounded-xl border border-line px-2 pb-1.5 pt-6 text-left text-[11px] transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ background: partner.hex, color: readableOn(partner.hex) }}
                >
                  {partner.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div data-enter className="mt-auto flex gap-3 border-t border-line pt-6">
          <button
            type="button"
            onClick={surprise}
            className="flex-1 rounded-full bg-ink px-5 py-3 text-sm text-paper transition-opacity hover:opacity-85"
          >
            Surprise me
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-line px-5 py-3 text-sm transition-colors hover:border-ink"
          >
            Reset
          </button>
        </div>
      </aside>
    </div>
  );
}
