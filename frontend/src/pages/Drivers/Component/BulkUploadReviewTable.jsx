import React from 'react';
import NewButton from '@/components/ui/NewButton';

/**
 * Step 3 of the bulk upload wizard: the review table with the
 * All / Valid / Issues filter chips and per-row validation status.
 */
const BulkUploadReviewTable = ({
  filteredRows,
  normalizedRows,
  rowErrors,
  filterStatus,
  onFilterChange,
  onRowClick,
}) => {
  const errorCount = rowErrors.filter((e) => e && Object.keys(e).length > 0).length;
  const validCount = normalizedRows.length - errorCount;

  return (
    <div className="bulk-upload-table-container">
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
            Some rows have errors. Please fix them before submitting.
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
              text={`All (${normalizedRows.length})`}
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
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Location</th>
            <th style={{ width: '120px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, displayIndex) => {
            const actualIndex = normalizedRows.indexOf(row);
            const error = rowErrors[actualIndex];
            const isValid = !error || Object.keys(error).length === 0;

            return (
              <tr
                key={row.clientRowId}
                onClick={() => !isValid && onRowClick({ row, error, index: actualIndex })}
                style={{
                  cursor: !isValid ? 'pointer' : 'default',
                  backgroundColor: !isValid ? '#fef2f2' : 'transparent',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isValid) {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isValid) {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                  }
                }}
              >
                <td>{displayIndex + 1}</td>
                <td>
                  {row.firstName} {row.lastName}
                </td>
                <td>{row.email || '-'}</td>
                <td>{row.mobileNumber || '-'}</td>
                <td>{row.role}</td>
                <td>{row.location}</td>
                <td style={{ paddingLeft: '24px', textAlign: 'left' }}>
                  {isValid ? (
                    <span className="status-badge status-valid">Valid</span>
                  ) : (
                    <span className="status-badge status-error">Error</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BulkUploadReviewTable;
