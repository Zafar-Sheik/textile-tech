import type { WeaveKind } from "./materials";

/**
 * Procedural fabric surfaces. Each weave is described as a tileable height
 * field, from which we derive a normal map (3D relief), an albedo map (thread
 * level colour variation). 2D swatches use a separate, much smaller preview.
 */

const SIZE = 512;

export interface WeaveMaps {
  normal: HTMLCanvasElement;
  albedo: HTMLCanvasElement;
}

function fract(n: number) {
  return n - Math.floor(n);
}

function hash2(x: number, y: number) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

/** Value noise that repeats every `px` by `py` cells. */
function noise(x: number, y: number, px: number, py: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(mod(xi, px), mod(yi, py));
  const b = hash2(mod(xi + 1, px), mod(yi, py));
  const c = hash2(mod(xi, px), mod(yi + 1, py));
  const d = hash2(mod(xi + 1, px), mod(yi + 1, py));
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function smoothstep(lo: number, hi: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

interface WovenSpec {
  /** Threads per tile. Must be a multiple of the weave's repeat. */
  count: number;
  /** True when the warp (vertical) thread is on top at this crossing. */
  warpOver: (cx: number, cy: number) => boolean;
  /** Thread thickness irregularity. */
  slub: number;
  /** Per-pixel fibre fuzz. */
  fuzz: number;
  /** How far weft threads sit below warp threads (shows as colour in denim). */
  weftDrop: number;
}

function woven(u: number, v: number, spec: WovenSpec) {
  const { count } = spec;
  const x = u * count;
  const y = v * count;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  const fx = x - cx;
  const fy = y - cy;
  const warp = spec.warpOver(cx, cy);
  const across = warp ? fx : fy;
  const along = warp ? fy : fx;
  // Thickness varies slowly along each thread.
  const thread = warp ? cx : cy + 977;
  const travel = (warp ? v : u) * 8;
  const thick = 1 - spec.slub * noise(thread * 13.37, travel, 4096, 8);
  const profile = Math.pow(Math.sin(Math.PI * across), 0.7);
  const crown = 0.7 + 0.3 * Math.sin(Math.PI * along);
  let h = profile * crown * thick;
  if (!warp) h *= 1 - spec.weftDrop;
  h += spec.fuzz * (hash2(u * SIZE, v * SIZE) - 0.5);
  return h;
}

const WOVEN: Partial<Record<WeaveKind, WovenSpec>> = {
  plain: {
    count: 64,
    warpOver: (cx, cy) => (cx + cy) % 2 === 0,
    slub: 0.25,
    fuzz: 0.08,
    weftDrop: 0,
  },
  slub: {
    count: 48,
    warpOver: (cx, cy) => (cx + cy) % 2 === 0,
    slub: 0.75,
    fuzz: 0.12,
    weftDrop: 0,
  },
  fine: {
    count: 128,
    warpOver: (cx, cy) => (cx + cy) % 2 === 0,
    slub: 0.15,
    fuzz: 0.03,
    weftDrop: 0,
  },
  wooltwill: {
    count: 64,
    warpOver: (cx, cy) => mod(cx - cy, 4) < 2,
    slub: 0.4,
    fuzz: 0.35,
    weftDrop: 0,
  },
  twill: {
    count: 96,
    warpOver: (cx, cy) => mod(cx - cy, 4) !== 0,
    slub: 0.3,
    fuzz: 0.1,
    weftDrop: 0.45,
  },
  herringbone: {
    count: 64,
    warpOver: (cx, cy) =>
      mod(Math.floor(cx / 8) % 2 === 0 ? cx - cy : cx + cy, 4) < 2,
    slub: 0.5,
    fuzz: 0.3,
    weftDrop: 0.3,
  },
  basket: {
    count: 40,
    warpOver: (cx, cy) => (Math.floor(cx / 2) + Math.floor(cy / 2)) % 2 === 0,
    slub: 0.35,
    fuzz: 0.1,
    weftDrop: 0,
  },
  satin: {
    count: 80,
    warpOver: (cx, cy) => mod(cx * 2 + cy, 5) !== 0,
    slub: 0.1,
    fuzz: 0.02,
    weftDrop: 0.2,
  },
};

function pile(u: number, v: number) {
  const fibres = hash2(u * SIZE, v * SIZE);
  const tufts = noise(u * 180, v * 180, 180, 180);
  const crush = noise(u * 7, v * 7, 7, 7);
  return 0.35 * fibres + 0.35 * tufts + 0.3 * crush;
}

/** Corduroy: raised wales of pile running along the warp. */
function cord(u: number, v: number) {
  const wale = Math.pow(Math.abs(Math.sin(Math.PI * u * 14)), 0.55);
  const fibres = hash2(u * SIZE, v * SIZE);
  return wale * (0.8 + 0.2 * noise(u * 90, v * 90, 90, 90)) + 0.12 * fibres;
}

/** Jersey: columns of V-shaped knit stitches. */
function knit(u: number, v: number) {
  const x = u * 28;
  const y = v * 36;
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const strand = (centre: number) => {
    const d = (fx - centre) / 0.15;
    return Math.exp(-d * d);
  };
  const legs = Math.max(strand(0.24 + 0.2 * fy), strand(0.76 - 0.2 * fy));
  return legs * (0.7 + 0.3 * Math.sin(Math.PI * fy)) + 0.06 * hash2(u * SIZE, v * SIZE);
}

/** Suede: a fine brushed nap with faint directional streaks. */
function nap(u: number, v: number) {
  return (
    0.45 * noise(u * 220, v * 220, 220, 220) +
    0.3 * noise(u * 48, v * 9, 48, 9) +
    0.25 * hash2(u * SIZE, v * SIZE)
  );
}

const GRAIN_CELLS = 26;

function grain(u: number, v: number) {
  const x = u * GRAIN_CELLS;
  const y = v * GRAIN_CELLS;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 9;
  let f2 = 9;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const gx = xi + ox;
      const gy = yi + oy;
      const wx = mod(gx, GRAIN_CELLS);
      const wy = mod(gy, GRAIN_CELLS);
      const px = gx + 0.15 + 0.7 * hash2(wx, wy);
      const py = gy + 0.15 + 0.7 * hash2(wy + 41, wx + 17);
      const d = Math.hypot(px - x, py - y);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  const pebble = smoothstep(0.02, 0.3, f2 - f1);
  const dome = 1 - f1 * 0.5;
  const pores = noise(u * 120, v * 120, 120, 120);
  return 0.7 * pebble * dome + 0.2 * noise(u * 5, v * 5, 5, 5) + 0.1 * pores;
}

const SURFACES: Partial<Record<WeaveKind, (u: number, v: number) => number>> = {
  pile,
  grain,
  cord,
  knit,
  nap,
};

/** Samples the top-left `size` x `size` pixels of a weave's height field. */
function heightField(kind: WeaveKind, size: number): Float32Array {
  const field = new Float32Array(size * size);
  const spec = WOVEN[kind];
  const surface = SURFACES[kind] ?? grain;
  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / SIZE;
      const v = (y + 0.5) / SIZE;
      const h = spec ? woven(u, v, spec) : surface(u, v);
      field[y * size + x] = h;
      if (h < min) min = h;
      if (h > max) max = h;
    }
  }
  const range = max - min || 1;
  for (let i = 0; i < field.length; i++) field[i] = (field[i] - min) / range;
  return field;
}

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

const RELIEF = 2.2;
const cache = new Map<string, WeaveMaps>();

/** Builds (once) the full-size texture maps for a weave. Browser only. */
export function getWeaveMaps(kind: WeaveKind, contrast: number): WeaveMaps {
  const key = `${kind}:${contrast}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const field = heightField(kind, SIZE);
  const normal = makeCanvas(SIZE);
  const albedo = makeCanvas(SIZE);
  const nCtx = normal.getContext("2d")!;
  const aCtx = albedo.getContext("2d")!;
  const nData = nCtx.createImageData(SIZE, SIZE);
  const aData = aCtx.createImageData(SIZE, SIZE);

  for (let y = 0; y < SIZE; y++) {
    const up = mod(y - 1, SIZE) * SIZE;
    const down = mod(y + 1, SIZE) * SIZE;
    for (let x = 0; x < SIZE; x++) {
      const left = mod(x - 1, SIZE);
      const right = mod(x + 1, SIZE);
      const row = y * SIZE;
      const h = field[row + x];
      const dx = (field[row + right] - field[row + left]) * RELIEF;
      const dy = (field[down + x] - field[up + x]) * RELIEF;
      // Tangent-space normal; canvas rows run opposite to texture V.
      const inv = 1 / Math.hypot(dx, dy, 1);
      const i = (row + x) * 4;
      nData.data[i] = (-dx * inv * 0.5 + 0.5) * 255;
      nData.data[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
      nData.data[i + 2] = (inv * 0.5 + 0.5) * 255;
      nData.data[i + 3] = 255;

      const tone = (1 - contrast + contrast * h) * 255;
      aData.data[i] = aData.data[i + 1] = aData.data[i + 2] = tone;
      aData.data[i + 3] = 255;
    }
  }
  nCtx.putImageData(nData, 0, 0);
  aCtx.putImageData(aData, 0, 0);

  const maps = { normal, albedo };
  cache.set(key, maps);
  return maps;
}

/** Side length of the shaded preview used for 2D swatches. */
const THUMB = 192;
const thumbCache = new Map<string, HTMLCanvasElement>();

/**
 * A small greyscale close-up of a weave, lit from the top-left. Only this
 * corner of the height field is computed, so swatches cost a fraction of the
 * full maps.
 */
export function getWeaveThumb(kind: WeaveKind, contrast: number): HTMLCanvasElement {
  const key = `${kind}:${contrast}`;
  const cached = thumbCache.get(key);
  if (cached) return cached;

  const field = heightField(kind, THUMB);
  const canvas = makeCanvas(THUMB);
  const ctx = canvas.getContext("2d")!;
  const data = ctx.createImageData(THUMB, THUMB);
  const last = THUMB - 1;
  for (let y = 0; y < THUMB; y++) {
    const up = Math.max(0, y - 1) * THUMB;
    const down = Math.min(last, y + 1) * THUMB;
    for (let x = 0; x < THUMB; x++) {
      const row = y * THUMB;
      const h = field[row + x];
      const dx = (field[row + Math.min(last, x + 1)] - field[row + Math.max(0, x - 1)]) * RELIEF;
      const dy = (field[down + x] - field[up + x]) * RELIEF;
      const lit = 0.5 + 0.5 * h * (0.6 + contrast) - (dx + dy) * 0.35;
      const value = Math.min(1, Math.max(0.12, lit)) * 255;
      const i = (row + x) * 4;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
      data.data[i + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
  thumbCache.set(key, canvas);
  return canvas;
}
