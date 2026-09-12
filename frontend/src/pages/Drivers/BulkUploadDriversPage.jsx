import React, { useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getThemeCSS } from '../../utils/colorTheme.js';
import '../Profile/BulkUploadVehiclesPage.css';
import { DriverService } from './DriverService.jsx';
import NewButton from '@/components/ui/NewButton';
import PageShell from '../../components/ui/PageShell';
import BulkEmployeeMappingSidePanel from './Component/BulkEmployeeMappingSidePanel.jsx';
import BulkUploadResultsSidePanel from './Component/BulkUploadResultsSidePanel.jsx';
import BulkUploadFileStep from './Component/BulkUploadFileStep.jsx';
import BulkUploadReviewTable from './Component/BulkUploadReviewTable.jsx';
import BulkUploadRowErrorModal from './Component/BulkUploadRowErrorModal.jsx';
import { checkPayloadSize } from '../../utils/bulkEmployees.js';
import {
  applyColumnMapping,
  filterRowsByStatus,
  summarizeRowErrors,
  buildEmployeesPayload,
  buildCredentialsCsv,
  MAX_ROWS,
} from './bulkUploadFlow.js';

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
  const [fileName, setFileName] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedRowForError, setSelectedRowForError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
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
    setFileName('');
    setFilterStatus('all');
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
          const workbook = XLSX.read(text, { type: 'string' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (rawData.length > 0) {
            headers = Object.keys(rawData[0]);
          }
        } else {
          // Parse XLSX/XLS
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (rawData.length > 0) {
            headers = Object.keys(rawData[0]);
          }
        }

        if (rawData.length === 0) {
          toast.warn('No rows detected in the file.');
          resetState();
          setIsParsing(false);
          return;
        }

        // Limit to MAX_ROWS
        if (rawData.length > MAX_ROWS) {
          toast.warn(
            `File has ${rawData.length} rows. Only the first ${MAX_ROWS} will be processed.`,
          );
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
      toast.error('Please upload a .xlsx, .xls, or .csv file');
      return;
    }

    setFileName(file.name);
    parseFile(file);
  };

  const handleMappingSave = (mapping) => {
    setColumnMapping(mapping);
    setShowMappingModal(false);
    const {
      normalized,
      errors,
      passwordMap: newPasswordMap,
    } = applyColumnMapping(rawRows, mapping);
    setNormalizedRows(normalized);
    setRowErrors(errors);
    setPasswordMap(newPasswordMap);
  };

  const handleClearRows = () => {
    resetState();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasErrors = rowErrors.some((error) => error && Object.keys(error).length > 0);
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    if (normalizedRows.length === 0) {
      toast.error('No rows to submit');
      return;
    }

    // Check payload size
    const sizeCheck = checkPayloadSize(normalizedRows, 1);
    if (sizeCheck.exceeds) {
      toast.error(
        `Payload size (${sizeCheck.sizeMB}MB) exceeds limit (${sizeCheck.maxMB}MB). Please reduce the number of rows.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const employees = buildEmployeesPayload(normalizedRows);

      const resp = await DriverService.addBulkDrivers(employees);

      // Normalize response
      const respData = resp && resp.data ? resp.data : resp;
      setUploadResult(respData);
      setShowResultsModal(true);

      const createdCount = respData?.createdCount ?? 0;
      const errorCount = respData?.errorCount ?? respData?.errors?.length ?? 0;

      toast.success(`Upload completed: ${createdCount} created, ${errorCount} error(s)`);
    } catch (error) {
      console.error('Submission error:', error);

      // Handle 413 specifically
      if (error.response?.status === 413) {
        toast.error(
          'Payload too large. Please reduce the number of rows or split into multiple uploads.',
        );
      } else if (
        error.code === 'ECONNABORTED' ||
        error.message?.includes('timeout') ||
        error.detail?.includes('timeout')
      ) {
        toast.error(
          'Request timed out. The upload may still be processing on the server. Please check the employees list or try again with fewer rows.',
        );
      } else {
        const errorMsg =
          error.response?.data?.message ||
          error.response?.data?.detail ||
          error.detail ||
          error.message ||
          'Upload failed';
        toast.error(errorMsg);
      }
      setUploadResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCredentials = () => {
    if (!uploadResult?.created) return;

    const { csvContent, fileName: csvFileName } = buildCredentialsCsv(
      uploadResult.created,
      passwordMap,
    );

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Credentials CSV downloaded');
  };

  const filteredRows = filterRowsByStatus(normalizedRows, rowErrors, filterStatus);
  const { errorCount } = summarizeRowErrors(normalizedRows, rowErrors);

  const openFilePicker = () => {
    if (isParsing || isSubmitting) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="bulk-upload-vehicles-container" style={themeColors}>
      <PageShell
        title="Bulk Upload Employees"
        subtitle="Upload employee data via .xlsx or .csv file. Map columns and preview before submitting."
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
          <div className="bulk-upload-card">
            <BulkUploadFileStep
              fileName={fileName}
              recordCount={normalizedRows.length}
              isParsing={isParsing}
              isSubmitting={isSubmitting}
              onSelectFile={openFilePicker}
              onClearFile={handleClearRows}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
            />

            {normalizedRows.length > 0 && (
              <BulkUploadReviewTable
                filteredRows={filteredRows}
                normalizedRows={normalizedRows}
                rowErrors={rowErrors}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                onRowClick={setSelectedRowForError}
              />
            )}

            {normalizedRows.length > 0 && (
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
          </div>
        </form>
      </PageShell>

      {/* Mapping Side Panel */}
      <BulkEmployeeMappingSidePanel
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

      {/* Row Error Details Modal */}
      <BulkUploadRowErrorModal
        selected={selectedRowForError}
        onClose={() => setSelectedRowForError(null)}
      />

      {/* Upload Results Side Panel */}
      <BulkUploadResultsSidePanel
        isOpen={showResultsModal}
        uploadResult={uploadResult}
        passwordMap={passwordMap}
        onDownloadCredentials={handleDownloadCredentials}
        onClose={() => {
          setShowResultsModal(false);
          setTimeout(() => navigate('/drivers'), 1000);
        }}
      />
    </div>
  );
};

export default BulkUploadDriversPage;
