import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { formatNumber } from '@/utils/redesign/format';
import { formatDateTimeIST, toISTDateString } from '../../utils/dateUtils';
import { getHotspotIncidents } from '../../services/HotspotService.js';

const KIND_LABEL = {
  THEFT: 'Fuel drop',
  UNAUTHORISED_REFUEL: 'Refuel at an unapproved pump',
};

/**
 * The signed fuel change. FleetEdge reports the difference as a size, not a
 * direction (a 289 → 272 L drop arrives as 17), so the levels decide the sign;
 * without them a fuel drop is a loss and a refuel a gain.
 */
function signedChange(item) {
  if (item.fuelBeforeL != null && item.fuelAfterL != null)
    return item.fuelAfterL - item.fuelBeforeL;
  if (item.fuelChangeL == null) return null;
  const size = Math.abs(item.fuelChangeL);
  return item.kind === 'THEFT' ? -size : size;
}

/** "−17 L (289 → 272 L)", or what is known of it. */
function fuelLine(item) {
  const change = signedChange(item);
  const levels =
    item.fuelBeforeL != null && item.fuelAfterL != null
      ? ` (${formatNumber(item.fuelBeforeL)} → ${formatNumber(item.fuelAfterL)} L)`
      : '';
  if (change == null) return 'Fuel change not reported';
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return `${sign}${formatNumber(Math.abs(change))} L${levels}`;
}

/**
 * One review per truck, over the IST days its incidents here fall on, so the
 * fuel-drop log opens on that truck's events instead of the page's last week.
 */
function reviewTargets(items) {
  const byTruck = new Map();
  for (const item of items) {
    if (!item.registrationNumber) continue;
    const day = item.at ? toISTDateString(item.at) : null;
    const entry = byTruck.get(item.registrationNumber) || { from: day, to: day };
    if (day && (!entry.from || day < entry.from)) entry.from = day;
    if (day && (!entry.to || day > entry.to)) entry.to = day;
    byTruck.set(item.registrationNumber, entry);
  }
  return [...byTruck].map(([reg, { from, to }]) => ({ reg, from, to }));
}

/**
 * The incidents behind one hotspot, so the count on the card can be checked
 * truck by truck. A shared hotspot lists only this fleet's own incidents and
 * says how many came from other fleets.
 */
export default function HotspotIncidents({ hotspotId, onReview }) {
  const { data, loading, error, refetch } = useApi(
    (signal) => getHotspotIncidents(hotspotId, { signal }),
    [hotspotId],
    { enabled: Boolean(hotspotId), scopeKey: `hotspot-incidents:${hotspotId}` },
  );

  if (loading && !data) return <p className="intel-fuel-incidents-note">Loading incidents…</p>;
  if (error) {
    return (
      <div className="intel-fuel-incidents-note" role="alert">
        Could not load this hotspot&apos;s incidents.{' '}
        <button type="button" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  }
  if (!data) return null;

  const items = data.items || [];
  return (
    <section className="intel-fuel-incidents" aria-label="Incidents at this hotspot">
      <h4>
        Incidents · last {data.windowDays ?? 90} days
        {data.shared ? ' · your trucks' : ''}
      </h4>
      {items.length ? (
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <div className="intel-fuel-incident-head">
                {item.registrationNumber ? (
                  <Link to={`/vehicles/${encodeURIComponent(item.registrationNumber)}?tab=fuel`}>
                    {item.registrationNumber}
                  </Link>
                ) : (
                  <strong>Truck not named</strong>
                )}
                <span className="intel-fuel-incident-kind">
                  {KIND_LABEL[item.kind] || 'Fuel alert'} ·{' '}
                  {item.at ? formatDateTimeIST(item.at) : 'time not reported'}
                </span>
              </div>
              <span
                className={`intel-fuel-incident-fuel${(signedChange(item) ?? 0) < 0 ? ' is-drop' : ''}`}
              >
                {fuelLine(item)}
              </span>
              {item.pumpName || item.place ? (
                <span className="intel-fuel-incident-where" title={item.place || undefined}>
                  {[item.pumpName, item.place].filter(Boolean).join(' · ')}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="intel-fuel-incidents-note">
          {data.shared
            ? 'None of your trucks had an incident here in this window.'
            : 'No incident from your trucks is left inside this circle in the learning window. The count is from when the hotspot was last learned.'}
        </p>
      )}
      {data.shared && data.otherFleets > 0 ? (
        <p className="intel-fuel-incidents-note">
          {formatNumber(data.otherFleets)} more {data.otherFleets === 1 ? 'incident' : 'incidents'}{' '}
          came from other fleets. Their details stay private.
        </p>
      ) : null}
      {onReview && items.some((item) => item.registrationNumber) ? (
        <div className="intel-fuel-incident-review">
          {reviewTargets(items).map(({ reg, from, to }) => (
            <button
              key={reg}
              type="button"
              className="intel-fuel-review-log"
              onClick={() => onReview({ vehicle: reg, from, to })}
            >
              Review {reg} →
            </button>
          ))}
        </div>
      ) : null}
      {data.truncated ? (
        <p className="intel-fuel-incidents-note">Showing the newest {items.length}.</p>
      ) : null}
    </section>
  );
}
