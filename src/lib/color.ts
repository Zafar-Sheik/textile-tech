import chroma from "chroma-js";
import { MATERIALS } from "./materials";

const INK = "#1b1a17";
const PAPER = "#f2eee6";

const NAMED = MATERIALS.flatMap((m) => m.palette);

export function isValidHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** Name for a colour: exact palette name, or the perceptually nearest one. */
export function colorName(hex: string): { name: string; exact: boolean } {
  let best = NAMED[0];
  let bestDistance = Infinity;
  for (const swatch of NAMED) {
    const distance = chroma.deltaE(hex, swatch.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = swatch;
    }
  }
  return { name: best.name, exact: bestDistance < 1 };
}

/** Seven steps from light to dark that keep the hue of the given colour. */
export function tonalRange(hex: string): string[] {
  const [, c, h] = chroma(hex).oklch();
  const hue = Number.isNaN(h) ? 0 : h;
  return [0.93, 0.82, 0.7, 0.58, 0.46, 0.34, 0.22].map((l) => {
    // Chroma tapers towards the extremes so tints and shades stay in gamut.
    const taper = 1 - Math.abs(l - 0.6) * 1.1;
    return chroma.oklch(l, c * Math.max(0.35, taper), hue).hex();
  });
}

export interface Harmony {
  label: string;
  hex: string;
}

/** Colours that sit well next to the given one, rotated in OKLCH. */
export function harmonies(hex: string): Harmony[] {
  const [l, c, h] = chroma(hex).oklch();
  const hue = Number.isNaN(h) ? 0 : h;
  // Near-neutrals have no hue to rotate, so give partners a little colour.
  const partnerChroma = Math.max(c, 0.06);
  const rotate = (degrees: number) =>
    chroma.oklch(l, partnerChroma, (hue + degrees + 360) % 360).hex();
  return [
    { label: "Analogous", hex: rotate(-32) },
    { label: "Analogous", hex: rotate(32) },
    { label: "Triad", hex: rotate(120) },
    { label: "Complement", hex: rotate(180) },
  ];
}

/** Ink or paper, whichever reads better on top of the colour. */
export function readableOn(hex: string): string {
  return chroma.contrast(hex, INK) >= chroma.contrast(hex, PAPER) ? INK : PAPER;
}

/** A pale wash of the colour, used behind the 3D stage. */
export function stageTint(hex: string): string {
  return chroma.mix(PAPER, hex, 0.14, "oklab").hex();
}

export function randomColor(): string {
  return chroma
    .oklch(0.3 + Math.random() * 0.5, 0.04 + Math.random() * 0.16, Math.random() * 360)
    .hex();
}
