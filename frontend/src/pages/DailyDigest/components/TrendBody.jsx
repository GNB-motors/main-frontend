import trendModel from '../trendModel';
import { PARTIAL_LABEL } from '../../../utils/measured.js';
import { DASH } from '../ownerReportModel';

/** The Trend card's body, in the same rows and foot lines as the other report cards. */
export default function TrendBody({ numbers, day, pending }) {
  const { known, unknown, partial, pendingNote, basis } = trendModel(numbers, { day, pending });
  return (
    <>
      {known.length ? (
        <dl className="db-kv">
          {known.map((row) => (
            <div key={row.key}>
              <dt>{row.label}</dt>
              <dd className={row.tone ? `db-kv-${row.tone}` : undefined}>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {unknown.length ? (
        <p className="db-foot-line">
          {DASH} Not available yet: {unknown.join(', ')}
        </p>
      ) : null}
      {partial ? (
        <p className="db-foot-line">
          <span className="db-badge">{PARTIAL_LABEL}</span> Usual km leaves out days whose distance
          is not recorded yet.
        </p>
      ) : null}
      {pendingNote ? <p className="db-foot-line">{pendingNote}</p> : null}
      {basis ? <p className="db-foot-line">{basis}</p> : null}
    </>
  );
}
