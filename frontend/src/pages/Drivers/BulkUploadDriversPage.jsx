import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Trash2, FileSpreadsheet, Send, Upload, Eye, AlertCircle, CheckCircle, ArrowLeft, Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getThemeCSS } from "../../utils/colorTheme.js";
import "../Profile/BulkUploadVehiclesPage.css";
import { DriverService } from "./DriverService.jsx";
import BulkEmployeeMappingModal from "./Component/BulkEmployeeMappingModal.jsx";
import {
  splitName,
  normalizePhone,
  normalizeEmail,
  normalizeRole,
  generatePassword,
  validateEmployeeRow,
  checkPayloadSize,
} from "../../utils/bulkEmployees.js";

const MAX_ROWS = 500;

const BulkUploadDriversPage = () => {
  const navigate = useNavigate();
  const [rawRows, setRawRows] = useState([]);
  const [fileColumns, setFileColumns] = useState([]);
  const [columnMapping, setColumnMapping] = useState(null);
  const [normalizedRows, setNormalizedRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [passwordMap, setPasswordMap] = useState(new Map()); // clientRowId -> password
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const fileInputRef = useRef(null);

  // Update theme colors
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = getThemeCSS();
      setThemeColors(newTheme);
    };
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  const resetState = () => {
    setRawRows([]);
    setFileColumns([]);
    setColumnMapping(null);
    setNormalizedRows([]);
    setRowErrors([]);
    setPasswordMap(new Map());
    setUploadResult(null);
    setFileName("");
    setFilterStatus("all");
    setShowResultsModal(false);
  };

  const parseFile = (file) => {
    setIsParsing(true);
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        let rawData = [];
        let headers = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV - use XLSX library which handles quoted fields properly
          const text = evt.target.result;
          const workbook = XLSX.read(text, { type: "string" });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (rawData.length > 0) {
            headers = Object.keys(rawData[0]);
          }
        } else {
          // Parse XLSX/XLS
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (rawData.length > 0) {
            headers = Object.keys(rawData[0]);
          }
        }
        
        if (rawData.length === 0) {
          toast.warn("No rows detected in the file.");
          resetState();
          setIsParsing(false);
          return;
        }
        
        // Limit to MAX_ROWS
        if (rawData.length > MAX_ROWS) {
          toast.warn(`File has ${rawData.length} rows. Only the first ${MAX_ROWS} will be processed.`);
          rawData = rawData.slice(0, MAX_ROWS);
        }
        
        setRawRows(rawData);
        setFileColumns(headers);
        setShowMappingModal(true);
        setIsParsing(false);
      } catch (error) {
        setIsParsing(false);
        toast.error(`Failed to parse file: ${error.message}`);
        resetState();
      }
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      toast.error("Please upload a .xlsx, .xls, or .csv file");
      return;
    }
    
    setFileName(file.name);
    parseFile(file);
  };

  const handleMappingSave = (mapping) => {
    setColumnMapping(mapping);
    setShowMappingModal(false);
    applyMapping(mapping);
  };

  const applyMapping = (mapping) => {
    // Apply mapping to raw rows and normalize
    const normalized = [];
    const errors = [];
    const newPasswordMap = new Map();
    
    rawRows.forEach((rawRow, index) => {
      // Extract values based on mapping
      const name = mapping.name ? (rawRow[mapping.name] || '') : '';
      const phone = mapping.phone ? (rawRow[mapping.phone] || '') : '';
      const email = mapping.email ? (rawRow[mapping.email] || '') : '';
      const role = mapping.role ? (rawRow[mapping.role] || '') : '';
      const location = mapping.location ? (rawRow[mapping.location] || '') : '';
      
      // Generate clientRowId
      const clientRowId = `row-${Date.now()}-${index}`;
      
      // Split name
      const { firstName, lastName } = splitName(name);
      
      // Normalize fields
      const normalizedPhone = normalizePhone(phone);
      const normalizedEmail = normalizeEmail(email);
      const normalizedRole = normalizeRole(role);
      const normalizedLocation = location.trim() || 'Kolkata';
      
      // Generate password
      const password = generatePassword(12);
      newPasswordMap.set(clientRowId, password);
      
      // Build normalized row
      const normalizedRow = {
        clientRowId,
        firstName,
        lastName,
        email: normalizedEmail,
        mobileNumber: normalizedPhone,
        location: normalizedLocation,
        password,
        role: normalizedRole,
        _rawRow: rawRow,
        _index: index,
      };
      
      // Validate
      const validationErrors = validateEmployeeRow(normalizedRow);
      errors.push(validationErrors);
      normalized.push(normalizedRow);
    });
    
    setNormalizedRows(normalized);
    setRowErrors(errors);
    setPasswordMap(newPasswordMap);
  };

  const handleClearRows = () => {
    resetState();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasErrors = rowErrors.some((error) => error && Object.keys(error).length > 0);
    if (hasErrors) {
      toast.error("Please fix validation errors before submitting");
      return;
    }

    if (normalizedRows.length === 0) {
      toast.error("No rows to submit");
      return;
    }

    // Check payload size
    const sizeCheck = checkPayloadSize(normalizedRows, 1);
    if (sizeCheck.exceeds) {
      toast.error(`Payload size (${sizeCheck.sizeMB}MB) exceeds limit (${sizeCheck.maxMB}MB). Please reduce the number of rows.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Build employees array (remove internal fields)
      const employees = normalizedRows.map((row) => ({
        clientRowId: row.clientRowId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email || null,
        mobileNumber: row.mobileNumber,
        location: row.location || null,
        password: row.password,
        role: row.role,
      }));

      const resp = await DriverService.addBulkDrivers(employees);

      // Normalize response
      const respData = resp && resp.data ? resp.data : resp;
      setUploadResult(respData);
      setShowResultsModal(true);

      const createdCount = respData?.createdCount ?? 0;
      const errorCount = respData?.errorCount ?? (respData?.errors?.length ?? 0);

      toast.success(
        `Upload completed: ${createdCount} created, ${errorCount} error(s)`
      );
    } catch (error) {
      console.error("Submission error:", error);
      
      // Handle 413 specifically
      if (error.response?.status === 413) {
        toast.error("Payload too large. Please reduce the number of rows or split into multiple uploads.");
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || "Upload failed";
        toast.error(errorMsg);
      }
      setUploadResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCredentials = () => {
    if (!uploadResult?.created) return;
    
    // Join created rows with passwords from our map
    const credentials = uploadResult.created.map((created) => {
      const password = passwordMap.get(created.clientRowId) || 'N/A';
      return {
        firstName: created.firstName,
        lastName: created.lastName,
        email: created.email || '',
        mobileNumber: created.mobileNumber,
        role: created.role,
        location: created.location || '',
        password: password,
      };
    });
    
    // Convert to CSV
    const headers = ['firstName', 'lastName', 'email', 'mobileNumber', 'role', 'location', 'password'];
    const csvRows = [
      headers.join(','),
      ...credentials.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-credentials-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Credentials CSV downloaded");
  };

  const filteredRows = normalizedRows.filter((row, index) => {
    if (filterStatus === "all") return true;
    const error = rowErrors[index];
    if (filterStatus === "error") return error && Object.keys(error).length > 0;
    if (filterStatus === "valid") return !error || Object.keys(error).length === 0;
    return true;
  });

  const errorCount = rowErrors.filter((e) => e && Object.keys(e).length > 0).length;
  const validCount = normalizedRows.length - errorCount;

  const openFilePicker = () => {
    if (isParsing || isSubmitting) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="bulk-upload-vehicles-container" style={themeColors}>
      <div className="bulk-upload-header">
        <button className="bulk-upload-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Bulk Upload Employees</h1>
        <p>Upload employee data via .xlsx or .csv file. Map columns and preview before submitting.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bulk-upload-card">
          {fileName ? (
            <div className="file-info-bar">
              <div className="file-info-text">
                <FileSpreadsheet size={18} />
                <span>{fileName}</span>
                <span style={{color: '#64748b', fontWeight: 400, marginLeft: 8}}>
                  — {normalizedRows.length} records
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
            <div className="bulk-upload-dropzone">
              <div className="bulk-upload-icon-circle">
                <Upload size={24} />
              </div>
              <div className="bulk-upload-text-primary">Click to upload spreadsheet</div>
              <div className="bulk-upload-text-secondary">
                Supports .xlsx, .xls, and .csv files
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
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          )}

          {normalizedRows.length > 0 && (
            <div className="bulk-upload-table-container">
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
                    Some rows have errors. Please fix them before submitting.
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
                      }}
                    >
                      All ({normalizedRows.length})
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th style={{ width: "120px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, displayIndex) => {
                    const actualIndex = normalizedRows.indexOf(row);
                    const error = rowErrors[actualIndex];
                    const isValid = !error || Object.keys(error).length === 0;

                    return (
                      <tr key={row.clientRowId}>
                        <td>{displayIndex + 1}</td>
                        <td>{row.firstName} {row.lastName}</td>
                        <td>{row.email || '-'}</td>
                        <td>{row.mobileNumber || '-'}</td>
                        <td>{row.role}</td>
                        <td>{row.location}</td>
                        <td style={{ paddingLeft: '24px', textAlign: 'left' }}>
                          {isValid ? (
                            <span className="status-badge status-valid">Valid</span>
                          ) : (
                            <span className="status-badge status-error">Error</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {normalizedRows.length > 0 && (
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

      {/* Mapping Modal */}
      <BulkEmployeeMappingModal
        isOpen={showMappingModal}
        fileColumns={fileColumns}
        onSave={handleMappingSave}
        onClose={() => {
          setShowMappingModal(false);
          if (!columnMapping) {
            resetState();
          }
        }}
      />

      {/* Results Modal */}
      {showResultsModal && uploadResult && (
        <div className="mapping-modal-overlay" onClick={() => setShowResultsModal(false)}>
          <div className="mapping-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mapping-modal-header">
              <h3>Upload Results</h3>
              <button onClick={() => setShowResultsModal(false)} className="mapping-close-btn">
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  <strong>{uploadResult.createdCount || 0}</strong> employees created,{' '}
                  <strong>{uploadResult.errorCount || uploadResult.errors?.length || 0}</strong> errors
                </p>
              </div>

              {uploadResult.created && uploadResult.created.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Created Employees</h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Phone</th>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.created.map((created) => {
                          const password = passwordMap.get(created.clientRowId) || 'N/A';
                          return (
                            <tr key={created.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '8px' }}>{created.firstName} {created.lastName}</td>
                              <td style={{ padding: '8px' }}>{created.email || '-'}</td>
                              <td style={{ padding: '8px' }}>{created.mobileNumber}</td>
                              <td style={{ padding: '8px', fontFamily: 'monospace' }}>{password}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCredentials}
                    className="mapping-btn-primary"
                    style={{ marginTop: '12px' }}
                  >
                    <Download size={16} />
                    Download Credentials CSV
                  </button>
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#dc2626' }}>Errors</h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {uploadResult.errors.map((error, idx) => (
                      <div key={idx} style={{
                        padding: '12px',
                        marginBottom: '8px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fee2e2',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          Row {error.index + 1}: {error.code || 'ERROR'}
                        </div>
                        <div style={{ color: '#991b1b' }}>{error.error}</div>
                        {error.field && (
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            Field: {error.field}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mapping-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowResultsModal(false);
                  setTimeout(() => navigate("/drivers"), 1000);
                }}
                className="mapping-btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadDriversPage;
