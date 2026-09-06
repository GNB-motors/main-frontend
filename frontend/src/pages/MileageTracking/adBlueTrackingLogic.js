import { toISTDateString, toISTTimeString } from '../../utils/dateUtils';

/** Pure display/pagination logic for the AdBlue Tracking page (rule 21). */

export function formatAdBlueCurrency(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Server rows → the shape the table/columns expect.
export function mapAdBlueLogResponse(rawLogs) {
  return (rawLogs || []).map((log) => ({
    id: log._id,
    date: log.filledAt ? toISTDateString(log.filledAt) : null,
    time: log.filledAt ? toISTTimeString(log.filledAt) : null,
    filledAt: log.filledAt,
    vehicleNo: log.vehicleId?.registrationNumber || '-',
    vehicleModel: log.vehicleId?.vehicleType || '-',
    driverName: log.driverId
      ? `${log.driverId.firstName || ''} ${log.driverId.lastName || ''}`.trim() || '-'
      : '-',
    place: log.place || '-',
    litres: log.litres,
    amount: log.amount,
    documentId: log.documentId?._id || log.documentId || null,
  }));
}

// Windowed page numbers with a "..." run on either side once there are more
// than 5 pages. Kept as its own algorithm — not the same as other pages'
// pagination helpers, so not unified with them here.
export function generateAdBluePageNumbers(totalPages, currentPage) {
  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (currentPage > 3) pages.push('...');
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (i !== 1 && i !== totalPages) pages.push(i);
  }
  if (currentPage < totalPages - 2) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}
