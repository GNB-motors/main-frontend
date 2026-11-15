import { useMemo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { diamondIcon } from '../PlaceHub/map/mapIcons.js';

/**
 * TrackReviewLayer — the places still waiting for an answer.
 *
 * A diamond, not a pin: a place nobody has confirmed yet must not look like a
 * place the fleet already knows. Clicking one opens the place panel.
 */
export default function TrackReviewLayer({ items = [], selectedId = null, onSelect }) {
  const icon = useMemo(() => diamondIcon('#7c3aed', false), []);
  const selectedIcon = useMemo(() => diamondIcon('#7c3aed', true), []);

  if (!items.length) return null;

  return (
    <>
      {items.map((item) => {
        const site = item?.site || item;
        const lat = Number(site?.centroidLat ?? site?.lat);
        const lng = Number(site?.centroidLng ?? site?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const id = String(site?._id ?? site?.id ?? '');
        return (
          <MarkerF
            key={`review-${id}`}
            position={{ lat, lng }}
            icon={id === String(selectedId) ? selectedIcon : icon}
            title={`${site?.name || 'Place'} · to confirm`}
            zIndex={40}
            onClick={() => onSelect?.(site)}
          />
        );
      })}
    </>
  );
}
