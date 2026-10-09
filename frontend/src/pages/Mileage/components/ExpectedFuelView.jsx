import React, { useState } from 'react';
import DataTable from '../../../components/ui/DataTable';
import FilterBar from '../../../components/ui/FilterBar';
import StatusChip from '../../../components/ui/StatusChip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { useApi } from '../../../hooks/useApi';
import { formatKm, formatLitres } from '../../../utils/formatters';
import { MileageApi } from '../mileageApi';
import { dailyRollup, dieselUse } from '../mileageRows';
import InfoTip from './InfoTip';

const signed = (v, unit) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}${unit}`);

const COLUMNS = [
  { key: 'day', label: 'Day', render: (d) => <span className="num">{d.day}</span> },
  {
    key: 'km',
    label: 'Driven',
    align: 'right',
    render: (d) => <span className="num">{formatKm(d.distanceKm)}</span>,
  },
  {
    key: 'used',
    label: 'Used',
    align: 'right',
    render: (d) => <span className="mhub-litres">{formatLitres(d.actualL)}</span>,
  },
  {
    key: 'should',
    label: 'Should use',
    align: 'right',
    render: (d) => <span className="mhub-litres">{formatLitres(d.expectedL)}</span>,
  },
  {
    key: 'result',
    label: 'Result',
    render: (d) => (
      <span className="mhub-cell">
        <StatusChip group="dieselUse" value={dieselUse(d.deviationPct)} fallback="No estimate" />
        <InfoTip
          explanation={{
            title: 'Should have used',
            text: 'Worked out from how this truck burns diesel for the same kind of driving: distance, time standing with the engine on, and speed.',
            lines: [
              ['Used', formatLitres(d.actualL)],
              ['Should use', formatLitres(d.expectedL)],
              ['Difference', `${signed(d.deviationL, ' L')} (${signed(d.deviationPct, '%')})`],
              ['Hours counted', `${d.scored} of ${d.windows}`],
              ['Estimate from', d.source || '—'],
            ],
          }}
        />
      </span>
    ),
  },
];

/**
 * GET /api/fuel-model/expected — diesel a truck used each day against what that
 * driving should have needed (fuelModel flag, OWNER/MANAGER). No estimate yet
 * shows as "—", never as zero.
 */
export default function ExpectedFuelView({ range }) {
  const [vehicleId, setVehicleId] = useState('');
  const vehicles = useApi((signal) => MileageApi.vehicles(signal), []);
  const result = useApi(
    (signal) => MileageApi.expected(range, vehicleId, signal),
    [vehicleId, range.from, range.to],
    { enabled: Boolean(vehicleId) },
  );

  const list = (Array.isArray(vehicles.data?.data) ? vehicles.data.data : [])
    .filter((v) => v._id && v.registrationNumber)
    .sort((a, b) => a.registrationNumber.localeCompare(b.registrationNumber));
  const selected = list.find((v) => v._id === vehicleId);
  const days = vehicleId ? dailyRollup(result.data?.windows || []) : [];

  return (
    <div className="mhub">
      <FilterBar
        right={
          <div className="date-input-group">
            <label htmlFor="expected-truck">Truck</label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger id="expected-truck" className="h-9 w-[260px] text-sm">
                <SelectValue>
                  {selected
                    ? `${selected.registrationNumber}${selected.model ? ` · ${selected.model}` : ''}`
                    : 'Choose a truck'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {list.map((v) => (
                  <SelectItem key={v._id} value={v._id}>
                    {v.registrationNumber}
                    {v.model ? ` · ${v.model}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={days}
        rowKey={(d) => d.day}
        loading={Boolean(vehicleId) && result.loading && !result.data}
        error={result.error}
        onRetry={result.refetch}
        showing={days.length}
        total={days.length}
        emptyTitle={vehicleId ? 'No driving for this truck in these dates' : 'Choose a truck'}
        emptyHint={
          vehicleId
            ? 'Pick a wider date range.'
            : 'See the diesel it used each day against what it should have used.'
        }
      />
    </div>
  );
}
