import { useMemo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { dotIcon } from '../PlaceHub/map/mapIcons.js';
import { formatIdlingChip } from './trackIdlingModel';

/**
 * TrackIdlingLayer — the trucks idling right now.
 *
 * An amber dot with the minutes on it, so the owner sees which standing truck
 * is burning fuel and for how long.
 */
export default function TrackIdlingLayer({ rows = [], onSelect }) {
  const icon = useMemo(() => dotIcon('#f59e0b', 7, { opacity: 0.95 }), []);
  if (!rows.length) return null;
  return (
    <>
      {rows.map((row, index) => {
        const lat = Number(row?.lat);
        const lng = Number(row?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const label = formatIdlingChip(row?.durationMin);
        const plate = row?.registrationNumber || row?.vehicleNumber || '';
        return (
          <MarkerF
            key={`idling-${row?._id ?? row?.id ?? `${plate}-${index}`}`}
            position={{ lat, lng }}
            icon={icon}
            title={label ? `${plate} · ${label}` : plate}
            zIndex={45}
            onClick={() => onSelect?.(row)}
          />
        );
      })}
    </>
  );
}
