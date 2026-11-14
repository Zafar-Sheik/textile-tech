# Textile Tech

A real-time fabric visualiser. Pick a material, give it a colour, and a 3D
draped length of cloth updates instantly — weave, sheen and fold included.

- `/` — landing page with scroll animations and a live hero drape
- `/studio` — the configurator (`/studio?m=silk&c=1f4fa3&v=skirt` deep-links a look)

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Three.js / React Three Fiber / drei** — the draped cloth and lighting
- **GSAP** (+ ScrollTrigger, `@gsap/react`) — material morphs, colour tweens, page motion
- **chroma.js** — OKLab colour blending, tonal ranges, harmonies, colour naming
- **react-colorful** — the free colour picker
- **zustand** — configurator state (each material remembers its own colour)

## Features

- 16 materials, each with a curated palette, a free colour picker, tonal range and pairings
- 6 shapes to preview on: hanging drape, flat cloth, T-shirt, trousers, skirt, cushion
- 8 patterns (stripe, pinstripe, gingham, tartan, windowpane, dots, chevron) in a second colour
- Side-by-side comparison of a pinned look and the one being edited
- Studio, daylight and evening lighting
- Save looks (kept in `localStorage`), copy a share link, download a PNG snapshot
- Motion toggle; follows the system "reduce motion" setting on first load

## How it works

- `src/lib/materials.ts` — the materials: palette, weave, drape and surface parameters.
- `src/lib/forms.ts` — the list of shapes.
- `src/lib/patterns.ts` — patterns as masks; a small shader patch blends base and
  accent colour through the mask, so recolouring never rebuilds a texture.
- `src/lib/weave.ts` — procedural, tileable weave generator. Produces a normal map
  and albedo map per weave plus a small 2D preview, so no image assets are needed.
- `src/components/fabric/geometry.ts` — parametric geometry for the garments and objects.
- `src/components/fabric/FabricScene.tsx` — the 3D scene. GSAP tweens drape and
  surface values; the frame loop applies them.
- `src/components/studio/Studio.tsx` — configurator UI.
- `src/components/landing/Landing.tsx` — landing page.
- `src/store/useConfigurator.ts` — state (zustand).

To add a material, append an entry to `MATERIALS` in `src/lib/materials.ts`. To add
a shape, add it to `FORMS` and write a builder in `geometry.ts`.

## Performance notes

- Garments are built once and cached; only the drape is re-shaped per frame, with
  normals taken from neighbouring grid points instead of a full recompute.
- Rendering stops while the canvas is off screen, and with motion off it renders
  only when something changes.
- Pixel ratio is capped and drops automatically on devices that cannot keep up.
- Full-size textures are generated only for materials you select; swatches use a
  small separate preview.

## Develop

```bash
npm install
npm run dev
```
