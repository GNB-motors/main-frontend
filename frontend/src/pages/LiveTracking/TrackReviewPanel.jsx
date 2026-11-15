import ReviewActions from '../PlaceHub/intelligence/ReviewActions.jsx';
import useSiteAnswer from '../PlaceHub/intelligence/useSiteAnswer.js';
import { canEditPlaces } from '../PlaceHub/model/placeHubConfig.js';
import { getUserRole } from '../../utils/session';
import { ArrowLeft, X, MapPin, ScanLine, CheckCircle2, CircleHelp } from 'lucide-react';

/**
 * TrackReviewPanel — the place panel for a place nobody has answered for.
 *
 * The answer itself is Place Hub's: the same "Yes, it's a fuel pump", the
 * same change-type chips, the same "not a real place". Only owners and
 * managers may answer.
 */
export default function TrackReviewPanel({
  site,
  onAnswered,
  onEditFence,
  onClose,
  backLabel = 'Back to places',
}) {
  const answer = useSiteAnswer(onAnswered);
  const canAnswer = canEditPlaces(getUserRole());

  if (!site) return null;

  return (
    <div
      className="railview railview--detail lt-place-review open"
      role="region"
      aria-live="polite"
      aria-label="Place confirmation"
      aria-busy={Boolean(answer.busyId)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && answer.busyId) event.preventDefault();
      }}
    >
      <div className="dtop">
        <button
          type="button"
          className="backbtn"
          onClick={onClose}
          disabled={Boolean(answer.busyId)}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </button>
        <button
          type="button"
          className="dclose"
          aria-label="Close place confirmation"
          onClick={onClose}
          disabled={Boolean(answer.busyId)}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="dbody">
        <section className="lt-place-summary">
          <div className="lt-place-heading">
            <span className="lt-place-symbol">
              <MapPin size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="lt-place-eyebrow">Place details</span>
              <h3>{site.name || 'Place to confirm'}</h3>
            </div>
          </div>
          <span className={`lt-place-status${site.status === 'CONFIRMED' ? ' is-confirmed' : ''}`}>
            {site.status === 'CONFIRMED' ? (
              <CheckCircle2 size={14} aria-hidden="true" />
            ) : (
              <CircleHelp size={14} aria-hidden="true" />
            )}
            {site.status === 'CONFIRMED'
              ? 'Confirmed place'
              : site.status === 'REJECTED'
                ? 'Not a real place'
                : 'Needs confirmation'}
          </span>
          {site.address?.formatted ? (
            <div className="lt-place-address">
              <span className="lt-place-eyebrow">Address</span>
              <p>
                {site.address.formatted.length > 180
                  ? `${site.address.formatted.slice(0, 180)}…`
                  : site.address.formatted}
              </p>
              {site.address.formatted.length > 180 ? (
                <details>
                  <summary>Show full address</summary>
                  <p>{site.address.formatted}</p>
                </details>
              ) : null}
            </div>
          ) : null}
          <p className="sr-only">
            {site.status === 'CONFIRMED'
              ? 'This place has been confirmed.'
              : site.status === 'REJECTED'
                ? 'This place was marked as not a real place.'
                : 'This place has not been confirmed yet.'}
          </p>
        </section>
        <section className="lt-place-classification" aria-label="Place type">
          {canAnswer ? (
            <ReviewActions key={site._id} site={site} answer={answer} />
          ) : (
            <p className="pi-note">Only owners and managers can answer for a place.</p>
          )}
        </section>
        {canAnswer ? (
          <section className="lt-place-boundary">
            <span className="lt-place-boundary-icon">
              <ScanLine size={20} aria-hidden="true" />
            </span>
            <div>
              <h4>Place boundary</h4>
              <p>Set the area trucks enter and leave.</p>
            </div>
            <button
              type="button"
              className="ph-btn ph-btn--sm"
              onClick={() => onEditFence?.(site)}
              disabled={Boolean(answer.busyId)}
            >
              Edit fence
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
