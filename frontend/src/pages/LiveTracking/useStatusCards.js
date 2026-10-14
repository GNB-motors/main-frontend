import { useMemo } from 'react';

export default function useStatusCards(counts) {
  // Connected status cards definition matching WheelsEye standard
  const STATUS_CARDS = useMemo(
    () => [
      { k: 'all', label: 'All', count: counts.all, stripe: '#0A1128', countColor: null },
      { k: 'moving', label: 'Moving', count: counts.moving, stripe: '#0C9F41', countColor: null },
      {
        k: 'stopped',
        label: 'Stopped',
        count: counts.stopped,
        stripe: '#9333EA',
        countColor: null,
      },
      { k: 'idling', label: 'Idling', count: counts.idling, stripe: '#F97316', countColor: null },
      {
        k: 'offline',
        label: 'Offline',
        count: counts.offline,
        stripe: '#9CA3AF',
        countColor: null,
      },
      {
        k: 'breakdown',
        label: 'Breakdown',
        count: counts.breakdown,
        stripe: '#EF4444',
        countColor: '#EF4444',
      },
      {
        k: 'faulty',
        label: 'Faulty',
        count: counts.faulty,
        stripe: '#84CC16',
        countColor: '#84CC16',
      },
      {
        k: 'geofence',
        label: 'Geofence',
        count: counts.geofence,
        stripe: '#3B82F6',
        countColor: null,
      },
    ],
    [counts],
  );

  return STATUS_CARDS;
}
