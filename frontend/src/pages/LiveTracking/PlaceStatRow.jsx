import InfoTip from '../../components/redesign/InfoTip';
import { formatDuration } from '../../utils/redesign/format';
import { compactDuration } from './placeDetailFormat.js';

export default function PlaceStatRow({ stats, trucksHere = 0 }) {
  const usualDwell = stats?.usualDwellMin ?? null;
  const visits = stats?.visits ?? null;
  const metrics = [
    {
      label: 'Here now',
      value: String(trucksHere),
      sub: 'trucks',
      why: 'Trucks with a live position inside this place right now.',
    },
    {
      label: 'Usual stay',
      value: compactDuration(usualDwell),
      sub: 'per visit',
      title: formatDuration(usualDwell),
      why: 'How long a truck usually stays here, worked out from its past visits.',
    },
    {
      label: 'Visits',
      value: visits === null ? '—' : visits.toLocaleString('en-IN'),
      sub: 'last 60 days',
      why: 'How many times your trucks came here in the last 60 days.',
    },
  ];
  return (
    <dl className="pd-stats" aria-label="Place activity">
      {metrics.map((m) => (
        <div key={m.label} className="pd-stat">
          <dt>
            {m.label}
            <InfoTip label={`About ${m.label.toLowerCase()}`} text={m.why} />
          </dt>
          <dd title={m.title}>{m.value}</dd>
          <span className="pd-stat-sub">{m.sub}</span>
        </div>
      ))}
    </dl>
  );
}
