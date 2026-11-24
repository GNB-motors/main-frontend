import trendModel from '../trendModel';
import { PARTIAL_LABEL } from '../../../utils/measured.js';
import { DASH } from '../ownerReportModel';

/** The Trend card's body, in the same rows and foot lines as the other report cards. */
export default function TrendBody({ numbers, day, pending }) {
  const { known, unknown, partial, pendingNote, basis, comparisons, weekdayLabel } = trendModel(
    numbers,
    { day, pending },
  );
  const changes = known.filter((row) => row.key.endsWith('Change'));
  return (
    <>
      {comparisons.map(({ title, today, week, weekday, unit }) => {
        const rows = [
          [pending ? 'Today so far' : 'Selected day', today],
          ['Previous 7-day average', week],
          [weekdayLabel, weekday],
        ].filter(([, value]) => value != null && value >= 0);
        if (!rows.length) return null;
        const max = Math.max(1, ...rows.map(([, value]) => value));
        return (
          <figure key={title} className="db-trend-bars" aria-label={title}>
            <figcaption>{title}</figcaption>
            <ul>
              {rows.map(([label, value]) => (
                <li key={label}>
                  <span>{label}</span>
                  <strong>
                    {value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} {unit}
                  </strong>
                  <i aria-hidden="true">
                    <b style={{ width: `${(100 * value) / max}%` }} />
                  </i>
                </li>
              ))}
            </ul>
          </figure>
        );
      })}
      {changes.length ? (
        <dl className="db-kv">
          {changes.map((row) => (
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
