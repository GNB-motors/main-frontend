import { describe, it, expect } from 'vitest';
import {
  isWebGLAvailable,
  gltfSceneBounds,
  scaleForTargetLength,
  orientationForHeading,
  MODEL_YAW_OFFSET,
  TRUCK_TARGET_LENGTH_M,
} from './truck3dMaths.js';

const prim = (min, max) => ({
  attributes: { POSITION: { min, max } },
});

const gltfWith = (nodes, scenes) => ({ nodes, scenes });

describe('isWebGLAvailable', () => {
  it('is false when the canvas returns no context', () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;
    expect(isWebGLAvailable()).toBe(false);
    HTMLCanvasElement.prototype.getContext = original;
  });

  it('is true when a webgl context is handed out', () => {
    const original = HTMLCanvasElement.prototype.getContext;
    const loseContext = { loseContext: () => {} };
    HTMLCanvasElement.prototype.getContext = (type) =>
      type === 'webgl2' ? { getExtension: () => loseContext } : null;
    expect(isWebGLAvailable()).toBe(true);
    HTMLCanvasElement.prototype.getContext = original;
  });

  it('is false when canvas creation throws', () => {
    const original = document.createElement;
    document.createElement = () => {
      throw new Error('no canvas');
    };
    expect(isWebGLAvailable()).toBe(false);
    document.createElement = original;
  });
});

describe('gltfSceneBounds', () => {
  it('transforms primitive min/max by node TRS', () => {
    // 90° about x maps +z → -y; a unit box at origin with scale 2 and translation.
    const gltf = gltfWith(
      [
        {
          translation: [10, 0, 0],
          scale: [2, 2, 2],
          rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2],
          mesh: { primitives: [prim([-1, -1, -1], [1, 1, 1])] },
        },
      ],
      [{ nodes: [0] }],
    );
    const b = gltfSceneBounds(gltf);
    expect(b.min[0]).toBeCloseTo(8);
    expect(b.max[0]).toBeCloseTo(12);
    expect(b.min[2]).toBeCloseTo(-2);
    expect(b.max[2]).toBeCloseTo(2);
    expect(b.min[1]).toBeCloseTo(-2);
    expect(b.max[1]).toBeCloseTo(2);
  });

  it('composes parent and child transforms', () => {
    const gltf = gltfWith(
      [
        { translation: [100, 0, 0], children: [1] },
        { translation: [0, 5, 0], mesh: { primitives: [prim([0, 0, 0], [1, 1, 1])] } },
      ],
      [{ nodes: [0] }],
    );
    const b = gltfSceneBounds(gltf);
    expect(b.min).toEqual([100, 5, 0]);
    expect(b.max).toEqual([101, 6, 1]);
  });

  it('resolves node objects directly on the scene', () => {
    const node = { mesh: { primitives: [prim([0, 0, 0], [3, 1, 2])] } };
    const b = gltfSceneBounds(gltfWith([node], [{ nodes: [node] }]));
    expect(b.max).toEqual([3, 1, 2]);
  });

  it('transposes glTF column-major node matrices', () => {
    // Column-major translation matrix (t = [7, 8, 9]).
    const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 7, 8, 9, 1];
    const gltf = gltfWith(
      [{ matrix, mesh: { primitives: [prim([0, 0, 0], [1, 1, 1])] } }],
      [{ nodes: [0] }],
    );
    const b = gltfSceneBounds(gltf);
    expect(b.min).toEqual([7, 8, 9]);
    expect(b.max).toEqual([8, 9, 10]);
  });

  it('returns null when nothing has POSITION bounds', () => {
    expect(gltfSceneBounds(gltfWith([{ mesh: { primitives: [] } }], [{ nodes: [0] }]))).toBeNull();
    expect(gltfSceneBounds({})).toBeNull();
  });
});

describe('scaleForTargetLength', () => {
  it('scales the largest horizontal dimension to the target', () => {
    const bounds = { min: [-5, 0, -24], max: [5, 4, 24] };
    expect(scaleForTargetLength(bounds, 12)).toBeCloseTo(0.25);
  });

  it('prefers x when x is the long axis', () => {
    const bounds = { min: [-30, 0, -2], max: [30, 3, 2] };
    expect(scaleForTargetLength(bounds, 15)).toBeCloseTo(0.25);
  });

  it('defaults to TRUCK_TARGET_LENGTH_M and is safe on bad input', () => {
    expect(scaleForTargetLength({ min: [0, 0, 0], max: [10, 2, -40] })).toBeCloseTo(
      TRUCK_TARGET_LENGTH_M / 40,
    );
    expect(scaleForTargetLength(null)).toBe(1);
    expect(scaleForTargetLength({ min: [0, 0, 0], max: [0, 0, 0] })).toBe(1);
  });
});

describe('orientationForHeading', () => {
  it('maps compass headings to counter-clockwise deck yaw', () => {
    expect(orientationForHeading(0)).toEqual([0, MODEL_YAW_OFFSET, 0]);
    expect(orientationForHeading(90)).toEqual([0, -90 + MODEL_YAW_OFFSET, 0]);
    expect(orientationForHeading(350)).toEqual([0, -350 + MODEL_YAW_OFFSET, 0]);
  });

  it('falls back to the offset alone for missing headings', () => {
    expect(orientationForHeading(null)).toEqual([0, MODEL_YAW_OFFSET, 0]);
    expect(orientationForHeading(undefined)).toEqual([0, MODEL_YAW_OFFSET, 0]);
  });
});
