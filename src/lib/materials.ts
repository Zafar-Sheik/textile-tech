export type MaterialId =
  | "cotton"
  | "linen"
  | "silk"
  | "wool"
  | "denim"
  | "velvet"
  | "leather"
  | "satin";

export type WeaveKind =
  | "plain"
  | "slub"
  | "fine"
  | "wooltwill"
  | "twill"
  | "pile"
  | "grain"
  | "satin";

export interface Swatch {
  name: string;
  hex: string;
}

/** How the cloth hangs. Tweened when the material changes. */
export interface DrapeParams {
  /** Number of vertical folds across the width. */
  folds: number;
  /** Fold depth in world units. */
  depth: number;
  /** 0 = crisp regular pleats, 1 = soft irregular folds. */
  soft: number;
  /** How much the cloth moves in the air. */
  flutter: number;
}

/** Physically based surface response. Tweened when the material changes. */
export interface SurfaceParams {
  roughness: number;
  sheen: number;
  sheenRoughness: number;
  clearcoat: number;
  anisotropy: number;
  normalScale: number;
}

export interface MaterialDef {
  id: MaterialId;
  name: string;
  tagline: string;
  description: string;
  weave: WeaveKind;
  weaveLabel: string;
  weight: string;
  hand: string;
  /** Texture tiles per world unit. */
  repeat: number;
  /** How strongly the weave shows in the base colour (0..1). */
  contrast: number;
  drape: DrapeParams;
  surface: SurfaceParams;
  palette: Swatch[];
}

export const MATERIALS: MaterialDef[] = [
  {
    id: "cotton",
    name: "Cotton",
    tagline: "Honest, matte, everyday",
    description:
      "A balanced plain weave with a dry, matte face. Takes colour evenly and hangs in relaxed, medium folds.",
    weave: "plain",
    weaveLabel: "Plain weave",
    weight: "150 gsm",
    hand: "Crisp, breathable",
    repeat: 1.5,
    contrast: 0.22,
    drape: { folds: 5, depth: 0.16, soft: 0.5, flutter: 0.6 },
    surface: { roughness: 0.92, sheen: 0.3, sheenRoughness: 0.9, clearcoat: 0, anisotropy: 0, normalScale: 0.9 },
    palette: [
      { name: "Chalk", hex: "#f1ece2" },
      { name: "Oat", hex: "#d9c9ae" },
      { name: "Sage", hex: "#9aa88a" },
      { name: "Dusty Rose", hex: "#d4a39a" },
      { name: "Sky Wash", hex: "#a9c2d6" },
      { name: "Marigold", hex: "#e0a73a" },
      { name: "Terracotta", hex: "#c2613f" },
      { name: "Ink Navy", hex: "#27344d" },
    ],
  },
  {
    id: "linen",
    name: "Linen",
    tagline: "Slubbed, dry, effortless",
    description:
      "Flax yarns of uneven thickness give linen its slubbed texture. It creases rather than flows, with a cool dry hand.",
    weave: "slub",
    weaveLabel: "Slub plain weave",
    weight: "190 gsm",
    hand: "Dry, textured",
    repeat: 1.5,
    contrast: 0.3,
    drape: { folds: 4, depth: 0.17, soft: 0.85, flutter: 0.5 },
    surface: { roughness: 0.96, sheen: 0.15, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 1.2 },
    palette: [
      { name: "Natural Flax", hex: "#cdbfa3" },
      { name: "Bone", hex: "#e8e1d2" },
      { name: "Stone", hex: "#a39c8e" },
      { name: "Olive Grove", hex: "#777a4e" },
      { name: "Clay", hex: "#b77b5c" },
      { name: "Sea Glass", hex: "#9dbdb1" },
      { name: "Indigo Dip", hex: "#3f5578" },
      { name: "Charcoal", hex: "#45433f" },
    ],
  },
  {
    id: "silk",
    name: "Silk",
    tagline: "Fluid, luminous, fine",
    description:
      "Filament yarns woven so finely the surface reads as liquid. Falls in many narrow folds and moves with the slightest air.",
    weave: "fine",
    weaveLabel: "Fine habotai",
    weight: "60 gsm",
    hand: "Fluid, cool",
    repeat: 1.6,
    contrast: 0.08,
    drape: { folds: 8, depth: 0.13, soft: 1, flutter: 1 },
    surface: { roughness: 0.38, sheen: 1, sheenRoughness: 0.3, clearcoat: 0, anisotropy: 0.55, normalScale: 0.25 },
    palette: [
      { name: "Champagne", hex: "#ead9b8" },
      { name: "Pearl", hex: "#f3ede4" },
      { name: "Blush", hex: "#e9b8b4" },
      { name: "Jade", hex: "#2f8f77" },
      { name: "Sapphire", hex: "#1f4fa3" },
      { name: "Amethyst", hex: "#6d4a9c" },
      { name: "Scarlet", hex: "#c01f2e" },
      { name: "Onyx", hex: "#1c1b1f" },
    ],
  },
  {
    id: "wool",
    name: "Wool",
    tagline: "Warm, lofty, deep",
    description:
      "A 2/2 twill of springy, fuzzy yarn. Absorbs light for rich, saturated colour and hangs in few, heavy folds.",
    weave: "wooltwill",
    weaveLabel: "2/2 twill",
    weight: "340 gsm",
    hand: "Warm, springy",
    repeat: 1.3,
    contrast: 0.26,
    drape: { folds: 3.5, depth: 0.2, soft: 0.6, flutter: 0.3 },
    surface: { roughness: 1, sheen: 0.6, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 1.1 },
    palette: [
      { name: "Heather Grey", hex: "#8e8f93" },
      { name: "Camel", hex: "#b98b56" },
      { name: "Oatmeal", hex: "#d3c6ad" },
      { name: "Forest", hex: "#2f4a3a" },
      { name: "Burgundy", hex: "#6b1f2b" },
      { name: "Mustard", hex: "#c2932d" },
      { name: "Petrol", hex: "#235563" },
      { name: "Peat", hex: "#3d332c" },
    ],
  },
  {
    id: "denim",
    name: "Denim",
    tagline: "Rugged, diagonal, lived-in",
    description:
      "A warp-faced twill with its signature diagonal rib and pale weft showing through. Stiff, with broad structural folds.",
    weave: "twill",
    weaveLabel: "3/1 twill",
    weight: "400 gsm",
    hand: "Stiff, sturdy",
    repeat: 1.3,
    contrast: 0.42,
    drape: { folds: 3, depth: 0.19, soft: 0.3, flutter: 0.25 },
    surface: { roughness: 0.9, sheen: 0.1, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 1.3 },
    palette: [
      { name: "Raw Indigo", hex: "#1f2f52" },
      { name: "Mid Wash", hex: "#44628f" },
      { name: "Stone Wash", hex: "#7f9cc0" },
      { name: "Bleach", hex: "#b9cbe0" },
      { name: "Black Rinse", hex: "#23242a" },
      { name: "Ecru", hex: "#e2d9c3" },
      { name: "Moss", hex: "#5e6b48" },
      { name: "Rust", hex: "#9c4a2c" },
    ],
  },
  {
    id: "velvet",
    name: "Velvet",
    tagline: "Plush, dark, dramatic",
    description:
      "A dense cut pile that drinks light head-on and glows at the edges of every fold. Heavy, with deep sculptural drape.",
    weave: "pile",
    weaveLabel: "Cut pile",
    weight: "320 gsm",
    hand: "Plush, heavy",
    repeat: 1.2,
    contrast: 0.2,
    drape: { folds: 4.5, depth: 0.22, soft: 0.7, flutter: 0.35 },
    surface: { roughness: 1, sheen: 1, sheenRoughness: 0.45, clearcoat: 0, anisotropy: 0, normalScale: 0.5 },
    palette: [
      { name: "Oxblood", hex: "#5e1420" },
      { name: "Emerald", hex: "#0f5c46" },
      { name: "Midnight", hex: "#151c44" },
      { name: "Plum", hex: "#4a1f4f" },
      { name: "Peacock", hex: "#0e5a6b" },
      { name: "Ochre", hex: "#b07a1c" },
      { name: "Dusk Rose", hex: "#a8626b" },
      { name: "Graphite", hex: "#2a2b30" },
    ],
  },
  {
    id: "leather",
    name: "Leather",
    tagline: "Grained, supple, enduring",
    description:
      "Not woven at all: a pebbled grain with a soft waxed finish. Bends in a few broad, weighty folds and barely stirs.",
    weave: "grain",
    weaveLabel: "Pebbled grain",
    weight: "1.2 mm",
    hand: "Supple, dense",
    repeat: 0.9,
    contrast: 0.3,
    drape: { folds: 2, depth: 0.14, soft: 0.4, flutter: 0.1 },
    surface: { roughness: 0.5, sheen: 0, sheenRoughness: 1, clearcoat: 0.35, anisotropy: 0, normalScale: 0.9 },
    palette: [
      { name: "Cognac", hex: "#9a5a2c" },
      { name: "Saddle", hex: "#7a4424" },
      { name: "Espresso", hex: "#33211a" },
      { name: "Jet", hex: "#18171a" },
      { name: "Cordovan", hex: "#5c1f22" },
      { name: "Tan", hex: "#c49a6c" },
      { name: "Bottle Green", hex: "#24402f" },
      { name: "Ivory", hex: "#e4dccb" },
    ],
  },
  {
    id: "satin",
    name: "Satin",
    tagline: "Glossy, smooth, formal",
    description:
      "Long floating yarns give satin its unbroken, mirror-like face. Highlights race along every fold as it moves.",
    weave: "satin",
    weaveLabel: "5-end satin",
    weight: "110 gsm",
    hand: "Slick, smooth",
    repeat: 1.4,
    contrast: 0.06,
    drape: { folds: 6, depth: 0.17, soft: 0.9, flutter: 0.8 },
    surface: { roughness: 0.22, sheen: 0.8, sheenRoughness: 0.2, clearcoat: 0, anisotropy: 0.75, normalScale: 0.15 },
    palette: [
      { name: "Moonlight", hex: "#ece6da" },
      { name: "Rose Gold", hex: "#dba99b" },
      { name: "Gilt", hex: "#c9a45c" },
      { name: "Ruby", hex: "#a3142b" },
      { name: "Royal", hex: "#2438a8" },
      { name: "Teal", hex: "#0f7f85" },
      { name: "Lilac", hex: "#b9a3d9" },
      { name: "Noir", hex: "#141316" },
    ],
  },
];

export const MATERIAL_BY_ID = Object.fromEntries(
  MATERIALS.map((m) => [m.id, m]),
) as Record<MaterialId, MaterialDef>;

export const DEFAULT_MATERIAL: MaterialId = "velvet";

export function isMaterialId(value: string | null): value is MaterialId {
  return value !== null && value in MATERIAL_BY_ID;
}
