import DataTable from '../../../components/ui/DataTable';

const ServiceIntelligenceTable = ({
  columns,
  displayedRows,
  loading,
  totalRecords,
  search,
  activePriorityFilter,
  activeServiceFilter,
  totalPages,
  page,
  handlePageChange,
  isService,
}) => (
  <DataTable
    columns={columns}
    rows={displayedRows}
    rowKey={(r) => r._id}
    loading={loading}
    showing={displayedRows.length}
    total={totalRecords}
    activeFilters={
      (search.trim() ? 1 : 0) +
      (activePriorityFilter !== 'ALL' ? 1 : 0) +
      (activeServiceFilter !== 'ALL' ? 1 : 0)
    }
    paginated={true}
    pagination={
      totalPages > 1 ? (
        <div className="vehicles-pagination-controls">
          <button
            className="vehicles-pagination-btn"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            type="button"
            title="Previous page"
          >
            <span>←</span>
          </button>
          <span style={{ fontSize: 13, color: '#5d5d5e', fontWeight: 500 }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="vehicles-pagination-btn"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            type="button"
            title="Next page"
          >
            <span>→</span>
          </button>
        </div>
      ) : null
    }
    emptyTitle={
      totalRecords === 0
        ? `No ${isService ? 'service' : 'repair'} entries yet`
        : `No ${isService ? 'service' : 'repair'} entries match your filters`
    }
    emptyHint={
      totalRecords === 0
        ? `Click "${isService ? 'Add Service' : 'Add Repair'}" to log one.`
        : 'Try selecting "All Issues" or clearing search query.'
    }
  />
);

export default ServiceIntelligenceTable;
