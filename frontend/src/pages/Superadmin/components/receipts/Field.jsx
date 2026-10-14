const Field = ({ label, value, full, highlight, mono }) => (
  <div
    className={`ra-field ${full ? 'ra-field--full' : ''} ${highlight ? 'ra-field--highlight' : ''}`}
  >
    <div className="ra-field__label">{label}</div>
    <div className={`ra-field__value ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
  </div>
);

export default Field;
