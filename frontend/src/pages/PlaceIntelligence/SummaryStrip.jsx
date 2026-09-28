import { ListChecks, MapPinCheck, Hourglass, ShieldAlert, WifiOff } from 'lucide-react';

/**
 * The page's headline numbers. Each tile is a way in: clicking it opens the
 * list that explains the number.
 */
export default function SummaryStrip({ summary, activeKey, onPick }) {
  const s = summary || {};
  const toReview = s.toReview ?? 0;
  const idle = s.unproductive || {};
  const places = s.places || {};
  const tiles = [
    {
      key: 'review',
      Icon: ListChecks,
      label: 'Need your answer',
      value: toReview,
      hint: toReview ? 'Places the system can’t name on its own' : 'All caught up',
      tone: toReview ? 'warn' : 'ok',
    },
    {
      key: 'confirmed',
      Icon: MapPinCheck,
      label: 'Known places',
      value: places.confirmed ?? 0,
      hint: places.proposed ? `${places.proposed} more found, waiting on you` : 'Confirmed by you',
      tone: 'ok',
    },
    {
      key: 'stops',
      Icon: Hourglass,
      label: 'Unexplained stop time',
      value: idle.hours ?? 0,
      unit: 'h',
      hint: idle.stops
        ? `${idle.stops} stops · ${idle.trucks} truck${idle.trucks === 1 ? '' : 's'} · last 7 days`
        : 'No unexplained stops this week',
      tone: idle.stops ? 'warn' : 'ok',
    },
    {
      key: 'risk',
      Icon: ShieldAlert,
      label: 'Fuel-risk places',
      value: s.riskPlaces ?? 0,
      hint: 'Theft or unauthorised refuelling reported',
      tone: s.riskPlaces ? 'crit' : 'ok',
    },
    {
      key: 'zones',
      Icon: WifiOff,
      label: 'Signal dead zones',
      value: s.darkZones ?? 0,
      hint: 'Trackers go quiet here — gaps are normal',
      tone: 'neutral',
    },
  ];
  return (
    <div className="pi-summary">
      {tiles.map((t) => (
        <button
          type="button"
          key={t.key}
          className={`pi-tile pi-tile--${t.tone}${activeKey === t.key ? ' is-active' : ''}`}
          onClick={() => onPick(t.key)}
        >
          <span className="pi-tile-label">
            <t.Icon size={14} aria-hidden="true" /> {t.label}
          </span>
          <span className="pi-tile-value">
            {summary ? t.value : '–'}
            {t.unit && summary ? <small>{t.unit}</small> : null}
          </span>
          <span className="pi-tile-hint" title={t.hint}>
            {t.hint}
          </span>
        </button>
      ))}
    </div>
  );
}
