const DeleteScheduleModal = ({ deleteTarget, setDeleteTarget, handleDelete, saving }) => (
  <div
    className="erp-modal-backdrop"
    role="presentation"
    onClick={(e) => {
      if (e.target === e.currentTarget) setDeleteTarget(null);
    }}
    onKeyDown={(e) => {
      if (e.key === 'Escape') setDeleteTarget(null);
    }}
  >
    <div className="erp-modal" style={{ maxWidth: 440 }}>
      <div className="erp-modal-header">
        <h2>Delete schedule</h2>
      </div>
      <div className="erp-modal-body">
        <p style={{ margin: 0 }}>
          Stop generating call tasks for{' '}
          <strong>{deleteTarget.partyId?.name || 'this account'}</strong>? Tasks already created are
          kept.
        </p>
        <p className="erp-cell-muted" style={{ marginTop: 8 }}>
          To stop calls temporarily without losing the pattern, pause it instead.
        </p>
      </div>
      <div className="erp-modal-footer">
        <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
          {saving ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

export default DeleteScheduleModal;
