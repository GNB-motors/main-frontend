import React from 'react';
import { Search } from 'lucide-react';
import EmptyState from './EmptyState';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';

const TableShimmer = ({ columns = 5, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <tr key={rIdx} className="erp-shimmer-row">
        {Array.from({ length: columns }).map((_, cIdx) => (
          <td key={cIdx}>
            <div
              style={{
                height: '16px',
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                backgroundSize: '200% 100%',
                animation: 'erpShimmer 1.5s infinite',
                borderRadius: '4px',
              }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const ErpTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyText = 'No records found',
  emptyCta = null,
  toolbar = null,
  searchQuery = '',
  onSearchChange = null,
  searchPlaceholder = 'Search records...',
  pagination = null, // { page, totalPages, totalCount, onPageChange }
  keyExtractor = (item, index) => item._id || item.id || index,
}) => {
  return (
    <div className="erp-table-container">
      {(toolbar || onSearchChange) && (
        <div className="erp-toolbar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          {onSearchChange && (
            <div className="erp-search" style={{ flex: 1, minWidth: '240px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={col.headerStyle || {}}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableShimmer columns={columns.length} rows={5} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <EmptyState text={emptyText} cta={emptyCta} />
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr key={keyExtractor(row, rIdx)}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={col.cellStyle || {}}>
                      {col.render ? col.render(row, rIdx) : row[col.accessor] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            {pagination.totalCount ? ` (${pagination.totalCount} total entries)` : ''}
          </span>
          <Pagination style={{ width: 'auto', margin: 0 }}>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => pagination.page > 1 && pagination.onPageChange(pagination.page - 1)}
                  style={{ opacity: pagination.page <= 1 ? 0.5 : 1, pointerEvents: pagination.page <= 1 ? 'none' : 'auto' }}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                let pNum = i + 1;
                if (pagination.totalPages > 5 && pagination.page > 3) {
                  pNum = pagination.page - 2 + i;
                  if (pNum > pagination.totalPages) pNum = pagination.totalPages - (4 - i);
                }
                if (pNum <= 0) return null;
                return (
                  <PaginationItem key={pNum}>
                    <PaginationLink
                      isActive={pagination.page === pNum}
                      onClick={() => pagination.onPageChange(pNum)}
                    >
                      {pNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => pagination.page < pagination.totalPages && pagination.onPageChange(pagination.page + 1)}
                  style={{ opacity: pagination.page >= pagination.totalPages ? 0.5 : 1, pointerEvents: pagination.page >= pagination.totalPages ? 'none' : 'auto' }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ErpTable;
