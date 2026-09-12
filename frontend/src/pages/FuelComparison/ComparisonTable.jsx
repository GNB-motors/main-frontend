import React from 'react';
import { AlertTriangle, CheckCircle2, Eye, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DataTable from '../../components/ui/DataTable';
import { formatDateRange } from './formatIST';

const buildColumns = (activeTab, onReview) => {
  const cols = [
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (rec) => (
        <div className="fc-primary-text">
          {rec.vehicleId?.registrationNumber || rec.vehicleNumber || '—'}
        </div>
      ),
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (rec) => (
        <div className="fc-secondary-text">
          {rec.driverId
            ? `${rec.driverId.firstName || ''} ${rec.driverId.lastName || ''}`.trim()
            : '—'}
        </div>
      ),
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      render: (rec) => (
        <div className="fc-date-range">{formatDateRange(rec.fromDate, rec.toDate)}</div>
      ),
    },
  ];

  if (activeTab !== 'review') {
    cols.push(
      {
        key: 'billed',
        label: 'Billed (L)',
        align: 'right',
        render: (rec) => (
          <div className="fc-primary-text">{rec.billFuelConsumed?.toFixed(2) ?? '—'}</div>
        ),
      },
      {
        key: 'fleetEdge',
        label: 'FleetEdge (L)',
        align: 'right',
        render: (rec) => (
          <div className="fc-primary-text">{rec.fleetEdgeFuelConsumed?.toFixed(2) ?? '—'}</div>
        ),
      },
      {
        key: 'variance',
        label: 'Variance',
        align: 'right',
        render: (rec) => {
          const invertedVar = -(rec.variance || 0);
          const invertedPct = -(rec.variancePercent || 0);
          return (
            <div className={`fc-variance-badge ${invertedVar > 0 ? 'ok' : 'over'}`}>
              <span>
                {invertedVar > 0 ? '+' : ''}
                {invertedVar.toFixed(2)}L
              </span>
              <span className="fc-pct">
                ({invertedVar > 0 ? '+' : ''}
                {invertedPct.toFixed(1)}%)
              </span>
            </div>
          );
        },
      },
    );
  }

  cols.push(
    {
      key: 'fuelFlag',
      label: 'Fuel Flag',
      render: (rec) =>
        rec.isFlagged ? (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            <AlertTriangle size={12} /> Flagged
          </Badge>
        ) : rec.status === 'PENDING_REVIEW' ? (
          <Badge className="bg-amber-100 text-amber-800">
            <AlertTriangle size={12} /> Needs Action
          </Badge>
        ) : (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            <CheckCircle2 size={12} /> OK
          </Badge>
        ),
    },
    {
      key: 'odometer',
      label: 'Odometer',
      render: (rec) =>
        rec.isOdometerFlagged ? (
          <Badge
            variant="outline"
            className="border-red-300 bg-red-50 text-red-700"
            title={rec.odometerFlagReason}
          >
            <Gauge size={12} /> Odo Mismatch
          </Badge>
        ) : rec.status === 'PENDING_REVIEW' ? (
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-700"
            title={rec.reviewReason}
          >
            <Gauge size={12} /> Needs Review
          </Badge>
        ) : rec.ocrOdometerReading != null ? (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            <CheckCircle2 size={12} /> OK
          </Badge>
        ) : (
          <span className="fc-secondary-text">—</span>
        ),
    },
  );

  if (activeTab === 'review') {
    cols.push({
      key: 'action',
      label: 'Action',
      render: (rec) => (
        <button
          className="fc-btn fc-btn-primary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={() => onReview(rec)}
        >
          <Eye size={13} /> Review
        </button>
      ),
    });
  }

  return cols;
};

const ComparisonTable = ({
  activeTab,
  records,
  total,
  totalPages,
  page,
  limit,
  isLoading,
  activeFilters,
  onPageChange,
  onReview,
}) => {
  const columns = buildColumns(activeTab, onReview);

  return (
    <>
      <DataTable
        columns={columns}
        rows={records}
        loading={isLoading}
        showing={records.length}
        total={total}
        activeFilters={activeFilters}
        emptyTitle="No matching records found."
      />

      {/* Pagination Controls — same Prev/Next contract as before the chassis mount */}
      {totalPages > 1 && (
        <div className="fc-pagination">
          <span className="fc-page-info">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} records
          </span>
          <div className="fc-page-controls">
            <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ComparisonTable;
