import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildTipper, disposeGroup } from './vehicleModel';

/**
 * Geometry-level checks for the ported tipper. three.js core runs headlessly —
 * no WebGL context is needed to assemble meshes or measure bounds — so the
 * model can be verified without a browser.
 */
describe('buildTipper', () => {
  it('assembles a 10-wheel tipper', () => {
    const truck = buildTipper(THREE);
    const meshes = [];
    truck.traverse((o) => o.isMesh && meshes.push(o));

    // 10 tyres: 2 front + 4 mid + 4 rear, each with a hub of the same radius.
    const tyres = meshes.filter(
      (m) => m.geometry.type === 'CylinderGeometry' && m.geometry.parameters.radiusTop === 0.52,
    );
    expect(tyres).toHaveLength(10);
    expect(meshes.length).toBeGreaterThan(50);
  });

  it('sits on the ground and is centred on its own bounds', () => {
    const truck = buildTipper(THREE);
    const box = new THREE.Box3().setFromObject(truck);

    // Nothing may poke below y=0 or the shadow plane cuts through the truck.
    expect(box.min.y).toBeCloseTo(0, 5);

    const centre = box.getCenter(new THREE.Vector3());
    expect(centre.x).toBeCloseTo(0, 5);
    expect(centre.z).toBeCloseTo(0, 5);
  });

  it('paints the cab in the brand orange', () => {
    const truck = buildTipper(THREE);
    const cab = [];
    truck.traverse((o) => o.isMesh && cab.push(o.material));
    const orange = cab.find((m) => `#${m.color.getHexString()}` === '#ee6126');
    expect(orange).toBeDefined();
  });

  it('casts and receives shadows on every mesh', () => {
    const truck = buildTipper(THREE);
    const bad = [];
    truck.traverse((o) => {
      if (o.isMesh && (!o.castShadow || !o.receiveShadow)) bad.push(o);
    });
    expect(bad).toHaveLength(0);
  });
});

describe('disposeGroup', () => {
  it('disposes every geometry and material exactly once', () => {
    const truck = buildTipper(THREE);
    let geometries = 0;
    let materials = 0;
    const seen = new Set();
    truck.traverse((o) => {
      if (!o.isMesh) return;
      if (!seen.has(o.geometry)) {
        seen.add(o.geometry);
        o.geometry.addEventListener('dispose', () => (geometries += 1));
      }
      if (!seen.has(o.material)) {
        seen.add(o.material);
        o.material.addEventListener('dispose', () => (materials += 1));
      }
    });

    disposeGroup(truck);

    // Shared geometries (the tyre, the rails) are reused across meshes, so the
    // count is of distinct resources, not of meshes.
    expect(geometries).toBeGreaterThan(10);
    expect(materials).toBe(7);
  });
});
