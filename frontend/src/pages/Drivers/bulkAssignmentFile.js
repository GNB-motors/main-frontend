export const MAX_ASSIGNMENT_ROWS = 500;

/** The person columns a sheet may carry. Any one of them can point at a driver. */
export const ASSIGNMENT_PERSON_FIELDS = ['name', 'phone', 'licence', 'aadhaar'];

/** The server's code for "we are not sure which driver this row means". */
export const DID_YOU_MEAN = 'did_you_mean';

// Keep physical spreadsheet row numbers so errors point back to the file.
export function assignmentTable(matrix) {
  const headers = (matrix[0] || []).map((cell, index) => ({
    index,
    label: String(cell ?? '').trim() || `Column ${index + 1}`,
  }));
  const rows = matrix
    .slice(1)
    .map((cells, i) => ({ cells, rowNumber: i + 2 }))
    .filter(({ cells }) => cells.some((cell) => String(cell ?? '').trim()));
  if (!headers.length || !rows.length)
    throw new Error('The first sheet must contain a header and at least one data row.');
  if (rows.length > MAX_ASSIGNMENT_ROWS)
    throw new Error(
      `Upload up to ${MAX_ASSIGNMENT_ROWS} rows at a time. Split this file into smaller uploads.`,
    );
  return { headers, rows };
}

/** One mapped column out of a spreadsheet row. */
function cell(cells, column) {
  if (column === '' || column === null || column === undefined) return '';
  return String(cells[Number(column)] ?? '').trim();
}

/**
 * The rows the server gets: every person column the sheet has, the vehicle,
 * the physical row number, and the driver the manager picked when there is one.
 *
 * @param {Array<{cells: unknown[], rowNumber: number}>} rows
 * @param {{name?: string, phone?: string, licence?: string, aadhaar?: string, vehicle?: string}} columns
 * @param {Record<number, string>} picks - row number to the chosen driver id
 */
export function assignmentRows(rows, columns = {}, picks = {}) {
  return rows.map(({ cells, rowNumber }) => {
    const row = {
      rowNumber,
      name: cell(cells, columns.name),
      phone: cell(cells, columns.phone),
      licence: cell(cells, columns.licence),
      aadhaar: cell(cells, columns.aadhaar),
      vehicle: cell(cells, columns.vehicle),
    };
    const userId = picks?.[rowNumber];
    if (userId) row.userId = String(userId);
    return row;
  });
}

/**
 * An Aadhaar number is never shown in full — only its last four digits.
 */
export function maskAadhaar(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (text.length <= 4) return 'XXXX';
  return `XXXX${text.slice(-4)}`;
}

/** Is this a row the server could not match without help? */
export function isDidYouMean(row = {}) {
  return (row.code || row.errorCode || '') === DID_YOU_MEAN;
}

/** The fields a candidate matched on, whatever the server calls them. */
function matchedFields(candidate = {}) {
  const raw = candidate.matched || candidate.matchedFields || candidate.matchedOn || [];
  if (Array.isArray(raw)) return raw.map((field) => String(field)).filter(Boolean);
  if (typeof raw === 'string')
    return raw
      .split(/[,;]/)
      .map((field) => field.trim())
      .filter(Boolean);
  return [];
}

/** The drivers the server is unsure about for one row. */
export function rowCandidates(row = {}) {
  const list = Array.isArray(row.candidates) ? row.candidates : [];
  return list
    .map((candidate) => ({
      userId: candidate.userId || candidate._id || '',
      name: candidate.name || '',
      phone: candidate.phone || '',
      matched: matchedFields(candidate),
    }))
    .filter((candidate) => candidate.userId);
}

/** "Anil Das — 9876543210 (matched name and phone)" */
export function candidateLabel(candidate = {}) {
  const name = candidate.name || 'Driver';
  const phone = candidate.phone ? ` — ${candidate.phone}` : '';
  const matched = candidate.matched?.length ? ` (matched ${candidate.matched.join(' and ')})` : '';
  return `${name}${phone}${matched}`;
}

/** What the server told us about one row, in the words we show. */
export function reportRowView(row = {}) {
  const aadhaar = String(row.aadhaar ?? row.aadhaarNumber ?? '').trim();
  return {
    rowNumber: row.rowNumber,
    name: String(row.name ?? row.employeeName ?? '').trim(),
    phone: String(row.phone ?? row.employee ?? '').trim(),
    licence: String(row.licence ?? row.licenceNumber ?? '').trim(),
    aadhaar: aadhaar ? maskAadhaar(aadhaar) : '',
    vehicle: String(row.vehicle ?? row.registrationNumber ?? '').trim(),
    status: row.status || '',
    message: row.message || '',
    code: row.code || row.errorCode || '',
    candidates: rowCandidates(row),
  };
}
