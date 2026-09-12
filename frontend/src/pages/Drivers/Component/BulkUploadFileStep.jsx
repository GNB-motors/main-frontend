import React from 'react';
import { FileSpreadsheet, Trash2, Upload } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';

/**
 * Step 1 of the bulk upload wizard: the dropzone (no file yet) or the
 * file-info bar (file parsed, records ready to map).
 */
const BulkUploadFileStep = ({
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
            — {recordCount} records
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
      <div className="bulk-upload-text-secondary">Supports .xlsx, .xls, and .csv files</div>
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
        accept=".xlsx,.xls,.csv"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default BulkUploadFileStep;
