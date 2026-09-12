/**
 * Procedural 10-wheel tipper, ported from the GNB Vehicle Detail v2 design.
 *
 * There is no GLB asset — the truck is assembled from boxes and cylinders so it
 * ships as a few KB of code rather than a mesh download, and the cab picks up
 * the brand orange directly.
 *
 * Pure builder: takes the THREE namespace (the caller dynamic-imports it, so
 * three.js never lands in the bundle of a page that doesn't render the model).
 */

const AXLE_Y = 0.52;
const RAIL_Y = 0.86;

export function buildTipper(THREE) {
  const materials = {
    cabPaint: new THREE.MeshStandardMaterial({
      color: '#EE6126',
      roughness: 0.42,
      metalness: 0.22,
    }),
    bodySteel: new THREE.MeshStandardMaterial({
      color: '#C2BCB4',
      roughness: 0.55,
      metalness: 0.32,
    }),
    chassis: new THREE.MeshStandardMaterial({ color: '#3B3733', roughness: 0.7, metalness: 0.25 }),
    tyre: new THREE.MeshStandardMaterial({ color: '#22201E', roughness: 0.92, metalness: 0.02 }),
    glass: new THREE.MeshStandardMaterial({ color: '#5E7B8C', roughness: 0.12, metalness: 0.3 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#D6D3D1', roughness: 0.28, metalness: 0.38 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#FFF3D6', roughness: 0.25, metalness: 0.05 }),
  };

  const truck = new THREE.Group();
  truck.name = 'tipper';

  const add = (geo, mat, pos, rot) => {
    const mesh = new THREE.Mesh(geo, mat);
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    truck.add(mesh);
    return mesh;
  };

  // Chassis ladder
  const railGeo = new THREE.BoxGeometry(7.3, 0.26, 0.16);
  add(railGeo, materials.chassis, [-0.25, RAIL_Y, 0.46]);
  add(railGeo, materials.chassis, [-0.25, RAIL_Y, -0.46]);
  const crossGeo = new THREE.BoxGeometry(0.14, 0.18, 0.94);
  [-3.35, -2.2, -1.05, 0.35, 1.6, 2.85].forEach((x) =>
    add(crossGeo, materials.chassis, [x, RAIL_Y, 0]),
  );

  // Cab
  add(new THREE.BoxGeometry(1.94, 1.42, 2.42), materials.cabPaint, [2.3, 1.7, 0]);
  add(new THREE.BoxGeometry(1.72, 0.34, 2.3), materials.cabPaint, [2.24, 2.56, 0]);
  add(new THREE.BoxGeometry(0.42, 1.0, 2.3), materials.cabPaint, [3.42, 1.42, 0]);
  add(new THREE.BoxGeometry(0.1, 0.78, 2.12), materials.glass, [3.29, 2.2, 0], [0, 0, -0.2]);
  const sideWinGeo = new THREE.BoxGeometry(1.28, 0.62, 0.08);
  add(sideWinGeo, materials.glass, [2.16, 2.16, 1.215]);
  add(sideWinGeo, materials.glass, [2.16, 2.16, -1.215]);
  add(new THREE.BoxGeometry(0.1, 0.52, 1.7), materials.chrome, [3.66, 1.46, 0]);
  add(new THREE.BoxGeometry(0.24, 0.34, 2.46), materials.chassis, [3.6, 0.8, 0]);

  const lampGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.1, 32);
  add(lampGeo, materials.lamp, [3.66, 1.02, 0.86], [0, 0, Math.PI / 2]);
  add(lampGeo, materials.lamp, [3.66, 1.02, -0.86], [0, 0, Math.PI / 2]);

  const mirrorArm = new THREE.CylinderGeometry(0.035, 0.035, 0.42, 16);
  add(mirrorArm, materials.chrome, [3.1, 2.28, 1.42], [Math.PI / 2, 0, 0]);
  add(mirrorArm, materials.chrome, [3.1, 2.28, -1.42], [Math.PI / 2, 0, 0]);
  const mirrorGeo = new THREE.BoxGeometry(0.09, 0.34, 0.2);
  add(mirrorGeo, materials.glass, [3.1, 2.14, 1.6]);
  add(mirrorGeo, materials.glass, [3.1, 2.14, -1.6]);

  add(new THREE.CylinderGeometry(0.09, 0.09, 1.9, 24), materials.chrome, [1.32, 1.95, -1.16]);
  add(
    new THREE.CylinderGeometry(0.32, 0.32, 1.1, 32),
    materials.chrome,
    [0.75, 0.78, 1.05],
    [Math.PI / 2, 0, 0],
  );
  add(
    new THREE.CylinderGeometry(0.19, 0.19, 0.86, 24),
    materials.chassis,
    [0.1, 0.72, -1.02],
    [Math.PI / 2, 0, 0],
  );

  // Tipper body
  add(new THREE.BoxGeometry(4.6, 0.16, 2.44), materials.bodySteel, [-1.42, 1.02, 0]);
  const sideGeo = new THREE.BoxGeometry(4.6, 0.94, 0.12);
  add(sideGeo, materials.bodySteel, [-1.42, 1.57, 1.16]);
  add(sideGeo, materials.bodySteel, [-1.42, 1.57, -1.16]);
  add(new THREE.BoxGeometry(0.12, 1.16, 2.44), materials.bodySteel, [0.82, 1.68, 0]);
  add(new THREE.BoxGeometry(0.12, 0.94, 2.44), materials.bodySteel, [-3.66, 1.57, 0]);
  const ribGeo = new THREE.BoxGeometry(0.1, 0.94, 0.09);
  [-0.3, -1.02, -1.74, -2.46, -3.18].forEach((x) => {
    add(ribGeo, materials.chassis, [x, 1.57, 1.226]);
    add(ribGeo, materials.chassis, [x, 1.57, -1.226]);
  });
  add(new THREE.CylinderGeometry(0.13, 0.13, 0.62, 24), materials.chrome, [0.42, 0.72, 0]);

  // Running gear — 10 wheels
  const tyreGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.3, 32);
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.32, 24);
  const wheel = (x, z) => {
    add(tyreGeo, materials.tyre, [x, AXLE_Y, z], [Math.PI / 2, 0, 0]);
    add(hubGeo, materials.chrome, [x, AXLE_Y, z], [Math.PI / 2, 0, 0]);
  };
  wheel(2.55, 1.07);
  wheel(2.55, -1.07);
  [-1.55, -2.72].forEach((x) => {
    wheel(x, 0.74);
    wheel(x, 1.08);
    wheel(x, -0.74);
    wheel(x, -1.08);
  });

  const axleGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.1, 20);
  [2.55, -1.55, -2.72].forEach((x) =>
    add(axleGeo, materials.chassis, [x, AXLE_Y, 0], [Math.PI / 2, 0, 0]),
  );
  const guardGeo = new THREE.CylinderGeometry(0.64, 0.64, 0.4, 32, 1, true, 0, Math.PI);
  add(guardGeo, materials.chassis, [-2.1, AXLE_Y, 0.91], [Math.PI / 2, 0, 0]);
  add(guardGeo, materials.chassis, [-2.1, AXLE_Y, -0.91], [Math.PI / 2, 0, 0]);
  add(new THREE.BoxGeometry(0.05, 0.4, 2.3), materials.tyre, [-3.42, 0.32, 0]);

  // Sit the truck on the ground plane, centred on its own bounds.
  const bounds = new THREE.Box3().setFromObject(truck);
  const centre = bounds.getCenter(new THREE.Vector3());
  truck.position.set(-centre.x, -bounds.min.y, -centre.z);

  return truck;
}

// Every texture slot a three.js material may hold — the procedural truck's
// solid-color materials use none of these, but a loaded GLTF's PBR materials
// commonly populate several at once (base color, normal, metalness/roughness…).
const TEXTURE_MAP_KEYS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'bumpMap',
  'displacementMap',
  'alphaMap',
  'envMap',
  'lightMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
];

/** Free every GPU resource the group owns — three.js does not do this for you. */
export function disposeGroup(group) {
  const seen = new Set();
  group.traverse((o) => {
    if (!o.isMesh) return;
    if (o.geometry && !seen.has(o.geometry)) {
      seen.add(o.geometry);
      o.geometry.dispose();
    }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || seen.has(m)) continue;
      seen.add(m);
      for (const key of TEXTURE_MAP_KEYS) {
        const tex = m[key];
        if (tex && !seen.has(tex)) {
          seen.add(tex);
          tex.dispose();
        }
      }
      m.dispose();
    }
  });
}
