import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/ui/DataTable';
import StatusChip from '../../../components/ui/StatusChip';
import { useApi } from '../../../hooks/useApi';
import { formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { MileageApi } from '../mileageApi';
import { mileageBand, trucksFromModels } from '../mileageRows';
import InfoTip from './InfoTip';

const compact = (s) =>
  String(s || '')
    .replace(/[\s\-_]/g, '')
    .toUpperCase();

const COLUMNS = [
  {
    key: 'truck',
    label: 'Truck',
    render: (t) => (
      <>
        <span className="mhub-plate">{t.vehicleNo || '—'}</span>
        <span className="mhub-sub">{t.model || ' '}</span>
      </>
    ),
  },
  {
    key: 'mileage',
    label: 'Mileage',
    render: (t) => (
      <span className="mhub-cell">
        <span className="mhub-litres">
          {t.kmPerL != null ? `${t.kmPerL.toFixed(2)} km/L` : '—'}
        </span>
        <StatusChip group="mileageBand" value={mileageBand(t.kmPerL)} fallback="" />
        <InfoTip
          explanation={{
            title: `${t.vehicleNo} mileage`,
            text: 'All km of this truck’s full-tank rounds in these dates, divided by all their diesel.',
            lines: [
              ['Distance', formatKm(t.distanceKm)],
              ['Diesel', formatLitres(t.fuelL)],
              ['Rounds', formatNum(t.rounds)],
            ],
          }}
        />
      </span>
    ),
  },
  {
    key: 'rounds',
    label: 'Rounds',
    align: 'right',
    render: (t) => <span className="num">{formatNum(t.rounds)}</span>,
  },
  {
    key: 'km',
    label: 'Distance',
    align: 'right',
    render: (t) => <span className="num">{formatKm(t.distanceKm)}</span>,
  },
  {
    key: 'fuel',
    label: 'Diesel',
    align: 'right',
    render: (t) => <span className="num">{formatLitres(t.fuelL, { decimals: 0 })}</span>,
  },
];

/**
 * Mileage per truck for the hub's dates, best first. Read from the model
 * comparison, which already carries each truck's distance-weighted km/L and
 * leaves out rounds with an impossible odometer.
 */
export default function TruckMileageView({ range, searchQuery = '' }) {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(
    (signal) => MileageApi.modelComparison(range, signal),
    [range.from, range.to],
  );
  const trucks = trucksFromModels(data?.data);
  const needle = compact(searchQuery);
  const rows = needle ? trucks.filter((t) => compact(t.vehicleNo).includes(needle)) : trucks;

  return (
    <DataTable
      columns={COLUMNS}
      rows={rows}
      rowKey={(t) => t.id}
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      showing={rows.length}
      total={rows.length}
      onRowClick={(t) => navigate(`/mileage-tracking/vehicle/${t.vehicleId}`)}
      emptyTitle="No full-tank rounds in these dates"
      emptyHint="A truck shows up once it has two full-tank fills in the range."
    />
  );
}
