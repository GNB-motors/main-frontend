import React from 'react';
import { Trash2, FileSpreadsheet, Upload } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';

/**
 * File step of the vehicle bulk-upload wizard: a dropzone when no file is
 * loaded, an info bar with a remove action once parsing produced rows.
 */
const BulkUploadVehiclesFileStep = ({
  fileName,
  recordCount,
  isParsing,
  isSubmitting,
  onSelectFile,
  onClearFile,
  fileInputRef,
  onFileChange,
}) => {
  if (fileName) {
    return (
      <div className="file-info-bar">
        <div className="file-info-text">
          <FileSpreadsheet size={18} />
          <span>{fileName}</span>
          <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
            — {recordCount} records found
          </span>
        </div>
        <button
          type="button"
          onClick={onClearFile}
          className="row-action-btn row-action-delete"
          title="Remove File"
          disabled={isSubmitting}
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="bulk-upload-dropzone">
      <div className="bulk-upload-icon-circle">
        <Upload size={24} />
      </div>
      <div className="bulk-upload-text-primary">Click to upload spreadsheet</div>
      <div className="bulk-upload-text-secondary">
        Supports .xlsx files with headers: Vehicle No, Model No, Chassis No
      </div>
      <NewButton
        variant="primary"
        size="md"
        type="button"
        text="Select File"
        onClick={onSelectFile}
        loading={isParsing}
        disabled={isSubmitting}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default BulkUploadVehiclesFileStep;
