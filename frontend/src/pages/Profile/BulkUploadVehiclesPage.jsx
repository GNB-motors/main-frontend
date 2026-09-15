import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getThemeCSS } from '../../utils/colorTheme.js';

import './BulkUploadVehiclesPage.css';
import NewButton from '@/components/ui/NewButton';
import PageShell from '../../components/ui/PageShell';
import { VehicleService } from './VehicleService.jsx';
import {
  normalizeVehicleDataset,
  validateVehicleRow,
  dedupeRows,
} from '../../utils/bulkNormalization';
import EditRowModal from '../BulkUpload/EditRowModal';
import { getToken } from '../../utils/session.js';
import { VEHICLE_COLUMNS } from './bulkUploadVehiclesColumns.js';
import {
  filterRowsByStatus,
  summarizeRowErrors,
  VEHICLE_DEDUPE_KEY,
} from './bulkUploadVehiclesFlow.js';
import BulkUploadVehiclesFileStep from './bulkUploadVehiclesFileStep.jsx';
import BulkUploadVehiclesReviewTable from './bulkUploadVehiclesReviewTable.jsx';
import BulkUploadVehiclesResultSummary from './bulkUploadVehiclesResultSummary.jsx';

const BulkUploadVehiclesPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [dryRun, setDryRun] = useState(false);
  const [upsert, setUpsert] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const fileInputRef = useRef(null);

  const businessRefId = null; // Set to null since profile context was removed

  // Update theme colors when component mounts or profile color changes
  useEffect(() => {
    const updateTheme = () => {
      setThemeColors(getThemeCSS());
    };

    updateTheme();

    window.addEventListener('storage', updateTheme);
    return () => {
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  const columns = useMemo(() => VEHICLE_COLUMNS, []);
  const validator = useMemo(() => validateVehicleRow, []);
  const datasetNormalizer = useMemo(() => normalizeVehicleDataset, []);

  const resetState = () => {
    setRows([]);
    setRowErrors([]);
    setUploadResult(null);
    setFileName('');
    setFilterStatus('all');
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    parseWorkbook(file);
  };

  const openFilePicker = () => {
    if (isParsing || isSubmitting) return;
    fileInputRef.current?.click();
  };

  const parseWorkbook = (file) => {
    setIsParsing(true);
    setUploadResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!rawRows.length) {
          toast.warn('No rows detected in the sheet. Please check the template.');
          resetState();
          setIsParsing(false);
          return;
        }

        // 1. Normalize entire dataset
        let normalizedRows = datasetNormalizer(rawRows).map((row, idx) => ({
          ...row,
          _rowId: `${Date.now()}-${idx}`,
          _rawRow: rawRows[idx],
        }));

        // 2. Filter empty rows
        normalizedRows = normalizedRows.filter((row) =>
          Object.values(row).some(
            (value) => value && typeof value === 'string' && value.trim() !== '',
          ),
        );

        // 3. Dedupe and Limit (removed artificial limit for chunking)
        const trimmedRows = dedupeRows(normalizedRows, VEHICLE_DEDUPE_KEY);

        // 4. Validate
        const nextErrors = trimmedRows.map((row) => validator(row));

        setRows(trimmedRows);
        setRowErrors(nextErrors);
        setIsParsing(false);
        toast.success(`Loaded ${trimmedRows.length} row(s) from ${file.name}`);
      } catch (error) {
        setIsParsing(false);
        toast.error(`Failed to parse file: ${error.message}`);
        resetState();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClearRows = () => {
    resetState();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditRow = (index) => {
    setEditingRowIndex(index);
  };

  const handleSaveEditedRow = (index, updatedRow) => {
    const nextRows = [...rows];
    nextRows[index] = { ...updatedRow };
    setRows(nextRows);
    const nextErrors = nextRows.map((row) => validator(row));
    setRowErrors(nextErrors);
    setEditingRowIndex(null);
    toast.success('Row updated successfully');
  };

  const handleDeleteRow = (index) => {
    const nextRows = rows.filter((_, i) => i !== index);
    const nextErrors = nextRows.map((row) => validator(row));
    setRows(nextRows);
    setRowErrors(nextErrors);
    toast.success('Row deleted');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { errorCount } = summarizeRowErrors(rowErrors);
    if (errorCount > 0) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    if (rows.length === 0) {
      toast.error('No rows to submit');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({ processed: 0, total: rows.length });
    setUploadResult(null);

    // Build payload using API expected camelCase keys
    // Use VehicleService to handle the mapping and API call (it defaults inventory to [])
    try {
      const token = getToken();
      const options = { dry_run: dryRun, upsert };
      const chunkSize = 50;

      let totalCreated = 0;
      let totalErrors = [];

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const resp = await VehicleService.addBulkVehicles(businessRefId, chunk, options, token);
        const respData = resp && resp.data ? resp.data : resp;

        totalCreated +=
          respData?.createdCount ?? respData?.data?.createdCount ?? respData?.summary?.created ?? 0;
        const chunkErrors = respData?.errors ?? respData?.data?.errors ?? [];
        totalErrors = [...totalErrors, ...chunkErrors];

        setUploadProgress({ processed: Math.min(i + chunkSize, rows.length), total: rows.length });
      }

      setUploadResult({ createdCount: totalCreated, errors: totalErrors });

      toast.success(
        dryRun
          ? `Dry run completed: ${totalCreated} created, ${totalErrors.length} error(s)`
          : `Vehicles uploaded: ${totalCreated} created, ${totalErrors.length} error(s)`,
      );

      if (!dryRun && totalErrors.length === 0) {
        setTimeout(() => navigate('/vehicles'), 2000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Upload failed';
      toast.error(errorMsg);
      setUploadResult(null);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const filteredRows = filterRowsByStatus(rows, rowErrors, filterStatus);
  const { errorCount } = summarizeRowErrors(rowErrors);

  return (
    <div className="bulk-upload-vehicles-container" style={themeColors}>
      <PageShell
        title="Bulk Upload Vehicles"
        subtitle="Upload vehicle data via .xlsx to normalize and update the database."
        actions={
          <NewButton
            variant="link"
            size="sm"
            text="Back"
            prependIcon={<ArrowLeft size={20} />}
            prependGap={6}
            onClick={() => navigate(-1)}
          />
        }
      >
        <form onSubmit={handleSubmit}>
          {/* Options toolbar */}
          <div className="bulk-upload-toolbar">
            <div className="bulk-upload-input-group">
              <label>Mode</label>
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Dry-run only</span>
              </label>
            </div>

            <div className="bulk-upload-input-group">
              <label>Update Policy</label>
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={upsert}
                  onChange={(e) => setUpsert(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Upsert (Update if exists)</span>
              </label>
            </div>
          </div>

          <div className="bulk-upload-card">
            <BulkUploadVehiclesFileStep
              fileName={fileName}
              recordCount={rows.length}
              isParsing={isParsing}
              isSubmitting={isSubmitting}
              onSelectFile={openFilePicker}
              onClearFile={handleClearRows}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
            />

            <BulkUploadVehiclesReviewTable
              columns={columns}
              rows={rows}
              rowErrors={rowErrors}
              filteredRows={filteredRows}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              onEditRow={handleEditRow}
              onDeleteRow={handleDeleteRow}
              fileName={fileName}
            />

            {rows.length > 0 && (
              <div className="action-row">
                <NewButton
                  variant="secondary"
                  size="md"
                  type="button"
                  text="Cancel"
                  onClick={handleClearRows}
                  disabled={isSubmitting}
                />
                <NewButton
                  variant="primary"
                  size="md"
                  type="submit"
                  text="Submit Upload"
                  appendIcon={<Send size={16} />}
                  loading={isSubmitting}
                  disabled={errorCount > 0}
                />
              </div>
            )}

            {uploadProgress && (
              <div
                className="upload-progress-container"
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'var(--surface-color, #fff)',
                  border: '1px solid var(--border-color, #eaeaea)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
                >
                  <span style={{ fontWeight: '500', color: 'var(--text-color, #333)' }}>
                    Uploading...
                  </span>
                  <span style={{ color: 'var(--text-secondary, #666)' }}>
                    {uploadProgress.processed} / {uploadProgress.total}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'var(--bg-secondary, #f0f0f0)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--primary-color, #0056b3)',
                      width: `${(uploadProgress.processed / uploadProgress.total) * 100}%`,
                      transition: 'width 0.3s ease',
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </form>
      </PageShell>

      {/* Upload Result Summary */}
      <BulkUploadVehiclesResultSummary result={uploadResult} />

      {/* Edit Modal Logic */}
      <EditRowModal
        isOpen={editingRowIndex !== null}
        row={editingRowIndex !== null ? rows[editingRowIndex] : null}
        columns={columns}
        onSave={(updatedRow) => handleSaveEditedRow(editingRowIndex, updatedRow)}
        onClose={() => setEditingRowIndex(null)}
      />
    </div>
  );
};

export default BulkUploadVehiclesPage;
