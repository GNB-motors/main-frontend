import Ico from '../../routeHubIcons.jsx';
import { TableEmpty, TableSkeleton } from '../../routeHubShared.jsx';
import { UNKNOWN, percent, rupees, sortByMarginAsc, tripPnlRow } from './tripPnlModel';

/**
 * Per-trip P&L, worst margin first. Every figure shows the source the API gave
 * it, and a figure the API could not price is "—" with the reason beside it —
 * never a confident ₹0.
 */
export default function TripPnlTable({ pnls, first, error }) {
  const rows = sortByMarginAsc((pnls || []).map(tripPnlRow));
  return (
    <div className="card">
      <div className="card-head">
        <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
          <Ico n="ledger" />
        </span>
        <h3>Trip P&amp;L</h3>
        <span className="hint">Per trip, worst margin first · every figure keeps its source</span>
      </div>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Trip</th>
              <th className="num">Distance</th>
              <th className="num">Revenue</th>
              <th className="num">Cost</th>
              <th className="num">Margin</th>
              <th>Sources</th>
            </tr>
          </thead>
          {rows.length ? (
            <tbody>
              {rows.map((r) => (
                <tr key={r.id || `${r.vehicle}-${r.at}`}>
                  <td className="strong">{r.vehicle}</td>
                  <td className="num mono">{r.km != null ? `${r.km} km` : UNKNOWN}</td>
                  <td className="num mono">
                    {rupees(r.revenue)}
                    {r.revenueReason ? <div className="hint">{r.revenueReason}</div> : null}
                  </td>
                  <td className="num mono">
                    {rupees(r.cost)}
                    {r.costReason ? (
                      <div className="hint">
                        {r.costReason}
                        {r.knownCost != null
                          ? ` · ₹${Math.round(r.knownCost).toLocaleString('en-IN')} known so far`
                          : ''}
                      </div>
                    ) : null}
                  </td>
                  <td className="num mono strong">
                    {percent(r.margin)}
                    {r.marginReason ? <div className="hint">{r.marginReason}</div> : null}
                  </td>
                  <td>
                    <div className="mono">{r.sources.length ? r.sources.join(' · ') : UNKNOWN}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : first ? (
            <TableSkeleton cols={6} />
          ) : (
            <TableEmpty
              colSpan={6}
              title={error ? 'Trip P&L unavailable' : 'No trips to price yet'}
              sub={error || 'Trip revenue and cost appear once trips are in the register.'}
              tone={error ? '#C56200' : '#187A32'}
              icon={error ? 'alert' : 'check'}
            />
          )}
        </table>
      </div>
    </div>
  );
}
