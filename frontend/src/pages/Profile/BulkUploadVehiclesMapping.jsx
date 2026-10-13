import React from 'react';

/** Lets the user point each vehicle field at a column of the uploaded sheet. */
const BulkUploadVehiclesMapping = ({
  columns,
  headers,
  mapping,
  handleMappingChange,
  isSubmitting,
}) => (
  <div className="bulk-upload-mapping">
    <div className="bulk-upload-mapping-head">
      Match your sheet&rsquo;s columns
      <span>Pick which column in your file holds each field.</span>
    </div>
    <div className="bulk-upload-mapping-grid">
      {columns.map((col) => (
        <label key={col.key} className="bulk-upload-map-field">
          <span>
            {col.label}
            {col.required ? <em> *</em> : null}
          </span>
          <select
            value={mapping[col.key] || ''}
            onChange={(e) => handleMappingChange(col.key, e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">— Not in file —</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  </div>
);

export default BulkUploadVehiclesMapping;
