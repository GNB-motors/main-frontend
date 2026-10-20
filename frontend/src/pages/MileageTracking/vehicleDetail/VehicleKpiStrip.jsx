import { AlertTriangle, Clock, Gauge, Fuel, MapPin } from 'lucide-react';
import { onActivateKey } from '../../../utils/onActivateKey';

/** Vehicle KPI cards; the mileage, flagged and pending cards double as status filters. */
const VehicleKpiStrip = ({ statusTab, setStatusTab, stats, pagination }) => (
  <div className="mt-kpi-strip">
    {/* Average Mileage */}
    <div
      className={`mt-kpi-card ${statusTab === 'all' ? 'is-active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => setStatusTab('all')}
      onKeyDown={onActivateKey(() => setStatusTab('all'))}
      title="Click to view all intervals"
    >
      <div className="mt-kpi-card__top">
        <span className="mt-kpi-card__label">Vehicle Avg Mileage</span>
        <span className="mt-kpi-card__icon mt-kpi-card__icon--blue">
          <Gauge size={14} />
        </span>
      </div>
      <div className="mt-kpi-card__val">
        <span>{stats.avg}</span>
        {stats.avg !== '—' && <span className="mt-kpi-card__unit">km/L</span>}
      </div>
      <div className="mt-kpi-card__sub">Across {pagination.total} intervals</div>
    </div>

    {/* Total Distance */}
    <div className="mt-kpi-card">
      <div className="mt-kpi-card__top">
        <span className="mt-kpi-card__label">Tracked Distance</span>
        <span className="mt-kpi-card__icon mt-kpi-card__icon--purple">
          <MapPin size={14} />
        </span>
      </div>
      <div className="mt-kpi-card__val">
        <span>{stats.totalDist.toFixed(1)}</span>
        <span className="mt-kpi-card__unit">km</span>
      </div>
      <div className="mt-kpi-card__sub">On active page</div>
    </div>

    {/* Total Fuel */}
    <div className="mt-kpi-card">
      <div className="mt-kpi-card__top">
        <span className="mt-kpi-card__label">Total Billed Fuel</span>
        <span className="mt-kpi-card__icon mt-kpi-card__icon--green">
          <Fuel size={14} />
        </span>
      </div>
      <div className="mt-kpi-card__val">
        <span>{stats.totalFuel.toFixed(1)}</span>
        <span className="mt-kpi-card__unit">L</span>
      </div>
      <div className="mt-kpi-card__sub">On active page</div>
    </div>

    {/* Flagged Anomalies */}
    <div
      className={`mt-kpi-card ${statusTab === 'flagged' ? 'is-active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => setStatusTab((t) => (t === 'flagged' ? 'all' : 'flagged'))}
      onKeyDown={onActivateKey(() => setStatusTab((t) => (t === 'flagged' ? 'all' : 'flagged')))}
      title="Filter flagged anomaly intervals"
    >
      <div className="mt-kpi-card__top">
        <span className="mt-kpi-card__label">Flagged Anomalies</span>
        <span className="mt-kpi-card__icon mt-kpi-card__icon--red">
          <AlertTriangle size={14} />
        </span>
      </div>
      <div className="mt-kpi-card__val">{stats.flaggedCount}</div>
      <div className="mt-kpi-card__sub">Telematics divergence</div>
    </div>

    {/* Pending GPS */}
    <div
      className={`mt-kpi-card ${statusTab === 'pending' ? 'is-active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => setStatusTab((t) => (t === 'pending' ? 'all' : 'pending'))}
      onKeyDown={onActivateKey(() => setStatusTab((t) => (t === 'pending' ? 'all' : 'pending')))}
      title="Filter pending intervals"
    >
      <div className="mt-kpi-card__top">
        <span className="mt-kpi-card__label">Pending Sync</span>
        <span className="mt-kpi-card__icon mt-kpi-card__icon--amber">
          <Clock size={14} />
        </span>
      </div>
      <div className="mt-kpi-card__val">{stats.pendingCount}</div>
      <div className="mt-kpi-card__sub">Awaiting full tank / GPS</div>
    </div>
  </div>
);

export default VehicleKpiStrip;
