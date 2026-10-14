import { useMemo } from 'react';
import { formatCurrency, fmtKm, fmtL, fmtPct } from './tripReportsUtils';

const GROUP_LABEL = { vehicle: 'Vehicle', hub: 'Hub', driver: 'Driver', day: 'Day' };

/**
 * Km of ledger drives no trip role explains — the data-gap bucket. The API row
 * calls it unAttributedKm; kmUnattributed is the contract name.
 */
export const unattributedKmOf = (r) => r.kmUnattributed ?? r.unAttributedKm ?? null;

/**
 * Columns for GET /api/reports/running-cost (RunningCostRow rows). The API
 * has no reposition km (allocations are not persisted, so it would always be
 * 0) and no overhead cost, so neither has a column.
 */
export function useRunningCostColumns(groupBy = 'vehicle') {
  return useMemo(
    () => [
      {
        key: 'label',
        label: GROUP_LABEL[groupBy] || 'Group',
        render: (r) => <div className="cell-primary font-medium">{r.label || r.key || '—'}</div>,
      },
      {
        key: 'trips',
        label: 'Trips',
        align: 'right',
        render: (r) => (
          <div className="cell-primary">{typeof r.trips === 'number' ? r.trips : '—'}</div>
        ),
      },
      {
        key: 'kmApproach',
        label: 'Km Approach',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtKm(r.kmApproach)}</div>,
      },
      {
        key: 'kmLaden',
        label: 'Km Laden',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtKm(r.kmLaden)}</div>,
      },
      {
        key: 'kmReturn',
        label: 'Km Return',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtKm(r.kmReturn)}</div>,
      },
      {
        key: 'kmUnattributed',
        label: 'Km Unattributed',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtKm(unattributedKmOf(r))}</div>,
      },
      {
        key: 'fuelL',
        label: 'Fuel (L)',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtL(r.fuelL)}</div>,
      },
      {
        key: 'businessCostInr',
        label: 'Business ₹',
        align: 'right',
        render: (r) => <div className="cell-primary">{formatCurrency(r.businessCostInr)}</div>,
      },
      {
        key: 'nonBusinessCostInr',
        label: 'Non-Business ₹',
        align: 'right',
        render: (r) => <div className="cell-primary">{formatCurrency(r.nonBusinessCostInr)}</div>,
      },
      {
        key: 'deviationCostInr',
        label: 'Deviation ₹',
        align: 'right',
        render: (r) => <div className="cell-primary">{formatCurrency(r.deviationCostInr)}</div>,
      },
      {
        key: 'totalCostInr',
        label: 'Total ₹',
        align: 'right',
        render: (r) => (
          <div className="cell-primary" style={{ fontWeight: 600 }}>
            {formatCurrency(r.totalCostInr)}
          </div>
        ),
      },
      {
        key: 'emptySharePct',
        label: 'Empty %',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtPct(r.emptySharePct)}</div>,
      },
      {
        key: 'deviationSharePct',
        label: 'Deviation %',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtPct(r.deviationSharePct)}</div>,
      },
    ],
    [groupBy],
  );
}
