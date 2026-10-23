import React from 'react';

/** Dry-run / upsert switches above the vehicle upload card. */
const BulkUploadVehiclesToolbar = ({
  toolbarId,
  dryRun,
  setDryRun,
  upsert,
  setUpsert,
  isSubmitting,
}) => (
  <div className="bulk-upload-toolbar">
    <div className="bulk-upload-input-group" role="group" aria-labelledby={`${toolbarId}-mode`}>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- captions the checkbox group (tied via aria-labelledby); the checkbox has its own wrapping label */}
      <label id={`${toolbarId}-mode`}>Mode</label>
      <label className="checkbox-card">
        <input
          type="checkbox"
          aria-label="Dry-run only"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
          disabled={isSubmitting}
        />
        <span>Dry-run only</span>
      </label>
    </div>

    <div className="bulk-upload-input-group" role="group" aria-labelledby={`${toolbarId}-policy`}>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- captions the checkbox group (tied via aria-labelledby); the checkbox has its own wrapping label */}
      <label id={`${toolbarId}-policy`}>Update Policy</label>
      <label className="checkbox-card">
        <input
          type="checkbox"
          aria-label="Upsert (Update if exists)"
          checked={upsert}
          onChange={(e) => setUpsert(e.target.checked)}
          disabled={isSubmitting}
        />
        <span>Upsert (Update if exists)</span>
      </label>
    </div>
  </div>
);

export default BulkUploadVehiclesToolbar;
