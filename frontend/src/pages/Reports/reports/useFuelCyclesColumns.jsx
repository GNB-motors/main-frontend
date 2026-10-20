import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { formatDate, formatNumber, formatCurrency, fmtKm, fmtL } from './tripReportsUtils';
import { StatusChip, FlagChips } from './tripReportCells';
import { BILL_VERDICT } from '../../../utils/billCheck';
import { cycleDistance, notInTripsAlert, slipsHref } from './cycleTrips';

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
        key: 'slips',
        label: 'Fuel slips',
        render: (r) => {
          const href = slipsHref(r);
          return href ? (
            <Link
              to={href}
              className="rpt-cycle-slips-link"
              onClick={(e) => e.stopPropagation()}
              title="Open this cycle's fuel slips on the Mileage page"
            >
              View slips <ExternalLink size={12} aria-hidden="true" />
            </Link>
          ) : (
            <span className="rpt-cycle-trips-sub" title="From the uploaded oil register">
              Register
            </span>
          );
        },
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
        render: (r) => {
          const d = cycleDistance(r);
          return (
            <div className="cell-primary" title={d.title}>
              {fmtKm(d.km)}
              {d.basis === 'GPS' && d.km != null ? (
                <div className="rpt-cycle-trips-sub">GPS</div>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'residue',
        label: 'Residue',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtKm(r.km?.residue)}</div>,
      },
      {
        key: 'tripLaden',
        label: 'Laden in trips',
        align: 'right',
        render: (r) => <div className="cell-primary">{fmtKm(r.tripSummary?.ladenKm)}</div>,
      },
      {
        key: 'notInTrips',
        label: 'Not in trips',
        align: 'right',
        render: (r) => {
          const alert = notInTripsAlert(r.tripSummary);
          return (
            <div
              className="cell-primary"
              title={alert?.label || 'Empty running, detours and yard moves between these fills'}
              style={
                alert
                  ? { color: alert.tone === 'red' ? '#B42318' : '#A66300', fontWeight: 600 }
                  : undefined
              }
            >
              {fmtKm(r.tripSummary?.otherKm)}
            </div>
          );
        },
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
      {
        key: 'lossCheck',
        label: 'Loss flagged',
        render: (r) => (
          <div className="cell-primary" title={r.lossCheck?.reason || undefined}>
            {r.lossCheck ? BILL_VERDICT[r.lossCheck.verdict]?.label || r.lossCheck.verdict : '—'}
          </div>
        ),
      },
    ],
    [],
  );
}
