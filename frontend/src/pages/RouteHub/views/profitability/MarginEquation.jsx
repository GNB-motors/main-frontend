import Ico from '../../routeHubIcons.jsx';
import { Skel } from '../../routeHubShared.jsx';
import { inrK } from '../../routeHubFormat';

export default function MarginEquation({ first, totals }) {
  return (
    <div className="card">
      <div className="card-head">
        <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
          <Ico n="layers" />
        </span>
        <h3>How margin is calculated</h3>
        <span className="hint">Last 30 days · all routes</span>
      </div>
      <div className="equation">
        <div className="eqbox" style={{ '--c': 'var(--nova-rage-600)' }}>
          <div className="h">
            <Ico n="ledger" s={16} />
            Commercial revenue (ERP)
          </div>
          <div className="v">
            {first ? (
              <Skel w={96} h={24} />
            ) : totals.revenueInr != null ? (
              inrK(totals.revenueInr)
            ) : (
              '—'
            )}
          </div>
          <div className="d">
            Contracted freight rates, billed invoices, detention charges and loading manifests.
          </div>
        </div>
        <span className="op">−</span>
        <div className="eqbox" style={{ '--c': '#C56200' }}>
          <div className="h">
            <Ico n="fuel" s={16} />
            Telematics &amp; direct cost
          </div>
          <div className="v">
            {first ? <Skel w={96} h={24} /> : totals.costInr != null ? inrK(totals.costInr) : '—'}
          </div>
          <div className="d">
            GPS odometer km, diesel refuels, AdBlue top-ups, Fastag toll debits and trip allowances.
          </div>
        </div>
        <span className="op">=</span>
        <div className="eqbox res" style={{ '--c': '#187A32' }}>
          <div className="h">
            <Ico n="trend" s={16} />
            Net margin per route
          </div>
          <div className="v" style={{ color: '#187A32' }}>
            {first ? <Skel w={120} h={24} /> : null}
            {first ? null : totals.marginInr != null ? inrK(totals.marginInr) : '—'}
            {totals.marginPct != null ? (
              <span style={{ fontSize: 'var(--type-s)' }}>
                {' '}
                · {Number(totals.marginPct).toFixed(1)}%
              </span>
            ) : null}
          </div>
          <div className="d">
            Routes ranked by earnings, with unbilled km, diesel siphoning and rate undercutting
            flagged.
          </div>
        </div>
      </div>
    </div>
  );
}
