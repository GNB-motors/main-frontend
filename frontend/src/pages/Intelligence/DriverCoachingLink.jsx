import { useId } from 'react';
import { Link } from 'react-router-dom';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext.jsx';
import { coachingWindowLabel, driverCoachingUrl } from './driverCoaching';
import './driverCoaching.css';

/**
 * DriverCoachingLink — the one way from an observation to the coaching talk.
 *
 * The link says where it goes ("Open driver coaching"), carries the selected
 * window in words next to it, and is a real link, so the keyboard reaches it.
 * It carries only what the screen knows: no driver id and no date are ever
 * invented.
 *
 * When the coaching home is not switched on for this account, the link is
 * replaced by the reason — never by a link that cannot work.
 */
export default function DriverCoachingLink({
  driverId = '',
  driverName = '',
  from = '',
  to = '',
  label = 'Open driver coaching',
  unavailableReason = null,
  className = '',
}) {
  const { isEnabled, ready } = useFeatureFlags();
  const windowId = useId();
  const windowLabel = coachingWindowLabel(from, to);
  const blocked =
    unavailableReason ||
    (ready && !isEnabled('performanceSection')
      ? 'This section is not available for your account'
      : '');

  if (blocked) {
    return <span className={`intel-coaching-note ${className}`}>{blocked}</span>;
  }

  return (
    <span className={`intel-coaching ${className}`}>
      <Link
        className="intel-coaching-link"
        to={driverCoachingUrl({ driverId, driverName, from, to })}
        aria-describedby={windowLabel ? windowId : undefined}
      >
        {label}
      </Link>
      {windowLabel ? (
        <span className="intel-coaching-period" id={windowId}>
          {windowLabel}
        </span>
      ) : null}
    </span>
  );
}
