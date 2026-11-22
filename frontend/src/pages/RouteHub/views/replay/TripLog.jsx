import { Skel } from '../../routeHubShared.jsx';
import { fmtT } from '../../routeHubFormat';
import { EVC } from './replayConstants.js';
import { isNoMovement, NO_MOVEMENT } from './replayMovement.js';

export default function TripLog({ trip, error, loading, setPlaying, setT }) {
  // A vehicle that reported its position all day and never moved is a real
  // answer. The log says so in words, and the events below it stay usable.
  const still = isNoMovement(trip);
  return (
    <aside className="log">
      <div className="lh">
        <span className="eyebrow" style={{ flex: 1 }}>
          Trip log
        </span>
        <span className="count-pill">{trip?.events?.length || 0}</span>
      </div>
      <div className="lb">
        {error ? (
          <div className="empty">
            <b>No replay</b>
            <span>{error}</span>
          </div>
        ) : loading && !trip ? (
          Array.from({ length: 7 }, (_, i) => (
            <div className="lev lev--skel" key={i} aria-hidden="true">
              <Skel w={10} h={10} r={999} />
              <span style={{ display: 'grid', gap: 6 }}>
                <Skel w={['70%', '55%', '62%', '48%'][i % 4]} h={11} />
                <Skel w={['45%', '38%', '52%'][i % 3]} h={9} />
              </span>
              <Skel w={38} h={10} />
            </div>
          ))
        ) : (
          <>
            {still ? (
              <p className="log-note">
                {NO_MOVEMENT} — the vehicle kept reporting its position but did not travel.
              </p>
            ) : null}
            {(trip?.events || []).map((e, i) => (
              <button
                type="button"
                className="lev"
                key={`${e.type}-${i}`}
                onClick={() => {
                  setPlaying(false);
                  setT(e.t);
                }}
              >
                <span className="d" style={{ background: EVC[e.type] }} />
                <span>
                  <div className="tt">{e.title}</div>
                  <div className="ss">{e.sub}</div>
                </span>
                <span className="tm">{fmtT(e.at)}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
