import { CheckCircle2, XCircle, CalendarClock } from 'lucide-react';
import { BOARD_STATE_LABEL, BOARD_STATE_TONE } from './boardState';
import { money, dateLabel } from './boardFormat';
import reasons from './tankerReasons';

const FleetTable = ({ rows, setTarget, atLoadingPoint, assignQty, order }) => (
  <div className="erp-table-scroll">
    <table className="erp-table">
      <thead>
        <tr>
          <th>Vehicle</th>
          <th>Location</th>
          <th>Capacity</th>
          <th>Compatibility</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => {
          const assignable = t.isAvailable && t.isCompatible !== false;
          return (
            <tr
              key={t.vehicleId}
              className="clickable"
              onClick={() => setTarget({ mode: 'OWN', tanker: t })}
              style={{ cursor: 'pointer' }}
            >
              <td>
                <div className="erp-cell-strong">{t.registrationNumber}</div>
                {t.model && <div className="erp-cell-muted">{t.model}</div>}
              </td>
              <td>
                {t.location}
                {atLoadingPoint(t) && (
                  <div className="erp-badge success" style={{ marginTop: 2 }}>
                    at loading point
                  </div>
                )}
                {t.expectedFreeAt && (
                  <div className="erp-cell-muted">
                    <CalendarClock size={11} style={{ verticalAlign: '-1px' }} /> free{' '}
                    {dateLabel(t.expectedFreeAt)}
                  </div>
                )}
              </td>
              <td className="erp-numeric">
                {t.capacity != null ? `${t.capacity} ${t.capacityUnit || ''}` : '—'}
              </td>
              <td>
                <ul className="erp-reasons">
                  {reasons(t).map((r) => (
                    <li key={r.text} className={r.ok ? 'is-ok' : 'is-no'}>
                      {r.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {r.text}
                    </li>
                  ))}
                </ul>
                {t.carriedForwardAmount > 0 && (
                  <div className="erp-cell-muted">
                    carries {money(t.carriedForwardAmount)} empty running
                  </div>
                )}
              </td>
              <td>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    alignItems: 'flex-start',
                  }}
                >
                  <span className={`erp-badge ${BOARD_STATE_TONE[t.boardState] || 'neutral'}`}>
                    {BOARD_STATE_LABEL[t.boardState] || t.boardState}
                  </span>
                  {assignable ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTarget({ mode: 'OWN', tanker: t });
                      }}
                    >
                      Assign {assignQty(t)} {order.qtyUnit}
                    </button>
                  ) : t.boardState === 'ON_TRIP' ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTarget({ mode: 'OWN', tanker: t });
                      }}
                    >
                      Place / Queue
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default FleetTable;
