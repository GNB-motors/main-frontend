import { Fuel, Clock, MapPin, Info } from 'lucide-react';
import { fmt, fmtDate } from '../mileageIntervalDetailFormat';

/* ── 4. Refuel Slips Table ── */
const RefuelSlipsTable = ({ fuelEntries, isOngoing }) => {
  if (!fuelEntries || fuelEntries.length === 0) return null;

  return (
    <div className="mt-slips-card">
      <div className="mt-slips-card__header">
        <div className="mt-recon-card__title">
          <Fuel size={16} style={{ color: 'var(--mt-primary)' }} />
          <span>Refuel Slips Reconciled In This Interval</span>
          <span className="mt-badge-completed" style={{ fontSize: '12px', padding: '2px 8px' }}>
            {fuelEntries.length} receipts
          </span>
        </div>
        <span className="mt-recon-card__sub">
          Chronological sequence of physical fuel slips defining this odometer window
        </span>
      </div>

      <table className="mt-slips-table">
        <thead>
          <tr>
            <th style={{ width: '18%' }}>Event Type</th>
            <th style={{ width: '18%' }}>Refuel Timestamp</th>
            <th style={{ width: '28%' }}>Pump Station / Location</th>
            <th style={{ width: '14%' }} className="text-center">
              Odometer
            </th>
            <th style={{ width: '11%' }} className="text-right">
              Volume
            </th>
            <th style={{ width: '11%' }} className="text-right">
              Total (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          {fuelEntries.map((entry, idx) => {
            const { log, label, type } = entry;
            if (!log) return null;
            const tagClass =
              type === 'start'
                ? 'mt-slip-tag--start'
                : type === 'partial'
                  ? 'mt-slip-tag--partial'
                  : 'mt-slip-tag--end';

            const pumpName =
              log.location ||
              (log.routeSource
                ? `${log.routeSource.name}${log.routeSource.city ? ', ' + log.routeSource.city : ''}`
                : 'Direct refuel station');

            return (
              <tr key={log._id || idx}>
                <td>
                  <span className={`mt-slip-tag ${tagClass}`}>{label}</span>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
                  <Clock
                    size={13}
                    style={{ display: 'inline', marginRight: 5, verticalAlign: -1 }}
                  />
                  {fmtDate(log.refuelTime)}
                </td>
                <td>
                  <span
                    style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--mt-text-primary)' }}
                  >
                    <MapPin
                      size={13}
                      style={{
                        display: 'inline',
                        marginRight: 5,
                        verticalAlign: -1,
                        color: 'var(--mt-text-muted)',
                      }}
                    />
                    {pumpName}
                  </span>
                </td>
                <td className="text-center">
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                    {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : '—'}
                  </span>
                </td>
                <td className="text-right">
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--mt-primary)',
                    }}
                  >
                    {fmt(log.litres, 2, 'L')}
                  </span>
                </td>
                <td className="text-right">
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                    {log.totalAmount != null
                      ? `₹${log.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                      : '—'}
                  </span>
                  {log.rate != null && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: 'var(--mt-text-muted)',
                        marginTop: 2,
                      }}
                    >
                      ₹{log.rate}/L
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isOngoing && (
        <div className="mt-ongoing-strip">
          <Info size={13} />
          <span>
            This interval is currently <strong>ACTIVE</strong> — awaiting final full-tank refuel to
            compute final interval mileage.
          </span>
        </div>
      )}
    </div>
  );
};

export default RefuelSlipsTable;
