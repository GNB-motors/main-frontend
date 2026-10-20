const dateTimeLabel = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'an unknown time';

const PlannedStartField = ({ form, setField, turnaround }) => (
  <div className="erp-field full">
    <label htmlFor="pl-planned-start">Planned start</label>
    <input
      id="pl-planned-start"
      aria-label="Planned start"
      type="datetime-local"
      value={form.plannedStart || ''}
      onChange={(e) => setField('plannedStart', e.target.value)}
    />
    <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 4 }}>
      <button
        type="button"
        id="btn-planned-start-now"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          setField('plannedStart', now.toISOString().slice(0, 16));
        }}
      >
        Set to now
      </button>
      <button
        type="button"
        id="btn-planned-start-later"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          const d = new Date(Date.now() + 3 * 3600 * 1000);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          setField('plannedStart', d.toISOString().slice(0, 16));
        }}
      >
        +3 hours later
      </button>
      <button
        type="button"
        id="btn-planned-start-earlier"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          const d = new Date(Date.now() - 3 * 3600 * 1000);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          setField('plannedStart', d.toISOString().slice(0, 16));
        }}
      >
        -3 hours earlier
      </button>
    </div>
    <span className="erp-field-hint">
      {turnaround
        ? `This tanker frees up around ${dateTimeLabel(turnaround.reason?.expectedFreeAt)}. Push the start later to clear the ${turnaround.reason?.limitHours}h turnaround.`
        : 'Leave blank to start as soon as the tanker is free.'}
    </span>
  </div>
);

export default PlannedStartField;
