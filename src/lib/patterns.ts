export type PatternId =
  | "solid"
  | "stripe"
  | "pinstripe"
  | "gingham"
  | "tartan"
  | "windowpane"
  | "dots"
  | "chevron";

export interface PatternDef {
  id: PatternId;
  name: string;
  /** Pattern repeats per world unit on the 3D cloth. */
  scale: number;
  /** How much accent colour shows at a point of the repeating tile (0..1). */
  mask: (u: number, v: number) => number;
}

const band = (x: number, from: number, to: number) => (x >= from && x < to ? 1 : 0);

/** The stripe layout shared by both directions of the tartan. */
function sett(x: number) {
  return Math.min(1, band(x, 0, 0.3) + band(x, 0.44, 0.47) + band(x, 0.6, 0.67));
}

export const PATTERNS: PatternDef[] = [
  { id: "solid", name: "Solid", scale: 1, mask: () => 0 },
  { id: "stripe", name: "Stripe", scale: 5, mask: (u) => band(u, 0, 0.5) },
  { id: "pinstripe", name: "Pinstripe", scale: 8, mask: (u) => band(u, 0, 0.1) },
  {
    id: "gingham",
    name: "Gingham",
    scale: 5,
    // Yarn-dyed checks: half strength where only one direction is coloured.
    mask: (u, v) => 0.5 * band(u, 0, 0.5) + 0.5 * band(v, 0, 0.5),
  },
  {
    id: "tartan",
    name: "Tartan",
    scale: 1.8,
    mask: (u, v) => 0.5 * sett(u) + 0.5 * sett(v),
  },
  {
    id: "windowpane",
    name: "Windowpane",
    scale: 3.5,
    mask: (u, v) => Math.max(band(u, 0, 0.06), band(v, 0, 0.06)),
  },
  {
    id: "dots",
    name: "Dots",
    scale: 5,
    mask: (u, v) => {
      const d = Math.min(Math.hypot(u - 0.25, v - 0.25), Math.hypot(u - 0.75, v - 0.75));
      return Math.min(1, Math.max(0, (0.17 - d) / 0.012));
    },
  },
  {
    id: "chevron",
    name: "Chevron",
    scale: 4,
    mask: (u, v) => {
      const zigzag = (v + Math.abs(u - 0.5)) * 2;
      return zigzag - Math.floor(zigzag) < 0.5 ? 1 : 0;
    },
  },
];

export const PATTERN_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p])) as Record<
  PatternId,
  PatternDef
>;

export const DEFAULT_PATTERN: PatternId = "solid";
export const DEFAULT_ACCENT = "#f1ece2";

export function isPatternId(value: string | null | undefined): value is PatternId {
  return typeof value === "string" && value in PATTERN_BY_ID;
}

const MASK_SIZE = 512;
const cache = new Map<PatternId, HTMLCanvasElement>();

/**
 * One repeat of a pattern as a white image whose alpha is the accent amount.
 * The 3D shader and the 2D swatches both blend base and accent through it, so
 * recolouring never needs a new texture. Browser only.
 */
export function getPatternMask(id: PatternId): HTMLCanvasElement {
  const cached = cache.get(id);
  if (cached) return cached;
  const { mask } = PATTERN_BY_ID[id];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = MASK_SIZE;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(MASK_SIZE, MASK_SIZE);
  for (let y = 0; y < MASK_SIZE; y++) {
    for (let x = 0; x < MASK_SIZE; x++) {
      const i = (y * MASK_SIZE + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
      image.data[i + 3] = 255 * mask((x + 0.5) / MASK_SIZE, (y + 0.5) / MASK_SIZE);
    }
  }
  ctx.putImageData(image, 0, 0);
  cache.set(id, canvas);
  return canvas;
}
