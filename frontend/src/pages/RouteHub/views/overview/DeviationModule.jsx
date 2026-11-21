import './DeviationModule.css';
import Ico from '../../routeHubIcons.jsx';
import { RowsSkeleton, Skel } from '../../routeHubShared.jsx';
import { inr } from '../../routeHubFormat';
import {
  costKnown,
  extraKnown,
  groupTotals,
  legLabel,
  notMeasuredNote,
  tripLabel,
} from '../deviation/deviationRules.js';

/** `summary` (when the API sent one) counts every open detour, not just this page. */
export default function DeviationModule({ go, first, openDev, summary }) {
  const openCount = summary?.open ?? openDev.length;
  // A cost nobody estimated is unknown, not ₹0. The totals count only the
  // detours that were measured, and say how many detours are left out.
  const totals = groupTotals(openDev);
  const summaryCost = summary?.openCostInr ?? null;
  const costIsKnown = summaryCost != null || totals.costKnown > 0;
  const openCost = summaryCost ?? totals.costInr;
  const extraKmIsKnown = totals.extraKnown > 0;
  const extraKm = totals.extraKm;
  const extraNote = notMeasuredNote(totals.extraUnknown, totals.total);
  const costNote = summaryCost != null ? null : notMeasuredNote(totals.costUnknown, totals.total);
  // One line when both figures leave out the same detours, one line each when
  // they do not.
  const notes =
    extraNote && extraNote === costNote
      ? [extraNote]
      : [
          extraNote ? `Extra km: ${extraNote}` : null,
          costNote ? `Detour cost: ${costNote}` : null,
        ].filter(Boolean);
  return (
    <div className="card rh-deviation-card">
      <div className="mhead" style={{ '--c': '#C2323A', '--tint': 'rgba(229,104,107,.14)' }}>
        <span className="mic">
          <Ico n="split" s={18} />
        </span>
        <div className="mt">
          <h3>Route deviation</h3>
          <div className="ms">Trucks that left their usual route</div>
        </div>
        <button
          type="button"
          className="go"
          aria-label="Open route deviation"
          onClick={() => go('deviation')}
        >
          <Ico n="arrowUR" s={15} />
        </button>
      </div>
      <div className="ministat">
        <div>
          <div className="v" style={{ color: '#C2323A' }}>
            {first ? <Skel w={36} h={20} /> : openCount}
          </div>
          <div className="k">pending review</div>
        </div>
        <div>
          <div className="v">
            {first ? <Skel w={56} h={20} /> : costIsKnown ? inr(openCost) : '—'}
          </div>
          <div className="k">{costIsKnown ? 'est. detour cost' : 'detour cost not estimated'}</div>
        </div>
        <div>
          <div className="v">
            {first ? <Skel w={48} h={20} /> : extraKmIsKnown ? `+${extraKm.toFixed(1)}` : '—'}
          </div>
          <div className="k">{extraKmIsKnown ? 'extra km' : 'extra km not estimated'}</div>
        </div>
      </div>
      {first || !notes.length ? null : <p className="rh-deviation-note">{notes.join(' · ')}</p>}
      {first ? <RowsSkeleton n={3} /> : null}
      <div className="rh-deviation-rows">
        {openDev.slice(0, 3).map((d) => {
          const route = d.trip ? tripLabel(d.trip) : legLabel(null);
          const offRoad = d.offRouteKm != null;
          const distanceKnown = offRoad || extraKnown(d);
          const distance = offRoad ? d.offRouteKm : d.extraKmEstimate;
          const distanceText = distanceKnown
            ? `${offRoad ? '' : '+'}${Number(distance).toLocaleString('en-IN', { maximumFractionDigits: 2 })} km`
            : '—';
          const knownCost = costKnown(d);
          return (
            <button
              type="button"
              className="rh-deviation-row"
              aria-label={`Review deviation for ${d.registrationNumber || 'unknown vehicle'}: ${route}`}
              key={d._id}
              onClick={() => go('deviation', { d: d._id })}
            >
              <span className="rh-deviation-identity">
                <span className="plate">{d.registrationNumber || 'Unknown vehicle'}</span>
                <span className="rh-deviation-route" title={`${route} · ${legLabel(d.trip)}`}>
                  {route}
                </span>
              </span>
              <span className="rh-deviation-metric">
                <b>{distanceText}</b>
                <span>
                  {offRoad
                    ? 'off road'
                    : distanceKnown
                      ? 'extra distance'
                      : 'distance not estimated'}
                </span>
              </span>
              <span className={`rh-deviation-metric${knownCost ? ' rh-deviation-cost' : ''}`}>
                <b>{knownCost ? inr(d.estimatedExtraCostInr) : '—'}</b>
                <span>{knownCost ? 'est. cost' : 'cost not estimated'}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
