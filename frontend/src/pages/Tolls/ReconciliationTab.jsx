import EmptyState from '../../components/cluster/EmptyState';
import { reconciliationCell, inr } from './tollsView';

/**
 * Estimate beside bill — the two witnesses of the same event, never averaged.
 *
 * This is the page the owner's answer is about: there are no FASTag statements
 * to reconcile against, so we estimate from the map and then check that estimate
 * against what the driver actually handed over. Three columns, always all three —
 * the estimate, the payment, and the difference. There is deliberately no column
 * that combines them, because the difference is the finding and a blended column
 * would swallow it.
 */
export default function ReconciliationTab({ rows, gaps }) {
  const list = rows || [];
  const notApplied = (gaps || []).filter((g) => g.verdict === 'RETURN_RULE_NOT_APPLIED');

  if (!list.length && !notApplied.length) {
    return (
      <EmptyState
        title="Nothing to reconcile in this window"
        hint="A row appears here for each trip and plaza where we detected a crossing: our estimate from the plaza's published rate card on one side, the driver's bill on the other. Until a bill arrives the row stays labelled an estimate, because an estimate is not money."
      />
    );
  }

  return (
    <div>
      {notApplied.length ? (
        <div className="tolls-subblock">
          <h3 className="tolls-h3">
            {notApplied.length} pass{notApplied.length === 1 ? '' : 'es'} where the plaza’s own return rule was
            not applied
          </h3>
          <p className="tolls-lede">
            Reported, not corrected. Editing a bill to the published rule would destroy the only evidence there
            is, and the difference is what you take to the plaza.
          </p>
          <table className="tolls-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Plaza</th>
                <th className="num">Return rate</th>
                <th className="num">Paid</th>
                <th className="num">Gap</th>
              </tr>
            </thead>
            <tbody>
              {notApplied.map((g) => (
                <tr key={`${g.tripId}-${g.plazaKey}-${g.crossedAt}`}>
                  <td>{g.crossedAt ? new Date(g.crossedAt).toLocaleString('en-IN') : '—'}</td>
                  <td>{g.plazaKey}</td>
                  <td className="num">{inr(g.returnRateInr)}</td>
                  <td className="num">{inr(g.paidInr)}</td>
                  <td className="num tolls-warn">{inr(g.gapInr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="tolls-subblock">
        <h3 className="tolls-h3">Every detected pass, by trip and plaza</h3>
        <table className="tolls-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Plaza</th>
              <th className="num">Passes</th>
              <th className="num">Our estimate</th>
              <th className="num">Driver paid</th>
              <th className="num">Difference</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const c = reconciliationCell(r);
              return (
                <tr key={`${r.tripId}-${r.plazaKey}`}>
                  <td>{r.firstAt ? new Date(r.firstAt).toLocaleString('en-IN') : '—'}</td>
                  <td>{r.plazaKey || '—'}</td>
                  <td className="num">
                    {r.estimatedPasses}
                    {r.unpricedPasses ? <span className="tolls-flag">{r.unpricedPasses} unpriced</span> : null}
                  </td>
                  <td className="num">{c.estimate}</td>
                  <td className="num">{c.paid ?? <span className="tolls-muted">no bill yet</span>}</td>
                  <td className={`num ${c.deltaInr ? 'tolls-warn' : ''}`}>{c.delta ?? '—'}</td>
                  <td className={r.unreconciledEstimate ? 'tolls-warn' : 'tolls-ok'}>{c.state}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}