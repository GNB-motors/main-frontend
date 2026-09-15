import { AlertTriangle, CheckCircle2, Clock, Minus } from 'lucide-react';

export const AlertCell = ({ alert }) => {
  const status = alert?.status;
  const reasons = alert?.reasons || [];

  if (status === 'PENDING') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: '#C56200',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
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
        title={reasons.join('\n')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: '#b91c1c',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'help',
        }}
      >
        <AlertTriangle size={13} /> {reasons.length > 1 ? `${reasons.length} flags` : 'Flagged'}
      </span>
    );
  }

  if (status === 'OK') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: '#187A32',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
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
