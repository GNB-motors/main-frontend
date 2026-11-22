import React from 'react';
import { formatInrCompact } from '../../../utils/formatters';
import CcIcon from '../commandCenterIcons';
import { STAGES } from '../commandCenterStages';
import { plural } from '../commandCenterFormat';

/**
 * The operational pipeline, stage by stage.
 *
 * When the pipeline has not been loaded, every stage says "—" and "not checked".
 * A pipeline that was never fetched must not read as an empty pipeline.
 */
function Rail({ pipeline, cur, onPick }) {
  const known = Array.isArray(pipeline);
  const byKey = Object.fromEntries((pipeline || []).map((s) => [s.key, s]));
  const lates = STAGES.map((s) => byKey[s.k]?.late || 0);
  const worst = Math.max(0, ...lates);
  const bnIdx = worst > 0 ? lates.indexOf(worst) : -1;
  const trips = STAGES.filter((s) => s.k !== 'do').reduce(
    (n, s) => n + (byKey[s.k]?.count || 0),
    0,
  );
  const freightValues = STAGES.map((s) => byKey[s.k]?.freight ?? null);
  const freight = freightValues.reduce((n, v) => n + (v ?? 0), 0);
  // Money nobody reported is unknown, not zero rupees.
  const freightKnown = freightValues.some((v) => v != null);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Operational pipeline</h2>
        <span className="hint">Click a stage to open its queue</span>
        <span className="sp" />
        <span className="hint">
          {known ? (
            <>
              {plural(trips, 'trip')} · {plural(byKey.do?.count || 0, 'DO')} in pipeline ·{' '}
              {freightKnown ? `${formatInrCompact(freight)} freight` : 'freight not checked'}
            </>
          ) : (
            'not checked'
          )}
        </span>
      </div>
      <div className="railwrap">
        <div className="rail">
          {STAGES.map((s, i) => {
            const st = byKey[s.k] || { count: 0, freight: 0, late: 0, limitDays: 0 };
            return (
              <button
                type="button"
                key={s.k}
                className="stage"
                aria-pressed={s.k === cur}
                style={{ '--i': i }}
                onClick={() => onPick(s.k)}
              >
                {i === bnIdx && <span className="bn">Bottleneck</span>}
                <span className="n">{s.l}</span>
                <span className="c">{known ? st.count : '—'}</span>
                <span className="v">
                  {known && st.count && st.freight
                    ? `${formatInrCompact(st.freight)} freight`
                    : '—'}
                </span>
                <span
                  className={`late ${known && st.late ? '' : known ? 'ok' : ''}`}
                  style={known ? undefined : { color: 'var(--fg-secondary)' }}
                >
                  {!known ? (
                    <>not checked</>
                  ) : st.late ? (
                    <>
                      <CcIcon n="alert" s={11} />
                      {st.late} past {st.limitDays}d limit
                    </>
                  ) : (
                    <>
                      <CcIcon n="check" s={11} />
                      On time
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Rail;
