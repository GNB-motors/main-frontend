// Pure row-filtering / counting helpers for the vehicle bulk-upload review
// table. Rows and rowErrors are parallel arrays indexed by row position.

export const VEHICLE_DEDUPE_KEY = 'registration_no';

export const hasRowErrors = (error) => Boolean(error) && Object.keys(error).length > 0;

export const filterRowsByStatus = (rows, rowErrors, filterStatus) =>
  rows.filter((row, index) => {
    if (filterStatus === 'all') return true;
    const error = rowErrors[index];
    if (filterStatus === 'error') return hasRowErrors(error);
    if (filterStatus === 'valid') return !hasRowErrors(error);
    return true;
  });

export const summarizeRowErrors = (rowErrors) => {
  const errorCount = rowErrors.filter(hasRowErrors).length;
  return { errorCount, validCount: rowErrors.length - errorCount };
};
