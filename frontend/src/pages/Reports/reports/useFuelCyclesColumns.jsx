import { useMemo } from 'react';
import { formatDate, formatNumber, formatCurrency, fmtKm, fmtL } from './tripReportsUtils';
import { StatusChip, FlagChips } from './tripReportCells';

// Columns for GET /api/reports/fuel-cycles (FuelCycle rows).
export function useFuelCyclesColumns() {
  return useMemo(
    () => [
      {
        key: 'openAt',
        label: 'Open',
        render: (r) => <div className="cell-primary">{formatDate(r.open?.at)}</div>,
      },
      {
        key: 'closeAt',
        label: 'Close',
        render: (r) => (
          <div className="cell-primary">{r.close ? formatDate(r.close.at) : '...'}</div>
        ),
      },
      {
        key: 'vehicle',
        label: 'Vehicle',
        render: (r) => (
          <div className="cell-primary font-medium">{r.registrationNumber || '—'}</div>
        ),
      },
      {
        key: 'startOdo',
        label: 'Start Odo',
        align: 'right',
        render: (r) => <div className="cell-primary">{formatNumber(r.open?.odo)}</div>,
      },
      {
        key: 'endOdo',
        label: 'End Odo',
        align: 'right',
        render: (r) => (
          <div className="cell-primary">
            {r.close?.odo != null ? formatNumber(r.close.odo) : '...'}
          </div>
        ),
      },
      {
        key: 'distance',
        label: 'Distance',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtKm(r.km?.sumBest)}</div>,
      },
      {
        key: 'residue',
        label: 'Residue',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtKm(r.km?.residue)}</div>,
      },
      {
        key: 'bills',
        label: 'Bills (L)',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtL(r.fuel?.bills)}</div>,
      },
      {
        key: 'ecu',
        label: 'ECU (L)',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtL(r.fuel?.ecu)}</div>,
      },
      {
        key: 'unaccounted',
        label: 'Unaccounted (L)',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtL(r.fuel?.unaccounted)}</div>,
      },
      {
        key: 'mileage',
        label: 'Mileage T2T',
        align: 'right',
        render: (r) => (
          <div className="cell-primary">
            {typeof r.mileage?.tankToTank === 'number' ? r.mileage.tankToTank.toFixed(2) : '—'}
          </div>
        ),
      },
      {
        key: 'cost',
        label: 'Cost',
        align: 'right',
        render: (r) => (
          <div className="cell-primary" style={{ fontWeight: 600 }}>
            {formatCurrency(r.cost?.total)}
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => <StatusChip value={r.status} />,
      },
      {
        key: 'flags',
        label: 'Flags',
        render: (r) => <FlagChips flags={r.flags} />,
      },
    ],
    [],
  );
}
