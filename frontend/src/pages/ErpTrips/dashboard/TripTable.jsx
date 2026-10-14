import { Link } from 'react-router-dom';
import MiniLifecycle from './MiniLifecycle';
import NextActionCell from './NextActionCell';
import AgeingFlag from './AgeingFlag';

const badgeClass = (state) => {
  switch (state) {
    case 'PLANNED':
      return 'neutral';
    case 'PLACED':
      return 'warning';
    case 'DISPATCHED':
    case 'POD_RECEIVED':
    case 'UNLOADED':
      return 'info';
    case 'TRIP_CLOSED':
    case 'BILLED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
};

const day = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
    : '—';

const TripTable = ({ trips, loading }) => (
  <div className="trippipe-tablewrap">
    <table className="trippipe-table">
      <thead>
        <tr>
          <th>Trip</th>
          <th>Date</th>
          <th>Progress</th>
          <th>Stage</th>
          <th>Next action</th>
          <th>Vehicle</th>
          <th>Client</th>
          <th>Route</th>
          <th>Qty (P/L)</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={9} className="trippipe-empty">
              Loading trips…
            </td>
          </tr>
        ) : trips.length === 0 ? (
          <tr>
            <td colSpan={9} className="trippipe-empty">
              No trips match these filters.
            </td>
          </tr>
        ) : (
          trips.map((t) => (
            <tr key={t._id}>
              <td>
                <Link to={`/erp/trips/${t._id}`} className="trippipe-trip">
                  {t.tripNumber}
                </Link>
                {t.cnNumber && <span className="trippipe-sub">CN {t.cnNumber}</span>}
              </td>
              <td className="trippipe-num">
                {day(t.tripDate)}
                <AgeingFlag trip={t} />
              </td>
              <td>
                <MiniLifecycle state={t.state} />
              </td>
              <td>
                <span className={`erp-badge ${badgeClass(t.state)}`}>
                  {t.state?.replace(/_/g, ' ')}
                </span>
              </td>
              <td>
                <NextActionCell trip={t} />
              </td>
              <td className="trippipe-num">{t.vehicleNumber || '—'}</td>
              <td>{t.partyId?.name || '—'}</td>
              <td className="trippipe-route">
                {t.fromLocation ? `${t.fromLocation} → ${t.toLocation}` : '—'}
                {t.material && <span className="trippipe-sub">{t.material}</span>}
              </td>
              <td className="trippipe-num">
                {t.plannedQty || 0} / {t.loadedQty ?? '—'}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default TripTable;
