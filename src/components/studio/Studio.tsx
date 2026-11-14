"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import FabricCanvas from "@/components/fabric/FabricCanvas";
import type { Snapshot } from "@/components/fabric/FabricScene";
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
import { FORMS, FORM_BY_ID, isFormId } from "@/lib/forms";
import {
  MATERIALS,
  MATERIAL_BY_ID,
  isMaterialId,
  randomMaterial,
} from "@/lib/materials";
import { PATTERNS, PATTERN_BY_ID, isPatternId } from "@/lib/patterns";
import {
  currentLook,
  useConfigurator,
  type Lighting,
  type Look,
} from "@/store/useConfigurator";

gsap.registerPlugin(useGSAP);

const LIGHTINGS: { id: Lighting; name: string }[] = [
  { id: "studio", name: "Studio" },
  { id: "daylight", name: "Daylight" },
  { id: "evening", name: "Evening" },
];

function Chip({
  hex,
  label,
  selected,
  onPick,
}: {
  hex: string;
  label: string;
  selected?: boolean;
  onPick: (hex: string) => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onPick(hex)}
      className="relative aspect-square rounded-full border border-line transition-transform duration-200 hover:scale-110"
      style={{ background: hex }}
    >
      {selected && (
        <span className="absolute -inset-[5px] rounded-full border-2 border-ink" />
      )}
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors ${
        active ? "bg-ink text-paper" : "text-ink hover:bg-ink/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function Studio() {
  const materialId = useConfigurator((s) => s.materialId);
  const colors = useConfigurator((s) => s.colors);
  const formId = useConfigurator((s) => s.formId);
  const patternId = useConfigurator((s) => s.patternId);
  const accent = useConfigurator((s) => s.accent);
  const lighting = useConfigurator((s) => s.lighting);
  const motion = useConfigurator((s) => s.motion);
  const looks = useConfigurator((s) => s.looks);
  const {
    setMaterial,
    setColor,
    setForm,
    setPattern,
    setAccent,
    setLighting,
    setMotion,
    saveLook,
    removeLook,
    applyLook,
    reset,
  } = useConfigurator.getState();

  const material = MATERIAL_BY_ID[materialId];
  const form = FORM_BY_ID[formId];
  const color = colors[materialId];
  const patterned = patternId !== "solid";
  // With a pattern on, the colour tools can edit either of its two colours.
  const [target, setTarget] = useState<"base" | "accent">("base");
  const editingAccent = patterned && target === "accent";
  const active = editingAccent ? accent : color;
  const pick = editingAccent ? setAccent : setColor;
  // A second look held next to the live one for comparison.
  const [pinned, setPinned] = useState<Look | null>(null);
  // The 3D cloth follows the picker immediately; derived swatches may lag a frame.
  const settled = useDeferredValue(active);
  const named = useMemo(() => colorName(color), [color]);
  const tones = useMemo(() => tonalRange(settled), [settled]);
  const partners = useMemo(() => harmonies(settled), [settled]);

  const root = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const snapshot = useRef<Snapshot | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const onSnapshot = useCallback((fn: Snapshot | null) => {
    snapshot.current = fn;
  }, []);

  // Restore saved looks, honour reduced motion, and read deep links such as
  // /studio?m=silk&c=1f4fa3&v=skirt
  useEffect(() => {
    const store = useConfigurator.getState();
    void useConfigurator.persist.rehydrate();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      store.setMotion(false);
    }
    const params = new URLSearchParams(window.location.search);
    const m = params.get("m");
    if (isMaterialId(m)) store.setMaterial(m);
    const c = `#${params.get("c") ?? ""}`;
    if (isValidHex(c)) store.setColor(c);
    const v = params.get("v");
    if (isFormId(v)) store.setForm(v);
    const pattern = params.get("p");
    if (isPatternId(pattern)) store.setPattern(pattern);
    const a = `#${params.get("a") ?? ""}`;
    if (isValidHex(a)) store.setAccent(a);
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams({ m: materialId, c: color.slice(1), v: formId });
    if (patterned) {
      params.set("p", patternId);
      params.set("a", accent.slice(1));
    }
    return params.toString();
  }, [materialId, color, formId, patterned, patternId, accent]);

  // Keep the address bar shareable. Debounced: browsers throttle history calls.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, "", `?${query}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

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
    setMaterial(randomMaterial(materialId));
    setColor(randomColor());
  };

  const flash = (set: (value: boolean) => void) => {
    set(true);
    window.setTimeout(() => set(false), 1800);
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    try {
      await navigator.clipboard.writeText(url);
      flash(setCopied);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const download = () => {
    const dataUrl = snapshot.current?.(stageTint(color));
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${materialId}-${color.slice(1)}-${formId}.png`;
    link.click();
  };

  const compare = () => {
    setPinned(pinned ? null : currentLook(useConfigurator.getState()));
  };

  const swap = () => {
    if (!pinned) return;
    const live = currentLook(useConfigurator.getState());
    applyLook(pinned);
    setPinned(live);
  };

  const pinnedMaterial = pinned && MATERIAL_BY_ID[pinned.materialId];
  const paneLabel =
    "pointer-events-none absolute left-5 top-[4.5rem] text-sm lg:left-8 lg:top-24";

  const toolButton =
    "rounded-full border border-ink/25 bg-paper/60 px-3.5 py-1.5 text-xs backdrop-blur transition-colors hover:border-ink";

  return (
    <div
      ref={root}
      className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_420px]"
    >
      {/* Stage */}
      <section
        className={`relative min-h-[400px] overflow-hidden transition-colors duration-700 lg:h-auto ${
          pinned ? "h-[78dvh]" : "h-[60dvh]"
        }`}
        style={{ background: stageTint(color) }}
        aria-label="Live fabric preview"
      >
        <div
          className={`absolute inset-0 ${
            pinned ? "grid grid-rows-2 lg:grid-cols-2 lg:grid-rows-1" : "lg:left-[8%]"
          }`}
        >
          {pinned && pinnedMaterial && (
            <div
              key="pinned"
              className="relative h-full min-h-0 cursor-grab border-b border-ink/15 active:cursor-grabbing lg:border-b-0 lg:border-r"
              style={{ background: stageTint(pinned.color) }}
            >
              <FabricCanvas
                materialId={pinned.materialId}
                color={pinned.color}
                pattern={pinned.patternId}
                accent={pinned.accent}
                form={pinned.formId}
                lighting={lighting}
                motion={motion}
              />
              <p className={paneLabel}>
                <span className="eyebrow block">Pinned</span>
                {pinnedMaterial.name} · {colorName(pinned.color).name}
              </p>
            </div>
          )}
          <div key="live" className="relative h-full min-h-0 cursor-grab active:cursor-grabbing">
            <FabricCanvas
              materialId={materialId}
              color={color}
              pattern={patternId}
              accent={accent}
              form={formId}
              lighting={lighting}
              motion={motion}
              onSnapshot={onSnapshot}
            />
            {pinned && (
              <p className={paneLabel}>
                <span className="eyebrow block">Editing</span>
                {material.name} · {named.name}
              </p>
            )}
          </div>
        </div>

        <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-5 lg:p-8">
          <div className="pointer-events-auto">
            <Wordmark />
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button
              type="button"
              className={toolButton}
              onClick={() => {
                saveLook();
                flash(setSaved);
              }}
            >
              {saved ? "Saved" : "Save"}
            </button>
            <button type="button" className={toolButton} onClick={share}>
              {copied ? "Link copied" : "Share"}
            </button>
            <button
              type="button"
              className={`${toolButton} hidden sm:block`}
              onClick={download}
            >
              Snapshot
            </button>
            {pinned && (
              <button type="button" className={toolButton} onClick={swap}>
                Swap
              </button>
            )}
            <button
              type="button"
              aria-pressed={pinned !== null}
              className={pinned ? `${toolButton} !bg-ink !text-paper` : toolButton}
              onClick={compare}
            >
              {pinned ? "Close" : "Compare"}
            </button>
          </div>
        </header>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-3 lg:p-8">
          <div className={pinned ? "hidden" : "hidden lg:block"}>
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
              <span>{named.exact ? named.name : `Custom, near ${named.name}`}</span>
              <span className="font-mono text-xs uppercase text-muted">{color}</span>
            </p>
          </div>

          <div
            role="group"
            aria-label="Shape to preview on"
            className="pointer-events-auto ml-auto flex max-w-full gap-1 overflow-x-auto rounded-full border border-ink/15 bg-paper/75 p-1 backdrop-blur"
          >
            {FORMS.map((f) => (
              <Pill key={f.id} active={f.id === formId} onClick={() => setForm(f.id)}>
                {f.name}
              </Pill>
            ))}
          </div>
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
            <span className="text-xs text-muted">{MATERIALS.length} fabrics</span>
          </div>
          <div className="grid grid-cols-4 gap-x-2.5 gap-y-3">
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
                      className="block aspect-[4/3] w-full rounded-[9px]"
                    />
                  </span>
                  <span
                    className={`mt-1 block text-center text-xs ${
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
          {patterned && (
            <div
              role="group"
              aria-label="Colour to edit"
              className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-line p-1"
            >
              {(
                [
                  ["base", "Base", color],
                  ["accent", "Pattern", accent],
                ] as const
              ).map(([id, label, hex]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={target === id}
                  onClick={() => setTarget(id)}
                  className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm transition-colors ${
                    target === id ? "bg-ink text-paper" : "hover:bg-ink/10"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-paper/60"
                    style={{ background: hex }}
                  />
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-8 gap-3">
            {material.palette.map((swatch) => (
              <Chip
                key={swatch.hex}
                hex={swatch.hex}
                label={swatch.name}
                selected={swatch.hex === active}
                onPick={pick}
              />
            ))}
          </div>

          <div className="picker mt-6">
            <HexColorPicker color={active} onChange={pick} />
            <label className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2">
              <span
                className="h-7 w-7 shrink-0 rounded-full border border-line"
                style={{ background: active }}
              />
              <span className="eyebrow">Hex</span>
              <HexColorInput
                color={active}
                onChange={pick}
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
                  onClick={() => pick(tone)}
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
                  onClick={() => pick(partner.hex)}
                  className="rounded-xl border border-line px-2 pb-1.5 pt-6 text-left text-[11px] transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ background: partner.hex, color: readableOn(partner.hex) }}
                >
                  {partner.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section data-enter aria-labelledby="pattern-heading">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="pattern-heading" className="eyebrow">
              03 · Pattern
            </h2>
            <span className="text-xs text-muted">{PATTERN_BY_ID[patternId].name}</span>
          </div>
          <div className="grid grid-cols-4 gap-x-2.5 gap-y-3">
            {PATTERNS.map((pattern) => {
              const selected = pattern.id === patternId;
              return (
                <button
                  key={pattern.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setPattern(pattern.id);
                    setTarget(pattern.id === "solid" ? "base" : "accent");
                  }}
                  className="group text-left"
                >
                  <span
                    className={`block overflow-hidden rounded-xl border-2 p-0.5 transition-colors ${
                      selected ? "border-ink" : "border-transparent group-hover:border-line"
                    }`}
                  >
                    <Swatch
                      material={material}
                      color={color}
                      pattern={pattern.id}
                      accent={accent}
                      className="block aspect-[4/3] w-full rounded-[9px]"
                    />
                  </span>
                  <span
                    className={`mt-1 block text-center text-xs ${
                      selected ? "font-medium text-ink" : "text-muted"
                    }`}
                  >
                    {pattern.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section data-enter aria-labelledby="light-heading">
          <h2 id="light-heading" className="eyebrow mb-4">
            04 · Light &amp; motion
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-4">
            <div
              role="group"
              aria-label="Lighting"
              className="flex gap-1 rounded-full border border-line p-1"
            >
              {LIGHTINGS.map((option) => (
                <Pill
                  key={option.id}
                  active={option.id === lighting}
                  onClick={() => setLighting(option.id)}
                >
                  {option.name}
                </Pill>
              ))}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={motion}
              onClick={() => setMotion(!motion)}
              className="flex items-center gap-2.5 text-sm"
            >
              Motion
              <span
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  motion ? "bg-ink" : "bg-ink/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper transition-[left] ${
                    motion ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            The same dye reads differently in warm and cool light. Turn motion
            off to save battery: the preview then redraws only when something
            changes.
          </p>
        </section>

        {looks.length > 0 && (
          <section aria-labelledby="looks-heading">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 id="looks-heading" className="eyebrow">
                Saved looks
              </h2>
              <span className="text-xs text-muted">Kept on this device</span>
            </div>
            <ul className="grid grid-cols-2 gap-2.5">
              {looks.map((look) => {
                const saved = MATERIAL_BY_ID[look.materialId];
                return (
                  <li key={look.id} className="relative">
                    <button
                      type="button"
                      onClick={() => applyLook(look)}
                      className="flex w-full items-center gap-3 rounded-xl border border-line p-1.5 pr-8 text-left transition-colors hover:border-ink"
                    >
                      <Swatch
                        material={saved}
                        color={look.color}
                        pattern={look.patternId}
                        accent={look.accent}
                        className="h-11 w-11 shrink-0 rounded-lg"
                      />
                      <span className="min-w-0 text-xs leading-tight">
                        <span className="block truncate text-sm">{saved.name}</span>
                        <span className="block truncate text-muted">
                          {FORM_BY_ID[look.formId].name}
                          {look.patternId && look.patternId !== "solid"
                            ? ` · ${PATTERN_BY_ID[look.patternId].name}`
                            : ""}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${saved.name} look`}
                      onClick={() => removeLook(look.id)}
                      className="absolute right-1.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full text-muted hover:bg-ink/10 hover:text-ink"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

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
        <p className="sr-only" aria-live="polite">
          {material.name} in {named.name}, shown {form.phrase}
        </p>
      </aside>
    </div>
  );
}
