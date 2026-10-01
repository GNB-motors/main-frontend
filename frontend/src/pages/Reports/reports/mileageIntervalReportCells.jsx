import { AlertTriangle, CheckCircle2, Clock, FileQuestion, Minus } from 'lucide-react';

const chip = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  color,
  fontSize: 12,
  fontWeight: 500,
});

export const AlertCell = ({ alert }) => {
  const status = alert?.status;
  const reasons = alert?.reasons || [];
  const dataQuality = alert?.dataQuality || [];

  if (status === 'PENDING') {
    return (
      <span style={chip('#C56200')}>
        <Clock size={13} /> Pending
      </span>
    );
  }

  if (status === 'NO_GPS') {
    return <span style={{ color: '#9ca3af', fontSize: 12 }}>No GPS</span>;
  }

  if (status === 'FLAGGED') {
    return (
      <span
        title={[...reasons, ...dataQuality].join('\n')}
        style={{ ...chip('#b91c1c'), cursor: 'help' }}
      >
        <AlertTriangle size={13} /> {reasons.length > 1 ? `${reasons.length} flags` : 'Flagged'}
      </span>
    );
  }

  // Odometer/OCR reading problems only — the entry needs checking, but nothing
  // says fuel or distance is suspicious.
  if (status === 'DATA_QUALITY') {
    return (
      <span title={dataQuality.join('\n')} style={{ ...chip('#6b7280'), cursor: 'help' }}>
        <FileQuestion size={13} /> Check data
      </span>
    );
  }

  if (status === 'OK') {
    return (
      <span style={chip('#187A32')}>
        <CheckCircle2 size={13} /> OK
      </span>
    );
  }

  return (
    <span style={{ color: '#9ca3af' }}>
      <Minus size={13} />
    </span>
  );
};

const QUALITY_NOTE = {
  INCOMPLETE: 'No distance or fuel recorded — left out of averages',
  IMPLAUSIBLE_KMPL: 'Impossible km/L, usually a mistyped odometer — left out of averages',
};

/** km/L for a cycle; cycles the averages ignore are shown muted with the reason. */
export const MileageCell = ({ value, quality }) => {
  const note = QUALITY_NOTE[quality];
  if (note) {
    return (
      <div title={note} style={{ cursor: 'help' }}>
        <div className="cell-primary" style={{ color: '#9ca3af', textDecoration: 'line-through' }}>
          {typeof value === 'number' ? value.toFixed(2) : '—'}
        </div>
        <div className="cell-secondary">excluded</div>
      </div>
    );
  }
  return (
    <div
      className="cell-primary"
      style={typeof value === 'number' ? { color: '#2563eb', fontWeight: 600 } : undefined}
    >
      {typeof value === 'number' ? value.toFixed(2) : '—'}
    </div>
  );
};
