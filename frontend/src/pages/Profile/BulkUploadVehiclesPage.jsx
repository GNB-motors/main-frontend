import React, { useMemo, useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Trash2, FileSpreadsheet, Send, Upload, Eye, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getThemeCSS } from "../../utils/colorTheme.js";

import "./BulkUploadVehiclesPage.css";
import { useProfile } from "./ProfileContext.jsx";
import { VehicleService } from "./VehicleService.jsx";
import {
  normalizeVehicleDataset,
  validateVehicleRow,
  dedupeRows,
} from "../../utils/bulkNormalization";
import EditRowModal from "../BulkUpload/EditRowModal";

const VEHICLE_COLUMNS = [
  {
    key: "registration_no",
    label: "Vehicle No",
    placeholder: "KA01AB1234",
    required: true,
  },
  {
    key: "vehicle_type",
    label: "Vehicle Type",
    placeholder: "Truck / Van",
    required: false,
  },
  {
    key: "model",
    label: "Model (optional)",
    placeholder: "Tata Ace",
    required: false,
  },
  {
    key: "chassis_number",
    label: "Chassis No",
    placeholder: "JHMCM56557C400123",
    required: false,
  },
];

const BulkUploadVehiclesPage = () => {
  const { profile, isLoadingProfile } = useProfile();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [dryRun, setDryRun] = useState(false);
  const [upsert, setUpsert] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const fileInputRef = useRef(null);

  const businessRefId = profile?.business_ref_id || localStorage.getItem("profile_business_ref_id");

  // Update theme colors when component mounts or profile color changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = getThemeCSS();
      console.log('BulkUploadVehiclesPage theme colors:', newTheme);
      setThemeColors(newTheme);
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
  const dedupeKey = "registration_no";

  const resetState = () => {
    setRows([]);
    setRowErrors([]);
    setUploadResult(null);
    setFileName("");
    setFilterStatus("all");
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
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        if (!rawRows.length) {
          toast.warn("No rows detected in the sheet. Please check the template.");
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
        
        console.log(`Raw rows from file: ${rawRows.length}`);
        console.log(`After normalization: ${normalizedRows.length}`);
        
        // 2. Filter empty rows
        const beforeEmptyFilter = normalizedRows.length;
        normalizedRows = normalizedRows.filter((row) => 
          Object.values(row).some((value) => value && typeof value === 'string' && value.trim() !== '')
        );
        console.log(`After empty row filter: ${normalizedRows.length} (removed: ${beforeEmptyFilter - normalizedRows.length})`);

        // 3. Dedupe and Limit
        const beforeDedupe = normalizedRows.length;
        const trimmedRows = dedupeRows(normalizedRows, dedupeKey).slice(0, 500);
        console.log(`After deduplication: ${trimmedRows.length} (removed: ${beforeDedupe - trimmedRows.length} duplicates)`);
        
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
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    toast.success("Row updated successfully");
  };

  const handleDeleteRow = (index) => {
    const nextRows = rows.filter((_, i) => i !== index);
    const nextErrors = nextRows.map((row) => validator(row));
    setRows(nextRows);
    setRowErrors(nextErrors);
    toast.success("Row deleted");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasErrors = rowErrors.some((error) => error && Object.keys(error).length > 0);
    if (hasErrors) {
      toast.error("Please fix validation errors before submitting");
      return;
    }

    if (rows.length === 0) {
      toast.error("No rows to submit");
      return;
    }

    setIsSubmitting(true);

    // Build payload using API expected camelCase keys
    // Use VehicleService to handle the mapping and API call (it defaults inventory to [])
    try {
      const token = localStorage.getItem('authToken');
      const options = { dry_run: dryRun, upsert };
      const resp = await VehicleService.addBulkVehicles(businessRefId, rows, options, token);

      // VehicleService returns response.data.data when possible, normalize it
      const respData = resp && resp.data ? resp.data : resp;
      setUploadResult(respData);

      const created = respData?.createdCount ?? respData?.data?.createdCount ?? respData?.summary?.created ?? 0;
      const errors = respData?.errors ?? respData?.data?.errors ?? [];

      toast.success(
        dryRun
          ? `Dry run completed: ${created} created, ${errors.length} error(s)`
          : `Vehicles uploaded: ${created} created, ${errors.length} error(s)`
      );

      if (!dryRun) {
        setTimeout(() => navigate("/vehicles"), 2000);
      }
    } catch (error) {
      console.error("Submission error:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || "Upload failed";
      toast.error(errorMsg);
      setUploadResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRows = rows.filter((row, index) => {
    if (filterStatus === "all") return true;
    const error = rowErrors[index];
    if (filterStatus === "error") return error && Object.keys(error).length > 0;
    if (filterStatus === "valid") return !error || Object.keys(error).length === 0;
    return true;
  });

  const errorCount = rowErrors.filter((e) => e && Object.keys(e).length > 0).length;
  const validCount = rows.length - errorCount;

  return (
    <div className="bulk-upload-vehicles-container" style={themeColors}>
      {/* 1. Header Section */}
      <div className="bulk-upload-header">
        <button className="bulk-upload-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Bulk Upload Vehicles</h1>
        <p>Upload vehicle data via .xlsx to normalize and update the database.</p>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* 2. Options Toolbar (Like the Filters in the image) */}
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

        {/* 3. Main Card Content */}
        <div className="bulk-upload-card">
          
          {/* Upload State: Active File */}
          {fileName ? (
            <div className="file-info-bar">
              <div className="file-info-text">
                <FileSpreadsheet size={18} />
                <span>{fileName}</span>
                <span style={{color: '#64748b', fontWeight: 400, marginLeft: 8}}>
                   — {rows.length} records found
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearRows}
                className="row-action-btn row-action-delete"
                title="Remove File"
                disabled={isSubmitting}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            /* Upload State: Dropzone */
            <div className="bulk-upload-dropzone">
              <div className="bulk-upload-icon-circle">
                <Upload size={24} />
              </div>
              <div className="bulk-upload-text-primary">Click to upload spreadsheet</div>
              <div className="bulk-upload-text-secondary">
                Supports .xlsx files with headers: Vehicle No, Model No, Chassis No
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={openFilePicker}
                disabled={isParsing || isSubmitting}
              >
                Select File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          )}

          {/* 4. Data Table / Empty State */}
          <div className="bulk-upload-table-container">
            {rows.length > 0 ? (
              <>
                {/* Error Summary Header */}
                {errorCount > 0 && (
                  <div style={{
                    padding: '16px 24px',
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      Some rows have errors. Click 'View/Edit' to correct them.
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          backgroundColor: filterStatus === 'all' ? '#6366f1' : '#f3f4f6',
                          color: filterStatus === 'all' ? '#fff' : '#374151',
                          transition: 'all 0.2s'
                        }}
                      >
                        All ({rows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('valid')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          backgroundColor: filterStatus === 'valid' ? '#6366f1' : '#f3f4f6',
                          color: filterStatus === 'valid' ? '#fff' : '#374151',
                          transition: 'all 0.2s'
                        }}
                      >
                        Valid ({validCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('error')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          backgroundColor: filterStatus === 'error' ? '#6366f1' : '#fef2f2',
                          color: filterStatus === 'error' ? '#fff' : '#991b1b',
                          transition: 'all 0.2s'
                        }}
                      >
                        Issues ({errorCount})
                      </button>
                    </div>
                  </div>
                )}
                <table className="bulk-upload-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>#</th>
                    {columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th style={{ width: "120px" }}>Status</th>
                    <th style={{ width: "80px", textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, displayIndex) => {
                      const actualIndex = rows.indexOf(row);
                      const error = rowErrors[actualIndex];
                      const isValid = !error || Object.keys(error).length === 0;

                      return (
                        <tr key={row._rowId}>
                          <td>{displayIndex + 1}</td>
                          {columns.map((col) => (
                            <td key={col.key}>{row[col.key] || "-"}</td>
                          ))}
                          <td style={{ paddingLeft: '24px', textAlign: 'left' }}>
                            {isValid ? (
                              <span className="status-badge status-valid">Valid</span>
                            ) : (
                              <span className="status-badge status-error">Error</span>
                            )}
                          </td>
                          <td style={{ backgroundColor: !isValid ? '#fef2f2' : 'transparent' }}>
                             <div className="row-actions" style={{ gap: !isValid ? '12px' : '8px' }}>
                              {!isValid && (
                                <button
                                  type="button"
                                  className="row-action-btn row-action-fix"
                                  onClick={() => handleEditRow(actualIndex)}
                                >
                                  <AlertCircle size={18} />
                                  <span>Fix</span>
                                </button>
                              )}
                              <button
                                type="button"
                                className="row-action-btn"
                                onClick={() => handleEditRow(actualIndex)}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                type="button"
                                className="row-action-btn row-action-delete"
                                onClick={() => handleDeleteRow(actualIndex)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              </>
            ) : (
              // Empty State matching the image style
              <div className="empty-state-container">
                {fileName ? "No valid rows found in file." : "No data found. Upload a file to see preview."}
              </div>
            )}
          </div>

          {/* 5. Footer Actions */}
          {rows.length > 0 && (
            <div className="action-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearRows}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || errorCount > 0}
              >
                {isSubmitting ? "Processing..." : "Submit Upload"}
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </form>
      {/* Upload Result Summary */}
      {uploadResult && (
        <div className="upload-result-summary" style={{ marginTop: 16 }}>
          <div style={{ padding: 12, background: '#fff', border: '1px solid #e6e7eb', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Upload Summary</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div>Created: <strong>{uploadResult.createdCount ?? uploadResult.data?.createdCount ?? 0}</strong></div>
              <div>Errors: <strong>{(uploadResult.errors ?? uploadResult.data?.errors ?? []).length}</strong></div>
            </div>
            { (uploadResult.errors ?? uploadResult.data?.errors ?? []).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Errors</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(uploadResult.errors ?? uploadResult.data?.errors ?? []).slice(0, 10).map((err, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      <strong>{err.registrationNumber || err.registration_no || '-'}</strong>: {err.error || err.message || JSON.stringify(err)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

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
