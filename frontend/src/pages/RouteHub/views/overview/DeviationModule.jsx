import Ico from '../../routeHubIcons.jsx';
import { RowsSkeleton, Skel } from '../../routeHubShared.jsx';
import { inr } from '../../routeHubFormat';
import { legLabel, tripLabel } from '../deviation/deviationRules.js';

/** `summary` (when the API sent one) counts every open detour, not just this page. */
export default function DeviationModule({ go, first, openDev, summary }) {
  const openCount = summary?.open ?? openDev.length;
  // A cost nobody estimated is unknown, not ₹0.
  const costKnown =
    summary?.openCostInr != null || openDev.some((d) => d.estimatedExtraCostInr != null);
  const openCost =
    summary?.openCostInr ?? openDev.reduce((a, d) => a + (d.estimatedExtraCostInr || 0), 0);
  const extraKmKnown = openDev.some((d) => d.extraKmEstimate != null);
  const extraKm = openDev.reduce((a, d) => a + (d.extraKmEstimate || 0), 0);
  return (
    <div className="card">
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
          <div className="v">{first ? <Skel w={56} h={20} /> : costKnown ? inr(openCost) : '—'}</div>
          <div className="k">{costKnown ? 'est. detour cost' : 'detour cost not estimated'}</div>
        </div>
        <div>
          <div className="v">
            {first ? (
              <Skel w={48} h={20} />
            ) : extraKmKnown ? (
              `+${extraKm.toFixed(1)}`
            ) : (
              '—'
            )}
          </div>
          <div className="k">{extraKmKnown ? 'extra km' : 'extra km not estimated'}</div>
        </div>
      </div>
      {first ? <RowsSkeleton n={3} /> : null}
      <div className="rows">
        {openDev.slice(0, 3).map((d) => (
          <button
            type="button"
            className="row"
            key={d._id}
            onClick={() => go('deviation', { d: d._id })}
            style={{
              width: '100%',
              border: 0,
              background: 'transparent',
              font: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span className="plate">{d.registrationNumber}</span>
            <span
              className="muted"
              style={{
                fontSize: 11,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={d.trip ? `${tripLabel(d.trip)} · ${legLabel(d.trip)}` : legLabel(null)}
            >
              {d.trip ? tripLabel(d.trip) : legLabel(null)}
            </span>
            <span className="sp" />
            <b style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {d.offRouteKm != null
                ? `${d.offRouteKm} km off road`
                : d.extraKmEstimate != null
                  ? `+${d.extraKmEstimate} km`
                  : '—'}
            </b>
            {d.estimatedExtraCostInr != null ? (
              <b
                style={{
                  color: '#C2323A',
                  width: 44,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                {inr(d.estimatedExtraCostInr)}
              </b>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
