import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
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
      <SheetContent className="w-full !max-w-[min(960px,96vw)] gap-0 p-0">
        <SheetHeader>
          <div>
            <SheetTitle>Bulk Assign Vehicles</SheetTitle>
            <SheetDescription className="mt-2">
              Assign existing employees to existing vehicles from Excel or CSV.
            </SheetDescription>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
            className="rounded p-2"
          >
            <X size={18} />
          </button>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-5 p-6">
          <p className="text-sm text-muted-foreground">
            Use the first sheet, with column headings in the first row. Map employee mobile number
            and vehicle registration; all other columns are ignored. Maximum 500 rows. Assignments
            start at the preview time. Existing allocations are preserved.
          </p>
          <label className="block space-y-2 text-sm font-medium">
            <span>Excel or CSV file</span>
            <input
              ref={fileInput}
              type="file"
              aria-label="Excel or CSV file"
              accept=".xlsx,.xls,.csv"
              disabled={busy}
              onChange={readFile}
              className="block w-full rounded border p-3"
            />
          </label>
          {table && (
            <>
              <p className="text-sm">
                {fileName} · {table.rows.length} rows
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <span>Employee mobile number *</span>
                  <select
                    className="block w-full rounded border p-2"
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
                <label className="space-y-2 text-sm font-medium">
                  <span>Vehicle registration *</span>
                  <select
                    className="block w-full rounded border p-2"
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
              <p className="text-sm text-muted-foreground">
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
            </>
          )}
          {error && (
            <p
              role="alert"
              className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          {report && (
            <div className="space-y-4" aria-live="polite">
              <p className="text-sm font-medium">
                {report.dryRun ? 'Preview' : 'Upload results'}: {report.counts.ready} ready ·{' '}
                {report.counts.assigned} assigned · {report.counts.skipped} skipped ·{' '}
                {report.counts.error} errors
              </p>
              <p className="text-sm">
                Effective from {new Date(report.effectiveAt).toLocaleString()}. Conflicting rows
                must be corrected before they can be assigned.
              </p>
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {['Row', 'Employee', 'Vehicle', 'Status', 'Details'].map((h) => (
                        <th key={h} scope="col" className="p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={row.rowNumber} className="border-t">
                        <td className="p-3">{row.rowNumber}</td>
                        <td className="p-3">
                          {row.employeeName || row.employee}
                          <div className="text-xs text-muted-foreground">
                            {row.employeeName ? row.employee : ''}
                          </div>
                        </td>
                        <td className="p-3">{row.registrationNumber || row.vehicle}</td>
                        <td className="p-3 capitalize">{row.status}</td>
                        <td className="p-3">{row.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {report.dryRun && payload && report.counts.ready > 0 && (
                <Button disabled={busy} onClick={apply}>
                  {busy ? 'Assigning…' : `Assign ${report.counts.ready} valid rows`}
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
