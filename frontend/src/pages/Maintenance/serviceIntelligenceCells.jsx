import React from 'react';
import {
  Paperclip,
  Trash2,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Wrench,
  Check,
} from 'lucide-react';
import {
  classifyIssuePriority,
  isRecordResolved,
  getResolutionDetails,
} from './serviceIntelligenceLogic';

/**
 * Cell components for the service-intelligence records table.
 */

export const VehicleCell = ({ row, onOpenVehicle }) => {
  const veh = row.vehicleId && typeof row.vehicleId === 'object' ? row.vehicleId : null;
  return (
    <div className="si-vehicle-cell">
      {veh ? (
        <button
          type="button"
          onClick={() => onOpenVehicle(veh)}
          className="si-veh-reg-btn"
          title={`View vehicle details for ${veh.registrationNumber}`}
        >
          <span className="si-veh-reg-ind">IND</span>
          <span className="si-veh-reg-num">{veh.registrationNumber}</span>
        </button>
      ) : (
        <span style={{ color: '#94a3b8' }}>—</span>
      )}
      {veh?.model && <div className="si-veh-model-sub">{veh.model}</div>}
    </div>
  );
};

export const PriorityCell = ({ row }) => {
  const priority = classifyIssuePriority(row);

  const getIcon = () => {
    switch (priority.code) {
      case 'P0':
        return <AlertOctagon size={13} />;
      case 'P1':
        return <AlertTriangle size={13} />;
      case 'P2':
        return <Wrench size={13} />;
      default:
        return <CheckCircle2 size={13} />;
    }
  };

  return (
    <div
      className={`si-priority-chip si-priority-chip--${priority.code.toLowerCase()}`}
      title={`${priority.label}: ${priority.subLabel}`}
    >
      <span className="si-priority-chip-icon">{getIcon()}</span>
      <span className="si-priority-chip-code">{priority.code}</span>
      <span className="si-priority-chip-label">{priority.label.replace(/^P\d\s*/, '')}</span>
    </div>
  );
};

export const StatusCell = ({ row }) => {
  const resolved = isRecordResolved(row);
  const details = resolved ? getResolutionDetails(row) : null;

  if (resolved) {
    return (
      <div
        className="si-status-chip si-status-chip--resolved"
        title={details?.resolutionNote ? `Resolved: ${details.resolutionNote}` : 'Resolved'}
      >
        <Check size={12} strokeWidth={2.5} />
        <span>Resolved</span>
      </div>
    );
  }

  return (
    <div className="si-status-chip si-status-chip--open">
      <span className="si-status-dot" />
      <span>Open Issue</span>
    </div>
  );
};

export const NotesCell = ({ text }) => {
  if (!text) return <span style={{ color: '#cbd5e1' }}>—</span>;
  // Strip resolution tag if present so it doesn't clutter the main issue text
  const clean = text.replace(/\[RESOLVED:?[^\]]*\]/gi, '').trim();

  return (
    <span title={clean || text} className="si-notes-text">
      {clean.length > 55 ? `${clean.slice(0, 55)}…` : clean || text}
    </span>
  );
};

export const FilesCell = ({ attachments }) =>
  Array.isArray(attachments) && attachments.length > 0 ? (
    <a
      href={attachments[0].publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="si-files-link"
      title={`View ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}`}
    >
      <Paperclip size={13} />
      <span>{attachments.length}</span>
    </a>
  ) : (
    <span style={{ color: '#cbd5e1' }}>—</span>
  );

export const ActionsCell = ({ row, onResolve, onDelete }) => {
  const resolved = isRecordResolved(row);

  return (
    <div className="si-actions-group">
      {row.recordType === 'REPAIR' && !resolved && onResolve && (
        <button
          type="button"
          onClick={() => onResolve(row)}
          className="si-action-resolve-btn"
          title="Mark issue as resolved & roadworthy"
        >
          <CheckCircle2 size={13} />
          <span>Resolve</span>
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(row)}
          title="Delete entry"
          className="si-action-delete-btn"
          aria-label="Delete entry"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};
