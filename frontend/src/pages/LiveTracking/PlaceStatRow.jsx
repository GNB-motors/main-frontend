import StatTile from '../../components/redesign/StatTile';
import { formatDuration } from '../../utils/redesign/format';

/**
 * PlaceStatRow — the three numbers about a place.
 *
 * "Trucks here now", "Usual time here" and "Visits (60 days)" are what an
 * owner actually asks about a place. A missing number is shown as an em
 * dash, never as zero — a place we have no data for has no zero visits, it
 * has no answer.
 */
export default function PlaceStatRow({ stats, trucksHere = 0 }) {
  const usualDwell = stats?.usualDwellMin ?? null;
  const visits = stats?.visits ?? null;

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile
        label="Trucks here now"
        value={String(trucksHere)}
        tone="info"
        why={{
          text: 'Trucks with a live position inside this place right now.',
          basis: null,
        }}
      />
      <StatTile
        label="Usual time here"
        value={usualDwell === null ? '—' : formatDuration(usualDwell)}
        tone="info"
        why={{
          text: 'How long a truck usually stays here, worked out from its past visits.',
          basis: null,
        }}
      />
      <StatTile
        label="Visits (60 days)"
        value={visits === null ? '—' : visits.toLocaleString('en-IN')}
        tone="info"
        why={{
          text: 'How many times your trucks came here in the last 60 days.',
          basis: null,
        }}
      />
    </div>
  );
}
