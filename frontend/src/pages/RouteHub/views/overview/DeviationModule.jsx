import Ico from '../../routeHubIcons.jsx';
import { RowsSkeleton, Skel } from '../../routeHubShared.jsx';
import { inr } from '../../routeHubFormat';

export default function DeviationModule({ go, first, openDev }) {
  return (
    <div className="card">
      <div className="mhead" style={{ '--c': '#C2323A', '--tint': 'rgba(229,104,107,.14)' }}>
        <span className="mic">
          <Ico n="split" s={18} />
        </span>
        <div className="mt">
          <h3>Route deviation</h3>
          <div className="ms">Trips that left their corridor</div>
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
            {first ? <Skel w={36} h={20} /> : openDev.length}
          </div>
          <div className="k">pending review</div>
        </div>
        <div>
          <div className="v">
            {first ? (
              <Skel w={56} h={20} />
            ) : (
              inr(openDev.reduce((a, d) => a + (d.estimatedExtraCostInr || 0), 0))
            )}
          </div>
          <div className="k">est. detour cost</div>
        </div>
        <div>
          <div className="v">
            {first ? (
              <Skel w={48} h={20} />
            ) : (
              `+${openDev.reduce((a, d) => a + (d.extraKmEstimate || 0), 0).toFixed(1)}`
            )}
          </div>
          <div className="k">extra km</div>
        </div>
      </div>
      {first ? <RowsSkeleton n={3} /> : null}
      <div className="rows">
        {openDev.slice(0, 3).map((d) => (
          <div className="row" key={d._id}>
            <span className="plate">{d.registrationNumber}</span>
            <span className="sp" />
            <b style={{ fontVariantNumeric: 'tabular-nums' }}>+{d.extraKmEstimate ?? 0} km</b>
            <b style={{ color: '#C2323A', width: 44, textAlign: 'right' }}>
              {inr(d.estimatedExtraCostInr || 0)}
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}
