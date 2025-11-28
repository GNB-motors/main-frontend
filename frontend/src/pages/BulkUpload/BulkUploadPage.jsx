import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Trash2, FileSpreadsheet, Send, Upload, Eye, AlertCircle, CheckCircle } from "lucide-react";

import "./BulkUploadPage.css";
import { useProfile } from "../Profile/ProfileContext.jsx";
import apiClient from "../../utils/axiosConfig";
import {
  normalizeVehicleDataset,
  normalizeDriverDataset,
  validateVehicleRow,
  validateDriverRow,
  dedupeRows,
} from "../../utils/bulkNormalization";
import EditRowModal from "./EditRowModal";

const VEHICLE_COLUMNS = [
  {
    key: "registration_no",
    label: "Registration #",
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
    key: "chassis_number",
    label: "Chassis No.",
    placeholder: "JHMCM56557C400123",
    required: false,
  },
];

const DRIVER_COLUMNS = [
  { key: "name", label: "Driver Name", placeholder: "Alex Carter", required: true },
  { key: "role", label: "Role", placeholder: "Driver", required: true },
  {
    key: "vehicle_registration_no",
    label: "Vehicle Registration #",
    placeholder: "KA01AB1234",
    required: false,
  },
];

const BulkUploadPage = () => {
  const { profile, isLoadingProfile } = useProfile();
  const [mode, setMode] = useState("vehicles");
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
  const fileInputRef = useRef(null);

  const businessRefId =
    profile?.business_ref_id || localStorage.getItem("profile_business_ref_id");

  const columns = useMemo(
    () => (mode === "vehicles" ? VEHICLE_COLUMNS : DRIVER_COLUMNS),
    [mode],
  );

  const validator = useMemo(
    () => (mode === "vehicles" ? validateVehicleRow : validateDriverRow),
    [mode],
  );

  // Dataset normalizers now handle the entire array
  const datasetNormalizer = useMemo(
    () => (mode === "vehicles" ? normalizeVehicleDataset : normalizeDriverDataset),
    [mode],
  );

  const dedupeKey = mode === "vehicles" ? "registration_no" : "vehicle_registration_no";

  const resetState = () => {
    setRows([]);
    setRowErrors([]);
    setUploadResult(null);
    setFileName("");
    setFilterStatus("all");
  };

  const handleModeChange = (event) => {
    const nextMode = event.target.value;
    setMode(nextMode);
    resetState();
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
          return;
        }

        // 1. Normalize entire dataset (column heuristics applied here)
        let normalizedRows = datasetNormalizer(rawRows).map((row, idx) => ({
          ...row,
          _rowId: `${Date.now()}-${idx}`,
          _rawRow: rawRows[idx],
        }));
        
        // 2. Filter empty rows
        normalizedRows = normalizedRows.filter((row) => 
          Object.values(row).some((value) => value && typeof value === 'string' && value.trim() !== '')
        );

        // 3. Dedupe and Limit
        const trimmedRows = dedupeRows(normalizedRows, dedupeKey).slice(0, 500);
        
        // 4. Validate
        const nextErrors = trimmedRows.map((row) => validator(row));

        setRows(trimmedRows);
        setRowErrors(nextErrors);
        toast.success(`Loaded ${trimmedRows.length} row(s) from ${file.name}`);
      } catch (error) {
        console.error("Failed to parse workbook", error);
        toast.error("Could not parse spreadsheet. Please verify the format.");
        resetState();
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setIsParsing(false);
      toast.error("Failed to read the file. Please try again.");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveRow = (updatedRow) => {
    if (editingRowIndex === null) return;
    
    const nextRows = [...rows];
    const existingRow = nextRows[editingRowIndex];
    nextRows[editingRowIndex] = {
      ...existingRow,
      ...updatedRow,
      _rawRow: existingRow?._rawRow,
      _rowId: existingRow?._rowId,
    };
    setRows(nextRows);

    const validation = [...rowErrors];
    validation[editingRowIndex] = validator(updatedRow);
    setRowErrors(validation);
    
    setEditingRowIndex(null);
  };

  const handleRemoveRow = (index) => {
    const nextRows = rows.filter((_, idx) => idx !== index);
    const nextErrors = rowErrors.filter((_, idx) => idx !== index);
    setRows(nextRows);
    setRowErrors(nextErrors);
  };

  const syncBackendFailures = (failures) => {
    if (!Array.isArray(failures) || !failures.length) return;
    const nextErrors = [...rowErrors];
    failures.forEach((failure) => {
      const { index, errors } = failure;
      if (typeof index !== "number") return;
      nextErrors[index] = [...(nextErrors[index] || []), ...errors];
    });
    setRowErrors(nextErrors);
  };

  const ensureValidRows = () => {
    if (!rows.length) {
      toast.info("Please load at least one row before submitting.");
      return false;
    }
    const nextErrors = rows.map((row) => validator(row));
    setRowErrors(nextErrors);
    const hasBlockingErrors = nextErrors.some((issues) => issues.length > 0);
    if (hasBlockingErrors) {
      toast.error("Resolve validation issues before submitting.");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    if (mode === "vehicles") {
      return {
        records: rows.map((row) => ({
          registration_no: row.registration_no,
          vehicle_type: row.vehicle_type || undefined,
          chassis_number: row.chassis_number || undefined,
          extra: row.extra || {},
        })),
        dry_run: dryRun,
        upsert,
      };
    }

    return {
      records: rows.map((row) => ({
        name: row.name,
        role: row.role || "Employee",
        vehicle_registration_no: row.vehicle_registration_no || undefined,
      })),
      dry_run: dryRun,
      upsert,
    };
  };

  const handleSubmit = async () => {
    if (!businessRefId) {
      toast.error("Business reference ID missing. Please reload your profile.");
      return;
    }
    if (!ensureValidRows()) return;

    const endpoint =
      mode === "vehicles"
        ? `/vehicles/${businessRefId}/bulk`
        : `/employees/${businessRefId}/bulk`;

    const payload = buildPayload();

    try {
      setIsSubmitting(true);
      const { data } = await apiClient.post(endpoint, payload);
      setUploadResult(data);
      syncBackendFailures(data.failed);
      if (payload.dry_run) {
        toast.success("Dry-run completed. Review the summary below.");
      } else {
        toast.success("Bulk import finished. See summary for details.");
      }
    } catch (error) {
      console.error("Bulk upload failed", error);
      const detail =
        error?.response?.data?.detail || "Bulk import request failed. Try again.";
      toast.error(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRows = useMemo(() => {
    return rows
      .map((row, index) => ({
        row,
        index,
        errors: rowErrors[index] || [],
      }))
      .filter(({ errors }) => {
        if (filterStatus === "valid") {
          return errors.length === 0;
        }
        if (filterStatus === "issue") {
          return errors.length > 0;
        }
        return true;
      });
  }, [rows, rowErrors, filterStatus]);

  if (isLoadingProfile && !profile) {
    return <div className="bulk-upload-page">Loading profile...</div>;
  }

  return (
    <div className="bulk-upload-page">
      <section className="bulk-upload-card">
        <div className="bulk-upload-header">
          <h1>Bulk Upload ({mode === "vehicles" ? "Vehicles" : "Drivers"})</h1>
          <p>
            Upload an .xlsx file, we will normalize the data locally and send cleansed JSON
            to the API.
          </p>
        </div>

        <div className="bulk-upload-controls">
          <div className="bulk-upload-control">
            <label htmlFor="mode-selector">Record Type</label>
            <select
              id="mode-selector"
              value={mode}
              onChange={handleModeChange}
              disabled={isParsing || isSubmitting}
            >
              <option value="vehicles">Vehicles</option>
              <option value="drivers">Drivers</option>
            </select>
          </div>

          <div className="bulk-upload-control">
            <label htmlFor="file-input">Spreadsheet (.xlsx)</label>
            <div className="file-upload-field">
              <button
                type="button"
                className="file-trigger"
                onClick={openFilePicker}
                disabled={isParsing || isSubmitting}
              >
                <Upload size={18} />
                {fileName ? "Change file" : "Upload spreadsheet"}
              </button>
              <span className="file-name">
                {fileName ? fileName : "No file selected"}
              </span>
            </div>
            <input
              ref={fileInputRef}
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isParsing || isSubmitting}
              className="hidden-file-input"
            />
          </div>
        </div>

        <div className="toggle-row">
          <label className="toggle-chip">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
              disabled={isSubmitting}
            />
            Dry-run only
          </label>
          <label className="toggle-chip">
            <input
              type="checkbox"
              checked={upsert}
              onChange={(event) => setUpsert(event.target.checked)}
              disabled={isSubmitting}
            />
            Enable upsert (update matches)
          </label>
        </div>

        <div className="bulk-upload-actions">
          <button
            className="secondary"
            type="button"
            onClick={resetState}
            disabled={isSubmitting && !isParsing}
          >
            <Trash2 size={18} />
            Clear
          </button>
          <button
            className="primary"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isParsing || !rows.length}
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                <Send size={18} />
                Submit {dryRun ? "Dry Run" : "Bulk Upload"}
              </>
            )}
          </button>
        </div>
      </section>

      {rows.length > 0 && (
        <section className="bulk-upload-card">
          <div className="bulk-upload-header preview-header">
            <div>
              <h2>Preview & Fix Rows</h2>
              <p>
                {rowErrors.flat().length > 0
                  ? "Some rows have errors. Click 'View/Edit' to correct them."
                  : "All rows look good. Ready to submit."}
              </p>
            </div>
            <div className="filter-tabs">
              <button
                type="button"
                className={filterStatus === "all" ? "active" : ""}
                onClick={() => setFilterStatus("all")}
              >
                All ({rows.length})
              </button>
              <button
                type="button"
                className={filterStatus === "valid" ? "active" : ""}
                onClick={() => setFilterStatus("valid")}
              >
                Valid (
                {rows.length - rowErrors.filter((entry) => entry?.length > 0).length})
              </button>
              <button
                type="button"
                className={filterStatus === "issue" ? "active" : ""}
                onClick={() => setFilterStatus("issue")}
              >
                Issues ({rowErrors.filter((entry) => entry?.length > 0).length})
              </button>
            </div>
          </div>
          <div className="bulk-upload-table-wrapper">
            <table className="bulk-upload-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Row #</th>
                  <th>Extracted Data</th>
                  <th>Status</th>
                  <th>Validation</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ row, index, errors }) => {
                  const hasErrors = errors.length > 0;

                  return (
                    <tr key={row._rowId || `row-${index}`}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="extracted-row">
                          {columns.map((column) => (
                            <div key={`${row._rowId}-${column.key}`}>
                              <span>{column.label}:</span>
                              <strong>{row[column.key] || "-"}</strong>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="status-chip">
                          {hasErrors ? (
                            <>
                              <AlertCircle size={18} color="#dc2626" />
                              <span>Issue</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} color="#16a34a" />
                              <span>Valid</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {hasErrors ? (
                          <span className="error-count-badge">
                            {errors.length} error{errors.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="no-errors">-</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="row-action-buttons">
                          <button
                            className="secondary icon-only"
                            type="button"
                            onClick={() => setEditingRowIndex(index)}
                            title="View/Edit Details"
                          >
                            <Eye size={16} />
                            {hasErrors ? " Fix" : " View"}
                          </button>
                          <button
                            className="secondary icon-only danger"
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            title="Remove Row"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredRows.length && (
                  <tr>
                    <td colSpan={5} className="no-rows">
                      No rows match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {uploadResult && (
        <section className="bulk-upload-card">
          <div className="bulk-upload-header">
            <h2>Upload Summary</h2>
            <p>
              Created: {uploadResult.created} • Updated: {uploadResult.updated} • Failed:{" "}
              {uploadResult.failed.length}
            </p>
          </div>
          <div className="result-summary">
            <div className="result-chip">
              <h4>Created</h4>
              <span>{uploadResult.created}</span>
            </div>
            <div className="result-chip">
              <h4>Updated</h4>
              <span>{uploadResult.updated}</span>
            </div>
            <div className="result-chip">
              <h4>Failed</h4>
              <span>{uploadResult.failed.length}</span>
            </div>
          </div>
          {uploadResult.failed.length > 0 && (
            <div className="backend-failures">
              <h3>Backend validation errors</h3>
              {uploadResult.failed.map((failure) => (
                <div
                  key={`failure-${failure.index}`}
                  className="backend-failure-item"
                >
                  <strong>Row {failure.index + 1}</strong>
                  <ul>
                    {failure.errors.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                  {failure.payload && (
                    <code>{JSON.stringify(failure.payload)}</code>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {!rows.length && (
        <section className="bulk-upload-card">
          <div className="bulk-upload-header">
            <h3>No data loaded yet</h3>
            <p>Choose an .xlsx file with a header row to begin preprocessing.</p>
          </div>
          <div className="bulk-upload-actions">
            <button className="secondary" type="button" disabled>
              <FileSpreadsheet size={18} />
              Waiting for spreadsheet
            </button>
          </div>
        </section>
      )}

      {editingRowIndex !== null && (
        <EditRowModal
          isOpen={editingRowIndex !== null}
          row={rows[editingRowIndex]}
          columns={columns}
          errors={rowErrors[editingRowIndex]}
          onSave={handleSaveRow}
          onClose={() => setEditingRowIndex(null)}
        />
      )}
    </div>
  );
};

export default BulkUploadPage;