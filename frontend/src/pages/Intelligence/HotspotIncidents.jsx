import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { formatNumber } from '@/utils/redesign/format';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { getHotspotIncidents } from '../../services/HotspotService.js';

const KIND_LABEL = {
  THEFT: 'Fuel drop',
  UNAUTHORISED_REFUEL: 'Refuel at an unapproved pump',
};

/** "−40 L (180 → 140 L)", or what is known of it. */
function fuelLine(item) {
  const change = item.fuelChangeL;
  const levels =
    item.fuelBeforeL != null && item.fuelAfterL != null
      ? ` (${formatNumber(item.fuelBeforeL)} → ${formatNumber(item.fuelAfterL)} L)`
      : '';
  if (change == null) return levels ? levels.trim() : 'Fuel change not reported';
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return `${sign}${formatNumber(Math.abs(change))} L${levels}`;
}

/**
 * The incidents behind one hotspot, so the count on the card can be checked
 * truck by truck. A shared hotspot lists only this fleet's own incidents and
 * says how many came from other fleets.
 */
export default function HotspotIncidents({ hotspotId }) {
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
              <div>
                {item.registrationNumber ? (
                  <Link to={`/vehicles/${encodeURIComponent(item.registrationNumber)}?tab=fuel`}>
                    {item.registrationNumber}
                  </Link>
                ) : (
                  <strong>Truck not named</strong>
                )}
                <span>{KIND_LABEL[item.kind] || 'Fuel alert'}</span>
              </div>
              <div>
                <strong>{fuelLine(item)}</strong>
                <small>
                  {item.at ? formatDateTimeIST(item.at) : 'Time not reported'}
                  {item.pumpName ? ` · ${item.pumpName}` : ''}
                  {item.place ? ` · ${item.place}` : ''}
                </small>
              </div>
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
      {data.truncated ? (
        <p className="intel-fuel-incidents-note">Showing the newest {items.length}.</p>
      ) : null}
    </section>
  );
}
