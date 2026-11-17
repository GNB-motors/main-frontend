import { useMemo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { reviewPlaceIconUrl } from './reviewPlaceIcon.js';

// Kept local to Live tracking: confirmation markers differ from known places.
function reviewIcon(selected) {
  const size = selected ? 44 : 36;
  const height = (size * 44) / 36;
  return {
    url: reviewPlaceIconUrl,
    scaledSize: new window.google.maps.Size(size, height),
    anchor: new window.google.maps.Point(size / 2, (height * 42) / 44),
  };
}

/**
 * TrackReviewLayer — the places still waiting for an answer.
 *
 * A question-mark pin distinguishes unconfirmed places from known places.
 * Its tip stays on the recorded coordinates, including when selected.
 */
export default function TrackReviewLayer({ items = [], selectedId = null, onSelect }) {
  const icon = useMemo(() => reviewIcon(false), []);
  const selectedIcon = useMemo(() => reviewIcon(true), []);

  if (!items.length) return null;

  return (
    <>
      {items.map((item) => {
        const site = item?.site || item;
        const lat = Number(site?.centroidLat ?? site?.lat);
        const lng = Number(site?.centroidLng ?? site?.lng);
        if (site?.centroidLat == null && site?.lat == null) return null;
        if (site?.centroidLng == null && site?.lng == null) return null;
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180
        )
          return null;
        const id = String(site?._id ?? site?.id ?? '');
        return (
          <MarkerF
            key={`review-${id}`}
            position={{ lat, lng }}
            icon={id === String(selectedId) ? selectedIcon : icon}
            title={`${site?.name || 'Place'} · to confirm`}
            zIndex={id === String(selectedId) ? 60 : 40}
            onClick={() => onSelect?.(site)}
          />
        );
      })}
    </>
  );
}
