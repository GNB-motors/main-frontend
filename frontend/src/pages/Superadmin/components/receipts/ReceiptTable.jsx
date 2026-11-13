import { Inbox, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';
import EnterprisePagination from '../../../../components/ui/EnterprisePagination';
import ReceiptRowSkeleton from './ReceiptRowSkeleton';
import ReceiptRow from './ReceiptRow';

const SKEL_ROWS = 6;

const ReceiptTable = ({
  selectedIds,
  isAllSelected,
  isSomeSelected,
  toggleSelectAll,
  selectableItems,
  toggleSort,
  sortDirection,
  loading,
  filtered,
  activeFiltersCount,
  status,
  resetAllFilters,
  setActiveDrawerId,
  toggleSelectOne,
  setPreviewImage,
  handleSingleApprove,
  listMeta,
  page,
  pageSize,
  setPage,
  setPageSize,
  error = '',
  onRetry,
  rowErrors = {},
  onRetryRow,
}) => (
  <div className="ra-card">
    <div
      className="ra-table-wrap"
      style={{
        paddingBottom: selectedIds.size > 0 ? 80 : 0,
        transition: 'padding-bottom 0.2s',
      }}
    >
      <table className="ra-table">
        <thead>
          <tr>
            <th className="ra-table__th-select">
              <input
                type="checkbox"
                className="ra-checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isSomeSelected;
                }}
                onChange={toggleSelectAll}
                disabled={selectableItems.length === 0}
                aria-label="Select all ready receipts"
              />
            </th>
            <th>Slip</th>
            <th>Vehicle & Plate</th>
            <th>Uploaded by / Driver</th>
            <th>Fuel Station</th>
            <th className="ra-right">Litres</th>
            <th className="ra-right">Amount</th>
            <th className="ra-center">Odometer</th>
            <th className="ra-center">AI Extraction</th>
            <th className="ra-center">Status</th>
            <th
              className="ra-sortable"
              onClick={toggleSort}
              title={`Sort by refuel date (${sortDirection === 'desc' ? 'Newest first' : 'Oldest first'})`}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span>Refuel Date</span>
                {sortDirection === 'desc' ? (
                  <ArrowDown size={13} style={{ color: 'var(--primary, #2563eb)' }} />
                ) : (
                  <ArrowUp size={13} style={{ color: 'var(--primary, #2563eb)' }} />
                )}
              </div>
            </th>
            <th className="ra-center">Actions</th>
          </tr>
        </thead>
        <tbody aria-busy={loading}>
          {loading && Array.from({ length: SKEL_ROWS }, (_, i) => <ReceiptRowSkeleton key={i} />)}

          {/* A failed load is a failure, never an empty inbox. */}
          {!loading && error && (
            <tr>
              <td colSpan={12} aria-label="The receipts did not load">
                <div className="ra-state ra-state--error" role="alert" style={{ padding: '50px 0' }}>
                  <div className="ra-state__icon">
                    <AlertTriangle size={26} />
                  </div>
                  <div className="ra-state__title">The receipts did not load</div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '13px', marginTop: 4 }}>
                    {error}
                  </div>
                  <button
                    type="button"
                    className="ra-btn ra-btn--ghost"
                    style={{ marginTop: 14 }}
                    onClick={onRetry}
                  >
                    Try again
                  </button>
                </div>
              </td>
            </tr>
          )}

          {!loading && !error && filtered.length === 0 && (
            // eslint-disable-next-line jsx-a11y/control-has-associated-label -- a table row, not a control; its cell holds the empty-state text and button
            <tr>
              <td colSpan={12}>
                <div className="ra-state" style={{ padding: '50px 0' }}>
                  <div className="ra-state__icon">
                    <Inbox size={26} />
                  </div>
                  <div className="ra-state__title">
                    {activeFiltersCount > 0 ? 'No receipts found' : 'No receipts yet'}
                  </div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '13px', marginTop: 4 }}>
                    {activeFiltersCount > 0
                      ? 'No receipts matched your active filters. Try clearing some filters.'
                      : status === 'READY'
                        ? 'All caught up! No fuel bills waiting for review.'
                        : 'No fuel bills in this tab.'}
                  </div>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      className="ra-btn ra-btn--ghost"
                      style={{ marginTop: 14 }}
                      onClick={resetAllFilters}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            filtered.map((d) => (
              <ReceiptRow
                key={d._id}
                d={d}
                selectedIds={selectedIds}
                setActiveDrawerId={setActiveDrawerId}
                toggleSelectOne={toggleSelectOne}
                setPreviewImage={setPreviewImage}
                handleSingleApprove={handleSingleApprove}
                rowError={rowErrors[d._id] || ''}
                onRetryRow={onRetryRow}
              />
            ))}
        </tbody>
      </table>
    </div>
    {listMeta && (
      <EnterprisePagination
        page={page}
        totalPages={listMeta.totalPages}
        totalItems={listMeta.total}
        pageSize={pageSize}
        pageSizeOptions={[25, 50, 100, 200]}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    )}
  </div>
);

export default ReceiptTable;
