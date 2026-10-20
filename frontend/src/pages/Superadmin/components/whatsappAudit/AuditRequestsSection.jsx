import { RefreshCw } from 'lucide-react';
import AuditRequestRow from './AuditRequestRow';
import AuditStreamToolbar from './AuditStreamToolbar';

const AuditRequestsSection = ({
  copiedId,
  copyToClipboard,
  handleReplay,
  loading,
  openTrace,
  pagination,
  replayingWamid,
  requests,
  searchDebounceRef,
  searchQuery,
  setPagination,
  setSearchQuery,
  setStageFilter,
  setStatusFilter,
  stageFilter,
  statusFilter,
}) => (
  <section aria-label="Inbound requests stream" className="wa-stream-card">
    {/* Table Toolbar */}
    <AuditStreamToolbar
      pagination={pagination}
      searchDebounceRef={searchDebounceRef}
      searchQuery={searchQuery}
      setPagination={setPagination}
      setSearchQuery={setSearchQuery}
      setStageFilter={setStageFilter}
      setStatusFilter={setStatusFilter}
      stageFilter={stageFilter}
      statusFilter={statusFilter}
    />

    {/* Inbound Requests Table */}
    <div className="wa-table-wrap">
      <table className="wa-audit-table">
        <thead>
          <tr>
            <th>Vehicle No</th>
            <th>Driver / User</th>
            <th>Organization</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && requests.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '48px 0' }}>
                <RefreshCw
                  size={24}
                  className="wa-spin"
                  style={{ margin: '0 auto 8px', display: 'block', color: 'var(--wa-primary)' }}
                />
                Loading WhatsApp interaction stream…
              </td>
            </tr>
          ) : requests.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: 'var(--wa-text-muted)',
                }}
              >
                No WhatsApp interactions matched the selected filters.
              </td>
            </tr>
          ) : (
            requests.map((r) => (
              <AuditRequestRow
                key={r.id}
                r={r}
                copiedId={copiedId}
                copyToClipboard={copyToClipboard}
                handleReplay={handleReplay}
                openTrace={openTrace}
                replayingWamid={replayingWamid}
              />
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <footer className="wa-pagination">
      <div>
        Showing {(pagination.page - 1) * pagination.limit + 1}–
        {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total}{' '}
        requests
      </div>
      <div className="wa-pagination__btns">
        <button
          className="wa-audit-btn"
          disabled={pagination.page <= 1 || loading}
          onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
        >
          Previous
        </button>
        <span style={{ alignSelf: 'center', fontSize: 12, padding: '0 8px' }}>
          Page {pagination.page} of {pagination.totalPages || 1}
        </span>
        <button
          className="wa-audit-btn"
          disabled={pagination.page >= pagination.totalPages || loading}
          onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
        >
          Next
        </button>
      </div>
    </footer>
  </section>
);

export default AuditRequestsSection;
