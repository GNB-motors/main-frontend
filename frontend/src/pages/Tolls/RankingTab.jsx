import EmptyState from '../../components/cluster/EmptyState';
import { extraVsLane, inr } from './tollsView';

/**
 * Per-driver toll spend, and what it costs against the lane's normal.
 *
 * The "normal" is the median toll per trip of everyone who ran that same lane in
 * the window. When a driver is the only one on a lane there is no normal, and the
 * cell says exactly that — a rank that ranks nothing is a decoration, and
 * comparing a driver to themselves and calling the difference zero is the kind of
 * number that looks like an answer.
 */
export default function RankingTab({ ranking }) {
  const rows = (ranking && ranking.drivers) || [];
  if (!rows.length) {
    return (
      <EmptyState
        title="No driver tolls in this window"
        hint="Drivers appear here once a trip with tolls has been attributed to them through the assignment interval covering the crossing. The extra against the lane's normal needs more than one driver on the lane before it can mean anything, so it stays empty rather than being filled with zeros."
      />
    );
  }

  return (
    <table className="tolls-table">
      <thead>
        <tr>
          <th>Driver</th>
          <th className="num">Trips</th>
          <th className="num">Toll spend</th>
          <th className="num">Per trip</th>
          <th className="num">Lanes</th>
          <th>Against the lane&rsquo;s normal</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => {
          const extra = extraVsLane(d);
          return (
            <tr key={d.driverId || 'none'}>
              <td>{d.driverId ? d.driverId : 'unattributed'}</td>
              <td className="num">{d.trips}</td>
              <td className="num">
                {inr(d.tollInr)}
                {!d.complete ? <span className="tolls-flag">lower bound</span> : null}
              </td>
              <td className="num">{inr(d.tollPerTripInr)}</td>
              <td className="num">
                {d.lanes}
                {d.lanesWithANormal ? <span className="tolls-sub"> {d.lanesWithANormal} comparable</span> : null}
              </td>
              <td className={extra.tone === 'warn' ? 'tolls-warn' : extra.tone === 'muted' ? 'tolls-muted' : 'tolls-ok'}>
                {extra.text}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}