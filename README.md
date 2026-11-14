# Textile Tech

A real-time fabric visualiser. Pick a material, give it a colour, and a 3D
draped length of cloth updates instantly — weave, sheen and fold included.

- `/` — landing page with scroll animations and a live hero drape
- `/studio` — the configurator (`/studio?m=silk&c=1f4fa3` deep-links a look)

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Three.js / React Three Fiber / drei** — the draped cloth and lighting
- **GSAP** (+ ScrollTrigger, `@gsap/react`) — material morphs, colour tweens, page motion
- **chroma.js** — OKLab colour blending, tonal ranges, harmonies, colour naming
- **react-colorful** — the free colour picker
- **zustand** — configurator state (each material remembers its own colour)

## How it works

- `src/lib/materials.ts` — the eight materials: palette, weave, drape and surface parameters.
- `src/lib/weave.ts` — procedural, tileable weave generator. Produces a normal map,
  albedo map and 2D preview per weave, so no image assets are needed.
- `src/components/fabric/FabricScene.tsx` — the cloth. GSAP tweens drape and
  surface values; the frame loop rebuilds the folds from them every frame.
- `src/components/studio/Studio.tsx` — configurator UI.
- `src/components/landing/Landing.tsx` — landing page.

To add a material, append an entry to `MATERIALS` in `src/lib/materials.ts`.

## Develop

```bash
npm install
npm run dev
```
