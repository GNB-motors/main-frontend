// Server-side pagination controls for the Drivers page (drivers-* styles).
// Extracted from DriversPage.jsx (WS0.7); markup preserved.
import ChevronIcon from '../../Trip/assets/ChevronIcon.jsx';
import { generatePageNumbers } from '../driverList.js';

export default function DriversPagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="drivers-pagination-controls">
      {/* Left Arrow */}
      <button
        className="drivers-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || totalPages <= 1}
      >
        <ChevronIcon size={12} style={{ transform: 'rotate(90deg)' }} />
      </button>

      {/* Page Numbers */}
      {generatePageNumbers(currentPage, totalPages).map((page, index) => {
        if (page === '...') {
          return (
            <div key={`overflow-${index}`} className="drivers-page-overflow">
              <span>...</span>
            </div>
          );
        }
        return (
          <button
            key={page}
            className={`drivers-page-number ${currentPage === page ? 'drivers-page-number-current' : ''}`}
            onClick={() => onPageChange(page)}
            disabled={totalPages <= 1}
          >
            <span>{page}</span>
          </button>
        );
      })}

      {/* Right Arrow */}
      <button
        className="drivers-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages <= 1}
      >
        <ChevronIcon size={12} style={{ transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  );
}
