/**
 * Prev/Next pager shared by the Fuel Integrity detail tables so events and
 * vehicle risk paginate identically. Renders nothing for a single page.
 * `onPageChange` receives a functional updater, matching a React setState.
 */
export default function TablePager({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between">
      <span className="text-dim text-xs">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          className="ov-btn"
          disabled={page === 1}
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          style={page === 1 ? { opacity: 0.5 } : undefined}
        >
          Prev
        </button>
        <button
          className="ov-btn"
          disabled={page === totalPages}
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          style={page === totalPages ? { opacity: 0.5 } : undefined}
        >
          Next
        </button>
      </div>
    </div>
  );
}
