import React from 'react';
import { Trash2, Eye, AlertCircle } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';
import { hasRowErrors, summarizeRowErrors } from './bulkUploadVehiclesFlow.js';

/**
 * Review table for parsed vehicle rows: error summary + status filter chips
 * (only when some row has errors), then the row table with per-row actions.
 */
const BulkUploadVehiclesReviewTable = ({
  columns,
  rows,
  rowErrors,
  filteredRows,
  filterStatus,
  onFilterChange,
  onEditRow,
  onDeleteRow,
  fileName,
}) => {
  const { errorCount, validCount } = summarizeRowErrors(rowErrors);

  return (
    <div className="bulk-upload-table-container">
      {rows.length > 0 ? (
        <>
          {errorCount > 0 && (
            <div
              style={{
                padding: '16px 24px',
                backgroundColor: '#fff',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500',
                }}
              >
                Some rows have errors. Click 'View/Edit' to correct them.
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <NewButton
                  variant={filterStatus === 'all' ? 'primary' : 'secondary'}
                  selected={filterStatus === 'all'}
                  size="xs"
                  fullRounded
                  type="button"
                  text={`All (${rows.length})`}
                  onClick={() => onFilterChange('all')}
                />
                <NewButton
                  variant={filterStatus === 'valid' ? 'primary' : 'secondary'}
                  selected={filterStatus === 'valid'}
                  size="xs"
                  fullRounded
                  type="button"
                  text={`Valid (${validCount})`}
                  onClick={() => onFilterChange('valid')}
                />
                <NewButton
                  variant={filterStatus === 'error' ? 'danger' : 'secondary'}
                  selected={filterStatus === 'error'}
                  size="xs"
                  fullRounded
                  type="button"
                  text={`Issues (${errorCount})`}
                  onClick={() => onFilterChange('error')}
                />
              </div>
            </div>
          )}
          <table className="bulk-upload-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, displayIndex) => {
                const actualIndex = rows.indexOf(row);
                const isValid = !hasRowErrors(rowErrors[actualIndex]);

                return (
                  <tr key={row._rowId}>
                    <td>{displayIndex + 1}</td>
                    {columns.map((col) => (
                      <td key={col.key}>{row[col.key] || '-'}</td>
                    ))}
                    <td style={{ paddingLeft: '24px', textAlign: 'left' }}>
                      {isValid ? (
                        <span className="status-badge status-valid">Valid</span>
                      ) : (
                        <span className="status-badge status-error">Error</span>
                      )}
                    </td>
                    <td style={{ backgroundColor: !isValid ? '#fef2f2' : 'transparent' }}>
                      <div className="row-actions" style={{ gap: !isValid ? '12px' : '8px' }}>
                        {!isValid && (
                          <button
                            type="button"
                            className="row-action-btn row-action-fix"
                            onClick={() => onEditRow(actualIndex)}
                          >
                            <AlertCircle size={18} />
                            <span>Fix</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="row-action-btn"
                          onClick={() => onEditRow(actualIndex)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="row-action-btn row-action-delete"
                          onClick={() => onDeleteRow(actualIndex)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <div className="empty-state-container">
          {fileName
            ? 'No valid rows found in file.'
            : 'No data found. Upload a file to see preview.'}
        </div>
      )}
    </div>
  );
};

export default BulkUploadVehiclesReviewTable;
