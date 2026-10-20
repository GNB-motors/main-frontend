import { Link } from 'react-router-dom';
import { Truck, CreditCard, ArrowLeft, Route } from 'lucide-react';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { money, day } from './tripFormat';

const TripHeader = ({ goBack, data }) => (
  <>
    <div className="trip360-back">
      <button type="button" className="trip360-btn ghost" onClick={goBack}>
        <ArrowLeft size={15} />
        Back
      </button>
      <nav className="erp-muted" style={{ fontSize: 12.5 }}>
        <Link to="/erp">ERP</Link> <span className="trip360-meta-sep">›</span>{' '}
        <Link to="/erp/pipeline">Pipeline</Link> <span className="trip360-meta-sep">›</span>{' '}
        {data.tripNumber}
      </nav>
    </div>

    <div className="trip360-id">
      <h1 className="trip360-number">{data.tripNumber}</h1>
      <StatusBadge status={data.state} />
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {data.vehicleType && (
          <span className={`trip360-chip ${data.vehicleType === 'HIRE' ? 'hire' : ''}`}>
            <Truck size={12} /> {data.vehicleType}
          </span>
        )}
        {data.partyId?.creditLimit != null && (
          <span className="trip360-chip">
            <CreditCard size={12} /> Credit {money(data.partyId.creditLimit)}
          </span>
        )}
        {/* Replay this trip specifically, not a date range that happens to contain
            it. `trip` carries the ERP id so the timeline can be labelled from the
            warehouse anchors instead of the edges of the window. */}
        {data.vehicleNumber && (
          <Link
            className="trip360-chip trip360-chip--link"
            to={`/route-hub?tab=replay&v=${encodeURIComponent(data.vehicleNumber)}&trip=${data._id}`}
          >
            <Route size={12} /> View replay
          </Link>
        )}
      </div>
    </div>

    <div className="trip360-meta">
      <span>{day(data.tripDate)}</span>
      <span className="trip360-meta-sep">•</span>
      <span>{data.vehicleNumber || '—'}</span>
      <span className="trip360-meta-sep">•</span>
      <span>{data.partyId?.name || '—'}</span>
      <span className="trip360-meta-sep">•</span>
      <span>
        {data.fromLocation || '—'} → {data.toLocation || '—'}
      </span>
    </div>
  </>
);

export default TripHeader;
