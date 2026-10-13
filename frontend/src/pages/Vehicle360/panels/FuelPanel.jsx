import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatINR, formatLitres, formatNum } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import { hasDefLedgerData } from '../vehicle360Logic';
import Empty from './Empty';

export default function FuelPanel({ recentFuelLogs, defBalance }) {
  const logs = recentFuelLogs || [];

  return (
    <PanelErrorBoundary name="vehicle-fuel">
      <div className="v360-panel v360-panel--halves">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Fuel bills</p>
            <Link to="/refuel-logs" className="v360-link">
              All refuel logs →
            </Link>
          </div>
          {logs.length === 0 ? (
            <Empty
              title="No fuel logs"
              hint="Uploaded fuel bills for this vehicle appear here once they are processed."
            />
          ) : (
            <table className="v360-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="is-num">Litres</th>
                  <th className="is-num">Rate</th>
                  <th className="is-num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDateIST(l.refuelTime)}</td>
                    <td className="is-num">{formatLitres(l.litres)}</td>
                    <td className="is-num">{l.rate != null ? `${formatINR(l.rate)}/L` : '—'}</td>
                    <td className="is-num">{formatINR(l.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">DEF ledger</p>
            <Link to="/def-ledger" className="v360-link">
              DEF ledger →
            </Link>
          </div>
          {hasDefLedgerData(defBalance) ? (
            <dl className="v360-kv">
              <dt>Claimed (bills)</dt>
              <dd>{formatLitres(defBalance.claimedAdblueL)}</dd>
              <dt>Consumed (telemetry)</dt>
              <dd>{formatLitres(defBalance.telemetryDefL)}</dd>
              <dt>Expected balance</dt>
              <dd>{formatLitres(defBalance.expectedBalanceL)}</dd>
              <dt>Flags</dt>
              <dd className={defBalance.flagCount > 0 ? 'is-crit' : undefined}>
                {formatNum(defBalance.flagCount ?? 0)}
              </dd>
            </dl>
          ) : (
            <Empty
              title="No DEF ledger row"
              hint="Claimed versus consumed DEF appears once both bills and CAN data exist for this vehicle."
            />
          )}
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
