import EmptyState from '../../components/cluster/EmptyState';
import { agreementLine } from './tollsView';

/**
 * The plaza master — every plaza, what its gate is made of, and whether two
 * independent witnesses agree that it is there.
 *
 * The three columns that matter are the ones that used to be guessed: the gate
 * (which road edges a truck has to cross), the direction (which side of a divided
 * plaza the rate applies to), and the agreement (OpenStreetMap's booth and what
 * this fleet's own trucks did). A plaza with no resolved gate prices nothing, and
 * the row says so rather than showing a plausible number.
 */
export default function PlazaMasterTab({ plazas, onReview, busy }) {
  const rows = plazas || [];
  if (!rows.length) return null;

  const confirmed = rows.filter((p) => p.review === 'CONFIRMED').length;
  const priced = rows.filter((p) => (p.rateLines || 0) > 0).length;

  return (
    <div className="tolls-plazas">
      <p className="tolls-lede">
        {confirmed} of {rows.length} plazas are confirmed by OpenStreetMap and this fleet together.{' '}
        {priced} carry a rate card. The rest record every pass and leave the amount unknown — a toll we
        cannot price is still money.
      </p>
      <table className="tolls-table">
        <thead>
          <tr>
            <th>Plaza</th>
            <th>Gate</th>
            <th>Evidence</th>
            <th className="num">Rate lines</th>
            <th>Return rule</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const a = agreementLine(p);
            return (
              <tr key={p.code}>
                <td>
                  <div className="tolls-strong">{p.name || p.code}</div>
                  {p.highway ? <div className="tolls-sub">{p.highway}</div> : null}
                  <div className="tolls-sub">{p.code}</div>
                </td>
                <td>
                  <div className={p.gateState === 'RESOLVED' ? 'tolls-ok' : 'tolls-warn'}>{a.gate}</div>
                  {a.sides ? (
                    <div className="tolls-sub">
                      {p.gateEdgeCount} edge{p.gateEdgeCount === 1 ? '' : 's'} · side {a.sides}
                    </div>
                  ) : null}
                </td>
                <td>
                  <div>{a.agreement}</div>
                  {p.fleetEvidence && p.fleetEvidence.vehicles ? (
                    <div className="tolls-sub">
                      {p.fleetEvidence.vehicles} vehicle{p.fleetEvidence.vehicles === 1 ? '' : 's'} ·{' '}
                      {p.fleetEvidence.stopEvents} halt{p.fleetEvidence.stopEvents === 1 ? '' : 's'}
                    </div>
                  ) : null}
                </td>
                <td className="num">{p.rateLines || 0}</td>
                <td>
                  {p.returnRule ? (
                    <>
                      {p.returnRule.chargeRatio * 100}% within {p.returnRule.withinHours} h
                    </>
                  ) : (
                    <span className="tolls-muted">none on file</span>
                  )}
                </td>
                <td>
                  <div className={a.review === 'confirmed' ? 'tolls-ok' : a.review === 'rejected' ? 'tolls-bad' : 'tolls-warn'}>
                    {a.review}
                  </div>
                  {a.review !== 'confirmed' ? (
                    <button className="tolls-link" disabled={busy} onClick={() => onReview(p.code, 'CONFIRMED')}>
                      confirm
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length && rows.every((p) => !p.gateEdges || !p.gateEdges.length) ? (
        <EmptyState
          title="No plaza has a resolved gate yet"
          hint="A crossing is a membership test on the road network: the booth's point is asked of the routing engine and the directed road edges through it become the gate. Until a gate resolves, this table cannot say a truck passed anything, and every pass stays unknown rather than zero."
        />
      ) : null}
    </div>
  );
}