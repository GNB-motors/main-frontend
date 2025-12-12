import React, { useMemo, useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Trash2, FileSpreadsheet, Send, Upload, Eye, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getThemeCSS } from "../../utils/colorTheme.js";

import "../Profile/BulkUploadVehiclesPage.css";
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
    label: "Vehicle No",
    placeholder: "KA01AB1234",
    required: true,
  },
  {
    key: "vehicle_type",
    label: "Model No",
    placeholder: "Truck / Van",
    required: false,
  },
  {
    key: "chassis_number",
    label: "Chassis No",
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
  const navigate = useNavigate();
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
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const fileInputRef = useRef(null);

  const businessRefId = profile?.business_ref_id || localStorage.getItem("profile_business_ref_id");

  // Update theme colors when component mounts or profile color changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = getThemeCSS();
      console.log('BulkUploadPage theme colors:', newTheme);
      setThemeColors(newTheme);
    };

    updateTheme();

    window.addEventListener('storage', updateTheme);
    return () => {
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  const columns = useMemo(
    () => (mode === "vehicles" ? VEHICLE_COLUMNS : DRIVER_COLUMNS),
    [mode],
  );

  const validator = useMemo(
    () => (mode === "vehicles" ? validateVehicleRow : validateDriverRow),
    [mode],
  );

  const datasetNormalizer = useMemo(
    () => (mode === "vehicles" ? normalizeVehicleDataset : normalizeDriverDataset),
    [mode],
  );

  const dedupeKey = mode === "vehicles" ? "registration_no" : "name";

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
          setIsParsing(false);
          return;
        }

        // 1. Normalize entire dataset
        let normalizedRows = datasetNormalizer(rawRows).map((row, idx) => ({
          ...row,
          _rowId: `${Date.now()}_${idx}`,
        }));

        // 2. Dedupe
        normalizedRows = dedupeRows(normalizedRows, dedupeKey);

        // 3. Validate each row
        const nextErrors = normalizedRows.map((row) => validator(row));

        setRows(normalizedRows);
        setRowErrors(nextErrors);
        toast.success(`Loaded ${normalizedRows.length} rows`);
      } catch (error) {
        console.error("Parse error:", error);
        toast.error("Failed to parse file");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEditRow = (index) => {
    setEditingRowIndex(index);
  };

  const handleSaveEditedRow = (index, updatedRow) => {
    const nextRows = [...rows];
    nextRows[index] = updatedRow;
    setRows(nextRows);

    const nextErrors = nextRows.map((row) => validator(row));
    setRowErrors(nextErrors);
    setEditingRowIndex(null);
    toast.success("Row updated");
  };

  const handleClearRows = () => {
    resetState();
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

    let payload;
    let endpoint;

    if (mode === "vehicles") {
      payload = {
        records: rows.map((r) => ({
          registration_no: r.registration_no,
          vehicle_type: r.vehicle_type || null,
          chassis_number: r.chassis_number || null,
        })),
        dry_run: dryRun,
        upsert: upsert,
      };
      endpoint = `/vehicles/bulk-upload/${businessRefId}`;
    } else {
      payload = {
        records: rows.map((r) => ({
          name: r.name,
          role: r.role || "Employee",
          vehicle_registration_no: r.vehicle_registration_no || null,
        })),
        dry_run: dryRun,
        upsert: upsert,
      };
      endpoint = `/employees/bulk-upload/${businessRefId}`;
    }

    const token = localStorage.getItem("authToken");

    try {
      const response = await apiClient.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setUploadResult(response.data);
      toast.success(
        dryRun
          ? `Dry run completed: ${response.data.summary?.created || 0} new, ${response.data.summary?.updated || 0} updated`
          : `${mode === "vehicles" ? "Vehicles" : "Drivers"} uploaded successfully: ${response.data.summary?.created || 0} new, ${response.data.summary?.updated || 0} updated`
      );

      if (!dryRun) {
        setTimeout(() => navigate(mode === "vehicles" ? "/vehicles" : "/drivers"), 2000);
      }
    } catch (error) {
      console.error("Submission error:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Upload failed";
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
      <div className="bulk-upload-header">
        <button 
          className="bulk-upload-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Bulk Upload ({mode === "vehicles" ? "Vehicles" : "Drivers"})</h1>
        <p>Upload an .xlsx file, we will normalize the data locally and send cleaned JSON to the API.</p>
      </div>

      <form onSubmit={handleSubmit} className="bulk-upload-form">
        {/* File Upload Section */}
        <div className="bulk-upload-section">
          <div className="bulk-upload-section-header">
            <h2>Record Type & Data</h2>
          </div>
          
          <div className="bulk-upload-controls">
            <div className="bulk-upload-input-group">
              <label>Record Type</label>
              <select 
                value={mode} 
                onChange={handleModeChange}
                disabled={isParsing || isSubmitting}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--color-grey-200)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'var(--color-white)',
                  cursor: 'pointer',
                }}
              >
                <option value="vehicles">Vehicles</option>
                <option value="drivers">Drivers</option>
              </select>
            </div>

            <div className="bulk-upload-input-group">
              <label>Spreadsheet (.xlsx)</label>
              <div className="bulk-upload-file-input">
                <button
                  type="button"
                  className="bulk-upload-file-btn"
                  onClick={openFilePicker}
                  disabled={isParsing || isSubmitting}
                >
                  <Upload size={20} />
                  {fileName || "Upload spreadsheet"}
                </button>
                <span className="bulk-upload-file-hint">
                  {fileName ? `Selected: ${fileName}` : "No file selected"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={isParsing || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bulk-upload-options">
            <label className="bulk-upload-checkbox">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>Dry-run only</span>
            </label>
            <label className="bulk-upload-checkbox">
              <input
                type="checkbox"
                checked={upsert}
                onChange={(e) => setUpsert(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>Enable upsert (update matches)</span>
            </label>
          </div>
        </div>

        {/* Data Preview Section */}
        {rows.length > 0 && (
          <div className="bulk-upload-section">
            <div className="bulk-upload-section-header">
              <h2>Data Preview</h2>
              <div className="bulk-upload-stats">
                <span className="stat-valid">✓ {validCount} valid</span>
                {errorCount > 0 && <span className="stat-error">✗ {errorCount} errors</span>}
              </div>
            </div>

            <div className="bulk-upload-filter">
              <label>Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="all">All ({rows.length})</option>
                <option value="valid">Valid ({validCount})</option>
                <option value="error">Errors ({errorCount})</option>
              </select>
            </div>

            <div className="bulk-upload-table-container">
              <table className="bulk-upload-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>#</th>
                    {columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th style={{ width: "120px" }}>Status</th>
                    <th style={{ width: "80px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, displayIndex) => {
                    const actualIndex = rows.indexOf(row);
                    const error = rowErrors[actualIndex];
                    const isValid = !error || Object.keys(error).length === 0;

                    return (
                      <tr key={row._rowId} className={isValid ? "" : "row-error"}>
                        <td>{displayIndex + 1}</td>
                        {columns.map((col) => (
                          <td key={col.key} title={row[col.key] || ""}>
                            {row[col.key] || "-"}
                          </td>
                        ))}
                        <td>
                          {isValid ? (
                            <span className="status-badge status-valid">
                              <CheckCircle size={16} /> Valid
                            </span>
                          ) : (
                            <span className="status-badge status-error">
                              <AlertCircle size={16} /> Error
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="row-action-btn"
                              onClick={() => handleEditRow(actualIndex)}
                              title="Edit"
                              disabled={isSubmitting}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              className="row-action-btn row-action-delete"
                              onClick={() => handleDeleteRow(actualIndex)}
                              title="Delete"
                              disabled={isSubmitting}
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
            </div>
          </div>
        )}

        {/* Upload Result Section */}
        {uploadResult && (
          <div className="bulk-upload-section">
            <div className="bulk-upload-result">
              <h3>Upload Result</h3>
              <p>
                {uploadResult.summary?.created || 0} created, {uploadResult.summary?.updated || 0} updated
              </p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="bulk-upload-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClearRows}
            disabled={isParsing || isSubmitting || rows.length === 0}
          >
            Clear
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isParsing || isSubmitting || rows.length === 0}
          >
            {isSubmitting ? "Uploading..." : dryRun ? "Run Dry-Run" : "Submit Bulk Upload"}
          </button>
        </div>
      </form>

      {/* Edit Row Modal */}
      {editingRowIndex !== null && (
        <EditRowModal
          row={rows[editingRowIndex]}
          columns={columns}
          onSave={(updatedRow) => handleSaveEditedRow(editingRowIndex, updatedRow)}
          onClose={() => setEditingRowIndex(null)}
        />
      )}
    </div>
  );
};

export default BulkUploadPage;
