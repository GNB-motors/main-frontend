import React from 'react';

/** Prev / page numbers / next for the Vehicles table (server-side pages). */
const VehiclesPagination = ({ currentPage, totalPages, handlePageChange }) => {
  // Generate page numbers for pagination (similar to DriversPage)
  const generatePageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="vehicles-pagination-controls">
      {/* Left Arrow */}
      <button
        className="vehicles-pagination-btn"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1 || totalPages <= 1}
        type="button"
        title="Previous page"
      >
        <span>←</span>
      </button>

      {/* Page Numbers */}
      {generatePageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <div key={`overflow-${index}`} className="vehicles-page-overflow">
              <span>...</span>
            </div>
          );
        }
        return (
          <button
            key={page}
            type="button"
            className={`vehicles-page-number ${currentPage === page ? 'vehicles-page-number-current' : ''}`}
            onClick={() => handlePageChange(page)}
            disabled={totalPages <= 1}
          >
            <span>{page}</span>
          </button>
        );
      })}

      {/* Right Arrow */}
      <button
        className="vehicles-pagination-btn"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages <= 1}
        type="button"
        title="Next page"
      >
        <span>→</span>
      </button>
    </div>
  );
};

export default VehiclesPagination;
