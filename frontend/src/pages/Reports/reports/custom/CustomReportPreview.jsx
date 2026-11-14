import React, { useMemo } from 'react';
import {
  Download,
  FileText,
  Printer,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Info,
} from 'lucide-react';
import DataTable from '../../../../components/ui/DataTable';
import ExportButton from '../../../../components/ui/ExportButton';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../../utils/formatters';
import { formatInIST } from '../../../../utils/dateUtils';
import { FRONTEND_FIELD_MAP } from './customReportFields';

function formatFallbackLabel(key) {
  if (!key) return '';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

const STATUS_ICONS = {
  VALID: { label: 'Valid', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ACTIVE: { label: 'Active', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  EXPIRED: { label: 'Expired', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  SUSPENDED: { label: 'Suspended', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  MISSING: { label: 'Missing', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  ONGOING: { label: 'Ongoing', color: 'text-sky-700 bg-sky-50 border-sky-200' },
};

function StatusBadge({ value }) {
  if (!value || value === '—') return <span>—</span>;
  const cfg = STATUS_ICONS[String(value).toUpperCase()] || {
    label: value,
    color: 'text-slate-700 bg-slate-100 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

export default function CustomReportPreview({
  config = {},
  catalog = {},
  reportData = null,
  loading = false,
  error = null,
  onRetry = null,
  onPageChange = null,
}) {
  const fields = useMemo(() => config.fields || [], [config.fields]);
  const fieldMap = useMemo(() => {
    const map = new Map(FRONTEND_FIELD_MAP);
    (catalog.fields || []).forEach((f) => map.set(f.key, f));
    return map;
  }, [catalog.fields]);

  const rows = useMemo(() => {
    if (Array.isArray(reportData?.data)) return reportData.data;
    if (Array.isArray(reportData?.data?.items)) return reportData.data.items;
    if (Array.isArray(reportData?.items)) return reportData.items;
    if (Array.isArray(reportData?.data?.rows)) return reportData.data.rows;
    if (Array.isArray(reportData)) return reportData;
    return [];
  }, [reportData]);

  const meta = useMemo(() => {
    return (
      reportData?.meta ||
      reportData?.data?.pagination || {
        page: 1,
        limit: 20,
        total: rows.length,
        totalPages: 1,
      }
    );
  }, [reportData, rows.length]);

  const summary = useMemo(() => {
    return reportData?.summary || reportData?.data?.summary || {};
  }, [reportData]);

  // Build DataTable columns dynamically from selected fields
  const columns = useMemo(() => {
    return fields.map((fieldKey) => {
      const fieldDef = fieldMap.get(fieldKey) || {
        label: formatFallbackLabel(fieldKey),
        type: 'text',
      };
      return {
        key: fieldKey,
        label: fieldDef.label || formatFallbackLabel(fieldKey),
        type: fieldDef.type,
        align: fieldDef.type === 'number' || fieldDef.type === 'currency' ? 'right' : 'left',
        render: (row) => {
          const val = row[fieldKey];
          if (val === null || val === undefined) return '—';
          if (fieldDef.type === 'currency') return formatINR(val);
          if (fieldDef.type === 'number') {
            if (fieldDef.unit === 'L') return `${formatLitres(val)}`;
            if (fieldDef.unit === 'KM') return `${formatKm(val)}`;
            if (fieldDef.unit === 'KM/L') return `${formatNum(val, { decimals: 2 })} km/L`;
            if (fieldDef.unit === '%') return `${formatNum(val, { decimals: 1 })}%`;
            return formatNum(val);
          }
          if (fieldDef.type === 'date') {
            return formatInIST(val, 'DD MMM YYYY') || String(val);
          }
          if (fieldDef.type === 'badge') {
            return <StatusBadge value={val} />;
          }
          return String(val);
        },
      };
    });
  }, [fields, fieldMap]);

  // Build export columns
  const exportColumns = useMemo(() => {
    return fields.map((fieldKey) => {
      const fieldDef = fieldMap.get(fieldKey) || {
        label: formatFallbackLabel(fieldKey),
        type: 'text',
      };
      return {
        key: fieldKey,
        label: fieldDef.label || formatFallbackLabel(fieldKey),
        type:
          fieldDef.type === 'currency'
            ? 'currency'
            : fieldDef.type === 'number'
              ? 'number'
              : fieldDef.type === 'date'
                ? 'date'
                : 'text',
      };
    });
  }, [fields, fieldMap]);

  // Handle PDF / Print Export
  const handlePrintPdf = () => {
    const printableWindow = window.open('', '_blank');
    if (!printableWindow) return;

    const tableHeaders = columns
      .map(
        (c) =>
          `<th style="padding: 8px 12px; border-bottom: 2px solid #cbd5e1; text-align: ${c.align || 'left'}; font-size: 11px; text-transform: uppercase;">${c.label}</th>`,
      )
      .join('');

    const tableRows = rows
      .map((r) => {
        const cells = columns
          .map((c) => {
            const val = r[c.key];
            const display = val != null ? (c.type === 'currency' ? `₹${val}` : String(val)) : '—';
            return `<td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: ${c.align || 'left'}; font-size: 12px;">${display}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    printableWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${config.name || 'Custom Report'} - GNB Motors</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { font-size: 12px; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${config.name || 'Custom Report'}</h1>
          <p>Generated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST · GNB Motors</p>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printableWindow.document.close();
    printableWindow.focus();
    setTimeout(() => {
      printableWindow.print();
    }, 250);
  };

  return (
    <div className="custom-preview-container flex flex-col gap-4">
      {/* Aggregations KPI Bar if any summary exists */}
      {Object.keys(summary).length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          {Object.entries(summary).map(([key, val]) => {
            const [fKey, op] = key.split('_');
            const fieldDef = fieldMap.get(fKey) || { label: fKey };
            const opLabel = op === 'SUM' ? 'Total' : op === 'AVG' ? 'Average' : 'Count of';
            const displayVal =
              fieldDef.type === 'currency'
                ? formatINR(val)
                : fieldDef.unit === 'L'
                  ? `${formatLitres(val)}`
                  : fieldDef.unit === 'KM'
                    ? `${formatKm(val)}`
                    : fieldDef.unit === 'KM/L'
                      ? `${formatNum(val, { decimals: 2 })} km/L`
                      : formatNum(val);

            return (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-slate-500 font-medium">
                  {opLabel} {fieldDef.label}
                </span>
                <span className="text-lg font-bold text-slate-900">{displayVal}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Toolbar with record count & Exports */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-slate-600 font-medium">
          Showing <strong>{rows.length}</strong> of <strong>{meta.total}</strong> records
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary-action !py-1.5 !px-3 !text-xs"
            onClick={handlePrintPdf}
            disabled={!rows.length || loading}
          >
            <Printer size={13} />
            Print / PDF
          </button>
          <ExportButton
            rows={rows}
            columns={exportColumns}
            filename={
              config.name ? config.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'custom-report'
            }
            disabled={!rows.length || loading}
            buttonClass="btn-secondary-action !py-1.5 !px-3 !text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={onRetry}
        showing={rows.length}
        total={meta.total}
        emptyTitle="No records match this custom query"
        emptyHint="Try adjusting your date range, clearing filters, or selecting different fields."
      />

      {/* Pagination Footer */}
      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="col-btn disabled:opacity-40"
              disabled={meta.page <= 1 || loading}
              onClick={() => onPageChange?.(meta.page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="col-btn disabled:opacity-40"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => onPageChange?.(meta.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
