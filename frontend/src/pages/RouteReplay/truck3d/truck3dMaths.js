/**
 * truck3dMaths — pure helpers behind the 3-D truck overlay.
 *
 * Everything here is dependency-free and unit-testable (rule 21): WebGL
 * detection, world-space bounds over a post-processed glTF, the scale that
 * normalises an arbitrary model bbox to a plausible road length, and the
 * compass-heading → ScenegraphLayer orientation mapping.
 */

/**
 * Rotation to add to the computed yaw so the model's nose points where the
 * device says the truck is going. The asset ("Indian Truck" by AFJAL ANSARI)
 * is assumed to face north in its authored orientation (deck.gl yaw 0); if a
 * visual check shows it driving sideways or backwards, nudge this by 90/180/270.
 */
export const MODEL_YAW_OFFSET = 0;

/** Target real-world truck length in metres, end to end. */
export const TRUCK_TARGET_LENGTH_M = 14;

/**
 * True when the browser can hand out a WebGL(2) context. Proactive gate for
 * the 3-D layer: deck.gl fails deep inside its render loop without it, where
 * the error boundary can no longer fall back cleanly.
 */
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const ext = gl?.getExtension('WEBGL_lose_context');
    ext?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

/** Quaternion [x, y, z, w] → row-major 3×3 rotation matrix. */
function quatToMat3(q) {
  const [x, y, z, w] = q;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  return [
    [1 - (yy + zz), xy - wz, xz + wy],
    [xy + wz, 1 - (xx + zz), yz - wx],
    [xz - wy, yz + wx, 1 - (xx + yy)],
  ];
}

/** Multiply two row-major 4×4 matrices (a ∘ b). */
function mat4Multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      for (let k = 0; k < 4; k += 1) out[r * 4 + c] += a[r * 4 + k] * b[k * 4 + c];
    }
  }
  return out;
}

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** A glTF node's local TRS as a row-major 4×4 matrix. */
function nodeLocalMatrix(node) {
  if (Array.isArray(node.matrix) || ArrayBuffer.isView(node.matrix)) {
    const m = node.matrix;
    // glTF stores matrices column-major; transpose to this module's row-major form.
    return [0, 1, 2, 3].flatMap((r) => [m[r], m[4 + r], m[8 + r], m[12 + r]]);
  }
  const r = quatToMat3(node.rotation || [0, 0, 0, 1]);
  const s = node.scale || [1, 1, 1];
  const t = node.translation || [0, 0, 0];
  return [
    r[0][0] * s[0],
    r[0][1] * s[1],
    r[0][2] * s[2],
    t[0],
    r[1][0] * s[0],
    r[1][1] * s[1],
    r[1][2] * s[2],
    t[1],
    r[2][0] * s[0],
    r[2][1] * s[1],
    r[2][2] * s[2],
    t[2],
    0,
    0,
    0,
    1,
  ];
}

function applyMatrix(m, [x, y, z]) {
  return [
    m[0] * x + m[1] * y + m[2] * z + m[3],
    m[4] * x + m[5] * y + m[6] * z + m[7],
    m[8] * x + m[9] * y + m[10] * z + m[11],
  ];
}

const resolveNode = (ref, allNodes) => (typeof ref === 'number' ? allNodes[ref] : ref);

const collectMeshNodes = (node, allNodes, parentMatrix, out) => {
  if (!node) return;
  const world = mat4Multiply(parentMatrix, nodeLocalMatrix(node));
  if (node.mesh) out.push({ node, world });
  (node.children || []).forEach((k) =>
    collectMeshNodes(resolveNode(k, allNodes), allNodes, world, out),
  );
};

/**
 * World-space axis-aligned bounds of a post-processed glTF ({ min, max } as
 * [x, y, z] arrays), transforming each primitive's accessor min/max box by its
 * node's TRS. Assumes a flat node list with no skinning — true for this asset.
 */
export function gltfSceneBounds(gltf) {
  const allNodes = gltf.nodes || [];
  const roots = gltf.scenes?.[0]?.nodes?.length ? gltf.scenes[0].nodes : allNodes;
  const meshNodes = [];
  roots.forEach((n) => collectMeshNodes(resolveNode(n, allNodes), allNodes, IDENTITY, meshNodes));

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let found = false;
  for (const { node, world } of meshNodes) {
    for (const primitive of node.mesh.primitives || []) {
      const position = primitive.attributes?.POSITION;
      if (!position?.min || !position?.max) continue;
      found = true;
      for (const x of [position.min[0], position.max[0]]) {
        for (const y of [position.min[1], position.max[1]]) {
          for (const z of [position.min[2], position.max[2]]) {
            const p = applyMatrix(world, [x, y, z]);
            for (let i = 0; i < 3; i += 1) {
              min[i] = Math.min(min[i], p[i]);
              max[i] = Math.max(max[i], p[i]);
            }
          }
        }
      }
    }
  }
  return found ? { min, max } : null;
}

/**
 * Uniform scale that brings the model's largest horizontal dimension
 * (its length) to `targetMeters`. The truck GLB is authored at ~48 m with
 * exaggerated cargo proportions, so a fixed scale would be wrong; measuring
 * the bbox at load keeps the truck a plausible ~TRUCK_TARGET_LENGTH_M long.
 */
export function scaleForTargetLength(bounds, targetMeters = TRUCK_TARGET_LENGTH_M) {
  if (!bounds) return 1;
  const dx = Math.abs(bounds.max[0] - bounds.min[0]);
  const dz = Math.abs(bounds.max[2] - bounds.min[2]);
  const length = Math.max(dx, dz);
  if (!Number.isFinite(length) || length <= 0) return 1;
  return targetMeters / length;
}

/**
 * Compass heading (degrees clockwise from north, as produced by positionAt)
 * → ScenegraphLayer orientation [pitch, yaw, roll] in degrees. Deck yaw is
 * counter-clockwise, hence the negation; MODEL_YAW_OFFSET corrects for the
 * model's authored facing.
 */
export function orientationForHeading(headingDeg, yawOffset = MODEL_YAW_OFFSET) {
  const heading = Number(headingDeg);
  if (!Number.isFinite(heading)) return [0, yawOffset, 0];
  return [0, -heading + yawOffset, 0];
}
