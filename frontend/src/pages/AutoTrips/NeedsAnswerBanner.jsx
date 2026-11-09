import InfoTip from '../../components/redesign/InfoTip';
import { formatNum } from '../../utils/formatters';
import { needReasons, placeQueue } from './tripListModel';

/**
 * "Needs your answer", explained once for the whole list instead of once per row:
 * why the trips are waiting (split on the latest waiting trips, because the API
 * counts statuses, not reasons) and the one answer that closes most of them in
 * bulk — naming the places trucks stop at after loading.
 */
export default function NeedsAnswerBanner({
  total,
  sample,
  sampleLoading,
  questions,
  questionsTotal,
  questionsTrips,
  questionsLoading = false,
  questionsFailed,
  onAnswerPlaces,
  onAnswerAllPlaces = null,
  closingAll = null,
  onShowTrips,
}) {
  if (!total) return null;
  const reasons = needReasons(sample);
  const measured = Array.isArray(sample) ? sample.length : 0;
  const queue = placeQueue(questions);
  const places = Math.max(queue.places, Number(questionsTotal) || 0);
  const affected = questionsTrips ?? queue.trips;
  const rest = Math.max(0, total - affected);

  return (
    <section className="atx-needs" aria-labelledby="atx-needs-title">
      <div className="atx-needs-main">
        <h2 id="atx-needs-title" className="atx-needs-title">
          <span className="atx-kpi-dot atx-kpi-dot--watch" aria-hidden="true" />
          {formatNum(total)} trips need your answer
        </h2>
        {measured ? (
          <>
            <ul className="atx-needs-reasons">
              {reasons.map((reason) => (
                <li key={reason.key} className={`atx-needs-reason atx-needs-reason--${reason.key}`}>
                  <span className="atx-needs-label">
                    {reason.label}
                    <InfoTip text={reason.why} label={`What "${reason.label}" means`} />
                  </span>
                  <span className="atx-needs-bar" aria-hidden="true">
                    <span style={{ width: `${(100 * reason.count) / measured}%` }} />
                  </span>
                  <span className="atx-needs-count">
                    {formatNum(reason.count)}
                    <span className="atx-needs-of"> of {formatNum(measured)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="atx-needs-basis">
              Split measured on the latest {formatNum(measured)} waiting trips in this period.
            </p>
          </>
        ) : (
          <p className="atx-needs-basis">
            {sampleLoading
              ? 'Reading why they are waiting…'
              : 'Why they are waiting could not be loaded.'}
          </p>
        )}
      </div>

      <div className="atx-needs-fix">
        <h3 className="atx-needs-fix-title">Close them in bulk</h3>
        {places > 0 ? (
          <p className="atx-needs-fix-text">
            <strong>{formatNum(places)} places</strong> trucks stop at after loading have no name.
            Naming them settles <strong>{formatNum(affected)} trips</strong> in this period
            {queue.top < queue.places
              ? `; the busiest ${queue.top} settle ${formatNum(queue.topTrips)}`
              : ''}
            . {rest > 0 ? `For the other ${formatNum(rest)}, open the trip and mark its drop.` : ''}
          </p>
        ) : (
          <p className="atx-needs-fix-text">
            {questionsLoading
              ? 'Loading place questions for this period…'
              : questionsFailed
                ? 'The place questions could not be loaded. Open a trip and mark its drop.'
                : 'No place is waiting for a name. Open a trip and mark its drop.'}
          </p>
        )}
        <div className="atx-needs-actions">
          {onAnswerAllPlaces && places > 0 ? (
            <button
              type="button"
              className="atx-btn atx-btn--primary"
              onClick={onAnswerAllPlaces}
              disabled={closingAll?.busy}
            >
              {closingAll?.busy
                ? `Closing ${formatNum(closingAll.done)} of ${formatNum(closingAll.total)}…`
                : 'Close all in bulk'}
            </button>
          ) : null}
          {places > 0 ? (
            <button type="button" className="atx-btn" onClick={onAnswerPlaces}>
              Answer place questions
            </button>
          ) : null}
          {onShowTrips ? (
            <button type="button" className="atx-btn" onClick={onShowTrips}>
              Show these trips
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
