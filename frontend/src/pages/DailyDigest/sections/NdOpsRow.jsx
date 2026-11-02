import { Check, Fuel as FuelIcon } from 'lucide-react';
import { formatINR, formatNum } from '../../../utils/formatters';

export default function NdOpsRow({ money, idlingTop5, detourTop5, fuelEfficiency, onOpenVehicle }) {
  // idlingTop5/detourTop5 live at the top level of the money slice, as siblings
  // of `money` (the inner totals object) — not inside it. `money` here is that
  // inner object (idlingWasteInr etc.), so the per-vehicle arrays must be passed
  // in separately or the card shows a ₹ total over "0 min across 0 vehicles".
  const idling = idlingTop5 || [];
  const detour = detourTop5 || [];
  const idleMinutesTotal = idling.reduce((s, r) => s + (r.idleMinutes || 0), 0);
  const detourKmTotal = detour.reduce((s, r) => s + (r.detourKm || 0), 0);
  const worst = fuelEfficiency?.worst || [];
  const best = Math.max(1, ...worst.map((v) => v.kmpl));

  return (
    <section className="nd-ops">
      <div className="nd-card nd-opcard" style={{ '--c': '#C56200' }}>
        <div className="nd-card-head">
          <h2>Idling waste</h2>
          <span className="nd-sp" />
        </div>
        {money?.idlingWasteInr ? (
          <div className="nd-big">
            <span className="nd-v" style={{ color: '#C56200' }}>
              {formatINR(money.idlingWasteInr)}
            </span>
            <span className="nd-u">
              Top {idling.length} vehicles idled {formatNum(idleMinutesTotal)} min today
            </span>
          </div>
        ) : (
          <div className="nd-empty">
            <span className="nd-ok">
              <Check size={22} />
            </span>
            <b>No idling waste today</b>
            <span>Vehicles idling over 30 min appear here.</span>
          </div>
        )}
      </div>
      <div className="nd-card nd-opcard" style={{ '--c': '#2F58EE' }}>
        <div className="nd-card-head">
          <h2>Detour waste</h2>
          <span className="nd-sp" />
        </div>
        {money?.detourWasteInr ? (
          <div className="nd-big">
            <span className="nd-v" style={{ color: '#2F58EE' }}>
              {formatINR(money.detourWasteInr)}
            </span>
            <span className="nd-u">
              Top {detour.length} vehicles drove {detourKmTotal.toFixed(0)} km off-route
            </span>
          </div>
        ) : (
          <div className="nd-empty">
            <span className="nd-ok">
              <Check size={22} />
            </span>
            <b>No detour waste today</b>
            <span>Vehicles driving off the planned route appear here.</span>
          </div>
        )}
      </div>
      <div className="nd-card nd-opcard" style={{ '--c': '#187A32' }}>
        <div className="nd-card-head">
          <h2>Fuel efficiency</h2>
          <span className="nd-sp" />
          <span className="nd-hint">Worst {worst.length} vs fleet</span>
        </div>
        {worst.length === 0 ? (
          <div className="nd-empty">
            <span className="nd-ok">
              <FuelIcon size={22} />
            </span>
            <b>No fuel efficiency data yet</b>
            <span>Appears once a full-tank-to-full-tank refuel cycle completes.</span>
          </div>
        ) : (
          <>
            <div className="nd-big">
              <span className="nd-v">
                {fuelEfficiency.fleetKmpl ?? '—'}{' '}
                <span
                  style={{
                    fontSize: 'var(--type-s)',
                    color: 'var(--fg-secondary)',
                    fontWeight: 500,
                  }}
                >
                  km/L
                </span>
              </span>
              <span className="nd-u">fleet average this week</span>
            </div>
            <div className="nd-bars" style={{ paddingTop: 0 }}>
              {worst.map((v) => (
                <button
                  key={v.vehicleId}
                  type="button"
                  className="nd-bar-row"
                  style={{
                    '--c':
                      fuelEfficiency.fleetKmpl && v.kmpl < fuelEfficiency.fleetKmpl * 0.85
                        ? '#C2323A'
                        : '#C56200',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onClick={() => onOpenVehicle(v.registrationNumber)}
                >
                  <span className="nd-n">{v.registrationNumber}</span>
                  <span className="nd-a">{v.kmpl} km/L</span>
                  <span className="nd-t">
                    <span className="nd-f" style={{ width: `${(v.kmpl / best) * 100}%` }} />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
