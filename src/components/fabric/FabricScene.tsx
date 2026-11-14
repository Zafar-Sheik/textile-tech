"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import chroma from "chroma-js";
import { MATERIAL_BY_ID, type MaterialDef, type MaterialId } from "@/lib/materials";
import { getWeaveMaps } from "@/lib/weave";

const WIDTH = 2.5;
const HEIGHT = 3;
const SEG_X = 150;
const SEG_Y = 100;

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
    texture.repeat.set(WIDTH * material.repeat, HEIGHT * material.repeat);
    texture.anisotropy = 8;
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return texture;
  };
  const textures = { map: make(maps.albedo, true), normalMap: make(maps.normal, false) };
  textureCache.set(material.id, textures);
  return textures;
}

function Drape({ material, color }: { material: MaterialDef; color: string }) {
  const surfaceRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const clothRef = useRef<THREE.Mesh<THREE.PlaneGeometry>>(null);

  // Live, tweened values. GSAP writes to these; the frame loop reads them.
  const live = useRef({ ...material.drape, ...material.surface, ripple: 1 });
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
    });
    // A wave that travels down the cloth whenever the material changes.
    const ripple = gsap.fromTo(
      state,
      { ripple: 0 },
      { ripple: 1, duration: 1.5, ease: "power2.out" },
    );
    return () => {
      morph.kill();
      ripple.kill();
    };
  }, [material]);

  useEffect(() => {
    const state = tint.current;
    state.from = state.applied || color;
    state.to = color;
    state.t = 0;
    const tween = gsap.to(state, { t: 1, duration: 0.45, ease: "power2.out" });
    return () => {
      tween.kill();
    };
  }, [color]);

  useFrame(({ clock }) => {
    const surface = surfaceRef.current;
    const geometry = clothRef.current?.geometry;
    if (!surface || !geometry) return;
    const s = live.current;

    // Colour, blended in OKLab so mid-transition hues stay clean.
    const c = tint.current;
    const hex = c.t >= 1 ? c.to : chroma.mix(c.from, c.to, c.t, "oklab").hex();
    if (hex !== c.applied) {
      c.applied = hex;
      surface.color.set(hex);
      surface.sheenColor.set(chroma(hex).brighten(1.1).desaturate(0.4).hex());
    }
    surface.roughness = s.roughness;
    surface.sheen = s.sheen;
    surface.sheenRoughness = s.sheenRoughness;
    surface.clearcoat = s.clearcoat;
    surface.anisotropy = s.anisotropy;
    surface.normalScale.setScalar(s.normalScale);

    // Shape: vertical folds that deepen towards the hem, plus moving air.
    const time = clock.elapsedTime;
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const array = position.array as Float32Array;
    const front = s.ripple * 1.35 - 0.15;
    const rippleGain = 0.14 * (1 - s.ripple);
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
        array[i] = u * (WIDTH / 2) * (1 - s.depth * 0.5);
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
    geometry.computeVertexNormals();
  });

  return (
    <group position={[0, -0.05, 0]}>
      <mesh ref={clothRef}>
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

/** Pulls the camera back on narrow stages so the whole drape stays in view. */
function FitCamera() {
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.size.width / state.size.height);
  useEffect(() => {
    camera.position.setLength(Math.max(5.9, 5.2 / aspect));
  }, [camera, aspect]);
  return null;
}

export interface FabricSceneProps {
  materialId: MaterialId;
  color: string;
  /** Allow the visitor to orbit and zoom. */
  interactive?: boolean;
}

export default function FabricScene({
  materialId,
  color,
  interactive = true,
}: FabricSceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0.9, 0.15, 5.6], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        // Neutral tone mapping keeps the chosen colour true on screen.
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
    >
      <FitCamera />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.9} />
      <directionalLight position={[-4, 1, 3]} intensity={0.5} />
      <Environment resolution={256}>
        <Lightformer intensity={3} position={[0, 6, 2]} scale={[10, 4, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={2.2} position={[-6, 1, 3]} scale={[3, 7, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={1.2} position={[6, 0, 2]} scale={[3, 7, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={0.5} position={[0, 0, 7]} scale={[10, 10, 1]} target={[0, 0, 0]} />
      </Environment>
      <Drape material={MATERIAL_BY_ID[materialId]} color={color} />
      {interactive && (
        <OrbitControls
          enablePan={false}
          enableDamping
          minDistance={3.2}
          maxDistance={14}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.62}
          minAzimuthAngle={-1.15}
          maxAzimuthAngle={1.15}
        />
      )}
    </Canvas>
  );
}
