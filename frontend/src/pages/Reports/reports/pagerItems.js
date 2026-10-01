/**
 * Page numbers to render in a pager: first, last, and the current page's
 * neighbours, with '...' for each gap.
 *
 * Pure: unit tests live next to it.
 */
export function pageItems(totalPages, currentPage) {
  const items = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      items.push(i);
    } else if (items[items.length - 1] !== '...') {
      items.push('...');
    }
  }
  return items;
}
