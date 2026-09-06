import { Paperclip, Trash2 } from 'lucide-react';

/**
 * Cell components for the service-intelligence records table. Kept separate
 * from serviceIntelligenceColumns.jsx because that module exports a plain
 * function; react-refresh requires a file to export components OR
 * non-components, never both (rule 15).
 */

export const VehicleCell = ({ row, onOpenVehicle }) => {
  const veh = row.vehicleId && typeof row.vehicleId === 'object' ? row.vehicleId : null;
  return (
    <div>
      {veh ? (
        <button
          type="button"
          onClick={() => onOpenVehicle(veh)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#0f172a',
            fontWeight: 700,
            textAlign: 'left',
          }}
        >
          {veh.registrationNumber}
        </button>
      ) : (
        <span style={{ color: '#94a3b8' }}>—</span>
      )}
      {veh?.model && <div style={{ fontSize: 11, color: '#94a3b8' }}>{veh.model}</div>}
    </div>
  );
};

export const NotesCell = ({ text }) =>
  text ? (
    <span title={text} style={{ color: '#475569' }}>
      {text.length > 60 ? `${text.slice(0, 60)}…` : text}
    </span>
  ) : (
    '—'
  );

export const FilesCell = ({ attachments }) =>
  Array.isArray(attachments) && attachments.length > 0 ? (
    <a
      href={attachments[0].publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: '#2563eb',
        textDecoration: 'none',
      }}
    >
      <Paperclip size={13} />
      {attachments.length}
    </a>
  ) : (
    <span style={{ color: '#cbd5e1' }}>—</span>
  );

export const ActionsCell = ({ onDelete }) => (
  <button
    type="button"
    onClick={onDelete}
    title="Delete entry"
    style={{
      background: '#fff',
      border: '1px solid #fecaca',
      color: '#b91c1c',
      borderRadius: 8,
      padding: '6px 8px',
      cursor: 'pointer',
    }}
  >
    <Trash2 size={14} />
  </button>
);
