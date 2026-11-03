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
import { assignmentTable, assignmentRows } from './bulkAssignmentFile';
import './BulkAssignVehiclesPanel.css';

export default function BulkAssignVehiclesPanel({ onClose, onAssigned }) {
  const [table, setTable] = useState(null);
  const [fileName, setFileName] = useState('');
  const [employeeColumn, setEmployeeColumn] = useState('');
  const [vehicleColumn, setVehicleColumn] = useState('');
  const [report, setReport] = useState(null);
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const invalidate = () => {
    setReport(null);
    setPayload(null);
    setError('');
  };

  async function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    invalidate();
    setTable(null);
    setFileName('');
    setEmployeeColumn('');
    setVehicleColumn('');
    setBusy(true);
    try {
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
      setTable(assignmentTable(matrix));
      setFileName(file.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function preview() {
    setBusy(true);
    setError('');
    setReport(null);
    setPayload(null);
    const nextPayload = {
      rows: assignmentRows(table.rows, employeeColumn, vehicleColumn),
      effectiveAt: new Date().toISOString(),
      fileName,
    };
    try {
      setReport(await AssignmentService.previewBulk(nextPayload));
      setPayload(nextPayload);
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
      if (result.counts.assigned) onAssigned?.();
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
              <p className="bulk-assign-hint">Supports .xlsx, .xls and .csv · Up to 10 MB</p>
              <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>
                <Upload size={16} aria-hidden="true" />
                {table ? 'Change file' : 'Choose file'}
              </Button>
            </div>
            <input
              ref={fileInput}
              type="file"
              aria-label="Excel or CSV file"
              accept=".xlsx,.xls,.csv"
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
                  Choose the employee mobile and vehicle registration columns. Other columns are
                  ignored.
                </p>
              </div>
              <div className="bulk-assign-mapping">
                <label className="bulk-assign-field">
                  <span>Employee mobile number *</span>
                  <select
                    value={employeeColumn}
                    disabled={busy}
                    onChange={(e) => {
                      setEmployeeColumn(e.target.value);
                      invalidate();
                    }}
                  >
                    <option value="">Choose column</option>
                    {table.headers.map((h) => (
                      <option
                        key={h.index}
                        value={h.index}
                        disabled={String(h.index) === vehicleColumn}
                      >
                        {h.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="bulk-assign-field">
                  <span>Vehicle registration *</span>
                  <select
                    value={vehicleColumn}
                    disabled={busy}
                    onChange={(e) => {
                      setVehicleColumn(e.target.value);
                      invalidate();
                    }}
                  >
                    <option value="">Choose column</option>
                    {table.headers.map((h) => (
                      <option
                        key={h.index}
                        value={h.index}
                        disabled={String(h.index) === employeeColumn}
                      >
                        {h.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="bulk-assign-hint">
                Use the employee’s registered mobile number (10-digit Indian or international
                format). Names alone cannot identify employees reliably.
              </p>
              <Button
                disabled={
                  busy ||
                  employeeColumn === '' ||
                  vehicleColumn === '' ||
                  employeeColumn === vehicleColumn
                }
                onClick={preview}
              >
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
                  {report.counts.ready} ready · {report.counts.assigned} assigned ·{' '}
                  {report.counts.skipped} skipped · {report.counts.error} errors
                </p>
              </div>
              <p className="bulk-assign-hint">
                Effective from {new Date(report.effectiveAt).toLocaleString()}. Conflicting rows
                must be corrected before they can be assigned.
              </p>
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
                      {['Row', 'Employee', 'Vehicle', 'Status', 'Details'].map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        <td>
                          {row.employeeName || row.employee}
                          <div className="bulk-assign-employee-mobile">
                            {row.employeeName ? row.employee : ''}
                          </div>
                        </td>
                        <td>{row.registrationNumber || row.vehicle}</td>
                        <td>
                          <span className="bulk-assign-status" data-status={row.status}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.message}</td>
                      </tr>
                    ))}
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
            {report?.dryRun && payload && report.counts.ready > 0 && (
              <Button disabled={busy} onClick={apply}>
                {busy ? 'Assigning…' : `Assign ${report.counts.ready} valid rows`}
              </Button>
            )}
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
