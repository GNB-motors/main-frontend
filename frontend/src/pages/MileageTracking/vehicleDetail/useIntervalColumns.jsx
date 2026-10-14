import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatDateIST } from '../../../utils/dateUtils';
import AlertCell from './AlertCell';
import { getIntervalSource, getIntervalDestination } from './intervalRoute';

/** Columns of the vehicle's interval table; `navigate` opens an interval's audit page. */
const useIntervalColumns = (navigate) =>
  useMemo(
    () => [
      {
        key: 'startDate',
        label: 'Date',
        width: '10%',
        render: (r) => (
          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            {formatDateIST(r.startDate)}
          </span>
        ),
      },
      {
        key: 'route',
        label: 'Source → Destination',
        width: '18%',
        render: (r) => {
          const src = getIntervalSource(r);
          const dest = getIntervalDestination(r);
          const hasRoute = Boolean(src || dest);
          if (hasRoute) {
            return (
              <div className="mt-route-cell" title={`${src || '—'} → ${dest || '—'}`}>
                <span className="mt-route-pill">
                  <span className="mt-route-src">{src || '—'}</span>
                  <span className="mt-route-arrow">→</span>
                  <span className="mt-route-dest">{dest || '—'}</span>
                </span>
              </div>
            );
          }
          return <span className="text-slate-400 text-sm">—</span>;
        },
      },
      {
        key: 'odometerRange',
        label: 'Odometer Window',
        width: '16%',
        align: 'center',
        render: (r) => (
          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            {r.startOdometer != null ? Number(r.startOdometer).toLocaleString() : '—'}
            {' → '}
            {r.endOdometer != null ? Number(r.endOdometer).toLocaleString() : '...'}
          </span>
        ),
      },
      {
        key: 'distanceKm',
        label: 'Distance',
        width: '11%',
        align: 'center',
        render: (r) => (
          <span className="font-medium text-slate-700 dark:text-slate-300 text-[13.5px]">
            {r.distanceKm != null ? `${r.distanceKm.toFixed(1)} km` : '—'}
          </span>
        ),
      },
      {
        key: 'fuelConsumedLiters',
        label: 'Fuel Billed',
        width: '11%',
        align: 'center',
        render: (r) => (
          <span className="font-medium text-slate-700 dark:text-slate-300 text-[13.5px]">
            {r.fuelConsumedLiters != null ? `${r.fuelConsumedLiters.toFixed(2)} L` : '—'}
          </span>
        ),
      },
      {
        key: 'mileageKmPerL',
        label: 'Mileage',
        width: '12%',
        align: 'center',
        render: (r) =>
          r.mileageKmPerL != null ? (
            <div className="mt-mileage-pill">
              <span>{r.mileageKmPerL.toFixed(2)}</span>
              <span className="mt-unit">km/L</span>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">—</span>
          ),
      },
      {
        key: 'fuelCost',
        label: 'Fuel Cost',
        width: '12%',
        align: 'center',
        render: (r) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-[13.5px]">
            {r.fuelCost != null
              ? `₹${r.fuelCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
              : '—'}
          </span>
        ),
      },
      {
        key: 'alert',
        label: 'Telematics Status',
        width: '14%',
        align: 'center',
        render: (r) => <AlertCell interval={r} />,
      },
      {
        key: '_nav',
        label: 'Action',
        width: '10%',
        align: 'center',
        render: (r) => (
          <button
            type="button"
            className="mt-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/mileage-tracking/${r._id}`);
            }}
            title="Audit interval telemetry & fuel slips"
          >
            <span>Audit</span>
            <ChevronRight size={13} />
          </button>
        ),
      },
    ],
    [navigate],
  );

export default useIntervalColumns;
