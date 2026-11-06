import { formatINR, formatLitres, formatNum } from '../../../../utils/formatters';
import { formatDateIST } from '../../../../utils/dateUtils';
import CardHead from './CardHead';

/** Recent fills, with each fill's size drawn relative to the biggest one. */
export default function FuelCard({ recentFuelLogs, kmPerLitre, onGoFuel }) {
  const logs = recentFuelLogs || [];
  const max = logs.reduce((m, l) => Math.max(m, Number(l.litres) || 0), 0);
  const total = logs.reduce((s, l) => s + (Number(l.totalAmount) || 0), 0);

  const mileageDisplay =
    kmPerLitre?.kmPerLitre != null
      ? `${formatNum(kmPerLitre.kmPerLitre, { decimals: 2 })} km/L`
      : kmPerLitre?.ecuKmPerLitre != null
        ? `${formatNum(kmPerLitre.ecuKmPerLitre, { decimals: 2 })} km/L (ECU)`
        : null;

  return (
    <section className="v360-card">
      <CardHead
        title="Fuel"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {mileageDisplay ? (
              <span className="v360-pill v360-pill--ok">
                <span className="v360-pill-dot" aria-hidden="true" />
                {mileageDisplay}
              </span>
            ) : null}
            <button type="button" className="v360-link" onClick={onGoFuel}>
              Fuel history →
            </button>
          </div>
        }
      />
      {logs.length === 0 ? (
        <div className="v360-empty">
          <span className="v360-empty-title">No fuel logs</span>
          <span className="v360-empty-hint">
            Uploaded fuel bills for this vehicle appear here once they are processed.
          </span>
        </div>
      ) : (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">{formatLitres(logs[0].litres)}</span>
            <span className="v360-figure-note">last fill · {formatINR(logs[0].totalAmount)}</span>
          </p>
          <p className="v360-card-lede">
            {formatNum(logs.length)} fill{logs.length === 1 ? '' : 's'} on record ·{' '}
            {formatINR(total)} total.
            {kmPerLitre?.cycles ? ` ${kmPerLitre.cycles} verified fill-to-full cycles.` : ''}
          </p>
          <div className="v360-fills">
            {logs.map((l) => (
              <div key={l.id || l._id} className="v360-fill">
                <span className="v360-fill-date">{formatDateIST(l.refuelTime)}</span>
                <span className="v360-fill-bar" aria-hidden="true">
                  <span
                    style={{ width: max ? `${((Number(l.litres) || 0) / max) * 100}%` : '0%' }}
                  />
                </span>
                <span className="v360-fill-amount">{formatLitres(l.litres)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
