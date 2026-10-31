import { navigationError, routeVersionOf, rowId, snapshotRoute } from './navigationHistory';

const time = (value) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'Time not recorded';

/** Shares the trip replay's actual trace; selected server snapshots form a separate layer. */
export default function NavigationHistoryPanel({ history, linkedToTrip = false }) {
  if (!history.enabled) return null;
  const { selected, versions } = history;
  const route = snapshotRoute(selected);
  return (
    <section
      className="card"
      aria-label="Planned navigation route"
      style={{ padding: 16, marginTop: 12 }}
    >
      <h3>Planned navigation route</h3>
      <p>
        {linkedToTrip && history.association === 'VEHICLE_WINDOW'
          ? 'No direct trip link is recorded. Showing sessions for this vehicle and time window.'
          : linkedToTrip
            ? 'Sessions linked to this trip.'
            : 'Sessions for this vehicle and replay window.'}{' '}
        Purple shows the selected plan; the replay shows recorded driving.
      </p>
      {history.error ? (
        <p role="alert">
          {navigationError(history.error)}{' '}
          <button type="button" onClick={history.retry}>
            Retry
          </button>
        </p>
      ) : history.loading ? (
        <p role="status">Loading navigation history…</p>
      ) : !history.sessions.length ? (
        <p>No recorded navigation session in this context.</p>
      ) : (
        <>
          <label>
            Navigation session{' '}
            <select
              value={history.sessionId}
              onChange={(event) => history.selectSession(event.target.value)}
            >
              {history.sessions.map((session) => (
                <option key={rowId(session)} value={rowId(session)}>
                  {time(session.startedAt ?? session.createdAt)} ·{' '}
                  {session.status ?? session.state ?? 'Status unknown'}
                </option>
              ))}
            </select>
          </label>{' '}
          {versions.length > 0 ? (
            <label>
              Route version{' '}
              <select
                value={routeVersionOf(selected) ?? ''}
                onChange={(event) => history.selectVersion(Number(event.target.value))}
              >
                {versions.map((version) => (
                  <option key={routeVersionOf(version)} value={routeVersionOf(version)}>
                    Version {routeVersionOf(version)} ·{' '}
                    {time(version.activatedAt ?? version.committedAt ?? version.createdAt)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>This session has no saved route version.</p>
          )}
          {selected && (
            <p>
              {route?.kind === 'OURS' || route?.routeKind === 'FLEET'
                ? 'Fleet route'
                : 'Truck route'}
              {' · '}
              {selected.reason || selected.changeReason || 'Selection reason not recorded'}
              {' · '}
              {route?.summary?.distanceM == null
                ? 'Distance unknown'
                : `${(route.summary.distanceM / 1000).toFixed(1)} km planned`}
            </p>
          )}
          {selected && !history.path.length && (
            <p>Saved geometry is unavailable or has gaps; no continuous planned line is drawn.</p>
          )}
          {history.nextCursor && (
            <p>
              Showing the most recent sessions. Narrow the replay window to inspect older sessions.
            </p>
          )}
        </>
      )}
    </section>
  );
}
