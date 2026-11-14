export type MaterialId =
  | "cotton"
  | "linen"
  | "silk"
  | "wool"
  | "denim"
  | "velvet"
  | "leather"
  | "satin"
  | "corduroy"
  | "jersey"
  | "tweed"
  | "canvas"
  | "suede"
  | "lame"
  | "flannel"
  | "taffeta";

export type WeaveKind =
  | "plain"
  | "slub"
  | "fine"
  | "wooltwill"
  | "twill"
  | "pile"
  | "grain"
  | "satin"
  | "cord"
  | "knit"
  | "herringbone"
  | "basket"
  | "nap";

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
  metalness: number;
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
    surface: { roughness: 0.92, metalness: 0, sheen: 0.3, sheenRoughness: 0.9, clearcoat: 0, anisotropy: 0, normalScale: 0.9 },
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
    surface: { roughness: 0.96, metalness: 0, sheen: 0.15, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 1.2 },
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
    surface: { roughness: 0.38, metalness: 0, sheen: 1, sheenRoughness: 0.3, clearcoat: 0, anisotropy: 0.55, normalScale: 0.25 },
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
    surface: { roughness: 1, metalness: 0, sheen: 0.6, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 1.1 },
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
    surface: { roughness: 0.9, metalness: 0, sheen: 0.1, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 1.3 },
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
    surface: { roughness: 1, metalness: 0, sheen: 1, sheenRoughness: 0.45, clearcoat: 0, anisotropy: 0, normalScale: 0.5 },
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
    surface: { roughness: 0.5, metalness: 0, sheen: 0, sheenRoughness: 1, clearcoat: 0.35, anisotropy: 0, normalScale: 0.9 },
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
    surface: { roughness: 0.22, metalness: 0, sheen: 0.8, sheenRoughness: 0.2, clearcoat: 0, anisotropy: 0.75, normalScale: 0.15 },
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
  {
    id: "corduroy",
    name: "Corduroy",
    tagline: "Ribbed, soft, nostalgic",
    description:
      "Rows of cut pile form raised wales that run the length of the cloth. Light catches each rib, so the colour shifts as it turns.",
    weave: "cord",
    weaveLabel: "8-wale cord",
    weight: "300 gsm",
    hand: "Ribbed, soft",
    repeat: 1.2,
    contrast: 0.35,
    drape: { folds: 3.5, depth: 0.18, soft: 0.5, flutter: 0.3 },
    surface: { roughness: 1, metalness: 0, sheen: 0.7, sheenRoughness: 0.7, clearcoat: 0, anisotropy: 0, normalScale: 1.4 },
    palette: [
      { name: "Tobacco", hex: "#8a5a33" },
      { name: "Brick", hex: "#9b3d2a" },
      { name: "Pine", hex: "#2e4d3c" },
      { name: "Deep Navy", hex: "#1f2a44" },
      { name: "Honey", hex: "#c99a3a" },
      { name: "Cream", hex: "#e6dcc6" },
      { name: "Mauve", hex: "#8d6a7c" },
      { name: "Slate", hex: "#55606b" },
    ],
  },
  {
    id: "jersey",
    name: "Jersey",
    tagline: "Stretchy, soft, easy",
    description:
      "A single knit of interlocking loops, visible as columns of tiny V stitches. It clings and falls in soft, close folds.",
    weave: "knit",
    weaveLabel: "Single jersey knit",
    weight: "180 gsm",
    hand: "Stretchy, soft",
    repeat: 1.6,
    contrast: 0.25,
    drape: { folds: 6, depth: 0.14, soft: 1, flutter: 0.7 },
    surface: { roughness: 0.95, metalness: 0, sheen: 0.35, sheenRoughness: 0.9, clearcoat: 0, anisotropy: 0, normalScale: 0.9 },
    palette: [
      { name: "Optic White", hex: "#f4f3ef" },
      { name: "Heather", hex: "#b5b6b8" },
      { name: "Carbon", hex: "#1d1d1f" },
      { name: "Coral", hex: "#e8705c" },
      { name: "Cobalt", hex: "#2c54c7" },
      { name: "Fern", hex: "#2d9a5b" },
      { name: "Lemon", hex: "#f0d54a" },
      { name: "Lavender", hex: "#b8a9dc" },
    ],
  },
  {
    id: "tweed",
    name: "Tweed",
    tagline: "Coarse, rustic, tailored",
    description:
      "A heavy herringbone twill whose diagonal reverses every few threads into a zigzag. Rough to the touch and built to hold its shape.",
    weave: "herringbone",
    weaveLabel: "Herringbone twill",
    weight: "420 gsm",
    hand: "Coarse, sturdy",
    repeat: 1.1,
    contrast: 0.45,
    drape: { folds: 3, depth: 0.19, soft: 0.4, flutter: 0.2 },
    surface: { roughness: 1, metalness: 0, sheen: 0.4, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 1.2 },
    palette: [
      { name: "Bracken", hex: "#5a4a3a" },
      { name: "Moor Green", hex: "#4b5a43" },
      { name: "Granite", hex: "#6f7072" },
      { name: "Barley", hex: "#b59d6f" },
      { name: "Thistle", hex: "#6a5273" },
      { name: "Loch Blue", hex: "#3d566e" },
      { name: "Russet", hex: "#8a4b2d" },
      { name: "Coal", hex: "#2d2c2c" },
    ],
  },
  {
    id: "canvas",
    name: "Canvas",
    tagline: "Rigid, rugged, utilitarian",
    description:
      "Thick yarns woven two-over-two into a dense basket weave. Barely drapes at all, bending in a few broad planes.",
    weave: "basket",
    weaveLabel: "2/2 basket weave",
    weight: "450 gsm",
    hand: "Rigid, rugged",
    repeat: 1.2,
    contrast: 0.3,
    drape: { folds: 2.5, depth: 0.16, soft: 0.2, flutter: 0.15 },
    surface: { roughness: 0.97, metalness: 0, sheen: 0.05, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 1.4 },
    palette: [
      { name: "Undyed", hex: "#d8ccb2" },
      { name: "Sand", hex: "#c2ab84" },
      { name: "Khaki", hex: "#8f8559" },
      { name: "Field Green", hex: "#4f5a3c" },
      { name: "Sailcloth", hex: "#ebe7dc" },
      { name: "Buoy Orange", hex: "#d9642b" },
      { name: "Harbour Blue", hex: "#2f5d86" },
      { name: "Tar", hex: "#2a2a28" },
    ],
  },
  {
    id: "suede",
    name: "Suede",
    tagline: "Velvety, matte, tactile",
    description:
      "Leather buffed to a fine nap. Completely matte head-on, with a soft bloom of lighter colour wherever the surface turns away.",
    weave: "nap",
    weaveLabel: "Brushed nap",
    weight: "1.0 mm",
    hand: "Velvety, matte",
    repeat: 1,
    contrast: 0.22,
    drape: { folds: 2.5, depth: 0.16, soft: 0.5, flutter: 0.12 },
    surface: { roughness: 1, metalness: 0, sheen: 0.8, sheenRoughness: 0.8, clearcoat: 0, anisotropy: 0, normalScale: 0.45 },
    palette: [
      { name: "Sandstone", hex: "#c8a47c" },
      { name: "Taupe", hex: "#8c7a6a" },
      { name: "Chestnut", hex: "#7b452a" },
      { name: "Mushroom", hex: "#a8998a" },
      { name: "Storm Blue", hex: "#6f8296" },
      { name: "Lichen", hex: "#6b6a43" },
      { name: "Paprika", hex: "#a44a32" },
      { name: "Mocha", hex: "#4a3327" },
    ],
  },
  {
    id: "lame",
    name: "Lamé",
    tagline: "Metallic, glinting, bold",
    description:
      "Fine metallic yarns woven into a light plain weave. It reflects its surroundings like foil and flashes along every fold.",
    weave: "fine",
    weaveLabel: "Metallic plain weave",
    weight: "90 gsm",
    hand: "Crisp, glinting",
    repeat: 1.6,
    contrast: 0.1,
    drape: { folds: 7, depth: 0.14, soft: 0.9, flutter: 0.8 },
    surface: { roughness: 0.34, metalness: 0.9, sheen: 0, sheenRoughness: 1, clearcoat: 0, anisotropy: 0.4, normalScale: 0.5 },
    palette: [
      { name: "Antique Gold", hex: "#d4af37" },
      { name: "Sterling", hex: "#c4c7cc" },
      { name: "Rose Metal", hex: "#d9a093" },
      { name: "Copper", hex: "#b8693d" },
      { name: "Bronze", hex: "#8a6a3b" },
      { name: "Gunmetal", hex: "#53575e" },
      { name: "Electric Blue", hex: "#3b6fd6" },
      { name: "Magenta Foil", hex: "#c0338a" },
    ],
  },
  {
    id: "flannel",
    name: "Flannel",
    tagline: "Brushed, fuzzy, cosy",
    description:
      "A soft twill brushed until the weave almost disappears under a layer of fuzz. Warm, forgiving and gently rumpled.",
    weave: "wooltwill",
    weaveLabel: "Brushed twill",
    weight: "250 gsm",
    hand: "Fuzzy, cosy",
    repeat: 1.5,
    contrast: 0.2,
    drape: { folds: 4.5, depth: 0.16, soft: 0.8, flutter: 0.45 },
    surface: { roughness: 1, metalness: 0, sheen: 0.7, sheenRoughness: 1, clearcoat: 0, anisotropy: 0, normalScale: 0.7 },
    palette: [
      { name: "Lumber Red", hex: "#a32a2a" },
      { name: "Evergreen", hex: "#2c5140" },
      { name: "Porridge", hex: "#b9b1a4" },
      { name: "Night Blue", hex: "#26334f" },
      { name: "Maple", hex: "#c5672b" },
      { name: "Fog", hex: "#9aa3a8" },
      { name: "Blackwatch", hex: "#1f2f2c" },
      { name: "Buttermilk", hex: "#ecdfb8" },
    ],
  },
  {
    id: "taffeta",
    name: "Taffeta",
    tagline: "Crisp, rustling, formal",
    description:
      "A tightly woven, paper-crisp cloth with a dry shine. It holds sharp, sculptural folds instead of flowing.",
    weave: "fine",
    weaveLabel: "Crisp plain weave",
    weight: "85 gsm",
    hand: "Crisp, rustling",
    repeat: 1.6,
    contrast: 0.12,
    drape: { folds: 5, depth: 0.2, soft: 0.25, flutter: 0.5 },
    surface: { roughness: 0.3, metalness: 0, sheen: 0.9, sheenRoughness: 0.25, clearcoat: 0, anisotropy: 0.35, normalScale: 0.35 },
    palette: [
      { name: "Shot Emerald", hex: "#177a5a" },
      { name: "Garnet", hex: "#8a1a34" },
      { name: "Kingfisher", hex: "#0c6f8f" },
      { name: "Aubergine", hex: "#432046" },
      { name: "Old Gold", hex: "#b8923a" },
      { name: "Powder Pink", hex: "#ecc3cc" },
      { name: "Ice Blue", hex: "#c5dcec" },
      { name: "Ebony", hex: "#17161a" },
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

/** A random material other than the given one. */
export function randomMaterial(except: MaterialId): MaterialId {
  const others = MATERIALS.filter((m) => m.id !== except);
  return others[Math.floor(Math.random() * others.length)].id;
}
