/**
 * The commercial lifecycle, compressed for the row indicator.
 *
 * Mirrors erpTrip.constants.js: Advance and CN run in parallel, but only the CN
 * gate moves the trip to DISPATCHED — advance settlement never blocks dispatch
 * or close. So the *blocking* spine is DO → Placed → CN → Close → POD → Unload
 * → Bill → Paid, and advance is deliberately not a segment here.
 */
const LIFECYCLE = ['DO', 'Placed', 'CN', 'Close', 'POD', 'Unload', 'Bill', 'Paid'];

/** Index of the stage the trip is *waiting on*. -1 = cancelled. */
const stageIndex = (state) => {
  switch (state) {
    case 'CANCELLED':
      return -1;
    case 'PLANNED':
      return 1;
    case 'PLACED':
    case 'ADVANCE_PENDING':
    case 'ADVANCE_PAID':
    case 'CN_PENDING':
      return 2;
    case 'CN_UPDATED':
    case 'DISPATCHED':
      return 3;
    case 'TRIP_CLOSED':
      return 4;
    case 'POD_RECEIVED':
      return 5;
    case 'UNLOADED':
      return 6;
    case 'BILLED':
      return 7;
    default:
      return 1;
  }
};

const MiniLifecycle = ({ state }) => {
  const idx = stageIndex(state);
  return (
    <span className="trippipe-mini" title={idx < 0 ? 'Cancelled' : `Waiting on ${LIFECYCLE[idx]}`}>
      <span className="trippipe-mini-segs">
        {LIFECYCLE.map((label, i) => (
          <span
            key={label}
            className={`trippipe-mini-seg ${
              idx < 0 ? 'cancelled' : i < idx ? 'done' : i === idx ? 'current' : ''
            }`}
          />
        ))}
      </span>
      {/* Eight dots alone do not say how far along a trip is. */}
      <span className="trippipe-mini-count">
        {idx < 0 ? 'cancelled' : `${idx} / ${LIFECYCLE.length}`}
      </span>
    </span>
  );
};

export default MiniLifecycle;
