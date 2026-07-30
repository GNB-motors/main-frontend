import dayjs from 'dayjs';
import { toast } from 'react-toastify';

/**
 * Shared filtered-report CSV export helpers.
 *
 * Prefer the API path when the backend has a filter-aware `/export` endpoint.
 * Use the rows path when the table already holds the filtered dataset in memory.
 *
 * @example API export (Mileage Report)
 * await exportFilteredReportCsv({
 *   fetchExport: (filters) => ReportsService.exportReportCsv('api/reports/mileage-intervals/export', filters),
 *   filters: { startDate, vehicleId },
 *   filenamePrefix: 'mileage_interval_report',
 * });
 *
 * @example Client rows export (Driver Report)
 * await exportFilteredReportCsv({
 *   headers: ['Driver Name', 'Refuels'],
 *   rows: filteredRows,
 *   mapRow: (row) => [row.driverName, row.totalRefuels],
 *   filenamePrefix: 'driver_report',
 * });
 */

export function escapeCsvCell(value) {
  if (value == null || value === '') return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvString(headers, rowArrays) {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rowArrays.map((cells) => cells.map(escapeCsvCell).join(',')),
  ];
  return lines.join('\n');
}

export function getReportExportMime(extension = 'csv') {
  return extension === 'xlsx'
    ? 'application/vnd.ms-excel;charset=utf-8;'
    : 'text/csv;charset=utf-8;';
}

export function triggerFileDownload(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export a filtered report as CSV/XLSX.
 *
 * Provide either:
 * - `fetchExport` (+ optional `filters`) for server-side filtered CSV, or
 * - `headers` + `rows` + `mapRow` for client-side export of an already-filtered list.
 *
 * @returns {Promise<boolean>} true on success
 */
export async function exportFilteredReportCsv({
  fetchExport,
  filters = {},
  headers,
  rows,
  mapRow,
  filenamePrefix,
  extension = 'csv',
  successMessage = 'Filtered report exported',
  errorMessage = 'Could not export report.',
  showToast = true,
} = {}) {
  if (!filenamePrefix) {
    throw new Error('exportFilteredReportCsv requires filenamePrefix');
  }

  const mimeType = getReportExportMime(extension);
  const filename = `${filenamePrefix}_${dayjs().format('YYYY-MM-DD')}.${extension}`;

  try {
    let content;

    if (typeof fetchExport === 'function') {
      const blob = await fetchExport(filters || {});
      content = blob instanceof Blob ? blob : new Blob([blob], { type: mimeType });
    } else if (Array.isArray(headers) && Array.isArray(rows) && typeof mapRow === 'function') {
      const rowArrays = rows.map((row) => mapRow(row));
      content = buildCsvString(headers, rowArrays);
    } else {
      throw new Error('Provide fetchExport, or headers + rows + mapRow');
    }

    triggerFileDownload(content, filename, mimeType);
    if (showToast) toast.success(successMessage);
    return true;
  } catch (err) {
    console.error('Filtered report export failed:', err);
    if (showToast) {
      toast.error(err?.detail || err?.message || errorMessage);
    }
    throw err;
  }
}
