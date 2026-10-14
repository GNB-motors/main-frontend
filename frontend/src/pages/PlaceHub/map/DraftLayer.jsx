import { useCallback, useMemo, useRef } from 'react';
import { MarkerF, CircleF, PolygonF, PolylineF } from '@react-google-maps/api';
import { DRAFT_COLOR } from '../placeHubStyle.js';
import { pinIcon, dotIcon } from './mapIcons.js';

export default function DraftLayer({ draft, onDraftChange }) {
  const circleRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const options = useMemo(
    () => ({
      strokeColor: DRAFT_COLOR,
      strokeOpacity: 1,
      strokeWeight: 2.5,
      fillColor: DRAFT_COLOR,
      fillOpacity: 0.16,
      editable: true,
      zIndex: 2000,
    }),
    [],
  );
  const vertexIcon = useMemo(() => dotIcon('#ffffff', 5, { opacity: 1 }), []);
  const firstVertexIcon = useMemo(() => dotIcon(DRAFT_COLOR, 7, { opacity: 1 }), []);
  const centerIcon = useMemo(() => pinIcon(DRAFT_COLOR, { selected: true }), []);

  // Google fires *_changed for our own setRadius/setCenter too; only a real
  // drag differs from the draft, so equal values are ignored (no render loop).
  const onRadiusChanged = useCallback(() => {
    const c = circleRef.current;
    const d = draftRef.current;
    if (!c || !d) return;
    const r = Math.round(c.getRadius());
    if (r !== Math.round(d.radiusM)) onDraftChange({ radiusM: r });
  }, [onDraftChange]);

  const onCenterChanged = useCallback(() => {
    const c = circleRef.current;
    const d = draftRef.current;
    const p = c?.getCenter();
    if (!p || !d?.center) return;
    if (Math.abs(p.lat() - d.center.lat) > 1e-7 || Math.abs(p.lng() - d.center.lng) > 1e-7) {
      onDraftChange({ center: { lat: p.lat(), lng: p.lng() } });
    }
  }, [onDraftChange]);

  if (draft.shape === 'polygon') {
    const pts = draft.polygon;
    if (draft.polygonDone && pts.length >= 3) {
      return <PolygonF paths={pts} options={{ ...options, editable: false, clickable: false }} />;
    }
    return (
      <>
        {pts.length >= 2 && (
          <PolylineF
            path={pts}
            options={{
              strokeColor: DRAFT_COLOR,
              strokeWeight: 2.5,
              clickable: false,
              zIndex: 2000,
            }}
          />
        )}
        {pts.map((p, i) => (
          <MarkerF
            key={`${p.lat}:${p.lng}:${i}`}
            position={p}
            icon={i === 0 ? firstVertexIcon : vertexIcon}
            zIndex={2001}
            title={i === 0 && pts.length >= 3 ? 'Click to close the outline' : undefined}
            onClick={() => {
              if (i === 0 && pts.length >= 3) onDraftChange({ polygonDone: true });
            }}
          />
        ))}
      </>
    );
  }

  if (!draft.center) return null;
  return (
    <>
      <CircleF
        center={draft.center}
        radius={Number(draft.radiusM) || 0}
        options={options}
        onLoad={(c) => {
          circleRef.current = c;
        }}
        onUnmount={() => {
          circleRef.current = null;
        }}
        onRadiusChanged={onRadiusChanged}
        onCenterChanged={onCenterChanged}
      />
      <MarkerF
        position={draft.center}
        icon={centerIcon}
        draggable
        zIndex={2002}
        title="Drag to move"
        onDragEnd={(e) => onDraftChange({ center: { lat: e.latLng.lat(), lng: e.latLng.lng() } })}
      />
    </>
  );
}
