import { Input } from '../../components/ui/input';
import PickSelect from './PickSelect';
import usePlaceSuggestions from './usePlaceSuggestions';
import { confidenceBadge, rankReason, toPickOptions } from './placeSuggestions';

/**
 * A saved place, or — while none is picked — a typed name right under it.
 *
 * The options come from the ranked suggestions endpoint, not from the
 * alphabetical list `places` carries: whatever the scheduler types is the
 * first ranking tier, then how near the map viewport they are looking, then
 * how busy each place is. `places` is only the fallback for when that endpoint
 * is unreachable (the Place Intelligence flag off, an older backend).
 *
 * A low-confidence place — one whose stoppages mostly fall outside its own
 * fence — is hidden unless `showLowConfidence` is set, matching the server
 * default.
 */
export default function PlacePick({
  label,
  siteId,
  onSite,
  name,
  onName,
  places = [],
  noneLabel,
  namePlaceholder = 'Or type the place name',
  role = null,
  viewport = null,
  showLowConfidence = false,
  enabled = true,
}) {
  const typed = siteId ? '' : (name || '');
  const { suggestions, loading, error } = usePlaceSuggestions({
    enabled,
    q: typed,
    role,
    viewport,
    includeLowConfidence: showLowConfidence,
  });

  // Ranked suggestions win; the unranked list is only there for when the
  // suggestions call failed, so the field is never empty for no reason.
  const options = suggestions.length
    ? toPickOptions(suggestions)
    : toPickOptions(places);
  const picked = options.find((o) => o.id === siteId);
  const badge = confidenceBadge(picked ? suggestions.find((s) => s.id === siteId) : null);

  return (
    <div className="atx-field atx-place-pick">
      <PickSelect
        label={label}
        value={siteId}
        onChange={onSite}
        options={options}
        noneLabel={noneLabel}
        disabled={loading && !options.length}
      />
      {picked && badge && (
        <p className={`atx-place-confidence atx-place-confidence--${badge.tone}`}>
          <strong>{badge.label}</strong>
          {badge.tone !== 'unknown' && (
            <span className="atx-place-confidence__why"> · {rankReason(picked, { typed })}</span>
          )}
          <span className="atx-place-confidence__detail">{badge.detail}</span>
        </p>
      )}
      {!siteId && (
        <>
          <Input
            aria-label={`${label} — place name`}
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder={namePlaceholder}
          />
          {error && (
            <p className="atx-place-confidence atx-place-confidence--unknown">
              Showing every saved place — ranked suggestions are unavailable right now.
            </p>
          )}
        </>
      )}
    </div>
  );
}