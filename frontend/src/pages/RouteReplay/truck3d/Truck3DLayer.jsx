import { useEffect, useRef, useState } from 'react';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import { load } from '@loaders.gl/core';
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf';
import { gltfSceneBounds, scaleForTargetLength, orientationForHeading } from './truck3dMaths.js';

const TRUCK_URL = '/models/truck-draco.glb';
const DRACO_DECODER_PATH = '/draco/';

let truckPromise;
function loadTruck() {
  truckPromise ||= load(TRUCK_URL, GLTFLoader, {
    // Serve the Draco decoder from this origin; the loader's default pulls it
    // from a public CDN at runtime.
    useLocalLibraries: true,
    modules: {
      'draco_wasm_wrapper.js': `${DRACO_DECODER_PATH}draco_wasm_wrapper.js`,
      'draco_decoder.wasm': `${DRACO_DECODER_PATH}draco_decoder.wasm`,
    },
  });
  return truckPromise;
}

/**
 * Truck3DLayer — the 3-D truck on the replay map, rendered through a
 * deck.gl GoogleMapsOverlay attached to the google.maps.Map instance that
 * @react-google-maps/api hands us. Loaded exclusively through React.lazy:
 * every deck.gl/luma.gl import lives in this chunk.
 *
 * The component renders nothing itself; it is pure overlay lifecycle. Any
 * failure leaves the caller's 2-D heading marker in place.
 */
const Truck3DLayer = ({ map, head, onReady }) => {
  const overlayRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const [truck, setTruck] = useState(null);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!map) return undefined;
    let cancelled = false;
    const overlay = new GoogleMapsOverlay({ layers: [] });
    overlayRef.current = overlay;
    overlay.setMap(map);
    loadTruck()
      .then((gltf) => {
        if (cancelled) return;
        const bounds = gltfSceneBounds(postProcessGLTF(gltf));
        setTruck({ scenegraph: gltf, scale: scaleForTargetLength(bounds) });
        onReadyRef.current?.();
      })
      .catch(() => {
        // Stay on the 2-D marker; the error boundary is not involved because
        // this component renders nothing when the load fails.
      });
    return () => {
      cancelled = true;
      overlay.finalize();
      overlayRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !truck || !head) return;
    overlay.setProps({
      layers: [
        new ScenegraphLayer({
          id: 'route-replay-truck-3d',
          data: [head],
          scenegraph: truck.scenegraph,
          sizeScale: truck.scale,
          getPosition: (d) => [d.lng, d.lat],
          getOrientation: (d) => orientationForHeading(d.heading),
          _lighting: 'pbr',
          pickable: false,
        }),
      ],
    });
  }, [truck, head]);

  return null;
};

export default Truck3DLayer;
