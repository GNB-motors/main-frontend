import { useMemo } from 'react';
import { formatDate, formatCurrency, fmtKm, fmtL } from './tripReportsUtils';
import { StatusChip } from './tripReportCells';

/**
 * The litres priced as non-business: the charged (extra) share of the
 * excursion's fuel. The API row calls it fuelChargedL; fuelExtraL is the
 * contract name.
 */
export const fuelExtraOf = (r) => r.fuelExtraL ?? r.fuelChargedL ?? null;

/**
 * Columns for GET /api/reports/non-business (NonBusinessRow rows). The row
 * carries no approved km today (the excursion stores km.approvedExtra but the
 * report does not send it), so that column only appears once rows carry
 * `kmApproved`.
 */
export function useNonBusinessColumns({ showKmApproved = false } = {}) {
  return useMemo(
    () =>
      [
        {
          key: 'date',
          label: 'Date',
          render: (r) => <div className="cell-primary">{formatDate(r.date)}</div>,
        },
        {
          key: 'vehicle',
          label: 'Vehicle',
          render: (r) => <div className="cell-primary font-medium">{r.vehicleNumber || '—'}</div>,
        },
        {
          key: 'status',
          label: 'Status',
          render: (r) => <StatusChip value={r.status} />,
        },
        {
          key: 'placeKind',
          label: 'Place',
          render: (r) => <div className="cell-primary">{r.placeKind || '—'}</div>,
        },
        {
          key: 'purpose',
          label: 'Purpose',
          render: (r) => <div className="cell-primary">{r.purpose || '—'}</div>,
        },
        {
          key: 'kmTotal',
          label: 'Km Total',
          align: 'right',
          render: (r) => <div className="cell-primary">{fmtKm(r.kmTotal)}</div>,
        },
        {
          key: 'kmExtra',
          label: 'Km Extra',
          align: 'right',
          render: (r) => <div className="cell-primary">{fmtKm(r.kmExtra)}</div>,
        },
        showKmApproved
          ? {
              key: 'kmApproved',
              label: 'Km Approved',
              align: 'right',
              render: (r) => <div className="cell-primary">{fmtKm(r.kmApproved)}</div>,
            }
          : null,
        {
          key: 'fuelExtraL',
          label: 'Fuel Extra (L)',
          align: 'right',
          render: (r) => <div className="cell-primary">{fmtL(fuelExtraOf(r))}</div>,
        },
        {
          key: 'dwellMin',
          label: 'Dwell (min)',
          align: 'right',
          render: (r) => (
            <div className="cell-primary">{typeof r.dwellMin === 'number' ? r.dwellMin : '—'}</div>
          ),
        },
        {
          key: 'fuelInr',
          label: 'Fuel ₹',
          align: 'right',
          render: (r) => <div className="cell-primary">{formatCurrency(r.fuelInr)}</div>,
        },
        {
          key: 'wearInr',
          label: 'Wear ₹',
          align: 'right',
          render: (r) => <div className="cell-primary">{formatCurrency(r.wearInr)}</div>,
        },
        {
          key: 'totalInr',
          label: 'Total ₹',
          align: 'right',
          render: (r) => (
            <div className="cell-primary" style={{ fontWeight: 600 }}>
              {formatCurrency(r.totalInr)}
            </div>
          ),
        },
      ].filter(Boolean),
    [showKmApproved],
  );
}
