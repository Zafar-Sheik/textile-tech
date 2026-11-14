"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  PerformanceMonitor,
} from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import chroma from "chroma-js";
import type { FormId } from "@/lib/forms";
import { MATERIAL_BY_ID, type MaterialDef, type MaterialId } from "@/lib/materials";
import { getWeaveMaps } from "@/lib/weave";
import type { Lighting } from "@/store/useConfigurator";
import { getFormGeometry } from "./geometry";

const WIDTH = 2.5;
const HEIGHT = 3;
const SEG_X = 128;
const SEG_Y = 84;
const MAX_DPR = 1.75;

interface FabricTextures {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
}

const textureCache = new Map<MaterialId, FabricTextures>();

function getTextures(material: MaterialDef): FabricTextures {
  const cached = textureCache.get(material.id);
  if (cached) return cached;
  const maps = getWeaveMaps(material.weave, material.contrast);
  const make = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    // Geometry UVs are in world units, so this is tiles per unit.
    texture.repeat.set(material.repeat, material.repeat);
    texture.anisotropy = 8;
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return texture;
  };
  const textures = { map: make(maps.albedo, true), normalMap: make(maps.normal, false) };
  textureCache.set(material.id, textures);
  return textures;
}

type Live = MaterialDef["drape"] & MaterialDef["surface"] & { ripple: number };

/**
 * Drives one fabric surface. GSAP tweens the live values whenever the material
 * or colour changes; the frame loop copies them onto the Three.js material.
 */
function useFabricSurface(
  surfaceRef: RefObject<THREE.MeshPhysicalMaterial | null>,
  material: MaterialDef,
  color: string,
) {
  const invalidate = useThree((state) => state.invalidate);
  const live = useRef<Live>({ ...material.drape, ...material.surface, ripple: 1 });
  const tint = useRef({ from: color, to: color, t: 1, applied: "" });

  useEffect(() => {
    const surface = surfaceRef.current;
    if (surface) {
      const textures = getTextures(material);
      surface.map = textures.map;
      surface.normalMap = textures.normalMap;
      surface.needsUpdate = true;
    }
    const state = live.current;
    const morph = gsap.to(state, {
      ...material.drape,
      ...material.surface,
      duration: 1.2,
      ease: "power3.inOut",
      onUpdate: invalidate,
    });
    // Runs 0 → 1 on every material change; forms turn it into a ripple or pulse.
    const ripple = gsap.fromTo(
      state,
      { ripple: 0 },
      { ripple: 1, duration: 1.5, ease: "power2.out", onUpdate: invalidate },
    );
    return () => {
      morph.kill();
      ripple.kill();
    };
  }, [material, surfaceRef, invalidate]);

  useEffect(() => {
    const state = tint.current;
    state.from = state.applied || color;
    state.to = color;
    state.t = 0;
    const tween = gsap.to(state, {
      t: 1,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [color, invalidate]);

  useFrame(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    // Colour, blended in OKLab so mid-transition hues stay clean.
    const c = tint.current;
    const hex = c.t >= 1 ? c.to : chroma.mix(c.from, c.to, c.t, "oklab").hex();
    if (hex !== c.applied) {
      c.applied = hex;
      surface.color.set(hex);
      surface.sheenColor.set(chroma(hex).brighten(1.1).desaturate(0.4).hex());
    }
    const s = live.current;
    surface.roughness = s.roughness;
    surface.metalness = s.metalness;
    surface.sheen = s.sheen;
    surface.sheenRoughness = s.sheenRoughness;
    surface.clearcoat = s.clearcoat;
    surface.anisotropy = s.anisotropy;
    surface.normalScale.setScalar(s.normalScale);
  }, -1);

  return live;
}

interface ClothProps {
  material: MaterialDef;
  color: string;
  motion: boolean;
}

/** A hanging length of cloth whose folds follow the material's drape values. */
function Drape({ material, color, motion }: ClothProps) {
  const surfaceRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const clothRef = useRef<THREE.Mesh<THREE.PlaneGeometry>>(null);
  const live = useFabricSurface(surfaceRef, material, color);
  const clock = useRef(0);

  useFrame((_, delta) => {
    const geometry = clothRef.current?.geometry;
    if (!geometry) return;
    if (!geometry.userData.worldUv) {
      // Plane UVs run 0..1; the fabric textures expect world units.
      const uv = geometry.attributes.uv.array as Float32Array;
      for (let k = 0; k < uv.length; k += 2) {
        uv[k] *= WIDTH;
        uv[k + 1] *= HEIGHT;
      }
      geometry.attributes.uv.needsUpdate = true;
      geometry.userData.worldUv = true;
    }
    const s = live.current;
    if (motion) clock.current += Math.min(delta, 0.1);
    const time = clock.current;

    // Shape: vertical folds that deepen towards the hem, plus moving air.
    const position = geometry.attributes.position;
    const array = position.array as Float32Array;
    const front = s.ripple * 1.35 - 0.15;
    const rippleGain = 0.14 * (1 - s.ripple);
    const halfWidth = (WIDTH / 2) * (1 - s.depth * 0.5);
    let i = 0;
    for (let iy = 0; iy <= SEG_Y; iy++) {
      const v = iy / SEG_Y;
      const amp = s.depth * (0.3 + 0.7 * v);
      const wave = (v - front) / 0.13;
      const bump = rippleGain * Math.exp(-wave * wave);
      for (let ix = 0; ix <= SEG_X; ix++) {
        const u = (ix / SEG_X) * 2 - 1;
        const wander = s.soft * 0.7 * Math.sin(v * 2.3 + u * 1.4 + time * 0.25 * s.flutter);
        const phase = u * s.folds * Math.PI + wander;
        const fold = Math.sin(phase);
        const air =
          s.flutter * v * 0.07 * Math.sin(u * 2.4 + v * 2.1 + time * 1.1) +
          s.flutter * v * 0.03 * Math.sin(u * 5.3 - time * 1.7);
        array[i] = u * halfWidth;
        array[i + 1] = HEIGHT / 2 - v * HEIGHT - 0.035 * v * fold;
        array[i + 2] =
          amp * fold +
          amp * 0.3 * s.soft * Math.sin(phase * 2.3 + 1.7 + v * 3) +
          air +
          bump;
        i += 3;
      }
    }
    position.needsUpdate = true;

    // Normals straight from neighbouring grid points: far cheaper than
    // rebuilding them from every triangle each frame.
    const normal = geometry.attributes.normal;
    const normals = normal.array as Float32Array;
    const cols = SEG_X + 1;
    for (let iy = 0; iy <= SEG_Y; iy++) {
      const above = (iy === 0 ? iy : iy - 1) * cols;
      const below = (iy === SEG_Y ? iy : iy + 1) * cols;
      const row = iy * cols;
      for (let ix = 0; ix <= SEG_X; ix++) {
        const l = (row + (ix === 0 ? ix : ix - 1)) * 3;
        const r = (row + (ix === SEG_X ? ix : ix + 1)) * 3;
        const a = (above + ix) * 3;
        const b = (below + ix) * 3;
        const ux = array[r] - array[l];
        const uy = array[r + 1] - array[l + 1];
        const uz = array[r + 2] - array[l + 2];
        const vx = array[b] - array[a];
        const vy = array[b + 1] - array[a + 1];
        const vz = array[b + 2] - array[a + 2];
        const nx = vy * uz - vz * uy;
        const ny = vz * ux - vx * uz;
        const nz = vx * uy - vy * ux;
        const inv = 1 / (Math.hypot(nx, ny, nz) || 1);
        const n = (row + ix) * 3;
        normals[n] = nx * inv;
        normals[n + 1] = ny * inv;
        normals[n + 2] = nz * inv;
      }
    }
    normal.needsUpdate = true;
  });

  return (
    <group position={[0, -0.05, 0]}>
      <mesh ref={clothRef} frustumCulled={false}>
        <planeGeometry args={[WIDTH, HEIGHT, SEG_X, SEG_Y]} />
        <meshPhysicalMaterial ref={surfaceRef} side={THREE.DoubleSide} />
      </mesh>
      {/* Hanging rail */}
      <mesh position={[0, HEIGHT / 2 + 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, WIDTH + 0.5, 24]} />
        <meshStandardMaterial color="#2b2824" roughness={0.35} metalness={0.8} />
      </mesh>
    </group>
  );
}

/** A garment or object. The mesh is built once; only the surface is animated. */
function Form({
  form,
  material,
  color,
  motion,
}: ClothProps & { form: Exclude<FormId, "drape"> }) {
  const surfaceRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const live = useFabricSurface(surfaceRef, material, color);
  const invalidate = useThree((state) => state.invalidate);
  const entrance = useRef({ t: 0 });
  const clock = useRef(0);
  const geometry = getFormGeometry(form);
  // A flat length is viewed face-on; everything else slowly turns.
  const sway = form === "flat" ? 0.12 : 0.45;

  useEffect(() => {
    const state = entrance.current;
    const tween = gsap.fromTo(
      state,
      { t: 0 },
      { t: 1, duration: 1.1, ease: "power3.out", onUpdate: invalidate },
    );
    return () => {
      tween.kill();
    };
  }, [form, invalidate]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (motion) clock.current += Math.min(delta, 0.1);
    const enter = entrance.current.t;
    // A soft "breath" when the material changes.
    const pulse = 1 + 0.03 * Math.sin(Math.PI * live.current.ripple);
    group.scale.setScalar((0.9 + 0.1 * enter) * pulse);
    group.rotation.y = Math.sin(clock.current * 0.35) * sway - (1 - enter) * 0.9;
  });

  return (
    <group ref={groupRef} rotation={form === "flat" ? [-0.35, 0, 0] : [0, 0, 0]}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial ref={surfaceRef} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const LIGHTING: Record<
  Lighting,
  { key: string; fill: string; sky: string; keyPower: number; ambient: number }
> = {
  studio: { key: "#ffffff", fill: "#ffffff", sky: "#ffffff", keyPower: 1.9, ambient: 0.25 },
  daylight: { key: "#fff6e6", fill: "#cfe1ff", sky: "#d6e6ff", keyPower: 2.3, ambient: 0.35 },
  evening: { key: "#ffc98a", fill: "#ff9f6b", sky: "#ffd9ad", keyPower: 1.5, ambient: 0.16 },
};

function Lights({ lighting }: { lighting: Lighting }) {
  const light = LIGHTING[lighting];
  return (
    <>
      <ambientLight intensity={light.ambient} color={light.sky} />
      <directionalLight position={[3, 4, 5]} intensity={light.keyPower} color={light.key} />
      <directionalLight position={[-4, 1, 3]} intensity={0.5} color={light.fill} />
      {/* Re-baked only when the preset changes. */}
      <Environment key={lighting} resolution={128} frames={1}>
        <Lightformer intensity={3} color={light.sky} position={[0, 6, 2]} scale={[10, 4, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={2.2} color={light.key} position={[-6, 1, 3]} scale={[3, 7, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={1.2} color={light.fill} position={[6, 0, 2]} scale={[3, 7, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={0.5} color={light.sky} position={[0, 0, 7]} scale={[10, 10, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

/** Pulls the camera back on narrow stages so the whole form stays in view. */
function FitCamera() {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const aspect = useThree((state) => state.size.width / state.size.height);
  useEffect(() => {
    camera.position.setLength(Math.max(5.9, 5.2 / aspect));
    invalidate();
  }, [camera, aspect, invalidate]);
  return null;
}

/** Renders the current view onto a solid background and returns it as a PNG. */
export type Snapshot = (background: string) => string;

function SnapshotBridge({ onSnapshot }: { onSnapshot: (snapshot: Snapshot | null) => void }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    onSnapshot((background) => {
      gl.render(scene, camera);
      const source = gl.domElement;
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0);
      return canvas.toDataURL("image/png");
    });
    return () => onSnapshot(null);
  }, [gl, scene, camera, onSnapshot]);
  return null;
}

export interface FabricSceneProps {
  materialId: MaterialId;
  color: string;
  form?: FormId;
  lighting?: Lighting;
  /** Moving air and slow turning. When off, frames render only on change. */
  motion?: boolean;
  /** Allow the visitor to orbit and zoom. */
  interactive?: boolean;
  onSnapshot?: (snapshot: Snapshot | null) => void;
}

export default function FabricScene({
  materialId,
  color,
  form = "drape",
  lighting = "studio",
  motion = true,
  interactive = true,
  onSnapshot,
}: FabricSceneProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [dpr, setDpr] = useState(MAX_DPR);
  const material = MATERIAL_BY_ID[materialId];

  // Stop rendering entirely while the canvas is scrolled out of view.
  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="h-full w-full">
      <Canvas
        dpr={[1, dpr]}
        frameloop={!visible ? "never" : motion ? "always" : "demand"}
        camera={{ position: [0.9, 0.15, 5.6], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          // Neutral tone mapping keeps the chosen colour true on screen.
          gl.toneMapping = THREE.NeutralToneMapping;
        }}
      >
        {/* Drop to 1x pixels if the device cannot hold a smooth frame rate. */}
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(MAX_DPR)}
          flipflops={3}
          onFallback={() => setDpr(1)}
        />
        <FitCamera />
        <Lights lighting={lighting} />
        {form === "drape" ? (
          <Drape material={material} color={color} motion={motion} />
        ) : (
          <Form key={form} form={form} material={material} color={color} motion={motion} />
        )}
        {onSnapshot && <SnapshotBridge onSnapshot={onSnapshot} />}
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableDamping
            minDistance={3.2}
            maxDistance={14}
            minPolarAngle={Math.PI * 0.25}
            maxPolarAngle={Math.PI * 0.68}
          />
        )}
      </Canvas>
    </div>
  );
}
