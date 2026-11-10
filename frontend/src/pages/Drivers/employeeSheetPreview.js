/**
 * The server may read a spreadsheet as well as the browser.
 *
 * When the operator has not chosen a column yet, the dry run may answer with a
 * `detectedMapping` — the server's guess at which column is which. We take it
 * as the starting point and the operator may change every column afterwards.
 */
import DataImportService from '../../services/DataImportService';

/**
 * Ask the server what it thinks the columns are.
 *
 * @param {File} file
 * @param {string} entity - 'drivers' | 'assignments' | 'vehicles'
 * @returns {Promise<object|null>} the raw detected mapping, or null
 */
export async function detectSheetMapping(file, entity) {
  if (!file) return null;
  try {
    const res = await DataImportService.preview({ file, entity, mapping: {}, resolvers: {} });
    const detected = res?.detectedMapping || res?.data?.detectedMapping || null;
    return detected && typeof detected === 'object' ? detected : null;
  } catch {
    // A sheet the server cannot read is still a sheet we can read here.
    return null;
  }
}

/**
 * The detected mapping as { field: column }, keeping only the columns that are
 * really in the file. Both shapes the server may use are understood.
 *
 * @param {object|null} detected
 * @param {string[]} headers
 * @returns {Record<string, string>}
 */
export function detectedColumns(detected, headers = []) {
  if (!detected || typeof detected !== 'object') return {};
  const headerSet = new Set(headers);
  const out = {};

  // { column: field }
  headers.forEach((header) => {
    const field = detected[header];
    if (typeof field === 'string' && field) out[field] = header;
  });
  if (Object.keys(out).length) return out;

  // { field: column }
  Object.entries(detected).forEach(([field, column]) => {
    if (typeof column === 'string' && headerSet.has(column)) out[field] = column;
  });
  return out;
}

/**
 * The column the server thinks holds the employee/driver.
 */
export function detectedEmployeeColumn(detected, headers = []) {
  const columns = detectedColumns(detected, headers);
  const entry = Object.entries(columns).find(([field]) => /employee|driver/i.test(field));
  return entry ? entry[1] : '';
}

/**
 * The column the server thinks holds the vehicle.
 */
export function detectedVehicleColumn(detected, headers = []) {
  const columns = detectedColumns(detected, headers);
  const entry = Object.entries(columns).find(([field]) => /vehicle|truck|registration/i.test(field));
  return entry ? entry[1] : '';
}
