import { MapPin } from 'lucide-react';
import { formatNum } from '../../utils/formatters';
import { placeQueue } from './tripListModel';

export default function NeedsAnswerBanner({
  total,
  questions,
  questionsTotal,
  questionsTrips,
  questionsLoading = false,
  questionsFailed,
  onAnswerPlaces,
  onShowTrips,
  showingTrips = false,
}) {
  if (!total) return null;
  const queue = placeQueue(questions);
  const places = Math.max(queue.places, Number(questionsTotal) || 0);
  const affected = questionsTrips ?? queue.trips;
  return (
    <section className="atx-place-review-banner" aria-labelledby="atx-needs-title">
      <span className="atx-place-review-banner-icon">
        <MapPin size={20} aria-hidden="true" />
      </span>
      <div className="atx-place-review-banner-copy" aria-busy={questionsLoading}>
        {questionsLoading ? (
          <div
            className="atx-place-banner-skeleton"
            role="status"
            aria-label="Loading place summary"
          >
            <span className="atx-skel" />
            <span className="atx-skel" />
          </div>
        ) : (
          <>
            <h2 id="atx-needs-title">
              {places > 0
                ? `${formatNum(places)} ${places === 1 ? 'place needs' : 'places need'} review`
                : `${formatNum(total)} trips need your answer`}
            </h2>
            <p>
              {questionsLoading ? (
                'Loading stops that need review…'
              ) : questionsFailed ? (
                'Places could not be loaded. Open the affected trips to review their drops.'
              ) : places > 0 ? (
                <>
                  <strong>{formatNum(affected)} trips</strong> are linked to these stops in this
                  period. Confirm each place’s name and type to help update matching trips.
                </>
              ) : (
                'Open the affected trips to check their delivery locations.'
              )}
            </p>
          </>
        )}
      </div>
      <div className="atx-place-review-banner-actions">
        {places > 0 && !questionsLoading && !questionsFailed ? (
          <button type="button" className="atx-btn atx-btn--primary" onClick={onAnswerPlaces}>
            Review places
          </button>
        ) : null}
        {onShowTrips ? (
          <button
            type="button"
            className="atx-btn"
            onClick={onShowTrips}
            aria-pressed={showingTrips}
          >
            {showingTrips ? 'Show all trips' : 'View affected trips'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
