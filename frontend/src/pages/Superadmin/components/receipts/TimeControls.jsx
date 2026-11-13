import { predictedTimeText } from './predictedTime';

/**
 * The two buttons that settle the time of a fill: take the suggestion, or
 * write another one. The typing is kept in the drawer, so folding the
 * section away never throws it away.
 */
const TimeControls = ({ draft, onSetTime, timeBusy, timeEdit, setTimeEdit }) => {
  const predicted = draft?.time?.predicted || null;
  const person = draft?.time?.person || null;
  const text = predictedTimeText(predicted);
  if (!text || person?.at) return null;

  const editing = timeEdit.editing;
  const typed = timeEdit.typed;

  return (
    <div className="ra-predicted__actions">
      {editing ? (
        <>
          <input
            type="datetime-local"
            value={typed}
            aria-label="Time of the fill"
            onChange={(event) => setTimeEdit({ editing: true, typed: event.target.value })}
          />
          <button
            type="button"
            className="ra-btn ra-btn--publish"
            disabled={!typed || timeBusy}
            onClick={() => {
              const at = new Date(typed);
              if (Number.isNaN(at.getTime())) return;
              setTimeEdit({ editing: false, typed });
              onSetTime?.('set', at.toISOString());
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="ra-btn ra-btn--clear"
            onClick={() => setTimeEdit({ editing: false, typed })}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="ra-btn ra-btn--publish"
            disabled={timeBusy}
            onClick={() => onSetTime?.('accept')}
          >
            Use suggested time
          </button>
          <button
            type="button"
            className="ra-btn ra-btn--clear"
            disabled={timeBusy}
            onClick={() => setTimeEdit({ editing: true, typed: timeEdit.typed })}
          >
            Set time
          </button>
        </>
      )}
    </div>
  );
};

export default TimeControls;
