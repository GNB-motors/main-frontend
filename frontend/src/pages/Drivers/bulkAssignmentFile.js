export const MAX_ASSIGNMENT_ROWS = 500;

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

export function assignmentRows(rows, employeeColumn, vehicleColumn) {
  return rows.map(({ cells, rowNumber }) => ({
    rowNumber,
    employee: String(cells[Number(employeeColumn)] ?? '').trim(),
    vehicle: String(cells[Number(vehicleColumn)] ?? '').trim(),
  }));
}
