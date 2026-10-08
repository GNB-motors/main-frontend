import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';

export default function EnterprisePagination({
  page = 1,
  totalPages = 1,
  totalItems = null,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className = '',
}) {
  const [jumpInput, setJumpInput] = useState(page);

  useEffect(() => {
    setJumpInput(page);
  }, [page]);

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages && target !== page) {
      onPageChange?.(target);
    } else {
      setJumpInput(page);
    }
  };

  if (totalPages <= 1 && !totalItems) return null;

  // Compute pagination window with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // how many pages around current to show

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  const startItem = totalItems != null ? (page - 1) * pageSize + 1 : null;
  const endItem = totalItems != null ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 select-none ${className}`}
    >
      {/* Left: Item Counter & Page Size Selector */}
      <div className="flex items-center gap-4">
        {totalItems != null && (
          <span className="font-mono text-slate-500">
            Showing{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {startItem}–{endItem}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {totalItems.toLocaleString()}
            </strong>{' '}
            rows
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:border-indigo-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls & Direct Jump */}
      <div className="flex items-center gap-2">
        {/* Direct Jump Input */}
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 mr-2">
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            className="w-12 h-7 text-center font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          />
          <span>of {totalPages}</span>
        </form>

        {/* First Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(1)}
          disabled={page <= 1}
          title="First Page"
          className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Prev Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          title="Previous Page"
          className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-slate-400 select-none flex items-center justify-center"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </span>
              );
            }
            const isActive = p === page;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange?.(p)}
                className={`min-w-7 h-7 px-1.5 text-xs font-mono font-medium rounded transition select-none ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white pointer-events-none'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages}
          title="Next Page"
          className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(totalPages)}
          disabled={page >= totalPages}
          title="Last Page"
          className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
