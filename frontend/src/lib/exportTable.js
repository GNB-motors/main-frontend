/**
 * exportTable — self-describing Excel/CSV export for every fleet table.
 *
 * Hard rule: `xlsx` is imported with a DYNAMIC import() inside the handler.
 * A top-level import here would pull 424 KB into the entry chunk and break
 * the CI bundle guard. Do not add one.
 *
 * The sheet carries its filters, date range and generation time (meta) so an
 * exported file survives being emailed to someone who never saw the screen.
 * Numbers are written as numbers, ₹ columns get an Indian number format,
 * dates as real dates, and the header row is frozen.
 *
 *   await exportTable({
 *     rows,                               // all filtered rows, not the page
 *     columns: [{ key: 'reg', label: 'Vehicle' },
 *               { key: 'amount', label: 'Amount', type: 'currency' }],
 *     filename: 'fuel-spend-2026-09-06',
 *     format: 'xlsx',
 *     meta: { filters: [{ label: 'Period', value: '1–7 Sep' }], generatedAt: new Date() },
 *   });
 */

export function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Coerce a row value per its column type. Pure and total — never throws. */
export function cellValue(value, type = 'text') {
  if (value === null || value === undefined || value === '') return null;
  switch (type) {
    case 'number':
    case 'currency': {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case 'date': {
      const d = value instanceof Date ? value : new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    default:
      return String(value);
  }
}

/**
 * Build the self-describing preamble rows: one "Label: value" pair per meta
 * filter, then the generation time. A blank separator is appended only when
 * a generation row exists — otherwise the preamble would end in a dangling
 * empty line (contract pinned by unit tests).
 */
export function metaRows(meta = {}) {
  const rows = [];
  (meta.filters || []).forEach((f) => {
    if (f && f.label) rows.push([`${f.label}: ${f.value ?? '—'}`]);
  });
  if (meta.generatedAt) {
    const d = meta.generatedAt instanceof Date ? meta.generatedAt : new Date(meta.generatedAt);
    if (!Number.isNaN(d.getTime())) {
      rows.push([`Generated: ${d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`]);
      rows.push(['']);
    }
  }
  return rows;
}

function buildCsv(columns, rows, meta) {
  const head = columns.map((c) => escapeCsvCell(c.label));
  const body = rows.map((r) => columns.map((c) => escapeCsvCell(cellValue(r?.[c.key], c.type))));
  const lines = [...metaRows(meta), head, ...body]
    .map((line) => (Array.isArray(line) ? line.join(',') : line))
    .join('\r\n');
  return lines;
}

function triggerDownload(content, filename, mimeType, binary = false) {
  const blob = binary
    ? new Blob([content], { type: mimeType })
    : new Blob(['﻿', content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function buildXlsx(columns, rows, meta) {
  const XLSX = await import('xlsx');
  const header = columns.map((c) => c.label);
  const body = rows.map((r) => columns.map((c) => cellValue(r?.[c.key], c.type)));
  const sheetData = [...metaRows(meta), header, ...body];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const headerRowIndex = metaRows(meta).length;
  ws['!freeze'] = { xSplit: 0, ySplit: headerRowIndex + 1 };

  // Column widths + number formats, sized from content.
  ws['!cols'] = columns.map((c) => {
    const values = rows.slice(0, 200).map((r) => cellValue(r?.[c.key], c.type));
    const widest = Math.max(
      String(c.label).length,
      ...values.map((v) => (v instanceof Date ? 12 : String(v ?? '').length)),
    );
    return { wch: Math.min(Math.max(widest + 2, 8), 42) };
  });

  // Apply ₹ / number formats to typed columns.
  const range = XLSX.utils.decode_range(ws['!ref']);
  columns.forEach((c, i) => {
    if (c.type !== 'number' && c.type !== 'currency' && c.type !== 'date') return;
    for (let r = headerRowIndex + 1; r <= range.e.r; r += 1) {
      const addr = XLSX.utils.encode_cell({ r, c: i });
      const cell = ws[addr];
      if (!cell) continue;
      if (c.type === 'date') cell.z = 'dd mmm yyyy';
      else if (c.type === 'currency') cell.z = '₹#,##,##0';
      else cell.z = '#,##0.##';
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Export');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export default async function exportTable({ rows = [], columns = [], filename = 'export', format = 'xlsx', meta = {} } = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const stamp = meta.generatedAt instanceof Date ? meta.generatedAt : new Date();
  const base = `${filename}-${stamp.toISOString().slice(0, 10)}`;

  if (format === 'csv') {
    triggerDownload(buildCsv(columns, safeRows, meta), `${base}.csv`, 'text/csv');
    return { format, rows: safeRows.length };
  }

  const buffer = await buildXlsx(columns, safeRows, meta);
  triggerDownload(buffer, `${base}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true);
  return { format: 'xlsx', rows: safeRows.length };
}
