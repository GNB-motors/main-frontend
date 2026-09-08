import { useEffect, useRef, useState } from 'react';
import { buildTipper, disposeGroup } from './vehicleModel';

/**
 * Orbitable 3-D tipper for the vehicle hero.
 *
 * three.js is dynamic-imported so it costs nothing on the other pages that
 * never render a vehicle. Rotation only — no zoom, no pan — so the truck stays
 * the same size in the card however the user drags it.
 *
 * Degrades to a static caption when WebGL is unavailable, the chunk fails to
 * load, or the viewer has asked for reduced motion.
 */
export default function VehicleModel3D({ label }) {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    // `cancelled` guards every async step: React can unmount before the
    // dynamic import resolves, and three.js would otherwise attach a canvas
    // to a detached node and leak the render loop.
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      try {
        const [THREE, { OrbitControls }] = await Promise.all([
          import('three'),
          import('three/addons/controls/OrbitControls.js'),
        ]);
        if (cancelled || !hostRef.current) return;

        const width = host.clientWidth || 1;
        const height = host.clientHeight || 1;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.touchAction = 'pan-y';
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();

        const truck = buildTipper(THREE);
        scene.add(truck);

        // Ground catches the shadow only — the card background shows through.
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(200, 200),
          new THREE.ShadowMaterial({ opacity: 0.18 }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 1.0));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(4, 7, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.bias = -0.0002;
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xfff4e6, 0.5);
        fill.position.set(-5, 3, -4);
        scene.add(fill);

        const sphere = new THREE.Box3().setFromObject(truck).getBoundingSphere(new THREE.Sphere());
        const span = sphere.radius * 1.4;
        key.shadow.camera.left = -span;
        key.shadow.camera.right = span;
        key.shadow.camera.top = span;
        key.shadow.camera.bottom = -span;
        key.shadow.camera.updateProjectionMatrix();

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 500);
        // Frame to the bounds, then pull in so the truck fills the card.
        const dist = (sphere.radius / Math.tan((camera.fov * Math.PI) / 360)) * 1.35 * 0.62;
        camera.position.set(dist * 0.72, dist * 0.52, dist * 0.72);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minPolarAngle = 0.62;
        controls.maxPolarAngle = 1.46;
        controls.target.copy(sphere.center);
        controls.target.y += 0.34;
        controls.update();

        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        controls.autoRotate = !reduceMotion;
        controls.autoRotateSpeed = 0.5;
        // A drag is a deliberate inspection — stop spinning under the user.
        controls.addEventListener('start', () => {
          controls.autoRotate = false;
        });

        let frame = 0;
        const tick = () => {
          frame = requestAnimationFrame(tick);
          controls.update();
          renderer.render(scene, camera);
        };
        tick();

        const resize = () => {
          const w = host.clientWidth || 1;
          const h = host.clientHeight || 1;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);

        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          controls.dispose();
          disposeGroup(truck);
          ground.geometry.dispose();
          ground.material.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        // WebGL blocked, chunk failed, or the context was refused — the caller
        // still has a usable card, just without the model.
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (failed) {
    return (
      <div className="v360-model v360-model--fallback">
        <span className="v360-model-fallback-title">3-D view unavailable</span>
        <span className="v360-model-fallback-hint">
          This browser could not start WebGL. Every reading on this page is unaffected.
        </span>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="v360-model"
      role="img"
      aria-label={label || '3-D model of the vehicle'}
    />
  );
}
