import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { InsuranceService } from '../InsuranceService';
import Dropdown from '../components/Dropdown';

const MAX_ROWS = 1000;

// Target lead fields → accepted header aliases (normalized: lowercase, no spaces/underscores).
const FIELD_DEFS = [
  { key: 'customerName', label: 'Customer Name', required: true, aliases: ['customername', 'name', 'fullname'] },
  { key: 'mobileNumber', label: 'Mobile Number', required: true, aliases: ['mobilenumber', 'mobile', 'phone', 'contact'] },
  { key: 'email', label: 'Email', aliases: ['email', 'emailaddress'] },
  { key: 'companyName', label: 'Company', aliases: ['companyname', 'company'] },
  { key: 'vehicleNumber', label: 'Vehicle Number', aliases: ['vehiclenumber', 'vehicle', 'vehicleno', 'regno'] },
  { key: 'remarks', label: 'Remarks', aliases: ['remarks', 'notes', 'note'] },
  { key: 'priority', label: 'Priority', aliases: ['priority', 'strength'] },
];

const norm = (s) => String(s || '').toLowerCase().replace(/[\s_-]/g, '');

export default function BulkImportLeadsPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [columns, setColumns] = useState([]); // source headers
  const [rows, setRows] = useState([]); // raw row objects
  const [mapping, setMapping] = useState({}); // fieldKey -> source header
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const downloadSample = () => {
    const headers = FIELD_DEFS.map((f) => f.label);
    const example = ['Rajesh Kumar', '9876543210', 'rajesh@example.com', 'Kumar Logistics', 'MH12AB1234', 'Interested in motor policy', 'Hot'];
    const csv = `${headers.join(',')}\n${example.join(',')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insurance-leads-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const autoMap = (headers) => {
    const m = {};
    FIELD_DEFS.forEach((f) => {
      const match = headers.find((h) => f.aliases.includes(norm(h)));
      if (match) m[f.key] = match;
    });
    return m;
  };

  const onFile = (file) => {
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        const wb = isCsv
          ? XLSX.read(evt.target.result, { type: 'string' })
          : XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        let data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!data.length) {
          toast.warn('No rows detected in the file.');
          return;
        }
        if (data.length > MAX_ROWS) {
          toast.warn(`File has ${data.length} rows. Only the first ${MAX_ROWS} will be imported.`);
          data = data.slice(0, MAX_ROWS);
        }
        const headers = Object.keys(data[0]);
        setColumns(headers);
        setRows(data);
        setMapping(autoMap(headers));
      } catch (err) {
        toast.error(`Failed to parse file: ${err.message}`);
      }
    };
    if (file.name.toLowerCase().endsWith('.csv')) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  };

  const buildPayload = () =>
    rows
      .map((r) => {
        const lead = {};
        FIELD_DEFS.forEach((f) => {
          const src = mapping[f.key];
          if (src && r[src] !== '' && r[src] != null) lead[f.key] = String(r[src]).trim();
        });
        return lead;
      })
      .filter((l) => l.customerName && l.mobileNumber);

  const runImport = async () => {
    if (!mapping.customerName || !mapping.mobileNumber) {
      toast.error('Map both Customer Name and Mobile Number before importing.');
      return;
    }
    const payload = buildPayload();
    if (!payload.length) {
      toast.error('No valid rows to import (each row needs a name and mobile number).');
      return;
    }
    setImporting(true);
    try {
      const res = await InsuranceService.bulkCreateLeads(payload);
      setResult(res);
      toast.success(`${res.createdCount} lead${res.createdCount === 1 ? '' : 's'} imported`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button onClick={() => navigate('/insurance/leads')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to Leads
      </button>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Bulk Import Leads</h1>
          <p className="mt-0.5 text-sm text-slate-500">Upload a CSV/Excel file, map columns, and import. Imported leads start as New.</p>
        </div>
        <button onClick={downloadSample} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Download size={15} /> Sample CSV
        </button>
      </div>

      {/* Upload zone */}
      <button
        onClick={() => fileRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-slate-500 hover:border-blue-300 hover:bg-blue-50/30"
      >
        <UploadCloud size={28} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-600">Click to choose a CSV or Excel file</span>
        <span className="text-xs text-slate-400">Up to {MAX_ROWS} rows</span>
      </button>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {/* Mapping + preview */}
      {columns.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Map columns</h3>
          <p className="mt-0.5 text-xs text-slate-400">{rows.length} rows detected. We matched columns automatically — adjust if needed.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELD_DEFS.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-slate-600">
                  {f.label}{f.required && <span className="text-red-500"> *</span>}
                </label>
                <div className="w-44">
                  <Dropdown
                    size="sm"
                    align="right"
                    value={mapping[f.key] || ''}
                    onChange={(v) => setMapping((m) => ({ ...m, [f.key]: v }))}
                    placeholder="— skip —"
                    options={[{ value: '', label: '— skip —' }, ...columns.map((c) => ({ value: c, label: c }))]}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  {FIELD_DEFS.filter((f) => mapping[f.key]).map((f) => <th key={f.key} className="px-3 py-2 font-semibold">{f.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>
                    {FIELD_DEFS.filter((f) => mapping[f.key]).map((f) => (
                      <td key={f.key} className="px-3 py-2 text-slate-600">{String(r[mapping[f.key]] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={runImport} disabled={importing} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {importing ? 'Importing…' : `Import ${buildPayload().length} leads`}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="text-sm font-bold text-slate-800">{result.createdCount} imported</span>
            {result.errors?.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                <AlertTriangle size={15} /> {result.errors.length} skipped
              </span>
            )}
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-xs text-amber-800">
              {result.errors.map((e, i) => (
                <div key={i}>Row {e.row} ({e.customerName}): {e.error}</div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button onClick={() => navigate('/insurance/leads')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              View Leads
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
