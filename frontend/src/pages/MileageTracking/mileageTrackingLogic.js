import { formatDateIST } from '../../utils/dateUtils';

/** Pure display/pagination logic for the Mileage Tracking fleet overview (rule 21). */

export function formatMileageDate(d) {
  return d ? formatDateIST(d) : '-';
}

// Windowed page numbers with a "..." run on either side once there are more
// than 5 pages. Page-local copy — not unified with other pages' pagination
// helpers, which use slightly different algorithms of their own.
export function generateMileagePageNumbers(totalPages, currentPage) {
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
