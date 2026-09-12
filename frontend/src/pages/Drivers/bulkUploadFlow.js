/**
 * Pure flow logic for the bulk employee upload wizard
 * (file → column mapping → review → submit).
 */

import {
  splitName,
  normalizePhone,
  normalizeEmail,
  normalizeRole,
  generatePassword,
  validateEmployeeRow,
} from '../../utils/bulkEmployees.js';

export const MAX_ROWS = 500;

/**
 * Apply the user's column mapping to raw spreadsheet rows and normalize each
 * row into the employee shape the API expects.
 *
 * @param {Array<object>} rawRows - Rows as returned by XLSX.sheet_to_json
 * @param {object} mapping - fileColumn key per logical field (name, phone, email, role, location)
 * @returns {{normalized: Array<object>, errors: Array<object>, passwordMap: Map<string,string>}}
 */
export const applyColumnMapping = (rawRows, mapping) => {
  const normalized = [];
  const errors = [];
  const passwordMap = new Map();

  rawRows.forEach((rawRow, index) => {
    // Handle both string and number types from Excel/CSV
    const name = mapping.name
      ? rawRow[mapping.name] != null
        ? String(rawRow[mapping.name])
        : ''
      : '';
    const phone = mapping.phone ? (rawRow[mapping.phone] != null ? rawRow[mapping.phone] : '') : '';
    const email = mapping.email
      ? rawRow[mapping.email] != null
        ? String(rawRow[mapping.email])
        : ''
      : '';
    const role = mapping.role
      ? rawRow[mapping.role] != null
        ? String(rawRow[mapping.role])
        : ''
      : '';
    const location = mapping.location
      ? rawRow[mapping.location] != null
        ? String(rawRow[mapping.location])
        : ''
      : '';

    const clientRowId = `row-${Date.now()}-${index}`;
    const { firstName, lastName } = splitName(name);
    const password = generatePassword(12);
    passwordMap.set(clientRowId, password);

    const normalizedRow = {
      clientRowId,
      firstName,
      lastName,
      email: normalizeEmail(email),
      mobileNumber: normalizePhone(phone),
      location: location.trim() || 'Kolkata',
      password,
      role: normalizeRole(role),
      _rawRow: rawRow,
      _index: index,
    };

    errors.push(validateEmployeeRow(normalizedRow));
    normalized.push(normalizedRow);
  });

  return { normalized, errors, passwordMap };
};

/**
 * Keep the review-table filter contract: 'all' shows everything, 'valid' only
 * rows without validation errors, 'error' only rows with them.
 */
export const filterRowsByStatus = (normalizedRows, rowErrors, filterStatus) =>
  normalizedRows.filter((row, index) => {
    if (filterStatus === 'all') return true;
    const error = rowErrors[index];
    if (filterStatus === 'error') return error && Object.keys(error).length > 0;
    if (filterStatus === 'valid') return !error || Object.keys(error).length === 0;
    return true;
  });

/**
 * @returns {{errorCount: number, validCount: number}}
 */
export const summarizeRowErrors = (normalizedRows, rowErrors) => {
  const errorCount = rowErrors.filter((e) => e && Object.keys(e).length > 0).length;
  return { errorCount, validCount: normalizedRows.length - errorCount };
};

/**
 * Strip internal fields before sending rows to the API.
 */
export const buildEmployeesPayload = (normalizedRows) =>
  normalizedRows.map((row) => ({
    clientRowId: row.clientRowId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email || null,
    mobileNumber: row.mobileNumber,
    location: row.location || null,
    password: row.password,
    role: row.role,
  }));

/**
 * Build the credentials CSV from the upload result's created rows, joining
 * passwords from the client-side map (passwords are never returned by the API).
 *
 * @param {Array<object>} created - Rows returned in uploadResult.created
 * @param {Map<string,string>} passwordMap - clientRowId -> password
 * @returns {{csvContent: string, fileName: string}}
 */
export const buildCredentialsCsv = (created, passwordMap) => {
  const credentials = created.map((createdRow) => ({
    firstName: createdRow.firstName,
    lastName: createdRow.lastName,
    email: createdRow.email || '',
    mobileNumber: createdRow.mobileNumber,
    role: createdRow.role,
    location: createdRow.location || '',
    password: passwordMap.get(createdRow.clientRowId) || 'N/A',
  }));

  const headers = [
    'firstName',
    'lastName',
    'email',
    'mobileNumber',
    'role',
    'location',
    'password',
  ];
  const csvRows = [
    headers.join(','),
    ...credentials.map((row) =>
      headers
        .map((header) => {
          const value = row[header] || '';
          // Escape commas and quotes
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(','),
    ),
  ];

  return {
    csvContent: csvRows.join('\n'),
    fileName: `employee-credentials-${new Date().toISOString().split('T')[0]}.csv`,
  };
};
