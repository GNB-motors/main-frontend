import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { needsReviewLabel, supersededTripsHref } from './tripLineage';
import { checkFlagsOf, flagLabel, flagReason, staleDetail } from './tripFlags';

/**
 * The note a trip's status can carry: that a newer trip replaced this one, and why the
 * server left it open.
 */
export default function TripStatusNotes({ trip }) {
  const replaced = trip?.status === 'SUPERSEDED';
  const href = replaced ? supersededTripsHref(trip) : null;
  const detail = staleDetail(trip);
  if (!replaced && !detail) return null;
  return (
    <>
      {replaced ? (
        <div className="atx-banner atx-banner--warn" role="status">
          <div className="atx-banner-row">
            <div className="atx-banner-msg">
              <TriangleAlert size={18} strokeWidth={2} aria-hidden="true" />
              <p>
                <strong>This trip was replaced by a newer trip.</strong>{' '}
                {href ? (
                  <>
                    See this truck&apos;s trips around that time:{' '}
                    <Link className="atx-link" to={href}>
                      open the trip list
                    </Link>
                  </>
                ) : (
                  'The newer trip is the one to read.'
                )}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {detail ? <p className="atx-cov-note">Reason: {detail}</p> : null}
    </>
  );
}

/** The reason a trip needs a second look, as a chip beside the status. */
export function NeedsReviewChip({ trip }) {
  const review = needsReviewLabel(trip);
  if (!review) return null;
  return <span className="atx-chip atx-chip--watch">{review}</span>;
}

/** The trip's checks, as chips with the server's own reason in the tooltip. */
export function TripFlagChips({ trip }) {
  return (
    <>
      {checkFlagsOf(trip).map((f) => (
        <span key={f} className="atx-chip atx-chip--watch" title={flagReason(trip, f)}>
          {flagLabel(f)}
        </span>
      ))}
      <NeedsReviewChip trip={trip} />
    </>
  );
}
