import ReviewActions from '../PlaceHub/intelligence/ReviewActions.jsx';
import useSiteAnswer from '../PlaceHub/intelligence/useSiteAnswer.js';
import { canEditPlaces } from '../PlaceHub/model/placeHubConfig.js';
import { getUserRole } from '../../utils/session';

/**
 * TrackReviewPanel — the place panel for a place nobody has answered for.
 *
 * The answer itself is Place Hub's: the same "Yes, it's a fuel pump", the
 * same change-type chips, the same "not a real place". Only owners and
 * managers may answer.
 */
export default function TrackReviewPanel({ site, onAnswered, onEditFence, onClose }) {
  const answer = useSiteAnswer(onAnswered);
  const canAnswer = canEditPlaces(getUserRole());

  if (!site) return null;

  return (
    <div className="railview railview--detail open" aria-live="polite">
      <div className="dtop">
        <button type="button" className="backbtn" onClick={onClose}>
          Places
        </button>
      </div>
      <div className="dbody">
        <section className="sec">
          <h3 className="m-0 text-[14px] font-semibold text-[var(--rd-ink)]">
            {site.name || 'Place to confirm'}
          </h3>
          {site.address?.formatted ? (
            <p className="m-0 mt-1 text-[12px] text-[var(--rd-ink-3)]">{site.address.formatted}</p>
          ) : null}
          <p className="m-0 mt-1 text-[12px] text-[var(--rd-ink-3)]">
            This place has not been confirmed yet.
          </p>

          {canAnswer ? (
            <ReviewActions key={site._id} site={site} answer={answer} />
          ) : (
            <p className="pi-note">Only owners and managers can answer for a place.</p>
          )}

          {canAnswer ? (
            <div className="ph-btn-row mt-2">
              <button type="button" className="ph-btn ph-btn--sm" onClick={() => onEditFence?.(site)}>
                Edit fence
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
