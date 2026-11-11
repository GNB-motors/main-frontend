import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import AssignmentService from '@/services/DriverVehicleAssignmentService';
import {
  ASSIGNMENT_PERSON_FIELDS,
  assignmentRows,
  assignmentTable,
  isDidYouMean,
  reportRowView,
} from './bulkAssignmentFile';
import { splitFiles } from './photoDriverImport.js';
import { detectSheetMapping, detectedAssignmentColumns } from './employeeSheetPreview.js';
import PhotoDriverImportPanel from './PhotoDriverImportPanel.jsx';
import CandidateCards from './CandidateCards.jsx';
import safeText from '@/utils/redactSensitive';
import './BulkAssignVehiclesPanel.css';

const PERSON_COLUMNS = [
  { key: 'name', label: 'Name (optional)' },
  { key: 'phone', label: 'Mobile number (optional)' },
  { key: 'licence', label: 'DL number (optional)' },
  { key: 'aadhaar', label: 'Aadhaar number (optional)' },
];
const VEHICLE_LABEL = 'Vehicle registration *';
const EMPTY_COLUMNS = { name: '', phone: '', licence: '', aadhaar: '', vehicle: '' };
/** The manager's answer for a row the server was not sure about. */
const NONE_OF_THESE = 'none';

export default function BulkAssignVehiclesPanel({ onClose, onAssigned }) {
  const [table, setTable] = useState(null);
  const [fileName, setFileName] = useState('');
  const [columns, setColumns] = useState(EMPTY_COLUMNS);
  const [report, setReport] = useState(null);
  const [payload, setPayload] = useState(null);
  const [choices, setChoices] = useState({});
  const [picksVersion, setPicksVersion] = useState(0);
  const [previewedVersion, setPreviewedVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photoOpen, setPhotoOpen] = useState(false);
  const fileInput = useRef(null);

  const invalidate = () => {
    setReport(null);
    setPayload(null);
    setError('');
  };
  // A new mapping makes every earlier pick meaningless.
  const resetPicks = () => {
    setChoices({});
    setPicksVersion(0);
    setPreviewedVersion(0);
  };

  async function readFile(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    invalidate();
    setTable(null);
    setFileName('');
    setColumns(EMPTY_COLUMNS);
    resetPicks();
    setBusy(true);
    try {
      const { photos, sheets } = splitFiles(files);
      if (photos.length) {
        // Photos answer a different question: who was driving. The driver chart
        // confirms the periods.
        setPhotoOpen(true);
        return;
      }
      const file = sheets[0];
      if (!file) throw new Error('Choose an Excel (.xlsx, .xls) or CSV file, or photos.');
      if (!/\.(xlsx|xls|csv)$/i.test(file.name))
        throw new Error('Choose an Excel (.xlsx, .xls) or CSV file.');
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a file smaller than 10 MB.');
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
        header: 1,
        defval: '',
        raw: false,
      });
      const nextTable = assignmentTable(matrix);
      setTable(nextTable);
      setFileName(file.name);
      // The server may know which column is which. It is only a starting point —
      // every column can still be changed below.
      const detected = await detectSheetMapping(file, 'assignments');
      const detectedLabels = detectedAssignmentColumns(
        detected,
        nextTable.headers.map((header) => header.label),
      );
      const indexOf = (label) => {
        const found = nextTable.headers.find((header) => header.label === label);
        return found ? String(found.index) : '';
      };
      setColumns({
        name: indexOf(detectedLabels.name),
        phone: indexOf(detectedLabels.phone),
        licence: indexOf(detectedLabels.licence),
        aadhaar: indexOf(detectedLabels.aadhaar),
        vehicle: indexOf(detectedLabels.vehicle),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function pick(rowNumber, value) {
    setChoices((previous) => ({ ...previous, [rowNumber]: value }));
    setPicksVersion((version) => version + 1);
  }

  async function preview() {
    setBusy(true);
    setError('');
    setReport(null);
    setPayload(null);
    const picks = {};
    Object.entries(choices).forEach(([rowNumber, value]) => {
      if (value && value !== NONE_OF_THESE) picks[rowNumber] = value;
    });
    const nextPayload = {
      rows: assignmentRows(table.rows, columns, picks),
      effectiveAt: new Date().toISOString(),
      fileName,
    };
    try {
      setReport(await AssignmentService.previewBulk(nextPayload));
      setPayload(nextPayload);
      setPreviewedVersion(picksVersion);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    setBusy(true);
    setError('');
    try {
      const result = await AssignmentService.applyBulk(payload);
      setReport(result);
      setPayload(null);
      if (result?.counts?.assigned) onAssigned?.();
    } catch (err) {
      // Some rows may have committed before a network/server error. A fresh
      // preview is required; identical pairs will be skipped on the retry.
      setPayload(null);
      setError(
        `${err.response?.data?.message || err.message}. Some rows may have been assigned. Preview again to check before retrying.`,
      );
      onAssigned?.();
    } finally {
      setBusy(false);
    }
  }

  const personMapped = ASSIGNMENT_PERSON_FIELDS.some((key) => columns[key] !== '');
  const canPreview = !busy && !!table && columns.vehicle !== '' && personMapped;
  const reportRows = Array.isArray(report?.rows) ? report.rows : [];
  const counts = report?.counts || {};
  const unsureRows = reportRows.filter((row) => isDidYouMean(row));
  const unansweredRows = unsureRows.filter((row) => !choices[row.rowNumber]);
  const picksChanged = picksVersion !== previewedVersion;
  const canApply = !busy && !!payload && !unansweredRows.length && !picksChanged;

  const columnOptions = (disabledIndex) =>
    (table?.headers || []).map((header) => (
      <option
        key={header.index}
        value={header.index}
        disabled={String(header.index) === disabledIndex}
      >
        {header.label}
      </option>
    ));

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <SheetContent className="bulk-assign-panel">
        <SheetHeader className="bulk-assign-header">
          <div className="bulk-assign-heading">
            <SheetTitle>Bulk Assign Vehicles</SheetTitle>
            <SheetDescription>
              Assign existing employees to existing vehicles from Excel or CSV.
            </SheetDescription>
          </div>
          <button
            type="button"
            aria-label="Close bulk assignment"
            disabled={busy}
            onClick={onClose}
            className="bulk-assign-close"
          >
            <X size={18} />
          </button>
        </SheetHeader>
        <div className="bulk-assign-body" aria-busy={busy}>
          <section className="bulk-assign-section" aria-labelledby="bulk-assign-upload-title">
            <div className="bulk-assign-section-heading">
              <h3 id="bulk-assign-upload-title">1. Upload spreadsheet</h3>
              <p>Use the first sheet, with column headings in the first row. Maximum 500 rows.</p>
            </div>
            <div className="bulk-assign-upload">
              <FileSpreadsheet size={32} aria-hidden="true" />
              <p className="bulk-assign-file-name">
                {table ? `${fileName} · ${table.rows.length} rows` : 'Choose an Excel or CSV file'}
              </p>
              <p className="bulk-assign-hint">
                Supports .xlsx, .xls and .csv · Up to 10 MB · Photos of the register page, licence
                or ID work too
              </p>
              <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>
                <Upload size={16} aria-hidden="true" />
                {table ? 'Change file' : 'Choose file'}
              </Button>
            </div>
            <input
              ref={fileInput}
              type="file"
              aria-label="Excel, CSV or photos"
              accept=".xlsx,.xls,.csv,image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              onChange={readFile}
              className="bulk-assign-file-input"
              tabIndex={-1}
            />
          </section>
          {table && (
            <section className="bulk-assign-section" aria-labelledby="bulk-assign-mapping-title">
              <div className="bulk-assign-section-heading">
                <h3 id="bulk-assign-mapping-title">2. Map columns</h3>
                <p>
                  Tell us which column holds the driver’s name, mobile number, DL number and Aadhaar
                  number, and which one holds the vehicle registration. Map at least one person
                  column and the vehicle.
                </p>
              </div>
              <div className="bulk-assign-mapping">
                {PERSON_COLUMNS.map((field) => (
                  <label className="bulk-assign-field" key={field.key}>
                    <span>{field.label}</span>
                    <SearchableSelect
                      value={columns[field.key]}
                      disabled={busy}
                      onChange={(event) => {
                        setColumns((previous) => ({
                          ...previous,
                          [field.key]: event.target.value,
                        }));
                        invalidate();
                        resetPicks();
                      }}
                    >
                      <option value="">Choose column</option>
                      {columnOptions(columns.vehicle)}
                    </SearchableSelect>
                  </label>
                ))}
                <label className="bulk-assign-field">
                  <span>{VEHICLE_LABEL}</span>
                  <SearchableSelect
                    value={columns.vehicle}
                    disabled={busy}
                    onChange={(event) => {
                      const value = event.target.value;
                      setColumns((previous) => {
                        const next = { ...previous, vehicle: value };
                        // The vehicle column cannot also be a person column.
                        ASSIGNMENT_PERSON_FIELDS.forEach((key) => {
                          if (next[key] === value) next[key] = '';
                        });
                        return next;
                      });
                      invalidate();
                      resetPicks();
                    }}
                  >
                    <option value="">Choose column</option>
                    {columnOptions('')}
                  </SearchableSelect>
                </label>
              </div>
              <p className="bulk-assign-hint">
                We send every column you map, so the server can find the right driver. Aadhaar
                numbers are never shown in full.
              </p>
              <Button disabled={!canPreview} onClick={preview}>
                {busy ? 'Processing…' : 'Preview assignments'}
              </Button>
            </section>
          )}
          {error && (
            <p role="alert" className="bulk-assign-error">
              {error}
            </p>
          )}
          {report && (
            <section
              className="bulk-assign-section"
              aria-live="polite"
              aria-labelledby="bulk-assign-results-title"
            >
              <div className="bulk-assign-section-heading">
                <h3 id="bulk-assign-results-title">
                  {report.dryRun ? '3. Preview assignments' : 'Assignment results'}
                </h3>
                <p>
                  {counts.ready} ready · {counts.assigned} assigned · {counts.skipped} skipped ·{' '}
                  {counts.error} errors
                </p>
              </div>
              <p className="bulk-assign-hint">
                Effective from {new Date(report.effectiveAt).toLocaleString()}. Conflicting rows
                must be corrected before they can be assigned.
              </p>
              {unsureRows.length > 0 && (
                <p className="bulk-assign-hint">
                  We are not sure which driver some rows mean. Choose the right driver for each one,
                  or choose “None of these” to leave that row out, then preview again.
                </p>
              )}
              {/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Keyboard users need focus to scroll wide results. */}
              <div
                className="bulk-assign-table-scroll"
                role="region"
                aria-label="Assignment results"
                tabIndex={0}
              >
                <table className="bulk-assign-table">
                  <thead>
                    <tr>
                      {['Row', 'Driver', 'Vehicle', 'Status', 'Details'].map((heading) => (
                        <th key={heading} scope="col">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((row) => {
                      const view = reportRowView(row);
                      const details = [
                        view.phone,
                        view.licence,
                        view.aadhaar ? `Aadhaar ${view.aadhaar}` : '',
                      ].filter(Boolean);
                      return (
                        <tr key={view.rowNumber}>
                          <td>{view.rowNumber}</td>
                          <td>
                            {view.name || '—'}
                            {details.length > 0 && (
                              <div className="bulk-assign-employee-mobile">
                                {details.join(' · ')}
                              </div>
                            )}
                          </td>
                          <td>{view.vehicle}</td>
                          <td>
                            <span className="bulk-assign-status" data-status={view.status}>
                              {view.status}
                            </span>
                          </td>
                          <td>
                            {safeText(view.message)}
                            {isDidYouMean(row) && (
                              <div className="bulk-assign-did-you-mean">
                                <CandidateCards
                                  candidates={view.candidates}
                                  name={`candidate-${view.rowNumber}`}
                                  value={choices[view.rowNumber] || ''}
                                  disabled={busy}
                                  onChange={(value) => pick(view.rowNumber, value)}
                                  noneLabel="None of these / leave out"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
            </section>
          )}
        </div>
        <footer className="bulk-assign-footer">
          <p>Assignments start at the preview time. Existing allocations are preserved.</p>
          <div className="bulk-assign-actions">
            <Button variant="outline" disabled={busy} onClick={onClose}>
              Close
            </Button>
            {report?.dryRun && payload && counts.ready > 0 && (
              <Button disabled={!canApply} onClick={apply}>
                {busy ? 'Assigning…' : `Assign ${counts.ready} valid rows`}
              </Button>
            )}
          </div>
        </footer>
      </SheetContent>
      <PhotoDriverImportPanel open={photoOpen} onOpenChange={setPhotoOpen} context="assignments" />
    </Sheet>
  );
}
