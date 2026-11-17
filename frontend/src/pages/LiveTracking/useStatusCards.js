import { useMemo } from 'react';

export default function useStatusCards(counts) {
  // Connected status cards definition matching WheelsEye standard
  const STATUS_CARDS = useMemo(
    () => [
      {
        k: 'all',
        label: 'All',
        count: counts.all,
        stripe: '#0A1128',
        countColor: null,
        hint: 'Every truck in the fleet, whatever its status.',
      },
      {
        k: 'moving',
        label: 'Moving',
        count: counts.moving,
        stripe: '#0C9F41',
        countColor: null,
        hint: 'Reporting and on the move — speed above 3 km/h.',
      },
      {
        k: 'stopped',
        label: 'Stopped',
        count: counts.stopped,
        stripe: '#9333EA',
        countColor: null,
        hint: 'Reporting but parked, with the ignition off.',
      },
      {
        k: 'idling',
        label: 'Idling',
        count: counts.idling,
        stripe: '#F97316',
        countColor: null,
        // Instant engine-on-and-stopped, not the Idling Console's ≥ threshold stops (DC-17).
        hint: 'Engine on and not moving right now. Idling Console counts stops longer than your idle threshold.',
      },
      {
        k: 'offline',
        label: 'Offline',
        count: counts.offline,
        stripe: '#9CA3AF',
        countColor: null,
        hint: "No GPS fix for over an hour — the device hasn't reported.",
      },
    ],
    [counts],
  );

  return STATUS_CARDS;
}
