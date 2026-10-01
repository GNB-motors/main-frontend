import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

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

/**
 * A server CSV as a real .xlsx workbook. Cells stay text (raw) so dd/mm/yyyy
 * dates are never re-read as US mm/dd; plain numbers are turned back into
 * numeric cells so the sheet still sums.
 *
 * @param {string} csvText
 * @returns {ArrayBuffer}
 */
export function csvTextToXlsxBuffer(csvText) {
  const workbook = XLSX.read(csvText, { type: 'string', raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  Object.keys(sheet).forEach((addr) => {
    if (addr.startsWith('!')) return;
    const cell = sheet[addr];
    if (cell.t === 's' && /^-?\d+(\.\d+)?$/.test(cell.v)) {
      cell.t = 'n';
      cell.v = Number(cell.v);
    }
  });
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

export function getReportExportMime(extension = 'csv') {
  return extension === 'xlsx'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
      if (extension === 'xlsx') {
        // Export endpoints only produce CSV; a CSV saved under an .xlsx name
        // opens as a corrupt file, so convert it into a real workbook.
        const text = blob instanceof Blob ? await blob.text() : String(blob);
        content = new Blob([csvTextToXlsxBuffer(text)], { type: mimeType });
      } else {
        content = blob instanceof Blob ? blob : new Blob([blob], { type: mimeType });
      }
    } else if (Array.isArray(headers) && Array.isArray(rows) && typeof mapRow === 'function') {
      const rowArrays = rows.map((row) => mapRow(row));

      if (extension === 'xlsx') {
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rowArrays]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        content = new Blob([excelBuffer], { type: mimeType });
      } else {
        content = buildCsvString(headers, rowArrays);
      }
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
