import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { FormId } from "@/lib/forms";

/**
 * Procedural geometry for everything except the animated drape. Each form is
 * built from parametric sheets and tubes, with UVs measured in world units so
 * the weave keeps the same scale on every shape.
 */

type PointFn = (u: number, v: number, out: THREE.Vector3) => void;

interface SheetOptions {
  nu: number;
  nv: number;
  /** The sheet wraps around in u (a tube); normals are welded at the seam. */
  closed?: boolean;
  point: PointFn;
  /** Leave a hole where this returns true (u, v at the quad centre). */
  skip?: (u: number, v: number) => boolean;
}

function sheet({ nu, nv, closed = false, point, skip }: SheetOptions) {
  const cols = nu + 1;
  const rows = nv + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const p = new THREE.Vector3();

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      point(i / nu, j / nv, p);
      positions.set([p.x, p.y, p.z], (j * cols + i) * 3);
    }
  }

  const distance = (a: number, b: number) =>
    Math.hypot(
      positions[a * 3] - positions[b * 3],
      positions[a * 3 + 1] - positions[b * 3 + 1],
      positions[a * 3 + 2] - positions[b * 3 + 2],
    );

  // V: average distance travelled between rows. U: arc length along each row,
  // centred so any stretch is shared evenly between both edges.
  let travelled = 0;
  for (let j = 0; j < rows; j++) {
    if (j > 0) {
      let step = 0;
      for (let i = 0; i < cols; i++) step += distance(j * cols + i, (j - 1) * cols + i);
      travelled += step / cols;
    }
    let along = 0;
    const start = j * cols;
    for (let i = 0; i < cols; i++) {
      if (i > 0) along += distance(start + i, start + i - 1);
      uvs[(start + i) * 2] = along;
      uvs[(start + i) * 2 + 1] = -travelled;
    }
    for (let i = 0; i < cols; i++) uvs[(start + i) * 2] -= along / 2;
  }

  const indices: number[] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      if (skip?.((i + 0.5) / nu, (j + 0.5) / nv)) continue;
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  if (closed) {
    const normals = geometry.attributes.normal.array as Float32Array;
    for (let j = 0; j < rows; j++) {
      const a = j * cols * 3;
      const b = (j * cols + nu) * 3;
      const x = normals[a] + normals[b];
      const y = normals[a + 1] + normals[b + 1];
      const z = normals[a + 2] + normals[b + 2];
      const inv = 1 / (Math.hypot(x, y, z) || 1);
      normals[a] = normals[b] = x * inv;
      normals[a + 1] = normals[b + 1] = y * inv;
      normals[a + 2] = normals[b + 2] = z * inv;
    }
  }
  return geometry;
}

const TAU = Math.PI * 2;

function smoothstep(lo: number, hi: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Smoothly interpolates rows of [position, ...values] keyed by position. */
function profile(keys: number[][], at: number): number[] {
  if (at <= keys[0][0]) return keys[0];
  for (let k = 1; k < keys.length; k++) {
    if (at <= keys[k][0]) {
      const a = keys[k - 1];
      const b = keys[k];
      const t = smoothstep(a[0], b[0], at);
      return a.map((value, index) => lerp(value, b[index], t));
    }
  }
  return keys[keys.length - 1];
}

/** Soft, irregular creasing shared by the garments. */
function crease(a: number, b: number) {
  return (
    Math.sin(a * 3.1 + b * 1.7) * Math.sin(b * 4.3 - a * 2.2 + 1.3) +
    0.5 * Math.sin(a * 7.3 - b * 5.1 + 0.4)
  );
}

/** A superellipse coordinate: squarer than a circle, as a body is. */
function boxy(value: number) {
  return Math.sign(value) * Math.pow(Math.abs(value), 0.82);
}

function flat() {
  const w = 2.3;
  const h = 2.9;
  return sheet({
    nu: 70,
    nv: 88,
    point: (u, v, out) => {
      const x = (u - 0.5) * w;
      const y = (0.5 - v) * h;
      // A lazy ripple, with the top-right corner peeling up off the table.
      const curl = Math.max(0, x / w + y / h - 0.55);
      out.set(
        x - curl * curl * 1.6,
        y - curl * curl * 1.6,
        0.035 * Math.sin(x * 2.1 + 1) * Math.sin(y * 1.7) + curl * curl * 4.2,
      );
    },
  });
}

function shirt() {
  // [height, half-width, half-depth] from hem to collar.
  const body = [
    [-0.95, 0.56, 0.34],
    [-0.3, 0.52, 0.31],
    [0.22, 0.56, 0.33],
    [0.52, 0.57, 0.26],
    [0.68, 0.27, 0.18],
    [0.72, 0.25, 0.17],
  ];
  const torso = sheet({
    nu: 96,
    nv: 72,
    closed: true,
    point: (u, v, out) => {
      const height = lerp(-0.95, 0.72, v);
      const [, rx, rz] = profile(body, height);
      const angle = u * TAU;
      const front = Math.max(0, Math.sin(angle));
      const wrinkle = 1 + 0.014 * crease(angle * 2, height * 3) * smoothstep(0.75, 0.3, height);
      // The neckline dips at the front and the hem hangs a touch lower there.
      const dip = 0.13 * smoothstep(0.82, 1, v) * Math.pow(front, 1.5);
      const hem = 0.03 * smoothstep(0.2, 0, v) * Math.cos(angle * 2);
      out.set(
        rx * boxy(Math.cos(angle)) * wrinkle,
        height - dip + hem,
        rz * boxy(Math.sin(angle)) * wrinkle,
      );
    },
  });

  const sleeve = (side: number) => {
    const from = new THREE.Vector3(side * 0.4, 0.36, 0);
    const to = new THREE.Vector3(side * 0.98, 0, 0);
    const axis = to.clone().sub(from).normalize();
    const depth = new THREE.Vector3(0, 0, 1);
    // Points down and inwards, so the seam runs under the arm.
    const under = axis.clone().cross(depth).multiplyScalar(side);
    return sheet({
      nu: 48,
      nv: 22,
      closed: true,
      point: (u, v, out) => {
        const angle = u * TAU;
        const radius = lerp(0.2, 0.185, v) * (1 + 0.02 * crease(angle * 2, v * 5));
        out
          .copy(from)
          .lerp(to, v)
          .addScaledVector(under, Math.cos(angle) * radius * 1.08)
          .addScaledVector(depth, Math.sin(angle) * radius * side);
      },
    });
  };

  return mergeGeometries([torso, sleeve(1), sleeve(-1)]);
}

function trousers() {
  // [height, half-width, half-depth] of the seat, above the crotch.
  const seat = [
    [0.28, 0.5, 0.3],
    [0.62, 0.5, 0.31],
    [1.02, 0.4, 0.27],
  ];
  // [height, centre offset, radius] of each leg.
  const legs = [
    [-1.2, 0.3, 0.2],
    [-0.4, 0.275, 0.21],
    [0.3, 0.25, 0.25],
    [1.02, 0.25, 0.25],
  ];
  const INNER = 0.7; // share of each ring that faces outwards
  const CROTCH = 0.3;

  const half = (side: number) =>
    sheet({
      nu: 70, // keeps the outer/inner split on a column, so the halves meet
      nv: 96,
      closed: true,
      point: (u, v, out) => {
        const height = lerp(1.02, -1.2, v);
        const [, rx, rz] = profile(seat, height);
        const [, centre, radius] = profile(legs, height);
        // Above the crotch each half is a D; below, it closes into a leg.
        let dx: number;
        let dz: number;
        let lx: number;
        let lz: number;
        if (u <= INNER) {
          const angle = -Math.PI / 2 + Math.PI * (u / INNER);
          dx = rx * Math.cos(angle);
          dz = rz * Math.sin(angle);
          lx = centre + radius * Math.cos(angle);
          lz = radius * 1.08 * Math.sin(angle);
        } else {
          const t = (u - INNER) / (1 - INNER);
          const angle = Math.PI / 2 + Math.PI * t;
          dx = 0;
          dz = rz * (1 - 2 * t);
          lx = centre + radius * Math.cos(angle);
          lz = radius * 1.08 * Math.sin(angle);
        }
        const leg = smoothstep(CROTCH + 0.14, CROTCH - 0.2, height);
        const wrinkle =
          1 + 0.02 * crease(u * 9, height * 3.5) * smoothstep(0.7, 0.1, height);
        out.set(
          side * lerp(dx, lx, leg) * (u <= INNER ? wrinkle : 1),
          height,
          side * lerp(dz, lz, leg) * wrinkle,
        );
      },
      // No wall between the two halves above the crotch.
      skip: (u, v) => u > INNER && lerp(1.02, -1.2, v) > CROTCH + 0.1,
    });

  return mergeGeometries([half(1), half(-1)]);
}

function skirt() {
  // [height, radius] from waist to hem.
  const shape = [
    [-0.95, 0.9],
    [0.3, 0.5],
    [0.82, 0.34],
    [0.9, 0.34],
  ];
  return sheet({
    nu: 180,
    nv: 70,
    closed: true,
    point: (u, v, out) => {
      const height = lerp(0.9, -0.95, v);
      const [, radius] = profile(shape, height);
      const angle = u * TAU;
      // Folds open out towards the hem.
      const fall = smoothstep(0.08, 1, v);
      const fold =
        Math.sin(angle * 11 + 0.6 * Math.sin(height * 3)) +
        0.35 * Math.sin(angle * 23 + 1.3);
      const r = radius * (1 + 0.1 * Math.pow(fall, 1.4) * fold);
      out.set(
        r * Math.cos(angle),
        height + 0.03 * fall * Math.sin(angle * 11),
        r * 0.82 * Math.sin(angle),
      );
    },
  });
}

function cushion() {
  const face = (side: number) =>
    sheet({
      nu: 56,
      nv: 56,
      point: (u, v, out) => {
        const x = (u - 0.5) * 2;
        const y = (0.5 - v) * 2;
        const fill = Math.pow(Math.max(0, (1 - x * x) * (1 - y * y)), 0.42);
        // Stuffing pulls the edges in between the corners.
        out.set(
          x * (1 - 0.09 * (1 - y * y)) * side,
          y * (1 - 0.09 * (1 - x * x)),
          side * 0.36 * fill * (1 + 0.03 * crease(x * 2, y * 2)),
        );
      },
    });
  return mergeGeometries([face(1), face(-1)]);
}

const BUILDERS: Record<Exclude<FormId, "drape">, () => THREE.BufferGeometry> = {
  flat,
  shirt,
  trousers,
  skirt,
  cushion,
};

/** Every form is scaled to fill the same stage. */
const STAGE_WIDTH = 2.9;
const STAGE_HEIGHT = 3;
/** Squarer forms look oversized when they fill the stage edge to edge. */
const FILL: Partial<Record<FormId, number>> = { cushion: 0.78, flat: 0.92 };

const cache = new Map<FormId, THREE.BufferGeometry>();

export function getFormGeometry(form: Exclude<FormId, "drape">): THREE.BufferGeometry {
  const cached = cache.get(form);
  if (cached) return cached;

  const geometry = BUILDERS[form]();
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const scale =
    Math.min(STAGE_WIDTH / size.x, STAGE_HEIGHT / size.y) * (FILL[form] ?? 1);
  geometry.translate(-centre.x, -centre.y, -centre.z);
  geometry.scale(scale, scale, scale);
  // Keep the weave at true scale after resizing.
  const uv = geometry.attributes.uv.array as Float32Array;
  for (let i = 0; i < uv.length; i++) uv[i] *= scale;
  geometry.computeBoundingSphere();

  cache.set(form, geometry);
  return geometry;
}
